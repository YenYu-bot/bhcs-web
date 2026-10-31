import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ciWorkflow, ciJobs, CHROMIUM_INSTALL } from './ci_workflow_test_support.mjs';

let tests=0;
const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'});
const PAGE='tools/science/circuit-guided.html';
const DIR='assets/circuit-guided';
const html=read(PAGE);
const js=fs.readdirSync(path.join(root,DIR)).filter(n=>n.endsWith('.js')).sort();
const strip=(s)=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
const forbidden=/串聯|並聯|等效電阻|歐姆定律|I\s*=\s*V\s*\/\s*R|總電阻變大|總電阻變小|串聯電阻|並聯電阻|支路電流總和/i;

test('public launch: SEO, canonical, science index, resource directory and sitemap agree',()=>{
  assert.match(html,/<meta name="robots" content="index,follow,max-image-preview:large">/);
  assert.doesNotMatch(html,/<meta name="robots" content="noindex">/);
  assert.match(html,/<link rel="canonical" href="https:\/\/www\.bhcs\.com\.tw\/tools\/science\/circuit-guided\.html">/);
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
  assert.doesNotMatch(html, /導引版原型|尚未公開/);
  const sitemap=read('sitemap.xml'),index=read('tools/science/index.html'),resources=read('ziyuan.html');
  assert.equal((sitemap.match(/<loc>https:\/\/www\.bhcs\.com\.tw\/tools\/science\/circuit-guided\.html<\/loc>/g)||[]).length,1);
  assert.equal((index.match(/href="\.\.\/science\/circuit-guided\.html"/g)||[]).length,1);
  assert.equal((resources.match(/href="tools\/science\/circuit-guided\.html"/g)||[]).length,1);
  assert.match(read('scripts/science/catalog.mjs'),/file:'science\/circuit-guided\.html'/);
  assert.match(index, /59 項教材/);
  assert.match(resources, /全部 59 項自然教材/);
  assert.match(resources, /國中自然 · 互動教材<span class="count">58 項/);
  assert.match(resources, /理化 <small>40 項/);
  assert.match(resources, /目前共 226 項/);
});

test('public circuit lab is discoverable while the legacy circuit stays separate',()=>{
  const pages=git('grep','-l','circuit-guided','--','*.html').trim().split('\n').filter(Boolean).sort();
  assert.deepEqual(pages,[PAGE,'tools/science/index.html','ziyuan.html'].sort());
  assert.ok(!read('tools/circuit-lab.html').includes('circuit-guided'));
  assert.ok(!html.includes('circuit-lab.html'));
  assert.match(html, /href="\.\.\/\.\.\/ziyuan\.html"/);
  assert.match(html, /href="\.\/"/);
});

test('page is hand-written, local-only and has one live region',()=>{
  assert.ok(!html.includes('science-self-study')&&!html.includes('lab-config'));
  assert.deepEqual([...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]),[
    '../../assets/science-guided/science-guided.css','../../assets/circuit-guided/circuit-guided.css'
  ]);
  assert.deepEqual([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]),['../../assets/circuit-guided/main.js']);
  assert.match(html,/<script type="module" src="\.\.\/\.\.\/assets\/circuit-guided\/main\.js"><\/script>/);
  assert.ok(!/<script>|\son[a-z]+="/.test(html));
  assert.ok(!/science-events|researcher-lab|site\.js/.test(html));
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
  assert.equal((html.match(/<main[ >]/g)||[]).length,1);
  assert.equal((html.match(/aria-live=/g)||[]).length,1);
  assert.match(html,/<body class="circuit-guided" data-science-lab="circuit-guided">/);
  assert.deepEqual([...html.matchAll(/(?:href|src)="(https?:[^"]+)"/g)].map(m=>m[1]),['https://www.bhcs.com.tw/tools/science/circuit-guided.html']);
  assert.ok(!/cdn\.|unpkg|jsdelivr|googleapis|gstatic|googletagmanager/.test(html+read(DIR+'/circuit-guided.css')));
});

test('static HTML does not reveal formal answers',()=>{
  const head=html.slice(0,html.indexOf('</head>'));
  assert.doesNotMatch(head,forbidden);
  assert.doesNotMatch(html.replace(/circuit-guided/g,''),forbidden);
});

test('B3 screens remain intact and B4-A/B challenge containers are explicit',()=>{
  for(const id of ['cgg-welcome','cgg-bench-card','cgg-compare','cgg-inference','cgg-concept','cgg-status','cgg-cta','cgg-data','cgg-evidence','cgg-announcer']){
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
  }
  for(const id of ['cgg-notebook','cgg-notebook-open','cgg-challenges','cgg-challenges-open','cgg-complete','cgg-restart']) assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
  for(const absent of ['cgg-storage-note']) assert.ok(!html.includes(`id="${absent}"`),absent);
});

