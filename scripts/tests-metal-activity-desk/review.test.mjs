import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSession,appendRecord} from '../../tools/metal-activity-desk/inquiry.mjs';
import {freshAcid,observeAcid,replaceAcid,useHydrogenReference} from '../../tools/metal-activity-desk/acid.mjs';
import {OPTIONS,QUESTIONS,freshReview,updateReview,setReviewOpen,restoreReview,assessReview} from '../../tools/metal-activity-desk/review.mjs';

const correct={
 origin:{recordId:'r1',donor:'Zn',acceptor:'Cu2',deposit:'Cu'},
 acids:{zincId:'a1',ironId:'a2',answer:'need-direct',evidenceId:'r4'},
 source:{copperId:'a3',answer:'reference'}
};
function fixture(){
 let state=freshSession();
 for(const solution of ['CuSO4','FeSO4','ZnSO4'])for(const metal of ['Zn','Fe','Cu'])state=appendRecord(state,metal,solution,'extra').state;
 let lesson=freshAcid();
 for(const metal of ['Zn','Fe','Cu'])lesson=observeAcid(lesson,metal);
 lesson=useHydrogenReference(lesson);
 return {...state,lesson,review:freshReview()};
}
function answerAll(state=fixture(),checked=true){
 let review=state.review;
 for(const [section,fields] of Object.entries(correct)){
  for(const [field,value] of Object.entries(fields))review=updateReview(review,section,field,value);
  if(checked)review=updateReview(review,section,'checked',true);
 }
 return {...state,review};
}
function set(state,section,fields,checked=true){
 let review=state.review;
 for(const [field,value] of Object.entries(fields))review=updateReview(review,section,field,value);
 if(checked)review=updateReview(review,section,'checked',true);
 return {...state,review};
}
function freeze(value){
 if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}
 return value;
}

test('review starts blank with independent answers and no stored pass state',()=>{
 const review=freshReview(),other=freshReview();
 assert.deepEqual(review,{version:1,open:false,answers:{
  origin:{recordId:null,donor:null,acceptor:null,deposit:null,checked:false},
  acids:{zincId:null,ironId:null,answer:null,evidenceId:null,checked:false},
  source:{copperId:null,answer:null,checked:false}
 }});
 review.answers.origin.recordId='r1';review.answers.source.checked=true;
 assert.deepEqual(other,freshReview());
 assert.equal(Object.hasOwn(review,'passed'),false);
 assert.equal(Object.hasOwn(review,'complete'),false);
});

test('Chinese questions and bounded immutable option sets expose every editable answer',()=>{
 assert.deepEqual(Object.keys(OPTIONS),['origin','acids','source']);
 assert.deepEqual(OPTIONS.origin.donor.map(o=>o.value),['Zn','Cu2','SO4']);
 assert.deepEqual(OPTIONS.origin.acceptor.map(o=>o.value),['Cu2','Zn','SO4']);
 assert.deepEqual(OPTIONS.origin.deposit.map(o=>o.value),['Cu','Zn','Cu2']);
 assert.deepEqual(OPTIONS.acids.answer.map(o=>o.value),['need-direct','Zn-greater','Fe-greater','equal']);
 assert.deepEqual(OPTIONS.source.answer.map(o=>o.value),['reference','no-bubbles','acid-bubbles']);
 for(const [section,fields] of Object.entries(OPTIONS))for(const [field,options] of Object.entries(fields)){
  assert.match(QUESTIONS[section][field],/[\u3400-\u9fff]/);
  assert.equal(new Set(options.map(o=>o.value)).size,options.length);
  assert.ok(Object.isFrozen(options));
  for(const option of options){assert.match(option.label,/[\u3400-\u9fff]/);assert.ok(Object.isFrozen(option));}
 }
 assert.throws(()=>{OPTIONS.origin.donor.push({value:'anything',label:'任意'});},TypeError);
});

