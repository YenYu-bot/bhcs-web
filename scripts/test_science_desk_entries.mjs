import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {JSDOM} from 'jsdom';import {completedDeskPublic} from './science/catalog.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),doc=p=>new JSDOM(read(p)).window.document;
const directory=doc('tools/science/index.html'),resources=doc('ziyuan.html');
assert.equal(directory.querySelectorAll('.resource').length,69);
const baseline=JSON.parse(read('scripts/public-desk-legacy-baseline.json'));
assert.equal(baseline.source_commit,'10598e94b905bdc81c2087cd791ec28c909cce1c');
for(const t of completedDeskPublic){
 for(const outdated of ['尚未列入教材目錄','獨立試用版'])assert(!read(`tools/${t.file}index.html`).includes(outdated),'public desk must not retain outdated listing copy '+t.id);
 const oldFile=`tools/science/${t.id}.html`,newFile=`tools/${t.file}index.html`;
 const old=directory.querySelector(`a[href="../science/${t.id}.html"]`)?.closest('.resource');const next=old?.nextElementSibling;
 assert(next?.querySelector(`a[href="../${t.file}"]`),'adjacent topic pair '+t.id);assert.match(old.textContent,/舊版自由探究/);assert.match(next.textContent,/引導實驗桌/);
 const oldRow=resources.querySelector(`a[href="${oldFile}"]`)?.closest('li');assert(oldRow?.nextElementSibling?.querySelector(`a[href="tools/${t.file}"]`),'resource adjacency');assert.match(oldRow.textContent,/舊版自由探究/);assert.match(oldRow.nextElementSibling.textContent,/兩版紀錄分開保存/);
 const raw=read(oldFile),stripped=raw.replace(/<!-- completed-desk-nav:start -->\n[\s\S]*?\n<!-- completed-desk-nav:end -->\n/,'');assert.notEqual(raw,stripped);assert.equal(crypto.createHash('sha256').update(stripped).digest('hex'),baseline.sha256[oldFile],'all legacy bytes outside navigation unchanged');
 const oldDoc=doc(oldFile),fresh=doc(newFile);assert(oldDoc.querySelector(`a[href="../${t.file}"]`));assert(fresh.querySelector(`a[href="../science/${t.id}.html"]`));for(const d of [oldDoc,fresh]){assert(d.querySelector('a[href="../../ziyuan.html#res-science"]'));assert(d.querySelector('a[href="./"],a[href="../science/"]'));}assert(!fresh.querySelector('meta[name="robots"]')?.content.includes('noindex'));assert(read('sitemap.xml').includes(`https://www.bhcs.com.tw/tools/${t.file}</loc>`));
}
for(const id of ['optics','buoyancy','microscope','acid-base','photosynthesis-factor']){const file=`tools/science/${id}-guided.html`;if(!fs.existsSync(path.join(root,file)))throw Error('missing unpublished prototype '+file);assert.match(doc(file).querySelector('meta[name="robots"]').content,/noindex/);for(const page of ['tools/science/index.html','ziyuan.html','sitemap.xml'])assert(!read(page).includes(`${id}-guided.html`),'prototype stays unlisted');}
console.log('PASS 69 entries, adjacent topic pairs, reciprocal links, legacy byte identity, and five unpublished prototypes');

