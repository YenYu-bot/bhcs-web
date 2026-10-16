import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createInitialState, reduce, compareStatus, observationFor,
} from '../assets/photosynthesis-guided/engine.js';
import {
  TEXT, STEPS, isPreConcept, screenFor, stepNavModel, welcomeModel, ctaFor, coachModel, statusModel,
  dataModel, evidenceModel, benchModel, canSetLight, compareModel, conceptModel, notebookModel,
  challengeModel, completeModel, LATE_TEXT, announcementFor,
} from '../assets/photosynthesis-guided/script.js';

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed++; console.log('✓', name); }
  catch (error) { console.error('✗', name); throw error; }
};
const act = (state, action) => {
  const r = reduce(state, action);
  assert.equal(r.accepted, true, `${action.type}: ${r.reason}`);
  return [r.state, r];
};
const viewBundle = (state) => ({
  screen: screenFor(state), steps: stepNavModel(state), welcome: welcomeModel(state), cta: ctaFor(state),
  coach: coachModel(state), status: statusModel(state), data: dataModel(state), evidence: evidenceModel(state),
  bench: benchModel(state), compare: compareModel(state), concept: conceptModel(state),
  notebook: notebookModel(state), challenge: challengeModel(state), complete: completeModel(state),
});
const FORBIDDEN = /限制因子|最低條件|三項因子中的最低值|最低的一項/;
const noLeak = (state, label) => {
  assert.equal(isPreConcept(state), true, label);
  const text = JSON.stringify(viewBundle(state));
  assert.doesNotMatch(text, FORBIDDEN, `${label}: formal answer leaked`);
  assert.equal(conceptModel(state), null, `${label}: concept model must not exist`);
};

test('shared five-step navigation covers mission, experiment, findings, notebook and challenges', () => {
  assert.deepEqual(STEPS.map((x) => x.label), ['接任務', '動手做', '整理發現', '研究手冊', '挑戰題']);
  let s = createInitialState();
  assert.equal(stepNavModel(s).currentStep, 'mission');
  [s] = act(s, { type: 'START' }); [s] = act(s, { type: 'BEGIN' });
  assert.equal(stepNavModel(s).currentStep, 'experiment');
});

test('welcome and mission state the core question without the formal concept answer', () => {
  let s = createInitialState();
  assert.match(welcomeModel(s).title, /光變強/);
  assert.deepEqual(ctaFor(s), { label: '開始', action: { type: 'START' }, enabled: true });
  noLeak(s, 'welcome');
  [s] = act(s, { type: 'START' });
  assert.match(welcomeModel(s).title, /只改光照/);
  assert.match(welcomeModel(s).sub, /相對速率/);
  noLeak(s, 'mission');
});

test('Trial 1 first observation is fixed at 15% / 1000 ppm / 25°C', () => {
  let s = createInitialState(); [s] = act(s, { type: 'START' }); [s] = act(s, { type: 'BEGIN' });
  assert.equal(s.phase, 'trial1-low-light');
  assert.deepEqual(s.conditions, { light: 15, co2: 1000, temperature: 25 });
  assert.deepEqual(ctaFor(s), { label: TEXT.cta.observe, action: { type: 'OBSERVE' }, enabled: true });
  const b = benchModel(s);
  assert.deepEqual(b.allowedLights, []);
  assert.equal(b.locked, true);
  assert.equal(b.observation, null);
  assert.equal(Object.hasOwn(b, 'limit'), false);
  assert.equal(Object.hasOwn(b, 'factors'), false);
  noLeak(s, 'trial1-low-light');
});

test('Trial 1 higher-light phase requires the 60% control before observation', () => {
  let s = createInitialState(); [s] = act(s, { type: 'START' }); [s] = act(s, { type: 'BEGIN' });
  [s] = act(s, { type: 'OBSERVE' });
  assert.equal(observationFor(s, 't1-low-light').rate.toFixed(1), '7.4');
  [s] = act(s, { type: 'CONTINUE' });
  assert.equal(s.phase, 'trial1-higher-light');
  assert.equal(ctaFor(s).enabled, false);
  assert.deepEqual(benchModel(s).allowedLights, [60]);
  assert.equal(canSetLight(s, 15), false);
  assert.equal(canSetLight(s, 60), true);
  [s] = act(s, { type: 'SET_LIGHT', value: 60 });
  assert.equal(ctaFor(s).enabled, true);
  assert.match(coachModel(s).main, /60%/);
  noLeak(s, 'trial1-higher-light-ready');
});

