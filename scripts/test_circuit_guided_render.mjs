import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {solveCircuit,TERMINALS,FIXED_CIRCUITS} from '../assets/circuit-guided/model.js';
import * as R from '../assets/circuit-guided/render.js';
let n=0;const test=(name,fn)=>{fn();n++;console.log('PASS',name)},root=fileURLToPath(new URL('..',import.meta.url));
const fmt=(x,u)=>x===null?'—':x.value.toFixed(1)+' '+u;
function raw(name,closed=false){return{wires:FIXED_CIRCUITS[name].map(w=>({...w})),switchClosed:closed}}
function view(x,locked=false,extra={}){const r=solveCircuit(x);return{locked,switchClosed:x.switchClosed===true,wires:x.wires.map(w=>({...w})),status:r.status,lamps:{L1:{brightness:r.lamps.L1.brightness,bypassed:r.lamps.L1.bypassed},L2:{brightness:r.lamps.L2.brightness,bypassed:r.lamps.L2.bypassed}},ammeter:{state:r.ammeter.state,text:fmt(r.ammeter.reading,'A')},voltmeter:{state:r.voltmeter.state,text:fmt(r.voltmeter.reading,'V')},...extra}}
function mount(m){const dom=new JSDOM('<!doctype html><body><main id="h"></main></body>',{pretendToBeVisual:true}),host=dom.window.document.getElementById('h'),bench=R.createCircuitBench(host);bench.update(m);return{dom,host,bench,doc:dom.window.document}}
test('terminal vocabulary matches model',()=>{assert.deepEqual([...R.TERMINAL_IDS],[...TERMINALS]);for(const id of TERMINALS){const p=R.TERMINAL_POSITIONS[id];assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y),id)}});
test('bench has twelve native endpoints, switch, two lamps, two meters and wire list without imposing page heading levels',()=>{const t=mount(view(raw('baseline')));assert.equal(t.host.querySelectorAll('[data-terminal]').length,12);assert.ok([...t.host.querySelectorAll('[data-terminal]')].every(x=>x.tagName==='BUTTON'));assert.equal(t.host.querySelectorAll('[data-switch-toggle]').length,1);assert.equal(t.host.querySelectorAll('[data-lamp]').length,2);assert.equal(t.host.querySelectorAll('[data-meter]').length,2);assert.equal(t.host.querySelectorAll('[data-wire-row]').length,FIXED_CIRCUITS.baseline.length);assert.equal(t.bench.element.querySelectorAll('h1,h2,h3,h4,h5,h6').length,0)});
test('endpoint labels expose component and polarity',()=>{const t=mount(view(raw('baseline')));assert.equal(t.host.querySelector('[data-terminal="bat+"]').getAttribute('aria-label'),'電池正極');assert.equal(t.host.querySelector('[data-terminal="A.-"]').getAttribute('aria-label'),'電流表負端');assert.equal(t.host.querySelector('[data-terminal="V.+"]').textContent.trim(),'+')});
test('updates patch in place and preserve focus',()=>{const t=mount(view(raw('baseline'))),b=t.host.querySelector('[data-terminal="L1.a"]');b.focus();t.bench.update(view(raw('baseline',true)));assert.strictEqual(t.host.querySelector('[data-terminal="L1.a"]'),b);assert.strictEqual(t.doc.activeElement,b);assert.equal(t.host.querySelector('[data-switch-toggle]').getAttribute('aria-pressed'),'true');assert.equal(t.host.querySelector('[data-role="ammeter-value"]').textContent,'1.0 A');assert.equal(t.host.querySelector('[data-role="voltmeter-value"]').textContent,'6.0 V')});
test('wire rows are readable and removable by accessible native buttons',()=>{const t=mount(view({wires:[{from:'bat+',to:'sw.a'}],switchClosed:false})),row=t.host.querySelector('[data-wire-row]'),rm=row.querySelector('[data-remove-wire]');assert.match(row.textContent,/電池正極.*開關左端/);assert.equal(rm.getAttribute('data-from'),'bat+');assert.equal(rm.getAttribute('data-to'),'sw.a');assert.match(rm.getAttribute('aria-label'),/移除.*電池正極.*開關左端/)});
test('locked bench disables endpoints switch and removal controls',()=>{const t=mount(view(raw('baseline'),true));assert.ok([...t.host.querySelectorAll('[data-terminal]')].every(x=>x.disabled));assert.equal(t.host.querySelector('[data-switch-toggle]').disabled,true);assert.ok([...t.host.querySelectorAll('[data-remove-wire]')].every(x=>x.disabled))});
test('lamp state always has a non-colour word',()=>{let t=mount(view(raw('baseline')));assert.equal(t.host.querySelector('[data-lamp="L1"] [data-role="lamp-state"]').textContent,'熄滅');t=mount(view(raw('trial1',true)));assert.equal(t.host.querySelector('[data-lamp="L1"] [data-role="lamp-state"]').textContent,'較暗');assert.equal(t.host.querySelector('[data-lamp="L2"] [data-role="lamp-state"]').textContent,'較暗')});
test('ideal two-path lamps are exactly baseline brightness',()=>{const t=mount(view(raw('trial2Total',true)));assert.equal(t.host.querySelector('[data-lamp="L1"]').dataset.brightness,'reference');assert.equal(t.host.querySelector('[data-lamp="L2"]').dataset.brightness,'reference');assert.equal(t.host.querySelector('[data-lamp="L1"] [data-role="lamp-state"]').textContent,'基準亮度')});
test('source short is a word plus patterned warning and never prints non-finite current',()=>{const t=mount(view({wires:[{from:'bat+',to:'A.+'},{from:'A.-',to:'bat-'}],switchClosed:true}));assert.equal(t.bench.element.dataset.status,'source-short');assert.equal(t.host.querySelector('[data-role="status"]').dataset.unsafe,'true');assert.match(t.host.querySelector('[data-role="status"]').textContent,/安全警示/);assert.ok(!/Infinity|NaN/.test(t.bench.element.textContent))});
test('renderer ignores answer and topology extras',()=>{const t=mount(view(raw('baseline',true),false,{topology:'series',correct:true,expectedAnswer:'parallel'})),all=t.bench.element.textContent+' '+[...t.bench.element.querySelectorAll('[aria-label],[title]')].map(x=>(x.getAttribute('aria-label')||'')+(x.getAttribute('title')||'')).join(' ');assert.doesNotMatch(all,/串聯|並聯|等效電阻|歐姆定律|series|parallel|expectedAnswer|correct/i)});
test('bad presentation models fail loudly',()=>{const dom=new JSDOM('<main id="h"></main>'),b=R.createCircuitBench(dom.window.document.getElementById('h')),good=view(raw('baseline'));for(const bad of[null,{}, {...good,status:'wat'},{...good,wires:[{from:'wat',to:'bat+'}]},{...good,lamps:{...good.lamps,L1:{brightness:'wat'}}}])assert.throws(()=>b.update(bad))});
test('CSS locks desktop/mobile hit sizes and accessibility modes',()=>{const css=fs.readFileSync(root+'assets/circuit-guided/circuit-guided.css','utf8');assert.match(css,/\.cgg-terminal\{[^}]*width:48px[^}]*height:48px[^}]*touch-action:none/);assert.match(css,/@media\(max-width:600px\)[\s\S]*?\.cgg-terminal\{[^}]*width:56px[^}]*height:56px/);assert.match(css,/\.cgg-stage\{[^}]*touch-action:auto/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/@media\(forced-colors:active\)/);assert.match(css,/\.cgg-status\[data-unsafe="true"\][^}]*repeating-linear-gradient/)});
test('renderer is standalone and has no formal-concept wording',()=>{const src=fs.readFileSync(root+'assets/circuit-guided/render.js','utf8');assert.ok(!/^\s*import\s/m.test(src));for(const w of['solveCircuit(','structureGate(','measurementGate(','localStorage','sessionStorage','bhcsScienceTrack','fetch('])assert.ok(!src.includes(w),w);assert.doesNotMatch(src,/串聯|並聯|等效電阻|歐姆定律/)});
test('destroy removes the bench',()=>{const t=mount(view(raw('baseline')));t.bench.destroy();assert.equal(t.host.children.length,0)});

