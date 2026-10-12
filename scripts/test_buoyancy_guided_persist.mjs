// B6 gate (unit): saving and restoring progress in the guided buoyancy lab (assets/buoyancy-guided/persist.js).
// Every layer of a save is broken on purpose and the test checks that what is downstream of it is really gone.
// Run on its own: node scripts/test_buoyancy_guided_persist.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createInitialState, reduce, deriveView, PHASES, DROP_COUNT_MAX, RECENT_DROPS_MAX } from '../assets/buoyancy-guided/engine.js';
import { STORAGE_KEY, VERSION, toSave, serialize, restore, createStore } from '../assets/buoyancy-guided/persist.js';

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));
let tests = 0;
const test = async (name, fn) => { await fn(); tests++; console.log('PASS', name); };

const A = {
  start: { type: 'START' }, begin: { type: 'BEGIN' }, add: { type: 'ADD_BALLAST' }, put: { type: 'PUT_IN', objectId: 'block' }, out: { type: 'TAKE_OUT' },
  brine: { type: 'SELECT_LIQUID', liquidId: 'brine' }, rec1: { type: 'RECORD_TRIAL', trial: 1 }, rec2: { type: 'RECORD_TRIAL', trial: 2 }, next: { type: 'CONTINUE' },
  q: (question, answer) => ({ type: 'ANSWER_COMPARE', question, answer }),
  wood: { type: 'PUT_IN', objectId: 'wood' }, stone: { type: 'PUT_IN', objectId: 'stone' },
  save: (fields) => ({ type: 'SAVE_CONCLUSION', fields }), ch: (id, step, choice) => ({ type: 'ANSWER_CHALLENGE', id, step, choice }),
};
const play = (...actions) => {
  let state = createInitialState();
  for (const a of actions) { const r = reduce(state, a); assert.equal(r.accepted, true, `${JSON.stringify(a)} (${r.reason})`); state = r.state; }
  return state;
};
const TRIAL1 = [A.start, A.begin, A.put, A.out, A.add, A.put, A.out, A.add, A.put];
const R1 = [...TRIAL1, A.rec1];
const R2 = [...R1, A.brine, A.put, A.out, A.add, A.put, A.rec2];
const COMPARE = [...R2, A.next];
const COMPARE_DONE = [...COMPARE, A.q('stayMass', 'larger'), A.q('firstDrop', 'float')];
const TRIAL3 = [...COMPARE_DONE, A.next];
const OBSERVED = [...TRIAL3, A.wood, A.out, A.stone];
const CONCEPT = [...OBSERVED, A.next];
const NOTEBOOK = [...CONCEPT, A.next];
const NB_A = A.save({ level: 'A', relationLiquid: 'larger', relationWood: 'density' });
const C1 = [...NOTEBOOK, NB_A, A.next];
const C1_DONE = [...C1, A.ch(1, 'c1-outcome', 'float'), A.ch(1, 'c1-outcome', 'sink')];
const C2 = [...C1_DONE, A.next];
const C2_STEP1 = [...C2, A.ch(2, 'c2-where', 'under-80')];
const C2_DONE = [...C2_STEP1, A.ch(2, 'c2-brine', 'less')];
const C3 = [...C2_DONE, A.next];
const COMPLETE = [...C3, A.ch(3, 'c3-reason', 'volume-spread'), A.next];

const forge = (state, fn) => { const o = JSON.parse(serialize(state)); fn(o); return o; };
const fresh = () => createInitialState();
const phaseOf = (raw) => restore(raw)?.state.phase;
const DOWNSTREAM_EMPTY = (st, from) => {
  // everything after `from` really is not there
  const order = ['record2', 'compare', 'record3', 'conclusion', 'challenges'];
  const cut = order.indexOf(from);
  if (cut <= order.indexOf('record2')) assert.equal(st.records[2], null, 'record2 dropped');
  if (cut <= order.indexOf('compare')) assert.deepEqual(st.compare, { stayMass: null, firstDrop: null }, 'compare dropped');
  if (cut <= order.indexOf('record3')) { assert.equal(st.records[3], null, 'record3 dropped'); }
  if (cut <= order.indexOf('conclusion')) assert.deepEqual(st.conclusion, fresh().conclusion, 'conclusion dropped');
  if (cut <= order.indexOf('challenges')) assert.deepEqual(st.challenges, fresh().challenges, 'challenges dropped');
};

