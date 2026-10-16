// B4 gate: progress saving for the guided acid–base lab (Pilot #4). Pure, no DOM: storage is a stub.
import assert from 'node:assert/strict';
import * as P from '../assets/acid-base-guided/persist.js';
import { createInitialState, reduce, compareStatus, notebookIsReady } from '../assets/acid-base-guided/engine.js';
import { ATTEMPTS_MAX, TEXT_MAX } from '../assets/acid-base-guided/challenges.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };

const BLUE = 'blue-litmus', RED = 'red-litmus';
function run(state, ...actions) {
  for (const a of actions) {
    const r = reduce(state, a);
    assert.equal(r.accepted, true, `${JSON.stringify(a)} rejected in ${state.phase}: ${r.reason}`);
    state = r.state;
  }
  return state;
}
const dip = (sampleId, indicatorId) => ({ type: 'DIP', sampleId, indicatorId });
const answer = (compare, question, value) => ({ type: 'ANSWER_COMPARE', compare, question, answer: value });
const save = (fields) => ({ type: 'SAVE_CONCLUSION', fields });
const pick = (id, step, choice) => ({ type: 'ANSWER_CHALLENGE', id, step, choice });
const CONT = { type: 'CONTINUE' };
const RIGHT_A = { level: 'A', acidicSample: 'B', neutralSample: 'C', basicSample: 'A' };

const at = {
  trial1: () => run(createInitialState(), { type: 'START' }, { type: 'BEGIN' }),
  compare1: () => run(at.trial1(), dip('A', BLUE), dip('B', BLUE), dip('C', BLUE), CONT),
  trial2: () => run(at.compare1(), answer('c1', 'patternCount', 'two'), answer('c1', 'evidenceSufficiency', 'need-more-evidence'), CONT),
  compare2: () => run(at.trial2(), dip('A', RED), dip('B', RED), dip('C', RED), CONT),
  concept: () => run(at.compare2(), answer('c2', 'distinguishability', 'all-distinct'), answer('c2', 'unchangedSample', 'C'), CONT),
  ph: () => run(at.concept(), { type: 'REVEAL_PH' }),
  notebook: () => run(at.ph(), CONT),
  'challenge-1': () => run(at.notebook(), save(RIGHT_A), CONT),
  'challenge-2': () => run(at['challenge-1'](), pick(1, 'c1-class', 'neutral'), pick(1, 'c1-class', 'acidic'), CONT),
  'challenge-3': () => run(at['challenge-2'](), pick(2, 'c2-enough', 'not-enough'), pick(2, 'c2-next', 'red-litmus'), CONT),
  complete: () => run(at['challenge-3'](), pick(3, 'c3-claim', 'never-basic'), pick(3, 'c3-claim', 'cannot-rule-out-basic'), pick(3, 'c3-next', 'litmus-pair'),
    { type: 'SAVE_CHALLENGE_NOTE', id: 3, text: '因為酚酞有自己的變色範圍' }, CONT),
};
const roundTrip = (state) => P.restore(P.serialize(state));
const saved = (state) => JSON.parse(P.serialize(state));
const restoreObj = (obj) => P.restore(JSON.stringify(obj));
/** The parts of a state that a save carries, as JSON; `correct` is runtime-only and rebuilt by the replay. */
const comparable = (st) => JSON.parse(JSON.stringify(st));

test('storage key and version', () => {
  assert.equal(P.STORAGE_KEY, 'bhcs-acid-base-guided:v1');
  assert.equal(P.VERSION, 1);
});

