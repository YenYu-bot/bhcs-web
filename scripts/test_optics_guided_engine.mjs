// I2 gate: guided optics state engine (Spec v1.2 §6.2, §8.1A, §8.2, §8.5, §10). Pure reducer, no DOM.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {calculateLensState,calculateClarity} from '../assets/optics-guided/model.js';
import {reduce,createInitialState,deriveView,rangesFor,hintDirection,compareRecords,expectedRelations,zoneOf,
  PHASES,SCREEN_RANGE,CANDLE_RANGE,HINT_TRAVEL_CM,ZONE_IDS} from '../assets/optics-guided/engine.js';
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};

const deepFreeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.freeze(o);Object.values(o).forEach(deepFreeze)}return o};
// Runs actions against a frozen state (proves purity) and collects everything the engine reports.
function run(state,...actions){
 const events=[],transitions=[],results=[];
 for(const a of actions.flat()){const r=reduce(deepFreeze(state),a);state=r.state;events.push(...r.events);transitions.push(...r.transitions);results.push(r)}
 return {state,events,transitions,results,last:results.at(-1)};
}
const types=(events,t)=>events.filter(e=>e.type===t);
const settle={type:'SETTLE_SCREEN'};
const mS=position=>({type:'MOVE_SCREEN',position}),at=position=>[mS(position),settle],mC=position=>({type:'MOVE_CANDLE',position});
const start=()=>run(createInitialState(),{type:'START'},{type:'BEGIN'}).state;
const trial1=(obs=15)=>run(start(),mS(obs));                       // → trial1-complete
const afterTrial1=(obs=15)=>run(trial1(obs).state,{type:'RECORD'}); // → trial2-move-object
const trial2Find=(obs1=15)=>run(afterTrial1(obs1).state,mC(15));    // → trial2-find-screen
const trial2=(obs1=15,obs2=30)=>run(trial2Find(obs1).state,mS(obs2));
const compare=(o1=15,o2=30)=>run(trial2(o1,o2).state,{type:'RECORD'});
const trial3Move=(o1=15,o2=30)=>run(compare(o1,o2).state,{type:'ANSWER_COMPARE',question:'position',answer:'farther'},{type:'ANSWER_COMPARE',question:'size',answer:'larger'},{type:'CONTINUE'});
const search=(o1=15,o2=30)=>run(trial3Move(o1,o2).state,mC(5));
const unlocked=()=>run(search().state,at(8),at(20),at(35));

test('phase list matches the Spec v1.2 state machine',()=>{
 assert.deepEqual(PHASES,['welcome','mission','trial1-find-screen','trial1-complete','trial1-recorded','trial2-move-object','trial2-find-screen','trial2-complete','trial2-recorded','compare','trial3-move-object','trial3-search-screen','trial3-no-real-screen-image','trial3-view-through-lens','concept','notebook','challenge-1','challenge-2','challenge-3','complete']);
 const s=start();assert.equal(s.phase,'trial1-find-screen');assert.deepEqual([s.f,s.u,s.s],[10,30,20]);
 assert.equal(calculateClarity({lensState:calculateLensState({f:s.f,u:s.u}),screenPosition:s.s}).rawClarityLevel,3,'Trial 1 starts at Lv3');
});

test('contract 1: find → complete is automatic, complete → recorded is a CTA',()=>{
 const t=run(start(),mS(18),mS(16));
 assert.equal(t.state.phase,'trial1-find-screen');assert.deepEqual(t.transitions,[]);
 const sharp=run(t.state,mS(15));
 assert.equal(sharp.state.phase,'trial1-complete');assert.deepEqual(sharp.transitions,['trial1-complete']);
 assert.equal(sharp.state.records[1],null,'reaching sharp does not write a record');
 const rec=run(sharp.state,{type:'RECORD'});
 assert.deepEqual(rec.transitions,['trial1-recorded','trial2-move-object'],'recorded is entered, then the automatic hand-over');
 assert.equal(rec.state.phase,'trial2-move-object');assert.equal(types(rec.events,'record-written').length,1);
 const t2=run(trial2Find().state,mS(25),mS(30));
 assert.equal(t2.state.phase,'trial2-complete');assert.equal(t2.state.records[2],null);
 assert.deepEqual(run(t2.state,{type:'RECORD'}).transitions,['trial2-recorded','compare']);
});

