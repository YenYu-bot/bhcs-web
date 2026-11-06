import test from 'node:test';
import assert from 'node:assert/strict';
import { METALS, FRESH, place, finish, restore, conclusions } from '../../tools/metal-activity-desk/model.mjs';

const snapshot = cups => JSON.stringify({ version: 1, cups });
const completed = metal => ({ metal, phase: 'done', progress: 1 });

test('fresh cups are clean, independent objects on every reset', () => {
  const first = FRESH();
  assert.equal(first.length, 3);
  assert.deepEqual(first, Array.from({ length: 3 }, () => ({ metal: null, phase: 'fresh', progress: 0 })));
  assert.notEqual(first[0], first[1]);
  const second = FRESH();
  first[0].metal = 'Zn';
  first[1].phase = 'done';
  assert.deepEqual(second, FRESH());
  assert.equal(first[2].metal, null);
});

test('each metal can start in any fresh cup without mutating its input', () => {
  for (const metal of Object.keys(METALS)) {
    for (const index of [0, 1, 2]) {
      const original = FRESH();
      const next = place(original, index, metal);
      assert.deepEqual(original, FRESH());
      assert.deepEqual(next[index], { metal, phase: 'observing', progress: 0 });
      next.forEach((cup, i) => {
        if (i !== index) assert.deepEqual(cup, { metal: null, phase: 'fresh', progress: 0 });
      });
    }
  }
});

test('placement rejects out-of-bounds and non-integer cup indexes', () => {
  const cups = FRESH();
  for (const index of [-1, 3, 100, 0.5, NaN, Infinity, -Infinity, '0', null, undefined]) {
    assert.equal(place(cups, index, 'Zn'), cups, `index ${String(index)} must be a no-op`);
  }
});

test('placement rejects unknown, inherited, injected and non-string metals', () => {
  const cups = FRESH();
  const invalid = ['Al', 'zn', '', '__proto__', 'constructor', 'toString', '<img src=x onerror=alert(1)>', null, undefined, 1, {}, ['Zn'], ['Cu']];
  for (const metal of invalid) {
    assert.equal(place(cups, 0, metal), cups, `metal ${JSON.stringify(metal)} must be a no-op`);
  }
});

test('used cups reject repeated placement and mixing, even after completion', () => {
  for (const phase of ['observing', 'paused', 'done']) {
    const cups = FRESH();
    cups[1] = { metal: 'Zn', phase, progress: phase === 'done' ? 1 : 0 };
    for (const metal of ['Zn', 'Fe', 'Cu']) assert.equal(place(cups, 1, metal), cups);
    assert.equal(cups[1].metal, 'Zn');
    assert.equal(cups[0].phase, 'fresh');
    assert.equal(cups[2].phase, 'fresh');
  }
});

test('finishing observation records exactly one result and is idempotent', () => {
  let cups = place(FRESH(), 0, 'Fe');
  cups[0].progress = 0.45;
  const observing = cups;
  cups = finish(cups, 0);
  assert.deepEqual(cups[0], completed('Fe'));
  assert.equal(observing[0].phase, 'observing');
  assert.equal(observing[0].progress, 0.45);
  assert.equal(finish(cups, 0), cups);
  assert.deepEqual(cups.slice(1), FRESH().slice(1));
});

test('paused observations may finish; empty and invalid cups never produce evidence', () => {
  const cups = FRESH();
  cups[2] = { metal: 'Cu', phase: 'paused', progress: 0 };
  assert.deepEqual(finish(cups, 2)[2], completed('Cu'));
  for (const index of [-1, 0, 1, 3, NaN, undefined]) assert.equal(finish(cups, index), cups);
  assert.deepEqual(conclusions(cups), []);
});

test('three concurrent observations complete independently in any order', () => {
  let cups = place(place(place(FRESH(), 0, 'Zn'), 1, 'Fe'), 2, 'Cu');
  cups = finish(cups, 2);
  assert.equal(cups[0].phase, 'observing');
  assert.equal(cups[1].phase, 'observing');
  assert.deepEqual(conclusions(cups).map(c => c.metal), ['Cu']);
  cups = finish(finish(cups, 0), 1);
  assert.deepEqual(cups, ['Zn', 'Fe', 'Cu'].map(completed));
  assert.deepEqual(new Set(conclusions(cups).map(c => c.relation)), new Set(['Zn > Cu', 'Fe > Cu', '無淨置換']));
});

test('restore rejects malformed, incompatible and structurally corrupt snapshots', () => {
  const bad = [null, undefined, '', '{', 'null', '[]', '{}', JSON.stringify({ version: 2, cups: FRESH() }), JSON.stringify({ version: 1, cups: null }), snapshot([]), snapshot(FRESH().slice(1)), snapshot([...FRESH(), ...FRESH()])];
  for (const raw of bad) assert.equal(restore(raw), null, `snapshot ${raw} must be rejected`);
  for (const badCup of [null, 0, [], {}, { metal: 'Zn', phase: 'fresh' }, { metal: null, phase: 'done' }, { metal: 'Fe', phase: 'unknown' }, { metal: 'Ag', phase: 'observing' }]) {
    const cups = FRESH(); cups[0] = badCup;
    assert.equal(restore(snapshot(cups)), null);
  }
});

