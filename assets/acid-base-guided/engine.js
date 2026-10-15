// State engine for the guided unknown-liquid lab (Pilot #4, B1). Pure reducer: no DOM, no input handling, no timers,
// no learner wording. All science comes from model.js.
//
// State holds learner inputs only. An experiment record is { sampleId, indicatorId } and nothing else: the liquid's pH,
// its kind, the strip's colours and whether it changed are rebuilt from the layout through deriveObservation(). There is
// no answer key in state either: every compare verdict is recomputed from the records, so a saved or forged state can
// never carry a "correct" flag.
//
// After the concept come the notebook (B4), three text challenges and the finish. The notebook's Level A answer is judged
// against a mapping rebuilt from the records (expectedNotebookMapping); a challenge step's verdict is judged again from its
// choice every time it is read (challenges.js), so neither a "ready" nor a "correct" flag is ever trusted from state.
import { DEFAULT_LAYOUT, KINDS, SAMPLE_IDS, deriveObservation, isIndicatorId, isSampleId } from './model.js';
import { ATTEMPTS_MAX, TEXT_MAX, challengeProgress, emptyChallenges, judgeChallenge, notebookReady, sanitizeConclusionFields } from './challenges.js';

export const PHASES = Object.freeze([
  'welcome', 'mission', 'trial1', 'compare1', 'trial2', 'compare2',
  'concept', 'notebook', 'challenge-1', 'challenge-2', 'challenge-3', 'complete',
]);

// The one indicator each trial uses. Trial 2 can only start after Compare 1, so no red-litmus record can exist before
// all three blue-litmus records do.
export const TRIAL_INDICATOR = Object.freeze({ trial1: 'blue-litmus', trial2: 'red-litmus' });

// Answer options, as semantic values. The learner wording is the page's (B3). Compare 1 Q2 will ask: "From this one strip
// result alone, can you be sure these two cups belong to the same class?" — about the class, not "the same liquid".
export const COMPARE_QUESTIONS = Object.freeze({
  c1: Object.freeze({
    patternCount: Object.freeze(['one', 'two', 'three']),
    evidenceSufficiency: Object.freeze(['same-class', 'need-more-evidence', 'different-class']),
  }),
  c2: Object.freeze({
    distinguishability: Object.freeze(['all-distinct', 'two-still-same', 'all-same']),
    unchangedSample: SAMPLE_IDS,
  }),
});
const COMPARE_PHASE = Object.freeze({ c1: 'compare1', c2: 'compare2' });
const COUNT_WORD = ['one', 'two', 'three'];

export function createInitialState() {
  return {
    phase: 'welcome',
    layout: DEFAULT_LAYOUT,
    records: [],
    compare: {
      c1: { patternCount: null, evidenceSufficiency: null },
      c2: { distinguishability: null, unchangedSample: null },
    },
    conceptPart: null,
    conclusion: { level: null, acidicSample: null, neutralSample: null, basicSample: null, freeText: '', evidenceText: '', limitationText: '' },
    challenges: emptyChallenges(),
  };
}

// ---- pure derivations -----------------------------------------------------------------------------------------------

/** Every record of the state, rebuilt through the model. Unusable records are left out. */
export const observationsOf = (state) =>
  state.records.map((record) => deriveObservation({ layoutId: state.layout, record })).filter(Boolean);

/** The rebuilt observation for one cup and one indicator, or null if that pair has not been tested. */
export function observationFor(state, sampleId, indicatorId) {
  const hits = observationsOf(state).filter((o) => o.sampleId === sampleId && o.indicatorId === indicatorId);
  return hits.length === 1 ? hits[0] : null;
}

/** Has every cup exactly one record with this indicator? Checks coverage, not the number of records. */
export function trialComplete(state, indicatorId) {
  const seen = observationsOf(state).filter((o) => o.indicatorId === indicatorId);
  return seen.length === SAMPLE_IDS.length && SAMPLE_IDS.every((id) => seen.filter((o) => o.sampleId === id).length === 1);
}

/**
 * What Compare 1 should conclude, from the blue-litmus records only (null until all three cups are tested).
 *   patternCount         how many different results the three cups gave
 *   evidenceSufficiency  the teaching inference: cups that gave the same result with one indicator are not yet shown
 *                        to be the same class ("need-more-evidence"); one indicator can never prove "same-class".
 *                        Only if every cup already differed would "different-class" follow.
 */
