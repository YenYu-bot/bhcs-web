// B2 gate: acid–base guided bench input (Pilot #4). jsdom, no browser.
// Pointer drag, tube buttons and their shared gate. jsdom has no layout, so element rectangles are set by the rig.
// Keyboard activation of the buttons is the browser's own (Enter / Space on a native <button> fires click); it is
// exercised for real in check_acid_base_guided_input_browser.cjs.
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createAcidBaseBench } from '../assets/acid-base-guided/render.js';
import { bindAcidBaseInput } from '../assets/acid-base-guided/input.js';
import { SAMPLE_IDS } from '../assets/acid-base-guided/model.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };

// Client rectangles: three tube zones side by side above a tray strip.
const ZONE = { A: [0, 100], B: [120, 220], C: [240, 340] };
const rectOf = (l, t, r, b) => ({ left: l, top: t, right: r, bottom: b, width: r - l, height: b - t, x: l, y: t });
const STRIP_RECT = rectOf(130, 400, 210, 440);
const CENTER = { A: { x: 50, y: 150 }, B: { x: 170, y: 150 }, C: { x: 290, y: 150 } };
const START = { x: 170, y: 420 };

function rig({ locked = false, can = () => true, tested = [] } = {}) {
  const dom = new JSDOM('<!doctype html><body><div id="host"></div></body>');
  const w = dom.window, doc = w.document, host = doc.getElementById('host');
  const bench = createAcidBaseBench(host);
  const state = { locked, can, calls: [], captured: new Set(), releases: 0 };
  bench.update({ activeIndicatorId: 'blue-litmus', locked, samples: SAMPLE_IDS.map((sampleId) => ({ sampleId, tested: tested.includes(sampleId), observations: [] })) });
  for (const z of doc.querySelectorAll('[data-drop-sample]')) {
    const [l, r] = ZONE[z.getAttribute('data-drop-sample')];
    z.getBoundingClientRect = () => rectOf(l, 30, r, 300);
  }
  const strip = doc.querySelector('[data-role="strip"]');
  strip.getBoundingClientRect = () => STRIP_RECT;
  strip.setPointerCapture = (id) => state.captured.add(id);
  strip.hasPointerCapture = (id) => state.captured.has(id);
  strip.releasePointerCapture = (id) => { state.captured.delete(id); state.releases++; };
  const input = bindAcidBaseInput({ root: host, getLocked: () => state.locked, canDip: (id) => state.can(id), onDip: (id) => state.calls.push(id) });
  const ptr = (type, props = {}, target = strip) => {
    const e = new w.Event(type, { bubbles: true, cancelable: true });
    Object.assign(e, { pointerId: 1, button: 0, pointerType: 'mouse', clientX: 0, clientY: 0 }, props);
    target.dispatchEvent(e);
    return e;
  };
  const drag = (to, { id = 1, pointerType = 'mouse', from = START } = {}) => {
    ptr('pointerdown', { pointerId: id, pointerType, clientX: from.x, clientY: from.y });
    ptr('pointermove', { pointerId: id, pointerType, clientX: (from.x + to.x) / 2, clientY: (from.y + to.y) / 2 });
    ptr('pointermove', { pointerId: id, pointerType, clientX: to.x, clientY: to.y });
    return ptr('pointerup', { pointerId: id, pointerType, clientX: to.x, clientY: to.y });
  };
  const button = (id) => doc.querySelector(`[data-dip-sample="${id}"]`);
  return { w, doc, host, bench, input, strip, state, ptr, drag, button };
}
const clean = (r) => {
  assert.equal(r.strip.hasAttribute('data-dragging'), false, 'strip still marked as dragging');
  assert.equal(r.strip.style.transform, '', 'strip still moved');
  assert.equal(r.doc.querySelector('[data-role="bench"]').hasAttribute('data-dragging'), false);
  assert.equal(r.doc.querySelectorAll('[data-over]').length, 0, 'a drop zone still highlighted');
  assert.equal(r.state.captured.size, 0, 'pointer still captured');
};

