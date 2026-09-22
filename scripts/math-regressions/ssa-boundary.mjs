import assert from 'node:assert/strict';
import {load,mathText,value} from './helper.mjs';

const api=load('g11','sincosarea');
const unit=api.CFG.units.find(candidate=>candidate.id==='ambiguous');
let count=0,boundary=0;
const kinds=new Set();

for(const level of ['basic','advanced','challenge'])for(let i=0;i<200;i++){
 const q=unit.gen({level,modes:['integer'],mixed:false});
 assert.ok(q);
 assert.equal(q.verify(),true);
 const text=mathText(q.expr),match=text.match(/∠A＝(\d+)°、a＝(.+)、b＝(.+)。判斷/);
 assert.ok(match);
 const A=Number(match[1]),a=value(match[2]),b=value(match[3]),altitude=b*Math.sin(A*Math.PI/180);
 const expected=A===30&&a*2===b?1:a<altitude?0:a<b?2:1;
 if(A===30&&a*2===b)boundary++;
 const actual=q.answer==='無法形成三角形'?0:Number(q.answer.match(/可形成 (\d+) 個/)[1]);
 assert.equal(actual,expected);
 if(actual){
  const angles=q.answer.split('∠B＝')[1].match(/\d+/g).map(Number);
  assert.equal(angles.length,actual);
  for(const B of angles){
   assert.ok(A+B<180);
   assert.ok(Math.abs(a/Math.sin(A*Math.PI/180)-b/Math.sin(B*Math.PI/180))<1e-9);
  }
 }
 kinds.add(actual);count++;
}
assert.deepEqual([...kinds].sort(),[0,1,2]);
assert.ok(boundary>50);
console.log(JSON.stringify({test:'ssa-boundary',count,boundary,passed:true}));
