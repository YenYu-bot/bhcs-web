// Shared helpers for the guided acid–base browser checks (Pilot #4, B2).
// There is no production page yet (B3). The checks mount the bench on a test-only fixture page that exists only in this
// server's memory: it wires the real engine, renderer and input together the way a page adapter would, and exposes a
// test hook. Nothing is written to tools/ and no repository file carries the hook.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const root = path.resolve(__dirname, '..');
const FIXTURE = '/__acid-base-bench-fixture.html';

const FIXTURE_HTML = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>試管實驗桌（測試頁）</title>
<link rel="stylesheet" href="/assets/acid-base-guided/acid-base-guided.css">
<style>body { margin: 0; padding: 16px; background: #FCFCFA; } h1 { font: 700 1.2rem system-ui, sans-serif; margin: 0 0 12px; } .filler { height: 1200px; }</style>
</head>
<body>
<main>
<h1>試管實驗桌</h1>
<div id="host"></div>
<div class="filler" data-role="filler"></div>
</main>
<script type="module">
import { createInitialState, reduce, TRIAL_INDICATOR, observationFor } from '/assets/acid-base-guided/engine.js';
import { SAMPLE_IDS } from '/assets/acid-base-guided/model.js';
import { createAcidBaseBench } from '/assets/acid-base-guided/render.js';
import { bindAcidBaseInput } from '/assets/acid-base-guided/input.js';

let state = createInitialState(), forcedLock = false, shown = 'blue-litmus';
const log = [];
const host = document.getElementById('host');
const bench = createAcidBaseBench(host);
const active = () => TRIAL_INDICATOR[state.phase] ?? null;
// What a page adapter does: records -> observations (model.deriveObservation, through the engine), plus tested / locked.
function view() {
  const indicator = active() ?? shown;
  shown = indicator;
  return {
    activeIndicatorId: indicator,
    locked: forcedLock || !active(),
    samples: SAMPLE_IDS.map((sampleId) => ({
      sampleId,
      tested: Boolean(observationFor(state, sampleId, indicator)),
      observations: ['blue-litmus', 'red-litmus'].map((i) => observationFor(state, sampleId, i)).filter(Boolean),
    })),
  };
}
const paint = () => bench.update(view());
function dispatch(action) {
  const r = reduce(state, action);
  if (r.accepted) { state = r.state; paint(); }
  return { accepted: r.accepted, reason: r.reason };
}
const locked = () => forcedLock || !active();
bindAcidBaseInput({
  root: host,
  getLocked: locked,
  canDip: (id) => !locked() && !observationFor(state, id, active()),
  onDip: (id) => { log.push(id); dispatch({ type: 'DIP', sampleId: id, indicatorId: active() }); },
});
dispatch({ type: 'START' }); dispatch({ type: 'BEGIN' });
paint();
window.__abg = {
  dispatch, log,
  records: () => state.records.map((r) => r.sampleId + ':' + r.indicatorId),
  phase: () => state.phase,
  setLocked: (v) => { forcedLock = v === true; paint(); },
  toTrial2() {
    for (const a of [{ type: 'CONTINUE' }, { type: 'ANSWER_COMPARE', compare: 'c1', question: 'patternCount', answer: 'two' },
      { type: 'ANSWER_COMPARE', compare: 'c1', question: 'evidenceSufficiency', answer: 'need-more-evidence' }, { type: 'CONTINUE' }]) {
      const r = dispatch(a); if (!r.accepted) throw new Error(a.type + ' ' + r.reason);
    }
  },
};
window.__abgReady = true;
</script>
</body>
</html>
`;

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };

/** A static server for the repository root, plus the in-memory fixture page. */
function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/favicon.ico') { res.writeHead(204).end(); return; }
    if (url.pathname === FIXTURE) { res.writeHead(200, { 'Content-Type': mime['.html'] }).end(FIXTURE_HTML); return; }
    const file = path.resolve(root, '.' + url.pathname);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    try { res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file)); } catch { res.writeHead(404).end(); }
  });
}

/** Same-origin only; `external` collects every other URL the page tried to load. */
async function guardContext(ctx, base, external = []) {
  await ctx.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith(base)) return route.continue();
    external.push(url);
    return route.abort();
  });
}

async function openFixture(browser, base, { viewport, touch = false, reducedMotion, forcedColors, external = [], errors = [] }) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, ...(reducedMotion ? { reducedMotion } : {}), ...(forcedColors ? { forcedColors } : {}) });
  await guardContext(ctx, base, external);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base + FIXTURE);
  await page.waitForFunction(() => window.__abgReady === true);
  return { ctx, page };
}

/** axe-core on the current page state. Fails with a readable list when anything is reported. */
async function axeScan(page, label) {
  const file = require.resolve('axe-core', { paths: [__dirname] });
  await page.addScriptTag({ path: file });
  const result = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }, resultTypes: ['violations'] }));
  const lines = result.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
  if (lines.length) throw new Error(`axe @ ${label}: ${lines.join(' ;; ')}`);
}

const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const launchOptions = () => (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {});

/** A real touch drag through the DevTools protocol (Playwright has no touch-move API). */
async function touchDrag(page, from, to, steps = 8) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y }] });
  for (let i = 1; i <= steps; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from.x + (to.x - from.x) * i / steps, y: from.y + (to.y - from.y) * i / steps }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await settle(page);
}

// ---- the production page (B3) ---------------------------------------------------------------------------------------
// The page ships no test hook. A check that needs to read the state gets one by having the browser context serve main.js
// with one line appended (same module scope); nothing is added to the file on disk. Every write to the live region is
// recorded from the first paint, so a check can read the whole announcement history.
const PAGE = '/tools/science/acid-base-guided.html';
const MAIN = '/assets/acid-base-guided/main.js';
const HOOK = '\nwindow.__abgTest = { getState: () => state, dispatch };\n';
const RECORD_ANNOUNCER = `window.__abgSaid = [];
document.addEventListener('DOMContentLoaded', () => {
  const live = document.getElementById('abg-announcer');
  if (live) new MutationObserver(() => { if (live.textContent) window.__abgSaid.push(live.textContent); }).observe(live, { childList: true, characterData: true, subtree: true });
});`;

async function openPage(browser, base, { viewport, touch = false, hook = true, external = [], errors = [] }) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch });
  await ctx.route('**/*', (route) => {
    const url = route.request().url();
    if (!url.startsWith(base)) { external.push(url); return route.abort(); }
    if (hook && new URL(url).pathname === MAIN) return route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(root, MAIN), 'utf8') + HOOK });
    return route.continue();
  });
  await ctx.addInitScript(RECORD_ANNOUNCER);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base + PAGE);
  await page.waitForFunction(() => document.getElementById('abg-cta') && !document.getElementById('abg-cta').hidden);
  return { ctx, page };
}

module.exports = { createServer, openFixture, openPage, axeScan, settle, launchOptions, touchDrag, FIXTURE, PAGE, MAIN, root };
