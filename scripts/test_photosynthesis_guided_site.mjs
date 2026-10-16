// B4 static gate for Science Lab 2.0 Pilot #5.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import cp from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ciWorkflow } from './ci_workflow_test_support.mjs';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const git = (...args) => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const PAGE = 'tools/science/photosynthesis-factor-guided.html';
const LEGACY = 'tools/photosynthesis-factor-lab.html';
const DIR = 'assets/photosynthesis-guided';
const html = read(PAGE);
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');
const ownJs = fs.readdirSync(path.join(root, DIR)).filter((n) => n.endsWith('.js')).sort();

test('visibility: noindex, self canonical, unlisted and absent from public indexes/resources', () => {
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.bhcs\.com\.tw\/tools\/science\/photosynthesis-factor-guided\.html">/);
  assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
  assert.ok(!read('sitemap.xml').includes('photosynthesis-factor-guided'), 'sitemap');
  for (const file of ['tools/science/index.html', 'ziyuan.html', 'guoxiao.html', 'guozhong.html', 'guozhong-lihua.html', 'index.html',
    'scripts/science/catalog.mjs', 'scripts/science/batch2.mjs', 'assets/researcher-lab.js', 'assets/science-lab.js', 'assets/site.js']) {
    assert.ok(!read(file).includes('photosynthesis-factor-guided'), `${file} does not mention the prototype`);
  }
});

test('nothing public links to the prototype and the legacy lab stays separate', () => {
  const pages = git('grep', '--untracked', '-l', 'photosynthesis-factor-guided', '--', '*.html').trim().split('\n').filter(Boolean);
  assert.deepEqual(pages, [PAGE], 'no other HTML page contains the guided page name');
  assert.ok(!read(LEGACY).includes('photosynthesis-factor-guided'), 'legacy does not link to guided');
  assert.ok(!html.includes('photosynthesis-factor-lab'), 'guided does not link to legacy');
});

test('page shape: shared/station CSS, analytics adapter before module, one h1/main/live region', () => {
  assert.ok(!html.includes('science-self-study') && !html.includes('lab-config'), 'not builder generated');
  assert.deepEqual([...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]),
    ['../../assets/science-guided/science-guided.css', '../../assets/photosynthesis-guided/photosynthesis-guided.css']);
  assert.deepEqual([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]),
    ['../../assets/science-events.js', '../../assets/photosynthesis-guided/main.js']);
  assert.match(html, /<script src="\.\.\/\.\.\/assets\/science-events\.js" defer><\/script>/);
  assert.match(html, /<script type="module" src="\.\.\/\.\.\/assets\/photosynthesis-guided\/main\.js"><\/script>/);
  assert.ok(!/<script>|<script type="text\/javascript">|\son[a-z]+="/.test(html), 'no inline JS or handler');
  assert.match(html, /<body class="photosynthesis-factor-guided" data-science-lab="photosynthesis-factor-guided">/);
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
  assert.equal((html.match(/<main[ >]/g) ?? []).length, 1);
  assert.equal((html.match(/aria-live=/g) ?? []).length, 1);
  assert.match(html, /id="pfg-announcer" aria-live="polite" aria-atomic="true"/);
  assert.deepEqual([...html.matchAll(/(?:href|src)="(https?:[^"]+)"/g)].map((m) => m[1]),
    ['https://www.bhcs.com.tw/tools/science/photosynthesis-factor-guided.html']);
  assert.ok(!/cdn\.|unpkg|jsdelivr|googleapis|gstatic|googletagmanager/.test(html + read(`${DIR}/photosynthesis-guided.css`)));
});

test('metadata and static HTML still do not give away the formal concept before the experiment', () => {
  assert.match(html, /<title>光合作用條件實驗（導引版原型）｜百宏文教<\/title>/);
  const head = html.slice(0, html.indexOf('</head>'));
  const metadata = [...head.matchAll(/<title>([^<]*)<\/title>|content="([^"]*)"/g)].map((m) => m[1] ?? m[2]).join(' ');
  assert.doesNotMatch(metadata, /限制因子|最低因子|最低條件/);
  assert.doesNotMatch(html.replace(/photosynthesis-factor-guided/g, ''), /限制因子|最低因子|最低條件/);
});