test('correct selections are ready until the student explicitly checks each section',()=>{
 const state=answerAll(fixture(),false),before=structuredClone(state);
 const result=assessReview(state);
 for(const section of ['origin','acids','source']){
  assert.equal(result[section].status,'ready');
  assert.equal(result[section].checked,false);
  assert.equal(result[section].canCheck,true);
  assert.equal(result[section].reason,'check-needed');
 }
 assert.equal(result.verifiedCount,0);assert.equal(result.complete,false);
 assert.deepEqual(result.counts,{verified:0,total:3,ready:3,missing:0,revise:0});
 assert.deepEqual(state,before);
 let next=state;
 for(const [index,section] of ['origin','acids','source'].entries()){
  next=set(next,section,{});
  assert.equal(assessReview(next).verifiedCount,index+1);
 }
 assert.equal(assessReview(next).complete,true);
 assert.equal(assessReview(next).status,'verified');
});

test('all 324 answer combinations require each exact response and explicit checking',()=>{
 let combinations=0;
 for(const donor of OPTIONS.origin.donor)for(const acceptor of OPTIONS.origin.acceptor)
 for(const deposit of OPTIONS.origin.deposit)for(const acid of OPTIONS.acids.answer)
 for(const source of OPTIONS.source.answer){
  let state=answerAll();
  state=set(state,'origin',{donor:donor.value,acceptor:acceptor.value,deposit:deposit.value});
  state=set(state,'acids',{answer:acid.value});
  state=set(state,'source',{answer:source.value});
  const result=assessReview(state);
  const origin=donor.value==='Zn'&&acceptor.value==='Cu2'&&deposit.value==='Cu';
  const acids=acid.value==='need-direct',reference=source.value==='reference';
  for(const [section,valid] of [['origin',origin],['acids',acids],['source',reference]]){
   assert.equal(result[section].status,valid?'verified':'revise',`${section}: ${JSON.stringify(state.review.answers[section])}`);
   assert.equal(result[section].valid,valid);
   assert.match(result[section].feedback,/[\u3400-\u9fff]/);
  }
  assert.equal(result.verifiedCount,Number(origin)+Number(acids)+Number(reference));
  assert.equal(result.complete,origin&&acids&&reference);
  combinations++;
 }
 assert.equal(combinations,324);
});

test('all nine salt recipes and 27 origin answers require an actual Zn/CuSO4 observation',()=>{
 let cases=0;
 for(const record of fixture().records)for(const donor of OPTIONS.origin.donor)
 for(const acceptor of OPTIONS.origin.acceptor)for(const deposit of OPTIONS.origin.deposit){
  const state=set(answerAll(),'origin',{recordId:record.id,donor:donor.value,acceptor:acceptor.value,deposit:deposit.value});
  const expected=record.metal==='Zn'&&record.solution==='CuSO4'&&donor.value==='Zn'&&acceptor.value==='Cu2'&&deposit.value==='Cu';
  assert.equal(assessReview(state).origin.status,expected?'verified':'revise');cases++;
 }
 assert.equal(cases,243);
});

test('all 324 acid record and answer combinations require two matching acid records and direct positive Zn/Fe evidence',()=>{
 let cases=0;
 const base=fixture();
 for(const zinc of base.lesson.records)for(const iron of base.lesson.records)
 for(const evidence of base.records)for(const answer of OPTIONS.acids.answer){
  const state=set(answerAll(),'acids',{zincId:zinc.id,ironId:iron.id,evidenceId:evidence.id,answer:answer.value});
  const expected=zinc.metal==='Zn'&&iron.metal==='Fe'&&evidence.metal==='Zn'&&evidence.solution==='FeSO4'&&answer.value==='need-direct';
  assert.equal(assessReview(state).acids.status,expected?'verified':'revise',`${zinc.id}, ${iron.id}, ${evidence.id}, ${answer.value}`);
  cases++;
 }
 assert.equal(cases,324);
});

