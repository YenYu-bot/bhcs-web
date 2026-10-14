// Geometry model for the guided microscope lab (Pilot #3, B1). Pure functions: no DOM, no state.
// Every other layer reads positions, fields of view and keyboard steps from here and never recomputes them.
//
// COORDINATE CONVENTIONS (frozen; every formula below is derived from these four definitions):
//   stage     {x, y}  slide position the learner sets.   x: RIGHT positive.  y: UP positive.
//                     Increasing x means the slide physically moves right; increasing y means it moves up.
//   specimen  {wx,wy} feature position on the slide, in world units (wu).  wx: RIGHT positive.  wy: UP positive.
//   screen    {x, y}  position in the eyepiece view, in px.  x: RIGHT positive.  y: DOWN positive (canvas).
//   inversion         a microscope image is rotated 180°, so slide motion and image motion are opposite on both axes.
//
// Derived (z = objective / 4, G = STAGE_GAIN, c = VIEW_CENTER):
//   screen.x = c.x - z * (wx + G * stage.x)      slide right  -> image left;  slide left  -> image right
//   screen.y = c.y + z * (wy + G * stage.y)      slide up     -> image down;  slide down  -> image up
//
// Legacy cross-check (tools/microscope-lab.html, read-only): legacy writes screen.y = 300 - z*(wyL - G*sy) with a
// canvas-down specimen y, i.e. wyL = -wy. Image motion, inversion and every number below are identical to the legacy
// lab; only the sign convention of the specimen's y label differs.

export const WORLD_DIAMETER_4X = 540;   // wu across the field of view at 4×
export const FOV_MM_AT_4X = 4.5;        // mm across the field of view at 4×
export const FIELD_NUMBER_MM = 18;      // this simulated microscope's setting (field of view = FN / objective)
export const BASE_OBJECTIVE = 4;
export const OBJECTIVES = Object.freeze([4, 10, 40]);
export const STAGE_GAIN = 1.6;          // world units of specimen shift per stage unit
export const VIEW_RADIUS_PX = 270;      // radius of the circular field of view on screen
export const VIEW_CENTER = Object.freeze({ x: 300, y: 300 });
export const STAGE_MIN = -150;
export const STAGE_MAX = 150;

// Keyboard: Arrow moves the image by this fraction of the field-of-view diameter; Shift+Arrow by a quarter of it.
export const KEY_FRACTION = 0.10;
export const KEY_FRACTION_FINE = KEY_FRACTION / 4;

// Teaching content. The marker radius is chosen so that a marker centred at 40× (z = 10) still lies completely
// inside the 270 px field (20 wu x 10 = 200 px); a larger marker would fill the whole field and read as "no field".
export const MARKER_RADIUS_WU = 20;
export const LETTER_E = Object.freeze({ id: 'e', wx: 0, wy: 0, radius: MARKER_RADIUS_WU });
export const TEACHING_FEATURES = Object.freeze([
  Object.freeze({ id: 'A', wx: -120, wy: 0, radius: MARKER_RADIUS_WU }),
  Object.freeze({ id: 'B', wx: 0, wy: 0, radius: MARKER_RADIUS_WU }),
  Object.freeze({ id: 'C', wx: 120, wy: 0, radius: MARKER_RADIUS_WU }),
]);

const finite = (name, x) => {
  if (typeof x !== 'number' || !Number.isFinite(x)) throw new RangeError(`${name} must be a finite number`);
  return x;
};
const checkObjective = (objective) => {
  if (!OBJECTIVES.includes(objective)) throw new RangeError(`objective must be one of ${OBJECTIVES.join(', ')}`);
  return objective;
};

/** z = objective / 4: how many times larger than at 4× things appear on screen. */
export const objectiveScale = (objective) => checkObjective(objective) / BASE_OBJECTIVE;

/** Field-of-view diameter in mm: FN / objective (4.5, 1.8, 0.45). */
export const fieldDiameterMm = (objective) => FIELD_NUMBER_MM / checkObjective(objective);

/** Radius of the field of view measured on the slide, in world units. */
export const fieldRadiusWorld = (objective) => VIEW_RADIUS_PX / objectiveScale(objective);

const clampAxis = (v) => Math.min(STAGE_MAX, Math.max(STAGE_MIN, finite('stage', v)));
export const clampStagePosition = ({ x, y }) => ({ x: clampAxis(x), y: clampAxis(y) });

/** Where a slide feature appears in the eyepiece view. */
export function specimenToScreen({ feature, stage, objective }) {
  const z = objectiveScale(objective);
  return {
    x: VIEW_CENTER.x - z * (finite('wx', feature.wx) + STAGE_GAIN * finite('stage.x', stage.x)),
    y: VIEW_CENTER.y + z * (finite('wy', feature.wy) + STAGE_GAIN * finite('stage.y', stage.y)),
  };
}

/** How far the image moves on screen when the stage moves by (dx, dy). Slide right -> image left, slide up -> image down. */
export function screenDisplacementForStageDelta({ dx, dy, objective }) {
  const k = objectiveScale(objective) * STAGE_GAIN;
  return { x: -k * finite('dx', dx), y: k * finite('dy', dy) };
}

/** Distance of the feature's image from the centre of the view, in px. */
export function distanceFromCenter({ feature, stage, objective }) {
  const p = specimenToScreen({ feature, stage, objective });
  return Math.hypot(p.x - VIEW_CENTER.x, p.y - VIEW_CENTER.y);
}

/**
 * A feature is visible when its marker circle overlaps the circular field of view:
 *   distance(centre, view centre) <= VIEW_RADIUS_PX + radius * z      (radius defaults to 0)
 * A marker that only partly enters the field is therefore visible; it does not vanish when its centre crosses the rim.
 *
 * RENDERER CONTRACT (B2): clip everything to the circular field and draw only the part of a partly-entered marker that
 * lies inside the circle. Never hide a marker just because its centre is outside the field.
 */
export const isFeatureVisible = ({ feature, stage, objective }) =>
  distanceFromCenter({ feature, stage, objective }) <= VIEW_RADIUS_PX + (feature.radius ?? 0) * objectiveScale(objective) + 1e-9;

/** True only when the whole marker (centre plus radius scaled by z) lies inside the field. Stricter than visible. */
export const isFeatureFullyInside = ({ feature, stage, objective }) =>
  distanceFromCenter({ feature, stage, objective }) + (feature.radius ?? 0) * objectiveScale(objective) <= VIEW_RADIUS_PX + 1e-9;

export const visibleFeatures = ({ features, stage, objective }) =>
  features.filter((feature) => isFeatureVisible({ feature, stage, objective }));

const DIRECTIONS = Object.freeze({ left: [-1, 0], right: [1, 0], up: [0, 1], down: [0, -1] });
/**
 * Stage delta for one key press. `direction` is where the SLIDE moves (Arrow semantics: the slide moves that way),
 * so the image moves the opposite way by `fraction` of the field-of-view diameter on screen.
 */
export function stageDeltaForScreenFraction({ direction, objective, fraction }) {
  const d = DIRECTIONS[direction];
  if (!d) throw new RangeError('direction must be left, right, up or down');
  const screenPx = finite('fraction', fraction) * 2 * VIEW_RADIUS_PX;
  const stageUnits = screenPx / (objectiveScale(objective) * STAGE_GAIN);
  return { dx: d[0] * stageUnits, dy: d[1] * stageUnits };
}