const inlineSources=[...read('ziyuan.html').matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('src=')&&!m[1].includes('application/ld+json')).map(m=>m[2]);
// Keep the original hash gate: reverse the vocabulary entry and the exact subset
// of finder lines that enables both print and online filtering for English tools.
const vocabularyMeta=",'res-hs-english':['高中','quiz']";
const finderChanges=[
 [" const typesOf=a=>(a.dataset.resourceTypes||META[a.closest('.res-sec').id][1]).split(' ');\n", ""],
 [" const hay=new Map(links.map(a=>[a,norm([a.textContent,a.title,a.dataset.resourceSearch,noteOf(a)?.textContent,a.closest('.trow')?.querySelector('.tlabel')?.textContent,a.closest('.science-category')?.querySelector('h4')?.textContent,a.closest('.res-sec')?.querySelector('h3')?.textContent].filter(Boolean).join(' '))]));\n", " const hay=new Map(links.map(a=>[a,norm([a.textContent,a.title,noteOf(a)?.textContent,a.closest('.trow')?.querySelector('.tlabel')?.textContent,a.closest('.science-category')?.querySelector('h4')?.textContent,a.closest('.res-sec')?.querySelector('h3')?.textContent].filter(Boolean).join(' '))]));\n"],
 ["  const tag=document.createElement('span');tag.className='res-type';tag.textContent=new Set([...sec.querySelectorAll(LINKS)].flatMap(typesOf)).size>1?'列印・線上練習':TYPES[META[sec.id][1]];btn.appendChild(tag);h3.appendChild(btn);\n", "  const tag=document.createElement('span');tag.className='res-type';tag.textContent=TYPES[META[sec.id][1]];btn.appendChild(tag);h3.appendChild(btn);\n"],
 ["  sections.forEach(sec=>{const [st]=META[sec.id];const inScope=stage==='全部'||st===stage;let n=0;\n   sec.querySelectorAll(LINKS).forEach(a=>{const ok=inScope&&(type==='all'||typesOf(a).includes(type))&&(!term||hay.get(a).includes(term));n+=ok?1:0;(a.closest('.science-category li')||a).classList.toggle('resource-hidden',!ok);noteOf(a)?.classList.toggle('resource-hidden',!ok)});\n", "  sections.forEach(sec=>{const [st,ty]=META[sec.id];const inScope=(stage==='全部'||st===stage)&&(type==='all'||ty===type);let n=0;\n   sec.querySelectorAll(LINKS).forEach(a=>{const ok=inScope&&(!term||hay.get(a).includes(term));n+=ok?1:0;(a.closest('.science-category li')||a).classList.toggle('resource-hidden',!ok);noteOf(a)?.classList.toggle('resource-hidden',!ok)});\n"]
];
assert.equal(inlineSources.reduce((n,s)=>n+s.split(vocabularyMeta).length-1,0),1,'exactly one vocabulary filter entry');
const inline=inlineSources.map(s=>{
 s=s.replace(vocabularyMeta,'');
 for(const [updated,original] of finderChanges){
  assert.equal(s.split(updated).length-1,1,'exact dual-use finder change');
  s=s.replace(updated,original);
 }
 return crypto.createHash('sha256').update(s).digest('hex');
});
assert.deepEqual(inline,baseline.resource_inline_script_sha256,'resource search remains identical apart from the reviewed English finder changes');

// Execute the actual researcher shell: main children are redistributed into four screens.
// A static link check alone cannot detect navigation hidden in the challenge screen.
for(const t of completedDeskPublic){
 const dom=new JSDOM(read(`tools/science/${t.id}.html`),{url:`https://www.bhcs.com.tw/tools/science/${t.id}.html?noga=1&nofonts=1`,runScripts:'outside-only'});
 const {window:w}=dom,d=w.document;w.scrollTo=()=>{};w.matchMedia=()=>({matches:true});w.requestAnimationFrame=callback=>(callback(),1);
 const css=d.createElement('style');css.textContent=read('assets/researcher-lab.css');d.head.append(css);
 w.eval(read('assets/researcher-lab.js'));
 const link=d.querySelector(`a[href="../${t.file}"]`),nav=link.closest('nav');
 assert.equal(nav.parentElement,d.body,'navigation must remain outside transformed main');
 for(const screen of ['prepare','bench','notebook','check']){
  d.querySelector(`.researcher-nav button[data-to="${screen}"]`).click();
  assert.equal(d.querySelector('.researcher-screen.is-active').dataset.screen,screen);
  assert(!nav.closest('.researcher-screen,[hidden],[aria-hidden="true"]'),t.id+' '+screen+' navigation has no hidden ancestor');
  for(let el=link;el;el=el.parentElement){const style=w.getComputedStyle(el);assert.notEqual(style.display,'none');assert.notEqual(style.visibility,'hidden');}
 }
 dom.window.close();
}
console.log('PASS actual researcher shell keeps version navigation visible through all four screens');

