// Read-only learning summary over captured evidence. No optics/controller state is changed.
import { calculateLensState, calculateClarity, NUMERIC_EPSILON } from './optics-guided/model.js';
import { CASES } from './five-case.js';
const ALL = CASES.map(c=>c.id);
const DEFINITIONS = [
 {id:'q1',title:'問題 1｜比較三次實像',dependencies:['outside2f','at2f','between'],prompt:'依照「我的觀察」中三筆實像紀錄，哪一項描述與證據相符？',options:[{id:'real-comparison',text:'2f 外縮小、2f 上等大、f 與 2f 間放大；三者都倒立。'},{id:'all-same',text:'三者都倒立，而且大小都一樣。'},{id:'all-upright',text:'三者都正立；只有大小改變。'}],correct:'real-comparison'},
 {id:'q2',title:'問題 2｜同樣接不到像，原因相同嗎？',dependencies:['focal','inside'],prompt:'比較「f 上」與「f 內」的搜索及觀察紀錄，哪一項解釋符合這個模擬模型？',options:[{id:'both-virtual',text:'兩者都是正立、放大的虛像。'},{id:'different-causes',text:'f 上的出射光線平行；f 內形成可從透鏡後觀察的虛像。'},{id:'both-no-image',text:'兩者都表示用任何方式都看不到影像。'}],correct:'different-causes'},
 {id:'q3',title:'問題 3｜有限搜索能說明什麼？',dependencies:ALL,prompt:'只在 8–40 cm 光屏範圍內沒有找到清楚的像，能直接判定它一定是虛像嗎？試想焦距 10 cm、物距 11 cm 的新條件。',options:[{id:'must-virtual',text:'可以；在光屏上找不到，就一定是虛像。'},{id:'finite-not-proof',text:'不可以；清楚的實像位置也可能超出這張實驗桌。'},{id:'must-focal',text:'可以判定物體一定在焦點上。'}],correct:'finite-not-proof'},
];
const classOf=l=>l.imageType==='infinite'?'focal':l.imageType==='virtual'?'inside':l.imageSize==='smaller'?'outside2f':l.imageSize==='same'?'at2f':'between';
const sameModelNumber=(value,expected)=>expected===null?value===null:typeof value==='number'&&Number.isFinite(value)&&Math.abs(value-expected)<=NUMERIC_EPSILON*Math.max(1,Math.abs(value),Math.abs(expected));
export function validRecord(id,r){
 if(!r||typeof r!=='object'||r.caseId!==id||r.f!==10||typeof r.u!=='number'||!Number.isFinite(r.u)||r.u<5||r.u>35)return false;
 if(typeof r.screenPosition!=='number'||!Number.isFinite(r.screenPosition)||r.screenPosition<8||r.screenPosition>40)return false;
 try{
  const l=calculateLensState({f:r.f,u:r.u});if(classOf(l)!==id)return false;
  for(const field of ['imageType','imageOrientation','imageSize'])if(r[field]!==l[field])return false;
  for(const field of ['theoreticalV','magnification','absoluteMagnification'])if(!sameModelNumber(r[field],l[field]))return false;
  const clarity=calculateClarity({lensState:l,screenPosition:r.screenPosition}).effectiveClarityLevel;
  if(r.clarity!==clarity)return false;
  if(l.imageType==='real')return r.evidenceKind==='screen'&&typeof r.observedScreenPosition==='number'&&Number.isFinite(r.observedScreenPosition)&&r.observedScreenPosition>=8&&r.observedScreenPosition<=40&&r.observedScreenPosition===r.screenPosition&&clarity===1;
  return r.observedScreenPosition===null&&r.evidenceKind===(l.imageType==='infinite'?'focal':'virtual')&&Array.isArray(r.searchedZones)&&r.searchedZones.length===3&&['near','middle','far'].every(z=>r.searchedZones.includes(z));
 }catch{return false;}
}
const normalized=(id,r)=>validRecord(id,r)?{snapshotId:r.snapshotId??null,caseId:id,f:r.f,u:r.u,observedScreenPosition:r.evidenceKind==='screen'?r.observedScreenPosition:null,screenPosition:r.screenPosition??null,imageType:r.imageType,imageOrientation:r.imageOrientation,imageSize:r.imageSize,magnification:r.magnification,absoluteMagnification:r.absoluteMagnification,theoreticalV:r.theoreticalV,evidenceKind:r.evidenceKind,searchedZones:[...(r.searchedZones??[])].sort(),clarity:r.clarity}:null;
const dependencyKey=(definition,records)=>JSON.stringify(definition.dependencies.map(id=>[id,normalized(id,records?.[id])]));
export function createLearningState(){return {questions:Object.fromEntries(DEFINITIONS.map(q=>[q.id,{dependencyKey:null,revision:0,answer:null,correct:false}]))};}
export function reconcileLearning(previous,records){
 const next=structuredClone(previous??createLearningState());
 for(const q of DEFINITIONS){const key=dependencyKey(q,records),old=next.questions[q.id];if(old.dependencyKey!==key)next.questions[q.id]={dependencyKey:key,revision:old.revision+1,answer:null,correct:false};}
 return next;
}
const fingerprintOf=(q,s)=>JSON.stringify([q.id,s.revision,s.dependencyKey]);
export function compareRows(records){return CASES.map(c=>{const r=records?.[c.id];if(!validRecord(c.id,r))return {id:c.id,label:c.label,ready:false,status:'待觀察',f:null,u:null,observedScreenPosition:null,imageOrientation:null,imageSize:null,magnification:null,theoreticalV:null,evidenceKind:null};
 const focal=r.evidenceKind==='focal';return {id:c.id,label:c.label,ready:true,status:'已觀察',f:r.f,u:r.u,observedScreenPosition:r.evidenceKind==='screen'?r.observedScreenPosition:null,imageOrientation:focal?null:r.imageOrientation,imageSize:focal?null:r.imageSize,magnification:focal?null:r.magnification,theoreticalV:focal?null:r.theoreticalV,evidenceKind:r.evidenceKind};});}
