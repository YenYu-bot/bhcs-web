// B3 gate (jsdom part): the guided buoyancy input layer (assets/buoyancy-guided/input.js) against the real page skeleton.
// Real-browser behaviour (touch, layout, focus in a live page) is checked by check_buoyancy_guided_input_browser.cjs.
// Run on its own: node scripts/test_buoyancy_guided_input.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createInitialState, reduce, deriveView } from '../assets/buoyancy-guided/engine.js';
import { DRAG_SLOP_PX, MOBILE_MAX_WIDTH, HIT_MIN_PX, hitMinFor, pointInRect, isLocked, isUsable, objectAction, toolAction, syncControls, focusHandoff, createInputController } from '../assets/buoyancy-guided/input.js';

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const HTML = fs.readFileSync(here('../tools/science/buoyancy-guided.html'), 'utf8');
let tests = 0;
const test = async (name, fn) => { await fn(); tests++; console.log('PASS', name); };

const TANK = { left: 100, top: 100, right: 300, bottom: 260 };
const IN = { x: 200, y: 180 }, OUT = { x: 500, y: 400 };

function setup() {
  const dom = new JSDOM(HTML, { pretendToBeVisual: true });
  const { document } = dom.window;
  document.getElementById('bg-bench-card').hidden = false;   // main.js shows the bench from the mission on
  const root = document.getElementById('bg-bench');
  const t = { dom, document, root, state: createInitialState(), log: [], invalid: [], blocked: [], drags: [] };
  t.view = () => deriveView(t.state);
  t.sync = () => syncControls(root, t.view());
  t.dispatch = (a) => { t.log.push(a); const r = reduce(t.state, a); t.state = r.state; t.sync(); return r; };
  t.play = (...actions) => { for (const a of actions) { const r = reduce(t.state, a); assert.equal(r.accepted, true, `${JSON.stringify(a)} (${r.reason})`); t.state = r.state; } t.sync(); t.log.length = 0; };
  t.ctl = createInputController({ root, getView: t.view, dispatch: t.dispatch, getTankRect: () => TANK,
    onInvalidDrop: (e) => t.invalid.push(e), onBlocked: (e) => t.blocked.push(e), onDrag: (e) => t.drags.push(e) });
  t.$ = (sel) => root.querySelector(sel);
  t.obj = (id) => root.querySelector(`[data-bg-object="${id}"]`);
  t.tool = (name, forId) => root.querySelector(`[data-bg-action="${name}"]${forId ? `[data-bg-for="${forId}"]` : ''}`);
  t.ptr = (type, el, { x = 0, y = 0, pointerId = 1, button = 0 } = {}) => {
    const ev = new dom.window.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button });
    Object.defineProperty(ev, 'pointerId', { value: pointerId });
    el.dispatchEvent(ev);
    return ev;
  };
  t.click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  t.tick = () => new Promise((r) => dom.window.setTimeout(r, 5));
  t.drag = (el, from, to, { steps = 4, pointerId = 1 } = {}) => {
    t.ptr('pointerdown', el, { ...from, pointerId });
    for (let i = 1; i <= steps; i++) t.ptr('pointermove', el, { x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps, pointerId });
    t.ptr('pointerup', el, { ...to, pointerId });
  };
  t.sync();
  return t;
}
const START = { type: 'START' }, BEGIN = { type: 'BEGIN' }, ADD = { type: 'ADD_BALLAST' }, PUT = { type: 'PUT_IN', objectId: 'block' }, OUT_ = { type: 'TAKE_OUT' };

// a trial-1 bench, trial 2 waiting for the liquid, and trial 3 with wood and stone
const atTrial1 = () => { const t = setup(); t.play(START, BEGIN); return t; };
const atSwitch = () => { const t = atTrial1(); t.play(ADD, ADD, PUT, { type: 'RECORD_TRIAL', trial: 1 }); return t; };
const atTrial3 = () => {
  const t = atSwitch();
  t.play({ type: 'SELECT_LIQUID', liquidId: 'brine' }, PUT, OUT_, ADD, PUT, { type: 'RECORD_TRIAL', trial: 2 }, { type: 'CONTINUE' },
    { type: 'ANSWER_COMPARE', question: 'stayMass', answer: 'larger' }, { type: 'ANSWER_COMPARE', question: 'firstDrop', answer: 'float' }, { type: 'CONTINUE' });
  return t;
};

