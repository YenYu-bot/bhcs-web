import test from 'node:test';import assert from 'node:assert/strict';
import {completedStorageWrite,waitForStorageDelivery} from './storage-delivery.cjs';
const key='bhcs.inclineDesk.v1',lock='bhcs.inclineDesk.storage';
const find=audit=>completedStorageWrite({since:1,key,lock,audit});
test('previous saved label and old completed write never qualify a new action',()=>{
 const a={label:'已存到此裝置',locks:[{id:0,name:lock,status:'resolved'}],access:[{name:'setItem',key,requestId:0,completed:true,value:'old'}]};assert.equal(find(a),false);
 a.locks.push({id:1,name:lock,status:'pending'});assert.equal(find(a),false);
 a.access.push({name:'setItem',key,requestId:1,completed:true,value:'new'});assert.equal(find(a),false);
 a.locks[1].status='resolved';assert.equal(find(a).value,'new');
});
test('wrong key, failed native write, rejected lock and superseded request fail closed',()=>{
 const base=()=>({locks:[{id:1,name:lock,status:'resolved'}],access:[{name:'setItem',key,requestId:1,completed:true,value:'new'}]});
 for(const mutate of [a=>a.access[0].key='other',a=>a.access[0].completed=false,a=>a.locks[0].status='rejected',a=>a.locks.push({id:2,name:lock,status:'pending'}),a=>a.access.push({...a.access[0]})]){const a=base();mutate(a);assert.equal(find(a),false);}
});
test('delivery timeout propagates; no retry, forced write or desired-value substitution',async()=>{
 let n=0;const page={waitForFunction:async()=>{n++;throw Error('timeout');},evaluate:()=>assert.fail('not reached')};await assert.rejects(waitForStorageDelivery(page,{since:1,key,lock}),/timeout/);assert.equal(n,1);
});
