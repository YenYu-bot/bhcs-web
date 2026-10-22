import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createInitialState } from '../assets/circuit-guided/engine.js';
import { FIXED_CIRCUITS } from '../assets/circuit-guided/model.js';
import * as S from '../assets/circuit-guided/script.js';

let tests=0;
const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};
const cloneW=(name)=>FIXED_CIRCUITS[name].map(w=>({...w}));
const rec=(trialId,name)=>({trialId,wires:cloneW(name),switchClosed:true});
const records={
  b:rec('baseline','baseline'),
  o:rec('trial1','trial1'),
  t:rec('trial2-total','trial2Total'),
  l1:rec('trial2-L1','trial2L1'),
  l2:rec('trial2-L2','trial2L2'),
};
const base=(phase,extra={})=>({
  ...createInitialState(),
  phase,
  ...extra,
  compare:extra.compare??createInitialState().compare,
});
const fullRecords=()=>[records.b,records.o,records.t,records.l1,records.l2].map(r=>({...r,wires:r.wires.map(w=>({...w}))}));
const forbidden=/串聯|並聯|等效電阻|歐姆定律|I\s*=\s*V\s*\/\s*R|總電阻變大|總電阻變小|串聯電阻|並聯電阻|支路電流總和|\bseries\b|\bparallel\b/i;

test('three-step Guided navigation maps phases without adding B4 screens',()=>{
  assert.deepEqual(S.STEPS.map(x=>x.id),['mission','experiment','findings']);
  assert.equal(S.stepFor(base('welcome')),'mission');
  assert.equal(S.stepFor(base('baseline-build')),'experiment');
  assert.equal(S.stepFor(base('compare2')),'experiment');
  assert.equal(S.stepFor(base('inference')),'findings');
  assert.equal(S.stepFor(base('concept')),'findings');
});

test('main CTA contract stops at Concept',()=>{
  assert.deepEqual(S.ctaFor(base('welcome')), {label:'開始',action:{type:'START'},enabled:true});
  assert.deepEqual(S.ctaFor(base('mission')), {label:'進入實驗桌',action:{type:'BEGIN'},enabled:true});
  assert.equal(S.ctaFor(base('baseline-build')),null);
  let st=base('baseline-measure',{wires:cloneW('baseline'),switchClosed:false});
  assert.equal(S.ctaFor(st).enabled,false);
  st={...st,switchClosed:true};
  assert.deepEqual(S.ctaFor(st),{label:'記錄基準量測',action:{type:'RECORD_MEASUREMENT'},enabled:true});
  assert.equal(S.ctaFor(base('concept',{records:fullRecords()})),null);
});

test('bench presentation comes only from raw state and model-derived readings',()=>{
  let st=base('baseline-measure',{wires:cloneW('baseline'),switchClosed:false});
  let m=S.benchModel(st);
  assert.equal(m.status,'open');
  assert.equal(m.ammeter.text,'0.0 A');
  assert.equal(m.voltmeter.text,'0.0 V');
  assert.equal(m.lamps.L1.brightness,'off');
  st={...st,switchClosed:true};
  m=S.benchModel(st);
  assert.equal(m.status,'normal');
  assert.equal(m.ammeter.text,'1.0 A');
  assert.equal(m.voltmeter.text,'6.0 V');
  assert.equal(m.lamps.L1.brightness,'reference');
  assert.equal(S.benchModel(base('compare1')),null);
});

test('record evidence is reconstructed from raw records',()=>{
  const st=base('compare1',{records:[records.b,records.o]});
  const e=S.evidenceModel(st);
  assert.deepEqual(e.items.map(x=>x.id),['baseline','trial1']);
  assert.match(JSON.stringify(e),/1\.0 A/);
  assert.match(JSON.stringify(e),/0\.5 A/);
  assert.match(JSON.stringify(e),/3\.0 V/);
});

test('compare 1 uses measured evidence and engine correctness',()=>{
  const compare={c1:{totalChange:'decrease',claim:'one-path-only'},c2:{totalChange:null,branchRelation:null}};
  const st=base('compare1',{records:[records.b,records.o],compare});
  const m=S.compareModel(st);
  assert.equal(m.observedResponse[0].first,'1.0 A');
  assert.equal(m.observedResponse[0].second,'0.5 A');
  assert.ok(m.questions.every(q=>q.feedback?.kind==='success'));
  assert.equal(S.ctaFor(st).enabled,true);
});

test('compare 2 keeps equal branch readings structurally distinct',()=>{
  const compare={c1:{totalChange:'decrease',claim:'one-path-only'},c2:{totalChange:'increase',branchRelation:'sum'}};
  const st=base('compare2',{records:fullRecords(),compare});
  const m=S.compareModel(st);
  assert.equal(m.observedResponse[0].first,'1.0 A');
  assert.equal(m.observedResponse[0].second,'2.0 A');
  assert.match(m.procedureNote,/燈泡 1 那一路 1\.0 A/);
  assert.match(m.procedureNote,/燈泡 2 那一路 1\.0 A/);
  assert.ok(m.questions.every(q=>q.feedback?.kind==='success'));
  assert.equal(S.ctaFor(st).enabled,true);
});

