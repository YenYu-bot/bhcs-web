import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createActionBar, createAnnouncer, focusHandoff, renderStepNav, renderCoachCard, renderStatusBar, renderDataCard, renderEvidenceCard, renderCompletionCard, renderCompareCard, buildComparisonTable, renderConceptReveal, createNotebook, createChallengeCard } from '../assets/science-guided/components.js';

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

const COMPLETE_HTML = '<section id="c" hidden><h2 id="h"></h2><div id="b"></div></section>';
const completeEls = (doc) => ({ root: doc.getElementById('c'), heading: doc.getElementById('h'), body: doc.getElementById('b') });
const OPTICS_COMPLETE = { heading: 'Done', claims: [], conclusion: ['what I found', 'what I do not know'], link: { href: './optics.html', label: 'free' } };
const BUOYANCY_COMPLETE = { heading: 'Done', claims: ['one', 'two', 'three'], conclusion: ['you proved:'], link: { href: '../x.html', label: 'free' } };

test('CompletionCard draws heading, 0-3 claims, optional conclusion and optional link (Optics and Buoyancy fixtures)', () => {
  const dom = new JSDOM(COMPLETE_HTML);
  const doc = dom.window.document;
  const els = completeEls(doc);
  renderCompletionCard(els, null);
  assert.equal(els.root.hidden, true);
  renderCompletionCard(els, OPTICS_COMPLETE);
  assert.equal(els.root.hidden, false);
  assert.equal(els.heading.textContent, 'Done');
  assert.equal(els.body.querySelectorAll('.sg-claims').length, 0, 'no claims list when there are no claims');
  assert.deepEqual([...els.body.querySelectorAll('.sg-complete-conclusion')].map((e) => e.textContent), OPTICS_COMPLETE.conclusion);
  assert.equal(els.body.querySelector('a').getAttribute('href'), './optics.html');
  renderCompletionCard(els, BUOYANCY_COMPLETE);
  assert.deepEqual([...els.body.querySelectorAll('.sg-claims li')].map((e) => e.textContent.replace(/^✓\s*/, '')), ['one', 'two', 'three']);
  assert.ok([...els.body.querySelectorAll('.sg-tick')].every((e) => e.getAttribute('aria-hidden') === 'true'));
  assert.equal(els.body.querySelector('.sg-complete-link a').getAttribute('href'), '../x.html');
  renderCompletionCard(els, { heading: 'Bare', claims: ['only'] });
  assert.equal(els.body.querySelectorAll('.sg-complete-conclusion, a').length, 0, 'conclusion and link are optional');
  assert.equal(els.body.querySelectorAll('.sg-claims li').length, 1);
  assert.equal(doc.querySelectorAll('[aria-live], [role=status]').length, 0);
});

test('CompletionCard refuses more than three claims instead of cutting them', () => {
  const dom = new JSDOM(COMPLETE_HTML);
  const els = completeEls(dom.window.document);
  renderCompletionCard(els, { heading: 'x', claims: ['1', '2', '3'] });
  assert.throws(() => renderCompletionCard(els, { heading: 'x', claims: ['1', '2', '3', '4'] }), RangeError);
  assert.equal(els.body.querySelectorAll('.sg-claims li').length, 3, 'a refused model leaves the last good card alone');
});

test('CompletionCard writes nothing when the model is unchanged', async () => {
  const dom = new JSDOM(COMPLETE_HTML);
  const els = completeEls(dom.window.document);
  renderCompletionCard(els, BUOYANCY_COMPLETE);
  const seen = [];
  new dom.window.MutationObserver((r) => seen.push(...r)).observe(els.root, { subtree: true, childList: true, attributes: true, characterData: true });
  renderCompletionCard(els, BUOYANCY_COMPLETE);
  await wait();
  assert.equal(seen.length, 0);
});

const COMPARE_HTML = '<section id="c"><div id="b"></div></section>';
const compareEls = (doc) => ({ root: doc.getElementById('c'), body: doc.getElementById('b') });
const HEADS = { item: 'item', first: 'first', second: 'second', changed: 'changed', same: 'same' };
const OPTICS_COMPARE = {
  independentVariable: { label: 'u', from: '30 cm', to: '15 cm' },
  controlledVariables: [{ label: 'f', value: '10 cm' }],
  observedResponse: [{ label: 'v', first: '15 cm', second: '30 cm' }, { label: 'size', first: 'small', second: 'large' }],
  notice: { kind: 'ok', text: 'only u changed' },
  questions: [
    { id: 'position', text: 'where?', options: [{ value: 'closer', label: 'closer' }, { value: 'farther', label: 'farther' }, { value: 'same', label: 'same' }], selectedValue: null },
    { id: 'size', text: 'size?', options: [{ value: 'smaller', label: 'smaller' }, { value: 'larger', label: 'larger' }], selectedValue: 'larger' },
  ],
};
const BUOYANCY_COMPARE = {
  independentVariable: { label: 'liquid', from: 'water', to: 'brine' },
  controlledVariables: [{ label: 'volume', value: '100 cm3' }, { label: 'method', value: 'same' }],
  observedResponse: [{ label: 'block', first: 'stays', second: 'floats' }],
  procedureNote: 'change only the liquid',
  notice: { kind: 'info', text: 'liquid changed' },
  questions: [{ id: 'stayMass', text: 'mass?', options: [{ value: 'larger', label: 'larger' }, { value: 'same', label: 'same' }], selectedValue: 'larger', disabled: true, feedback: { kind: 'success', text: 'matches' } }],
};
const deepKeys = (value, out = new Set()) => {
  if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) { out.add(k); deepKeys(v, out); }
  return out;
};

