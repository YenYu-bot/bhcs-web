import assert from 'node:assert/strict';
import {load,mathText,value} from './helper.mjs';

const api=load('g11','spacecross');
const unit=api.CFG.units.find(candidate=>candidate.id==='height');
const dot=(a,b)=>a.reduce((sum,x,index)=>sum+x*b[index],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const vectors=html=>[...mathText(html).matchAll(/\((-?\d+)，(-?\d+)，(-?\d+)\)/g)].map(match=>match.slice(1).map(Number));
const stats={};

for(const level of ['basic','advanced','challenge']){
 let produced=0,nulls=0;
 for(let i=0;i<5000;i++){
  const q=unit.gen({level,modes:['integer'],mixed:false});
  if(!q){nulls++;continue;}
  assert.equal(q.verify(),true);
  const [u,v,w]=vectors(q.expr),normal=cross(u,v),volume=Math.abs(dot(w,normal)),base=Math.hypot(...normal);
  assert.ok(volume>0);
  assert.ok(base>0);
  assert.ok(Math.abs(value(mathText(q.answer))-volume/base)<1e-9);
  produced++;
 }
 const rejectionRate=nulls/(produced+nulls);
 assert.ok(rejectionRate<0.5,`${level} rejection rate ${rejectionRate}`);
 stats[level]={produced,nulls,rejectionRate};
}
console.log(JSON.stringify({test:'spacecross-height',stats,passed:true}));