test('serialize writes learner inputs only: no result, colour, kind, pH, correct, ready or mapping', () => {
  const s = saved(at.complete());
  assert.deepEqual(Object.keys(s).sort(), ['challenges', 'compare', 'conceptPart', 'conclusion', 'layout', 'phase', 'records', 'v']);
  assert.deepEqual(s.records[0], { sampleId: 'A', indicatorId: BLUE });
  assert.ok(s.records.every((r) => Object.keys(r).sort().join() === 'indicatorId,sampleId'));
  assert.deepEqual(s.challenges[1], { steps: { 'c1-class': { choice: 'acidic', attempts: 2 } } });
  assert.deepEqual(Object.keys(s.challenges[3]).sort(), ['note', 'steps']);
  const text = P.serialize(at.complete());
  for (const bad of ['"result"', 'resultColor', '"kind"', 'ph10', '"correct"', 'allCorrect', '"ready"', 'expected', 'mapping', 'turns-', 'stays-', 'startColor']) {
    assert.ok(!text.includes(bad), `the save contains ${bad}`);
  }
  // before the challenges no class name is written at all (a class word later is only a challenge choice the learner made)
  const early = P.serialize(run(at.notebook(), save(RIGHT_A)));
  for (const kind of ['"acidic"', '"neutral"', '"basic"']) assert.ok(!early.includes(kind), `the notebook save names ${kind}`);
  // the learner's own Level A answers may be kept (they are answers, not a key)
  assert.deepEqual([s.conclusion.acidicSample, s.conclusion.neutralSample, s.conclusion.basicSample], ['B', 'C', 'A']);
});

test('a full save restores Complete, with every answer and the note', () => {
  const live = at.complete();
  const r = roundTrip(live);
  assert.equal(r.phase, 'complete'); assert.equal(r.checkpoint, 'complete'); assert.equal(r.floor, 'challenge-3');
  assert.deepEqual(comparable(r.state), comparable(live));
});

test('mid-flow saves restore each major phase as it was', () => {
  for (const phase of ['trial1', 'compare1', 'trial2', 'compare2', 'concept', 'notebook', 'challenge-1', 'challenge-2', 'challenge-3']) {
    const live = phase === 'trial1' ? run(at.trial1(), dip('B', BLUE)) : at[phase]();
    const r = roundTrip(live);
    assert.equal(r.phase, phase, phase);
    assert.deepEqual(comparable(r.state), comparable(live), phase);
  }
  const ph = roundTrip(at.ph());
  assert.equal(ph.state.conceptPart, 'ph');
  assert.equal(roundTrip(at.concept()).state.conceptPart, 'naming');
});

test('partial trials: one blue cup, all blue cups, one red cup', () => {
  let r = roundTrip(run(at.trial1(), dip('C', BLUE)));
  assert.equal(r.phase, 'trial1'); assert.deepEqual(r.state.records, [{ sampleId: 'C', indicatorId: BLUE }]);
  r = roundTrip(run(at.trial1(), dip('C', BLUE), dip('A', BLUE), dip('B', BLUE)));
  assert.equal(r.phase, 'trial1'); assert.equal(r.checkpoint, 'compare1'); assert.equal(r.state.records.length, 3);
  r = roundTrip(run(at.trial2(), dip('B', RED)));
  assert.equal(r.phase, 'trial2'); assert.equal(r.checkpoint, 'trial2');
  assert.deepEqual(r.state.records.at(-1), { sampleId: 'B', indicatorId: RED });
});

test('forged record fields are dropped; only { sampleId, indicatorId } survives and observations are rebuilt', () => {
  const s = saved(at.trial1());
  s.records = [{ sampleId: 'B', indicatorId: BLUE, result: 'stays-blue', ph10: 110, kind: 'basic', correct: true }];
  s.phase = 'trial1';
  const r = restoreObj(s);
  assert.deepEqual(r.state.records, [{ sampleId: 'B', indicatorId: BLUE }]);
});

