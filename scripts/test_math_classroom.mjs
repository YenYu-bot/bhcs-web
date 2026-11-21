import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';

function readEngine(grade, topic) {
  const file = new URL(`../tools/math/g${grade}-drills.html`, import.meta.url);
  const html = readFileSync(file, 'utf8');
  const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(m => m[1]).find(s => s.includes('__BHCS_TEST__'));
  assert.ok(script);
  let seed = 20261121;
  const seededMath = Object.create(Math);
  seededMath.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const ctx = {Math:seededMath, location:{search:'?topic='+topic}, URLSearchParams, console};
  runInNewContext('(function(){'+script+'\n})()',ctx);
  return ctx.__BHCS_TEST__.CFG;
}

test('G2 carry sums include exactly ten, and the explanation accounts for incoming carries', () => {
  const carry = readEngine(2,'add').units.find(u=>u.id==='carry');
  assert.match(carry.tip,/個位相加滿 10/);
  assert.match(carry.tip,/十位算上個位進來的 1/);
  assert.match(carry.tip,/52＋48＝100/);
  const examples = new Set();
  for (let i=0; i<1000; i++) {
    const q = carry.gen({level:'basic',modes:['integer']});
    const [kind, a, b] = q.sig.split(':');
    const sum = +a + +b;
    assert.ok(sum>=10 && sum<=18);
    if (kind==='o') assert.equal(Number(q.answer),sum);
    if (kind==='x') assert.equal(Number(q.answer),Number(a));
    if (kind==='t') assert.equal(q.answer,(sum-10)+'；'+sum);
    if (sum===10) examples.add(kind);
  }
  assert.deepEqual([...examples].sort(),['o','x']);
});

test('G6 prism diagrams keep given dimensions but do not print the requested height', () => {
  const prism = readEngine(6,'volume').units.find(u=>u.id==='prism');
  const labels = expr => [...expr.split('</svg>')[0].matchAll(/<text [^>]*>([^<]*)<\/text>/g)].map(m=>m[1]);
  for (const mode of ['integer','decimal','fraction']) {
    const seen = new Set();
    for (const level of ['basic','advanced','challenge']) {
      const ctx = {level,modes:[mode],mode,mixed:false};
      for (let i=0; i<160; i++) {
        const q = prism.gen(ctx);
        if (!q) continue;
        assert.ok(q.verify(),q.sig);
        const ts = labels(q.expr);
        if (/^p(zr|vh):/.test(q.sig)) {
          const trap = q.sig.startsWith('pzr:');
          assert.deepEqual(ts.filter(t=>t==='？'),['？']);
          assert.equal(ts.length,trap?5:3); // schematic caption, given dimensions, unknown height
          assert.match(q.expr,/aria-label="示意圖"/);
          assert.equal(ts[trap?3:2],'？');
          assert.match(q.answer,/cm|公分/);
          seen.add(trap?'trap':'cylinder');
        } else assert.ok(!ts.includes('？'),q.sig);
      }
    }
    assert.deepEqual([...seen].sort(),['cylinder','trap'],mode);
  }
});
