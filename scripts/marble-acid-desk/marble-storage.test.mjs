import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorageDriver, STORAGE_KEY, MAX_BYTES } from '../../tools/science/reaction-rate-desk/storage.mjs';
const payload = n => ({ version: 1, trials: Array.from({ length: n }, (_, i) => ({ id: 'trial-' + i })) });
function validate(p) { return p?.version === 1 && Array.isArray(p.trials) && p.trials.length <= 30; }
function memory(initial = {}) {
  const map = new Map(Object.entries(initial));
  return { map, writes: 0, removes: 0, failRead: false, failWrite: false, failClear: false,
    getItem(k) { if (this.failRead) throw Error('read'); return this.map.get(k) ?? null; },
    setItem(k, v) { if (this.failWrite) throw Error('quota'); this.writes++; this.map.set(k, v); },
    removeItem(k) { if (this.failClear) throw Error('clear'); this.removes++; this.map.delete(k); }
  };
}
function mutex() {
  let tail = Promise.resolve();
  return { request(name, options, fn) { assert.equal(name, STORAGE_KEY + ':lock'); assert.equal(options.mode, 'exclusive'); const job = tail.then(fn); tail = job.catch(() => {}); return job; } };
}
const make = (storage, options = {}) => createStorageDriver({ storage, locks: mutex(), validate, ...options });
test('own-key save, revision, idempotent retry and restore', async () => {
  const s = memory({ 'unrelated': 'keep' }), d = make(s);
  assert.deepEqual((await d.load()).payload, null);
  const first = await d.save(payload(1)); assert.equal(first.ok, true); assert.equal(first.revision, 1);
  assert.equal(first.fingerprint, JSON.stringify(payload(1)));
  assert.equal((await d.save(payload(1))).revision, 1); assert.equal(s.writes, 1);
  await d.save(payload(2)); assert.equal(d.status.revision, 2);
  const restored = make(s); assert.deepEqual((await restored.load()).payload, payload(2));
  assert.equal(s.map.get('unrelated'), 'keep');
});
test('save snapshots are cloned before entering the async queue', async () => {
  const s = memory(), d = make(s), p = payload(1); await d.load();
  const promise = d.save(p); p.trials.push({ id: 'not-saved' }); await promise;
  assert.deepEqual(JSON.parse(s.getItem(STORAGE_KEY)).payload, payload(1));
});
test('normalizing validator persists normalized data, throws and false fail closed', async () => {
  const s = memory(), d = make(s, { validate: p => ({ version: p.version, trials: p.trials }) });
  await d.load(); await d.save({ ...payload(1), untrusted: true });
  assert.equal(Object.hasOwn(JSON.parse(s.getItem(STORAGE_KEY)).payload, 'untrusted'), false);
  assert.equal((await make(memory()).save({ version: 9 })).ok, false);
  assert.equal((await make(memory(), { validate() { throw Error('bad'); } }).save(payload(1))).ok, false);
});
test('no locks restore valid existing data but never write or clear', async () => {
  const s = memory(); await make(s).save(payload(1)); const original = s.getItem(STORAGE_KEY), d = make(s, { locks: null });
  const load = await d.load(); assert.equal(load.mode, 'memory-only'); assert.deepEqual(load.payload, payload(1));
  assert.equal((await d.save(payload(2))).ok, false); assert.equal((await d.clear()).ok, false);
  assert.equal(s.getItem(STORAGE_KEY), original); assert.equal(s.writes, 1); assert.equal(s.removes, 0);
});
test('no lock fresh storage and rejected lock fail closed without unlocked fallback', async () => {
  for (const locks of [null, { request: async () => { throw Error('denied'); } }]) {
    const s = memory(), d = make(s, { locks }); await d.load();
    assert.equal((await d.save(payload(1))).ok, false); assert.equal(s.writes, 0);
    assert.equal((await d.clear()).ok, false); assert.equal(s.removes, 0);
  }
});
test('corrupt/future/oversized data quarantined and exact raw downloadable', async () => {
  const raws = [' invalid original\n', JSON.stringify({ format: 'bhcs.marbleAcidDesk.storage', version: 2, revision: 1, payload: payload(1) }), '漢'.repeat(MAX_BYTES)];
  for (const raw of raws) {
    const s = memory({ [STORAGE_KEY]: raw }), d = make(s);
    assert.equal((await d.load()).ok, false); assert.equal(d.status.mode, 'quarantined');
    assert.equal(d.canBackupRaw, true); assert.equal(d.backupRaw(), raw);
    assert.equal((await d.save(payload(1))).ok, false); assert.equal(s.writes, 0);
    assert.equal((await d.clear()).ok, true); assert.equal(s.getItem(STORAGE_KEY), null);
    assert.equal(d.canBackupRaw, false); assert.equal((await d.save(payload(1))).ok, true);
  }
});
test('external storage event invalidates saved identity and prevents stale retry', async () => {
  const s = memory(), locks = mutex(), a = make(s, { locks }), b = make(s, { locks });
  await a.save(payload(1)); await b.load(); await b.save(payload(2));
  assert.equal(a.handleExternalChange({ key: 'other', storageArea: s }), false);
  assert.equal(a.handleExternalChange({ key: STORAGE_KEY, storageArea: s }), true);
  assert.equal(a.status.mode, 'conflict'); assert.equal(a.status.savedFingerprint, null);
  assert.equal((await a.save(payload(1))).ok, false);
  assert.deepEqual(JSON.parse(a.backupRaw()).payload, payload(2));
  assert.deepEqual(JSON.parse(s.getItem(STORAGE_KEY)).payload, payload(2));
});
test('lock-internal reread catches concurrent tab even without event delivery', async () => {
  const s = memory(), locks = mutex(), a = make(s, { locks }), b = make(s, { locks });
  await a.load(); await b.load();
  const results = await Promise.all([a.save(payload(1)), b.save(payload(2))]);
  assert.equal(results.filter(r => r.ok).length, 1); assert.equal(results.filter(r => r.reason === 'conflict').length, 1);
  assert.equal(s.writes, 1);
});
test('storage clear event is detected and stale snapshot cannot resurrect data', async () => {
  const s = memory(), d = make(s); await d.save(payload(1)); s.map.delete(STORAGE_KEY);
  d.handleExternalChange({ key: null, storageArea: s });
  assert.equal((await d.save(payload(1))).ok, false); assert.equal(s.getItem(STORAGE_KEY), null);
});
test('read failures protect unknown original data, including prewrite reread', async () => {
  const s = memory({ [STORAGE_KEY]: 'protected' }); s.failRead = true; const d = make(s);
  assert.equal((await d.load()).ok, false); s.failRead = false;
  assert.equal((await d.save(payload(1))).ok, false); assert.equal((await d.clear()).ok, false);
  assert.equal(s.getItem(STORAGE_KEY), 'protected');
  const s2 = memory(), d2 = make(s2); await d2.load(); s2.failRead = true;
  assert.equal((await d2.save(payload(1))).ok, false); assert.equal(s2.writes, 0);
});
test('quota failure is recoverable without pretending saved or mutating payload', async () => {
  const s = memory(), d = make(s); await d.load(); s.failWrite = true;
  assert.equal((await d.save(payload(1))).ok, false); assert.equal(d.status.mode, 'write-error'); assert.equal(d.status.savedFingerprint, null);
  s.failWrite = false; assert.equal((await d.save(payload(1))).ok, true); assert.equal(s.writes, 1);
});
test('failed clear preserves old data; quarantine remains protected despite error mode', async () => {
  for (const raw of ['invalid original', null]) {
    const s = memory(raw === null ? {} : { [STORAGE_KEY]: raw }), d = make(s); await d.load();
    if (raw === null) await d.save(payload(1)); const before = s.getItem(STORAGE_KEY);
    s.failClear = true; assert.equal((await d.clear()).ok, false); assert.equal(s.getItem(STORAGE_KEY), before);
    if (raw !== null) { assert.equal((await d.save(payload(2))).ok, false); assert.equal(d.backupRaw(), raw); }
    s.failClear = false; assert.equal((await d.clear()).ok, true); assert.equal(s.getItem(STORAGE_KEY), null);
  }
});
test('clear cancels queued and waiting-lock saves; new writes during reset rejected', async () => {
  let release; const held = new Promise(r => { release = r; });
  const s = memory(), locks = { request: async (_n, _o, fn) => { await held; return fn(); } }, d = make(s, { locks });
  await d.load(); const p1 = d.save(payload(1)), p2 = d.save(payload(2));
  await Promise.resolve(); await Promise.resolve();
  const clearing = d.clear(); assert.equal((await d.save(payload(3))).reason, 'reset-pending');
  release(); const results = await Promise.all([p1, p2, clearing]);
  assert.equal(results[0].ok, false); assert.equal(results[1].ok, false); assert.equal(results[2].ok, true);
  assert.equal(s.getItem(STORAGE_KEY), null); assert.equal(s.writes, 0);
  assert.equal((await d.save(payload(1))).ok, true);
});
test('reset does not clear unseen newer external version; explicit retry may clear backed-up known version', async () => {
  const s = memory(), locks = mutex(), a = make(s, { locks }), b = make(s, { locks });
  await a.save(payload(1)); await b.load(); await b.save(payload(2));
  assert.equal((await a.clear()).ok, false); assert.deepEqual(JSON.parse(a.backupRaw()).payload, payload(2));
  assert.equal((await a.clear()).ok, true); assert.equal(s.getItem(STORAGE_KEY), null);
});
test('byte capacity includes UTF-8 and envelope; overflow never writes', async () => {
  const s = memory(), d = make(s, { validate: () => true }); await d.load();
  assert.equal((await d.save({ text: '漢'.repeat(MAX_BYTES / 2) })).ok, false); assert.equal(s.writes, 0);
  assert.equal((await d.save({ text: 'a'.repeat(MAX_BYTES - 20) })).ok, false); assert.equal(s.writes, 0);
});
test('status callbacks cannot break persistence and pending counter reaches zero', async () => {
  const d = make(memory(), { onStatus() { throw Error('UI callback'); } });
  const promises = [d.save(payload(1)), d.save(payload(2))]; assert.equal(d.status.pending, 2);
  assert.equal((await Promise.all(promises)).every(x => x.ok), true); assert.equal(d.status.pending, 0);
});

