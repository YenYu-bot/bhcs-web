// Physics and clarity model for the guided optics lab (Spec v1.2 §7).
// Pure functions: no DOM, no state. Every other layer must read these results and never recompute them.

// Numerical-stability tolerance for float comparisons (u = f, |m| = 1, bench edges, level boundaries).
// Deliberately separate from the clarity tolerance t, which is a teaching rule.
export const NUMERIC_EPSILON = 1e-9;

export const BENCH_MIN = 8;
export const BENCH_MAX = 40;

const CLARITY_TOLERANCE_RATIO = 0.06, CLARITY_TOLERANCE_MIN = 0.75, CLARITY_TOLERANCE_MAX = 1.25;

const positive = (name, x) => {
  if (typeof x !== 'number' || !Number.isFinite(x) || x <= 0) throw new RangeError(`${name} must be a positive finite number`);
  return x;
};
const finite = (name, x) => {
  if (typeof x !== 'number' || !Number.isFinite(x)) throw new RangeError(`${name} must be a finite number`);
  return x;
};
const checkBench = (min, max) => {
  finite('benchMin', min); finite('benchMax', max);
  if (min >= max) throw new RangeError('benchMin must be less than benchMax');
};
const nearZero = (x, scale = 1) => Math.abs(x) <= NUMERIC_EPSILON * Math.max(1, Math.abs(scale));
const within = (x, min, max) => x >= min - NUMERIC_EPSILON && x <= max + NUMERIC_EPSILON;

/** t = clamp(0.06 × f, 0.75, 1.25) cm */
export function clarityTolerance(f) {
  positive('f', f);
  return Math.min(CLARITY_TOLERANCE_MAX, Math.max(CLARITY_TOLERANCE_MIN, CLARITY_TOLERANCE_RATIO * f));
}

/**
 * Thin-lens state for a convex lens: 1/f = 1/u + 1/v, m = -v/u.
 * u = f has no finite image: theoreticalV and magnification are null (never Infinity / NaN).
 */
export function calculateLensState({ f, u, benchMin = BENCH_MIN, benchMax = BENCH_MAX }) {
  positive('f', f); positive('u', u); checkBench(benchMin, benchMax);
  const base = { f, u, benchMin, benchMax };
  if (nearZero(u - f, Math.max(f, u))) {
    return { ...base, theoreticalV: null, magnification: null, absoluteMagnification: null,
      imageType: 'infinite', imageOrientation: 'undefined', imageSize: 'undefined',
      projectable: false, projectionWithinBench: false };
  }
  const v = f * u / (u - f), m = -v / u, abs = Math.abs(m);
  const real = v > 0;
  const imageSize = nearZero(abs - 1) ? 'same' : abs < 1 ? 'smaller' : 'larger';
  return { ...base, theoreticalV: v, magnification: m, absoluteMagnification: abs,
    imageType: real ? 'real' : 'virtual', imageOrientation: real ? 'inverted' : 'upright', imageSize,
    projectable: real, projectionWithinBench: real && within(v, benchMin, benchMax) };
}

const rawLevel = (e, t) => {
  if (e <= t + NUMERIC_EPSILON) return 1;
  if (e <= 3 * t + NUMERIC_EPSILON) return 2;
  if (e <= 7 * t + NUMERIC_EPSILON) return 3;
  return 4;
};

/**
 * Clarity of the screen image (Spec §7.3).
 * rawClarityLevel depends on e only and exists only for real images.
 * effectiveClarityLevel is what every UI / scoring / transition must use:
 *   not real → 4;  real and inside bench → raw;  real but outside bench → max(raw, 2), never 1.
 * benchMin / benchMax default to the values carried by lensState.
 */
export function calculateClarity({ lensState, screenPosition, benchMin = lensState?.benchMin, benchMax = lensState?.benchMax }) {
  if (!lensState || typeof lensState !== 'object') throw new TypeError('lensState is required');
  finite('screenPosition', screenPosition);
  checkBench(benchMin, benchMax);
  const tolerance = clarityTolerance(lensState.f);
  if (lensState.imageType !== 'real') {
    return { screenPosition, error: null, tolerance, rawClarityLevel: null, effectiveClarityLevel: 4, projectionWithinBench: false };
  }
  const error = Math.abs(screenPosition - lensState.theoreticalV);
  const raw = rawLevel(error, tolerance);
  const projectionWithinBench = within(lensState.theoreticalV, benchMin, benchMax);
  return { screenPosition, error, tolerance, rawClarityLevel: raw,
    effectiveClarityLevel: projectionWithinBench ? raw : Math.max(raw, 2), projectionWithinBench };
}
