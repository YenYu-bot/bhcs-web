import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { fixedTrialObservation } from '../assets/photosynthesis-guided/model.js';
import * as R from '../assets/photosynthesis-guided/render.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const rootPath = fileURLToPath(new URL('..', import.meta.url));

function mount(model) {
  const dom = new JSDOM('<!doctype html><body><main id="host"></main></body>', { pretendToBeVisual: true });
  const host = dom.window.document.getElementById('host');
  const bench = R.createPhotosynthesisBench(host);
  bench.update(model);
  return { dom, host, bench, document: dom.window.document };
}

const base = (overrides = {}) => ({
  light: 15,
  co2: 1000,
  temperature: 25,
  locked: false,
  allowedLights: [15, 60, 100],
  observation: null,
  ...overrides,
});

test('constants define the discrete Guided bench contract', () => {
  assert.deepEqual([...R.LIGHT_LEVELS], [15, 60, 100]);
  assert.equal(R.BENCH_VIEWBOX.width, 640);
  assert.equal(R.BENCH_VIEWBOX.height, 360);
  assert.equal(R.MAX_BUBBLES, 20);
});

test('bench builds one scene, condition cards and three native light buttons', () => {
  const t = mount(base());
  assert.equal(t.host.querySelectorAll('[data-role="photosynthesis-bench"]').length, 1);
  assert.equal(t.host.querySelectorAll('[data-role="scene"]').length, 1);
  assert.equal(t.host.querySelectorAll('[data-light-value]').length, 3);
  assert.deepEqual([...t.host.querySelectorAll('[data-light-value]')].map((b) => Number(b.dataset.lightValue)), [15, 60, 100]);
  assert.ok([...t.host.querySelectorAll('[data-light-value]')].every((b) => b.tagName === 'BUTTON'));
  assert.equal(t.host.querySelector('[data-role="change-value"]').textContent, '光照');
});

test('update shows supplied conditions and preserves focus because DOM is patched in place', () => {
  const t = mount(base());
  const b60 = t.host.querySelector('[data-light-value="60"]');
  b60.focus();
  assert.equal(t.document.activeElement, b60);
  t.bench.update(base({ light: 60, allowedLights: [60, 100] }));
  assert.equal(t.document.activeElement, b60);
  assert.equal(t.host.querySelector('[data-role="light-value"]').textContent, '60%');
  assert.equal(t.host.querySelector('[data-role="co2-value"]').textContent, '1000 ppm');
  assert.equal(t.host.querySelector('[data-role="temperature-value"]').textContent, '25°C');
  assert.equal(b60.getAttribute('aria-pressed'), 'true');
  assert.equal(t.host.querySelector('[data-light-value="15"]').disabled, true);
  assert.equal(t.host.querySelector('[data-light-value="100"]').disabled, false);
});

test('locked bench disables every light choice without removing them', () => {
  const t = mount(base({ locked: true }));
  for (const b of t.host.querySelectorAll('[data-light-value]')) assert.equal(b.disabled, true);
  assert.equal(t.bench.element.dataset.locked, 'true');
  t.bench.update(base({ locked: false, allowedLights: [60] }));
  assert.equal(t.host.querySelector('[data-light-value="60"]').disabled, false);
  assert.equal(t.host.querySelector('[data-light-value="15"]').disabled, true);
  assert.equal(t.host.querySelector('[data-light-value="100"]').disabled, true);
});

test('no observation means no active bubbles and an explicit waiting message', () => {
  const t = mount(base());
  assert.equal(t.bench.element.dataset.bubbleCount, '0');
  assert.equal(t.host.querySelectorAll('.pg-bubble:not([hidden])').length, 0);
  assert.match(t.host.querySelector('[data-role="observation"]').textContent, /開始觀察/);
  assert.match(t.host.querySelector('[data-role="scene"]').getAttribute('aria-label'), /尚未觀察/);
});

test('settled observation maps relative rate to a capped visual bubble count and readable evidence', () => {
  const a = fixedTrialObservation('t1-low-light');
  const t = mount(base({ observation: { rate: a.rate } }));
  assert.equal(t.bench.element.dataset.bubbleCount, String(Math.round(a.rate)));
  assert.equal(t.host.querySelectorAll('.pg-bubble:not([hidden])').length, Math.round(a.rate));
  assert.equal(t.host.querySelector('[data-role="observation"]').textContent, '相對產氧速度 ' + a.rate.toFixed(1));
  assert.match(t.host.querySelector('[data-role="scene"]').getAttribute('aria-label'), new RegExp(a.rate.toFixed(1).replace('.', '\\.')));
  t.bench.update(base({ observation: { rate: 999 } }));
  assert.equal(t.host.querySelectorAll('.pg-bubble:not([hidden])').length, R.MAX_BUBBLES);
});

