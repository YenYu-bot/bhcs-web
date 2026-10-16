// Progress saving for the guided unknown-liquid lab (Pilot #4, B4).
// serialize() keeps only what the learner did: which cup was tested with which strip, the answers they chose and the words
// they wrote. No observation, colour, pH, class, "ready" or "correct" flag is ever written. restore() trusts nothing it reads:
// it turns the save back into the actions that would have produced it and replays them through the engine itself, so every
// record is checked against the model (no duplicate, no strip used out of turn, a trial before the next one), every compare
// and challenge answer is judged again, and the first thing the engine refuses ends the replay: everything downstream of an
// invalid layer is dropped. The phase is held between what the kept data implies (floor) and what it proves (checkpoint).
// It holds no wording, no DOM and no usage reporting, and restoring dispatches, announces and sends nothing.
import { createInitialState, reduce, PHASES, COMPARE_QUESTIONS } from './engine.js';
import { isLayoutId } from './model.js';
import { CHALLENGES, ATTEMPTS_MAX, MAPPING_FIELDS, TEXT_FIELDS, sanitizeConclusionFields } from './challenges.js';

export const STORAGE_KEY = 'bhcs-acid-base-guided:v1';
export const VERSION = 1;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const rank = (phase) => PHASES.indexOf(phase);
const own = (o, k) => (isObject(o) && Object.hasOwn(o, k) ? o[k] : undefined);

// ---- serialize ------------------------------------------------------------------------------------------------------

const CONCLUSION_KEYS = ['level', ...Object.keys(MAPPING_FIELDS), ...TEXT_FIELDS];

/** The save as a plain object: learner inputs only. */
export function toSave(state) {
  const challenges = {};
  for (const c of CHALLENGES) {
    challenges[c.id] = { steps: {} };
    for (const step of c.steps) {
      const a = own(own(state.challenges?.[c.id], 'steps'), step.id);
      if (isObject(a)) challenges[c.id].steps[step.id] = { choice: a.choice, attempts: a.attempts };
    }
  }
  challenges[3].note = typeof state.challenges?.[3]?.note === 'string' ? state.challenges[3].note : '';
  const compare = {};
  for (const [group, questions] of Object.entries(COMPARE_QUESTIONS)) {
    compare[group] = Object.fromEntries(Object.keys(questions).map((q) => [q, own(state.compare?.[group], q) ?? null]));
  }
  return {
    v: VERSION,
    phase: state.phase,
    layout: state.layout,
    records: state.records.map((r) => ({ sampleId: r.sampleId, indicatorId: r.indicatorId })),
    compare,
    conceptPart: state.conceptPart,
    conclusion: Object.fromEntries(CONCLUSION_KEYS.map((k) => [k, state.conclusion?.[k] ?? null])),
    challenges,
  };
}
export const serialize = (state) => JSON.stringify(toSave(state));

// ---- restore: rebuild the actions, replay them through the engine ---------------------------------------------------

function envelope(raw) {
  let value = raw;
  if (typeof raw === 'string') { try { value = JSON.parse(raw); } catch { return null; } }
  return isObject(value) && value.v === VERSION ? value : null;
}

const CONTINUE = Object.freeze({ type: 'CONTINUE' });
const MOVES_ON = new Set(['START', 'BEGIN', 'CONTINUE']);

/** The compare answers of one group, allowlisted. An unknown answer is left out (the replay then cannot move past it). */
function compareActions(save, group) {
  const out = [];
  for (const [question, options] of Object.entries(COMPARE_QUESTIONS[group])) {
    const answer = own(own(save.compare, group), question);
    if (typeof answer === 'string' && options.includes(answer)) out.push({ type: 'ANSWER_COMPARE', compare: group, question, answer });
  }
  return out;
}

/** One SAVE_CONCLUSION per usable field; a bad field is skipped without taking the good ones with it. Defaults are not data. */
function conclusionActions(save) {
  const out = [];
  for (const key of CONCLUSION_KEYS) {
    const value = own(save.conclusion, key);
    if (value === undefined || value === null || value === '') continue;
    const clean = sanitizeConclusionFields({ [key]: value });
    if (clean) out.push({ type: 'SAVE_CONCLUSION', fields: clean });
  }
  return out;
}

