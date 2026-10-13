import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createActionBar, createAnnouncer, focusHandoff, renderStepNav, renderCoachCard, renderStatusBar, renderDataCard, renderEvidenceCard } from '../assets/science-guided/components.js';

const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wait = (ms = 5) => new Promise((resolve) => setTimeout(resolve, ms));

test('ActionBar returns the exact string action and uses id only as a DOM hook', () => {
  const dom = new JSDOM('<button id="cta"></button>');
  const button = dom.window.document.getElementById('cta');
  const calls = [];
  const bar = createActionBar(button, { onAction: (action) => calls.push(action) });
  const action = 'NEXT_PHASE';
  bar.render({ label: 'continue', action, enabled: true, id: 'next' });
  assert.equal(button.hidden, false);
  assert.equal(button.disabled, false);
  assert.equal(button.dataset.action, 'next');
  button.click();
  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0], action);
});

test('ActionBar preserves object identity and never serializes the opaque action', () => {
  const dom = new JSDOM('<button id="cta"></button>');
  const button = dom.window.document.getElementById('cta');
  let received = null;
  const bar = createActionBar(button, { onAction: (action) => { received = action; } });
  const action = Object.freeze({ type: 'RECORD', payload: { trial: 2 } });
  bar.render({ label: 'record', action, enabled: true, id: 'record-2' });
  button.click();
  assert.strictEqual(received, action);
  assert.equal(button.dataset.action, 'record-2');
  assert.ok(!button.outerHTML.includes('payload'));
});

test('ActionBar null/disabled models do not activate', () => {
  const dom = new JSDOM('<button id="cta"></button>');
  const button = dom.window.document.getElementById('cta');
  let calls = 0;
  const bar = createActionBar(button, { onAction: () => { calls++; } });
  bar.render({ label: 'wait', action: { type: 'WAIT' }, enabled: false, id: 'wait' });
  button.click();
  assert.equal(calls, 0);
  assert.equal(button.disabled, true);
  bar.render(null);
  assert.equal(button.hidden, true);
  assert.equal(button.hasAttribute('data-action'), false);
  button.click();
  assert.equal(calls, 0);
});

test('announcer deduplicates by id, not by visible text', async () => {
  const dom = new JSDOM('<div id="live" aria-live="polite" aria-atomic="true"></div>');
  const el = dom.window.document.getElementById('live');
  const a = createAnnouncer(el, { delayMs: 0 });
  assert.equal(a.say({ id: 'drop-1', text: 'same words' }), true);
  await wait();
  assert.equal(el.textContent, 'same words');
  assert.equal(el.dataset.writes, '1');
  assert.equal(a.say({ id: 'drop-1', text: 'changed words' }), false);
  await wait();
  assert.equal(el.dataset.writes, '1');
  assert.equal(a.say({ id: 'drop-2', text: 'same words' }), true);
  await wait();
  assert.equal(el.textContent, 'same words');
  assert.equal(el.dataset.writes, '2');
});

test('focus handoff does not steal focus while the active control remains usable', () => {
  const dom = new JSDOM('<body><main id="root"><button id="a"></button><button class="target" id="b"></button></main></body>', { pretendToBeVisual: true });
  const doc = dom.window.document;
  const root = doc.getElementById('root');
  const a = doc.getElementById('a');
  a.focus();
  assert.equal(focusHandoff({ root, active: a, targets: ['.target'] }), null);
  assert.equal(doc.activeElement, a);
});

test('focus handoff covers disabled, locked, hidden and removed active controls', () => {
  for (const mode of ['disabled', 'locked', 'hidden', 'removed']) {
    const dom = new JSDOM('<body><main id="root"><button id="a"></button><button class="target" id="b"></button></main></body>', { pretendToBeVisual: true });
    const doc = dom.window.document;
    const root = doc.getElementById('root');
    const a = doc.getElementById('a');
    const b = doc.getElementById('b');
    a.focus();
    if (mode === 'disabled') a.disabled = true;
    if (mode === 'locked') a.dataset.locked = 'true';
    if (mode === 'hidden') a.hidden = true;
    if (mode === 'removed') a.remove();
    assert.strictEqual(focusHandoff({ root, active: a, targets: ['.target'] }), b, mode);
    assert.equal(doc.activeElement, b, mode);
  }
});

