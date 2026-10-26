import {createCourse,referenceVisible} from './course.js?v=4cfd5966f331';
import {compoundIllumination} from './illumination.js?v=eab0f0e4c58b';
import {clarity} from './model.js';
const titles=['把低倍調清楚','發現影像反向','比較低倍與高倍'];
export function mountCourse(root,initialState,{clock,onChange,onCenter,onLowPower,onObservation}={}){
 const course=createCourse(initialState,clock);let signature='',timer=null;
 root.innerHTML='<div class="course-heading"><div><p class="course-kicker">余老師的三張觀察卡</p><h2>今天，完成三個小任務</h2></div><output class="course-progress" aria-label="任務進度"></output></div><ol class="course-cards"></ol><div class="course-panel"></div><p class="course-announcement sr-only" role="status" aria-live="polite"></p><p class="course-note-status" role="status" aria-live="polite"></p><div class="course-tools"></div>';
 const cards=root.querySelector('.course-cards'),panel=root.querySelector('.course-panel'),tools=root.querySelector('.course-tools'),announcement=root.querySelector('.course-announcement');
 function button(text,action,value,parent,disabled=false){const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.courseAction=action;if(value!==undefined)b.dataset.value=value;b.disabled=disabled;b.addEventListener('click',()=>{if(root.hidden||b.disabled||!root.contains(b))return;const before=course.snapshot();if(course.accept(action,value,Number(b.dataset.stamp))){if(action==='observe'){const note=onObservation?.({state:{...before.state},source:before.phase,eventId:`course-observe-${before.revision}`});if(note)root.querySelector('.course-note-status').textContent=note.ok?note.reason:`觀察仍有效，但筆記沒有新增：${note.reason}`;}else if(action==='replay')root.querySelector('.course-note-status').textContent='';refresh(true);onChange?.(course.snapshot(),action);}});parent.append(b);return b;}
 function instruction(s){
  if(s.mode==='free')return ['自由觀察','所有實驗控制都可以照常使用；這段時間不收集任務證據。','準備好時按「回到任務」，重新收下目前任務的觀察。'];
  const valid=referenceVisible(s.state),c=clarity(s.state);
  if(s.phase==='focus')return ['任務①｜把低倍調清楚','選4×物鏡，讓定位十字留在視野內，清晰度至少80%。','可按粗動＋：從起點64%→82%→100%。達標後親自收下觀察。'];
  if(s.phase==='direction-start')return ['任務②｜先收下一個起點','保持4×、清晰度至少80%，看得到定位十字交點。','先按「收下起點」，再用左右箭頭或拖動「玻片」標示。回中央不算方向操作。'];
  if(s.phase==='direction-move')return ['任務②｜玻片移了，影像呢？','只向左或向右移動，讓十字交點明顯移動且仍在視野內。','按一次玻片←或→即可；不要同時上下移動。達標後收下移動後畫面。'];
  if(s.phase==='direction-answer'){const direction=s.answerEvidence.slideDirection==='right'?'右':'左';return ['任務②｜說說你的觀察',`這次玻片向${direction}移動。目鏡內的定位十字往哪邊移？`,'根據剛剛的實際移動作答；改變條件就需要重新觀察。'];}
  if(s.phase==='compare-low')return ['任務③｜收下低倍畫面','先回中央、選4×，調到至少80%清晰，再收下低倍觀察。','接著換40×；同一位置、照明與粗動位置不變，高倍可以調微動。'];
  if(s.phase==='compare-high')return ['任務③｜收下高倍畫面','換40×物鏡，只用微動調到至少80%，保留同一定位十字交點。',!valid?'交點不在視野內：回中央，再回4×重新收下低倍。':c<80?'高倍還不夠清楚：用微動＋／−；若仍無法調清楚，回低倍重新觀察。':'40×的畫面清楚後，收下高倍觀察，再比較兩筆讀數。'];
  if(s.phase==='compare-answer')return ['任務③｜比較兩次真實觀察','從4×換到40×物鏡，影像大小與視野範圍如何改變？','兩筆觀察的標本、位置、照明與粗動相同；微動可以不同。'];
  return ['完成這三個模擬任務','你已收下清楚的低倍觀察、驗證反向移動，並比較低／高倍。','這是字母e的入門模擬，不代表已熟練真實顯微鏡，也不是完整研究手冊課程。'];
 }
 function conditionReason(s){
  const st=s.state;if(!compoundIllumination(st).readable)return '下一步：調整光圈與反光鏡，讓照明達到適合。清晰度與照明是不同條件。';const required=s.phase==='compare-high'?40:4;
  if(st.objective!==required)return `下一步：選${required}×物鏡（總倍率${required*10}×），不是總倍率${required}×。`;
  if(s.phase==='compare-low'&&(st.stageX!==0||st.stageY!==0))return '下一步：按下方「玻片回中央」。任務②移動過玻片；任務③須回中央，才能在同一位置比較低倍與高倍。';
  if(clarity(st)<80)return `下一步：目前清晰度${clarity(st)}%，請用${st.objective===40?'微動':'粗動或微動'}調到至少80%；不會自動替你調焦。`;
  if(!referenceVisible(st))return '下一步：讓字母e的定位十字交點回到視野內；可按「玻片回中央」。';
  if(s.phase==='direction-move')return '下一步：從已收下的起點向左或向右明顯移動，避免同時上下移動，再收下畫面。';
  return '下一步：重新收下有效的低倍觀察，再在同一位置、照明與粗動設定收下高倍觀察。';
 }
 function refresh(focusHeading=false){
  const s=course.snapshot(),lines=instruction(s),key=JSON.stringify([s.mode,s.phase,s.progress,s.message,s.ready,lines,s.answerEvidence]);
  root.querySelector('.course-progress').textContent=`${s.progress}／3 完成`;
  if(key!==signature){signature=key;cards.replaceChildren();titles.forEach((title,i)=>{const li=document.createElement('li');li.className=i<s.progress?'complete':i===s.progress&&s.mode==='guided'?'current':'';const b=button(`${i+1} · ${title}${i<s.progress?' ✓':''}`,'task',i,li,i>Math.min(s.progress,2)||s.mode==='free');b.title=i<=s.progress?'重新開始此任務及後續任務':'先完成前一個任務';if(i===s.progress&&s.mode==='guided')b.setAttribute('aria-current','step');cards.append(li);});
   panel.replaceChildren();const h=document.createElement('h3');h.tabIndex=-1;h.textContent=lines[0];panel.append(h);for(const text of lines.slice(1)){const p=document.createElement('p');p.textContent=text;panel.append(p);}
   if(s.message){const p=document.createElement('p');p.className='course-feedback';p.textContent=s.message;panel.append(p);}
   if(s.mode==='guided'&&s.phase!=='done'){
    if(s.phase==='direction-answer'){const answers=document.createElement('div');answers.className='course-actions';for(const [v,t]of[['left','向左'],['right','向右'],['same','沒有移動']])button(t,'answer',v,answers);panel.append(answers);}
    else if(s.phase==='compare-answer'){const p=document.createElement('p'),a=s.answerEvidence;p.className='course-evidence';p.textContent=`低倍：${a.lowTotal}×，視野${a.lowField} mm；高倍：${a.highTotal}×，視野${a.highField} mm。`;panel.append(p);const answers=document.createElement('div');answers.className='course-actions';for(const[v,t]of[['larger-smaller','影像更大，視野更小'],['larger-larger','影像更大，視野更大'],['same','兩者都不變']])button(t,'answer',v,answers);panel.append(answers);}
    else{const labels={focus:'收下清楚的低倍觀察','direction-start':'收下起點','direction-move':'收下移動後畫面','compare-low':'收下低倍觀察','compare-high':'收下高倍觀察'};button(labels[s.phase],'observe',undefined,panel,!s.ready);if(!s.ready){const p=document.createElement('p');p.className='course-condition';p.textContent=conditionReason(s);panel.append(p);}}
   }
   if(s.mode==='guided'&&['focus','direction-start','compare-low','compare-high'].includes(s.phase)){
    const list=document.createElement('ul');list.className='course-checklist';list.setAttribute('aria-label','目前觀察條件');for(const id of ['objective','clarity','center','reference']){const li=document.createElement('li');li.dataset.check=id;list.append(li);}panel.prepend(list);
    const recovery=document.createElement('div');recovery.className='course-actions course-recovery';for(const [id,text,fn]of [['center','玻片回中央',onCenter],['low','切回4×物鏡',onLowPower]]){if(!fn)continue;const b=document.createElement('button');b.type='button';b.dataset.courseRecovery=id;b.textContent=text;b.addEventListener('click',()=>{if(!root.hidden&&!b.disabled&&root.contains(b)){fn();panel.querySelector('h3')?.focus({preventScroll:true});}});recovery.append(b);}panel.append(recovery);
   }
   tools.replaceChildren();button(s.mode==='free'?'回到任務':'先自由觀察',s.mode==='free'?'resume':'free',undefined,tools);button('重做三個任務','replay',undefined,tools);const a=document.createElement('a');a.href='#controls';a.textContent='前往操作按鈕';tools.append(a);const notes=document.createElement('a');notes.href='#notebook';notes.textContent='查看觀察筆記';tools.append(notes);
   announcement.textContent=`${lines[0]}。${s.message|| (s.ready?'本步條件已達標，可以收下觀察。':lines[1])}`;
  }
  root.querySelectorAll('[data-course-action]').forEach(b=>{b.dataset.stamp=s.revision;const action=b.dataset.courseAction;b.disabled=s.cooldown||(action==='observe'&&!s.ready)||(action==='task'&&(Number(b.dataset.value)>Math.min(s.progress,2)||s.mode==='free'));});
  const st=s.state,checks={objective:`${st.objective===(s.phase==='compare-high'?40:4)?'✓':'待完成'} 物鏡：${st.objective}×（總倍率 ${st.objective*10}×）；本步需要${s.phase==='compare-high'?40:4}×物鏡`,clarity:`${clarity(st)>=80?'✓':'待完成'} 清晰度：${clarity(st)}%／至少80%`,center:`${st.stageX===0&&st.stageY===0?'✓ 已在中央':'待完成：玻片尚未回中央'}${s.phase==='compare-low'?'（本步須在中央）':'（位置狀態）'}`,reference:`${referenceVisible(st)?'✓':'待完成'} 定位十字交點${referenceVisible(st)?'在視野內':'不在視野內'}`};
  for(const li of panel.querySelectorAll('[data-check]')){li.textContent=checks[li.dataset.check];li.hidden=li.dataset.check==='center'&&s.phase!=='compare-low';}
  const center=panel.querySelector('[data-course-recovery=center]');if(center){center.disabled=st.stageX===0&&st.stageY===0;center.textContent=center.disabled?'玻片已在中央':'玻片回中央';}
  const low=panel.querySelector('[data-course-recovery=low]');if(low){low.disabled=st.objective===4;low.textContent=low.disabled?'目前為4×物鏡':'切回4×物鏡';}
  let status=panel.querySelector('.course-condition');if(!status&&s.mode==='guided'&&!s.phase.endsWith('answer')&&s.phase!=='done'){status=document.createElement('p');status.className='course-condition';panel.append(status);}if(status)status.textContent=s.cooldown?'剛完成操作，請稍候片刻再收下觀察。':s.ready?'條件已達標，可以收下觀察。':conditionReason(s);
  if(focusHeading)panel.querySelector('h3')?.focus({preventScroll:true});
  if(timer)clearTimeout(timer);if(s.cooldown)timer=setTimeout(()=>refresh(),360);
 }
 refresh();return{update:(state,reason)=>{course.update(state,reason);if(reason==='reset')root.querySelector('.course-note-status').textContent='';refresh();},snapshot:course.snapshot,destroy:()=>{if(timer)clearTimeout(timer);}};
}
