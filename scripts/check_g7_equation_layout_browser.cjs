// Deterministic regression for the G7 phone worksheet; no external requests or math changes.
// The negative control removes only the new screen style and must expose the original defect.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.SITE_OUTPUT || 'site-artifacts');
const file = 'tools/math/g7-linear-equation.html';
const styleId = 'g7-screen-equation-columns';
const origin = 'http://127.0.0.1:4173';
const results = [];
const assets = new Map([
  ['/' + file, { contentType: 'text/html; charset=utf-8', body: fs.readFileSync(path.join(root, file), 'utf8') }],
  ['/assets/a4-preview-fit.js', { contentType: 'text/javascript; charset=utf-8', body: fs.readFileSync(path.join(root, 'assets/a4-preview-fit.js'), 'utf8') }],
]);

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
}

async function open(browser, width, withoutFix = false) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    const asset = url.origin === origin && assets.get(url.pathname);
    return asset ? route.fulfill({ status: 200, ...asset }) : route.abort();
  });
  await context.addInitScript(() => {
    let seed = 20261026;
    window.__g7Seed = value => { seed = value >>> 0; };
    Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin + '/' + file, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#' + styleId).count(), 1, 'the scoped phone style exists once');
  if (withoutFix) await page.locator('#' + styleId).evaluate(node => node.remove());
  await settle(page);
  return { context, page, errors };
}

async function recordedFixture(page, columns = 2) {
  // Exact equation #8 from failed CI job 121665190150, rendered by the unmodified page helpers.
  // Repeating it in each column makes min-content expansion deterministic, not seed-luck dependent.
  await page.evaluate(columns => {
    const lhs = S(T(1, Ln(lin(-3, 8))), T(-1, K(new F(7, 8), Ln(lin(-3, -12)))));
    const rhs = S(T(-1, K(new F(13, 8), Ln(lin(-6, -3)))), T(-1, N(37)));
    const question = render(lhs, false) + '<span class="op">＝</span>' + render(rhs, false);
    const grid = document.querySelectorAll('#out .grid')[1];
    grid.className = 'grid c' + columns;
    grid.dataset.g7Fixture = 'recorded-ci-equation';
    grid.innerHTML = Array.from({ length: columns * 2 }, (_, i) =>
      `<div class="prob"><div class="q"><span class="no">(${i + 1})</span><span class="expr">${question}</span></div><div class="work"><span class="ans"><b>x＝5</b></span></div></div>`
    ).join('');
    dispatchEvent(new Event('resize'));
  }, columns);
  await settle(page);
}

async function measure(page) {
  return page.evaluate(() => {
    const sheet = document.querySelector('#out > .sheet');
    const paper = sheet.getBoundingClientRect();
    const rect = element => {
      const r = element.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const visible = element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden';
    const badBounds = [], clipped = [];
    for (const element of sheet.querySelectorAll('.q,.expr,.expr *,.work,.ans,.ans *')) {
      if (!visible(element)) continue;
      const r = element.getBoundingClientRect();
      if (r.left < -1 || r.right > innerWidth + 1 || r.left < paper.left - 1 || r.right > paper.right + 1) {
        badBounds.push({ className: element.className, text: element.textContent, ...rect(element) });
      }
      for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
        const s = getComputedStyle(ancestor);
        if (['hidden', 'clip'].includes(s.overflowX) || ['hidden', 'clip'].includes(s.overflowY)) {
          clipped.push({ className: ancestor.className, overflowX: s.overflowX, overflowY: s.overflowY });
        }
      }
    }
    return {
      overflow: document.documentElement.scrollWidth - innerWidth,
      paper: rect(sheet), zoom: getComputedStyle(sheet).zoom, badBounds, clipped,
      columns: [...sheet.querySelectorAll('.grid')].map(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length),
      questionCount: sheet.querySelectorAll('.q').length,
      text: [...sheet.querySelectorAll('.q')].map(q => q.textContent),
    };
  });
}

async function assertPhone(page, label) {
  const state = await measure(page);
  results.push({ label, ...state });
  assert.ok(state.questionCount > 0, label + ': questions exist');
  assert.ok(state.overflow <= 2, label + ': no horizontal document overflow: ' + state.overflow);
  assert.deepEqual(state.badBounds, [], label + ': every equation and fraction stays inside paper and viewport');
  assert.deepEqual(state.clipped, [], label + ': no hidden/clip overflow conceals equation content');
  assert.ok(state.columns.every(n => n === 1), label + ': phone preview uses one readable column');
}

async function geometry(page) {
  return page.evaluate(() => [...document.querySelectorAll('#out, #out *')].map(element => {
    const r = element.getBoundingClientRect(), s = getComputedStyle(element);
    return [element.tagName, element.className, element.textContent, ...[r.left, r.top, r.width, r.height].map(n => Math.round(n * 100) / 100), s.display, s.gridTemplateColumns, s.fontSize, s.lineHeight, s.padding, s.margin, s.zoom];
  }));
}

async function unchangedWithoutScreenStyle(page, label) {
  const before = await geometry(page);
  await page.locator('#' + styleId).evaluate(node => { node.sheet.disabled = true; });
  await settle(page);
  assert.deepEqual(await geometry(page), before, label + ': scoped screen rule leaves geometry/text unchanged');
  await page.locator('#' + styleId).evaluate(node => { node.sheet.disabled = false; });
  await settle(page);
  results.push({ label, unchanged: true });
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  let browser;
  try {
    browser = await chromium.launch();
    const original = await open(browser, 390, true);
    try {
      await recordedFixture(original.page);
      const state = await measure(original.page);
      results.push({ label: 'negative-control-original-390', ...state });
      assert.ok(state.overflow > 2, 'negative control must reproduce original >2px viewport overflow');
      assert.ok(state.badBounds.length > 0, 'negative control must expose an out-of-paper equation');
      assert.deepEqual(original.errors, []);
      await original.page.screenshot({ path: path.join(out, 'g7-original-390.png'), fullPage: true });
    } finally { await original.context.close(); }

    for (const width of [320, 390, 412, 640]) {
      const current = await open(browser, width);
      try {
        await assertPhone(current.page, 'seeded-default-' + width);
        for (const columns of [2, 3]) {
          await recordedFixture(current.page, columns);
          await assertPhone(current.page, 'recorded-equation-c' + columns + '-' + width);
        }
        await current.page.screenshot({ path: path.join(out, 'g7-fixed-' + width + '.png'), fullPage: true });
        await current.page.selectOption('#version', 'teacher');
        await settle(current.page);
        assert.equal(await current.page.locator('#out .ans').first().isVisible(), true, 'phone teacher answers remain visible');
        await assertPhone(current.page, 'teacher-recorded-equation-' + width);
        await current.page.selectOption('#version', 'student');
        await settle(current.page);
        // Invoke the existing regenerate click handler with a fixed seed; no fixture replaces its math.
        await current.page.evaluate(() => { window.__g7Seed(772109); document.querySelector('#gen').click(); });
        await settle(current.page);
        const first = (await measure(current.page)).text;
        await assertPhone(current.page, 'regenerated-' + width);
        await current.page.evaluate(() => { window.__g7Seed(772109); document.querySelector('#gen').click(); });
        await settle(current.page);
        assert.deepEqual((await measure(current.page)).text, first, 'fixed seed reproduces identical questions');
        await current.page.evaluate(() => {
          window.__g7Seed(12345);
          document.querySelector('#diff').value = '3';
          document.querySelector('#perRow').value = '3';
          for (const id of ['tInt', 'tFrac', 'tDec']) document.getElementById(id).checked = true;
          for (const module of MODS) document.getElementById('on_' + module).checked = true;
          document.querySelector('#gen').click();
        });
        await settle(current.page);
        await assertPhone(current.page, 'challenge-all-modules-forced-three-columns-' + width);
        assert.deepEqual(current.errors, []);
      } finally { await current.context.close(); }
    }

    const desktop = await open(browser, 1280);
    try {
      await recordedFixture(desktop.page);
      assert.ok((await measure(desktop.page)).columns.includes(2), 'desktop retains two-column worksheet');
      await unchangedWithoutScreenStyle(desktop.page, 'desktop-1280');
      for (const width of [641, 768]) {
        await desktop.page.setViewportSize({ width, height: 900 });
        await settle(desktop.page);
        assert.ok((await measure(desktop.page)).columns.includes(2), 'above phone breakpoint retains original columns');
        await unchangedWithoutScreenStyle(desktop.page, 'screen-breakpoint-' + width);
      }
      await desktop.page.setViewportSize({ width: 390, height: 900 });
      await settle(desktop.page);
      await assertPhone(desktop.page, 'resize-desktop-to-phone');
      await desktop.page.setViewportSize({ width: 1280, height: 900 });
      await settle(desktop.page);
      assert.ok((await measure(desktop.page)).columns.includes(2), 'resize back restores desktop columns');
      for (const width of [390, 1280]) {
        await desktop.page.setViewportSize({ width, height: 900 });
        for (const version of ['student', 'teacher']) {
          await desktop.page.selectOption('#version', version);
          await desktop.page.emulateMedia({ media: 'print' });
          await desktop.page.evaluate(() => dispatchEvent(new Event('beforeprint')));
          await settle(desktop.page);
          assert.ok((await measure(desktop.page)).columns.includes(2), 'print keeps original columns even at phone viewport');
          await unchangedWithoutScreenStyle(desktop.page, 'print-' + version + '-' + width);
          assert.equal(await desktop.page.locator('#out .ans').first().isVisible(), version === 'teacher', 'print answer visibility');
          await desktop.page.emulateMedia({ media: 'screen' });
          await desktop.page.evaluate(() => dispatchEvent(new Event('afterprint')));
          await settle(desktop.page);
          if (width === 390) await assertPhone(desktop.page, 'return-from-print-' + version);
        }
      }
      assert.deepEqual(desktop.errors, []);
    } finally { await desktop.context.close(); }
    console.log('G7 deterministic layout: negative control reproduced; phone bounds, regeneration, desktop and print passed.');
  } catch (error) {
    results.push({ label: 'failure', error: error.stack || String(error) });
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    fs.writeFileSync(path.join(out, 'g7-equation-layout-results.json'), JSON.stringify(results, null, 2) + '\n');
  }
})();
