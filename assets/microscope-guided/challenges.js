// Challenge data, judging and the notebook readiness rule for the guided microscope lab (Pilot #3, B4).
// Plain data and pure functions. It holds no learner wording (that is script.js), no state transitions (engine.js) and no
// science: all three challenges are text questions (nothing here asks the learner to operate the bench again).

export const TEXT_MAX = 1000;
export const ATTEMPTS_MAX = 999;
export const HINT_AFTER_ATTEMPTS = 2;
export const MIN_WRITTEN = 4;            // non-space characters a written notebook field needs; no semantic judgement
export const LEVELS = Object.freeze(['A', 'B', 'C']);
export const RELATION_DIRECTION = Object.freeze(['left', 'right', 'still']);
export const RELATION_RANGE = Object.freeze(['smaller', 'larger', 'same']);

const lock = (o) => Object.freeze(o);

/**
 * Each step: its option ids in display order, and the correct one. The correct option is deliberately not always first.
 * Challenge 1: the target is at the upper left and must come back, so which way does the slide go?
 * Challenge 2: 4× shows A, B, C with B centred; what is seen at 40×, and what does that support?
 * Challenge 3: the target vanished at high power; what is the sensible next move?
 */
export const CHALLENGES = lock([
  lock({ id: 1, steps: lock([lock({ id: 'c1-direction', options: lock(['right-up', 'left-up', 'right-down', 'left-down']), correct: 'left-up' })]) }),
  lock({
    id: 2,
    steps: lock([
      lock({ id: 'c2-view', options: lock(['all-larger', 'only-b-larger', 'all-smaller', 'more-marks']), correct: 'only-b-larger' }),
      lock({ id: 'c2-claim', options: lock(['slide-moved', 'marks-shrunk', 'smaller-field', 'brighter']), correct: 'smaller-field' }),
    ]),
  }),
  lock({ id: 3, note: true, steps: lock([lock({ id: 'c3-strategy', options: lock(['high-random', 'higher-mag', 'low-recentre', 'brightest']), correct: 'low-recentre' })]) }),
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
 * Progress of one challenge from its saved answers ({ steps: { [stepId]: { choice, correct, attempts } } }).
 * A step unlocks once the one before it is solved. Never exposes the correct option.
 */
export function challengeProgress(id, saved) {
  const def = challengeById(id);
  if (!def) return { steps: [], allCorrect: false };
  let previousSolved = true;
  const steps = def.steps.map((s) => {
    const a = saved?.steps?.[s.id];
    const out = {
      id: s.id,
      unlocked: previousSolved,
      choice: typeof a?.choice === 'string' ? a.choice : null,
      attempts: Number.isInteger(a?.attempts) && a.attempts > 0 ? a.attempts : 0,
      correct: a?.correct === true,
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
 * `expected` comes from the engine ({ direction, range } or null) and is never shown to the learner.
 */
export function notebookReady(conclusion, expected = null) {
  if (!conclusion) return false;
  if (conclusion.level === 'A') {
    return Boolean(expected) && expected.direction !== null && expected.range !== null
      && conclusion.relationDirection === expected.direction && conclusion.relationRange === expected.range;
  }
  if (conclusion.level === 'B') return written(conclusion.freeText);
  if (conclusion.level === 'C') return written(conclusion.evidenceText) && written(conclusion.limitationText);
  return false;
}

const TEXT_FIELDS = ['freeText', 'evidenceText', 'limitationText'];

/**
 * The clean subset of conclusion fields. A field that is not allowed, or whose value is not valid, is ignored; null when
 * nothing valid is left (so an action that carries no usable field is refused by the engine).
 */
export function sanitizeConclusionFields(fields) {
  if (fields === null || typeof fields !== 'object' || Array.isArray(fields)) return null;
  const out = {};
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'level') { if (LEVELS.includes(value)) out.level = value; }
    else if (key === 'relationDirection') { if (value === null || RELATION_DIRECTION.includes(value)) out.relationDirection = value; }
    else if (key === 'relationRange') { if (value === null || RELATION_RANGE.includes(value)) out.relationRange = value; }
    else if (TEXT_FIELDS.includes(key)) { if (typeof value === 'string') out[key] = value.slice(0, TEXT_MAX); }
  }
  return Object.keys(out).length ? out : null;
}
