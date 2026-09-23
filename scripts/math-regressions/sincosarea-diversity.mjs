import assert from 'node:assert/strict';
import {load,mathText} from './helper.mjs';

const api=load('g11','sincosarea',20260923);
const byId=id=>api.CFG.units.find(unit=>unit.id===id);
const ambiguous=byId('ambiguous'),cosineAngle=byId('cosineangle');
assert.ok(ambiguous&&cosineAngle);

const structure=expr=>mathText(expr).replace(/\d+(?:\.\d+)?/g,'#').replace(/\s+/g,' ').trim();
const before={ambiguous:{basic:3,advanced:3,challenge:4},cosineangle:{basic:1,advanced:1,challenge:1}};
const after={ambiguous:{},cosineangle:{}};
const sampleKinds={ssaCount:[],ssaThirdAngle:[],degreeSymbol:[],degreeSegments:[],largestAngle:[]};
const ssaOutcomes={ssaCount:new Set(),ssaThirdAngle:new Set()},degreeAngles=new Set();
const retained=new Map([
 ['sa:45:42√2:42',{unit:ambiguous,expr:'△ABC 中，∠A＝45°、a＝42√2、b＝42。判斷可形成幾個三角形，並列出可能的 ∠B。',answer:'可形成 1 個；∠B＝30°'}],
 ['sa:45:49√2:49',{unit:ambiguous,expr:'△ABC 中，∠A＝45°、a＝49√2、b＝49。判斷可形成幾個三角形，並列出可能的 ∠B。',answer:'可形成 1 個；∠B＝30°'}],
 ['sa:30:42:84',{unit:ambiguous,expr:'△ABC 中，∠A＝30°、a＝42、b＝84。判斷可形成幾個三角形，並列出可能的 ∠B。',answer:'可形成 1 個；∠B＝90°'}],
 ['ca:45:45:72',{unit:cosineAngle,expr:'△ABC 的三邊為 a＝45、b＝45、c＝72。求 cosA，並判斷 ∠A 為銳角、直角或鈍角。',answer:'cosA＝((4)/(5))；∠A 為銳角'}],
 ['ca:104:112:120',{unit:cosineAngle,expr:'△ABC 的三邊為 a＝104、b＝112、c＝120。求 cosA，並判斷 ∠A 為銳角、直角或鈍角。',answer:'cosA＝((3)/(5))；∠A 為銳角'}]
]);

for(const [unitId,unit] of [['ambiguous',ambiguous],['cosineangle',cosineAngle]]){
 for(const level of ['basic','advanced','challenge']){
  const structures=new Set();
  for(let i=0;i<240;i++){
   const q=api.safeQuestion(unit,{level,modes:['integer'],mixed:false},new Set());
   assert.ok(q,`${unitId}/${level} exhausted`);
   assert.equal(q.verify(),true,`${unitId}/${level} verify`);
   assert.equal(api.contentGuard(q),true,`${unitId}/${level} guard`);
   structures.add(structure(q.expr));
   const bucket=q.sig.startsWith('sa:countOnly:')?'ssaCount':q.sig.startsWith('sa:angleC:')?'ssaThirdAngle':q.sig.startsWith('ca:degreeSymbol:')?'degreeSymbol':q.sig.startsWith('ca:degreeSegments:')?'degreeSegments':q.sig.startsWith('ca:largestAngle:')?'largestAngle':null;
   if(bucket&&sampleKinds[bucket].length<3&&!sampleKinds[bucket].some(x=>x.sig===q.sig))sampleKinds[bucket].push({level,expr:mathText(q.expr),answer:mathText(q.answer),sig:q.sig});
   if(bucket&&ssaOutcomes[bucket])ssaOutcomes[bucket].add(q.answer==='無法形成三角形'?0:Number(q.answer.match(/可形成 (\d+) 個/)[1]));
   if(bucket&&(bucket.startsWith('degree')||bucket==='largestAngle'))degreeAngles.add(Number(q.answer.match(/\d+/)[0]));
  }
  after[unitId][level]=structures.size;
  assert.ok(structures.size>before[unitId][level],`${unitId}/${level}: ${structures.size} did not exceed ${before[unitId][level]}`);
 }
}

for(const [kind,samples] of Object.entries(sampleKinds))assert.equal(samples.length,3,`${kind} needs three verified samples`);
for(const [kind,outcomes] of Object.entries(ssaOutcomes))assert.deepEqual([...outcomes].sort(),[0,1,2],`${kind} must cover no/one/two solutions`);
assert.deepEqual([...degreeAngles].sort((a,b)=>a-b),[60,90,120]);
for(let i=0;i<20000&&retained.size;i++)for(const unit of [ambiguous,cosineAngle]){
 const q=api.safeQuestion(unit,{level:'advanced',modes:['integer'],mixed:false},new Set()),expected=q&&retained.get(q.sig);
 if(!expected)continue;
 assert.equal(mathText(q.expr),expected.expr,`${q.sig} retained prompt`);
 assert.equal(mathText(q.answer),expected.answer,`${q.sig} retained answer`);
 assert.equal(q.verify(),true,`${q.sig} retained verify`);
 retained.delete(q.sig);
}
assert.deepEqual([...retained.keys()],[],`retained samples missing: ${[...retained.keys()].join(', ')}`);
assert.ok(after.cosineangle.basic>=3&&after.cosineangle.advanced>=3&&after.cosineangle.challenge>=4);
console.log(JSON.stringify({test:'sincosarea-diversity',before,after,samples:Object.fromEntries(Object.entries(sampleKinds).map(([kind,rows])=>[kind,rows.length])),retainedSamples:5,passed:true}));
