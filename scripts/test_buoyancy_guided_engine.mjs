// B2 gate: the guided buoyancy state engine and challenge gates (assets/buoyancy-guided/engine.js, challenges.js).
// Run on its own: node scripts/test_buoyancy_guided_engine.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHASES, FLOW_LIQUIDS, RECENT_DROPS_MAX, HINT_AT, createInitialState, reduce, deriveView, compareStatus, expectedRelations, notebookIsReady, toImmersionPercent } from '../assets/buoyancy-guided/engine.js';
import { CHALLENGES, TEXT_MAX, judgeChallenge, challengeProgress, emptyChallenges, notebookReady, sanitizeConclusionFields, stepOf } from '../assets/buoyancy-guided/challenges.js';
import { LIQUIDS, blockOutcome, blockMassG } from '../assets/buoyancy-guided/model.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const near = (a, b, label) => assert.ok(Math.abs(a - b) <= 1e-12, `${label}: ${a} vs ${b}`);

const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };
const ok = (s, a) => { const r = reduce(s, a); assert.equal(r.accepted, true, `${JSON.stringify(a)} should be accepted in ${s.phase} (${r.reason})`); return r; };
const rejects = (s, a, reason) => {
  const r = reduce(s, a);
  assert.equal(r.accepted, false, `${JSON.stringify(a)} should be rejected in ${s.phase}`);
  assert.equal(r.reason, reason, `${JSON.stringify(a)} in ${s.phase}`);
  assert.strictEqual(r.state, s, 'a rejected action returns the same state object');
  assert.deepEqual(r.events, []);
  assert.deepEqual(r.transitions, []);
  return r;
};
const run = (s, ...actions) => actions.reduce((st, a) => ok(st, a).state, s);
const stayAt = (liquidId) => [0, 1, 2, 3, 4, 5, 6].filter((slots) => blockOutcome({ slots, liquidId }).outcome === 'stay');

const START = { type: 'START' }, BEGIN = { type: 'BEGIN' }, ADD = { type: 'ADD_BALLAST' }, REMOVE = { type: 'REMOVE_BALLAST' };
const PUT_BLOCK = { type: 'PUT_IN', objectId: 'block' }, OUT = { type: 'TAKE_OUT' }, CONTINUE = { type: 'CONTINUE' };
const put = (objectId) => ({ type: 'PUT_IN', objectId });
const record = (trial) => ({ type: 'RECORD_TRIAL', trial });
const select = (liquidId) => ({ type: 'SELECT_LIQUID', liquidId });
const answer = (question, a) => ({ type: 'ANSWER_COMPARE', question, answer: a });
const conclude = (fields) => ({ type: 'SAVE_CONCLUSION', fields });
const choose = (id, step, choice) => ({ type: 'ANSWER_CHALLENGE', id, step, choice });

// the happy path, one checkpoint per phase
const initial = createInitialState();
const mission = run(initial, START);
const trial1 = run(mission, BEGIN);
const trial1Complete = run(trial1, ADD, ADD, PUT_BLOCK);
const trial2Switch = run(trial1Complete, record(1));
const trial2Test = run(trial2Switch, select('brine'), PUT_BLOCK);
const trial2Complete = run(trial2Test, OUT, ADD, PUT_BLOCK);
const trial2Recorded = run(trial2Complete, record(2));
const compare = run(trial2Recorded, CONTINUE);
const trial3 = run(compare, answer('stayMass', 'larger'), answer('firstDrop', 'float'), CONTINUE);
const observed = run(trial3, put('wood'), OUT, put('stone'));
const concept = run(observed, CONTINUE);
const notebook = run(concept, CONTINUE);
const challenge1 = run(notebook, conclude({ level: 'A', relationLiquid: 'larger', relationWood: 'density' }), CONTINUE);
const challenge2 = run(challenge1, choose(1, 'c1-outcome', 'sink'), CONTINUE);
const challenge3 = run(challenge2, choose(2, 'c2-where', 'under-80'), choose(2, 'c2-brine', 'less'), CONTINUE);
const complete = run(challenge3, choose(3, 'c3-reason', 'volume-spread'), CONTINUE);
const CHECKPOINTS = { welcome: initial, mission, 'trial1-test': trial1, 'trial1-complete': trial1Complete, 'trial2-switch-liquid': trial2Switch, 'trial2-test': trial2Test,
  'trial2-complete': trial2Complete, 'trial2-recorded': trial2Recorded, compare, 'trial3-drop': trial3, 'trial3-observed': observed, concept, notebook,
  'challenge-1': challenge1, 'challenge-2': challenge2, 'challenge-3': challenge3, complete };

test('A. exactly 18 phases, in order, and the happy path visits each resting one', () => {
  assert.equal(PHASES.length, 18);
  assert.deepEqual([...PHASES], ['welcome', 'mission', 'trial1-test', 'trial1-complete', 'trial1-recorded', 'trial2-switch-liquid', 'trial2-test', 'trial2-complete', 'trial2-recorded', 'compare', 'trial3-drop', 'trial3-observed', 'concept', 'notebook', 'challenge-1', 'challenge-2', 'challenge-3', 'complete']);
  assert.ok(Object.isFrozen(PHASES));
  for (const [phase, state] of Object.entries(CHECKPOINTS)) assert.equal(state.phase, phase);
});

