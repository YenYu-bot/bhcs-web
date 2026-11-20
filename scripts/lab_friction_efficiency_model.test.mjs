// 新版摩擦與機械效率站：光滑、粗糙坡面必須與舊版 tools/friction-efficiency-desk/model.mjs 逐公分一致；砂紙坡面另驗教學數值。
import assert from 'node:assert/strict';
import { derive as oldDerive, PARAMETERS } from '../tools/friction-efficiency-desk/model.mjs';
import { derive, WEIGHT_N, LENGTH_CM, HEIGHT_CM, SURFACES } from '../tools/lab/friction-efficiency/model.mjs';
assert.deepEqual([WEIGHT_N, LENGTH_CM, HEIGHT_CM], [PARAMETERS.weightN, PARAMETERS.lengthCm, PARAMETERS.heightCm]);
let n = 0;
for (const id of ['ideal', 'rough']) for (let s = 0; s <= 100; s++) {
  const a = oldDerive(id, s), b = derive(id, s);
  assert.equal(b.force, a.forceN, `force ${id} ${s}`);
  assert.equal(b.friction, a.frictionN, `friction ${id} ${s}`);
  assert.equal(b.normal, a.normalN, `normal ${id} ${s}`);
  assert.equal(b.h, a.hCm, `h ${id} ${s}`);
  assert.equal(Math.round(b.input * 100), a.inputCentiJ, `input ${id} ${s}`);
  assert.equal(Math.round(b.useful * 100), a.usefulCentiJ, `useful ${id} ${s}`);
  assert.equal(Math.round(b.heat * 100), a.internalCentiJ, `heat ${id} ${s}`);
  assert.equal(b.efficiency, a.efficiencyPercent, `efficiency ${id} ${s}`);
  n++;
}
for (const id of Object.keys(SURFACES)) for (let s = 0; s <= 100; s++) {
  const d = derive(id, s);
  assert.ok(Math.abs(d.input - d.useful - d.heat) < 1e-9, `能量守恆 ${id} ${s}`);
}
const top = id => derive(id, 100);
assert.deepEqual(['ideal', 'rough', 'sand'].map(id => [top(id).force, top(id).friction, top(id).input, top(id).useful, top(id).heat, top(id).efficiency]),
  [[6, 0, 6, 6, 0, 100], [8, 2, 8, 6, 2, 75], [10, 4, 10, 6, 4, 60]]);
assert.throws(() => derive('ice', 0)); assert.throws(() => derive('ideal', 101)); assert.throws(() => derive('ideal', 1.5));
console.log(`PASS friction-efficiency lab model matches the original desk (${n} cases) and conserves energy`);
