import {singleFormKey} from './math-diversity-policy.mjs';

const isG11 = row => /(?:^|\/)g11-drills\.html(?:\?|$)/.test(row?.link || '');
const topicStructureThreshold = 10;
const challengeUnitThreshold = 3;

export function evaluateDiversityRatchet({baseline,current,exemptions}) {
  const before = new Map(baseline.units.map(unit=>[singleFormKey(unit.topic,unit.unit),unit]));
  const now = new Map(current.units.map(unit=>[singleFormKey(unit.topic,unit.unit),unit]));
  const failures = [], changedUnits = [], newUnits = [];
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
      if (!g11 && (!next.projectedStructureGatePass || !next.projectedChallengeGatePass))
        failures.push({code:'changed_unit_must_pass_full_gate',unit:key,structureGate:next.projectedStructureGatePass,challengeGate:next.projectedChallengeGatePass});
    }
  }
  for (const [key,next] of now) if (!before.has(key)) {
    newUnits.push(key);
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
    const value = topic.challengeGate?.current;
    if (!Number.isFinite(value) || value < challengeUnitThreshold)
      failures.push({
        code:'g11_topic_challenge_qualifying_units_below_threshold',
        topic:topic.topic,
        level:'challenge',
        threshold:challengeUnitThreshold,
        current:Number.isFinite(value) ? value : 0
      });
  }
  return {changedUnits,newUnits,failures};
}
