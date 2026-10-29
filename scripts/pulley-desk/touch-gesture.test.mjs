import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{holdTouchEndpoint}=require('./touch-gesture.cjs');
test('stop-then-lift emits five stationary same-contact samples over100ms while pressed, then release and one tap',async()=>{
 let clock=0;const commands=[{type:'touchStart',at:clock}],point={x:227,y:522.0625};
 const cdp={async send(method,payload){assert.equal(method,'Input.dispatchTouchEvent');commands.push({...payload,at:clock});}};
 const result=await holdTouchEndpoint(cdp,point,{now:()=>clock,wait:async ms=>{clock+=ms;}});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:111}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.deepEqual(result.samples.map(s=>s.elapsedMs),[20,40,60,80,100]);assert.equal(result.elapsedMs,100);
 assert.deepEqual(commands.slice(1,6).map(c=>c.touchPoints),Array(5).fill([{...point,id:1}]));
 assert.deepEqual(commands.map(c=>c.type),['touchStart',...Array(5).fill('touchMove'),'touchEnd','touchStart','touchEnd']);assert.equal(commands[6].at,100);assert.equal(commands[7].at,100,'no post-release wait');
});
test('stationary duration follows a monotonic deadline and never moves or releases early when transport is slower',async()=>{
 let clock=0;const calls=[],waits=[];const result=await holdTouchEndpoint({async send(method,payload){calls.push(payload);clock+=35;}},{x:10,y:20},{now:()=>clock,wait:async ms=>{waits.push(ms);clock+=ms;}});
 assert.equal(calls.length,5);assert.ok(result.elapsedMs>=100);assert.deepEqual(waits,[20]);assert.ok(calls.every(c=>c.type==='touchMove'&&c.touchPoints[0].x===10&&c.touchPoints[0].y===20&&c.touchPoints[0].id===1));
});
test('failed stationary input propagates without retry, release, tap or state substitution',async()=>{
 let clock=0,calls=0;const failure=new Error('CDP failed');await assert.rejects(holdTouchEndpoint({async send(){calls++;throw failure;}},{x:1,y:2},{now:()=>clock,wait:async ms=>{clock+=ms;}}),e=>e===failure);assert.equal(calls,1);assert.equal(clock,20);
});
