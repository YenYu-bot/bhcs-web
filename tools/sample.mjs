// node sample.mjs g8 quadapps area challenge integer 5 [sigRegex]
import fs from 'node:fs';import vm from 'node:vm';
const [g,topic,unitId,level,mode,N=5,re]=process.argv.slice(2);
const html=fs.readFileSync(`/home/claude/bhcs-web/tools/math/${g}-drills.html`,'utf8');
const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('__BHCS_TEST__'));
let seed=Date.now()>>>0;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const c={Math:math,URLSearchParams,location:{search:'?topic='+topic},console:{warn(){},log(){}},setTimeout};c.globalThis=c;vm.createContext(c);
new vm.Script('(function(){'+script+'\n})()').runInContext(c);const api=c.__BHCS_TEST__,cfg=api.CONFIGS?.[topic]||api.CFG;
const vis=h=>String(h).replace(/<svg\b[\s\S]*?<\/svg>/gi,'[圖]').replace(/<span class="fr"><span class="n">([\s\S]*?)<\/span><span class="d">([\s\S]*?)<\/span><\/span>/g,'($1)/($2)').replace(/<sup>([\s\S]*?)<\/sup>/gi,'^$1').replace(/<sub>([\s\S]*?)<\/sub>/gi,'_$1').replace(/<br\s*\/?>/gi,' ⏎ ').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const u=cfg.units.find(u=>u.id===unitId);let k=0,t=0;const seen=new Set();
while(k<N&&t<20000){t++;const q=api.safeQuestion(u,{level,modes:[mode],mode,mixed:cfg.mixed===true},seen);if(!q)break;if(re&&!new RegExp(re).test(q.sig))continue;k++;console.log('Q:',vis(q.expr),'\n A:',vis(q.answer),q.steps?'| 解: '+vis(q.steps):'');}
