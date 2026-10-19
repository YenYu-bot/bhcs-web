// Circuit Guided B4-B: challenge source data and raw-action replay.
// This module never treats supplied answers/readings as trusted scientific evidence.
import { CHALLENGE_BASES, solveCircuit, isTerminal, MAX_WIRES } from './model.js';

export const CHALLENGE_IDS=Object.freeze([1,2,3]);
export const CHALLENGE_ONE_OPTIONS=Object.freeze({
  restoreParallel:'恢復燈泡原本通路，電壓表並接在燈泡兩端',
  retainSeries:'維持電壓表接在導線缺口中',
  reverseBattery:'將電池正負極交換',
});
export function challengeOneStatus(answer){
  return {selected:Object.hasOwn(CHALLENGE_ONE_OPTIONS,answer)?answer:null,
    correct:answer==='restoreParallel'};
}
const key=(a,b)=>[a,b].sort().join('|');
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
export function challengeBase(id){
  const src=CHALLENGE_BASES[id];
  if(!src)throw new RangeError('unknown interactive challenge');
  return {wires:src.wires.map(w=>({...w})),switchClosed:false};
}
export function replayChallenge(id,actions=[]){
  if(!Array.isArray(actions)||actions.length>100)return {valid:false,reason:'invalid-actions',state:null};
  let state=challengeBase(id);
  for(const action of actions){
    if(!action||typeof action!=='object')return {valid:false,reason:'invalid-action',state:null};
    if(action.type==='TOGGLE_SWITCH'){
      if(typeof action.value!=='boolean')return {valid:false,reason:'invalid-switch',state:null};
      state.switchClosed=action.value;
      continue;
    }
    if(action.type!=='CONNECT'&&action.type!=='DISCONNECT')return {valid:false,reason:'invalid-action',state:null};
    const {from,to}=action;
    if(!isTerminal(from)||!isTerminal(to)||from===to)return {valid:false,reason:'invalid-terminal',state:null};
    const k=key(from,to),i=state.wires.findIndex(w=>key(w.from,w.to)===k);
    if(action.type==='CONNECT'){
      if(i!==-1||state.wires.length>=MAX_WIRES)return {valid:false,reason:'duplicate-or-limit',state:null};
      state.wires.push({from,to});
    }else{
      if(i===-1)return {valid:false,reason:'missing-wire',state:null};
      state.wires.splice(i,1);
    }
  }
  return {valid:true,state};
}
export function challengeReadings(id,actions=[]){
  const replay=replayChallenge(id,actions);
  if(!replay.valid)return {...replay,result:null};
  try{return {...replay,result:solveCircuit(replay.state)};}
  catch{return {valid:false,reason:'invalid-circuit',state:null,result:null};}
}
export function challengeThreeEvidence(actions=[]){
  const c=challengeReadings(3,actions);
  if(!c.valid||c.state.switchClosed!==true||c.result?.status!=='normal')return null;
  const r=c.result;
  // Require only L1 conducting and L2 explicitly disconnected: a current reading alone is insufficient.
  if(r.topology!=='single-L1'||r.lamps.L2.active)return null;
  const baseL2=CHALLENGE_BASES[3].wires.filter(w=>w.from.startsWith('L2.')||w.to.startsWith('L2.'));
  if(!baseL2.some(w=>!c.state.wires.some(x=>key(x.from,x.to)===key(w.from,w.to))))return null;
  if(Math.abs(r.batteryCurrent?.value-1)>1e-9 || Math.abs(r.lamps.L1.current?.value-1)>1e-9)return null;
  return {totalCurrent:r.batteryCurrent.value,L1Current:r.lamps.L1.current.value,
    brightness:r.lamps.L1.brightness};
}
// Challenge 2 requires three structural ammeter positions; no numeric-only completion shortcut.
export const CHALLENGE_TWO_POSITIONS=Object.freeze(['before-L1','between-lamps','after-L2']);
