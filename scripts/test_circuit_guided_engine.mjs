import assert from 'node:assert/strict';
import * as E from '../assets/circuit-guided/engine.js';
import * as M from '../assets/circuit-guided/model.js';

let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name);};
function deepFreeze(o){if(!o||typeof o!=='object'||Object.isFrozen(o))return o;Object.freeze(o);for(const v of Object.values(o))deepFreeze(v);return o;}
function step(state,action){const frozen=deepFreeze(structuredClone(state)),snap=JSON.stringify(frozen),r=E.reduce(frozen,action);assert.equal(JSON.stringify(frozen),snap,'reducer mutated input');return r;}
function accept(state,action){const r=step(state,action);assert.equal(r.accepted,true,`${state.phase} refused ${JSON.stringify(action)}: ${r.reason}`);return r.state;}
function refuse(state,action,reason){const r=step(state,action);assert.equal(r.accepted,false);assert.equal(r.reason,reason);assert.deepEqual(r.state,state);assert.deepEqual(r.events,[]);assert.deepEqual(r.transitions,[]);return r;}
const connect=(w)=>({type:'CONNECT',from:w.from,to:w.to});
const disconnect=(w)=>({type:'DISCONNECT',from:w.from,to:w.to});
const toggle=(value)=>({type:'TOGGLE_SWITCH',value});
const record={type:'RECORD_MEASUREMENT'};
const answer=(compare,question,answer)=>({type:'ANSWER_COMPARE',compare,question,answer});
const cont={type:'CONTINUE'};
function start(){return accept(accept(E.createInitialState(),{type:'START'}),{type:'BEGIN'});}
function wireAll(state,wires){let s=state;for(const w of wires)s=accept(s,connect(w));return s;}
function clearWires(state){let s=state;for(const w of [...s.wires])s=accept(s,disconnect(w));return s;}
function rewire(state,wires){return wireAll(clearWires(state),wires);}
function fullToConcept(){
  let s=start();
  s=wireAll(s,M.FIXED_CIRCUITS.baseline);assert.equal(s.phase,'baseline-measure');s=accept(s,toggle(true));s=accept(s,record);assert.equal(s.phase,'trial1-build');
  s=rewire(s,M.FIXED_CIRCUITS.trial1);assert.equal(s.phase,'trial1-measure');s=accept(s,record);assert.equal(s.phase,'compare1');
  s=accept(s,answer('c1','totalChange','decrease'));s=accept(s,answer('c1','claim','one-path-only'));s=accept(s,cont);assert.equal(s.phase,'trial2-build');
  s=rewire(s,M.FIXED_CIRCUITS.trial2Total);assert.equal(s.phase,'trial2-total');s=accept(s,record);assert.equal(s.phase,'trial2-branch1');
  s=rewire(s,M.FIXED_CIRCUITS.trial2L1);s=accept(s,record);assert.equal(s.phase,'trial2-branch2');
  s=rewire(s,M.FIXED_CIRCUITS.trial2L2);s=accept(s,record);assert.equal(s.phase,'compare2');
  s=accept(s,answer('c2','totalChange','increase'));s=accept(s,answer('c2','branchRelation','sum'));s=accept(s,cont);assert.equal(s.phase,'inference');
  assert.equal(E.conceptEvidence(s),null);s=accept(s,cont);assert.equal(s.phase,'concept');return s;
}

test('initial state contains learner/source fields only',()=>{
  const s=E.createInitialState();assert.deepEqual(s,{phase:'welcome',wires:[],switchClosed:false,records:[],compare:{c1:{totalChange:null,claim:null},c2:{totalChange:null,branchRelation:null}}});
  const json=JSON.stringify(s);for(const k of ['current','voltage','power','brightness','topology','correct','ready','expected'])assert.ok(!json.includes(k),k);
});


test('rejected reducer action returns the exact state object it received',()=>{
  const s=deepFreeze(E.createInitialState());const r=E.reduce(s,{type:'BEGIN'});assert.equal(r.accepted,false);assert.strictEqual(r.state,s);assert.deepEqual(r.events,[]);assert.deepEqual(r.transitions,[]);
});

