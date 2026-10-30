import test from 'node:test';
import assert from 'node:assert/strict';
import {drawBench,geometry} from '../../tools/incline-desk/bench.mjs';

test('compact diagram captions stay below floor, separated from flags and tick line',()=>{
 for(const width of [307,337,359])for(const [ramp,L] of [['short',40],['long',80]])for(const s of [0,L]){
  const svg={setAttribute(){},dataset:{},innerHTML:''};
  const handle={style:{},classList:{toggle(){}}};
  const g=drawBench(svg,handle,ramp,s,{width,height:260});
  const labels=[...svg.innerHTML.matchAll(/<text x="([\d.-]+)" y="([\d.-]+)"[^>]*>([^<]+)<\/text>/g)];
  const start=labels.find(x=>x[3]==='起點'),caption=labels.find(x=>x[3]===`沿坡量測段 ${L} cm`);
  assert.equal(Number(start[2]),240);assert.equal(Number(caption[2]),240);
  assert(Number(caption[1])-Number(start[1])>90,'caption separated from start flag label');
  const {ray:actualRay,...actual}=g,{ray:expectedRay,...expected}=geometry(ramp,s,width,260);
  assert.deepEqual(actual,expected,'label repositioning does not change physical geometry');
  for(const t of [-7,0,L,L+26])assert.deepEqual(actualRay(t),expectedRay(t));
 }
});
