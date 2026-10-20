// Circuit Guided B4-C: versioned, science-safe persistence payload validation.
// This pure module has no browser storage or analytics side effects.
import { observationFor, RECORD_IDS, PHASES, createInitialState } from './engine.js';
import { isTerminal, MAX_WIRES } from './model.js';
import { replayChallenge, challengeTwoPosition, challengeThreeEvidence, CHALLENGE_TWO_POSITIONS } from './challenges.js';
import { notebookAStatus, notebookBStatus, notebookCStatus } from './notebook.js';
export const STORAGE_KEY='bhcs-circuit-guided:v1';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const string=x=>typeof x==='string'?x:'';
function wires(src){
  if(!Array.isArray(src)||src.length>MAX_WIRES)return null;
  const seen=new Set(),out=[];
  for(const w of src){
    if(!obj(w)||!isTerminal(w.from)||!isTerminal(w.to)||w.from===w.to)return null;
    const k=[w.from,w.to].sort().join('|');if(seen.has(k))return null;
    seen.add(k);out.push({from:w.from,to:w.to});
  }
  return out;
}
function rawRecord(r){
  if(!obj(r)||!RECORD_IDS.includes(r.trialId)||r.switchClosed!==true)return null;
  const w=wires(r.wires);return w?{trialId:r.trialId,wires:w,switchClosed:true}:null;
}
export function validateMainSnapshot(input){
  if(!obj(input)||!PHASES.includes(input.phase)||typeof input.switchClosed!=='boolean')return null;
  const w=wires(input.wires);if(!w||!Array.isArray(input.records)||input.records.length>5)return null;
  const records=[],ids=new Set();
  for(const r of input.records){const rec=rawRecord(r);if(!rec||ids.has(rec.trialId))return null;ids.add(rec.trialId);records.push(rec);}
  const result=createInitialState();
  result.phase=input.phase;result.wires=w;result.switchClosed=input.switchClosed;result.records=records;
  for(const k of ['c1','c2'])for(const q of Object.keys(result.compare[k])){
    const answer=input.compare?.[k]?.[q];
    if(answer!==null&&answer!==undefined){
      if(typeof answer!=='string')return null;
      result.compare[k][q]=answer;
    }
  }
  // Every measured observation is reconstructed via the solver, not a persisted flag.
  if(!records.every(r=>observationFor(result,r.trialId)!==null))return null;
  return result;
}
function validateNotebook(n,main){
  if(!obj(n)||!['A','B','C','done'].includes(n.level)||!obj(n.a)||!obj(n.c))return null;
  const a={};for(const k of ['baselineCurrent','onePathChange','twoPathChange','alwaysDecrease'])if(own(n.a,k))a[k]=string(n.a[k]);
  const b=string(n.b).slice(0,5000),c={counterexample:string(n.c.counterexample).slice(0,5000),limitation:string(n.c.limitation).slice(0,5000)};
  if(['B','C','done'].includes(n.level)&&!notebookAStatus(main,a).allCorrect)return null;
  if(['C','done'].includes(n.level)&&!notebookBStatus(b).ready)return null;
  if(n.level==='done'&&!notebookCStatus(c).ready)return null;
  return {level:n.level,a,b,c};
}
function validateChallenge(ch){
  if(!obj(ch)||![1,2,3].includes(ch.stage)||!Array.isArray(ch.actions)||!Array.isArray(ch.records)||typeof ch.done!=='boolean')return null;
  if(ch.records.length>3)return null;
  const records=[];
  for(let i=0;i<ch.records.length;i++){
    const rec=ch.records[i];if(!obj(rec)||rec.position!==CHALLENGE_TWO_POSITIONS[i]||!Array.isArray(rec.actions))return null;
    const proof=challengeTwoPosition(rec.actions);if(!proof||proof.position!==rec.position)return null;
    records.push({position:proof.position,actions:structuredClone(rec.actions)});
  }
  if(ch.stage===1&&(ch.records.length||ch.actions.length))return null;
  if(ch.stage===2&&ch.records.length>=3&&ch.done)return null;
  if(ch.stage===3&&ch.records.length!==3)return null;
  const actions=structuredClone(ch.actions);
  if(ch.stage!==1&&!replayChallenge(ch.stage,actions).valid)return null;
  if(ch.done&&(ch.stage!==3||!challengeThreeEvidence(actions)))return null;
  return {stage:ch.stage,actions,records,choice:ch.choice==='restoreParallel'||ch.choice==='retainSeries'||ch.choice==='reverseBattery'?ch.choice:null,done:ch.done};
}
export function restorePayload(value){
  try{
    if(!obj(value)||value.version!==1)return null;
    const main=validateMainSnapshot(value.main);if(!main)return null;
    const notebook=value.notebook===null?null:validateNotebook(value.notebook,main);
    if(value.notebook!==null&&!notebook)return null;
    const challenge=value.challenge===null?null:validateChallenge(value.challenge);
    if(value.challenge!==null&&!challenge)return null;
    if((notebook||challenge)&&main.phase!=='concept')return null;
    if(challenge&&(!notebook||notebook.level!=='done'))return null;
    return {main,notebook,challenge};
  }catch{return null;}
}
export function createPayload({main,notebook=null,challenge=null}){
  const safe=restorePayload({version:1,main,notebook,challenge});
  if(!safe)return null;
  return {version:1,main:safe.main,notebook:safe.notebook,challenge:safe.challenge};
}
