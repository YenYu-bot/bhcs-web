'use strict';
// Real Chromium input regression. Run with the existing CI Playwright NODE_PATH.
// Diagnostics are read-only assertions; all model/course changes use real UI input.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const output = path.resolve(process.env.MICROSCOPE_3D_OUTPUT || 'microscope-3d-artifacts');
const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.woff':'font/woff'};
const results = [];
let browser, server, base;
fs.mkdirSync(output, {recursive:true});
const saveResults = () => fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
const diagnostics = page => page.evaluate(() => window.labDiagnostics());
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
// CDP/DOM coordinates can round through float32; 0.0001 model units is far
// below a CSS pixel and still rejects the original projection/axis regression.
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-4, `${label}: expected ${expected}, received ${actual}`);

async function scenePoint(page, source, action = 'slide') {
  await page.locator('#scene').scrollIntoViewIfNeeded();
  await settle(page);
  if (source === 'label') {
    const label = page.locator(`#scene [data-action="${action}"] .control-label`);
    assert.ok(await label.isVisible(), `${action} label is visible in default view`);
    const r = await label.boundingBox();
    return {x:r.x + r.width / 2, y:r.y + r.height / 2};
  }
  // Pick an actually hit-testable projected body triangle, not a label or a
  // bounding-box corner (the glass is oblique). Do not dispatch any DOM events.
  const point = await page.evaluate(action => {
    const body = document.querySelector(`#scene [data-body-hit="${action}"]`);
    if (!body) return null;
    const matrix = body.getScreenCTM();
    const candidates = [...body.getAttribute('d').matchAll(/M([^Z]+)Z/g)].map(match => {
      const p = match[1].split('L').map(value => value.trim().split(/\s+/).map(Number));
      const area = Math.abs((p[1][0]-p[0][0])*(p[2][1]-p[0][1])-(p[1][1]-p[0][1])*(p[2][0]-p[0][0]));
      const q = new DOMPoint(p.reduce((sum,v)=>sum+v[0],0)/3, p.reduce((sum,v)=>sum+v[1],0)/3).matrixTransform(matrix);
      return {x:q.x,y:q.y,area};
    }).sort((a,b)=>b.area-a.area);
    return candidates.find(p => p.x > 1 && p.x < innerWidth-22 && p.y > 25 && p.y < innerHeight-25 && document.elementFromPoint(p.x,p.y) === body) || null;
  }, action);
  assert.ok(point, `visible hit-testable ${action} body triangle in default table view`);
  return point;
}

async function drag(page, cdp, kind, point, dx, dy, action = 'slide') {
  if (kind === 'mouse') {
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
  } else {
    await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x:point.x,y:point.y,id:1}]});
  }
  try {
    assert.equal((await diagnostics(page)).visual.activeAction, action, 'physical input hits the intended control');
    for (let i=1; i<=5; i++) {
      const x=point.x+dx*i/5, y=point.y+dy*i/5;
      if (kind === 'mouse') await page.mouse.move(x,y);
      else await cdp.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{x,y,id:1}]});
      await page.waitForTimeout(20);
    }
  } finally {
    if (kind === 'mouse') await page.mouse.up();
    else await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
  }
  await settle(page);
}

async function observe(page) {
  await page.waitForFunction(() => !window.labDiagnostics().course.cooldown);
  await page.locator('#course [data-course-action="observe"]').click();
  await settle(page);
}
async function directionStart(page) {
  assert.equal((await diagnostics(page)).course.phase, 'focus');
  // Ordinary focus buttons are allowed; direction evidence below must come
  // exclusively from the body/label drag, never arrows or a keyboard fallback.
  if (await page.locator('#controls').getAttribute('open') === null) await page.locator('#controls > summary').click();
  await page.locator('[data-focus-step="coarse,1"]').click();
  await page.locator('[data-focus-step="coarse,1"]').click();
  assert.equal((await diagnostics(page)).clarity, 100);
  await observe(page);
  assert.equal((await diagnostics(page)).course.phase, 'direction-start');
  await observe(page);
  assert.equal((await diagnostics(page)).course.phase, 'direction-move');
  assert.equal((await diagnostics(page)).view, 'table');
}

