/** Test-only, hand-worked lesson responses. Never import into dist or user-facing exports. */
import {CourseEngine} from '../../tools/motion-graphs-desk/v2/engine.mjs';
export const ANSWERS={
 'A1.R':{tA:0,tB:4,deltaXRaw:'0',deltaTRaw:'4',velocityRaw:'0',motionChoice:'horizontal'},
 'A1.Uplus':{tA:1,tB:3,deltaXRaw:'4',deltaTRaw:'2',velocityRaw:'2',motionChoice:'rising'},
 'A1.Uminus':{tA:0,tB:4,deltaXRaw:'-8',deltaTRaw:'4',velocityRaw:'-2',motionChoice:'falling'},
 'A1.intercept':{canUseXOverT:'no',tInitial:0,xInitialRaw:'1',tFinal:2,xFinalRaw:'5'},
 'A2.match':{rTA:0,rTB:4,rGraph:'zero',plusTA:1,plusTB:3,plusGraph:'positive',minusTA:0,minusTB:4,minusGraph:'negative'},
 'A2.zero':{stationaryCases:['R'],reason:'speed-zero',rTA:0,rTB:4},
 'B.first.Aminus':{tA:0,tB:1,tC:2,deltaV1Raw:'-2',deltaT1Raw:'1',deltaV2Raw:'-2',deltaT2Raw:'1',accelerationRaw:'-2',direction:'right',trend:'slower'},
 'B.first.Aplus':{tA:0,tB:1,tC:2,deltaV1Raw:'+2',deltaT1Raw:'1',deltaV2Raw:'+2',deltaT2Raw:'1',accelerationRaw:'+2',direction:'left',trend:'slower'},
 'B.signGrid':{
  ppCase:'Aplus',ppT:3,ppDirection:'right',ppTrend:'faster',ppXtSlope:'positive',ppXtSteepness:'growing',
  pnCase:'Aminus',pnT:1,pnDirection:'right',pnTrend:'slower',pnXtSlope:'positive',pnXtSteepness:'shrinking',
  npCase:'Aplus',npT:1,npDirection:'left',npTrend:'slower',npXtSlope:'negative',npXtSteepness:'shrinking',
  nnCase:'Aminus',nnT:3,nnDirection:'left',nnTrend:'faster',nnXtSlope:'negative',nnXtSteepness:'growing'},
 'C.reverse.Aminus':{tBefore:1,tZero:2,tAfter:3,beforeSign:'positive',zeroSign:'zero',afterSign:'negative',turnTimeRaw:'2',extremum:'maximum'},
 'C.reverse.Aplus':{tBefore:1,tZero:2,tAfter:3,beforeSign:'negative',zeroSign:'zero',afterSign:'positive',turnTimeRaw:'2',extremum:'minimum'},
 'C.zeroInstant':{caseId:'Aminus',tBefore:1,tZero:2,tAfter:3,zeroInstant:'yes',wholeIntervalStill:'no',comparisonCase:'R'},
 'C.truncated':{caseId:'Aplus',windowStart:0,windowEnd:2,returnObserved:'no',reason:'only-reached-zero'},
 'C.negativeUniform':{caseId:'Uminus',tA:0,tB:4,turning:'no',reason:'velocity-keeps-negative'},
 'D.rectangle.Uplus':{tA:0,tB:4,baseRaw:'4',heightMagnitudeRaw:'2',areaMagnitudeRaw:'8',signedDisplacementRaw:'+8'},
 'D.rectangle.Uminus':{tA:0,tB:4,baseRaw:'4',heightMagnitudeRaw:'2',areaMagnitudeRaw:'8',signedDisplacementRaw:'-8'},
 'D.triangle.Aminus':{firstStart:0,firstEnd:2,secondStart:2,secondEnd:4,base1Raw:'2',height1Raw:'4',area1Raw:'4',sign1:'positive',base2Raw:'2',height2Raw:'4',area2Raw:'4',sign2:'negative',displacementRaw:'0',pathRaw:'8',startT:0,endT:4,startPositionRaw:'1',endPositionRaw:'1'},
 'D.triangle.Aplus':{firstStart:0,firstEnd:2,secondStart:2,secondEnd:4,base1Raw:'2',height1Raw:'4',area1Raw:'4',sign1:'negative',base2Raw:'2',height2Raw:'4',area2Raw:'4',sign2:'positive',displacementRaw:'0',pathRaw:'8',startT:0,endT:4,startPositionRaw:'1',endPositionRaw:'1'},
 'D.compare':{zeroDisplacementCases:['R','Aminus','Aplus'],zeroPathCases:['R'],turningCases:['Aminus','Aplus']}
};
export const ORDER=Object.freeze(Object.keys(ANSWERS));
export function observe(engine,caseId,through){const selected=engine.selectCase(caseId);if(!selected.ok)throw Error(`${caseId}: ${selected.reason}`);const start=engine.start();if(!start.ok)throw Error(start.reason);while(engine.state.cases[caseId].observedInteger<through){const result=engine.step();if(!result.ok)throw Error(`${caseId} step: ${result.reason}`);}return engine;}
export function answer(engine,id,response=ANSWERS[id]){const set=engine.setAnswer(id,response);if(!set.ok)throw Error(`${id} set: ${set.reason}`);const checked=engine.checkAnswer(id);if(!checked.ok||!checked.passed)throw Error(`${id} check: ${JSON.stringify(checked)}`);return engine;}
export function advanceCourse(engine,until='D.compare'){
 for(const id of ORDER){
  if(['A1.R','A1.Uplus','A1.Uminus'].includes(id))observe(engine,id.slice(3),4);
  if(id.startsWith('B.first.'))observe(engine,id.slice(8),2);
  if(id==='B.signGrid'){observe(engine,'Aminus',4);observe(engine,'Aplus',4);}
  answer(engine,id);if(id===until)break;
 }
 return engine;
}
export function completeCourse(options){return advanceCourse(new CourseEngine(null,options));}
export function maximumCourse(){const e=new CourseEngine();
 for(const id of ORDER){if(['A1.R','A1.Uplus','A1.Uminus'].includes(id))observe(e,id.slice(3),4);if(id.startsWith('B.first.'))observe(e,id.slice(8),2);if(id==='B.signGrid'){observe(e,'Aminus',4);observe(e,'Aplus',4);}const response={...ANSWERS[id]};for(const [key,value]of Object.entries(response))if(typeof value==='string'&&/^[+-]?\d+(?:\.\d+)?$/.test(value))response[key]=value.padStart(16,' ');answer(e,id,response);}
 for(let n=0;n<100;n++)e.checkAnswer('D.compare');e.setReflection('文'.repeat(500));return e;
}
