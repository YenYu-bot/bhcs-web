// B3 gate (real browser part): mouse, touch and keyboard operation, locked behaviour, focus hand-over, hit sizes and page
// scrolling for the guided buoyancy lab, on the real page skeleton (tools/science/buoyancy-guided.html).
// Needs Playwright (CI: NODE_PATH=/tmp/bhcs-composition/node_modules). Locally set PLAYWRIGHT_CHROMIUM_EXECUTABLE to reuse a browser.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {guardContext,axeScan}=require('./buoyancy_guided_test_support.cjs');
const root=path.resolve(__dirname,'..');
const PAGE='/tools/science/buoyancy-guided.html';

const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return}
 const file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}
});

const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const info=p=>p.evaluate(()=>{const m=document.getElementById('main').dataset;return {phase:m.phase,slots:Number(m.slots),liquid:m.liquid,tank:m.tankObject,drops:Number(m.drops),
 hint:document.getElementById('bg-hint').textContent,scrollY:Math.round(scrollY),scrollX:Math.round(scrollX),overflow:document.documentElement.scrollWidth-innerWidth,
 active:document.activeElement?{id:document.activeElement.id,object:document.activeElement.dataset.bgObject||null,action:document.activeElement.dataset.bgAction||null,liquid:document.activeElement.dataset.bgLiquid!==undefined?document.activeElement.value:null}:null}});
const hook=(p,fn,arg)=>p.evaluate(({fn,arg})=>{const h=window.__bgTest;return new Function('h','arg','return ('+fn+')(h,arg)')(h,arg)},{fn:fn.toString(),arg});
const dispatch=async(p,...actions)=>{for(const a of actions){const r=await hook(p,(h,a)=>{const x=h.dispatch(a);return {accepted:x.accepted,reason:x.reason}},a);assert.equal(r.accepted,true,`${JSON.stringify(a)} ${r.reason}`)}await settle(p)};
const box=async(p,sel)=>{const b=await p.locator(sel).first().boundingBox();assert.ok(b,sel+' has no box');return b};
const center=async(p,sel)=>{const b=await box(p,sel);return {x:b.x+b.width/2,y:b.y+b.height/2}};
const BLOCK='[data-bg-object="block"]',TANK='[data-bg-tank]';

let base;const results=[];
const check=async(name,fn)=>{const row={name};try{await fn();row.pass=true}catch(e){row.pass=false;row.error=e.message}results.push(row);console.log(JSON.stringify(row))};

async function open(browser,{width,height,touch=false}){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});
 const external=[];await guardContext(ctx,base,{hook:true,external});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(base+PAGE);await page.waitForSelector('#main[data-phase]');
 return {ctx,page,errors,external};
}
const toTrial1=async p=>{await p.getByRole('button',{name:'開始實驗'}).click();await p.getByRole('button',{name:'動手試試看'}).click();assert.equal((await info(p)).phase,'trial1-test')};
const toSwitch=async p=>{await toTrial1(p);await dispatch(p,{type:'ADD_BALLAST'},{type:'ADD_BALLAST'},{type:'PUT_IN',objectId:'block'},{type:'RECORD_TRIAL',trial:1});assert.equal((await info(p)).phase,'trial2-switch-liquid')};
const toTrial3=async p=>{await toSwitch(p);await dispatch(p,{type:'SELECT_LIQUID',liquidId:'brine'},{type:'PUT_IN',objectId:'block'},{type:'TAKE_OUT'},{type:'ADD_BALLAST'},{type:'PUT_IN',objectId:'block'},{type:'RECORD_TRIAL',trial:2},{type:'CONTINUE'},
 {type:'ANSWER_COMPARE',question:'stayMass',answer:'larger'},{type:'ANSWER_COMPARE',question:'firstDrop',answer:'float'},{type:'CONTINUE'});assert.equal((await info(p)).phase,'trial3-drop')};
