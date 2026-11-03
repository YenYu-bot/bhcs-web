// Source preservation and same-URL replacement contracts, not production/device certification.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {checkExistingFiles} from './protected-existing-files.mjs';
import {legacy, guidedPublic, standalonePublic, firstBatch} from './science/catalog.mjs';
import {batch2} from './science/batch2.mjs';
import {buildMarbleReplacement, buildMarbleDirectory, publicReactionDescriptor} from './build_marble_replacement.mjs';
import {ciJobs} from './ci_workflow_test_support.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const bytes=p=>fs.readFileSync(path.join(root,p));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const blob=b=>crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const occurrences=(text,part)=>text.split(part).length-1;
const manifestRaw=read('scripts/marble-acid-desk-runtime.json'),m=JSON.parse(manifestRaw);
assert.equal(sha(manifestRaw),'a62364691ec315742517d11233159ae66c2d3ba1bd3683b1885755edeaa015b1','accepted source, replacement boundary and reversible ports are pinned');
assert.equal(m.source_commit,'071894387020793ca010ff99ad361c7d6ed9396f');
assert.equal(m.baseline_commit,'77adcbba9a7473477c0b04c2f5a64bf9b94fa552');
assert.equal(m.current_integration_base,'98a61df53396ddca2c7bf8ba401a8fd5450a9cd0');
assert.equal(m.integration_base_provenance.original_integration_base,m.baseline_commit);
assert.equal(m.integration_base_provenance.current_integration_base,m.current_integration_base);
assert.equal(m.integration_mode,'replace-existing-public-url');
assert.equal(m.public_entry,'tools/science/reaction-rate.html');
assert.equal(m.module_directory,'tools/science/reaction-rate-desk');
assert.equal(m.canonical,'https://www.bhcs.com.tw/tools/science/reaction-rate.html');
assert.equal(m.files.length,17);assert.equal(m.files.reduce((n,f)=>n+f.bytes,0),6152213);
assert.deepEqual(m.unused_source_files_retained,['assets/teacher-body-v3.png','assets/teacher-body-v3.provenance.json']);
const runtime=path.join(root,m.module_directory),entry=read(m.public_entry);
assert(!fs.existsSync(path.join(runtime,'index.html')),'module directory must not become a second public lesson');
assert(!fs.existsSync(path.join(root,'tools/marble-acid-desk')),'discarded additive route must not be published');
const publishCandidates=execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).trim().split('\n');
assert(!publishCandidates.some(p=>/(?:^|\/)\.openai(?:\/|$)/.test(p)),'private hosting configuration must not enter this repository');
assert.deepEqual(walk(runtime).map(p=>path.relative(root,p)).sort(),[...m.files.filter(f=>f.path!=='index.html').map(f=>f.integrated_path),...m.integration_files.map(f=>f.path)].sort(),'exact runtime inventory, including unused accepted assets');
for(const pin of [m.accepted_entry,m.entry_replacements,m.ported_tests,m.builder,m.directory_variant,...m.integration_files]){
 const b=bytes(pin.path);assert.equal(b.length,pin.bytes,pin.path);assert.equal(sha(b),pin.sha256,pin.path);
}
// Keep the accepted 17-file baseline immutable; only these explicitly authorized repairs may reverse to it.
const repairRaw=read('scripts/marble-acid-desk-repair.json'),repair=JSON.parse(repairRaw);
assert.equal(sha(repairRaw),'81fac8943c2df22a53c4c2aad955b66d6bb2bd0fdd7b2f6545723fe40d34b97b','bounded Escape/mobile-text repair manifest is pinned separately');
assert.equal(repair.schema_version,1);assert.equal(repair.accepted_source_commit,m.source_commit);
assert.equal(repair.accepted_runtime_manifest_sha256,sha(manifestRaw));
assert.deepEqual(repair.files.map(f=>f.path),['app.mjs','style.css']);
for(const delta of repair.files){
 const source=m.files.find(f=>f.path===delta.path);assert(source);
 assert.equal(delta.before_bytes,source.bytes);assert.equal(delta.before_sha256,source.sha256);
 assert.notEqual(delta.after_sha256,delta.before_sha256);
 for(const r of delta.replacements){assert.equal(r.count,1);assert(r.before.length>0);assert.notEqual(r.before,r.after);}
}
function reverseAuthorizedRepair(value,file){
 const delta=repair.files.find(f=>f.path===file);if(!delta)return value;
 assert.equal(value.length,delta.after_bytes,'repaired size '+file);assert.equal(sha(value),delta.after_sha256,'exact authorized repair '+file);
 let original=value.toString();
 for(const {before,after,count}of [...delta.replacements].reverse()){
  assert.equal(occurrences(original,after),count,'unique reverse repair '+file);original=original.split(after).join(before);
 }
 assert.equal(Buffer.byteLength(original),delta.before_bytes);assert.equal(sha(original),delta.before_sha256,'accepted pre-repair source '+file);
 let rebuilt=original;
 for(const {before,after,count}of delta.replacements){assert.equal(occurrences(rebuilt,before),count,'unique forward repair '+file);rebuilt=rebuilt.split(before).join(after);}
 assert.equal(rebuilt,value.toString(),'repair is exactly reversible in both directions '+file);
 return Buffer.from(original);
}
assert.deepEqual(repair.added_tests.map(t=>[t.path,t.case_count]),[['scripts/marble-acid-desk/escape-repair.test.mjs',11],['scripts/marble-acid-desk/mobile-coach-layout.test.mjs',1]]);
for(const pin of repair.added_tests){assert.equal(bytes(pin.path).length,pin.bytes);assert.equal(sha(bytes(pin.path)),pin.sha256,'new regression test '+pin.path);}
const originalUITest=read('scripts/marble-acid-desk/marble-ui.test.mjs'),helperPrefix=originalUITest.slice(0,originalUITest.indexOf('\ntest('))+'\n';
const newEscape=repair.added_tests[0],escapePrefix='// Additional authorized cancellation regression tests; the original six marble UI cases remain unchanged in marble-ui.test.mjs.\n'+helperPrefix;
assert.equal(sha(helperPrefix),newEscape.helper_prefix_sha256);
assert.equal(newEscape.accepted_source_sha256,m.source_tests.find(t=>t.path==='marble-ui.test.mjs').source_sha256);
assert(read(newEscape.path).startsWith(escapePrefix));
assert.equal(sha(read(newEscape.path).slice(escapePrefix.length)),newEscape.appended_source_sha256,'new Escape tests contain only the original helpers and appended cases');
const newLayout=repair.added_tests[1];let layoutSource=read(newLayout.path);
for(const {from,to,count}of [...newLayout.replacements].reverse()){assert.equal(occurrences(layoutSource,to),count);layoutSource=layoutSource.split(to).join(from);}
assert.equal(sha(layoutSource),newLayout.source_sha256,'mobile CSS regression is a path-only port');
assert.deepEqual(repair.original_ported_tests_unchanged,{path:m.ported_tests.path,sha256:m.ported_tests.sha256,original_test_count:127,live_course_test_count:43,historical_fixture_test_count:84});
const replacements=JSON.parse(read(m.entry_replacements.path));assert.equal(replacements.length,13);
let restoredEntry=entry;
for(const {before,after} of [...replacements].reverse()){
 assert.equal(occurrences(restoredEntry,after),1,'unique reversible entry adaptation');
 restoredEntry=restoredEntry.replace(after,before);
}
assert.equal(restoredEntry,read(m.accepted_entry.path),'all accepted index bytes retained beneath explicit metadata/navigation/reference/backup-control changes');
for(const f of m.files){
 const b=reverseAuthorizedRepair(f.path==='index.html'?Buffer.from(restoredEntry):bytes(f.integrated_path),f.path);
 assert.equal(b.length,f.bytes,'source bytes '+f.path);assert.equal(sha(b),f.sha256,'accepted runtime '+f.path);
}
// The directory gets a narrowly derived script; all shared/lesson scripts stay unchanged.
const variant=m.directory_variant,sharedDirectorySource=read(variant.source_path),derivedDirectorySource=read(variant.path);
assert.equal(sha(sharedDirectorySource),variant.source_sha256);assert.equal(variant.count,1);
assert.equal(occurrences(sharedDirectorySource,variant.before),variant.count);
assert.equal(derivedDirectorySource,'// Generated directory-only copy from researcher-lab.js SHA256 '+variant.source_sha256+'\n'+sharedDirectorySource.replace(variant.before,variant.after));
const directoryRef='../../'+variant.path+'?v='+sha(derivedDirectorySource).slice(0,12);
const originalDirectoryRef='../../'+variant.source_path+'?v='+variant.source_sha256.slice(0,12);
assert.equal(occurrences(read('tools/science/index.html'),directoryRef),1);assert.equal(occurrences(read('tools/science/index.html'),originalDirectoryRef),0);
assert.deepEqual(walk(path.join(root,'tools')).filter(p=>p.endsWith('.html')&&fs.readFileSync(p,'utf8').includes('researcher-marble-directory.js')).map(p=>path.relative(root,p)),['tools/science/index.html'],'derived script is used only by the directory');
// Run the actual replacement builder in an isolated temporary tree, never mutating the checkout.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'marble-replacement-'));
try{
 for(const p of [m.accepted_entry.path,m.entry_replacements.path,'scripts/marble-acid-desk/public-course-spec.md']){
  fs.mkdirSync(path.dirname(path.join(temp,p)),{recursive:true});fs.copyFileSync(path.join(root,p),path.join(temp,p));
 }
 fs.mkdirSync(path.join(temp,'tools/science'),{recursive:true});fs.mkdirSync(path.join(temp,'docs'),{recursive:true});
 assert.equal(buildMarbleReplacement(temp),sha(entry));
 assert.equal(fs.readFileSync(path.join(temp,m.public_entry),'utf8'),entry,'builder exactly regenerates the live original URL');
 assert.equal(fs.readFileSync(path.join(temp,'docs/science-reaction-rate-spec.md'),'utf8'),read('scripts/marble-acid-desk/public-course-spec.md'));
 fs.mkdirSync(path.join(temp,'assets'),{recursive:true});
 fs.writeFileSync(path.join(temp,variant.source_path),sharedDirectorySource);
 fs.writeFileSync(path.join(temp,'tools/science/index.html'),read('tools/science/index.html').replace(directoryRef,originalDirectoryRef));
 buildMarbleDirectory(temp);
 assert.equal(fs.readFileSync(path.join(temp,variant.path),'utf8'),derivedDirectorySource,'actual builder reproduces exact directory-only derivative');
 assert.equal(fs.readFileSync(path.join(temp,'tools/science/index.html'),'utf8'),read('tools/science/index.html'),'directory builder changes only the pinned script reference');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
const builder=read('scripts/build_science.mjs');
assert(builder.indexOf('buildMarbleReplacement(root);')>builder.indexOf('enhanceLessons(root,firstBatch,batch2);'),'replacement runs after legacy generation and enhancement');

const ports=JSON.parse(read(m.ported_tests.path));assert.equal(ports.source_commit,m.source_commit);
assert.equal(ports.total_tests,127);assert.equal(ports.files.length,16);assert.equal(m.source_tests.length,16);
assert.deepEqual(ports.groups,[{scope:'integrated-marble-course',test_files:4,test_count:43},{scope:'historical-fixture-only',test_files:4,fixture_files:8,test_count:84}]);
for(const f of m.source_tests){
 const p=ports.files.find(p=>p.path===f.path);assert(p);assert.equal(p.source_sha256,f.source_sha256);assert.equal(p.source_bytes,f.source_bytes);
 let s=read('scripts/marble-acid-desk/'+f.path);assert.equal(Buffer.byteLength(s),p.ported_bytes);assert.equal(sha(s),p.ported_sha256);
 assert.equal(p.scope,f.scope);assert.equal(p.test_count,f.test_count);
 for(const {from,to,count} of [...p.replacements].reverse()){
  assert.equal(occurrences(s,to),count,'pinned adaptation count '+f.path);s=s.split(to).join(from);
 }
 assert.equal(Buffer.byteLength(s),f.source_bytes);assert.equal(sha(s),f.source_sha256,'original assertions and fixtures reversibly retained '+f.path);
 if(f.path.endsWith('.test.mjs'))assert.equal(occurrences(s,"test('"),f.test_count);
}
for(const scope of ['integrated-marble-course','historical-fixture-only'])assert.equal(ports.files.filter(f=>f.scope===scope).reduce((n,f)=>n+f.test_count,0),scope==='integrated-marble-course'?43:84);
for(const p of ['marble-ui.test.mjs','ui.test.mjs']){
 const s=read('scripts/marble-acid-desk/'+p);assert.match(s,/const \{JSDOM\}=req\('jsdom'\)/);assert.doesNotMatch(s,/\/workspace\/|node_modules\/jsdom/);
}
assert.equal(JSON.parse(read('scripts/package.json')).devDependencies.jsdom,'26.1.0');

// Files changed after this desk was integrated are accepted only through the approved blob chain
// (scripts/approved-existing-tool-changes.json), the same gate every later tools/assets change must pass.
const approvedChanges=JSON.parse(read('scripts/approved-existing-tool-changes.json')).changes;
const approvedReach=(path,from)=>{let at=from;for(let step;(step=approvedChanges.find(c=>c.path===path&&c.baseline_blob===at));)at=step.approved_blob;return at;};
const laterApproved=new Set();
// The original integration baseline is not rewritten when authorized main advances.
assert.deepEqual(m.integration_base_provenance.runtime_changes,[{path:'tools/math/g6-drills.html',original_blob:'f7674e06e08eea460bf0b654754b26c1770540ae',current_blob:'e5068cc199e630d53483bbb6e71b2ec60fee1663'}]);
assert.deepEqual(m.integration_base_provenance.main_updates,[
 {pull_request:207,from_commit:'77adcbba9a7473477c0b04c2f5a64bf9b94fa552',to_commit:'57080d3d7568b452c6dfed3226051d5206464588',path:'tools/math/g6-drills.html',from_blob:'f7674e06e08eea460bf0b654754b26c1770540ae',to_blob:'c26673281b3d5c07b4bb04b11b580baf24fb433f'},
 {pull_request:208,from_commit:'57080d3d7568b452c6dfed3226051d5206464588',to_commit:'98a61df53396ddca2c7bf8ba401a8fd5450a9cd0',path:'tools/math/g6-drills.html',from_blob:'c26673281b3d5c07b4bb04b11b580baf24fb433f',to_blob:'e5068cc199e630d53483bbb6e71b2ec60fee1663'}
]);
for(const update of m.integration_base_provenance.main_updates){
 const changed=execFileSync('git',['diff','--name-only',update.from_commit,update.to_commit,'--','tools','assets'],{cwd:root,encoding:'utf8'}).trim().split('\n');
 assert.deepEqual(changed,[update.path],'each authorized main advance changes only the pinned G6 runtime');
 assert.equal(execFileSync('git',['rev-parse',`${update.from_commit}:${update.path}`],{cwd:root,encoding:'utf8'}).trim(),update.from_blob);
 assert.equal(execFileSync('git',['rev-parse',`${update.to_commit}:${update.path}`],{cwd:root,encoding:'utf8'}).trim(),update.to_blob);
}
const baselineChanges=execFileSync('git',['diff','--name-only',m.baseline_commit,m.current_integration_base,'--','tools','assets'],{cwd:root,encoding:'utf8'}).trim().split('\n');
assert.deepEqual(baselineChanges,m.integration_base_provenance.runtime_changes.map(f=>f.path),'only the separately authorized current-main G6 update lies between the two runtime baselines');
for(const f of m.integration_base_provenance.runtime_changes){
 assert.equal(execFileSync('git',['rev-parse',`${m.baseline_commit}:${f.path}`],{cwd:root,encoding:'utf8'}).trim(),f.original_blob);
 assert.equal(execFileSync('git',['rev-parse',`${m.current_integration_base}:${f.path}`],{cwd:root,encoding:'utf8'}).trim(),f.current_blob);
 const now=blob(bytes(f.path));assert.ok(now===f.current_blob||now===approvedReach(f.path,f.current_blob),'preserve the exact current-main G6 figures or an approved later change');
}
// Existing paths come from Git, not a new public list of unpublished station routes.
const baseline=execFileSync('git',['ls-tree','-r',m.current_integration_base,'--','tools','assets'],{cwd:root,encoding:'utf8'}).trim().split('\n');
assert.equal(baseline.length,682);let protectedCount=0;
for(const line of baseline){
 const match=/^\d+ blob ([0-9a-f]{40})\t(.+)$/.exec(line);assert(match);const [,expected,p]=match;
 if(p==='tools/science/index.html')continue;
 if(p===m.public_entry){assert.equal(expected,m.protected_baseline.original_entry_blob);continue;}
 const now=blob(bytes(p));if(now!==expected){assert.equal(now,approvedReach(p,expected),'unchanged existing tools/assets blob (or an approved later change)');laterApproved.add(p);}protectedCount++;
}
assert.equal(protectedCount,680,'all other current-main tools, math, English and shared assets remain exact');
const previous=checkExistingFiles({root,baselineCommit:m.baseline_commit,skip:['tools/science/index.html']});
assert.deepEqual(previous,{protectedCount:681,approved:2+[...laterApproved].filter(p=>p!=='tools/math/g6-drills.html').length},'original baseline permits only the authorized G6 update, exact old-entry replacement and approved later changes');
const current=checkExistingFiles({root,baselineCommit:m.current_integration_base,skip:['tools/science/index.html']});
assert.deepEqual(current,{protectedCount:681,approved:1+laterApproved.size},'only the exact authorized old entry and approved later changes differ from current main');
for(const line of execFileSync('git',['ls-tree','-r',m.current_integration_base,'--','scripts/science'],{cwd:root,encoding:'utf8'}).trim().split('\n')){
 const match=/^\d+ blob ([0-9a-f]{40})\t(.+)$/.exec(line);assert(match);assert.equal(blob(bytes(match[2])),match[1],'shared science engines/catalog unchanged');
}
const oldEntry=execFileSync('git',['show',`${m.baseline_commit}:${m.public_entry}`],{cwd:root});
assert.equal(blob(oldEntry),'59885a1364806e808c2a008c1b28dab368c49397');
assert.deepEqual(bytes('scripts/marble-acid-desk/legacy-public-reaction-rate.html'),oldEntry,'the old public-runtime fixture is exactly its Git baseline, separate from private historical tests');
const oldFixture=JSON.parse(read('scripts/marble-acid-desk/legacy-public-reaction-rate.json'));
assert.equal(oldFixture.sourceCommit,m.baseline_commit);assert.equal(oldFixture.publicPath,m.public_entry);
assert.equal(oldFixture.fixturePath,'scripts/marble-acid-desk/legacy-public-reaction-rate.html');
assert.equal(oldFixture.sourceBlob,m.protected_baseline.original_entry_blob);assert.equal(oldFixture.sha256,sha(oldEntry));
assert.match(oldFixture.scope,/historical.*not the current public product/);

assert.equal(standalonePublic.length,8);assert(!standalonePublic.some(t=>/marble|reaction-rate/.test(t.file)));
assert(!legacy.some(t=>/marble|reaction-rate/.test(t.file)));assert(!firstBatch.some(f=>/marble|reaction-rate/.test(f)));
assert.equal(batch2.filter(t=>t.id==='reaction-rate').length,1);
const all=[...legacy.flatMap(t=>t.file==='circuit-lab.html'?[t,...guidedPublic]:[t]),...standalonePublic,...batch2.map(t=>({...publicReactionDescriptor(t),file:'science/'+t.id+'.html',kind:'探究實驗',batch:2}))];
assert.equal(all.length,60);assert.equal(all.filter(t=>t.grade==='國中').length,59);assert.equal(all.filter(t=>t.subject==='理化').length,41);
const item=all.find(t=>t.file==='science/reaction-rate.html');assert.match(item.title,/大理石/);assert.match(item.description,/未經實驗校準/);assert.match(item.description,/私人原型站紀錄不會自動移入官網/);
for(const [p,href]of [['ziyuan.html','tools/science/reaction-rate.html'],['tools/science/index.html','../science/reaction-rate.html']]){
 const s=read(p);assert.equal(occurrences(s,`href="${href}"`),1,'one card at the original URL');assert.doesNotMatch(s,/href=["'][^"']*(?:marble-acid-desk|reaction-rate-desk)\//);
 for(const old of standalonePublic)assert(s.includes(old.file));
}
assert.match(read('tools/science/index.html'),/60 項教材/);assert.match(read('ziyuan.html'),/全部 60 項自然教材/);
assert.match(read('ziyuan.html'),/國中自然 · 互動教材<span class="count">59 項/);assert.match(read('ziyuan.html'),/理化 <small>41 項/);assert.match(read('ziyuan.html'),/目前共 254 項/);
const resourceDOM=new JSDOM(read('ziyuan.html'));
try{assert.equal(resourceDOM.window.document.querySelectorAll('section.res-sec .tpills > a, section.res-sec .science-category li > a').length,254);}finally{resourceDOM.window.close();}
assert.equal(occurrences(read('sitemap.xml'),`<loc>${m.canonical}</loc>`),1);assert.doesNotMatch(read('sitemap.xml'),/marble-acid-desk|reaction-rate-desk/);
const documentDOM=new JSDOM(entry);const doc=documentDOM.window.document;
assert.equal(doc.querySelectorAll('link[rel="canonical"]').length,1);assert.equal(doc.querySelector('link[rel="canonical"]').href,m.canonical);
assert.equal(doc.querySelector('meta[property="og:url"]').content,m.canonical);
assert.equal(doc.querySelector('.brand').getAttribute('href'),'../../ziyuan.html');
assert(doc.getElementById('bench'));assert(doc.getElementById('public-legacy-data'));
assert.doesNotMatch(entry,/noindex|http-equiv=["']refresh|<iframe|location\.(?:assign|replace)|data-science-lab|researcher-lab|science-events|assets\/site\.js/);

const storage=read(m.module_directory+'/storage.mjs'),adapter=read(m.module_directory+'/public-legacy-export.mjs');
assert(storage.includes("STORAGE_KEY = 'bhcs.marbleAcidDesk.v1'"));assert.match(storage,/removeItem\(STORAGE_KEY\)/);assert.doesNotMatch(storage,/localStorage\.clear\s*\(|storage\.clear\s*\(/);
assert.doesNotMatch(adapter,/\b(?:setItem|removeItem|clear)\s*\(/,'legacy adapter cannot write or remove data');
for(const key of ['bhcs-science-v2-reaction-rate','bhcs-science-v2-reaction-rate-draft','bhcs-science-v2-reaction-rate-guide','bhcs-inquiry-v1:/tools/science/reaction-rate.html'])assert(adapter.includes(`'${key}'`));
assert(read(m.module_directory+'/app.mjs').includes("LEGACY_KEY='bhcs.reactionRateDesk.v1'"),'private prototype legacy export remains separately intact');
const commands=JSON.parse(read('scripts/package.json')).scripts;
assert.equal(commands['test:marble-acid-desk'],'node test_marble_acid_desk_integration.mjs && node --test marble-acid-desk/*.test.mjs');
for(const name of ['marble-acid-desk','motion-graphs-desk','friction-efficiency-desk','incline-desk','pulley-desk','lever-desk','buoyancy-lab','lens-25d'])assert(commands.test.includes('npm run test:'+name));
execFileSync(process.execPath,['--check','scripts/check_marble_acid_desk_browser.cjs'],{cwd:root});
const jobs=ciJobs(),station=jobs['science-stations'];
assert.match(station.text,/NODE_PATH: \/tmp\/bhcs-composition\/node_modules\n\s+run: xvfb-run -a node scripts\/check_marble_acid_desk_browser\.cjs/);
assert.match(station.text,/name: marble-acid-desk-review\n\s+path: marble-acid-desk-artifacts\/\n\s+retention-days: 14/);
assert(station.steps.some(s=>s.startsWith('      - uses: actions/upload-artifact@v4')&&s.includes('name: marble-acid-desk-review')),'browser evidence upload is a real YAML step');
assert(!station.text.includes('continue-on-error: true'));
for(const name of ['researcher_browser','microscope_3d_browser','lens_25d_browser','researcher_operations','buoyancy_lab_browser','lever_desk_browser','pulley_desk_browser','incline_desk_browser','friction_efficiency_desk_browser','motion_graphs_desk_browser','marble_acid_desk_browser'])assert.equal(occurrences(station.text,`node scripts/check_${name}.cjs`),1,'existing browser gate retained');
assert.deepEqual(jobs.gate.needs,['core','site','science-layout','science-stations','science-guided','math-browser','math-regression','math-diversity']);
assert.match(jobs.gate.text,/if: always\(\)/);assert(jobs.gate.text.includes('length == 8 and all(.[]; .result == "success")'));

// Only accepted runtime and the narrowly scoped bridge are checked here; source docs/private hosting files are not copied.
const runtimePaths=[m.public_entry,...walk(runtime).map(p=>path.relative(root,p))];
const httpPaths=[...runtimePaths,variant.path];
const refs=[];const sourceTexts=[];
for(const p of runtimePaths){
 const ext=path.extname(p);if(!['.html','.css','.mjs','.json'].includes(ext))continue;
 const s=read(p);sourceTexts.push(s);
 assert.doesNotMatch(s,/\.openai|hosting\.json|\/workspace\/|\/home\/agent\/|file:\/\/|chatgpt\.site|several74727|BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY|\b(?:sk|ghp|gho)_[A-Za-z0-9]{20,}/,'no private source/credential references in served text');
 assert.doesNotMatch(s,/sessionStorage|indexedDB|document\.cookie|XMLHttpRequest|WebSocket|sendBeacon|serviceWorker|\bfetch\s*\(/,'no unexpected network or alternate storage runtime');
 let found=[];
 if(ext==='.html')found=[...doc.querySelectorAll('[src],link[href],a[href]')].map(el=>({ref:el.getAttribute('src')??el.getAttribute('href'),tag:el.localName,rel:el.getAttribute('rel')}));
 if(ext==='.css')found=[...s.matchAll(/url\(["']?([^\)"';]+)/g)].map(x=>({ref:x[1]}));
 if(ext==='.mjs')found=[...s.matchAll(/(?:from\s*|import\s*\()\s*["']([^"']+)/g)].map(x=>({ref:x[1]}));
 for(const {ref,tag,rel} of found){
  if(ref.startsWith('#'))continue;
  if(tag==='link'&&rel==='canonical'){assert.equal(ref,m.canonical);continue;}
  if(tag==='link'&&rel==='icon'&&ref.startsWith('data:image/svg+xml,'))continue;
  assert(!/^(?:[a-z]+:|\/)/i.test(ref),'relative runtime reference');
  const url=new URL(ref,'http://localhost/'+p),target=path.resolve(root,url.pathname.slice(1));
  if(tag==='a'){assert.equal(path.relative(root,target),'ziyuan.html','only explicit return navigation leaves the isolated lesson');}
  else assert(target.startsWith(runtime+path.sep),'runtime resources and imports remain in the accepted module directory');
  assert(fs.statSync(target).isFile());refs.push({url:url.pathname,target});
 }
}
for(const unused of m.unused_source_files_retained)assert(!sourceTexts.some(s=>s.includes(unused)),'retained original teacher assets remain unused, not silently substituted');
documentDOM.window.close();
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json'};
const served=new Set([...httpPaths.map(p=>path.resolve(root,p)),path.resolve(root,'ziyuan.html')]);
const server=http.createServer((req,res)=>{
 const target=path.resolve(root,new URL(req.url,'http://localhost').pathname.slice(1));
 if(!served.has(target)){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',mime[path.extname(target)]);res.end(fs.readFileSync(target));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
try{
 for(const {url,target} of [...httpPaths.map(p=>({url:'/'+p,target:path.resolve(root,p)})),...refs]){
  const response=await fetch(`http://127.0.0.1:${server.address().port}`+url);
  assert.equal(response.status,200,url);assert.equal(response.headers.get('content-type'),mime[path.extname(target)],url);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),fs.readFileSync(target),'HTTP serves every exact runtime/asset byte');
 }
 for(const route of ['/tools/marble-acid-desk/','/tools/science/reaction-rate-desk/','/tools/science/reaction-rate-desk/index.html'])assert.equal((await fetch(`http://127.0.0.1:${server.address().port}`+route)).status,404,'no second lesson entry');
}finally{await new Promise(r=>server.close(r));}
console.log('PASS marble replacement: original URL renders accepted17 files via pinned13 entry adaptations and separately reversible app/style repairs;43 live-course +84 historical-fixture tests reversibly retained;680 other tools/assets exact; unchanged60/59/41/254 discovery with one proven directory-only derivative; all HTTP bytes/MIME. Local contracts only, not production/device certification.');
