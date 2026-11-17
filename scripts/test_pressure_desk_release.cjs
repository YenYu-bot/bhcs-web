'use strict';
// Source/DOM regression only; synthesized pointer events do not test native scrolling.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');

const dist = path.resolve(__dirname,'../tools/lab/pressure');
const src = name => fs.readFileSync(path.join(dist,name),'utf8');
const html = src('index.html'), css = src('style.css');
assert.match(html, /name="robots" content="noindex,nofollow"/);
assert.match(html, /只做數位模擬，課堂不操作真實水銀/);
assert.match(html, /相對壓力以大氣壓為零；絕對壓力以真空為零/);
assert.match(css, /\[data-pressure-probe\],\.pressure-figure \[data-pressure-piston\]\{touch-action:none/);
for (const relative of ['../../../assets/science/props/bg-physics-bench.webp','../../mini-lab/img/doc-point.png']) {
  assert.ok(css.includes(relative),relative);
  assert.ok(fs.existsSync(path.resolve(dist,relative)),relative);
}

const KEY = 'bhcs.lab.pressure.bench.v1', OTHER = 'bhcs.lab.mirror.view.v1';
function open(storage = new Map([[OTHER,'preserve']])) {
  const {window:w} = new JSDOM(html,{url:'https://example.test/tools/lab/pressure/',runScripts:'outside-only'});
  const d = w.document, q = s => {const el=d.querySelector(s); assert.ok(el,s); return el;};
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}});
  w.SVGSVGElement.prototype.getScreenCTM = () => ({inverse:()=>({})});
  w.DOMPoint = class {constructor(x,y){Object.assign(this,{x,y});} matrixTransform(){return {x:(this.x-13)/2,y:(this.y-17)/2};}};
  for(const dlg of d.querySelectorAll('dialog')){
    dlg.showModal=()=>dlg.setAttribute('open','');
    dlg.close=v=>{dlg.returnValue=v;dlg.removeAttribute('open');dlg.dispatchEvent(new w.Event('close'));};
  }
  for(const name of ['diagram.js','app.js']) w.eval(src(name));
  const host=q('#pressure-diagram');
  let pointer=null;
  host.setPointerCapture=id=>{pointer=id;};
  host.hasPointerCapture=id=>pointer===id;
  host.releasePointerCapture=id=>{if(pointer===id)pointer=null;};
  const emit=(type,target,x,y,id=3)=>{
    const e=new w.Event(type,{bubbles:true,cancelable:true});
    for(const [k,v] of Object.entries({button:0,pointerId:id,clientX:13+2*x,clientY:17+2*y})) Object.defineProperty(e,k,{value:v});
    target.dispatchEvent(e);
  };
  const click=s=>q(s).click(), setup=(s,v)=>{const el=q(s);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
  return {w,d,q,host,click,setup,emit,storage,captured:()=>pointer,readings:()=>[...d.querySelectorAll('#readings strong')].map(e=>e.textContent),mode:()=>q('#pressure-diagram svg').dataset.pressureDiagram};
}

