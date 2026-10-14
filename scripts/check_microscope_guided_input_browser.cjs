// B3 browser gate: real mouse, touch and keyboard input on the guided microscope page.
// Needs Playwright (NODE_PATH=/opt/node-tools/node_modules locally). Locally set PLAYWRIGHT_CHROMIUM_EXECUTABLE to reuse a browser.
// Checks: real mouse drag (1:1 with the slide), pointer capture past the edge, touch drag, Arrow / Shift+Arrow / Home,
// the locked state, the direction and objective buttons, and touch-target sizes (48 px desktop, 64 px phone).
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {createServer,guardContext,launchOptions}=require('./microscope_guided_test_support.cjs');
const PAGE='/tools/science/microscope-guided.html';
const Q=3.6,G=1.6,STEP4=0.10*540/(1*G);   // wu per overview px, stage gain, Arrow step in stage units at 4×

const TO_TRIAL1=[{type:'START'},{type:'BEGIN'}];
const TO_TRIAL2_LOW=[...TO_TRIAL1,{type:'SET_STAGE',x:75,y:0},{type:'RECORD'},{type:'SET_STAGE',x:0,y:75},{type:'RECORD'},{type:'ANSWER_COMPARE',compare:'direction',question:'relation',answer:'opposite'},{type:'CONTINUE'}];
const TO_TRIAL2_HIGH=[...TO_TRIAL2_LOW,{type:'SET_STAGE',x:0,y:0},{type:'RECORD'}];

const near=(a,b,tol,msg)=>assert.ok(Math.abs(a-b)<=tol,`${msg}: expected ${b}, got ${a}`);
const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const state=p=>p.evaluate(()=>window.__mgTest.getState());
const jump=async(p,actions)=>{for(const a of actions){const r=await p.evaluate(a=>{const x=window.__mgTest.dispatch(a);return {accepted:x.accepted,reason:x.reason}},a);assert.equal(r.accepted,true,`${JSON.stringify(a)} -> ${r.reason}`)}await settle(p)};
const surfaceBox=async p=>{const s=p.locator('[data-role="stage-surface"]');await s.scrollIntoViewIfNeeded();return s.boundingBox()};
const markerOrigin=(p,id)=>p.evaluate(id=>{const g=document.querySelector(`[data-role="clipped-layer"] > [data-feature="${id}"]`),m=g.getScreenCTM();return {x:m.e,y:m.f}},id);
const eyeScale=p=>p.evaluate(()=>document.querySelector('.mg-eyepiece').getBoundingClientRect().width/600);   // client px per eyepiece unit
const slideRect=p=>p.evaluate(()=>{const r=document.querySelector('.mg-slide-glass').getBoundingClientRect();return {left:r.left,top:r.top}});

async function open(browser,base,{viewport,touch=false,external,errors}){
 const ctx=await browser.newContext({viewport,hasTouch:touch,isMobile:touch});
 await guardContext(ctx,base,{hook:true,external});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(base+PAGE);await settle(page);
 return {ctx,page};
}
async function touchDrag(page,from,to,steps=8){
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:from.x,y:from.y}]});
 for(let i=1;i<=steps;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/steps,y:from.y+(to.y-from.y)*i/steps}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await settle(page);
}

