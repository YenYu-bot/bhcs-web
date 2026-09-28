import assert from 'node:assert/strict';
import {calculate,describe} from './science/models.mjs';
import {diagram} from './science/diagrams.mjs';
import {batch2} from './science/batch2.mjs';
import {JSDOM} from 'jsdom';
const defaults=id=>Object.fromEntries(batch2.find(t=>t.id===id).controls.map(c=>[c.key,c.value]));
const calc=(id,values={})=>calculate(id,{...defaults(id),...values});
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} != ${expected}`);
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};
test('Optics: real / focus singularity / virtual / negative f',()=>{
 close(calc('optics').v,15);close(calc('optics').m,-.5);
 assert.equal(calc('optics',{u:10}).v,null);assert.equal(calc('optics',{u:10}).kind,'focus');
 close(calc('optics',{u:5}).v,-10);close(calc('optics',{u:5}).m,2);
 close(calc('optics',{kind:'concave'}).v,-7.5);
});
test('Wave: wavelength / open fundamental / closed odd harmonics',()=>{
 close(calc('wave-sound').wavelength,1);
 assert.equal(calc('wave-sound',{mode:'open',f:170}).kind,'resonant');
 assert.equal(calc('wave-sound',{mode:'closed',f:85}).kind,'resonant');
 assert.equal(calc('wave-sound',{mode:'closed',f:170}).kind,'off');
 assert.equal(calc('wave-sound',{mode:'closed',f:255}).kind,'resonant');
});
test('Electromagnetism: zero / reversal / maximum emf at zero flux',()=>{
 close(calc('electromagnetism').field,4*Math.PI*1e-7*100/.2);
 assert.equal(calc('electromagnetism',{current:0}).kind,'zero');
 assert.equal(calc('electromagnetism',{current:-1}).kind,'negative');
 close(calc('electromagnetism',{mode:'motor',angle:0}).torque,0);
 close(calc('electromagnetism',{mode:'motor',angle:90}).torque,.2);
 close(calc('electromagnetism',{mode:'generator',rpm:0}).emf,0);
 close(calc('electromagnetism',{mode:'generator'}).emf,.2*2*Math.PI);
 close(calc('electromagnetism',{mode:'generator'}).flux,0);
});
test('Pressure: water zero / PV / continuity / Bernoulli',()=>{
 close(calc('pressure-fluid',{depth:0}).absolute,101300);
 close(calc('pressure-fluid').gauge,19600);
 close(calc('pressure-fluid',{mode:'gas',volume:.5}).absolute,202600);
 const flow=calc('pressure-fluid',{mode:'flow',ratio:.5});close(flow.v2,4);close(flow.absolute,95300);
 close(calc('pressure-fluid',{mode:'flow',speed:0,ratio:.4}).absolute,101300);
});
test('Electromagnetism diagram: zero field and signed reference axis',()=>{
 const base=defaults('electromagnetism');
 for(const mode of ['motor','generator']){
  const s={...base,mode,field:0},r=calculate('electromagnetism',s),svg=diagram('electromagnetism',s,r);
  assert.ok(svg.includes('B=0：沒有外加磁場'));assert.ok(!svg.includes('#8eabc1'));
  assert.ok(describe('electromagnetism',s,r).explanation.includes('外加磁場為零'));
  const positive=calculate('electromagnetism',{...base,mode,field:.2}),negative=calculate('electromagnetism',{...base,mode,field:-.2});
  close(positive.output,-negative.output);assert.ok(svg.includes('向右基準軸'));
  const fullTurn={...base,mode,angle:360};assert.ok(!describe('electromagnetism',fullTurn,calculate('electromagnetism',fullTurn)).metrics.some(([,value])=>/^-0(?:\s|$)/.test(value)),'Floating-point residue must not print negative zero');
 }
});
test('Electromagnetism diagram: front current and field obey the right-hand rule',()=>{
 const base=defaults('electromagnetism');
 for(const current of [-1,1]){
  const s={...base,mode:'magnet',current},r=calculate('electromagnetism',s),svg=diagram('electromagnetism',s,r);
  const front=svg.match(/data-front-current data-y1="([\d.]+)" data-y2="([\d.]+)"/);
  const field=svg.match(/data-field-arrow data-x1="([\d.]+)" data-x2="([\d.]+)"/);
  assert.ok(front&&field,'direction metadata must be present');
  const frontUp=Math.sign(+front[1]-+front[2]);
  const fieldRight=Math.sign(+field[2]-+field[1]);
  assert.equal(fieldRight,-frontUp,'front-side current and axial field must satisfy the right-hand rule');
  assert.match(svg,new RegExp(`aria-label="前側電流向${frontUp>0?'上':'下'}，N 極在${fieldRight>0?'右':'左'}"`));
  assert.match(svg,/粗實線：前半圈/);assert.match(svg,/淡線：後半圈/);
 }
 const zero={...base,mode:'magnet',current:0},svg=diagram('electromagnetism',zero,calculate('electromagnetism',zero));
 assert.ok(!svg.includes('data-front-current'));assert.ok(!svg.includes('data-field-arrow'));
});
test('Solubility: mass accounting / concentration / exact saturation',()=>{
 const r=calc('solubility');close(r.capacity,30);close(r.dissolved,30);close(r.solid,20);close(r.percent,30/130*100);
 assert.equal(calc('solubility',{soluteMass:30}).kind,'edge');
 close(calc('solubility',{soluteMass:0}).percent,0);
 close(calc('solubility',{temperature:60}).solid,0);
});
test('Energy: conservation / mass-independent speed / limiting loss',()=>{
 const r=calc('energy');close(r.total,19.6);close(r.potential,9.8);close(r.kinetic,9.8);
 close(calc('energy',{mass:2}).speed,r.speed);
 const loss=calc('energy',{loss:100,progress:100});close(loss.speed,0);close(loss.thermal,19.6);
});
test('Moon: phases / orbit tilt / node / not an ephemeris',()=>{
 close(calc('moon-eclipse').lit,.5);
 assert.equal(calc('moon-eclipse',{phase:0}).kind,'none');
 assert.equal(calc('moon-eclipse',{phase:0,node:0}).kind,'solar');
 assert.equal(calc('moon-eclipse',{phase:180,node:0}).kind,'lunar');
 close(calc('moon-eclipse',{phase:360}).lit,0);
});
test('Seasons: equator / solstice / polar day / pole-equinox singularity',()=>{
 close(calc('seasons',{latitude:0,season:0}).hours,12);
 close(calc('seasons').altitude,89.5);
 close(calc('seasons',{latitude:70}).hours,24);
 close(calc('seasons',{latitude:-70}).hours,0);
 assert.equal(calc('seasons',{latitude:90,season:0}).boundary,true);
 assert.equal(calc('seasons',{latitude:90,season:0}).hours,null);
 close(calc('seasons',{latitude:-90}).hours,0);
 close(calc('seasons',{latitude:24,tilt:0}).hours,12);
});
test('Plant exchange: dark respiration / humidity / closed stomata',()=>{
 close(calc('plant-exchange').photo,4.8);close(calc('plant-exchange').net,2.8);
 close(calc('plant-exchange',{light:0}).net,-2);
 close(calc('plant-exchange',{humidity:100}).transpiration,0);
 close(calc('plant-exchange',{stomata:0}).net,-2);
});
test('Plant exchange diagram: guard cells do not overlap and pore widens monotonically',()=>{
 const base=defaults('plant-exchange'),widths=[];
 for(const stomata of [0,50,100]){
  const s={...base,stomata},svg=diagram('plant-exchange',s,calculate('plant-exchange',s));
  const dom=new JSDOM(svg),paths=[...dom.window.document.querySelectorAll('.guard-cell')];
  assert.equal(paths.length,2);
  const xRange=d=>{const nums=[...d.matchAll(/[MC]([^MCZ]+)/g)].flatMap(m=>(m[1].match(/-?[\d.]+/g)||[]).map(Number));const xs=[];for(let i=0;i<nums.length;i+=2)xs.push(nums[i]);return [Math.min(...xs),Math.max(...xs)]};
  const left=xRange(paths[0].getAttribute('d')),right=xRange(paths[1].getAttribute('d'));
  assert.ok(left[1]<=right[0],`guard cells overlap at ${stomata}%`);widths.push(right[0]-left[1]);dom.window.close();
 }
 assert.deepEqual(widths,[0,28,56]);
});
test('Ecosystem: transfer / initial value / K / decline above K',()=>{
 assert.deepEqual(calc('ecosystem').energy.map(Math.round),[10000,1000,100]);
 close(calc('ecosystem',{time:0}).population,50);
 close(calc('ecosystem',{rate:0}).population,50);
 close(calc('ecosystem',{initial:200}).population,200);
 assert.equal(calc('ecosystem',{initial:300,capacity:100}).kind,'decline');
});
test('Atom builder: Na+ / Cl- / C-14 isotope / no electrons / element fixed by protons',()=>{
 const na=calc('atom-builder',{p:11,n:12,e:10});assert.equal(na.ion,'Na⁺');assert.equal(na.A,23);assert.deepEqual([...na.shells],[2,8]);assert.equal(na.kind,'cation');
 const cl=calc('atom-builder',{p:17,n:18,e:18});assert.equal(cl.ion,'Cl⁻');assert.equal(cl.A,35);assert.deepEqual([...cl.shells],[2,8,8]);assert.equal(cl.kind,'anion');
 const c=calc('atom-builder',{p:6,n:8,e:6});assert.equal(c.symbol,'C');assert.equal(c.A,14);assert.equal(c.kind,'neutral');assert.equal(c.isotope,'common');
 assert.equal(calc('atom-builder',{p:6,n:6,e:6}).isotope,'most');assert.equal(calc('atom-builder',{p:6,n:0,e:6}).isotope,'unusual');
 const z=calc('atom-builder',{p:9,n:10,e:0});assert.equal(z.shells.length,0);assert.equal(z.charge,9);
 assert.equal(calc('atom-builder',{p:12,n:12,e:10}).ion,'Mg²⁺');assert.equal(calc('atom-builder',{p:8,n:8,e:10}).ion,'O²⁻');
 for(let p=1;p<=20;p++)for(const e of [0,p,20]){const q=calc('atom-builder',{p,n:10,e});assert.equal(q.shells.reduce((a,b)=>a+b,0),e);assert.ok(q.shells.every((k,i)=>k<=[2,8,8,2][i]));
  const svg=diagram('atom-builder',{p,n:10,e},q);assert.equal((svg.match(/data-electron/g)||[]).length,e);assert.equal((svg.match(/data-current/g)||[]).length,1);}
});
test('Reflection and refraction: toward / away / TIR critical angle / normal incidence / mirror',()=>{
 const a=calc('reflection-refraction');assert.equal(Number(a.refraction.toFixed(2)),22.08);assert.equal(a.kind,'toward');close(a.reflection,30);
 const w=calc('reflection-refraction',{media:'water-air',incident:45});assert.equal(Number(w.refraction.toFixed(2)),70.13);assert.equal(w.kind,'away');
 const g=calc('reflection-refraction',{media:'glass-air',incident:45});assert.equal(g.kind,'tir');assert.equal(g.refraction,null);assert.equal(Number(g.critical.toFixed(2)),41.81);
 assert.equal(calc('reflection-refraction',{media:'glass-air',incident:40}).kind,'away');
 const z=calc('reflection-refraction',{incident:0});close(z.refraction,0);assert.equal(z.kind,'normal');
 const m=calc('reflection-refraction',{mode:'mirror',dist:20});close(m.image,20);assert.equal(m.kind,'mirror');
 for(const media of ['air-water','air-glass','water-air','glass-air'])for(let incident=0;incident<=85;incident+=5){const q=calc('reflection-refraction',{media,incident});
  if(q.kind!=='tir'){close(q.n1*Math.sin(incident*Math.PI/180),q.n2*Math.sin(q.refraction*Math.PI/180))}else assert.ok(incident>q.critical);
  const svg=diagram('reflection-refraction',{...defaults('reflection-refraction'),media,incident},q);assert.equal((svg.match(/data-normal/g)||[]).length,1);}
});
test('Reaction rate: baseline / +10°C doubles / catalyst keeps product / combined factors',()=>{
 const b=calc('reaction-rate');close(b.rate,1);close(b.time,300);close(b.product,5);assert.equal(b.kind,'same');
 const h=calc('reaction-rate',{temp:35});close(h.rate,2);close(h.time,150);assert.equal(h.kind,'faster');
 const c=calc('reaction-rate',{cat:'yes'});close(c.rate,4);close(c.product,5);
 close(calc('reaction-rate',{size:'powder',cat:'yes',conc:2}).rate,72);assert.equal(calc('reaction-rate',{temp:15}).kind,'slower');
 for(const size of ['lump','granule','powder'])for(const cat of ['none','yes'])for(const temp of [5,25,65])for(const amount of [1,10]){const q=calc('reaction-rate',{size,cat,temp,amount});close(q.product,amount);close(q.rate*q.time,amount*60);
  const svg=diagram('reaction-rate',{...defaults('reaction-rate'),size,cat,temp,amount},q),d=svg.match(/data-product-curve d="M[\d.]+,([\d.]+) L[\d.]+,([\d.]+) L[\d.]+,([\d.]+)"/);assert.ok(d);assert.equal(d[2],d[3],'curve ends flat at the same height');}
});
test('Pulley and incline: halving force doubles distance / incline ratio / L<h clamp / loss',()=>{
 const f=calc('pulley-incline');close(f.force,100);close(f.distance,1);assert.equal(f.kind,'ideal');
 const m=calc('pulley-incline',{mode:'movable'});close(m.force,50);close(m.distance,2);close(m.input,100);close(m.output,100);
 const b=calc('pulley-incline',{mode:'block',n:4});close(b.force,25);close(b.distance,4);close(b.input,100);
 close(calc('pulley-incline',{mode:'incline',len:1,h:1}).force,100);close(calc('pulley-incline',{mode:'incline',len:4,h:1}).force,25);
 const c=calc('pulley-incline',{mode:'incline',len:1,h:3});assert.equal(c.clamped,true);close(c.force,100);close(c.distance,3);
 const l=calc('pulley-incline',{mode:'movable',loss:20});close(l.force,62.5);close(l.input,125);close(l.output,100);assert.equal(l.kind,'lossy');
 for(const mode of ['fixed','movable','block','incline'])for(const n of [2,3,6])for(const loss of [0,25,50]){const q=calc('pulley-incline',{mode,n,loss});assert.ok(q.input>=q.output-1e-9);if(!loss)close(q.input,q.output);
  const svg=diagram('pulley-incline',{...defaults('pulley-incline'),mode,n,loss},q);if(mode==='block')assert.equal((svg.match(/stroke="#b54a5b" stroke-width="2"\/><text/g)||[]).length,n,'rope segments labelled 1…n');}
});
test('Lever torque: balanced default / slanted pull / sin symmetry / effective arm',()=>{
 const r=calc('lever-torque');close(r.left,2);close(r.right,2);assert.equal(r.kind,'balanced');close(r.effective,40);
 const s=calc('lever-torque',{angle:30});close(s.right,1);assert.equal(s.kind,'left');close(s.effective,20);
 const t=calc('lever-torque',{angle:150});close(t.right,s.right);assert.equal(t.kind,s.kind);
 assert.equal(calc('lever-torque',{d2:20}).kind,'left');assert.equal(calc('lever-torque',{d2:20,f2:10}).kind,'balanced');assert.equal(calc('lever-torque',{f2:6}).kind,'right');
 assert.equal(calc('lever-torque',{w1:5,angle:30}).kind,'balanced');
 for(const angle of [30,60,90,120,150])for(const d2 of [5,25,50]){const q=calc('lever-torque',{angle,d2}),svg=diagram('lever-torque',{...defaults('lever-torque'),angle,d2},q);
  const m=svg.match(/<line data-arm x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"/);assert.ok(m,'effective arm line missing');
  assert.ok(Math.abs(Math.hypot(m[3]-m[1],m[4]-m[2])/5.4-q.effective)<0.1,`arm ${angle} ${d2}`);}
});
test('Motion graphs: reversing / stops exactly at t / rest / area bookkeeping',()=>{
 const r=calc('motion-graphs');close(r.v,-10);close(r.x,0);close(r.path,20);assert.equal(r.kind,'reversing');close(r.turn,2);
 const e=calc('motion-graphs',{t:2});close(e.v,0);close(e.x,10);close(e.path,10);assert.equal(e.kind,'slowing');assert.equal(e.turn,null);
 const z=calc('motion-graphs',{v0:0,a:0});close(z.v,0);close(z.x,0);close(z.path,0);assert.equal(z.kind,'rest');
 assert.equal(calc('motion-graphs',{v0:5,a:0}).kind,'uniform');assert.equal(calc('motion-graphs',{v0:0,a:2}).kind,'speeding');assert.equal(calc('motion-graphs',{v0:-4,a:-1}).kind,'speeding');
 const n=calc('motion-graphs',{v0:-6,a:2,t:5});close(n.x,-5);close(n.pos,4);close(n.neg,9);close(n.path,13);close(n.turn,3);
 for(const v0 of [-10,-3,0,4,10])for(const a of [-5,-1.5,0,2.5,5])for(const t of [1,3,10]){const q=calc('motion-graphs',{v0,a,t});close(q.pos-q.neg,q.x);close(q.pos+q.neg,q.path);assert.ok(q.path>=Math.abs(q.x)-1e-9);
  const svg=diagram('motion-graphs',{v0,a,t},q);assert.equal((svg.match(/data-turn/g)||[]).length,q.kind==='reversing'?1:0);}
});
for(const t of batch2){
 test(t.id+': every control option, pairwise extrema and preset renders finite',()=>{
  const base=defaults(t.id),cases=[base,...t.tasks.map(task=>({...base,...task.values}))];
  for(const c of t.controls){const values=c.options?c.options.map(o=>o[0]):[c.min,c.value,c.max];for(const v of values)cases.push({...base,[c.key]:v});
   for(const d of t.controls.filter(d=>d.key!==c.key))for(const v of values)for(const w of d.options?d.options.map(o=>o[0]):[d.min,d.max])cases.push({...base,[c.key]:v,[d.key]:w});
  }
  for(const s of cases){const r=calculate(t.id,s),description=describe(t.id,s,r),svg=diagram(t.id,s,r);assert.ok(t.choices.some(c=>c[0]===r.kind));
   const finite=x=>{if(x===null)return;if(typeof x==='number')assert.ok(Number.isFinite(x),t.id);else if(Array.isArray(x))x.forEach(finite)};Object.values(r).forEach(finite);
   assert.ok(!/NaN|Infinity|undefined/.test(svg),t.id+' invalid SVG');assert.equal(description.metrics.length,4);
   if(t.id==='energy')close(r.potential+r.kinetic+r.thermal,r.total);
   if(t.id==='solubility')close(r.dissolved+r.solid,s.soluteMass);
  }
 });
}
console.log(`${tests} model groups passed`);
