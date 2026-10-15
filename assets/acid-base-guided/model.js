// Acid–base model for the guided unknown-liquid lab (Pilot #4, B1). Pure functions and frozen data: no DOM, no state, no
// learner wording. Everything here is identified by semantic ids; the page supplies every word the learner reads.
//
// Two separate models, on purpose:
//   1. classifyPh10()        the station's 25 °C classification rule: acidic / neutral / basic by pH against 7.
//   2. indicatorObservation() what one indicator shows at a given pH: its own colour rule, with its own ranges.
// They are never merged into one function. An indicator result is evidence about a pH range, not a classification:
// phenolphthalein, for example, is still colourless in a weakly basic liquid (pH 8.0), so "colourless" never means
// "acidic or neutral".
//
// pH is carried as an integer ph10 = pH × 10 (0..140), so pH 7 is exactly 70 and no comparison depends on a float.
// Functions that take a ph10, layout id, sample id or indicator id throw a RangeError for anything outside their domain.
// deriveObservation() is the one exception: it reads records from outside (a save, a reducer action) and returns null
// for anything it cannot rebuild instead of throwing.

export const PH10_MIN = 0;
export const PH10_MAX = 140;
// The station's classification boundary. This is the 25 °C definition of a neutral solution (pH 7.00); it is not a
// property of any indicator. The neutral pH itself moves with temperature, so this model is only stated for 25 °C.
export const NEUTRAL_PH10 = 70;

export const KINDS = Object.freeze(['acidic', 'neutral', 'basic']);
export const SAMPLE_IDS = Object.freeze(['A', 'B', 'C']);
export const INDICATOR_IDS = Object.freeze(['blue-litmus', 'red-litmus', 'phenolphthalein']);

// One clear representative per kind, each far from every indicator range used here (litmus 70, phenolphthalein 82 and 100).
export const KIND_PH10 = Object.freeze({ acidic: 30, neutral: 70, basic: 110 });

// Which kind sits in which cup. v1 uses only layout 0; other layouts would be added here, never hard-coded elsewhere.
// A is not the lowest pH and C is not the highest, so the cup letters do not hint at a pH order.
export const LAYOUTS = Object.freeze([
  Object.freeze({ A: 'basic', B: 'acidic', C: 'neutral' }),
]);
export const DEFAULT_LAYOUT = 0;

// Presentation-neutral colour ids and the hex values the legacy lab uses for them.
export const COLOR_HEX = Object.freeze({
  red: '#d94949',
  blue: '#365fbd',
  colorless: '#f8fbfd',
  'light-pink': '#f6b6cf',
  pink: '#e54c91',
});

// Every result id an indicator can report, and the colour that result shows.
export const RESULT_COLOR = Object.freeze({
  'turns-red': 'red', 'stays-blue': 'blue',
  'turns-blue': 'blue', 'stays-red': 'red',
  colorless: 'colorless', 'light-pink': 'light-pink', pink: 'pink',
});

const START_COLOR = Object.freeze({ 'blue-litmus': 'blue', 'red-litmus': 'red', phenolphthalein: 'colorless' });

const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

export const isPh10 = (v) => Number.isInteger(v) && v >= PH10_MIN && v <= PH10_MAX;
export const isSampleId = (v) => typeof v === 'string' && SAMPLE_IDS.includes(v);
export const isIndicatorId = (v) => typeof v === 'string' && INDICATOR_IDS.includes(v);
export const isLayoutId = (v) => Number.isInteger(v) && v >= 0 && v < LAYOUTS.length;

function checkPh10(ph10) {
  if (!isPh10(ph10)) throw new RangeError(`ph10 must be an integer from ${PH10_MIN} to ${PH10_MAX}, got ${ph10}`);
  return ph10;
}
function checkIndicator(indicatorId) {
  if (!isIndicatorId(indicatorId)) throw new RangeError(`unknown indicator: ${indicatorId}`);
  return indicatorId;
}

