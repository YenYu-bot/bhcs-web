// Notebook readiness and challenge truth for Science Lab 2.0 Pilot #5 B4.
// Pure data/functions: no wording, DOM, storage, analytics or transitions.
export const TEXT_MAX = 1000;
export const ATTEMPTS_MAX = 999;
export const HINT_AFTER_ATTEMPTS = 2;
export const MIN_WRITTEN = 4;
export const LEVELS = Object.freeze(['A', 'B', 'C']);

export const RELATION_FIELDS = Object.freeze({
  trial1Change: Object.freeze(['increase', 'same', 'decrease']),
  trial2Change: Object.freeze(['increase', 'same', 'decrease']),
  alwaysWorks: Object.freeze(['yes', 'no']),
});
export const TEXT_FIELDS = Object.freeze(['freeText', 'evidenceText', 'limitationText']);

const lock = (o) => Object.freeze(o);

export const CHALLENGES = lock([
  lock({
    id: 1,
    steps: lock([
      lock({ id: 'c1-next', options: lock(['raise-light', 'raise-co2', 'raise-temp', 'change-nothing']), correct: 'raise-co2' }),
    ]),
  }),
  lock({
    id: 2,
    steps: lock([
      lock({ id: 'c2-fair', options: lock(['change-all', 'change-co2-only', 'change-light-too', 'change-temperature-only']), correct: 'change-co2-only' }),
    ]),
  }),
  lock({
    id: 3,
    note: true,
    steps: lock([
      lock({ id: 'c3-claim', options: lock(['always-faster', 'cannot-say-always', 'temperature-no-effect', 'random']), correct: 'cannot-say-always' }),
    ]),
  }),
]);

export const challengeById = (id) => CHALLENGES.find((c) => c.id === id) ?? null;
export const stepOf = (id, stepId) => challengeById(id)?.steps.find((s) => s.id === stepId) ?? null;

export function judgeChallenge(id, stepId, choice) {
  const step = stepOf(id, stepId);
  if (!step || typeof choice !== 'string' || !step.options.includes(choice)) return null;
  return choice === step.correct;
}

export const emptyChallenges = () => ({
  1: { steps: {} },
  2: { steps: {} },
  3: { steps: {}, note: '' },
});

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

export function notebookReady(conclusion, expected = null) {
  if (!conclusion) return false;
  if (conclusion.level === 'A') {
    return Boolean(expected) &&
      Object.entries(RELATION_FIELDS).every(([field, values]) =>
        values.includes(conclusion[field]) && conclusion[field] === expected[field]);
  }
  if (conclusion.level === 'B') return written(conclusion.freeText);
  if (conclusion.level === 'C') return written(conclusion.evidenceText) && written(conclusion.limitationText);
  return false;
}

export function sanitizeConclusionFields(fields) {
  if (fields === null || typeof fields !== 'object' || Array.isArray(fields)) return null;
  const out = {};
  for (const key of Object.keys(fields)) {
    const value = fields[key];
    if (key === 'level') {
      if (LEVELS.includes(value)) out.level = value;
    } else if (Object.hasOwn(RELATION_FIELDS, key)) {
      if (value === null || RELATION_FIELDS[key].includes(value)) out[key] = value;
    } else if (TEXT_FIELDS.includes(key)) {
      if (typeof value === 'string') out[key] = value.slice(0, TEXT_MAX);
    }
  }
  return Object.keys(out).length ? out : null;
}
