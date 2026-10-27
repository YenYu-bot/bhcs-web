'use strict';
// Real Chromium UI acceptance at the nested official route. Application actions
// use native keyboard/mouse/CDP touch. evaluate() reads DOM/storage, sets root
// font size, or installs explicit storage-failure fixtures; never dispatches
// application actions or imports a model into the page. Emulated touch is not
// physical-device certification. All failures retain artifacts and fail CI.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),output=path.resolve(process.env.BUOYANCY_LAB_OUTPUT||'buoyancy-lab-artifacts');
const KEY='yu-buoyancy-prototype-v1.2-g10',OLD='yu-buoyancy-prototype-v1.1';
const results=[];let server,browser,base,waterRaw,pairRaw,legacyRaw;
fs.mkdirSync(output,{recursive:true});
const save=()=>fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
const action=(page,id)=>page.locator(`[data-action="${id}"]`).first();
const click=async(page,id)=>{await action(page,id).click();};
const raw=page=>page.evaluate(key=>localStorage.getItem(key),KEY);
const physical=page=>page.locator('.instrument-row').innerText();
async function confirmAction(page,id,accept){
 const pending=page.waitForEvent('dialog');const clicking=action(page,id).click();const dialog=await pending;
 assert.equal(dialog.type(),'confirm');if(accept)await dialog.accept();else await dialog.dismiss();await clicking;
}
async function prepare(page){
 for(const id of ['zero','hang','recordW'])await click(page,id);
 await page.locator('#w').fill('1.350');await page.locator('#w').press('Enter');
 for(const id of ['placeWaste','fill','removeWaste','cupToScale','tare','cupToOutlet'])await click(page,id);
}
async function round(page,fluid){
 await prepare(page);
 for(let i=0;i<10;i++){
  // Native keyboard activation is a single step, not a held pointer.
  await action(page,'lower').waitFor({state:'visible'});await action(page,'lower').focus();await page.keyboard.press('Enter');
 }
 await click(page,'recordT');await page.locator('[data-observe="smaller"]').click();
 await click(page,'cupToScale');await click(page,'recordMass');
 const answer=fluid==='water'?'0.500':'0.600';
 await page.locator('#difference').fill(answer);await page.locator('#displaced').fill(answer);await page.locator('#displaced').press('Enter');
 await page.locator('#explanation').fill(`${fluid}: W 與 T 的差等於排液重量 ${answer} N。`);await click(page,'save');
 const card=page.locator('.saved-card').filter({has:page.locator('[data-edit]')}).last();
 assert.match(await card.innerText(),/1\.350 N/);assert.ok((await card.innerText()).includes(fluid==='water'?'0.850 N':'0.750 N'));
 assert.ok((await card.innerText()).includes(fluid==='water'?'50.0 g':'60.0 g'));
}
async function layout(page,width){
 const data=await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth,
  items:[...document.querySelectorAll('.panel,.saved-card,.badge,.chapter button,.compare')].map(e=>({text:e.textContent.slice(0,80),r:e.getBoundingClientRect().toJSON(),scroll:e.scrollWidth,client:e.clientWidth})),
  handles:[...document.querySelectorAll('.drag-handle')].map(e=>({r:e.getBoundingClientRect().toJSON(),touch:getComputedStyle(e).touchAction})),benchTouch:getComputedStyle(document.querySelector('.bench')).touchAction}));
 assert.equal(data.width,width);assert.ok(data.doc<=width+2,`page width ${data.doc} exceeds ${width}`);
 for(const e of data.items){assert.ok(e.r.left>=-1&&e.r.right<=width+1,`viewport containment ${e.text}`);assert.ok(e.scroll<=e.client+2,`clipped text ${e.text}`);}
 assert.equal(data.handles.length,2);for(const e of data.handles){assert.ok(e.r.width>=44&&e.r.height>=44);assert.equal(e.touch,'none');}
 assert.notEqual(data.benchTouch,'none','blank bench remains scrollable');return data;
}
async function teacher(page){
 const image=page.locator('.teacher svg image');assert.equal(await image.count(),1);
 assert.equal(await image.getAttribute('href'),'img/teacher-body-v3.png');
 const dimensions=await page.evaluate(()=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve([i.naturalWidth,i.naturalHeight]);i.onerror=()=>reject(Error('teacher image failed'));i.src='img/teacher-body-v3.png';}));
 assert.deepEqual(dimensions,[948,1659]);
}
async function run(name,width,touch,task,fixture){
 const result={name,width,touch,status:'running'};results.push(result);save();
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:touch,isMobile:touch,deviceScaleFactor:1,reducedMotion:'reduce'});
 if(fixture)await context.addInitScript(({KEY,OLD,current,legacy,denied})=>{
  if(location.protocol!=='http:')return;
  if(current!==undefined&&!sessionStorage.getItem('fixture-installed'))localStorage.setItem(KEY,current);
  if(legacy!==undefined&&!sessionStorage.getItem('fixture-installed'))localStorage.setItem(OLD,legacy);
  sessionStorage.setItem('fixture-installed','1');
  if(denied){Storage.prototype.getItem=function(){throw new DOMException('denied','SecurityError')};Storage.prototype.setItem=function(){throw new DOMException('denied','SecurityError')};}
 },{KEY,OLD,...fixture});
 const page=await context.newPage(),errors=[],failed=[],external=[];page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
 await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==base){external.push(route.request().url());return route.abort();}return route.continue();});
 try{
  await page.goto(base+'/tools/buoyancy-lab/',{waitUntil:'networkidle'});await action(page,'zero').waitFor();await teacher(page);
  await task(page,touch?await context.newCDPSession(page):null,result);
  result.layout=await layout(page,width);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.deepEqual(external,[]);
  assert.equal(await page.locator('script[src*="researcher"],script[src*="site.js"],.researcher-screen').count(),0);
  await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});result.status='passed';
 }catch(error){result.status='failed';result.failure=error.stack;await page.screenshot({path:path.join(output,name+'-failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(output,name+'-failure.html'),await page.content().catch(()=>''));}
 finally{Object.assign(result,{errors,failed,external});save();await context.close();}
}
async function center(page,selector){const el=page.locator(selector);await el.scrollIntoViewIfNeeded();const r=await el.boundingBox();assert.ok(r);return {x:r.x+r.width/2,y:r.y+r.height/2};}
async function touchDrag(cdp,p,dy,cancel=false){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]});for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x,y:p.y+dy*i/5,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});}
(async()=>{
 const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json'};
 server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;
 // Legacy hydration fixture only: no current evidence is fabricated. The two
 // current records below are produced end-to-end by real browser controls.
 const m=await import(pathToFileURL(path.join(root,'tools/buoyancy-lab/legacy-model.mjs')).href);let s=m.createRun('water');
 for(const id of ['zero','hang','recordW'])s=m.act(s,id);s=m.act(s,'transcribeW',{value:'1.323'});
 for(const id of ['placeWaste','fill','settle','removeWaste','cupToScale','tare','cupToOutlet'])s=m.act(s,id);
 for(let i=0;i<10;i++){s=m.act(s,'lower');s=m.act(s,'settle');}s=m.act(s,'recordT');s=m.act(s,'observe',{answer:'smaller'});s=m.act(s,'cupToScale');s=m.act(s,'recordMass');s=m.act(s,'calculate',{difference:'.490',displaced:'.490'});
 legacyRaw=JSON.stringify({records:[m.saveSnapshot(s,'legacy original')],revisions:{},drafts:{water:'legacy draft'},comparison:'legacy comparison'});
 browser=await chromium.launch({headless:true});
 await run('water-reload-brine-comparison',1280,false,async page=>{
  await round(page,'water');waterRaw=await raw(page);assert.equal(JSON.parse(waterRaw).records.length,1);
  await page.reload();await action(page,'select-brine').waitFor();assert.equal(await page.locator('.evidence-item.empty').count(),3);assert.match(await physical(page),/—/);
  await click(page,'select-brine');await round(page,'brine');assert.equal(await page.locator('#comparison-panel').count(),1);
  await page.locator('#comparison').fill('相同 W，濃鹽水排液重與浮力較大。');await click(page,'compare');pairRaw=await raw(page);
  const before=JSON.parse(pairRaw).records;const prompt=page.waitForEvent('dialog'),editing=page.locator('[data-edit]').first().click();await (await prompt).accept('修訂解釋但不改證據');await editing;
  const after=JSON.parse(await raw(page));assert.deepEqual(after.records,before);assert.equal(after.revisions[before[0].runId].at(-1).text,'修訂解釋但不改證據');
  await page.reload();await page.locator('#comparison-panel').waitFor();assert.equal(await page.locator('#comparison').inputValue(),'相同 W，濃鹽水排液重與浮力較大。');assert.equal(await page.locator('.evidence-item.empty').count(),3);
 });
 assert.ok(waterRaw&&pairRaw,'browser-produced persistence fixtures required; do not skip dependent scenarios');
 for(const width of [360,390,412,1280])await run(`layout-${width}-200-root-font`,width,false,async(page,cdp,result)=>{
  assert.equal(await page.locator('.saved-card').count(),2);result.normal=await layout(page,width);await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  await page.locator('#comparison').fill('長篇比較解釋，保留完整原始證據，不產生頁面橫向捲動。'.repeat(12));await click(page,'compare');
 },{current:pairRaw});
 await run('brine-only-and-denied-storage',390,false,async page=>{
  await click(page,'select-brine');await round(page,'brine');assert.equal(await page.locator('#comparison-panel').count(),0);assert.equal(await action(page,'water').count(),1);assert.match(await page.locator('body').innerText(),/記憶體/);
  await page.reload();await action(page,'zero').waitFor();assert.equal(await page.locator('.saved-card').count(),0);
 },{denied:true});
 await run('corrupt-current-legacy-cancel-and-quota',390,false,async page=>{
  assert.match(await page.locator('body').innerText(),/原始|異常|損壞/);assert.equal(await page.locator('.saved-card').count(),1);assert.equal(await page.locator('[data-edit]').count(),0);
  const original=await raw(page);await confirmAction(page,'clear',false);assert.equal(await raw(page),original);
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError')};});
  await confirmAction(page,'clear',true);assert.equal(await raw(page),original);assert.match(await page.locator('body').innerText(),/重設儲存失敗/);
  await round(page,'water');assert.equal(await raw(page),original);assert.equal(await page.evaluate(key=>localStorage.getItem(key),OLD),legacyRaw);
  assert.equal(await page.locator('#comparison-panel').count(),0,'legacy and current records cannot pair');
 },{current:'{bad-json',legacy:legacyRaw});
 await run('legacy-preserved-current-clear',390,false,async page=>{
  assert.equal(await page.locator('[data-edit]').count(),2);await confirmAction(page,'clear',false);assert.equal(await raw(page),pairRaw);
  await confirmAction(page,'clear',true);assert.equal(JSON.parse(await raw(page)).records.length,0);assert.equal(await page.evaluate(key=>localStorage.getItem(key),OLD),legacyRaw);
  assert.equal(await page.locator('.saved-card').count(),1);assert.equal(await page.locator('[data-edit]').count(),0);
 },{current:pairRaw,legacy:legacyRaw});
 await run('touch-drag-cancel-hold-and-blank-scroll',390,true,async(page,cdp,result)=>{
  await click(page,'zero');const start=await physical(page);let p=await center(page,'[data-drag="object"]');
  await touchDrag(cdp,p,-40,true);assert.equal(await physical(page),start,'cancelled object gesture does not hang');
  p=await center(page,'[data-drag="object"]');await touchDrag(cdp,p,-40);await action(page,'recordW').waitFor();
  await click(page,'recordW');await page.locator('#w').focus();await page.keyboard.down('Enter');await page.keyboard.down('Enter');await page.keyboard.up('Enter');assert.match(await page.locator('#message').innerText(),/先填/);
  await page.locator('#w').fill('1.350');await page.locator('#w').press('Enter');
  for(const id of ['placeWaste','fill','removeWaste','cupToScale','tare','cupToOutlet'])await click(page,id);
  p=await center(page,'#lower');await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]});await page.waitForTimeout(520);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  await page.waitForTimeout(350);const stopped=await physical(page);await page.waitForTimeout(900);assert.equal(await physical(page),stopped,'cancel stops held lowering without restart');
  await confirmAction(page,'up',false);assert.equal(await physical(page),stopped,'cancel reset preserves physical state');
  await page.locator('.bench').scrollIntoViewIfNeeded();
  const blank=await page.evaluate(()=>{const bench=document.querySelector('.bench'),r=bench.getBoundingClientRect();for(let y=Math.min(innerHeight-30,r.bottom-15);y>Math.max(160,r.top+20);y-=12)for(let x=r.left+12;x<r.right-12;x+=12){const e=document.elementFromPoint(x,y);if(e&&bench.contains(e)&&!e.closest('button'))return {x,y};}return null;});
  assert.ok(blank,'blank bench point found');const before=await page.evaluate(()=>scrollY);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...blank,id:1}]});for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:blank.x,y:blank.y-i*10,id:1}]});await page.waitForTimeout(25);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForFunction(y=>scrollY>y+20,before);assert.equal(await physical(page),stopped);result.blankPanDelta=await page.evaluate(y=>scrollY-y,before);
 });
 await run('keyboard-repeat-and-mouse-hold-release',1280,false,async(page)=>{
  await prepare(page);await action(page,'lower').focus();await page.keyboard.down('Enter');await page.keyboard.down('Enter');await page.waitForTimeout(600);await page.keyboard.up('Enter');
  assert.match(await physical(page),/1\.300/,'held Enter does not repeat lower');
  const p=await center(page,'#lower');await page.mouse.move(p.x,p.y);await page.mouse.down();await page.waitForTimeout(520);await page.mouse.up();await page.waitForTimeout(350);
  const stopped=await physical(page);await page.waitForTimeout(900);assert.equal(await physical(page),stopped,'mouse release terminates hold');
  await confirmAction(page,'reset',false);assert.equal(await physical(page),stopped);await confirmAction(page,'reset',true);assert.equal(await page.locator('.evidence-item.empty').count(),3);await action(page,'zero').waitFor();
 });
 assert.equal(results.length,10);assert.ok(results.every(r=>r.status==='passed'),`${results.filter(r=>r.status!=='passed').length} buoyancy browser scenarios failed`);
 console.log('PASS buoyancy-lab: 10 real Chromium scenarios (not physical-device certification)');
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(output,'runner-error.txt'),e.stack||String(e));if(!browser){results.push({name:'browser-suite',status:'never-run',reason:e.message});save();}process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));});
