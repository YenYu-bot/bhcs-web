import assert from 'node:assert/strict';
import test from 'node:test';
import {INITIAL, STEPS} from '../../tools/solubility-desk/model.mjs';
import {decodeStored, readStored, writeStored} from '../../tools/solubility-desk/storage.mjs';

const snapshot = () => ({version: 1, state: {...INITIAL}, step: 0, mode: 'guided', records: []});
function memory(entries = []) {
  const values = new Map(entries);
  return {values, getItem: key => values.get(key) ?? null, setItem: (key, raw) => values.set(key, raw)};
}
const encode = value => JSON.stringify(value);

test('empty values yield detached safe defaults', () => {
  for (const raw of [null, '']) {
    const result = decodeStored(raw);
    assert.deepEqual(result, {snapshot: snapshot(), status: 'empty', writable: true});
    result.snapshot.state.water = 200;
    assert.equal(decodeStored(raw).snapshot.state.water, 100);
  }
});
test('intact v1 and reordered state fields are accepted', () => {
  const saved = snapshot();
  saved.state = {solute: 50, water: 100, temperature: 20};
  saved.records = [{state: {...STEPS[1]}, number: 3}];
  const result = decodeStored(encode(saved));
  assert.equal(result.status, 'ok');
  assert.equal(result.writable, true);
  assert.equal(result.snapshot.mode, 'guided');
  assert.deepEqual(result.snapshot.records, saved.records);
});
test('reading and writing one key leaves legacy keys alone', () => {
  const storage = memory([['old-key', '{legacy raw}']]);
  assert.equal(readStored(storage, 'new-key').status, 'empty');
  assert.equal(writeStored(storage, 'new-key', snapshot(), null).ok, true);
  assert.equal(storage.values.get('old-key'), '{legacy raw}');
});
test('unknown versions and invalid JSON remain untouched', () => {
  for (const [raw, status] of [['{', 'invalid'], ['null', 'invalid'], ['[]', 'invalid'], ['{}', 'invalid'], [encode({...snapshot(), version: 2}), 'future'], [encode({...snapshot(), version: 0}), 'future']]) {
    const storage = memory([['key', raw]]);
    assert.equal(readStored(storage, 'key').status, status);
    assert.equal(readStored(storage, 'key').writable, false);
    assert.deepEqual(writeStored(storage, 'key', snapshot(), raw), {ok: false, status, raw});
    assert.equal(storage.values.get('key'), raw);
  }
});
test('malformed state recovers defaults and valid records read-only', () => {
  for (const state of [null, [], {temperature: 999, water: 100, solute: 50}, {temperature: '20', water: 100, solute: 50}]) {
    const saved = {...snapshot(), state, records: [{state: {...STEPS[1]}, number: 1}]};
    const result = decodeStored(encode(saved));
    assert.equal(result.status, 'partial');
    assert.equal(result.writable, false);
    assert.deepEqual(result.snapshot.state, INITIAL);
    assert.deepEqual(result.snapshot.records, saved.records);
  }
});
test('null and malformed records never discard usable neighboring records', () => {
  const valid = {state: {...INITIAL}, number: 2};
  const raw = encode({...snapshot(), records: [null, valid, {}, {state: null}, false, {state: {...STEPS[1]}, number: 5}]});
  const storage = memory([['key', raw]]);
  const result = readStored(storage, 'key');
  assert.equal(result.status, 'partial');
  assert.deepEqual(result.snapshot.records, [valid, {state: {...STEPS[1]}, number: 5}]);
  assert.equal(writeStored(storage, 'key', snapshot(), raw).ok, false);
  assert.equal(storage.values.get('key'), raw);
});
test('valid records beyond the UI limit are retained', () => {
  const records = Array.from({length: 10}, (_, i) => ({state: {...INITIAL}, number: i + 1}));
  assert.deepEqual(decodeStored(encode({...snapshot(), records})).snapshot.records, records);
});
test('bad metadata recovers conservatively', () => {
  for (const changes of [{step: 99}, {mode: 'bad'}, {records: null}, {records: [{state: INITIAL, number: null}]}]) {
    assert.equal(decodeStored(encode({...snapshot(), ...changes})).status, 'partial');
  }
  const result = decodeStored(encode({...snapshot(), state: {...STEPS[1]}}));
  assert.equal(result.snapshot.mode, 'free');
  assert.equal(result.writable, false);
});
test('security exceptions are unavailable rather than empty or saved', () => {
  const storage = {getItem() { throw new Error('SecurityError'); }, setItem() { assert.fail('must not write'); }};
  assert.deepEqual(readStored(storage, 'key'), {snapshot: snapshot(), status: 'unavailable', writable: false, raw: null});
  assert.deepEqual(writeStored(storage, 'key', snapshot(), null), {ok: false, status: 'unavailable', raw: null});
});
test('quota/setItem exceptions do not claim a successful save', () => {
  const raw = encode(snapshot());
  const storage = {getItem: () => raw, setItem() { throw new Error('QuotaExceededError'); }};
  assert.deepEqual(writeStored(storage, 'key', snapshot(), raw), {ok: false, status: 'write_failed', raw});
});
test('stale writer and removed data produce conflicts without overwriting', () => {
  const raw = encode(snapshot());
  const storage = memory([['key', raw]]);
  assert.equal(writeStored(storage, 'key', snapshot(), null).status, 'conflict');
  assert.equal(storage.values.get('key'), raw);
  storage.values.delete('key');
  assert.equal(writeStored(storage, 'key', snapshot(), raw).status, 'conflict');
  assert.equal(storage.values.has('key'), false);
});
test('normal save returns exact saved bytes and allows subsequent save', () => {
  const storage = memory();
  const saved = {...snapshot(), state: {...STEPS[1]}, step: 1};
  const first = writeStored(storage, 'key', saved, null);
  assert.equal(first.ok, true);
  assert.equal(first.status, 'ok');
  assert.equal(first.raw, storage.values.get('key'));
  assert.deepEqual(readStored(storage, 'key').snapshot, saved);
  assert.equal(writeStored(storage, 'key', snapshot(), first.raw).ok, true);
});
test('invalid or cyclic outgoing snapshots never replace intact data', () => {
  const raw = encode(snapshot());
  const storage = memory([['key', raw]]);
  const cyclic = snapshot(); cyclic.self = cyclic;
  for (const proposed of [undefined, null, {...snapshot(), state: null}, cyclic]) {
    assert.equal(writeStored(storage, 'key', proposed, raw).ok, false);
    assert.equal(storage.values.get('key'), raw);
  }
});

test('unknown fields protect original bytes at every retained level', () => {
  for (const value of [
    {...snapshot(), futureField: 'KEEP_ME'},
    {...snapshot(), state: {...INITIAL, futureField: 'KEEP_ME'}},
    {...snapshot(), records: [{state: INITIAL, number: 1, futureField: 'KEEP_ME'}]},
    {...snapshot(), records: [{state: {...INITIAL, futureField: 'KEEP_ME'}, number: 1}]}
  ]) {
    const raw = encode(value), storage = memory([['key', raw]]);
    assert.equal(readStored(storage, 'key').status, 'partial');
    assert.equal(writeStored(storage, 'key', snapshot(), raw).ok, false);
    assert.equal(storage.values.get('key'), raw);
  }
});
