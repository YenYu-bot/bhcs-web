import {INITIAL,STEPS,calculate} from './model.mjs';
import {formatMass as fmt,formatPercent as percent} from './format.mjs';
import {readStored,decodeStored,writeStored} from './storage.mjs';
const $=id=>document.getElementById(id), KEY='baihong-solubility-lab-v1', SVG='http://www.w3.org/2000/svg';
const copy=s=>({temperature:s.temperature,water:s.water,solute:s.solute});
let state=copy(INITIAL), step=0,mode='guided',records=[],history=[],toastTimer,rangeStart=null;
let storageRef=null;try{storageRef=window.localStorage;}catch{}
let savedStore=readStored(storageRef,KEY),lastRaw=savedStore.raw,storeStatus=savedStore.status,storageWritable=savedStore.writable,hasUnsaved=false;
({state,step,mode,records}=savedStore.snapshot);state=copy(state);records=records.map(r=>({state:copy(r.state),number:r.number}));
const stepText=[
{title:'50 g 的 A，都溶進去了嗎？',copy:'100 g 的水，加入 50 g 教學溶質 A。先看看 20°C 時的杯底。',kicker:'STEP 01 · 先看這一杯',next:'加熱到 60°C',observation:'這杯水最多能溶解 30 g 的 A，剩下的 20 g 就留在杯底。',lesson:'有杯底固體，這時已經飽和了。'},
{title:'升溫，杯底的固體不見了。',copy:'水與 A 都沒有增減，只把溫度從 20°C 升到 60°C。',kicker:'STEP 02 · 加熱',next:'冷卻回 20°C',observation:'60°C 時，100 g 水剛好能溶解 50 g 的 A。杯底雖然空了，容量也剛好用完。',lesson:'沒有杯底固體，也可能是飽和溶液。'},
{title:'冷卻，固體又回到杯底。',copy:'把同一杯降回 20°C。原本溶進去的 A，有一部分重新析出。',kicker:'STEP 03 · 冷卻',next:'加入 20 g 水',observation:'溶解上限回到 30 g，多出的 20 g A 析出成固體。整杯的水與 A 都沒有少。',lesson:'溶解與析出，改變的是 A 的分布。'},
{title:'加一點水，濃度沒變？',copy:'保持 20°C，加入 20 g 水。現在有 120 g 水，A 仍然是 50 g。',kicker:'STEP 04 · 少量加水',next:'再加入 80 g 水',observation:'多加 20 g 水，又溶解了 6 g A。杯底還有 14 g 固體，溶液仍然飽和。',lesson:'36 ÷（120 ＋ 36）＝ 23.1%。加水後，濃度不一定立刻下降。'},
{title:'再加水，這次真的變稀了。',copy:'再加入 80 g 水，水的總量來到 200 g，A 仍然是 50 g。',kicker:'STEP 05 · 繼續加水',next:'自由調整，再試一杯',observation:'這杯最多能溶解 60 g A，但總共只有 50 g。固體全溶了，還有 10 g 的溶解空間。',lesson:'50 ÷（200 ＋ 50）＝ 20%。這杯是未飽和溶液。'}
];
function storageNote(){
  const messages={
    partial:'有部分本機資料無法安全讀取。可讀的紀錄已保留，本次操作暫不寫入，也不覆蓋原始資料。',
    invalid:'本機資料格式損壞。本次操作暫不寫入，原始資料保持不變。',
    future:'本機資料來自不同版本。本次操作暫不寫入，原始資料保持不變。',
    unavailable:'瀏覽器目前不允許讀取本機資料。本次操作只暫存在此頁，重新整理可能遺失。',
    write_failed:'瀏覽器未能儲存資料。本次變更只暫存在此頁；原本已儲存的資料保持不變。',
    conflict:'另一分頁已有較新的資料，為避免覆蓋，這次變更未寫入。請先保留本頁內容，再重新整理載入最新紀錄。'
  };
  $('storage-note').textContent=messages[storeStatus]||'你的操作與記錄只儲存在這個瀏覽器，不會上傳。清除瀏覽器資料後會消失。';
  $('storage-note').classList.toggle('storage-warning',!storageWritable);
}
function persist(){
  if(!storageWritable){hasUnsaved=true;storageNote();return false;}
  const result=writeStored(storageRef,KEY,{version:1,state,step,mode,records},lastRaw);
  if(result.ok){lastRaw=result.raw;storeStatus='ok';hasUnsaved=false;storageNote();return true;}
  storageWritable=false;hasUnsaved=true;storeStatus=result.status;storageNote();return false;
}
window.addEventListener('storage',event=>{
  if(event.key!==KEY||event.storageArea!==storageRef)return;
  if(hasUnsaved){storageWritable=false;storeStatus='conflict';storageNote();return;}
  const incoming=decodeStored(event.newValue);
  lastRaw=event.newValue;storeStatus=incoming.status;storageWritable=incoming.writable;
  if(incoming.writable){
    const changed=JSON.stringify(records)!==JSON.stringify(incoming.snapshot.records);
    records=incoming.snapshot.records.map(r=>({state:copy(r.state),number:r.number}));renderRecords();
    if(changed)announce('另一分頁的紀錄已同步；這杯的條件維持不變。');
  }
  storageNote();
});

