'use strict';
// Real Chromium acceptance using native keyboard/mouse and trusted CDP touch.
// evaluate() reads rendered geometry/storage or installs passive audit probes;
// no application-module imports, model fixtures, synthetic events or state setters.
// Uses the same loopback static-root harness as the other science-stations checks.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),output=path.resolve(process.env.LEVER_DESK_OUTPUT||'lever-desk-artifacts');
const KEY='bhcs.leverDesk.v1',LEGACY=['bhcs-science-v2-lever','bhcs-science-v2-lever-torque','bhcs-science-v2-microscope','bhcs-science-v2-lens','bhcs-science-v2-buoyancy'];
const results=[];let server,browser,base;fs.mkdirSync(output,{recursive:true});
const save=()=>fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
const raw=page=>page.evaluate(key=>localStorage.getItem(key),KEY);
async function experiment(page){const store=JSON.parse(await raw(page));return store.experiments.find(e=>e.id===store.currentId);}
async function center(locator){await locator.scrollIntoViewIfNeeded();const r=await locator.boundingBox();assert.ok(r);return {x:r.x+r.width/2,y:r.y+r.height/2};}
async function geometry(page){
 const g=await page.evaluate(()=>{const bench=document.querySelector('#bench'),b=bench.getBoundingClientRect();const rect=e=>({text:e.textContent,id:e.dataset.weight,hook:e.dataset.hook,total:e.dataset.rackTotal,r:e.getBoundingClientRect().toJSON(),scroll:e.scrollWidth,client:e.clientWidth});return {width:innerWidth,scroll:document.documentElement.scrollWidth,bench:b.toJSON(),weights:[...document.querySelectorAll('#hung-weights [data-weight]')].map(rect),labels:[...document.querySelectorAll('.rack-total')].map(rect),tray:[...document.querySelectorAll('#tray [data-weight]')].map(rect)};});
 assert.ok(g.scroll<=g.width+1,`horizontal overflow ${g.scroll}/${g.width}`);
 const all=[...g.weights,...g.labels];for(const a of all){assert.ok(a.r.left>=g.bench.left-1&&a.r.right<=g.bench.right+1,`bench containment: ${a.text}`);assert.ok(a.r.top>=g.bench.top&&a.r.bottom<=g.bench.bottom+1,`vertical containment ${a.text}`);assert.ok(a.scroll<=a.client+1,`clipped label ${a.text}`);}
 for(const a of [...g.weights,...g.tray]){assert.ok(a.r.width>=43.99&&a.r.height>=43.99,`44px target ${a.id}`);assert.match(a.text,/5 N/);assert.match(a.text,/砝碼/);}
 const overlap=(a,b)=>a.left<b.right-.5&&a.right>b.left+.5&&a.top<b.bottom-.5&&a.bottom>b.top+.5;
 for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++)assert.equal(overlap(all[i].r,all[j].r),false,`overlap ${all[i].text}/${all[j].text}`);
 for(const label of g.labels){const n=g.weights.filter(w=>w.hook===label.total).length;assert.match(label.text,new RegExp(`共 ${n*5} N`));assert.match(label.text,label.total==='0'?/支點0cm/:new RegExp(`${Number(label.total)<0?'左':'右'}${Math.abs(Number(label.total))}cm`));}
 return g;
}
async function selectMove(page,id,target){
 const before=await experiment(page),start=before.layout[id]??20;
 await page.locator(`[data-select="${id}"]`).click();
 await page.locator('#place').focus();
 for(let n=0;n<Math.abs(target-start)/5;n++)await page.keyboard.press(target>start?'ArrowRight':'ArrowLeft');
 await page.keyboard.press('Enter');assert.equal((await experiment(page)).layout[id],target);
}
async function drag(page,cdp,id,target,cancel=false){
 // Scroll the entire workspace into view before measuring both endpoints. The
 // dense mobile workspace fits the 844px viewport; no endpoint is guessed.
 await page.locator('.bench-workspace').scrollIntoViewIfNeeded();
 const points=await page.evaluate(({id,target})=>{const el=document.querySelector(`#hung-weights [data-weight="${id}"]`)||document.querySelector(`#tray [data-weight="${id}"]`),r=el.getBoundingClientRect(),b=document.querySelector('#bench').getBoundingClientRect(),t=document.querySelector('#tray').getBoundingClientRect();return {from:{x:r.x+r.width/2,y:r.y+r.height/2},to:target===null?{x:t.x+t.width/2,y:t.y+t.height/2}:{x:b.x+b.width/2+target/50*Math.min(b.width*.44,b.width/2-26),y:b.y+100},hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('[data-weight]')?.dataset.weight};},{id,target});
 assert.equal(points.hit,id,`${id} center is directly hit-testable`);
 for(const p of [points.from,points.to])assert.ok(p.y>=0&&p.y<844&&p.x>=0,`drag endpoint in viewport ${JSON.stringify(p)}`);
 if(cdp){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...points.from,id:1}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:points.from.x+(points.to.x-points.from.x)*i/8,y:points.from.y+(points.to.y-points.from.y)*i/8,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});}
 else{await page.mouse.move(points.from.x,points.from.y);await page.mouse.down();await page.mouse.move(points.to.x,points.to.y,{steps:8});if(cancel)await page.keyboard.press('Escape');await page.mouse.up();}
 if(!cancel)assert.equal((await experiment(page)).layout[id],target,`${id} direct drag to ${target}`);
 return points;
}
async function run(name,width,touch,task,corrupt){
 const result={name,width,touch,status:'running'};results.push(result);save();
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:touch,isMobile:touch,deviceScaleFactor:1,reducedMotion:'reduce'});
 await context.addInitScript(({KEY,LEGACY,corrupt})=>{
  if(location.protocol!=='http:')return;
  const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem,clear=Storage.prototype.clear;
  if(!sessionStorage.getItem('fixture-installed')){for(const k of LEGACY)set.call(localStorage,k,'untouched:'+k);if(corrupt!==undefined)set.call(localStorage,KEY,corrupt);sessionStorage.setItem('fixture-installed','1');}
  window.__leverAudit={access:[],input:[]};
  for(const [name,original] of [['getItem',get],['setItem',set],['removeItem',remove],['clear',clear]])Storage.prototype[name]=function(...args){if(this===localStorage)window.__leverAudit.access.push({name,key:args[0]});return original.apply(this,args);};
  for(const type of ['pointerdown','pointerup','pointercancel','click','keydown'])document.addEventListener(type,e=>window.__leverAudit.input.push({type,trusted:e.isTrusted,pointer:e.pointerType,detail:e.detail,key:e.key,repeat:e.repeat}),true);
 },{KEY,LEGACY,corrupt});
 const page=await context.newPage(),errors=[],failed=[],external=[];page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
 await context.route('**/*',r=>{if(new URL(r.request().url()).origin!==base){external.push(r.request().url());return r.abort();}return r.continue();});
 try{
  await page.goto(base+'/tools/lever-desk/',{waitUntil:'networkidle'});await page.locator('#primary').waitFor();
  assert.deepEqual(await page.locator('.teacher-crop img').evaluate(i=>[i.naturalWidth,i.naturalHeight]),[948,1659]);
  assert.equal(await page.locator('script[src*="researcher"],script[src*="science.js"],script[src*="site.js"]').count(),0);
  await task(page,touch?await context.newCDPSession(page):null,result);
  result.geometry=await geometry(page);result.audit=await page.evaluate(()=>window.__leverAudit);
  assert.ok(result.audit.access.every(a=>a.key===KEY),'runtime never accesses legacy keys or clears storage');
  // Read legacy bytes only after capturing the application access audit.
  assert.deepEqual(await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),LEGACY),LEGACY.map(k=>'untouched:'+k));
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.deepEqual(external,[]);
  await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});result.status='passed';
 }catch(e){result.status='failed';result.failure=e.stack;await page.screenshot({path:path.join(output,name+'-failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(output,name+'-failure.html'),await page.content().catch(()=>''));}
 finally{Object.assign(result,{errors,failed,external});save();console.log(result.status.toUpperCase()+' '+name);await context.close();}
}
(async()=>{
 const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json'};
 server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});base=`http://127.0.0.1:${server.address().port}`;
 // Existing CI browser only. No executable override, sandbox flags or retries.
 browser=await chromium.launch({headless:true});fs.writeFileSync(path.join(output,'environment.json'),JSON.stringify({node:process.version,browser:browser.version(),touch:'CDP emulation; not physical-device certification'},null,2));
 for(const width of [1280,360,390,412])await run(`flow-dense-${width}`,width,width!==1280,async(page,cdp,result)=>{
  const p=await center(page.locator('#primary'));await page.mouse.click(p.x,p.y);await page.mouse.click(p.x,p.y,{clickCount:2});
  assert.match(await page.locator('#step-label').innerText(),/步驟 B/);assert.equal((await experiment(page)).records.length,1);
  result.rapidPrimary=await page.evaluate(()=>window.__leverAudit.input.filter(e=>e.type==='click'));assert.ok(result.rapidPrimary.some(e=>e.trusted&&e.detail===2),'new primary accepts a trusted detail=2 click without a timer lock');
  await drag(page,cdp,'w3',20);await page.locator('#primary').click();await page.locator('#primary').click();assert.match(await page.locator('#step-label').innerText(),/步驟 C/);
  await drag(page,cdp,'w4',20);await page.locator('#primary').click();const recorded=(await experiment(page)).records;
  assert.deepEqual(recorded.map(r=>r.qualification),['A','B','C']);assert.deepEqual(recorded.map(r=>[r.torque.left,r.torque.right]),[[200,200],[200,100],[200,200]]);
  result.preReloadAudit=await page.evaluate(()=>window.__leverAudit);assert.ok(result.preReloadAudit.access.every(a=>a.key===KEY),'pre-reload runtime touches only its own key');
  await page.reload({waitUntil:'networkidle'});assert.deepEqual((await experiment(page)).records,recorded);assert.equal(await page.locator('#records .record').count(),3);await page.screenshot({path:path.join(output,`reload-${width}.png`),fullPage:true});
  await page.locator('#explore').click();for(let i=1;i<=6;i++)await selectMove(page,`w${i}`,20+i*5);
  result.dense=await geometry(page);assert.equal(result.dense.weights.length,6);assert.match(await page.locator('.bench-caption').innerText(),/上下錯開/);
  await page.screenshot({path:path.join(output,`dense-${width}.png`),fullPage:true});result.roundTrips=[];
  for(let i=1;i<=6;i++){const id=`w${i}`,target=20+i*5;result.roundTrips.push({id,out:await drag(page,cdp,id,null),back:await drag(page,cdp,id,target)});await geometry(page);}
  // Preserve the exact formerly failing local-crowding arrangement as well as
  // the six-adjacent-hook stress case, using only real controls.
  for(const id of ['w4','w6']){await page.locator(`[data-select="${id}"]`).click();await page.locator('#remove').click();}
  for(const [id,target] of [['w1',-40],['w2',-25],['w3',30],['w5',35]])await selectMove(page,id,target);
  result.regression=await geometry(page);assert.equal(result.regression.weights.length,4);await page.screenshot({path:path.join(output,`regression-${width}.png`),fullPage:true});
  for(const [id,target] of [['w1',-40],['w2',-25],['w3',30],['w5',35]]){await drag(page,cdp,id,null);await drag(page,cdp,id,target);await geometry(page);}
  const unchanged=await raw(page);await drag(page,cdp,'w5',null,true);assert.equal(await raw(page),unchanged,'cancel writes no evidence or revision');
  assert.deepEqual((await experiment(page)).records,recorded,'dense moves preserve exact original evidence');
  await selectMove(page,'w5',40);await page.locator('#release').click();assert.match(await page.locator('#direction-note').innerText(),/不是實際靜止角/);
  const beam=await page.locator('#diagram line').first().evaluate(e=>[e.getAttribute('y1'),e.getAttribute('y2')]);assert.equal(beam[0],beam[1],'reduced motion keeps beam horizontal');await page.locator('#primary').click();
  const audit=await page.evaluate(()=>window.__leverAudit.input);if(cdp)assert.ok(audit.some(e=>e.type==='pointerdown'&&e.pointer==='touch'&&e.trusted),'trusted touch exercised');
  // Direct entry into C must not silently load or fabricate A/B evidence.
  const confirmClick=async selector=>{const waiting=page.waitForEvent('dialog'),clicking=page.locator(selector).click();const dialog=await waiting;assert.equal(dialog.type(),'confirm');await dialog.accept();await clicking;};
  await confirmClick('#new-experiment');const fresh=(await experiment(page)).layout;await page.locator('[data-step="C"]').click();assert.deepEqual((await experiment(page)).layout,fresh,'direct task selection changes only the prompt');
  await confirmClick('#load-step');assert.equal((await experiment(page)).records.length,0);await drag(page,cdp,'w4',20);await page.locator('#primary').click();assert.deepEqual((await experiment(page)).records.map(r=>r.qualification),['C'],'direct C records only actual C evidence');
  result.print='not applicable: frozen runtime has no print control or print stylesheet';
 });
 for(const width of [1280,360,390,412])await run(`corrupt-zero-write-${width}`,width,width!==1280,async(page,cdp,result)=>{
  assert.equal(await raw(page),'  { invalid original\n');assert.match(await page.locator('#storage-alert').innerText(),/沒有自動覆寫/);assert.ok(await page.locator('#primary').isDisabled());assert.ok(await page.locator('#clear-corrupt').isDisabled());
  const initialAccess=await page.evaluate(()=>window.__leverAudit.access);assert.ok(initialAccess.every(a=>a.key===KEY),'corrupt initial load never accesses legacy keys');assert.equal(initialAccess.filter(a=>a.name!=='getItem').length,0,'corrupt initial load produces zero writes');result.initialAccess=initialAccess;
  await page.reload({waitUntil:'networkidle'});assert.equal(await raw(page),'  { invalid original\n');
  const accesses=await page.evaluate(()=>window.__leverAudit.access);assert.equal(accesses.filter(a=>a.name!=='getItem').length,0,'corrupt reload produces zero writes/removes/clear');result.accesses=accesses;
 },'  { invalid original\n');
 await run('keyboard-repeat-cancel',1280,false,async page=>{
  await page.locator('#primary').focus();await page.keyboard.press('Enter');await page.keyboard.press('Enter');assert.match(await page.locator('#step-label').innerText(),/步驟 B/);
  await selectMove(page,'w3',20);await page.locator('#primary').focus();await page.keyboard.down('Enter');await page.keyboard.down('Enter');await page.keyboard.up('Enter');assert.equal((await experiment(page)).records.length,2);assert.match(await page.locator('#step-label').innerText(),/步驟 B/);
  await page.keyboard.press('Enter');assert.match(await page.locator('#step-label').innerText(),/步驟 C/);
  const before=await raw(page);await page.locator('[data-select="w4"]').focus();await page.keyboard.press('Enter');await page.keyboard.press('ArrowRight');await page.keyboard.press('Escape');assert.equal(await raw(page),before);
  const audit=await page.evaluate(()=>window.__leverAudit.input);assert.ok(audit.some(e=>e.key==='Enter'&&e.repeat&&e.trusted));
 });
 assert.equal(results.length,9);assert.ok(results.every(r=>r.status==='passed'),`${results.filter(r=>r.status!=='passed').length}/9 lever browser scenarios failed`);console.log('PASS lever-desk: 9 real Chromium scenarios');
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(output,'runner-error.txt'),e.stack||String(e));if(!browser){results.push({name:'browser-suite',status:'never-run',reason:e.message});save();}process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));});
