import test from 'node:test';
import assert from 'node:assert/strict';
import { FRESH } from '../../tools/metal-activity-desk/model.mjs';
import {
  SOLUTIONS, PAIRS, outcome, freshExtra, freshSession,
  appendRecord, connectEvidence, hasChain, migrateV1, restoreSession,
} from '../../tools/metal-activity-desk/inquiry.mjs';

const encoded = state => JSON.stringify(state);
const add = (state, metal, solution, kind) => appendRecord(state, metal, solution, kind).state;
const record = (id, metal, solution, kind = 'extra') => ({ id, metal, solution, kind });
const doneCup = (metal, recordId, solution) => ({ metal, ...(solution ? { solution } : {}), phase: 'done', progress: 1, recordId });
const withRecords = () => ({
  ...freshSession(),
  records: [
    record('r1', 'Zn', 'CuSO4', 'base'),
    record('r2', 'Fe', 'CuSO4', 'base'),
    record('r3', 'Zn', 'FeSO4'),
    record('r4', 'Cu', 'ZnSO4'),
  ],
  nextId: 5,
});

test('V2 covers all nine metal/solution pairs with exactly three positive displacements', () => {
  const expected = {
    Zn: { CuSO4: ['Cu', 'ZnCu', 'Zn > Cu'], FeSO4: ['Fe', 'ZnFe', 'Zn > Fe'], ZnSO4: null },
    Fe: { CuSO4: ['Cu', 'FeCu', 'Fe > Cu'], FeSO4: null, ZnSO4: null },
    Cu: { CuSO4: null, FeSO4: null, ZnSO4: null },
  };
  assert.deepEqual(Object.keys(SOLUTIONS), ['CuSO4', 'FeSO4', 'ZnSO4']);
  assert.deepEqual(Object.keys(PAIRS), ['ZnCu', 'FeCu', 'ZnFe']);
  let positiveCount = 0;
  for (const metal of Object.keys(expected)) {
    for (const solution of Object.keys(SOLUTIONS)) {
      const result = outcome(metal, solution);
      assert.ok(result, `${metal}/${solution} should be modeled`);
      const match = expected[metal][solution];
      assert.equal(result.reacts, Boolean(match), `${metal}/${solution}`);
      if (match) {
        positiveCount++;
        assert.deepEqual([result.deposit, result.pair, result.relation], match);
      } else {
        assert.deepEqual([result.deposit, result.pair, result.relation], [null, null, null]);
        assert.match(result.equation, /無淨置換反應/);
      }
    }
  }
  assert.equal(positiveCount, 3);
});

test('V2 depicts deposited iron as grey/grey-black, never red-brown copper', () => {
  const iron = outcome('Zn', 'FeSO4');
  assert.equal(iron.equation, 'Zn + Fe²⁺ → Zn²⁺ + Fe');
  assert.match(iron.surface, /灰色至灰黑色/);
  assert.match(iron.observation, /灰黑色析出物/);
  assert.match(iron.interpretation, /析出物是鐵/);
  assert.doesNotMatch(iron.surface + iron.observation, /紅棕/);
  assert.match(iron.liquid, /可能變淡/);
  assert.match(iron.liquid, /肉眼不一定容易分辨/);
  for (const metal of ['Zn', 'Fe']) {
    const copper = outcome(metal, 'CuSO4');
    assert.equal(copper.deposit, 'Cu');
    assert.match(copper.surface, /紅棕色/);
    assert.match(copper.interpretation, /析出物是銅/);
    assert.match(copper.liquid, /藍色變淡/);
  }
});

test('all six negative observations are retained descriptions, not activity rankings', () => {
  for (const metal of ['Zn', 'Fe', 'Cu']) for (const solution of Object.keys(SOLUTIONS)) {
    const result = outcome(metal, solution);
    if (result.reacts) continue;
    assert.equal(result.relation, null);
    assert.equal(result.pair, null);
    assert.match(result.surface, /未見新的固體析出/);
    assert.match(result.liquid, /沒有明顯變化/);
    assert.match(result.interpretation, /單靠這杯不能確定/);
    assert.doesNotMatch(result.equation + result.observation + result.interpretation, /Zn\s*[<>]\s*(?:Fe|Cu)|Fe\s*[<>]\s*(?:Zn|Cu)|Cu\s*[<>]\s*(?:Zn|Fe)/);
  }
});

