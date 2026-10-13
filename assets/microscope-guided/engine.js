// State engine for the guided microscope lab (Pilot #3, B1). Pure reducer: no DOM, no input handling, no timers.
// All geometry comes from model.js; this file never recomputes screen positions, fields of view or key steps.
// State holds learner inputs and raw records only. There is no answer key in state: correctness is a pure function
// of the records (see judgeDirection / judgeMagnification), so a saved state can never carry a forged "correct".
import {
  OBJECTIVES, BASE_OBJECTIVE, TEACHING_FEATURES, LETTER_E,
  clampStagePosition, specimenToScreen, distanceFromCenter, isFeatureVisible, visibleFeatures, fieldDiameterMm,
} from './model.js';

export const PHASES = Object.freeze([
  'welcome', 'mission',
  'trial1-horizontal', 'trial1-horizontal-complete', 'trial1-vertical', 'trial1-vertical-complete', 'compare-direction',
  'trial2-low', 'trial2-low-complete', 'trial2-high', 'trial2-high-complete', 'compare-magnification',
  // Reserved for later stages (no learner copy, no gates in B1): linear CONTINUE only.
  'concept', 'notebook', 'challenge-1', 'challenge-2', 'challenge-3', 'complete',
]);

// Trial 1: the e must be brought to the centre of the view within this many screen px.
export const TRIAL1_CENTER_TOLERANCE_PX = 40;
// Trial 2: B must be centred this closely so that it is still inside the field after switching to 40× (z = 10).
// 20 px x 10 = 200 px < 270 px field radius; the Trial 1 tolerance (40 px -> 400 px) would lose B.
export const TRIAL2_CENTER_TOLERANCE_PX = 20;

// Per-trial set-up. Feature coordinates follow model.js (wx right+, wy up+).
// Horizontal: the e starts on the RIGHT of the view (screen x = 420); slide RIGHT brings it to the centre.
// Vertical:   the e starts ABOVE the centre (screen y = 180); slide UP brings it to the centre.
export const TRIAL_CONFIG = Object.freeze({
  'trial1-horizontal': Object.freeze({ trial: 'horizontal', axis: 'x', objective: BASE_OBJECTIVE, startStage: Object.freeze({ x: 0, y: 0 }), features: Object.freeze([Object.freeze({ ...LETTER_E, wx: -120, wy: 0 })]), targetId: 'e', tolerance: TRIAL1_CENTER_TOLERANCE_PX }),
  'trial1-vertical': Object.freeze({ trial: 'vertical', axis: 'y', objective: BASE_OBJECTIVE, startStage: Object.freeze({ x: 0, y: 0 }), features: Object.freeze([Object.freeze({ ...LETTER_E, wx: 0, wy: -120 })]), targetId: 'e', tolerance: TRIAL1_CENTER_TOLERANCE_PX }),
  'trial2-low': Object.freeze({ trial: 'low', objective: BASE_OBJECTIVE, startStage: Object.freeze({ x: 100, y: 0 }), features: TEACHING_FEATURES, targetId: 'B', tolerance: TRIAL2_CENTER_TOLERANCE_PX }),
  'trial2-high': Object.freeze({ trial: 'high', objective: BASE_OBJECTIVE, features: TEACHING_FEATURES, targetId: 'B', tolerance: TRIAL2_CENTER_TOLERANCE_PX }),
});
const COMPLETE_OF = { 'trial1-horizontal': 'trial1-horizontal-complete', 'trial1-vertical': 'trial1-vertical-complete', 'trial2-low': 'trial2-low-complete', 'trial2-high': 'trial2-high-complete' };
const CONFIG_OF_PHASE = { ...Object.fromEntries(Object.keys(COMPLETE_OF).map((p) => [p, p])), ...Object.fromEntries(Object.entries(COMPLETE_OF).map(([p, c]) => [c, p])) };
const MOVABLE = new Set(Object.keys(COMPLETE_OF));

export const COMPARE_QUESTIONS = Object.freeze({
  direction: Object.freeze({ relation: Object.freeze(['opposite', 'same', 'unrelated']) }),
  magnification: Object.freeze({ field: Object.freeze(['smaller', 'same', 'larger']), count: Object.freeze(['fewer', 'same', 'more']) }),
});
const COMPARE_PHASE = { direction: 'compare-direction', magnification: 'compare-magnification' };

const isNumber = (x) => typeof x === 'number' && Number.isFinite(x);
const sign = (x) => (x > 1e-9 ? 1 : x < -1e-9 ? -1 : 0);

