import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import oracle from './browser-oracle.cjs';
const {QUESTIONS}=oracle;
const IDs=['A1.R','A1.Uplus','A1.Uminus','A1.intercept','A2.match','A2.zero','B.first.Aminus','B.first.Aplus','B.signGrid','C.reverse.Aminus','C.reverse.Aplus','C.zeroInstant','C.truncated','C.negativeUniform','D.rectangle.Uplus','D.rectangle.Uminus','D.triangle.Aminus','D.triangle.Aplus','D.compare'];
const answer=id=>QUESTIONS.find(q=>q.id===id).response;
test('all nineteen exact UI tasks, ordered observation gates and deeply frozen input types',()=>{
 assert.deepEqual(QUESTIONS.map(q=>q.id),IDs);assert.ok(Object.isFrozen(QUESTIONS));
 const observations={};for(const q of QUESTIONS){assert.deepEqual(Object.keys(q),['id','caseId','observeTo','response']);assert.ok(['R','Uplus','Uminus','Aminus','Aplus'].includes(q.caseId));assert.ok(Object.isFrozen(q));assert.ok(Object.isFrozen(q.response));for(const [path,value]of Object.entries(q.response)){assert.ok(path&&!path.includes('.'),'UI paths are flat metadata keys');if(path.endsWith('Raw'))assert.equal(typeof value,'string');else if(Array.isArray(value)){assert.ok(Object.isFrozen(value));assert.equal(new Set(value).size,value.length);}else assert.ok(typeof value==='string'||Number.isInteger(value));}for(const [id,t]of Object.entries(q.observeTo)){assert.ok(t===2||t===4);assert.ok((observations[id]??-1)<t);observations[id]=t;}}
 assert.deepEqual(observations,{R:4,Uplus:4,Uminus:4,Aminus:4,Aplus:4});
 assert.deepEqual(QUESTIONS.find(q=>q.id==='B.first.Aminus').observeTo,{Aminus:2});assert.deepEqual(QUESTIONS.find(q=>q.id==='B.first.Aplus').observeTo,{Aplus:2});assert.deepEqual(QUESTIONS.find(q=>q.id==='B.signGrid').observeTo,{Aminus:4,Aplus:4});
});
test('nonzero intercept and constant-velocity differences use positions, not x divided by t',()=>{
 assert.deepEqual([answer('A1.R').deltaXRaw,answer('A1.R').velocityRaw],['0','0']);
 const plus=answer('A1.Uplus');assert.deepEqual([plus.tA,plus.tB],[1,3]);assert.equal(+plus.deltaXRaw,7-3);assert.equal(+plus.deltaTRaw,3-1);assert.equal(+plus.velocityRaw,(7-3)/(3-1));
 const minus=answer('A1.Uminus');assert.equal(+minus.deltaXRaw,-7-1);assert.equal(+minus.deltaTRaw,4);assert.equal(+minus.velocityRaw,-8/4);
 assert.deepEqual(answer('A1.intercept'),{canUseXOverT:'no',tInitial:0,xInitialRaw:'1',tFinal:2,xFinalRaw:'5'});
 assert.deepEqual([answer('A2.match').rGraph,answer('A2.match').plusGraph,answer('A2.match').minusGraph],['zero','positive','negative']);assert.deepEqual(answer('A2.zero').stationaryCases,['R']);
});
test('acceleration signs, four independent evidence references and turning cases are hand-derived',()=>{
 for(const [id,velocities,direction]of [['Aminus',[4,2,0],'right'],['Aplus',[-4,-2,0],'left']]){const a=answer('B.first.'+id);assert.equal(+a.deltaV1Raw,velocities[1]-velocities[0]);assert.equal(+a.deltaV2Raw,velocities[2]-velocities[1]);assert.equal(+a.deltaT1Raw,1);assert.equal(+a.deltaT2Raw,1);assert.equal(+a.accelerationRaw,velocities[1]-velocities[0]);assert.equal(a.direction,direction);assert.equal(a.trend,'slower');}
 const g=answer('B.signGrid'),expected=[['pp','Aplus',3,'right','faster','positive','growing'],['pn','Aminus',1,'right','slower','positive','shrinking'],['np','Aplus',1,'left','slower','negative','shrinking'],['nn','Aminus',3,'left','faster','negative','growing']];for(const [p,...values]of expected)assert.deepEqual(['Case','T','Direction','Trend','XtSlope','XtSteepness'].map(s=>g[p+s]),values);assert.equal(new Set(['pp','pn','np','nn'].map(p=>g[p+'Case']+g[p+'T'])).size,4);
 assert.deepEqual(['beforeSign','zeroSign','afterSign','extremum'].map(k=>answer('C.reverse.Aminus')[k]),['positive','zero','negative','maximum']);assert.deepEqual(['beforeSign','zeroSign','afterSign','extremum'].map(k=>answer('C.reverse.Aplus')[k]),['negative','zero','positive','minimum']);
 assert.equal(answer('C.zeroInstant').zeroInstant,'yes');assert.equal(answer('C.zeroInstant').wholeIntervalStill,'no');assert.equal(answer('C.truncated').returnObserved,'no');assert.equal(answer('C.truncated').windowEnd,2);assert.equal(answer('C.negativeUniform').turning,'no');
});
test('area sign, absolute path and initial/final comparison remain distinct',()=>{
 for(const [id,sign]of [['Uplus',1],['Uminus',-1]]){const a=answer('D.rectangle.'+id);assert.equal(+a.baseRaw,4);assert.equal(+a.heightMagnitudeRaw,2);assert.equal(+a.areaMagnitudeRaw,4*2);assert.equal(+a.signedDisplacementRaw,sign*4*2);}
 for(const [id,signs]of [['Aminus',['positive','negative']],['Aplus',['negative','positive']]]){const a=answer('D.triangle.'+id);assert.deepEqual([a.firstStart,a.firstEnd,a.secondStart,a.secondEnd],[0,2,2,4]);for(const n of [1,2]){assert.equal(+a['base'+n+'Raw'],2);assert.equal(+a['height'+n+'Raw'],4);assert.equal(+a['area'+n+'Raw'],2*4/2);}assert.deepEqual([a.sign1,a.sign2],signs);assert.equal(+a.displacementRaw,4-4);assert.equal(+a.pathRaw,4+4);assert.equal(+a.startPositionRaw,1);assert.equal(+a.endPositionRaw,1);}
 assert.deepEqual(answer('D.compare'),{zeroDisplacementCases:['R','Aminus','Aplus'],zeroPathCases:['R'],turningCases:['Aminus','Aplus']});
});
test('browser oracle is inert data, not an application or engine accessor',()=>{const source=fs.readFileSync(new URL('./browser-oracle.cjs',import.meta.url),'utf8');assert.doesNotMatch(source,/require\s*\(|\bimport\b[^\n]*from|CourseEngine|\.evaluate\(|window\.|localStorage|setAnswer|derive\s*\(/);});