async function test(name, width, touch, run) {
  const result = {name, width, input:touch?'CDP touch':'mouse', status:'running'};
  results.push(result); saveResults();
  const context = await browser.newContext({viewport:{width,height:844}, hasTouch:touch, isMobile:width===390, deviceScaleFactor:1, reducedMotion:'reduce'});
  const page = await context.newPage();
  const errors=[], scripts=[], failedResponses=[];
  page.setDefaultTimeout(15000);
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {if(request.resourceType()==='script') scripts.push(request.url());});
  page.on('response', response => {if(response.status()>=400) failedResponses.push(`${response.status()} ${response.url()}`);});
  const cdp = touch ? await context.newCDPSession(page) : null;
  try {
    await page.goto(`${base}/tools/microscope-3d/`, {waitUntil:'networkidle'});
    await page.waitForFunction(() => typeof window.labDiagnostics === 'function');
    await settle(page);
    result.renderer=(await diagnostics(page)).renderer;
    assert.equal(result.renderer,'WebGL','B1 requires WebGL; SVG fallback is not WebGL acceptance');
    assert.equal((await diagnostics(page)).view, 'table', 'initial view remains table');
    assert.equal((await diagnostics(page)).state.objective, 4);
    assert.equal(await page.locator('.workspace').getAttribute('data-view'), 'table');
    await page.evaluate(() => {
      window.__browserInputAudit = {keyboard:0, fallback:0, views:0, trusted:{mouse:0,touch:0}, untrusted:0};
      document.addEventListener('keydown', () => window.__browserInputAudit.keyboard++, true);
      document.addEventListener('click', event => {
        if(event.target.closest('[data-move]')) window.__browserInputAudit.fallback++;
        if(event.target.closest('button[data-view],#cameraReset,#primaryAction')) window.__browserInputAudit.views++;
      }, true);
      document.addEventListener('pointerdown', event => {
        if (!event.isTrusted) window.__browserInputAudit.untrusted++;
        else if(event.target.closest('#scene')) window.__browserInputAudit.trusted[event.pointerType]++;
      }, true);
    });
    await run(page, cdp, result);
    result.diagnostics = await diagnostics(page);
    result.inputAudit = await page.evaluate(() => window.__browserInputAudit);
    assert.equal(result.inputAudit.keyboard, 0, 'no keyboard fallback');
    assert.equal(result.inputAudit.fallback, 0, 'no slide-arrow fallback');
    assert.equal(result.inputAudit.views, 0, 'no view-change workaround');
    assert.equal(result.inputAudit.untrusted, 0, 'no synthetic DOM input');
    assert.ok(result.inputAudit.trusted[touch?'touch':'mouse'] > 0, 'browser delivered trusted input');
    assert.equal(result.diagnostics.view, 'table');
    assert.deepEqual(errors, [], 'no page errors');
    assert.deepEqual(failedResponses, [], 'all local assets loaded');
    assert.ok(scripts.length > 0);
    assert.ok(scripts.every(url => new URL(url).pathname.startsWith('/tools/microscope-3d/')), `no legacy researcher scripts injected: ${scripts.join(', ')}`);
    assert.equal(await page.locator('script[src*="researcher"],.researcher-screen,.researcher-taskbar').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+2), 'no horizontal page overflow');
    await page.screenshot({path:path.join(output, `${name}.png`),timeout:10000});
    result.status='passed';
  } catch (error) {
    result.status='failed'; result.failure=error.stack;
    result.diagnostics=await diagnostics(page).catch(()=>null);
    await page.screenshot({path:path.join(output, `${name}-failure.png`),fullPage:true,timeout:10000}).catch(()=>{});
    fs.writeFileSync(path.join(output, `${name}-failure.html`), await page.content().catch(()=>''));
  } finally {
    result.pageErrors=errors; result.scripts=scripts; result.failedResponses=failedResponses;
    saveResults(); console.log(`${result.status.toUpperCase()} ${name}${result.failure?'\n'+result.failure:''}`);
    await context.close();
  }
}

