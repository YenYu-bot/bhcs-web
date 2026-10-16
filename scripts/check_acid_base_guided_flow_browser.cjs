// B3–B4 browser gate: the guided acid–base page (Pilot #4) from the welcome screen to the finish, in a real browser.
// Needs Playwright (NODE_PATH pointing at a playwright install). Writes review screenshots to acid-base-flow-artifacts/.
//
// Desktop 1280: mouse drag, a button and the keyboard in Trial 1; wrong answers that keep each compare locked; Trial 2;
// the concept naming, then the pH part; the notebook (a wrong Level A mapping, then the right one); three challenges with
// wrong tries, nudges and hints; the optional note; the finish. Reloads at Challenge 2 and on the finish, and (in a fresh
// context) after one cup of Trial 1, restore the learner's place and send no milestone again. The saved progress holds no
// derived field, and every analytics call is a fixed milestone name plus the lab id: 14 of them for the whole lab.
// Phone 390: touch drag and taps through the same path to the finish.
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
// The shared announcer clears the live region and writes the text 40 ms later (so a screen reader hears a repeat). A check
// that expects an announcement waits for it; a check that expects silence first lets that window pass.
const heard = (p, text) => p.waitForFunction((t) => (window.__abgSaid ?? []).some((x) => x.includes(t)), text, { timeout: 3000 });
const lastHeard = async (p, text) => { await p.waitForFunction((t) => (window.__abgSaid ?? []).at(-1)?.includes(t), text, { timeout: 3000 }); return p.evaluate(() => window.__abgSaid.at(-1)); };
const quiet = (p) => p.waitForTimeout(200);
const events = (p) => p.evaluate(() => window.__testScienceEvents.map((e) => [...e]));
const reload = async (p) => { await p.reload(); await p.waitForFunction(() => document.getElementById('main').dataset.phase); await settle(p); };
const option = async (p, value, { tap = false } = {}) => { const l = p.locator(`button[data-option="${value}"]:not([disabled])`); await l.scrollIntoViewIfNeeded(); if (tap) await l.tap(); else await l.click(); await settle(p); };
const relation = async (p, q, value, { tap = false } = {}) => { const l = p.locator(`input[data-relation][data-q="${q}"][value="${value}"]`); await l.scrollIntoViewIfNeeded(); if (tap) await l.tap(); else await l.check(); await settle(p); };
const stepFeedback = (p, step) => p.evaluate((s) => { const f = document.querySelector(`[data-step-feedback="${s}"]`); return f && !f.hidden ? { kind: f.dataset.kind, text: f.textContent } : null; }, step);
const saved = (p) => p.evaluate(() => localStorage.getItem('bhcs-acid-base-guided:v1'));
const FULL_EVENTS = ['lab_start', 'trial_recorded', 'trial_recorded', 'trial_recorded', 'compare_complete', 'trial_recorded', 'trial_recorded', 'trial_recorded',
  'compare_complete', 'notebook_complete', 'challenge_complete', 'challenge_complete', 'challenge_complete', 'lab_complete'];
