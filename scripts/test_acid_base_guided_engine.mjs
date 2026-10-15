// B1 gate: acid–base guided lab state engine (Pilot #4). Pure reducer, no DOM.
import assert from 'node:assert/strict';
import * as E from '../assets/acid-base-guided/engine.js';
import { SAMPLE_IDS } from '../assets/acid-base-guided/model.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };

const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };
// Every reduce() in this file runs on a deep-frozen state: any mutation of the previous state throws.
const step = (state, action) => E.reduce(deepFreeze(state), action);
function run(state, ...actions) {
  for (const a of actions) {
    const r = step(state, a);
    assert.equal(r.accepted, true, `${JSON.stringify(a)} rejected in ${state.phase}: ${r.reason}`);
    state = r.state;
  }
  return state;
}
function refuse(state, action, reason) {
  const r = step(state, action);
  assert.equal(r.accepted, false, `${JSON.stringify(action)} should be refused in ${state.phase}`);
  assert.equal(r.reason, reason, JSON.stringify(action));
  assert.equal(r.state, state, 'a refused action hands back the very same state object');
  assert.deepEqual(r.events, []); assert.deepEqual(r.transitions, []);
  return r;
}
const dip = (sampleId, indicatorId) => ({ type: 'DIP', sampleId, indicatorId });
const answer = (compare, question, value) => ({ type: 'ANSWER_COMPARE', compare, question, answer: value });
const CONT = { type: 'CONTINUE' };
const BLUE = 'blue-litmus', RED = 'red-litmus';

const atTrial1 = () => run(E.createInitialState(), { type: 'START' }, { type: 'BEGIN' });
const atCompare1 = () => run(atTrial1(), dip('A', BLUE), dip('B', BLUE), dip('C', BLUE), CONT);
const atTrial2 = () => run(atCompare1(), answer('c1', 'patternCount', 'two'), answer('c1', 'evidenceSufficiency', 'need-more-evidence'), CONT);
const atCompare2 = () => run(atTrial2(), dip('A', RED), dip('B', RED), dip('C', RED), CONT);
const atConcept = () => run(atCompare2(), answer('c2', 'distinguishability', 'all-distinct'), answer('c2', 'unchangedSample', 'C'), CONT);

test('phases are fixed in order, and the initial state holds only learner inputs', () => {
  assert.deepEqual([...E.PHASES], ['welcome', 'mission', 'trial1', 'compare1', 'trial2', 'compare2', 'concept', 'notebook', 'challenge-1', 'challenge-2', 'challenge-3', 'complete']);
  assert.ok(Object.isFrozen(E.PHASES));
  assert.deepEqual(E.createInitialState(), {
    phase: 'welcome', layout: 0, records: [],
    compare: { c1: { patternCount: null, evidenceSufficiency: null }, c2: { distinguishability: null, unchangedSample: null } },
    conceptPart: null,
  });
  assert.notEqual(E.createInitialState(), E.createInitialState(), 'a fresh object every time');
});

test('START and BEGIN: welcome → mission → trial1, each only from its own phase', () => {
  const s0 = E.createInitialState();
  refuse(s0, { type: 'BEGIN' }, 'wrong-phase');
  const r1 = step(s0, { type: 'START' });
  assert.equal(r1.state.phase, 'mission'); assert.deepEqual(r1.transitions, [{ from: 'welcome', to: 'mission' }]);
  refuse(r1.state, { type: 'START' }, 'wrong-phase');
  const r2 = step(r1.state, { type: 'BEGIN' });
  assert.equal(r2.state.phase, 'trial1'); assert.deepEqual(r2.transitions, [{ from: 'mission', to: 'trial1' }]);
});

test('DIP writes exactly { sampleId, indicatorId } and reports it', () => {
  const r = step(atTrial1(), dip('B', BLUE));
  assert.equal(r.accepted, true);
  assert.deepEqual(r.state.records, [{ sampleId: 'B', indicatorId: BLUE }]);
  assert.deepEqual(Object.keys(r.state.records[0]).sort(), ['indicatorId', 'sampleId']);
  assert.deepEqual(r.events, [{ type: 'record-written', sampleId: 'B', indicatorId: BLUE }]);
  assert.deepEqual(r.transitions, [], 'a dip never moves the phase by itself');
  // extra fields on the action never reach the record
  const r2 = step(atTrial1(), { ...dip('A', BLUE), result: 'turns-red', ph10: 30, correct: true });
  assert.deepEqual(r2.state.records, [{ sampleId: 'A', indicatorId: BLUE }]);
});

