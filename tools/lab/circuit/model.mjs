// 電路實驗桌模型：每顆燈泡 5 Ω、每顆電池 1.5 V，導線與電池內電阻不計。
export const R = 5, CELL = 1.5;
const r3 = x => Math.round(x * 1000) / 1000;
export function circuit({ layout, cells, on }) {
  if (!['single', 'series', 'parallel'].includes(layout) || ![1, 2].includes(cells) || typeof on !== 'boolean') throw new RangeError('circuit settings');
  const V = CELL * cells, n = layout === 'single' ? 1 : 2;
  const Rt = layout === 'series' ? 2 * R : layout === 'parallel' ? R / 2 : R;
  const total = on ? V / Rt : 0, each = layout === 'parallel' ? total / 2 : total;
  return { V, n, Rt, total: r3(total), each: r3(each), vEach: r3(each * R), pEach: r3(each * each * R) };
}
