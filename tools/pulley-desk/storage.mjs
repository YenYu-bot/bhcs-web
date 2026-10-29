import {SCHEMA,MODEL,G,MAX_RECORDS,clone,uid,exactKeys,validId,validDate,deepFreeze,validateRecord,validatePair,pairKey,WORK_KEYS,workCorrect} from './model.mjs';
export const KEY='bhcs.pulleyDesk.v1';
export function freshStore(){return {schemaVersion:SCHEMA,modelVersion:MODEL,g:G,records:[],pairs:{},commitId:uid(),updatedAt:new Date().toISOString()};}
export function validateStore(value){
 exactKeys(value,['schemaVersion','modelVersion','g','records','pairs','commitId','updatedAt'],'儲存資料');
 if(value.schemaVersion!==SCHEMA||value.modelVersion!==MODEL||value.g!==G)throw Error('資料版本尚不支援');
 if(!validId(value.commitId)||!validDate(value.updatedAt)||!Array.isArray(value.records)||value.records.length>MAX_RECORDS)throw Error('資料身分或紀錄筆數無效');
 const records=new Map(),runs=new Set();
 for(const record of value.records){validateRecord(record);if(records.has(record.recordId)||runs.has(record.runId))throw Error('重複證據或輪次');records.set(record.recordId,record);runs.add(record.runId);}
 if(!value.pairs||typeof value.pairs!=='object'||Array.isArray(value.pairs)||Object.getPrototypeOf(value.pairs)!==Object.prototype)throw Error('比較歷程格式無效');
 const revisionIds=new Set();
 for(const [key,pair] of Object.entries(value.pairs)){
  exactKeys(pair,['fixedId','movableId','work','hinted','revisions'],'比較紀錄');
  if(!records.has(pair.fixedId)||!records.has(pair.movableId)||key!==pairKey(pair.fixedId,pair.movableId))throw Error('比較引用的證據不存在');
  validatePair(records.get(pair.fixedId),records.get(pair.movableId));
  exactKeys(pair.work,WORK_KEYS,'功答案');
  for(const answer of Object.values(pair.work))if(answer!==null&&(!Number.isSafeInteger(answer)||answer<0))throw Error('功答案格式無效');
  if(typeof pair.hinted!=='boolean'||!Array.isArray(pair.revisions))throw Error('提示或解釋格式無效');
  for(const revision of pair.revisions){
   exactKeys(revision,['id','text','createdAt'],'解釋修訂');
   if(!validId(revision.id)||revisionIds.has(revision.id)||typeof revision.text!=='string'||!revision.text.trim()||revision.text!==revision.text.trim()||revision.text.length>5000||!validDate(revision.createdAt))throw Error('解釋修訂內容無效');
   revisionIds.add(revision.id);
  }
 }
 return true;
}
function freezeRecords(data){for(const record of data.records)deepFreeze(record);return data;}
export class Repository{
 constructor(storage){
  this.storage=storage;this.data=freshStore();this.raw=null;this.expectedRaw=null;this.rawAvailable=false;this.status='persisted';this.blockedReason='';this.error='';this.backupOffered=false;this.backupConfirmed=false;
  try{
   const raw=storage.getItem(KEY);this.raw=raw;this.expectedRaw=raw;this.rawAvailable=true;
   if(raw!==null){const parsed=JSON.parse(raw);validateStore(parsed);this.data=freezeRecords(parsed);}
  }catch(error){
   this.status='blocked';this.blockedReason=this.rawAvailable?'corrupt':'read';
   this.error=this.rawAvailable?`原始資料異常，已停止寫入且未覆寫：${error.message}`:`無法讀取本機資料，已停止寫入；本頁仍可操作：${error.message}`;
  }
 }
 save(){
  if(this.status==='blocked')return false;
  try{
   validateStore(this.data);
   const current=this.storage.getItem(KEY);
   if(current!==this.expectedRaw){this.status='blocked';this.blockedReason='conflict';this.error='另一分頁資料已變更，已停止寫入。請匯出本頁資料，再重新載入。';return false;}
   const candidate={...this.data,commitId:uid(),updatedAt:new Date().toISOString()};
   const raw=JSON.stringify(candidate);this.storage.setItem(KEY,raw);
   // Remember a successful write before checking its echo. A failed echo must not overwrite a later writer.
   this.expectedRaw=raw;
   if(this.storage.getItem(KEY)!==raw)throw Error('寫入後讀回不一致');
   this.data.commitId=candidate.commitId;this.data.updatedAt=candidate.updatedAt;
   this.raw=raw;this.rawAvailable=true;this.status='persisted';this.error='';this.blockedReason='';return true;
  }catch(error){this.status='memoryOnly';this.error=`本頁保留，尚未存入裝置，重新整理可能遺失：${error.message}`;return false;}
 }
 retry(){return this.save();}
 addRecord(record){
  validateRecord(record);
  const existing=this.data.records.find(item=>item.runId===record.runId||item.recordId===record.recordId);
  if(existing){if(JSON.stringify(existing)!==JSON.stringify(record))throw Error('同一輪次已有不同證據，拒絕覆寫');return existing;}
  if(this.data.records.length>=MAX_RECORDS)throw Error('已達 50 筆，請先匯出或明確開始新實驗；舊證據未刪除');
  const copy=deepFreeze(clone(record));this.data.records.push(copy);this.save();return copy;
 }
 ensurePair(fixedId,movableId){
  const fixed=this.data.records.find(r=>r.recordId===fixedId),movable=this.data.records.find(r=>r.recordId===movableId);validatePair(fixed,movable);
  const key=pairKey(fixedId,movableId);
  if(!Object.hasOwn(this.data.pairs,key))this.data.pairs[key]={fixedId,movableId,work:Object.fromEntries(WORK_KEYS.map(name=>[name,null])),hinted:false,revisions:[]};
  return this.data.pairs[key];
 }
 setWork(fixedId,movableId,work){
  exactKeys(work,WORK_KEYS,'功答案');for(const answer of Object.values(work))if(answer!==null&&(!Number.isSafeInteger(answer)||answer<0))throw Error('功答案格式無效');
  const pair=this.ensurePair(fixedId,movableId);pair.work=clone(work);this.save();return pair;
 }
 markHinted(fixedId,movableId){const pair=this.ensurePair(fixedId,movableId);if(!pair.hinted){pair.hinted=true;this.save();}return pair;}
 appendRevision(fixedId,movableId,text,revisionId=uid()){
  const pair=this.ensurePair(fixedId,movableId);
  if(!workCorrect(pair))throw Error('先完成這一對紀錄的四格計算');
  if(typeof text!=='string'||!text.trim()||text.trim().length>5000)throw Error('請寫下解釋，最多 5000 字');
  if(!validId(revisionId))throw Error('修訂識別碼無效');
  const existing=Object.values(this.data.pairs).flatMap(p=>p.revisions).find(r=>r.id===revisionId);
  if(existing){if(pair.revisions.includes(existing)&&existing.text===text.trim())return existing;throw Error('修訂識別碼已使用');}
  const revision={id:revisionId,text:text.trim(),createdAt:new Date().toISOString()};pair.revisions.push(revision);this.save();return revision;
 }
 detectExternal(raw){
  if(raw!==this.expectedRaw){this.status='blocked';this.blockedReason='conflict';this.error='另一分頁資料已變更，已停止寫入。請匯出本頁資料，再重新載入。';return true;}
  return false;
 }
 original(){if(!this.rawAvailable||this.raw===null)throw Error('沒有可讀取的原始字串，無法提供原始備份');return this.raw;}
 export(){return JSON.stringify(this.data,null,2);}
 markBackupOffered(){this.backupOffered=true;}
 confirmBackup(value){this.backupConfirmed=this.backupOffered&&value===true;}
 reset({confirmed=false}={}){
  if(!confirmed||!this.backupOffered||!this.backupConfirmed)throw Error('請先備份並勾選確認，再確認開始新實驗');
  if(!this.rawAvailable||this.blockedReason==='read')throw Error('尚未讀取原始資料，不能安全重設；請重新載入');
  if(this.blockedReason==='conflict')throw Error('其他分頁已變更資料，請先匯出本頁並重新載入');
  const previousStatus=this.status,previousReason=this.blockedReason;
  try{
   if(this.storage.getItem(KEY)!==this.expectedRaw){this.status='blocked';this.blockedReason='conflict';throw Error('原資料已變更，請重新載入');}
   const candidate=freshStore(),raw=JSON.stringify(candidate);
   this.storage.setItem(KEY,raw);
   if(this.storage.getItem(KEY)!==raw)throw Error('重設後讀回不符');
   this.data=candidate;this.raw=raw;this.expectedRaw=raw;this.rawAvailable=true;this.status='persisted';this.blockedReason='';this.error='';this.backupOffered=false;this.backupConfirmed=false;return this.data;
  }catch(error){
   if(this.blockedReason!=='conflict'){this.status=previousStatus==='blocked'?'blocked':'memoryOnly';this.blockedReason=previousReason;}
   this.error=`尚未確認清除成功，請保留備份：${error.message}`;throw error;
  }
 }
}
