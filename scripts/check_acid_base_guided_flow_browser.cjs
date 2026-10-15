// B3 browser gate: the guided acid–base page (Pilot #4) from the welcome screen to the concept screen, in a real browser.
// Needs Playwright (NODE_PATH pointing at a playwright install). Writes review screenshots to acid-base-flow-artifacts/.
// B4 and B5 extend this same file to the notebook, challenges, saving and the finish.
//
// Desktop 1280: mouse drag, a button and the keyboard in Trial 1; wrong answers that keep each compare locked; Trial 2;
// the concept naming, then the pH part. Phone 390: touch drag and taps through the same path.
// At every step before the concept: no class of liquid and no pH in the visible text, the document title, any
// aria-label / aria-description / title / alt / placeholder, or anything the live region has said; the concept body is
// empty (not merely hidden); one live region; no sideways scroll; axe clean.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createServer, openPage, axeScan, settle, launchOptions, touchDrag, root } = require('./acid_base_guided_test_support.cjs');
const OUT = path.resolve(process.env.ACID_BASE_FLOW_OUTPUT || path.join(root, 'acid-base-flow-artifacts'));
const FORBIDDEN = /酸|鹼|中性|pH|小於\s*7|等於\s*7|大於\s*7|<\s*7|=\s*7|>\s*7/;

