// Regression contract for .github/workflows/ci.yml itself: triggers, concurrency, the required jobs,
// the CI Gate's fail-closed check, and that nothing the old serial workflows ran has gone missing.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ciWorkflow, ciJobs } from './ci_workflow_test_support.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };

const wf = ciWorkflow();
const jobs = ciJobs(wf);
const REQUIRED = ['core', 'site', 'science-layout', 'science-stations', 'science-guided', 'math-browser', 'math-regression', 'math-diversity'];

/** Top-level block of the workflow (e.g. "on", "concurrency") as raw text. */
function block(key) {
  const lines = wf.split('\n');
  const start = lines.findIndex((l) => l === `${key}:` || l.startsWith(`${key}: `));
  assert.ok(start >= 0, `top-level ${key} exists`);
  const out = [lines[start]];
  for (const l of lines.slice(start + 1)) { if (/^\S/.test(l)) break; out.push(l); }
  return out.join('\n');
}
const count = (s, needle) => s.split(needle).length - 1;

test('legacy standalone math workflow is removed so math runs only through CI Gate', () => {
  assert.equal(fs.existsSync(path.join(root, '.github/workflows/math-fix-regressions.yml')), false,
    'legacy math-fix-regressions.yml must stay deleted');
});

test('triggers: every pull request, pushes to main, and a manual run', () => {
  const on = block('on');
  assert.match(on, /\n {2}pull_request:\s*(\n|$)/, 'pull_request with no branch filter');
  assert.ok(!/\n {2}pull_request:\s*\n {4}branches/.test(on), 'pull_request is not limited to some base branches');
  assert.match(on, /\n {2}push:\n {4}branches: \[[^\]]*\bmain\b[^\]]*\]/, 'push to main');
  assert.match(on, /\n {2}workflow_dispatch:/, 'manual run');
});

test('concurrency: a PR re-push cancels its own older run; main runs are grouped per commit and never cancelled', () => {
  const c = block('concurrency');
  assert.ok(c.includes('group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.sha }}'), 'PR number, otherwise the commit');
  assert.ok(c.includes("cancel-in-progress: ${{ github.event_name == 'pull_request' }}"), 'cancel only for pull requests');
  assert.ok(!c.includes('github.ref'), 'not grouped by branch: a third push to main would drop the queued second run');
});

test('the eight required jobs exist and CI Gate needs exactly them', () => {
  for (const id of REQUIRED) assert.ok(jobs[id], `job ${id}`);
  assert.ok(jobs.gate, 'gate job');
  assert.deepEqual([...jobs.gate.needs].sort(), [...REQUIRED].sort(), 'CI Gate needs every required job and nothing else');
  assert.deepEqual(Object.keys(jobs).filter((id) => id !== 'gate').sort(), [...REQUIRED].sort(), 'no job runs outside the gate');
});

test('CI Gate always runs and fails unless every required job succeeded', () => {
  const g = jobs.gate.text;
  assert.match(g, /(^|\n) {4}name: CI Gate\n/, 'fixed check name "CI Gate"');
  assert.match(g, /(^|\n) {4}if: always\(\)\n/, 'runs even when a job failed or was skipped');
  assert.ok(g.includes('RESULTS: ${{ toJSON(needs) }}'), 'reads every needed job result');
  assert.ok(g.includes(`jq -e 'length == ${REQUIRED.length} and all(.[]; .result == "success")'`), 'skipped, cancelled and failed all count as not passed');
});

test('every script the old serial workflows ran still runs exactly once', () => {
  const OLD_RESEARCHER = [
    'build_math_brand.mjs', 'build_microscope.mjs', 'build_resources.py', 'build_science.mjs', 'build_shell.py', 'build_site.mjs', 'build_sitemap.py',
    'check_acid_base_guided_flow_browser.cjs', 'check_acid_base_guided_input_browser.cjs', 'check_acid_base_guided_view_browser.cjs',
    'check_buoyancy_guided_flow_browser.cjs', 'check_buoyancy_guided_input_browser.cjs', 'check_buoyancy_guided_view_browser.cjs',
    'check_math_brand_browser.cjs', 'check_microscope_guided_flow_browser.cjs', 'check_microscope_guided_input_browser.cjs', 'check_microscope_guided_view_browser.cjs',
    'check_optics_guided_flow_browser.cjs', 'check_optics_guided_input_browser.cjs', 'check_optics_guided_view_browser.cjs',
    'check_p4_vector_browser.cjs', 'check_researcher_browser.cjs', 'check_researcher_composition.cjs', 'check_researcher_operations.cjs',
    'check_resources.py', 'check_science_integration.cjs', 'check_site_browser.cjs', 'classify_math_drills.mjs',
    'test_researcher_batch1.cjs', 'test_researcher_batch2.cjs', 'test_researcher_batch3.cjs', 'test_researcher_batch4.cjs', 'test_researcher_batch5.cjs',
  ];
  const OLD_MATH = ['math_local_check.mjs', 'test_math_drills.mjs', 'enforce_math_diversity.mjs', 'print_math_diversity_failures.cjs'];
  assert.equal(OLD_RESEARCHER.length, 33);
  for (const s of [...OLD_RESEARCHER, ...OLD_MATH]) {
    assert.equal(count(wf, `scripts/${s}`), 1, `scripts/${s} runs exactly once`);
    assert.ok(fs.existsSync(path.join(root, 'scripts', s)), `scripts/${s} exists`);
  }
  assert.equal(count(wf, 'npm test --prefix scripts'), 1, 'the unit test chain runs once');
  assert.equal(count(wf, 'run: git diff --exit-code\n'), 1, 'one build idempotence check');
  assert.ok(jobs.core.text.includes('git diff --exit-code -- docs/p2-math-validation'), 'P2 classification is checked');
});

