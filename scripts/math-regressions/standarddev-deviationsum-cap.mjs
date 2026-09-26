import assert from 'node:assert/strict';
import {load,mathText,value} from './helper.mjs';

const api=load('g11','standarddev');
const unit=api.CFG.units.find(candidate=>candidate.id==='deviationsum');
let produced=0,nulls=0,forward=0,reverse=0;
for(const level of ['basic','advanced','challenge'])for(let i=0;i<2000;i++){
 const q=unit.gen({level,modes:['integer'],mixed:false});
 if(!q){nulls++;continue;}
 assert.equal(q.verify(),true);
 const [,nText,sdText]=q.sig.split(':'),n=Number(nText),sd=Number(sdText),answer=value(mathText(q.answer));
 const prompt=q.expr,reverseMatch=prompt.match(/Σ（xᵢ−μ）²＝(\d+)/);
 if(prompt.includes('Σ（xᵢ−μ）²＝')){
  assert.ok(reverseMatch,'reverse question must state the squared-deviation sum');
  const sum=Number(reverseMatch[1]);
  assert.equal(answer,sd);
  assert.equal(answer*answer*n,sum);
  assert.equal(sum,n*sd*sd);
  assert.ok(sum<=10000);
  reverse++;
 }else{
  assert.equal(answer,n*sd*sd);
  forward++;
 }
 assert.ok(answer<=10000);
 assert.ok(n*sd*sd<=10000);
 assert.ok(n>=4&&n<=(level==='challenge'?60:30));
 assert.ok(sd>=1&&sd<=(level==='challenge'?15:9));
 produced++;
}
assert.ok(nulls>0,'challenge should reject over-limit candidates');
assert.ok(forward>0,'forward questions must be checked');
assert.ok(reverse>0,'reverse questions must be checked');
console.log(JSON.stringify({test:'standarddev-deviationsum-cap',produced,nulls,forward,reverse,passed:true}));
