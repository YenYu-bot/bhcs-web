// A bounded, in-memory letter-e course. It observes the existing model; it never changes it.
import {illuminationReady,sameIllumination,illuminationSettings} from './illumination.js?v=eab0f0e4c58b';
import {clarity,fov,featureScreen} from './model.js';
const copy=s=>({...s}),finger=s=>JSON.stringify([s.specimen,s.objective,s.coarse,s.fine,s.light,s.stageX,s.stageY,illuminationSettings(s)]);
const sameSetup=(a,b)=>sameIllumination(a,b)&&a.specimen===b.specimen&&a.coarse===b.coarse&&a.light===b.light&&a.stageX===b.stageX&&a.stageY===b.stageY;
const sameDirectionSetup=(a,b)=>sameIllumination(a,b)&&a.specimen===b.specimen&&a.objective===b.objective&&a.coarse===b.coarse&&a.fine===b.fine&&a.light===b.light;
export function referenceVisible(s){const p=featureScreen(0,0,s);return s.specimen==='letter'&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.hypot(p.x-300,p.y-300)<=230;}
const clear=s=>illuminationReady(s)&&clarity(s)>=80&&referenceVisible(s),low=s=>s.objective===4&&clear(s);
export function createCourse(initialState,clock=()=>performance.now()){
 let state=copy(initialState),revision=0,progress=0,mode='guided',phase='focus',baseline=null,lowEvidence=null,answerEvidence=null,message='',lastAction=-Infinity;
 const bump=()=>revision++,clearEvidence=()=>{baseline=null;lowEvidence=null;answerEvidence=null;};
 function reset(s=state){state=copy(s);progress=0;mode='guided';phase='focus';message='';clearEvidence();bump();}
 function phaseForTask(){return progress===0?'focus':progress===1?'direction-start':progress===2?'compare-low':'done';}
 function update(next,reason='conditions'){
  const changed=finger(next)!==finger(state);state=copy(next);if(reason==='reset'){reset(next);return;}
  if(!changed&&reason!=='center')return;bump();if(mode!=='guided'||progress===3)return;
  if(progress===1){
   if(reason==='center'||(baseline&&!sameDirectionSetup(baseline,state))){baseline=null;answerEvidence=null;phase='direction-start';message='起點已失效；請在低倍調清楚，再收下新的起點。';}
   else if(answerEvidence){answerEvidence=null;phase='direction-move';message='畫面已改變，請重新收下移動後的觀察。';}
  }
  if(progress===2){
   if(reason==='center'||(lowEvidence&&!sameSetup(lowEvidence,state))){lowEvidence=null;answerEvidence=null;phase='compare-low';message='比較條件已改變；請回4×，重新收下低倍觀察。';}
   else if(answerEvidence){answerEvidence=null;phase='compare-high';message='高倍畫面已改變；請重新收下高倍觀察。';}
  }
 }
 function directionReady(){if(!baseline||!low(state)||!sameDirectionSetup(baseline,state))return false;const dx=state.stageX-baseline.stageX,dy=state.stageY-baseline.stageY;return Math.abs(dx)>=12&&Math.abs(dy)<=2&&referenceVisible(baseline);}
 function ready(){return phase==='focus'||phase==='direction-start'?low(state):phase==='direction-move'?directionReady():phase==='compare-low'?low(state)&&state.stageX===0&&state.stageY===0:phase==='compare-high'?!!lowEvidence&&state.objective===40&&clear(state)&&sameSetup(lowEvidence,state):false;}
 function accept(action,value,stamp){
  if(stamp!==revision||clock()-lastAction<350)return false;
  if(action==='free'){mode='free';clearEvidence();message='';bump();lastAction=clock();return true;}
  if(action==='resume'){mode='guided';phase=phaseForTask();clearEvidence();message='';bump();lastAction=clock();return true;}
  if(action==='replay'){reset();lastAction=clock();return true;}
  if(mode!=='guided')return false;
  if(action==='task'){const index=Number(value);if(!Number.isInteger(index)||index<0||index>Math.min(progress,2))return false;progress=index;phase=phaseForTask();clearEvidence();message='';bump();lastAction=clock();return true;}
  if(action==='observe'){
   if(!ready())return false;lastAction=clock();message='';
   if(phase==='focus'){progress=1;phase='direction-start';}
   else if(phase==='direction-start'){baseline=copy(state);phase='direction-move';}
   else if(phase==='direction-move'){const a=featureScreen(0,0,baseline),b=featureScreen(0,0,state);answerEvidence={kind:'direction',state:copy(state),slideDirection:state.stageX>baseline.stageX?'right':'left',imageDirection:b.x<a.x?'left':'right',screenDelta:b.x-a.x};phase='direction-answer';}
   else if(phase==='compare-low'){lowEvidence=copy(state);phase='compare-high';}
   else if(phase==='compare-high'){answerEvidence={kind:'comparison',state:copy(state),low:copy(lowEvidence),lowTotal:lowEvidence.objective*10,highTotal:state.objective*10,lowField:fov(lowEvidence.objective),highField:fov(state.objective)};phase='compare-answer';}
   bump();return true;
  }
  if(action==='answer'&&answerEvidence&&finger(answerEvidence.state)===finger(state)){
   const correct=phase==='direction-answer'?value===answerEvidence.imageDirection:phase==='compare-answer'?value==='larger-smaller':false;
   lastAction=clock();bump();if(!correct){message='再看一次兩次觀察與讀數，想想哪個方向或範圍改變了。';return true;}
   progress++;clearEvidence();phase=phaseForTask();message='';return true;
  }
  return false;
 }
 function snapshot(){return {revision,progress,mode,phase,message,ready:ready(),cooldown:clock()-lastAction<350,baseline:baseline&&copy(baseline),lowEvidence:lowEvidence&&copy(lowEvidence),answerEvidence:answerEvidence&&JSON.parse(JSON.stringify(answerEvidence)),state:copy(state)};}
 return {update,accept,snapshot,reset};
}
