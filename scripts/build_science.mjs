import {buildMarbleDirectory} from './build_marble_replacement.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import crypto from 'node:crypto';
import {legacy,guidedPublic,standalonePublic,primaryLabDesks,mirrorLabDesk,motionLabDesk,firstBatch,firstMisconceptions} from './science/catalog.mjs';
import {enhanceLessons} from './science/experience.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const researcherCssVersion='20260930-legacy-guide-1';
const researcherJsVersion=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/researcher-lab.js'))).digest('hex').slice(0,12);
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,s)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),s)};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const style=read('scripts/science/style.css');
const all=[...legacy.flatMap(t=>t.file==='circuit-lab.html'?[t,...guidedPublic]:[t]),...standalonePublic.map(t=>t.file===motionLabDesk.previousFile?motionLabDesk:t),...primaryLabDesks.flatMap(t=>t.id==='optics'?[mirrorLabDesk,t]:[t])];
const meta=(title,description,url)=>`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}｜百宏文教</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}｜百宏文教"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://www.bhcs.com.tw/assets/og-science.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="百宏文教小小研究員虛擬實驗室：顯微鏡、電路、透鏡與地球儀"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="../../assets/favicon.png"><style>${style}</style>`;
const header=`<a href="#main" class="skip">跳到主要內容</a><header class="topbar"><div class="shell"><a href="../../index.html">百宏文教 BHCS</a><nav aria-label="主選單"><a href="./">自然實驗總覽</a> · <a href="../../ziyuan.html">全部學習資源</a></nav></div></header>`;
const footer=`<footer class="foot"><div class="shell"><p>百宏文教｜免費使用・不需登入</p><a href="../../guozhong-lihua.html" data-science-event="course">國中自然課程</a> · <a href="../../lianluo.html" data-science-event="consult">免費程度確認</a><p>操作紀錄只在本機儲存；匿名使用事件不含研究筆記、作答內容或學生姓名。</p></div></footer><script src="../../assets/science-events.js" defer></script>`;
function replaceBlock(p,key,html,before){let s=read(p);const re=new RegExp(`<!-- ${key}:start -->[\\s\\S]*?<!-- ${key}:end -->`);const block=`<!-- ${key}:start -->\n${html}\n<!-- ${key}:end -->`;if(re.test(s))s=s.replace(re,block);else {if(!s.includes(before))throw Error('Anchor missing: '+p);s=s.replace(before,block+'\n'+before)}write(p,s)}
const oldVersion=(t,prefix,noteId='')=>t.previousFile?`<p class="subtle"${noteId?` id="${noteId}"`: ''}><a href="${prefix}${esc(t.previousFile)}">${esc(t.previousLabel)}</a>${t.additionalPreviousFile?` ・ <a href="${prefix}${esc(t.additionalPreviousFile)}">${esc(t.additionalPreviousLabel)}</a>`:''}；各版紀錄分開保存。</p>`:'';
function card(t,prefix){return `<article class="resource" data-subject="${esc(t.subject)}" data-grade="${esc(t.grade)}" data-unit="${esc(t.unit)}"><div class="tags"><span class="tag">${esc(t.subject)}</span><span class="tag">${esc(t.grade)}</span><span class="tag">${esc(t.kind)}</span></div><h2>${esc(t.title)}</h2><p>${esc(t.description)}</p><p class="subtle">${esc(t.unit)} · 建議 ${esc(t.minutes)} 分鐘</p><a class="open" href="${prefix}${t.file}" data-science-event="tool_open" data-lab="${esc(t.file.replaceAll('/','-').replace('.html',''))}">開啟${esc(t.title)} →</a>${oldVersion(t,prefix)}</article>`}
const cards=all.map(t=>card(t,'../')).join('\n');
const directoryScript=`const controls=[...document.querySelectorAll('.filters input,.filters select')];function filter(){const q=document.getElementById('search').value.trim().toLowerCase(),s=document.getElementById('subject').value,g=document.getElementById('grade').value;let n=0;document.querySelectorAll('.resource').forEach(c=>{c.hidden=!!((s&&s!==c.dataset.subject)||(g&&g!==c.dataset.grade)||(q&&!c.textContent.toLowerCase().includes(q)));if(!c.hidden)n++});document.getElementById('count').textContent='顯示 '+n+' 項';document.getElementById('empty').hidden=n!==0}controls.forEach(c=>c.addEventListener('input',filter));document.getElementById('clearFilters').addEventListener('click',()=>{controls.forEach(c=>c.value='');filter()});const params=new URLSearchParams(location.search);['subject','grade'].forEach(k=>{const el=document.getElementById(k);if([...el.options].some(o=>o.value===params.get(k)))el.value=params.get(k)});filter();`;
write('tools/science/index.html',`<!doctype html><html lang="zh-Hant"><head>${meta('小小研究員虛擬實驗室','依科目與年段進入自然科學研究站，從任務、操作、觀察到研究手冊與挑戰題。','https://www.bhcs.com.tw/tools/science/')}<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'CollectionPage',name:'自然實驗與演示總覽',url:'https://www.bhcs.com.tw/tools/science/',hasPart:all.map(t=>({'@type':'LearningResource',name:t.title,url:'https://www.bhcs.com.tw/tools/'+t.file,learningResourceType:t.kind}))})}</script><link rel="stylesheet" href="../../assets/researcher-lab.css?v=${researcherCssVersion}"></head><body data-science-lab="science-directory">${header}<section class="hero"><div class="shell"><span class="eyebrow">SCIENCE / 百宏自然探究</span><h1>把「為什麼」，<br>變成可以操作的問題。</h1><p>先接任務，再調整一個變因。用研究手冊留下觀察證據；模型不是實物，記得一起讀它的限制。</p><div class="tags"><span class="tag">${all.length} 項教材</span><span class="tag">免登入</span><span class="tag">教師與家長皆可使用</span></div></div></section><main id="main" class="shell"><section class="panel" aria-label="教材篩選"><div class="filters"><div><label for="subject">科目</label><select id="subject"><option value="">全部科目</option><option>國小自然</option><option>生物</option><option>理化</option><option>地科</option></select></div><div><label for="grade">年段</label><select id="grade"><option value="">全部年段</option><option>國小中高年級</option><option>國中</option></select></div><div><label for="search">搜尋單元或教材</label><input id="search" type="search" placeholder="例如：透鏡、地震、遺傳"></div></div><div class="actions"><button id="clearFilters" type="button">清除篩選</button><p id="count" class="filter-count" role="status" aria-live="polite">${all.length} 項</p></div></section><div class="catalog">${cards}</div><p id="empty" class="empty" hidden>沒有符合的教材，請更換關鍵字或清除篩選。</p><noscript><p>未開啟 JavaScript：仍可瀏覽下方全部教材；篩選功能需啟用 JavaScript。</p></noscript></main>${footer}<script>${directoryScript}</script><script src="../../assets/researcher-lab.js?v=${researcherJsVersion}" defer></script></body></html>`);
// Resource page: preserve every existing pill URL and all non-science sections.
replaceBlock('ziyuan.html','science-entry',`<div style="padding:20px 22px;border:1px solid #C9D2DE;border-left:3px solid #C8352B;border-radius:4px;background:#fff;margin:20px 0"><h3>自然實驗，依科目找</h3><p>不確定先做哪個？到總覽依年段、科目或單元篩選，每張卡片都有操作重點與建議時間。</p><div class="tpills"><a href="tools/science/">全部 ${all.length} 項自然教材</a><a href="tools/science/?subject=國小自然">國小自然</a><a href="tools/science/?subject=生物">國中生物</a><a href="tools/science/?subject=理化">國中理化</a><a href="tools/science/?subject=地科">國中地科</a></div></div>`,`      <section class="res-sec" id="res-math">`);
for(const p of ['guoxiao.html','guozhong.html','guozhong-lihua.html']) replaceBlock(p,'science-course',`<section><div class="wrap-narrow prose"><h2>先用一個實驗，找出卡住的觀念</h2><p>選擇一個單元，動手改一個條件、看數據怎麼變，再用兩筆觀察紀錄說明結果。${p==='guoxiao.html'?'<a href="tools/mini-lab/">國小生活科學</a>適合由家長或老師陪同。':'可從<a href="tools/circuit-lab.html">電路</a>、<a href="tools/microscope-lab.html">顯微鏡</a>或<a href="tools/plate-earthquake-lab.html">板塊地震</a>開始。'}</p><p><a href="tools/science/">依科目挑選自然互動教材 →</a>　<a href="lianluo.html">需要老師協助？預約程度確認</a></p></div></section>`,`</main>`);
const researcherLegacyFiles=new Set(["microscope-lab.html","genetics-simulation-lab.html","force-motion-lab.html","circuit-lab.html","particle-reaction-lab.html","plate-earthquake-lab.html","heat-phase-lab.html","buoyancy-density-lab.html","acid-base-indicator-lab.html","photosynthesis-factor-lab.html"]);
for (const file of firstBatch){const t=legacy.find(t=>t.file===file),predictionFree=researcherLegacyFiles.has(file);replaceBlock('tools/'+file,'science-teaching',`<section class="card section lesson-meta" aria-label="教材使用指南"><h2>怎麼用這份教材</h2><p><strong>適用：</strong>${t.grade} · ${t.unit}（各校版本進度可能不同）　<strong>建議：</strong>${t.minutes} 分鐘</p><p><strong>先備：</strong>${t.prior}。<strong>學習目標：</strong>能透過操作說明${t.goals}。</p><p><strong>教師引導：</strong>${predictionFree?'先讓學生直接操作並留下第一筆觀察。接著只改一個條件、加入第二筆紀錄，再請學生引用數據解釋差異。':'先保留預測，不提示答案。第一筆完成後只改一個條件、加入第二筆紀錄，再請學生引用數據解釋差異。'}</p><p><strong>常見迷思：</strong>${esc(firstMisconceptions[file])} 模型的理想條件請對照本頁教師提示。</p><p><a href="science/">自然實驗總覽</a> · <a href="../guozhong-lihua.html" data-science-event="course">相關課程</a> · <a href="../lianluo.html" data-science-event="consult">程度確認</a></p></section>`,`</main>`);replaceBlock('tools/'+file,'science-events',`<script src="../assets/science-events.js" defer></script>`,`</body>`)}
for(const file of firstBatch){if(!researcherLegacyFiles.has(file))continue;let page=read('tools/'+file);if(page.includes('researcher-lab.css'))page=page.replace(/href="\.\.\/assets\/researcher-lab\.css(?:\?v=[^"]+)?"/,`href="../assets/researcher-lab.css?v=${researcherCssVersion}"`);else page=page.replace('</head>',`<link rel="stylesheet" href="../assets/researcher-lab.css?v=${researcherCssVersion}">\n</head>`);if(!page.includes('researcher-lab.js'))page=page.replace('</body>',`<script src="../assets/researcher-lab.js" defer></script>\n</body>`);page=page.replace(/src="\.\.\/assets\/researcher-lab\.js(?:\?v=[^"]+)?"/,`src="../assets/researcher-lab.js?v=${researcherJsVersion}"`);write('tools/'+file,page)}
export {root,read,write,esc,meta,header,footer,all,replaceBlock};
// Migrate only first-batch analytics to the allowlisted adapter; keep model code intact.
for(const file of firstBatch){
 const info=legacy.find(t=>t.file===file);
 replaceBlock('tools/'+file,'science-schema',`<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'LearningResource',name:info.title,url:'https://www.bhcs.com.tw/tools/'+file,inLanguage:'zh-Hant',educationalLevel:'國中',learningResourceType:'互動模擬實驗',isAccessibleForFree:true,provider:{'@type':'Organization',name:'百宏文教'}})}</script>`,`</head>`);
 let html=read('tools/'+file);
 html=html.replace(/<script>\s*(?:\/\/[^\n]*\n)?if\(location\.search\.indexOf\('noga=1'\)[\s\S]*?<\/script>/,'<!-- Analytics is loaded by science-events.js after the page is ready. -->');
 html=html.replace(/if\(typeof window\.gtag==='function'\)window\.gtag\('event','([^']+)',\{[^}]*\}\);/g,(_,event)=>`if(typeof window.bhcsScienceTrack==='function')window.bhcsScienceTrack('${event==='epicenter_located'?'task_complete':'start'}','${file.replace('.html','')}');`);
 write('tools/'+file,html);
}
for(const [old,newLink,label] of [['lenses.html','lab/lens/','透鏡成像'],['convex-lens-imaging.html','lab/lens/','透鏡成像'],['waves.html','lab/wave-sound/','波動與聲音'],['dc-motor.html','lab/electromagnetism/','電磁'],['moon-phases/index.html','../lab/moon/','月相與日月食'],['force-motion-lab.html','lab/motion/','小車運動圖']]){
 replaceBlock('tools/'+old,'science-next',`<aside aria-label="延伸探究" style="padding:16px;margin:16px;border:1px solid #bacfd6;border-radius:12px;background:#eef7f5;color:#152f46;font:16px/1.7 system-ui"><strong>接著做一個完整探究</strong><p><a style="color:#075f80" href="${newLink}">${label}實驗桌：動手操作、紀錄與檢核 →</a></p></aside>`,`</body>`);
}
// Render subject cards while retaining all legacy direct URLs.
const junior=all.filter(t=>t.subject!=='國小自然');
const groups=['生物','理化','地科'].map(subject=>{
 const items=junior.filter(t=>t.subject===subject);
 return `<article class="science-category"><h4>${subject} <small>${items.length} 項</small></h4><p><a href="tools/science/?subject=${subject}">依單元查看${subject}教材 →</a></p><ul>${items.map(t=>{
  const previousId=t.previousFile?'previous-'+t.file.split('/')[1]:'';
  return `<li><a href="tools/${t.file}"${previousId?` aria-describedby="${previousId}"`:''}>${esc(t.title)}</a>${t.kind==='引導實驗桌'?' <span class="science-new">引導實驗桌</span>':t.batch===3?' <span class="science-new">引導實驗</span>':''}${oldVersion(t,'tools/',previousId)}</li>`}).join('')}</ul></article>`;
}).join('');
let resourceSection=read('ziyuan.html');
resourceSection=resourceSection.replace(/<section class="res-sec" id="res-science">[\s\S]*?<\/section>/,`<section class="res-sec" id="res-science"><h3>國中自然 · 互動教材<span class="count">${junior.length} 項</span></h3><p class="lead">依生物、理化與地科分類。新一批探究教材採任務、操作、紀錄與檢核流程；原有演示工具持續保留。</p><div class="science-categories">${groups}</div></section>`);
write('ziyuan.html',resourceSection);
replaceBlock('ziyuan.html','science-card-style','<style>.science-categories{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.science-category{border:1px solid #cbdde4;border-radius:14px;background:#fff;padding:20px;min-width:0}.science-category h4{margin:0;font-size:1.25rem}.science-category small{font-size:.85rem;color:#496379}.science-category ul{padding-left:1.2em}.science-category li{margin:.55em 0;overflow-wrap:anywhere}.science-new{font-size:.7rem;color:#075f65;border:1px solid #b8d1d6;border-radius:6px;padding:2px 5px;white-space:nowrap}@media(max-width:800px){.science-categories{grid-template-columns:1fr}}</style>','</head>');
// G11 r3 entries are generated here so both directories keep the same topic order.
const g11R3Cards=[
 {topic:'planevector',title:'平面向量的基本運算與線性組合'},
 {topic:'determinant',title:'二階行列式與克拉瑪公式'}
];
for(const [file,prefix,isMath] of [['ziyuan.html','tools/math/',false],['tools/math/index.html','',true]]){
 let html=read(file);
 for(const {topic} of g11R3Cards)html=html.replace(new RegExp(`<a\\b[^>]*href="[^"]*g11-drills\\.html\\?topic=${topic}"[^>]*>[\\s\\S]*?<\\/a>`,'g'),'');
 const anchor=/<a\b[^>]*href="[^"]*g11-drills\.html\?topic=vectorcauchy"[^>]*>[\s\S]*?<\/a>/;
 if(!anchor.test(html))throw Error('Missing G11 vector card: '+file);
 const cards=g11R3Cards.map(({topic,title})=>`<a${isMath?' class="card"':''} href="${prefix}g11-drills.html?topic=${topic}">${isMath?'<b>'+title+'</b>':title}</a>`);
 html=html.replace(anchor,match=>cards[0]+match+cards[1]);
 if(isMath){
  html=html.replace(/(高二上・第三冊 A<(?:small|span)>)\d+ 個/,(_,label)=>label+'13 個');
  const dom=new JSDOM(html),count=dom.window.document.querySelectorAll('a.card').length;
  dom.window.close();
  html=html.replace(/共\s*\d+\s*個出題器/g,'共 '+count+' 個出題器');
 }
 write(file,html);
}
// Resource page counts (nav, headings, totals) are computed by build_resources.py from the rendered links.
console.log('Built science directory:',all.length,'resources');
enhanceLessons(root,firstBatch);

// Directory-only copy of the researcher runtime keeps the reaction mission text in step with the lab desk.
buildMarbleDirectory(root);
