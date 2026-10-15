// B3 gate (static): the guided acid–base prototype is a hand-written, unlisted page that leaves every existing contract
// alone. Run on its own: node scripts/test_acid_base_guided_site.mjs
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
const PAGE = 'tools/science/acid-base-guided.html';
const html = read(PAGE);
const DIR = 'assets/acid-base-guided';
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');
const ownJs = fs.readdirSync(path.join(root, DIR)).filter((n) => n.endsWith('.js')).sort();

test('visibility: noindex, self canonical, and not in the sitemap, directory, resources, catalogs or home pages', () => {
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.bhcs\.com\.tw\/tools\/science\/acid-base-guided\.html">/);
  assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
  assert.ok(!read('sitemap.xml').includes('acid-base-guided'), 'sitemap');
  for (const f of ['tools/science/index.html', 'ziyuan.html', 'guoxiao.html', 'guozhong.html', 'guozhong-lihua.html', 'index.html',
    'scripts/science/catalog.mjs', 'scripts/science/batch2.mjs', 'assets/researcher-lab.js', 'assets/science-lab.js', 'assets/science-events.js', 'assets/site.js']) {
    assert.ok(!read(f).includes('acid-base-guided'), `${f} does not mention the prototype`);
  }
});

test('nothing public links to it: only its own files, tests and the test list name it', () => {
  const pages = git('grep', '--untracked', '-l', 'acid-base-guided', '--', '*.html').trim().split('\n').filter(Boolean);
  assert.deepEqual(pages, [PAGE], 'no other HTML page contains the prototype\'s name');
  const everywhere = git('grep', '--untracked', '-l', 'acid-base-guided').trim().split('\n').filter(Boolean);
  const allowed = [/^assets\/acid-base-guided\//, /^tools\/science\/acid-base-guided\.html$/, /^scripts\/(?:check|test)_acid_base_guided_[a-z_]+\.(?:mjs|cjs)$/, /^scripts\/acid_base_guided_test_support\.cjs$/, /^scripts\/package\.json$/];
  assert.deepEqual(everywhere.filter((f) => !allowed.some((re) => re.test(f))), [], 'only the prototype\'s own files and tests mention it');
});

test('the legacy lab and the prototype do not link to each other', () => {
  assert.ok(!read('tools/acid-base-indicator-lab.html').includes('acid-base-guided'), 'the legacy lab does not link to the guided page');
  assert.ok(!html.includes('acid-base-indicator-lab'), 'the prototype does not link to the legacy lab yet');
});

test('page shape: hand-written; shared then station CSS; one module; no inline JS, CDN or external runtime; one h1, main and live region', () => {
  assert.ok(!html.includes('science-self-study') && !html.includes('lab-config'), 'not a builder-generated lab page');
  assert.deepEqual([...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]), ['../../assets/science-guided/science-guided.css', '../../assets/acid-base-guided/acid-base-guided.css']);
  assert.deepEqual([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]), ['../../assets/acid-base-guided/main.js']);
  assert.match(html, /<script type="module" src="\.\.\/\.\.\/assets\/acid-base-guided\/main\.js"><\/script>/);
  assert.ok(!/<script>|<script type="text\/javascript">|\son[a-z]+="/.test(html), 'no inline script or handler');
  assert.ok(!html.includes('science-events.js'), 'no analytics adapter in this stage');
  assert.ok(!/researcher-lab|site\.js/.test(html), 'no legacy shell');
  assert.match(html, /<body class="acid-base-guided">/);
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
  assert.equal((html.match(/<main[ >]/g) ?? []).length, 1);
  assert.equal((html.match(/aria-live=/g) ?? []).length, 1);
  assert.match(html, /<div class="sg-sr" id="abg-announcer" aria-live="polite" aria-atomic="true"><\/div>/);
  assert.deepEqual([...html.matchAll(/(?:href|src)="(https?:[^"]+)"/g)].map((m) => m[1]), ['https://www.bhcs.com.tw/tools/science/acid-base-guided.html'], 'the canonical is the only absolute URL');
  assert.ok(!/cdn\.|unpkg|jsdelivr|googleapis|gstatic|googletagmanager/.test(html + read(`${DIR}/acid-base-guided.css`)), 'no CDN or external font');
});

test('the title and description name nothing the learner should find out', () => {
  assert.match(html, /<title>未知液體辨識（導引版原型）｜百宏文教<\/title>/);
  const head = html.slice(0, html.indexOf('</head>'));
  const text = [...head.matchAll(/<title>([^<]*)<\/title>|content="([^"]*)"/g)].map((m) => m[1] ?? m[2]).join(' ');
  assert.doesNotMatch(text, /酸|鹼|中性|pH/);
  assert.doesNotMatch(html.replace(/<link rel="canonical"[^>]*>/, '').replace(/acid-base-guided/g, ''), /酸|鹼|中性|pH/, 'the static HTML holds no class name or pH (the URL aside)');
});

test('B3 only: no notebook, challenge or finish cards; no persistence, analytics or challenge modules', () => {
  for (const id of ['abg-notebook', 'abg-challenge', 'abg-complete', 'abg-restart', 'abg-storage-note']) assert.ok(!html.includes(`id="${id}"`), `${id} is not in the page yet`);
  assert.deepEqual(ownJs, ['engine.js', 'input.js', 'main.js', 'model.js', 'render.js', 'script.js']);
});

test('no network, storage, analytics, test hook or debug switch in the shipped code', () => {
  for (const f of ownJs) {
    const src = code(read(`${DIR}/${f}`));
    for (const bad of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'bhcsScienceTrack', '__abgTest', 'location.search', 'URLSearchParams', 'eval(', 'new Function']) {
      assert.ok(!src.includes(bad), `${f} uses ${bad}`);
    }
  }
});

