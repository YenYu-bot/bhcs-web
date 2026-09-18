const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM,VirtualConsole}=require('jsdom');const axe=require('axe-core');
const root=path.resolve(__dirname,'..');
function load(file,{saved=null,blocked=false}={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'),{runScripts:'dangerously',url:'https://www.bhcs.com.tw/'+file+'?noga=1',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.print=()=>{};w.confirm=()=>true;if(saved)Object.entries(saved).forEach(([k,v])=>w.localStorage.setItem(k,v));if(blocked)Object.defineProperty(w,'localStorage',{get(){throw new Error('Storage blocked')}})}});
 return {dom,errors};
}
function structural(d,file){
 const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length,file+' duplicate IDs');assert.equal(d.querySelectorAll('h1').length,1);
 d.querySelectorAll('label[for]').forEach(l=>assert.ok(d.getElementById(l.htmlFor),file+' label'));
 d.querySelectorAll('[aria-labelledby]').forEach(n=>n.getAttribute('aria-labelledby').split(/\s+/).forEach(id=>assert.ok(d.getElementById(id),file+' aria')));
 d.querySelectorAll('button').forEach(b=>assert.equal(b.type,'button'));
 d.querySelectorAll('script:not([type]),script[type="text/javascript"]').forEach(s=>{if(!s.src)new vm.Script(s.textContent)});
 for(const n of d.querySelectorAll('a[href],script[src],link[href]')){
  const raw=n.getAttribute('href')||n.getAttribute('src');if(!raw||/^(https?:|mailto:|tel:|data:)/.test(raw))continue;
  const url=new URL(raw,'https://www.bhcs.com.tw/'+file);const pathname=decodeURIComponent(url.pathname);const p=path.join(root,pathname.endsWith('/')?pathname+'index.html':pathname);assert.ok(fs.existsSync(p),`${file}: missing ${raw}`);
  if(url.pathname==='/'+file&&url.hash)assert.ok(d.getElementById(decodeURIComponent(url.hash.slice(1))),file+' missing anchor '+url.hash);
 }
 JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent);
 assert.ok(d.querySelector('meta[name="description"]').content.length>10);
}
(async()=>{
 const {batch2}=await import('./science/batch2.mjs');
 for(const conf of batch2){
  const file='tools/science/'+conf.id+'.html',{dom,errors}=load(file),w=dom.window,d=w.document,$=id=>d.getElementById(id);
  structural(d,file);assert.equal($('control-fields').disabled,false);
  assert.ok(d.querySelector('#experiment').firstElementChild.classList.contains('controls'),'Prediction must precede results in reading/tab order');
  $('run').click();assert.equal($('add-record').disabled,true);assert.ok(!$('diagram').querySelector('svg'));
  $('prediction').value=conf.choices[0][0];$('run').click();assert.ok($('diagram').querySelector('svg'));assert.equal($('readouts').children.length,4);assert.equal($('add-record').disabled,false);
  $('add-record').click();assert.equal($('records').textContent.includes('尚未'),true);
  $('explanation-input').value='測試觀察：只改一個變因，比較兩筆數值。';$('add-record').click();assert.equal($('records').rows.length,1);assert.ok(!$('records').textContent.includes('尚未'));assert.equal($('add-record').disabled,true);
  assert.equal($('print-records').querySelectorAll('article').length,1);
  assert.ok($('print-records').textContent.includes('測試觀察：只改一個變因'));
  $('explanation-input').value='尚未儲存的列印觀察';w.dispatchEvent(new w.Event('beforeprint'));
  assert.ok($('print-current').textContent.includes('尚未儲存的列印觀察'));
  $('explanation-input').value='列印按鈕的備用快照';$('print').click();assert.ok($('print-current').textContent.includes('列印按鈕的備用快照'));
  if(conf.id==='electromagnetism'){assert.ok(!$('records').textContent.includes('外加磁場'));assert.ok(!$('current-conditions').textContent.includes('轉速'));}
  if(conf.id==='pressure-fluid'){assert.ok(!$('records').textContent.includes('氣體體積'));assert.ok(!$('current-conditions').textContent.includes('入口流速'));}
  const saved=w.localStorage.getItem('bhcs-science-v2-'+conf.id);assert.equal(JSON.parse(saved).length,1);
  const c=conf.controls[0],el=$('ctl-'+c.key);el.value=c.options?c.options[1][0]:c.max;el.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal($('prediction').value,'');assert.equal($('add-record').disabled,true);assert.equal($('readouts').children.length,0);
  for(let i=0;i<conf.tasks.length;i++){d.querySelector(`[data-mission="${i}"]`).click();assert.equal($('prediction').value,'');assert.equal($('add-record').disabled,true);$('prediction').value=conf.choices.at(-1)[0];$('run').click();assert.ok($('diagram').querySelector('svg'));$('explanation-input').value='測試任務觀察比較';$('add-record').click()}
  assert.equal($('records').rows.length,4);assert.equal($('record-comparison').querySelectorAll('article').length,2);assert.match($('record-comparison').textContent,/紀錄 3/);assert.match($('record-comparison').textContent,/紀錄 4/);$('reset').click();assert.equal($('readouts').children.length,0);assert.equal($('prediction').value,'');assert.equal($('add-record').disabled,true);assert.equal($('records').rows.length,4);
  w.dispatchEvent(new w.Event('beforeprint'));assert.ok(!$('print-current').textContent.includes('尚未儲存的列印觀察'));assert.equal($('current-conditions').textContent,'');assert.equal($('print-records').querySelectorAll('article').length,4);
  $('check-quiz').click();assert.match($('quiz-score').textContent,/已答0\/3/);
  conf.quiz.forEach((q,i)=>assert.ok(!$('feedback-'+i).textContent.includes(q.tip),'Unanswered quiz must not disclose explanation'));
  conf.quiz.forEach((q,i)=>{d.querySelector(`input[name="quiz-${i}"][value="${q.answer}"]`).checked=true});$('check-quiz').click();assert.match($('quiz-score').textContent,/答對3\/3/);
  d.querySelector('input[name="quiz-0"]').dispatchEvent(new w.Event('change'));assert.equal($('feedback-0').textContent,'','Changed answer must not retain stale correctness feedback');
  $('level').value='advanced';$('level').dispatchEvent(new w.Event('change'));assert.equal($('formula').hidden,false);
  w.eval(axe.source);const accessibility=await w.axe.run(d,{runOnly:{type:'tag',values:['wcag2a','wcag2aa']},rules:{'color-contrast':{enabled:false}}});assert.deepEqual(Array.from(accessibility.violations,v=>v.id),[],file+' accessibility');
  assert.deepEqual(errors,[],file+' JS errors');dom.window.close();
  for(const option of [{saved:{['bhcs-science-v2-'+conf.id]:saved}},{saved:{['bhcs-science-v2-'+conf.id]:'{broken'}},{saved:{['bhcs-science-v2-'+conf.id]:JSON.stringify([{conditions:'<img src=x onerror=alert(1)>',result:'safe',prediction:'safe',explanation:'safe'}])}},{blocked:true}]){
   const {dom:other,errors:otherErrors}=load(file,option),od=other.window.document;od.getElementById('prediction').value=conf.choices[0][0];od.getElementById('run').click();assert.equal(od.getElementById('add-record').disabled,false);assert.equal(od.getElementById('records').querySelectorAll('img').length,0);assert.deepEqual(otherErrors,[]);other.window.close();
  }
  console.log('PASS',conf.id,'core flow, tasks, quiz, storage, a11y');
 }
 const {dom,errors}=load('tools/science/index.html'),d=dom.window.document;structural(d,'tools/science/index.html');
 assert.equal(d.querySelectorAll('.resource').length,29);d.getElementById('subject').value='生物';d.getElementById('subject').dispatchEvent(new dom.window.Event('input'));assert.equal([...d.querySelectorAll('.resource')].filter(c=>!c.hidden).length,6);
 d.getElementById('search').value='不存在的單元';d.getElementById('search').dispatchEvent(new dom.window.Event('input'));assert.equal(d.getElementById('empty').hidden,false);d.getElementById('clearFilters').click();assert.equal([...d.querySelectorAll('.resource')].filter(c=>!c.hidden).length,29);assert.deepEqual(errors,[]);dom.window.close();console.log('PASS directory filters, no-results, clear, links');
 // Privacy and payload allowlist, including a click after storage denial.
 const events=fs.readFileSync(path.join(root,'assets/science-events.js'),'utf8');
 for(const optOut of ['none','noga','dnt','gpc','blocked']){
  const dom=new JSDOM('<body data-science-lab="optics"><a href="/guozhong-lihua.html" data-science-event="course">course</a></body>',{url:'https://www.bhcs.com.tw/tools/science/optics.html'+(optOut==='noga'?'?noga=1':''),runScripts:'outside-only'});const w=dom.window,payload=[];w.gtag=(...a)=>payload.push(a);
  if(optOut==='dnt')Object.defineProperty(w.navigator,'doNotTrack',{value:'1'});if(optOut==='gpc')Object.defineProperty(w.navigator,'globalPrivacyControl',{value:true});if(optOut==='blocked')Object.defineProperty(w,'localStorage',{get(){throw Error('Blocked')}});
  w.eval(events);w.bhcsScienceTrack('record','optics');w.bhcsScienceTrack('private text','optics');
  assert.equal(payload.length,optOut==='none'?2:0);payload.forEach(p=>assert.deepEqual(Object.keys(p[2]),['lab_id']));dom.window.close();
 }
 console.log('PASS privacy opt-outs and event payloads');
})().catch(e=>{console.error(e);process.exitCode=1});
