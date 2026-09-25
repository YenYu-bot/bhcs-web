import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {JSDOM, VirtualConsole} from 'jsdom';
import {auditCombination, seedFor, checkHarnessContract} from './math_test_harness.mjs';
import {singleFormExemptions, singleFormKey, singleFormPolicy} from './math-diversity-policy.mjs';
import {evaluateDiversityRatchet} from './math-diversity-ratchet.mjs';
import {assertMathDrillCoverage} from './math_drill_discovery.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const discovery=assertMathDrillCoverage(root);
const links=discovery.links;
console.log(JSON.stringify({drillDiscovery:true,engines:discovery.engineFiles.length,topics:links.length}));
assert.equal(links.length, 55, 'published topic coverage changed');
assert.equal(new Set(links).size, 55, 'duplicate topic link');
console.log(checkHarnessContract());
const report = {schema: 3, specification: '2.4 safeQuestion revision 2026-09-22',
  requirement: '200 independent safeQuestion calls with 50 retries; null rejection is diagnostic; candidate exceptions/verify failures remain blocking; unique sig per paper and declared bank coverage',
  targetPerCombination: 200, topics: [], combinations: [], failures: []};
const diversityGate = process.env.MATH_DIVERSITY_GATE === '1';
const diversityOutput = process.env.MATH_DIVERSITY_REPORT || (diversityGate ? 'math-validation-artifacts/diversity-current.json' : '');
assert.equal(singleFormExemptions.length, 21, 'singleForm ruling must contain exactly 21 entries');
assert.equal(singleFormPolicy.size, 21, 'singleForm ruling contains duplicate topic/unit keys');
const diversity = diversityOutput ? {schema: 2, mode: diversityGate ? 'ratchet' : 'report-only', blocking: diversityGate, samplesPerLevel: 200,
  normalization: 'SVG→[圖], fractions/superscripts/subscripts kept structurally, every numeric literal→#, signs/coefficient positions/comparison symbols retained',
  generatedAt: '2026-09-22', topics: [], units: [], projectedGateFailures: []} : null;