test('negative-only and copper comparisons remain selectable but cannot establish Zn > Fe',()=>{
 const negative=assessReview(set(answerAll(),'acids',{evidenceId:'r8'})).acids;
 assert.equal(negative.status,'revise');assert.equal(negative.reason,'negative-only');
 assert.match(negative.feedback,/鐵＋硫酸鋅/);assert.match(negative.feedback,/單靠未見變化不能證明/);
 for(const evidenceId of ['r1','r2']){
  const result=assessReview(set(answerAll(),'acids',{evidenceId})).acids;
  assert.equal(result.status,'revise');assert.equal(result.reason,'different-pair');
  assert.match(result.feedback,/比較的是金屬與銅/);
 }
 for(const evidenceId of ['r3','r5','r6','r7','r9']){
  const result=assessReview(set(answerAll(),'acids',{evidenceId})).acids;
  assert.equal(result.status,'revise');assert.equal(result.reason,'negative-only');
 }
 const state=answerAll();state.connections={};state.lesson.links={HCu:'reference'};
 assert.equal(assessReview(state).acids.status,'verified','direct retained evidence does not need a graph connection');
});

test('all 18 source combinations require Cu observation, reference answer and explicit existing adoption',()=>{
 let cases=0;
 for(const record of fixture().lesson.records)for(const answer of OPTIONS.source.answer)for(const adopted of [false,true]){
  const state=set(answerAll(),'source',{copperId:record.id,answer:answer.value});
  if(!adopted)delete state.lesson.links.HCu;
  const result=assessReview(state).source;
  const expected=record.metal==='Cu'&&answer.value==='reference'&&adopted;
  assert.equal(result.status,!adopted?'missing':expected?'verified':'revise');
  if(!adopted){assert.equal(result.reason,'reference-needed');assert.match(result.feedback,/參考資料.*卡/);}
  cases++;
 }
 assert.equal(cases,18);
});

test('removing or corrupting reference immediately revokes source verification without adopting it',()=>{
 for(const value of [undefined,null,true,'a3','Reference',['reference'],{},'']){
  const state=answerAll();state.lesson.links.HCu=value;
  const before=structuredClone(state),result=assessReview(state);
  assert.equal(result.source.status,'missing');assert.equal(result.source.reason,'reference-needed');
  assert.equal(result.source.referenceAdopted,false);assert.equal(result.complete,false);
  assert.equal(result.origin.status,'verified');assert.equal(result.acids.status,'verified');
  assert.deepEqual(state,before);
 }
});

test('completed cups, graph links and guessed IDs cannot replace absent retained observations',()=>{
 const state=answerAll();state.records=[];state.lesson.records=[];
 state.cups=[{metal:'Zn',phase:'done',recordId:'r1'},{metal:'Fe',phase:'done',recordId:'r2'},{metal:'Cu',phase:'done',recordId:'r3'}];
 state.connections={ZnFe:'r4',FeCu:'r2'};
 state.lesson.cups={Zn:'a1',Fe:'a2',Cu:'a3'};
 state.lesson.links={ZnH:'a1',FeH:'a2',HCu:'reference'};
 state.review.passed=true;state.review.status='verified';state.review.complete=true;
 for(const answer of Object.values(state.review.answers)){answer.passed=true;answer.status='verified';}
 const result=assessReview(state);
 assert.equal(result.verifiedCount,0);assert.equal(result.complete,false);
 for(const section of ['origin','acids','source']){
  assert.equal(result[section].status,'missing');assert.equal(result[section].reason,'record-unavailable');
 }
});

test('every required retained record independently gates its affected section',()=>{
 for(const [prefix,id,section] of [['r','r1','origin'],['r','r4','acids'],['a','a1','acids'],['a','a2','acids'],['a','a3','source']]){
  const state=answerAll();
  if(prefix==='r')state.records=state.records.filter(r=>r.id!==id);
  else state.lesson.records=state.lesson.records.filter(r=>r.id!==id);
  const result=assessReview(state);
  assert.equal(result[section].status,'missing');assert.equal(result[section].valid,false);assert.equal(result.complete,false);
  for(const other of ['origin','acids','source'].filter(s=>s!==section))assert.equal(result[other].status,'verified');
 }
});

