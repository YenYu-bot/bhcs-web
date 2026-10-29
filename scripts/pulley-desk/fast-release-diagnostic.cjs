'use strict';
// App-free, non-gating characterization. Neither click delivery nor suppression
// is an expected success condition: browser versions may legitimately differ.
const fs=require('node:fs'),path=require('node:path');
const {waitForTouchInput,waitForTouchClick}=require('./touch-delivery.cjs');
const {holdTouchEndpoint}=require('./touch-gesture.cjs');
const MINIMAL_PAGE='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Native touch characterization</title><style>body{margin:0;min-height:844px}button{position:absolute;height:48px}#rope-handle{left:203px;top:423px;width:48px;touch-action:none}#guide-next{left:40px;top:87.4375px;width:310px}</style></head><body><button id="rope-handle">Handle</button><button id="guide-next">Button</button></body></html>';
function recordMinimalInput(){
 window.__pulleyAudit={input:[]};
 for(const type of ['pointerdown','pointermove','pointerup','pointercancel','touchstart','touchend','mousedown','mouseup','click'])document.addEventListener(type,event=>{
  const sample={type,trusted:event.isTrusted,pointer:event.pointerType,pointerId:event.pointerId,isPrimary:event.isPrimary,clientX:event.clientX,clientY:event.clientY,targetButtonId:event.target.closest?.('button')?.id,timeStamp:event.timeStamp,now:performance.now(),defaultPreventedAtCapture:event.defaultPrevented};
  window.__pulleyAudit.input.push(sample);requestAnimationFrame(()=>{sample.defaultPreventedAfterDispatch=event.defaultPrevented;});
 },{capture:true,passive:true});
}
function summarizeNativeEvents(input){
 if(!Array.isArray(input))return null;
 const native=input.filter(event=>event.trusted===true),counts={};
 for(const event of native)counts[event.type]=(counts[event.type]||0)+1;
 const buttons=Object.fromEntries(['rope-handle','guide-next'].map(id=>{
  const events=native.filter(event=>event.targetButtonId===id),byType={};
  for(const event of events)byType[event.type]=(byType[event.type]||0)+1;
  return [id,{byType,clicks:events.filter(event=>event.type==='click').length,touchClicks:events.filter(event=>event.type==='click'&&event.pointer==='touch').length}];
 }));
 return {trustedTotal:native.length,byType:counts,buttons};
}
async function runFastReleaseCharacterization({browser,base,output}){
 const report={purpose:'App-free native touch gesture characterization; NOT acceptance and no required quirk outcome',browser:browser.version(),width:390,stoppingCondition:'Two fresh contexts, one75px eight-step drag and one native button tap each; stop after click observation or existing15s timeout. No retries.',cases:[]};
 const save=()=>fs.writeFileSync(path.join(output,'fast-release-characterization.json'),JSON.stringify(report,null,2));save();
 for(const gesture of ['fast-release','stationary-endpoint']){
  const result={gesture,status:'running',stage:'context',errors:[]};report.cases.push(result);save();let context,page;
  try{
   context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1,reducedMotion:'reduce'});
   await context.addInitScript(recordMinimalInput);
   await context.route('**/*',route=>route.request().url()===base+'/__pulley-native-touch-characterization__'?route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:MINIMAL_PAGE}):route.abort());
   page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>result.errors.push(e.message));
   await page.goto(base+'/__pulley-native-touch-characterization__',{waitUntil:'domcontentloaded'});
   const cdp=await context.newCDPSession(page),box=await page.locator('#rope-handle').boundingBox();
   if(!box)throw new Error('Minimal handle is not visible');
   const from={x:box.x+box.width/2,y:box.y+box.height/2},to={x:from.x,y:from.y+75};
   result.from=from;result.to=to;result.stage='drag';
   const since=await page.evaluate(()=>window.__pulleyAudit.input.length);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]});
   const pointerId=(await waitForTouchInput(page,{since,type:'pointerdown',point:from})).pointerId;
   for(let index=1;index<=8;index++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x,y:from.y+75*index/8,id:1}]});
   await waitForTouchInput(page,{since,type:'pointermove',pointerId,point:to});
   result.stationaryEndpoint=gesture==='stationary-endpoint'?await holdTouchEndpoint(cdp,to):null;
   const releaseStart=await page.evaluate(()=>window.__pulleyAudit.input.length);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await waitForTouchInput(page,{since:releaseStart,type:'pointerup',pointerId});
   result.stage='native-tap';const tapStart=await page.evaluate(()=>window.__pulleyAudit.input.length);
   await page.locator('#guide-next').tap();result.stage='tap-delivery';
   await waitForTouchClick(page,{since:tapStart,targetButtonId:'guide-next'});
   result.status='observed';result.clickDelivery='observed';
  }catch(error){
   result.status=result.stage==='tap-delivery'&&error.name==='TimeoutError'?'observed':'diagnostic-error';
   result.clickDelivery=result.status==='observed'?'not-observed-within-timeout':'undetermined';result.detail=error.message;
  }finally{
   if(page)result.input=await page.evaluate(()=>window.__pulleyAudit?.input).catch(error=>({captureError:error.message}));
   result.nativeEventSummary=summarizeNativeEvents(result.input);
   if(context)await context.close().catch(error=>{result.closeError=error.message;});save();
  }
 }
 const [fast,stationary]=report.cases;
 report.comparison={fastRelease:fast.clickDelivery,stationaryEndpoint:stationary.clickDelivery,sameObservedOutcome:report.cases.every(item=>item.status==='observed')?fast.clickDelivery===stationary.clickDelivery:null,interpretation:'Descriptive version-specific observations only; neither suppression nor delivery is a required outcome and no browser mechanism is proven.'};save();
 return report;
}
module.exports={MINIMAL_PAGE,recordMinimalInput,summarizeNativeEvents,runFastReleaseCharacterization};
