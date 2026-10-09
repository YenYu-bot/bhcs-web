// B4 gate (real browser part): the drawn bench of the guided buoyancy lab, checked by SVG/DOM geometry (not screenshots).
// Waterline direction, staying versus sinking, ballast, hit-overlay alignment, stable card height and layout at 1280 and 390.
// Needs Playwright (CI: NODE_PATH=/tmp/bhcs-composition/node_modules). Locally set PLAYWRIGHT_CHROMIUM_EXECUTABLE to reuse a browser.
// Review artifacts (screenshots of each representative state) go to buoyancy-view-artifacts/.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {guardContext,axeScan}=require('./buoyancy_guided_test_support.cjs');
const root=path.resolve(__dirname,'..');
const PAGE='/tools/science/buoyancy-guided.html';
const OUT=path.join(root,'buoyancy-view-artifacts');

const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return}
 const file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}
});

const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const info=p=>p.evaluate(()=>{const m=document.getElementById('main').dataset;return {phase:m.phase,slots:Number(m.slots),liquid:m.liquid,tank:m.tankObject,hint:document.getElementById('bg-hint').textContent,overflow:document.documentElement.scrollWidth-innerWidth}});
const hookDispatch=async(p,...actions)=>{for(const a of actions){const r=await p.evaluate(a=>{const x=window.__bgTest.dispatch(a);return {accepted:x.accepted,reason:x.reason}},a);assert.equal(r.accepted,true,`${JSON.stringify(a)} ${r.reason}`)}await settle(p)};
const click=async(p,name)=>{await p.getByRole('button',{name,exact:true}).click();await settle(p)};

// Everything is measured from the page: viewBox units are client px ÷ the scale of the svg.
const GEO=()=>{
 const svg=document.querySelector('.bg-svg'),r=svg.getBoundingClientRect(),k=r.width/750;
 const vu=b=>({left:(b.left-r.left)/k,top:(b.top-r.top)/k,right:(b.right-r.left)/k,bottom:(b.bottom-r.top)/k,w:b.width/k,h:b.height/k});
 const card=document.getElementById('bg-bench-card').getBoundingClientRect();
 const objects={};
 for(const id of ['block','wood','stone']){
  const art=document.querySelector(`[data-bg-art="${id}"]`),visible=getComputedStyle(art).display!=='none';
  const body=art.querySelector('[data-bg-body]').getBoundingClientRect(),btn=document.querySelector(`[data-bg-object="${id}"]`),hb=btn.getBoundingClientRect();
  objects[id]={visible,where:art.dataset.where,outcome:art.dataset.outcome,rect:vu(body),
   cells:[...art.querySelectorAll('[data-bg-cell]')].map(c=>({filled:c.classList.contains('is-filled'),shown:c.getAttribute('visibility')!=='hidden'})),
   waterlineShown:art.querySelector('[data-bg-objwaterline]').getAttribute('visibility')==='visible',
   hit:{cx:hb.left+hb.width/2,cy:hb.top+hb.height/2,w:hb.width,h:hb.height,hidden:btn.hidden},artCenter:{x:body.left+body.width/2,y:body.top+body.height/2},
   transition:getComputedStyle(art).transitionDuration};
 }
 const line=sel=>Number(document.querySelector(sel).getAttribute('y1'));
 const zone=document.querySelector('[data-bg-tank]').getBoundingClientRect();
 const water=document.querySelector('[data-bg-water]');
 return {k,scene:{w:r.width,h:r.height,left:r.left,top:r.top},card:{h:card.height,left:card.left,right:card.right,top:card.top,bottom:card.bottom},objects,
  surfaceY:line('[data-bg-surface]'),floorY:line('[data-bg-floor]'),frame:vu(document.querySelector('[data-bg-tank-frame]').getBoundingClientRect()),
  zone:{left:zone.left,right:zone.right,top:zone.top,bottom:zone.bottom},waterFill:getComputedStyle(water).fill,liquidLabel:document.querySelector('[data-bg-liquid-label]').textContent,
  viewBox:document.querySelector('.bg-svg').getAttribute('viewBox'),svgHidden:document.querySelector('.bg-svg').getAttribute('aria-hidden'),
  overflow:document.documentElement.scrollWidth-innerWidth,vw:innerWidth};
};
const geo=p=>p.evaluate(GEO);
const TOL=2.5;                                   // viewBox units: the 2-unit outline is part of what the browser reports
const near=(a,b,t,label)=>assert.ok(Math.abs(a-b)<=t,`${label}: ${a.toFixed(2)} vs ${b.toFixed(2)} (±${t})`);

