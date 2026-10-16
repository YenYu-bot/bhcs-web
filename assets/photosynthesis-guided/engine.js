// State engine for Science Lab 2.0 Pilot #5 (photosynthesis-factor Guided Prototype).
// Pure reducer: no DOM, timers, wording, persistence or analytics. Source conditions / learner inputs are stored;
// rates, factor values, limiting-factor ids, notebook readiness and challenge correctness are always rebuilt.
import {
  GUIDED_LIGHT_LEVELS,
  TRIAL_IDS,
  classifyRateChange,
  deriveTrialObservation,
  isLight,
  recordMatchesFixedTrial,
  trialCondition,
} from './model.js';
import {
  ATTEMPTS_MAX,
  TEXT_MAX,
  challengeProgress,
  emptyChallenges,
  judgeChallenge,
  notebookReady,
  sanitizeConclusionFields,
} from './challenges.js';

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
  'notebook',
  'challenge-1',
  'challenge-2',
  'challenge-3',
  'complete',
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
const AFTER_CHALLENGE = Object.freeze({
  'challenge-1': 'challenge-2',
  'challenge-2': 'challenge-3',
  'challenge-3': 'complete',
});
const CHALLENGE_PHASE = /^challenge-([123])$/;

export function createInitialState() {
  return {
    phase: 'welcome',
    conditions: null,
    records: [],
    compare: {
      c1: { rateChange: null, claim: null },
      c2: { rateChange: null, reason: null },
    },
    conclusion: {
      level: null,
      trial1Change: null,
      trial2Change: null,
      alwaysWorks: null,
      freeText: '',
      evidenceText: '',
      limitationText: '',
    },
    challenges: emptyChallenges(),
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
      onlyLightChanged: p[0].co2 === p[1].co2 &&
        p[0].temperature === p[1].temperature &&
        p[0].light !== p[1].light,
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
      onlyLightChanged: p[0].co2 === p[1].co2 &&
        p[0].temperature === p[1].temperature &&
        p[0].light !== p[1].light,
    },
  };
}

export function expectedCompare1(state) {
  const e = compare1Evidence(state);
  if (!e || !e.controlled.onlyLightChanged || e.after.light <= e.before.light) return null;
  const rateChange = classifyRateChange(e.before.rate, e.after.rate);
  return {
    rateChange,
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

function allTrialEvidence(state) {
  if (!TRIAL_IDS.every((id) => trialRecorded(state, id))) return null;
  return Object.fromEntries(TRIAL_IDS.map((id) => [id, observationFor(state, id)]));
}

/** Formal Concept evidence is unavailable before Concept, but remains derivable afterwards. */
export function conceptEvidence(state) {
  if (PHASES.indexOf(state.phase) < PHASES.indexOf('concept')) return null;
  const observations = allTrialEvidence(state);
  if (!observations) return null;
  return {
    observations,
    compare1: expectedCompare1(state),
    compare2: expectedCompare2(state),
    trial1LimitAfterIncrease: observations['t1-higher-light'].limit,
    trial2LimitAfterIncrease: observations['t2-high-light'].limit,
  };
}

/** Level-A notebook answer key, rebuilt only from the learner's four valid records. */
export function expectedNotebookRelations(state) {
  const observations = allTrialEvidence(state);
  const c1 = expectedCompare1(state), c2 = expectedCompare2(state);
  if (!observations || !c1 || !c2) return null;
  return {
    trial1Change: c1.rateChange,
    trial2Change: c2.rateChange,
    alwaysWorks: c1.rateChange === 'increase' && c2.rateChange === 'same' ? 'no' : 'yes',
  };
}
export const notebookIsReady = (state) => notebookReady(state.conclusion, expectedNotebookRelations(state));

export const challengeIdOf = (phase) =>
  CHALLENGE_PHASE.test(phase) ? Number(phase.slice(-1)) : null;

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
  st.records.push({
    trialId,
    light: st.conditions.light,
    co2: st.conditions.co2,
    temperature: st.conditions.temperature,
  });
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
  if (!Object.hasOwn(COMPARE_PHASE, action.compare) || st.phase !== COMPARE_PHASE[action.compare]) {
    return reject(ctx, 'wrong-phase');
  }
  const questions = COMPARE_QUESTIONS[action.compare];
  if (!Object.hasOwn(questions, action.question) ||
      typeof action.answer !== 'string' ||
      !questions[action.question].includes(action.answer)) {
    return reject(ctx, 'invalid');
  }
  st.compare[action.compare][action.question] = action.answer;
}

function saveConclusion(ctx, fields) {
  const st = ctx.state;
  if (st.phase !== 'notebook') return reject(ctx, 'wrong-phase');
  const clean = sanitizeConclusionFields(fields);
  if (!clean) return reject(ctx, 'invalid');
  Object.assign(st.conclusion, clean);
}

function answerChallenge(ctx, action) {
  const st = ctx.state, id = challengeIdOf(st.phase);
  if (id === null || id !== action.id) return reject(ctx, 'wrong-phase');
  const step = challengeProgress(id, st.challenges[id]).steps.find((x) => x.id === action.step);
  if (!step) return reject(ctx, 'invalid');
  if (!step.unlocked || step.correct) return reject(ctx, 'locked');
  const correct = judgeChallenge(id, action.step, action.choice);
  if (correct === null) return reject(ctx, 'invalid');
  const attempts = Math.min(step.attempts + 1, ATTEMPTS_MAX);
  st.challenges[id].steps[action.step] = { choice: action.choice, attempts, correct };
  ctx.events.push({ type: 'challenge-answered', challengeId: id, step: action.step, correct, attempts });
}

function saveChallengeNote(ctx, action) {
  const st = ctx.state;
  if (st.phase !== 'challenge-3' || action.id !== 3) return reject(ctx, 'wrong-phase');
  if (typeof action.text !== 'string') return reject(ctx, 'invalid');
  if (!challengeProgress(3, st.challenges[3]).allCorrect) return reject(ctx, 'locked');
  st.challenges[3].note = action.text.slice(0, TEXT_MAX);
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
    case 'concept':
      return conceptEvidence(st) ? enter(ctx, 'notebook', null) : reject(ctx, 'locked');
    case 'notebook':
      return notebookIsReady(st) ? enter(ctx, 'challenge-1', null) : reject(ctx, 'locked');
    case 'challenge-1':
    case 'challenge-2':
    case 'challenge-3': {
      const id = challengeIdOf(st.phase);
      return challengeProgress(id, st.challenges[id]).allCorrect
        ? enter(ctx, AFTER_CHALLENGE[st.phase], null)
        : reject(ctx, 'locked');
    }
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
    case 'SAVE_CONCLUSION':
      saveConclusion(ctx, action.fields);
      break;
    case 'ANSWER_CHALLENGE':
      answerChallenge(ctx, action);
      break;
    case 'SAVE_CHALLENGE_NOTE':
      saveChallengeNote(ctx, action);
      break;
    case 'CONTINUE':
      cont(ctx);
      break;
    default:
      reject(ctx, 'unknown-action');
  }

  if (!ctx.accepted) return { state: prev, accepted: false, reason: ctx.reason, events: [], transitions: [] };
  return { state: ctx.state, accepted: true, reason: null, events: ctx.events, transitions: ctx.transitions };
}