await test('the key and the version are exactly the approved ones', () => {
  assert.equal(STORAGE_KEY, 'bhcs-buoyancy-guided:v1');
  assert.equal(VERSION, 1);
  assert.equal(createStore({ getItem() { return null; } }).key, 'bhcs-buoyancy-guided:v1');
  const src = fs.readFileSync(here('../assets/buoyancy-guided/persist.js'), 'utf8');
  assert.ok(!/optics|bhcs-optics|buoyancy-density-lab|researcher/.test(src.replace(/\/\/.*$/gm, '')), 'no other lab\'s key is touched');
});

await test('a fresh state serializes to the minimum and nothing derived', () => {
  const save = toSave(fresh());
  assert.deepEqual(Object.keys(save).sort(), ['challenges', 'compare', 'conclusion', 'phase', 'records', 'tried', 'v']);
  assert.deepEqual([save.v, save.phase, save.records], [1, 'welcome', { 1: null, 2: null, 3: null }]);
  const full = serialize(play(...COMPLETE));
  for (const word of ['seq', 'tank', 'outcome', 'immersion', 'density', 'correct', 'allCorrect', 'stayMass', 'percent', 'focus', 'announce']) {
    assert.ok(!new RegExp(`"[^"]*${word}[^"]*"\\s*:`, 'i').test(full.replace(/"stayMass":("[a-z]*"|null)/g, '').replace(/c1-outcome/g, 'c1')), `"${word}" must not be saved`);
  }
  assert.ok(full.length < 3000, `the save stays small (${full.length})`);
});

await test('a valid first record comes back as the start of trial 2, with the block on the table', () => {
  const original = play(...R1);
  const back = restore(serialize(original));
  assert.equal(back.phase, 'trial2-switch-liquid');
  const st = back.state;
  assert.deepEqual([st.phase, st.slots, st.liquidId, st.tank.objectId, st.seq], ['trial2-switch-liquid', 3, 'water', null, 0]);
  assert.deepEqual(st.records[1], original.records[1]);
  assert.equal(st.dropCount.trial1, original.dropCount.trial1);
  assert.deepEqual(st.recentDrops.trial1, original.recentDrops.trial1);
  DOWNSTREAM_EMPTY(st, 'record2');
  assert.equal(deriveView(st).controls.liquid.locked, false, 'the liquid can be chosen');
  assert.equal(reduce(st, A.brine).accepted, true, 'and the lab carries on from there');
});

await test('a forged first record sends the learner back to the welcome page with nothing kept', () => {
  const base = play(...COMPLETE);
  for (const bad of [{ slots: 5 }, { slots: 2 }, { slots: 3.5 }, { slots: '3' }, { slots: null }, { slots: -1 }, { liquidId: 'brine' }, { liquidId: 'oil' }, { dropCount: 0 }, { dropCount: -2 }, { dropCount: 1.5 }, { dropCount: '4' }, { dropCount: NaN }]) {
    const raw = forge(base, (o) => Object.assign(o.records[1], bad));
    const back = restore(raw);
    assert.equal(back.state.phase, 'welcome', JSON.stringify(bad));
    assert.deepEqual(back.state, fresh(), `everything dropped for ${JSON.stringify(bad)}`);
  }
  assert.equal(restore(forge(base, (o) => { o.records[1] = null; })).state.phase, 'welcome');
  assert.equal(restore(forge(base, (o) => { delete o.records; })).state.phase, 'welcome');
});

await test('a valid first record with a forged second one goes back to trial 2, and the rest of a "complete" save is thrown away', () => {
  const base = play(...COMPLETE);
  for (const bad of [{ slots: 3 }, { slots: 5 }, { slots: 0 }, { liquidId: 'water' }, { dropCount: 0 }, { firstDrop: { slots: 2, liquidId: 'brine' } }, { firstDrop: { slots: 3, liquidId: 'water' } }, { firstDrop: null }, { firstDrop: 'x' }]) {
    const raw = forge(base, (o) => Object.assign(o.records[2], bad));
    const back = restore(raw);
    assert.equal(back.state.phase, 'trial2-switch-liquid', JSON.stringify(bad));
    assert.equal(back.state.slots, 3, 'with the first record\'s slots');
    assert.equal(back.state.liquidId, 'water');
    assert.equal(back.state.records[1].slots, 3);
    DOWNSTREAM_EMPTY(back.state, 'record2');
  }
});

