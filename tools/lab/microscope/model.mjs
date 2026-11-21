// 顯微鏡實驗桌模型：目鏡 10×；物鏡 4×、10×、40×。4× 物鏡時視野直徑 4 mm，一排約可看到 40 個細胞。
export const EYEPIECE = 10, VEC = { center: [0, 0], left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
export function scope({ obj, slide, target }) {
  if (![4, 10, 40].includes(obj) || !VEC[slide] || !VEC[target]) throw new RangeError('microscope settings');
  // 顯微鏡的像上下、左右都相反：玻片往右移，像往左跑
  const pos = [VEC[target][0] - VEC[slide][0], VEC[target][1] - VEC[slide][1]];
  return { total: EYEPIECE * obj, field: 16 / obj, cells: 160 / obj, bright: obj === 4 ? '亮' : obj === 10 ? '普通' : '暗', pos, centered: pos[0] === 0 && pos[1] === 0, inView: Math.abs(pos[0]) <= 1 && Math.abs(pos[1]) <= 1 };
}
