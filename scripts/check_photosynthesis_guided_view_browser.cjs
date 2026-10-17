// B5 real-browser view gate for Science Lab 2.0 Pilot #5.
// Uses the production page and captures review images at the key bench states.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  createServer, openPage, axeScan, settle, launchOptions, root,
} = require('./photosynthesis_guided_test_support.cjs');

const OUT = path.resolve(process.env.PHOTOSYNTHESIS_VIEW_OUTPUT || path.join(root, 'photosynthesis-view-artifacts'));

const phase = (p) => p.evaluate(() => window.__pfgTest.getState().phase);
const shot = async (p, name) => {
  fs.mkdirSync(OUT, { recursive: true });
  await p.locator('[data-role="photosynthesis-bench"]').screenshot({ path: path.join(OUT, `${name}.png`) });
};
const click = async (p, sel, tap = false) => {
  const l = p.locator(sel);
  await l.scrollIntoViewIfNeeded();
  if (tap) await l.tap(); else await l.click();
  await settle(p);
};
const answer = async (p, q, value, tap = false) => {
  const l = p.locator(`input[data-compare][data-q="${q}"][value="${value}"]`);
  await l.scrollIntoViewIfNeeded();
  if (tap) await l.tap(); else await l.check();
  await settle(p);
};

async function benchFacts(p) {
  return p.evaluate(() => {
    const bench = document.querySelector('[data-role="photosynthesis-bench"]');
    const scene = document.querySelector('[data-role="scene"]');
    const visible = [...document.querySelectorAll('.pg-bubble')].filter((b) => !b.hasAttribute('hidden')).length;
    const buttons = [...document.querySelectorAll('[data-light-value]')].map((b) => ({
      value: Number(b.getAttribute('data-light-value')),
      disabled: b.disabled,
      pressed: b.getAttribute('aria-pressed'),
      w: Math.round(b.getBoundingClientRect().width),
      h: Math.round(b.getBoundingClientRect().height),
    }));
    return {
      light: bench.getAttribute('data-light'),
      locked: bench.getAttribute('data-locked'),
      bubbleCount: Number(bench.getAttribute('data-bubble-count')),
      visible,
      observation: document.querySelector('[data-role="observation"]').textContent,
      lightText: document.querySelector('[data-role="light-value"]').textContent,
      co2Text: document.querySelector('[data-role="co2-value"]').textContent,
      tempText: document.querySelector('[data-role="temperature-value"]').textContent,
      sceneLabel: scene.getAttribute('aria-label'),
      formalLeak: /限制因子|最低條件|三項因子中的最低值/.test(bench.innerText + ' ' + scene.getAttribute('aria-label')),
      buttons,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      benchRight: bench.getBoundingClientRect().right,
      viewport: document.documentElement.clientWidth,
    };
  });
}
function assertFacts(f, expected, label) {
  assert.equal(f.light, String(expected.light), `${label}: light`);
  assert.equal(f.co2Text, `${expected.co2} ppm`, `${label}: CO2`);
  assert.equal(f.tempText, `${expected.temperature}°C`, `${label}: temperature`);
  assert.equal(f.bubbleCount, expected.bubbles, `${label}: bubble count`);
  assert.equal(f.visible, expected.bubbles, `${label}: visible bubbles`);
  assert.equal(f.formalLeak, false, `${label}: formal answer leaked into bench`);
  assert.ok(f.overflow <= 1, `${label}: sideways scroll ${f.overflow}px`);
  assert.ok(f.benchRight <= f.viewport + 1, `${label}: bench exceeds viewport`);
  if (expected.rate == null) {
    assert.match(f.observation, /開始觀察後/);
    assert.match(f.sceneLabel, /尚未觀察/);
  } else {
    assert.match(f.observation, new RegExp(`相對產氧速度 ${String(expected.rate).replace('.', '\\.')}`));
    assert.match(f.sceneLabel, new RegExp(`相對產氧速度 ${String(expected.rate).replace('.', '\\.')}`));
  }
}