test('welcome -> mission -> baseline build, and wiring auto-advances only when the structural gate is complete',()=>{
  let s=E.createInitialState();refuse(s,{type:'BEGIN'},'wrong-phase');s=accept(s,{type:'START'});assert.equal(s.phase,'mission');s=accept(s,{type:'BEGIN'});assert.equal(s.phase,'baseline-build');
  for(let i=0;i<M.FIXED_CIRCUITS.baseline.length;i++){s=accept(s,connect(M.FIXED_CIRCUITS.baseline[i]));if(i<M.FIXED_CIRCUITS.baseline.length-1)assert.equal(s.phase,'baseline-build');}
  assert.equal(s.phase,'baseline-measure');
});

test('all five stage gates use structure plus readings, not a fixed wire list',()=>{
  for(const [stage,name] of [['baseline','baseline'],['trial1','trial1'],['trial2-total','trial2Total'],['trial2-L1','trial2L1'],['trial2-L2','trial2L2']]){
    assert.equal(E.structureGate(M.rawFromFixed(name,false),stage).ready,true,stage+' structure');
    assert.equal(E.measurementGate(M.rawFromFixed(name,false),stage).ready,false,stage+' open');
    assert.equal(E.measurementGate(M.rawFromFixed(name,true),stage).ready,true,stage+' live');
  }
});

test('electrically equivalent baseline orientation passes the same gate',()=>{
  const wires=[{from:'bat+',to:'sw.a'},{from:'sw.b',to:'A.+'},{from:'A.-',to:'L1.b'},{from:'L1.a',to:'bat-'},{from:'V.+',to:'L1.b'},{from:'V.-',to:'L1.a'}];
  assert.equal(E.structureGate({wires,switchClosed:false},'baseline').ready,true);assert.equal(E.measurementGate({wires,switchClosed:true},'baseline').ready,true);
});

test('reversed ammeter can satisfy structure but cannot be recorded until polarity is corrected',()=>{
  const wires=structuredClone(M.FIXED_CIRCUITS.baseline).filter((x)=>!['A.+|sw.b','A.-|L1.a'].includes([x.from,x.to].sort().join('|')));
  wires.push({from:'sw.b',to:'A.-'},{from:'A.+',to:'L1.a'});
  assert.equal(E.structureGate({wires,switchClosed:true},'baseline').ready,true);
  const g=E.measurementGate({wires,switchClosed:true},'baseline');assert.equal(g.ready,false);assert.ok(g.reasons.includes('ammeter-not-positive-target'));
});

test('Trial 1 gate requires the voltmeter to structurally measure L1, not an equal-valued L2',()=>{
  const wires=structuredClone(M.FIXED_CIRCUITS.trial1).filter((x)=>!x.from.startsWith('V.')&&!x.to.startsWith('V.'));
  wires.push({from:'V.+',to:'L2.a'},{from:'V.-',to:'L2.b'});
  const g=E.structureGate({wires,switchClosed:true},'trial1');assert.equal(g.ready,false);assert.ok(g.reasons.includes('voltmeter-not-L1'));
});

test('Trial 2B and 2C are distinguished structurally even though both readings are +1 A',()=>{
  assert.equal(E.measurementGate(M.rawFromFixed('trial2L1',true),'trial2-L1').ready,true);
  assert.equal(E.measurementGate(M.rawFromFixed('trial2L2',true),'trial2-L1').ready,false);
  assert.equal(E.measurementGate(M.rawFromFixed('trial2L2',true),'trial2-L2').ready,true);
  assert.equal(E.measurementGate(M.rawFromFixed('trial2L1',true),'trial2-L2').ready,false);
});

test('switch must control every active path; a wire bypass around the switch fails the gate',()=>{
  const wires=structuredClone(M.FIXED_CIRCUITS.baseline);wires.push({from:'sw.a',to:'sw.b'});
  const g=E.structureGate({wires,switchClosed:true},'baseline');assert.equal(g.ready,false);assert.ok(g.reasons.includes('switch-does-not-control-all'));
});

test('source-short, including ammeter across battery, never passes any measurement gate',()=>{
  const wires=[{from:'bat+',to:'A.+'},{from:'A.-',to:'bat-'}];
  for(const stage of ['baseline','trial1','trial2-total','trial2-L1','trial2-L2'])assert.equal(E.measurementGate({wires,switchClosed:true},stage).ready,false,stage);
});

