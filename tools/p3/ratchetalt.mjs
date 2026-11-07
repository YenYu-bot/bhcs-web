// node p3/ratchet.mjs <file-prefix> [topic] -> compare per-unit per-level structureCount/produced with docs baseline (CI seeds)
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
const root='/home/claude/bhcs-web';
const {assertMathDrillCoverage}=await import(root+'/scripts/math_drill_discovery.mjs');const {seedFor}=await import(root+'/scripts/math_test_harness.mjs');
const src=fs.readFileSync(root+'/scripts/test_math_drills.mjs','utf8').split('\n').slice(29,37).join('\n');
const {structureOf}=new Function(src+';return {visibleMath,structureOf}')();
const B=JSON.parse(fs.readFileSync(root+'/docs/math-diversity/baseline-20260922.json','utf8'));const bm=new Map(B.units.map(u=>[u.link+'|'+u.unit,u]));
const only=process.argv[2],tp=process.argv[3];
for(const link of assertMathDrillCoverage(root).links){if(!link.startsWith(only))continue;const url=new URL(link,'https://www.bhcs.com.tw/tools/math/');if(tp&&url.searchParams.get('topic')!==tp)continue;const html=fs.readFileSync(process.env.ALT||path.join(root,url.pathname),'utf8');
 const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('globalThis.__BHCS_TEST__'));
 let seed=1;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const c=vm.createContext({URLSearchParams,location:{search:url.search},Math:math,console:{warn(){},log(){}}});new vm.Script(script).runInContext(c);const api=c.__BHCS_TEST__,cfg=api.CFG;
 for(const unit of cfg.units){const b=bm.get(link+'|'+unit.id);const out=[];let bad=false;
  for(const level of ['basic','advanced','challenge']){const ctx={level,modes:cfg.modes.filter(m=>unit.modes.includes(m)),mixed:cfg.mixed===true};const S=new Set();let p=0;seed=seedFor(`${link}/${unit.id}/${level}/diversity`);
   c.__u=unit;c.__c=ctx;for(let i=0;i<200;i++){const q=vm.runInContext('__BHCS_TEST__.safeQuestion(__u,__c,new Set())',c);if(q){p++;S.add(structureOf(q.expr))}}
   const bl=b?.levels[level];if(bl&&(S.size<bl.structureCount||p<bl.produced))bad=true;out.push(`${level[0]}:${S.size}/${bl?bl.structureCount:'-'} p${p}/${bl?bl.produced:'-'}`)}
  console.log((bad?'REGRESS ':'ok ')+url.searchParams.get('topic')+'/'+unit.id+(b?'':' (new)'),out.join(' '))}}