await test('constants: the drag slop, the phone breakpoint and the hit sizes', () => {
  assert.equal(DRAG_SLOP_PX, 3);
  assert.equal(MOBILE_MAX_WIDTH, 767);
  assert.deepEqual({ ...HIT_MIN_PX }, { desktop: 48, mobile: 64 });
  assert.equal(hitMinFor(767), 64);
  assert.equal(hitMinFor(390), 64);
  assert.equal(hitMinFor(768), 48);
  assert.equal(hitMinFor(1280), 48);
  assert.ok(Object.isFrozen(HIT_MIN_PX));
  assert.equal(pointInRect(200, 180, TANK), true);
  assert.equal(pointInRect(100, 100, TANK), true);
  assert.equal(pointInRect(99, 180, TANK), false);
  assert.equal(pointInRect(200, 261, TANK), false);
  assert.equal(pointInRect(1, 1, null), false);
});

await test('actions: what an object or a tool does comes from the engine view', () => {
  const t = atTrial1();
  assert.deepEqual(objectAction('block', t.view()), PUT);
  assert.equal(objectAction('wood', t.view()), null, 'wood is not on the bench in trial 1');
  assert.equal(objectAction('nope', t.view()), null);
  assert.deepEqual(toolAction('add-ballast', null, t.view()), ADD);
  assert.deepEqual(toolAction('remove-ballast', null, t.view()), { type: 'REMOVE_BALLAST' });
  assert.deepEqual(toolAction('put-in', 'block', t.view()), PUT);
  assert.equal(toolAction('put-in', 'wood', t.view()), null);
  assert.equal(toolAction('take-out', null, t.view()), null, 'nothing in the tank');
  assert.equal(toolAction('fly', null, t.view()), null);
  t.play(PUT);
  assert.deepEqual(objectAction('block', t.view()), OUT_);
  assert.deepEqual(toolAction('take-out', null, t.view()), OUT_);
  assert.equal(toolAction('add-ballast', null, t.view()), null, 'ballast is locked while the block is in the tank');
  assert.equal(toolAction('put-in', 'block', t.view()), null);
  const sw = atSwitch();
  assert.equal(objectAction('block', sw.view()), null, 'trial 2 waits for the liquid');
  sw.play({ type: 'SELECT_LIQUID', liquidId: 'brine' });
  assert.deepEqual(objectAction('block', sw.view()), PUT);
  assert.equal(toolAction('add-ballast', null, sw.view()), null, 'the block keeps its ballast until the first drop');
  assert.equal(objectAction('block', setup().view()), null, 'nothing is on the bench before the mission');
});

