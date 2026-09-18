// Event parameters are allowlisted: no free text, answers or student identifiers.
(() => {
  let allowed=true;
  try {
    if(new URLSearchParams(location.search).get('noga')==='1')localStorage.setItem('bhcs_noga','1');
    allowed=localStorage.getItem('bhcs_noga')!=='1';
  } catch (_) { allowed=false; }
  if(navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true)allowed=false;
  if(allowed&&typeof window.gtag!=='function'){
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments)};
    window.gtag('js',new Date());window.gtag('config','G-GHN2GDS2RQ');
    const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=G-GHN2GDS2RQ';document.head.append(s);
  }
  function track(action, lab) {
    if (!/^[a-z][a-z0-9_-]{0,60}$/.test(action) || !/^[a-z][a-z0-9_-]{0,80}$/.test(lab)) return;
    try { if (localStorage.getItem('bhcs_noga') === '1' || new URLSearchParams(location.search).get('noga') === '1') return; } catch (_) { return; }
    if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
    if (typeof window.gtag === 'function') window.gtag('event', 'science_' + action, {lab_id: lab});
  }
  window.bhcsScienceTrack = track;
  const id = document.body.dataset.scienceLab || location.pathname.split('/').pop().replace('.html','') || 'science-directory';
  let missionActive=false;
  track('open', id);
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-science-event]');
    if (a) track(a.dataset.scienceEvent, a.dataset.lab || id);
    // Original first-batch pages retain their engines; observe successful state only.
    if(document.body.dataset.scienceLab)return;
    const button=e.target.closest('button');if(!button||button.disabled)return;
    if(button.id==='printRecord')track('print',id);
    if(button.matches('.mission'))missionActive=true;
    if(button.id==='reset'||button.id==='resetBoundary')missionActive=false;
    if(button.id==='addRecord'){track('record',id);if(missionActive)track('task_complete',id);}
    if(button.id==='checkQuiz')setTimeout(()=>{
      const groups=[...document.querySelectorAll('.quizItem fieldset')];
      if(groups.length&&groups.every(f=>f.querySelector('input:checked')))track('quiz_complete',id);
    },0);
  });
})();
