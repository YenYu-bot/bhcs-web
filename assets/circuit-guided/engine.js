// Pure state engine for Science Lab 2.0 Pilot #6 B1.
// State stores learner/source inputs only. Circuit readings, topology, readiness and correctness are always derived.
import {
  MAX_WIRES,
  allCurrentsZero,
  exactEquals,
  isTerminal,
  solveCircuit,
} from './model.js';

export const PHASES = Object.freeze([
  'welcome','mission',
  'baseline-build','baseline-measure',
  'trial1-build','trial1-measure','compare1',
  'trial2-build','trial2-total','trial2-branch1','trial2-branch2','compare2',
  'inference','concept',
]);
export const RECORD_IDS = Object.freeze(['baseline','trial1','trial2-total','trial2-L1','trial2-L2']);
export const COMPARE_QUESTIONS = Object.freeze({
  c1:Object.freeze({
    totalChange:Object.freeze(['increase','decrease','same']),
    claim:Object.freeze(['one-path-only','always-decrease','current-consumed']),
  }),
  c2:Object.freeze({
    totalChange:Object.freeze(['increase','decrease','same']),
    branchRelation:Object.freeze(['sum','one-branch','unrelated']),
  }),
});
const COMPARE_PHASE=Object.freeze({c1:'compare1',c2:'compare2'});
const BUILD_TO_MEASURE=Object.freeze({
  'baseline-build':'baseline-measure',
  'trial1-build':'trial1-measure',
  'trial2-build':'trial2-total',
});
const PHASE_STAGE=Object.freeze({
  'baseline-build':'baseline','baseline-measure':'baseline',
  'trial1-build':'trial1','trial1-measure':'trial1',
  'trial2-build':'trial2-total','trial2-total':'trial2-total',
  'trial2-branch1':'trial2-L1','trial2-branch2':'trial2-L2',
});
const RECORD_PHASE=Object.freeze({
  'baseline-measure':'baseline',
  'trial1-measure':'trial1',
  'trial2-total':'trial2-total',
  'trial2-branch1':'trial2-L1',
  'trial2-branch2':'trial2-L2',
});
const NEXT_AFTER_RECORD=Object.freeze({
  'baseline-measure':'trial1-build',
  'trial1-measure':'compare1',
  'trial2-total':'trial2-branch1',
  'trial2-branch1':'trial2-branch2',
  'trial2-branch2':'compare2',
});
const BENCH_PHASES=new Set(Object.keys(PHASE_STAGE));

export function createInitialState(){
  return {
    phase:'welcome',
    wires:[],
    switchClosed:false,
    records:[],
    compare:{
      c1:{totalChange:null,claim:null},
      c2:{totalChange:null,branchRelation:null},
    },
  };
}

const rawOf=(state)=>({wires:state.wires,switchClosed:state.switchClosed});
const wireKey=(a,b)=>a<b?`${a}|${b}`:`${b}|${a}`;
const eq=(reading,exact)=>exactEquals(reading,exact);
const positive=(reading)=>reading!==null && reading.value>0;
const zeroOpen=(wires)=>allCurrentsZero(solveCircuit({wires,switchClosed:false}));

function structureFacts(raw,stage){
  let closed;
  try{closed=solveCircuit({wires:raw.wires,switchClosed:true});}
  catch{return {ready:false,reasons:['invalid-wiring'],closed:null};}
  const reasons=[];
  if(closed.status!=='normal')reasons.push(closed.status);
  if(!zeroOpen(raw.wires))reasons.push('switch-does-not-control-all');
  const total=closed.ammeter?.placement==='total-current';
  const vL1=closed.voltmeter?.across==='L1';
  if(stage==='baseline'){
    if(closed.topology!=='single-L1')reasons.push('need-L1-only');
    if(closed.lamps.L2.inCircuit||closed.lamps.L2.bypassed)reasons.push('L2-must-be-out');
    if(!total)reasons.push('ammeter-not-total');
    if(!vL1)reasons.push('voltmeter-not-L1');
  }else if(stage==='trial1'){
    if(closed.topology!=='one-path')reasons.push('need-one-path-two-lamp');
    if(!total)reasons.push('ammeter-not-total');
    if(!vL1)reasons.push('voltmeter-not-L1');
  }else if(stage==='trial2-total'){
    if(closed.topology!=='two-path')reasons.push('need-two-path-two-lamp');
    if(!total)reasons.push('ammeter-not-total');
    if(!vL1)reasons.push('voltmeter-not-L1');
  }else if(stage==='trial2-L1'){
    if(closed.topology!=='two-path')reasons.push('need-two-path-two-lamp');
    if(closed.ammeter?.placement!=='L1-branch')reasons.push('ammeter-not-L1-branch');
  }else if(stage==='trial2-L2'){
    if(closed.topology!=='two-path')reasons.push('need-two-path-two-lamp');
    if(closed.ammeter?.placement!=='L2-branch')reasons.push('ammeter-not-L2-branch');
  }else reasons.push('unknown-stage');
  return {ready:reasons.length===0,reasons,closed};
}

