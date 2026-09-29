// node docs/g9-r12/count-name-check.cjs tools/math/g9-drills.html
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('__BHCS_TEST__'));
let seed=1;const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const ctx=vm.createContext({URLSearchParams,location:{search:'?topic=solid'},Math:math,console});new vm.Script(script).runInContext(ctx);
const unit=ctx.__BHCS_TEST__.CFG.units.find(u=>u.id==='count');
const expected=new Map([[4,'六角錐，頂點 7 個，面 7 個'],[6,'九角錐，頂點 10 個，面 10 個'],[8,'十二角錐，頂點 13 個，面 13 個'],[10,'十五角錐，頂點 16 個，面 16 個'],[12,'十八角錐，頂點 19 個，面 19 個']]);const seen=new Set();
for(let i=0;i<1000;i++){const q=unit.gen({level:'challenge',modes:['integer']});assert.ok(q);assert.ok(!/undefined|NaN|Infinity/.test(q.expr+q.answer));assert.equal(q.verify(),true);if(q.sig.startsWith('k4:')){const n=Number(q.sig.split(':')[1]);assert.equal(q.answer,expected.get(n));seen.add(n);}}
assert.equal(seen.size,5);console.log('PASS all five equal-edge prism/pyramid cases; 1000 raw candidates have valid answer text');
