import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorageDriver, STORAGE_KEY, LOCK_NAME, MAX_RAW_BYTES } from '../../tools/motion-graphs-desk/storage.mjs';

const snap = (n=0) => ({ version: 1, runId: 'run-one', storageRevision: n, records: Array.from({length:n}, (_,i)=>({id:`record-${i}`})) });
const validate = value => value?.version === 1 && Array.isArray(value.records) && value.records.length <= 9
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
 const raw=' { "version": 1, "runId": "run-one", "storageRevision": 0, "records": [] } ';
 const f=fixture(raw);assert.deepEqual(f.driver.read().snapshot,snap());assert.equal(f.driver.raw,raw);assert.equal(writes(f).length,0);
});
test('cached read cannot adopt foreign changed snapshot and erase conflict baseline',async()=>{
 const f=fixture(JSON.stringify(snap()));f.driver.read();f.map.set(STORAGE_KEY,JSON.stringify(snap(2)));
 assert.deepEqual(f.driver.read().snapshot,snap());const r=await f.driver.write(snap(1));assert.equal(r.error,'conflict');assert.equal(writes(f).length,0);
});
for(const raw of ['broken JSON','{"version":999,"records":[]}',JSON.stringify(snap(10))]) {
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
test('successful result identifies this exact saved revision and normalized bytes',async()=>{
 const f=fixture();f.driver.read();const value=snap(2),result=await f.driver.write(value);
 assert.equal(result.savedRevision,2);assert.equal(result.savedRaw,JSON.stringify(value));assert.equal(result.savedRaw,f.map.get(STORAGE_KEY));
 const repeat=await f.driver.write(value);assert.equal(repeat.savedRevision,2);assert.equal(repeat.savedRaw,result.savedRaw);
});
test('oversized incoming raw is quarantined before validator runs and remains byte-exact for backup',async()=>{
 const raw='界'.repeat(Math.ceil(MAX_RAW_BYTES/3)+1);const f=fixture(raw);let validations=0;
 const d=createStorageDriver({storage:f.storage,locks:f.locks,validate(value){validations++;return validate(value);}});
 assert.equal(d.read().status,'quarantined');assert.equal(validations,0);assert.equal(d.raw,raw);assert.equal(d.canBackupRaw,true);
 assert.equal((await d.write(snap(1))).ok,false);assert.equal(f.map.get(STORAGE_KEY),raw);assert.equal(writes(f).length,0);
 assert.equal((await d.clear()).ok,true);assert.equal(f.map.has(STORAGE_KEY),false);
});
test('128 KiB outgoing limit counts UTF-8 bytes not JS code units; oversized snapshot cannot replace old raw',async()=>{
 const f=fixture(JSON.stringify(snap()));f.driver.read();const value={...snap(1),padding:'界'.repeat(45000)};
 assert.ok(JSON.stringify(value).length<MAX_RAW_BYTES);assert.ok(new TextEncoder().encode(JSON.stringify(value)).byteLength>MAX_RAW_BYTES);
 const result=await f.driver.write(value);assert.equal(result.error,'snapshot-too-large');assert.equal(result.deviceSaved,false);
 assert.equal(f.map.get(STORAGE_KEY),JSON.stringify(snap()));assert.equal(writes(f).length,0);assert.equal(f.locks.calls.length,0);
});
test('exact 128 KiB is accepted; next UTF-8 byte is rejected',async()=>{
 const f=fixture();f.driver.read();const value={...snap(1),padding:''};
 const overhead=new TextEncoder().encode(JSON.stringify(value)).byteLength;value.padding='a'.repeat(MAX_RAW_BYTES-overhead);
 assert.equal(new TextEncoder().encode(JSON.stringify(value)).byteLength,MAX_RAW_BYTES);
 assert.equal((await f.driver.write(value)).ok,true);const raw=f.map.get(STORAGE_KEY);
 value.padding+='a';assert.equal((await f.driver.write(value)).error,'snapshot-too-large');assert.equal(f.map.get(STORAGE_KEY),raw);
});
test('oversize read without Web Locks still preserves original and denies unsafe clear',async()=>{
 const raw='x'.repeat(MAX_RAW_BYTES+1),f=fixture(raw);const d=createStorageDriver({storage:f.storage,locks:null,validate});
 assert.equal(d.read().status,'quarantined');assert.equal(d.raw,raw);assert.equal((await d.clear()).ok,false);assert.equal(f.map.get(STORAGE_KEY),raw);
});
test('invalid validator and serialization failures cannot write or claim saved revision',async()=>{
 const f=fixture();const d=createStorageDriver({storage:f.storage,locks:f.locks,validate(){throw Error('validator');}});d.read();
 const result=await d.write(snap(1));assert.equal(result.ok,false);assert.equal(Object.hasOwn(result,'savedRevision'),false);assert.equal(writes(f).length,0);
});
test('same run stale revision and same revision changed bytes never replace newer evidence',async()=>{
 const f=fixture(JSON.stringify(snap(2)));f.driver.read();const before=f.map.get(STORAGE_KEY);
 assert.equal((await f.driver.write(snap(1))).error,'stale-revision');
 assert.equal((await f.driver.write({...snap(2),extra:'changed'})).error,'revision-content-mismatch');
 assert.equal(f.map.get(STORAGE_KEY),before);assert.equal(writes(f).length,0);
 assert.equal((await f.driver.write({...snap(2),storageRevision:3,extra:'new revision'})).ok,true);
});
test('new run cannot overwrite saved run without successful explicit clear',async()=>{
 const f=fixture(JSON.stringify(snap(1)));f.driver.read();const next={...snap(0),runId:'new-run'};
 assert.equal((await f.driver.write(next)).error,'run-needs-reset');assert.equal(f.map.get(STORAGE_KEY),JSON.stringify(snap(1)));
 assert.equal((await f.driver.clear()).ok,true);const result=await f.driver.write(next);assert.equal(result.ok,true);assert.equal(result.savedRevision,0);
});
test('queued older same-run snapshot is checked after newer write has actually completed',async()=>{
 const f=fixture();f.driver.read();const [newer,older]=await Promise.all([f.driver.write(snap(2)),f.driver.write(snap(1))]);
 assert.equal(newer.deviceSaved,true);assert.equal(older.error,'stale-revision');assert.equal(f.map.get(STORAGE_KEY),JSON.stringify(snap(2)));
});
test('pretty printed stored snapshot can safely confirm same normalized revision',async()=>{
 const value=snap(1),f=fixture(JSON.stringify(value,null,2));f.driver.read();const r=await f.driver.write(value);
 assert.equal(r.ok,true);assert.equal(r.savedRevision,1);assert.equal(r.savedRaw,JSON.stringify(value));
});
test('default motion schema roundtrips exact record prefix and rejects future/unknown/transient payloads',async()=>{
 const {emptySnapshot,SCENARIO_VERSION}=await import('../../tools/motion-graphs-desk/model.mjs');
 const f=fixture(),d=createStorageDriver({storage:f.storage,locks:f.locks});d.read();
 const snapshot=emptySnapshot('motion-run');snapshot.storageRevision=1;snapshot.records.push({runId:'motion-run',sampleId:'t0',scenarioVersion:SCENARIO_VERSION,tSeconds:0,observedPositionM:1,studentReadingRaw:'1.00',normalizedReadingM:1,captureMode:'initial',sequence:0,createdAt:'2026-10-31T08:00:00.000Z'});
 const saved=await d.write(snapshot);assert.equal(saved.ok,true);assert.equal(saved.savedRevision,1);
 const restored=createStorageDriver({storage:f.storage,locks:f.locks}).read();assert.deepEqual(restored.snapshot,snapshot);
 const before=f.map.get(STORAGE_KEY);
 for(const candidate of [{...snapshot,schemaVersion:99},{...snapshot,observationT:0.4},{...snapshot,storageRevision:Infinity},{...snapshot,records:[snapshot.records[0],snapshot.records[0]]}]){
  assert.equal((await d.write(candidate)).error,'invalid-snapshot');assert.equal(f.map.get(STORAGE_KEY),before);
 }
});
test('default schema malformed JSON and unsupported motion snapshot preserve original bytes',()=>{
 for(const raw of ['{"schemaVersion":1,"scenarioVersion":"future"}','{"observationT":NaN}',JSON.stringify({schemaVersion:1,scenarioVersion:'motion-position-piecewise-v1',completed:true})]){
  const f=fixture(raw),d=createStorageDriver({storage:f.storage,locks:f.locks});assert.equal(d.read().status,'quarantined');assert.equal(d.raw,raw);assert.equal(d.canBackupRaw,true);assert.equal(writes(f).length,0);
 }
});