test('contract 2: leaving sharp inside *-complete only disables recording',()=>{
 for(const [label,base,off,on,rec] of [['trial1',trial1().state,18,15,1],['trial2',trial2().state,24,30,2]]){
  assert.equal(deriveView(base).recordEnabled,true,label);
  const away=run(base,mS(off));
  assert.equal(away.state.phase,base.phase,label+' does not fall back to find');assert.deepEqual(away.transitions,[]);
  assert.equal(deriveView(away.state).recordEnabled,false);
  const blocked=run(away.state,{type:'RECORD'});
  assert.equal(blocked.last.accepted,false);assert.deepEqual(types(blocked.events,'rejected').map(e=>e.reason),['not-sharp']);assert.equal(blocked.state.records[rec],null);
  const back=run(away.state,mS(on));assert.equal(deriveView(back.state).recordEnabled,true);assert.equal(back.state.phase,base.phase);
  assert.equal(run(back.state,{type:'RECORD'}).state.records[rec].observedScreenPosition,on);
 }
});

test('contract 3: observedScreenPosition is fixed when the record is written, not when sharp is reached',()=>{
 const sharp=trial1(15).state,moved=run(sharp,mS(15.5));
 const rec=run(moved.state,{type:'RECORD'}).state.records[1];
 assert.equal(rec.observedScreenPosition,15.5);assert.equal(rec.theoreticalV,15);
 assert.ok(Math.abs(rec.observedScreenPosition-rec.theoreticalV)<=0.75);
});

test('contract 4: Trial 2 keeps every legal Trial 1 observed value (14.5 / 15 / 15.5)',()=>{
 for(const obs1 of [14.5,15,15.5])for(const obs2 of [29.5,30,30.5]){
  const afterRec=afterTrial1(obs1).state;
  assert.equal(afterRec.s,obs1,'screen does not snap back to 15');assert.equal(rangesFor(afterRec.phase).screen.locked,true);
  const find=run(afterRec,mC(15)).state;
  assert.equal(find.phase,'trial2-find-screen');assert.equal(find.s,obs1);
  assert.equal(deriveView(find).clarity.effectiveClarityLevel,4,'old position is Lv4 at u=15');
  const cmp=compare(obs1,obs2).state,view=deriveView(cmp);
  assert.deepEqual(view.compare.rows.find(r=>r.key==='observedScreenPosition'),{key:'observedScreenPosition',first:obs1,second:obs2});
  assert.equal(cmp.records[1].observedScreenPosition,obs1);assert.equal(cmp.records[2].observedScreenPosition,obs2);
 }
});

test('contract 5: trial2-move-object transitions only at u === 15',()=>{
 const base=afterTrial1().state;
 for(const u of [35,25,20,16,15.5,14,13,12.5,12]){const r=run(base,mC(u));assert.equal(r.state.phase,'trial2-move-object',`u=${u}`);assert.deepEqual(r.transitions,[])}
 assert.equal(run(base,mC(5)).state.u,12,'clamped at the Trial 2 lower bound, so the virtual image is unreachable');
 assert.equal(run(base,mC(100)).state.u,35);
 const bench=run(base,mC(12)).state,v=deriveView(bench);
 assert.deepEqual([v.lensState.imageType,v.lensState.projectionWithinBench,v.clarity.effectiveClarityLevel],['real',false,4],'bench overflow is never sharp');
 const hit=run(base,mC(20),mC(15));assert.deepEqual(hit.transitions,['trial2-find-screen']);assert.equal(hit.state.u,15);
});

test('contract 5b: focus crossing and bench overflow never trigger a transition or a completion',()=>{
 const base=trial3Move().state;assert.equal(base.phase,'trial3-move-object');assert.equal(base.u,15);
 assert.deepEqual([CANDLE_RANGE.trial3.min,CANDLE_RANGE.trial3.max],[5,35]);
 const seen=[];
 for(let u=15;u>=5;u-=.5){
  const r=run(base,mC(u));const lens=deriveView(r.state).lensState;seen.push(lens.imageType);
  if(u>5){assert.equal(r.state.phase,'trial3-move-object',`u=${u}`);assert.deepEqual(r.transitions,[])}
  assert.ok(!/NaN|Infinity/.test(JSON.stringify(deriveView(r.state))),`u=${u}`);
  if(lens.imageType!=='real'||!lens.projectionWithinBench)assert.notEqual(deriveView(r.state).clarity.effectiveClarityLevel,1);
 }
 assert.ok(['real','infinite','virtual'].every(t=>seen.includes(t)),'sweep visits real, infinite (u=10) and virtual');
 const focus=run(base,mC(10)).state;assert.equal(deriveView(focus).lensState.imageType,'infinite');assert.equal(focus.phase,'trial3-move-object');
 assert.equal(run(base,mC(10.5)).state.phase,'trial3-move-object','real image beyond the bench');
 assert.equal(run(base,mC(0)).state.u,5,'clamped at 5');
 assert.deepEqual(run(base,mC(12),mC(10),mC(5)).transitions,['trial3-search-screen'],'only reaching 5 enters the search');
});