test('A. initial state', () => {
  const s = createInitialState();
  assert.deepEqual(s, {
    phase: 'welcome', liquidId: 'water', slots: 1, tank: { objectId: null },
    dropCount: { trial1: 0, trial2: 0 }, failedDrops: { trial1: 0, trial2: 0 }, recentDrops: { trial1: [], trial2: [] },
    records: { 1: null, 2: null, 3: null }, trial2: { firstDrop: null }, trial3: { tried: { wood: false, stone: false } },
    compare: { stayMass: null, firstDrop: null },
    conclusion: { level: null, relationLiquid: null, relationWood: null, freeText: '', evidenceText: '', limitationText: '' },
    challenges: emptyChallenges(), seq: 0,
  });
  assert.notStrictEqual(createInitialState(), createInitialState());
});

test('B. welcome and mission accept only their own action, and mission never skips ahead', () => {
  for (const a of [BEGIN, ADD, PUT_BLOCK, OUT, CONTINUE, record(1), answer('stayMass', 'larger')]) rejects(initial, a, 'wrong-phase');
  const r = ok(initial, START);
  assert.equal(r.state.phase, 'mission');
  assert.deepEqual(r.transitions, ['mission']);
  for (const a of [START, ADD, PUT_BLOCK, CONTINUE, record(1)]) rejects(mission, a, 'wrong-phase');
  assert.equal(mission.phase, 'mission');
  const dirty = { ...structuredClone(mission), slots: 5, liquidId: 'brine', dropCount: { trial1: 7, trial2: 2 }, failedDrops: { trial1: 4, trial2: 0 }, recentDrops: { trial1: [{ slots: 5, liquidId: 'brine' }], trial2: [] } };
  const b = ok(dirty, BEGIN);
  assert.equal(b.state.phase, 'trial1-test');
  assert.deepEqual(b.transitions, ['trial1-test']);
  assert.equal(b.state.slots, 1);
  assert.equal(b.state.liquidId, 'water');
  assert.equal(b.state.tank.objectId, null);
  assert.equal(b.state.dropCount.trial1, 0);
  assert.equal(b.state.failedDrops.trial1, 0);
  assert.deepEqual(b.state.recentDrops.trial1, []);
});

test('C. Trial 1: ballast range and the tank lock', () => {
  assert.equal(trial1.slots, 1);
  let s = ok(trial1, REMOVE).state;
  assert.equal(s.slots, 0);
  rejects(s, REMOVE, 'out-of-range');
  for (let i = 0; i < 6; i++) s = ok(s, ADD).state;
  assert.equal(s.slots, 6);
  rejects(s, ADD, 'out-of-range');
  const inTank = ok(trial1, PUT_BLOCK).state;
  rejects(inTank, ADD, 'object-in-tank');
  rejects(inTank, REMOVE, 'object-in-tank');
  rejects(inTank, PUT_BLOCK, 'object-in-tank');
  assert.equal(ok(inTank, OUT).state.tank.objectId, null);
  rejects(trial1, OUT, 'object-on-table');
});

test('C. Trial 1: the liquid is fixed, only the block is allowed, and oil or brine are unavailable', () => {
  for (const id of ['water', 'brine', 'oil', 'milk']) rejects(trial1, select(id), 'locked');
  for (const id of ['wood', 'stone', 'toString', '', null, undefined, 3]) rejects(trial1, put(id), 'invalid');
  assert.deepEqual([...FLOW_LIQUIDS], ['water', 'brine']);
});

test('C. Trial 1: the outcome comes from the model, never from the interface', () => {
  const r = ok(trial1, { type: 'PUT_IN', objectId: 'block', outcome: 'stay', immersionPercent: 1, massG: 100, density: 1 });
  assert.equal(r.state.phase, 'trial1-test', 'a spoofed outcome is ignored');
  assert.equal(r.events[0].outcome, 'float');
  assert.equal(r.events[0].immersionPercent, 60);
  assert.equal(r.state.tank.objectId, 'block');
  assert.deepEqual(Object.keys(r.state).sort(), Object.keys(trial1).sort());
});

test('C. Trial 1: drops are counted, recent drops are capped at 8 and hold only operation facts', () => {
  let s = trial1;
  for (let i = 0; i < 10; i++) s = run(s, PUT_BLOCK, OUT);
  assert.equal(s.dropCount.trial1, 10);
  assert.equal(s.recentDrops.trial1.length, RECENT_DROPS_MAX);
  assert.deepEqual(s.recentDrops.trial1[0], { slots: 1, liquidId: 'water' });
  let t = run(trial1, PUT_BLOCK, OUT, ADD, PUT_BLOCK, OUT, ADD);
  assert.deepEqual(t.recentDrops.trial1, [{ slots: 1, liquidId: 'water' }, { slots: 2, liquidId: 'water' }]);
  t = run(t, PUT_BLOCK);
  assert.equal(t.phase, 'trial1-complete');
  assert.equal(t.dropCount.trial1, 3);
});

