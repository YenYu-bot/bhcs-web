// I3 gate (jsdom part): guided optics input layer → engine actions (Spec v1.2 §6.3, §6.5, §6.6).
// Real-browser behaviour (pointer capture, touch-action, page scrolling) is covered by check_optics_guided_input_browser.cjs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {reduce,createInitialState} from '../assets/optics-guided/engine.js';
import {createInputController,keyboardTarget,snapForWidth,snapTo,clientXToCm,positionFromClientX,
  SNAP_DESKTOP,SNAP_MOBILE,BENCH_VIEW,KEY_STEP,DRAG_SLOP_PX} from '../assets/optics-guided/input.js';
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};

const RECT={left:100,width:750};            // 75 cm over 750 px → 10 px per cm; lens (0 cm) at x = 450
const xOfScreen=s=>RECT.left+(s+35)*10,xOfCandle=u=>RECT.left+(-u+35)*10;
const dom=new JSDOM('<body><div id="screen" tabindex="0"></div><div id="candle" tabindex="0"></div><div id="other" tabindex="0"></div></body>');
const {window}=dom;

function reach(...actions){let st=createInitialState();for(const a of actions.flat())st=reduce(st,a).state;return st}
const mS=position=>({type:'MOVE_SCREEN',position}),mC=position=>({type:'MOVE_CANDLE',position}),settle={type:'SETTLE_SCREEN'};
const trial1=()=>reach({type:'START'},{type:'BEGIN'});
const trial2Move=()=>reach({type:'START'},{type:'BEGIN'},mS(15),{type:'RECORD'});
const trial2Find=()=>reach({type:'START'},{type:'BEGIN'},mS(15),{type:'RECORD'},mC(15));
const trial3Move=()=>reach({type:'START'},{type:'BEGIN'},mS(15),{type:'RECORD'},mC(15),mS(30),{type:'RECORD'},
  {type:'ANSWER_COMPARE',question:'position',answer:'farther'},{type:'ANSWER_COMPARE',question:'size',answer:'larger'},{type:'CONTINUE'});

// A rig = engine + controller + two draggables, logging every action the input layer sends.
function rig(initial,{snap=SNAP_DESKTOP}={}){
 let state=initial;const log=[],capture=[];
 const doc=window.document,screen=doc.createElement('div'),candle=doc.createElement('div'),other=doc.createElement('div');
 doc.body.append(screen,candle,other);
 for(const el of [screen,candle]){el.setPointerCapture=id=>capture.push(['set',id]);el.releasePointerCapture=id=>capture.push(['release',id])}
 const ctl=createInputController({getState:()=>state,dispatch:a=>{log.push(a);const r=reduce(state,a);state=r.state;return r},getSnap:()=>snap,getRect:()=>RECT});
 const detach=[ctl.attach(screen,'screen'),ctl.attach(candle,'candle')];
 const ptr=(el,type,clientX,{pointerId=1,pointerType='mouse',button=0}={})=>{
  const e=new window.MouseEvent(type,{bubbles:true,cancelable:true,clientX,button});
  Object.defineProperty(e,'pointerId',{value:pointerId});Object.defineProperty(e,'pointerType',{value:pointerType});
  el.dispatchEvent(e);return e};
 const key=(el,k,{shift=false,alt=false,ctrl=false,meta=false}={})=>{const e=new window.KeyboardEvent('keydown',{key:k,shiftKey:shift,altKey:alt,ctrlKey:ctrl,metaKey:meta,bubbles:true,cancelable:true});el.dispatchEvent(e);return e};
 return {screen,candle,other,log,capture,ptr,key,get state(){return state},ctl,detach:()=>detach.forEach(d=>d()),
  // press on the object, move through `xs`, release at the last one
  drag(el,fromX,xs,{up=true,type='mouse',pointerId=1}={}){ptr(el,'pointerdown',fromX,{pointerType:type,pointerId});for(const x of xs)ptr(el,'pointermove',x,{pointerType:type,pointerId});if(up)ptr(el,'pointerup',xs.at(-1)??fromX,{pointerType:type,pointerId})}};
}
const types=r=>r.log.map(a=>a.type);
const without=(state,...keys)=>{const c=structuredClone(state);for(const k of keys)delete c[k];return c};
const steps=(a,b,n)=>Array.from({length:n},(_,i)=>a+(b-a)*(i+1)/n);

