// 純 Node 快速自測；正式驗收以 test_math_drills.mjs 與 P3 CI 為準。
// 用法：node scripts/math_local_check.mjs <引擎 HTML> <topic> [每組抽題數]；或 --all [每組抽題數]
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {assertMathDrillCoverage} from './math_drill_discovery.mjs';

const args = process.argv.slice(2);
if (args[0] === '--all') {
  const countText = args[1] || '40', count = Number(countText);
  if (!Number.isSafeInteger(count) || count < 1 || count > 1000) {
    console.error('用法：node scripts/math_local_check.mjs --all [每組抽題數 1–1000]');
    process.exit(2);
  }
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const discovery = assertMathDrillCoverage(root);
  const links = discovery.links;
  console.log(`AUTO ${links.length} topics across ${discovery.engineFiles.length} drill engines; orphan check PASS`);
  let failedTopics = 0;
  for (const link of links) {
    const url = new URL(link, 'https://www.bhcs.com.tw/tools/math/');
    const file = path.join(root, url.pathname);
    const rel = path.relative(process.cwd(), file);
    const result = spawnSync(process.execPath, [fileURLToPath(import.meta.url), rel, url.searchParams.get('topic'), countText],
      {stdio: 'inherit'});
    if (result.status !== 0) failedTopics++;
  }
  console.log(failedTopics ? `FAIL ${failedTopics} topics` : `PASS AUTO ${links.length} topics`);
  process.exit(failedTopics ? 1 : 0);
}

const [file, topic, countText = '200'] = args;
const count = Number(countText);
if (!file || !topic || !Number.isSafeInteger(count) || count < 1 || count > 1000) {
  console.error('用法：node scripts/math_local_check.mjs <引擎 HTML> <topic> [每組抽題數 1–1000]');
  process.exit(2);
}
const html = fs.readFileSync(file, 'utf8');
const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).find(text => text.includes('__BHCS_TEST__'));
if (!script) throw Error('找不到 __BHCS_TEST__ 掛鉤');
let seed = 1;
const randomMath = Object.create(Math);
randomMath.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const context = {console: {warn() {}, log() {}}, location: {search: '?topic=' + topic},
  setTimeout, URLSearchParams, Math: randomMath};
context.globalThis = context;
vm.createContext(context);
new vm.Script('(function(){' + script + '\n})()', {filename: file}).runInContext(context, {timeout: 10000});
const api = context.__BHCS_TEST__;
const cfg = api?.CONFIGS?.[topic] || api?.CFG;
if (!cfg?.units || !api?.safeQuestion) throw Error('找不到 topic ' + topic);
const seedFor = text => {let h = 2166136261; for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0;};
const structure = expr => String(expr).replace(/<span class="fr"><span class="n">([\s\S]*?)<\/span><span class="d">([\s\S]*?)<\/span><\/span>/g, '(($1)/($2))')
  .replace(/<[^>]*>/g, '').replace(/\d+(?:\.\d+)?/g, '#').replace(/\s+/g, ' ').trim();
const norm = sig => String(sig).replace(/<[^>]*>/g, '').replace(/\s+/g, '').normalize('NFKC');
let failed = 0;
for (const unit of cfg.units) for (const level of ['basic', 'advanced', 'challenge'])
  for (const mode of cfg.modes.filter(value => unit.modes.includes(value))) {
    const key = `${topic}/${unit.id}/${level}/${mode}`;
    const options = {level, modes: [mode], mode, mixed: cfg.mixed === true};
    const stats = {ok: 0, exhausted: 0, candidateNull: 0, verifyFalse: 0, exceptions: 0, invalid: 0,
      paper: 0, duplicates: 0, structures: new Set(), examples: []};
    const example = value => {if (stats.examples.length < 2) stats.examples.push(value);};
    const observed = {...unit, gen(ctx) {
      try {
        const q = unit.gen(ctx);
        if (q == null) {stats.candidateNull++; return q;}
        if (typeof q.expr !== 'string' || typeof q.answer !== 'string' ||
            typeof q.sig !== 'string' || !q.sig.trim() || typeof q.verify !== 'function') {
          stats.invalid++; example('題目欄位缺漏'); return q;
        }
        if (q.verify() !== true) {stats.verifyFalse++; example(`verify false：${q.expr}`);}
        return q;
      } catch (error) {
        stats.exceptions++; example(`例外：${error.message}`); throw error;
      }
    }};
    seed = seedFor(key);
    for (let i = 0; i < count; i++) {
      const q = api.safeQuestion(observed, options, new Set());
      if (!q) {stats.exhausted++; continue;}
      stats.ok++; stats.structures.add(structure(q.expr));
    }
    let bank;
    try {bank = typeof unit.bankSize === 'function' ? unit.bankSize(options) : unit.bankSize;}
    catch (error) {stats.exceptions++; example(`bankSize 例外：${error.message}`);}
    const paperLength = Number.isSafeInteger(bank) && bank > 0 ? Math.min(40, bank) : 40;
    seed = seedFor(key + '/paper');
    const seen = new Set(), returned = new Set();
    for (let i = 0; i < paperLength; i++) {
      const q = api.safeQuestion(observed, options, seen);
      if (!q) {if (!(Number.isSafeInteger(bank) && bank > 0)) stats.exhausted++; break;}
      const sig = norm(q.sig);
      if (returned.has(sig)) stats.duplicates++;
      returned.add(sig); stats.paper++;
    }
    const problem = stats.exhausted || stats.verifyFalse || stats.exceptions || stats.invalid || stats.duplicates;
    if (problem) failed++;
    console.log(`${problem ? 'FAIL' : 'PASS'} ${key} ok=${stats.ok}/${count} 耗盡=${stats.exhausted} 候選null=${stats.candidateNull} verify失敗=${stats.verifyFalse} 例外=${stats.exceptions} 欄位錯=${stats.invalid} 卷內重複=${stats.duplicates} 結構數=${stats.structures.size}`);
    for (const item of stats.examples) console.log('  ' + item);
  }
console.log(failed ? `FAIL ${failed} 組` : 'PASS');
process.exitCode = failed ? 1 : 0;