function announce(text){$('live-status').textContent=text;$('live-status').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('live-status').classList.remove('visible'),3400);}
function pushHistory(snapshot){history.push(snapshot);if(history.length>40)history.shift();$('undo').disabled=false;}
function finishRangeInteraction(){const previous=rangeStart;rangeStart=null;if(previous&&JSON.stringify(previous.state)!==JSON.stringify(state))pushHistory(previous);}
function remember(){finishRangeInteraction();pushHistory({state:copy(state),step,mode});}
function commit(next,{newStep=step,newMode=mode,rememberPrevious=true,message=''}={}){if(rememberPrevious)remember();state=copy(next);step=newStep;mode=newMode;render();const saved=persist();if(message)announce(message+(saved?'':' 本次變更尚未儲存，原始資料未改動。'));else if(!saved)announce('本次變更尚未儲存，原始資料未改動。');}
function switchMode(next){if(next===mode)return;if(next==='guided'){commit(STEPS[step],{newMode:next,message:'已回到引導實驗第 '+(step+1)+' 步。'});}else{remember();mode=next;render();persist();} }
function goStep(i){if(i===step&&mode==='guided')return;commit(STEPS[i],{newStep:i,newMode:'guided',message:stepText[i].title});}
function el(tag,attrs={}){const node=document.createElementNS(SVG,tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);return node;}
for(let i=0;i<65;i++)$('particles').append(el('circle',{r:3.2,fill:'#ba853d',opacity:0,class:'particle'}));
for(let i=0;i<50;i++)$('crystals').append(el('path',{d:'M0 -6L6 0L0 6L-6 0Z',fill:i%3===0?'#e9c16c':'#d9aa53',stroke:'#c29340','stroke-width':.7,opacity:0,class:'crystal'}));
function renderVessel(m){const waterY=Math.max(123,205-state.water*.38);$('water-fill').setAttribute('y',waterY);$('water-fill').setAttribute('height',264-waterY);$('water-top').setAttribute('cy',waterY);const count=Math.min(65,Math.round(m.dissolved*.65));Array.from($('particles').children).forEach((p,i)=>{p.setAttribute('cx',120+((i*41+13)%135));p.setAttribute('cy',waterY+16+((i*29+9)%Math.max(15,235-waterY)));p.setAttribute('opacity',i<count?'.68':'0');});const solidCount=m.solid===0?0:Math.max(1,Math.min(50,Math.ceil(m.solid*1.2)));Array.from($('crystals').children).forEach((p,i)=>{p.setAttribute('transform',`translate(${112+((i*17)%151)} ${248-Math.floor(i/12)*8}) rotate(${i*17%90})`);p.setAttribute('opacity',i<solidCount?1:0);});$('heat-waves').setAttribute('opacity',state.temperature>=45?.7:0);$('svg-temperature').textContent=state.temperature+'°C';const mercury=state.temperature/80*112;$('thermometer-fill').setAttribute('y',220-mercury);$('thermometer-fill').setAttribute('height',Math.max(2,mercury));$('svg-dissolved').textContent=fmt(m.dissolved)+' g';$('svg-solid').textContent=fmt(m.solid)+' g';$('recipe-solute').textContent=state.solute+' g';$('mobile-dissolved').textContent=fmt(m.dissolved)+' g';$('mobile-solid').textContent=fmt(m.solid)+' g';$('mobile-concentration').textContent=percent(m.concentration)+'%';$('scene-desc').textContent=`溫度 ${state.temperature} 攝氏度，水 ${state.water} 公克，已溶解 ${fmt(m.dissolved)} 公克，杯底固體 ${fmt(m.solid)} 公克。${m.saturated?'飽和':'未飽和'}溶液。`;}

