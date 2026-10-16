// Photosynthesis-factor model for Science Lab 2.0 Pilot #5 B1.
// Pure science/model layer: no DOM, no learner wording, no state machine, no persistence, no analytics.
//
// This intentionally mirrors the existing legacy page's conceptual model:
//   rate = 20 * min(lightFactor, co2Factor, temperatureFactor)
// It is a teaching model for controlled comparisons, not a physiological prediction model.

export const RATE_MAX = 20;
export const LIGHT_MIN = 0;
export const LIGHT_MAX = 100;
export const CO2_MIN = 0;
export const CO2_MAX = 1200;
export const TEMPERATURE_MIN = 5;
export const TEMPERATURE_MAX = 45;
export const LIMIT_TIE_EPSILON = 0.025;
export const RATE_SAME_EPSILON = 0.05;

export const FACTOR_IDS = Object.freeze(['light', 'co2', 'temperature']);
export const GUIDED_LIGHT_LEVELS = Object.freeze([15, 60, 100]);

export const TRIAL_IDS = Object.freeze([
  't1-low-light',
  't1-higher-light',
  't2-medium-light',
  't2-high-light',
]);

export const FIXED_TRIALS = Object.freeze({
  't1-low-light': Object.freeze({ light: 15, co2: 1000, temperature: 25 }),
  't1-higher-light': Object.freeze({ light: 60, co2: 1000, temperature: 25 }),
  't2-medium-light': Object.freeze({ light: 60, co2: 150, temperature: 25 }),
  't2-high-light': Object.freeze({ light: 100, co2: 150, temperature: 25 }),
});

const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const isLight = (v) => Number.isFinite(v) && v >= LIGHT_MIN && v <= LIGHT_MAX;
export const isCo2 = (v) => Number.isFinite(v) && v >= CO2_MIN && v <= CO2_MAX;
export const isTemperature = (v) => Number.isFinite(v) && v >= TEMPERATURE_MIN && v <= TEMPERATURE_MAX;
export const isTrialId = (v) => typeof v === 'string' && TRIAL_IDS.includes(v);

function checkLight(v) {
  if (!isLight(v)) throw new RangeError(`light must be ${LIGHT_MIN}..${LIGHT_MAX}, got ${v}`);
  return v;
}
function checkCo2(v) {
  if (!isCo2(v)) throw new RangeError(`co2 must be ${CO2_MIN}..${CO2_MAX}, got ${v}`);
  return v;
}
function checkTemperature(v) {
  if (!isTemperature(v)) throw new RangeError(`temperature must be ${TEMPERATURE_MIN}..${TEMPERATURE_MAX}, got ${v}`);
  return v;
}

export function lightFactor(light) {
  checkLight(light);
  const max = 1 - Math.exp(-100 / 35);
  return clamp((1 - Math.exp(-light / 35)) / max, 0, 1);
}

export function co2Factor(co2) {
  checkCo2(co2);
  if (co2 <= 0) return 0;
  const raw = co2 / (co2 + 300);
  const max = 1200 / 1500;
  return clamp(raw / max, 0, 1);
}

export function temperatureFactor(temperature) {
  checkTemperature(temperature);
  if (temperature <= 5 || temperature >= 45) return 0;
  if (temperature <= 25) return (temperature - 5) / 20;
  return (45 - temperature) / 20;
}

/**
 * Conceptual photosynthesis result for one controlled condition.
 * Returns derived values only; callers should never persist these as source truth.
 */
export function calculatePhotosynthesis({ light, co2, temperature } = {}) {
  checkLight(light);
  checkCo2(co2);
  checkTemperature(temperature);
  const factors = {
    light: lightFactor(light),
    co2: co2Factor(co2),
    temperature: temperatureFactor(temperature),
  };
  const minimum = Math.min(factors.light, factors.co2, factors.temperature);
  const low = FACTOR_IDS.filter((id) => factors[id] - minimum <= LIMIT_TIE_EPSILON);
  const limit = low.length > 1 ? 'tie' : low[0];
  const rate = RATE_MAX * minimum;
  return {
    light,
    co2,
    temperature,
    factors,
    limit,
    rate,
    oxygen: rate * 0.5,
  };
}

/** A cloned fixed condition, so callers cannot mutate FIXED_TRIALS. */
export function trialCondition(trialId) {
  if (!isTrialId(trialId)) throw new RangeError(`unknown trial: ${trialId}`);
  return { ...FIXED_TRIALS[trialId] };
}

/**
 * Source-only record -> rebuilt observation.
 * Only trialId/light/co2/temperature are trusted. Any cached rate/limit/factors/correct fields are ignored.
 */
export function deriveTrialObservation(record) {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) return null;
  const trialId = own(record, 'trialId') ? record.trialId : undefined;
  const light = own(record, 'light') ? record.light : undefined;
  const co2 = own(record, 'co2') ? record.co2 : undefined;
  const temperature = own(record, 'temperature') ? record.temperature : undefined;
  if (!isTrialId(trialId) || !isLight(light) || !isCo2(co2) || !isTemperature(temperature)) return null;
  return { trialId, ...calculatePhotosynthesis({ light, co2, temperature }) };
}

/** Whether one source record exactly matches the fixed Guided condition for its trial. */
export function recordMatchesFixedTrial(record) {
  const o = deriveTrialObservation(record);
  if (!o) return false;
  const fixed = FIXED_TRIALS[o.trialId];
  return o.light === fixed.light && o.co2 === fixed.co2 && o.temperature === fixed.temperature;
}

export function fixedTrialObservation(trialId) {
  const condition = trialCondition(trialId);
  return { trialId, ...calculatePhotosynthesis(condition) };
}

export function classifyRateChange(beforeRate, afterRate, epsilon = RATE_SAME_EPSILON) {
  if (!Number.isFinite(beforeRate) || !Number.isFinite(afterRate) || !Number.isFinite(epsilon) || epsilon < 0) {
    throw new RangeError('rate comparison requires finite rates and a non-negative epsilon');
  }
  const d = afterRate - beforeRate;
  return Math.abs(d) <= epsilon ? 'same' : d > 0 ? 'increase' : 'decrease';
}