test('focus handoff reacts when the just-used CTA disappears', () => {
  const dom = new JSDOM('<body><main id="root"><button id="a"></button><h2 class="target" id="h" tabindex="-1"></h2></main></body>', { pretendToBeVisual: true });
  const doc = dom.window.document;
  const root = doc.getElementById('root');
  const a = doc.getElementById('a');
  const h = doc.getElementById('h');
  a.focus();
  assert.strictEqual(focusHandoff({ root, active: a, ctaGone: true, targets: ['.target'] }), h);
});

test('focus handoff skips CSS-hidden targets (self, ancestor, visibility)', () => {
  const cases = {
    self: '<button class="first" style="display:none"></button>',
    ancestor: '<div style="display:none"><button class="first"></button></div>',
    'visibility:hidden': '<button class="first" style="visibility:hidden"></button>',
    'visibility:collapse': '<button class="first" style="visibility:collapse"></button>',
  };
  for (const [mode, first] of Object.entries(cases)) {
    const dom = new JSDOM(`<body><main id="root"><button id="a"></button>${first}<h2 class="second" tabindex="-1"></h2></main></body>`, { pretendToBeVisual: true });
    const doc = dom.window.document;
    const root = doc.getElementById('root');
    const a = doc.getElementById('a');
    a.focus();
    const got = focusHandoff({ root, active: a, ctaGone: true, targets: ['.first', '.second'] });
    assert.strictEqual(got, doc.querySelector('.second'), mode);
    assert.equal(doc.activeElement, doc.querySelector('.second'), mode);
  }
});

test('focus handoff treats a CSS-hidden active control as stranded and keeps a visible one', () => {
  const dom = new JSDOM('<body><main id="root"><div id="wrap"><button id="a"></button></div><h2 class="t" tabindex="-1"></h2></main></body>', { pretendToBeVisual: true });
  const doc = dom.window.document;
  const root = doc.getElementById('root');
  const a = doc.getElementById('a');
  a.focus();
  assert.equal(focusHandoff({ root, active: a, targets: ['.t'] }), null);
  doc.getElementById('wrap').style.display = 'none';
  assert.strictEqual(focusHandoff({ root, active: a, targets: ['.t'] }), doc.querySelector('.t'));
});

const OPTICS_STEPS = [{ id: 'mission', number: '01', label: 'a' }, { id: 'bench', number: '02', label: 'b' }, { id: 'notebook', number: '03', label: 'c' }, { id: 'challenge', number: '04', label: 'd' }];
const BUOYANCY_STEPS = [{ id: 'mission', number: '1', label: 'a' }, { id: 'trials', number: '2', label: 'b' }, { id: 'notebook', number: '3', label: 'c' }, { id: 'challenge', number: '4', label: 'd' }];

test('StepNav draws an ol/li progress list with no controls (Optics and Buoyancy fixtures)', () => {
  for (const steps of [OPTICS_STEPS, BUOYANCY_STEPS]) {
    const dom = new JSDOM('<nav><ol id="o"></ol></nav>');
    const ol = dom.window.document.getElementById('o');
    renderStepNav(ol, { steps, currentStep: steps[1].id });
    assert.equal(ol.tagName, 'OL');
    assert.equal(ol.parentElement.tagName, 'NAV');
    assert.equal(ol.children.length, 4);
    assert.ok([...ol.children].every((li) => li.tagName === 'LI'));
    assert.equal(ol.querySelectorAll('button, a, input, [tabindex], [role=button]').length, 0);
    assert.deepEqual([...ol.children].map((li) => li.getAttribute('aria-current')), [null, 'step', null, null]);
    assert.deepEqual([...ol.children].map((li) => li.classList.contains('is-done')), [true, false, false, false]);
    assert.deepEqual([...ol.children].map((li) => li.classList.contains('is-current')), [false, true, false, false]);
    assert.deepEqual([...ol.children].map((li) => li.dataset.step), steps.map((s) => s.id));
    assert.deepEqual([...ol.children].map((li) => li.textContent), steps.map((s) => `${s.number} ${s.label}`));
  }
});

