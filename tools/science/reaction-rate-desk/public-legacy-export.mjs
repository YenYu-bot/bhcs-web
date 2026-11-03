// Read-only bridge for records from the replaced public lesson, never a migration.
export const PUBLIC_LEGACY_KEYS=Object.freeze([
 'bhcs-science-v2-reaction-rate',
 'bhcs-science-v2-reaction-rate-draft',
 'bhcs-science-v2-reaction-rate-guide',
 'bhcs-inquiry-v1:/tools/science/reaction-rate.html'
]);
export function readPublicLegacy(storage){
 const raw={};for(const key of PUBLIC_LEGACY_KEYS){const value=storage.getItem(key);if(value!==null)raw[key]=value;}
 return Object.freeze(raw);
}
export function mountPublicLegacy(doc= document,win=window){
 const section=doc.getElementById('public-legacy-data'),status=doc.getElementById('public-legacy-status'),button=doc.getElementById('public-legacy-export');
 if(!section||!status||!button)throw new Error('Missing public legacy export controls');
 let raw;
 function read(){try{raw=readPublicLegacy(win.localStorage);section.hidden=Object.keys(raw).length===0;status.textContent='舊課紀錄只在這台瀏覽器保留；可下載原始備份，不會匯入新實驗。';return true;}catch{section.hidden=false;raw=null;status.textContent='目前無法讀取舊課資料，不能判定是否為空。請允許瀏覽器儲存後重試；不會刪除原資料。';return false;}}
 read();button.addEventListener('click',()=>{
  if(!read())return;
  if(!Object.keys(raw).length){section.hidden=false;status.textContent='目前這台瀏覽器沒有找到舊課紀錄；沒有產生備份。';return;}
  let url;try{
   const data=JSON.stringify({kind:'bhcs-public-reaction-rate-raw-backup',formatVersion:1,sourcePath:'/tools/science/reaction-rate.html',rawByKey:raw},null,2);
   url=win.URL.createObjectURL(new win.Blob([data],{type:'application/json;charset=utf-8'}));
   const a=doc.createElement('a');a.href=url;a.download='舊官網反應速率課程-原文備份.json';a.click();
   status.textContent='已交給瀏覽器下載舊課原文備份；請確認下載檔案。原資料仍保留。';
  }catch{status.textContent='未能產生舊課備份，請重試。原資料仍保留，不會因失敗被刪除。';}
  finally{if(url)win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);}
 });
 return {read};
}
if(typeof document!=='undefined'&&document.getElementById('public-legacy-data'))mountPublicLegacy();