test('L2 unconnected baseline is clearly distinguished from an extinguished wired lamp',()=>{
 const t=mount(view(raw('baseline',true)));
 assert.equal(t.host.querySelector('[data-lamp="L2"] [data-role="lamp-state"]').textContent,'未接線');
 assert.equal(t.host.querySelector('[data-terminal="L2.a"]').dataset.connected,'false');
 assert.equal(t.host.querySelector('[data-terminal="L1.a"]').dataset.connected,'true');
 assert.equal(t.host.querySelectorAll('[data-bay]').length,2);
});
test('negative ammeter reading explains polarity correction instead of claiming valid observation',()=>{
 const t=mount(view(raw('baseline',true),false,{ammeter:{state:'ok',text:'-1.0 A'}}));
 assert.match(t.host.querySelector('[data-role="status"]').textContent,/正負極接反/);
 assert.match(t.host.querySelector('[data-role="status"]').textContent,/交換電流表兩端/);
});
test('L1 voltmeter leads do not cross L2 terminal centers and wiring remains raw',()=>{
 const left=R.wirePath('V.+','L1.a'),right=R.wirePath('V.-','L1.b');
 assert.match(left,/365 390/);assert.match(right,/665 390/);
 assert.doesNotMatch(left,/440 240/);assert.doesNotMatch(right,/590 240/);
 const t=mount(view(raw('baseline',true)));
 assert.equal(t.host.querySelectorAll('.cgg-wire').length,FIXED_CIRCUITS.baseline.length);
});