test('every artifact the old workflows uploaded is still uploaded once, kept 14 days', () => {
  const REVIEW = [
    ['p2-math-validation', 'math-validation-artifacts/'], ['researcher-composition-review', 'composition-artifacts/'], ['researcher-operation-review', 'operation-artifacts/'],
    ['optics-view-review', 'optics-view-artifacts/'], ['optics-flow-review', 'optics-flow-artifacts/'], ['buoyancy-view-review', 'buoyancy-view-artifacts/'],
    ['buoyancy-flow-review', 'buoyancy-flow-artifacts/'], ['microscope-view-review', 'microscope-view-artifacts/'], ['microscope-flow-review', 'microscope-flow-artifacts/'],
    ['acid-base-view-review', 'acid-base-view-artifacts/'], ['acid-base-flow-review', 'acid-base-flow-artifacts/'], ['public-site-review', 'site-artifacts/'],
    ['p1-math-brand-review', 'math-brand-artifacts/'], ['p4-vector-review', 'p4-vector-artifacts/'],
  ];
  assert.equal(REVIEW.length, 14);
  for (const [name, dir] of REVIEW) {
    assert.equal(count(wf, `name: ${name}\n`), 1, `${name} uploaded once`);
    assert.ok(wf.includes(`name: ${name}\n          path: ${dir}\n          retention-days: 14`), `${name} → ${dir}, 14 days`);
  }
  assert.equal(count(wf, 'name: math-validation-artifacts\n'), 1, 'the math diversity report is uploaded');
});

test('browser jobs install Chromium before their checks; every browser check gets the Playwright NODE_PATH', () => {
  for (const id of ['site', 'science-layout', 'science-stations', 'science-guided', 'math-browser']) {
    const t = jobs[id].text;
    const install = t.indexOf('playwright install --with-deps chromium');
    assert.ok(install >= 0 && count(t, 'playwright install --with-deps chromium') === 1, `${id} installs Chromium once`);
    for (const m of t.matchAll(/run: node scripts\/(check_[a-z_0-9]+\.cjs)/g)) {
      assert.ok(m.index > install, `${m[1]} runs after the install in ${id}`);
      assert.match(t, new RegExp(`NODE_PATH: /tmp/bhcs-composition/node_modules\\n(?: {10}\\S.*\\n)*\\s+run: node scripts/${m[1].replace(/\./g, '\\.')}`), `${m[1]} has NODE_PATH`);
    }
  }
});

test('math regression: four shards cover every regression file exactly once', () => {
  const t = jobs['math-regression'].text;
  assert.match(t, /\n {6}fail-fast: false\n/, 'one failing shard does not hide the others');
  assert.match(t, /\n {8}shard: \[0, 1, 2, 3\]\n/, 'shards 0–3');
  assert.match(t, /\n {10}TOTAL: 4\n/, 'TOTAL matches the matrix');
  assert.ok(t.includes("find scripts/math-regressions -maxdepth 1 -name '*.mjs' ! -name helper.mjs | LC_ALL=C sort"), 'file list');
  assert.ok(t.includes('if (( i % TOTAL == SHARD )); then'), 'round-robin by index');
  const files = fs.readdirSync(path.join(root, 'scripts/math-regressions')).filter((f) => f.endsWith('.mjs') && f !== 'helper.mjs').sort();
  assert.ok(files.length > 0);
  const seen = new Map();
  for (let shard = 0; shard < 4; shard++) files.forEach((f, i) => { if (i % 4 === shard) seen.set(f, (seen.get(f) ?? 0) + 1); });
  assert.deepEqual([...seen.keys()].sort(), files, 'every file lands in a shard');
  assert.ok([...seen.values()].every((n) => n === 1), 'and in only one');
});

test('standalone microscope browser gate is additive and runs in science-stations', () => {
  assert.equal(count(wf, 'scripts/check_microscope_3d_browser.cjs'), 1);
  assert.ok(jobs['science-stations'].text.includes('run: node scripts/check_microscope_3d_browser.cjs'));
  assert.ok(fs.existsSync(path.join(root, 'scripts/check_microscope_3d_browser.cjs')));
  assert.ok(wf.includes('name: microscope-3d-review\n          path: microscope-3d-artifacts/\n          retention-days: 14'));
  assert.ok(JSON.parse(fs.readFileSync(path.join(root, 'scripts/package.json'), 'utf8')).scripts.test.includes('node test_microscope_3d_integration.mjs'));
});

console.log(`ci workflow: ${tests} tests passed`);
