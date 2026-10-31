import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorageDriver, STORAGE_KEY, LOCK_NAME } from '../../tools/friction-efficiency-desk/storage.mjs';

const snap = (n=0) => ({ version: 1, records: Array.from({length:n}, (_,i)=>({id:`record-${i}`})) });
const validate = value => value?.version === 1 && Array.isArray(value.records) && value.records.length <= 2
  ? {ok:true,snapshot:JSON.parse(JSON.stringify(value))} : {ok:false,error:'bad fixture'};
const realLocks = () => {
  let queue = Promise.resolve();
  return { calls: [], request(name, options, callback) {
    this.calls.push({ name, options });
    const run = queue.then(callback); queue = run.catch(()=>{}); return run;
  }};
};
function fixture(raw=null, extra={}) {
  const map = new Map([['bhcs.inclineDesk.v1','prior-incline'],['unrelated','keep']]);
  if(raw!==null) map.set(STORAGE_KEY, raw);
  const calls=[];
  const storage={
    getItem(key){calls.push(['get',key]);if(extra.failRead)throw Error('blocked');return map.get(key)??null;},
    setItem(key,value){calls.push(['set',key,value]);if(extra.failWrite)throw Error('quota');map.set(key,value);},
    removeItem(key){calls.push(['remove',key]);if(extra.failClear)throw Error('denied');map.delete(key);},
  };
  const locks=realLocks();
  const driver=createStorageDriver({storage,locks,validate});
  return {map,calls,storage,locks,driver,extra};
}
const writes=f=>f.calls.filter(([kind])=>kind==='set'||kind==='remove');

