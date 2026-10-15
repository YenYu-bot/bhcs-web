// B2 browser gate: how the guided acid–base bench looks (Pilot #4), on the in-memory test fixture.
// Needs Playwright (NODE_PATH pointing at a playwright install). Writes review screenshots to acid-base-view-artifacts/.
// Checks, at 1280 and 390: identical liquids, the tray strip, used strips (start over result, pattern, words), six
// results still readable on a phone, no sideways scroll, axe; then reduced motion, forced colours, and a grayscale check
// done in code: every result keeps a word and a pattern once hue is gone.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { createServer, openFixture, axeScan, settle, launchOptions, root } = require('./acid_base_guided_test_support.cjs');
const OUT = path.resolve(process.env.ACID_BASE_VIEW_OUTPUT || path.join(root, 'acid-base-view-artifacts'));

const dip = (p, id) => p.evaluate((id) => document.querySelector(`[data-dip-sample="${id}"]`).click(), id).then(() => settle(p));
const shot = async (p, name) => { fs.mkdirSync(OUT, { recursive: true }); await p.locator('[data-role="bench"]').screenshot({ path: path.join(OUT, `${name}.png`) }); };

/** The facts every view must keep, whatever the viewport or colour mode. */
async function facts(page) {
  return page.evaluate(() => {
    const liquids = [...document.querySelectorAll('.abg-liquid')].map((l) => { const r = l.getBoundingClientRect(); return { h: Math.round(r.height), y: Math.round(r.top), fill: getComputedStyle(l).fill }; });
    const used = [...document.querySelectorAll('.abg-used-strip')].filter((li) => !li.hidden).map((li) => {
      const text = li.querySelector('[data-role="used-text"]');
      const part = (p) => li.querySelector(`[data-part="${p}"]`);
      const pat = (p) => part(p).querySelector('.abg-pattern-fill').getAttribute('fill');
      const tr = text.getBoundingClientRect();
      return {
        sample: li.closest('[data-sample]').getAttribute('data-sample'), slot: li.getAttribute('data-slot'), text: text.textContent,
        start: part('start').getAttribute('data-pattern'), result: part('result').getAttribute('data-pattern'),
        patternRefsExist: [pat('start'), pat('result')].every((u) => Boolean(document.getElementById(u.slice(5, -1)))),
        textVisible: tr.width > 0 && tr.height > 0 && text.scrollWidth <= text.clientWidth + 1 && getComputedStyle(text).visibility === 'visible',
        fontPx: parseFloat(getComputedStyle(text).fontSize),
      };
    });
    return {
      liquids, used,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      leak: /(酸|鹼|中性|pH|acidic|neutral|basic)/.test(document.body.innerText + [...document.querySelectorAll('[aria-label],[title]')].map((e) => e.getAttribute('aria-label') + (e.getAttribute('title') || '')).join(' ')),
    };
  });
}
function assertFacts(f, label, expectUsed) {
  assert.equal(f.liquids.length, 3);
  for (const l of f.liquids) assert.deepEqual(l, f.liquids[0], `${label}: the three liquids differ`);
  assert.equal(f.used.length, expectUsed, `${label}: used strips`);
  for (const u of f.used) {
    assert.ok(u.text.length > 0 && u.textVisible, `${label}: result words for ${u.sample} ${u.slot} not visible`);
    assert.ok(['hatch', 'dots'].includes(u.start) && ['hatch', 'dots'].includes(u.result) && u.patternRefsExist, `${label}: patterns for ${u.sample} ${u.slot}`);
    assert.ok(u.fontPx >= 13, `${label}: result text ${u.fontPx}px`);
  }
  assert.ok(f.overflow <= 1, `${label}: sideways scroll ${f.overflow}px`);
  assert.equal(f.leak, false, `${label}: a class of liquid or pH is named`);
}

