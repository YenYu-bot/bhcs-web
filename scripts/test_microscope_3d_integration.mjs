// Standalone boundary + nested-path HTTP contracts. No DOM/GPU/phone acceptance claim.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {legacy,firstBatch,standalonePublic} from './science/catalog.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=path.join(root,'tools/microscope-3d');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('scripts/microscope-3d-runtime.json'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
assert.equal(manifest.source_commit,'185c99467c03b40fb0bda04d0bfcfccb21914e07');
assert.equal(manifest.files.length,40);
assert.deepEqual(walk(runtime).map(p=>path.relative(runtime,p)).sort(),manifest.files.map(f=>f.path).sort(),'only approved runtime files, no QA/private artifacts');
for(const f of manifest.files){
 let b=fs.readFileSync(path.join(runtime,f.path));
 if(f.path==='index.html'){
  const s=b.toString(); assert.equal(s.split(manifest.index_metadata_addition).length,2);
  b=Buffer.from(s.replace(manifest.index_metadata_addition,''));
 }
 assert.equal(sha(b),f.sha256,`accepted runtime unchanged: ${f.path}`);
}
assert.equal(standalonePublic.filter(t=>t.file==='microscope-3d/').length,1);
assert.ok(!legacy.some(t=>t.file==='microscope-3d/'));
assert.ok(!firstBatch.includes('microscope-3d/'));
const index=read('tools/microscope-3d/index.html');
assert.doesNotMatch(index,/researcher-lab|science-events|assets\/site\.js|data-science-lab/);
for(const [file,href] of [['ziyuan.html','tools/microscope-3d/'],['tools/science/index.html','../microscope-3d/']]){
 const s=read(file); assert.equal(s.split(`href="${href}"`).length,2,`${file}: exactly one discovery link`);
 assert.ok(s.includes('3D顯微鏡操作與比較')); assert.ok(s.includes('microscope-lab.html'),'legacy discovery remains');
}
assert.equal((read('sitemap.xml').match(/<loc>https:\/\/www\.bhcs\.com\.tw\/tools\/microscope-3d\/<\/loc>/g)||[]).length,1);
assert.ok(fs.existsSync(path.join(runtime,'vendor/THREE-LICENSE.txt')));
assert.equal(walk(path.join(runtime,'fonts')).filter(p=>/OFL|LICENSE/.test(p)).length,2);
const refs=[];
for(const p of walk(runtime)){
 const ext=path.extname(p); if(!['.html','.css','.js','.svg'].includes(ext))continue;
 let text=fs.readFileSync(p,'utf8'); let found=[];
 if(ext==='.js')text=text.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
 if(['.html','.svg'].includes(ext))found.push(...[...text.matchAll(/(?:src|href)=["']([^"']+)/g)].map(m=>m[1]));
 if(ext==='.css')found.push(...[...text.matchAll(/url\(["']?([^\)"']+)/g)].map(m=>m[1]));
 if(ext==='.js'){
  found.push(...[...text.matchAll(/(?:from\s*|import\s*\()["']([^"']+)/g)].map(m=>m[1]));
  found.push(...[...text.matchAll(/["'](img\/[^"']+\.(?:png|webp|svg)(?:\?v=[a-f0-9]+)?)["']/g)].map(m=>m[1]));
 }
 for(const ref of found){
  if(/^(?:[a-z]+:|\/\/|#)/i.test(ref))continue;
  assert.ok(!ref.startsWith('/'),`must stay portable: ${ref}`);
  const u=new URL(ref,'http://localhost/'+path.relative(root,p));
  const target=path.resolve(root,decodeURIComponent(u.pathname.slice(1)));
  assert.ok(target.startsWith(runtime+path.sep),`runtime escape: ${ref}`);
  assert.ok(fs.statSync(target).isFile(),`missing ${ref}`);
  if(u.searchParams.has('v'))assert.equal(u.searchParams.get('v'),sha(fs.readFileSync(target)).slice(0,12),`cache hash ${ref}`);
  refs.push({url:u.pathname+u.search,target});
 }
}
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.woff':'font/woff','.txt':'text/plain'};
const server=http.createServer((req,res)=>{
 const p=path.resolve(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname.slice(1)));
 if(!p.startsWith(runtime+path.sep)&&p!==runtime){res.writeHead(404).end();return;}
 const file=p===runtime?path.join(p,'index.html'):p;
 if(!fs.existsSync(file)){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
 const base=`http://127.0.0.1:${server.address().port}`;
 const checks=[...manifest.files.map(f=>({url:'/tools/microscope-3d/'+f.path,target:path.join(runtime,f.path)})),...refs];
 for(const {url,target} of checks){const r=await fetch(base+url);assert.equal(r.status,200,url);assert.equal(r.headers.get('content-type'),mime[path.extname(target)]||'application/octet-stream');assert.deepEqual(Buffer.from(await r.arrayBuffer()),fs.readFileSync(target));}
 console.log(`PASS standalone integration: 40 frozen files, isolated discovery, licenses, sitemap, ${refs.length} relative references/cache keys; ${checks.length} nested HTTP responses/MIME (local server only)`);
}finally{await new Promise(resolve=>server.close(resolve));}
