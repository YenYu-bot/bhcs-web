// Actual application DOM contracts. Synthetic dispatched events and mocked
// geometry/clock platform are not native browser, touch or visual certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from './accepted-file-reader.mjs';
import {createRequire} from 'node:module';
import {CourseEngine} from '../../tools/motion-graphs-desk/v2/engine.mjs';
import {Clock} from '../../tools/motion-graphs-desk/clock.mjs';
import {CASE_IDS,CASE_LABELS,QUESTION_IDS,QUESTION_DEFS,derive} from '../../tools/motion-graphs-desk/v2/model.mjs';
import {renderTrack,renderGraph,TRACK,GRAPH,graphPointClient,pointerToGraph,minimumLabelFont} from '../../tools/motion-graphs-desk/v2/geometry.mjs';
import {createStorageDriver,STORAGE_KEY} from '../../tools/motion-graphs-desk/v2/storage.mjs';
import {LESSON_COPY} from '../../tools/motion-graphs-desk/v2/lesson-copy.mjs';
const require=createRequire(import.meta.url),{JSDOM,VirtualConsole}=require('jsdom');
const html=await readFile(new URL('../../tools/motion-graphs-desk/v2/index.html',import.meta.url),'utf8');
const source=(await readFile(new URL('../../tools/motion-graphs-desk/v2/app.mjs',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
// Handwritten numerical/semantic answers from the reviewed specification. Never
// evaluateQuestion(), derive(), hidden app state, or a runtime answer generator.
const ANSWERS={
 'A1.R':{tA:0,tB:4,deltaXRaw:'0',deltaTRaw:'4',velocityRaw:'0',motionChoice:'horizontal'},
 'A1.Uplus':{tA:1,tB:3,deltaXRaw:'4',deltaTRaw:'2',velocityRaw:'2',motionChoice:'rising'},
 'A1.Uminus':{tA:0,tB:4,deltaXRaw:'-8',deltaTRaw:'4',velocityRaw:'-2',motionChoice:'falling'},
 'A1.intercept':{canUseXOverT:'no',tInitial:0,xInitialRaw:'1',tFinal:2,xFinalRaw:'5'},
 'A2.match':{rTA:0,rTB:4,rGraph:'zero',plusTA:0,plusTB:4,plusGraph:'positive',minusTA:0,minusTB:4,minusGraph:'negative'},
 'A2.zero':{stationaryCases:['R'],reason:'speed-zero',rTA:0,rTB:4},
 'B.first.Aminus':{tA:0,tB:1,tC:2,deltaV1Raw:'-2',deltaT1Raw:'1',deltaV2Raw:'-2',deltaT2Raw:'1',accelerationRaw:'-2',direction:'right',trend:'slower'},
 'B.first.Aplus':{tA:0,tB:1,tC:2,deltaV1Raw:'2',deltaT1Raw:'1',deltaV2Raw:'2',deltaT2Raw:'1',accelerationRaw:'2',direction:'left',trend:'slower'},
 'B.signGrid':{ppCase:'Aplus',ppT:3,ppDirection:'right',ppTrend:'faster',ppXtSlope:'positive',ppXtSteepness:'growing',pnCase:'Aminus',pnT:1,pnDirection:'right',pnTrend:'slower',pnXtSlope:'positive',pnXtSteepness:'shrinking',npCase:'Aplus',npT:1,npDirection:'left',npTrend:'slower',npXtSlope:'negative',npXtSteepness:'shrinking',nnCase:'Aminus',nnT:3,nnDirection:'left',nnTrend:'faster',nnXtSlope:'negative',nnXtSteepness:'growing'},
 'C.reverse.Aminus':{tBefore:1,tZero:2,tAfter:3,beforeSign:'positive',zeroSign:'zero',afterSign:'negative',turnTimeRaw:'2',extremum:'maximum'},
 'C.reverse.Aplus':{tBefore:1,tZero:2,tAfter:3,beforeSign:'negative',zeroSign:'zero',afterSign:'positive',turnTimeRaw:'2',extremum:'minimum'},
 'C.zeroInstant':{caseId:'Aminus',tBefore:1,tZero:2,tAfter:3,zeroInstant:'yes',wholeIntervalStill:'no',comparisonCase:'R'},
 'C.truncated':{caseId:'Aminus',windowStart:0,windowEnd:2,returnObserved:'no',reason:'only-reached-zero'},
 'C.negativeUniform':{caseId:'Uminus',tA:0,tB:4,turning:'no',reason:'velocity-keeps-negative'},
 'D.rectangle.Uplus':{tA:0,tB:4,baseRaw:'4',heightMagnitudeRaw:'2',areaMagnitudeRaw:'8',signedDisplacementRaw:'8'},
 'D.rectangle.Uminus':{tA:0,tB:4,baseRaw:'4',heightMagnitudeRaw:'2',areaMagnitudeRaw:'8',signedDisplacementRaw:'-8'},
 'D.triangle.Aminus':{firstStart:0,firstEnd:2,secondStart:2,secondEnd:4,base1Raw:'2',height1Raw:'4',area1Raw:'4',sign1:'positive',base2Raw:'2',height2Raw:'4',area2Raw:'4',sign2:'negative',displacementRaw:'0',pathRaw:'8',startT:0,endT:4,startPositionRaw:'1',endPositionRaw:'1'},
 'D.triangle.Aplus':{firstStart:0,firstEnd:2,secondStart:2,secondEnd:4,base1Raw:'2',height1Raw:'4',area1Raw:'4',sign1:'negative',base2Raw:'2',height2Raw:'4',area2Raw:'4',sign2:'positive',displacementRaw:'0',pathRaw:'8',startT:0,endT:4,startPositionRaw:'1',endPositionRaw:'1'},
 'D.compare':{zeroDisplacementCases:['R','Aminus','Aplus'],zeroPathCases:['R'],turningCases:['Aminus','Aplus']}
};
function harness(initial=new Map(),{noLocks=false,failures={}}={}){
 const errors=[],downloads=[],calls=[],map=new Map(initial),held=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(html,{url:'https://qa.example.test/v2/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document,$=id=>d.getElementById(id);
 const storage={getItem(k){calls.push(['get',k]);if(failures.read)throw Error('read denied');return map.get(k)??null;},setItem(k,v){calls.push(['set',k,v]);if(failures.write)throw Error('quota');map.set(k,v);},removeItem(k){calls.push(['remove',k]);if(failures.clear)throw Error('remove denied');map.delete(k);}};
 let hold=false;const locks={request(name,opts,fn){return new Promise((resolve,reject)=>{const run=()=>{try{resolve(fn());}catch(e){reject(e);}};if(hold)held.push(run);else run();});}};
 const rect={x:0,y:0,left:0,top:0,width:GRAPH.width,height:GRAPH.height,right:GRAPH.width,bottom:GRAPH.height};
 w.HTMLElement.prototype.getBoundingClientRect=function(){return rect;};w.SVGElement.prototype.getBoundingClientRect=function(){return this.closest('#track')?{...rect,width:TRACK.width,right:TRACK.width,height:TRACK.height,bottom:TRACK.height}:rect;};w.HTMLElement.prototype.getClientRects=function(){return this.closest('[hidden]')?[]:[rect];};w.HTMLElement.prototype.scrollIntoView=function(){};
 const captures=new WeakMap();w.HTMLElement.prototype.setPointerCapture=function(id){captures.set(this,id);};w.HTMLElement.prototype.hasPointerCapture=function(id){return captures.get(this)===id;};w.HTMLElement.prototype.releasePointerCapture=function(id){if(captures.get(this)===id)captures.delete(this);};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(value){if(value!==undefined)this.returnValue=value;this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 $('reset-dialog').querySelector('form').addEventListener('submit',e=>{if(e.target.method==='dialog'){e.preventDefault();$('reset-dialog').close(e.submitter?.value??'');}});
 w.Blob=class{constructor(parts){this.parts=parts;}};w.URL.createObjectURL=blob=>{if(failures.download)throw Error('download denied');downloads.push(blob.parts.join(''));return `blob:qa-${downloads.length}`;};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};w.setTimeout=fn=>{queueMicrotask(fn);return 1;};
 let now=0,rafId=0;const frames=new Map();class UIClock extends Clock{constructor(opts){super({...opts,now:()=>now,requestFrame:fn=>{frames.set(++rafId,fn);return rafId;},cancelFrame:id=>frames.delete(id)});}}
 w.__modules={CourseEngine,Clock:UIClock,CASE_IDS,CASE_LABELS,QUESTION_IDS,QUESTION_DEFS,derive,renderTrack,renderGraph,TRACK,GRAPH,graphPointClient,pointerToGraph,minimumLabelFont,LESSON_COPY,createStorageDriver:opts=>createStorageDriver({...opts,storage,locks:noLocks?null:locks})};
 w.eval(`const {CourseEngine,Clock,CASE_IDS,CASE_LABELS,QUESTION_IDS,QUESTION_DEFS,derive,renderTrack,renderGraph,TRACK,GRAPH,graphPointClient,pointerToGraph,minimumLabelFont,LESSON_COPY,createStorageDriver}=window.__modules;\n${source}`);delete w.__modules;
 const click=id=>$(id).click();const change=(id,value)=>{$(id).value=String(value);$(id).dispatchEvent(new w.Event('change',{bubbles:true}));};const input=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
 const question=id=>change('question-select',id),caseSelect=id=>$('case-tabs').querySelector(`[data-case="${id}"]`).click();
 const pointer=(id,type,values={})=>{const e=new w.Event(type,{bubbles:true,cancelable:true});for(const[k,v]of Object.entries({pointerId:1,isPrimary:true,button:0,clientX:80,clientY:260,...values}))Object.defineProperty(e,k,{value:v});$(id).dispatchEvent(e);};
 const submit=()=> $('answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 function field(path,value){const nodes=[...$('answer-fields').querySelectorAll(`[data-field="${path}"]`)];assert.ok(nodes.length,`Missing field ${path}`);if(Array.isArray(value)){for(const el of nodes){const check=value.map(String).includes(el.value);if(el.checked!==check){el.checked=check;el.dispatchEvent(new w.Event('change',{bubbles:true}));}}}else{const el=nodes[0];assert.equal(el.disabled,false,`Disabled field ${path} in ${$('question-select').value}`);el.value=String(value);el.dispatchEvent(new w.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));}}
 async function settle(){await tick();await tick();assert.deepEqual(errors,[]);}
 async function observe(id,end=4){caseSelect(id);if(!$('start').hidden)click('start');while(Number($('clock').textContent)<end){assert.equal($('step').disabled,false,`Cannot observe ${id} to ${end}`);click('step');}await settle();assert.equal($('sample-body').children.length,end+1);}
 async function answer(id,response=ANSWERS[id]){question(id);for(const[path,value]of Object.entries(response))field(path,value);submit();await settle();assert.match($('question-status').textContent,/核對通過/,`Question ${id} failed: ${$('answer-feedback').textContent}`);}
 async function foundation(){for(const id of ['R','Uplus','Uminus'])await observe(id);for(const id of ['A1.R','A1.Uplus','A1.Uminus','A1.intercept','A2.match','A2.zero'])await answer(id);}
 async function complete(){await foundation();for(const id of ['Aminus','Aplus'])await observe(id,2);for(const id of ['B.first.Aminus','B.first.Aplus'])await answer(id);const before=JSON.parse(map.get(STORAGE_KEY));for(const id of ['Aminus','Aplus'])await observe(id,4);for(const id of ['B.first.Aminus','B.first.Aplus'])assert.deepEqual(JSON.parse(map.get(STORAGE_KEY)).answers[id].currentCheck,before.answers[id].currentCheck,'Appending later samples must not invalidate B.first');for(const id of QUESTION_IDS.slice(8))await answer(id);assert.equal($('completion').hidden,false);}
 const exportData=()=>{click('export');return JSON.parse(downloads.at(-1));};const openReset=(id='reset-top')=>{click(id);assert.equal($('reset-dialog').open,true);};const stageTwo=()=>{click('reset-next');assert.equal($('reset-stage2').hidden,false);assert.equal($('reset-confirm').disabled,true);};const ack=()=>{$('reset-ack').checked=true;$('reset-ack').dispatchEvent(new w.Event('change',{bubbles:true}));};const escapeDialog=()=>{const e=new w.Event('cancel',{cancelable:true});$('reset-dialog').dispatchEvent(e);if(!e.defaultPrevented)$('reset-dialog').close();};
 return{w,d,$,map,calls,downloads,errors,click,change,input,question,caseSelect,field,pointer,submit,settle,observe,answer,foundation,complete,exportData,openReset,stageTwo,ack,escapeDialog,close:()=>dom.window.close(),holdLocks(){hold=true;},releaseLocks(){hold=false;while(held.length)held.shift()();},frame(ms){now+=ms;const next=[...frames.values()];frames.clear();next.forEach(fn=>fn(now));}};
}
let completedRaw;
async function completedFixture(){if(completedRaw)return completedRaw;const h=harness(new Map([['bhcs.motionPositionDesk.v1','accepted-v1-data']]));try{await h.complete();completedRaw=h.map.get(STORAGE_KEY);assert.equal(h.map.get('bhcs.motionPositionDesk.v1'),'accepted-v1-data');return completedRaw;}finally{h.close();}}

test('actual UI completes all 19 questions from five observed cases, including sign grid and signed areas',async()=>{
 const raw=await completedFixture(),s=JSON.parse(raw);assert.equal(Object.keys(ANSWERS).length,19);assert.equal(Object.values(s.cases).reduce((n,c)=>n+c.samples.length,0),25);assert.equal(s.certificates.length,4);assert.equal(Object.values(s.answers).filter(a=>a.currentCheck?.passed).length,19);
 const h=harness(new Map([[STORAGE_KEY,raw]]));try{assert.equal(h.$('completion').hidden,false);assert.match(h.$('save-status').textContent,/已存此裝置/);assert.equal(h.$('progress-count').textContent,'19 / 19');}finally{h.close();}
});
test('initial and A1 observations do not expose velocity, acceleration, future observations or derived correct answers',async()=>{
 const h=harness();try{assert.equal(h.$('show-vt').disabled,true);assert.equal(h.$('velocity-header').hidden,true);assert.equal(h.$('sample-body').children.length,0);assert.equal(h.$('cursor-reading').textContent,'尚未觀測');h.click('start');h.click('step');await h.settle();assert.equal(h.$('sample-body').children.length,2);for(const row of h.$('sample-body').children)assert.equal(row.children.length,2);assert.doesNotMatch(h.$('cursor-reading').textContent,/速度/);const data=h.exportData();const text=JSON.stringify(data);assert.doesNotMatch(text,/"v0"\s*:|"a"\s*:|"acceleration"\s*:/);assert.doesNotMatch(text,/"t"\s*:\s*[234](?:,|})/);assert.equal(h.$('show-vt').disabled,true);}finally{h.close();}
});
test('upstream answer change and change-back retain certificates and samples but revoke current completion',async()=>{
 const original=await completedFixture(),h=harness(new Map([[STORAGE_KEY,original]]));try{const s=JSON.parse(original);h.question('A1.Uplus');h.field('velocityRaw','3');await h.settle();let changed=JSON.parse(h.map.get(STORAGE_KEY));assert.equal(h.$('completion').hidden,true);assert.deepEqual(changed.certificates,s.certificates);assert.deepEqual(changed.cases,s.cases);assert.equal(changed.answers['D.compare'].currentCheck,null);h.field('velocityRaw','2');await h.settle();assert.equal(h.$('completion').hidden,true);assert.equal(JSON.parse(h.map.get(STORAGE_KEY)).answers['A1.Uplus'].currentCheck,null);h.click('show-vt');assert.equal(h.$('show-vt').disabled,false);for(const id of QUESTION_IDS.slice(1))await h.answer(id);assert.equal(h.$('completion').hidden,false);}finally{h.close();}
});
test('C.truncated clips visible table and cursor to two seconds without deleting full evidence',async()=>{
 const original=await completedFixture(),h=harness(new Map([[STORAGE_KEY,original]]));try{h.question('C.truncated');assert.equal(h.$('sample-body').children.length,3);assert.ok([...h.$('cursor-time').options].every(o=>Number(o.value)<=2));assert.equal(h.$('play').disabled,true);assert.equal(h.$('step').disabled,true);assert.equal(h.$('replay').disabled,true);assert.ok(Number(h.$('clock').textContent)<=2);assert.ok(h.$('graph-svg').querySelector('.observed-curve').getAttribute('points').split(' ').every(pair=>Number(pair.split(',')[0])<=375),'Displayed curve must stop at t=2, not merely hide the table');assert.equal(h.map.get(STORAGE_KEY),original);h.question('C.reverse.Aminus');assert.equal(h.$('sample-body').children.length,5);assert.ok([...h.$('cursor-time').options].some(o=>Number(o.value)===4));assert.equal(h.map.get(STORAGE_KEY),original);}finally{h.close();}
});
test('both reset launchers and two stages cancel/Escape preserve v1 and v2 raw and focus',async()=>{
 const raw=await completedFixture(),h=harness(new Map([[STORAGE_KEY,raw],['bhcs.motionPositionDesk.v1','accepted-v1-data']]));try{for(const launcher of ['reset-top','reset-complete'])for(const second of [false,true])for(const escape of [false,true]){h.openReset(launcher);if(second)h.stageTwo();if(escape)h.escapeDialog();else h.click('reset-cancel');assert.equal(h.$('reset-dialog').open,false);assert.equal(h.d.activeElement.id,launcher);assert.equal(h.map.get(STORAGE_KEY),raw);assert.equal(h.map.get('bhcs.motionPositionDesk.v1'),'accepted-v1-data');assert.equal(h.$('completion').hidden,false);}}finally{h.close();}
});
test('final acknowledged advanced reset preserves accepted v1 data; fresh course/reload have no old certificates',async()=>{
 const raw=await completedFixture(),h=harness(new Map([[STORAGE_KEY,raw],['bhcs.motionPositionDesk.v1','accepted-v1-data']]));try{h.openReset('reset-complete');h.stageTwo();h.click('reset-confirm');assert.equal(h.map.get(STORAGE_KEY),raw);h.ack();h.click('reset-confirm');await h.settle();assert.equal(h.map.has(STORAGE_KEY),false);assert.equal(h.map.get('bhcs.motionPositionDesk.v1'),'accepted-v1-data');assert.equal(h.$('completion').hidden,true);assert.equal(h.$('progress-count').textContent,'0 / 19');assert.equal(h.d.activeElement.id,'start');const r=harness(h.map);try{assert.equal(r.$('completion').hidden,true);assert.equal(r.$('sample-body').children.length,0);}finally{r.close();}await h.observe('R');const fresh=JSON.parse(h.map.get(STORAGE_KEY));assert.notEqual(fresh.courseRunId,JSON.parse(raw).courseRunId);assert.deepEqual(fresh.certificates,[]);assert.equal(Object.values(fresh.answers).filter(a=>a.currentCheck).length,0);}finally{h.close();}
});
test('raw backup is byte exact and distinct from current course export for quarantined data',async()=>{
 const raw=' {"schemaVersion":99,"retain":"進階原文"}\n',h=harness(new Map([[STORAGE_KEY,raw]]));try{h.openReset();assert.equal(h.$('reset-raw').hidden,false);assert.equal(h.$('raw-note').hidden,false);h.click('reset-raw');assert.equal(h.downloads.at(-1),raw);h.click('reset-export');assert.notEqual(h.downloads.at(-1),raw);assert.doesNotThrow(()=>JSON.parse(h.downloads.at(-1)));h.click('reset-cancel');assert.equal(h.map.get(STORAGE_KEY),raw);}finally{h.close();}
});
test('current pending sample never inherits old saved state; external reset stops stale page writes',async()=>{
 const h=harness();try{h.click('start');await h.settle();assert.match(h.$('save-status').textContent,/已存此裝置/);h.holdLocks();h.click('step');await h.settle();assert.match(h.$('save-status').textContent,/正在儲存/);assert.equal(JSON.parse(h.map.get(STORAGE_KEY)).cases.R.samples.length,1);h.releaseLocks();await h.settle();assert.equal(JSON.parse(h.map.get(STORAGE_KEY)).cases.R.samples.length,2);h.map.delete(STORAGE_KEY);const e=new h.w.Event('storage');Object.defineProperties(e,{key:{value:STORAGE_KEY},newValue:{value:null}});h.w.dispatchEvent(e);assert.doesNotMatch(h.$('save-status').textContent,/已存此裝置/);h.click('retry-save');await h.settle();assert.equal(h.map.has(STORAGE_KEY),false);}finally{h.close();}
});
test('replay uses already obtained course evidence without writing or adding observations',async()=>{
 const raw=await completedFixture(),h=harness(new Map([[STORAGE_KEY,raw]]));try{h.caseSelect('Aminus');h.click('replay');h.frame(0);h.frame(200);assert.match(h.$('clock-label').textContent,/回放/);h.click('pause');const t=h.$('clock').textContent;h.frame(5000);assert.equal(h.$('clock').textContent,t);h.click('end-replay');await h.settle();assert.equal(h.map.get(STORAGE_KEY),raw);assert.equal(h.$('sample-body').children.length,5);assert.equal(h.$('completion').hidden,false);}finally{h.close();}
});
test('IME composition immediately invalidates question completion and check cannot pass mid-composition',async()=>{
 const raw=await completedFixture(),h=harness(new Map([[STORAGE_KEY,raw]]));try{h.question('D.triangle.Aplus');const el=h.$('answer-fields').querySelector('[data-field="pathRaw"]');el.focus();el.dispatchEvent(new h.w.CompositionEvent('compositionstart',{bubbles:true}));assert.equal(h.$('completion').hidden,true);h.submit();assert.equal(h.$('completion').hidden,true);el.dispatchEvent(new h.w.CompositionEvent('compositionend',{bubbles:true,data:'8'}));await h.settle();assert.equal(h.$('completion').hidden,true);h.submit();await h.settle();assert.equal(h.$('completion').hidden,true,'D.compare must be rechecked after its ancestor changed');await h.answer('D.compare');assert.equal(h.$('completion').hidden,false);}finally{h.close();}
});
test('graph cursor transaction previews/cancels without editing immutable observations or answers',async()=>{
 const raw=await completedFixture(),h=harness(new Map([[STORAGE_KEY,raw]]));try{h.caseSelect('Aminus');h.click('show-xt');h.change('cursor-time',0);
  h.pointer('cursor-handle','pointerdown',{clientX:88,clientY:260});h.pointer('cursor-handle','pointermove',{clientX:228,clientY:200});assert.equal(h.$('cursor-handle').classList.contains('is-dragging'),true);assert.equal(h.$('cursor-time').value,'1');h.pointer('cursor-handle','pointercancel');assert.equal(h.$('cursor-time').value,'0');assert.equal(h.$('cursor-handle').classList.contains('is-dragging'),false);assert.equal(h.map.get(STORAGE_KEY),raw);
  h.pointer('cursor-handle','pointerdown',{clientX:88,clientY:260});h.pointer('cursor-handle','pointermove',{clientX:228,clientY:200});h.pointer('cursor-handle','pointerup',{clientX:228,clientY:200});assert.equal(h.$('cursor-time').value,'1');h.pointer('cursor-handle','lostpointercapture');assert.equal(h.$('cursor-time').value,'1');assert.equal(h.map.get(STORAGE_KEY),raw);
  h.pointer('cursor-handle','pointerdown',{clientX:228,clientY:200});h.pointer('cursor-handle','pointermove',{clientX:368,clientY:180});h.click('show-vt');h.pointer('cursor-handle','pointerup',{clientX:368,clientY:180});assert.equal(h.$('cursor-time').value,'1');assert.equal(h.map.get(STORAGE_KEY),raw);
 }finally{h.close();}
});
test('v–t selected signed-area regions follow student intervals and do not print computed area in the graph',async()=>{
 const raw=await completedFixture(),h=harness(new Map([[STORAGE_KEY,raw]]));try{h.question('D.triangle.Aminus');h.click('show-vt');const regions=[...h.$('graph-svg').querySelectorAll('.selected-area')];assert.equal(regions.length,2);assert.deepEqual(regions.map(e=>[e.dataset.from,e.dataset.to]),[['0','2'],['2','4']]);assert.ok(regions.every(e=>e.textContent.includes('自行計算')));assert.equal(h.map.get(STORAGE_KEY),raw);}finally{h.close();}
});
test('clear failure preserves complete course and raw, and a later explicit retry alone returns fresh state',async()=>{
 const raw=await completedFixture(),failures={clear:true},h=harness(new Map([[STORAGE_KEY,raw]]),{failures});try{h.openReset();h.stageTwo();h.ack();h.click('reset-confirm');await h.settle();assert.equal(h.$('reset-dialog').open,true);assert.equal(h.$('completion').hidden,false);assert.equal(h.map.get(STORAGE_KEY),raw);failures.clear=false;h.click('reset-confirm');await h.settle();assert.equal(h.$('reset-dialog').open,false);assert.equal(h.map.has(STORAGE_KEY),false);assert.equal(h.$('completion').hidden,true);}finally{h.close();}
});
test('without Web Locks existing advanced raw is read-only and cannot be cleared or mislabeled newly saved',async()=>{
 const raw=await completedFixture(),h=harness(new Map([[STORAGE_KEY,raw],['bhcs.motionPositionDesk.v1','v1']]),{noLocks:true});try{assert.equal(h.$('completion').hidden,false);assert.doesNotMatch(h.$('save-status').textContent,/已存此裝置/);h.openReset();h.stageTwo();h.ack();h.click('reset-confirm');await h.settle();assert.equal(h.$('reset-dialog').open,true);assert.equal(h.map.get(STORAGE_KEY),raw);assert.equal(h.map.get('bhcs.motionPositionDesk.v1'),'v1');}finally{h.close();}
});

test('dedicated replay steps and stale replay clicks never extend partial observed evidence',async()=>{
 const h=harness();try{
  h.click('start');h.click('step');await h.settle();
  const raw=h.map.get(STORAGE_KEY),sampleCount=h.$('sample-body').children.length;
  assert.equal(sampleCount,2);h.click('replay');h.click('pause');
  assert.equal(h.$('replay-step').hidden,false);assert.equal(h.$('step').hidden,true);
  h.click('replay-step');assert.equal(Number(h.$('clock').textContent),1);
  h.click('replay-step');assert.equal(Number(h.$('clock').textContent),1);
  h.click('end-replay');
  // Dispatch queued events directly, even though the old controls are now hidden/disabled.
  h.$('replay-step').dispatchEvent(new h.w.MouseEvent('click',{bubbles:true}));
  h.$('replay-play').dispatchEvent(new h.w.MouseEvent('click',{bubbles:true}));
  h.frame(0);h.frame(1000);h.frame(3000);await h.settle();
  assert.equal(h.$('sample-body').children.length,sampleCount);
  assert.equal(h.map.get(STORAGE_KEY),raw);assert.equal(Number(h.$('clock').textContent),1);
 }finally{h.close();}
});
