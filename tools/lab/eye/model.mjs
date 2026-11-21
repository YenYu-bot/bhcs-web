// 眼睛與視力矯正實驗桌模型（示意用的長度單位：mm）。
// 眼球長度：正常 24、近視 26（太長）、遠視 22（太短）。不戴眼鏡時，這個情境下成像在距角膜 24 的位置。
// 凹透鏡讓光線發散，像往後移 2；凸透鏡讓光線會聚，像往前移 2。
export const LENGTH = { normal: 24, myopia: 26, hyperopia: 22 }, SHIFT = { none: 0, concave: 2, convex: -2 };
export function eye({ type, dist, lens }) {
  if (!(type in LENGTH) || !(lens in SHIFT) || !['far', 'near'].includes(dist)) throw new RangeError('eye settings');
  const length = LENGTH[type], focus = 24 + SHIFT[lens], off = focus - length;
  return { length, focus, off, where: off < 0 ? 'front' : off > 0 ? 'behind' : 'on', clear: off === 0, lensShape: dist === 'near' ? '變厚' : '變薄' };
}
