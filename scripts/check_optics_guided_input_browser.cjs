// I3 gate (real browser part): pointer capture, touch, keyboard paging and page scrolling for the guided optics input layer.
// Uses a throw-away harness page (no lab view yet): two draggables positioned from the engine, on a long page.
// Needs Playwright (CI: NODE_PATH=/tmp/bhcs-composition/node_modules). Locally set PLAYWRIGHT_CHROMIUM_EXECUTABLE to reuse a browser.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');

const HARNESS=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/assets/optics-guided/input.css">
<style>body{margin:0;font:16px system-ui}#bench{position:relative;height:220px;margin:0 16px;background:#e8f0f8}
.h{position:absolute;top:80px;width:44px;height:44px;margin-left:-22px;background:#d98a00;border-radius:8px}#candle{background:#c9a66b}
#pad{height:3000px;background:linear-gradient(#fff,#ddd)}</style></head>
<body><div id="bench" data-optics-bench><div id="screen" class="h" tabindex="0" aria-label="screen"></div><div id="candle" class="h" tabindex="0" aria-label="candle"></div></div><div id="pad"></div>
<script type="module">
import {reduce,createInitialState} from '/assets/optics-guided/engine.js';
import {createInputController,snapForWidth,BENCH_VIEW} from '/assets/optics-guided/input.js';
let state=createInitialState();const actions=[];
const bench=document.getElementById('bench'),screen=document.getElementById('screen'),candle=document.getElementById('candle');
const pct=axis=>((axis-BENCH_VIEW.minCm)/(BENCH_VIEW.maxCm-BENCH_VIEW.minCm)*100)+'%';
function render(){screen.style.left=pct(state.s);candle.style.left=pct(-state.u)}
function dispatch(a){actions.push(a);const r=reduce(state,a);state=r.state;render();return r}
const ctl=createInputController({getState:()=>state,dispatch,getSnap:()=>snapForWidth(innerWidth),getRect:()=>bench.getBoundingClientRect()});
ctl.attach(screen,'screen');ctl.attach(candle,'candle');
window.__optics={get state(){return state},actions,dispatch,rect:()=>bench.getBoundingClientRect().toJSON()};
dispatch({type:'START'});dispatch({type:'BEGIN'});actions.length=0;render();document.documentElement.dataset.ready='1';
</script></body></html>`;

const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return}
 if(url.pathname==='/__harness__'){res.setHeader('Content-Type','text/html');res.end(HARNESS);return}
 const file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}
});

const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const info=p=>p.evaluate(()=>({s:window.__optics.state.s,u:window.__optics.state.u,phase:window.__optics.state.phase,types:window.__optics.actions.map(a=>a.type),scrollY:Math.round(scrollY),scrollX:Math.round(scrollX),overflow:document.documentElement.scrollWidth-innerWidth}));
const center=async(p,id)=>{const b=await p.locator('#'+id).boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2}};
const xOfCm=(rect,axisCm)=>rect.x+((axisCm+35)/75)*rect.width;
async function open(browser,{width,height,touch}){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:!!touch,isMobile:!!touch,reducedMotion:'reduce'});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(base+'/__harness__');await page.waitForSelector('html[data-ready="1"]');
 return {ctx,page,errors};
}
async function touchDrag(page,from,to,{steps=12}={}){
 const cdp=await page.context().newCDPSession(page);
 const pt=(x,y)=>[{x,y,id:1}];
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pt(from.x,from.y)});
 for(let i=1;i<=steps;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pt(from.x+(to.x-from.x)*i/steps,from.y+(to.y-from.y)*i/steps)});await page.waitForTimeout(16)}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100);await settle(page);await cdp.detach();
}

let base;const results=[];
const check=async(name,fn)=>{const row={name};try{await fn();row.pass=true}catch(e){row.pass=false;row.error=e.message}results.push(row);console.log(JSON.stringify(row))};

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{});
 try{
  await check('desktop mouse drag: pointer capture keeps following outside the handle; release settles',async()=>{
   const {ctx,page,errors}=await open(browser,{width:1280,height:800});
   const rect=await page.evaluate(()=>window.__optics.rect()),c=await center(page,'screen');
   await page.mouse.move(c.x,c.y);await page.mouse.down();
   for(let i=1;i<=10;i++)await page.mouse.move(c.x+(xOfCm(rect,15)-c.x)*i/10,c.y+30*i);   // wanders 300 px below the handle
   await page.mouse.move(xOfCm(rect,17),c.y+500);                                          // far outside the handle and bench
   let mid=await info(page);assert.equal(mid.s,17,'captured pointer still drives the handle');
   await page.mouse.move(xOfCm(rect,15),c.y+500);await page.mouse.up();await settle(page);
   const r=await info(page);assert.equal(r.s,15);assert.equal(r.phase,'trial1-complete');assert.equal(r.types.at(-1),'SETTLE_SCREEN');assert.equal(r.types.filter(t=>t==='SETTLE_SCREEN').length,1);
   const n=r.types.length;await page.mouse.move(xOfCm(rect,30),c.y);await settle(page);assert.equal((await info(page)).types.length,n,'no dragging state after release');
   assert.equal(r.scrollY,0);assert.deepEqual(errors,[]);await ctx.close();
  });
  await check('desktop: a click without moving sends nothing',async()=>{
   const {ctx,page}=await open(browser,{width:1280,height:800});const c=await center(page,'screen');
   await page.mouse.click(c.x,c.y);await settle(page);const r=await info(page);assert.deepEqual(r.types,[]);assert.equal(r.s,20);await ctx.close();
  });
  await check('keyboard: PageUp/PageDown belong to the focused draggable, the page keeps paging elsewhere',async()=>{
   const {ctx,page}=await open(browser,{width:1280,height:800});
   await page.focus('#screen');await page.keyboard.press('PageDown');await settle(page);
   let r=await info(page);assert.equal(r.s,15,'PageDown = 5 cm left');assert.equal(r.scrollY,0,'focused draggable: page did not scroll');
   assert.equal(r.phase,'trial1-complete');assert.deepEqual(r.types,['MOVE_SCREEN','SETTLE_SCREEN']);
   await page.keyboard.press('ArrowRight');await page.keyboard.press('Shift+ArrowLeft');await settle(page);r=await info(page);assert.equal(r.s,15.5,'→ 1 cm then Shift+← 0.5 cm');
   await page.evaluate(()=>document.activeElement.blur());await page.keyboard.press('PageDown');await page.waitForTimeout(200);
   r=await info(page);assert.ok(r.scrollY>0,'focus elsewhere: PageDown scrolls the page as usual');assert.equal(r.s,15.5,'and does not move the object');
   await page.evaluate(()=>document.getElementById('screen').focus({preventScroll:true}));const y=r.scrollY;await page.keyboard.press('PageUp');await page.waitForTimeout(150);assert.equal((await info(page)).scrollY,y,'focused again: no page scroll');
   await ctx.close();
  });
  await check('keyboard: a locked draggable in focus leaves PageUp/PageDown to the page and does not move',async()=>{
   const {ctx,page}=await open(browser,{width:1280,height:800});   // Trial 1: the candle is locked but still focusable
   await page.evaluate(()=>document.getElementById('candle').focus({preventScroll:true}));
   assert.equal(await page.evaluate(()=>document.activeElement.id),'candle');
   await page.keyboard.press('PageDown');await page.waitForTimeout(250);
   let r=await info(page);assert.ok(r.scrollY>0,'page scrolled normally: '+r.scrollY);assert.equal(r.u,30,'locked candle did not move');assert.deepEqual(r.types,[]);
   const y=r.scrollY;await page.keyboard.press('ArrowRight');await page.keyboard.press('PageUp');await page.waitForTimeout(250);
   r=await info(page);assert.equal(r.u,30);assert.deepEqual(r.types,[]);assert.ok(r.scrollY<y,'PageUp also scrolls the page back up');
   await ctx.close();
  });
  await check('keyboard: Trial 2 candle needs three PageUp; edge keys do not settle',async()=>{
   const {ctx,page}=await open(browser,{width:1280,height:800});
   await page.evaluate(()=>{for(const a of [{type:'MOVE_SCREEN',position:15},{type:'RECORD'}])window.__optics.dispatch(a);window.__optics.actions.length=0});
   await page.focus('#candle');for(let i=0;i<3;i++)await page.keyboard.press('PageUp');await settle(page);
   const r=await info(page);assert.equal(r.u,15);assert.equal(r.phase,'trial2-find-screen');assert.ok(r.types.every(t=>t==='MOVE_CANDLE'));await ctx.close();
   const e=await open(browser,{width:1280,height:800});await e.page.evaluate(()=>window.__optics.dispatch({type:'MOVE_SCREEN',position:40}));await e.page.evaluate(()=>{window.__optics.actions.length=0});
   await e.page.focus('#screen');await e.page.keyboard.press('ArrowRight');await e.page.keyboard.press('PageUp');
   assert.ok(!(await info(e.page)).types.includes('SETTLE_SCREEN'));await e.ctx.close();
  });
  await check('computed touch-action: draggable none, bench pan-y',async()=>{
   const {ctx,page}=await open(browser,{width:390,height:844,touch:true});
   const ta=await page.evaluate(()=>['screen','candle','bench'].map(id=>getComputedStyle(document.getElementById(id)).touchAction));
   assert.deepEqual(ta,['none','none','pan-y']);await ctx.close();
  });
  await check('390 touch: dragging a handle moves it (1 cm snap) without scrolling or overflowing the page',async()=>{
   const {ctx,page,errors}=await open(browser,{width:390,height:844,touch:true});
   const rect=await page.evaluate(()=>window.__optics.rect()),c=await center(page,'screen');
   await touchDrag(page,c,{x:xOfCm(rect,15.4),y:c.y+60});
   const r=await info(page);assert.equal(r.s,15,'snapped to the nearest 1 cm');assert.equal(r.phase,'trial1-complete');assert.equal(r.types.at(-1),'SETTLE_SCREEN');
   assert.equal(r.scrollY,0,'no vertical page scroll while dragging');assert.equal(r.scrollX,0);assert.ok(r.overflow<=0,'no horizontal page overflow');assert.deepEqual(errors,[]);
   await ctx.close();
  });
  await check('390 touch: vertical swipes on empty bench and page areas still scroll (pan-y)',async()=>{
   const {ctx,page}=await open(browser,{width:390,height:844,touch:true});
   const rect=await page.evaluate(()=>window.__optics.rect());
   const blank={x:rect.x+rect.width*0.5,y:rect.y+20};
   await touchDrag(page,blank,{x:blank.x,y:blank.y-300},{steps:20});
   const r=await info(page);assert.ok(r.scrollY>50,'swipe starting on the bench scrolled the page: '+r.scrollY);assert.deepEqual(r.types,[],'and moved no object');
   await ctx.close();
  });
  await check('390 touch: a horizontal swipe on empty bench never scrolls the page sideways or moves objects',async()=>{
   const {ctx,page}=await open(browser,{width:390,height:844,touch:true});
   const rect=await page.evaluate(()=>window.__optics.rect());const blank={x:rect.x+rect.width*0.2,y:rect.y+20};
   await touchDrag(page,blank,{x:blank.x+200,y:blank.y});const r=await info(page);assert.equal(r.scrollX,0);assert.deepEqual(r.types,[]);await ctx.close();
  });
 }finally{await browser.close();server.close()}
 const failed=results.filter(r=>!r.pass);console.log(JSON.stringify({checked:results.length,failed:failed.length}));if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