test('snap: desktop 0.5 cm, mobile 1 cm, split at 767 px',()=>{
 assert.deepEqual([snapForWidth(1280),snapForWidth(768),snapForWidth(767),snapForWidth(390)],[0.5,0.5,1,1]);
 assert.deepEqual([SNAP_DESKTOP,SNAP_MOBILE],[0.5,1]);
 assert.equal(snapTo(14.74,0.5),14.5);assert.equal(snapTo(14.76,0.5),15);assert.equal(snapTo(14.4,1),14);assert.equal(snapTo(14.6,1),15);
 assert.equal(snapTo(0.1+0.2,0.5),0.5);assert.ok(Number.isInteger(snapTo(29.9999999,1)));
});

test('geometry: 75 cm view, lens at 0, candle at -u, screen at +s',()=>{
 assert.deepEqual([BENCH_VIEW.minCm,BENCH_VIEW.maxCm],[-35,40]);
 assert.equal(clientXToCm(100,RECT),-35);assert.equal(clientXToCm(450,RECT),0);assert.equal(clientXToCm(850,RECT),40);
 assert.equal(positionFromClientX('screen',xOfScreen(15),RECT),15);assert.equal(positionFromClientX('candle',xOfCandle(30),RECT),30);
 assert.equal(positionFromClientX('candle',xOfCandle(15),RECT),15);
});

test('contract 2: keys — ←/→ 1 cm, Shift 0.5 cm, PageDown/PageUp left/right 5 cm',()=>{
 const k=(kind,key,shift,pos,snap=0.5)=>keyboardTarget(kind,key,shift,pos,snap);
 assert.deepEqual(['ArrowRight','ArrowLeft'].map(x=>k('screen',x,false,20)),[21,19]);
 assert.deepEqual(['ArrowRight','ArrowLeft'].map(x=>k('screen',x,true,20)),[20.5,19.5]);
 assert.deepEqual(['PageUp','PageDown'].map(x=>k('screen',x,false,20)),[25,15]);
 assert.deepEqual(['PageUp','PageDown'].map(x=>k('screen',x,true,20)),[25,15],'Shift does not change the page step');
 // the candle's right is toward the lens: u shrinks
 assert.deepEqual(['PageUp','PageDown','ArrowRight','ArrowLeft'].map(x=>k('candle',x,false,30)),[25,35,29,31]);
 assert.deepEqual(['ArrowRight','ArrowLeft'].map(x=>k('candle',x,true,30)),[29.5,30.5]);
 // mobile: the fine step never goes below the active snap
 assert.deepEqual(['ArrowRight','ArrowLeft'].map(x=>k('screen',x,true,20,1)),[21,19]);
 for(const x of ['Home','End','ArrowUp','ArrowDown','a','Enter',' ','Tab'])assert.equal(k('screen',x,false,20),null,x);
 assert.deepEqual([KEY_STEP.arrow,KEY_STEP.fine,KEY_STEP.page],[1,0.5,5]);
});

test('keyboard: Trial 2 candle 30 → 15 takes three PageUp; the candle never sends SETTLE_SCREEN',()=>{
 const r=rig(trial2Move());
 for(let i=0;i<3;i++){const e=r.key(r.candle,'PageUp');assert.equal(e.defaultPrevented,true)}
 assert.equal(r.state.u,15);assert.equal(r.state.phase,'trial2-find-screen','engine, not input, decides the transition');
 assert.deepEqual(types(r),['MOVE_CANDLE','MOVE_CANDLE','MOVE_CANDLE']);
});