test('inference answers the core question without formal names',()=>{
  const m=S.inferenceModel(base('inference',{records:fullRecords()}));
  assert.ok(m);
  const text=JSON.stringify(m);
  assert.match(text,/一定變小.*不成立/);
  assert.match(text,/0\.5 A/);
  assert.match(text,/2\.0 A/);
  assert.doesNotMatch(text,forbidden);
});

test('all pre-Concept view models are free of the formal vocabulary',()=>{
  const cases=[
    base('welcome'),
    base('mission'),
    base('baseline-build'),
    base('baseline-measure',{wires:cloneW('baseline'),switchClosed:false}),
    base('trial1-build',{records:[records.b],wires:cloneW('baseline'),switchClosed:true}),
    base('trial1-measure',{records:[records.b],wires:cloneW('trial1'),switchClosed:false}),
    base('compare1',{records:[records.b,records.o]}),
    base('trial2-build',{records:[records.b,records.o],wires:cloneW('trial1'),switchClosed:true}),
    base('trial2-total',{records:[records.b,records.o],wires:cloneW('trial2Total'),switchClosed:false}),
    base('trial2-branch1',{records:[records.b,records.o,records.t],wires:cloneW('trial2L1'),switchClosed:false}),
    base('trial2-branch2',{records:[records.b,records.o,records.t,records.l1],wires:cloneW('trial2L2'),switchClosed:false}),
    base('compare2',{records:fullRecords()}),
    base('inference',{records:fullRecords()}),
  ];
  for(const st of cases){
    const models=[
      S.welcomeModel(st),S.ctaFor(st),S.coachModel(st),S.statusModel(st),S.dataModel(st),S.evidenceModel(st),
      S.benchModel(st),S.compareModel(st),S.inferenceModel(st),
    ].filter(Boolean);
    assert.doesNotMatch(JSON.stringify(models),forbidden,st.phase);
    assert.equal(S.conceptModel(st),null,st.phase);
  }
});

test('Concept is the first view that contains formal circuit names and Ohm relation',()=>{
  const m=S.conceptModel(base('concept',{records:fullRecords()}));
  assert.ok(m);
  const text=JSON.stringify(m);
  for(const re of[/串聯/,/並聯/,/等效電阻/,/歐姆定律/,/I = V \/ R/]) assert.match(text,re);
  assert.match(text,/12\.0 Ω/);
  assert.match(text,/3\.0 Ω/);
  assert.match(text,/0\.5 A/);
  assert.match(text,/2\.0 A/);
  assert.match(text,/電流.*不是.*用掉/);
});

test('source short stays a safety warning without fabricated readings',()=>{
  const st=base('baseline-measure',{wires:[{from:'bat+',to:'A.+'},{from:'A.-',to:'bat-'}],switchClosed:true});
  const b=S.benchModel(st),status=S.statusModel(st);
  assert.equal(b.status,'source-short');
  assert.equal(b.ammeter.text,'—');
  assert.equal(status.kind,'warning');
  assert.match(status.text,/安全警示/);
  assert.ok(!/Infinity|NaN/.test(JSON.stringify([b,status])));
});

test('announcements describe transitions and records but never inject Concept early',()=>{
  let a=S.announcementFor({result:{accepted:true,events:[],transitions:[{from:'mission',to:'baseline-build'}]},state:base('baseline-build'),seq:1});
  assert.match(a.text,/基準接線/);
  assert.doesNotMatch(a.text,forbidden);
  a=S.announcementFor({result:{accepted:true,events:[{type:'record-written',trialId:'baseline'}],transitions:[]},state:base('trial1-build',{records:[records.b]}),seq:2});
  assert.match(a.text,/已記錄/);
  assert.doesNotMatch(a.text,forbidden);
  a=S.announcementFor({result:{accepted:true,events:[],transitions:[{from:'inference',to:'concept'}]},state:base('concept',{records:fullRecords()}),seq:3});
  assert.match(a.text,/正式名稱/);
});

{const src=fs.readFileSync(new URL('../assets/circuit-guided/script.js',import.meta.url),'utf8');
 assert.ok(!src.includes('只改接法，其他條件固定'),'mission must not claim only the connection changes');
 assert.match(src,/燈泡數量.{0,6}接法/);assert.match(src,/燈泡數量相同、只改接法/);tests++;console.log('PASS wording separates number of lamps from connection and names the strict two-lamp comparison')}
console.log('circuit-guided script: '+tests+' tests passed');
