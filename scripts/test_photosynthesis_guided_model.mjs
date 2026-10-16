import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as M from '../assets/photosynthesis-guided/model.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const root = fileURLToPath(new URL('..', import.meta.url));
const near = (a, b, eps = 1e-12) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);

function extractFunction(src, name) {
  const start = src.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `legacy function ${name}`);
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated ${name}`);
}

function legacyModel() {
  const html = fs.readFileSync(`${root}tools/photosynthesis-factor-lab.html`, 'utf8');
  const names = ['clamp', 'lightFactor', 'co2Factor', 'temperatureFactor', 'result'];
  const source = names.map((n) => extractFunction(html, n)).join('\n');
  return Function(`"use strict"; const RMAX=20; ${source}; return { lightFactor, co2Factor, temperatureFactor, result };`)();
}

test('fixed Guided trials are frozen, source-only and use the intended controlled comparisons', () => {
  assert.deepEqual([...M.TRIAL_IDS], ['t1-low-light', 't1-higher-light', 't2-medium-light', 't2-high-light']);
  assert.deepEqual(M.FIXED_TRIALS['t1-low-light'], { light: 15, co2: 1000, temperature: 25 });
  assert.deepEqual(M.FIXED_TRIALS['t1-higher-light'], { light: 60, co2: 1000, temperature: 25 });
  assert.deepEqual(M.FIXED_TRIALS['t2-medium-light'], { light: 60, co2: 150, temperature: 25 });
  assert.deepEqual(M.FIXED_TRIALS['t2-high-light'], { light: 100, co2: 150, temperature: 25 });
  assert.equal(Object.isFrozen(M.FIXED_TRIALS), true);
  assert.equal(Object.isFrozen(M.FIXED_TRIALS['t1-low-light']), true);
  const cloned = M.trialCondition('t1-low-light');
  cloned.light = 99;
  assert.equal(M.FIXED_TRIALS['t1-low-light'].light, 15);
});

test('factor boundaries and the 25 C optimum are exact', () => {
  near(M.lightFactor(0), 0);
  near(M.lightFactor(100), 1);
  near(M.co2Factor(0), 0);
  near(M.co2Factor(1200), 1);
  near(M.temperatureFactor(5), 0);
  near(M.temperatureFactor(25), 1);
  near(M.temperatureFactor(45), 0);
  near(M.temperatureFactor(10), 0.25);
  near(M.temperatureFactor(40), 0.25);
});

test('the four Guided trial rates form the intended contrast', () => {
  const a = M.fixedTrialObservation('t1-low-light');
  const b = M.fixedTrialObservation('t1-higher-light');
  const c = M.fixedTrialObservation('t2-medium-light');
  const d = M.fixedTrialObservation('t2-high-light');
  near(a.rate, 7.395989922717455, 1e-10);
  near(b.rate, 17.397327864560147, 1e-10);
  near(c.rate, 8.333333333333332, 1e-10);
  near(d.rate, 8.333333333333332, 1e-10);
  assert.equal(M.classifyRateChange(a.rate, b.rate), 'increase');
  assert.equal(M.classifyRateChange(c.rate, d.rate), 'same');
  assert.equal(a.limit, 'light');
  assert.equal(b.limit, 'light');
  assert.equal(c.limit, 'co2');
  assert.equal(d.limit, 'co2');
});

test('tie and temperature challenge points are derived by the model', () => {
  const ideal = M.calculatePhotosynthesis({ light: 100, co2: 1200, temperature: 25 });
  assert.equal(ideal.limit, 'tie');
  near(ideal.rate, 20);
  const hot = M.calculatePhotosynthesis({ light: 100, co2: 1200, temperature: 40 });
  assert.equal(hot.limit, 'temperature');
  near(hot.rate, 5);
});

test('deriveTrialObservation trusts only source fields and ignores forged derived data', () => {
  const forged = {
    trialId: 't2-high-light',
    light: 100,
    co2: 150,
    temperature: 25,
    rate: 999,
    limit: 'light',
    factors: { light: 0 },
    correct: true,
  };
  const o = M.deriveTrialObservation(forged);
  near(o.rate, 8.333333333333332, 1e-10);
  assert.equal(o.limit, 'co2');
  assert.equal(o.factors.light, 1);
  assert.equal(M.recordMatchesFixedTrial(forged), true);
  assert.equal(M.recordMatchesFixedTrial({ ...forged, light: 60 }), false);
});

test('bad source records return null; public model inputs reject values outside the domain', () => {
  for (const x of [null, undefined, 7, [], {}, { trialId: 'x', light: 15, co2: 1000, temperature: 25 },
    { trialId: 't1-low-light', light: -1, co2: 1000, temperature: 25 }]) {
    assert.equal(M.deriveTrialObservation(x), null);
  }
  for (const bad of [-1, 101, NaN, Infinity, '15']) assert.throws(() => M.lightFactor(bad), RangeError);
  for (const bad of [-1, 1201, NaN, '150']) assert.throws(() => M.co2Factor(bad), RangeError);
  for (const bad of [4.9, 45.1, NaN, '25']) assert.throws(() => M.temperatureFactor(bad), RangeError);
  assert.throws(() => M.trialCondition('nope'), RangeError);
});

test('rate-change classifier has an explicit numerical tolerance', () => {
  assert.equal(M.classifyRateChange(8.30, 8.34), 'same');
  assert.equal(M.classifyRateChange(8.30, 8.36), 'increase');
  assert.equal(M.classifyRateChange(8.36, 8.30), 'decrease');
  assert.throws(() => M.classifyRateChange(NaN, 1), RangeError);
  assert.throws(() => M.classifyRateChange(1, 2, -1), RangeError);
});

test('new pure model stays numerically identical to the legacy page over a comparison grid', () => {
  const L = legacyModel();
  for (const light of [0, 1, 15, 50, 60, 100]) {
    near(M.lightFactor(light), L.lightFactor(light));
  }
  for (const co2 of [0, 1, 150, 400, 1000, 1200]) {
    near(M.co2Factor(co2), L.co2Factor(co2));
  }
  for (const t of [5, 10, 25, 40, 45]) {
    near(M.temperatureFactor(t), L.temperatureFactor(t));
  }
  for (const light of [0, 15, 50, 60, 100]) {
    for (const co2 of [0, 150, 400, 1000, 1200]) {
      for (const temperature of [5, 10, 25, 40, 45]) {
        const a = M.calculatePhotosynthesis({ light, co2, temperature });
        const b = L.result(light, co2, temperature);
        near(a.rate, b.rate);
        near(a.oxygen, b.oxygen);
        for (const id of M.FACTOR_IDS) near(a.factors[id], b.factors[id]);
        assert.equal(a.limit, b.limit, `${light}/${co2}/${temperature}`);
      }
    }
  }
});

test('model source has no learner wording, DOM, storage, analytics or network code', () => {
  const src = fs.readFileSync(`${root}assets/photosynthesis-guided/model.js`, 'utf8');
  assert.doesNotMatch(src, /[\u4e00-\u9fff]/);
  for (const word of ['document.', 'window.', 'localStorage', 'sessionStorage', 'fetch(', 'XMLHttpRequest', 'bhcsScienceTrack']) {
    assert.ok(!src.includes(word), word);
  }
});

console.log(`photosynthesis-guided model: ${tests} tests passed`);
