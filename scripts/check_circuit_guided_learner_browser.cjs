// Pilot #6 learner-input gate: a first-time learner builds every bench stage on the shipped page
// with real mouse clicks, keyboard, touch taps and touch drags. No test hook is injected, so the
// page runs exactly as shipped. Screenshots go to circuit-learner-artifacts/.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {root,createServer,openPage,settle,launchOptions,touchDrag}=require('./circuit_guided_test_support.cjs');
const OUT=path.resolve(process.env.CIRCUIT_LEARNER_OUTPUT||path.join(root,'circuit-learner-artifacts'));
const forbidden=/串聯|並聯|等效電阻|歐姆定律|I\s*=\s*V\s*\/\s*R/;
const phase=p=>p.evaluate(()=>document.getElementById('main').dataset.phase);
const bench='#cgg-bench-card ';
const T=(p,id)=>p.locator(bench+'[data-terminal="'+id+'"]');
const read=(p,role)=>p.locator(bench+'[data-role="'+role+'"]').textContent();
const shot=async(p,n)=>{fs.mkdirSync(OUT,{recursive:true});await p.locator('#cgg-bench-card').screenshot({path:path.join(OUT,n+'.png')})};
const center=async l=>{await l.scrollIntoViewIfNeeded();const b=await l.boundingBox();return{x:b.x+b.width/2,y:b.y+b.height/2}};
const wires=p=>p.locator(bench+'[data-wire-row]').evaluateAll(r=>r.map(x=>x.getAttribute('data-wire-row')).sort());

async function connect(p,a,b,mode){
  const before=(await wires(p)).length;
  if(mode==='mouse'){await T(p,a).click();await T(p,b).click()}
  else if(mode==='keyboard'){await T(p,a).focus();await p.keyboard.press('Enter');await T(p,b).focus();await p.keyboard.press('Space')}
  else if(mode==='tap'){await T(p,a).tap();
    // The hint names the chosen terminal so a learner knows the first tap registered.
    await p.waitForFunction(()=>/已選「/.test(document.querySelector('#cgg-bench-card [data-role="wire-hint"]').textContent),null,{timeout:2000}).catch(async e=>{throw new Error('tap on '+a+' did not select it: '+await p.locator(bench+'[data-role="wire-hint"]').textContent())});
    await T(p,b).tap()}
  else if(mode==='drag'){await touchDrag(p,await center(T(p,a)),await center(T(p,b)),10);await p.waitForTimeout(450)} // a human pause; Chrome drops a tap that lands within a synthetic fling window
  else if(mode==='mouse-drag'){const s=await center(T(p,a)),e=await center(T(p,b));await p.mouse.move(s.x,s.y);await p.mouse.down();await p.mouse.move(e.x,e.y,{steps:10});await p.mouse.up()}
  await settle(p);
  assert.equal((await wires(p)).length,before+1,mode+' '+a+'→'+b+' did not create a wire');
}
async function removeWire(p,a,b,tap){const k=[a,b].sort().join('|'),btn=p.locator(bench+'[data-remove-wire="'+k+'"]');tap?await btn.tap():await btn.click();await settle(p)}
async function toggle(p,tap){const b=p.locator(bench+'[data-switch-toggle]');tap?await b.tap():await b.click();await settle(p)}
async function cta(p,tap){const b=p.locator('#cgg-cta');assert.equal(await b.isEnabled(),true,'CTA enabled');tap?await b.tap():await b.click();await settle(p)}
async function layoutFacts(p){return p.evaluate(()=>{const st=document.querySelector('#cgg-bench-card [data-role="stage"]').getBoundingClientRect();
  const terms=[...document.querySelectorAll('#cgg-bench-card [data-terminal]')].map(e=>{const r=e.getBoundingClientRect();return{id:e.dataset.terminal,l:r.left,r:r.right,t:r.top,b:r.bottom}});
  return{overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,vw:innerWidth,stage:{l:st.left,r:st.right,w:st.width,h:st.height},terms,layout:document.querySelector('#cgg-bench-card [data-role="circuit-bench"]').dataset.layout,
   text:document.body.innerText}})}
