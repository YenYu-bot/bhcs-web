// Progress saving for the guided buoyancy lab (Prototype Technical Spec v1.0 §14).
// serialize() keeps only what the learner did; restore() rebuilds a state from that, one layer at a time, and trusts nothing
// it reads: every record is rebuilt against the model, every challenge answer is judged again, and no outcome, percent,
// density or "correct" flag is ever read back from the save (they are not even written). If an upstream layer is
// invalid, everything downstream of it is dropped, and the phase can never be later than what was validated or later than
// what the save itself claimed. It holds no wording, no DOM and no analytics, and restoring dispatches nothing.
import { createInitialState, PHASES, FLOW_LIQUIDS, COMPARE_QUESTIONS, RECENT_DROPS_MAX, DROP_COUNT_MAX, compareStatus, expectedRelations, notebookIsReady } from './engine.js';
import { BLOCK, blockOutcome } from './model.js';
import { CHALLENGES, challengeProgress, emptyChallenges, judgeChallenge, sanitizeConclusionFields } from './challenges.js';

export const STORAGE_KEY = 'bhcs-buoyancy-guided:v1';
export const VERSION = 1;
export const ATTEMPTS_MAX = 999;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const rank = (phase) => PHASES.indexOf(phase);

// ---- serialize ------------------------------------------------------------------------------------------------------

const dropsOf = (list) => list.map((d) => ({ slots: d.slots, liquidId: d.liquidId }));

/** The save as a plain object: operation facts only. */
export function toSave(state) {
  const r1 = state.records[1], r2 = state.records[2];
  const challenges = {};
  for (const c of CHALLENGES) {
    challenges[c.id] = {};
    for (const [stepId, a] of Object.entries(state.challenges?.[c.id]?.steps ?? {})) challenges[c.id][stepId] = { choice: a.choice, attempts: a.attempts };
  }
  return {
    v: VERSION,
    phase: state.phase,
    records: {
      1: r1 ? { liquidId: r1.liquidId, slots: r1.slots, dropCount: r1.dropCount, recentDrops: dropsOf(r1.recentDrops) } : null,
      2: r2 ? { liquidId: r2.liquidId, slots: r2.slots, dropCount: r2.dropCount, recentDrops: dropsOf(r2.recentDrops), firstDrop: { slots: r2.firstDrop.slots, liquidId: r2.firstDrop.liquidId } } : null,
      3: state.records[3] ? { tried: { wood: state.records[3].tried.wood === true, stone: state.records[3].tried.stone === true } } : null,
    },
    tried: { wood: state.trial3.tried.wood === true, stone: state.trial3.tried.stone === true },
    compare: { stayMass: state.compare.stayMass, firstDrop: state.compare.firstDrop },
    conclusion: { ...state.conclusion },
    challenges,
  };
}
export const serialize = (state) => JSON.stringify(toSave(state));

// ---- restore: one layer at a time -----------------------------------------------------------------------------------

function parseDrops(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((d) => isObject(d) && isInt(d.slots, BLOCK.slotsMin, BLOCK.slotsMax) && FLOW_LIQUIDS.includes(d.liquidId))
    .slice(-RECENT_DROPS_MAX).map((d) => ({ slots: d.slots, liquidId: d.liquidId }));
}

/** A record is valid when its block really stays in its liquid (asked of the model, never read from the save). */
function parseStayRecord(raw, trial, liquidId) {
  if (!isObject(raw) || raw.liquidId !== liquidId || !isInt(raw.slots, BLOCK.slotsMin, BLOCK.slotsMax)) return null;
  if (!Number.isSafeInteger(raw.dropCount) || raw.dropCount < 1) return null;
  if (blockOutcome({ slots: raw.slots, liquidId }).outcome !== 'stay') return null;
  return { trial, liquidId, slots: raw.slots, dropCount: Math.min(raw.dropCount, DROP_COUNT_MAX), recentDrops: parseDrops(raw.recentDrops) };
}
function parseRecord1(raw) { return parseStayRecord(raw, 1, 'water'); }
function parseRecord2(raw, r1) {
  const base = parseStayRecord(raw, 2, 'brine');
  if (!base || !isObject(raw.firstDrop) || raw.firstDrop.slots !== r1.slots || raw.firstDrop.liquidId !== 'brine') return null;
  return { ...base, firstDrop: { slots: r1.slots, liquidId: 'brine' }, independentVariable: 'liquid' };
}
function parseCompare(raw) {
  const pick = (q) => (isObject(raw) && COMPARE_QUESTIONS[q].includes(raw[q]) ? raw[q] : null);
  return { stayMass: pick('stayMass'), firstDrop: pick('firstDrop') };
}
function parseTried(raw) { return { wood: isObject(raw) && raw.wood === true, stone: isObject(raw) && raw.stone === true }; }

const TEXT_KEYS = ['freeText', 'evidenceText', 'limitationText'];
/** Conclusion fields one by one: a bad field falls back to empty without taking the good ones down with it. */
function parseConclusion(raw, expected) {
  const out = createInitialState().conclusion;
  if (!isObject(raw)) return out;
  for (const key of ['level', 'relationLiquid', 'relationWood', ...TEXT_KEYS]) {
    if (!(key in raw)) continue;
    const clean = sanitizeConclusionFields({ [key]: raw[key] });
    if (clean) Object.assign(out, clean);
  }
  if (expected) {                                                     // a relation that does not match the learner's own records is not kept
    if (out.relationLiquid !== null && out.relationLiquid !== expected.liquid) out.relationLiquid = null;
    if (out.relationWood !== null && out.relationWood !== expected.wood) out.relationWood = null;
  }
  return out;
}

