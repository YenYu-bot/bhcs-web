// 新版彈簧與摩擦站的模型只把 g 由 9.8 換成 10；其他算式必須與 scripts/science/models.mjs 一致。
import assert from 'node:assert/strict';
import { calculate } from './science/models.mjs';
import { spring, friction, K, LIMIT_CM, MU, G } from '../tools/lab/spring-friction/model.mjs';
const close = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, `${m}: ${a} vs ${b}`);
const ratio = G / 9.8;
let n = 0;
for (const m of [0, 0.5, 1, 1.5, 1.6, 2]) {
  const old = calculate('spring-friction', { mode: 'spring', hang: m, k: K, limit: LIMIT_CM / 100 }), now = spring(m);
  close(now.F, old.F * ratio, 'F ' + m); close(now.x, old.x * 100 * ratio, 'x ' + m);
  // 同一個拉力下的超限判斷一致
  const same = calculate('spring-friction', { mode: 'spring', hang: m * ratio, k: K, limit: LIMIT_CM / 100 });
  assert.equal(now.over, same.kind === 'over', 'over ' + m); n++;
}
for (const mass of [2, 4]) for (const pull of [0, 1, 2, 5, 6, 7, 8, 12, 13]) {
  const now = friction({ massKg: mass, pull });
  const old = calculate('spring-friction', { mode: 'friction', surface: 'smooth', mass: mass * ratio, pull });
  close(now.N, old.N, 'N'); close(now.fs, old.fs, 'fs'); close(now.fk, old.fk, 'fk'); close(now.friction, old.friction, 'f');
  assert.equal(now.kind, old.kind, `kind ${mass} ${pull}`); n++;
}
assert.deepEqual([MU.static, MU.kinetic], calculate('spring-friction', { mode: 'friction', surface: 'smooth', mass: 1, pull: 0 }).mu);
const s = spring(0.5), f = friction({ pull: 6 });
assert.deepEqual([s.F, s.x, spring(1).x, spring(1.5).over, spring(2).over], [5, 10, 20, false, true]);
assert.deepEqual([f.N, f.fs, f.fk, f.kind, friction({ pull: 7 }).friction, friction({ massKg: 4, pull: 12 }).kind], [20, 6, 4, 'edge', 4, 'edge']);
console.log(`PASS spring-friction lab model matches models.mjs with g=10 (${n} cases)`);
