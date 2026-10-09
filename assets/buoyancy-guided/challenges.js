// Challenge data, judging and the notebook readiness rule for the guided buoyancy lab (Prototype Technical Spec v1.0 §12, §13).
// Plain data and pure functions. It holds no learner wording (that is script.js), no state transitions (engine.js) and
// no science constants: where a challenge needs a liquid or a block setup it names the model's ids, and the tests
// check every correct answer against model.js.

export const TEXT_MAX = 1000;
export const HINT_AFTER_ATTEMPTS = 2;
export const LEVELS = Object.freeze(['A', 'B', 'C']);
export const RELATION_LIQUID = Object.freeze(['larger', 'smaller', 'same']);
export const RELATION_WOOD = Object.freeze(['mass', 'volume', 'density']);

const lock = (o) => Object.freeze(o);

/** Each step: the ids of its options (fixed order), the correct id, and the setup it asks about. */
export const CHALLENGES = lock([
  lock({
    id: 1,
    steps: lock([
      lock({ id: 'c1-outcome', options: lock(['float', 'stay', 'sink']), correct: 'sink', setup: lock({ slots: 3, liquidId: 'oil' }) }),
    ]),
  }),
  lock({
    id: 2,
    steps: lock([
      lock({ id: 'c2-where', options: lock(['all-out', 'under-80', 'stay', 'sink']), correct: 'under-80', setup: lock({ slots: 2, liquidId: 'water' }) }),
      lock({ id: 'c2-brine', options: lock(['more', 'less', 'same']), correct: 'less', setup: lock({ slots: 2, liquidId: 'brine' }) }),
    ]),
  }),
  lock({
    id: 3,
    steps: lock([
      lock({ id: 'c3-reason', options: lock(['mass-less', 'volume-spread', 'boat-shape-only', 'spread-out']), correct: 'volume-spread', setup: null }),
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

export const emptyChallenges = () => ({ 1: { steps: {} }, 2: { steps: {} }, 3: { steps: {} } });

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

/**
 * Notebook readiness (Spec §10). Level A must match what the learner's own records show; B and C only need to be written.
 * `expected` comes from the engine ({ liquid, wood } or null) and is never shown to the learner.
 */
export function notebookReady(conclusion, expected = null) {
  if (!conclusion) return false;
  if (conclusion.level === 'A') return Boolean(expected) && conclusion.relationLiquid === expected.liquid && conclusion.relationWood === expected.wood;
  if (conclusion.level === 'B') return countWritten(conclusion.freeText) >= 2;
  if (conclusion.level === 'C') return countWritten(conclusion.evidenceText) >= 2 && countWritten(conclusion.limitationText) >= 2;
  return false;
}

const TEXT_FIELDS = ['freeText', 'evidenceText', 'limitationText'];

/** Returns the clean subset of conclusion fields, or null when anything is not an allowed field or value. */
export function sanitizeConclusionFields(fields) {
  if (fields === null || typeof fields !== 'object' || Array.isArray(fields)) return null;
  const out = {};
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'level') { if (!LEVELS.includes(value)) return null; out.level = value; }
    else if (key === 'relationLiquid') { if (value !== null && !RELATION_LIQUID.includes(value)) return null; out.relationLiquid = value; }
    else if (key === 'relationWood') { if (value !== null && !RELATION_WOOD.includes(value)) return null; out.relationWood = value; }
    else if (TEXT_FIELDS.includes(key)) { if (typeof value !== 'string') return null; out[key] = value.slice(0, TEXT_MAX); }
    else return null;
  }
  return Object.keys(out).length ? out : null;
}
