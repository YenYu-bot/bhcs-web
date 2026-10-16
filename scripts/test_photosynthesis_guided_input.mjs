import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createPhotosynthesisBench } from '../assets/photosynthesis-guided/render.js';
import { bindPhotosynthesisInput, LIGHT_VALUES } from '../assets/photosynthesis-guided/input.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const rootPath = fileURLToPath(new URL('..', import.meta.url));

function setup({ light = 15, locked = false, allowedLights = [15, 60, 100], canSetLight = () => true } = {}) {
  const dom = new JSDOM('<!doctype html><body><main id="host"></main><button id="outside">outside</button></body>', { pretendToBeVisual: true });
  const host = dom.window.document.getElementById('host');
  const bench = createPhotosynthesisBench(host);
  const state = { light, locked, allowedLights: [...allowedLights], co2: 1000, temperature: 25, observation: null };
  bench.update(state);
  const log = [];
  const input = bindPhotosynthesisInput({
    root: bench.element,
    getLocked: () => state.locked,
    canSetLight,
    onSetLight: (value) => {
      log.push(value);
      state.light = value;
      bench.update(state);
    },
  });
  const button = (value) => host.querySelector('[data-light-value="' + value + '"]');
  const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const key = (el, value) => {
    const e = new dom.window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true });
    el.dispatchEvent(e);
    return e;
  };
  return { dom, host, bench, state, log, input, button, click, key };
}

test('input contract exposes only the three discrete Guided light values', () => {
  assert.deepEqual([...LIGHT_VALUES], [15, 60, 100]);
  assert.equal(Object.isFrozen(LIGHT_VALUES), true);
});

test('mouse/touch-equivalent native click sends one numeric light value', () => {
  const t = setup();
  t.click(t.button(60));
  assert.deepEqual(t.log, [60]);
  assert.equal(t.state.light, 60);
  assert.equal(t.button(60).getAttribute('aria-pressed'), 'true');
  t.click(t.button(100));
  assert.deepEqual(t.log, [60, 100]);
  assert.equal(t.state.light, 100);
});

test('locked bench and disabled buttons do not send actions', () => {
  const t = setup({ locked: true });
  t.click(t.button(60));
  assert.deepEqual(t.log, []);
  t.state.locked = false;
  t.state.allowedLights = [60];
  t.bench.update(t.state);
  assert.equal(t.button(15).disabled, true);
  t.click(t.button(15));
  assert.deepEqual(t.log, []);
  t.click(t.button(60));
  assert.deepEqual(t.log, [60]);
});

test('caller gate is rechecked on every click', () => {
  let allow = false;
  const t = setup({ canSetLight: (v) => allow && v === 60 });
  t.click(t.button(60));
  assert.deepEqual(t.log, []);
  allow = true;
  t.click(t.button(100));
  assert.deepEqual(t.log, []);
  t.click(t.button(60));
  assert.deepEqual(t.log, [60]);
});

test('ArrowRight and ArrowUp move to the next enabled choice, focus it and send through the same path', () => {
  const t = setup({ allowedLights: [15, 60, 100] });
  t.button(15).focus();
  let e = t.key(t.button(15), 'ArrowRight');
  assert.equal(e.defaultPrevented, true);
  assert.deepEqual(t.log, [60]);
  assert.equal(t.dom.window.document.activeElement, t.button(60));
  e = t.key(t.button(60), 'ArrowUp');
  assert.equal(e.defaultPrevented, true);
  assert.deepEqual(t.log, [60, 100]);
  assert.equal(t.dom.window.document.activeElement, t.button(100));
});

test('ArrowLeft and ArrowDown move to the previous enabled choice', () => {
  const t = setup({ light: 100 });
  t.button(100).focus();
  let e = t.key(t.button(100), 'ArrowLeft');
  assert.equal(e.defaultPrevented, true);
  assert.deepEqual(t.log, [60]);
  e = t.key(t.button(60), 'ArrowDown');
  assert.equal(e.defaultPrevented, true);
  assert.deepEqual(t.log, [60, 15]);
});

test('arrow navigation skips disabled choices', () => {
  const t = setup({ light: 15, allowedLights: [15, 100] });
  t.button(15).focus();
  const e = t.key(t.button(15), 'ArrowRight');
  assert.equal(e.defaultPrevented, true);
  assert.deepEqual(t.log, [100]);
  assert.equal(t.dom.window.document.activeElement, t.button(100));
});

test('Home and End go to the first and last enabled choice', () => {
  const t = setup({ allowedLights: [15, 60, 100] });
  t.button(60).focus();
  t.key(t.button(60), 'End');
  assert.deepEqual(t.log, [100]);
  assert.equal(t.dom.window.document.activeElement, t.button(100));
  t.key(t.button(100), 'Home');
  assert.deepEqual(t.log, [100, 15]);
  assert.equal(t.dom.window.document.activeElement, t.button(15));
});

test('at an edge, an arrow keeps focus/value stable and still prevents page scroll', () => {
  const t = setup({ light: 15 });
  t.button(15).focus();
  const e = t.key(t.button(15), 'ArrowLeft');
  assert.equal(e.defaultPrevented, true);
  assert.deepEqual(t.log, [15]);
  assert.equal(t.dom.window.document.activeElement, t.button(15));
});

test('unrelated keys and controls outside the bench are untouched', () => {
  const t = setup();
  const outside = t.dom.window.document.getElementById('outside');
  let e = t.key(t.button(15), 'PageDown');
  assert.equal(e.defaultPrevented, false);
  assert.deepEqual(t.log, []);
  e = t.key(outside, 'ArrowRight');
  assert.equal(e.defaultPrevented, false);
  assert.deepEqual(t.log, []);
});

test('disabled light button key events are ignored and not swallowed', () => {
  const t = setup({ allowedLights: [60] });
  const disabled = t.button(15);
  const e = t.key(disabled, 'ArrowRight');
  assert.equal(e.defaultPrevented, false);
  assert.deepEqual(t.log, []);
});

test('destroy removes both click and keyboard behaviour', () => {
  const t = setup();
  t.input.destroy();
  t.click(t.button(60));
  t.key(t.button(15), 'ArrowRight');
  assert.deepEqual(t.log, []);
  t.input.destroy();
});

test('static guards: input has no science model, engine, wording, storage or globals', () => {
  const src = fs.readFileSync(rootPath + 'assets/photosynthesis-guided/input.js', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/^\s*import\s/m.test(src), 'input is standalone');
  assert.ok(!/calculatePhotosynthesis|lightFactor|co2Factor|temperatureFactor|\brate\b|\blimit\b|\bfactor/.test(src), 'no physics');
  assert.ok(!/localStorage|sessionStorage|fetch\(|XMLHttpRequest|bhcsScienceTrack|gtag/.test(src), 'no storage/network/analytics');
  assert.ok(!/\bwindow\b|\bdocument\b/.test(src), 'input reaches DOM only through root/event targets');
  assert.doesNotMatch(src, /[\u4e00-\u9fff]/, 'no learner wording');
});

console.log('photosynthesis-guided input: ' + tests + ' tests passed');
