'use strict';
// Real Chromium acceptance. All application changes use physical browser input.
// evaluate() only reads DOM or installs passive audit observers; no module imports,
// state setters, controller dispatches, test hooks, or synthetic DOM input.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = path.resolve(process.env.LENS_25D_OUTPUT || 'lens-25d-artifacts');
const results = [];
let browser, server, base;
fs.mkdirSync(output, {recursive:true});
const save = () => fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const number = async (page,id) => Number(await page.locator('#'+id).textContent());
const q = (page,id) => page.locator(`[data-question="${id}"]`);
const evidence = (page,index) => page.locator('#evidence-cards .record-card').nth(index);
const model = (page,index) => page.locator('#model-comparison .model-card').nth(index);
const history = page => page.locator('#evidence-history li').count();
async function select(page,id) { await page.locator(`[data-case="${id}"]`).click(); await settle(page); }
async function snapshot(page) {
  return page.evaluate(() => {
    const describe = el => ({id:el.id,tag:el.tagName,text:el.textContent,rect:el.getBoundingClientRect().toJSON(),value:el.getAttribute('aria-valuenow'),disabled:el.getAttribute('aria-disabled')});
    return {viewport:{width:innerWidth,height:innerHeight,scrollX,scrollY,documentWidth:document.documentElement.scrollWidth,visualWidth:visualViewport?.width},controls:[...document.querySelectorAll('#bench,#screen-hit,#candle-hit')].map(describe),position:document.querySelector('#position')?.textContent,u:document.querySelector('#object-position')?.textContent,phase:document.querySelector('#bench')?.dataset.phase,zones:[...document.querySelectorAll('#search-zones span')].map(el=>({text:el.textContent,visited:el.classList.contains('visited')})),evidence:document.querySelector('#evidence-cards')?.textContent,history:document.querySelector('#evidence-history')?.textContent,questions:[...document.querySelectorAll('[data-question]')].map(el=>({id:el.dataset.question,result:el.dataset.result,text:el.textContent})),audit:window.__lensInputAudit};
  });
}
async function dragTo(page,cdp,kind,control,target) {
  const loc=page.locator('#'+control);
  await loc.scrollIntoViewIfNeeded(); await settle(page);
  const r=await loc.boundingBox(), bench=await page.locator('#bench').boundingBox();
  const before=Number(await loc.getAttribute('aria-valuenow'));
  const point={x:r.x+r.width/2,y:r.y+r.height/2};
  const dx=(target-before)*bench.width/88*(control==='candle-hit'?-1:1);
  assert.ok(Math.abs(dx)>=3,'drag exceeds physical input slop');
  assert.equal(await page.evaluate(({x,y,id})=>document.elementFromPoint(x,y)?.id===id,{...point,id:control}),true,'control center is hit-testable');
  await page.evaluate(plan=>window.__lensInputAudit.planned.push(plan),{kind,control,target,before,point,dx,bench,r});
  if(kind==='mouse'){await page.mouse.move(point.x,point.y);await page.mouse.down();}
  else await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]});
  try {
    for(let i=1;i<=8;i++){
      const p={x:point.x+dx*i/8,y:point.y};
      if(kind==='mouse')await page.mouse.move(p.x,p.y);
      else await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...p,id:1}]});
      await page.waitForTimeout(20);
    }
  } finally {
    if(kind==='mouse')await page.mouse.up();
    else await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await settle(page);
  assert.equal(Number(await loc.getAttribute('aria-valuenow')),target,`${kind} ${control} actual position`);
  assert.equal(await number(page,control==='candle-hit'?'object-position':'position'),target,'numeric visible display matches actual slider');
}
async function search(page,cdp,kind) {
  assert.equal(await page.locator('#search-zones .visited').count(),0,'selection itself is not a changed settle');
  assert.ok(await page.locator('#special-action').isDisabled());
  // A real pointer tap must not become observational evidence.
  if(kind==='touch')await page.locator('#screen-hit').tap(); else await page.locator('#screen-hit').click();
  assert.equal(await page.locator('#search-zones .visited').count(),0,'tap is not evidence');
  // Traversing middle on the way to far must not record middle.
  await dragTo(page,cdp,kind,'screen-hit',30);
  assert.equal(await page.locator('#search-zones .visited').count(),1,'only release zone counts');
  assert.ok(await page.locator('#special-action').isDisabled());
  await dragTo(page,cdp,kind,'screen-hit',14);
  assert.equal(await page.locator('#search-zones .visited').count(),2);
  assert.ok(await page.locator('#special-action').isDisabled());
  await dragTo(page,cdp,kind,'screen-hit',20);
  assert.equal(await page.locator('#search-zones .visited').count(),3);
  assert.ok(await page.locator('#special-action').isEnabled());
}
async function layout(page,width) {
  const data=await page.evaluate(() => ({width:innerWidth,documentWidth:document.documentElement.scrollWidth,items:[...document.querySelectorAll('[data-case],.record-card,.model-card,.question-card,.question-card button')].map(el=>({text:el.textContent.slice(0,80),rect:el.getBoundingClientRect().toJSON(),scroll:el.scrollWidth,client:el.clientWidth}))}));
  assert.equal(data.width,width,'canonical actual CSS viewport width');
  assert.ok(data.documentWidth<=width+2,'no horizontal page overflow');
  assert.ok(data.items.length>=27,'all case, evidence, model and learning cards included');
  for(const item of data.items){assert.ok(item.rect.width>0&&item.rect.left>=-1&&item.rect.right<=width+1,`card/button inside viewport: ${item.text}`);assert.ok(item.scroll<=item.client+2,`no clipped card/button text: ${item.text}`);}
  return data;
}
async function answer(page,id,choice,keyboard=false) {
  const button=q(page,id).locator(`[data-answer="${choice}"]`);
  assert.ok(await button.isEnabled());
  if(keyboard){await button.focus();await page.keyboard.press('Enter');}else await button.click();
  await settle(page);
}
async function run(name,width,touch,task) {
  const result={name,width,input:touch?'CDP touch':'mouse',status:'running'};results.push(result);save();
  const context=await browser.newContext({viewport:{width,height:844},hasTouch:touch,isMobile:width===390,deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[],consoleErrors=[],external=[],failed=[],scripts=[];
  page.setDefaultTimeout(12000);
  await context.route('**/*',route=>{const url=route.request().url();if(new URL(url).origin!==base){external.push(url);return route.abort();}return route.continue();});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  page.on('request',r=>{if(r.resourceType()==='script')scripts.push(r.url());});
  page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
  const cdp=touch?await context.newCDPSession(page):null;
  try {
    await page.goto(base+'/tools/lens-25d/',{waitUntil:'networkidle'});
    await page.waitForSelector('[data-question="q1"]');
    await page.evaluate(()=>{
      window.__lensInputAudit={planned:[],pointers:[],keys:[]};
      document.addEventListener('pointerdown',e=>window.__lensInputAudit.pointers.push({trusted:e.isTrusted,type:e.pointerType,id:e.target.id,x:e.clientX,y:e.clientY,rect:e.target.getBoundingClientRect().toJSON()}),{capture:true,passive:true});
      document.addEventListener('keydown',e=>window.__lensInputAudit.keys.push({trusted:e.isTrusted,key:e.key,id:e.target.id}),{capture:true,passive:true});
    });
    assert.equal(await page.evaluate(()=>innerWidth),width);
    await task(page,cdp,result);
    result.layout=await layout(page,width);result.snapshot=await snapshot(page);
    assert.ok(result.snapshot.audit.pointers.some(e=>e.trusted&&e.type===(touch?'touch':'mouse')&&['screen-hit','candle-hit'].includes(e.id)),'trusted physical control input');
    assert.ok(result.snapshot.audit.pointers.every(e=>e.trusted),'no synthetic pointer events');
    assert.deepEqual(errors,[],'no page errors');assert.deepEqual(consoleErrors,[],'no console errors');assert.deepEqual(external,[],'no external asset requests');assert.deepEqual(failed,[],'all assets loaded');
    assert.ok(scripts.length>0&&scripts.every(url=>new URL(url).pathname.startsWith('/tools/lens-25d/')),'no legacy script injection');
    assert.equal(await page.locator('script[src*="researcher"],.researcher-screen,.researcher-taskbar').count(),0);
    await page.screenshot({path:path.join(output,name+'.png')});result.status='passed';
  }catch(e){
    result.status='failed';result.failure=e.stack;result.snapshot=await snapshot(page).catch(()=>null);
    await page.screenshot({path:path.join(output,name+'-failure.png'),fullPage:true,timeout:10000}).catch(()=>{});
    fs.writeFileSync(path.join(output,name+'-failure.html'),await page.content().catch(()=>''));
    console.error('FAILURE_DIAGNOSTICS '+JSON.stringify(result));
  }finally{Object.assign(result,{errors,consoleErrors,external,failed,scripts});save();console.log(`${result.status.toUpperCase()} ${name}`);await context.close();}
}
(async()=>{
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff':'font/woff'};
  // Chromium may request its implicit favicon; this page declares none.
  server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});base=`http://127.0.0.1:${server.address().port}`;
  // Existing CI browser only; no flags, downloads or sandbox bypass retries.
  browser=await chromium.launch();
  fs.writeFileSync(path.join(output,'environment.json'),JSON.stringify({node:process.version,browser:browser.version()},null,2));
  await run('desktop-five-cases-learning',1280,false,async(page,cdp,result)=>{
    assert.equal(await q(page,'q1').locator('.return-case').count(),3,'Q1 requires three observations');
    assert.equal(await q(page,'q1').locator('[data-answer]:disabled').count(),3);
    for(const [index,id,target] of [[0,'outside2f',14.5],[1,'at2f',20],[2,'between',29.5]]){
      await select(page,id);if(target!==20)await dragTo(page,cdp,'mouse','screen-hit',target);
      assert.ok(await page.locator('#record').isEnabled());await page.locator('#record').click();
      assert.match(await evidence(page,index).textContent(),new RegExp(`光屏實際位置${target} cm`));
      assert.match(await evidence(page,index).textContent(),/倒立/);
      assert.ok((await evidence(page,index).textContent()).includes(['縮小','等大','放大'][index]),'recorded image size matches case');
      assert.equal(await history(page),index+1);
    }
    assert.match(await evidence(page,0).textContent(),/14\.5 cm/);assert.match(await model(page,0).textContent(),/透鏡另一側 15 cm/,'actual and model kept separate');
    await answer(page,'q1','all-same');assert.equal(await q(page,'q1').getAttribute('data-result'),'retry');assert.match(await q(page,'q1').locator('.answer-feedback').textContent(),/重新選擇/);
    await answer(page,'q1','real-comparison',true);assert.equal(await q(page,'q1').getAttribute('data-result'),'correct');
    assert.match(await q(page,'q1').locator('.answer-feedback').textContent(),/14\.5 cm、20 cm、29\.5 cm/);
    await select(page,'focal');await search(page,cdp,'mouse');
    assert.match(await page.locator('#physics-note').textContent(),/出射光線平行.*不是虛像/);
    assert.ok(await page.locator('#through-view').isHidden());await page.locator('#special-action').click();
    assert.equal(await history(page),4);assert.match(await evidence(page,3).textContent(),/不適用.*無有限影像/);assert.match(await model(page,3).textContent(),/出射光線平行.*不是虛像/);
    await select(page,'inside');await search(page,cdp,'mouse');
    assert.equal(await page.locator('#image-art').getAttribute('transform'),'scale(0)','virtual image not projected on screen');
    await page.locator('#special-action').click();assert.equal(await history(page),4,'through view alone does not record');
    assert.ok(await page.locator('#through-view').isVisible());assert.ok(await page.locator('#result').isHidden());
    assert.match(await page.locator('#through-art').textContent(),/正立虛像/);await page.locator('#special-action').click();assert.equal(await history(page),5);
    assert.match(await evidence(page,4).textContent(),/非光屏/);
    await answer(page,'q2','different-causes');await answer(page,'q3','finite-not-proof');assert.ok(await page.locator('#learning-complete').isVisible());
    assert.match(await q(page,'q3').locator('.answer-feedback').textContent(),/110 cm/);
    const records=await page.locator('#evidence-cards').textContent();
    await select(page,'outside2f');await dragTo(page,cdp,'mouse','candle-hit',29);
    assert.equal(await page.locator('#evidence-cards').textContent(),records,'live controls do not change recorded evidence');
    for(const id of ['q1','q2','q3'])assert.equal(await q(page,id).getAttribute('data-result'),'correct','live movement preserves answers');
    await select(page,'outside2f');await dragTo(page,cdp,'mouse','screen-hit',15);await page.locator('#record').click();
    assert.equal(await history(page),6);assert.match(await page.locator('#evidence-history').textContent(),/光屏 14\.5 cm/,'prior evidence retained');
    assert.equal(await q(page,'q1').getAttribute('data-result'),'unanswered');assert.equal(await q(page,'q3').getAttribute('data-result'),'unanswered');assert.equal(await q(page,'q2').getAttribute('data-result'),'correct','unrelated answer preserved');assert.ok(await page.locator('#learning-complete').isHidden());
    // Boundary: a real image outside the finite bench is not virtual or recordable.
    await select(page,'between');await dragTo(page,cdp,'mouse','candle-hit',11);
    assert.match(await page.locator('#physics-note').textContent(),/仍屬於實像/);assert.ok(await page.locator('#record').isDisabled());assert.ok(await page.locator('#special-action').isHidden());
    await dragTo(page,cdp,'mouse','screen-hit',40);assert.ok(await page.locator('#record').isDisabled());
    result.beforeReset=await snapshot(page);
    await page.locator('#restart').click();assert.equal(await history(page),0);assert.equal(await number(page,'object-position'),30);assert.equal(await number(page,'position'),20);assert.equal(await page.locator('#case-cards .case-badge').filter({hasText:'尚未記錄'}).count(),5);assert.equal(await page.locator('[data-question][data-result="unanswered"]').count(),3);assert.equal(await q(page,'q1').locator('[data-answer]:disabled').count(),3);
  });
  for(const kind of ['mouse','touch'])await run(`phone-${kind}-centers-learning`,390,kind==='touch',async(page,cdp,result)=>{
    await dragTo(page,cdp,kind,'screen-hit',15);await page.locator('#record').click();
    await select(page,'at2f');await page.locator('#record').click();await select(page,'between');await dragTo(page,cdp,kind,'screen-hit',30);await page.locator('#record').click();
    await answer(page,'q1','all-upright',true);assert.equal(await q(page,'q1').getAttribute('data-result'),'retry');await answer(page,'q1','real-comparison',true);assert.equal(await q(page,'q1').getAttribute('data-result'),'correct');
    await select(page,'inside');await dragTo(page,cdp,kind,'candle-hit',9);assert.equal(await number(page,'object-position'),9);
    await search(page,cdp,kind);await page.locator('#special-action').click();
    assert.match(await page.locator('#through-art').textContent(),/放大 10\.00 倍/);
    const fit=await page.locator('#through-art svg').evaluate(svg=>{const v=svg.viewBox.baseVal;return [...svg.querySelectorAll('g[transform]')].map(g=>{const b=g.getBBox(),m=g.transform.baseVal.consolidate().matrix;const points=[[b.x,b.y],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));return {left:points[0].x,top:points[0].y,right:points[1].x,bottom:points[1].y,width:v.width,height:v.height};});});
    assert.equal(fit.length,2);for(const b of fit)assert.ok(b.left>=0&&b.top>=0&&b.right<=b.width&&b.bottom<=b.height,'large u=9 virtual image fits SVG viewBox');result.virtualFit=fit;
    await page.locator('#special-action').click();assert.equal(await history(page),4);assert.match(await evidence(page,4).textContent(),/物距 9 cm/);
    if(kind==='touch'){
      await page.locator('#bench').scrollIntoViewIfNeeded();await settle(page);
      const point=await page.evaluate(()=>{const bench=document.querySelector('#bench'),r=bench.getBoundingClientRect();for(let y=Math.min(innerHeight-30,r.bottom-12);y>Math.max(160,r.top+20);y-=12)for(let x=r.left+10;x<r.right-10;x+=12){const el=document.elementFromPoint(x,y);if(el&&bench.contains(el)&&!el.closest('[data-optics-draggable]'))return {x,y};}return null;});
      assert.ok(point,'blank table point available');const before={scroll:await page.evaluate(()=>scrollY),u:await number(page,'object-position'),s:await number(page,'position')};
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]});for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:point.y-i*12,id:1}]});await page.waitForTimeout(25);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await page.waitForFunction(scroll=>scrollY>scroll+30,before.scroll);assert.equal(await number(page,'object-position'),before.u);assert.equal(await number(page,'position'),before.s);result.blankPanDelta=await page.evaluate(scroll=>scrollY-scroll,before.scroll);
    }
  });
  assert.equal(results.length,3);assert.ok(results.every(r=>r.status==='passed'),`${results.filter(r=>r.status!=='passed').length}/3 browser scenarios failed`);console.log('PASS lens-25d: three real-browser scenarios');
})().catch(error=>{console.error(error);fs.writeFileSync(path.join(output,'runner-error.txt'),error.stack||String(error));if(!browser){results.push({name:'browser-suite',status:'never-run',reason:error.message});save();}process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));});
