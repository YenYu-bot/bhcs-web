import assert from 'node:assert/strict';
// Reverse only the explicitly approved public metadata/navigation/copy changes.
// Original runtime manifests and source hashes remain the authority.
export function beforePublicDeskEntry(bytes,id){
 let html=bytes.toString();
 if(id==='solubility'){
  // Reverse these two exact public-listing copy edits only; retain the original manifest.
  const copyChanges=[
  [
    "<p class=\"local-note\">這是尚未列入教材目錄的獨立試用頁，並非私人頁面。私人原型與舊版溶解度站的紀錄不會自動移入此頁。</p>",
    "<p class=\"local-note\">這是教材目錄中的獨立實驗桌。私人原型與舊版溶解度站的紀錄不會自動移入此頁。</p>"
  ],
  [
    "<span>教學溶質 A · 獨立試用版</span>",
    "<span>教學溶質 A · 引導實驗桌</span>"
  ]
];
  for(const [before,after] of copyChanges){
   assert.equal(html.split(after).length-1,1,'exact approved solubility public copy');
   assert(!html.includes(before),'outdated solubility copy must not coexist');
   html=html.replace(after,before);
  }
 }
 const nav=`<!-- completed-desk-nav:start --><nav aria-label="同單元實驗版本" style="padding:12px 16px;display:flex;flex-wrap:wrap;gap:12px"><a href="../science/${id}.html">舊版自由探究</a><a href="../science/">自然實驗總覽</a><a href="../../ziyuan.html#res-science">全部學習資源</a></nav><!-- completed-desk-nav:end -->`;
 assert.equal(html.split(nav).length-1,1,'exact approved public navigation');
 html=html.replace(nav,'');
 assert(!html.includes('name="robots"'),'listed desk has no robots exclusion');
 assert.equal(html.split('<title>').length-1,1);
 const anchor=id==='solubility'?'\n<link rel="canonical"':'<title>';
 assert.equal(html.split(anchor).length-1,1);
 return Buffer.from(html.replace(anchor,'<meta name="robots" content="noindex,nofollow">'+anchor));
}

