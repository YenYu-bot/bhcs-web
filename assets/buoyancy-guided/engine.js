// State engine for the guided buoyancy lab (Prototype Technical Spec v1.0 §5, §6, §9).
// A pure reducer and the only place that holds the truth of a session. It never trusts the interface: every outcome is
// asked of model.js from the learner's actions (which object, which liquid, how many ballast slots). It holds no learner
// wording, no storage, no analytics transport and no coordinates.
import { BLOCK, TRIAL3, blockMassG, blockOutcome, objectOutcome } from './model.js';
import { challengeProgress, emptyChallenges, judgeChallenge, notebookReady, sanitizeConclusionFields } from './challenges.js';

export const PHASES = Object.freeze([
  'welcome', 'mission',
  'trial1-test', 'trial1-complete', 'trial1-recorded',
  'trial2-switch-liquid', 'trial2-test', 'trial2-complete', 'trial2-recorded',
  'compare',
  'trial3-drop', 'trial3-observed',
  'concept', 'notebook', 'challenge-1', 'challenge-2', 'challenge-3', 'complete',
]);

/** The guided flow only ever opens these two liquids; the oil in the model is for challenge 1 alone. */
export const FLOW_LIQUIDS = Object.freeze(['water', 'brine']);
export const COMPARE_QUESTIONS = Object.freeze({
  stayMass: Object.freeze(['larger', 'smaller', 'same']),
  firstDrop: Object.freeze(['float', 'stay', 'sink']),
});
export const RECENT_DROPS_MAX = 8;
export const DROP_COUNT_MAX = 999;
export const HINT_AT = Object.freeze([2, 3, 5]);   // non-stay drops inside one trial that raise the hint to level 1, 2, 3

const START_SLOTS = 1;
const TRIAL_OF = Object.freeze({ 'trial1-test': 'trial1', 'trial1-complete': 'trial1', 'trial2-test': 'trial2', 'trial2-complete': 'trial2' });
const BENCH_PHASES = new Set([...Object.keys(TRIAL_OF), 'trial2-switch-liquid', 'trial3-drop']);
const NEXT_ON_CONTINUE = Object.freeze({ 'trial2-recorded': 'compare', 'trial3-observed': 'concept', concept: 'notebook', 'challenge-1': 'challenge-2', 'challenge-2': 'challenge-3', 'challenge-3': 'complete' });

/** Display rule, not physics: whole percent, never 0 or 100 for a floating object. The only such conversion in the engine. */
export function toImmersionPercent(rawFraction) {
  if (rawFraction === null || rawFraction === undefined) return null;
  return Math.min(99, Math.max(1, Math.round(rawFraction * 100)));
}

export function createInitialState() {
  return {
    phase: 'welcome',
    liquidId: 'water',
    slots: START_SLOTS,
    tank: { objectId: null },
    dropCount: { trial1: 0, trial2: 0 },
    failedDrops: { trial1: 0, trial2: 0 },
    recentDrops: { trial1: [], trial2: [] },
    records: { 1: null, 2: null, 3: null },
    trial2: { firstDrop: null },
    trial3: { tried: { wood: false, stone: false } },
    compare: { stayMass: null, firstDrop: null },
    conclusion: { level: null, relationLiquid: null, relationWood: null, freeText: '', evidenceText: '', limitationText: '' },
    challenges: emptyChallenges(),
    seq: 0,
  };
}

// ---- what the records show (never exposed through deriveView) -------------------------------------------------

/** The correct answers to the two compare questions, from the learner's own records. */
function expectedCompare(records) {
  const a = records[1], b = records[2];
  if (!a || !b || !b.firstDrop) return null;
  const m1 = blockMassG(a.slots), m2 = blockMassG(b.slots);
  return {
    stayMass: m2 === m1 ? 'same' : m2 > m1 ? 'larger' : 'smaller',
    firstDrop: blockOutcome({ slots: b.firstDrop.slots, liquidId: b.firstDrop.liquidId }).outcome,
  };
}

