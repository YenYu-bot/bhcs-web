import assert from 'node:assert/strict';
import {load} from './helper.mjs';

const api=load('g10','exponent');
const unit=api.CFG.units.find(candidate=>candidate.id==='substitution');
for(const level of ['basic','advanced','challenge']){
 const expected=level==='challenge'?null:19;
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
console.log(JSON.stringify({test:'exponent-substitution-bank-size',basic:19,advanced:19,challenge:'unbounded-for-UI',passed:true}));
