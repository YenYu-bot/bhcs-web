import assert from 'node:assert/strict';
import {load} from './helper.mjs';
const api=load('g11','righttrig'),u=api.CFG.units.find(u=>u.id==='comparison');
const kinds=new Set();let count=0;
for(const level of ['basic','advanced','challenge'])for(let i=0;i<200;i++){
 const q=u.gen({level,modes:['integer'],mixed:false});assert.ok(q);assert.equal(q.verify(),true);
 const parts=[...q.expr.matchAll(/(sin|cos|tan)(\d+)°/g)];assert.equal(parts.length,2);
 const [a,b]=parts.map(m=>Math[m[1]](Number(m[2])*Math.PI/180));assert.ok(Math.abs(a-b)>1e-9);
 assert.equal(q.answer,a>b?'＞':'＜');kinds.add(q.sig.split(':')[1]);count++;
 if(q.sig.startsWith('cm:cross:'))assert.notEqual(Number(parts[0][2])+Number(parts[1][2]),90);
}
assert.equal(kinds.size,3);console.log(JSON.stringify({test:'righttrig-comparison',count,kinds:[...kinds],passed:true}));