const phase = (p) => p.evaluate(() => window.__abgTest.getState().phase);
const txt = (p, sel) => p.locator(sel).innerText();
const focused = (p) => p.evaluate(() => { const a = document.activeElement; return a?.id ? `#${a.id}` : a?.getAttribute('data-dip-sample') ? `dip:${a.getAttribute('data-dip-sample')}` : a?.matches?.('[data-compare]') ? `radio:${a.dataset.q}:${a.value}` : a?.tagName; });
const cta = async (p) => p.evaluate(() => { const b = document.getElementById('abg-cta'); return b.hidden ? null : { label: b.textContent, enabled: !b.disabled }; });
const shot = async (p, name) => { fs.mkdirSync(OUT, { recursive: true }); await p.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true }); };
const center = async (loc) => { await loc.scrollIntoViewIfNeeded(); const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
/** Strip and drop-zone centres measured after one scroll, so neither point is stale. */
const dragPoints = async (p, id) => {
  await p.locator('[data-role="bench"]').scrollIntoViewIfNeeded();
  const box = async (sel) => { const b = await p.locator(sel).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  return [await box('[data-role="strip"]'), await box(`[data-drop-sample="${id}"]`)];
};
const answer = async (p, q, value, { tap = false } = {}) => { const l = p.locator(`input[data-compare][data-q="${q}"][value="${value}"]`); await l.scrollIntoViewIfNeeded(); if (tap) await l.tap(); else await l.check(); await settle(p); };

/** Everything a learner can read or hear before the concept, as one string per source. */
async function learnerText(p) {
  return p.evaluate(() => {
    const attrs = [...document.querySelectorAll('*')].flatMap((e) => ['aria-label', 'aria-description', 'title', 'alt', 'placeholder'].map((a) => e.getAttribute(a)).filter(Boolean));
    return { body: document.body.innerText, title: document.title, attrs: attrs.join(' | '), said: (window.__abgSaid || []).join(' | ') };
  });
}
async function preConcept(p, label) {
  const t = await learnerText(p);
  for (const [k, v] of Object.entries(t)) assert.ok(!FORBIDDEN.test(v), `${label}: "${v.match(FORBIDDEN)?.[0]}" appears in ${k} before the concept: ${v.slice(0, 200)}`);
  const c = await p.evaluate(() => ({ hidden: document.getElementById('abg-concept').hidden, children: document.querySelector('[data-abg-concept-body]').children.length, cards: document.querySelectorAll('[data-concept-card]').length }));
  assert.deepEqual(c, { hidden: true, children: 0, cards: 0 }, `${label}: the concept is in the page before its time`);
}
async function common(p, label) {
  const live = await p.evaluate(() => ({ live: [...document.querySelectorAll('[aria-live]')].map((e) => e.id), roles: document.querySelectorAll('[role="status"],[role="alert"],[role="log"]').length, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, h1: document.querySelectorAll('h1').length }));
  assert.deepEqual(live.live, ['abg-announcer'], `${label}: one live region`);
  assert.equal(live.roles, 0, `${label}: no implicit live region`);
  assert.equal(live.h1, 1);
  assert.ok(live.overflow <= 1, `${label}: sideways scroll ${live.overflow}px`);
  await axeScan(p, label);
}

(async () => {
  const model = await import(pathToFileURL(path.join(root, 'assets/acid-base-guided/model.js')).href);
  const server = createServer(); await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch(launchOptions());
  const external = [], errors = [];
  let checks = 0; const ok = (m) => { checks++; console.log('PASS', m); };
  try {
    // ---- desktop 1280 -------------------------------------------------------------------------------------------------
    {
      const { ctx, page: p } = await openPage(browser, base, { viewport: { width: 1280, height: 900 }, external, errors });
      assert.equal(await p.title(), '未知液體辨識（導引版原型）｜百宏文教');
      assert.equal(await txt(p, '#abg-welcome-title'), '三杯看起來一樣的透明液體，你能只靠實驗把它們分成不同類型嗎？');
      assert.deepEqual(await cta(p), { label: '開始', enabled: true });
      assert.equal(await p.locator('#abg-coach').isHidden(), true, 'no coach on the welcome screen');
      await preConcept(p, 'welcome'); await common(p, 'welcome'); await shot(p, '1280-welcome');
      ok('welcome: the core question, one button, no coach; nothing named, the concept body empty, axe clean');

      await p.click('#abg-cta'); await settle(p);
      assert.equal(await phase(p), 'mission');
      assert.equal(await txt(p, '#abg-welcome-title'), '先不要猜它們是什麼。');
      assert.match(await txt(p, '#abg-welcome-sub'), /用同一種試紙測三杯，留下每一次看到的結果，再判斷目前的證據夠不夠。/);
      assert.deepEqual(await cta(p), { label: '開始第一輪', enabled: true });
      assert.equal(await focused(p), '#abg-welcome-title');
      await preConcept(p, 'mission');
      ok('mission: strategy only, "開始第一輪", focus on the mission heading');

      await p.click('#abg-cta'); await settle(p);
      assert.equal(await phase(p), 'trial1');
      assert.equal(await focused(p), 'dip:A', 'arrival: the first sample button');
      assert.match(await txt(p, '#abg-coach-main'), /先用藍色石蕊測 A、B、C/);
      assert.deepEqual(await cta(p), { label: '比較這一輪', enabled: false });
      await preConcept(p, 'trial1 start'); await common(p, 'trial1 start');
      ok('trial 1: blue litmus, coach names the strip only, CTA locked, focus on sample A');

      // A by mouse drag (focus is not pulled anywhere by a drag)
      { const [from, to] = await dragPoints(p, 'A');
        await p.mouse.move(from.x, from.y); await p.mouse.down(); await p.mouse.move(to.x, to.y, { steps: 8 }); await p.mouse.up(); await settle(p); }
      assert.deepEqual((await p.evaluate(() => window.__abgTest.getState().records)), [{ sampleId: 'A', indicatorId: 'blue-litmus' }]);
      await preConcept(p, 'trial1 A');
      // B by button: B becomes disabled, focus moves on to the next usable sample
      await p.click('[data-dip-sample="B"]'); await settle(p);
      assert.equal(await focused(p), 'dip:C', 'focus left the disabled B for the next sample');
      const data = await txt(p, '#abg-data');
      assert.match(data, /藍色石蕊（原本藍色）/); assert.match(data, /2／3/); assert.match(data, /液體 B → /);
      await preConcept(p, 'trial1 B'); await shot(p, '1280-trial1-partial');
      // C by keyboard
      await p.keyboard.press('Enter'); await settle(p);
      assert.equal(await p.evaluate(() => window.__abgTest.getState().records.length), 3);
      assert.equal(await focused(p), '#abg-cta', 'with every sample tested, focus goes to the main button');
      assert.deepEqual(await cta(p), { label: '比較這一輪', enabled: true });
      assert.match(await txt(p, '#abg-status'), /三杯都測完了/);
      const ev = await p.evaluate(() => [...document.querySelectorAll('#abg-evidence [data-evidence-item]')].map((e) => e.getAttribute('data-evidence-item')));
      assert.deepEqual(ev, ['A', 'B', 'C']);
      await preConcept(p, 'trial1 done'); await common(p, 'trial1 done');
      ok('trial 1: drag (A), button (B, focus moves on), keyboard (C, focus to CTA); data and evidence are observations only');

      await p.keyboard.press('Enter'); await settle(p);
      assert.equal(await phase(p), 'compare1');
      assert.equal(await focused(p), '#abg-compare-title');
      const rows1 = await p.evaluate(() => [...document.querySelectorAll('.sg-compare-table tbody tr')].map((r) => r.innerText.replace(/\s+/g, ' ').trim()));
      assert.ok(rows1.some((r) => /試紙/.test(r) && /都用藍色石蕊/.test(r)), 'the strip is held the same');
      for (const id of ['A', 'B', 'C']) assert.ok(rows1.some((r) => r.startsWith(`液體 ${id}`)), `row for ${id}`);
      assert.match(await txt(p, '#abg-compare'), /只看這一次試紙結果，能確定結果相同的兩杯屬於同一類嗎？/);
      assert.doesNotMatch(await txt(p, '#abg-compare'), /同一種液體/);
      await preConcept(p, 'compare1'); await common(p, 'compare1'); await shot(p, '1280-compare1');
      await answer(p, 'patternCount', 'three');
      assert.match(await txt(p, '[data-feedback="patternCount"]'), /數一數出現了幾種不同結果/);
      assert.deepEqual(await cta(p), { label: '換另一種試紙', enabled: false });
      await answer(p, 'patternCount', 'two');
      await answer(p, 'evidenceSufficiency', 'same-class');
      assert.match(await txt(p, '[data-feedback="evidenceSufficiency"]'), /只代表這張試紙目前沒有把它們分開/);
      assert.equal((await cta(p)).enabled, false);
      await answer(p, 'evidenceSufficiency', 'need-more-evidence');
      assert.deepEqual(await cta(p), { label: '換另一種試紙', enabled: true });
      await preConcept(p, 'compare1 answered');
      ok('compare 1: per-cup table, wrong answers get a nudge and keep the button locked, two right answers unlock it');

      await p.click('#abg-cta'); await settle(p);
      assert.equal(await phase(p), 'trial2');
      assert.equal(await focused(p), 'dip:A');
      assert.equal(await p.locator('[data-slot="blue-litmus"]:not([hidden])').count(), 3, 'Trial 1 strips stay on the bench');
      assert.match(await txt(p, '#abg-coach-main'), /第一輪的結果會保留/);
      await preConcept(p, 'trial2'); await shot(p, '1280-trial2');
      for (const id of ['A', 'B', 'C']) { await p.click(`[data-dip-sample="${id}"]`); await settle(p); }
      assert.match(await txt(p, '#abg-evidence'), /紅色石蕊/);
      await preConcept(p, 'trial2 done'); await common(p, 'trial2 done');
      await p.click('#abg-cta'); await settle(p);
      assert.equal(await phase(p), 'compare2');
      ok('trial 2: red litmus, Trial 1 evidence kept, three buttons, evidence shows both strips');

      const matrix = await p.evaluate(() => [...document.querySelectorAll('.sg-compare-table tbody tr[data-kind="observed"]')].map((r) => [...r.children].map((c) => c.innerText.trim())));
      assert.equal(matrix.length, 3, '3 cups × 2 strips');
      const unchanged = matrix.filter(([, b, r]) => b === '維持藍色' && r === '維持紅色').map(([label]) => label.slice(-1));
      assert.equal(unchanged.length, 1);
      await preConcept(p, 'compare2'); await common(p, 'compare2'); await shot(p, '1280-compare2');
      await answer(p, 'distinguishability', 'two-still-same');
      assert.match(await txt(p, '[data-feedback="distinguishability"]'), /把每杯的兩個結果當成一組/);
      await answer(p, 'distinguishability', 'all-distinct');
      const wrongCup = ['A', 'B', 'C'].find((id) => id !== unchanged[0]);
      await answer(p, 'unchangedSample', wrongCup);
      assert.match(await txt(p, '[data-feedback="unchangedSample"]'), /找一杯在兩輪中都沒有讓試紙換成另一種顏色/);
      assert.equal((await cta(p)).enabled, false);
      await answer(p, 'unchangedSample', unchanged[0]);
      assert.deepEqual(await cta(p), { label: '看看這代表什麼', enabled: true });
      await preConcept(p, 'compare2 answered');
      ok(`compare 2: 3×2 table from the records; the cup with both strips unchanged (${unchanged[0]}) is read from the table, not assumed`);

      const saidBefore = (await p.evaluate(() => window.__abgSaid.slice())).join(' | ');
      assert.ok(!FORBIDDEN.test(saidBefore), 'nothing named in any announcement before the concept');
      await p.click('#abg-cta'); await settle(p);
      assert.equal(await phase(p), 'concept');
      assert.equal(await focused(p), '#abg-concept-title');
      const naming = await txt(p, '#abg-concept');
      for (const w of ['酸性', '中性', '鹼性']) assert.ok(naming.includes(w), `concept names ${w}`);
      assert.ok(!naming.includes('pH'), 'no pH before the learner asks for it');
      assert.match(naming, /真實石蕊有一段逐漸變色的範圍/);
      const kinds = await p.evaluate(() => Object.fromEntries(['acidic', 'neutral', 'basic'].map((k) => [k, document.querySelector(`[data-concept-card="${k}"] .sg-concept-evidence`).innerText])));
      for (const [k, t] of Object.entries(kinds)) {
        const cup = ['A', 'B', 'C'].find((id) => model.sampleKind(0, id) === k);
        assert.match(t, new RegExp(`你的液體 ${cup}`), `${k} card carries the learner's own cup ${cup}`);
      }
      assert.deepEqual(await cta(p), { label: '看看 pH', enabled: true });
      await common(p, 'concept naming'); await shot(p, '1280-concept-naming');
      ok('concept naming: the formal names appear for the first time, each with the learner\'s own cup; no pH yet; the litmus caveat is there');

      await p.click('#abg-cta'); await settle(p);
      assert.equal(await p.evaluate(() => window.__abgTest.getState().conceptPart), 'ph');
      assert.equal(await focused(p), '#abg-concept-title');
      const ph = await txt(p, '[data-concept-card="ph"]');
      assert.match(ph, /pH 小於 7 為酸性，pH 等於 7 為中性，pH 大於 7 為鹼性/);
      assert.match(ph, /這不代表真實石蕊只在 pH 7 才變色/);
      for (const id of ['A', 'B', 'C']) assert.match(ph, new RegExp(`液體 ${id}[：:]\\s*pH ${model.samplePh10(0, id) / 10}（`), `pH of ${id} from the model`);
      const ind = await txt(p, '[data-concept-card="indicator"]');
      assert.match(ind, /不能直接當成精密 pH 讀值/);
      assert.match(ind, /酚酞在部分弱鹼性的範圍仍可能保持無色/);
      assert.ok(!/紫甘藍/.test(await txt(p, 'body')));
      assert.equal(await cta(p), null, 'nothing after the pH part in this stage');
      assert.match(await txt(p, '#abg-status'), /這一階段的觀察與整理已完成/);
      assert.ok((await p.evaluate(() => window.__abgSaid.at(-1))).includes('已顯示 pH'));
      await common(p, 'concept ph'); await shot(p, '1280-concept-ph');
      ok('concept pH: 25 °C classification, the classification line kept apart from litmus, A/B/C pH from the model, indicators are not pH meters, no next step');
      await ctx.close();
    }

    // ---- phone 390, touch ----------------------------------------------------------------------------------------------
    {
      const { ctx, page: p } = await openPage(browser, base, { viewport: { width: 390, height: 844 }, touch: true, external, errors });
      const tapCta = async () => {
        assert.equal((await cta(p))?.enabled, true, `the main button should be ready in ${JSON.stringify(await p.evaluate(() => window.__abgTest.getState()))}`);
        await p.locator('#abg-cta').scrollIntoViewIfNeeded(); await p.locator('#abg-cta').tap(); await settle(p);
      };
      await tapCta(); await tapCta();
      assert.equal(await phase(p), 'trial1');
      const order = await p.evaluate(() => ['abg-coach', 'abg-bench-card', 'abg-status', 'abg-cta', 'abg-data', 'abg-evidence'].map((id) => document.getElementById(id)).filter((e) => e.offsetParent).map((e) => [e.id, Math.round(e.getBoundingClientRect().top)]));
      for (let i = 1; i < order.length; i++) assert.ok(order[i][1] >= order[i - 1][1], `phone order: ${order.map((o) => o[0]).join(' > ')}`);
      await touchDrag(p, ...(await dragPoints(p, 'A')));
      // A synthetic touch drag ends with a fling; a tap within ~300 ms is spent stopping it and fires no click (as on a phone).
      await p.waitForTimeout(400);
      for (const id of ['B']) { await p.locator(`[data-dip-sample="${id}"]`).tap(); await settle(p); }
      await preConcept(p, '390 trial1'); await common(p, '390 trial1'); await shot(p, '390-trial1');
      await p.locator('[data-dip-sample="C"]').tap(); await settle(p);
      const sizes = await p.evaluate(() => [...document.querySelectorAll('#abg-cta, [data-dip-sample], [data-role="strip"]')].map((e) => { const r = e.getBoundingClientRect(); return [e.id || e.dataset.dipSample || 'strip', Math.round(r.width), Math.round(r.height)]; }));
      for (const [id, w, h] of sizes) assert.ok(w >= 44 && h >= 44, `${id} is ${w}×${h}`);
      await tapCta();
      for (const [q, v] of [['patternCount', 'two'], ['evidenceSufficiency', 'need-more-evidence']]) await answer(p, q, v, { tap: true });
      const pills = await p.evaluate(() => [...document.querySelectorAll('.sg-pill')].map((e) => Math.round(e.getBoundingClientRect().height)));
      assert.ok(pills.every((h) => h >= 44), `answer options ${pills.join(',')}`);
      await tapCta();
      await touchDrag(p, ...(await dragPoints(p, 'B')));
      await p.waitForTimeout(400);
      for (const id of ['A', 'C']) { await p.locator(`[data-dip-sample="${id}"]`).tap(); await settle(p); }
      assert.equal(await p.evaluate(() => window.__abgTest.getState().records.length), 6);
      const ev = await p.evaluate(() => [...document.querySelectorAll('#abg-evidence dd, #abg-evidence dt')].every((e) => e.scrollWidth <= e.clientWidth + 1));
      assert.ok(ev, 'evidence text fits on a phone');
      await tapCta();
      const matrix = await p.evaluate(() => [...document.querySelectorAll('.sg-compare-table tbody tr[data-kind="observed"]')].map((r) => [...r.children].map((c) => c.innerText.replace(/^.*\n/, '').trim())));
      const cup = matrix.find(([, b, r]) => b.endsWith('維持藍色') && r.endsWith('維持紅色'))[0].slice(-1);
      await preConcept(p, '390 compare2'); await common(p, '390 compare2'); await shot(p, '390-compare2');
      await answer(p, 'distinguishability', 'all-distinct', { tap: true });
      await answer(p, 'unchangedSample', cup, { tap: true });
      await tapCta();
      assert.equal(await phase(p), 'concept');
      await common(p, '390 concept naming'); await shot(p, '390-concept-naming');
      await tapCta();
      assert.equal(await p.evaluate(() => window.__abgTest.getState().conceptPart), 'ph');
      await common(p, '390 concept ph'); await shot(p, '390-concept-ph');
      ok('phone: touch drag and taps through both trials and compares to the pH part; layout order, sizes ≥ 44 px, no sideways scroll, axe clean');
      await ctx.close();
    }

    // ---- the page as shipped: no hook, nothing stored, nothing sent ------------------------------------------------------
    {
      const { ctx, page: p } = await openPage(browser, base, { viewport: { width: 1280, height: 900 }, hook: false, external, errors });
      const shipped = await p.evaluate(() => ({ hook: typeof window.__abgTest, local: localStorage.length, session: sessionStorage.length, track: typeof window.bhcsScienceTrack }));
      assert.deepEqual(shipped, { hook: 'undefined', local: 0, session: 0, track: 'undefined' });
      await p.click('#abg-cta'); await p.click('#abg-cta'); await p.click('[data-dip-sample="A"]'); await settle(p);
      await p.reload(); await p.waitForFunction(() => !document.getElementById('abg-cta').hidden);
      assert.equal(await p.evaluate(() => document.getElementById('main').dataset.phase), 'welcome', 'a reload starts again');
      assert.equal(await p.evaluate(() => localStorage.length + sessionStorage.length), 0);
      ok('as shipped: no test hook, no storage, no analytics adapter; a reload goes back to the welcome screen');
      await ctx.close();
    }

    assert.deepEqual(errors, [], 'console or page errors');
    assert.deepEqual(external, [], 'external requests');
    ok('no external requests, no console errors');
    console.log(`acid-base-guided flow browser: ${checks} checks passed; screenshots in ${path.relative(root, OUT)}/`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
