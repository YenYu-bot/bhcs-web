import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {seedFor} from './math_test_harness.mjs';
import {singleFormExemptions} from './math-diversity-policy.mjs';
import {evaluateDiversityRatchet} from './math-diversity-ratchet.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const currentPath = path.resolve(root, process.env.MATH_DIVERSITY_REPORT || 'math-validation-artifacts/diversity-current.json');
const baselinePath = path.join(root, 'docs/math-diversity/baseline-20260922.json');
const levels = ['basic', 'advanced', 'challenge'];
const topicStructureThreshold = 10;
const challengeUnitThreshold = 3;
const isG11 = row => /(?:^|\/)g11-drills\.html(?:\?|$)/.test(row?.link || '');

assert.ok(fs.existsSync(currentPath), `missing diversity report: ${currentPath}`);
assert.ok(fs.existsSync(baselinePath), `missing diversity baseline: ${baselinePath}`);
const current = JSON.parse(fs.readFileSync(currentPath, 'utf8'));
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

const visibleMath = html => {
  let text = String(html).replace(/<svg\b[\s\S]*?<\/svg>/gi, '[圖]');
  const fraction = /<span class="fr"><span class="n">([\s\S]*?)<\/span><span class="d">([\s\S]*?)<\/span><\/span>/g;
  while (fraction.test(text)) text = text.replace(fraction, '(($1)/($2))');
  return text.replace(/<sup>([\s\S]*?)<\/sup>/gi, '^($1)').replace(/<sub>([\s\S]*?)<\/sub>/gi, '_($1)')
    .replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim().normalize('NFKC');
};
const structureOf = html => visibleMath(html).replace(/\d+(?:\.\d+)?/g, '#');
const structureHash = value => crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);

current.schema = Math.max(Number(current.schema) || 0, 3);
current.mode = 'ratchet';
current.blocking = true;
current.g11TopicPolicy = {
  structure: {
    scope: 'topic+difficulty',
    difficulties: levels,
    threshold: topicStructureThreshold,
    metric: 'unique normalized question structures aggregated across all units in the topic'
  },
  challenge: {
    scope: 'topic',
    threshold: challengeUnitThreshold,
    metric: 'qualifying units',
    unitQualification: 'challenge vs basic adds >=1 normalized structure OR numeric median ratio >=2'
  },
  unitLevel: 'baseline no-regression only for produced samples and structureCount; no changed/new full-gate or projected structure/challenge gate for G11'
};
current.projectedTopicGateFailures = [];
current.projectedGateFailures = (current.projectedGateFailures || []).filter(row => !isG11(row));
for (const unit of current.units || []) if (isG11(unit)) unit.p3GatePolicy = 'baseline-no-regression-only';

for (const topicRow of (current.topics || []).filter(isG11)) {
  const link = topicRow.link;
  const url = new URL(link, 'https://www.bhcs.com.tw/tools/math/');
  const html = fs.readFileSync(path.join(root, url.pathname), 'utf8');
  const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1]).find(source => source.includes('globalThis.__BHCS_TEST__'));
  assert.ok(script, `missing hook: ${link}`);

  let seed = seedFor(link);
  const random = () => {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296;};
  const math = Object.create(Math); math.random = random;
  const context = vm.createContext({
    URLSearchParams,
    location: {search: url.search},
    Math: math,
    console: {warn() {}, log() {}}
  });
  new vm.Script(script, {filename: url.pathname}).runInContext(context, {timeout: 10000});
  const api = context.__BHCS_TEST__, cfg = api?.CFG;
  assert.ok(cfg?.units?.length, `missing config: ${link}`);

  const topicStructures = Object.fromEntries(levels.map(level => [level, new Set()]));
  for (const unit of cfg.units) for (const level of levels) {
    seed = seedFor(`${link}/${unit.id}/${level}/diversity`);
    const ctx = {level, modes: cfg.modes.filter(mode => unit.modes.includes(mode)), mixed: cfg.mixed === true};
    for (let i = 0; i < (current.samplesPerLevel || 200); i++) {
      const question = api.safeQuestion(unit, ctx, new Set());
      if (question) topicStructures[level].add(structureOf(question.expr));
    }
  }

  const units = (current.units || []).filter(unit => unit.topic === topicRow.topic && isG11(unit));
  const qualifyingUnits = units.filter(unit =>
    (unit.challengeNewStructureCount || 0) >= 1 || (unit.challengeToBasicMedianRatio ?? -Infinity) >= 2
  ).map(unit => unit.unit);

  topicRow.p3GatePolicy = 'g11-topic';
  topicRow.levels = Object.fromEntries(levels.map(level => {
    const structures = [...topicStructures[level]].sort();
    const structureCount = structures.length;
    if (structureCount < topicStructureThreshold) current.projectedTopicGateFailures.push({
      link,
      topic: topicRow.topic,
      level,
      assert: 'topic_structure_count',
      threshold: topicStructureThreshold,
      current: structureCount
    });
    return [level, {
      structureCount,
      threshold: topicStructureThreshold,
      pass: structureCount >= topicStructureThreshold,
      structureExamples: structures.slice(0, 3).map(structure => ({hash: structureHash(structure), structure}))
    }];
  }));
  topicRow.challengeGate = {
    threshold: challengeUnitThreshold,
    current: qualifyingUnits.length,
    pass: qualifyingUnits.length >= challengeUnitThreshold,
    qualifyingUnits
  };
  if (!topicRow.challengeGate.pass) current.projectedTopicGateFailures.push({
    link,
    topic: topicRow.topic,
    level: 'challenge',
    assert: 'challenge_qualifying_units',
    threshold: challengeUnitThreshold,
    current: qualifyingUnits.length
  });
  topicRow.projectedStructureGatePass = levels.every(level => topicRow.levels[level].pass);
  topicRow.projectedChallengeGatePass = topicRow.challengeGate.pass;
}

const {changedUnits, newUnits, failures} = evaluateDiversityRatchet({
  baseline,
  current,
  exemptions: singleFormExemptions
});
current.ratchet = {
  baseline: 'docs/math-diversity/baseline-20260922.json',
  changedUnits,
  newUnits,
  failures
};
current.summary = {
  ...(current.summary || {}),
  projectedGateFailures: current.projectedGateFailures.length,
  projectedTopicGateFailures: current.projectedTopicGateFailures.length,
  g11Topics: (current.topics || []).filter(isG11).length
};
fs.writeFileSync(currentPath, JSON.stringify(current, null, 2) + '\n');

const topicFailures = failures.filter(failure => failure.topic && !failure.unit).length;
console.log(JSON.stringify({
  diversityRatchet: true,
  changedUnits: changedUnits.length,
  newUnits: newUnits.length,
  topicFailures,
  failures: failures.length
}));
console.log(JSON.stringify({
  g11TopicPolicy: true,
  topics: current.summary.g11Topics,
  projectedTopicGateFailures: current.projectedTopicGateFailures.length
}));
if (failures.length) process.exitCode = 1;
