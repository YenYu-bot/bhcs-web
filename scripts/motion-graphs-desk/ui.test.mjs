// Actual-app DOM contracts with dispatched events. This is NOT native touch,
// rendering, browser zoom, screen-reader or real-device certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from './accepted-file-reader.mjs';
import {createRequire} from 'node:module';
import {Engine} from '../../tools/motion-graphs-desk/engine.mjs';
import {Clock} from '../../tools/motion-graphs-desk/clock.mjs';
import {positionAt} from '../../tools/motion-graphs-desk/model.mjs';
import {createStorageDriver,STORAGE_KEY} from '../../tools/motion-graphs-desk/storage.mjs';
import {renderTrack,renderPlot,plotPointClient,pointerToPlot,TRACK,PLOT,minimumLabelFont} from '../../tools/motion-graphs-desk/geometry.mjs';
const require=createRequire(import.meta.url);
const {JSDOM,VirtualConsole}=require('jsdom'); // devDependency or NODE_PATH from shared QA install.
const html=await readFile(new URL('../../tools/motion-graphs-desk/index.html',import.meta.url),'utf8');
const source=(await readFile(new URL('../../tools/motion-graphs-desk/app.mjs',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const observed=[1,3,5,5,5,4,3,2,1];
function harness(initial=new Map(),{noLocks=false,failures={}}={}){
 const errors=[],downloads=[],calls=[],map=new Map(initial),heldLocks=[];
 const console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(html,{url:'https://qa.example.test/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:console});
 const w=dom.window,d=w.document,$=id=>d.getElementById(id);
 const storage={getItem(k){calls.push(['get',k]);if(failures.read)throw Error('read denied');return map.get(k)??null;},setItem(k,v){calls.push(['set',k,v]);if(failures.write)throw Error('quota');map.set(k,v);},removeItem(k){calls.push(['remove',k]);if(failures.clear)throw Error('clear denied');map.delete(k);}};
 let hold=false;const locks={request(name,options,callback){return new Promise((resolve,reject)=>{const run=()=>{try{resolve(callback());}catch(e){reject(e);}};if(hold)heldLocks.push(run);else run();});}};
 const captures=new WeakMap();
 w.HTMLElement.prototype.setPointerCapture=function(id){captures.set(this,id);};
 w.HTMLElement.prototype.hasPointerCapture=function(id){return captures.get(this)===id;};
 w.HTMLElement.prototype.releasePointerCapture=function(id){if(captures.get(this)===id)captures.delete(this);};
 w.HTMLElement.prototype.scrollIntoView=function(){};
 const rect={left:0,top:0,x:0,y:0,width:PLOT.width,height:PLOT.height,right:PLOT.width,bottom:PLOT.height};
 w.HTMLElement.prototype.getBoundingClientRect=function(){return rect;};
 w.SVGElement.prototype.getBoundingClientRect=function(){return this.closest('#track')?{...rect,width:TRACK.width,right:TRACK.width,height:TRACK.height,bottom:TRACK.height}:rect;};
 w.HTMLElement.prototype.getClientRects=function(){return this.closest('[hidden]')?[]:[rect];};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 w.HTMLDialogElement.prototype.close=function(value){if(value!==undefined)this.returnValue=value;this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 // Model only UA method=dialog behavior missing in jsdom, not app logic.
 $('reset-form').addEventListener('submit',e=>{if(e.target.method==='dialog'){e.preventDefault();$('reset-dialog').close(e.submitter?.value??'');}});
 w.Blob=class{constructor(parts){this.parts=parts;}};w.URL.createObjectURL=blob=>{if(failures.download)throw Error('download denied');downloads.push(blob.parts.join(''));return `blob:qa-${downloads.length}`;};w.URL.revokeObjectURL=()=>{};
 w.HTMLAnchorElement.prototype.click=function(){};w.setTimeout=fn=>{queueMicrotask(fn);return 1;};
 let now=0,rafId=0;const frames=new Map();
 class UIClock extends Clock{constructor(options){super({...options,now:()=>now,requestFrame:fn=>{frames.set(++rafId,fn);return rafId;},cancelFrame:id=>frames.delete(id)});}}
 w.matchMedia=()=>({matches:false});
 w.__modules={Engine,Clock:UIClock,positionAt,renderTrack,renderPlot,plotPointClient,pointerToPlot,TRACK,PLOT,minimumLabelFont,createStorageDriver:options=>createStorageDriver({...options,storage,locks:noLocks?null:locks})};
 w.eval(`const {Engine,Clock,positionAt,renderTrack,renderPlot,plotPointClient,pointerToPlot,TRACK,PLOT,minimumLabelFont,createStorageDriver}=window.__modules;\n${source}`);delete w.__modules;
 const click=id=>$(id).click();
 const input=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
 const change=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('change',{bubbles:true}));};
 const submit=id=>$(id).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const pointer=(id,type,values={})=>{const e=new w.Event(type,{bubbles:true,cancelable:true});for(const[k,v]of Object.entries({pointerId:1,isPrimary:true,button:0,clientX:140,clientY:310,...values}))Object.defineProperty(e,k,{value:v});$(id).dispatchEvent(e);};
 const choose=t=>$('time-selector').querySelector(`[data-time="${t}"]`).click();
 async function settle(){await tick();await tick();assert.deepEqual(errors,[]);}
 async function collect(){click('begin');for(let t=0;t<9;t++){if(t)click('step');input('reading',String(observed[t]));submit('reading-form');await settle();assert.equal($('records-body').children.length,t+1);}click('to-plot');assert.equal($('plot-panel').hidden,false);}
 async function plots(){for(let t=0;t<9;t++){choose(t);change('plot-value',String(observed[t]));click('plot-place');}click('check-plot');await settle();assert.equal($('link-plot').disabled,false);click('link-plot');await settle();assert.equal($('interpret-panel').hidden,false);}
 async function descriptions(){for(const[i,v]of ['right','still','left'].entries())change(`description-${i}`,v);submit('description-form');await settle();assert.equal($('numeric-form').hidden,false);}
 async function complete(){await collect();await plots();await descriptions();input('distance','8');input('displacement','0');submit('numeric-form');await settle();assert.equal($('completion').hidden,false);}
 const exportData=()=>{click('export');return JSON.parse(downloads.at(-1));};
 const openReset=(id='reset-top')=>{click(id);assert.equal($('reset-dialog').open,true);};
 const stageTwo=()=>{click('reset-next');assert.equal($('reset-stage2').hidden,false);assert.equal($('reset-confirm').disabled,true);};
 const ack=()=>{$('reset-ack').checked=true;$('reset-ack').dispatchEvent(new w.Event('change',{bubbles:true}));};
 const escapeDialog=()=>{const e=new w.Event('cancel',{cancelable:true});$('reset-dialog').dispatchEvent(e);if(!e.defaultPrevented)$('reset-dialog').close();};
 return{w,d,$,map,calls,downloads,errors,click,input,change,submit,pointer,choose,settle,collect,plots,descriptions,complete,exportData,openReset,stageTwo,ack,escapeDialog,close:()=>dom.window.close(),frame(ms){now+=ms;const next=[...frames.values()];frames.clear();next.forEach(fn=>fn(now));},holdLocks(){hold=true;},releaseLocks(){hold=false;while(heldLocks.length)heldLocks.shift()();}};
}

test('actual app collects all nine distinct times including three same-position samples then manually plots and completes',async()=>{
 const h=harness(new Map([['bhcs.frictionEfficiencyDesk.v1','keep']]));try{await h.complete();const saved=JSON.parse(h.map.get(STORAGE_KEY));assert.deepEqual(saved.records.map(r=>r.observedPositionM),observed);assert.deepEqual(saved.records.map(r=>r.tSeconds),[0,1,2,3,4,5,6,7,8]);assert.equal(h.map.get('bhcs.frictionEfficiencyDesk.v1'),'keep');assert.ok(h.$('plot-svg').querySelector('.student-line'));assert.match(h.$('save-status').textContent,/已存此裝置/);
  const r=harness(h.map);try{assert.equal(r.$('completion').hidden,false);assert.equal(r.$('distance').value,'8');assert.equal(r.$('displacement').value,'0');assert.equal(r.$('reset-complete').hidden,false);}finally{r.close();}
 }finally{h.close();}
});
test('wrong reading does not seal; exact equivalent reading does; no future sample or result leakage in exported snapshot',async()=>{
 const h=harness();try{h.click('begin');h.input('reading','1.01');h.submit('reading-form');await h.settle();assert.equal(h.$('records-body').children.length,0);h.input('reading','1.00');h.submit('reading-form');await h.settle();assert.equal(h.$('records-body').children.length,1);h.submit('reading-form');await h.settle();assert.equal(h.$('records-body').children.length,1);
  const data=h.exportData(),serialized=JSON.stringify(data);assert.doesNotMatch(serialized,/"observedPositionM":(?:3|5|4|2)/);assert.doesNotMatch(serialized,/"distanceRaw":"8"|"displacementRaw":"0"/);assert.equal(h.$('plot-panel').hidden,true);assert.equal(h.$('interpret-panel').hidden,true);
 }finally{h.close();}
});
test('numeric input and IME immediately revoke completion; returning old values still requires recheck',async()=>{
 const h=harness();try{await h.complete();const records=JSON.stringify(JSON.parse(h.map.get(STORAGE_KEY)).records);h.$('distance').focus();h.input('distance','9');assert.equal(h.$('completion').hidden,true);h.input('distance','8');assert.equal(h.$('completion').hidden,true);h.submit('numeric-form');await h.settle();assert.equal(h.$('completion').hidden,false);
  h.$('distance').dispatchEvent(new h.w.CompositionEvent('compositionstart',{bubbles:true}));assert.equal(h.$('completion').hidden,true);h.submit('numeric-form');assert.equal(h.$('completion').hidden,true);h.$('distance').dispatchEvent(new h.w.CompositionEvent('compositionend',{bubbles:true,data:'8'}));assert.equal(h.$('completion').hidden,true);h.submit('numeric-form');await h.settle();assert.equal(h.$('completion').hidden,false);assert.equal(JSON.stringify(JSON.parse(h.map.get(STORAGE_KEY)).records),records);
 }finally{h.close();}
});
test('plot changes invalidate line and downstream checks, even after returning same coordinate',async()=>{
 const h=harness();try{await h.complete();const rawRecords=JSON.stringify(JSON.parse(h.map.get(STORAGE_KEY)).records);h.choose(0);h.change('plot-value','2');h.click('plot-place');assert.equal(h.$('completion').hidden,true);assert.equal(h.$('interpret-panel').hidden,true);assert.equal(h.$('plot-svg').querySelector('.student-line'),null);h.change('plot-value','1');h.click('plot-place');assert.equal(h.$('link-plot').disabled,true);await h.settle();assert.equal(JSON.stringify(JSON.parse(h.map.get(STORAGE_KEY)).records),rawRecords);
  h.click('check-plot');h.click('link-plot');await h.settle();assert.equal(h.$('numeric-form').hidden,true);h.submit('description-form');await h.settle();assert.equal(h.$('numeric-form').hidden,false);assert.equal(h.$('completion').hidden,true);
 }finally{h.close();}
});
test('changing description immediately hides downstream numeric and completion without changing evidence',async()=>{
 const h=harness();try{await h.complete();h.change('description-1','left');assert.equal(h.$('completion').hidden,true);assert.equal(h.$('numeric-form').hidden,true);h.change('description-1','still');assert.equal(h.$('numeric-form').hidden,true);h.submit('description-form');await h.settle();assert.equal(h.$('numeric-form').hidden,false);assert.equal(h.$('completion').hidden,true);}finally{h.close();}
});
test('both reset launchers, both stages, cancellation and Escape keep exact bytes and restore launcher focus',async()=>{
 const h=harness();try{await h.complete();h.input('reflection','回到原點不代表路程為零。');await h.settle();for(const launcher of ['reset-top','reset-complete'])for(const second of [false,true])for(const escape of [false,true]){const raw=h.map.get(STORAGE_KEY),writes=h.calls.filter(([k])=>k==='set'||k==='remove').length;h.openReset(launcher);if(second)h.stageTwo();if(escape)h.escapeDialog();else h.click('reset-cancel');assert.equal(h.$('reset-dialog').open,false);assert.equal(h.d.activeElement.id,launcher);assert.equal(h.map.get(STORAGE_KEY),raw);assert.equal(h.calls.filter(([k])=>k==='set'||k==='remove').length,writes);assert.equal(h.$('completion').hidden,false);}}finally{h.close();}
});
test('acknowledged reset clears only own key; reload and second complete run do not resurrect old answers',async()=>{
 const h=harness(new Map([['bhcs.inclineDesk.v1','keep']]));try{await h.complete();h.input('reflection','old reflection');await h.settle();h.openReset('reset-complete');h.stageTwo();h.click('reset-confirm');assert.ok(h.map.get(STORAGE_KEY));h.ack();h.click('reset-confirm');await h.settle();assert.equal(h.map.has(STORAGE_KEY),false);assert.equal(h.map.get('bhcs.inclineDesk.v1'),'keep');assert.equal(h.$('welcome').hidden,false);assert.equal(h.d.activeElement.id,'begin');assert.equal(h.$('completion').hidden,true);assert.equal(h.$('reflection').value,'');
  const r=harness(h.map);try{assert.equal(r.$('welcome').hidden,false);assert.equal(r.$('records-body').children.length,0);}finally{r.close();}await h.complete();assert.equal(JSON.parse(h.map.get(STORAGE_KEY)).reflection,'');
 }finally{h.close();}
});
test('quarantined raw backup in reset preserves exact original bytes and is separate from current-page export',async()=>{
 const raw=' {"schemaVersion":99,"preserve":"原文"}\n',h=harness(new Map([[STORAGE_KEY,raw]]));try{assert.equal(h.$('raw-backup').hidden,false);h.click('raw-backup');assert.equal(h.downloads.at(-1),raw);h.openReset();assert.equal(h.$('reset-raw').hidden,false);assert.match(h.$('reset-raw-note').textContent,/不等於/);h.click('reset-raw');assert.equal(h.downloads.at(-1),raw);h.click('reset-export');assert.notEqual(h.downloads.at(-1),raw);assert.doesNotThrow(()=>JSON.parse(h.downloads.at(-1)));h.click('reset-cancel');assert.equal(h.map.get(STORAGE_KEY),raw);}finally{h.close();}
});
test('pending current revision never inherits previous saved status',async()=>{
 const h=harness();try{h.click('begin');h.input('reading','1');h.submit('reading-form');await h.settle();assert.match(h.$('save-status').textContent,/已存此裝置/);h.click('step');h.holdLocks();h.input('reading','3');h.submit('reading-form');await h.settle();assert.match(h.$('save-status').textContent,/正在儲存/);assert.equal(JSON.parse(h.map.get(STORAGE_KEY)).records.length,1);h.releaseLocks();await h.settle();assert.equal(JSON.parse(h.map.get(STORAGE_KEY)).records.length,2);assert.match(h.$('save-status').textContent,/已存此裝置/);}finally{h.close();}
});
test('failed clear keeps dialog and current state until explicit successful retry',async()=>{
 const failures={},h=harness(new Map(),{failures});try{await h.complete();const raw=h.map.get(STORAGE_KEY);failures.clear=true;h.openReset();h.stageTwo();h.ack();h.click('reset-confirm');await h.settle();assert.equal(h.$('reset-dialog').open,true);assert.equal(h.map.get(STORAGE_KEY),raw);assert.equal(h.$('completion').hidden,false);failures.clear=false;h.click('reset-confirm');await h.settle();assert.equal(h.$('reset-dialog').open,false);assert.equal(h.$('welcome').hidden,false);}finally{h.close();}
});
test('full replay never changes records or saved bytes; reset cancellation leaves observation paused',async()=>{
 const h=harness();try{await h.complete();const raw=h.map.get(STORAGE_KEY);h.click('replay-all');h.frame(0);h.frame(200);assert.match(h.$('clock-label').textContent,/回放/);h.click('pause');const t=h.$('clock-time').textContent;h.frame(5000);assert.equal(h.$('clock-time').textContent,t);h.openReset();h.click('reset-cancel');assert.equal(h.map.get(STORAGE_KEY),raw);assert.equal(h.$('completion').hidden,false);h.frame(5000);assert.equal(h.map.get(STORAGE_KEY),raw);}finally{h.close();}
});
test('observation clock pauses without catching up hidden wall time and resume anchors first frame',async()=>{
 const h=harness();try{h.click('begin');h.input('reading','1');h.submit('reading-form');await h.settle();const raw=h.map.get(STORAGE_KEY);h.click('play');h.frame(0);h.frame(200);assert.equal(h.$('clock-time').textContent,'0.20');h.w.dispatchEvent(new h.w.Event('blur'));h.frame(5000);assert.equal(h.$('clock-time').textContent,'0.20');assert.equal(h.map.get(STORAGE_KEY),raw);h.click('play');h.frame(5000);assert.equal(h.$('clock-time').textContent,'0.20');h.frame(200);assert.equal(h.$('clock-time').textContent,'0.40');h.frame(1000);assert.equal(h.$('clock-time').textContent,'0.40');assert.match(h.$('observation-status').textContent,/已暫停/);h.click('step');assert.equal(h.$('clock-time').textContent,'1.00');h.click('step');assert.equal(h.$('clock-time').textContent,'1.00');assert.equal(h.$('records-body').children.length,1);}finally{h.close();}
});
test('plot drag previews only; cancellation keeps bytes, valid up commits once and late lost capture cannot undo',async()=>{
 const h=harness();try{await h.collect();h.choose(0);h.change('plot-value','1');h.click('plot-place');await h.settle();const raw=h.map.get(STORAGE_KEY);
  h.pointer('plot-handle','pointerdown',{clientX:80,clientY:310});h.pointer('plot-handle','pointermove',{clientX:80,clientY:260});assert.equal(h.$('plot-handle').classList.contains('is-dragging'),true);assert.equal(h.map.get(STORAGE_KEY),raw);h.pointer('plot-handle','pointercancel');assert.equal(h.$('plot-handle').classList.contains('is-dragging'),false);assert.match(h.$('plot-handle').getAttribute('aria-label'),/位置 1 公尺/);assert.equal(h.map.get(STORAGE_KEY),raw);
  h.pointer('plot-handle','pointerdown',{clientX:80,clientY:310});h.pointer('plot-handle','pointermove',{clientX:80,clientY:260});h.pointer('plot-handle','pointerup',{clientX:80,clientY:260});await h.settle();const changed=h.map.get(STORAGE_KEY);assert.equal(JSON.parse(changed).plot.slots[0].positionM,2);h.pointer('plot-handle','lostpointercapture');await h.settle();assert.equal(h.map.get(STORAGE_KEY),changed);
  h.pointer('plot-handle','pointerdown',{clientX:80,clientY:260});h.pointer('plot-handle','pointermove',{clientX:80,clientY:210});h.pointer('plot-handle','pointerup',{clientX:800,clientY:210});await h.settle();assert.equal(h.map.get(STORAGE_KEY),changed);
 }finally{h.close();}
});
test('direct graph tap chooses selected time only; midpoint ties upward, out-of-frame or canceled tap does not submit',async()=>{
 const h=harness();try{await h.collect();h.choose(4);h.pointer('plot-svg','pointerdown',{clientX:350,clientY:235});h.pointer('plot-svg','pointerup',{clientX:350,clientY:235});await h.settle();let raw=h.map.get(STORAGE_KEY);assert.equal(JSON.parse(raw).plot.slots[4].positionM,3);
  h.pointer('plot-svg','pointerdown',{clientX:350,clientY:210});h.pointer('plot-svg','pointercancel');h.pointer('plot-svg','pointerup',{clientX:350,clientY:210});await h.settle();assert.equal(h.map.get(STORAGE_KEY),raw);
  h.pointer('plot-svg','pointerdown',{clientX:800,clientY:210});h.pointer('plot-svg','pointerup',{clientX:800,clientY:210});await h.settle();assert.equal(h.map.get(STORAGE_KEY),raw);
 }finally{h.close();}
});
test('opening reset after successful clear resets dialog return value so Escape restores new launcher',async()=>{
 const h=harness();try{h.click('begin');h.input('reading','1');h.submit('reading-form');await h.settle();h.openReset();h.stageTwo();h.ack();h.click('reset-confirm');await h.settle();h.openReset();h.escapeDialog();assert.equal(h.$('reset-dialog').open,false);assert.equal(h.d.activeElement.id,'reset-top');}finally{h.close();}
});
test('switching away and back cancels pending graph tap rather than resurrecting old transaction',async()=>{
 const h=harness();try{await h.collect();h.choose(0);const raw=h.map.get(STORAGE_KEY);h.pointer('plot-svg','pointerdown',{clientX:70,clientY:310});h.choose(1);h.choose(0);h.pointer('plot-svg','pointerup',{clientX:70,clientY:310});await h.settle();assert.equal(h.map.get(STORAGE_KEY),raw);}finally{h.close();}
});
test('external storage change immediately revokes saved label and stale page cannot overwrite reset',async()=>{
 const h=harness();try{h.click('begin');h.input('reading','1');h.submit('reading-form');await h.settle();assert.match(h.$('save-status').textContent,/已存此裝置/);const old=h.map.get(STORAGE_KEY);h.map.delete(STORAGE_KEY);
  const event=new h.w.Event('storage');Object.defineProperties(event,{key:{value:STORAGE_KEY},oldValue:{value:old},newValue:{value:null}});h.w.dispatchEvent(event);assert.doesNotMatch(h.$('save-status').textContent,/已存此裝置/);assert.match(h.$('save-status').textContent,/其他分頁|停止寫入|改動/);assert.equal(h.$('records-body').children.length,1);h.click('retry-save');await h.settle();assert.equal(h.map.has(STORAGE_KEY),false);
 }finally{h.close();}
});
test('full real snapshot with 100 retained checks and 500 Chinese reflection remains under 128 KiB and saves',async()=>{
 const h=harness();try{await h.complete();for(let i=0;i<105;i++)h.submit('numeric-form');h.input('reflection','車'.repeat(500));await h.settle();const raw=h.map.get(STORAGE_KEY),s=JSON.parse(raw);assert.equal(s.interpretation.history.length,100);assert.equal(s.reflection.length,500);assert.ok(new TextEncoder().encode(raw).byteLength<=128*1024);assert.match(h.$('save-status').textContent,/已存此裝置/);assert.equal(h.$('completion').hidden,false);}finally{h.close();}
});
test('no Web Locks permits local-only learning but cannot clear pre-existing persistent raw',async()=>{
 const h=harness(new Map(),{noLocks:true});try{await h.collect();assert.equal(h.map.has(STORAGE_KEY),false);assert.doesNotMatch(h.$('save-status').textContent,/已存此裝置/);h.openReset();h.stageTwo();h.ack();h.click('reset-confirm');await h.settle();assert.equal(h.$('welcome').hidden,false);}finally{h.close();}
 const seed=harness();try{seed.click('begin');seed.input('reading','1');seed.submit('reading-form');await seed.settle();const raw=seed.map.get(STORAGE_KEY),restored=harness(seed.map,{noLocks:true});try{restored.openReset();restored.stageTwo();restored.ack();restored.click('reset-confirm');await restored.settle();assert.equal(restored.$('reset-dialog').open,true);assert.equal(restored.map.get(STORAGE_KEY),raw);assert.equal(restored.$('records-body').children.length,1);assert.doesNotMatch(restored.$('save-status').textContent,/已存此裝置/);}finally{restored.close();}}finally{seed.close();}
});
test('native position select arrows are not intercepted; explicit candidate can be nudged by button arrows',async()=>{
 const h=harness();try{await h.collect();h.choose(0);assert.equal(h.$('plot-value').value,'');assert.equal(h.$('plot-up').disabled,true);assert.equal(h.$('plot-down').disabled,true);
  const initialArrow=new h.w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true});h.$('plot-value').dispatchEvent(initialArrow);assert.equal(initialArrow.defaultPrevented,false,'Native select must retain its keyboard choice behavior when unset');assert.equal(h.$('plot-value').value,'','Synthetic key event does not emulate native selection or auto-create a candidate');
  h.change('plot-value','3');const selectedArrow=new h.w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true});h.$('plot-value').dispatchEvent(selectedArrow);assert.equal(selectedArrow.defaultPrevented,false,'Native select arrows remain available after a value has been chosen');assert.equal(h.$('plot-value').value,'3');
  const up=new h.w.KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true,cancelable:true});h.$('plot-up').dispatchEvent(up);assert.equal(up.defaultPrevented,true);assert.equal(h.$('plot-value').value,'4');
  const down=new h.w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true});h.$('plot-down').dispatchEvent(down);assert.equal(down.defaultPrevented,true);assert.equal(h.$('plot-value').value,'3');
  assert.equal(JSON.parse(h.map.get(STORAGE_KEY)).plot.slots[0],null,'Candidate changes are not committed graph points');h.click('plot-place');await h.settle();assert.equal(JSON.parse(h.map.get(STORAGE_KEY)).plot.slots[0].positionM,3);
 }finally{h.close();}
});
test('normal saved raw does not show quarantine warning; quarantined raw shows separate backup warning',async()=>{
 const h=harness();try{h.click('begin');h.input('reading','1');h.submit('reading-form');await h.settle();h.openReset();assert.equal(h.$('reset-raw').hidden,false,'Normal saved raw remains available for backup');assert.equal(h.$('reset-raw-note').hidden,true,'Valid normal data must not be labelled protected invalid data');h.click('reset-cancel');}finally{h.close();}
 const raw='{"schemaVersion":999,"keep":"原始資料"}',q=harness(new Map([[STORAGE_KEY,raw]]));try{q.openReset();assert.equal(q.$('reset-raw').hidden,false);assert.equal(q.$('reset-raw-note').hidden,false);assert.match(q.$('reset-raw-note').textContent,/不等於|原始/);q.click('reset-raw');assert.equal(q.downloads.at(-1),raw);q.click('reset-cancel');assert.equal(q.map.get(STORAGE_KEY),raw);}finally{q.close();}
});
