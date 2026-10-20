import assert from 'node:assert/strict';
import {challengeBase,replayChallenge,challengeReadings,challengeOneStatus,challengeThreeEvidence,CHALLENGE_TWO_POSITIONS,challengeTwoPosition} from '../assets/circuit-guided/challenges.js';
assert.equal(challengeOneStatus('restoreParallel').correct,true);
assert.equal(challengeOneStatus('retainSeries').correct,false);
const a=challengeBase(2),b=challengeBase(2);a.wires.pop();assert.notEqual(a.wires.length,b.wires.length,'base clones are independent');
assert.equal(replayChallenge(2,[{type:'TOGGLE_SWITCH',value:true}]).valid,true);
assert.equal(replayChallenge(2,[{type:'CONNECT',from:'bat+',to:'sw.a'}]).valid,false);
assert.equal(replayChallenge(2,[{type:'DISCONNECT',from:'L1.a',to:'L2.a'}]).valid,false);
assert.equal(replayChallenge(2,[{type:'NOPE'}]).valid,false);
assert.equal(replayChallenge(3,[{type:'CONNECT',from:'X',to:'bat+'}]).valid,false);
assert.equal(challengeThreeEvidence([]),null);
const c=challengeReadings(3,[{type:'TOGGLE_SWITCH',value:true}]);assert.equal(c.valid,true);
assert.equal(c.result.batteryCurrent.value,2);
const evidence=challengeThreeEvidence([{type:'DISCONNECT',from:'sw.b',to:'L2.a'},{type:'TOGGLE_SWITCH',value:true}]);
assert.ok(evidence,'remove L2 branch must yield evidence');assert.equal(evidence.totalCurrent,1);assert.equal(evidence.L1Current,1);
assert.equal(CHALLENGE_TWO_POSITIONS.length,3);
console.log('circuit-guided B4-B challenge core checks passed');

const segments=[
 ['before-L1','sw.b','L1.a'],
 ['between-lamps','L1.b','L2.a'],
 ['after-L2','L2.b','bat-'],
];
for(const [expected,up,down] of segments){
 const actions=[
   {type:'DISCONNECT',from:up,to:down},
   {type:'CONNECT',from:up,to:'A.+'},
   {type:'CONNECT',from:'A.-',to:down},
   {type:'TOGGLE_SWITCH',value:true},
 ];
 const result=challengeTwoPosition(actions);
 assert.ok(result,expected+' structure should pass');
 assert.equal(result.position,expected);
 assert.equal(result.current,0.5);
 const reversed=[
   actions[0],
   {type:'CONNECT',from:up,to:'A.-'},
   {type:'CONNECT',from:'A.+',to:down},
   actions[3],
 ];
 assert.equal(challengeTwoPosition(reversed),null,'reversed meter fails '+expected);
}
assert.equal(challengeTwoPosition([{type:'TOGGLE_SWITCH',value:true}]),null);
console.log('challenge 2 structural placement cases passed');