test('contract 4: PageUp/PageDown/arrows are claimed only by the focused draggable',()=>{
 const r=rig(trial1());
 for(const k of ['PageUp','PageDown','ArrowLeft','ArrowRight'])assert.equal(r.key(r.screen,k).defaultPrevented,true,k);
 for(const k of ['PageUp','PageDown','ArrowLeft','ArrowRight'])assert.equal(r.key(r.other,k).defaultPrevented,false,'focus elsewhere keeps normal paging: '+k);
 assert.equal(r.key(r.screen,'Home').defaultPrevented,false);assert.equal(r.key(r.screen,'Tab').defaultPrevented,false);
 const n=r.log.length;
 for(const mod of [{alt:true},{ctrl:true},{meta:true}])assert.equal(r.key(r.screen,'ArrowLeft',mod).defaultPrevented,false,'browser shortcuts stay intact');
 assert.equal(r.log.length,n);
 // even at the limit the key is claimed, so the page does not scroll under a focused draggable
 const edge=rig(reach({type:'START'},{type:'BEGIN'},mS(40)));
 assert.equal(edge.key(edge.screen,'ArrowRight').defaultPrevented,true);
});

test('locked draggables leave keys to the page; the unlocked one still claims them',()=>{
 const r=rig(trial2Move());                                  // screen locked, candle free
 for(const k of ['PageDown','PageUp','ArrowLeft','ArrowRight'])assert.equal(r.key(r.screen,k).defaultPrevented,false,'locked screen: '+k);
 assert.deepEqual(r.log,[],'a locked draggable sends no MOVE_SCREEN');assert.equal(r.state.s,15);
 assert.equal(r.key(r.candle,'PageUp').defaultPrevented,true);assert.deepEqual(types(r),['MOVE_CANDLE']);assert.equal(r.state.u,25);
 const t1=rig(trial1());                                     // candle locked, screen free
 assert.equal(t1.key(t1.candle,'PageDown').defaultPrevented,false);assert.deepEqual(t1.log,[]);assert.equal(t1.key(t1.screen,'PageDown').defaultPrevented,true);
 // locking is read live: once the engine hands over to the next phase the keys switch owners
 for(let i=0;i<2;i++)r.key(r.candle,'PageUp');
 assert.equal(r.state.phase,'trial2-find-screen');
 assert.equal(r.key(r.candle,'PageUp').defaultPrevented,false,'candle locked at 15');assert.equal(r.key(r.screen,'PageUp').defaultPrevented,true,'screen now free');
});

test('contract 9: keyboard sends SETTLE_SCREEN only when the screen really moved',()=>{
 const r=rig(trial1());
 r.key(r.screen,'ArrowLeft');assert.deepEqual(types(r),['MOVE_SCREEN','SETTLE_SCREEN']);assert.equal(r.state.s,19);
 const edge=rig(reach({type:'START'},{type:'BEGIN'},mS(40)));
 edge.key(edge.screen,'ArrowRight');edge.key(edge.screen,'PageUp');
 assert.deepEqual(types(edge),['MOVE_SCREEN','MOVE_SCREEN'],'clamped by the engine: position unchanged → no settle');assert.equal(edge.state.s,40);
 const lo=rig(reach({type:'START'},{type:'BEGIN'},mS(8)));lo.key(lo.screen,'PageDown');assert.ok(!types(lo).includes('SETTLE_SCREEN'));
 const big=rig(trial1());big.key(big.screen,'PageDown');assert.equal(big.state.s,15);assert.deepEqual(types(big),['MOVE_SCREEN','SETTLE_SCREEN']);
});

test('contract 5: pointer capture is taken on down and released on up, cancel and lost capture',()=>{
 for(const [end,label] of [['up','pointerup'],['pointercancel','cancel'],['lostpointercapture','lost']]){
  const r=rig(trial1());
  r.ptr(r.screen,'pointerdown',xOfScreen(20),{pointerId:7});
  r.ptr(r.screen,'pointermove',xOfScreen(18),{pointerId:7});
  r.ptr(r.screen,end==='up'?'pointerup':end,xOfScreen(18),{pointerId:7});
  assert.deepEqual(r.capture[0],['set',7],label);assert.deepEqual(r.capture.at(-1),['release',7],label);
  const n=r.log.length;
  r.ptr(r.screen,'pointermove',xOfScreen(10),{pointerId:7});r.ptr(r.screen,'pointermove',xOfScreen(10),{pointerId:7});
  assert.equal(r.log.length,n,'no dragging state survives '+label);
  assert.equal(r.state.s,18);assert.equal(types(r).at(-1),'SETTLE_SCREEN','cancel and lost capture settle where the object rests');
 }
 const r=rig(trial1());r.ptr(r.screen,'pointerdown',xOfScreen(20),{pointerId:1});
 const before=r.log.length;r.ptr(r.screen,'pointermove',xOfScreen(10),{pointerId:2});r.ptr(r.screen,'pointerup',xOfScreen(10),{pointerId:2});
 assert.equal(r.log.length,before,'another pointer cannot steer or end the drag');
});

