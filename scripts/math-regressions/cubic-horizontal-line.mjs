import assert from 'node:assert/strict';
import {load,rational,mathText,value} from './helper.mjs';
const u=load('g10','cubic').CFG.units.find(u=>u.id==='global');let positiveHorizontal=0,combined=0;
for(let i=0;i<1000;i++){
 const q=u.gen({level:'challenge',modes:['integer'],mixed:false});if(q?.style!=='combined')continue;
 const [,r,m,v]=q.sig.split(':').slice(2).map(rational),line=mathText(q.expr.match(/附近近似 y＝(.+)，且/)[1]);
 assert.equal(value(line,r)+0,v+0,q.expr);assert.equal(value(line,r+1)+0,v+m+0,q.expr);
 if(m===0&&v>0)positiveHorizontal++;combined++;
}
assert.ok(positiveHorizontal>0);console.log(JSON.stringify({test:'cubic-horizontal-line',combined,positiveHorizontal,passed:true}));
