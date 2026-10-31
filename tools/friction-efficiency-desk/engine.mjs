import {SCHEMA_VERSION,MODEL_VERSION,PARAMETERS,SURFACES,EXPECTED_ANSWERS,DISTANCE_OPTIONS,CONCLUSION_OPTIONS,LIMITS,derive,emptyAnswers,answerStatus,checkPayload,validateSnapshot,freeze,clone} from './model.mjs';
let sequence=0;
const newId=()=>globalThis.crypto?.randomUUID?.()||`id-${Date.now()}-${++sequence}`;
const ok=extra=>({ok:true,...extra});const fail=reason=>({ok:false,reason});
export class Engine {
 constructor(snapshot=null,{id=newId,now=()=>new Date().toISOString()}={}){
  this.id=id;this.now=now;
  const initial={schemaVersion:SCHEMA_VERSION,modelVersion:MODEL_VERSION,records:[],pair:null,answers:null};
  const v=validateSnapshot(snapshot??initial);if(!v.ok)throw Error(v.error);
  const saved=clone(v.snapshot);
  this.state=freeze({...saved,phase:saved.records.length===0?'intro':saved.records.length===1?'sealed':'distance',surfaceId:saved.records.length===2?'rough':'ideal',reachedS:saved.records.length?100:0,active:null,runId:null,positiveAdvanceCount:0,inputMethods:[],lastOperationId:null});
  this.refresh();
 }
 update(changes){this.state=freeze({...this.state,...changes});return this.state;}
 refresh(){
  if(!this.state.answers)return;
  const answers={...this.state.answers,...answerStatus(this.state.answers)};
  const phase=answers.complete?'complete':answers.passed.every(Boolean)?'explanation':answers.distancesPassed?'calculation':'distance';
  this.update({answers,phase});
 }
 get canSeal(){return ['held','endpoint','ready'].includes(this.state.phase)&&this.state.reachedS===100&&!this.state.active&&this.state.positiveAdvanceCount>0;}
 start(){if(this.state.phase!=='intro')return fail('already-started');return this.newRun('ideal');}
 newRun(surfaceId){this.update({surfaceId,phase:'ready',reachedS:0,active:null,runId:this.id(),positiveAdvanceCount:0,inputMethods:[],lastOperationId:null});return ok();}
 next(){if(this.state.phase!=='sealed'||this.state.records.length!==1)return fail('seal-ideal-first');return this.newRun('rough');}
 redo(){if(!['ready','moving','held','endpoint'].includes(this.state.phase))return fail('cannot-redo-sealed');return this.newRun(this.state.surfaceId);}
 beginOperation(method){
  if(!['pointer','keyboard','button'].includes(method)||!['ready','held','endpoint'].includes(this.state.phase)||this.state.active)return null;
  const operationId=this.id();this.update({phase:'moving',active:{operationId,method,startS:this.state.reachedS,runId:this.state.runId}});return operationId;
 }
 advanceTo(candidate,operationId){
  const a=this.state.active;
  if(!a||a.operationId!==operationId||a.runId!==this.state.runId||!Number.isFinite(candidate))return false;
  const s=Math.max(this.state.reachedS,Math.min(100,Math.max(0,Math.floor(candidate))));
  if(s===this.state.reachedS)return false;
  this.update({reachedS:s,positiveAdvanceCount:this.state.positiveAdvanceCount+1,inputMethods:[...new Set([...this.state.inputMethods,a.method])],lastOperationId:a.operationId});return true;
 }
 stop(operationId){
  if(!this.state.active||this.state.active.operationId!==operationId)return false;
  this.update({active:null,phase:this.state.reachedS===100?'endpoint':this.state.reachedS===0?'ready':'held'});return true;
 }
 seal(){
  if(!this.canSeal)return fail('settle-at-endpoint-first');
  const s=this.state,surface=SURFACES[s.surfaceId];
  if(s.records.length!==(s.surfaceId==='ideal'?0:1))return fail('already-sealed');
  const record=freeze({schemaVersion:SCHEMA_VERSION,modelVersion:MODEL_VERSION,recordId:this.id(),runId:s.runId,createdAt:this.now(),surfaceId:s.surfaceId,...PARAMETERS,muNumerator:surface.muNumerator,muDenominator:surface.muDenominator,forceN:surface.forceN,finalSCm:100,finalHTenthCm:600,positiveAdvanceCount:s.positiveAdvanceCount,inputMethods:[...s.inputMethods],lastOperationId:s.lastOperationId});
  const records=[...s.records,record];let pair=null,answers=null;
  if(records.length===2){pair={pairId:this.id(),createdAt:this.now(),idealRecordId:records[0].recordId,roughRecordId:record.recordId};answers=emptyAnswers(pair.pairId);}
  this.update({records,pair,answers,phase:records.length===1?'sealed':'distance'});this.refresh();return ok({record});
 }
 editAnswers(edit){if(!this.state.answers)return fail('collect-both-first');const answers=clone(this.state.answers);const result=edit(answers);if(result?.ok===false)return result;this.update({answers});this.refresh();return result??ok();}
 setDistance(index,value){return this.editAnswers(a=>{if(![0,1].includes(index)||!DISTANCE_OPTIONS.includes(value))return fail('invalid-distance');if(a.distance[index]!==value){a.distance[index]=value;a.distanceVersions[index]++;}return ok();});}
 appendCheck(a,kind,step=null){if(a.checks.length>=LIMITS.checks)return fail('check-capacity');a.checks.push({checkId:this.id(),createdAt:this.now(),kind,step,payload:checkPayload(a,kind,step)});return ok();}
 checkDistances(){const result=this.editAnswers(a=>this.appendCheck(a,'distance'));return {...result,passed:this.state.answers?.distancesPassed??false};}
 setAnswer(index,raw){return this.editAnswers(a=>{if(!Number.isInteger(index)||index<0||index>7||typeof raw!=='string'||raw.length>LIMITS.raw)return fail('invalid-answer');if(!a.distancesPassed)return fail('check-distances-first');if(a.raw[index]!==raw){a.raw[index]=raw;a.versions[index]++;}return ok();});}
 checkStep(step){const result=this.editAnswers(a=>{if(!Number.isInteger(step)||step<0||step>3)return fail('invalid-step');if(!a.distancesPassed||!a.passed.slice(0,step*2).every(Boolean))return fail('check-earlier-step-first');return this.appendCheck(a,'calculation',step);});return {...result,passed:result.ok?this.state.answers.passed.slice(step*2,step*2+2):[]};}
 reveal(index){return this.editAnswers(a=>{if(!Number.isInteger(index)||index<0||index>7||!a.distancesPassed)return fail('check-distances-first');if(a.revealed[index]===null)a.revealed[index]=this.now();return ok();});}
 useHint(index){return this.editAnswers(a=>{if(![1,2,3].includes(index))return fail('invalid-hint');if(!a.hints.includes(index))a.hints.push(index);return ok();});}
 setConclusion(index,value){return this.editAnswers(a=>{if(!Number.isInteger(index)||index<0||index>2||!CONCLUSION_OPTIONS[index].includes(value))return fail('invalid-conclusion');if(!a.passed.every(Boolean))return fail('check-calculations-first');if(a.conclusions[index]!==value){a.conclusions[index]=value;a.conclusionVersions[index]++;}return ok();});}
 checkConclusions(){const result=this.editAnswers(a=>{if(!a.passed.every(Boolean))return fail('check-calculations-first');return this.appendCheck(a,'conclusion');});return {...result,passed:this.state.answers?.conclusionsPassed??false};}
 saveReflection(text){return this.editAnswers(a=>{if(typeof text!=='string'||!text.trim()||text.length>LIMITS.reflection)return fail('invalid-reflection');if(!a.passed.every(Boolean))return fail('check-calculations-first');if(a.revisions.length>=LIMITS.revisions)return fail('reflection-capacity');a.revisions.push({revisionId:this.id(),createdAt:this.now(),text});return ok();});}
 snapshot(){const s=this.state;const v=validateSnapshot({schemaVersion:SCHEMA_VERSION,modelVersion:MODEL_VERSION,records:s.records,pair:s.pair,answers:s.answers});if(!v.ok)throw Error(v.error);return v.snapshot;}
 exportData(){
  const snapshot=this.snapshot();const a=snapshot.answers;
  const modelCalculations=[];
  if(a)for(let i=0;i<8;i++)if(a.passed[i]||a.revealed[i])modelCalculations.push({field:['idealInput','roughInput','idealUseful','roughUseful','idealInternal','roughInternal','idealEfficiency','roughEfficiency'][i],value:EXPECTED_ANSWERS[i],unit:i<6?'J':'%',basis:'model-calculation',revealed:!!a.revealed[i],revealedAt:a.revealed[i],checked:a.passed[i]});
  return freeze({schemaVersion:SCHEMA_VERSION,modelVersion:MODEL_VERSION,exportedAt:this.now(),measurementType:'idealized-virtual-instrument',modelParameters:{...PARAMETERS,surfaces:clone(SURFACES)},measurements:snapshot.records.map(r=>({recordId:r.recordId,runId:r.runId,createdAt:r.createdAt,surfaceId:r.surfaceId,forceN:r.forceN,alongSlopeCm:r.finalSCm,verticalRiseCm:r.finalHTenthCm/10,weightN:r.weightN,positiveAdvanceCount:r.positiveAdvanceCount,inputMethods:[...r.inputMethods]})),snapshot,modelCalculations});
 }
}
