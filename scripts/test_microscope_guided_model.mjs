// B1 gate: guided microscope geometry model (Pilot #3). Pure functions, no DOM.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import * as M from '../assets/microscope-guided/model.js';
import {MICRO_FIELD_PX,MICRO_STAGE_GAIN} from './science/microscope-geometry.mjs';
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};
const near=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-9,`${msg??''} expected ${b}, got ${a}`);
const origin={id:'o',wx:0,wy:0,radius:0};
const at=(stage,objective=4,feature=origin)=>M.specimenToScreen({feature,stage,objective});
const C=M.VIEW_CENTER;

test('constants are the single source and are mutually consistent',()=>{
 assert.equal(M.WORLD_DIAMETER_4X,540);assert.equal(M.FOV_MM_AT_4X,4.5);assert.equal(M.FIELD_NUMBER_MM,18);
 assert.equal(M.STAGE_GAIN,1.6);assert.equal(M.VIEW_RADIUS_PX,270);assert.deepEqual({...M.VIEW_CENTER},{x:300,y:300});
 assert.equal(M.STAGE_MIN,-150);assert.equal(M.STAGE_MAX,150);assert.deepEqual([...M.OBJECTIVES],[4,10,40]);
 assert.equal(M.FIELD_NUMBER_MM/M.BASE_OBJECTIVE,M.FOV_MM_AT_4X);       // FN / 4 = 4.5 mm
 assert.equal(M.WORLD_DIAMETER_4X/2,M.VIEW_RADIUS_PX);                  // 1 wu = 1 px at 4×
 assert.ok(Object.isFrozen(M.OBJECTIVES)&&Object.isFrozen(M.VIEW_CENTER)&&Object.isFrozen(M.TEACHING_FEATURES));
});
test('objective scale z = objective / 4 and invalid objectives throw',()=>{
 assert.deepEqual([4,10,40].map(M.objectiveScale),[1,2.5,10]);
 for(const bad of [0,5,'4',null,NaN])assert.throws(()=>M.objectiveScale(bad),RangeError);
});
test('field of view is 4.5 / 1.8 / 0.45 mm and radius on the slide shrinks with z',()=>{
 [[4,4.5],[10,1.8],[40,0.45]].forEach(([o,mm])=>near(M.fieldDiameterMm(o),mm,`fov ${o}x`));
 [[4,270],[10,108],[40,27]].forEach(([o,r])=>near(M.fieldRadiusWorld(o),r,`radius ${o}x`));
 // 540 wu = 4.5 mm at 4×: the world-unit/mm ratio is the same at every objective
 for(const o of M.OBJECTIVES)near(M.fieldRadiusWorld(o)*2/M.fieldDiameterMm(o),M.WORLD_DIAMETER_4X/M.FOV_MM_AT_4X,`wu per mm ${o}x`);
});
test('coordinate convention: specimen wx right+ and wy up+ appear inverted on screen',()=>{
 const p0=at({x:0,y:0});assert.deepEqual(p0,{x:300,y:300});
 assert.ok(at({x:0,y:0},4,{...origin,wx:50}).x<C.x,'feature on the slide right of centre appears LEFT of centre');
 assert.ok(at({x:0,y:0},4,{...origin,wx:-50}).x>C.x);
 assert.ok(at({x:0,y:0},4,{...origin,wy:50}).y>C.y,'feature UP on the slide appears BELOW centre (screen y is down)');
 assert.ok(at({x:0,y:0},4,{...origin,wy:-50}).y<C.y);
});
test('direction 1: slide RIGHT -> image moves LEFT',()=>{
 const d=M.screenDisplacementForStageDelta({dx:10,dy:0,objective:4});assert.ok(d.x<0);near(d.y,0);
 assert.ok(at({x:10,y:0}).x<at({x:0,y:0}).x);
});
test('direction 2: slide LEFT -> image moves RIGHT',()=>{
 const d=M.screenDisplacementForStageDelta({dx:-10,dy:0,objective:4});assert.ok(d.x>0);near(d.y,0);
 assert.ok(at({x:-10,y:0}).x>at({x:0,y:0}).x);
});
test('direction 3: slide UP -> image moves DOWN',()=>{
 const d=M.screenDisplacementForStageDelta({dx:0,dy:10,objective:4});assert.ok(d.y>0);near(d.x,0);   // screen y down positive
 assert.ok(at({x:0,y:10}).y>at({x:0,y:0}).y);
});
test('direction 4: slide DOWN -> image moves UP',()=>{
 const d=M.screenDisplacementForStageDelta({dx:0,dy:-10,objective:4});assert.ok(d.y<0);near(d.x,0);
 assert.ok(at({x:0,y:-10}).y<at({x:0,y:0}).y);
});
test('displacement equals the difference of specimenToScreen (one formula, two entry points)',()=>{
 for(const o of M.OBJECTIVES)for(const [dx,dy] of [[7,0],[0,-9],[-3,4]]){
  const a=at({x:5,y:5},o),b=at({x:5+dx,y:5+dy},o),d=M.screenDisplacementForStageDelta({dx,dy,objective:o});
  near(b.x-a.x,d.x);near(b.y-a.y,d.y);
 }
});
test('the same stage displacement moves the image 10× as far at 40× as at 4×',()=>{
 const lo=M.screenDisplacementForStageDelta({dx:10,dy:-6,objective:4}),hi=M.screenDisplacementForStageDelta({dx:10,dy:-6,objective:40});
 near(hi.x,10*lo.x);near(hi.y,10*lo.y);
 const mid=M.screenDisplacementForStageDelta({dx:10,dy:0,objective:10});near(mid.x,2.5*lo.x);
});
test('Trial 1 set-up: e on the RIGHT needs slide RIGHT; slide LEFT makes it worse',()=>{
 const e={...origin,wx:-120,wy:0};
 assert.ok(at({x:0,y:0},4,e).x>C.x,'starts right of centre');
 const d0=M.distanceFromCenter({feature:e,stage:{x:0,y:0},objective:4});
 assert.ok(M.distanceFromCenter({feature:e,stage:{x:20,y:0},objective:4})<d0,'slide right helps');
 assert.ok(M.distanceFromCenter({feature:e,stage:{x:-20,y:0},objective:4})>d0,'slide left makes the image go further right');
});
test('Trial 1 set-up: e ABOVE needs slide UP; slide DOWN makes it worse',()=>{
 const e={...origin,wx:0,wy:-120};
 assert.ok(at({x:0,y:0},4,e).y<C.y,'starts above centre');
 const d0=M.distanceFromCenter({feature:e,stage:{x:0,y:0},objective:4});
 assert.ok(M.distanceFromCenter({feature:e,stage:{x:0,y:20},objective:4})<d0,'slide up helps');
 assert.ok(M.distanceFromCenter({feature:e,stage:{x:0,y:-20},objective:4})>d0,'slide down makes the image go further up');
});
test('teaching slide A/B/C sits at -120 / 0 / +120 wu',()=>{
 assert.deepEqual(M.TEACHING_FEATURES.map(f=>[f.id,f.wx,f.wy]),[['A',-120,0],['B',0,0],['C',120,0]]);
});
test('4×: A, B and C are all visible with the slide centred',()=>{
 assert.deepEqual(M.visibleFeatures({features:M.TEACHING_FEATURES,stage:{x:0,y:0},objective:4}).map(f=>f.id),['A','B','C']);
});
test('10×: with B centred A and C are only PARTLY visible (centre 300 px, marker 50 px, field 270 px)',()=>{
 const args={features:M.TEACHING_FEATURES,stage:{x:0,y:0},objective:10};
 assert.deepEqual(M.visibleFeatures(args).map(f=>f.id),['A','B','C']);
 for(const id of ['A','C']){
  const feature=M.TEACHING_FEATURES.find(f=>f.id===id);
  near(M.distanceFromCenter({feature,stage:{x:0,y:0},objective:10}),300,`${id} centre distance`);
  assert.ok(!M.isFeatureFullyInside({feature,stage:{x:0,y:0},objective:10}),`${id} is clipped`);
  near(M.MARKER_RADIUS_WU*M.objectiveScale(10),50);
 }
 assert.ok(M.isFeatureFullyInside({feature:M.TEACHING_FEATURES[1],stage:{x:0,y:0},objective:10}));
});
test('40×: with B centred only B is visible and B is fully inside (not clipped)',()=>{
 const args={features:M.TEACHING_FEATURES,stage:{x:0,y:0},objective:40};
 assert.deepEqual(M.visibleFeatures(args).map(f=>f.id),['B']);
 const B=M.TEACHING_FEATURES.find(f=>f.id==='B');
 // Marker radius 20 wu x z=10 = 200 px < 270 px: it fills most of the field without being cut off.
 assert.ok(M.isFeatureFullyInside({feature:B,stage:{x:0,y:0},objective:40}));
 assert.ok(M.MARKER_RADIUS_WU*M.objectiveScale(40)<M.VIEW_RADIUS_PX);
});
test('visibility A: centre inside the field -> visible',()=>{
 assert.ok(M.isFeatureVisible({feature:{...origin,wx:100,radius:20},stage:{x:0,y:0},objective:4}));
 assert.ok(M.isFeatureVisible({feature:{...origin,wx:269,radius:0},stage:{x:0,y:0},objective:4}));
});
test('visibility B: centre outside but marker edge overlaps the field -> visible',()=>{
 const feature={...origin,wx:285,radius:20};   // centre 285 > 270, edge reaches 265
 assert.ok(M.distanceFromCenter({feature,stage:{x:0,y:0},objective:4})>M.VIEW_RADIUS_PX);
 assert.ok(M.isFeatureVisible({feature,stage:{x:0,y:0},objective:4}));
 assert.ok(!M.isFeatureFullyInside({feature,stage:{x:0,y:0},objective:4}));
});
test('visibility C: centre beyond field radius + scaled marker radius -> not visible (scaled by z, boundary exact)',()=>{
 const f=(wx)=>({...origin,wx,radius:20});
 assert.ok(M.isFeatureVisible({feature:f(289.9),stage:{x:0,y:0},objective:4}));
 assert.ok(!M.isFeatureVisible({feature:f(290.1),stage:{x:0,y:0},objective:4}));
 // 10×: reach = 270 + 20*2.5 = 320 px = 128 wu
 assert.ok(M.isFeatureVisible({feature:f(127.9),stage:{x:0,y:0},objective:10}));
 assert.ok(!M.isFeatureVisible({feature:f(128.1),stage:{x:0,y:0},objective:10}));
 // radius defaults to 0
 assert.ok(!M.isFeatureVisible({feature:{id:'p',wx:270.1,wy:0},stage:{x:0,y:0},objective:4}));
});
test('visibility D: fullyInside is true only when the whole marker lies inside the field',()=>{
 const f=(wx)=>({...origin,wx,radius:20});
 assert.ok(M.isFeatureFullyInside({feature:f(249.9),stage:{x:0,y:0},objective:4}));
 assert.ok(!M.isFeatureFullyInside({feature:f(250.1),stage:{x:0,y:0},objective:4}));
 assert.ok(M.isFeatureFullyInside({feature:{...origin,wx:269,radius:0},stage:{x:0,y:0},objective:4}));
});
test('stage clamp keeps each axis in -150..150 and rejects non-finite input',()=>{
 assert.deepEqual(M.clampStagePosition({x:200,y:-200}),{x:150,y:-150});
 assert.deepEqual(M.clampStagePosition({x:-150,y:150}),{x:-150,y:150});
 assert.deepEqual(M.clampStagePosition({x:12.5,y:-3}),{x:12.5,y:-3});
 assert.throws(()=>M.clampStagePosition({x:NaN,y:0}),RangeError);
});
test('keyboard constants: Arrow 10 % of the field diameter, Shift a quarter of that',()=>{
 near(M.KEY_FRACTION,0.10);near(M.KEY_FRACTION_FINE,0.025);near(M.KEY_FRACTION_FINE*4,M.KEY_FRACTION);
});
test('keyboard step moves the image 10 % of the field diameter (54 px) at every objective',()=>{
 for(const objective of M.OBJECTIVES)for(const direction of ['left','right','up','down']){
  const {dx,dy}=M.stageDeltaForScreenFraction({direction,objective,fraction:M.KEY_FRACTION});
  const s=M.screenDisplacementForStageDelta({dx,dy,objective});
  near(Math.hypot(s.x,s.y),0.10*2*M.VIEW_RADIUS_PX,`${direction} ${objective}x`);
 }
});
test('Shift step is a quarter of the Arrow step',()=>{
 for(const objective of M.OBJECTIVES){
  const a=M.stageDeltaForScreenFraction({direction:'right',objective,fraction:M.KEY_FRACTION}),
   s=M.stageDeltaForScreenFraction({direction:'right',objective,fraction:M.KEY_FRACTION_FINE});
  near(s.dx*4,a.dx);
 }
});
test('Arrow semantics: the SLIDE moves in the key direction, so the image goes the other way',()=>{
 const k=(direction)=>M.stageDeltaForScreenFraction({direction,objective:4,fraction:M.KEY_FRACTION});
 assert.ok(k('right').dx>0&&k('right').dy===0);assert.ok(k('left').dx<0);
 assert.ok(k('up').dy>0&&k('up').dx===0);assert.ok(k('down').dy<0);
 const img=(direction)=>{const d=k(direction);return M.screenDisplacementForStageDelta({...d,objective:4})};
 assert.ok(img('right').x<0);assert.ok(img('left').x>0);assert.ok(img('up').y>0);assert.ok(img('down').y<0);
 assert.throws(()=>M.stageDeltaForScreenFraction({direction:'north',objective:4,fraction:.1}),RangeError);
});
test('keyboard stage step shrinks as magnification grows (same image motion, smaller slide motion)',()=>{
 const s4=M.stageDeltaForScreenFraction({direction:'right',objective:4,fraction:.1}).dx,
  s40=M.stageDeltaForScreenFraction({direction:'right',objective:40,fraction:.1}).dx;
 near(s4,10*s40);
});
test('legacy cross-check (read-only): constants, formula and inversion agree with microscope-lab',()=>{
 assert.equal(M.WORLD_DIAMETER_4X,MICRO_FIELD_PX);assert.equal(M.STAGE_GAIN,MICRO_STAGE_GAIN);
 assert.equal(M.VIEW_RADIUS_PX,MICRO_FIELD_PX/2);
 const html=fs.readFileSync(fileURLToPath(new URL('../tools/microscope-lab.html',import.meta.url)),'utf8');
 const m=html.match(/function featureScreen\(([^)]*)\)\{([^\n]*)\}/);assert.ok(m,'legacy featureScreen found');
 const legacy=new Function('MICRO_STAGE_GAIN',`return function(${m[1]}){${m[2]}}`)(MICRO_STAGE_GAIN);
 for(const o of M.OBJECTIVES)for(const [wx,wy] of [[0,0],[40,-25],[-120,10]])for(const [sx,sy] of [[0,0],[12,-7],[-30,45]]){
  // Legacy specimen y is canvas-down (wyL = -wy). Every screen position must match exactly.
  const L=legacy(wx,-wy,sx,sy,o),N=at({x:sx,y:sy},o,{...origin,wx,wy});
  near(N.x,L.x,`x ${o}x`);near(N.y,L.y,`y ${o}x`);
 }
 for(const [o,mm] of [[4,4.5],[10,1.8],[40,0.45]])near(M.fieldDiameterMm(o),mm);
});
console.log(`${tests} microscope model tests passed`);
