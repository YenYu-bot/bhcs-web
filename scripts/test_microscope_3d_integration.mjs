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
// Explicit integration corrections; inverse patches must reproduce the accepted
// 185c994 bytes. Never replace the source manifest with hashes of edited files.
const reviewedRuntimePatches={
 'app.js': [
  {
    "before": "function pick(e){lab.scene.updateMatrixWorld(true);const rect=host.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(lab.scene.children,true).find(h=>h.object.isMesh&&!h.object.userData.artOnly&&visibleObject(h.object));let o=hit?.object;while(o){if(o.userData.action)return o.userData.action;o=o.parent;}return undefined;}\nfunction start(e){idle();if(drag||e.isPrimary===false||e.button!==0)return;const explicit=e.target.closest?.('[data-action]')?.dataset.action;const bodyHit=e.target.closest?.('[data-body-hit]');if(e.pointerType==='touch'&&!explicit&&!bodyHit)return;const action=explicit||pick(e);if(!action)return;activeAction=action.startsWith('objective:')?'turret':action;if(['turret','diaphragm','stereo-zoom','stereo-lamp'].includes(action)&&explicit)return;e.preventDefault();drag={id:e.pointerId,action,x:e.clientX,y:e.clientY,sceneWidth:host.getBoundingClientRect().width,coarse:state.coarse,fine:state.fine,sx:state.stageX,sy:state.stageY,objective:state.objective,mirror:state.mirrorAngle,stereoFocus:stereoState.focus,stereoX:stereoState.stageX,stereoY:stereoState.stageY,moved:false};try{host.setPointerCapture(e.pointerId);}catch{/* Touch may retain its implicit button capture; bubbling handlers still work. */}if(action==='coarse'&&state.objective===40)say('粗動已鎖定：高倍只能使用微動。');}\nfunction moving(e){if(!drag||drag.id!==e.pointerId)return;idle();const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved ||= Math.hypot(dx,dy)>POINTER.deadzone;if(drag.action==='mirror'){changeMirror(drag.mirror+focusDelta('fine',dy)*2);}else if(drag.action==='stereo-focus'){changeStereo('focus',drag.stereoFocus+focusDelta('coarse',dy));}else if(drag.action==='stereo-move'){const delta=slidePixels(dx,dy);stereoMove(stereoState,drag.stereoX+delta.x*.45*20/stereoState.total,drag.stereoY-delta.y*.45*20/stereoState.total);update('move');}else if(drag.action==='coarse'||drag.action==='fine'){changeFocus(drag.action,drag[drag.action]+focusDelta(drag.action,dy));}else if(drag.action==='slide'){const delta=compoundSlideDelta(dx,dy,drag.sceneWidth,drag.objective);move(state,drag.sx+delta.x,drag.sy+delta.y);if(state.stageX!==drag.sx||state.stageY!==drag.sy){activeAction='slide';markTried('slide');if(slideTimer)clearTimeout(slideTimer);slideTimer=flash('slideLines',180);}update();}}\nfunction end(e){if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;if(e.type==='pointerup'&&!d.moved){if(d.action==='diaphragm')changeAperture((state.apertureIndex+1)%5);else if(d.action==='stereo-zoom')changeStereo('power',stereoState.total===20?40:20);else if(d.action==='stereo-lamp')changeStereo('lamp',stereoState.lamp?0:75);else if(d.action==='turret')nextObjective();else if(d.action.startsWith('objective:'))objective(+d.action.split(':')[1]);}if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);schedule();}\nhost.addEventListener('pointerdown',start);host.addEventListener('pointermove',moving);host.addEventListener('pointerup',end);host.addEventListener('pointercancel',end);host.addEventListener('lostpointercapture',e=>{if(e.target===host&&drag?.id===e.pointerId&&!host.hasPointerCapture(e.pointerId)){drag=null;schedule();}});window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);\nfor(const [action,b]of Object.entries(spots)){b.addEventListener('keydown',e=>{if(action==='coarse'||action==='fine'){if(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].includes(e.key)){e.preventDefault();changeFocus(action,state[action]+(['ArrowUp','ArrowRight'].includes(e.key)?1:-1));}}if(action==='slide'){const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[e.key];if(d){e.preventDefault();move(state,state.stageX+d[0]*20,state.stageY+d[1]*20);markTried('slide');update();}}});if(action==='turret')b.addEventListener('click',()=>nextObjective());}\n",
    "after": "function pick(e){lab.scene.updateMatrixWorld(true);const rect=host.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(lab.scene.children,true).find(h=>h.object.isMesh&&!h.object.userData.artOnly&&visibleObject(h.object));let o=hit?.object;while(o){if(o.userData.action)return o.userData.action;o=o.parent;}return undefined;}\nlet redirectedTouchClick=null;\n// Chromium may retarget a touch on the glass to a nearby rail button. Only\n// disambiguate an out-of-button coordinate whose actual DOM hit is a body path;\n// the existing raycast still decides the frontmost physical action/occlusion.\nfunction start(e){idle();if(drag||e.isPrimary===false||e.button!==0)return;redirectedTouchClick=null;const control=e.target.closest?.('[data-action]');let explicit=control?.dataset.action,bodyHit=e.target.closest?.('[data-body-hit]');\n if(e.pointerType==='touch'&&control){const r=control.getBoundingClientRect(),inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;if(!inside){const actual=document.elementFromPoint(e.clientX,e.clientY)?.closest?.('[data-body-hit]');if(actual&&host.contains(actual)){explicit=undefined;bodyHit=actual;redirectedTouchClick={id:e.pointerId,control,expires:Infinity};}}}\n if(e.pointerType==='touch'&&!explicit&&!bodyHit)return;const action=explicit||pick(e);if(!action)return;activeAction=action.startsWith('objective:')?'turret':action;if(['turret','diaphragm','stereo-zoom','stereo-lamp'].includes(action)&&explicit)return;e.preventDefault();drag={id:e.pointerId,action,x:e.clientX,y:e.clientY,sceneWidth:host.getBoundingClientRect().width,coarse:state.coarse,fine:state.fine,sx:state.stageX,sy:state.stageY,objective:state.objective,mirror:state.mirrorAngle,stereoFocus:stereoState.focus,stereoX:stereoState.stageX,stereoY:stereoState.stageY,moved:false};try{host.setPointerCapture(e.pointerId);}catch{/* Touch may retain its implicit button capture; bubbling handlers still work. */}if(action==='coarse'&&state.objective===40)say('粗動已鎖定：高倍只能使用微動。');}\nfunction moving(e){if(!drag||drag.id!==e.pointerId)return;idle();const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved ||= Math.hypot(dx,dy)>POINTER.deadzone;if(drag.action==='mirror'){changeMirror(drag.mirror+focusDelta('fine',dy)*2);}else if(drag.action==='stereo-focus'){changeStereo('focus',drag.stereoFocus+focusDelta('coarse',dy));}else if(drag.action==='stereo-move'){const delta=slidePixels(dx,dy);stereoMove(stereoState,drag.stereoX+delta.x*.45*20/stereoState.total,drag.stereoY-delta.y*.45*20/stereoState.total);update('move');}else if(drag.action==='coarse'||drag.action==='fine'){changeFocus(drag.action,drag[drag.action]+focusDelta(drag.action,dy));}else if(drag.action==='slide'){const delta=compoundSlideDelta(dx,dy,drag.sceneWidth,drag.objective);move(state,drag.sx+delta.x,drag.sy+delta.y);if(state.stageX!==drag.sx||state.stageY!==drag.sy){activeAction='slide';markTried('slide');if(slideTimer)clearTimeout(slideTimer);slideTimer=flash('slideLines',180);}update();}}\nfunction end(e){if(redirectedTouchClick?.id===e.pointerId)redirectedTouchClick.expires=performance.now()+750;if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;if(e.type==='pointerup'&&!d.moved){if(d.action==='diaphragm')changeAperture((state.apertureIndex+1)%5);else if(d.action==='stereo-zoom')changeStereo('power',stereoState.total===20?40:20);else if(d.action==='stereo-lamp')changeStereo('lamp',stereoState.lamp?0:75);else if(d.action==='turret')nextObjective();else if(d.action.startsWith('objective:'))objective(+d.action.split(':')[1]);}if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);schedule();}\n// Usually pointer capture sends click to the host. If capture was unavailable,\n// suppress only this sequence's compatibility click on the displaced control.\n// It expires 750ms after release/cancel/lost capture or at the next primary down.\nhost.addEventListener('click',e=>{if(redirectedTouchClick&&performance.now()>redirectedTouchClick.expires)redirectedTouchClick=null;if(redirectedTouchClick&&e.detail!==0&&e.target.closest?.('[data-action]')===redirectedTouchClick.control&&(e.pointerId===redirectedTouchClick.id||e.pointerId===undefined)){e.preventDefault();e.stopImmediatePropagation();redirectedTouchClick=null;}},true);\nhost.addEventListener('pointerdown',start);host.addEventListener('pointermove',moving);host.addEventListener('pointerup',end);host.addEventListener('pointercancel',end);host.addEventListener('lostpointercapture',e=>{if(redirectedTouchClick?.id===e.pointerId)redirectedTouchClick.expires=performance.now()+750;if(e.target===host&&drag?.id===e.pointerId&&!host.hasPointerCapture(e.pointerId)){drag=null;schedule();}});window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);\nfor(const [action,b]of Object.entries(spots)){b.addEventListener('keydown',e=>{if(action==='coarse'||action==='fine'){if(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].includes(e.key)){e.preventDefault();changeFocus(action,state[action]+(['ArrowUp','ArrowRight'].includes(e.key)?1:-1));}}if(action==='slide'){const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[e.key];if(d){e.preventDefault();move(state,state.stageX+d[0]*20,state.stageY+d[1]*20);markTried('slide');update();}}});if(action==='turret')b.addEventListener('click',()=>nextObjective());}\n"
  }
],
 'style.css': [{
  before:'.viewer{padding-bottom:0}.readings{top:300px;right:0;width:180px;height:65px}',
  after:'.viewer{padding-bottom:0}.readings{top:300px;right:4px;width:180px;height:65px}'
 }]
};
const replaceExactlyOnce=(s,from,to,label)=>{
 assert.equal(s.split(from).length,2,`${label}: exact reviewed patch occurs once`);
 return s.replace(from,to);
};
assert.ok(read('tools/microscope-3d/style.css').includes('.readings{top:calc(100vw - 88px);right:16px;width:160px;height:58px}'),'mobile note inset remains unchanged');
for(const f of manifest.files){
 let b=fs.readFileSync(path.join(runtime,f.path));
 if(f.path==='index.html'){
  let s=replaceExactlyOnce(b.toString(),manifest.index_metadata_addition,'','canonical metadata');
  for(const name of Object.keys(reviewedRuntimePatches)){
   const original=manifest.files.find(entry=>entry.path===name).sha256.slice(0,12);
   const current=sha(fs.readFileSync(path.join(runtime,name))).slice(0,12);
   s=replaceExactlyOnce(s,`${name}?v=${current}`,`${name}?v=${original}`,`${name} cache key`);
  }
  b=Buffer.from(s);
 }
 for(const patch of reviewedRuntimePatches[f.path]||[])b=Buffer.from(replaceExactlyOnce(b.toString(),patch.after,patch.before,f.path));
 assert.equal(sha(b),f.sha256,`accepted runtime unchanged after reversing explicit reviewed patches: ${f.path}`);
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
 console.log(`PASS standalone integration: 40 source-pinned files with explicit reviewed patches, isolated discovery, licenses, sitemap, ${refs.length} relative references/cache keys; ${checks.length} nested HTTP responses/MIME (local server only)`);
}finally{await new Promise(resolve=>server.close(resolve));}
