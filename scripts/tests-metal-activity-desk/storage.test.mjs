import test from 'node:test';
import assert from 'node:assert/strict';
import { resetSavedSession } from '../../tools/metal-activity-desk/storage.mjs';

const CURRENT = 'bhcs-metal-inquiry-v4';
const LEGACY = ['bhcs-metal-inquiry-v3', 'bhcs-metal-inquiry-v2', 'bhcs-metal-desk-preview-v1'];
const backups = LEGACY.map((key, index) => [key, `V${3 - index} backup`]);
const OLD = '{"version":4,"records":["old"]}';
const NEXT = { version: 4, records: [], review: { version: 1, open: false } };
const options = overrides => ({ currentKey: CURRENT, legacyKeys: LEGACY, expectedRaw: OLD, ...overrides });

function memoryStorage({ getFails = false, setFails = false, removeFails = [] } = {}) {
  const values = new Map([[CURRENT, OLD], ...backups]);
  const calls = [];
  return {
    values,
    calls,
    getItem(key) {
      calls.push(['get', key]);
      if (getFails) throw new Error('SecurityError');
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      calls.push(['set', key, value]);
      // Match localStorage: a failed setItem leaves the old value unchanged.
      if (setFails) throw new Error('QuotaExceededError');
      values.set(key, String(value));
    },
    removeItem(key) {
      calls.push(['remove', key]);
      if (removeFails.includes(key)) throw new Error('SecurityError');
      values.delete(key);
    },
  };
}

test('reset persists the current snapshot before clearing all V3, V2 and V1 backups', () => {
  const storage = memoryStorage();
  const raw = JSON.stringify(NEXT);
  assert.deepEqual(resetSavedSession(storage, NEXT, options()), { ok: true, legacyCleared: true, raw });
  assert.deepEqual(storage.calls, [
    ['get', CURRENT], ['set', CURRENT, raw], ...LEGACY.map(key => ['remove', key]),
  ]);
  assert.deepEqual([...storage.values], [[CURRENT, raw]]);
});

test('blocked or absent storage fails without throwing or attempting cleanup', () => {
  for (const storage of [null, undefined, {}, { getItem() { throw new Error('blocked'); } }]) {
    assert.deepEqual(resetSavedSession(storage, NEXT, options()), { ok: false, reason: 'unavailable' });
  }
});

test('a read exception preserves current data and all backups', () => {
  const storage = memoryStorage({ getFails: true });
  const before = [...storage.values];
  assert.deepEqual(resetSavedSession(storage, NEXT, options()), { ok: false, reason: 'unavailable' });
  assert.deepEqual([...storage.values], before);
  assert.deepEqual(storage.calls, [['get', CURRENT]]);
});

test('a failed atomic write preserves current data and all three legacy backups', () => {
  const storage = memoryStorage({ setFails: true });
  const before = [...storage.values];
  assert.deepEqual(resetSavedSession(storage, NEXT, options()), { ok: false, reason: 'unavailable' });
  assert.deepEqual([...storage.values], before);
  assert.deepEqual(storage.calls, [['get', CURRENT], ['set', CURRENT, JSON.stringify(NEXT)]]);
});

test('changed, newly created, or removed current data refuses a stale reset', () => {
  for (const [actual, expectedRaw] of [['newer snapshot', OLD], [OLD, null], [null, OLD], ['', null]]) {
    const storage = memoryStorage();
    if (actual === null) storage.values.delete(CURRENT);
    else storage.values.set(CURRENT, actual);
    const before = [...storage.values];
    assert.deepEqual(resetSavedSession(storage, NEXT, options({ expectedRaw })), { ok: false, reason: 'changed' });
    assert.deepEqual([...storage.values], before);
    assert.deepEqual(storage.calls, [['get', CURRENT]]);
  }
});

test('expectedRaw is compared exactly, without JSON normalization or coercion', () => {
  const storage = memoryStorage();
  for (const expectedRaw of [{ toString: () => OLD }, new String(OLD), OLD + ' ', undefined]) {
    assert.deepEqual(resetSavedSession(storage, NEXT, options({ expectedRaw })), { ok: false, reason: 'changed' });
  }
  assert.ok(storage.calls.every(([kind]) => kind === 'get'));
  assert.equal(storage.values.get(CURRENT), OLD);
});

test('expected null can create a fresh current snapshot when no current key exists', () => {
  const storage = memoryStorage();
  storage.values.delete(CURRENT);
  const raw = JSON.stringify(NEXT);
  assert.deepEqual(resetSavedSession(storage, NEXT, options({ expectedRaw: null })), { ok: true, legacyCleared: true, raw });
  assert.deepEqual([...storage.values], [[CURRENT, raw]]);
});

