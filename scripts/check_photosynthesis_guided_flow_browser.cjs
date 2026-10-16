// B3-B4 real-browser gate for Science Lab 2.0 Pilot #5.
// Local-only until B5. Covers pre-concept leakage, full Notebook/Challenges/Complete flow, restore, storage privacy,
// anonymous analytics, 1280/390 layout, touch targets, reduced motion, one live region and axe.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  createServer, openPage, axeScan, settle, launchOptions, root,
} = require('./photosynthesis_guided_test_support.cjs');

const OUT = path.resolve(process.env.PHOTOSYNTHESIS_FLOW_OUTPUT || path.join(root, 'photosynthesis-flow-artifacts'));
const FORBIDDEN = /限制因子|最低條件|三項因子中的最低值|最低的一項/;
const SAVE_KEY = 'bhcs-photosynthesis-factor-guided:v1';
const FULL_EVENTS = [
  'lab_start',
  'trial_recorded', 'trial_recorded',
  'compare_complete',
  'trial_recorded', 'trial_recorded',
  'compare_complete',
  'notebook_complete',
  'challenge_complete', 'challenge_complete', 'challenge_complete',
  'lab_complete',
];
const FORBIDDEN_SAVE_KEYS = ['rate', 'factors', 'limit', 'oxygen', 'correct', 'allCorrect', 'ready', 'expected'];

const phase = (p) => p.evaluate(() => window.__pfgTest.getState().phase);
const txt = (p, sel) => p.locator(sel).innerText();
const cta = (p) => p.evaluate(() => {
  const b = document.getElementById('pfg-cta');
  return b.hidden ? null : { label: b.textContent, enabled: !b.disabled };
});
const events = (p) => p.evaluate(() => (window.__testScienceEvents || []).map((e) => [...e]));
const saved = (p) => p.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
const reload = async (p) => {
  await p.reload();
  await p.waitForFunction(() => document.getElementById('main')?.dataset.phase);
  await settle(p);
};
const shot = async (p, name) => {
  fs.mkdirSync(OUT, { recursive: true });
  await p.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
};
const activate = async (p, sel, { tap = false } = {}) => {
  const loc = p.locator(sel);
  await loc.scrollIntoViewIfNeeded();
  if (tap) await loc.tap(); else await loc.click();
  await settle(p);
};
const answer = async (p, q, value, { tap = false } = {}) => {
  const loc = p.locator(`input[data-compare][data-q="${q}"][value="${value}"]`);
  await loc.scrollIntoViewIfNeeded();
  if (tap) await loc.tap(); else await loc.check();
  await settle(p);
};
const relation = async (p, q, value, { tap = false } = {}) => {
  const loc = p.locator(`input[data-relation][data-q="${q}"][value="${value}"]`);
  await loc.scrollIntoViewIfNeeded();
  if (tap) await loc.tap(); else await loc.check();
  await settle(p);
};
const option = async (p, value, { tap = false } = {}) => {
  const loc = p.locator(`button[data-option="${value}"]:not([disabled])`);
  await loc.scrollIntoViewIfNeeded();
  if (tap) await loc.tap(); else await loc.click();
  await settle(p);
};
const feedback = (p, step) => p.evaluate((id) => {
  const el = document.querySelector(`[data-step-feedback="${id}"]`);
  return el && !el.hidden ? { kind: el.dataset.kind, text: el.textContent } : null;
}, step);
const keysOf = (v) => (v && typeof v === 'object'
  ? Object.entries(v).flatMap(([k, x]) => [Array.isArray(v) ? null : k, ...keysOf(x)]).filter(Boolean)
  : []);

function checkPayload(list, label) {
  for (const args of list) {
    assert.equal(args.length, 2, `${label}: ${JSON.stringify(args)}`);
    assert.match(args[0], /^(lab_start|trial_recorded|compare_complete|notebook_complete|challenge_complete|lab_complete)$/);
    assert.equal(args[1], 'photosynthesis-factor-guided');
  }
  const stripped = JSON.stringify(list).replace(/"photosynthesis-factor-guided"/g, '');
  for (const bad of ['1000', '150', '25', '60', '100', '7.4', '17.4', '8.3', 'raise-co2', 'change-co2-only', 'cannot-say-always', 'freeText', 'evidenceText']) {
    assert.ok(!stripped.includes(bad), `${label}: analytics carries ${bad}`);
  }
}

