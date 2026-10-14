// B4 gate: progress saving for the guided microscope lab. Pure functions + a faked storage; nothing here touches a browser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {reduce,createInitialState,compareView,notebookIsReady} from '../assets/microscope-guided/engine.js';
import {STORAGE_KEY,VERSION,toSave,serialize,restore,createStore} from '../assets/microscope-guided/persist.js';
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};

const set=(x,y)=>({type:'SET_STAGE',x,y}),REC={type:'RECORD'},CONT={type:'CONTINUE'};
const ans=(compare,question,answer)=>({type:'ANSWER_COMPARE',compare,question,answer});
const ch=(id,step,choice)=>({type:'ANSWER_CHALLENGE',id,step,choice});
const FLOW=[
 {type:'START'},{type:'BEGIN'},set(75,0),REC,set(0,75),REC,ans('direction','relation','opposite'),CONT,        // 0-7   -> trial2-low
 set(0,0),REC,{type:'SET_OBJECTIVE',objective:40},REC,ans('magnification','field','smaller'),ans('magnification','count','fewer'),CONT, // 8-14 -> concept
 CONT,{type:'SAVE_CONCLUSION',fields:{level:'A',relationDirection:'left',relationRange:'smaller'}},{type:'SAVE_CONCLUSION',fields:{freeText:'my free text'}},CONT, // 15-18 -> challenge-1
 ch(1,'c1-direction','right-up'),ch(1,'c1-direction','left-up'),CONT,                                            // 19-21 -> challenge-2
 ch(2,'c2-view','only-b-larger'),ch(2,'c2-claim','smaller-field'),CONT,                                          // 22-24 -> challenge-3
 ch(3,'c3-strategy','low-recentre'),{type:'SAVE_CHALLENGE_NOTE',id:3,text:'my private note'},CONT,              // 25-27 -> complete
];
const play=(n=FLOW.length)=>FLOW.slice(0,n).reduce((s,a)=>{const r=reduce(s,a);assert.equal(r.accepted,true,JSON.stringify(a));return r.state},createInitialState());
const saveObj=(n)=>JSON.parse(serialize(play(n)));
const R=(obj)=>restore(JSON.stringify(obj));
const at=(n,mutate)=>{const o=saveObj(n);mutate?.(o);return R(o)};
const clone=(o)=>JSON.parse(JSON.stringify(o));
const ORDER=['welcome','mission','trial1-horizontal','trial1-horizontal-complete','trial1-vertical','trial1-vertical-complete','compare-direction','trial2-low','trial2-low-complete','trial2-high','trial2-high-complete','compare-magnification','concept','notebook','challenge-1','challenge-2','challenge-3','complete'];
function rank(p){return ORDER.indexOf(p)}

