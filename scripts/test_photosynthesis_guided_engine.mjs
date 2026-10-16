import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as E from '../assets/photosynthesis-guided/engine.js';
import * as M from '../assets/photosynthesis-guided/model.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const root = fileURLToPath(new URL('..', import.meta.url));
const CONT = { type: 'CONTINUE' };
const obs = { type: 'OBSERVE' };
const setLight = (value) => ({ type: 'SET_LIGHT', value });
const answer = (compare, question, answer) => ({ type: 'ANSWER_COMPARE', compare, question, answer });

function deepFreeze(o) {
  if (!o || typeof o !== 'object' || Object.isFrozen(o)) return o;
  Object.freeze(o);
  for (const v of Object.values(o)) deepFreeze(v);
  return o;
}
function step(state, action) {
  const frozen = deepFreeze(structuredClone(state));
  const snap = JSON.stringify(frozen);
  const r = E.reduce(frozen, action);
  assert.equal(JSON.stringify(frozen), snap, 'reducer mutated input');
  return r;
}
function run(state, ...actions) {
  let s = state;
  for (const a of actions) {
    const r = step(s, a);
    assert.equal(r.accepted, true, `${JSON.stringify(a)} refused in ${s.phase}: ${r.reason}`);
    s = r.state;
  }
  return s;
}
function refuse(state, action, reason) {
  const r = step(state, action);
  assert.equal(r.accepted, false);
  assert.equal(r.reason, reason);
  return r;
}
const startTrial1 = () => run(E.createInitialState(), { type: 'START' }, { type: 'BEGIN' });
const afterT1Low = () => run(startTrial1(), obs, CONT);
const atCompare1 = () => run(afterT1Low(), setLight(60), obs, CONT);
const passCompare1 = (s = atCompare1()) => run(s,
  answer('c1', 'rateChange', 'increase'),
  answer('c1', 'claim', 'context-only'),
  CONT
);
const atTrial2Medium = () => run(passCompare1(), CONT);
const afterT2Medium = () => run(atTrial2Medium(), obs, CONT);
const atCompare2 = () => run(afterT2Medium(), setLight(100), obs, CONT);
const passCompare2 = (s = atCompare2()) => run(s,
  answer('c2', 'rateChange', 'same'),
  answer('c2', 'reason', 'other-condition-short'),
  CONT
);
const atConcept = () => run(passCompare2(), CONT);

test('initial state contains only source / learner fields', () => {
  const s = E.createInitialState();
  assert.deepEqual(s, {
    phase: 'welcome',
    conditions: null,
    records: [],
    compare: {
      c1: { rateChange: null, claim: null },
      c2: { rateChange: null, reason: null },
    },
    conclusion: {
      level: null,
      trial1Change: null,
      trial2Change: null,
      alwaysWorks: null,
      freeText: '',
      evidenceText: '',
      limitationText: '',
    },
    challenges: {
      1: { steps: {} },
      2: { steps: {} },
      3: { steps: {}, note: '' },
    },
  });
  const json = JSON.stringify(s);
  for (const key of ['rate', 'oxygen', 'factors', 'limit', 'correct', 'expected', 'score']) {
    assert.ok(!json.includes(`"${key}"`), key);
  }
});

test('welcome -> mission -> Trial 1 starts at the fixed low-light condition', () => {
  let s = E.createInitialState();
  refuse(s, { type: 'BEGIN' }, 'wrong-phase');
  let r = step(s, { type: 'START' });
  assert.equal(r.accepted, true);
  assert.equal(r.state.phase, 'mission');
  assert.equal(r.state.conditions, null);
  r = step(r.state, { type: 'BEGIN' });
  assert.equal(r.state.phase, 'trial1-low-light');
  assert.deepEqual(r.state.conditions, M.trialCondition('t1-low-light'));
  assert.deepEqual(r.transitions, [{ from: 'mission', to: 'trial1-low-light' }]);
});

test('Trial 1 low observation writes raw conditions only and gates continuation', () => {
  let s = startTrial1();
  refuse(s, CONT, 'locked');
  refuse(s, setLight(60), 'wrong-phase');
  let r = step(s, obs);
  assert.deepEqual(r.events, [{ type: 'record-written', trialId: 't1-low-light' }]);
  assert.deepEqual(r.state.records, [{ trialId: 't1-low-light', light: 15, co2: 1000, temperature: 25 }]);
  assert.equal(E.trialRecorded(r.state, 't1-low-light'), true);
  s = r.state;
  refuse(s, obs, 'already-recorded');
  r = step(s, CONT);
  assert.equal(r.state.phase, 'trial1-higher-light');
  assert.deepEqual(r.state.conditions, { light: 15, co2: 1000, temperature: 25 });
});

