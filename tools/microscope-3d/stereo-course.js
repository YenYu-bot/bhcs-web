import{stereoClarity,stereoObservable}from'./stereo-model.js?v=c92e0903f33e';
const fingerprint=s=>JSON.stringify([s.total,s.focus,s.stageX,s.stageY,s.lamp,s.specimen]);
const same=(a,b,keys)=>keys.every(k=>a[k]===b[k]);
const pair=(a,b)=>same(a,b,['stageX','stageY','lamp','specimen']);
export function mountStereoCourse(root,initial,{clock=()=>performance.now(),onCapture,onReplay,onChange,onCenter,onLowPower}={}){
 let state={...initial},phase='focus',start=null,low=null,high=null,revision=0,last=-Infinity,serial=0,message='',quizFeedback='',key='',timer=null;
 const centered=()=>state.stageX===0&&state.stageY===0;
 const ready=()=>stereoObservable(state)&&(phase==='focus'?state.total===20:phase==='low'?state.total===20&&centered():phase==='high'?state.total===40&&!!low&&pair(low,state):false);
 const directionValid=()=>!!start&&state.total===20&&stereoObservable(start)&&stereoObservable(state)&&same(start,state,['total','focus','lamp','specimen'])&&state.stageX-start.stageX>=12&&Math.abs(state.stageY-start.stageY)<=2;
 const snapshot=()=>({phase,ready:ready(),revision,state:{...state},start:start&&{...start},low:low&&{...low},high:high&&{...high}});
 function reset(){phase='focus';start=low=high=null;message='';quizFeedback='';revision++;last=-Infinity;key='';render();}
 function update(next,reason='change'){const changed=fingerprint(next)!==fingerprint(state);state={...next};if(changed||reason==='center'){
  revision++;if(phase!=='done')quizFeedback='';
  if(phase==='direction'||phase==='direction-answer'){
   if(reason==='center'||!start||!same(start,state,['total','focus','lamp','specimen'])||!stereoObservable(state)){phase='focus';start=null;message='條件已改變，請重新收下20×清楚觀察，再移動標本。';}
   else phase=directionValid()?'direction-answer':'direction';
  }else if(phase!=='done'&&low&&!pair(low,state)){phase='low';low=high=null;message='位置、標本或照明已改變，請重新收下20×觀察。';}
  else if(phase==='field-answer'){phase='high';high=null;message='高倍畫面已改變，請重新收下40×觀察。';}
 }render();}
 function capture(source){const observed={...state},result=onCapture?.(observed,{source,eventId:`stereo-${++serial}`});return result?(result.ok?result.reason:`本次觀察有效，但筆記未新增：${result.reason}`):'';}
 function act(action,value,stamp){if(root.hidden||stamp!==revision||clock()-last<350)return false;
  if(action==='observe'){
   quizFeedback='';
   if(!ready())return false;
   if(phase==='focus'){start={...state};message=capture('stereo-focus');phase='direction';}
   else if(phase==='low'){low={...state};message=capture('stereo-low');phase='high';}
   else if(phase==='high'){high={...state};message=capture('stereo-high');phase='field-answer';}
  }else if(action==='answer'){
   if(phase==='direction-answer'){if(!directionValid())return false;if(value==='right'){phase='low';start=null;quizFeedback='答對了：標本往右，這個正立模型的影像也往右。';message='請先回中央，再收下20×比較觀察。';}else quizFeedback='請再選一次：本模型是正立像，標本和影像移動方向相同。';}
   else if(phase==='field-answer'){if(!high||fingerprint(high)!==fingerprint(state)||!low||!pair(low,high)||!stereoObservable(high))return false;if(value==='smaller'){phase='done';quizFeedback='答對了：倍率增加，視野範圍變小。';message='完成這三個解剖顯微鏡模擬任務。20×視野10 mm，40×視野5 mm；這是指定模型，不代表所有儀器。';}else quizFeedback='請再選一次。請比較讀數：20×是10 mm，40×是5 mm；倍率增加，可見範圍變小。';}else return false;
  }else if(action==='replay'){phase='focus';start=low=high=null;quizFeedback='';message='重做模擬任務；筆記保留，另開新回合。';onReplay?.();}else return false;
  last=clock();revision++;render(true);onChange?.();return true;
 }
 function render(focus=false){const cool=clock()-last<350,valid=ready(),sig=JSON.stringify([phase,message,quizFeedback]);
  if(sig!==key){key=sig;root.replaceChildren();const title=document.createElement('h2');title.tabIndex=-1;title.textContent=`解剖顯微鏡任務｜${phase==='focus'?'1／3 清楚照明':phase.startsWith('direction')?'2／3 正立方向':phase==='done'?'3／3 完成':'3／3 倍率與視野'}`;root.append(title);
   const goal=document.createElement('p');goal.textContent=phase==='focus'?'選總倍率20×，開啟上方燈光並手動調焦至80%以上，再收下觀察。':phase==='direction'?'保持倍率、焦距與燈光，把標本向右移動至少一小段；不要按回中央，觀察影像方向。':phase==='direction-answer'?'已取得實際向右移動的觀察，請回答下方小測驗。':phase==='low'?'先回中央，在20×、清晰度80%以上收下低倍觀察。':phase==='high'?'換總倍率40×，位置、標本和燈光保持不變；可重新調焦至80%以上。':phase==='field-answer'?'已收下20×和40×觀察，請比較讀數並回答下方小測驗。':'可自由操作、查看筆記，或重做三個模擬任務。平面螢幕不提供真正雙眼立體視覺。';root.append(goal);
   const checks=document.createElement('p');checks.className='cell-checks';root.append(checks);const status=document.createElement('p');status.className='cell-notice';status.setAttribute('role','status');status.textContent=message;root.append(status);const actions=document.createElement('div');actions.className='course-actions';root.append(actions);
   function button(text,action,value){const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.stereoAction=action;if(value)b.dataset.value=value;b.addEventListener('click',()=>{if(root.contains(b)&&!b.disabled)act(action,value,Number(b.dataset.stamp));});actions.append(b);return b;}
   if(['focus','low','high'].includes(phase))button(phase==='high'?'收下40×觀察':phase==='low'?'收下20×比較觀察':'收下清楚觀察','observe');
   if(phase==='direction-answer'||phase==='field-answer'){const quiz=document.createElement('fieldset');quiz.className='cell-answer-choices';const legend=document.createElement('legend');legend.textContent='觀察小測驗｜請選一項';quiz.append(legend);const question=document.createElement('p');question.className='cell-question';question.textContent=phase==='direction-answer'?'題目：標本往右，視野中的影像往哪裡移動？':'題目：從20×換成40×，可見的範圍如何改變？';quiz.append(question);if(phase==='direction-answer')quiz.append(button('A．同樣往右','answer','right'),button('B．反方向往左','answer','left'));else quiz.append(button('A．範圍變小','answer','smaller'),button('B．範圍變大','answer','larger'));actions.append(quiz);}
   const feedback=document.createElement('p');feedback.className='cell-quiz-feedback';feedback.setAttribute('role','status');feedback.textContent=quizFeedback||(phase.endsWith('answer')?'尚未作答。A、B是答案選項，不是構造說明。':'');actions.append(feedback);
   button('重做解剖顯微鏡任務','replay');
   for(const[action,text,fn]of[['center','標本回中央',onCenter],['low','切回總倍率20×',onLowPower]]){const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.stereoRecovery=action;b.addEventListener('click',()=>{if(!root.hidden&&root.contains(b)&&!b.disabled){fn?.();root.querySelector('h2')?.focus({preventScroll:true});}});actions.append(b);}
  }
  root.querySelector('.cell-checks').textContent=`總倍率${state.total}× · 清晰度${stereoClarity(state)}% · ${state.lamp>=25?'照明適合':'請增加上方燈光'} · ${centered()?'已置中':'尚未置中'}${!stereoObservable(state)?'；請讓中央參考記號可見並清楚。':''}${cool?' 剛完成操作，請稍候。':''}`;
  for(const b of root.querySelectorAll('[data-stereo-action]')){b.dataset.stamp=revision;b.disabled=cool||(b.dataset.stereoAction==='observe'&&!valid);}
  root.querySelector('[data-stereo-recovery=center]').disabled=centered();root.querySelector('[data-stereo-recovery=low]').disabled=state.total===20;
  if(focus)root.querySelector('h2')?.focus({preventScroll:true});if(timer)clearTimeout(timer);if(cool)timer=setTimeout(()=>render(),360);
 }
 render();return{update,reset,snapshot,destroy(){if(timer)clearTimeout(timer);}};
}
