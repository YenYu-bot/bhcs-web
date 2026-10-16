import assert from 'node:assert/strict';
import * as E from '../assets/photosynthesis-guided/engine.js';
import * as P from '../assets/photosynthesis-guided/persist.js';
import { TEXT_MAX, ATTEMPTS_MAX } from '../assets/photosynthesis-guided/challenges.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const CONT = { type: 'CONTINUE' };
const answer = (compare, question, value) => ({ type: 'ANSWER_COMPARE', compare, question, answer: value });
const pick = (id, step, choice) => ({ type: 'ANSWER_CHALLENGE', id, step, choice });

function run(state, ...actions) {
  let s = state;
  for (const a of actions) {
    const r = E.reduce(s, a);
    assert.equal(r.accepted, true, `${a.type} refused in ${s.phase}: ${r.reason}`);
    s = r.state;
  }
  return s;
}

const at = {};
at.t1low = () => run(E.createInitialState(), { type: 'START' }, { type: 'BEGIN' });
at.t1higher = () => run(at.t1low(), { type: 'OBSERVE' }, CONT);
at.compare1 = () => run(at.t1higher(), { type: 'SET_LIGHT', value: 60 }, { type: 'OBSERVE' }, CONT);
at.t2setup = () => run(at.compare1(),
  answer('c1', 'rateChange', 'increase'),
  answer('c1', 'claim', 'context-only'),
  CONT);
at.t2medium = () => run(at.t2setup(), CONT);
at.t2high = () => run(at.t2medium(), { type: 'OBSERVE' }, CONT);
at.compare2 = () => run(at.t2high(), { type: 'SET_LIGHT', value: 100 }, { type: 'OBSERVE' }, CONT);
at.inference = () => run(at.compare2(),
  answer('c2', 'rateChange', 'same'),
  answer('c2', 'reason', 'other-condition-short'),
  CONT);
at.concept = () => run(at.inference(), CONT);
at.notebook = () => run(at.concept(), CONT);
at.challenge1 = () => run(at.notebook(), { type: 'SAVE_CONCLUSION', fields: {
  level: 'A', trial1Change: 'increase', trial2Change: 'same', alwaysWorks: 'no',
}}, CONT);
at.challenge2 = () => run(at.challenge1(), pick(1, 'c1-next', 'raise-light'), pick(1, 'c1-next', 'raise-co2'), CONT);
at.challenge3 = () => run(at.challenge2(), pick(2, 'c2-fair', 'change-co2-only'), CONT);
at.complete = () => run(at.challenge3(),
  pick(3, 'c3-claim', 'always-faster'),
  pick(3, 'c3-claim', 'cannot-say-always'),
  { type: 'SAVE_CHALLENGE_NOTE', id: 3, text: '25°C 比 40°C 的模型速率高' },
  CONT);

const save = (s) => JSON.parse(P.serialize(s));
const restoreObj = (o) => P.restore(JSON.stringify(o));

test('storage key and version are station-specific', () => {
  assert.equal(P.STORAGE_KEY, 'bhcs-photosynthesis-factor-guided:v1');
  assert.equal(P.VERSION, 1);
});

test('serialize keeps source/learner inputs only and never derived science or correctness', () => {
  const s = save(at.complete());
  assert.deepEqual(Object.keys(s).sort(), ['challenges', 'compare', 'conclusion', 'phase', 'records', 'v']);
  assert.deepEqual(Object.keys(s.records[0]).sort(), ['co2', 'light', 'temperature', 'trialId']);
  assert.deepEqual(s.challenges[1].steps['c1-next'], { choice: 'raise-co2', attempts: 2 });
  const raw = JSON.stringify(s);
  for (const bad of ['"rate"', '"limit"', '"factors"', '"oxygen"', '"correct"', 'allCorrect', '"ready"', '"expected"']) {
    assert.ok(!raw.includes(bad), `save contains ${bad}`);
  }
});

test('a full save restores Complete and re-judges all derived state', () => {
  const live = at.complete();
  const r = P.restore(P.serialize(live));
  assert.equal(r.phase, 'complete');
  assert.equal(r.state.phase, 'complete');
  assert.equal(r.state.challenges[1].steps['c1-next'].correct, true);
  assert.equal(r.state.challenges[2].steps['c2-fair'].correct, true);
  assert.equal(r.state.challenges[3].steps['c3-claim'].correct, true);
  assert.equal(r.state.challenges[1].steps['c1-next'].attempts, 2);
  assert.equal(r.state.challenges[3].steps['c3-claim'].attempts, 2);
  assert.equal(r.state.challenges[3].note, '25°C 比 40°C 的模型速率高');
});