function render(){const m=calculate(state);$('guided-panel').hidden=mode!=='guided';$('free-panel').hidden=mode!=='free';for(const name of ['guided','free']){$(name+'-tab').setAttribute('aria-selected',name===mode);$(name+'-tab').tabIndex=name===mode?0:-1;}$('undo').disabled=history.length===0;$('status').textContent=m.saturated?'飽和溶液':'未飽和溶液';$('status').classList.toggle('unsaturated',!m.saturated);$('scene-note').textContent=state.temperature+'°C · 達到平衡後';for(const key of ['water','dissolved','solution','solid'])$(key+'-value').innerHTML=fmt(key==='water'?state.water:m[key])+' <small>g</small>';
const t=stepText[step];$('step-kicker').textContent=t.kicker;$('step-title').textContent=t.title;$('step-copy').textContent=t.copy;$('next-step').innerHTML=t.next+' <span aria-hidden="true">→</span>';$('prev-step').disabled=step===0;$('recipe-temperature').textContent=state.temperature+'°C';$('recipe-water').textContent=state.water+' g';document.querySelectorAll('[data-step]').forEach((b,i)=>{b.classList.toggle('selected',i===step);b.classList.toggle('done',i<step);if(i===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
const observation=$('observation');observation.replaceChildren();const strong=document.createElement('strong');if(mode==='guided'){observation.append(document.createTextNode(t.observation));strong.textContent=t.lesson;}else {observation.append(document.createTextNode(`在 ${state.temperature}°C，${state.water} g 水最多能溶解 ${fmt(m.capacity)} g A。現在溶解了 ${fmt(m.dissolved)} g，杯底有 ${fmt(m.solid)} g。`));strong.textContent=m.solid>0?'這杯已經飽和，多出的 A 留在杯底。':m.saturated?'剛好到達容量上限。沒有杯底固體，也可以是飽和。':`還能再溶解 ${fmt(m.capacity-m.dissolved)} g A，這杯未飽和。`;}observation.append(strong);
$('fraction-top').textContent=fmt(m.dissolved)+' g 已溶解的 A';$('fraction-bottom').textContent=state.water+' g 水 ＋ '+fmt(m.dissolved)+' g 已溶解的 A';$('concentration').innerHTML=percent(m.concentration)+'<small>%</small>';$('water-bar').style.width=(100-m.concentration)+'%';$('water-bar').textContent='水 '+state.water+' g';$('solute-bar').style.width=m.concentration+'%';$('solute-bar').textContent='A '+fmt(m.dissolved)+' g';$('outside-solid').textContent=fmt(m.solid)+' g';$('capacity-temperature').textContent=state.temperature+'°C';$('solubility').textContent=fmt(m.solubility)+' g';$('capacity-bar').style.width=100*m.dissolved/m.capacity+'%';$('capacity-dissolved').textContent=fmt(m.dissolved)+' g';$('capacity-value').textContent=fmt(m.capacity)+' g';$('capacity-answer').textContent=m.saturated?'剛好到容量上限，就是飽和。':'還有 '+fmt(m.capacity-m.dissolved)+' g 的溶解空間，是未飽和。';for(const key of ['temperature','water','solute']){$(key).value=state[key];$(key+'-number').value=state[key];}renderVessel(m);renderRecords();}
function renderRecords(){$('record-count').textContent=records.length>8?records.length+' 筆已保留紀錄':records.length+' / 8 筆記錄';$('record').disabled=records.length>=8;if(!records.length){$('records').innerHTML='<div class="empty-state"><span aria-hidden="true">▤</span><div><strong>每一杯，都可以留下紀錄。</strong><p>按「記錄這一杯」，比較加熱、冷卻與加水的差別。最多保留 8 杯。</p></div></div>';return;}$('records').replaceChildren();records.forEach((r,i)=>{const m=calculate(r.state),card=document.createElement('article');card.className='record-card';card.innerHTML=`<div class="record-top"><h3>第 ${i+1} 杯 · ${r.state.temperature}°C</h3><button aria-label="刪除第 ${i+1} 杯記錄" title="刪除這筆記錄">×</button></div><p>水 ${r.state.water} g · A 總量 ${r.state.solute} g</p><div class="record-number"><strong>${percent(m.concentration)}%</strong><span>${m.saturated?'飽和':'未飽和'}</span></div><div class="record-bottom"><span>已溶解 ${fmt(m.dissolved)} g</span><span>固體 ${fmt(m.solid)} g</span></div>`;card.querySelector('button').addEventListener('click',()=>{records.splice(i,1);renderRecords();const saved=persist();announce(saved?'已移除這杯記錄。':'已從此頁移除；原始儲存資料未改動。');$('record').focus();});$('records').append(card);});}
$('next-step').addEventListener('click',()=>{if(step<4)goStep(step+1);else{switchMode('free');$('free-tab').focus();}});$('prev-step').addEventListener('click',()=>{if(step>0)goStep(step-1);});document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>goStep(Number(b.dataset.step))));
for(const name of ['guided','free']){$(name+'-tab').addEventListener('click',()=>switchMode(name));$(name+'-tab').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'guided':e.key==='End'?'free':mode==='guided'?'free':'guided';switchMode(next);$(next+'-tab').focus();}});}
function changeNumber(key,value,rememberPrevious=true){const input=$(key),num=Number(value);if(value===''||!Number.isFinite(num)){render();announce('請輸入範圍內的數字。');return;}const clamped=Math.max(Number(input.min),Math.min(Number(input.max),Math.round(num)));if(clamped===state[key]){render();return;}commit({...state,[key]:clamped},{newMode:'free',rememberPrevious});if(clamped!==num)announce('已調整到允許範圍內的整數。');}
for(const key of ['temperature','water','solute']){
  $(key+'-number').addEventListener('input',event=>{const value=event.target.value,num=Number(value);if(value!==''&&Number.isFinite(num)&&num>=Number(event.target.min)&&num<=Number(event.target.max)&&Number.isInteger(num))changeNumber(key,value);});
  $(key+'-number').addEventListener('change',event=>changeNumber(key,event.target.value));
  $(key+'-number').addEventListener('blur',event=>changeNumber(key,event.target.value));
  $(key).addEventListener('pointerdown',event=>{finishRangeInteraction();rangeStart={state:copy(state),step,mode};try{event.currentTarget.setPointerCapture(event.pointerId);}catch{}});
  $(key).addEventListener('input',event=>{const previous={state:copy(state),step,mode};changeNumber(key,event.target.value,false);if(!rangeStart&&JSON.stringify(previous.state)!==JSON.stringify(state))pushHistory(previous);});
  for(const name of ['change','pointerup','pointercancel','lostpointercapture','blur'])$(key).addEventListener(name,finishRangeInteraction);
}

