// B4-B student challenge interface. Independent from B1 phases; B4-C owns persistence.
import {createCircuitBench} from './render.js';
import {bindCircuitInput} from './input.js';
import {MAX_WIRES} from './model.js';
import {challengeOneStatus,CHALLENGE_ONE_OPTIONS,challengeBase,replayChallenge,challengeReadings,challengeTwoPosition,challengeThreeEvidence,CHALLENGE_TWO_POSITIONS} from './challenges.js';
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
const key=(a,b)=>[a,b].sort().join('|');
export function mountChallenges(root,{onComplete=()=>{},onChange=()=>{}}={}){
  let stage=1,actions=[],records=[],choice=null,done=false;
  const heading=el('h2','挑戰 1：電壓表接錯了'),prompt=el('p'),feedback=el('p');
  feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
  const options=el('fieldset'),controls=el('div'),benchHost=el('div'),next=el('button','確認答案');
  next.type='button';root.append(heading,prompt,options,benchHost,feedback,controls,next);
  const bench=createCircuitBench(benchHost);let active=false;
  const raw=()=>replayChallenge(stage,actions);
  const add=a=>{const candidate=replayChallenge(stage,[...actions,a]);if(!candidate.valid){feedback.textContent='這次接線不能使用，請檢查端點或導線。';return;}actions.push(a);paint();onChange();};
  bindCircuitInput({
    root:bench.element,
    getLocked:()=>!active||stage===1||done,
    getSwitchClosed:()=>raw().state?.switchClosed===true,
    canConnect:(a,b)=>{const st=raw().state;return !!st&&st.wires.length<MAX_WIRES&&!st.wires.some(w=>key(w.from,w.to)===key(a,b));},
    canDisconnect:(a,b)=>!!raw().state?.wires.some(w=>key(w.from,w.to)===key(a,b)),
    canToggleSwitch:()=>active&&stage!==1&&!done,
    onConnect:(from,to)=>add({type:'CONNECT',from,to}),
    onDisconnect:(from,to)=>add({type:'DISCONNECT',from,to}),
    onToggleSwitch:value=>add({type:'TOGGLE_SWITCH',value}),
  });
  const meter=(data,unit)=>({state:data.state,text:data.reading===null?'—':data.reading.value.toFixed(1)+' '+unit});
  function paint(){
    if(stage===1){benchHost.hidden=true;return}
    benchHost.hidden=false;
    const x=challengeReadings(stage,actions),s=x.state??challengeBase(stage),r=x.result;
    if(!r)return;
    bench.update({locked:!active||done,switchClosed:s.switchClosed,wires:s.wires,status:r.status,
      lamps:{L1:{brightness:r.lamps.L1.brightness,bypassed:r.lamps.L1.bypassed},L2:{brightness:r.lamps.L2.brightness,bypassed:r.lamps.L2.bypassed}},
      ammeter:meter(r.ammeter,'A'),voltmeter:meter(r.voltmeter,'V')});
  }
  function draw(){
    heading.textContent=stage===1?'挑戰 1：電壓表接錯了':stage===2?'挑戰 2：電流被燈泡用掉了嗎？':'挑戰 3：拿掉一條路';
    feedback.textContent='';controls.replaceChildren();options.replaceChildren();
    options.hidden=stage!==1;
    if(stage===1){
      prompt.textContent='小明把電壓表接在原本通往燈泡的導線缺口，燈不亮、電流表為 0 A。應該如何修正？';
      for(const [value,label]of Object.entries(CHALLENGE_ONE_OPTIONS)){
        const l=el('label'),input=el('input');input.type='radio';input.name='cgg-challenge-one';input.value=value;
        input.checked=choice===value;input.addEventListener('change',()=>{choice=value;onChange();});l.append(input,document.createTextNode(label));options.append(l);
      }next.textContent='確認答案';
    }else if(stage===2){
      const idx=records.length;
      prompt.textContent=idx<3?'把電流表親自接在「'+({'before-L1':'燈泡 1 前','between-lamps':'兩顆燈泡中間','after-L2':'燈泡 2 後'}[CHALLENGE_TWO_POSITIONS[idx]])+'」，閉合開關，記錄讀值。':'三次量測完成：前、中、後都是 0.5 A。同一條路的電流有被燈泡用掉嗎？';
      next.textContent=idx===3?'完成挑戰 2':'記錄這次量測';
      const list=el('ol');for(const rec of records)list.append(el('li',rec.position+'：'+challengeTwoPosition(rec.actions).current.toFixed(1)+' A'));controls.append(list);
      // Reset only learner deltas on each next measuring position.
    }else{
      prompt.textContent='從起始的兩條燈泡通路中親自拆除 L2 的必要導線，閉合開關，量測 L1 與電池總電流。';
      next.textContent='記錄挑戰 3';
    }
    paint();
  }
  next.addEventListener('click',()=>{
    if(stage===1){
      if(!challengeOneStatus(choice).correct){feedback.textContent='請重新想想電壓表應如何接在燈泡兩端。';return}
      stage=2;actions=[];records=[];draw();onChange();return;
    }
    if(stage===2){
      if(records.length===3){stage=3;actions=[];draw();onChange();return}
      const result=challengeTwoPosition(actions),wanted=CHALLENGE_TWO_POSITIONS[records.length];
      if(!result||result.position!==wanted){feedback.textContent='請確認電流表位於指定位置、正負極方向正確，而且開關已閉合。';return}
      records.push({position:result.position,actions:structuredClone(actions)});
      actions=[];draw();onChange();return;
    }
    const evidence=challengeThreeEvidence(actions);
    if(!evidence){feedback.textContent='請實際拆掉 L2 通路的導線，確認 L1 和總電流皆為 1.0 A。';return}
    done=true;onChange();feedback.textContent='已完成三項挑戰：燈泡轉換電能，並不消耗同一路徑中的電流。';next.hidden=true;paint();
    onComplete({challenge2Records:records.map(r=>({...r,actions:structuredClone(r.actions)})),challenge3:{actions:structuredClone(actions),evidence}});
  });
  return {show(){active=true;root.hidden=false;next.hidden=false;draw()},hide(){active=false;root.hidden=true;},snapshot(){return{stage,actions:structuredClone(actions),records:structuredClone(records),choice,done}},restore(value){if(!value)return;stage=value.stage;actions=structuredClone(value.actions);records=structuredClone(value.records);choice=value.choice;done=value.done;if(!root.hidden)draw();}};
}
