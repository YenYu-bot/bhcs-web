import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
const root='/home/claude/yenyu-bot/bhcs-web';
const {assertMathDrillCoverage}=await import(root+'/scripts/math_drill_discovery.mjs');
const {seedFor}=await import(root+'/scripts/math_test_harness.mjs');
const out=process.argv[2];const N=Number(process.argv[3]||6);
const vis=h=>String(h).replace(/<svg\b[\s\S]*?<\/svg>/gi,'[圖]').replace(/<span class="fr"><span class="n">([\s\S]*?)<\/span><span class="d">([\s\S]*?)<\/span><\/span>/g,'($1)/($2)').replace(/<sup>([\s\S]*?)<\/sup>/gi,'^$1').replace(/<sub>([\s\S]*?)<\/sub>/gi,'_$1').replace(/<br\s*\/?>/gi,' ⏎ ').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const d=assertMathDrillCoverage(root);const files={};let total=0;
for(const link of d.links){const url=new URL(link,'https://www.bhcs.com.tw/tools/math/');const html=fs.readFileSync(path.join(root,url.pathname),'utf8');
 const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('globalThis.__BHCS_TEST__'));
 let seed=seedFor(link+'review');const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const ctxv=vm.createContext({URLSearchParams,location:{search:url.search},Math:math,console:{warn(){},log(){}}});
 new vm.Script(script).runInContext(ctxv,{timeout:10000});const api=ctxv.__BHCS_TEST__,cfg=api.CFG;
 const f=path.basename(url.pathname,'.html');let txt=`\n######## ${link} — ${cfg.title}  modes=${cfg.modes}\n`;
 for(const unit of cfg.units)for(const level of ['basic','advanced','challenge'])for(const mode of cfg.modes.filter(m=>unit.modes.includes(m))){
  txt+=`\n## ${unit.id} ${unit.name} | ${level} | ${mode}${unit.tip?'\n   提示: '+vis(unit.tip):''}\n`;const seen=new Set();
  for(let i=0;i<N;i++){let q;try{ctxv.__u=unit;ctxv.__c={level,modes:[mode],mixed:cfg.mixed===true};ctxv.__s=seen;q=vm.runInContext('__BHCS_TEST__.safeQuestion(__u,__c,__s)',ctxv,{timeout:5000});}catch(e){txt+=`  !! ${e.message}\n`;continue}
   if(!q){txt+='  !! null\n';break}total++;txt+=`  Q: ${vis(q.expr)}\n     A: ${vis(q.answer)}${q.steps?'  | 解: '+vis(q.steps):''}${q.sol?'  | 解: '+vis(q.sol):''}\n`;}
 }
 (files[f]??=[]).push(txt);}
for(const [f,t] of Object.entries(files))fs.writeFileSync(path.join(out,f+'.txt'),t.join(''));
console.log('questions',total,Object.keys(files).length);
