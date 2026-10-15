// B2 browser gate: real mouse, keyboard and touch on the guided acid–base bench (Pilot #4), mounted on the in-memory
// test fixture (there is no production page until B3). Needs Playwright (NODE_PATH pointing at a playwright install).
// Checks: mouse drag onto a tube, a drop outside, button click, Enter and Space, the locked state, the already-tested
// gate against a forged DOM, cleanup after pointercancel, touch drag, page scrolling outside the strip, real hit sizes,
// no sideways scroll, and Trial 1 evidence kept on the bench when the red strip arrives.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { createServer, openFixture, settle, launchOptions, touchDrag } = require('./acid_base_guided_test_support.cjs');

const records = (p) => p.evaluate(() => window.__abg.records());
const center = async (loc) => { await loc.scrollIntoViewIfNeeded(); const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
const strip = (p) => p.locator('[data-role="strip"]');
const zone = (p, id) => p.locator(`[data-drop-sample="${id}"]`);
const button = (p, id) => p.locator(`[data-dip-sample="${id}"]`);
const leftovers = (p) => p.evaluate(() => ({
  dragging: document.querySelectorAll('[data-dragging]').length,
  over: document.querySelectorAll('[data-over]').length,
  transform: document.querySelector('[data-role="strip"]').style.transform,
}));
const CLEAN = { dragging: 0, over: 0, transform: '' };

async function mouseDrag(page, to, { steps = 8 } = {}) {
  const from = await center(strip(page));
  const target = typeof to === 'string' ? await center(zone(page, to)) : to;
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps }); await page.mouse.up();
  await settle(page);
}

