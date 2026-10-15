// B2 gate: acid–base guided bench renderer (Pilot #4). jsdom, no browser.
// The renderer only draws observations rebuilt by model.deriveObservation(); these tests feed it exactly that.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { deriveObservation, SAMPLE_IDS, COLOR_HEX } from '../assets/acid-base-guided/model.js';
import * as R from '../assets/acid-base-guided/render.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const root = fileURLToPath(new URL('..', import.meta.url));
const BLUE = 'blue-litmus', RED = 'red-litmus';

const obs = (sampleId, indicatorId) => deriveObservation({ layoutId: 0, record: { sampleId, indicatorId } });
/** The presentation model a page adapter would build: records → observations, plus the caller's tested/locked decisions. */
function model(records, activeIndicatorId = BLUE, { locked = false } = {}) {
  return {
    activeIndicatorId, locked,
    samples: SAMPLE_IDS.map((sampleId) => {
      const observations = records.filter((r) => r.sampleId === sampleId).map((r) => obs(r.sampleId, r.indicatorId));
      return { sampleId, tested: observations.some((o) => o.indicatorId === activeIndicatorId), observations };
    }),
  };
}
const rec = (sampleId, indicatorId = BLUE) => ({ sampleId, indicatorId });
function mount(m) {
  const dom = new JSDOM('<!doctype html><body><main id="host"></main><button id="outside">x</button></body>');
  const host = dom.window.document.getElementById('host');
  const bench = R.createAcidBaseBench(host);
  if (m) bench.update(m);
  return { dom, doc: dom.window.document, host, bench };
}
const q = (doc, sel) => doc.querySelector(sel);
const qa = (doc, sel) => [...doc.querySelectorAll(sel)];
const slot = (doc, id, indicatorId) => q(doc, `[data-sample="${id}"] [data-slot="${indicatorId}"]`);
const visibleSlots = (doc) => qa(doc, '[data-slot]').filter((li) => !li.hidden);

test('geometry: viewBox 600 x 380, tubes at x 150 / 300 / 450, drop zones 140 wide, strip hit 140 x 80', () => {
  const { doc } = mount(model([]));
  assert.equal(q(doc, '.abg-svg').getAttribute('viewBox'), '0 0 600 380');
  for (const [id, cx] of Object.entries({ A: 150, B: 300, C: 450 })) {
    const z = q(doc, `[data-drop-sample="${id}"]`);
    assert.equal(Number(z.getAttribute('x')) + Number(z.getAttribute('width')) / 2, cx, `${id} zone centred on its tube`);
    assert.equal(Number(z.getAttribute('width')), 140);
    assert.ok(Number(z.getAttribute('height')) >= 120);
  }
  assert.deepEqual({ ...R.STRIP_HIT }, { x: 230, y: 298, width: 140, height: 80 });
  // drop zones do not overlap each other or the tray strip
  const zones = SAMPLE_IDS.map((id) => q(doc, `[data-drop-sample="${id}"]`)).map((z) => [Number(z.getAttribute('x')), Number(z.getAttribute('x')) + 140, Number(z.getAttribute('y')) + Number(z.getAttribute('height'))]);
  assert.ok(zones[0][1] <= zones[1][0] && zones[1][1] <= zones[2][0]);
  assert.ok(zones.every((z) => z[2] <= R.STRIP_HIT.y), 'tube drop zones end above the tray strip');
});

test('three tubes labelled A / B / C below the glass, and nothing else', () => {
  const { doc } = mount(model([]));
  assert.deepEqual(qa(doc, '.abg-tube').map((g) => g.getAttribute('data-tube')), ['A', 'B', 'C']);
  assert.deepEqual(qa(doc, '.abg-tube-label').map((t) => t.textContent), ['A', 'B', 'C']);
  for (const t of qa(doc, '.abg-tube-label')) assert.ok(Number(t.getAttribute('y')) > R.TUBE.shoulder + R.TUBE.radius, 'label sits below the liquid');
});

test('unknown liquids are drawn identically: same shape, height and fill, whatever the hidden kind', () => {
  const { doc } = mount(model([]));
  const liquids = qa(doc, '.abg-liquid').map((l) => ({ y: l.getAttribute('y'), h: l.getAttribute('height'), w: l.getAttribute('width'), fill: l.getAttribute('fill'), cls: l.getAttribute('class') }));
  assert.equal(liquids.length, 3);
  for (const l of liquids) assert.deepEqual(l, liquids[0]);
  // each tube group differs only in its x position and its sample letter
  const norm = (g) => g.outerHTML.replace(/\b(x|x1|x2|cx|d)="[^"]*"/g, '').replace(/abg-\d+-clip-[ABC]/g, 'CLIP').replace(/"[ABC]"|>[ABC]</g, 'ID');
  const tubes = qa(doc, '.abg-tube').map(norm);
  assert.equal(tubes[0], tubes[1]); assert.equal(tubes[1], tubes[2]);
});

