import assert from 'node:assert/strict';
import {load} from './helper.mjs';

const api=load('g11','commonlog');
const unit=api.CFG.units.find(candidate=>candidate.id==='definition');
for(const level of ['basic','advanced','challenge']){
 assert.equal(unit.legacyBankSize({level,modes:['fraction'],mixed:true}),30);
 assert.equal(unit.legacyBankSize({level,modes:['integer'],mixed:true}),null);
 const seen=new Set();
 for(let i=0;i<5000;i++){
  const q=unit.legacyGen({level,modes:['fraction'],mixed:true});
  assert.ok(q);
  assert.equal(q.verify(),true);
  seen.add(q.sig);
 }
 assert.equal(seen.size,30);
}
console.log(JSON.stringify({test:'commonlog-definition-bank-size',legacyFraction:30,integer:null,passed:true}));
