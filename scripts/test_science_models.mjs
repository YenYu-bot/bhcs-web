import assert from 'node:assert/strict';
import {calculate,describe} from './science/models.mjs';
import {diagram} from './science/diagrams.mjs';
import {batch2} from './science/batch2.mjs';
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
