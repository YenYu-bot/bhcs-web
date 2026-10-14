// B1 gate: guided microscope state engine (Pilot #3). Pure reducer, no DOM.
import assert from 'node:assert/strict';
import * as M from '../assets/microscope-guided/model.js';
import * as E from '../assets/microscope-guided/engine.js';
const {reduce,createInitialState,deriveView,PHASES}=E;
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};

const deepFreeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.freeze(o);Object.values(o).forEach(deepFreeze)}return o};
function run(state,...actions){
 const events=[],transitions=[],results=[];
 for(const a of actions.flat()){const r=reduce(deepFreeze(state),a);state=r.state;events.push(...r.events);transitions.push(...r.transitions);results.push(r)}
 return {state,events,transitions,results,last:results.at(-1)};
}
const set=(x,y)=>({type:'SET_STAGE',x,y}),move=(dx,dy)=>({type:'MOVE_STAGE',dx,dy}),REC={type:'RECORD'},CONT={type:'CONTINUE'};
const ans=(compare,question,answer)=>({type:'ANSWER_COMPARE',compare,question,answer});
const start=()=>run(createInitialState(),{type:'START'},{type:'BEGIN'}).state;               // trial1-horizontal
const h1=()=>run(start(),set(75,0));                                                          // horizontal-complete
const v0=()=>run(h1().state,REC).state;                                                       // trial1-vertical
const v1=()=>run(v0(),set(0,75));                                                             // vertical-complete
const cmp1=()=>run(v1().state,REC).state;                                                     // compare-direction
const cmp1ok=()=>run(cmp1(),ans('direction','relation','opposite')).state;
const low0=()=>run(cmp1ok(),CONT).state;                                                      // trial2-low
const low1=()=>run(low0(),set(0,0));                                                          // low-complete
const high0=()=>run(low1().state,REC).state;                                                  // trial2-high
const high1=()=>run(high0(),{type:'SET_OBJECTIVE',objective:40});                             // high-complete
const cmp2=()=>run(high1().state,REC).state;                                                  // compare-magnification
const cmp2ok=()=>run(cmp2(),ans('magnification','field','smaller'),ans('magnification','count','fewer')).state;