test('active strip: blue litmus is blue with dots, red litmus is red with hatch; phenolphthalein is refused', () => {
  const { doc, bench } = mount(model([]));
  const tray = () => q(doc, '[data-role="strip"] .abg-swatch');
  assert.equal(tray().getAttribute('data-color'), 'blue'); assert.equal(tray().getAttribute('data-pattern'), 'dots');
  assert.equal(q(doc, '[data-role="strip"] .abg-color-fill').getAttribute('fill'), COLOR_HEX.blue);
  bench.update(model([], RED));
  assert.equal(tray().getAttribute('data-color'), 'red'); assert.equal(tray().getAttribute('data-pattern'), 'hatch');
  assert.match(q(doc, '[data-role="tray-hint"]').textContent, /紅色石蕊/);
  for (const bad of ['phenolphthalein', 'cabbage', undefined, null]) assert.throws(() => bench.update({ activeIndicatorId: bad, locked: false, samples: [] }), RangeError);
});

test('used strips keep both states: upper half the start colour, lower half the result colour', () => {
  const { doc } = mount(model([rec('A'), rec('B')]));
  const parts = (id, ind) => Object.fromEntries(['start', 'result'].map((p) => [p, slot(doc, id, ind).querySelector(`[data-part="${p}"]`).getAttribute('data-color')]));
  assert.deepEqual(parts('B', BLUE), { start: 'blue', result: 'red' });     // blue litmus turns red
  assert.deepEqual(parts('A', BLUE), { start: 'blue', result: 'blue' });    // blue litmus stays blue
  const { doc: d2 } = mount(model([rec('A'), rec('B'), rec('C'), rec('A', RED), rec('B', RED)], RED));
  const p2 = (id) => Object.fromEntries(['start', 'result'].map((p) => [p, slot(d2, id, RED).querySelector(`[data-part="${p}"]`).getAttribute('data-color')]));
  assert.deepEqual(p2('A'), { start: 'red', result: 'blue' });              // red litmus turns blue
  assert.deepEqual(p2('B'), { start: 'red', result: 'red' });               // red litmus stays red
  const top = slot(doc, 'B', BLUE).querySelector('[data-part="start"] .abg-color-fill'), bottom = slot(doc, 'B', BLUE).querySelector('[data-part="result"] .abg-color-fill');
  assert.ok(Number(top.getAttribute('y')) < Number(bottom.getAttribute('y')), 'start on top, result below');
  assert.equal(top.getAttribute('fill'), COLOR_HEX.blue); assert.equal(bottom.getAttribute('fill'), COLOR_HEX.red);
});

test('pattern follows the colour shown, not whether the strip changed: red = hatch, blue = dots', () => {
  const { doc } = mount(model([rec('A'), rec('B'), rec('C'), rec('A', RED), rec('B', RED), rec('C', RED)], RED));
  for (const g of qa(doc, '.abg-used-strip .abg-swatch')) {
    const color = g.getAttribute('data-color');
    assert.equal(g.getAttribute('data-pattern'), color === 'red' ? 'hatch' : 'dots');
    assert.match(g.querySelector('.abg-pattern-fill').getAttribute('fill'), new RegExp(`#abg-\\d+-${color === 'red' ? 'hatch' : 'dots'}\\)$`));
  }
  // turns-red and stays-red share the hatch; stays-blue and turns-blue share the dots
  const res = (id, ind) => slot(doc, id, ind).querySelector('[data-part="result"]').getAttribute('data-pattern');
  assert.equal(res('B', BLUE), 'hatch'); assert.equal(res('B', RED), 'hatch');
  assert.equal(res('A', BLUE), 'dots'); assert.equal(res('A', RED), 'dots');
});

