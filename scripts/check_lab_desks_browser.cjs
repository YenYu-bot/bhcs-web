'use strict';
// 用 tools/lab/shared/desk.mjs 引擎做的實驗桌：桌機（滑鼠）與手機（觸控）各跑完整流程。
// 觀察步驟逐一嘗試控制列的組合，畫面提示「收下」時就收下；收齊後才算完成。再填算一算、答說說看，最後要看到完成對話框。
const {runDesk,assert}=require('./lab_desk_browser_harness.cjs');
const DESKS={
 'wave-sound':{calc:{calc:[0.4,85,255]},quiz:[1,1,1]},
 energy:{calc:{calc:[60,60,45]},quiz:[1,1,1]},
 electromagnetism:{quiz:[1,1,1]},
 electrostatics:{quiz:[1,1,1]},
};
async function observe(t){
 const p=t.p,groups=await p.locator('#controls .ctl').count(),sizes=[];
 for(let g=0;g<groups;g++){const n=await p.locator('#controls .ctl').nth(g).locator('button').count();sizes.push(await p.locator('#controls .ctl').nth(g).locator('.seg').count()?n:0);}
 const combos=sizes.reduce((acc,n)=>n?acc.flatMap(a=>Array.from({length:n},(_,i)=>[...a,i])):acc.map(a=>[...a,null]),[[]]);
 for(let pass=0;pass<2;pass++)for(const combo of combos){
  if(await p.locator('#task-go').isVisible())return;
  for(let g=0;g<combo.length;g++)if(combo[g]!==null){const b=p.locator('#controls .ctl').nth(g).locator('button').nth(combo[g]);if(await b.isEnabled()&&await b.getAttribute('aria-pressed')!=='true'){if(t.mobile)await b.tap();else await b.click();await t.wait(60);}}
  if(await p.locator('#save.cue').count()){if(t.mobile)await p.tap('#save');else await p.click('#save');await t.wait(120);}
 }
 assert.ok(await p.locator('#task-go').isVisible(),`observe step finished ${t.width}px: ${await t.kicker()}`);
}
(async()=>{
 const only=process.argv[2];
 for(const [id,cfg] of Object.entries(DESKS)){
  if(only&&id!==only)continue;
  await runDesk(`/tools/lab/${id}/`,async t=>{
   const p=t.p,steps=await p.locator('#steps button').count();
   for(let i=0;i<steps;i++){
    assert.match(await t.kicker(),new RegExp(`任務 ${i+1} / ${steps}`));
    await t.noOverflow('step '+(i+1));
    if(await p.locator('#dock-observe').isVisible())await observe(t);
    else if(await p.locator('#dock-calc').isVisible()){
     const stepId=Object.keys(cfg.calc||{})[0],vals=cfg.calc[stepId],ins=p.locator('#calc-rows input');
     assert.equal(await ins.count(),vals.length,id+' calc rows');
     for(let k=0;k<vals.length;k++)await ins.nth(k).fill(String(vals[k]));
     await p.click('#check');await t.wait(150);
     assert.ok(await p.locator('#task-go').isVisible(),id+' calc accepted');
    }else{await t.quiz(cfg.quiz);break;}
    if(i<steps-1)await t.next();
   }
   assert.ok(await p.evaluate(()=>document.querySelectorAll('#finish-dialog .stars svg:not(.off)').length)===steps,id+' all stars');
  });
 }
})().catch(e=>{console.error(e);process.exit(1);});
