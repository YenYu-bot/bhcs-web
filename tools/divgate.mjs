// node divgate.mjs [fileFilter] -> units whose any level has <3 structures (CI structure gate), same seeds as CI
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
const root='/home/claude/bhcs-web';
const {assertMathDrillCoverage}=await import(root+'/scripts/math_drill_discovery.mjs');const {seedFor}=await import(root+'/scripts/math_test_harness.mjs');
const src=fs.readFileSync(root+'/scripts/test_math_drills.mjs','utf8').split('\n').slice(29,37).join('\n');
const {visibleMath,structureOf}=new Function(src+';return {visibleMath,structureOf}')();
const only=process.argv[2];const showAll=process.argv[3]==='all';
for(const link of assertMathDrillCoverage(root).links){if(only&&!link.startsWith(only))continue;const url=new URL(link,'https://www.bhcs.com.tw/tools/math/');const html=fs.readFileSync(path.join(root,url.pathname),'utf8');
 const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('globalThis.__BHCS_TEST__'));
 let seed=1;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const c=vm.createContext({URLSearchParams,location:{search:url.search},Math:math,console:{warn(){},log(){}}});new vm.Script(script).runInContext(c);const api=c.__BHCS_TEST__,cfg=api.CFG;
 for(const unit of cfg.units){const out={};let bad=false;const sets={};
  for(const level of ['basic','advanced','challenge']){const ctx={level,modes:cfg.modes.filter(m=>unit.modes.includes(m)),mixed:cfg.mixed===true};const S=new Set();seed=seedFor(`${link}/${unit.id}/${level}/diversity`);
   c.__u=unit;c.__c=ctx;for(let i=0;i<200;i++){const q=vm.runInContext('__BHCS_TEST__.safeQuestion(__u,__c,new Set())',c);if(q)S.add(structureOf(q.expr))}out[level]=S.size;sets[level]=S;if(S.size<3)bad=true}
  const chNew=[...sets.challenge].filter(s=>!sets.basic.has(s)).length;
  if(bad||showAll)console.log(link.split('?')[0],url.searchParams.get('topic')+'/'+unit.id,JSON.stringify(out),'chNew='+chNew)}}
