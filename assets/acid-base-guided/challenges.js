// Challenge data, judging and the notebook readiness rule for the guided unknown-liquid lab (Pilot #4, B4).
// Plain data and pure functions. It holds no learner wording (that is script.js) and no state transitions (engine.js). All three
// challenges are text questions about a new liquid: nothing here asks the learner to use the bench again.
import { SAMPLE_IDS } from './model.js';

export const TEXT_MAX = 1000;
export const ATTEMPTS_MAX = 999;
export const HINT_AFTER_ATTEMPTS = 2;     // from the second wrong try on, a step shows its own hint instead of the generic nudge
export const MIN_WRITTEN = 4;            // non-space characters a written notebook field needs; no semantic judgement
export const LEVELS = Object.freeze(['A', 'B', 'C']);
/** Level A asks which cup fits each class. Each field holds a sample letter or null; the expected letters come from the engine. */
export const MAPPING_FIELDS = Object.freeze({ acidicSample: 'acidic', neutralSample: 'neutral', basicSample: 'basic' });
export const TEXT_FIELDS = Object.freeze(['freeText', 'evidenceText', 'limitationText']);

const lock = (o) => Object.freeze(o);

/**
 * Each step: its option ids in display order, and the correct one. The correct option is never the first one shown.
 * Challenge 1: blue litmus turns red, red litmus stays red: which class fits best?
 * Challenge 2: only one test was made (blue stays blue): is that enough, and what single test would settle it?
 * Challenge 3: phenolphthalein stayed colourless and someone says "so it is not basic": is that sound, and what next?
 */
export const CHALLENGES = lock([
  lock({ id: 1, steps: lock([lock({ id: 'c1-class', options: lock(['neutral', 'acidic', 'not-enough', 'basic']), correct: 'acidic' })]) }),
  lock({
    id: 2,
    steps: lock([
      lock({ id: 'c2-enough', options: lock(['acidic', 'basic', 'not-enough', 'neutral']), correct: 'not-enough' }),
      lock({ id: 'c2-next', options: lock(['repeat-blue', 'red-litmus', 'look-clear', 'guess']), correct: 'red-litmus' }),
    ]),
  }),
  lock({
    id: 3,
    note: true,
    steps: lock([
      lock({ id: 'c3-claim', options: lock(['never-basic', 'cannot-rule-out-basic', 'definitely-acidic', 'definitely-neutral']), correct: 'cannot-rule-out-basic' }),
      lock({ id: 'c3-next', options: lock(['taste', 'color-alone', 'litmus-pair', 'no-more-test']), correct: 'litmus-pair' }),
    ]),
  }),
]);

export const challengeById = (id) => CHALLENGES.find((c) => c.id === id) ?? null;
export const stepOf = (id, stepId) => challengeById(id)?.steps.find((s) => s.id === stepId) ?? null;

/** true / false for a known step and one of its options; null for anything else. */
export function judgeChallenge(id, stepId, choice) {
  const step = stepOf(id, stepId);
  if (!step || typeof choice !== 'string' || !step.options.includes(choice)) return null;
  return choice === step.correct;
}

export const emptyChallenges = () => ({ 1: { steps: {} }, 2: { steps: {} }, 3: { steps: {}, note: '' } });

/**
 * Progress of one challenge from its answers ({ steps: { [stepId]: { choice, attempts } } }). Whether a step is solved is judged
 * here, from the choice, every time: nothing stored says "correct". A step unlocks once the one before it is solved.
 */
export function challengeProgress(id, saved) {
  const def = challengeById(id);
  if (!def) return { steps: [], allCorrect: false };
  let previousSolved = true;
  const steps = def.steps.map((s) => {
    const a = saved?.steps && Object.hasOwn(saved.steps, s.id) ? saved.steps[s.id] : null;
    const choice = typeof a?.choice === 'string' && s.options.includes(a.choice) ? a.choice : null;
    const out = {
      id: s.id,
      unlocked: previousSolved,
      choice,
      attempts: Number.isSafeInteger(a?.attempts) && a.attempts > 0 ? Math.min(a.attempts, ATTEMPTS_MAX) : 0,
      correct: previousSolved && choice !== null && choice === s.correct,
    };
    previousSolved = out.correct;
    return out;
  });
  return { steps, allCorrect: steps.every((s) => s.correct) };
}

const countWritten = (text) => (typeof text === 'string' ? text.replace(/\s/g, '').length : 0);
export const written = (text) => countWritten(text) >= MIN_WRITTEN;

/**
 * Notebook readiness. Level A must match what the learner's own records show; B and C only need to be written.
 * `expected` comes from the engine ({ acidic, neutral, basic } sample letters, or null) and is never shown to the learner.
 */
export function notebookReady(conclusion, expected = null) {
  if (!conclusion) return false;
  if (conclusion.level === 'A') {
    return Boolean(expected) && Object.entries(MAPPING_FIELDS).every(([field, kind]) => expected[kind] != null && conclusion[field] === expected[kind]);
  }
  if (conclusion.level === 'B') return written(conclusion.freeText);
  if (conclusion.level === 'C') return written(conclusion.evidenceText) && written(conclusion.limitationText);
  return false;
}

/**
 * The clean subset of conclusion fields. A field that is not allowed, or whose value is not valid, is ignored; null when
 * nothing valid is left (so an action that carries no usable field is refused by the engine).
 */
export function sanitizeConclusionFields(fields) {
  if (fields === null || typeof fields !== 'object' || Array.isArray(fields)) return null;
  const out = {};
  for (const key of Object.keys(fields)) {
    const value = fields[key];
    if (key === 'level') { if (LEVELS.includes(value)) out.level = value; }
    else if (Object.hasOwn(MAPPING_FIELDS, key)) { if (value === null || SAMPLE_IDS.includes(value)) out[key] = value; }
    else if (TEXT_FIELDS.includes(key)) { if (typeof value === 'string') out[key] = value.slice(0, TEXT_MAX); }
  }
  return Object.keys(out).length ? out : null;
}