test('storage key is its own and legacy data is untouched',()=>{
 assert.equal(STORAGE_KEY,'bhcs-microscope-guided:v1');assert.equal(VERSION,1);
 assert.notEqual(STORAGE_KEY,'bhcsMicroscopeRecords');
 const src=fs.readFileSync(fileURLToPath(new URL('../assets/microscope-guided/persist.js',import.meta.url)),'utf8');
 assert.ok(!src.includes('bhcsMicroscopeRecords'),'persist.js never names the legacy key');
});
test('serialize keeps source inputs only: no displacement, visible list, field size, relation, ready or correct',()=>{
 const text=serialize(play());
 for(const forbidden of ['imageDelta','imageStart','imageEnd','stageDelta','visibleIds','lowIds','fieldDiameter','"correct"','ready','allCorrect','opposite"','expected'])
  assert.ok(!text.includes(forbidden)||forbidden==='opposite"','no '+forbidden);
 const o=JSON.parse(text);
 assert.deepEqual(Object.keys(o).sort(),['challenges','compare','conclusion','objective','phase','records','stage','v']);
 assert.deepEqual(Object.keys(o.records.horizontal).sort(),['objective','stageEnd','stageStart','trial']);
 assert.deepEqual(Object.keys(o.records.low).sort(),['objective','stage','trial']);
 assert.deepEqual(o.challenges[1].steps['c1-direction'],{choice:'left-up',attempts:2});
 assert.equal(o.challenges[3].note,'my private note');assert.deepEqual(toSave(play()),o);
});
test('a full save restores to the finish with every learner input and nothing derived',()=>{
 const r=restore(serialize(play()));assert.equal(r.phase,'complete');
 const orig=play();
 assert.deepEqual(r.state.records,orig.records);assert.deepEqual(r.state.compare,orig.compare);assert.deepEqual(r.state.conclusion,orig.conclusion);assert.deepEqual(r.state.challenges,orig.challenges);
 assert.equal(r.checkpoint,'complete');
});
test('every mid-flow save restores to the phase it was saved at, with the data that phase can have',()=>{
 const expect=[[7,'compare-direction'],[8,'trial2-low'],[10,'trial2-high'],[12,'compare-magnification'],[15,'concept'],[16,'notebook'],[19,'challenge-1'],[22,'challenge-2'],[25,'challenge-3'],[28,'complete']];
 for(const [n,phase] of expect){const r=restore(serialize(play(n)));assert.equal(r.phase,phase,`after ${n} actions`);assert.equal(r.state.phase,phase)}
});
test('Trial 1 forged derived values are ignored: the record is rebuilt from its source inputs',()=>{
 const r=at(28,o=>{for(const k of ['horizontal','vertical'])Object.assign(o.records[k],{imageDelta:{x:999,y:999},imageStart:{x:0,y:0},imageEnd:{x:9,y:9},stageDelta:{x:-9,y:-9},relation:'same'})});
 assert.deepEqual(Object.keys(r.state.records.horizontal).sort(),['objective','stageEnd','stageStart','trial']);
 assert.deepEqual(r.state.records.horizontal,play().records.horizontal);assert.equal(r.phase,'complete');
});
test('a Trial 1 record that never really finished is not a record (the e must end near the centre)',()=>{
 for(const mutate of [o=>{o.records.horizontal.stageEnd={x:10,y:0}},o=>{o.records.horizontal.stageEnd={x:-75,y:0}},o=>{o.records.horizontal.stageStart={x:5,y:0}},o=>{o.records.horizontal.objective=10},
  o=>{o.records.horizontal.trial='vertical'},o=>{o.records.horizontal.stageEnd={x:'75',y:0}},o=>{o.records.horizontal.stageEnd={x:NaN,y:0}},o=>{o.records.horizontal.stageEnd=null},o=>{o.records.horizontal=null},o=>{o.records.horizontal.stageEnd={x:1e9,y:0}}]){
  const r=at(28,mutate);assert.equal(r.state.records.horizontal,null);assert.ok(['trial1-horizontal','welcome','mission'].includes(r.phase),r.phase);
  assert.equal(r.state.records.vertical,null,'everything after an invalid record is dropped');assert.equal(r.state.records.low,null);
 }
});
test('stage values are clamped to ±150 before they are judged; a clamped value that still finishes the trial is kept',()=>{
 const r=at(28,o=>{o.records.low.stage={x:0,y:1e6}});assert.equal(r.state.records.low,null,'clamped to y=150, B is far off-centre');
 const ok=at(28,o=>{o.records.horizontal.stageEnd={x:75.0000001,y:0}});assert.ok(ok.state.records.horizontal);
});
test('Trial 2 records are checked against the model: low at 4× with B centred, high at 40× with B in the field',()=>{
 const bad={low:[o=>{o.records.low.objective=40},o=>{o.records.low.stage={x:30,y:0}},o=>{o.records.low.stage=null},o=>{o.records.low.trial='high'}],
  high:[o=>{o.records.high.objective=4},o=>{o.records.high.objective=10},o=>{o.records.high.stage={x:60,y:0}},o=>{o.records.high.stage={x:'a',y:0}}]};
 for(const m of bad.low){const r=at(28,m);assert.equal(r.state.records.low,null);assert.equal(r.state.records.high,null);assert.ok(rank(r.phase)<=rank('trial2-low'),r.phase)}
 for(const m of bad.high){const r=at(28,m);assert.ok(r.state.records.low);assert.equal(r.state.records.high,null);assert.equal(r.phase,'trial2-high')}
 const forged=at(28,o=>{o.records.high.visibleIds=['A','B','C'];o.records.high.fieldDiameter=9;o.records.low.count=99});
 assert.deepEqual(forged.state.records.high,{trial:'high',objective:40,stage:{x:0,y:0}});
});
test('phase ceiling: the save cannot claim more than its data proves',()=>{
 const claimsComplete=(n,mutate)=>at(n,o=>{mutate?.(o);o.phase='complete'});
 assert.equal(claimsComplete(4).phase,'trial1-vertical');                                  // only horizontal
 assert.equal(claimsComplete(6).phase,'compare-direction');                                 // two records, compare unanswered
 assert.equal(at(6,o=>{o.phase='trial2-low'}).phase,'compare-direction');
 assert.equal(claimsComplete(8,o=>{o.compare.relation=null}).phase,'compare-direction');
 assert.equal(claimsComplete(8).phase,'trial2-low');                                        // compare 1 right, no low
 assert.equal(claimsComplete(10).phase,'trial2-high');
 assert.equal(claimsComplete(12,o=>{o.compare.field=null}).phase,'compare-magnification');
 assert.equal(claimsComplete(15).phase,'notebook');                                         // notebook empty
 assert.equal(claimsComplete(16).phase,'notebook');                                         // level not chosen yet
 assert.equal(claimsComplete(17).phase,'challenge-1');                                      // level A ready
 assert.equal(claimsComplete(19).phase,'challenge-1');
 assert.equal(claimsComplete(22).phase,'challenge-2');
 assert.equal(claimsComplete(25).phase,'challenge-3');
 assert.equal(claimsComplete(28).phase,'complete');
});
test('phase floor: a save cannot claim less than its records imply (a trial that is recorded is not replayed)',()=>{
 assert.equal(at(8,o=>{o.phase='trial1-horizontal'}).phase,'compare-direction','two direction records put the learner at least at compare 1');
 assert.equal(at(12,o=>{o.phase='trial2-high'}).phase,'compare-magnification');
 assert.equal(at(4,o=>{o.phase='trial1-horizontal'}).phase,'trial1-vertical');
 assert.equal(at(28,o=>{o.phase='welcome'}).phase,'compare-magnification');
});
test('checkpoint and floor are reported',()=>{
 const r=restore(serialize(play(17)));assert.equal(r.checkpoint,'challenge-1');assert.equal(r.floor,'compare-magnification');
});
test('compare answers are restored; a wrong answer is kept as the learner left it and does not advance',()=>{
 const r=at(6,o=>{o.compare.relation='same'});assert.equal(r.phase,'compare-direction');assert.equal(r.state.compare.direction.relation,'same');assert.equal(compareView(r.state).directionCorrect,false);
 const m=at(14,o=>{o.compare.field='larger';o.phase='compare-magnification'});assert.equal(m.phase,'compare-magnification');assert.deepEqual(m.state.compare.magnification,{field:'larger',count:'fewer'});
 const bogus=at(6,o=>{o.compare.relation='definitely';o.compare.field='x'});assert.equal(bogus.state.compare.direction.relation,null);
 const right=at(8);assert.equal(right.state.compare.direction.relation,'opposite');
});
test('a forged compare answer cannot advance: correctness is judged from the records every time',()=>{
 const noRecords=at(28,o=>{o.records.vertical=null;o.compare.relation='opposite';o.phase='concept'});assert.equal(noRecords.phase,'trial1-vertical');
 const fakeLow=at(28,o=>{o.records.low.objective=40;o.compare.field='smaller'});assert.equal(fakeLow.state.records.low,null);assert.ok(rank(fakeLow.phase)<=rank('trial2-low'));
 const hand=at(12,o=>{o.compare.field='smaller';o.compare.count='more';o.phase='concept'});assert.equal(hand.phase,'compare-magnification','count is wrong for these records');
});
test('Level A: a relation that does not match the learner\'s own records is cleared and cannot open the challenges',()=>{
 const r=at(28,o=>{o.conclusion={...o.conclusion,level:'A',relationDirection:'right',relationRange:'smaller',freeText:''};o.phase='challenge-3'});
 assert.equal(r.state.conclusion.relationDirection,null);assert.equal(r.state.conclusion.relationRange,'smaller');
 assert.equal(r.phase,'notebook');assert.equal(notebookIsReady(r.state),false);
 const slideLeft=at(28,o=>{o.records.horizontal.stageEnd={x:75,y:0}});assert.equal(slideLeft.state.conclusion.relationDirection,'left');
 const both=at(15,o=>{o.conclusion={level:'A',relationDirection:'still',relationRange:'huge'}});assert.equal(both.state.conclusion.relationDirection,null);assert.equal(both.state.conclusion.relationRange,null);
});
test('Level B and C text is sanitised field by field, and a bad field does not take the good ones down',()=>{
 const r=at(28,o=>{o.conclusion={level:'C',freeText:7,evidenceText:'x'.repeat(5000),limitationText:'keep me',relationDirection:null,relationRange:null,ready:true,extra:{a:1}};o.challenges=null});
 assert.equal(r.state.conclusion.freeText,'');assert.equal(r.state.conclusion.evidenceText.length,1000);assert.equal(r.state.conclusion.limitationText,'keep me');
 assert.ok(!('ready' in r.state.conclusion)&&!('extra' in r.state.conclusion));assert.equal(r.phase,'challenge-1','level C is ready: both fields hold text');
 const noLevel=at(28,o=>{o.conclusion={level:'Z',freeText:'abcdefgh'}});assert.equal(noLevel.state.conclusion.level,null);assert.equal(noLevel.phase,'notebook');
 const short=at(28,o=>{o.conclusion={level:'B',freeText:'ab'}});assert.equal(short.phase,'notebook');
 const junk=at(28,o=>{o.conclusion=['not','an','object']});assert.equal(junk.state.conclusion.level,null);
});
test('challenge correct:true in a save is ignored: every answer is judged again',()=>{
 const r=at(28,o=>{o.challenges[1].steps['c1-direction']={choice:'right-up',attempts:2,correct:true};o.phase='complete'});
 assert.equal(r.phase,'challenge-1');assert.deepEqual(r.state.challenges[1].steps['c1-direction'],{choice:'right-up',correct:false,attempts:2});
 assert.deepEqual(r.state.challenges[2].steps,{},'nothing after an unsolved step is kept');
 const none=at(28,o=>{o.challenges[1].steps['c1-direction']={choice:'nope',attempts:1,correct:true}});assert.equal(none.phase,'challenge-1');assert.deepEqual(none.state.challenges[1].steps,{});
});
test('a later challenge saved without the earlier one solved is ignored (steps are strictly ordered)',()=>{
 const r=at(28,o=>{o.challenges[1]={steps:{}};o.phase='challenge-3'});assert.equal(r.phase,'challenge-1');assert.deepEqual(r.state.challenges[2].steps,{});assert.deepEqual(r.state.challenges[3].steps,{});
 const step2=at(28,o=>{delete o.challenges[2].steps['c2-view'];o.phase='challenge-3'});assert.equal(step2.phase,'challenge-2');assert.deepEqual(step2.state.challenges[2].steps,{});
 const attempts=at(28,o=>{o.challenges[1].steps['c1-direction'].attempts=0});assert.equal(attempts.phase,'challenge-1');
 const huge=at(28,o=>{o.challenges[1].steps['c1-direction'].attempts=1e300});assert.equal(huge.phase,'challenge-1','an absurd attempt count is not a count');
 const capped=at(28,o=>{o.challenges[1].steps['c1-direction'].attempts=5000});assert.equal(capped.state.challenges[1].steps['c1-direction'].attempts,999);
});
test('Challenge 3 note: restored only when its step is solved, capped at 1000',()=>{
 assert.equal(restore(serialize(play())).state.challenges[3].note,'my private note');
 const unsolved=at(28,o=>{o.challenges[3].steps={};o.phase='challenge-3'});assert.equal(unsolved.state.challenges[3].note,'');
 const long=at(28,o=>{o.challenges[3].note='n'.repeat(4000)});assert.equal(long.state.challenges[3].note.length,1000);
 const typed=at(28,o=>{o.challenges[3].note=42});assert.equal(typed.state.challenges[3].note,'');
 assert.equal(at(25).state.challenges[3].note,'','no note yet');
});
test('the finish is restored only when every gate is passed for real',()=>{
 assert.equal(restore(serialize(play())).phase,'complete');
 for(const mutate of [o=>{o.challenges[3].steps['c3-strategy'].choice='brightest'},o=>{o.challenges[2].steps['c2-claim'].choice='brighter'},o=>{o.conclusion.freeText='';o.conclusion.level='B'},
  o=>{o.compare.count='more'},o=>{o.records.high.objective=4},o=>{o.records.vertical.stageEnd={x:0,y:0}}]){
  assert.notEqual(at(28,mutate).phase,'complete');
 }
});
test('in-progress positions are replayed through the engine: saved stage and objective are validated, never trusted',()=>{
 const mid=(phase,stage,objective)=>({v:1,phase,stage,objective,records:{horizontal:null,vertical:null,low:null,high:null},compare:{},conclusion:{},challenges:{}});
 const h=R({...saveObj(2),records:{horizontal:null},phase:'trial1-horizontal',stage:{x:30,y:0}});
 assert.equal(h.phase,'trial1-horizontal');assert.deepEqual(h.state.stage,{x:30,y:0});
 const clamp=R({...saveObj(2),phase:'trial1-horizontal',stage:{x:-9999,y:9999}});assert.deepEqual(clamp.state.stage,{x:-150,y:150});
 const bad=R({...saveObj(2),phase:'trial1-horizontal',stage:{x:'x',y:NaN}});assert.deepEqual(bad.state.stage,{x:0,y:0});
 const missing=R({...saveObj(2),phase:'trial1-horizontal',stage:null});assert.deepEqual(missing.state.stage,{x:0,y:0});
 const done=R({...saveObj(2),phase:'trial1-horizontal-complete',stage:{x:75,y:0}});assert.equal(done.phase,'trial1-horizontal-complete','a centred e puts the trial back at its record button');
 const lie=R({...saveObj(2),phase:'trial1-horizontal-complete',stage:{x:10,y:0}});assert.equal(lie.phase,'trial1-horizontal','a complete phase without a centred e is replayed to what the stage really shows');
 const v=at(4,o=>{o.phase='trial1-vertical';o.stage={x:0,y:30}});assert.equal(v.phase,'trial1-vertical');assert.deepEqual(v.state.stage,{x:0,y:30});assert.ok(v.state.records.horizontal);
 const low=at(8,o=>{o.phase='trial2-low';o.stage={x:60,y:0}});assert.deepEqual(low.state.stage,{x:60,y:0});assert.equal(low.state.objective,4);
 const lowDone=at(8,o=>{o.phase='trial2-low';o.stage={x:5,y:0}});assert.equal(lowDone.phase,'trial2-low-complete');
 const lowPhaseLie=at(8,o=>{o.phase='trial2-low';o.objective=40;o.stage={x:60,y:0}});assert.equal(lowPhaseLie.state.objective,4,'the objective cannot be switched in a trial that has no switch');
});
test('trial2-high: a saved objective is applied through the engine, so a forged one cannot skip the gate',()=>{
 const high=(extra)=>at(10,o=>{o.phase='trial2-high';Object.assign(o,extra)});
 const ten=high({objective:10,stage:{x:0,y:0}});assert.equal(ten.phase,'trial2-high');assert.equal(ten.state.objective,10);
 const forty=high({objective:40,stage:{x:0,y:0}});assert.equal(forty.phase,'trial2-high-complete','B is in the field at 40×, so the trial really is complete');
 const lost=high({objective:40,stage:{x:60,y:0}});assert.equal(lost.phase,'trial2-high');assert.equal(lost.state.objective,40);
 const bogus=high({objective:7,stage:{x:0,y:0}});assert.equal(bogus.state.objective,4);
 const start=high({});assert.deepEqual(start.state.stage,{x:0,y:0},'the high trial begins where the low record left the stage');
});
test('invalid saves: corrupt JSON, wrong version, wrong shape',()=>{
 for(const raw of ['{not json','',null,undefined,'null','[]','"str"','42',JSON.stringify({v:2,phase:'complete'}),JSON.stringify({phase:'complete'}),JSON.stringify([1]),{v:1,phase:'x'}.toString()])assert.equal(restore(raw),null,String(raw));
 assert.equal(restore({v:2}),null);
 const empty=restore(JSON.stringify({v:1}));assert.equal(empty.phase,'welcome');assert.equal(empty.state.records.horizontal,null);
 const junkFields=restore(JSON.stringify({v:1,phase:42,records:'x',compare:[],conclusion:7,challenges:'y',stage:'z'}));assert.ok(junkFields);assert.equal(junkFields.state.phase,'welcome');
});
test('restore is pure: it never mutates its input and dispatches nothing (it returns a state, no action, no event)',()=>{
 const raw=serialize(play()),frozen=Object.freeze(raw);assert.doesNotThrow(()=>restore(frozen));
 const obj=saveObj(28),before=JSON.stringify(obj);R(obj);assert.equal(JSON.stringify(obj),before);
 const r=restore(raw);assert.deepEqual(Object.keys(r).sort(),['checkpoint','floor','phase','state']);assert.ok(!('events' in r)&&!('transitions' in r));
});
test('createStore: save only after the first record, and only when something changed',()=>{
 const calls=[];const storage={getItem:()=>null,setItem:(k,v)=>calls.push(['set',k,v]),removeItem:(k)=>calls.push(['remove',k])};
 const store=createStore(storage);
 assert.equal(store.save(play(2)),false);assert.equal(calls.length,0,'nothing worth keeping yet');
 assert.equal(store.save(play(4)),true);assert.equal(calls.length,1);assert.equal(calls[0][1],STORAGE_KEY);
 assert.equal(store.save(play(4)),true);assert.equal(calls.length,1,'an unchanged save is not rewritten');
 assert.equal(store.save(play(5)),true);assert.equal(calls.length,2);
 assert.equal(store.clear(),true);assert.deepEqual(calls.at(-1),['remove',STORAGE_KEY]);
 assert.equal(store.save(play(5)),true);assert.equal(calls.length,4,'after a clear the same state is saved again');
 assert.equal(store.failed,false);
});
test('createStore round trip through a fake storage; load of an empty store is null',()=>{
 const mem=new Map();const storage={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)};
 const a=createStore(storage);assert.equal(a.load(),null);
 a.save(play(16));const b=createStore(storage),r=b.load();assert.equal(r.phase,'notebook');assert.equal(b.failed,false);
 b.clear();assert.equal(createStore(storage).load(),null);
});
test('storage failures never break the lab: get, set and remove may all throw',()=>{
 const boom=()=>{throw new Error('blocked')};
 const store=createStore({getItem:boom,setItem:boom,removeItem:boom});
 assert.doesNotThrow(()=>store.load());assert.equal(store.load(),null);assert.equal(store.failed,true);
 const s2=createStore({getItem:()=>null,setItem:boom,removeItem:()=>{}});assert.equal(s2.save(play(16)),false);assert.equal(s2.failed,true);
 assert.equal(s2.save(play(16)),false,'a failed write is retried next time');
 const s3=createStore({getItem:()=>null,setItem:()=>{},removeItem:boom});assert.equal(s3.clear(),false);assert.equal(s3.failed,true);
 const full=createStore({getItem:()=>null,setItem:()=>{throw new DOMException('quota','QuotaExceededError')},removeItem:()=>{}});assert.equal(full.save(play(16)),false);assert.equal(full.failed,true);
 const none=createStore({});assert.doesNotThrow(()=>none.load());assert.equal(none.failed,true);
 const corrupt=createStore({getItem:()=>'{{{',setItem:()=>{},removeItem:()=>{}});assert.equal(corrupt.load(),null);assert.equal(corrupt.failed,false,'a corrupt save is not a storage failure');
});
test('load does not write: restoring sends no action and touches nothing',()=>{
 const writes=[];const storage={getItem:()=>serialize(play(16)),setItem:(...a)=>writes.push(a),removeItem:(...a)=>writes.push(a)};
 const r=createStore(storage).load();assert.equal(r.phase,'notebook');assert.deepEqual(writes,[]);
});
test('persist.js holds no wording, no DOM and no usage reporting',()=>{
 const src=fs.readFileSync(fileURLToPath(new URL('../assets/microscope-guided/persist.js',import.meta.url)),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'').replace(/\s\/\/.*$/gm,'');
 assert.ok(!/[㐀-鿿]/.test(src));assert.ok(!/\bdocument\b|\bwindow\b|analytics|bhcsScienceTrack/i.test(src));
});
console.log(`${tests} microscope persist tests passed`);
