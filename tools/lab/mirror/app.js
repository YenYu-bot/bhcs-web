(() => {
  'use strict';
  const KEY='bhcs.lab.mirror.view.v1', $=id=>document.getElementById(id);
  const steps=[
    {name:'平面鏡：移動箭頭',kind:'plane',label:'平面鏡',u:30,f:0,guide:'箭頭一開始在 30 cm。把它移到 20 cm，看鏡面另一側的像跟著怎麼動。',cta:'換成凸面鏡'},
    null, // 1 remains reserved as the legacy second plane-mirror record.
    {name:'換成凸面鏡',kind:'convex-mirror',label:'凸面鏡',u:30,f:-10,guide:'箭頭仍離鏡面 30 cm，只換鏡子。觀察鏡中的箭頭有沒有變小、倒過來。',coach:'與平面鏡相比，哪個箭頭比較小？側面圖上的像在鏡子的哪一邊？',cta:'記錄，換成凹面鏡'},
    {name:'凹面鏡：物體在焦點外',kind:'concave-mirror',label:'凹面鏡',u:30,f:10,guide:'箭頭離鏡面 30 cm，在焦點 F 外。把光屏移到圖中標出的會合位置。',cta:'把箭頭移到 6 cm'},
    {name:'凹面鏡：比較五個物距',kind:'concave-mirror',label:'凹面鏡',u:6,f:10,guide:'箭頭從 30 cm 移到 6 cm，現在比焦點更靠近鏡面。沿虛線找交會點。',coach:'比較 30 cm 和 6 cm：像都離鏡面 15 cm，卻分別落在鏡前和鏡後。',cta:'收下 30／6 cm 的比較'},
    {name:'證據挑戰',guide:'回看自己的手札，比較平面鏡與凹面鏡。'}
  ];
  const active=[0,2,3,4,5], concaveDistances=[30,20,15,10,6];
  const quiz=[
    ['物體離平面鏡 20 cm，像在什麼位置？',['鏡前 20 cm','鏡後 20 cm','鏡後 30 cm'],1,'物體與像到平面鏡的距離相等。'],
    ['用同一面凹面鏡，哪一個情況可以用光屏接到像？',['物距 30 cm，像倒立且在鏡前','物距 6 cm，像正立且在鏡後','兩種情況的像都在鏡後，都能接到'],0,'物距大於焦距時，實際反射光在鏡前會聚，這裡能接到倒立的實像。']
  ];
  let idx=0,u=30,screen=10,screenPlaced=true,foundOnce=false,tries=new Set(),records=new Set(),answers={},lastRaw=null,storageUsable=true;
  const int=(n,lo,hi)=>Number.isInteger(n)&&n>=lo&&n<=hi;
  const warn=message=>{const el=$('storage-warning');el.hidden=false;el.textContent=message;};
  try {
    lastRaw=localStorage.getItem(KEY);
    const data=JSON.parse(lastRaw||'null');
    if(data){
      records=new Set(Array.isArray(data.records)?data.records.filter(i=>int(i,0,4)):[]);
      for(const i of [0,1])if(int(data.answers?.[i],0,2))answers[i]=data.answers[i];
    }
  }catch{storageUsable=false;warn('目前無法讀取紀錄；仍可操作，本頁不會覆蓋原有紀錄。');}
  function save(){
    if(!storageUsable)return;
    try{
      if(localStorage.getItem(KEY)!==lastRaw){storageUsable=false;warn('另一個分頁已更新紀錄。本頁不會覆蓋；重新整理可讀取最新紀錄。');return;}
      const next=JSON.stringify({records:[...records],answers});localStorage.setItem(KEY,next);lastRaw=next;
    }catch{storageUsable=false;warn('瀏覽器未能儲存紀錄；本頁的新紀錄可能在重新整理後消失。');}
  }
  const cm=n=>Number(n.toFixed(2));
  function optics(i,d=steps[i].u){
    const s=steps[i],v=s.f===d?Infinity:s.f?1/(1/s.f-1/d):-d,m=Number.isFinite(v)?-v/d:null;
    return {...s,u:d,v,m};
  }
  const side=v=>v>0?'鏡前':'鏡後';
  const size=m=>Math.abs(Math.abs(m)-1)<1e-8?'等大':Math.abs(m)>1?'放大':'縮小';
  const direction=m=>m>0?'正立':'倒立';
  const img=c=>side(c.v)+' '+cm(Math.abs(c.v))+' cm';
  const imageType=c=>c.v>0?'實像':'虛像';
  const row=c=>'<li><strong>'+c.label+' · 物距 '+c.u+' cm</strong><span>'+img(c)+'，'+direction(c.m)+'・'+size(c.m)+'・'+imageType(c)+'</span></li>';
  const allowsScreen=c=>idx===3||(idx===4&&c.u>=c.f);
  const focused=c=>allowsScreen(c)&&screenPlaced&&Number.isFinite(c.v)&&c.v>0&&Math.abs(screen-c.v)<=.5000001;
  const completed=i=>i===0?records.has(0)&&records.has(1):records.has(i);
  const ready=()=>completed(idx)||(idx===0?tries.has(20):idx===3?foundOnce:true);
  function paintPlane(){
    $('plane-diagram').innerHTML=window.PlaneMirror?window.PlaneMirror.draw({distance:u,showRays:$('plane-why').open}):'觀察圖未載入，請重新整理。';
    $('plane-distance').value=String(u);
    $('plane-distance').setAttribute('aria-valuetext',u+' 公分');
    $('object-value').value=u+' cm';
    $('plane-status').textContent='物體：鏡前 '+u+' cm。像：鏡後 '+u+' cm。像正立、與物體等大。';
    document.querySelectorAll('[data-distance]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.distance)===u)));
    $('plane-check').hidden=!ready();
    $('coach').textContent=ready()?'從 30 cm 移到 20 cm，物體與像到鏡面的距離仍相等。':'試著移到 20 cm，比較兩條距離標記。';
    $('act').textContent=steps[idx].cta;
    $('act').disabled=!ready();
  }
  function compare(c){
    const wrap=(heading,rows)=>'<div class="comparison"><strong>'+heading+'</strong><ul class="comparison-list">'+rows.join('')+'</ul></div>';
    $('compare').innerHTML=idx===2?wrap('只換鏡子，物距都是 30 cm',[row(optics(0)),row(c)]):
      idx===3&&foundOnce?wrap('只換鏡子，物距都是 30 cm',[row(optics(2)),row(c)]):
      idx===4?wrap('同一面凹面鏡，物體移近了',[row(optics(3)),row(optics(4))]):'';
  }
  function update(){
    if(idx===5)return;
    const c=optics(idx,u), found=focused(c);
    if(found&&idx===3)foundOnce=true;
    $('mode').textContent=c.label+' · 物距 '+c.u+' cm';
    const plane=idx===0;
    $('plane-panel').hidden=!plane;
    $('visual-wrap').hidden=plane;
    $('evidence').hidden=plane;
    $('journal').hidden=plane;
    $('lab').classList.toggle('plane-mode',plane);
    const concave=idx===3||idx===4, explore=idx===4, near=explore&&c.u<c.f, atFocus=explore&&c.u===c.f;
    const showScreen=allowsScreen(c);
    $('lab').classList.toggle('concave-mode',concave);
    $('concave-transition').hidden=!concave;
    $('concave-transition').textContent=near?'同一面鏡：物距 30 → 6 cm｜F 仍在鏡前 10 cm':'同一面鏡：物距 '+c.u+' cm｜F 在鏡前 10 cm';
    $('concave-presets').hidden=!explore;
    if(explore){
      $('guide').textContent=near?steps[4].guide:'換一個物距，看反射光怎麼變。';
      document.querySelectorAll('[data-concave]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.concave)===c.u)));
    }
    if(plane){$('explain-rays').hidden=true;paintPlane();return;}
    $('ray-panel').hidden=idx===0;
    $('mirror-panel').hidden=concave;
    $('side-hint').textContent=concave?(near?'實線向外散開，虛線往鏡後延長':atFocus?'反射光互相平行':'沿實線找光的交會點'):'比較物體、鏡面和像的位置';
    $('explain-rays').hidden=idx===0;
    $('screen-tool').hidden=!showScreen;
    $('screen-toggle').hidden=!explore||!showScreen;
    $('screen-toggle').textContent=screenPlaced?'暫時移開光屏':'放回光屏';
    $('screen').disabled=!screenPlaced;
    $('screen-help').textContent=atFocus?'反射光平行，移動光屏也接不到清楚的像。':screenPlaced?'沿實線找交會點，再把光屏移過去。也可用方向鍵微調。':'光屏已移開，現在可以看完整的反射光路。';
    $('projection-panel').hidden=!concave;
    $('concave-screen-note').hidden=!concave;
    $('concave-screen-note').textContent=near?'實際反射光沒有到鏡後。眼睛看得到正立放大的像，光屏接不到。':
      atFocus?'反射光互相平行，有限距離內不會會合，光屏接不到清楚的像。':
      !screenPlaced?'光屏暫時移開，可以先找兩條反射光在哪裡會合。':
      found?'下方的光屏不擋住上方的入射光。反射光在'+img(c)+' 會合，光屏接到倒立實像。':'光屏只放在主軸下方，上方留給入射光。移動光屏，直到倒立的像出現在屏上。';
    if(window.MirrorDiagram){
      const d=window.MirrorDiagram.draw({...c,screen:showScreen&&screenPlaced?-screen:null,found,showRays:idx>0,guidedConcave:concave});
      $('mirror-view').innerHTML=d.view;
      $('diagram').innerHTML=idx===0?'':d.rays;
      $('projection').innerHTML=concave?d.screen:'';
    } else $('mirror-view').textContent='觀察圖未載入，請重新整理。';
    $('screen-value').value='鏡前 '+cm(screen)+' cm';$('screen').setAttribute('aria-valuetext',$('screen-value').value);
    document.querySelectorAll('[data-screen]').forEach(b=>{b.disabled=!screenPlaced;b.setAttribute('aria-pressed',String(screenPlaced&&Number(b.dataset.screen)===screen));});
    $('rig-status').dataset.found=String(found);
    const status=!screenPlaced?'光屏已移開。':atFocus?'有限距離內接不到清楚的像。':found?'光屏接到了清晰的倒立實像！':'目前還沒接到清晰的像。';
    if($('rig-status').textContent!==status)$('rig-status').textContent=status;
    $('coach').textContent=explore&&!near?(atFocus?'試試 10 cm 兩側的物距，看看平行光怎麼變。':'比比看：換物距後，光屏要移到哪裡才能接到像？'):c.coach||(foundOnce?'再把同一支箭頭移進焦點內，看看交會點怎麼變。':'沿實線找光的交會處，將光屏移到那裡。');
    $('act').textContent=c.cta;$('act').disabled=!ready();
    const readings=atFocus?[['反射光','互相平行'],['光屏結果','有限距離接不到清楚的像']]:idx===3&&!foundOnce&&!records.has(idx)?[['物距','30 cm'],['光屏結果','待驗證']]:
      idx===0?[['方向',direction(c.m)],['大小',size(c.m)]]:[['位置',img(c)],['方向',direction(c.m)],['大小',size(c.m)],['像的類型',imageType(c)]];
    $('reading').innerHTML='<div class="values">'+readings.map(([k,v])=>'<div class="metric"><span>'+k+'</span><strong>'+v+'</strong></div>').join('')+'</div>';
    compare(c);
  }
  function notebook(){
    const visibleIds=active.slice(0,-1).filter(i=>i===0?records.has(0)||records.has(1):records.has(i));
    $('notebook').innerHTML=visibleIds.length?'<div class="table-wrap" tabindex="0" aria-label="可水平捲動的實驗手札"><table class="readings-table imaging-table"><thead><tr><th scope="col">光具</th><th scope="col">物距</th><th scope="col">像的位置</th><th scope="col">方向、大小</th><th scope="col">類型</th></tr></thead><tbody>'+visibleIds.map(i=>{
      const c=optics(i);
      const combined=i===0&&completed(0);
      const distance=combined?'30 → 20 cm':c.u+' cm', position=combined?'鏡後 30 → 20 cm':img(c);
      return '<tr><th scope="row">'+c.label+'</th><td>'+distance+'</td><td>'+position+'</td><td>'+direction(c.m)+'・'+size(c.m)+'</td><td>'+imageType(c)+'</td></tr>';
    }).join('')+'</tbody></table></div>':'<p class="explain">完成觀察後，你的證據會出現在這裡。</p>';
  }
  function renderQuiz(){
    if(!$('questions').hasChildNodes())quiz.forEach(([q,opts],i)=>{
      const fs=document.createElement('fieldset'),l=document.createElement('legend'),fb=document.createElement('p');
      l.textContent=(i+1)+'. '+q;fs.append(l);
      opts.forEach((x,j)=>{const b=document.createElement('button');b.type='button';b.textContent=x;b.addEventListener('click',()=>{answers[i]=j;save();markQuiz();});fs.append(b);});
      fb.className='question-feedback';fb.setAttribute('aria-live','polite');fs.append(fb);$('questions').append(fs);
    });
    markQuiz();
  }
  function markQuiz(){
    [...$('questions').children].forEach((fs,i)=>{
      fs.querySelectorAll('button').forEach((b,j)=>b.setAttribute('aria-pressed',String(answers[i]===j)));
      const correct=answers[i]===quiz[i][2],fb=fs.querySelector('p');
      fb.dataset.correct=String(correct);fb.textContent=answers[i]===undefined?'':correct?'答對了！'+quiz[i][3]:'再看手札：物體、光屏和像各在鏡面哪一側？';
    });
    $('done').textContent=quiz.every((q,i)=>answers[i]===q[2])?'兩題全對，完成面鏡成像！':'';
  }
  function enter(i,focus=false){
    idx=i;u=steps[i].u??30;screen=i===3&&records.has(i)?15:10;screenPlaced=true;tries=new Set();foundOnce=false;$('screen').value=String(screen);$('explain-rays').open=false;
    const s=steps[i];
    const order=active.indexOf(i);
    $('progress').textContent=i<5?'觀察 '+(order+1)+'／'+(active.length-1):'證據挑戰';
    $('mission-title').textContent=s.name;$('guide').textContent=s.guide;
    $('lab').hidden=i===5;$('challenge').hidden=i!==5;
    $('journal').hidden=i===0;$('plane-why').open=false;$('plane-check').open=false;$('plane-check').hidden=i!==0;$('plane-feedback').textContent='';
    $('steps').replaceChildren(...active.map((j,k)=>{
      const b=document.createElement('button');b.type='button';b.textContent=j===5?'挑戰':String(k+1);
      b.setAttribute('aria-label',steps[j].name);if(i===j)b.setAttribute('aria-current','step');
      b.disabled=!active.slice(0,k).every(completed);b.addEventListener('click',()=>enter(j,true));return b;
    }));
    notebook();
    if(i===5)renderQuiz();else update();
    if(focus)$(i===5?'quiz-title':'mission-title').focus();
  }
  function movePlane(n){if(idx!==0||!int(n,10,35))return;u=n;tries.add(n);update();}
  $('plane-distance').addEventListener('input',e=>movePlane(Number(e.target.value)));
  $('plane-why').addEventListener('toggle',()=>{if(idx===0)paintPlane();});
  document.querySelectorAll('[data-distance]').forEach(b=>b.addEventListener('click',()=>movePlane(Number(b.dataset.distance))));
  document.querySelectorAll('[data-check]').forEach(b=>b.addEventListener('click',()=>{
    $('plane-feedback').textContent=Number(b.dataset.check)===25?'對，鏡面兩側各是 25 cm。':'50 cm 是物體到像的總距離；題目只問像到鏡面。';
  }));
  document.querySelectorAll('[data-concave]').forEach(b=>b.addEventListener('click',()=>{
    const distance=Number(b.dataset.concave);
    if(idx!==4||!concaveDistances.includes(distance)||u===distance)return;
    u=distance;update();
  }));
  $('screen-toggle').addEventListener('click',()=>{if(idx===4&&allowsScreen(optics(idx,u))){screenPlaced=!screenPlaced;update();}});
  function moveScreen(n){
    if((idx!==3&&idx!==4)||!allowsScreen(optics(idx,u))||!screenPlaced||!Number.isFinite(n)||n<5||n>35)return;
    screen=n;$('screen').value=String(n);update();
  }
  $('screen').addEventListener('input',e=>moveScreen(Number(e.target.value)));
  document.querySelectorAll('[data-screen]').forEach(b=>b.addEventListener('click',()=>moveScreen(Number(b.dataset.screen))));
  $('act').addEventListener('click',()=>{if(idx>=5||!ready())return;records.add(idx);if(idx===0)records.add(1);save();enter(active[active.indexOf(idx)+1],true);});
  $('clear').addEventListener('click',()=>{const d=$('clear-dialog');d.returnValue='';d.showModal();});
  $('clear-dialog').addEventListener('close',()=>{if($('clear-dialog').returnValue!=='clear')return;records=new Set();answers={};save();enter(0,true);});
  const pending=active.find(i=>i<5&&!completed(i));
  enter(pending??5);
})();
