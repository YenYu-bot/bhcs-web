// B3/B4 gate (static): the guided acid–base prototype is a hand-written, unlisted page that leaves every existing contract
// alone. Run on its own: node scripts/test_acid_base_guided_site.mjs
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

test('page shape: hand-written; shared then station CSS; the analytics adapter then the module; no inline JS or CDN; one h1, main and live region', () => {
  assert.ok(!html.includes('science-self-study') && !html.includes('lab-config'), 'not a builder-generated lab page');
  assert.deepEqual([...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]), ['../../assets/science-guided/science-guided.css', '../../assets/acid-base-guided/acid-base-guided.css']);
  assert.deepEqual([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]), ['../../assets/science-events.js', '../../assets/acid-base-guided/main.js']);
  assert.match(html, /<script src="\.\.\/\.\.\/assets\/science-events\.js" defer><\/script>/);
  assert.match(html, /<script type="module" src="\.\.\/\.\.\/assets\/acid-base-guided\/main\.js"><\/script>/);
  assert.ok(!/<script>|<script type="text\/javascript">|\son[a-z]+="/.test(html), 'no inline script or handler');
  assert.ok(!/researcher-lab|site\.js/.test(html), 'no legacy shell');
  assert.match(html, /<body class="acid-base-guided" data-science-lab="acid-base-guided">/);
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

test('B4 cards and footer: notebook, challenge, finish, storage note, restart and privacy note, each once', () => {
  for (const id of ['abg-notebook', 'abg-notebook-title', 'abg-challenge', 'abg-challenge-title', 'abg-complete', 'abg-complete-title', 'abg-storage-note', 'abg-restart', 'abg-privacy-note']) {
    assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) ?? []).length, 1, id);
  }
  for (const attr of ['data-abg-notebook-body', 'data-abg-challenge-body', 'data-abg-complete-body']) assert.equal((html.match(new RegExp(attr, 'g')) ?? []).length, 1, attr);
  assert.match(html, /<button type="button" class="abg-link-action" id="abg-restart" hidden><\/button>/);
  assert.deepEqual(ownJs, ['analytics.js', 'challenges.js', 'engine.js', 'input.js', 'main.js', 'model.js', 'persist.js', 'render.js', 'script.js']);
});

test('no network, test hook or debug switch in the shipped code; only persist.js touches storage, only analytics.js the adapter', () => {
  for (const f of ownJs) {
    const src = code(read(`${DIR}/${f}`));
    for (const bad of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'gtag', 'dataLayer', 'sessionStorage', 'indexedDB', 'document.cookie', '__abgTest', 'location.search', 'URLSearchParams', 'eval(', 'new Function']) {
      assert.ok(!src.includes(bad), `${f} uses ${bad}`);
    }
    if (f !== 'persist.js') assert.ok(!/localStorage|getItem|setItem|removeItem/.test(src), `${f} touches storage`);
    if (f !== 'analytics.js') assert.ok(!src.includes('bhcsScienceTrack'), `${f} touches the analytics adapter`);
  }
});