export function structureGate(raw,stage){
  if(!raw||typeof raw!=='object'||!Array.isArray(raw.wires))return {ready:false,reasons:['invalid-wiring'],closed:null};
  return structureFacts(raw,stage);
}

export function measurementGate(raw,stage){
  const s=structureGate(raw,stage),reasons=[...s.reasons];
  if(raw?.switchClosed!==true)reasons.push('switch-open');
  let live=null;
  try{live=solveCircuit(raw);}catch{reasons.push('invalid-wiring');}
  if(!live||live.status!=='normal'){
    if(live?.status&&!reasons.includes(live.status))reasons.push(live.status);
    return {ready:false,reasons:[...new Set(reasons)],result:live};
  }
  const expected={
    baseline:{battery:'1',ammeter:'1',voltmeter:'6'},
    trial1:{battery:'1/2',ammeter:'1/2',voltmeter:'3'},
    'trial2-total':{battery:'2',ammeter:'2',voltmeter:'6'},
    'trial2-L1':{battery:'2',ammeter:'1'},
    'trial2-L2':{battery:'2',ammeter:'1'},
  }[stage];
  if(!expected)reasons.push('unknown-stage');
  else{
    if(!eq(live.batteryCurrent,expected.battery))reasons.push('wrong-total-current');
    if(!eq(live.ammeter.reading,expected.ammeter)||!positive(live.ammeter.reading))reasons.push('ammeter-not-positive-target');
    if(expected.voltmeter!==undefined && (!eq(live.voltmeter.reading,expected.voltmeter)||!positive(live.voltmeter.reading)))reasons.push('voltmeter-not-positive-target');
  }
  return {ready:reasons.length===0,reasons:[...new Set(reasons)],result:live};
}

export function currentGate(state){
  const stage=PHASE_STAGE[state.phase];
  return stage?measurementGate(rawOf(state),stage):{ready:false,reasons:['not-bench'],result:null};
}

function safeRecord(record,stage){
  if(!record||typeof record!=='object'||record.trialId!==stage||!Array.isArray(record.wires)||record.switchClosed!==true)return null;
  const gate=measurementGate({wires:record.wires,switchClosed:true},stage);
  return gate.ready?gate.result:null;
}
export function observationFor(state,trialId){
  const hits=(state.records??[]).filter((r)=>r?.trialId===trialId).map((r)=>safeRecord(r,trialId)).filter(Boolean);
  return hits.length===1?hits[0]:null;
}
export function trialRecorded(state,trialId){return observationFor(state,trialId)!==null;}
function allRecorded(state){return RECORD_IDS.every((id)=>trialRecorded(state,id));}

function change(a,b){
  if(!a||!b)return null;
  const x=a.batteryCurrent?.value,y=b.batteryCurrent?.value;
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  return y>x?'increase':y<x?'decrease':'same';
}
export function expectedCompare1(state){
  const a=observationFor(state,'baseline'),b=observationFor(state,'trial1');
  const totalChange=change(a,b);if(!totalChange)return null;
  return {totalChange,claim:totalChange==='decrease'?'one-path-only':'always-decrease'};
}
export function expectedCompare2(state){
  const base=observationFor(state,'baseline'),total=observationFor(state,'trial2-total'),l1=observationFor(state,'trial2-L1'),l2=observationFor(state,'trial2-L2');
  if(!base||!total||!l1||!l2)return null;
  const totalChange=change(base,total),sum=(l1.ammeter.reading.value+l2.ammeter.reading.value===total.ammeter.reading.value)?'sum':'unrelated';
  return {totalChange,branchRelation:sum};
}
export function compareStatus(state){
  const judge=(group,expected)=>{
    const answers=state.compare?.[group]??{},out={};
    for(const q of Object.keys(COMPARE_QUESTIONS[group])){const answer=own(answers,q)?answers[q]:null;out[q]={answer,correct:expected!==null&&answer===expected[q]};}
    return {...out,allCorrect:Object.values(out).every((x)=>x.correct)};
  };
  return {c1:judge('c1',expectedCompare1(state)),c2:judge('c2',expectedCompare2(state))};
}
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);

export function conceptEvidence(state){
  if(PHASES.indexOf(state.phase)<PHASES.indexOf('concept')||!allRecorded(state))return null;
  const baseline=observationFor(state,'baseline'),onePath=observationFor(state,'trial1'),twoPath=observationFor(state,'trial2-total');
  return {
    baseline:{totalCurrent:baseline.batteryCurrent.value,equivalentResistance:baseline.equivalentResistance.value},
    series:{totalCurrent:onePath.batteryCurrent.value,equivalentResistance:onePath.equivalentResistance.value,L1Voltage:onePath.lamps.L1.voltage.value},
    parallel:{totalCurrent:twoPath.batteryCurrent.value,equivalentResistance:twoPath.equivalentResistance.value,L1Voltage:twoPath.lamps.L1.voltage.value,L1Current:twoPath.lamps.L1.current.value,L2Current:twoPath.lamps.L2.current.value},
  };
}

