import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorageDriver, STORAGE_KEY, STORAGE_LOCK } from '../../tools/incline-desk/storage.mjs';
const empty = () => ({schemaVersion:1,modelVersion:'ideal-incline-v1',records:[],pair:null,answers:null});
function fixture({raw=null,lock=true,api=true,validate}={}) {
  const data = new Map([[STORAGE_KEY,raw],['other-station','KEEP']]);
  const calls=[]; let readError=false,writeError=false,visible=true,lockError=false;
  const storage={getItem(k){calls.push(['get',k]);if(readError)throw Error('read');return data.get(k)??null;},setItem(k,v){calls.push(['set',k,v]);if(writeError)throw Error('quota');data.set(k,v);}};
  let held=false, conflicts=0;
  const locks={async request(name,opts,fn){assert.equal(name,STORAGE_LOCK);assert.deepEqual(opts,{mode:'exclusive',ifAvailable:true});if(lockError)throw Error('lock');held=true;try{const result=fn(lock?{}:null);assert.equal(result?.then,undefined,'lock callback must be synchronous');return result;}finally{held=false;}}};
  const driver=createStorageDriver({storage,locks:api?locks:null,visible:()=>visible,onConflict:()=>conflicts++, ...(validate?{validate}:{})});
  return {driver,data,calls,storage,locks,setReadError:v=>readError=v,setWriteError:v=>writeError=v,setVisible:v=>visible=v,setLockError:v=>lockError=v,get held(){return held;},get conflicts(){return conflicts;},writes:()=>calls.filter(x=>x[0]==='set')};
}
test('writes only singleton key under synchronous short exclusive lock',async()=>{
 const f=fixture();assert.equal(f.driver.load().status,'empty');assert.equal((await f.driver.save(empty(),'op')).status,'saved');
 assert.equal(f.writes().length,1);assert.equal(f.held,false);assert.equal(f.data.get('other-station'),'KEEP');assert.ok(f.calls.every(x=>x[1]===STORAGE_KEY));
});
test('write failure retains memory; same ID deduplicates; explicit retry preserves bytes',async()=>{
 const f=fixture();f.driver.load();f.setWriteError(true);
 assert.equal((await f.driver.save(empty(),'same')).reason,'write-error');const bytes=f.writes()[0][2];
 await f.driver.save(empty(),'same');assert.equal(f.writes().length,1);
 f.setWriteError(false);assert.equal((await f.driver.retry()).status,'saved');assert.equal(f.writes()[1][2],bytes);assert.equal(f.held,false);
 await f.driver.save(empty(),'same');assert.equal(f.writes().length,2);
});
for (const kind of ['no-api','contention','hidden','lock-error']) test(`${kind}: pending memory only and no unsafe fallback`,async()=>{
 const f=fixture({api:kind!=='no-api',lock:kind!=='contention'});f.driver.load();if(kind==='hidden')f.setVisible(false);if(kind==='lock-error')f.setLockError(true);
 const result=await f.driver.save(empty(),'op');assert.equal(result.status,'pending');assert.equal(result.pending,true);assert.equal(f.writes().length,0);assert.equal(f.held,false);
});
test('hidden recovery requires explicit retry',async()=>{
 const f=fixture();f.driver.load();f.setVisible(false);await f.driver.save(empty(),'op');f.setVisible(true);assert.equal(f.writes().length,0);await f.driver.retry();assert.equal(f.writes().length,1);
});
for(const raw of ['{broken',JSON.stringify({...empty(),schemaVersion:999}),JSON.stringify({...empty(),records:[{}]})]) test(`invalid loaded bytes protected: ${raw.slice(0,25)}`,async()=>{
 const f=fixture({raw});assert.equal(f.driver.load().protected,true);await f.driver.save(empty(),'op');assert.equal(f.data.get(STORAGE_KEY),raw);assert.equal(f.writes().length,0);
});
test('read failure protects unknown raw; cannot confirm clear around it',async()=>{
 const f=fixture({raw:'secret old'});f.setReadError(true);assert.equal(f.driver.load().readable,false);
 await f.driver.clear(empty(),{confirmed:true,acknowledged:true,operationId:'clear'});await f.driver.save(empty(),'save');assert.equal(f.writes().length,0);assert.equal(f.data.get(STORAGE_KEY),'secret old');
});
test('reread mismatch cancels operation and blocks save/retry/clear',async()=>{
 const f=fixture();f.driver.load();f.data.set(STORAGE_KEY,'external');
 assert.equal((await f.driver.save(empty(),'op')).status,'conflict');assert.equal(f.conflicts,1);
 await f.driver.retry();await f.driver.save(empty(),'op2');await f.driver.clear(empty(),{confirmed:true,acknowledged:true,operationId:'clear'});
 assert.equal(f.writes().length,0);assert.equal(f.data.get(STORAGE_KEY),'external');
});
test('storage event for same key cancels, other keys ignored',async()=>{
 const f=fixture();f.driver.load();f.driver.handleStorageEvent({key:'other-station'});assert.equal(f.conflicts,0);
 f.driver.handleStorageEvent({key:STORAGE_KEY,storageArea:f.storage});assert.equal(f.conflicts,1);await f.driver.save(empty(),'op');assert.equal(f.writes().length,0);
});
test('clear cancellation has zero writes; clear failure preserves protected raw; retry clears only this key',async()=>{
 const raw='{bad';const f=fixture({raw});f.driver.load();
 await f.driver.clear(empty(),{confirmed:false,acknowledged:true,operationId:'c0'});await f.driver.clear(empty(),{confirmed:true,acknowledged:false,operationId:'c1'});assert.equal(f.writes().length,0);
 f.setWriteError(true);let result=await f.driver.clear(empty(),{confirmed:true,acknowledged:true,operationId:'c2'});assert.equal(result.protected,true);assert.equal(result.raw,raw);assert.equal(f.data.get(STORAGE_KEY),raw);
 f.setWriteError(false);result=await f.driver.retry();assert.equal(result.protected,false);assert.equal(result.status,'saved');assert.equal(f.data.get('other-station'),'KEEP');
});
test('read exception inside lock releases it and protects original data',async()=>{
 const f=fixture({raw:JSON.stringify(empty())});f.driver.load();f.setReadError(true);await f.driver.save(empty(),'op');assert.equal(f.driver.getState().protected,true);assert.equal(f.held,false);assert.equal(f.writes().length,0);
});
test('newest waiting snapshot wins, reset invalidates waiting operation',async()=>{
 const callbacks=[];const f=fixture({validate:s=>({ok:true,snapshot:s})});
 f.locks.request=(n,o,fn)=>new Promise(resolve=>callbacks.push(()=>resolve(fn({}))));f.driver.load();
 const a={...empty(),tag:'old'},b={...empty(),tag:'new'};const p1=f.driver.save(a,'one'),p2=f.driver.save(b,'two');
 callbacks[1]();await p2;callbacks[0]();await p1;assert.equal(f.writes().length,1);assert.equal(JSON.parse(f.data.get(STORAGE_KEY)).tag,'new');
 const p3=f.driver.save(a,'three');f.driver.invalidatePending();callbacks[2]();await p3;assert.equal(f.writes().length,1);
});
test('visibility checked again when callback eventually runs',async()=>{
 const f=fixture();let run;f.locks.request=(n,o,fn)=>new Promise(resolve=>run=()=>resolve(fn({})));f.driver.load();const p=f.driver.save(empty(),'op');f.setVisible(false);run();await p;assert.equal(f.writes().length,0);
});
test('clear invalidates an older waiting save; failure retains prior snapshot',async()=>{
 const f=fixture({raw:JSON.stringify(empty()),validate:s=>({ok:true,snapshot:s})});const callbacks=[];f.locks.request=(n,o,fn)=>new Promise(resolve=>callbacks.push(()=>resolve(fn({}))));f.driver.load();const before=f.driver.getState().snapshot;
 const a=f.driver.save({...empty(),tag:'old'},'old');const c=f.driver.clear(empty(),{confirmed:true,acknowledged:true,operationId:'clear'});f.setWriteError(true);callbacks[1]();await c;callbacks[0]();await a;assert.deepEqual(f.driver.getState().snapshot,before);assert.equal(f.writes().length,1);
});
test('real pair and revision retry retain all record/pair/revision IDs and timestamps; capacity rejects without eviction',async()=>{
 const {createEngine}=await import('../../tools/incline-desk/engine.mjs');let n=0;const e=createEngine({idFactory:()=>`stable-${++n}`,now:()=> '2026-10-30T00:00:00.000Z'});
 e.dispatch({type:'START'});for(let i=0;i<8;i++)e.dispatch({type:'STEP',amount:5,method:'button'});e.dispatch({type:'SEAL'});e.dispatch({type:'NEXT_LONG'});for(let i=0;i<16;i++)e.dispatch({type:'STEP',amount:5,method:'button'});e.dispatch({type:'SEAL'});e.dispatch({type:'COMPARE'});for(let i=0;i<4;i++)e.dispatch({type:'ANSWER',index:i,raw:'2'});e.dispatch({type:'CHECK'});e.dispatch({type:'EXPLAIN',text:'這是我的解釋'});
 const snapshot=e.snapshot();assert.equal(snapshot.records.length,2);assert.equal(snapshot.answers.revisions.length,1);
 const f=fixture();f.driver.load();f.setWriteError(true);await f.driver.save(snapshot,'pair-and-revision');const first=f.writes()[0][2];f.setWriteError(false);await f.driver.retry();assert.equal(f.writes()[1][2],first);assert.deepEqual(JSON.parse(f.data.get(STORAGE_KEY)),snapshot);
 const many=structuredClone(snapshot);while(many.records.length<50){let i=many.records.length;many.records.push({...snapshot.records[0],recordId:`r${i}`,runId:`run${i}`});}await f.driver.save(many,'fifty');const before=f.data.get(STORAGE_KEY);many.records.push({...snapshot.records[0],recordId:'r51',runId:'run51'});assert.throws(()=>f.driver.save(many,'fifty-one'));assert.equal(f.data.get(STORAGE_KEY),before);assert.equal(JSON.parse(before).records.length,50);
});
