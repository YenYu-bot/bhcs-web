import test from 'node:test';
import assert from 'node:assert/strict';
import {CONFIGS,sample,parseNumber} from '../../tools/specific-heat-desk/model.mjs';
import {createEngine} from '../../tools/specific-heat-desk/engine.mjs';
import {createClock} from '../../tools/specific-heat-desk/clock.mjs';
const pair=(reverse=false)=>{const e=createEngine();e.place(0,reverse?'iron100':'water100');e.place(1,reverse?'water100':'iron100');e.start();return e;};
const finish=e=>{e.jump();e.seal();return e;};
const full=()=>{const e=finish(pair());e.prepareMassRound();e.place(0,'iron200');e.start();finish(e);for(const [k,v] of Object.entries({q1:'1260',waterRise:'3',ironRise:'28',materialChoice:'water',q2:'1260',heavyRise:'14',massChoice:'rise-half'}))e.setAnswer(k,v);return e;};
test('independent 18,003-point oracle and exact anchors',()=>{
 for(const [id,m,c] of [['water100',100,4.2],['iron100',100,.45],['iron200',200,.45]])for(let n=0;n<=6000;n++){const t=n/100;assert.ok(Math.abs(sample(id,t).temperature-(20+(21*t)/(m*c)))<1e-10);}
 for(const [id,expected] of [['water100',[20,21,22,23]],['iron100',[20,88/3,116/3,48]],['iron200',[20,74/3,88/3,34]]])for(let i=0;i<4;i++)assert.ok(Math.abs(sample(id,i*20).temperature-expected[i])<1e-10);
 assert.equal((sample('iron100',60).temperature-20)/2,sample('iron200',60).temperature-20);
 for(const t of [NaN,Infinity,-1,60.1,'20'])assert.throws(()=>sample('water100',t));assert.throws(()=>sample('water200',20));assert.ok(Object.isFrozen(CONFIGS.iron200));
});
test('numeric normalization and strict independent unit labels',()=>{for(const x of ['1260',' １，２６０ ','1,260.0'])assert.equal(parseNumber(x),1260);for(const x of ['1,26','1.26 kJ','1260 J','Infinity','','1e3','1,2,60'])assert.ok(Number.isNaN(parseNumber(x)));});
test('reversed pair, no future samples, step and jump provenance',()=>{const e=pair(true);e.advance(19);assert.deepEqual(e.state.run.samples[0].map(x=>x.time),[0]);e.advance(1);assert.deepEqual(e.state.run.samples[0].map(x=>x.time),[0,20]);e.pause();e.advance(5,'step');e.jump();assert.deepEqual(e.state.run.samples[0].map(x=>x.time),[0,20,60]);assert.deepEqual(e.state.run.methods,['play','step','jump']);assert.equal(e.state.phase,'finished');assert.equal(e.state.run.time,60);});
test('sealed pair atomic/idempotent, immutable, replay never mutates',()=>{const e=finish(pair());const before=e.snapshot();e.seal();assert.deepEqual(e.snapshot(),before);assert.equal(e.state.records.length,2);assert.equal(e.state.records[0].runId,e.state.records[1].runId);assert.throws(()=>e.state.records[0].mass=200);assert.equal(e.replay(e.state.records[0].id,30).reading.temperature,21.5);assert.deepEqual(e.snapshot(),before);e.prepareMassRound();e.place(0,'iron200');e.start();assert.equal(e.state.run.ids.length,1);assert.deepEqual(e.state.records,before.records);});
test('invalid setup, repeated start, replacement protection, pause holds',()=>{const e=createEngine();assert.throws(()=>e.start());assert.throws(()=>e.place(0,'iron200'));e.place(0,'iron100');e.place(1,'iron100');assert.throws(()=>e.start());e.place(1,'water100');e.start();const id=e.state.run.id;e.start();assert.equal(e.state.run.id,id);assert.throws(()=>e.place(0,'water100'));assert.throws(()=>e.seal());e.advance(10);e.pause();e.advance(20);assert.equal(e.state.run.time,10);e.start();e.advance(80);assert.equal(e.state.run.time,60);assert.equal(e.state.phase,'finished');});
test('completion revocation, wrong mass card, raw values restored without trusting flags',()=>{const e=full();assert.equal(e.checkAnswers().complete,true);e.setAnswer('q1','2520');assert.equal(e.state.complete,false);assert.equal(e.state.checks.materialChoice,false);assert.match(e.checkAnswers().feedback.q1,/兩份合計/);e.setAnswer('q1','1260');assert.equal(e.state.complete,false);assert.equal(e.checkAnswers().complete,true);const goodMass=e.state.comparisons.mass;e.setComparison('mass',[e.state.records[0].id,e.state.records[2].id]);assert.equal(e.checkAnswers().complete,false);e.setComparison('mass',goodMass);assert.equal(e.state.checks.massChoice,false);assert.equal(e.checkAnswers().complete,true);const saved=e.snapshot();saved.passed=true;saved.checks={q1:true};const restored=createEngine(saved);assert.equal(restored.state.complete,true);assert.equal(restored.checkAnswers().complete,true);saved.answers.q1='2520';assert.equal(createEngine(saved).checkAnswers().complete,false);});
test('restore rejects corrupt/new versions/conditions/samples/broken pairs',()=>{const base=full().snapshot();for(const mutate of [x=>x.schema=2,x=>x.records[0].mass=200,x=>x.records[0].temperature=100,x=>x.records[0].power=42,x=>x.records[0].time=Infinity,x=>x.records[0].samples[1].time=40,x=>x.records.pop()&&x.records.shift(),x=>x.comparisons.material[0]='missing',x=>x.records.push(x.records[0])]){const x=structuredClone(base);mutate(x);assert.throws(()=>createEngine(x));}});
function fakeClock(){let current=0,next=1;const queue=new Map(),all=new Map();const advances=[],pauses=[];const clock=createClock({now:()=>current,requestFrame:cb=>{let id=next++;queue.set(id,cb);all.set(id,cb);return id;},cancelFrame:id=>queue.delete(id),onAdvance:dt=>advances.push(dt),onPause:r=>pauses.push(r)});return {clock,advances,pauses,all,tick(ms){current+=ms;const tasks=[...queue.values()];queue.clear();tasks.forEach(cb=>cb(current));},get current(){return current;}};}
test('clock equivalent foreground partitions, 1x/2x, no hidden catch-up',()=>{const a=fakeClock(),b=fakeClock();a.clock.play();b.clock.play();for(let i=0;i<20;i++)a.tick(100);for(let i=0;i<8;i++)b.tick(250);const total=x=>x.advances.reduce((a,b)=>a+b,0);assert.ok(Math.abs(total(a)-total(b))<1e-10);assert.ok(Math.abs(total(a)-4)<1e-10);a.clock.setVisible(false);a.tick(20000);a.clock.setVisible(true);a.tick(1000);assert.equal(a.clock.playing,false);assert.ok(Math.abs(total(a)-4)<1e-10);a.clock.setSpeed(1);a.clock.play();a.tick(500);assert.ok(Math.abs(total(a)-4.5)<1e-10);});
test('clock long gap fails safe, stale generation callback and blur cannot advance',()=>{const f=fakeClock();f.clock.play();const stale=[...f.all.values()][0];f.tick(1100);assert.equal(f.clock.playing,false);assert.equal(f.advances.length,0);assert.equal(f.pauses.at(-1),'long-gap');f.clock.play();stale(f.current+50);assert.equal(f.advances.length,0);f.tick(100);assert.deepEqual(f.advances,[.2]);f.clock.blur();f.tick(5000);assert.deepEqual(f.advances,[.2]);f.clock.dispose();f.clock.play();assert.equal(f.clock.playing,false);});
test('clock endpoint stops once with engine time exactly sixty',()=>{const e=pair();let t=0,callback;let stops=0;const c=createClock({now:()=>t,requestFrame:cb=>(callback=cb,1),cancelFrame:()=>{},onPause:r=>{if(r==='finished')stops++;},onAdvance:dt=>{e.advance(dt);return e.state.phase==='running';}});c.play();for(let n=0;n<60;n++){t+=500;callback(t);}assert.equal(e.state.run.time,60);assert.equal(e.state.phase,'finished');assert.equal(stops,1);callback(t+500);assert.equal(stops,1);});

