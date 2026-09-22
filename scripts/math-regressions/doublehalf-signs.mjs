import assert from 'node:assert/strict';
import {load,mathText,value,rational} from './helper.mjs';
const api=load('g11','doublehalf');let count=0;
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(const id of ['fromsin','half']){
 const quadrants=new Set(),u=api.CFG.units.find(u=>u.id===id);
 for(const level of ['basic','advanced','challenge'])for(const mode of u.modes)for(let i=0;i<200;i++){
  const q=u.gen({level,modes:[mode],mixed:false});assert.ok(q);assert.equal(q.verify(),true);
  const parts=q.sig.split(':'),actual=q.answer.split('；').map(s=>value(mathText(s.split('＝')[1])));
  let angle;
  if(parts[0]==='hs')angle=Number(parts[1])*Math.PI/180;
  else{
   const quadrant=Number(parts[2]),r=rational(parts[3]);quadrants.add(quadrant);
   if(id==='fromsin'){const alpha=Math.asin(r);angle=quadrant===1?alpha:quadrant===2||quadrant===3?Math.PI-alpha:2*Math.PI+alpha;angle*=2;}
   else{angle=Math.acos(r);if(quadrant>2)angle=2*Math.PI-angle;angle/=2;}
  }
  [Math.sin(angle),Math.cos(angle),Math.tan(angle)].forEach((n,j)=>close(actual[j],n));count++;
 }
 assert.equal(quadrants.size,4);
}
console.log(JSON.stringify({test:'doublehalf-signs',count,quadrants:'all four',passed:true}));
