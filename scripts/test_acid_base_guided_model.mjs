// B1 gate: acid–base guided lab science model (Pilot #4). Pure functions, no DOM.
// Also cross-checks the indicator rules against the legacy lab (tools/acid-base-indicator-lab.html), read-only: its inline
// script is parsed with acorn, only the indicator functions are lifted out, and they run in an empty vm context.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';
import * as M from '../assets/acid-base-guided/model.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const root = fileURLToPath(new URL('..', import.meta.url));
const ALL_PH10 = Array.from({ length: 141 }, (_, i) => i);
const obs = (indicatorId, ph10) => M.indicatorObservation({ indicatorId, ph10 });

// ---- legacy extraction --------------------------------------------------------------------------------------------

function loadLegacy() {
  const html = fs.readFileSync(`${root}tools/acid-base-indicator-lab.html`, 'utf8');
  // Only executable inline scripts (no src, no JSON type). Each one is parsed; nothing from the page is evaluated whole.
  const scripts = [...html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .filter(([, attrs = '']) => !/\bsrc=/.test(attrs) && !/type="application\/(ld\+)?json"/.test(attrs))
    .map(([, , body]) => body);
  const wanted = new Set(['indicatorColor', 'universal']);
  const found = new Map();
  for (const src of scripts) {
    const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script' });
    // The legacy functions may sit inside a wrapper, so walk the whole tree, not just the top level.
    const walk = (node) => {
      if (!node || typeof node.type !== 'string') return;
      if (node.type === 'FunctionDeclaration' && wanted.has(node.id.name)) {
        assert.ok(!found.has(node.id.name), `legacy ${node.id.name} is declared more than once`);
        found.set(node.id.name, src.slice(node.start, node.end));
      }
      for (const v of Object.values(node)) for (const child of Array.isArray(v) ? v : [v]) if (child && typeof child === 'object') walk(child);
    };
    walk(ast);
  }
  assert.deepEqual([...found.keys()].sort(), [...wanted].sort(), 'legacy indicatorColor and universal must both be found');
  // The lifted functions must not reach for anything outside themselves except each other.
  const ctx = vm.createContext(Object.create(null));
  vm.runInContext([...found.values()].join('\n') + '\nthis.indicatorColor = indicatorColor; this.universal = universal;', ctx);
  return { indicatorColor: ctx.indicatorColor, universal: ctx.universal };
}
const legacy = loadLegacy();

// Test-only mapping from the legacy page's Chinese names to the model's semantic result ids (the model holds no wording).
const LEGACY_RESULT = {
  'blue-litmus': { '變紅色': 'turns-red', '維持藍色': 'stays-blue' },
  'red-litmus': { '變藍色': 'turns-blue', '維持紅色': 'stays-red' },
  phenolphthalein: { '無色': 'colorless', '淺粉紅色': 'light-pink', '桃紅色': 'pink' },
};
const LEGACY_TYPE = { 'blue-litmus': 'blueLitmus', 'red-litmus': 'redLitmus', phenolphthalein: 'phenolphthalein' };

function legacyAgrees(indicatorId, ph10) {
  const old = legacy.indicatorColor(LEGACY_TYPE[indicatorId], ph10 / 10);
  const now = obs(indicatorId, ph10);
  assert.equal(now.result, LEGACY_RESULT[indicatorId][old.name], `${indicatorId} at ph10 ${ph10}: legacy says ${old.name}, model says ${now.result}`);
  assert.equal(M.COLOR_HEX[now.color], old.hex, `${indicatorId} at ph10 ${ph10}: hex`);
}

// ---- constants and validation ----------------------------------------------------------------------------------------

test('constants: ids, ranges, layouts and colours are fixed and frozen', () => {
  assert.deepEqual([...M.SAMPLE_IDS], ['A', 'B', 'C']);
  assert.deepEqual([...M.INDICATOR_IDS], ['blue-litmus', 'red-litmus', 'phenolphthalein']);
  assert.ok(!M.INDICATOR_IDS.includes('cabbage'), 'cabbage is out of v1');
  assert.deepEqual([...M.KINDS], ['acidic', 'neutral', 'basic']);
  assert.deepEqual({ ...M.KIND_PH10 }, { acidic: 30, neutral: 70, basic: 110 });
  assert.equal(M.LAYOUTS.length, 1);
  assert.deepEqual({ ...M.LAYOUTS[0] }, { A: 'basic', B: 'acidic', C: 'neutral' });
  assert.equal(M.DEFAULT_LAYOUT, 0);
  assert.equal(M.NEUTRAL_PH10, 70);
  for (const o of [M.SAMPLE_IDS, M.INDICATOR_IDS, M.KINDS, M.KIND_PH10, M.LAYOUTS, M.LAYOUTS[0], M.COLOR_HEX, M.RESULT_COLOR]) assert.ok(Object.isFrozen(o));
});

test('ph10 contract: integers 0..140 only; everything else throws RangeError', () => {
  for (const ok of [0, 1, 30, 70, 110, 140]) assert.ok(M.isPh10(ok));
  const bad = [-1, 141, 7.5, 70.0000001, NaN, Infinity, -Infinity, '70', null, undefined, {}, [70], true];
  for (const v of bad) {
    assert.equal(M.isPh10(v), false, `isPh10(${String(v)})`);
    assert.throws(() => M.classifyPh10(v), RangeError, `classifyPh10(${String(v)})`);
    assert.throws(() => obs('blue-litmus', v), RangeError, `indicatorObservation ph10 ${String(v)}`);
  }
});

test('unknown indicator, sample or layout throws RangeError', () => {
  for (const id of ['cabbage', 'universal', 'Blue-Litmus', '', null, undefined, 'constructor']) {
    assert.throws(() => obs(id, 70), RangeError, String(id));
    assert.throws(() => M.indicatorStartColor(id), RangeError, String(id));
  }
  for (const s of ['D', 'a', '', null, 0, 'toString']) assert.throws(() => M.sampleKind(0, s), RangeError, String(s));
  for (const l of [1, -1, 0.5, '0', null, NaN]) assert.throws(() => M.sampleKind(l, 'A'), RangeError, String(l));
  assert.throws(() => M.indicatorObservation(), RangeError);
});

// ---- classification (the 25 °C rule) ---------------------------------------------------------------------------------

test('classification boundary: 69 acidic, 70 neutral, 71 basic (the 25 °C definition, not a litmus switch point)', () => {
  assert.equal(M.classifyPh10(69), 'acidic');
  assert.equal(M.classifyPh10(70), 'neutral');
  assert.equal(M.classifyPh10(71), 'basic');
  for (const p of ALL_PH10) assert.equal(M.classifyPh10(p), p < 70 ? 'acidic' : p === 70 ? 'neutral' : 'basic');
});

test('classification and indicator response are separate functions with separate inputs', () => {
  // classifyPh10 takes only a ph10; indicatorObservation never returns a kind.
  assert.equal(M.classifyPh10.length, 1);
  for (const id of M.INDICATOR_IDS) for (const p of [0, 30, 70, 80, 110, 140]) {
    const o = obs(id, p);
    assert.deepEqual(Object.keys(o).sort(), ['changed', 'color', 'result']);
    assert.ok(!M.KINDS.includes(o.result), `${id} reports an indicator result, never a kind`);
  }
});

// ---- indicators ----------------------------------------------------------------------------------------------------

test('start colours: blue litmus blue, red litmus red, phenolphthalein colourless', () => {
  assert.equal(M.indicatorStartColor('blue-litmus'), 'blue');
  assert.equal(M.indicatorStartColor('red-litmus'), 'red');
  assert.equal(M.indicatorStartColor('phenolphthalein'), 'colorless');
});

test('blue litmus: turns red below ph10 70, otherwise stays blue', () => {
  assert.deepEqual(obs('blue-litmus', 30), { result: 'turns-red', color: 'red', changed: true });
  assert.deepEqual(obs('blue-litmus', 110), { result: 'stays-blue', color: 'blue', changed: false });
  assert.equal(obs('blue-litmus', 69).result, 'turns-red');
  assert.equal(obs('blue-litmus', 70).result, 'stays-blue');
  assert.equal(obs('blue-litmus', 71).result, 'stays-blue');
});

test('red litmus: turns blue above ph10 70, otherwise stays red', () => {
  assert.deepEqual(obs('red-litmus', 110), { result: 'turns-blue', color: 'blue', changed: true });
  assert.deepEqual(obs('red-litmus', 30), { result: 'stays-red', color: 'red', changed: false });
  assert.equal(obs('red-litmus', 69).result, 'stays-red');
  assert.equal(obs('red-litmus', 70).result, 'stays-red');
  assert.equal(obs('red-litmus', 71).result, 'turns-blue');
});

test('phenolphthalein: colourless < 82, light pink 82–100, pink > 100', () => {
  const at = (p) => obs('phenolphthalein', p);
  assert.deepEqual(at(30), { result: 'colorless', color: 'colorless', changed: false });
  assert.deepEqual(at(90), { result: 'light-pink', color: 'light-pink', changed: true });
  assert.deepEqual(at(110), { result: 'pink', color: 'pink', changed: true });
  for (const [p, r] of [[81, 'colorless'], [82, 'light-pink'], [83, 'light-pink'], [99, 'light-pink'], [100, 'light-pink'], [101, 'pink']]) assert.equal(at(p).result, r, `ph10 ${p}`);
});

test('HARD GATE: pH 8.0 is basic and phenolphthalein is still colourless (colourless never rules out a base)', () => {
  assert.equal(M.classifyPh10(80), 'basic');
  assert.equal(obs('phenolphthalein', 80).result, 'colorless');
  // and it is not a single point: every weakly basic ph10 from 71 to 81 is colourless too
  const basicColourless = ALL_PH10.filter((p) => M.classifyPh10(p) === 'basic' && obs('phenolphthalein', p).result === 'colorless');
  assert.deepEqual(basicColourless, [71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81]);
});

test('litmus is documented as a teaching simplification, never as the real switch point', () => {
  const src = fs.readFileSync(`${root}assets/acid-base-guided/model.js`, 'utf8');
  assert.match(src, /teaching simplification/i);
  assert.match(src, /Real litmus has no single switch point/);
  const flat = src.replace(/\n\s*(\/\/|\*)\s?/g, ' ');   // comment text as one line, without the // or * prefixes
  assert.match(flat, /so that it matches the legacy lab and the junior-high classification activity/);
  assert.match(flat, /Nothing built on this function may claim that litmus changes colour at pH 7\./);
});

test('no learner wording in the production modules (no CJK text at all)', () => {
  for (const f of ['model.js', 'engine.js']) {
    const src = fs.readFileSync(`${root}assets/acid-base-guided/${f}`, 'utf8');
    assert.doesNotMatch(src, /[㐀-鿿豈-﫿]/, `${f} holds Chinese text`);
  }
});

// ---- hidden samples ---------------------------------------------------------------------------------------------------

test('hidden samples of layout 0: kind, ph10 and every indicator result', () => {
  const expect = {
    A: { kind: 'basic', ph10: 110, blue: 'stays-blue', red: 'turns-blue', phen: 'pink' },
    B: { kind: 'acidic', ph10: 30, blue: 'turns-red', red: 'stays-red', phen: 'colorless' },
    C: { kind: 'neutral', ph10: 70, blue: 'stays-blue', red: 'stays-red', phen: 'colorless' },
  };
  for (const [id, e] of Object.entries(expect)) {
    assert.equal(M.sampleKind(0, id), e.kind, id);
    assert.equal(M.samplePh10(0, id), e.ph10, id);
    assert.equal(M.classifyPh10(e.ph10), e.kind, `${id} kind agrees with the classification rule`);
    assert.equal(obs('blue-litmus', e.ph10).result, e.blue, id);
    assert.equal(obs('red-litmus', e.ph10).result, e.red, id);
    assert.equal(obs('phenolphthalein', e.ph10).result, e.phen, id);
  }
});

test('hidden pH values sit away from every indicator range used here (except the 25 °C neutral definition itself)', () => {
  for (const p of Object.values(M.KIND_PH10)) for (const id of M.INDICATOR_IDS) {
    if (p === 70) continue;   // neutral is exactly 7 by definition; its litmus results are the "stays" results on both sides
    assert.equal(obs(id, p - 5).result, obs(id, p).result, `${id} near ph10 ${p}`);
    assert.equal(obs(id, p + 5).result, obs(id, p).result, `${id} near ph10 ${p}`);
  }
});

// ---- records ------------------------------------------------------------------------------------------------------------

test('deriveObservation rebuilds everything from layout + sampleId + indicatorId', () => {
  assert.deepEqual(M.deriveObservation({ layoutId: 0, record: { sampleId: 'B', indicatorId: 'blue-litmus' } }), {
    sampleId: 'B', indicatorId: 'blue-litmus', ph10: 30, kind: 'acidic', startColor: 'blue', result: 'turns-red', resultColor: 'red', changed: true,
  });
  assert.deepEqual(M.deriveObservation({ layoutId: 0, record: { sampleId: 'A', indicatorId: 'red-litmus' } }), {
    sampleId: 'A', indicatorId: 'red-litmus', ph10: 110, kind: 'basic', startColor: 'red', result: 'turns-blue', resultColor: 'blue', changed: true,
  });
});

test('forged record fields are ignored: B + blue litmus is acidic and turns red whatever the record claims', () => {
  const forged = { sampleId: 'B', indicatorId: 'blue-litmus', result: 'stays-blue', ph10: 110, kind: 'basic', correct: true, changed: false, resultColor: 'blue' };
  const o = M.deriveObservation({ layoutId: 0, record: forged });
  assert.equal(o.ph10, 30); assert.equal(o.kind, 'acidic'); assert.equal(o.result, 'turns-red'); assert.equal(o.resultColor, 'red'); assert.equal(o.changed, true);
  assert.equal('correct' in o, false);
});

test('persist contract: layout + sampleId + indicatorId alone rebuild every observation (JSON round trip)', () => {
  for (const sampleId of M.SAMPLE_IDS) for (const indicatorId of M.INDICATOR_IDS) {
    const saved = JSON.parse(JSON.stringify({ layout: 0, record: { sampleId, indicatorId } }));
    assert.deepEqual(Object.keys(saved.record).sort(), ['indicatorId', 'sampleId']);
    const o = M.deriveObservation({ layoutId: saved.layout, record: saved.record });
    const p = M.samplePh10(0, sampleId);
    assert.deepEqual(o, { sampleId, indicatorId, ph10: p, kind: M.classifyPh10(p), startColor: M.indicatorStartColor(indicatorId), ...((r) => ({ result: r.result, resultColor: r.color, changed: r.changed }))(obs(indicatorId, p)) });
  }
});

test('deriveObservation returns null for anything it cannot rebuild', () => {
  const bad = [null, undefined, 'B', 3, [], {}, { sampleId: 'B' }, { indicatorId: 'blue-litmus' }, { sampleId: 'D', indicatorId: 'blue-litmus' },
    { sampleId: 'B', indicatorId: 'cabbage' }, Object.create({ sampleId: 'B', indicatorId: 'blue-litmus' })];
  for (const record of bad) assert.equal(M.deriveObservation({ layoutId: 0, record }), null, JSON.stringify(record));
  assert.equal(M.deriveObservation({ layoutId: 1, record: { sampleId: 'B', indicatorId: 'blue-litmus' } }), null);
  assert.equal(M.deriveObservation(), null);
});

test('response signatures: the three kinds give three different [blue, red] patterns', () => {
  const sig = (id) => M.sampleResponseSignature({ layoutId: 0, sampleId: id, indicators: ['blue-litmus', 'red-litmus'] });
  assert.deepEqual(sig('B'), ['turns-red', 'stays-red']);    // acidic
  assert.deepEqual(sig('C'), ['stays-blue', 'stays-red']);   // neutral
  assert.deepEqual(sig('A'), ['stays-blue', 'turns-blue']);  // basic
  assert.equal(new Set(['A', 'B', 'C'].map((id) => sig(id).join('|'))).size, 3);
  // blue litmus alone gives only two patterns: the information gap of Trial 1
  assert.equal(new Set(['A', 'B', 'C'].map((id) => M.sampleResponseSignature({ layoutId: 0, sampleId: id, indicators: ['blue-litmus'] })[0])).size, 2);
  assert.throws(() => M.sampleResponseSignature({ layoutId: 0, sampleId: 'A', indicators: 'blue-litmus' }), RangeError);
  assert.throws(() => M.sampleResponseSignature({ layoutId: 0, sampleId: 'A', indicators: ['cabbage'] }), RangeError);
});

// ---- legacy consistency ---------------------------------------------------------------------------------------------------

test('legacy: every ph10 0..140 respects either shared outer-range results or explicit paper-transition uncertainty', () => {
  // The public legacy lab now represents an approximate pH 4.5–8.3 paper transition.
  // This prototype retains its original classification teaching simplification; do not
  // claim the two indicator models agree inside that band. Both contracts are checked.
  let checked = 0;
  for (const p of ALL_PH10) for (const id of ['blue-litmus', 'red-litmus']) {
    checked++;
    if (p < 45 || p > 83) { legacyAgrees(id, p); continue; }
    const blue = id === 'blue-litmus', old = legacy.indicatorColor(LEGACY_TYPE[id], p / 10);
    const original = blue ? '#365fbd' : '#d94949';
    assert.equal(old.paper, true); assert.equal(old.transition, true);
    assert.equal(old.hex, original, `${id} at ${p}: original-paper identity, not a colour prediction`);
    // Independently retain the prototype's old result/color/changed contract at every
    // transition input; new legacy uncertainty must not silently change this model.
    const changed = blue ? p < 70 : p > 70;
    const result = blue ? (changed ? 'turns-red' : 'stays-blue') : (changed ? 'turns-blue' : 'stays-red');
    const color = blue ? (changed ? 'red' : 'blue') : (changed ? 'blue' : 'red');
    assert.deepEqual(obs(id, p), { result, color, changed });
    if (p === 70) {
      assert.equal(old.uncertain, false);
      assert.equal(old.name, blue ? '維持藍色（中性示意）' : '維持紅色（中性示意）');
      assert.equal(M.COLOR_HEX[obs(id, p).color], old.hex);
      assert.match(old.note, /不能只憑紙色推定恰好 pH 7/);
    } else {
      assert.equal(old.uncertain, true);
      assert.equal(old.name, '過渡範圍，勿作精確判讀');
      assert.match(old.note, /約 pH 4.5–8.3/);
      assert.match(old.note, /斜線與原紙底色只標示紙種及判讀限制/);
      assert.match(old.note, /不推定實際紙色/);
    }
  }
  assert.equal(checked, 282, 'both papers at all 141 pH points, with no skipped transition inputs');
});

test('legacy: phenolphthalein agrees at every ph10 0..140, and at 81/82/83/99/100/101 by name', () => {
  for (const p of ALL_PH10) legacyAgrees('phenolphthalein', p);
  const named = { 81: '無色', 82: '淺粉紅色', 83: '淺粉紅色', 99: '淺粉紅色', 100: '淺粉紅色', 101: '桃紅色' };
  for (const [p, name] of Object.entries(named)) assert.equal(legacy.indicatorColor('phenolphthalein', Number(p) / 10).name, name, `legacy at ph10 ${p}`);
});

test('legacy: universal indicator (kept out of the model) puts the hidden pH 3 / 7 / 11 inside a band, not on an edge', () => {
  const band = { 30: ['橙紅色', '#ef6c00'], 70: ['綠色', '#43a047'], 110: ['藍紫色', '#3949ab'] };
  for (const [p, [name, hex]] of Object.entries(band)) {
    const ph = Number(p) / 10;
    assert.deepEqual({ ...legacy.universal(ph) }, { hex, name }, `universal at pH ${ph}`);
    assert.equal(legacy.universal(ph - 0.5).name, name, `universal just below pH ${ph}`);
    assert.equal(legacy.universal(ph + 0.5).name, name, `universal just above pH ${ph}`);
    assert.deepEqual({ ...legacy.indicatorColor('universal', ph) }, { hex, name });
  }
});

console.log(`acid-base-guided model: ${tests} tests passed`);
