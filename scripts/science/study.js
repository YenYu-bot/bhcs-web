(() => {
 'use strict';
 const box=document.querySelector('.lesson-route');if(!box)return;
 const checks=[...box.querySelectorAll('[data-study-step]')],note=box.querySelector('#study-note'),progress=box.querySelector('#study-progress'),saveStatus=box.querySelector('#study-save-status');
 const key='bhcs-inquiry-v1:'+location.pathname;
 const render=()=>{const count=checks.filter(c=>c.checked).length;progress.textContent=`已確認 ${count}／3 項${count===3?'；接著做學習檢核，確認自己是否能獨立解釋。':''}`};
 try{const s=JSON.parse(localStorage.getItem(key)||'null');if(s&&typeof s==='object'){checks.forEach((c,i)=>c.checked=s.steps?.[i]===true);if(typeof s.note==='string')note.value=s.note.slice(0,1000)}}catch(_){saveStatus.textContent='無法讀取儲存資料，仍可在本頁填寫。'}
 const save=()=>{try{localStorage.setItem(key,JSON.stringify({steps:checks.map(c=>c.checked),note:note.value.slice(0,1000)}));saveStatus.textContent='已儲存於這台瀏覽器；不會提交給老師。'}catch(_){saveStatus.textContent='此瀏覽器無法保存；離開前請自行複製筆記。'}};
 checks.forEach(c=>c.addEventListener('change',()=>{render();save()}));note.addEventListener('input',save);
 box.querySelector('#study-clear').addEventListener('click',()=>{if(!confirm('清除本頁的自學勾選與筆記？實驗紀錄不會刪除。'))return;checks.forEach(c=>c.checked=false);note.value='';render();save()});render();
})();
