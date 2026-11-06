import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { freshSession, restoreSession, migrateV1, migrateV2, migrateV3 } from '../../tools/metal-activity-desk/session.mjs';
import { freshSession as freshV2 } from '../../tools/metal-activity-desk/inquiry.mjs';
import { freshAcid, observeAcid } from '../../tools/metal-activity-desk/acid.mjs';
import { freshReview } from '../../tools/metal-activity-desk/review.mjs';
import { resetSavedSession } from '../../tools/metal-activity-desk/storage.mjs';

const app = await readFile(new URL('../../tools/metal-activity-desk/app.mjs', import.meta.url), 'utf8');
const CURRENT = 'bhcs-metal-inquiry-v4';
const LEGACY = ['bhcs-metal-inquiry-v3', 'bhcs-metal-inquiry-v2', 'bhcs-metal-desk-preview-v1'];
const encode = value => JSON.stringify(value);
const version2 = () => ({ ...freshV2(),
  cups: [
    { metal: 'Zn', phase: 'done', progress: 1, recordId: 'r1' },
    ...freshV2().cups.slice(1),
  ],
  records: [{ id: 'r1', metal: 'Zn', solution: 'CuSO4', kind: 'base' }],
  connections: { ZnCu: 'r1' }, nextId: 2, journeyOpen: true,
});
const version3 = () => ({ ...version2(), version: 3,
  lesson: { ...observeAcid(freshAcid(), 'Zn'), electronOpen: true, electronStep: 2, pauseAnimation: true },
});
const version4 = () => {
  const state = migrateV3(encode(version3()));
  state.review.open = true;
  state.review.answers.origin = { recordId: 'r1', donor: 'Zn', acceptor: 'Cu2', deposit: 'Cu', checked: true };
  return state;
};
function memoryStorage(entries = [], { setFails = false, getFails = [] } = {}) {
  const values = new Map(entries), calls = [];
  return {
    values, calls,
    getItem(key) {
      calls.push(['get', key]);
      if (getFails.includes(key)) throw Error('storage unavailable');
      return values.get(key) ?? null;
    },
    setItem(key, raw) {
      calls.push(['set', key, raw]);
      if (setFails) throw Error('quota exceeded');
      values.set(key, String(raw));
    },
    removeItem(key) { calls.push(['remove', key]); values.delete(key); },
  };
}

// Exercise the real app loader, save guard and storage listener without a DOM.
// Extraction stays narrow: this is an integration check, not a copied loader.
function appStorage(storage, { writable = true } = {}) {
  const keyDeclaration = app.match(/^const STORAGE=.*$/m)?.[0];
  const load = app.match(/^function loadSaved\(\).*$/m)?.[0];
  const save = app.match(/^function save\(\).*$/m)?.[0];
  const listener = app.match(/^window\.addEventListener\('storage',.*$/m)?.[0];
  const resetConfig = app.match(/resetSavedSession\(localStorage,next,(\{[^}]*\})\)/)?.[1];
  assert.ok(keyDeclaration && load && save && listener && resetConfig);
  const nodes = new Map(), events = { suspended: 0, cleared: 0, rendered: 0 };
  const lock = { writable };
  const context = {
    localStorage: storage, freshSession, restoreSession, migrateV1, migrateV2, migrateV3,
    resetSavedSession, sessionLock: lock,
    $: selector => { if (!nodes.has(selector)) nodes.set(selector, { textContent: '' }); return nodes.get(selector); },
    window: { addEventListener: (name, callback) => { assert.equal(name, 'storage'); context.onStorage = callback; } },
    acidView: { resetView() {} }, reviewView: { resetView() {} },
    clearTransient: () => { events.cleared++; }, render: () => { events.rendered++; },
    suspendSession: () => { events.suspended++; lock.writable = false; },
  };
  runInNewContext(`
    ${keyDeclaration}
    let state, expectedRaw = null, dataIssue = false, saveAvailable = true;
    const saveDescription = 'browser-local';
    function canEdit() { return sessionLock.writable && !dataIssue; }
    ${load}
    ${save}
    ${listener}
    globalThis.api = {
      loadSaved, save,
      get state() { return state; },
      get expectedRaw() { return expectedRaw; },
      get dataIssue() { return dataIssue; },
      get saveAvailable() { return saveAvailable; },
      reset() { const next = freshSession(); return resetSavedSession(localStorage,next,${resetConfig}); },
    };
  `, context);
  return { api: context.api, nodes, events, lock, event: event => context.onStorage(event) };
}