(async () => {
  server=http.createServer((req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(root, '.'+pathname+(pathname.endsWith('/')?'index.html':''));
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    try {res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}
    catch {res.writeHead(404).end();}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  base=`http://127.0.0.1:${server.address().port}`;
  // Normal Playwright launch only: never retry with sandbox/security bypasses.
  browser=await chromium.launch();
  fs.writeFileSync(path.join(output,'environment.json'),JSON.stringify({node:process.version,browser:browser.version()},null,2));
  for(const kind of ['mouse','touch']) for(const source of ['body','label']) {
    await test(`mobile-horizontal-${kind}-${source}`,390,kind==='touch',async(page,cdp,result)=>{
      await directionStart(page);
      const point=await scenePoint(page,source);
      const width=await page.locator('#scene').evaluate(el=>el.getBoundingClientRect().width);
      const before=await diagnostics(page);
      await drag(page,cdp,kind,point,20,0);
      const after=await diagnostics(page), expected=(20-6)*540/(.6*width);
      near(after.state.stageX-before.state.stageX,expected,'20 CSS px horizontal X');
      near(after.state.stageY,0,'horizontal Y stays zero');
      if(Math.abs(width-390)<1e-7) near(after.state.stageX,32.30769230769231,'390px scene regression');
      assert.ok(after.course.ready,'actual drag makes task 2 evidence ready');
      await observe(page);
      assert.equal((await diagnostics(page)).course.phase,'direction-answer');
      assert.equal((await diagnostics(page)).course.answerEvidence.imageDirection,'left');
      await page.waitForFunction(() => !window.labDiagnostics().course.cooldown);
      await page.locator('#course [data-course-action="answer"][data-value="left"]').click();
      assert.equal((await diagnostics(page)).course.progress,2,'correct answer completes task 2');
      assert.equal((await diagnostics(page)).course.phase,'compare-low');
      assert.match(await page.locator('#course .course-progress').textContent(),/2／3/);
      result.drag={source,point,sceneWidth:width,dx:20,dy:0,expectedX:expected,actualX:after.state.stageX,actualY:after.state.stageY};
    });
  }
  for(const kind of ['mouse','touch']) for(const [axis,dx,dy] of [['vertical',0,20],['diagonal',20,20]]) {
    await test(`mobile-${axis}-${kind}`,390,kind==='touch',async(page,cdp,result)=>{
      await directionStart(page);
      const point=await scenePoint(page,'label');
      const width=await page.locator('#scene').evaluate(el=>el.getBoundingClientRect().width);
      await drag(page,cdp,kind,point,dx,dy);
      const after=await diagnostics(page), expected=14*540/(.6*width);
      near(after.state.stageX,dx?expected:0,`${axis} X`);
      near(after.state.stageY,-expected,`${axis} Y`);
      assert.equal(after.course.ready,false,`${axis} cannot qualify as horizontal evidence`);
      assert.ok(await page.locator('#course [data-course-action="observe"]').isDisabled());
      assert.equal(after.course.phase,'direction-move');
      result.sceneWidth=width;
    });
  }
  await test('mobile-blank-scene-scroll',390,true,async(page,cdp,result)=>{
    await page.locator('#scene').scrollIntoViewIfNeeded(); await settle(page);
    const point=await page.evaluate(()=>{
      const scene=document.querySelector('#scene'),r=scene.getBoundingClientRect();
      for(let y=Math.min(innerHeight-50,r.bottom-30);y>Math.max(180,r.top+160);y-=15) for(let x=r.left+12;x<r.right-12;x+=15){
        const hit=document.elementFromPoint(x,y);
        if(hit && scene.contains(hit) && !hit.closest('[data-action],[data-body-hit]')) return {x,y};
      }
      return null;
    });
    assert.ok(point,'blank scene area is available');
    const before=await page.evaluate(()=>({scroll:scrollY,state:window.labDiagnostics().state}));
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]});
    for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:point.y-i*12,id:1}]});await page.waitForTimeout(25);}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForFunction(scroll=>scrollY>scroll+30,before.scroll);
    const after=await page.evaluate(()=>({scroll:scrollY,state:window.labDiagnostics().state}));
    assert.deepEqual(after.state,before.state,'blank touch scroll must not operate microscope');
    result.scrollDelta=after.scroll-before.scroll;
  });
  await test('desktop-basic-and-40x-lock',1280,false,async(page,cdp,result)=>{
    await directionStart(page);
    const point=await scenePoint(page,'body');
    const width=await page.locator('#scene').evaluate(el=>el.getBoundingClientRect().width);
    await drag(page,cdp,'mouse',point,20,0);
    near((await diagnostics(page)).state.stageX,14*540/(.6*width),'desktop width-normalized X');
    near((await diagnostics(page)).state.stageY,0,'desktop Y');
    await page.locator('[data-objective="40"]').click();
    assert.equal((await diagnostics(page)).state.objective,40);
    assert.equal(await page.locator('#total').textContent(),'400×');
    assert.ok(await page.locator('#coarse').isDisabled());
    assert.ok(await page.locator('[data-focus-step="coarse,1"]').isDisabled());
    assert.equal(await page.locator('#scene [data-action="coarse"]').getAttribute('aria-disabled'),'true');
    const before=(await diagnostics(page)).state.coarse;
    await drag(page,cdp,'mouse',await scenePoint(page,'label','coarse'),0,80,'coarse');
    assert.equal((await diagnostics(page)).state.coarse,before,'40× coarse drag is locked');
    assert.match(await page.locator('#status').textContent(),/粗動已鎖定/);
    result.sceneWidth=width;
  });
  assert.ok(results.length===10 && results.every(result=>result.status==='passed'),`${results.filter(result=>result.status!=='passed').length}/${results.length} browser regressions failed`);
  console.log(`PASS ${results.length} real-browser microscope-3d regressions`);
})().catch(error=>{
  console.error(error);
  fs.writeFileSync(path.join(output,'runner-error.txt'),error.stack||String(error));
  if(!browser) {results.push({name:'browser-suite',status:'never-run',reason:error.message});saveResults();}
  process.exitCode=1;
}).finally(async()=>{
  if(browser) await browser.close();
  if(server) await new Promise(resolve=>server.close(resolve));
});