document.querySelectorAll('[data-adjust]').forEach(b=>b.addEventListener('click',()=>{const [key,amount]=b.dataset.adjust.split(':');changeNumber(key,state[key]+Number(amount));}));$('undo').addEventListener('click',()=>{const previous=history.pop();if(previous)commit(previous.state,{newMode:previous.mode,newStep:previous.step,rememberPrevious:false,message:'已復原上一次操作。'});});
$('record').addEventListener('click',()=>{if(records.length>=8)return;records.push({state:copy(state),number:records.length+1});renderRecords();const saved=persist();announce(saved?`已記錄第 ${records.length} 杯，可在下方比較。`:`已在此頁暫記第 ${records.length} 杯，尚未儲存；原始資料未變。`);});
$('reset').addEventListener('click',()=>{$('clear-records').checked=false;$('clear-records').disabled=!storageWritable;$('reset-protection-note').hidden=storageWritable;$('reset-dialog').returnValue='';$('reset-dialog').showModal();});$('reset-dialog').addEventListener('close',()=>{if($('reset-dialog').returnValue==='confirm'){if($('clear-records').checked&&storageWritable)records=[];rangeStart=null;history=[];commit(INITIAL,{newStep:0,newMode:'guided',rememberPrevious:false,message:'已回到第一杯。'+(records.length?'記錄仍保留。':'')});}});
render();storageNote();

$('reset-top').addEventListener('click',()=>$('reset').click());$('hint-toggle').addEventListener('click',()=>{const open=$('hint-copy').hidden;$('hint-copy').hidden=!open;$('hint-toggle').setAttribute('aria-expanded',open);$('hint-toggle').textContent=open?'收起提示':'看看提示';});
