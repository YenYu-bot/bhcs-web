import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {solveCircuit,TERMINALS,FIXED_CIRCUITS,CHALLENGE_BASES} from '../assets/circuit-guided/model.js';
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
const LAYOUTS=Object.values(R.BENCH_LAYOUTS);
const ownRect=(L,id)=>{const o=R.terminalOwner(id),r=L[o];return id==='bat+'?r.cap:r};
const onEdge=(r,p)=>{const inX=p.x>=r.x-1&&p.x<=r.x+r.w+1,inY=p.y>=r.y-1&&p.y<=r.y+r.h+1;return(inX&&inY)&&(Math.abs(p.x-r.x)<=1||Math.abs(p.x-r.x-r.w)<=1||Math.abs(p.y-r.y)<=1||Math.abs(p.y-r.y-r.h)<=1)};
function routeAll(L,wires){const others=[];return wires.map(w=>{const r=R.routeWire(w.from,w.to,{layout:L.name,others});const o={from:w.from,to:w.to,pts:r.pts,d:r.d};others.push(o);return o})}
const inRect=(r,[x,y],m=0)=>x>r.x-m&&x<r.x+r.w+m&&y>r.y-m&&y<r.y+r.h+m;
const TEACHING={...FIXED_CIRCUITS,challenge2:CHALLENGE_BASES[2].wires,challenge3:CHALLENGE_BASES[3].wires};
test('every terminal is attached to the edge of its own instrument in both layouts',()=>{
 for(const L of LAYOUTS){assert.deepEqual(Object.keys(L.terminals).sort(),[...TERMINALS].sort());
  for(const id of TERMINALS)assert.ok(onEdge(ownRect(L,id),L.terminals[id]),L.name+' '+id+' floats away from its body')}
 assert.deepEqual(R.TERMINAL_POSITIONS['bat+'],{x:R.BENCH_LAYOUTS.landscape.terminals['bat+'].x,y:R.BENCH_LAYOUTS.landscape.terminals['bat+'].y});
});
test('switch, lamp and meter terminals keep their left/right and polarity meaning on screen',()=>{
 for(const L of LAYOUTS){const t=L.terminals;
  for(const [a,b] of [['sw.a','sw.b'],['L1.a','L1.b'],['L2.a','L2.b'],['A.+','A.-'],['V.+','V.-']])assert.ok(t[a].x<t[b].x,L.name+' '+a+' left of '+b);
  assert.ok(t['bat+'].y<t['bat-'].y,L.name+' battery + on top')}
});
test('teaching circuits: cables never run through other instruments, lamp labels or foreign terminals',()=>{
 for(const L of LAYOUTS){const ob=R.benchObstacles(L);
  for(const [name,ws] of Object.entries(TEACHING))for(const c of routeAll(L,ws)){
   const own=new Set([R.terminalOwner(c.from),R.terminalOwner(c.to)]);
   for(const p of c.pts){
    assert.ok(p[0]>=4&&p[1]>=4&&p[0]<=L.width-4&&p[1]<=L.height-4,L.name+' '+name+' '+c.from+'→'+c.to+' leaves the bench');
    for(const r of ob.bodies)if(!own.has(r.owner))assert.ok(!inRect(r,p,2),L.name+' '+name+' '+c.from+'→'+c.to+' crosses '+r.owner);
    for(const r of ob.labels)if(r.owner==='L1'||r.owner==='L2')assert.ok(!inRect(r,p,0),L.name+' '+name+' '+c.from+'→'+c.to+' crosses '+r.owner+' label');
    for(const id of TERMINALS)if(id!==c.from&&id!==c.to){const t=L.terminals[id];assert.ok(Math.hypot(t.x-p[0],t.y-p[1])>=26,L.name+' '+name+' '+c.from+'→'+c.to+' passes terminal '+id)}
   }}}
});
test('lamp state separates not wired, one end only, wired but dark, and lit; lamp 2 tray follows the same three steps',()=>{
 const st=(t,id)=>t.host.querySelector('[data-lamp="'+id+'"] [data-role="lamp-state"]').textContent,bay=t=>t.host.querySelector('[data-role="spare-lamp-bay"]');
 const t=mount(view(raw('baseline',false)));assert.equal(st(t,'L2'),'未接線');assert.equal(bay(t).dataset.state,'spare');assert.equal(st(t,'L1'),'熄滅','both ends wired, switch open');
 const oneEnd={wires:[...FIXED_CIRCUITS.baseline.map(w=>({...w})),{from:'L1.b',to:'L2.a'}],switchClosed:true};t.bench.update(view(oneEnd));
 assert.equal(st(t,'L2'),'只接一端');assert.equal(bay(t).dataset.state,'partial');assert.match(bay(t).textContent,/還差一端/);assert.equal(st(t,'L1'),'基準亮度');
 assert.match(t.host.querySelector('[data-role="stage"]').getAttribute('aria-label'),/燈泡 2 只接一端/);
 t.bench.update(view(raw('trial1',false)));assert.equal(st(t,'L2'),'熄滅');assert.equal(bay(t).dataset.state,'working');
 t.bench.update(view(raw('trial1',true)));assert.equal(st(t,'L2'),'較暗');
 const lone=mount(view({wires:[{from:'L1.a',to:'bat+'}],switchClosed:true}));assert.equal(st(lone,'L1'),'只接一端');
});
test('the cable that half-wires lamp 2 never cuts through the tray label',()=>{
 for(const L of LAYOUTS){const lab=R.benchObstacles(L).labels.find(r=>r.owner==='L2'&&r.w>=150);assert.ok(lab,'tray label keep-out sized for longest wording');
  const half=[...FIXED_CIRCUITS.baseline,{from:'L1.b',to:'L2.a'}];for(const c of routeAll(L,half))for(const p of c.pts)assert.ok(!inRect(lab,p,0),L.name+' '+c.from+'→'+c.to+' crosses the tray label')}
});
test('baseline (lamp 1 only) cables keep out of the lamp 2 spare tray and the voltmeter gap',()=>{
 for(const L of LAYOUTS){const ob=R.benchObstacles(L);
  for(const c of routeAll(L,FIXED_CIRCUITS.baseline)){for(const p of c.pts)assert.ok(!inRect(ob.tray,p,4),L.name+' '+c.from+'→'+c.to+' enters spare tray');
   if(R.terminalOwner(c.from)!=='voltmeter'&&R.terminalOwner(c.to)!=='voltmeter')for(const p of c.pts)assert.ok(!inRect(ob.measure,p,0),L.name+' '+c.from+'→'+c.to+' runs through the voltmeter gap')}}
});
test('two cables never share the same track away from a common terminal',()=>{
 for(const L of LAYOUTS)for(const [name,ws] of Object.entries(TEACHING)){const cs=routeAll(L,ws);
  for(let i=0;i<cs.length;i++)for(let j=i+1;j<cs.length;j++){const shared=[cs[i].from,cs[i].to].filter(x=>x===cs[j].from||x===cs[j].to).map(id=>L.terminals[id]);
   let run=0,worst=0;for(const p of cs[i].pts){const nearT=shared.some(t=>Math.hypot(t.x-p[0],t.y-p[1])<62);const close=!nearT&&cs[j].pts.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<9);run=close?run+1:0;worst=Math.max(worst,run)}
   assert.ok(worst<4,L.name+' '+name+' '+cs[i].from+'→'+cs[i].to+' overlaps '+cs[j].from+'→'+cs[j].to)}}
});
test('touch/mouse hit targets never overlap at any width that uses each layout',()=>{
 const check=(L,width,hit)=>{const k=width/L.width,t=Object.entries(L.terminals);
  for(let i=0;i<t.length;i++)for(let j=i+1;j<t.length;j++){const dx=Math.abs(t[i][1].x-t[j][1].x)*k,dy=Math.abs(t[i][1].y-t[j][1].y)*k;assert.ok(dx>=hit-2||dy>=hit-2,L.name+'@'+width+' '+t[i][0]+'/'+t[j][0])}
  const b=L.switch.button,bw=(hit===56?104:96)/2,bh=(hit===56?48:44)/2;for(const [id,p] of t){const dx=Math.abs(p.x-b[0])*k,dy=Math.abs(p.y-b[1])*k;assert.ok(dx>=bw+hit/2-2||dy>=bh+hit/2-2,L.name+'@'+width+' switch button covers '+id)}};
 for(const w of[600,720,920])check(R.BENCH_LAYOUTS.landscape,w,48);
 for(const w of[300,344,390,460])check(R.BENCH_LAYOUTS.portrait,w,56);
 assert.equal(R.PORTRAIT_BELOW,600);
});
test('narrow benches render the portrait bench (no sideways scrolling) with the same twelve buttons',()=>{
 const dom=new JSDOM('<main id="h"></main>',{pretendToBeVisual:true}),host=dom.window.document.getElementById('h'),b=R.createCircuitBench(host,{layout:'portrait'});b.update(view(raw('trial1',true)));
 assert.equal(b.layout(),'portrait');assert.equal(host.querySelector('svg').getAttribute('viewBox'),'0 0 360 664');
 assert.equal(host.querySelectorAll('[data-terminal]').length,12);
 const L=R.BENCH_LAYOUTS.portrait,l2=host.querySelector('[data-terminal="L2.b"]');assert.equal(l2.style.left,(L.terminals['L2.b'].x/L.width*100).toFixed(4)+'%');
 assert.equal(host.querySelectorAll('.cgg-wire').length,FIXED_CIRCUITS.trial1.length);
 const css=fs.readFileSync(root+'assets/circuit-guided/circuit-guided.css','utf8');assert.doesNotMatch(css,/min-width:600px;max-width:none|overflow-x:auto/);
});
test('meters show their reading on the instrument and match the readout cards',()=>{
 const t=mount(view(raw('trial1',true)));
 assert.equal(t.host.querySelector('[data-role="ammeter-display"]').textContent,'0.5 A');assert.equal(t.host.querySelector('[data-role="voltmeter-display"]').textContent,'3.0 V');
 assert.equal(t.host.querySelector('[data-role="ammeter-value"]').textContent,'0.5 A');
});
test('each cable has a matching colour chip in the wire list and colours stay put when another cable is removed',()=>{
 const t=mount(view(raw('baseline',true))),col=k=>t.host.querySelector('[data-wire="'+k+'"]').getAttribute('data-colour'),chip=k=>t.host.querySelector('[data-wire-row="'+k+'"] .cgg-wire-swatch').getAttribute('data-colour');
 const keep='L1.b|bat-',before=col(keep);assert.ok(before);assert.equal(new Set(FIXED_CIRCUITS.baseline.map(w=>col([w.from,w.to].sort().join('|')))).size,FIXED_CIRCUITS.baseline.length,'each cable has its own colour');
 for(const w of FIXED_CIRCUITS.baseline){const k=[w.from,w.to].sort().join('|');assert.ok(R.CABLE_COLOURS.includes(col(k)));assert.equal(col(k),chip(k))}
 const fewer={wires:FIXED_CIRCUITS.baseline.filter(w=>!(w.from==='bat+'&&w.to==='sw.a')).map(w=>({...w})),switchClosed:true};t.bench.update(view(fewer));
 assert.equal(col(keep),before);assert.equal(t.host.querySelectorAll('.cgg-wire').length,FIXED_CIRCUITS.baseline.length-1);
});
test('wiring hint explains the click-pair method, names the chosen terminal and says when wiring is locked',()=>{
 const t=mount(view({wires:[],switchClosed:false})),hint=t.host.querySelector('[data-role="wire-hint"]');
 assert.match(hint.textContent,/先點一個端點/);assert.match(hint.textContent,/交叉的導線並沒有接在一起/);
 t.bench.element.setAttribute('data-wire-start','bat+');t.bench.update(view({wires:[],switchClosed:false}));assert.match(hint.textContent,/已選「電池正極」/);
 t.bench.element.removeAttribute('data-wire-start');t.bench.update(view({wires:[],switchClosed:false},true));assert.match(hint.textContent,/鎖定/);
});
test('bench region is labelled for keyboard users and is not a sideways scroll container',()=>{
 const t=mount(view(raw('baseline')));
 assert.equal(t.bench.element.getAttribute('role'),'region');
 assert.match(t.bench.element.getAttribute('aria-label'),/方向鍵/);
 assert.equal(t.bench.element.hasAttribute('tabindex'),false);
});
console.log('circuit-guided render: '+n+' tests passed');
