// State engine for Science Lab 2.0 Pilot #5 B1 (photosynthesis-factor Guided Prototype).
// Pure reducer: no DOM, timers, learner wording, persistence, analytics or presentation.
// State stores source conditions / learner choices only; rates, factor values, limits and correctness are always rebuilt.

import {
  GUIDED_LIGHT_LEVELS,
  TRIAL_IDS,
  classifyRateChange,
  deriveTrialObservation,
  isLight,
  recordMatchesFixedTrial,
  trialCondition,
} from './model.js';

export const PHASES = Object.freeze([
  'welcome',
  'mission',
  'trial1-low-light',
  'trial1-higher-light',
  'compare1',
  'trial2-setup',
  'trial2-medium-light',
  'trial2-high-light',
  'compare2',
  'inference',
  'concept',
]);

export const PHASE_TRIAL = Object.freeze({
  'trial1-low-light': 't1-low-light',
  'trial1-higher-light': 't1-higher-light',
  'trial2-medium-light': 't2-medium-light',
  'trial2-high-light': 't2-high-light',
});

export const COMPARE_QUESTIONS = Object.freeze({
  c1: Object.freeze({
    rateChange: Object.freeze(['increase', 'same', 'decrease']),
    claim: Object.freeze(['context-only', 'always-more-light', 'no-relation']),
  }),
  c2: Object.freeze({
    rateChange: Object.freeze(['increase', 'same', 'decrease']),
    reason: Object.freeze(['other-condition-short', 'light-no-effect', 'random']),
  }),
});

const COMPARE_PHASE = Object.freeze({ c1: 'compare1', c2: 'compare2' });

export function createInitialState() {
  return {
    phase: 'welcome',
    conditions: null,
    records: [],
    compare: {
      c1: { rateChange: null, claim: null },
      c2: { rateChange: null, reason: null },
    },
  };
}

// ---- derivations ------------------------------------------------------------------------------------------------------

export const observationsOf = (state) =>
  state.records.map((r) => deriveTrialObservation(r)).filter(Boolean);

export function observationFor(state, trialId) {
  const hits = observationsOf(state).filter((o) => o.trialId === trialId);
  return hits.length === 1 ? hits[0] : null;
}

export function trialRecorded(state, trialId) {
  const o = observationFor(state, trialId);
  return Boolean(o && recordMatchesFixedTrial(state.records.find((r) => r.trialId === trialId)));
}

function pair(state, a, b) {
  if (!trialRecorded(state, a) || !trialRecorded(state, b)) return null;
  return [observationFor(state, a), observationFor(state, b)];
}

export function compare1Evidence(state) {
  const p = pair(state, 't1-low-light', 't1-higher-light');
  if (!p) return null;
  return {
    before: p[0],
    after: p[1],
    controlled: {
      co2Same: p[0].co2 === p[1].co2,
      temperatureSame: p[0].temperature === p[1].temperature,
      onlyLightChanged: p[0].co2 === p[1].co2 && p[0].temperature === p[1].temperature && p[0].light !== p[1].light,
    },
  };
}

export function compare2Evidence(state) {
  const p = pair(state, 't2-medium-light', 't2-high-light');
  if (!p) return null;
  return {
    before: p[0],
    after: p[1],
    controlled: {
      co2Same: p[0].co2 === p[1].co2,
      temperatureSame: p[0].temperature === p[1].temperature,
      onlyLightChanged: p[0].co2 === p[1].co2 && p[0].temperature === p[1].temperature && p[0].light !== p[1].light,
    },
  };
}

export function expectedCompare1(state) {
  const e = compare1Evidence(state);
  if (!e || !e.controlled.onlyLightChanged || e.after.light <= e.before.light) return null;
  const rateChange = classifyRateChange(e.before.rate, e.after.rate);
  return {
    rateChange,
    // One controlled pair can support a statement about this condition, not a universal law.
    claim: rateChange === 'increase' ? 'context-only' : 'no-relation',
  };
}

export function expectedCompare2(state) {
  const e = compare2Evidence(state);
  if (!e || !e.controlled.onlyLightChanged || e.after.light <= e.before.light) return null;
  const rateChange = classifyRateChange(e.before.rate, e.after.rate);
  const otherConditionIsLower =
    e.after.limit !== 'light' &&
    e.after.factors.light > Math.min(e.after.factors.co2, e.after.factors.temperature);
  return {
    rateChange,
    reason: rateChange === 'same' && otherConditionIsLower ? 'other-condition-short' : 'random',
  };
}

export function compareStatus(state) {
  const judge = (group, expected) => {
    const answers = state.compare?.[group] ?? {};
    const out = Object.fromEntries(Object.keys(COMPARE_QUESTIONS[group]).map((q) => {
      const answer = Object.hasOwn(answers, q) ? answers[q] : null;
      return [q, { answer, correct: expected !== null && answer === expected[q] }];
    }));
    return { ...out, allCorrect: Object.values(out).every((x) => x.correct) };
  };
  return {
    c1: judge('c1', expectedCompare1(state)),
    c2: judge('c2', expectedCompare2(state)),
  };
}