test('CompareCard hides for null, draws a semantic table with generic row kinds, and every part is optional but the response', () => {
  const dom = new JSDOM(COMPARE_HTML);
  const doc = dom.window.document;
  const els = compareEls(doc);
  renderCompareCard(els, null, { heads: HEADS });
  assert.equal(els.root.hidden, true);
  for (const model of [OPTICS_COMPARE, BUOYANCY_COMPARE]) {
    renderCompareCard(els, model, { heads: HEADS, onAnswer() {} });
    assert.equal(els.root.hidden, false);
    assert.equal(els.body.querySelectorAll('table').length, 1);
    assert.deepEqual([...els.body.querySelectorAll('thead th')].map((e) => e.getAttribute('scope')), ['col', 'col', 'col']);
    assert.ok([...els.body.querySelectorAll('tbody th')].every((e) => e.getAttribute('scope') === 'row'));
    const kinds = [...els.body.querySelectorAll('tbody tr')].map((e) => e.dataset.kind);
    assert.deepEqual(kinds, ['changed', ...model.controlledVariables.map(() => 'controlled'), ...model.observedResponse.map(() => 'observed')]);
    assert.equal(els.body.querySelectorAll('.sg-procedure').length, model.procedureNote ? 1 : 0);
    assert.equal(els.body.querySelector('.sg-notice').textContent, model.notice.text);
    assert.equal(els.body.querySelector('.sg-notice').dataset.kind, model.notice.kind);
    assert.equal(els.body.querySelectorAll('[data-bg-kind],[data-og-kind],[class*="bg-"],[class*="og-"]').length, 0);
  }
  renderCompareCard(els, { observedResponse: [{ label: 'v', first: '1', second: '2' }], questions: [] }, { heads: HEADS });
  assert.deepEqual([...els.body.querySelectorAll('tbody tr')].map((e) => e.dataset.kind), ['observed'], 'independentVariable and controlledVariables are optional');
  assert.equal(els.body.querySelectorAll('.sg-notice, .sg-procedure, fieldset').length, 0);
  const wide = buildComparisonTable(doc, OPTICS_COMPARE, { heads: HEADS, caption: 'cap', itemHeadingHidden: true });
  assert.equal(wide.querySelector('caption').textContent, 'cap');
  assert.equal(wide.querySelector('thead th .sg-sr').textContent, 'item');
});

test('CompareCard takes options as { value, label }, restores selected/disabled/feedback, and calls onAnswer(questionId, value) only on a real change', () => {
  const dom = new JSDOM(COMPARE_HTML);
  const doc = dom.window.document;
  const els = compareEls(doc);
  const answers = [];
  renderCompareCard(els, OPTICS_COMPARE, { heads: HEADS, onAnswer: (q, v) => answers.push([q, v]) });
  const radios = [...els.body.querySelectorAll('input[type=radio]')];
  assert.deepEqual(radios.map((r) => r.value), ['closer', 'farther', 'same', 'smaller', 'larger']);
  assert.deepEqual(radios.map((r) => r.checked), [false, false, false, false, true], 'selectedValue restores checked');
  assert.deepEqual(radios.map((r) => r.disabled), [false, false, false, false, false]);
  const label = radios[1].closest('label');
  assert.equal(label.textContent.trim(), 'farther');
  for (const key of ['focus', 'keydown', 'keyup', 'click']) radios[0].dispatchEvent(new dom.window.Event(key, { bubbles: true }));
  assert.deepEqual(answers, [], 'focusing or arrowing through the choices answers nothing by itself');
  radios[1].checked = true;
  radios[1].dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.deepEqual(answers, [['position', 'farther']]);
  renderCompareCard(els, BUOYANCY_COMPARE, { heads: HEADS });
  assert.equal([...els.body.querySelectorAll('input[type=radio]')].every((r) => r.disabled), true, 'disabled is restored');
  assert.equal(els.body.querySelector('[data-feedback="stayMass"]').hidden, false);
  assert.equal(els.body.querySelector('[data-feedback="stayMass"]').dataset.kind, 'success');
  assert.equal(els.body.querySelector('[data-feedback="stayMass"]').textContent, 'matches');
  assert.throws(() => renderCompareCard(els, { ...OPTICS_COMPARE, questions: [{ id: 'q', text: 't', options: [['closer', 'Closer']] }] }, { heads: HEADS }), TypeError, 'tuple options are refused');
});

