'use strict';
const assert=require('node:assert/strict');
// Browser scroll offsets are integer CSS pixels while layout is subpixel. The
// tolerance is one CSS pixel, not the observed 47/48px document scroll change.
function assertViewportContinuity(before,samples,scrollCalls,label){
 assert.ok(samples.length>0,label+': observed samples required');
 assert.equal(scrollCalls.length,0,label+': no programmatic scroll during gesture');
 const deltas=[];
 for(const sample of samples){
  assert.ok(sample.bench,label+': apparatus observation exists');
  for(const key of ['x','y','width','height']){
   assert.ok(Number.isFinite(before.bench[key])&&Number.isFinite(sample.bench[key]),label+': finite '+key);
   assert.ok(Math.abs(sample.bench[key]-before.bench[key])<=1,label+': apparatus viewport '+key+' is stable within one CSS pixel');
  }
  const documentDelta=sample.bench.documentY-before.bench.documentY,scrollDelta=sample.scrollY-before.scrollY;
  assert.ok(Number.isFinite(documentDelta)&&Number.isFinite(scrollDelta),label+': finite document/scroll metrics');
  assert.ok(Math.abs(documentDelta-scrollDelta)<=1,label+': document shift is compensated, not an apparatus jump');
  deltas.push({label:sample.label,documentDelta,scrollDelta,viewportDelta:sample.bench.y-before.bench.y});
 }
 return deltas;
}
module.exports={assertViewportContinuity};
