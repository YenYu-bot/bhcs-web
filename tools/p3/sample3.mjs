import fs from 'node:fs';import vm from 'node:vm';
const root='/home/claude/bhcs-web/tools/math/';
const vis=h=>String(h).replace(/<svg\b[\s\S]*?<\/svg>/gi,'〔圖〕').replace(/<span class="fr"><span class="n">([\s\S]*?)<\/span><span class="d">([\s\S]*?)<\/span><\/span>/g,'$1⁄$2').replace(/<sup>([\s\S]*?)<\/sup>/gi,'^$1').replace(/<sub>([\s\S]*?)<\/sub>/gi,'_$1').replace(/<br\s*\/?>/gi,' ').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/\s+/g,' ').replace(/\|/g,'｜').trim();
function load(g,topic){const html=fs.readFileSync(root+g+'-drills.html','utf8');const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('globalThis.__BHCS_TEST__'));let s=20261107;const math=Object.create(Math);math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296};const c=vm.createContext({URLSearchParams,location:{search:'?topic='+topic},Math:math,console:{warn(){},log(){}}});new vm.Script(script).runInContext(c);return c}
let out='# 數學題庫第三階段抽樣（2026-11-07）\n\n分數以 a⁄b 表示。\n';
function block(title,g,topic,filter,levels,extra={},want=null){const c=load(g,topic),cfg=c.__BHCS_TEST__.CFG;out+=`\n## ${title}\n\n`;
 out+=`預設題組：${['basic','advanced','challenge'].map(l=>({basic:'基礎',advanced:'進階',challenge:'挑戰'})[l]+' '+cfg.units.filter(u=>filter(u)).map(u=>`${vis(u.name)}×${cfg.presets[l][u.id]||0}`).join('、')).join('；')}\n\n| 單元 | 等級 | 題目 | 答案 |\n|---|---|---|---|\n`;
 for(const u of cfg.units.filter(filter))for(const level of levels){const ms=cfg.modes.filter(m=>u.modes.includes(m)),mode=extra.mode&&ms.includes(extra.mode)?extra.mode:ms[0];c.__u=u;c.__c={level,modes:[mode],mixed:cfg.mixed===true,...extra};let q;for(let t=0;t<300;t++){q=vm.runInContext('__BHCS_TEST__.safeQuestion(__u,__c,new Set())',c);if(!want||level!=='challenge'||(q&&want.test(q.expr)))break;}out+=`| ${vis(u.name)} | ${({basic:'基礎',advanced:'進階',challenge:'挑戰'})[level]} | ${q?vis(q.expr):'（無）'} | ${q?vis(q.answer):''} |\n`;}}
const isB=u=>/補充/.test(u.name);
block('八年級・解一元二次方程式（判別式與公式解；挑戰另含根與係數・補充）','g8','quadsolve',u=>u.id==='sol',['basic','advanced','challenge'],{},/補充/);
block('八年級・因式分解（高一題型只在挑戰，題目標補充）','g8','factor',u=>['completing','splitTerms','multivariable'].includes(u.id),['basic','advanced','challenge'],{},/補充/);
block('七年級・因數與倍數（輾轉相除法）','g7','factors',isB,['challenge']);
block('七年級・一元一次不等式（絕對值不等式）','g7','inequality',isB,['challenge']);
block('函數（國二下，列在八年級）補充單元','g7','function',isB,['challenge']);
block('高二・空間直線方程（補充）','g11','line3d',isB,['challenge']);
block('高一下・相關係數、機率（補充）','g11','correlation',isB,['challenge']);
block('高一下・機率（補充）','g11','probability',isB,['challenge']);
for(const [t,name] of [['gcd','最大公因數與最小公倍數'],['circle','圓周長與圓面積'],['unknown','解未知數']]){
 const mo=t==='circle'?{mode:'fraction'}:{};block(`六年級・${name}（國小寫法，預設）`,'g6',t,u=>true,['advanced'],{prep:false,...mo});
 block(`六年級・${name}（勾選「國中先修寫法」）`,'g6',t,u=>true,['advanced'],{prep:true,...mo});}
fs.writeFileSync(process.argv[2],out);console.log('ok',out.length);
