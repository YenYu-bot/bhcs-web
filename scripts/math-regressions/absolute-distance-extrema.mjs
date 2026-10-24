import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// No production helpers/verify() are used to compute the answer oracle.
// BHCS_G10_SOURCE permits the identical regression to prove the pinned baseline fails.
const file = process.env.BHCS_G10_SOURCE || new URL('../../tools/math/g10-drills.html', import.meta.url);
const html = fs.readFileSync(file, 'utf8');
const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m => m[1]).find(s => s.includes('globalThis.__BHCS_TEST__'));
let seed = 48213, draws = null;
const math = Object.create(Math);
math.random = () => draws ? (() => {assert.ok(draws.length, 'unexpected random draw'); return draws.shift();})()
  : ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const context = vm.createContext({Math: math, URLSearchParams, location: {search: '?topic=absolute'}});
new vm.Script(script).runInContext(context, {timeout: 10000});
const api = context.__BHCS_TEST__, unit = api.CFG.units.find(u => u.id === 'distance');
assert.deepEqual(Array.from(unit.modes), ['integer'], 'update regression when valid modes change');
const normalize = s => s.replaceAll('−', '-').replaceAll('＋', '+');
const rational = s => {const [n, d] = s.split('/').map(Number); return n / d;};
function checkRange(q) {
  const [, a, b] = q.sig.split(':').map((s, i) => i ? rational(s) : s);
  const terms = [...normalize(q.expr).matchAll(/\|x ([+-]) (\d+)\|/g)];
  assert.equal(terms.length, 2);
  const centers = terms.map(m => (m[1] === '+' ? -1 : 1) * Number(m[2]));
  assert.deepEqual(centers, [a, b], 'question text and signature differ');
  const f = x => Math.abs(x - centers[0]) - Math.abs(x - centers[1]);
  const match = normalize(q.answer).match(/^最大值 (-?\d+)（x([≥≤])(-?\d+) 時），最小值 (-?\d+)（x([≥≤])(-?\d+) 時）$/);
  assert.ok(match, 'answer format changed');
  const [, max, maxOp, maxEnd, min, minOp, minEnd] = match;
  const samples = [Math.min(a,b)-2, Math.min(a,b)-1, a, b, (a+b)/2, Math.max(a,b)+1, Math.max(a,b)+2];
  const values = samples.map(f);
  assert.equal(Number(max), Math.max(...values));
  assert.equal(Number(min), Math.min(...values));
  // Check equality at BOTH boundaries, exterior rays, and interior non-attainment.
  for (const x of samples) {
    const maxClaims = maxOp === '≥' ? x >= Number(maxEnd) : x <= Number(maxEnd);
    const minClaims = minOp === '≥' ? x >= Number(minEnd) : x <= Number(minEnd);
    assert.equal(maxClaims, f(x) === Number(max), `incorrect maximum attainment: ${q.sig}, x=${x}, ${q.answer}`);
    assert.equal(minClaims, f(x) === Number(min), `incorrect minimum attainment: ${q.sig}, x=${x}, ${q.answer}`);
  }
  assert.equal(q.verify(), true);
}

// Original independent counterexample, using the original audit's seeded stream.
let original;
for (let i=0; i<200; i++) {
  const q = unit.gen({level: 'advanced', modes: ['integer'], mixed: false});
  if (q?.sig === 'dr:-8/1:-9/1') {original=q; break;}
}
assert.ok(original, 'original seed no longer reaches the regression fixture');
assert.equal(Math.abs(-7+8)-Math.abs(-7+9), -1);
checkRange(original);
assert.equal(original.answer, '最大值 1（x≤−9 時），最小值 −1（x≥−8 時）');
console.log(JSON.stringify({originalCounterexample: original.expr, answer: original.answer, atMinus7: -1}));

let ranges=0, minima=0, equalRejected=0;
const points = Array.from({length:24}, (_,i) => i<12 ? i-12 : i-11);
for (const level of ['basic','advanced','challenge']) for (const a of points) for (const b of points) {
  // Both real pick wrappers, integer magnitudes/signs, then the level's range branch.
  draws=[0,0,(Math.abs(a)-0.5)/12,a<0?0.25:0.75,(Math.abs(b)-0.5)/12,b<0?0.25:0.75];
  if (a!==b && level!=='basic') draws.push(level==='advanced'?0.75:0.1);
  const q=unit.gen({level,modes:['integer'],mixed:false});
  assert.equal(draws.length,0); draws=null;
  if(a===b){assert.equal(q,null,'equal endpoints remain intentionally excluded');equalRejected++;continue;}
  assert.ok(q);
  if(level==='basic') {
    assert.ok(q.sig.startsWith('ds:'));
    const lo=Math.min(a,b),hi=Math.max(a,b),n=s=>String(s).replace('-','−');
    assert.equal(q.answer,`最小值 ${hi-lo}；[${n(lo)}，${n(hi)}]`);
    for(const x of [lo-1,lo,(lo+hi)/2,hi,hi+1])assert.equal(Math.abs(x-a)+Math.abs(x-b)===hi-lo,x>=lo&&x<=hi);
    assert.equal(q.verify(),true); minima++;
  } else {checkRange(q);ranges++;}
}
for(const mode of ['fraction','decimal'])assert.equal(unit.gen({level:'advanced',modes:[mode],mixed:false}),null);
console.log(JSON.stringify({test:'absolute-distance-extrema',ranges,minima,equalRejected,validModes:Array.from(unit.modes),passed:true}));