const a=open();
const {q,d,host,click,setup,emit,readings,mode,captured,storage} = a;
const values=(...v)=>assert.deepEqual(readings(),v);
assert.equal(mode(),'torricelli');
values('101.3 kPa','76.0 cm');
assert.ok(q('#act').disabled);
assert.equal(d.querySelectorAll('[data-pressure-air-arrow="down"]').length,2);
assert.ok(q('[data-mercury-vacuum]'));
setup('#air-pressure','60'); values('60.0 kPa','45.0 cm');
setup('#air-pressure','110'); values('110.0 kPa','82.5 cm');
click('[data-air="80"]'); values('80.0 kPa','60.0 cm'); click('#act');
assert.equal(mode(),'water');
values('0.0 kPa','101.3 kPa');
assert.match(q('#evidence-text').textContent,/相對壓力是 0，但絕對壓力仍是大氣壓/);
assert.equal(q('[data-pressure-gauge]').getAttribute('data-gauge-kpa'),'0');
const probeY=()=>+q('[data-pressure-probe]').getAttribute('data-pressure-probe-y');
const grabProbe=()=>emit('pointerdown',q('[data-pressure-probe]'),157,probeY());
emit('pointerdown',host,100,100); emit('pointermove',host,100,190);
assert.equal(captured(),null); values('0.0 kPa','101.3 kPa');
grabProbe(); assert.equal(captured(),3);
emit('pointermove',host,157,probeY()+79,99); values('0.0 kPa','101.3 kPa');
emit('pointermove',host,157,probeY()+79); values('9.8 kPa','111.1 kPa');
emit('pointercancel',host,157,probeY()); assert.equal(captured(),null);
assert.equal(host.classList.contains('is-dragging'),false);
grabProbe(); emit('pointermove',host,157,999); values('19.6 kPa','120.9 kPa');
emit('pointerup',host,157,probeY()); assert.equal(captured(),null);
click('[data-depth="0"]'); values('0.0 kPa','101.3 kPa');
click('[data-depth="2"]'); click('#act');
assert.equal(mode(),'gas');
values('1.00 L','101.3 kPa');
const gx=()=>+q('[data-pressure-piston-grip]').getAttribute('data-pressure-piston-grip');
const grabSyringe=()=>emit('pointerdown',q('[data-pressure-piston-grip]'),gx(),125);
assert.ok(q('[data-pressure-sealed-nozzle]'));
assert.ok(q('[data-pressure-barrel-rear]'));
assert.ok(gx()>278,'Grip must be outside the barrel rear');
const particleCount=()=>d.querySelectorAll('[data-pressure-particle]').length;
assert.equal(particleCount(),24);
emit('pointerdown',host,120,190); emit('pointermove',host,180,180); assert.equal(captured(),null); values('1.00 L','101.3 kPa');
grabSyringe(); emit('pointermove',host,gx()-55,125); values('0.75 L','135.1 kPa');
emit('pointercancel',host,gx(),125); assert.equal(captured(),null);
grabSyringe(); emit('pointermove',host,gx()-55,125); values('0.50 L','202.6 kPa'); assert.equal(particleCount(),24);
emit('pointerup',host,gx(),125); assert.equal(captured(),null);
click('[data-volume="1"]'); values('1.00 L','101.3 kPa');
click('[data-volume="0.5"]'); click('#act');
const answers=[1,1,0,2];
const quiz=(session,i,j)=>session.d.querySelectorAll('#questions fieldset')[i].querySelectorAll('button')[j].click();
answers.forEach((j,i)=>quiz(a,i,j));
assert.match(q('#done').textContent,/四題全對/);
assert.match(d.querySelectorAll('#questions fieldset')[2].textContent,/水面絕對壓力仍為 101.3 kPa/);
const persisted=JSON.parse(storage.get(KEY));
assert.deepEqual(persisted.records[0],[0,1,2]);
assert.deepEqual(persisted.records[1],[1,.75,.5]);
assert.ok(persisted.records[3].includes(80));
assert.equal(storage.get(OTHER),'preserve');
const restored=open(storage);
assert.match(restored.q('#done').textContent,/四題全對/);
assert.match(restored.q('#notebook').textContent,/120.9 kPa/);
restored.click('#clear'); restored.q('#clear-dialog').close('cancel');
assert.match(restored.q('#done').textContent,/四題全對/);
restored.click('#clear'); restored.q('#clear-dialog').close('clear');
assert.equal(restored.mode(),'torricelli'); assert.equal(storage.get(OTHER),'preserve');
const legacy = open(new Map([[KEY,JSON.stringify({records:{0:[0,1,2],1:[1,.75,.5]},answers:{0:1,1:0,2:2}})]]));
assert.equal(legacy.mode(),'torricelli'); legacy.click('[data-air="80"]'); legacy.click('#act');
assert.equal(legacy.d.querySelectorAll('#questions fieldset [aria-pressed=true]').length,3);
quiz(legacy,0,1); assert.match(legacy.q('#done').textContent,/四題全對/);
assert.deepEqual(JSON.parse(legacy.storage.get(KEY)).records[0],[0,1,2]);
for(const session of [a,restored,legacy]) session.w.close();
console.log('Pressure desk: barometer, water gauge/absolute, gas, pointer cancellation, quiz, reload, one-station reset and v1 same-origin restore passed.');
