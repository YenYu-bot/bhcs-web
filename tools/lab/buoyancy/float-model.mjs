// 密封盒浮沉模型：液體密度取自 tools/buoyancy-lab/model.mjs 的 FLUIDS（kg/m³ → g/cm³）。
// 盒子外體積 100 cm³、盒身 40 g、每個砝碼 20 g、可放 0–6 個。
import { FLUIDS } from '../../buoyancy-lab/model.mjs';

const EPS = 1e-9;
export const BLOCK = Object.freeze({ volumeCm3: 100, shellMassG: 40, ballastStepG: 20, slotsMin: 0, slotsMax: 6 });
export const LIQUIDS = Object.freeze(Object.fromEntries(Object.entries(FLUIDS).map(([id, f]) => [id, Object.freeze({ id, density: f.density / 1000 })])));

export function blockMassG(slots) {
  if (!Number.isInteger(slots) || slots < BLOCK.slotsMin || slots > BLOCK.slotsMax) throw RangeError('slots 0–6');
  return BLOCK.shellMassG + BLOCK.ballastStepG * slots;
}

/** float：浮在液面（immersionFraction＝物體密度÷液體密度）；stay：懸浮；sink：沉到底。 */
export function blockOutcome({ slots, liquidId }) {
  const liquid = LIQUIDS[liquidId];
  if (!liquid) throw RangeError('unknown liquid');
  const massG = blockMassG(slots), d = massG / BLOCK.volumeCm3, diff = d - liquid.density;
  const outcome = Math.abs(diff) <= EPS ? 'stay' : diff < 0 ? 'float' : 'sink';
  return Object.freeze({ massG, volumeCm3: BLOCK.volumeCm3, outcome, immersionFraction: outcome === 'float' ? d / liquid.density : null });
}