test('B1-B4 core JS is retained with persistence isolated to storage adapter',()=>{
  assert.deepEqual(js,['analytics.js','challenge-view.js','challenges.js','engine.js','input.js','main.js','model.js','notebook-view.js','notebook.js','persist.js','render.js','script.js','storage.js']);
  for(const f of js){
    const src=strip(read(DIR+'/'+f));
    for(const bad of [...(['main.js','storage.js'].includes(f)?[]:['localStorage']), 'sessionStorage','indexedDB','document.cookie',...((f==='main.js')?[]:['bhcsScienceTrack']),'gtag','dataLayer','fetch(','XMLHttpRequest','sendBeacon','WebSocket','__cggTest','URLSearchParams','eval(','new Function']){
      assert.ok(!src.includes(bad),f+' uses '+bad);
    }
  }
});

test('responsibility boundaries stay intact',()=>{
  for(const f of ['model.js','engine.js','script.js']){
    const src=strip(read(DIR+'/'+f));
    assert.ok(!/document\.|querySelector|addEventListener/.test(src),f+' touches DOM');
  }
  for(const f of ['model.js','engine.js','render.js','input.js']){
    assert.ok(!/from '\.\/(script|main)\.js'/.test(read(DIR+'/'+f)),f+' reaches page layer');
    assert.ok(!read(DIR+'/'+f).includes('science-guided/components'),f+' reaches shared cards');
  }
  const main=read(DIR+'/main.js');
  assert.match(main,/from '\.\.\/science-guided\/components\.js'/);
  for(const name of ['createActionBar','createAnnouncer','focusHandoff','renderStepNav','renderCoachCard','renderStatusBar','renderDataCard','renderEvidenceCard','renderCompareCard','renderConceptReveal']){
    assert.ok(main.includes(name),name);
  }
});

test('pre-Concept wording in script source contains none of the formal vocabulary',()=>{
  const src=read(DIR+'/script.js');
  const cut=src.indexOf('const FORMAL_TEXT');
  assert.ok(cut>0);
  assert.doesNotMatch(src.slice(0,cut),forbidden);
  assert.match(src.slice(cut),/串聯/);
  assert.match(src.slice(cut),/並聯/);
  assert.match(src.slice(cut),/歐姆定律/);
});

test('normal npm test chain includes B3 script/site tests after B2 input/render',()=>{
  const testCmd=JSON.parse(read('scripts/package.json')).scripts.test;
  const names=['test_circuit_guided_model.mjs','test_circuit_guided_engine.mjs','test_circuit_guided_render.mjs','test_circuit_guided_input.mjs','test_circuit_guided_script.mjs','test_circuit_guided_site.mjs'];
  const at=names.map(n=>testCmd.indexOf(n));
  assert.ok(at.every(i=>i>=0),JSON.stringify(at));
  for(let i=1;i<at.length;i++) assert.ok(at[i-1]<at[i],names.join(' -> '));
});

test('legacy circuit page remains outside the B3 page shell',()=>{
  const legacy=read('tools/circuit-lab.html');
  assert.ok(!legacy.includes('../../assets/circuit-guided/'));
  assert.ok(!legacy.includes('circuit-guided.html'));
});

test('CI runs circuit input → view → learner → flow once each in science-guided after Chromium, with screenshots kept 14 days',()=>{
  const wf=ciWorkflow(),jobs=ciJobs(wf),steps=jobs['science-guided'].steps,all=Object.values(jobs).flatMap(j=>j.steps);
  const at=(needle,label)=>{const i=steps.findIndex(st=>st.includes(needle));assert.ok(i>=0,'missing '+label);return i};
  const install=at(CHROMIUM_INSTALL,'Chromium install');
  const idx=['input','view','learner','flow'].map(k=>{const f='check_circuit_guided_'+k+'_browser.cjs';assert.equal(wf.split(f).length,2,k+' gate runs exactly once');assert.equal(all.filter(st=>st.includes(f)).length,1,k+' in one step');const i=at(f,k);assert.match(steps[i],/NODE_PATH: \/tmp\/bhcs-composition\/node_modules/);return i});
  assert.ok(install<idx[0]&&idx[0]<idx[1]&&idx[1]<idx[2]&&idx[2]<idx[3],'Chromium → input → view → learner → flow');
  for(const [name,dir] of [['circuit-view-review','circuit-view-artifacts/'],['circuit-learner-review','circuit-learner-artifacts/'],['circuit-flow-review','circuit-flow-artifacts/']])
    assert.ok(wf.includes('name: '+name+'\n          path: '+dir+'\n          retention-days: 14'),name+' → '+dir+', 14 days');
  assert.ok(jobs.gate.needs.includes('science-guided'),'CI Gate needs science-guided');
  assert.equal(fs.existsSync(path.join(root,'.github/workflows/circuit165-visual-temporary.yml')),false,'temporary circuit workflow retired');
});
console.log('circuit-guided site: '+tests+' tests passed');
