// Test-only diagnostic safety checks; no accepted source tests are changed.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
const require=createRequire(import.meta.url);
const {VARIANTS,installTouchDiagnosticProbe,tapOnDragSession,runTouchDiagnosticMatrix}=require('./touch-diagnostic.cjs');

test('diagnostic probe is passive and observes late cancellation, capture, DOM identity and viewport',async()=>{
 const dom=new JSDOM('<button id="guide-next" data-key="save">Save</button><button id="rope-handle"></button><span id="height-value">20</span><div id="records"></div>',{url:'http://localhost/tools/pulley-desk/',runScripts:'outside-only'});
 const {window}=dom,frames=[],observers=[],NativeObserver=window.MutationObserver;
 window.MutationObserver=class extends NativeObserver{constructor(callback){super(callback);observers.push(this);}};
 window.requestAnimationFrame=fn=>frames.push(fn);
 window.visualViewport=Object.assign(new window.EventTarget(),{offsetLeft:0,offsetTop:0,pageLeft:0,pageTop:0,width:390,height:844,scale:1});
 window.Element.prototype.getBoundingClientRect=()=>({toJSON:()=>({x:0,y:0,width:44,height:44})});
 window.eval(`(${installTouchDiagnosticProbe.toString()})()`);
 const button=window.document.getElementById('guide-next'),initial=window.__pulleyDiagnostic.state().guide.node;
 const event=new window.Event('touchend',{bubbles:true,cancelable:true});
 Object.defineProperties(event,{touches:{value:[]},changedTouches:{value:[{identifier:9,clientX:12,clientY:34,target:button}]}});
 button.addEventListener('touchend',e=>{assert.equal(e.defaultPrevented,false,'probe did not cancel input');e.preventDefault();});
 button.dispatchEvent(event);const sample=window.__pulleyDiagnostic.events.find(e=>e.type==='touchend');
 assert.equal(sample.defaultPreventedAtCapture,false);assert.equal(sample.defaultPreventedAfterDispatch,undefined);
 for(const frame of frames.splice(0))frame();
 assert.equal(sample.defaultPreventedAfterDispatch,true,'final flag observes later application handler');assert.equal(sample.trusted,false,'probe does not manufacture trusted input');assert.equal(sample.changedTouches[0].identifier,9);
 button.disabled=true;await Promise.resolve();
 assert.ok(window.__pulleyDiagnostic.events.some(e=>e.type==='dom-observation'&&e.disabled.some(m=>m.target.id==='guide-next')));
 const replacement=button.cloneNode(true);button.replaceWith(replacement);await Promise.resolve();
 assert.notEqual(window.__pulleyDiagnostic.state().guide.node,initial,'same ID cannot conceal node replacement');
 replacement.dispatchEvent(new window.Event('gotpointercapture',{bubbles:true}));
 window.visualViewport.dispatchEvent(new window.Event('scroll'));
 assert.ok(window.__pulleyDiagnostic.events.some(e=>e.type==='gotpointercapture'));
 assert.ok(window.__pulleyDiagnostic.events.some(e=>e.type==='scroll'&&e.source==='visualViewport'&&e.view.visualViewport.scale===1));
 for(const observer of observers)observer.disconnect();dom.window.close();
});

function fakePage(){
 const state={guide:'start',count:0,rises:0,closed:false,commands:[],markers:[]};
 const page={state,viewportSize:()=>({width:390,height:844}),setDefaultTimeout(value){assert.equal(value,15000);},on(){},async goto(){},
  locator(selector){return {async waitFor(){},async isEnabled(){return true;},async scrollIntoViewIfNeeded(){},async boundingBox(){return {x:10,y:20,width:44,height:44};},async getAttribute(name){return name==='id'?selector.slice(1):state.guide;},async count(){return state.count;}};},
  async evaluate(fn,arg){return vm.runInNewContext(`(${fn.toString()})(arg)`,{arg,window:{__pulleyAudit:{input:[]},__pulleyDiagnostic:{events:[],markers:state.markers,mark:label=>state.markers.push(label),state:()=>({guide:state.guide,count:state.count})}},localStorage:{getItem:()=>null},document:{elementFromPoint:()=>({closest:()=>({id:'guide-next'})})}});},
  async waitForFunction(predicate,observation,options){assert.deepEqual(options,{polling:'raf'});assert.equal(observation.targetButtonId,'guide-next');return {async jsonValue(){return {type:'click',trusted:true};},async dispose(){}};}
 };
 return page;
}

