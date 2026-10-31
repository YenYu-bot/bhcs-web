import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine} from '../../tools/friction-efficiency-desk/engine.mjs';
import {derive,parseAnswer,validateSnapshot,validateRecord,SCHEMA_VERSION,MODEL_VERSION,EXPECTED_ANSWERS,clone,LIMITS} from '../../tools/friction-efficiency-desk/model.mjs';
let serial=0;
const make=()=>new Engine(null,{id:()=>`test-${++serial}`,now:()=> '2026-10-31T05:00:00.000Z'});
function reach(e,s=100,method='pointer'){const op=e.beginOperation(method);assert.ok(op);e.advanceTo(s,op);e.stop(op);}
function pair(){const e=make();assert.equal(e.start().ok,true);reach(e);assert.equal(e.seal().ok,true);assert.equal(e.next().ok,true);reach(e);assert.equal(e.seal().ok,true);return e;}
function distances(e){e.setDistance(0,'slope');e.setDistance(1,'vertical');assert.equal(e.checkDistances().passed,true);}
function calculate(e){distances(e);EXPECTED_ANSWERS.forEach((v,i)=>assert.equal(e.setAnswer(i,String(v)).ok,true));for(let s=0;s<4;s++)assert.deepEqual(e.checkStep(s).passed,[true,true]);}
function complete(e){calculate(e);['surface','internal','useful-over-input'].forEach((v,i)=>e.setConclusion(i,v));assert.equal(e.checkConclusions().passed,true);}