test('empty read is read-only; write waits native completion and isolates other keys',async()=>{
 const f=fixture();assert.deepEqual(f.driver.read(),{snapshot:null,status:'normal'});assert.equal(writes(f).length,0);
 const result=await f.driver.write(snap(1));assert.equal(result.deviceSaved,true);
 assert.equal(f.map.get(STORAGE_KEY),JSON.stringify(snap(1)));
 assert.equal(f.map.get('bhcs.inclineDesk.v1'),'prior-incline');assert.equal(f.map.get('unrelated'),'keep');
 assert.deepEqual(f.locks.calls[0],{name:LOCK_NAME,options:{mode:'exclusive'}});
 assert.equal(f.driver.canBackupRaw,true);assert.equal(f.driver.raw,JSON.stringify(snap(1)));
});
test('restores valid bytes without canonicalizing or writing them',()=>{
 const raw=' { "version": 1, "records": [] } ';
 const f=fixture(raw);assert.deepEqual(f.driver.read().snapshot,snap());assert.equal(f.driver.raw,raw);assert.equal(writes(f).length,0);
});
test('cached read cannot adopt foreign changed snapshot and erase conflict baseline',async()=>{
 const f=fixture(JSON.stringify(snap()));f.driver.read();f.map.set(STORAGE_KEY,JSON.stringify(snap(2)));
 assert.deepEqual(f.driver.read().snapshot,snap());const r=await f.driver.write(snap(1));assert.equal(r.error,'conflict');assert.equal(writes(f).length,0);
});
for(const raw of ['broken JSON','{"version":999,"records":[]}',JSON.stringify(snap(3))]) {
 test(`quarantines raw ${raw.slice(0,24)} without overwrite; explicit clear only`,async()=>{
  const f=fixture(raw);assert.equal(f.driver.read().status,'quarantined');assert.equal(f.driver.raw,raw);assert.equal(f.driver.canBackupRaw,true);
  assert.equal((await f.driver.write(snap())).ok,false);assert.equal(writes(f).length,0);
  assert.equal((await f.driver.clear()).ok,true);assert.equal(f.map.has(STORAGE_KEY),false);assert.equal(f.driver.raw,null);
  assert.equal((await f.driver.write(snap(1))).ok,true);
 });
}
test('failed quarantine clear never unlocks overwrite protection',async()=>{
 const f=fixture('broken',{failClear:true});f.driver.read();assert.equal((await f.driver.clear()).ok,false);
 assert.equal(f.driver.status,'quarantined');assert.equal((await f.driver.write(snap())).ok,false);assert.equal(f.map.get(STORAGE_KEY),'broken');
 f.extra.failClear=false;assert.equal((await f.driver.clear()).ok,true);
});
test('read exception cannot fabricate raw backup, write, or reset success',async()=>{
 const f=fixture('secret',{failRead:true});assert.equal(f.driver.read().status,'memory-only');
 assert.equal(f.driver.raw,null);assert.equal(f.driver.canBackupRaw,false);
 assert.equal((await f.driver.write(snap())).ok,false);assert.equal((await f.driver.clear()).ok,false);assert.equal(writes(f).length,0);
});
test('no Web Locks is memory-only even with available localStorage',async()=>{
 const f=fixture();const d=createStorageDriver({storage:f.storage,locks:null,validate});
 assert.equal(d.read().status,'memory-only');assert.equal((await d.write(snap(1))).deviceSaved,false);
 const result=await d.clear();assert.equal(result.ok,true);assert.equal(result.localOnly,true);assert.equal(result.deviceSaved,false);assert.equal(writes(f).length,0);
});
test('no Web Locks preserves existing valid and invalid bytes',async()=>{
 for(const raw of [JSON.stringify(snap(1)),'not json']) {
  const f=fixture(raw);const d=createStorageDriver({storage:f.storage,locks:null,validate});d.read();
  assert.equal((await d.write(snap(2))).ok,false);assert.equal((await d.clear()).ok,false);
  assert.equal(f.map.get(STORAGE_KEY),raw);assert.equal(writes(f).length,0);
 }
});
test('no-lock local reset rereads to notice newly created data',async()=>{
 const f=fixture();const d=createStorageDriver({storage:f.storage,locks:null,validate});d.read();f.map.set(STORAGE_KEY,'new data');
 assert.equal((await d.clear()).ok,false);assert.equal(d.status,'conflict');assert.equal(f.map.get(STORAGE_KEY),'new data');
});
test('quota error preserves evidence and same snapshot retry is idempotent',async()=>{
 const f=fixture(null,{failWrite:true});f.driver.read();const first=await f.driver.write(snap(1));
 assert.equal(first.ok,false);assert.equal(first.deviceSaved,false);assert.equal(f.driver.status,'memory-only');assert.equal(f.driver.raw,null);
 f.extra.failWrite=false;assert.equal((await f.driver.write(snap(1))).deviceSaved,true);
 assert.equal((await f.driver.write(snap(1))).deviceSaved,true);assert.equal(writes(f).filter(([kind])=>kind==='set').length,2);
 assert.equal(JSON.parse(f.map.get(STORAGE_KEY)).records.length,1);
});
test('retry after failure detects a foreign write instead of overwriting it',async()=>{
 const f=fixture(null,{failWrite:true});f.driver.read();await f.driver.write(snap(1));
 f.extra.failWrite=false;f.map.set(STORAGE_KEY,JSON.stringify(snap(2)));
 assert.equal((await f.driver.write(snap(1))).error,'conflict');assert.equal(f.map.get(STORAGE_KEY),JSON.stringify(snap(2)));
});
test('snapshot copied before async lock acquisition; success is not reported early',async()=>{
 const f=fixture();let callback, release;
 const locks={request(name,opts,fn){callback=fn;return new Promise(resolve=>{release=()=>resolve(fn());});}};
 const statuses=[];const d=createStorageDriver({storage:f.storage,locks,validate,onStatus:s=>statuses.push(s)});d.read();
 const value=snap(1);let settled=false;const pending=d.write(value).then(r=>{settled=true;return r;});
 value.records.push({id:'mutation'});await Promise.resolve();await Promise.resolve();
 assert.equal(typeof callback,'function');assert.equal(settled,false);assert.equal(d.busy,true);assert.equal(f.map.has(STORAGE_KEY),false);
 assert.equal(statuses.some(s=>s.detail==='已存此裝置。'),false);release();assert.equal((await pending).deviceSaved,true);
 assert.deepEqual(JSON.parse(f.map.get(STORAGE_KEY)),snap(1));assert.equal(d.busy,false);
});
test('two driver instances under same lock reject stale read and protect reset',async()=>{
 const f=fixture();const a=f.driver,b=createStorageDriver({storage:f.storage,locks:f.locks,validate});a.read();b.read();
 const [ra,rb]=await Promise.all([a.write(snap(1)),b.write(snap(2))]);assert.equal(ra.ok,true);assert.equal(rb.error,'conflict');
 assert.equal((await b.clear()).error,'conflict');assert.equal(f.map.get(STORAGE_KEY),JSON.stringify(snap(1)));
});
test('clear invalidates queued pre-reset snapshots and rejects new writes until settled',async()=>{
 const f=fixture(JSON.stringify(snap()));let release;
 const locks={request(name,opts,fn){if(!release)return new Promise(resolve=>{release=()=>resolve(fn());});return Promise.resolve(fn());}};
 const d=createStorageDriver({storage:f.storage,locks,validate});d.read();
 const a=d.write(snap(1));await Promise.resolve();await Promise.resolve();
 const b=d.write(snap(2));const reset=d.clear();const c=await d.write(snap(1));assert.equal(c.error,'reset-pending');
 release();assert.equal((await a).error,'superseded-by-reset');assert.equal((await b).error,'superseded-by-reset');
 assert.equal((await reset).ok,true);assert.equal(f.map.has(STORAGE_KEY),false);assert.equal(writes(f).filter(([k])=>k==='set').length,0);
 assert.equal((await d.write(snap(1))).ok,true);assert.deepEqual(JSON.parse(f.map.get(STORAGE_KEY)),snap(1));
});
test('clear failure preserves prior bytes, can retry, and never clears other keys',async()=>{
 const raw=JSON.stringify(snap(2));const f=fixture(raw,{failClear:true});f.driver.read();
 assert.equal((await f.driver.clear()).ok,false);assert.equal(f.driver.raw,raw);assert.equal(f.map.get(STORAGE_KEY),raw);
 f.extra.failClear=false;assert.equal((await f.driver.clear()).deviceSaved,true);assert.equal(f.map.get('bhcs.inclineDesk.v1'),'prior-incline');
});
test('storage event scope and unchanged bytes are ignored, changed key freezes writes',async()=>{
 const f=fixture(JSON.stringify(snap()));f.driver.read();
 assert.equal(f.driver.handleExternalChange({key:'other',newValue:'x'}),false);
 assert.equal(f.driver.handleExternalChange({key:STORAGE_KEY,newValue:f.driver.raw}),false);
 assert.equal(f.driver.handleExternalChange({key:STORAGE_KEY,newValue:'x',storageArea:{}}),false);
 assert.equal(f.driver.handleExternalChange({key:STORAGE_KEY,newValue:'x',storageArea:f.storage}),true);
 assert.equal((await f.driver.write(snap(1))).error,'conflict');assert.equal(writes(f).length,0);
});
test('storage.clear event freezes old page even if own key absent',()=>{
 const f=fixture();f.driver.read();assert.equal(f.driver.handleExternalChange({key:null,storageArea:f.storage}),true);assert.equal(f.driver.status,'conflict');
});
test('invalid outgoing snapshots do not call locks or native storage',async()=>{
 const f=fixture();f.driver.read();assert.equal((await f.driver.write({version:9})).error,'invalid-snapshot');assert.equal(f.locks.calls.length,0);assert.equal(writes(f).length,0);
});
test('native lock rejection is not saved and later retry can succeed',async()=>{
 const f=fixture();let reject=true;const good=realLocks();const locks={request(...args){return reject?Promise.reject(Error('lock denied')):good.request(...args);}};
 const d=createStorageDriver({storage:f.storage,locks,validate});d.read();assert.equal((await d.write(snap(1))).ok,false);
 reject=false;assert.equal((await d.write(snap(1))).deviceSaved,true);
});
test('throwing presentation callback cannot falsify native write outcome',async()=>{
 const f=fixture();const d=createStorageDriver({storage:f.storage,locks:f.locks,validate,onStatus(){throw Error('render');}});
 d.read();assert.equal((await d.write(snap(1))).deviceSaved,true);assert.deepEqual(JSON.parse(f.map.get(STORAGE_KEY)),snap(1));
});
test('default real schema roundtrips one sealed record without persisting live progress',async()=>{
 const {Engine}=await import('../../tools/friction-efficiency-desk/engine.mjs');const f=fixture();const d=createStorageDriver({storage:f.storage,locks:f.locks});
 d.read();const engine=new Engine();engine.start();const op=engine.beginOperation('pointer');engine.advanceTo(100,op);engine.stop(op);engine.seal();
 assert.equal((await d.write(engine.snapshot())).deviceSaved,true);
 const read=createStorageDriver({storage:f.storage,locks:f.locks}).read();assert.equal(read.snapshot.records.length,1);
 assert.equal(Object.hasOwn(read.snapshot,'reachedS'),false);assert.equal(Object.hasOwn(read.snapshot,'active'),false);
 assert.equal(new Engine(read.snapshot).state.phase,'sealed');
});
