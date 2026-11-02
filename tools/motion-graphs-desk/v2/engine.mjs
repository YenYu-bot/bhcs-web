import {SCHEMA_VERSION,SCENARIO_VERSION,MAX_REVISION,CASE_IDS,QUESTION_IDS,QUESTION_DEFS,CERTIFICATE_IDS,CERTIFICATE_QUESTIONS,freeze,clone,canonical,derive,emptySnapshot,validateSnapshot,validateResponse,evaluateQuestion,makeCheck,caseFingerprint,ancestors,statusOf,questionLayerAvailable} from './model.mjs';
let serial=0;const newId=()=>globalThis.crypto?.randomUUID?.()||`course-${Date.now()}-${++serial}`;
const good=extra=>({ok:true,...extra}),bad=reason=>({ok:false,reason});
const persisted=s=>Object.fromEntries(['schemaVersion','scenarioVersion','courseRunId','storageRevision','cases','answers','certificates','history','reflection'].map(k=>[k,s[k]]));
export class CourseEngine {
 constructor(snapshot=null,{id=newId,now=()=>new Date().toISOString()}={}){
  this.id=id;this.now=now;this.generation=0;
  const data=snapshot??emptySnapshot(id(),Object.fromEntries(CASE_IDS.map(c=>[c,id()]))),v=validateSnapshot(data);if(!v.ok)throw Error(v.error);
  this.caseTimes=Object.fromEntries(CASE_IDS.map(c=>[c,v.snapshot.cases[c].observedInteger??0]));const status=statusOf(v.snapshot);
  const currentCaseId=CASE_IDS.find(c=>status.caseWindows[c]>0&&(v.snapshot.cases[c].observedInteger??-1)<status.caseWindows[c])??'R';
  this.state=freeze({...v.snapshot,currentCaseId,observedThrough:this.caseTimes[currentCaseId],target:status.caseWindows[currentCaseId],mode:'observation',playing:false,replayT:null,replayTarget:null,status,phase:'paused',composition:{},inputErrors:{}});this.refresh();
 }
 update(change){this.state=freeze({...this.state,...change});}
 refresh(){const status=statusOf(this.state);if(Object.keys(this.state.composition).length||Object.keys(this.state.inputErrors).length)status.complete=false;const c=this.state.currentCaseId,t=this.caseTimes[c];this.update({status,observedThrough:t,target:status.caseWindows[c],phase:this.state.mode==='replay'?'replay':!this.state.cases[c].samples.length?'welcome':this.state.playing?'playing':t>=status.caseWindows[c]?'window-complete':'paused'});}
 commit(edit){if(this.state.storageRevision>=MAX_REVISION)return bad('revision-capacity');const next=clone(persisted(this.state)),result=edit(next);if(result?.ok===false)return result;if(result?.noop)return good({changed:false});next.storageRevision++;const checked=validateSnapshot(next);if(!checked.ok)throw Error(checked.error);this.update(checked.snapshot);this.refresh();return good({changed:true,...result});}
 selectCase(caseId){if(!CASE_IDS.includes(caseId))return bad('invalid-case');if(this.state.status.caseWindows[caseId]===0)return bad('case-locked');if(this.state.mode==='replay')this.endReplay();this.pause();this.update({currentCaseId:caseId});this.refresh();return good();}
 start(){const id=this.state.currentCaseId;if(this.state.mode!=='observation'||this.state.status.caseWindows[id]===0)return bad('case-locked');if(this.state.cases[id].samples.length)return good({changed:false});return this.commit(s=>{const c=s.cases[id];c.samples.push({t:0,x:derive(id,0).x,captureMode:'initial',sequence:0});c.observedInteger=0;c.sampleFingerprint=caseFingerprint(c);return {};});}
 beginPlayback(expectedMode=this.state.mode){const s=this.state,id=s.currentCaseId;if(s.mode!==expectedMode||s.playing)return null;const from=s.mode==='replay'?s.replayT:this.caseTimes[id],target=s.mode==='replay'?s.replayTarget:s.status.caseWindows[id];if(!s.cases[id].samples.length||from>=target)return null;this.generation++;this.update({playing:true});this.refresh();return freeze({runId:s.cases[id].runId,courseRunId:s.courseRunId,caseId:id,generation:this.generation,mode:s.mode,from,target});}
 pause(){this.generation++;this.update({playing:false});this.refresh();return good();}
 advanceObservation(t,mode){
  const id=this.state.currentCaseId,c=this.state.cases[id],old=this.caseTimes[id];if(this.state.mode!=='observation'||!c.samples.length||!['animated','step'].includes(mode))return bad('not-observing');if(!Number.isFinite(t)||t<old||t>this.state.status.caseWindows[id])return bad('invalid-time');
  const end=Math.floor(t),start=c.observedInteger+1;
  if(end>=start){const result=this.commit(s=>{const item=s.cases[id];for(let n=start;n<=end;n++)item.samples.push({t:n,x:derive(id,n).x,captureMode:mode,sequence:n});item.observedInteger=end;item.sampleFingerprint=caseFingerprint(item);return {};});if(!result.ok)return result;}
  this.caseTimes[id]=t;this.refresh();return good({sampled:end>=start});
 }
 advanceClock(t,token){const s=this.state,id=s.currentCaseId;if(!token||!s.playing||token.courseRunId!==s.courseRunId||token.runId!==s.cases[id].runId||token.caseId!==id||token.generation!==this.generation||token.mode!==s.mode||!Number.isFinite(t)||t<token.from||t>token.target)return false;
  if(s.mode==='replay'){if(t<s.replayT||token.target!==s.replayTarget)return false;this.update({replayT:t});if(t===s.replayTarget)this.endReplay();return true;}
  if(token.target!==s.status.caseWindows[id]||t<this.caseTimes[id])return false;const result=this.advanceObservation(t,'animated');if(!result.ok){this.pause();return false;}if(t===token.target)this.pause();return true;
 }
 step(){const s=this.state;if(s.mode==='replay'){this.generation++;const t=Math.min(s.replayTarget,Math.floor(s.replayT)+1);this.update({replayT:t,playing:false});if(t===s.replayTarget)this.endReplay();return good();}const id=s.currentCaseId;if(!s.cases[id].samples.length)return bad('start-first');const t=Math.min(s.status.caseWindows[id],Math.floor(this.caseTimes[id])+1);if(t<=this.caseTimes[id])return bad('window-complete');this.pause();return this.advanceObservation(t,'step');}
 stepObservation(){return this.state.mode==='observation'?this.step():bad('mode-changed');}
 stepReplay(){return this.state.mode==='replay'?this.step():bad('mode-changed');}
 startReplay(){const s=this.state,end=s.cases[s.currentCaseId].observedInteger;if(s.mode==='replay')return bad('already-replaying');if(end===null||end===0)return bad('replay-unavailable');this.pause();this.update({mode:'replay',replayT:0,replayTarget:end,playing:false});this.refresh();return good();}
 endReplay(){if(this.state.mode!=='replay')return bad('not-replaying');this.generation++;this.update({mode:'observation',replayT:null,replayTarget:null,playing:false});this.refresh();return good();}
 invalidate(s,id){s.answers[id].currentCheck=null;for(const child of QUESTION_IDS)if(ancestors(child).includes(id))s.answers[child].currentCheck=null;}
 editInvalidation(id){return this.commit(s=>{const a=s.answers[id];if(a.revision>=MAX_REVISION)return bad('revision-capacity');a.revision++;this.invalidate(s,id);return {};});}
 setAnswer(id,patch){
  if(!QUESTION_IDS.includes(id)||!patch||typeof patch!=='object'||Array.isArray(patch))return bad('invalid-question');if(this.state.mode==='replay')return bad('replay-read-only');if(!questionLayerAvailable(this.state,id))return bad('question-locked');
  const fields=QUESTION_DEFS[id].fields,allowed=fields.map(f=>f.path);if(Object.keys(patch).some(k=>!allowed.includes(k)))return bad('invalid-field');
  const edits={};for(const[key,value]of Object.entries(patch)){if(this.state.composition[`${id}:${key}`])continue;const f=fields.find(f=>f.path===key);edits[key]=f.type==='multiselect'&&Array.isArray(value)?f.options.map(o=>o.value).filter(v=>value.includes(v)):value;if(f.type==='multiselect'&&Array.isArray(value)&&(value.some(v=>!f.options.some(o=>o.value===v))||new Set(value).size!==value.length))edits[key]=value;}
  const response={...clone(this.state.answers[id].response),...edits};
  if(!validateResponse(id,response)){this.update({inputErrors:{...this.state.inputErrors,[id]:true}});const result=this.editInvalidation(id);this.refresh();return bad(result.ok?'invalid-response':result.reason);}
  const errors={...this.state.inputErrors};delete errors[id];this.update({inputErrors:errors});
  const result=this.commit(s=>{const a=s.answers[id];if(canonical(a.response)===canonical(response))return {noop:true};if(a.revision>=MAX_REVISION)return bad('revision-capacity');a.response=response;a.revision++;this.invalidate(s,id);return {};});this.refresh();return result;
 }
 beginComposition(id,path){if(!QUESTION_IDS.includes(id)||!QUESTION_DEFS[id].fields.some(f=>f.path===path&&f.type==='number')||!questionLayerAvailable(this.state,id)||this.state.mode==='replay')return bad('invalid-composition');const key=`${id}:${path}`;if(this.state.composition[key])return good({changed:false});this.update({composition:{...this.state.composition,[key]:true}});const result=this.editInvalidation(id);this.refresh();return result;}
 endComposition(id,path,raw){const key=`${id}:${path}`,composition={...this.state.composition};delete composition[key];this.update({composition});return this.setAnswer(id,{[path]:raw});}
 issueCertificates(s){for(let i=0;i<CERTIFICATE_IDS.length;i++){const certificateId=CERTIFICATE_IDS[i];if(s.certificates.some(c=>c.certificateId===certificateId))continue;if(i&&!s.certificates.some(c=>c.certificateId===CERTIFICATE_IDS[i-1]))break;const required=CERTIFICATE_QUESTIONS[certificateId];if(!required.every(id=>s.answers[id].currentCheck?.passed===true))break;s.certificates.push({certificateId,parentCertificateId:i?CERTIFICATE_IDS[i-1]:null,courseRunId:s.courseRunId,scenarioVersion:SCENARIO_VERSION,proofs:required.map(id=>({questionId:id,...clone(s.answers[id])}))});}}
 checkAnswer(id){
  if(!QUESTION_IDS.includes(id))return bad('invalid-question');if(this.state.mode==='replay')return bad('replay-read-only');if(!questionLayerAvailable(this.state,id)||!QUESTION_DEFS[id].parents.every(p=>this.state.answers[p].currentCheck?.passed===true))return bad('prerequisites-first');if(Object.keys(this.state.composition).some(key=>key.startsWith(`${id}:`)))return bad('composition-active');if(this.state.inputErrors[id])return bad('invalid-response');
  const evaluation=evaluateQuestion(this.state,id,this.state.answers[id].response);if(!evaluation.ready)return bad('select-observed-evidence');
  const result=this.commit(s=>{s.answers[id].currentCheck=makeCheck(s,id);s.history.push({questionId:id,revision:s.answers[id].revision,passed:s.answers[id].currentCheck.passed,createdAt:this.now()});if(s.history.length>100)s.history.shift();this.issueCertificates(s);return {};});return {...result,passed:result.ok?evaluation.passed:false,issues:evaluation.issues};
 }
 setReflection(text){if(this.state.mode==='replay')return bad('replay-read-only');if(typeof text!=='string'||text.length>500)return bad('reflection-too-long');return this.commit(s=>{if(s.reflection===text)return {noop:true};s.reflection=text;return {};});}
 visibleReadings(caseId=this.state.currentCaseId){if(!CASE_IDS.includes(caseId))return[];return freeze(this.state.cases[caseId].samples.map(sample=>({...sample,...(this.state.status.canVelocity?{v:derive(caseId,sample.t).v}:{})})));}
 cursorReading(caseId,t){if(!CASE_IDS.includes(caseId)||!this.state.cases[caseId].samples.length||!Number.isFinite(t)||t<0||t>this.caseTimes[caseId])return null;const value=derive(caseId,t);return freeze({t,x:value.x,...(this.state.status.canVelocity?{v:value.v}:{})});}
 snapshot(){const result=validateSnapshot(persisted(this.state));if(!result.ok)throw Error(result.error);return result.snapshot;}
 exportData(){return freeze({schemaVersion:SCHEMA_VERSION,scenarioVersion:SCENARIO_VERSION,exportedAt:this.now(),units:{t:'s',x:'m',...(this.state.status.canVelocity?{v:'m/s'}:{})},source:'simulated-model-observations',snapshot:this.snapshot(),...(this.state.status.canVelocity?{velocityReadings:Object.fromEntries(CASE_IDS.map(c=>[c,this.visibleReadings(c).map(({t,v})=>({t,v}))]))}:{}),currentPassedQuestions:[...this.state.status.passedQuestions],explanations:Object.fromEntries(this.state.status.passedQuestions.map(id=>[id,{basis:'checked-student-response',response:clone(this.state.answers[id].response)}]))});}
}
export const Engine=CourseEngine;
