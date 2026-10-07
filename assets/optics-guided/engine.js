// State engine for the guided optics lab (Spec v1.2 §6.2, §8, §10).
// Pure reducer: no DOM, no input handling, no timers. All physics comes from model.js; this file never
// recomputes v, m, sharpness, bench overflow or focus.
import { calculateLensState, calculateClarity, clarityTolerance, NUMERIC_EPSILON } from './model.js';

export const PHASES = [
  'welcome', 'mission',
  'trial1-find-screen', 'trial1-complete', 'trial1-recorded',
  'trial2-move-object', 'trial2-find-screen', 'trial2-complete', 'trial2-recorded',
  'compare',
  'trial3-move-object', 'trial3-search-screen', 'trial3-no-real-screen-image', 'trial3-view-through-lens',
  'concept', 'notebook', 'challenge-1', 'challenge-2', 'challenge-3', 'complete',
];

export const FOCAL_LENGTH = 10;
export const START_CANDLE = 30;          // Trial 1 object distance
export const START_SCREEN = 20;          // Trial 1 initial screen position (Lv3)
export const TARGET_TRIAL2_U = 15;
export const TARGET_TRIAL3_U = 5;
export const SCREEN_RANGE = Object.freeze({ min: 8, max: 40 });
export const CANDLE_RANGE = Object.freeze({
  trial2: Object.freeze({ min: 12, max: 35 }),
  trial3: Object.freeze({ min: 5, max: 35 }),
});

// Trial 3 search zones: near 8 ≤ s < 17, middle 17 ≤ s < 29, far 29 ≤ s ≤ 40.
export const ZONE_IDS = Object.freeze(['near', 'middle', 'far']);
const ZONE_BOUNDS = { near: [-Infinity, 17], middle: [17, 29], far: [29, Infinity] };   // [from, to)
export const zoneOf = (s) => ZONE_IDS.find((id) => s >= ZONE_BOUNDS[id][0] && s < ZONE_BOUNDS[id][1]);

// Zones touched by moving from `prev` to `next`: everything in (prev, next] or [next, prev); the start point is excluded.
export function zonesCovered(prev, next) {
  if (next === prev) return [];
  return ZONE_IDS.filter((id) => {
    const [za, zb] = ZONE_BOUNDS[id];
    return next > prev ? (next >= za && prev < zb) : (next < zb && prev > za);
  });
}

// Stall hints: cm of screen travel without a new best error (or, in Trial 3, without a newly explored zone).
export const HINT_TRAVEL_CM = Object.freeze([10, 20, 30]);
export const WRONG_DIRECTION_CM = 3;

const eq = (a, b) => Math.abs(a - b) <= NUMERIC_EPSILON * Math.max(1, Math.abs(a), Math.abs(b));
const isNumber = (x) => typeof x === 'number' && Number.isFinite(x);

const freshHints = (bestError = null) => ({ shown: 0, travel: 0, bestError, awayRun: 0, wrongDirectionFired: false, firstMoveShown: false });

export function createInitialState() {
  return {
    phase: 'welcome', f: FOCAL_LENGTH, u: START_CANDLE, s: START_SCREEN,
    records: { 1: null, 2: null, 3: null },
    search: { zones: [], ctaUnlocked: false },
    hints: freshHints(),
    alreadyRecordedActive: false,
    compare: { position: null, size: null },
    conclusion: { level: null, relationPosition: null, relationSize: null, freeText: '', evidenceText: '', limitationText: '' },
    challenges: { 1: null, 2: null, 3: null },
  };
}

/** What each phase lets the learner move. `locked` objects reject movement. */
export function rangesFor(phase) {
  const screen = { min: SCREEN_RANGE.min, max: SCREEN_RANGE.max };
  const none = { locked: true };
  const free = (r) => ({ locked: false, min: r.min, max: r.max });
  switch (phase) {
    case 'trial1-find-screen': case 'trial1-complete': case 'trial2-find-screen': case 'trial2-complete': case 'trial3-search-screen':
      return { candle: none, screen: free(screen) };
    case 'trial2-move-object': return { candle: free(CANDLE_RANGE.trial2), screen: none };
    case 'trial3-move-object': return { candle: free(CANDLE_RANGE.trial3), screen: none };
    default: return { candle: none, screen: none };
  }
}

const lensAndClarity = (state) => {
  const lensState = calculateLensState({ f: state.f, u: state.u });
  return { lensState, clarity: calculateClarity({ lensState, screenPosition: state.s }) };
};
const isSharp = (state) => lensAndClarity(state).clarity.effectiveClarityLevel === 1;

