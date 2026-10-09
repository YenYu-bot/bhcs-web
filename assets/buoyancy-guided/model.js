// Physics model for the guided buoyancy lab (Prototype Technical Spec v1.0 §3, §4).
// Pure functions over numbers and ids. It decides what is true and nothing else: it never rounds for display,
// never names anything for the learner and never remembers anything between calls.
// Densities are in g/cm³, masses in g, volumes in cm³.

export const DENSITY_EPSILON = 1e-9;

const lock = (o) => Object.freeze(o);

/** The single source of truth for every liquid density. The guided flow itself only opens water and brine. */
export const LIQUIDS = lock({
  oil: lock({ id: 'oil', density: 0.92 }),
  water: lock({ id: 'water', density: 1.0 }),
  brine: lock({ id: 'brine', density: 1.2 }),
});

/** The sealed test block: fixed outer volume, fixed shell, ballast added inside in whole steps. */
export const BLOCK = lock({ volumeCm3: 100, shellMassG: 40, ballastStepG: 20, slotsMin: 0, slotsMax: 6 });

/** Trial 3 objects. */
export const TRIAL3 = lock({
  wood: lock({ id: 'wood', massG: 300, volumeCm3: 500 }),
  stone: lock({ id: 'stone', massG: 120, volumeCm3: 40 }),
});

const isPositive = (x) => typeof x === 'number' && Number.isFinite(x) && x > 0;
const has = (table, key) => typeof key === 'string' && Object.hasOwn(table, key);

function fields(args, name) {
  if (args === null || typeof args !== 'object') throw new RangeError(`${name}: expected an object of named values`);
  return args;
}
function need(ok, message) {
  if (!ok) throw new RangeError(message);
}

/** Mass per unit volume. */
export function density(args) {
  const { massG, volumeCm3 } = fields(args, 'density');
  need(isPositive(massG), `density: massG must be a finite number above 0 (got ${massG})`);
  need(isPositive(volumeCm3), `density: volumeCm3 must be a finite number above 0 (got ${volumeCm3})`);
  return massG / volumeCm3;
}

/** Compares two densities with the shared tolerance. Never compare floating point densities with ===. */
export function relation(objectDensity, liquidDensity) {
  need(isPositive(objectDensity), `relation: objectDensity must be a finite number above 0 (got ${objectDensity})`);
  need(isPositive(liquidDensity), `relation: liquidDensity must be a finite number above 0 (got ${liquidDensity})`);
  const d = objectDensity - liquidDensity;
  if (d < -DENSITY_EPSILON) return 'lighter';
  if (d > DENSITY_EPSILON) return 'heavier';
  return 'equal';
}

/**
 * What happens to a solid object put into a liquid.
 *   lighter → 'float', raw immersionFraction = objectDensity / liquidDensity (strictly between 0 and 1)
 *   equal   → 'stay',  immersionFraction null
 *   heavier → 'sink',  immersionFraction null
 */
export function outcomeIn(args) {
  const { massG, volumeCm3, liquidDensity } = fields(args, 'outcomeIn');
  const objectDensity = density({ massG, volumeCm3 });
  const rel = relation(objectDensity, liquidDensity);
  const outcome = rel === 'lighter' ? 'float' : rel === 'equal' ? 'stay' : 'sink';
  return Object.freeze({
    objectDensity,
    liquidDensity,
    relation: rel,
    outcome,
    immersionFraction: rel === 'lighter' ? objectDensity / liquidDensity : null,
  });
}

/** Total mass of the test block with the given number of ballast slots filled. */
export function blockMassG(slots) {
  need(Number.isInteger(slots), `blockMassG: slots must be an integer (got ${slots})`);
  need(slots >= BLOCK.slotsMin && slots <= BLOCK.slotsMax, `blockMassG: slots must be ${BLOCK.slotsMin}–${BLOCK.slotsMax} (got ${slots})`);
  return BLOCK.shellMassG + BLOCK.ballastStepG * slots;
}

function liquidDensityOf(liquidId, name) {
  need(has(LIQUIDS, liquidId), `${name}: unknown liquidId ${String(liquidId)}`);
  return LIQUIDS[liquidId].density;
}

/** The test block with `slots` ballast slots filled, in the named liquid. */
export function blockOutcome(args) {
  const { slots, liquidId } = fields(args, 'blockOutcome');
  const massG = blockMassG(slots);
  const liquidDensity = liquidDensityOf(liquidId, 'blockOutcome');
  return Object.freeze({ massG, volumeCm3: BLOCK.volumeCm3, ...outcomeIn({ massG, volumeCm3: BLOCK.volumeCm3, liquidDensity }) });
}

/** A Trial 3 object (wood or stone) in the named liquid. */
export function objectOutcome(args) {
  const { objectId, liquidId } = fields(args, 'objectOutcome');
  need(has(TRIAL3, objectId), `objectOutcome: unknown objectId ${String(objectId)}`);
  const { massG, volumeCm3 } = TRIAL3[objectId];
  const liquidDensity = liquidDensityOf(liquidId, 'objectOutcome');
  return Object.freeze({ massG, volumeCm3, ...outcomeIn({ massG, volumeCm3, liquidDensity }) });
}
