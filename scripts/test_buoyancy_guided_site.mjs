// B7 gate (static): the guided buoyancy prototype is a hand-written, unlisted page that leaves every existing contract alone.
// Run on its own: node scripts/test_buoyancy_guided_site.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import cp from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ciWorkflow, ciJobs, CHROMIUM_INSTALL } from './ci_workflow_test_support.mjs';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const git = (...args) => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const PAGE = 'tools/science/buoyancy-guided.html';
const html = read(PAGE);
const JS_DIR = 'assets/buoyancy-guided';
const jsFiles = fs.readdirSync(path.join(root, JS_DIR)).filter((n) => n.endsWith('.js'));
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');

test('visibility: noindex, self canonical, and not in the sitemap, directory, resources, catalogs or the home pages', () => {
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.bhcs\.com\.tw\/tools\/science\/buoyancy-guided\.html">/);
  assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
  assert.ok(!read('sitemap.xml').includes('buoyancy-guided'), 'sitemap');
  for (const f of ['tools/science/index.html', 'ziyuan.html', 'guoxiao.html', 'guozhong.html', 'guozhong-lihua.html', 'index.html',
    'scripts/science/catalog.mjs', 'scripts/science/batch2.mjs', 'assets/researcher-lab.js', 'assets/science-lab.js', 'assets/science-events.js', 'assets/site.js']) {
    assert.ok(!read(f).includes('buoyancy-guided'), `${f} does not mention the prototype`);
  }
});

test('nothing public links to it: no other page, catalog, sitemap or data file names the prototype', () => {
  const pages = git('grep', '-l', 'buoyancy-guided', '--', '*.html').trim().split('\n').filter(Boolean);
  assert.deepEqual(pages, [PAGE], 'no other HTML page contains the prototype\'s name');
  const everywhere = git('grep', '-l', 'buoyancy-guided').trim().split('\n').filter(Boolean);
  const allowed = [/^assets\/buoyancy-guided\//, /^tools\/science\/buoyancy-guided\.html$/, /^scripts\/(?:check|test)_buoyancy_guided_[a-z_]+\.(?:mjs|cjs)$/, /^scripts\/buoyancy_guided_test_support\.cjs$/,
    /^scripts\/package\.json$/, /^scripts\/test_science_guided_shared\.mjs$/, /^\.github\/workflows\/ci\.yml$/, /^docs\/.*buoyancy-guided.*\.md$/,
    // Exact audit-only references for the separate standalone integration; not public discovery.
    /^docs\/buoyancy-lab-integration\.md$/, /^scripts\/test_buoyancy_lab_integration\.mjs$/];
  assert.deepEqual(everywhere.filter((f) => !allowed.some((re) => re.test(f))), [], 'only the prototype\'s own files, tests, workflow and docs mention it');
  assert.ok(!read('tools/buoyancy-density-lab.html').includes('buoyancy-guided'), 'the legacy lab does not link back to the guided page');
});

