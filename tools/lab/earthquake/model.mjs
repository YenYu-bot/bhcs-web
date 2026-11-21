// 板塊與地震實驗桌模型。波速用簡化的整數：P 波 6 km/s、S 波 3 km/s。
export const VP = 6, VS = 3;
export const BOUNDARY = {
  divergent: { name: '張裂性邊界', move: '兩個板塊互相分離', feature: '中洋脊、裂谷', depth: '淺源地震', volcano: true },
  convergent: { name: '聚合性邊界', move: '兩個板塊互相推擠', feature: '海溝、高山、火山島弧', depth: '淺源到深源都有', volcano: true },
  transform: { name: '錯動性邊界', move: '兩個板塊水平錯開', feature: '轉形斷層', depth: '淺源地震', volcano: false }
};
// 三個測站與震央的位置（地圖座標，1 單位 ＝ 1 km）
export const EPIC = [300, 200], STATIONS = [['甲', [150, 120]], ['乙', [420, 80]], ['丙', [330, 380]]];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export function quake({ boundary, dist: d, stations }) {
  if (!BOUNDARY[boundary] || !(d > 0) || ![1, 2, 3].includes(stations)) throw new RangeError('earthquake settings');
  const tp = d / VP, ts = d / VS;
  const radii = STATIONS.map(([, p]) => dist(p, EPIC));
  // 兩個圓的另一個交點：震央對兩站連線的鏡射點
  const [a, b] = [STATIONS[0][1], STATIONS[1][1]], ux = b[0] - a[0], uy = b[1] - a[1], t = ((EPIC[0] - a[0]) * ux + (EPIC[1] - a[1]) * uy) / (ux * ux + uy * uy);
  const foot = [a[0] + t * ux, a[1] + t * uy], mirror = [2 * foot[0] - EPIC[0], 2 * foot[1] - EPIC[1]];
  return { B: BOUNDARY[boundary], tp, ts, lag: ts - tp, radii, mirror, possible: stations === 1 ? '圓上任何一點' : stations === 2 ? '兩個交點之一' : '唯一的交點' };
}