test('outcome rejects unknown, injected and coerced metal/solution identifiers', () => {
  for (const metal of ['', 'Al', 'zn', '__proto__', 'constructor', ['Zn'], null, 1, {}, '<img src=x>']) {
    assert.equal(outcome(metal, 'CuSO4'), null);
  }
  for (const solution of ['', 'CuSO₄', '__proto__', 'constructor', ['CuSO4'], null, 1, {}, '<svg>']) {
    assert.equal(outcome('Zn', solution), null);
  }
});

test('fresh V2 session contains independent clean base and extra cups', () => {
  const state = freshSession();
  assert.equal(state.version, 2);
  assert.deepEqual(state.cups, FRESH());
  assert.deepEqual(state.extraCups, [freshExtra(), freshExtra()]);
  assert.notEqual(state.extraCups[0], state.extraCups[1]);
  assert.deepEqual(state.records, []);
  assert.deepEqual(state.connections, {});
  assert.equal(state.journeyOpen, false);
  assert.equal(state.nextId, 1);
  state.extraCups[0].metal = 'Zn';
  state.records.push(record('r1', 'Zn', 'FeSO4'));
  assert.equal(state.extraCups[1].metal, null);
  assert.deepEqual(freshSession().records, []);
});

test('appendRecord is immutable, generates distinct IDs and preserves earlier evidence', () => {
  const before = freshSession();
  const baseline = structuredClone(before);
  const first = appendRecord(before, 'Zn', 'CuSO4', 'base');
  assert.deepEqual(before, baseline);
  assert.notEqual(first.state, before);
  assert.notEqual(first.state.records, before.records);
  assert.deepEqual(first.record, record('r1', 'Zn', 'CuSO4', 'base'));
  assert.deepEqual(first.state.records, [first.record]);
  assert.equal(first.state.nextId, 2);
  const second = appendRecord(first.state, 'Zn', 'FeSO4');
  assert.equal(second.record.id, 'r2');
  assert.equal(second.record.kind, 'extra');
  assert.equal(first.state.records.length, 1);
  assert.deepEqual(second.state.records, [first.record, second.record]);
  const repeated = appendRecord(second.state, 'Zn', 'FeSO4');
  assert.equal(repeated.record.id, 'r3');
  assert.equal(repeated.state.records.length, 3, 'repeated experiments keep separate observations');
});

test('appendRecord retains negative experiments and rejects invalid experiment inputs', () => {
  const state = freshSession();
  const negative = appendRecord(state, 'Cu', 'FeSO4');
  assert.equal(negative.state.records.length, 1);
  assert.equal(outcome(negative.record.metal, negative.record.solution).reacts, false);
  for (const [metal, solution] of [['Ag', 'CuSO4'], ['Zn', 'missing'], [['Zn'], 'FeSO4'], ['Zn', ['FeSO4']]]) {
    assert.equal(appendRecord(state, metal, solution), null);
  }
  assert.deepEqual(state, freshSession());
});

test('record capacity preserves the final allowed observation and refuses overflow without mutation', () => {
  const state = freshSession();
  state.records = Array.from({ length: 999 }, (_, i) => record(`r${i + 1}`, 'Zn', 'FeSO4'));
  state.nextId = 1000;
  const last = appendRecord(state, 'Cu', 'ZnSO4');
  assert.equal(last.record.id, 'r1000');
  assert.equal(last.state.records.length, 1000);
  assert.equal(state.records.length, 999);
  const before = structuredClone(last.state);
  assert.ok(appendRecord(last.state, 'Zn', 'FeSO4') === null, 'capacity overflow must return null');
  assert.deepEqual(last.state, before);
  assert.deepEqual(restoreSession(encoded(last.state)), last.state);
  const overflow = { ...last.state, records: [...last.state.records, record('r1001', 'Zn', 'FeSO4')] };
  assert.equal(restoreSession(encoded(overflow)), null);
});