/** Derived evidence for the formal Concept screen; unavailable before Concept. */
export function conceptEvidence(state) {
  if (state.phase !== 'concept') return null;
  if (!TRIAL_IDS.every((id) => trialRecorded(state, id))) return null;
  const observations = Object.fromEntries(TRIAL_IDS.map((id) => [id, observationFor(state, id)]));
  return {
    observations,
    compare1: expectedCompare1(state),
    compare2: expectedCompare2(state),
    trial1LimitAfterIncrease: observations['t1-higher-light'].limit,
    trial2LimitAfterIncrease: observations['t2-high-light'].limit,
  };
}

// ---- reducer ----------------------------------------------------------------------------------------------------------

const reject = (ctx, reason) => {
  ctx.accepted = false;
  ctx.reason = reason;
};

function setConditions(st, condition) {
  st.conditions = condition === null ? null : { ...condition };
}

function enter(ctx, phase, condition = undefined) {
  const from = ctx.state.phase;
  ctx.state.phase = phase;
  if (condition !== undefined) setConditions(ctx.state, condition);
  ctx.transitions.push({ from, to: phase });
}

function targetTrial(state) {
  return PHASE_TRIAL[state.phase] ?? null;
}

function currentMatchesTarget(state) {
  const id = targetTrial(state);
  if (!id || !state.conditions) return false;
  const target = trialCondition(id);
  return state.conditions.light === target.light &&
    state.conditions.co2 === target.co2 &&
    state.conditions.temperature === target.temperature;
}

function observe(ctx) {
  const st = ctx.state;
  const trialId = targetTrial(st);
  if (!trialId) return reject(ctx, 'wrong-phase');
  if (!currentMatchesTarget(st)) return reject(ctx, 'wrong-condition');
  if (trialRecorded(st, trialId)) return reject(ctx, 'already-recorded');
  const record = {
    trialId,
    light: st.conditions.light,
    co2: st.conditions.co2,
    temperature: st.conditions.temperature,
  };
  st.records.push(record);
  ctx.events.push({ type: 'record-written', trialId });
}

function setLight(ctx, value) {
  const st = ctx.state;
  if (!['trial1-higher-light', 'trial2-high-light'].includes(st.phase)) return reject(ctx, 'wrong-phase');
  if (!isLight(value) || !GUIDED_LIGHT_LEVELS.includes(value)) return reject(ctx, 'invalid');
  st.conditions.light = value;
}

function answerCompare(ctx, action) {
  const st = ctx.state;
  if (!Object.hasOwn(COMPARE_PHASE, action.compare) || st.phase !== COMPARE_PHASE[action.compare]) return reject(ctx, 'wrong-phase');
  const questions = COMPARE_QUESTIONS[action.compare];
  if (!Object.hasOwn(questions, action.question) || typeof action.answer !== 'string' || !questions[action.question].includes(action.answer)) {
    return reject(ctx, 'invalid');
  }
  st.compare[action.compare][action.question] = action.answer;
}

function cont(ctx) {
  const st = ctx.state;
  switch (st.phase) {
    case 'trial1-low-light':
      return trialRecorded(st, 't1-low-light') ? enter(ctx, 'trial1-higher-light') : reject(ctx, 'locked');
    case 'trial1-higher-light':
      return trialRecorded(st, 't1-higher-light') ? enter(ctx, 'compare1', null) : reject(ctx, 'locked');
    case 'compare1':
      return compareStatus(st).c1.allCorrect ? enter(ctx, 'trial2-setup', null) : reject(ctx, 'locked');
    case 'trial2-setup':
      return enter(ctx, 'trial2-medium-light', trialCondition('t2-medium-light'));
    case 'trial2-medium-light':
      return trialRecorded(st, 't2-medium-light') ? enter(ctx, 'trial2-high-light') : reject(ctx, 'locked');
    case 'trial2-high-light':
      return trialRecorded(st, 't2-high-light') ? enter(ctx, 'compare2', null) : reject(ctx, 'locked');
    case 'compare2':
      return compareStatus(st).c2.allCorrect ? enter(ctx, 'inference', null) : reject(ctx, 'locked');
    case 'inference':
      return enter(ctx, 'concept', null);
    default:
      return reject(ctx, 'wrong-phase');
  }
}

export function reduce(prev, action) {
  const ctx = {
    state: structuredClone(prev),
    events: [],
    transitions: [],
    accepted: true,
    reason: null,
  };
  const st = ctx.state;

  switch (action?.type) {
    case 'START':
      if (st.phase !== 'welcome') reject(ctx, 'wrong-phase');
      else enter(ctx, 'mission', null);
      break;
    case 'BEGIN':
      if (st.phase !== 'mission') reject(ctx, 'wrong-phase');
      else enter(ctx, 'trial1-low-light', trialCondition('t1-low-light'));
      break;
    case 'SET_LIGHT':
      setLight(ctx, action.value);
      break;
    case 'OBSERVE':
      observe(ctx);
      break;
    case 'ANSWER_COMPARE':
      answerCompare(ctx, action);
      break;
    case 'CONTINUE':
      cont(ctx);
      break;
    default:
      reject(ctx, 'unknown-action');
  }

  return ctx;
}