/** 'left' | 'right' toward the clear position; null unless a finite, on-bench target exists (never for virtual / infinite / bench overflow). */
export function hintDirection(state) {
  const { lensState } = lensAndClarity(state);
  if (lensState.imageType !== 'real' || !lensState.projectionWithinBench) return null;
  const d = lensState.theoreticalV - state.s;
  return d > NUMERIC_EPSILON ? 'right' : d < -NUMERIC_EPSILON ? 'left' : null;
}

const CHANGEABLE = ['f', 'u'];
export function changedVariables(prev, next) {
  return prev ? CHANGEABLE.filter((k) => !eq(prev[k], next[k])) : [];
}

function buildRecord(state, trial, observedScreenPosition, prevRecord) {
  const { lensState, clarity } = lensAndClarity(state);
  const record = {
    trial, f: state.f, u: state.u,
    theoreticalV: lensState.theoreticalV, observedScreenPosition,
    magnification: lensState.magnification, absoluteMagnification: lensState.absoluteMagnification,
    imageType: lensState.imageType, imageOrientation: lensState.imageOrientation, imageSize: lensState.imageSize,
    projectable: lensState.projectable, projectionWithinBench: lensState.projectionWithinBench,
    clarity: clarity.effectiveClarityLevel, rawClarityLevel: clarity.rawClarityLevel,
    changedVariables: changedVariables(prevRecord, { f: state.f, u: state.u }),
  };
  if (trial === 3) record.search = { searchedZones: [...state.search.zones], screenImageFound: false };
  return record;
}

/** Evidence comparison built only from records (Spec §8.2 compare, §12 controlled variable). */
export function compareRecords(a, b) {
  const changed = changedVariables(a, b);
  const status = changed.length === 0 ? 'none' : changed.length === 1 ? 'single' : 'multiple';
  const tol = clarityTolerance(b.f);
  const dPos = b.observedScreenPosition - a.observedScreenPosition;
  const positionChange = Math.abs(dPos) <= tol ? 'same' : dPos > 0 ? 'farther' : 'closer';
  const dSize = b.absoluteMagnification - a.absoluteMagnification;
  const sizeChange = Math.abs(dSize) <= NUMERIC_EPSILON ? 'same' : dSize > 0 ? 'larger' : 'smaller';
  return {
    changedVariables: changed, status, directComparable: status === 'single', positionChange, sizeChange,
    rows: [
      { key: 'f', first: a.f, second: b.f }, { key: 'u', first: a.u, second: b.u },
      { key: 'observedScreenPosition', first: a.observedScreenPosition, second: b.observedScreenPosition },
      { key: 'imageSize', first: a.imageSize, second: b.imageSize },
    ],
  };
}

/** Read-only projection of the state for the UI. */
export function deriveView(state) {
  const { lensState, clarity } = lensAndClarity(state);
  const explored = ZONE_IDS.filter((z) => state.search.zones.includes(z));
  const view = {
    phase: state.phase, f: state.f, u: state.u, s: state.s, lensState, clarity,
    ranges: rangesFor(state.phase),
    recordEnabled: (state.phase === 'trial1-complete' || state.phase === 'trial2-complete') && clarity.effectiveClarityLevel === 1,
    search: { explored, unexplored: ZONE_IDS.filter((z) => !explored.includes(z)), ctaUnlocked: state.search.ctaUnlocked },
    compare: null,
  };
  if (state.records[1] && state.records[2]) {
    const c = compareRecords(state.records[1], state.records[2]);
    view.compare = { ...c, correct: { position: c.positionChange, size: c.sizeChange }, answers: { ...state.compare },
      answered: state.compare.position !== null && state.compare.size !== null,
      allCorrect: state.compare.position === c.positionChange && state.compare.size === c.sizeChange };
  }
  return view;
}

// ---------------------------------------------------------------------------------------------------------

const matchesRecorded = (st) => [1, 2].some((t) => st.records[t] && eq(st.records[t].u, st.u)) && isSharp(st);

function enter(ctx, phase) {
  const st = ctx.state;
  st.phase = phase; ctx.transitions.push(phase);
  st.alreadyRecordedActive = matchesRecorded(st);
  if (phase === 'trial1-find-screen' || phase === 'trial2-find-screen') st.hints = freshHints(lensAndClarity(st).clarity.error);
  if (phase === 'trial3-search-screen') { st.search = { zones: [], ctaUnlocked: false }; st.hints = freshHints(); }
}