test('the app uses a V4 key and explicitly shares that name with its writer lock', () => {
  assert.match(app, /const STORAGE='bhcs-metal-inquiry-v4'/);
  assert.match(app, /createSessionLock\(\{name:STORAGE,/);
  assert.doesNotMatch(app, /localStorage\.clear\(/);
});

test('app migrates V3 first, saves V4, and retains all original legacy bytes', () => {
  const v3 = encode(version3()), v2 = encode(version2()), v1 = encode({ version: 1, cups: freshV2().cups });
  const storage = memoryStorage(LEGACY.map((key, index) => [key, [v3, v2, v1][index]]));
  const { api, nodes } = appStorage(storage);
  api.loadSaved();
  assert.deepEqual(api.state, migrateV3(v3));
  assert.equal(api.expectedRaw, null);
  assert.equal(api.dataIssue, false);
  assert.match(nodes.get('#notice').textContent, /其他舊版分頁.*重新整理/);
  assert.equal(api.save(), true);
  assert.deepEqual(restoreSession(storage.values.get(CURRENT)), migrateV3(v3));
  for (const [key, raw] of LEGACY.map((key, index) => [key, [v3, v2, v1][index]])) assert.equal(storage.values.get(key), raw);
  assert.deepEqual(storage.calls.map(([kind, key]) => [kind, key]), [
    ['get', CURRENT], ['get', LEGACY[0]], ['get', CURRENT], ['set', CURRENT],
  ]);
});

test('app supports V2 and V1 source migration straight to V4 with blank review', () => {
  for (const [key, original, migrate] of [
    [LEGACY[1], version2(), migrateV2],
    [LEGACY[2], { version: 1, cups: [{ metal: 'Cu', phase: 'done', progress: 1 }, ...freshV2().cups.slice(1)] }, migrateV1],
  ]) {
    const raw = encode(original), storage = memoryStorage([[key, raw]]), { api } = appStorage(storage);
    api.loadSaved();
    assert.deepEqual(api.state, migrate(raw));
    assert.deepEqual(api.state.review, freshReview());
    assert.equal(api.save(), true);
    assert.equal(JSON.parse(storage.values.get(CURRENT)).version, 4);
    assert.equal(storage.values.get(key), raw);
  }
});

test('existing V4 wins without even reading old keys or merging newer legacy writes', () => {
  const original = version4(), raw = encode(original);
  const storage = memoryStorage([[CURRENT, raw], [LEGACY[0], encode(version3())]], { getFails: LEGACY });
  const { api } = appStorage(storage);
  api.loadSaved();
  assert.equal(api.saveAvailable, true);
  assert.deepEqual(api.state, original);
  storage.values.set(LEGACY[0], '{invalid late legacy write');
  api.loadSaved();
  assert.deepEqual(api.state, original);
  assert.equal(api.save(), true);
  assert.equal(storage.values.get(LEGACY[0]), '{invalid late legacy write');
  assert.ok(storage.calls.every(([, key]) => key === CURRENT));
});

test('old V3 storage events cannot reload, overwrite, suspend or merge a V4 session', () => {
  const raw = encode(version4()), storage = memoryStorage([[CURRENT, raw]]);
  const { api, event, events } = appStorage(storage);
  api.loadSaved();
  const before = structuredClone(api.state), count = storage.calls.length;
  storage.values.set(LEGACY[0], encode(version3()));
  event({ key: LEGACY[0], newValue: storage.values.get(LEGACY[0]) });
  assert.deepEqual(api.state, before);
  assert.deepEqual(events, { suspended: 0, cleared: 0, rendered: 0 });
  assert.equal(storage.calls.length, count);
  assert.equal(api.save(), true);
  assert.deepEqual(restoreSession(storage.values.get(CURRENT)), before);
});

test('V4 changes still suspend a writer and reload the current snapshot in a read-only tab', () => {
  for (const writable of [true, false]) {
    const storage = memoryStorage([[CURRENT, encode(version4())]]);
    const { api, event, events } = appStorage(storage, { writable });
    api.loadSaved();
    const next = freshSession(), raw = encode(next); storage.values.set(CURRENT, raw);
    event({ key: CURRENT, newValue: raw });
    assert.equal(events.suspended, writable ? 1 : 0);
    if (!writable) {
      assert.deepEqual(api.state, next);
      assert.equal(api.expectedRaw, raw);
      assert.equal(events.cleared, 1);
      assert.equal(events.rendered, 1);
    }
  }
});

test('corrupt newest source is protected, never silently replaced from a valid older backup', () => {
  for (const corruptKey of [CURRENT, LEGACY[0]]) {
    const storage = memoryStorage([[corruptKey, '{corrupt'], [LEGACY[1], encode(version2())]]);
    const before = [...storage.values], { api } = appStorage(storage);
    api.loadSaved();
    assert.equal(api.dataIssue, true);
    assert.equal(api.save(), false);
    assert.deepEqual([...storage.values], before);
    assert.ok(storage.calls.every(([kind]) => kind === 'get'));
    assert.ok(!storage.calls.some(([, key]) => key === LEGACY[1]));
  }
});

test('a failed migration write leaves the old source intact and does not create V4', () => {
  const raw = encode(version3()), storage = memoryStorage([[LEGACY[0], raw]], { setFails: true });
  const { api } = appStorage(storage);
  api.loadSaved();
  assert.equal(api.save(), false);
  assert.equal(api.saveAvailable, false);
  assert.deepEqual([...storage.values], [[LEGACY[0], raw]]);
  assert.deepEqual(api.state, migrateV3(raw));
  assert.ok(!storage.calls.some(([kind]) => kind === 'remove'));
});

test('app reset config writes empty V4 first, clears exactly three backups, and prevents resurrection', () => {
  const storage = memoryStorage([[CURRENT, encode(version4())], ...LEGACY.map(key => [key, 'backup']), ['unrelated', 'keep']]);
  const { api } = appStorage(storage); api.loadSaved(); storage.calls.length = 0;
  const result = api.reset();
  assert.equal(result.ok, true);
  assert.deepEqual(storage.calls.map(([kind, key]) => [kind, key]), [
    ['get', CURRENT], ['set', CURRENT], ...LEGACY.map(key => ['remove', key]),
  ]);
  assert.deepEqual(restoreSession(storage.values.get(CURRENT)), freshSession());
  assert.equal(storage.values.get('unrelated'), 'keep');
  storage.values.set(LEGACY[0], encode(version3()));
  api.loadSaved();
  assert.deepEqual(api.state, freshSession(), 'late old-tab writes cannot resurrect cleared records');
});

test('app reset write failure retains submitted review plus every legacy backup', () => {
  const raw = encode(version4()), storage = memoryStorage([[CURRENT, raw], ...LEGACY.map(key => [key, 'backup'])], { setFails: true });
  const before = [...storage.values], { api } = appStorage(storage); api.loadSaved();
  assert.equal(api.reset().ok, false);
  assert.deepEqual([...storage.values], before);
  assert.ok(!storage.calls.some(([kind]) => kind === 'remove'));
  assert.deepEqual(api.state.review, version4().review);
});