test('Trial 1 higher-light requires the learner to set the intended Guided light level', () => {
  let s = afterT1Low();
  refuse(s, obs, 'wrong-condition');
  refuse(s, setLight(50), 'invalid');
  s = run(s, setLight(100));
  refuse(s, obs, 'wrong-condition');
  s = run(s, setLight(60), obs);
  const o = E.observationFor(s, 't1-higher-light');
  assert.ok(o.rate > E.observationFor(s, 't1-low-light').rate);
  assert.equal(o.limit, 'light');
  const r = step(s, CONT);
  assert.equal(r.state.phase, 'compare1');
  assert.equal(r.state.conditions, null);
});

test('Compare 1 evidence is rebuilt from records and says only this condition supports an increase', () => {
  const s = atCompare1();
  const e = E.compare1Evidence(s);
  assert.equal(e.controlled.onlyLightChanged, true);
  assert.equal(e.before.light, 15);
  assert.equal(e.after.light, 60);
  assert.equal(e.before.co2, e.after.co2);
  assert.equal(e.before.temperature, e.after.temperature);
  assert.deepEqual(E.expectedCompare1(s), { rateChange: 'increase', claim: 'context-only' });
  assert.equal(E.compareStatus(s).c1.allCorrect, false);
});

test('Compare 1 gate rejects universal overclaim and opens Trial 2 setup only after both answers are correct', () => {
  let s = atCompare1();
  s = run(s,
    answer('c1', 'rateChange', 'increase'),
    answer('c1', 'claim', 'always-more-light')
  );
  refuse(s, CONT, 'locked');
  s = run(s, answer('c1', 'claim', 'context-only'));
  const r = step(s, CONT);
  assert.equal(r.state.phase, 'trial2-setup');
  assert.equal(r.state.conditions, null);
});

test('Trial 2 setup changes the background condition before the next observation', () => {
  const setup = passCompare1();
  const r = step(setup, CONT);
  assert.equal(r.state.phase, 'trial2-medium-light');
  assert.deepEqual(r.state.conditions, M.trialCondition('t2-medium-light'));
  refuse(setup, obs, 'wrong-phase');
});

test('Trial 2 medium then high light yields the plateau contrast', () => {
  let s = atTrial2Medium();
  s = run(s, obs, CONT);
  assert.equal(s.phase, 'trial2-high-light');
  assert.deepEqual(s.conditions, { light: 60, co2: 150, temperature: 25 });
  refuse(s, obs, 'wrong-condition');
  s = run(s, setLight(100), obs);
  const c = E.observationFor(s, 't2-medium-light');
  const d = E.observationFor(s, 't2-high-light');
  assert.equal(M.classifyRateChange(c.rate, d.rate), 'same');
  assert.equal(c.limit, 'co2');
  assert.equal(d.limit, 'co2');
  s = run(s, CONT);
  assert.equal(s.phase, 'compare2');
});

test('Compare 2 expectation comes from evidence: stronger light, same rate, another condition lower', () => {
  const s = atCompare2();
  const e = E.compare2Evidence(s);
  assert.equal(e.controlled.onlyLightChanged, true);
  assert.ok(e.after.light > e.before.light);
  assert.deepEqual(E.expectedCompare2(s), { rateChange: 'same', reason: 'other-condition-short' });
});

test('Compare 2 stays locked on wrong causal claims, then opens inference', () => {
  let s = atCompare2();
  s = run(s,
    answer('c2', 'rateChange', 'same'),
    answer('c2', 'reason', 'light-no-effect')
  );
  refuse(s, CONT, 'locked');
  s = run(s, answer('c2', 'reason', 'other-condition-short'));
  const r = step(s, CONT);
  assert.equal(r.state.phase, 'inference');
  assert.equal(r.state.conditions, null);
});