const reject=(ctx,reason)=>{ctx.accepted=false;ctx.reason=reason;};
function enter(ctx,phase){const from=ctx.state.phase;ctx.state.phase=phase;ctx.transitions.push({from,to:phase});}
function maybeAdvanceBuild(ctx){const next=BUILD_TO_MEASURE[ctx.state.phase];if(!next)return;const stage=PHASE_STAGE[ctx.state.phase];if(structureGate(rawOf(ctx.state),stage).ready)enter(ctx,next);}
function canWire(phase){return BENCH_PHASES.has(phase);}
function connect(ctx,action){
  const st=ctx.state;if(!canWire(st.phase))return reject(ctx,'wrong-phase');
  const {from,to}=action;if(!isTerminal(from)||!isTerminal(to)||from===to)return reject(ctx,'invalid');
  const key=wireKey(from,to);if(st.wires.some((w)=>wireKey(w.from,w.to)===key))return reject(ctx,'duplicate-wire');
  if(st.wires.length>=MAX_WIRES)return reject(ctx,'wire-limit');
  st.wires.push({from,to});maybeAdvanceBuild(ctx);
}
function disconnect(ctx,action){
  const st=ctx.state;if(!canWire(st.phase))return reject(ctx,'wrong-phase');
  if(!isTerminal(action.from)||!isTerminal(action.to)||action.from===action.to)return reject(ctx,'invalid');
  const key=wireKey(action.from,action.to),i=st.wires.findIndex((w)=>wireKey(w.from,w.to)===key);if(i<0)return reject(ctx,'missing-wire');
  st.wires.splice(i,1);maybeAdvanceBuild(ctx);
}
function toggleSwitch(ctx,value){const st=ctx.state;if(!canWire(st.phase))return reject(ctx,'wrong-phase');if(typeof value!=='boolean')return reject(ctx,'invalid');st.switchClosed=value;}
function record(ctx){
  const st=ctx.state,trialId=RECORD_PHASE[st.phase];if(!trialId)return reject(ctx,'wrong-phase');
  if(st.records.some((r)=>r.trialId===trialId))return reject(ctx,'already-recorded');
  const gate=measurementGate(rawOf(st),trialId);if(!gate.ready)return reject(ctx,'locked');
  st.records.push({trialId,wires:st.wires.map((w)=>({...w})),switchClosed:st.switchClosed});
  ctx.events.push({type:'record-written',trialId});enter(ctx,NEXT_AFTER_RECORD[st.phase]);
}
function answerCompare(ctx,action){
  const st=ctx.state,questions=own(COMPARE_PHASE,action.compare)?COMPARE_QUESTIONS[action.compare]:null;
  if(!questions||st.phase!==COMPARE_PHASE[action.compare])return reject(ctx,'wrong-phase');
  if(!own(questions,action.question)||typeof action.answer!=='string'||!questions[action.question].includes(action.answer))return reject(ctx,'invalid');
  st.compare[action.compare][action.question]=action.answer;
}
function cont(ctx){
  const st=ctx.state;
  if(st.phase==='compare1')return compareStatus(st).c1.allCorrect?enter(ctx,'trial2-build'):reject(ctx,'locked');
  if(st.phase==='compare2')return compareStatus(st).c2.allCorrect?enter(ctx,'inference'):reject(ctx,'locked');
  if(st.phase==='inference')return enter(ctx,'concept');
  return reject(ctx,'wrong-phase');
}

export function reduce(prev,action){
  const ctx={state:structuredClone(prev),events:[],transitions:[],accepted:true,reason:null};
  const st=ctx.state;
  switch(action?.type){
    case'START':if(st.phase!=='welcome')reject(ctx,'wrong-phase');else enter(ctx,'mission');break;
    case'BEGIN':if(st.phase!=='mission')reject(ctx,'wrong-phase');else enter(ctx,'baseline-build');break;
    case'CONNECT':connect(ctx,action);break;
    case'DISCONNECT':disconnect(ctx,action);break;
    case'TOGGLE_SWITCH':toggleSwitch(ctx,action.value);break;
    case'RECORD_MEASUREMENT':record(ctx);break;
    case'ANSWER_COMPARE':answerCompare(ctx,action);break;
    case'CONTINUE':cont(ctx);break;
    default:reject(ctx,'unknown-action');
  }
  if(!ctx.accepted)return{state:prev,accepted:false,reason:ctx.reason,events:[],transitions:[]};
  return{state:ctx.state,accepted:true,reason:null,events:ctx.events,transitions:ctx.transitions};
}
