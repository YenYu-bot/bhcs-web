// usage: node pool.mjs <grade e.g. g11> <topic> <unit> [N=20000]  -> distinct sigs per level/mode
import fs from 'node:fs';import vm from 'node:vm';
const [g,topic,unitId,N=20000]=process.argv.slice(2);
const html=fs.readFileSync(`/home/claude/bhcs-web/tools/math/${g}-drills.html`,'utf8');
const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('__BHCS_TEST__'));
let seed=12345;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const c={Math:math,URLSearchParams,location:{search:'?topic='+topic},console:{warn(){},log(){}},setTimeout};c.globalThis=c;vm.createContext(c);
new vm.Script('(function(){'+script+'\n})()').runInContext(c);const api=c.__BHCS_TEST__,cfg=api.CONFIGS?.[topic]||api.CFG;
for(const u of cfg.units){if(unitId&&unitId!=='all'&&u.id!==unitId)continue;
 for(const level of ['basic','advanced','challenge'])for(const mode of cfg.modes.filter(m=>u.modes.includes(m))){const s=new Map();let nul=0;
  for(let i=0;i<N;i++){let q;try{q=u.gen({level,modes:[mode],mode,mixed:cfg.mixed===true})}catch(e){nul++;continue}if(!q){nul++;continue}if(api.contentGuard&&!api.contentGuard(q,level))continue;const k=q.sig.split(':').slice(0,2).join(':');s.set(q.sig,k)}
  const kinds={};for(const k of s.values())kinds[k]=(kinds[k]||0)+1;
  console.log(`${u.id}/${level}/${mode} distinct=${s.size} null=${nul} ${JSON.stringify(kinds)}`)}}
