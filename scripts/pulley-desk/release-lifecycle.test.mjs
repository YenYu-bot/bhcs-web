// Scoped touch-release presentation regression. These DOM tests are not device QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {boot} from '../../tools/pulley-desk/app.mjs';
import {KEY} from '../../tools/pulley-desk/storage.mjs';
const html=fs.readFileSync(new URL('../../tools/pulley-desk/index.html',import.meta.url),'utf8');
function fixture(raw=null){
 const dom=new JSDOM(html,{url:'https://fixture.invalid/',pretendToBeVisual:true}),w=dom.window,frames=new Map(),allFrames=[];let next=1,writes=0;
 w.confirm=()=>true;w.matchMedia=()=>({matches:false});
 w.requestAnimationFrame=callback=>{const id=next++;frames.set(id,callback);allFrames.push(callback);return id;};w.cancelAnimationFrame=id=>frames.delete(id);
 const data=new Map(raw===null?[]:[[KEY,raw]]);Object.defineProperty(w,'localStorage',{value:{getItem:key=>data.get(key)??null,setItem(key,value){writes++;data.set(key,value);}}});
 const app=boot(w.document,w),$=id=>w.document.getElementById(id);
 return {w,app,$,data,frames,allFrames,get writes(){return writes;},flush(){const queued=[...frames.values()];frames.clear();for(const callback of queued)callback(1);},close(){app.destroy();w.close();}};
}
function pointer(f,type,y,id=1,pointerType='touch'){
 const event=new f.w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientY:y});Object.defineProperties(event,{pointerId:{value:id},pointerType:{value:pointerType}});
 f.$('rope-handle').dispatchEvent(event);
}
function drag(f,from,to,{cancel=false}={}){pointer(f,'pointerdown',from);pointer(f,'pointermove',to);pointer(f,cancel?'pointercancel':'pointerup',to);}
const saved=f=>f.app.repo.data.records;

test('touch release commits physics synchronously but keeps handle/guide DOM stable through native end dispatch',()=>{
 const f=fixture();try{
  f.app.begin('fixed');pointer(f,'pointerdown',100);pointer(f,'pointermove',200);
  const handle=f.$('rope-handle'),guide=f.$('guide-next'),before={handle:handle.outerHTML,guide:guide.outerHTML,help:f.$('save-help').textContent,title:f.$('task-title').textContent};
  pointer(f,'pointerup',200);
  assert.equal(f.app.run.h,20);assert.equal(f.app.run.phase,'atTarget');assert.equal(f.app.input.transaction,null);assert.deepEqual(f.app.run.events.map(e=>[e.fromCm,e.toCm]),[[0,20]]);
  assert.equal(handle.outerHTML,before.handle,'captured handle must not be disabled/relocated during pointerup');
  assert.equal(guide.outerHTML,before.guide,'guide relayout waits until native release dispatch has finished');
  f.$('rope-handle').dispatchEvent(new f.w.Event('touchend',{bubbles:true}));
  assert.equal(handle.outerHTML,before.handle);assert.equal(guide.outerHTML,before.guide);assert.equal(f.$('save-help').textContent,before.help);assert.equal(f.$('task-title').textContent,before.title);
  assert.equal(f.$('save-record').disabled,true);assert.equal(guide.disabled,true);assert.equal(f.writes,0);assert.equal(saved(f).length,0);assert.equal(f.frames.size,1);
  f.flush();assert.equal(handle.disabled,true);assert.equal(guide.disabled,false);assert.equal(guide.dataset.key,'save');assert.equal(f.$('save-record').disabled,false);assert.match(f.$('guide-progress').textContent,/已提交 20/);
  assert.equal(f.$('rope-handle'),handle);assert.equal(f.$('guide-next'),guide);assert.equal(f.writes,0);
  guide.click();assert.equal(saved(f).length,1);assert.deepEqual([saved(f)[0].forceN,saved(f)[0].heightCm,saved(f)[0].ropeCm,saved(f)[0].inputWorkNcm],[10,20,20,200]);
 }finally{f.close();}
});

test('exact cancelled-target + five + reverse + fifteen flow preserves evidence and needs one explicit save',()=>{
 const f=fixture();try{
  f.app.begin('fixed');drag(f,100,200,{cancel:true});assert.equal(f.app.run.h,0);assert.equal(f.app.run.events.length,0);assert.equal(f.$('save-record').disabled,true);assert.equal(f.writes,0);
  pointer(f,'pointerup',200);f.flush();assert.equal(f.$('height-value').textContent,'0');assert.match(f.$('guide-progress').textContent,/已提交 0/);
  drag(f,100,125);assert.equal(f.app.run.h,5);f.app.step(5);assert.equal(f.app.run.h,5,'pending presentation cannot accept a stale step');f.flush();
  drag(f,125,100);f.flush();assert.equal(f.app.run.h,5);drag(f,125,200);assert.equal(f.app.run.h,20);
  f.$('guide-next').click();f.$('save-record').click();assert.equal(saved(f).length,0);assert.equal(f.writes,0);
  f.flush();assert.equal(f.$('guide-next').dataset.key,'save');f.$('guide-next').click();
  assert.equal(saved(f).length,1);assert.deepEqual(saved(f)[0].operations.map(e=>[e.fromCm,e.toCm]),[[0,5],[5,20]]);assert.equal(f.writes,1);
 }finally{f.close();}
});

