// B3 browser gate: the drawn bench of the guided microscope page, checked by SVG/DOM geometry (not screenshots) at 390 / 768 / 1280.
// Eyepiece and overview both visible and laid out as designed, 4× geometry sync, 10× partial clipping, 40× B only, the field-of-view
// ring, one live region, axe, no external requests, no console errors.
// Needs Playwright (NODE_PATH=/opt/node-tools/node_modules locally). Set MICROSCOPE_ARTIFACTS=dir to keep screenshots for review.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createServer,guardContext,axeScan,launchOptions}=require('./microscope_guided_test_support.cjs');
const PAGE='/tools/science/microscope-guided.html';
const OUT=process.env.MICROSCOPE_ARTIFACTS;

const TO_TRIAL1=[{type:'START'},{type:'BEGIN'}];
const TO_COMPARE1=[...TO_TRIAL1,{type:'SET_STAGE',x:75,y:0},{type:'RECORD'},{type:'SET_STAGE',x:0,y:75},{type:'RECORD'}];
const TO_TRIAL2_LOW=[...TO_COMPARE1,{type:'ANSWER_COMPARE',compare:'direction',question:'relation',answer:'opposite'},{type:'CONTINUE'}];
const TO_HIGH=[...TO_TRIAL2_LOW,{type:'SET_STAGE',x:0,y:0},{type:'RECORD'}];
const TO_COMPARE2=[...TO_HIGH,{type:'SET_OBJECTIVE',objective:40},{type:'RECORD'}];
const SAVE=(fields)=>({type:'SAVE_CONCLUSION',fields});
const CH=(id,step,choice)=>({type:'ANSWER_CHALLENGE',id,step,choice});
const TO_CONCEPT=[...TO_COMPARE2,{type:'ANSWER_COMPARE',compare:'magnification',question:'field',answer:'smaller'},{type:'ANSWER_COMPARE',compare:'magnification',question:'count',answer:'fewer'},{type:'CONTINUE'}];

const near=(a,b,tol,msg)=>assert.ok(Math.abs(a-b)<=tol,`${msg}: expected ${b}, got ${a}`);
const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const jump=async(p,actions)=>{for(const a of actions){const r=await p.evaluate(a=>{const x=window.__mgTest.dispatch(a);return {accepted:x.accepted,reason:x.reason}},a);assert.equal(r.accepted,true,`${JSON.stringify(a)} -> ${r.reason}`)}await settle(p)};
const shot=async(p,name)=>{if(OUT){fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true})}};

// Everything measured from the page. Eyepiece units are client px / (svg width / 600); overview units are client px / (svg width / 340).
const GEO=()=>{
 const eye=document.querySelector('.mg-eyepiece'),er=eye.getBoundingClientRect(),ek=er.width/600;
 const ov=document.querySelector('.mg-overview'),or=ov.getBoundingClientRect(),ok=or.width/340;
 const field=document.querySelector('[data-role="field"]').getBoundingClientRect();
 const marker=id=>{
  const g=eye.querySelector(`[data-role="clipped-layer"] > [data-feature="${id}"]`);if(!g)return null;
  const m=g.getScreenCTM(),shown=getComputedStyle(g).display!=='none',r=g.getBoundingClientRect();
  return {x:(m.e-er.left)/ek,y:(m.f-er.top)/ek,shown,visible:g.getAttribute('data-visible'),inside:g.getAttribute('data-fully-inside'),rect:r};
 };
 const ring=document.querySelector('[data-role="fov-ring"]').getBoundingClientRect();
 const doc=document.documentElement;
 return {
  eye:{x:er.left,y:er.top,w:er.width,h:er.height,k:ek},ov:{x:or.left,y:or.top,w:or.width,h:or.height,k:ok},
  field:{cx:field.left+field.width/2,cy:field.top+field.height/2,r:field.width/2},
  ringR:ring.width/2/ok,markers:Object.fromEntries(['e','A','B','C'].map(id=>[id,marker(id)])),
  overflow:doc.scrollWidth>doc.clientWidth,vw:doc.clientWidth,
  live:document.querySelectorAll('[aria-live]').length,status:document.querySelectorAll('[role="status"],[role="alert"]').length,
 };
};
// Is the point (in eyepiece units) painted by marker `id`? Clipped-away parts are not hit-testable.
const hit=(p,id,x,y)=>p.evaluate(({id,x,y})=>{
 const eye=document.querySelector('.mg-eyepiece'),r=eye.getBoundingClientRect(),k=r.width/600;
 return document.elementsFromPoint(r.left+x*k,r.top+y*k).some(el=>el.closest(`[data-feature="${id}"]`)&&el.closest('[data-role="clipped-layer"]'));
},{id,x,y});