async function toTrial1Low(p, tap = false) {
  await click(p, '#pfg-cta', tap);
  await click(p, '#pfg-cta', tap);
  assert.equal(await phase(p), 'trial1-low-light');
}
async function toTrial1HigherObserved(p, tap = false) {
  await toTrial1Low(p, tap);
  await click(p, '#pfg-cta', tap); // observe 7.4
  await click(p, '#pfg-cta', tap); // higher
  await click(p, '[data-light-value="60"]', tap);
  await click(p, '#pfg-cta', tap); // observe 17.4
  assert.equal(await phase(p), 'trial1-higher-light');
}
async function toTrial2HighObserved(p, tap = false) {
  await toTrial1HigherObserved(p, tap);
  await click(p, '#pfg-cta', tap); // compare1
  await answer(p, 'rateChange', 'increase', tap);
  await answer(p, 'claim', 'context-only', tap);
  await click(p, '#pfg-cta', tap); // setup
  await click(p, '#pfg-cta', tap); // t2 medium
  await click(p, '#pfg-cta', tap); // observe 8.3
  await click(p, '#pfg-cta', tap); // t2 high
  await click(p, '[data-light-value="100"]', tap);
  await click(p, '#pfg-cta', tap); // observe 8.3
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
    for (const [w, h, tag, tap] of [[1280, 900, '1280', false], [390, 844, '390', true]]) {
      // Trial 1 low: no observation, zero bubbles, all controls locked.
      {
        const { ctx, page: p } = await openPage(browser, base, {
          viewport: { width: w, height: h }, touch: tap, external, errors,
        });
        await toTrial1Low(p, tap);
        let f = await benchFacts(p);
        assertFacts(f, { light: 15, co2: 1000, temperature: 25, bubbles: 0, rate: null }, `${tag} trial1 low`);
        assert.ok(f.buttons.every((b) => b.disabled), `${tag}: low trial controls are locked`);
        if (tap) for (const b of f.buttons) assert.ok(b.w >= 56 && b.h >= 56, `${tag}: button ${b.value} is ${b.w}×${b.h}`);
        await axeScan(p, `${tag} trial1 low`);
        await shot(p, `${tag}-trial1-low`);
        ok(`${tag}: Trial 1 low shows 15% / 1000 ppm / 25°C, zero bubbles, controls locked, axe clean`);
        await ctx.close();
      }

      // Trial 1 higher after record: 17 bubbles for 17.4.
      {
        const { ctx, page: p } = await openPage(browser, base, {
          viewport: { width: w, height: h }, touch: tap, external, errors,
        });
        await toTrial1HigherObserved(p, tap);
        const f = await benchFacts(p);
        assertFacts(f, { light: 60, co2: 1000, temperature: 25, bubbles: 17, rate: 17.4 }, `${tag} trial1 high observed`);
        assert.equal(f.locked, 'true');
        assert.ok(f.buttons.every((b) => b.disabled), `${tag}: observed bench is locked`);
        await axeScan(p, `${tag} trial1 high observed`);
        await shot(p, `${tag}-trial1-high-observed`);
        ok(`${tag}: Trial 1 high shows 60%, 17.4 and 17 visible bubbles without leakage`);
        await ctx.close();
      }

      // Trial 2 high plateau: 8 bubbles for 8.3 with CO2 150.
      {
        const { ctx, page: p } = await openPage(browser, base, {
          viewport: { width: w, height: h }, touch: tap, external, errors,
        });
        await toTrial2HighObserved(p, tap);
        const f = await benchFacts(p);
        assertFacts(f, { light: 100, co2: 150, temperature: 25, bubbles: 8, rate: 8.3 }, `${tag} trial2 high observed`);
        assert.equal(f.locked, 'true');
        await axeScan(p, `${tag} trial2 high observed`);
        await shot(p, `${tag}-trial2-high-observed`);
        ok(`${tag}: Trial 2 plateau shows 100% / 150 ppm / 25°C, 8.3 and 8 bubbles, axe clean`);
        await ctx.close();
      }
    }

    // Reduced motion is a presentation contract of the bench.
    {
      const { ctx, page: p } = await openPage(browser, base, {
        viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', external, errors,
      });
      await toTrial1Low(p);
      const motion = await p.evaluate(() => ({
        bubbles: [...document.querySelectorAll('.pg-bubble')].map((b) => getComputedStyle(b).animationName),
        beamTransition: getComputedStyle(document.querySelector('.pg-light-beam')).transitionDuration,
      }));
      assert.ok(motion.bubbles.every((x) => x === 'none'));
      assert.ok(motion.beamTransition === '0s' || motion.beamTransition === '0ms');
      ok('reduced motion: bubble animation and light-beam transition are disabled');
      await ctx.close();
    }

    assert.deepEqual(external, [], `unexpected external requests: ${external.join(', ')}`);
    assert.deepEqual(errors, [], `browser errors: ${errors.join(' | ')}`);
    ok('no external requests and no browser errors');
    console.log(`photosynthesis guided view browser: ${checks} checks passed; screenshots in ${path.relative(root, OUT)}/`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