test('DIP validation: illegal sample or indicator, wrong trial indicator, wrong phase', () => {
  const s = atTrial1();
  for (const bad of ['D', 'a', '', null, undefined, 0, 'constructor']) refuse(s, dip(bad, BLUE), 'invalid');
  for (const bad of ['cabbage', 'universal', '', null, 'constructor']) refuse(s, dip('A', bad), 'invalid');
  refuse(s, dip('A', 'phenolphthalein'), 'wrong-indicator');
  for (const st of [E.createInitialState(), run(E.createInitialState(), { type: 'START' }), atCompare1(), atCompare2(), atConcept()]) refuse(st, dip('A', BLUE), 'wrong-phase');
});

test('duplicate: the same cup with the same indicator is refused and the state is untouched', () => {
  const s = run(atTrial1(), dip('A', BLUE));
  refuse(s, dip('A', BLUE), 'already-tested');
  const t = run(atTrial2(), dip('C', RED));
  refuse(t, dip('C', RED), 'already-tested');
});

test('order: no red-litmus record before all three blue-litmus records, and no blue litmus in Trial 2', () => {
  let s = atTrial1();
  refuse(s, dip('A', RED), 'wrong-indicator');
  s = run(s, dip('A', BLUE), dip('B', BLUE));
  refuse(s, dip('C', RED), 'wrong-indicator');
  refuse(s, CONT, 'locked');                      // two cups are not a finished trial
  s = run(s, dip('C', BLUE));
  refuse(s, dip('A', RED), 'wrong-indicator');      // still Trial 1 until CONTINUE
  refuse(atTrial2(), dip('A', BLUE), 'wrong-indicator');
  assert.ok(atTrial2().records.every((r) => r.indicatorId === BLUE));
});

test('trialComplete checks every cup has exactly one record with that indicator, not a record count', () => {
  const s = atTrial1();
  assert.equal(E.trialComplete(s, BLUE), false);
  const three = run(s, dip('C', BLUE), dip('A', BLUE), dip('B', BLUE));   // any order
  assert.equal(E.trialComplete(three, BLUE), true);
  assert.equal(E.trialComplete(three, RED), false);
  // forged states: three records but a cup repeated / missing, or three records of the wrong indicator
  const forged = (records) => ({ ...E.createInitialState(), phase: 'trial1', records });
  assert.equal(E.trialComplete(forged([{ sampleId: 'A', indicatorId: BLUE }, { sampleId: 'A', indicatorId: BLUE }, { sampleId: 'B', indicatorId: BLUE }]), BLUE), false);
  assert.equal(E.trialComplete(forged([{ sampleId: 'A', indicatorId: BLUE }, { sampleId: 'B', indicatorId: BLUE }, { sampleId: 'C', indicatorId: RED }]), BLUE), false);
  assert.equal(E.trialComplete(forged([{ sampleId: 'A', indicatorId: BLUE }, { sampleId: 'B', indicatorId: BLUE }, { sampleId: 'C', indicatorId: BLUE }, { sampleId: 'C', indicatorId: BLUE }]), BLUE), false);
  assert.equal(E.trialComplete(forged([{ sampleId: 'A', indicatorId: BLUE }, { sampleId: 'B', indicatorId: BLUE }, { sampleId: 'D', indicatorId: BLUE }]), BLUE), false);
});

test('Compare 1 expectations are recomputed from the blue-litmus records: two patterns, need more evidence', () => {
  assert.equal(E.expectedCompare1(atTrial1()), null, 'nothing to compare before the trial is complete');
  assert.deepEqual(E.expectedCompare1(atCompare1()), { patternCount: 'two', evidenceSufficiency: 'need-more-evidence' });
  assert.deepEqual(Object.fromEntries(Object.entries(E.COMPARE_QUESTIONS.c1).map(([k, v]) => [k, [...v]])),
    { patternCount: ['one', 'two', 'three'], evidenceSufficiency: ['same-class', 'need-more-evidence', 'different-class'] });
});

