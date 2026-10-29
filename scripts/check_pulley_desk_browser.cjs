'use strict';
// Real Chromium acceptance: native mouse/keyboard and trusted CDP touch.
// evaluate() reads rendered UI/storage or installs passive audit probes only.
// No app imports, synthetic input dispatch, model fixtures or state setters.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),output=path.resolve(process.env.PULLEY_DESK_OUTPUT||'pulley-desk-artifacts');
const KEY='bhcs.pulleyDesk.v1';
const OTHER_KEYS=['bhcs-science-v2-pulley','bhcs-science-v2-pulley-incline','bhcs-science-v2-lever-torque','bhcs-science-v2-buoyancy','bhcs-science-v2-microscope','bhcs-science-v2-lens','bhcs.leverDesk.v1','yu-buoyancy-prototype-v1.2-g10','yu-buoyancy-prototype-v1.1'];
const results=[];let server,browser,base;fs.mkdirSync(output,{recursive:true});
const save=()=>fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
const raw=page=>page.evaluate(key=>localStorage.getItem(key),KEY);
const records=async page=>JSON.parse(await raw(page))?.records||[];
const height=async page=>Number(await page.locator('#height-value').innerText());
const guide=page=>page.locator('#guide-next').getAttribute('data-key');
async function activate(page,selector,cdp){assert.ok(await page.locator(selector).isEnabled(),selector+' enabled before native activation');if(cdp)await page.locator(selector).tap();else await page.locator(selector).click();}
async function focus(page,selector){assert.ok(await page.locator(selector).isEnabled(),selector+' enabled before keyboard focus');await page.locator(selector).focus();assert.equal(await page.locator(selector).evaluate(e=>document.activeElement===e),true,selector+' owns keyboard focus');}
async function geometry(page){
 const g=await page.evaluate(()=>{const rect=e=>e.getBoundingClientRect().toJSON(),bench=document.querySelector('#bench');return {width:innerWidth,scroll:document.documentElement.scrollWidth,bench:rect(bench),handle:rect(document.querySelector('#rope-handle')),targets:[...document.querySelectorAll('#guide-next,#rope-handle,#rise-one,#rise-five,#save-record,#switch-device,#start-fixed,#start-movable')].filter(e=>e.getClientRects().length).map(e=>({id:e.id,r:rect(e)})),readouts:[...document.querySelectorAll('.reading')].map(e=>({r:rect(e),scroll:e.scrollWidth,client:e.clientWidth})),guideTargets:document.querySelectorAll('.guide-target').length,guideStep:document.querySelector('#guide-step').textContent,currentSteps:[...document.querySelectorAll('.steps [aria-current="step"]')].map(e=>Number(e.querySelector('span').textContent))};});
 assert.ok(g.scroll<=g.width+1,`horizontal overflow ${g.scroll}/${g.width}`);
 for(const t of g.targets)assert.ok(t.r.width>=43.99&&t.r.height>=43.99,`44px target ${t.id}: ${t.r.width}x${t.r.height}`);
 assert.ok(g.handle.left>=g.bench.left&&g.handle.right<=g.bench.right&&g.handle.top>=g.bench.top&&g.handle.bottom<=g.bench.bottom,'handle stays inside bench');
 for(const r of g.readouts)assert.ok(r.scroll<=r.client+1,'readout text does not overflow');
 assert.equal(g.guideTargets,1,'exactly one concrete guide target');assert.deepEqual(g.currentSteps,[Number(g.guideStep.match(/第 (\d) \/ 4/)[1])],'exactly one current step agrees with guide');return g;
}
async function assertOwnStorage(page){const audit=await page.evaluate(()=>window.__pulleyAudit);assert.ok(audit.access.every(a=>a.key===KEY),'runtime accesses only pulley key; no clear/removal or other station reads');assert.ok(audit.access.every(a=>['getItem','setItem'].includes(a.name)),'runtime never clears or removes storage');return audit;}
// Endpoints are measured from the actual rendered handle. The accepted scale is
// 5 CSS px/cm; movable needs twice the free-end travel. No internal state is set.
async function drag(page,cdp,device,rise,{cancel=false,reverse=false}={}){
 assert.ok(await page.locator('#rope-handle').isEnabled(),'handle enabled before native drag');
 await page.locator('#bench').scrollIntoViewIfNeeded();
 const before=await height(page),beforeRaw=await raw(page),beforeAnnouncement=await page.locator('#announcement').innerText();
 const p=await page.locator('#rope-handle').boundingBox();assert.ok(p);
 const from={x:p.x+p.width/2,y:p.y+p.height/2},delta=(device==='fixed'?1:-1)*(reverse?-1:1)*rise*5*(device==='fixed'?1:2),to={x:from.x,y:from.y+delta};
 for(const point of [from,to])assert.ok(point.x>=0&&point.x<page.viewportSize().width&&point.y>=0&&point.y<page.viewportSize().height,'drag endpoint in current viewport');
 assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.closest('button')?.id,from),'rope-handle','native pointer hits the visible handle');
 if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]});
 else{await page.mouse.move(from.x,from.y);await page.mouse.down();}
 for(let i=1;i<=8;i++){const point={x:from.x,y:from.y+delta*i/8};if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...point,id:1}]});else await page.mouse.move(point.x,point.y);}
 const preview=reverse?before:Math.min(20,before+rise);assert.equal(await height(page),preview,'rendered drag preview');
 assert.equal(await raw(page),beforeRaw,'preview never writes evidence');
 assert.equal(await page.locator('#announcement').innerText(),beforeAnnouncement,'pointermove does not spam live announcements');
 assert.ok(await page.locator('#save-record').isDisabled(),'preview is never qualified to save');
 assert.ok(await page.locator('#guide-next').isDisabled(),'guide disabled during drag');
 assert.equal(await guide(page),'lift','preview must not advance guide');
 if(preview===20)assert.match(await page.locator('#guide-progress').innerText(),/預覽 20.*已提交仍為/);
 if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
 else{if(cancel)await page.keyboard.press('Escape');await page.mouse.up();}
 assert.equal(await height(page),cancel?before:preview,'commit or cancel height');
 assert.equal(await raw(page),beforeRaw,'unsaved lift changes no persisted records');
 if(cancel){assert.ok(await page.locator('#save-record').isDisabled());assert.equal(await guide(page),'lift');assert.match(await page.locator('#guide-progress').innerText(),new RegExp(`已提交 ${before}`));}
 return {from,to,before,preview,cancel,reverse};
}
async function fillWork(page,values=['2','2.0','2.00','2']){for(const [i,id]of ['fixed-input','fixed-output','movable-input','movable-output'].entries())await page.locator('#'+id).fill(values[i]);await page.locator('#work-form button[type="submit"]').click();}
async function twoRoundsByButtons(page,cdp){
 for(const device of ['fixed','movable']){assert.equal(await guide(page),'start');await activate(page,'#guide-next',cdp);assert.equal(await page.locator('#diagram').getAttribute('data-device'),device);for(let i=0;i<4;i++)await activate(page,'#rise-five',cdp);assert.equal(await guide(page),'save');await activate(page,'#guide-next',cdp);}
 assert.equal(await guide(page),'calculate');
}
async function run(name,width,touch,task,corrupt){
 const result={name,width,touch,status:'running'};results.push(result);save();
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:touch,isMobile:touch,deviceScaleFactor:1,reducedMotion:'reduce'});
 await context.addInitScript(({KEY,OTHER_KEYS,corrupt})=>{
  if(location.protocol!=='http:')return;
  const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem,clear=Storage.prototype.clear;
  if(!sessionStorage.getItem('pulley-fixture-installed')){for(const k of OTHER_KEYS)set.call(localStorage,k,'untouched:'+k);if(corrupt!==undefined)set.call(localStorage,KEY,corrupt);sessionStorage.setItem('pulley-fixture-installed','1');}
  window.__pulleyAudit={access:[],input:[]};
  for(const [name,original]of [['getItem',get],['setItem',set],['removeItem',remove],['clear',clear]])Storage.prototype[name]=function(...args){if(this===localStorage)window.__pulleyAudit.access.push({name,key:args[0]});return original.apply(this,args);};
  for(const type of ['pointerdown','pointerup','pointercancel','click','keydown'])document.addEventListener(type,e=>window.__pulleyAudit.input.push({type,trusted:e.isTrusted,pointer:e.pointerType,detail:e.detail,key:e.key,repeat:e.repeat,targetId:e.target.closest?.('[id]')?.id,activeId:document.activeElement?.id}),true);
 },{KEY,OTHER_KEYS,corrupt});
 const page=await context.newPage(),errors=[],failed=[],external=[];page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
 await context.route('**/*',r=>{if(new URL(r.request().url()).origin!==base){external.push(r.request().url());return r.abort();}return r.continue();});
 try{
  await page.goto(base+'/tools/pulley-desk/',{waitUntil:'networkidle'});await page.locator('#guide-next[data-key="start"]').waitFor();
  assert.deepEqual(await page.locator('.teacher-crop img').evaluate(i=>[i.naturalWidth,i.naturalHeight]),[948,1659]);
  assert.equal(await page.locator('script[src*="researcher"],script[src*="science-events"],script[src*="site.js"],iframe').count(),0);
  result.initialGeometry=await geometry(page);
  await task(page,touch?await context.newCDPSession(page):null,result);
  result.geometry=await geometry(page);result.audit=await assertOwnStorage(page);
  // Read unrelated bytes only after capturing the runtime access audit.
  assert.deepEqual(await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),OTHER_KEYS),OTHER_KEYS.map(k=>'untouched:'+k));
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.deepEqual(external,[]);
  await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});result.status='passed';
 }catch(e){result.status='failed';result.failure=e.stack;result.failureAudit=await page.evaluate(()=>({audit:window.__pulleyAudit,activeId:document.activeElement?.id,guide:document.querySelector('#guide-next')?.dataset.key,height:document.querySelector('#height-value')?.textContent})).catch(()=>null);await page.screenshot({path:path.join(output,name+'-failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(output,name+'-failure.html'),await page.content().catch(()=>''));}
 finally{Object.assign(result,{errors,failed,external});save();console.log(result.status.toUpperCase()+' '+name);await context.close();}
}
(async()=>{
 const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json'};
 server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});base=`http://127.0.0.1:${server.address().port}`;
 // Match the repository's pinned Playwright browser. No alternate executable,
 // sandbox relaxation, skipped scenarios or automatic launch retries.
 browser=await chromium.launch({headless:true});fs.writeFileSync(path.join(output,'environment.json'),JSON.stringify({node:process.version,browser:browser.version(),touch:'CDP emulation; not physical-device certification'},null,2));
 for(const width of [1280,360,390,412])await run(`guided-pointer-${width}`,width,width!==1280,async(page,cdp,result)=>{
  assert.match(await page.locator('#guide-title').innerText(),/先開始定滑輪/);await activate(page,'#guide-next',cdp);
  assert.equal(await guide(page),'lift');assert.match(await page.locator('#guide-action').innerText(),/向下/);
  result.drags=[];result.drags.push(await drag(page,cdp,'fixed',20,{cancel:true}));assert.equal((await records(page)).length,0);
  result.drags.push(await drag(page,cdp,'fixed',5));result.drags.push(await drag(page,cdp,'fixed',5,{reverse:true}));result.drags.push(await drag(page,cdp,'fixed',15));
  assert.equal(await guide(page),'save');assert.ok(await page.locator('#save-record').isEnabled());await activate(page,'#guide-next',cdp);
  const first=(await records(page))[0];assert.deepEqual([first.device,first.forceN,first.heightCm,first.ropeCm,first.inputWorkNcm,first.outputWorkNcm],['fixed',10,20,20,200,200]);
  assert.deepEqual(first.operations.map(e=>[e.fromCm,e.toCm]),[[0,5],[5,20]],'cancel and reverse gestures grant no evidence');
  assert.equal(await page.locator('#records .record').count(),1);assert.ok(await page.locator('#save-record').isDisabled());
  assert.equal(await page.evaluate(()=>document.activeElement.id),'guide-next');assert.equal(await guide(page),'start');assert.match(await page.locator('#guide-next').innerText(),/開始動滑輪/);
  result.preReloadAudit=await assertOwnStorage(page);await page.reload({waitUntil:'networkidle'});
  assert.deepEqual(await records(page),[first]);assert.equal(await page.locator('#setup').isVisible(),true);assert.match(await page.locator('#guide-title').innerText(),/接著做動滑輪/);
  await activate(page,'#guide-next',cdp);assert.equal(await page.locator('#step-movable').getAttribute('aria-current'),'step');assert.match(await page.locator('#guide-action').innerText(),/向上/);
  result.drags.push(await drag(page,cdp,'movable',20,{cancel:true}));result.drags.push(await drag(page,cdp,'movable',10));result.drags.push(await drag(page,cdp,'movable',10));
  assert.equal(await height(page),20);assert.equal(await page.locator('#rope-value').innerText(),'40');assert.equal(await guide(page),'save');await activate(page,'#guide-next',cdp);
  const saved=await records(page);assert.equal(saved.length,2);assert.deepEqual(saved[0],first);assert.deepEqual([saved[1].device,saved[1].forceN,saved[1].heightCm,saved[1].ropeCm,saved[1].inputWorkNcm,saved[1].outputWorkNcm],['movable',5,20,40,200,200]);
  assert.deepEqual(saved[1].operations.map(e=>[e.fromCm,e.toCm]),[[0,10],[10,20]]);
  assert.equal(await guide(page),'calculate');assert.doesNotMatch(await page.locator('#guide-action').innerText(),/2[.]00|2 J/);
  assert.equal(await page.locator('#formula-hint').isHidden(),true);await activate(page,'#guide-next',cdp);assert.equal(await page.evaluate(()=>document.activeElement.id),'fixed-input');
  await fillWork(page,['1','2','2','2']);assert.equal(await page.locator('#explanation').isHidden(),true);assert.equal(await guide(page),'calculate');await fillWork(page);
  assert.equal(await guide(page),'explain');assert.equal(await page.locator('#step-explain').getAttribute('aria-current'),'step');await activate(page,'#guide-next',cdp);assert.equal(await page.evaluate(()=>document.activeElement.id),'explanation-text');
  await page.locator('#explanation-text').fill('定滑輪 10N 拉 20cm，動滑輪 5N 拉 40cm；兩輪都是 2J，省力不省功。');await activate(page,'#save-explanation',cdp);
  assert.equal(await guide(page),'done');assert.equal(await page.locator('#completion').isVisible(),true);assert.deepEqual(await records(page),saved,'explanation cannot rewrite original evidence');
  const completed=JSON.parse(await raw(page));assert.equal(Object.values(completed.pairs)[0].revisions.length,1);
  result.beforeCompletedReloadAudit=await assertOwnStorage(page);await page.reload({waitUntil:'networkidle'});assert.deepEqual(JSON.parse(await raw(page)),completed,'completed records and answer history reload exactly');assert.equal(await guide(page),'done');
  assert.equal(await page.locator('#setup').isVisible(),true,'reload never resumes a half run');
  // Editing a previously correct work answer revokes current completion, not history.
  await page.locator('#fixed-input').fill('1');assert.equal(await page.locator('#completion').isHidden(),true);assert.equal(await guide(page),'calculate');assert.equal(Object.values(JSON.parse(await raw(page)).pairs)[0].revisions.length,1);
  await fillWork(page);assert.equal(await guide(page),'done');assert.deepEqual(await records(page),saved);
  const native=[...result.preReloadAudit.input,...result.beforeCompletedReloadAudit.input];assert.ok(native.some(e=>e.type==='pointerdown'&&e.trusted&&e.pointer===(cdp?'touch':'mouse')),'native pointer flow exercised');if(cdp)assert.ok(native.some(e=>e.type==='pointercancel'&&e.trusted),'trusted touch cancellation exercised');
  await page.emulateMedia({media:'print'});assert.equal(await page.locator('.guide-card').isHidden(),true,'accepted print rule hides guide');await page.emulateMedia({media:'screen'});
 });
 for(const width of [1280,360,390,412])await run(`corrupt-zero-write-${width}`,width,width!==1280,async(page,cdp,result)=>{
  const corrupt='  { invalid original\n';assert.equal(await raw(page),corrupt);assert.match(await page.locator('#storage-message').innerText(),/未覆寫/);
  assert.equal((await assertOwnStorage(page)).access.filter(a=>a.name!=='getItem').length,0,'corrupt initial load has zero writes');
  await twoRoundsByButtons(page,cdp);await fillWork(page);await page.locator('#explanation-text').fill('本頁仍能比較：5N 乘 0.4m 和 10N 乘 0.2m 相等。');await activate(page,'#save-explanation',cdp);assert.equal(await guide(page),'done');assert.equal(await page.locator('#records .record').count(),2);
  await activate(page,'#reset-damaged',cdp);assert.equal(await page.locator('#reset-dialog').count(),0,'backup is required before reset dialog');assert.match(await page.locator('#save-help').innerText(),/匯出原始/);
  assert.equal(await raw(page),corrupt);result.preReloadAudit=await assertOwnStorage(page);assert.equal(result.preReloadAudit.access.filter(a=>a.name!=='getItem').length,0,'lesson and reset attempt cannot overwrite corrupt original');
  await page.reload({waitUntil:'networkidle'});assert.equal(await raw(page),corrupt);assert.equal(await page.locator('#records .record').count(),0,'unsaved blocked-storage evidence is not misrepresented as persisted');assert.equal((await assertOwnStorage(page)).access.filter(a=>a.name!=='getItem').length,0,'corrupt reload has zero writes');
 },'  { invalid original\n');
 await run('keyboard-repeat-direction-cancel',1280,false,async(page,cdp,result)=>{
  await focus(page,'#guide-next');await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'rope-handle');
  await page.keyboard.press('ArrowUp');assert.equal(await height(page),0,'fixed reverse key does not lower');
  await page.keyboard.down('ArrowDown');await page.keyboard.down('ArrowDown');await page.keyboard.up('ArrowDown');assert.equal(await height(page),1,'held arrow advances only once');
  await page.keyboard.press('Shift+ArrowDown');assert.equal(await height(page),6);await focus(page,'#rise-five');await page.keyboard.down('Enter');await page.keyboard.down('Enter');await page.keyboard.up('Enter');assert.equal(await height(page),11,'native button repeat advances once');
  await page.keyboard.press('Enter');assert.equal(await height(page),16,'next distinct button action remains usable');await focus(page,'#rope-handle');await page.keyboard.press('Shift+ArrowDown');assert.equal(await height(page),20);
  await focus(page,'#guide-next');await page.keyboard.down('Enter');await page.keyboard.down('Enter');await page.keyboard.up('Enter');assert.equal((await records(page)).length,1);assert.equal(await guide(page),'start','held save cannot auto-start next device');
  await page.keyboard.press('Enter');assert.equal(await page.locator('#diagram').getAttribute('data-device'),'movable');assert.equal(await page.evaluate(()=>document.activeElement.id),'rope-handle');await page.keyboard.press('ArrowDown');assert.equal(await height(page),0,'movable reverse key does not lower');
  result.cancel=await drag(page,null,'movable',20,{cancel:true});await focus(page,'#rope-handle');for(let i=0;i<4;i++)await page.keyboard.press('Shift+ArrowUp');await focus(page,'#guide-next');await page.keyboard.press('Enter');assert.equal((await records(page)).length,2);assert.equal(await guide(page),'calculate');
  await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'fixed-input');await page.keyboard.type('2');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'fixed-output');await fillWork(page);await focus(page,'#guide-next');await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'explanation-text');await page.keyboard.type('Both ideal systems use equal work.');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'save-explanation');await page.keyboard.press('Enter');assert.equal(await guide(page),'done');
  const audit=await assertOwnStorage(page);assert.ok(audit.input.some(e=>e.type==='keydown'&&e.repeat&&e.trusted),'trusted repeat reached runtime guard');assert.ok(audit.input.some(e=>e.key==='Escape'&&e.trusted),'native Escape cancellation exercised');
 });
 assert.equal(results.length,9);assert.ok(results.every(r=>r.status==='passed'),`${results.filter(r=>r.status!=='passed').length}/9 pulley browser scenarios failed`);console.log('PASS pulley-desk: 9 real Chromium scenarios');
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(output,'runner-error.txt'),e.stack||String(e));if(!browser){results.push({name:'browser-suite',status:'never-run',reason:e.message});save();}process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));});
