// Presentation-only fallback: diagram zoom must not depend on the enhanced shell.
(()=>{function setupEnzymeZoom(){
 if(document.body.dataset.scienceLab!=='enzyme')return;
 const stage=document.getElementById('diagram');if(!stage)return;
 let button=document.querySelector('.researcher-zoom,.enzyme-diagram-zoom');
 if(!button){
  button=document.createElement('button');button.type='button';
  button.setAttribute('aria-pressed','false');button.textContent='放大圖解（可左右滑動）';
  button.addEventListener('click',()=>{const on=stage.classList.toggle('is-zoomed');button.setAttribute('aria-pressed',String(on));button.textContent=on?'縮回全圖':'放大圖解（可左右滑動）'});
  stage.after(button);
 }
 button.classList.add('enzyme-diagram-zoom');button.setAttribute('aria-controls','diagram');
 if(!stage.classList.contains('is-zoomed'))button.textContent='放大圖解（可左右滑動）';
}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupEnzymeZoom,{once:true});else setupEnzymeZoom();
})();

/* Enzyme presentation only. No model, history, storage or network APIs. */
(()=>{'use strict';
 function decorate(){
  if(document.body.dataset.scienceLab!=='enzyme'||document.body.dataset.cuteReady)return;
  document.body.dataset.cuteReady='true';
  const art='../../assets/science/props/',teacher='../mini-lab/img/';
  const icon=kind=>'<svg class="cute-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false"><g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'+({tube:'<path d="M17 6h14M19 6v24a5 5 0 0 0 10 0V6M19 20h10"/><path d="M22 25h4M22 30h4"/>',note:'<rect x="11" y="7" width="28" height="34" rx="5"/><path d="M18 7v34M8 15h6M8 24h6M8 33h6M24 17h9M24 24h9M24 31h6"/>',thermo:'<path d="M20 28V10a5 5 0 0 1 10 0v18a9 9 0 1 1-10 0Z"/><path d="M25 16v17M34 12h5M34 20h5"/><circle cx="25" cy="34" r="3" fill="currentColor"/>'}[kind])+'</g></svg>';
  const guide=(cls,img,title,copy)=>{const n=document.createElement('aside');n.className='cute-guide '+cls;n.innerHTML='<img src="'+teacher+img+'.png" alt="余老師" width="85" height="140" loading="lazy"><div><span class="cute-sticker">余老師的研究便條</span><h3>'+title+'</h3><p>'+copy+'</p></div>';return n};
  const welcome=document.querySelector('.researcher-welcome');
  if(welcome){
   const kit=welcome.querySelector('.researcher-kit');if(kit)kit.innerHTML='<span>'+icon('tube')+'改變條件</span><span>'+icon('thermo')+'讀取觀察</span><span>'+icon('note')+'留下證據</span>';
   const scene=welcome.querySelector('.researcher-scene');if(scene){scene.classList.add('cute-scene');const label=document.createElement('span');label.className='cute-scene-label';label.textContent='酵素觀察小記 · ENZYME STUDY';scene.append(label)}
  }else{
   const hero=document.querySelector('.hero .shell');if(hero)hero.append(guide('cute-start','doc-point','今天，一起看懂酵素的變化。','先改一個條件，再看圖像與讀值。加熱之後，記得追蹤同一份樣本。'));
  }
  const observation=document.querySelector('.observation');
  if(observation){
   const strip=document.createElement('section');strip.className='cute-concepts';strip.setAttribute('aria-label','酵素與溫度的三個概念示意');
   strip.innerHTML='<div class="cute-section-label">'+icon('thermo')+'先看圖，再動手</div><div class="cute-concept-grid">'+[
    ['cool','低溫暫慢','normal','升回適溫，可恢復活性。'],
    ['warm','適溫活躍','normal','形狀合適，較利於反應。'],
    ['hot','高溫變性','denatured','形狀改變，降溫不等於復原。']
   ].map(([cls,title,shape,copy],i)=>'<figure class="cute-concept '+cls+'"><div class="cute-molecule"><img class="cute-enzyme" src="'+art+'prop-enzyme-'+shape+'.webp" alt="'+(shape==='normal'?'酵素形狀完整':'酵素形狀改變')+'" width="110" height="82"><img class="cute-substrate" src="'+art+'prop-substrate.webp" alt="受質" width="35" height="24"></div><figcaption><b>'+title+'</b><p>'+copy+'</p></figcaption></figure>').join('')+'</div><p class="cute-caption">概念示意，非實際分子比例。適溫與變性條件因酵素而異；實際讀值請看下方模型結果。</p>';
   const heading=observation.querySelector('h2');if(heading)heading.after(strip);else observation.prepend(strip);
   observation.append(guide('cute-key-lesson','doc-point','降回原溫，還是同一份樣本。','比較加熱前後時，一起看「是否變性」與加熱歷程；「換新樣本」才是另一份酵素，不是讓原樣本復原。'));
  }
  if(!document.querySelector('.researcher-notebook-intro'))document.querySelector('#records-section')?.prepend(guide('cute-note','doc-notebook','把證據留在研究手冊','記下條件、樣本與加熱歷程，再比較兩筆觀察。'));
  const quiz=document.querySelector('#quiz');if(quiz)quiz.prepend(guide('cute-check','doc-cheer','用自己的話，說說看！','先回想你看到的證據，再完成下面的挑戰。答題結果以檢核回饋為準。'));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else decorate();
})();