test('drag the strip onto A, B or C: one onDip with that sample id', () => {
  for (const id of SAMPLE_IDS) {
    const r = rig();
    r.drag(CENTER[id]);
    assert.deepEqual(r.state.calls, [id]);
    clean(r);
  }
});

test('pointerdown captures the pointer and marks the drag; nothing is sent until the drop', () => {
  const r = rig();
  const e = r.ptr('pointerdown', { pointerId: 7, clientX: START.x, clientY: START.y });
  assert.ok(r.state.captured.has(7));
  assert.equal(r.strip.getAttribute('data-dragging'), 'true');
  assert.equal(e.defaultPrevented, true);
  assert.deepEqual(r.state.calls, []);
});

test('while dragging the strip follows the pointer 1:1 and the zone under it is highlighted (the same for every tube)', () => {
  const r = rig();
  r.ptr('pointerdown', { clientX: START.x, clientY: START.y });
  r.ptr('pointermove', { clientX: START.x + 30, clientY: START.y - 40 });
  assert.equal(r.strip.style.transform, 'translate(30px, -40px)');
  assert.equal(r.doc.querySelectorAll('[data-over]').length, 0, 'not over a tube yet');
  for (const id of SAMPLE_IDS) {
    r.ptr('pointermove', { clientX: CENTER[id].x, clientY: CENTER[id].y });
    assert.deepEqual([...r.doc.querySelectorAll('[data-over]')].map((z) => [z.getAttribute('data-drop-sample'), z.getAttribute('data-over')]), [[id, 'true']]);
  }
});

test('a drop outside every tube cancels: no callback, the strip goes back', () => {
  const r = rig();
  r.drag({ x: 500, y: 150 });
  r.drag({ x: 170, y: 350 });   // between the tubes and the tray
  assert.deepEqual(r.state.calls, []);
  clean(r);
});

test('pointercancel and lostpointercapture end the drag with no callback and leave nothing behind', () => {
  for (const ending of ['pointercancel', 'lostpointercapture']) {
    const r = rig();
    r.ptr('pointerdown', { clientX: START.x, clientY: START.y });
    r.ptr('pointermove', { clientX: CENTER.B.x, clientY: CENTER.B.y });
    r.ptr(ending, { clientX: CENTER.B.x, clientY: CENTER.B.y });
    clean(r);
    r.ptr('pointerup', { clientX: CENTER.B.x, clientY: CENTER.B.y });
    assert.deepEqual(r.state.calls, [], `${ending}: a later pointerup must not send`);
  }
});

test('one drag, one callback: events after the drop are ignored', () => {
  const r = rig();
  r.drag(CENTER.A);
  r.ptr('pointermove', { clientX: CENTER.B.x, clientY: CENTER.B.y });
  r.ptr('pointerup', { clientX: CENTER.B.x, clientY: CENTER.B.y });
  r.ptr('lostpointercapture');
  assert.deepEqual(r.state.calls, ['A']);
  assert.equal(r.state.releases, 1);
});

test('another pointer cannot finish someone else\'s drag', () => {
  const r = rig();
  r.ptr('pointerdown', { pointerId: 1, clientX: START.x, clientY: START.y });
  r.ptr('pointerup', { pointerId: 2, clientX: CENTER.C.x, clientY: CENTER.C.y });
  assert.deepEqual(r.state.calls, []);
  r.ptr('pointerup', { pointerId: 1, clientX: CENTER.C.x, clientY: CENTER.C.y });
  assert.deepEqual(r.state.calls, ['C']);
});

test('repeated drags do not drift: each drag measures from its own start', () => {
  const r = rig();
  for (let i = 0; i < 5; i++) {
    r.ptr('pointerdown', { clientX: START.x, clientY: START.y });
    r.ptr('pointermove', { clientX: START.x + 10, clientY: START.y + 5 });
    assert.equal(r.strip.style.transform, 'translate(10px, 5px)', `drag ${i + 1}`);
    r.ptr('pointerup', { clientX: 600, clientY: 600 });
    clean(r);
  }
  // a stale transform left by someone else is reset at the next pointerdown, not added to
  r.strip.style.transform = 'translate(99px, 99px)';
  r.ptr('pointerdown', { clientX: START.x, clientY: START.y });
  r.ptr('pointermove', { clientX: START.x + 1, clientY: START.y });
  assert.equal(r.strip.style.transform, 'translate(1px, 0px)');
});