test('StepNav takes currentStep from the station and does not rebuild when only the current step moves', () => {
  const dom = new JSDOM('<ol id="o"></ol>');
  const ol = dom.window.document.getElementById('o');
  renderStepNav(ol, { steps: OPTICS_STEPS, currentStep: 'mission' });
  const before = [...ol.children];
  renderStepNav(ol, { steps: OPTICS_STEPS, currentStep: 'notebook' });
  assert.ok([...ol.children].every((li, i) => li === before[i]), 'same nodes');
  assert.deepEqual([...ol.children].map((li) => li.getAttribute('aria-current')), [null, null, 'step', null]);
  assert.deepEqual([...ol.children].map((li) => li.classList.contains('is-done')), [true, true, false, false]);
  renderStepNav(ol, { steps: OPTICS_STEPS, currentStep: 'nowhere' });
  assert.equal(ol.querySelectorAll('[aria-current]').length, 0);
  assert.equal(ol.querySelectorAll('.is-done, .is-current').length, 0);
  renderStepNav(ol, { steps: BUOYANCY_STEPS, currentStep: 'trials' });
  assert.equal(ol.children.length, 4);
  assert.equal(ol.children[1].dataset.step, 'trials');
});

test('StepNav writes nothing when the model is unchanged', async () => {
  const dom = new JSDOM('<ol id="o"></ol>');
  const ol = dom.window.document.getElementById('o');
  renderStepNav(ol, { steps: OPTICS_STEPS, currentStep: 'bench' });
  const seen = [];
  const mo = new dom.window.MutationObserver((records) => seen.push(...records));
  mo.observe(ol, { subtree: true, childList: true, attributes: true, characterData: true });
  renderStepNav(ol, { steps: OPTICS_STEPS, currentStep: 'bench' });
  await wait();
  assert.equal(seen.length, 0);
});

const COACH_HTML = '<section id="c"><strong id="n"></strong><p id="m"></p><p id="s"></p></section>';
const coachEls = (doc) => ({ name: doc.getElementById('n'), main: doc.getElementById('m'), sub: doc.getElementById('s') });

test('CoachCard draws name/main/sub, hides an empty sub, and is never a live region (Optics and Buoyancy fixtures)', () => {
  const dom = new JSDOM(COACH_HTML);
  const doc = dom.window.document;
  const els = coachEls(doc);
  renderCoachCard(els, { name: 'coach', main: 'do this', sub: 'because' });
  assert.deepEqual([els.name.textContent, els.main.textContent, els.sub.textContent, els.sub.hidden], ['coach', 'do this', 'because', false]);
  renderCoachCard(els, { name: 'coach', main: 'next', sub: null });
  assert.deepEqual([els.main.textContent, els.sub.textContent, els.sub.hidden], ['next', '', true]);
  renderCoachCard(els, { main: 'only main' });
  assert.equal(els.name.textContent, 'coach', 'a model without a name leaves the name alone');
  assert.equal(els.sub.hidden, true);
  // Optics has no name element
  renderCoachCard({ main: els.main, sub: els.sub }, { main: 'optics line', sub: 'more' });
  assert.deepEqual([els.main.textContent, els.sub.hidden], ['optics line', false]);
  assert.equal(doc.querySelectorAll('[aria-live], [role=status], [role=alert]').length, 0);
});

test('CoachCard leaves the DOM alone when nothing changed and knows no phase or mood', async () => {
  const dom = new JSDOM(COACH_HTML);
  const doc = dom.window.document;
  const els = coachEls(doc);
  renderCoachCard(els, { name: 'coach', main: 'a', sub: null, mood: 'happy', phase: 'trial1' });
  const seen = [];
  new dom.window.MutationObserver((r) => seen.push(...r)).observe(doc.getElementById('c'), { subtree: true, childList: true, attributes: true, characterData: true });
  renderCoachCard(els, { name: 'coach', main: 'a', sub: null });
  await wait();
  assert.equal(seen.length, 0);
  assert.ok(!doc.getElementById('c').outerHTML.includes('happy'));
  assert.ok(!doc.getElementById('c').hasAttribute('data-coach'));
});

const STATUS_HTML = '<div id="b" data-kind="neutral" hidden><span id="i" aria-hidden="true"></span><span id="t"></span></div>';
const statusEls = (doc) => ({ root: doc.getElementById('b'), icon: doc.getElementById('i'), text: doc.getElementById('t') });

