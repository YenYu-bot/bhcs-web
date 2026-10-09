// B1 gate: the guided buoyancy physics model (assets/buoyancy-guided/model.js).
// Pure numbers in, pure facts out. Run on its own: node scripts/test_buoyancy_guided_model.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as model from '../assets/buoyancy-guided/model.js';
import { LIQUIDS, BLOCK, TRIAL3, DENSITY_EPSILON, density, relation, outcomeIn, blockMassG, blockOutcome, objectOutcome } from '../assets/buoyancy-guided/model.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) <= 1e-12, `${label}: ${actual} vs ${expected}`);
const sourceOf = (rel) => fs.readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

test('constants match the approved spec and cannot be mutated', () => {
  assert.deepEqual(LIQUIDS, { oil: { id: 'oil', density: 0.92 }, water: { id: 'water', density: 1.0 }, brine: { id: 'brine', density: 1.2 } });
  assert.deepEqual(BLOCK, { volumeCm3: 100, shellMassG: 40, ballastStepG: 20, slotsMin: 0, slotsMax: 6 });
  assert.deepEqual(TRIAL3, { wood: { id: 'wood', massG: 300, volumeCm3: 500 }, stone: { id: 'stone', massG: 120, volumeCm3: 40 } });
  assert.equal(DENSITY_EPSILON, 1e-9);
  for (const o of [LIQUIDS, LIQUIDS.water, BLOCK, TRIAL3, TRIAL3.wood]) assert.ok(Object.isFrozen(o));
  assert.throws(() => { LIQUIDS.water.density = 0.9; }, TypeError);
  assert.throws(() => { BLOCK.volumeCm3 = 1; }, TypeError);
  assert.throws(() => { TRIAL3.stone.massG = 1; }, TypeError);
  assert.equal(LIQUIDS.water.density, 1.0);
});

test('the module exports exactly the approved API', () => {
  assert.deepEqual(Object.keys(model).sort(), ['BLOCK', 'DENSITY_EPSILON', 'LIQUIDS', 'TRIAL3', 'blockMassG', 'blockOutcome', 'density', 'objectOutcome', 'outcomeIn', 'relation']);
});

test('density is mass over volume', () => {
  assert.equal(density({ massG: 100, volumeCm3: 100 }), 1);
  assert.equal(density({ massG: 300, volumeCm3: 500 }), 0.6);
  assert.equal(density({ massG: 120, volumeCm3: 40 }), 3);
});

test('blockMassG is 40 + 20 × slots', () => {
  for (let s = 0; s <= 6; s++) assert.equal(blockMassG(s), 40 + 20 * s);
  assert.equal(blockMassG(0), 40);
  assert.equal(blockMassG(6), 160);
});

// slots → [mass, object density, outcome, raw immersion fraction]
const WATER = [[0, 40, 0.4, 'float', 0.4], [1, 60, 0.6, 'float', 0.6], [2, 80, 0.8, 'float', 0.8], [3, 100, 1.0, 'stay', null],
  [4, 120, 1.2, 'sink', null], [5, 140, 1.4, 'sink', null], [6, 160, 1.6, 'sink', null]];
const BRINE = [[0, 40, 0.4, 'float', 1 / 3], [1, 60, 0.6, 'float', 0.5], [2, 80, 0.8, 'float', 2 / 3], [3, 100, 1.0, 'float', 5 / 6],
  [4, 120, 1.2, 'stay', null], [5, 140, 1.4, 'sink', null], [6, 160, 1.6, 'sink', null]];

for (const [liquidId, table] of [['water', WATER], ['brine', BRINE]]) {
  test(`7 ballast slots in ${liquidId}`, () => {
    for (const [slots, massG, rho, outcome, fraction] of table) {
      const r = blockOutcome({ slots, liquidId });
      assert.equal(r.massG, massG, `${liquidId} ${slots} mass`);
      assert.equal(r.volumeCm3, 100);
      near(r.objectDensity, rho, `${liquidId} ${slots} density`);
      assert.equal(r.liquidDensity, LIQUIDS[liquidId].density);
      assert.equal(r.outcome, outcome, `${liquidId} ${slots} outcome`);
      if (fraction === null) assert.equal(r.immersionFraction, null);
      else near(r.immersionFraction, fraction, `${liquidId} ${slots} immersion`);
    }
  });
}