test('pointer drag: grab offset (no teleport), drag slop, MOVE… then final MOVE and SETTLE on release',()=>{
 const r=rig(trial1());                                   // screen at 20 → x = 650
 r.ptr(r.screen,'pointerdown',xOfScreen(20)+12);          // grabbed 12 px right of centre
 r.ptr(r.screen,'pointermove',xOfScreen(20)+12+DRAG_SLOP_PX-1);
 assert.deepEqual(types(r),[],'below the slop nothing moves');
 r.ptr(r.screen,'pointermove',xOfScreen(20)+12-30);       // 3 cm to the left
 assert.deepEqual(r.log.at(-1),{type:'MOVE_SCREEN',position:17},'object stays under the finger: 20 − 3 cm');
 r.ptr(r.screen,'pointerup',xOfScreen(20)+12-50);
 assert.deepEqual(r.log.slice(-2),[{type:'MOVE_SCREEN',position:15},{type:'SETTLE_SCREEN'}]);
 assert.equal(r.state.s,15);assert.equal(r.state.phase,'trial1-complete');
 assert.ok(r.log.filter(a=>a.type==='MOVE_SCREEN').every((a,i,arr)=>i===0||a.position!==arr[i-1].position),'no duplicate moves');
 assert.equal(r.log.filter(a=>a.type==='SETTLE_SCREEN').length,1);
});

test('contract 9: a tap, or a drag that ends where it began, never sends SETTLE_SCREEN',()=>{
 const tap=rig(trial1());tap.ptr(tap.screen,'pointerdown',xOfScreen(20));tap.ptr(tap.screen,'pointerup',xOfScreen(20));
 assert.deepEqual(types(tap),[]);assert.equal(tap.state.s,20);
 const wobble=rig(trial1());wobble.ptr(wobble.screen,'pointerdown',xOfScreen(20));wobble.ptr(wobble.screen,'pointermove',xOfScreen(20)+2);wobble.ptr(wobble.screen,'pointerup',xOfScreen(20)+2);
 assert.deepEqual(types(wobble),[],'jitter inside the slop is still a tap');
 const there=rig(trial1());there.drag(there.screen,xOfScreen(20),[xOfScreen(14),xOfScreen(20)]);
 assert.ok(types(there).includes('MOVE_SCREEN'));assert.ok(!types(there).includes('SETTLE_SCREEN'),'net change zero → no observation');
 // off-grid position on mobile: a tap must not snap it onto the grid
 const off=rig(reach({type:'START'},{type:'BEGIN'},mS(14.5)),{snap:1});off.ptr(off.screen,'pointerdown',xOfScreen(14.5));off.ptr(off.screen,'pointerup',xOfScreen(14.5));
 assert.deepEqual(types(off),[]);assert.equal(off.state.s,14.5);
});

test('Trial 3: a tap at the start credits nothing; each released drag credits only where it ends',()=>{
 const base=reach({type:'START'},{type:'BEGIN'},mS(15),{type:'RECORD'},mC(15),mS(30),{type:'RECORD'},
  {type:'ANSWER_COMPARE',question:'position',answer:'farther'},{type:'ANSWER_COMPARE',question:'size',answer:'larger'},{type:'CONTINUE'},mC(5));
 assert.equal(base.phase,'trial3-search-screen');assert.equal(base.s,30);
 const tap=rig(base);tap.ptr(tap.screen,'pointerdown',xOfScreen(30));tap.ptr(tap.screen,'pointerup',xOfScreen(30));
 assert.deepEqual(tap.state.search.zones,[],'tap in place is not an observation');
 const sweep=rig(base);sweep.drag(sweep.screen,xOfScreen(30),steps(xOfScreen(30),xOfScreen(8),30));
 assert.equal(sweep.state.s,8);assert.deepEqual(sweep.state.search.zones,['near'],'30 → 8 across the whole bench is one observation');assert.equal(sweep.state.search.ctaUnlocked,false);
 const s2=rig(base);s2.drag(s2.screen,xOfScreen(30),steps(xOfScreen(30),xOfScreen(25),5));assert.deepEqual(s2.state.search.zones,['middle']);
 s2.drag(s2.screen,xOfScreen(25),steps(xOfScreen(25),xOfScreen(36),8));assert.deepEqual(s2.state.search.zones,['middle','far']);
 s2.drag(s2.screen,xOfScreen(36),steps(xOfScreen(36),xOfScreen(10),8));assert.deepEqual(s2.state.search.zones,['near','middle','far']);assert.equal(s2.state.search.ctaUnlocked,true);
 const kb=rig(base);kb.key(kb.screen,'PageDown');assert.deepEqual(kb.state.search.zones,['middle'],'30 → 25 by PageDown is one observation');
});