test('new run and new drag invalidate stale presentation without rolling back committed physical progress',()=>{
 for(const action of ['new-run','new-drag']){const f=fixture();try{
  f.app.begin('fixed');drag(f,100,125);const stale=f.allFrames.at(-1);assert.equal(f.app.run.h,5);
  if(action==='new-run'){f.app.begin('movable');const run=f.app.run;stale();f.flush();assert.equal(f.app.run,run);assert.equal(run.device,'movable');assert.equal(run.h,0);assert.match(f.$('announcement').textContent,/動滑輪新一輪/);}
  else{pointer(f,'pointerdown',125);assert.equal(f.app.input.transaction.startH,5);stale();f.flush();assert.equal(f.app.run.phase,'interacting');assert.equal(f.$('guide-next').disabled,true);pointer(f,'pointerup',150);f.flush();assert.equal(f.app.run.h,10);assert.deepEqual(f.app.run.events.map(e=>[e.fromCm,e.toCm]),[[0,5],[5,10]]);}
  assert.equal(f.writes,0);
 }finally{f.close();}}
});

test('blur resize pagehide orientation hidden and explicit render settle current truth and invalidate the queued callback',()=>{
 for(const reason of ['blur','resize','pagehide','orientationchange','hidden','render']){const f=fixture();try{
  f.app.begin('fixed');drag(f,100,125);const stale=f.allFrames.at(-1);
  if(reason==='hidden'){Object.defineProperty(f.w.document,'hidden',{value:true});f.w.document.dispatchEvent(new f.w.Event('visibilitychange'));}
  else if(reason==='render')f.app.render();else f.w.dispatchEvent(new f.w.Event(reason));
  assert.equal(f.app.run.h,5,reason);assert.equal(f.$('height-value').textContent,'5',reason);assert.equal(f.$('guide-next').disabled,false,reason);assert.equal(f.frames.size,0,reason);
  const before=f.w.document.body.innerHTML;stale();f.flush();assert.equal(f.w.document.body.innerHTML,before,reason+' stale frame must not write');assert.equal(f.writes,0);
 }finally{f.close();}}
});

test('destroy cancels pending touch presentation and stale callback cannot touch a detached application',()=>{
 const f=fixture();f.app.begin('fixed');drag(f,100,200);const stale=f.allFrames.at(-1),before=f.w.document.body.innerHTML;
 f.app.destroy();assert.equal(f.frames.size,0);stale();assert.equal(f.w.document.body.innerHTML,before);assert.equal(f.app.run.h,20);assert.equal(f.writes,0);f.w.close();
});

test('storage conflict during pending release remains zero-write and guide cannot become enabled before settlement',()=>{
 const f=fixture();try{
  f.app.begin('fixed');drag(f,100,200);const before=f.$('guide-next').outerHTML;
  f.w.dispatchEvent(new f.w.StorageEvent('storage',{key:KEY,newValue:'external-original'}));
  assert.equal(f.$('guide-next').outerHTML,before);assert.equal(f.$('save-record').disabled,true);assert.equal(f.app.repo.status,'blocked');assert.equal(f.writes,0);
  f.flush();assert.equal(f.$('guide-next').dataset.key,'save');f.$('guide-next').click();assert.equal(saved(f).length,1);assert.equal(f.writes,0);assert.equal(f.app.repo.status,'blocked');
 }finally{f.close();}
});

test('corrupt original, movable ratios and mouse/button synchronous behavior are unchanged',()=>{
 const corrupt=' { invalid original\n',f=fixture(corrupt);try{
  f.app.begin('movable');drag(f,300,100);assert.equal(f.app.run.h,20);assert.equal(f.app.run.phase,'atTarget');f.flush();f.$('guide-next').click();
  assert.deepEqual([saved(f)[0].forceN,saved(f)[0].heightCm,saved(f)[0].ropeCm,saved(f)[0].inputWorkNcm],[5,20,40,200]);assert.equal(f.data.get(KEY),corrupt);assert.equal(f.writes,0);
  f.app.begin('fixed');pointer(f,'pointerdown',100,2,'mouse');pointer(f,'pointerup',125,2,'mouse');assert.equal(f.app.run.h,5);assert.equal(f.frames.size,0);assert.equal(f.$('guide-next').disabled,false);
  f.app.step(5);assert.equal(f.app.run.h,10);assert.equal(f.frames.size,0);
 }finally{f.close();}
});

test('a rejected second pointer cannot replace the accepted touch transaction presentation type',()=>{
 const f=fixture();try{
  f.app.begin('fixed');pointer(f,'pointerdown',100,1,'touch');pointer(f,'pointerdown',100,2,'mouse');pointer(f,'pointermove',200,2,'mouse');assert.equal(f.app.run.h,0);
  pointer(f,'pointermove',200,1,'touch');pointer(f,'pointerup',200,1,'touch');assert.equal(f.app.run.h,20);assert.equal(f.$('guide-next').disabled,true);assert.equal(f.frames.size,1);
  f.flush();assert.equal(f.$('guide-next').dataset.key,'save');assert.equal(f.writes,0);
 }finally{f.close();}
});
