import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {JSDOM} from 'jsdom';import {completedDeskPublic} from './science/catalog.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),doc=p=>new JSDOM(read(p)).window.document;
const directory=doc('tools/science/index.html'),resources=doc('ziyuan.html');
assert.equal(directory.querySelectorAll('.resource').length,63);
const baseline=JSON.parse(read('scripts/public-desk-legacy-baseline.json'));
assert.equal(baseline.source_commit,'10598e94b905bdc81c2087cd791ec28c909cce1c');
for(const t of completedDeskPublic){
 const oldFile=`tools/science/${t.id}.html`,newFile=`tools/${t.file}index.html`;
 const old=directory.querySelector(`a[href="../science/${t.id}.html"]`)?.closest('.resource');const next=old?.nextElementSibling;
 assert(next?.querySelector(`a[href="../${t.file}"]`),'adjacent topic pair '+t.id);assert.match(old.textContent,/舊版自由探究/);assert.match(next.textContent,/引導實驗桌/);
 const oldRow=resources.querySelector(`a[href="${oldFile}"]`)?.closest('li');assert(oldRow?.nextElementSibling?.querySelector(`a[href="tools/${t.file}"]`),'resource adjacency');assert.match(oldRow.textContent,/舊版自由探究/);assert.match(oldRow.nextElementSibling.textContent,/兩版紀錄分開保存/);
 const raw=read(oldFile),stripped=raw.replace(/<!-- completed-desk-nav:start -->\n[\s\S]*?\n<!-- completed-desk-nav:end -->\n/,'');assert.notEqual(raw,stripped);assert.equal(crypto.createHash('sha256').update(stripped).digest('hex'),baseline.sha256[oldFile],'all legacy bytes outside navigation unchanged');
 const oldDoc=doc(oldFile),fresh=doc(newFile);assert(oldDoc.querySelector(`a[href="../${t.file}"]`));assert(fresh.querySelector(`a[href="../science/${t.id}.html"]`));for(const d of [oldDoc,fresh]){assert(d.querySelector('a[href="../../ziyuan.html#res-science"]'));assert(d.querySelector('a[href="./"],a[href="../science/"]'));}assert(!fresh.querySelector('meta[name="robots"]')?.content.includes('noindex'));assert(read('sitemap.xml').includes(`https://www.bhcs.com.tw/tools/${t.file}</loc>`));
}
for(const id of ['optics','buoyancy','microscope','acid-base','photosynthesis-factor']){const file=`tools/science/${id}-guided.html`;if(!fs.existsSync(path.join(root,file)))throw Error('missing unpublished prototype '+file);assert.match(doc(file).querySelector('meta[name="robots"]').content,/noindex/);for(const page of ['tools/science/index.html','ziyuan.html','sitemap.xml'])assert(!read(page).includes(`${id}-guided.html`),'prototype stays unlisted');}
assert(doc('tools/science/metal-activity.html').querySelector('option[value="mg"]'));assert(doc('tools/science/metal-activity.html').querySelector('option[value="ag"]'));
console.log('PASS 63 entries, adjacent topic pairs, reciprocal links, legacy byte identity, and five unpublished prototypes');

const inline=[...read('ziyuan.html').matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('src=')&&!m[1].includes('application/ld+json')).map(m=>crypto.createHash('sha256').update(m[2]).digest('hex'));
assert.deepEqual(inline,baseline.resource_inline_script_sha256,'resource search/runtime scripts remain byte-identical to main');

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
