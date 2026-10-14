// B2 gate: pointer, touch and keyboard input controller (Pilot #3). jsdom, no browser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import * as M from '../assets/microscope-guided/model.js';
import {reduce,createInitialState,deriveView} from '../assets/microscope-guided/engine.js';
import {createMicroscopeInput} from '../assets/microscope-guided/input.js';
import {OVERVIEW_WU_PER_PX,OVERVIEW_SIZE} from '../assets/microscope-guided/render.js';
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};
const near=(a,b,tol=1e-6,msg='')=>assert.ok(Math.abs(a-b)<=tol,`${msg} expected ${b}, got ${a}`);

const run=(state,...actions)=>actions.flat().reduce((s,a)=>reduce(s,a).state,state);
const set=(x,y)=>({type:'SET_STAGE',x,y}),REC={type:'RECORD'};
const trial1H=()=>run(createInitialState(),{type:'START'},{type:'BEGIN'});
const trial1V=()=>run(trial1H(),set(75,0),REC);
const high=(objective=4)=>run(trial1V(),set(0,75),REC,{type:'ANSWER_COMPARE',compare:'direction',question:'relation',answer:'opposite'},{type:'CONTINUE'},set(0,0),REC,{type:'SET_OBJECTIVE',objective});

// Test rig: an engine-backed store, a surface element, and a controller wired together.
function rig(initial=trial1H(),extra={}){
 const dom=new JSDOM('<div id="s" tabindex="0"></div>'),w=dom.window,surface=w.document.getElementById('s');
 const store={state:initial,actions:[]};
 const captured=[],released=[];
 surface.setPointerCapture=(id)=>captured.push(id);surface.releasePointerCapture=(id)=>released.push(id);
 const rect={left:0,top:0,width:OVERVIEW_SIZE.width,height:OVERVIEW_SIZE.height};
 const ctl=createMicroscopeInput({
  getState:()=>store.state,
  dispatch:(a)=>{store.actions.push(a);store.state=reduce(store.state,a).state},
  getStageRect:()=>rect,
  ...extra,
 });
 ctl.attach(surface);
 const ptr=(type,props)=>{const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:1,button:0,clientX:0,clientY:0},props);surface.dispatchEvent(e);return e};
 const key=(k,props={})=>{const e=new w.KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true,...props});surface.dispatchEvent(e);return e};
 return {w,surface,store,ctl,ptr,key,captured,released,rect};
}
const imageShift=(before,after,objective)=>{
 const f=deriveView(before).features[0];
 const a=M.specimenToScreen({feature:f,stage:before.stage,objective}),b=M.specimenToScreen({feature:f,stage:after.stage,objective});
 return {x:b.x-a.x,y:b.y-a.y};
};

