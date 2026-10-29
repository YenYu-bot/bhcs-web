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
// A completed tap command is not itself proof of native click delivery.
// Associate a fresh trusted touch down/up on the requested button, then observe
// its subsequent trusted touch click; do not invent a CDP contact/click ID rule.
function observedTouchClick({since,targetButtonId}){
 if(!targetButtonId)return false;
 const events=(window.__pulleyAudit?.input||[]).slice(since);
 const matches=event=>event.trusted===true&&event.pointer==='touch'&&event.targetButtonId===targetButtonId;
 const down=events.findIndex(event=>event.type==='pointerdown'&&matches(event)&&Number.isFinite(event.pointerId));
 if(down<0)return false;
 const up=events.findIndex((event,index)=>index>down&&event.type==='pointerup'&&matches(event)&&event.pointerId===events[down].pointerId);
 if(up<0)return false;
 return events.slice(up+1).find(event=>event.type==='click'&&matches(event))||false;
}
async function waitForTouchClick(page,observation){
 const handle=await page.waitForFunction(observedTouchClick,observation,{polling:'raf'});
 try{return await handle.jsonValue();}finally{await handle.dispose();}
}
module.exports={observedTouchInput,waitForTouchInput,observedTouchClick,waitForTouchClick};