const visibleMath = html => {
  let text = String(html).replace(/<svg\b[\s\S]*?<\/svg>/gi, '[圖]');
  const fraction = /<span class="fr"><span class="n">([\s\S]*?)<\/span><span class="d">([\s\S]*?)<\/span><\/span>/g;
  while (fraction.test(text)) text = text.replace(fraction, '(($1)/($2))');
  return text.replace(/<sup>([\s\S]*?)<\/sup>/gi, '^($1)').replace(/<sub>([\s\S]*?)<\/sub>/gi, '_($1)')
    .replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim().normalize('NFKC');
};
const structureOf = html => visibleMath(html).replace(/\d+(?:\.\d+)?/g, '#');
const structureHash = value => crypto.createHash('sha256').update(value).digest('hex').slice(0,16);
const numbersOf = html => [...visibleMath(html).matchAll(/\d+(?:\.\d+)?/g)].map(m => Number(m[0])).filter(Number.isFinite);
const median = values => {if (!values.length) return null; const sorted=[...values].sort((a,b)=>a-b),m=Math.floor(sorted.length/2);return sorted.length%2?sorted[m]:(sorted[m-1]+sorted[m])/2;};
for (const link of links) {
  const url = new URL(link, 'https://www.bhcs.com.tw/tools/math/');
  const html = fs.readFileSync(path.join(root, url.pathname), 'utf8');
  const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).find(s => s.includes('globalThis.__BHCS_TEST__'));
  assert.ok(script, `missing hook: ${link}`);
  let seed = seedFor(link);
  const random = () => {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296;};
  const math = Object.create(Math); math.random = random;
  const context = vm.createContext({URLSearchParams, location: {search: url.search}, Math: math, console: {warn() {}, log() {}}});
  new vm.Script(script, {filename: url.pathname}).runInContext(context, {timeout: 10000});
  const api = context.__BHCS_TEST__, cfg = api?.CFG;
  assert.ok(cfg?.units?.length, `missing config: ${link}`);
  const uiErrors = [], vc = new VirtualConsole(); vc.on('jsdomError', e => uiErrors.push(e.message));
  // Read the real generated input.max. This is DOM inspection, not visual acceptance.
  const dom = new JSDOM(html, {url: url.href, runScripts: 'dangerously', virtualConsole: vc,
    beforeParse(w) {
      w.Math.random = random; w.print = () => {};
      w.matchMedia = media => ({media, matches: false, addEventListener() {}, removeEventListener() {}});
    }});
  assert.deepEqual(uiErrors, [], `${link}: interface failed to initialize`);
  report.topics.push({link, title: cfg.title, units: cfg.units.length});
  for (const unit of cfg.units) for (const level of ['basic', 'advanced', 'challenge'])
    for (const mode of cfg.modes.filter(m => unit.modes.includes(m))) {
      const key = `${url.pathname}?${url.searchParams}/${unit.id}/${level}/${mode}`;
      const d = dom.window.document;
      d.querySelector(`button[data-level="${level}"]`).click();
      for (const input of d.querySelectorAll('input[data-mode]')) {
        input.checked = input.dataset.mode === mode;
        input.dispatchEvent(new dom.window.Event('change', {bubbles: true}));
      }
      const input = d.querySelector(`input[data-count="${unit.id}"]`);
      const uiMax = Number(input?.max);
      const ctx = {level, modes: [mode], mixed: cfg.mixed === true};
      let row;
      context.runAudit = () => auditCombination({unit, ctx, uiMax, safeQuestion: api.safeQuestion,
        contentGuard: api.contentGuard,
        seed: seedFor(key), resetRandom(value) {seed = value;}});
      try {row = vm.runInContext('runAudit()', context, {timeout: 15000});}
      catch (e) {row = {pass: false, issues: [{code: 'harness_or_timeout', detail: e.message}]};}
      Object.assign(row, {link, topic: url.searchParams.get('topic'), unit: unit.id, name: unit.name, level, mode});
      report.combinations.push(row);
      if (!row.pass) report.failures.push({link, unit: unit.id, level, mode, issues: row.issues});
    }
  if (diversity) {
    const topic = {link, topic: url.searchParams.get('topic'), title: cfg.title, unitIds: []};
    for (const unit of cfg.units) {
      const policy = singleFormPolicy.get(singleFormKey(topic.topic,unit.id));
      const unitRow = {link, topic: topic.topic, unit: unit.id, name: unit.name,
        singleForm: policy?.singleForm === true, singleFormReason: policy?.reason || null, levels: {}};
      for (const level of ['basic', 'advanced', 'challenge']) {
        const ctx = {level, modes: cfg.modes.filter(mode => unit.modes.includes(mode)), mixed: cfg.mixed === true};
        const structures = new Set(), values = [], samples = []; let produced = 0, exhausted = 0;
        seed = seedFor(`${link}/${unit.id}/${level}/diversity`);
        for (let i=0;i<diversity.samplesPerLevel;i++) {
          const q = api.safeQuestion(unit, ctx, new Set());
          if (!q) {exhausted++; continue;}
          produced++; structures.add(structureOf(q.expr)); values.push(...numbersOf(q.expr));
          samples.push(`${visibleMath(q.expr)}\u241f${visibleMath(q.answer)}`);
        }
        unitRow.levels[level] = {requested: diversity.samplesPerLevel, produced, exhausted,
          structureCount: structures.size, structures: [...structures].sort(), numberMedian: median(values), numericLiteralCount: values.length,
          sampleFingerprint: crypto.createHash('sha256').update(samples.join('\n')).digest('hex')};
      }
      const basic = new Set(unitRow.levels.basic.structures), challenge = new Set(unitRow.levels.challenge.structures);
      const challengeNewStructures = [...challenge].filter(value => !basic.has(value)).sort();
      const b = unitRow.levels.basic.numberMedian, c = unitRow.levels.challenge.numberMedian;
      unitRow.challengeToBasicMedianRatio = b > 0 && c !== null ? c / b : null;
      unitRow.projectedStructureGatePass = unitRow.singleForm || Object.values(unitRow.levels).every(row => row.structureCount >= 3);
      unitRow.projectedChallengeGatePass = challengeNewStructures.length >= 1 || unitRow.challengeToBasicMedianRatio >= 2;
      if (!unitRow.projectedStructureGatePass || !unitRow.projectedChallengeGatePass)
        diversity.projectedGateFailures.push({link, topic: unitRow.topic, unit: unitRow.unit, name: unitRow.name,
          structureGate: unitRow.projectedStructureGatePass, challengeGate: unitRow.projectedChallengeGatePass});
      unitRow.challengeNewStructureCount = challengeNewStructures.length;
      unitRow.challengeNewStructureExamples = challengeNewStructures.slice(0,2).map(structure => ({hash:structureHash(structure),structure}));
      unitRow.outputFingerprint = crypto.createHash('sha256').update(JSON.stringify({
        levels:Object.fromEntries(Object.entries(unitRow.levels).map(([level,row])=>[level,{structures:row.structures,sampleFingerprint:row.sampleFingerprint}])),
        challengeNewStructures
      })).digest('hex');
      unitRow.levels = Object.fromEntries(Object.entries(unitRow.levels).map(([level,row]) => {
        const values=row.structures;delete row.structures;
        row.structureExamples=values.slice(0,2).map(structure=>({hash:structureHash(structure),structure}));
        return [level,row];
      }));
      topic.unitIds.push(unit.id); diversity.units.push(unitRow);
    }
    diversity.topics.push(topic);
  }
  dom.window.close();
  const rows = report.combinations.filter(r => r.link === link);
  console.log(`${link}: ${rows.filter(r => r.pass).length}/${rows.length} combinations passed`);
}
const sum = (field, key) => report.combinations.reduce((n, r) => n + (r[field]?.[key] || 0), 0);
report.efficiencyWarnings = Object.values(report.combinations
  .filter(r => r.raw?.rejectionRate > .5)
  .reduce((groups, r) => {
    const key = `${r.link}/${r.unit}`;
    const group = groups[key] ||= {link: r.link, topic: r.topic, unit: r.unit, name: r.name,
      combinations: [], maximumRejectionRate: 0};
    group.combinations.push({level: r.level, mode: r.mode, rejectionRate: r.raw.rejectionRate,
      candidateCalls: r.raw.calls, nulls: r.raw.nulls});
    group.maximumRejectionRate = Math.max(group.maximumRejectionRate, r.raw.rejectionRate);
    return groups;
  }, {}));