test('Compare 1 gate: wrong answers stay selectable but CONTINUE is locked until both are right', () => {
  let s = atCompare1();
  refuse(s, CONT, 'locked');
  s = run(s, answer('c1', 'patternCount', 'three'), answer('c1', 'evidenceSufficiency', 'same-class'));
  assert.deepEqual(E.compareStatus(s).c1, {
    patternCount: { answer: 'three', correct: false }, evidenceSufficiency: { answer: 'same-class', correct: false }, allCorrect: false,
  });
  refuse(s, CONT, 'locked');
  s = run(s, answer('c1', 'patternCount', 'two'));
  refuse(s, CONT, 'locked');                                            // one right, one wrong
  s = run(s, answer('c1', 'evidenceSufficiency', 'need-more-evidence'));
  assert.equal(E.compareStatus(s).c1.allCorrect, true);
  const r = step(s, CONT);
  assert.equal(r.state.phase, 'trial2'); assert.deepEqual(r.transitions, [{ from: 'compare1', to: 'trial2' }]);
  // state stores the answers only
  assert.deepEqual(r.state.compare.c1, { patternCount: 'two', evidenceSufficiency: 'need-more-evidence' });
});

test('ANSWER_COMPARE: only in its own compare phase, only listed options', () => {
  const s = atCompare1();
  refuse(s, answer('c2', 'distinguishability', 'all-distinct'), 'wrong-phase');
  refuse(s, answer('c1', 'patternCount', 'four'), 'invalid');
  refuse(s, answer('c1', 'distinguishability', 'all-distinct'), 'invalid');
  refuse(s, answer('c1', 'constructor', 'two'), 'invalid');
  refuse(s, answer('constructor', 'patternCount', 'two'), 'wrong-phase');
  refuse(s, answer('c1', 'patternCount', 2), 'invalid');
  refuse(atTrial1(), answer('c1', 'patternCount', 'two'), 'wrong-phase');
  refuse(atConcept(), answer('c2', 'unchangedSample', 'C'), 'wrong-phase');
});

test('Compare 2 expectations come from both trials: all distinct, and the unchanged cup is found, not assumed', () => {
  assert.equal(E.expectedCompare2(atTrial2()), null);
  assert.deepEqual(E.expectedCompare2(atCompare2()), { distinguishability: 'all-distinct', unchangedSample: 'C' });
  assert.deepEqual(E.recordSignatures(atCompare2()), { A: ['stays-blue', 'turns-blue'], B: ['turns-red', 'stays-red'], C: ['stays-blue', 'stays-red'] });
  assert.deepEqual([...E.COMPARE_QUESTIONS.c2.unchangedSample], [...SAMPLE_IDS]);
});

test('Compare 2 gate: locked until both answers are right, then concept opens on its naming part', () => {
  let s = atCompare2();
  refuse(s, CONT, 'locked');
  s = run(s, answer('c2', 'distinguishability', 'two-still-same'), answer('c2', 'unchangedSample', 'A'));
  refuse(s, CONT, 'locked');
  s = run(s, answer('c2', 'distinguishability', 'all-distinct'));
  refuse(s, CONT, 'locked');
  s = run(s, answer('c2', 'unchangedSample', 'C'));
  const r = step(s, CONT);
  assert.equal(r.state.phase, 'concept'); assert.equal(r.state.conceptPart, 'naming');
  assert.deepEqual(r.transitions, [{ from: 'compare2', to: 'concept' }]);
});

test('REVEAL_PH: naming → ph once, only in concept; a second reveal is refused', () => {
  refuse(atCompare2(), { type: 'REVEAL_PH' }, 'wrong-phase');
  const s = atConcept();
  const r = step(s, { type: 'REVEAL_PH' });
  assert.equal(r.accepted, true); assert.equal(r.state.conceptPart, 'ph'); assert.equal(r.state.phase, 'concept');
  assert.deepEqual(r.transitions, []);
  refuse(r.state, { type: 'REVEAL_PH' }, 'already-revealed');
});

test('B1 stops at concept: nothing reaches notebook, challenges or complete yet', () => {
  const s = run(atConcept(), { type: 'REVEAL_PH' });
  refuse(s, CONT, 'wrong-phase');
  refuse(atConcept(), CONT, 'wrong-phase');
  for (const t of ['SAVE_CONCLUSION', 'ANSWER_CHALLENGE', 'NEXT', undefined]) refuse(s, { type: t }, 'unknown-action');
  refuse(s, null, 'unknown-action');
});

