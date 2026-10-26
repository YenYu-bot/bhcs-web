import {sameIllumination,illuminationSettings} from './illumination.js?v=eab0f0e4c58b';
import {clarity} from './model.js';
import {describeObservation,specimens} from './cell-observation.js?v=07abc8ce6c63';
const fingerprint=s=>JSON.stringify([s.specimen,s.objective,s.coarse,s.fine,s.light,s.stageX,s.stageY,illuminationSettings(s)]);
const setup=(a,b)=>sameIllumination(a,b)&&['specimen','coarse','light','stageX','stageY'].every(k=>a[k]===b[k]);
export function mountCellCourse(root,initial,{clock=()=>performance.now(),onCapture,onReplay,onCenter,onLowPower,onChange}={}){
 let state={...initial},kind=null,phase='low',low=null,high=null,revision=0,lastAction=-Infinity,message='',quizFeedback='',key='',timer=null;
 const ready=()=>!!kind&&state.specimen===kind&&describeObservation(state).observable&&(phase==='low'?state.objective===4:phase==='high'?state.objective===40&&!!low&&setup(low,state):false);
 const snapshot=()=>({kind,phase,revision,ready:ready(),state:{...state},low:low&&{...low},high:high&&{...high}});
 function start(specimen){kind=['onion','elodea'].includes(specimen)?specimen:null;phase='low';low=high=null;message='';quizFeedback='';revision++;lastAction=-Infinity;key='';render();}
 function update(next){const changed=fingerprint(state)!==fingerprint(next);state={...next};if(changed){revision++;if(phase!=='done')quizFeedback='';if(phase!=='done'&&low&&!setup(low,state)){low=high=null;phase='low';message='標本或比較條件已改變，請重新收下低倍觀察。';}else if(high&&phase==='answer'){high=null;phase='high';message='畫面已改變，請重新收下高倍觀察。';}}render();}
 function act(action,value,stamp){if(!kind||stamp!==revision||clock()-lastAction<350)return false;
  if(action==='observe'){if(!ready())return false;quizFeedback='';const source=phase==='low'?'cell-low':'cell-high',observed={...state};if(phase==='low'){low=observed;phase='high';}else{high=observed;phase='answer';}const result=onCapture?.(observed,{source,eventId:`cell-${revision}`});message=result?(result.ok?result.reason:`觀察仍有效，但筆記沒有新增：${result.reason}`):'';}
  else if(action==='answer'){if(phase!=='answer'||!high||fingerprint(high)!==fingerprint(state))return false;const explanation=kind==='onion'?'洋蔥鱗莖表皮的棕色小橢圓是染色細胞核示意，通常不見葉綠體。':'水蘊草葉片的綠色小顆粒是葉綠體。模型未顯示細胞核，不代表細胞沒有細胞核。';quizFeedback=(value==='correct'?'答對了。':'這一項不是答案，請再選一次。')+explanation;message='';if(value==='correct'){phase='done';message='完成這份標本的模擬觀察；不代表真實顯微鏡操作認證。';}}
  else if(action==='replay'){quizFeedback='';phase='low';low=high=null;message='從低倍重新觀察；筆記保留，另開新回合。';onReplay?.();}
  else return false;lastAction=clock();revision++;render(true);onChange?.();return true;
 }
 function render(focus=false){root.hidden=!kind;if(!kind)return;const desc=describeObservation(state),valid=ready(),cooldown=clock()-lastAction<350,signature=JSON.stringify([kind,phase,valid,message,quizFeedback]);
  if(signature!==key){key=signature;root.replaceChildren();const h=document.createElement('h2');h.tabIndex=-1;h.textContent=`細胞觀察｜${specimens[kind].name} · ${phase==='low'?'1／3 低倍定位':phase==='high'?'2／3 高倍辨認':phase==='answer'?'3／3 構造判讀':'3／3 完成'}`;root.append(h);
   const goal=document.createElement('p');goal.textContent=phase==='low'?'選4×物鏡、玻片回中央，手動調到至少80%清晰，再收下細胞壁觀察。':phase==='high'?'換40×物鏡，只調微動；保留低倍的標本、位置、照明與粗動。本階段只驗收置中視野。':phase==='answer'?'下面是觀察小測驗，請先讀問題，再選一個答案。':'這份細胞觀察已完成；可查看筆記，或選另一份標本。';root.append(goal);
   const checks=document.createElement('p');checks.className='cell-checks';root.append(checks);const notice=document.createElement('p');notice.className='cell-notice';notice.setAttribute('role','status');notice.textContent=message;root.append(notice);const actions=document.createElement('div');actions.className='course-actions';root.append(actions);
   function button(text,action,value){const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.cellAction=action;if(value)b.dataset.value=value;b.addEventListener('click',()=>{if(!root.hidden&&root.contains(b)&&!b.disabled)act(action,value,Number(b.dataset.stamp));});actions.append(b);return b;}
   if(phase==='low'||phase==='high')button(phase==='low'?'收下細胞低倍觀察':'收下細胞高倍觀察','observe');
   if(phase==='answer'||phase==='done'){const choices=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=phase==='done'?'觀察小測驗｜已完成':'觀察小測驗｜請選一項';choices.className='cell-answer-choices';choices.append(legend);const question=document.createElement('p');question.className='cell-question';question.textContent=kind==='onion'?'題目：剛才洋蔥高倍觀察中的棕色小橢圓，代表哪一種構造？':'題目：剛才水蘊草高倍觀察中的綠色小顆粒，代表哪一種構造？';choices.append(question);choices.append(button('A．細胞核','answer',kind==='onion'?'correct':'wrong'),button('B．葉綠體','answer',kind==='elodea'?'correct':'wrong'));const feedback=document.createElement('p');feedback.className='cell-quiz-feedback';feedback.setAttribute('role','status');feedback.textContent=quizFeedback||'尚未作答。上方圖例是構造說明；這裡的A、B是答案選項。';choices.append(feedback);actions.prepend(choices);}
   button('重做這份細胞觀察','replay');
   for(const [action,text,fn]of [['center','玻片回中央',onCenter],['low','切回4×物鏡',onLowPower]]){const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.cellRecovery=action;b.addEventListener('click',()=>{if(!root.hidden&&!b.disabled&&root.contains(b)){fn?.();root.querySelector('h2')?.focus({preventScroll:true});}});actions.append(b);}
   const link=document.createElement('a');link.href='#notebook';link.textContent='查看觀察筆記';actions.append(link);
  }
  root.querySelector('.cell-checks').textContent=`物鏡${state.objective}×（總倍率${state.objective*10}×） · 清晰度${clarity(state)}% · ${state.stageX===0&&state.stageY===0?'已置中':'尚未置中'}。${desc.reason}${cooldown?' 剛完成操作，請稍候。':''}`;
  for(const b of root.querySelectorAll('[data-cell-action]')){b.dataset.stamp=revision;b.disabled=cooldown||(b.dataset.cellAction==='observe'&&!valid)||(b.dataset.cellAction==='answer'&&phase!=='answer');}
  root.querySelector('[data-cell-recovery=center]').disabled=state.stageX===0&&state.stageY===0;root.querySelector('[data-cell-recovery=low]').disabled=state.objective===4;
  if(focus)root.querySelector('h2')?.focus({preventScroll:true});if(timer)clearTimeout(timer);if(cooldown)timer=setTimeout(()=>render(),360);
 }
 render();return {start,update,snapshot,destroy(){if(timer)clearTimeout(timer);}};
}