/** What Level A of the notebook must say, from the records; null until all three exist. */
export function expectedRelations(records) {
  const c = expectedCompare(records);
  const t = records[3];
  if (!c || !t || !t.tried?.wood || !t.tried?.stone) return null;
  const wood = objectOutcome({ objectId: 'wood', liquidId: t.liquidId });
  const stone = objectOutcome({ objectId: 'stone', liquidId: t.liquidId });
  const densityDecides = wood.relation === 'lighter' && stone.relation === 'heavier';
  return { liquid: c.stayMass, wood: densityDecides ? 'density' : null };
}
export const notebookIsReady = (state) => notebookReady(state.conclusion, expectedRelations(state.records));

export function compareStatus(state) {
  const expected = expectedCompare(state.records);
  const one = (q) => {
    const selected = state.compare[q];
    return { selected, status: selected === null || !expected ? null : selected === expected[q] ? 'correct' : 'incorrect' };
  };
  const questions = { stayMass: one('stayMass'), firstDrop: one('firstDrop') };
  return { questions, allCorrect: questions.stayMass.status === 'correct' && questions.firstDrop.status === 'correct' };
}

// ---- derived facts ----------------------------------------------------------------------------------------------

const factsOf = (r) => ({
  massG: r.massG, volumeCm3: r.volumeCm3, objectDensity: r.objectDensity, liquidDensity: r.liquidDensity,
  relation: r.relation, outcome: r.outcome, immersionFraction: r.immersionFraction, immersionPercent: toImmersionPercent(r.immersionFraction),
});
const recordFacts = (rec) => {
  const f = factsOf(blockOutcome({ slots: rec.slots, liquidId: rec.liquidId }));
  return { stayMassG: f.massG, volumeCm3: f.volumeCm3, objectDensity: f.objectDensity, liquidDensity: f.liquidDensity, outcome: f.outcome, immersionFraction: f.immersionFraction, immersionPercent: f.immersionPercent };
};

function deriveFacts(state) {
  const { records } = state;
  const currentBlock = factsOf(blockOutcome({ slots: state.slots, liquidId: state.liquidId }));
  const r1 = records[1] ? recordFacts(records[1]) : null;
  const r2 = records[2] ? recordFacts(records[2]) : null;
  const first = state.trial2.firstDrop ? factsOf(blockOutcome({ slots: state.trial2.firstDrop.slots, liquidId: state.trial2.firstDrop.liquidId })) : null;
  const shelf = { wood: { massG: TRIAL3.wood.massG, volumeCm3: TRIAL3.wood.volumeCm3 }, stone: { massG: TRIAL3.stone.massG, volumeCm3: TRIAL3.stone.volumeCm3 } };
  const observed = (id) => (state.trial3.tried[id] ? factsOf(objectOutcome({ objectId: id, liquidId: 'water' })) : null);
  const wood = observed('wood'), stone = observed('stone');
  const concept = r1 && r2 && records[3] && wood && stone
    ? [
      { id: 'block-water', massG: r1.stayMassG, volumeCm3: r1.volumeCm3, density: r1.objectDensity, outcome: r1.outcome },
      { id: 'block-brine', massG: r2.stayMassG, volumeCm3: r2.volumeCm3, density: r2.objectDensity, outcome: r2.outcome },
      { id: 'wood', massG: wood.massG, volumeCm3: wood.volumeCm3, density: wood.objectDensity, outcome: wood.outcome },
      { id: 'stone', massG: stone.massG, volumeCm3: stone.volumeCm3, density: stone.objectDensity, outcome: stone.outcome },
    ]
    : null;
  return { currentBlock, record1: r1, record2: r2, trial2FirstDrop: first, shelf, wood, stone, concept };
}

export const hintLevelOf = (failed) => HINT_AT.filter((n) => failed >= n).length;

