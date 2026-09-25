const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).trim().split('\n');
const pages=[...new Set(files.filter(p=>p.endsWith('.html')&&!p.startsWith('scripts/')))];
const sitemap=new JSDOM(fs.readFileSync(path.join(root,'sitemap.xml'),'utf8'),{contentType:'application/xml'}).window.document;
const urls=[...sitemap.querySelectorAll('loc')].map(n=>n.textContent);assert.equal(new Set(urls).size,urls.length);
const errors=[];let checks=0;
for(const file of pages){
 const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8')),{document:d}=dom.window;
 const canonical=d.querySelector('link[rel=canonical]')?.href,noindex=(d.querySelector('meta[name=robots]')?.content||'').includes('noindex');
 if(canonical&&canonical.startsWith('https://www.bhcs.com.tw/')&&!noindex&&!urls.includes(canonical))errors.push(file+' missing sitemap');
 if(noindex&&canonical===('https://www.bhcs.com.tw/'+file)&&urls.includes(canonical))errors.push(file+' noindex in sitemap');
 for(const a of d.querySelectorAll('a[href],script[src],link[rel=stylesheet],img[src]')){
  const raw=a.getAttribute('href')||a.getAttribute('src');if(!raw||/^(https?:|data:|mailto:|tel:|javascript:|blob:)/.test(raw)||raw.includes('${'))continue;
  const url=new URL(raw,'https://www.bhcs.com.tw/'+file);const local=decodeURIComponent(url.pathname),target=path.join(root,local.endsWith('/')?local+'index.html':local);checks++;
  if(!fs.existsSync(target))errors.push(file+' -> '+raw);
 }
 dom.window.close();
}
for(const url of urls){const local=new URL(url).pathname;assert.ok(fs.existsSync(path.join(root,local.endsWith('/')?local+'index.html':local)),url+' missing')}
// Round-two approval allows only the audited worksheet preview files to change.
// 2026-09-21：使用者核准數學總覽頁品牌化（僅外觀、搜尋與年級跳轉）。
const approvedMathPreview=new Set(['tools/math/index.html','tools/math/g7-signed-numbers.html','tools/math/g7-scientific-notation.html','tools/math/g7-factors-multiples.html','tools/math/g7-linear-equation.html','tools/math/g7-simultaneous-equations.html','tools/math/g7-inequality.html','tools/math/g7-ratio.html','tools/math/g9b-2-1-quartiles.html','tools/math/g9b-2-1-boxplot.html','tools/math/g9-1-2-parallel-proportional-application.html','tools/math/g9-1-3-similar-triangles.html']);
// P1 handoff explicitly authorizes screen branding of all linked worksheets.
// The P1 guard verifies original HTML and print rules; authorized P2 engine scripts have dedicated math regressions.
const {files:mathBrandFiles,declaredCount:mathToolCount}=require('./check_math_brand.cjs');
const approvedMathFiles=new Set([...approvedMathPreview,...mathBrandFiles]);
const changedMath=cp.execFileSync('git',['diff','--name-only','da02d2f','--','tools/math'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);assert.ok(changedMath.every(file=>approvedMathFiles.has(file)),'Unexpected math tool changed: '+changedMath.filter(file=>!approvedMathFiles.has(file)).join(', '));
const fitted=['tools/factors.html','tools/vertical.html','tools/fraction.html','tools/fraction-decimal.html','tools/laws.html',...['g7-signed-numbers.html','g7-scientific-notation.html','g7-factors-multiples.html','g7-linear-equation.html','g7-simultaneous-equations.html','g7-inequality.html','g7-ratio.html'].map(file=>'tools/math/'+file)];for(const file of fitted)assert.ok(fs.readFileSync(path.join(root,file),'utf8').includes('a4-preview-fit.js'),file+' missing responsive A4 preview');
for(const file of [...approvedMathPreview].filter(file=>file.includes('/g9')))assert.ok(fs.readFileSync(path.join(root,file),'utf8').includes('overflow-x:clip'),file+' missing narrow overflow containment');
{const mathIndex=fs.readFileSync(path.join(root,'tools/math/index.html'),'utf8');assert.equal((mathIndex.match(/class="card"/g)||[]).length,mathToolCount,'math index must match its declared tool count');}
assert.deepEqual(errors,[]);console.log(`PASS ${pages.length} HTML pages, ${checks} local references, ${urls.length} sitemap URLs, approved math preview/P1 branding changes only`);
