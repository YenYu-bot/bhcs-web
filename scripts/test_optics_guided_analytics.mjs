// I7 gate: anonymous usage events (assets/optics-guided/analytics.js). Fixed names only; no text, no numbers.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {reduce,createInitialState} from '../assets/optics-guided/engine.js';
import {analyticsFor,createTracker,ANALYTICS_ACTIONS,LAB_ID} from '../assets/optics-guided/analytics.js';
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};

const mS=position=>({type:'MOVE_SCREEN',position}),mC=position=>({type:'MOVE_CANDLE',position}),settle={type:'SETTLE_SCREEN'};
const FLOW=[{type:'START'},{type:'BEGIN'},mS(14.5),{type:'RECORD'},mC(15),mS(29.5),{type:'RECORD'},
 {type:'ANSWER_COMPARE',question:'position',answer:'farther'},{type:'ANSWER_COMPARE',question:'size',answer:'larger'},{type:'CONTINUE'},mC(5),mS(8),settle,mS(20),settle,mS(35),settle,{type:'CONFIRM_NO_REAL_IMAGE'},{type:'VIEW_THROUGH_LENS'},{type:'CONTINUE'},{type:'CONTINUE'},
 {type:'SAVE_CONCLUSION',fields:{level:'B',freeText:'SECRET-TEXT 距離變小'}},{type:'CONTINUE'},
 {type:'ANSWER_CHALLENGE',id:1,step:'adjust',choice:'candle'},{type:'ANSWER_CHALLENGE',id:1,step:'adjust',choice:'screen'},{type:'CONTINUE'},
 {type:'ANSWER_CHALLENGE',id:2,step:'project',choice:'no'},{type:'ANSWER_CHALLENGE',id:2,step:'kind',choice:'virtual'},{type:'CONTINUE'},
 {type:'ANSWER_CHALLENGE',id:3,step:'why',choice:'virtual'},{type:'SAVE_CHALLENGE_NOTE',id:3,text:'SECRET-NOTE'},{type:'CONTINUE'}];

function walk(actions){let st=createInitialState();const out=[];for(const a of actions){const r=reduce(st,a);st=r.state;out.push({a,names:analyticsFor(r)})}return out}

test('milestones map to fixed names, once each, in order',()=>{
 const names=walk(FLOW).flatMap(x=>x.names);
 assert.deepEqual(names,['lab_start','trial_recorded','trial_recorded','compare_complete','trial_recorded','virtual_observed','notebook_complete','challenge_complete','challenge_complete','challenge_complete','lab_complete']);
 assert.deepEqual([...new Set(names)].sort(),[...ANALYTICS_ACTIONS].sort(),'every allowed action is used, nothing else');
 // moving things, answering and typing send nothing by themselves
 for(const {a,names:n} of walk(FLOW))if(['MOVE_SCREEN','MOVE_CANDLE','SETTLE_SCREEN','ANSWER_COMPARE','SAVE_CONCLUSION','SAVE_CHALLENGE_NOTE','ANSWER_CHALLENGE','START'].includes(a.type))assert.deepEqual(n,[],a.type);
});

test('rejected actions, restarts and restored sessions send nothing',()=>{
 const st=createInitialState();
 assert.deepEqual(analyticsFor(reduce(st,{type:'BEGIN'})),[],'rejected BEGIN');
 assert.deepEqual(analyticsFor(reduce(st,{type:'RECORD'})),[]);assert.deepEqual(analyticsFor(undefined),[]);assert.deepEqual(analyticsFor({accepted:false,events:[{type:'record-written'}],transitions:['complete']}),[]);
 assert.deepEqual(analyticsFor(reduce(st,{type:'RESTART'})),[]);
});

test('names are valid for the site adapter and the lab id matches the page',()=>{
 for(const n of ANALYTICS_ACTIONS)assert.match(n,/^[a-z][a-z0-9_-]{0,60}$/,n);
 assert.match(LAB_ID,/^[a-z][a-z0-9_-]{0,80}$/);assert.equal(LAB_ID,'optics-guided');
 const html=fs.readFileSync(fileURLToPath(new URL('../tools/science/optics-guided.html',import.meta.url)),'utf8');assert.ok(html.includes(`data-science-lab="${LAB_ID}"`));
 const adapter=fs.readFileSync(fileURLToPath(new URL('../assets/science-events.js',import.meta.url)),'utf8');
 assert.ok(adapter.includes('/^[a-z][a-z0-9_-]{0,60}$/')&&adapter.includes('/^[a-z][a-z0-9_-]{0,80}$/'),'the adapter still uses the allowlist these names are written for');
});

test('tracker: exactly (name, lab id); free text and numbers never reach it; failures are swallowed',()=>{
 const calls=[];const win={bhcsScienceTrack:(...args)=>calls.push(args)};const track=createTracker(win);
 for(const {names} of walk(FLOW))track(names);
 assert.ok(calls.every(c=>c.length===2&&c[1]==='optics-guided'&&ANALYTICS_ACTIONS.includes(c[0])));assert.equal(calls.length,11);
 const wire=JSON.stringify(calls);for(const secret of ['SECRET','距離變小','14.5','29.5','farther','larger'])assert.ok(!wire.includes(secret),secret);
 createTracker({})(['lab_start']);createTracker(undefined)(['lab_start']);                 // adapter absent: nothing happens
 const boom=createTracker({bhcsScienceTrack(){throw new Error('x')}});assert.doesNotThrow(()=>boom(['lab_start','lab_complete']));
 const spy=[];createTracker({bhcsScienceTrack:(...a)=>spy.push(a)})(['lab_start','made_up','record_text:hello']);assert.deepEqual(spy,[['lab_start','optics-guided']],'unknown names are dropped');
});

test('analytics.js itself has no network or analytics calls',()=>{
 const src=fs.readFileSync(fileURLToPath(new URL('../assets/optics-guided/analytics.js',import.meta.url)),'utf8').replace(/\/\/.*$/gm,'');
 for(const bad of ['gtag','dataLayer','fetch(','XMLHttpRequest','sendBeacon','Image(','localStorage'])assert.ok(!src.includes(bad),bad);
 for(const f of ['main.js','script.js','persist.js','engine.js','render.js','input.js','visual.js','challenges.js']){
  const s=fs.readFileSync(fileURLToPath(new URL('../assets/optics-guided/'+f,import.meta.url)),'utf8').replace(/\/\/.*$/gm,'');
  assert.ok(!/gtag|dataLayer|sendBeacon|XMLHttpRequest|\bfetch\(/.test(s),f+' makes no network or analytics calls');
  assert.ok(f==='main.js'||!/bhcsScienceTrack/.test(s),f+' does not talk to the adapter');
 }
});

console.log(`PASS optics guided analytics: ${tests} tests`);
