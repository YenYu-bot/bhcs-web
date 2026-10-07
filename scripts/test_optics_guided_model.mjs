// I1 gate: guided optics physics + clarity model (Spec v1.2 §14.1, §14.2 and invariants).
import assert from 'node:assert/strict';
import {calculateLensState,calculateClarity,clarityTolerance,NUMERIC_EPSILON} from '../assets/optics-guided/model.js';
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};
const close=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-9,`${msg||''} ${a} != ${b}`);
const lens=(f,u)=>calculateLensState({f,u});
const clarity=(f,u,s)=>calculateClarity({lensState:lens(f,u),screenPosition:s});
const uForV=(f,v)=>f*v/(v-f);   // object distance that gives image distance v

test('§14.1 f10 u30 → v15, m-0.5, real inverted smaller',()=>{
 const r=lens(10,30);close(r.theoreticalV,15);close(r.magnification,-.5);close(r.absoluteMagnification,.5);
 assert.deepEqual([r.imageType,r.imageOrientation,r.imageSize,r.projectable,r.projectionWithinBench],['real','inverted','smaller',true,true]);
});
test('§14.1 f10 u20 → v20, m-1, same size',()=>{
 const r=lens(10,20);close(r.theoreticalV,20);close(r.magnification,-1);assert.equal(r.imageSize,'same');assert.equal(r.imageType,'real');
});
test('§14.1 f10 u15 → v30, m-2, larger',()=>{
 const r=lens(10,15);close(r.theoreticalV,30);close(r.magnification,-2);assert.equal(r.imageSize,'larger');assert.equal(r.projectionWithinBench,true);
});
test('§14.1 f10 u10 → infinite, null distance, undefined orientation',()=>{
 const r=lens(10,10);
 assert.deepEqual([r.theoreticalV,r.magnification,r.absoluteMagnification],[null,null,null]);
 assert.deepEqual([r.imageType,r.imageOrientation,r.imageSize,r.projectable,r.projectionWithinBench],['infinite','undefined','undefined',false,false]);
});
test('§14.1 f10 u8 → v-40, m+5, virtual upright',()=>{
 const r=lens(10,8);close(r.theoreticalV,-40);close(r.magnification,5);
 assert.deepEqual([r.imageType,r.imageOrientation,r.imageSize,r.projectable,r.projectionWithinBench],['virtual','upright','larger',false,false]);
});
test('§14.1 f10 u5 → v-10, m+2',()=>{const r=lens(10,5);close(r.theoreticalV,-10);close(r.magnification,2);assert.equal(r.imageType,'virtual')});
test('§14.1 f10 u10.5 → v210, real, outside bench',()=>{
 const r=lens(10,10.5);close(r.theoreticalV,210);
 assert.deepEqual([r.imageType,r.projectable,r.projectionWithinBench],['real',true,false]);
});
test('Trial 2 lower bound f10 u12 → v60 real outside bench',()=>{
 const r=lens(10,12);close(r.theoreticalV,60);assert.deepEqual([r.imageType,r.projectionWithinBench],['real',false]);
});
test('§7.3 tolerance t = clamp(0.06f, 0.75, 1.25)',()=>{
 close(clarityTolerance(10),.75);close(clarityTolerance(15),.9);close(clarityTolerance(30),1.25);close(clarityTolerance(5),.75);
});
test('§14.2 clarity table f10 u30 v15',()=>{
 const levels=[15,15.5,16,18,20,22,30].map(s=>clarity(10,30,s).effectiveClarityLevel);
 assert.deepEqual(levels,[1,1,2,3,3,4,4]);
 assert.deepEqual([15.75,17.25,20.25,20.26,14.25,12.75,9.75].map(s=>clarity(10,30,s).rawClarityLevel),[1,2,3,4,1,2,3],'boundaries 0.75 / 2.25 / 5.25');
 close(clarity(10,30,20).error,5);assert.equal(clarity(10,30,20).rawClarityLevel,3,'Trial 1 start s=20 is Lv3');
 assert.equal(clarity(10,30,22).rawClarityLevel,4,'s=22 is Lv4');
});
test('§14.2 Trial 2 screen left at Trial 1 position is Lv4 for every legal record',()=>{
 for(const s of [14.5,15,15.5])assert.equal(clarity(10,15,s).effectiveClarityLevel,4);
 for(const s of [29.5,30,30.5])assert.equal(clarity(10,15,s).effectiveClarityLevel,1);
});
test('§14.2 bench overflow: raw vs effective at s=40',()=>{
 const rows=[[40.5,.5,1,2],[42,2,2,2],[44,4,3,3],[60,20,4,4],[210,170,4,4]];
 for(const [v,e,raw,eff] of rows){
  const u=uForV(10,v),state=calculateLensState({f:10,u});close(state.theoreticalV,v);assert.equal(state.projectionWithinBench,false);
  const c=calculateClarity({lensState:state,screenPosition:40});close(c.error,e,'v='+v);assert.equal(c.rawClarityLevel,raw,'raw v='+v);assert.equal(c.effectiveClarityLevel,eff,'effective v='+v);
 }
});
test('§14.2 infinite / virtual are always effective Lv4 with null raw/error',()=>{
 for(const u of [10,8,5])for(const s of [8,15,25,40]){const c=clarity(10,u,s);assert.equal(c.effectiveClarityLevel,4);assert.equal(c.rawClarityLevel,null);assert.equal(c.error,null)}
});
test('bench edges are inclusive (v=8 and v=40 are inside)',()=>{
 assert.equal(calculateLensState({f:10,u:uForV(10,40)}).projectionWithinBench,true);
 assert.equal(calculateLensState({f:10,u:uForV(10,20)}).projectionWithinBench,true);
 assert.equal(calculateLensState({f:2,u:uForV(2,8)}).projectionWithinBench,true);
 assert.equal(calculateLensState({f:10,u:uForV(10,40.01)}).projectionWithinBench,false);
});
test('numerical epsilon is separate from clarity tolerance',()=>{
 assert.equal(lens(10.1,10.1+1e-12).imageType,'infinite','float noise around focus is still focus');
 assert.equal(lens(10.1,10.1*(1+1e-12)).theoreticalV,null);
 assert.equal(lens(10,10.01).imageType,'real','a real 0.01 cm gap is not focus');
 assert.ok(NUMERIC_EPSILON<1e-6&&clarityTolerance(10)>.1,'epsilon ≪ t');
 const u=uForV(10,15);assert.equal(clarity(10,u,15.75+1e-12).rawClarityLevel,1,'float noise on the t boundary stays Lv1');
});
test('invariants over the full guided sweep',()=>{
 let n=0;
 for(const f of [5,10,10.1,15,30])for(let u=0.5;u<=60;u+=.5)for(let s=8;s<=40;s+=.5){
  const st=calculateLensState({f,u}),c=calculateClarity({lensState:st,screenPosition:s});n++;
  if(st.imageType!=='real')assert.equal(c.rawClarityLevel,null);
  if(c.effectiveClarityLevel===1){assert.equal(st.imageType,'real');assert.equal(st.projectionWithinBench,true)}
  if(st.projectionWithinBench===false)assert.notEqual(c.effectiveClarityLevel,1);
  assert.equal(c.projectionWithinBench,st.projectionWithinBench);
  assert.equal(st.projectable,st.imageType==='real');
  const json=JSON.stringify({st,c});assert.ok(!/NaN|Infinity/.test(json),`${f},${u},${s}: ${json}`);
  for(const x of [st.theoreticalV,st.magnification,c.error])assert.ok(x===null||Number.isFinite(x));
  if(st.imageType==='real')assert.ok(c.effectiveClarityLevel>=c.rawClarityLevel);
 }
 assert.equal(n,5*120*65);
});
test('invalid input throws instead of returning NaN',()=>{
 for(const bad of [0,-1,NaN,Infinity,'10',null,undefined]){assert.throws(()=>calculateLensState({f:10,u:bad}),RangeError);assert.throws(()=>calculateLensState({f:bad,u:10}),RangeError)}
 assert.throws(()=>calculateClarity({lensState:lens(10,30),screenPosition:NaN}),RangeError);
 assert.throws(()=>calculateClarity({lensState:lens(10,30),screenPosition:Infinity}),RangeError);
 assert.throws(()=>calculateClarity({screenPosition:15}),TypeError);
});
console.log(`PASS optics guided model: ${tests} tests`);
