// B7 gate (unit): anonymous milestone events (assets/buoyancy-guided/analytics.js). Fixed names only; no text, no numbers, no answers.
// Run on its own: node scripts/test_buoyancy_guided_analytics.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { reduce, createInitialState } from '../assets/buoyancy-guided/engine.js';
import { analyticsFor, createTracker, ANALYTICS_ACTIONS, LAB_ID } from '../assets/buoyancy-guided/analytics.js';

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));
let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };

const A = {
  start: { type: 'START' }, begin: { type: 'BEGIN' }, add: { type: 'ADD_BALLAST' }, put: { type: 'PUT_IN', objectId: 'block' }, out: { type: 'TAKE_OUT' },
  brine: { type: 'SELECT_LIQUID', liquidId: 'brine' }, rec1: { type: 'RECORD_TRIAL', trial: 1 }, rec2: { type: 'RECORD_TRIAL', trial: 2 }, next: { type: 'CONTINUE' },
  q: (question, answer) => ({ type: 'ANSWER_COMPARE', question, answer }),
  wood: { type: 'PUT_IN', objectId: 'wood' }, stone: { type: 'PUT_IN', objectId: 'stone' },
  save: (fields) => ({ type: 'SAVE_CONCLUSION', fields }), ch: (id, step, choice) => ({ type: 'ANSWER_CHALLENGE', id, step, choice }),
};
// one whole visit, with secrets in everything a learner can type and wrong answers on the way
const FLOW = [
  A.start, A.begin, A.put, A.out, A.add, A.put, A.out, A.add, A.put, A.rec1,
  A.brine, A.put, A.out, A.add, A.put, A.rec2, A.next,
  A.q('stayMass', 'smaller'), A.q('stayMass', 'larger'), A.q('firstDrop', 'float'), A.next,
  A.wood, A.out, A.stone, A.next, A.next,
  A.save({ level: 'A', relationLiquid: 'smaller', relationWood: 'volume' }), A.save({ relationLiquid: 'larger', relationWood: 'density' }),
  A.save({ level: 'B', freeText: 'SECRET-TEXT 重的不一定沉' }), A.save({ level: 'C', evidenceText: 'SECRET-EVIDENCE 第二次實驗', limitationText: 'SECRET-LIMITATION 只有兩種液體' }),
  A.save({ level: 'A' }), A.next,
  A.ch(1, 'c1-outcome', 'float'), A.ch(1, 'c1-outcome', 'stay'), A.ch(1, 'c1-outcome', 'sink'), A.next,
  A.ch(2, 'c2-where', 'all-out'), A.ch(2, 'c2-where', 'under-80'), A.ch(2, 'c2-brine', 'less'), A.next,
  A.ch(3, 'c3-reason', 'boat-shape-only'), A.ch(3, 'c3-reason', 'volume-spread'), A.next,
];
const SEQUENCE = ['lab_start', 'trial_recorded', 'trial_recorded', 'compare_complete', 'trial_recorded', 'counterexample_observed', 'notebook_complete', 'challenge_complete', 'challenge_complete', 'challenge_complete', 'lab_complete'];

function walk(actions) {
  let state = createInitialState();
  const out = [];
  for (const action of actions) {
    const result = reduce(state, action);
    state = result.state;
    out.push({ action, result, names: analyticsFor(result) });
  }
  return out;
}

test('the lab id and the allowlist are exactly the approved ones', () => {
  assert.equal(LAB_ID, 'buoyancy-guided');
  assert.deepEqual([...ANALYTICS_ACTIONS], ['lab_start', 'trial_recorded', 'compare_complete', 'counterexample_observed', 'notebook_complete', 'challenge_complete', 'lab_complete']);
  assert.ok(Object.isFrozen(ANALYTICS_ACTIONS));
});

test('a whole visit sends eleven milestones, in this order, and nothing else', () => {
  const steps = walk(FLOW);
  assert.ok(steps.every((s) => s.result.accepted), 'the visit is one the engine accepts');
  const names = steps.flatMap((s) => s.names);
  assert.deepEqual(names, SEQUENCE);
  assert.equal(names.length, 11);
});

test('every allowed action is used by a milestone, and none outside the list is ever produced', () => {
  const names = walk(FLOW).flatMap((s) => s.names);
  assert.deepEqual([...new Set(names)].sort(), [...ANALYTICS_ACTIONS].sort());
  assert.ok(names.every((n) => ANALYTICS_ACTIONS.includes(n)));
});

test('starting, moving the block, choosing, answering and typing send nothing by themselves', () => {
  const quiet = ['START', 'ADD_BALLAST', 'REMOVE_BALLAST', 'TAKE_OUT', 'SELECT_LIQUID', 'ANSWER_COMPARE', 'SAVE_CONCLUSION', 'ANSWER_CHALLENGE'];
  const steps = walk(FLOW);
  for (const { action, names } of steps) if (quiet.includes(action.type)) assert.deepEqual(names, [], `${action.type} ${JSON.stringify(action).slice(0, 40)}`);
  assert.deepEqual(steps[0].names, [], 'START');
  const begin = steps[1];
  assert.deepEqual(begin.names, ['lab_start'], 'the lab starts when the trial begins, not at the start button');
  assert.deepEqual(begin.result.transitions, ['trial1-test']);
});

