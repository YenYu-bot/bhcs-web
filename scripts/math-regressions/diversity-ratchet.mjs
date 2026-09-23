import assert from 'node:assert/strict';
import {evaluateDiversityRatchet} from '../math-diversity-ratchet.mjs';

const unit=(overrides={})=>({topic:'demo',unit:'u',singleForm:false,outputFingerprint:'same',
  projectedStructureGatePass:true,projectedChallengeGatePass:true,
  levels:{basic:{produced:200,structureCount:3},advanced:{produced:200,structureCount:3},challenge:{produced:200,structureCount:3}},...overrides});
const baseline={units:[unit()]};
assert.deepEqual(evaluateDiversityRatchet({baseline,current:{units:[unit()]},exemptions:[]}),{changedUnits:[],newUnits:[],failures:[]});

let result=evaluateDiversityRatchet({baseline,current:{units:[unit({levels:{basic:{produced:200,structureCount:2},advanced:{produced:200,structureCount:3},challenge:{produced:200,structureCount:3}}})]},exemptions:[]});
assert.ok(result.failures.some(row=>row.code==='structure_count_regressed'));

result=evaluateDiversityRatchet({baseline,current:{units:[unit({outputFingerprint:'changed',projectedChallengeGatePass:false})]},exemptions:[]});
assert.deepEqual(result.changedUnits,['demo/u']);
assert.ok(result.failures.some(row=>row.code==='changed_unit_must_pass_full_gate'));

result=evaluateDiversityRatchet({baseline,current:{units:[unit(),unit({topic:'new',unit:'n',singleForm:true})]},exemptions:[{topic:'new',unit:'n'}]});
assert.deepEqual(result.newUnits,['new/n']);
assert.ok(result.failures.filter(row=>row.code==='new_unit_single_form_forbidden').length>=1);

result=evaluateDiversityRatchet({baseline,current:{units:[]},exemptions:[]});
assert.ok(result.failures.some(row=>row.code==='baseline_unit_removed'));
console.log(JSON.stringify({test:'diversity-ratchet',passed:true}));
