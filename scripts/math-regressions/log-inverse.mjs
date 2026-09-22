import assert from 'node:assert/strict';
import {load,mathText} from './helper.mjs';

const api=load('g11','loggraphs');
const unit=api.CFG.units.find(candidate=>candidate.id==='inverse');
let count=0;
const bases=new Set(),shifts=new Set();

for(const level of ['basic','advanced','challenge'])for(let i=0;i<200;i++){
 const q=unit.gen({level,modes:['integer'],mixed:false});
 assert.ok(q);
 assert.equal(q.verify(),true);
 const [,base,h,k]=q.sig.split(':').map(Number);
 bases.add(base);shifts.add(h);
 const expectedArg=k===0?'x':k<0?`x+${-k}`:`x-${k}`;
 const expectedTail=h===0?'':h>0?`+${h}`:`-${-h}`;
 assert.equal(mathText(q.answer).replace(/\s/g,''),`f^(-1)(x)＝log${base}(${expectedArg})${expectedTail}`);
 for(const exponent of [-1,0,1,2]){
  const x=k+base**exponent;
  const inverse=Math.log(x-k)/Math.log(base)+h;
  const composed=base**(inverse-h)+k;
  assert.ok(Math.abs(composed-x)<1e-8*Math.max(1,Math.abs(x)));
  assert.ok(Math.abs(inverse-(exponent+h))<1e-10);
 }
 count++;
}
assert.equal(bases.size,5);
assert.equal(shifts.size,19);
console.log(JSON.stringify({test:'log-inverse',count,bases:bases.size,hValues:shifts.size,passed:true}));
