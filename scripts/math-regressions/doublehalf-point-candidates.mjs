import assert from 'node:assert/strict';
import {load} from './helper.mjs';

const api=load('g11','doublehalf');
const unit=api.CFG.units.find(candidate=>candidate.id==='point');
const results={};
for(const level of ['basic','advanced','challenge']){
 const seen=new Set();let rejected=0;
 for(let i=0;i<20000;i++){
  const q=unit.gen({level,modes:['integer'],mixed:true});
  assert.ok(q);
  assert.equal(q.verify(),true);
  if(api.contentGuard(q,level))seen.add(q.sig);else rejected++;
 }
 assert.equal(rejected,0);
 assert.ok(seen.size>40);
 results[level]={distinct:seen.size,guardRejected:rejected};
}

console.log(JSON.stringify({test:'doublehalf-point-candidates',...results,passed:true}));