test('formal concept is a separate phase after inference', () => {
  const inference = passCompare2();
  assert.equal(inference.phase, 'inference');
  assert.equal(E.conceptEvidence(inference), null);
  const r = step(inference, CONT);
  assert.equal(r.state.phase, 'concept');
  assert.deepEqual(r.transitions, [{ from: 'inference', to: 'concept' }]);
  const ce = E.conceptEvidence(r.state);
  assert.deepEqual(ce.compare1, { rateChange: 'increase', claim: 'context-only' });
  assert.deepEqual(ce.compare2, { rateChange: 'same', reason: 'other-condition-short' });
  assert.equal(ce.trial1LimitAfterIncrease, 'light');
  assert.equal(ce.trial2LimitAfterIncrease, 'co2');
  assert.deepEqual(E.expectedNotebookRelations(r.state), {
    trial1Change: 'increase',
    trial2Change: 'same',
    alwaysWorks: 'no',
  });
  const notebook = step(r.state, CONT);
  assert.equal(notebook.accepted, true);
  assert.equal(notebook.state.phase, 'notebook');
});

test('all four records contain only raw trial conditions; derived fields are not stored', () => {
  const s = atConcept();
  assert.deepEqual(s.records, [
    { trialId: 't1-low-light', light: 15, co2: 1000, temperature: 25 },
    { trialId: 't1-higher-light', light: 60, co2: 1000, temperature: 25 },
    { trialId: 't2-medium-light', light: 60, co2: 150, temperature: 25 },
    { trialId: 't2-high-light', light: 100, co2: 150, temperature: 25 },
  ]);
  const text = JSON.stringify(s.records);
  for (const k of ['rate', 'oxygen', 'factors', 'limit', 'correct', 'expected']) assert.ok(!text.includes(`"${k}"`), k);
});

test('forged derived values on records are ignored by every comparison', () => {
  const clean = atCompare2();
  const forged = structuredClone(clean);
  forged.records = forged.records.map((r) => ({
    ...r,
    rate: 999,
    limit: 'light',
    factors: { light: 0, co2: 1, temperature: 1 },
    correct: true,
  }));
  assert.deepEqual(E.expectedCompare1(forged), E.expectedCompare1(clean));
  assert.deepEqual(E.expectedCompare2(forged), E.expectedCompare2(clean));
  assert.equal(E.observationFor(forged, 't2-high-light').limit, 'co2');
});

test('invalid compare actions, light changes and unknown actions are refused', () => {
  const s = atCompare1();
  for (const a of [
    answer('c2', 'rateChange', 'same'),
    answer('c1', 'missing', 'increase'),
    answer('c1', 'rateChange', 'faster'),
    answer('c1', 'rateChange', 1),
  ]) refuse(s, a, a.compare === 'c2' ? 'wrong-phase' : 'invalid');
  refuse(startTrial1(), { type: 'SET_LIGHT', value: 60 }, 'wrong-phase');
  refuse(afterT1Low(), { type: 'SET_LIGHT', value: '60' }, 'invalid');
  refuse(afterT1Low(), { type: 'SET_LIGHT', value: 0 }, 'invalid');
  refuse(E.createInitialState(), { type: 'NOPE' }, 'unknown-action');
  refuse(E.createInitialState(), null, 'unknown-action');
});

test('duplicate / malformed records never become valid evidence', () => {
  const base = atCompare1();
  const duplicate = { ...base, records: [...base.records, { ...base.records[0] }] };
  assert.equal(E.trialRecorded(duplicate, 't1-low-light'), false);
  assert.equal(E.compare1Evidence(duplicate), null);
  const malformed = { ...base, records: base.records.map((r) => r.trialId === 't1-higher-light' ? { ...r, light: 100 } : r) };
  assert.equal(E.trialRecorded(malformed, 't1-higher-light'), false);
  assert.equal(E.expectedCompare1(malformed), null);
});

test('full path reaches Concept exactly once and records four observation events', () => {
  let s = E.createInitialState();
  const seen = [s.phase];
  const events = [];
  const go = (a) => {
    const r = step(s, a);
    assert.equal(r.accepted, true, `${JSON.stringify(a)}: ${r.reason}`);
    s = r.state;
    events.push(...r.events);
    seen.push(...r.transitions.map((t) => t.to));
  };
  for (const a of [
    { type: 'START' }, { type: 'BEGIN' },
    obs, CONT, setLight(60), obs, CONT,
    answer('c1', 'rateChange', 'increase'), answer('c1', 'claim', 'context-only'), CONT,
    CONT, obs, CONT, setLight(100), obs, CONT,
    answer('c2', 'rateChange', 'same'), answer('c2', 'reason', 'other-condition-short'), CONT,
    CONT,
  ]) go(a);
  assert.deepEqual(seen, [
    'welcome', 'mission', 'trial1-low-light', 'trial1-higher-light', 'compare1',
    'trial2-setup', 'trial2-medium-light', 'trial2-high-light', 'compare2', 'inference', 'concept',
  ]);
  assert.equal(events.filter((e) => e.type === 'record-written').length, 4);
  assert.equal(new Set(events.map((e) => e.trialId)).size, 4);
});