test('contract 6: Trial 3 zones are credited only by SETTLE_SCREEN inside trial3-search-screen',()=>{
 const move=trial3Move().state;
 const rej=run(move,mS(10),settle);assert.equal(rej.last.accepted,true,'settle outside the search is a harmless no-op');assert.equal(rej.state.search.zones.length,0);assert.deepEqual(rej.events.map(e=>e.type),['rejected']);
 const s=search().state;assert.equal(s.phase,'trial3-search-screen');assert.deepEqual(s.search.zones,[],'nothing is credited on entry');
 assert.equal(s.s,30,'screen starts at Trial 2 observed');
 assert.deepEqual(run(s,mS(29.5)).state.search.zones,[],'moving alone credits nothing');
 assert.deepEqual(run(s,at(29.5)).state.search.zones,['far']);
 assert.deepEqual(run(s,settle).state.search.zones,['far'],'settling where the screen rests credits that zone');
 const dup=run(s,at(35),at(31),settle);assert.deepEqual(dup.state.search.zones,['far'],'no duplicates');assert.equal(types(dup.events,'zones-explored').length,0);
 assert.deepEqual(run(createInitialState(),settle).events,[]);assert.equal(run(start(),settle).last.accepted,true);
});

test('contract 7: three settled zones only unlock the CTA; the learner confirms',()=>{
 const s=search().state;
 const near=run(s,at(8));assert.deepEqual(near.state.search.zones,['near']);assert.deepEqual(types(near.events,'zones-explored'),[]);
 const mid=run(near.state,at(20));assert.deepEqual(mid.state.search.zones,['near','middle']);assert.equal(types(mid.events,'zones-explored')[0].count,2);
 assert.equal(mid.state.search.ctaUnlocked,false,'two zones do not unlock');assert.equal(types(mid.events,'zones-complete').length,0);
 const r=run(mid.state,at(35));
 assert.deepEqual(r.state.search.zones,['near','middle','far']);assert.equal(r.state.search.ctaUnlocked,true);
 assert.equal(r.state.phase,'trial3-search-screen','no automatic transition');assert.deepEqual(r.transitions,[]);assert.equal(types(r.events,'zones-complete').length,1);
 const early=run(search().state,at(20),{type:'CONFIRM_NO_REAL_IMAGE'});
 assert.equal(early.last.accepted,false);assert.equal(early.state.phase,'trial3-search-screen');assert.equal(early.state.records[3],null);
 const done=run(r.state,{type:'CONFIRM_NO_REAL_IMAGE'});
 assert.deepEqual(done.transitions,['trial3-no-real-screen-image']);
 const rec=done.state.records[3];
 assert.deepEqual([rec.trial,rec.observedScreenPosition,rec.imageType,rec.imageOrientation,rec.projectable,rec.projectionWithinBench,rec.clarity,rec.rawClarityLevel],[3,null,'virtual','upright',false,false,4,null]);
 assert.deepEqual(rec.search,{searchedZones:['near','middle','far'],screenImageFound:false});assert.deepEqual(rec.changedVariables,['u']);
 assert.equal(rec.theoreticalV,-10);assert.equal(rec.magnification,2);
});

test('contract 7b: sweeping across the bench without settling credits nothing',()=>{
 const sweep=run(search().state,mS(28),mS(20),mS(12),mS(8));
 assert.deepEqual(sweep.state.search.zones,[]);assert.equal(sweep.state.search.ctaUnlocked,false);
 assert.deepEqual(run(search().state,mS(8),mS(40),mS(8),mS(40),mS(8)).state.search.zones,[]);
 assert.deepEqual(run(search().state,mS(8)).state.s,8);
 const one=run(search().state,mS(8),settle);assert.deepEqual(one.state.search.zones,['near'],'a 30 → 8 drag released at 8 is one observation');
 assert.equal(one.state.search.ctaUnlocked,false);
 // keyboard-style: one step + settle each time
 const kb=run(search().state,at(25),at(20),at(15));assert.deepEqual(kb.state.search.zones,['near','middle'],'far was never settled in');
});

