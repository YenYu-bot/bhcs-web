// 化學反應式平衡實驗桌模型：數兩邊每種原子的個數。
export const RX = {
  water: { name: '氫氣燃燒', left: [['H₂', { H: 2 }], ['O₂', { O: 2 }]], right: [['H₂O', { H: 2, O: 1 }]], answer: [2, 1, 2] },
  ammonia: { name: '合成氨', left: [['N₂', { N: 2 }], ['H₂', { H: 2 }]], right: [['NH₃', { N: 1, H: 3 }]], answer: [1, 3, 2] },
  methane: { name: '甲烷燃燒', left: [['CH₄', { C: 1, H: 4 }], ['O₂', { O: 2 }]], right: [['CO₂', { C: 1, O: 2 }], ['H₂O', { H: 2, O: 1 }]], answer: [1, 2, 1, 2] }
};
export function balance({ rx, a, b, c, d }) {
  const R = RX[rx]; if (!R) throw new RangeError('reaction');
  const coef = [a, b, c, d]; if (!coef.every(n => Number.isInteger(n) && n >= 1 && n <= 6)) throw new RangeError('coefficient');
  const count = (side, off) => { const o = {}; side.forEach(([, atoms], i) => { for (const k in atoms) o[k] = (o[k] || 0) + atoms[k] * coef[off + i]; }); return o; };
  const L = count(R.left, 0), Rt = count(R.right, R.left.length), elements = Object.keys(L);
  const used = coef.slice(0, R.left.length + R.right.length);
  const balanced = elements.every(k => L[k] === Rt[k]);
  return { R, coef: used, left: L, right: Rt, elements, balanced, simplest: balanced && used.every((n, i) => n === R.answer[i]) };
}