// Conditions that move the machine on without a learner action (Spec §8.1A "自動").
function autoTransitions(ctx) {
  for (let guard = 0; guard < 8; guard++) {
    const st = ctx.state;
    if (st.phase === 'trial1-find-screen' && isSharp(st)) enter(ctx, 'trial1-complete');
    else if (st.phase === 'trial1-recorded') enter(ctx, 'trial2-move-object');
    else if (st.phase === 'trial2-move-object' && eq(st.u, TARGET_TRIAL2_U)) enter(ctx, 'trial2-find-screen');
    else if (st.phase === 'trial2-find-screen' && isSharp(st)) enter(ctx, 'trial2-complete');
    else if (st.phase === 'trial2-recorded') enter(ctx, 'compare');
    else if (st.phase === 'trial3-move-object' && eq(st.u, TARGET_TRIAL3_U)) enter(ctx, 'trial3-search-screen');
    else return;
  }
}

const reject = (ctx, action, reason) => { ctx.accepted = false; ctx.events.push({ type: 'rejected', action: action.type, reason }); };

function trackAlreadyRecorded(ctx) {
  const st = ctx.state;
  const matched = matchesRecorded(st);
  if (matched && !st.alreadyRecordedActive) ctx.events.push({ type: 'result-already-recorded' });
  st.alreadyRecordedActive = matched;
}

function stallHints(ctx, progressed) {
  const st = ctx.state, h = st.hints;
  if (progressed) h.travel = 0;
  let level = HINT_TRAVEL_CM.filter((cm) => h.travel >= cm).length;
  if (level <= h.shown) return;
  if (level === 3) {
    if (st.phase === 'trial3-search-screen') {
      const unexplored = ZONE_IDS.filter((z) => !st.search.zones.includes(z));
      if (unexplored.length) { h.shown = 3; ctx.events.push({ type: 'hint', level: 3, kind: 'search-progress', unexplored }); return; }
    } else {
      const direction = hintDirection(st);
      if (direction) { h.shown = 3; ctx.events.push({ type: 'hint', level: 3, kind: 'direction', direction }); return; }
    }
    level = 2;
    if (h.shown >= 2) return;
  }
  h.shown = level;
  ctx.events.push({ type: 'hint', level, kind: 'generic' });
}

function moveScreen(ctx, action) {
  const st = ctx.state, range = rangesFor(st.phase).screen;
  if (!isNumber(action.position)) return reject(ctx, action, 'invalid');
  if (range.locked) return reject(ctx, action, 'locked');
  const prev = st.s, next = Math.min(range.max, Math.max(range.min, action.position));
  if (next === prev) return;
  const h = st.hints, travelled = Math.abs(next - prev);
  const before = lensAndClarity(st).clarity.error;
  st.s = next;
  const after = lensAndClarity(st).clarity.error;

  if (st.phase === 'trial1-find-screen' || st.phase === 'trial2-find-screen') {
    if (!h.firstMoveShown) { h.firstMoveShown = true; ctx.events.push({ type: 'first-screen-move' }); }
    h.travel += travelled;
    if (after > before + NUMERIC_EPSILON) h.awayRun += travelled; else if (after < before - NUMERIC_EPSILON) h.awayRun = 0;
    if (!h.wrongDirectionFired && h.awayRun >= WRONG_DIRECTION_CM) { h.wrongDirectionFired = true; ctx.events.push({ type: 'wrong-direction' }); }
    const progressed = h.bestError === null || after < h.bestError - NUMERIC_EPSILON;
    if (progressed) h.bestError = after;
    stallHints(ctx, progressed);
  } else if (st.phase === 'trial3-search-screen') {
    if (!h.firstMoveShown) { h.firstMoveShown = true; ctx.events.push({ type: 'first-screen-move' }); }
    h.travel += travelled;
    const before = st.search.zones.length;
    for (const z of zonesCovered(prev, next)) if (!st.search.zones.includes(z)) st.search.zones.push(z);
    st.search.zones.sort((a, b) => ZONE_IDS.indexOf(a) - ZONE_IDS.indexOf(b));
    const count = st.search.zones.length, progressed = count > before;
    if (progressed && count >= 2) ctx.events.push({ type: 'zones-explored', count });
    if (count === ZONE_IDS.length && !st.search.ctaUnlocked) { st.search.ctaUnlocked = true; ctx.events.push({ type: 'zones-complete' }); }
    stallHints(ctx, progressed);
  }
  trackAlreadyRecorded(ctx);
}

