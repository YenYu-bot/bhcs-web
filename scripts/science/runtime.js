(() => {
 'use strict';
 const $=id=>document.getElementById(id), conf=JSON.parse($('lab-config').textContent), storageKey='bhcs-science-v2-'+conf.id;
 let current=null,mission=null,records=[],saveNotice='',moonExplore=false,hasObserved=false;
 const draftKey=storageKey+'-draft';try{$('explanation-input').value=localStorage.getItem(draftKey)||''}catch(_){}
 $('explanation-input').addEventListener('input',()=>{try{localStorage.setItem(draftKey,$('explanation-input').value.slice(0,1000))}catch(_){}});
 const send=action=>{if(typeof window.bhcsScienceTrack==='function')window.bhcsScienceTrack(action,conf.id)};
 const node=(tag,txt)=>{const n=document.createElement(tag);n.textContent=txt;return n};
 const validRecord=r=>r&&typeof r==='object'&&typeof r.conditions==='string'&&typeof r.result==='string'&&typeof r.explanation==='string'&&[r.conditions,r.result,r.explanation].every(x=>x.length<6000);
 try {const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))records=saved.filter(validRecord).slice(-50)}catch(_){saveNotice='無法讀取舊紀錄，仍可操作與列印。'}
 function save(){try{localStorage.setItem(storageKey,JSON.stringify(records));saveNotice='紀錄保存在這台瀏覽器。'}catch(_){saveNotice='此瀏覽器不允許保存；紀錄僅留在本頁，離開前請列印。'}}
 function renderRecords(){const body=$('records'),printList=$('print-records');body.replaceChildren();printList.replaceChildren();if(!records.length){const tr=node('tr',''),td=node('td','尚未記錄；先完成一次操作並寫下觀察。');td.colSpan=4;tr.append(td);body.append(tr);printList.append(node('p','尚無已儲存紀錄。'))}else records.forEach((r,i)=>{const tr=node('tr','');[String(i+1),r.conditions,r.result,r.explanation].forEach(v=>tr.append(node('td',v)));body.append(tr);const card=node('article','');card.className='print-record';card.append(node('h3','紀錄 '+(i+1)));[['條件',r.conditions],['結果',r.result],['解釋',r.explanation]].forEach(([label,value])=>{const p=node('p','');p.append(node('strong',label+'：'),document.createTextNode(value));card.append(p)});printList.append(card)});$('storage-status').textContent=saveNotice||'僅保存於本機，最多50筆，不收集姓名。';renderComparison()}
 function renderComparison(){
  const region=$('record-comparison');region.replaceChildren();region.append(node('h3','最近兩筆，放在一起比較'));
  if(records.length<2){region.append(node('p',records.length?'已完成第一筆。只改一個條件，再操作並保存第二筆。':'保存兩筆觀察後，這裡會並排顯示證據。'));return}
  const [a,b]=records.slice(-2);if(a.settings&&b.settings){const keys=conf.controls.filter(c=>Object.hasOwn(a.settings,c.key)&&Object.hasOwn(b.settings,c.key)&&a.settings[c.key]!==b.settings[c.key]);const dif=node('p',keys.length===1?'這次只改了：':'比較提醒：'+(keys.length===0?'兩筆設定相同。':'同時改了 '+keys.length+' 個設定，不能直接歸因。'));dif.className='lab-diff';for(const c of keys){const format=v=>c.options?c.options.find(o=>o[0]===v)?.[1]||String(v):v+' '+c.unit;dif.append(node('strong',c.label+' '+format(a.settings[c.key])+' → '+format(b.settings[c.key])+'；'))}region.append(dif)}else region.append(node('p','舊紀錄沒有結構化條件，請展開原始條件自行比較。'));
  const pair=node('div','');pair.className='comparison-pair';records.slice(-2).forEach((r,i)=>{const card=node('article','');card.append(node('h3','紀錄 '+(records.length-1+i)));for(const [label,value] of [['結果',r.result],['我的解釋',r.explanation]]){const p=node('p','');p.append(node('strong',label+'：'),document.createTextNode(value));card.append(p)}const details=node('details','');details.append(node('summary','檢查本次條件'),node('p',r.conditions));card.append(details);pair.append(card)});region.append(pair,node('p','先檢查兩筆是否只差一個條件，再說讀值如何改變；若同時改多個條件，還不能直接歸因。'));
 }
 function state(){const s={};for(const c of conf.controls){const el=$('ctl-'+c.key);if(c.options){if(!c.options.some(o=>o[0]===el.value))throw Error('Invalid option');s[c.key]=el.value}else {const n=Number(el.value);if(!Number.isFinite(n)||n<c.min||n>c.max)throw Error('Invalid number');s[c.key]=n}}return s}
 function activeKeys(mode){return conf.id==='electromagnetism'?({magnet:['mode','turns','current'],motor:['mode','turns','current','field','angle'],generator:['mode','turns','field','angle','rpm']})[mode]:conf.id==='pressure-fluid'?({water:['mode','depth','density'],gas:['mode','volume'],flow:['mode','density','ratio','speed']})[mode]:null}
 function conditions(s){const active=activeKeys(s.mode);return conf.controls.filter(c=>!active||active.includes(c.key)).map(c=>`${c.label}：${c.options?c.options.find(o=>o[0]===s[c.key])[1]:s[c.key]+' '+c.unit}`).join('；')}
 function labels(){
  const active=activeKeys($('ctl-mode')?.value);
  conf.controls.forEach(c=>{const el=$('ctl-'+c.key);el.disabled=!!(active&&!active.includes(c.key));if(!c.options)$('out-'+c.key).textContent=el.disabled?'本模式不使用':el.value+' '+c.unit})
  document.querySelectorAll('[data-moon-phase]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.moonPhase===+$('ctl-phase').value)));
 }
 function status(message,warn=false){$('control-feedback').textContent=message;$('status').textContent=message;$('status').className='status'+(warn?' warn':'')}
 function invalidate(message='條件已更新，請重新操作後查看結果。'){
  moonExplore=false;const explore=$('moon-explore')||$('lab-explore');if(explore){explore.checked=false;explore.disabled=!hasObserved;}
  current=null;$('add-record').disabled=true;$('diagram').innerHTML='<p class="empty">設定條件後，按「操作並觀察」查看結果。</p>';$('readouts').replaceChildren();$('current-conditions').textContent='';$('print-current').textContent='本輪尚未操作；請參閱下方已儲存紀錄。';$('result-explanation').textContent='操作後，這裡會說明模型結果。';status(message+($('explanation-input').value?' 你的解釋草稿已保留，重新觀察後再確認內容。':''));labels();
 }
 function run(){let s;try{s=state()}catch(_){status('控制值無效，請重新設定。',true);return}
  const r=calculate(conf.id,s),view=describe(conf.id,s,r);current={s,r,view,mission};
  $('diagram').innerHTML=diagram(conf.id,s,r);$('readouts').replaceChildren();view.metrics.forEach(([name,value])=>{const box=node('div',name);box.className='meter';box.append(node('strong',value));$('readouts').append(box)});
  $('result-explanation').textContent=view.explanation;$('current-conditions').textContent='本次有效條件：'+conditions(s);$('add-record').disabled=false;
  status('觀察完成。請讀取圖像與數值，寫下你看到的變化，再加入研究手冊。');send('start');
  hasObserved=true;const explore=$('moon-explore')||$('lab-explore');if(explore)explore.disabled=false;
 }
 function previewMoon(){const s=state(),r=calculate(conf.id,s),view=describe(conf.id,s,r);current=null;$('add-record').disabled=true;$('diagram').innerHTML=diagram(conf.id,s,r);$('readouts').replaceChildren();view.metrics.forEach(([name,value])=>{const box=node('div',name);box.className='meter';box.append(node('strong',value));$('readouts').append(box)});$('current-conditions').textContent='自由觀察條件：'+conditions(s);$('result-explanation').textContent=view.explanation;labels();status('自由觀察中：拖動滑桿，圖像與讀值會同步變化。要保留紀錄，先關閉自由觀察，再按「操作並觀察」。');}
 conf.controls.forEach(c=>$('ctl-'+c.key).addEventListener('input',()=>{if(moonExplore)previewMoon();else invalidate()}));
 if(conf.id==='moon-eclipse'){
  const presets=node('div','');presets.className='moon-presets';presets.setAttribute('aria-label','月相角度捷徑');for(const [angle,label] of [[0,'朔 0°'],[90,'上弦 90°'],[180,'望 180°'],[270,'下弦 270°']]){const b=node('button',label);b.type='button';b.dataset.moonPhase=angle;b.addEventListener('click',()=>{$('ctl-phase').value=angle;$('ctl-phase').dispatchEvent(new Event('input',{bubbles:true}))});presets.append(b)}$('control-fields').prepend(presets);
  const details=node('details','');details.className='moon-extra';details.append(node('summary','進階：軌道與交點'));for(const key of ['node','inclination']){details.append(document.querySelector(`label[for="ctl-${key}"]`),$('ctl-'+key));}details.append(node('p','交點是月球軌道與地球公轉平面的交會方向。黃緯表示月球偏離該平面的角度；朔望還要接近交點，才可能發生食。'));$('control-fields').append(details);
  const help=node('p','先用四個角度捷徑，比較左邊月相和右邊位置；再展開進階設定研究日月食。');help.className='subtle';presets.before(help);
  const label=node('label',''),check=node('input','');check.type='checkbox';check.id='moon-explore';check.disabled=true;label.append(check,document.createTextNode('自由觀察：拖曳滑桿即時預覽（先完成一次正式操作）'));label.className='coach';$('diagram').before(label);check.addEventListener('change',()=>{moonExplore=check.checked;if(moonExplore)previewMoon();else invalidate('已離開自由觀察。請按「操作並觀察」後再保存紀錄。')});
 }
 if(conf.id!=='moon-eclipse'){
  const label=node('label',''),check=node('input','');check.type='checkbox';check.id='lab-explore';check.disabled=true;label.append(check,document.createTextNode('自由觀察：拖曳即時更新（先完成一次正式操作）'));label.className='coach';$('diagram').before(label);check.addEventListener('change',()=>{moonExplore=check.checked;if(moonExplore)previewMoon();else invalidate('已離開自由觀察，請重新操作後保存紀錄。')});
 }
 // Drag real model objects in exploration mode. Pointer capture stays on the stable diagram container.
 if(['optics','energy'].includes(conf.id)){
  const tip=node('p','完成一次正式操作，再開啟自由觀察：可拖曳圖中的橘色物體；鍵盤選中物體後按左右鍵也可以。');tip.className='lab-drag-tip';$('diagram').before(tip);
  let drag=null;const stage=$('diagram');
  const setValue=(key,value)=>{const control=conf.controls.find(c=>c.key===key);$('ctl-'+key).value=String(Math.min(control.max,Math.max(control.min,Math.round(value/control.step)*control.step)));$('ctl-'+key).dispatchEvent(new Event('input',{bubbles:true}));};
  stage.addEventListener('pointerdown',e=>{const handle=e.target.closest('[data-lab-drag]');if(!handle||e.button!==0)return;if(!moonExplore){status('先開啟自由觀察，就能拖動物體；要保存正式紀錄，請先關閉自由觀察並按「操作並觀察」。',true);return}e.preventDefault();const svg=handle.ownerSVGElement,box=svg.getBoundingClientRect();drag={pointer:e.pointerId,key:handle.dataset.labDrag,value:+$('ctl-'+handle.dataset.labDrag).value,x:e.clientX,ratio:+handle.dataset.unitsPerPx*660/Math.max(1,box.width)};try{stage.setPointerCapture(e.pointerId)}catch(_){}});
  stage.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointer)return;e.preventDefault();setValue(drag.key,drag.value+(e.clientX-drag.x)*drag.ratio)});
  const end=e=>{if(drag&&drag.pointer===e.pointerId){drag=null;try{stage.releasePointerCapture(e.pointerId)}catch(_){}}};['pointerup','pointercancel','lostpointercapture'].forEach(type=>stage.addEventListener(type,end));
  stage.addEventListener('keydown',e=>{const h=e.target.closest('[data-lab-drag]');if(!h||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();if(!moonExplore){status('先開啟自由觀察，再移動物體。',true);return}const key=h.dataset.labDrag,control=conf.controls.find(c=>c.key===key);setValue(key,+$('ctl-'+key).value+(e.key==='ArrowRight'?1:-1)*Math.sign(+h.dataset.unitsPerPx)*control.step);stage.querySelector('[data-lab-drag]')?.focus();});
 }
 $('run').addEventListener('click',run);
 $('reset').addEventListener('click',()=>{conf.controls.forEach(c=>$('ctl-'+c.key).value=c.value);mission=null;document.querySelectorAll('[data-mission]').forEach(b=>b.removeAttribute('aria-current'));$('mission-prompt').textContent='自由探索：先固定其他條件，只改一個變因。';invalidate('本輪已重新開始，既有紀錄保留。')});
 document.querySelectorAll('[data-mission]').forEach(b=>b.addEventListener('click',()=>{mission=Number(b.dataset.mission);const t=conf.tasks[mission];conf.controls.forEach(c=>$('ctl-'+c.key).value=Object.hasOwn(t.values,c.key)?t.values[c.key]:c.value);document.querySelectorAll('[data-mission]').forEach(x=>x.removeAttribute('aria-current'));b.setAttribute('aria-current','true');$('mission-prompt').textContent=t.prompt;invalidate('已載入任務條件。按「操作並觀察」查看結果。')}));
 $('add-record').addEventListener('click',()=>{if(!current)return;const explanation=$('explanation-input').value.trim();if(explanation.length<2){status('請先寫下你觀察到的數據或關係，再加入紀錄。',true);$('explanation-input').focus();return}
  records.push({settings:{...current.s},conditions:conditions(current.s),result:current.view.metrics.map(m=>m.join('：')).join('；'),explanation:explanation.slice(0,1000)});records=records.slice(-50);save();renderRecords();$('add-record').disabled=true;send('record');if(current.mission!==null)send('task_complete');status('已加入第'+records.length+'筆紀錄。請只改一個條件，再做一次比較。')});
 $('clear-records').addEventListener('click',()=>{if(!confirm('清除本頁在此瀏覽器的全部觀察紀錄？'))return;records=[];save();renderRecords();status('紀錄已清除。')});
 function preparePrint(){$('print-current').textContent=current?'本輪解釋（含尚未存入紀錄的文字）：'+($('explanation-input').value.trim()||'尚未填寫。'):'本輪尚未操作；請參閱下方已儲存紀錄。'}
 $('print').addEventListener('click',()=>{preparePrint();send('print');window.print()});
 window.addEventListener('beforeprint',preparePrint);
 $('level').addEventListener('change',()=>{$('formula').hidden=$('level').value!=='advanced'});
 let quizSent=false;
 $('check-quiz').addEventListener('click',()=>{let score=0,answered=0;conf.quiz.forEach((q,i)=>{const selected=document.querySelector(`input[name="quiz-${i}"]:checked`),out=$('feedback-'+i);if(selected)answered++;const correct=selected&&Number(selected.value)===q.answer;if(correct)score++;out.textContent=correct?'答對了。'+q.tip:selected?'再觀察一次：'+q.tip:'尚未作答，請先選擇答案。'});$('quiz-score').textContent=`已答${answered}/3，答對${score}/3。${answered<3?'請補完未答題。':''}`;if(answered===3&&!quizSent){send('quiz_complete');quizSent=true}});
 document.querySelectorAll('.quiz input').forEach(el=>el.addEventListener('change',()=>{quizSent=false;$('feedback-'+el.name.replace('quiz-','')).textContent='';$('quiz-score').textContent='答案已變更，請重新檢查。'}));
 $('control-fields').disabled=false;labels();renderRecords();
})();
