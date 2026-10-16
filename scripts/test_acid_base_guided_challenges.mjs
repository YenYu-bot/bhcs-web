// B4 gate: challenge data, judging and the notebook readiness rule for the guided acid–base lab (Pilot #4). Pure, no DOM.
import assert from 'node:assert/strict';
import * as C from '../assets/acid-base-guided/challenges.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };

test('three challenges with fixed step ids and a stable option order', () => {
  assert.deepEqual(C.CHALLENGES.map((c) => c.id), [1, 2, 3]);
  assert.deepEqual(C.CHALLENGES.map((c) => c.steps.map((s) => s.id)), [['c1-class'], ['c2-enough', 'c2-next'], ['c3-claim', 'c3-next']]);
  assert.deepEqual(C.CHALLENGES.flatMap((c) => c.steps.map((s) => [...s.options])), [
    ['neutral', 'acidic', 'not-enough', 'basic'],
    ['acidic', 'basic', 'not-enough', 'neutral'],
    ['repeat-blue', 'red-litmus', 'look-clear', 'guess'],
    ['never-basic', 'cannot-rule-out-basic', 'definitely-acidic', 'definitely-neutral'],
    ['taste', 'color-alone', 'litmus-pair', 'no-more-test'],
  ]);
  assert.ok(Object.isFrozen(C.CHALLENGES) && C.CHALLENGES.every((c) => Object.isFrozen(c) && c.steps.every((s) => Object.isFrozen(s) && Object.isFrozen(s.options))));
  assert.equal(C.CHALLENGES.filter((c) => c.note).map((c) => c.id).join(), '3', 'only Challenge 3 has the optional note');
});

test('the correct option is never the first one shown, and every step has exactly one listed correct option', () => {
  for (const c of C.CHALLENGES) for (const s of c.steps) {
    assert.ok(s.options.includes(s.correct), s.id);
    assert.notEqual(s.options[0], s.correct, `${s.id}: correct shown first`);
    assert.equal(new Set(s.options).size, s.options.length);
  }
  assert.deepEqual(C.CHALLENGES.flatMap((c) => c.steps.map((s) => s.correct)), ['acidic', 'not-enough', 'red-litmus', 'cannot-rule-out-basic', 'litmus-pair']);
});

test('Challenge 2 offers no phenolphthalein distractor; Challenge 3 keeps tasting as a wrong option', () => {
  const all = C.CHALLENGES.flatMap((c) => c.steps.flatMap((s) => s.options));
  assert.ok(!all.some((o) => /phenol/.test(o)));
  assert.equal(C.judgeChallenge(3, 'c3-next', 'taste'), false);
});

test('judging: each challenge, every option; unknown ids and choices give null', () => {
  assert.equal(C.judgeChallenge(1, 'c1-class', 'acidic'), true);
  for (const o of ['neutral', 'not-enough', 'basic']) assert.equal(C.judgeChallenge(1, 'c1-class', o), false);
  assert.equal(C.judgeChallenge(2, 'c2-enough', 'not-enough'), true);
  assert.equal(C.judgeChallenge(2, 'c2-enough', 'basic'), false);
  assert.equal(C.judgeChallenge(2, 'c2-next', 'red-litmus'), true);
  assert.equal(C.judgeChallenge(2, 'c2-next', 'repeat-blue'), false);
  assert.equal(C.judgeChallenge(3, 'c3-claim', 'cannot-rule-out-basic'), true);
  assert.equal(C.judgeChallenge(3, 'c3-claim', 'never-basic'), false);
  assert.equal(C.judgeChallenge(3, 'c3-next', 'litmus-pair'), true);
  for (const [id, step, choice] of [[4, 'c1-class', 'acidic'], ['1', 'c1-class', 'acidic'], [1, 'c2-enough', 'not-enough'], [1, 'constructor', 'acidic'],
    [1, 'c1-class', 'sour'], [1, 'c1-class', null], [1, 'c1-class', 1], [1, 'c1-class', 'toString'], [null, null, null]]) {
    assert.equal(C.judgeChallenge(id, step, choice), null, JSON.stringify([id, step, choice]));
  }
  assert.equal(C.challengeById(9), null); assert.equal(C.stepOf(1, 'nope'), null); assert.equal(C.stepOf(9, 'c1-class'), null);
});

