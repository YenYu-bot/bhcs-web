// Pilot #6 B3 local browser gate: full prototype flow through Concept.
// Not permanent CI until B5. It injects a test hook into main.js in memory; shipped files contain no hook.
const { chromium }=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const { root,createServer,openPage,axeScan,settle,launchOptions }=require('./circuit_guided_test_support.cjs');
const OUT=path.resolve(process.env.CIRCUIT_FLOW_OUTPUT||path.join(root,'circuit-flow-artifacts'));
const forbidden=/串聯|並聯|等效電阻|歐姆定律|I\s*=\s*V\s*\/\s*R|總電阻變大|總電阻變小|串聯電阻|並聯電阻|支路電流總和/i;
const phase=p=>p.evaluate(()=>document.getElementById('main').dataset.phase);
const shot=async(p,n)=>{fs.mkdirSync(OUT,{recursive:true});await p.locator('#main').screenshot({path:path.join(OUT,n+'.png')})};
const text=(p,sel)=>p.locator(sel).innerText();
async function leakText(p){return p.evaluate(()=>document.body.innerText+' '+[...document.querySelectorAll('[aria-label],[title]')].map(e=>(e.getAttribute('aria-label')||'')+' '+(e.getAttribute('title')||'')).join(' '))}
async function preConcept(p,label){assert.notEqual(await phase(p),'concept',label);assert.doesNotMatch(await leakText(p),forbidden,label)}
async function clickCta(p,{tap=false}={}){const b=p.locator('#cgg-cta');assert.equal(await b.isVisible(),true,'CTA visible');assert.equal(await b.isEnabled(),true,'CTA enabled');tap?await b.tap():await b.click();await settle(p)}
async function toggle(p,{tap=false}={}){const b=p.locator('#cgg-bench-card [data-switch-toggle]');tap?await b.tap():await b.click();await settle(p)}
async function answer(p,q,v,{tap=false}={}){const x=p.locator(`[data-question="${q}"] input[value="${v}"]`);tap?await x.tap():await x.check();await settle(p)}
async function setFixed(p,name){
  await p.evaluate(async(name)=>{
    const {FIXED_CIRCUITS}=await import('/assets/circuit-guided/model.js');
    let s=window.__cggTest.getState();
    if(s.switchClosed)window.__cggTest.dispatch({type:'TOGGLE_SWITCH',value:false});
    s=window.__cggTest.getState();
    for(const w of [...s.wires])window.__cggTest.dispatch({type:'DISCONNECT',from:w.from,to:w.to});
    for(const w of FIXED_CIRCUITS[name])window.__cggTest.dispatch({type:'CONNECT',from:w.from,to:w.to});
  },name);
  await settle(p);
}
async function common(p,label){
  const overflow=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(overflow<=1,label+' overflow '+overflow);
  await axeScan(p,label);
}
async function runJourney(p,{tap=false,shots=false,prefix='' }={}){
  assert.equal(await phase(p),'welcome');await preConcept(p,'welcome');
  if(shots)await shot(p,prefix+'welcome');
  await clickCta(p,{tap});assert.equal(await phase(p),'mission');await preConcept(p,'mission');
  await clickCta(p,{tap});assert.equal(await phase(p),'baseline-build');await preConcept(p,'baseline build');

  // Safety warning is live and does not invent a current.
  await p.evaluate(()=>{window.__cggTest.dispatch({type:'CONNECT',from:'bat+',to:'A.+'});window.__cggTest.dispatch({type:'CONNECT',from:'A.-',to:'bat-'});});
  await settle(p);
  assert.match(await text(p,'#cgg-status'),/安全警示/);
  assert.ok(!/Infinity|NaN/.test(await text(p,'#cgg-bench-card')));
  await setFixed(p,'baseline');
  assert.equal(await phase(p),'baseline-measure');
  assert.equal(await p.locator('#cgg-cta').isEnabled(),false);
  assert.match(await text(p,'#cgg-status'),/閉合開關/);
  await toggle(p,{tap});
  assert.equal(await text(p,'#cgg-bench-card [data-role="ammeter-value"]'),'1.0 A');
  assert.equal(await text(p,'#cgg-bench-card [data-role="voltmeter-value"]'),'6.0 V');
  assert.equal(await p.locator('#cgg-cta').isEnabled(),true);
  await preConcept(p,'baseline live'); if(shots)await shot(p,prefix+'baseline');
  await clickCta(p,{tap});assert.equal(await phase(p),'trial1-build');

  await setFixed(p,'trial1');assert.equal(await phase(p),'trial1-measure');await toggle(p,{tap});
  assert.equal(await text(p,'#cgg-bench-card [data-role="ammeter-value"]'),'0.5 A');
  assert.equal(await text(p,'#cgg-bench-card [data-role="voltmeter-value"]'),'3.0 V');
  assert.deepEqual(await p.evaluate(()=>[...document.querySelectorAll('#cgg-bench-card [data-lamp] [data-role="lamp-state"]')].map(e=>e.textContent)),['較暗','較暗']);
  await preConcept(p,'one path live');if(shots)await shot(p,prefix+'one-path');
  await clickCta(p,{tap});assert.equal(await phase(p),'compare1');
  assert.match(await text(p,'#cgg-evidence'),/1\.0 A/);assert.match(await text(p,'#cgg-evidence'),/0\.5 A/);
  await answer(p,'totalChange','same',{tap});
  assert.match(await text(p,'[data-feedback="totalChange"]'),/1\.0 A.*0\.5 A/);
  await answer(p,'totalChange','decrease',{tap});await answer(p,'claim','one-path-only',{tap});
  assert.equal(await p.locator('#cgg-cta').isEnabled(),true);
  if(tap){
    const sizes=await p.evaluate(()=>[...document.querySelectorAll('#cgg-compare .sg-pill')].filter(e=>e.offsetParent).map(e=>{const r=e.getBoundingClientRect();return[r.width,r.height]}));
    assert.ok(sizes.length>=3&&sizes.every(([w,h])=>w>=56&&h>=56),'compare1 touch targets '+JSON.stringify(sizes));
  }
  await preConcept(p,'compare1');if(shots)await shot(p,prefix+'compare1');
  await clickCta(p,{tap});assert.equal(await phase(p),'trial2-build');

  await setFixed(p,'trial2Total');assert.equal(await phase(p),'trial2-total');await toggle(p,{tap});
  assert.equal(await text(p,'#cgg-bench-card [data-role="ammeter-value"]'),'2.0 A');
  assert.equal(await text(p,'#cgg-bench-card [data-role="voltmeter-value"]'),'6.0 V');
  assert.deepEqual(await p.evaluate(()=>[...document.querySelectorAll('#cgg-bench-card [data-lamp] [data-role="lamp-state"]')].map(e=>e.textContent)),['基準亮度','基準亮度']);
  await clickCta(p,{tap});assert.equal(await phase(p),'trial2-branch1');

  await setFixed(p,'trial2L1');await toggle(p,{tap});
  assert.equal(await text(p,'#cgg-bench-card [data-role="ammeter-value"]'),'1.0 A');
  assert.match(await text(p,'#cgg-coach-main'),/燈泡 1/);
  await clickCta(p,{tap});assert.equal(await phase(p),'trial2-branch2');

  await setFixed(p,'trial2L2');await toggle(p,{tap});
  assert.equal(await text(p,'#cgg-bench-card [data-role="ammeter-value"]'),'1.0 A');
  assert.match(await text(p,'#cgg-coach-main'),/燈泡 2/);
  await preConcept(p,'branch2');if(shots)await shot(p,prefix+'branch2');
  await clickCta(p,{tap});assert.equal(await phase(p),'compare2');
  assert.match(await text(p,'#cgg-compare'),/2\.0 A/);
  assert.match(await text(p,'#cgg-compare'),/燈泡 1 那一路 1\.0 A/);
  assert.match(await text(p,'#cgg-compare'),/燈泡 2 那一路 1\.0 A/);
  await answer(p,'totalChange','increase',{tap});await answer(p,'branchRelation','sum',{tap});
  assert.equal(await p.locator('#cgg-cta').isEnabled(),true);
  if(tap){
    const sizes=await p.evaluate(()=>[...document.querySelectorAll('#cgg-compare .sg-pill')].filter(e=>e.offsetParent).map(e=>{const r=e.getBoundingClientRect();return[r.width,r.height]}));
    assert.ok(sizes.length>=3&&sizes.every(([w,h])=>w>=56&&h>=56),'compare2 touch targets '+JSON.stringify(sizes));
  }
  await preConcept(p,'compare2');if(shots)await shot(p,prefix+'compare2');
  await clickCta(p,{tap});assert.equal(await phase(p),'inference');
  assert.match(await text(p,'#cgg-inference'),/一定變小.*不成立/);
  assert.match(await text(p,'#cgg-inference'),/0\.5 A/);
  assert.match(await text(p,'#cgg-inference'),/2\.0 A/);
  await preConcept(p,'inference');if(shots)await shot(p,prefix+'inference');

  await clickCta(p,{tap});assert.equal(await phase(p),'concept');
  const concept=await text(p,'#cgg-concept');
  for(const re of[/串聯/,/並聯/,/歐姆定律/,/等效電阻/,/I = V \/ R/])assert.match(concept,re);
  assert.match(concept,/12\.0 Ω/);assert.match(concept,/3\.0 Ω/);assert.match(concept,/0\.5 A/);assert.match(concept,/2\.0 A/);
  assert.match(concept,/電流不是被燈泡「用掉」/);
  assert.equal(await p.locator('#cgg-cta').isHidden(),true);
  if(shots)await shot(p,prefix+'concept');
}