test('records: a duplicate, an unknown id, a third indicator or a red strip out of turn ends the replay; downstream is dropped', () => {
  const base = saved(at.complete());
  const dup = { ...base, records: [base.records[0], base.records[0], ...base.records.slice(1)] };
  let r = restoreObj(dup);
  assert.equal(r.checkpoint, 'trial1'); assert.equal(r.phase, 'trial1'); assert.deepEqual(r.state.records, [base.records[0]]);
  r = restoreObj({ ...base, records: [base.records[0], { sampleId: 'D', indicatorId: BLUE }, ...base.records.slice(1)] });
  assert.equal(r.state.records.length, 1); assert.equal(r.phase, 'trial1');
  r = restoreObj({ ...base, records: [base.records[0], { sampleId: 'B', indicatorId: 'phenolphthalein' }, ...base.records.slice(1)] });
  assert.equal(r.state.records.length, 1);
  // red before blue is finished: only the blue records before it count, nothing after
  r = restoreObj({ ...base, records: [base.records[0], base.records[3], base.records[1], base.records[2], ...base.records.slice(4)] });
  assert.deepEqual(r.state.records, [base.records[0]]); assert.equal(r.phase, 'trial1');
  // blue again after the red trial started
  r = restoreObj({ ...base, records: [...base.records.slice(0, 4), base.records[1], ...base.records.slice(4)] });
  assert.equal(r.checkpoint, 'trial2'); assert.equal(r.phase, 'trial2'); assert.equal(r.state.records.length, 4);
  r = restoreObj({ ...base, records: 'all of them' });
  assert.equal(r.state.records.length, 0); assert.equal(r.phase, 'trial1', 'nothing kept: the floor is the start of the lab, the checkpoint the first trial');
});

test('red-litmus records count only after a complete Trial 1 and a correct Compare 1', () => {
  const base = saved(at.complete());
  const r = restoreObj({ ...base, compare: { ...base.compare, c1: { patternCount: 'three', evidenceSufficiency: 'need-more-evidence' } } });
  assert.equal(r.phase, 'compare1'); assert.equal(r.checkpoint, 'compare1');
  assert.ok(r.state.records.every((x) => x.indicatorId === BLUE));
});

test('an invalid layout, corrupt JSON, another version or a non-object gives null', () => {
  const base = saved(at.trial2());
  for (const layout of [1, -1, '0', null, undefined, 0.5]) assert.equal(restoreObj({ ...base, layout }), null, String(layout));
  for (const raw of ['{', 'null', '[]', '"x"', '42', '', null, undefined]) assert.equal(P.restore(raw), null, String(raw));
  assert.equal(restoreObj({ ...base, v: 2 }), null);
  assert.equal(restoreObj({ ...base, v: '1' }), null);
  assert.notEqual(P.restore(base), null, 'an already-parsed object works too');
});

test('compare answers: allowlisted; a wrong answer is kept but cannot advance; a forged correct flag gains nothing', () => {
  const base = saved(at.complete());
  let r = restoreObj({ ...base, compare: { ...base.compare, c2: { distinguishability: 'two-still-same', unchangedSample: 'C' } } });
  assert.equal(r.phase, 'compare2'); assert.equal(r.state.compare.c2.distinguishability, 'two-still-same');
  assert.equal(compareStatus(r.state).c2.allCorrect, false);
  r = restoreObj({ ...base, compare: { ...base.compare, c2: { distinguishability: 'four', unchangedSample: 'C', correct: true, allCorrect: true } } });
  assert.equal(r.phase, 'compare2'); assert.deepEqual(r.state.compare.c2, { distinguishability: null, unchangedSample: 'C' });
  r = restoreObj({ ...base, compare: { c1: { patternCount: 'two', evidenceSufficiency: 'need-more-evidence', constructor: 'x' }, c2: 'nope' } });
  assert.equal(r.phase, 'compare2');
});

test('concept: naming and ph restore; the notebook (and anything after) is unreachable before the pH reveal', () => {
  const base = saved(at.complete());
  for (const conceptPart of ['naming', 'other', null, 7]) {
    const r = restoreObj({ ...base, conceptPart });
    assert.equal(r.checkpoint, 'concept', String(conceptPart)); assert.equal(r.phase, 'concept');
    assert.equal(r.state.conceptPart, 'naming');
    assert.equal(r.state.conclusion.level, null, 'notebook data is dropped');
    assert.deepEqual(r.state.challenges[1].steps, {});
  }
  assert.equal(restoreObj({ ...saved(at.ph()), phase: 'concept' }).state.conceptPart, 'ph');
});