/** Read-only projection of the state for the interface. It never changes the state and never holds an answer. */
export function deriveView(state) {
  const phase = state.phase;
  const tankEmpty = state.tank.objectId === null;
  const ballastOpen = phase in TRIAL_OF;
  const ballastLocked = !ballastOpen || !tankEmpty;
  const allowedHere = phase === 'trial3-drop' ? ['wood', 'stone'] : BENCH_PHASES.has(phase) ? ['block'] : [];
  const objects = {};
  for (const id of ['block', 'wood', 'stone']) {
    const here = allowedHere.includes(id);
    objects[id] = {
      available: here,
      where: state.tank.objectId === id ? 'tank' : 'table',
      putIn: here && tankEmpty && (phase !== 'trial2-switch-liquid' || state.liquidId === 'brine'),
      takeOut: here && state.tank.objectId === id && phase !== 'trial2-switch-liquid',
    };
  }
  const facts = deriveFacts(state);
  const trialKey = TRIAL_OF[phase] ?? null;
  const challengeId = /^challenge-[123]$/.test(phase) ? Number(phase.slice(-1)) : null;
  const challenge = challengeId ? challengeProgress(challengeId, state.challenges[challengeId]) : null;
  return {
    phase,
    liquidId: state.liquidId,
    slots: state.slots,
    tank: { objectId: state.tank.objectId },
    controls: {
      ballast: { locked: ballastLocked, canAdd: !ballastLocked && state.slots < BLOCK.slotsMax, canRemove: !ballastLocked && state.slots > BLOCK.slotsMin },
      liquid: { locked: !(phase === 'trial2-switch-liquid' && tankEmpty), options: [...FLOW_LIQUIDS] },
      objects,
    },
    recordEnabled: (phase === 'trial1-complete' || phase === 'trial2-complete') && state.tank.objectId === 'block' && facts.currentBlock.outcome === 'stay',
    hint: { trial: trialKey, level: trialKey ? hintLevelOf(state.failedDrops[trialKey]) : 0 },
    drops: { trial1: state.dropCount.trial1, trial2: state.dropCount.trial2 },
    compare: state.records[1] && state.records[2] ? compareStatus(state) : null,
    trial3: { tried: { ...state.trial3.tried }, bothTried: state.trial3.tried.wood && state.trial3.tried.stone },
    notebook: { ready: notebookIsReady(state) },
    challenge,
    facts,
  };
}

// ---- reducer ----------------------------------------------------------------------------------------------------

function reject(ctx, reason) {
  ctx.accepted = false;
  ctx.reason = reason;
}
function enter(ctx, phase) {
  const st = ctx.state;
  st.phase = phase;
  ctx.transitions.push(phase);
  if (phase === 'trial2-switch-liquid') {
    st.liquidId = 'water';
    st.tank.objectId = null;
    st.dropCount.trial2 = 0; st.failedDrops.trial2 = 0; st.recentDrops.trial2 = [];
    st.trial2.firstDrop = null;
  } else if (phase === 'trial3-drop') {
    st.liquidId = 'water';
    st.tank.objectId = null;
    st.trial3.tried = { wood: false, stone: false };
  }
}
function announce(ctx, event) {
  ctx.state.seq += 1;
  ctx.events.push({ ...event, id: `${event.type}-${ctx.state.seq}` });
}

function ballast(ctx, delta) {
  const st = ctx.state;
  if (!(st.phase in TRIAL_OF)) return reject(ctx, BENCH_PHASES.has(st.phase) ? 'locked' : 'wrong-phase');
  if (st.tank.objectId !== null) return reject(ctx, 'object-in-tank');
  const next = st.slots + delta;
  if (next < BLOCK.slotsMin || next > BLOCK.slotsMax) return reject(ctx, 'out-of-range');
  st.slots = next;
}

function selectLiquid(ctx, action) {
  const st = ctx.state;
  if (st.phase !== 'trial2-switch-liquid') return reject(ctx, BENCH_PHASES.has(st.phase) ? 'locked' : 'wrong-phase');
  if (typeof action.liquidId !== 'string' || !FLOW_LIQUIDS.includes(action.liquidId)) return reject(ctx, 'invalid');
  if (st.tank.objectId !== null) return reject(ctx, 'object-in-tank');
  st.liquidId = action.liquidId;
}

