import assert from 'node:assert/strict';
import {load} from './helper.mjs';

const api=load('g10','exponent');
const unit=api.CFG.units.find(candidate=>candidate.id==='substitution');
assert.equal(unit.maxCount,15);
for(const level of ['basic','advanced','challenge']){
 const expected=level==='basic'?19:null; // round 3b: advanced now mixes √k, aˣ＝√k, cube and difference kinds (no fixed bank)
 assert.equal(unit.bankSize({level,modes:['integer'],mixed:true}),expected);
 const seen=new Set();
 for(let i=0;i<20000;i++){
  const q=unit.gen({level,modes:['integer'],mixed:true});
  assert.ok(q);
  assert.equal(q.verify(),true);
  if(api.contentGuard(q,level))seen.add(q.sig);
 }
 if(expected===null)assert.ok(seen.size>40);
 else assert.equal(seen.size,expected);
}
console.log(JSON.stringify({test:'exponent-substitution-bank-size',basic:19,advanced:'unbounded-for-UI',challenge:'unbounded-for-UI',passed:true}));
