import assert from 'node:assert/strict';
import {calculate,describe} from './science/models.mjs';
// Default inputs of each model (the starting settings of the removed 新探究 pages).
const DEFAULTS={"optics": {"kind": "convex", "f": 10, "u": 30}, "wave-sound": {"mode": "travel", "f": 340, "v": 340, "length": 1}, "electromagnetism": {"mode": "magnet", "turns": 100, "current": 1, "field": 0.2, "angle": 90, "rpm": 60}, "pressure-fluid": {"mode": "water", "depth": 2, "density": 1000, "volume": 1, "ratio": 1, "speed": 2}, "solubility": {"solute": "a", "temperature": 20, "water": 100, "soluteMass": 50}, "energy": {"mass": 1, "height": 2, "progress": 50, "loss": 0}, "moon-eclipse": {"phase": 90, "node": 90, "inclination": 5}, "seasons": {"latitude": 24, "season": 90, "tilt": 23.5}, "plant-exchange": {"light": 60, "temperature": 25, "humidity": 50, "stomata": 60}, "ecosystem": {"energy": 10000, "efficiency": 10, "initial": 50, "capacity": 200, "rate": 0.2, "time": 10}, "motion-graphs": {"v0": 10, "a": -5, "t": 4}, "lever-torque": {"w1": 10, "d1": 20, "f2": 5, "d2": 40, "angle": 90}, "pulley-incline": {"mode": "fixed", "load": 100, "n": 4, "h": 1, "len": 4, "loss": 0}, "reaction-rate": {"conc": 1, "temp": 25, "size": "lump", "cat": "none", "amount": 5}, "reflection-refraction": {"mode": "refraction", "incident": 30, "media": "air-water", "dist": 20}, "atom-builder": {"p": 11, "n": 12, "e": 11}, "stoichiometry": {"reaction": "h2o", "massA": 4, "massB": 32}, "weather-systems": {"mode": "pressure", "hemi": "north", "system": "low", "front": "cold", "phase": "during"}, "circulation": {"intensity": 0, "site": "pa"}, "nerve-reflex": {"action": "knee", "drop": 20}, "homeostasis": {"mode": "glucose", "carb": 50, "exercise": 0, "insulin": "normal", "env": 25}, "spring-friction": {"mode": "spring", "k": 50, "hang": 0.5, "limit": 0.3, "mass": 2, "surface": "smooth", "pull": 5}, "electric-power": {"mode": "fixedV", "volt": 6, "amp": 1, "ohm": 6, "time": 70, "water": 100, "loss": 0}, "electrostatics": {"rod": "neg", "step": "near"}, "equilibrium": {"a0": 10, "b0": 0, "temp": "mid", "add": 0}, "metal-activity": {"metal": "zn", "solution": "cuso4"}, "cell-electrolysis": {"mode": "cell", "amp": 1, "time": 965}, "specific-heat": {"subA": "water", "subB": "iron", "mass": 100, "power": 42, "time": 10}, "neutralization": {"ca": "0.1", "va": 25, "cb": "0.1", "vb": 0}, "cell-division": {"type": "mitosis", "n2": "4", "stage": 0}, "enzyme": {"temp": 37, "ph": 7, "enzyme": "amylase", "conc": 1}, "tides": {"day": 0, "hour": 0}};
const defaults=id=>({...DEFAULTS[id]});
const calc=(id,values={})=>calculate(id,{...defaults(id),...values});
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} != ${expected}`);
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};
test('Enzyme pure-model contract: omitted history is fresh; supplied heat history is irreversible',()=>{
 // calculate remains pure: runtime owns and supplies the same-sample history.
 const fresh={temp:37,ph:7,enzyme:'amylase',conc:1};
 close(calculate('enzyme',fresh).act,1);
 const heated={...fresh,heatDenatured:true};
 close(calculate('enzyme',heated).act,0);
 assert.equal(calculate('enzyme',heated).den,true);
 assert.match(describe('enzyme',heated,calculate('enzyme',heated)).explanation,/曾達 60°C/);
 for(const temp of [0,37,59,60,80])for(const ph of [1,2,7,13]){
  const state={...heated,temp,ph};close(calculate('enzyme',state).act,0);
  assert.equal(calculate('enzyme',state).kind,'denatured');
 }
 assert.deepEqual(fresh,{temp:37,ph:7,enzyme:'amylase',conc:1});
 close(calculate('enzyme',fresh).act,1); // No hidden global history in the pure function.
});
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
test('Ecosystem: transfer / initial value / K / decline above K',()=>{
 assert.deepEqual(calc('ecosystem').energy.map(Math.round),[10000,1000,100]);
 close(calc('ecosystem',{time:0}).population,50);
 close(calc('ecosystem',{rate:0}).population,50);
 close(calc('ecosystem',{initial:200}).population,200);
 assert.equal(calc('ecosystem',{initial:300,capacity:100}).kind,'decline');
});
test('Weather systems: NH low / NH high / SH low / typhoon / front temperature',()=>{
 const l=calc('weather-systems');assert.equal(l.rotation,'ccw');assert.equal(l.flow,'in');assert.equal(l.vertical,'up');
 const h=calc('weather-systems',{system:'high'});assert.equal(h.rotation,'cw');assert.equal(h.flow,'out');assert.equal(h.vertical,'down');
 const sl=calc('weather-systems',{hemi:'south'});assert.equal(sl.rotation,'cw');assert.equal(sl.flow,'in');
 assert.equal(calc('weather-systems',{system:'typhoon'}).rotation,'ccw');
 assert.equal(calc('weather-systems',{mode:'front',front:'cold',phase:'after'}).afterTemp,'down');assert.equal(calc('weather-systems',{mode:'front',front:'warm',phase:'after'}).afterTemp,'up');assert.equal(calc('weather-systems',{mode:'front',front:'stationary'}).kind,'stationary');
});
test('Stoichiometry: exact / limiting O2 / CaCO3 + HCl exact / zero / mass conservation',()=>{
 const a=calc('stoichiometry');close(a.molA,2);close(a.molB,1);assert.equal(a.kind,'exact');close(a.products[0][1],36);close(a.leftA,0);close(a.leftB,0);
 const b=calc('stoichiometry',{massB:16});assert.equal(b.kind,'limitB');close(b.products[0][1],18);close(b.leftA,2);
 const c=calc('stoichiometry',{reaction:'caco3',massA:10,massB:7.3});assert.equal(c.kind,'exact');close(c.products[2][1],4.4);
 assert.equal(calc('stoichiometry',{reaction:'mgo',massA:4.8,massB:3.2}).kind,'exact');assert.equal(calc('stoichiometry',{reaction:'nh3',massA:2.8,massB:0.6}).kind,'exact');
 assert.equal(calc('stoichiometry',{massA:0}).kind,'none');assert.equal(calc('stoichiometry',{massA:10,massB:10}).kind,'limitB');
 for(const reaction of ['h2o','mgo','caco3','nh3'])for(const massA of [0.1,0.3,4,7.3,55.5,100])for(const massB of [0.1,0.2,3.2,7.3,32,100]){const q=calc('stoichiometry',{reaction,massA,massB});close(q.before,q.after);assert.ok(q.leftA>=-1e-9&&q.leftB>=-1e-9);
 }
});
test('Atom builder: Na+ / Cl- / C-14 isotope / no electrons / element fixed by protons',()=>{
 const na=calc('atom-builder',{p:11,n:12,e:10});assert.equal(na.ion,'Na⁺');assert.equal(na.A,23);assert.deepEqual([...na.shells],[2,8]);assert.equal(na.kind,'cation');
 const cl=calc('atom-builder',{p:17,n:18,e:18});assert.equal(cl.ion,'Cl⁻');assert.equal(cl.A,35);assert.deepEqual([...cl.shells],[2,8,8]);assert.equal(cl.kind,'anion');
 const c=calc('atom-builder',{p:6,n:8,e:6});assert.equal(c.symbol,'C');assert.equal(c.A,14);assert.equal(c.kind,'neutral');assert.equal(c.isotope,'common');
 assert.equal(calc('atom-builder',{p:6,n:6,e:6}).isotope,'most');assert.equal(calc('atom-builder',{p:6,n:0,e:6}).isotope,'unusual');
 const z=calc('atom-builder',{p:9,n:10,e:0});assert.equal(z.shells.length,0);assert.equal(z.charge,9);
 assert.equal(calc('atom-builder',{p:12,n:12,e:10}).ion,'Mg²⁺');assert.equal(calc('atom-builder',{p:8,n:8,e:10}).ion,'O²⁻');
 for(let p=1;p<=20;p++)for(const e of [0,p,20]){const q=calc('atom-builder',{p,n:10,e});assert.equal(q.shells.reduce((a,b)=>a+b,0),e);assert.ok(q.shells.every((k,i)=>k<=[2,8,8,2][i]));
 }
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
 }
});
test('Reaction rate: baseline / +10°C doubles / catalyst keeps product / combined factors',()=>{
 const b=calc('reaction-rate');close(b.rate,1);close(b.time,300);close(b.product,5);assert.equal(b.kind,'same');
 const h=calc('reaction-rate',{temp:35});close(h.rate,2);close(h.time,150);assert.equal(h.kind,'faster');
 const c=calc('reaction-rate',{cat:'yes'});close(c.rate,4);close(c.product,5);
 close(calc('reaction-rate',{size:'powder',cat:'yes',conc:2}).rate,72);assert.equal(calc('reaction-rate',{temp:15}).kind,'slower');
 for(const size of ['lump','granule','powder'])for(const cat of ['none','yes'])for(const temp of [5,25,65])for(const amount of [1,10]){const q=calc('reaction-rate',{size,cat,temp,amount});close(q.product,amount);close(q.rate*q.time,amount*60);
 }
});
test('Pulley and incline: halving force doubles distance / incline ratio / L<h clamp / loss',()=>{
 const f=calc('pulley-incline');close(f.force,100);close(f.distance,1);assert.equal(f.kind,'ideal');
 const m=calc('pulley-incline',{mode:'movable'});close(m.force,50);close(m.distance,2);close(m.input,100);close(m.output,100);
 const b=calc('pulley-incline',{mode:'block',n:4});close(b.force,25);close(b.distance,4);close(b.input,100);
 close(calc('pulley-incline',{mode:'incline',len:1,h:1}).force,100);close(calc('pulley-incline',{mode:'incline',len:4,h:1}).force,25);
 const c=calc('pulley-incline',{mode:'incline',len:1,h:3});assert.equal(c.clamped,true);close(c.force,100);close(c.distance,3);
 const l=calc('pulley-incline',{mode:'movable',loss:20});close(l.force,62.5);close(l.input,125);close(l.output,100);assert.equal(l.kind,'lossy');
 for(const mode of ['fixed','movable','block','incline'])for(const n of [2,3,6])for(const loss of [0,25,50]){const q=calc('pulley-incline',{mode,n,loss});assert.ok(q.input>=q.output-1e-9);if(!loss)close(q.input,q.output);
 }
});
test('Lever torque: balanced default / slanted pull / sin symmetry',()=>{
 const r=calc('lever-torque');close(r.left,2);close(r.right,2);assert.equal(r.kind,'balanced');close(r.effective,40);
 const s=calc('lever-torque',{angle:30});close(s.right,1);assert.equal(s.kind,'left');close(s.effective,20);
 const t=calc('lever-torque',{angle:150});close(t.right,s.right);assert.equal(t.kind,s.kind);
 assert.equal(calc('lever-torque',{d2:20}).kind,'left');assert.equal(calc('lever-torque',{d2:20,f2:10}).kind,'balanced');assert.equal(calc('lever-torque',{f2:6}).kind,'right');
 assert.equal(calc('lever-torque',{w1:5,angle:30}).kind,'balanced');
});
test('Circulation: resting / maximal output / pulmonary artery and vein',()=>{
 const r=calc('circulation');close(r.hr,70);close(r.co,4.9);assert.equal(r.kind,'deoxygenated');assert.equal(r.circuit,'lung');
 const m=calc('circulation',{intensity:100});close(m.hr,180);close(m.sv,110);close(m.co,19.8);
 assert.equal(calc('circulation',{site:'pv'}).kind,'oxygenated');assert.equal(calc('circulation',{site:'aorta'}).circuit,'body');assert.equal(calc('circulation',{site:'vc'}).kind,'deoxygenated');
});
test('Nerve and reaction time: ruler drop times / reflex centre / voluntary path',()=>{
 assert.equal(Number(calc('nerve-reflex',{drop:19.6}).time.toFixed(3)),0.2);assert.equal(Number(calc('nerve-reflex',{drop:5}).time.toFixed(3)),0.101);close(calc('nerve-reflex',{drop:0}).time,0);
 const k=calc('nerve-reflex');assert.equal(k.kind,'reflex');assert.equal(k.center,'脊髓');assert.equal(k.viaBrain,false);
 const c=calc('nerve-reflex',{action:'catch'});assert.equal(c.kind,'voluntary');assert.equal(c.center,'大腦');assert.equal(c.viaBrain,true);
 assert.equal(calc('nerve-reflex',{action:'withdraw'}).painLater,true);
 for(const action of ['knee','withdraw','catch'])for(let drop=0;drop<=50;drop+=5){const q=calc('nerve-reflex',{action,drop});
  close(0.5*9.8*q.time*q.time,drop/100);}
});
test('Knee reflex receptor is a thigh muscle spindle, distinct from the tendon tap site',()=>{
 const s={...defaults('nerve-reflex'),action:'knee'},r=calculate('nerve-reflex',s);
 assert.match(r.path[0][1],/肌梭/,'knee reflex receptor must be a muscle spindle');
 assert.doesNotMatch(r.path[0][1],/肌腱/,'tendon tap site is not the receptor');
});
test('Homeostasis: meal peak / insulin deficit / fasting exercise / steady / cold',()=>{
 const n=calc('homeostasis');close(n.peak,130);assert.equal(n.recovery,2);assert.deepEqual([...n.hormones],['胰島素']);assert.equal(n.kind,'high');
 const l=calc('homeostasis',{insulin:'low'});close(l.peak,170);assert.equal(l.recovery,5);
 const x=calc('homeostasis',{carb:0,exercise:60});close(x.min,60);assert.deepEqual([...x.hormones],['升糖素']);assert.equal(x.kind,'low');
 const z=calc('homeostasis',{carb:0,exercise:0});close(z.peak,90);assert.equal(z.kind,'steady');assert.equal(z.recovery,0);
 const c=calc('homeostasis',{mode:'temp',env:10});assert.equal(c.kind,'cold');assert.equal(c.core,37);assert.equal(calc('homeostasis',{mode:'temp',env:35}).kind,'hot');assert.equal(calc('homeostasis',{mode:'temp',env:25}).kind,'neutral');
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
test('Electric power: 6 V 6 Ω 70 s / fixed current vs fixed voltage doubling / zero time / boiling cap',()=>{
 const a=calc('electric-power');close(a.I,1);close(a.P,6);close(a.E,420);assert.equal(Number(a.dT.toFixed(2)),1);assert.equal(a.kind,'heating');
 close(calc('electric-power',{mode:'fixedI',amp:1,ohm:12}).P,12);close(calc('electric-power',{mode:'fixedV',volt:6,ohm:12}).P,3);
 const z=calc('electric-power',{time:0});close(z.E,0);close(z.dT,0);assert.equal(z.kind,'idle');
 assert.equal(calc('electric-power',{volt:12,ohm:1,time:600,water:50}).kind,'boiling');
 for(const mode of ['fixedV','fixedI'])for(const ohm of [1,6,50])for(const loss of [0,25,50]){const q=calc('electric-power',{mode,ohm,loss,volt:9,amp:2,time:100});close(q.P,q.V*q.I);close(q.V,q.I*ohm);assert.ok(q.heat<=q.E+1e-9);close(q.heat*100,q.E*(100-loss));}
});
test('Electrostatics: induction order / contact / polarization / only electrons move',()=>{
 assert.ok(calc('electrostatics',{rod:'neg',step:'g1'}).net>0);assert.ok(calc('electrostatics',{rod:'pos',step:'g1'}).net<0);
 assert.equal(calc('electrostatics',{rod:'neg',step:'g2'}).net,0);assert.equal(calc('electrostatics',{rod:'pos',step:'g2'}).kind,'neutral');
 assert.ok(calc('electrostatics',{rod:'neg',step:'contact'}).net<0);assert.ok(calc('electrostatics',{rod:'pos',step:'contact'}).net>0);
 const p=calc('electrostatics',{rod:'neg',step:'near'});assert.equal(p.net,0);assert.equal(p.kind,'polarized');assert.ok(p.near>0&&p.far<0);
});
test('Equilibrium: K=2 from A / added A shifts right / path independence / empty / rates equal',()=>{
 const r=calc('equilibrium');assert.equal(Number(r.A.toFixed(3)),3.333);assert.equal(Number(r.B.toFixed(3)),6.667);assert.equal(r.kind,'equilibrium');
 const a=calc('equilibrium',{add:2});close(a.A,4);close(a.B,8);assert.equal(a.kind,'shifted');
 const p=calc('equilibrium',{a0:0,b0:10});close(p.A,r.A);close(p.B,r.B);assert.equal(p.initialDir,'left');assert.equal(r.initialDir,'right');
 assert.equal(calc('equilibrium',{a0:0,b0:0}).kind,'empty');
 for(const temp of ['low','mid','high'])for(const a0 of [0,3,10])for(const b0 of [0,4,10])for(const add of [0,5]){const q=calc('equilibrium',{a0,b0,temp,add});close(q.A+q.B,a0+b0+add);if(q.T)close(q.B,q.K*q.A);
  }
});
test('Metal activity: Zn in CuSO4 / Cu in ZnSO4 / Cu in HCl / Mg in HCl / same metal / Cu in AgNO3 / electron balance',()=>{
 const a=calc('metal-activity',{metal:'zn',solution:'cuso4'});assert.equal(a.kind,'displace');assert.equal(a.product,'Cu');assert.equal(a.metalSym,'Zn');assert.equal(a.electrons,2);
 assert.equal(calc('metal-activity',{metal:'cu',solution:'znso4'}).kind,'none');assert.equal(calc('metal-activity',{metal:'cu',solution:'hcl'}).kind,'none');
 const h=calc('metal-activity',{metal:'mg',solution:'hcl'});assert.equal(h.kind,'hydrogen');assert.equal(h.eq,'Mg ＋ 2H⁺ → Mg²⁺ ＋ H₂');
 assert.equal(calc('metal-activity',{metal:'zn',solution:'znso4'}).kind,'same');
 const g=calc('metal-activity',{metal:'cu',solution:'agno3'});assert.equal(g.kind,'displace');assert.equal(g.product,'Ag');assert.equal(g.eq,'Cu ＋ 2Ag⁺ → Cu²⁺ ＋ 2Ag');assert.equal(g.change,'逐漸變成藍色');
 for(const metal of ['mg','zn','fe','cu','ag'])for(const solution of ['mgso4','znso4','feso4','cuso4','agno3','hcl']){const q=calc('metal-activity',{metal,solution});assert.equal(q.react,q.kind!=='same'&&q.rankMetal>q.rankIon);
 }
});
test('Cell and electrolysis: 1 A for 965 s / copper deposit / zinc loss / water 2:1 / idle / copper electrodes balance',()=>{
 const c=calc('cell-electrolysis');close(c.ne,0.01);close(c.negMass,-0.327);close(c.posMass,0.3175);
 close(calc('cell-electrolysis',{mode:'cuC'}).negMass,0.3175);const w=calc('cell-electrolysis',{mode:'water'});close(w.h2,0.005);close(w.o2,0.0025);close(w.h2/w.o2,2);
 const z=calc('cell-electrolysis',{amp:0});assert.equal(z.kind,'idle');close(z.ne,0);
 const u=calc('cell-electrolysis',{mode:'cuCu'});close(u.negMass,-u.posMass);assert.match(u.sol,/不變/);
 for(const mode of ['cell','water','cuC','cuCu'])for(const amp of [0,0.5,2])for(const time of [0,965,3600]){const q=calc('cell-electrolysis',{mode,amp,time});close(q.ne,amp*time/96500);}
});
test('Specific heat: water 1.00 / iron 9.33 / ratio / zero time / alcohol reaches boiling',()=>{
 const r=calc('specific-heat');close(r.Q,420);close(r.a.dT,1);assert.equal(Number(r.b.dT.toFixed(2)),9.33);assert.equal(Number(r.ratio.toFixed(2)),9.33);
 const z=calc('specific-heat',{time:0});close(z.a.dT,0);assert.equal(z.kind,'idle');
 assert.equal(calc('specific-heat',{subA:'alcohol',mass:50,time:170}).kind,'limit');assert.equal(calc('specific-heat',{subA:'alcohol',mass:50,time:160}).kind,'heating');
 for(const subA of ['water','alcohol','sand','iron','copper'])for(const mass of [50,500])for(const time of [0,300]){const q=calc('specific-heat',{subA,subB:'copper',mass,time});close(q.a.dT*mass*q.a.c,q.Q);close(q.b.dT*mass*q.b.c,q.Q);}
});
test('Neutralization: 0.1 M 25 mL titration pH values / equivalence / phenolphthalein',()=>{
 const p=v=>calc('neutralization',{ca:'0.1',va:25,cb:'0.1',vb:v});
 assert.equal(Number(p(0).pH.toFixed(2)),1);assert.equal(Number(p(10).pH.toFixed(2)),1.37);assert.equal(Number(p(25).pH.toFixed(2)),7);assert.equal(p(25).kind,'neutral');assert.equal(Number(p(50).pH.toFixed(2)),12.52);
 close(p(0).veq,25);assert.equal(p(24).pink,false);assert.equal(p(26).pink,true);assert.equal(p(40).excess,'OH⁻');
 for(const ca of ['0.01','0.1','1'])for(const cb of ['0.01','0.1','1'])for(const va of [10,50])for(const vb of [0,5,50,100]){const q=calc('neutralization',{ca,va,cb,vb});assert.ok(q.pH>=0&&q.pH<=14.5);assert.equal(q.kind==='acidic',Number(ca)*va>Number(cb)*vb+1e-9);}
});
test('Cell division: mitosis 2 cells of 2n / meiosis 4 cells of n / DNA doubles then quarters',()=>{
 const m=calc('cell-division',{type:'mitosis',n2:'4',stage:5});assert.equal(m.cells,2);assert.equal(m.perCell,4);
 const e=calc('cell-division',{type:'meiosis',n2:'4',stage:5});assert.equal(e.cells,4);assert.equal(e.perCell,2);
 assert.equal(calc('cell-division',{type:'mitosis',stage:1}).dna,2*calc('cell-division',{type:'mitosis',stage:0}).dna);
 assert.equal(e.dna*4,calc('cell-division',{type:'meiosis',stage:1}).dna);assert.equal(calc('cell-division',{type:'mitosis',stage:4}).perCell,8);
});
test('Enzyme: amylase optimum / 70 C denatured / pepsin at pH 7 / 0 C low but not denatured',()=>{
 const a=calc('enzyme');close(a.act,1);assert.equal(a.kind,'active');
 const d=calc('enzyme',{temp:70});close(d.act,0);assert.equal(d.kind,'denatured');assert.equal(d.den,true);
 const p=calc('enzyme',{enzyme:'pepsin'});assert.ok(p.act<0.01);assert.equal(p.kind,'low');assert.ok(calc('enzyme',{enzyme:'pepsin',ph:2}).act>0.99);
 const c=calc('enzyme',{temp:0});assert.ok(c.act<0.1);assert.equal(c.den,false);assert.equal(c.kind,'low');
 for(let temp=0;temp<=80;temp+=5)for(const ph of [1,2,7,13])for(const enzyme of ['amylase','pepsin']){const q=calc('enzyme',{temp,ph,enzyme,conc:1});assert.ok(q.act>=0&&q.act<=1+1e-9);if(temp>=60)assert.equal(q.act,0);}
});
test('Tides: new moon spring / first quarter neap / semidiurnal period / next high tide is a maximum',()=>{
 assert.equal(calc('tides',{day:0}).kind,'spring');assert.equal(calc('tides',{day:15}).kind,'spring');assert.equal(calc('tides',{day:7.5}).kind,'neap');
 const t=calc('tides');close(t.P,12.42);assert.ok(calc('tides',{day:1}).next>t.next+0.8);
 for(let day=0;day<=29.5;day+=2.5)for(const hour of [0,6.5,13,23.5]){const q=calc('tides',{day,hour}),h=x=>q.amp*Math.cos(2*Math.PI*(x-q.lag)/q.P);assert.ok(q.next>=hour-1e-9&&q.next<hour+q.P);assert.ok(Math.abs(h(q.next)-q.amp)<1e-9);assert.ok(h(q.next+0.3)<q.amp&&h(q.next-0.3)<q.amp);}
});
test('Motion graphs: reversing / stops exactly at t / rest / area bookkeeping',()=>{
 const r=calc('motion-graphs');close(r.v,-10);close(r.x,0);close(r.path,20);assert.equal(r.kind,'reversing');close(r.turn,2);
 const e=calc('motion-graphs',{t:2});close(e.v,0);close(e.x,10);close(e.path,10);assert.equal(e.kind,'slowing');assert.equal(e.turn,null);
 const z=calc('motion-graphs',{v0:0,a:0});close(z.v,0);close(z.x,0);close(z.path,0);assert.equal(z.kind,'rest');
 assert.equal(calc('motion-graphs',{v0:5,a:0}).kind,'uniform');assert.equal(calc('motion-graphs',{v0:0,a:2}).kind,'speeding');assert.equal(calc('motion-graphs',{v0:-4,a:-1}).kind,'speeding');
 const n=calc('motion-graphs',{v0:-6,a:2,t:5});close(n.x,-5);close(n.pos,4);close(n.neg,9);close(n.path,13);close(n.turn,3);
 for(const v0 of [-10,-3,0,4,10])for(const a of [-5,-1.5,0,2.5,5])for(const t of [1,3,10]){const q=calc('motion-graphs',{v0,a,t});close(q.pos-q.neg,q.x);close(q.pos+q.neg,q.path);assert.ok(q.path>=Math.abs(q.x)-1e-9);
  }
});
console.log(`${tests} model groups passed`);
