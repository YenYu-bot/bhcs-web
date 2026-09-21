import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

// P2 diagnostic gate: 200 distinct, verified questions per published combination.
// Do not weaken the gate or enlarge curricular ranges merely to turn it green.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/p1-math-brand/manifest.json')));
const links = manifest.links.filter(link => /g(?:6|10|11)-drills\.html\?topic=/.test(link));
assert.equal(links.length, 52, 'published topic coverage changed');
const report = {schema: 1, baseline: 'd2ded3ec3be5235483e5345ee03090e2cfa8e1ff',
  requirement: '200 unique sig values per topic/unit/level/mode, using the existing 50-attempt safeQuestion',
  targetPerCombination: 200, topics: [], combinations: [], failures: []};
const normal = value => String(value).replace(/<[^>]*>/g, '').replace(/\s+/g, '').normalize('NFKC');
function seedFor(text) {let h = 2166136261; for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0;}
for (const link of links) {
  const url = new URL(link, 'https://www.bhcs.com.tw/tools/math/');
  const html = fs.readFileSync(path.join(root, url.pathname), 'utf8');
  const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).find(s => s.includes('globalThis.__BHCS_TEST__'));
  assert.ok(script, `missing hook: ${link}`);
  const math = Object.create(Math);
  let seed = seedFor(link);
  math.random = () => {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296;};
  const context = vm.createContext({URLSearchParams, location: {search: url.search}, Math: math, console: {warn() {}, log() {}}});
  new vm.Script(script, {filename: url.pathname}).runInContext(context, {timeout: 10000});
  const api = context.__BHCS_TEST__;
  assert.ok(api?.CFG?.units?.length, `missing config: ${link}`);
  const cfg = api.CFG;
  report.topics.push({link, title: cfg.title, units: cfg.units.length});
  for (const unit of cfg.units) for (const level of ['basic', 'advanced', 'challenge']) for (const mode of cfg.modes.filter(m => unit.modes.includes(m))) {
    const key = `${url.pathname}?${url.searchParams}/${unit.id}/${level}/${mode}`;
    seed = seedFor(key);
    const row = {link, unit: unit.id, name: unit.name, level, mode, seed, generated: 0,
      attempts: 0, rejectedNull: 0, rejectedVerify: 0, exceptions: 0, repeatedCandidate: 0,
      repeatedExpressionMarkup: 0, samples: [], invalidExamples: [], pass: false};
    const seen = new Set(), expressions = new Set();
    const wrapped = {...unit, gen(ctx) {
      row.attempts++;
      try {
        const q = unit.gen(ctx);
        if (q == null) row.rejectedNull++;
        else {
          if (typeof q.verify !== 'function' || q.verify() !== true) {
            row.rejectedVerify++;
            if (row.invalidExamples.length < 3) row.invalidExamples.push({expr: q.expr, answer: q.answer, sig: q.sig});
          }
          if (seen.has(normal(q.sig || q.expr))) row.repeatedCandidate++;
        }
        return q;
      } catch (e) {
        row.exceptions++;
        if (row.invalidExamples.length < 3) row.invalidExamples.push({error: e.message});
        throw e;
      }
    }};
    context.runCombination = () => {
      const ctx = {level, modes: [mode], mixed: cfg.mixed === true};
      for (let i = 0; i < 200; i++) {
        const q = api.safeQuestion(wrapped, ctx, seen);
        assert.ok(q, `safeQuestion returned null at question ${i + 1}`);
        assert.equal(typeof q.sig, 'string', 'missing sig');
        assert.ok(q.sig.trim(), 'empty sig');
        assert.equal(q.verify(), true, 'accepted question failed verify');
        assert.equal(api.okResult(q), true, 'accepted question is invalid');
        assert.equal(seen.size, i + 1, 'duplicate signature accepted');
        const expression = q.expr.replace(/\s+/g, ' ').trim().normalize('NFKC');
        if (expressions.has(expression)) row.repeatedExpressionMarkup++;
        expressions.add(expression);
        row.generated++;
        if (row.samples.length < 2) row.samples.push({expr: q.expr, answer: q.answer, sig: q.sig});
      }
    };
    try {
      vm.runInContext('runCombination()', context, {timeout: 15000});
      assert.equal(row.rejectedVerify, 0, 'candidate verify failed (filtered by safeQuestion)');
      assert.equal(row.exceptions, 0, 'candidate generation threw (filtered by safeQuestion)');
      row.pass = true;
    }
    catch (e) {row.error = e.message; report.failures.push({link, unit: unit.id, level, mode, generated: row.generated, error: e.message});}
    report.combinations.push(row);
  }
  const rows = report.combinations.filter(r => r.link === link);
  console.log(`${link}: ${rows.filter(r => r.pass).length}/${rows.length} combinations passed`);
}
report.summary = {topics: report.topics.length, combinations: report.combinations.length,
  completed200: report.combinations.filter(r => r.generated === 200).length,
  passed: report.combinations.filter(r => r.pass).length, failed: report.failures.length,
  generated: report.combinations.reduce((s, r) => s + r.generated, 0),
  rejectedVerify: report.combinations.reduce((s, r) => s + r.rejectedVerify, 0),
  exceptions: report.combinations.reduce((s, r) => s + r.exceptions, 0),
  repeatedExpressionMarkup: report.combinations.reduce((s, r) => s + r.repeatedExpressionMarkup, 0)};
const output = process.env.MATH_REPORT || path.join(root, 'math-validation-artifacts/results.json');
fs.mkdirSync(path.dirname(output), {recursive: true});
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.summary));
if (report.failures.length) process.exitCode = 1;
