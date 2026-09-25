import {singleFormKey} from './math-diversity-policy.mjs';

const isG11 = row => /(?:^|\/)g11-drills\.html(?:\?|$)/.test(row?.link || '');
const topicStructureThreshold = 10;
export const g11ChallengeFullThreshold = 3;
export const g11ChallengeRolloutBaseline = Object.freeze({
  sequences:4, series:3, standarddev:2, correlation:6, counting:3, permutations:1, combinations:0,
  probability:1, righttrig:6, generalpolar:9, sincosarea:3, radians:2, sector:2, anglesum:2,
  doublehalf:3, trigblend:7, trigtransform:2, expfunctions:8, expequations:2, commonlog:0,
  loggraphs:0, vectorcauchy:2, spaceconcept:5, spacevector:8, spaceinner:8, spacecross:10,
  plane3d:13, line3d:15, conditionalprob:0, bayes:0, matrixops:10, matrixapps:4
});
export const g11ChallengeR3Baseline = Object.freeze({
  sequences:4, series:3, standarddev:5, correlation:7, counting:3, permutations:1, combinations:0,
  probability:1, righttrig:6, generalpolar:9, sincosarea:3, radians:2, sector:2, anglesum:2,
  doublehalf:3, trigblend:7, trigtransform:2, expfunctions:8, expequations:2, commonlog:0,
  loggraphs:0, vectorcauchy:2, spaceconcept:5, spacevector:8, spaceinner:8, spacecross:10,
  plane3d:13, line3d:15, conditionalprob:0, bayes:0, matrixops:10, matrixapps:5
});
export const hasG11R3Topics = current => {
  const topics = new Set((current?.topics || []).filter(isG11).map(row => row.topic));
  return topics.has('planevector') && topics.has('determinant');
};
export const g11ChallengeBaselineFor = current =>
  hasG11R3Topics(current) ? g11ChallengeR3Baseline : g11ChallengeRolloutBaseline;

export function evaluateDiversityRatchet({baseline,current,exemptions}) {
  const before = new Map(baseline.units.map(unit=>[singleFormKey(unit.topic,unit.unit),unit]));
  const now = new Map(current.units.map(unit=>[singleFormKey(unit.topic,unit.unit),unit]));
  const failures = [], changedUnits = [], newUnits = [], changedG11Topics = new Set();
  const baselineG11Topics = new Set(baseline.units.filter(isG11).map(unit=>unit.topic));
  const challengeBaseline = g11ChallengeBaselineFor(current);
  const challengeBaselineVersion = hasG11R3Topics(current) ? 'g11-r3' : 'rollout-main';
  const approved = new Set(baseline.units.filter(unit=>unit.singleForm).map(unit=>singleFormKey(unit.topic,unit.unit)));
  const configured = new Set(exemptions.map(row=>singleFormKey(row.topic,row.unit)));
  for (const key of configured) if (!approved.has(key))
    failures.push({code:'unapproved_single_form',unit:key});
  for (const key of approved) if (!configured.has(key))
    failures.push({code:'approved_single_form_removed',unit:key});
  for (const row of exemptions) if (!before.has(singleFormKey(row.topic,row.unit)))
    failures.push({code:'new_unit_single_form_forbidden',unit:singleFormKey(row.topic,row.unit)});

  for (const [key,prior] of before) {
    const next=now.get(key);
    if (!next) {failures.push({code:'baseline_unit_removed',unit:key});continue;}
    for (const level of ['basic','advanced','challenge']) {
      if (next.levels[level].produced < prior.levels[level].produced)
        failures.push({code:'sample_production_regressed',unit:key,level,before:prior.levels[level].produced,after:next.levels[level].produced});
      if (next.levels[level].structureCount < prior.levels[level].structureCount)
        failures.push({code:'structure_count_regressed',unit:key,level,before:prior.levels[level].structureCount,after:next.levels[level].structureCount});
    }
    const g11 = isG11(next) || isG11(prior);
    if (!g11 && prior.projectedStructureGatePass && !next.projectedStructureGatePass)
      failures.push({code:'structure_gate_regressed',unit:key});
    if (!g11 && prior.projectedChallengeGatePass && !next.projectedChallengeGatePass)
      failures.push({code:'challenge_gate_regressed',unit:key});
    if (next.outputFingerprint !== prior.outputFingerprint) {
      changedUnits.push(key);
      if (g11) changedG11Topics.add(next.topic || prior.topic);
      if (!g11 && (!next.projectedStructureGatePass || !next.projectedChallengeGatePass))
        failures.push({code:'changed_unit_must_pass_full_gate',unit:key,structureGate:next.projectedStructureGatePass,challengeGate:next.projectedChallengeGatePass});
    }
  }

  for (const [key,next] of now) if (!before.has(key)) {
    newUnits.push(key);
    if (isG11(next)) changedG11Topics.add(next.topic);
    if (next.singleForm) failures.push({code:'new_unit_single_form_forbidden',unit:key});
    if (!isG11(next) && (!next.projectedStructureGatePass || !next.projectedChallengeGatePass))
      failures.push({code:'new_unit_must_pass_full_gate',unit:key,structureGate:next.projectedStructureGatePass,challengeGate:next.projectedChallengeGatePass});
  }

  for (const topic of (current.topics || []).filter(isG11)) {
    for (const level of ['basic','advanced','challenge']) {
      const value = topic.levels?.[level]?.structureCount;
      if (!Number.isFinite(value) || value < topicStructureThreshold)
        failures.push({
          code:'g11_topic_structure_count_below_threshold',
          topic:topic.topic,
          level,
          threshold:topicStructureThreshold,
          current:Number.isFinite(value) ? value : 0
        });
    }

    const currentValue = Number.isFinite(topic.challengeGate?.current) ? topic.challengeGate.current : 0;
    const newTopic = !baselineG11Topics.has(topic.topic);
    const modified = newTopic || changedG11Topics.has(topic.topic);
    const baselineValue = newTopic ? 0 : challengeBaseline[topic.topic];
    if (!newTopic && !Number.isFinite(baselineValue)) {
      failures.push({
        code:'g11_topic_challenge_baseline_missing',
        topic:topic.topic,
        level:'challenge',
        current:currentValue
      });
      continue;
    }
    const required = modified ? g11ChallengeFullThreshold : baselineValue;
    const gapToFull = Math.max(0, g11ChallengeFullThreshold - currentValue);
    const gapToRequired = Math.max(0, required - currentValue);
    topic.challengeGate = {
      ...(topic.challengeGate || {}),
      baseline: baselineValue,
      required,
      fullThreshold: g11ChallengeFullThreshold,
      modified,
      newTopic,
      gapToFull,
      gapToRequired,
      fullGatePass: currentValue >= g11ChallengeFullThreshold,
      pass: currentValue >= required,
      baselineVersion: challengeBaselineVersion
    };

    if (currentValue < required) {
      failures.push({
        code: modified ? 'g11_topic_challenge_full_gate_required' : 'g11_topic_challenge_regressed',
        topic:topic.topic,
        level:'challenge',
        threshold:required,
        baseline:baselineValue,
        current:currentValue,
        gapToFull,
        modified,
        newTopic
      });
    }
  }
  return {changedUnits,newUnits,failures};
}