test('phase list matches the B1 state machine',()=>{
 assert.deepEqual([...PHASES],['welcome','mission','trial1-horizontal','trial1-horizontal-complete','trial1-vertical','trial1-vertical-complete','compare-direction','trial2-low','trial2-low-complete','trial2-high','trial2-high-complete','compare-magnification','concept','notebook','challenge-1','challenge-2','challenge-3','complete']);
});
test('initial state is plain data with no answer key',()=>{
 const s=createInitialState();assert.equal(s.phase,'welcome');
 assert.deepEqual(s.compare,{direction:{relation:null},magnification:{field:null,count:null}});
 assert.doesNotThrow(()=>JSON.stringify(s));
 assert.ok(!/correct|answerKey|expected/i.test(JSON.stringify(Object.keys(s).concat(Object.keys(s.compare)))));
});
test('START and BEGIN reach Trial 1 horizontal with the e on the right of the view',()=>{
 const s=start();assert.equal(s.phase,'trial1-horizontal');
 const v=deriveView(s);assert.ok(v.positions.e.x>M.VIEW_CENTER.x);near(v.positions.e.y,M.VIEW_CENTER.y);
 assert.equal(v.target.centered,false);
});
function near(a,b){assert.ok(Math.abs(a-b)<1e-9,`expected ${b}, got ${a}`)}
test('Trial 1 horizontal: slide RIGHT brings the e to the centre and completes',()=>{
 const r=run(start(),move(20,0));assert.equal(r.state.phase,'trial1-horizontal');
 const before=deriveView(start()).target.distance,after=deriveView(r.state).target.distance;assert.ok(after<before);
 const done=run(r.state,move(55,0));assert.equal(done.state.phase,'trial1-horizontal-complete');
 assert.deepEqual(done.transitions.at(-1),{from:'trial1-horizontal',to:'trial1-horizontal-complete'});
});
test('Trial 1 horizontal: slide LEFT sends the e further right and never completes',()=>{
 const r=run(start(),move(-20,0));assert.equal(r.state.phase,'trial1-horizontal');
 assert.ok(deriveView(r.state).positions.e.x>deriveView(start()).positions.e.x);
 assert.ok(deriveView(r.state).target.distance>deriveView(start()).target.distance);
});
test('Trial 1 vertical: e starts above the centre; slide UP completes, slide DOWN is worse',()=>{
 const s=v0();assert.equal(s.phase,'trial1-vertical');
 assert.ok(deriveView(s).positions.e.y<M.VIEW_CENTER.y);
 const down=run(s,move(0,-20));assert.ok(deriveView(down.state).positions.e.y<deriveView(s).positions.e.y);assert.equal(down.state.phase,'trial1-vertical');
 const up=run(s,move(0,75));assert.equal(up.state.phase,'trial1-vertical-complete');
});
test('Trial 1 completes only inside the centre tolerance (40 px)',()=>{
 // e offset = 1.6*stageX - 120 px on x: 49 -> -41.6 (outside), 51 -> -38.4 (inside)
 assert.equal(run(start(),set(49,0)).state.phase,'trial1-horizontal');
 assert.equal(run(start(),set(51,0)).state.phase,'trial1-horizontal-complete');
 assert.equal(E.TRIAL1_CENTER_TOLERANCE_PX,40);
});
test('RECORD is rejected until the trial is complete',()=>{
 const r=run(start(),REC);assert.equal(r.last.accepted,false);assert.equal(r.last.reason,'wrong-phase');assert.equal(r.state.records.horizontal,null);
});
test('movement is locked after completion and outside movable phases',()=>{
 assert.equal(run(h1().state,set(0,0)).last.accepted,false);
 assert.equal(h1().state.stage.x,75);
 assert.equal(run(createInitialState(),set(1,1)).last.accepted,false);
 assert.equal(run(cmp1(),set(1,1)).last.reason,'locked');
});
test('stage input is clamped to ±150 and bad input is rejected',()=>{
 const r=run(start(),set(-999,999));assert.deepEqual(r.state.stage,{x:-150,y:150});
 for(const bad of [set(NaN,0),set('1',0),{type:'SET_STAGE'},move(Infinity,0),move(0,undefined)]){
  const x=run(start(),bad);assert.equal(x.last.accepted,false);assert.equal(x.last.reason,'invalid');
 }
});
test('Trial 1 record stores source inputs only (no stageDelta, no image values, no relation)',()=>{
 const rec=run(h1().state,REC).state.records.horizontal;
 assert.deepEqual(Object.keys(rec).sort(),['objective','stageEnd','stageStart','trial']);
 assert.deepEqual(rec,{trial:'horizontal',objective:4,stageStart:{x:0,y:0},stageEnd:{x:75,y:0}});
 const rv=run(v1().state,REC).state.records.vertical;
 assert.deepEqual(rv,{trial:'vertical',objective:4,stageStart:{x:0,y:0},stageEnd:{x:0,y:75}});
});
test('deriveTrial1Observation recomputes slide and image displacement from the source inputs',()=>{
 const h=E.deriveTrial1Observation(run(h1().state,REC).state.records.horizontal);
 assert.deepEqual(h.stageDelta,{x:75,y:0});near(h.imageStart.x,420);near(h.imageEnd.x,300);near(h.imageDelta.x,-120);near(h.imageDelta.y,0);
 const v=E.deriveTrial1Observation(run(v1().state,REC).state.records.vertical);
 assert.deepEqual(v.stageDelta,{x:0,y:75});near(v.imageStart.y,180);near(v.imageEnd.y,300);near(v.imageDelta.y,120);
 for(const bad of [null,undefined,{},{trial:'low'},{trial:'horizontal',objective:5,stageStart:{x:0,y:0},stageEnd:{x:1,y:0}},{trial:'horizontal',objective:4,stageStart:{x:0,y:0},stageEnd:{x:NaN,y:0}},{trial:'horizontal',objective:4,stageStart:{x:0,y:0}}])
  assert.equal(E.deriveTrial1Observation(bad),null);
});
test('horizontal and vertical records both read "opposite" through the pure helper',()=>{
 const s=cmp1();assert.equal(E.recordRelation(s.records.horizontal),'opposite');assert.equal(E.recordRelation(s.records.vertical),'opposite');
 assert.equal(E.judgeDirection(s.records),'opposite');
 // slide LEFT (-x) sends the image RIGHT: still opposite; the numbers have opposite signs
 assert.equal(E.recordRelation({trial:'horizontal',objective:4,stageStart:{x:0,y:0},stageEnd:{x:-5,y:0}}),'opposite');
 // vertical: slide up / image down is opposite although both numeric deltas are positive
 assert.equal(E.recordRelation({trial:'vertical',objective:4,stageStart:{x:0,y:0},stageEnd:{x:0,y:5}}),'opposite');
 assert.equal(E.recordRelation({trial:'vertical',objective:4,stageStart:{x:0,y:3},stageEnd:{x:0,y:3}}),null,'no movement -> no relation');
 assert.equal(E.judgeDirection({horizontal:null,vertical:null}),null);
});
test('forged Trial 1 derived fields cannot flip the verdict',()=>{
 const s=cmp1(),forged=structuredClone(s.records);
 for(const r of [forged.horizontal,forged.vertical]){
  r.imageDelta={x:999,y:999};r.imageStart={x:0,y:0};r.imageEnd={x:999,y:999};r.stageDelta={x:-999,y:-999};r.relation='same';
 }
 assert.equal(E.recordRelation(forged.horizontal),'opposite');assert.equal(E.recordRelation(forged.vertical),'opposite');
 assert.equal(E.judgeDirection(forged),'opposite');
 assert.deepEqual(E.deriveTrial1Observation(forged.horizontal),E.deriveTrial1Observation(s.records.horizontal));
 // and the compare gate follows the recomputed verdict, not the forged fields
 assert.equal(E.compareView({...s,records:forged,compare:{direction:{relation:'opposite'},magnification:{field:null,count:null}}}).directionCorrect,true);
});
test('Trial 1 transitions: horizontal -> vertical -> compare-direction',()=>{
 const r=run(createInitialState(),{type:'START'},{type:'BEGIN'},set(75,0),REC,set(0,75),REC);
 assert.deepEqual(r.transitions.map(t=>t.to),['mission','trial1-horizontal','trial1-horizontal-complete','trial1-vertical','trial1-vertical-complete','compare-direction']);
 assert.deepEqual(r.state.stage,{x:0,y:75},'vertical trial starts from a fresh stage (0,0) and ends where the learner left it');
 assert.deepEqual(r.events.filter(e=>e.type==='record-written').map(e=>e.trial),['horizontal','vertical']);
});
test('Compare 1 stores answers only; CONTINUE needs the answer recomputed from records',()=>{
 const s=cmp1();
 assert.equal(run(s,CONT).last.accepted,false);
 for(const wrong of ['same','unrelated']){const r=run(s,ans('direction','relation',wrong),CONT);assert.equal(r.last.accepted,false);assert.equal(r.state.compare.direction.relation,wrong);}
 const ok=run(s,ans('direction','relation','opposite'),CONT);assert.equal(ok.state.phase,'trial2-low');
 assert.deepEqual(Object.keys(s.compare.direction),['relation']);
 const view=E.compareView(run(s,ans('direction','relation','opposite')).state);assert.equal(view.directionCorrect,true);
});
test('Compare answers are validated and phase-checked; Compare 1 and 2 are separate',()=>{
 const s=cmp1();
 for(const bad of [ans('direction','relation','left'),ans('direction','field','smaller'),ans('nope','x','y'),ans('direction','relation',undefined)])
  assert.equal(run(s,bad).last.accepted,false);
 assert.equal(run(s,ans('magnification','field','smaller')).last.reason,'wrong-phase');
 assert.equal(run(cmp2(),ans('direction','relation','opposite')).last.reason,'wrong-phase');
});
test('Trial 2 low: 4×, B off-centre; centring B shows A, B and C and completes (tolerance 20 px)',()=>{
 const s=low0();assert.equal(s.phase,'trial2-low');assert.equal(s.objective,4);assert.deepEqual(s.stage,{x:100,y:0});
 assert.ok(!deriveView(s).fullyInsideIds.includes('C'),'C is at most partly inside while B is off-centre');
 assert.equal(run(s,set(13,0)).state.phase,'trial2-low','|1.6*13| = 20.8 px is outside');
 const done=run(s,set(12,0));assert.equal(done.state.phase,'trial2-low-complete');
 assert.deepEqual(deriveView(done.state).visibleIds,['A','B','C']);assert.deepEqual(deriveView(done.state).fullyInsideIds,['A','B','C']);
 assert.ok(E.TRIAL2_CENTER_TOLERANCE_PX*M.objectiveScale(40)<M.VIEW_RADIUS_PX,'B stays in the field after switching to 40×');
});
test('Trial 2 low: objective is locked; RECORD stores objective + stage only',()=>{
 assert.equal(run(low0(),{type:'SET_OBJECTIVE',objective:40}).last.reason,'locked');
 const rec=run(low1().state,REC).state.records.low;
 assert.deepEqual(rec,{trial:'low',objective:4,stage:{x:0,y:0}});
});
test('Trial 2 high: starts at 4× with the stage kept; only 40× with B visible completes',()=>{
 const s=high0();assert.equal(s.phase,'trial2-high');assert.equal(s.objective,4);assert.deepEqual(s.stage,{x:0,y:0});
 const mid=run(s,{type:'SET_OBJECTIVE',objective:10});assert.equal(mid.state.phase,'trial2-high');assert.equal(mid.state.objective,10);
 assert.equal(run(s,{type:'SET_OBJECTIVE',objective:7}).last.reason,'invalid');
 assert.equal(high1().state.phase,'trial2-high-complete');
 assert.deepEqual(deriveView(high1().state).visibleIds,['B']);
});
test('Trial 2 high: switching to 40× with B out of view does not complete (recover by going back to 4×)',()=>{
 const lost=run(high0(),set(60,0),{type:'SET_OBJECTIVE',objective:40});
 assert.equal(lost.state.phase,'trial2-high');assert.equal(deriveView(lost.state).target.visible,false);
 const back=run(lost.state,{type:'SET_OBJECTIVE',objective:4},set(0,0),{type:'SET_OBJECTIVE',objective:40});
 assert.equal(back.state.phase,'trial2-high-complete');
});
test('Trial 2 transitions and raw records',()=>{
 const r=run(createInitialState(),{type:'START'},{type:'BEGIN'},set(75,0),REC,set(0,75),REC,ans('direction','relation','opposite'),CONT,set(0,0),REC,{type:'SET_OBJECTIVE',objective:40},REC);
 assert.deepEqual(r.transitions.map(t=>t.to).slice(5),['compare-direction','trial2-low','trial2-low-complete','trial2-high','trial2-high-complete','compare-magnification']);
 assert.deepEqual(r.state.records.high,{trial:'high',objective:40,stage:{x:0,y:0}});
 assert.ok(!/count|visible|field|correct/i.test(JSON.stringify(r.state.records.low)+JSON.stringify(r.state.records.high)));
});
test('Compare 2 answers are recomputed from objective + stage (field smaller, fewer marks)',()=>{
 const s=cmp2();const o=E.observeMagnification(s.records);
 assert.deepEqual(o.lowIds,['A','B','C']);assert.deepEqual(o.highIds,['B']);assert.equal(o.field,'smaller');assert.equal(o.count,'fewer');
 assert.equal(run(s,ans('magnification','field','smaller'),CONT).last.accepted,false,'count still unanswered');
 assert.equal(run(s,ans('magnification','field','larger'),ans('magnification','count','fewer'),CONT).last.accepted,false);
 assert.equal(run(cmp2ok(),CONT).state.phase,'concept');
 assert.equal(E.judgeMagnification({low:null,high:null}),null);
});
test('a forged record cannot flip the verdict: judgement ignores everything but raw inputs',()=>{
 const s=cmp2();const forged=structuredClone(s.records);forged.high.objective=4;
 const o=E.observeMagnification(forged);assert.equal(o.field,'same');assert.equal(o.count,'same');
});
test('recordVisibleIds recomputes the visible markers from objective + stage alone',()=>{
 assert.deepEqual(E.recordVisibleIds({trial:'low',objective:4,stage:{x:0,y:0}}),['A','B','C']);
 assert.deepEqual(E.recordVisibleIds({trial:'high',objective:40,stage:{x:0,y:0},visibleIds:['A','B','C']}),['B'],'a saved visibleIds field is never read');
 assert.deepEqual(E.recordVisibleIds({trial:'low',objective:10,stage:{x:0,y:0}}),['A','B','C'],'10×: A and C only partly in the field, still visible');
});
test('reserved phases advance linearly: concept -> notebook -> challenges -> complete',()=>{
 const r=run(cmp2ok(),CONT,CONT,CONT,CONT,CONT,CONT);
 assert.deepEqual(r.transitions.map(t=>t.to).slice(-6),['concept','notebook','challenge-1','challenge-2','challenge-3','complete']);
 assert.equal(run(r.state,CONT).last.accepted,false);
});
test('illegal actions are rejected and leave state untouched (same object, deep-equal)',()=>{
 const s=createInitialState(),frozen=deepFreeze(structuredClone(s));
 for(const a of [{type:'BEGIN'},REC,CONT,set(1,1),{type:'SET_OBJECTIVE',objective:40},ans('direction','relation','opposite'),{type:'NOPE'},undefined,null]){
  const r=reduce(frozen,a);assert.equal(r.accepted,false);assert.equal(r.state,frozen);assert.deepEqual(r.events,[]);assert.deepEqual(r.transitions,[]);
 }
 assert.equal(reduce(start(),{type:'START'}).accepted,false);
});
test('reduce never mutates its input (deep-frozen walk through the whole flow)',()=>{
 assert.doesNotThrow(()=>cmp2ok());
 const s=deepFreeze(structuredClone(cmp2ok()));assert.doesNotThrow(()=>reduce(s,CONT));
 const a=createInitialState(),b=reduce(a,{type:'START'}).state;assert.notEqual(a,b);assert.equal(a.phase,'welcome');
});
test('state survives a JSON round trip and the flow replays identically',()=>{
 const s=cmp2ok();assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
 assert.equal(reduce(JSON.parse(JSON.stringify(s)),CONT).state.phase,'concept');
});
console.log(`${tests} microscope engine tests passed`);