test('contract 8: zoneOf — 16.5 and 28.5 each belong to exactly one zone; null outside the bench',()=>{
 for(const [s,z] of [[8,'near'],[16.5,'near'],[16.99,'near'],[17,'middle'],[28.5,'middle'],[28.99,'middle'],[29,'far'],[40,'far']])assert.equal(zoneOf(s),z,String(s));
 for(let s=8;s<=40;s+=.5)assert.equal(ZONE_IDS.filter(z=>zoneOf(s)===z).length,1);
 for(const s of [7.99,40.01,0,100,-5,NaN,Infinity,null,undefined,'20'])assert.equal(zoneOf(s),null,String(s));
});

test('contract 9: hint direction comes only from the model and is disabled without a finite on-bench target',()=>{
 const at=(u,s)=>({...createInitialState(),phase:'trial1-find-screen',u,s});
 assert.equal(hintDirection(at(30,20)),'left');assert.equal(hintDirection(at(30,10)),'right');assert.equal(hintDirection(at(15,15)),'right');assert.equal(hintDirection(at(30,15)),null,'already at the target');
 for(const [u,why] of [[5,'virtual'],[8,'virtual'],[10,'infinite'],[12,'bench overflow'],[10.5,'bench overflow']])for(const s of [8,20,40])assert.equal(hintDirection(at(u,s)),null,`${why} u=${u}`);
 const src=fs.readFileSync(fileURLToPath(new URL('../assets/optics-guided/engine.js',import.meta.url)),'utf8');
 assert.ok(!/\bu\s*-\s*f\b|\bf\s*\*\s*u\b|1\s*\/\s*f\b|-\s*v\s*\/\s*u/.test(src.replace(/\/\/.*$/gm,'')),'engine contains no optics formula');
 // wrong-direction: 3 cm of continuous retreat, once per find phase
 const w=run(start(),mS(21),mS(22));assert.equal(types(w.events,'wrong-direction').length,0);
 const w3=run(w.state,mS(23));assert.equal(types(w3.events,'wrong-direction').length,1);
 assert.equal(types(run(w3.state,mS(24),mS(25)).events,'wrong-direction').length,0,'fires once per trial');
 const reset=run(start(),mS(22),mS(21),mS(22),mS(23));assert.equal(types(reset.events,'wrong-direction').length,0,'moving back toward the target resets the run');
 const away=run(trial2Find().state,mS(13),mS(12),mS(11));assert.equal(types(away.events,'wrong-direction').length,1,'Trial 2 (target 30, started at 15) retreating left');
 assert.equal(types(run(search().state,mS(20),mS(15),mS(10),mS(8)).events,'wrong-direction').length,0,'never in Trial 3');
});

test('contract 9b: stall hints escalate by lack of progress; level 3 gives a side, never a number',()=>{
 let st=start(),all=[],k=0;
 const osc=n=>{for(let i=0;i<n;i++){const r=run(st,mS(k++%2===0?21:20));st=r.state;all.push(...r.events.map(e=>({...e,at:all.length})))}};
 osc(9);assert.deepEqual(types(all,'hint'),[]);
 osc(1);assert.deepEqual(types(all,'hint').map(h=>h.level),[1]);
 osc(10);assert.deepEqual(types(all,'hint').map(h=>h.level),[1,2]);
 osc(10);const hints=types(all,'hint');assert.deepEqual(hints.map(h=>h.level),[1,2,3]);
 assert.deepEqual([hints[2].kind,hints[2].direction],['direction','left']);
 assert.ok(!JSON.stringify(hints).includes('15'),'does not leak the answer');
 assert.deepEqual(HINT_TRAVEL_CM,[10,20,30]);
 // real progress resets travel without re-showing a level
 const p=run(start(),mS(19),mS(18));assert.deepEqual(types(p.events,'hint'),[]);
 // Trial 2: direction is 'right'
 let t2=trial2Find().state;const ev=[];for(let i=0;i<30;i++){const r=run(t2,mS(i%2?15:14));t2=r.state;ev.push(...r.events)}
 const h2=types(ev,'hint');assert.deepEqual(h2.map(h=>h.level),[1,2,3]);assert.equal(h2[2].direction,'right');
 // a large single jump reports only the highest new level
 const big=run(start(),mS(40),mS(8),mS(40));assert.ok(types(big.events,'hint').length<=2);
});

test('contract 9c: Trial 3 uses search-progress hints, never a direction',()=>{
 let st=search().state;const ev=[];
 for(let i=0;i<40;i++){const r=run(st,mS(i%2?31:40));st=r.state;ev.push(...r.events)}
 const hints=types(ev,'hint');assert.deepEqual(hints.map(h=>h.level),[1,2,3]);
 assert.ok(hints.every(h=>h.direction===undefined));
 assert.deepEqual(hints[2].unexplored,['near','middle','far'],'nothing settled yet');
 let st2=run(search().state,at(31)).state;const ev2=[];for(let i=0;i<40;i++){const r=run(st2,mS(i%2?31:40));st2=r.state;ev2.push(...r.events)}
 assert.deepEqual(types(ev2,'hint').at(-1).unexplored,['near','middle'],'a settled zone drops out of the progress hint');
 const reset=run(search().state,mS(40),mS(31),mS(40),at(8));assert.equal(reset.state.hints.travel,0,'a newly settled zone counts as progress');
 assert.ok(types(ev,'first-screen-move').length===1);
});