await test('sync: availability, lock state, pressed state and touch behaviour follow the view', () => {
  const t = atTrial1();
  const block = t.obj('block');
  assert.equal(block.hidden, false);
  assert.equal(t.obj('wood').hidden, true);
  assert.equal(t.obj('stone').hidden, true);
  assert.equal(block.dataset.locked, 'false');
  assert.equal(block.hasAttribute('aria-disabled'), false);
  assert.equal(block.getAttribute('aria-pressed'), 'false');
  assert.ok(block.classList.contains('bg-direct-manipulation') && !block.classList.contains('bg-scroll-surface'));
  assert.equal(t.tool('put-in', 'block').hidden, false);
  assert.equal(t.tool('put-in', 'wood').hidden, true);
  assert.equal(t.tool('add-ballast').hidden, false);
  assert.equal(t.tool('take-out').dataset.locked, 'true', 'nothing to take out yet');
  assert.equal(t.$('input[value="water"]').checked, true);
  assert.equal(t.$('input[value="brine"]').disabled, true, 'the liquid is fixed in trial 1');
  assert.equal(t.$('[data-bg-tank]').dataset.object, '');
  t.play(PUT);
  assert.equal(block.getAttribute('aria-pressed'), 'true');
  assert.equal(block.dataset.where, 'tank');
  assert.equal(block.dataset.locked, 'false', 'a block in the tank can be taken out');
  assert.equal(t.$('[data-bg-tank]').dataset.object, 'block');
  for (const name of ['add-ballast', 'remove-ballast']) {
    assert.equal(t.tool(name).dataset.locked, 'true');
    assert.equal(t.tool(name).getAttribute('aria-disabled'), 'true');
    assert.equal(isLocked(t.tool(name)), true);
  }
  assert.equal(t.tool('take-out').dataset.locked, 'false');
  const sw = atSwitch();
  assert.equal(sw.obj('block').dataset.locked, 'true');
  assert.ok(sw.obj('block').classList.contains('bg-scroll-surface') && !sw.obj('block').classList.contains('bg-direct-manipulation'), 'a locked object leaves touch to the page');
  assert.equal(sw.$('input[value="brine"]').disabled, false);
  const t3 = atTrial3();
  assert.equal(t3.obj('block').hidden, true);
  assert.equal(t3.obj('wood').hidden, false);
  assert.equal(t3.obj('stone').hidden, false);
  assert.equal(t3.tool('add-ballast').hidden, true);
  assert.equal(t3.tool('put-in', 'wood').hidden, false);
  assert.equal(t3.root.querySelector('[data-bg-liquid-group]').hidden, true);
  assert.equal(t3.obj('wood').dataset.locked, 'false');
  t3.play({ type: 'PUT_IN', objectId: 'wood' });
  assert.equal(t3.obj('stone').dataset.locked, 'true', 'the tank holds one object at a time');
  assert.equal(t3.tool('put-in', 'stone').dataset.locked, 'true');
});

await test('click on an object puts it in and takes it out', async () => {
  const t = atTrial1();
  t.click(t.obj('block'));
  assert.deepEqual(t.log, [PUT]);
  assert.equal(t.state.tank.objectId, 'block');
  t.click(t.obj('block'));
  assert.deepEqual(t.log, [PUT, OUT_]);
  assert.equal(t.state.tank.objectId, null);
  assert.deepEqual(t.blocked, []);
});

await test('tool buttons: put in, take out, add and remove ballast', () => {
  const t = atTrial1();
  t.click(t.tool('add-ballast'));
  assert.equal(t.state.slots, 2);
  t.click(t.tool('remove-ballast'));
  assert.equal(t.state.slots, 1);
  t.click(t.tool('put-in', 'block'));
  assert.equal(t.state.tank.objectId, 'block');
  t.click(t.tool('take-out'));
  assert.equal(t.state.tank.objectId, null);
  assert.deepEqual(t.log.map((a) => a.type), ['ADD_BALLAST', 'REMOVE_BALLAST', 'PUT_IN', 'TAKE_OUT']);
  assert.deepEqual(t.blocked, []);
});

await test('locked controls do nothing and say so through onBlocked', () => {
  const t = atTrial1();
  t.play(PUT);
  t.click(t.tool('add-ballast'));
  t.click(t.tool('remove-ballast'));
  t.click(t.tool('put-in', 'block'));
  assert.deepEqual(t.log, []);
  assert.equal(t.state.slots, 1);
  assert.deepEqual(t.blocked.map((b) => b.control), ['add-ballast', 'remove-ballast', 'put-in']);
  const sw = atSwitch();
  sw.click(sw.obj('block'));
  assert.deepEqual(sw.log, []);
  assert.deepEqual(sw.blocked, [{ control: 'object', objectId: 'block' }]);
  sw.click(sw.tool('add-ballast'));
  assert.deepEqual(sw.log, []);
});

await test('liquid radios send SELECT_LIQUID, and only when the choice is made', () => {
  const t = atSwitch();
  const brine = t.$('input[value="brine"]');
  brine.checked = true;
  brine.dispatchEvent(new t.dom.window.Event('change', { bubbles: true }));
  assert.deepEqual(t.log, [{ type: 'SELECT_LIQUID', liquidId: 'brine' }]);
  assert.equal(t.state.liquidId, 'brine');
  const water = t.$('input[value="water"]');
  water.checked = false;
  water.dispatchEvent(new t.dom.window.Event('change', { bubbles: true }));
  assert.equal(t.log.length, 1, 'an unchecked radio sends nothing');
});

