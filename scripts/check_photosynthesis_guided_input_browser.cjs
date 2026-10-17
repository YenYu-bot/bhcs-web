// B5 real-browser input gate for Science Lab 2.0 Pilot #5.
// Uses the production page. Checks native mouse/keyboard/touch input, phase allowlists, locks and forged controls.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const {
  createServer, openPage, settle, launchOptions,
} = require('./photosynthesis_guided_test_support.cjs');

const phase = (p) => p.evaluate(() => window.__pfgTest.getState().phase);
const light = (p) => p.evaluate(() => window.__pfgTest.getState().conditions?.light ?? null);
const records = (p) => p.evaluate(() => window.__pfgTest.getState().records.map((r) => r.trialId));
const ctaEnabled = (p) => p.evaluate(() => {
  const b = document.getElementById('pfg-cta');
  return !b.hidden && !b.disabled;
});

async function click(p, sel) {
  await p.locator(sel).scrollIntoViewIfNeeded();
  await p.click(sel);
  await settle(p);
}
async function toTrial1Higher(p) {
  await click(p, '#pfg-cta'); // mission
  await click(p, '#pfg-cta'); // trial1 low
  await click(p, '#pfg-cta'); // observe low
  await click(p, '#pfg-cta'); // trial1 higher
  assert.equal(await phase(p), 'trial1-higher-light');
}
async function toTrial2High(p) {
  await toTrial1Higher(p);
  await click(p, '[data-light-value="60"]');
  await click(p, '#pfg-cta'); // observe higher
  await click(p, '#pfg-cta'); // compare1
  await p.locator('input[data-compare][data-q="rateChange"][value="increase"]').check(); await settle(p);
  await p.locator('input[data-compare][data-q="claim"][value="context-only"]').check(); await settle(p);
  await click(p, '#pfg-cta'); // setup
  await click(p, '#pfg-cta'); // trial2 medium
  await click(p, '#pfg-cta'); // observe medium
  await click(p, '#pfg-cta'); // trial2 high
  assert.equal(await phase(p), 'trial2-high-light');
}

(async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch(launchOptions());
  const external = [], errors = [];
  let checks = 0;
  const ok = (m) => { checks++; console.log('PASS', m); };

  try {
    // Mouse and forged-control gates.
    {
      const { ctx, page: p } = await openPage(browser, base, {
        viewport: { width: 1280, height: 900 }, external, errors,
      });
      await toTrial1Higher(p);
      assert.equal(await light(p), 15);
      assert.equal(await p.locator('[data-light-value="60"]').isEnabled(), true);
      assert.equal(await p.locator('[data-light-value="15"]').isDisabled(), true);
      assert.equal(await p.locator('[data-light-value="100"]').isDisabled(), true);
      assert.equal(await ctaEnabled(p), false);

      await click(p, '[data-light-value="60"]');
      assert.equal(await light(p), 60);
      assert.equal(await ctaEnabled(p), true);
      ok('mouse: Trial 1 higher accepts only the Guided 60% light control');

      // A forged re-enabled wrong button still cannot bypass caller canSetLight().
      await p.evaluate(() => {
        const b = document.querySelector('[data-light-value="100"]');
        b.disabled = false;
        b.click();
      });
      await settle(p);
      assert.equal(await light(p), 60);
      ok('forged control: re-enabling 100% cannot bypass the Trial 1 allowlist');

      await click(p, '#pfg-cta'); // record 60
      assert.deepEqual(await records(p), ['t1-low-light', 't1-higher-light']);
      assert.equal(await p.locator('[data-light-value="60"]').isDisabled(), true);
      await p.evaluate(() => {
        const b = document.querySelector('[data-light-value="60"]');
        b.disabled = false;
        b.click();
      });
      await settle(p);
      assert.equal(await light(p), 60);
      assert.deepEqual(await records(p), ['t1-low-light', 't1-higher-light']);
      ok('locked: after observation, forged clicks do not mutate light or duplicate a record');
      await ctx.close();
    }

    // Native Enter and Space.
    for (const key of ['Enter', 'Space']) {
      const { ctx, page: p } = await openPage(browser, base, {
        viewport: { width: 1280, height: 900 }, external, errors,
      });
      await toTrial1Higher(p);
      await p.locator('[data-light-value="60"]').focus();
      await p.keyboard.press(key);
      await settle(p);
      assert.equal(await light(p), 60, key);
      assert.equal(await ctaEnabled(p), true, key);
      ok(`keyboard: native ${key} activates the 60% button`);
      await ctx.close();
    }

    // Arrow/Home/End path goes through the same caller gate.
    {
      const { ctx, page: p } = await openPage(browser, base, {
        viewport: { width: 1280, height: 900 }, external, errors,
      });
      await toTrial1Higher(p);
      const b = p.locator('[data-light-value="60"]');
      await b.focus();
      for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
        await p.keyboard.press(key); await settle(p);
        assert.equal(await light(p), 60, key);
        assert.equal(await p.evaluate(() => document.activeElement?.getAttribute('data-light-value')), '60', key);
      }
      ok('keyboard alternatives: arrows/Home/End stay on the only eligible Guided value and dispatch safely');
      await ctx.close();
    }

    // Trial 2 permits only 100%.
    {
      const { ctx, page: p } = await openPage(browser, base, {
        viewport: { width: 1280, height: 900 }, external, errors,
      });
      await toTrial2High(p);
      assert.equal(await light(p), 60);
      assert.equal(await p.locator('[data-light-value="100"]').isEnabled(), true);
      assert.equal(await p.locator('[data-light-value="15"]').isDisabled(), true);
      assert.equal(await p.locator('[data-light-value="60"]').isDisabled(), true);
      await click(p, '[data-light-value="100"]');
      assert.equal(await light(p), 100);
      assert.equal(await ctaEnabled(p), true);
      ok('Trial 2 high: only 100% is eligible and it unlocks observation');
      await ctx.close();
    }

    // Phone touch.
    {
      const { ctx, page: p } = await openPage(browser, base, {
        viewport: { width: 390, height: 844 }, touch: true, external, errors,
      });
      const tap = async (sel) => {
        const l = p.locator(sel);
        await l.scrollIntoViewIfNeeded();
        await l.tap();
        await settle(p);
      };
      await tap('#pfg-cta'); await tap('#pfg-cta'); await tap('#pfg-cta'); await tap('#pfg-cta');
      assert.equal(await phase(p), 'trial1-higher-light');
      const box = await p.locator('[data-light-value="60"]').boundingBox();
      assert.ok(box.width >= 56 && box.height >= 56, `60% target is ${box.width}×${box.height}`);
      await tap('[data-light-value="60"]');
      assert.equal(await light(p), 60);
      assert.equal(await ctaEnabled(p), true);
      assert.ok((await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 1);
      ok('touch: 390px target is at least 56px, tap sets 60%, no sideways scroll');
      await ctx.close();
    }

    assert.deepEqual(external, [], `unexpected external requests: ${external.join(', ')}`);
    assert.deepEqual(errors, [], `browser errors: ${errors.join(' | ')}`);
    ok('no external requests and no browser errors');
    console.log(`photosynthesis guided input browser: ${checks} checks passed`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
