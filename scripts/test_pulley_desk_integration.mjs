// Frozen source transfer, discovery and local HTTP boundaries; not browser/device QA.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {legacy,firstBatch,standalonePublic} from './science/catalog.mjs';
import {ciJobs} from './ci_workflow_test_support.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=path.join(root,'tools/pulley-desk');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const manifest=JSON.parse(read('scripts/pulley-desk-runtime.json'));
// Retain the rejected repair inventory as history, never as a runtime exemption.
const repair=JSON.parse(read('scripts/pulley-desk-runtime-repair.json'));
assert.equal(sha(read('scripts/pulley-desk-runtime-repair.json')),'5bb81a530ad2536a5e1e44a0d5c36bb437f836214c3bd20de35d6e0aeaa19635','explicit historical repair inventory cannot drift');
assert.equal(repair.status,'reverted; accepted runtime restored');
assert.deepEqual(repair.active_changes,[],'no runtime exception remains active');
assert.equal(repair.accepted_baseline_commit,manifest.source_commit);
assert.equal(sha(read('scripts/pulley-desk-runtime.json')),repair.accepted_public_inventory_sha256);
assert.deepEqual(repair.historical_changes.map(f=>f.path),['app.mjs']);
assert.deepEqual(walk(path.join(root,'scripts/pulley-desk/accepted-release-baseline')).map(p=>path.basename(p)).sort(),['app.mjs']);
assert.equal(sha(read(repair.historical_changes[0].accepted_copy)),repair.restored_app_sha256);
assert.equal(sha(read('tools/pulley-desk/app.mjs')),repair.restored_app_sha256,'actual runtime is the accepted app, not the rejected candidate');
const canonical='<link rel="canonical" href="https://www.bhcs.com.tw/tools/pulley-desk/">';
assert.equal(manifest.source_commit,'be5ec67aa6ece6e47d8649c27c1286825959b77f');
assert.equal(sha(fs.readFileSync(path.join(root,'docs/pulley-desk-spec-v1.0.md'))),'611edcef72df090cb0fc1e2337b20c507d0006c106d46fa58bebed1f43e71bd6','original specification stays unchanged');
assert.equal(manifest.baseline_commit,'17f95d50295c9c0ad634e9f71d8cf4bdceaea8d0');
const robots='<meta name="robots" content="noindex,nofollow">';
const robotsAnchor='<meta name="color-scheme" content="light">';
assert.equal(manifest.index_metadata_added,canonical);
assert.equal(manifest.index_metadata_removed,robots);
assert.equal(manifest.index_metadata_removed_after,robotsAnchor);
assert.equal(sha(JSON.stringify(manifest.ported_tests)),'1e31a08de20bc6de67f077c0e20f0ed5211688d338bc44bb488d7605b69288a7','pinned ported_tests inventory');
assert.equal(sha(JSON.stringify(manifest.protected_files)),'8b5d80b6e48c01431aa32d402de295d66c515e294d14893e2d083cee449883b7','pinned protected_files inventory');
assert.equal(manifest.files.length,10);
assert.equal(sha(JSON.stringify(manifest.files)),'7e98e5d80263f0eb5036b9aba46d43a2e1671d9888f5c045e312d385441760ff','original accepted inventory cannot be silently re-pinned');
assert.deepEqual(walk(runtime).map(p=>path.relative(runtime,p)).sort(),manifest.files.map(f=>f.path).sort(),'exact runtime only: no Site identity, QA artifacts or private files');
for(const f of manifest.files){
 let b=fs.readFileSync(path.join(runtime,f.path));
 if(f.path==='index.html'){
  const s=b.toString();assert.equal(s.split(canonical).length,2,'one metadata insertion');
  assert.ok(s.includes(canonical+'<link rel="stylesheet"'),'canonical inserted only before original stylesheet');
  assert.equal(s.split(robotsAnchor).length,2,'one original metadata anchor');
  assert.doesNotMatch(s,/<meta name="robots"/,'only the exact prototype robots tag is removed');
  b=Buffer.from(s.replace(canonical,'').replace(robotsAnchor,robotsAnchor+robots));
 }
 assert.equal(b.length,f.bytes,`source byte count ${f.path}`);
 assert.equal(sha(b),f.sha256,`frozen accepted source ${f.path}`);
}
const image=fs.readFileSync(path.join(runtime,'assets/teacher-body-v3.png'));
const provenance=JSON.parse(read('tools/pulley-desk/assets/teacher-body-v3.provenance.json'));
const blob=crypto.createHash('sha1').update(Buffer.from(`blob ${image.length}\0`)).update(image).digest('hex');
assert.equal(blob,'0aaa1b8ff727b271b363e6ff5d3106dc098e38c1');
assert.equal(provenance.sourceGitBlob,blob);
assert.equal(provenance.sourceRepository,'YenYu-bot/bhcs-web');
assert.equal(provenance.sourcePath,'tools/microscope-3d/img/teacher-body-v3.png');
assert.deepEqual([image.readUInt32BE(16),image.readUInt32BE(20)],[948,1659]);
// Canonical asset provenance is pinned; future independent microscope artwork updates are not forbidden.
assert.ok(fs.existsSync(path.join(root,provenance.sourcePath)),'canonical source path is retained');
const entries=standalonePublic.filter(t=>t.file==='pulley-desk/');
assert.equal(entries.length,1);
assert.equal(entries[0].subject,'理化');assert.equal(entries[0].grade,'國中');
assert.ok(!legacy.some(t=>t.file==='pulley-desk/'));
assert.ok(!firstBatch.includes('pulley-desk/'));
const index=read('tools/pulley-desk/index.html');
assert.doesNotMatch(index,/noindex|researcher-lab|science-events|assets\/site\.js|data-science-lab|<iframe/);
for(const [file,href] of [['ziyuan.html','tools/pulley-desk/'],['tools/science/index.html','../pulley-desk/']]){
 const s=read(file);assert.equal(s.split(`href="${href}"`).length,2,`${file}: unique new discovery link`);
 for(const keep of ['pulley-incline.html','lever-desk/','lever-torque.html','buoyancy-density-lab.html','buoyancy-lab/','microscope-3d/','lens-25d/'])assert.ok(s.includes(keep),`${file}: existing discovery ${keep}`);
}
assert.match(read('tools/science/index.html'),/59 項教材/);
assert.match(read('ziyuan.html'),/全部 59 項自然教材/);
assert.match(read('ziyuan.html'),/國中自然 · 互動教材<span class="count">58 項/);
assert.match(read('ziyuan.html'),/理化 <small>40 項/);
assert.match(read('ziyuan.html'),/目前共 243 項/);
assert.equal(standalonePublic.length,7);
assert.match(entries[0].description,/私人原型站紀錄不會自動移入官網/);
assert.equal((read('sitemap.xml').match(/<loc>https:\/\/www\.bhcs\.com\.tw\/tools\/pulley-desk\/<\/loc>/g)||[]).length,1);
const jobs=ciJobs(),station=jobs['science-stations'];
assert.match(station.text,/NODE_PATH: \/tmp\/bhcs-composition\/node_modules\n\s+run: node scripts\/check_pulley_desk_browser\.cjs/);
assert.match(station.text,/name: pulley-desk-review\n\s+path: pulley-desk-artifacts\/\n\s+retention-days: 14/);
for(const script of ['check_researcher_browser.cjs','check_microscope_3d_browser.cjs','check_lens_25d_browser.cjs','check_researcher_operations.cjs','check_buoyancy_lab_browser.cjs','check_lever_desk_browser.cjs','check_pulley_desk_browser.cjs']){
 assert.equal(station.text.split(`run: node scripts/${script}`).length,2,`exactly one additive browser step ${script}`);
}
assert.ok(station.text.indexOf('playwright install --with-deps chromium')<station.text.indexOf('run: node scripts/check_pulley_desk_browser.cjs'));
assert.deepEqual(jobs.gate.needs,['core','site','science-layout','science-stations','science-guided','math-browser','math-regression','math-diversity']);
assert.match(jobs.gate.text,/if: always\(\)/);
assert.ok(jobs.gate.text.includes('length == 8 and all(.[]; .result == "success")'),'unchanged fail-closed aggregate gate');
const commands=JSON.parse(read('scripts/package.json')).scripts;
assert.ok(commands.test.includes('npm run test:pulley-desk'));
assert.ok(commands['test:pulley-desk'].includes('node test_pulley_desk_integration.mjs'));
assert.ok(commands['test:pulley-desk'].includes('node --test pulley-desk/*.test.mjs'));
assert.ok(commands.test.includes('npm run test:lever-desk'));
assert.ok(commands.test.includes('npm run test:lens-25d'));
assert.ok(commands.test.includes('npm run test:buoyancy-lab'));
assert.ok(commands.test.includes('test_microscope_3d_integration.mjs'));
const refs=[],imports=new Map();
for(const p of walk(runtime)){
 const ext=path.extname(p);if(!['.html','.css','.mjs'].includes(ext))continue;
 const s=fs.readFileSync(p,'utf8');let found=[];
 if(ext==='.html'||ext==='.mjs')found.push(...[...s.matchAll(/(?:src|href)=["']([^"']+)/g)].map(m=>m[1]));
 if(ext==='.css')found.push(...[...s.matchAll(/url\(["']?([^\)"']+)/g)].map(m=>m[1]));
 if(ext==='.mjs'){
  const deps=[...s.matchAll(/(?:from\s*|import\s*\()["']([^"']+)/g)].map(m=>m[1]);
  imports.set(p,deps.map(ref=>path.resolve(path.dirname(p),ref)));found.push(...deps);
 }
 for(const ref of found){
  if(ref.startsWith('#'))continue;
  if(ref==='https://www.bhcs.com.tw/tools/pulley-desk/'&&p===path.join(runtime,'index.html'))continue;
  assert.ok(!/^(?:[a-z]+:|\/)/i.test(ref),`no remote or root-relative runtime reference: ${ref}`);
  const u=new URL(ref,'http://localhost/'+path.relative(root,p));
  let target=path.resolve(root,decodeURIComponent(u.pathname.slice(1)));
  if(target===runtime)target=path.join(runtime,'index.html');
  assert.ok(target.startsWith(runtime+path.sep),`namespace escape: ${ref}`);
  assert.ok(fs.statSync(target).isFile(),`missing ${ref}`);
  assert.equal(u.search,'','accepted prototype has no invented cache substitutions');
  refs.push({url:u.pathname,target});
 }
}
const active=new Set(),visit=p=>{if(active.has(p))return;active.add(p);for(const dep of imports.get(p)||[])visit(dep);};
visit(path.join(runtime,'app.mjs'));assert.equal(active.size,6);
for(const p of active)assert.doesNotMatch(fs.readFileSync(p,'utf8'),/sessionStorage|indexedDB|document\.cookie|fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|serviceWorker|import\s*\(/,`no backend/network or global storage migration: ${p}`);
const storage=read('tools/pulley-desk/storage.mjs');
assert.match(storage,/KEY='bhcs\.pulleyDesk\.v1'/);
assert.doesNotMatch(storage,/bhcs-science-v2-|removeItem|\.clear\s*\(/);
for(const f of manifest.protected_files)assert.equal(sha(fs.readFileSync(path.join(root,f.path))),f.sha256,`untouched existing runtime ${f.path}`);
// Reverse the complete, explicit path-only adaptation. This pins assertions, not just test names.
assert.equal(manifest.ported_tests.length,11);
for(const f of manifest.ported_tests){
 let original=read('scripts/pulley-desk/'+f.path);
 for(const [before,after] of [...f.replacements].reverse())original=original.split(after).join(before);
 assert.equal(sha(original),f.normalized_source_sha256||f.source_sha256,`original assertions unchanged after path-token normalization: ${f.source}`);
}
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json'};
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
 const checks=[{url:'/tools/pulley-desk/',target:path.join(runtime,'index.html')},...manifest.files.map(f=>({url:'/tools/pulley-desk/'+f.path,target:path.join(runtime,f.path)})),...refs];
 for(const {url,target} of checks){const r=await fetch(base+url);assert.equal(r.status,200,url);assert.equal(r.headers.get('content-type'),mime[path.extname(target)]);assert.deepEqual(Buffer.from(await r.arrayBuffer()),fs.readFileSync(target));}
 console.log(`PASS pulley integration: restored accepted 10-file source, exact reversible canonical/robots metadata, approved teacher provenance, isolated discovery, unchanged storage keys and 8-job gate, ${refs.length} relative references, ${checks.length} local HTTP/MIME responses (not production or browser QA)`);
}finally{await new Promise(resolve=>server.close(resolve));}
