// B3 gate (static): the guided microscope prototype is a hand-written, unlisted page that leaves every existing contract alone.
// Run on its own: node scripts/test_microscope_guided_site.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import cp from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const git = (...args) => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const PAGE = 'tools/science/microscope-guided.html';
const html = read(PAGE);
const JS_DIR = 'assets/microscope-guided';
const jsFiles = fs.readdirSync(path.join(root, JS_DIR)).filter((n) => n.endsWith('.js')).sort();
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');

test('visibility: noindex, self canonical, and not in the sitemap, directory, resources, catalogs or the home pages', () => {
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.bhcs\.com\.tw\/tools\/science\/microscope-guided\.html">/);
  assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
  assert.ok(!read('sitemap.xml').includes('microscope-guided'), 'sitemap');
  for (const f of ['tools/science/index.html', 'ziyuan.html', 'guoxiao.html', 'guozhong.html', 'guozhong-lihua.html', 'index.html',
    'scripts/science/catalog.mjs', 'scripts/science/batch2.mjs', 'assets/researcher-lab.js', 'assets/science-lab.js', 'assets/science-events.js', 'assets/site.js']) {
    assert.ok(!read(f).includes('microscope-guided'), `${f} does not mention the prototype`);
  }
});

test('nothing public links to it: no other page, catalog, sitemap or data file names the prototype', () => {
  const pages = git('grep', '--untracked', '-l', 'microscope-guided', '--', '*.html').trim().split('\n').filter(Boolean);
  assert.deepEqual(pages, [PAGE], 'no other HTML page contains the prototype\'s name');
  const everywhere = git('grep', '--untracked', '-l', 'microscope-guided').trim().split('\n').filter(Boolean);
  const allowed = [/^assets\/microscope-guided\//, /^tools\/science\/microscope-guided\.html$/, /^scripts\/(?:check|test)_microscope_guided_[a-z_]+\.(?:mjs|cjs)$/, /^scripts\/microscope_guided_test_support\.cjs$/,
    /^scripts\/package\.json$/, /^docs\/.*microscope-guided.*\.md$/];
  assert.deepEqual(everywhere.filter((f) => !allowed.some((re) => re.test(f))), [], 'only the prototype\'s own files, tests and docs mention it');
  assert.ok(!read('tools/microscope-lab.html').includes('microscope-guided'), 'the legacy lab does not link to the guided page');
});