test('every used strip has its result in words next to it', () => {
  const { doc } = mount(model([rec('A'), rec('B'), rec('C'), rec('A', RED), rec('B', RED), rec('C', RED)], RED));
  const text = (id, ind) => slot(doc, id, ind).querySelector('[data-role="used-text"]').textContent;
  assert.equal(text('B', BLUE), '藍色石蕊：變紅色');
  assert.equal(text('A', BLUE), '藍色石蕊：維持藍色');
  assert.equal(text('A', RED), '紅色石蕊：變藍色');
  assert.equal(text('B', RED), '紅色石蕊：維持紅色');
  assert.equal(text('C', BLUE), '藍色石蕊：維持藍色'); assert.equal(text('C', RED), '紅色石蕊：維持紅色');
  for (const li of visibleSlots(doc)) assert.ok(li.querySelector('[data-role="used-text"]').textContent.length > 0 && li.querySelector('[data-pattern]'));
});

test('buttons: one native button per tube; tested ones are disabled, untested ones enabled, names carry the strip', () => {
  const { doc } = mount(model([rec('B')]));
  const btn = (id) => q(doc, `[data-dip-sample="${id}"]`);
  assert.deepEqual(qa(doc, 'button[data-dip-sample]').map((b) => b.getAttribute('data-dip-sample')), ['A', 'B', 'C']);
  for (const b of qa(doc, 'button[data-dip-sample]')) assert.equal(b.getAttribute('type'), 'button');
  assert.equal(btn('A').disabled, false); assert.equal(btn('A').textContent, '測試液體 A');
  assert.equal(btn('A').getAttribute('aria-label'), '用藍色石蕊測試液體 A');
  assert.equal(btn('B').disabled, true); assert.equal(btn('B').textContent, '液體 B 已測');
  assert.equal(btn('C').disabled, false);
});

test('locked: every button is disabled and the bench says so', () => {
  const { doc, bench } = mount(model([], BLUE, { locked: true }));
  assert.ok(qa(doc, 'button[data-dip-sample]').every((b) => b.disabled));
  assert.equal(q(doc, '[data-role="bench"]').getAttribute('data-locked'), 'true');
  bench.update(model([], BLUE));
  assert.ok(qa(doc, 'button[data-dip-sample]').every((b) => !b.disabled));
  assert.equal(q(doc, '[data-role="bench"]').getAttribute('data-locked'), 'false');
});

test('blue → red: blue evidence stays on the bench, red slots start empty, buttons re-enable for the new strip', () => {
  const blue = [rec('A'), rec('B'), rec('C')];
  const { doc, bench } = mount(model(blue, BLUE));
  assert.equal(visibleSlots(doc).length, 3);
  bench.update(model(blue, RED));
  assert.deepEqual(visibleSlots(doc).map((li) => li.getAttribute('data-slot')), [BLUE, BLUE, BLUE]);
  for (const id of SAMPLE_IDS) assert.equal(slot(doc, id, RED).hidden, true);
  assert.ok(qa(doc, 'button[data-dip-sample]').every((b) => !b.disabled));
  assert.equal(q(doc, '[data-dip-sample="A"]').getAttribute('aria-label'), '用紅色石蕊測試液體 A');
});

test('six observations: two strips under every tube, in blue-then-red order', () => {
  const all = [rec('A'), rec('B'), rec('C'), rec('A', RED), rec('B', RED), rec('C', RED)];
  const { doc } = mount(model(all, RED));
  assert.equal(visibleSlots(doc).length, 6);
  for (const id of SAMPLE_IDS) assert.deepEqual(qa(doc, `[data-sample="${id}"] [data-slot]`).map((li) => [li.getAttribute('data-slot'), li.hidden]), [[BLUE, false], [RED, false]]);
});

