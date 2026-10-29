'use strict';
const SAMPLE_INTERVAL_MS=20,SAMPLE_COUNT=5;
// Model a finger stopping at the endpoint BEFORE it lifts. These are five real
// stationary CDP touchMove samples, not a post-release sleep or a click retry.
async function holdTouchEndpoint(cdp,point,{now=()=>performance.now(),wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
 const start=now(),samples=[];
 for(let index=1;index<=SAMPLE_COUNT;index++){
  const due=start+index*SAMPLE_INTERVAL_MS;
  while(now()<due)await wait(Math.max(1,due-now()));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:point.y,id:1}]});
  samples.push({elapsedMs:now()-start,x:point.x,y:point.y,contactId:1});
 }
 return {intendedDurationMs:SAMPLE_INTERVAL_MS*SAMPLE_COUNT,elapsedMs:now()-start,samples};
}
module.exports={SAMPLE_INTERVAL_MS,SAMPLE_COUNT,holdTouchEndpoint};