test('major phases round-trip without moving beyond the saved phase', () => {
  for (const name of ['t1low', 't1higher', 'compare1', 't2setup', 't2medium', 't2high', 'compare2', 'inference', 'concept', 'notebook', 'challenge1', 'challenge2', 'challenge3', 'complete']) {
    const live = at[name]();
    const r = P.restore(P.serialize(live));
    assert.equal(r.phase, live.phase, name);
    assert.equal(r.state.phase, live.phase, name);
  }
});

test('forged derived fields on a valid record are ignored; raw source values are rebuilt', () => {
  const s = save(at.t1higher());
  s.records[0].rate = 999;
  s.records[0].limit = 'co2';
  s.records[0].factors = { light: 1 };
  s.records[0].correct = true;
  const r = restoreObj(s);
  assert.deepEqual(r.state.records[0], { trialId: 't1-low-light', light: 15, co2: 1000, temperature: 25 });
  assert.equal(E.observationFor(r.state, 't1-low-light').rate.toFixed(1), '7.4');
});

test('wrong raw trial conditions stop replay and drop downstream data', () => {
  const s = save(at.complete());
  s.records[1].light = 100;
  const r = restoreObj(s);
  assert.equal(r.phase, 'trial1-higher-light');
  assert.equal(r.state.records.length, 1);
  assert.equal(r.state.compare.c1.rateChange, null);
  assert.deepEqual(r.state.challenges[1].steps, {});
});

test('duplicate or extra records are not silently ignored', () => {
  const base = save(at.complete());
  let s = structuredClone(base);
  s.records.splice(1, 0, { ...s.records[0] });
  let r = restoreObj(s);
  assert.equal(r.state.records.length, 1);
  assert.equal(r.phase, 'trial1-higher-light');

  s = structuredClone(base);
  s.records.push({ ...s.records[3] });
  r = restoreObj(s);
  assert.equal(r.state.records.length, 4);
  assert.equal(r.phase, 'trial2-high-light');
  assert.equal(r.state.compare.c2.rateChange, null);
});

test('wrong compare answers are preserved but cannot unlock later phases', () => {
  const s = save(at.complete());
  s.compare.c1.claim = 'always-more-light';
  const r = restoreObj(s);
  assert.equal(r.phase, 'compare1');
  assert.equal(r.state.compare.c1.claim, 'always-more-light');
  assert.equal(E.compareStatus(r.state).c1.allCorrect, false);
  assert.equal(r.state.records.length, 2);
});

test('invalid compare values are dropped rather than trusted', () => {
  const s = save(at.complete());
  s.compare.c2.rateChange = 'faster';
  s.compare.c2.correct = true;
  const r = restoreObj(s);
  assert.equal(r.phase, 'compare2');
  assert.equal(r.state.compare.c2.rateChange, null);
  assert.equal(E.compareStatus(r.state).c2.allCorrect, false);
});

test('Level A notebook is re-judged from records; forged ready/expected fields gain nothing', () => {
  const s = save(at.complete());
  s.conclusion.alwaysWorks = 'yes';
  s.conclusion.ready = true;
  s.conclusion.expected = { alwaysWorks: 'yes' };
  const r = restoreObj(s);
  assert.equal(r.phase, 'notebook');
  assert.equal(E.notebookIsReady(r.state), false);
  assert.deepEqual(r.state.challenges[1].steps, {});
  assert.equal('ready' in r.state.conclusion, false);
  assert.equal('expected' in r.state.conclusion, false);
});

test('Levels B/C text is clipped and invalid fields are dropped independently', () => {
  let s = save(at.complete());
  s.conclusion = { level: 'B', freeText: 'x'.repeat(TEXT_MAX + 20), alwaysWorks: 'invented' };
  let r = restoreObj(s);
  assert.equal(r.state.conclusion.freeText.length, TEXT_MAX);
  assert.equal(r.state.conclusion.alwaysWorks, null);

  s = save(at.complete());
  s.conclusion = { level: 'C', evidenceText: '第一組7.4到17.4', limitationText: 42 };
  r = restoreObj(s);
  assert.equal(r.phase, 'notebook');
  assert.equal(r.state.conclusion.evidenceText, '第一組7.4到17.4');
  assert.equal(r.state.conclusion.limitationText, '');
});