(async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,r));
 const base=`http://localhost:${server.address().port}`;
 const browser=await chromium.launch(launchOptions());
 const external=[],errors=[];let checks=0;const ok=(m)=>{checks++;console.log('PASS',m)};
 try{
  // ---- desktop: mouse, keyboard, buttons ------------------------------------------------------------------------------
  {
   const {ctx,page}=await open(browser,base,{viewport:{width:1280,height:900},external,errors});
   await jump(page,TO_TRIAL2_HIGH);                           // 4× objective, stage (0,0), nothing completes while the stage moves
   const box=await surfaceBox(page),k=box.width/340;          // client px per overview px
   const s0=await state(page),slide0=await slideRect(page),b0=await markerOrigin(page,'B');

   await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
   await page.mouse.move(box.x+box.width/2+30,box.y+box.height/2+12,{steps:6});await page.mouse.up();await settle(page);
   const s1=await state(page),slide1=await slideRect(page),b1=await markerOrigin(page,'B');
   near(s1.stage.x-s0.stage.x,(30/k)*Q/G,0.05,'pointer right -> stage x');
   near(s1.stage.y-s0.stage.y,-(12/k)*Q/G,0.05,'pointer down -> stage y decreases');
   near(slide1.left-slide0.left,30,1.2,'the slide follows the pointer 1:1 (x)');near(slide1.top-slide0.top,12,1.2,'the slide follows the pointer 1:1 (y)');
   assert.ok(b1.x<b0.x,'the eyepiece marker moved left for a slide dragged right');assert.ok(b1.y<b0.y,'and up for a slide dragged down');
   ok('real mouse drag: stage follows the pointer, slide 1:1, eyepiece marker moves with the model');

   await jump(page,[{type:'SET_STAGE',x:0,y:0}]);
   const c=await surfaceBox(page);
   await page.mouse.move(c.x+c.width/2,c.y+c.height/2);await page.mouse.down();
   await page.mouse.move(c.x+c.width/2+700,c.y+c.height/2-500,{steps:12});await page.mouse.up();await settle(page);
   assert.deepEqual((await state(page)).stage,{x:150,y:150},'pointer capture: the drag keeps working far outside the surface and the engine clamps');
   ok('pointer capture: a drag that leaves the surface still tracks, and the engine clamps to ±150');

   await jump(page,[{type:'SET_STAGE',x:0,y:0}]);
   const surf=page.locator('[data-role="stage-surface"]');await surf.focus();
   const before=await markerOrigin(page,'B');
   await page.keyboard.press('ArrowRight');await settle(page);
   let s=await state(page);near(s.stage.x,STEP4,1e-6,'ArrowRight step');near(s.stage.y,0,1e-9,'no y change');
   const after=await markerOrigin(page,'B'),es=await eyeScale(page);near(before.x-after.x,54*es,0.2,'the image moves 54 eyepiece units on screen');
   await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');await settle(page);near((await state(page)).stage.x,-STEP4,1e-6,'ArrowLeft x2');
   await page.keyboard.press('ArrowUp');await settle(page);near((await state(page)).stage.y,STEP4,1e-6,'ArrowUp');
   await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await settle(page);near((await state(page)).stage.y,-STEP4,1e-6,'ArrowDown x2');
   ok('Arrow keys move the slide right / left / up / down by 10 % of the field');

   await jump(page,[{type:'SET_STAGE',x:0,y:0}]);await surf.focus();
   await page.keyboard.press('Shift+ArrowRight');await settle(page);near((await state(page)).stage.x,STEP4/4,1e-6,'Shift+Arrow');
   ok('Shift+Arrow moves a quarter of the Arrow step');

   await jump(page,[{type:'SET_OBJECTIVE',objective:10},{type:'SET_STAGE',x:0,y:0}]);await surf.focus();
   const m0=await markerOrigin(page,'B');await page.keyboard.press('ArrowRight');await settle(page);const m1=await markerOrigin(page,'B');
   near(m0.x-m1.x,54*(await eyeScale(page)),0.2,'10× Arrow still moves the image 54 eyepiece units');near((await state(page)).stage.x,STEP4/2.5,1e-6,'with a 2.5× smaller stage step');
   await jump(page,[{type:'SET_OBJECTIVE',objective:4}]);
   ok('the same key moves the picture the same distance at every objective');

   await jump(page,[{type:'SET_STAGE',x:40,y:-20}]);await surf.focus();await page.keyboard.press('Home');await settle(page);
   assert.deepEqual((await state(page)).stage,{x:0,y:0},'Home in trial2-high returns to the origin');
   await page.keyboard.press('a');await page.keyboard.press('Tab');await settle(page);
   ok('Home returns to the start; other keys do nothing to the stage');

   // buttons by accessible name
   await jump(page,[{type:'SET_STAGE',x:0,y:0}]);
   for(const [name,key,sign] of [['玻片向右','x',1],['玻片向左','x',-1],['玻片向上','y',1],['玻片向下','y',-1]]){
    await jump(page,[{type:'SET_STAGE',x:0,y:0}]);
    await page.getByRole('button',{name,exact:true}).click();await settle(page);
    near((await state(page)).stage[key],sign*STEP4,1e-6,name);
   }
   await jump(page,[{type:'SET_STAGE',x:30,y:30}]);await page.getByRole('button',{name:'玻片回到起點',exact:true}).click();await settle(page);
   assert.deepEqual((await state(page)).stage,{x:0,y:0});
   ok('direction buttons are real buttons with names; Home button returns the slide');

   // objective buttons
   const b4=page.getByRole('button',{name:'4× 物鏡'}),b40=page.getByRole('button',{name:'40× 物鏡'});
   assert.equal(await b4.getAttribute('aria-pressed'),'true');assert.equal(await b40.getAttribute('aria-pressed'),'false');
   await b40.click();await settle(page);
   assert.equal((await state(page)).objective,40);assert.equal((await state(page)).phase,'trial2-high-complete');
   assert.equal(await b40.getAttribute('aria-pressed'),'true');
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'mg-cta','focus moved to the record button when the stage locked');
   ok('objective buttons switch the objective and report their pressed state');

   // locked: stage, keys and buttons are inert
   const lockedStage=(await state(page)).stage;
   const lockBox=await surfaceBox(page);
   assert.equal(await page.locator('[data-role="stage-surface"]').getAttribute('data-locked'),'true');
   assert.equal(await page.locator('[data-role="stage-surface"]').getAttribute('aria-disabled'),'true');
   await page.mouse.move(lockBox.x+50,lockBox.y+50);await page.mouse.down();await page.mouse.move(lockBox.x+120,lockBox.y+90,{steps:4});await page.mouse.up();
   await page.locator('[data-role="stage-surface"]').focus({timeout:500}).catch(()=>{});await page.keyboard.press('ArrowRight');await settle(page);
   assert.deepEqual((await state(page)).stage,lockedStage,'a locked stage does not move');
   for(const name of ['玻片向右','玻片向左','玻片向上','玻片向下','玻片回到起點'])assert.equal(await page.getByRole('button',{name,exact:true}).isDisabled(),true,`${name} is disabled while locked`);
   ok('locked phase: pointer, keys and buttons do nothing, and focus moved to the record button');

   await ctx.close();
  }
  {
   const {ctx,page}=await open(browser,base,{viewport:{width:1280,height:900},external,errors});
   await jump(page,TO_TRIAL1);
   const small=await page.evaluate(()=>[...document.querySelectorAll('[data-mg-move],[data-mg-home]')].map(b=>{const r=b.getBoundingClientRect();return [b.getAttribute('aria-label'),r.width,r.height]}).filter(([,w,h])=>w<47.5||h<47.5));
   assert.deepEqual(small,[],'direction controls are at least 48 px on desktop');
   const cta=await page.locator('#mg-cta').boundingBox();assert.ok(cta.height>=48,'main button is at least 48 px');
   ok('desktop touch targets are at least 48 px');
   // a mouse drag that completes the trial locks the stage and stops tracking
   const box=await surfaceBox(page),k=box.width/340;
   await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
   await page.mouse.move(box.x+box.width/2+(75*G/Q)*k,box.y+box.height/2,{steps:10});
   await page.mouse.move(box.x+box.width/2+(150*G/Q)*k,box.y+box.height/2,{steps:6});await page.mouse.up();await settle(page);
   const s=await state(page);assert.equal(s.phase,'trial1-horizontal-complete');assert.ok(s.stage.x>=50&&s.stage.x<=100,`the drag stopped when the trial completed (x=${s.stage.x})`);
   ok('a drag that brings the e to the centre completes the trial and stops moving the stage');
   await ctx.close();
  }
  // ---- phone: touch drag, 64 px targets ------------------------------------------------------------------------------
  {
   const {ctx,page}=await open(browser,base,{viewport:{width:390,height:844},touch:true,external,errors});
   await jump(page,TO_TRIAL2_HIGH);
   const small=await page.evaluate(()=>[...document.querySelectorAll('[data-mg-move],[data-mg-home],[data-mg-objective]')].filter(b=>!b.closest('[hidden]')).map(b=>{const r=b.getBoundingClientRect();return [b.getAttribute('aria-label'),r.width,r.height]}).filter(([,w,h])=>w<63.5||h<63.5));
   assert.deepEqual(small,[],'direction and objective controls are at least 64 px on a phone');
   const cta=await page.locator('#mg-cta').boundingBox();assert.ok(cta.height>=63.5,'main button is at least 64 px on a phone');
   ok('phone touch targets are at least 64 px');

   const box=await surfaceBox(page),k=box.width/340,s0=await state(page),slide0=await slideRect(page);
   await touchDrag(page,{x:box.x+box.width/2,y:box.y+box.height/2},{x:box.x+box.width/2+40,y:box.y+box.height/2+16});
   const s1=await state(page),slide1=await slideRect(page);
   near(s1.stage.x-s0.stage.x,(40/k)*Q/G,0.5,'touch right -> stage x');near(s1.stage.y-s0.stage.y,-(16/k)*Q/G,0.5,'touch down -> stage y decreases');
   near(slide1.left-slide0.left,40,2,'the slide follows the finger 1:1');
   ok('real touch drag moves the stage and the slide follows the finger 1:1');
   assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('[data-role="stage-surface"]')).touchAction),'none','the stage owns its touch gestures');
   ok('the stage surface takes over its own touch gestures (touch-action: none)');
   await ctx.close();
  }
  assert.deepEqual(external,[],'no external requests');assert.deepEqual(errors,[],'no console or page errors');
  ok('no external requests, no console errors');
  console.log(`microscope-guided input browser: ${checks} checks passed`);
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
