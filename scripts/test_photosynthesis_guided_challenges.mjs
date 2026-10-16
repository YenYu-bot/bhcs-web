import assert from 'node:assert/strict';
import * as C from '../assets/photosynthesis-guided/challenges.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };

test('three challenges exist and the correct option is never first', () => {
  assert.deepEqual(C.CHALLENGES.map((x) => x.id), [1, 2, 3]);
  for (const challenge of C.CHALLENGES) {
    for (const step of challenge.steps) {
      assert.ok(step.options.length >= 2);
      assert.notEqual(step.options[0], step.correct, `${challenge.id}/${step.id}`);
      assert.equal(C.judgeChallenge(challenge.id, step.id, step.correct), true);
    }
  }
});

test('Challenge 1 chooses CO2 rather than more light', () => {
  assert.equal(C.judgeChallenge(1, 'c1-next', 'raise-co2'), true);
  assert.equal(C.judgeChallenge(1, 'c1-next', 'raise-light'), false);
});

test('Challenge 2 keeps light and temperature fixed when testing CO2', () => {
  assert.equal(C.judgeChallenge(2, 'c2-fair', 'change-co2-only'), true);
  assert.equal(C.judgeChallenge(2, 'c2-fair', 'change-all'), false);
});

test('Challenge 3 rejects the universal higher-temperature claim', () => {
  assert.equal(C.judgeChallenge(3, 'c3-claim', 'cannot-say-always'), true);
  assert.equal(C.judgeChallenge(3, 'c3-claim', 'always-faster'), false);
});

test('unknown challenge, step or option is not judgeable', () => {
  assert.equal(C.judgeChallenge(9, 'x', 'y'), null);
  assert.equal(C.judgeChallenge(1, 'missing', 'raise-co2'), null);
  assert.equal(C.judgeChallenge(1, 'c1-next', 'invented'), null);
});

test('challenge progress re-judges choice and never trusts a stored correct flag', () => {
  const p = C.challengeProgress(1, { steps: { 'c1-next': { choice: 'raise-light', attempts: 2, correct: true } } });
  assert.equal(p.steps[0].correct, false);
  assert.equal(p.allCorrect, false);
  const right = C.challengeProgress(1, { steps: { 'c1-next': { choice: 'raise-co2', attempts: 1, correct: false } } });
  assert.equal(right.steps[0].correct, true);
  assert.equal(right.allCorrect, true);
});

test('attempts are bounded and invalid counts become zero', () => {
  assert.equal(C.challengeProgress(1, { steps: { 'c1-next': { choice: 'raise-light', attempts: 1e9 } } }).steps[0].attempts, C.ATTEMPTS_MAX);
  for (const bad of [0, -1, 1.5, '2', null]) {
    assert.equal(C.challengeProgress(1, { steps: { 'c1-next': { choice: 'raise-light', attempts: bad } } }).steps[0].attempts, 0);
  }
});

test('Level A notebook readiness must match derived relations', () => {
  const expected = { trial1Change: 'increase', trial2Change: 'same', alwaysWorks: 'no' };
  assert.equal(C.notebookReady({ level: 'A', ...expected }, expected), true);
  assert.equal(C.notebookReady({ level: 'A', ...expected, alwaysWorks: 'yes' }, expected), false);
  assert.equal(C.notebookReady({ level: 'A', ...expected }, null), false);
});

test('Levels B and C use the minimum written-character gate', () => {
  assert.equal(C.notebookReady({ level: 'B', freeText: '光太強' }), false);
  assert.equal(C.notebookReady({ level: 'B', freeText: '光已不是最少' }), true);
  assert.equal(C.notebookReady({ level: 'C', evidenceText: '7.4到17.4', limitationText: '相對速率' }), true);
  assert.equal(C.notebookReady({ level: 'C', evidenceText: '有差', limitationText: '相對速率' }), false);
});

test('conclusion sanitizing allowlists fields, values and text length', () => {
  const clean = C.sanitizeConclusionFields({
    level: 'A',
    trial1Change: 'increase',
    trial2Change: 'same',
    alwaysWorks: 'no',
    freeText: 'x'.repeat(C.TEXT_MAX + 20),
    ready: true,
    expected: 'answer',
  });
  assert.equal(clean.level, 'A');
  assert.equal(clean.freeText.length, C.TEXT_MAX);
  assert.equal('ready' in clean, false);
  assert.equal('expected' in clean, false);
  assert.equal(C.sanitizeConclusionFields({ trial1Change: 'faster' }), null);
});

console.log(`photosynthesis guided challenges: ${tests} tests passed`);