const FORBIDDEN_SAVE_KEYS = ['result', 'resultColor', 'startColor', 'kind', 'ph10', 'correct', 'allCorrect', 'ready', 'expected', 'changed', 'observations'];
/** Every key anywhere in a parsed save. */
const keysOf = (v) => (v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => [Array.isArray(v) ? null : k, ...keysOf(x)]).filter(Boolean) : []);
/** A milestone payload is exactly [name, lab id]; nothing a learner chose or wrote can appear in it. */
function checkPayload(list, label) {
  for (const args of list) {
    assert.equal(args.length, 2, `${label}: ${JSON.stringify(args)}`);
    assert.match(args[0], /^(lab_start|trial_recorded|compare_complete|notebook_complete|challenge_complete|lab_complete)$/);
    assert.equal(args[1], 'acid-base-guided');
  }
  const text = JSON.stringify(list).replace(/"acid-base-guided"/g, '');
  for (const bad of ['"A"', '"B"', '"C"', 'blue-litmus', 'red-litmus', 'acidic', 'basic', 'neutral', 'freeText', 'not-enough', 'litmus-pair', 'cannot-rule-out', '因為', '酚酞']) {
    assert.ok(!text.includes(bad), `${label}: the payload carries ${bad}`);
  }
}
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

      await quiet(p);
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
      assert.deepEqual(await cta(p), { label: '寫研究手冊', enabled: true });
      assert.match(await txt(p, '#abg-status'), /這一階段的觀察與整理已完成/);
      assert.ok((await lastHeard(p, '已顯示 pH')).includes('已顯示 pH'));
      await common(p, 'concept ph'); await shot(p, '1280-concept-ph');
      ok('concept pH: 25 °C classification, the classification line kept apart from litmus, A/B/C pH from the model, indicators are not pH meters, "寫研究手冊" next');
      assert.deepEqual((await events(p)).map(([n]) => n), FULL_EVENTS.slice(0, 9), 'the pH reveal sends nothing');

      // ---- notebook ----
      await p.click('#abg-cta'); await settle(p);
      assert.equal(await phase(p), 'notebook');
      assert.equal(await focused(p), '#abg-notebook-title');
      assert.equal(await txt(p, '#abg-notebook-title'), '我的研究手冊');
      assert.equal(await p.evaluate(() => document.querySelector('input[data-level][value="A"]').checked), true, 'Level A is open on arrival');
      assert.equal(await p.evaluate(() => window.__abgTest.getState().conclusion.level), 'A');
      const nbTable = await p.evaluate(() => ({ heads: [...document.querySelectorAll('#abg-notebook thead th')].map((t) => t.innerText.trim()),
        rows: [...document.querySelectorAll('#abg-notebook tbody tr')].map((r) => [...r.children].map((c) => c.innerText.trim())) }));
      assert.deepEqual(nbTable.heads.slice(1), ['藍色石蕊', '紅色石蕊']);
      assert.deepEqual(nbTable.rows.map((r) => r[0]), ['液體 A', '液體 B', '液體 C']);
      assert.ok(!/酸|鹼|中性/.test(JSON.stringify(nbTable)), 'the evidence table names no class');
      const truth = Object.fromEntries(['acidic', 'neutral', 'basic'].map((k) => [k, ['A', 'B', 'C'].find((id) => model.sampleKind(0, id) === k)]));
      const wrongAcid = ['A', 'B', 'C'].find((id) => id !== truth.acidic);
      assert.deepEqual(await cta(p), { label: '進入挑戰', enabled: false });
      await relation(p, 'acidicSample', wrongAcid);
      await relation(p, 'neutralSample', truth.neutral);
      assert.equal(await p.locator('[data-nudge]').isHidden(), true, 'no nudge while a choice is missing');
      await relation(p, 'basicSample', truth.basic);
      assert.equal(await txt(p, '[data-nudge]'), '再對照兩張試紙的結果組合，不要只看其中一張。');
      assert.deepEqual(await cta(p), { label: '進入挑戰', enabled: false });
      await relation(p, 'acidicSample', truth.acidic);
      assert.equal(await p.locator('[data-nudge]').isHidden(), true);
      assert.equal(await txt(p, '[data-ready]'), '這份整理和你的六次測試紀錄一致。');
      assert.deepEqual(await cta(p), { label: '進入挑戰', enabled: true });
      await common(p, 'notebook A'); await shot(p, '1280-notebook-A');
      assert.equal((await events(p)).length, 9, 'notebook choices send nothing');
      ok(`notebook: Level A by default; the evidence table names no class; a wrong mapping is nudged and locked; the records' mapping (${truth.acidic}/${truth.neutral}/${truth.basic}) unlocks it`);

      // ---- challenge 1 ----
      await p.click('#abg-cta'); await settle(p);
      assert.equal(await phase(p), 'challenge-1');
      assert.equal(await focused(p), '#abg-challenge-title');
      assert.equal(await txt(p, '#abg-challenge-title'), '挑戰 1／3：一杯新的液體');
      assert.match(await txt(p, '#abg-challenge .sg-scenario'), /未知液體 X：藍色石蕊變紅色，紅色石蕊維持紅色。/);
      assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('[data-challenge-step="c1-class"] button')].map((b) => b.textContent)), ['中性', '酸性', '目前證據仍不足', '鹼性']);
      assert.deepEqual(await cta(p), { label: '下一題挑戰', enabled: false });
      await option(p, 'neutral');
      assert.deepEqual(await stepFeedback(p, 'c1-class'), { kind: 'nudge', text: '把兩張試紙的結果當成一組，對照你剛才整理的三種模式。' });
      await option(p, 'basic');
      assert.deepEqual(await stepFeedback(p, 'c1-class'), { kind: 'hint', text: '哪一類會讓藍色石蕊變紅，而紅色石蕊仍維持紅色？' });
      assert.equal((await cta(p)).enabled, false);
      await option(p, 'acidic');
      assert.equal((await stepFeedback(p, 'c1-class')).kind, 'success');
      assert.equal(await p.evaluate(() => [...document.querySelectorAll('[data-challenge-step="c1-class"] button')].every((b) => b.disabled)), true, 'a solved step is locked');
      assert.deepEqual(await cta(p), { label: '下一題挑戰', enabled: true });
      await heard(p, '對。藍色石蕊變紅');
      const said1 = await p.evaluate(() => window.__abgSaid.slice(-4));
      assert.ok(said1.includes('挑戰 1。') && said1.some((t) => t.includes('把兩張試紙的結果當成一組')), `announced: ${said1.join(' | ')}`);
      await common(p, 'challenge 1'); await shot(p, '1280-challenge-1');
      assert.equal((await events(p)).length, 10, 'challenge answers send nothing');
      ok('challenge 1: first wrong try → the generic nudge, second → the hint, right → success and the step locks; announced');

      // ---- challenge 2, then reload (case B) ----
      await p.click('#abg-cta'); await settle(p);
      assert.equal(await phase(p), 'challenge-2');
      assert.equal(await p.locator('[data-challenge-step]').count(), 1, 'step 2 is not shown before step 1 is solved');
      const before = await events(p);
      assert.deepEqual(before.map(([n]) => n), FULL_EVENTS.slice(0, 11));
      checkPayload(before, 'before reload B');
      const stateB = await p.evaluate(() => JSON.stringify(window.__abgTest.getState()));
      await reload(p);
      assert.equal(await phase(p), 'challenge-2');
      assert.deepEqual(await events(p), [], 'a reload sends no milestone again');
      await quiet(p);
      assert.deepEqual(await p.evaluate(() => window.__abgSaid), [], 'a restore announces nothing');
      const restoredB = await p.evaluate(() => window.__abgTest.getState());
      assert.deepEqual(restoredB, JSON.parse(stateB), 'the restored state is the one left');
      assert.equal(await txt(p, '#abg-storage-note'), '已接續這台瀏覽器先前的進度。');
      assert.equal(await txt(p, '#abg-challenge-title'), '挑戰 2／3：只測一次夠不夠？');
      assert.equal(await p.locator('#abg-restart').isVisible(), true);
      ok('reload at Challenge 2 (case B): back on Challenge 2 with the notebook and Challenge 1 kept; no milestone and no announcement on restore');

      await option(p, 'acidic');
      assert.deepEqual(await stepFeedback(p, 'c2-enough'), { kind: 'nudge', text: '回想你的第一輪：只用藍色石蕊時，三杯能全部分開嗎？' });
      assert.equal(await txt(p, '#abg-storage-note'), '進度已儲存在這台瀏覽器。', 'after the first new action the note says saved');
      await option(p, 'not-enough');
      assert.equal(await p.locator('[data-challenge-step]').count(), 2, 'step 2 unlocks once step 1 is solved');
      assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('[data-challenge-step="c2-next"] button')].map((b) => b.textContent)), ['再重複一次藍色石蕊', '再用紅色石蕊測試', '看它是不是透明', '直接猜一類']);
      assert.equal((await cta(p)).enabled, false);
      await option(p, 'red-litmus');
      assert.deepEqual(await cta(p), { label: '下一題挑戰', enabled: true });
      await common(p, 'challenge 2'); await shot(p, '1280-challenge-2');
      ok('challenge 2: one strip is not enough; the next step unlocks only after step 1; red litmus solves it');

      // ---- challenge 3 ----
      await p.click('#abg-cta'); await settle(p);
      assert.equal(await phase(p), 'challenge-3');
      assert.match(await txt(p, '#abg-challenge .sg-scenario'), /未知液體 Z 加入酚酞後仍然無色。有人說：「所以它一定不是鹼性。」/);
      await option(p, 'never-basic');
      assert.equal((await stepFeedback(p, 'c3-claim')).kind, 'nudge');
      await option(p, 'cannot-rule-out-basic');
      assert.deepEqual(await stepFeedback(p, 'c3-claim'), { kind: 'success', text: '對。不同指示劑有自己的變色範圍，酚酞無色不能排除所有鹼性液體。' });
      assert.match(await txt(p, '[data-challenge-step="c3-next"]'), /品嚐看看/);
      assert.equal(await p.locator('[data-note]').isHidden(), true, 'no note before the challenge is solved');
      await option(p, 'litmus-pair');
      assert.equal(await p.locator('[data-note]').isVisible(), true);
      assert.match(await txt(p, '[data-note] label'), /為什麼酚酞無色還不能排除鹼性？（可以不寫）/);
      assert.equal(await p.locator('[data-note] textarea').getAttribute('placeholder'), '因為酚酞……');
      await p.locator('[data-note] textarea').fill('因為酚酞有自己的變色範圍');
      assert.deepEqual(await cta(p), { label: '完成這一站', enabled: true });
      await common(p, 'challenge 3'); await shot(p, '1280-challenge-3');
      await quiet(p);
      const saidNote = (await p.evaluate(() => window.__abgSaid.join(' | ')));
      assert.ok(!saidNote.includes('因為酚酞有自己的變色範圍'), 'the note is never announced');
      ok('challenge 3: phenolphthalein colourless does not rule out basic; the next test is the litmus pair; the optional note appears after solving');

      // ---- complete ----
      await p.click('#abg-cta'); await settle(p);
      assert.equal(await phase(p), 'complete');
      assert.equal(await p.evaluate(() => window.__abgTest.getState().challenges[3].note), '因為酚酞有自己的變色範圍', 'the note was flushed before moving on');
      assert.equal(await focused(p), '#abg-complete-title');
      assert.equal(await txt(p, '#abg-complete-title'), '這一站完成了');
      assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#abg-complete .sg-claim')].map((c) => c.textContent.replace(/^✓\s*/, ''))), [
        '我用兩種石蕊比較了三杯未知液體的反應模式。', '我能根據兩次觀察，把代表樣品整理成酸性、中性、鹼性。', '我知道指示劑顏色提供的是範圍線索，不等於精密的 pH 讀值。']);
      assert.equal(await txt(p, '#abg-complete .sg-complete-conclusion'), `我的紀錄中：液體 ${truth.acidic} 對應酸性，液體 ${truth.neutral} 對應中性，液體 ${truth.basic} 對應鹼性。`);
      assert.equal(await cta(p), null, 'no next button on the finish');
      assert.equal(await p.locator('#abg-complete a').count(), 0, 'no link from the finish (no legacy link)');
      assert.equal(await p.locator('#abg-restart').isVisible(), true, 'restart stays available on the finish');
      assert.equal(await lastHeard(p, '這一站完成了。'), '這一站完成了。');
      await common(p, 'complete'); await shot(p, '1280-complete');
      const afterB = await events(p);
      checkPayload(afterB, 'after reload B');
      assert.deepEqual([...before, ...afterB].map(([n]) => n), FULL_EVENTS, 'exactly 14 milestones, in order, across the reload');
      ok('complete: heading, three claims, the Level A sentence from the records, no button, no link; 14 milestones in order, each [name, lab id] only');

      // ---- what is saved ----
      const raw = await saved(p);
      const save = JSON.parse(raw);
      const keys = keysOf(save);
      for (const k of FORBIDDEN_SAVE_KEYS) assert.ok(!keys.includes(k), `the save holds a ${k} field`);
      assert.ok(save.records.every((r) => Object.keys(r).sort().join() === 'indicatorId,sampleId'));
      assert.deepEqual(Object.keys(save.conclusion).sort(), ['acidicSample', 'basicSample', 'evidenceText', 'freeText', 'level', 'limitationText', 'neutralSample']);
      assert.ok(!/turns-|stays-|"ph"|pH/.test(raw.replace(/"conceptPart":"ph"/, '')), 'no observation, colour or pH value in the save');
      assert.equal(await p.evaluate(() => Object.keys(localStorage).join()), 'bhcs-acid-base-guided:v1');
      assert.equal(await p.evaluate(() => sessionStorage.length), 0);
      ok('the save: records as { sampleId, indicatorId }, answers and the learner\'s words only; no result, colour, kind, pH, correct, ready or mapping');

      // ---- reload on the finish (case C) ----
      await reload(p);
      assert.equal(await phase(p), 'complete');
      assert.deepEqual(await events(p), [], 'no new lab_complete');
      assert.equal(await txt(p, '#abg-complete-title'), '這一站完成了');
      assert.equal(await txt(p, '#abg-storage-note'), '已接續這台瀏覽器先前的進度。');
      await common(p, 'restored complete'); await shot(p, '1280-restored-complete');
      ok('reload on the finish (case C): the finish again, with no milestone re-sent');

      // ---- restart ----
      p.once('dialog', (d) => d.dismiss());
      await p.click('#abg-restart'); await settle(p);
      assert.equal(await phase(p), 'complete', 'cancelling the confirm changes nothing');
      assert.ok(await saved(p));
      let message = null;
      p.once('dialog', (d) => { message = d.message(); d.accept(); });
      await Promise.all([p.waitForEvent('load'), p.click('#abg-restart')]);
      await p.waitForFunction(() => document.getElementById('main').dataset.phase);
      assert.equal(message, '要清除這一站儲存在本機的進度，從頭開始嗎？');
      assert.equal(await phase(p), 'welcome');
      assert.equal(await saved(p), null);
      assert.equal(await p.locator('#abg-restart').isHidden(), true, 'no restart before the first record');
      assert.deepEqual(await events(p), []);
      ok('restart: confirm text; cancel keeps everything; accept clears the save and starts again at the welcome screen');
      await ctx.close();
    }

    // ---- reload after one cup (case A), and the adapter failing or missing --------------------------------------------
    {
      const { ctx, page: p } = await openPage(browser, base, { viewport: { width: 1280, height: 900 }, external, errors });
      assert.equal(await p.locator('#abg-restart').isHidden(), true);
      assert.equal(await p.locator('#abg-storage-note').isHidden(), true);
      assert.equal(await txt(p, '#abg-privacy-note'), '研究手冊與作答只儲存在這台瀏覽器。匿名使用事件不包含研究手冊文字、作答內容或學生姓名。');
      await p.click('#abg-cta'); await p.click('#abg-cta'); await settle(p);
      assert.equal(await saved(p), null, 'nothing is saved before the first record');
      await p.click('[data-dip-sample="B"]'); await settle(p);
      assert.deepEqual((await events(p)).map(([n]) => n), ['lab_start', 'trial_recorded']);
      assert.equal(await txt(p, '#abg-storage-note'), '進度已儲存在這台瀏覽器。');
      assert.equal(await p.locator('#abg-restart').isVisible(), true);
      await reload(p);
      assert.equal(await phase(p), 'trial1');
      assert.deepEqual(await p.evaluate(() => window.__abgTest.getState().records), [{ sampleId: 'B', indicatorId: 'blue-litmus' }]);
      assert.equal(await p.locator('[data-dip-sample="B"]').isDisabled(), true, 'the tested cup stays tested');
      assert.deepEqual(await events(p), [], 'no lab_start or trial_recorded again');
      await quiet(p);
      assert.deepEqual(await p.evaluate(() => window.__abgSaid), [], 'a restore announces nothing');
      assert.equal(await txt(p, '#abg-storage-note'), '已接續這台瀏覽器先前的進度。');
      await preConcept(p, 'restored trial1'); await common(p, 'restored trial1');
      ok('reload after one cup (case A): back in Trial 1 with that cup recorded; nothing re-sent, nothing announced');
      await ctx.close();
      for (const adapter of ['throw', 'absent']) {
        const { ctx: c2, page: q } = await openPage(browser, base, { viewport: { width: 1280, height: 900 }, adapter, external, errors });
        await q.click('#abg-cta'); await q.click('#abg-cta');
        for (const id of ['A', 'B', 'C']) { await q.click(`[data-dip-sample="${id}"]`); await settle(q); }
        await q.click('#abg-cta'); await settle(q);
        assert.equal(await q.evaluate(() => window.__abgTest.getState().phase), 'compare1', adapter);
        assert.equal((await q.evaluate(() => window.__testScienceEvents.length)), adapter === 'throw' ? 4 : 0);
        await c2.close();
      }
      ok('a throwing or missing analytics adapter never stops the lab');
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

      const fits = () => p.evaluate(() => [...document.querySelectorAll('#abg-column *')].filter((e) => e.offsetParent && e.getBoundingClientRect().right > document.documentElement.clientWidth + 1).map((e) => e.tagName + '.' + e.className));
      await tapCta();
      assert.equal(await phase(p), 'notebook');
      const truth = Object.fromEntries(['acidic', 'neutral', 'basic'].map((k) => [k, ['A', 'B', 'C'].find((id) => model.sampleKind(0, id) === k)]));
      for (const [q, k] of [['acidicSample', 'acidic'], ['neutralSample', 'neutral'], ['basicSample', 'basic']]) await relation(p, q, truth[k], { tap: true });
      const nbPills = await p.evaluate(() => [...document.querySelectorAll('#abg-notebook .sg-pill')].filter((e) => e.offsetParent).map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
      assert.ok(nbPills.every(([w, h]) => w >= 44 && h >= 44), `notebook options ${JSON.stringify(nbPills)}`);
      assert.deepEqual(await fits(), [], 'nothing in the notebook runs past the screen edge');
      await common(p, '390 notebook'); await shot(p, '390-notebook');
      // Level C: the two writing boxes are readable on a phone
      await p.locator('input[data-level][value="C"]').tap(); await settle(p);
      const boxes = await p.evaluate(() => [...document.querySelectorAll('#abg-notebook textarea')].filter((t) => t.offsetParent).map((t) => ({ w: Math.round(t.getBoundingClientRect().width), font: parseFloat(getComputedStyle(t).fontSize) })));
      assert.equal(boxes.length, 2);
      for (const b of boxes) assert.ok(b.w >= 280 && b.font >= 15, `textarea ${JSON.stringify(b)}`);
      await p.locator('#abg-nb-evidence').fill('液體 B 兩張都變紅或維持紅');
      await p.locator('#abg-nb-limit').fill('顏色不是精密的 pH 讀值');
      await p.locator('#abg-nb-limit').blur(); await settle(p);
      assert.equal(await p.locator('[data-ideas]').isVisible(), true, 'the ideas appear once a limitation is written');
      assert.deepEqual(await fits(), []);
      await tapCta();
      assert.equal(await phase(p), 'challenge-1');
      await option(p, 'acidic', { tap: true }); await tapCta();
      await option(p, 'not-enough', { tap: true }); await option(p, 'red-litmus', { tap: true }); await tapCta();
      await option(p, 'definitely-neutral', { tap: true }); await option(p, 'cannot-rule-out-basic', { tap: true }); await option(p, 'taste', { tap: true });
      assert.equal((await stepFeedback(p, 'c3-next')).kind, 'nudge');
      await option(p, 'litmus-pair', { tap: true });
      const opts = await p.evaluate(() => [...document.querySelectorAll('#abg-challenge button[data-option]')].map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), b.scrollWidth <= b.clientWidth + 1]; }));
      assert.ok(opts.every(([w, h, fit]) => w >= 280 && h >= 44 && fit), `challenge options ${JSON.stringify(opts)}`);
      assert.deepEqual(await fits(), []);
      await common(p, '390 challenge 3'); await shot(p, '390-challenge-3');
      await tapCta();
      assert.equal(await phase(p), 'complete');
      assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#abg-complete .sg-complete-conclusion')].map((e) => e.textContent)), ['我在研究手冊裡寫下：', '液體 B 兩張都變紅或維持紅', '顏色不是精密的 pH 讀值']);
      const claims = await p.evaluate(() => [...document.querySelectorAll('#abg-complete .sg-claim')].map((e) => e.scrollWidth <= e.clientWidth + 1 && e.getBoundingClientRect().right <= document.documentElement.clientWidth));
      assert.deepEqual(claims, [true, true, true], 'the claims are not cut off');
      const footer = await p.evaluate(() => ['abg-restart', 'abg-privacy-note'].map((id) => { const e = document.getElementById(id), r = e.getBoundingClientRect(); return [id, Math.round(r.height), r.right <= document.documentElement.clientWidth, parseFloat(getComputedStyle(e).fontSize)]; }));
      for (const [id, h, inside, font] of footer) assert.ok(h >= 20 && inside && font >= 13, `${id} ${h} ${inside} ${font}`);
      assert.ok(footer[0][1] >= 44, 'the restart button is a full touch target');
      await common(p, '390 complete'); await shot(p, '390-complete');
      const phoneEvents = await events(p);
      checkPayload(phoneEvents, 'phone');
      assert.deepEqual(phoneEvents.map(([n]) => n), FULL_EVENTS);
      ok('phone: notebook (Level A taps, Level C writing boxes), three challenges by tap, the finish with the learner\'s Level C words; ≥ 44 px targets, nothing past the edge, axe clean, 14 milestones');
      await ctx.close();
    }

    // ---- the page as shipped: no hook; it saves after the first record and picks up after a reload ----------------------
    {
      const { ctx, page: p } = await openPage(browser, base, { viewport: { width: 1280, height: 900 }, hook: false, external, errors });
      const shipped = await p.evaluate(() => ({ hook: typeof window.__abgTest, local: localStorage.length, session: sessionStorage.length, track: typeof window.bhcsScienceTrack }));
      assert.deepEqual(shipped, { hook: 'undefined', local: 0, session: 0, track: 'function' });
      const order = await p.evaluate(() => [...document.scripts].map((s) => s.getAttribute('src')));
      assert.deepEqual(order, ['../../assets/science-events.js', '../../assets/acid-base-guided/main.js'], 'the adapter loads before the station');
      await p.click('#abg-cta'); await p.click('#abg-cta'); await p.click('[data-dip-sample="A"]'); await settle(p);
      await reload(p);
      assert.equal(await p.evaluate(() => document.getElementById('main').dataset.phase), 'trial1', 'a reload picks up where the learner was');
      assert.equal(await p.evaluate(() => sessionStorage.length), 0);
      assert.deepEqual(await p.evaluate(() => Object.keys(localStorage)), ['bhcs-acid-base-guided:v1']);
      ok('as shipped: no test hook; the adapter loads first; progress is saved under one key and restored after a reload');
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
