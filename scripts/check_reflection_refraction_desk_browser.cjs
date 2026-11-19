'use strict';
// 光的反射與折射實驗桌：角度取自 models.mjs；桌機滑鼠與手機觸控各跑完整流程。
const {runDesk,assert}=require('./lab_desk_browser_harness.cjs');
runDesk('/tools/lab/reflection-refraction/',async t=>{
  assert.match(await t.kicker(),/任務 1/);
  assert.deepEqual(await t.readouts(),['—','—','—']);
  await t.tool();                       // 點雷射筆開燈
  assert.deepEqual(await t.readouts(),['20°','20°','—']);
  await t.save(); await t.btn(1);
  assert.deepEqual(await t.readouts(),['40°','40°','—']);
  await t.noOverflow('mirror');
  await t.save(); await t.next();
  await t.btn(0); await t.save(); await t.btn(1);
  assert.deepEqual(await t.readouts(),['30°','30°','19.5°']);
  await t.save(); await t.next();
  await t.btn(0);
  assert.deepEqual(await t.readouts(),['30°','30°','22.1°']);
  await t.save(); await t.next();
  await t.btn(0);
  assert.deepEqual(await t.readouts(),['30°','30°','48.6°']);
  await t.noOverflow('out');
  await t.save(); await t.next();
  await t.btn(1);
  assert.deepEqual(await t.readouts(),['41.8°','41.8°','90°']);
  await t.save(); await t.btn(2);
  assert.deepEqual(await t.readouts(),['45°','45°','沒有']);
  await t.noOverflow('tir');
  await t.save(); await t.next();
  await t.quiz([1,2,0]);
  assert.match(await t.text('#finish-list'),/41\.8°/);
}).catch(e=>{console.error(e);process.exit(1);});