test('each positive record attaches only to its supported comparison without mutating state', () => {
  const state = withRecords();
  const expected = [['r1', 'ZnCu'], ['r2', 'FeCu'], ['r3', 'ZnFe']];
  for (const [id, pair] of expected) {
    const connected = connectEvidence(state, id, pair);
    assert.equal(connected.ok, true);
    assert.equal(connected.record.id, id);
    assert.equal(connected.result.pair, pair);
    assert.deepEqual(connected.state.connections, { [pair]: id });
    assert.deepEqual(state.connections, {});
    assert.notEqual(connected.state.connections, state.connections);
    assert.equal(connected.state.records, state.records);
    for (const wrongPair of Object.keys(PAIRS).filter(other => other !== pair)) {
      const invalid = connectEvidence(state, id, wrongPair);
      assert.equal(invalid.ok, false);
      assert.equal(invalid.reason, 'different-pair');
      assert.equal(invalid.state, state);
    }
  }
});

test('negative records, missing records and unknown pairs cannot create connections', () => {
  const state = withRecords();
  for (const pair of Object.keys(PAIRS)) {
    const result = connectEvidence(state, 'r4', pair);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'negative-only');
    assert.equal(result.state, state);
  }
  for (const id of [null, undefined, 'r999', '<script>']) {
    assert.equal(connectEvidence(state, id, 'ZnFe').reason, 'select-evidence');
  }
  for (const pair of ['CuZn', '', '__proto__', 'constructor', '<img>']) {
    assert.equal(connectEvidence(state, 'r3', pair).reason, 'unknown-pair');
  }
  assert.deepEqual(state.connections, {});
});

test('repeat attachment is stable and a newer valid evidence card can replace a link', () => {
  let state = connectEvidence(withRecords(), 'r3', 'ZnFe').state;
  state = connectEvidence(state, 'r3', 'ZnFe').state;
  assert.deepEqual(state.connections, { ZnFe: 'r3' });
  assert.equal(state.records.length, 4);
  const next = appendRecord(state, 'Zn', 'FeSO4');
  state = connectEvidence(next.state, next.record.id, 'ZnFe').state;
  assert.deepEqual(state.connections, { ZnFe: 'r5' });
  assert.equal(state.records.length, 5);
});

test('final chain requires supported Zn > Fe and Fe > Cu, not just two links', () => {
  const state = withRecords();
  assert.equal(hasChain(state), false);
  assert.equal(hasChain({ ...state, connections: { ZnCu: 'r1' } }), false);
  assert.equal(hasChain({ ...state, connections: { ZnCu: 'r1', FeCu: 'r2' } }), false);
  assert.equal(hasChain({ ...state, connections: { ZnCu: 'r1', ZnFe: 'r3' } }), false);
  assert.equal(hasChain({ ...state, connections: { ZnFe: 'r3', FeCu: 'r2' } }), true);
  assert.equal(hasChain({ ...state, connections: { ZnCu: 'r1', ZnFe: 'r3', FeCu: 'r2' } }), true);
  assert.equal(hasChain({ ...state, connections: { ZnFe: 'r4', FeCu: 'r2' } }), false);
  assert.equal(hasChain({ ...state, connections: { ZnFe: 'r1', FeCu: 'r2' } }), false);
  assert.equal(hasChain({ ...state, connections: { ZnFe: 'r3', FeCu: 'missing' } }), false);
});