test('contract 10: a recorded trial is never written or celebrated twice',()=>{
 const s=afterTrial1().state,rec1=s.records[1];
 const again=run(s,{type:'RECORD'});assert.equal(again.last.accepted,false);assert.deepEqual(again.state.records[1],rec1);assert.equal(types(again.events,'record-written').length,0);
 assert.equal(types(again.events,'rejected')[0].reason,'already-recorded');
 const back=run(s,mC(30),mC(29),mC(30));  // original result rebuilt
 assert.equal(types(back.events,'record-written').length,0);assert.deepEqual(back.transitions,[]);
 assert.equal(types(back.events,'result-already-recorded').length,1,'edge-triggered: once per return');
 assert.equal(types(run(back.state,mC(30)).events,'result-already-recorded').length,0);
 assert.deepEqual(back.state.records[1],rec1);
 const full=run(createInitialState(),{type:'START'},{type:'BEGIN'},mS(15),{type:'RECORD'},{type:'RECORD'},mC(15),mS(30),{type:'RECORD'},{type:'RECORD'});
 assert.equal(types(full.events,'record-written').length,2);
 assert.deepEqual(Object.values(full.state.records).map(r=>r&&r.trial),[1,2,null]);
 // trial 3 returning to the Trial 2 configuration
 const t3=trial3Move().state,ret=run(t3,mC(14),mC(15));assert.equal(types(ret.events,'result-already-recorded').length,1);
});

test('locks, ranges and invalid input',()=>{
 assert.equal(rangesFor('trial1-find-screen').candle.locked,true);assert.deepEqual(rangesFor('trial1-find-screen').screen,{locked:false,min:8,max:40});
 assert.deepEqual(rangesFor('trial2-move-object').candle,{locked:false,min:12,max:35});assert.equal(rangesFor('trial2-move-object').screen.locked,true);
 assert.deepEqual(rangesFor('trial3-move-object').candle,{locked:false,min:5,max:35});
 for(const p of ['welcome','mission','compare','trial3-no-real-screen-image','trial3-view-through-lens','concept','notebook','challenge-1','complete','trial1-recorded'])assert.deepEqual(rangesFor(p),{candle:{locked:true},screen:{locked:true}},p);
 const t1=start(),rej=run(t1,mC(25));assert.equal(rej.last.accepted,false);assert.equal(rej.state.u,30);assert.equal(types(rej.events,'rejected')[0].reason,'locked');
 assert.equal(run(afterTrial1().state,mS(20)).last.accepted,false,'screen locked while moving the candle');
 assert.equal(run(t1,mS(100)).state.s,SCREEN_RANGE.max);assert.equal(run(t1,mS(0)).state.s,SCREEN_RANGE.min);
 for(const bad of [NaN,Infinity,'20',null,undefined]){const r=run(t1,mS(bad));assert.equal(r.last.accepted,false);assert.deepEqual(r.state,t1);assert.equal(types(r.events,'rejected')[0].reason,'invalid')}
 assert.equal(run(t1,{type:'NOPE'}).last.accepted,false);assert.equal(run(t1,{type:'RECORD'}).last.accepted,false);
 assert.equal(run(createInitialState(),mS(20)).last.accepted,false);
});

