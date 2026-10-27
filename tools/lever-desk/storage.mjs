import {SCHEMA,MODEL,G,clone,uid} from './model.mjs';
import {newExperiment,validateExperiment} from './state.mjs';
export const KEY='bhcs.leverDesk.v1';
export function freshStore(){const e=newExperiment();return {schemaVersion:SCHEMA,modelVersion:MODEL,g:G,currentId:e.id,experiments:[e],commitId:uid(),updatedAt:new Date().toISOString()};}
export function validateStore(v){if(!v||v.schemaVersion!==SCHEMA||v.modelVersion!==MODEL||v.g!==G)throw Error('這份資料版本尚不支援');if(typeof v.currentId!=='string'||typeof v.commitId!=='string'||typeof v.updatedAt!=='string'||!Array.isArray(v.experiments)||!v.experiments.length)throw Error('保存資料結構不完整');const ids=new Set();v.experiments.forEach(e=>{validateExperiment(e);if(ids.has(e.id))throw Error('重複實驗識別碼');ids.add(e.id);});if(!ids.has(v.currentId))throw Error('找不到目前實驗');return true;}
export class Repository{
 constructor(storage){this.storage=storage;this.raw=null;this.status='ready';this.error='';this.backupOffered=false;this.backupConfirmed=false;this.expectedRaw=null;this.data=freshStore();try{this.raw=storage.getItem(KEY);this.expectedRaw=this.raw;if(this.raw!==null){const v=JSON.parse(this.raw);validateStore(v);this.data=clone(v);}}catch(e){this.status='isolated';this.error=`原資料已隔離，未被覆寫：${e.message}`;}}
 save(){if(this.status==='isolated'||this.status==='conflict')return false;try{if(this.storage.getItem(KEY)!==this.expectedRaw){this.status='conflict';this.error='另一分頁有新變更；已暫停寫入。請先匯出本分頁資料，再重新載入。';return false;}validateStore(this.data);this.data.commitId=uid();this.data.updatedAt=new Date().toISOString();const raw=JSON.stringify(this.data);this.storage.setItem(KEY,raw);this.expectedRaw=raw;const read=this.storage.getItem(KEY);if(read!==raw||JSON.parse(read).commitId!==this.data.commitId)throw Error('寫入後讀回不符');this.raw=raw;this.status='ready';this.error='';return true;}catch(e){this.status='unsaved';this.error=`尚未存到這個瀏覽器：${e.message}。記憶體工作仍保留，請匯出或重試。`;return false;}}
 detectExternal(raw){if(raw!==this.expectedRaw&&this.status!=='isolated'){this.status='conflict';this.error='另一分頁有新變更；已暫停寫入。先匯出本分頁資料，再重新載入。';}}
 updateExperiment(e){if(this.status==='isolated')throw Error('隔離模式不可修改');validateExperiment(e);const i=this.data.experiments.findIndex(v=>v.id===e.id);if(i<0)this.data.experiments.push(clone(e));else this.data.experiments[i]=clone(e);this.data.currentId=e.id;return this.save();}
 original(){if(this.raw===null)throw Error('沒有可讀取的原始字串');return this.raw;}
 export(){return JSON.stringify(this.data,null,2);}
 markBackupOffered(){this.backupOffered=true;}
 confirmBackup(value){this.backupConfirmed=this.backupOffered&&value===true;}
 reset(){if(this.status!=='isolated'||!this.backupOffered||!this.backupConfirmed)throw Error('必須先下載原始資料，並確認已保留備份');if(this.storage.getItem(KEY)!==this.raw)throw Error('原資料已由另一分頁變更，請重新載入');const next=freshStore();const raw=JSON.stringify(next);this.storage.setItem(KEY,raw);if(this.storage.getItem(KEY)!==raw)throw Error('重設後讀回不符，請保留備份');this.data=next;this.raw=raw;this.expectedRaw=raw;this.status='ready';this.error='';this.backupOffered=false;this.backupConfirmed=false;return next;}
}