await test('forged outcomes, masses and percents are ignored: they are never read', () => {
  const base = play(...OBSERVED);
  const clean = restore(serialize(base));
  const forged = forge(base, (o) => {
    for (const k of [1, 2]) Object.assign(o.records[k], { outcome: 'sink', stayMassG: 999, stayMass: 999, immersionPercent: 5, immersionFraction: 0.05, density: 9, objectDensity: 9, relation: 'heavier' });
    Object.assign(o, { outcome: 'sink', seq: 99, tank: { objectId: 'wood' }, announcement: { id: 'x' } });
  });
  const back = restore(forged);
  assert.deepEqual(back.state, clean.state);
  assert.equal(back.state.seq, 0);
  assert.equal(back.state.tank.objectId, null);
  const facts = deriveView(back.state).facts;
  assert.equal(facts.record1.stayMassG, 100);
  assert.equal(facts.record2.stayMassG, 120);
  assert.equal(facts.trial2FirstDrop.immersionPercent, 83);
});

await test('an unfinished compare comes back at the compare, with everything after it gone', () => {
  const base = play(...CONCEPT);
  const raw = forge(base, (o) => { o.compare.firstDrop = null; });
  const back = restore(raw);
  assert.equal(back.state.phase, 'compare');
  assert.deepEqual(back.state.compare, { stayMass: 'larger', firstDrop: null }, 'the answer that was given is kept');
  assert.deepEqual(back.state.records[1], base.records[1]);
  assert.deepEqual(back.state.records[2], base.records[2]);
  DOWNSTREAM_EMPTY(back.state, 'record3');
  assert.equal(back.state.trial3.tried.wood, false);
  assert.equal(deriveView(back.state).compare.allCorrect, false);
  assert.equal(restore(forge(base, (o) => { o.compare = null; })).state.phase, 'compare');
  assert.equal(restore(forge(base, (o) => { o.compare = { stayMass: 'bigger', firstDrop: 'float' }; })).state.compare.stayMass, null, 'an answer that is not one of the options is not kept');
});

await test('forged compare correctness is judged again from the records', () => {
  const base = play(...COMPARE_DONE);
  const wrong = forge(base, (o) => { o.compare = { stayMass: 'smaller', firstDrop: 'float', correct: true, allCorrect: true, status: 'correct' }; o.phase = 'trial3-drop'; });
  const back = restore(wrong);
  assert.equal(back.state.phase, 'compare', 'a claim of "trial3-drop" does not make the answers right');
  assert.equal(deriveView(back.state).compare.questions.stayMass.status, 'incorrect');
  assert.equal(deriveView(back.state).compare.allCorrect, false);
  DOWNSTREAM_EMPTY(back.state, 'record3');
  const right = restore(forge(base, (o) => { o.compare.correct = false; }));
  assert.equal(right.state.phase, 'compare', 'the saved phase is where the learner was');
  assert.equal(deriveView(right.state).compare.allCorrect, true, 'and the right answers are right whatever else the save says');
});

await test('trial 3: each tried flag is accepted on its own; junk is not', () => {
  const base = play(...TRIAL3, A.wood);
  const back = restore(serialize(base));
  assert.equal(back.state.phase, 'trial3-drop');
  assert.deepEqual(back.state.trial3.tried, { wood: true, stone: false });
  assert.equal(back.state.records[3], null);
  for (const [tried, expected] of [[{ wood: false, stone: true }, { wood: false, stone: true }], [{ wood: 'yes', stone: 1 }, { wood: false, stone: false }], [null, { wood: false, stone: false }], [{ wood: true }, { wood: true, stone: false }]]) {
    const raw = forge(base, (o) => { o.tried = tried; o.records[3] = null; });
    assert.deepEqual(restore(raw).state.trial3.tried, expected, JSON.stringify(tried));
  }
  const both = restore(forge(base, (o) => { o.tried = { wood: true, stone: true }; o.records[3] = { tried: { wood: true, stone: true } }; }));
  assert.equal(both.state.phase, 'trial3-drop', 'the learner was still at the drop');
  assert.deepEqual(both.state.trial3.tried, { wood: false, stone: false }, 'both tried at the drop is not a state the lab can be in');
  assert.equal(both.state.records[3], null);
});