test('imports stay inside the station and the shared layer', () => {
  for (const f of ownJs) {
    for (const [, spec] of read(`${DIR}/${f}`).matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)) {
      assert.ok(/^\.\/[a-z-]+\.js$/.test(spec) || spec === '../science-guided/components.js', `${f} imports ${spec}`);
    }
  }
  const main = read(`${DIR}/main.js`);
  assert.match(main, /from '\.\.\/science-guided\/components\.js'/);
  for (const name of ['createActionBar', 'createAnnouncer', 'focusHandoff', 'renderStepNav', 'renderCoachCard', 'renderStatusBar', 'renderDataCard', 'renderEvidenceCard', 'renderCompareCard', 'renderConceptReveal']) {
    assert.ok(main.includes(name), `main uses the shared ${name}`);
  }
});

test('layering: B1 and B2 are present and never reach up into the page script or the glue', () => {
  for (const f of ['model.js', 'engine.js', 'render.js', 'input.js']) {
    const src = read(`${DIR}/${f}`);
    assert.ok(!/from '\.\/(script|main)\.js'/.test(src), `${f} imports the page layer`);
    assert.ok(!src.includes('science-guided/components'), `${f} imports the shared cards`);
  }
  assert.ok(!/from '\.\/main\.js'/.test(read(`${DIR}/script.js`)), 'the script does not import the glue');
});

test('the browser checks for this station are local only: the workflow does not run them yet', () => {
  const wf = read('.github/workflows/researcher-lab-check.yml');
  assert.ok(!wf.includes('acid_base') && !wf.includes('acid-base'), 'not wired into CI until B5');
  const pkg = JSON.parse(read('scripts/package.json')).scripts.test;
  const order = ['model', 'engine', 'render', 'input', 'script', 'site'].map((n) => pkg.indexOf(`test_acid_base_guided_${n}.mjs`));
  assert.ok(order.every((i, k) => i > 0 && (k === 0 || i > order[k - 1])), 'the station tests run in order');
  assert.ok(order.at(-1) < pkg.indexOf('test_math_drills.mjs'), 'before the math tests');
  assert.ok(!pkg.includes('check_acid_base'), 'browser checks are not part of npm test');
});

console.log(`acid-base-guided site: ${tests} tests passed`);
