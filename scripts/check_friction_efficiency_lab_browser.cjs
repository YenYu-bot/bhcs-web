'use strict';
// 摩擦與機械效率實驗桌：光滑 6 N／粗糙 8 N／砂紙 10 N，能量帳與機械效率；桌機滑鼠拖把手、手機觸控按鈕各跑完整流程。
const {runDesk,assert}=require('./lab_desk_browser_harness.cjs');
const reads=t=>Promise.all(['#r-force','#r-rope','#r-height'].map(s=>t.p.textContent(s).then(x=>x.trim())));
async function toTop(t){
  if(!t.mobile){
    // 用滑鼠沿斜面拖把手到底
    const h=await t.p.locator('#rig .handle circle').nth(1).boundingBox();
    const x=h.x+h.width/2,y=h.y+h.height/2;
    await t.p.mouse.move(x,y);await t.p.mouse.down();
    for(let i=1;i<=12;i++)await t.p.mouse.move(x+i*40,y-i*30);
    await t.p.mouse.up();await t.wait(200);
  }else{
    for(let i=0;i<2;i++){await t.p.tap('#pull-5');await t.wait(150);}
  }
}
async function fill(t,vals){
  const ins=t.p.locator('#calc-rows input');
  for(let i=0;i<vals.length;i++)await ins.nth(i).fill(String(vals[i]));
  await t.p.click('#check');await t.wait(200);
}
runDesk('/tools/lab/friction-efficiency/',async t=>{
  assert.match(await t.kicker(),/任務 1/);
  assert.deepEqual(await reads(t),['6','0','0']);
  await toTop(t);
  assert.deepEqual(await reads(t),['6','100','60']);
  assert.match(await t.p.textContent('#rig'),/機械效率 100%/);
  await t.noOverflow('ideal');
  await t.save(); await t.next();
  assert.match(await t.kicker(),/任務 2/);
  await t.p.click('#pull-1'); await t.wait(120);
  assert.deepEqual(await reads(t),['8','10','6']);
  assert.match(await t.p.textContent('#rig'),/摩擦力 2 N/);
  await toTop(t);
  assert.match(await t.p.textContent('#rig'),/6 J ＋ 2 J.*機械效率 75%|機械效率 75%/);
  await t.save(); await t.next();
  // 算一算功：先故意用錯距離，看提示
  assert.match(await t.kicker(),/任務 3/);
  await fill(t,[6,6.4,6]);
  assert.match(await t.text('#bubble'),/沿坡的 100 cm/);
  await fill(t,[6,8,6]);
  await t.next();
  assert.match(await t.kicker(),/任務 4/);
  await fill(t,[2,100,0.75]);
  assert.match(await t.text('#bubble'),/乘 100%/);
  await fill(t,[2,100,75]);
  await t.next();
  // 砂紙：沒猜不能拉
  assert.match(await t.kicker(),/任務 5/);
  assert.ok(await t.p.locator('#pull-1').isDisabled());
  await t.p.click('[data-guess="down"]'); await t.wait(120);
  await t.noOverflow('sand');
  await toTop(t);
  assert.deepEqual(await reads(t),['10','100','60']);
  assert.match(await t.p.textContent('#rig'),/機械效率 60%/);
  await t.save();
  assert.match(await t.text('#bubble'),/猜對了/);
  await t.next();
  await t.quiz([0,1,1,2,2,0]);
  assert.match(await t.text('#finish-list'),/光滑坡面.*100%.*粗糙坡面.*75%.*砂紙坡面.*60%/);
}).catch(e=>{console.error(e);process.exit(1);});
