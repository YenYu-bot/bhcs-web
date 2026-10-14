// Progress saving for the guided microscope lab (Pilot #3, B4).
// serialize() keeps only what the learner did; restore() rebuilds a state from that, one layer at a time, and trusts nothing it
// reads: every record is rebuilt against the model (a record can only exist if its trial really finished), every compare answer
// and every challenge answer is judged again, and no displacement, visible-mark list, field size, relation, "ready" or "correct"
// flag is ever read back (they are not even written). If an upstream layer is invalid, everything downstream of it is dropped,
// and the phase can never be later than what was validated, later than what the save itself claimed, or earlier than what the
// records it holds imply. An unfinished trial is put back by replaying the saved stage and objective through the engine itself.
// It holds no wording, no DOM and no usage reporting, and restoring dispatches nothing.
import { createInitialState, reduce, PHASES, TRIAL_CONFIG, compareView, notebookIsReady, expectedRelations } from './engine.js';
import { clampStagePosition, distanceFromCenter, isFeatureVisible, OBJECTIVES, TEACHING_FEATURES } from './model.js';
import { CHALLENGES, ATTEMPTS_MAX, TEXT_MAX, challengeProgress, emptyChallenges, judgeChallenge, sanitizeConclusionFields } from './challenges.js';

export const STORAGE_KEY = 'bhcs-microscope-guided:v1';
export const VERSION = 1;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isPoint = (p) => isObject(p) && Number.isFinite(p.x) && Number.isFinite(p.y);
const rank = (phase) => PHASES.indexOf(phase);

// ---- serialize ------------------------------------------------------------------------------------------------------

const point = (p) => ({ x: p.x, y: p.y });

/** The save as a plain object: operation facts only. */
export function toSave(state) {
  const r = state.records;
  const challenges = {};
  for (const c of CHALLENGES) {
    challenges[c.id] = { steps: {} };
    for (const [stepId, a] of Object.entries(state.challenges?.[c.id]?.steps ?? {})) challenges[c.id].steps[stepId] = { choice: a.choice, attempts: a.attempts };
  }
  challenges[3].note = state.challenges?.[3]?.note ?? '';
  return {
    v: VERSION,
    phase: state.phase,
    stage: point(state.stage),
    objective: state.objective,
    records: {
      horizontal: r.horizontal ? { trial: 'horizontal', objective: r.horizontal.objective, stageStart: point(r.horizontal.stageStart), stageEnd: point(r.horizontal.stageEnd) } : null,
      vertical: r.vertical ? { trial: 'vertical', objective: r.vertical.objective, stageStart: point(r.vertical.stageStart), stageEnd: point(r.vertical.stageEnd) } : null,
      low: r.low ? { trial: 'low', objective: r.low.objective, stage: point(r.low.stage) } : null,
      high: r.high ? { trial: 'high', objective: r.high.objective, stage: point(r.high.stage) } : null,
    },
    compare: { relation: state.compare.direction.relation, field: state.compare.magnification.field, count: state.compare.magnification.count },
    conclusion: { ...state.conclusion },
    challenges,
  };
}
export const serialize = (state) => JSON.stringify(toSave(state));

// ---- restore: one layer at a time -----------------------------------------------------------------------------------

/** A Trial 1 record is valid when its inputs are plausible and the e really ended inside the centre tolerance (asked of the model). */
function parseTrial1(raw, trial) {
  const cfg = TRIAL_CONFIG[`trial1-${trial}`];
  if (!isObject(raw) || raw.trial !== trial || raw.objective !== cfg.objective || !isPoint(raw.stageStart) || !isPoint(raw.stageEnd)) return null;
  if (raw.stageStart.x !== cfg.startStage.x || raw.stageStart.y !== cfg.startStage.y) return null;
  const stageEnd = clampStagePosition(raw.stageEnd);
  if (distanceFromCenter({ feature: cfg.features[0], stage: stageEnd, objective: cfg.objective }) > cfg.tolerance + 1e-9) return null;
  return { trial, objective: cfg.objective, stageStart: { ...cfg.startStage }, stageEnd };
}
const teachingB = TEACHING_FEATURES.find((f) => f.id === 'B');
/** Trial 2: low at 4× with B centred within its tolerance; high at 40× with B still in the field. Counts are recomputed, never read. */
function parseLow(raw) {
  const cfg = TRIAL_CONFIG['trial2-low'];
  if (!isObject(raw) || raw.trial !== 'low' || raw.objective !== OBJECTIVES[0] || !isPoint(raw.stage)) return null;
  const stage = clampStagePosition(raw.stage);
  if (distanceFromCenter({ feature: teachingB, stage, objective: raw.objective }) > cfg.tolerance + 1e-9) return null;
  return { trial: 'low', objective: raw.objective, stage };
}
function parseHigh(raw) {
  if (!isObject(raw) || raw.trial !== 'high' || raw.objective !== OBJECTIVES.at(-1) || !isPoint(raw.stage)) return null;
  const stage = clampStagePosition(raw.stage);
  if (!isFeatureVisible({ feature: teachingB, stage, objective: raw.objective })) return null;
  return { trial: 'high', objective: raw.objective, stage };
}