test('dropping something is a milestone only when that very drop enters one', () => {
  const steps = walk(FLOW);
  const drops = steps.filter((s) => s.action.type === 'PUT_IN');
  assert.equal(drops.length, 7);
  const withNames = drops.filter((s) => s.names.length);
  assert.deepEqual(withNames.map((s) => [s.action.objectId, s.names]), [['stone', ['trial_recorded', 'counterexample_observed']]], 'only the drop that finishes trial 3');
  assert.deepEqual(drops.filter((s) => s.action.objectId === 'wood').map((s) => s.names), [[]], 'the first object of trial 3 sends nothing');
});

test('the compare is a milestone when it is finished and the lab moves on, not when it is answered', () => {
  const steps = walk(FLOW);
  const answers = steps.filter((s) => s.action.type === 'ANSWER_COMPARE');
  assert.equal(answers.length, 3);
  assert.ok(answers.every((s) => s.names.length === 0));
  const toTrial3 = steps.find((s) => s.result.transitions.includes('trial3-drop'));
  assert.deepEqual(toTrial3.names, ['compare_complete']);
  const toCompare = steps.find((s) => s.result.transitions.includes('compare'));
  assert.deepEqual(toCompare.names, [], 'opening the compare is nothing');
});

test('trial 3: the record and the counterexample come from the same step, record first', () => {
  const steps = walk(FLOW);
  const finish = steps.find((s) => s.result.transitions.includes('trial3-observed'));
  assert.ok(finish.result.events.some((e) => e.type === 'record-written' && e.trial === 3));
  assert.deepEqual(finish.names, ['trial_recorded', 'counterexample_observed']);
});

test('the notebook is a milestone when the first challenge opens, and each challenge as the next screen opens', () => {
  const steps = walk(FLOW);
  const entering = (phase) => steps.find((s) => s.result.transitions.includes(phase));
  assert.deepEqual(entering('challenge-1').names, ['notebook_complete']);
  assert.deepEqual(entering('challenge-2').names, ['challenge_complete']);
  assert.deepEqual(entering('challenge-3').names, ['challenge_complete']);
  assert.deepEqual(entering('complete').names, ['challenge_complete', 'lab_complete']);
  assert.equal(steps.filter((s) => s.names.includes('notebook_complete')).length, 1, 'once, however often the notebook was edited');
});

test('rejected actions, restarts and malformed results send nothing', () => {
  const st = createInitialState();
  assert.deepEqual(analyticsFor(reduce(st, A.begin)), [], 'rejected BEGIN');
  assert.deepEqual(analyticsFor(reduce(st, A.rec1)), [], 'rejected RECORD_TRIAL');
  assert.deepEqual(analyticsFor(reduce(st, { type: 'NOPE' })), []);
  assert.deepEqual(analyticsFor(undefined), []);
  assert.deepEqual(analyticsFor(null), []);
  assert.deepEqual(analyticsFor({}), []);
  assert.deepEqual(analyticsFor('result'), []);
  assert.deepEqual(analyticsFor({ accepted: false, events: [{ type: 'record-written' }], transitions: ['complete'] }), [], 'not accepted');
  assert.deepEqual(analyticsFor({ accepted: 'yes', events: [{ type: 'record-written' }], transitions: ['complete'] }), [], 'accepted must be exactly true');
  assert.deepEqual(analyticsFor({ accepted: true, events: 'x', transitions: 7 }), []);
  assert.deepEqual(analyticsFor({ accepted: true, events: [null, 5, {}], transitions: [null, 'welcome', 'trial1-recorded'] }), []);
  const finished = walk(FLOW).at(-1).result.state;
  assert.deepEqual(analyticsFor(reduce(finished, { type: 'RESTART' })), [], 'a restart enters only the welcome page');
  assert.deepEqual(reduce(finished, { type: 'RESTART' }).transitions, ['welcome']);
});