test('ambiguous duplicate and malformed records never count as evidence',()=>{
 const mutations=[
  state=>state.records.push({...state.records[0]}),
  state=>state.records.push({...state.records[0],metal:'Cu'}),
  state=>{state.records[0].metal='Al';},
  state=>{state.records[0].solution='HCl';},
  state=>{state.records[0].id=['r1'];},
  state=>{state.records='r1';},
  state=>{state.records=null;}
 ];
 for(const mutate of mutations){const state=answerAll();mutate(state);assert.equal(assessReview(state).origin.status,'missing');}
 for(const mutate of [state=>state.lesson.records.push({...state.lesson.records[2]}),state=>{state.lesson.records[2].metal='Al';},state=>{state.lesson.records=null;},state=>{state.lesson=null;}]){
  const state=answerAll();mutate(state);assert.equal(assessReview(state).source.status,'missing');
 }
 for(const state of [null,undefined,{},[],true,'invalid'])assert.equal(assessReview(state).complete,false);
});

test('every answer or selected source change clears only its own check, and unchanged values retain it',()=>{
 const changes={origin:{recordId:'r2',donor:'Cu2',acceptor:'Zn',deposit:'Zn'},acids:{zincId:'a2',ironId:'a1',answer:'equal',evidenceId:'r8'},source:{copperId:'a1',answer:'no-bubbles'}};
 for(const [section,fields] of Object.entries(changes))for(const [field,value] of Object.entries(fields)){
  const state=answerAll(),before=structuredClone(state);
  const review=updateReview(state.review,section,field,value);
  assert.equal(review.answers[section].checked,false,`${section}.${field}`);
  assert.equal(assessReview({...state,review})[section].status,'ready');
  for(const other of ['origin','acids','source'].filter(s=>s!==section))assert.equal(review.answers[other].checked,true);
  assert.deepEqual(state,before);
  const same=updateReview(state.review,section,field,state.review.answers[section][field]);
  assert.equal(same.answers[section].checked,true);
  for(const empty of [null,'']){
   const cleared=updateReview(state.review,section,field,empty);
   assert.equal(cleared.answers[section][field],null);assert.equal(cleared.answers[section].checked,false);
   assert.equal(assessReview({...state,review:cleared})[section].status,'missing');
  }
 }
});

test('unknown fields, prototype names and unknown values cannot set answers or checks',()=>{
 const review=answerAll().review;
 for(const section of ['unknown','__proto__','constructor',[],null,undefined])assert.deepEqual(updateReview(review,section,'checked',true),review);
 for(const section of ['origin','acids','source']){
  for(const field of ['passed','status','complete','__proto__','constructor',[],['checked'],null])assert.deepEqual(updateReview(review,section,field,true),review);
  for(const value of ['true',1,null,{},[]])assert.deepEqual(updateReview(review,section,'checked',value),review);
 }
 for(const field of ['recordId','donor','acceptor','deposit'])for(const value of ['forged','__proto__',1,{},['Zn'],false,undefined])assert.deepEqual(updateReview(review,'origin',field,value),review);
 const unchecked=updateReview(review,'origin','checked',false);
 assert.equal(unchecked.answers.origin.checked,false);assert.equal(assessReview({...fixture(),review:unchecked}).origin.status,'ready');
 assert.deepEqual(updateReview(null,'invalid','invalid',true),freshReview());
});

test('opening or closing the review changes no answer or checked state',()=>{
 const review=answerAll().review;
 const opened=setReviewOpen(review,true),closed=setReviewOpen(opened,false);
 assert.equal(opened.open,true);assert.equal(closed.open,false);
 assert.deepEqual(opened.answers,review.answers);assert.deepEqual(closed,review);
 assert.notEqual(opened.answers,review.answers);
 for(const invalid of [1,'true',null,{},[]])assert.deepEqual(setReviewOpen(opened,invalid),opened);
});

test('missing and unknown stored schemas reset review only without changing experiment records',()=>{
 const state=freeze(answerAll()),before=structuredClone(state);
 for(const invalid of [undefined,null,{},[],true,1,'{}',{version:0,answers:{}},{version:2,answers:{}},{version:'1',answers:{}},{version:1},{version:1,answers:null},{version:1,answers:[]}]){
  assert.deepEqual(restoreReview(invalid,state),freshReview());
  assert.deepEqual(state,before);
 }
});