await test('drag: a block let go over the tank goes in, once, and the click that ends the drag is not a second tap', async () => {
  const t = atTrial1();
  const block = t.obj('block');
  t.drag(block, { x: 400, y: 400 }, IN);
  assert.deepEqual(t.log, [PUT]);
  assert.equal(t.state.tank.objectId, 'block');
  t.click(block);                       // the click a browser sends after the pointer lifts
  assert.deepEqual(t.log, [PUT], 'swallowed');
  await t.tick();
  t.click(block);                       // a later, real tap
  assert.deepEqual(t.log, [PUT, OUT_]);
  assert.equal(block.dataset.dragging, undefined);
  assert.ok(t.drags.some((d) => d.dragging && d.overTank === true), 'the picture is told when the pointer is over the tank');
  assert.equal(t.drags.at(-1).dragging, false);
});

await test('drag: out of the tank takes it out; let go in the tank again does nothing', () => {
  const t = atTrial1();
  t.play(PUT);
  t.drag(t.obj('block'), IN, { x: 150, y: 150 });
  assert.deepEqual(t.log, [], 'dropped back inside the tank');
  assert.equal(t.state.tank.objectId, 'block');
  t.drag(t.obj('block'), IN, OUT);
  assert.deepEqual(t.log, [OUT_]);
  assert.equal(t.state.tank.objectId, null);
  assert.deepEqual(t.invalid, []);
});

await test('invalid drop: let go outside the tank leaves it on the table and reports it', () => {
  const t = atTrial1();
  t.drag(t.obj('block'), { x: 400, y: 400 }, OUT);
  assert.deepEqual(t.log, []);
  assert.equal(t.state.tank.objectId, null);
  assert.deepEqual(t.invalid, [{ objectId: 'block', reason: 'outside-tank' }]);
});

await test('drag slop: movement of 3 px or less is a tap, more is a drag', async () => {
  const t = atTrial1();
  const block = t.obj('block');
  t.ptr('pointerdown', block, { x: 400, y: 400 });
  t.ptr('pointermove', block, { x: 403, y: 400 });
  t.ptr('pointerup', block, { x: 403, y: 400 });
  assert.deepEqual(t.log, [], 'a pointer that stayed within the slop sends nothing by itself');
  assert.deepEqual(t.drags, []);
  t.click(block);
  assert.deepEqual(t.log, [PUT], 'the tap that follows acts once');
  const t2 = atTrial1();
  t2.ptr('pointerdown', t2.obj('block'), { x: 400, y: 400 });
  t2.ptr('pointermove', t2.obj('block'), { x: 404, y: 400 });
  assert.equal(t2.obj('block').dataset.dragging, 'true');
  t2.ptr('pointerup', t2.obj('block'), { ...OUT });
  assert.equal(t2.obj('block').dataset.dragging, undefined);
});

await test('drag: cancel, a second finger and the wrong mouse button send nothing', () => {
  const t = atTrial1();
  const block = t.obj('block');
  t.ptr('pointerdown', block, { x: 400, y: 400 });
  t.ptr('pointermove', block, { ...IN });
  t.ptr('pointercancel', block, { ...IN });
  assert.deepEqual(t.log, []);
  assert.equal(block.dataset.dragging, undefined);
  t.ptr('pointerdown', block, { x: 400, y: 400, pointerId: 1 });
  t.ptr('pointermove', block, { ...IN, pointerId: 2 });
  t.ptr('pointerup', block, { ...IN, pointerId: 2 });
  assert.deepEqual(t.log, [], 'another pointer cannot finish or move this drag');
  t.ptr('pointerup', block, { ...OUT, pointerId: 1 });
  const t2 = atTrial1();
  t2.ptr('pointerdown', t2.obj('block'), { x: 400, y: 400, button: 2 });
  t2.ptr('pointermove', t2.obj('block'), { ...IN });
  t2.ptr('pointerup', t2.obj('block'), { ...IN });
  assert.deepEqual(t2.log, []);
});

