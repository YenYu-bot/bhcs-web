// Browser-test support for Science Lab 2.0 Pilot #5 B3-B4.
// Production ships no test hook. Tests may append one to main.js and replace science-events.js with a local spy,
// so the browser gate never reaches an external analytics transport.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const root = path.resolve(__dirname, '..');
const PAGE = '/tools/science/photosynthesis-factor-guided.html';
const MAIN = '/assets/photosynthesis-guided/main.js';
const ADAPTER = '/assets/science-events.js';
const HOOK = '\nwindow.__pfgTest = { getState: () => state, dispatch };\n';
const ADAPTERS = {
  spy: 'window.__testScienceEvents = [];\nwindow.bhcsScienceTrack = (...args) => { window.__testScienceEvents.push(args); };\n',
  throw: 'window.__testScienceEvents = [];\nwindow.bhcsScienceTrack = (...args) => { window.__testScienceEvents.push(args); throw new Error("adapter down"); };\n',
  absent: 'window.__testScienceEvents = [];\n',
};
const RECORD_ANNOUNCER = `
window.__pfgSaid = [];
document.addEventListener('DOMContentLoaded', () => {
  const live = document.getElementById('pfg-announcer');
  if (live) new MutationObserver(() => {
    if (live.textContent) window.__pfgSaid.push(live.textContent);
  }).observe(live, { childList: true, characterData: true, subtree: true });
});
`;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/favicon.ico') { res.writeHead(204).end(); return; }
    const file = path.resolve(root, '.' + url.pathname);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    try {
      res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
      res.end(fs.readFileSync(file));
    } catch {
      res.writeHead(404).end();
    }
  });
}

async function routePage(ctx, base, { hook = true, adapter = 'spy', external = [] } = {}) {
  if (!Object.hasOwn(ADAPTERS, adapter)) throw new Error(`unknown adapter mode ${adapter}`);
  await ctx.route('**/*', (route) => {
    const url = route.request().url();
    if (!url.startsWith(base)) { external.push(url); return route.abort(); }
    const pathname = new URL(url).pathname;
    if (pathname === ADAPTER) return route.fulfill({
      status: 200, contentType: 'text/javascript; charset=utf-8', body: ADAPTERS[adapter],
    });
    if (hook && pathname === MAIN) return route.fulfill({
      status: 200,
      contentType: 'text/javascript; charset=utf-8',
      body: fs.readFileSync(path.join(root, MAIN), 'utf8') + HOOK,
    });
    return route.continue();
  });
}

async function openPage(browser, base, {
  viewport,
  touch = false,
  reducedMotion,
  forcedColors,
  hook = true,
  adapter = 'spy',
  external = [],
  errors = [],
  ctx: reuse = null,
} = {}) {
  const ctx = reuse ?? await browser.newContext({
    viewport,
    hasTouch: touch,
    isMobile: touch,
    ...(reducedMotion ? { reducedMotion } : {}),
    ...(forcedColors ? { forcedColors } : {}),
  });
  if (!reuse) {
    await routePage(ctx, base, { hook, adapter, external });
    await ctx.addInitScript(RECORD_ANNOUNCER);
  }
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base + PAGE);
  await page.waitForFunction(() => document.getElementById('main')?.dataset.phase);
  return { ctx, page };
}

async function axeScan(page, label) {
  const file = require.resolve('axe-core', { paths: [__dirname] });
  await page.addScriptTag({ path: file });
  const result = await page.evaluate(() => window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    resultTypes: ['violations'],
  }));
  const lines = result.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
  if (lines.length) throw new Error(`axe @ ${label}: ${lines.join(' ;; ')}`);
}

const settle = async (page) => {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForTimeout(70);
};
const launchOptions = () => (
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}
);

module.exports = { createServer, openPage, axeScan, settle, launchOptions, PAGE, MAIN, ADAPTER, root };