test('StatusBar draws kind/icon/text, hides for null, and is not live (Optics and Buoyancy fixtures)', () => {
  const dom = new JSDOM(STATUS_HTML);
  const doc = dom.window.document;
  const els = statusEls(doc);
  for (const kind of ['neutral', 'progress', 'success', 'notice', 'warning']) {
    renderStatusBar(els, { kind, icon: '*', text: kind + ' text' });
    assert.deepEqual([els.root.hidden, els.root.dataset.kind, els.icon.textContent, els.text.textContent], [false, kind, '*', kind + ' text']);
  }
  // Optics-shaped model: clarity level mapped to a presentation kind
  renderStatusBar(els, { kind: 'success', icon: '✓', text: 'clear' });
  assert.equal(els.root.dataset.kind, 'success');
  renderStatusBar(els, null);
  assert.equal(els.root.hidden, true);
  renderStatusBar(els, { kind: 'unknown-kind', icon: '', text: 'x' });
  assert.equal(els.root.dataset.kind, 'neutral', 'an unknown kind falls back to neutral');
  assert.equal(doc.querySelectorAll('[aria-live], [role=status], [role=alert]').length, 0);
});

test('StatusBar writes nothing when the model is unchanged', async () => {
  const dom = new JSDOM(STATUS_HTML);
  const doc = dom.window.document;
  const els = statusEls(doc);
  renderStatusBar(els, { kind: 'progress', icon: 'o', text: 'same' });
  const seen = [];
  new dom.window.MutationObserver((r) => seen.push(...r)).observe(els.root, { subtree: true, childList: true, attributes: true, characterData: true });
  renderStatusBar(els, { kind: 'progress', icon: 'o', text: 'same' });
  await wait();
  assert.equal(seen.length, 0);
});

const OPTICS_DATA = { conditions: [{ label: 'f', value: '10 cm' }, { label: 'u', value: '30 cm' }] };
const BUOYANCY_DATA = { conditions: [{ label: 'liquid', value: 'water', state: 'locked' }, { label: 'block', value: '60 g', state: 'changed' }, { label: 'mass', value: '1', state: 'normal' }] };

test('DataCard is hidden for null and draws ordered dl/dt/dd with only a generic state hook', () => {
  const dom = new JSDOM('<section id="d"></section>');
  const doc = dom.window.document;
  const root = doc.getElementById('d');
  renderDataCard(root, null, { title: 'x' });
  assert.equal(root.hidden, true);
  for (const model of [OPTICS_DATA, BUOYANCY_DATA]) {
    renderDataCard(root, model, { title: 'Conditions' });
    assert.equal(root.hidden, false);
    assert.equal(root.querySelectorAll('dl').length, 1);
    assert.deepEqual([...root.querySelectorAll('dl > *')].map((e) => e.tagName), model.conditions.flatMap(() => ['DT', 'DD']));
    assert.deepEqual([...root.querySelectorAll('dt')].map((e) => e.textContent), model.conditions.map((c) => c.label));
    assert.deepEqual([...root.querySelectorAll('dd')].map((e) => e.textContent), model.conditions.map((c) => c.value));
    assert.deepEqual([...root.querySelectorAll('dd')].map((e) => e.dataset.state), model.conditions.map((c) => c.state ?? 'normal'));
    assert.equal(root.querySelector('h2').textContent, 'Conditions');
    assert.equal(root.getAttribute('aria-labelledby'), root.querySelector('h2').id);
  }
  assert.equal(root.querySelectorAll('[aria-live], [role=status]').length, 0);
});

test('DataCard does not translate states itself and falls back to normal for unknown ones', () => {
  const dom = new JSDOM('<section id="d"></section>');
  const root = dom.window.document.getElementById('d');
  renderDataCard(root, { conditions: [{ label: 'a', value: '1', state: 'locked' }, { label: 'b', value: '2', state: 'weird' }] });
  assert.equal(root.querySelectorAll('.sg-state-tag').length, 0, 'no words without station labels');
  assert.equal(root.querySelectorAll('dd')[1].dataset.state, 'normal');
  assert.equal(root.querySelector('h2'), null, 'no title unless the station gives one');
  renderDataCard(root, { conditions: [{ label: 'a', value: '1', state: 'locked' }] }, { stateLabels: { locked: '(fixed)' } });
  assert.equal(root.querySelector('.sg-state-tag').textContent, '(fixed)');
});

test('DataCard writes nothing when the model is unchanged', async () => {
  const dom = new JSDOM('<section id="d"></section>');
  const root = dom.window.document.getElementById('d');
  renderDataCard(root, OPTICS_DATA, { title: 'T' });
  const seen = [];
  new dom.window.MutationObserver((r) => seen.push(...r)).observe(root, { subtree: true, childList: true, attributes: true, characterData: true });
  renderDataCard(root, OPTICS_DATA, { title: 'T' });
  await wait();
  assert.equal(seen.length, 0);
});

