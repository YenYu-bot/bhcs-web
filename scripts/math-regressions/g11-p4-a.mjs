import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {load,mathText} from './helper.mjs';
import {seedFor} from '../math_test_harness.mjs';
import {topicSources,changedTopicSources} from '../math-g11-topic-changes.mjs';
const targets={expequations:['quadratic','application'],anglesum:['known','triangle'],vectorcauchy:['projection']};
const html=fs.readFileSync(new URL('../../tools/math/g11-drills.html',import.meta.url),'utf8');
const baseline=execFileSync('git',['show','a0bd8a91d7f38ce3e940fd02480c8fabba725930:tools/math/g11-drills.html'],{encoding:'utf8'});
// Later batches may change other topics; keep the P4-A scope assertions local.
for(const topic of Object.keys(targets))assert.ok(changedTopicSources(baseline,html).has(topic));
const before=topicSources(baseline),after=topicSources(html);
// Compare original source declarations byte-for-byte, including prompt, sig and verify.
for(const [topic,ids]of Object.entries(targets))for(const id of ids){
 const original=before.get(topic).split('\n').find(line=>line.startsWith(` const ${id}=unit(`));
 assert.ok(original);assert.ok(after.get(topic).includes(original),`${topic}/${id}: original branch changed`);
}
function oldAPI(topic,initialSeed){
 let seed=initialSeed;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const source=[...baseline.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('globalThis.__BHCS_TEST__'));
 const ctx=vm.createContext({Math:math,URLSearchParams,location:{search:`?topic=${topic}`},console:{warn(){},log(){}}});new vm.Script(source).runInContext(ctx);return ctx.__BHCS_TEST__;
}
let replays=0,papers=0,questions=0;const samples={},rows=[];
for(const [topic,ids]of Object.entries(targets))for(const id of ids){
 // Outer mode-selection draw is retained when replaying the legacy raw branch.
 for(const level of ['basic','advanced','challenge']){
  const old=oldAPI(topic,771),now=load('g11',topic,771),u=now.CFG.units.find(u=>u.id===id),o=old.CFG.units.find(u=>u.id===id);
  // Rebuild the pre-policy wrapper with its exact original outer mode-selection draw.
  const replayHtml=html.replace('const raw=u.gen;','const raw=u.legacyGen||u.gen;');
  let seed=771;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const context=vm.createContext({Math:math,URLSearchParams,location:{search:`?topic=${topic}`},console:{warn(){},log(){}}});
  new vm.Script([...replayHtml.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('globalThis.__BHCS_TEST__'))).runInContext(context);
  const replay=context.__BHCS_TEST__.CFG.units.find(u=>u.id===id),ctx={level,modes:[...u.modes],mixed:true};
  for(let i=0;i<200;i++){const a=o.gen(ctx),b=replay.gen(ctx);assert.equal(JSON.stringify(a),JSON.stringify(b),`${topic}/${id}/${level} replay ${i}`);if(a)assert.equal(a.verify(),b.verify());replays++;}
 }
 const structures={};
 for(const level of ['basic','advanced','challenge']){
  const api=load('g11',topic,seedFor(`g11-drills.html?topic=${topic}/${id}/${level}/diversity`)),u=api.CFG.units.find(u=>u.id===id),set=structures[level]=new Set();
  for(let i=0;i<200;i++){const q=api.safeQuestion(u,{level,modes:[...u.modes],mixed:api.CFG.mixed},new Set());assert.ok(q);set.add(mathText(q.expr).normalize('NFKC').replace(/\d+(?:\.\d+)?/g,'#'));}
  assert.ok(set.size>=3,`${topic}/${id}/${level}: full structure gate`);
 }
 assert.ok([...structures.challenge].some(s=>!structures.basic.has(s)),`${topic}/${id}: challenge must introduce a new structure`);
 for(const level of ['basic','advanced','challenge'])for(const mode of load('g11',topic).CFG.units.find(u=>u.id===id).modes){
  for(const size of [40,80])for(let seed=1;seed<=20;seed++){
   const api=load('g11',topic,20260926+seed),u=api.CFG.units.find(u=>u.id===id),seen=new Set(),prompts=new Set(),ctx={level,modes:[mode],mixed:true};
   const observed={...u,gen(c){const q=u.gen(c);if(q)assert.equal(q.verify(),true,`${topic}/${id} raw verify: ${q.sig}`);return q;}};
   for(let i=0;i<size;i++){
    const q=api.safeQuestion(observed,ctx,seen);assert.ok(q,`${topic}/${id}/${level}/${mode} seed ${seed}: ${i}/${size}`);assert.equal(api.contentGuard(q,level),true);
    const prompt=mathText(q.expr).replace(/\s/g,'').normalize('NFKC');assert.ok(!prompts.has(prompt),`duplicate visible prompt: ${topic}/${id} ${prompt}`);prompts.add(prompt);questions++;
    if(q.sig.startsWith('p4')){const kind=q.sig.split(':').slice(0,2).join(':');samples[kind]??={topic,unit:id,level,mode,prompt:mathText(q.expr),answer:mathText(q.answer)};}
   }
   papers++;
  }
  rows.push({topic,unit:id,level,mode,formal:'40/40 × 20 seeds',stress:'80/80 × 20 seeds'});
 }
}
assert.equal(Object.keys(samples).length,17,'all new kinds must have accepted samples');
const result={passed:true,replays,papers,questions,rows,samples};
if(process.env.P4_A_REPORT)fs.writeFileSync(process.env.P4_A_REPORT,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({test:'g11-p4-a',passed:true,replays,papers,questions,newKinds:Object.keys(samples).length}));
