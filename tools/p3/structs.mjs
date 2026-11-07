// node p3/structs.mjs g6 circle circumference basic  -> CI-seeded structures
import fs from 'node:fs';import vm from 'node:vm';const root='/home/claude/bhcs-web';
const {seedFor}=await import(root+'/scripts/math_test_harness.mjs');
const src=fs.readFileSync(root+'/scripts/test_math_drills.mjs','utf8').split('\n').slice(29,37).join('\n');const {structureOf}=new Function(src+';return {visibleMath,structureOf}')();
const [g,topic,uid,level]=process.argv.slice(2);const link=`${g}-drills.html?topic=${topic}`;
const html=fs.readFileSync(`${root}/tools/math/${g}-drills.html`,'utf8');const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('globalThis.__BHCS_TEST__'));
let seed=1;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const c=vm.createContext({URLSearchParams,location:{search:'?topic='+topic},Math:math,console:{warn(){},log(){}}});new vm.Script(script).runInContext(c);const api=c.__BHCS_TEST__,cfg=api.CFG;const u=cfg.units.find(x=>x.id===uid);
seed=seedFor(`${link}/${uid}/${level}/diversity`);const ctx={level,modes:cfg.modes.filter(m=>u.modes.includes(m)),mixed:cfg.mixed===true};const M=new Map();
for(let i=0;i<200;i++){const q=api.safeQuestion(u,ctx,new Set());if(q){const s=structureOf(q.expr);M.set(s,(M.get(s)||0)+1)}}
for(const [s,n] of M)console.log(n,s);
