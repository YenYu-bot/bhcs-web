const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM,VirtualConsole}=require('jsdom'),root=path.resolve(__dirname,'..');
function load(file,{storage={}}={}){
 const errors=[],frames=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',e=>errors.push(String(e)));
 const source=fs.readFileSync(path.join(root,'tools',file),'utf8');
 const dom=new JSDOM(source,{url:'https://www.bhcs.com.tw/tools/'+file+'?noga=1',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:s=>({width:s.length*8}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});w.requestAnimationFrame=f=>(frames.push(f),frames.length);w.cancelAnimationFrame=()=>{};w.matchMedia=()=>({matches:true});w.confirm=()=>true;w.print=()=>{};for(const [k,v] of Object.entries(storage))w.localStorage.setItem(k,v)}});
 const w=dom.window,d=w.document,$=id=>d.getElementById(id),event=(e,type)=>e.dispatchEvent(new w.Event(type,{bubbles:true}));return{dom,w,d,$,errors,source,event,flush(){while(frames.length)frames.shift()(0)}};
}
(async()=>{
 const {firstBatch}=await import('./science/catalog.mjs'),{batch2}=await import('./science/batch2.mjs');
 for(const file of [...firstBatch,...batch2.map(t=>'science/'+t.id+'.html')]){
  const x=load(file),{$,d,event}=x;
  assert.ok(d.body.classList.contains('researcher-app'),file);assert.equal(d.querySelectorAll('h1').length,1);
  assert.equal($('lab-prepare').hidden,false);assert.equal($('lab-bench').hidden,true);
  const next=[...d.querySelectorAll('button')].find(b=>b.textContent==='接受任務，進入操作台 →');next.click();assert.equal($('lab-bench').hidden,false);assert.equal($('lab-prepare').hidden,true);
  const note=$('study-note');note.value='研究員的觀察草稿';event(note,'input');
  [...d.querySelectorAll('.lab-nav button')][2].click();assert.equal($('lab-notebook').hidden,false);assert.equal(note.value,'研究員的觀察草稿');
  [...d.querySelectorAll('.lab-nav button')][1].click();assert.equal(note.value,'研究員的觀察草稿');
  assert.equal(d.querySelectorAll('main>.lab-screen:not([hidden])').length,1);
  const ids=[...d.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length,file+' IDs');
  for(const img of d.querySelectorAll('img[src]')){const u=new URL(img.getAttribute('src'),'https://www.bhcs.com.tw/tools/'+file);assert.ok(fs.existsSync(path.join(root,decodeURIComponent(u.pathname))),file+' image '+img.src)}
  x.w.dispatchEvent(new x.w.Event('beforeprint'));assert.match($('lab-print-note').textContent,/研究員的觀察草稿/);
  if(file.startsWith('science/')){
   const conf=JSON.parse($('lab-config').textContent);$('prediction').value=$('prediction').options[1].value;$('run').click();
   $('explanation-input').value='這段解釋不能消失';event($('explanation-input'),'input');const c=conf.controls.find(c=>!c.options),el=$('ctl-'+c.key);el.value=c.max;event(el,'input');assert.equal($('explanation-input').value,'這段解釋不能消失');
   $('prediction').value=$('prediction').options[1].value;$('run').click();const explore=$('lab-explore')||$('moon-explore');assert.equal(explore.disabled,false);explore.checked=true;event(explore,'change');el.value=c.min;event(el,'input');assert.ok($('diagram').querySelector('svg'));assert.equal($('prediction').value,'');assert.equal($('add-record').disabled,true);assert.equal($('explanation-input').value,'這段解釋不能消失');
   explore.checked=false;event(explore,'change');assert.equal($('diagram').querySelector('svg'),null);
   for(let i=0;i<3;i++){d.querySelector(`[data-mission="${i}"]`).click();assert.equal(d.querySelector('label[for=prediction]').textContent,conf.tasks[i].prediction.question);$('prediction').value=$('prediction').options[1].value;$('run').click();assert.ok($('diagram').querySelector('svg'))}
  }
  await Promise.resolve();assert.deepEqual(x.errors,[],file);x.dom.window.close();
 }
 console.log('PASS 20 researcher workflows: routing, asset links, note persistence, print snapshot, task questions and exploration');
 const m=load('microscope-lab.html'),{$,d,event}=m;assert.equal($('specimen').value,'letter');$('prediction').value='narrower';$('begin').click();assert.doesNotMatch($('status').textContent,/預測正確|預測需要修正/);
 $('addRecord').click();assert.doesNotMatch($('records').textContent,/細胞核|葉綠體/);
 const code=m.source.match(/function featureScreen\([^\n]+/)[0],pos=vm.runInNewContext(code+';[featureScreen(-65,0,0,0,4),featureScreen(-65,0,-70,0,4)]');assert.ok(pos[1].x>pos[0].x,'Slide left must move image right');assert.equal(d.querySelector('[name=q2][value=a]').closest('fieldset').dataset.answer,'a');
 $('autofocus').click();$('obj40').checked=true;event($('obj40'),'change');assert.match($('status').textContent,/觀察支持你的預測/);
 assert.deepEqual(m.errors,[]);m.dom.window.close();
 for(const file of firstBatch){const src=fs.readFileSync(path.join(root,'tools',file),'utf8'),key=src.match(/function loadRecords\(\)[\s\S]*?localStorage.getItem\('([^']+)'\)/)?.[1];assert.ok(key);const x=load(file,{storage:{[key]:'{"bad":"shape"}'}});assert.deepEqual(x.errors,[],file+' invalid record shape');x.dom.window.close()}
 console.log('PASS microscope answer/model consistency, delayed reveal, letter records and first-batch invalid storage shapes');
 for(const id of ['optics','energy']){const x=load('science/'+id+'.html'),{$,d,event}=x;const conf=JSON.parse($('lab-config').textContent);$('prediction').value=$('prediction').options[1].value;$('run').click();$('lab-explore').checked=true;event($('lab-explore'),'change');const handle=$('diagram').querySelector('[data-lab-drag]');assert.ok(handle);const control=$('ctl-'+handle.dataset.labDrag),before=+control.value;handle.dispatchEvent(new x.w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));assert.notEqual(+control.value,before);assert.equal($('add-record').disabled,true);assert.deepEqual(x.errors,[]);x.dom.window.close()}
 console.log('PASS direct object keyboard manipulation updates the model without creating a stale record');
 // Independent expected outcomes, not reusing the implementation's answer function.
 for(const [id,task,changes,answer] of [['optics',0,{},'less'],['wave-sound',0,{f:680},'less'],['energy',0,{},'equal'],['energy',1,{},'greater'],['energy',2,{},'equal'],['plant-exchange',1,{humidity:80},'less'],['ecosystem',0,{efficiency:20},'greater']]){
  const x=load('science/'+id+'.html'),{$,d,event}=x;d.querySelector(`[data-mission="${task}"]`).click();for(const [k,v] of Object.entries(changes)){$('ctl-'+k).value=v;event($('ctl-'+k),'input')}$('prediction').value=answer;$('run').click();assert.match($('status').textContent,/預測符合本模型/,id);x.dom.window.close();
 }
 console.log('PASS seven task-specific predictions against independently calculated expectations');
})().catch(e=>{console.error(e);process.exitCode=1});
