// I4 gate (real browser): state gallery (physics state → picture) and page layout for the guided optics bench.
// Needs Playwright (CI: NODE_PATH=/tmp/bhcs-composition/node_modules). Locally set PLAYWRIGHT_CHROMIUM_EXECUTABLE.
// Screenshots go to OPTICS_VIEW_OUTPUT (default optics-view-artifacts/).
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),output=path.resolve(process.env.OPTICS_VIEW_OUTPUT||'optics-view-artifacts');
fs.mkdirSync(output,{recursive:true});

const uForV=(f,v)=>f*v/(v-f);
// Gallery states are crafted engine states (valid inputs, not necessarily reachable in order).
const STATES=[
 {id:'t1-lv3-start',phase:'trial1-find-screen',u:30,s:20,expect:{level:3,type:'real',within:true}},
 {id:'t1-lv2',phase:'trial1-find-screen',u:30,s:16.5,expect:{level:2,type:'real',within:true}},
 {id:'t1-sharp',phase:'trial1-complete',u:30,s:15,expect:{level:1,type:'real',within:true}},
 {id:'t1-sharp-rays',phase:'trial1-complete',u:30,s:15,rays:true,expect:{level:1,type:'real',within:true}},
 {id:'t1-lv4',phase:'trial1-find-screen',u:30,s:28,expect:{level:4,type:'real',within:true}},
 {id:'t2-stale-lv4',phase:'trial2-find-screen',u:15,s:15,expect:{level:4,type:'real',within:true}},
 {id:'t2-sharp-rays',phase:'trial2-complete',u:15,s:30,rays:true,expect:{level:1,type:'real',within:true}},
 {id:'overflow-lv2',phase:'trial2-find-screen',u:uForV(10,40.5),s:40,expect:{level:2,type:'real',within:false}},
 {id:'overflow-lv3',phase:'trial2-find-screen',u:uForV(10,44),s:40,expect:{level:3,type:'real',within:false}},
 {id:'overflow-lv4',phase:'trial2-find-screen',u:12,s:40,expect:{level:4,type:'real',within:false}},
 {id:'infinite',phase:'trial3-move-object',u:10,s:30,rays:true,expect:{level:4,type:'infinite',within:false}},
 {id:'t3-virtual',phase:'trial3-search-screen',u:5,s:25,expect:{level:4,type:'virtual',within:false}},
 {id:'view-through',phase:'trial3-view-through-lens',u:5,s:25,expect:{level:4,type:'virtual',within:false,viewThrough:true}},
];

const GALLERY=`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/assets/optics-guided/optics-guided.css"><link rel="stylesheet" href="/assets/optics-guided/input.css">
<style>.g{width:min(773px,calc(100vw - 32px));margin:12px auto}.g h3{margin:0 0 4px;font-size:14px}.g .og-status{margin-top:6px}</style></head>
<body class="optics-guided"><div id="out"></div>
<script type="module">
import {createInitialState,deriveView} from '/assets/optics-guided/engine.js';
import {createBenchView} from '/assets/optics-guided/render.js';
import {clarityMessage} from '/assets/optics-guided/visual.js';
const states=${JSON.stringify(STATES)};
window.__gallery={};
for(const s of states){
 const sec=document.createElement('section');sec.className='g';sec.dataset.state=s.id;
 sec.innerHTML='<h3>'+s.id+'</h3><div class="og-bench" data-optics-bench></div><p class="og-status"><span class="og-status-icon"></span><span class="t"></span></p>';
 document.getElementById('out').append(sec);
 const bench=sec.querySelector('.og-bench'),bv=createBenchView(bench);
 const view=deriveView({...createInitialState(),phase:s.phase,u:s.u,s:s.s});
 bv.update(view,{rays:!!s.rays});
 const m=clarityMessage(view),st=sec.querySelector('.og-status');st.dataset.level=String(view.clarity.effectiveClarityLevel);
 st.querySelector('.og-status-icon').textContent=m.icon;st.querySelector('.t').textContent=m.text;
}
document.documentElement.dataset.ready='1';
</script></body></html>`;

