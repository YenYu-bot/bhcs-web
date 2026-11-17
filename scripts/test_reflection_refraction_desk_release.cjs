'use strict';
const A = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const dist = path.resolve(__dirname, '../tools/lab/reflection-refraction');
const wait = (ms=150)=>new Promise(r=>setTimeout(r,ms));

function open(store=new Map(), deny=false) {
  const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
  const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only', pretendToBeVisual:true});
  const {window:w}=dom,d=w.document, q=s=>{const e=d.querySelector(s);A.ok(e,'Missing '+s);return e;};
  const setInput=(s,v)=>{
    const e=q(s); e.value=String(v);
    e.dispatchEvent(new w.Event('input',{bubbles:true}));
    e.dispatchEvent(new w.Event('change',{bubbles:true}));
  };
  Object.defineProperty(w,'matchMedia',{value:()=>({matches:true, addEventListener(){}, removeEventListener(){}})});
  w.HTMLElement.prototype.scrollIntoView=function (){};
  Object.defineProperty(w,'localStorage',{value:{
    getItem:k=>store.get(k)??null,setItem:(k,v)=>{if(deny)throw Error('blocked');store.set(k,String(v))},
    removeItem:k=>{if(deny)throw Error('blocked');store.delete(k)}
  }});
  for(const dlg of d.querySelectorAll('dialog')){
    dlg.showModal=()=>dlg.setAttribute('open','');
    dlg.close=v=>{dlg.returnValue=v;dlg.removeAttribute('open');dlg.dispatchEvent(new w.Event('close'));};
  }
  const scripts=[...d.querySelectorAll('script[src]')].map(e=>e.getAttribute('src'));
  A.ok(scripts.length,'App should include scripts');
  for(const s of scripts){A.match(s,/^(?:\.\/)?[\w.-]+\.js$/);w.eval(fs.readFileSync(path.join(dist,s),'utf8'));}
  return { dom,w,d,q,txt:s=>q(s).textContent.trim(),click:s=>q(s).click(),setInput,close:()=>w.close(),store };
}


