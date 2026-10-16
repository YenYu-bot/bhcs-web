// B3 browser gate for Science Lab 2.0 Pilot #5: production prototype from Welcome through Concept.
// Requires Playwright (NODE_PATH may point at a shared install). Writes screenshots to photosynthesis-flow-artifacts/.
// B4 extends the same station through Notebook/Challenges/restore; B5 is where this browser gate is wired into CI.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  createServer, openPage, axeScan, settle, launchOptions, root,
} = require('./photosynthesis_guided_test_support.cjs');

const OUT = path.resolve(process.env.PHOTOSYNTHESIS_FLOW_OUTPUT || path.join(root, 'photosynthesis-flow-artifacts'));
const FORBIDDEN = /限制因子|最低條件|三項因子中的最低值|最低的一項/;

const phase = (p) => p.evaluate(() => window.__pfgTest.getState().phase);
const txt = (p, sel) => p.locator(sel).innerText();
const focused = (p) => p.evaluate(() => {
  const a = document.activeElement;
  if (!a) return null;
  if (a.id) return `#${a.id}`;
  if (a.matches?.('[data-light-value]')) return `light:${a.getAttribute('data-light-value')}`;
  if (a.matches?.('[data-compare]')) return `radio:${a.dataset.q}:${a.value}`;
  return a.tagName;
});
const cta = (p) => p.evaluate(() => {
  const b = document.getElementById('pfg-cta');
  return b.hidden ? null : { label: b.textContent, enabled: !b.disabled };
});
const shot = async (p, name) => {
  fs.mkdirSync(OUT, { recursive: true });
  await p.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
};
const answer = async (p, q, value, { tap = false } = {}) => {
  const el = p.locator(`input[data-compare][data-q="${q}"][value="${value}"]`);
  await el.scrollIntoViewIfNeeded();
  if (tap) await el.tap();
  else await el.check();
  await settle(p);
};

async function learnerText(p) {
  return p.evaluate(() => {
    const attrs = [...document.querySelectorAll('*')].flatMap((e) =>
      ['aria-label', 'aria-description', 'title', 'alt', 'placeholder']
        .map((a) => e.getAttribute(a))
        .filter(Boolean));
    return {
      body: document.body.innerText,
      title: document.title,
      attrs: attrs.join(' | '),
      said: (window.__pfgSaid || []).join(' | '),
    };
  });
}

async function preConcept(p, label) {
  const t = await learnerText(p);
  for (const [where, value] of Object.entries(t)) {
    assert.ok(!FORBIDDEN.test(value), `${label}: formal answer leaked in ${where}: ${value.slice(0, 240)}`);
  }
  const concept = await p.evaluate(() => ({
    hidden: document.getElementById('pfg-concept').hidden,
    children: document.querySelector('[data-pfg-concept-body]').children.length,
    cards: document.querySelectorAll('[data-concept-card]').length,
  }));
  assert.deepEqual(concept, { hidden: true, children: 0, cards: 0 }, `${label}: concept exists before Concept`);
}

async function common(p, label) {
  const info = await p.evaluate(() => ({
    live: [...document.querySelectorAll('[aria-live]')].map((e) => e.id),
    implicit: document.querySelectorAll('[role="status"],[role="alert"],[role="log"]').length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    h1: document.querySelectorAll('h1').length,
  }));
  assert.deepEqual(info.live, ['pfg-announcer'], `${label}: page must have exactly one live region`);
  assert.equal(info.implicit, 0, `${label}: no additional implicit live region`);
  assert.equal(info.h1, 1, `${label}: one h1`);
  assert.ok(info.overflow <= 1, `${label}: horizontal overflow ${info.overflow}px`);
  await axeScan(p, label);
}

async function recordCurrent(p, expectedRate) {
  await p.click('#pfg-cta');
  await settle(p);
  const records = await p.evaluate(() => window.__pfgTest.getState().records);
  assert.equal(records.at(-1).trialId != null, true);
  const shown = await txt(p, '[data-role="observation"]');
  assert.match(shown, new RegExp(`相對產氧速度 ${expectedRate.replace('.', '\\.')}`));
}

async function fullToCompare2(p, { touch = false } = {}) {
  const activate = async (sel) => {
    const l = p.locator(sel);
    await l.scrollIntoViewIfNeeded();
    if (touch) await l.tap();
    else await l.click();
    await settle(p);
  };

  await activate('#pfg-cta'); // welcome -> mission
  await activate('#pfg-cta'); // mission -> t1-low
  await recordCurrent(p, '7.4');
  await activate('#pfg-cta'); // -> t1-higher
  await activate('[data-light-value="60"]');
  await recordCurrent(p, '17.4');
  await activate('#pfg-cta'); // -> compare1
  await answer(p, 'rateChange', 'increase', { tap: touch });
  await answer(p, 'claim', 'context-only', { tap: touch });
  await activate('#pfg-cta'); // -> trial2 setup
  await activate('#pfg-cta'); // -> t2-medium
  await recordCurrent(p, '8.3');
  await activate('#pfg-cta'); // -> t2-high
  await activate('[data-light-value="100"]');
  await recordCurrent(p, '8.3');
  await activate('#pfg-cta'); // -> compare2
}

