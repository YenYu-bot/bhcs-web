import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createActionBar, createAnnouncer, focusHandoff } from '../assets/science-guided/components.js';

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

test('both pilot stations use the shared ActionBar; buoyancy also uses shared announcer and focus handoff', () => {
  const optics = fs.readFileSync(path.join(rootDir, 'assets/optics-guided/main.js'), 'utf8');
  const buoyancy = fs.readFileSync(path.join(rootDir, 'assets/buoyancy-guided/main.js'), 'utf8');
  assert.match(optics, /from '\.\.\/science-guided\/components\.js'/);
  assert.match(optics, /createActionBar/);
  assert.match(buoyancy, /from '\.\.\/science-guided\/components\.js'/);
  for (const name of ['createActionBar', 'createAnnouncer', 'focusHandoff']) assert.match(buoyancy, new RegExp(name));
  const cards = fs.readFileSync(path.join(rootDir, 'assets/buoyancy-guided/cards.js'), 'utf8');
  const input = fs.readFileSync(path.join(rootDir, 'assets/buoyancy-guided/input.js'), 'utf8');
  assert.ok(!/export function createAnnouncer/.test(cards));
  assert.ok(!/export function focusHandoff/.test(input));
});

test('shared CSS contains only the approved behavior utilities in this batch', () => {
  const css = fs.readFileSync(path.join(rootDir, 'assets/science-guided/science-guided.css'), 'utf8');
  for (const cls of ['.sg-sr', '.sg-direct-manipulation', '.sg-scroll-surface']) assert.ok(css.includes(cls));
  assert.match(css, /\.sg-direct-manipulation\s*\{\s*touch-action:\s*none;/);
  assert.match(css, /\.sg-scroll-surface\s*\{\s*touch-action:\s*pan-y;/);
  assert.ok(!/\.(?:og|bg)-/.test(css), 'shared CSS contains no station-specific selectors');
});

test('shared behavior module contains no science-specific decisions', () => {
  const src = fs.readFileSync(path.join(rootDir, 'assets/science-guided/components.js'), 'utf8');
  for (const bad of ['density', 'magnification', 'focal', 'ballast', 'virtual image', 'localStorage', 'bhcsScienceTrack']) {
    assert.ok(!src.toLowerCase().includes(bad.toLowerCase()), bad);
  }
});

for (const [name, fn] of tests) {
  await fn();
  console.log('PASS', name);
}
console.log('PASS science guided shared foundation: ' + tests.length + ' tests');