await test('locked and hidden objects cannot be dragged', () => {
  const sw = atSwitch();
  sw.drag(sw.obj('block'), { x: 400, y: 400 }, IN);
  assert.deepEqual(sw.log, []);
  assert.deepEqual(sw.invalid, [], 'a locked object never starts a drag');
  const t3 = atTrial3();
  t3.play({ type: 'PUT_IN', objectId: 'wood' });
  t3.drag(t3.obj('stone'), { x: 400, y: 400 }, IN);
  assert.deepEqual(t3.log, []);
  const t = atTrial1();
  t.obj('block').hidden = true;
  t.drag(t.obj('block'), { x: 400, y: 400 }, IN);
  assert.deepEqual(t.log, []);
});

await test('keys: the layer listens to none, and a key on a locked control is never prevented', () => {
  const sw = atSwitch();
  const block = sw.obj('block');
  const seen = [];
  sw.document.addEventListener('keydown', (e) => seen.push(e.defaultPrevented));
  for (const key of ['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown']) {
    block.dispatchEvent(new sw.dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    sw.tool('add-ballast').dispatchEvent(new sw.dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  }
  assert.equal(seen.length, 12);
  assert.ok(seen.every((p) => p === false));
  assert.deepEqual(sw.log, []);
});

await test('destroy: after it, nothing reacts', () => {
  const t = atTrial1();
  t.ctl.destroy();
  t.click(t.obj('block'));
  t.drag(t.obj('block'), { x: 400, y: 400 }, IN);
  assert.deepEqual(t.log, []);
});

await test('focus: handed over only when focus is left on something that just became unavailable', () => {
  const t = atTrial1();
  const targets = ['[data-bg-object]', '#bg-cta', '#bg-heading'];
  const focusOn = (el) => { el.focus(); assert.equal(t.document.activeElement, el); };
  focusOn(t.tool('add-ballast'));
  assert.equal(focusHandoff({ root: t.document.body, active: t.document.activeElement, targets }), null, 'a usable control keeps focus');
  t.play(PUT);                                              // the ballast buttons lock while the block is in the tank
  assert.equal(isUsable(t.tool('add-ballast')), false);
  const moved = focusHandoff({ root: t.document.body, active: t.document.activeElement, targets });
  assert.equal(moved, t.obj('block'));
  assert.equal(t.document.activeElement, t.obj('block'));
  assert.equal(focusHandoff({ root: t.document.body, active: t.document.activeElement, targets }), null, 'now on a usable control');
  const sw = atSwitch();                                    // the block is locked here, so the next choice is further down
  sw.document.getElementById('bg-heading').tabIndex = -1;
  sw.tool('add-ballast').focus();
  const cta = sw.document.getElementById('bg-cta');
  cta.hidden = false;
  const a = focusHandoff({ root: sw.document.body, active: sw.document.activeElement, targets });
  assert.equal(a, cta, 'locked objects are skipped, the button comes next');
  cta.hidden = true;
  const b = focusHandoff({ root: sw.document.body, active: cta, ctaGone: true, targets });
  assert.equal(b, sw.document.getElementById('bg-heading'));
  assert.equal(focusHandoff({ root: sw.document.body, active: sw.document.body, targets }), null, 'focus on the page itself is left alone');
  assert.equal(focusHandoff({ root: sw.document.body, active: sw.document.body, ctaGone: true, targets: ['#nothing'] }), null);
});

await test('static guards: no key handlers, no preventDefault, no physics, no wording, no globals', () => {
  const code = fs.readFileSync(here('../assets/buoyancy-guided/input.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');
  assert.ok(!/preventDefault|stopPropagation|stopImmediatePropagation/.test(code), 'input.js must never swallow an event');
  assert.ok(!/keydown|keyup|keypress|['"]key['"]|\.key\b/.test(code), 'input.js must not handle keys');
  assert.ok(!/\bwindow\b|\bdocument\b|\blocalStorage\b|\binnerHTML\b/.test(code), 'input.js reaches the page only through the root it is given');
  assert.ok(!/outcomeIn|\bdensity\b|immersion|blockOutcome|objectOutcome|\bmodel\b/.test(code), 'input.js must not decide physics');
  assert.ok(!/^\s*import\s/m.test(code), 'input.js depends on nothing');
  assert.ok(!/[㐀-鿿]/.test(code), 'input.js holds no learner wording');
});

console.log(`\nbuoyancy-guided input: ${tests} tests passed`);
