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
test('Weather systems: NH low / NH high / SH low / typhoon / front temperature / drawn wind rotation',()=>{
 const l=calc('weather-systems');assert.equal(l.rotation,'ccw');assert.equal(l.flow,'in');assert.equal(l.vertical,'up');
 const h=calc('weather-systems',{system:'high'});assert.equal(h.rotation,'cw');assert.equal(h.flow,'out');assert.equal(h.vertical,'down');
 const sl=calc('weather-systems',{hemi:'south'});assert.equal(sl.rotation,'cw');assert.equal(sl.flow,'in');
 assert.equal(calc('weather-systems',{system:'typhoon'}).rotation,'ccw');
 assert.equal(calc('weather-systems',{mode:'front',front:'cold',phase:'after'}).afterTemp,'down');assert.equal(calc('weather-systems',{mode:'front',front:'warm',phase:'after'}).afterTemp,'up');assert.equal(calc('weather-systems',{mode:'front',front:'stationary'}).kind,'stationary');
 // 由圖上箭頭反算：位置向量 × 方向的 z 分量（y 向下）>0 為順時針；位置向量·方向 <0 為向內
 for(const hemi of ['north','south'])for(const system of ['high','low','typhoon']){const q=calc('weather-systems',{mode:'pressure',hemi,system}),svg=diagram('weather-systems',{...defaults('weather-systems'),mode:'pressure',hemi,system},q),ws=[...svg.matchAll(/data-wind="([^"]+)"/g)].map(m=>m[1].split(',').map(Number));assert.equal(ws.length,8);
  for(const [px,py,dx,dy] of ws){const rx=px-180,ry=py-214,cross=rx*dy-ry*dx,dot=rx*dx+ry*dy;assert.equal(cross>0?'cw':'ccw',q.rotation);assert.equal(dot<0?'in':'out',q.flow)}}
});
test('Stoichiometry: exact / limiting O2 / CaCO3 + HCl exact / zero / mass conservation',()=>{
 const a=calc('stoichiometry');close(a.molA,2);close(a.molB,1);assert.equal(a.kind,'exact');close(a.products[0][1],36);close(a.leftA,0);close(a.leftB,0);
 const b=calc('stoichiometry',{massB:16});assert.equal(b.kind,'limitB');close(b.products[0][1],18);close(b.leftA,2);
 const c=calc('stoichiometry',{reaction:'caco3',massA:10,massB:7.3});assert.equal(c.kind,'exact');close(c.products[2][1],4.4);
 assert.equal(calc('stoichiometry',{reaction:'mgo',massA:4.8,massB:3.2}).kind,'exact');assert.equal(calc('stoichiometry',{reaction:'nh3',massA:2.8,massB:0.6}).kind,'exact');
 assert.equal(calc('stoichiometry',{massA:0}).kind,'none');assert.equal(calc('stoichiometry',{massA:10,massB:10}).kind,'limitB');
 for(const reaction of ['h2o','mgo','caco3','nh3'])for(const massA of [0.1,0.3,4,7.3,55.5,100])for(const massB of [0.1,0.2,3.2,7.3,32,100]){const q=calc('stoichiometry',{reaction,massA,massB});close(q.before,q.after);assert.ok(q.leftA>=-1e-9&&q.leftB>=-1e-9);
  const svg=diagram('stoichiometry',{reaction,massA,massB},q);assert.ok(svg.includes('data-mass-check'));}
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
test('Circulation: resting / maximal output / pulmonary artery and vein / one bold vessel',()=>{
 const r=calc('circulation');close(r.hr,70);close(r.co,4.9);assert.equal(r.kind,'deoxygenated');assert.equal(r.circuit,'lung');
 const m=calc('circulation',{intensity:100});close(m.hr,180);close(m.sv,110);close(m.co,19.8);
 assert.equal(calc('circulation',{site:'pv'}).kind,'oxygenated');assert.equal(calc('circulation',{site:'aorta'}).circuit,'body');assert.equal(calc('circulation',{site:'vc'}).kind,'deoxygenated');
 let last=0;for(let intensity=0;intensity<=100;intensity+=10)for(const site of ['pa','pv','aorta','vc']){const q=calc('circulation',{intensity,site}),svg=diagram('circulation',{intensity,site},q);
  assert.equal((svg.match(/data-selected/g)||[]).length,1);assert.ok(svg.includes(`data-vessel="${site}" data-selected`));const flows=(svg.match(/data-flow/g)||[]).length;if(site==='pa'){assert.ok(flows>=last);last=flows}}
});
test('Nerve and reaction time: ruler drop times / reflex centre / voluntary path / numbered steps',()=>{
 assert.equal(Number(calc('nerve-reflex',{drop:19.6}).time.toFixed(3)),0.2);assert.equal(Number(calc('nerve-reflex',{drop:5}).time.toFixed(3)),0.101);close(calc('nerve-reflex',{drop:0}).time,0);
 const k=calc('nerve-reflex');assert.equal(k.kind,'reflex');assert.equal(k.center,'脊髓');assert.equal(k.viaBrain,false);
 const c=calc('nerve-reflex',{action:'catch'});assert.equal(c.kind,'voluntary');assert.equal(c.center,'大腦');assert.equal(c.viaBrain,true);
 assert.equal(calc('nerve-reflex',{action:'withdraw'}).painLater,true);
 for(const action of ['knee','withdraw','catch'])for(let drop=0;drop<=50;drop+=5){const q=calc('nerve-reflex',{action,drop}),svg=diagram('nerve-reflex',{action,drop},q);
  assert.equal((svg.match(/data-step=/g)||[]).length,q.steps);assert.equal(svg.includes('data-pain'),action==='withdraw');close(0.5*9.8*q.time*q.time,drop/100);}
});
test('Knee reflex receptor is a thigh muscle spindle, distinct from the tendon tap site',()=>{
 const s={...defaults('nerve-reflex'),action:'knee'},r=calculate('nerve-reflex',s);
 assert.match(r.path[0][1],/肌梭/,'knee reflex receptor must be a muscle spindle');
 assert.doesNotMatch(r.path[0][1],/肌腱/,'tendon tap site is not the receptor');
 const dom=new JSDOM(diagram('nerve-reflex',s,r)),d=dom.window.document;
 assert.match(d.querySelector('svg').textContent,/肌梭/);
 const receptor=d.querySelector('[data-step="1"] circle'),effector=d.querySelector('[data-step="5"] circle');
 const x=+receptor.getAttribute('cx'),y=+receptor.getAttribute('cy');
 assert.ok(x>150&&x<250&&y>260&&y<300,'receptor marker must sit at the thigh above the knee');
 assert.ok(Math.hypot(x-Number(effector.getAttribute('cx')),y-Number(effector.getAttribute('cy')))>=22,'receptor and effector markers must not overlap');
 dom.window.close();
});
test('Homeostasis: meal peak / insulin deficit / fasting exercise / steady / cold / drawn curve extremes',()=>{
 const n=calc('homeostasis');close(n.peak,130);assert.equal(n.recovery,2);assert.deepEqual([...n.hormones],['胰島素']);assert.equal(n.kind,'high');
 const l=calc('homeostasis',{insulin:'low'});close(l.peak,170);assert.equal(l.recovery,5);
 const x=calc('homeostasis',{carb:0,exercise:60});close(x.min,60);assert.deepEqual([...x.hormones],['升糖素']);assert.equal(x.kind,'low');
 const z=calc('homeostasis',{carb:0,exercise:0});close(z.peak,90);assert.equal(z.kind,'steady');assert.equal(z.recovery,0);
 const c=calc('homeostasis',{mode:'temp',env:10});assert.equal(c.kind,'cold');assert.equal(c.core,37);assert.equal(calc('homeostasis',{mode:'temp',env:35}).kind,'hot');assert.equal(calc('homeostasis',{mode:'temp',env:25}).kind,'neutral');
 // 從圖上曲線反算：最高點與最低點的血糖值要等於模型的峰值與最低值
 for(const carb of [0,50,100])for(const exercise of [0,30,60])for(const insulin of ['normal','low']){const s={...defaults('homeostasis'),mode:'glucose',carb,exercise,insulin},q=calc('homeostasis',s),svg=diagram('homeostasis',s,q);
  const ys=[...svg.match(/data-glucose d="M([^"]+)"/)[1].split(' L')].map(p=>Number(p.split(',')[1])),hi=Math.max(180,q.peak+10),g=y=>40+(330-y)*(hi-40)/260;
  assert.ok(Math.abs(g(Math.min(...ys))-q.peak)<1.5,`peak ${carb} ${exercise} ${insulin}`);assert.ok(Math.abs(g(Math.max(...ys))-q.min)<1.5,`min ${carb} ${exercise} ${insulin}`);}
});
test('Spring and friction: static follows pull / edge / kinetic drop / zero pull / Hooke extension',()=>{
 const base={mode:'block',mass:2,surface:'smooth'};
 const r=calc('spring-friction',{...base,pull:5});close(r.N,19.6);close(r.friction,5);assert.equal(r.kind,'rest');
 assert.equal(calc('spring-friction',{...base,pull:5.88}).kind,'edge');
 const m=calc('spring-friction',{...base,pull:10});close(m.friction,3.92);close(m.a,3.04);assert.equal(m.kind,'moving');
 close(calc('spring-friction',{...base,pull:0}).friction,0);
 const sp=calc('spring-friction',{mode:'spring',k:50,hang:0.5,limit:0.3});close(sp.x,0.098);assert.equal(sp.kind,'within');close(calc('spring-friction',{mode:'spring',k:50,hang:1,limit:0.3}).x,0.196);
 assert.equal(calc('spring-friction',{mode:'spring',k:10,hang:2,limit:0.3}).kind,'over');
 for(const surface of ['smooth','rough','rubber'])for(const mass of [0.5,2,10])for(const pull of [0,1,5.88,20,100]){const q=calc('spring-friction',{mode:'block',mass,surface,pull});assert.ok(q.friction<=q.fs+1e-9);assert.ok(q.fk<q.fs);if(q.kind==='moving')assert.ok(q.friction<pull);else close(q.friction,pull);}
});
test('New-wave diagrams keep every drawn element inside the 660 by 400 scene at control extremes',()=>{
 const ids=['motion-graphs','lever-torque','pulley-incline','reaction-rate','reflection-refraction','atom-builder','stoichiometry','weather-systems','circulation','nerve-reflex','homeostasis','spring-friction'];
 const attr=(a,k)=>Number((a.match(new RegExp(' '+k+'="([-\\d.]+)"'))||[,0])[1]);
 for(const id of ids){const t=batch2.find(x=>x.id===id),def=defaults(id);
  const lists=t.controls.map(c=>[c.key,c.options?c.options.map(o=>o[0]):[c.min,(c.min+c.max)/2,c.max].map(v=>Math.round(v/c.step)*c.step)]),combos=[{}];
  for(const [k,vs] of lists)for(const v of vs)combos.push({[k]:v});
  for(let i=0;i<lists.length;i++)for(let j=i+1;j<lists.length;j++)for(const a of lists[i][1])for(const b of lists[j][1])combos.push({[lists[i][0]]:a,[lists[j][0]]:b});
  for(const c of combos){const s={...def,...c},raw=diagram(id,s,calculate(id,s)),where=id+' '+JSON.stringify(c);
   for(const m of raw.matchAll(/<g transform="translate\(([-\d.]+),([-\d.]+)\)/g))assert.ok(+m[1]>=30&&+m[1]<=630&&+m[2]>=45&&+m[2]<=400,where+' group');
   const svg=raw.replace(/<g transform=[^>]*>[\s\S]*?<\/g>/g,'');
   for(const m of svg.matchAll(/<line([^>]*)>/g)){if(/stroke-width="1.5" stroke-dasharray="4 4"/.test(m[1]))continue;for(const e of ['1','2']){const x=attr(m[1],'x'+e),y=attr(m[1],'y'+e);assert.ok(x>=0&&x<=660&&y>=0&&y<=400,`${where} line end (${x},${y})`)}}
   for(const m of svg.matchAll(/<circle([^>]*)>/g)){const x=attr(m[1],'cx'),y=attr(m[1],'cy'),r=attr(m[1],'r');assert.ok(x-r>=-1&&x+r<=661&&y-r>=-1&&y+r<=401,`${where} circle (${x},${y})`)}
   for(const m of svg.matchAll(/<rect([^>]*)>/g)){const x=attr(m[1],'x'),y=attr(m[1],'y'),w=attr(m[1],'width'),h=attr(m[1],'height');assert.ok(w>=0&&h>=0&&x>=0&&y>=0&&x+w<=660&&y+h<=400,`${where} rect ${[x,y,w,h]}`)}
   for(const m of svg.matchAll(/<path d="([^"]*)"/g))for(const n of m[1].matchAll(/[ML]\s*([-\d.]+)[, ]([-\d.]+)/g))assert.ok(+n[1]>=0&&+n[1]<=660&&+n[2]>=0&&+n[2]<=400,`${where} path (${n[1]},${n[2]})`);
   for(const m of svg.matchAll(/<text([^>]*)>([^<]*)</g)){const fs=attr(m[1],'font-size')||14,anchor=(m[1].match(/text-anchor="(\w+)"/)||[])[1]||'start',w=[...m[2]].reduce((a,ch)=>a+(ch.charCodeAt(0)>255?fs:fs*.55),0),x=attr(m[1],'x'),y=attr(m[1],'y'),x0=anchor==='end'?x-w:anchor==='middle'?x-w/2:x;
    assert.ok(x0>=-1&&x0+w<=661&&y-fs>=-1&&y<=401,`${where} text "${m[2]}"`)}}}
});
test('Lever force and mirror rays stay inside the 660 by 400 diagram at control extremes',()=>{
 const check=(id,values,selector)=>{
  const s={...defaults(id),...values},dom=new JSDOM(diagram(id,s,calculate(id,s)));
  const rays=[...dom.window.document.querySelectorAll(selector)];assert.ok(rays.length,id+' missing visible ray');
  for(const ray of rays)for(const end of ['1','2']){
   const x=Number(ray.getAttribute('x'+end)),y=Number(ray.getAttribute('y'+end));
   assert.ok(x>=8&&x<=652&&y>=8&&y<=392,`${id} ${JSON.stringify(values)} clipped endpoint (${x},${y})`);
  }
  if(id==='reflection-refraction'){
   const labels=['data-object-distance','data-image-distance'].map(attr=>dom.window.document.querySelector('['+attr+']'));
   assert.ok(labels.every(Boolean),'distance labels missing');
   assert.ok(Number(labels[1].getAttribute('x'))-Number(labels[0].getAttribute('x'))>=64,'near-mirror distance labels overlap');
  }
  dom.window.close();
 };
 for(const angle of [30,90,150])for(const d2 of [5,40,50])for(const f2 of [1,20])for(const w1 of [1,20])
  check('lever-torque',{angle,d2,f2,w1},'line[stroke="#d97b11"]');
 for(const incident of [0,30,60,85])for(const dist of [5,20,50])
  check('reflection-refraction',{mode:'mirror',incident,dist},'line[stroke="#d97b11"],line[stroke="#087b78"],line[stroke="#b54a5b"]');
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
