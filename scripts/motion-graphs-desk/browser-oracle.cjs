'use strict';
// Independent browser-input fixture, not a model import or application state hook.
// Hand-worked fixed cases: x0=1; R v=0; U± v=±2; A− v=4−2t;
// A+ v=−4+2t. Raw strings below are typed into the actual form by the driver.
// observeTo lists only observation actions needed at that task's position in order.
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const q=(id,caseId,observeTo,response)=>({id,caseId,observeTo,response});
const QUESTIONS=freeze([
 q('A1.R','R',{R:4},{tA:0,tB:4,deltaXRaw:'0',deltaTRaw:'4',velocityRaw:'0',motionChoice:'horizontal'}),
 q('A1.Uplus','Uplus',{Uplus:4},{tA:1,tB:3,deltaXRaw:'4',deltaTRaw:'2',velocityRaw:'2',motionChoice:'rising'}),
 q('A1.Uminus','Uminus',{Uminus:4},{tA:0,tB:4,deltaXRaw:'-8',deltaTRaw:'4',velocityRaw:'-2',motionChoice:'falling'}),
 q('A1.intercept','Uplus',{}, {canUseXOverT:'no',tInitial:0,xInitialRaw:'1',tFinal:2,xFinalRaw:'5'}),
 q('A2.match','Uplus',{}, {rTA:0,rTB:4,rGraph:'zero',plusTA:1,plusTB:3,plusGraph:'positive',minusTA:0,minusTB:4,minusGraph:'negative'}),
 q('A2.zero','R',{}, {stationaryCases:['R'],reason:'speed-zero',rTA:0,rTB:4}),
 q('B.first.Aminus','Aminus',{Aminus:2}, {tA:0,tB:1,tC:2,deltaV1Raw:'-2',deltaT1Raw:'1',deltaV2Raw:'-2',deltaT2Raw:'1',accelerationRaw:'-2',direction:'right',trend:'slower'}),
 q('B.first.Aplus','Aplus',{Aplus:2}, {tA:0,tB:1,tC:2,deltaV1Raw:'2',deltaT1Raw:'1',deltaV2Raw:'2',deltaT2Raw:'1',accelerationRaw:'2',direction:'left',trend:'slower'}),
 q('B.signGrid','Aminus',{Aminus:4,Aplus:4}, {
  ppCase:'Aplus',ppT:3,ppDirection:'right',ppTrend:'faster',ppXtSlope:'positive',ppXtSteepness:'growing',
  pnCase:'Aminus',pnT:1,pnDirection:'right',pnTrend:'slower',pnXtSlope:'positive',pnXtSteepness:'shrinking',
  npCase:'Aplus',npT:1,npDirection:'left',npTrend:'slower',npXtSlope:'negative',npXtSteepness:'shrinking',
  nnCase:'Aminus',nnT:3,nnDirection:'left',nnTrend:'faster',nnXtSlope:'negative',nnXtSteepness:'growing'}),
 q('C.reverse.Aminus','Aminus',{}, {tBefore:1,tZero:2,tAfter:3,beforeSign:'positive',zeroSign:'zero',afterSign:'negative',turnTimeRaw:'2',extremum:'maximum'}),
 q('C.reverse.Aplus','Aplus',{}, {tBefore:1,tZero:2,tAfter:3,beforeSign:'negative',zeroSign:'zero',afterSign:'positive',turnTimeRaw:'2',extremum:'minimum'}),
 q('C.zeroInstant','Aminus',{}, {caseId:'Aminus',tBefore:1,tZero:2,tAfter:3,zeroInstant:'yes',wholeIntervalStill:'no',comparisonCase:'R'}),
 q('C.truncated','Aplus',{}, {caseId:'Aplus',windowStart:0,windowEnd:2,returnObserved:'no',reason:'only-reached-zero'}),
 q('C.negativeUniform','Uminus',{}, {caseId:'Uminus',tA:0,tB:4,turning:'no',reason:'velocity-keeps-negative'}),
 q('D.rectangle.Uplus','Uplus',{}, {tA:0,tB:4,baseRaw:'4',heightMagnitudeRaw:'2',areaMagnitudeRaw:'8',signedDisplacementRaw:'8'}),
 q('D.rectangle.Uminus','Uminus',{}, {tA:0,tB:4,baseRaw:'4',heightMagnitudeRaw:'2',areaMagnitudeRaw:'8',signedDisplacementRaw:'-8'}),
 q('D.triangle.Aminus','Aminus',{}, {firstStart:0,firstEnd:2,secondStart:2,secondEnd:4,base1Raw:'2',height1Raw:'4',area1Raw:'4',sign1:'positive',base2Raw:'2',height2Raw:'4',area2Raw:'4',sign2:'negative',displacementRaw:'0',pathRaw:'8',startT:0,endT:4,startPositionRaw:'1',endPositionRaw:'1'}),
 q('D.triangle.Aplus','Aplus',{}, {firstStart:0,firstEnd:2,secondStart:2,secondEnd:4,base1Raw:'2',height1Raw:'4',area1Raw:'4',sign1:'negative',base2Raw:'2',height2Raw:'4',area2Raw:'4',sign2:'positive',displacementRaw:'0',pathRaw:'8',startT:0,endT:4,startPositionRaw:'1',endPositionRaw:'1'}),
 q('D.compare','R',{}, {zeroDisplacementCases:['R','Aminus','Aplus'],zeroPathCases:['R'],turningCases:['Aminus','Aplus']}),
]);
module.exports={QUESTIONS};