await test('a forged third record cannot open the concept, the notebook or the challenges', () => {
  const base = play(...C2_DONE);
  const partial = restore(forge(base, (o) => { o.records[3] = { tried: { wood: true, stone: false } }; o.tried = { wood: true, stone: false }; }));
  assert.equal(partial.state.phase, 'trial3-drop');
  assert.deepEqual(partial.state.trial3.tried, { wood: true, stone: false });
  DOWNSTREAM_EMPTY(partial.state, 'record3');
  const none = restore(forge(base, (o) => { o.records[3] = null; o.tried = { wood: false, stone: false }; }));
  assert.equal(none.state.phase, 'trial3-drop');
  const badCompare = restore(forge(base, (o) => { o.compare.stayMass = 'same'; }));
  assert.equal(badCompare.state.phase, 'compare', 'a good third record does not rescue a bad compare');
  DOWNSTREAM_EMPTY(badCompare.state, 'record3');
  const good = restore(serialize(base));
  assert.equal(good.state.phase, 'challenge-2');
  assert.deepEqual(good.state.records[3], { trial: 3, liquidId: 'water', tried: { wood: true, stone: true } });
});

await test('notebook level A: a relation that does not fit the records is cleared and the learner goes back to the notebook', () => {
  const base = play(...C1);
  const forged = forge(base, (o) => { o.conclusion.relationLiquid = 'smaller'; o.phase = 'challenge-1'; });
  const back = restore(forged);
  assert.equal(back.state.phase, 'notebook');
  assert.equal(back.state.conclusion.relationLiquid, null, 'the wrong relation is gone');
  assert.equal(back.state.conclusion.relationWood, 'density', 'the right one stays');
  assert.equal(back.state.conclusion.level, 'A');
  assert.deepEqual(back.state.challenges, fresh().challenges);
  assert.equal(deriveView(back.state).notebook.ready, false);
  for (const junk of ['x', 7, ['larger'], {}]) assert.equal(restore(forge(base, (o) => { o.conclusion.relationWood = junk; })).state.conclusion.relationWood, null);
  const ok = restore(serialize(base));
  assert.equal(ok.state.phase, 'challenge-1');
  assert.equal(deriveView(ok.state).notebook.ready, true);
});

await test('notebook levels B and C: text is cleaned field by field and cut at 1000; a bad field does not take the others down', () => {
  const b = play(...NOTEBOOK, A.save({ level: 'B', freeText: '重的不一定沉' }));
  assert.equal(restore(serialize(b)).state.conclusion.freeText, '重的不一定沉');
  const long = 'x'.repeat(1500);
  const raw = forge(b, (o) => { o.conclusion.freeText = long; o.conclusion.evidenceText = 12; o.conclusion.limitationText = ['a']; o.conclusion.level = 'Z'; });
  const back = restore(raw).state;
  assert.equal(back.conclusion.freeText.length, 1000);
  assert.equal(back.conclusion.evidenceText, '');
  assert.equal(back.conclusion.limitationText, '');
  assert.equal(back.conclusion.level, null);
  const c = play(...NOTEBOOK, A.save({ level: 'C', evidenceText: '第二次實驗', limitationText: '只有兩種液體' }));
  const cc = restore(serialize(c)).state;
  assert.equal(cc.phase, 'notebook');
  assert.equal(deriveView(cc).notebook.ready, true);
  assert.equal(restore(forge(c, (o) => { o.conclusion.limitationText = ' '; })).state.phase, 'notebook');
  assert.equal(deriveView(restore(forge(c, (o) => { o.conclusion.limitationText = ' '; })).state).notebook.ready, false);
  assert.equal(restore(forge(c, (o) => { o.conclusion = 'text'; })).state.conclusion.freeText, '');
  assert.deepEqual(restore(forge(c, (o) => { o.conclusion.extra = '<script>'; })).state.conclusion, cc.conclusion, 'unknown fields are not carried');
});

await test('the notebook comes back only when everything before it is valid', () => {
  const base = play(...C1);
  for (const [name, fn, phase, from] of [
    ['bad record1', (o) => { o.records[1].slots = 4; }, 'welcome', 'record2'],
    ['bad record2', (o) => { o.records[2].slots = 3; }, 'trial2-switch-liquid', 'record2'],
    ['bad compare', (o) => { o.compare.stayMass = 'smaller'; }, 'compare', 'record3'],
    ['bad record3', (o) => { o.tried.wood = false; o.records[3] = null; }, 'trial3-drop', 'record3'],
  ]) {
    const st = restore(forge(base, fn)).state;
    assert.equal(st.phase, phase, name);
    DOWNSTREAM_EMPTY(st, from);
    assert.deepEqual(st.conclusion, fresh().conclusion, `${name}: no notebook text survives`);
  }
});