const COMPARE_OPTIONS = { relation: ['opposite', 'same', 'unrelated'], field: ['smaller', 'same', 'larger'], count: ['fewer', 'same', 'more'] };
function parseCompare(raw) {
  const pick = (k) => (isObject(raw) && COMPARE_OPTIONS[k].includes(raw[k]) ? raw[k] : null);
  return { direction: { relation: pick('relation') }, magnification: { field: pick('field'), count: pick('count') } };
}

const TEXT_KEYS = ['freeText', 'evidenceText', 'limitationText'];
/** Conclusion fields one by one: a bad field falls back to empty without taking the good ones down with it. */
function parseConclusion(raw, expected) {
  const out = createInitialState().conclusion;
  if (!isObject(raw)) return out;
  for (const key of ['level', 'relationDirection', 'relationRange', ...TEXT_KEYS]) {
    if (!(key in raw)) continue;
    const clean = sanitizeConclusionFields({ [key]: raw[key] });
    if (clean) Object.assign(out, clean);
  }
  if (out.relationDirection !== null && out.relationDirection !== expected.direction) out.relationDirection = null;   // a relation that does not match the learner's own records is not kept
  if (out.relationRange !== null && out.relationRange !== expected.range) out.relationRange = null;
  return out;
}

/** Challenge answers are judged again; a step counts only after the one before it was solved. */
function parseChallenges(raw) {
  const out = emptyChallenges();
  let open = false;
  for (const c of CHALLENGES) {
    if (open) break;
    for (const step of c.steps) {
      const a = isObject(raw) && isObject(raw[c.id]) && isObject(raw[c.id].steps) ? raw[c.id].steps[step.id] : null;
      if (!isObject(a) || !Number.isSafeInteger(a.attempts) || a.attempts < 1) { open = true; break; }
      const correct = judgeChallenge(c.id, step.id, a.choice);
      if (correct === null) { open = true; break; }
      out[c.id].steps[step.id] = { choice: a.choice, correct, attempts: Math.min(a.attempts, ATTEMPTS_MAX) };
      if (!correct) { open = true; break; }
    }
  }
  const note = isObject(raw) && isObject(raw[3]) ? raw[3].note : '';
  if (challengeProgress(3, out[3]).allCorrect && typeof note === 'string') out[3].note = note.slice(0, TEXT_MAX);
  return out;
}
const firstUnsolved = (challenges) => CHALLENGES.find((c) => !challengeProgress(c.id, challenges[c.id]).allCorrect)?.id ?? null;

function envelope(raw) {
  let value = raw;
  if (typeof raw === 'string') { try { value = JSON.parse(raw); } catch { return null; } }
  return isObject(value) && value.v === VERSION ? value : null;
}

const TRIAL_BASE = { 'trial1-horizontal': 'trial1-horizontal', 'trial1-horizontal-complete': 'trial1-horizontal', 'trial1-vertical': 'trial1-vertical', 'trial1-vertical-complete': 'trial1-vertical',
  'trial2-low': 'trial2-low', 'trial2-low-complete': 'trial2-low', 'trial2-high': 'trial2-high', 'trial2-high-complete': 'trial2-high' };

/**
 * restore(raw) → null | { state, phase, checkpoint, floor }
 *   null         the save is not usable at all (not JSON, not an object, another version): start fresh
 *   checkpoint   the highest phase the save's data proves
 *   floor        the earliest phase the records it holds allow
 *   phase        where the learner is put: what the save claimed, held between floor and checkpoint
 */