test('locked objects do not start a drag and send nothing',()=>{
 const t1=rig(trial1());t1.drag(t1.candle,xOfCandle(30),[xOfCandle(25)]);assert.deepEqual(t1.log,[]);assert.deepEqual(t1.capture,[]);assert.equal(t1.state.u,30);
 const t2=rig(trial2Move());t2.drag(t2.screen,xOfScreen(15),[xOfScreen(25)]);assert.deepEqual(t2.log,[]);assert.equal(t2.state.s,15);
 const t3=rig(trial3Move());t3.drag(t3.screen,xOfScreen(30),[xOfScreen(10)]);assert.deepEqual(t3.log,[]);
});

test('contract 10: the candle only sends MOVE_CANDLE; the engine decides the transition',()=>{
 const r=rig(trial2Move());
 r.drag(r.candle,xOfCandle(30),steps(xOfCandle(30),xOfCandle(15),15));
 assert.equal(r.state.u,15);assert.equal(r.state.phase,'trial2-find-screen');
 assert.ok(r.log.every(a=>a.type==='MOVE_CANDLE'),JSON.stringify(types(r)));assert.ok(!types(r).includes('SETTLE_SCREEN'));
 const clampHigh=rig(trial2Move());clampHigh.drag(clampHigh.candle,xOfCandle(30),steps(xOfCandle(30),xOfCandle(45),10));
 assert.equal(clampHigh.state.u,35,'input snaps, the engine clamps (Trial 2 upper bound)');
 const through=rig(trial2Move());through.drag(through.candle,xOfCandle(30),steps(xOfCandle(30),xOfCandle(5),25));
 assert.deepEqual([through.state.phase,through.state.u],['trial2-find-screen',15],'a fast drag past 15 stops there: the engine transitions mid-drag and locks the candle');
 const t3=rig(trial3Move());t3.drag(t3.candle,xOfCandle(15),steps(xOfCandle(15),xOfCandle(5),20));assert.equal(t3.state.phase,'trial3-search-screen');
});

test('contract 3: input snaps but never clamps — out-of-range pointers reach the engine unclipped',()=>{
 const r=rig(trial1());r.drag(r.screen,xOfScreen(20),[xOfScreen(60)]);
 assert.ok(r.log.some(a=>a.type==='MOVE_SCREEN'&&a.position===60),'raw snapped value is sent');assert.equal(r.state.s,40,'engine clamps');
});

test('contract 1: mobile drag snaps to 1 cm, desktop to 0.5 cm',()=>{
 const m=rig(trial1(),{snap:1});m.drag(m.screen,xOfScreen(20),[xOfScreen(18.3)]);assert.equal(m.state.s,18);
 const d=rig(trial1());d.drag(d.screen,xOfScreen(20),[xOfScreen(18.3)]);assert.equal(d.state.s,18.5);
 const m2=rig(trial1(),{snap:1});m2.drag(m2.screen,xOfScreen(20),[xOfScreen(15.4)]);assert.equal(m2.state.s,15);assert.equal(m2.state.phase,'trial1-complete');
 assert.ok(m2.log.filter(a=>a.type==='MOVE_SCREEN').every(a=>Number.isInteger(a.position)));
});