test('Level A: the mapping is judged again from the records; a wrong choice is kept but the ceiling is the notebook', () => {
  const base = saved(at.complete());
  const r = restoreObj({ ...base, conclusion: { ...base.conclusion, basicSample: 'C' } });
  assert.equal(r.checkpoint, 'notebook'); assert.equal(r.phase, 'notebook');
  assert.equal(r.state.conclusion.basicSample, 'C', 'the learner\'s own (wrong) choice is kept');
  assert.equal(notebookIsReady(r.state), false);
  assert.deepEqual(r.state.challenges[1].steps, {}, 'challenge answers after a notebook that is not ready are dropped');
});

test('Levels B and C: text is clipped; a bad field is dropped alone without taking the good ones down', () => {
  const base = saved(at.complete());
  let r = restoreObj({ ...base, conclusion: { level: 'B', freeText: 'x'.repeat(TEXT_MAX + 30), acidicSample: 'Z' } });
  assert.equal(r.phase, 'complete'); assert.equal(r.state.conclusion.freeText.length, TEXT_MAX); assert.equal(r.state.conclusion.acidicSample, null);
  r = restoreObj({ ...base, conclusion: { level: 'C', evidenceText: '液體B兩張都紅', limitationText: 42, freeText: '寫過的字' } });
  assert.equal(r.phase, 'notebook'); assert.equal(r.state.conclusion.evidenceText, '液體B兩張都紅'); assert.equal(r.state.conclusion.limitationText, '');
  assert.equal(r.state.conclusion.freeText, '寫過的字');
  r = restoreObj({ ...base, conclusion: { level: 'Q', ...RIGHT_A, level2: 'A' } });
  assert.equal(r.state.conclusion.level, 'A');
  r = restoreObj({ ...base, conclusion: { ...base.conclusion, level: 'Q' } });
  assert.equal(r.phase, 'notebook'); assert.equal(r.state.conclusion.level, null); assert.equal(r.state.conclusion.acidicSample, 'B');
  r = restoreObj({ ...base, conclusion: { ...base.conclusion, ready: true, expected: { acidic: 'A' } } });
  assert.ok(!('ready' in r.state.conclusion) && !('expected' in r.state.conclusion));
});

test('challenges: a saved correct flag is ignored and every answer is judged again', () => {
  const base = saved(at.complete());
  const forged = structuredClone(base);
  forged.challenges[1].steps['c1-class'] = { choice: 'basic', attempts: 1, correct: true };
  let r = restoreObj(forged);
  assert.equal(r.checkpoint, 'challenge-1'); assert.equal(r.phase, 'challenge-1');
  assert.deepEqual(r.state.challenges[1].steps['c1-class'], { choice: 'basic', attempts: 1, correct: false });
  assert.deepEqual(r.state.challenges[2].steps, {}, 'later challenges are dropped');
  // the right answers restore whatever the save said about correctness
  const lies = structuredClone(base);
  lies.challenges[2].steps['c2-next'].correct = false;
  r = restoreObj(lies);
  assert.equal(r.phase, 'complete');
  assert.equal(r.state.challenges[2].steps['c2-next'].correct, true);
});

