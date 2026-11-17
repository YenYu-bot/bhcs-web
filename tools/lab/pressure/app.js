(() => {
  'use strict';
  const $=id=>document.getElementById(id), KEY='bhcs.lab.pressure.bench.v1', ATM=101.3;
  const steps=[
    {title:'探頭往下，壓力怎麼變？',nav:'測水壓',mode:'水槽開口 · 從水面量深度',bench:'水槽與探頭',guide:'從水面 0 m 開始，再移到 1 m、2 m，比較相對壓力。',cta:'記下水壓比較，換看氣壓'},
    {title:'把同一團空氣壓小',nav:'測氣壓',mode:'針筒封閉 · 氣量與溫度不變',bench:'密閉針筒',guide:'由 1.00 L 壓到 0.50 L，看壓力與粒子之間的距離。',cta:'記下氣壓比較，開始挑戰'},
    {title:'用剛才的讀值解釋',nav:'挑戰',guide:'可以回看氣壓計、水槽和針筒的讀值，再作答。'},
    {title:'用水銀柱看見大氣壓',nav:'氣壓計',mode:'管頂接近真空 · 柱高從槽面量',bench:'托里切利氣壓計',guide:'把外界大氣壓由 101.3 降到 80 kPa，看槽面上方的水銀柱變多高。'}
  ];
  const active=[3,0,1,2], questionOrder=[3,0,1,2];
  const questions=[
    ['同一槽水裡，探頭從 1 m 下移到 2 m，相對壓力怎麼變？',['維持 9.8 kPa','從 9.8 增至 19.6 kPa','壓力減半'],1,'深度加倍，由上方水柱造成的壓力也加倍。'],
    ['探頭在水面，相對壓力是 0 kPa，為什麼絕對壓力不是 0？',['水面仍受大氣壓','探頭在水面故障','水面沒有重力'],0,'相對壓力把大氣壓當成零點；水面絕對壓力仍為 101.3 kPa。'],
    ['密閉針筒由 1.00 L 壓到 0.50 L，氣量與溫度不變，絕對壓力怎麼變？',['不變，因氣體沒有漏掉','減半，因體積變小','加倍，從 101.3 增到 202.6 kPa'],2,'同樣多的氣體被壓在較小空間；在這個模型中，絕對壓力乘體積保持不變。'],
    ['外界大氣壓從 101.3 降到 80 kPa，水銀柱為什麼跟著變短？',['管頂的真空把水銀往上吸得更強','空氣壓槽面的作用變小，較短的水銀柱就能平衡','水銀密度隨氣壓變小而變大'],1,'管頂接近真空；托住水銀柱的是外界空氣對槽面的壓力。']
  ];
  const metric=(label,value)=>'<div class="metric"><span>'+label+'</span><strong>'+value+'</strong></div>';
  const kpa=n=>n.toFixed(1)+' kPa', metres=n=>Number(n.toFixed(1))+' m', litres=n=>n.toFixed(2)+' L';
  const depthList=[0,1,2], volumeList=[1,.75,.5], airList=[ATM,80];
  const water=n=>({depth:n,relative:9.8*n,absolute:ATM+9.8*n});
  const gas=n=>({volume:n,absolute:ATM/n});
  const torricelli=n=>({atmospheric:n,height:n*100000/(13600*9.8)});
  const limit=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
  let idx=3, depth=0,volume=1,air=ATM,observed=new Set(),records={},answers={},lastRaw=null,storageOK=true,drag=null;
  const warn=message=>{const x=$('storage-warning');x.hidden=false;x.textContent=message;};
  try{
    lastRaw=localStorage.getItem(KEY);
    const data=JSON.parse(lastRaw||'null');
    if(data){
      for(const i of [0,1,3]){
        const row=data.records?.[i], lo=i===0?0:i===1?.5:60, hi=i===0?2:i===1?1:110, base=i===0?0:i===1?1:ATM;
        if(Array.isArray(row)&&row.includes(base)&&row.some(n=>n!==base&&limit(n,lo,hi)))records[i]=[...new Set(row.filter(n=>limit(n,lo,hi)))].sort((a,b)=>i===0?a-b:b-a);
      }
      for(const i of [0,1,2,3])if(Number.isInteger(data.answers?.[i])&&limit(data.answers[i],0,2))answers[i]=data.answers[i];
    }
  }catch{storageOK=false;warn('目前無法讀取紀錄；仍可操作，本頁不會覆蓋原有紀錄。');}
  function save(){
    if(!storageOK)return;
    try{
      if(localStorage.getItem(KEY)!==lastRaw){
        storageOK=false;warn('另一個分頁已更新紀錄。本頁不會覆蓋；重新整理可讀取最新紀錄。');return;
      }
      const next=JSON.stringify({records,answers});localStorage.setItem(KEY,next);lastRaw=next;
    }catch{storageOK=false;warn('瀏覽器未能儲存紀錄；本頁的新紀錄可能在重新整理後消失。');}
  }
  const ready=()=>Boolean(records[idx])||(idx===0?[...observed].some(n=>n>0):idx===1?[...observed].some(n=>n<1):idx===3?[...observed].some(n=>n!==ATM):false);
  const pending=()=>active.find(i=>i!==2&&!records[i])??2;
  function table(i,values){
    if(i===3)return '<table class="readings-table pressure-table"><thead><tr><th scope="col">外界大氣壓</th><th scope="col">水銀柱高</th></tr></thead><tbody>'+values.map(n=>'<tr><th scope="row">'+kpa(n)+'</th><td>'+torricelli(n).height.toFixed(1)+' cm</td></tr>').join('')+'</tbody></table>';
    return '<table class="readings-table pressure-table"><thead><tr>'+(i===0?'<th scope="col">深度</th><th scope="col">相對壓力</th><th scope="col">絕對壓力</th>':'<th scope="col">體積</th><th scope="col">絕對壓力</th>')+'</tr></thead><tbody>'+
      values.map(n=>i===0?'<tr><th scope="row">'+metres(n)+'</th><td>'+kpa(water(n).relative)+'</td><td>'+kpa(water(n).absolute)+'</td></tr>':
      '<tr><th scope="row">'+litres(n)+'</th><td>'+kpa(gas(n).absolute)+'</td></tr>').join('')+'</tbody></table>';
  }
  function comparisons(){
    const base=idx===0?0:1, current=idx===0?depth:volume;
    const key=idx===0?depthList:volumeList;
    const values=[...new Set([base,...(records[idx]||[]),...key.filter(x=>observed.has(x)),current])]
      .sort((a,b)=>idx===0?a-b:b-a);
    $('comparison').innerHTML=table(idx,values);
    $('evidence-text').textContent=idx===0?'水面的相對壓力是 0，但絕對壓力仍是大氣壓。水越深，上方水柱越高。':
      '氣體沒有漏掉。體積越小，同樣多的粒子擠在較小空間，撞擊筒壁更頻繁。';
  }
  function paintTorricelli(){
    const t=torricelli(air), d=window.PressureDiagram;
    $('pressure-diagram').innerHTML=d?.torricelli?d.torricelli(t):'氣壓計圖未載入，請重新整理。';
    $('air-value').value=kpa(air);$('air-pressure').setAttribute('aria-valuetext',$('air-value').value);
    const display=metric('外界大氣壓',kpa(air))+metric('水銀柱高 · 從槽面量',t.height.toFixed(1)+' cm');
    if($('readings').innerHTML!==display)$('readings').innerHTML=display;
    document.querySelectorAll('[data-air]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.air)===air)));
    $('act').disabled=!ready();
    $('torricelli-result').hidden=!ready();
    $('torricelli-result').textContent='空氣壓的是槽面，水銀柱上方接近真空。這也說明了開口水槽的水面仍受大氣壓。';
    $('evidence-text').textContent='比較同一支氣壓計：外界空氣壓槽面，管頂接近真空。';
    $('comparison').innerHTML=table(3,[...new Set([ATM,...(records[3]||[]),...airList.filter(x=>observed.has(x)),air])].sort((a,b)=>b-a));
  }
  function paint(){
    if(idx===3){paintTorricelli();return;}
    const isWater=idx===0, c=isWater?water(depth):gas(volume);
    const diagram=window.PressureDiagram;
    if(diagram)$('pressure-diagram').innerHTML=isWater?diagram.water(c):diagram.gas(c);
    else $('pressure-diagram').textContent='操作圖未載入，請重新整理。';
    $('depth-value').value=depth===0?'水面 0 m':metres(depth);
    $('volume-value').value=litres(volume);
    $('depth').setAttribute('aria-valuetext',$('depth-value').value);
    $('volume').setAttribute('aria-valuetext',$('volume-value').value);
    const display=isWater?metric('相對壓力 · 以水面為零',kpa(c.relative))+metric('絕對壓力 · 含大氣壓',kpa(c.absolute)):
      metric('氣體體積',litres(c.volume))+metric('絕對壓力',kpa(c.absolute));
    if($('readings').innerHTML!==display)$('readings').innerHTML=display;
    document.querySelectorAll('[data-depth]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.depth)===depth)));
    document.querySelectorAll('[data-volume]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.volume)===volume)));
    $('act').disabled=!ready();
    comparisons();
  }
  function notebook(){
    const keys=[3,0,1].filter(i=>records[i]);
    $('notebook').innerHTML=keys.length?keys.map(i=>'<section class="pressure-notebook-item"><h3>'+(i===0?'水槽：深度和水壓':i===1?'針筒：體積和氣壓':'氣壓計：大氣壓與柱高')+'</h3>'+table(i,records[i])+'</section>').join(''):
      '<p class="explain">完成一項比較，手札就會留下你的讀值。</p>';
  }
  function mark(){
    [...$('questions').children].forEach((f,order)=>{
      const i=questionOrder[order];
      f.querySelectorAll('button').forEach((b,n)=>b.setAttribute('aria-pressed',String(answers[i]===n)));
      const correct=answers[i]===questions[i][2], p=f.querySelector('p');
      p.dataset.correct=String(correct);
      p.textContent=answers[i]===undefined?'':correct?'答對了！'+questions[i][3]:'再回頭比一比兩次的讀值。';
    });
    $('done').textContent=questions.every((q,i)=>answers[i]===q[2])?'四題全對，完成水壓與氣壓！':'';
  }
  function quiz(){
    if(!$('questions').hasChildNodes())questionOrder.forEach((i,order)=>{
      const [q,choices]=questions[i], f=document.createElement('fieldset'), l=document.createElement('legend'), p=document.createElement('p');
      l.textContent=(order+1)+'. '+q;f.append(l);
      choices.forEach((s,n)=>{
        const b=document.createElement('button');b.type='button';b.textContent=s;
        b.addEventListener('click',()=>{answers[i]=n;save();mark();});f.append(b);
      });
      p.className='question-feedback';p.setAttribute('aria-live','polite');f.append(p);$('questions').append(f);
    });
    mark();
  }
  function enter(i,focus=false){
    stopDrag();idx=i;depth=0;volume=1;air=ATM;observed=new Set([i===0?0:i===1?1:ATM]);
    $('depth').value='0';$('volume').value='1';$('air-pressure').value=String(ATM);
    const s=steps[i];$('progress').textContent=i===2?'證據挑戰':'觀察 '+(active.indexOf(i)+1)+'／3';
    $('mission-title').textContent=s.title;$('guide').textContent=s.guide;
    $('lab').hidden=i===2;$('challenge').hidden=i!==2;
    $('water-tools').hidden=i!==0;$('gas-tools').hidden=i!==1;$('air-tools').hidden=i!==3;
    $('torricelli-why').hidden=i!==3;$('torricelli-why').open=false;$('torricelli-result').hidden=true;
    $('steps').replaceChildren(...active.map((j,order)=>{
      const b=document.createElement('button');b.type='button';b.textContent=steps[j].nav;
      if(i===j)b.setAttribute('aria-current','step');
      b.disabled=!active.slice(0,order).every(n=>records[n]);
      b.addEventListener('click',()=>enter(j,true));return b;
    }));
    notebook();
    if(i===2)quiz();else{
      $('bench-label').textContent=s.bench;$('mode').textContent=s.mode;$('act').textContent=i===3?(records[0]?(records[1]?'記下氣壓計比較，回到挑戰':'記下氣壓計比較，換看針筒'):'記下氣壓計比較，換看水壓'):s.cta;paint();
    }
    if(focus)$(i===2?'quiz-title':'mission-title').focus();
  }
  function move(n){
    if(!Number.isFinite(n)||idx>1)return;
    const next=idx===0?Math.max(0,Math.min(2,Math.round(n*10)/10)):
      Math.max(.5,Math.min(1,Math.round(n*20)/20));
    if(idx===0){if(next===depth)return;depth=next;$('depth').value=String(next);}
    else{if(next===volume)return;volume=next;$('volume').value=String(next);}
    observed.add(next);paint();
  }
  const host=$('pressure-diagram');
  function locationInDiagram(e){
    const svg=host.querySelector('svg'), matrix=svg?.getScreenCTM(), d=window.PressureDiagram;
    if(!matrix||!d)return null;
    const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());
    return idx===0?d.depthAt(svg,p.y):d.volumeAt(svg,p.x);
  }
  function stopDrag(e){
    if(!drag||e&&e.pointerId!==drag.id)return;
    const id=drag.id;drag=null;if(host.hasPointerCapture(id))host.releasePointerCapture(id);host.classList.remove('is-dragging');
  }
  host.addEventListener('pointerdown',e=>{
    const hook=idx===0?'[data-pressure-probe]':'[data-pressure-piston]';
    if(idx>1||drag||e.button!==0||!e.target.closest(hook))return;
    const at=locationInDiagram(e);if(!Number.isFinite(at))return;
    e.preventDefault();drag={id:e.pointerId,offset:(idx===0?depth:volume)-at};
    host.setPointerCapture(e.pointerId);host.classList.add('is-dragging');
  });
  host.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const at=locationInDiagram(e);if(Number.isFinite(at))move(at+drag.offset);
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])host.addEventListener(type,stopDrag);
  function moveAir(n){
    if(idx!==3||!Number.isFinite(n))return;
    const next=Math.max(60,Math.min(110,Math.round(n*10)/10));
    if(next===air)return;
    air=next;observed.add(air);$('air-pressure').value=String(air);paintTorricelli();
  }
  $('air-pressure').addEventListener('input',e=>moveAir(Number(e.target.value)));
  document.querySelectorAll('[data-air]').forEach(b=>b.addEventListener('click',()=>moveAir(Number(b.dataset.air))));
  $('depth').addEventListener('input',e=>{if(idx===0)move(Number(e.target.value));});
  $('volume').addEventListener('input',e=>{if(idx===1)move(Number(e.target.value));});
  document.querySelectorAll('[data-depth]').forEach(b=>b.addEventListener('click',()=>{if(idx===0)move(Number(b.dataset.depth));}));
  document.querySelectorAll('[data-volume]').forEach(b=>b.addEventListener('click',()=>{if(idx===1)move(Number(b.dataset.volume));}));
  $('act').addEventListener('click',()=>{
    if(idx===2||!ready())return;
    if(idx===3){
      const readings=[...new Set([ATM,...(records[3]||[]),...airList.filter(x=>observed.has(x)),air])];
      if(readings.length<2)readings.push([...observed].find(n=>n!==ATM));
      records[3]=readings.sort((a,b)=>b-a);save();
      enter(!records[0]?0:!records[1]?1:2,true);return;
    }
    const key=idx===0?depthList:volumeList;
    const current=idx===0?depth:volume;
    const values=[...new Set([...(records[idx]||[]),...key.filter(n=>observed.has(n)),current])];
    if(values.length<2){
      const visited=[...observed];
      const extra=idx===0?Math.max(...visited):Math.min(...visited);
      values.push(extra);
    }
    records[idx]=values.sort((a,b)=>idx===0?a-b:b-a);save();enter(idx+1,true);
  });
  $('clear').addEventListener('click',()=>{const d=$('clear-dialog');d.returnValue='';d.showModal();});
  $('clear-dialog').addEventListener('close',()=>{if($('clear-dialog').returnValue!=='clear')return;records={};answers={};save();enter(3,true);});
  enter(pending());
})();
