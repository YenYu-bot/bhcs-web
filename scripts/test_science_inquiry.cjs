const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');const root=path.resolve(__dirname,'..');
function lesson(file,saved,blocked=false){
 const source=fs.readFileSync(path.join(root,'tools',file),'utf8');
 // Isolate the shared workbook from unrelated canvas animation engines.
 const html=source.replace(/<script\b[\s\S]*?<\/script>/g,'');
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'https://www.bhcs.com.tw/tools/'+file,runScripts:'outside-only',virtualConsole:vc});const w=dom.window;
 w.confirm=()=>true;const key='bhcs-inquiry-v1:'+w.location.pathname;
 if(saved)w.localStorage.setItem(key,saved);
 w.localStorage.setItem('existing-experiment-records','keep');
 if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('Storage blocked')}});
 w.eval(fs.readFileSync(path.join(root,'scripts/science/study.js'),'utf8'));
 return {dom,w,d:w.document,key,errors};
}
(async()=>{
 const {firstBatch}=await import('./science/catalog.mjs'),{batch2}=await import('./science/batch2.mjs');
 for(const file of [...firstBatch,...batch2.map(c=>'science/'+c.id+'.html')]){
  const {dom,w,d,key,errors}=lesson(file);assert.equal(d.querySelectorAll('#inquiry-guide dt').length,4,file);const checks=[...d.querySelectorAll('[data-study-step]')];assert.equal(checks.length,3);checks.forEach(c=>{c.checked=true;c.dispatchEvent(new w.Event('change'))});assert.match(d.querySelector('#study-progress').textContent,/3／3/);
  const note=d.querySelector('#study-note');note.value='<img src=x onerror=alert(1)> 我的證據';note.dispatchEvent(new w.Event('input'));const saved=w.localStorage.getItem(key);assert.ok(JSON.parse(saved).note.includes('我的證據'));assert.equal(d.querySelector('#inquiry-guide img'),null);
  d.querySelector('#study-clear').click();assert.equal(note.value,'');assert.equal(checks.some(c=>c.checked),false);assert.equal(w.localStorage.getItem('existing-experiment-records'),'keep');assert.deepEqual(errors,[]);dom.window.close();
  for(const savedValue of [saved,'{invalid']){const again=lesson(file,savedValue);if(savedValue===saved){assert.equal(again.d.querySelectorAll('[data-study-step]:checked').length,3);assert.equal(again.d.querySelector('#study-note').value,JSON.parse(saved).note)}assert.deepEqual(again.errors,[]);again.dom.window.close()}
 }
 const denied=lesson('science/ecosystem.html',null,true);denied.d.querySelector('#study-note').value='離線筆記';denied.d.querySelector('#study-note').dispatchEvent(new denied.w.Event('input'));assert.match(denied.d.querySelector('#study-save-status').textContent,/無法保存/);assert.deepEqual(denied.errors,[]);denied.dom.window.close();console.log('PASS 20 inquiry guides: per-page persistence, restore, malformed data, escaped notes, isolated reset and storage denial');
})().catch(e=>{console.error(e);process.exitCode=1});