// Geometry in the accepted SVG and mechanics in the ported standalone desk.
{
const {window:w}=new JSDOM('',{runScripts:'outside-only'});
w.eval(fs.readFileSync(path.join(dist,'diagram.js'),'utf8'));
const line=(svg,sel)=>[...svg.querySelectorAll(sel)].map(x=>x.getAttribute('d')).filter(x=>/^M [0-9.]+ [0-9.]+ L [0-9.]+ [0-9.]+$/.test(x)).map(d=>d.match(/[0-9.]+/g).map(Number));
const near=(a,b,d=0.03)=>A.ok(Math.abs(a-b)<d,a+' !≈ '+b);
const O=[210,134];
const render=(angle,from,to,outcome,refracted)=>{
 const c={scene:outcome==='mirror'?'mirror':'refraction',angle,from,to,outcome,reflected:angle,refracted};
 const doc=new w.DOMParser().parseFromString(w.LightDiagram.apparatus(c),'image/svg+xml');
 A.equal(doc.querySelector('parsererror'),null);const s=doc.documentElement;
 A.match(s.getAttribute('aria-label'),/法線/);
 const normal=line(s,'path[stroke-dasharray="5 5"]');A.equal(normal.length,1);
 near(normal[0][0],O[0]);near(normal[0][2],O[0]);
 const incident=line(s,'path[stroke="#943226"][stroke-linecap="round"]');A.equal(incident.length,1);
 const [x,y,ox,oy]=incident[0];near(ox,O[0]);near(oy,O[1]);A.ok(y<oy);near(Math.atan2(ox-x,oy-y)*180/Math.PI,angle);
 const ref=line(s,'path[stroke-dasharray="7 5"][stroke-linecap="round"]');A.equal(ref.length,1);
 const [px,py,rx,ry]=ref[0];near(px,ox);near(py,oy);A.ok(ry<oy);near(Math.atan2(rx-ox,oy-ry)*180/Math.PI,angle);
 const trans=line(s,'path[stroke="#126b68"][stroke-linecap="round"]');
 if(refracted===null){A.equal(trans.length,0);return s;}
 A.equal(trans.length,1);const [qx,qy,tx,ty]=trans[0];near(qx,ox);near(qy,oy);near(Math.atan2(tx-ox,ty-oy)*180/Math.PI,refracted);
 A.ok(outcome==='critical'?ty===oy:ty>oy);
 return s;
};
render(20,'air','glass','mirror',null);render(40,'air','glass','mirror',null);
render(0,'air','glass','refract',0);
render(30,'air','glass','refract',19.471220634);
render(30,'air','water','refract',22.082413194);
render(30,'glass','air','refract',48.590377891);
render(41.810314896,'glass','air','critical',90);
A.match(render(45,'glass','air','tir',null).getAttribute('aria-label'),/全反射.*沒有折射光/);
console.log('PASS diagram 8 cases: ray endpoints, angles from normal, critical tangent, TIR without transmitted segment.');
w.close();

}
const key='bhcs-lab-light-path-trial-v1';
function summary(){return '鏡面 20/40；空氣→玻璃 0/19.47；空氣→水 22.08；玻璃→空氣 48.59；臨界 90；45° 全反射及無折射；鎖步、比對、答題、重開、取消與清空。';}
async function flow(a){
 A.match(a.q('meta[name="robots"]').content,/noindex/);
 A.match(a.txt('#progress'),/1\s*\/\s*6/);
 A.equal(a.d.querySelectorAll('.lab .primary:not([hidden])').length,1);
 let step0=a.q('#steps [data-step]'),stepLast=a.d.querySelector('#steps [data-step]:last-child'); A.ok(stepLast && stepLast!==step0); stepLast.click();
 A.match(a.txt('#progress'),/1\s*\/\s*6/);
 const initial=[['20','20'],['40','40'],['0','0'],['30','19.47'],['30','22.08'],['30','48.59'],['41.81','90'],['45',null]];
 const seen=[];
 for(let i=0;i<32;i++) {
  if(!a.q('#challenge').hidden)break;
  const label=a.txt('#act');
  if (/記下/.test(label)){
    const [input,expected]=initial[seen.length]??[];
    A.ok(input!==undefined,'Attempt to record unexpected ninth observation: '+label);
    const reading=a.txt('#reading');
    const values=[...reading.matchAll(/(?:\d+(?:\.\d+)?)\s*°/g)].map(e=>Number(e[0].replace(/\s*°/,'')));
    A.ok(values.includes(Number(input)),reading);
    if (expected!==null) A.ok(values.includes(Number(expected)),reading);
    if(seen.length<3) A.ok(values.filter(v=>v===Number(input)).length>=2,reading);
    if(seen.length===7) {
      A.match(reading,/沒有折射|無折射|全反射/);
      A.ok(!values.includes(90),reading);
    }
    seen.push(reading);
  }
  A.ok(label,'Primary missing before quiz');a.click('#act');await wait(50);
 }
 A.equal(seen.length,8,seen.join('\n'));
 A.ok(!a.q('#challenge').hidden,'Failed to unlock challenge');
 A.equal(a.d.querySelectorAll('#notebook tbody tr').length,8,'Notebook should contain eight unique observations');
 A.deepEqual([...a.d.querySelectorAll('#notebook tbody tr')].map(e=>e.dataset.record),['m20','m40','g0','g30','w30','r30','crit','tir']);
 a.click('[data-step="2"]');A.match(a.txt('#compare'),/19\.47°/);A.match(a.txt('#compare'),/22\.08°/);
 const beforeReplay=a.store.get(key);
 a.click('#redo');a.click('#act');a.click('#act');
 A.equal(a.store.get(key),beforeReplay,'Replaying a completed stage must not write/duplicate records');
 a.click('[data-step="5"]');
 const answer=(i,j)=>a.click('[data-answer="'+i+':'+j+'"]');
 answer(0,0);A.doesNotMatch(a.txt('#done'),/完成/);
 answer(0,1);answer(1,2);answer(2,0);A.match(a.txt('#done'),/完成/);
 A.ok(a.store.has(key),'No station-specific store');
}
async function runGuidedFlow(){
 const store=new Map([['unrelated','kept']]);
 const a=open(store),stale=open(store);await flow(a);
 const last=store.get(key);
 stale.click('#act');A.match(stale.txt('#notice'),/未儲存/);
 A.equal(store.get(key),last,'Stale tab overwrote saved records');
 stale.click('#resync');A.match(stale.txt('#done'),/完成/);
 const blocked=open(new Map(),true);blocked.click('#act');A.match(blocked.txt('#notice'),/無法儲存/);A.ok(!blocked.store.has(key));
 const reload=open(store);A.match(reload.txt('#done'),/完成/);
 A.equal(reload.d.querySelectorAll('#notebook tbody tr').length,8);
 const dlg=reload.q('#clear-dialog');
 reload.click('#clear');A.ok(dlg.open);dlg.close('cancel');A.ok(store.has(key));A.match(reload.txt('#done'),/完成/);
 reload.click('#clear');A.ok(dlg.open);dlg.close('clear');A.equal(store.get('unrelated'),'kept');
 A.match(reload.txt('#progress'),/1\s*\/\s*6/);
 A.ok(reload.q('#challenge').hidden);A.equal(reload.d.querySelectorAll('#notebook tbody tr').length,0);
 console.log('PASS',summary());
 a.close();reload.close();stale.close();blocked.close();
}