test('contract 7: pointer, touch and keyboard reach the same engine state',()=>{
 // Trial 1: 20 → 15 (monotone, equal travel) then record
 const pointer=rig(trial1());pointer.drag(pointer.screen,xOfScreen(20),steps(xOfScreen(20),xOfScreen(15),10));
 const touch=rig(trial1());touch.drag(touch.screen,xOfScreen(20),steps(xOfScreen(20),xOfScreen(15),10),{type:'touch',pointerId:9});
 const keys=rig(trial1());for(let i=0;i<5;i++)keys.key(keys.screen,'ArrowLeft');
 const page=rig(trial1());page.key(page.screen,'PageDown');
 for(const r of [pointer,touch,keys,page])assert.deepEqual([r.state.phase,r.state.s],['trial1-complete',15]);
 assert.deepEqual(without(touch.state,'hints'),without(pointer.state,'hints'));
 assert.deepEqual(without(keys.state,'hints'),without(pointer.state,'hints'));
 assert.deepEqual(without(page.state,'hints'),without(pointer.state,'hints'));
 assert.deepEqual(touch.state,pointer.state,'identical gestures: identical state, hints included');
 const rec=r=>reduce(r.state,{type:'RECORD'}).state;
 assert.deepEqual(without(rec(keys),'hints'),without(rec(pointer),'hints'));assert.equal(rec(keys).records[1].observedScreenPosition,15);
 // Trial 3 search: the same three observations by every route
 const base=reach({type:'START'},{type:'BEGIN'},mS(15),{type:'RECORD'},mC(15),mS(30),{type:'RECORD'},
  {type:'ANSWER_COMPARE',question:'position',answer:'farther'},{type:'ANSWER_COMPARE',question:'size',answer:'larger'},{type:'CONTINUE'},mC(5));
 const p3=rig(base);for(const to of [25,10,35])p3.drag(p3.screen,xOfScreen(p3.state.s),steps(xOfScreen(p3.state.s),xOfScreen(to),6));
 const k3=rig(base);for(const keyName of ['PageDown','PageDown','PageDown','PageDown','PageUp','PageUp','PageUp','PageUp','PageUp','PageUp'])k3.key(k3.screen,keyName);
 assert.equal(p3.state.search.ctaUnlocked,true);
 assert.deepEqual(p3.state.search,{zones:['near','middle','far'],ctaUnlocked:true});
 assert.deepEqual(k3.state.search,{zones:['near','middle','far'],ctaUnlocked:true},'keyboard PageDown/PageUp (5 cm) reaches near, middle and far as well');
});

test('contract 8: input never reads optics values and never imports the model',()=>{
 const src=fs.readFileSync(fileURLToPath(new URL('../assets/optics-guided/input.js',import.meta.url)),'utf8').replace(/\/\/.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,'');
 for(const word of ['theoretical','clarity','sharp','magnification','imageType','calculateLensState','calculateClarity','model.js'])assert.ok(!src.includes(word),word);
 assert.ok(/from '\.\/engine\.js'/.test(src),'locks come from the engine');
 assert.ok(!/min\s*:\s*(8|12|5)\b|max\s*:\s*(35|40)\b|clamp|Math\.min\(|Math\.max\(/.test(src.replace(/Math\.max\(base, snap\)/,'')),'input does not restate engine ranges or clamp');
});

test('contract 6: touch policy lives in CSS keyed to data attributes set by attach()',()=>{
 const css=fs.readFileSync(fileURLToPath(new URL('../assets/optics-guided/input.css',import.meta.url)),'utf8');
 assert.match(css,/\[data-optics-bench\]\s*\{[^}]*touch-action:\s*pan-y/);assert.match(css,/\[data-optics-draggable\]\s*\{[^}]*touch-action:\s*none/);
 const r=rig(trial1());assert.equal(r.screen.getAttribute('data-optics-draggable'),'screen');assert.equal(r.candle.getAttribute('data-optics-draggable'),'candle');
 r.detach();assert.equal(r.screen.hasAttribute('data-optics-draggable'),false);
 const n=r.log.length;r.key(r.screen,'ArrowLeft');r.ptr(r.screen,'pointerdown',xOfScreen(20));assert.equal(r.log.length,n,'detached elements are inert');
 assert.throws(()=>createInputController({getState:()=>({}),dispatch(){},getSnap:()=>1,getRect:()=>RECT}).attach(window.document.body,'lens'),RangeError);
});

console.log(`PASS optics guided input (jsdom): ${tests} tests`);
