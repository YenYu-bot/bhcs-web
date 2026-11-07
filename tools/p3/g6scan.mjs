// node p3/g6scan.mjs [prep] -> per topic/unit counts of 國中-form markers in expr/answer
import fs from 'node:fs';import vm from 'node:vm';
const html=fs.readFileSync('/home/claude/bhcs-web/tools/math/g6-drills.html','utf8');const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('__BHCS_TEST__'));
const prep=process.argv[2]==='prep';const topics=[...script.matchAll(/(\w+):(\w+)Config/g)].map(m=>m[1]).filter((v,i,a)=>a.indexOf(v)===i);
const pats={pi:/π/,sup:/<sup>(?!2<\/sup>\s*$)\d+<\/sup>/,coef:/\d\s*[xX□](?![\w])/,notation:/[\(（]\s*\d+\s*[，,]\s*\d+|\[\s*\d+\s*[，,]|［/};
const strip=h=>String(h).replace(/<svg[\s\S]*?<\/svg>/g,'');
for(const t of topics){let seed=7;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const c={Math:math,URLSearchParams,location:{search:'?topic='+t},console:{warn(){},log(){}}};vm.createContext(c);new vm.Script(script).runInContext(c);const api=c.__BHCS_TEST__,cfg=api.CFG;
 for(const u of cfg.units)for(const level of['basic','advanced','challenge'])for(const m of cfg.modes.filter(x=>u.modes.includes(x))){const hit={};const ex={};
  for(let i=0;i<60;i++){const q=api.safeQuestion(u,{level,modes:[m],mixed:cfg.mixed===true,prep},new Set());if(!q)continue;const s=strip(q.expr)+' ‖ '+strip(q.answer);for(const[k,p]of Object.entries(pats))if(p.test(s)){hit[k]=(hit[k]||0)+1;ex[k]=ex[k]||s.replace(/<[^>]+>/g,'').slice(0,140)}}
  if(Object.keys(hit).length)console.log(t,u.id,level,m,JSON.stringify(hit),Object.values(ex)[0])}}