test('Trial 1 evidence and Compare 1 are derived from the two records', () => {
  let s = createInitialState(); [s] = act(s, { type: 'START' }); [s] = act(s, { type: 'BEGIN' });
  [s] = act(s, { type: 'OBSERVE' }); [s] = act(s, { type: 'CONTINUE' });
  [s] = act(s, { type: 'SET_LIGHT', value: 60 }); [s] = act(s, { type: 'OBSERVE' });
  assert.equal(observationFor(s, 't1-higher-light').rate.toFixed(1), '17.4');
  assert.equal(evidenceModel(s).items.length, 2);
  [s] = act(s, { type: 'CONTINUE' });
  assert.equal(s.phase, 'compare1');
  const m = compareModel(s);
  assert.deepEqual(m.independentVariable, { label: '光照', from: '15%', to: '60%' });
  assert.deepEqual(m.observedResponse, [{ label: '相對產氧', first: '7.4', second: '17.4' }]);
  assert.match(m.procedureNote, /只有光照不同/);
  assert.deepEqual(m.questions.map((q) => q.id), ['rateChange', 'claim']);
  noLeak(s, 'compare1');
});

test('wrong Compare 1 answers nudge but do not unlock the CTA', () => {
  let s = createInitialState(); [s] = act(s, { type: 'START' }); [s] = act(s, { type: 'BEGIN' });
  [s] = act(s, { type: 'OBSERVE' }); [s] = act(s, { type: 'CONTINUE' }); [s] = act(s, { type: 'SET_LIGHT', value: 60 });
  [s] = act(s, { type: 'OBSERVE' }); [s] = act(s, { type: 'CONTINUE' });
  [s] = act(s, { type: 'ANSWER_COMPARE', compare: 'c1', question: 'rateChange', answer: 'same' });
  assert.equal(compareStatus(s).c1.rateChange.correct, false);
  assert.match(compareModel(s).questions[0].feedback.text, /比較兩次/);
  assert.equal(ctaFor(s).enabled, false);
  noLeak(s, 'compare1-wrong');
});

function throughCompare1() {
  let s = createInitialState(); [s] = act(s, { type: 'START' }); [s] = act(s, { type: 'BEGIN' });
  [s] = act(s, { type: 'OBSERVE' }); [s] = act(s, { type: 'CONTINUE' }); [s] = act(s, { type: 'SET_LIGHT', value: 60 });
  [s] = act(s, { type: 'OBSERVE' }); [s] = act(s, { type: 'CONTINUE' });
  [s] = act(s, { type: 'ANSWER_COMPARE', compare: 'c1', question: 'rateChange', answer: 'increase' });
  [s] = act(s, { type: 'ANSWER_COMPARE', compare: 'c1', question: 'claim', answer: 'context-only' });
  return s;
}

test('Trial 2 setup is a separate pre-concept screen and changes CO₂ only before the pair begins', () => {
  let s = throughCompare1();
  assert.equal(ctaFor(s).enabled, true);
  [s] = act(s, { type: 'CONTINUE' });
  assert.equal(s.phase, 'trial2-setup');
  assert.match(welcomeModel(s).title, /CO₂ 較少/);
  assert.equal(screenFor(s).id, 'welcome');
  noLeak(s, 'trial2-setup');
  [s] = act(s, { type: 'CONTINUE' });
  assert.equal(s.phase, 'trial2-medium-light');
  assert.deepEqual(s.conditions, { light: 60, co2: 150, temperature: 25 });
});

