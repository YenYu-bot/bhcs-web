(() => {
 'use strict';
 const $=id=>document.getElementById(id), conf=JSON.parse($('lab-config').textContent), storageKey='bhcs-science-v2-'+conf.id;
 let current=null,mission=null,records=[],saveNotice='';
 const send=action=>{if(typeof window.bhcsScienceTrack==='function')window.bhcsScienceTrack(action,conf.id)};
 const node=(tag,txt)=>{const n=document.createElement(tag);n.textContent=txt;return n};
 const validRecord=r=>r&&typeof r==='object'&&typeof r.conditions==='string'&&typeof r.result==='string'&&typeof r.prediction==='string'&&typeof r.explanation==='string'&&[r.conditions,r.result,r.prediction,r.explanation].every(x=>x.length<6000);
 try {const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))records=saved.filter(validRecord).slice(-50)}catch(_){saveNotice='無法讀取舊紀錄，仍可操作與列印。'}
 function save(){try{localStorage.setItem(storageKey,JSON.stringify(records));saveNotice='紀錄保存在這台瀏覽器。'}catch(_){saveNotice='此瀏覽器不允許保存；紀錄僅留在本頁，離開前請列印。'}}
 function renderRecords(){const body=$('records'),printList=$('print-records');body.replaceChildren();printList.replaceChildren();if(!records.length){const tr=node('tr',''),td=node('td','尚未記錄；先完成預測與操作。');td.colSpan=5;tr.append(td);body.append(tr);printList.append(node('p','尚無已儲存紀錄。'))}else records.forEach((r,i)=>{const tr=node('tr','');[String(i+1),r.conditions,r.prediction,r.result,r.explanation].forEach(v=>tr.append(node('td',v)));body.append(tr);const card=node('article','');card.className='print-record';card.append(node('h3','紀錄 '+(i+1)));[['條件',r.conditions],['預測',r.prediction],['結果',r.result],['解釋',r.explanation]].forEach(([label,value])=>{const p=node('p','');p.append(node('strong',label+'：'),document.createTextNode(value));card.append(p)});printList.append(card)});$('storage-status').textContent=saveNotice||'僅保存於本機，最多50筆，不收集姓名。'}
 function state(){const s={};for(const c of conf.controls){const el=$('ctl-'+c.key);if(c.options){if(!c.options.some(o=>o[0]===el.value))throw Error('Invalid option');s[c.key]=el.value}else {const n=Number(el.value);if(!Number.isFinite(n)||n<c.min||n>c.max)throw Error('Invalid number');s[c.key]=n}}return s}
 function activeKeys(mode){return conf.id==='electromagnetism'?({magnet:['mode','turns','current'],motor:['mode','turns','current','field','angle'],generator:['mode','turns','field','angle','rpm']})[mode]:conf.id==='pressure-fluid'?({water:['mode','depth','density'],gas:['mode','volume'],flow:['mode','density','ratio','speed']})[mode]:null}
 function conditions(s){const active=activeKeys(s.mode);return conf.controls.filter(c=>!active||active.includes(c.key)).map(c=>`${c.label}：${c.options?c.options.find(o=>o[0]===s[c.key])[1]:s[c.key]+' '+c.unit}`).join('；')}
 function labels(){
  const active=activeKeys($('ctl-mode')?.value);
  conf.controls.forEach(c=>{const el=$('ctl-'+c.key);el.disabled=!!(active&&!active.includes(c.key));if(!c.options)$('out-'+c.key).textContent=el.disabled?'本模式不使用':el.value+' '+c.unit})
 }
 function status(message,warn=false){$('status').textContent=message;$('status').className='status'+(warn?' warn':'')}
 function invalidate(message='條件已更新，請重新預測後查看結果。'){
  current=null;$('prediction').value='';$('add-record').disabled=true;$('explanation-input').value='';$('diagram').innerHTML='<p class="empty">先選擇預測，再按「操作並觀察」。結果尚未揭露。</p>';$('readouts').replaceChildren();$('current-conditions').textContent='';$('print-current').textContent='本輪尚未操作；請參閱下方已儲存紀錄。';$('result-explanation').textContent='操作後，這裡會說明模型結果。';status(message);labels();
 }
 function run(){if(!$('prediction').value){status('請先選擇一個預測；猜錯也能幫助學習。',true);$('prediction').focus();return}let s;try{s=state()}catch(_){status('控制值無效，請重新設定。',true);return}
  const r=calculate(conf.id,s),view=describe(conf.id,s,r);current={s,r,view,prediction:$('prediction').value,mission};
  $('diagram').innerHTML=diagram(conf.id,s,r);$('readouts').replaceChildren();view.metrics.forEach(([name,value])=>{const box=node('div',name);box.className='meter';box.append(node('strong',value));$('readouts').append(box)});
  $('result-explanation').textContent=view.explanation;$('current-conditions').textContent='本次有效條件：'+conditions(s);$('add-record').disabled=false;
  const correct=conf.choices.find(c=>c[0]===r.kind)?.[1]||r.kind;status(($('prediction').value===r.kind?'預測符合本模型。':'預測和本模型不同，可以回頭比較。')+' 觀察：'+correct+'。請寫下依據並加入紀錄。');send('start');
 }
 conf.controls.forEach(c=>$('ctl-'+c.key).addEventListener('input',()=>invalidate()));
 $('prediction').addEventListener('change',()=>{if(current){const selected=$('prediction').value;invalidate('預測已變更，請重新操作。');$('prediction').value=selected}});
 $('run').addEventListener('click',run);
 $('reset').addEventListener('click',()=>{conf.controls.forEach(c=>$('ctl-'+c.key).value=c.value);mission=null;document.querySelectorAll('[data-mission]').forEach(b=>b.removeAttribute('aria-current'));$('mission-prompt').textContent='自由探索：先固定其他條件，只改一個變因。';invalidate('本輪已重新開始，既有紀錄保留。')});
 document.querySelectorAll('[data-mission]').forEach(b=>b.addEventListener('click',()=>{mission=Number(b.dataset.mission);const t=conf.tasks[mission];conf.controls.forEach(c=>$('ctl-'+c.key).value=Object.hasOwn(t.values,c.key)?t.values[c.key]:c.value);document.querySelectorAll('[data-mission]').forEach(x=>x.removeAttribute('aria-current'));b.setAttribute('aria-current','true');$('mission-prompt').textContent=t.prompt;invalidate('已載入任務條件。預測由你選，不會自動填答案。');$('prediction').focus()}));
 $('add-record').addEventListener('click',()=>{if(!current)return;const explanation=$('explanation-input').value.trim();if(explanation.length<2){status('請先寫下你觀察到的數據或關係，再加入紀錄。',true);$('explanation-input').focus();return}
  records.push({conditions:conditions(current.s),prediction:conf.choices.find(c=>c[0]===current.prediction)[1],result:current.view.metrics.map(m=>m.join('：')).join('；'),explanation:explanation.slice(0,1000)});records=records.slice(-50);save();renderRecords();$('add-record').disabled=true;send('record');if(current.mission!==null)send('task_complete');status('已加入第'+records.length+'筆紀錄。請只改一個條件，再做一次比較。')});
 $('clear-records').addEventListener('click',()=>{if(!confirm('清除本頁在此瀏覽器的全部觀察紀錄？'))return;records=[];save();renderRecords();status('紀錄已清除。')});
 $('print').addEventListener('click',()=>{send('print');window.print()});
 window.addEventListener('beforeprint',()=>{$('print-current').textContent=current?'本輪預測：'+conf.choices.find(c=>c[0]===current.prediction)[1]+'；本輪解釋（含尚未存入紀錄的文字）：'+($('explanation-input').value.trim()||'尚未填寫。'):'本輪尚未操作；請參閱下方已儲存紀錄。'});
 $('level').addEventListener('change',()=>{$('formula').hidden=$('level').value!=='advanced'});
 let quizSent=false;
 $('check-quiz').addEventListener('click',()=>{let score=0,answered=0;conf.quiz.forEach((q,i)=>{const selected=document.querySelector(`input[name="quiz-${i}"]:checked`),out=$('feedback-'+i);if(selected)answered++;const correct=selected&&Number(selected.value)===q.answer;if(correct)score++;out.textContent=correct?'答對了。'+q.tip:selected?'再觀察一次：'+q.tip:'尚未作答，請先選擇答案。'});$('quiz-score').textContent=`已答${answered}/3，答對${score}/3。${answered<3?'請補完未答題。':''}`;if(answered===3&&!quizSent){send('quiz_complete');quizSent=true}});
 document.querySelectorAll('.quiz input').forEach(el=>el.addEventListener('change',()=>{quizSent=false;$('feedback-'+el.name.replace('quiz-','')).textContent='';$('quiz-score').textContent='答案已變更，請重新檢查。'}));
 $('control-fields').disabled=false;labels();renderRecords();
})();