test('compare: built from records, controlled-variable rule, derived answers',()=>{
 const c=deriveView(compare().state).compare;
 assert.deepEqual([c.status,c.directComparable,c.changedVariables,c.positionChange,c.sizeChange],['single',true,['u'],'farther','larger']);
 assert.deepEqual(compare().state.records[2].changedVariables,['u']);assert.deepEqual(compare().state.records[1].changedVariables,[]);
 const rec=(f,u,obs)=>{const l=calculateLensState({f,u});return {f,u,observedScreenPosition:obs,absoluteMagnification:l.absoluteMagnification}};
 assert.deepEqual([compareRecords(rec(10,30,15),rec(10,15,30)).status,compareRecords(rec(10,30,15),rec(12,15,60)).status,compareRecords(rec(10,30,15),rec(10,30,15)).status],['single','multiple','none']);
 assert.equal(compareRecords(rec(10,30,15),rec(12,15,60)).directComparable,false);
 const crafted={...createInitialState(),phase:'compare',records:{1:rec(10,15,30),2:rec(10,30,15),3:null}};
 const v=deriveView(crafted).compare;assert.deepEqual([v.positionChange,v.sizeChange],['closer','smaller'],'answers follow the data, not a hard-coded 15 → 30');
 // gate
 const c0=compare().state;
 const wrong=run(c0,{type:'ANSWER_COMPARE',question:'position',answer:'closer'},{type:'ANSWER_COMPARE',question:'size',answer:'larger'},{type:'CONTINUE'});
 assert.equal(wrong.state.phase,'compare');assert.equal(wrong.last.accepted,false);
 const right=run(wrong.state,{type:'ANSWER_COMPARE',question:'position',answer:'farther'},{type:'CONTINUE'});
 assert.deepEqual(right.transitions,['trial3-move-object']);
 assert.equal(run(c0,{type:'ANSWER_COMPARE',question:'bogus',answer:'x'}).last.accepted,false);
});

const toNotebook=()=>{
 const st=run(unlocked().state,{type:'CONFIRM_NO_REAL_IMAGE'}).state;
 return run(st,{type:'VIEW_THROUGH_LENS'},{type:'CONTINUE'},{type:'CONTINUE'}).state;
};
const toChallenges=()=>run(toNotebook(),{type:'SAVE_CONCLUSION',fields:{level:'A',relationPosition:'farther',relationSize:'larger'}},{type:'CONTINUE'}).state;
const ans=(id,step,choice)=>({type:'ANSWER_CHALLENGE',id,step,choice});

test('after Trial 3 the machine runs linearly into the notebook',()=>{
 let st=run(unlocked().state,{type:'CONFIRM_NO_REAL_IMAGE'}).state;
 assert.equal(run(st,{type:'CONTINUE'}).last.accepted,false,'view-through-lens must be requested first');
 const view=run(st,{type:'VIEW_THROUGH_LENS'});assert.deepEqual(view.transitions,['trial3-view-through-lens']);
 const nb=run(view.state,{type:'CONTINUE'},{type:'CONTINUE'});assert.equal(nb.state.phase,'notebook');
});

test('notebook: each level has its own readiness rule; fields are validated and capped',()=>{
 const nb=toNotebook();
 assert.equal(run(nb,{type:'CONTINUE'}).last.accepted,false,'no level chosen yet');
 // Level A: both choices
 const a1=run(nb,{type:'SAVE_CONCLUSION',fields:{level:'A',relationPosition:'farther'}});assert.equal(deriveView(a1.state).notebook.ready,false);assert.equal(run(a1.state,{type:'CONTINUE'}).last.accepted,false);
 const a2=run(a1.state,{type:'SAVE_CONCLUSION',fields:{relationSize:'larger'}});assert.equal(deriveView(a2.state).notebook.ready,true);assert.equal(run(a2.state,{type:'CONTINUE'}).state.phase,'challenge-1');
 // Level B: a sentence; choices of Level A do not count
 const b0=run(nb,{type:'SAVE_CONCLUSION',fields:{level:'B',relationPosition:'farther',relationSize:'larger'}});assert.equal(deriveView(b0.state).notebook.ready,false);
 assert.equal(deriveView(run(b0.state,{type:'SAVE_CONCLUSION',fields:{freeText:'  '}}).state).notebook.ready,false,'whitespace is not an answer');
 assert.equal(deriveView(run(b0.state,{type:'SAVE_CONCLUSION',fields:{freeText:'更遠'}}).state).notebook.ready,true);
 // Level C: both answers
 const c1=run(nb,{type:'SAVE_CONCLUSION',fields:{level:'C',evidenceText:'物距變小，像距變大'}});assert.equal(deriveView(c1.state).notebook.ready,false);
 assert.equal(deriveView(run(c1.state,{type:'SAVE_CONCLUSION',fields:{limitationText:'不知道別的焦距'}}).state).notebook.ready,true);
 // the other levels' text is kept (one notebook, three ways to write it)
 const keep=run(nb,{type:'SAVE_CONCLUSION',fields:{level:'B',freeText:'我的話'}},{type:'SAVE_CONCLUSION',fields:{level:'A'}});assert.equal(keep.state.conclusion.freeText,'我的話');
 // validation: unknown enums and non-strings are rejected whole; unknown keys are ignored; text is capped
 for(const fields of [{level:'D'},{relationPosition:'up'},{relationSize:3},{freeText:5},{level:'A',relationPosition:'nope'}]){const r=run(nb,{type:'SAVE_CONCLUSION',fields});assert.equal(r.last.accepted,false,JSON.stringify(fields));assert.deepEqual(r.state.conclusion,nb.conclusion)}
 assert.equal(run(nb,{type:'SAVE_CONCLUSION',fields:{freeText:'x'.repeat(5000)}}).state.conclusion.freeText.length,1000);
 const ign=run(nb,{type:'SAVE_CONCLUSION',fields:{bogus:1,freeText:'ok'}});assert.equal('bogus' in ign.state.conclusion,false);assert.equal(ign.state.conclusion.freeText,'ok');
 assert.equal(run(start(),{type:'SAVE_CONCLUSION',fields:{freeText:'x'}}).last.accepted,false,'only inside the notebook');
 assert.deepEqual(Object.keys(nb.conclusion),['level','relationPosition','relationSize','freeText','evidenceText','limitationText'],'studentConclusion schema');
});