await test('challenge answers: a forged "correct" is judged again, unknown choices and bad counts are dropped', () => {
  const base = play(...C1_DONE);
  const forged = forge(base, (o) => { o.challenges[1]['c1-outcome'] = { choice: 'float', attempts: 1, correct: true, allCorrect: true }; });
  const st = restore(forged).state;
  assert.equal(st.phase, 'challenge-1');
  const step = st.challenges[1].steps['c1-outcome'];
  assert.deepEqual(step, { choice: 'float', correct: false, attempts: 1 });
  assert.equal(deriveView(st).challenge.allCorrect, false);
  for (const bad of [{ choice: 'nope', attempts: 1 }, { choice: 'sink', attempts: 0 }, { choice: 'sink', attempts: 1.5 }, { choice: 'sink', attempts: '2' }, { choice: 7, attempts: 1 }, null, 'x']) {
    const s = restore(forge(base, (o) => { o.challenges[1]['c1-outcome'] = bad; })).state;
    assert.deepEqual(s.challenges[1].steps, {}, JSON.stringify(bad));
  }
  const capped = restore(forge(base, (o) => { o.challenges[1]['c1-outcome'].attempts = 100000; })).state;
  assert.equal(capped.challenges[1].steps['c1-outcome'].attempts, 999);
});

await test('challenge progress is rebuilt in order: nothing after an unsolved step, nothing ahead of the phase', () => {
  const half = play(...C2_STEP1);
  const back = restore(serialize(half)).state;
  assert.equal(back.phase, 'challenge-2');
  assert.deepEqual(deriveView(back).challenge.steps.map((s) => [s.id, s.unlocked, s.correct]), [['c2-where', true, true], ['c2-brine', true, false]]);
  assert.deepEqual(back.challenges[1].steps['c1-outcome'].correct, true);
  const skip = forge(half, (o) => { o.challenges[2]['c2-brine'] = { choice: 'less', attempts: 1 }; delete o.challenges[2]['c2-where']; o.challenges[3] = { 'c3-reason': { choice: 'volume-spread', attempts: 1 } }; });
  const s2 = restore(skip).state;
  assert.deepEqual(s2.challenges[2].steps, {}, 'step 2 answered without step 1 does not count');
  assert.deepEqual(s2.challenges[3].steps, {}, 'nor does a later challenge');
  assert.equal(s2.phase, 'challenge-2');
  const wrongFirst = forge(half, (o) => { o.challenges[2]['c2-where'] = { choice: 'sink', attempts: 2 }; o.challenges[2]['c2-brine'] = { choice: 'less', attempts: 1 }; });
  const s3 = restore(wrongFirst).state;
  assert.deepEqual(Object.keys(s3.challenges[2].steps), ['c2-where']);
  assert.equal(s3.challenges[2].steps['c2-where'].correct, false);
  const ahead = forge(play(...COMPLETE), (o) => { o.phase = 'challenge-1'; });
  const s4 = restore(ahead).state;
  assert.equal(s4.phase, 'challenge-1');
  assert.deepEqual(s4.challenges[2].steps, {}, 'later challenges are not carried into an earlier phase');
  assert.equal(deriveView(s4).challenge.allCorrect, true);
  const done = restore(serialize(play(...COMPLETE)));
  assert.equal(done.state.phase, 'complete');
  assert.equal(Object.keys(done.state.challenges[3].steps).length, 1);
});

await test('the saved phase is a ceiling: it can lower the restore, never raise it', () => {
  const full = play(...COMPLETE);
  const at = (phase) => restore(forge(full, (o) => { o.phase = phase; })).state.phase;
  assert.equal(at('complete'), 'complete');
  assert.equal(at('notebook'), 'notebook', 'a notebook save does not jump to the challenges');
  assert.equal(at('concept'), 'concept');
  assert.equal(at('trial3-observed'), 'trial3-observed');
  assert.equal(at('trial3-drop'), 'trial3-drop');
  assert.equal(at('compare'), 'compare');
  assert.equal(at('trial2-recorded'), 'trial2-recorded');
  assert.equal(at('trial2-complete'), 'trial2-switch-liquid');
  assert.equal(at('trial2-test'), 'trial2-switch-liquid');
  assert.equal(at('trial2-switch-liquid'), 'trial2-switch-liquid');
  assert.equal(at('mission'), 'welcome');
  assert.equal(at('trial1-complete'), 'welcome');
  assert.equal(at(undefined), 'complete', 'no claim, no ceiling');
  assert.equal(at('not-a-phase'), 'complete');
  assert.equal(at(7), 'complete');
  const cut = restore(forge(full, (o) => { o.phase = 'compare'; })).state;
  DOWNSTREAM_EMPTY(cut, 'record3');
  assert.deepEqual(deriveView(cut).compare.allCorrect, true, 'what the learner had answered at the compare is still answered');
  const early = restore(forge(full, (o) => { o.phase = 'trial2-recorded'; })).state;
  assert.deepEqual(early.compare, { stayMass: null, firstDrop: null }, 'a phase before the compare has no compare answers');
  assert.equal(early.liquidId, 'brine');
  assert.ok(early.records[2] && !early.records[3]);
});

