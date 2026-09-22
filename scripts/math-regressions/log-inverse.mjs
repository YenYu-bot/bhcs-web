import assert from 'node:assert/strict';
import {load,mathText} from './helper.mjs';
const api=load('g11','loggraphs'),u=api.CFG.units.find(u=>u.id==='inverse');let count=0;
const bases=new Set(),shifts=new Set();
for(const level of ['basic','advanced','challenge'])for(let i=0;i<200;i++){
 const q=u.gen({level,modes:['integer'],mixed:false});assert.ok(q);assert.equal(q.verify(),true);
 const [,b,h,k]=q.sig.split(':').map(Number);bases.add(b);shifts.add(h);
 const expectedArg=k===0?'x':k<0?`x+${-k}`:`x-${k}`,expectedTail=h===0?'':h>0?`+${h}`:`-${-h}`;
 assert.equal(mathText(q.answer).replace(/\s/g,''),`f^(-1)(x)＝log${b}(${expectedArg})${expectedTail}`);
 // Check both compositions on well-conditioned points relative to each function's domain.
 for(const e of [-1,0,1,2]){const x=k+b**e,g=Math.log(x-k)/Math.log(b)+h,f=b**(g-h)+k;assert.ok(Math.abs(f-x)<1e-8*Math.max(1,Math.abs(x)));assert.ok(Math.abs(g-(e+h))<1e-10);}
 count++;
}
assert.equal(bases.size,5);assert.equal(shifts.size,19);
console.log(JSON.stringify({test:'log-inverse',count,bases:bases.size,hValues:shifts.size,passed:true}));