test('marble key is isolated: old arbitrary raw is never imported, overwritten or removed', async () => {
  assert.equal(STORAGE_KEY, 'bhcs.marbleAcidDesk.v1');
  const oldKey = 'bhcs.reactionRateDesk.v1';
  for (const raw of [' untouched original\n', JSON.stringify({ format: 'bhcs.reactionRateDesk.storage', version: 1, revision: 8, payload: payload(3) })]) {
    const s = memory({ [oldKey]: raw }), d = make(s);
    assert.equal((await d.load()).payload, null);
    assert.equal(d.backupRaw(), null, 'new driver does not claim old records as its backup');
    assert.equal((await d.save(payload(1))).ok, true);
    assert.equal(s.getItem(oldKey), raw);
    assert.equal(JSON.parse(s.getItem(STORAGE_KEY)).format, 'bhcs.marbleAcidDesk.storage');
    assert.equal((await d.clear()).ok, true);
    assert.equal(s.getItem(oldKey), raw);
    assert.equal(s.getItem(STORAGE_KEY), null);
    assert.equal(d.handleExternalChange({ key: oldKey, storageArea: s }), false);
  }
});

test('old reaction format at new key is quarantined, never imported as marble data', async () => {
  const raw = JSON.stringify({ format: 'bhcs.reactionRateDesk.storage', version: 1, revision: 1, payload: payload(2) });
  const s = memory({ [STORAGE_KEY]: raw }), d = make(s);
  const loaded = await d.load();
  assert.equal(loaded.ok, false);
  assert.equal(loaded.payload, null);
  assert.equal(d.status.mode, 'quarantined');
  assert.equal(d.backupRaw(), raw);
  assert.equal((await d.save(payload(1))).ok, false);
  assert.equal(s.getItem(STORAGE_KEY), raw);
});

test('marble driver inverse namespace transform reproduces legacy source exact SHA-256', async () => {
  const { readFile } = await import('node:fs/promises');
  const { createHash } = await import('node:crypto');
  const actual = await readFile(new URL('../../tools/science/reaction-rate-desk/storage.mjs', import.meta.url), 'utf8');
  const original = await readFile(new URL('./legacy-fixture/storage.mjs', import.meta.url), 'utf8');
  assert.equal(actual.split("'bhcs.marbleAcidDesk.v1'").length - 1, 1);
  assert.equal(actual.split("'bhcs.marbleAcidDesk.storage'").length - 1, 1);
  const reversed = actual.replace("'bhcs.marbleAcidDesk.v1'", "'bhcs.reactionRateDesk.v1'").replace("'bhcs.marbleAcidDesk.storage'", "'bhcs.reactionRateDesk.storage'");
  assert.equal(reversed, original);
  const hash = value => createHash('sha256').update(value).digest('hex');
  assert.equal(hash(reversed), hash(original));
});