test('C. Trial 1: landing on the stay slot completes automatically and never goes back', () => {
  const r = ok(run(trial1, ADD), PUT_BLOCK);
  assert.deepEqual(r.transitions, []);
  assert.equal(r.state.phase, 'trial1-test', 'slot 2 floats');
  const stay = ok(run(trial1, ADD, ADD), PUT_BLOCK);
  assert.deepEqual(stay.transitions, ['trial1-complete']);
  assert.equal(stay.state.phase, 'trial1-complete');
  assert.equal(deriveView(stay.state).recordEnabled, true);
  const away = run(stay.state, OUT, ADD, PUT_BLOCK);
  assert.equal(away.phase, 'trial1-complete', 'the phase never goes back');
  assert.equal(deriveView(away).recordEnabled, false);
  const home = run(away, OUT, REMOVE, PUT_BLOCK);
  assert.equal(deriveView(home).recordEnabled, true);
  assert.equal(deriveView(run(stay.state, OUT)).recordEnabled, false);
});

test('C. Trial 1: RECORD_TRIAL checks the model, not the caller', () => {
  const away = run(trial1Complete, OUT, ADD, PUT_BLOCK);
  rejects(away, record(1), 'not-stay');
  rejects(run(trial1Complete, OUT), record(1), 'not-stay');
  rejects(trial1, record(1), 'wrong-phase');
  rejects(trial1Complete, record(2), 'wrong-phase');
  for (const t of [0, 3, '1', null, undefined]) rejects(trial1Complete, record(t), 'invalid');
  const r = ok(trial1Complete, record(1));
  assert.deepEqual(r.state.records[1], { trial: 1, liquidId: 'water', slots: 3, dropCount: 1, recentDrops: [{ slots: 3, liquidId: 'water' }] });
  for (const forbidden of ['density', 'outcome', 'immersionFraction', 'immersionPercent', 'stayMassG', 'massG']) assert.ok(!(forbidden in r.state.records[1]));
  assert.deepEqual(r.transitions, ['trial1-recorded', 'trial2-switch-liquid']);
  assert.equal(r.events.length, 1);
  assert.equal(r.events[0].type, 'record-written');
  assert.equal(r.events[0].trial, 1);
});

test('D. Trial 2: entering sets up a fresh trial with the same block and plain water', () => {
  assert.equal(trial2Switch.phase, 'trial2-switch-liquid');
  assert.equal(trial2Switch.slots, trial2Switch.records[1].slots);
  assert.equal(trial2Switch.liquidId, 'water');
  assert.equal(trial2Switch.tank.objectId, null);
  assert.deepEqual(trial2Switch.dropCount, { trial1: 1, trial2: 0 });
  assert.equal(trial2Switch.trial2.firstDrop, null);
  assert.equal(deriveView(trial2Switch).controls.ballast.locked, true);
});

test('D. Trial 2: the block keeps its ballast until the first drop, and only brine is accepted', () => {
  rejects(trial2Switch, ADD, 'locked');
  rejects(trial2Switch, REMOVE, 'locked');
  rejects(trial2Switch, PUT_BLOCK, 'wrong-liquid');
  for (const id of ['oil', 'milk', 'toString', '', null, undefined, 4]) rejects(trial2Switch, select(id), 'invalid');
  rejects(trial2Switch, OUT, 'object-on-table');
  const back = run(trial2Switch, select('brine'), select('water'));
  assert.equal(back.liquidId, 'water');
  rejects(back, PUT_BLOCK, 'wrong-liquid');
  assert.equal(deriveView(trial2Switch).controls.objects.block.putIn, false);
  assert.equal(deriveView(run(trial2Switch, select('brine'))).controls.objects.block.putIn, true);
});

test('D. Trial 2: the first drop records only slots and liquid, then the ballast opens after the block comes out', () => {
  const r = ok(run(trial2Switch, select('brine')), PUT_BLOCK);
  assert.deepEqual(r.transitions, ['trial2-test']);
  assert.deepEqual(r.state.trial2.firstDrop, { slots: trial2Switch.records[1].slots, liquidId: 'brine' });
  assert.equal(r.events[0].context, 'trial2-first');
  assert.equal(r.events[0].outcome, 'float');
  assert.equal(r.events[0].immersionPercent, 83);
  assert.equal(r.state.dropCount.trial2, 0, 'the first drop is the setup observation, not a search drop');
  assert.equal(r.state.failedDrops.trial2, 0);
  rejects(r.state, ADD, 'object-in-tank');
  assert.equal(deriveView(r.state).controls.ballast.locked, true);
  assert.equal(deriveView(ok(r.state, OUT).state).controls.ballast.locked, false);
  for (const id of ['water', 'brine', 'oil']) rejects(r.state, select(id), 'locked');
});

test('D. Trial 2: finding the new stay slot, the record and its identity', () => {
  assert.equal(trial2Complete.phase, 'trial2-complete');
  rejects(run(trial2Complete, OUT, ADD, PUT_BLOCK), record(2), 'not-stay');
  rejects(trial2Test, record(2), 'wrong-phase');
  const r = ok(trial2Complete, record(2));
  assert.deepEqual(r.transitions, ['trial2-recorded']);
  const [r1, r2] = [r.state.records[1], r.state.records[2]];
  assert.deepEqual(stayAt('water'), [3]);
  assert.deepEqual(stayAt('brine'), [4]);
  assert.equal(r1.slots, stayAt('water')[0]);
  assert.equal(r2.slots, stayAt('brine')[0]);
  assert.equal(r2.firstDrop.slots, r1.slots);
  assert.deepEqual(r2, { trial: 2, liquidId: 'brine', slots: 4, dropCount: 1, recentDrops: [{ slots: 4, liquidId: 'brine' }], firstDrop: { slots: 3, liquidId: 'brine' }, independentVariable: 'liquid' });
  assert.equal(r.state.tank.objectId, null);
  assert.equal(r.state.phase, 'trial2-recorded');
});

