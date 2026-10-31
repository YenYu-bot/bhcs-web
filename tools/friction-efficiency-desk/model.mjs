export const SCHEMA_VERSION = 1;
export const MODEL_VERSION = 'quasi-static-friction-efficiency-v1';
export const PARAMETERS = Object.freeze({boxId:'box-10n',weightN:10,lengthCm:100,heightCm:60,baseCm:80});
export const SURFACES = Object.freeze({ideal:Object.freeze({muNumerator:0,muDenominator:4,forceN:6,frictionN:0}),rough:Object.freeze({muNumerator:1,muDenominator:4,forceN:8,frictionN:2})});
export const EXPECTED_ANSWERS = Object.freeze([6,8,6,6,0,2,100,75]);
export const DISTANCE_OPTIONS = Object.freeze(['slope','vertical','horizontal']);
export const CONCLUSION_OPTIONS = Object.freeze([['surface','weight','height'],['internal','vanished','kinetic'],['useful-over-input','input-over-useful','weight-over-force']]);
export const LIMITS = Object.freeze({checks:200,revisions:50,raw:32,reflection:1000});
export function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
export function clone(value){return JSON.parse(JSON.stringify(value));}
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const integer=(v,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const id=v=>typeof v==='string'&&v.length>0&&v.length<=200;
const date=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(v)&&Number.isFinite(Date.parse(v));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const array=(a,n,p)=>Array.isArray(a)&&a.length===n&&a.every(p);
export function derive(surfaceId,sCm){
 if(!Object.hasOwn(SURFACES,surfaceId)||!integer(sCm,0,100))throw new RangeError('Invalid surface or position');
 const surface=SURFACES[surfaceId];
 return freeze({...PARAMETERS,surfaceId,sCm,hTenthCm:6*sCm,hCm:6*sCm/10,horizontalTenthCm:8*sCm,forceN:surface.forceN,normalN:8,frictionN:surface.frictionN,muNumerator:surface.muNumerator,muDenominator:surface.muDenominator,inputCentiJ:surface.forceN*sCm,usefulCentiJ:6*sCm,internalCentiJ:surface.frictionN*sCm,efficiencyPercent:sCm===0?null:(surfaceId==='ideal'?100:75)});
}
export function parseAnswer(raw,index){
 if(!integer(index,0,7))return {status:'format'};
 if(typeof raw!=='string'||raw.length>LIMITS.raw)return {status:'format'};
 const trimmed=raw.trim();if(!trimmed)return {status:'empty'};
 if(!/^\d{1,9}(?:\.\d{1,2})?$/.test(trimmed))return {status:'format'};
 const [a,b='']=trimmed.split('.');const hundredths=Number(a)*100+Number(b.padEnd(2,'0'));
 return {status:hundredths===EXPECTED_ANSWERS[index]*100?'correct':'incorrect',hundredths};
}
export function emptyAnswers(pairId){return {pairId,distance:[null,null],distanceVersions:[0,0],raw:Array(8).fill(''),versions:Array(8).fill(0),revealed:Array(8).fill(null),conclusions:[null,null,null],conclusionVersions:[0,0,0],hints:[],checks:[],revisions:[]};}
export function checkPayload(a,kind,step=null){
 const result={distance:[...a.distance],distanceVersions:[...a.distanceVersions]};
 if(kind==='distance')return result;
 const count=kind==='calculation'?(step+1)*2:8;
 result.raw=a.raw.slice(0,count);result.versions=a.versions.slice(0,count);
 if(kind==='conclusion'){result.conclusions=[...a.conclusions];result.conclusionVersions=[...a.conclusionVersions];}
 return result;
}
export function answerStatus(a){
 const latest=(kind,step=null)=>a.checks.findLast(c=>c.kind===kind&&(kind!=='calculation'||c.step===step));
 const d=latest('distance');
 const distancesPassed=!!d&&same(d.payload,checkPayload(a,'distance'))&&a.distance[0]==='slope'&&a.distance[1]==='vertical';
 const passed=Array(8).fill(false);
 for(let step=0;step<4;step++){
  const c=latest('calculation',step);
  const ready=distancesPassed&&passed.slice(0,step*2).every(Boolean);
  if(ready&&c&&same(c.payload,checkPayload(a,'calculation',step)))for(let i=step*2;i<step*2+2;i++)passed[i]=parseAnswer(a.raw[i],i).status==='correct';
 }
 const c=latest('conclusion');
 const conclusionsPassed=passed.every(Boolean)&&!!c&&same(c.payload,checkPayload(a,'conclusion'))&&a.conclusions.every((v,i)=>v===CONCLUSION_OPTIONS[i][0]);
 return {distancesPassed,passed,conclusionsPassed,complete:conclusionsPassed};
}
export function validateRecord(r){
 if(!obj(r)||r.schemaVersion!==SCHEMA_VERSION||r.modelVersion!==MODEL_VERSION||!id(r.recordId)||!id(r.runId)||!date(r.createdAt)||!Object.hasOwn(SURFACES,r.surfaceId))return false;
 if(!Object.entries(PARAMETERS).every(([k,v])=>r[k]===v))return false;
 const s=SURFACES[r.surfaceId];
 if(r.forceN!==s.forceN||r.muNumerator!==s.muNumerator||r.muDenominator!==s.muDenominator||r.finalSCm!==100||r.finalHTenthCm!==600)return false;
 return integer(r.positiveAdvanceCount,1,100)&&Array.isArray(r.inputMethods)&&r.inputMethods.length>0&&r.inputMethods.length<=3&&r.inputMethods.length<=r.positiveAdvanceCount&&new Set(r.inputMethods).size===r.inputMethods.length&&r.inputMethods.every(m=>['pointer','keyboard','button'].includes(m))&&id(r.lastOperationId);
}
function normalizeAnswers(value,pairId){
 if(!obj(value)||value.pairId!==pairId)throw Error('Answers without matching pair');
 const a=value;
 if(!array(a.distance,2,v=>v===null||DISTANCE_OPTIONS.includes(v))||!array(a.distanceVersions,2,v=>integer(v))||!array(a.raw,8,v=>typeof v==='string'&&v.length<=LIMITS.raw)||!array(a.versions,8,v=>integer(v))||!array(a.revealed,8,v=>v===null||date(v))||!array(a.conclusions,3,(v)=>v===null||CONCLUSION_OPTIONS.flat().includes(v))||a.conclusions.some((v,i)=>v!==null&&!CONCLUSION_OPTIONS[i].includes(v))||!array(a.conclusionVersions,3,v=>integer(v)))throw Error('Invalid answer fields');
 if(!Array.isArray(a.hints)||a.hints.length>3||a.hints.some(v=>![1,2,3].includes(v))||new Set(a.hints).size!==a.hints.length)throw Error('Invalid hints');
 if(!Array.isArray(a.checks)||a.checks.length>LIMITS.checks||!Array.isArray(a.revisions)||a.revisions.length>LIMITS.revisions)throw Error('History capacity exceeded');
 const ids=new Set();
 for(const c of a.checks){
  if(!obj(c)||!id(c.checkId)||ids.has(c.checkId)||!date(c.createdAt)||!['distance','calculation','conclusion'].includes(c.kind)||!obj(c.payload))throw Error('Invalid check history');ids.add(c.checkId);
  const p=c.payload;
  if(!array(p.distance,2,v=>v===null||DISTANCE_OPTIONS.includes(v))||!array(p.distanceVersions,2,v=>integer(v))||p.distanceVersions.some((v,i)=>v>a.distanceVersions[i]))throw Error('Invalid distance history');
  if(c.kind==='calculation'&&!integer(c.step,0,3))throw Error('Invalid check step');
  if(c.kind!=='calculation'&&c.step!==null)throw Error('Invalid check kind');
  if(c.kind!=='distance'){
   const n=c.kind==='calculation'?(c.step+1)*2:8;
   if(!array(p.raw,n,v=>typeof v==='string'&&v.length<=LIMITS.raw)||!array(p.versions,n,v=>integer(v))||p.versions.some((v,i)=>v>a.versions[i]))throw Error('Invalid calculation history');
  }
  if(c.kind==='conclusion'&&(!array(p.conclusions,3,v=>v===null||CONCLUSION_OPTIONS.flat().includes(v))||p.conclusions.some((v,i)=>v!==null&&!CONCLUSION_OPTIONS[i].includes(v))||!array(p.conclusionVersions,3,v=>integer(v))||p.conclusionVersions.some((v,i)=>v>a.conclusionVersions[i])))throw Error('Invalid conclusion history');
 }
 for(const r of a.revisions){if(!obj(r)||!id(r.revisionId)||ids.has(r.revisionId)||!date(r.createdAt)||typeof r.text!=='string'||!r.text.trim()||r.text.length>LIMITS.reflection)throw Error('Invalid reflection history');ids.add(r.revisionId);}
 return {...clone({pairId:a.pairId,distance:a.distance,distanceVersions:a.distanceVersions,raw:a.raw,versions:a.versions,revealed:a.revealed,conclusions:a.conclusions,conclusionVersions:a.conclusionVersions,hints:a.hints,checks:a.checks,revisions:a.revisions}),...answerStatus(a)};
}
export function validateSnapshot(value){try{
 if(!obj(value)||value.schemaVersion!==SCHEMA_VERSION||value.modelVersion!==MODEL_VERSION)throw Error('Unsupported snapshot version');
 const records=value.records;
 if(!Array.isArray(records)||records.length>2||!records.every(validateRecord))throw Error('Invalid records');
 if(records[0]&&records[0].surfaceId!=='ideal'||records[1]&&records[1].surfaceId!=='rough')throw Error('Invalid surface order');
 for(const key of ['recordId','runId'])if(new Set(records.map(r=>r[key])).size!==records.length)throw Error('Duplicate record identity');
 let pair=null,answers=null;
 if(records.length<2){if(value.pair!==null||value.answers!==null)throw Error('Unpaired answers');}
 else {
  const p=value.pair;
  if(!obj(p)||!id(p.pairId)||!date(p.createdAt)||p.idealRecordId!==records[0].recordId||p.roughRecordId!==records[1].recordId)throw Error('Invalid pair');
  pair=clone(p);answers=normalizeAnswers(value.answers,p.pairId);
 }
 return {ok:true,snapshot:freeze({schemaVersion:SCHEMA_VERSION,modelVersion:MODEL_VERSION,records:clone(records),pair,answers})};
 }catch(error){return {ok:false,error:error.message};}}