function putIn(ctx, action) {
  const st = ctx.state;
  if (!BENCH_PHASES.has(st.phase)) return reject(ctx, 'wrong-phase');
  const allowed = st.phase === 'trial3-drop' ? ['wood', 'stone'] : ['block'];
  if (typeof action.objectId !== 'string' || !allowed.includes(action.objectId)) return reject(ctx, 'invalid');
  if (st.tank.objectId !== null) return reject(ctx, 'object-in-tank');
  if (st.phase === 'trial2-switch-liquid' && st.liquidId !== 'brine') return reject(ctx, 'wrong-liquid');

  const id = action.objectId;
  const result = id === 'block' ? blockOutcome({ slots: st.slots, liquidId: st.liquidId }) : objectOutcome({ objectId: id, liquidId: st.liquidId });
  st.tank.objectId = id;
  const percent = toImmersionPercent(result.immersionFraction);
  const saw = (context) => announce(ctx, { type: 'observation', context, objectId: id, outcome: result.outcome, immersionPercent: percent });

  if (st.phase === 'trial2-switch-liquid') {
    st.trial2.firstDrop = { slots: st.slots, liquidId: st.liquidId };
    saw('trial2-first');
    enter(ctx, 'trial2-test');
    return;
  }
  if (st.phase === 'trial3-drop') {
    st.trial3.tried[id] = true;
    saw('trial3');
    if (st.trial3.tried.wood && st.trial3.tried.stone) {
      st.records[3] = { trial: 3, liquidId: 'water', tried: { wood: true, stone: true } };
      announce(ctx, { type: 'record-written', trial: 3 });
      enter(ctx, 'trial3-observed');
    }
    return;
  }
  const trial = TRIAL_OF[st.phase];
  st.dropCount[trial] = Math.min(DROP_COUNT_MAX, st.dropCount[trial] + 1);
  st.recentDrops[trial] = [...st.recentDrops[trial], { slots: st.slots, liquidId: st.liquidId }].slice(-RECENT_DROPS_MAX);
  saw(trial);
  if (result.outcome !== 'stay') {
    const before = hintLevelOf(st.failedDrops[trial]);
    st.failedDrops[trial] += 1;
    const after = hintLevelOf(st.failedDrops[trial]);
    if (after > before) ctx.events.push({ type: 'hint', trial, level: after });
  } else if (st.phase.endsWith('-test')) {
    enter(ctx, `${trial}-complete`);
  }
}

function takeOut(ctx) {
  const st = ctx.state;
  if (!BENCH_PHASES.has(st.phase)) return reject(ctx, 'wrong-phase');
  if (st.tank.objectId === null) return reject(ctx, 'object-on-table');
  st.tank.objectId = null;
}

function recordTrial(ctx, action) {
  const st = ctx.state;
  if (action.trial !== 1 && action.trial !== 2) return reject(ctx, 'invalid');
  if (st.phase !== `trial${action.trial}-complete`) return reject(ctx, 'wrong-phase');
  const now = st.tank.objectId === 'block' ? blockOutcome({ slots: st.slots, liquidId: st.liquidId }) : null;
  if (!now || now.outcome !== 'stay') return reject(ctx, 'not-stay');
  const key = `trial${action.trial}`;
  const base = { trial: action.trial, liquidId: st.liquidId, slots: st.slots, dropCount: st.dropCount[key], recentDrops: st.recentDrops[key].map((d) => ({ ...d })) };
  if (action.trial === 1) {
    st.records[1] = base;
    st.tank.objectId = null;
    announce(ctx, { type: 'record-written', trial: 1 });
    enter(ctx, 'trial1-recorded');
    enter(ctx, 'trial2-switch-liquid');
  } else {
    if (!st.records[1] || !st.trial2.firstDrop) return reject(ctx, 'invalid');
    st.records[2] = { ...base, firstDrop: { ...st.trial2.firstDrop }, independentVariable: 'liquid' };
    st.tank.objectId = null;
    announce(ctx, { type: 'record-written', trial: 2 });
    enter(ctx, 'trial2-recorded');
  }
}