test('V1 migration preserves completed base cups and pauses unfinished observations', () => {
  const legacy = {
    version: 1,
    cups: [
      { metal: 'Fe', phase: 'done', progress: 1 },
      { metal: 'Zn', phase: 'observing', progress: 0.8 },
      { metal: 'Cu', phase: 'paused', progress: 0.1 },
    ],
  };
  const migrated = migrateV1(encoded(legacy));
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.cups[0], doneCup('Fe', 'r1'));
  assert.deepEqual(migrated.cups[1], { metal: 'Zn', phase: 'paused', progress: 0 });
  assert.deepEqual(migrated.cups[2], { metal: 'Cu', phase: 'paused', progress: 0 });
  assert.deepEqual(migrated.records, [record('r1', 'Fe', 'CuSO4', 'base')]);
  assert.equal(migrated.nextId, 2);
  assert.deepEqual(migrated.extraCups, [freshExtra(), freshExtra()]);
  assert.deepEqual(migrated.connections, {});
  assert.equal(hasChain(migrated), false);
  const restored = restoreSession(encoded(migrated));
  assert.ok(restored);
  assert.deepEqual(restored.records, migrated.records);
  assert.equal(restored.cups[1].phase, 'paused');
  assert.equal(restored.cups[1].recordId, null);
});

test('V1 migration retains all done evidence, including negative Cu observations', () => {
  const migrated = migrateV1(encoded({ version: 1, cups: ['Zn', 'Fe', 'Cu'].map(metal => ({ metal, phase: 'done', progress: 1 })) }));
  assert.deepEqual(migrated.records.map(r => [r.id, r.metal, r.solution, r.kind]), [
    ['r1', 'Zn', 'CuSO4', 'base'], ['r2', 'Fe', 'CuSO4', 'base'], ['r3', 'Cu', 'CuSO4', 'base'],
  ]);
  assert.deepEqual(migrated.cups.map(c => c.recordId), ['r1', 'r2', 'r3']);
  assert.equal(connectEvidence(migrated, 'r3', 'ZnCu').reason, 'negative-only');
  assert.equal(hasChain(migrated), false);
  assert.deepEqual(migrateV1(encoded({ version: 1, cups: FRESH() })), freshSession());
});

test('V1 migration rejects unsupported versions and corrupt/injected legacy data', () => {
  for (const raw of [null, '', '{', encoded(freshSession()), encoded({ version: 1, cups: [] }), encoded({ version: 1, cups: [{ metal: ['Cu'], phase: 'done' }, ...FRESH().slice(1)] })]) {
    assert.equal(migrateV1(raw), null);
  }
});

test('V2 fresh sessions round-trip and invalid counters cannot choose future record IDs', () => {
  assert.deepEqual(restoreSession(encoded(freshSession())), freshSession());
  const state = withRecords();
  state.nextId = '<img src=x onerror=alert(1)>';
  state.records[0].id = 'r80';
  assert.equal(restoreSession(encoded(state)).nextId, 81);
});

test('accepted sparse-ID snapshots never append a record that becomes unrestorable', () => {
  for (const id of ['r999', 'r1000', 'r999999']) {
    const state = freshSession();
    state.records = [record(id, 'Zn', 'FeSO4')];
    const restored = restoreSession(encoded(state));
    if (!restored) continue; // Rejecting an unsupported imported ID is safe.
    const next = appendRecord(restored, 'Fe', 'CuSO4');
    if (!next) continue; // An explicit capacity refusal must preserve the session.
    assert.ok(restoreSession(encoded(next.state)), `appending after accepted ${id} must stay restorable`);
  }
});

test('ID allocation safely fills gaps after invalid, duplicate or exhausted counters', () => {
  for (const nextId of [0, -1, 1.5, NaN, Infinity, '2', null, 1, 3, 1000000, Number.MAX_SAFE_INTEGER + 1]) {
    const state = freshSession();
    state.records = [record('r1', 'Zn', 'FeSO4'), record('r3', 'Fe', 'CuSO4')];
    state.nextId = nextId;
    const added = appendRecord(state, 'Cu', 'ZnSO4');
    assert.equal(added.record.id, 'r2', `counter ${String(nextId)} must select first unused safe ID`);
    assert.equal(new Set(added.state.records.map(r => r.id)).size, 3);
    assert.ok(restoreSession(encoded(added.state)));
    assert.equal(state.records.length, 2);
  }
  const high = freshSession();
  high.records = [record('r999999', 'Zn', 'FeSO4')];
  const restored = restoreSession(encoded(high));
  assert.equal(restored.nextId, 1000000);
  const added = appendRecord(restored, 'Fe', 'CuSO4');
  assert.equal(added.record.id, 'r1');
  assert.ok(restoreSession(encoded(added.state)));
});

