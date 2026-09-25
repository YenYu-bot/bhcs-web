import assert from 'node:assert/strict';
import {evaluateDiversityRatchet} from '../math-diversity-ratchet.mjs';

const unit=(overrides={})=>({link:'g10-drills.html?topic=demo',topic:'demo',unit:'u',singleForm:false,outputFingerprint:'same',
  projectedStructureGatePass:true,projectedChallengeGatePass:true,
  levels:{basic:{produced:200,structureCount:3},advanced:{produced:200,structureCount:3},challenge:{produced:200,structureCount:3}},...overrides});
const g11Unit=(overrides={})=>unit({link:'g11-drills.html?topic=demo',...overrides});
const g11Topic=(overrides={})=>({link:'g11-drills.html?topic=demo',topic:'demo',
  levels:{basic:{structureCount:10},advanced:{structureCount:10},challenge:{structureCount:10}},
  challengeGate:{current:3},...overrides});

const baseline={units:[unit()]};
assert.deepEqual(evaluateDiversityRatchet({baseline,current:{units:[unit()],topics:[]},exemptions:[]}),{changedUnits:[],newUnits:[],failures:[]});

let result=evaluateDiversityRatchet({baseline,current:{units:[unit({levels:{basic:{produced:200,structureCount:2},advanced:{produced:200,structureCount:3},challenge:{produced:200,structureCount:3}}})],topics:[]},exemptions:[]});
assert.ok(result.failures.some(row=>row.code==='structure_count_regressed'));

result=evaluateDiversityRatchet({baseline,current:{units:[unit({outputFingerprint:'changed',projectedChallengeGatePass:false})],topics:[]},exemptions:[]});
assert.deepEqual(result.changedUnits,['demo/u']);
assert.ok(result.failures.some(row=>row.code==='changed_unit_must_pass_full_gate'));

result=evaluateDiversityRatchet({baseline,current:{units:[unit(),unit({topic:'new',unit:'n',singleForm:true})],topics:[]},exemptions:[{topic:'new',unit:'n'}]});
assert.deepEqual(result.newUnits,['new/n']);
assert.ok(result.failures.filter(row=>row.code==='new_unit_single_form_forbidden').length>=1);

result=evaluateDiversityRatchet({baseline,current:{units:[],topics:[]},exemptions:[]});
assert.ok(result.failures.some(row=>row.code==='baseline_unit_removed'));

const approved={units:[unit({singleForm:true}),unit({topic:'other',unit:'v'})]};
result=evaluateDiversityRatchet({baseline:approved,current:{...approved,topics:[]},exemptions:[{topic:'other',unit:'v'}]});
assert.ok(result.failures.some(row=>row.code==='unapproved_single_form' && row.unit==='other/v'));
assert.ok(result.failures.some(row=>row.code==='approved_single_form_removed' && row.unit==='demo/u'));

const g11Baseline={units:[g11Unit()]};
result=evaluateDiversityRatchet({
  baseline:g11Baseline,
  current:{units:[g11Unit({outputFingerprint:'changed',projectedStructureGatePass:false,projectedChallengeGatePass:false})],topics:[g11Topic()]},
  exemptions:[]
});
assert.deepEqual(result.changedUnits,['demo/u']);
assert.ok(!result.failures.some(row=>['structure_gate_regressed','challenge_gate_regressed','changed_unit_must_pass_full_gate'].includes(row.code)));

result=evaluateDiversityRatchet({
  baseline:g11Baseline,
  current:{units:[g11Unit()],topics:[g11Topic({levels:{basic:{structureCount:9},advanced:{structureCount:10},challenge:{structureCount:10}},challengeGate:{current:2}})]},
  exemptions:[]
});
const structureFailure=result.failures.find(row=>row.code==='g11_topic_structure_count_below_threshold');
assert.deepEqual(structureFailure,{code:'g11_topic_structure_count_below_threshold',topic:'demo',level:'basic',threshold:10,current:9});
const challengeFailure=result.failures.find(row=>row.code==='g11_topic_challenge_qualifying_units_below_threshold');
assert.deepEqual(challengeFailure,{code:'g11_topic_challenge_qualifying_units_below_threshold',topic:'demo',level:'challenge',threshold:3,current:2});

result=evaluateDiversityRatchet({
  baseline:g11Baseline,
  current:{units:[g11Unit({topic:'new',unit:'n',outputFingerprint:'new',projectedStructureGatePass:false,projectedChallengeGatePass:false})],topics:[g11Topic({topic:'new',link:'g11-drills.html?topic=new'})]},
  exemptions:[]
});
assert.ok(!result.failures.some(row=>row.code==='new_unit_must_pass_full_gate'));

console.log(JSON.stringify({test:'diversity-ratchet',passed:true}));