test('a restored session has no result to read, so it cannot send anything; the module takes nothing but results', () => {
  assert.equal(analyticsFor.length, 1);
  const src = fs.readFileSync(here('../assets/buoyancy-guided/analytics.js'), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/\bimport\b|require\(/.test(src), 'analytics.js reads no state, no storage and no other module');
  assert.ok(!/\bstate\b|persist|restore|conclusion|records|compare\b|challenges/.test(src), 'and knows nothing of what the learner did, only which phases were entered');
});

test('names are valid for the site adapter and the lab id matches the page', () => {
  for (const n of ANALYTICS_ACTIONS) assert.match(n, /^[a-z][a-z0-9_-]{0,60}$/, n);
  assert.match(LAB_ID, /^[a-z][a-z0-9_-]{0,80}$/);
  const html = fs.readFileSync(here('../tools/science/buoyancy-guided.html'), 'utf8');
  assert.ok(html.includes(`data-science-lab="${LAB_ID}"`));
  const adapter = fs.readFileSync(here('../assets/science-events.js'), 'utf8');
  assert.ok(adapter.includes('/^[a-z][a-z0-9_-]{0,60}$/') && adapter.includes('/^[a-z][a-z0-9_-]{0,80}$/'), 'the adapter still uses the allowlist these names are written for');
});

test('the tracker sends exactly (name, lab id) and nothing a learner typed, chose or measured', () => {
  const calls = [];
  const track = createTracker({ bhcsScienceTrack: (...args) => calls.push(args) });
  for (const { names } of walk(FLOW)) track(names);
  assert.equal(calls.length, 11);
  assert.ok(calls.every((c) => c.length === 2 && c[1] === 'buoyancy-guided' && ANALYTICS_ACTIONS.includes(c[0])), 'two arguments, the lab id second');
  assert.deepEqual(calls.map((c) => c[0]), SEQUENCE);
  const wire = JSON.stringify(calls);
  for (const secret of ['SECRET', 'TEXT', 'EVIDENCE', 'LIMITATION', '重的不一定沉', '第二次實驗', '只有兩種液體']) assert.ok(!wire.includes(secret), secret);
  for (const fact of ['100', '120', '0.6', '1.2', '80', '83', '60', 'larger', 'smaller', 'density', 'volume', 'volume-spread', 'float', 'sink', 'water', 'brine', 'wood', 'stone', 'oil', 'attempt', 'slots'])
    assert.ok(!wire.includes(fact), `"${fact}" is a fact about the session and never leaves it`);
  assert.equal(wire.length < 700, true);
});

test('the tracker survives a missing adapter, an adapter that throws, and names it does not know', () => {
  const absentCases = [createTracker({}), createTracker(undefined), createTracker(null), createTracker({ bhcsScienceTrack: 'nope' })];
  for (const t of absentCases) assert.doesNotThrow(() => t(['lab_start', 'lab_complete']));
  const seen = [];
  const boom = createTracker({ bhcsScienceTrack(...a) { seen.push(a); throw new Error('adapter down'); } });
  assert.doesNotThrow(() => boom(['lab_start', 'trial_recorded', 'lab_complete']));
  assert.equal(seen.length, 3, 'one failed call does not stop the next');
  const spy = [];
  const t = createTracker({ bhcsScienceTrack: (...a) => spy.push(a) });
  t(['lab_start', 'made_up', 'record_text:hello', 'drop', 'answer', 'wrong_answer', 'mass', 'density', 'resume', '', null, 7, { toString: () => 'lab_start' }]);
  assert.deepEqual(spy, [['lab_start', 'buoyancy-guided']], 'unknown names are dropped');
  for (const bad of [undefined, null, 'lab_start', 5, {}]) assert.doesNotThrow(() => t(bad));
  assert.equal(spy.length, 1);
});

test('analytics.js makes no network, storage or transport calls of its own', () => {
  const src = fs.readFileSync(here('../assets/buoyancy-guided/analytics.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  for (const bad of ['gtag', 'dataLayer', 'fetch(', 'XMLHttpRequest', 'sendBeacon', 'Image(', 'localStorage', 'sessionStorage', 'document.', 'googletagmanager', 'G-GHN2GDS2RQ']) assert.ok(!src.includes(bad), bad);
  assert.ok((src.match(/bhcsScienceTrack/g) ?? []).length === 1, 'one adapter call');
});

test('no other buoyancy source talks to the adapter or the network, and main.js carries no milestone name', () => {
  const dir = here('../assets/buoyancy-guided');
  const files = fs.readdirSync(dir).filter((n) => n.endsWith('.js'));
  assert.ok(files.includes('analytics.js') && files.length >= 11, files.join());
  for (const f of files) {
    const s = fs.readFileSync(`${dir}/${f}`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.ok(!/gtag|dataLayer|sendBeacon|XMLHttpRequest|\bfetch\(|googletagmanager/.test(s), `${f} makes no network or analytics calls`);
    if (f !== 'analytics.js') assert.ok(!/bhcsScienceTrack/.test(s), `${f} does not talk to the adapter`);
    if (f !== 'analytics.js') for (const name of ANALYTICS_ACTIONS) assert.ok(!s.includes(name), `${f} does not name the milestone ${name}`);
  }
  const main = fs.readFileSync(`${dir}/main.js`, 'utf8');
  assert.ok(/analyticsFor\(result\)/.test(main) && /createTracker\(\)/.test(main), 'main.js only forwards the result of an accepted action');
  const persist = fs.readFileSync(`${dir}/persist.js`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.ok(!/analytics/.test(persist), 'saving and restoring know nothing of analytics');
});

console.log(`\nbuoyancy-guided analytics: ${tests} tests passed`);
