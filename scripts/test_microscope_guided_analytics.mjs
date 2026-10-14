// B4 gate: anonymous usage events for the guided microscope lab. Pure functions; the adapter is faked.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {reduce,createInitialState} from '../assets/microscope-guided/engine.js';
import {restore,serialize} from '../assets/microscope-guided/persist.js';
import {LAB_ID,ANALYTICS_ACTIONS,analyticsFor,createTracker} from '../assets/microscope-guided/analytics.js';
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};

const set=(x,y)=>({type:'SET_STAGE',x,y}),REC={type:'RECORD'},CONT={type:'CONTINUE'};
const ans=(compare,question,answer)=>({type:'ANSWER_COMPARE',compare,question,answer});
const ch=(id,step,choice)=>({type:'ANSWER_CHALLENGE',id,step,choice});
const FLOW=[
 {type:'START'},{type:'BEGIN'},set(75,0),REC,set(0,75),REC,ans('direction','relation','opposite'),CONT,
 set(0,0),REC,{type:'SET_OBJECTIVE',objective:40},REC,ans('magnification','field','smaller'),ans('magnification','count','fewer'),CONT,
 CONT,{type:'SAVE_CONCLUSION',fields:{level:'A',relationDirection:'left',relationRange:'smaller'}},{type:'SAVE_CONCLUSION',fields:{freeText:'my free text'}},CONT,
 ch(1,'c1-direction','right-up'),ch(1,'c1-direction','left-up'),CONT,
 ch(2,'c2-view','only-b-larger'),ch(2,'c2-claim','smaller-field'),CONT,
 ch(3,'c3-strategy','low-recentre'),{type:'SAVE_CHALLENGE_NOTE',id:3,text:'my private note'},CONT,
];
function play(actions=FLOW){
 let state=createInitialState();const events=[];
 for(const a of actions){const r=reduce(state,a);assert.equal(r.accepted,true,`${JSON.stringify(a)} -> ${r.reason}`);events.push(...analyticsFor(r));state=r.state}
 return {state,events};
}

