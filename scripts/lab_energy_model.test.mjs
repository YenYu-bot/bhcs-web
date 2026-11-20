// 新版能量轉換站：算式必須與 scripts/science/models.mjs 的 energy 一致，只把 g 由 9.8 換成 10。
import assert from 'node:assert/strict';
import { calculate } from './science/models.mjs';
import { energy, G } from '../tools/lab/energy/model.mjs';
const close = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, `${m}: ${a} vs ${b}`);
let n = 0;
for (const mass of [0.5, 1, 2, 3]) for (const height of [1, 2, 3]) for (const progress of [0, 25, 50, 100]) for (const loss of [0, 25, 30, 100]) {
  const now = energy({ mass, height, progress, loss }), old = calculate('energy', { mass, height, progress, loss }), k = G / 9.8;
  for (const q of ['total', 'potential', 'kinetic', 'thermal']) close(now[q], old[q] * k, q);
  close(now.speed, old.speed * Math.sqrt(k), 'speed'); close(now.potential + now.kinetic + now.thermal, now.total, 'conservation'); n++;
}
const t = p => energy({ mass: 1, height: 2, progress: p, loss: 0 });
assert.deepEqual([t(0).potential, t(50).kinetic, t(100).kinetic], [20, 10, 20]);
assert.deepEqual([energy({ mass: 1, height: 2, progress: 100, loss: 30 }).kinetic, energy({ mass: 1, height: 2, progress: 100, loss: 30 }).thermal].map(x => Math.round(x * 1e9) / 1e9), [14, 6]);
assert.equal(Math.round(energy({ mass: 2, height: 2, progress: 100, loss: 0 }).speed * 100), Math.round(t(100).speed * 100));
console.log(`PASS energy lab model matches models.mjs with g=10 (${n} cases)`);