test('challenges: a wrong step 1 drops step 2 and every later challenge; a bogus choice drops that step and everything after', () => {
  const base = saved(at.complete());
  const wrong = structuredClone(base);
  wrong.challenges[2].steps['c2-enough'] = { choice: 'acidic', attempts: 2 };
  let r = restoreObj(wrong);
  assert.equal(r.phase, 'challenge-2');
  assert.deepEqual(Object.keys(r.state.challenges[2].steps), ['c2-enough']);
  assert.deepEqual(r.state.challenges[3].steps, {});
  const bogus = structuredClone(base);
  bogus.challenges[2].steps['c2-next'] = { choice: 'phenolphthalein', attempts: 1 };
  r = restoreObj(bogus);
  assert.equal(r.phase, 'challenge-2'); assert.deepEqual(Object.keys(r.state.challenges[2].steps), ['c2-enough']);
  assert.deepEqual(r.state.challenges[3].steps, {});
  // a later challenge without the earlier one solved
  const gap = structuredClone(base);
  gap.challenges[1].steps = {};
  r = restoreObj(gap);
  assert.equal(r.phase, 'challenge-1'); assert.deepEqual(r.state.challenges[2].steps, {}); assert.deepEqual(r.state.challenges[3].steps, {});
});

test('attempts: safe positive integers only, capped at ATTEMPTS_MAX; anything else drops the step and what follows', () => {
  const base = saved(at.complete());
  const big = structuredClone(base);
  big.challenges[1].steps['c1-class'].attempts = 1e9;
  assert.equal(restoreObj(big).state.challenges[1].steps['c1-class'].attempts, ATTEMPTS_MAX);
  assert.equal(roundTrip(at.complete()).state.challenges[3].steps['c3-claim'].attempts, 2);
  for (const bad of [0, -3, 1.5, '2', null, Number.MAX_SAFE_INTEGER + 2]) {
    const s = structuredClone(base);
    s.challenges[2].steps['c2-enough'].attempts = bad;
    const r = restoreObj(s);
    assert.equal(r.phase, 'challenge-2', String(bad)); assert.deepEqual(r.state.challenges[2].steps, {});
  }
});

test('the Challenge 3 note is kept only once Challenge 3 is solved, and clipped', () => {
  const base = saved(at.complete());
  assert.equal(restoreObj(base).state.challenges[3].note, '因為酚酞有自己的變色範圍');
  const unsolved = structuredClone(base);
  unsolved.challenges[3].steps['c3-next'] = { choice: 'taste', attempts: 1 };
  let r = restoreObj(unsolved);
  assert.equal(r.phase, 'challenge-3'); assert.equal(r.state.challenges[3].note, '');
  const long = structuredClone(base);
  long.challenges[3].note = 'z'.repeat(TEXT_MAX + 5);
  r = restoreObj(long);
  assert.equal(r.phase, 'complete'); assert.equal(r.state.challenges[3].note.length, TEXT_MAX);
  const notText = structuredClone(base);
  notText.challenges[3].note = { text: 'x' };
  r = restoreObj(notText);
  assert.equal(r.phase, 'complete'); assert.equal(r.state.challenges[3].note, '');
});

test('phase ceiling: a claimed phase can never pass what the data proves', () => {
  const claim = (state, phase) => restoreObj({ ...saved(state), phase });
  assert.equal(claim(run(at.compare2(), answer('c2', 'distinguishability', 'all-distinct')), 'complete').phase, 'compare2', 'six records but Compare 2 unfinished');
  assert.equal(claim(at.concept(), 'complete').phase, 'concept', 'no pH reveal');
  assert.equal(claim(at.notebook(), 'complete').phase, 'notebook', 'notebook not ready');
  assert.equal(claim(at['challenge-1'](), 'complete').phase, 'challenge-1');
  assert.equal(claim(run(at['challenge-2'](), pick(2, 'c2-enough', 'not-enough')), 'challenge-3').phase, 'challenge-2');
  assert.equal(claim(run(at.trial1(), dip('A', BLUE)), 'compare1').phase, 'trial1');
});