test('independent integer oracle all 202 positions and signed work balance',()=>{
 for(const surface of ['ideal','rough'])for(let s=0;s<=100;s++){
  const d=derive(surface,s),f=surface==='ideal'?6:8;
  assert.equal(d.forceN,f);assert.equal(d.normalN,8);assert.equal(d.hTenthCm,6*s);assert.equal(d.horizontalTenthCm,8*s);
  assert.equal(d.inputCentiJ,f*s);assert.equal(d.usefulCentiJ,6*s);assert.equal(d.internalCentiJ,(f-6)*s);
  assert.equal(d.inputCentiJ,d.usefulCentiJ+d.internalCentiJ);assert.equal(d.inputCentiJ-6*s-(f-6)*s,0);
  assert.equal(d.efficiencyPercent,s===0?null:surface==='ideal'?100:75);
  assert.ok(Object.isFrozen(d));
 }
});
test('seven independently specified anchor values',()=>{
 const anchors=[[0,0,0,0],[1,6,8,2],[25,150,200,50],[50,300,400,100],[75,450,600,150],[99,594,792,198],[100,600,800,200]];
 for(const [s,h,input,internal]of anchors){const d=derive('rough',s);assert.equal(d.hTenthCm,h);assert.equal(d.inputCentiJ,input);assert.equal(d.internalCentiJ,internal);}
});
test('coefficient is not lost energy percentage, counterexamples independent of derive',()=>{
 const friction=.5*8,input=6+friction;assert.equal(input,10);assert.equal(6/input*100,60);assert.equal(friction/input*100,40);assert.notEqual(.5*100,40);
 const changedSlopeF=10*.8+.25*10*.6;assert.equal(changedSlopeF,9.5);assert.equal(8/changedSlopeF,16/19);
});
test('invalid model inputs cannot silently clamp or choose unknown surface',()=>{
 for(const s of [-1,101,0.2,NaN,Infinity,'50',null])assert.throws(()=>derive('ideal',s),RangeError);
 for(const surf of ['other','toString','__proto__',null])assert.throws(()=>derive(surf,1),RangeError);
});
test('strict decimal answers, units and percentages',()=>{
 for(const x of ['6','6.0','6.00',' 6 '])assert.equal(parseAnswer(x,0).status,'correct');
 for(const x of ['', ' '])assert.equal(parseAnswer(x,0).status,'empty');
 for(const x of ['NaN','Infinity','1e2','6J','6+0','-6','.6','6.','6.000','6,0','９','0'.repeat(33)])assert.equal(parseAnswer(x,0).status,'format');
 assert.equal(parseAnswer('75',7).status,'correct');assert.equal(parseAnswer('0.75',7).status,'incorrect');assert.equal(parseAnswer('0',4).status,'correct');
});
test('start has no reading, distance, evidence, operation or stored half-run',()=>{
 const e=make();assert.equal(e.state.phase,'intro');assert.equal(e.beginOperation('pointer'),null);assert.equal(e.start().ok,true);assert.equal(e.state.phase,'ready');assert.equal(e.state.reachedS,0);assert.equal(e.state.positiveAdvanceCount,0);assert.deepEqual(e.snapshot().records,[]);assert.equal(e.snapshot().pair,null);assert.equal(e.state.active,null);assert.ok(Object.isFrozen(e.state));
});
test('live advance floors, does not backtrack, and repeated oscillations cannot pump progress',()=>{
 const e=make();e.start();const op=e.beginOperation('pointer');assert.equal(e.advanceTo(.99,op),false);assert.equal(e.advanceTo(20.99,op),true);assert.equal(e.state.reachedS,20);
 for(let i=0;i<20;i++){assert.equal(e.advanceTo(10,op),false);assert.equal(e.advanceTo(20.99,op),false);}assert.equal(e.state.positiveAdvanceCount,1);
 assert.equal(e.advanceTo(21,op),true);assert.equal(e.state.reachedS,21);assert.deepEqual(e.state.inputMethods,['pointer']);
});
test('stopping/cancelling retains reached position and no phantom work; stale operation ignored',()=>{
 const e=make();e.start();const op=e.beginOperation('pointer');e.advanceTo(47,op);const before=derive('ideal',e.state.reachedS).inputCentiJ;assert.equal(e.stop(op),true);assert.equal(e.state.phase,'held');assert.equal(e.state.reachedS,47);assert.equal(derive('ideal',e.state.reachedS).inputCentiJ,before);assert.equal(e.stop(op),false);assert.equal(e.advanceTo(80,op),false);
 const next=e.beginOperation('pointer');assert.notEqual(next,op);assert.equal(e.state.active.startS,47);e.advanceTo(48,next);e.stop(next);assert.equal(e.state.reachedS,48);
});
test('endpoint during active cannot seal; cancel at endpoint can settle and seal exactly once',()=>{
 const e=make();e.start();const op=e.beginOperation('pointer');e.advanceTo(1000,op);assert.equal(e.state.reachedS,100);assert.equal(e.canSeal,false);assert.equal(e.seal().ok,false);assert.equal(e.state.records.length,0);
 e.stop(op);assert.equal(e.canSeal,true);assert.equal(e.seal().ok,true);const bytes=JSON.stringify(e.state.records);assert.equal(e.seal().ok,false);assert.equal(JSON.stringify(e.state.records),bytes);assert.equal(e.state.records.length,1);
});
test('no-op methods do not contaminate input method evidence; count bounded by positive integer distance',()=>{
 const e=make();e.start();let op=e.beginOperation('keyboard');e.advanceTo(0,op);e.stop(op);assert.deepEqual(e.state.inputMethods,[]);
 for(let s=1;s<=100;s++){op=e.beginOperation(s%2?'button':'keyboard');assert.equal(e.advanceTo(s,op),true);e.stop(op);}
 assert.equal(e.state.positiveAdvanceCount,100);assert.deepEqual(e.state.inputMethods,['button','keyboard']);e.seal();assert.ok(validateRecord(e.state.records[0]));
});
test('second operation cannot hijack active; invalid methods and numbers rejected',()=>{
 const e=make();e.start();assert.equal(e.beginOperation('bad'),null);const op=e.beginOperation('pointer');assert.equal(e.beginOperation('button'),null);
 for(const v of [NaN,Infinity,-Infinity,'10'])assert.equal(e.advanceTo(v,op),false);assert.equal(e.advanceTo(10,'stale'),false);assert.equal(e.state.reachedS,0);e.stop(op);
});
test('redo starts distinct run and rejects stale updates; sealed evidence cannot redo',()=>{
 const e=make();e.start();const run=e.state.runId,op=e.beginOperation('pointer');e.advanceTo(70,op);assert.equal(e.redo().ok,true);assert.notEqual(e.state.runId,run);assert.equal(e.state.reachedS,0);assert.equal(e.advanceTo(100,op),false);assert.deepEqual(e.state.inputMethods,[]);reach(e);e.seal();assert.equal(e.redo().ok,false);assert.equal(e.state.records.length,1);
});
test('two-surface order fixed and immutable evidence',()=>{
 const e=make();assert.equal(e.next().ok,false);e.start();assert.equal(e.seal().ok,false);reach(e);e.seal();const first=e.state.records[0];assert.equal(first.forceN,6);assert.throws(()=>{first.forceN=99;},TypeError);
 e.next();assert.equal(e.state.surfaceId,'rough');assert.equal(e.state.reachedS,0);assert.equal(e.state.positiveAdvanceCount,0);reach(e);e.seal();assert.equal(e.state.phase,'distance');assert.equal(e.state.records[1].forceN,8);assert.notEqual(e.state.records[0].runId,e.state.records[1].runId);assert.equal(e.next().ok,false);assert.ok(e.snapshot());
});
test('reload discards only unsealed run, preserves ideal then permits rough',()=>{
 const e=make();e.start();reach(e,40);const blank=new Engine(e.snapshot());assert.equal(blank.state.phase,'intro');assert.equal(blank.state.reachedS,0);
 reach(e);e.seal();e.next();reach(e,70);const restored=new Engine(e.snapshot());assert.equal(restored.state.phase,'sealed');assert.equal(restored.state.records.length,1);assert.equal(restored.next().ok,true);assert.equal(restored.state.surfaceId,'rough');assert.equal(restored.state.reachedS,0);
});
test('calculation blocked until both valid measurements and checked distance',()=>{
 const e=make();assert.equal(e.setAnswer(0,'6').ok,false);assert.equal(e.checkDistances().ok,false);const p=pair();assert.equal(p.setAnswer(0,'6').ok,false);p.setDistance(0,'vertical');p.setDistance(1,'vertical');assert.equal(p.checkDistances().passed,false);assert.equal(p.setAnswer(0,'6').ok,false);distances(p);assert.equal(p.setAnswer(0,'6').ok,true);assert.equal(p.checkStep(1).ok,false);
});
test('full calculation, conclusions and optional reflection complete',()=>{
 const e=pair();complete(e);assert.equal(e.state.phase,'complete');assert.ok(e.state.answers.passed.every(Boolean));assert.equal(e.state.answers.revisions.length,0);assert.equal(e.saveReflection('8 J 中有 6 J 變為重力位能，2 J 轉為內能。').ok,true);assert.equal(e.state.answers.revisions.length,1);assert.equal(new Engine(e.snapshot()).state.phase,'complete');
});
test('editing then restoring raw invalidates current and downstream checks across reload',()=>{
 const e=pair();complete(e);e.setAnswer(0,'7');assert.equal(e.state.answers.passed.some(Boolean),false);assert.equal(e.state.phase,'calculation');e.setAnswer(0,'6');assert.equal(e.state.answers.passed.some(Boolean),false);const restored=new Engine(e.snapshot());assert.equal(restored.state.answers.passed.some(Boolean),false);assert.equal(restored.state.answers.complete,false);for(let step=0;step<4;step++)e.checkStep(step);assert.equal(e.state.phase,'explanation');assert.equal(e.checkConclusions().passed,true);
});
test('distance editing then restoring revokes every calculation and completion',()=>{
 const e=pair();complete(e);e.setDistance(0,'horizontal');assert.equal(e.state.phase,'distance');assert.equal(e.state.answers.passed.some(Boolean),false);e.setDistance(0,'slope');assert.equal(e.state.answers.distancesPassed,false);e.checkDistances();assert.equal(e.state.answers.passed.some(Boolean),false);assert.equal(e.state.phase,'calculation');
});
test('conclusion editing and changing back requires recheck',()=>{
 const e=pair();complete(e);e.setConclusion(1,'vanished');assert.equal(e.state.phase,'explanation');assert.equal(e.checkConclusions().passed,false);e.setConclusion(1,'internal');assert.equal(e.state.answers.complete,false);assert.equal(e.checkConclusions().passed,true);
});
test('wrong answer checks do not mutate sealed raw evidence',()=>{
 const e=pair();const before=JSON.stringify(e.state.records);distances(e);e.setAnswer(0,'600');e.setAnswer(1,'8');assert.deepEqual(e.checkStep(0).passed,[false,true]);assert.equal(JSON.stringify(e.state.records),before);
});
test('no answer leak in export before checks, selective reveal attributed and preserved',()=>{
 const e=pair();assert.deepEqual(e.exportData().modelCalculations,[]);assert.equal(e.reveal(0).ok,false);distances(e);assert.deepEqual(e.exportData().modelCalculations,[]);e.setAnswer(0,'6');assert.deepEqual(e.exportData().modelCalculations,[]);assert.equal(e.reveal(1).ok,true);let values=e.exportData().modelCalculations;assert.equal(values.length,1);assert.equal(values[0].field,'roughInput');assert.equal(values[0].value,8);assert.equal(values[0].revealed,true);assert.equal(values[0].checked,false);
 e.setAnswer(1,'8');e.checkStep(0);values=e.exportData().modelCalculations;assert.equal(values.length,2);assert.equal(values.find(v=>v.field==='idealInput').revealed,false);assert.equal(new Engine(e.snapshot()).state.answers.revealed[1],e.state.answers.revealed[1]);
});
test('passed booleans in untrusted snapshot are ignored',()=>{
 const e=pair(),snap=clone(e.snapshot());snap.answers.passed=Array(8).fill(true);snap.answers.distancesPassed=true;snap.answers.conclusionsPassed=true;snap.answers.complete=true;const v=validateSnapshot(snap);assert.equal(v.ok,true);assert.equal(v.snapshot.answers.passed.some(Boolean),false);assert.equal(new Engine(snap).state.phase,'distance');
});
test('schema rejects invalid records, pair, unsupported versions, capacities and identity duplication',()=>{
 const e=pair(),snap=clone(e.snapshot());const mutate=fn=>{const s=clone(snap);fn(s);assert.equal(validateSnapshot(s).ok,false);};
 mutate(s=>s.schemaVersion++);mutate(s=>s.modelVersion='future');mutate(s=>s.records[0].forceN=9);mutate(s=>s.records[0].finalSCm=99);mutate(s=>s.records[0].muNumerator=1);mutate(s=>s.records[1].runId=s.records[0].runId);mutate(s=>s.records[1].recordId=s.records[0].recordId);mutate(s=>s.pair.idealRecordId=s.records[1].recordId);mutate(s=>s.records.reverse());mutate(s=>s.records.push(s.records[1]));mutate(s=>s.records[0].positiveAdvanceCount=0);mutate(s=>s.records[0].positiveAdvanceCount=101);mutate(s=>s.records[0].inputMethods=['pointer','pointer']);mutate(s=>s.records[0].inputMethods=['unknown']);mutate(s=>{s.records[0].positiveAdvanceCount=1;s.records[0].inputMethods=['pointer','button'];});mutate(s=>s.answers.pairId='other');mutate(s=>s.answers.raw[0]='x'.repeat(33));mutate(s=>s.answers.revealed[0]='invalid');
});
test('checks cap never evicts old history; reflection cap and raw limits explicit',()=>{
 const e=pair();for(let i=0;i<LIMITS.checks;i++)assert.equal(e.checkDistances().ok,true);const bytes=JSON.stringify(e.snapshot());assert.equal(e.checkDistances().reason,'check-capacity');assert.equal(JSON.stringify(e.snapshot()),bytes);
 const full=pair();complete(full);assert.equal(full.setAnswer(0,'1'.repeat(33)).ok,false);for(let i=0;i<LIMITS.revisions;i++)assert.equal(full.saveReflection(`反思${i}`).ok,true);const old=JSON.stringify(full.snapshot());assert.equal(full.saveReflection('不應寫入').reason,'reflection-capacity');assert.equal(JSON.stringify(full.snapshot()),old);assert.equal(full.saveReflection(' ').ok,false);
});
test('hint/reveal repeat is idempotent; versions require real edits',()=>{
 const e=pair();for(let i=0;i<5;i++)e.useHint(1);assert.deepEqual(e.state.answers.hints,[1]);distances(e);e.reveal(0);const timestamp=e.state.answers.revealed[0];e.reveal(0);assert.equal(e.state.answers.revealed[0],timestamp);e.setAnswer(0,'6');const version=e.state.answers.versions[0];e.setAnswer(0,'6');assert.equal(e.state.answers.versions[0],version);
});
test('history future versions and duplicated check IDs quarantine rather than accept false completion',()=>{
 const e=pair();complete(e);const snap=clone(e.snapshot());snap.answers.checks[0].payload.distanceVersions[0]=10000;assert.equal(validateSnapshot(snap).ok,false);
 const duplicate=clone(e.snapshot());duplicate.answers.checks[1].checkId=duplicate.answers.checks[0].checkId;assert.equal(validateSnapshot(duplicate).ok,false);
});
test('empty and single evidence schemas reject orphan history',()=>{
 const blank={schemaVersion:SCHEMA_VERSION,modelVersion:MODEL_VERSION,records:[],pair:null,answers:null};assert.equal(validateSnapshot(blank).ok,true);blank.answers={};assert.equal(validateSnapshot(blank).ok,false);
 const e=make();e.start();reach(e);e.seal();const s=clone(e.snapshot());s.records[0].surfaceId='rough';s.records[0].forceN=8;s.records[0].muNumerator=1;assert.equal(validateSnapshot(s).ok,false);
});
