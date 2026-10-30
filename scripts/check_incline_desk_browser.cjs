'use strict';
// Native Chromium acceptance. Page evaluation reads rendered UI / storage and
// installs passive probes only. No app imports, app hooks or state setters.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const {waitForStorageDelivery}=require('./incline-desk/storage-delivery.cjs');
const writeBoundaries=new WeakMap();
const {assertViewportContinuity}=require('./incline-desk/viewport-continuity.cjs');
const {holdTouchEndpoint}=require('./pulley-desk/touch-gesture.cjs');
const root=path.resolve(__dirname,'..'),output=path.resolve(process.env.INCLINE_DESK_OUTPUT||'incline-desk-artifacts');
const KEY='bhcs.inclineDesk.v1';
const OTHER_KEYS=['bhcs.pulleyDesk.v1','bhcs.leverDesk.v1','bhcs-science-v2-pulley-incline','bhcs-science-v2-lever-torque','bhcs-science-v2-buoyancy','bhcs-science-v2-microscope','bhcs-science-v2-lens','yu-buoyancy-prototype-v1.2-g10','yu-buoyancy-prototype-v1.1'];
const results=[];let browser,server,base;fs.mkdirSync(output,{recursive:true});
const save=()=>fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
// Read with captured native getter so test probes do not contaminate runtime access audit.
const raw=page=>page.evaluate(key=>window.__inclineRead(key),KEY);
const snapshot=async page=>JSON.parse(await raw(page));
const position=async page=>Number((await page.locator('#distance').innerText()).replace(/\s*cm\s*$/,''));
const inputIndex=page=>page.evaluate(()=>window.__inclineAudit.input.length);
async function inputDelivered(page,{since,type,pointerId,point,targetId}){
 await page.waitForFunction(({since,type,pointerId,point,targetId})=>window.__inclineAudit.input.slice(since).some(e=>e.trusted&&e.type===type&&e.pointer==='touch'&&(pointerId===undefined||e.pointerId===pointerId)&&(!point||(Math.abs(e.x-point.x)<.51&&Math.abs(e.y-point.y)<.51))&&(!targetId||e.targetId===targetId)),{since,type,pointerId,point,targetId});
 return page.evaluate(({since,type,pointerId,point,targetId})=>window.__inclineAudit.input.slice(since).find(e=>e.trusted&&e.type===type&&e.pointer==='touch'&&(pointerId===undefined||e.pointerId===pointerId)&&(!point||(Math.abs(e.x-point.x)<.51&&Math.abs(e.y-point.y)<.51))&&(!targetId||e.targetId===targetId)),{since,type,pointerId,point,targetId});
}
async function activate(page,selector,cdp){
 writeBoundaries.set(page,await page.evaluate(()=>window.__inclineAudit.locks.length));
 const target=page.locator(selector);assert.ok(await target.isEnabled(),selector+' enabled');
 if(!cdp){await target.click();return;}
 const id=await target.getAttribute('id'),since=await inputIndex(page);
 await target.tap(); // exactly one native tap; never retry or force a click
 await page.waitForFunction(({since,id})=>{const a=window.__inclineAudit.input.slice(since);const down=a.findIndex(e=>e.trusted&&e.pointer==='touch'&&e.type==='pointerdown'&&e.targetId===id);if(down<0)return false;const up=a.findIndex((e,i)=>i>down&&e.trusted&&e.pointer==='touch'&&e.type==='pointerup'&&e.targetId===id&&e.pointerId===a[down].pointerId);return up>=0&&a.some((e,i)=>i>up&&e.trusted&&e.type==='click'&&e.pointer==='touch'&&e.targetId===id);},{since,id});
 const audit=await page.evaluate(({since,id})=>window.__inclineAudit.input.slice(since).filter(e=>e.targetId===id),{since,id});
 assert.equal(audit.filter(e=>e.type==='pointerdown').length,1,selector+' one down');assert.equal(audit.filter(e=>e.type==='click').length,1,selector+' one click');
}
async function saved(page){const write=await waitForStorageDelivery(page,{since:writeBoundaries.get(page),key:KEY,lock:'bhcs.inclineDesk.storage'});await page.waitForFunction(()=>document.querySelector('#save-status').textContent==='已存到此裝置');assert.equal(await raw(page),write.value,'persisted bytes are the completed native write for this action');}
async function geometry(page,{visibleHandle=false}={}){
 const g=await page.evaluate(()=>{const rect=e=>e.getBoundingClientRect().toJSON(),bench=document.querySelector('#bench'),handle=document.querySelector('#handle');return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollY,bench:rect(bench),handle:rect(handle),focus:document.activeElement?.id,readouts:[...document.querySelectorAll('.reading')].map(e=>({scroll:e.scrollWidth,client:e.clientWidth})),targets:[...document.querySelectorAll('#handle,#begin,#seal,#redo,#next,#compare,#step-one,#step-five')].filter(e=>e.getClientRects().length).map(e=>({id:e.id,r:rect(e)}))};});
 assert.ok(g.scrollWidth<=g.width+1,`no horizontal overflow ${g.scrollWidth}/${g.width}`);
 for(const t of g.targets)assert.ok(t.r.width>=43.99&&t.r.height>=43.99,`44px target ${t.id}`);
 for(const r of g.readouts)assert.ok(r.scroll<=r.client+1,'readout not clipped');
 assert.ok(g.handle.left>=g.bench.left-1&&g.handle.right<=g.bench.right+1&&g.handle.top>=g.bench.top-1&&g.handle.bottom<=g.bench.bottom+1,'handle in apparatus');
 if(visibleHandle){assert.ok(g.handle.top>=0&&g.handle.bottom<=g.height&&g.handle.left>=0&&g.handle.right<=g.width,'explicit transition brings actual handle into viewport');assert.equal(g.focus,'handle','explicit transition focuses handle');}
 return g;
}
async function auditStorage(page){const a=await page.evaluate(()=>window.__inclineAudit);assert.ok(a.access.every(e=>e.key===KEY&&['getItem','setItem'].includes(e.name)),'runtime touches only its own key, no clear/remove');return a;}
async function stableApparatus(page,before,label){
 const observation=await page.evaluate(({frameIndex,scrollCallIndex})=>{const r=document.querySelector('#bench').getBoundingClientRect();return {samples:[...window.__inclineAudit.frames.slice(frameIndex),{label:'assertion-boundary',scrollY,bench:{x:r.x,y:r.y,width:r.width,height:r.height,documentY:r.y+scrollY}}],calls:window.__inclineAudit.scrollCalls.slice(scrollCallIndex)};},before);
 return assertViewportContinuity(before,observation.samples,observation.calls,label);
}
async function drag(page,cdp,lengthCm,amount,{cancel=false,reverse=false}={}){
 await page.locator('#bench').scrollIntoViewIfNeeded();
 assert.ok(await page.locator('#handle').isEnabled());
 const before=await position(page),beforeRaw=await raw(page),beforeAnnounce=await page.locator('#announcer').innerText();
 // Use actual rendered start/end flags, not application geometry or data-scale.
 const measured=await page.evaluate(()=>{const svg=document.querySelector('#scene'),flags=[...svg.querySelectorAll('path[fill="#edc87e"]')];const screen=p=>{const q=p.getPointAtLength(0),m=svg.getScreenCTM();return {x:m.a*q.x+m.c*q.y+m.e,y:m.b*q.x+m.d*q.y+m.f};};const r=document.querySelector('#handle').getBoundingClientRect();const b=document.querySelector('#bench').getBoundingClientRect();return {start:screen(flags[0]),end:screen(flags[1]),from:{x:r.x+r.width/2,y:r.y+r.height/2},scrollY,bench:{x:b.x,y:b.y,width:b.width,height:b.height,documentY:b.y+scrollY},frameIndex:window.__inclineAudit.frames.length,scrollCallIndex:window.__inclineAudit.scrollCalls.length};});
 const {from,start,end}=measured,sign=reverse?-1:1,to={x:from.x+sign*amount/lengthCm*(end.x-start.x),y:from.y+sign*amount/lengthCm*(end.y-start.y)};
 assert.ok(end.x>start.x&&end.y<start.y,'flags describe upward-right ramp');
 for(const p of [from,to])assert.ok(p.x>=0&&p.x<page.viewportSize().width&&p.y>=0&&p.y<page.viewportSize().height,'native endpoints in viewport');
 assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.closest('button')?.id,from),'handle');
 const since=await inputIndex(page);let pointerId;
 if(cdp){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]});pointerId=(await inputDelivered(page,{since,type:'pointerdown',point:from,targetId:'handle'})).pointerId;}
 else{await page.mouse.move(from.x,from.y);await page.mouse.down();}
 for(let i=1;i<=8;i++){const point={x:from.x+(to.x-from.x)*i/8,y:from.y+(to.y-from.y)*i/8};if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...point,id:1}]});else await page.mouse.move(point.x,point.y);}
 if(cdp)await inputDelivered(page,{since,type:'pointermove',pointerId,point:to});
 const hold=cdp?await holdTouchEndpoint(cdp,to):null;
 const expected=reverse?before:Math.min(lengthCm,before+amount);
 assert.equal(await position(page),expected,'exact preview from physical flag displacement');
 assert.equal(await raw(page),beforeRaw,'preview cannot save evidence');
 assert.equal(await page.locator('#seal').isVisible(),false,'uncommitted preview has no seal action');
 assert.equal(await page.locator('#announcer').innerText(),beforeAnnounce,'movement does not flood live region');
 const movementContinuity=await stableApparatus(page,measured,'movement');
 if(cdp){const release=await inputIndex(page);await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});await inputDelivered(page,{since:release,type:cancel?'pointercancel':'pointerup',pointerId});}
 else{if(cancel)await page.keyboard.press('Escape');await page.mouse.up();}
 assert.equal(await position(page),cancel?before:expected,'release commits, cancel restores');
 assert.equal(await raw(page),beforeRaw,'unsealed movement leaves storage untouched');
 const releaseContinuity=await stableApparatus(page,measured,'release');
 if(cancel)assert.equal(await page.locator('#seal').isVisible(),false,'cancelled endpoint cannot seal');
 return {before,expected,cancel,reverse,measured,hold,movementContinuity,releaseContinuity};
}
async function submitWork(page,cdp,values=['2','2','2','2']){
 const radio=page.locator('label').filter({has:page.locator('[name="distance-choice"][value="slope"]')});
 if(cdp)await radio.tap();else await radio.click();
 assert.equal(await page.locator('[name="distance-choice"][value="slope"]').isChecked(),true);
 for(let i=0;i<4;i++){const input=page.locator('#answer-'+i);if(cdp)await input.tap();else await input.click();await input.fill(values[i]);}
 // The submit button has no id; tap its native form target once, then observe
 // trusted submit rather than adding an id to the frozen application DOM.
 writeBoundaries.set(page,await page.evaluate(()=>window.__inclineAudit.locks.length));
 const since=await inputIndex(page),submit=page.locator('#work-form button[type="submit"]');
 if(cdp)await submit.tap();else await submit.click();
 await page.waitForFunction(since=>window.__inclineAudit.input.slice(since).some(e=>e.type==='submit'&&e.trusted&&e.targetId==='work-form'),since);
}
async function run(name,width,touch,task,corrupt){
 const result={name,width,touch,status:'running'};results.push(result);save();
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:touch,isMobile:touch,deviceScaleFactor:1,reducedMotion:'reduce'});
 await context.addInitScript(({KEY,OTHER_KEYS,corrupt})=>{
  if(location.protocol!=='http:')return;
  const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem,clear=Storage.prototype.clear;
  // Synthetic fixtures in an isolated browser context, before app startup only.
  if(!sessionStorage.getItem('incline-fixture-installed')){for(const k of OTHER_KEYS)set.call(localStorage,k,'untouched:'+k);if(corrupt!==undefined)set.call(localStorage,KEY,corrupt);sessionStorage.setItem('incline-fixture-installed','1');}
  window.__inclineRead=k=>get.call(localStorage,k);window.__inclineAudit={access:[],input:[],locks:[],scrollCalls:[],frames:[]};
  let activeLockRequest=null;
  const request=navigator.locks.request.bind(navigator.locks);
  navigator.locks.request=function(name,options,callback){const event={id:window.__inclineAudit.locks.length,name,status:'pending'};window.__inclineAudit.locks.push(event);const promise=request(name,options,function(lock){const previous=activeLockRequest;activeLockRequest=event.id;try{return callback(lock);}finally{activeLockRequest=previous;}});promise.then(()=>{event.status='resolved';},()=>{event.status='rejected';});return promise;};
  for(const [name,original]of [['getItem',get],['setItem',set],['removeItem',remove],['clear',clear]])Storage.prototype[name]=function(...args){const event=this===localStorage?{name,key:args[0],requestId:activeLockRequest,completed:false,...(name==='setItem'?{value:args[1]}:{})}:null;if(event)window.__inclineAudit.access.push(event);const result=original.apply(this,args);if(event)event.completed=true;return result;};
  const frame=label=>{const rect=id=>{const e=document.getElementById(id);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,documentY:r.y+scrollY};};window.__inclineAudit.frames.push({label,time:performance.now(),scrollY,bench:rect('bench'),handle:rect('handle'),guide:rect('guide-copy'),title:document.getElementById('guide-title')?.textContent});};
  for(const [owner,names]of [[window,['scroll','scrollTo','scrollBy']],[Element.prototype,['scrollIntoView','scroll','scrollTo','scrollBy']]])for(const name of names){const original=owner[name];if(typeof original!=='function')continue;owner[name]=function(...args){window.__inclineAudit.scrollCalls.push({name,targetId:this.id||'window',time:performance.now(),args});return original.apply(this,args);};}
  for(const type of ['pointerdown','pointermove','pointerup','pointercancel']){document.addEventListener(type,e=>{if(e.target.closest?.('#handle'))frame(type+':capture-before');},true);document.addEventListener(type,e=>{if(!e.target.closest?.('#handle'))return;frame(type+':bubble-after');requestAnimationFrame(()=>frame(type+':frame-after'));});}
  document.addEventListener('scroll',()=>frame('scroll-event'),true);
  for(const type of ['pointerdown','pointermove','pointerup','pointercancel','click','keydown','submit'])document.addEventListener(type,e=>window.__inclineAudit.input.push({type,trusted:e.isTrusted,pointer:e.pointerType,pointerId:e.pointerId,x:e.clientX,y:e.clientY,targetId:e.target.id||e.target.closest?.('[id]')?.id,key:e.key,repeat:e.repeat}),true);
 },{KEY,OTHER_KEYS,corrupt});
 const page=await context.newPage(),errors=[],failed=[],external=[];page.setDefaultTimeout(15000);page.on('dialog',d=>{if(d.type()==='beforeunload')return d.accept();errors.push('Unexpected dialog: '+d.type()+' '+d.message());return d.dismiss();});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
 await context.route('**/*',r=>{if(new URL(r.request().url()).origin!==base){external.push(r.request().url());return r.abort();}return r.continue();});
 try{
  await page.goto(base+'/tools/incline-desk/',{waitUntil:'networkidle'});await page.locator('#begin').waitFor();
  assert.deepEqual(await page.locator('.teacher-crop img').evaluate(i=>[i.naturalWidth,i.naturalHeight]),[948,1659]);
  assert.equal(await page.locator('script[src*="researcher"],script[src*="science-events"],script[src*="site.js"],iframe').count(),0);
  result.initialGeometry=await geometry(page);await task(page,touch?await context.newCDPSession(page):null,result);
  result.geometry=await geometry(page);result.audit=await auditStorage(page);
  assert.deepEqual(await page.evaluate(keys=>keys.map(k=>window.__inclineRead(k)),OTHER_KEYS),OTHER_KEYS.map(k=>'untouched:'+k));
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.deepEqual(external,[]);
  await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});result.status='passed';
 }catch(e){result.status='failed';result.failure=e.stack;result.failureAudit=await page.evaluate(()=>({geometry:{bench:document.querySelector('#bench')?.getBoundingClientRect().toJSON(),handle:document.querySelector('#handle')?.getBoundingClientRect().toJSON(),guide:document.querySelector('#guide-copy')?.getBoundingClientRect().toJSON()},audit:window.__inclineAudit,activeId:document.activeElement?.id,distance:document.querySelector('#distance')?.textContent,guide:document.querySelector('#guide-title')?.textContent,scrollY})).catch(()=>null);await page.screenshot({path:path.join(output,name+'-failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(output,name+'-failure.html'),await page.content().catch(()=>''));}
 finally{Object.assign(result,{errors,failed,external});save();console.log(result.status.toUpperCase()+' '+name);await context.close();}
}
(async()=>{
 const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json'};
 server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});base=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({headless:true});fs.writeFileSync(path.join(output,'environment.json'),JSON.stringify({node:process.version,browser:browser.version(),touch:'CDP emulation; not physical-device certification'},null,2));
 for(const width of [1280,360,390,412])await run(`guided-pointer-${width}`,width,width!==1280,async(page,cdp,result)=>{
  assert.match(await page.locator('#guide-title').innerText(),/先看看/);await activate(page,'#begin',cdp);result.drags=[];
  result.drags.push(await drag(page,cdp,40,40,{cancel:true}));assert.equal(await page.locator('#records .record').count(),0);
  result.drags.push(await drag(page,cdp,40,10));result.drags.push(await drag(page,cdp,40,5,{reverse:true}));result.drags.push(await drag(page,cdp,40,30));
  assert.match(await page.locator('#height').innerText(),/^20\s*cm$/);assert.match(await page.locator('#force').innerText(),/^5\s*N$/);await activate(page,'#seal',cdp);await saved(page);
  const first=(await snapshot(page)).records[0];assert.deepEqual([first.rampId,first.lengthCm,first.heightCm,first.weightN,first.forceHalfN],['short',40,20,10,10]);assert.equal(first.positiveCommits,2,'cancel/reverse do not grant evidence');assert.deepEqual(first.inputMethods,['pointer']);
  assert.equal(await page.locator('#records .record').count(),1);assert.equal(await page.locator('#seal').isDisabled(),true);
  await activate(page,'#next',cdp);result.nextGeometry=await geometry(page,{visibleHandle:true});assert.equal(await position(page),0);assert.match(await page.locator('#force').innerText(),/^2\.5\s*N$/);
  result.drags.push(await drag(page,cdp,80,10));await activate(page,'#redo',cdp);result.redoGeometry=await geometry(page,{visibleHandle:true});assert.equal(await position(page),0);assert.deepEqual((await snapshot(page)).records,[first]);
  result.drags.push(await drag(page,cdp,80,80,{cancel:true}));result.drags.push(await drag(page,cdp,80,20));result.drags.push(await drag(page,cdp,80,60));
  const shortMeasure=result.drags[0].measured,longMeasure=result.drags.at(-1).measured;
  assert.ok(Math.abs(Math.hypot(longMeasure.end.x-longMeasure.start.x,longMeasure.end.y-longMeasure.start.y)/Math.hypot(shortMeasure.end.x-shortMeasure.start.x,shortMeasure.end.y-shortMeasure.start.y)-2)<1e-6,'both ramps use identical visual scale');
  assert.match(await page.locator('#height').innerText(),/^20\s*cm$/);await activate(page,'#seal',cdp);await saved(page);
  const pair=await snapshot(page),savedRecords=pair.records;assert.equal(savedRecords.length,2);assert.deepEqual(savedRecords[0],first);assert.deepEqual([savedRecords[1].rampId,savedRecords[1].lengthCm,savedRecords[1].heightCm,savedRecords[1].forceHalfN],['long',80,20,5]);assert.equal(savedRecords[1].positiveCommits,2);assert.ok(pair.pair,'pair is atomic at long seal');
  result.beforeReloadAudit=await auditStorage(page);await page.reload({waitUntil:'networkidle'});assert.deepEqual((await snapshot(page)).records,savedRecords);assert.equal(await page.locator('#comparison').isVisible(),true,'sealed pair restores comparison');
  assert.equal(await page.locator('#hint-copy').isHidden(),true);for(let i=0;i<4;i++)assert.equal(await page.locator('#answer-'+i).inputValue(),'','answers not prefilled');
  await submitWork(page,cdp,['1','2','2','2']);assert.equal(await page.locator('#explanation').isHidden(),true);await submitWork(page,cdp);assert.equal(await page.locator('#explanation').isVisible(),true);
  await page.locator('#explain-text').fill('短坡 5 N 拉 0.4 m，長坡 2.5 N 拉 0.8 m；都升高 0.2 m，兩次都是 2 J。');await activate(page,'#save-explanation',cdp);await saved(page);
  assert.equal(await page.locator('#completion').isVisible(),true);const complete=await snapshot(page);assert.deepEqual(complete.records,savedRecords);assert.equal(complete.answers.revisions.length,1);
  result.completedAudit=await auditStorage(page);await page.reload({waitUntil:'networkidle'});assert.deepEqual(await snapshot(page),complete);assert.equal(await page.locator('#completion').isVisible(),true);
  await page.locator('#answer-0').fill('1');assert.equal(await page.locator('#completion').isHidden(),true);await page.locator('#answer-0').fill('2');assert.equal(await page.locator('#completion').isHidden(),true,'editing back cannot restore unchecked qualification');await submitWork(page,cdp);await saved(page);assert.equal(await page.locator('#completion').isVisible(),true,'rechecked correct answers plus existing revision show accepted completion panel');assert.equal((await snapshot(page)).answers.revisions.length,1,'rechecking does not invent an explanation revision');assert.deepEqual((await snapshot(page)).records,savedRecords);
  const native=[...result.beforeReloadAudit.input,...result.completedAudit.input];assert.ok(native.some(e=>e.trusted&&e.type==='pointerdown'&&e.pointer===(cdp?'touch':'mouse')));if(cdp)assert.ok(native.some(e=>e.trusted&&e.type==='pointercancel'),'native touch cancellation delivered');
 });
 for(const width of [1280,360,390,412])await run(`corrupt-zero-write-${width}`,width,width!==1280,async(page,cdp,result)=>{
  const corrupt='  { invalid incline original\n';assert.equal(await raw(page),corrupt);assert.equal(await page.locator('#storage-alert').isVisible(),true);assert.equal((await auditStorage(page)).access.filter(a=>a.name!=='getItem').length,0);
  await activate(page,'#memory-start',cdp);for(let i=0;i<8;i++)await activate(page,'#step-five',cdp);await activate(page,'#seal',cdp);assert.equal(await page.locator('#records .record').count(),1);assert.equal(await raw(page),corrupt);
  await activate(page,'#next',cdp);await geometry(page,{visibleHandle:true});for(let i=0;i<16;i++)await activate(page,'#step-five',cdp);await activate(page,'#seal',cdp);await activate(page,'#compare',cdp);await submitWork(page,cdp);await page.locator('#explain-text').fill('短坡和長坡的輸入功都是 2 J，但資料僅此頁暫存。');await activate(page,'#save-explanation',cdp);
  assert.equal(await page.locator('#completion').isVisible(),true);assert.equal(await page.locator('#records .record').count(),2);assert.match(await page.locator('#save-status').innerText(),/僅此頁暫存/);assert.equal(await raw(page),corrupt);
  result.beforeReloadAudit=await auditStorage(page);assert.equal(result.beforeReloadAudit.access.filter(a=>a.name!=='getItem').length,0,'blocked storage never overwritten');await page.reload({waitUntil:'networkidle'});assert.equal(await raw(page),corrupt);assert.equal(await page.locator('#records .record').count(),0);assert.equal((await auditStorage(page)).access.filter(a=>a.name!=='getItem').length,0);
 },'  { invalid incline original\n');
 await run('keyboard-direction-repeat-redo',1280,false,async(page,cdp,result)=>{
  await page.locator('#begin').focus();await page.keyboard.press('Enter');await page.locator('#handle').focus();await page.keyboard.press('ArrowLeft');assert.equal(await position(page),0);await page.keyboard.down('ArrowRight');await page.keyboard.down('ArrowRight');await page.keyboard.up('ArrowRight');assert.equal(await position(page),1,'repeated held arrow does not double move');
  const before=await page.evaluate(()=>scrollY);await page.keyboard.press('Shift+ArrowUp');assert.equal(await position(page),6);assert.equal(await page.evaluate(()=>scrollY),before);await activate(page,'#redo',null);await geometry(page,{visibleHandle:true});assert.equal(await position(page),0);for(let i=0;i<8;i++)await page.keyboard.press('Shift+ArrowRight');assert.equal(await position(page),40);await activate(page,'#seal',null);await saved(page);await activate(page,'#next',null);await geometry(page,{visibleHandle:true});for(let i=0;i<16;i++)await page.keyboard.press('Shift+ArrowRight');assert.equal(await position(page),80);await activate(page,'#seal',null);await saved(page);assert.equal((await snapshot(page)).records.length,2);
  const priorReset=await raw(page);await page.locator('.record-management summary').click();await activate(page,'#new-experiment',null);assert.equal(await page.locator('#reset-dialog').isVisible(),true);await page.locator('#reset-stage-one [data-close-reset]').click();assert.equal(await raw(page),priorReset,'first-stage cancel preserves exact stored evidence');
  await activate(page,'#new-experiment',null);await activate(page,'#reset-continue',null);assert.equal(await page.locator('#reset-confirm').isDisabled(),true,'explicit acknowledgement required');await page.locator('#reset-stage-two [data-close-reset]').click();assert.equal(await raw(page),priorReset,'second-stage cancel preserves exact stored evidence');
  // This fresh isolated context contains only this test's synthetic observations.
  // Exercise the app's explicit two-stage reset UI, never clear browser storage.
  await activate(page,'#new-experiment',null);await activate(page,'#reset-continue',null);await page.locator('#reset-ack').check();await activate(page,'#reset-confirm',null);await page.locator('#reset-dialog').waitFor({state:'hidden'});assert.equal(await page.locator('#begin').isVisible(),true);assert.deepEqual((await snapshot(page)).records,[]);assert.equal(await page.locator('#records .record').count(),0);
  const audit=await auditStorage(page);assert.ok(audit.input.some(e=>e.trusted&&e.type==='keydown'&&e.repeat),'native repeat path covered');
 });
 assert.equal(results.length,9);assert.ok(results.every(r=>r.status==='passed'),`${results.filter(r=>r.status!=='passed').length}/9 incline browser scenarios failed`);console.log('PASS incline-desk: 9 real Chromium scenarios');
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(output,'runner-error.txt'),e.stack||String(e));if(!browser){results.push({name:'browser-suite',status:'never-run',reason:e.message});save();}process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));});
