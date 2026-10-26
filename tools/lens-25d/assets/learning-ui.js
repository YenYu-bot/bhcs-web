// Learning UI: reads recorded snapshots only. Never mutates optical state or evidence.
import { createLearningState, reconcileLearning, learningView, answerLearning } from './learning-summary.js';
import { calculateLensState } from './optics-guided/model.js';
import { CASES } from './five-case.js';
const names={smaller:'縮小',same:'等大',larger:'放大',inverted:'倒立',upright:'正立'};
const display=n=>Number.isFinite(n)?String(Number(n.toFixed(3))):'不適用';
export function createLearningUI({getRecords,onReturn}){
 let state=createLearningState(),last='';
 const root=document.getElementById('learning-questions'),models=document.getElementById('model-comparison');
 function update(){
  const records=getRecords();state=reconcileLearning(state,records);const view=learningView(state,records),signature=JSON.stringify({records,view});if(signature===last)return;last=signature;
  const readyIds=new Set(view.comparisonRows.filter(r=>r.ready).map(r=>r.id));
  models.innerHTML=CASES.map(c=>{const r=records[c.id];if(!readyIds.has(c.id))return `<article class="model-card"><h3>${c.label}</h3><p>待觀察：先留下這個條件的紀錄，再對照模型。</p></article>`;const lens=calculateLensState({f:r.f,u:r.u}),focal=lens.imageType==='infinite',virtual=lens.imageType==='virtual';return `<article class="model-card"><h3>${c.label}</h3><p>使用已記錄物距 ${r.u} cm、焦距 ${r.f} cm。</p><dl><div><dt>模型像的位置</dt><dd>${focal?'不適用（無有限像距）':virtual?`物體同側 ${display(Math.abs(lens.theoreticalV))} cm（非光屏）`:`透鏡另一側 ${display(lens.theoreticalV)} cm`}</dd></div><div><dt>方向／大小</dt><dd>${focal?'不適用（無有限影像）':`${names[lens.imageOrientation]}／${names[lens.imageSize]}`}</dd></div><div><dt>模型倍率</dt><dd>${focal?'不適用':`${display(lens.absoluteMagnification)} 倍`}</dd></div></dl><p>${focal?'物體在焦點上，出射光線平行；這不是虛像。':virtual?'虛像正立且放大；光屏接不到，需從透鏡後觀察。':'實像可以由光屏承接；實際記錄位置另列在「我的觀察」，不會被理論值取代。'}</p></article>`;}).join('');
  root.replaceChildren();
  for(const q of view.questions){
   const card=document.createElement('section');card.className='question-card';card.dataset.question=q.id;card.dataset.result=q.answer===null?'unanswered':q.correct?'correct':'retry';
   const eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent=`QUESTION ${q.id.slice(1)} · 我要回答`;card.append(eyebrow);
   const heading=document.createElement('h3');heading.id=`heading-${q.id}`;heading.tabIndex=-1;heading.textContent=q.title;card.append(heading);
   const prompt=document.createElement('p');prompt.textContent=q.prompt;card.append(prompt);
   if(!q.ready){const missing=document.createElement('p');missing.className='missing-note';missing.textContent='待觀察：補齊以下紀錄後，這一題才會開放。';card.append(missing);for(const id of q.missing){const b=document.createElement('button');b.type='button';b.className='return-case';b.textContent=`前往 ${CASES.find(c=>c.id===id)?.label??id} 觀察 →`;b.addEventListener('click',()=>{if(b.isConnected)onReturn(id)});card.append(b);}}
   const options=document.createElement('div');options.className='answer-options';options.setAttribute('role','group');options.setAttribute('aria-labelledby',heading.id);
   for(const option of q.options){const b=document.createElement('button');b.type='button';b.dataset.answer=option.id;b.textContent=option.text;b.disabled=!q.ready||q.correct;b.setAttribute('aria-pressed',String(q.answer===option.id));b.addEventListener('click',()=>{if(!b.isConnected||b.disabled)return;const result=answerLearning(state,getRecords(),{question:q.id,choice:option.id,fingerprint:q.fingerprint});if(!result.accepted)return;state=result.state;update();document.getElementById(`heading-${q.id}`).focus({preventScroll:true});});options.append(b);}card.append(options);
   const feedback=document.createElement('p');feedback.className='answer-feedback';feedback.id=`feedback-${q.id}`;feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');feedback.textContent=q.feedback??'';card.append(feedback);root.append(card);
  }
  const complete=document.getElementById('learning-complete');complete.hidden=!view.complete;complete.textContent=view.complete?'三題概念檢核都答對了。這代表本次檢核完成，不代表已掌握所有情況。':'';
 }
 return {update,reset(){state=createLearningState();last='';update();}};
}
