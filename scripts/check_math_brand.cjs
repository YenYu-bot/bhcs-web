// P1: preserve worksheet markup and print/layout rules. P2 math engines are verified separately.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),baseline='44d5ff330aef60dbe3cb8c12e8b9a01e44afa59f';
const d=new JSDOM(fs.readFileSync(path.join(root,'tools/math/index.html'),'utf8')).window.document;
const links=[...d.querySelectorAll('a.card')].map(a=>new URL(a.getAttribute('href'),'https://www.bhcs.com.tw/tools/math/'));
const declaredCount=Number(d.querySelector('header p')?.textContent.match(/共\s*(\d+)\s*個出題器/)?.[1]);
assert.ok(Number.isSafeInteger(declaredCount)&&declaredCount>0,'math index declared tool count missing');
assert.equal(links.length,declaredCount,'math index cards differ from its declared tool count');
assert.match(d.querySelector('.intro')?.textContent||'',new RegExp('共\\s*'+declaredCount+'\\s*個出題器'),'math index intro count differs from header');
assert.match(d.querySelector('meta[name="description"]')?.getAttribute('content')||'',new RegExp('共\\s*'+declaredCount+'\\s*個出題器'),'math index meta description count differs from header');
for(const section of d.querySelectorAll('section')){const span=section.querySelector('h2 > span');if(!span)continue;const group=section.querySelector('h2').childNodes[0].textContent.trim(),declared=Number(span.textContent.match(/(\d+)\s*個/)?.[1]),actual=section.querySelectorAll('.grid a.card').length;assert.ok(Number.isSafeInteger(declared),group+' group count missing');assert.equal(actual,declared,`math index group ${group} declares ${declared} but has ${actual} cards`)}
for(const [file,label] of [['g9b-2-1-boxplot.html','盒狀圖繪製與讀圖'],['g9b-2-2-tree-diagram.html','樹狀圖繪製與樣本空間圖']]){const card=d.querySelector(`a.card[href="${file}"]`);assert.ok(card,file+' card missing from math index');assert.equal(card.querySelector('b')?.textContent,label,file+' card label must match ziyuan.html (B-class legacy page)')}
const files=[...new Set(links.map(u=>u.pathname.slice(1)))];for(const file of files)assert.ok(fs.existsSync(path.join(root,file)),file+' linked from index but missing');
const p2EngineFiles=new Set(files.filter(file=>/^tools\/math\/g[^/]*-drills\.html$/.test(file)));
const approvedCrosslinks=new Set(['tools/math/g8-quadratic-arithmetic-sequence.html']);
const legacyLinks={
 'g9-2-1-sector-segment.html':['circle1','本頁內容已併入'],
 'g9-2-2-inscribed-angle-arc.html':['circle2','本頁內容已併入'],
 'g9-1-4-measurement.html':['similar','本頁內容已併入'],
 'g9-1-4-trig-ratio.html':['righttri','本頁內容已併入'],
 'g9-3-2-circumcenter.html':['centers','本頁內容已併入'],
 'g9-3-2-incenter.html':['centers','本頁內容已併入'],
 'g9-3-2-centroid.html':['centers','本頁內容已併入'],
 'g9-1-2-parallel-proportional.html':['parallelratio','相關主題'],
 'g9-1-2-parallel-proportional-application.html':['parallelratio','相關主題'],
 'g9-1-3-similar-triangles.html':['similar','相關主題'],
 'g9-1-4-similar-area.html':['similar','相關主題'],
 'g9-2-1-chord.html':['circle1','相關主題'],
 'g9-2-1-tangent.html':['circle1','相關主題'],
 'g9-2-2-central-angle-arc.html':['circle2','相關主題']
};
const g7LegacyLinks={
 'g7-exponent-laws.html':['exponent','指數律'],
 'g7-scientific-notation.html':['scinot','科學記號'],
 'g7-factors-multiples.html':['factors','因數與倍數'],
 'g7-linear-equation.html':['linear','一元一次式與方程式'],
 'g7-simultaneous-equations.html':['simultaneous','二元一次聯立方程式'],
 'g7-inequality.html':['inequality','一元一次不等式'],
 'g7-ratio.html':['ratio','比例'],
 'g7-function.html':['function','函數']
};
const g8LegacyLinks={'g8-multiplication-formulas.html':['mulformula','乘法公式'],'g8-polynomial-operations.html':['polyops','多項式四則'],'g8-factorization.html':['factor','因式分解'],'g8-square-roots.html':['sqrt','平方根'],'g8-pythagorean.html':['pythagoras','畢氏定理與兩點距離']};
const g9bLegacyLinks={'g9b-3-1-solids.html':['solid','立體圖形'],'g9b-2-2-tree-diagram.html':['treediagram','樹狀圖與機率','計算題已併入'],'g9b-2-2-probability.html':['probability','認識機率'],'g9b-2-1-boxplot.html':['boxplot','盒狀圖、全距與四分位距','計算題已併入'],'g9b-2-1-quartiles.html':['quartile','中位數與四分位數'],'g9b-1-1-quadratic-function.html':['quadfunc','二次函數的圖形與最大值、最小值']};
const strip=s=>s.replace(/<!-- g9b-legacy-link-start --><p><a href="g9-drills\.html\?topic=(?:quadfunc|quartile|boxplot|probability|treediagram|solid)" style="text-decoration:underline;color:inherit">(?:本頁內容已併入|計算題已併入) → [^<]+<\/a><\/p><!-- g9b-legacy-link-end -->/g,'').replace(/\n<style id="bhcs-math-brand">[\s\S]*?<\/style>\n/g,'').replace(/<meta\s+name="theme-color"\s+content="[^"]+"\s*\/?>/gi,'').replace(/\.expr svg\.fig\{[^}]*\}/g,'').replace(/\n  <!-- g8-r5-related-start -->[\s\S]*?\n  <!-- g8-r5-related-end -->\n/g,'').replace(/\n          <!-- g8-dual-legacy-link-start -->[\s\S]*?<!-- g8-dual-legacy-link-end -->/g,'').replace(/<!-- g7-legacy-link-start --><p><a href="g7-drills\.html\?topic=(?:exponent|scinot|factors|linear|simultaneous|inequality|ratio|function)" style="text-decoration:underline(?:;color:inherit)?">本頁內容已併入 → [^<]+<\/a><\/p><!-- g7-legacy-link-end -->/g,'').replace(/<!-- g8-legacy-link-start --><p><a href="g8-drills\.html\?topic=(?:mulformula|polyops|factor|sqrt|pythagoras)" style="text-decoration:underline;color:inherit">本頁內容已併入 → [^<]+<\/a><\/p><!-- g8-legacy-link-end -->/g,'').replace(/\n          <!-- g9-legacy-link-start -->\n          <p class="[^"]+"><a href="g9-drills\.html\?topic=[a-z0-9]+" style="text-decoration:underline">[^<]+<\/a><\/p>\n          <!-- g9-legacy-link-end -->/g,'');
const requiredBrandVars={green:'#16233A',green2:'#0D1626',mint:'#C8352B',soft:'#F2F4F7',line:'#C9D2DE',ink:'#16233A',muted:'#43516B',bg:'#FCFCFA',red:'#C8352B'};
const brandPalette=hex=>{const h=hex.slice(1),[r,g,b]=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)),hi=Math.max(r,g,b),lo=Math.min(r,g,b);if(hi===lo)return null;if(hi-lo<12&&hi>240)return requiredBrandVars.bg;if(lo>=175&&hi>=225)return requiredBrandVars.soft;if(lo>=125&&hi>=185)return requiredBrandVars.line;if(r>g*1.25&&r>b*1.2)return requiredBrandVars.red;if(hi-lo<45&&hi>75&&hi<190)return requiredBrandVars.muted;return requiredBrandVars.ink;};
const comparable=(file,s)=>{s=strip(s);return p2EngineFiles.has(file)?s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,block=>block.includes('globalThis.__BHCS_TEST__')?'<script data-p2-engine></script>':block):s};
for(const [name,[topic,label,prefix='本頁內容已併入']] of Object.entries(g9bLegacyLinks)){
 const file='tools/math/'+name,s=fs.readFileSync(path.join(root,file),'utf8');
 assert.equal((s.match(/<!-- g9b-legacy-link-start -->/g)||[]).length,1,file+' link missing/duplicated');
 assert.equal((s.match(/<!-- g9b-legacy-link-end -->/g)||[]).length,1,file+' link end missing/duplicated');
 assert.ok(s.includes(`href="g9-drills.html?topic=${topic}" style="text-decoration:underline;color:inherit">${prefix} → ${label}</a>`),file+' incorrect link');
 const old=cp.execFileSync('git',['show',baseline+':'+file],{cwd:root,encoding:'utf8',maxBuffer:4e6});
 assert.equal(comparable(file,s),comparable(file,old),file+' changes worksheet markup or print/layout rules beyond its approved link');
}
for(const [name,[topic,label]] of Object.entries(g8LegacyLinks)){
 const file='tools/math/'+name,s=fs.readFileSync(path.join(root,file),'utf8');
 assert.equal((s.match(/<!-- g8-legacy-link-start -->/g)||[]).length,1,file+' link missing/duplicated');
 assert.equal((s.match(/<!-- g8-legacy-link-end -->/g)||[]).length,1,file+' link end missing/duplicated');
 assert.ok(s.includes(`href="g8-drills.html?topic=${topic}" style="text-decoration:underline;color:inherit">本頁內容已併入 → ${label}</a>`),file+' incorrect link');
 const old=cp.execFileSync('git',['show',baseline+':'+file],{cwd:root,encoding:'utf8',maxBuffer:4e6});
 assert.equal(comparable(file,s),comparable(file,old),file+' changes worksheet markup or print/layout rules beyond its approved link');
}
{
 const file='tools/math/g8-quadratic-arithmetic-sequence.html',s=fs.readFileSync(path.join(root,file),'utf8');
 assert.equal((s.match(/<!-- g8-dual-legacy-link-start -->/g)||[]).length,1,file+' link missing/duplicated');
 assert.equal((s.match(/<!-- g8-dual-legacy-link-end -->/g)||[]).length,1,file+' link end missing/duplicated');
 for(const [topic,label] of [['arithseq','等差數列與等差級數'],['quadsolve','解一元二次方程式']])
  assert.ok(s.includes(`href="g8-drills.html?topic=${topic}" style="text-decoration:underline;color:inherit">${label}</a>`),file+' incorrect '+topic+' link');
 assert.ok(s.includes('本頁內容已併入 → '),file+' missing link label');
 const old=cp.execFileSync('git',['show',baseline+':'+file],{cwd:root,encoding:'utf8',maxBuffer:4e6});
 assert.equal(comparable(file,s),comparable(file,old),file+' changes worksheet markup or print/layout rules beyond its approved links');
}
for(const [name,[topic,label]] of Object.entries(g7LegacyLinks)){
 const file='tools/math/'+name,s=fs.readFileSync(path.join(root,file),'utf8');
 assert.equal((s.match(/<!-- g7-legacy-link-start -->/g)||[]).length,1,file+' link missing/duplicated');
 assert.equal((s.match(/<!-- g7-legacy-link-end -->/g)||[]).length,1,file+' link end missing/duplicated');
 assert.ok(s.includes(`href="g7-drills.html?topic=${topic}" style="text-decoration:underline${['linear','simultaneous','inequality','ratio','function'].includes(topic)?';color:inherit':''}">本頁內容已併入 → ${label}</a>`),file+' incorrect link');
 const old=cp.execFileSync('git',['show',baseline+':'+file],{cwd:root,encoding:'utf8',maxBuffer:4e6});
 assert.equal(comparable(file,s),comparable(file,old),file+' changes worksheet markup or print/layout rules beyond its approved link');
}
for(const [name,[topic,label]] of Object.entries(legacyLinks)){
 const file='tools/math/'+name,s=fs.readFileSync(path.join(root,file),'utf8');
 assert.equal((s.match(/<!-- g9-legacy-link-start -->/g)||[]).length,1,file+' link missing/duplicated');
 assert.equal((s.match(/<!-- g9-legacy-link-end -->/g)||[]).length,1,file+' link end missing/duplicated');
 assert.ok(s.includes(`href="g9-drills.html?topic=${topic}" style="text-decoration:underline">${label} → `),file+' incorrect link');
 const old=cp.execFileSync('git',['show',baseline+':'+file],{cwd:root,encoding:'utf8',maxBuffer:4e6});
 assert.equal(comparable(file,s),comparable(file,old),file+' changes worksheet markup or print/layout rules beyond its approved link');
}
for(const file of files){
 const s=fs.readFileSync(path.join(root,file),'utf8'),oldRef=baseline+':'+file;
 if(approvedCrosslinks.has(file)){
  assert.equal((s.match(/<!-- g8-r5-related-start -->/g)||[]).length,1,file+' related-links block missing/duplicated');
  assert.match(s,/href="g8-drills\.html\?topic=quadapps"/,file+' missing quadratic applications crosslink');
  assert.match(s,/href="g8-drills\.html\?topic=geoseq"/,file+' missing geometric sequence crosslink');
 }
 const existed=cp.spawnSync('git',['cat-file','-e',oldRef],{cwd:root}).status===0;
 if(existed){
  const old=cp.execFileSync('git',['show',oldRef],{cwd:root,encoding:'utf8',maxBuffer:4e6});
  assert.equal(comparable(file,s),comparable(file,old),file+' changes worksheet markup or print/layout rules outside the authorized P2 engine script');
 }else assert.ok(p2EngineFiles.has(file),file+' is a new linked worksheet without an approved g*-drills engine pattern');
 assert.equal((s.match(/id="bhcs-math-brand"/g)||[]).length,1,file+' missing/duplicated theme');
 assert.match(s,/<meta name="theme-color" content="#16233A">/,file);
 const brandBlock=s.match(/<style id="bhcs-math-brand">([\s\S]*?)<\/style>/)?.[1];assert.ok(brandBlock,file+' missing bhcs brand style block');
 for(const [key,value] of Object.entries(requiredBrandVars))assert.ok(brandBlock.includes(`--bhcs-${key}:${value}`),file+` missing brand variable --bhcs-${key}:${value}`);
 const source=strip(s),colors=[...new Set(source.match(/#[\da-f]{6}\b/gi)||[])];
 for(const color of colors){const target=brandPalette(color);if(!target||target.toLowerCase()===color.toLowerCase())continue;for(const prop of ['fill','stroke']){const rule=`svg [${prop}="${color}" i]{${prop}:${target}}`;assert.ok(brandBlock.toLowerCase().includes(rule.toLowerCase()),file+' missing SVG brand mapping '+rule);}}
 assert.ok(brandBlock.includes('color:#C8352B!important'),file+' missing teacher-answer red rule');
}
console.log(`PASS P1: ${links.length} links, ${files.length} files, worksheet markup/print rules preserved; P2 engine scripts delegated to math regressions`);
module.exports={root,baseline,files,p2EngineFiles,approvedCrosslinks,legacyLinkFiles:[...Object.keys(legacyLinks),...Object.keys(g7LegacyLinks),...Object.keys(g8LegacyLinks),...Object.keys(g9bLegacyLinks),'g8-quadratic-arithmetic-sequence.html'].map(name=>'tools/math/'+name),declaredCount,links:links.map(u=>u.pathname.slice(1)+u.search)};