const OPTICS_EVIDENCE = { items: [
  { id: 'trial-1', title: 'first', rows: [{ label: 'u', value: '30 cm' }, { label: 'v', value: '15 cm' }] },
  { id: 'trial-3', title: 'third', rows: [{ label: 'u', value: '5 cm' }], note: 'no clear image' },
] };
const BUOYANCY_EVIDENCE = { items: [{ id: 'record-1', title: 'record', rows: [{ label: 'liquid', value: 'water' }, { label: 'outcome', value: 'floats' }] }] };

test('EvidenceCard hides for null or no items and draws one section per item with a dl of rows', () => {
  const dom = new JSDOM('<section id="e"></section>');
  const root = dom.window.document.getElementById('e');
  renderEvidenceCard(root, null, { title: 'x' });
  assert.equal(root.hidden, true);
  renderEvidenceCard(root, { items: [] }, { title: 'x' });
  assert.equal(root.hidden, true);
  for (const model of [OPTICS_EVIDENCE, BUOYANCY_EVIDENCE]) {
    renderEvidenceCard(root, model, { title: 'Evidence' });
    assert.equal(root.hidden, false);
    const items = [...root.querySelectorAll('[data-evidence-item]')];
    assert.deepEqual(items.map((e) => e.dataset.evidenceItem), model.items.map((i) => i.id));
    assert.ok(items.every((e) => e.tagName === 'SECTION' && e.querySelector('h3') && e.querySelector('dl')));
    items.forEach((e, i) => {
      assert.deepEqual([...e.querySelectorAll('dt')].map((x) => x.textContent), model.items[i].rows.map((r) => r.label));
      assert.deepEqual([...e.querySelectorAll('dd')].map((x) => x.textContent), model.items[i].rows.map((r) => r.value));
      assert.equal(e.querySelectorAll('.sg-evidence-note').length, model.items[i].note ? 1 : 0, 'note is optional');
    });
    assert.equal(root.querySelector('h2').textContent, 'Evidence');
  }
  assert.equal(root.querySelectorAll('[aria-live], [role=status]').length, 0);
  renderEvidenceCard(root, null);
  assert.equal(root.hidden, true);
});

test('EvidenceCard fixtures and output carry no theoretical or expected values', () => {
  const dom = new JSDOM('<section id="e"></section>');
  const root = dom.window.document.getElementById('e');
  for (const model of [OPTICS_EVIDENCE, BUOYANCY_EVIDENCE]) {
    renderEvidenceCard(root, model, { title: 't' });
    for (const bad of ['theoretical', 'theoreticalValue', 'expected', 'expectedValue', 'correctAnswer']) {
      assert.ok(!JSON.stringify(model).includes(bad), bad);
      assert.ok(!root.innerHTML.includes(bad), bad);
    }
  }
});

test('EvidenceCard writes nothing when the model is unchanged', async () => {
  const dom = new JSDOM('<section id="e"></section>');
  const root = dom.window.document.getElementById('e');
  renderEvidenceCard(root, OPTICS_EVIDENCE, { title: 'T' });
  const seen = [];
  new dom.window.MutationObserver((r) => seen.push(...r)).observe(root, { subtree: true, childList: true, attributes: true, characterData: true });
  renderEvidenceCard(root, OPTICS_EVIDENCE, { title: 'T' });
  await wait();
  assert.equal(seen.length, 0);
});

