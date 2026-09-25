import assert from 'node:assert/strict';
import {evaluateDiversityRatchet} from '../math-diversity-ratchet.mjs';

const unit=(overrides={})=>({link:'g10-drills.html?topic=demo',topic:'demo',unit:'u',singleForm:false,outputFingerprint:'same',
  projectedStructureGatePass:true,projectedChallengeGatePass:true,
  levels:{basic:{produced:200,structureCount:3},advanced:{produced:200,structureCount:3},challenge:{produced:200,structureCount:3}},...overrides});
const g11Unit=(overrides={})=>unit({link:'g11-drills.html?topic=standarddev',topic:'standarddev',unit:'u',...overrides});
const g11Topic=(overrides={})=>({link:'g11-drills.html?topic=standarddev',topic:'standarddev',
  levels:{basic:{structureCount:10},advanced:{structureCount:10},challenge:{structureCount:10}},
  challengeGate:{current:2,qualifyingUnits:['a','b']},...overrides});

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

// Existing untouched G11 topic may remain below the full challenge threshold as long as it does not regress.
const g11Baseline={units:[g11Unit()]};
result=evaluateDiversityRatchet({
  baseline:g11Baseline,
  current:{units:[g11Unit()],topics:[g11Topic()]},
  exemptions:[]
});
assert.equal(result.failures.length,0);
assert.equal(result.current,undefined);
assert.equal(g11Topic().challengeGate.current,2);

// But topic structureCount >=10 remains a hard gate for every G11 topic+difficulty.
const lowStructure=g11Topic({levels:{basic:{structureCount:9},advanced:{structureCount:10},challenge:{structureCount:10}}});
result=evaluateDiversityRatchet({baseline:g11Baseline,current:{units:[g11Unit()],topics:[lowStructure]},exemptions:[]});
assert.deepEqual(result.failures.find(row=>row.code==='g11_topic_structure_count_below_threshold'),
  {code:'g11_topic_structure_count_below_threshold',topic:'standarddev',level:'basic',threshold:10,current:9});

// Untouched old topic may not fall below its current-main challenge baseline (standarddev baseline = 2).
const regressed=g11Topic({challengeGate:{current:1,qualifyingUnits:['a']}});
result=evaluateDiversityRatchet({baseline:g11Baseline,current:{units:[g11Unit()],topics:[regressed]},exemptions:[]});
assert.deepEqual(result.failures.find(row=>row.code==='g11_topic_challenge_regressed'),{
  code:'g11_topic_challenge_regressed',topic:'standarddev',level:'challenge',threshold:2,baseline:2,current:1,gapToFull:2,modified:false,newTopic:false
});
assert.equal(regressed.challengeGate.required,2);
assert.equal(regressed.challengeGate.gapToFull,2);

// Once any unit in an old G11 topic changes, the topic must reach the full challenge threshold >=3.
const changedTopic=g11Topic();
result=evaluateDiversityRatchet({
  baseline:g11Baseline,
  current:{units:[g11Unit({outputFingerprint:'changed'})],topics:[changedTopic]},
  exemptions:[]
});
assert.deepEqual(result.changedUnits,['standarddev/u']);
assert.deepEqual(result.failures.find(row=>row.code==='g11_topic_challenge_full_gate_required'),{
  code:'g11_topic_challenge_full_gate_required',topic:'standarddev',level:'challenge',threshold:3,baseline:2,current:2,gapToFull:1,modified:true,newTopic:false
});
assert.equal(changedTopic.challengeGate.required,3);
assert.equal(changedTopic.challengeGate.fullGatePass,false);

const changedPass=g11Topic({challengeGate:{current:3,qualifyingUnits:['a','b','c']}});
result=evaluateDiversityRatchet({
  baseline:g11Baseline,
  current:{units:[g11Unit({outputFingerprint:'changed'})],topics:[changedPass]},
  exemptions:[]
});
assert.ok(!result.failures.some(row=>row.topic==='standarddev' && row.code.startsWith('g11_topic_challenge_')));
assert.equal(changedPass.challengeGate.fullGatePass,true);

// New G11 topic is also required to meet >=3; G11 unit-level full gate remains disabled.
const newTopic=g11Topic({link:'g11-drills.html?topic=newtopic',topic:'newtopic',challengeGate:{current:2,qualifyingUnits:['a','b']}});
result=evaluateDiversityRatchet({
  baseline:g11Baseline,
  current:{units:[g11Unit(),g11Unit({link:'g11-drills.html?topic=newtopic',topic:'newtopic',unit:'n',outputFingerprint:'new'})],topics:[g11Topic(),newTopic]},
  exemptions:[]
});
assert.ok(!result.failures.some(row=>row.code==='new_unit_must_pass_full_gate' && row.unit==='newtopic/n'));
const newFailure=result.failures.find(row=>row.code==='g11_topic_challenge_full_gate_required' && row.topic==='newtopic');
assert.equal(newFailure.threshold,3);
assert.equal(newFailure.current,2);
assert.equal(newFailure.newTopic,true);

console.log(JSON.stringify({test:'diversity-ratchet',passed:true}));
