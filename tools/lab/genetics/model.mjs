// 遺傳實驗桌模型：豌豆莖的高矮，T（高莖）對 t（矮莖）是顯性。
// 抽樣用固定種子的亂數，所以同樣的設定每次結果相同，方便核對紀錄。
export const GENOTYPES = ['TT', 'Tt', 'tt'];
const norm = g => g === 'tT' ? 'Tt' : g;
function rng(seed) { let x = seed >>> 0; return () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296; }
export function cross({ p1, p2, n }) {
  if (!GENOTYPES.includes(p1) || !GENOTYPES.includes(p2) || !(n > 0)) throw new RangeError('genetics settings');
  const grid = [...p1].map(a => [...p2].map(b => norm(a + b)));
  const count = { TT: 0, Tt: 0, tt: 0 }; for (const row of grid) for (const g of row) count[g]++;
  const pTall = (count.TT + count.Tt) / 4, next = rng(20261199 + n * 7 + GENOTYPES.indexOf(p1) * 31 + GENOTYPES.indexOf(p2) * 131);
  let tall = 0; for (let i = 0; i < n; i++) if (next() < pTall) tall++;
  const gcd = (a, b) => b ? gcd(b, a % b) : a, red = list => { const g = list.reduce(gcd) || 1; return list.map(v => v / g).join('：'); };
  return { grid, count, pTall, expectTall: pTall * n, tall, short: n - tall, ratio: red([count.TT, count.Tt, count.tt]), look: pTall === 1 ? '全部高莖' : pTall === 0 ? '全部矮莖' : red([pTall * 4, 4 - pTall * 4]) };
}