export function createInitialState() {
  return {
    phase: 'welcome',
    objective: BASE_OBJECTIVE,
    stage: { x: 0, y: 0 },
    records: { horizontal: null, vertical: null, low: null, high: null },
    compare: { direction: { relation: null }, magnification: { field: null, count: null } },
  };
}

export const configFor = (phase) => TRIAL_CONFIG[CONFIG_OF_PHASE[phase]] ?? null;

// ---- pure derivations ------------------------------------------------------------------------------------------

/** Everything a renderer needs for the current phase; positions come from model.js. */
export function deriveView(state) {
  const cfg = configFor(state.phase);
  if (!cfg) return { features: [], positions: {}, visibleIds: [], target: null, locked: true };
  const { stage, objective } = state;
  const positions = Object.fromEntries(cfg.features.map((feature) => [feature.id, specimenToScreen({ feature, stage, objective })]));
  const targetFeature = cfg.features.find((f) => f.id === cfg.targetId);
  const distance = distanceFromCenter({ feature: targetFeature, stage, objective });
  return {
    features: cfg.features, positions, objective, stage,
    visibleIds: visibleFeatures({ features: cfg.features, stage, objective }).map((f) => f.id),
    target: { id: cfg.targetId, distance, centered: distance <= cfg.tolerance + 1e-9, visible: isFeatureVisible({ feature: targetFeature, stage, objective }) },
    locked: !MOVABLE.has(state.phase),
  };
}

/** What each phase lets the learner change. */
export const rangesFor = (phase) => ({
  stage: MOVABLE.has(phase), objective: phase === 'trial2-high',
});

const isDone = (state) => {
  const v = deriveView(state);
  if (state.phase === 'trial2-high') return state.objective === OBJECTIVES.at(-1) && v.target.visible;
  return v.target.centered;
};

/** Relation between slide motion and image motion for one Trial 1 record, from raw inputs only. */
export function recordRelation(record) {
  if (!record) return null;
  const axis = record.trial === 'horizontal' ? 'x' : record.trial === 'vertical' ? 'y' : null;
  if (!axis) return null;
  const slide = sign(record.stageDelta?.[axis]);
  // Screen y points down, the stage y points up: convert the image displacement to the same (right/up positive) sense.
  const image = (axis === 'x' ? 1 : -1) * sign(record.imageDelta?.[axis]);
  if (!slide || !image) return null;
  return slide * image < 0 ? 'opposite' : 'same';
}

/** The relation both Trial 1 records agree on, or null. */
export function judgeDirection(records) {
  const h = recordRelation(records.horizontal), v = recordRelation(records.vertical);
  return h && h === v ? h : null;
}

/** What the Trial 2 records show about the field and the number of marks, recomputed from objective + stage. */
export function observeMagnification(records) {
  if (!records.low || !records.high) return null;
  const seen = (r) => visibleFeatures({ features: TEACHING_FEATURES, stage: r.stage, objective: r.objective }).map((f) => f.id);
  const lowIds = seen(records.low), highIds = seen(records.high);
  const cmp = (a, b, lo, hi) => (a < b ? lo : a > b ? hi : 'same');
  return {
    lowIds, highIds,
    field: cmp(fieldDiameterMm(records.high.objective), fieldDiameterMm(records.low.objective), 'smaller', 'larger'),
    count: cmp(highIds.length, lowIds.length, 'fewer', 'more'),
  };
}

export function judgeMagnification(records) {
  const o = observeMagnification(records);
  return o ? { field: o.field, count: o.count } : null;
}

/** Learner answers against the expectation recomputed from records. Never stored in state. */
export function compareView(state) {
  const d = judgeDirection(state.records), m = judgeMagnification(state.records);
  const direction = { relation: { answer: state.compare.direction.relation, correct: d !== null && state.compare.direction.relation === d } };
  const magnification = Object.fromEntries(['field', 'count'].map((q) => [q, { answer: state.compare.magnification[q], correct: m !== null && state.compare.magnification[q] === m[q] }]));
  const all = (g) => Object.values(g).every((x) => x.correct);
  return { direction, magnification, directionCorrect: all(direction), magnificationCorrect: all(magnification) };
}

// ---- reducer ---------------------------------------------------------------------------------------------------

const NEXT = {
  welcome: 'mission', 'trial1-horizontal-complete': 'trial1-vertical', 'trial1-vertical-complete': 'compare-direction',
  'trial2-low-complete': 'trial2-high', 'trial2-high-complete': 'compare-magnification',
  concept: 'notebook', notebook: 'challenge-1', 'challenge-1': 'challenge-2', 'challenge-2': 'challenge-3', 'challenge-3': 'complete',
};

