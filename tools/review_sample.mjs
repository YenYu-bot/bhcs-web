import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
const root='/home/claude/bhcs-web';const {assertMathDrillCoverage}=await import(root+'/scripts/math_drill_discovery.mjs');
const vis=h=>String(h).replace(/<svg\b[\s\S]*?<\/svg>/gi,'〔圖〕').replace(/<span class="fr"><span class="n">([\s\S]*?)<\/span><span class="d">([\s\S]*?)<\/span><\/span>/g,'$1⁄$2').replace(/<sup>([\s\S]*?)<\/sup>/gi,'^$1').replace(/<sub>([\s\S]*?)<\/sub>/gi,'_$1').replace(/<br\s*\/?>/gi,' ').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/\s+/g,' ').replace(/\|/g,'｜').trim();
const per=Number(process.argv[2]||4);let out='# 數學題庫第二階段抽樣（2026-11-07）\n\n每頁隨機抽幾個單元，同一單元各列基礎／進階／挑戰各一題，方便比對難度階梯。分數以 a⁄b 表示，〔圖〕為附圖題。\n';
let seed=20261107;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const byFile={};for(const link of assertMathDrillCoverage(root).links){const f=link.split('.html')[0];(byFile[f]??=[]).push(link)}
const names={g2:'二年級',g3:'三年級',g4:'四年級',g6:'六年級',g7:'七年級',g8:'八年級',g9:'九年級',g10:'高一',g11:'高二頁'};
for(const [f,links] of Object.entries(byFile)){const g=f.replace('-drills','');out+=`\n## ${names[g]||g}（${f}.html）\n`;
 const picks=[...links].sort(()=>rnd()-.5).slice(0,per);
 for(const link of picks){const url=new URL(link,'https://www.bhcs.com.tw/tools/math/');const html=fs.readFileSync(path.join(root,url.pathname),'utf8');
  const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('globalThis.__BHCS_TEST__'));
  let s2=Math.floor(rnd()*1e9);const math=Object.create(Math);math.random=()=>{s2=(Math.imul(s2,1664525)+1013904223)>>>0;return s2/4294967296};
  const c=vm.createContext({URLSearchParams,location:{search:url.search},Math:math,console:{warn(){},log(){}}});new vm.Script(script).runInContext(c);const cfg=c.__BHCS_TEST__.CFG;
  const unit=cfg.units[Math.floor(rnd()*cfg.units.length)];const modes=cfg.modes.filter(m=>unit.modes.includes(m));const mode=modes[Math.floor(rnd()*modes.length)];
  out+=`\n**${cfg.title}／${vis(unit.name)}**（${{integer:'整數',fraction:'分數',decimal:'小數'}[mode]||mode}）\n\n| 等級 | 題目 | 答案 |\n|---|---|---|\n`;
  for(const level of ['basic','advanced','challenge']){c.__u=unit;c.__c={level,modes:[mode],mixed:cfg.mixed===true};const q=vm.runInContext('__BHCS_TEST__.safeQuestion(__u,__c,new Set())',c);
   out+=`| ${{basic:'基礎',advanced:'進階',challenge:'挑戰'}[level]} | ${q?vis(q.expr):'（無）'} | ${q?vis(q.answer):''} |\n`;}}}
fs.writeFileSync(process.argv[3],out);console.log('ok');