const store=new Map();
const a=open(store),read=()=>[...a.d.querySelectorAll('#reading .metric strong')].map(s=>s.textContent);
const recordKeys=()=>[...a.d.querySelectorAll('#notebook [data-record]')].map(e=>e.dataset.record);
const act=()=>a.click('#act');
const angle=v=>a.setInput('#angle',v);
const html=()=>a.q('#diagram svg').outerHTML;
const record=()=>{A.match(a.txt('#act'),/記下/);act();};
const math=(n1,n2,i)=>(Math.asin(n1*Math.sin(i*Math.PI/180)/n2)*180/Math.PI).toFixed(2)+'°';
(async()=>{
 const input=a.q('input#angle[type="range"]');
 A.deepEqual([input.min,input.max,input.step],['0','75','0.1']);
 A.ok(a.d.querySelector('#diagram [data-angle-handle]'),'Beam must have an SVG drag handle');
 // jsdom lacks SVG layout/pointer APIs; use a 2× offset CTM to exercise screen-to-diagram math.
 const svgPrototype=a.w.SVGSVGElement.prototype;
 svgPrototype.getScreenCTM=()=>({inverse:()=>({})});
 svgPrototype.createSVGPoint=()=>({x:0,y:0,matrixTransform(){return {x:(this.x-13)/2,y:(this.y-29)/2};}});
 const pointer=(type,target,id,degrees)=>{
   const ev=new a.w.Event(type,{bubbles:true,cancelable:true});
   const radians=degrees*Math.PI/180;
   const props={button:0,pointerId:id,clientX:13+2*(210-100*Math.sin(radians)),clientY:29+2*(134-100*Math.cos(radians))};
   for(const [name,value] of Object.entries(props))Object.defineProperty(ev,name,{value});
   target.dispatchEvent(ev);return ev;
 };
 const panel=a.q('#diagram');
 A.ok(pointer('pointerdown',a.q('#diagram circle[data-angle-handle]'),5,20).defaultPrevented);
 pointer('pointermove',panel,6,52.6);A.deepEqual(read().map(parseFloat),[20,20]);
 pointer('pointermove',panel,5,27.6);A.deepEqual(read().map(parseFloat),[27.6,27.6]);
 pointer('pointermove',panel,5,34.2);A.deepEqual(read().map(parseFloat),[34.2,34.2]);
 A.equal(+input.value,34.2);
 pointer('pointercancel',panel,5,34.2);pointer('pointermove',panel,5,53.1);
 A.ok(pointer('pointerdown',a.q('#diagram circle[data-angle-handle]'),5,34.2).defaultPrevented);
 pointer('pointermove',panel,5,53.1);A.deepEqual(read().map(parseFloat),[53.1,53.1]);
 pointer('pointermove',panel,5,34.2);pointer('pointerup',panel,5,34.2);
 A.deepEqual(read().map(parseFloat),[34.2,34.2]);A.deepEqual(recordKeys(),[]);
 angle(20);
 const start=html();
 angle(23.4);A.match(a.txt('#angle-value'),/23\.4/);
 A.deepEqual(read().map(parseFloat),[23.4,23.4]);A.notEqual(html(),start);
 A.deepEqual(recordKeys(),[]);if(!a.q('#act').disabled) act();A.deepEqual(recordKeys(),[]);
 angle(20);record();A.deepEqual(recordKeys(),['m20']);
 angle(39.9);A.deepEqual(read().map(parseFloat),[39.9,39.9]);A.deepEqual(recordKeys(),['m20']);
 if(!a.q('#act').disabled) act();A.deepEqual(recordKeys(),['m20']);
 angle(40);record();act();
 for(let i=0;i<30&&!/任務 5/.test(a.txt('#progress'));i++){act();await wait(20);}
 A.match(a.txt('#progress'),/任務 5/);A.equal(recordKeys().length,6);
 A.match(a.txt('#act'),/臨界角/);
 angle(41.8);A.deepEqual(read().slice(0,2).map(parseFloat),[41.8,41.8]);
 A.equal(read()[2],math(1.5,1,41.8));
 A.equal(recordKeys().length,6);
 A.match(a.txt('#act'),/臨界角/);act();
 A.match(a.txt('#angle-value'),/41\.81|臨界/);A.equal(read()[2],'90°');
 A.match(a.q('#diagram svg').getAttribute('aria-label'),/沿介面/);record();
 angle(44);A.equal(read()[2],'無折射光');A.equal(recordKeys().length,7);
 angle(45);record();A.equal(recordKeys().length,8);
 A.match(store.get(key),/"crit".*"tir"/);
 console.log('PASS pointer drag and live 0.1° slider, arbitrary-angle non-recording, SVG updates, exact critical preset vs 41.8°, TIR and canonical records.');
 a.close();
 await runGuidedFlow();
})().catch(e=>{console.error(e);a.close();process.exit(1);});