test('emptyChallenges: a fresh object every time, with a note only on Challenge 3', () => {
  assert.deepEqual(C.emptyChallenges(), { 1: { steps: {} }, 2: { steps: {} }, 3: { steps: {}, note: '' } });
  assert.notEqual(C.emptyChallenges(), C.emptyChallenges());
});

test('challengeProgress: a later step unlocks only once the one before is solved; wrong tries are counted', () => {
  let p = C.challengeProgress(2, { steps: {} });
  assert.deepEqual(p.steps.map((s) => [s.id, s.unlocked, s.correct, s.attempts, s.choice]), [['c2-enough', true, false, 0, null], ['c2-next', false, false, 0, null]]);
  p = C.challengeProgress(2, { steps: { 'c2-enough': { choice: 'acidic', attempts: 2 } } });
  assert.deepEqual(p.steps.map((s) => [s.unlocked, s.correct, s.attempts]), [[true, false, 2], [false, false, 0]]);
  p = C.challengeProgress(2, { steps: { 'c2-enough': { choice: 'not-enough', attempts: 3 } } });
  assert.deepEqual(p.steps.map((s) => [s.unlocked, s.correct]), [[true, true], [true, false]]);
  assert.equal(p.allCorrect, false);
  p = C.challengeProgress(2, { steps: { 'c2-enough': { choice: 'not-enough', attempts: 1 }, 'c2-next': { choice: 'red-litmus', attempts: 1 } } });
  assert.equal(p.allCorrect, true);
  assert.deepEqual(C.challengeProgress(9, {}), { steps: [], allCorrect: false });
});

test('solved is judged from the choice: a stored correct flag is ignored, a later step after an unsolved one never counts', () => {
  const lie = C.challengeProgress(1, { steps: { 'c1-class': { choice: 'basic', attempts: 1, correct: true } } });
  assert.equal(lie.steps[0].correct, false); assert.equal(lie.allCorrect, false);
  const skip = C.challengeProgress(3, { steps: { 'c3-next': { choice: 'litmus-pair', attempts: 1 } } });
  assert.deepEqual(skip.steps.map((s) => [s.unlocked, s.correct]), [[true, false], [false, false]]);
  const bogus = C.challengeProgress(1, { steps: { 'c1-class': { choice: 'sour', attempts: 1 } } });
  assert.equal(bogus.steps[0].choice, null);
});

test('attempts: only safe positive integers count, capped at ATTEMPTS_MAX', () => {
  assert.equal(C.ATTEMPTS_MAX, 999); assert.equal(C.HINT_AFTER_ATTEMPTS, 2);
  const at = (attempts) => C.challengeProgress(1, { steps: { 'c1-class': { choice: 'basic', attempts } } }).steps[0].attempts;
  assert.equal(at(3), 3);
  assert.equal(at(5000), C.ATTEMPTS_MAX);
  for (const bad of [0, -1, 1.5, '2', NaN, Infinity, Number.MAX_SAFE_INTEGER + 2, null]) assert.equal(at(bad), 0, String(bad));
});

