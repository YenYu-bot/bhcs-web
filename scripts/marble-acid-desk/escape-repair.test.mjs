// Additional authorized cancellation regression tests; the original six marble UI cases remain unchanged in marble-ui.test.mjs.
// Actual application DOM wiring tests. JSDOM is not native device/visual evidence.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);const {JSDOM}=req('jsdom');
const root=new URL('../../tools/science/reaction-rate-desk/',import.meta.url),KEY='bhcs.marbleAcidDesk.v1';let sequence=0;
async function flush(){for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));}
async function mount(raw=null,{locks=true,comparisonWidth=null,oldWidthMutant=false}={}){const html=await fs.readFile(new URL('../reaction-rate.html',root),'utf8'),dom=new JSDOM(html,{url:'https://qa.invalid/',pretendToBeVisual:true});const w=dom.window;let frame=null;let queue=Promise.resolve();if(locks)Object.defineProperty(w.navigator,'locks',{value:{request(_name,opts,fn){const callback=typeof opts==='function'?opts:fn;const job=queue.then(callback);queue=job.catch(()=>{});return job;}}});if(raw!==null)w.localStorage.setItem(KEY,raw);w.localStorage.setItem('other-station','untouched');w.localStorage.setItem('bhcs.reactionRateDesk.v1','legacy exact raw');w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLElement.prototype.setPointerCapture=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};const globals={window:w,document:w.document,navigator:w.navigator,localStorage:w.localStorage,requestAnimationFrame:cb=>{frame=cb;return 1;},cancelAnimationFrame:()=>{frame=null;},confirm:()=>true,Event:w.Event,HTMLElement:w.HTMLElement};for(const[k,v]of Object.entries(globals))Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});if(comparisonWidth!==null)Object.defineProperty(w.document.getElementById('comparison-graph'),'clientWidth',{value:comparisonWidth});try{if(oldWidthMutant){let source=await fs.readFile(new URL('app.mjs',root),'utf8');assert.ok(source.includes("Math.max(250,$('comparison-graph').clientWidth||700)"));source=source.replace("Math.max(250,$('comparison-graph').clientWidth||700)","Math.max(240,$('comparison-graph').clientWidth||700)").replace(/from '\.\/([^']+)'/g,(_m,path)=>`from '${new URL(path,root).href}'`);await import('data:text/javascript;base64,'+Buffer.from(source+`\n// mutant ${++sequence}`).toString('base64'));}else await import(new URL(`app.mjs?dom=${++sequence}`,root));await flush();}catch(error){dom.window.close();throw error;}const $=id=>w.document.getElementById(id),click=id=>$(id).click(),change=(id,value)=>{const el=$(id);el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}));},radio=(name,value)=>{const el=w.document.querySelector(`[name="${name}"][value="${value}"]`);el.checked=true;el.dispatchEvent(new w.Event('change',{bubbles:true}));};return {dom,w,$,click,change,radio,tickAfter:ms=>{const cb=frame;assert.ok(cb);frame=null;cb(performance.now()+ms);},raw:()=>w.localStorage.getItem(KEY),data:()=>JSON.parse(w.localStorage.getItem(KEY)).payload,close:()=>dom.window.close()};}
async function seal(h){h.click('desk-action');h.click('finish');h.click('desk-action');await flush();}
function selectTrial(h,index=1){const c=h.$('records').querySelectorAll('article')[index];[...c.querySelectorAll('button')].find(b=>b.textContent==='選這張比較').click();}
async function answers(h,time=20){h.change('evidence-time',String(time));h.radio('faster','trial');h.w.document.querySelector('[data-check="speed"]').click();h.click('show-ends');h.radio('final','same');h.w.document.querySelector('[data-check="final"]').click();h.change('factor','size');h.change('direction','faster');const c=h.w.document.querySelector('[name=controls]');c.checked=true;c.dispatchEvent(new h.w.Event('change',{bubbles:true}));h.w.document.querySelector('[data-check="fair"]').click();await flush();}
async function pair(h,size='granule'){await seal(h);h.w.document.querySelector(`[data-size="${size}"]`).click();await seal(h);selectTrial(h);}

// JSDOM does not synthesize pointer compatibility clicks: dispatch that sequence explicitly.
function materialPointer(h,button,type,{id=1,kind='mouse',x=150,y=150}={}){
 const e=new h.w.Event(type,{bubbles:true});
 Object.assign(e,{pointerId:id,pointerType:kind,isPrimary:true,button:0,clientX:x,clientY:y});
 button.dispatchEvent(e);
}
function materialClick(h,button,{id=1,kind='mouse'}={}){
 const e=new h.w.MouseEvent('click',{bubbles:true,detail:1});
 Object.assign(e,{pointerId:id,pointerType:kind});button.dispatchEvent(e);
}
function startMaterialDrag(h,button,options={}){
 h.$('drop-zone').getBoundingClientRect=()=>({left:100,right:300,top:100,bottom:300});
 materialPointer(h,button,'pointerdown',{...options,x:10,y:10});
 materialPointer(h,button,'pointermove',options);
 assert.equal(button.classList.contains('is-dragging'),true);
 assert.equal(h.$('drop-zone').classList.contains('drop-over'),true);
}
for(const cancel of ['Escape','pointercancel','lostpointercapture','resize']){
 test(`material ${cancel} cancels the gesture through delayed pointerup and compatibility click`,async()=>{
  const h=await mount();try{
   await seal(h);h.click('desk-action');h.click('step');await flush();
   const button=h.w.document.querySelector('[data-size="granule"]'),before=h.raw(),time=h.$('desk-time').textContent;
   startMaterialDrag(h,button);
   if(cancel==='Escape')h.w.dispatchEvent(new h.w.KeyboardEvent('keydown',{key:'Escape'}));
   else if(cancel==='resize')h.w.dispatchEvent(new h.w.Event('resize'));
   else materialPointer(h,button,cancel);
   assert.equal(button.classList.contains('is-dragging'),false);
   assert.equal(h.$('drop-zone').classList.contains('drop-over'),false);
   await new Promise(r=>setTimeout(r,10));
   materialPointer(h,button,'pointerup');materialClick(h,button);await flush();
   assert.equal(h.$('change-dialog').open,false,'canceled gesture must not open replacement');
   assert.equal(h.$('desk-time').textContent,time);assert.equal(h.raw(),before);
   assert.equal(button.getAttribute('aria-pressed'),'false');
   // A new intentional click must not inherit suppression, even with reused pointer ID.
   materialPointer(h,button,'pointerdown');materialPointer(h,button,'pointerup');materialClick(h,button);
   assert.equal(h.$('change-dialog').open,true);
  }finally{h.close();}
 });
}
for(const next of ['mouse','touch','keyboard']){
 test(`Escape without a trailing click preserves the next intentional ${next} activation`,async()=>{
  const h=await mount();try{
   const button=h.w.document.querySelector('[data-size="granule"]');startMaterialDrag(h,button);
   h.w.dispatchEvent(new h.w.KeyboardEvent('keydown',{key:'Escape'}));
   materialPointer(h,button,'pointerup');
   if(next==='keyboard')button.click();
   else {materialPointer(h,button,'pointerdown',{kind:next});materialPointer(h,button,'pointerup',{kind:next});materialClick(h,button,{kind:next});}
   assert.equal(button.getAttribute('aria-pressed'),'true');assert.equal(h.$('change-dialog').open,false);
  }finally{h.close();}
 });
}
test('normal material drop requests replacement once, ignores delayed compatibility click, and preserves keyboard access',async()=>{
 const h=await mount();try{
  await seal(h);h.click('desk-action');h.click('step');
  const button=h.w.document.querySelector('[data-size="granule"]');startMaterialDrag(h,button);
  materialPointer(h,button,'pointerup');assert.equal(h.$('change-dialog').open,true);
  h.click('change-cancel');await new Promise(r=>setTimeout(r,10));materialClick(h,button);
  assert.equal(h.$('change-dialog').open,false);
  button.click();assert.equal(h.$('change-dialog').open,true);
 }finally{h.close();}
});
test('unrelated pointer cancellation does not cancel the active material drag',async()=>{
 const h=await mount();try{
  const button=h.w.document.querySelector('[data-size="granule"]');startMaterialDrag(h,button);
  materialPointer(h,button,'pointercancel',{id:2});materialPointer(h,button,'lostpointercapture',{id:2});
  assert.equal(button.classList.contains('is-dragging'),true);
  materialPointer(h,button,'pointerup');materialClick(h,button);
  assert.equal(button.getAttribute('aria-pressed'),'true');
 }finally{h.close();}
});
test('touch Esc cancellation and outside drops do not select a material; fresh clicks still do',async()=>{
 const h=await mount();try{
  const button=h.w.document.querySelector('[data-size="granule"]');
  startMaterialDrag(h,button,{kind:'touch',id:17});
  h.w.dispatchEvent(new h.w.KeyboardEvent('keydown',{key:'Escape'}));
  materialPointer(h,button,'pointerup',{kind:'touch',id:17});materialClick(h,button,{kind:'touch',id:17});
  assert.equal(button.getAttribute('aria-pressed'),'false');
  materialPointer(h,button,'pointerdown',{x:10,y:10});
  materialPointer(h,button,'pointermove',{x:50,y:50});
  materialPointer(h,button,'pointerup',{x:50,y:50});materialClick(h,button);
  assert.equal(button.getAttribute('aria-pressed'),'false');
  materialPointer(h,button,'pointerdown');materialPointer(h,button,'pointerup');materialClick(h,button);
  assert.equal(button.getAttribute('aria-pressed'),'true');
 }finally{h.close();}
});
test('Escape before the drag threshold also cancels the pending material click',async()=>{
 const h=await mount();try{
  const button=h.w.document.querySelector('[data-size="granule"]');
  materialPointer(h,button,'pointerdown');h.w.dispatchEvent(new h.w.KeyboardEvent('keydown',{key:'Escape'}));
  materialPointer(h,button,'pointerup');materialClick(h,button);
  assert.equal(button.getAttribute('aria-pressed'),'false');
 }finally{h.close();}
});