test('B4 notebook and three challenges gate the path to Complete without stored answer keys', () => {
  let s = run(atConcept(), CONT);
  assert.equal(s.phase, 'notebook');
  refuse(s, CONT, 'locked');
  s = run(s, { type: 'SAVE_CONCLUSION', fields: {
    level: 'A',
    trial1Change: 'increase',
    trial2Change: 'same',
    alwaysWorks: 'yes',
  } });
  assert.equal(E.notebookIsReady(s), false);
  refuse(s, CONT, 'locked');
  s = run(s, { type: 'SAVE_CONCLUSION', fields: { alwaysWorks: 'no' } });
  assert.equal(E.notebookIsReady(s), true);
  s = run(s, CONT);
  assert.equal(s.phase, 'challenge-1');

  s = run(s, { type: 'ANSWER_CHALLENGE', id: 1, step: 'c1-next', choice: 'raise-light' });
  assert.equal(s.challenges[1].steps['c1-next'].correct, false);
  refuse(s, CONT, 'locked');
  s = run(s, { type: 'ANSWER_CHALLENGE', id: 1, step: 'c1-next', choice: 'raise-co2' }, CONT);
  assert.equal(s.phase, 'challenge-2');

  s = run(s, { type: 'ANSWER_CHALLENGE', id: 2, step: 'c2-fair', choice: 'change-co2-only' }, CONT);
  assert.equal(s.phase, 'challenge-3');
  refuse(s, { type: 'SAVE_CHALLENGE_NOTE', id: 3, text: 'too soon' }, 'locked');
  s = run(s, { type: 'ANSWER_CHALLENGE', id: 3, step: 'c3-claim', choice: 'cannot-say-always' });
  s = run(s, { type: 'SAVE_CHALLENGE_NOTE', id: 3, text: '25°C 的速率比 40°C 高' });
  s = run(s, CONT);
  assert.equal(s.phase, 'complete');
  refuse(s, CONT, 'wrong-phase');

  const serialized = JSON.stringify(s);
  for (const key of ['expected', 'ready']) assert.ok(!serialized.includes(`"${key}"`), key);
});

test('invalid notebook and challenge actions are refused and solved challenge steps lock', () => {
  let s = run(atConcept(), CONT);
  refuse(s, { type: 'SAVE_CONCLUSION', fields: { level: 'Q' } }, 'invalid');
  refuse(s, { type: 'ANSWER_CHALLENGE', id: 1, step: 'c1-next', choice: 'raise-co2' }, 'wrong-phase');
  s = run(s, { type: 'SAVE_CONCLUSION', fields: {
    level: 'A', trial1Change: 'increase', trial2Change: 'same', alwaysWorks: 'no',
  } }, CONT);
  s = run(s, { type: 'ANSWER_CHALLENGE', id: 1, step: 'c1-next', choice: 'raise-co2' });
  refuse(s, { type: 'ANSWER_CHALLENGE', id: 1, step: 'c1-next', choice: 'raise-co2' }, 'locked');
  refuse(s, { type: 'ANSWER_CHALLENGE', id: 2, step: 'c2-fair', choice: 'change-co2-only' }, 'wrong-phase');
});

test('engine source has no learner wording, DOM, storage, analytics or network code', () => {
  const src = fs.readFileSync(`${root}assets/photosynthesis-guided/engine.js`, 'utf8');
  assert.doesNotMatch(src, /[\u4e00-\u9fff]/);
  for (const word of ['document.', 'window.', 'localStorage', 'sessionStorage', 'fetch(', 'XMLHttpRequest', 'bhcsScienceTrack']) {
    assert.ok(!src.includes(word), word);
  }
});

console.log(`photosynthesis-guided engine: ${tests} tests passed`);