test('restore rejects prototype-name, markup and coerced metal identities', () => {
  for (const metal of ['__proto__', 'constructor', 'toString', '<svg onload=alert(1)>', ['Zn'], ['Fe'], ['Cu'], { toString: 'Cu' }]) {
    for (const phase of ['observing', 'paused', 'done']) {
      const cups = FRESH(); cups[0] = { metal, phase, progress: 1 };
      assert.equal(restore(snapshot(cups)), null, `${JSON.stringify(metal)} / ${phase} must be rejected`);
    }
  }
});

test('restore normalizes progress and strips untrusted extra fields', () => {
  const cups = [
    { metal: null, phase: 'fresh', progress: 999, html: '<script>bad()</script>' },
    { metal: 'Zn', phase: 'done', progress: -100, result: 'Zn < Cu' },
    { metal: 'Fe', phase: 'paused', progress: 'invalid', style: 'dangerous' },
  ];
  assert.deepEqual(restore(snapshot(cups)), [
    { metal: null, phase: 'fresh', progress: 0 },
    completed('Zn'),
    { metal: 'Fe', phase: 'paused', progress: 0 },
  ]);
});

test('interrupted restore pauses only unfinished observations and preserves completed evidence', () => {
  const cups = [
    { metal: 'Zn', phase: 'observing', progress: 0.9 },
    completed('Fe'),
    { metal: 'Cu', phase: 'paused', progress: 0.25 },
  ];
  const resumed = restore(snapshot(cups));
  assert.deepEqual(resumed, [
    { metal: 'Zn', phase: 'paused', progress: 0 },
    completed('Fe'),
    { metal: 'Cu', phase: 'paused', progress: 0 },
  ]);
  assert.deepEqual(conclusions(resumed).map(c => c.metal), ['Fe']);
  assert.deepEqual(restore(snapshot(resumed)), resumed, 'repeated reload must be stable');
  assert.deepEqual(conclusions(finish(resumed, 0)).map(c => c.metal), ['Zn', 'Fe']);
});

test('fresh and completed snapshots round-trip without inventing observations', () => {
  assert.deepEqual(restore(snapshot(FRESH())), FRESH());
  const done = ['Zn', 'Fe', 'Cu'].map(completed);
  assert.deepEqual(restore(snapshot(done)), done);
});

test('conclusions are supported only by completed evidence and do not infer missing metals', () => {
  assert.deepEqual(conclusions(FRESH()), []);
  const partial = [completed('Zn'), { metal: 'Fe', phase: 'observing', progress: 0.99 }, { metal: 'Cu', phase: 'paused', progress: 0 }];
  assert.deepEqual(conclusions(partial).map(c => c.metal), ['Zn']);
  assert.deepEqual(conclusions([completed('Zn'), completed('Zn'), completed('Zn')]).map(c => c.relation), ['Zn > Cu']);
  assert.deepEqual(conclusions([completed('Cu'), completed('Cu'), completed('Cu')]).map(c => c.relation), ['無淨置換']);
});

test('all 27 completed cup combinations never claim a Zn-versus-Fe ordering', () => {
  for (const a of ['Zn', 'Fe', 'Cu']) for (const b of ['Zn', 'Fe', 'Cu']) for (const c of ['Zn', 'Fe', 'Cu']) {
    const rows = conclusions([a, b, c].map(completed));
    assert.deepEqual(new Set(rows.map(row => row.metal)), new Set([a, b, c]));
    for (const row of rows) {
      assert.ok(['Zn > Cu', 'Fe > Cu', '無淨置換'].includes(row.relation));
      assert.doesNotMatch(JSON.stringify(row), /Zn\s*[<>＝=]\s*Fe|Fe\s*[<>＝=]\s*Zn/);
    }
  }
});

test('chemistry uses copper deposition for Zn and Fe, Fe(II), and no net Cu displacement', () => {
  assert.equal(METALS.Zn.equation, 'Zn + Cu²⁺ → Zn²⁺ + Cu');
  assert.equal(METALS.Fe.equation, 'Fe + Cu²⁺ → Fe²⁺ + Cu');
  for (const metal of ['Zn', 'Fe']) {
    assert.match(METALS[metal].result, /紅棕色銅/);
    assert.match(METALS[metal].result, /藍色變淡/);
  }
  assert.match(METALS.Fe.result, /可能帶淺綠色/);
  assert.match(METALS.Cu.result, /未見新的銅析出/);
  assert.match(METALS.Cu.result, /沒有明顯變化/);
  assert.equal(METALS.Cu.equation, 'Cu + Cu²⁺：無淨置換反應');
});
