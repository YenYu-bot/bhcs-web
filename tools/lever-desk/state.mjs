import {SCHEMA,MODEL,G,clone,uid,initialLayout,validateLayout,evidence,validateRecord,qualifies,signature} from './model.mjs';
const STEPS=['A','B','C','explore','challenge'];
export function newExperiment(){return {id:uid(),revision:0,layout:initialLayout(),records:[],drafts:[],step:'A'};}
export function validateExperiment(e){if(!e||typeof e.id!=='string'||!Number.isInteger(e.revision)||e.revision<0||!STEPS.includes(e.step)||!Array.isArray(e.records)||e.records.length>50||!Array.isArray(e.drafts))throw Error('實驗格式不完整');validateLayout(e.layout);const ids=new Set();e.records.forEach((r,i)=>{validateRecord(r);if(r.experimentId!==e.id||r.revision>e.revision||r.sequence!==i+1||ids.has(r.recordId))throw Error('證據來源或排序不一致');ids.add(r.recordId);});e.drafts.forEach(d=>{if(!d||typeof d.text!=='string'||d.experimentId!==e.id||typeof d.signature!=='string'||!Number.isInteger(d.revision)||d.revision<0||d.revision>e.revision||typeof d.createdAt!=='string')throw Error('筆記來源不完整');});return true;}
export class Engine{
 constructor(experiment=newExperiment()){validateExperiment(experiment);this.experiment=clone(experiment);this.mode='fixed';this.currentRecord=null;this.history=[];this.redoHistory=[];this.operations=new Map();}
 guard(){if(this.mode!=='fixed')throw Error('請先取消選點，或回到水平並固定');}
 beginPreview(){this.guard();this.mode='preview';this.previewToken=uid();return this.previewToken;}
 cancelPreview(token=this.previewToken){if(this.mode==='preview'&&token===this.previewToken){this.mode='fixed';this.previewToken=null;}}
 commitPreview(id,x,token=this.previewToken){if(this.mode!=='preview'||token!==this.previewToken)throw Error('選點已取消或過期');this.mode='fixed';this.previewToken=null;return this.move(id,x);}
 commit(l,force=false){this.guard();validateLayout(l);if(!force&&signature(l)===signature(this.experiment.layout))return false;this.redoHistory=[];this.history.push(clone(this.experiment.layout));this.history=this.history.slice(-20);this.experiment.layout=clone(l);this.experiment.revision++;this.currentRecord=null;return true;}
 move(id,x){this.guard();if(!Object.hasOwn(this.experiment.layout,id))throw Error('未知砝碼');const l=clone(this.experiment.layout);l[id]=x;return this.commit(l);}
 undo(){this.guard();if(!this.history.length)throw Error('沒有可復原的操作');this.redoHistory.push(clone(this.experiment.layout));this.experiment.layout=this.history.pop();this.experiment.revision++;this.currentRecord=null;return true;}
 redo(){this.guard();if(!this.redoHistory.length)throw Error('沒有可重做的操作');this.history.push(clone(this.experiment.layout));this.experiment.layout=this.redoHistory.pop();this.experiment.revision++;this.currentRecord=null;return true;}
 measure(operationId=uid()){this.guard();if(this.operations.has(operationId))return this.operations.get(operationId);let r=this.experiment.records.find(r=>r.revision===this.experiment.revision);if(!r){if(this.experiment.records.length>=50)throw Error('已達 50 筆：請匯出資料或開始新實驗；舊證據未刪除');r={recordId:uid(),experimentId:this.experiment.id,schemaVersion:SCHEMA,modelVersion:MODEL,g:G,createdAt:new Date().toISOString(),revision:this.experiment.revision,sequence:this.experiment.records.length+1,...evidence(this.experiment.layout),horizontalLocked:true,angle:0,angularVelocity:0,teacherStep:this.experiment.step,qualification:qualifies(this.experiment.layout)};this.experiment.records.push(clone(r));}this.currentRecord=r.recordId;this.operations.set(operationId,clone(r));return clone(r);}
 release(){this.guard();this.mode='released';this.currentRecord=null;}
 fix(){if(this.mode!=='released')throw Error('目前已在水平位置');this.mode='fixed';}
 setStep(step){this.guard();if(!STEPS.includes(step))throw Error('未知任務');this.experiment.step=step;}
 loadStep(){this.guard();let l=initialLayout();if(this.experiment.step==='C')l.w3=20;if(this.experiment.step==='challenge'){l.w1=-15;l.w2=-15;l.w3=null;}return this.commit(l,true);}
 restore(l){this.guard();return this.commit(l,true);}
 note(text){this.guard();this.experiment.drafts.push({text,experimentId:this.experiment.id,signature:signature(this.experiment.layout),revision:this.experiment.revision,createdAt:new Date().toISOString()});}
}
