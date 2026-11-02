'use strict';
const assert=require('node:assert/strict');
const {assertVisibilityCycle}=require('./browser-regressions.cjs');
const PIN='1.58.2';
// Version-pinned framework adapter, never an application hook. Chromium keeps
// focus capture per CDP session: a new session's false cannot release PW's true.
function owningSession(page,version){
 assert.equal(version,PIN,'background adapter requires exact Playwright version');
 assert.equal(typeof page?._connection?.toImpl,'function','in-process PW mapping required');
 const impl=page._connection.toImpl(page),delegate=impl?.delegate,frame=delegate?._mainFrameSession,client=frame?._client;
 assert.ok(impl&&delegate&&frame&&client,'original main-frame session required');
 assert.equal(delegate._page,impl,'delegate owns mapped server page');
 assert.equal(typeof client.send,'function');assert.ok(typeof client._sessionId==='string'&&client._sessionId.length>0,'original non-root session ID required');
 assert.ok(typeof delegate._targetId==='string'&&delegate._targetId.length>0,'owning target ID required');
 return {client,sessionId:client._sessionId,targetId:delegate._targetId};
}
async function releaseFocusCapture(page,version){const owner=owningSession(page,version);const {targetInfo}=await owner.client.send('Target.getTargetInfo');assert.equal(targetInfo.targetId,owner.targetId,'original session must address owning page');assert.ok(targetInfo.browserContextId,'isolated context required');await owner.client.send('Emulation.setFocusEmulationEnabled',{enabled:false});return {sessionId:owner.sessionId,targetId:owner.targetId,browserContextId:targetInfo.browserContextId};}
function assertSameWindow(main,peer){assert.ok(Number.isInteger(main.windowId)&&main.windowId>0);assert.equal(peer.windowId,main.windowId,'peer must be an actual same-window tab');}
async function createBackgroundPair(page,url,version,watch=()=>{},evidence={}){
 evidence.main=await releaseFocusCapture(page,version);
 const ctx=page.context(),browserCDP=await ctx.browser().newBrowserCDPSession();
 try{
  evidence.mainWindow=await browserCDP.send('Browser.getWindowForTarget',{targetId:evidence.main.targetId});
  const pending=ctx.waitForEvent('page');
  const [created,peer]=await Promise.all([browserCDP.send('Target.createTarget',{url:'about:blank',browserContextId:evidence.main.browserContextId,newWindow:false,background:true}),pending]);watch(peer);await peer.goto(url);
  evidence.peer=await releaseFocusCapture(peer,version);assert.equal(evidence.peer.targetId,created.targetId);assert.equal(evidence.peer.browserContextId,evidence.main.browserContextId);
  evidence.peerWindow=await browserCDP.send('Browser.getWindowForTarget',{targetId:evidence.peer.targetId});assertSameWindow(evidence.mainWindow,evidence.peerWindow);
  await page.bringToFront();await page.waitForFunction(()=>!document.hidden&&document.hasFocus(),null,{polling:50});
  return peer;
 }finally{await browserCDP.detach();}
}
async function visibilityPreflight(page,peer){
 const start=await page.evaluate(()=>window.__motionStorage.lifecycle.length);
 await peer.bringToFront();await page.waitForFunction(start=>document.hidden&&window.__motionStorage.lifecycle.slice(start).some(e=>e.type==='visibilitychange'&&e.trusted&&e.hidden),start,{polling:50});
 await page.bringToFront();await page.waitForFunction(start=>!document.hidden&&document.hasFocus()&&window.__motionStorage.lifecycle.slice(start).some(e=>e.type==='visibilitychange'&&e.trusted&&!e.hidden),start,{polling:50});
 const proof=await page.evaluate(start=>({events:window.__motionStorage.lifecycle.slice(start),hidden:document.hidden,focused:document.hasFocus()}),start);assertVisibilityCycle(proof);return proof;
}
module.exports={PIN,owningSession,releaseFocusCapture,assertSameWindow,createBackgroundPair,visibilityPreflight};
