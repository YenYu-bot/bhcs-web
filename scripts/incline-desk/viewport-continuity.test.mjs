import test from 'node:test';import assert from 'node:assert/strict';import {assertViewportContinuity as guard} from './viewport-continuity.cjs';
const base=()=>({scrollY:608,bench:{x:23,y:.234375,width:314,height:260,documentY:608.234375}});
const sample=(b,changes={})=>({label:'pointermove:bubble-after',scrollY:b.scrollY,bench:{...b.bench},...changes});
test('observed native CI compensated layout keeps actual apparatus stable',()=>{
 // Run41025813862/head0251a30: actual360 and390/412 endpoint observations.
 for(const [sy,y,w,afterY,afterScroll]of [[608,.234375,314,-.015625,561],[584,-.265625,344,.484375,536],[584,-.265625,366,.484375,536]]){
  const b={scrollY:sy,bench:{x:23,y,width:w,height:260,documentY:y+sy}},a=sample(b,{scrollY:afterScroll,bench:{...b.bench,y:afterY,documentY:afterY+afterScroll}});
  const result=guard(b,[sample(b),a],[],'movement');assert.equal(result[1].documentDelta,-47.25);
 }
});
test('real47px jump and uncorrected layout fail despite valid raw metrics',()=>{
 const b=base();for(const offset of [47,-47,1.01]){const a=sample(b);a.bench.y+=offset;a.bench.documentY+=offset;assert.throws(()=>guard(b,[a],[],'movement'),/viewport y/);}
});
test('intermediate jump-return cannot hide behind an unchanged final endpoint',()=>{
 const b=base(),bad=sample(b);bad.bench.y+=20;bad.bench.documentY+=20;assert.throws(()=>guard(b,[sample(b),bad,sample(b)],[],'movement'),/viewport y/);
});
test('programmatic scroll is rejected even if apparatus appears compensated',()=>{
 const b=base();assert.throws(()=>guard(b,[sample(b)],[{name:'scrollIntoView'}],'movement'),/no programmatic scroll/);
});
test('horizontal changes, resizes, missing samples and nonfinite metrics fail',()=>{
 const b=base();for(const key of ['x','width','height']){const a=sample(b);a.bench[key]+=2;assert.throws(()=>guard(b,[a],[],'movement'),new RegExp('viewport '+key));}
 assert.throws(()=>guard(b,[],[],'movement'),/samples required/);const a=sample(b);a.bench.y=NaN;assert.throws(()=>guard(b,[a],[],'movement'),/finite y/);
});
test('release uses the same guard and catches a release-only jump',()=>{
 const b=base(),a=sample(b);a.label='pointerup:bubble-after';a.bench.y-=47;a.bench.documentY-=47;assert.throws(()=>guard(b,[sample(b),a],[],'release'),/release: apparatus viewport y/);
});
