/* Real Chromium regression. CSS viewport simulations are not physical-device,
 * Safari, touch-hardware, or screen-reader testing. No DOM/browser substitutes.
 * Run: node scripts/check_metal_activity_desk_browser.cjs
 * Optional: CHROMIUM_EXECUTABLE=/usr/bin/chromium SITE_OUTPUT=site-artifacts */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.SITE_OUTPUT || 'metal-activity-desk-artifacts');
const origin = 'http://127.0.0.1:4173';
const pathname = '/tools/metal-activity-desk/';
const currentKey = 'bhcs-metal-inquiry-v4';
const legacyKeys = ['bhcs-metal-desk-preview-v1','bhcs-metal-inquiry-v2','bhcs-metal-inquiry-v3'];
// Keys independently read from the retained official page and assets/science-lab.js.
const oldKeys = ['bhcs-inquiry-v1:/tools/science/metal-activity.html',
  'bhcs-science-v2-metal-activity','bhcs-science-v2-metal-activity-draft','bhcs-science-v2-metal-activity-guide'];
const sentinel = Object.fromEntries(oldKeys.map((key,i)=>[key,JSON.stringify({sentinel:i,unchanged:true})]));
// Retained assets/researcher-lab.js: path=location.pathname; show()/restore use
// sessionStorage['bhcs-researcher-screen:'+path]. This key is per-tab, not localStorage.
const oldSessionSentinel = {'bhcs-researcher-screen:/tools/science/metal-activity.html':'notebook'};
const diagnostics = new WeakMap();
const results = []; let browser;
async function seedOldSession(page){await page.evaluate(values=>{for(const [key,value]of Object.entries(values))sessionStorage.setItem(key,value);},oldSessionSentinel);}
async function finishContext(context){
 // Wait for resource failures/console events before declaring this scenario clean.
 for(const page of context.pages())await page.waitForLoadState('networkidle');
 assert.deepEqual(diagnostics.get(context),[], 'Zero page exceptions, console errors, HTTP failures or unexpected request failures');
 await context.close();
}
async function blocked(page,message,resetEnabled=false){
 await page.waitForFunction(({message,resetEnabled})=>{
  const main=document.querySelector('main'),banner=document.querySelector('#session-banner');
  const retry=document.querySelector('#session-retry'),reset=document.querySelector('#reset-open');
  return document.querySelectorAll('#benches .station').length===3&&main.inert&&!banner.hidden&&!retry.hidden
   &&document.querySelector('#session-message').textContent.includes(message)&&reset.disabled===!resetEnabled;
 },{message,resetEnabled});
}
const state = page => page.evaluate(key=>JSON.parse(localStorage.getItem(key)),currentKey);
const visible = async (page, selector, expected=true) => assert.equal(await page.locator(selector).isVisible(),expected,selector);
const textHas = async (page,selector,expression) => assert.match(await page.locator(selector).innerText(),expression,selector);
async function editable(page){await page.waitForFunction(()=>!document.querySelector('main').inert);}
async function click(page,selector,keyboard=false){const el=page.locator(selector).first();if(keyboard){await el.focus();await page.keyboard.press('Enter');}else await el.click();}
async function oldUnchanged(page){
 assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),oldKeys),sentinel);
 assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,sessionStorage.getItem(k)])),Object.keys(oldSessionSentinel)),oldSessionSentinel);
}
async function open(width=1165,seed={},fault,reducedMotion='reduce'){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion});
 const errors=[];diagnostics.set(context,errors);
 // Storage/lock fault injections are caught by the production app. They have no
 // console/pageerror allowlist: an uncaught injected exception is still a failure.
 context.on('page',page=>{
  page.on('pageerror',error=>errors.push({kind:'pageerror',url:page.url(),message:error.message}));
  page.on('console',message=>{if(message.type()==='error')errors.push({kind:'console',url:page.url(),message:message.text()});});
 });
 context.on('requestfailed',request=>errors.push({kind:'requestfailed',url:request.url(),message:request.failure()?.errorText}));
 context.on('response',response=>{if(response.status()>=400)errors.push({kind:'http',url:response.url(),status:response.status()});});
 await context.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.origin!==origin){errors.push({kind:'unexpected-origin',url:url.href});return route.abort();}
  if(url.pathname==='/__fixture')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Storage fixture</title>'});
  const relative=decodeURIComponent(url.pathname).replace(/^\//,'')+(url.pathname.endsWith('/')?'index.html':'');
  const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){errors.push({kind:'missing-file',url:url.href});return route.fulfill({status:404,body:'Not found'});}
  const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.png':'image/png'};
  return route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
 });
 const page=await context.newPage();
 await page.goto(origin+'/__fixture');await seedOldSession(page);
 await page.evaluate(seed=>{for(const [k,v]of Object.entries(seed))localStorage.setItem(k,v);},{...sentinel,...seed});
 if(fault)await context.addInitScript(fault);
 await page.goto(origin+pathname);await page.locator('#benches .station').first().waitFor();
 return {context,page,errors};
}
async function snap(page,name){await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),'No horizontal viewport overflow');}
async function base(page,metal,index,keyboard=false){await click(page,`[data-metal="${metal}"]`,keyboard);await click(page,`[data-place="${index}"]`,keyboard);await page.locator(`[data-reset="${index}"]`).waitFor();}
async function extra(page,metal,solution,index){await click(page,`[data-extra-metal="${metal}"]`);await click(page,`[data-solution="${solution}"]`);await click(page,`[data-extra-place="${index}"]`);await page.locator(`[data-extra-fresh="${index}"]`).waitFor();}
async function connect(page,id,pair){await click(page,`#cards [data-record-select="${id}"]`);await click(page,`[data-connect="${pair}"]`);}
async function acid(page,action,value,keyboard=false){await click(page,`[data-acid-action="${action}"][data-value="${value}"]`,keyboard);}
async function radio(page,section,field,value){await page.locator(`#review-${section}-${field}-${value}`).check();}
async function review(page){
 await click(page,'#review-open',true);
 await page.locator('#review-origin-recordId').selectOption('r1');
 await radio(page,'origin','donor','Cu2');await radio(page,'origin','acceptor','Zn');await radio(page,'origin','deposit','Zn');
 await click(page,'#review-check-origin');await textHas(page,'#review-feedback',/再看一次/);
 await radio(page,'origin','donor','Zn');await radio(page,'origin','acceptor','Cu2');await radio(page,'origin','deposit','Cu');
 await textHas(page,'#review-feedback',/尚未確認/);await click(page,'#review-check-origin',true);
 await click(page,'#review-tab-acids',true);
 await page.locator('#review-acids-zincId').selectOption('a1');await page.locator('#review-acids-ironId').selectOption('a2');
 await radio(page,'acids','answer','equal');await page.locator('#review-acids-evidenceId').selectOption('r5');
 await click(page,'#review-check-acids');await textHas(page,'#review-feedback',/再看一次/);
 await radio(page,'acids','answer','need-direct');await click(page,'#review-check-acids');await textHas(page,'#review-feedback',/再看一次/);
 await page.locator('#review-acids-evidenceId').selectOption('r2');await click(page,'#review-check-acids');await textHas(page,'#review-feedback',/再看一次/);
 await page.locator('#review-acids-evidenceId').selectOption('r4');await click(page,'#review-check-acids');
 await click(page,'#review-tab-source');await page.locator('#review-source-copperId').selectOption('a3');
 await radio(page,'source','answer','no-bubbles');await click(page,'#review-check-source');await textHas(page,'#review-feedback',/再看一次/);
 await radio(page,'source','answer','reference');await click(page,'#review-check-source');await textHas(page,'#review-progress',/3 \/ 3/);await visible(page,'#review-complete');
 await acid(page,'unlink','HCu');await textHas(page,'#review-progress',/2 \/ 3/);await visible(page,'#review-complete',false);
 await page.reload();await editable(page);await textHas(page,'#review-progress',/2 \/ 3/);
 await acid(page,'reference','');await textHas(page,'#review-progress',/3 \/ 3/);
 // A changed citation is explicitly unconfirmed even when it still supports the answer.
 await click(page,'#review-tab-acids');await page.locator('#review-acids-evidenceId').selectOption('r2');
 await textHas(page,'#review-progress',/2 \/ 3/);await page.locator('#review-acids-evidenceId').selectOption('r4');
 await textHas(page,'#review-progress',/2 \/ 3/);await click(page,'#review-check-acids');await textHas(page,'#review-progress',/3 \/ 3/);
}
async function journey(width){
 const {context,page,errors}=await open(width);await editable(page);
 await base(page,'Zn',0,true);await base(page,'Fe',1);await base(page,'Cu',2);
 await click(page,'[data-inspect-record="r1"]',true);await visible(page,'#inspect-dialog');
 await click(page,'#view-before',true);assert.equal(await page.locator('#view-before').getAttribute('aria-pressed'),'true');
 await click(page,'#view-after');await click(page,'#inspect-close',true);
 await click(page,'#compare-btn',true);await extra(page,'Zn','FeSO4',0);await extra(page,'Fe','ZnSO4',1);
 await connect(page,'r5','ZnFe');assert.equal((await state(page)).connections.ZnFe,undefined);
 await connect(page,'r1','ZnFe');assert.equal((await state(page)).connections.ZnFe,undefined);
 await connect(page,'r4','ZnFe');await connect(page,'r2','FeCu');await visible(page,'#chain');
 await click(page,'#next-chapter',true);for(const metal of ['Zn','Fe','Cu'])await acid(page,'observe',metal,metal==='Zn');
 await acid(page,'before','Zn');await acid(page,'before','Zn');await acid(page,'pause','');
 await acid(page,'select','a3');await acid(page,'connect','FeH');assert.equal((await state(page)).lesson.links.FeH,undefined);
 await acid(page,'select','a1');await acid(page,'connect','FeH');assert.equal((await state(page)).lesson.links.FeH,undefined);
 await acid(page,'connect','ZnH');await acid(page,'select','a2');await acid(page,'connect','FeH');
 await visible(page,'#hydrogen-chain',false);await acid(page,'reference','');await visible(page,'#hydrogen-chain');
 await click(page,'[data-remove-link="ZnFe"]');await visible(page,'#hydrogen-chain',false);await connect(page,'r4','ZnFe');await visible(page,'#hydrogen-chain');
 await click(page,'#electron-open',true);for(const step of ['0','1','2']){await acid(page,'electron-step',step,true);assert.equal(await page.locator(`[data-acid-action="electron-step"][data-value="${step}"]`).getAttribute('aria-pressed'),'true');}
 await acid(page,'electron-track','zinc',true);assert.equal(await page.locator('[data-acid-action="electron-track"][data-value="zinc"]').getAttribute('aria-pressed'),'true');await acid(page,'electron-track','copper');assert.equal(await page.locator('[data-acid-action="electron-track"][data-value="copper"]').getAttribute('aria-pressed'),'true');await acid(page,'electron-track','copper');assert.equal(await page.locator('[data-acid-action="electron-track"][data-value="copper"]').getAttribute('aria-pressed'),'false');
 assert.equal((await state(page)).lesson.electronStep,2);
 await review(page);await noOverflow(page);await snap(page,`journey-${width}`);
 const full=await state(page);assert.equal(full.records.length,5);assert.equal(full.lesson.records.length,3);await oldUnchanged(page);
 await page.reload();await editable(page);await textHas(page,'#review-progress',/3 \/ 3/);assert.equal((await state(page)).lesson.electronStep,2);
 await click(page,'#reset-open');await click(page,'#reset-cancel',true);assert.equal((await state(page)).records.length,5);
 // Cup replacement is not a global reset and must retain cited records and checks.
 await click(page,'[data-extra-fresh="0"]');assert.equal((await state(page)).records.length,5);await textHas(page,'#review-progress',/3 \/ 3/);
 await acid(page,'fresh','Fe');assert.equal((await state(page)).lesson.records.length,3);await textHas(page,'#review-progress',/3 \/ 3/);
 if(width===1165){
  const second=await context.newPage();await second.goto(origin+'/__fixture');await seedOldSession(second);await second.goto(origin+pathname);await second.locator('#benches .station').first().waitFor();
  await blocked(second,'另一個分頁正在使用');await oldUnchanged(second);
  assert.equal(await second.locator('#reset-open').isDisabled(),true);
  assert.ok((await page.evaluate(()=>navigator.locks.query())).held.some(lock=>lock.name==='bhcs-metal-inquiry-v4'));
  const before=await state(page);await second.locator('[data-metal="Cu"]').click({timeout:500}).then(()=>assert.fail('Read-only click unexpectedly worked'),()=>{});
  assert.deepEqual(await state(page),before);await page.close();await click(second,'#session-retry');await editable(second);
  assert.equal((await state(second)).records.length,5);await textHas(second,'#review-progress',/3 \/ 3/);
  await click(second,'#reset-open');await click(second,'#reset-confirm');await second.reload();await editable(second);
  assert.equal((await state(second)).records.length,0);assert.equal((await state(second)).lesson.records.length,0);await oldUnchanged(second);await snap(second,'two-tab-takeover-reset');
 }else{await click(page,'#reset-open');await click(page,'#reset-confirm');await page.reload();await editable(page);assert.equal((await state(page)).records.length,0);await oldUnchanged(page);}
 assert.deepEqual(errors,[]);await finishContext(context);results.push({name:`complete UI journey ${width}px`,passed:true});return full;
}
async function animationAndMouse(){
 const {context,page,errors}=await open(1165,{},undefined,'no-preference');await editable(page);
 // Native pointer movement starts the same material drag path as a desktop mouse.
 await page.locator('[data-metal="Zn"]').scrollIntoViewIfNeeded();
 const start=await page.locator('[data-metal="Zn"]').boundingBox();
 await page.mouse.move(start.x+start.width/2,start.y+start.height/2);await page.mouse.down();
 await page.mouse.move(start.x+start.width/2+15,start.y+start.height/2,{steps:3});
 await page.locator('[data-cup="0"]').scrollIntoViewIfNeeded();
 const target=await page.locator('[data-cup="0"]').boundingBox();
 await page.mouse.move(target.x+target.width/2,target.y+target.height/2,{steps:12});await page.mouse.up();
 await page.locator('[data-skip="0"]').waitFor();await click(page,'[data-skip="0"]');
 assert.equal((await state(page)).records[0].metal,'Zn');
 await click(page,'[data-metal="Fe"]');await click(page,'[data-place="1"]');
 await page.locator('[data-skip="1"]').waitFor();await page.reload();await editable(page);
 await page.locator('[data-resume="1"]').waitFor();assert.equal((await state(page)).cups[1].phase,'paused');
 await click(page,'[data-resume="1"]',true);await page.locator('[data-reset="1"]').waitFor({timeout:10000});
 assert.equal((await state(page)).records.length,2);
 await oldUnchanged(page);await snap(page,'native-mouse-and-animation');assert.deepEqual(errors,[]);await finishContext(context);
 results.push({name:'native mouse material drag, skip, interrupted reload and natural completion',passed:true});
}
async function persistence(full){
 const v1={version:1,cups:[{metal:'Zn',phase:'done',progress:1},{metal:null,phase:'fresh',progress:0},{metal:null,phase:'fresh',progress:0}]};
 const v2={...full,version:2};delete v2.lesson;delete v2.review;
 const v3={...full,version:3};delete v3.review;
 for(const [key,data,count,acidCount]of [[legacyKeys[0],v1,1,0],[legacyKeys[1],v2,5,0],[legacyKeys[2],v3,5,3],[currentKey,full,5,3]]){
  const raw=JSON.stringify(data),{context,page,errors}=await open(390,{[key]:raw});await editable(page);const migrated=await state(page);
  assert.equal(migrated.version,4);assert.equal(migrated.records.length,count);assert.equal(migrated.lesson.records.length,acidCount);
  if(data.version>=2){for(const field of ['cups','extraCups','records','connections','journeyOpen','nextId'])assert.deepEqual(migrated[field],data[field],`V${data.version} preserved ${field}`);}
  if(data.version>=3)assert.deepEqual(migrated.lesson,data.lesson,`V${data.version} preserved acid records, links, motion and electron stage`);
  if(data.version===4)assert.deepEqual(migrated.review,data.review,'V4 preserved checked answers and citations');
  if(key!==currentKey){assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),raw);assert.equal(migrated.review.answers.origin.recordId,null);}
  else await textHas(page,'#review-progress',/3 \/ 3/);
  await oldUnchanged(page);await page.reload();await editable(page);assert.equal((await state(page)).records.length,count);
  await click(page,'#reset-open');await click(page,'#reset-confirm');
  assert.deepEqual(await page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),legacyKeys),[null,null,null]);await oldUnchanged(page);
  assert.deepEqual(errors,[]);await finishContext(context);results.push({name:`${key} migration/reload/reset`,passed:true});
 }
 // Current corruption must not silently fall back to a valid older backup.
 {const corrupt='{broken',backup=JSON.stringify(v3),{context,page}=await open(390,{[currentKey]:corrupt,[legacyKeys[2]]:backup});
  await blocked(page,'格式無法讀取',true);await textHas(page,'#session-message',/格式無法讀取/);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),currentKey),corrupt);
  await click(page,'#reset-open');await click(page,'#reset-cancel');assert.equal(await page.evaluate(key=>localStorage.getItem(key),currentKey),corrupt);
  await click(page,'#reset-open');await click(page,'#reset-confirm');await editable(page);assert.equal((await state(page)).records.length,0);await oldUnchanged(page);await finishContext(context);results.push({name:'corrupt current protected until confirmed reset',passed:true});}
 // Review corruption is isolated from otherwise valid observations.
 {const bad={...full,review:{version:1,answers:'invalid'}},{context,page}=await open(390,{[currentKey]:JSON.stringify(bad)});await editable(page);assert.equal((await state(page)).records.length,5);assert.equal((await state(page)).review.answers.origin.recordId,null);await oldUnchanged(page);await finishContext(context);results.push({name:'malformed review preserves observations',passed:true});}
 // Real browser Storage API fault injection tests application error handling, not a fake browser.
 for(const method of ['getItem','setItem']){
  const {context,page}=await open(390,{[legacyKeys[2]]:JSON.stringify(v3)});
  await page.goto(origin+'/__fixture');
  await context.addInitScript(method=>{const original=Storage.prototype[method];Storage.prototype[method]=function(key,...args){if(key.startsWith('bhcs-metal-'))throw new DOMException('Deliberate CI storage failure','QuotaExceededError');return original.call(this,key,...args);};},method);
  await page.goto(origin+pathname);await editable(page);
  if(method==='getItem'){await base(page,'Zn',0);await textHas(page,'#record-count',/1 杯/);}
  else{await textHas(page,'#notice',/無法保存/);await click(page,'#reset-open');await click(page,'#reset-confirm');await textHas(page,'#reset-text',/無法保存清空結果，尚未清除/);assert.equal(await page.evaluate(key=>localStorage.getItem(key),legacyKeys[2]),JSON.stringify(v3));}
  await oldUnchanged(page);await finishContext(context);results.push({name:`Storage.${method} failure`,passed:true});
 }
 for(const mode of ['missing','denied']){
  const {context,page}=await open(390,{},mode==='missing'?()=>Object.defineProperty(navigator,'locks',{value:undefined}):()=>Object.defineProperty(navigator,'locks',{value:{request:()=>Promise.reject(new DOMException('CI denial','NotAllowedError'))}}));
  await blocked(page,mode==='missing'?'不支援多分頁保存保護':'另一個分頁正在使用');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),currentKey),null);await oldUnchanged(page);await finishContext(context);results.push({name:`Web Locks ${mode} fails closed`,passed:true});
 }
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
  const full=await journey(1165);await journey(390);await journey(320);await animationAndMouse();await persistence(full);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:true,browser:await browser.version(),limits:'Real Chromium desktop and CSS viewport simulation; not physical phones, real touch hardware, Safari or assistive technology.',results},null,2));
  console.log(`Metal activity desk: ${results.length} Chromium scenario groups passed.`);
 }catch(error){
  let index=0;for(const context of browser?.contexts()||[])for(const page of context.pages()){try{await snap(page,`failure-${index++}`);}catch{}}
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:false,results,error:error.stack},null,2));throw error;}
 finally{await browser?.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