function answerChallenge(ctx, action) {
  const st = ctx.state;
  const id = /^challenge-[123]$/.test(st.phase) ? Number(st.phase.slice(-1)) : null;
  if (id === null || action.id !== id) return reject(ctx, 'wrong-phase');
  const progress = challengeProgress(id, st.challenges[id]);
  const step = progress.steps.find((s) => s.id === action.step);
  const correct = judgeChallenge(id, action.step, action.choice);
  if (!step || correct === null) return reject(ctx, 'invalid');
  if (!step.unlocked || step.correct) return reject(ctx, 'locked');
  const attempts = step.attempts + 1;
  st.challenges[id].steps[action.step] = { choice: action.choice, correct, attempts };
  ctx.events.push({ type: 'challenge-answered', challengeId: id, step: action.step, correct, attempts });
}

function advance(ctx) {
  const st = ctx.state;
  if (st.phase === 'compare') {
    if (!compareStatus(st).allCorrect) return reject(ctx, 'locked');
    return enter(ctx, 'trial3-drop');
  }
  if (st.phase === 'notebook') {
    if (!notebookIsReady(st)) return reject(ctx, 'locked');
    return enter(ctx, 'challenge-1');
  }
  if (/^challenge-[123]$/.test(st.phase)) {
    const id = Number(st.phase.slice(-1));
    if (!challengeProgress(id, st.challenges[id]).allCorrect) return reject(ctx, 'locked');
    return enter(ctx, NEXT_ON_CONTINUE[st.phase]);
  }
  if (NEXT_ON_CONTINUE[st.phase]) return enter(ctx, NEXT_ON_CONTINUE[st.phase]);
  return reject(ctx, 'wrong-phase');
}

/**
 * reduce(state, action) → { state, events, transitions, accepted, reason? }
 * `transitions` lists every phase entered by this action; `events` are one-shot notices. A rejected action returns the
 * very same state object and no events. The input state is never mutated.
 */
export function reduce(prev, action) {
  const ctx = { state: structuredClone(prev), events: [], transitions: [], accepted: true, reason: undefined };
  const st = ctx.state;
  switch (action?.type) {
    case 'START':
      if (st.phase !== 'welcome') reject(ctx, 'wrong-phase'); else enter(ctx, 'mission');
      break;
    case 'BEGIN':
      if (st.phase !== 'mission') reject(ctx, 'wrong-phase');
      else {
        st.liquidId = 'water'; st.slots = START_SLOTS; st.tank.objectId = null;
        st.dropCount.trial1 = 0; st.failedDrops.trial1 = 0; st.recentDrops.trial1 = [];
        enter(ctx, 'trial1-test');
      }
      break;
    case 'ADD_BALLAST': ballast(ctx, 1); break;
    case 'REMOVE_BALLAST': ballast(ctx, -1); break;
    case 'SELECT_LIQUID': selectLiquid(ctx, action); break;
    case 'PUT_IN': putIn(ctx, action); break;
    case 'TAKE_OUT': takeOut(ctx); break;
    case 'RECORD_TRIAL': recordTrial(ctx, action); break;
    case 'ANSWER_COMPARE':
      if (st.phase !== 'compare') reject(ctx, 'wrong-phase');
      else if (!Object.hasOwn(COMPARE_QUESTIONS, action.question) || !COMPARE_QUESTIONS[action.question].includes(action.answer)) reject(ctx, 'invalid');
      else st.compare[action.question] = action.answer;
      break;
    case 'CONTINUE': advance(ctx); break;
    case 'SAVE_CONCLUSION': {
      const fields = sanitizeConclusionFields(action.fields);
      if (st.phase !== 'notebook') reject(ctx, 'wrong-phase');
      else if (!fields) reject(ctx, 'invalid');
      else Object.assign(st.conclusion, fields);
      break;
    }
    case 'ANSWER_CHALLENGE': answerChallenge(ctx, action); break;
    case 'RESTART':
      ctx.state = createInitialState();
      ctx.transitions.push('welcome');
      break;
    default: reject(ctx, 'unknown-action');
  }
  if (!ctx.accepted) return { state: prev, events: [], transitions: [], accepted: false, reason: ctx.reason };
  return { state: ctx.state, events: ctx.events, transitions: ctx.transitions, accepted: true };
}
