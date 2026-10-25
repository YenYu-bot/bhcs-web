// Public microscope learning controller. Injected by build_microscope.mjs.
// Model snapshots come from the page closure, never delayed display strings.
function createMicroscopeLearning(api){
 const root=document.getElementById('micro-learning'),recordNote=document.getElementById('micro-learning-record-status');
 const session=api.state().session;let serial=0,lesson='',active=false,phase=0,assisted=false,axes={x:false,y:false},directionAnswered=false,lowId='',highId='',warning='',renderKey='',busy=false,motion=null;
 const title=['低倍找到清楚影像','親手驗證影像方向','留下洋蔥低倍證據','同一標本換高倍','用兩筆證據解釋','本次操作教學完成'];
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 const copy=s=>JSON.parse(JSON.stringify(s));
 const clear=s=>s.started&&s.inView&&s.clarity>=80&&(s.specimen!=='letter'||s.referenceMask>0);
 function metadata(){return active?{lesson,assisted}:null;}
 function eligible(row){const o=row&&row.observation;if(!o||o.version!==1||o.session!==session||o.lesson!==lesson||typeof o.id!=='string'||typeof o.sample!=='string')return null;
  if(!['objective','total','fov','clarity','stageX','stageY','coarse','fine','light'].every(k=>finite(o[k]))||o.specimen!=='onion'||o.started!==true||o.inView!==true||o.clarity<80||o.clarity>100||o.light<25||o.light>100||Math.abs(o.coarse)>5||Math.abs(o.fine)>10||typeof o.assisted!=='boolean')return null;
  if(![4,40].includes(o.objective)||o.total!==10*o.objective||Math.abs(o.fov-18/o.objective)>1e-9)return null;
  if(o.stageX!==0||o.stageY!==0)return null;return o;
 }
 function record(id){return api.records().find(r=>r.observation?.id===id);}
 function low(){const o=eligible(record(lowId));return o?.objective===4?o:null;}
 function pair(){const a=low(),b=eligible(record(highId));return !!(a&&b&&b.objective===40&&a.id!==b.id&&a.sample===b.sample&&['stageX','stageY','light','coarse'].every(k=>a[k]===b[k]));}
 function stateReady(kind){const s=api.state();if(kind==='focus'||kind==='direction')return clear(s)&&s.specimen==='letter'&&s.objective===4;
  if(kind==='low')return clear(s)&&s.specimen==='onion'&&s.objective===4&&s.stageX===0&&s.stageY===0;
  const a=low();return !!(a&&clear(s)&&s.specimen==='onion'&&s.objective===40&&s.sample===a.sample&&['stageX','stageY','light','coarse'].every(k=>s[k]===a[k]));
 }
 function mode(on){active=on;document.body.dataset.microLearning=on?'active':'free';api.mode(on);renderKey='';}
 function start(){busy=true;lesson=session+'-lesson-'+(++serial);phase=0;assisted=false;axes={x:false,y:false};directionAnswered=false;lowId='';highId='';warning='';mode(true);api.prepare('letter');busy=false;render();}
 function pause(reason='已離開完整操作教學。自由練習不會算成教學進度；紀錄保留，回來可從頭開始。'){if(!active)return;warning=reason;mode(false);render();}
 function prepareOnion(){busy=true;lowId='';highId='';phase=2;warning='';api.prepare('onion');busy=false;render();}
 function restartLow(){busy=true;lowId='';highId='';phase=2;warning='舊紀錄仍保留；請在低倍重新調焦、置中並留下新的低倍證據。';api.lowPower();busy=false;render();}
 function reconcile(){if(!active||busy)return;const s=api.state();
  if(phase===1&&(!stateReady('direction')||s.sample!==api.directionSample)){axes={x:false,y:false};directionAnswered=false;motion=null;api.directionSample=s.sample;}
  if(phase>=3&&phase<5&&!low()){phase=2;lowId='';highId='';warning='低倍證據已移除或不再有效，請重新留下低倍紀錄。';}
  if(phase===3&&low()&&s.sample!==low().sample){phase=2;lowId='';highId='';warning='標本已更換，請用新的洋蔥標本重新留下低倍證據；先前方向觀察仍保留。';}
  if(phase===4&&!pair()){phase=low()?3:2;highId='';warning='配對紀錄已移除或不相符，請補上有效證據後再比較。';}
 }
 function changed(){if(busy)return;reconcile();render();}
 function moved(before,after,origin){if(!active||phase!==1||directionAnswered)return;if(!['keyboard','button','drag','range'].includes(origin)){motion=null;return;}
  if(!clear(before)||!clear(after)||(before.referenceMask&after.referenceMask)===0||before.specimen!=='letter'||after.specimen!=='letter'||before.objective!==4||after.objective!==4||before.sample!==after.sample)return;
  if(before.sample!==api.directionSample){axes={x:false,y:false};api.directionSample=before.sample;}
  const dx=after.stageX-before.stageX,dy=after.stageY-before.stageY,threshold=54;
  if(dx===0&&dy===0)return;
  const direction=Math.abs(dx)>Math.abs(dy)*4?'x':Math.abs(dy)>Math.abs(dx)*4?'y':null;
  if(!motion||motion.last.stageX!==before.stageX||motion.last.stageY!==before.stageY||motion.start.sample!==before.sample||(origin!=='drag'&&direction&&motion.axis&&direction!==motion.axis))motion={axis:null,start:copy(before),last:copy(before)};
  if((motion.start.referenceMask&after.referenceMask)===0){motion=null;return;}
  motion.last=copy(after);const totalX=after.stageX-motion.start.stageX,totalY=after.stageY-motion.start.stageY;
  if(Math.abs(totalX)>8||Math.abs(totalY)>8)motion.axis=Math.abs(totalX)>Math.abs(totalY)?'x':'y';
  // A dominant axis allows small hand jitter, but a diagonal never counts as both observations.
  if(Math.abs(totalX)>=threshold&&Math.abs(totalY)<=Math.max(4,Math.abs(totalX)*.15)){axes.x=true;motion=null;}
  else if(Math.abs(totalY)>=threshold&&Math.abs(totalX)<=Math.max(4,Math.abs(totalY)*.15)){axes.y=true;motion=null;}
  render();
 }
 function recordAdded(row){if(!active||busy)return;const o=eligible(row);if(!o){render();return;}
  if(phase===2&&stateReady('low')&&o.objective===4){lowId=o.id;highId='';phase=3;warning='低倍證據已留下。請自己選 40× 物鏡，再只用微動調清楚。';}
  else if(phase===3&&stateReady('high')&&o.objective===40){highId=o.id;if(pair()){phase=4;warning='';}}
  changed();
 }
 function assist(){if(active){assisted=true;render();}}
 const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
 function button(label,action,enabled=true){const e=node('button',label);e.type='button';e.disabled=!enabled;e.className='btn secondary';const stamp=lesson,step=phase;e.addEventListener('click',()=>{if(e.disabled||!root.contains(e)||stamp!==lesson||step!==phase)return;const focused=document.activeElement===e;action();if(focused&&!root.contains(document.activeElement))root.querySelector('h2')?.focus({preventScroll:true});});return e;}
 function save(kind){if(!active||!stateReady(kind))return;api.save();}
 function hint(){const s=api.state();if(!active)return warning||'跟著做一次：低倍調焦 → 玻片方向 → 洋蔥低高倍 → 用紀錄解釋。也可以直接選任務卡自由練習。';
  if(phase===5&&!pair())return '你已完成本次操作教學；目前配對紀錄已清除或超出保存筆數，因此現在無法重新展示。這不會改寫先前已完成的觀察。';
  if(phase===5)return '你已用實際操作與兩筆配對紀錄完成本次教學。細胞構造辨識可繼續做下方延伸任務，不代表已熟練真實顯微鏡。';
  if(phase===4)return '比較同一份洋蔥、同一位置與照明的紀錄：4× 物鏡視野 4.5 mm；40× 物鏡視野 0.45 mm。高倍允許必要的微調焦。';
  if(phase===3){const a=low();if(a){if(s.sample!==a.sample)return '標本已更換，請重新建立低倍證據。';const names={stageX:'左右位置',stageY:'上下位置',light:'照明',coarse:'粗動位置'},changed=Object.keys(names).filter(k=>s[k]!==a[k]);if(changed.length)return '和低倍紀錄不同：'+changed.map(k=>names[k]).join('、')+'。請恢復原條件，或回低倍調焦並重存證據。';}}
  const expected=phase<=1?'letter':'onion';if(s.specimen!==expected)return '請使用'+(expected==='letter'?'字母 e 定位玻片':'洋蔥鱗葉表皮')+'。準備標本後重新觀察；舊紀錄不會刪除。';
  if(!s.started)return '按「開始研究」，再觀察目前標本。';
  if(phase===3&&s.objective!==40)return '請自己選 40× 物鏡；先保留同一位置與照明。若高倍調不清楚，回低倍調焦並重存低倍證據。';
  if(phase!==3&&s.objective!==4)return '先選 4× 物鏡，用低倍定位與觀察。';
  if(s.specimen==='letter'&&!s.referenceMask)return '請把字母 e 或十字定位點移回視野；只看到玻片範圍、沒有定位物，不能判斷移動方向。';
  if(!s.inView)return '試片已移出視野。請移回中央，再確認清晰度；空視野可記錄，但不算本次有效證據。';
  if(s.clarity<80)return phase===3?'高倍只用微動調到至少 80% 清晰；若微調範圍不足，回低倍調焦並重存低倍證據。':'把影像調到至少 80% 清晰。低倍可先粗調再微調，也可使用自動對焦示範。';
  if(phase===0)return '低倍影像已清楚。確認後，再親手觀察玻片與影像的移動方向。';
  if(phase===1)return directionAnswered?'方向判讀正確。下一步明確換成洋蔥，建立低高倍比較。':'分別水平、垂直移一格：方向鍵或按鈕一次就是一格，拖曳約操作台寬度的十分之一；每一段開始與結束都要清楚、在視野內。回中央不算方向證據。';
  if(phase===2&&(s.stageX!==0||s.stageY!==0))return '先按「試片回中央」，讓 X、Y 都回到 0，再留下低倍證據。';
  return phase===2?'洋蔥低倍已清楚且置中。留下第一筆紀錄，之後不要換標本或位置。':'高倍條件有效。留下第二筆紀錄，再用兩筆數據回答比較題。';
 }
 function render(){const s=api.state(),text=hint(),ready=active?(phase===0?stateReady('focus'):phase===1?stateReady('direction')&&axes.x&&axes.y:phase===2?stateReady('low'):phase===3?stateReady('high'):pair()):false;
  const evidenceRows=api.records().map((r,i)=>({o:eligible(r),n:i+1})).filter(e=>e.o&&(e.o.id===lowId||e.o.id===highId));
  const key=JSON.stringify([active,phase,text,ready,axes.x,axes.y,directionAnswered,assisted,warning,!!low(),pair(),evidenceRows]);if(key===renderKey)return;renderKey=key;
  root.replaceChildren();root.dataset.learningPhase=active?String(phase+1):'free';const h=node('h2',active?'余老師完整操作教學｜'+(phase+1)+'／6 '+title[phase]:'先選學習方式');h.tabIndex=-1;root.append(h,node('p',text));
  if(active&&warning&&warning!==text)root.append(node('p',warning));
  if(active&&assisted)root.append(node('p','本次使用過自動對焦示範；這是輔助觀察，不代表已完成手動調焦技能。'));
  if(active&&phase>=3&&evidenceRows.length){const cards=node('div');cards.className='micro-learning-evidence';cards.setAttribute('aria-label','本次比較採用的觀察紀錄');for(const e of evidenceRows){const card=node('article'),o=e.o;card.dataset.learningRecord=o.id;card.append(node('strong',(o.objective===4?'低倍':'高倍')+'證據｜紀錄第 '+e.n+' 筆'),node('p','物鏡 '+o.objective+'×，總倍率 '+o.total+'×；視野 '+o.fov+' mm；清晰度 '+o.clarity+'%。'),node('p',o.assisted?'本次教學使用過自動對焦示範。':'本次教學未使用自動對焦示範。'));cards.append(card)}root.append(cards);}
  const actions=node('div');actions.className='micro-learning-actions';root.append(actions);
  if(!active){actions.append(button(lesson?'從頭開始完整操作教學':'開始完整操作教學',start));root.append(node('p','自由練習仍提供倍率與視野入門；開始完整教學後，只保留這一套進度。重新整理會從頭進行教學；紀錄是否保留，請看儲存提示。'));}
  else{
   if(phase===0)actions.append(button('影像清楚，開始觀察方向',()=>{if(!stateReady('focus'))return;phase=1;axes={x:false,y:false};directionAnswered=false;api.directionSample=api.state().sample;warning='';render();},ready));
   if(phase===1){root.append(node('p','方向證據：水平 '+(axes.x?'已觀察':'待觀察')+'；垂直 '+(axes.y?'已觀察':'待觀察')));if(!directionAnswered){actions.append(button('玻片與影像方向相反',()=>{if(!(stateReady('direction')&&axes.x&&axes.y))return;directionAnswered=true;warning='';render();},ready),button('玻片與影像方向相同',()=>{warning='再看一次實際移動：把玻片往右，影像會往左。';render();},ready));}else actions.append(button('準備洋蔥比較',prepareOnion));}
   if(phase===2){if(s.specimen!=='onion')actions.append(button('重新準備洋蔥標本',prepareOnion));actions.append(button('記錄低倍證據',()=>save('low'),ready));}
   if(phase===3){actions.append(button('記錄高倍證據',()=>save('high'),ready),button('回低倍調焦並重存低倍證據',restartLow));const a=low();if(a)actions.append(button('恢復低倍紀錄的位置與照明',()=>{api.restorePositionLight(copy(a));warning='已恢復位置與照明；請確認倍率與焦點。';changed();}));}
   if(phase===4){actions.append(button('高倍影像較大，看到的範圍較小',()=>{if(!pair())return;phase=5;warning='';render();},ready),button('高倍看到的範圍較大',()=>{warning='請比較 4.5 mm 與 0.45 mm，再看兩筆紀錄的倍率。';render();},ready));}
   if(phase===5)root.append(node('p','延伸：切換口腔與水蘊草任務，搭配標本對照觀察構造。切換後會離開本次教學，紀錄仍保留。'));
   actions.append(button('離開教學，改自由練習',()=>pause()));
  }
  if(recordNote){recordNote.hidden=!active;recordNote.textContent=active?(phase===5&&!pair()?'本次教學已完成；目前配對紀錄已清除或超出保存筆數。':pair()?'完整教學：紀錄第 '+evidenceRows.map(e=>e.n).join('、')+' 筆洋蔥低／高倍證據配對有效。':low()?'完整教學：已有有效低倍證據，還需要同一標本的高倍紀錄。':'完整教學：任意兩筆不等於有效配對；舊紀錄、空視野與失焦紀錄仍可保留，但不計入本次配對。'):'';}
 }
 render();return{changed,moved,beginMove(){motion=null;},recordAdded,assist,pause,metadata,isActive:()=>active,start};
}
