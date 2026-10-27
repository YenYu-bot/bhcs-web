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
const runtime=path.join(root,'tools/buoyancy-lab');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const manifest=JSON.parse(read('scripts/buoyancy-lab-runtime.json'));
const canonical='<link rel="canonical" href="https://www.bhcs.com.tw/tools/buoyancy-lab/">';
assert.equal(manifest.source_commit,'e53f18b5b3e6d2356574e8db8a9c1947fce6e4ff');
assert.equal(manifest.baseline_commit,'01c3730aa0c332481eb6b68fdcaea5323e5e6533');
assert.equal(manifest.index_metadata_added,canonical);
assert.equal(manifest.files.length,10);
assert.equal(sha(JSON.stringify(manifest.files)),'4394a30cc53f31e6e47e1bb395d2572e3cfd7b4344f6305d1068d735da4278a9','original accepted inventory cannot be silently re-pinned');
assert.deepEqual(walk(runtime).map(p=>path.relative(runtime,p)).sort(),manifest.files.map(f=>f.path).sort(),'exact runtime only: no Site identity, QA artifacts or private files');
for(const f of manifest.files){
 let b=fs.readFileSync(path.join(runtime,f.path));
 if(f.path==='index.html'){
  const s=b.toString();assert.equal(s.split(canonical).length,2,'one metadata insertion');
  assert.ok(s.includes(canonical+'</head>'),'canonical inserted only before original closing head');
  b=Buffer.from(s.replace(canonical,''));
 }
 assert.equal(b.length,f.bytes,`source byte count ${f.path}`);
 assert.equal(sha(b),f.sha256,`frozen accepted source ${f.path}`);
}
const image=fs.readFileSync(path.join(runtime,'img/teacher-body-v3.png'));
const provenance=JSON.parse(read('tools/buoyancy-lab/img/teacher-body-v3.provenance.json'));
const blob=crypto.createHash('sha1').update(Buffer.from(`blob ${image.length}\0`)).update(image).digest('hex');
assert.equal(blob,'0aaa1b8ff727b271b363e6ff5d3106dc098e38c1');
assert.equal(provenance.sourceGitBlob,blob);
assert.equal(provenance.sourceRepository,'YenYu-bot/bhcs-web');
assert.equal(provenance.sourcePath,'tools/microscope-3d/img/teacher-body-v3.png');
assert.deepEqual([image.readUInt32BE(16),image.readUInt32BE(20)],[948,1659]);
// Canonical asset provenance is pinned; future independent microscope artwork updates are not forbidden.
assert.ok(fs.existsSync(path.join(root,provenance.sourcePath)),'canonical source path is retained');
const entries=standalonePublic.filter(t=>t.file==='buoyancy-lab/');
assert.equal(entries.length,1);
assert.equal(entries[0].subject,'理化');assert.equal(entries[0].grade,'國中');
assert.ok(!legacy.some(t=>t.file==='buoyancy-lab/'));
assert.ok(!firstBatch.includes('buoyancy-lab/'));
const index=read('tools/buoyancy-lab/index.html');
assert.doesNotMatch(index,/noindex|researcher-lab|science-events|assets\/site\.js|data-science-lab|<iframe/);
for(const [file,href] of [['ziyuan.html','tools/buoyancy-lab/'],['tools/science/index.html','../buoyancy-lab/']]){
 const s=read(file);assert.equal(s.split(`href="${href}"`).length,2,`${file}: unique new discovery link`);
 for(const keep of ['buoyancy-density-lab.html','microscope-3d/','lens-25d/'])assert.ok(s.includes(keep),`${file}: existing discovery ${keep}`);
}
assert.equal((read('sitemap.xml').match(/<loc>https:\/\/www\.bhcs\.com\.tw\/tools\/buoyancy-lab\/<\/loc>/g)||[]).length,1);
assert.match(read('tools/science/buoyancy-guided.html'),/<meta[^>]+name="robots"[^>]+content="noindex/);
assert.ok(!read('sitemap.xml').includes('/tools/science/buoyancy-guided.html'));
const jobs=ciJobs(),station=jobs['science-stations'];
assert.match(station.text,/NODE_PATH: \/tmp\/bhcs-composition\/node_modules\n\s+run: node scripts\/check_buoyancy_lab_browser\.cjs/);
assert.match(station.text,/name: buoyancy-lab-review\n\s+path: buoyancy-lab-artifacts\/\n\s+retention-days: 14/);
for(const script of ['check_researcher_browser.cjs','check_microscope_3d_browser.cjs','check_lens_25d_browser.cjs','check_researcher_operations.cjs','check_buoyancy_lab_browser.cjs']){
 assert.equal(station.text.split(`run: node scripts/${script}`).length,2,`exactly one additive browser step ${script}`);
}
assert.ok(station.text.indexOf('playwright install --with-deps chromium')<station.text.indexOf('run: node scripts/check_buoyancy_lab_browser.cjs'));
assert.deepEqual(jobs.gate.needs,['core','site','science-layout','science-stations','science-guided','math-browser','math-regression','math-diversity']);
assert.match(jobs.gate.text,/if: always\(\)/);
assert.ok(jobs.gate.text.includes('length == 8 and all(.[]; .result == "success")'),'unchanged fail-closed aggregate gate');
const commands=JSON.parse(read('scripts/package.json')).scripts;
assert.ok(commands.test.includes('npm run test:buoyancy-lab'));
assert.ok(commands['test:buoyancy-lab'].includes('node test_buoyancy_lab_integration.mjs'));
assert.ok(commands['test:buoyancy-lab'].includes('node --test buoyancy-lab/*.test.mjs'));
assert.ok(commands.test.includes('npm run test:lens-25d'));
for(const script of ['test_microscope_3d_integration.mjs','test_buoyancy_guided_model.mjs','test_buoyancy_guided_persist.mjs','test_buoyancy_guided_site.mjs'])assert.ok(commands.test.includes(script));
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
  if(ref==='https://www.bhcs.com.tw/tools/buoyancy-lab/'&&p===path.join(runtime,'index.html'))continue;
  assert.ok(!/^(?:[a-z]+:|\/)/i.test(ref),`no remote or root-relative runtime reference: ${ref}`);
  const u=new URL(ref,'http://localhost/'+path.relative(root,p)),target=path.resolve(root,decodeURIComponent(u.pathname.slice(1)));
  assert.ok(target.startsWith(runtime+path.sep),`namespace escape: ${ref}`);
  assert.ok(fs.statSync(target).isFile(),`missing ${ref}`);
  assert.equal(u.search,'','accepted prototype has no invented cache substitutions');
  refs.push({url:u.pathname,target});
 }
}
const active=new Set(),visit=p=>{if(active.has(p))return;active.add(p);for(const dep of imports.get(p)||[])visit(dep);};
visit(path.join(runtime,'app.mjs'));assert.equal(active.size,6);
for(const p of active)assert.doesNotMatch(fs.readFileSync(p,'utf8'),/sessionStorage|indexedDB|document\.cookie|fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|serviceWorker|import\s*\(/,`no backend/network or global storage migration: ${p}`);
const app=read('tools/buoyancy-lab/app.mjs');
assert.match(app,/const KEY='yu-buoyancy-prototype-v1\.2-g10', LEGACY_KEY='yu-buoyancy-prototype-v1\.1'/);
assert.deepEqual([...app.matchAll(/localStorage\.(setItem|removeItem|clear)\s*\(\s*([^,)]+)/g)].map(m=>[m[1],m[2]]),[['setItem','KEY'],['setItem','KEY']],'only explicit current-key writes; never legacy or global clearing');
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
 const checks=[{url:'/tools/buoyancy-lab/',target:path.join(runtime,'index.html')},...manifest.files.map(f=>({url:'/tools/buoyancy-lab/'+f.path,target:path.join(runtime,f.path)})),...refs];
 for(const {url,target} of checks){const r=await fetch(base+url);assert.equal(r.status,200,url);assert.equal(r.headers.get('content-type'),mime[path.extname(target)]);assert.deepEqual(Buffer.from(await r.arrayBuffer()),fs.readFileSync(target));}
 console.log(`PASS buoyancy integration: frozen 10-file source, exact reversible canonical metadata, approved teacher provenance, isolated discovery, unchanged storage keys and 8-job gate, ${refs.length} relative references, ${checks.length} local HTTP/MIME responses (not production or browser QA)`);
}finally{await new Promise(resolve=>server.close(resolve));}