/** Challenge answers in order; each step needs a choice and a safe positive attempt count, or the challenges stop there. */
function challengeActions(save) {
  const out = [], attempts = {};
  for (const c of CHALLENGES) {
    const actions = [];
    for (const step of c.steps) {
      const a = own(own(own(save.challenges, c.id), 'steps'), step.id);
      if (!isObject(a) || typeof a.choice !== 'string' || !Number.isSafeInteger(a.attempts) || a.attempts < 1) {
        out.push(actions);
        return { perChallenge: out, attempts };
      }
      actions.push({ type: 'ANSWER_CHALLENGE', id: c.id, step: step.id, choice: a.choice });
      attempts[step.id] = Math.min(a.attempts, ATTEMPTS_MAX);
    }
    out.push(actions);
  }
  return { perChallenge: out, attempts };
}

/**
 * The whole lab as a list of [action, phaseTheDataBelongsTo | null]. A null owner marks a move to the next phase: moving on
 * is not data of its own and never raises the floor.
 */
function actionsOf(save) {
  const list = [[{ type: 'START' }, null], [{ type: 'BEGIN' }, null]];
  const raw = Array.isArray(save.records) ? save.records : [];
  const dip = (r) => ({ type: 'DIP', sampleId: own(r, 'sampleId'), indicatorId: own(r, 'indicatorId') });
  let i = 0;
  for (; i < raw.length && own(raw[i], 'indicatorId') === 'blue-litmus'; i++) list.push([dip(raw[i]), 'trial1']);
  list.push([CONTINUE, null]);
  for (const a of compareActions(save, 'c1')) list.push([a, 'compare1']);
  list.push([CONTINUE, null]);
  for (; i < raw.length; i++) list.push([dip(raw[i]), 'trial2']);   // anything that is not a red-litmus record here is refused by the engine
  list.push([CONTINUE, null]);
  for (const a of compareActions(save, 'c2')) list.push([a, 'compare2']);
  list.push([CONTINUE, null]);
  if (save.conceptPart === 'ph') list.push([{ type: 'REVEAL_PH' }, 'concept']);
  list.push([CONTINUE, null]);
  for (const a of conclusionActions(save)) list.push([a, 'notebook']);
  list.push([CONTINUE, null]);
  const { perChallenge, attempts } = challengeActions(save);
  CHALLENGES.forEach((c, k) => {
    for (const a of perChallenge[k] ?? []) list.push([a, `challenge-${c.id}`]);
    if (c.note) {
      const note = own(own(save.challenges, c.id), 'note');
      if (typeof note === 'string' && note !== '') list.push([{ type: 'SAVE_CHALLENGE_NOTE', id: c.id, text: note }, `challenge-${c.id}`]);
    }
    list.push([CONTINUE, null]);
  });
  return { list, attempts };
}

/** Replays the actions until the engine refuses one, or until an action would leave `target`. */
function replay(start, list, target) {
  let state = start, floor = start.phase;
  for (const [action, owner] of list) {
    if (state.phase === target && MOVES_ON.has(action.type)) break;
    const result = reduce(state, action);
    if (!result.accepted) break;
    state = result.state;
    if (owner && rank(owner) > rank(floor)) floor = owner;
  }
  return { state, floor };
}

/**
 * restore(raw) → null | { state, phase, checkpoint, floor }
 *   null         the save is not usable at all (not JSON, not an object, another version, an unknown layout): start fresh
 *   checkpoint   the furthest phase the save's data proves
 *   floor        the latest phase any kept piece of data belongs to
 *   phase        where the learner is put: what the save claimed, held between floor and checkpoint (the floor if it claimed nothing usable)
 */
export function restore(raw) {
  const save = envelope(raw);
  if (!save || !isLayoutId(save.layout)) return null;
  const start = { ...createInitialState(), layout: save.layout };
  const { list, attempts } = actionsOf(save);

  const full = replay(start, list, null);
  const checkpoint = full.state.phase, floor = full.floor;
  let phase = PHASES.includes(save.phase) ? save.phase : floor;
  if (rank(phase) > rank(checkpoint)) phase = checkpoint;
  if (rank(phase) < rank(floor)) phase = floor;

  const { state } = replay(start, list, phase);
  // the replay counted one try per step; put back the validated number of tries
  for (const c of CHALLENGES) {
    for (const [stepId, a] of Object.entries(state.challenges[c.id].steps)) if (Object.hasOwn(attempts, stepId)) a.attempts = attempts[stepId];
  }
  return { state, phase: state.phase, checkpoint, floor };
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
    load() { return attempt(() => restore(area().getItem(STORAGE_KEY)), null); },
    /** Saves once there is something to keep (the first record), and only when the save actually changed. */
    save(state) {
      if (!state.records.length) return false;
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
