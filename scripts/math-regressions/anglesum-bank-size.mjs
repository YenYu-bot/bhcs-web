import assert from 'node:assert/strict';
import {load} from './helper.mjs';

const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1;};
const reduce=(n,d)=>{const g=gcd(n,d);return [n/g,d/g];};

const triples=[[3,4,5],[4,3,5],[5,12,13],[12,5,13]];
const knownExact=new Set();
for(const [sa,ca,da] of triples)for(const [sb,cb,db] of triples){
 if(sa===sb&&ca===cb&&da===db)continue;
 for(const op of [1,-1]){
  const [n,d]=reduce(sa*cb+op*ca*sb,da*db);
  if(Math.abs(n)<=10000&&d<=100)knownExact.add(`kn:${sa}/${da}:${ca}/${da}:${sb}/${db}:${cb}/${db}:${op}`);
 }
}
assert.equal(knownExact.size,22);

const triangleExact=new Set();
for(let m=2;m<=22;m++)for(let n=1;n<m;n++)for(const swap of [false,true]){
 const a=swap?m*m-n*n:2*m*n,b=swap?2*m*n:m*m-n*n,c=m*m+n*n,g=gcd(gcd(a,b),c);
 const [sn,sd]=reduce(a/g,c/g),[cn,cd]=reduce(b/g,c/g);
 if(sn>0&&cn>0&&sd<=100&&cd<=100)triangleExact.add(`tr:${sn}/${sd}:${cn}/${cd}`);
}
assert.equal(triangleExact.size,32);

const api=load('g11','anglesum');
for(const [id,expected,exact] of [['known',22,knownExact],['triangle',32,triangleExact]]){
 const unit=api.CFG.units.find(candidate=>candidate.id===id);
 assert.equal(unit.bankSize,expected);
 const sampled=new Set();
 for(let i=0;i<100000;i++){
  const q=unit.gen({level:'challenge',modes:['fraction'],mixed:true});
  if(!q)continue;
  assert.equal(q.verify(),true);
  if(api.contentGuard(q,'challenge'))sampled.add(q.sig);
 }
 assert.deepEqual([...sampled].sort(),[...exact].sort());
}

console.log(JSON.stringify({test:'anglesum-bank-size',known:22,triangle:32,passed:true}));