(async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,r));
 const base=`http://localhost:${server.address().port}`;
 const browser=await chromium.launch(launchOptions());
 const external=[],errors=[];let checks=0;const ok=m=>{checks++;console.log('PASS',m)};
 try{
  for(const width of [1280,768,390]){
   const ctx=await browser.newContext({viewport:{width,height:900}});
   await guardContext(ctx,base,{hook:true,external});
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.goto(base+PAGE);await settle(page);
   const tag=`${width}`;
   await shot(page,`${tag}-welcome`);await axeScan(page,`${tag} welcome`);
   await jump(page,TO_TRIAL1);await shot(page,`${tag}-trial1`);

   // ---- layout -------------------------------------------------------------------------------------------------
   let g=await page.evaluate(GEO);
   assert.equal(g.overflow,false,`${tag}: no horizontal overflow`);
   assert.ok(g.eye.w>=240&&g.eye.h>=240,`${tag}: the eyepiece is a usable size (${g.eye.w})`);
   near(g.eye.w,g.eye.h,1,`${tag}: the eyepiece is square`);
   assert.ok(g.ov.w>=300,`${tag}: the overview is not decoration (${g.ov.w})`);
   near(g.ov.w/g.ov.h,340/220,0.03,`${tag}: the overview keeps its 340 x 220 proportion`);
   assert.ok(g.eye.x>=0&&g.eye.x+g.eye.w<=g.vw+0.5&&g.ov.x>=0&&g.ov.x+g.ov.w<=g.vw+0.5,`${tag}: both views are inside the viewport width`);
   if(width>=960)assert.ok(g.eye.x+g.eye.w<=g.ov.x+1&&Math.abs(g.eye.y-g.ov.y)<60,`${tag}: eyepiece left, stage right`);
   else assert.ok(g.eye.y+g.eye.h<=g.ov.y+1,`${tag}: eyepiece above the stage (stacked)`);
   ok(`${tag}: eyepiece and overview are visible, sized and laid out as designed, no horizontal overflow`);

   // ---- 4× geometry sync: the drawn marker sits where the model says ------------------------------------------------
   near(g.markers.e.x,420,0.1,`${tag}: 4× e x`);near(g.markers.e.y,300,0.1,`${tag}: 4× e y`);
   const f=g.field;near(f.r,270*g.eye.k,0.6,`${tag}: the field is 270 units`);near(f.cx,g.eye.x+300*g.eye.k,0.6,`${tag}: field centred`);
   near(g.ringR,75,0.6,`${tag}: 4× ring radius`);
   assert.equal(g.live,1,`${tag}: one live region`);assert.equal(g.status,0,`${tag}: no status or alert roles`);
   ok(`${tag}: 4× marker position, field size and FOV ring agree with the model`);

   // ---- move the stage: eyepiece and overview change together -------------------------------------------------------
   const slide0=await page.evaluate(()=>document.querySelector('.mg-slide-glass').getBoundingClientRect().left);
   await jump(page,[{type:'MOVE_STAGE',dx:30,dy:0}]);
   const g2=await page.evaluate(GEO),slide1=await page.evaluate(()=>document.querySelector('.mg-slide-glass').getBoundingClientRect().left);
   near(g2.markers.e.x,420-1.6*30,0.1,`${tag}: the e moved left by G x stage`);near(slide1-slide0,1.6*30/3.6*g2.ov.k,0.6,`${tag}: the slide moved right by the same stage change`);
   ok(`${tag}: one stage move updates the eyepiece and the overview together`);

   await ctx.close();
  }
  // the magnification states are checked once at desktop size and once on a phone
  for(const width of [1280,390]){
   const ctx=await browser.newContext({viewport:{width,height:900}});
   await guardContext(ctx,base,{hook:true,external});
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.goto(base+PAGE);await settle(page);
   const tag=`${width}`;
   await jump(page,TO_HIGH);                                   // 4×, B centred, nothing completes while the objective is not 40×
   let g=await page.evaluate(GEO);
   for(const id of ['A','B','C'])assert.equal(g.markers[id].visible,'true',`${tag}: 4× ${id} visible`);
   near(g.ringR,75,0.6,`${tag}: 4× ring`);
   await shot(page,`${tag}-4x`);
   ok(`${tag}: 4× shows A, B and C`);

   await jump(page,[{type:'SET_OBJECTIVE',objective:10}]);
   g=await page.evaluate(GEO);
   for(const id of ['A','B','C'])assert.equal(g.markers[id].visible,'true',`${tag}: 10× ${id} still in the tree and visible`);
   assert.equal(g.markers.A.inside,'false');assert.equal(g.markers.C.inside,'false');assert.equal(g.markers.B.inside,'true');
   near(g.markers.C.x,0,0.2,`${tag}: 10× C centre sits at x=0`);near(g.ringR,30,0.6,`${tag}: 10× ring`);
   // C is a square of half-side 35 units: its right edge (x=35) pokes 5 units into the field (left edge x=30)
   assert.equal(await hit(page,'C',32,300),true,`${tag}: the part of C inside the field is painted`);
   assert.equal(await hit(page,'C',20,300),false,`${tag}: the part of C outside the field is clipped away`);
   await shot(page,`${tag}-10x`);
   ok(`${tag}: 10× A and C are partly in the field and clipped at its rim, not dropped`);

   await jump(page,[{type:'SET_OBJECTIVE',objective:40}]);
   g=await page.evaluate(GEO);
   assert.equal(g.markers.B.visible,'true');assert.equal(g.markers.B.inside,'true');
   for(const id of ['A','C'])assert.equal(g.markers[id].shown,false,`${tag}: 40× ${id} is not drawn`);
   const b=g.markers.B.rect,fr=g.field;assert.ok(Math.hypot(b.left+b.width/2-fr.cx,b.top+b.height/2-fr.cy)+b.width/2<=fr.r+1,`${tag}: B (a circle) lies inside the field`);
   near(g.ringR,7.5,0.3,`${tag}: 40× ring`);
   await shot(page,`${tag}-40x`);
   ok(`${tag}: 40× leaves only B, whole, with the ring at 7.5 units`);

   // ---- the later screens ----------------------------------------------------------------------------------------------
   await jump(page,[{type:'RECORD'}]);await shot(page,`${width}-compare2`);await axeScan(page,`${width} compare 2`);
   await jump(page,[{type:'ANSWER_COMPARE',compare:'magnification',question:'field',answer:'smaller'},{type:'ANSWER_COMPARE',compare:'magnification',question:'count',answer:'fewer'},{type:'CONTINUE'}]);
   await shot(page,`${width}-concept`);await axeScan(page,`${width} concept`);
   const o=await page.evaluate(()=>{const d=document.documentElement;return {over:d.scrollWidth>d.clientWidth,live:document.querySelectorAll('[aria-live]').length}});
   assert.equal(o.over,false,`${tag}: concept has no horizontal overflow`);assert.equal(o.live,1);
   ok(`${tag}: compare and concept screens pass axe, one live region, no overflow`);

   // ---- notebook, challenges and the finish, reached by injected state (the click-through flow is a later stage) ----------
   const scan=async(label,{panel,heading}={})=>{
    await shot(page,`${width}-${label}`);await axeScan(page,`${width} ${label}`);
    const m=await page.evaluate(()=>{const d=document.documentElement;return {over:d.scrollWidth>d.clientWidth,live:document.querySelectorAll('[aria-live]').length,
     visible:[...document.querySelectorAll('main .mg-card')].filter(c=>!c.hidden).map(c=>c.id)}});
    assert.equal(m.over,false,`${width} ${label}: no horizontal overflow`);assert.equal(m.live,1,`${width} ${label}: one live region`);
    if(heading)assert.ok(m.visible.includes(heading),`${width} ${label}: ${heading} is the card on screen (${m.visible})`);
    if(panel)assert.equal(await page.locator(`[data-panel="${panel}"]`).isVisible(),true,`${width} ${label}: panel ${panel} is shown`);
   };
   await jump(page,[{type:'CONTINUE'}]);                                               // notebook, level A opens by default
   await scan('notebook-A',{heading:'mg-notebook',panel:'A'});
   await jump(page,[SAVE({level:'C',evidenceText:'我的觀察',limitationText:'還不夠多'})]);
   await scan('notebook-C',{heading:'mg-notebook',panel:'C'});
   assert.equal(await page.locator('[data-ideas]').isVisible(),true,`${width}: the ideas appear once a limitation is written`);
   await jump(page,[SAVE({level:'A',relationDirection:'left',relationRange:'smaller'}),{type:'CONTINUE'}]);
   await scan('challenge-1',{heading:'mg-challenge'});
   await jump(page,[CH(1,'c1-direction','right-up')]);await scan('challenge-1-wrong');
   await jump(page,[CH(1,'c1-direction','left-up'),{type:'CONTINUE'}]);
   await scan('challenge-2',{heading:'mg-challenge'});
   await jump(page,[CH(2,'c2-view','only-b-larger')]);await scan('challenge-2-step2');
   await jump(page,[CH(2,'c2-claim','smaller-field'),{type:'CONTINUE'}]);
   await scan('challenge-3',{heading:'mg-challenge'});
   await jump(page,[CH(3,'c3-strategy','low-recentre')]);
   assert.equal(await page.locator('.sg-challenge-note').isVisible(),true,`${width}: the optional note opens after the step is solved`);
   await scan('challenge-3-solved');
   await jump(page,[{type:'CONTINUE'}]);
   await scan('complete',{heading:'mg-complete'});
   const claims=await page.locator('.sg-claim').count();assert.equal(claims,3,`${width}: three claims`);
   assert.ok((await page.locator('.sg-complete-conclusion').allTextContents()).join('').includes('玻片往右移時'),`${width}: the learner's own conclusion is shown`);
   assert.equal(await page.locator('.sg-link').getAttribute('href'),'../microscope-lab.html');
   ok(`${tag}: notebook A and C, three challenges and the finish pass axe, one live region, no overflow`);
   await ctx.close();
  }
  // axe on the trial and compare 1 screens
  {
   const ctx=await browser.newContext({viewport:{width:1280,height:900}});await guardContext(ctx,base,{hook:true,external});
   const page=await ctx.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.goto(base+PAGE);await settle(page);
   await jump(page,TO_TRIAL1);await axeScan(page,'trial 1');
   await jump(page,[{type:'SET_STAGE',x:75,y:0}]);await axeScan(page,'trial 1 complete (locked)');
   await jump(page,[{type:'RECORD'},{type:'SET_STAGE',x:0,y:75},{type:'RECORD'}]);await shot(page,'1280-compare1');await axeScan(page,'compare 1');
   await jump(page,[{type:'ANSWER_COMPARE',compare:'direction',question:'relation',answer:'same'}]);await axeScan(page,'compare 1 with feedback');
   await jump(page,[{type:'ANSWER_COMPARE',compare:'direction',question:'relation',answer:'opposite'},{type:'CONTINUE'}]);await axeScan(page,'trial 2 low');
   ok('axe is clean on trial 1, the locked state, compare 1 (with feedback) and trial 2');
   await ctx.close();
  }
  assert.deepEqual(external,[],'no external requests');assert.deepEqual(errors,[],'no console or page errors');
  ok('no external requests, no console errors');
  console.log(`microscope-guided view browser: ${checks} checks passed`);
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