async function open(browser,{width,height,touch=false,reduced=true}){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:reduced?'reduce':'no-preference'});
 const external=[];await guardContext(ctx,base,{hook:true,external});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(base+PAGE);await page.waitForSelector('#main[data-phase]');
 return {ctx,page,errors,external};
}
const clean=({errors,external})=>{assert.deepEqual(errors,[]);assert.deepEqual(external,[])};
const minHit=vw=>vw<=767?64:48;

/** Checks every state shares: stable card, no overflow, everything inside the scene, hit overlays aligned and big enough. */
async function common(p,label,ref){
 const g=await geo(p);
 assert.equal(g.viewBox,'0 0 750 420');assert.equal(g.svgHidden,'true','the drawing is decorative');
 assert.ok(g.overflow<=0,`${label}: page scrolls sideways by ${g.overflow}`);
 const phase=(await info(p)).phase,grp=phase==='mission'?'mission':phase.startsWith('trial3')?'t3':'t12';
 if(ref[grp]===undefined)ref[grp]=g.card.h;else near(g.card.h,ref[grp],0.6,`${label}: the bench card height changed within ${grp}`);
 assert.ok(g.scene.left>=g.card.left-0.5&&g.scene.left+g.scene.w<=g.card.right+0.5,`${label}: the scene is wider than its card`);
 assert.ok(g.frame.left>=0&&g.frame.right<=750&&g.frame.top>=0&&g.frame.bottom<=420,`${label}: the tank is outside the view`);
 assert.ok(g.zone.left>=0&&g.zone.right<=g.vw,`${label}: the whole tank is not on screen`);
 for(const [id,o] of Object.entries(g.objects)){
  if(!o.visible)continue;
  assert.ok(o.rect.left>=-TOL&&o.rect.right<=750+TOL&&o.rect.top>=-TOL&&o.rect.bottom<=420+TOL,`${label}: ${id} is outside the scene`);
  if(o.hit.hidden)continue;                  // nothing can be touched here (mission, or Trial 3 once observed): no overlay to align
  near(o.hit.cx,o.artCenter.x,2,`${label}: ${id} hit centre x`);near(o.hit.cy,o.artCenter.y,2,`${label}: ${id} hit centre y`);
  assert.ok(o.hit.w>=minHit(g.vw)-0.5&&o.hit.h>=minHit(g.vw)-0.5,`${label}: ${id} hit area ${o.hit.w.toFixed(1)}×${o.hit.h.toFixed(1)}`);
 }
 const clipped=await p.evaluate(()=>{const bad=[];for(const el of document.querySelectorAll('[data-bg-object]:not([hidden]),.bg-tool:not([hidden]),.bg-pill')){for(let a=el.parentElement;a&&a!==document.body;a=a.parentElement){const s=getComputedStyle(a);if(/(hidden|clip)/.test(s.overflowX+s.overflowY))bad.push((el.dataset.bgObject||el.textContent.trim())+' in '+(a.className||a.tagName))}}return bad});
 assert.deepEqual(clipped,[],`${label}: a focus ring could be clipped`);
 // Visual Pass V1 guards: no blank band between the parts of the bench, nothing paints over a control, tools are thumb-sized, the focus ring shows
 const parts=await p.evaluate(()=>{const kids=[...document.getElementById('bg-bench').children].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect());return kids.slice(1).map((r,i)=>r.top-kids[i].bottom)});
 for(const gap of parts)assert.ok(gap<=40,`${label}: a blank band of ${gap.toFixed(0)} px inside the bench`);
 const tops=await p.evaluate(()=>[...document.querySelectorAll('[data-bg-object]:not([hidden]),.bg-tool,.bg-pill input')].filter(e=>getComputedStyle(e).visibility!=='hidden'&&e.getBoundingClientRect().width>0).map(e=>{const r=e.getBoundingClientRect(),t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {id:e.dataset.bgObject||e.dataset.bgAction||e.className,ok:!!t&&(t===e||e.contains(t)||t.closest('label')===e.closest('label'))}}));
 for(const t of tops)assert.ok(t.ok,`${label}: something paints over ${t.id}`);
 const tools=await p.evaluate(()=>[...document.querySelectorAll('.bg-tool')].filter(e=>getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.bgAction,w:r.width,h:r.height}}));
 for(const t of tools)assert.ok(t.h>=minHit(g.vw)-0.5&&t.w>=minHit(g.vw)-0.5,`${label}: tool ${t.id} is ${t.w.toFixed(0)}×${t.h.toFixed(0)}`);
 await p.keyboard.press('Tab');
 const ring=await p.evaluate(()=>{const e=document.querySelector('[data-bg-object]:not([hidden])')||document.querySelector('.bg-tool:not([hidden])');if(!e)return null;e.focus({preventScroll:true});const c=getComputedStyle(e);const r={visible:e.matches(':focus-visible'),style:c.outlineStyle,width:parseFloat(c.outlineWidth)};e.blur();return r});
 if(ring)assert.ok(ring.visible&&ring.style!=='none'&&ring.width>=2,`${label}: focus ring ${JSON.stringify(ring)}`);
 const covered=await p.evaluate(()=>{const z=document.querySelector('[data-bg-tank]').getBoundingClientRect();const el=document.elementFromPoint(z.left+z.width/2,z.top+z.height*0.2);return !!el&&document.getElementById('bg-scene').contains(el)});
 assert.ok(covered,`${label}: something other than the scene covers the tank`);
 return g;
}
const shot=async(p,name,tag)=>{fs.mkdirSync(OUT,{recursive:true});await p.locator('#bg-bench-card').screenshot({path:path.join(OUT,`${tag}-${name}.png`)})};

