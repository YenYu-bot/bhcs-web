(() => {
  'use strict';
  const $=id=>document.getElementById(id), KEY='bhcs.lab.lens.bench.v1';
  const steps=[
    {title:'先拿光屏找像',when:'凸透鏡，物距 30 cm',u:30,f:10,startScreen:10,guide:'把光屏移到兩條實線交會處，找清楚的像。',cta:'只把物體移到 15 cm'},
    {title:'只移物體，光屏不動',when:'先不動光屏',u:15,f:10,startScreen:15,guide:'光屏仍在 15 cm。先看原處變得怎樣，再移光屏找清楚的像。',cta:'把物體移到焦點 10 cm'},
    {title:'物體放在焦點上',when:'凸透鏡，物距等於焦距',u:10,f:10,startScreen:30,guide:'看透鏡右側的實線：光會交會，還是一直平行？',cta:'把物體移到焦點內 5 cm'},
    {title:'物體移進焦點內',when:'凸透鏡，物距 5 cm',u:5,f:10,startScreen:30,guide:'這回改用眼睛，從透鏡右側看。沿虛線找像的位置。',cta:'保持 5 cm，換凹透鏡'},
    {title:'只換凹透鏡，物體不動',when:'凹透鏡，同樣物距 5 cm',u:5,f:-10,startScreen:30,guide:'從同一側看，比較兩種透鏡的像：哪些特徵一樣，哪些不同？',cta:'開始證據挑戰'},
    {title:'證據挑戰',guide:'回看手札，再用剛才的觀察回答。'}
  ];
  const quiz=[
    ['凸透鏡物距從 30 cm 移到 15 cm，清楚的像怎麼變？',['像更靠近透鏡、變小','像更遠離透鏡、變大','像的位置不變，只有方向改變'],1,'原本在透鏡右側 15 cm，是倒立縮小像；後來要在右側 30 cm 才接到倒立放大像。'],
    ['物體就在凸透鏡焦點上，為什麼移光屏也接不到清楚的像？',['出射光彼此平行，有限距離內不會交會','光透不過透鏡','光在透鏡後方馬上交會'],0,'出射光線平行，不會在有限距離內會聚。'],
    ['物距同是 5 cm，凸透鏡和凹透鏡有什麼共同點？',['都是倒立實像','都能投在光屏上，只是大小不同','都是正立虛像，但凸透鏡放大、凹透鏡縮小'],2,'兩者的像都在物體同側，光是向後延長才會交會。']
  ];
  let records=new Set(),answers={},lastRaw=null,storageOK=true,idx=0,u=30,screen=10,eye=false,coreCaptured=false,prevU=null,initialScreen=10;
  let exploring=false, freeU=30, freeScreen=10, freeExtended=false, drag=null, lessonFrame=0, lessonStage=0;
  const warn=message=>{const w=$('storage-warning');w.hidden=false;w.textContent=message;};
  const valid=(n,limit)=>Number.isInteger(n)&&n>=0&&n<limit;
  try{
    lastRaw=localStorage.getItem(KEY);
    const data=JSON.parse(lastRaw||'null');
    if(data){
      records=new Set(Array.isArray(data.records)?data.records.filter(i=>valid(i,5)):[]);
      for(const i of [0,1,2])if(valid(data.answers?.[i],3))answers[i]=data.answers[i];
    }
  }catch{storageOK=false;warn('目前無法讀取紀錄；仍可操作，本頁不會覆蓋原有紀錄。');}
  function save(){
    if(!storageOK)return;
    try{
      if(localStorage.getItem(KEY)!==lastRaw){
        storageOK=false;warn('另一個分頁已更新紀錄。本頁不會覆蓋；重新整理可讀取最新紀錄。');return;
      }
      const next=JSON.stringify({records:[...records],answers});localStorage.setItem(KEY,next);lastRaw=next;
    }catch{storageOK=false;warn('瀏覽器未能儲存紀錄；本頁的新紀錄可能在重新整理後消失。');}
  }
  function optics(i,d=steps[i].u){
    const f=steps[i].f, atFocus=d===f, v=atFocus?Infinity:1/(1/f-1/d);
    return {kind:f>0?'convex-lens':'concave-lens',label:f>0?'凸透鏡':'凹透鏡',f,u:d,v,m:atFocus?null:-v/d,atFocus};
  }
  const cm=n=>Number(n.toFixed(2));
  const exact=(a,b)=>Math.abs(a-b)<1e-8;
  const where=c=>c.atFocus?'有限距離不成像':(c.v>0?'右側 ':'左側 ')+cm(Math.abs(c.v))+' cm';
  const orientation=c=>c.atFocus?'—':c.m<0?'倒立':'正立';
  const size=c=>c.atFocus?'—':exact(Math.abs(c.m),1)?'等大':Math.abs(c.m)>1?'放大':'縮小';
  const type=c=>c.atFocus?'不成像':c.v>0?'實像':'虛像';
  const magnification=c=>c.atFocus?'—':cm(Math.abs(c.m))+' 倍';
  function screenState(c,position,found,max=Infinity){
    if(c.atFocus)return '出射光平行，有限距離內接不到清楚的像。';
    if(c.v<0)return '虛像在物體同側，光屏接不到。';
    if(found)return '清晰：光屏接到倒立、'+size(c)+'的實像。';
    if(c.v>max+1e-8)return '輪廓模糊：清晰像在目前光具座範圍外，可延伸光具座再試。';
    const error=Math.abs(1-position/c.v);
    return error<=.08?'接近清晰：再微調光屏，就能對準。':error<=.22?'輪廓逐漸清楚，但還有些模糊。':'輪廓模糊：移動光屏，找像最清楚的位置。';
  }
  function paintScale(c,usingScreen,viewing=false){
    const label=$('projection-scale');
    if(c.atFocus||(usingScreen&&c.v<0)||(!usingScreen&&!viewing)){label.textContent='';return;}
    const clipped=usingScreen&&$('observation-art').querySelector('[data-lens-screen-cropped="true"]');
    label.textContent=(usingScreen?'成像大小':'所見的像')+'約為原物的 '+magnification(c)+'。'+
      (clipped?'像比光屏大，只顯示其中一部分。':usingScreen?'原物參考尺寸固定。':'');
  }
  const focused=c=>idx<2&&c.v>0&&exact(screen,c.v);
  const doneStep=()=>idx===0?focused(optics(0)):records.has(idx)||idx>1||coreCaptured;
  const imageFacts=c=>[['像的位置',where(c)],['方向',orientation(c)],['大小',c.atFocus?'—':size(c)+' · '+magnification(c)],['像的類型',type(c)]];
  const summary=c=>'<li><strong>'+c.label+' · 物距 '+c.u+' cm</strong><span>'+where(c)+'，'+orientation(c)+'・'+size(c)+'・'+type(c)+'</span></li>';
  function notebook(){
    const rows=[...records].sort((a,b)=>a-b);
    $('notebook').innerHTML=rows.length?'<div class="table-wrap" tabindex="0" aria-label="可水平捲動的實驗手札"><table class="readings-table imaging-table"><thead><tr><th scope="col">透鏡</th><th scope="col">物距</th><th scope="col">像的位置</th><th scope="col">方向、大小</th><th scope="col">類型</th></tr></thead><tbody>'+rows.map(i=>{
      const c=optics(i);
      return '<tr><th scope="row">'+c.label+'</th><td>'+c.u+' cm</td><td>'+where(c)+'</td><td>'+(c.atFocus?'—':orientation(c)+'・'+size(c))+'</td><td>'+type(c)+'</td></tr>';
    }).join('')+'</tbody></table></div>':'<p class="explain">完成一項觀察，證據就會出現在這裡。</p>';
  }
  function paint(){
    const c=optics(idx,u), usingScreen=idx<3, found=focused(c), viewing=idx>=3;
    if(found&&u===steps[idx].u)coreCaptured=true;
    $('mode').textContent=c.label+' · 物距 '+c.u+' cm';
    $('transition').textContent=idx===1?(u===15?'物距 30 → 15 cm｜光屏起初留在 '+cm(initialScreen)+' cm':'自選比較｜物距 20 cm，其他條件不變'):
      prevU!==null&&prevU!==u?'只移物體：物距 '+prevU+' → '+u+' cm｜焦距 10 cm':steps[idx].when;
    $('screen-tool').hidden=!usingScreen;$('eye-tool').hidden=!viewing;
    $('screen-value').value='右側 '+cm(screen)+' cm';$('screen').setAttribute('aria-valuetext',$('screen-value').value);
    $('screen-help').textContent=idx===2?'試著移動光屏，看看是否能接到清楚的像。':'可拖動圖中的光屏，或用滑桿／方向鍵微調。';
    document.querySelectorAll('[data-screen]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.screen)===screen)));
    document.querySelectorAll('[data-explore]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.explore)===u)));
    $('look').setAttribute('aria-pressed',String(eye));$('look').textContent=eye?'收起眼睛觀察':'從透鏡後看';
    $('observation-title').textContent=usingScreen?'光屏上看見什麼？':'眼睛看見什麼？';
    if(window.LensDiagram){
      const d=window.LensDiagram.draw({...c,screen:usingScreen?screen:null,found,eye:viewing&&eye,showRays:true});
      $('bench-diagram').innerHTML=d.rays;
      $('observation-art').innerHTML=usingScreen?d.screen:eye?d.view:'';
    }else{
      $('bench-diagram').textContent='光路圖未載入，請重新整理。';
    }
    const status=usingScreen?(idx===1&&!found&&screen===initialScreen&&u===15?
      '光屏仍在原處，輪廓變模糊了。':screenState(c,screen,found)):
      eye?'看到了'+orientation(c)+'、'+size(c)+'的像；光屏接不到這個虛像。':'選「從透鏡後看」，再比較物體和像的大小與方向。';
    paintScale(c,usingScreen,eye);
    if($('rig-status').textContent!==status)$('rig-status').textContent=status;
    $('rig-status').dataset.found=String(found);
    $('optional-distance').hidden=idx!==1||!coreCaptured&&!records.has(1);
    $('act').textContent=steps[idx].cta;$('act').disabled=!doneStep();
    const facts=idx===2?[['出射光','彼此平行'],['光屏結果','有限距離接不到清楚的像']]:
      usingScreen&&!found?[['物距',u+' cm'],['光屏目前','沒有清楚的像']]:
      viewing&&!eye?[['物距',u+' cm'],['觀看方式','從透鏡右側看']]:imageFacts(c);
    $('reading').innerHTML='<div class="values">'+facts.map(([k,v])=>'<div class="metric"><span>'+k+'</span><strong>'+v+'</strong></div>').join('')+'</div>';
    const pair=idx===1&&(coreCaptured||records.has(1))?[optics(0),c]:idx===4&&eye?[optics(3),c]:[];
    $('compare').innerHTML=pair.length?'<div class="comparison"><strong>'+(idx===1?'同一片凸透鏡，移動物體':'物距同樣 5 cm，只換透鏡')+'</strong><ul class="comparison-list">'+pair.map(summary).join('')+'</ul></div>':'';
  }
  const freeMax=()=>freeExtended?220:40;
  function freePaint(){
    const c=optics(0,freeU), finiteReal=c.v>0&&Number.isFinite(c.v), found=finiteReal&&Math.abs(freeScreen-c.v)<=.25000001;
    $('mode').textContent='凸透鏡 · 物距 '+cm(c.u)+' cm';
    $('transition').textContent='自由探索｜焦距 F＝10 cm，2F＝20 cm';
    $('object-distance').value=String(freeU);$('object-distance').setAttribute('aria-valuetext',cm(freeU)+' 公分');
    $('object-reading').value=cm(freeU)+' cm';
    $('screen').max=String(freeMax());$('screen').value=String(freeScreen);$('screen-value').value='右側 '+cm(freeScreen)+' cm';
    $('screen').setAttribute('aria-valuetext',$('screen-value').value);
    $('screen-help').textContent='可拖動圖中的光屏，或用滑桿／方向鍵。右側可移動 5–'+freeMax()+' cm。';
    $('extend-screen').textContent=freeExtended?'收起延伸光具座':'延伸光具座至 220 cm';
    $('extend-screen').setAttribute('aria-pressed',String(freeExtended));
    $('extend-screen').disabled=freeExtended&&freeScreen>40;
    $('extend-status').textContent=freeExtended?(freeScreen>40?'先把光屏移回 40 cm 內，才能收起。':'右側尺規已縮小；光屏和物體的實際位置不變。'):'';
    $('focus-help').hidden=!finiteReal||c.v>freeMax()+1e-8||found;
    if(!$('focus-help').hidden){
      const target=Math.round(c.v*2)/2;
      $('focus-target').textContent='移光屏到約 '+cm(target)+' cm';
    }
    document.querySelectorAll('[data-object]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.object)===freeU)));
    document.querySelectorAll('[data-screen]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.screen)===freeScreen)));
    if(window.LensDiagram){
      const d=window.LensDiagram.draw({...c,screen:freeScreen,found,eye:false,showRays:true,explorer:true,extended:freeExtended});
      $('bench-diagram').innerHTML=d.rays;$('observation-art').innerHTML=d.screen;
    }else $('bench-diagram').textContent='光路圖未載入，請重新整理。';
    const status=screenState(c,freeScreen,found,freeMax());
    paintScale(c,true);
    if($('rig-status').textContent!==status)$('rig-status').textContent=status;
    $('rig-status').dataset.found=String(found);
    const facts=c.atFocus?[['出射光','彼此平行'],['像的位置','有限距離不成像']]:imageFacts(c);
    $('reading').innerHTML='<div class="values">'+facts.map(([a,b])=>'<div class="metric"><span>'+a+'</span><strong>'+b+'</strong></div>').join('')+'</div>';
    $('compare').innerHTML='';
  }
  function setExplorer(next){
    exploring=next;
    $('toggle-explorer').setAttribute('aria-pressed',String(next));
    $('toggle-explorer').textContent=next?'回到原本的引導':'自由探索：拖動物體';
    $('free-object').hidden=!next;$('steps').hidden=next;
    $('extended-controls').hidden=!next;$('focus-help').hidden=true;$('focus-help').open=false;
    $('act').hidden=next;$('bench-diagram').classList.toggle('draggable-object',next);
    if(next){
      freeU=idx<5&&idx!==4?u:30;freeScreen=screen;freeExtended=false;
      $('lab').hidden=false;$('challenge').hidden=true;
      $('progress').textContent='自由探索';$('mission-title').textContent='移動物體，看看光屏';$('guide').textContent='注意物體經過 F 和 2F 時，清楚的像會往哪裡移。自由探索不會改動引導紀錄。';
      $('screen-tool').hidden=false;$('eye-tool').hidden=true;$('optional-distance').hidden=true;
      $('observation-title').textContent='光屏上看見什麼？';
      freePaint();
    }else{
      stopDrag();
      $('lab').hidden=idx===5;$('challenge').hidden=idx!==5;
      $('progress').textContent=idx===5?'證據挑戰':'觀察 '+(idx+1)+'／5';
      $('mission-title').textContent=steps[idx].title;$('guide').textContent=steps[idx].guide;
      $('screen').max='40';
      if(idx<5){$('screen').value=String(screen);paint();}
    }
  }
  function moveObject(n){
    if(!exploring||!Number.isFinite(n))return;
    const next=Math.max(5,Math.min(35,Math.round(n*2)/2));
    if(next===freeU)return;
    freeU=next;freePaint();
  }
  function pointerDistance(e,kind){
    const svg=$('bench-diagram').querySelector('svg'), matrix=svg?.getScreenCTM();
    if(!matrix)return null;
    const at=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());
    const toDistance=window.LensDiagram?.toDistance;
    return toDistance?toDistance(svg,at.x,kind):kind==='screen'?(at.x-210)/4.8:(210-at.x)/4.8;
  }
  function stopDrag(e){
    if(!drag||e&&e.pointerId!==drag.id)return;
    const host=$('bench-diagram'), id=drag.id;drag=null;
    if(host.hasPointerCapture(id))host.releasePointerCapture(id);
    host.classList.remove('is-dragging');
  }
  const lessonText=[
    '光從空氣進入玻璃，再從玻璃離開。兩個表面各折射一次。（輪廓與角度放大示意。）',
    '從物體頭頂出發的兩道光，經透鏡後在光屏同一點會合。',
    ['頭頂的像在光屏下方。','中段的像在頭頂與底部的像之間。','底部的像在光軸與光屏交會處。','把這些點連起來，就是倒立的物體實像。']
  ];
  function paintLesson(){
    $('lesson-art').innerHTML=window.LensExplainer?window.LensExplainer.draw({frame:lessonFrame,stage:lessonStage}):'解說圖未載入，請重新整理。';
    $('lesson-caption').textContent=lessonFrame===2?lessonText[2][lessonStage]:lessonText[lessonFrame];
    $('lesson-build').hidden=lessonFrame!==2;
    $('lesson-build').textContent=['加入物體的中段','加入物體的底部','連成一個物體','從頭頂重看'][lessonStage];
    document.querySelectorAll('[data-lesson]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.lesson)===lessonFrame)));
  }
  function renderQuiz(){
    if(!$('questions').hasChildNodes())quiz.forEach(([q,options],i)=>{
      const field=document.createElement('fieldset'), legend=document.createElement('legend'), feedback=document.createElement('p');
      legend.textContent=(i+1)+'. '+q;field.append(legend);
      options.forEach((option,j)=>{
        const b=document.createElement('button');b.type='button';b.textContent=option;
        b.addEventListener('click',()=>{answers[i]=j;save();markQuiz();});field.append(b);
      });
      feedback.className='question-feedback';feedback.setAttribute('aria-live','polite');field.append(feedback);$('questions').append(field);
    });
    markQuiz();
  }
  function markQuiz(){
    [...$('questions').children].forEach((field,i)=>{
      field.querySelectorAll('button').forEach((b,j)=>b.setAttribute('aria-pressed',String(answers[i]===j)));
      const correct=answers[i]===quiz[i][2], p=field.querySelector('p');
      p.dataset.correct=String(correct);p.textContent=answers[i]===undefined?'':correct?'答對了！'+quiz[i][3]:'再回頭看手札裡的光屏位置與像的方向。';
    });
    $('done').textContent=quiz.every((q,i)=>answers[i]===q[2])?'三題全對，完成透鏡成像！':'';
  }
  function enter(i,{focus=false,carry=false}={}){
    const prev=idx, oldU=u, oldScreen=screen, oldEye=eye;
    idx=i;u=steps[i].u??30;prevU=carry?oldU:null;
    screen=carry&&i<3&&prev<3?oldScreen:i===0&&records.has(i)?15:steps[i].startScreen??10;
    initialScreen=screen;eye=carry&&i===4&&prev===3&&oldEye;coreCaptured=false;
    $('screen').value=String(screen);
    $('optional-distance').open=false;
    $('progress').textContent=i===5?'證據挑戰':'觀察 '+(i+1)+'／5';
    $('mission-title').textContent=steps[i].title;$('guide').textContent=steps[i].guide;
    $('lab').hidden=i===5;$('challenge').hidden=i!==5;
    $('steps').replaceChildren(...steps.map((s,j)=>{
      const b=document.createElement('button');b.type='button';b.textContent=j===5?'挑戰':String(j+1);
      b.setAttribute('aria-label',s.title);if(i===j)b.setAttribute('aria-current','step');
      b.disabled=j>0&&!Array.from({length:j},(_,a)=>a).every(a=>records.has(a));
      b.addEventListener('click',()=>enter(j,{focus:true}));return b;
    }));
    notebook();
    if(i===5)renderQuiz();else paint();
    if(focus)$(i===5?'quiz-title':'mission-title').focus();
  }
  function moveScreen(n){
    if(!Number.isFinite(n)||n<5||n>(exploring?freeMax():40))return;
    if(exploring){freeScreen=n;freePaint();return;}
    if(idx>2)return;
    screen=n;$('screen').value=String(n);paint();
  }
  $('toggle-explorer').addEventListener('click',()=>setExplorer(!exploring));
  $('object-distance').addEventListener('input',e=>moveObject(Number(e.target.value)));
  document.querySelectorAll('[data-object]').forEach(b=>b.addEventListener('click',()=>moveObject(Number(b.dataset.object))));
  $('extend-screen').addEventListener('click',()=>{
    if(!exploring||(freeExtended&&freeScreen>40))return;
    stopDrag();freeExtended=!freeExtended;freePaint();
  });
  $('focus-target').addEventListener('click',()=>{
    if(!exploring)return;
    const c=optics(0,freeU);
    if(Number.isFinite(c.v)&&c.v>0&&c.v<=freeMax()+1e-8){
      moveScreen(Math.round(c.v*2)/2);
      $('screen').focus({preventScroll:true});
    }
  });
  $('bench-diagram').addEventListener('pointerdown',e=>{
    if(drag||e.button!==0)return;
    const kind=e.target.closest('[data-lens-screen-drag]')&&(exploring||idx<3)?'screen':
      exploring&&e.target.closest('[data-lens-object-drag]')?'object':null;
    if(!kind)return;
    const at=pointerDistance(e,kind);if(!Number.isFinite(at))return;
    e.preventDefault();
    const current=kind==='screen'?(exploring?freeScreen:screen):freeU;
    drag={id:e.pointerId,kind,offset:current-at};
    e.currentTarget.setPointerCapture(e.pointerId);e.currentTarget.classList.add('is-dragging');
  });
  $('bench-diagram').addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const at=pointerDistance(e,drag.kind);if(!Number.isFinite(at))return;
    if(drag.kind==='object'){moveObject(at+drag.offset);return;}
    const next=Math.max(5,Math.min(exploring?freeMax():40,Math.round((at+drag.offset)*2)/2));
    if(next!==(exploring?freeScreen:screen))moveScreen(next);
  });
  for(const e of ['pointerup','pointercancel','lostpointercapture'])$('bench-diagram').addEventListener(e,stopDrag);
  $('lens-explainer').addEventListener('toggle',()=>{if($('lens-explainer').open)paintLesson();});
  document.querySelectorAll('[data-lesson]').forEach(b=>b.addEventListener('click',()=>{
    lessonFrame=Number(b.dataset.lesson);lessonStage=0;paintLesson();
  }));
  $('lesson-build').addEventListener('click',()=>{lessonStage=(lessonStage+1)%4;paintLesson();});
  $('screen').addEventListener('input',e=>moveScreen(Number(e.target.value)));
  document.querySelectorAll('[data-screen]').forEach(b=>b.addEventListener('click',()=>moveScreen(Number(b.dataset.screen))));
  document.querySelectorAll('[data-explore]').forEach(b=>b.addEventListener('click',()=>{
    if(idx!==1||!coreCaptured&&!records.has(1))return;
    const next=Number(b.dataset.explore);if(next!==15&&next!==20)return;
    u=next;paint();
  }));
  $('look').addEventListener('click',()=>{if(idx===3||idx===4){eye=!eye;paint();}});
  $('act').addEventListener('click',()=>{
    if(exploring||idx>=5||!doneStep())return;
    records.add(idx);save();enter(idx+1,{focus:true,carry:true});
  });
  $('clear').addEventListener('click',()=>{const d=$('clear-dialog');d.returnValue='';d.showModal();});
  $('clear-dialog').addEventListener('close',()=>{if($('clear-dialog').returnValue!=='clear')return;if(exploring)setExplorer(false);records=new Set();answers={};save();enter(0,{focus:true});});
  const pending=steps.findIndex((_,i)=>i<5&&!records.has(i));
  enter(pending<0?5:pending);
})();
