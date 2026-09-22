import assert from 'node:assert/strict';
import {load,mathText,value} from './helper.mjs';

const api=load('g11','spaceinner');
const unit=api.CFG.units.find(candidate=>candidate.id==='pointdistance');
const dot=(a,b)=>a.reduce((sum,x,index)=>sum+x*b[index],0);
const sub=(a,b)=>a.map((x,index)=>x-b[index]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const coords=html=>[...mathText(html).matchAll(/\((-?\d+)，(-?\d+)，(-?\d+)\)/g)].map(match=>match.slice(1).map(Number));
const close=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);
let count=0;
const directions=new Set();

for(const level of ['basic','advanced','challenge'])for(let i=0;i<200;i++){
 const q=unit.gen({level,modes:['integer'],mixed:false});
 assert.ok(q);
 assert.equal(q.verify(),true);
 const [A,d,P]=coords(q.expr);
 assert.ok(A&&d&&P,q.expr);
 directions.add(d.join(','));
 const displayed=value(mathText(q.answer));

 // Method 1: orthogonal projection onto A + td.
 const delta=sub(P,A),t=dot(delta,d)/dot(d,d),foot=A.map((x,index)=>x+t*d[index]);
 close(dot(sub(P,foot),d),0);
 close(displayed,Math.hypot(...sub(P,foot)));

 // Method 2: point-line distance from the cross product, independent of the generated foot.
 close(displayed,Math.hypot(...cross(delta,d))/Math.hypot(...d));
 count++;
}
assert.equal(directions.size,6);
console.log(JSON.stringify({test:'spaceinner-pointdistance',count,directions:directions.size,methods:2,passed:true}));
