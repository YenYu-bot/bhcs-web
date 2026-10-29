// Supplemental checker regression; accepted prototype tests remain untouched.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {observedTouchInput,waitForTouchInput,observedTouchClick,waitForTouchClick}=require('./touch-delivery.cjs');
const sample={type:'pointermove',trusted:true,pointer:'touch',pointerId:7,targetButtonId:'rope-handle',clientX:200.25,clientY:310.25};
const requested={since:1,type:'pointermove',pointerId:7,point:{x:200.25,y:310.25}};
const observe=(events,args=requested)=>vm.runInNewContext(`(${observedTouchInput.toString()})(args)`,{window:{__pulleyAudit:{input:events}},args});
test('touch delivery barrier rejects old, untrusted, wrong-pointer, wrong-target and penultimate events',()=>{
 assert.equal(observe([sample]),false,'old matching event cannot satisfy current gesture');
 for(const patch of [{trusted:false},{pointer:'mouse'},{pointerId:8},{targetButtonId:'guide-next'},{clientY:297.75},{clientX:201},{clientY:311},{clientX:NaN}])assert.equal(observe([sample,{...sample,...patch}]),false,JSON.stringify(patch));
 assert.equal(observe([sample,{...sample}]).pointerId,7);
 assert.equal(observe([sample,{...sample,clientX:200.75,clientY:310.75}]).pointerId,7,'at most half CSS pixel conversion tolerance');
});
test('touch start acquires the actual native pointer and termination requires a new matching event',()=>{
 const down={...sample,type:'pointerdown',pointerId:23};
 assert.equal(observe([down],{since:0,type:'pointerdown',point:requested.point}).pointerId,23);
 for(const type of ['pointerup','pointercancel']){
  const end={...sample,type,pointerId:23};
  assert.equal(observe([end],{since:1,type,pointerId:23}),false);
  assert.equal(observe([end,{...end,pointerId:24}],{since:1,type,pointerId:23}),false);
  assert.equal(observe([end,end],{since:1,type,pointerId:23}).type,type);
 }
});
test('waiter uses the event predicate, preserves timeout failure and never accepts a desired height as delivery',async()=>{
 let polls=0,disposed=false;
 const page={async waitForFunction(predicate,args,options){
  assert.equal(predicate,observedTouchInput);assert.deepEqual(options,{polling:'raf'});assert.equal('timeout' in options,false,'existing page timeout remains authoritative');
  const events=[sample,{...sample,clientY:297.75}];
  assert.equal(observe(events,args),false,'penultimate sample remains pending even if a desired height could be rendered');polls++;
  events.push({...sample});const event=observe(events,args);assert.ok(event);polls++;
  return {async jsonValue(){return event;},async dispose(){disposed=true;}};
 }};
 const event=await waitForTouchInput(page,requested);assert.equal(polls,2);assert.equal(disposed,true);
 // Endpoint delivery is only a precondition: the existing exact DOM assertion
 // must still fail if the application renders a wrong preview after delivery.
 assert.equal(event.clientY,310.25);assert.throws(()=>assert.equal(18,20,'rendered drag preview'));
 const missing=new Error('native endpoint was not delivered before timeout');
 await assert.rejects(waitForTouchInput({async waitForFunction(){throw missing;}},requested),error=>error===missing);
});

const tapDown={type:'pointerdown',trusted:true,pointer:'touch',pointerId:7,targetButtonId:'guide-next'};
const tapUp={...tapDown,type:'pointerup'},tapClick={...tapDown,type:'click'};
const clickRequest={since:3,targetButtonId:'guide-next'};
const observeClick=(events,args=clickRequest)=>vm.runInNewContext(`(${observedTouchClick.toString()})(args)`,{window:{__pulleyAudit:{input:events}},args});
test('tap barrier rejects stale clicks, wrong target, untrusted input and mouse compatibility events',()=>{
 const old=[tapDown,tapUp,tapClick];assert.equal(observeClick(old),false);
 for(const patch of [{trusted:false},{pointer:'mouse'},{targetButtonId:'save-record'}])assert.equal(observeClick([...old,tapDown,tapUp,{...tapClick,...patch}]),false);
 assert.equal(observeClick([...old,tapDown,tapUp,tapClick]).type,'click');
 assert.equal(observeClick([...old,tapDown,tapUp,tapClick],{since:3,targetButtonId:''}),false);
});
test('tap barrier requires ordered current native down/up before click without equating native pointer ID to CDP contact ID',()=>{
 const old=[tapDown,tapUp,tapClick];
 assert.equal(observeClick([...old,tapClick]),false,'click alone has no fresh touch provenance');
 assert.equal(observeClick([...old,tapDown,tapClick,tapUp]),false,'click must follow release');
 assert.equal(observeClick([...old,tapDown,{...tapUp,pointerId:8},tapClick]),false,'another pointer release cannot complete this tap');
 assert.equal(observeClick([...old,{...tapDown,trusted:false},tapUp,tapClick]),false);
 assert.equal(observeClick([...old,tapDown,{...tapUp,targetButtonId:'other'},tapClick]),false);
 assert.equal(observeClick([...old,tapDown,tapUp,tapClick]).pointerId,7,'observed native identity is not assumed to equal CDP contact 1');
});
test('tap waiter stays pending until passive click delivery and propagates missing-click timeout without forcing state',async()=>{
 let disposed=false;
 const page={async waitForFunction(predicate,args,options){
  assert.equal(predicate,observedTouchClick);assert.deepEqual(options,{polling:'raf'});assert.equal('timeout' in options,false);
  const events=[tapDown,tapUp,tapClick,tapDown,tapUp];
  assert.equal(observeClick(events,args),false,'down/up is not native click delivery');
  events.push(tapClick);const event=observeClick(events,args);assert.equal(event.type,'click');
  return {async jsonValue(){return event;},async dispose(){disposed=true;}};
 }};
 assert.equal((await waitForTouchClick(page,clickRequest)).type,'click');assert.equal(disposed,true);
 assert.throws(()=>assert.equal(0,1,'record count after delivered native click'),'delivery alone cannot certify application state');
 const missing=new Error('native click was not delivered before timeout');
 await assert.rejects(waitForTouchClick({async waitForFunction(){throw missing;}},clickRequest),error=>error===missing);
});

test('release presentation boundary observes exactly one browser frame and preserves timeout without reading model or DOM',async()=>{
 const {nextPresentationFrame,waitForTouchPresentation}=require('./touch-delivery.cjs');let requested=0,callback,disposed=false;
 const page={async waitForFunction(predicate,args,options){assert.equal(predicate,nextPresentationFrame);assert.equal(args,undefined);assert.deepEqual(options,{polling:'raf'});assert.equal('timeout' in options,false);
  const pending=vm.runInNewContext(`(${predicate.toString()})()`,{requestAnimationFrame(fn){requested++;callback=fn;}});
  assert.equal(requested,1);callback(123);assert.equal(await pending,true);return {async dispose(){disposed=true;}};
 }};
 await waitForTouchPresentation(page);assert.equal(requested,1);assert.equal(disposed,true);
 const missing=new Error('presentation frame not delivered');await assert.rejects(waitForTouchPresentation({async waitForFunction(){throw missing;}}),e=>e===missing);
});