test('notebook Level A: the structured answer must match what the records show (engine gate, not just UI)',()=>{
 const nb=toNotebook();
 const A=(position,size)=>run(nb,{type:'SAVE_CONCLUSION',fields:{level:'A',relationPosition:position,relationSize:size}});
 for(const [p,sz,label] of [['closer','larger','position wrong'],['farther','smaller','size wrong'],['closer','smaller','both wrong'],['same','same','both "unchanged"'],['farther',null,'only one answered'],[null,null,'none']]){
  const r=A(p,sz);assert.equal(deriveView(r.state).notebook.ready,false,label);
  const c=run(r.state,{type:'CONTINUE'});assert.equal(c.last.accepted,false,label);assert.equal(c.state.phase,'notebook');
  assert.equal(r.state.conclusion.relationPosition,p,'the learner\'s choice is kept, not reset');assert.equal(r.state.conclusion.relationSize,sz);
 }
 const ok=A('farther','larger');assert.equal(deriveView(ok.state).notebook.ready,true);assert.equal(run(ok.state,{type:'CONTINUE'}).state.phase,'challenge-1');
 // changing a wrong answer to the right one unlocks it
 assert.equal(run(A('closer','larger').state,{type:'SAVE_CONCLUSION',fields:{relationPosition:'farther'}},{type:'CONTINUE'}).state.phase,'challenge-1');
 // Level B / C stay free expression; wrong Level A choices lying around do not block them
 assert.equal(deriveView(run(A('closer','smaller').state,{type:'SAVE_CONCLUSION',fields:{level:'B',freeText:'我的看法'}}).state).notebook.ready,true);
 assert.equal(deriveView(run(A('closer','smaller').state,{type:'SAVE_CONCLUSION',fields:{level:'C',evidenceText:'我的證據',limitationText:'我的限制'}}).state).notebook.ready,true);
 // the expected answer comes from the records, not from a constant
 const swapped={...nb,records:{1:nb.records[2],2:nb.records[1],3:nb.records[3]}};
 const sw=(p,sz)=>run(swapped,{type:'SAVE_CONCLUSION',fields:{level:'A',relationPosition:p,relationSize:sz}});
 assert.equal(deriveView(sw('farther','larger').state).notebook.ready,false,'with the records reversed, "farther/larger" is no longer right');
 assert.equal(deriveView(sw('closer','smaller').state).notebook.ready,true);
 assert.deepEqual(expectedRelations(nb.records),{position:'farther',size:'larger'});assert.equal(expectedRelations({1:null,2:null,3:null}),null);
 assert.equal(deriveView({...nb,records:{1:null,2:null,3:null},conclusion:{...nb.conclusion,level:'A',relationPosition:'farther',relationSize:'larger'}}).notebook.ready,false,'no records → nothing to match');
});

