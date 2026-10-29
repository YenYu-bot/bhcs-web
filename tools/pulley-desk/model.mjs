export const SCHEMA=1, MODEL='pulley-monotonic-v1', G=10, WEIGHT_N=10, TARGET_CM=20, MAX_RECORDS=50;
export const clone=value=>JSON.parse(JSON.stringify(value));
export const uid=()=>globalThis.crypto?.randomUUID?.()||`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const DEVICES=new Set(['fixed','movable']);
export function exactKeys(value,keys,label='資料'){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join('|')!==[...keys].sort().join('|'))throw Error(`${label}欄位不完整或含有未知欄位`);
}
export function validId(value){return typeof value==='string'&&value.length>0&&value.length<=200&&/^[a-zA-Z0-9_-]+$/.test(value);}
export function validDate(value){return typeof value==='string'&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;}
export function deepFreeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))deepFreeze(child);Object.freeze(value);}return value;}
export function calculate(device,h){
 if(!DEVICES.has(device))throw Error('未知滑輪裝置');
 if(!Number.isInteger(h)||h<0||h>TARGET_CM)throw Error('高度須為 0 至 20 cm 的整數');
 const n=device==='fixed'?1:2;
 return {device,weightN:WEIGHT_N,supportSegments:n,forceN:WEIGHT_N/n,heightCm:h,ropeCm:n*h,inputWorkNcm:WEIGHT_N*h,outputWorkNcm:WEIGHT_N*h};
}
// Upward coordinates in cm, with fixed arc length C represented independently.
// Each straight rope segment is counted exactly once; the drawable scene may scale all coordinates equally.
export function geometry(device,h){
 calculate(device,h);
 const arcCm=10;
 if(device==='fixed'){
  const anchorCm=70,loadCm=20+h,endCm=40-h;
  const leftCm=anchorCm-loadCm,rightCm=anchorCm-endCm;
  return {anchorCm,loadCm,endCm,leftCm,rightCm,arcCm,totalCm:leftCm+rightCm+arcCm};
 }
 const anchorCm=80,loadCm=10+h,endCm=30+2*h;
 const leftCm=anchorCm-loadCm,rightCm=endCm-loadCm;
 return {anchorCm,loadCm,endCm,leftCm,rightCm,arcCm,totalCm:leftCm+rightCm+arcCm};
}
export function newRun(device){calculate(device,0);return {runId:uid(),device,h:0,phase:'held',revision:0,events:[],recordId:null};}
const EVENT_KEYS=['operationId','runId','device','fromCm','toCm','revision'];
function validateEvents(events,runId,device,end,revision){
 if(!Array.isArray(events)||events.length>20||!Number.isInteger(revision)||revision!==events.length)throw Error('操作歷程或修訂號無效');
 let h=0;const seen=new Set();
 for(let i=0;i<events.length;i++){
  const event=events[i];exactKeys(event,EVENT_KEYS,'提升事件');
  if(!validId(event.operationId)||seen.has(event.operationId)||event.runId!==runId||event.device!==device||event.revision!==i+1||event.fromCm!==h||!Number.isInteger(event.toCm)||event.toCm<=h||event.toCm>TARGET_CM)throw Error('操作歷程不連續或不是合法提升');
  seen.add(event.operationId);h=event.toCm;
 }
 if(h!==end)throw Error('高度沒有對應的已提交提升歷程');
 return true;
}
export function validateRun(run){
 exactKeys(run,['runId','device','h','phase','revision','events','recordId'],'本輪');
 calculate(run.device,run.h);
 if(!validId(run.runId)||!['held','interacting','atTarget','recorded'].includes(run.phase))throw Error('本輪身分或狀態無效');
 validateEvents(run.events,run.runId,run.device,run.h,run.revision);
 if(run.phase==='recorded'){
  if(run.h!==TARGET_CM||run.recordId!==`record-${run.runId}`)throw Error('封存輪次缺少合法證據');
 }else{
  if(run.recordId!==null)throw Error('尚未封存但已有證據識別碼');
  if((run.phase==='held'&&run.h===TARGET_CM)||(run.phase==='atTarget'&&run.h!==TARGET_CM))throw Error('本輪高度與階段不符');
 }
 return true;
}
export function commitRise(run,target,operationId=uid()){
 validateRun(run);
 if(!validId(operationId))throw Error('操作識別碼無效');
 if(!Number.isInteger(target)||target<0||target>TARGET_CM)throw Error('高度須為 0 至 20 cm 的整數');
 if(run.recordId||run.events.some(event=>event.operationId===operationId)||target<=run.h)return false;
 const event={operationId,runId:run.runId,device:run.device,fromCm:run.h,toCm:target,revision:run.revision+1};
 run.events.push(event);run.h=target;run.revision++;run.phase=target===TARGET_CM?'atTarget':'held';
 validateRun(run);return true;
}
const RECORD_KEYS=['schemaVersion','modelVersion','recordId','runId','device','weightN','supportSegments','forceN','heightCm','ropeCm','inputWorkNcm','outputWorkNcm','g','createdAt','startHeightCm','revision','operations'];
export function createRecord(run){
 validateRun(run);
 if(run.phase!=='atTarget'||run.h!==TARGET_CM||run.events.length===0)throw Error('先完成本輪從 0 到 20 cm 的提升，再收下觀察');
 const result={schemaVersion:SCHEMA,modelVersion:MODEL,recordId:`record-${run.runId}`,runId:run.runId,...calculate(run.device,run.h),g:G,createdAt:new Date().toISOString(),startHeightCm:0,revision:run.revision,operations:clone(run.events)};
 validateRecord(result);return deepFreeze(result);
}
export function validateRecord(record){
 exactKeys(record,RECORD_KEYS,'觀察紀錄');
 if(record.schemaVersion!==SCHEMA||record.modelVersion!==MODEL||record.g!==G||!validId(record.runId)||record.recordId!==`record-${record.runId}`||!validDate(record.createdAt)||record.startHeightCm!==0||record.heightCm!==TARGET_CM)throw Error('證據版本、輪次或起訖高度不符');
 const derived=calculate(record.device,record.heightCm);
 for(const [key,value] of Object.entries(derived))if(record[key]!==value)throw Error('證據讀值與模型不一致');
 validateEvents(record.operations,record.runId,record.device,record.heightCm,record.revision);
 if(record.operations.length===0)throw Error('缺少本輪提升歷程');
 return true;
}
export function validatePair(fixed,movable){
 validateRecord(fixed);validateRecord(movable);
 if(fixed.recordId===movable.recordId||fixed.device!=='fixed'||movable.device!=='movable'||fixed.runId===movable.runId)throw Error('比較需要不同輪次的定滑輪與動滑輪各一筆');
 return true;
}
export function parseWork(text){
 if(typeof text!=='string'||!text.trim())throw Error('先填答案');
 const value=text.trim();
 if(value.length>100||!/^\d+(?:\.\d{1,2})?$/.test(value))throw Error('請填一般非負小數，最多兩位小數，不加單位');
 const [whole,fraction='']=value.split('.');
 const cents=BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
 if(cents>BigInt(Number.MAX_SAFE_INTEGER))throw Error('數字太大，請重新核對');
 return Number(cents);
}
export const pairKey=(fixedId,movableId)=>`${fixedId}::${movableId}`;
export const WORK_KEYS=Object.freeze(['fixedInput','fixedOutput','movableInput','movableOutput']);
export const workCorrect=pair=>Boolean(pair&&pair.work&&WORK_KEYS.every(key=>pair.work[key]===200));
