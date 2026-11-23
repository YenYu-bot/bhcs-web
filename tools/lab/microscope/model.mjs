// 顯微鏡實驗桌模型：目鏡 10×；物鏡 4×、10×、40×。4× 物鏡時視野直徑 4 mm，一排約可看到 10 個細胞（洋蔥表皮細胞長約 0.4 mm）。
export const EYEPIECE = 10, VEC = { center: [0, 0], left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
// 調光（示意數值）：光圈大、中、小的通光量，以及各物鏡下到達眼睛的比例。40 到 80 之間最適合觀察。
export const APERTURE = { 1: 100, 3: 60, 5: 20 }, DIM = { 4: 1, 10: 0.8, 40: 0.5 };
export const KIND = {
  compound: { name: '複式顯微鏡', upright: false, solid: false, range: '40–400 倍', use: '薄而透光的標本，例如細胞' },
  stereo: { name: '解剖顯微鏡', upright: true, solid: true, range: '約 20–40 倍', use: '不透光的立體標本，例如昆蟲、花的構造' }
};
export const SPECIMEN = { onion: { name: '洋蔥鱗莖表皮', chloroplast: false }, elodea: { name: '水蘊草葉片', chloroplast: true } };
export function scope({ obj, slide, target, coarse = 2, fine = 1, aperture = 3, spec = 'onion', kind = 'compound' }) {
  if (![4, 10, 40].includes(obj) || !VEC[slide] || !VEC[target] || ![0, 1, 2, 3, 4].includes(coarse) || ![0, 1, 2].includes(fine) || !(aperture in APERTURE) || !SPECIMEN[spec] || !KIND[kind]) throw new RangeError('microscope settings');
  // 顯微鏡的像上下、左右都相反：玻片往右移，像往左跑
  const pos = [VEC[target][0] - VEC[slide][0], VEC[target][1] - VEC[slide][1]];
  // 對焦：粗調節輪一格 ＝ 細調節輪三格；最清楚的位置在粗 2、細 1
  const off = Math.abs((coarse - 2) * 3 + (fine - 1)), clarity = Math.max(10, 100 - 20 * off);
  const light = APERTURE[aperture] * DIM[obj];
  return { total: EYEPIECE * obj, field: 16 / obj, cells: 40 / obj, bright: obj === 4 ? '亮' : obj === 10 ? '普通' : '暗', pos, centered: pos[0] === 0 && pos[1] === 0, inView: Math.abs(pos[0]) <= 1 && Math.abs(pos[1]) <= 1,
    clarity, light, lightState: light > 80 ? '太亮' : light >= 40 ? '適中' : '太暗', K: KIND[kind], S: SPECIMEN[spec] };
}