test('E. Compare: answers are stored, wrong ones do not unlock, all correct ones do', () => {
  for (const [q, a] of [['stayMass', 'bigger'], ['nope', 'larger'], ['firstDrop', 'larger'], ['stayMass', null], [undefined, undefined], ['toString', 'larger']]) rejects(compare, answer(q, a), 'invalid');
  rejects(trial2Recorded, answer('stayMass', 'larger'), 'wrong-phase');
  rejects(compare, CONTINUE, 'locked');
  let s = ok(compare, answer('stayMass', 'smaller')).state;
  assert.equal(s.compare.stayMass, 'smaller');
  assert.equal(deriveView(s).compare.questions.stayMass.status, 'incorrect');
  rejects(s, CONTINUE, 'locked');
  s = run(s, answer('firstDrop', 'float'));
  rejects(s, CONTINUE, 'locked');
  s = run(s, answer('stayMass', 'larger'));
  assert.equal(deriveView(s).compare.allCorrect, true);
  const r = ok(s, CONTINUE);
  assert.deepEqual(r.transitions, ['trial3-drop']);
});

test('E. Compare: correctness is derived from the records and the model', () => {
  const lower = structuredClone(compare);
  lower.records[2].slots = 2;                                   // a lighter stay mass than record 1
  const s = run(lower, answer('stayMass', 'smaller'));
  assert.equal(compareStatus(s).questions.stayMass.status, 'correct');
  assert.equal(compareStatus(run(lower, answer('stayMass', 'larger'))).questions.stayMass.status, 'incorrect');
  const same = structuredClone(compare);
  same.records[2].slots = same.records[1].slots;
  assert.equal(compareStatus(run(same, answer('stayMass', 'same'))).questions.stayMass.status, 'correct');
  const stays = structuredClone(compare);
  stays.records[2].firstDrop = { slots: 3, liquidId: 'water' };   // a drop that stays
  assert.equal(compareStatus(run(stays, answer('firstDrop', 'stay'))).questions.firstDrop.status, 'correct');
  assert.equal(compareStatus(run(stays, answer('firstDrop', 'float'))).questions.firstDrop.status, 'incorrect');
});

test('E. Compare: the view never holds the answer', () => {
  const v = deriveView(compare);
  assert.deepEqual(v.compare, { questions: { stayMass: { selected: null, status: null }, firstDrop: { selected: null, status: null } }, allCorrect: false });
  const text = JSON.stringify(deriveView(run(compare, answer('stayMass', 'smaller'))));
  assert.ok(!/correctAnswer|expected/.test(text));
});

test('F. Trial 3: plain water, only wood and stone, and no ballast or liquid changes', () => {
  assert.equal(trial3.liquidId, 'water');
  assert.equal(trial3.tank.objectId, null);
  assert.deepEqual(trial3.trial3.tried, { wood: false, stone: false });
  for (const id of ['block', 'toString', '', null]) rejects(trial3, put(id), 'invalid');
  rejects(trial3, ADD, 'locked');
  rejects(trial3, REMOVE, 'locked');
  rejects(trial3, select('brine'), 'locked');
  rejects(trial3, record(1), 'wrong-phase');
  rejects(trial3, CONTINUE, 'wrong-phase');
  const v = deriveView(trial3);
  assert.deepEqual([v.controls.objects.wood.available, v.controls.objects.stone.available, v.controls.objects.block.available], [true, true, false]);
});

test('F. Trial 3: repeating one object never completes early; both objects do, in either order', () => {
  let s = ok(trial3, put('wood')).state;
  assert.equal(s.trial3.tried.wood, true);
  rejects(s, put('stone'), 'object-in-tank');
  s = run(s, OUT, put('wood'), OUT, put('wood'));
  assert.equal(s.phase, 'trial3-drop');
  assert.deepEqual(s.trial3.tried, { wood: true, stone: false });
  const done = ok(run(s, OUT), put('stone'));
  assert.deepEqual(done.transitions, ['trial3-observed']);
  assert.deepEqual(done.events.map((e) => e.type), ['observation', 'record-written']);
  const reversed = run(trial3, put('stone'), OUT, put('wood'));
  assert.equal(reversed.phase, 'trial3-observed');
});

test('F. Trial 3: observations come from the model; record 3 stores no outcome; the phase then locks', () => {
  const first = ok(trial3, put('wood'));
  assert.equal(first.events[0].outcome, 'float');
  assert.equal(first.events[0].immersionPercent, 60);
  assert.equal(ok(run(trial3, put('wood'), OUT), put('stone')).events[0].outcome, 'sink');
  assert.deepEqual(observed.records[3], { trial: 3, liquidId: 'water', tried: { wood: true, stone: true } });
  rejects(observed, OUT, 'wrong-phase');
  rejects(observed, put('wood'), 'wrong-phase');
  rejects(observed, ADD, 'wrong-phase');
  assert.equal(deriveView(observed).recordEnabled, false);
  const c = ok(observed, CONTINUE);
  assert.deepEqual(c.transitions, ['concept']);
  assert.deepEqual(ok(concept, CONTINUE).transitions, ['notebook']);
});