await test('the saved phase can never carry the learner past what was proven', () => {
  const full = play(...COMPLETE);
  for (const [fn, expected] of [
    [(o) => { o.records[2].slots = 6; }, 'trial2-switch-liquid'],
    [(o) => { o.compare.stayMass = 'same'; }, 'compare'],
    [(o) => { o.conclusion.relationWood = 'mass'; }, 'notebook'],
    [(o) => { o.conclusion.freeText = ''; o.conclusion.level = 'B'; o.conclusion.relationWood = null; }, 'notebook'],
    [(o) => { o.challenges[3]['c3-reason'].choice = 'spread-out'; }, 'challenge-3'],
    [(o) => { o.challenges[2]['c2-brine'].choice = 'more'; }, 'challenge-2'],
  ]) {
    const raw = forge(full, (o) => { fn(o); o.phase = 'complete'; });
    assert.equal(phaseOf(raw), expected);
  }
});

await test('every phase the lab passes through restores to the same place or earlier, with the same learner data', () => {
  let state = createInitialState();
  const seen = [];
  for (const a of COMPLETE) {
    state = reduce(state, a).state;
    const back = restore(serialize(state));
    assert.ok(back, a.type);
    const here = PHASES.indexOf(state.phase), there = PHASES.indexOf(back.state.phase);
    assert.ok(there <= here, `${state.phase} restored to ${back.state.phase}`);
    if (['trial2-recorded', 'compare', 'trial3-drop', 'trial3-observed', 'concept', 'notebook', 'challenge-1', 'challenge-2', 'challenge-3', 'complete'].includes(state.phase)) {
      assert.equal(back.state.phase, state.phase, `a settled screen comes back as itself (${state.phase})`);
      assert.deepEqual(back.state.records, state.records);
      assert.deepEqual(back.state.compare, state.compare);
      assert.deepEqual(back.state.conclusion, state.conclusion);
      assert.deepEqual(back.state.challenges, state.challenges);
      assert.equal(back.state.trial3.tried.wood, state.trial3.tried.wood);
      seen.push(state.phase);
    }
  }
  assert.ok(seen.length >= 10, seen.join());
});

await test('another version, no version, and anything that is not a save at all start the lab fresh', () => {
  const ok = JSON.parse(serialize(play(...R1)));
  for (const v of [2, 0, '1', null, undefined, 1.5, [1]]) assert.equal(restore({ ...ok, v }), null, String(v));
  assert.equal(restore(JSON.stringify({ ...ok, v: 2 })), null);
  const { v, ...noVersion } = ok;
  assert.equal(restore(noVersion), null);
  assert.ok(restore(JSON.stringify(ok)));
  assert.ok(restore(ok), 'an object is accepted as well as a string');
});

await test('malformed JSON and values of the wrong kind never throw', () => {
  for (const raw of ['', '{', '{"v":1', 'undefined', 'NaN', "{'v':1}", '\u0000', '{"v":1,}', 'null', '[]', '[1,2]', '5', '"x"', 'true', '{}', 'x'.repeat(10000)]) assert.equal(restore(raw), null, raw.slice(0, 20));
  for (const raw of [null, undefined, 5, true, [], [1], () => {}, Symbol.iterator.toString()]) assert.equal(restore(raw), null);
  const ok = { v: 1 };
  for (const records of ['x', 5, [1], null, [null, null]]) assert.equal(restore({ ...ok, records }).state.phase, 'welcome');
  for (const phase of [{}, [], null, true]) assert.equal(restore({ ...ok, phase }).state.phase, 'welcome');
  assert.deepEqual(restore({ v: 1 }).state, fresh());
  const huge = { v: 1, records: { 1: { liquidId: 'water', slots: 3, dropCount: 2, recentDrops: 'many' } } };
  assert.deepEqual(restore(huge).state.recentDrops.trial1, []);
});