async function journey(p,{mobile,label}){
  const tap=mobile,pick=(i)=>mobile?(i%2?'drag':'tap'):(['mouse','keyboard','mouse-drag'][i%3]);
  assert.equal(await phase(p),'welcome');await cta(p,tap);await cta(p,tap);assert.equal(await phase(p),'baseline-build');
  let f=await layoutFacts(p);
  assert.equal(f.layout,mobile?'portrait':'landscape');assert.ok(f.overflow<=1,label+' page overflow '+f.overflow);
  for(const t of f.terms){assert.ok(t.l>=f.stage.l-1&&t.r<=Math.min(f.vw,f.stage.r)+30,label+' terminal '+t.id+' off screen');}
  assert.match(await p.locator(bench+'[data-role="wire-hint"]').innerText(),/先點一個端點/);
  assert.equal(await p.locator(bench+'[data-lamp="L2"] [data-role="lamp-state"]').textContent(),'未接線');
  assert.equal(await p.locator(bench+'[data-role="spare-lamp-bay"]').getAttribute('data-state'),'spare');
  await shot(p,label+'-01-empty');

  // A wrong first attempt: battery straight into the ammeter and back. The bench warns, never invents a current.
  await connect(p,'bat+','A.+',pick(0));await connect(p,'A.-','bat-',pick(1));await toggle(p,tap);
  assert.match(await read(p,'status'),/安全警示/);assert.doesNotMatch(await p.locator('#cgg-bench-card').innerText(),/Infinity|NaN/);
  await shot(p,label+'-02-unsafe');
  await toggle(p,tap);await removeWire(p,'bat+','A.+',tap);await removeWire(p,'A.-','bat-',tap);
  assert.equal((await wires(p)).length,0);

  // Build lamp 1 alone. Switch open first: lamp dark, no current.
  const base=[['bat+','sw.a'],['sw.b','A.+'],['A.-','L1.a'],['L1.b','bat-']];
  for(const [i,[a,b]] of base.entries())await connect(p,a,b,pick(i));
  assert.equal(await read(p,'ammeter-value'),'0.0 A');
  assert.equal(await p.locator(bench+'[data-lamp="L1"]').getAttribute('data-brightness'),'off');
  await toggle(p,tap);
  assert.equal(await read(p,'ammeter-value'),'1.0 A');assert.equal(await read(p,'ammeter-display'),'1.0 A');
  assert.equal(await p.locator(bench+'[data-lamp="L1"]').getAttribute('data-brightness'),'reference');
  assert.equal(await p.locator(bench+'[data-lamp="L2"] [data-role="lamp-state"]').textContent(),'未接線','lamp 2 still spare');
  await shot(p,label+'-03-lamp1-only');
  // Removing the return wire breaks the loop and the lamp goes out; reconnect it.
  await removeWire(p,'L1.b','bat-',tap);assert.equal(await read(p,'ammeter-value'),'0.0 A');assert.match(await read(p,'status'),/沒有完整通路/);
  await connect(p,'L1.b','bat-',pick(2));assert.equal(await read(p,'ammeter-value'),'1.0 A');
  await toggle(p,tap);
  await connect(p,'V.+','L1.a',pick(3));await connect(p,'V.-','L1.b',pick(4));
  assert.equal(await phase(p),'baseline-measure');await toggle(p,tap);
  assert.equal(await read(p,'voltmeter-value'),'6.0 V');assert.equal(await read(p,'voltmeter-display'),'6.0 V');
  await shot(p,label+'-04-baseline');
  await cta(p,tap);assert.equal(await phase(p),'trial1-build');

  // One path through both lamps: lamp 1 return now goes through lamp 2.
  await toggle(p,tap);await removeWire(p,'L1.b','bat-',tap);
  await connect(p,'L1.b','L2.a',pick(0));
  assert.equal(await p.locator(bench+'[data-role="spare-lamp-bay"]').getAttribute('data-state'),'working');
  await connect(p,'L2.b','bat-',pick(1));
  assert.equal(await phase(p),'trial1-measure');await toggle(p,tap);
  assert.equal(await read(p,'ammeter-value'),'0.5 A');assert.equal(await read(p,'voltmeter-value'),'3.0 V');
  await shot(p,label+'-05-one-path');
  await cta(p,tap);assert.equal(await phase(p),'compare1');
  await p.locator('[data-question="totalChange"] input[value="decrease"]')[tap?'tap':'check']();
  await p.locator('[data-question="claim"] input[value="one-path-only"]')[tap?'tap':'check']();
  await settle(p);await cta(p,tap);assert.equal(await phase(p),'trial2-build');

  // Two paths: each lamp gets its own path from the ammeter back to the battery.
  await toggle(p,tap);await removeWire(p,'L1.b','L2.a',tap);
  await connect(p,'A.-','L2.a',pick(2));await connect(p,'L1.b','bat-',pick(3));
  assert.equal(await phase(p),'trial2-total');await toggle(p,tap);
  assert.equal(await read(p,'ammeter-value'),'2.0 A');
  await shot(p,label+'-06-two-path-total');
  await cta(p,tap);assert.equal(await phase(p),'trial2-branch1');
  // Move the ammeter into lamp 1's path only.
  await toggle(p,tap);
  await removeWire(p,'A.-','L2.a',tap);await connect(p,'sw.b','L2.a',pick(4));
  await toggle(p,tap);assert.equal(await read(p,'ammeter-value'),'1.0 A');
  await shot(p,label+'-07-lamp1-path');
  await cta(p,tap);assert.equal(await phase(p),'trial2-branch2');
  // Move the ammeter into lamp 2's path only.
  await toggle(p,tap);
  await removeWire(p,'A.-','L1.a',tap);await removeWire(p,'sw.b','L2.a',tap);
  await connect(p,'sw.b','L1.a',pick(5));await connect(p,'A.-','L2.a',pick(6));
  await toggle(p,tap);assert.equal(await read(p,'ammeter-value'),'1.0 A');
  await shot(p,label+'-08-lamp2-path');
  assert.doesNotMatch((await layoutFacts(p)).text,forbidden,'no formal terms before the concept stage');
  await cta(p,tap);assert.equal(await phase(p),'compare2');
  f=await layoutFacts(p);assert.ok(f.overflow<=1,label+' overflow at end '+f.overflow);
}

