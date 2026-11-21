// 波的疊加與駐波實驗桌模型。
// 行進波：y ＝ A·sin 2π(x/λ − t/T)。弦長 120 cm、波速 12 m/s 的弦，兩端固定時波長 ＝ 2 × 弦長 ÷ 波腹數。
export const AMP = 2, LENGTH = 120, SPEED = 12;
const r3 = x => Math.round(x * 1000) / 1000;
export function wave({ phase, end, a2, meet, mode }) {
  if (![0, 1, 2, 3].includes(phase) || !['fixed', 'free'].includes(end) || ![2, -2].includes(a2) || !['before', 'overlap', 'after'].includes(meet) || ![1, 2, 3].includes(mode)) throw new RangeError('wave settings');
  // 質點在 x ＝ 3λ/4 的位置，只會上下動
  const particle = r3(AMP * Math.sin(2 * Math.PI * (0.75 - phase / 4)));
  const lambda = 2 * LENGTH / mode;
  return {
    particle, crestShift: phase / 4,
    reflected: end === 'fixed' ? -1 : 1,
    sum: meet === 'overlap' ? AMP + a2 : null, a1: AMP,
    lambda, nodes: mode + 1, antinodes: mode, freq: SPEED / (lambda / 100)
  };
}