test('renderer ignores derived answer fields instead of leaking them into the bench', () => {
  const obs = fixedTrialObservation('t2-high-light');
  const t = mount(base({
    light: 100,
    co2: 150,
    observation: { rate: obs.rate, limit: 'co2', factors: obs.factors, correct: true, answerKey: 'co2' },
  }));
  const text = t.bench.element.textContent;
  assert.doesNotMatch(text, /限制因子|最低因子|factor|answerKey|correct/i);
  assert.match(text, /CO₂/);
  assert.match(text, /相對產氧速度/);
});

test('conditions change cleanly between the two Guided comparison contexts', () => {
  const t = mount(base({ light: 60, co2: 1000, observation: { rate: fixedTrialObservation('t1-higher-light').rate } }));
  assert.equal(t.host.querySelector('[data-role="co2-value"]').textContent, '1000 ppm');
  t.bench.update(base({ light: 60, co2: 150, observation: { rate: fixedTrialObservation('t2-medium-light').rate } }));
  assert.equal(t.host.querySelector('[data-role="co2-value"]').textContent, '150 ppm');
  assert.equal(t.host.querySelector('[data-role="light-value"]').textContent, '60%');
});

test('two benches have independent SVG ids', () => {
  const dom = new JSDOM('<!doctype html><body><div id="a"></div><div id="b"></div></body>');
  const a = R.createPhotosynthesisBench(dom.window.document.getElementById('a'));
  const b = R.createPhotosynthesisBench(dom.window.document.getElementById('b'));
  assert.notEqual(a.uid, b.uid);
  const ida = a.element.querySelector('linearGradient').id;
  const idb = b.element.querySelector('linearGradient').id;
  assert.notEqual(ida, idb);
  assert.equal(a.element.querySelector('[data-role="beam"]').getAttribute('fill'), 'url(#' + ida + ')');
  assert.equal(b.element.querySelector('[data-role="beam"]').getAttribute('fill'), 'url(#' + idb + ')');
});

test('invalid presentation models fail loudly', () => {
  const dom = new JSDOM('<!doctype html><body><main id="host"></main></body>');
  const bench = R.createPhotosynthesisBench(dom.window.document.getElementById('host'));
  for (const bad of [
    null,
    {},
    base({ light: 50 }),
    base({ co2: NaN }),
    base({ temperature: Infinity }),
    base({ allowedLights: [15, 50] }),
    base({ allowedLights: [15, 15] }),
    base({ observation: { rate: -1 } }),
  ]) assert.throws(() => bench.update(bad));
});

test('destroy removes exactly this bench', () => {
  const t = mount(base());
  assert.equal(t.host.children.length, 1);
  t.bench.destroy();
  assert.equal(t.host.children.length, 0);
});

test('bench CSS supplies desktop/mobile hit sizes, reduced motion and forced-colors support', () => {
  const css = fs.readFileSync(rootPath + 'assets/photosynthesis-guided/photosynthesis-guided.css', 'utf8');
  assert.match(css, /\.pg-light-button\s*\{[\s\S]*?min-height:\s*48px/);
  assert.match(css, /@media\(max-width:600px\)[\s\S]*?\.pg-light-button\s*\{[\s\S]*?min-height:\s*64px/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /@media\(forced-colors:active\)/);
  assert.match(css, /touch-action:\s*manipulation/);
});

test('static guards: renderer does not import science, state, storage or analytics', () => {
  const src = fs.readFileSync(rootPath + 'assets/photosynthesis-guided/render.js', 'utf8');
  assert.ok(!/^\s*import\s/m.test(src), 'renderer is standalone');
  for (const word of ['calculatePhotosynthesis', 'lightFactor(', 'co2Factor(', 'temperatureFactor(', 'reduce(', 'localStorage', 'sessionStorage', 'bhcsScienceTrack', 'gtag', 'fetch(']) {
    assert.ok(!src.includes(word), word);
  }
  assert.doesNotMatch(src, /限制因子|最低因子|correct answer|answer key/i);
});

console.log('photosynthesis-guided render: ' + tests + ' tests passed');
