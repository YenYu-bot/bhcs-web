import {beforePublicDeskEntry,publicDeskDiscoveryReach} from './public_desk_entry_contract.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const blob=b=>crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
const raw=read('scripts/solubility-desk-runtime.json'), m=JSON.parse(raw);
assert.equal(sha(raw),'08db07bd5bda3cf269d8b4e3b0deb687d47d6786db538cabc1598d6e678a6dc9');
assert.equal(m.source_commit,'7fde9da751162134f103c8a68f7987ca0585b41f');
assert.equal(m.integration_base,'61eebcb86b43e1423c3bd1f7831502902fed124b');
assert.equal(m.mode,'unlisted-independent-draft');
assert.equal(m.files.length,9);assert.equal(m.tests.length,3);
const dir='tools/solubility-desk/';
const walk=p=>fs.readdirSync(path.join(root,p),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+e.name+'/'):[p+e.name]);
assert.deepEqual(walk(dir).sort(),m.files.map(f=>dir+f.path).sort());
for(const f of m.files){
 let b=read(dir+f.path);if(f.path==='index.html')b=beforePublicDeskEntry(b,'solubility');assert.equal(sha(b),f.integrated_sha256,f.path);
 if(f.replacements.length){let s=b.toString();for(const {before,after,count} of [...f.replacements].reverse()){assert.equal(count,1);assert.equal(s.split(after).length-1,1);s=s.replace(after,before);}b=Buffer.from(s);}
 assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256,'accepted source '+f.path);
}
for(const t of m.tests){const b=read('scripts/solubility-desk/'+t.path);assert.equal(sha(b),t.integrated_sha256);assert.equal(sha(b.toString().replaceAll('../../tools/solubility-desk/','../dist/')),t.source_sha256,'accepted test '+t.path);}
const approvedChanges=JSON.parse(read('scripts/approved-existing-tool-changes.json').toString()).changes,approvedReach=(p,from)=>{let at=from;const seen=new Set();for(let s;(s=approvedChanges.find(c=>c.path===p&&c.baseline_blob===at));){assert(!seen.has(at),'approval cycle');seen.add(at);at=s.approved_blob;}return publicDeskDiscoveryReach(p,at);};/* later tools/assets edits pass only through the approved blob chain */
const tree=execFileSync('git',['ls-tree','-r',m.integration_base,'--','tools','assets'],{cwd:root,encoding:'utf8'}).trim().split('\n');
let protectedCount=0;
for(const row of tree){const match=row.match(/^(\d+) blob ([a-f0-9]+)\t(.+)$/);if(!match)continue;const [,mode,id,p]=match;{const now=blob(read(p));assert.ok(now===id||now===approvedReach(p,id),'preexisting asset '+p);}assert.equal(mode,'100644');protectedCount++;}
assert(protectedCount>650);
for(const p of ['scripts/science/catalog.mjs','scripts/build_science.mjs','scripts/build_marble_replacement.mjs','scripts/build_sitemap.py','scripts/science/models.mjs','scripts/science/runtime.js','tools/science/solubility.html','tools/science/index.html','ziyuan.html'])assert.equal(blob(read(p)),approvedReach(p,execFileSync('git',['rev-parse',m.integration_base+':'+p],{cwd:root,encoding:'utf8'}).trim()),'only approved discovery/navigation changes '+p);
// sitemap.xml: lastmod dates move when other pages change; the desk must not add or remove a URL
{const locs=x=>[...String(x).matchAll(/<loc>([^<]+)<\/loc>/g)].map(r=>r[1]);const added=['specific-heat','solubility','metal-activity'].map(id=>'https://www.bhcs.com.tw/tools/'+id+'-desk/');const actual=locs(read('sitemap.xml'));for(const url of added)assert.equal(actual.filter(x=>x===url).length,1);assert.deepEqual(actual.filter(x=>!added.includes(x)),locs(execFileSync('git',['show',m.integration_base+':sitemap.xml'],{cwd:root,encoding:'utf8'})),'only three approved public desk URLs added');}
const html=read(dir+'index.html').toString(),doc=new JSDOM(html).window.document;
assert.equal(doc.querySelector('link[rel=canonical]').href,'https://www.bhcs.com.tw/tools/solubility-desk/');
assert.equal(doc.querySelector('meta[name=robots]'),null);
assert.match(html,/私人原型與舊版溶解度站的紀錄不會自動移入此頁/);
assert.match(html,/並非私人頁面/);assert(!html.includes('私人試作版'));
for(const el of doc.querySelectorAll('[src],link[href]')){const href=el.getAttribute('src')||el.getAttribute('href');if(!href||/^https?:/.test(href))continue;assert(fs.existsSync(path.resolve(root,dir,href)),'local asset '+href);}
const css=read(dir+'style.css').toString();for(const [,href] of css.matchAll(/url\(['"]?([^)'" ]+)/g))assert(fs.existsSync(path.resolve(root,dir,href)),'CSS asset '+href);
for(const name of ['teacher-body-v3.png','wood-table.png','lab-room.png'])assert.equal(sha(read(dir+'assets/'+name)),sha(read('tools/specific-heat-desk/assets/'+name)),'canonical brand asset '+name);
const app=read(dir+'app.mjs').toString();assert.match(app,/baihong-solubility-lab-v1/);
for(const p of ['app.mjs','storage.mjs'])assert(!/localStorage\.clear|localStorage\.removeItem|bhcs-science-v2-solubility|bhcs-researcher-screen:/.test(read(dir+p).toString()),'new runtime must not touch old keys');
assert(!walk(dir).some(p=>/\.openai|qa-|fixtures|node_modules/.test(p)));
for(const p of ['tools/science/index.html','ziyuan.html','sitemap.xml','scripts/science/catalog.mjs'])assert(read(p).toString().includes('solubility-desk'),'public entry '+p);
console.log(`solubility integration PASS: ${m.files.length} accepted files, ${m.tests.length} original tests, ${protectedCount} untouched existing assets`);
