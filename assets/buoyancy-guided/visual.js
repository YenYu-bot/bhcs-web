// Visual parameters for the guided buoyancy bench (Prototype Technical Spec v1.0 §8).
// A pure function of what the engine already decided. It reads the view's facts (outcome, raw immersion fraction) and
// controls, and turns them into positions in one fixed viewBox. It never judges: no float/stay/sink decision, no density,
// no mass. Sizes use the one visual scale at the bottom of this list; everything else is geometry.

export const VIEW_W = 750;
export const VIEW_H = 420;

/** The tank. Wall thickness 6; the water surface and the floor are fixed lines (the level does not rise: a known model limit). */
export const TANK = Object.freeze({ x: 300, y: 60, w: 360, h: 290, wall: 6, waterY: 130, floorY: 344 });
export const TANK_CX = TANK.x + TANK.w / 2;
export const TABLE_Y = TANK.floorY;                       // objects on the table stand on the same line as the tank floor
export const TABLE_X = Object.freeze({ block: 80, wood: 80, stone: 225 });   // centres; wood and block never share a phase
export const STAY_CLEAR_TOP = 12;                         // a staying object is at least this far under the surface
export const STAY_CLEAR_FLOOR = 24;                       // ...and at least this far above the floor
export const BLOCK_PX = 70;
export const OBJECT_IDS = Object.freeze(['block', 'wood', 'stone']);

/** Visual scale only: the edge of the square drawn for an object of this volume, from the 70 px block of 100 units. */
export const sizeForVolume = (volume) => BLOCK_PX * Math.cbrt(volume / 100);

const SLOT_COLS = 2, SLOT_ROWS = 3, SLOT_PAD = 10, SLOT_GAP = 4;
/** Six ballast cells inside the block, in the block's own coordinates. The block's outline never depends on how many are filled. */
export function ballastCells(filled) {
  const w = (BLOCK_PX - 2 * SLOT_PAD - SLOT_GAP * (SLOT_COLS - 1)) / SLOT_COLS;
  const h = (BLOCK_PX - 2 * SLOT_PAD - SLOT_GAP * (SLOT_ROWS - 1)) / SLOT_ROWS;
  const cells = [];
  for (let i = 0; i < SLOT_COLS * SLOT_ROWS; i++) {
    const col = i % SLOT_COLS, row = SLOT_ROWS - 1 - Math.floor(i / SLOT_COLS);   // fill from the bottom up
    cells.push({ i, dx: SLOT_PAD + col * (w + SLOT_GAP), dy: SLOT_PAD + row * (h + SLOT_GAP), w, h, filled: i < filled });
  }
  return cells;
}

/**
 * Which objects are on the bench. `controls.objects[id].available` means "can be touched now", which is narrower than
 * "is on the bench": at the mission nothing can be touched yet, and once Trial 3 is observed everything is locked
 * but the two objects are still there to look at.
 */
const ON_BENCH_BEFORE_ANY_CONTROL = Object.freeze({ mission: ['block'] });
const isShown = (view, id) => view.controls.objects[id].available || view.controls.objects[id].where === 'tank'
  || (ON_BENCH_BEFORE_ANY_CONTROL[view.phase] ?? []).includes(id) || (id !== 'block' && view.trial3.tried[id] === true);

const volumeOf = (view, id) => (id === 'block' ? view.facts.currentBlock.volumeCm3 : view.facts.shelf[id].volumeCm3);
const outcomeFactsOf = (view, id) => (id === 'block' ? view.facts.currentBlock : view.facts[id]);

/** Where an object stands. `outcome` and `immersionFraction` come from the engine's facts; this only places them. */
export function poseFor({ id, size, where, outcome = null, immersionFraction = null }) {
  const { waterY, floorY } = TANK;
  if (where === 'table') {
    return { x: TABLE_X[id] - size / 2, y: TABLE_Y - size, outcome: null, immersionFraction: null, waterlineY: null, contact: false };
  }
  const x = TANK_CX - size / 2;
  if (outcome === 'float') {
    if (!(immersionFraction > 0 && immersionFraction < 1)) throw new RangeError(`poseFor: a floating object needs a fraction between 0 and 1 (got ${immersionFraction})`);
    return { x, y: waterY - size * (1 - immersionFraction), outcome, immersionFraction, waterlineY: waterY, contact: false };
  }
  if (outcome === 'stay') {
    const lo = waterY + STAY_CLEAR_TOP, hi = floorY - STAY_CLEAR_FLOOR - size;      // top may range lo…hi
    return { x, y: hi >= lo ? (lo + hi) / 2 : lo, outcome, immersionFraction: null, waterlineY: null, contact: false };
  }
  if (outcome === 'sink') return { x, y: floorY - size, outcome, immersionFraction: null, waterlineY: null, contact: true };
  throw new RangeError(`poseFor: an object in the tank needs an outcome (got ${outcome})`);
}

/**
 * visualParams(view) → everything the renderer draws, in viewBox units.
 * `view` is the engine's deriveView(). Nothing here is stored or sent anywhere.
 */
export function visualParams(view) {
  const objects = {};
  for (const id of OBJECT_IDS) {
    const c = view.controls.objects[id];
    const size = sizeForVolume(volumeOf(view, id));
    const where = c.where;
    const facts = where === 'tank' ? outcomeFactsOf(view, id) : null;
    if (where === 'tank' && !facts) throw new RangeError(`visualParams: ${id} is in the tank but the view holds no facts for it`);
    const pose = poseFor({ id, size, where, outcome: facts?.outcome ?? null, immersionFraction: facts?.immersionFraction ?? null });
    const local = pose.waterlineY === null ? null : pose.waterlineY - pose.y;      // where the surface cuts the object, in its own coordinates
    objects[id] = {
      id,
      visible: isShown(view, id),
      where,
      x: pose.x, y: pose.y, w: size, h: size,
      outcome: pose.outcome,
      immersionFraction: pose.immersionFraction,
      waterlineY: pose.waterlineY,
      waterlineLocalY: local,
      submerged: pose.outcome === 'float' ? { y: local, h: size - local } : pose.outcome === 'stay' || pose.outcome === 'sink' ? { y: 0, h: size } : null,
      contact: pose.contact,
      operable: where === 'table' ? c.putIn : c.takeOut,
      hit: { cx: pose.x + size / 2, cy: pose.y + size / 2, w: size, h: size },        // the renderer widens this to the touch minimum, keeping the centre
    };
  }
  return {
    width: VIEW_W,
    height: VIEW_H,
    tank: { x: TANK.x, y: TANK.y, w: TANK.w, h: TANK.h, wall: TANK.wall, waterY: TANK.waterY, bottomY: TANK.floorY, cx: TANK_CX },
    table: { y: TABLE_Y, w: TANK.x - 18 },
    liquid: { id: view.liquidId, surfaceY: TANK.waterY },
    objects,
    ballast: { visible: objects.block.visible, filled: view.slots, cells: ballastCells(view.slots) },
  };
}