test('Trial 2 requires 100% light for the fourth observation and produces the plateau pair', () => {
  let s = throughCompare1(); [s] = act(s, { type: 'CONTINUE' }); [s] = act(s, { type: 'CONTINUE' });
  [s] = act(s, { type: 'OBSERVE' });
  assert.equal(observationFor(s, 't2-medium-light').rate.toFixed(1), '8.3');
  [s] = act(s, { type: 'CONTINUE' });
  assert.equal(s.phase, 'trial2-high-light');
  assert.deepEqual(benchModel(s).allowedLights, [100]);
  assert.equal(canSetLight(s, 60), false);
  assert.equal(canSetLight(s, 100), true);
  [s] = act(s, { type: 'SET_LIGHT', value: 100 }); [s] = act(s, { type: 'OBSERVE' });
  assert.equal(observationFor(s, 't2-high-light').rate.toFixed(1), '8.3');
  noLeak(s, 'trial2-high-light-done');
});

function throughCompare2() {
  let s = throughCompare1(); [s] = act(s, { type: 'CONTINUE' }); [s] = act(s, { type: 'CONTINUE' });
  [s] = act(s, { type: 'OBSERVE' }); [s] = act(s, { type: 'CONTINUE' }); [s] = act(s, { type: 'SET_LIGHT', value: 100 });
  [s] = act(s, { type: 'OBSERVE' }); [s] = act(s, { type: 'CONTINUE' });
  return s;
}

test('Compare 2 shows the 60% -> 100% plateau and asks for the non-light explanation', () => {
  const s = throughCompare2();
  assert.equal(s.phase, 'compare2');
  const m = compareModel(s);
  assert.deepEqual(m.independentVariable, { label: '光照', from: '60%', to: '100%' });
  assert.deepEqual(m.observedResponse, [{ label: '相對產氧', first: '8.3', second: '8.3' }]);
  assert.deepEqual(m.questions.map((q) => q.id), ['rateChange', 'reason']);
  assert.ok(m.questions[1].options.some((o) => o.value === 'other-condition-short' && /另一個條件/.test(o.label)));
  noLeak(s, 'compare2');
});

test('inference still stays pre-concept and does not name the concept', () => {
  let s = throughCompare2();
  [s] = act(s, { type: 'ANSWER_COMPARE', compare: 'c2', question: 'rateChange', answer: 'same' });
  [s] = act(s, { type: 'ANSWER_COMPARE', compare: 'c2', question: 'reason', answer: 'other-condition-short' });
  [s] = act(s, { type: 'CONTINUE' });
  assert.equal(s.phase, 'inference');
  assert.match(welcomeModel(s).sub, /另一個條件更不足/);
  assert.deepEqual(ctaFor(s), { label: TEXT.cta.toConcept, action: { type: 'CONTINUE' }, enabled: true });
  noLeak(s, 'inference');
});

test('Concept is the first view that names the limiting factor and ties it to both experiments', () => {
  let s = throughCompare2();
  [s] = act(s, { type: 'ANSWER_COMPARE', compare: 'c2', question: 'rateChange', answer: 'same' });
  [s] = act(s, { type: 'ANSWER_COMPARE', compare: 'c2', question: 'reason', answer: 'other-condition-short' });
  [s] = act(s, { type: 'CONTINUE' }); [s] = act(s, { type: 'CONTINUE' });
  assert.equal(s.phase, 'concept');
  assert.equal(isPreConcept(s), false);
  assert.deepEqual(ctaFor(s), { label: TEXT.cta.toNotebook, action: { type: 'CONTINUE' }, enabled: true });
  const c = conceptModel(s);
  assert.match(c.heading, /限制因子/);
  const text = JSON.stringify(c);
  assert.match(text, /第一組/); assert.match(text, /7\.4/); assert.match(text, /17\.4/);
  assert.match(text, /第二組/); assert.match(text, /8\.3/);
  assert.match(text, /最低條件是光照/);
  assert.match(text, /最低條件是CO₂/);
  assert.match(text, /相對速率 = 20 × 三項因子中的最低值/);
  assert.match(text, /精密預測公式/);
  assert.equal(statusModel(s).text, '這一階段的觀察與整理已完成。');
});