test('proofs bind edits and evidence; deleting a paired record removes whole pair and dependent checks',()=>{const e=full();e.checkAnswers();let saved=e.snapshot();saved.answers.q1='2520';const r=createEngine(saved);assert.equal(r.state.checks.q1,false);assert.equal(r.state.checks.q2,true);e.deleteRecord(e.state.records[1].id);assert.equal(e.state.records.length,1);assert.equal(e.state.comparisons.material.length,0);assert.equal(e.state.complete,false);assert.equal(e.state.checks.massChoice,false);assert.doesNotThrow(()=>createEngine(e.snapshot()));});

test('jump regression: arbitrary partial play/step then jump adds only endpoint',()=>{
 for(const elapsed of [0,1,19.9,20,20.1,39.9,40,59.9]){
  const e=pair();if(elapsed)e.advance(elapsed,'step');const observed=e.state.run.samples.map(points=>points.map(p=>p.time));e.pause();e.jump();
  for(let i=0;i<2;i++)assert.deepEqual(e.state.run.samples[i].map(p=>p.time),[...observed[i],60]);
  finish(e);const loaded=createEngine(e.snapshot());for(let i=0;i<2;i++)assert.deepEqual(loaded.state.records[i].samples.map(p=>p.time),[...observed[i],60]);
 }
});
test('genuine checked completion and partial checks persist through JSON roundtrip',()=>{
 const e=full();assert.equal(e.checkAnswers().complete,true);const raw=JSON.stringify(e.snapshot());const r=createEngine(JSON.parse(raw));assert.equal(r.state.complete,true);assert.deepEqual(r.state.checks,e.state.checks);assert.equal(JSON.stringify(r.snapshot()),raw);
 e.setAnswer('heavyRise','15');assert.equal(e.state.checks.q1,true);assert.equal(e.state.checks.q2,false);const partial=createEngine(JSON.parse(JSON.stringify(e.snapshot())));assert.equal(partial.state.checks.q1,true);assert.equal(partial.state.checks.q2,false);assert.equal(partial.state.complete,false);
});
test('malformed proofs and unrelated passed flags never restore checked groups',()=>{
 const e=full();e.checkAnswers();for(const proofs of [undefined,null,{},true,{material:true,mass:true},{material:'passed',mass:'passed'},{material:[],mass:{}},{material:e.snapshot().checkProofs.mass,mass:e.snapshot().checkProofs.material}]){
  const snap=e.snapshot();snap.checkProofs=proofs;snap.passed=true;snap.complete=true;snap.checks=Object.fromEntries(Object.keys(snap.answers).map(k=>[k,true]));const r=createEngine(snap);assert.equal(r.state.complete,false);assert.ok(Object.values(r.state.checks).every(v=>v===false));
 }
 const snap=e.snapshot();snap.answers.materialChoice='iron';const r=createEngine(snap);assert.equal(r.state.checks.materialChoice,false);assert.equal(r.state.checks.massChoice,true);
});
test('60-record cap, maximal user entries and check proofs fit 128 KiB envelope',()=>{
 const e=full();for(let n=1;n<20;n++){e.newMaterialRound();e.place(0,'water100');e.place(1,'iron100');e.start();e.advance(60);e.seal();e.prepareMassRound();e.place(0,'iron200');e.start();e.advance(60);e.seal();}
 assert.equal(e.state.records.length,60);for(const key of Object.keys(e.state.answers))e.setAnswer(key,'漢'.repeat(1000));e.checkAnswers();const payload=e.snapshot();const envelope=JSON.stringify({format:'bhcs.specificHeatDesk.storage',version:1,revision:Number.MAX_SAFE_INTEGER,payload});assert.ok(new TextEncoder().encode(envelope).byteLength<128*1024);assert.equal(createEngine(JSON.parse(JSON.stringify(payload))).state.records.length,60);
 e.newMaterialRound();e.place(0,'water100');e.place(1,'iron100');e.start();e.jump();assert.throws(()=>e.seal(),/封存卡已滿/);assert.equal(e.state.records.length,60);assert.equal(e.state.phase,'finished');
});

