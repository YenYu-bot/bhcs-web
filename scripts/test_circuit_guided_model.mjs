import assert from 'node:assert/strict';
import * as M from '../assets/circuit-guided/model.js';

let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name);};
const raw=(name,closed=true)=>M.rawFromFixed(name,closed);
const clone=(x)=>structuredClone(x);
const eq=(r,x)=>assert.equal(r?.exact,String(x));
const finiteTree=(x,path='root')=>{if(typeof x==='number')assert.ok(Number.isFinite(x),`${path} non-finite`);else if(x&&typeof x==='object')for(const[k,v]of Object.entries(x))finiteTree(v,`${path}.${k}`);};

test('wire schema rejects unknown, self, duplicate and over-limit wires',()=>{
  assert.throws(()=>M.validateWires([{from:'wat',to:'bat+'}]),/unknown terminal/);
  assert.throws(()=>M.validateWires([{from:'bat+',to:'bat+'}]),/itself/);
  assert.throws(()=>M.validateWires([{from:'bat+',to:'sw.a'},{from:'sw.a',to:'bat+'}]),/duplicate/);
  assert.throws(()=>M.validateWires(Array.from({length:M.MAX_WIRES+1},(_,i)=>({from:M.TERMINALS[i%6],to:M.TERMINALS[6+(i%6)]}))),/at most/);
});

test('legacy acceptance cases: one lamp, one-path two lamps and two-path two lamps are exact',()=>{
  const a=M.solveCircuit(raw('baseline'));
  assert.equal(a.status,'normal');eq(a.batteryCurrent,'1');eq(a.equivalentResistance,'6');eq(a.lamps.L1.power,'6');assert.equal(a.topology,'single-L1');assert.equal(a.lamps.L1.brightness,'reference');
  const b=M.solveCircuit(raw('trial1'));
  eq(b.batteryCurrent,'1/2');eq(b.equivalentResistance,'12');eq(b.lamps.L1.voltage,'3');eq(b.lamps.L2.voltage,'3');eq(b.lamps.L1.power,'3/2');assert.equal(b.topology,'one-path');assert.equal(b.lamps.L1.brightness,'low');
  const c=M.solveCircuit(raw('trial2Total'));
  eq(c.batteryCurrent,'2');eq(c.equivalentResistance,'3');eq(c.lamps.L1.current,'1');eq(c.lamps.L2.current,'1');eq(c.lamps.L1.voltage,'6');eq(c.lamps.L2.voltage,'6');assert.equal(c.topology,'two-path');assert.equal(c.lamps.L1.brightness,'reference');assert.equal(c.lamps.L2.brightness,'reference');
});

test('open switch makes all currents and lamp power zero without inventing a short',()=>{
  for(const name of ['baseline','trial1','trial2Total']){
    const r=M.solveCircuit(raw(name,false));assert.equal(r.status,'open',name);assert.equal(M.allCurrentsZero(r),true,name);eq(r.lamps.L1.power,'0');eq(r.lamps.L2.power,'0');
  }
});

test('ammeter directly across the battery is caught as source-short after the zero-ohm connection',()=>{
  const r=M.solveCircuit({switchClosed:true,wires:[{from:'bat+',to:'A.+'},{from:'A.-',to:'bat-'}]});
  assert.equal(r.status,'source-short');assert.equal(r.ammeter.placement,'source-short');assert.equal(r.batteryCurrent,null);assert.equal(r.ammeter.reading,null);finiteTree(r);
});

test('wire-only source short is also caught and never exposes Infinity or NaN',()=>{
  const r=M.solveCircuit({switchClosed:true,wires:[{from:'bat+',to:'bat-'}]});assert.equal(r.status,'source-short');finiteTree(r);assert.ok(!JSON.stringify(r).includes('Infinity'));
});

test('a parallel ideal wire makes the ammeter reading explicitly ambiguous',()=>{
  const w=clone(M.FIXED_CIRCUITS.baseline);w.push({from:'A.+',to:'A.-'});
  const r=M.solveCircuit({wires:w,switchClosed:true});assert.equal(r.status,'normal');assert.equal(r.ammeter.state,'ambiguous');assert.equal(r.ammeter.placement,'ambiguous');assert.equal(r.ammeter.reading,null);eq(r.batteryCurrent,'1');
});

test('reversed ammeter keeps the circuit physics but reports a negative reading',()=>{
  const w=clone(M.FIXED_CIRCUITS.baseline).filter((x)=>!['A.+|sw.b','A.-|L1.a'].includes([x.from,x.to].sort().join('|')));
  w.push({from:'sw.b',to:'A.-'},{from:'A.+',to:'L1.a'});
  const r=M.solveCircuit({wires:w,switchClosed:true});assert.equal(r.ammeter.placement,'total-current');eq(r.batteryCurrent,'1');eq(r.ammeter.reading,'-1');
});

test('reversed voltmeter is structurally across L1 but its reading is negative',()=>{
  const w=clone(M.FIXED_CIRCUITS.baseline).filter((x)=>!x.from.startsWith('V.')&&!x.to.startsWith('V.'));
  w.push({from:'V.-',to:'L1.a'},{from:'V.+',to:'L1.b'});
  const r=M.solveCircuit({wires:w,switchClosed:true});assert.equal(r.voltmeter.across,'L1');eq(r.voltmeter.reading,'-6');
});

test('voltmeter inserted in the only path behaves like an open circuit and can read the source difference',()=>{
  const r=M.solveCircuit({switchClosed:true,wires:[
    {from:'bat+',to:'sw.a'},{from:'sw.b',to:'L1.a'},{from:'L1.b',to:'V.+'},{from:'V.-',to:'bat-'}
  ]});
  assert.equal(r.status,'open');eq(r.batteryCurrent,'0');eq(r.lamps.L1.current,'0');eq(r.voltmeter.reading,'6');
});

