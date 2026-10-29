import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{MINIMAL_PAGE,summarizeNativeEvents,runFastReleaseCharacterization}=require('./fast-release-diagnostic.cjs');
test('minimal characterization has only a touch-action:none handle and remote button, no application behavior',()=>{
 assert.match(MINIMAL_PAGE,/touch-action:none/);assert.match(MINIMAL_PAGE,/id="rope-handle"/);assert.match(MINIMAL_PAGE,/id="guide-next"/);
 assert.doesNotMatch(MINIMAL_PAGE,/<script|onclick|onpointer|localStorage|app\.mjs|model\.mjs|storage\.mjs/);
});
test('minimal characterization records either click outcome without a required suppression result or acceptance mutation',async()=>{
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'pulley-fast-release-')),contexts=[],acceptance=[{status:'failed'}];
 const browser={version:()=> 'unit-test-not-a-browser',async newContext(){
  const record={commands:[],taps:0,closed:false},index=contexts.length;contexts.push(record);
  const page={setDefaultTimeout(ms){assert.equal(ms,15000);},on(){},async goto(){},locator(selector){return {async boundingBox(){return {x:203,y:423,width:48,height:48};},async tap(){record.taps++;}};},async evaluate(fn){return fn.toString().includes('.length')?0:[];},async waitForFunction(fn,args,options){
   assert.deepEqual(options,{polling:'raf'});
   if(args?.targetButtonId&&index===0){const error=new Error('native click not observed');error.name='TimeoutError';throw error;}
   return {async jsonValue(){return {pointerId:7,type:args?.type||'click'};},async dispose(){}};
  }};
  return {async addInitScript(){},async route(){},async newPage(){return page;},async newCDPSession(){return {async send(method,payload){record.commands.push(payload);}};},async close(){record.closed=true;}};
 }};
 try{
  const report=await runFastReleaseCharacterization({browser,base:'http://localhost',output});
  assert.deepEqual(report.cases.map(c=>c.clickDelivery),['not-observed-within-timeout','observed']);assert.ok(report.cases.every(c=>c.status==='observed'));
  assert.equal(contexts.length,2);assert.ok(contexts.every(c=>c.taps===1&&c.closed));assert.equal(contexts[0].commands.filter(c=>c.type==='touchMove').length,8);assert.equal(contexts[1].commands.filter(c=>c.type==='touchMove').length,13);
  assert.deepEqual(acceptance,[{status:'failed'}]);assert.match(report.browser,/unit-test/);assert.equal(JSON.parse(fs.readFileSync(path.join(output,'fast-release-characterization.json'))).cases.length,2);assert.equal(report.comparison.sameObservedOutcome,false);
 }finally{fs.rmSync(output,{recursive:true,force:true});}
});

test('native event summary separates trusted per-target clicks from untrusted or other-target events',()=>{
 const summary=summarizeNativeEvents([{type:'pointerdown',trusted:true,pointer:'touch',targetButtonId:'guide-next'},{type:'pointerup',trusted:true,pointer:'touch',targetButtonId:'guide-next'},{type:'click',trusted:true,pointer:'touch',targetButtonId:'guide-next'},{type:'click',trusted:false,pointer:'touch',targetButtonId:'guide-next'},{type:'click',trusted:true,pointer:'mouse',targetButtonId:'rope-handle'}]);
 assert.equal(summary.trustedTotal,4);assert.equal(summary.byType.click,2);assert.equal(summary.buttons['guide-next'].clicks,1);assert.equal(summary.buttons['guide-next'].touchClicks,1);assert.equal(summary.buttons['rope-handle'].touchClicks,0);assert.equal(summarizeNativeEvents({captureError:'closed'}),null);
});
test('diagnostic setup errors remain errors, not claimed browser suppression or required quirk results',async()=>{
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'pulley-fast-release-error-'));
 try{const report=await runFastReleaseCharacterization({browser:{version:()=> 'unit-test-not-a-browser',async newContext(){throw new Error('context unavailable');}},base:'http://localhost',output});assert.equal(report.cases.length,2);assert.ok(report.cases.every(item=>item.status==='diagnostic-error'&&item.clickDelivery==='undetermined'));assert.equal(report.comparison.sameObservedOutcome,null);}
 finally{fs.rmSync(output,{recursive:true,force:true});}
});