await test('recent drops: only legal rows, at most eight, and the count is a legal integer under the cap', () => {
  const base = play(...R1);
  const rows = (list) => restore(forge(base, (o) => { o.records[1].recentDrops = list; })).state.recentDrops.trial1;
  const legal = Array.from({ length: 12 }, (_, i) => ({ slots: i % 7, liquidId: i % 2 ? 'water' : 'brine' }));
  const kept = rows(legal);
  assert.equal(kept.length, RECENT_DROPS_MAX);
  assert.deepEqual(kept, legal.slice(-RECENT_DROPS_MAX));
  const mixed = rows([{ slots: 1, liquidId: 'water' }, { slots: 9, liquidId: 'water' }, { slots: 2, liquidId: 'oil' }, null, 'x', { slots: 2 }, { slots: 2.5, liquidId: 'water' }, { slots: 3, liquidId: 'brine', outcome: 'sink', percent: 5 }]);
  assert.deepEqual(mixed, [{ slots: 1, liquidId: 'water' }, { slots: 3, liquidId: 'brine' }], 'illegal rows go, and nothing else is carried on a row');
  for (const junk of [null, 'x', 5, {}, { length: 3 }]) assert.deepEqual(rows(junk), []);
  const count = (n) => restore(forge(base, (o) => { o.records[1].dropCount = n; })).state;
  assert.equal(count(DROP_COUNT_MAX).dropCount.trial1, DROP_COUNT_MAX);
  assert.equal(count(DROP_COUNT_MAX + 5000).dropCount.trial1, DROP_COUNT_MAX, 'capped at the engine\'s bound');
  assert.equal(count(Number.MAX_SAFE_INTEGER).dropCount.trial1, DROP_COUNT_MAX);
  assert.equal(count(1e300).phase, 'welcome', 'not even an integer: the record is not believed');
  assert.equal(count(1).dropCount.trial1, 1);
});

