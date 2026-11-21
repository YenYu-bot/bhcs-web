import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../tools/math/g3-drills.html',import.meta.url),'utf8');
const engine=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('globalThis.__BHCS_TEST__'))[1];
const context=vm.createContext({URLSearchParams,location:{search:'?topic=timestables'},console});
vm.runInContext(engine,context);
const bankApi=context.__BHCS_TEST__,{CFG,speedLimit}=bankApi;
const from=bankApi.CFG.units.find(u=>u.id==='twodigit');
const all=[2,3,4,5,6,7,8,9];
let checks=0;
for(let bits=0;bits<256;bits++)for(const level of ['basic','advanced','challenge']){
 const tables=all.filter((v,i)=>bits&(1<<i));
 let ts=tables.length?tables:all;
 if(level==='basic'&&ts.some(x=>x<=5))ts=ts.filter(x=>x<=5);
 const expected=new Set();
 for(const b of ts)for(let a=10;a<=99;a++){
  const p=[...String(a)].map(d=>Number(d)*b);
  const variant=(p[0]<10&&p[1]<10)?'basic':(p[0]<10&&p[1]>=10)?'advanced':(p[0]>=10&&p[1]>=10)?'challenge':'skip';
  if(variant===level)expected.add(a+' × '+b+'＝');
 }
 const ctx={level,tables,modes:['integer']};
 assert.deepEqual([...from.speedBank(ctx).map(q=>q.expr)].sort(),[...expected].sort());
 assert.equal(from.speedBankSize(ctx),expected.size);
 assert.equal(speedLimit(from,ctx),Math.min(expected.size*2,60));
 checks++;
}
// In cross-realm tests create the Map inside the engine's own realm.
const generated=vm.runInContext(`(()=>{const a=__BHCS_TEST__,u=a.CFG.units.find(u=>u.id==='twodigit');
  const ctx={level:'basic',tables:[9],modes:['integer']};
  return a.fillSpeedQuestions(u,ctx,new Map(),a.speedLimit(u,ctx)).map(q=>[q.expr,q.answer]);})()`,context);
assert.equal(generated.length,4);
assert.equal(JSON.stringify([...generated].sort()),JSON.stringify([['10 × 9＝','90'],['10 × 9＝','90'],['11 × 9＝','99'],['11 × 9＝','99']]));
console.log('PASS',checks,'two-digit difficulty/multiplier subsets and exact 9-only speed bank');
