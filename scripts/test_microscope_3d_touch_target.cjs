'use strict';
// Synthetic DOM/raycast contracts, NOT browser/phone acceptance. The companion
// Chromium checker retains the exact failing real-touch coordinate and actions.
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {JSDOM}=require('jsdom');
(async()=>{
 const runtime=path.resolve(__dirname,'../tools/microscope-3d');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'microscope-touch-contract-'));
 let dom;
 try{
  // The public directory intentionally has no Node package metadata. Use a
  // disposable ESM copy, never edit the public runtime for test infrastructure.
  fs.cpSync(runtime,temp,{recursive:true});fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
  dom=new JSDOM(fs.readFileSync(path.join(temp,'index.html'),'utf8'),{url:'http://localhost/tools/microscope-3d/'});
  const w=dom.window,d=w.document;global.window=w;global.document=d;global.devicePixelRatio=1;
  global.matchMedia=()=>({matches:true,addEventListener(){}});
  let frames=[];global.requestAnimationFrame=fn=>frames.push(fn);global.ResizeObserver=class{observe(){}};
  w.HTMLCanvasElement.prototype.getContext=function(type){return type==='2d'?new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)}):null;};
  const host=d.getElementById('scene'),rect={left:0,top:189.578125,width:390,height:464.1875,right:390,bottom:653.765625};
  host.getBoundingClientRect=()=>rect;
  let captureWorks=true,captured=new Set();
  host.setPointerCapture=id=>{if(!captureWorks)throw Error('capture unavailable');captured.add(id);};
  host.hasPointerCapture=id=>captured.has(id);host.releasePointerCapture=id=>captured.delete(id);
  await import(pathToFileURL(path.join(temp,'app.js')).href);
  const flush=()=>{while(frames.length)frames.splice(0).forEach(fn=>fn());};flush();
  const diag=()=>w.labDiagnostics(),turret=d.querySelector('[data-action="turret"]'),label=turret.querySelector('.control-label');
  turret.getBoundingClientRect=()=>({left:334,top:345.578125,right:382,bottom:393.578125,width:48,height:48});
  const point={x:330.9533386230469,y:397.4281311035156};
  let actual;
  d.elementFromPoint=()=>actual;
  function event(target,type,p=point,{id=11,primary=true,kind='touch',detail=0}={}){
   const e=new w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:p.x,clientY:p.y,detail});
   Object.defineProperties(e,{pointerId:{value:id},pointerType:{value:kind},isPrimary:{value:primary}});target.dispatchEvent(e);return e;
  }
  function reset(){event(host,'pointercancel');d.getElementById('reset').click();const coarse=d.getElementById('coarse');coarse.value=0;coarse.dispatchEvent(new w.Event('input',{bubbles:true}));flush();actual=host.querySelector('[data-body-hit="slide"]');captureWorks=true;}
  let passed=0;
  function test(name,fn){reset();fn();flush();passed++;console.log('PASS '+name);}
  function drag(){const e=event(label,'pointerdown');assert.ok(e.defaultPrevented);assert.equal(diag().visual.activeAction,'slide');event(host,'pointermove',{x:point.x+20,y:point.y});event(host,'pointerup',{x:point.x+20,y:point.y});assert.ok(Math.abs(diag().state.stageX-32.30769230769231)<1e-7);assert.equal(diag().state.stageY,0);}
  test('exact CI touch-retarget coordinates resolve physical slide, not turret',()=>{drag();assert.equal(diag().state.objective,4);assert.equal(captured.size,0);});
  test('no capture: displaced turret compatibility click is suppressed once',()=>{captureWorks=false;drag();const click=event(label,'click',{x:point.x+20,y:point.y},{detail:1});assert.ok(click.defaultPrevented);assert.equal(diag().state.objective,4);});
  test('inclusive real button edge remains a one-step native tap',()=>{const p={x:334,y:393.578125};assert.equal(event(label,'pointerdown',p).defaultPrevented,false);event(label,'pointerup',p);event(label,'click',p,{detail:1});assert.equal(diag().state.objective,10);assert.equal(diag().state.stageX,0);});
  test('keyboard click is never swallowed after redirected touch',()=>{drag();event(label,'click',point,{detail:0});assert.equal(diag().state.objective,10);});
  test('next primary pointerdown clears suppression for same control',()=>{drag();const p={x:358,y:370};event(label,'pointerdown',p);event(label,'pointerup',p);event(label,'click',p,{detail:1});assert.equal(diag().state.objective,10);});
  test('unrelated control click is not suppressed',()=>{drag();const disc=d.querySelector('[data-action="diaphragm"]');event(disc,'click',point,{detail:1});assert.equal(diag().state.apertureIndex,1);});
  test('secondary pointer cannot move or clear pending cancellation guard',()=>{event(label,'pointerdown');event(label,'pointerdown',point,{id:12,primary:false});event(host,'pointermove',{x:point.x+40,y:point.y},{id:12,primary:false});assert.equal(diag().state.stageX,0);event(host,'pointercancel');event(host,'pointermove',{x:point.x+80,y:point.y});assert.equal(diag().state.stageX,0);event(label,'click',point,{detail:1});assert.equal(diag().state.objective,4);});
  test('body proxy never bypasses physical raycast occlusion/no-hit',()=>{const blank={x:2,y:rect.top+2};event(label,'pointerdown',blank);event(host,'pointermove',{x:22,y:blank.y});event(host,'pointerup',{x:22,y:blank.y});assert.equal(diag().state.stageX,0);event(label,'click',blank,{detail:1});assert.equal(diag().state.objective,4);});
  test('blank scene remains unconsumed for native scrolling',()=>{actual=host;const e=event(host,'pointerdown',{x:2,y:rect.top+2});assert.equal(e.defaultPrevented,false);event(host,'pointermove',{x:2,y:rect.top+100});event(host,'pointerup');assert.equal(diag().state.stageX,0);});
  test('near-button blank retarget keeps existing native button behavior',()=>{actual=host;event(label,'pointerdown');event(label,'pointerup');event(label,'click',point,{detail:1});assert.equal(diag().state.objective,10);});
  test('mouse explicit target behavior remains unchanged',()=>{event(label,'pointerdown',point,{kind:'mouse'});event(label,'pointerup',point,{kind:'mouse'});event(label,'click',point,{kind:'mouse',detail:1});assert.equal(diag().state.objective,10);});
  reset();drag();await new Promise(resolve=>setTimeout(resolve,800));event(label,'click',point,{detail:1});assert.equal(diag().state.objective,10);passed++;console.log('PASS expired compatibility guard does not swallow later click');
  console.log(`PASS ${passed} synthetic touch-target contracts; real browser CI is required separately`);
 }finally{if(dom){dom.window.dispatchEvent(new dom.window.Event('pagehide'));dom.window.close();}fs.rmSync(temp,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
