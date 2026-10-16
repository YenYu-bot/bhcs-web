// Progress persistence for Science Lab 2.0 Pilot #5 B4.
// Saves learner/source inputs only. Restore replays them through the engine; derived rates, factors, limiting-factor ids,
// notebook readiness and challenge correctness are never trusted from storage.
import {
  COMPARE_QUESTIONS,
  PHASES,
  createInitialState,
  reduce,
} from './engine.js';
import { TRIAL_IDS, recordMatchesFixedTrial } from './model.js';
import {
  ATTEMPTS_MAX,
  CHALLENGES,
  RELATION_FIELDS,
  TEXT_FIELDS,
  sanitizeConclusionFields,
} from './challenges.js';

export const STORAGE_KEY = 'bhcs-photosynthesis-factor-guided:v1';
export const VERSION = 1;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const own = (o, k) => (isObject(o) && Object.hasOwn(o, k) ? o[k] : undefined);
const rank = (phase) => PHASES.indexOf(phase);
const CONCLUSION_KEYS = ['level', ...Object.keys(RELATION_FIELDS), ...TEXT_FIELDS];

export function toSave(state) {
  const compare = {};
  for (const [group, questions] of Object.entries(COMPARE_QUESTIONS)) {
    compare[group] = Object.fromEntries(Object.keys(questions).map((q) => [q, own(state.compare?.[group], q) ?? null]));
  }
  const challenges = {};
  for (const c of CHALLENGES) {
    challenges[c.id] = { steps: {} };
    for (const step of c.steps) {
      const a = own(own(state.challenges?.[c.id], 'steps'), step.id);
      if (isObject(a)) challenges[c.id].steps[step.id] = { choice: a.choice, attempts: a.attempts };
    }
    if (c.note) challenges[c.id].note = typeof state.challenges?.[c.id]?.note === 'string' ? state.challenges[c.id].note : '';
  }
  return {
    v: VERSION,
    phase: state.phase,
    records: state.records.map((r) => ({
      trialId: r.trialId,
      light: r.light,
      co2: r.co2,
      temperature: r.temperature,
    })),
    compare,
    conclusion: Object.fromEntries(CONCLUSION_KEYS.map((k) => [k, state.conclusion?.[k] ?? null])),
    challenges,
  };
}
export const serialize = (state) => JSON.stringify(toSave(state));

function envelope(raw) {
  let value = raw;
  if (typeof raw === 'string') {
    try { value = JSON.parse(raw); } catch { return null; }
  }
  return isObject(value) && value.v === VERSION ? value : null;
}

const CONTINUE = Object.freeze({ type: 'CONTINUE' });
const MOVES_ON = new Set(['START', 'BEGIN', 'CONTINUE']);

function compareActions(save, group) {
  const out = [];
  for (const [question, options] of Object.entries(COMPARE_QUESTIONS[group])) {
    const answer = own(own(save.compare, group), question);
    if (typeof answer === 'string' && options.includes(answer)) {
      out.push({ type: 'ANSWER_COMPARE', compare: group, question, answer });
    }
  }
  return out;
}

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

function challengeActions(save) {
  const perChallenge = [], attempts = {};
  for (const c of CHALLENGES) {
    const actions = [];
    for (const step of c.steps) {
      const a = own(own(own(save.challenges, c.id), 'steps'), step.id);
      if (!isObject(a) || typeof a.choice !== 'string' || !Number.isSafeInteger(a.attempts) || a.attempts < 1) {
        perChallenge.push(actions);
        return { perChallenge, attempts };
      }
      actions.push({ type: 'ANSWER_CHALLENGE', id: c.id, step: step.id, choice: a.choice });
      attempts[step.id] = Math.min(a.attempts, ATTEMPTS_MAX);
    }
    perChallenge.push(actions);
  }
  return { perChallenge, attempts };
}

function cleanRecord(raw, expectedId) {
  if (!isObject(raw)) return null;
  const record = {
    trialId: own(raw, 'trialId'),
    light: own(raw, 'light'),
    co2: own(raw, 'co2'),
    temperature: own(raw, 'temperature'),
  };
  return record.trialId === expectedId && recordMatchesFixedTrial(record) ? record : null;
}