test('V2 restore preserves retained records and valid connections even when cups are fresh', () => {
  const state = withRecords();
  state.connections = { ZnCu: 'r1', FeCu: 'r2', ZnFe: 'r3' };
  state.journeyOpen = true;
  const restored = restoreSession(encoded(state));
  assert.deepEqual(restored, state);
  assert.equal(hasChain(restored), true);
  assert.deepEqual(restoreSession(encoded(restored)), restored);
});

test('V2 restore validates done cup record attachments against metal and solution', () => {
  const state = withRecords();
  state.cups[0] = doneCup('Zn', 'r1');
  state.extraCups[0] = doneCup('Zn', 'r3', 'FeSO4');
  state.extraCups[1] = doneCup('Cu', 'r4', 'ZnSO4');
  assert.deepEqual(restoreSession(encoded(state)), state);
  for (const id of [null, 'missing', 'r2', 'r3', '<script>']) {
    const bad = structuredClone(state); bad.cups[0].recordId = id;
    assert.equal(restoreSession(encoded(bad)), null, `invalid base attachment ${id}`);
  }
  for (const id of [null, 'r1', 'r2', 'r4']) {
    const bad = structuredClone(state); bad.extraCups[0].recordId = id;
    assert.equal(restoreSession(encoded(bad)), null, `invalid extra attachment ${id}`);
  }
});

test('V2 interrupted restore pauses animations, drops unfinished record references and normalizes progress', () => {
  const state = withRecords();
  state.cups[0] = { metal: 'Zn', phase: 'observing', progress: 0.9, recordId: 'r1' };
  state.cups[1] = { metal: 'Fe', phase: 'paused', progress: -99, recordId: 'r2' };
  state.extraCups[0] = { metal: 'Zn', solution: 'FeSO4', phase: 'observing', progress: 99, recordId: 'r3' };
  state.extraCups[1] = doneCup('Cu', 'r4', 'ZnSO4');
  state.extraCups[1].progress = 'injected';
  const restored = restoreSession(encoded(state));
  assert.deepEqual(restored.cups[0], { metal: 'Zn', phase: 'paused', progress: 0, recordId: null });
  assert.deepEqual(restored.cups[1], { metal: 'Fe', phase: 'paused', progress: 0, recordId: null });
  assert.deepEqual(restored.extraCups[0], { metal: 'Zn', solution: 'FeSO4', phase: 'paused', progress: 0, recordId: null });
  assert.deepEqual(restored.extraCups[1], doneCup('Cu', 'r4', 'ZnSO4'));
  assert.deepEqual(restored.records, state.records, 'historical evidence must survive an interrupted current experiment');
  assert.deepEqual(restoreSession(encoded(restored)), restored);
});

test('V2 restore rejects invalid shapes, record IDs and duplicate record IDs', () => {
  for (const raw of [null, '', '{', 'null', '[]', '{}', encoded({ ...freshSession(), version: 1 })]) {
    assert.equal(restoreSession(raw), null);
  }
  for (const field of ['cups', 'extraCups', 'records']) {
    for (const value of [null, {}, 'bad']) {
      const bad = freshSession(); bad[field] = value;
      assert.equal(restoreSession(encoded(bad)), null);
    }
  }
  for (const [field, value] of [['cups', []], ['cups', [...FRESH(), ...FRESH()]], ['extraCups', []], ['extraCups', [freshExtra()]]]) {
    const bad = freshSession(); bad[field] = value;
    assert.equal(restoreSession(encoded(bad)), null);
  }
  for (const id of ['', 'r0', 'r01', 1, ['r1'], '__proto__', '<svg>', 'r1000000']) {
    const bad = freshSession(); bad.records = [record(id, 'Zn', 'FeSO4')];
    assert.equal(restoreSession(encoded(bad)), null, `invalid ID ${JSON.stringify(id)}`);
  }
  const duplicated = withRecords(); duplicated.records[1].id = 'r1';
  assert.equal(restoreSession(encoded(duplicated)), null);
});