test('sanitizeConclusionFields: allowed fields with valid values only; text clipped at TEXT_MAX; nothing usable → null', () => {
  assert.equal(C.TEXT_MAX, 1000);
  assert.deepEqual(C.sanitizeConclusionFields({ level: 'C', acidicSample: 'B', neutralSample: null, freeText: 'abc' }), { level: 'C', acidicSample: 'B', neutralSample: null, freeText: 'abc' });
  assert.deepEqual(C.sanitizeConclusionFields({ level: 'D', acidicSample: 'D', basicSample: 'b', evidenceText: 5, ready: true, correct: true, freeText: 'ok' }), { freeText: 'ok' });
  assert.equal(C.sanitizeConclusionFields({ ready: true }), null);
  for (const bad of [null, undefined, 'A', 5, [], ['level']]) assert.equal(C.sanitizeConclusionFields(bad), null);
  assert.equal(C.sanitizeConclusionFields({ limitationText: 'x'.repeat(1500) }).limitationText.length, C.TEXT_MAX);
  assert.deepEqual([...C.LEVELS], ['A', 'B', 'C']);
  assert.deepEqual({ ...C.MAPPING_FIELDS }, { acidicSample: 'acidic', neutralSample: 'neutral', basicSample: 'basic' });
});

const EXPECTED = { acidic: 'B', neutral: 'C', basic: 'A' };
const conclusion = (fields) => ({ level: null, acidicSample: null, neutralSample: null, basicSample: null, freeText: '', evidenceText: '', limitationText: '', ...fields });

test('Level A is ready only when all three choices match the expected mapping', () => {
  assert.equal(C.notebookReady(conclusion({ level: 'A', acidicSample: 'B', neutralSample: 'C', basicSample: 'A' }), EXPECTED), true);
  assert.equal(C.notebookReady(conclusion({ level: 'A', acidicSample: 'A', neutralSample: 'A', basicSample: 'A' }), EXPECTED), false, 'every field filled is not enough');
  assert.equal(C.notebookReady(conclusion({ level: 'A', acidicSample: 'B', neutralSample: 'C', basicSample: null }), EXPECTED), false);
  assert.equal(C.notebookReady(conclusion({ level: 'A', acidicSample: 'B', neutralSample: 'A', basicSample: 'C' }), EXPECTED), false);
  assert.equal(C.notebookReady(conclusion({ level: 'A', acidicSample: 'B', neutralSample: 'C', basicSample: 'A' }), null), false, 'no mapping, no readiness');
  assert.equal(C.notebookReady(conclusion({ level: 'A', acidicSample: null, neutralSample: null, basicSample: null }), { acidic: null, neutral: null, basic: null }), false);
  // the mapping is whatever the engine derives: a different layout's answer is just as valid
  assert.equal(C.notebookReady(conclusion({ level: 'A', acidicSample: 'C', neutralSample: 'A', basicSample: 'B' }), { acidic: 'C', neutral: 'A', basic: 'B' }), true);
});

test('Level B needs 4 non-space characters; Level C needs both fields; no level is never ready', () => {
  assert.equal(C.MIN_WRITTEN, 4);
  assert.equal(C.notebookReady(conclusion({ level: 'B', freeText: ' a b c ' }), EXPECTED), false);
  assert.equal(C.notebookReady(conclusion({ level: 'B', freeText: '兩種試紙' }), EXPECTED), true);
  assert.equal(C.notebookReady(conclusion({ level: 'C', evidenceText: '液體B兩張都紅' }), EXPECTED), false);
  assert.equal(C.notebookReady(conclusion({ level: 'C', limitationText: '不是精密讀值' }), EXPECTED), false);
  assert.equal(C.notebookReady(conclusion({ level: 'C', evidenceText: '液體B兩張都紅', limitationText: '不是精密讀值' }), EXPECTED), true);
  assert.equal(C.notebookReady(conclusion({ acidicSample: 'B', neutralSample: 'C', basicSample: 'A' }), EXPECTED), false);
  assert.equal(C.notebookReady(null, EXPECTED), false);
  assert.equal(C.written('\n\t ab c'), false); assert.equal(C.written('abcd'), true); assert.equal(C.written(1234), false);
});

console.log(`acid-base-guided challenges: ${tests} tests passed`);
