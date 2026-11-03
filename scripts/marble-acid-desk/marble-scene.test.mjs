import test from 'node:test';
import assert from 'node:assert/strict';
import {renderVessel,renderGraph,graphGeometry} from '../../tools/science/reaction-rate-desk/scene.mjs';
import {calculate,quantity,VMAX_ML} from '../../tools/science/reaction-rate-desk/model.mjs';
const settings=size=>({size});
test('shrinking stones use linear radius, fixed acid and accurate 100mL piston',()=>{
 for(const [size,tau] of [['lump',180],['granule',90],['powder',18]])for(const fraction of [0,.1,.5,.9,1]){
  const t=tau*fraction,q=VMAX_ML*(1-(1-fraction)**3),svg=renderVessel({settings:settings(size),time:t,quantity:q,finished:fraction===1});
  assert.ok(Math.abs(Number(svg.match(/data-radius-fraction="([^"]+)"/)[1])-(1-fraction))<1e-14);
  assert.ok(Math.abs(Number(svg.match(/data-remaining-mass="([^"]+)"/)[1])-.2*(1-fraction)**3)<1e-14);
  assert.ok(Math.abs(Number(svg.match(/data-product-height="([^"]+)"/)[1])-1.5*q)<1e-12);
  assert.ok(Math.abs(Number(svg.match(/data-piston="([^"]+)"/)[1])-(260-1.5*q))<=.00000051);
  assert.match(svg,/data-solvent="fixed" d="M76 151H160/);assert.match(svg,/data-gas-tube="connected"/);
  assert.doesNotMatch(svg,/催化|data-catalyst|模型單位/);assert.match(svg,/100 mL/);assert.match(svg,/氣泡不代表氣體體積/);
 }
});
test('time-deterministic qualitative bubbles freeze and cease at completion, common rate scale',()=>{
 for(const size of ['lump','granule','powder']){
  const s=settings(size),t=calculate(s).time/3,args={settings:s,time:t,quantity:quantity(s,t)};
  assert.equal(renderVessel(args),renderVessel(args));
  assert.match(renderVessel(args),/data-bubble-phase/);
  for(const end of [0,calculate(s).time,calculate(s).time+10])assert.doesNotMatch(renderVessel({settings:s,time:end,quantity:quantity(s,end)}),/data-bubble-phase/);
 }
 const count=size=>(renderVessel({settings:settings(size),time:.01,quantity:quantity(settings(size),.01)}).match(/data-bubble-phase/g)||[]).length;
 assert.ok(count('powder')>count('lump'));
});
test('gas graph keeps fixed domains and analytic nonlinear volume rather than endpoint interpolation',()=>{
 for(const width of [250,320,390,600]){const g=graphGeometry({width});assert.equal(g.x(180),width-20);assert.equal(g.y(100),62);assert.equal(g.y(0),230);assert.equal(g.xMax,180);assert.equal(g.yMax,100);}
 const g=graphGeometry(),svg=renderGraph({a:settings('lump'),time:90});
 const points=svg.match(/data-series="A"[^>]*d="([^"]+)"/)[1].match(/[ML]([\d.]+) ([\d.]+)/g);
 const last=points.at(-1).slice(1).split(' ').map(Number);
 assert.ok(Math.abs(last[0]-g.x(90))<1e-6);assert.ok(Math.abs(last[1]-g.y(VMAX_ML*.875))<1e-6);
 assert.ok(Math.abs(last[1]-g.y(VMAX_ML*.5))>10);
 assert.match(svg,/零至180秒，體積零至100 mL/);
});
test('dense curves never extend past observed fractional endpoint; archives explicit',()=>{
 for(const size of ['lump','granule','powder'])for(const end of [0,.24999999999999997,.25,.25000000000000006,.45,17.999999999999996,18,90,180]){
  const svg=renderGraph({a:settings(size),time:end});
  assert.equal(Number(svg.match(/data-sample-last="([^"]+)"/)[1]),end);
  const g=graphGeometry(),points=[...svg.match(/data-series="A"[^>]*d="([^"]+)"/)[1].matchAll(/[ML]([\d.]+) ([\d.]+)/g)];
  for(const point of points){assert.ok(Number(point[1])<=g.x(end)+.000001);assert.ok(Number(point[2])>=g.y(VMAX_ML)-.000001);}
 }
 assert.match(renderGraph({a:{settings:settings('lump'),observedThrough:180},time:0}),/data-observed-end="0"/);
 assert.match(renderGraph({a:{settings:settings('lump'),observedThrough:180,archived:true},time:0}),/A 已封存/);
 assert.doesNotMatch(renderGraph({a:settings('lump'),time:1,highlightTime:2}),/data-highlight/);
 assert.match(renderGraph({a:settings('lump'),time:2,highlightTime:2}),/data-highlight="A"/);
});
test('scene validates values and keeps mobile labels within its viewBox',()=>{
 for(const q of [-1,NaN,Infinity,VMAX_ML+1])assert.throws(()=>renderVessel({settings:settings('lump'),quantity:q}));
 assert.match(renderVessel({settings:settings('lump'),label:'<evil>'}),/&lt;evil&gt;/);
 for(const size of ['lump','granule','powder'])for(const t of [0,9,18,90,180]){
  const svg=renderVessel({settings:settings(size),time:t,quantity:quantity(settings(size),t)});
  for(const m of svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"([^>]*)>([^<]+)<\/text>/g)){
   const x=+m[1],y=+m[2],f=+(m[3].match(/font-size="([\d.]+)"/)?.[1]||21),w=[...m[4]].reduce((a,c)=>a+f*(c.codePointAt(0)>255?1:.62),0),left=m[3].includes('middle')?x-w/2:m[3].includes('end')?x-w:x;
   assert.ok(f*245/360>=14);assert.ok(left>=0&&left+w<=360,m[4]);assert.ok(y-f>=0&&y+f*.22<=390,m[4]);
  }
 }
});

test('visible bubbles have common rate-dependent density and originate on multiple shrinking stone surfaces',()=>{
 const view=(size,t)=>renderVessel({settings:settings(size),time:t,quantity:quantity(settings(size),t)});
 const count=(size,t)=>(view(size,t).match(/data-bubble-phase/g)||[]).length;
 assert.ok(count('granule',10)>count('lump',10));
 for(const size of ['lump','granule','powder']){
  const tau=calculate(settings(size)).time;
  assert.ok(count(size,tau*.1)>count(size,tau*.85));
  assert.equal(count(size,0),0);assert.equal(count(size,tau),0);
  assert.equal(view(size,tau*.1),view(size,tau*.1));
  const t=tau*.1,radius=.9,svg=view(size,t);
  const stones=size==='lump'?[[117,274,31]]:size==='granule'?Array.from({length:8},(_,i)=>[73+i%4*29,279-Math.floor(i/4)*26,15.5]):Array.from({length:80},(_,i)=>[67+i%16*6.5,282-Math.floor(i/16)*5.4,3.1]);
  const origins=[];
  for(const m of svg.matchAll(/data-stone-index="(\d+)" data-surface-u="([^"]+)" data-origin-x="([^"]+)" data-origin-y="([^"]+)"/g)){
   const [sx,sy,rad]=stones[+m[1]],u=+m[2];
   // Independent linear interpolation of polygon upper-edge endpoints.
   const left=u<=-.25?[-.9,-.75]:[-.25,-1.1],right=u<=-.25?[-.25,-1.1]:[.6,-1];
   const v=left[1]+(u-left[0])/(right[0]-left[0])*(right[1]-left[1]);
   assert.ok(Math.abs(+m[3]-(sx+u*rad*radius))<.000001);
   assert.ok(Math.abs(+m[4]-(sy+v*rad*radius))<.000001);
   origins.push(m[3]+','+m[4]);
  }
  assert.ok(new Set(origins).size>=2,'multiple surface origins even on lump');
  for(const m of svg.matchAll(/<g data-bubble-phase="[\s\S]*?<circle r="([^"]+)"/g))assert.ok(+m[1]>=4.5&&+m[1]<=6.5);
  assert.match(svg,/stroke="#5f918e" stroke-width="1.7"/);
  assert.doesNotMatch(svg,/<animate|<animateTransform/);
 }
});
