import assert from 'node:assert/strict';
import * as E from '../assets/photosynthesis-guided/engine.js';
import * as A from '../assets/photosynthesis-guided/analytics.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const CONT = { type: 'CONTINUE' };
const answer = (compare, question, value) => ({ type: 'ANSWER_COMPARE', compare, question, answer: value });

function step(state, action) {
  const r = E.reduce(state, action);
  assert.equal(r.accepted, true, `${action.type} refused in ${state.phase}: ${r.reason}`);
  return r;
}
function advance(state, action, events) {
  const r = step(state, action);
  events.push(...A.analyticsFor(r));
  return r.state;
}

test('analytics allowlist and lab id are fixed', () => {
  assert.equal(A.LAB_ID, 'photosynthesis-factor-guided');
  assert.deepEqual(A.ANALYTICS_ACTIONS, [
    'lab_start', 'trial_recorded', 'compare_complete', 'notebook_complete', 'challenge_complete', 'lab_complete',
  ]);
});

test('a complete run emits only the intended anonymous milestones', () => {
  let s = E.createInitialState();
  const events = [];
  s = advance(s, { type: 'START' }, events);
  s = advance(s, { type: 'BEGIN' }, events);
  s = advance(s, { type: 'OBSERVE' }, events);
  s = advance(s, CONT, events);
  s = advance(s, { type: 'SET_LIGHT', value: 60 }, events);
  s = advance(s, { type: 'OBSERVE' }, events);
  s = advance(s, CONT, events);
  s = advance(s, answer('c1', 'rateChange', 'increase'), events);
  s = advance(s, answer('c1', 'claim', 'context-only'), events);
  s = advance(s, CONT, events);
  s = advance(s, CONT, events);
  s = advance(s, { type: 'OBSERVE' }, events);
  s = advance(s, CONT, events);
  s = advance(s, { type: 'SET_LIGHT', value: 100 }, events);
  s = advance(s, { type: 'OBSERVE' }, events);
  s = advance(s, CONT, events);
  s = advance(s, answer('c2', 'rateChange', 'same'), events);
  s = advance(s, answer('c2', 'reason', 'other-condition-short'), events);
  s = advance(s, CONT, events);
  s = advance(s, CONT, events);
  s = advance(s, CONT, events);
  s = advance(s, { type: 'SAVE_CONCLUSION', fields: {
    level: 'A', trial1Change: 'increase', trial2Change: 'same', alwaysWorks: 'no',
  } }, events);
  s = advance(s, CONT, events);
  s = advance(s, { type: 'ANSWER_CHALLENGE', id: 1, step: 'c1-next', choice: 'raise-co2' }, events);
  s = advance(s, CONT, events);
  s = advance(s, { type: 'ANSWER_CHALLENGE', id: 2, step: 'c2-fair', choice: 'change-co2-only' }, events);
  s = advance(s, CONT, events);
  s = advance(s, { type: 'ANSWER_CHALLENGE', id: 3, step: 'c3-claim', choice: 'cannot-say-always' }, events);
  s = advance(s, CONT, events);

  assert.deepEqual(events, [
    'lab_start',
    'trial_recorded', 'trial_recorded',
    'compare_complete',
    'trial_recorded', 'trial_recorded',
    'compare_complete',
    'notebook_complete',
    'challenge_complete', 'challenge_complete', 'challenge_complete',
    'lab_complete',
  ]);
  assert.equal(events.length, 12);
});

test('non-milestone actions emit nothing', () => {
  let s = E.createInitialState();
  let r = step(s, { type: 'START' }); s = r.state;
  assert.deepEqual(A.analyticsFor(r), []);
  r = step(s, { type: 'BEGIN' }); s = r.state;
  assert.deepEqual(A.analyticsFor(r), ['lab_start']);
  r = step(s, { type: 'OBSERVE' });
  assert.deepEqual(A.analyticsFor(r), ['trial_recorded']);
});

test('rejected or malformed reducer results emit nothing', () => {
  assert.deepEqual(A.analyticsFor(null), []);
  assert.deepEqual(A.analyticsFor({ accepted: false, events: [{ type: 'record-written' }], transitions: [{ to: 'complete' }] }), []);
});

test('tracker sends only allowlisted names with the fixed lab id', () => {
  const calls = [];
  const track = A.createTracker({ bhcsScienceTrack: (...args) => calls.push(args) });
  track(['lab_start', 'made-up', 'trial_recorded']);
  assert.deepEqual(calls, [
    ['lab_start', 'photosynthesis-factor-guided'],
    ['trial_recorded', 'photosynthesis-factor-guided'],
  ]);
});

test('tracker never throws when adapter is missing or throws', () => {
  assert.doesNotThrow(() => A.createTracker({})(['lab_start']));
  assert.doesNotThrow(() => A.createTracker({ bhcsScienceTrack() { throw new Error('blocked'); } })(['lab_start']));
});

test('analytics module contains no learner data fields or storage access', () => {
  const text = await import('node:fs').then((fs) => fs.readFileSync(new URL('../assets/photosynthesis-guided/analytics.js', import.meta.url), 'utf8'));
  for (const bad of ['localStorage', 'sessionStorage', 'trialId', 'light', 'co2', 'temperature', 'choice', 'freeText', 'evidenceText', 'limitationText']) {
    assert.ok(!text.includes(bad), bad);
  }
});

console.log(`photosynthesis guided analytics: ${tests} tests passed`);