let base;const results=[];
const check=async(name,fn)=>{const row={name};try{await fn();row.pass=true}catch(e){row.pass=false;row.error=e.message}results.push(row);console.log(JSON.stringify(row))};

async function walk(browser,{width,height,touch,tag}){
 const s=await open(browser,{width,height,touch});const p=s.page,ref={};
 await click(p,'開始實驗');
 const seen={};
 const at=async(label,fn)=>{await fn();seen[label]=await common(p,`${tag} ${label}`,ref);await shot(p,label,tag);return seen[label]};
 const M=await at('M-mission',async()=>{});
 assert.equal(M.objects.block.visible,true,'the block is on the table at the mission');assert.equal(M.objects.block.where,'table');assert.equal(M.objects.block.hit.hidden,true,'but nothing can be touched yet');
 assert.equal(M.objects.wood.visible||M.objects.stone.visible,false);
 await click(p,'動手試試看');

 const A=await at('A-table-60g',async()=>{});
 assert.equal(A.objects.block.where,'table');near(A.objects.block.rect.bottom,344,TOL,'block stands on the table line');assert.ok(A.objects.block.rect.right<=A.frame.left+0.5,'block is left of the tank');
 assert.equal(A.objects.wood.visible||A.objects.stone.visible,false);
 near(A.objects.block.rect.w,70,TOL,'block size');assert.equal(A.objects.block.cells.filter(c=>c.filled).length,1);
 const blockSize=A.objects.block.rect.w;

 const B=await at('B-float-60',async()=>{await click(p,'放入水中')});
 assert.equal(B.objects.block.outcome,'float');assert.equal(B.objects.block.waterlineShown,true);
 assert.ok(B.objects.block.rect.top<B.surfaceY&&B.objects.block.rect.bottom>B.surfaceY,'the surface cuts the block');
 near((B.objects.block.rect.bottom-B.surfaceY)/B.objects.block.rect.h,0.6,0.04,'60% under the surface');
 const aboveB=B.surfaceY-B.objects.block.rect.top;

 const exposed=(o,g)=>g.surfaceY-o.rect.top;
 const C=await at('C-float-80',async()=>{await click(p,'拿出來');await click(p,'加一個配重（+20 g）');await click(p,'放入水中')});
 near((C.objects.block.rect.bottom-C.surfaceY)/C.objects.block.rect.h,0.8,0.04,'80% under the surface');
 assert.ok(C.surfaceY-C.objects.block.rect.top<aboveB,'80% shows less above the surface than 60%');const aboveC=C.surfaceY-C.objects.block.rect.top;
 near(C.objects.block.rect.w,blockSize,0.6,'the block is as big with 3 cells as with 1');assert.equal(C.objects.block.cells.filter(c=>c.filled).length,2);

 const D=await at('D-stay-100g',async()=>{await click(p,'拿出來');await click(p,'加一個配重（+20 g）');await click(p,'放入水中')});
 assert.equal((await info(p)).phase,'trial1-complete');assert.equal(D.objects.block.outcome,'stay');assert.equal(D.objects.block.waterlineShown,false);
 assert.ok(D.objects.block.rect.top>=D.surfaceY+12-TOL,'a staying block is wholly under the surface');assert.ok(D.objects.block.rect.bottom<=D.floorY-24+TOL,'and clearly above the floor');
 assert.ok(D.floorY-D.objects.block.rect.bottom>=20,'a staying block does not look like a sunk one');

 const E=await at('E-sink-120g',async()=>{await click(p,'拿出來');await click(p,'加一個配重（+20 g）');await click(p,'放入水中')});
 assert.equal((await info(p)).phase,'trial1-complete','the phase does not go back');assert.equal(E.objects.block.outcome,'sink');near(E.objects.block.rect.bottom,E.floorY,TOL,'a sunk block rests on the floor');
 assert.ok(E.objects.block.rect.bottom-D.objects.block.rect.bottom>=20,'stay and sink are visibly different');
 assert.ok(E.objects.block.rect.left>=E.frame.left&&E.objects.block.rect.right<=E.frame.right&&E.objects.block.rect.bottom<=E.floorY+TOL&&E.objects.block.rect.top>=E.surfaceY,'a sunk block is wholly inside the tank');assert.equal(E.objects.block.cells.filter(c=>c.filled).length,4);

 await click(p,'拿出來');await click(p,'取下一個配重（−20 g）');await click(p,'放入水中');
 await click(p,'記錄第一次結果');
 assert.equal((await info(p)).phase,'trial2-switch-liquid');
 const sw=await common(p,`${tag} trial2 waiting`,ref);await shot(p,'trial2-waiting',tag);
 assert.equal(sw.objects.block.where,'table');assert.equal(sw.liquidLabel,'水');

 await p.locator('input[data-bg-liquid][value="brine"]').check();await settle(p);
 const F=await at('F-float-83-brine',async()=>{await click(p,'放入水中')});
 assert.equal(F.objects.block.outcome,'float');near((F.objects.block.rect.bottom-F.surfaceY)/F.objects.block.rect.h,0.8333,0.04,'83% under the surface');
 assert.ok(F.surfaceY-F.objects.block.rect.top<aboveB-5,'83% shows clearly less above the surface than 60%');
 assert.ok(aboveB>aboveC&&aboveC>exposed(F.objects.block,F)&&exposed(F.objects.block,F)>0,'the part above the surface shrinks steadily from 60% to 80% to 83%, and never vanishes');
 assert.equal(F.liquidLabel,'濃鹽水');assert.notEqual(F.waterFill,A.waterFill,'brine is drawn differently');
 near(F.surfaceY,A.surfaceY,0,'the surface line is the same');near(F.floorY,A.floorY,0,'and so is the floor');near(F.frame.w,A.frame.w,0.01,'and the tank');

 const G=await at('G-stay-120g-brine',async()=>{await click(p,'拿出來');await click(p,'加一個配重（+20 g）');await click(p,'放入水中')});
 assert.equal(G.objects.block.outcome,'stay');assert.ok(G.objects.block.rect.top>=G.surfaceY+12-TOL);assert.ok(G.objects.block.rect.bottom<=G.floorY-24+TOL);

 await click(p,'記錄第二次結果');await hookDispatch(p,{type:'CONTINUE'},{type:'ANSWER_COMPARE',question:'stayMass',answer:'larger'},{type:'ANSWER_COMPARE',question:'firstDrop',answer:'float'},{type:'CONTINUE'});
 assert.equal((await info(p)).phase,'trial3-drop');
 const J=await at('J-shelf',async()=>{});
 assert.equal(J.objects.block.visible,false);assert.ok(J.objects.wood.visible&&J.objects.stone.visible);
 assert.ok(J.objects.wood.rect.right<J.objects.stone.rect.left,'wood and stone do not overlap');
 assert.ok(J.objects.stone.rect.right<=J.frame.left,'the shelf ends before the tank');near(J.objects.wood.rect.bottom,344,TOL,'wood on the table');near(J.objects.stone.rect.bottom,344,TOL,'stone on the table');
 near(J.objects.wood.rect.w,119.7,TOL,'wood size');near(J.objects.stone.rect.w,51.6,TOL,'stone size');assert.ok(J.objects.wood.rect.w>2*J.objects.stone.rect.w-5,'the wood is much bigger than the stone');
 const wh=J.objects.wood.hit,sh=J.objects.stone.hit;assert.ok(Math.hypot(wh.cx-sh.cx,wh.cy-sh.cy)>=minHit(J.vw)-0.5||Math.abs(wh.cx-sh.cx)>=(wh.w+sh.w)/2-0.5,'the two hit areas do not overlap');

 const H=await at('H-wood',async()=>{await click(p,'把大木塊放入水中')});
 assert.equal(H.objects.wood.outcome,'float');near((H.objects.wood.rect.bottom-H.surfaceY)/H.objects.wood.rect.h,0.6,0.04,'wood 60% under the surface');
 assert.ok(H.objects.wood.rect.top>=H.frame.top-TOL,'the wood stays inside the tank');near(H.objects.wood.rect.w,119.7,TOL,'wood size');

 const I=await at('I-stone',async()=>{await click(p,'拿出來');await click(p,'把小石頭放入水中')});
 assert.ok(I.objects.stone.rect.left>=I.frame.left&&I.objects.stone.rect.right<=I.frame.right&&I.objects.stone.rect.bottom<=I.floorY+TOL,'the stone is wholly inside the tank');
 assert.equal((await info(p)).phase,'trial3-observed');assert.equal(I.objects.stone.outcome,'sink');near(I.objects.stone.rect.bottom,I.floorY,TOL,'the stone rests on the floor');near(I.objects.stone.rect.w,51.6,TOL,'stone size');
 assert.ok(ref.t3<ref.t12&&ref.mission<ref.t12,`the mission and trial 3 are compact: ${JSON.stringify(ref)}`);
 clean(s);await s.ctx.close();
 return seen;
}

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 fs.rmSync(OUT,{recursive:true,force:true});
 const browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{});
 try{
  await check('1280: every representative state is drawn right (A table, B 60%, C 80%, D stay, E sink, F 83% brine, G stay brine, H wood, I stone, J shelf)',()=>walk(browser,{width:1280,height:900,touch:false,tag:'desktop'}));
  await check('390: the same states, with 64 px hit areas, the whole tank on screen and no sideways scroll',()=>walk(browser,{width:390,height:844,touch:true,tag:'phone'}));

  await check('1280: the bench card keeps its height from the first trial to the second; the mission and trial 3 are compact, not blank',async()=>{
   const s=await open(browser,{width:1280,height:900});const p=s.page;await click(p,'開始實驗');const m0=(await geo(p)).card.h;await click(p,'動手試試看');const h0=(await geo(p)).card.h;
   assert.ok(m0<h0,'the mission does not reserve room for tools it does not have');
   await hookDispatch(p,{type:'ADD_BALLAST'},{type:'ADD_BALLAST'},{type:'PUT_IN',objectId:'block'},{type:'RECORD_TRIAL',trial:1});near((await geo(p)).card.h,h0,0.6,'trial 2 waiting');
   await hookDispatch(p,{type:'SELECT_LIQUID',liquidId:'brine'},{type:'PUT_IN',objectId:'block'});near((await geo(p)).card.h,h0,0.6,'trial 2 first drop');
   await hookDispatch(p,{type:'TAKE_OUT'},{type:'ADD_BALLAST'},{type:'PUT_IN',objectId:'block'},{type:'RECORD_TRIAL',trial:2},{type:'CONTINUE'},{type:'ANSWER_COMPARE',question:'stayMass',answer:'larger'},{type:'ANSWER_COMPARE',question:'firstDrop',answer:'float'},{type:'CONTINUE'});
   const t3=(await geo(p)).card.h;assert.ok(t3<h0,'trial 3 drops the tools it no longer has');
   await hookDispatch(p,{type:'PUT_IN',objectId:'wood'},{type:'TAKE_OUT'},{type:'PUT_IN',objectId:'stone'});near((await geo(p)).card.h,t3,0.6,'trial 3 observed');
   clean(s);await s.ctx.close();
  });
  await check('1280: the surface line, the floor and the tank are the same in water and brine',async()=>{
   const s=await open(browser,{width:1280,height:900});const p=s.page;await click(p,'開始實驗');await click(p,'動手試試看');await hookDispatch(p,{type:'ADD_BALLAST'},{type:'ADD_BALLAST'},{type:'PUT_IN',objectId:'block'},{type:'RECORD_TRIAL',trial:1});const a=await geo(p);
   await hookDispatch(p,{type:'SELECT_LIQUID',liquidId:'brine'});const b=await geo(p);
   near(b.surfaceY,a.surfaceY,0,'surface');near(b.floorY,a.floorY,0,'floor');near(b.frame.w,a.frame.w,0.01,'tank');assert.notEqual(b.waterFill,a.waterFill,'brine is drawn differently');
   clean(s);await s.ctx.close();
  });
  await check('1280: ballast cells fill one by one while the block\'s outline does not move',async()=>{
   const s=await open(browser,{width:1280,height:900});const p=s.page;await click(p,'開始實驗');await click(p,'動手試試看');
   const first=(await geo(p)).objects.block;
   for(let n=2;n<=6;n++){await click(p,'加一個配重（+20 g）');const b=(await geo(p)).objects.block;assert.equal(b.cells.filter(c=>c.filled).length,n);near(b.rect.w,first.rect.w,0.01,'width');near(b.rect.h,first.rect.h,0.01,'height');near(b.rect.left,first.rect.left,0.01,'left');near(b.rect.top,first.rect.top,0.01,'top')}
   for(let n=5;n>=0;n--){await click(p,'取下一個配重（−20 g）');assert.equal((await geo(p)).objects.block.cells.filter(c=>c.filled).length,n)}
   clean(s);await s.ctx.close();
  });
  await check('1280 drag: the picture follows the pointer but the engine decides; a refused drop goes back, an accepted one goes to its final pose',async()=>{
   const s=await open(browser,{width:1280,height:900});const p=s.page;await click(p,'開始實驗');await click(p,'動手試試看');
   const before=(await geo(p)).objects.block,start={x:before.hit.cx,y:before.hit.cy};
   await p.mouse.move(start.x,start.y);await p.mouse.down();await p.mouse.move(start.x+60,start.y-80,{steps:6});await p.mouse.move(640,40,{steps:6});
   const mid=await geo(p);near(mid.objects.block.artCenter.x,640,6,'the picture follows the pointer x');near(mid.objects.block.artCenter.y,40,6,'the picture follows the pointer y');
   assert.equal((await info(p)).tank,'','the engine has not moved it');
   await p.mouse.up();await settle(p);
   const back=await geo(p);near(back.objects.block.rect.bottom,344,TOL,'a refused drop goes back to the table');near(back.objects.block.artCenter.x,before.artCenter.x,2,'to where it was');
   assert.equal((await info(p)).tank,'');
   const zone=back.zone;await p.mouse.move(back.objects.block.hit.cx,back.objects.block.hit.cy);await p.mouse.down();await p.mouse.move((zone.left+zone.right)/2,(zone.top+zone.bottom)/2,{steps:8});await p.mouse.up();await settle(p);
   const inTank=await geo(p);assert.equal((await info(p)).tank,'block');assert.equal(inTank.objects.block.outcome,'float');near((inTank.objects.block.rect.bottom-inTank.surfaceY)/inTank.objects.block.rect.h,0.6,0.04,'final pose after the drop');
   clean(s);await s.ctx.close();
  });
  await check('motion: reduced motion shows the final pose at once; with motion the move takes at most 0.9 s and ends in the same pose',async()=>{
   const r=await open(browser,{width:1280,height:900,reduced:true});await click(r.page,'開始實驗');await click(r.page,'動手試試看');await click(r.page,'放入水中');
   const rg=await geo(r.page);assert.equal(rg.objects.block.transition,'0s');assert.equal(rg.objects.block.outcome,'float');near((rg.objects.block.rect.bottom-rg.surfaceY)/rg.objects.block.rect.h,0.6,0.04,'immediately in place');
   clean(r);await r.ctx.close();
   const m=await open(browser,{width:1280,height:900,reduced:false});await click(m.page,'開始實驗');await click(m.page,'動手試試看');
   const t0=(await geo(m.page)).objects.block;await m.page.getByRole('button',{name:'放入水中',exact:true}).click();
   const dur=Number((await geo(m.page)).objects.block.transition.replace('s',''));assert.ok(dur>0&&dur<=0.9,`transition ${dur}s`);
   await m.page.waitForTimeout(1100);const t1=await geo(m.page);assert.equal(t1.objects.block.outcome,'float');near((t1.objects.block.rect.bottom-t1.surfaceY)/t1.objects.block.rect.h,0.6,0.04,'ends in the same pose');
   assert.ok(t1.objects.block.rect.top<t0.rect.top,'it moved');
   assert.equal((await info(m.page)).tank,'block','the engine had already decided');
   clean(m);await m.ctx.close();
  });
  await check('390: the bench does not jump when the first object goes into the tank, and a locked object looks locked',async()=>{
   const s=await open(browser,{width:390,height:844,touch:true});const p=s.page;await click(p,'開始實驗');await click(p,'動手試試看');
   const a=await geo(p);await p.getByRole('button',{name:'放入水中',exact:true}).tap();const b=await geo(p);
   near(b.card.h,a.card.h,0.6,'card height');near(b.scene.h,a.scene.h,0.6,'scene height');
   await hookDispatch(p,{type:'TAKE_OUT'},{type:'ADD_BALLAST'},{type:'ADD_BALLAST'},{type:'PUT_IN',objectId:'block'},{type:'RECORD_TRIAL',trial:1});
   const lockedArt=await p.evaluate(()=>document.querySelector('[data-bg-art="block"]').classList.contains('is-locked'));assert.equal(lockedArt,true);
   clean(s);await s.ctx.close();
  });
  for(const [w,h,touch] of [[1280,900,false],[390,844,true]]){
   await check(`${w} axe: table, floating, staying, sinking, brine and shelf, with the drawing in place`,async()=>{
    const s=await open(browser,{width:w,height:h,touch});const p=s.page;await click(p,'開始實驗');await click(p,'動手試試看');await axeScan(p,`${w} table`);
    await hookDispatch(p,{type:'PUT_IN',objectId:'block'});await axeScan(p,`${w} float`);
    await hookDispatch(p,{type:'TAKE_OUT'},{type:'ADD_BALLAST'},{type:'ADD_BALLAST'},{type:'PUT_IN',objectId:'block'});await axeScan(p,`${w} stay`);
    await hookDispatch(p,{type:'TAKE_OUT'},{type:'ADD_BALLAST'},{type:'PUT_IN',objectId:'block'});await axeScan(p,`${w} sink`);
    await hookDispatch(p,{type:'TAKE_OUT'},{type:'REMOVE_BALLAST'},{type:'PUT_IN',objectId:'block'},{type:'RECORD_TRIAL',trial:1},{type:'SELECT_LIQUID',liquidId:'brine'},{type:'PUT_IN',objectId:'block'});await axeScan(p,`${w} brine`);
    await hookDispatch(p,{type:'TAKE_OUT'},{type:'ADD_BALLAST'},{type:'PUT_IN',objectId:'block'},{type:'RECORD_TRIAL',trial:2},{type:'CONTINUE'},{type:'ANSWER_COMPARE',question:'stayMass',answer:'larger'},{type:'ANSWER_COMPARE',question:'firstDrop',answer:'float'},{type:'CONTINUE'});
    await axeScan(p,`${w} shelf`);await hookDispatch(p,{type:'PUT_IN',objectId:'wood'});await axeScan(p,`${w} wood`);
    clean(s);await s.ctx.close();
   });
  }
 }finally{await browser.close();server.close()}
 const failed=results.filter(r=>!r.pass);
 console.log(JSON.stringify({checked:results.length,failed:failed.length,output:OUT}));
 if(failed.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