async function learnerText(p) {
  return p.evaluate(() => {
    const attrs = [...document.querySelectorAll('*')].flatMap((e) =>
      ['aria-label', 'aria-description', 'title', 'alt', 'placeholder']
        .map((a) => e.getAttribute(a)).filter(Boolean));
    return {
      body: document.body.innerText,
      title: document.title,
      attrs: attrs.join(' | '),
      said: (window.__pfgSaid || []).join(' | '),
    };
  });
}

async function preConcept(p, label) {
  const all = await learnerText(p);
  for (const [where, value] of Object.entries(all)) {
    assert.ok(!FORBIDDEN.test(value), `${label}: formal answer leaked in ${where}: ${value.slice(0, 220)}`);
  }
  const concept = await p.evaluate(() => ({
    hidden: document.getElementById('pfg-concept').hidden,
    children: document.querySelector('[data-pfg-concept-body]').children.length,
  }));
  assert.deepEqual(concept, { hidden: true, children: 0 }, `${label}: concept DOM exists early`);
}

async function common(p, label) {
  const info = await p.evaluate(() => ({
    live: [...document.querySelectorAll('[aria-live]')].map((e) => e.id),
    implicit: document.querySelectorAll('[role="status"],[role="alert"],[role="log"]').length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    h1: document.querySelectorAll('h1').length,
  }));
  assert.deepEqual(info.live, ['pfg-announcer'], `${label}: exactly one live region`);
  assert.equal(info.implicit, 0, `${label}: no implicit live region`);
  assert.equal(info.h1, 1);
  assert.ok(info.overflow <= 1, `${label}: horizontal overflow ${info.overflow}px`);
  await axeScan(p, label);
}

async function observe(p, rate, opts = {}) {
  await activate(p, '#pfg-cta', opts);
  assert.match(await txt(p, '[data-role="observation"]'), new RegExp(`相對產氧速度 ${rate.replace('.', '\\.')}`));
}

async function reachConcept(p, { tap = false, wrongAnswers = false } = {}) {
  const opts = { tap };
  await activate(p, '#pfg-cta', opts); // mission
  await activate(p, '#pfg-cta', opts); // trial1 low
  await observe(p, '7.4', opts);
  await activate(p, '#pfg-cta', opts); // trial1 high
  await activate(p, '[data-light-value="60"]', opts);
  await observe(p, '17.4', opts);
  await activate(p, '#pfg-cta', opts); // compare1
  if (wrongAnswers) {
    await answer(p, 'rateChange', 'same', opts);
    assert.equal((await cta(p)).enabled, false);
  }
  await answer(p, 'rateChange', 'increase', opts);
  await answer(p, 'claim', 'context-only', opts);
  await activate(p, '#pfg-cta', opts); // setup
  await activate(p, '#pfg-cta', opts); // trial2 medium
  await observe(p, '8.3', opts);
  await activate(p, '#pfg-cta', opts); // trial2 high
  await activate(p, '[data-light-value="100"]', opts);
  await observe(p, '8.3', opts);
  await activate(p, '#pfg-cta', opts); // compare2
  if (wrongAnswers) {
    await answer(p, 'reason', 'light-no-effect', opts);
    assert.equal((await cta(p)).enabled, false);
  }
  await answer(p, 'rateChange', 'same', opts);
  await answer(p, 'reason', 'other-condition-short', opts);
  await activate(p, '#pfg-cta', opts); // inference
  await preConcept(p, tap ? '390 inference' : '1280 inference');
  await activate(p, '#pfg-cta', opts); // concept
  assert.equal(await phase(p), 'concept');
}

