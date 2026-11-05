import test from 'node:test';
import assert from 'node:assert/strict';
import {readStored,writeStored} from '../../tools/solubility-desk/storage.mjs';
import {INITIAL} from '../../tools/solubility-desk/model.mjs';
test('official legacy and unrelated data remain byte-identical on reset-style write',()=>{
 const key='baihong-solubility-lab-v1',sentinels=new Map(['bhcs-science-v2-solubility','bhcs-science-v2-solubility-draft','bhcs-science-v2-solubility-guide','unrelated-preferences'].map((k,i)=>[k,` { "legacy": ${i}, "keep": "原樣" } `]));
 const values=new Map(sentinels),seen=[];
 const storage={getItem:k=>(seen.push(k),values.get(k)??null),setItem:(k,v)=>(seen.push(k),values.set(k,v))};
 const read=readStored(storage,key);
 assert.equal(writeStored(storage,key,{version:1,state:{...INITIAL},step:0,mode:'guided',records:[]},read.raw).ok,true);
 for(const [k,v]of sentinels)assert.equal(values.get(k),v);
 assert.deepEqual([...new Set(seen)],[key]);
});