export function restore(raw) {
  const save = envelope(raw);
  if (!save) return null;
  const records = isObject(save.records) ? save.records : {};
  const state = createInitialState();

  const horizontal = parseTrial1(records.horizontal, 'horizontal');
  const vertical = horizontal ? parseTrial1(records.vertical, 'vertical') : null;
  const answers = parseCompare(save.compare);
  const probe = (extra = {}) => ({ ...state, records: { horizontal, vertical, low: null, high: null, ...extra }, compare: { direction: { ...answers.direction }, magnification: { ...answers.magnification } } });
  const compare1 = vertical ? compareView(probe()).directionCorrect : false;
  const low = compare1 ? parseLow(records.low) : null;
  const high = low ? parseHigh(records.high) : null;
  const compare2 = high ? compareView(probe({ low, high })).magnificationCorrect : false;

  let conclusion = state.conclusion, challenges = emptyChallenges(), highest;
  if (!horizontal) highest = 'trial1-horizontal';
  else if (!vertical) highest = 'trial1-vertical';
  else if (!compare1) highest = 'compare-direction';
  else if (!low) highest = 'trial2-low';
  else if (!high) highest = 'trial2-high';
  else if (!compare2) highest = 'compare-magnification';
  else {
    const all = { ...state, records: { horizontal, vertical, low, high } };
    conclusion = parseConclusion(save.conclusion, expectedRelations(all.records));
    all.conclusion = conclusion;
    if (!notebookIsReady(all)) highest = 'notebook';
    else {
      challenges = parseChallenges(save.challenges);
      const open = firstUnsolved(challenges);
      highest = open === null ? 'complete' : `challenge-${open}`;
    }
  }
  const floor = !horizontal ? 'welcome' : !vertical ? 'trial1-vertical' : !compare1 ? 'compare-direction' : !low ? 'compare-direction' : !high ? 'trial2-high' : 'compare-magnification';

  const claimed = PHASES.includes(save.phase) ? save.phase : null;
  let phase = claimed === null ? floor : claimed;      // a save that names no phase puts the learner at the earliest place its records allow
  if (rank(phase) > rank(highest)) phase = highest;
  if (rank(phase) < rank(floor)) phase = floor;
  if (phase === 'welcome' || phase === 'mission') return { state: Object.assign(createInitialState(), { phase }), phase, checkpoint: highest, floor };

  // an unfinished trial is the trial's base phase; its position is replayed through the engine below
  const base = TRIAL_BASE[phase] ?? phase;
  state.phase = base;
  state.records.horizontal = rank(base) > rank('trial1-horizontal') ? horizontal : null;
  state.records.vertical = rank(base) > rank('trial1-vertical') ? vertical : null;
  state.records.low = rank(base) > rank('trial2-low') ? low : null;
  state.records.high = rank(base) > rank('trial2-high') ? high : null;
  if (rank(base) >= rank('compare-direction')) state.compare.direction = { ...answers.direction };
  if (rank(base) >= rank('compare-magnification')) state.compare.magnification = { ...answers.magnification };
  if (rank(base) >= rank('notebook')) state.conclusion = conclusion;
  if (/^challenge-[123]$/.test(base) || base === 'complete') {
    const upTo = base === 'complete' ? 3 : Number(base.slice(-1));
    for (const c of CHALLENGES) if (c.id <= upTo) state.challenges[c.id] = challenges[c.id];
  }
  const cfg = TRIAL_CONFIG[base];
  if (cfg) {
    // where each trial's stage begins: the trial's own start, or (for the high-power trial) where the low-power record left it
    state.stage = base === 'trial2-high' ? { ...low.stage } : { ...cfg.startStage };
    state.objective = cfg.objective;
    const sameTrial = TRIAL_BASE[claimed] === base;
    let replayed = state;
    if (sameTrial && isPoint(save.stage)) replayed = reduce(replayed, { type: 'SET_STAGE', x: save.stage.x, y: save.stage.y }).state;
    if (sameTrial && base === 'trial2-high' && OBJECTIVES.includes(save.objective)) replayed = reduce(replayed, { type: 'SET_OBJECTIVE', objective: save.objective }).state;
    return { state: replayed, phase: replayed.phase, checkpoint: highest, floor };
  }
  return { state, phase: base, checkpoint: highest, floor };
}

// ---- the store (every storage call may throw; none may break the lab) -----------------------------------------------

/** createStore(storage?) → { load, save, clear, failed } ; `failed` turns true the first time storage refuses anything. */
export function createStore(storage) {
  let failed = false, lastWritten = null;
  const area = () => storage ?? globalThis.localStorage;
  const attempt = (fn, fallback) => { try { return fn(); } catch { failed = true; return fallback; } };
  return {
    key: STORAGE_KEY,
    get failed() { return failed; },
    load() { return restore(attempt(() => area().getItem(STORAGE_KEY), null)); },
    /** Saves once there is something to keep (the first record), and only when the save actually changed. */
    save(state) {
      if (!state.records.horizontal) return false;
      const text = serialize(state);
      if (text === lastWritten) return true;
      const ok = attempt(() => { area().setItem(STORAGE_KEY, text); return true; }, false);
      if (ok) lastWritten = text;
      return ok;
    },
    clear() {
      lastWritten = null;
      return attempt(() => { area().removeItem(STORAGE_KEY); return true; }, false);
    },
  };
}
