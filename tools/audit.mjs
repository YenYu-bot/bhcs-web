import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';
const root='/home/claude/yenyu-bot/bhcs-web';
const {auditCombination,seedFor}=await import(root+'/scripts/math_test_harness.mjs');
const [file,topic]=process.argv.slice(2);const link=`${file}.html?topic=${topic}`;
const url=new URL(link,'https://www.bhcs.com.tw/tools/math/');const html=fs.readFileSync(path.join(root,url.pathname),'utf8');
const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('globalThis.__BHCS_TEST__'));
let seed=seedFor(link);const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const c=vm.createContext({URLSearchParams,location:{search:url.search},Math:math,console:{warn(){},log(){}}});new vm.Script(script).runInContext(c);
const api=c.__BHCS_TEST__,cfg=api.CFG;
for(const unit of cfg.units)for(const level of ['basic','advanced','challenge'])for(const mode of cfg.modes.filter(m=>unit.modes.includes(m))){
 const key=`${url.pathname}?${url.searchParams}/${unit.id}/${level}/${mode}`;const ctx={level,modes:[mode],mixed:cfg.mixed===true};
 c.runAudit=()=>auditCombination({unit,ctx,uiMax:unit.maxCount||40,safeQuestion:api.safeQuestion,contentGuard:api.contentGuard,seed:seedFor(key),resetRandom(v){seed=v}});
 const row=vm.runInContext('runAudit()',c,{timeout:15000});if(!row.pass)console.log(unit.id,level,mode,JSON.stringify(row.issues).slice(0,400),JSON.stringify(row.raw.examples).slice(0,300));}