test('bench adapter sends presentation data only, never factor percentages or an answer key', () => {
  let s = throughCompare1(); [s] = act(s, { type: 'CONTINUE' }); [s] = act(s, { type: 'CONTINUE' });
  const b = benchModel(s);
  assert.deepEqual(Object.keys(b).sort(), ['allowedLights', 'co2', 'light', 'locked', 'observation', 'temperature'].sort());
  assert.equal(JSON.stringify(b).includes('limit'), false);
  assert.equal(JSON.stringify(b).includes('factor'), false);
  assert.equal(JSON.stringify(b).includes('correct'), false);
});

test('accepted actions produce concise announcements; concept name is announced only on concept entry', () => {
  let s = createInitialState(), r;
  [s, r] = act(s, { type: 'START' });
  assert.equal(announcementFor({ result: r, state: s, action: { type: 'START' }, seq: 1 }).text, '任務說明。');
  [s, r] = act(s, { type: 'BEGIN' });
  assert.doesNotMatch(announcementFor({ result: r, state: s, action: { type: 'BEGIN' }, seq: 2 }).text, /限制因子/);
});

test('B4 notebook, challenges and Complete expose only learner-facing view models', () => {
  let s = throughCompare2();
  [s] = act(s, { type: 'ANSWER_COMPARE', compare: 'c2', question: 'rateChange', answer: 'same' });
  [s] = act(s, { type: 'ANSWER_COMPARE', compare: 'c2', question: 'reason', answer: 'other-condition-short' });
  [s] = act(s, { type: 'CONTINUE' }); [s] = act(s, { type: 'CONTINUE' }); [s] = act(s, { type: 'CONTINUE' });
  assert.equal(s.phase, 'notebook');
  [s] = act(s, { type: 'SAVE_CONCLUSION', fields: {
    level: 'A', trial1Change: 'increase', trial2Change: 'same', alwaysWorks: 'no',
  } });
  const book = notebookModel(s);
  assert.equal(book.ready, true);
  assert.match(JSON.stringify(book), /第一組/);
  assert.doesNotMatch(JSON.stringify(book), /"expected"|answerKey/);
  assert.equal(stepNavModel(s).currentStep, 'notebook');
  assert.deepEqual(ctaFor(s), { label: LATE_TEXT.cta.challenge, action: { type: 'CONTINUE' }, enabled: true });

  [s] = act(s, { type: 'CONTINUE' });
  let challenge = challengeModel(s);
  assert.equal(challenge.id, 1);
  assert.equal(challenge.steps[0].options[0].value, 'raise-light');
  assert.notEqual(challenge.steps[0].options[0].value, 'raise-co2');
  [s] = act(s, { type: 'ANSWER_CHALLENGE', id: 1, step: 'c1-next', choice: 'raise-co2' });
  challenge = challengeModel(s);
  assert.equal(challenge.allCorrect, true);
  [s] = act(s, { type: 'CONTINUE' });
  [s] = act(s, { type: 'ANSWER_CHALLENGE', id: 2, step: 'c2-fair', choice: 'change-co2-only' });
  [s] = act(s, { type: 'CONTINUE' });
  [s] = act(s, { type: 'ANSWER_CHALLENGE', id: 3, step: 'c3-claim', choice: 'cannot-say-always' });
  assert.ok(challengeModel(s).note);
  [s] = act(s, { type: 'CONTINUE' });
  assert.equal(s.phase, 'complete');
  assert.equal(stepNavModel(s).currentStep, 'challenge');
  const done = completeModel(s);
  assert.match(done.heading, /完成/);
  assert.equal(done.claims.length, 3);
});

test('script owns wording only and does not touch storage, analytics adapters or network APIs', () => {
  const src = fs.readFileSync(new URL('../assets/photosynthesis-guided/script.js', import.meta.url), 'utf8');
  for (const bad of ['localStorage', 'sessionStorage', 'bhcsScienceTrack', 'fetch(', 'XMLHttpRequest']) assert.ok(!src.includes(bad), bad);
});

console.log(`photosynthesis guided script: ${passed} tests passed`);
