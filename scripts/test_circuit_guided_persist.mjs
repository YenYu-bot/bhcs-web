import assert from 'node:assert/strict';
import {createInitialState} from '../assets/circuit-guided/engine.js';
import {FIXED_CIRCUITS} from '../assets/circuit-guided/model.js';
import {STORAGE_KEY,createPayload,restorePayload,validateMainSnapshot} from '../assets/circuit-guided/persist.js';
const clone=x=>structuredClone(x);
const record=(trialId,fixed)=>({trialId,wires:FIXED_CIRCUITS[fixed].map(w=>({...w})),switchClosed:true});
const main={...createInitialState(),phase:'concept',records:[
record('baseline','baseline'),record('trial1','trial1'),record('trial2-total','trial2Total'),
record('trial2-L1','trial2L1'),record('trial2-L2','trial2L2')
]};
const notebook={level:'done',a:{baselineCurrent:'1.0',onePathChange:'decrease',twoPathChange:'increase',alwaysDecrease:'false'},
 b:'不同接法改變電路等效電阻，造成總電流有不同變化。',
 c:{counterexample:'實測 1.0 A、0.5 A 和 2.0 A，顯示不一定變小。',limitation:'真實電池有內阻，與理想電池不同。'}};
const a=createPayload({main,notebook});assert.ok(a);assert.equal(STORAGE_KEY,'bhcs-circuit-guided:v1');
assert.equal(a.main.records.length,5);assert.equal(a.notebook.level,'done');
assert.equal(restorePayload(JSON.parse(JSON.stringify(a))).main.phase,'concept');
assert.equal(restorePayload({...a,version:999}),null);
assert.equal(restorePayload({...a,main:{...main,records:[{...main.records[0],wires:[],correct:true}]}}),null);
assert.equal(restorePayload({...a,main:{...main,records:[main.records[0],main.records[0]]}}),null);
assert.equal(restorePayload({...a,main:{...main,phase:'welcome'}}),null);
assert.equal(restorePayload({...a,notebook:{...notebook,a:{...notebook.a,alwaysDecrease:'true'}}}),null);
assert.equal(restorePayload({...a,challenge:{stage:3,actions:[],records:[],choice:'restoreParallel',done:true}}),null);
const withDerived=clone(a);withDerived.main.records[0].correct=true;withDerived.main.records[0].reading=999;
const restored=restorePayload(withDerived);assert.ok(restored);assert.equal('correct' in restored.main.records[0],false);assert.equal('reading' in restored.main.records[0],false);
assert.equal(validateMainSnapshot({...main,wires:[{from:'bad',to:'bat+'}]}),null);
console.log('circuit guided B4-C persistence truth and validation checks passed');