(async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch(launchOptions());
  const external = [], errors = [];
  let checks = 0;
  const ok = (label) => { checks++; console.log('PASS', label); };

  try {
    // Desktop full flow -----------------------------------------------------------------------------------------------
    {
      const { ctx, page: p } = await openPage(browser, base, { viewport: { width: 1280, height: 900 }, external, errors });
      assert.equal(await p.title(), '光合作用條件實驗（導引版原型）｜百宏文教');
      assert.deepEqual(await cta(p), { label: '開始', enabled: true });
      await preConcept(p, '1280 welcome');
      await common(p, '1280 welcome');
      await shot(p, '1280-welcome');
      ok('welcome: neutral metadata, no formal concept, one live region, axe clean');

      await reachConcept(p, { wrongAnswers: true });
      const concept = await txt(p, '#pfg-concept');
      assert.match(concept, /限制因子/);
      assert.match(concept, /7\.4/); assert.match(concept, /17\.4/);
      assert.ok((concept.match(/8\.3/g) || []).length >= 2);
      assert.match(concept, /最低條件是光照/);
      assert.match(concept, /最低條件是CO₂/);
      assert.deepEqual(await cta(p), { label: '整理研究手冊', enabled: true });
      await common(p, '1280 concept');
      await shot(p, '1280-concept');
      ok('concept: formal name appears only after inference, with both controlled experiments');

      // Notebook A: wrong then correct.
      await activate(p, '#pfg-cta');
      assert.equal(await phase(p), 'notebook');
      assert.equal(await p.locator('input[data-level][value="A"]').isChecked(), true);
      const notebookText = await txt(p, '#pfg-notebook');
      for (const v of ['7.4', '17.4', '8.3']) assert.match(notebookText, new RegExp(v.replace('.', '\\.')));
      await relation(p, 'trial1Change', 'increase');
      await relation(p, 'trial2Change', 'same');
      await relation(p, 'alwaysWorks', 'yes');
      assert.equal((await cta(p)).enabled, false);
      assert.match(await txt(p, '[data-nudge]'), /兩組數據/);
      await relation(p, 'alwaysWorks', 'no');
      assert.deepEqual(await cta(p), { label: '進入挑戰', enabled: true });
      await common(p, '1280 notebook');
      await shot(p, '1280-notebook');
      ok('Notebook A: evidence table, wrong synthesis stays gated, record-derived relations unlock');

      // Challenge 1: nudge -> hint -> correct.
      await activate(p, '#pfg-cta');
      assert.equal(await phase(p), 'challenge-1');
      await option(p, 'raise-light');
      assert.equal((await feedback(p, 'c1-next')).kind, 'nudge');
      await option(p, 'raise-temp');
      assert.equal((await feedback(p, 'c1-next')).kind, 'hint');
      await option(p, 'raise-co2');
      assert.equal((await feedback(p, 'c1-next')).kind, 'success');
      assert.deepEqual(await cta(p), { label: '下一題挑戰', enabled: true });
      ok('Challenge 1: low CO2 plateau points to CO2; hints escalate without revealing first');

      await activate(p, '#pfg-cta');
      assert.equal(await phase(p), 'challenge-2');
      assert.match(await txt(p, '#pfg-challenge'), /只改 CO₂/);
      await option(p, 'change-co2-only');
      assert.equal((await feedback(p, 'c2-fair')).kind, 'success');
      await common(p, '1280 challenge2');
      ok('Challenge 2: fair comparison changes CO2 only');

      await activate(p, '#pfg-cta');
      assert.equal(await phase(p), 'challenge-3');
      assert.match(await txt(p, '.sg-scenario'), /25°C.*19\.2.*40°C.*5\.0/);
      await option(p, 'always-faster');
      assert.equal((await feedback(p, 'c3-claim')).kind, 'nudge');
      await option(p, 'cannot-say-always');
      assert.equal((await feedback(p, 'c3-claim')).kind, 'success');
      assert.equal(await p.locator('[data-note]').isVisible(), true);
      await p.locator('[data-note] textarea').fill('25°C 的模型速率比 40°C 高');
      assert.deepEqual(await cta(p), { label: '完成這一站', enabled: true });
      await common(p, '1280 challenge3');
      await shot(p, '1280-challenge3');
      ok('Challenge 3: the 25°C/40°C evidence rejects the universal higher-temperature claim');

      await activate(p, '#pfg-cta');
      assert.equal(await phase(p), 'complete');
      assert.equal(await p.evaluate(() => window.__pfgTest.getState().challenges[3].note), '25°C 的模型速率比 40°C 高');
      assert.equal(await txt(p, '#pfg-complete-title'), '這一站完成了');
      assert.equal(await p.locator('#pfg-complete .sg-claim').count(), 3);
      assert.match(await txt(p, '#pfg-complete .sg-complete-conclusion'), /第一組增加、第二組幾乎不變/);
      assert.equal(await cta(p), null);
      assert.equal(await p.locator('#pfg-complete a').count(), 0);
      await common(p, '1280 complete');
      await shot(p, '1280-complete');

      const ev = await events(p);
      checkPayload(ev, 'desktop full');
      assert.deepEqual(ev.map(([name]) => name), FULL_EVENTS, 'all 12 milestones in order');
      ok('Complete: three claims, learner conclusion, no public link, exact anonymous milestone sequence');

      // Save contains raw trial source values, but no derived result/answer keys.
      const raw = await saved(p);
      const save = JSON.parse(raw);
      const keys = keysOf(save);
      for (const key of FORBIDDEN_SAVE_KEYS) assert.ok(!keys.includes(key), `save contains ${key}`);
      assert.equal(save.records.length, 4);
      assert.ok(save.records.every((r) => Object.keys(r).sort().join() === 'co2,light,temperature,trialId'));
      assert.deepEqual(await p.evaluate(() => Object.keys(localStorage)), [SAVE_KEY]);
      assert.equal(await p.evaluate(() => sessionStorage.length), 0);
      ok('Save: raw trial conditions + learner inputs only; no rate/factors/limit/correct/ready/expected');

      // Reload on Complete sends no milestone again.
      await reload(p);
      assert.equal(await phase(p), 'complete');
      assert.deepEqual(await events(p), []);
      assert.deepEqual(await p.evaluate(() => window.__pfgSaid), []);
      assert.equal(await txt(p, '#pfg-storage-note'), '已接續上次的進度。');
      await common(p, '1280 restored complete');
      ok('Complete restore: same phase, no repeated analytics and no restore announcement');

      // Restart cancel, then accept.
      p.once('dialog', (d) => d.dismiss());
      await activate(p, '#pfg-restart');
      assert.equal(await phase(p), 'complete');
      let message = null;
      p.once('dialog', (d) => { message = d.message(); d.accept(); });
      await Promise.all([p.waitForEvent('load'), p.click('#pfg-restart')]);
      await p.waitForFunction(() => document.getElementById('main')?.dataset.phase);
      assert.equal(message, '要清除這一站的進度並重新開始嗎？');
      assert.equal(await p.getAttribute('#main', 'data-phase'), 'welcome');
      assert.equal(await saved(p), null);
      ok('Restart: confirmation protects the save; accept clears it and returns to Welcome');
      await ctx.close();
    }

    // Early restore + missing/throwing analytics -----------------------------------------------------------------------
    {
      const { ctx, page: p } = await openPage(browser, base, { viewport: { width: 1280, height: 900 }, external, errors });
      await activate(p, '#pfg-cta'); await activate(p, '#pfg-cta');
      assert.equal(await saved(p), null, 'nothing saved before first record');
      await observe(p, '7.4');
      assert.equal(await p.locator('#pfg-restart').isVisible(), true);
      assert.equal(await txt(p, '#pfg-storage-note'), '進度已保存在這台裝置。');
      assert.deepEqual((await events(p)).map(([n]) => n), ['lab_start', 'trial_recorded']);
      await reload(p);
      assert.equal(await phase(p), 'trial1-low-light');
      assert.equal((await p.evaluate(() => window.__pfgTest.getState().records.length)), 1);
      assert.deepEqual(await events(p), []);
      assert.deepEqual(await p.evaluate(() => window.__pfgSaid), []);
      await preConcept(p, 'restored first record');
      await common(p, 'restored first record');
      ok('Early restore: first record is recovered; milestones and announcements are not replayed');
      await ctx.close();

      for (const adapter of ['throw', 'absent']) {
        const { ctx: c2, page: q } = await openPage(browser, base, { viewport: { width: 1280, height: 900 }, adapter, external, errors });
        await activate(q, '#pfg-cta'); await activate(q, '#pfg-cta'); await observe(q, '7.4');
        assert.equal(await phase(q), 'trial1-low-light', adapter);
        assert.equal((await q.evaluate(() => window.__testScienceEvents.length)), adapter === 'throw' ? 2 : 0);
        await c2.close();
      }
      ok('missing or throwing analytics adapter never stops the lab');
    }

    // Phone 390 full late flow, using Level C --------------------------------------------------------------------------
    {
      const { ctx, page: p } = await openPage(browser, base, {
        viewport: { width: 390, height: 844 }, touch: true, external, errors,
      });
      await reachConcept(p, { tap: true });
      await common(p, '390 concept');
      await activate(p, '#pfg-cta', { tap: true });
      assert.equal(await phase(p), 'notebook');

      await activate(p, 'input[data-level][value="C"]', { tap: true });
      const boxes = await p.evaluate(() => [...document.querySelectorAll('#pfg-notebook textarea')]
        .filter((e) => e.offsetParent)
        .map((e) => ({ width: Math.round(e.getBoundingClientRect().width), font: parseFloat(getComputedStyle(e).fontSize) })));
      assert.equal(boxes.length, 2);
      for (const b of boxes) assert.ok(b.width >= 280 && b.font >= 15, `textarea ${JSON.stringify(b)}`);
      await p.locator('#pfg-nb-evidence').fill('第一組 7.4 到 17.4，第二組 8.3 到 8.3');
      await p.locator('#pfg-nb-limit').fill('這只是相對速率，沒有包含所有真實植物條件');
      await p.locator('#pfg-nb-limit').blur(); await settle(p);
      assert.equal(await p.locator('[data-ideas]').isVisible(), true);
      assert.equal((await cta(p)).enabled, true);
      await common(p, '390 notebook');
      await shot(p, '390-notebook');

      await activate(p, '#pfg-cta', { tap: true });
      await option(p, 'raise-co2', { tap: true });
      const optionSize = await p.locator('button[data-option="raise-co2"]').boundingBox();
      assert.ok(optionSize.width >= 280 && optionSize.height >= 44);
      await activate(p, '#pfg-cta', { tap: true });
      await option(p, 'change-co2-only', { tap: true });
      await activate(p, '#pfg-cta', { tap: true });
      await option(p, 'cannot-say-always', { tap: true });
      await common(p, '390 challenge3');
      await shot(p, '390-challenge3');
      await activate(p, '#pfg-cta', { tap: true });

      assert.equal(await phase(p), 'complete');
      assert.deepEqual(await p.evaluate(() =>
        [...document.querySelectorAll('#pfg-complete .sg-complete-conclusion')].map((e) => e.textContent)), [
        '我在研究手冊裡寫下：',
        '第一組 7.4 到 17.4，第二組 8.3 到 8.3',
        '這只是相對速率，沒有包含所有真實植物條件',
      ]);
      await common(p, '390 complete');
      await shot(p, '390-complete');
      const phoneEvents = await events(p);
      checkPayload(phoneEvents, 'phone full');
      assert.deepEqual(phoneEvents.map(([name]) => name), FULL_EVENTS);
      ok('390 touch flow: Level C writing, all three challenges and Complete fit without overflow; targets and analytics pass');
      await ctx.close();
    }

    // Reduced motion ----------------------------------------------------------------------------------------------------
    {
      const { ctx, page: p } = await openPage(browser, base, {
        viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', external, errors,
      });
      await activate(p, '#pfg-cta'); await activate(p, '#pfg-cta');
      const motion = await p.locator('.pg-bubble').first().evaluate((el) => ({
        animationName: getComputedStyle(el).animationName,
        transitionDuration: getComputedStyle(document.querySelector('.pg-light-beam')).transitionDuration,
      }));
      assert.equal(motion.animationName, 'none');
      assert.ok(motion.transitionDuration === '0s' || motion.transitionDuration === '0ms');
      await preConcept(p, 'reduced motion');
      ok('reduced motion disables the bench animation/transition');
      await ctx.close();
    }

    // Shipped page: no test hook, analytics adapter loads before module, storage survives reload -----------------------
    {
      const { ctx, page: p } = await openPage(browser, base, {
        viewport: { width: 1280, height: 900 }, hook: false, external, errors,
      });
      assert.equal(await p.evaluate(() => typeof window.__pfgTest), 'undefined');
      assert.equal(await p.evaluate(() => typeof window.bhcsScienceTrack), 'function');
      const scripts = await p.evaluate(() => [...document.scripts].map((s) => s.getAttribute('src')));
      assert.deepEqual(scripts, ['../../assets/science-events.js', '../../assets/photosynthesis-guided/main.js']);
      await p.click('#pfg-cta'); await p.click('#pfg-cta'); await p.click('#pfg-cta'); await settle(p);
      assert.deepEqual(await p.evaluate(() => Object.keys(localStorage)), [SAVE_KEY]);
      await p.reload();
      await p.waitForFunction(() => document.getElementById('main')?.dataset.phase);
      assert.equal(await p.getAttribute('#main', 'data-phase'), 'trial1-low-light');
      assert.equal(await p.evaluate(() => sessionStorage.length), 0);
      ok('as shipped: no test hook; adapter loads first; one local save key restores progress');
      await ctx.close();
    }

    assert.deepEqual(external, [], `unexpected external requests: ${external.join(', ')}`);
    assert.deepEqual(errors, [], `console/page errors: ${errors.join(' | ')}`);
    ok('no external requests and no browser errors');
    console.log(`photosynthesis guided flow: ${checks} checks passed; screenshots in ${path.relative(root, OUT)}/`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