(async()=>{
  const server=createServer();await new Promise(r=>server.listen(0,r));
  const base='http://localhost:'+server.address().port,browser=await chromium.launch(launchOptions());
  const external=[],errors=[];let checks=0;const ok=m=>{checks++;console.log('PASS',m)};
  try{
    {const{ctx,page}=await openPage(browser,base,{viewport:{width:1280,height:900},hook:false,external,errors});
     await journey(page,{mobile:false,label:'1280'});await ctx.close()}
    ok('1280: learner builds every stage with mouse clicks, keyboard and mouse drags; unsafe wiring warns; removing a wire opens the circuit');
    {const{ctx,page}=await openPage(browser,base,{viewport:{width:390,height:844},touch:true,hook:false,external,errors});
     await journey(page,{mobile:true,label:'390'});
     // A swipe that starts on the bench background scrolls the page and never creates a wire.
     await page.locator('#cgg-cta').scrollIntoViewIfNeeded();await page.evaluate(()=>scrollTo(0,0));await settle(page);
     ok('390: learner builds every stage by touch tap and touch drag on the portrait bench without sideways scrolling');
     await ctx.close()}
    {const{ctx,page}=await openPage(browser,base,{viewport:{width:390,height:844},touch:true,hook:false,external,errors});
     await page.locator('#cgg-cta').tap();await page.locator('#cgg-cta').tap();await settle(page);
     const st=await page.locator(bench+'[data-role="stage"]').boundingBox();await page.evaluate(()=>scrollTo(0,0));await settle(page);
     const y0=await page.evaluate(()=>scrollY),x=st.x+st.width*0.5,y=Math.min(780,st.y+st.height*0.62);
     await touchDrag(page,{x,y},{x,y:y-160},8);await page.waitForTimeout(150);
     assert.ok(await page.evaluate(()=>scrollY)>y0+40,'swipe on bench background scrolls the page');
     assert.equal((await wires(page)).length,0,'swipe created no wire');
     await ctx.close()}
    ok('390: swiping on the bench background scrolls the page and creates no wire');
    assert.deepEqual(errors,[],'console/page errors');assert.deepEqual(external,[],'external requests');ok('no external requests and no console errors');
    console.log('circuit-guided learner browser: '+checks+' checks passed; screenshots in '+path.relative(root,OUT)+'/');
  }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