async function verifyNotebook(p,{tap=false,shots=false,prefix='' }={}){
  const open=p.locator('#cgg-notebook-open');
  assert.equal(await open.isVisible(),true,'Notebook available at Concept');
  tap?await open.tap():await open.click();
  const panel=p.locator('#cgg-notebook');
  assert.equal(await panel.isVisible(),true);
  assert.match(await text(p,'#cgg-notebook h2'),/Level A/);
  const choose=async(name,value)=>{
    const input=p.locator('input[name="cgg-nb-'+name+'"][value="'+value+'"]');
    tap?await input.tap():await input.check();
  };
  const next=p.locator('.cgg-notebook-next');
  await next.click();assert.match(await text(p,'#cgg-notebook [role="status"]'),/重新檢查/);
  await choose('baselineCurrent','1.0');
  await choose('onePathChange','decrease');
  await choose('twoPathChange','increase');
  await choose('alwaysDecrease','true');
  await next.click();assert.match(await text(p,'#cgg-notebook h2'),/Level A/,'wrong answer blocked');
  await choose('alwaysDecrease','false');
  await next.click();assert.match(await text(p,'#cgg-notebook h2'),/Level B/);
  await next.click();assert.match(await text(p,'#cgg-notebook [role="status"]'),/完整的解釋/);
  await p.getByRole('textbox',{name:'我的解釋'}).fill('兩種接法的電流路徑不同，因此同樣多一顆燈泡，總電流也不同。');
  await next.click();assert.match(await text(p,'#cgg-notebook h2'),/Level C/);
  assert.equal(await p.locator('#cgg-notebook-ideas li').count(),0,'ideas hidden before limitation');
  await p.getByRole('textbox',{name:/請引用至少兩筆/}).fill('一顆燈是1.0 A，一條路兩顆燈是0.5 A，兩條路兩顆燈是2.0 A。');
  assert.equal(await p.locator('#cgg-notebook-ideas li').count(),0,'ideas remain hidden');
  await p.getByRole('textbox',{name:/本站模型和真實電路/}).fill('真實電池的內阻會改變量測電流，與理想模型不同。');
  assert.equal(await p.locator('#cgg-notebook-ideas li').count(),6);
  await next.click();assert.match(await text(p,'#cgg-notebook h2'),/Level done/);
  assert.equal(await next.isHidden(),true);
  if(shots)await shot(p,prefix+'notebook-done');
  await common(p,prefix+'notebook');
}