function moveCandle(ctx, action) {
  const st = ctx.state, range = rangesFor(st.phase).candle;
  if (!isNumber(action.position)) return reject(ctx, action, 'invalid');
  if (range.locked) return reject(ctx, action, 'locked');
  const next = Math.min(range.max, Math.max(range.min, action.position));
  if (next === st.u) return;
  st.u = next;
  trackAlreadyRecorded(ctx);
}

function record(ctx, action) {
  const st = ctx.state, trial = st.phase === 'trial1-complete' ? 1 : st.phase === 'trial2-complete' ? 2 : 0;
  if (!trial) return reject(ctx, action, [1, 2].some((t) => st.records[t]) ? 'already-recorded' : 'not-recordable');
  if (!isSharp(st)) return reject(ctx, action, 'not-sharp');
  st.records[trial] = buildRecord(st, trial, st.s, trial === 2 ? st.records[1] : null);
  ctx.events.push({ type: 'record-written', trial });
  enter(ctx, `trial${trial}-recorded`);
}

function linear(ctx, action, from, to, gate) {
  if (ctx.state.phase !== from) return reject(ctx, action, 'wrong-phase');
  if (gate && !gate(ctx.state)) return reject(ctx, action, 'locked');
  enter(ctx, to);
}

const NEXT_ON_CONTINUE = {
  'trial3-view-through-lens': 'concept', concept: 'notebook', notebook: 'challenge-1',
  'challenge-1': 'challenge-2', 'challenge-2': 'challenge-3', 'challenge-3': 'complete',
};

/**
 * reduce(state, action) → { state, events, transitions, accepted }
 * `transitions` lists every phase entered during this action (so the UI can play each one's feedback);
 * `events` are one-shot notices (hints, record-written, rejected, ...). The input state is never mutated.
 */
export function reduce(prev, action) {
  const ctx = { state: structuredClone(prev), events: [], transitions: [], accepted: true };
  const st = ctx.state;
  switch (action?.type) {
    case 'START': linear(ctx, action, 'welcome', 'mission'); break;
    case 'BEGIN':
      if (st.phase !== 'mission') reject(ctx, action, 'wrong-phase');
      else { st.u = START_CANDLE; st.s = START_SCREEN; enter(ctx, 'trial1-find-screen'); }
      break;
    case 'MOVE_SCREEN': moveScreen(ctx, action); break;
    case 'MOVE_CANDLE': moveCandle(ctx, action); break;
    case 'RECORD': record(ctx, action); break;
    case 'ANSWER_COMPARE':
      if (st.phase !== 'compare') reject(ctx, action, 'wrong-phase');
      else if (!['position', 'size'].includes(action.question) || typeof action.answer !== 'string') reject(ctx, action, 'invalid');
      else st.compare[action.question] = action.answer;
      break;
    case 'CONTINUE':
      if (st.phase === 'compare') linear(ctx, action, 'compare', 'trial3-move-object', (s) => deriveView(s).compare?.allCorrect === true);
      else if (st.phase === 'notebook') linear(ctx, action, 'notebook', 'challenge-1', (s) => s.conclusion.relationPosition !== null && s.conclusion.relationSize !== null);
      else if (NEXT_ON_CONTINUE[st.phase]) enter(ctx, NEXT_ON_CONTINUE[st.phase]);
      else reject(ctx, action, 'wrong-phase');
      break;
    case 'CONFIRM_NO_REAL_IMAGE':
      if (st.phase !== 'trial3-search-screen') reject(ctx, action, 'wrong-phase');
      else if (!st.search.ctaUnlocked) reject(ctx, action, 'locked');
      else { st.records[3] = buildRecord(st, 3, null, st.records[2]); ctx.events.push({ type: 'record-written', trial: 3 }); enter(ctx, 'trial3-no-real-screen-image'); }
      break;
    case 'VIEW_THROUGH_LENS': linear(ctx, action, 'trial3-no-real-screen-image', 'trial3-view-through-lens'); break;
    case 'SAVE_CONCLUSION':
      if (st.phase !== 'notebook') reject(ctx, action, 'wrong-phase');
      else Object.assign(st.conclusion, Object.fromEntries(Object.entries(action.fields ?? {}).filter(([k]) => k in st.conclusion)));
      break;
    case 'ANSWER_CHALLENGE':
      if (!/^challenge-[123]$/.test(st.phase) || action.id !== Number(st.phase.slice(-1))) reject(ctx, action, 'wrong-phase');
      else st.challenges[action.id] = action.answer ?? null;
      break;
    default: reject(ctx, action ?? {}, 'unknown-action');
  }
  if (ctx.accepted) autoTransitions(ctx);
  return { state: ctx.state, events: ctx.events, transitions: ctx.transitions, accepted: ctx.accepted };
}
