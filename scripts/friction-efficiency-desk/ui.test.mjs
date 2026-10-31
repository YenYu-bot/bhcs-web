// DOM unit harness only: dispatched pointer events are NOT native touch or
// browser geometry/colour validation. Those require the separate browser QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {Engine} from '../../tools/friction-efficiency-desk/engine.mjs';
import {derive,parseAnswer,EXPECTED_ANSWERS} from '../../tools/friction-efficiency-desk/model.mjs';
import {createStorageDriver,STORAGE_KEY} from '../../tools/friction-efficiency-desk/storage.mjs';
import {drawBench} from '../../tools/friction-efficiency-desk/bench.mjs';
const require=createRequire(import.meta.url);
const {JSDOM,VirtualConsole}=require('jsdom'); // normal devDependency; NODE_PATH may supply shared QA installation.
const html=await readFile(new URL('../../tools/friction-efficiency-desk/index.html',import.meta.url),'utf8');
const source=(await readFile(new URL('../../tools/friction-efficiency-desk/app.mjs',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function harness(initial=new Map(),{noLocks=false,failures={}}={}) {
 const errors=[],downloads=[],calls=[],map=new Map(initial),lockQueue=[];
 const console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(html,{url:'https://qa.example.test/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:console});
 const w=dom.window,d=w.document;
 const storage={getItem(k){calls.push(['get',k]);return map.get(k)??null;},setItem(k,v){calls.push(['set',k,v]);if(failures.write)throw Error('quota');map.set(k,v);},removeItem(k){calls.push(['remove',k]);if(failures.clear)throw Error('remove denied');map.delete(k);}};
 let hold=false;
 const locks={request(name,options,callback){return new Promise((resolve,reject)=>{const run=()=>{try{resolve(callback());}catch(e){reject(e);}};if(hold)lockQueue.push(run);else run();});}};
 const captured=new WeakMap();
 w.HTMLElement.prototype.setPointerCapture=function(id){captured.set(this,id);};
 w.HTMLElement.prototype.hasPointerCapture=function(id){return captured.get(this)===id;};
 w.HTMLElement.prototype.releasePointerCapture=function(id){if(captured.get(this)===id)captured.delete(this);};
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.HTMLElement.prototype.getBoundingClientRect=function(){return this.id==='bench'?{x:0,y:0,left:0,top:0,width:600,height:430,right:600,bottom:430}:{x:0,y:0,left:0,top:0,width:100,height:44,right:100,bottom:44};};
 w.HTMLElement.prototype.getClientRects=function(){return this.closest('[hidden]')?[]:[this.getBoundingClientRect()];};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 let resizeCallback;
 w.ResizeObserver=class {constructor(fn){this.fn=fn;resizeCallback=fn;}observe(){this.fn([{contentRect:{width:600,height:430}}]);}disconnect(){}};
 w.requestAnimationFrame=fn=>{fn(0);return 1;};w.cancelAnimationFrame=()=>{};
 w.Blob=class {constructor(parts,options){this.parts=parts;this.type=options.type;}};
 w.URL.createObjectURL=blob=>{downloads.push(blob.parts.join(''));return `blob:qa-${downloads.length}`;};w.URL.revokeObjectURL=()=>{};
 w.HTMLAnchorElement.prototype.click=function(){};
 w.setTimeout=fn=>{queueMicrotask(fn);return 1;};
 w.__modules={Engine,derive,parseAnswer,EXPECTED_ANSWERS,drawBench,createStorageDriver:options=>createStorageDriver({...options,storage,locks:noLocks?null:locks})};
 w.eval(`const {Engine,derive,parseAnswer,EXPECTED_ANSWERS,drawBench,createStorageDriver}=window.__modules;\n${source}`);
 delete w.__modules;
 const $=id=>d.getElementById(id);
 const click=id=>$(id).click();
 const input=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
 const select=(name,value)=>{const e=d.querySelector(`input[name="${name}"][value="${value}"]`);assert.ok(e);e.checked=true;e.dispatchEvent(new w.Event('change',{bubbles:true}));};
 const pointer=(type,values={})=>{const e=new w.Event(type,{bubbles:true,cancelable:true});for(const [k,v]of Object.entries({pointerId:1,isPrimary:true,button:0,clientX:100,clientY:300,...values}))Object.defineProperty(e,k,{value:v});$('handle').dispatchEvent(e);};
 const key=value=>$('handle').dispatchEvent(new w.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));
 async function settle(){await tick();await tick();assert.deepEqual(errors,[]);}
 function close(){dom.window.close();}
 function beginDrag(){pointer('pointerdown');}
 function dragTo(s){const k=Number($('apparatus').dataset.scale);pointer('pointermove',{clientX:100+.8*s*k,clientY:300-.6*s*k});}
 function endpoint(){for(let i=0;i<10;i++)click('advance-ten');assert.equal($('distance').textContent,'100 cm');}
 async function pair(){click('begin');endpoint();click('seal');await settle();click('next');endpoint();click('seal');await settle();assert.equal($('comparison').hidden,false);}
 async function distances(){select('distance-0','slope');select('distance-1','vertical');click('check-distances');await settle();assert.equal($('calculations').hidden,false);}
 async function answers(){await distances();for(let step=0;step<4;step++){input(`answer-${step*2}`,String(EXPECTED_ANSWERS[step*2]));input(`answer-${step*2+1}`,String(EXPECTED_ANSWERS[step*2+1]));click(`check-step-${step}`);await settle();}assert.equal($('conclusions').hidden,false);}
 async function complete(){await pair();await answers();select('conclusion-0','surface');select('conclusion-1','internal');select('conclusion-2','useful-over-input');click('check-conclusions');await settle();assert.equal($('completion').hidden,false);}
 function exportData(){click('export');return JSON.parse(downloads.at(-1));}
 function openReset(launcher='new-experiment'){click(launcher);assert.equal($('reset-dialog').open,true);}
 function stageTwo(){click('reset-continue');assert.equal($('reset-stage-two').hidden,false);assert.equal($('reset-confirm').disabled,true);}
 function acknowledge(){ $('reset-ack').checked=true;$('reset-ack').dispatchEvent(new w.Event('change',{bubbles:true}));}
 return {w,d,$,click,input,select,pointer,key,settle,close,beginDrag,dragTo,endpoint,pair,distances,answers,complete,exportData,openReset,stageTwo,acknowledge,map,calls,downloads,errors,holdLocks(){hold=true;},releaseLocks(){hold=false;while(lockQueue.length)lockQueue.shift()();},queuedLocks:()=>lockQueue.length,resize(width,height){resizeCallback([{contentRect:{width,height}}]);}};
}

test('real app completes two rounds, eight answers and conclusions; reload retains evidence',async()=>{
 const h=harness(new Map([['bhcs.inclineDesk.v1','old-station']]));try{
  assert.equal(h.$('comparison').hidden,true);assert.equal(h.$('force').textContent,'尚未上移');
  await h.complete();assert.match(h.$('energy-summary').textContent,/效率75%/);assert.equal(h.$('save-status').textContent,'已存此裝置');
  const raw=h.map.get(STORAGE_KEY),snapshot=JSON.parse(raw);assert.equal(snapshot.records.length,2);assert.deepEqual(snapshot.records.map(r=>r.forceN),[6,8]);assert.equal(h.map.get('bhcs.inclineDesk.v1'),'old-station');
  h.select('conclusion-1','vanished');await h.settle();assert.equal(h.$('completion').hidden,true);h.click('check-conclusions');await h.settle();assert.equal(h.$('completion').hidden,true);
  h.select('conclusion-1','internal');await h.settle();assert.equal(h.$('completion').hidden,true);h.click('check-conclusions');await h.settle();assert.equal(h.$('completion').hidden,false);
  const r=harness(h.map);try{assert.equal(r.$('completion').hidden,false);assert.equal(r.$('new-experiment').hidden,false);assert.equal(r.$('completion-reset').hidden,false);assert.equal(r.$('answer-7').value,'75');}finally{r.close();}
 }finally{h.close();}
});
test('unpassed model answers are absent from export; explicit reveal is attributed',async()=>{
 const h=harness();try{
  assert.deepEqual(h.exportData().modelCalculations,[]);await h.pair();assert.deepEqual(h.exportData().modelCalculations,[]);
  await h.distances();assert.deepEqual(h.exportData().modelCalculations,[]);assert.equal(h.$('revealed-0').hidden,true);
  h.click('reveal-0');await h.settle();const data=h.exportData();assert.equal(data.modelCalculations.length,1);assert.equal(data.modelCalculations[0].value,6);assert.equal(data.modelCalculations[0].revealed,true);assert.equal(data.modelCalculations[0].checked,false);
  h.input('answer-0','6');h.input('answer-1','8');h.click('check-step-0');await h.settle();assert.equal(h.exportData().modelCalculations.length,2);
  assert.match(h.$('answer-feedback-0').textContent,/曾查看解說/);assert.equal(h.$('teacher-model').hidden,true);
 }finally{h.close();}
});
test('upstream correction invalidates completion, even changed back; records immutable',async()=>{
 const h=harness();try{await h.complete();const before=JSON.stringify(JSON.parse(h.map.get(STORAGE_KEY)).records);
  h.input('answer-0','7');await h.settle();assert.equal(h.$('completion').hidden,true);assert.equal(h.$('calc-step-1').hidden,true);
  h.input('answer-0','6');await h.settle();assert.equal(h.$('completion').hidden,true);assert.equal(h.$('calc-step-1').hidden,true);
  assert.equal(JSON.stringify(JSON.parse(h.map.get(STORAGE_KEY)).records),before);
  h.select('distance-0','vertical');await h.settle();assert.equal(h.$('calculations').hidden,true);h.select('distance-0','slope');await h.settle();assert.equal(h.$('calculations').hidden,true);
 }finally{h.close();}
});
test('pointer cancel/up keep attained progress, reverse never lowers or pumps it; no auto seal',async()=>{
 const h=harness();try{h.click('begin');h.beginDrag();h.dragTo(37);assert.equal(h.$('distance').textContent,'37 cm');assert.equal(h.$('handle').classList.contains('is-dragging'),true);
  h.dragTo(5);h.dragTo(20);assert.equal(h.$('distance').textContent,'37 cm');h.pointer('pointercancel');assert.equal(h.$('distance').textContent,'37 cm');assert.equal(h.$('handle').classList.contains('is-dragging'),false);assert.equal(h.map.has(STORAGE_KEY),false);
  h.beginDrag();h.dragTo(63);assert.equal(h.$('distance').textContent,'100 cm');assert.equal(h.$('seal').disabled,true);h.pointer('pointerup',{clientX:9999,clientY:-9999});assert.equal(h.$('distance').textContent,'100 cm');assert.equal(h.$('seal').disabled,false);assert.equal(h.$('handle').classList.contains('is-dragging'),false);assert.equal(h.map.has(STORAGE_KEY),false);
  h.pointer('pointerup');h.click('seal');h.click('seal');await h.settle();assert.equal(JSON.parse(h.map.get(STORAGE_KEY)).records.length,1);
 }finally{h.close();}
});
test('keyboard advances, ignores reverse/end, Escape stops held pointer without rollback',async()=>{
 const h=harness();try{h.click('begin');h.key('ArrowRight');h.key('PageUp');h.key('ArrowLeft');h.key('End');assert.equal(h.$('distance').textContent,'11 cm');
  h.beginDrag();h.dragTo(9);h.key('Escape');assert.equal(h.$('distance').textContent,'20 cm');assert.equal(h.$('handle').classList.contains('is-dragging'),false);
  for(let i=0;i<8;i++)h.key('PageUp');h.click('seal');await h.settle();assert.deepEqual(JSON.parse(h.map.get(STORAGE_KEY)).records[0].inputMethods,['keyboard','pointer']);
 }finally{h.close();}
});
test('both reset launchers and both cancel stages preserve bytes and return focus',async()=>{
 const h=harness();try{await h.complete();h.input('reflection','粗面多出的2 J轉為內能。');h.click('save-reflection');await h.settle();
  for(const launcher of ['new-experiment','completion-reset'])for(const second of [false,true])for(const escape of [false,true]){
   const raw=h.map.get(STORAGE_KEY),before=h.calls.filter(([k])=>k==='set'||k==='remove').length;
   h.openReset(launcher);if(second)h.stageTwo();if(escape)h.$('reset-dialog').dispatchEvent(new h.w.Event('cancel',{cancelable:true}));else h.click(second?'reset-cancel-two':'reset-cancel-one');
   assert.equal(h.$('reset-dialog').open,false);assert.equal(h.d.activeElement.id,launcher);assert.equal(h.map.get(STORAGE_KEY),raw);assert.equal(h.calls.filter(([k])=>k==='set'||k==='remove').length,before);assert.equal(h.$('completion').hidden,false);
  }
 }finally{h.close();}
});
test('acknowledged final reset clears only own key; fresh second complete cycle has no old answers',async()=>{
 const h=harness(new Map([['bhcs.inclineDesk.v1','keep']]));try{await h.complete();h.input('reflection','old answer');h.click('save-reflection');await h.settle();h.openReset('completion-reset');h.stageTwo();h.click('reset-confirm');await h.settle();assert.equal(h.$('reset-dialog').open,true);assert.ok(h.map.get(STORAGE_KEY));
  h.acknowledge();h.click('reset-confirm');await h.settle();assert.equal(h.map.has(STORAGE_KEY),false);assert.equal(h.map.get('bhcs.inclineDesk.v1'),'keep');assert.equal(h.$('begin').hidden,false);assert.equal(h.d.activeElement.id,'begin');assert.equal(h.$('completion').hidden,true);assert.equal(h.$('reflection').value,'');
  for(let i=0;i<8;i++)assert.equal(h.$(`answer-${i}`).value,'');const reload=harness(h.map);try{assert.equal(reload.$('begin').hidden,false);assert.equal(reload.$('completion').hidden,true);}finally{reload.close();}
  await h.complete();assert.equal(JSON.parse(h.map.get(STORAGE_KEY)).answers.revisions.length,0);
 }finally{h.close();}
});
test('current save remains pending when prior snapshot saved; stale status cannot masquerade as delivery',async()=>{
 const h=harness();try{h.click('begin');h.endpoint();h.click('seal');await h.settle();assert.equal(h.$('save-status').textContent,'已存此裝置');
  h.click('next');h.endpoint();h.holdLocks();h.click('seal');await h.settle();assert.equal(h.queuedLocks(),1);assert.match(h.$('save-status').textContent,/正在保存本次資料/);assert.equal(JSON.parse(h.map.get(STORAGE_KEY)).records.length,1);
  h.releaseLocks();await h.settle();assert.equal(h.$('save-status').textContent,'已存此裝置');assert.equal(JSON.parse(h.map.get(STORAGE_KEY)).records.length,2);
 }finally{h.close();}
});
test('memory-only flow never falsely saved, permits clearly local reset when no existing key',async()=>{
 const h=harness(new Map(),{noLocks:true});try{await h.pair();assert.match(h.$('save-status').textContent,/尚未存到此裝置/);assert.equal(h.map.has(STORAGE_KEY),false);h.openReset();h.stageTwo();h.acknowledge();h.click('reset-confirm');await h.settle();assert.equal(h.$('begin').hidden,false);assert.match(h.$('global-feedback').textContent,/本頁暫存/);assert.equal(h.map.has(STORAGE_KEY),false);}finally{h.close();}
});
test('quarantined reset backup downloads exact original raw bytes, not fresh empty engine',async()=>{
 const raw='  {"schemaVersion":999, "unreadable":"KEEP EXACT"}\n';
 const h=harness(new Map([[STORAGE_KEY,raw]]));try{
  assert.equal(h.$('storage-alert').hidden,false);assert.equal(h.$('backup-raw').hidden,false);h.click('backup-raw');assert.equal(h.downloads.at(-1),raw);
  // Normal current-page export remains a separate, labelled data source.
  assert.deepEqual(h.exportData().measurements,[]);
  h.openReset();assert.match(h.$('reset-export').textContent,/本頁量測與作答/);assert.equal(h.$('reset-raw-export').hidden,false);assert.match(h.$('reset-raw-export').textContent,/原始資料備份/);assert.equal(h.$('reset-raw-note').hidden,false);h.click('reset-raw-export');assert.equal(h.downloads.at(-1),raw,'Destructive-reset raw backup must preserve unrecognized original bytes');
  h.click('reset-cancel-one');assert.equal(h.map.get(STORAGE_KEY),raw);assert.equal(h.d.activeElement.id,'new-experiment');
 }finally{h.close();}
});
test('reset during pending save cancels stale delivery and cannot resurrect old records',async()=>{
 const h=harness();try{await h.pair();await h.distances();h.holdLocks();h.input('answer-0','6');await h.settle();assert.equal(h.queuedLocks(),1);
  h.openReset();h.stageTwo();h.acknowledge();h.click('reset-confirm');assert.equal(h.$('reset-confirm').disabled,true);h.releaseLocks();await h.settle();
  assert.equal(h.$('reset-dialog').open,false);assert.equal(h.$('begin').hidden,false);assert.equal(h.map.has(STORAGE_KEY),false);assert.equal(h.$('answer-0').value,'');assert.doesNotMatch(h.$('save-status').textContent,/已存此裝置/);
 }finally{h.close();}
});
test('failed native clear keeps dialog, original bytes and answers until successful explicit retry',async()=>{
 const failures={clear:false};const h=harness(new Map(),{failures});try{await h.complete();const raw=h.map.get(STORAGE_KEY);failures.clear=true;h.openReset();h.stageTwo();h.acknowledge();h.click('reset-confirm');await h.settle();
  assert.equal(h.$('reset-dialog').open,true);assert.equal(h.map.get(STORAGE_KEY),raw);assert.equal(h.$('answer-7').value,'75');assert.equal(h.$('completion').hidden,false);assert.match(h.$('reset-feedback').textContent,/未能清除/);
  failures.clear=false;h.click('reset-confirm');await h.settle();assert.equal(h.$('reset-dialog').open,false);assert.equal(h.$('begin').hidden,false);assert.equal(h.map.has(STORAGE_KEY),false);
 }finally{h.close();}
});
test('download failure reports failure without deleting original or claiming a completed backup',async()=>{
 const h=harness();try{await h.pair();const raw=h.map.get(STORAGE_KEY);h.w.URL.createObjectURL=()=>{throw Error('download disabled');};h.openReset();h.click('reset-export');assert.match(h.$('global-feedback').textContent,/無法開始下載/);assert.equal(h.map.get(STORAGE_KEY),raw);assert.equal(h.$('reset-dialog').open,true);}finally{h.close();}
});

test('lost capture, blur and resize each stop at attained position and reject stale moves',async()=>{
 for(const end of ['capture','blur','resize']){const h=harness();try{h.click('begin');h.beginDrag();h.dragTo(24);
  if(end==='capture')h.pointer('lostpointercapture');else if(end==='blur')h.w.dispatchEvent(new h.w.Event('blur'));else h.resize(308,300);
  assert.equal(h.$('distance').textContent,'24 cm');assert.equal(h.$('handle').classList.contains('is-dragging'),false);
  h.dragTo(90);h.pointer('pointerup');assert.equal(h.$('distance').textContent,'24 cm');assert.equal(h.$('seal').disabled,true);assert.equal(h.map.has(STORAGE_KEY),false);
  h.beginDrag();h.dragTo(10);h.pointer('pointerup');assert.equal(h.$('distance').textContent,'34 cm');
 }finally{h.close();}}
});
test('second pointer and non-primary buttons cannot hijack or create progress',async()=>{
 const h=harness();try{h.click('begin');h.pointer('pointerdown',{button:2});h.dragTo(60);assert.equal(h.$('distance').textContent,'0 cm');
 h.beginDrag();h.dragTo(15);h.pointer('pointerdown',{pointerId:2,isPrimary:false});h.pointer('pointermove',{pointerId:2,isPrimary:false,clientX:999,clientY:-999});h.pointer('pointercancel',{pointerId:2,isPrimary:false});assert.equal(h.$('distance').textContent,'15 cm');assert.equal(h.$('handle').classList.contains('is-dragging'),true);h.pointer('pointerup');assert.equal(h.$('handle').classList.contains('is-dragging'),false);
 }finally{h.close();}
});
