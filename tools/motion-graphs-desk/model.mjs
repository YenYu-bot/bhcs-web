export const SCHEMA_VERSION=1;
export const SCENARIO_VERSION='motion-position-piecewise-v1';
export const MODEL_VERSION=SCENARIO_VERSION;
export const MAX_REVISION=1000000;
export const SAMPLE_TIMES=Object.freeze([0,1,2,3,4,5,6,7,8]);
export const DIRECTION_OPTIONS=Object.freeze(['right','still','left']);
const POSITIONS=Object.freeze([1,3,5,5,5,4,3,2,1]);
export function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
export const clone=v=>JSON.parse(JSON.stringify(v));
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const int=(v,a=0,b=MAX_REVISION)=>Number.isSafeInteger(v)&&v>=a&&v<=b;
const text=v=>typeof v==='string';
const identifier=v=>text(v)&&v.length>0&&v.length<=200;
const datetime=v=>text(v)&&/^\d{4}-\d\d-\d\dT/.test(v)&&Number.isFinite(Date.parse(v));
function keys(v,allowed){if(!object(v)||Object.keys(v).length!==allowed.length||Object.keys(v).some(k=>!allowed.includes(k)))throw Error('Unknown or missing fields');}
function validTime(t){if(!Number.isFinite(t)||t<0||t>8)throw new RangeError('Invalid model time');}
export function positionAt(t){validTime(t);return t<=2?1+2*t:t<=4?5:9-t;}
export function distanceAt(t){validTime(t);return t<=2?2*t:t<=4?4:t;}
export function displacementAt(t){return positionAt(t)-1;}
export function derive(t){return freeze({tSeconds:t,positionM:positionAt(t),distanceM:distanceAt(t),displacementM:displacementAt(t)});}
export function parseNumeric(raw,signed=false){
 if(!text(raw)||raw.length>16)return {status:'format'};const s=raw.trim();if(!s)return {status:'empty'};
 const re=signed?/^-?\d{1,9}(?:\.\d{1,2})?$/:/^\d{1,9}(?:\.\d{1,2})?$/;
 if(!re.test(s))return {status:'format'};
 const negative=s.startsWith('-'),[whole,fraction='']=s.replace(/^-/,'').split('.');const hundredths=(negative?-1:1)*(Number(whole)*100+Number(fraction.padEnd(2,'0')));
 return {status:'valid',value:hundredths/100,hundredths};
}
export function parsePosition(raw){const p=parseNumeric(raw);return p.status==='valid'&&(p.value<0||p.value>6)?{status:'range'}:p;}
export function readingCorrect(raw,t){const p=parsePosition(raw);return int(t,0,8)&&p.status==='valid'&&p.hundredths===POSITIONS[t]*100;}
export function emptySnapshot(runId){return {schemaVersion:SCHEMA_VERSION,scenarioVersion:SCENARIO_VERSION,runId,storageRevision:0,records:[],plot:{slots:Array(9).fill(null),revision:0,check:null,linkedRevision:null},interpretation:{description:{choices:[null,null,null],revision:0,check:null},numeric:{distanceRaw:'',displacementRaw:'',revision:0,check:null},history:[]},reflection:''};}
export function fingerprint(snapshot){return JSON.stringify([snapshot.runId,snapshot.scenarioVersion,snapshot.records.map(r=>[r.runId,r.sampleId,r.scenarioVersion,r.tSeconds,r.observedPositionM,r.studentReadingRaw,r.normalizedReadingM,r.captureMode,r.sequence])]);}
export function numericCorrect(n){const d=parseNumeric(n.distanceRaw),x=parseNumeric(n.displacementRaw,true);return d.status==='valid'&&d.hundredths===800&&x.status==='valid'&&x.hundredths===0;}
export function plotCorrect(s){return s.records.length===9&&s.plot.slots.every((p,i)=>p!==null&&p.tSeconds===i&&p.positionM===s.records[i].observedPositionM);}
export function descriptionCorrect(d){return d.choices.every((v,i)=>v===DIRECTION_OPTIONS[i]);}
export function evaluate(s){
 const fp=fingerprint(s),p=s.plot,d=s.interpretation.description,n=s.interpretation.numeric;
 const plotPassed=!!p.check&&p.check.passed===true&&p.check.plotRevision===p.revision&&p.check.evidenceFingerprint===fp&&plotCorrect(s);
 const linked=plotPassed&&p.linkedRevision===p.revision;
 const descriptionPassed=linked&&!!d.check&&d.check.passed===true&&d.check.descriptionRevision===d.revision&&d.check.plotRevision===p.revision&&d.check.evidenceFingerprint===fp&&descriptionCorrect(d);
 const numericPassed=descriptionPassed&&!!n.check&&n.check.passed===true&&n.check.numericRevision===n.revision&&n.check.descriptionRevision===d.revision&&n.check.plotRevision===p.revision&&n.check.evidenceFingerprint===fp&&numericCorrect(n);
 return {plotPassed,linked,descriptionPassed,numericPassed,complete:numericPassed};
}
function validateCheck(c,kind){
 const names=['plotRevision','evidenceFingerprint','passed'];if(kind!=='plot')names.push('descriptionRevision');if(kind==='numeric')names.push('numericRevision');
 keys(c,names);if(!int(c.plotRevision)||typeof c.passed!=='boolean'||!text(c.evidenceFingerprint)||c.evidenceFingerprint.length>16000)throw Error('Invalid check');
 if(kind!=='plot'&&!int(c.descriptionRevision)||kind==='numeric'&&!int(c.numericRevision))throw Error('Invalid check revision');
}
export function validateRecord(r,index,runId){try{
 keys(r,['runId','sampleId','scenarioVersion','tSeconds','observedPositionM','studentReadingRaw','normalizedReadingM','captureMode','sequence','createdAt']);
 if(r.runId!==runId||!identifier(r.sampleId)||r.scenarioVersion!==SCENARIO_VERSION||r.tSeconds!==index||r.sequence!==index||r.observedPositionM!==POSITIONS[index]||r.normalizedReadingM!==POSITIONS[index]||!readingCorrect(r.studentReadingRaw,index)||!datetime(r.createdAt)||!(index===0?r.captureMode==='initial':['animated','step'].includes(r.captureMode)))return false;
 return true;
}catch{return false;}}
export function validateSnapshot(value){try{
 keys(value,['schemaVersion','scenarioVersion','runId','storageRevision','records','plot','interpretation','reflection']);
 if(value.schemaVersion!==SCHEMA_VERSION||value.scenarioVersion!==SCENARIO_VERSION||!identifier(value.runId)||!int(value.storageRevision)||!Array.isArray(value.records)||value.records.length>9||!text(value.reflection)||value.reflection.length>500)throw Error('Invalid snapshot header');
 if(!value.records.every((r,i)=>validateRecord(r,i,value.runId))||new Set(value.records.map(r=>r.sampleId)).size!==value.records.length)throw Error('Invalid evidence prefix');
 const p=value.plot,interpret=value.interpretation;
 keys(p,['slots','revision','check','linkedRevision']);if(!Array.isArray(p.slots)||p.slots.length!==9||!int(p.revision)||!(p.linkedRevision===null||int(p.linkedRevision)))throw Error('Invalid plot');
 p.slots.forEach((slot,i)=>{if(slot!==null){keys(slot,['tSeconds','positionM']);if(slot.tSeconds!==i||!int(slot.positionM,0,6))throw Error('Invalid plot slot');}});
 keys(interpret,['description','numeric','history']);const d=interpret.description,n=interpret.numeric;
 keys(d,['choices','revision','check']);if(!Array.isArray(d.choices)||d.choices.length!==3||d.choices.some(v=>v!==null&&!DIRECTION_OPTIONS.includes(v))||!int(d.revision))throw Error('Invalid description');
 keys(n,['distanceRaw','displacementRaw','revision','check']);if(!text(n.distanceRaw)||n.distanceRaw.length>16||!text(n.displacementRaw)||n.displacementRaw.length>16||!int(n.revision))throw Error('Invalid numeric draft');
 if(!Array.isArray(interpret.history)||interpret.history.length>100)throw Error('Invalid check history');
 for(const h of interpret.history){keys(h,['kind','createdAt','revision','passed']);if(!['plot','description','numeric'].includes(h.kind)||!datetime(h.createdAt)||!int(h.revision)||typeof h.passed!=='boolean')throw Error('Invalid history entry');}
 if(value.records.length<9){
  if(p.slots.some(v=>v!==null)||p.revision!==0||p.check!==null||p.linkedRevision!==null||d.choices.some(v=>v!==null)||d.revision!==0||d.check!==null||n.distanceRaw!==''||n.displacementRaw!==''||n.revision!==0||n.check!==null||interpret.history.length||value.reflection!=='')throw Error('Answers without complete evidence');
 }else{
  const fp=fingerprint(value);
  if(p.check!==null){validateCheck(p.check,'plot');if(p.check.plotRevision!==p.revision||p.check.evidenceFingerprint!==fp||p.check.passed!==plotCorrect(value))throw Error('Invalid current plot check');}
  const status=evaluate(value);
  if(p.linkedRevision!==null&&(!status.plotPassed||p.linkedRevision!==p.revision))throw Error('Invalid linked revision');
  if(d.check!==null){validateCheck(d.check,'description');if(!status.linked||d.check.descriptionRevision!==d.revision||d.check.plotRevision!==p.revision||d.check.evidenceFingerprint!==fp||d.check.passed!==descriptionCorrect(d))throw Error('Invalid current description check');}
  if(n.check!==null){validateCheck(n.check,'numeric');if(!status.descriptionPassed||n.check.numericRevision!==n.revision||n.check.descriptionRevision!==d.revision||n.check.plotRevision!==p.revision||n.check.evidenceFingerprint!==fp||n.check.passed!==numericCorrect(n))throw Error('Invalid current numeric check');}
 }
 return {ok:true,snapshot:freeze(clone(value))};
}catch(error){return {ok:false,error:error.message};}}
