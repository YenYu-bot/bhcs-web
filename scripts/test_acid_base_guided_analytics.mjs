// B4 gate: anonymous usage milestones for the guided acid–base lab (Pilot #4). Pure, no DOM: the adapter is a stub.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as A from '../assets/acid-base-guided/analytics.js';
import { createInitialState, reduce } from '../assets/acid-base-guided/engine.js';
import * as P from '../assets/acid-base-guided/persist.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const BLUE = 'blue-litmus', RED = 'red-litmus';
const dip = (sampleId, indicatorId) => ({ type: 'DIP', sampleId, indicatorId });
const answer = (compare, question, value) => ({ type: 'ANSWER_COMPARE', compare, question, answer: value });
const save = (fields) => ({ type: 'SAVE_CONCLUSION', fields });
const pick = (id, step, choice) => ({ type: 'ANSWER_CHALLENGE', id, step, choice });
const CONT = { type: 'CONTINUE' };

/** The whole lab, with wrong tries, notebook typing, the note and refused actions along the way. */
const FULL = [
  { type: 'START' }, { type: 'BEGIN' },
  dip('A', BLUE), dip('A', BLUE), dip('B', BLUE), dip('C', BLUE), CONT,
  answer('c1', 'patternCount', 'one'), CONT, answer('c1', 'patternCount', 'two'), answer('c1', 'evidenceSufficiency', 'need-more-evidence'), CONT,
  dip('A', RED), dip('B', RED), dip('C', RED), CONT,
  answer('c2', 'distinguishability', 'all-distinct'), answer('c2', 'unchangedSample', 'C'), CONT,
  CONT, { type: 'REVEAL_PH' }, CONT,
  save({ level: 'A' }), save({ acidicSample: 'A', neutralSample: 'C', basicSample: 'B' }), CONT, save({ acidicSample: 'B', basicSample: 'A' }), save({ freeText: '我發現第一種試紙' }), CONT,
  pick(1, 'c1-class', 'neutral'), pick(1, 'c1-class', 'basic'), pick(1, 'c1-class', 'acidic'), CONT,
  pick(2, 'c2-enough', 'acidic'), pick(2, 'c2-enough', 'not-enough'), pick(2, 'c2-next', 'red-litmus'), CONT,
  pick(3, 'c3-claim', 'never-basic'), pick(3, 'c3-claim', 'cannot-rule-out-basic'), pick(3, 'c3-next', 'litmus-pair'),
  { type: 'SAVE_CHALLENGE_NOTE', id: 3, text: '因為酚酞有變色範圍' }, CONT, CONT,
];
function play(actions, state = createInitialState()) {
  const sent = [], perAction = [];
  const track = A.createTracker({ bhcsScienceTrack: (...args) => sent.push(args) });
  for (const action of actions) {
    const result = reduce(state, action);
    state = result.state;
    const names = A.analyticsFor(result);
    perAction.push({ action, names });
    track(names);
  }
  return { state, sent, perAction };
}

test('lab id and the allowlist are exact', () => {
  assert.equal(A.LAB_ID, 'acid-base-guided');
  assert.deepEqual([...A.ANALYTICS_ACTIONS], ['lab_start', 'trial_recorded', 'compare_complete', 'notebook_complete', 'challenge_complete', 'lab_complete']);
  assert.ok(Object.isFrozen(A.ANALYTICS_ACTIONS));
});

test('a full run sends exactly 14 milestones, in order', () => {
  const { state, sent } = play(FULL);
  assert.equal(state.phase, 'complete');
  assert.deepEqual(sent.map(([name]) => name), [
    'lab_start', 'trial_recorded', 'trial_recorded', 'trial_recorded', 'compare_complete',
    'trial_recorded', 'trial_recorded', 'trial_recorded', 'compare_complete',
    'notebook_complete', 'challenge_complete', 'challenge_complete', 'challenge_complete', 'lab_complete',
  ]);
  const count = (n) => sent.filter(([name]) => name === n).length;
  assert.deepEqual(['lab_start', 'trial_recorded', 'compare_complete', 'notebook_complete', 'challenge_complete', 'lab_complete'].map(count), [1, 6, 2, 1, 3, 1]);
  assert.equal(sent.length, 14);
});

test('every payload is exactly (milestone name, lab id): no answer, text, sample, indicator, number or class', () => {
  const { sent } = play(FULL);
  for (const args of sent) {
    assert.equal(args.length, 2);
    assert.ok(A.ANALYTICS_ACTIONS.includes(args[0]));
    assert.equal(args[1], A.LAB_ID);
  }
  const text = JSON.stringify(sent);
  for (const bad of ['"A"', '"B"', '"C"', 'blue-litmus', 'red-litmus', 'acidic', 'basic', 'neutral', 'not-enough', 'litmus-pair', 'freeText', '我發現', '酚酞', 'attempts', 'ph', /\d/]) {
    assert.ok(bad instanceof RegExp ? !bad.test(text.replace(/"acid-base-guided"/g, '')) : !text.replace(/"acid-base-guided"/g, '').includes(bad), `payload carries ${bad}`);
  }
});