test('page shape: hand-written, shared + own CSS only, site adapter then module main, no CDN or external runtime, one h1, legacy link', () => {
  assert.ok(!html.includes('science-self-study') && !html.includes('lab-config'), 'not a builder-generated lab page');
  assert.deepEqual([...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]), ['../../assets/science-guided/science-guided.css', '../../assets/microscope-guided/microscope-guided.css']);
  assert.deepEqual([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]), ['../../assets/science-events.js', '../../assets/microscope-guided/main.js']);
  assert.ok(/<script src="\.\.\/\.\.\/assets\/science-events\.js" defer><\/script>/.test(html), 'the adapter is loaded as it is on the other labs');
  assert.ok(/<script type="module" src="\.\.\/\.\.\/assets\/microscope-guided\/main\.js"><\/script>/.test(html), 'main.js is a module');
  assert.ok(html.indexOf('science-events.js') < html.indexOf('microscope-guided/main.js'), 'adapter first');
  assert.ok(!/<script>/.test(html), 'no inline script');
  for (const id of ['mg-notebook', 'mg-challenge', 'mg-complete', 'mg-notebook-title', 'mg-challenge-title', 'mg-complete-title', 'mg-restart', 'mg-storage-note', 'mg-privacy-note']) assert.ok(html.includes(`id="${id}"`), `${id} is in the page`);
  assert.ok(!html.includes('mg-pending') && !html.includes('匿名使用事件'), 'the privacy words come from the script, and the stage-3 placeholder is gone');
  assert.ok(read(`${JS_DIR}/script.js`).includes('匿名使用事件不含研究手冊文字、作答內容或學生姓名。'));
  assert.ok(read(`${JS_DIR}/analytics.js`).includes("LAB_ID = 'microscope-guided'"));
  assert.ok(read(`${JS_DIR}/script.js`).includes("href: '../microscope-lab.html'"), 'the finish links to the full lab');
  assert.ok(!/researcher-lab|site\.js|<body[^>]*class="[^"]*researcher/.test(html), 'no legacy shell');
  assert.match(html, /<body class="microscope-guided" data-science-lab="microscope-guided">/);
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1, 'one h1');
  assert.equal((html.match(/<main[ >]/g) ?? []).length, 1);
  assert.equal((html.match(/aria-live=/g) ?? []).length, 1, 'one live region in the markup');
  assert.deepEqual([...html.matchAll(/(?:href|src)="(https?:[^"]+)"/g)].map((m) => m[1]), ['https://www.bhcs.com.tw/tools/science/microscope-guided.html'], 'the canonical is the only absolute URL');
  assert.ok(!/cdn\.|unpkg|jsdelivr|googleapis|gstatic|googletagmanager/.test(html + read(`${JS_DIR}/microscope-guided.css`)), 'no CDN or external font');
  assert.ok(!/@import|url\(\s*['"]?https?:/.test(read(`${JS_DIR}/microscope-guided.css`)), 'the stylesheet loads nothing external');
  assert.ok(/<a href="\.\.\/microscope-lab\.html">/.test(html), 'the way to the full lab');
  assert.ok(fs.existsSync(path.join(root, 'tools/microscope-lab.html')));
  for (const m of html.matchAll(/(?:href|src)="(\.\.?\/[^"#?]+)"/g)) assert.ok(fs.existsSync(path.join(root, path.dirname(PAGE), m[1])), m[1]);
  for (const f of jsFiles) for (const m of read(`${JS_DIR}/${f}`).matchAll(/from '(\.\.?\/[^']+)'/g)) assert.ok(fs.existsSync(path.join(root, JS_DIR, m[1])), `${f} imports ${m[1]}`);
});

test('analytics goes through the site adapter only; storage is persist.js alone; nothing reaches the network', () => {
  assert.ok(!/googletagmanager|G-GHN2GDS2RQ|gtag\(|dataLayer|sendBeacon|<script>[^<]*[a-z]/i.test(html), 'no inline script and no GA in the page');
  for (const f of jsFiles) assert.ok(!/googletagmanager|G-GHN2GDS2RQ|gtag|dataLayer|sendBeacon|XMLHttpRequest|\bfetch\(/.test(code(read(`${JS_DIR}/${f}`))), f);
  const callers = jsFiles.filter((f) => /bhcsScienceTrack/.test(code(read(`${JS_DIR}/${f}`))));
  assert.deepEqual(callers, ['analytics.js'], 'one file talks to the adapter');
  assert.ok(!/bhcsScienceTrack|science_/.test(html));
  const users = jsFiles.filter((f) => /localStorage|sessionStorage|indexedDB/.test(code(read(`${JS_DIR}/${f}`))));
  assert.deepEqual(users, ['persist.js'], 'one file touches storage');
  assert.ok(read(`${JS_DIR}/persist.js`).includes("STORAGE_KEY = 'bhcs-microscope-guided:v1'"));
  assert.ok(!code(read(`${JS_DIR}/persist.js`)).includes('bhcsMicroscopeRecords'), 'the legacy key is never named');
});

test('no test controls ship: no debug hook, no query switches, no state injection in the page code', () => {
  const bad = /__mgTest|__microscopeGuided|[?&]debug|get\('debug'\)|get\("debug"\)|data-test-debug|window\.__|location\.search|URLSearchParams/;
  for (const f of jsFiles) assert.ok(!bad.test(code(read(`${JS_DIR}/${f}`))), f);
  assert.ok(!bad.test(html), PAGE);
  assert.ok(read('scripts/microscope_guided_test_support.cjs').includes('__mgTest'), 'the hook lives with the tests that inject it');
});

test('source boundaries: each file does the one job it was given', () => {
  assert.deepEqual(jsFiles, ['analytics.js', 'challenges.js', 'engine.js', 'input.js', 'main.js', 'model.js', 'persist.js', 'render.js', 'script.js']);
  const src = Object.fromEntries(jsFiles.map((f) => [f, code(read(`${JS_DIR}/${f}`))]));
  const imports = (f) => [...src[f].matchAll(/from\s+'\.\/([a-z]+)\.js'/g)].map((m) => m[1]).sort();
  assert.deepEqual(imports('model.js'), []);
  assert.deepEqual(imports('challenges.js'), []);
  assert.deepEqual(imports('analytics.js'), []);
  assert.deepEqual(imports('engine.js'), ['challenges', 'model']);
  assert.deepEqual(imports('render.js'), ['model']);
  assert.deepEqual(imports('input.js'), ['engine', 'model', 'render']);
  assert.deepEqual(imports('persist.js'), ['challenges', 'engine', 'model']);
  assert.deepEqual(imports('script.js'), ['engine', 'model'], 'script.js cannot ask the model for geometry beyond units, and never imports challenges or persist');
  assert.deepEqual(imports('main.js'), ['analytics', 'challenges', 'engine', 'input', 'persist', 'render', 'script']);
  assert.ok(/from '\.\.\/science-guided\/components\.js'/.test(src['main.js']), 'the shared cards come from the shared layer');
  for (const f of jsFiles.filter((n) => n !== 'main.js')) assert.ok(!/science-guided/.test(src[f]), `${f} does not reach into the shared layer`);
  const cjk = /[㐀-鿿]/;
  for (const f of jsFiles.filter((n) => n !== 'script.js')) assert.ok(!cjk.test(src[f].replace(/（|）/g, '')), `${f} holds no learner wording; only script.js does`);
  assert.ok(cjk.test(src['script.js']));
  for (const f of ['model.js', 'engine.js', 'script.js', 'challenges.js', 'persist.js']) assert.ok(!/\bdocument\b|\bwindow\b|innerHTML/.test(src[f]), `${f} reaches no page`);
  assert.ok(!/analytics/i.test(src['persist.js']) && !/analytics/i.test(src['script.js']) && !/analytics/i.test(src['engine.js']), 'only analytics.js and main.js know about usage events');
  assert.ok(!/innerHTML/.test(src['render.js'] + src['main.js'] + src['input.js']), 'no markup strings');
  assert.ok(!/specimenToScreen|stageDeltaForScreenFraction|fieldRadiusWorld/.test(src['main.js'] + src['script.js']), 'geometry stays in the model');
  assert.ok(!/addEventListener\(\s*'pointer/.test(src['main.js']), 'main.js has no pointer logic');
});

test('main.js: one announcer, one live region, the shared focus handoff, no copy of the cards', () => {
  const main = code(read(`${JS_DIR}/main.js`));
  assert.equal((main.match(/createAnnouncer\(/g) ?? []).length, 1);
  assert.ok(/focusHandoff\(/.test(main));
  for (const name of ['createActionBar', 'renderStepNav', 'renderCoachCard', 'renderStatusBar', 'renderDataCard', 'renderEvidenceCard', 'renderCompareCard', 'renderConceptReveal', 'renderCompletionCard', 'createNotebook', 'createChallengeCard']) {
    assert.ok(main.includes(name), `main.js uses the shared ${name}`);
  }
  assert.ok(!/GuidedLabShell|ExperimentBenchShell/.test(main));
  assert.ok(!/aria-live|setAttribute\('role'/.test(main), 'the page adds no second live region');
});

test('workflow: the three microscope browser gates run after Chromium is installed, after the builders and the other guided gates', () => {
  const wf = read('.github/workflows/researcher-lab-check.yml');
  const idx = (n) => wf.indexOf(n);
  const gates = ['check_microscope_guided_input_browser.cjs', 'check_microscope_guided_view_browser.cjs', 'check_microscope_guided_flow_browser.cjs'];
  for (const c of gates) {
    assert.ok(idx(c) > idx('playwright install --with-deps chromium'), `${c} comes after the Chromium install`);
    assert.equal((wf.match(new RegExp(c.replace(/\./g, '\\.'), 'g')) ?? []).length, 1, `${c} runs once`);
    assert.ok(idx(c) > idx('check_buoyancy_guided_flow_browser.cjs'), `${c} follows the buoyancy gates`);
    assert.match(wf, new RegExp(`NODE_PATH: /tmp/bhcs-composition/node_modules\\n\\s+run: node scripts/${c.replace(/\./g, '\\.')}`));
  }
  assert.ok(idx('git diff --exit-code') < idx(gates[0]) && idx('npm test --prefix scripts') < idx(gates[0]), 'builders, idempotence and unit tests run first');
  assert.ok(idx(gates[0]) < idx(gates[1]) && idx(gates[1]) < idx(gates[2]), 'input, view, flow');
  assert.ok(wf.includes('Check guided microscope full student flow in a real browser'));
  for (const f of ['check_researcher_composition.cjs', 'check_researcher_operations.cjs', 'test_researcher_batch5.cjs', 'test_researcher_batch1.cjs', 'check_researcher_browser.cjs']) {
    if (fs.existsSync(path.join(root, 'scripts', f))) assert.ok(!read(`scripts/${f}`).includes('microscope-guided'), `${f} does not know the prototype`);
  }
  for (const a of [['microscope-view-review', 'microscope-view-artifacts/'], ['microscope-flow-review', 'microscope-flow-artifacts/']]) {
    assert.match(wf, new RegExp(`name: ${a[0]}\\n\\s+path: ${a[1]}\\n\\s+retention-days: 14`), `${a[0]} is uploaded for 14 days`);
  }
  assert.equal((wf.match(/microscope_guided|microscope-view-review|microscope-flow-review/g) ?? []).length, 3 + 2, 'only the three steps and the two uploads were added');
  for (const f of gates) assert.ok(fs.existsSync(path.join(root, 'scripts', f)), f);
});

test('the global test chain runs the nine microscope gates in order, before the math tests', () => {
  const chain = JSON.parse(read('scripts/package.json')).scripts.test;
  let at = -1;
  for (const n of ['model', 'engine', 'render', 'input', 'script', 'site', 'challenges', 'persist', 'analytics']) {
    const g = `test_microscope_guided_${n}.mjs`;
    assert.ok(fs.existsSync(path.join(root, 'scripts', g)), `${g} exists`);
    const i = chain.indexOf(`node ${g}`);
    assert.ok(i > at, `${g} is in the chain, in order`);
    at = i;
  }
  assert.ok(at < chain.indexOf('node test_math_drills.mjs'));
  assert.equal((chain.match(/test_microscope_guided_/g) ?? []).length, 9, 'nine, and each once');
});

console.log(`\nmicroscope-guided site: ${tests} tests passed`);
