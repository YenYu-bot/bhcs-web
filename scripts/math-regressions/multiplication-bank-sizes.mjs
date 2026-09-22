import assert from 'node:assert/strict';
import {load} from './helper.mjs';

const api=load('g10','multiplication');
const cubeFactor=api.CFG.units.find(unit=>unit.id==='cubefactor');
const chain=api.CFG.units.find(unit=>unit.id==='chain');
assert.equal(cubeFactor.bankSize,8);

for(const level of ['basic','advanced','challenge']){
 assert.equal(chain.bankSize({level,modes:['integer'],mixed:false}),level==='challenge'?10:9);
 for(const [unit,expected] of [[cubeFactor,8],[chain,level==='challenge'?10:9]]){
  const seen=new Set();
  for(let i=0;i<5000;i++){
   const q=unit.gen({level,modes:['integer'],mixed:false});
   assert.ok(q);
   assert.equal(q.verify(),true);
   seen.add(q.sig);
  }
  assert.equal(seen.size,expected,`${unit.id}/${level}`);
 }
}
console.log(JSON.stringify({test:'multiplication-bank-sizes',cubeFactor:8,chain:{basic:9,advanced:9,challenge:10},passed:true}));
