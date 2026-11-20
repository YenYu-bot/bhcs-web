const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM,VirtualConsole}=require('jsdom');const axe=require('axe-core');
const root=path.resolve(__dirname,'..');const {readSciencePage}=require('./science-page.cjs');
function load(file,{saved=null,blocked=false}={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const html=readSciencePage(file);
 const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://www.bhcs.com.tw/'+file+'?noga=1',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.print=()=>{};w.confirm=()=>true;if(saved)Object.entries(saved).forEach(([k,v])=>w.localStorage.setItem(k,v));if(blocked)Object.defineProperty(w,'localStorage',{get(){throw new Error('Storage blocked')}})}});
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
 const {dom,errors}=load('tools/science/index.html'),d=dom.window.document;structural(d,'tools/science/index.html');
 const declaredResources=JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent).hasPart;
 assert.ok(Array.isArray(declaredResources)&&declaredResources.length>0,'science directory resource declaration missing');
 const resources=[...d.querySelectorAll('.resource')];assert.equal(resources.length,declaredResources.length,'science directory cards differ from declaration');
 const biologyCount=resources.filter(c=>c.dataset.subject==='生物').length;assert.ok(biologyCount>0,'biology filter has no matching resources');
 d.getElementById('subject').value='生物';d.getElementById('subject').dispatchEvent(new dom.window.Event('input'));assert.equal(resources.filter(c=>!c.hidden).length,biologyCount);
 d.getElementById('search').value='不存在的單元';d.getElementById('search').dispatchEvent(new dom.window.Event('input'));assert.equal(d.getElementById('empty').hidden,false);d.getElementById('clearFilters').click();assert.equal(resources.filter(c=>!c.hidden).length,declaredResources.length);assert.deepEqual(errors,[]);dom.window.close();console.log('PASS directory filters, no-results, clear, links');
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