// The eight replacements use the accepted labs as the primary link in both
// directories; legacy tools remain discoverable without adding counted cards.
const newPaths=['lens','mirror','motion','reaction-rate','spring-friction','electric-power','neutralization','pressure','reflection-refraction','lever','pulley','incline','buoyancy','heat','solubility','metal','friction-efficiency','wave-sound','electromagnetism','energy','electrostatics','atom','stoichiometry','equilibrium','electrolysis','cell-division','circulation','ecosystem','enzyme','homeostasis','nerve-reflex','plant-exchange','moon','seasons','tides','weather','circuit','phase','balance','indicator','newton','color','eye','microscope','photosynthesis','genetics','earthquake'];
const oldByLab={motion:'motion-graphs-desk/'};
const manifest=JSON.parse(directory.querySelector('script[type="application/ld+json"]').textContent).hasPart;
assert.equal(manifest.length,69);
for(const id of newPaths){
 const local=`lab/${id}/`,source=`tools/${local}index.html`;
 const card=directory.querySelector(`.resource > a.open[href="../${local}"]`)?.closest('.resource');
 const row=resources.querySelector(`#res-science li > a[href="tools/${local}"]`)?.closest('li');
 assert(card&&row&&fs.existsSync(path.join(root,source)),id+' primary in both catalogues');
 assert.equal(manifest.filter(item=>item.url===`https://www.bhcs.com.tw/tools/${local}`).length,1,id+' appears once in catalog schema');
 assert(!doc(source).querySelector('meta[name="robots"]'),id+' is indexable');assert.equal(doc(source).querySelector('link[rel="canonical"]')?.getAttribute('href'),`https://www.bhcs.com.tw/tools/${local}`,id+' self canonical');
 assert.equal(read('sitemap.xml').split(`<loc>https://www.bhcs.com.tw/tools/${local}</loc>`).length,2,id+' listed once in sitemap');
 const fallback=oldByLab[id];
 if(fallback){
  const note=resources.getElementById(row.querySelector('a').getAttribute('aria-describedby'));
  assert(note?.querySelector(`a[href="tools/${fallback}"]`)&&row.contains(note),id+' retained list version link is accessible');
  assert(card.querySelector(`p.subtle a[href="../${fallback}"]`),id+' retained directory version link');
  assert(!directory.querySelector(`.resource > a.open[href="../${fallback}"]`),id+' no duplicate default in directory');
  assert(!resources.querySelector(`#res-science li > a[href="tools/${fallback}"]`),id+' no duplicate default in resources');
  assert(!manifest.some(item=>item.url===`https://www.bhcs.com.tw/tools/${fallback}`),id+' old link is not a second schema entry');
 }
}
for(const [dir,href] of [[directory,'../motion-graphs-desk/v2/'],[resources,'tools/motion-graphs-desk/v2/']])assert(dir.querySelector(`p.subtle a[href="${href}"]`));
for(const old of ['lens-25d/']){
 assert(directory.querySelector(`.resource > a.open[href="../${old}"]`));
 assert(resources.querySelector(`#res-science li > a[href="tools/${old}"]`));
}
console.log('PASS eight accepted primary cutovers plus separate mirror; legacy alternatives, indexing, and untouched topics');

// 2026-11-20: the 新探究 pages these desks replaced were removed; no old-version link or catalogue entry remains.
for(const t of [...directory.querySelectorAll('.resource a'),...resources.querySelectorAll('#res-science a')])assert.doesNotMatch(t.getAttribute('href'),/(^|\/)science\/(?!.*-guided\.html)[a-z-]+\.html$/,'no link to a removed 新探究 page: '+t.getAttribute('href'));
console.log('PASS no catalogue link to a removed 新探究 page');

// 2026-11-19: the seven older desks are retired. Each old URL is a noindex redirect to its tools/lab desk,
// is absent from both catalogues and the sitemap.
const retired={'lever-desk':'lever','pulley-desk':'pulley','incline-desk':'incline','buoyancy-lab':'buoyancy','specific-heat-desk':'heat','solubility-desk':'solubility','metal-activity-desk':'metal'};
for(const [old,lab] of Object.entries(retired)){
 const d=doc(`tools/${old}/index.html`);
 assert.match(d.querySelector('meta[name="robots"]')?.content||'',/noindex/,old+' redirect is noindex');
 assert.equal(d.querySelector('meta[http-equiv="refresh"]')?.content,`0; url=../lab/${lab}/`,old+' redirects');
 assert.equal(d.querySelector('link[rel="canonical"]')?.href,`https://www.bhcs.com.tw/tools/lab/${lab}/`,old+' canonical');
 assert(!directory.querySelector(`a[href="../${old}/"]`)&&!resources.querySelector(`a[href="tools/${old}/"]`),old+' not listed');
 assert(!read('sitemap.xml').includes(`/tools/${old}/<`),old+' not in sitemap');
}
console.log('PASS seven retired desks redirect to their tools/lab replacements');