test('B4 page contains notebook, challenges, completion, restart and storage UI but no public rollout link', () => {
  for (const id of ['pfg-notebook', 'pfg-challenge', 'pfg-complete', 'pfg-restart', 'pfg-storage-note', 'pfg-privacy-note']) {
    assert.ok(html.includes(`id="${id}"`), id);
  }
  assert.deepEqual(ownJs, ['analytics.js', 'challenges.js', 'engine.js', 'input.js', 'main.js', 'model.js', 'persist.js', 'render.js', 'script.js']);
  assert.ok(!html.includes('查看進階版') && !html.includes('Advanced Mode'));
});

test('storage and analytics are isolated to their dedicated modules; no station module performs network I/O', () => {
  for (const f of ownJs) {
    const src = code(read(`${DIR}/${f}`));
    for (const bad of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'indexedDB', 'document.cookie', '__pfgTest', 'location.search', 'URLSearchParams', 'eval(', 'new Function']) {
      assert.ok(!src.includes(bad), `${f} uses ${bad}`);
    }
    if (f !== 'persist.js') {
      assert.ok(!src.includes('localStorage') && !src.includes('sessionStorage'), `${f} touches browser storage`);
    }
    if (f !== 'analytics.js') assert.ok(!src.includes('bhcsScienceTrack'), `${f} touches analytics adapter`);
  }
  assert.ok(code(read(`${DIR}/persist.js`)).includes('localStorage'), 'persist owns storage');
  assert.ok(code(read(`${DIR}/analytics.js`)).includes('bhcsScienceTrack'), 'analytics owns adapter');
});

test('imports stay inside station modules and shared Guided components', () => {
  for (const f of ownJs) {
    for (const [, spec] of read(`${DIR}/${f}`).matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)) {
      assert.ok(/^\.\/[a-z-]+\.js$/.test(spec) || spec === '../science-guided/components.js', `${f} imports ${spec}`);
    }
  }
  const main = read(`${DIR}/main.js`);
  for (const name of ['createActionBar', 'createAnnouncer', 'focusHandoff', 'renderStepNav', 'renderCoachCard', 'renderStatusBar',
    'renderDataCard', 'renderEvidenceCard', 'renderCompareCard', 'renderConceptReveal', 'createNotebook', 'createChallengeCard', 'renderCompletionCard']) {
    assert.ok(main.includes(name), `main uses shared ${name}`);
  }
  assert.match(main, /querySelector\('\[data-role="observation"\]'\)\?\.removeAttribute\('aria-live'\)/);
});

test('layering: science/renderer/input do not reach into page, storage or analytics layers', () => {
  for (const f of ['model.js', 'render.js', 'input.js']) {
    const src = read(`${DIR}/${f}`);
    assert.ok(!/from '\.\/(script|main|persist|analytics|challenges)\.js'/.test(src), `${f} reaches upward`);
    assert.ok(!src.includes('science-guided/components'), `${f} imports shared cards`);
  }
  const engine = read(`${DIR}/engine.js`);
  assert.ok(engine.includes("from './challenges.js'"), 'B4 engine may use pure challenge truth');
  assert.ok(!/from '\.\/(script|main|persist|analytics)\.js'/.test(engine), 'engine stays pure');
  assert.ok(!/from '\.\/main\.js'/.test(read(`${DIR}/script.js`)), 'script does not import glue');
});

test('local B4 browser gate and its support file are syntactically valid', () => {
  for (const file of ['scripts/check_photosynthesis_guided_flow_browser.cjs', 'scripts/photosynthesis_guided_test_support.cjs']) {
    assert.doesNotThrow(() => cp.execFileSync(process.execPath, ['--check', path.join(root, file)], { cwd: root, stdio: 'pipe' }), file);
  }
});

test('B5 browser wiring has not started; B4 unit/static tests run before math', () => {
  const wf = ciWorkflow();
  assert.ok(!wf.includes('check_photosynthesis_guided_'), 'photosynthesis browser gates stay local until B5');
  const pkg = JSON.parse(read('scripts/package.json')).scripts.test;
  const names = ['model', 'engine', 'render', 'input', 'challenges', 'persist', 'analytics', 'script', 'site'];
  const order = names.map((n) => pkg.indexOf(`test_photosynthesis_guided_${n}.mjs`));
  assert.ok(order.every((i, k) => i >= 0 && (k === 0 || i > order[k - 1])), 'B4 tests run in dependency order');
  assert.ok(order.at(-1) < pkg.indexOf('test_math_drills.mjs'), 'before math');
  assert.ok(!pkg.includes('check_photosynthesis'), 'browser gate is not part of npm test');
});

console.log(`photosynthesis-guided site: ${tests} tests passed`);
