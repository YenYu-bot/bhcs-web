import {SCHEMA_VERSION,SCENARIO_VERSION,MAX_REVISION,DIRECTION_OPTIONS,positionAt,readingCorrect,parsePosition,emptySnapshot,validateSnapshot,fingerprint,evaluate,plotCorrect,descriptionCorrect,numericCorrect,freeze,clone} from './model.mjs';
let serial=0;const makeId=()=>globalThis.crypto?.randomUUID?.()||`motion-${Date.now()}-${++serial}`;
const ok=extra=>({ok:true,...extra}),fail=reason=>({ok:false,reason});
const persisted=s=>({schemaVersion:s.schemaVersion,scenarioVersion:s.scenarioVersion,runId:s.runId,storageRevision:s.storageRevision,records:s.records,plot:s.plot,interpretation:s.interpretation,reflection:s.reflection});
export class Engine {
 constructor(snapshot=null,{id=makeId,now=()=>new Date().toISOString()}={}){
  this.id=id;this.now=now;this.generation=0;
  const result=validateSnapshot(snapshot??emptySnapshot(id()));if(!result.ok)throw Error(result.error);
  const saved=result.snapshot,count=saved.records.length,t=count?count-1:0;
  this.state=freeze({...saved,stage:count===0?'welcome':count<9?'segment':'plotting',observationT:t,target:count===0?0:Math.min(8,count),readingRaw:'',captureMode:count===0?'initial':'animated',mode:'observation',replayT:null,replayEnd:null,replayPlaying:false,returnStage:null,returnObservationT:null,composition:{distanceRaw:false,displacementRaw:false},numericInputErrors:{distanceRaw:false,displacementRaw:false},status:evaluate(saved)});
  this.refresh();
 }
 update(change){this.state=freeze({...this.state,...change});}
 refresh(){const status=evaluate(this.state);if(Object.values(this.state.composition).some(Boolean)||Object.values(this.state.numericInputErrors).some(Boolean)){status.numericPassed=false;status.complete=false;}
  const changes={status};if(this.state.records.length===9&&this.state.mode==='observation')changes.stage=status.complete?'complete':status.linked?'interpreting':'plotting';this.update(changes);
 }
 commit(edit){
  if(this.state.storageRevision>=MAX_REVISION)return fail('revision-capacity');
  const next=clone(persisted(this.state));const result=edit(next);if(result?.ok===false)return result;if(result?.noop)return ok({changed:false});next.storageRevision++;
  const validated=validateSnapshot(next);if(!validated.ok)throw Error(validated.error);this.update(validated.snapshot);this.refresh();return ok({changed:true,...result});
 }
 start(){if(this.state.stage!=='welcome'||this.state.mode!=='observation')return fail('already-started');this.update({stage:'sample',observationT:0,target:0,captureMode:'initial',readingRaw:''});return ok();}
 setReading(raw){if(typeof raw!=='string')return fail('invalid-reading');if(this.state.mode!=='observation'||this.state.stage!=='sample')return fail('not-sample-ready');this.update({readingRaw:raw});return ok();}
 seal(){
  const s=this.state;if(s.mode!=='observation'||s.stage!=='sample'||!Number.isInteger(s.observationT)||s.observationT!==s.records.length||s.records.length>=9)return fail('not-sample-ready');
  if(!readingCorrect(s.readingRaw,s.observationT))return fail(parsePosition(s.readingRaw).status==='valid'?'reading-incorrect':'reading-format');
  const record=freeze({runId:s.runId,sampleId:this.id(),scenarioVersion:SCENARIO_VERSION,tSeconds:s.observationT,observedPositionM:positionAt(s.observationT),studentReadingRaw:s.readingRaw,normalizedReadingM:positionAt(s.observationT),captureMode:s.captureMode,sequence:s.records.length,createdAt:this.now()});
  const result=this.commit(next=>{next.records.push(record);return {record};});if(!result.ok)return result;
  this.generation++;this.update({stage:this.state.records.length===9?'plotting':'segment',target:Math.min(8,this.state.records.length),readingRaw:''});this.refresh();return result;
 }
 beginPlayback(){
  const s=this.state;let from,target;
  if(s.mode==='replay'){if(s.replayPlaying||s.replayT===null||s.replayT>=s.replayEnd)return null;from=s.replayT;target=s.replayEnd;this.update({replayPlaying:true});}
  else{if(!['segment','paused'].includes(s.stage)||s.observationT>=s.target)return null;from=s.observationT;target=s.target;this.update({stage:'playing',captureMode:'animated'});}
  this.generation++;return freeze({runId:s.runId,generation:this.generation,mode:s.mode,from,target});
 }
 advanceClock(t,token){
  const s=this.state;if(!token||token.runId!==s.runId||token.generation!==this.generation||token.mode!==s.mode||!Number.isFinite(t)||t<token.from||t>token.target)return false;
  if(s.mode==='replay'){
   if(!s.replayPlaying||t<s.replayT||token.target!==s.replayEnd)return false;this.update({replayT:t});if(t===s.replayEnd)this.endReplay();return true;
  }
  if(s.stage!=='playing'||t<s.observationT||token.target!==s.target)return false;
  this.update({observationT:t});if(t===s.target){this.generation++;this.update({stage:'sample'});}return true;
 }
 pause(){const s=this.state;this.generation++;if(s.mode==='replay')this.update({replayPlaying:false});else if(s.stage==='playing')this.update({stage:'paused'});return ok();}
 step(){
  const s=this.state;
  if(s.mode==='replay'){
   this.generation++;const t=Math.min(s.replayEnd,Math.floor(s.replayT)+1);this.update({replayT:t,replayPlaying:false});if(t===s.replayEnd)this.endReplay();return ok();
  }
  if(!['segment','playing','paused'].includes(s.stage)||s.observationT>=s.target)return fail('sample-first');
  this.generation++;this.update({observationT:s.target,stage:'sample',captureMode:'step'});return ok();
 }
 startReplay(full=false){
  const s=this.state;if(s.mode!=='observation')return fail('already-replaying');
  const whole=full&&s.records.length===9,segment=!full&&s.stage==='sample'&&s.observationT>=1&&s.records.length===s.observationT;
  if(!whole&&!segment)return fail('replay-unavailable');
  this.generation++;this.update({mode:'replay',replayT:whole?0:s.observationT-1,replayEnd:whole?8:s.observationT,replayPlaying:false,returnStage:s.stage,returnObservationT:s.observationT});return ok();
 }
 endReplay(){if(this.state.mode!=='replay')return fail('not-replaying');this.generation++;this.update({mode:'observation',stage:this.state.returnStage,observationT:this.state.returnObservationT,replayT:null,replayEnd:null,replayPlaying:false,returnStage:null,returnObservationT:null});this.refresh();return ok();}
 collected(){return this.state.records.length===9&&this.state.mode==='observation';}
 setPlot(index,value){
  if(!this.collected())return fail('collect-first');if(!Number.isInteger(index)||index<0||index>8||!(value===null||Number.isInteger(value)&&value>=0&&value<=6))return fail('invalid-plot');
  return this.commit(s=>{const old=s.plot.slots[index];if((old===null&&value===null)||old?.positionM===value)return {noop:true};if(s.plot.revision>=MAX_REVISION)return fail('revision-capacity');s.plot.slots[index]=value===null?null:{tSeconds:index,positionM:value};s.plot.revision++;s.plot.check=null;s.plot.linkedRevision=null;s.interpretation.description.check=null;s.interpretation.numeric.check=null;return {};});
 }
 history(s,kind,check){s.interpretation.history.push({kind,createdAt:this.now(),revision:kind==='plot'?check.plotRevision:kind==='description'?check.descriptionRevision:check.numericRevision,passed:check.passed});if(s.interpretation.history.length>100)s.interpretation.history.shift();}
 checkPlots(){
  if(!this.collected())return fail('collect-first');if(this.state.plot.slots.some(v=>v===null))return fail('place-all-points');
  const result=this.commit(s=>{s.plot.check={plotRevision:s.plot.revision,evidenceFingerprint:fingerprint(s),passed:plotCorrect(s)};this.history(s,'plot',s.plot.check);return {};});return {...result,passed:this.state.status.plotPassed,incorrect:this.state.plot.slots.flatMap((p,i)=>p?.positionM===this.state.records[i]?.observedPositionM?[]:[i])};
 }
 linkPlots(){if(!this.collected()||!this.state.status.plotPassed)return fail('check-plots-first');return this.commit(s=>{if(s.plot.linkedRevision===s.plot.revision)return {noop:true};s.plot.linkedRevision=s.plot.revision;return {};});}
 setDescription(index,value){
  if(!this.collected()||!this.state.status.linked)return fail('link-first');if(!Number.isInteger(index)||index<0||index>2||!(value===null||DIRECTION_OPTIONS.includes(value)))return fail('invalid-description');
  return this.commit(s=>{const d=s.interpretation.description;if(d.choices[index]===value)return {noop:true};if(d.revision>=MAX_REVISION)return fail('revision-capacity');d.choices[index]=value;d.revision++;d.check=null;s.interpretation.numeric.check=null;return {};});
 }
 checkDescriptions(){
  if(!this.collected()||!this.state.status.linked)return fail('link-first');if(this.state.interpretation.description.choices.some(v=>v===null))return fail('choose-all-descriptions');
  const result=this.commit(s=>{const d=s.interpretation.description;d.check={descriptionRevision:d.revision,plotRevision:s.plot.revision,evidenceFingerprint:fingerprint(s),passed:descriptionCorrect(d)};this.history(s,'description',d.check);return {};});return {...result,passed:this.state.status.descriptionPassed};
 }
 numericField(field){return ['distanceRaw','displacementRaw'].includes(field);}
 invalidateNumeric(){return this.commit(s=>{const n=s.interpretation.numeric;if(n.revision>=MAX_REVISION)return fail('revision-capacity');n.revision++;n.check=null;return {};});}
 setNumeric(field,raw){
  if(!this.collected()||!this.state.status.descriptionPassed)return fail('describe-first');if(!this.numericField(field)||typeof raw!=='string')return fail('invalid-numeric');
  if(this.state.composition[field])return ok({composing:true,changed:false});
  if(raw.length>16){this.update({numericInputErrors:{...this.state.numericInputErrors,[field]:true}});const r=this.invalidateNumeric();this.refresh();return fail(r.ok?'numeric-too-long':r.reason);}
  this.update({numericInputErrors:{...this.state.numericInputErrors,[field]:false}});
  const result=this.commit(s=>{const n=s.interpretation.numeric;if(n[field]===raw)return {noop:true};if(n.revision>=MAX_REVISION)return fail('revision-capacity');n[field]=raw;n.revision++;n.check=null;return {};});this.refresh();return result;
 }
 beginComposition(field){if(!this.collected()||!this.state.status.descriptionPassed||!this.numericField(field))return fail('describe-first');if(this.state.composition[field])return ok({changed:false});this.update({composition:{...this.state.composition,[field]:true}});const result=this.invalidateNumeric();this.refresh();return result;}
 endComposition(field,raw){if(!this.numericField(field))return fail('invalid-numeric');this.update({composition:{...this.state.composition,[field]:false}});return this.setNumeric(field,raw);}
 checkNumeric(){
  if(!this.collected()||!this.state.status.descriptionPassed)return fail('describe-first');if(Object.values(this.state.composition).some(Boolean))return fail('composition-active');if(Object.values(this.state.numericInputErrors).some(Boolean))return fail('numeric-too-long');
  const result=this.commit(s=>{const n=s.interpretation.numeric,d=s.interpretation.description;n.check={numericRevision:n.revision,descriptionRevision:d.revision,plotRevision:s.plot.revision,evidenceFingerprint:fingerprint(s),passed:numericCorrect(n)};this.history(s,'numeric',n.check);return {};});return {...result,passed:this.state.status.numericPassed};
 }
 setReflection(text){if(!this.collected())return fail('collect-first');if(typeof text!=='string'||text.length>500)return fail('reflection-too-long');return this.commit(s=>{if(s.reflection===text)return {noop:true};s.reflection=text;return {};});}
 snapshot(){const result=validateSnapshot(persisted(this.state));if(!result.ok)throw Error(result.error);return result.snapshot;}
 exportData(){return freeze({schemaVersion:SCHEMA_VERSION,modelVersion:SCENARIO_VERSION,exportedAt:this.now(),units:{time:'s',position:'m',distance:'m',displacement:'m'},measurementType:'idealized-model-observation',snapshot:this.snapshot(),checks:{...this.state.status}});}
}