async function verifyChallenges(p,{shots=false,prefix=''}={}){
  await p.locator('#cgg-challenges-open').click();
  const panel=p.locator('#cgg-challenges'),next=panel.locator(':scope > button');
  assert.match(await text(p,'#cgg-challenges h2'),/挑戰 1/);
  await next.click();assert.match(await text(p,'#cgg-challenges > p[role=status]'),/重新/);
  await panel.locator('input[value="restoreParallel"]').check();
  await next.click();assert.match(await text(p,'#cgg-challenges h2'),/挑戰 2/);
  const slots=[['sw.b','L1.a'],['L1.b','L2.a'],['L2.b','bat-']];
  for(const [up,down]of slots){
    await next.click();
    assert.match(await text(p,'#cgg-challenges > p[role=status]'),/確認電流表/);
    await panel.locator('[data-remove-wire]').evaluateAll((buttons,pair)=>{
      const key=[...pair].sort().join('|');const btn=buttons.find(b=>b.getAttribute('data-remove-wire')===key);if(!btn)throw Error('wire not found: '+key);btn.click();
    },[up,down]);
    for(const [a,b]of [[up,'A.+'],['A.-',down]]){
      await panel.locator('[data-terminal="'+a+'"]').click();
      await panel.locator('[data-terminal="'+b+'"]').click();
    }
    await panel.locator('[data-switch-toggle]').click();
    assert.equal(await text(p,'#cgg-challenges [data-role=ammeter-value]'),'0.5 A');
    await next.click();
  }
  assert.match(await text(p,'#cgg-challenges'),/三次量測完成/);
  await next.click();assert.match(await text(p,'#cgg-challenges h2'),/挑戰 3/);
  await next.click();assert.match(await text(p,'#cgg-challenges > p[role=status]'),/拆掉 L2/);
  await panel.locator('[data-remove-wire]').evaluateAll(buttons=>{
    const btn=buttons.find(b=>b.getAttribute('data-remove-wire')==='L2.a|sw.b');
    if(!btn)throw Error('L2 connection missing');btn.click();
  });
  await panel.locator('[data-switch-toggle]').click();
  await next.click();
  assert.match(await text(p,'#cgg-challenges > p[role=status]'),/已完成三項挑戰/);
  assert.equal(await next.isHidden(),true);
  if(shots)await shot(p,prefix+'challenges-complete');
  await common(p,prefix+'challenges');
}

