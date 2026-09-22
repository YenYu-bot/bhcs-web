import assert from 'node:assert/strict';
import {load,mathText} from './helper.mjs';

const api=load('g11','line3d');
const unit=api.CFG.units.find(candidate=>candidate.id==='pointprojection');
const dot=(a,b)=>a.reduce((sum,x,index)=>sum+x*b[index],0);
const sub=(a,b)=>a.map((x,index)=>x-b[index]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const coords=html=>[...mathText(html).matchAll(/\((-?\d+(?:\.\d+)?)，(-?\d+(?:\.\d+)?)，(-?\d+(?:\.\d+)?)\)/g)].map(match=>match.slice(1).map(Number));
const close=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);
let count=0;
const directions=new Set();

for(const level of ['basic','advanced','challenge'])for(let i=0;i<200;i++){
 const q=unit.gen({level,modes:['integer'],mixed:false});
 assert.ok(q);
 assert.equal(q.verify(),true);
 const [P,A,d]=coords(q.expr),Q=coords(q.answer)[0];
 assert.ok(P&&A&&d&&Q,q.expr);
 directions.add(d.join(','));

 // Method 1: two geometric defining conditions, evaluated from the printed values.
 assert.ok(cross(sub(Q,A),d).every(component=>component===0));
 assert.equal(dot(sub(P,Q),d),0);

 // Method 2: independently recompute the orthogonal projection parameter.
 const projection=dot(sub(P,A),d)/dot(d,d);
 const expected=A.map((x,index)=>x+projection*d[index]);
 expected.forEach((x,index)=>close(Q[index],x));
 count++;
}
assert.equal(directions.size,6);
console.log(JSON.stringify({test:'line3d-pointprojection',count,directions:directions.size,methods:2,passed:true}));