test('full reducer path: welcome → … → concept (naming → ph), each phase entered exactly once', () => {
  let s = E.createInitialState();
  const seen = [s.phase], events = [];
  const go = (a) => { const r = step(s, a); assert.equal(r.accepted, true, `${JSON.stringify(a)}: ${r.reason}`); s = r.state; events.push(...r.events); for (const t of r.transitions) seen.push(t.to); };
  go({ type: 'START' }); go({ type: 'BEGIN' });
  for (const id of SAMPLE_IDS) go(dip(id, BLUE));
  go(CONT);
  go(answer('c1', 'patternCount', 'one')); go(answer('c1', 'evidenceSufficiency', 'different-class'));
  assert.equal(step(s, CONT).accepted, false, 'wrong answers keep Compare 1 locked');
  go(answer('c1', 'patternCount', 'two')); go(answer('c1', 'evidenceSufficiency', 'need-more-evidence')); go(CONT);
  for (const id of SAMPLE_IDS) go(dip(id, RED));
  go(CONT);
  go(answer('c2', 'distinguishability', 'all-same')); go(answer('c2', 'unchangedSample', 'B'));
  assert.equal(step(s, CONT).accepted, false, 'wrong answers keep Compare 2 locked');
  go(answer('c2', 'distinguishability', 'all-distinct')); go(answer('c2', 'unchangedSample', 'C')); go(CONT);
  assert.equal(s.conceptPart, 'naming');
  go({ type: 'REVEAL_PH' });
  assert.deepEqual(seen, ['welcome', 'mission', 'trial1', 'compare1', 'trial2', 'compare2', 'concept']);
  assert.equal(s.conceptPart, 'ph');
  assert.equal(events.filter((e) => e.type === 'record-written').length, 6);
  assert.deepEqual(s.records, [...SAMPLE_IDS.map((id) => ({ sampleId: id, indicatorId: BLUE })), ...SAMPLE_IDS.map((id) => ({ sampleId: id, indicatorId: RED }))]);
});

test('immutability: no reduce() ever mutates its input (every call above ran on a deep-frozen state)', () => {
  const prev = deepFreeze(atTrial1());
  const snapshot = JSON.stringify(prev);
  const r = E.reduce(prev, dip('A', BLUE));
  assert.notEqual(r.state, prev); assert.notEqual(r.state.records, prev.records);
  assert.equal(JSON.stringify(prev), snapshot);
});

test('no answer key in state: verdicts are recomputed, never read back from the state', () => {
  const s = atConcept();
  const keys = JSON.stringify(s);
  for (const k of ['correct', 'expected', 'answerKey', 'score', 'ph10', 'kind', 'result', 'color', 'changed']) assert.ok(!keys.includes(`"${k}"`), `state carries ${k}`);
  // a forged state that claims correctness gains nothing: Compare 1 is judged from the records, not from flags
  const forged = { ...atCompare1(), compare: { c1: { patternCount: 'three', evidenceSufficiency: 'same-class', correct: true, allCorrect: true }, c2: { distinguishability: null, unchangedSample: null } } };
  assert.equal(E.compareStatus(forged).c1.allCorrect, false);
  refuse(forged, CONT, 'locked');
});

test('forged records: derived fields on a record are ignored by every verdict', () => {
  // B's blue record claims it stayed blue, as if B were basic; the verdict still sees B turn red.
  const lie = { sampleId: 'B', indicatorId: BLUE, result: 'stays-blue', ph10: 110, kind: 'basic', correct: true };
  const s = { ...E.createInitialState(), phase: 'compare1', records: [{ sampleId: 'A', indicatorId: BLUE }, lie, { sampleId: 'C', indicatorId: BLUE }] };
  const o = E.observationFor(s, 'B', BLUE);
  assert.equal(o.ph10, 30); assert.equal(o.kind, 'acidic'); assert.equal(o.result, 'turns-red');
  assert.deepEqual(E.expectedCompare1(s), { patternCount: 'two', evidenceSufficiency: 'need-more-evidence' });
  // if the lie were believed all three cups would match ("one"); the engine does not accept that answer
  const fooled = { ...s, compare: { ...s.compare, c1: { patternCount: 'one', evidenceSufficiency: 'need-more-evidence' } } };
  assert.equal(E.compareStatus(fooled).c1.allCorrect, false);
});

test('a source-only state (records as plain JSON) gives the same verdicts as the live one', () => {
  const live = run(atConcept(), { type: 'REVEAL_PH' });
  const reloaded = JSON.parse(JSON.stringify({ layout: live.layout, records: live.records }));
  const rebuilt = { ...E.createInitialState(), phase: 'compare2', layout: reloaded.layout, records: reloaded.records };
  assert.deepEqual(E.expectedCompare1(rebuilt), E.expectedCompare1(live));
  assert.deepEqual(E.expectedCompare2(rebuilt), E.expectedCompare2(live));
  assert.deepEqual(E.observationsOf(rebuilt), E.observationsOf(live));
});

console.log(`acid-base-guided engine: ${tests} tests passed`);
