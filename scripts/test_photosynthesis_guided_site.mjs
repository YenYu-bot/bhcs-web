// B3 static gate for Science Lab 2.0 Pilot #5: the photosynthesis Guided page is a noindex, unlisted prototype
// through Concept only. Run alone with: node scripts/test_photosynthesis_guided_site.mjs
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

test('visibility: noindex, self canonical, unlisted and absent from sitemap/resources/catalogs', () => {
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.bhcs\.com\.tw\/tools\/science\/photosynthesis-factor-guided\.html">/);
  assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
  assert.ok(!read('sitemap.xml').includes('photosynthesis-factor-guided'), 'sitemap');
  for (const f of ['tools/science/index.html', 'ziyuan.html', 'guoxiao.html', 'guozhong.html', 'guozhong-lihua.html', 'index.html',
    'scripts/science/catalog.mjs', 'scripts/science/batch2.mjs', 'assets/researcher-lab.js', 'assets/science-lab.js', 'assets/science-events.js', 'assets/site.js']) {
    assert.ok(!read(f).includes('photosynthesis-factor-guided'), `${f} does not mention the prototype`);
  }
});

test('nothing public links to the prototype and the legacy lab stays separate', () => {
  const pages = git('grep', '--untracked', '-l', 'photosynthesis-factor-guided', '--', '*.html').trim().split('\n').filter(Boolean);
  assert.deepEqual(pages, [PAGE], 'no other HTML page contains the guided page name');
  assert.ok(!read(LEGACY).includes('photosynthesis-factor-guided'), 'legacy does not link to guided');
  assert.ok(!html.includes('photosynthesis-factor-lab'), 'guided does not link to legacy');
});

test('page shape: shared then station CSS, one module, no inline JS/CDN, one h1/main and one shipped announcer', () => {
  assert.ok(!html.includes('science-self-study') && !html.includes('lab-config'), 'not a builder-generated station');
  assert.deepEqual([...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]),
    ['../../assets/science-guided/science-guided.css', '../../assets/photosynthesis-guided/photosynthesis-guided.css']);
  assert.deepEqual([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]), ['../../assets/photosynthesis-guided/main.js']);
  assert.match(html, /<script type="module" src="\.\.\/\.\.\/assets\/photosynthesis-guided\/main\.js"><\/script>/);
  assert.ok(!/<script>|<script type="text\/javascript">|\son[a-z]+="/.test(html), 'no inline JS or inline handler');
  assert.ok(!html.includes('science-events.js'), 'no analytics adapter in B3');
  assert.ok(!/researcher-lab|site\.js/.test(html), 'no legacy shell runtime');
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
  assert.equal((html.match(/<main[ >]/g) ?? []).length, 1);
  assert.equal((html.match(/aria-live=/g) ?? []).length, 1);
  assert.match(html, /id="pfg-announcer" aria-live="polite" aria-atomic="true"/);
  assert.deepEqual([...html.matchAll(/(?:href|src)="(https?:[^"]+)"/g)].map((m) => m[1]),
    ['https://www.bhcs.com.tw/tools/science/photosynthesis-factor-guided.html'], 'canonical is the only absolute URL');
  assert.ok(!/cdn\.|unpkg|jsdelivr|googleapis|gstatic|googletagmanager/.test(html + read(`${DIR}/photosynthesis-guided.css`)), 'no CDN/external font');
});

test('page metadata does not give away the formal concept before the experiment', () => {
  assert.match(html, /<title>光合作用條件實驗（導引版原型）｜百宏文教<\/title>/);
  const head = html.slice(0, html.indexOf('</head>'));
  const metadata = [...head.matchAll(/<title>([^<]*)<\/title>|content="([^"]*)"/g)].map((m) => m[1] ?? m[2]).join(' ');
  assert.doesNotMatch(metadata, /限制因子|最低因子|最低條件/);
  assert.doesNotMatch(html.replace(/photosynthesis-factor-guided/g, ''), /限制因子|最低因子|最低條件/, 'static page body contains no formal answer');
});

test('B3 only: no notebook, challenge, complete, persistence or analytics module', () => {
  for (const id of ['pfg-notebook', 'pfg-challenge', 'pfg-complete', 'pfg-restart', 'pfg-storage-note']) {
    assert.ok(!html.includes(`id="${id}"`), `${id} is not present`);
  }
  assert.deepEqual(ownJs, ['engine.js', 'input.js', 'main.js', 'model.js', 'render.js', 'script.js']);
});

test('shipped station code has no network/storage/analytics/debug/test hook', () => {
  for (const f of ownJs) {
    const src = code(read(`${DIR}/${f}`));
    for (const bad of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'localStorage', 'sessionStorage', 'indexedDB',
      'document.cookie', 'bhcsScienceTrack', '__pfgTest', 'location.search', 'URLSearchParams', 'eval(', 'new Function']) {
      assert.ok(!src.includes(bad), `${f} uses ${bad}`);
    }
  }
});

test('imports stay inside the station and shared Guided components', () => {
  for (const f of ownJs) {
    for (const [, spec] of read(`${DIR}/${f}`).matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)) {
      assert.ok(/^\.\/[a-z-]+\.js$/.test(spec) || spec === '../science-guided/components.js', `${f} imports ${spec}`);
    }
  }
  const main = read(`${DIR}/main.js`);
  for (const name of ['createActionBar', 'createAnnouncer', 'focusHandoff', 'renderStepNav', 'renderCoachCard', 'renderStatusBar',
    'renderDataCard', 'renderEvidenceCard', 'renderCompareCard', 'renderConceptReveal']) {
    assert.ok(main.includes(name), `main uses shared ${name}`);
  }
  assert.match(main, /querySelector\('\[data-role="observation"\]'\)\?\.removeAttribute\('aria-live'\)/,
    'the full page removes the standalone bench live region so only the shared announcer speaks');
});

test('layering: B1/B2 do not reach up into the learner script or page glue', () => {
  for (const f of ['model.js', 'engine.js', 'render.js', 'input.js']) {
    const src = read(`${DIR}/${f}`);
    assert.ok(!/from '\.\/(script|main)\.js'/.test(src), `${f} imports B3 layer`);
    assert.ok(!src.includes('science-guided/components'), `${f} imports shared cards`);
  }
  assert.ok(!/from '\.\/main\.js'/.test(read(`${DIR}/script.js`)), 'script does not import page glue');
});

test('photosynthesis browser gates remain local until B5; unit/static tests are in npm test in order', () => {
  const wf = ciWorkflow();
  assert.ok(!wf.includes('check_photosynthesis_guided_'), 'not wired into CI until B5');
  const pkg = JSON.parse(read('scripts/package.json')).scripts.test;
  const order = ['model', 'engine', 'render', 'input', 'script', 'site'].map((n) => pkg.indexOf(`test_photosynthesis_guided_${n}.mjs`));
  assert.ok(order.every((i, k) => i >= 0 && (k === 0 || i > order[k - 1])), 'station tests are ordered model → site');
  assert.ok(order.at(-1) < pkg.indexOf('test_math_drills.mjs'), 'station tests stay before math');
  assert.ok(!pkg.includes('check_photosynthesis'), 'browser checks are not part of npm test');
});

console.log(`photosynthesis-guided site: ${tests} tests passed`);
