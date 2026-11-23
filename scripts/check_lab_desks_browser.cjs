'use strict';
// 用 tools/lab/shared/desk.mjs 引擎做的實驗桌：桌機（滑鼠）與手機（觸控）各跑完整流程。
// 觀察步驟逐一嘗試控制列的組合，畫面提示「收下」時就收下；收齊後才算完成。再填算一算、答說說看，最後要看到完成對話框。
const {runDesk,assert}=require('./lab_desk_browser_harness.cjs');
const DESKS={
 moon:{quiz:[1,0,0]},
 seasons:{calc:{calc:[90,43,90]},quiz:[1,1,1]},
 tides:{quiz:[1,1,0]},
 weather:{quiz:[1,0,1]},
 enzyme:{quiz:[1,1,1]},
 'plant-exchange':{quiz:[1,1,0]},
 ecosystem:{calc:{calc:[50,200]},quiz:[1,1,0]},
 homeostasis:{quiz:[1,1,1]},
 'nerve-reflex':{calc:{calc:[0.3,20]},quiz:[1,0,1]},
 circulation:{calc:{calc:[4.9,9.6]},quiz:[1,0,1]},
 'cell-division':{calc:{calc:[46,23,46]},quiz:[1,0,1]},
 equilibrium:{quiz:[1,1,1]},
 electrolysis:{quiz:[1,1,1]},
 stoichiometry:{calc:{calc:[0.5,54,36]},quiz:[1,1,1]},
 atom:{calc:{calc:[27,10,11]},quiz:[1,1,0]},
 'wave-sound':{calc:{calc:[0.4,85,255]},quiz:[1,1,1]},
 energy:{calc:{calc:[60,60,45]},quiz:[1,1,1]},
 electromagnetism:{quiz:[1,1,1]},
 electrostatics:{quiz:[1,1,1]},
 circuit:{calc:{calc:[5,0.3,1.2]},quiz:[1,0,2]},
 phase:{calc:{calc:[8000,10000,16000]},quiz:[1,1,1]},
 balance:{calc:{calc:[6,4,8]},quiz:[1,1,1]},
 indicator:{quiz:[1,0,1]},
 newton:{calc:{calc:[3,6,12]},quiz:[1,0,2]},
 color:{quiz:[1,0,2]},
 eye:{quiz:[0,1,1]},
 microscope:{calc:{calc:[400,0.4,4]},quiz:[2,0,1,1]},
 photosynthesis:{quiz:[1,1,1]},
 genetics:{calc:{calc:[100,50,50]},quiz:[1,1,1]},
 earthquake:{calc:{calc:[15,30,180]},quiz:[1,1,0]},
 wave:{calc:{calc:[120,4,15]},quiz:[1,1,2]},
 motor:{quiz:[0,1,1]},
};
// 照目前步驟的每個目標設定，用畫面上的按鈕（分段按鈕或＋／−）把器材調過去，提示「收下」時才收下。
async function press(t,loc){if(t.mobile)await loc.tap();else await loc.click();await t.wait(50);}
async function observe(t){
 const p=t.p,targets=await p.evaluate(()=>__labDesk.targets()),controls=await p.evaluate(()=>__labDesk.controls());
 assert.ok(targets.length>0,'observe step has targets');
 for(const tg of targets){
  for(const [key,want] of Object.entries(tg.set)){
   const ci=controls.findIndex(c=>c.key===key);
   if(ci<0){assert.equal(await p.evaluate(k=>__labDesk.value(k),key),want,`fixed setting ${key}`);continue;}
   const box=p.locator('#controls .ctl').nth(ci),c=controls[ci];
   if(c.type==='seg'){const k=c.options.findIndex(v=>v===want);assert.ok(k>=0,`option ${key}=${want}`);const b=box.locator('button').nth(k);if(await b.getAttribute('aria-pressed')!=='true')await press(t,b);}
   else for(let guard=0;guard<80;guard++){const v=await p.evaluate(k=>__labDesk.value(k),key);if(Math.abs(v-want)<1e-9)break;await press(t,box.locator('.stepper button').nth(v<want?1:0));}
   assert.equal(await p.evaluate(k=>__labDesk.value(k),key),want,`reached ${key}=${want}`);
  }
  assert.ok(await p.locator('#save.cue').count(),`save is cued for ${tg.sig}`);
  await press(t,p.locator('#save'));await t.wait(80);
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