test('configuration names reject inherited object properties at every boundary',()=>{
 for(const id of ['toString','constructor','__proto__','hasOwnProperty','valueOf']){
  assert.throws(()=>sample(id,20));assert.throws(()=>createEngine().place(0,id));const x=finish(pair()).snapshot();x.records[0].configId=id;assert.throws(()=>createEngine(x));
 }
 assert.throws(()=>sample({toString:()=> 'water100'},20));
});
test('restore rejects provenance inconsistent with checkpoint observation',()=>{
 const base=finish(pair()).snapshot();
 for(const [methods,times] of [[['jump'],[0,20,40,60]],[['play'],[0,60]],[['step'],[0,20,60]],[['play','step'],[0,60]],[['play','jump'],[0,40,60]],[['jump','play'],[0,60]],[['step','jump','play'],[0,20,60]]]){
  const x=structuredClone(base);for(const r of x.records){r.methods=methods;r.samples=times.map(t=>sample(r.configId,t));}assert.throws(()=>createEngine(x),`${methods} with ${times}`);
 }
 for(const [methods,times] of [[['jump'],[0,60]],[['play','jump'],[0,60]],[['step','jump'],[0,20,60]],[['play','step','jump'],[0,20,40,60]],[['play'],[0,20,40,60]],[['step'],[0,20,40,60]],[['step','play'],[0,20,40,60]]]){
  const x=structuredClone(base);for(const r of x.records){r.methods=methods;r.samples=times.map(t=>sample(r.configId,t));}assert.doesNotThrow(()=>createEngine(x),`${methods} with ${times}`);
 }
});
