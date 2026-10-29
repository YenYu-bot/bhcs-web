'use strict';
// Diagnostic only: these observations never contribute to acceptance results.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {waitForTouchClick}=require('./touch-delivery.cjs');
const VARIANTS=Object.freeze(['mixed-session','button-only','same-session']);
function installTouchDiagnosticProbe(){
 if(location.protocol!=='http:')return;
 const nodes=new WeakMap();let nextNode=1;
 const identity=node=>{if(!node)return null;if(!nodes.has(node))nodes.set(node,nextNode++);return nodes.get(node);};
 const element=node=>({id:node?.id||null,node:identity(node)});
 const view=()=>({scrollX,scrollY,innerWidth,innerHeight,visualViewport:visualViewport?{offsetLeft:visualViewport.offsetLeft,offsetTop:visualViewport.offsetTop,pageLeft:visualViewport.pageLeft,pageTop:visualViewport.pageTop,width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale}:null});
 const button=id=>{const node=document.getElementById(id);return node?{...element(node),connected:node.isConnected,disabled:node.disabled,key:node.dataset.key,rect:node.getBoundingClientRect().toJSON(),touchAction:getComputedStyle(node).touchAction}:null;};
 const state=()=>({guide:button('guide-next'),handle:button('rope-handle'),height:document.getElementById('height-value')?.textContent,recordCount:document.querySelectorAll('#records .record').length,active:element(document.activeElement),view:view()});
 const events=[],markers=[];window.__pulleyAudit={access:[],input:[]};
 window.__pulleyDiagnostic={events,markers,state,mark:label=>markers.push({label,now:performance.now(),state:state()})};
 const touchList=list=>list?[...list].map(t=>({identifier:t.identifier,clientX:t.clientX,clientY:t.clientY,target:element(t.target)})):null;
 for(const type of ['pointerdown','pointermove','pointerup','pointercancel','gotpointercapture','lostpointercapture','touchstart','touchmove','touchend','touchcancel','mousedown','mouseup','click','dblclick']){
  document.addEventListener(type,event=>{
   const sample={type,trusted:event.isTrusted,pointer:event.pointerType,pointerId:event.pointerId,isPrimary:event.isPrimary,clientX:event.clientX,clientY:event.clientY,targetButtonId:event.target.closest?.('button')?.id,targetId:event.target.closest?.('[id]')?.id,targetNode:identity(event.target),detail:event.detail,timeStamp:event.timeStamp,now:performance.now(),cancelable:event.cancelable,defaultPreventedAtCapture:event.defaultPrevented,touches:touchList(event.touches),changedTouches:touchList(event.changedTouches),stateAtCapture:state()};
   events.push(sample);window.__pulleyAudit.input.push(sample);
   // A later animation frame observes the final event flag after dispatch, even
   // if propagation was stopped. This schedules observation, not delayed input.
   requestAnimationFrame(()=>{sample.defaultPreventedAfterDispatch=event.defaultPrevented;sample.afterDispatchNow=performance.now();sample.stateAfterDispatch=state();});
  },{capture:true,passive:true});
 }
 let lastGuide=null;
 new MutationObserver(changes=>{
  const guide=document.getElementById('guide-next'),node=identity(guide);
  const disabled=changes.filter(change=>change.type==='attributes'&&['guide-next','rope-handle'].includes(change.target.id)).map(change=>({target:element(change.target),oldValue:change.oldValue,currentValue:change.target.getAttribute('disabled')}));
  if(node!==lastGuide||disabled.length){events.push({type:'dom-observation',now:performance.now(),previousGuideNode:lastGuide,guideNode:node,disabled,state:state()});lastGuide=node;}
 }).observe(document,{subtree:true,childList:true,attributes:true,attributeOldValue:true,attributeFilter:['disabled']});
 const viewportEvent=event=>events.push({type:event.type,source:event.target===visualViewport?'visualViewport':'window',now:performance.now(),view:view()});
 window.addEventListener('scroll',viewportEvent,{capture:true,passive:true});
 window.addEventListener('resize',viewportEvent,{passive:true});
 visualViewport?.addEventListener('scroll',viewportEvent,{passive:true});
 visualViewport?.addEventListener('resize',viewportEvent,{passive:true});
}
async function tapOnDragSession(page,selector,cdp){
 const target=page.locator(selector);assert.ok(await target.isEnabled(),'diagnostic target enabled');
 await target.scrollIntoViewIfNeeded();const box=await target.boundingBox();assert.ok(box,'diagnostic target visible');
 const point={x:box.x+box.width/2,y:box.y+box.height/2},targetButtonId=await target.getAttribute('id');
 assert.ok(point.x>=0&&point.x<page.viewportSize().width&&point.y>=0&&point.y<page.viewportSize().height,'diagnostic tap is in viewport');
 assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.closest('button')?.id,point),targetButtonId,'diagnostic native tap hits target');
 const since=await page.evaluate(()=>window.__pulleyAudit.input.length);
 // Match Playwright 1.58.2 RawTouchscreenImpl's native start/end submission:
 // omitted contact ID, zero modifiers, both commands issued via Promise.all.
 // Only this diagnostic uses the explicit session shared with the drag helper.
 await Promise.all([
  cdp.send('Input.dispatchTouchEvent',{type:'touchStart',modifiers:0,touchPoints:[point]}),
  cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',modifiers:0,touchPoints:[]})
 ]);
 await waitForTouchClick(page,{since,targetButtonId});
}
async function runTouchDiagnosticMatrix({browser,base,output,activate,drag}){
 const report={purpose:'390px native click suppression diagnosis; NOT acceptance',stoppingCondition:'Each of three fresh contexts runs once to first error or first saved fixed record; no input retries.',width:390,variants:[]};
 const save=()=>fs.writeFileSync(path.join(output,'touch-diagnostic-390.json'),JSON.stringify(report,null,2));
 save();
 for(const variant of VARIANTS){
  const result={variant,status:'running',stage:'context',errors:[],failedResponses:[],external:[]};report.variants.push(result);save();let context,page;
  try{
   context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1,reducedMotion:'reduce'});
   await context.addInitScript(installTouchDiagnosticProbe);page=await context.newPage();page.setDefaultTimeout(15000);
   page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)result.failedResponses.push(`${r.status()} ${r.url()}`);});
   await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==base){result.external.push(route.request().url());return route.abort();}return route.continue();});
   await page.goto(base+'/tools/pulley-desk/',{waitUntil:'networkidle'});await page.locator('#guide-next[data-key="start"]').waitFor();
   const cdp=await context.newCDPSession(page);
   const tap=selector=>variant==='same-session'?tapOnDragSession(page,selector,cdp):activate(page,selector,cdp);
   const step=async(label,action)=>{result.stage=label;await page.evaluate(label=>window.__pulleyDiagnostic.mark('before:'+label),label);await action();await page.evaluate(label=>window.__pulleyDiagnostic.mark('after:'+label),label);};
   await step('start-fixed',()=>tap('#guide-next'));
   if(variant==='button-only'){
    for(let i=1;i<=4;i++)await step('rise-five-'+i,()=>tap('#rise-five'));
   }else{
    await step('cancel-target-preview',()=>drag(page,cdp,'fixed',20,{cancel:true}));
    await step('commit-five',()=>drag(page,cdp,'fixed',5));
    await step('reverse-no-op',()=>drag(page,cdp,'fixed',5,{reverse:true}));
    await step('commit-fifteen',()=>drag(page,cdp,'fixed',15));
   }
   assert.equal(await page.locator('#guide-next').getAttribute('data-key'),'save','diagnostic reaches committed target');
   await step('save-fixed',()=>tap('#guide-next'));
   result.recordCount=await page.locator('#records .record').count();assert.equal(result.recordCount,1,'diagnostic observes one fixed record');
   result.status='completed';
  }catch(error){result.status='failed';result.failure=error.stack||String(error);}
  finally{
   if(page)result.observation=await page.evaluate(()=>({events:window.__pulleyDiagnostic?.events,markers:window.__pulleyDiagnostic?.markers,final:window.__pulleyDiagnostic?.state(),stored:localStorage.getItem('bhcs.pulleyDesk.v1')})).catch(error=>({captureError:error.message}));
   if(context)await context.close().catch(error=>{result.closeError=error.message;});save();
  }
 }
 return report;
}
module.exports={VARIANTS,installTouchDiagnosticProbe,tapOnDragSession,runTouchDiagnosticMatrix};