report.summary = {topics: report.topics.length, combinations: report.combinations.length,
  passed: report.combinations.filter(r => r.pass).length, failed: report.failures.length,
  samplingSafeQuestionCalls: 200 * report.combinations.length, samplingProduced: sum('sampling', 'produced'),
  candidateGenCalls: sum('raw', 'calls'), candidateNulls: sum('raw', 'nulls'), candidateVerifyFalse: sum('raw', 'verifyFalse'),
  candidateExceptions: sum('raw', 'exceptions'), efficiencyWarningUnits: report.efficiencyWarnings.length,
  efficiencyWarningCombinations: report.combinations.filter(r => r.raw?.rejectionRate > .5).length,
  declaredBankCombinations: report.combinations.filter(r => r.bankDeclared).length,
  paperCompleted: report.combinations.filter(r => r.paper?.produced === r.paper?.requested).length,
  paperExhausted: report.combinations.filter(r => r.paper?.exhaustedAt !== null && r.paper?.exhaustedAt !== undefined).length};
const output = process.env.MATH_REPORT || path.join(root, 'math-validation-artifacts/results.json');
fs.mkdirSync(path.dirname(output), {recursive: true}); fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
if (diversity) {
  diversity.summary = {topics: diversity.topics.length, units: diversity.units.length,
    samplesRequested: diversity.units.length * 3 * diversity.samplesPerLevel,
    samplesProduced: diversity.units.reduce((n,u)=>n+Object.values(u.levels).reduce((m,row)=>m+row.produced,0),0),
    samplesExhausted: diversity.units.reduce((n,u)=>n+Object.values(u.levels).reduce((m,row)=>m+row.exhausted,0),0),
    projectedGateFailures: diversity.projectedGateFailures.length};
  if (diversityGate) {
    const baselinePath = path.join(root,'docs/math-diversity/baseline-20260922.json');
    const baseline = JSON.parse(fs.readFileSync(baselinePath,'utf8'));
    const {changedUnits,newUnits,failures}=evaluateDiversityRatchet({baseline,current:diversity,exemptions:singleFormExemptions});
    diversity.ratchet={baseline:'docs/math-diversity/baseline-20260922.json',changedUnits,newUnits,failures};
    console.log(JSON.stringify({diversityRatchet:true,changedUnits:changedUnits.length,newUnits:newUnits.length,failures:failures.length}));
    if (failures.length) process.exitCode=1;
  }
  const target = diversityOutput === '1' ? path.join(root,'math-validation-artifacts/diversity-baseline.json') : path.resolve(root,diversityOutput);
  fs.mkdirSync(path.dirname(target), {recursive: true}); fs.writeFileSync(target, JSON.stringify(diversity, null, 2) + '\n');
  console.log(JSON.stringify({diversityReport: target, ...diversity.summary}));
}
console.log(JSON.stringify(report.summary));
if (report.failures.length) process.exitCode = 1;