test('attach / detach: events reach the controller only while attached; touch-action is managed',()=>{
 const r=rig();assert.equal(r.surface.style.touchAction,'none');
 r.key('ArrowRight');assert.equal(r.store.actions.length,1);
 r.ctl.detach();assert.equal(r.surface.style.touchAction,'');
 r.key('ArrowRight');r.ptr('pointerdown');r.ptr('pointermove',{clientX:20});assert.equal(r.store.actions.length,1);
 r.ctl.attach(r.surface);r.key('ArrowLeft');assert.equal(r.store.actions.length,2);
});
test('pointerdown starts a drag: captures the pointer and dispatches nothing yet',()=>{
 const r=rig();r.ptr('pointerdown',{clientX:100,clientY:100,pointerId:7});
 assert.deepEqual(r.captured,[7]);assert.equal(r.store.actions.length,0);
});
test('pointer RIGHT -> stage x increases by dx * (q / G) overview units',()=>{
 const r=rig();r.ptr('pointerdown',{clientX:100,clientY:100});r.ptr('pointermove',{clientX:120,clientY:100});
 const a=r.store.actions.at(-1);assert.equal(a.type,'SET_STAGE');
 near(a.x,20*OVERVIEW_WU_PER_PX/M.STAGE_GAIN);near(a.y,0);
});
test('pointer DOWN -> stage y decreases (slide graphic follows the pointer down)',()=>{
 const r=rig(trial1V());r.ptr('pointerdown',{clientX:100,clientY:100});r.ptr('pointermove',{clientX:100,clientY:110});
 const a=r.store.actions.at(-1);near(a.x,0);near(a.y,-10*OVERVIEW_WU_PER_PX/M.STAGE_GAIN);
 r.ptr('pointermove',{clientX:100,clientY:90});near(r.store.actions.at(-1).y,10*OVERVIEW_WU_PER_PX/M.STAGE_GAIN);
});
test('drag is 1:1 with the slide graphic: slide px moved equals pointer px moved',()=>{
 const r=rig();r.ptr('pointerdown',{clientX:50,clientY:50});r.ptr('pointermove',{clientX:80,clientY:35});
 const s=r.store.state.stage;
 near(M.STAGE_GAIN*s.x/OVERVIEW_WU_PER_PX,30);near(-M.STAGE_GAIN*s.y/OVERVIEW_WU_PER_PX,-15);
});
test('client px are scaled by the surface rect (a 170 px wide surface halves the sensitivity)',()=>{
 const r=rig();r.rect.width=170;r.rect.height=110;
 r.ptr('pointerdown',{clientX:0,clientY:0});r.ptr('pointermove',{clientX:10,clientY:0});
 near(r.store.actions.at(-1).x,20*OVERVIEW_WU_PER_PX/M.STAGE_GAIN);
});
test('pointermove measures from the drag start (no accumulated rounding), grab offset is kept',()=>{
 const r=rig();r.ptr('pointerdown',{clientX:100,clientY:100});
 for(let i=1;i<=50;i++)r.ptr('pointermove',{clientX:100+i*0.1,clientY:100});
 near(r.store.actions.at(-1).x,5*OVERVIEW_WU_PER_PX/M.STAGE_GAIN,1e-9);
 r.ptr('pointerup');r.ptr('pointerdown',{clientX:300,clientY:30});r.ptr('pointermove',{clientX:300,clientY:30});
 near(r.store.actions.at(-1).x,r.store.state.stage.x,1e-9,'no jump when a second drag starts mid-surface');
 near(r.store.actions.at(-1).x,5*OVERVIEW_WU_PER_PX/M.STAGE_GAIN,1e-9);
});
test('the controller never clamps: an over-long drag dispatches a raw target, the engine clamps to ±150',()=>{
 const r=rig();r.ptr('pointerdown',{clientX:0,clientY:0});r.ptr('pointermove',{clientX:3000,clientY:-3000});
 const a=r.store.actions.at(-1);assert.ok(a.x>150&&a.y>150);
 assert.deepEqual(r.store.state.stage,{x:150,y:150});
});
test('pointerup and pointercancel end the drag and release capture',()=>{
 for(const end of ['pointerup','pointercancel']){
  const r=rig();r.ptr('pointerdown',{clientX:0,clientY:0,pointerId:3});r.ptr('pointermove',{clientX:10});const n=r.store.actions.length;
  r.ptr(end,{pointerId:3});assert.deepEqual(r.released,[3]);
  r.ptr('pointermove',{clientX:50});assert.equal(r.store.actions.length,n,`${end} stops dispatching`);
 }
});
test('a different pointer and a non-primary button are ignored',()=>{
 const r=rig();r.ptr('pointerdown',{clientX:0,clientY:0,pointerId:1});r.ptr('pointermove',{clientX:10,pointerId:2});assert.equal(r.store.actions.length,0);
 const q=rig();q.ptr('pointerdown',{button:2});q.ptr('pointermove',{clientX:10});assert.equal(q.store.actions.length,0);
});
test('ArrowRight / ArrowLeft move the slide right / left',()=>{
 const r=rig();r.key('ArrowRight');assert.ok(r.store.actions.at(-1).dx>0&&r.store.actions.at(-1).dy===0);
 r.key('ArrowLeft');assert.ok(r.store.actions.at(-1).dx<0);
 assert.equal(r.store.actions.at(-1).type,'MOVE_STAGE');
});
test('ArrowUp / ArrowDown move the slide up / down',()=>{
 const r=rig(trial1V());r.key('ArrowUp');assert.ok(r.store.actions.at(-1).dy>0&&r.store.actions.at(-1).dx===0);
 r.key('ArrowDown');assert.ok(r.store.actions.at(-1).dy<0);
});
test('Arrow semantics: the engine stage follows the slide; Trial 1 e comes closer with the helpful key',()=>{
 const r=rig();const d0=deriveView(r.store.state).target.distance;r.key('ArrowRight');
 assert.ok(deriveView(r.store.state).target.distance<d0);
 const q=rig();q.key('ArrowLeft');assert.ok(deriveView(q.store.state).target.distance>d0);
});
test('Shift gives a quarter-size step',()=>{
 const r=rig();r.key('ArrowRight');r.key('ArrowRight',{shiftKey:true});
 const [a,b]=r.store.actions;near(b.dx*4,a.dx);
});
test('4× Arrow moves the image ≈ 54 px on screen',()=>{
 const r=rig(high(4));const before=r.store.state;r.key('ArrowRight');
 const view=deriveView(before);   // high phase has the A/B/C slide; use B for the measurement
 const f=view.features.find(x=>x.id==='B');
 const a=M.specimenToScreen({feature:f,stage:before.stage,objective:4}),b=M.specimenToScreen({feature:f,stage:r.store.state.stage,objective:4});
 near(Math.hypot(b.x-a.x,b.y-a.y),54,1e-6);assert.ok(b.x<a.x);
});
test('40× Arrow moves the image ≈ 54 px too, with a 10× smaller stage step',()=>{
 // high(40) completes the trial and locks the stage, so 40× is supplied through getObjective on a movable state
 const r4=rig(high(4)),r40=rig(high(4),{getObjective:()=>40});r4.key('ArrowRight');r40.key('ArrowRight');
 const f=M.TEACHING_FEATURES[1];
 const shift=(r,o)=>{const a=M.specimenToScreen({feature:f,stage:{x:0,y:0},objective:o}),b=M.specimenToScreen({feature:f,stage:r.store.state.stage,objective:o});return Math.hypot(b.x-a.x,b.y-a.y)};
 near(shift(r4,4),54,1e-6);near(shift(r40,40),54,1e-6);
 near(r4.store.actions[0].dx,10*r40.store.actions[0].dx);
});
test('getObjective overrides the state objective when supplied',()=>{
 const r=rig(high(4),{getObjective:()=>40});r.key('ArrowRight');
 near(r.store.actions[0].dx,M.stageDeltaForScreenFraction({direction:'right',objective:40,fraction:M.KEY_FRACTION}).dx);
});
test('Home returns to the supplied home stage',()=>{
 const r=rig(trial1H(),{getHomeStage:()=>({x:12,y:-3})});r.key('ArrowRight');r.key('Home');
 assert.deepEqual(r.store.actions.at(-1),{type:'SET_STAGE',x:12,y:-3});assert.deepEqual(r.store.state.stage,{x:12,y:-3});
});
test('Home defaults to the start stage of the current trial, not always (0,0)',()=>{
 const r=rig(run(createInitialState(),{type:'START'},{type:'BEGIN'},set(75,0),REC,set(0,75),REC,{type:'ANSWER_COMPARE',compare:'direction',question:'relation',answer:'opposite'},{type:'CONTINUE'}));
 r.key('ArrowLeft');r.key('Home');assert.deepEqual(r.store.state.stage,{x:100,y:0},'Trial 2 low starts at x=100');
});
test('other keys are ignored and not prevented; modifier shortcuts are left alone',()=>{
 const r=rig();for(const k of ['a','Enter','Tab','PageUp','Escape',' ']){const e=r.key(k);assert.equal(e.defaultPrevented,false,k)}
 const e=r.key('ArrowRight',{ctrlKey:true});assert.equal(e.defaultPrevented,false);
 assert.equal(r.store.actions.length,0);
});
test('handled keys call preventDefault',()=>{
 const r=rig();for(const k of ['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','Home'])assert.equal(r.key(k).defaultPrevented,true,k);
});
test('locked: pointer is ignored',()=>{
 const r=rig(run(trial1H(),set(75,0)));   // trial1-horizontal-complete
 r.ptr('pointerdown',{clientX:0,clientY:0});r.ptr('pointermove',{clientX:50});assert.equal(r.store.actions.length,0);assert.deepEqual(r.captured,[]);
});
test('locked: keyboard, Home and move() dispatch nothing',()=>{
 const r=rig(createInitialState());
 r.key('ArrowRight');r.key('Home');assert.equal(r.ctl.move('left'),false);assert.equal(r.ctl.home(),false);assert.equal(r.store.actions.length,0);
 const gate=rig(trial1H(),{getCanMove:()=>false});gate.key('ArrowRight');assert.equal(gate.store.actions.length,0);
});
test('a drag ends by itself when the phase locks mid-drag (trial completes)',()=>{
 const r=rig();r.ptr('pointerdown',{clientX:0,clientY:0});
 r.ptr('pointermove',{clientX:60*M.STAGE_GAIN/OVERVIEW_WU_PER_PX*1.25});   // x≈75 -> trial complete
 assert.equal(r.store.state.phase,'trial1-horizontal-complete');const n=r.store.actions.length;
 r.ptr('pointermove',{clientX:0});assert.equal(r.store.actions.length,n);assert.equal(r.store.state.stage.x>50,true);
});
test('move() and the keyboard share one helper (identical actions)',()=>{
 const r=rig(high(10));r.key('ArrowDown');r.key('ArrowDown',{shiftKey:true});
 r.ctl.move('down');r.ctl.move('down',true);
 const [a,b,c,d]=r.store.actions;assert.deepEqual(a,c);assert.deepEqual(b,d);
});
test('a real flow: drag then keys complete Trial 1 horizontal with the engine in charge',()=>{
 const r=rig();r.ptr('pointerdown',{clientX:0,clientY:0});r.ptr('pointermove',{clientX:20});r.ptr('pointerup');
 assert.equal(r.store.state.phase,'trial1-horizontal');
 for(let i=0;i<6&&r.store.state.phase==='trial1-horizontal';i++)r.key('ArrowRight');
 assert.equal(r.store.state.phase,'trial1-horizontal-complete');
});
test('static: input.js has no storage, network, analytics, page ids or answer wording',()=>{
 const src=fs.readFileSync(fileURLToPath(new URL('../assets/microscope-guided/input.js',import.meta.url)),'utf8');
 for(const w of ['相反','顛倒','倒立','視野縮小','倍率越高','opposite','correctAnswer','answerKey','localStorage','sessionStorage','indexedDB','fetch(','XMLHttpRequest','sendBeacon','bhcsScienceTrack','getElementById','querySelector'])
  assert.ok(!src.includes(w),`input.js must not contain "${w}"`);
});
console.log(`${tests} microscope input tests passed`);