test('CompareCard keeps the same radio nodes and keeps focus when only the selection or feedback changes', () => {
  const dom = new JSDOM(COMPARE_HTML, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const els = compareEls(doc);
  renderCompareCard(els, OPTICS_COMPARE, { heads: HEADS, onAnswer() {} });
  const radios = [...els.body.querySelectorAll('input[type=radio]')];
  radios[1].focus();
  assert.equal(doc.activeElement, radios[1]);
  const seen = [];
  new dom.window.MutationObserver((r) => seen.push(...r)).observe(els.body, { childList: true, subtree: true });
  const next = structuredClone(OPTICS_COMPARE);
  next.questions[0].selectedValue = 'farther';
  next.questions[0].feedback = { kind: 'nudge', text: 'look again' };
  next.notice = { kind: 'warn', text: 'changed notice' };
  renderCompareCard(els, next, { heads: HEADS, onAnswer() {} });
  assert.deepEqual([...els.body.querySelectorAll('input[type=radio]')], radios, 'same node identity');
  assert.equal(doc.activeElement, radios[1], 'focus is not lost');
  assert.equal(radios[1].checked, true);
  assert.equal(els.body.querySelector('[data-feedback="position"]').textContent, 'look again');
  assert.equal(els.body.querySelector('.sg-notice').textContent, 'changed notice');
  assert.equal(seen.filter((r) => r.type === 'childList' && [...r.addedNodes, ...r.removedNodes].some((n) => n.nodeType === 1 && !n.matches?.('.sg-feedback'))).length, 0, 'no structural rebuild');
});

test('CompareCard fixtures carry no answer key', () => {
  for (const model of [OPTICS_COMPARE, BUOYANCY_COMPARE]) {
    const keys = deepKeys(model);
    for (const bad of ['correctAnswer', 'answerKey', 'expectedAnswer', 'correct']) assert.ok(!keys.has(bad), bad);
  }
  const src = fs.readFileSync(path.join(rootDir, 'assets/science-guided/components.js'), 'utf8');
  assert.ok(!/correctAnswer|answerKey|expectedAnswer|directComparable|theoretical/.test(src), 'the shared module never judges an answer');
});

const CONCEPT_HTML = '<section id="c" hidden><h2 id="h"></h2><div id="b"></div></section>';
const conceptEls = (doc) => ({ root: doc.getElementById('c'), heading: doc.getElementById('h'), body: doc.getElementById('b') });
const OPTICS_CONCEPT = {
  cards: [
    { id: 'real', title: 'real', body: ['a', 'b'], evidence: [{ text: 'you found 14.5 and 29.5' }] },
    { id: 'virtual', title: 'virtual', body: ['c'], evidence: [{ text: 'at 5 cm no screen position' }] },
  ],
  formula: {
    heading: 'the relation', expression: '1/f = 1/u + 1/v',
    lines: [{ text: 'round 1', note: 'you found 14.5' }, { text: 'round 2', note: 'you found 29.5' }, { text: 'round 3', note: 'v is negative' }],
    note: 'negative is virtual',
  },
};
const BUOYANCY_CONCEPT = {
  heading: 'Concept',
  cards: [{ id: 'density', title: 'density', body: ['x'], evidence: [{ label: 'block', text: '100 g / 100 cm3' }, { label: 'wood', text: '300 g / 500 cm3' }] }],
  formula: { heading: 'formula', expression: 'rho = m / V', lines: [{ text: 'density = mass / volume' }, { text: 'block: 1.0', emphasis: true }] },
};

test('ConceptReveal hides for null and draws cards, array evidence with optional labels, and an optional formula', () => {
  const dom = new JSDOM(CONCEPT_HTML);
  const doc = dom.window.document;
  const els = conceptEls(doc);
  renderConceptReveal(els, null);
  assert.equal(els.root.hidden, true);
  renderConceptReveal(els, OPTICS_CONCEPT);
  assert.equal(els.root.hidden, false);
  assert.deepEqual([...els.body.querySelectorAll('[data-concept-card]')].map((e) => e.dataset.conceptCard), ['real', 'virtual']);
  assert.deepEqual([...els.body.querySelectorAll('[data-concept-card="real"] > p')].map((e) => e.textContent), ['a', 'b']);
  assert.deepEqual([...els.body.querySelectorAll('[data-concept-card="real"] .sg-concept-evidence li')].map((e) => e.textContent), ['you found 14.5 and 29.5']);
  assert.equal(els.body.querySelectorAll('.sg-line-label').length, 0, 'evidence label is optional');
  assert.equal(els.body.querySelector('.sg-formula').textContent, '1/f = 1/u + 1/v');
  assert.deepEqual([...els.body.querySelectorAll('.sg-formula-lines li')].map((e) => e.firstChild.textContent), ['round 1', 'round 2', 'round 3']);
  assert.deepEqual([...els.body.querySelectorAll('.sg-line-note')].map((e) => e.textContent), ['you found 14.5', 'you found 29.5', 'v is negative']);
  assert.equal(els.body.querySelector('.sg-formula-note').textContent, 'negative is virtual');
  assert.equal(els.body.querySelectorAll('[data-emphasis]').length, 0, 'emphasis is only set when asked for');
  renderConceptReveal(els, BUOYANCY_CONCEPT, { labelSuffix: ': ' });
  assert.equal(els.heading.textContent, 'Concept');
  assert.deepEqual([...els.body.querySelectorAll('.sg-concept-evidence li')].map((e) => e.textContent), ['block: 100 g / 100 cm3', 'wood: 300 g / 500 cm3']);
  assert.deepEqual([...els.body.querySelectorAll('.sg-formula-lines li')].map((e) => e.dataset.emphasis ?? null), [null, 'true']);
  assert.equal(els.body.querySelectorAll('.sg-line-note, .sg-formula-note').length, 0, 'line note and formula note are optional');
  renderConceptReveal(els, { cards: BUOYANCY_CONCEPT.cards });
  assert.equal(els.body.querySelectorAll('[data-formula]').length, 0, 'the formula is optional');
  assert.equal(doc.querySelectorAll('[aria-live], [role=status]').length, 0);
  assert.equal(els.body.querySelectorAll('[class*="bg-"],[class*="og-"],[data-found],[data-bg-line]').length, 0);
});

test('ConceptReveal writes nothing when the model is unchanged and ignores legacy fields', async () => {
  const dom = new JSDOM(CONCEPT_HTML);
  const els = conceptEls(dom.window.document);
  renderConceptReveal(els, OPTICS_CONCEPT);
  const seen = [];
  new dom.window.MutationObserver((r) => seen.push(...r)).observe(els.root, { subtree: true, childList: true, attributes: true, characterData: true });
  renderConceptReveal(els, OPTICS_CONCEPT);
  await wait();
  assert.equal(seen.length, 0);
  renderConceptReveal(els, { cards: [], formula: { heading: 'h', expression: 'e', lines: [{ text: 't', found: 'legacy', theoreticalValue: 9 }], negativeNote: 'legacy' } });
  assert.equal(els.body.querySelectorAll('.sg-line-note, .sg-formula-note').length, 0, 'the old found/negativeNote fields are no longer read');
  assert.ok(!els.body.innerHTML.includes('legacy') && !els.body.innerHTML.includes('theoretical'));
});

const NB_HTML = '<section id="nb" hidden><div id="body"></div></section>';
const nbModel = (over = {}) => ({
  evidenceHeading: 'Evidence', evidenceSummary: { independentVariable: { label: 'u', from: '30', to: '15' }, controlledVariables: [{ label: 'f', value: '10' }], observedResponse: [{ label: 'v', first: '15', second: '30' }], procedureNote: 'only u changed' },
  levelsLegend: 'How?', levels: [{ id: 'A', title: 'A help', desc: 'sentences' }, { id: 'B', title: 'B own', desc: 'words' }, { id: 'C', title: 'C research', desc: 'evidence' }],
  selectedLevel: 'A',
  levelA: { given: ['one', 'two'], stems: [{ id: 'relationPosition', legend: 'position...', options: [{ value: 'closer', label: 'closer' }, { value: 'farther', label: 'farther' }], selectedValue: null }, { id: 'relationSize', legend: 'size...', options: [{ value: 'smaller', label: 'smaller' }, { value: 'larger', label: 'larger' }], selectedValue: 'larger' }], nudge: null },
  levelB: { prompt: 'say it', placeholder: 'e.g.', value: '' },
  levelC: { q1: { label: 'what', value: '' }, q2: { label: 'limits', value: '' }, ideas: ['idea one', 'idea two'], ideasHeading: 'ideas', showIdeas: false },
  ...over,
});
const mountNotebook = (opts = {}) => {
  const dom = new JSDOM(NB_HTML, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const calls = { level: [], relation: [], draft: [], flush: [] };
  const nb = createNotebook(doc.getElementById('nb'), { body: doc.getElementById('body'), idPrefix: 'x', maxLength: 50, comparison: { heads: HEADS }, ...opts }, {
    onLevel: (l) => calls.level.push(l), onRelation: (id, v) => calls.relation.push([id, v]), onDraft: (f) => calls.draft.push(f), onFlush: (f) => calls.flush.push(f),
  });
  return { dom, doc, nb, calls, root: doc.getElementById('nb'), body: doc.getElementById('body') };
};
const type = (dom, el, value) => { el.value = value; el.dispatchEvent(new dom.window.Event('input', { bubbles: true })); };

test('Notebook hides for null, draws the evidence table, native level radios and one hidden panel per level', () => {
  const { nb, root, body } = mountNotebook();
  nb.update(null);
  assert.equal(root.hidden, true);
  nb.update(nbModel());
  assert.equal(root.hidden, false);
  assert.equal(body.querySelector('.sg-nb-evidence h3').textContent, 'Evidence');
  assert.deepEqual([...body.querySelectorAll('.sg-nb-evidence tbody tr')].map((r) => r.dataset.kind), ['changed', 'controlled', 'observed']);
  assert.equal(body.querySelector('.sg-procedure').textContent, 'only u changed');
  const levels = [...body.querySelectorAll('input[type=radio][data-level]')];
  assert.deepEqual(levels.map((r) => [r.value, r.name, r.checked]), [['A', 'x-level', true], ['B', 'x-level', false], ['C', 'x-level', false]]);
  assert.deepEqual([...body.querySelectorAll('[data-panel]')].map((p) => [p.dataset.panel, p.hidden]), [['A', false], ['B', true], ['C', true]]);
  nb.update(nbModel({ selectedLevel: 'C' }));
  assert.deepEqual([...body.querySelectorAll('[data-panel]')].map((p) => [p.dataset.panel, p.hidden]), [['A', true], ['B', true], ['C', false]]);
  nb.update(nbModel({ selectedLevel: null }));
  assert.equal(body.querySelectorAll('[data-panel]:not([hidden])').length, 0, 'no level chosen, no panel');
  assert.equal(root.querySelectorAll('[aria-live], [role=status]').length, 0);
});

test('Notebook Level A: given lines, stems as radio groups, selection restored, relation changes reported', () => {
  const { dom, nb, body, calls } = mountNotebook();
  nb.update(nbModel());
  assert.deepEqual([...body.querySelectorAll('.sg-given li')].map((l) => l.textContent), ['one', 'two']);
  assert.deepEqual([...body.querySelectorAll('[data-stem] legend')].map((l) => l.textContent), ['position...', 'size...']);
  const radios = [...body.querySelectorAll('input[data-relation]')];
  assert.deepEqual(radios.map((r) => r.checked), [false, false, false, true], 'selectedValue restores checked');
  radios[1].checked = true; radios[1].dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.deepEqual(calls.relation, [['relationPosition', 'farther']]);
  nb.update(nbModel({ levelA: { ...nbModel().levelA, nudge: 'look again' } }));
  assert.equal(body.querySelector('[data-nudge]').hidden, false);
  assert.equal(body.querySelector('[data-nudge]').textContent, 'look again');
  const levels = body.querySelectorAll('input[data-level]');
  levels[1].checked = true; levels[1].dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.deepEqual(calls.level, ['B']);
});

test('Notebook text: maxLength, 300 ms debounce with only the final draft, blur and explicit flush, reset', async () => {
  const { dom, nb, body, calls } = mountNotebook({ debounceMs: 20 });
  nb.update(nbModel());
  const free = body.querySelector('#x-nb-free'), ev = body.querySelector('#x-nb-evidence'), lim = body.querySelector('#x-nb-limit');
  assert.deepEqual([free, ev, lim].map((t) => t.maxLength), [50, 50, 50]);
  assert.equal(body.querySelector('label[for="x-nb-free"]').textContent, 'say it');
  type(dom, free, 'a'); type(dom, free, 'ab'); type(dom, free, 'abc');
  assert.deepEqual(calls.draft, [], 'typing sends nothing at once');
  await wait(60);
  assert.deepEqual(calls.draft, [{ freeText: 'abc' }], 'only the last text after the pause');
  type(dom, ev, 'E'); free.dispatchEvent(new dom.window.Event('blur'));   // a blur of any field hands on everything pending
  assert.deepEqual(calls.flush, [{ evidenceText: 'E' }]);
  type(dom, lim, 'L'); nb.flush();
  assert.deepEqual(calls.flush, [{ evidenceText: 'E' }, { limitationText: 'L' }], 'explicit flush');
  type(dom, free, 'zzz'); nb.reset(); nb.flush(); await wait(60);
  assert.equal(calls.draft.length, 1, 'reset drops what was pending');
  assert.equal(calls.flush.length, 2);
});

test('Notebook update never overwrites a focused or pending field, and never rebuilds on a level switch or relation change', async () => {
  const { dom, doc, nb, body, calls } = mountNotebook({ debounceMs: 20 });
  nb.update(nbModel({ selectedLevel: 'B' }));
  const free = body.querySelector('#x-nb-free');
  const nodes = [...body.querySelectorAll('textarea, input')];
  free.focus();
  type(dom, free, 'new text');
  nb.update(nbModel({ selectedLevel: 'B', levelB: { prompt: 'say it', placeholder: 'e.g.', value: 'OLD' } }));
  assert.equal(free.value, 'new text', 'a focused field keeps what is being typed');
  free.blur();                       // blur flushes, so it is no longer pending; give it a value again with focus elsewhere
  type(dom, free, 'pending text');
  assert.equal(doc.activeElement === free, false);
  nb.update(nbModel({ selectedLevel: 'B', levelB: { prompt: 'say it', placeholder: 'e.g.', value: 'OLD' } }));
  assert.equal(free.value, 'pending text', 'a pending field keeps it too');
  await wait(60);
  nb.update(nbModel({ selectedLevel: 'B', levelB: { prompt: 'say it', placeholder: 'e.g.', value: 'SAVED' } }));
  assert.equal(free.value, 'SAVED', 'an idle field follows the model');
  nb.update(nbModel({ selectedLevel: 'C' }));
  nb.update(nbModel({ selectedLevel: 'A', levelA: { ...nbModel().levelA, stems: nbModel().levelA.stems.map((x) => ({ ...x, selectedValue: x.options[0].value })) } }));
  assert.deepEqual([...body.querySelectorAll('textarea, input')], nodes, 'same controls: a level switch or a relation change rebuilds nothing');
  assert.ok(calls.draft.length >= 1);
});

test('Notebook ideas, ready note, optional parts, and fixtures for both stations', () => {
  const { nb, body } = mountNotebook({ ideasCollapsible: true });
  nb.update(nbModel());
  assert.equal(body.querySelector('[data-ideas]').tagName, 'DETAILS');
  assert.equal(body.querySelector('[data-ideas]').hidden, true);
  nb.update(nbModel({ levelC: { ...nbModel().levelC, showIdeas: true } }));
  assert.equal(body.querySelector('[data-ideas]').hidden, false);
  assert.deepEqual([...body.querySelectorAll('[data-ideas] li')].map((l) => l.textContent), ['idea one', 'idea two']);
  assert.equal(body.querySelector('[data-ready]').hidden, true, 'no ready note unless the station gives one');
  nb.update(nbModel({ readyNote: 'ready to go on' }));
  assert.equal(body.querySelector('[data-ready]').hidden, false);
  assert.equal(body.querySelector('[data-ready]').textContent, 'ready to go on');
  const plain = mountNotebook({ idPrefix: 'y' });
  plain.nb.update(nbModel({ evidenceHeading: undefined, levelB: { prompt: 'p', value: '', help: 'a hint' }, levelC: { q1: { label: 'a', value: '' }, q2: { label: 'b', value: '' }, help: 'c hint' } }));
  assert.equal(plain.body.querySelector('.sg-nb-evidence h3'), null, 'the evidence heading is optional');
  assert.equal(plain.body.querySelector('[data-ideas]'), null, 'no ideas without ideas');
  assert.deepEqual([...plain.body.querySelectorAll('.sg-help')].map((e) => e.textContent), ['a hint', 'c hint']);
  const src = fs.readFileSync(path.join(rootDir, 'assets/science-guided/components.js'), 'utf8');
  assert.ok(!/localStorage|sessionStorage|indexedDB|fetch\(|sendBeacon|bhcsScienceTrack|SAVE_CONCLUSION|SAVE_CHALLENGE_NOTE|ANSWER_CHALLENGE/.test(src), 'no storage, network, analytics or station action names in the shared module');
});

const CH_HTML = '<section id="ch" hidden><h2 id="h"></h2><div id="body"></div></section>';
const chStep = (id, over = {}) => ({ id, question: `q ${id}`, options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }], unlocked: true, choice: null, attempts: 0, correct: false, feedback: null, ...over });
const chModel = (steps, over = {}) => ({ id: 1, title: 'Challenge 1', scenario: 'a scenario', count: 3, steps, note: null, ...over });
const mountChallenge = (opts = {}) => {
  const dom = new JSDOM(CH_HTML, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const calls = { answer: [], draft: [], flush: [] };
  const card = createChallengeCard({ root: doc.getElementById('ch'), heading: doc.getElementById('h'), body: doc.getElementById('body') }, { idPrefix: 'x', debounceMs: 20, ...opts },
    { onAnswer: (s, v) => calls.answer.push([s, v]), onNoteDraft: (t) => calls.draft.push(t), onNoteFlush: (t) => calls.flush.push(t) });
  return { dom, doc, card, calls, root: doc.getElementById('ch'), body: doc.getElementById('body') };
};

test('ChallengeCard hides for null, draws only unlocked steps, and every choice is a real button', () => {
  const { card, root, body, doc } = mountChallenge();
  card.update(null);
  assert.equal(root.hidden, true);
  card.update(chModel([chStep('one'), chStep('two', { unlocked: false })]));
  assert.equal(root.hidden, false);
  assert.equal(doc.getElementById('h').textContent, 'Challenge 1');
  assert.equal(body.querySelector('.sg-scenario').textContent, 'a scenario');
  assert.deepEqual([...body.querySelectorAll('[data-challenge-step]')].map((e) => e.dataset.challengeStep), ['one']);
  const options = [...body.querySelectorAll('[data-option]')];
  assert.deepEqual(options.map((b) => [b.tagName, b.type, b.textContent]), [['BUTTON', 'button', 'A'], ['BUTTON', 'button', 'B'], ['BUTTON', 'button', 'C']]);
  assert.equal(body.querySelectorAll('input[type=radio]').length, 0, 'no radio controls');
  assert.equal(body.querySelector('[role=group]').getAttribute('aria-labelledby'), body.querySelector('.sg-step-question').id);
  assert.equal(root.querySelectorAll('[aria-live], [role=status]').length, 0);
});

test('ChallengeCard: only an activation answers; focus, arrows and hover do not; a click answers once', () => {
  const { dom, doc, card, body, calls } = mountChallenge();
  card.update(chModel([chStep('one')]));
  const [a, b] = body.querySelectorAll('[data-option]');
  a.focus();
  for (const key of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Tab']) a.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true }));
  b.dispatchEvent(new dom.window.MouseEvent('mouseover', { bubbles: true }));
  b.focus();
  assert.deepEqual(calls.answer, [], 'focus, arrows and hover answer nothing');
  b.click();
  assert.deepEqual(calls.answer, [['one', 'b']], 'one click, one answer with (stepId, value)');
  // Enter and Space activate a native button as a click (the browser does this; the card adds no key handling of its own)
  assert.equal(doc.activeElement, b);
  const src = fs.readFileSync(path.join(rootDir, 'assets/science-guided/components.js'), 'utf8');
  assert.ok(!/keydown|keyup|keypress/.test(src.slice(src.indexOf('export function createChallengeCard'))), 'the card has no key handler: Enter and Space are the native button activation');
});

test('ChallengeCard keeps the same buttons and focus when attempts, choice or feedback change, and shows solved steps locked', () => {
  const { doc, card, body } = mountChallenge();
  card.update(chModel([chStep('one')]));
  const buttons = [...body.querySelectorAll('button')];
  buttons[1].focus();
  const seen = [];
  new doc.defaultView.MutationObserver((r) => seen.push(...r)).observe(body, { childList: true, subtree: true });
  card.update(chModel([chStep('one', { choice: 'b', attempts: 1, feedback: { kind: 'nudge', text: 'look again' } })]));
  assert.deepEqual([...body.querySelectorAll('button')], buttons, 'same node identity');
  assert.equal(doc.activeElement, buttons[1], 'focus is not lost');
  assert.equal(body.querySelector('[data-challenge-step]').dataset.attempts, '1');
  assert.equal(body.querySelector('[data-step-feedback]').textContent, 'look again');
  assert.equal(body.querySelector('[data-step-feedback]').dataset.kind, 'nudge');
  assert.equal(seen.filter((r) => r.type === 'childList' && [...r.addedNodes, ...r.removedNodes].some((n) => n.nodeType === 1)).length, 0, 'no structural rebuild');
  card.update(chModel([chStep('one', { choice: 'c', attempts: 2, correct: true, feedback: { kind: 'success', text: 'yes' } })]));
  assert.deepEqual(buttons.map((b) => b.disabled), [true, true, true], 'a solved step is locked');
  assert.deepEqual(buttons.map((b) => b.getAttribute('aria-pressed')), ['false', 'false', 'true'], 'the right choice is the one pressed');
  assert.equal(body.querySelector('[data-challenge-step]').dataset.solved, 'true');
});

test('ChallengeCard: the next step appears when it unlocks, earlier steps keep their buttons, a new challenge starts clean', () => {
  const { card, body } = mountChallenge();
  card.update(chModel([chStep('one'), chStep('two', { unlocked: false })]));
  const first = [...body.querySelectorAll('[data-challenge-step="one"] button')];
  card.update(chModel([chStep('one', { choice: 'a', attempts: 1, correct: true }), chStep('two')]));
  assert.deepEqual([...body.querySelectorAll('[data-challenge-step]')].map((e) => e.dataset.challengeStep), ['one', 'two']);
  assert.deepEqual([...body.querySelectorAll('[data-challenge-step="one"] button')], first, 'the solved step is not redrawn');
  card.update(chModel([chStep('x1')], { id: 2, title: 'Challenge 2', scenario: 'next' }));
  assert.deepEqual([...body.querySelectorAll('[data-challenge-step]')].map((e) => e.dataset.challengeStep), ['x1']);
  assert.equal(body.querySelector('.sg-scenario').textContent, 'next');
});

test('ChallengeCard note is optional, buffered, flushed on blur, and never overwrites typing', async () => {
  const { dom, doc, card, body, calls } = mountChallenge();
  card.update(chModel([chStep('one', { correct: true })]));
  assert.equal(body.querySelector('[data-note]').hidden, true, 'no note unless supplied');
  const model = (text) => chModel([chStep('one', { correct: true })], { note: { label: 'your words', placeholder: 'write', text } });
  card.update(model('saved'));
  const note = body.querySelector('#x-ch-note-input');
  assert.equal(body.querySelector('[data-note]').hidden, false);
  assert.equal(body.querySelector('label[for="x-ch-note-input"]').textContent, 'your words');
  assert.equal(note.getAttribute('placeholder'), 'write');
  assert.equal(note.value, 'saved');
  type(dom, note, 'n'); type(dom, note, 'ne'); type(dom, note, 'new');
  assert.deepEqual(calls.draft, [], 'debounced');
  card.update(model('OLD'));
  assert.equal(note.value, 'new', 'a pending note is not overwritten');
  await wait(60);
  assert.deepEqual(calls.draft, ['new'], 'only the last text');
  type(dom, note, 'blurred'); note.dispatchEvent(new dom.window.Event('blur'));
  assert.deepEqual(calls.flush, ['blurred']);
  type(dom, note, 'explicit'); card.flushNote();
  assert.deepEqual(calls.flush, ['blurred', 'explicit']);
  card.update(model('FROM-MODEL'));
  assert.equal(note.value, 'FROM-MODEL', 'an idle note follows the model');
  assert.equal(doc.querySelectorAll('[aria-live], [role=status]').length, 0);
});

test('ChallengeCard fixtures for both stations carry no answer key and the module judges nothing', () => {
  const optics = chModel([chStep('adjust', { options: [{ value: 'candle', label: 'candle' }, { value: 'screen', label: 'screen' }], feedback: 'plain string' })], { title: 'Challenge 1 of 3' });
  const buoyancy = chModel([chStep('c1-outcome', { feedback: { kind: 'hint', text: 'think about density' } })], { id: 'c1' });
  const { card, body } = mountChallenge();
  for (const model of [optics, buoyancy]) {
    for (const bad of ['correctAnswer', 'answerKey', 'expectedAnswer']) assert.ok(!deepKeys(model).has(bad), bad);
    card.update(model);
  }
  const src = fs.readFileSync(path.join(rootDir, 'assets/science-guided/components.js'), 'utf8');
  const chunk = src.slice(src.indexOf('export function createChallengeCard'));
  assert.ok(!/correctAnswer|answerKey|expectedAnswer|attempts\s*[<>]|HINT/.test(chunk), 'no correctness or hint-timing logic in the shared card');
  assert.ok(body.querySelector('[data-challenge-step]'));
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
  assert.match(optics, /renderCompletionCard/);
  assert.match(optics, /renderCompareCard/);
  assert.match(optics, /createNotebook/);
  assert.match(buoyancy, /createNotebook/);
  assert.ok(!/export function createNotebook\b/.test(cards), 'Buoyancy cards.js no longer owns the notebook');
  assert.ok(!/function buildNotebook\b|function syncNotebook\b|const nb = \{\}|og-nb-rows/.test(optics + opticsPage), 'Optics keeps no local notebook renderer');
  assert.match(optics, /createChallengeCard/);
  assert.match(buoyancy, /createChallengeCard/);
  assert.ok(!/export function renderChallenge\b/.test(cards), 'Buoyancy cards.js no longer owns the challenge card');
  assert.ok(!/function buildChallenge\b|function syncChallenge\b|radioPill|const ch = \{\}|og-ch-steps|og-ch-scenario/.test(optics + opticsPage), 'Optics keeps no local challenge renderer and no radio challenge');
  assert.match(optics, /renderConceptReveal/);
  assert.match(buoyancy, /renderConceptReveal/);
  assert.ok(!/export function renderConcept\b/.test(cards), 'Buoyancy cards.js no longer owns renderConcept');
  assert.ok(!/function renderConcept\b|og-concept-cards|id="og-formula"|negativeNote/.test(optics + opticsPage), 'Optics keeps no local concept renderer');
  assert.match(buoyancy, /renderCompareCard/);
  assert.ok(!/export function renderCompare\b|function buildCompare\b|function structureOf\b|function buildEvidenceTable\b/.test(cards), 'Buoyancy cards.js no longer owns the compare card');
  assert.ok(!/function renderCompare\b|og-compare-rows|og-compare-notice|og-questions/.test(optics + opticsPage), 'Optics keeps no local compare renderer');
  assert.match(buoyancy, /renderCompletionCard/);
  assert.ok(!/export function renderCompletion\b/.test(cards), 'Buoyancy cards.js no longer owns renderCompletion');
  assert.ok(!/function renderRecords|function renderComplete\b|og-complete-lines|og-records-wrap/.test(optics), 'Optics keeps no duplicate records/complete renderer');
  assert.ok(!/class="og-link-button"/.test(opticsPage), 'the completion link is drawn by the shared module');
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
