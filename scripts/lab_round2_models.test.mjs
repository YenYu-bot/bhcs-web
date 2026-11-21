// 第二輪實驗桌的模型測試：tools/lab/<站>/model.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
import { circuit } from '../tools/lab/circuit/model.mjs';
import { heat } from '../tools/lab/phase/model.mjs';
import { balance, RX } from '../tools/lab/balance/model.mjs';
import { indicate } from '../tools/lab/indicator/model.mjs';
import { motion } from '../tools/lab/newton/model.mjs';
import { color } from '../tools/lab/color/model.mjs';
import { eye } from '../tools/lab/eye/model.mjs';
import { scope } from '../tools/lab/microscope/model.mjs';
import { photo } from '../tools/lab/photosynthesis/model.mjs';
import { cross } from '../tools/lab/genetics/model.mjs';
import { quake, STATIONS, EPIC } from '../tools/lab/earthquake/model.mjs';
const near = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, `${m || ''} ${a} ≠ ${b}`);

test('circuit: Ohm law, series halves the current, parallel doubles the total', () => {
  assert.equal(circuit({ layout: 'single', cells: 1, on: false }).total, 0);
  near(circuit({ layout: 'single', cells: 1, on: true }).total, 0.3); near(circuit({ layout: 'single', cells: 2, on: true }).total, 0.6);
  const s = circuit({ layout: 'series', cells: 2, on: true }); near(s.total, 0.3); near(s.each, 0.3); near(s.vEach, 1.5);
  const p = circuit({ layout: 'parallel', cells: 2, on: true }); near(p.total, 1.2); near(p.each, 0.6); near(p.vEach, 3);
  for (const layout of ['single', 'series', 'parallel']) for (const cells of [1, 2]) { const r = circuit({ layout, cells, on: true }); near(r.total * r.Rt, r.V, 'V=IR'); near(r.vEach * (layout === 'series' ? 2 : 1), r.V, 'voltage split'); }
  assert.throws(() => circuit({ layout: 'x', cells: 1, on: true }));
});
test('phase: plateaus at 0 and 100, heat scales with mass, energy bookkeeping', () => {
  assert.equal(heat({ mass: 100, time: 0 }).temp, -20);
  for (const t of [1, 3, 7]) { const r = heat({ mass: 100, time: t }); assert.equal(r.temp, 0); assert.equal(r.phase, 'melting'); }
  near(heat({ mass: 100, time: 3 }).frac, 0.25); near(heat({ mass: 100, time: 7 }).frac, 0.75);
  assert.deepEqual([heat({ mass: 100, time: 9 }).phase, heat({ mass: 100, time: 9 }).temp], ['water', 0]);
  near(heat({ mass: 100, time: 14 }).temp, 50);
  for (const t of [19, 30]) { const r = heat({ mass: 100, time: t }); assert.equal(r.temp, 100); assert.equal(r.phase, 'boiling'); }
  const d = heat({ mass: 200, time: 9 }); assert.equal(d.phase, 'melting'); near(d.frac, 7000 / 16000);
  let last = -Infinity; for (let t = 0; t <= 80; t += 0.5) { const T = heat({ mass: 100, time: t }).temp; assert.ok(T >= last); last = T; }
  assert.equal(heat({ mass: 100, time: 80 }).phase, 'steam');
});
test('balance: the listed answers balance, all-ones do not, multiples are not simplest', () => {
  for (const [rx, R] of Object.entries(RX)) { const [a, b, c, d = 1] = R.answer; const r = balance({ rx, a, b, c, d }); assert.ok(r.balanced && r.simplest, rx); assert.equal(balance({ rx, a: 1, b: 1, c: 1, d: 1 }).balanced, false); }
  const m = balance({ rx: 'water', a: 4, b: 2, c: 4, d: 1 }); assert.ok(m.balanced && !m.simplest);
  assert.deepEqual(balance({ rx: 'methane', a: 1, b: 2, c: 1, d: 2 }).right, { C: 1, O: 4, H: 4 });
  assert.throws(() => balance({ rx: 'water', a: 0, b: 1, c: 1, d: 1 }));
});
test('indicator: litmus, phenolphthalein and universal colours follow pH', () => {
  const c = (sol, ind) => indicate({ sol, ind }).color;
  assert.deepEqual(['hcl', 'vinegar', 'water', 'soda', 'naoh'].map(s => c(s, 'litmus')), ['紅色', '紅色', '紫色', '藍色', '藍色']);
  assert.deepEqual(['hcl', 'water', 'soda', 'naoh'].map(s => c(s, 'phenol')), ['無色', '無色', '淡粉紅色', '紅色']);
  assert.deepEqual(['hcl', 'vinegar', 'water', 'soda', 'naoh'].map(s => c(s, 'universal')), ['紅色', '橙色', '綠色', '藍色', '紫色']);
  assert.deepEqual(['hcl', 'water', 'naoh'].map(s => indicate({ sol: s, ind: 'litmus' }).kind), ['acid', 'neutral', 'base']);
});
test('newton: a = F/m, zero net force keeps the velocity, friction alone slows and stops', () => {
  near(motion({ mass: 1, force: 2, friction: 0, v0: 0 }).a, 2); near(motion({ mass: 1, force: 4, friction: 0, v0: 0 }).a, 4);
  near(motion({ mass: 2, force: 4, friction: 0, v0: 0 }).a, 2); near(motion({ mass: 4, force: 4, friction: 0, v0: 0 }).a, 1);
  const c = motion({ mass: 1, force: 0, friction: 0, v0: 2 }); assert.equal(c.state, '等速'); near(c.v2, 2); near(c.x2, 4);
  assert.equal(motion({ mass: 1, force: 2, friction: 2, v0: 2 }).state, '等速');
  const f = motion({ mass: 1, force: 0, friction: 2, v0: 2 }); assert.equal(f.state, '減速'); near(f.v2, 0); near(f.x2, 1); near(f.at(5).x, 1);
  assert.equal(motion({ mass: 1, force: 2, friction: 4, v0: 0 }).state, '靜止');
  const r = motion({ mass: 1, force: 4, friction: 0, v0: 0 }); near(r.x1, 2); near(r.x2, 8); near(r.v2, 8);
});
test('color: additive lights, subtractive pigments, object colour is the reflected part', () => {
  const base = { r: false, g: false, b: false, c: false, m: false, y: false, object: 'apple', light: 'white' };
  const L = (r, g, b) => color({ ...base, r, g, b }).light.name, Pg = (c, m, y) => color({ ...base, c, m, y }).pigment.name, S = (object, light) => color({ ...base, object, light }).seen.name;
  assert.deepEqual([L(true, true, false), L(false, true, true), L(true, false, true), L(true, true, true), L(false, false, false)], ['黃色', '青色', '洋紅色', '白色', '黑色']);
  assert.deepEqual([Pg(true, true, false), Pg(false, true, true), Pg(true, false, true), Pg(true, true, true), Pg(false, false, false)], ['藍色', '紅色', '綠色', '黑色', '白色']);
  assert.deepEqual([S('apple', 'white'), S('apple', 'green'), S('apple', 'blue'), S('paper', 'green'), S('leaf', 'green')], ['紅色', '黑色', '黑色', '綠色', '綠色']);
});
test('eye: myopia focuses in front and needs a concave lens; hyperopia behind and needs a convex lens', () => {
  assert.ok(eye({ type: 'normal', dist: 'far', lens: 'none' }).clear); assert.equal(eye({ type: 'normal', dist: 'near', lens: 'none' }).lensShape, '變厚');
  assert.equal(eye({ type: 'myopia', dist: 'far', lens: 'none' }).where, 'front'); assert.ok(eye({ type: 'myopia', dist: 'far', lens: 'concave' }).clear); assert.equal(eye({ type: 'myopia', dist: 'far', lens: 'convex' }).off, -4);
  assert.equal(eye({ type: 'hyperopia', dist: 'near', lens: 'none' }).where, 'behind'); assert.ok(eye({ type: 'hyperopia', dist: 'near', lens: 'convex' }).clear); assert.equal(eye({ type: 'hyperopia', dist: 'near', lens: 'concave' }).off, 4);
});
test('microscope: magnification, field shrinks in proportion, image moves opposite to the slide', () => {
  assert.deepEqual([4, 10, 40].map(obj => scope({ obj, slide: 'center', target: 'center' }).total), [40, 100, 400]);
  for (const obj of [4, 10, 40]) { const r = scope({ obj, slide: 'center', target: 'center' }); near(r.field * obj, 16); near(r.cells * obj, 160); }
  assert.deepEqual(scope({ obj: 4, slide: 'right', target: 'center' }).pos, [-1, 0]);
  assert.ok(scope({ obj: 10, slide: 'left', target: 'left' }).centered); assert.equal(scope({ obj: 10, slide: 'right', target: 'left' }).inView, false);
});
test('photosynthesis: the scarcest factor sets the rate; temperature off-optimum halves it', () => {
  const r = (light, co2, temp) => photo({ light, co2, temp }).rate;
  assert.deepEqual([r(1, 'high', 25), r(2, 'high', 25), r(3, 'high', 25)], [10, 20, 30]);
  assert.deepEqual([r(2, 'low', 25), r(3, 'low', 25)], [20, 20]); assert.equal(photo({ light: 3, co2: 'low', temp: 25 }).limit, 'co2'); assert.equal(photo({ light: 1, co2: 'low', temp: 25 }).limit, 'light');
  assert.deepEqual([r(3, 'high', 10), r(3, 'high', 40)], [15, 15]);
});
test('genetics: Punnett ratios, test cross, and a fixed sample that approaches 3:1', () => {
  assert.equal(cross({ p1: 'TT', p2: 'tt', n: 20 }).ratio, '0：1：0'); assert.equal(cross({ p1: 'TT', p2: 'tt', n: 20 }).look, '全部高莖');
  const f2 = cross({ p1: 'Tt', p2: 'Tt', n: 20 }); assert.equal(f2.ratio, '1：2：1'); assert.equal(f2.look, '3：1'); assert.equal(f2.pTall, 0.75);
  const t = cross({ p1: 'Tt', p2: 'tt', n: 20 }); assert.equal(t.ratio, '0：1：1'); assert.equal(t.look, '1：1');
  assert.deepEqual([20, 100, 400].map(n => cross({ p1: 'Tt', p2: 'Tt', n }).tall), [17, 73, 299]);
  for (const p1 of ['TT', 'Tt', 'tt']) for (const p2 of ['TT', 'Tt', 'tt']) { const r = cross({ p1, p2, n: 100 }); assert.equal(r.tall + r.short, 100); if (r.pTall === 1) assert.equal(r.short, 0); if (r.pTall === 0) assert.equal(r.tall, 0); }
});
test('earthquake: arrival times, lag proportional to distance, mirror point is equidistant from two stations', () => {
  const a = quake({ boundary: 'divergent', dist: 60, stations: 1 }), b = quake({ boundary: 'convergent', dist: 120, stations: 2 });
  assert.deepEqual([a.tp, a.ts, a.lag], [10, 20, 10]); assert.deepEqual([b.tp, b.ts, b.lag], [20, 40, 20]); assert.equal(quake({ boundary: 'transform', dist: 90, stations: 3 }).lag, 15);
  const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  for (const i of [0, 1]) near(d(STATIONS[i][1], b.mirror), d(STATIONS[i][1], EPIC), 'mirror on circle ' + i);
  assert.ok(Math.abs(d(STATIONS[2][1], b.mirror) - d(STATIONS[2][1], EPIC)) > 50, 'third station separates the two candidates');
});