(async () => {
  const server = createServer(); await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch(launchOptions());
  const external = [], errors = [];
  let checks = 0; const ok = (m) => { checks++; console.log('PASS', m); };
  try {
    // ---- desktop 1280: mouse, buttons, keyboard -------------------------------------------------------------------
    {
      const { ctx, page } = await openFixture(browser, base, { viewport: { width: 1280, height: 900 }, external, errors });

      await mouseDrag(page, 'A');
      assert.deepEqual(await records(page), ['A:blue-litmus']);
      assert.deepEqual(await leftovers(page), CLEAN);
      ok('mouse: dragging the strip onto tube A records A with blue litmus, and the strip is back in the tray');

      // while hovering a tube the zone is highlighted; the highlight is the same element style for every tube
      {
        const from = await center(strip(page)), over = await center(zone(page, 'B'));
        await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move(over.x, over.y, { steps: 6 }); await settle(page);
        assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('[data-over]')].map((z) => z.getAttribute('data-drop-sample'))), ['B']);
        const moved = await strip(page).boundingBox();
        assert.ok(Math.abs(moved.x + moved.width / 2 - over.x) < 2 && Math.abs(moved.y + moved.height / 2 - over.y) < 2, 'the strip follows the pointer 1:1');
        await page.mouse.move(1260, 40, { steps: 4 }); await page.mouse.up(); await settle(page);
        assert.deepEqual(await records(page), ['A:blue-litmus'], 'released away from every tube: nothing recorded');
        assert.deepEqual(await leftovers(page), CLEAN);
      }
      ok('mouse: the strip follows the pointer, highlights the tube under it, and a drop outside cancels cleanly');

      await button(page, 'B').click(); await settle(page);
      assert.deepEqual(await records(page), ['A:blue-litmus', 'B:blue-litmus']);
      ok('button: clicking "測試液體 B" records B');

      await button(page, 'C').focus(); await page.keyboard.press('Enter'); await settle(page);
      assert.deepEqual(await records(page), ['A:blue-litmus', 'B:blue-litmus', 'C:blue-litmus']);
      ok('keyboard: Enter on the focused C button records C');

      // the already-tested gate holds against a re-enabled button and a second drag
      await page.evaluate(() => { const b = document.querySelector('[data-dip-sample="A"]'); b.disabled = false; b.click(); });
      await mouseDrag(page, 'A');
      assert.deepEqual(await records(page), ['A:blue-litmus', 'B:blue-litmus', 'C:blue-litmus']);
      await page.evaluate(() => window.__abg.setLocked(false)); await settle(page);   // any re-render puts the real state back
      assert.ok(await button(page, 'A').isDisabled(), 'the next render disables A again');
      ok('already tested: a forged re-enabled button and a second drag onto A record nothing');

      // Trial 2: red strip, blue evidence stays on the bench, Space works on a native button
      await page.evaluate(() => window.__abg.toTrial2()); await settle(page);
      assert.equal(await page.evaluate(() => document.querySelector('[data-role="bench"]').getAttribute('data-indicator')), 'red-litmus');
      assert.equal(await page.evaluate(() => document.querySelector('[data-role="strip"] .abg-swatch').getAttribute('data-color')), 'red');
      assert.equal(await page.locator('[data-slot="blue-litmus"]:not([hidden])').count(), 3, 'Trial 1 strips still shown');
      assert.equal(await page.locator('[data-slot="red-litmus"]:not([hidden])').count(), 0);
      await button(page, 'B').focus(); await page.keyboard.press('Space'); await settle(page);
      assert.deepEqual((await records(page)).slice(3), ['B:red-litmus']);
      ok('blue → red: the tray strip turns red, Trial 1 evidence stays, and Space on a button records with red litmus');

      // locked: buttons disabled, drag and forged clicks do nothing
      await page.evaluate(() => window.__abg.setLocked(true)); await settle(page);
      for (const id of ['A', 'C']) assert.ok(await button(page, id).isDisabled());
      await mouseDrag(page, 'A');
      await page.evaluate(() => { const b = document.querySelector('[data-dip-sample="C"]'); b.disabled = false; b.click(); });
      assert.equal((await records(page)).length, 4);
      assert.deepEqual(await leftovers(page), CLEAN, 'a locked strip never starts a drag');
      await page.evaluate(() => window.__abg.setLocked(false)); await settle(page);
      ok('locked: buttons disabled, dragging and forged clicks record nothing');

      // pointercancel mid-drag: everything is cleaned up and the later release records nothing
      {
        const from = await center(strip(page)), over = await center(zone(page, 'A'));
        await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move(over.x, over.y, { steps: 4 });
        const captured = await page.evaluate(() => { const s = document.querySelector('[data-role="strip"]'); return s.getAttribute('data-dragging'); });
        assert.equal(captured, 'true');
        await page.evaluate(() => document.querySelector('[data-role="strip"]').dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1, pointerType: 'mouse' })));
        assert.deepEqual(await leftovers(page), CLEAN);
        await page.mouse.up(); await settle(page);
        assert.equal((await records(page)).length, 4);
        // and the next drag starts from scratch (no drift)
        await mouseDrag(page, 'A');
        assert.deepEqual((await records(page)).slice(4), ['A:red-litmus']);
        assert.deepEqual(await leftovers(page), CLEAN);
        const capture = await page.evaluate(() => document.querySelector('[data-role="strip"]').hasPointerCapture(1));
        assert.equal(capture, false, 'pointer capture released');
      }
      ok('pointercancel: drag state, highlight and capture are cleared; the next drag works without drift');

      await ctx.close();
    }

    // ---- phone 390: touch, scrolling, hit sizes, overflow ---------------------------------------------------------
    {
      const { ctx, page } = await openFixture(browser, base, { viewport: { width: 390, height: 844 }, touch: true, external, errors });
      const sizes = await page.evaluate(() => {
        const box = (e) => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height }; };
        return {
          buttons: [...document.querySelectorAll('[data-dip-sample]')].map(box),
          strip: box(document.querySelector('[data-role="strip"]')),
          zones: [...document.querySelectorAll('[data-drop-sample]')].map(box),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      for (const b of sizes.buttons) assert.ok(b.w >= 56 && b.h >= 56, `button ${JSON.stringify(b)} is under 56 px`);
      assert.ok(sizes.strip.w >= 44 && sizes.strip.h >= 44, `strip ${JSON.stringify(sizes.strip)} is under 44 px`);
      for (const z of sizes.zones) assert.ok(z.w >= 56 && z.h >= 56, `drop zone ${JSON.stringify(z)} is under 56 px`);
      assert.ok(sizes.overflow <= 1, `the page scrolls sideways by ${sizes.overflow}px`);
      ok(`phone: buttons ≥ 56 px (${sizes.buttons.map((b) => `${b.w.toFixed(0)}×${b.h.toFixed(0)}`).join(', ')}), strip ${sizes.strip.w.toFixed(0)}×${sizes.strip.h.toFixed(0)}, zones ${sizes.zones[0].w.toFixed(0)}×${sizes.zones[0].h.toFixed(0)}, no sideways scroll`);

      await strip(page).scrollIntoViewIfNeeded();
      await touchDrag(page, await center(strip(page)), await center(zone(page, 'C')));
      assert.deepEqual(await records(page), ['C:blue-litmus']);
      assert.deepEqual(await leftovers(page), CLEAN);
      ok('touch: a real touch drag of the strip onto tube C records C, and the page did not scroll instead');

      // touching anywhere but the strip still scrolls the page (the bench does not block scrolling)
      for (const where of ['[data-role="filler"]', '[data-drop-sample="B"]']) {
        await page.evaluate(() => window.scrollTo(0, 200)); await settle(page);
        const y0 = await page.evaluate(() => window.scrollY);
        const box = await page.locator(where).boundingBox();
        const vh = 844, x = box.x + box.width / 2, y = Math.min(Math.max(box.y + 40, 120), vh - 120);
        await touchDrag(page, { x, y }, { x, y: y - 100 }, 6);
        await page.waitForTimeout(150);
        const y1 = await page.evaluate(() => window.scrollY);
        assert.ok(y1 > y0 + 30, `${where}: a vertical swipe should scroll the page (scrollY ${y0} → ${y1})`);
      }
      assert.deepEqual(await records(page), ['C:blue-litmus'], 'scrolling recorded nothing');
      ok('touch: swiping on the page and on a tube scrolls normally; only the strip takes over touch');

      await button(page, 'A').tap(); await settle(page);
      assert.deepEqual(await records(page), ['C:blue-litmus', 'A:blue-litmus']);
      ok('touch: tapping a tube button records it');
      await ctx.close();
    }

    assert.deepEqual(errors, [], 'console or page errors');
    assert.deepEqual(external, [], 'external requests');
    ok('no external requests, no console errors');
    console.log(`acid-base-guided input browser: ${checks} checks passed`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