test('phase floor: a save with later valid data never sends the learner back to redo it', () => {
  const claim = (state, phase) => restoreObj({ ...saved(state), phase });
  let r = claim(at.concept(), 'welcome');
  assert.equal(r.phase, 'compare2'); assert.equal(r.floor, 'compare2'); assert.equal(compareStatus(r.state).c2.allCorrect, true);
  r = claim(at.complete(), 'trial1');
  assert.equal(r.phase, 'challenge-3'); assert.equal(r.floor, 'challenge-3');
  assert.equal(claim(at.ph(), 'compare1').phase, 'concept');
  assert.equal(claim(at['challenge-1'](), 'mission').phase, 'notebook');
  assert.equal(claim(run(at.trial1(), dip('A', BLUE)), 'welcome').phase, 'trial1');
  // a claim between floor and checkpoint is honoured
  r = claim(at.complete(), 'complete');
  assert.equal(r.phase, 'complete');
  // an unknown phase falls back to the floor
  assert.equal(claim(at.complete(), 'nowhere').phase, 'challenge-3');
  assert.equal(claim(at.concept(), undefined).phase, 'compare2');
});

test('restore dispatches nothing outward: it returns { state, phase, checkpoint, floor } and the state is a plain engine state', () => {
  const r = roundTrip(at['challenge-2']());
  assert.deepEqual(Object.keys(r).sort(), ['checkpoint', 'floor', 'phase', 'state']);
  assert.deepEqual(Object.keys(r.state).sort(), Object.keys(createInitialState()).sort());
  assert.equal(r.state.phase, r.phase);
});

// ---- the store ------------------------------------------------------------------------------------------------------

function memory({ throwOn = [] } = {}) {
  const data = new Map(), calls = [];
  return {
    data, calls,
    getItem(k) { calls.push(['get', k]); if (throwOn.includes('get')) throw new Error('blocked'); return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { calls.push(['set', k]); if (throwOn.includes('set')) throw new Error('quota'); data.set(k, String(v)); },
    removeItem(k) { calls.push(['remove', k]); if (throwOn.includes('remove')) throw new Error('blocked'); data.delete(k); },
  };
}

test('store: nothing is saved before the first record; then it saves, and an identical save is not written again', () => {
  const area = memory(), store = P.createStore(area);
  assert.equal(store.key, P.STORAGE_KEY);
  assert.equal(store.save(at.trial1()), false);
  assert.equal(area.data.size, 0);
  const one = run(at.trial1(), dip('A', BLUE));
  assert.equal(store.save(one), true);
  assert.equal(area.data.get(P.STORAGE_KEY), P.serialize(one));
  assert.equal(store.save(one), true);
  assert.equal(area.calls.filter(([c]) => c === 'set').length, 1, 'the same serialization is not rewritten');
  store.save(run(one, dip('B', BLUE)));
  assert.equal(area.calls.filter(([c]) => c === 'set').length, 2);
  assert.equal(store.load().state.records.length, 2);
  assert.equal(store.failed, false);
});

test('store: clear removes the save; the next save writes again', () => {
  const area = memory(), store = P.createStore(area);
  const one = run(at.trial1(), dip('A', BLUE));
  store.save(one);
  assert.equal(store.clear(), true);
  assert.equal(area.data.has(P.STORAGE_KEY), false);
  assert.equal(store.load(), null);
  store.save(one);
  assert.equal(area.data.has(P.STORAGE_KEY), true);
});

test('store: getItem, setItem and removeItem may all throw; the store never does, and `failed` turns true', () => {
  for (const op of ['get', 'set', 'remove']) {
    const store = P.createStore(memory({ throwOn: [op] }));
    const one = run(at.trial1(), dip('A', BLUE));
    assert.doesNotThrow(() => { store.load(); store.save(one); store.clear(); }, op);
    assert.equal(store.failed, true, op);
  }
  const broken = P.createStore(memory({ throwOn: ['get'] }));
  assert.equal(broken.load(), null);
  assert.equal(P.createStore(memory({ throwOn: ['set'] })).save(run(at.trial1(), dip('A', BLUE))), false);
  // a storage area that is missing entirely
  const none = P.createStore({});
  assert.equal(none.load(), null); assert.equal(none.failed, true);
});

console.log(`acid-base-guided persist: ${tests} tests passed`);