test('standalone integration audit exceptions do not expose or import the guided prototype', () => {
  const docs = read('docs/buoyancy-lab-integration.md');
  assert.ok(docs.includes('`tools/science/buoyancy-guided.html`'), 'documentation records the protected route explicitly');
  assert.doesNotMatch(docs, /(?:href\s*=\s*["'][^"']*|\]\([^)]*)buoyancy-guided/i, 'audit documentation is not a navigation link to the prototype');
  const audit = read('scripts/test_buoyancy_lab_integration.mjs');
  assert.ok(audit.includes("assert.match(read('tools/science/buoyancy-guided.html')"), 'standalone audit keeps the old noindex assertion');
  assert.ok(audit.includes("assert.ok(!read('sitemap.xml').includes('/tools/science/buoyancy-guided.html'))"), 'standalone audit keeps old sitemap exclusion');
  const walk = dir => fs.readdirSync(path.join(root, dir), {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
  for (const file of walk('tools/buoyancy-lab').filter(f => /\.(?:html|mjs|css|json)$/.test(f))) {
    assert.ok(!read(file).includes('buoyancy-guided'), `${file} cannot reference or import the unlisted prototype`);
  }
});

test('page shape: hand-written, scoped CSS only, site adapter, no legacy shell, one h1, a privacy note', () => {
  assert.ok(!html.includes('science-self-study') && !html.includes('lab-config'), 'not a builder-generated lab page');
  assert.deepEqual([...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]), ['../../assets/science-guided/science-guided.css', '../../assets/buoyancy-guided/buoyancy-guided.css']);
  assert.deepEqual([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]), ['../../assets/science-events.js', '../../assets/buoyancy-guided/main.js']);
  assert.ok(/<script src="\.\.\/\.\.\/assets\/science-events\.js" defer><\/script>/.test(html), 'the adapter is loaded as it is on the other labs');
  assert.ok(/<script type="module" src="\.\.\/\.\.\/assets\/buoyancy-guided\/main\.js"><\/script>/.test(html));
  assert.ok(html.indexOf('science-events.js') < html.indexOf('buoyancy-guided/main.js'), 'adapter first');
  assert.ok(!/researcher-lab|site\.js|<body[^>]*class="[^"]*researcher/.test(html), 'no legacy shell');
  assert.match(html, /<body class="buoyancy-guided" data-science-lab="buoyancy-guided">/);
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1, 'one h1');
  assert.equal((html.match(/<main[ >]/g) ?? []).length, 1);
  assert.ok(/<p class="bg-privacy" id="bg-privacy-note"><\/p>/.test(html), 'the privacy note has its place');
  assert.ok(read(`${JS_DIR}/script.js`).includes('匿名使用事件不含研究手冊文字、作答內容或學生姓名。'), 'and its words come from the script');
  assert.ok(!html.includes('匿名使用事件'), 'the words are not scattered in the page');
  const analytics = read(`${JS_DIR}/analytics.js`);
  assert.ok(analytics.includes("LAB_ID = 'buoyancy-guided'"));
  const script = read(`${JS_DIR}/script.js`);
  const href = '../buoyancy-density-lab.html';
  assert.ok(script.includes(`href: '${href}'`), 'the finish links to the existing free-exploration lab');
  assert.ok(fs.existsSync(path.join(root, 'tools/science', href)), 'and that lab exists');
  for (const m of html.matchAll(/(?:href|src)="(\.\.?\/[^"#?]+)"/g)) assert.ok(fs.existsSync(path.join(root, path.dirname(PAGE), m[1])), m[1]);
  for (const f of jsFiles) for (const m of read(`${JS_DIR}/${f}`).matchAll(/from '(\.\/[^']+)'/g)) assert.ok(fs.existsSync(path.join(root, JS_DIR, m[1])), `${f} imports ${m[1]}`);
});

test('analytics goes through the site adapter only: no second loader, no inline GA, no direct calls', () => {
  assert.ok(!/googletagmanager|G-GHN2GDS2RQ|gtag\(|dataLayer|sendBeacon|<script>[^<]*[a-z]/i.test(html), 'no inline script and no GA in the page');
  for (const f of jsFiles) assert.ok(!/googletagmanager|G-GHN2GDS2RQ|gtag|dataLayer|sendBeacon|XMLHttpRequest|\bfetch\(/.test(code(read(`${JS_DIR}/${f}`))), f);
  const callers = jsFiles.filter((f) => /bhcsScienceTrack/.test(code(read(`${JS_DIR}/${f}`))));
  assert.deepEqual(callers, ['analytics.js'], 'one file talks to the adapter');
  assert.ok(!/bhcsScienceTrack|science_/.test(html));
});

test('no test controls ship: no debug hook, no query switches, no state injection in the page code', () => {
  const bad = /__buoyancyGuided|__bgTest|__testScienceEvents|[?&]debug|get\('debug'\)|get\("debug"\)|data-test-debug|window\.__|location\.search|URLSearchParams/;
  for (const f of jsFiles) assert.ok(!bad.test(code(read(`${JS_DIR}/${f}`))), f);
  assert.ok(!bad.test(html), PAGE);
  for (const f of ['scripts/buoyancy_guided_test_support.cjs']) assert.ok(read(f).includes('__bgTest'), 'the hook lives with the tests that inject it');
});

test('source boundaries: each file does the one job it was given', () => {
  const src = Object.fromEntries(jsFiles.map((f) => [f, code(read(`${JS_DIR}/${f}`))]));
  const imports = (f) => [...src[f].matchAll(/from\s+'\.\/([a-z]+)\.js'/g)].map((m) => m[1]).sort();
  assert.deepEqual(imports('model.js'), []);
  assert.deepEqual(imports('engine.js'), ['challenges', 'model']);
  assert.deepEqual(imports('challenges.js'), []);
  assert.deepEqual(imports('input.js'), []);
  assert.deepEqual(imports('visual.js'), []);
  assert.deepEqual(imports('render.js'), ['visual']);
  assert.deepEqual(imports('script.js'), [], 'script.js imports nothing, so it cannot ask the model for anything');
  assert.deepEqual(imports('cards.js'), []);
  assert.deepEqual(imports('persist.js'), ['challenges', 'engine', 'model']);
  assert.deepEqual(imports('analytics.js'), []);
  assert.deepEqual(imports('main.js'), ['analytics', 'cards', 'challenges', 'engine', 'input', 'persist', 'render', 'script', 'visual']);
  const cjk = /[㐀-鿿]/;
  for (const f of ['model.js', 'engine.js', 'challenges.js', 'input.js', 'visual.js', 'render.js', 'cards.js', 'persist.js', 'analytics.js', 'main.js']) {
    assert.ok(!cjk.test(src[f].replace(/（|）/g, '')), `${f} holds no learner wording; only script.js does`);
  }
  assert.ok(cjk.test(src['script.js']));
  for (const f of jsFiles.filter((n) => n !== 'persist.js')) assert.ok(!/localStorage|sessionStorage|indexedDB/.test(src[f]), `${f} does not touch storage`);
  for (const f of jsFiles.filter((n) => !['main.js', 'cards.js', 'render.js', 'input.js'].includes(n))) assert.ok(!/\bdocument\b|\bwindow\b|innerHTML/.test(src[f].replace(/globalThis\.window/g, '')), `${f} reaches no page`);
  assert.ok(!/analytics/i.test(src['persist.js']) && !/analytics/i.test(src['script.js']) && !/analytics/i.test(src['engine.js']));
  assert.ok(!/density|massG\s*\//.test(src['analytics.js']));
  assert.ok(!/outcomeIn|blockOutcome|objectOutcome|immersionFraction/.test(src['script.js'] + src['main.js'] + src['cards.js']), 'physics stays in the model and the engine');
});

test('workflow: the guided checks run in the guided job after its Chromium install, CI Gate also needs the build and unit tests, and they stay apart from the 42-station harness', () => {
  const wf = ciWorkflow();
  const jobs = ciJobs(wf);
  const job = jobs['science-guided'];
  assert.ok(job, 'the science-guided job exists');
  const idx = (n) => job.text.indexOf(n);
  for (const c of ['check_buoyancy_guided_input_browser.cjs', 'check_buoyancy_guided_view_browser.cjs', 'check_buoyancy_guided_flow_browser.cjs']) {
    assert.ok(idx(c) > idx(CHROMIUM_INSTALL) && idx(CHROMIUM_INSTALL) >= 0, `${c} comes after the Chromium install in the same job`);
    assert.equal((wf.match(new RegExp(c.replace(/\./g, '\\.'), 'g')) ?? []).length, 1, `${c} runs once`);
  }
  assert.ok(jobs.core.text.includes('git diff --exit-code') && jobs.core.text.includes('npm test --prefix scripts'), 'core runs the builders, the idempotence check and the unit tests');
  assert.ok(['core', 'science-guided'].every((n) => jobs.gate.needs.includes(n)), 'CI Gate needs both core and science-guided');
  assert.ok(idx('check_buoyancy_guided_input_browser.cjs') < idx('check_buoyancy_guided_view_browser.cjs') && idx('check_buoyancy_guided_view_browser.cjs') < idx('check_buoyancy_guided_flow_browser.cjs'));
  assert.ok(job.text.includes('Check guided buoyancy full student flow in a real browser'));
  for (const f of ['check_researcher_composition.cjs', 'check_researcher_operations.cjs', 'test_researcher_batch5.cjs', 'test_researcher_batch1.cjs', 'check_researcher_browser.cjs']) {
    if (fs.existsSync(path.join(root, 'scripts', f))) assert.ok(!read(`scripts/${f}`).includes('buoyancy-guided'), `${f} does not know the prototype`);
  }
  assert.ok(job.text.includes('buoyancy-flow-review') && job.text.includes('buoyancy-view-review'), 'review images are uploaded');
  assert.ok(job.text.includes('buoyancy-flow-artifacts/') && job.text.includes('buoyancy-view-artifacts/'));
});

test('the global test chain runs all eight unit and static gates, before the math tests', () => {
  const pkg = JSON.parse(read('scripts/package.json'));
  const chain = pkg.scripts.test;
  const gates = ['model', 'engine', 'input', 'visual', 'script', 'persist', 'analytics', 'site'].map((n) => `test_buoyancy_guided_${n}.mjs`);
  let at = -1;
  for (const g of gates) {
    assert.ok(fs.existsSync(path.join(root, 'scripts', g)), `${g} exists`);
    const i = chain.indexOf(`node ${g}`);
    assert.ok(i > at, `${g} is in the chain, in order`);
    at = i;
  }
  assert.ok(at < chain.indexOf('node test_math_drills.mjs'));
  assert.equal((chain.match(/test_buoyancy_guided_/g) ?? []).length, 8, 'eight, and each once');
  for (const f of ['check_buoyancy_guided_input_browser.cjs', 'check_buoyancy_guided_view_browser.cjs', 'check_buoyancy_guided_flow_browser.cjs']) assert.ok(fs.existsSync(path.join(root, 'scripts', f)), f);
});

console.log(`\nbuoyancy-guided site: ${tests} tests passed`);