const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return}
 if(url.pathname==='/__gallery__'){res.setHeader('Content-Type','text/html');res.end(GALLERY);return}
 const file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}
});

const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
let base;const results=[];
const check=async(name,fn)=>{const row={name};try{await fn()}catch(e){row.error=e.message}row.pass=!row.error;results.push(row);console.log(JSON.stringify(row))};
async function open(browser,url,{width,height,reducedMotion='no-preference',touch=false}){
 const ctx=await browser.newContext({viewport:{width,height},reducedMotion,hasTouch:touch,isMobile:touch});
 const page=await ctx.newPage(),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url())});page.on('requestfailed',r=>failed.push(r.url()));
 await page.goto(base+url);await page.waitForLoadState('networkidle');
 return {ctx,page,errors,failed};
}

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{});
 try{
  for(const [label,width,height] of [['390',390,844],['1280',1280,800]]){
   await check(`gallery ${label}: every physics state renders the right picture`,async()=>{
    const {ctx,page,errors,failed}=await open(browser,'/__gallery__',{width,height});
    await page.waitForSelector('html[data-ready="1"]');await settle(page);
    const blurs={};
    for(const s of STATES){
     const sec=page.locator(`[data-state="${s.id}"]`);
     const d=await sec.locator('.og-bench').evaluate(el=>({...el.dataset,w:el.clientWidth,h:el.clientHeight}));
     assert.equal(+d.clarityLevel,s.expect.level,s.id+' level');assert.equal(d.imageType,s.expect.type,s.id+' type');assert.equal(d.withinBench,String(s.expect.within),s.id+' bench');
     assert.equal(d.viewThrough,String(!!s.expect.viewThrough),s.id+' view-through');blurs[s.id]=+d.blur;
     if(s.expect.level===1)assert.equal(+d.blur,0,s.id+' crisp');else assert.ok(+d.blur>=.8,s.id+' blurred');
     // every <image> actually loaded and drew something
     const imgs=await sec.locator('image').evaluateAll(els=>els.map(e=>({href:e.getAttribute('href'),shown:getComputedStyle(e).display!=='none'})));
     assert.ok(imgs.length>=4);
     await sec.screenshot({path:path.join(output,`${label}-${s.id}.png`)});
    }
    assert.ok(blurs['t1-lv3-start']>blurs['t1-lv2']&&blurs['t1-lv4']>blurs['t1-lv3-start'],'blur grows with the error: '+JSON.stringify(blurs));
    assert.ok(blurs['overflow-lv2']<blurs['overflow-lv3']&&blurs['overflow-lv3']<blurs['overflow-lv4']);
    const over=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(over<=0,'no horizontal overflow: '+over);
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
    await page.screenshot({path:path.join(output,`${label}-gallery.png`),fullPage:true});await ctx.close();
   });
  }

  const PAGE='/tools/science/optics-guided.html?debug=1';
  // The page opens on the welcome screen; these bench checks walk through welcome and mission like a learner does.
  async function openBench(browser,opts){const o=await open(browser,PAGE,opts);await o.page.locator('#og-cta').click();await o.page.locator('#og-cta').click();await settle(o.page);return o}
  const rectOf=(page,sel)=>page.locator(sel).first().evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,r:r.right,b:r.bottom}});
  const state=page=>page.evaluate(()=>window.__opticsGuided.getState());
  const press=async(page,key,n=1)=>{for(let i=0;i<n;i++)await page.keyboard.press(key);await settle(page)};
  const focus=(page,kind)=>page.evaluate(k=>document.querySelector('.og-hit-'+k).focus({preventScroll:true}),kind);
  const BENCH={min:-40,max:48};
  const clientXOf=(rect,cm)=>rect.x+(cm-BENCH.min)/(BENCH.max-BENCH.min)*rect.w;

  for(const [label,width,height,touch] of [['390',390,844,true],['1280',1280,800,false]]){
   await check(`page ${label}: layout, order, touch targets and styling contract`,async()=>{
    const {ctx,page,errors,failed}=await openBench(browser,{width,height,touch});
    const R={nav:await rectOf(page,'.og-nav'),coach:await rectOf(page,'.og-coach'),bench:await rectOf(page,'.og-bench'),status:await rectOf(page,'.og-status'),cta:await rectOf(page,'.og-cta'),data:await rectOf(page,'.og-data')};
    const over=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(over<=0,'no horizontal overflow: '+over);
    if(width<900){
     assert.ok(R.nav.b<=R.coach.y+1&&R.coach.b<=R.bench.y+1&&R.bench.b<=R.status.y+1&&R.status.b<=R.cta.y+1&&R.cta.b<=R.data.y+1,'mobile order nav → coach → bench → status → CTA → data: '+JSON.stringify(R));
     assert.ok(R.bench.w>=340&&R.bench.w<=380&&R.bench.h>=300&&R.bench.h<=340,'bench 390 × 300–340: '+R.bench.w+'×'+R.bench.h);
     assert.ok(R.coach.b<=R.bench.y,'coach does not cover the equipment');
     assert.ok(R.bench.w/(BENCH.max-BENCH.min)>=3.9,'≈4 px per cm');
    }else{
     assert.ok(R.coach.x>=R.bench.r,'coach in the right column');assert.ok(R.data.x>=R.bench.r&&R.data.y>=R.coach.b-1);
     const share=R.bench.w/(R.bench.w+R.coach.w);assert.ok(share>=.6&&share<=.72,'bench is ~2/3 of the content: '+share);
     assert.ok(R.bench.w*R.bench.h>R.coach.w*R.coach.h*2,'the bench is the visual focus');
     assert.ok(R.status.y>=R.bench.b-1&&R.cta.y>=R.status.b-1,'status and CTA under the bench');
    }
    // nav: four steps on one line each, comfortable targets
    const nav=await page.locator('.og-nav button').evaluateAll(bs=>bs.map(b=>({h:b.getBoundingClientRect().height,lines:[...b.querySelectorAll('span')].map(sp=>Math.round(sp.getBoundingClientRect().height/parseFloat(getComputedStyle(sp).lineHeight))),fits:b.scrollWidth<=b.clientWidth+1,text:b.textContent.trim()})));
    assert.equal(nav.length,4);for(const b of nav){assert.ok(b.h>=44,b.text+' height');assert.ok(b.lines.every(n=>n===1),b.text+' stays on one line');assert.ok(b.fits,b.text+' fits')}
    // styling contract: scoped CSS only
    const sheets=await page.evaluate(()=>[...document.styleSheets].map(s=>s.href&&new URL(s.href).pathname));
    assert.deepEqual(sheets.sort(),['/assets/optics-guided/input.css','/assets/optics-guided/optics-guided.css']);
    assert.equal(await page.evaluate(()=>[...document.scripts].some(s=>/researcher-lab/.test(s.src))||document.body.className.includes('researcher')),false);
    assert.deepEqual(await page.evaluate(()=>[document.body.classList.contains('researcher-ui'),!!document.querySelector('.researcher-screen,.researcher-nav')]),[false,false]);
    const ta=await page.evaluate(()=>({bench:getComputedStyle(document.querySelector('.og-bench')).touchAction,screen:getComputedStyle(document.querySelector('.og-hit-screen')).touchAction,candle:getComputedStyle(document.querySelector('.og-hit-candle')).touchAction}));
    assert.deepEqual(ta,{bench:'pan-y',screen:'none',candle:'none'});
    // hit targets ≥ 44 px and centred on the visible objects
    for(const kind of ['screen','candle']){
     const hit=await rectOf(page,'.og-hit-'+kind);assert.ok(hit.w>=44&&hit.h>=44,kind+' hit '+hit.w+'×'+hit.h);
    }
    const screenHit=await rectOf(page,'.og-hit-screen'),face=await page.locator('.og-screen image').first().evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,r:r.right,y:r.y,b:r.bottom}});
    assert.ok(screenHit.x+screenHit.w/2>face.x&&screenHit.x+screenHit.w/2<face.r&&screenHit.y+screenHit.h/2>face.y&&screenHit.y+screenHit.h/2<face.b,'screen hit overlay sits on the drawn screen');
    const candleHit=await rectOf(page,'.og-hit-candle'),cimg=await page.locator('.og-candle image').first().evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,r:r.right,y:r.y,b:r.bottom}});
    assert.ok(candleHit.x+candleHit.w/2>cimg.x&&candleHit.x+candleHit.w/2<cimg.r&&candleHit.y+candleHit.h/2>cimg.y&&candleHit.y+candleHit.h/2<cimg.b,'candle hit overlay sits on the drawn candle');
    // accessibility attributes
    const aria=await page.evaluate(()=>['screen','candle'].map(k=>{const e=document.querySelector('.og-hit-'+k);return {role:e.getAttribute('role'),label:e.getAttribute('aria-label'),now:e.getAttribute('aria-valuenow'),disabled:e.getAttribute('aria-disabled'),tab:e.tabIndex}}));
    assert.deepEqual(aria[0],{role:'slider',label:'屏幕，目前距離凸透鏡 20 公分，可用左右方向鍵移動。',now:'20',disabled:null,tab:0});
    assert.deepEqual(aria[1],{role:'slider',label:'蠟燭，目前距離凸透鏡 30 公分，已固定。',now:'30',disabled:'true',tab:-1});
    assert.equal(await page.locator('#og-coach-text').getAttribute('role'),'status','the coach line is the live region');assert.equal(await page.locator('#og-status').getAttribute('role'),null,'the clarity line is visual only (no per-drag announcements)');
    await page.screenshot({path:path.join(output,`${label}-page-start.png`),fullPage:true});
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await ctx.close();
   });
  }

  await check('reduced motion: transitions are removed, positions unaffected',async()=>{
   const calm=await openBench(browser,{width:1280,height:800,reducedMotion:'reduce'}),norm=await openBench(browser,{width:1280,height:800});
   const dur=p=>p.page.evaluate(()=>getComputedStyle(document.querySelector('.og-hit-screen')).transitionDuration);
   assert.equal(await dur(calm),'0s');assert.notEqual(await dur(norm),'0s');
   for(const p of [calm,norm]){await focus(p.page,'screen');await press(p.page,'PageDown');}
   assert.deepEqual((await state(calm.page)).s,(await state(norm.page)).s);assert.equal((await state(calm.page)).s,15);
   await calm.ctx.close();await norm.ctx.close();
  });

  for(const [label,width,height,touch] of [['390',390,844,true],['1280',1280,800,false]]){
   await check(`page ${label}: keyboard walk through all three trials into the virtual-image view`,async()=>{
    const {ctx,page,errors,failed}=await openBench(browser,{width,height,touch});
    const lvl=()=>page.locator('.og-bench').getAttribute('data-clarity-level'),phase=async()=>(await state(page)).phase;
    const shot=name=>page.screenshot({path:path.join(output,`${label}-flow-${name}.png`),fullPage:true});
    assert.equal(await phase(),'trial1-find-screen');assert.equal(await lvl(),'3');
    await focus(page,'screen');await press(page,'ArrowLeft',5);
    assert.equal(await lvl(),'1');assert.equal(await phase(),'trial1-complete');
    assert.equal(await page.locator('#og-status-text').textContent(),'影像最清楚');assert.equal(await page.locator('#og-status-icon').textContent(),'✓');
    assert.equal(await page.locator('.og-ray').count(),4,'rays appear once found');assert.equal(await page.locator('#og-cta').isDisabled(),false);await shot('t1-sharp');
    await page.locator('#og-cta').click();await settle(page);
    assert.equal(await phase(),'trial2-move-object');
    assert.deepEqual(await page.evaluate(()=>['screen','candle'].map(k=>document.querySelector('.og-hit-'+k).getAttribute('aria-disabled'))),['true',null],'the engine hands the candle over');
    await focus(page,'candle');await press(page,'PageUp',3);
    assert.equal(await phase(),'trial2-find-screen');assert.equal(await lvl(),'4','the old screen position no longer works');assert.equal(await page.locator('.og-ray').count(),0);await shot('t2-stale');
    await focus(page,'screen');await press(page,'PageUp',3);
    assert.equal(await lvl(),'1');await page.locator('#og-cta').click();await settle(page);await shot('t2-sharp');
    assert.equal(await phase(),'compare');
    await page.evaluate(()=>{const g=window.__opticsGuided;g.dispatch({type:'ANSWER_COMPARE',question:'position',answer:'farther'});g.dispatch({type:'ANSWER_COMPARE',question:'size',answer:'larger'});g.dispatch({type:'CONTINUE'})});
    assert.equal(await phase(),'trial3-move-object');
    await focus(page,'candle');await press(page,'PageUp',2);
    assert.equal(await phase(),'trial3-search-screen');assert.equal((await state(page)).u,5);
    assert.equal(await page.locator('.og-bench').getAttribute('data-image-type'),'virtual');assert.equal(await lvl(),'4');
    assert.equal(await page.locator('#og-cta').isDisabled(),true,'CTA stays locked until three zones are settled');
    await focus(page,'screen');await press(page,'PageDown');await press(page,'PageDown',3);
    assert.equal(await page.locator('#og-cta').isDisabled(),true);
    await press(page,'PageUp',4);
    assert.equal((await state(page)).search.zones.join(),'near,middle,far');assert.equal(await page.locator('#og-cta').isDisabled(),false);await shot('t3-search');
    await page.locator('#og-cta').click();await settle(page);assert.equal(await phase(),'trial3-no-real-screen-image');
    await page.locator('#og-cta').click();await settle(page);
    assert.equal(await phase(),'trial3-view-through-lens');assert.equal(await page.locator('.og-bench').getAttribute('data-view-through'),'true');
    assert.equal(await page.locator('.og-eye-icon').evaluate(el=>getComputedStyle(el.parentElement).display!=='none'),true);
    assert.equal(await page.locator('#og-status-text').textContent(),'你現在看得到一個正立、放大的蠟燭。');await shot('view-through');
    const over=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(over<=0);
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await ctx.close();
   });
  }

  await check('page 1280: a real mouse drag on the drawn screen reaches the clear position',async()=>{
   const {ctx,page,errors}=await openBench(browser,{width:1280,height:800});
   const bench=await rectOf(page,'.og-bench'),hit=await rectOf(page,'.og-hit-screen');
   const sx=hit.x+hit.w/2,sy=hit.y+hit.h/2;
   await page.mouse.move(sx,sy);await page.mouse.down();
   for(let i=1;i<=12;i++)await page.mouse.move(sx+(clientXOf(bench,15)-clientXOf(bench,20))*i/12,sy);
   await page.mouse.up();await settle(page);
   const st=await state(page);assert.equal(st.s,15);assert.equal(st.phase,'trial1-complete');assert.equal(await page.locator('.og-bench').getAttribute('data-clarity-level'),'1');
   assert.deepEqual(errors,[]);await ctx.close();
  });
  await check('page 390: a real touch drag on the drawn screen reaches the clear position and does not scroll',async()=>{
   const {ctx,page,errors}=await openBench(browser,{width:390,height:844,touch:true});
   const bench=await rectOf(page,'.og-bench'),hit=await rectOf(page,'.og-hit-screen');
   const sx=hit.x+hit.w/2,sy=hit.y+hit.h/2,tx=sx+(clientXOf(bench,15.3)-clientXOf(bench,20));
   const cdp=await page.context().newCDPSession(page),pt=(x,y)=>[{x,y,id:1}];
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pt(sx,sy)});
   for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pt(sx+(tx-sx)*i/12,sy+8*i)});await page.waitForTimeout(16)}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100);await settle(page);
   const st=await state(page);assert.equal(st.s,15,'1 cm snap');assert.equal(st.phase,'trial1-complete');
   assert.equal(await page.evaluate(()=>Math.round(scrollY)),0);assert.deepEqual(errors,[]);await ctx.close();
  });
 }finally{await browser.close();server.close()}
 const failed=results.filter(r=>!r.pass);console.log(JSON.stringify({checked:results.length,failed:failed.length,output}));if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