test('failed creation leaves a missing current key and all three legacy backups intact', () => {
  const storage = memoryStorage({ setFails: true });
  storage.values.delete(CURRENT);
  const before = [...storage.values];
  assert.deepEqual(resetSavedSession(storage, NEXT, options({ expectedRaw: null })), { ok: false, reason: 'unavailable' });
  assert.deepEqual([...storage.values], before);
});

test('legacy cleanup failure reports partial cleanup without undoing a successful reset', () => {
  const storage = memoryStorage({ removeFails: [LEGACY[0]] });
  const raw = JSON.stringify(NEXT);
  assert.deepEqual(resetSavedSession(storage, NEXT, options()), { ok: true, legacyCleared: false, raw });
  assert.equal(storage.values.get(CURRENT), raw, 'current snapshot prevents restoring the remaining legacy backup');
  assert.equal(storage.values.get(LEGACY[0]), 'V3 backup');
  assert.equal(storage.values.has(LEGACY[1]), false, 'independent cleanup can still succeed');
  assert.deepEqual(storage.calls.map(([kind]) => kind), ['get', 'set', 'remove', 'remove', 'remove']);
  assert.equal(storage.values.has(LEGACY[2]), false);
});

test('all legacy cleanup failures retain the successful current snapshot', () => {
  const storage = memoryStorage({ removeFails: LEGACY });
  const raw = JSON.stringify(NEXT);
  assert.deepEqual(resetSavedSession(storage, NEXT, options()), { ok: true, legacyCleared: false, raw });
  assert.equal(storage.values.get(CURRENT), raw);
  assert.equal(storage.values.get(LEGACY[0]), 'V3 backup');
  assert.equal(storage.values.get(LEGACY[1]), 'V2 backup');
  assert.equal(storage.values.get(LEGACY[2]), 'V1 backup');
});

test('default empty legacy list does not remove unrelated data', () => {
  const storage = memoryStorage();
  assert.deepEqual(resetSavedSession(storage, NEXT, { currentKey: CURRENT, expectedRaw: OLD }), {
    ok: true, legacyCleared: true, raw: JSON.stringify(NEXT),
  });
  assert.equal(storage.values.get(LEGACY[0]), 'V3 backup');
  assert.equal(storage.values.get(LEGACY[1]), 'V2 backup');
  assert.equal(storage.values.get(LEGACY[2]), 'V1 backup');
  assert.equal(storage.calls.length, 2);
});

test('a duplicate or accidentally included current key cannot delete the new snapshot', () => {
  const storage = memoryStorage();
  const raw = JSON.stringify(NEXT);
  assert.deepEqual(resetSavedSession(storage, NEXT, options({ legacyKeys: [CURRENT, ...LEGACY, LEGACY[0]] })), {
    ok: true, legacyCleared: true, raw,
  });
  assert.deepEqual([...storage.values], [[CURRENT, raw]]);
  assert.deepEqual(storage.calls.filter(([kind]) => kind === 'remove'), LEGACY.map(key => ['remove', key]));
});

test('serialization failures leave current data and legacy backups untouched', () => {
  const circular = {};
  circular.self = circular;
  for (const value of [circular, undefined, () => NEXT, { value: 1n }, { toJSON() { throw Error('bad state'); } }]) {
    const storage = memoryStorage();
    const before = [...storage.values];
    assert.deepEqual(resetSavedSession(storage, value, options()), { ok: false, reason: 'unavailable' });
    assert.deepEqual([...storage.values], before);
    assert.deepEqual(storage.calls, []);
  }
});

test('the saved-value comparison happens after serialization and immediately before setItem', () => {
  const storage = memoryStorage();
  const nextState = { toJSON() { storage.values.set(CURRENT, 'changed during serialization'); return NEXT; } };
  assert.deepEqual(resetSavedSession(storage, nextState, options()), { ok: false, reason: 'changed' });
  assert.equal(storage.values.get(CURRENT), 'changed during serialization');
  assert.equal(storage.values.get(LEGACY[0]), 'V3 backup');
  assert.deepEqual(storage.calls, [['get', CURRENT]]);
});

test('invalid key configuration fails before reading, writing, or deleting', () => {
  for (const config of [undefined, {}, options({ currentKey: undefined }), options({ legacyKeys: null }), options({ legacyKeys: [false] })]) {
    const storage = memoryStorage();
    const before = [...storage.values];
    assert.deepEqual(resetSavedSession(storage, NEXT, config), { ok: false, reason: 'unavailable' });
    assert.deepEqual([...storage.values], before);
    assert.deepEqual(storage.calls, []);
  }
});

test('a full reset never deletes unrelated same-origin application data', () => {
  const storage = memoryStorage();
  storage.values.set('another-lesson', 'keep me');
  const result = resetSavedSession(storage, NEXT, options());
  assert.equal(result.ok, true);
  assert.equal(storage.values.get('another-lesson'), 'keep me');
  assert.deepEqual(storage.calls.filter(([kind]) => kind === 'remove'), LEGACY.map(key => ['remove', key]));
});