test('same-session diagnostic emits exactly one native tap matching installed Playwright submission shape',async()=>{
 const page=fakePage(),commands=[],cdp={async send(name,payload){commands.push({name,payload});}};
 await tapOnDragSession(page,'#guide-next',cdp);
 assert.deepEqual(commands,[{name:'Input.dispatchTouchEvent',payload:{type:'touchStart',modifiers:0,touchPoints:[{x:32,y:42}]}},{name:'Input.dispatchTouchEvent',payload:{type:'touchEnd',modifiers:0,touchPoints:[]}}]);
 const missing=new Error('no native click');page.waitForFunction=async()=>{throw missing;};
 await assert.rejects(tapOnDragSession(page,'#guide-next',cdp),e=>e===missing);
 assert.equal(commands.length,4,'one tap per invocation, no retry after timeout');
});

test('bounded matrix uses three fresh contexts, stops each at first failure/save and never mutates acceptance',async()=>{
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'pulley-touch-diagnostic-')),pages=[],contexts=[],acceptance=[{status:'failed'}];
 const browser={async newContext(options){assert.deepEqual(options.viewport,{width:390,height:844});const page=fakePage(),index=pages.length;pages.push(page);
  const cdp={async send(name,payload){page.state.commands.push(payload);if(payload.type==='touchEnd'){if(page.state.guide==='start')page.state.guide='lift';else if(page.state.guide==='save'){page.state.count++;page.state.guide='start';}}}};
  const context={index,cdp,async addInitScript(fn){assert.equal(fn,installTouchDiagnosticProbe);},async newPage(){return page;},async route(){},async newCDPSession(p){assert.equal(p,page);return cdp;},async close(){page.state.closed=true;}};contexts.push(context);return context;
 }};
 const activate=async(page,selector,cdp)=>{assert.equal(cdp,contexts[pages.indexOf(page)].cdp);if(selector==='#rise-five'){if(++page.state.rises===4)page.state.guide='save';}else if(page.state.guide==='start')page.state.guide='lift';else {if(page===pages[0])throw new Error('missing mixed native click');page.state.count++;page.state.guide='start';}};
 const drags=[];const drag=async(page,cdp,device,rise,options={})=>{assert.equal(cdp,contexts[pages.indexOf(page)].cdp);drags.push([pages.indexOf(page),device,rise,options]);if(rise===15)page.state.guide='save';};
 try{
  const report=await runTouchDiagnosticMatrix({browser,base:'http://localhost',output,activate,drag});
  assert.deepEqual(report.variants.map(r=>r.variant),[...VARIANTS]);assert.deepEqual(report.variants.map(r=>r.status),['failed','completed','completed']);assert.equal(report.variants[0].stage,'save-fixed');
  assert.equal(pages.length,3);assert.ok(pages.every(p=>p.state.closed));assert.deepEqual(acceptance,[{status:'failed'}]);
  assert.equal(pages[0].state.markers.filter(m=>m==='before:save-fixed').length,1,'failing mixed tap attempted once');
  assert.equal(pages[1].state.rises,4);assert.equal(pages[2].state.commands.length,4,'same-session sends only start and save taps');
  for(const index of [0,2])assert.deepEqual(drags.filter(d=>d[0]===index).map(d=>d.slice(1)),[['fixed',20,{cancel:true}],['fixed',5,{}],['fixed',5,{reverse:true}],['fixed',15,{}]]);
  assert.equal(JSON.parse(fs.readFileSync(path.join(output,'touch-diagnostic-390.json'))).variants.length,3);
 }finally{fs.rmSync(output,{recursive:true,force:true});}
});