async function mouseDrag(p,from,to,{steps=8}={}){await p.mouse.move(from.x,from.y);await p.mouse.down();for(let i=1;i<=steps;i++)await p.mouse.move(from.x+(to.x-from.x)*i/steps,from.y+(to.y-from.y)*i/steps);await p.mouse.up();await settle(p)}
async function touchDrag(p,from,to,{steps=12}={}){
 const cdp=await p.context().newCDPSession(p),pt=(x,y)=>[{x,y,id:1}];
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pt(from.x,from.y)});
 for(let i=1;i<=steps;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pt(from.x+(to.x-from.x)*i/steps,from.y+(to.y-from.y)*i/steps)});await p.waitForTimeout(16)}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(100);await settle(p);await cdp.detach();
}
const tall=p=>p.evaluate(()=>{const d=document.createElement('div');d.style.height='3000px';d.id='pad';document.querySelector('.bg-wrap').append(d)});
const pressUntil=async(p,pred,key='Tab',limit=40)=>{for(let i=0;i<limit;i++){await p.keyboard.press(key);const a=(await info(p)).active;if(a&&pred(a))return a}throw new Error('focus never reached the target')};
const hitSizes=async(p,min)=>{
 const rows=await p.evaluate(()=>[...document.querySelectorAll('[data-bg-object],[data-bg-action],.bg-pill,#bg-cta')].filter(e=>!e.hidden&&!e.closest('[hidden]')&&e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {what:e.dataset.bgObject||e.dataset.bgAction||e.id||e.textContent.trim(),w:r.width,h:r.height}}));
 assert.ok(rows.length>=4,'controls were measured');
 for(const r of rows)assert.ok(r.w>=min-0.5&&r.h>=min-0.5,`${r.what} is ${r.w.toFixed(1)}×${r.h.toFixed(1)}, needs ${min}`);
};
const clean=({errors,external})=>{assert.deepEqual(errors,[]);assert.deepEqual(external,[])};

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{});
 try{
  await check('1280 mouse: dragging the block over the tank puts it in, once',async()=>{
   const s=await open(browser,{width:1280,height:900});await toTrial1(s.page);
   await mouseDrag(s.page,await center(s.page,BLOCK),await center(s.page,TANK));
   const r=await info(s.page);assert.equal(r.tank,'block');assert.equal(r.drops,1);assert.equal(r.slots,1);
   assert.equal(await s.page.locator(BLOCK).getAttribute('aria-pressed'),'true');assert.equal(await s.page.locator(BLOCK).getAttribute('data-dragging'),null);
   clean(s);await s.ctx.close();
  });
  await check('1280 mouse: let go outside the tank leaves the block on the table and says why',async()=>{
   const s=await open(browser,{width:1280,height:900});await toTrial1(s.page);
   await mouseDrag(s.page,await center(s.page,BLOCK),{x:640,y:20});
   const r=await info(s.page);assert.equal(r.tank,'');assert.equal(r.drops,0);assert.match(r.hint,/水槽/);
   await mouseDrag(s.page,await center(s.page,BLOCK),await center(s.page,TANK));assert.equal((await info(s.page)).hint,'','the message clears on the next accepted action');
   clean(s);await s.ctx.close();
  });
  await check('1280 mouse: a block in the tank can be dragged out, and let go inside stays',async()=>{
   const s=await open(browser,{width:1280,height:900});await toTrial1(s.page);await dispatch(s.page,{type:'PUT_IN',objectId:'block'});
   const t=await box(s.page,TANK);await mouseDrag(s.page,await center(s.page,BLOCK),{x:t.x+20,y:t.y+20});assert.equal((await info(s.page)).tank,'block');
   await mouseDrag(s.page,await center(s.page,BLOCK),{x:640,y:20});assert.equal((await info(s.page)).tank,'');
   clean(s);await s.ctx.close();
  });
  await check('1280 mouse: click and the tool buttons put in, take out and change the ballast',async()=>{
   const s=await open(browser,{width:1280,height:900});await toTrial1(s.page);const p=s.page;
   await p.locator(BLOCK).click();assert.equal((await info(p)).tank,'block');await p.locator(BLOCK).click();assert.equal((await info(p)).tank,'');
   await p.getByRole('button',{name:'加一個配重'}).click();assert.equal((await info(p)).slots,2);await p.getByRole('button',{name:'取下一個配重'}).click();assert.equal((await info(p)).slots,1);
   await p.getByRole('button',{name:'放入水中'}).click();assert.equal((await info(p)).tank,'block');await p.getByRole('button',{name:'拿出來'}).click();assert.equal((await info(p)).tank,'');
   clean(s);await s.ctx.close();
  });
  await check('1280: ballast and put-in are locked while the block is in the tank; they do nothing and the page explains',async()=>{
   const s=await open(browser,{width:1280,height:900});await toTrial1(s.page);const p=s.page;await p.locator(BLOCK).click();
   const add=p.getByRole('button',{name:'加一個配重'});assert.equal(await add.getAttribute('aria-disabled'),'true');
   await add.click({force:true});const r=await info(p);   // force: a locked control is still clickable, it just does nothing
   assert.equal(r.slots,1);assert.match(r.hint,/拿出來/);
   assert.equal(await p.locator(BLOCK).getAttribute('aria-disabled'),null,'the block itself can still be taken out');
   clean(s);await s.ctx.close();
  });
  await check('1280 keyboard: Tab reaches the block; Enter puts it in, Space takes it out; the ballast buttons work',async()=>{
   const s=await open(browser,{width:1280,height:900});await toTrial1(s.page);const p=s.page;
   await p.evaluate(()=>document.body.focus());
   await pressUntil(p,a=>a.object==='block');await p.keyboard.press('Enter');assert.equal((await info(p)).tank,'block');
   assert.equal((await info(p)).active.object,'block','focus stays on the block');
   await p.keyboard.press('Space');assert.equal((await info(p)).tank,'');
   await pressUntil(p,a=>a.action==='add-ballast');await p.keyboard.press('Enter');assert.equal((await info(p)).slots,2);
   await p.keyboard.press('Enter');assert.equal((await info(p)).slots,3);
   await pressUntil(p,a=>a.action==='put-in');await p.keyboard.press('Enter');assert.equal((await info(p)).tank,'block');
   assert.equal((await info(p)).phase,'trial1-complete');
   clean(s);await s.ctx.close();
  });
  await check('1280 keyboard: a locked object ignores Enter and Space, and no key is prevented',async()=>{
   const s=await open(browser,{width:1280,height:900});await toSwitch(s.page);const p=s.page;
   await p.evaluate(()=>{window.__prevented=[];document.addEventListener('keydown',e=>window.__prevented.push(e.defaultPrevented))});
   await p.evaluate(()=>document.body.focus());await pressUntil(p,a=>a.object==='block');
   assert.equal(await p.locator(BLOCK).getAttribute('aria-disabled'),'true');
   const before=await info(p);await p.keyboard.press('Enter');await p.keyboard.press('Space');await p.keyboard.press('ArrowRight');await p.keyboard.press('PageDown');
   const after=await info(p);assert.equal(after.tank,'');assert.equal(after.drops,before.drops);
   assert.ok((await p.evaluate(()=>window.__prevented)).every(x=>x===false),'no key event was prevented');
   clean(s);await s.ctx.close();
  });
  await check('1280 keyboard: the liquid radios follow the arrow keys, then lock once the block is in',async()=>{
   const s=await open(browser,{width:1280,height:900});await toSwitch(s.page);const p=s.page;
   await p.evaluate(()=>document.body.focus());await pressUntil(p,a=>a.liquid==='water');
   await p.keyboard.press('ArrowRight');const r=await info(p);assert.equal(r.liquid,'brine');assert.deepEqual(r.active&&r.active.liquid,'brine');
   assert.equal(await p.locator(BLOCK).getAttribute('aria-disabled'),null);
   await pressUntil(p,a=>a.object==='block');await p.keyboard.press('Enter');
   const done=await info(p);assert.equal(done.phase,'trial2-test');assert.equal(done.tank,'block');
   assert.equal(await p.locator('input[data-bg-liquid]').first().isDisabled(),true);
   clean(s);await s.ctx.close();
  });
  await check('1280 focus: handed over only when the focused control becomes unavailable',async()=>{
   const s=await open(browser,{width:1280,height:900});await toSwitch(s.page);const p=s.page;
   await dispatch(p,{type:'SELECT_LIQUID',liquidId:'brine'});
   await p.locator('input[data-bg-liquid][value="brine"]').focus();
   await dispatch(p,{type:'PUT_IN',objectId:'block'});                    // the radios lock under the focus
   let a=(await info(p)).active;assert.equal(a.object,'block','focus moved to a usable control');
   await p.getByRole('button',{name:'取下一個配重'}).focus();assert.equal((await info(p)).active.action,'remove-ballast');
   await dispatch(p,{type:'TAKE_OUT'});assert.equal((await info(p)).active.action,'remove-ballast','a control that is still usable keeps focus');
   await dispatch(p,{type:'ADD_BALLAST'},{type:'PUT_IN',objectId:'block'});                      // remove-ballast locks under the focus
   a=(await info(p)).active;assert.notEqual(a.action,'remove-ballast');assert.ok(a.object==='block'||a.id==='bg-cta'||a.id==='bg-heading');
   clean(s);await s.ctx.close();
  });
  await check('1280 focus: after the record button goes away focus lands on the heading when nothing else is usable',async()=>{
   const s=await open(browser,{width:1280,height:900});await toTrial1(s.page);const p=s.page;
   await dispatch(p,{type:'ADD_BALLAST'},{type:'ADD_BALLAST'},{type:'PUT_IN',objectId:'block'});
   await p.evaluate(()=>document.body.focus());await pressUntil(p,a=>a.id==='bg-cta');
   assert.equal(await p.locator('#bg-cta').isEnabled(),true);await p.keyboard.press('Enter');
   const r=await info(p);assert.equal(r.phase,'trial2-switch-liquid');assert.equal(r.active.id,'bg-heading');
   clean(s);await s.ctx.close();
  });
  await check('1280 trial 3: wood and stone go in one at a time; the second waits for the first to come out',async()=>{
   const s=await open(browser,{width:1280,height:900});await toTrial3(s.page);const p=s.page;
   const WOOD='[data-bg-object="wood"]',STONE='[data-bg-object="stone"]';
   assert.equal(await p.locator(BLOCK).isHidden(),true);assert.equal(await p.locator(WOOD).isVisible(),true);
   await mouseDrag(p,await center(p,WOOD),await center(p,TANK));assert.equal((await info(p)).tank,'wood');
   assert.equal(await p.locator(STONE).getAttribute('aria-disabled'),'true');
   await mouseDrag(p,await center(p,STONE),await center(p,TANK));assert.equal((await info(p)).tank,'wood','a locked object cannot be dragged in');
   await p.locator(WOOD).click();assert.equal((await info(p)).tank,'');
   await p.getByRole('button',{name:'把小石頭放入水中'}).click();assert.equal((await info(p)).phase,'trial3-observed');
   clean(s);await s.ctx.close();
  });
  await check('1280 hit sizes: every control is at least 48 px, in trials 1, 2 and 3',async()=>{
   const s=await open(browser,{width:1280,height:900});await toTrial1(s.page);await hitSizes(s.page,48);
   await dispatch(s.page,{type:'ADD_BALLAST'},{type:'ADD_BALLAST'},{type:'PUT_IN',objectId:'block'},{type:'RECORD_TRIAL',trial:1});await hitSizes(s.page,48);
   await toTrial3(await (async()=>{const x=await open(browser,{width:1280,height:900});s.extra=x;return x.page})());await hitSizes(s.extra.page,48);
   clean(s);await s.ctx.close();await s.extra.ctx.close();
  });
  await check('touch-action: a movable object takes touch, a locked one and the bench leave it to the page',async()=>{
   const s=await open(browser,{width:1280,height:900});await toTrial1(s.page);const p=s.page;
   const ta=sel=>p.locator(sel).first().evaluate(e=>getComputedStyle(e).touchAction);
   assert.equal(await ta(BLOCK),'none');assert.equal(await ta('[data-bg-bench]'),'pan-y');assert.equal(await ta(TANK),'auto');
   await dispatch(p,{type:'ADD_BALLAST'},{type:'ADD_BALLAST'},{type:'PUT_IN',objectId:'block'},{type:'RECORD_TRIAL',trial:1});
   assert.equal(await ta(BLOCK),'pan-y');
   clean(s);await s.ctx.close();
  });

  await check('390 hit sizes: every control is at least 64 px, and the page does not scroll sideways',async()=>{
   const s=await open(browser,{width:390,height:844,touch:true});await toTrial1(s.page);await hitSizes(s.page,64);assert.ok((await info(s.page)).overflow<=0);
   await dispatch(s.page,{type:'ADD_BALLAST'},{type:'ADD_BALLAST'},{type:'PUT_IN',objectId:'block'});await hitSizes(s.page,64);assert.ok((await info(s.page)).overflow<=0);
   clean(s);await s.ctx.close();
  });
  await check('390 touch: a tap puts the block in and a second tap takes it out',async()=>{
   const s=await open(browser,{width:390,height:844,touch:true});await toTrial1(s.page);const p=s.page;
   await p.locator(BLOCK).tap();assert.equal((await info(p)).tank,'block');await p.locator(BLOCK).tap();assert.equal((await info(p)).tank,'');
   await p.getByRole('button',{name:'放入水中'}).tap();assert.equal((await info(p)).tank,'block');
   clean(s);await s.ctx.close();
  });
  await check('390 touch: dragging the block into the tank puts it in, and the page does not scroll',async()=>{
   const s=await open(browser,{width:390,height:844,touch:true});await toTrial1(s.page);const p=s.page;await tall(p);
   await touchDrag(p,await center(p,BLOCK),await center(p,TANK));
   const r=await info(p);assert.equal(r.tank,'block');assert.equal(r.drops,1);assert.equal(r.scrollY,0);assert.equal(r.scrollX,0);
   await touchDrag(p,await center(p,BLOCK),{x:195,y:10});const out=await info(p);assert.equal(out.tank,'','dragged out of the tank');assert.equal(out.scrollY,0);
   clean(s);await s.ctx.close();
  });
  await check('390 touch: let go outside the tank puts nothing in and says why',async()=>{
   const s=await open(browser,{width:390,height:844,touch:true});await toTrial1(s.page);const p=s.page;await tall(p);
   await touchDrag(p,await center(p,BLOCK),{x:195,y:10});
   const r=await info(p);assert.equal(r.tank,'');assert.equal(r.drops,0);assert.match(r.hint,/水槽/);assert.equal(r.scrollY,0);
   clean(s);await s.ctx.close();
  });
  await check('390 touch: a vertical swipe on the tank scrolls the page and moves nothing; a sideways swipe never scrolls sideways',async()=>{
   const s=await open(browser,{width:390,height:844,touch:true});await toTrial1(s.page);const p=s.page;await tall(p);
   const t=await center(p,TANK);await touchDrag(p,t,{x:t.x,y:t.y-60});
   const r=await info(p);assert.ok(r.scrollY>0,'the page scrolled');assert.equal(r.tank,'');assert.equal(r.drops,0);
   await p.evaluate(()=>scrollTo(0,0));await touchDrag(p,{x:300,y:t.y},{x:40,y:t.y});
   const side=await info(p);assert.equal(side.scrollX,0);assert.equal(side.tank,'');
   clean(s);await s.ctx.close();
  });
  await check('390 touch: a locked object leaves the swipe to the page',async()=>{
   const s=await open(browser,{width:390,height:844,touch:true});await toSwitch(s.page);const p=s.page;await tall(p);
   assert.equal(await p.locator(BLOCK).getAttribute('aria-disabled'),'true');
   assert.equal(await p.locator(BLOCK).evaluate(e=>getComputedStyle(e).touchAction),'pan-y');
   const c=await center(p,BLOCK);await touchDrag(p,c,{x:c.x,y:c.y-60});
   const r=await info(p);assert.ok(r.scrollY>0,'the page scrolled from a locked object');assert.equal(r.tank,'');
   clean(s);await s.ctx.close();
  });

  for(const [w,h,touch] of [[1280,900,false],[390,844,true]]){
   await check(`${w} axe: welcome, trial 1, trial 1 with the block in, trial 2 waiting, trial 3`,async()=>{
    const s=await open(browser,{width:w,height:h,touch});const p=s.page;
    await axeScan(p,`${w} welcome`);await toTrial1(p);await axeScan(p,`${w} trial1`);
    await dispatch(p,{type:'ADD_BALLAST'},{type:'ADD_BALLAST'},{type:'PUT_IN',objectId:'block'});await axeScan(p,`${w} trial1 block in`);
    await dispatch(p,{type:'RECORD_TRIAL',trial:1});await axeScan(p,`${w} trial2 switch`);
    await dispatch(p,{type:'SELECT_LIQUID',liquidId:'brine'},{type:'PUT_IN',objectId:'block'},{type:'TAKE_OUT'},{type:'ADD_BALLAST'},{type:'PUT_IN',objectId:'block'},{type:'RECORD_TRIAL',trial:2},{type:'CONTINUE'},
     {type:'ANSWER_COMPARE',question:'stayMass',answer:'larger'},{type:'ANSWER_COMPARE',question:'firstDrop',answer:'float'},{type:'CONTINUE'});
    await axeScan(p,`${w} trial3`);clean(s);await s.ctx.close();
   });
  }
 }finally{await browser.close();server.close()}
 const failed=results.filter(r=>!r.pass);
 console.log(JSON.stringify({checked:results.length,failed:failed.length}));
 if(failed.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
