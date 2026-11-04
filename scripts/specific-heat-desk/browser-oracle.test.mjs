import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url),O=require('./browser-oracle.cjs'),H=require('./browser-support.cjs');
test('independent oracle rejects temperature, mass, identity and missing final observations',()=>{
 const record={id:'water',runId:'pair',configId:'water100',power:21,time:60,initialTemperature:20,temperature:23,mass:100,samples:[{time:0,temperature:20},{time:60,temperature:23}]};
 const iron={...record,id:'iron',configId:'iron100',temperature:48,samples:[{time:0,temperature:20},{time:60,temperature:48}]};
 O.records([record,iron],['water100','iron100']);
 for(const patch of [{temperature:24},{mass:200},{id:'iron'},{runId:'other'},{samples:[{time:0,temperature:20}]}])assert.throws(()=>O.records([{...record,...patch},iron],['water100','iron100']));
});
test('trusted same-pointer gesture cannot be replaced by synthetic, mismatched, cancelled or duplicate input',()=>{
 const events=[{type:'pointerdown',pointer:'touch',pointerId:7,trusted:true},{type:'pointerup',pointer:'touch',pointerId:7,trusted:true}];
 assert.equal(O.assertGesture(events,{pointer:'touch'}),7);
 for(const bad of [events.map(x=>({...x,trusted:false})),[events[0],{...events[1],pointerId:8}],[...events,{type:'pointercancel'}],[...events,events[0]]])assert.throws(()=>O.assertGesture(bad,{pointer:'touch'}));
});
test('durable receipt rejects stale boundary, unlocked/mismatched write, pending lock and fingerprint mismatch',()=>{
 const original=global.window,payload={schema:1},raw=JSON.stringify({payload}),key=O.KEY;
 const fixture=()=>({__heatRead:()=>raw,__heatQA:{locks:[{id:0,name:key+':lock',status:'resolved',result:{ok:true,fingerprint:JSON.stringify(payload)}}],access:[{area:'local',name:'setItem',key,requestId:0,completed:true,value:raw}]}});
 try{global.window=fixture();assert.deepEqual(H.durableReceiptReady({floor:0,key}).payload,payload);assert.equal(H.durableReceiptReady({floor:1,key}),false);
 for(const mutate of [w=>w.__heatQA.access[0].requestId=null,w=>w.__heatQA.locks[0].status='pending',w=>w.__heatQA.locks[0].result.fingerprint='other',w=>w.__heatQA.access[0].value='stale']){global.window=fixture();mutate(window);assert.equal(H.durableReceiptReady({floor:0,key}),false);}
 }finally{global.window=original;}
});
test('CI checker preserves native-only execution and complete explicit scenario manifest',()=>{
 const text=fs.readFileSync(new URL('../check_specific_heat_desk_browser.cjs',import.meta.url),'utf8');
 assert.match(text,/assert\.equal\(VERSION,PIN\)/);assert.match(text,/process\.env\.CI,'true'/);assert.match(text,/results\.length,28/);
 for(const bad of [/dispatchEvent\(/,/\.clock\.(?:install|fastForward|runFor)/,/force:\s*true/,/import\(.*(?:engine|model|app)\.mjs/,/\.selectOption\(/,/\.fill\(/])assert.doesNotMatch(text,bad);
 for(const required of ['natural-time-checkpoints','seven-answer-and-comparison-invalidation','rejected-lock-never-falls-back','two-page-native-storage-conflict','text-200-reduced-motion-renderer','short-height-heavy-target-','ordinary-motion-native-arrows','trusted-hidden-'])assert.ok(text.includes(required),required);
});
test('requested native target must receive the unique same-pointer down/up/click at the real hit point',()=>{
 const events=['pointerdown','pointerup','click'].map(type=>({type,pointer:'touch',pointerId:4,trusted:true,targetNodeId:11,hitNodeId:11}));
 assert.equal(H.assertTargetActivation(events,11,'touch'),4);
 for(const bad of [events.map(x=>({...x,targetNodeId:12})),events.map(x=>({...x,hitNodeId:12})),[...events,events[2]],[...events.slice(0,2),{...events[2],pointerId:5}],events.map(x=>({...x,trusted:false}))])assert.throws(()=>H.assertTargetActivation(bad,11,'touch'));
});
test('native visibility proof rejects fake, reversed, missing or still-hidden return events',()=>{
 const proof={events:[{type:'visibilitychange',trusted:true,hidden:true},{type:'visibilitychange',trusted:true,hidden:false}],hidden:false,focused:true};
 O.assertVisibilityCycle(proof);
 for(const bad of [{...proof,events:proof.events.map(e=>({...e,trusted:false}))},{...proof,events:[...proof.events].reverse()},{...proof,events:proof.events.slice(0,1)},{...proof,hidden:true},{...proof,focused:false}])assert.throws(()=>O.assertVisibilityCycle(bad));
});
test('paused native clock guard rejects hidden drift, return catch-up, NaN and endpoint pseudo-proofs',()=>{
 O.assertFrozenTime([2.4,2.4,2.4]);
 for(const times of [[2.4,2.5,2.5],[2.4,2.4,6],[0,0,0],[60,60,60],[NaN,NaN,NaN],[2.4]])assert.throws(()=>O.assertFrozenTime(times));
});

test('hidden lifecycle observations use interval polling, never background-throttled animation frames',()=>{
 const text=fs.readFileSync(new URL('../check_specific_heat_desk_browser.cjs',import.meta.url),'utf8');
 for(const condition of ['e.trusted&&e.hidden','e.trusted&&!e.hidden'])assert.ok(text.includes(condition+'),floor,{polling:50}'),condition);
});
test('download activation failure remains original error when the concurrent waiter later rejects',async()=>{
 let rejectWait;const pending=new Promise((resolve,reject)=>{rejectWait=reject;});
 const page={waitForEvent:name=>{assert.equal(name,'download');return pending;},locator:()=>({isVisible:async()=>false})};
 await assert.rejects(H.download(page,'#export','mouse'),/native action target visible/);
 rejectWait(new Error('context closed after original activation failure'));
 // Node's test runner would report an unhandled rejection without Promise.all's handler.
 await new Promise(resolve=>setImmediate(resolve));
});
test('snapshot reopens native save drawer after reload; failed cases aggregate without skipping final gates',()=>{
 const text=fs.readFileSync(new URL('../check_specific_heat_desk_browser.cjs',import.meta.url),'utf8');
 assert.match(text,/async function snapshot\(p,mode\)\{await drawers\(p,mode\);return JSON\.parse\(await H\.download/);
 const run=text.slice(text.indexOf('async function run('),text.indexOf('async function hidden('));
 assert.match(run,/catch\(e\)\{r\.status='failed';r\.error=e\.stack;/);
 assert.doesNotMatch(run,/throw e/);
 assert.match(text,/assert\.equal\(results\.length,28/);
 assert.match(text,/assert\.ok\(results\.every\(r=>r\.status==='passed'\)/);
 assert.match(text,/async\(p,r\)=>\{assert\.ok\(completeFixture,'only a native completed run may supply reload fixtures'\)/);
});