test('which actions send what: wrong answers, notebook typing, challenge choices, the note and the pH reveal send nothing', () => {
  const { perAction } = play(FULL);
  for (const { action, names } of perAction) {
    if (['ANSWER_COMPARE', 'SAVE_CONCLUSION', 'ANSWER_CHALLENGE', 'SAVE_CHALLENGE_NOTE', 'REVEAL_PH'].includes(action.type)) assert.deepEqual(names, [], JSON.stringify(action));
    if (action.type === 'START') assert.deepEqual(names, []);
  }
  // the moves that do send
  const sending = perAction.filter((x) => x.names.length).map((x) => [x.action.type, x.names.join('+')]);
  assert.deepEqual(sending.filter(([t]) => t === 'CONTINUE').map(([, n]) => n), ['compare_complete', 'compare_complete', 'notebook_complete', 'challenge_complete', 'challenge_complete', 'challenge_complete+lab_complete']);
  assert.deepEqual(sending.find(([t]) => t === 'BEGIN'), ['BEGIN', 'lab_start']);
});

test('refused actions send nothing (a duplicate strip, a locked CONTINUE, a second CONTINUE on Complete)', () => {
  const { perAction } = play(FULL);
  const refused = perAction.filter(({ action }, i) => i > 0 && JSON.stringify(action) === JSON.stringify(perAction[i - 1].action));
  assert.ok(refused.length >= 2);
  for (const r of refused) assert.deepEqual(r.names, []);
  assert.deepEqual(A.analyticsFor({ accepted: false, events: [{ type: 'record-written' }], transitions: [{ to: 'complete' }] }), []);
  assert.deepEqual(A.analyticsFor(null), []);
  assert.deepEqual(A.analyticsFor({ accepted: true, events: 'x', transitions: null }), []);
  assert.deepEqual(A.analyticsFor({ accepted: true, events: [], transitions: [{ to: 'constructor' }, { to: '__proto__' }, 'complete'] }), []);
});

test('restoring a save sends nothing: restore() never touches the adapter', () => {
  const { state } = play(FULL);
  let calls = 0;
  globalThis.window = { bhcsScienceTrack: () => { calls += 1; } };
  try {
    const r = P.restore(P.serialize(state));
    assert.equal(r.phase, 'complete');
    P.createStore({ getItem: () => P.serialize(state), setItem() {}, removeItem() {} }).load();
  } finally { delete globalThis.window; }
  assert.equal(calls, 0);
});

test('the tracker: a missing adapter is a no-op, a throwing one never breaks the lab, unknown names are dropped', () => {
  assert.doesNotThrow(() => A.createTracker(undefined)(['lab_start']));
  assert.doesNotThrow(() => A.createTracker({})(['lab_start']));
  assert.doesNotThrow(() => A.createTracker({ bhcsScienceTrack: 'nope' })(['lab_start']));
  assert.doesNotThrow(() => A.createTracker({ bhcsScienceTrack: () => { throw new Error('offline'); } })(['lab_start', 'lab_complete']));
  const sent = [];
  const track = A.createTracker({ bhcsScienceTrack: (...a) => sent.push(a) });
  track(['answer_correct', 'sample_A', 'acidic_choice', 'pH_value', 'open', 'lab_start', 7, null]);
  track('lab_start');
  track(null);
  assert.deepEqual(sent, [['lab_start', 'acid-base-guided']]);
  // an adapter that throws on the first call still receives the next one
  let n = 0;
  A.createTracker({ bhcsScienceTrack: () => { n += 1; if (n === 1) throw new Error('x'); } })(['lab_start', 'trial_recorded']);
  assert.equal(n, 2);
});

test('analytics.js is the only station module that touches the adapter, and it has no transport of its own', () => {
  const dir = path.join(root, 'assets/acid-base-guided');
  const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const touching = fs.readdirSync(dir).filter((f) => f.endsWith('.js') && strip(fs.readFileSync(path.join(dir, f), 'utf8')).includes('bhcsScienceTrack'));
  assert.deepEqual(touching, ['analytics.js']);
  const src = strip(fs.readFileSync(path.join(dir, 'analytics.js'), 'utf8'));
  for (const bad of ['fetch(', 'sendBeacon', 'XMLHttpRequest', 'gtag', 'dataLayer', 'localStorage', 'import ']) assert.ok(!src.includes(bad), `analytics.js uses ${bad}`);
});

console.log(`acid-base-guided analytics: ${tests} tests passed`);