function feedback(q,s,records){if(s.answer===null)return '';
 if(q.id==='q1'){const values=q.dependencies.map(id=>`${records[id].observedScreenPosition} cm`).join('、');return s.correct?`與這三筆證據相符。你實際記錄的光屏位置是 ${values}；2f 外縮小、2f 上等大、f 與 2f 間放大；三者都倒立。`:'再看「我的觀察」前三筆的影像方向與大小，不要只看光屏位置。你可以重新選擇。';}
 if(q.id==='q2')return s.correct?'兩種情況的搜索都沒有找到清楚屏幕像，但模型說明不同：f 上出射光線平行；f 內形成正立放大的虛像。':'回看「f 上／f 內」紀錄與模型說明。不能把「屏幕接不到像」直接當成兩者成像性質相同。你可以重試。';
 const transfer=calculateLensState({f:10,u:11});const explanation=`轉移例（模型計算）：f＝${transfer.f} cm、u＝${transfer.u} cm，形成${transfer.imageType==='real'?'實像':'非實像'}，理論像距為 ${transfer.theoreticalV} cm，超出 8–40 cm 光屏範圍。有限搜索不是所有距離的證明。`;
 return (s.correct?'判斷有根據。':'再想想搜索範圍的限制，然後重試。')+explanation;
}
export function learningView(previous,records){const state=reconcileLearning(previous,records);const questions=DEFINITIONS.map(q=>{const s=state.questions[q.id],missing=q.dependencies.filter(id=>!validRecord(id,records?.[id]));return {id:q.id,title:q.title,prompt:q.prompt,options:q.options.map(o=>({...o})),dependencies:[...q.dependencies],ready:missing.length===0,missing,fingerprint:fingerprintOf(q,s),answer:s.answer,correct:s.correct,feedback:missing.length?'':feedback(q,s,records)};});return {questions,complete:questions.every(q=>q.ready&&q.correct),comparisonRows:compareRows(records)};}
export function answerLearning(previous,records,action){const state=reconcileLearning(previous,records),q=DEFINITIONS.find(x=>x.id===action?.question);if(!q)return {state,accepted:false,reason:'unknown-question'};const s=state.questions[q.id];if(action.fingerprint!==fingerprintOf(q,s))return {state,accepted:false,reason:'stale-evidence'};if(q.dependencies.some(id=>!validRecord(id,records?.[id])))return {state,accepted:false,reason:'missing-evidence'};if(!q.options.some(o=>o.id===action.choice))return {state,accepted:false,reason:'unknown-choice'};if(s.correct)return {state,accepted:false,reason:'already-correct'};s.answer=action.choice;s.correct=action.choice===q.correct;return {state,accepted:true};}