test('G. facts: the numbers come from the model and carry no wording', () => {
  const v = deriveView(concept);
  const f = v.facts;
  near(f.record1.stayMassG, 100, 'r1 mass'); near(f.record1.objectDensity, 1, 'r1 density'); assert.equal(f.record1.outcome, 'stay'); assert.equal(f.record1.immersionPercent, null);
  near(f.record2.stayMassG, 120, 'r2 mass'); near(f.record2.objectDensity, 1.2, 'r2 density'); assert.equal(f.record2.outcome, 'stay');
  assert.equal(f.record1.volumeCm3, 100);
  near(f.wood.objectDensity, 0.6, 'wood'); assert.equal(f.wood.outcome, 'float'); assert.equal(f.wood.immersionPercent, 60); assert.equal(f.wood.massG, 300); assert.equal(f.wood.volumeCm3, 500);
  near(f.stone.objectDensity, 3, 'stone'); assert.equal(f.stone.outcome, 'sink'); assert.equal(f.stone.immersionPercent, null); assert.equal(f.stone.massG, 120); assert.equal(f.stone.volumeCm3, 40);
  assert.equal(f.trial2FirstDrop.massG, 100); assert.equal(f.trial2FirstDrop.outcome, 'float'); assert.equal(f.trial2FirstDrop.immersionPercent, 83); near(f.trial2FirstDrop.immersionFraction, 5 / 6, 'first drop');
  assert.deepEqual(f.concept.map((c) => [c.massG, c.volumeCm3]), [[100, 100], [120, 100], [300, 500], [120, 40]]);
  assert.deepEqual(f.concept.map((c) => c.id), ['block-water', 'block-brine', 'wood', 'stone']);
  [1, 1.2, 0.6, 3].forEach((d, i) => near(f.concept[i].density, d, `concept ${i}`));
  assert.deepEqual(f.shelf, { wood: { massG: 300, volumeCm3: 500 }, stone: { massG: 120, volumeCm3: 40 } });
  assert.ok(!/[㐀-鿿]/.test(JSON.stringify(v)), 'no wording in the view');
});

test('G. facts: concept facts and observed objects only exist once the evidence does', () => {
  assert.equal(deriveView(trial3).facts.concept, null);
  assert.equal(deriveView(trial3).facts.wood, null);
  assert.equal(deriveView(trial2Switch).facts.record2, null);
  assert.equal(deriveView(initial).facts.record1, null);
  assert.equal(deriveView(run(trial3, put('wood'))).facts.wood.outcome, 'float');
  assert.equal(deriveView(run(trial3, put('wood'))).facts.stone, null);
});

test('G. immersionPercent: whole percent, clamped to 1–99, null unless floating', () => {
  assert.equal(toImmersionPercent(5 / 6), 83);
  assert.equal(toImmersionPercent(2 / 3), 67);
  assert.equal(toImmersionPercent(0.6), 60);
  assert.equal(toImmersionPercent(0.001), 1);
  assert.equal(toImmersionPercent(0.999), 99);
  assert.equal(toImmersionPercent(0.995), 99);
  assert.equal(toImmersionPercent(null), null);
  const pct = (slots, liquidId) => deriveView({ ...trial1, slots, liquidId }).facts.currentBlock.immersionPercent;
  assert.deepEqual([0, 1, 2, 3, 4].map((s) => pct(s, 'water')), [40, 60, 80, null, null]);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((s) => pct(s, 'brine')), [33, 50, 67, 83, null, null]);
  assert.equal(deriveView({ ...trial1, slots: 3 }).facts.currentBlock.massG, blockMassG(3));
});

test('H. seq and events: only real announcements count, ids are distinct, rejected and derived views change nothing', () => {
  const a = ok(trial1, PUT_BLOCK);
  assert.equal(a.state.seq, 1);
  assert.equal(a.events[0].id, 'observation-1');
  const b = ok(ok(a.state, OUT).state, PUT_BLOCK);
  assert.equal(b.events[0].outcome, a.events[0].outcome, 'the same observation twice');
  assert.equal(b.events[0].immersionPercent, a.events[0].immersionPercent);
  assert.notEqual(b.events[0].id, a.events[0].id);
  assert.equal(b.state.seq, 2);
  assert.equal(ok(trial1, ADD).state.seq, 0, 'a ballast change is not an announcement');
  assert.equal(ok(a.state, OUT).state.seq, 1);
  assert.equal(reduce(a.state, { type: 'NOPE' }).accepted, false);
  rejects(a.state, PUT_BLOCK, 'object-in-tank');
  const frozen = deepFreeze(structuredClone(a.state));
  deriveView(frozen); deriveView(frozen);
  assert.equal(frozen.seq, 1);
  const rec = ok(trial1Complete, record(1));
  assert.equal(rec.events[0].id, `record-written-${trial1Complete.seq + 1}`);
  assert.equal(rec.state.seq, trial1Complete.seq + 1);
  const ids = []; let s = trial1;
  for (const act of [PUT_BLOCK, OUT, PUT_BLOCK, OUT, PUT_BLOCK, OUT]) { const r = ok(s, act); ids.push(...r.events.filter((e) => e.id).map((e) => e.id)); s = r.state; }
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ok(trial1, ADD).events.every((e) => !('id' in e)));
});