test('the renderer ignores anything but the observation itself: no pH, no kind, no class of liquid', () => {
  const m = model([rec('A'), rec('B'), rec('C')]);
  for (const s of m.samples) for (const o of s.observations) Object.assign(o, { kind: 'basic', ph10: 110, extra: 'acidic pH 11' });
  const { doc } = mount(m);
  const html = doc.body.innerHTML;
  for (const w of ['acidic', 'neutral', 'basic', 'ph10', 'pH', '酸', '鹼', '中性']) assert.ok(!html.includes(w), `bench HTML contains ${w}`);
  const words = doc.body.textContent + qa(doc, '[aria-label]').map((e) => e.getAttribute('aria-label')).join(' ');
  assert.ok(!/\b(30|70|110)\b/.test(words), 'a hidden pH value reached the text');
  assert.equal(qa(doc, '[data-kind], [data-ph], [data-ph10]').length, 0);
  // and its source never reaches for the hidden values
  const code = (f) => fs.readFileSync(`${root}assets/acid-base-guided/${f}`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');   // code only, comments dropped
  const src = code('render.js') + code('input.js');
  for (const w of ['ph10', 'samplePh10', 'sampleKind', 'classifyPh10', 'deriveObservation', 'engine.js', '.kind']) assert.ok(!src.includes(w), `B2 source uses ${w}`);
  for (const w of ['酸', '鹼', '中性', 'pH']) assert.ok(!src.includes(w), `B2 source holds ${w}`);
});

test('two benches on one page: every SVG id is unique and every url(#…) points into its own bench', () => {
  const dom = new JSDOM('<!doctype html><body><div id="a"></div><div id="b"></div></body>');
  const d = dom.window.document;
  const one = R.createAcidBaseBench(d.getElementById('a')), two = R.createAcidBaseBench(d.getElementById('b'));
  one.update(model([rec('B')])); two.update(model([rec('B')], BLUE));
  const ids = qa(d, '[id]').map((e) => e.id).filter((id) => id !== 'a' && id !== 'b');
  assert.equal(new Set(ids).size, ids.length, 'ids collide');
  assert.notEqual(one.uid, two.uid);
  for (const [bench, host] of [[one, 'a'], [two, 'b']]) {
    for (const e of qa(d, `#${host} [fill^="url(#"], #${host} [clip-path^="url(#"]`)) {
      const ref = (e.getAttribute('fill') || e.getAttribute('clip-path')).slice(5, -1);
      assert.ok(ref.startsWith(`${bench.uid}-`), `${host} refers to ${ref}`);
      assert.ok(d.getElementById(ref), `${ref} exists`);
    }
  }
});

test('update patches in place: the same nodes before and after, and identical updates touch nothing', () => {
  const { doc, bench } = mount(model([]));
  const nodes = () => [...qa(doc, 'button[data-dip-sample]'), ...qa(doc, '[data-slot]'), q(doc, '[data-role="strip"]'), q(doc, '.abg-svg'), ...qa(doc, '.abg-liquid')];
  const before = nodes();
  bench.update(model([rec('A')]));
  bench.update(model([rec('A'), rec('B'), rec('C')], RED));
  const after = nodes();
  assert.equal(after.length, before.length);
  after.forEach((n, i) => assert.equal(n, before[i], 'a node was replaced'));
  // a repeated identical update makes no DOM mutation at all
  const m = model([rec('A')]);
  bench.update(m);
  const watch = new doc.defaultView.MutationObserver(() => {});
  watch.observe(doc.body, { subtree: true, attributes: true, childList: true, characterData: true });
  bench.update(m);
  assert.deepEqual(watch.takeRecords().map((r) => r.type), [], 'an identical update mutated the DOM');
  bench.update(model([rec('A'), rec('B')]));
  assert.ok(watch.takeRecords().length > 0, 'the observer does see real changes');
  watch.disconnect();
});

test('focus survives updates: B keeps focus while A gets a result', () => {
  const { doc, bench } = mount(model([]));
  const b = q(doc, '[data-dip-sample="B"]');
  b.focus();
  assert.equal(doc.activeElement, b);
  bench.update(model([rec('A')]));
  assert.equal(doc.activeElement, b, 'focus stayed on B');
  assert.equal(q(doc, '[data-dip-sample="B"]'), b);
});

test('accessibility: the drawing is hidden from assistive tech, results and controls live in real DOM', () => {
  const { doc } = mount(model([rec('B')]));
  assert.equal(q(doc, '.abg-svg').getAttribute('aria-hidden'), 'true');
  assert.equal(q(doc, '[data-role="strip"]').getAttribute('aria-hidden'), 'true');
  assert.equal(qa(doc, '.abg-svg [tabindex], [data-role="strip"][tabindex]').length, 0, 'nothing in the drawing is focusable');
  for (const s of qa(doc, '.abg-used-art')) assert.equal(s.getAttribute('aria-hidden'), 'true');
  assert.equal(slot(doc, 'B', BLUE).querySelector('[data-role="used-text"]').closest('[aria-hidden]'), null, 'result text is exposed');
  assert.equal(qa(doc, '[aria-live], [role="status"], [role="alert"]').length, 0, 'the bench has no live region of its own');
});

test('destroy removes the bench and leaves the host empty', () => {
  const { doc, host, bench } = mount(model([rec('A')]));
  assert.ok(host.children.length > 0);
  bench.destroy();
  assert.equal(host.children.length, 0);
  assert.equal(q(doc, '[data-role="bench"]'), null);
});

console.log(`acid-base-guided render: ${tests} tests passed`);