/** Challenge answers are judged again; a step counts only after the one before it was solved. */
function parseChallenges(raw) {
  const out = emptyChallenges();
  let open = false;
  for (const c of CHALLENGES) {
    if (open) break;
    for (const step of c.steps) {
      const a = isObject(raw) && isObject(raw[c.id]) ? raw[c.id][step.id] : null;
      if (!isObject(a) || !Number.isSafeInteger(a.attempts) || a.attempts < 1) { open = true; break; }
      const correct = judgeChallenge(c.id, step.id, a.choice);
      if (correct === null) { open = true; break; }
      out[c.id].steps[step.id] = { choice: a.choice, correct, attempts: Math.min(a.attempts, ATTEMPTS_MAX) };
      if (!correct) { open = true; break; }
    }
  }
  return out;
}
const firstUnsolved = (challenges) => CHALLENGES.find((c) => !challengeProgress(c.id, challenges[c.id]).allCorrect)?.id ?? null;

/** The earliest phase a save can be restored to that it has the data for; phases in the middle of a trial restart at the trial's start. */
function restorablePhase(phase) {
  if (!PHASES.includes(phase)) return null;
  if (rank(phase) < rank('trial2-switch-liquid')) return 'welcome';
  if (phase === 'trial2-test' || phase === 'trial2-complete') return 'trial2-switch-liquid';
  return phase;
}

function envelope(raw) {
  let value = raw;
  if (typeof raw === 'string') { try { value = JSON.parse(raw); } catch { return null; } }
  return isObject(value) && value.v === VERSION ? value : null;
}

/**
 * restore(raw) → null | { state, phase, checkpoint, reached }
 *   null         the save is not usable at all (not JSON, not an object, another version): start fresh
 *   checkpoint   the highest phase the save's data proves
 *   phase        where the learner is put: the earlier of that and what the save claimed
 */
export function restore(raw) {
  const save = envelope(raw);
  if (!save) return null;
  const records = isObject(save.records) ? save.records : {};
  const state = createInitialState();

  const r1 = parseRecord1(records[1]);
  const r2 = r1 ? parseRecord2(records[2], r1) : null;
  const answers = r2 ? parseCompare(save.compare) : { stayMass: null, firstDrop: null };
  let compareOk = false;
  if (r2) {
    const probe = { ...state, records: { 1: r1, 2: r2, 3: null }, compare: answers };
    compareOk = compareStatus(probe).allCorrect;
  }
  const triedSaved = parseTried(isObject(records[3]) ? records[3].tried : save.tried);
  const r3 = compareOk && triedSaved.wood && triedSaved.stone ? { trial: 3, liquidId: 'water', tried: { wood: true, stone: true } } : null;

  let conclusion = state.conclusion, challenges = emptyChallenges(), highest;
  if (!r1) highest = 'welcome';
  else if (!r2) highest = 'trial2-switch-liquid';
  else if (!compareOk) highest = 'compare';
  else if (!r3) highest = 'trial3-drop';
  else {
    const probe = { ...state, records: { 1: r1, 2: r2, 3: r3 } };
    conclusion = parseConclusion(save.conclusion, expectedRelations(probe.records));
    probe.conclusion = conclusion;
    if (!notebookIsReady(probe)) highest = 'notebook';
    else {
      challenges = parseChallenges(save.challenges);
      const open = firstUnsolved(challenges);
      highest = open === null ? 'complete' : `challenge-${open}`;
    }
  }

  const claimed = restorablePhase(save.phase);
  let phase = claimed !== null && rank(claimed) < rank(highest) ? claimed : highest;
  if (phase === 'trial3-observed' && !r3) phase = 'trial3-drop';
  if (phase === 'welcome') return { state: createInitialState(), phase, checkpoint: highest, reached: 'welcome' };

  // build the state the engine itself would be in at `phase`, with only the data that phase can have
  state.phase = phase;
  state.records[1] = r1;
  state.slots = r1.slots;
  state.dropCount.trial1 = r1.dropCount;
  state.failedDrops.trial1 = Math.max(0, r1.dropCount - 1);
  state.recentDrops.trial1 = r1.recentDrops;
  if (rank(phase) >= rank('trial2-recorded')) {
    state.records[2] = r2;
    state.slots = r2.slots;
    state.liquidId = 'brine';
    state.trial2.firstDrop = { ...r2.firstDrop };
    state.dropCount.trial2 = r2.dropCount;
    state.failedDrops.trial2 = Math.max(0, r2.dropCount - 1);
    state.recentDrops.trial2 = r2.recentDrops;
  }
  if (rank(phase) >= rank('compare')) state.compare = { ...answers };
  if (rank(phase) >= rank('trial3-drop')) {
    state.liquidId = 'water';
    state.trial3.tried = phase === 'trial3-drop' ? (triedSaved.wood && triedSaved.stone ? { wood: false, stone: false } : triedSaved) : { wood: true, stone: true };
  }
  if (rank(phase) >= rank('trial3-observed')) state.records[3] = r3;
  if (rank(phase) >= rank('notebook')) state.conclusion = conclusion;
  if (/^challenge-[123]$/.test(phase) || phase === 'complete') {
    const upTo = phase === 'complete' ? 3 : Number(phase.slice(-1));
    for (const c of CHALLENGES) if (c.id <= upTo) state.challenges[c.id] = challenges[c.id];
  }
  return { state, phase, checkpoint: highest, reached: highest };
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
      if (!state.records[1]) return false;
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