await test('restoring has no side effects: it changes nothing it was given, dispatches nothing, and starts the counter again', () => {
  const raw = Object.freeze(JSON.parse(serialize(play(...C2_STEP1))));
  const deep = (o) => { if (o && typeof o === 'object') { Object.freeze(o); Object.values(o).forEach(deep); } };
  deep(raw);
  const back = restore(raw);
  assert.equal(back.state.seq, 0, 'no announcement id is carried over');
  assert.equal(back.state.tank.objectId, null);
  const src = fs.readFileSync(here('../assets/buoyancy-guided/persist.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');
  assert.ok(!/\bdocument\b|\bwindow\b|dispatch|announce|analytics|bhcsScienceTrack|gtag|dataLayer|\breduce\(/.test(src), 'persist.js reaches nothing but storage');
  assert.ok(!/[㐀-鿿]/.test(src), 'and holds no learner wording');
  const next = reduce(back.state, A.ch(2, 'c2-brine', 'less'));
  assert.equal(next.accepted, true, 'the restored state is one the engine can carry on from');
  assert.equal(next.state.seq, 0, 'a challenge answer announces by its own attempt, so the counter stays');
});

await test('a restored state behaves like the original: the rest of the lab can be played from every settled checkpoint', () => {
  const rest = { 'trial2-switch-liquid': R2.slice(R1.length), compare: COMPARE_DONE.slice(COMPARE.length).concat([A.next]) };
  const afterR1 = restore(serialize(play(...R1))).state;
  let st = afterR1;
  for (const a of rest['trial2-switch-liquid']) { const r = reduce(st, a); assert.equal(r.accepted, true, `${a.type} ${r.reason}`); st = r.state; }
  assert.equal(st.phase, 'trial2-recorded');
  const atCompare = restore(serialize(play(...COMPARE))).state;
  st = atCompare;
  for (const a of rest.compare) { const r = reduce(st, a); assert.equal(r.accepted, true, `${a.type} ${r.reason}`); st = r.state; }
  assert.equal(st.phase, 'trial3-drop');
  st = restore(serialize(play(...TRIAL3))).state;
  for (const a of [A.wood, A.out, A.stone, A.next, A.next]) { const r = reduce(st, a); assert.equal(r.accepted, true, `${a.type} ${r.reason}`); st = r.state; }
  assert.equal(st.phase, 'notebook');
  st = restore(serialize(play(...C3))).state;
  for (const a of [A.ch(3, 'c3-reason', 'volume-spread'), A.next]) { const r = reduce(st, a); assert.equal(r.accepted, true); st = r.state; }
  assert.equal(st.phase, 'complete');
  assert.equal(reduce(st, { type: 'RESTART' }).state.phase, 'welcome');
});

// ---- the store ------------------------------------------------------------------------------------------------------

const memory = () => { const data = new Map(); return { data, getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => { data.set(k, String(v)); }, removeItem: (k) => { data.delete(k); } }; };

await test('the store: saves once there is a first record, only when something changed, loads it back, and clears', () => {
  const area = memory();
  let writes = 0;
  const counting = { ...area, setItem: (k, v) => { writes++; area.setItem(k, v); } };
  const store = createStore(counting);
  assert.equal(store.load(), null, 'nothing saved yet');
  assert.equal(store.save(play(...TRIAL1)), false, 'nothing worth keeping before the first record');
  assert.equal(writes, 0);
  assert.equal(store.save(play(...R1)), true);
  assert.equal(writes, 1);
  assert.equal(store.save(play(...R1)), true);
  assert.equal(writes, 1, 'the same save is not written twice');
  assert.equal(store.save(play(...R1, A.brine)), true, 'brine chosen changes nothing that is kept');
  assert.equal(writes, 1);
  assert.equal(store.save(play(...R2)), true);
  assert.equal(writes, 2);
  assert.ok(area.data.has(STORAGE_KEY) && area.data.size === 1, 'one key, and only that one');
  const back = store.load();
  assert.equal(back.state.phase, 'trial2-recorded');
  assert.equal(store.failed, false);
  assert.equal(store.clear(), true);
  assert.equal(area.data.size, 0);
  assert.equal(store.load(), null);
  assert.equal(store.save(play(...R2)), true, 'and after a clear the same save is written again');
  assert.equal(writes, 3);
});

await test('blocked storage: reading, writing and removing may all throw; the lab and the store carry on', () => {
  const boom = () => { throw new DOMException('blocked', 'SecurityError'); };
  const getBlocked = createStore({ getItem: boom, setItem() {}, removeItem() {} });
  assert.equal(getBlocked.load(), null);
  assert.equal(getBlocked.failed, true);
  const setBlocked = createStore({ getItem: () => null, setItem: boom, removeItem() {} });
  assert.equal(setBlocked.load(), null);
  assert.equal(setBlocked.failed, false);
  assert.equal(setBlocked.save(play(...R1)), false);
  assert.equal(setBlocked.failed, true);
  assert.equal(setBlocked.save(play(...R2)), false, 'and it keeps trying without throwing');
  const removeBlocked = createStore({ getItem: () => null, setItem() {}, removeItem: boom });
  assert.equal(removeBlocked.clear(), false);
  assert.equal(removeBlocked.failed, true);
  const quota = createStore({ getItem: () => null, setItem() { throw new DOMException('full', 'QuotaExceededError'); }, removeItem() {} });
  assert.equal(quota.save(play(...R1)), false);
  assert.equal(quota.failed, true);
  const none = createStore({});
  assert.equal(none.load(), null);
  assert.equal(none.failed, true);
  assert.equal(none.save(play(...R1)), false);
  const desc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new DOMException('denied', 'SecurityError'); } });
  try {
    const bare = createStore();
    assert.equal(bare.load(), null);
    assert.equal(bare.save(play(...R1)), false);
    assert.equal(bare.clear(), false);
    assert.equal(bare.failed, true);
  } finally { if (desc) Object.defineProperty(globalThis, 'localStorage', desc); else delete globalThis.localStorage; }
  const garbage = createStore({ getItem: () => '{"v":1,"records":{"1":{"slots":99}}}', setItem() {}, removeItem() {} });
  assert.equal(garbage.load().state.phase, 'welcome');
});

await test('persist.js stays in its lane: it reads the engine and the model, not the page, and it is not read by the engine', () => {
  const code = (rel) => fs.readFileSync(here(rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');
  const persist = code('../assets/buoyancy-guided/persist.js');
  const imports = [...persist.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]).sort();
  assert.deepEqual(imports, ['./challenges.js', './engine.js', './model.js']);
  for (const rel of ['model.js', 'engine.js', 'challenges.js', 'input.js', 'visual.js', 'render.js', 'script.js']) {
    assert.ok(!/persist/.test(code(`../assets/buoyancy-guided/${rel}`)), `${rel} knows nothing of saving`);
  }
  assert.ok(!/localStorage|sessionStorage/.test(code('../assets/buoyancy-guided/cards.js')), 'cards write nothing');
  const main = code('../assets/buoyancy-guided/main.js');
  assert.ok(!/localStorage|sessionStorage|JSON\.parse|JSON\.stringify/.test(main), 'main.js does not do the saving itself');
});

console.log(`\nbuoyancy-guided persist: ${tests} tests passed`);
