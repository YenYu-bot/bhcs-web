// 新版水壓與氣壓站：水壓只把 g 由 9.8 換成 10；針筒氣壓與 models.mjs 相同；氣壓計用 76 cmHg 定值。
import assert from 'node:assert/strict';
import { calculate } from './science/models.mjs';
import { water, gas, mercury, ATM } from '../tools/lab/pressure/model.mjs';
const close = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, `${m}: ${a} vs ${b}`);
let n = 0;
for (const depth of [0, 0.5, 1, 1.5, 2]) {
  const old = calculate('pressure-fluid', { mode: 'water', density: 1000, depth, volume: 1, speed: 1, ratio: 1 }), now = water(depth);
  close(now.relative, old.hydro / 1000 * 10 / 9.8, 'water ' + depth); close(now.absolute, ATM + old.hydro / 1000 * 10 / 9.8, 'abs ' + depth); n++;
}
for (const volume of [1, 0.75, 0.5]) {
  const old = calculate('pressure-fluid', { mode: 'gas', density: 1000, depth: 0, volume, speed: 1, ratio: 1 });
  close(gas(volume).absolute, old.absolute / 1000, 'gas ' + volume); n++;
}
assert.deepEqual([water(1).relative, water(2).relative, water(0).absolute], [10, 20, ATM]);
assert.deepEqual([mercury(ATM).height, mercury(80).height.toFixed(1), gas(0.5).absolute.toFixed(1), gas(0.75).absolute.toFixed(1)], [76, '60.0', '202.6', '135.1']);
// 原試用版以 13600 × 9.8 推算柱高；與 76 cmHg 定值相差不到 0.01 cm
for (const air of [80, 90, ATM, 110]) assert.ok(Math.abs(mercury(air).height - air * 100000 / (13600 * 9.8)) < 0.01, 'torricelli ' + air);
console.log(`PASS pressure lab model: water g=10, gas matches models.mjs, mercury 76 cmHg (${n} cases)`);