test('saved challenge correct flags are ignored and choices are judged again', () => {
  const s = save(at.complete());
  s.challenges[1].steps['c1-next'] = { choice: 'raise-light', attempts: 1, correct: true };
  const r = restoreObj(s);
  assert.equal(r.phase, 'challenge-1');
  assert.equal(r.state.challenges[1].steps['c1-next'].correct, false);
  assert.deepEqual(r.state.challenges[2].steps, {});
});

test('attempt counts are validated and capped', () => {
  let s = save(at.complete());
  s.challenges[1].steps['c1-next'].attempts = 1e9;
  assert.equal(restoreObj(s).state.challenges[1].steps['c1-next'].attempts, ATTEMPTS_MAX);
  for (const bad of [0, -1, 1.5, '2', null]) {
    s = save(at.complete());
    s.challenges[2].steps['c2-fair'].attempts = bad;
    const r = restoreObj(s);
    assert.equal(r.phase, 'challenge-2', String(bad));
    assert.deepEqual(r.state.challenges[2].steps, {});
  }
});

test('Challenge 3 note is kept only after the challenge is solved and is clipped', () => {
  let s = save(at.complete());
  s.challenges[3].note = 'z'.repeat(TEXT_MAX + 10);
  let r = restoreObj(s);
  assert.equal(r.state.challenges[3].note.length, TEXT_MAX);

  s = save(at.complete());
  s.challenges[3].steps['c3-claim'] = { choice: 'always-faster', attempts: 1 };
  r = restoreObj(s);
  assert.equal(r.phase, 'challenge-3');
  assert.equal(r.state.challenges[3].note, '');
});

test('claimed phase is clamped between kept-data floor and proven checkpoint', () => {
  let s = save(at.t1higher());
  s.phase = 'complete';
  assert.equal(restoreObj(s).phase, 'trial1-higher-light');

  s = save(at.complete());
  s.phase = 'welcome';
  assert.equal(restoreObj(s).phase, 'challenge-3');

  s = save(at.concept());
  s.phase = 'notebook';
  assert.equal(restoreObj(s).phase, 'notebook');
});

test('corrupt envelope or wrong version starts fresh instead of partially trusting data', () => {
  for (const raw of ['{', 'null', '[]', '"x"', '42', '', null, undefined]) assert.equal(P.restore(raw), null, String(raw));
  const s = save(at.t1low());
  assert.equal(restoreObj({ ...s, v: 2 }), null);
  assert.equal(restoreObj({ ...s, v: '1' }), null);
});

function memory({ throwOn = [] } = {}) {
  const data = new Map(), calls = [];
  return {
    data, calls,
    getItem(k) { calls.push(['get', k]); if (throwOn.includes('get')) throw new Error('blocked'); return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { calls.push(['set', k]); if (throwOn.includes('set')) throw new Error('quota'); data.set(k, String(v)); },
    removeItem(k) { calls.push(['remove', k]); if (throwOn.includes('remove')) throw new Error('blocked'); data.delete(k); },
  };
}

test('store starts saving at the first record and avoids identical rewrites', () => {
  const area = memory(), store = P.createStore(area);
  assert.equal(store.save(at.t1low()), false);
  const one = run(at.t1low(), { type: 'OBSERVE' });
  assert.equal(store.save(one), true);
  assert.equal(store.save(one), true);
  assert.equal(area.calls.filter(([x]) => x === 'set').length, 1);
  assert.equal(store.load().state.records.length, 1);
});

test('store clear and storage failures never break the lab', () => {
  const area = memory(), store = P.createStore(area);
  store.save(run(at.t1low(), { type: 'OBSERVE' }));
  assert.equal(store.clear(), true);
  assert.equal(store.load(), null);
  for (const op of ['get', 'set', 'remove']) {
    const broken = P.createStore(memory({ throwOn: [op] }));
    assert.doesNotThrow(() => {
      broken.load();
      broken.save(run(at.t1low(), { type: 'OBSERVE' }));
      broken.clear();
    });
    assert.equal(broken.failed, true);
  }
});

console.log(`photosynthesis guided persist: ${tests} tests passed`);
