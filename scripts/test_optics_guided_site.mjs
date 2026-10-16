// I7 gate: the guided prototype is a hand-written, unlisted page that leaves every existing contract alone.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import cp from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import { ciWorkflow, ciJobs, CHROMIUM_INSTALL } from './ci_workflow_test_support.mjs';
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const PAGE='tools/science/optics-guided.html',html=read(PAGE);

test('prototype visibility: noindex, self canonical, not in sitemap, directory, resources or catalogs',()=>{
 assert.match(html,/<meta name="robots" content="noindex">/);
 assert.match(html,/<link rel="canonical" href="https:\/\/www\.bhcs\.com\.tw\/tools\/science\/optics-guided\.html">/);
 assert.ok(!read('sitemap.xml').includes('optics-guided'),'sitemap');
 for(const f of ['tools/science/index.html','ziyuan.html','guoxiao.html','guozhong.html','guozhong-lihua.html','scripts/science/catalog.mjs','scripts/science/batch2.mjs','assets/researcher-lab.js','index.html'])assert.ok(!read(f).includes('optics-guided'),f+' does not mention the prototype');
 const anywhere=cp.execFileSync('git',['grep','-l','optics-guided','--','*.html'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
 assert.deepEqual(anywhere,[PAGE],'no other page links to it');
});

test('page shape: hand-written, scoped CSS only, science adapter, no legacy shell, no inline analytics',()=>{
 assert.ok(!html.includes('science-self-study')&&!html.includes('lab-config'),'not a builder-generated lab page');
 assert.deepEqual([...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]),['../../assets/science-guided/science-guided.css','../../assets/optics-guided/optics-guided.css','../../assets/optics-guided/input.css']);
 assert.deepEqual([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]),['../../assets/science-events.js','../../assets/optics-guided/main.js']);
 assert.ok(/<script src="\.\.\/\.\.\/assets\/science-events\.js" defer>/.test(html)&&/<script type="module" src="\.\.\/\.\.\/assets\/optics-guided\/main\.js">/.test(html));
 assert.ok(!/researcher-lab|site\.js|googletagmanager|G-GHN2GDS2RQ|gtag\(/.test(html),'no legacy shell, second analytics loader or inline GA');
 assert.ok(!/<body[^>]*class="[^"]*researcher/.test(html));assert.match(html,/<body class="optics-guided" data-science-lab="optics-guided">/);
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1,'one h1');assert.match(html,/匿名使用事件不含研究筆記、作答內容或學生姓名/);
 assert.match(html,/href="\.\/optics\.html"/,'links to the existing free-exploration lab');
 // every local reference exists
 for(const m of html.matchAll(/(?:href|src)="(\.\.?\/[^"#?]+)"/g)){assert.ok(fs.existsSync(path.join(root,path.dirname(PAGE),m[1])),m[1])}
});

test('no test controls ship: no debug hook and no query switches in the page code',()=>{
 for(const f of fs.readdirSync(path.join(root,'assets/optics-guided')).filter(n=>n.endsWith('.js'))){
  const s=read('assets/optics-guided/'+f);assert.ok(!/__opticsGuided|[?&]debug|get\('debug'\)/.test(s),f);
 }
});

test('workflow: the guided checks run in the guided job after its Chromium install, CI Gate also needs the build, and they are not part of the 42-station harness',()=>{
 const jobs=ciJobs();
 const job=jobs['science-guided'];
 assert.ok(job,'the science-guided job exists');
 const idx=n=>job.text.indexOf(n);
 for(const c of ['check_optics_guided_input_browser.cjs','check_optics_guided_view_browser.cjs','check_optics_guided_flow_browser.cjs'])assert.ok(idx(c)>idx(CHROMIUM_INSTALL)&&idx(CHROMIUM_INSTALL)>=0,c+' comes after the Chromium install in the same job');
 assert.ok(jobs.core.text.includes('git diff --exit-code'),'core runs the builders and the idempotence check');
 assert.ok(['core','science-guided'].every(n=>jobs.gate.needs.includes(n)),'CI Gate needs both core and science-guided');
 for(const f of ['check_researcher_composition.cjs','check_researcher_operations.cjs','test_researcher_batch5.cjs'])assert.ok(!read('scripts/'+f).includes('optics-guided'),f+' does not know the prototype');
 assert.ok(job.text.includes('optics-flow-review')&&job.text.includes('optics-view-review'),'review images are uploaded');
});

console.log(`PASS optics guided site: ${tests} tests`);