export function expectedCompare1(state) {
  if (!trialComplete(state, TRIAL_INDICATOR.trial1)) return null;
  const results = SAMPLE_IDS.map((id) => observationFor(state, id, TRIAL_INDICATOR.trial1).result);
  const distinct = new Set(results).size;
  return {
    patternCount: COUNT_WORD[distinct - 1],
    evidenceSufficiency: distinct < SAMPLE_IDS.length ? 'need-more-evidence' : 'different-class',
  };
}

/** Each cup's [blue-litmus, red-litmus] results, rebuilt from the records (null until both trials are complete). */
export function recordSignatures(state) {
  if (!trialComplete(state, TRIAL_INDICATOR.trial1) || !trialComplete(state, TRIAL_INDICATOR.trial2)) return null;
  return Object.fromEntries(SAMPLE_IDS.map((id) => [id, [TRIAL_INDICATOR.trial1, TRIAL_INDICATOR.trial2].map((ind) => observationFor(state, id, ind).result)]));
}

/**
 * What Compare 2 should conclude, from both trials' records (null until both are complete).
 *   distinguishability  how many different [blue, red] response patterns the three cups form
 *   unchangedSample     the one cup whose strips both kept their colour (blue stays blue AND red stays red), or null
 *                       if no single cup does. Found from the records, never assumed to be a given letter.
 */
export function expectedCompare2(state) {
  const sig = recordSignatures(state);
  if (!sig) return null;
  const distinct = new Set(Object.values(sig).map((s) => s.join('|'))).size;
  const unchanged = SAMPLE_IDS.filter((id) => sig[id][0] === 'stays-blue' && sig[id][1] === 'stays-red');
  return {
    distinguishability: distinct === SAMPLE_IDS.length ? 'all-distinct' : distinct === 1 ? 'all-same' : 'two-still-same',
    unchangedSample: unchanged.length === 1 ? unchanged[0] : null,
  };
}

/** The learner's answers against the recomputed expectations. Never stored in state. */
export function compareStatus(state) {
  // Only the listed questions are judged; anything else a (forged) state carries next to the answers is ignored.
  const judge = (group, expected) => {
    const answers = state.compare?.[group] ?? {};
    const out = Object.fromEntries(Object.keys(COMPARE_QUESTIONS[group]).map((q) => {
      const a = Object.hasOwn(answers, q) ? answers[q] : null;
      return [q, { answer: a, correct: expected !== null && expected[q] !== null && a === expected[q] }];
    }));
    return { ...out, allCorrect: Object.values(out).every((x) => x.correct) };
  };
  return { c1: judge('c1', expectedCompare1(state)), c2: judge('c2', expectedCompare2(state)) };
}

/**
 * Which cup shows each class's response pattern, rebuilt from both trials' records ({ acidic, neutral, basic } → sample
 * letter). null until both trials are complete, or if the records do not give exactly one cup per class. This is what the
 * notebook's Level A is checked against; it is never stored and never shown before the learner answers.
 */
export function expectedNotebookMapping(state) {
  if (!recordSignatures(state)) return null;
  const kindOf = (id) => {
    const kinds = [TRIAL_INDICATOR.trial1, TRIAL_INDICATOR.trial2].map((ind) => observationFor(state, id, ind).kind);
    return kinds[0] === kinds[1] ? kinds[0] : null;
  };
  const out = {};
  for (const kind of KINDS) {
    const cups = SAMPLE_IDS.filter((id) => kindOf(id) === kind);
    if (cups.length !== 1) return null;
    out[kind] = cups[0];
  }
  return out;
}

/** Is the notebook ready to move on? Recomputed every time; never stored. */
export const notebookIsReady = (state) => notebookReady(state.conclusion, expectedNotebookMapping(state));

const CHALLENGE_PHASE = /^challenge-([123])$/;
/** The challenge the phase is on (1, 2 or 3), or null. */
export const challengeIdOf = (phase) => (CHALLENGE_PHASE.test(phase) ? Number(phase.slice(-1)) : null);

// ---- reducer ----------------------------------------------------------------------------------------------------------

const reject = (ctx, reason) => { ctx.accepted = false; ctx.reason = reason; };