function enter(ctx, phase) {
  const st = ctx.state, from = st.phase, cfg = TRIAL_CONFIG[phase];
  st.phase = phase;
  if (cfg?.startStage) { st.stage = { ...cfg.startStage }; st.objective = cfg.objective; }
  ctx.transitions.push({ from, to: phase });
}
const reject = (ctx, reason) => { ctx.accepted = false; ctx.reason = reason; };

function afterMove(ctx) {
  const st = ctx.state;
  if (isDone(st)) { ctx.events.push({ type: 'trial-complete', phase: st.phase }); enter(ctx, COMPLETE_OF[st.phase]); }
}

function moveStage(ctx, x, y) {
  if (!MOVABLE.has(ctx.state.phase)) return reject(ctx, 'locked');
  if (!isNumber(x) || !isNumber(y)) return reject(ctx, 'invalid');
  ctx.state.stage = clampStagePosition({ x, y });
  afterMove(ctx);
}

function record(ctx) {
  const st = ctx.state, phase = st.phase, cfg = configFor(phase);
  if (!cfg || !Object.values(COMPLETE_OF).includes(phase)) return reject(ctx, 'wrong-phase');
  if (cfg.trial === 'horizontal' || cfg.trial === 'vertical') {
    const feature = cfg.features[0], objective = cfg.objective;
    const stageStart = { ...cfg.startStage }, stageEnd = { ...st.stage };
    const imageStart = specimenToScreen({ feature, stage: stageStart, objective }), imageEnd = specimenToScreen({ feature, stage: stageEnd, objective });
    // Raw inputs only. No "opposite"/"same" label is stored: recordRelation() derives it on demand.
    st.records[cfg.trial] = {
      trial: cfg.trial, objective, stageStart, stageEnd,
      stageDelta: { x: stageEnd.x - stageStart.x, y: stageEnd.y - stageStart.y },
      imageStart, imageEnd, imageDelta: { x: imageEnd.x - imageStart.x, y: imageEnd.y - imageStart.y },
    };
  } else {
    // Counts and field size are derived from objective + stage by observeMagnification(); nothing derived is stored.
    st.records[cfg.trial] = { trial: cfg.trial, objective: st.objective, stage: { ...st.stage } };
  }
  ctx.events.push({ type: 'record-written', trial: cfg.trial });
  enter(ctx, NEXT[phase]);
}

export function reduce(prev, action) {
  const ctx = { state: structuredClone(prev), events: [], transitions: [], accepted: true, reason: null };
  const st = ctx.state;
  switch (action?.type) {
    case 'START':
      if (st.phase !== 'welcome') reject(ctx, 'wrong-phase'); else enter(ctx, 'mission');
      break;
    case 'BEGIN':
      if (st.phase !== 'mission') reject(ctx, 'wrong-phase'); else enter(ctx, 'trial1-horizontal');
      break;
    case 'SET_STAGE': moveStage(ctx, action.x, action.y); break;
    case 'MOVE_STAGE':
      if (!isNumber(action.dx) || !isNumber(action.dy)) reject(ctx, 'invalid');
      else moveStage(ctx, st.stage.x + action.dx, st.stage.y + action.dy);
      break;
    case 'SET_OBJECTIVE':
      if (st.phase !== 'trial2-high') reject(ctx, 'locked');
      else if (!OBJECTIVES.includes(action.objective)) reject(ctx, 'invalid');
      else { st.objective = action.objective; afterMove(ctx); }
      break;
    case 'RECORD': record(ctx); break;
    case 'ANSWER_COMPARE': {
      const group = COMPARE_QUESTIONS[action.compare], options = group?.[action.question];
      if (st.phase !== COMPARE_PHASE[action.compare]) reject(ctx, 'wrong-phase');
      else if (!options || !options.includes(action.answer)) reject(ctx, 'invalid');
      else st.compare[action.compare][action.question] = action.answer;
      break;
    }
    case 'CONTINUE':
      if (st.phase === 'compare-direction') { if (compareView(st).directionCorrect) enter(ctx, 'trial2-low'); else reject(ctx, 'locked'); }
      else if (st.phase === 'compare-magnification') { if (compareView(st).magnificationCorrect) enter(ctx, 'concept'); else reject(ctx, 'locked'); }
      else if (['concept', 'notebook', 'challenge-1', 'challenge-2', 'challenge-3'].includes(st.phase)) enter(ctx, NEXT[st.phase]);
      else reject(ctx, 'wrong-phase');
      break;
    default: reject(ctx, 'unknown-action');
  }
  if (!ctx.accepted) return { state: prev, accepted: false, reason: ctx.reason, events: [], transitions: [] };
  return { state: ctx.state, accepted: true, reason: null, events: ctx.events, transitions: ctx.transitions };
}
