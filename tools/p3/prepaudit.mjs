import fs from 'node:fs';import vm from 'node:vm';
const html=fs.readFileSync('/home/claude/bhcs-web/tools/math/g6-drills.html','utf8');const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('__BHCS_TEST__'));
for(const t of ['gcd','unknown','circle','volume']){let seed=11;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const c={Math:math,URLSearchParams,location:{search:'?topic='+t},console:{warn(){},log(){}}};vm.createContext(c);new vm.Script(script).runInContext(c);const api=c.__BHCS_TEST__,cfg=api.CFG;
 if(!cfg.prep)console.log('NO PREP FLAG',t);
 for(const u of cfg.units)for(const level of['basic','advanced','challenge'])for(const m of cfg.modes.filter(x=>u.modes.includes(x))){const seen=new Set;let ok=0,piNo=0;for(let i=0;i<40;i++){const q=api.safeQuestion(u,{level,modes:[m],mixed:cfg.mixed===true,prep:true},seen);if(q){ok++}}
  if(ok<40)console.log('SHORT',t,u.id,level,m,ok)}}
console.log('prep audit done');