test('both pilot stations use the shared interaction foundation', () => {
  const optics = fs.readFileSync(path.join(rootDir, 'assets/optics-guided/main.js'), 'utf8');
  const buoyancy = fs.readFileSync(path.join(rootDir, 'assets/buoyancy-guided/main.js'), 'utf8');
  assert.match(optics, /from '\.\.\/science-guided\/components\.js'/);
  for (const name of ['createActionBar', 'createAnnouncer', 'focusHandoff']) assert.match(optics, new RegExp(name));
  assert.ok(!/function focusTargetAfter/.test(optics), 'Optics no longer owns a second focus handoff');
  assert.match(buoyancy, /from '\.\.\/science-guided\/components\.js'/);
  for (const name of ['createActionBar', 'createAnnouncer', 'focusHandoff']) assert.match(buoyancy, new RegExp(name));
  const cards = fs.readFileSync(path.join(rootDir, 'assets/buoyancy-guided/cards.js'), 'utf8');
  const input = fs.readFileSync(path.join(rootDir, 'assets/buoyancy-guided/input.js'), 'utf8');
  assert.ok(!/export function createAnnouncer/.test(cards));
  assert.ok(!/export function focusHandoff/.test(input));
  const opticsPage = fs.readFileSync(path.join(rootDir, 'tools/science/optics-guided.html'), 'utf8');
  const buoyancyPage = fs.readFileSync(path.join(rootDir, 'tools/science/buoyancy-guided.html'), 'utf8');
  for (const page of [opticsPage, buoyancyPage]) assert.match(page, /assets\/science-guided\/science-guided\.css/);
  assert.match(opticsPage, /id="og-announcer" aria-live="polite" aria-atomic="true"/);
  assert.ok(!/id="og-coach-text"[^>]*(?:aria-live|role="status")/.test(opticsPage), 'Optics coach is visual only');
  assert.match(buoyancyPage, /class="sg-sr" id="bg-announcer"/);
  assert.match(optics, /renderStepNav/);
  assert.match(optics, /renderCoachCard/);
  assert.match(optics, /renderStatusBar/);
  assert.match(optics, /renderDataCard/);
  assert.match(optics, /renderEvidenceCard/);
  assert.match(buoyancy, /renderEvidenceCard/);
  assert.ok(!/export function renderEvidence\b/.test(cards), 'Buoyancy cards.js no longer owns renderEvidence');
  assert.ok(!/id="og-records"|og-records-wrap/.test(opticsPage), 'Optics evidence is drawn by the shared module');
  assert.match(buoyancy, /renderDataCard/);
  assert.ok(!/export function renderData\b/.test(cards), 'Buoyancy cards.js no longer owns renderData');
  assert.ok(!/id="og-f"|id="og-u"/.test(opticsPage), 'Optics data card is drawn by the shared module');
  const dataSection = opticsPage.match(/<section class="og-card og-data"[\s\S]*?<\/section>/)[0];
  assert.ok(!/og-records|og-save-note|og-restart|og-advanced|<ul|<button/.test(dataSection), 'DataCard holds no evidence, save note, restart or advanced link');
  assert.match(opticsPage, /id="og-utility"[\s\S]*og-save-note[\s\S]*og-restart[\s\S]*og-advanced/, 'save note, restart and advanced link live in the station utility block');
  assert.match(buoyancy, /renderStatusBar/);
  assert.ok(!/export function renderStatus\b/.test(cards), 'Buoyancy cards.js no longer owns renderStatus');
  assert.match(buoyancy, /renderCoachCard/);
  assert.ok(!/export function renderCoach\b/.test(cards), 'Buoyancy cards.js no longer owns renderCoach');
  assert.match(buoyancy, /renderStepNav/);
  assert.ok(!/export function renderSteps/.test(cards), 'Buoyancy cards.js no longer owns renderSteps');
  assert.ok(!/<button/.test(opticsPage.match(/<nav class="og-nav"[\s\S]*?<\/nav>/)[0]), 'Optics step nav has no buttons');
  assert.match(opticsPage, /<nav class="og-nav"[^>]*><ol [^>]*id="og-steps"/);
});

test('shared CSS contains only the approved behavior utilities in this batch', () => {
  const css = fs.readFileSync(path.join(rootDir, 'assets/science-guided/science-guided.css'), 'utf8');
  for (const cls of ['.sg-sr', '.sg-direct-manipulation', '.sg-scroll-surface', '.sg-steps']) assert.ok(css.includes(cls));
  assert.match(css, /\.sg-direct-manipulation\s*\{\s*touch-action:\s*none;/);
  assert.match(css, /\.sg-scroll-surface\s*\{\s*touch-action:\s*pan-y;/);
  assert.ok(!/\.(?:og|bg)-/.test(css), 'shared CSS contains no station-specific selectors');
});

test('shared behavior module contains no science-specific decisions', () => {
  const src = fs.readFileSync(path.join(rootDir, 'assets/science-guided/components.js'), 'utf8');
  for (const bad of ['optics', 'buoyancy', 'focal', 'lens', 'density', 'ballast', 'mass', 'volume', 'magnification', 'virtual image', 'localStorage', 'sessionStorage', 'bhcsScienceTrack', 'analytics', 'physics']) {
    assert.ok(!src.toLowerCase().includes(bad.toLowerCase()), bad);
  }
  assert.ok(!/\b(?:og|bg)-/.test(src), 'no station class names in the shared module');
});

for (const [name, fn] of tests) {
  await fn();
  console.log('PASS', name);
}
console.log('PASS science guided shared foundation: ' + tests.length + ' tests');
