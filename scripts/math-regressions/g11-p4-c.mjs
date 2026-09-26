import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {parseExpressionAt} from 'acorn';
import {load,mathText} from './helper.mjs';
import {seedFor} from '../math_test_harness.mjs';
import {topicSources,changedTopicSources} from '../math-g11-topic-changes.mjs';
const targets={permutations:['adjacent','separated'],probability:['dice','balls'],radians:['quadrant'],sector:['cone'],trigtransform:['intersections']};
const html=fs.readFileSync(new URL('../../tools/math/g11-drills.html',import.meta.url),'utf8');
const baseline=execFileSync('git',['show','7c98d30f4b95ce588d3f43804c962cd608dfcbe0:tools/math/g11-drills.html'],{encoding:'utf8'});
const before=topicSources(baseline),after=topicSources(html);
assert.deepEqual([...changedTopicSources(baseline,html)].sort(),Object.keys(targets).sort());
// Everything outside the five approved config function bodies must be byte-identical.
let restBefore=baseline,restAfter=html;for(const topic of Object.keys(targets)){restBefore=restBefore.replace(before.get(topic),'[TARGET]');restAfter=restAfter.replace(after.get(topic),'[TARGET]');}assert.equal(restAfter,restBefore,'shared helpers / UI / CSS / SVG changed');
// Parse each original unit(...) call through its matching closing parenthesis.
for(const [topic,ids]of Object.entries(targets))for(const id of ids){
 const src=before.get(topic),m=[...src.matchAll(/\bunit\("([a-z]+)"/g)].find(m=>m[1]===id);assert.ok(m);
 const node=parseExpressionAt(src,m.index,{ecmaVersion:'latest'});assert.ok(after.get(topic).includes(src.slice(node.start,node.end)),`${topic}/${id}: legacy source changed`);
}
function replayAPI(source,topic,initialSeed){
 let seed=initialSeed;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const script=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('globalThis.__BHCS_TEST__'));
 const ctx=vm.createContext({Math:math,URLSearchParams,location:{search:`?topic=${topic}`},console:{warn(){},log(){}}});new vm.Script(script).runInContext(ctx);return ctx.__BHCS_TEST__;
}
let replays=0,papers=0,questions=0,legacyPromptRepeats=0;const samples={},rows=[],gateRows=[];
const seeds=process.env.P4_C_QUICK?2:20;
for(const [topic,ids]of Object.entries(targets))for(const id of ids){
 for(const level of ['basic','advanced','challenge']){
  const old=replayAPI(baseline,topic,771),now=replayAPI(html.replace('const raw=u.gen;','const raw=u.legacyGen||u.gen;'),topic,771),u=now.CFG.units.find(u=>u.id===id),o=old.CFG.units.find(u=>u.id===id),ctx={level,modes:[...u.modes],mixed:now.CFG.mixed};
  for(let i=0;i<200;i++){const a=o.gen(ctx),b=u.gen(ctx);assert.equal(JSON.stringify(a),JSON.stringify(b),`${topic}/${id}/${level} replay ${i}`);if(a)assert.equal(a.verify(),b.verify());replays++;}
 }
 const priorStructures={};
 for(const level of ['basic','advanced','challenge']){const api=replayAPI(baseline,topic,seedFor(`g11-drills.html?topic=${topic}/${id}/${level}/diversity`)),u=api.CFG.units.find(u=>u.id===id),set=new Set();for(let i=0;i<200;i++){const q=api.safeQuestion(u,{level,modes:[...u.modes],mixed:api.CFG.mixed},new Set());assert.ok(q);set.add(mathText(q.expr).normalize('NFKC').replace(/\d+(?:\.\d+)?/g,'#'));}priorStructures[level]=set.size;}
 const structures={};
 for(const level of ['basic','advanced','challenge']){
  const api=load('g11',topic,seedFor(`g11-drills.html?topic=${topic}/${id}/${level}/diversity`)),u=api.CFG.units.find(u=>u.id===id),set=structures[level]=new Set();
  for(let i=0;i<200;i++){const q=api.safeQuestion(u,{level,modes:[...u.modes],mixed:api.CFG.mixed},new Set());assert.ok(q);set.add(mathText(q.expr).normalize('NFKC').replace(/\d+(?:\.\d+)?/g,'#'));}
  assert.ok(set.size>=3,`${topic}/${id}/${level}: full structure gate ${set.size}`);
 }
 const challengeNew=[...structures.challenge].filter(s=>!structures.basic.has(s));assert.ok(challengeNew.length,`${topic}/${id}: missing challenge-exclusive structure`);
 gateRows.push({topic,unit:id,before:priorStructures,structures:Object.fromEntries(Object.entries(structures).map(([k,v])=>[k,v.size])),challengeNew:challengeNew.length});
 for(const level of ['basic','advanced','challenge'])for(const mode of load('g11',topic).CFG.units.find(u=>u.id===id).modes){
  for(const size of [40,80])for(let seed=1;seed<=seeds;seed++){
   const api=load('g11',topic,20260926+seed),u=api.CFG.units.find(u=>u.id===id),seen=new Set(),prompts=new Map(),ctx={level,modes:[mode],mixed:api.CFG.mixed};
   const observed={...u,gen(c){const q=u.gen(c);if(q)assert.equal(q.verify(),true,`${topic}/${id} raw verify: ${q.sig}`);return q;}};
   for(let i=0;i<size;i++){
    const q=api.safeQuestion(observed,ctx,seen);assert.ok(q,`${topic}/${id}/${level}/${mode} seed ${seed}: ${i}/${size}`);assert.equal(api.contentGuard(q,level),true);
    const isNew=q.sig.startsWith('p4c:'),text=mathText(q.expr),answer=mathText(q.answer),prompt=text.replace(/\s/g,'').normalize('NFKC');
    if(isNew){
     assert.ok(!/<svg|style=/.test(q.expr+q.answer),'new presentation markup');
     assert.ok(!/[＋−]0(?!\d)|<sup>1<\/sup>|(?:^|[^\d])1(?:sin|cos|π|x)/.test(q.expr+q.answer),`new format: ${text}`);
    }
    if(prompts.has(prompt)){assert.ok(!isNew&&!prompts.get(prompt),`new duplicate visible prompt: ${topic}/${id} ${prompt}`);legacyPromptRepeats++;}prompts.set(prompt,isNew);questions++;
    if(isNew){const kind=`${topic}/`+q.sig.split(':').slice(1,3).join('/');samples[kind]??={topic,unit:id,level,mode,prompt:text,answer,promptHtml:q.expr,answerHtml:q.answer};}
   }
   papers++;
  }
  rows.push({topic,unit:id,level,mode,formal:`40/40 × ${seeds} seeds`,stress:`80/80 × ${seeds} seeds`});
 }
 console.log(JSON.stringify({unit:`${topic}/${id}`,gate:gateRows.at(-1),passed:true}));
}
assert.equal(Object.keys(samples).length,19,'all new kinds must have accepted samples');

let unchangedUnits=0;
for(const [topic,src]of before){
 const old=replayAPI(baseline,topic,5813),now=replayAPI(html,topic,5813);
 for(const o of old.CFG.units){if(targets[topic]?.includes(o.id))continue;
  const u=now.CFG.units.find(x=>x.id===o.id);assert.ok(u);
  for(const level of ['basic','advanced','challenge'])for(let i=0;i<30;i++){
   const ctx={level,modes:[...u.modes],mixed:now.CFG.mixed},a=o.gen(ctx),b=u.gen(ctx);
   assert.equal(JSON.stringify(a),JSON.stringify(b),`unchanged ${topic}/${o.id}/${level}`);if(a)assert.equal(a.verify(),b.verify());
  }unchangedUnits++;
 }
}
const result={passed:true,unchangedUnits,replays,papers,questions,legacyPromptRepeats,rows,gateRows,samples};
if(process.env.P4_C_REPORT)fs.writeFileSync(process.env.P4_C_REPORT,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({test:'g11-p4-c',passed:true,unchangedUnits,replays,papers,questions,legacyPromptRepeats,newKinds:Object.keys(samples).length}));
