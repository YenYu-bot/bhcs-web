import assert from 'node:assert/strict';
import {FIXED_CIRCUITS} from '../assets/circuit-guided/model.js';
import {createInitialState} from '../assets/circuit-guided/engine.js';
import {notebookEvidence,notebookAStatus,notebookBStatus,notebookCStatus,LIMITATION_IDEAS} from '../assets/circuit-guided/notebook.js';
const record=(trialId,key)=>({trialId,wires:FIXED_CIRCUITS[key].map(w=>({...w})),switchClosed:true});
const state={...createInitialState(),phase:'concept',records:[
 record('baseline','baseline'),record('trial1','trial1'),record('trial2-total','trial2Total'),
 record('trial2-L1','trial2L1'),record('trial2-L2','trial2L2'),
]};
const e=notebookEvidence(state);
assert.deepEqual([e.baseline,e.onePath,e.twoPath],[1,0.5,2]);
assert.equal(e.onePathChange,'decrease');
assert.equal(e.twoPathChange,'increase');
assert.equal(e.alwaysDecrease,false);
assert.equal(notebookEvidence(createInitialState()),null);
const valid={baselineCurrent:'1.0',onePathChange:'decrease',twoPathChange:'increase',alwaysDecrease:'false'};
assert.equal(notebookAStatus(state,valid).allCorrect,true);
assert.equal(notebookAStatus(state,{...valid,alwaysDecrease:'true'}).allCorrect,false);
assert.equal(notebookAStatus(createInitialState(),valid).allCorrect,false);
assert.equal(notebookAStatus({...state,records:[{...state.records[0],correct:true}]},valid).allCorrect,false);
assert.equal(notebookBStatus('只寫幾個字').ready,false);
assert.equal(notebookBStatus('因為不同接線方式改變電流流通的路徑').ready,true);
assert.equal(notebookCStatus({counterexample:'兩次量測顯示不同的總電流'}).showIdeas,false);
assert.equal(notebookCStatus({counterexample:'兩次量測顯示不同的總電流',limitation:'實際電池也具有自己的內部電阻'}).ready,true);
assert.equal(LIMITATION_IDEAS.length,6);
import fs from 'node:fs';
const page=fs.readFileSync(new URL('../tools/science/circuit-guided.html',import.meta.url),'utf8');
const glue=fs.readFileSync(new URL('../assets/circuit-guided/main.js',import.meta.url),'utf8');
const view=fs.readFileSync(new URL('../assets/circuit-guided/notebook-view.js',import.meta.url),'utf8');
assert.match(page,/id="cgg-notebook"/);
assert.match(page,/id="cgg-notebook-open"/);
assert.match(glue,/mountCircuitNotebook/);
assert.match(glue,/state.phase !== 'concept'/);
assert.match(view,/notebookAStatus\(getState\(\),learner.a\)/);
assert.match(view,/notebookBStatus\(learner.b\)/);
assert.match(view,/notebookCStatus\(learner.c\)/);
assert.match(view,/notebookCStatus\(learner.c\).showIdeas/);
console.log('Circuit Guided Notebook B4-A core and integration checks passed');
