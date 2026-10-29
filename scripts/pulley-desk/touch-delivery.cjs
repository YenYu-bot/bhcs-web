'use strict';
// Pure passive-event predicate, serialized by Playwright into the page realm.
// Test instrumentation observes input; it never reads or changes application state.
function observedTouchInput({since,type,pointerId,point}){
 const events=window.__pulleyAudit?.input||[];
 return events.slice(since).find(event=>event.type===type&&event.trusted===true&&event.pointer==='touch'&&Number.isFinite(event.pointerId)&&event.targetButtonId==='rope-handle'&&(pointerId===undefined||event.pointerId===pointerId)&&(!point||(Number.isFinite(event.clientX)&&Number.isFinite(event.clientY)&&Math.abs(event.clientX-point.x)<=0.5&&Math.abs(event.clientY-point.y)<=0.5)))||false;
}
async function waitForTouchInput(page,observation){
 // Keep the page's existing timeout. A missing/wrong native event fails closed;
 // do not retry the input, change the expected model result, or sleep a fixed time.
 const handle=await page.waitForFunction(observedTouchInput,observation,{polling:'raf'});
 try{return await handle.jsonValue();}finally{await handle.dispose();}
}
module.exports={observedTouchInput,waitForTouchInput};