test('restoration strips forged success and unknown fields while preserving legitimate checked selections',()=>{
 const state=answerAll(),data=structuredClone(state.review);
 data.open=true;data.passed=true;data.status='verified';data.extra='discard';
 for(const section of Object.values(data.answers)){section.passed=true;section.status='verified';section.secret='discard';}
 data.answers.other={passed:true};
 const restored=restoreReview(data,state);
 assert.deepEqual(restored,{...state.review,open:true});
 assert.equal(assessReview({...state,review:restored}).complete,true);
 assert.equal(assessReview({...state,records:[],review:restored}).origin.status,'missing');
 assert.deepEqual(restoreReview(JSON.parse(JSON.stringify(restored)),state),restored);
});

test('restoration normalizes invalid values and IDs, revoking only affected checks',()=>{
 const state=answerAll();
 for(const section of ['origin','acids','source'])for(const field of Object.keys(correct[section]))for(const bad of [undefined,'unknown',true,1,[],{},'__proto__']){
  const data=structuredClone(state.review);data.answers[section][field]=bad;
  const restored=restoreReview(data,state);
  assert.equal(restored.answers[section][field],null);assert.equal(restored.answers[section].checked,false);
  for(const other of ['origin','acids','source'].filter(s=>s!==section))assert.equal(restored.answers[other].checked,true);
 }
 for(const [section,field] of [['origin','recordId'],['acids','zincId'],['acids','ironId'],['acids','evidenceId'],['source','copperId']]){
  const data=structuredClone(state.review),prefix=field==='recordId'||field==='evidenceId'?'r':'a';
  for(const bad of [`${prefix}0`,`${prefix}01`,`${prefix}1000000`,`${prefix}-1`,`${prefix}1 `,'<svg>',`${prefix}1\n`]){
   data.answers[section][field]=bad;
   assert.equal(restoreReview(data,state).answers[section][field],null);
   assert.equal(restoreReview(data).answers[section][field],null);
  }
  data.answers[section][field]=`${prefix}999`;
  assert.equal(restoreReview(data).answers[section][field],`${prefix}999`,'syntactically safe IDs can survive parsing without evidence context');
  const restored=restoreReview(data,state);
  assert.equal(restored.answers[section][field],null);assert.equal(restored.answers[section].checked,false);
 }
 for(const bad of ['true',1,[],{},null]){
  const data=structuredClone(state.review);data.answers.origin.checked=bad;
  assert.equal(restoreReview(data,state).answers.origin.checked,false);
 }
 const wrongRecord=structuredClone(state.review);wrongRecord.answers.origin.recordId='r2';
 assert.equal(restoreReview(wrongRecord,state).answers.origin.recordId,'r2','retained wrong choices stay available for corrective feedback');
 assert.equal(assessReview({...state,review:restoreReview(wrongRecord,state)}).origin.status,'revise');
});

test('malformed sections are isolated and checked flags with missing fields never yield success',()=>{
 for(const invalid of [null,[],true,'all correct',1]){
  const data=answerAll().review;data.answers.acids=invalid;
  const restored=restoreReview(data,fixture());
  assert.deepEqual(restored.answers.acids,freshReview().answers.acids);
  assert.equal(restored.answers.origin.checked,true);assert.equal(restored.answers.source.checked,true);
 }
 const data=freshReview();
 for(const section of Object.values(data.answers))section.checked=true;
 const restored=restoreReview(data,fixture());
 assert.deepEqual(restored,freshReview());assert.equal(assessReview({...fixture(),review:data}).complete,false);
});