function enter(ctx, phase) {
  const st = ctx.state, from = st.phase;
  st.phase = phase;
  if (phase === 'concept') st.conceptPart = 'naming';
  ctx.transitions.push({ from, to: phase });
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
  if (!step.unlocked || step.correct) return reject(ctx, 'locked');       // a later step waits for the one before; a solved step takes no more tries
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

const AFTER_CHALLENGE = { 'challenge-1': 'challenge-2', 'challenge-2': 'challenge-3', 'challenge-3': 'complete' };

function dip(ctx, { sampleId, indicatorId }) {
  const st = ctx.state, wanted = TRIAL_INDICATOR[st.phase];
  if (!wanted) return reject(ctx, 'wrong-phase');
  if (!isSampleId(sampleId) || !isIndicatorId(indicatorId)) return reject(ctx, 'invalid');
  if (indicatorId !== wanted) return reject(ctx, 'wrong-indicator');
  if (st.records.some((r) => r.sampleId === sampleId && r.indicatorId === indicatorId)) return reject(ctx, 'already-tested');
  st.records.push({ sampleId, indicatorId });
  ctx.events.push({ type: 'record-written', sampleId, indicatorId });
}

function cont(ctx) {
  const st = ctx.state;
  switch (st.phase) {
    case 'trial1': return trialComplete(st, TRIAL_INDICATOR.trial1) ? enter(ctx, 'compare1') : reject(ctx, 'locked');
    case 'compare1': return compareStatus(st).c1.allCorrect ? enter(ctx, 'trial2') : reject(ctx, 'locked');
    case 'trial2': return trialComplete(st, TRIAL_INDICATOR.trial2) ? enter(ctx, 'compare2') : reject(ctx, 'locked');
    case 'compare2': return compareStatus(st).c2.allCorrect ? enter(ctx, 'concept') : reject(ctx, 'locked');
    // The notebook opens only after the learner has asked for pH: the naming part alone does not move on.
    case 'concept': return st.conceptPart === 'ph' ? enter(ctx, 'notebook') : reject(ctx, 'locked');
    case 'notebook': return notebookIsReady(st) ? enter(ctx, 'challenge-1') : reject(ctx, 'locked');
    case 'challenge-1': case 'challenge-2': case 'challenge-3':
      return challengeProgress(challengeIdOf(st.phase), st.challenges[challengeIdOf(st.phase)]).allCorrect ? enter(ctx, AFTER_CHALLENGE[st.phase]) : reject(ctx, 'locked');
    default: return reject(ctx, 'wrong-phase');
  }
}

export function reduce(prev, action) {
  const ctx = { state: structuredClone(prev), events: [], transitions: [], accepted: true, reason: null };
  const st = ctx.state;
  switch (action?.type) {
    case 'START':
      if (st.phase !== 'welcome') reject(ctx, 'wrong-phase'); else enter(ctx, 'mission');
      break;
    case 'BEGIN':
      if (st.phase !== 'mission') reject(ctx, 'wrong-phase'); else enter(ctx, 'trial1');
      break;
    case 'DIP': dip(ctx, action); break;
    case 'ANSWER_COMPARE': {
      const group = Object.hasOwn(COMPARE_PHASE, action.compare) ? COMPARE_QUESTIONS[action.compare] : null;
      const options = group && Object.hasOwn(group, action.question) ? group[action.question] : null;
      if (!group || st.phase !== COMPARE_PHASE[action.compare]) reject(ctx, 'wrong-phase');
      else if (!options || !options.includes(action.answer)) reject(ctx, 'invalid');
      else st.compare[action.compare][action.question] = action.answer;
      break;
    }
    case 'REVEAL_PH':
      if (st.phase !== 'concept') reject(ctx, 'wrong-phase');
      else if (st.conceptPart !== 'naming') reject(ctx, 'already-revealed');
      else st.conceptPart = 'ph';
      break;
    case 'SAVE_CONCLUSION': saveConclusion(ctx, action.fields); break;
    case 'ANSWER_CHALLENGE': answerChallenge(ctx, action); break;
    case 'SAVE_CHALLENGE_NOTE': saveChallengeNote(ctx, action); break;
    case 'CONTINUE': cont(ctx); break;
    default: reject(ctx, 'unknown-action');
  }
  if (!ctx.accepted) return { state: prev, accepted: false, reason: ctx.reason, events: [], transitions: [] };
  return { state: ctx.state, accepted: true, reason: null, events: ctx.events, transitions: ctx.transitions };
}
