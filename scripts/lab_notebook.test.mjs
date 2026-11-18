import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { openNotebook } from '../tools/lab/shared/notebook.mjs';

const OLD = 'legacy-station-a';
const OTHER = 'legacy-station-b';
const record = stage => ({ stage, observations: ['synthetic'] });
function setup(entries = {}) {
  const data = new Map(Object.entries(entries).map(([k, v]) => [k, JSON.stringify(v)]));
  const indexedDB = new IDBFactory();
  const legacy = {
    read: 0,
    getItem(k) { this.read++; return data.get(k) ?? null; },
    setItem(k, v) { data.set(k, v); },
  };
  return {
    legacy, indexedDB,
    open(key = OLD, warnings = []) { return openNotebook(key, { indexedDB, localStorage: legacy, warn: (msg, code) => warnings.push([msg, code]) }); },
  };
}

test('imports the exact legacy snapshot only once and does not mutate caller or old-key state', async () => {
  const env = setup({ [OLD]: record(1) });
  const [a, b] = await Promise.all([env.open(), env.open()]);
  assert.deepEqual(a.load(), record(1));
  assert.deepEqual(b.load(), record(1));
  assert.equal(env.legacy.read, 1);
  const value = record(2);
  const saving = a.save(value);
  value.observations.push('later mutation');
  assert.equal(await saving, true);
  const loaded = a.load();
  loaded.observations.push('separate mutation');
  assert.deepEqual((await env.open()).load(), record(2));
  assert.equal(env.legacy.getItem(OLD), JSON.stringify(record(1)));
});

test('concurrent updated tabs cannot overwrite a winner; stale clear and retries are rejected', async () => {
  const env = setup();
  const wa = [], wb = [];
  const [a, b] = await Promise.all([env.open(OLD, wa), env.open(OLD, wb)]);
  const result = await Promise.all([a.save(record(1)), b.save(record(2))]);
  assert.equal(result.filter(Boolean).length, 1);
  const [, loser, warnings] = result[0] ? [a, b, wb] : [b, a, wa];
  const winningValue = result[0] ? record(1) : record(2);
  assert.equal(await loser.save(record(3)), false);
  assert.equal(await loser.clear(), false);
  assert.equal(warnings.at(-1)[1], 'conflict');
  assert.match(warnings.at(-1)[0], /沒有清空/);
  assert.deepEqual((await env.open()).load(), winningValue);
});

test('clear is isolated, fences old tabs, and survives legacy writers on the old key', async () => {
  const env = setup({ [OLD]: record(1), [OTHER]: record(4) });
  const stale = await env.open();
  const owner = await env.open();
  const other = await env.open(OTHER);
  assert.equal(await owner.save(record(2)), true);
  env.legacy.setItem(OLD, JSON.stringify(record(9))); // Simulates old code before reset.
  assert.deepEqual((await env.open()).load(), record(2));
  const clearing = owner.clear();
  assert.equal(await owner.save(record(3)), false);
  assert.equal(await clearing, true);
  assert.equal(await stale.save(record(7)), false);
  assert.equal(owner.load(), null);
  env.legacy.setItem(OLD, JSON.stringify(record(10))); // Simulates old pagehide/BFCache.
  assert.equal((await env.open()).load(), null);
  assert.deepEqual(other.load(), record(4));
  assert.deepEqual((await env.open(OTHER)).load(), record(4));
  assert.equal(env.legacy.getItem(OLD), JSON.stringify(record(10)));
  assert.equal(await owner.save(record(11)), true, 'the page that cleared can start fresh');
  assert.deepEqual((await env.open()).load(), record(11));
});

test('a no-op save leaves the revision unchanged while ordered real writes retain the last snapshot', async () => {
  const env = setup({ [OLD]: record(1) });
  const a = await env.open(), b = await env.open();
  assert.equal(await a.save(record(1)), true);
  assert.deepEqual(await Promise.all([b.save(record(2)), b.save(record(3))]), [true, true]);
  assert.deepEqual((await env.open()).load(), record(3));
});

test('failed writes and denied reset never claim success; writable retry uses same revision', async t => {
  const env = setup();
  const warnings = [];
  const a = await env.open(OLD, warnings);
  assert.equal(await a.save(record(1)), true);
  t.mock.method(IDBObjectStore.prototype, 'put', () => { throw Error('denied'); });
  assert.equal(await a.save(record(2)), false);
  assert.equal(warnings.at(-1)[1], 'save');
  assert.equal(await a.clear(), false);
  assert.equal(warnings.at(-1)[1], 'clear');
  assert.deepEqual(a.load(), record(1));
  assert.deepEqual((await env.open()).load(), record(1));
  t.mock.restoreAll();
  assert.equal(await a.save(record(2)), true);
  assert.equal(warnings.at(-1)[1], 'ok');
  assert.deepEqual((await env.open()).load(), record(2));
});

test('unavailable transactional open does not expose or overwrite a pre-reset old snapshot', async () => {
  const env = setup({ [OLD]: record(1) });
  const a = await env.open();
  assert.equal(await a.clear(), true);
  const warnings = [];
  const unavailable = await openNotebook(OLD, {
    indexedDB: { open() { throw Error('denied'); } }, localStorage: env.legacy,
    warn: (msg, code) => warnings.push([msg, code]),
  });
  assert.equal(warnings[0][1], 'unavailable');
  assert.equal(unavailable.load(), null);
  assert.equal(await unavailable.save(record(9)), false);
  assert.equal(await unavailable.clear(), false);
  assert.equal(warnings.at(-1)[1], 'clear');
  assert.equal(env.legacy.getItem(OLD), JSON.stringify(record(1)));
  assert.equal((await env.open()).load(), null);
});

test('legacy-read denial or malformed legacy does not seed or overwrite records', async () => {
  for (const deny of [true, false]) {
    const env = setup();
    env.legacy.setItem(OLD, 'unparseable');
    const warnings = [];
    const a = await openNotebook(OLD, {
      indexedDB: env.indexedDB,
      localStorage: { getItem() { if (deny) throw Error('denied'); return 'unparseable'; } },
      warn: (msg, code) => warnings.push([msg, code]),
    });
    assert.equal(warnings[0][1], 'unavailable');
    assert.equal(await a.save(record(5)), false);
    assert.equal(env.legacy.getItem(OLD), 'unparseable');
    env.legacy.setItem(OLD, JSON.stringify(record(7)));
    assert.deepEqual((await env.open()).load(), record(7), 'a later successful read can import');
  }
});