test('inherited records, schemas, answers and reference properties cannot grant verification',()=>{
 const state=answerAll();
 assert.deepEqual(restoreReview(Object.create(state.review),state),freshReview());
 const inheritedAnswers={...state.review,answers:Object.create(state.review.answers)};
 assert.deepEqual(restoreReview(inheritedAnswers,state),freshReview());
 const inheritedOrigin=answerAll();
 inheritedOrigin.records[0]=Object.create(inheritedOrigin.records[0]);
 assert.equal(assessReview(inheritedOrigin).origin.status,'missing');
 const inheritedReference=answerAll();
 inheritedReference.lesson.links=Object.create({HCu:'reference'});
 assert.equal(assessReview(inheritedReference).source.status,'missing');
 const inheritedChecked=answerAll();
 inheritedChecked.review.answers.origin=Object.assign(Object.create({checked:true}),correct.origin);
 assert.equal(assessReview(inheritedChecked).origin.status,'ready');
});

test('replacing cups and retaining old history does not invalidate explicitly cited observations',()=>{
 let state=answerAll();
 const originalReview=structuredClone(state.review),originalRecords=structuredClone(state.records);
 state={...state,cups:freshSession().cups,extraCups:freshSession().extraCups,connections:{}};
 for(const metal of ['Zn','Fe','Cu'])state.lesson=replaceAcid(state.lesson,metal);
 assert.equal(assessReview(state).complete,true);
 state=appendRecord(state,'Cu','FeSO4').state;
 for(const metal of ['Zn','Fe','Cu'])state.lesson=observeAcid(state.lesson,metal);
 assert.equal(assessReview(state).complete,true);
 assert.deepEqual(state.records.slice(0,9),originalRecords);
 assert.deepEqual(state.review,originalReview);
 assert.equal(restoreReview(state.review,state).answers.source.copperId,'a3');
 const newSource=updateReview(state.review,'source','copperId','a6');
 assert.equal(assessReview({...state,review:newSource}).source.status,'ready','even a new matching Cu record must be explicitly checked');
});

test('full review reset clears all checks and selections without affecting surrounding evidence',()=>{
 const state=answerAll(),records=state.records,lesson=state.lesson;
 const reset={...state,review:freshReview()};
 assert.equal(assessReview(reset).verifiedCount,0);assert.equal(assessReview(reset).complete,false);
 assert.equal(reset.records,records);assert.equal(reset.lesson,lesson);
 assert.deepEqual(reset.review,freshReview());
});

test('feedback separates observation, known-material interpretation and supplied reference',()=>{
 const result=assessReview(answerAll());
 assert.match(result.origin.feedback,/紅棕色析出物與藍色變淡是觀察/);
 assert.match(result.origin.feedback,/依已知材料與反應模型/);
 assert.match(result.origin.feedback,/Zn 失去電子.*Cu²⁺ 得到電子/);
 assert.match(result.origin.feedback,/不是鋅變成銅/);
 assert.match(result.acids.feedback,/氣泡觀察不能排出鋅、鐵/);
 assert.match(result.acids.feedback,/灰黑色析出物.*依已知材料與置換模型/);
 assert.match(result.source.feedback,/未見明顯氣泡是你的觀察/);
 assert.match(result.source.feedback,/明確採用的參考資料/);
 assert.match(result.source.feedback,/不能把「沒看見氣泡」單獨當作排序證明/);
 for(const section of Object.values(result.sections))assert.doesNotMatch(section.feedback,/氣泡.*(?:更快|較快|更多|較多|更少|較少)/);
});

test('assessment, normalization and updates are deterministic and never mutate or alias external state',()=>{
 const state=freeze(answerAll()),before=structuredClone(state);
 assert.deepEqual(assessReview(state),assessReview(state));
 const restored=restoreReview(state.review,state),updated=updateReview(state.review,'origin','donor','Cu2');
 assert.notEqual(restored,state.review);assert.notEqual(restored.answers,state.review.answers);
 for(const section of ['origin','acids','source'])assert.notEqual(restored.answers[section],state.review.answers[section]);
 restored.answers.origin.recordId='r99';updated.answers.source.copperId='a99';
 const result=assessReview(state);
 result.origin.record.metal='Cu';result.acids.evidenceRecord.solution='ZnSO4';result.source.record.metal='Zn';
 assert.deepEqual(state,before);
 assert.equal(assessReview(state).complete,true);
});