test('H. reduce is deterministic', () => {
  const actions = [START, BEGIN, ADD, ADD, PUT_BLOCK, record(1), select('brine'), PUT_BLOCK, OUT, ADD, PUT_BLOCK, record(2), CONTINUE];
  const play = () => actions.reduce((st, a) => reduce(st, a).state, createInitialState());
  assert.deepEqual(play(), play());
});

test('Hints: the level rises on the 2nd, 3rd and 5th non-stay drop of a trial, never falls, and is fresh in Trial 2', () => {
  assert.deepEqual([...HINT_AT], [2, 3, 5]);
  let s = trial1;
  const levels = [], hintEvents = [];
  for (let i = 0; i < 6; i++) { const r = ok(ok(s, PUT_BLOCK).state, OUT); s = r.state; levels.push(deriveView(s).hint.level); }
  assert.deepEqual(levels, [0, 1, 2, 2, 3, 3]);
  let t = trial1;
  for (let i = 0; i < 6; i++) { const r = ok(t, PUT_BLOCK); hintEvents.push(...r.events.filter((e) => e.type === 'hint')); t = ok(r.state, OUT).state; }
  assert.deepEqual(hintEvents, [{ type: 'hint', trial: 'trial1', level: 1 }, { type: 'hint', trial: 'trial1', level: 2 }, { type: 'hint', trial: 'trial1', level: 3 }]);
  const afterStay = run(run(trial1, ADD, ADD), PUT_BLOCK);
  assert.equal(afterStay.failedDrops.trial1, 0, 'a stay drop is not a miss');
  const noisy = run(s, ADD, ADD, PUT_BLOCK);
  assert.equal(noisy.phase, 'trial1-complete');
  const t2 = ok(ok(noisy, record(1)).state, select('brine')).state;
  assert.equal(deriveView(t2).hint.level, 0);
  assert.equal(deriveView(run(t2, PUT_BLOCK)).hint.level, 0, 'the first brine drop is not a miss');
  assert.equal(deriveView(trial1).hint.trial, 'trial1');
  assert.equal(deriveView(compare).hint.trial, null);
});

test('I. Notebook: Level A is gated by the records', () => {
  assert.deepEqual(expectedRelations(notebook.records), { liquid: 'larger', wood: 'density' });
  assert.equal(expectedRelations({ ...notebook.records, 3: null }), null);
  assert.equal(expectedRelations({ ...notebook.records, 3: { trial: 3, liquidId: 'water', tried: { wood: true, stone: false } } }), null);
  rejects(concept, conclude({ level: 'A' }), 'wrong-phase');
  for (const bad of [{ level: 'Z' }, { nope: 1 }, { relationLiquid: 'bigger' }, { relationWood: 'weight' }, { freeText: 5 }, {}, null, 'A']) rejects(notebook, conclude(bad), 'invalid');
  rejects(notebook, CONTINUE, 'locked');
  const wrongLiquid = run(notebook, conclude({ level: 'A', relationLiquid: 'smaller', relationWood: 'density' }));
  assert.equal(deriveView(wrongLiquid).notebook.ready, false);
  rejects(wrongLiquid, CONTINUE, 'locked');
  const wrongWood = run(notebook, conclude({ level: 'A', relationLiquid: 'larger', relationWood: 'mass' }));
  rejects(wrongWood, CONTINUE, 'locked');
  rejects(run(notebook, conclude({ level: 'A', relationLiquid: 'larger' })), CONTINUE, 'locked');
  const right = run(notebook, conclude({ level: 'A', relationLiquid: 'larger', relationWood: 'density' }));
  assert.equal(notebookIsReady(right), true);
  assert.deepEqual(ok(right, CONTINUE).transitions, ['challenge-1']);
  const noRecord3 = { ...structuredClone(right), records: { ...right.records, 3: null } };
  assert.equal(notebookIsReady(noRecord3), false, 'a missing prerequisite record keeps Level A closed');
});

test('I. Notebook: Level B and C only need to be written, and text is capped', () => {
  const ready = (fields) => deriveView(run(notebook, conclude(fields))).notebook.ready;
  assert.equal(ready({ level: 'B', freeText: '' }), false);
  assert.equal(ready({ level: 'B', freeText: ' a ' }), false);
  assert.equal(ready({ level: 'B', freeText: '   ' }), false);
  assert.equal(ready({ level: 'B', freeText: 'ab' }), true);
  assert.equal(ready({ level: 'B', freeText: '密度' }), true);
  assert.equal(ready({ level: 'C', evidenceText: 'ab' }), false);
  assert.equal(ready({ level: 'C', evidenceText: 'ab', limitationText: 'a' }), false);
  assert.equal(ready({ level: 'C', evidenceText: 'ab', limitationText: 'cd' }), true);
  rejects(run(notebook, conclude({ level: 'B', freeText: '' })), CONTINUE, 'locked');
  assert.deepEqual(ok(run(notebook, conclude({ level: 'B', freeText: 'ab' })), CONTINUE).transitions, ['challenge-1']);
  const long = run(notebook, conclude({ freeText: 'x'.repeat(TEXT_MAX + 50) }));
  assert.equal(long.conclusion.freeText.length, TEXT_MAX);
  assert.equal(notebookReady(null, null), false);
  assert.equal(notebookReady({ level: 'A', relationLiquid: 'larger', relationWood: 'density' }, null), false);
  assert.deepEqual(sanitizeConclusionFields({ level: 'B', freeText: 'x'.repeat(2000) }), { level: 'B', freeText: 'x'.repeat(TEXT_MAX) });
});