test('the stay slot is 3 in water and 4 in brine, and there is exactly one per liquid', () => {
  const stays = (liquidId) => [0, 1, 2, 3, 4, 5, 6].filter((slots) => blockOutcome({ slots, liquidId }).outcome === 'stay');
  assert.deepEqual(stays('water'), [3]);
  assert.deepEqual(stays('brine'), [4]);
  assert.equal(blockMassG(3), 100);
  assert.equal(blockMassG(4), 120);
  assert.deepEqual(stays('oil'), [], 'no ballast step lands exactly on oil');
});

test('challenge cases: a 100 g / 100 cm³ block in oil sinks; an 80 g block floats at 80% in water and 2/3 in brine', () => {
  const oil = outcomeIn({ massG: 100, volumeCm3: 100, liquidDensity: LIQUIDS.oil.density });
  assert.equal(oil.objectDensity, 1);
  assert.equal(oil.liquidDensity, 0.92);
  assert.equal(oil.relation, 'heavier');
  assert.equal(oil.outcome, 'sink');
  assert.equal(blockOutcome({ slots: 3, liquidId: 'oil' }).outcome, 'sink');
  near(blockOutcome({ slots: 2, liquidId: 'water' }).immersionFraction, 0.8, 'c2 water');
  near(blockOutcome({ slots: 2, liquidId: 'brine' }).immersionFraction, 2 / 3, 'c2 brine');
});

test('Trial 3: wood floats at 0.6 and stone sinks in water', () => {
  const wood = objectOutcome({ objectId: 'wood', liquidId: 'water' });
  assert.equal(wood.massG, 300);
  assert.equal(wood.volumeCm3, 500);
  near(wood.objectDensity, 0.6, 'wood density');
  assert.equal(wood.outcome, 'float');
  near(wood.immersionFraction, 0.6, 'wood immersion');
  const stone = objectOutcome({ objectId: 'stone', liquidId: 'water' });
  assert.equal(stone.massG, 120);
  assert.equal(stone.volumeCm3, 40);
  near(stone.objectDensity, 3, 'stone density');
  assert.equal(stone.outcome, 'sink');
  assert.equal(stone.immersionFraction, null);
});

test('wood and stone in brine and oil: objectOutcome is not special-cased to water', () => {
  const woodBrine = objectOutcome({ objectId: 'wood', liquidId: 'brine' });
  assert.equal(woodBrine.outcome, 'float');
  near(woodBrine.immersionFraction, 0.6 / 1.2, 'wood in brine');
  const woodOil = objectOutcome({ objectId: 'wood', liquidId: 'oil' });
  assert.equal(woodOil.outcome, 'float');
  near(woodOil.immersionFraction, 0.6 / 0.92, 'wood in oil');
  for (const liquidId of ['brine', 'oil']) {
    const stone = objectOutcome({ objectId: 'stone', liquidId });
    assert.equal(stone.outcome, 'sink');
    assert.equal(stone.immersionFraction, null);
  }
});

test('relation uses the tolerance, never ===', () => {
  assert.equal(relation(1 + 1e-12, 1), 'equal');
  assert.equal(relation(1 - 1e-12, 1), 'equal');
  assert.equal(relation(1 + 1e-6, 1), 'heavier');
  assert.equal(relation(1 - 1e-6, 1), 'lighter');
  assert.equal(relation(1.2, 1.2), 'equal');
  assert.equal(relation(0.1 + 0.2, 0.3), 'equal', 'floating point noise is not a difference');
  assert.equal(relation(120 / 100, LIQUIDS.brine.density), 'equal');
  assert.equal(outcomeIn({ massG: 100, volumeCm3: 100, liquidDensity: 1 + 1e-12 }).outcome, 'stay');
  assert.equal(outcomeIn({ massG: 100, volumeCm3: 100, liquidDensity: 1 - 1e-12 }).outcome, 'stay');
  assert.equal(outcomeIn({ massG: 100, volumeCm3: 100, liquidDensity: 1 + 1e-6 }).outcome, 'float');
  assert.equal(outcomeIn({ massG: 100, volumeCm3: 100, liquidDensity: 1 - 1e-6 }).outcome, 'sink');
});

