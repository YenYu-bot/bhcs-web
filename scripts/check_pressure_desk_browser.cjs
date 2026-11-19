'use strict';
// 水壓與氣壓實驗桌：g＝10、76 cm 水銀柱；桌機滑鼠與手機觸控各跑完整流程。
const {runDesk,assert}=require('./lab_desk_browser_harness.cjs');
runDesk('/tools/lab/pressure/',async t=>{
  assert.match(await t.kicker(),/任務 1/);
  assert.deepEqual(await t.readouts(),['101.3','76.0','真空']);
  await t.save();
  await t.tool();                       // 地點牌：上高山
  assert.deepEqual((await t.readouts()).slice(0,2),['80.0','60.0']);
  await t.noOverflow('air');
  await t.save(); await t.next();
  assert.match(await t.kicker(),/任務 2/);
  await t.save(); await t.btn(2);
  assert.deepEqual(await t.readouts(),['1','10.0','111.3']);
  await t.save(); await t.btn(4);
  assert.deepEqual(await t.readouts(),['2','20.0','121.3']);
  await t.noOverflow('water');
  await t.save(); await t.next();
  assert.match(await t.kicker(),/任務 3/);
  await t.save(); await t.btn(1); await t.save(); await t.btn(2);
  assert.deepEqual(await t.readouts(),['0.50','202.6','101.3']);
  await t.noOverflow('gas');
  await t.save(); await t.next();
  await t.quiz([1,1,0,2]);
  assert.match(await t.text('#finish-list'),/76 cm.*60 cm.*20 kPa.*202\.6 kPa/);
}).catch(e=>{console.error(e);process.exit(1);});