test('V2 restore rejects unsupported, coerced and injected record materials', () => {
  for (const metal of ['Ag', '__proto__', 'constructor', ['Zn'], null, {}, '<img src=x>']) {
    const bad = freshSession(); bad.records = [record('r1', metal, 'FeSO4')];
    assert.equal(restoreSession(encoded(bad)), null);
  }
  for (const solution of ['FeCl2', '__proto__', ['FeSO4'], null, {}, '<svg>']) {
    const bad = freshSession(); bad.records = [record('r1', 'Zn', solution)];
    assert.equal(restoreSession(encoded(bad)), null);
  }
});

test('V2 restore rejects corrupt current cups rather than generating unsupported evidence', () => {
  const invalidBase = [null, {}, { metal: 'Zn', phase: 'fresh' }, { metal: null, phase: 'done' }, { metal: ['Zn'], phase: 'paused' }, { metal: 'Ag', phase: 'paused' }, { metal: 'Zn', phase: '<script>' }];
  for (const cup of invalidBase) {
    const bad = withRecords(); bad.cups[0] = cup;
    assert.equal(restoreSession(encoded(bad)), null);
  }
  const invalidExtra = [
    null,
    { metal: null, solution: 'FeSO4', phase: 'fresh' },
    { metal: 'Zn', solution: null, phase: 'paused' },
    { metal: 'Zn', solution: ['FeSO4'], phase: 'paused' },
    { metal: 'Zn', solution: '__proto__', phase: 'paused' },
  ];
  for (const cup of invalidExtra) {
    const bad = withRecords(); bad.extraCups[0] = cup;
    assert.equal(restoreSession(encoded(bad)), null);
  }
});

test('V2 restore removes unsupported connections while preserving genuinely supported links', () => {
  const state = withRecords();
  state.connections = { ZnCu: 'r1', FeCu: 'r4', ZnFe: 'r1', CuZn: 'r4', '<script>': 'r3' };
  let restored = restoreSession(encoded(state));
  assert.deepEqual(restored.connections, { ZnCu: 'r1' });
  assert.equal(hasChain(restored), false);
  for (const badId of [null, 3, ['r3'], 'missing', '<svg>']) {
    state.connections = { ZnFe: badId, FeCu: 'r2' };
    restored = restoreSession(encoded(state));
    assert.deepEqual(restored.connections, { FeCu: 'r2' });
    assert.equal(hasChain(restored), false);
  }
  for (const malformed of [null, 'bad', 3, []]) {
    state.connections = malformed;
    assert.deepEqual(restoreSession(encoded(state)).connections, {});
  }
});

test('V2 restore strips untrusted metadata and prototype keys from trusted output', () => {
  const state = withRecords();
  state.title = '<img src=x onerror=alert(1)>';
  state.journeyOpen = 'true';
  state.records[0].observation = 'Zn < Cu';
  state.records[0].kind = '<svg onload=alert(1)>';
  state.cups[0].html = '<script>bad()</script>';
  state.extraCups[0].progress = 99;
  state.connections = JSON.parse('{"__proto__":{"polluted":true},"ZnFe":"r3"}');
  const restored = restoreSession(encoded(state));
  assert.equal(restored.title, undefined);
  assert.equal(restored.journeyOpen, false);
  assert.deepEqual(restored.records[0], record('r1', 'Zn', 'CuSO4'));
  assert.deepEqual(restored.cups[0], { metal: null, phase: 'fresh', progress: 0 });
  assert.deepEqual(restored.extraCups[0], freshExtra());
  assert.deepEqual(restored.connections, { ZnFe: 'r3' });
  assert.equal({}.polluted, undefined);
});
