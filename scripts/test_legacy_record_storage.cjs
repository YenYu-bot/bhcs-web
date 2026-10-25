const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=process.env.RECORD_TEST_ROOT||path.resolve(__dirname,'..');
let passed=0;
const configs=[['microscope-lab','bhcsMicroscopeRecords','specimen objective total fov clarity stage features'],['acid-base-indicator-lab','bhcsAcidBaseRecords','acid base water nH nOH excess total ph kind indicator']];
function load(config,opts={}){
 const [page,key,fields]=config, errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'tools',page+'.html'),'utf8'),{url:'https://example.test/tools/'+page+'.html',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window,d=w.document,$=id=>d.getElementById(id),state={raw:opts.raw??null,getFail:opts.getFail||false,setFail:opts.setFail||false,writes:0,confirmed:true,printed:[]};
 Object.defineProperty(w,'localStorage',{configurable:true,value:{getItem(k){if(k!==key)return null;if(state.getFail)throw new w.DOMException('Denied','SecurityError');return state.raw},setItem(k,v){if(k!==key)return;state.writes++;if(state.setFail)throw new w.DOMException('Unavailable',state.setFail);state.raw=v}}});
 if(opts.propertyDenied)Object.defineProperty(w,'localStorage',{get(){throw new w.DOMException('Denied','SecurityError')}});
 const ctx=new Proxy({},{get(t,k){return k in t?t[k]:(...args)=>k==='measureText'?{width:String(args[0]).length*10}:undefined},set(t,k,v){t[k]=v;return true}});
 w.HTMLCanvasElement.prototype.getContext=()=>ctx;w.matchMedia=()=>({matches:true,addEventListener(){}});w.Image=class{set src(v){}};w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};w.confirm=()=>state.confirmed;w.print=()=>state.printed.push($('record').textContent);w.HTMLElement.prototype.scrollIntoView=()=>{};
 const script=[...d.scripts].find(s=>s.textContent.includes('function saveRecords')).textContent;
 w.eval(script.replace(/\}\)\(\);\s*$/,'window.__recordsTest={'+(page==='microscope-lab'?'':'finish')+'};})();'));
 if(opts.enhanced){w.eval(fs.readFileSync(path.join(root,'assets/researcher-lab.js'),'utf8'));d.dispatchEvent(new w.Event('DOMContentLoaded'));}
 function ready(){if(page==='microscope-lab')$('begin').click();else{$('mix').click();w.__recordsTest.finish()}assert.equal($('addRecord').disabled,false)}
 return{w,d,$,state,ready,async add(){ready();await Promise.resolve();(opts.enhanced?d.querySelector('.researcher-bench-record'):$('addRecord')).click();},rows(){return [...$('records').querySelectorAll('tr')].filter(r=>!r.querySelector('[colspan]'))},message(){return $('recordStorageStatus').textContent},close(){assert.deepEqual(errors,[]);w.close()}};
}
function oldRow(config,label='old'){return Object.fromEntries(config[2].split(' ').map(k=>[k,label]))}
const cases=[];function test(name,fn){cases.push([name,fn])}
for(const c of configs){
 const old=JSON.stringify([oldRow(c)]);
 for(const enhanced of [false,true])for(const failure of ['QuotaExceededError','SecurityError'])test(c[0]+' '+failure+' enhanced='+enhanced+' retains old + new, printable, retry persists',async()=>{
  const x=load(c,{raw:old,setFail:failure,enhanced});await x.add();assert.equal(x.rows().length,2);assert.match(x.rows()[0].textContent,/old/);assert.notEqual(x.rows()[1].textContent,x.rows()[0].textContent);assert.equal(x.state.raw,old);assert.match(x.message(),/尚未存妥/);assert.equal(x.$('recordStorageStatus').hidden,false);
  if(enhanced)assert.match(x.d.querySelector('.researcher-save-status').textContent,/尚未存妥/);
  x.$('printRecord').click();assert.match(x.state.printed[0],/old/);assert.match(x.state.printed[0],/尚未存妥/);assert.ok(x.$('recordStorageStatus').closest('#record'));
  const reload=load(c,{raw:x.state.raw});assert.equal(reload.rows().length,1);reload.close();x.state.setFail=false;await x.add();assert.equal(x.rows().length,3);assert.equal(JSON.parse(x.state.raw).length,3);assert.equal(x.$('addRecord').dataset.recordSaveState,'persisted');x.close();
 });
 for(const enhanced of [false,true])for(const opts of [{getFail:true,raw:old},{propertyDenied:true,raw:old},{raw:'{'},{raw:'{}'},{raw:'null'},{raw:'[null]'},{raw:JSON.stringify([{specimen:'unsupported'}])}])test(c[0]+' unsafe initial read blocks ALL writes enhanced='+enhanced+' '+JSON.stringify(opts),async()=>{
  const x=load(c,{...opts,enhanced});assert.equal(x.rows().length,0);assert.match(x.message(),/無法讀取/);x.state.getFail=false;await x.add();assert.equal(x.rows().length,1);assert.equal(x.state.writes,0);assert.equal(x.state.raw,opts.raw);if(enhanced)assert.match(x.d.querySelector('.researcher-save-status').textContent,/尚未存妥/);x.$('printRecord').click();assert.match(x.state.printed[0],/尚未存妥/);
  x.state.confirmed=false;x.$('clearRecord').click();assert.equal(x.rows().length,1);x.state.confirmed=true;x.$('clearRecord').click();assert.equal(x.rows().length,0);assert.equal(x.state.writes,0);assert.equal(x.state.raw,opts.raw);assert.match(x.message(),/並未清除.*再出現/);x.close();
 });
 test(c[0]+' failed clear retains durable rows; cancel is no-op; successful clear persists',async()=>{
  const x=load(c,{raw:old,setFail:'QuotaExceededError'});await x.add();const notice=x.message();x.state.confirmed=false;const writes=x.state.writes;x.$('clearRecord').click();assert.equal(x.rows().length,2);assert.equal(x.message(),notice);assert.equal(x.state.writes,writes);x.state.confirmed=true;x.$('clearRecord').click();assert.equal(x.rows().length,0);assert.equal(x.state.raw,old);assert.match(x.message(),/未能清除.*再出現/);x.$('printRecord').click();assert.match(x.state.printed[0],/未能清除/);const reload=load(c,{raw:x.state.raw});assert.equal(reload.rows().length,1);reload.close();x.state.setFail=false;x.$('clearRecord').click();assert.equal(x.state.raw,'[]');x.close();
 });
 for(const fail of [false,'QuotaExceededError'])test(c[0]+' cap 12 explicit wrapper result fail='+fail,async()=>{
  const raw=JSON.stringify(Array.from({length:12},(_,i)=>oldRow(c,'old'+i))),x=load(c,{raw,setFail:fail,enhanced:true});await x.add();assert.equal(x.rows().length,12);assert.ok(!x.rows()[0].textContent.includes('old0'));assert.match(x.rows()[0].textContent,/old1/);const m=x.d.querySelector('.researcher-save-status').textContent;assert.match(m,fail?/尚未存妥/:/已儲存/);assert.equal(x.state.raw===raw,!!fail);x.close();
 });
 test(c[0]+' consecutive failed adds and clear preserve honest enhanced status',async()=>{
  const x=load(c,{raw:old,setFail:'QuotaExceededError',enhanced:true});
  for(let i=0;i<3;i++)await x.add();assert.equal(x.rows().length,4);assert.equal(x.state.raw,old);
  x.$('clearRecord').click();await Promise.resolve();assert.equal(x.rows().length,0);assert.match(x.d.querySelector('.researcher-save-status').textContent,/未能清除.*再出現/);
  await x.add();assert.equal(x.rows().length,1);assert.match(x.d.querySelector('.researcher-save-status').textContent,/尚未存妥/);x.state.setFail=false;await x.add();assert.equal(JSON.parse(x.state.raw).length,2);assert.ok(!x.state.raw.includes('old'));x.close();
 });
 if(c[0]==='acid-base-indicator-lab')for(const fail of [false,'QuotaExceededError'])test(c[0]+' enhanced next-operation prompt preserves unsaved warnings fail='+fail,async()=>{
  const x=load(c,{setFail:fail,enhanced:true});await x.add();await Promise.resolve();
  const message=x.d.querySelector('.researcher-save-status');assert.match(message.textContent,fail?/尚未存妥/:/已儲存/);
  x.$('acidVolume').value=60;x.$('acidVolume').dispatchEvent(new x.w.Event('input',{bubbles:true}));
  await Promise.resolve();assert.equal(x.$('addRecord').disabled,true);assert.equal(x.d.querySelector('.researcher-bench-record').disabled,true);
  assert.match(message.textContent,fail?/尚未存妥/:/完成本輪操作後，就能保存觀察/);
  // Durable notebook notice must not be erased by the bench's operation prompt.
  assert.match(x.message(),fail?/尚未存妥/:/已儲存/);assert.equal(x.rows().length,1);
  x.state.setFail=false;await x.add();await Promise.resolve();assert.match(message.textContent,/已儲存/);assert.equal(JSON.parse(x.state.raw).length,2);x.close();
 });
 test(c[0]+' empty initial storage normal add and reload preserve exact schema',async()=>{
  const x=load(c);await x.add();const rows=JSON.parse(x.state.raw);assert.equal(rows.length,1);assert.deepEqual(Object.keys(rows[0]).sort(),c[2].split(' ').sort());const reload=load(c,{raw:x.state.raw});assert.equal(reload.rows()[0].textContent,x.rows()[0].textContent);reload.close();x.close();
 });
}
(async()=>{for(const [name,fn] of cases){await fn();passed++;console.log('PASS '+name)}console.log(passed+' legacy record storage tests passed (JSDOM; no real print/layout assertion)')})().catch(e=>{console.error(e);process.exitCode=1});