test('challenges: sequential steps, retry rules, attempts, locked once right, note after success',()=>{
 const ch=toChallenges();assert.equal(ch.phase,'challenge-1');
 assert.equal(run(ch,{type:'CONTINUE'}).last.accepted,false,'cannot skip a challenge');
 // wrong answers can be changed; attempts are counted; nothing says what the answer is
 let r=run(ch,ans(1,'adjust','candle'));const w=types(r.events,'challenge-answered')[0];assert.deepEqual([w.correct,w.attempts],[false,1]);
 assert.equal(JSON.stringify(r.state.challenges[1]).includes('screen'),false);
 r=run(r.state,ans(1,'adjust','lens'));assert.equal(types(r.events,'challenge-answered')[0].attempts,2);
 assert.equal(run(r.state,{type:'CONTINUE'}).last.accepted,false);
 r=run(r.state,ans(1,'adjust','screen'));assert.equal(types(r.events,'challenge-answered')[0].correct,true);assert.equal(r.state.challenges[1].steps.adjust.attempts,3);
 assert.equal(run(r.state,ans(1,'adjust','candle')).last.accepted,false,'a solved step stays solved');
 assert.equal(deriveView(r.state).challenge.allCorrect,true);
 // invalid input
 for(const bad of [ans(1,'nope','screen'),ans(1,'adjust','banana'),ans(2,'project','no'),{type:'ANSWER_CHALLENGE',id:1,step:'adjust'}]){assert.equal(run(ch,bad).last.accepted,false,JSON.stringify(bad))}
 // challenge 2 has a follow-up that opens only after the first step
 const c2=run(r.state,{type:'CONTINUE'}).state;assert.equal(c2.phase,'challenge-2');
 assert.equal(run(c2,ans(2,'kind','virtual')).last.accepted,false,'follow-up is locked');
 assert.equal(deriveView(c2).challenge.steps.map(s=>s.unlocked).join(),'true,false');
 let c=run(c2,ans(2,'project','yes'));assert.equal(types(c.events,'challenge-answered')[0].correct,false);
 c=run(c.state,ans(2,'project','no'));assert.equal(deriveView(c.state).challenge.steps.map(s=>s.unlocked).join(),'true,true');assert.equal(run(c.state,{type:'CONTINUE'}).last.accepted,false,'both steps are needed');
 c=run(c.state,ans(2,'kind','real-large'),ans(2,'kind','virtual'));assert.equal(deriveView(c.state).challenge.allCorrect,true);
 // challenge 3: the note opens after the answer, is capped, and is not required
 const c3=run(c.state,{type:'CONTINUE'}).state;assert.equal(c3.phase,'challenge-3');
 assert.equal(run(c3,{type:'SAVE_CHALLENGE_NOTE',id:3,text:'x'}).last.accepted,false,'locked until answered');
 const done=run(c3,ans(3,'why','far'),ans(3,'why','absorb'),ans(3,'why','virtual'));assert.equal(done.state.challenges[3].steps.why.attempts,3);
 const note=run(done.state,{type:'SAVE_CHALLENGE_NOTE',id:3,text:'y'.repeat(2000)});assert.equal(note.state.challenges[3].note.length,1000);
 assert.equal(run(done.state,{type:'SAVE_CHALLENGE_NOTE',id:3,text:7}).last.accepted,false);
 const end=run(done.state,{type:'CONTINUE'});assert.equal(end.state.phase,'complete');
 assert.equal(run(end.state,{type:'CONTINUE'}).last.accepted,false);assert.ok(!/NaN|Infinity|undefined/.test(JSON.stringify(end.state)));
});

test('RESTART returns to a clean welcome state from anywhere',()=>{
 for(const st of [start(),toNotebook(),toChallenges()]){const r=run(st,{type:'RESTART'});assert.deepEqual(r.state,createInitialState());assert.deepEqual(r.transitions,['welcome'])}
});

test('records come from the model; whole flow is JSON-safe and never leaks NaN / Infinity',()=>{
 const flow=run(createInitialState(),{type:'START'},{type:'BEGIN'},mS(14.5),{type:'RECORD'},mC(20),mC(15),mS(29.5),{type:'RECORD'},
  {type:'ANSWER_COMPARE',question:'position',answer:'farther'},{type:'ANSWER_COMPARE',question:'size',answer:'larger'},{type:'CONTINUE'},mC(10),mC(5),...at(8),...at(20),...at(33),{type:'CONFIRM_NO_REAL_IMAGE'});
 for(const t of [1,2,3]){
  const r=flow.state.records[t],l=calculateLensState({f:r.f,u:r.u});
  assert.equal(r.theoreticalV,l.theoreticalV);assert.equal(r.magnification,l.magnification);assert.equal(r.imageType,l.imageType);assert.equal(r.projectionWithinBench,l.projectionWithinBench);
 }
 assert.deepEqual([flow.state.records[1].observedScreenPosition,flow.state.records[2].observedScreenPosition],[14.5,29.5]);
 assert.deepEqual(flow.state.records[1].changedVariables,[]);
 const json=JSON.stringify(flow.state);assert.ok(!/NaN|Infinity/.test(json));assert.deepEqual(JSON.parse(json),flow.state,'plain JSON data, no undefined');
 assert.equal(flow.state.phase,'trial3-no-real-screen-image');
 const all=run(createInitialState(),{type:'START'}).events;assert.deepEqual(all,[]);
});

console.log(`PASS optics guided engine: ${tests} tests`);