test('spare L2 workspace is explicit, stable and activates only after learner connects L2',()=>{
 const t=mount(view(raw('baseline',true)));
 const bay=t.host.querySelector('[data-role="spare-lamp-bay"]');
 assert.equal(bay.getAttribute('data-state'),'spare');
 assert.match(bay.textContent,/備用器材區/);
 assert.match(bay.textContent,/尚未接入/);
 const terminal=t.host.querySelector('[data-terminal="L2.a"]');
 const oldLeft=terminal.style.left,oldTop=terminal.style.top;
 t.bench.update(view(raw('trial1',true)));
 assert.equal(bay.getAttribute('data-state'),'working');
 assert.match(bay.textContent,/實驗器材區/);
 assert.equal(terminal.style.left,oldLeft);
 assert.equal(terminal.style.top,oldTop);
 t.bench.update(view(raw('baseline',true)));
 assert.equal(bay.getAttribute('data-state'),'spare');
});
test('baseline L1 supply and return avoid spare L2 region and false L1.a connection',()=>{
 const supply=R.wirePath('A.-','L1.a'),ret=R.wirePath('L1.b','bat-');
 assert.match(supply,/350 240 L 350 90/);
 assert.match(ret,/590 14 L 324 14 L 324 390/);
 assert.doesNotMatch(ret,/440 90/);
 assert.doesNotMatch(supply,/440 240|590 240/);
});
test('all baseline cable polylines avoid the reserved L2 equipment rectangle',()=>{
 const spare={left:393,top:182,right:641,bottom:327};
 const baseline=FIXED_CIRCUITS.baseline;
 function points(d){
   const commands=d.match(/[MLHV]|-?\d+(?:\.\d+)?/g)||[];
   let x=0,y=0,i=0,out=[];
   while(i<commands.length){
     const c=commands[i++];
     if(c==='M'||c==='L'){x=Number(commands[i++]);y=Number(commands[i++]);out.push([x,y]);}
     else if(c==='H'){x=Number(commands[i++]);out.push([x,y]);}
     else if(c==='V'){y=Number(commands[i++]);out.push([x,y]);}
     else throw Error('unexpected wire route: '+d);
   }
   return out;
 }
 function crosses(a,b){
   if(a[0]===b[0])return a[0]>spare.left&&a[0]<spare.right&&Math.max(Math.min(a[1],b[1]),spare.top)<Math.min(Math.max(a[1],b[1]),spare.bottom);
   if(a[1]===b[1])return a[1]>spare.top&&a[1]<spare.bottom&&Math.max(Math.min(a[0],b[0]),spare.left)<Math.min(Math.max(a[0],b[0]),spare.right);
   // Only baseline routes may use a straight diagonal when it stays outside the equipment bay.
   for(let t=0;t<=100;t++){const x=a[0]+(b[0]-a[0])*t/100,y=a[1]+(b[1]-a[1])*t/100;if(x>spare.left&&x<spare.right&&y>spare.top&&y<spare.bottom)return true;}
   return false;
 }
 for(const wire of baseline){
   const d=R.wirePath(wire.from,wire.to),p=points(d);
   for(let i=1;i<p.length;i++)assert.equal(crosses(p[i-1],p[i]),false,wire.from+' → '+wire.to+' enters L2 spare bay: '+d);
 }
});
console.log('circuit-guided render: '+n+' tests passed');