test('J. Challenges: ordering, attempts, locks and the invalid cases', () => {
  rejects(notebook, choose(1, 'c1-outcome', 'sink'), 'wrong-phase');
  rejects(challenge1, CONTINUE, 'locked');
  rejects(challenge1, choose(2, 'c1-outcome', 'sink'), 'wrong-phase');
  rejects(challenge1, choose(1, 'c1-nope', 'sink'), 'invalid');
  rejects(challenge1, choose(1, 'c1-outcome', 'maybe'), 'invalid');
  rejects(challenge1, choose(1, 'c1-outcome', 5), 'invalid');
  const wrong = ok(challenge1, choose(1, 'c1-outcome', 'float'));
  assert.deepEqual(wrong.events, [{ type: 'challenge-answered', challengeId: 1, step: 'c1-outcome', correct: false, attempts: 1 }]);
  assert.equal(deriveView(wrong.state).challenge.allCorrect, false);
  rejects(wrong.state, CONTINUE, 'locked');
  const wrongAgain = ok(wrong.state, choose(1, 'c1-outcome', 'stay'));
  assert.equal(wrongAgain.events[0].attempts, 2);
  const solved = ok(wrongAgain.state, choose(1, 'c1-outcome', 'sink'));
  assert.deepEqual(solved.events[0], { type: 'challenge-answered', challengeId: 1, step: 'c1-outcome', correct: true, attempts: 3 });
  rejects(solved.state, choose(1, 'c1-outcome', 'float'), 'locked');
  rejects(solved.state, choose(1, 'c1-outcome', 'sink'), 'locked');
  assert.equal(solved.state.challenges[1].steps['c1-outcome'].correct, true);
  assert.deepEqual(ok(solved.state, CONTINUE).transitions, ['challenge-2']);
  rejects(challenge2, choose(2, 'c2-brine', 'less'), 'locked');
  const half = run(challenge2, choose(2, 'c2-where', 'under-80'));
  rejects(half, CONTINUE, 'locked');
  assert.equal(deriveView(half).challenge.steps[1].unlocked, true);
  assert.deepEqual(ok(run(half, choose(2, 'c2-brine', 'less')), CONTINUE).transitions, ['challenge-3']);
  assert.deepEqual(ok(run(challenge3, choose(3, 'c3-reason', 'volume-spread')), CONTINUE).transitions, ['complete']);
  rejects(complete, CONTINUE, 'wrong-phase');
  rejects(complete, choose(3, 'c3-reason', 'volume-spread'), 'wrong-phase');
});

test('J. Challenges: every correct answer agrees with the model, and the view never shows the answer', () => {
  const c1 = stepOf(1, 'c1-outcome');
  assert.equal(blockOutcome(c1.setup).outcome, c1.correct);
  assert.ok(c1.setup.liquidId in LIQUIDS);
  const where = stepOf(2, 'c2-where'), brine = stepOf(2, 'c2-brine');
  const w = blockOutcome(where.setup), b = blockOutcome(brine.setup);
  assert.equal(w.outcome, 'float');
  assert.equal(`under-${toImmersionPercent(w.immersionFraction)}`, where.correct);
  assert.equal(toImmersionPercent(b.immersionFraction) < toImmersionPercent(w.immersionFraction) ? 'less' : 'more', brine.correct);
  assert.ok(where.setup.liquidId in LIQUIDS && brine.setup.liquidId in LIQUIDS);
  assert.equal(judgeChallenge(3, 'c3-reason', stepOf(3, 'c3-reason').correct), true);
  assert.equal(judgeChallenge(1, 'c1-outcome', 'sink'), true);
  assert.equal(judgeChallenge(1, 'c1-outcome', 'float'), false);
  assert.equal(judgeChallenge(9, 'c1-outcome', 'sink'), null);
  assert.equal(judgeChallenge(1, 'x', 'sink'), null);
  assert.equal(judgeChallenge(1, 'c1-outcome', 'toString'), null);
  assert.deepEqual(CHALLENGES.map((c) => c.steps.length), [1, 2, 1]);
  assert.ok(CHALLENGES.every((c) => c.steps.every((s) => s.options.includes(s.correct))));
  const p = challengeProgress(2, { steps: { 'c2-where': { choice: 'under-80', correct: true, attempts: 1 } } });
  assert.deepEqual(p, { steps: [{ id: 'c2-where', unlocked: true, choice: 'under-80', attempts: 1, correct: true }, { id: 'c2-brine', unlocked: true, choice: null, attempts: 0, correct: false }], allCorrect: false });
  assert.ok(!JSON.stringify(deriveView(challenge1).challenge).includes('sink'), 'the correct option id is not in the view');
  assert.deepEqual(challengeProgress(9, {}), { steps: [], allCorrect: false });
});