(async()=>{
  const server=createServer();await new Promise(r=>server.listen(0,r));
  const base='http://localhost:'+server.address().port,browser=await chromium.launch(launchOptions());
  const external=[],errors=[];let checks=0;const ok=m=>{checks++;console.log('PASS',m)};
  try{
    {
      const {ctx,page:p}=await openPage(browser,base,{viewport:{width:1280,height:900},external,errors});
      assert.equal(await p.evaluate(()=>typeof window.__cggTest),'object');
      assert.equal(await p.locator('#cgg-announcer').count(),1);
      await common(p,'1280 welcome');
      await runJourney(p,{shots:true,prefix:'1280-'});
      await common(p,'1280 concept');
      await verifyNotebook(p,{shots:true,prefix:'1280-'});
      await verifyChallenges(p,{shots:true,prefix:'1280-'});
      assert.equal(await p.locator('#cgg-complete').isVisible(),true);
      assert.equal(await p.locator('#cgg-complete-lessons li').count(),4);
      assert.match(await text(p,'#cgg-complete'),/串聯/);
      await p.reload();
      await p.waitForFunction(()=>document.getElementById('main')?.dataset.phase==='concept');
      await p.locator('#cgg-notebook-open').click();
      assert.match(await text(p,'#cgg-notebook h2'),/Level done/);
      await p.locator('#cgg-challenges-open').click();
      assert.match(await text(p,'#cgg-challenges h2'),/挑戰 3/);
      assert.equal(await p.locator('#cgg-challenges > button').isHidden(),true);
      assert.equal(await p.locator('#cgg-complete').isVisible(),true);
      assert.equal(await p.locator('#cgg-complete-lessons li').count(),4);
      await p.locator('#cgg-restart').click();
      await p.waitForFunction(()=>document.getElementById('main')?.dataset.phase==='welcome');
      assert.equal(await p.evaluate(()=>localStorage.length),0);
      assert.equal(await p.locator('#cgg-complete').isHidden(),true);
      assert.equal(await p.evaluate(()=>localStorage.length),0);
      assert.equal(await p.evaluate(()=>sessionStorage.length),0);
      ok('1280: full Welcome → five measurements → two compares → inference → Concept; leakage blocked before Concept, axe clean');
      await ctx.close();
    }
    {
      const {ctx,page:p}=await openPage(browser,base,{viewport:{width:390,height:844},touch:true,external,errors});
      const initial=await p.evaluate(()=>({
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        cta:(()=>{const r=document.getElementById('cgg-cta').getBoundingClientRect();return{w:r.width,h:r.height}})(),
      }));
      assert.ok(initial.overflow<=1);
      assert.ok(initial.cta.w>=56&&initial.cta.h>=56);
      await runJourney(p,{tap:true,shots:true,prefix:'390-'});
      const facts=await p.evaluate(()=>({
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        conceptRight:document.getElementById('cgg-concept').getBoundingClientRect().right,
        viewport:document.documentElement.clientWidth,
      }));
      assert.ok(facts.overflow<=1);
      assert.ok(facts.conceptRight<=facts.viewport+1);
      await common(p,'390 concept');
      await verifyNotebook(p,{tap:true,shots:true,prefix:'390-'});
      await verifyChallenges(p,{shots:true,prefix:'390-'});
      assert.equal(await p.locator('#cgg-complete').isVisible(),true);
      await common(p,'390 completion');
      ok('390: full flow by touch, answer targets ≥56px, no sideways scroll, Concept fits, axe clean');
      await ctx.close();
    }
    {
      const {ctx,page:p}=await openPage(browser,base,{viewport:{width:1280,height:900},hook:false,external,errors});
      assert.equal(await p.evaluate(()=>typeof window.__cggTest),'undefined');
      assert.equal(await p.evaluate(()=>localStorage.length),0);
      assert.equal(await p.evaluate(()=>sessionStorage.length),0);
      assert.deepEqual(await p.evaluate(()=>[...document.scripts].map(s=>s.getAttribute('src'))),['../../assets/circuit-guided/main.js']);
      ok('as shipped: no test hook, no storage and only the station module loads');
      await ctx.close();
    }
    assert.deepEqual(errors,[],'console/page errors');
    assert.deepEqual(external,[],'external requests');
    ok('no external requests and no console errors');
    console.log('circuit-guided B3 flow browser: '+checks+' checks passed; screenshots in '+path.relative(root,OUT)+'/');
  }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