test('invariants: a floating object is strictly between 0 and 1, anything else has no fraction, results are frozen', () => {
  for (const liquidId of Object.keys(LIQUIDS)) {
    for (let slots = 0; slots <= 6; slots++) {
      const r = blockOutcome({ slots, liquidId });
      if (r.outcome === 'float') assert.ok(r.immersionFraction > 0 && r.immersionFraction < 1, `${liquidId} ${slots}`);
      else assert.equal(r.immersionFraction, null, `${liquidId} ${slots}`);
      assert.equal(r.outcome === 'float', r.relation === 'lighter');
      assert.equal(r.outcome === 'stay', r.relation === 'equal');
      assert.equal(r.outcome === 'sink', r.relation === 'heavier');
      assert.ok(Object.isFrozen(r));
      assert.throws(() => { r.outcome = 'sink'; }, TypeError);
    }
    for (const objectId of Object.keys(TRIAL3)) {
      const r = objectOutcome({ objectId, liquidId });
      if (r.outcome === 'float') assert.ok(r.immersionFraction > 0 && r.immersionFraction < 1);
      else assert.equal(r.immersionFraction, null);
    }
  }
});

test('the result carries no display fields', () => {
  const r = blockOutcome({ slots: 3, liquidId: 'brine' });
  assert.deepEqual(Object.keys(r).sort(), ['immersionFraction', 'liquidDensity', 'massG', 'objectDensity', 'outcome', 'relation', 'volumeCm3']);
  assert.ok(!('immersionPercent' in r));
});

test('invalid numbers fail fast with RangeError', () => {
  for (const bad of [NaN, Infinity, -Infinity, 0, -1, '100', null, undefined]) {
    assert.throws(() => density({ massG: bad, volumeCm3: 100 }), RangeError, `mass ${String(bad)}`);
    assert.throws(() => density({ massG: 100, volumeCm3: bad }), RangeError, `volume ${String(bad)}`);
    assert.throws(() => outcomeIn({ massG: 100, volumeCm3: 100, liquidDensity: bad }), RangeError, `liquid ${String(bad)}`);
    assert.throws(() => relation(bad, 1), RangeError);
    assert.throws(() => relation(1, bad), RangeError);
  }
  for (const bad of [null, undefined, 5, 'x']) {
    assert.throws(() => density(bad), RangeError);
    assert.throws(() => outcomeIn(bad), RangeError);
    assert.throws(() => blockOutcome(bad), RangeError);
    assert.throws(() => objectOutcome(bad), RangeError);
  }
});

test('invalid slots, liquids and objects fail fast and are never clamped', () => {
  for (const bad of [-1, 7, 1.5, NaN, Infinity, '3', null, undefined, 0.1 + 0.2]) {
    assert.throws(() => blockMassG(bad), RangeError, `slots ${String(bad)}`);
    assert.throws(() => blockOutcome({ slots: bad, liquidId: 'water' }), RangeError);
  }
  for (const bad of ['milk', '', 'toString', '__proto__', 'constructor', null, undefined, 3]) {
    assert.throws(() => blockOutcome({ slots: 3, liquidId: bad }), RangeError, `liquid ${String(bad)}`);
    assert.throws(() => objectOutcome({ objectId: 'wood', liquidId: bad }), RangeError);
  }
  for (const bad of ['block', 'toString', '__proto__', '', null, undefined, 1]) {
    assert.throws(() => objectOutcome({ objectId: bad, liquidId: 'water' }), RangeError, `object ${String(bad)}`);
  }
});

test('static guard: model.js is pure physics, with no interface, state or wording in its code', () => {
  const code = sourceOf('../assets/buoyancy-guided/model.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');
  for (const word of ['document', 'window', 'localStorage', 'sessionStorage', 'phase', 'CTA', 'HTML', 'CSS', 'DOM', 'innerHTML', 'classList', 'immersionPercent', 'Math.round', 'setTimeout', 'requestAnimationFrame']) {
    assert.ok(!code.includes(word), `model.js code must not contain "${word}"`);
  }
  assert.ok(!/[㐀-鿿]/.test(code), 'model.js code must not contain Chinese wording');
  assert.ok(!/^\s*import\s/m.test(code), 'model.js must not import anything');
});

console.log(`\nbuoyancy-guided model: ${tests} tests passed`);
