import assert from 'node:assert/strict';
import {load,mathText,value} from './helper.mjs';
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),sub=(a,b)=>a.map((x,i)=>x-b[i]);
const coords=s=>[...mathText(s).matchAll(/\((-?\d+)，(-?\d+)，(-?\d+)\)/g)].map(m=>m.slice(1).map(Number));
let count=0;
for(const [topic,id] of [['spaceinner','pointdistance'],['line3d','pointprojection'],['line3d','pointdistance']]){
 const api=load('g11',topic),u=api.CFG.units.find(u=>u.id===id),directions=new Set();
 for(const level of ['basic','advanced','challenge'])for(let i=0;i<200;i++){
  const q=u.gen({level,modes:['integer'],mixed:false});assert.ok(q);assert.equal(q.verify(),true);
  const vectors=coords(q.expr);let A,d,P;
  if(topic==='spaceinner')[A,d,P]=vectors;
  else{P=vectors[0];A=vectors[1];d=vectors[2];}
  assert.ok(A&&d&&P,q.expr);directions.add(d.join(','));
  const delta=sub(P,A),t=dot(delta,d)/dot(d,d),foot=A.map((x,j)=>x+t*d[j]);
  if(id==='pointprojection')assert.deepEqual(coords(q.answer)[0],foot);
  else assert.ok(Math.abs(value(mathText(q.answer))-Math.hypot(...sub(P,foot)))<1e-9,q.expr);
  count++;
 }
 assert.equal(directions.size,6);
}
console.log(JSON.stringify({test:'perpendicular-vectors',count,passed:true}));