(async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch(launchOptions());
  const external = [];
  const errors = [];
  let checks = 0;
  const ok = (label) => { checks++; console.log('PASS', label); };

  try {
    // Desktop 1280 ------------------------------------------------------------------------------------------------------
    {
      const { ctx, page: p } = await openPage(browser, base, {
        viewport: { width: 1280, height: 900 }, external, errors,
      });

      assert.equal(await p.title(), '光合作用條件實驗（導引版原型）｜百宏文教');
      assert.match(await txt(p, '#pfg-welcome-title'), /光變強/);
      assert.deepEqual(await cta(p), { label: '開始', enabled: true });
      assert.equal(await p.locator('#pfg-coach').isHidden(), true);
      await preConcept(p, '1280 welcome');
      await common(p, '1280 welcome');
      await shot(p, '1280-welcome');
      ok('1280 welcome: neutral metadata, core question, one CTA, axe and no overflow');

      await p.click('#pfg-cta'); await settle(p);
      assert.equal(await phase(p), 'mission');
      assert.match(await txt(p, '#pfg-welcome-title'), /只改光照/);
      assert.deepEqual(await cta(p), { label: '開始第一組', enabled: true });
      assert.equal(await focused(p), '#pfg-welcome-title');
      await preConcept(p, '1280 mission');
      ok('mission: control-variable strategy only, no formal concept');

      await p.click('#pfg-cta'); await settle(p);
      assert.equal(await phase(p), 'trial1-low-light');
      assert.deepEqual(await cta(p), { label: '開始觀察', enabled: true });
      assert.equal(await p.locator('[data-light-value]:not(:disabled)').count(), 0, 'first observation has no editable light control');
      assert.match(await txt(p, '#pfg-data'), /15%/);
      assert.match(await txt(p, '#pfg-data'), /1000 ppm/);
      assert.match(await txt(p, '#pfg-data'), /25°C/);
      await preConcept(p, '1280 t1 low');
      await common(p, '1280 t1 low');
      ok('Trial 1A: 15% / 1000 ppm / 25°C, observation CTA, controls locked');

      await p.click('#pfg-cta'); await settle(p);
      assert.equal((await p.evaluate(() => window.__pfgTest.getState().records.length)), 1);
      assert.match(await txt(p, '[data-role="observation"]'), /7\.4/);
      assert.deepEqual(await cta(p), { label: '只把光照調到 60%', enabled: true });
      await p.click('#pfg-cta'); await settle(p);
      assert.equal(await phase(p), 'trial1-higher-light');
      assert.equal(await focused(p), 'light:60');
      assert.deepEqual(await cta(p), { label: '開始第二次觀察', enabled: false });
      assert.equal(await p.locator('[data-light-value="60"]').isEnabled(), true);
      assert.equal(await p.locator('[data-light-value="15"]').isDisabled(), true);
      assert.equal(await p.locator('[data-light-value="100"]').isDisabled(), true);
      await preConcept(p, '1280 t1 higher before set');
      ok('Trial 1B arrival: focus lands on the only permitted 60% control and observe stays locked');

      await p.keyboard.press('Enter'); await settle(p);
      assert.deepEqual(await cta(p), { label: '開始第二次觀察', enabled: true });
      assert.match(await txt(p, '#pfg-status'), /60%/);
      await p.click('#pfg-cta'); await settle(p);
      assert.match(await txt(p, '[data-role="observation"]'), /17\.4/);
      assert.equal((await p.evaluate(() => window.__pfgTest.getState().records.length)), 2);
      assert.deepEqual(await cta(p), { label: '比較第一組', enabled: true });
      await preConcept(p, '1280 t1 done');
      await shot(p, '1280-trial1-done');
      ok('Trial 1B: keyboard sets 60%; second observation is 17.4 and both evidence records remain visible');

      await p.click('#pfg-cta'); await settle(p);
      assert.equal(await phase(p), 'compare1');
      assert.equal(await focused(p), '#pfg-compare-title');
      const table1 = await txt(p, '#pfg-compare');
      assert.match(table1, /15%/); assert.match(table1, /60%/);
      assert.match(table1, /7\.4/); assert.match(table1, /17\.4/);
      assert.match(table1, /只有光照不同/);
      assert.deepEqual(await cta(p), { label: '換一組條件', enabled: false });
      await answer(p, 'rateChange', 'same');
      assert.match(await txt(p, '[data-feedback="rateChange"]'), /比較兩次/);
      assert.equal((await cta(p)).enabled, false);
      await answer(p, 'rateChange', 'increase');
      await answer(p, 'claim', 'always-more-light');
      assert.match(await txt(p, '[data-feedback="claim"]'), /不足以證明/);
      assert.equal((await cta(p)).enabled, false);
      await answer(p, 'claim', 'context-only');
      assert.equal((await cta(p)).enabled, true);
      await preConcept(p, '1280 compare1 answered');
      await common(p, '1280 compare1');
      await shot(p, '1280-compare1');
      ok('Compare 1: data-derived table; wrong overclaim is nudged and does not unlock progression');

      await p.click('#pfg-cta'); await settle(p);
      assert.equal(await phase(p), 'trial2-setup');
      assert.match(await txt(p, '#pfg-welcome-title'), /CO₂ 較少/);
      assert.match(await txt(p, '#pfg-welcome-sub'), /25°C/);
      await preConcept(p, '1280 trial2 setup');
      ok('Trial 2 setup: CO₂ condition changes before the controlled pair begins, still no formal concept');

      await p.click('#pfg-cta'); await settle(p);
      assert.equal(await phase(p), 'trial2-medium-light');
      assert.match(await txt(p, '#pfg-data'), /60%/);
      assert.match(await txt(p, '#pfg-data'), /150 ppm/);
      await p.click('#pfg-cta'); await settle(p);
      assert.match(await txt(p, '[data-role="observation"]'), /8\.3/);
      await p.click('#pfg-cta'); await settle(p);
      assert.equal(await phase(p), 'trial2-high-light');
      assert.equal(await focused(p), 'light:100');
      assert.equal(await p.locator('[data-light-value="100"]').isEnabled(), true);
      assert.equal((await cta(p)).enabled, false);
      await p.click('[data-light-value="100"]'); await settle(p);
      assert.equal((await cta(p)).enabled, true);
      await p.click('#pfg-cta'); await settle(p);
      assert.match(await txt(p, '[data-role="observation"]'), /8\.3/);
      assert.equal((await p.evaluate(() => window.__pfgTest.getState().records.length)), 4);
      await preConcept(p, '1280 trial2 done');
      ok('Trial 2: 60% and 100% both settle near 8.3; only the 100% control is editable');

      await p.click('#pfg-cta'); await settle(p);
      assert.equal(await phase(p), 'compare2');
      const table2 = await txt(p, '#pfg-compare');
      assert.match(table2, /60%/); assert.match(table2, /100%/);
      assert.ok((table2.match(/8\.3/g) || []).length >= 2);
      await answer(p, 'rateChange', 'increase');
      assert.equal((await cta(p)).enabled, false);
      await answer(p, 'rateChange', 'same');
      await answer(p, 'reason', 'light-no-effect');
      assert.match(await txt(p, '[data-feedback="reason"]'), /不能說光照完全沒有作用/);
      assert.equal((await cta(p)).enabled, false);
      await answer(p, 'reason', 'other-condition-short');
      assert.equal((await cta(p)).enabled, true);
      await preConcept(p, '1280 compare2 answered');
      await common(p, '1280 compare2');
      await shot(p, '1280-compare2');
      ok('Compare 2: plateau evidence and another-condition explanation; wrong answers remain gated');

      await p.click('#pfg-cta'); await settle(p);
      assert.equal(await phase(p), 'inference');
      assert.match(await txt(p, '#pfg-welcome-title'), /兩組結果卻不一樣/);
      assert.match(await txt(p, '#pfg-welcome-sub'), /另一個條件更不足/);
      assert.deepEqual(await cta(p), { label: '看看這個現象叫什麼', enabled: true });
      await preConcept(p, '1280 inference');
      const saidBefore = (await p.evaluate(() => window.__pfgSaid.slice())).join(' | ');
      assert.doesNotMatch(saidBefore, FORBIDDEN);
      ok('Inference: learner gets the relation in ordinary words, formal term still withheld from text and announcements');

      await p.click('#pfg-cta'); await settle(p);
      assert.equal(await phase(p), 'concept');
      assert.equal(await focused(p), '#pfg-concept-title');
      assert.match(await txt(p, '#pfg-concept-title'), /限制因子/);
      const concept = await txt(p, '#pfg-concept');
      assert.match(concept, /7\.4/); assert.match(concept, /17\.4/);
      assert.ok((concept.match(/8\.3/g) || []).length >= 2);
      assert.match(concept, /最低條件是光照/);
      assert.match(concept, /最低條件是CO₂/);
      assert.match(concept, /相對速率 = 20 × 三項因子中的最低值/);
      assert.match(concept, /簡化模型/);
      assert.equal(await cta(p), null, 'B3 stops at Concept');
      assert.match(await txt(p, '#pfg-status'), /這一階段的觀察與整理已完成/);
      await common(p, '1280 concept');
      await shot(p, '1280-concept');
      ok('Concept: formal term appears for the first time beside both experiment records; B3 stops here');
      await ctx.close();
    }

    // Phone 390 ---------------------------------------------------------------------------------------------------------
    {
      const { ctx, page: p } = await openPage(browser, base, {
        viewport: { width: 390, height: 844 }, touch: true, external, errors,
      });
      await common(p, '390 welcome');
      assert.ok((await p.locator('#pfg-cta').boundingBox()).height >= 56, 'phone CTA >= 56px');

      const tap = async (sel) => {
        const l = p.locator(sel);
        await l.scrollIntoViewIfNeeded();
        await l.tap();
        await settle(p);
      };
      await tap('#pfg-cta'); await tap('#pfg-cta'); // mission -> t1-low
      await tap('#pfg-cta'); // observe 7.4
      await tap('#pfg-cta'); // t1-higher
      const light60 = await p.locator('[data-light-value="60"]').boundingBox();
      assert.ok(light60.height >= 64, `60% light target is ${light60.height}px high`);
      await tap('[data-light-value="60"]');
      await preConcept(p, '390 t1 higher');
      await common(p, '390 t1 higher');
      await shot(p, '390-trial1-higher');
      await tap('#pfg-cta'); await tap('#pfg-cta'); // observe -> compare1
      await answer(p, 'rateChange', 'increase', { tap: true });
      await answer(p, 'claim', 'context-only', { tap: true });
      const pill = await p.locator('.sg-pill').first().boundingBox();
      assert.ok(pill.height >= 44, `compare option target is ${pill.height}px high`);
      await tap('#pfg-cta'); await tap('#pfg-cta'); // setup -> t2 medium
      await tap('#pfg-cta'); await tap('#pfg-cta'); // observe -> t2 high
      await tap('[data-light-value="100"]');
      await tap('#pfg-cta'); await tap('#pfg-cta'); // observe -> compare2
      assert.equal(await phase(p), 'compare2');
      await preConcept(p, '390 compare2');
      await common(p, '390 compare2');
      await shot(p, '390-compare2');
      await answer(p, 'rateChange', 'same', { tap: true });
      await answer(p, 'reason', 'other-condition-short', { tap: true });
      await tap('#pfg-cta'); // inference
      await preConcept(p, '390 inference');
      await tap('#pfg-cta'); // concept
      assert.equal(await phase(p), 'concept');
      assert.match(await txt(p, '#pfg-concept'), /限制因子/);
      assert.equal(await cta(p), null);
      await common(p, '390 concept');
      await shot(p, '390-concept');
      ok('390 touch path: >=64px light targets, >=44px answer options, no overflow, full flow to Concept');
      await ctx.close();
    }

    // Reduced motion ----------------------------------------------------------------------------------------------------
    {
      const { ctx, page: p } = await openPage(browser, base, {
        viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', external, errors,
      });
      await p.click('#pfg-cta'); await settle(p);
      await p.click('#pfg-cta'); await settle(p);
      const motion = await p.locator('.pg-bubble').first().evaluate((el) => ({
        animationName: getComputedStyle(el).animationName,
        transitionDuration: getComputedStyle(document.querySelector('.pg-light-beam')).transitionDuration,
      }));
      assert.equal(motion.animationName, 'none');
      assert.ok(motion.transitionDuration === '0s' || motion.transitionDuration === '0ms');
      await preConcept(p, 'reduced motion');
      ok('reduced motion: bubble animation and beam transition are disabled');
      await ctx.close();
    }

    // As shipped: no debug hook, no persistence/analytics behavior -----------------------------------------------------
    {
      const { ctx, page: p } = await openPage(browser, base, {
        viewport: { width: 1280, height: 900 }, hook: false, external, errors,
      });
      assert.equal(await p.evaluate(() => typeof window.__pfgTest), 'undefined');
      assert.equal(await p.evaluate(() => typeof window.bhcsScienceTrack), 'undefined');
      await p.click('#pfg-cta'); await settle(p);
      assert.equal(await p.getAttribute('#main', 'data-phase'), 'mission');
      await p.reload();
      await p.waitForFunction(() => document.getElementById('main')?.dataset.phase === 'welcome');
      assert.equal(await p.getAttribute('#main', 'data-phase'), 'welcome', 'B3 reload starts over');
      ok('as shipped: no test hook, no analytics adapter, no persistence; reload starts at Welcome');
      await ctx.close();
    }

    assert.deepEqual(external, [], `unexpected network requests: ${external.join(', ')}`);
    assert.deepEqual(errors, [], `browser errors: ${errors.join(' | ')}`);
    console.log(`photosynthesis guided flow: ${checks} checks passed`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
