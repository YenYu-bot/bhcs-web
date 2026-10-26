// Source-transfer, legacy isolation and local nested HTTP contracts, not browser/device QA.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {legacy,firstBatch,standalonePublic} from './science/catalog.mjs';
import {ciJobs} from './ci_workflow_test_support.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=path.join(root,'tools/lens-25d');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('scripts/lens-25d-runtime.json'));
const jobs=ciJobs();
assert.match(jobs['science-stations'].text,/NODE_PATH: \/tmp\/bhcs-composition\/node_modules\n\s+run: node scripts\/check_lens_25d_browser\.cjs/);
assert.match(jobs['science-stations'].text,/name: lens-25d-review\n\s+path: lens-25d-artifacts\/\n\s+retention-days: 14/);
assert.ok(jobs['gate'].needs.includes('science-stations'),'existing fail-closed CI Gate still covers browser job');
const commands=JSON.parse(read('scripts/package.json')).scripts;
assert.ok(commands.test.includes('npm run test:lens-25d'));
for(const name of ['five-case','five-ui','learning-summary','learning-ui']) assert.ok(commands['test:lens-25d'].includes(`node lens-25d/${name}.test.mjs`));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
assert.equal(manifest.source_commit,'05afe33bfd82d59a2b1da6d3f9618ecfb85e1556');
assert.equal(manifest.baseline_commit,'141f47d9db2ca86ebbb542ab7a77db1c01c79a3e');
assert.equal(manifest.files.length,12);
// This inventory is historical provenance, not a place to rebaseline changed runtime bytes.
assert.equal(sha(JSON.stringify(manifest.files)),'b9353b319707b647a4bf1675f021eec71571b6ddf5aa1a71c92d2016e9674611','original 12-file prototype inventory remains unchanged');
const revision=manifest.runtime_revision;
assert.equal(revision.reviewed_from_commit,'d1844605546a82738f02d8b2e3b5c71e6800503d');
assert.equal(revision.id,'settled-input-and-reset-confirmation-v1');
assert.deepEqual(revision.replacements.map(f=>f.path).sort(),['assets/five-case.js','assets/pilot.js']);
assert.deepEqual(revision.additions.map(f=>f.path),['assets/screen-settlement.js']);
assert.equal(revision.index_replacements.length,1);
const replacementByPath=new Map(revision.replacements.map(f=>[f.path,f]));
const runtimeFiles=[...manifest.files,...revision.additions];
assert.deepEqual(walk(runtime).map(p=>path.relative(runtime,p)).sort(),runtimeFiles.map(f=>f.path).sort(),'exact original files plus reviewed adapter; no Site identity, QA or private artifacts');
assert.equal(manifest.index_metadata_before,'<meta name="robots" content="noindex,nofollow">');
assert.equal(manifest.index_metadata_after,'<link rel="canonical" href="https://www.bhcs.com.tw/tools/lens-25d/">');
for(const f of runtimeFiles){
 let b=fs.readFileSync(path.join(runtime,f.path));
 if(f.path==='index.html'){
  let s=b.toString();
  assert.equal(s.split(manifest.index_metadata_after).length,2,'one canonical metadata substitution');
  assert.ok(!s.includes(manifest.index_metadata_before));
  const cache=revision.index_replacements[0];
  assert.equal(cache.before,'src="./assets/pilot.js"');
  assert.equal(cache.after,`src="./assets/pilot.js?v=${sha(fs.readFileSync(path.join(runtime,'assets/pilot.js'))).slice(0,12)}"`);
  assert.equal(s.split(cache.after).length,2,'one reviewed pilot cache substitution');
  assert.ok(!s.includes(cache.before));
  s=s.replace(cache.after,cache.before);
  b=Buffer.from(s.replace(manifest.index_metadata_after,manifest.index_metadata_before));
 }
 const expected=replacementByPath.get(f.path)||f;
 assert.equal(b.length,expected.bytes,`reviewed byte count: ${f.path}`);
 assert.equal(sha(b),expected.sha256,`original source or explicit reviewed runtime exception: ${f.path}`);
}
assert.match(read('tools/science/optics-guided.html'),/<meta[^>]+name="robots"[^>]+content="noindex/);
const entries=standalonePublic.filter(t=>t.file==='lens-25d/');
assert.equal(entries.length,1);
assert.deepEqual([entries[0].title,entries[0].subject,entries[0].grade,entries[0].unit],['凸透鏡五種成像實驗','理化','國中','光與成像']);
assert.ok(!legacy.some(t=>t.file==='lens-25d/'));
assert.ok(!firstBatch.includes('lens-25d/'));
const index=read('tools/lens-25d/index.html');
assert.doesNotMatch(index,/noindex|researcher-lab|science-events|assets\/site\.js|data-science-lab|<iframe|<form\b/);
assert.match(index,/這次觀察只保留在此頁面，重新整理會重新開始/);
assert.match(index,/每張卡顯示該條件最新紀錄；所有先前證據保留在下方歷次紀錄/);
for(const [file,href] of [['ziyuan.html','tools/lens-25d/'],['tools/science/index.html','../lens-25d/']]){
 const s=read(file);assert.equal(s.split(`href="${href}"`).length,2,`${file}: exactly one discovery link`);
 assert.ok(s.includes('凸透鏡五種成像實驗'));assert.ok(s.includes('optics.html'),'legacy discovery remains');assert.ok(s.includes('microscope-3d/'));
}
assert.equal((read('sitemap.xml').match(/<loc>https:\/\/www\.bhcs\.com\.tw\/tools\/lens-25d\/<\/loc>/g)||[]).length,1);
assert.ok(!read('sitemap.xml').includes('/tools/science/optics-guided.html'));
const refs=[],imports=new Map();
for(const p of walk(runtime)){
 const ext=path.extname(p),s=fs.readFileSync(p,'utf8');let found=[];
 if(ext==='.html')found=[...[...s.matchAll(/(?:src|href)=["']([^"']+)/g)].map(m=>m[1])];
 if(ext==='.css')found=[...s.matchAll(/url\(["']?([^\)"']+)/g)].map(m=>m[1]);
 if(ext==='.js'){found=[...s.matchAll(/(?:from\s*|import\s*\()["']([^"']+)/g)].map(m=>m[1]);imports.set(p,[]);}
 for(const ref of found){
  if(ref.startsWith('#'))continue;
  if(ref==='https://www.bhcs.com.tw/tools/lens-25d/'&&p===path.join(runtime,'index.html'))continue;
  assert.ok(!/^(?:[a-z]+:|\/)/i.test(ref),`no remote or root-relative runtime reference: ${ref}`);
  const u=new URL(ref,'http://localhost/'+path.relative(root,p));
  const target=path.resolve(root,decodeURIComponent(u.pathname.slice(1)));
  assert.ok(target.startsWith(runtime+path.sep),`namespace escape: ${ref}`);
  assert.ok(fs.statSync(target).isFile(),`missing ${ref}`);
  if(u.searchParams.has('v'))assert.equal(u.searchParams.get('v'),sha(fs.readFileSync(target)).slice(0,12),`cache hash ${ref}`);
  refs.push({url:u.pathname+u.search,target});if(ext==='.js')imports.get(p).push(target);
 }
}
// Frozen persist.js stays in the transfer, but must never enter the active import graph.
const active=new Set(),visit=p=>{if(active.has(p))return;active.add(p);for(const dep of imports.get(p)||[])visit(dep);};
visit(path.join(runtime,'assets/pilot.js'));
assert.equal(active.size,10);
assert.ok(!active.has(path.join(runtime,'assets/optics-guided/persist.js')));
for(const p of active)assert.doesNotMatch(fs.readFileSync(p,'utf8'),/localStorage|sessionStorage|indexedDB|document\.cookie|fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|serviceWorker|import\s*\(/,`no persistence/backend injection: ${p}`);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const server=http.createServer((req,res)=>{
 const p=path.resolve(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname.slice(1)));
 if(!p.startsWith(runtime+path.sep)&&p!==runtime){res.writeHead(404).end();return;}
 const file=p===runtime?path.join(p,'index.html'):p;
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',mime[path.extname(file)]);res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
 const base=`http://127.0.0.1:${server.address().port}`;
 const checks=[{url:'/tools/lens-25d/',target:path.join(runtime,'index.html')},...runtimeFiles.map(f=>({url:'/tools/lens-25d/'+f.path,target:path.join(runtime,f.path)})),...refs];
 for(const {url,target} of checks){const r=await fetch(base+url);assert.equal(r.status,200,url);assert.equal(r.headers.get('content-type'),mime[path.extname(target)]);assert.deepEqual(Buffer.from(await r.arrayBuffer()),fs.readFileSync(target));}
 console.log(`PASS lens integration: original 12-file provenance retained, 2 reviewed replacements + 1 adapter, reversible index metadata/cache exceptions, isolated discovery, 10 active modules without persistence, ${refs.length} relative references/cache keys, ${checks.length} local nested HTTP/MIME responses (not deployment or browser QA)`);
}finally{await new Promise(resolve=>server.close(resolve));}
