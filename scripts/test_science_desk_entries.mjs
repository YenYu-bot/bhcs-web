import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {JSDOM} from 'jsdom';import {completedDeskPublic} from './science/catalog.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),doc=p=>new JSDOM(read(p)).window.document;
const directory=doc('tools/science/index.html'),resources=doc('ziyuan.html');
assert.equal(directory.querySelectorAll('.resource').length,61);
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
assert(doc('tools/science/metal-activity.html').querySelector('option[value="mg"]'));assert(doc('tools/science/metal-activity.html').querySelector('option[value="ag"]'));
console.log('PASS 61 entries, adjacent topic pairs, reciprocal links, legacy byte identity, and five unpublished prototypes');

const inlineSources=[...read('ziyuan.html').matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('src=')&&!m[1].includes('application/ld+json')).map(m=>m[2]);
// Reverse only the approved vocabulary category metadata before checking the old hashes.
const vocabularyMeta=",'res-hs-english':['高中','quiz']";
assert.equal(inlineSources.reduce((n,s)=>n+s.split(vocabularyMeta).length-1,0),1,'exactly one approved vocabulary filter entry');
const inline=inlineSources.map(s=>crypto.createHash('sha256').update(s.replace(vocabularyMeta,'')).digest('hex'));
assert.deepEqual(inline,baseline.resource_inline_script_sha256,'resource search/runtime scripts remain byte-identical after reversing only vocabulary metadata');

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
const newPaths=['lens','mirror','motion','reaction-rate','spring-friction','electric-power','neutralization','pressure','reflection-refraction','lever','pulley','incline','buoyancy','heat','solubility','metal','friction-efficiency','wave-sound','electromagnetism','energy','electrostatics','atom','stoichiometry','equilibrium','electrolysis','cell-division','circulation','ecosystem','enzyme','homeostasis','nerve-reflex','plant-exchange'];
const oldByLab={lens:'science/optics.html',motion:'motion-graphs-desk/', 'reaction-rate':'science/reaction-rate.html','spring-friction':'science/spring-friction.html','electric-power':'science/electric-power.html',neutralization:'science/neutralization.html',pressure:'science/pressure-fluid.html','reflection-refraction':'science/reflection-refraction.html',heat:'science/specific-heat.html',solubility:'science/solubility.html',metal:'science/metal-activity.html','wave-sound':'science/wave-sound.html',electromagnetism:'science/electromagnetism.html',energy:'science/energy.html',electrostatics:'science/electrostatics.html','atom':'science/atom-builder.html','stoichiometry':'science/stoichiometry.html','equilibrium':'science/equilibrium.html','electrolysis':'science/cell-electrolysis.html','cell-division':'science/cell-division.html','circulation':'science/circulation.html','ecosystem':'science/ecosystem.html','enzyme':'science/enzyme.html','homeostasis':'science/homeostasis.html','nerve-reflex':'science/nerve-reflex.html','plant-exchange':'science/plant-exchange.html'};
const manifest=JSON.parse(directory.querySelector('script[type="application/ld+json"]').textContent).hasPart;
assert.equal(manifest.length,61);
for(const id of newPaths){
 const local=`lab/${id}/`,source=`tools/${local}index.html`;
 const card=directory.querySelector(`.resource > a.open[href="../${local}"]`)?.closest('.resource');
 const row=resources.querySelector(`#res-science li > a[href="tools/${local}"]`)?.closest('li');
 assert(card&&row&&fs.existsSync(path.join(root,source)),id+' primary in both catalogues');
 assert.equal(manifest.filter(item=>item.url===`https://www.bhcs.com.tw/tools/${local}`).length,1,id+' appears once in catalog schema');
 assert.match(doc(source).querySelector('meta[name="robots"]')?.content,/noindex/,id+' retains page search policy');
 assert(!read('sitemap.xml').includes(`https://www.bhcs.com.tw/tools/${local}</loc>`),id+' not introduced to sitemap');
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
for(const old of ['lens-25d/','science/motion-graphs.html']){
 assert(directory.querySelector(`.resource > a.open[href="../${old}"]`));
 assert(resources.querySelector(`#res-science li > a[href="tools/${old}"]`));
}
console.log('PASS eight accepted primary cutovers plus separate mirror; legacy alternatives, indexing, and untouched topics');

// Prior titles and legacy-only topics still find their associated default; pressure remains primary.
for(const [file,url,inputId,selector] of [
 ['tools/science/index.html','https://www.bhcs.com.tw/tools/science/','search',id=>`.resource:not([hidden]) > a.open[href="../lab/${id}/"]`],
 ['ziyuan.html','https://www.bhcs.com.tw/ziyuan.html','resource-search',id=>`#res-science li:not(.resource-hidden) > a[href="tools/lab/${id}/"]`]
]){
 const dom=new JSDOM(read(file),{url,runScripts:'outside-only'});
 try{
  const {window:w}=dom,d=w.document,input=d.getElementById(inputId);
  for(const script of d.querySelectorAll('script:not([src]):not([type])'))w.eval(script.textContent);
  for(const [id,term] of [['pressure','氣壓、水壓與流體實驗室'],['pressure','水平管流動'],['reflection-refraction','光的反射與折射實驗室']]){
   input.value=term;input.dispatchEvent(new w.Event('input',{bubbles:true}));
   assert(d.querySelector(selector(id)),file+' '+id+' can be found using '+term);
  }
 }finally{dom.window.close();}
}
console.log('PASS pressure and optics aliases find their respective guided primary');

// 2026-11-19: the seven older desks are retired. Each old URL is a noindex redirect to its tools/lab desk,
// is absent from both catalogues and the sitemap, and its legacy science page links to the new desk.
const retired={'lever-desk':'lever','pulley-desk':'pulley','incline-desk':'incline','buoyancy-lab':'buoyancy','specific-heat-desk':'heat','solubility-desk':'solubility','metal-activity-desk':'metal'};
for(const [old,lab] of Object.entries(retired)){
 const d=doc(`tools/${old}/index.html`);
 assert.match(d.querySelector('meta[name="robots"]')?.content||'',/noindex/,old+' redirect is noindex');
 assert.equal(d.querySelector('meta[http-equiv="refresh"]')?.content,`0; url=../lab/${lab}/`,old+' redirects');
 assert.equal(d.querySelector('link[rel="canonical"]')?.href,`https://www.bhcs.com.tw/tools/lab/${lab}/`,old+' canonical');
 assert(!directory.querySelector(`a[href="../${old}/"]`)&&!resources.querySelector(`a[href="tools/${old}/"]`),old+' not listed');
 assert(!read('sitemap.xml').includes(`/tools/${old}/<`),old+' not in sitemap');
}
for(const [id,lab] of [['specific-heat','heat'],['solubility','solubility'],['metal-activity','metal']])assert(doc(`tools/science/${id}.html`).querySelector(`a[href="../lab/${lab}/"]`),id+' legacy page links to the new desk');
console.log('PASS seven retired desks redirect to their tools/lab replacements');