import fs from 'node:fs';
const discovery=JSON.parse(fs.readFileSync(new URL('./public-desk-entry-changes.json',import.meta.url),'utf8'));
assert.equal(discovery.baseline_commit,'10598e94b905bdc81c2087cd791ec28c909cce1c');
assert.deepEqual(discovery.changes.map(c=>c.path),['scripts/build_science.mjs','scripts/science/catalog.mjs','ziyuan.html']);
const primaryDiscovery=JSON.parse(fs.readFileSync(new URL('./primary-lab-discovery-changes.json',import.meta.url),'utf8'));
assert.equal(primaryDiscovery.baseline_commit,'7862f2fccb93a44dd4ebe4f0128338ca258af42f');
assert.deepEqual(primaryDiscovery.changes.map(c=>c.path),['scripts/build_science.mjs','scripts/science/catalog.mjs','ziyuan.html']);
const pressureDiscovery=JSON.parse(fs.readFileSync(new URL('./pressure-only-discovery-changes.json',import.meta.url),'utf8'));
assert.equal(pressureDiscovery.baseline_commit,'a7328e398db012715431f52aa932dc58b525398c');
assert.deepEqual(pressureDiscovery.changes.map(c=>c.path),['scripts/science/catalog.mjs','ziyuan.html']);
const reflectionDiscovery=JSON.parse(fs.readFileSync(new URL('./reflection-refraction-discovery-changes.json',import.meta.url),'utf8'));
assert.equal(reflectionDiscovery.pressure_catalog_source_commit,pressureDiscovery.baseline_commit);
assert.deepEqual(reflectionDiscovery.changes.map(c=>c.path),['scripts/science/catalog.mjs','ziyuan.html']);
for(const c of reflectionDiscovery.changes)assert.equal(c.before_blob,pressureDiscovery.changes.find(p=>p.path===c.path).after_blob);
// 2026-11-19: the seven older lab desks are replaced by their tools/lab desks (old URLs redirect).
const retiredDiscovery=JSON.parse(fs.readFileSync(new URL('./retired-desk-discovery-changes.json',import.meta.url),'utf8'));
assert.deepEqual(retiredDiscovery.changes.map(c=>c.path),['scripts/science/catalog.mjs','ziyuan.html']);
// 2026-11-20: the friction and efficiency desk is replaced by tools/lab/friction-efficiency (old URL redirects).
const frictionDiscovery=JSON.parse(fs.readFileSync(new URL('./friction-desk-discovery-changes.json',import.meta.url),'utf8'));
assert.deepEqual(frictionDiscovery.changes.map(c=>c.path),['scripts/science/catalog.mjs','ziyuan.html']);
for(const c of frictionDiscovery.changes)assert.equal(c.before_blob,retiredDiscovery.changes.find(p=>p.path===c.path).after_blob);
// 2026-11-20: wave-sound, electromagnetism, energy and electrostatics lab desks become primary.
const physicsDiscovery=JSON.parse(fs.readFileSync(new URL('./lab-physics-discovery-changes.json',import.meta.url),'utf8'));
assert.deepEqual(physicsDiscovery.changes.map(c=>c.path),['scripts/science/catalog.mjs','ziyuan.html']);
for(const c of physicsDiscovery.changes)assert.equal(c.before_blob,frictionDiscovery.changes.find(p=>p.path===c.path).after_blob);
const LabChemBioDiscovery=JSON.parse(fs.readFileSync(new URL('./lab-chem-bio-discovery-changes.json',import.meta.url),'utf8'));
assert.deepEqual(LabChemBioDiscovery.changes.map(c=>c.path),['scripts/science/catalog.mjs','ziyuan.html']);
for(const c of LabChemBioDiscovery.changes)assert.equal(c.before_blob,physicsDiscovery.changes.find(p=>p.path===c.path).after_blob);
const LabEarthDiscovery=JSON.parse(fs.readFileSync(new URL('./lab-earth-discovery-changes.json',import.meta.url),'utf8'));
assert.deepEqual(LabEarthDiscovery.changes.map(c=>c.path),['scripts/science/catalog.mjs','ziyuan.html']);
for(const c of LabEarthDiscovery.changes)assert.equal(c.before_blob,LabChemBioDiscovery.changes.find(p=>p.path===c.path).after_blob);
const LabOldRemovalDiscovery=JSON.parse(fs.readFileSync(new URL('./lab-old-removal-discovery-changes.json',import.meta.url),'utf8'));
assert.deepEqual(LabOldRemovalDiscovery.changes.map(c=>c.path),['scripts/science/catalog.mjs','ziyuan.html']);
for(const c of LabOldRemovalDiscovery.changes)assert.equal(c.before_blob,LabEarthDiscovery.changes.find(p=>p.path===c.path).after_blob);
const LabRoundPhysicsDiscovery=JSON.parse(fs.readFileSync(new URL('./lab-round2-physics-discovery-changes.json',import.meta.url),'utf8'));
assert.deepEqual(LabRoundPhysicsDiscovery.changes.map(c=>c.path),['scripts/science/catalog.mjs','ziyuan.html']);
for(const c of LabRoundPhysicsDiscovery.changes)assert.equal(c.before_blob,LabOldRemovalDiscovery.changes.find(p=>p.path===c.path).after_blob);
const LabRoundBioEarthDiscovery=JSON.parse(fs.readFileSync(new URL('./lab-round2-bio-earth-discovery-changes.json',import.meta.url),'utf8'));
assert.deepEqual(LabRoundBioEarthDiscovery.changes.map(c=>c.path),['scripts/science/catalog.mjs','ziyuan.html']);
for(const c of LabRoundBioEarthDiscovery.changes)assert.equal(c.before_blob,LabRoundPhysicsDiscovery.changes.find(p=>p.path===c.path).after_blob);
const LabOldStationsRemovalDiscovery=JSON.parse(fs.readFileSync(new URL('./lab-old-stations-removal-discovery-changes.json',import.meta.url),'utf8'));
assert.deepEqual(LabOldStationsRemovalDiscovery.changes.map(c=>c.path),['scripts/science/catalog.mjs','ziyuan.html']);
for(const c of LabOldStationsRemovalDiscovery.changes)assert.equal(c.before_blob,LabRoundBioEarthDiscovery.changes.find(p=>p.path===c.path).after_blob);
export function publicDeskDiscoveryReach(file,from){
 const change=discovery.changes.find(c=>c.path===file&&c.before_blob===from);
 let at=change?change.after_blob:from;
 // The reviewed vocabulary listing is the only additional discovery change.
 // Preserve the original science manifest and allow exactly this resource-page blob.
 if(file==='ziyuan.html'&&at==='71145130e4a5bb9a66d7e7031e572c1c3d38c27a')at='71137eaf82ac74b8012069073e77063cb74a9e21';
 const primary=primaryDiscovery.changes.find(c=>c.path===file&&c.before_blob===at);
 if(primary)at=primary.after_blob;
 const pressure=pressureDiscovery.changes.find(c=>c.path===file&&c.before_blob===at);
 if(pressure)at=pressure.after_blob;
 const reflection=reflectionDiscovery.changes.find(c=>c.path===file&&c.before_blob===at);
 if(reflection)at=reflection.after_blob;
 // PR #259 adds only the two CAP listings and their derived counters. Keep the exact resource-page check.
 if(file==='ziyuan.html'&&at==='24b767f85e54aeab737395236cd9f0c77a20167d')at='db1f75ed640d179e915d95bf268dbca3bbc83e10';
 const retired=retiredDiscovery.changes.find(c=>c.path===file&&c.before_blob===at);
 if(retired)at=retired.after_blob;
 const friction=frictionDiscovery.changes.find(c=>c.path===file&&c.before_blob===at);
 if(friction)at=friction.after_blob;
 const physics=physicsDiscovery.changes.find(c=>c.path===file&&c.before_blob===at);
 if(physics)at=physics.after_blob;
 const step_LabChemBioDiscovery=LabChemBioDiscovery.changes.find(c=>c.path===file&&c.before_blob===at);
 if(step_LabChemBioDiscovery)at=step_LabChemBioDiscovery.after_blob;
 const step_LabEarthDiscovery=LabEarthDiscovery.changes.find(c=>c.path===file&&c.before_blob===at);
 if(step_LabEarthDiscovery)at=step_LabEarthDiscovery.after_blob;
 const step_LabOldRemovalDiscovery=LabOldRemovalDiscovery.changes.find(c=>c.path===file&&c.before_blob===at);
 if(step_LabOldRemovalDiscovery)at=step_LabOldRemovalDiscovery.after_blob;
 const step_LabRoundPhysicsDiscovery=LabRoundPhysicsDiscovery.changes.find(c=>c.path===file&&c.before_blob===at);
 if(step_LabRoundPhysicsDiscovery)at=step_LabRoundPhysicsDiscovery.after_blob;
 const step_LabRoundBioEarthDiscovery=LabRoundBioEarthDiscovery.changes.find(c=>c.path===file&&c.before_blob===at);
 if(step_LabRoundBioEarthDiscovery)at=step_LabRoundBioEarthDiscovery.after_blob;
 const step_LabOldStationsRemovalDiscovery=LabOldStationsRemovalDiscovery.changes.find(c=>c.path===file&&c.before_blob===at);
 if(step_LabOldStationsRemovalDiscovery)at=step_LabOldStationsRemovalDiscovery.after_blob;
 return at;
}