test('wire actions reject invalid, duplicate, missing and limit cases without changing the original state',()=>{
  let s=start();refuse(s,{type:'CONNECT',from:'bat+',to:'wat'},'invalid');refuse(s,{type:'CONNECT',from:'bat+',to:'bat+'},'invalid');
  s=accept(s,{type:'CONNECT',from:'bat+',to:'sw.a'});refuse(s,{type:'CONNECT',from:'sw.a',to:'bat+'},'duplicate-wire');refuse(s,{type:'DISCONNECT',from:'L1.a',to:'L1.b'},'missing-wire');
  const pairs=[];for(let i=0;i<M.TERMINALS.length;i++)for(let j=i+1;j<M.TERMINALS.length;j++)pairs.push({from:M.TERMINALS[i],to:M.TERMINALS[j]});
  const forged={...E.createInitialState(),phase:'baseline-build',wires:pairs.slice(0,M.MAX_WIRES)};refuse(forged,{type:'CONNECT',...pairs[M.MAX_WIRES]},'wire-limit');
});

test('baseline live readings appear immediately from switch state, while RECORD only stores a raw snapshot',()=>{
  let s=wireAll(start(),M.FIXED_CIRCUITS.baseline);assert.equal(s.phase,'baseline-measure');refuse(s,record,'locked');s=accept(s,toggle(true));assert.equal(E.currentGate(s).ready,true);
  const r=step(s,record);assert.equal(r.accepted,true);assert.deepEqual(r.events,[{type:'record-written',trialId:'baseline'}]);assert.equal(r.state.phase,'trial1-build');assert.equal(r.state.records.length,1);
  assert.deepEqual(Object.keys(r.state.records[0]).sort(),['switchClosed','trialId','wires']);const json=JSON.stringify(r.state.records[0]);for(const k of ['current','voltage','power','topology','correct','ready'])assert.ok(!json.includes(k),k);
});

test('forged derived fields in a raw record are ignored and rebuilt from wires',()=>{
  const s={...E.createInitialState(),phase:'compare1',records:[{trialId:'baseline',wires:structuredClone(M.FIXED_CIRCUITS.baseline),switchClosed:true,current:999,correct:true}]};
  const o=E.observationFor(s,'baseline');assert.equal(o.batteryCurrent.value,1);assert.equal(E.trialRecorded(s,'baseline'),true);
});

test('full B1 reducer path reaches Concept with five valid raw records and recomputed compares',()=>{
  const s=fullToConcept();assert.equal(s.records.length,5);assert.deepEqual(s.records.map((r)=>r.trialId),E.RECORD_IDS);assert.equal(E.compareStatus(s).c1.allCorrect,true);assert.equal(E.compareStatus(s).c2.allCorrect,true);
  const c=E.conceptEvidence(s);assert.deepEqual(c,{baseline:{totalCurrent:1,equivalentResistance:6},series:{totalCurrent:.5,equivalentResistance:12,L1Voltage:3},parallel:{totalCurrent:2,equivalentResistance:3,L1Voltage:6,L1Current:1,L2Current:1}});
});

test('formal series/parallel Concept evidence is unavailable before Concept',()=>{
  let s=fullToConcept();const back={...s,phase:'inference'};assert.equal(E.conceptEvidence(back),null);assert.ok(!JSON.stringify(back).includes('"series"'));assert.ok(!JSON.stringify(back).includes('"parallel"'));
});

test('wrong compare answers keep the next phase locked; corrected evidence-derived answers unlock it',()=>{
  let s=start();s=wireAll(s,M.FIXED_CIRCUITS.baseline);s=accept(s,toggle(true));s=accept(s,record);s=rewire(s,M.FIXED_CIRCUITS.trial1);s=accept(s,record);assert.equal(s.phase,'compare1');
  s=accept(s,answer('c1','totalChange','increase'));s=accept(s,answer('c1','claim','always-decrease'));refuse(s,cont,'locked');s=accept(s,answer('c1','totalChange','decrease'));s=accept(s,answer('c1','claim','one-path-only'));s=accept(s,cont);assert.equal(s.phase,'trial2-build');
});

test('bench wiring and switch actions are refused outside bench phases',()=>{
  const s=E.createInitialState();refuse(s,{type:'CONNECT',from:'bat+',to:'sw.a'},'wrong-phase');refuse(s,toggle(true),'wrong-phase');refuse(s,record,'wrong-phase');
});

console.log(`circuit-guided engine: ${tests} tests passed`);
