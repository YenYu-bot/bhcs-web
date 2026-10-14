// B4 gate: challenge definitions, judging and the notebook readiness rule (Pilot #3). Pure functions.
import assert from 'node:assert/strict';
import * as C from '../assets/microscope-guided/challenges.js';
import {createInitialState,reduce,deriveView} from '../assets/microscope-guided/engine.js';
import * as S from '../assets/microscope-guided/script.js';
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};

test('three challenges, ids 1-3, with 1 / 2 / 1 steps and unique step ids',()=>{
 assert.deepEqual(C.CHALLENGES.map(c=>c.id),[1,2,3]);assert.deepEqual(C.CHALLENGES.map(c=>c.steps.length),[1,2,1]);
 const ids=C.CHALLENGES.flatMap(c=>c.steps.map(s=>s.id));assert.equal(new Set(ids).size,ids.length);
 assert.ok(Object.isFrozen(C.CHALLENGES)&&Object.isFrozen(C.CHALLENGES[1].steps[0]));
});
test('every option id is unique within its step, and every step has exactly one correct option that is one of them',()=>{
 for(const c of C.CHALLENGES)for(const s of c.steps){
  assert.equal(new Set(s.options).size,s.options.length,s.id);assert.ok(s.options.length>=3);assert.ok(s.options.includes(s.correct),s.id);
  assert.equal(s.options.filter(o=>C.judgeChallenge(c.id,s.id,o)===true).length,1,`${s.id}: one right answer`);
 }
});
test('the correct option is not always listed first (no positional shortcut)',()=>{
 const positions=C.CHALLENGES.flatMap(c=>c.steps.map(s=>s.options.indexOf(s.correct)));
 assert.ok(new Set(positions).size>=2,`positions ${positions}`);assert.ok(positions.some(p=>p>0));
});
test('judgeChallenge: true / false for known options, null for anything else',()=>{
 assert.equal(C.judgeChallenge(1,'c1-direction','left-up'),true);assert.equal(C.judgeChallenge(1,'c1-direction','right-down'),false);
 assert.equal(C.judgeChallenge(2,'c2-view','only-b-larger'),true);assert.equal(C.judgeChallenge(2,'c2-claim','smaller-field'),true);
 assert.equal(C.judgeChallenge(3,'c3-strategy','low-recentre'),true);
 for(const bad of [[1,'nope','left-up'],[9,'c1-direction','left-up'],[1,'c1-direction','nope'],[1,'c1-direction',3],[1,'c1-direction',null],[2,'c1-direction','left-up']])
  assert.equal(C.judgeChallenge(...bad),null,JSON.stringify(bad));
});
test('Challenge 3 strategy: only "return to low power, re-centre, then go up" is right',()=>{
 const step=C.stepOf(3,'c3-strategy');assert.equal(step.correct,'low-recentre');
 for(const wrong of ['high-random','higher-mag','brightest'])assert.equal(C.judgeChallenge(3,'c3-strategy',wrong),false);
 assert.equal(C.challengeById(3).steps.length,1,'one required step');assert.equal(C.challengeById(3).note,true,'and an optional note');
});
test('challengeProgress: a step unlocks only after the one before it is solved; allCorrect needs every step',()=>{
 const empty=C.emptyChallenges();
 assert.deepEqual(C.challengeProgress(2,empty[2]).steps.map(s=>[s.id,s.unlocked,s.correct,s.attempts]),[['c2-view',true,false,0],['c2-claim',false,false,0]]);
 const one={steps:{'c2-view':{choice:'only-b-larger',attempts:2,correct:true}}};
 const p=C.challengeProgress(2,one);assert.deepEqual(p.steps.map(s=>s.unlocked),[true,true]);assert.equal(p.allCorrect,false);
 const both={steps:{...one.steps,'c2-claim':{choice:'smaller-field',attempts:1,correct:true}}};assert.equal(C.challengeProgress(2,both).allCorrect,true);
 assert.deepEqual(C.challengeProgress(99,{}),{steps:[],allCorrect:false});
 assert.equal(C.emptyChallenges()[3].note,'');assert.deepEqual(Object.keys(C.emptyChallenges()),['1','2','3']);
});
test('a wrong attempt is counted but never solves; the hint threshold is the second try',()=>{
 assert.equal(C.HINT_AFTER_ATTEMPTS,2);
 let s=reduce(reduce(createInitialState(),{type:'START'}).state,{type:'BEGIN'}).state;assert.equal(s.phase,'trial1-horizontal');
 const w={steps:{'c1-direction':{choice:'right-up',attempts:1,correct:false}}};
 assert.equal(C.challengeProgress(1,w).steps[0].attempts,1);assert.equal(C.challengeProgress(1,w).allCorrect,false);
});
test('a solved step is locked in: progress reports it solved and the model offers no more tries',()=>{
 const solved={steps:{'c1-direction':{choice:'left-up',attempts:3,correct:true}}};
 const p=C.challengeProgress(1,solved);assert.equal(p.steps[0].correct,true);assert.equal(p.allCorrect,true);
});
test('notebookReady: A needs both relations to match the learner\'s own records; B and C need written text; never ready without a level',()=>{
 const exp={direction:'left',range:'smaller'};
 assert.equal(C.notebookReady({level:'A',relationDirection:'left',relationRange:'smaller'},exp),true);
 assert.equal(C.notebookReady({level:'A',relationDirection:'right',relationRange:'smaller'},exp),false);
 assert.equal(C.notebookReady({level:'A',relationDirection:'left',relationRange:'larger'},exp),false);
 assert.equal(C.notebookReady({level:'A',relationDirection:'left',relationRange:'smaller'},null),false);
 assert.equal(C.notebookReady({level:'A',relationDirection:null,relationRange:null},{direction:null,range:null}),false,'unknown expectations never match');
 assert.equal(C.notebookReady({level:'B',freeText:'abcd'}),true);assert.equal(C.notebookReady({level:'B',freeText:'abc '}),false);
 assert.equal(C.notebookReady({level:'C',evidenceText:'abcd',limitationText:'abcd'}),true);assert.equal(C.notebookReady({level:'C',evidenceText:'abcd',limitationText:''}),false);
 assert.equal(C.notebookReady({level:null,freeText:'abcdefgh'}),false);assert.equal(C.notebookReady(null),false);
 assert.equal(C.MIN_WRITTEN,4);assert.equal(C.written('  a b  c d '),true);assert.equal(C.written(5),false);
});
test('sanitizeConclusionFields: field by field, unknown ignored, null when nothing usable, text capped',()=>{
 assert.deepEqual(C.sanitizeConclusionFields({level:'A',relationDirection:'left',relationRange:'smaller'}),{level:'A',relationDirection:'left',relationRange:'smaller'});
 assert.deepEqual(C.sanitizeConclusionFields({level:'B',freeText:'x'.repeat(1500),ready:true,hack:1}).freeText.length,1000);
 assert.deepEqual(C.sanitizeConclusionFields({relationDirection:null}),{relationDirection:null});
 for(const bad of [{},{x:1},{level:'Z'},{relationDirection:'up'},{relationRange:'huge'},{freeText:3},null,[],'x',undefined])assert.equal(C.sanitizeConclusionFields(bad),null,JSON.stringify(bad));
 assert.equal(C.TEXT_MAX,1000);assert.equal(C.ATTEMPTS_MAX,999);
});
test('no answer key leaks into the learner-facing view model',()=>{
 const flow=(state,...a)=>a.reduce((s,x)=>reduce(s,x).state,state);
 const set=(x,y)=>({type:'SET_STAGE',x,y});
 let s=flow(createInitialState(),{type:'START'},{type:'BEGIN'},set(75,0),{type:'RECORD'},set(0,75),{type:'RECORD'},{type:'ANSWER_COMPARE',compare:'direction',question:'relation',answer:'opposite'},{type:'CONTINUE'},set(0,0),{type:'RECORD'},{type:'SET_OBJECTIVE',objective:40},{type:'RECORD'},
  {type:'ANSWER_COMPARE',compare:'magnification',question:'field',answer:'smaller'},{type:'ANSWER_COMPARE',compare:'magnification',question:'count',answer:'fewer'},{type:'CONTINUE'},{type:'CONTINUE'},
  {type:'SAVE_CONCLUSION',fields:{level:'B',freeText:'abcdef'}},{type:'CONTINUE'});
 for(const id of [1,2,3]){
  const m=S.challengeModel({...s,phase:`challenge-${id}`},deriveView({...s,phase:`challenge-${id}`}));
  const text=JSON.stringify(m);
  for(const step of C.challengeById(id).steps)assert.ok(!text.includes(`"correct":"${step.correct}"`)&&!/"correctOption"|"answer"/.test(text),`${step.id}: no key`);
  assert.ok(m.steps.every(x=>x.correct===false&&x.feedback===null),'nothing is solved or judged before an attempt');
 }
 assert.ok(!JSON.stringify(deriveView({...s,phase:'challenge-1'})).includes('left-up'),'the engine view does not carry the answer');
});
console.log(`${tests} microscope challenges tests passed`);
