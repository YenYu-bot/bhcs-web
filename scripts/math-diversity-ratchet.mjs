import {singleFormKey} from './math-diversity-policy.mjs';

export function evaluateDiversityRatchet({baseline,current,exemptions}) {
  const before = new Map(baseline.units.map(unit=>[singleFormKey(unit.topic,unit.unit),unit]));
  const now = new Map(current.units.map(unit=>[singleFormKey(unit.topic,unit.unit),unit]));
  const failures = [], changedUnits = [], newUnits = [];
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
    if (prior.projectedStructureGatePass && !next.projectedStructureGatePass)
      failures.push({code:'structure_gate_regressed',unit:key});
    if (prior.projectedChallengeGatePass && !next.projectedChallengeGatePass)
      failures.push({code:'challenge_gate_regressed',unit:key});
    if (next.outputFingerprint !== prior.outputFingerprint) {
      changedUnits.push(key);
      if (!next.projectedStructureGatePass || !next.projectedChallengeGatePass)
        failures.push({code:'changed_unit_must_pass_full_gate',unit:key,structureGate:next.projectedStructureGatePass,challengeGate:next.projectedChallengeGatePass});
    }
  }
  for (const [key,next] of now) if (!before.has(key)) {
    newUnits.push(key);
    if (next.singleForm) failures.push({code:'new_unit_single_form_forbidden',unit:key});
    if (!next.projectedStructureGatePass || !next.projectedChallengeGatePass)
      failures.push({code:'new_unit_must_pass_full_gate',unit:key,structureGate:next.projectedStructureGatePass,challengeGate:next.projectedChallengeGatePass});
  }
  return {changedUnits,newUnits,failures};
}