test('responsibility boundaries: pure modules stay pure, the glue owns the DOM', () => {
  for (const f of ['model.js', 'engine.js', 'challenges.js', 'persist.js', 'analytics.js', 'script.js']) {
    const src = code(read(`${DIR}/${f}`));
    assert.ok(!/document\.|querySelector|addEventListener/.test(src), `${f} touches the DOM`);
  }
  const imports = (f) => [...read(`${DIR}/${f}`).matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1]);
  assert.deepEqual(imports('challenges.js'), ['./model.js']);
  assert.deepEqual(imports('analytics.js'), []);
  assert.deepEqual(imports('persist.js').sort(), ['./challenges.js', './engine.js', './model.js']);
  for (const f of ['challenges.js', 'persist.js', 'analytics.js', 'engine.js']) assert.ok(!/[\u4e00-\u9fff]/.test(code(read(`${DIR}/${f}`))), `${f} holds learner wording`);
  const main = read(`${DIR}/main.js`);
  for (const name of ['createStore', 'createTracker', 'analyticsFor', 'createNotebook', 'createChallengeCard', 'renderCompletionCard']) assert.ok(main.includes(name), `main uses ${name}`);
  assert.match(main, /addEventListener\('pagehide'/); assert.match(main, /visibilitychange/);
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

test('layering: the lower modules never reach up into the page script or the glue', () => {
  for (const f of ['model.js', 'engine.js', 'render.js', 'input.js', 'challenges.js', 'persist.js', 'analytics.js']) {
    const src = read(`${DIR}/${f}`);
    assert.ok(!/from '\.\/(script|main)\.js'/.test(src), `${f} imports the page layer`);
    assert.ok(!src.includes('science-guided/components'), `${f} imports the shared cards`);
  }
  assert.ok(!/from '\.\/main\.js'/.test(read(`${DIR}/script.js`)), 'the script does not import the glue');
});

test('CI runs the three browser checks for this station: once each, in order, in the guided job after its Chromium install and the microscope gates; CI Gate also needs the build and unit tests', () => {
  const wf = ciWorkflow();
  const jobs = ciJobs(wf);
  const job = jobs['science-guided'];
  assert.ok(job, 'the science-guided job exists');
  const steps = job.steps;
  const at = (pred, label) => { const i = steps.findIndex(pred); assert.ok(i >= 0, `missing step in science-guided: ${label}`); return i; };
  const GATES = [
    ['input', 'Check guided acid-base input layer in a real browser'],
    ['view', 'Check guided acid-base bench states and page layout in a real browser'],
    ['flow', 'Check guided acid-base full student flow in a real browser'],
  ];
  const allSteps = Object.values(jobs).flatMap((j) => j.steps);
  assert.equal(allSteps.filter((st) => /acid[-_]base/.test(st) && !st.includes('upload-artifact')).length, 3, 'exactly three acid-base browser steps in the whole workflow');
  const idx = GATES.map(([kind, name]) => {
    const script = `scripts/check_acid_base_guided_${kind}_browser.cjs`;
    assert.equal(wf.split(script).length, 2, `${script} runs exactly once`);
    const i = at((st) => st.includes(script), kind);
    assert.equal(steps[i], `      - name: ${name}\n        env:\n          NODE_PATH: /tmp/bhcs-composition/node_modules\n        run: node ${script}`, `${kind} step text`);
    return i;
  });
  assert.ok(idx[0] < idx[1] && idx[1] < idx[2], 'input → view → flow');
  for (const i of [at((st) => st.includes(CHROMIUM_INSTALL), 'Chromium install'), at((st) => st.includes('check_microscope_guided_flow_browser.cjs'), 'microscope full flow')]) {
    assert.ok(i < idx[0], `the acid-base checks come after: ${steps[i].split('\n')[0].trim()}`);
  }
  assert.equal(job.text.split(CHROMIUM_INSTALL).length, 2, 'one Chromium install in the guided job');
  const core = jobs.core.steps;
  for (const [needle, label] of [['build_sitemap.py', 'builders'], ['run: git diff --exit-code', 'git diff'], ['check_resources.py', 'resources'], ['npm test --prefix scripts', 'npm test'], ['check_science_integration.cjs', 'science integration']]) {
    assert.ok(core.some((st) => st.includes(needle)), `core runs ${label}`);
  }
  assert.ok(['core', 'science-guided'].every((n) => jobs.gate.needs.includes(n)), 'CI Gate needs both core and science-guided');
  const pkg = JSON.parse(read('scripts/package.json')).scripts.test;
  const names = ['model', 'engine', 'render', 'input', 'script', 'site', 'challenges', 'persist', 'analytics'];
  const order = names.map((n) => pkg.indexOf(`test_acid_base_guided_${n}.mjs`));
  assert.ok(order.every((i, k) => i > 0 && (k === 0 || i > order[k - 1])), 'the station tests run in order');
  for (const n of names) assert.equal(pkg.split(`test_acid_base_guided_${n}.mjs`).length, 2, `${n} runs once`);
  assert.ok(order.at(-1) < pkg.indexOf('test_math_drills.mjs'), 'before the math tests');
  assert.ok(!pkg.includes('check_acid_base'), 'browser checks stay workflow steps, not part of npm test');
});

test('CI keeps the view and flow screenshots for 14 days, next to the other guided stations\' uploads', () => {
  const jobs = ciJobs();
  const steps = jobs['science-guided'].steps;
  const all = Object.values(jobs).flatMap((j) => j.steps);
  const upload = (name, dir) => {
    assert.equal(all.filter((st) => st.includes(`name: ${name}\n`) || st.endsWith(`name: ${name}`)).length, 1, `${name} uploaded exactly once`);
    const i = steps.findIndex((st) => st.includes(`name: ${name}\n`) || st.endsWith(`name: ${name}`));
    assert.ok(i >= 0, `${name} is uploaded by the guided job`);
    assert.equal(steps[i], `      - uses: actions/upload-artifact@v4\n        if: always()\n        with:\n          name: ${name}\n          path: ${dir}\n          retention-days: 14`, `${name} upload`);
    return i;
  };
  const view = upload('acid-base-view-review', 'acid-base-view-artifacts/');
  const flow = upload('acid-base-flow-review', 'acid-base-flow-artifacts/');
  const microscope = steps.findIndex((st) => st.includes('name: microscope-flow-review'));
  assert.ok(microscope >= 0 && microscope < view && view < flow, 'after the microscope uploads, in the same job');
  assert.ok(!all.some((st) => st.includes('acid-base-input')), 'the input check makes no screenshots, so nothing is uploaded for it');
  for (const dir of ['/acid-base-view-artifacts/', '/acid-base-flow-artifacts/']) assert.ok(read('.gitignore').split('\n').includes(dir), `${dir} is ignored`);
});

console.log(`acid-base-guided site: ${tests} tests passed`);
