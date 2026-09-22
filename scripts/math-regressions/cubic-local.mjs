import assert from 'node:assert/strict';
import {load,mathText,value,rational} from './helper.mjs';
const api=load('g10','cubic'),u=api.CFG.units.find(u=>u.id==='global');
let combined=0,nulls=0;
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
for(const level of ['basic','advanced','challenge'])for(const mode of u.modes){
 for(let i=0;i<200;i++){
  const q=u.gen({level,modes:[mode],mixed:false});
  // Existing rejected candidates are tracked; this regression isolates missing localAt.
  if(!q){nulls++;continue;}
  assert.equal(q.verify(),true);
  if(q.style!=='combined')continue;
  combined++;
  const [a,r,m,v,x,y]=q.sig.split(':').slice(2).map(rational);
  const poly=mathText(q.answer).split('＝')[1];
  close(value(poly,r),v);close(value(poly,x),y);
  const line=mathText(q.expr.match(/附近近似 y＝(.+)，且/)[1]);
  close(value(line,r),v);close(value(line,r+1),v+m);
  // A cubic's symmetric unit-step difference includes its cubic coefficient.
  close((value(poly,r+1)-value(poly,r-1))/2-a,m);
 }
}
assert.ok(combined>50);
console.log(JSON.stringify({test:'cubic-local',directCalls:3*u.modes.length*200,combined,nulls,exceptions:0,note:'null candidates remain a separate P2 failure'}));
