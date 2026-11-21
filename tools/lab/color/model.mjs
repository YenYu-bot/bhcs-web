// 色光與顏料實驗桌模型：色光相加、顏料吸收（相減）、物體顏色 ＝ 照到的光 ∩ 物體反射的光。
const NAME = { '000': '黑色', '100': '紅色', '010': '綠色', '001': '藍色', '110': '黃色', '011': '青色', '101': '洋紅色', '111': '白色' };
const HEX = { '000': '#16181D', '100': '#E8352B', '010': '#2EB24A', '001': '#2B55E8', '110': '#F5E02E', '011': '#2ED3E0', '101': '#E033C8', '111': '#FFFFFF' };
const key = v => v.map(x => x ? 1 : 0).join('');
const out = v => ({ rgb: v, name: NAME[key(v)], hex: HEX[key(v)] });
export const OBJECT = { apple: ['紅蘋果', [1, 0, 0]], leaf: ['綠葉', [0, 1, 0]], paper: ['白紙', [1, 1, 1]] };
export const LIGHT = { white: ['白光', [1, 1, 1]], red: ['紅光', [1, 0, 0]], green: ['綠光', [0, 1, 0]], blue: ['藍光', [0, 0, 1]] };
export function color({ r, g, b, c, m, y, object, light }) {
  if (!OBJECT[object] || !LIGHT[light] || [r, g, b, c, m, y].some(v => typeof v !== 'boolean')) throw new RangeError('color settings');
  const L = LIGHT[light][1], O = OBJECT[object][1];
  return { light: out([r, g, b]), pigment: out([!c, !m, !y]), seen: out(L.map((v, i) => v && O[i])) };
}
