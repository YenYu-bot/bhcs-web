import {Engine} from './engine.mjs';
import {derive,parseAnswer,EXPECTED_ANSWERS} from './model.mjs';
import {createStorageDriver} from './storage.mjs';
import {drawBench} from './bench.mjs';
const $=id=>document.getElementById(id);
const guides={
 intro:['先做理想表面','沿坡向上推進，觀察測力器和尺。兩筆量測都收下後，才開始計算。','手指快慢只控制進度，不是箱子的物理速度。'],
 ready:['沿坡向上，讀取拉力','拖曳把手或使用前進按鈕。可以分段放手，夾具會停在已到的位置。','只量向上搬運；不模擬起動或自由下滑。'],
 moving:['操作中，只向坡上推進','拉力與沿坡距離就在器材下方。往回拉不會讓箱子下降；放手可以停住。','回拉後需回到原最遠點，或放手重新抓取。'],
 held:['停住了，可以繼續量','已到的位置會保留。重新抓取把手繼續上移，或使用旁邊的前進按鈕。','顯示的是上移所需拉力，不是暫停時的夾持力。'],
 endpoint:['已到終點，收下證據','沿坡100 cm、垂直升高60 cm。請把測力器讀值和距離一起收下。','到終點不會自動保存；按「收下這筆量測」才封存。'],
 sealed:['第一筆收好了，只換表面','下一輪使用本站指定粗面。箱子、坡度、沿坡長度與升高都不變。','已收下的原始量測不會被後續作答改寫。'],
 distance:['兩筆齊了，先辨認方向','計算拉力輸入功用哪一段距離？計算重力位能又用哪一段高度？','先看量測紀錄，再往下整理能量帳。'],
 calculation:['用證據整理能量帳','先把公分換成公尺，再依序算輸入功、有效功、內能增加和效率。','錯答可以修訂；查看解說會留下查看記錄。'],
 explanation:['多出的輸入功去哪了？','同樣升高，有效功相同。請用你算出的能量帳，選出合理的解釋。','內能增加不是能量消失；本站不計溫度。'],
 complete:['這次實驗完成了','你已比較同一箱子、同一斜面的兩種表面。可以匯出紀錄，或重置再做一次。','重置需兩次確認，取消會保留量測與作答。']
};
for(const [title,body,note] of Object.values(guides)){const r=document.createElement('div');r.className='guide-reserve';r.setAttribute('aria-hidden','true');r.setAttribute('inert','');for(const [tag,cls,txt] of [['p','eyebrow','跟著余老師做'],['h2','',title],['p','',body],['p','guide-note',note]]){const e=document.createElement(tag);e.className=cls;e.textContent=txt;r.append(e);}$('teacher-copy').append(r);}
const stepNames=['① 輸入功','② 有效功：重力位能增加','③ 箱子與坡道的內能增加','④ 機械效率'];
const formulas=['輸入功 = 上移拉力 × 沿坡距離（m）','有效功 = 重力 × 垂直升高（m）','內能增加 = 輸入功 − 有效功','效率 = 有效功 ÷ 輸入功 × 100%'];
for(let step=0;step<4;step++){
 const card=document.createElement('section');card.className='calc-step';card.id=`calc-step-${step}`;card.innerHTML=`<h3>${stepNames[step]}</h3><div class="answer-grid"></div><div class="actions"><button id="check-step-${step}" class="primary">檢查這一步</button><button id="hint-${step}">看公式提示</button></div><p id="step-feedback-${step}" class="feedback" role="status"></p><div id="hint-text-${step}" class="hint" hidden></div>`;
 for(let j=0;j<2;j++){const i=step*2+j;const field=document.createElement('div');field.className='answer-field';field.innerHTML=`<label for="answer-${i}">${j?'指定粗面':'理想表面'}</label><div class="input-unit"><input id="answer-${i}" type="text" inputmode="decimal" autocomplete="off" maxlength="32" aria-describedby="answer-feedback-${i}"><span>${step===3?'%':'J'}</span></div><p id="answer-feedback-${i}" class="answer-feedback"></p><button id="reveal-${i}" class="reveal">主動查看這格解說（會記錄）</button><div id="revealed-${i}" class="revealed-answer" hidden></div>`;card.querySelector('.answer-grid').append(field);}
 $('calculation-steps').append(card);
}
let storageReady=false;
const driver=createStorageDriver({onStatus:()=>{if(storageReady)renderStorage();}});
const restored=driver.read();let engine=new Engine(restored.snapshot);storageReady=true;
let gesture=null,geom=null,geometryVersion=0,saveSerial=0,pendingSaves=0,deviceSaved=!!restored.snapshot,resetBusy=false,launcher=null;
const speak=text=>{$('live').textContent=text;};
const feedback=(text,error=false)=>{$('global-feedback').textContent=text;$('global-feedback').classList.toggle('error',error);};
const show=(id,on)=>{$(id).hidden=!on;};
const livePhase=()=>['ready','moving','held','endpoint'].includes(engine.state.phase);
function renderStorage(){
 show('storage-alert',driver.status!=='normal');$('storage-detail').textContent=driver.detail;show('backup-raw',driver.canBackupRaw&&driver.status!=='normal');
 show('retry',!deviceSaved&&(engine.state.records.length>0||!!engine.state.answers)&&!['conflict','quarantined'].includes(driver.status));
 $('retry').disabled=pendingSaves>0||resetBusy;
 $('save-status').textContent=pendingSaves?'正在保存本次資料…':deviceSaved?'已存此裝置':engine.state.records.length?'本頁已收下，尚未存到此裝置':'尚未收下量測';
}
async function persist(){
 const serial=++saveSerial,snapshot=engine.snapshot();deviceSaved=false;pendingSaves++;renderStorage();
 const result=await driver.write(snapshot);pendingSaves--;
 if(serial===saveSerial){deviceSaved=!!result.deviceSaved&&JSON.stringify(engine.snapshot())===JSON.stringify(snapshot);}
 renderStorage();return result;
}
function moveFocus(id){requestAnimationFrame(()=>{const el=$(id);if(el.hidden||!el.getClientRects().length)return;el.scrollIntoView({block:'center',behavior:'instant'});el.focus({preventScroll:true});});}
function paint(){
 const box=$('bench'),rect=box.getBoundingClientRect();
 geom=drawBench($('apparatus'),$('handle'),engine.state.surfaceId,engine.state.reachedS,{active:!!engine.state.active,enabled:livePhase()&&!resetBusy,width:rect.width,height:rect.height});
}
function render(){
 const s=engine.state,a=s.answers,d=derive(s.surfaceId,s.reachedS);const copy=guides[s.phase]||guides.ready;
 $('guide-title').textContent=copy[0];$('guide-body').textContent=copy[1];$('guide-note').textContent=copy[2];
 $('lab-title').textContent=s.surfaceId==='ideal'?'理想表面量測':'指定粗面量測';$('surface-label').textContent=s.surfaceId==='ideal'?'理想無摩擦模型':'本站指定粗面';
 $('force').textContent=s.reachedS?`${d.forceN} N`:'尚未上移';$('distance').textContent=`${s.reachedS} cm`;$('height').textContent=`${d.hCm} cm`;
 $('motion-status').textContent=s.active?(s.reachedS===100?'已到100 cm，請放手讓裝置停穩。':`把手操作中：已到 ${s.reachedS} cm；往回拉不會倒退。`):livePhase()?`已到 ${s.reachedS} cm，夾持中。${s.reachedS===100?'可以收下量測。':'放手後可重新抓取繼續。'}`:s.phase==='intro'?'準備好就開始量測。':'這輪量測已封存，不會因作答而改寫。';
 show('begin',s.phase==='intro');show('advance-one',livePhase());show('advance-ten',livePhase());show('stop',livePhase());show('redo',livePhase());show('seal',livePhase());show('next',s.phase==='sealed');
 for(const id of ['advance-one','advance-ten'])$(id).disabled=!!s.active||s.reachedS>=100||resetBusy;
 $('stop').disabled=!s.active;$('seal').disabled=!engine.canSeal||pendingSaves>0||resetBusy;$('redo').disabled=!!s.active||resetBusy;
 for(const [id,n] of [['step-ideal',0],['step-rough',1],['step-calc',2]]){const current=s.records.length<1?0:s.records.length<2?1:2;$(id).classList.toggle('current',current===n);$(id).classList.toggle('done',current>n);}
 const records=$('records');records.replaceChildren();
 if(!s.records.length){const e=document.createElement('p');e.className='empty-note';e.textContent='完成第一輪後，收下你的量測證據。';records.append(e);}
 for(const r of s.records){const e=document.createElement('article');e.className=`record ${r.surfaceId}`;e.innerHTML=`<h3>${r.surfaceId==='ideal'?'① 理想表面':'② 指定粗面'}</h3><dl><dt>上移拉力</dt><dd>${r.forceN} N</dd><dt>沿坡距離</dt><dd>${r.finalSCm} cm</dd><dt>垂直升高</dt><dd>${r.finalHTenthCm/10} cm</dd><dt>箱子重力</dt><dd>${r.weightN} N</dd></dl>`;records.append(e);}
 show('comparison',!!s.pair);show('calculations',!!a?.distancesPassed);show('conclusions',!!a?.passed.every(Boolean));show('completion',s.phase==='complete');
 if(a){
 for(let i=0;i<2;i++)for(const radio of document.querySelectorAll(`input[name="distance-${i}"]`))radio.checked=a.distance[i]===radio.value;
 for(let step=0;step<4;step++){
 show(`calc-step-${step}`,a.passed.slice(0,step*2).every(Boolean));
 for(let j=0;j<2;j++){const i=step*2+j,input=$(`answer-${i}`);if(input.value!==a.raw[i])input.value=a.raw[i];$(`answer-feedback-${i}`).textContent=a.passed[i]?(a.revealed[i]?'已核對（曾查看解說）':'這格核對正確'):'';$(`answer-feedback-${i}`).classList.toggle('good',a.passed[i]);
 show(`revealed-${i}`,!!a.revealed[i]);if(a.revealed[i])$(`revealed-${i}`).textContent=`已查看解說：${formulas[step]}；本格為 ${EXPECTED_ANSWERS[i]} ${step===3?'%':'J'}。這是模型計算，不是新的量測。`;}
 }
 for(let i=0;i<3;i++)for(const radio of document.querySelectorAll(`input[name="conclusion-${i}"]`))radio.checked=a.conclusions[i]===radio.value;
 $('revisions').replaceChildren();for(const r of a.revisions){const e=document.createElement('p');e.className='revision';e.textContent=r.text;$('revisions').append(e);}
 }
 $('energy-summary').textContent=s.phase==='complete'?'理想：輸入6 J → 有效功6 J + 內能增加0 J，效率100%。粗面：輸入8 J → 有效功6 J + 內能增加2 J，效率75%。':'';
 // Technical coefficients and numerical counterexamples are deliberately not
 // placed into hidden student DOM before explicit answer revelation.
 show('teacher-model',!!a?.revealed.every(Boolean));
 $('teacher-model').textContent=a?.revealed.every(Boolean)?'教師技術註：本粗面 μk=0.25，N=8 N，fk=2 N。μ不是能量損耗比例；此幾何只是巧合。若μ=0.5，F=10 N，效率60%，損耗40%而非50%。本站無靜摩擦模型。':'';
 paint();renderStorage();
}
function stopGesture(message=true){
 if(!gesture)return false;const old=gesture;gesture=null;engine.stop(old.operationId);
 try{if($('handle').hasPointerCapture(old.pointerId))$('handle').releasePointerCapture(old.pointerId);}catch{}
 render();if(message)speak(`停止並保持在 ${engine.state.reachedS} cm。`);return true;
}
$('handle').addEventListener('pointerdown',e=>{
 if(!e.isPrimary||e.button!==0||gesture||!geom||!livePhase())return;
 const id=engine.beginOperation('pointer');if(!id)return;e.preventDefault();
 gesture={pointerId:e.pointerId,operationId:id,startX:e.clientX,startY:e.clientY,startS:engine.state.reachedS,k:geom.k,version:geometryVersion};
 try{$('handle').setPointerCapture(e.pointerId);}catch{stopGesture();return;}render();
});
$('handle').addEventListener('pointermove',e=>{
 const g=gesture;if(!g||g.pointerId!==e.pointerId||g.version!==geometryVersion)return;e.preventDefault();
 const delta=((e.clientX-g.startX)*.8-(e.clientY-g.startY)*.6)/g.k;
 if(engine.advanceTo(g.startS+Math.floor(delta+1e-9),g.operationId))render();
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('handle').addEventListener(type,e=>{if(gesture?.pointerId===e.pointerId)stopGesture();});
function step(amount,method){if(!livePhase()||engine.state.active)return;const op=engine.beginOperation(method);if(!op)return;engine.advanceTo(engine.state.reachedS+amount,op);engine.stop(op);render();speak(`已到 ${engine.state.reachedS} cm，夾持中。`);}
$('handle').addEventListener('keydown',e=>{if(['ArrowRight','ArrowUp','PageUp','ArrowLeft','ArrowDown','Escape','End'].includes(e.key)){e.preventDefault();if(e.key==='Escape')stopGesture();else if(['ArrowRight','ArrowUp','PageUp'].includes(e.key))step(e.key==='PageUp'?10:1,'keyboard');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('reset-dialog').open)stopGesture();});
window.addEventListener('blur',()=>stopGesture());document.addEventListener('visibilitychange',()=>{if(document.hidden)stopGesture();});
let lastSize='';new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;const size=`${width}:${height}`;if(size===lastSize)return;lastSize=size;geometryVersion++;stopGesture();paint();}).observe($('bench'));
window.addEventListener('storage',e=>{if(driver.handleExternalChange(e)){stopGesture();deviceSaved=false;renderStorage();speak(driver.detail);}});
$('begin').addEventListener('click',()=>{engine.start();render();moveFocus('handle');});
$('advance-one').addEventListener('click',()=>step(1,'button'));$('advance-ten').addEventListener('click',()=>step(10,'button'));$('stop').addEventListener('click',()=>stopGesture());
$('redo').addEventListener('click',()=>{if(engine.redo().ok){render();feedback('已放棄未收下的本輪量測，重新準備器材。');moveFocus('handle');}});
$('next').addEventListener('click',()=>{if(engine.next().ok){render();moveFocus('handle');}});
$('seal').addEventListener('click',async()=>{if(pendingSaves||resetBusy)return;const result=engine.seal();if(!result.ok)return;render();speak('已在本頁收下這筆量測。');await persist();render();if(engine.state.phase==='sealed')moveFocus('next');else moveFocus('check-distances');});
$('retry').addEventListener('click',async()=>{if(pendingSaves||resetBusy)return;await persist();render();});
const reasonText=reason=>({'check-capacity':'檢查歷程已滿，請先匯出，再重置開新實驗。','reflection-capacity':'說明歷程已滿，請先匯出，再重置開新實驗。','invalid-reflection':'請輸入1至1000字的說明。','check-earlier-step-first':'請先核對前面的步驟。','check-distances-first':'請先核對距離方向。'}[reason]||'這個動作尚未準備好，請檢查目前步驟。');
function saveEdit(result){if(!result.ok){feedback(reasonText(result.reason),true);return false;}persist();render();return true;}
for(let i=0;i<2;i++)for(const radio of document.querySelectorAll(`input[name="distance-${i}"]`))radio.addEventListener('change',()=>{if(saveEdit(engine.setDistance(i,radio.value)))$('distance-feedback').textContent='選擇已改動，請重新核對；後面的通過標記已撤銷。';});
$('check-distances').addEventListener('click',()=>{const r=engine.checkDistances();if(saveEdit(r)){$('distance-feedback').textContent=r.passed?'方向正確：輸入功用沿坡距離，重力位能用垂直升高。':'請配對力的方向：拉力沿坡，重力垂直。再試一次。';if(r.passed)moveFocus('answer-0');}});
for(let i=0;i<8;i++){
 $(`answer-${i}`).addEventListener('input',e=>saveEdit(engine.setAnswer(i,e.target.value)));
 $(`reveal-${i}`).addEventListener('click',()=>saveEdit(engine.reveal(i)));
}
for(let stepIndex=0;stepIndex<4;stepIndex++){
 $(`check-step-${stepIndex}`).addEventListener('click',()=>{
 const r=engine.checkStep(stepIndex);if(!saveEdit(r))return;
 const good=r.passed.every(Boolean);$(`step-feedback-${stepIndex}`).textContent=good?'這一步核對正確。':'請重新核對單位與計算，可以使用公式提示。';
 for(let j=0;j<2;j++){const i=stepIndex*2+j,status=parseAnswer(engine.state.answers.raw[i],i).status;if(status!=='correct')$(`answer-feedback-${i}`).textContent=status==='empty'?'請填入數字。':status==='format'?'請用非負十進位數字，最多兩位小數；單位已在框外。':'數值尚未核對正確，請依量測再算一次。';}
 if(good)moveFocus(stepIndex===3?'check-conclusions':`answer-${stepIndex*2+2}`);
 });
 $(`hint-${stepIndex}`).addEventListener('click',()=>{engine.useHint(Math.min(3,stepIndex+1));$(`hint-text-${stepIndex}`).textContent=`1 m = 100 cm。${formulas[stepIndex]}。${stepIndex===3?'百分比欄填百分數，例如百分之十填10。':''}`;show(`hint-text-${stepIndex}`,true);persist();});
}
for(let i=0;i<3;i++)for(const radio of document.querySelectorAll(`input[name="conclusion-${i}"]`))radio.addEventListener('change',()=>{saveEdit(engine.setConclusion(i,radio.value));$('conclusion-feedback').textContent='選項已改動，請重新檢查結論。';});
$('check-conclusions').addEventListener('click',()=>{const r=engine.checkConclusions();if(saveEdit(r)){$('conclusion-feedback').textContent=r.passed?'結論與證據一致。':'再看能量帳：有效功是否相同？摩擦增加的是哪一種能量？';if(r.passed)moveFocus('completion-reset');}});
$('save-reflection').addEventListener('click',()=>{const r=engine.saveReflection($('reflection').value);if(saveEdit(r))feedback('已收下你的說明；這段文字不以關鍵字自動評分。');});
function download(text,name){try{const blob=new Blob([text],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);feedback('已送出下載，請確認檔案已保存；不會清除本頁資料。');return true;}catch{feedback('無法開始下載；資料仍保留，請稍後重試。',true);return false;}}
function exportData(){return download(JSON.stringify(engine.exportData(),null,2),'friction-efficiency-evidence.json');}
for(const id of ['export','completion-export','reset-export'])$(id).addEventListener('click',exportData);
for(const id of ['backup-raw','reset-raw-export'])$(id).addEventListener('click',()=>{if(driver.canBackupRaw)download(driver.raw,'friction-efficiency-original-raw.json');});
function openReset(el){if(resetBusy)return;stopGesture(false);launcher=el;show('reset-stage-one',true);show('reset-stage-two',false);$('reset-ack').checked=false;$('reset-confirm').disabled=true;$('reset-feedback').textContent='';show('reset-raw-export',driver.canBackupRaw&&driver.status!=='normal');show('reset-raw-note',driver.canBackupRaw&&driver.status!=='normal');$('reset-dialog').showModal();$('reset-cancel-one').focus();}
for(const id of ['new-experiment','completion-reset'])$(id).addEventListener('click',()=>openReset($(id)));
function closeReset(){if(resetBusy)return;$('reset-dialog').close();launcher?.focus({preventScroll:true});}
for(const id of ['reset-cancel-one','reset-cancel-two'])$(id).addEventListener('click',closeReset);
$('reset-dialog').addEventListener('cancel',e=>{e.preventDefault();closeReset();});
$('reset-continue').addEventListener('click',()=>{show('reset-stage-one',false);show('reset-stage-two',true);$('reset-ack').focus();});
$('reset-ack').addEventListener('change',()=>{$('reset-confirm').disabled=!$('reset-ack').checked||resetBusy;});
$('reset-confirm').addEventListener('click',async()=>{
 if(resetBusy||!$('reset-ack').checked)return;resetBusy=true;$('reset-confirm').disabled=true;saveSerial++;const result=await driver.clear();resetBusy=false;
 if(!result.ok){$('reset-feedback').textContent=`未能清除，資料仍保留。${driver.detail||'請先匯出，重新整理後再試。'}`;$('reset-confirm').disabled=!$('reset-ack').checked;return;}
 engine=new Engine();deviceSaved=false;gesture=null;$('reflection').value='';for(const el of document.querySelectorAll('input[type=radio]'))el.checked=false;
 for(let i=0;i<8;i++){$(`answer-${i}`).value='';$(`answer-feedback-${i}`).textContent='';show(`revealed-${i}`,false);$(`revealed-${i}`).textContent='';}
 for(let i=0;i<4;i++){$(`step-feedback-${i}`).textContent='';$(`hint-text-${i}`).textContent='';show(`hint-text-${i}`,false);}
 $('distance-feedback').textContent='';$('conclusion-feedback').textContent='';$('revisions').replaceChildren();$('reset-dialog').close();render();feedback(result.localOnly?'已清除本頁暫存，仍只在本頁保存。':'本站紀錄已清除，可以開始新實驗。');moveFocus('begin');
});
render();
