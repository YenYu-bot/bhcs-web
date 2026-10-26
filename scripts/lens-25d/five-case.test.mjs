import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createInputController,snapForWidth} from '../../tools/lens-25d/assets/optics-guided/input.js';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
import {CASES,createState,deriveView,dispatchState} from '../../tools/lens-25d/assets/five-case.js';
import {visualParams} from '../../tools/lens-25d/assets/optics-guided/visual.js';
let n=0;const test=(name,fn)=>{fn();n++;console.log('PASS',name)};
const act=(s,type,fields={})=>dispatchState(s,{type,...fields}).state;
const select=id=>act(createState(),'SELECT_CASE',{id});
const search=s=>{for(const position of [8,20,40]){s=act(s,'MOVE_SCREEN',{position});s=act(s,'SETTLE_SCREEN');}return s;};
test('five canonical cases derive physics and classification from model',()=>{
 for(const [id,u,v,m,size,type] of [['outside2f',30,15,-.5,'smaller','real'],['at2f',20,20,-1,'same','real'],['between',15,30,-2,'larger','real'],['focal',10,null,null,'undefined','infinite'],['inside',5,-10,2,'larger','virtual']]){
 const s=select(id),q=deriveView(s);assert.equal(s.u,u);assert.equal(q.caseId,id);assert.equal(q.lensState.theoreticalV,v);assert.equal(q.lensState.magnification,m);assert.equal(q.lensState.imageSize,size);assert.equal(q.lensState.imageType,type);assert.doesNotThrow(()=>visualParams(q));
 }
 assert.equal(CASES.length,5);
});
test('actual 14.5 and29.5 capture, immutable first record and duplicate prevention',()=>{
 let s=act(createState(),'MOVE_SCREEN',{position:14.5});assert(deriveView(s).recordEnabled);s=act(s,'RECORD');const saved=structuredClone(s.records.outside2f),before=s;
 assert.equal(dispatchState(s,{type:'RECORD'}).accepted,false);assert.equal(deriveView(s).recordEnabled,false);
 s=act(s,'SELECT_CASE',{id:'between'});s=act(s,'MOVE_SCREEN',{position:29.5});s=act(s,'RECORD');assert.equal(s.records.between.observedScreenPosition,29.5);assert.deepEqual(s.records.outside2f,saved);assert.deepEqual(before.records.outside2f,saved);assert.equal(before.records.between,null);
 s=act(s,'SELECT_CASE',{id:'outside2f'});s=act(s,'MOVE_SCREEN',{position:14.5});assert.equal(deriveView(s).recordEnabled,false);
});
test('focus capture invalidates when moving away; classification follows actual object',()=>{
 let s=act(createState(),'MOVE_SCREEN',{position:15});assert(deriveView(s).recordEnabled);s=act(s,'MOVE_SCREEN',{position:20});assert(!deriveView(s).recordEnabled);assert(!dispatchState(s,{type:'RECORD'}).accepted);
 s=act(s,'MOVE_CANDLE',{position:20});assert.equal(deriveView(s).caseId,'at2f');s=act(s,'MOVE_CANDLE',{position:9.5});assert.equal(deriveView(s).caseId,'inside');s=act(s,'MOVE_CANDLE',{position:10.5});assert.equal(deriveView(s).caseId,'between');assert.equal(deriveView(s).lensState.imageType,'real');
});
test('focal null values and real outside-bench are not virtual or recordable',()=>{
 let s=select('focal');assert.equal(deriveView(s).lensState.theoreticalV,null);assert.equal(deriveView(s).lensState.magnification,null);assert(!deriveView(s).recordEnabled);
 for(const u of [10.5,11,12]){s=act(s,'MOVE_CANDLE',{position:u});s=act(s,'MOVE_SCREEN',{position:40});const q=deriveView(s);assert.equal(q.lensState.imageType,'real');assert.equal(q.lensState.projectionWithinBench,false);assert(q.clarity.effectiveClarityLevel>=2);assert(!q.recordEnabled);assert(!dispatchState(s,{type:'CONFIRM_FOCAL'}).accepted);}
});
test('search requires changed-position settle, not move, tap, or canceled return to start',()=>{
 let s=select('focal');s=act(s,'SETTLE_SCREEN');assert.deepEqual(s.search.zones,[]);s=act(s,'MOVE_SCREEN',{position:8});assert.deepEqual(s.search.zones,[]);s=act(s,'MOVE_SCREEN',{position:20});s=act(s,'SETTLE_SCREEN');assert.deepEqual(s.search.zones,[]);
 s=search(s);assert.deepEqual(s.search.zones,['near','middle','far']);assert(deriveView(s).search.complete);assert(!dispatchState(s,{type:'RECORD'}).accepted);s=act(s,'CONFIRM_FOCAL');assert.equal(s.records.focal.evidenceKind,'focal');assert.equal(s.records.focal.observedScreenPosition,null);assert.equal(s.records.focal.theoreticalV,null);assert(!dispatchState(s,{type:'CONFIRM_FOCAL'}).accepted);
});
test('virtual requires full finite-bench search, through view, observed confirmation',()=>{
 let s=select('inside');assert(!dispatchState(s,{type:'VIEW_THROUGH'}).accepted);assert(!dispatchState(s,{type:'CONFIRM_VIRTUAL'}).accepted);s=search(s);assert(!dispatchState(s,{type:'CONFIRM_VIRTUAL'}).accepted);s=act(s,'VIEW_THROUGH');assert.equal(deriveView(s).phase,'trial3-view-through-lens');const p=visualParams(deriveView(s));assert(p.virtual);assert.equal(p.image,null);s=act(s,'CONFIRM_VIRTUAL');assert.equal(s.records.inside.imageOrientation,'upright');assert.equal(s.records.inside.evidenceKind,'virtual');assert.equal(s.records.inside.observedScreenPosition,null);assert(!dispatchState(s,{type:'CONFIRM_VIRTUAL'}).accepted);
});
test('switch or object movement invalidates search/through/stale CTAs but preserves snapshots',()=>{
 let s=act(search(select('inside')),'VIEW_THROUGH');s=act(s,'CONFIRM_VIRTUAL');const record=structuredClone(s.records.inside);s=act(s,'MOVE_CANDLE',{position:6});assert(!s.through);assert(!s.confirmed);assert.deepEqual(s.search.zones,[]);assert(!dispatchState(s,{type:'CONFIRM_VIRTUAL'}).accepted);assert.deepEqual(s.records.inside,record);
 s=act(s,'SELECT_CASE',{id:'focal'});assert.equal(s.u,10);assert.equal(s.s,20);assert(!dispatchState(s,{type:'CONFIRM_FOCAL'}).accepted);assert.deepEqual(s.records.inside,record);
 const reset=act(s,'RESET');assert.deepEqual(reset,createState());assert.deepEqual(s.records.inside,record);
});
test('ranges clamp finite inputs; invalid inputs do not mutate state',()=>{
 let s=createState();assert(!dispatchState(s,{type:'MOVE_CANDLE',position:NaN}).accepted);assert(!dispatchState(s,{type:'MOVE_SCREEN',position:Infinity}).accepted);assert(!dispatchState(s,{type:'SELECT_CASE',id:'fake'}).accepted);
 s=act(s,'MOVE_CANDLE',{position:-100});assert.equal(s.u,5);s=act(s,'MOVE_CANDLE',{position:100});assert.equal(s.u,35);s=act(s,'MOVE_SCREEN',{position:-100});assert.equal(s.s,8);s=act(s,'MOVE_SCREEN',{position:100});assert.equal(s.s,40);
});
test('frozen input: physical candle direction, desktop/mobile snap, pointer cancel settles actual screen',()=>{
 for(const width of [1280,390]){
  const dom=new JSDOM('<div id="object"></div><div id="screen"></div>');let state=createState();const el=dom.window.document.getElementById('object'),screen=dom.window.document.getElementById('screen');
  const controller=createInputController({getState:()=>state,dispatch:a=>{state=dispatchState(state,a).state},getSnap:()=>snapForWidth(width),getRect:()=>({left:0,width:880}),isLocked:()=>false});controller.attach(el,'candle');controller.attach(screen,'screen');
  el.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowRight',shiftKey:true}));assert.equal(state.u,width===1280?29.5:29);el.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowLeft',shiftKey:true}));assert.equal(state.u,30);
  state=act(state,'SELECT_CASE',{id:'focal'});const pointer=(type,x)=>{const e=new dom.window.Event(type,{cancelable:true});Object.assign(e,{pointerId:1,pointerType:'mouse',button:0,clientX:x});screen.dispatchEvent(e);};
  pointer('pointerdown',600);pointer('pointermove',602);pointer('pointerup',602);assert.deepEqual(state.search.zones,[]);assert.equal(state.s,20);
  pointer('pointerdown',600);pointer('pointermove',480);assert.deepEqual(state.search.zones,[]);pointer('pointercancel',999);pointer('lostpointercapture',999);assert.equal(state.s,8);assert.deepEqual(state.search.zones,['near']);
 }
});
test('exit through resets current finite search while keeping immutable record history',()=>{
 let s=act(search(select('inside')),'VIEW_THROUGH');s=act(s,'CONFIRM_VIRTUAL');const before=structuredClone(s.records.inside);assert.equal(s.history.length,1);s=act(s,'EXIT_THROUGH');assert.equal(s.through,false);assert.equal(s.confirmed,false);assert.deepEqual(s.search.zones,[]);assert.deepEqual(s.records.inside,before);assert.deepEqual(s.history[0],before);assert(!dispatchState(s,{type:'CONFIRM_VIRTUAL'}).accepted);
});
test('same-case replacement appends immutable history; reset clears all snapshots',()=>{
 let s=act(createState(),'MOVE_SCREEN',{position:14.5});s=act(s,'RECORD');const original=structuredClone(s.history[0]);
 s=act(s,'MOVE_CANDLE',{position:35});s=act(s,'MOVE_SCREEN',{position:14});s=act(s,'RECORD');assert.equal(s.history.length,2);assert.deepEqual(s.history[0],original);assert.equal(s.history[0].u,30);assert.equal(s.history[0].observedScreenPosition,14.5);assert.equal(s.records.outside2f.u,35);assert.equal(s.records.outside2f.observedScreenPosition,14);assert.notEqual(s.history[1],s.records.outside2f);
 assert(!dispatchState(s,{type:'RECORD'}).accepted);assert.equal(s.history.length,2);s=act(s,'RESET');assert.deepEqual(s.history,[]);assert(Object.values(s.records).every(r=>r===null));
});
test('alreadyRecordedSnapshot exposes exact repeated real/focal/virtual conditions without relaxing gates',()=>{
 let real=act(createState(),'MOVE_SCREEN',{position:14.5});real=act(real,'RECORD');real=act(real,'SELECT_CASE',{id:'outside2f'});real=act(real,'MOVE_SCREEN',{position:14.5});assert(deriveView(real).alreadyRecordedSnapshot);assert(!deriveView(real).recordEnabled);
 let focal=act(search(select('focal')),'CONFIRM_FOCAL');focal=act(focal,'SELECT_CASE',{id:'focal'});focal=search(focal);assert(deriveView(focal).alreadyRecordedSnapshot);assert(!dispatchState(focal,{type:'CONFIRM_FOCAL'}).accepted);
 let virtual=act(search(select('inside')),'VIEW_THROUGH');virtual=act(virtual,'CONFIRM_VIRTUAL');virtual=act(virtual,'SELECT_CASE',{id:'inside'});virtual=search(virtual);assert(deriveView(virtual).alreadyRecordedSnapshot);assert(dispatchState(virtual,{type:'VIEW_THROUGH'}).accepted);virtual=act(virtual,'VIEW_THROUGH');assert(!dispatchState(virtual,{type:'CONFIRM_VIRTUAL'}).accepted);
 virtual=act(virtual,'MOVE_SCREEN',{position:39});assert(!deriveView(virtual).alreadyRecordedSnapshot);
});
console.log(`${n} five-case pure-controller checks passed.`);
