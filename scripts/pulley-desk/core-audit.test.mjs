import assert from 'node:assert/strict';
import * as m from '../../tools/pulley-desk/model.mjs';
import {Repository,KEY,validateStore} from '../../tools/pulley-desk/storage.mjs';
let checks=0; const check=(f)=>{f();checks++};
for(const d of ['fixed','movable']){ const n=d==='fixed'?1:2;const g0=m.geometry(d,0);for(let h=0;h<=20;h++){
check(()=>{const x=m.calculate(d,h);assert.equal(x.forceN,10/n);assert.equal(x.ropeCm,n*h);assert.equal(x.inputWorkNcm,10*h);assert.equal(x.outputWorkNcm,10*h)});
check(()=>{const g=m.geometry(d,h);assert.equal(g.totalCm,g0.totalCm);assert.equal(g.leftCm,g0.leftCm-h);assert.equal(g.rightCm,g0.rightCm+h);assert.equal(g.endCm-g0.endCm,d==='fixed'?0-h:2*h);assert.ok(g.leftCm>0&&g.rightCm>0)});
}}
function rec(d){const r=m.newRun(d);for(let h=1;h<=20;h++)m.commitRise(r,h,`op-${h}`);return m.createRecord(r)}
const f=rec('fixed'),v=rec('movable');check(()=>m.validatePair(f,v));check(()=>assert.throws(()=>m.validatePair(f,f)));check(()=>assert.throws(()=>m.validatePair(v,f)));
for(const d of ['fixed','movable']){const r=m.newRun(d); check(()=>{r.h=20;r.phase='atTarget';assert.throws(()=>m.createRecord(r))}); const s=m.newRun(d);m.commitRise(s,5,'one');check(()=>{assert.equal(m.commitRise(s,10,'one'),false);assert.equal(s.h,5);assert.equal(m.commitRise(s,4,'two'),false);assert.equal(s.h,5)});}
check(()=>{assert.ok(Object.isFrozen(f));assert.ok(Object.isFrozen(f.operations[0]));assert.throws(()=>{f.forceN=0})});
for(const good of ['2','2.0','2.00',' 2.00 '])check(()=>assert.equal(m.parseWork(good),200));
for(const bad of ['','2.000','2e0','2 J','-2','Infinity','2,00','+2'])check(()=>assert.throws(()=>m.parseWork(bad)));
class Storage{constructor(raw=null){this.raw=raw;this.log=[];this.fail=false}getItem(k){this.log.push(['get',k]);if(k!==KEY)throw Error('foreignkey');return this.raw}setItem(k,x){this.log.push(['set',k,x]);if(k!==KEY)throw Error('foreignkey');if(this.fail)throw Error('QuotaExceeded');this.raw=x}}
const st=new Storage(),r=new Repository(st);r.addRecord(f);r.addRecord(v);check(()=>validateStore(JSON.parse(st.raw)));const before=JSON.stringify(r.data.records);r.setWork(f.recordId,v.recordId,{fixedInput:200,fixedOutput:200,movableInput:200,movableOutput:200});for(let i=0;i<3;i++)r.appendRevision(f.recordId,v.recordId,`解釋${i}`,`rev-${i}`);check(()=>assert.equal(JSON.stringify(r.data.records),before));check(()=>assert.equal(new Repository(st).data.pairs[m.pairKey(f.recordId,v.recordId)].revisions.length,3));
const fail=new Storage();fail.fail=true;const rm=new Repository(fail);rm.addRecord(f);rm.addRecord(v);check(()=>{assert.equal(rm.status,'memoryOnly');assert.equal(rm.data.records.length,2);assert.equal(fail.raw,null);rm.ensurePair(f.recordId,v.recordId)});fail.fail=false;rm.retry();check(()=>{assert.equal(rm.status,'persisted');assert.equal(rm.data.records.length,2)});rm.addRecord(f);check(()=>assert.equal(rm.data.records.length,2));
for(const raw of ['{',JSON.stringify({...r.data,schemaVersion:99}),JSON.stringify({...r.data,records:[{...f,forceN:0}]})]){const bad=new Storage(raw),repo=new Repository(bad);check(()=>{assert.equal(repo.status,'blocked');assert.equal(bad.log.filter(x=>x[0]==='set').length,0);assert.equal(repo.original(),raw)});repo.addRecord(v);repo.retry();check(()=>{assert.equal(repo.data.records.length,1);assert.equal(bad.raw,raw);assert.equal(bad.log.filter(x=>x[0]==='set').length,0)});}
const concurrent=new Storage(),a=new Repository(concurrent),b=new Repository(concurrent);a.addRecord(f);b.addRecord(v);check(()=>{assert.equal(b.status,'blocked');assert.equal(b.blockedReason,'conflict');assert.equal(JSON.parse(concurrent.raw).records[0].recordId,f.recordId);assert.equal(b.data.records[0].recordId,v.recordId)});
console.log(JSON.stringify({checks,pass:true}));