test('touch uses the same pointer path', () => {
  const r = rig();
  r.drag(CENTER.B, { pointerType: 'touch', id: 21 });
  assert.deepEqual(r.state.calls, ['B']);
  clean(r);
});

test('only the primary button starts a drag, and only on the strip', () => {
  const r = rig();
  r.ptr('pointerdown', { button: 2, clientX: START.x, clientY: START.y });
  assert.equal(r.strip.hasAttribute('data-dragging'), false);
  const zone = r.doc.querySelector('[data-drop-sample="A"]');
  r.ptr('pointerdown', { clientX: CENTER.A.x, clientY: CENTER.A.y }, zone);
  r.ptr('pointerup', { clientX: CENTER.A.x, clientY: CENTER.A.y }, zone);
  assert.deepEqual(r.state.calls, []);
});

test('locked: no drag starts and buttons send nothing, even if the DOM was tampered with', () => {
  const r = rig({ locked: true });
  r.drag(CENTER.A);
  assert.equal(r.strip.hasAttribute('data-dragging'), false);
  r.button('B').disabled = false;          // a forged DOM
  r.button('B').click();
  assert.deepEqual(r.state.calls, []);
  // locked while a drag is under way: the drop is refused too
  r.state.locked = false;
  r.ptr('pointerdown', { clientX: START.x, clientY: START.y });
  r.state.locked = true;
  r.ptr('pointerup', { clientX: CENTER.C.x, clientY: CENTER.C.y });
  assert.deepEqual(r.state.calls, []);
  clean(r);
});

test('canDip false: neither a drop nor a click (even on a re-enabled button) gets through', () => {
  const r = rig({ can: (id) => id !== 'B', tested: ['B'] });
  assert.equal(r.button('B').disabled, true);
  r.drag(CENTER.B);
  r.button('B').disabled = false;
  r.button('B').click();
  assert.deepEqual(r.state.calls, []);
  r.drag(CENTER.A);
  assert.deepEqual(r.state.calls, ['A']);
});

test('button click sends its sample; a disabled button sends nothing', () => {
  const r = rig({ tested: ['C'] });
  r.button('A').click();
  r.button('C').click();             // disabled: the browser fires no click, and the handler also checks
  r.button('C').dispatchEvent(new r.w.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(r.state.calls, ['A']);
});

test('drag, button and touch all end in the same callback with the same argument', () => {
  const a = rig(), b = rig(), c = rig();
  a.drag(CENTER.B); b.button('B').click(); c.drag(CENTER.B, { pointerType: 'touch' });
  assert.deepEqual([a.state.calls, b.state.calls, c.state.calls], [['B'], ['B'], ['B']]);
});

test('destroy removes every listener: nothing reaches onDip afterwards, and a drag in progress is cleaned up', () => {
  const r = rig();
  r.ptr('pointerdown', { clientX: START.x, clientY: START.y });
  r.ptr('pointermove', { clientX: CENTER.A.x, clientY: CENTER.A.y });
  r.input.destroy();
  clean(r);
  r.ptr('pointerup', { clientX: CENTER.A.x, clientY: CENTER.A.y });
  r.drag(CENTER.B);
  r.button('C').click();
  assert.deepEqual(r.state.calls, []);
  r.input.destroy();   // twice is harmless
});

test('onDip is required', () => {
  const dom = new JSDOM('<div id="h"></div>');
  assert.throws(() => bindAcidBaseInput({ root: dom.window.document.getElementById('h') }), TypeError);
});

console.log(`acid-base-guided input: ${tests} tests passed`);
