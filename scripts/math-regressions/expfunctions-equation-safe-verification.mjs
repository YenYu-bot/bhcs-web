import assert from 'node:assert/strict';
import {load,mathText,value,rational} from './helper.mjs';

const api=load('g11','expfunctions');
const unit=api.CFG.units.find(candidate=>candidate.id==='equation');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
let produced=0,nulls=0;
const modes=new Set();
for(const level of ['basic','advanced','challenge'])for(const mode of unit.modes)for(let i=0;i<500;i++){
 const q=unit.gen({level,modes:[mode],mixed:false});
 if(!q){nulls++;continue;}
 assert.equal(q.verify(),true);
 const [,actualMode,baseText,mText,nText,pText]=q.sig.split(':');
 const base=rational(baseText),m=Number(mText),n=Number(nText),p=rational(pText);
 assert.ok(base>0&&base!==1);
 close(value(mathText(q.answer).split('＝')[1]),(p-n)/m);
 modes.add(actualMode);produced++;
}
assert.deepEqual(modes,new Set(unit.modes));
console.log(JSON.stringify({test:'expfunctions-equation-safe-verification',produced,nulls,modes:[...modes],passed:true}));