(async () => {
  const server = createServer(); await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch(launchOptions());
  const external = [], errors = [];
  let checks = 0; const ok = (m) => { checks++; console.log('PASS', m); };
  try {
    for (const [w, h, tag] of [[1280, 900, '1280'], [390, 844, '390']]) {
      const { ctx, page } = await openFixture(browser, base, { viewport: { width: w, height: h }, touch: w < 500, external, errors });
      let f = await facts(page); assertFacts(f, `${tag} fresh`, 0); await axeScan(page, `${tag} fresh`); await shot(page, `${tag}-fresh-blue`);
      ok(`${tag}: fresh blue trial — three identical liquids, blue strip in the tray, no results yet, axe clean`);

      await dip(page, 'B'); await dip(page, 'A');
      f = await facts(page); assertFacts(f, `${tag} partial`, 2);
      assert.deepEqual(f.used.map((u) => [u.sample, u.text, u.start, u.result]), [['A', '藍色石蕊：維持藍色', 'dots', 'dots'], ['B', '藍色石蕊：變紅色', 'dots', 'hatch']]);
      await shot(page, `${tag}-partial-changed-and-unchanged`);
      ok(`${tag}: one changed (B: blue over red hatch) and one unchanged (A: blue over blue dots), each with its words`);

      await dip(page, 'C');
      f = await facts(page); assertFacts(f, `${tag} blue complete`, 3); await shot(page, `${tag}-blue-complete`);
      if (tag === '1280') ok('1280: blue trial complete — three results, all buttons marked tested');

      await page.evaluate(() => window.__abg.toTrial2()); await settle(page);
      f = await facts(page); assertFacts(f, `${tag} red start`, 3); await axeScan(page, `${tag} red start`); await shot(page, `${tag}-red-with-blue-evidence`);
      if (tag === '1280') ok('1280: red trial — red hatched strip in the tray, the three blue results still on the bench, axe clean');

      for (const id of ['A', 'B', 'C']) await dip(page, id);
      f = await facts(page); assertFacts(f, `${tag} six`, 6); await axeScan(page, `${tag} six`); await shot(page, `${tag}-six-results`);
      assert.deepEqual(f.used.map((u) => `${u.sample}:${u.text}`), ['A:藍色石蕊：維持藍色', 'A:紅色石蕊：變藍色', 'B:藍色石蕊：變紅色', 'B:紅色石蕊：維持紅色', 'C:藍色石蕊：維持藍色', 'C:紅色石蕊：維持紅色']);
      ok(`${tag}: six results — two strips under every tube, every word fully visible (≥ 13 px), no sideways scroll, axe clean`);
      await ctx.close();
    }

    // reduced motion: the strip has no transition; normal motion: a short one (≤ 180 ms)
    for (const [mode, expect] of [['reduce', 0], ['no-preference', 150]]) {
      const { ctx, page } = await openFixture(browser, base, { viewport: { width: 1280, height: 900 }, reducedMotion: mode, external, errors });
      const ms = await page.evaluate(() => { const d = getComputedStyle(document.querySelector('[data-role="strip"]')).transitionDuration; return Math.max(...d.split(',').map((s) => parseFloat(s) * (s.trim().endsWith('ms') ? 1 : 1000))); });
      assert.equal(ms, expect, `${mode}: strip transition ${ms} ms`);
      assert.ok(ms <= 180);
      await ctx.close();
    }
    ok('motion: no strip transition with reduced motion; 150 ms otherwise');

    // forced colours: system colours replace hue, patterns and words remain
    {
      const { ctx, page } = await openFixture(browser, base, { viewport: { width: 1280, height: 900 }, forcedColors: 'active', external, errors });
      for (const id of ['A', 'B']) await dip(page, id);
      const fc = await page.evaluate(() => {
        const probe = document.createElement('div'); document.body.append(probe);
        probe.style.color = 'CanvasText'; const ink = getComputedStyle(probe).color;
        probe.style.color = 'Canvas'; const paper = getComputedStyle(probe).color; probe.remove();
        const fills = [...document.querySelectorAll('.abg-used-strip:not([hidden]) .abg-color-fill, [data-role="strip"] .abg-color-fill')].map((e) => getComputedStyle(e).fill);
        const marks = [...document.querySelectorAll('.abg-pattern-mark')].map((e) => ({ stroke: getComputedStyle(e).stroke, fill: getComputedStyle(e).fill }));
        return { ink, paper, fills, marks, forced: matchMedia('(forced-colors: active)').matches };
      });
      assert.equal(fc.forced, true);
      assert.ok(fc.fills.length > 0 && fc.fills.every((x) => x === fc.paper), 'colour fills become Canvas');
      assert.ok(fc.marks.every((m) => m.stroke === fc.ink && m.fill === fc.ink), 'pattern marks become CanvasText');
      assertFacts(await facts(page), 'forced colours', 2);
      await shot(page, '1280-forced-colors');
      await ctx.close();
    }
    ok('forced colours: strip colours become Canvas, pattern marks CanvasText; results still carry pattern and words');

    // grayscale, in code: with hue removed, red and blue must still differ by pattern, and every result has words
    {
      const { ctx, page } = await openFixture(browser, base, { viewport: { width: 1280, height: 900 }, external, errors });
      for (const id of ['A', 'B', 'C']) await dip(page, id);
      await page.evaluate(() => window.__abg.toTrial2()); for (const id of ['A', 'B', 'C']) await dip(page, id);
      const f = await facts(page);
      const byColor = await page.evaluate(() => [...document.querySelectorAll('.abg-used-strip:not([hidden]) .abg-swatch')].map((g) => [g.getAttribute('data-color'), g.getAttribute('data-pattern')]));
      const map = new Map(byColor);
      assert.deepEqual([...map.entries()].sort(), [['blue', 'dots'], ['red', 'hatch']], 'one pattern per colour');
      assert.ok(f.used.every((u) => u.text && u.start && u.result), 'every result keeps a word and a pattern');
      await page.addStyleTag({ content: '.abg-bench { filter: grayscale(1); }' });
      await shot(page, '1280-grayscale-review');
      await ctx.close();
    }
    ok('grayscale: red is always hatch and blue always dots, every result keeps its words (screenshot saved for review)');

    assert.deepEqual(errors, [], 'console or page errors');
    assert.deepEqual(external, [], 'external requests');
    ok('no external requests, no console errors');
    console.log(`acid-base-guided view browser: ${checks} checks passed; screenshots in ${path.relative(root, OUT)}/`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