test('K. RESTART from any phase returns the initial state and keeps nothing', () => {
  for (const [phase, state] of Object.entries(CHECKPOINTS)) {
    const r = ok(state, { type: 'RESTART' });
    assert.deepEqual(r.state, createInitialState(), `restart from ${phase}`);
    assert.deepEqual(r.transitions, ['welcome']);
    assert.equal(r.state.seq, 0);
  }
});

test('L. nothing is mutated: frozen states take every action without throwing and stay unchanged', () => {
  const battery = [START, BEGIN, ADD, REMOVE, PUT_BLOCK, put('wood'), put('stone'), OUT, record(1), record(2), select('brine'), select('oil'), CONTINUE,
    answer('stayMass', 'larger'), answer('firstDrop', 'float'), conclude({ level: 'B', freeText: 'ab' }), choose(1, 'c1-outcome', 'sink'), choose(2, 'c2-where', 'under-80'), choose(3, 'c3-reason', 'volume-spread'),
    { type: 'RESTART' }, { type: 'NOPE' }, null, undefined, 'START'];
  for (const [phase, state] of Object.entries(CHECKPOINTS)) {
    const snapshot = JSON.stringify(state);
    const frozen = deepFreeze(structuredClone(state));
    for (const a of battery) {
      const r = reduce(frozen, a);
      assert.equal(JSON.stringify(frozen), snapshot, `${phase} mutated by ${JSON.stringify(a)}`);
      if (r.accepted) assert.notStrictEqual(r.state, frozen);
    }
    deriveView(frozen);
    assert.equal(JSON.stringify(frozen), snapshot);
  }
  assert.equal(reduce(initial, null).reason, 'unknown-action');
  assert.equal(reduce(initial, { type: 'NOPE' }).reason, 'unknown-action');
  assert.equal(reduce(initial, 'START').reason, 'unknown-action');
});

test('M. operability: what the interface may offer in each bench phase', () => {
  const v = (s) => deriveView(s).controls;
  assert.deepEqual(v(trial1).ballast, { locked: false, canAdd: true, canRemove: true });
  assert.equal(v(trial1).liquid.locked, true);
  assert.equal(v(trial1).objects.block.putIn, true);
  assert.equal(v(trial1).objects.block.takeOut, false);
  const inTank = run(trial1, PUT_BLOCK);
  assert.equal(v(inTank).ballast.locked, true);
  assert.equal(v(inTank).objects.block.takeOut, true);
  assert.equal(v(inTank).objects.block.where, 'tank');
  assert.equal(v(trial2Switch).liquid.locked, false);
  assert.equal(v(trial2Test).liquid.locked, true);
  assert.equal(v(compare).objects.block.available, false);
  assert.equal(v(concept).ballast.locked, true);
  assert.deepEqual(v(trial1).liquid.options, ['water', 'brine']);
  assert.deepEqual(v(run(trial1, REMOVE)).ballast, { locked: false, canAdd: true, canRemove: false });
});

test('N. static guards: engine and challenges hold no interface, no wording, no formulas and no second copy of the science', () => {
  const dir = fileURLToPath(new URL('../assets/buoyancy-guided/', import.meta.url));
  const code = (file) => fs.readFileSync(path.join(dir, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');
  const engine = code('engine.js'), challenges = code('challenges.js');
  for (const [name, src] of [['engine.js', engine], ['challenges.js', challenges]]) {
    for (const word of ['document', 'window', 'localStorage', 'sessionStorage', 'innerHTML', 'querySelector', 'classList', 'class=', 'setTimeout', 'requestAnimationFrame']) assert.ok(!src.includes(word), `${name} must not contain "${word}"`);
    assert.ok(!/[㐀-鿿]/.test(src), `${name} must not hold learner wording`);
  }
  assert.ok(!/\b(massG|volumeCm3|mass|volume|density|Density)\s*\/\s*[\w.]/.test(engine), 'engine must not divide mass, volume or density');
  assert.ok(!/\/\s*(massG|volumeCm3|volume|liquidDensity|objectDensity)\b/.test(engine), 'engine must not divide by a physical quantity');
  assert.equal(engine.match(/Math\.round/g)?.length, 1, 'exactly one display conversion');
  assert.equal(engine.match(/\*\s*100\b/g)?.length, 1);
  assert.ok(/function toImmersionPercent[\s\S]{0,200}Math\.round\(rawFraction \* 100\)/.test(engine));
  assert.ok(!/0\.92|1\.2\b|\b1\.0\b|density\s*:/.test(challenges), 'challenges.js must not copy a liquid density');
  assert.ok(/from '\.\/model\.js'/.test(engine));
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js') && !['model.js', 'engine.js'].includes(f))) {
    const src = code(file);
    assert.ok(!/\boutcomeIn\b|\brelation\(|\bdensity\(|immersionFraction\s*[:=]/.test(src), `${file} must not decide physics`);
  }
});

console.log(`\nbuoyancy-guided engine: ${tests} tests passed`);