/** The station's 25 °C classification: ph10 < 70 acidic, = 70 neutral, > 70 basic. Says nothing about any indicator. */
export function classifyPh10(ph10) {
  checkPh10(ph10);
  return ph10 < NEUTRAL_PH10 ? 'acidic' : ph10 === NEUTRAL_PH10 ? 'neutral' : 'basic';
}

/** Kind of liquid in one cup of one layout. */
export function sampleKind(layoutId, sampleId) {
  if (!isLayoutId(layoutId)) throw new RangeError(`unknown layout: ${layoutId}`);
  if (!isSampleId(sampleId)) throw new RangeError(`unknown sample: ${sampleId}`);
  return LAYOUTS[layoutId][sampleId];
}

/** Hidden ph10 of one cup of one layout. */
export const samplePh10 = (layoutId, sampleId) => KIND_PH10[sampleKind(layoutId, sampleId)];

/** The colour id an unused strip or a fresh drop shows before it meets the liquid. */
export const indicatorStartColor = (indicatorId) => START_COLOR[checkIndicator(indicatorId)];

/**
 * What one indicator shows at one ph10 → { result, color, changed }.
 *
 * Litmus: a teaching simplification. Real litmus has no single switch point; it changes gradually over a range of
 * roughly pH 4.5–8.3. This station splits litmus exactly at ph10 70 so that it matches the legacy lab and the junior-high
 * classification activity, and it only ever tests liquids far from that range (pH 3, 7, 11). Nothing built on this
 * function may claim that litmus changes colour at pH 7.
 *   blue litmus: ph10 < 70 turns-red, otherwise stays-blue
 *   red litmus:  ph10 > 70 turns-blue, otherwise stays-red
 *
 * Phenolphthalein (legacy ranges): ph10 < 82 colorless, 82–100 light-pink, > 100 pink.
 * Colourless covers acidic, neutral AND weakly basic liquids (ph10 71–81), so it never rules out a base.
 */
export function indicatorObservation({ indicatorId, ph10 } = {}) {
  checkIndicator(indicatorId);
  checkPh10(ph10);
  let result;
  if (indicatorId === 'blue-litmus') result = ph10 < NEUTRAL_PH10 ? 'turns-red' : 'stays-blue';
  else if (indicatorId === 'red-litmus') result = ph10 > NEUTRAL_PH10 ? 'turns-blue' : 'stays-red';
  else result = ph10 < 82 ? 'colorless' : ph10 <= 100 ? 'light-pink' : 'pink';
  const color = RESULT_COLOR[result];
  return { result, color, changed: color !== START_COLOR[indicatorId] };
}

/**
 * Everything one experiment record shows, rebuilt from the layout and the record's two source fields only.
 * Any other field on the record (a cached result, ph10, kind, colour, "correct" ...) is never read.
 * → { sampleId, indicatorId, ph10, kind, startColor, result, resultColor, changed } | null for an unusable record.
 */
export function deriveObservation({ layoutId, record } = {}) {
  if (!isLayoutId(layoutId) || record === null || typeof record !== 'object') return null;
  const sampleId = own(record, 'sampleId') ? record.sampleId : undefined;
  const indicatorId = own(record, 'indicatorId') ? record.indicatorId : undefined;
  if (!isSampleId(sampleId) || !isIndicatorId(indicatorId)) return null;
  const ph10 = samplePh10(layoutId, sampleId);
  const seen = indicatorObservation({ indicatorId, ph10 });
  return {
    sampleId, indicatorId, ph10, kind: classifyPh10(ph10),
    startColor: START_COLOR[indicatorId], result: seen.result, resultColor: seen.color, changed: seen.changed,
  };
}

/** One cup's results for a list of indicators, in that order (e.g. [blue, red] → ['turns-red', 'stays-red']). */
export function sampleResponseSignature({ layoutId, sampleId, indicators } = {}) {
  if (!Array.isArray(indicators)) throw new RangeError('indicators must be an array');
  const ph10 = samplePh10(layoutId, sampleId);
  return indicators.map((indicatorId) => indicatorObservation({ indicatorId, ph10 }).result);
}