test('lab id and the six allowed milestones',()=>{
 assert.equal(LAB_ID,'microscope-guided');
 assert.deepEqual([...ANALYTICS_ACTIONS],['lab_start','trial_recorded','compare_complete','notebook_complete','challenge_complete','lab_complete']);
 assert.ok(Object.isFrozen(ANALYTICS_ACTIONS));
});
test('a full run sends exactly: lab_start, 4 x trial_recorded, 2 x compare_complete, notebook_complete, 3 x challenge_complete, lab_complete — in order',()=>{
 const {state,events}=play();assert.equal(state.phase,'complete');
 assert.deepEqual(events,['lab_start','trial_recorded','trial_recorded','compare_complete','trial_recorded','trial_recorded','compare_complete','notebook_complete','challenge_complete','challenge_complete','challenge_complete','lab_complete']);
 assert.equal(events.filter(e=>e==='trial_recorded').length,4);assert.equal(events.filter(e=>e==='compare_complete').length,2);assert.equal(events.filter(e=>e==='challenge_complete').length,3);
});
test('every name is on the allowlist',()=>{
 for(const e of play().events)assert.ok(ANALYTICS_ACTIONS.includes(e),e);
});
test('only accepted actions count; typing, answers and notes send nothing by themselves',()=>{
 const base=play(FLOW.slice(0,15)).state;
 for(const a of [{type:'SAVE_CONCLUSION',fields:{level:'A'}},ch(1,'c1-direction','left-up'),{type:'NOPE'},undefined]){assert.deepEqual(analyticsFor(reduce(base,a)),[]);}
 const nb=play(FLOW.slice(0,16)).state;
 assert.deepEqual(analyticsFor(reduce(nb,{type:'SAVE_CONCLUSION',fields:{freeText:'private text'}})),[],'notebook typing sends nothing');
 assert.deepEqual(analyticsFor(reduce(nb,{type:'CONTINUE'})),[],'a refused CONTINUE (notebook not ready) sends nothing');
 assert.deepEqual(analyticsFor(null),[]);assert.deepEqual(analyticsFor({accepted:true}),[]);assert.deepEqual(analyticsFor({accepted:true,events:'x',transitions:7}),[]);
});
test('wrong challenge answers send nothing; the milestone fires when the next phase is entered',()=>{
 const atCh1=play(FLOW.slice(0,19)).state;assert.equal(atCh1.phase,'challenge-1');
 assert.deepEqual(analyticsFor(reduce(atCh1,ch(1,'c1-direction','right-up'))),[]);
 assert.deepEqual(analyticsFor(reduce(atCh1,ch(1,'c1-direction','left-up'))),[],'solving is not entering');
 const solved=reduce(atCh1,ch(1,'c1-direction','left-up')).state;assert.deepEqual(analyticsFor(reduce(solved,CONT)),['challenge_complete']);
});
test('analytics payloads carry no answers, no text and no numbers: the only output is the fixed names',()=>{
 const sent=[];const track=createTracker({bhcsScienceTrack:(...a)=>sent.push(a)});
 for(const a of FLOW){const r=reduce(createInitialState(),a);void r}
 let state=createInitialState();for(const a of FLOW){const r=reduce(state,a);track(analyticsFor(r));state=r.state}
 assert.ok(sent.length>0);
 for(const call of sent){assert.equal(call.length,2);assert.ok(ANALYTICS_ACTIONS.includes(call[0]));assert.equal(call[1],'microscope-guided')}
 const text=JSON.stringify(sent);for(const secret of ['my free text','my private note','left-up','smaller','low-recentre','opposite'])assert.ok(!text.includes(secret),secret);
});
test('createTracker: a missing adapter or one that throws never breaks the lab; unknown names are dropped',()=>{
 assert.doesNotThrow(()=>createTracker({})(['lab_start']));assert.doesNotThrow(()=>createTracker(undefined)(['lab_start']));assert.doesNotThrow(()=>createTracker(null)(['lab_start']));
 const calls=[];const thrower=createTracker({bhcsScienceTrack:(...a)=>{calls.push(a);throw new Error('adapter down')}});
 assert.doesNotThrow(()=>thrower(['lab_start','trial_recorded']));assert.equal(calls.length,2,'one failure does not stop the next name');
 const seen=[];createTracker({bhcsScienceTrack:(...a)=>seen.push(a)})(['lab_start','evil_event','answer:left-up',42,null]);assert.deepEqual(seen,[['lab_start','microscope-guided']]);
 assert.doesNotThrow(()=>createTracker({bhcsScienceTrack:()=>{}})('not-a-list'));
});
test('restoring saved progress sends nothing: analyticsFor is only ever fed accepted actions, and restore dispatches none',()=>{
 const {state}=play();const saved=serialize(state);
 const restored=restore(saved);assert.ok(restored);assert.equal(restored.state.phase,'complete');
 const sent=[];const track=createTracker({bhcsScienceTrack:(...a)=>sent.push(a)});
 track(analyticsFor(undefined));assert.deepEqual(sent,[]);
 const src=fs.readFileSync(fileURLToPath(new URL('../assets/microscope-guided/persist.js',import.meta.url)),'utf8');
 assert.ok(!/analytics|bhcsScienceTrack/i.test(src),'persist.js knows nothing about analytics');
});
test('analytics.js is the only module that talks to the adapter',()=>{
 const dir='../assets/microscope-guided/';
 for(const f of ['model.js','engine.js','render.js','input.js','script.js','challenges.js','persist.js','main.js']){
  const src=fs.readFileSync(fileURLToPath(new URL(dir+f,import.meta.url)),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
  assert.ok(!/bhcsScienceTrack|gtag|sendBeacon/.test(src),f);
 }
});
console.log(`${tests} microscope analytics tests passed`);
