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
 microscope:{calc:{calc:[400,0.4,1]},quiz:[2,0,1,1]},
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
// 直接操作：在場景裡拖、轉、點器材（桌機用滑鼠，手機用觸控），確認設定真的跟著改。座標都是場景（SVG）座標。
function gestures(t){
 const p=t.p;let cdp=null;
 const toScreen=(x,y)=>p.evaluate(([x,y])=>{const m=document.querySelector('#scene').getScreenCTM();return [m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f];},[x,y]);
 const toSvg=(x,y)=>p.evaluate(([x,y])=>{const s=document.querySelector('#scene'),q=s.createSVGPoint();q.x=x;q.y=y;const r=q.matrixTransform(s.getScreenCTM().inverse());return [r.x,r.y];},[x,y]);
 const center=async sel=>{const b=await p.locator(`#rig ${sel}`).first().boundingBox();assert.ok(b,`scene element ${sel}`);return [b.x+b.width/2,b.y+b.height/2];};
 const path=async pts=>{
  if(t.mobile){cdp=cdp||await p.context().newCDPSession(p);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pts[0][0],y:pts[0][1]}]});
   for(const [x,y] of pts.slice(1))await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else{await p.mouse.move(...pts[0]);await p.mouse.down();for(const pt of pts.slice(1))await p.mouse.move(...pt);await p.mouse.up();}
  await t.wait(120);
 };
 const line=(a,b,n=10)=>Array.from({length:n+1},(_,i)=>[a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n]);
 return {
  // 從元素中心拖到場景座標 (x, y)
  dragTo:async(sel,x,y)=>{const a=await center(sel);await path(line(a,await toScreen(x,y)));},
  // 從元素中心拖動 (dx, dy) 場景單位
  dragBy:async(sel,dx,dy)=>{const a=await center(sel),[sx,sy]=await toSvg(...a);await path(line(a,await toScreen(sx+dx,sy+dy)));},
  // 繞著場景座標 (cx, cy)，從正上方順時針轉到 deg 度，半徑 r
  turn:async(cx,cy,r,deg,from=0)=>{const pts=[];for(let i=0;i<=16;i++){const a=(from+(deg-from)*i/16)*Math.PI/180;pts.push(await toScreen(cx+r*Math.sin(a),cy-r*Math.cos(a)));}await path(pts);},
  // 繞著元素中心轉 deg 度（半徑用元素寬度的 0.35 倍）
  spin:async(sel,deg)=>{const b=await p.locator(`#rig ${sel}`).first().boundingBox(),c=[b.x+b.width/2,b.y+b.height/2],r=b.width*.35,pts=[];for(let i=0;i<=16;i++){const a=deg*i/16*Math.PI/180;pts.push([c[0]+r*Math.sin(a),c[1]-r*Math.cos(a)]);}await path(pts);},
  tap:async sel=>{const l=p.locator(`#rig ${sel}`).first();if(t.mobile)await l.tap({force:true});else await l.click({force:true});await t.wait(120);},
  step:async i=>{await p.locator('#steps button').nth(i).click();await t.wait(200);},
  is:async(key,want,label)=>assert.equal(await p.evaluate(k=>__labDesk.value(k),key),want,`${label||key} at ${t.width}px`),
 };
}
const HANDS={
 microscope:async h=>{
  await h.step(0);await h.dragBy('[data-drag=slide]',34,0);await h.is('slide','right','drag slide');
  await h.step(2);await h.spin('[data-drag=coarse]',125);await h.is('coarse',2,'turn coarse knob');await h.spin('[data-drag=fine]',62);await h.is('fine',1,'turn fine knob');
  await h.step(3);await h.tap('[aria-label="換成 40× 物鏡"]');await h.is('obj',40,'click objective');
  await h.step(4);await h.dragBy('[data-drag=lever]',36,0);await h.is('aperture',5,'drag aperture lever');
  await h.step(5);await h.tap('[aria-label="換成水蘊草葉片"]');await h.is('spec','elodea','pick specimen');
  await h.step(6);await h.tap('[aria-label="換成解剖顯微鏡"]');await h.is('kind','stereo','pick microscope');
 },
 circuit:async h=>{
  await h.step(0);await h.tap('[data-drag=switch]');await h.is('on',true,'tap switch');
  await h.dragTo('[data-drag=cell]',500,470);await h.is('cells',2,'drag cell into holder');
  await h.dragBy('[data-drag=cell]',0,-130);await h.is('cells',1,'drag cell out');
  await h.step(1);await h.dragTo('[data-drag=bulb]',610,200);await h.is('layout','series','drag bulb to series slot');
  await h.dragTo('[data-drag=bulb]',680,400);await h.is('layout','single','drag bulb out');
  await h.step(2);await h.dragTo('[data-drag=bulb]',500,80);await h.is('layout','parallel','drag bulb to parallel slot');
 },
 phase:async h=>{
  await h.step(0);await h.turn(440,312,38,36,10);await h.is('time',3,'turn timer to 3 min');
  await h.dragTo('[data-drag=dot]',590+340*7/30,397);await h.is('time',7,'drag curve dot to 7 min');
  await h.step(2);await h.tap('[aria-label="換成 200 g 的冰"]');await h.is('mass',200,'pick 200 g');
 },
 indicator:async h=>{
  await h.step(0);await h.dragTo('[data-drag=dropper]',780,120);await h.is('sol','naoh','drag dropper');
  await h.tap('[aria-label="滴到稀鹽酸"]');await h.is('sol','hcl','tap tube');
 },
 balance:async h=>{
  await h.step(0);await h.dragTo('[data-drag=jar-a]',220,300);await h.is('a',2,'drag molecule in');
  await h.dragTo('[data-drag=mol-a]',500,520);await h.is('a',1,'drag molecule out');
  await h.tap('[data-drag=jar-c]');await h.is('c',2,'tap jar');
 },
};
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
 for(const [id,run] of Object.entries(HANDS)){
  if(only&&id!==only)continue;
  await runDesk(`/tools/lab/${id}/`,async t=>{await run(gestures(t));});
 }
})().catch(e=>{console.error(e);process.exit(1);});