/**
 * Returns ordered [action, ownerPhase|null] pairs. ownerPhase means the action reconstructs saved learner/source data;
 * movement actions have no owner and therefore never raise the restore floor.
 */
function actionsOf(save) {
  const list = [[{ type: 'START' }, null], [{ type: 'BEGIN' }, null]];
  const raw = Array.isArray(save.records) ? save.records : [];
  let ri = 0;

  const record = (trialId, phase, setLight = false) => {
    const clean = cleanRecord(raw[ri], trialId);
    if (!clean) return false;
    if (setLight) list.push([{ type: 'SET_LIGHT', value: clean.light }, phase]);
    list.push([{ type: 'OBSERVE' }, phase]);
    ri += 1;
    return true;
  };

  record('t1-low-light', 'trial1-low-light');
  list.push([CONTINUE, null]);
  record('t1-higher-light', 'trial1-higher-light', true);
  list.push([CONTINUE, null]);

  for (const a of compareActions(save, 'c1')) list.push([a, 'compare1']);
  list.push([CONTINUE, null]);
  list.push([CONTINUE, null]);

  record('t2-medium-light', 'trial2-medium-light');
  list.push([CONTINUE, null]);
  record('t2-high-light', 'trial2-high-light', true);

  // Any fifth/extra record is invalid source data. A repeated observation is deliberately inserted so replay stops
  // before accepting downstream answers instead of silently ignoring the extra record.
  if (raw.length > ri && ri === TRIAL_IDS.length) list.push([{ type: 'OBSERVE' }, 'trial2-high-light']);

  list.push([CONTINUE, null]);
  for (const a of compareActions(save, 'c2')) list.push([a, 'compare2']);
  list.push([CONTINUE, null]);
  list.push([CONTINUE, null]);
  list.push([CONTINUE, null]);

  for (const a of conclusionActions(save)) list.push([a, 'notebook']);
  list.push([CONTINUE, null]);

  const { perChallenge, attempts } = challengeActions(save);
  CHALLENGES.forEach((c, i) => {
    for (const a of perChallenge[i] ?? []) list.push([a, `challenge-${c.id}`]);
    if (c.note) {
      const note = own(own(save.challenges, c.id), 'note');
      if (typeof note === 'string' && note !== '') {
        list.push([{ type: 'SAVE_CHALLENGE_NOTE', id: c.id, text: note }, `challenge-${c.id}`]);
      }
    }
    list.push([CONTINUE, null]);
  });
  return { list, attempts };
}

function replay(start, list, target = null) {
  let state = start, floor = start.phase;
  for (const [action, owner] of list) {
    if (target && state.phase === target && MOVES_ON.has(action.type)) break;
    const result = reduce(state, action);
    if (!result.accepted) break;
    state = result.state;
    if (owner && rank(owner) > rank(floor)) floor = owner;
  }
  return { state, floor };
}

export function restore(raw) {
  const save = envelope(raw);
  if (!save) return null;
  const start = createInitialState();
  const { list, attempts } = actionsOf(save);
  const full = replay(start, list);
  const checkpoint = full.state.phase, floor = full.floor;

  let phase = PHASES.includes(save.phase) ? save.phase : floor;
  if (rank(phase) > rank(checkpoint)) phase = checkpoint;
  if (rank(phase) < rank(floor)) phase = floor;

  const { state } = replay(start, list, phase);
  for (const c of CHALLENGES) {
    for (const [stepId, a] of Object.entries(state.challenges[c.id].steps)) {
      if (Object.hasOwn(attempts, stepId)) a.attempts = attempts[stepId];
    }
  }
  return { state, phase: state.phase, checkpoint, floor };
}

export function createStore(storage) {
  let failed = false, lastWritten = null;
  const area = () => storage ?? globalThis.localStorage;
  const attempt = (fn, fallback) => {
    try { return fn(); } catch { failed = true; return fallback; }
  };
  return {
    key: STORAGE_KEY,
    get failed() { return failed; },
    load() { return attempt(() => restore(area().getItem(STORAGE_KEY)), null); },
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