test('fully floating voltmeter returns null rather than a false zero',()=>{
  const r=M.solveCircuit({switchClosed:false,wires:[]});assert.equal(r.voltmeter.state,'floating');assert.equal(r.voltmeter.reading,null);
});

test('ammeter across L1 bypasses L1 without misclassifying it as a battery short',()=>{
  const r=M.solveCircuit({switchClosed:true,wires:[
    {from:'bat+',to:'sw.a'},{from:'sw.b',to:'L1.a'},{from:'sw.b',to:'A.+'},
    {from:'L1.b',to:'L2.a'},{from:'A.-',to:'L2.a'},{from:'L2.b',to:'bat-'}
  ]});
  assert.equal(r.status,'normal');assert.equal(r.ammeter.placement,'parallel-to-L1');assert.equal(r.lamps.L1.bypassed,true);assert.equal(r.lamps.L1.active,false);eq(r.lamps.L2.current,'1');
});

test('Trial 2 structural meter placements distinguish total, L1 branch and L2 branch despite equal branch readings',()=>{
  const total=M.solveCircuit(raw('trial2Total')),l1=M.solveCircuit(raw('trial2L1')),l2=M.solveCircuit(raw('trial2L2'));
  assert.equal(total.ammeter.placement,'total-current');eq(total.ammeter.reading,'2');
  assert.equal(l1.ammeter.placement,'L1-branch');eq(l1.ammeter.reading,'1');
  assert.equal(l2.ammeter.placement,'L2-branch');eq(l2.ammeter.reading,'1');
});

test('legacy missing case: removing one parallel branch leaves the other branch current unchanged and lowers total',()=>{
  const base=clone(M.FIXED_CIRCUITS.trial2Total);
  const removeL2=base.filter((w)=>!['A.-|L2.a','L2.b|bat-'].includes([w.from,w.to].sort().join('|')));
  const r=M.solveCircuit({wires:removeL2,switchClosed:true});eq(r.batteryCurrent,'1');eq(r.lamps.L1.current,'1');eq(r.lamps.L2.current,'0');assert.equal(r.lamps.L1.brightness,'reference');
});

test('electrically equivalent orientation of L1 and its voltmeter gives the same baseline truth',()=>{
  const w=[
    {from:'bat+',to:'sw.a'},{from:'sw.b',to:'A.+'},{from:'A.-',to:'L1.b'},{from:'L1.a',to:'bat-'},
    {from:'V.+',to:'L1.b'},{from:'V.-',to:'L1.a'},
  ];
  const r=M.solveCircuit({wires:w,switchClosed:true});assert.equal(r.topology,'single-L1');assert.equal(r.ammeter.placement,'total-current');assert.equal(r.voltmeter.across,'L1');eq(r.batteryCurrent,'1');eq(r.ammeter.reading,'1');eq(r.voltmeter.reading,'6');
});

test('Challenge base circuits are source-only immutable scenarios and contain no derived science',()=>{
  assert.ok(Object.isFrozen(M.CHALLENGE_BASES));assert.ok(Object.isFrozen(M.CHALLENGE_BASES[2].wires));assert.equal(M.CHALLENGE_BASES[2].switchClosed,false);assert.equal(M.CHALLENGE_BASES[3].switchClosed,false);
  const json=JSON.stringify(M.CHALLENGE_BASES);for(const k of ['current','voltage','topology','correct','ready'])assert.ok(!json.includes(k),k);
});


test('solver accepts deep-frozen input without mutation',()=>{
  const rawInput={wires:structuredClone(M.FIXED_CIRCUITS.trial2Total),switchClosed:true};
  const freeze=(o)=>{if(!o||typeof o!=='object'||Object.isFrozen(o))return o;Object.freeze(o);for(const v of Object.values(o))freeze(v);return o;};
  freeze(rawInput);const snap=JSON.stringify(rawInput);const r=M.solveCircuit(rawInput);assert.equal(JSON.stringify(rawInput),snap);eq(r.batteryCurrent,'2');
});

test('interactive challenge base truth is deterministic before learner meter changes',()=>{
  const c2=M.solveCircuit(M.CHALLENGE_BASES[2]);eq(c2.lamps.L1.current,'0');eq(c2.lamps.L2.current,'0');
  const c2closed=M.solveCircuit({...M.CHALLENGE_BASES[2],switchClosed:true});eq(c2closed.lamps.L1.current,'1/2');eq(c2closed.lamps.L2.current,'1/2');
  const c3closed=M.solveCircuit({...M.CHALLENGE_BASES[3],switchClosed:true});eq(c3closed.lamps.L1.current,'1');eq(c3closed.lamps.L2.current,'1');eq(c3closed.batteryCurrent,'2');
});

test('fixed-seed mutation/property sample never throws and never emits a non-finite number',()=>{
  let seed=0x6c8e9cf5;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  const pairs=[];for(let i=0;i<M.TERMINALS.length;i++)for(let j=i+1;j<M.TERMINALS.length;j++)pairs.push([M.TERMINALS[i],M.TE]RMINALS[j]]);
  for(let k=0;k<1200;k++){
    const count=Math.floor(rnd()*(M.MAX_WIRES+1)),used=new Set(),w=[];
    while(w.length<count){const [a,b]=pairs[Math.floor(rnd()*pairs.length)],key=[a,b].sort().join('|');if(used.has(key))continue;used.add(key);w.push({from:a,to:b});}
    const r=M.solveCircuit({wires:w,switchClosed:rnd()<.5});finiteTree(r,`case${k}`);assert.ok(['normal','open','source-short'].includes(r.status),`unexpected ${r.status}`);
  }
});

console.log(`circuit-guided model: ${tests} tests passed`);
