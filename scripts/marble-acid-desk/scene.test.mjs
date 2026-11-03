import test from 'node:test';
import assert from 'node:assert/strict';
import {renderVessel,renderGraph,graphGeometry} from './legacy-fixture/scene.mjs';
import {BASELINE,calculate,quantity} from './legacy-fixture/model.mjs';

test('vessel keeps solvent constant while solid remaining and product height change',()=>{
 const start=renderVessel({settings:BASELINE,quantity:0});
 const half=renderVessel({settings:BASELINE,quantity:2.5});
 const done=renderVessel({settings:BASELINE,quantity:5,finished:true});
 for(const svg of [start,half,done]){assert.match(svg,/data-solvent="fixed" d="M124 151H220L276 273/);assert.match(svg,/非真實量筒/);assert.doesNotMatch(svg,/氣泡|mL|毫升/);}
 assert.match(start,/data-solid-fraction="1"/);assert.match(half,/data-solid-fraction="0.5"/);assert.doesNotMatch(done,/data-solid-fraction/);
 assert.match(half,/data-product-height="85"/);assert.match(done,/已完成/);assert.match(start,/甲剩餘 5/);
});
test('material shapes, catalyst and arbitrary units are visibly distinct',()=>{
 const forms=['lump','granule','powder'].map(size=>renderVessel({settings:{...BASELINE,size,cat:'yes'},quantity:1,label:'B 試驗'}));
 assert.equal(new Set(forms).size,3);
 for(const svg of forms){assert.match(svg,/催化/);assert.match(svg,/模型單位/);assert.match(svg,/甲剩餘 4/);}
 assert.match(forms[0],/塊狀甲/);assert.match(forms[1],/顆粒甲/);assert.match(forms[2],/粉末甲/);
});
test('invalid quantities and geometry fail closed; labels are escaped',()=>{
 for(const value of [-1,NaN,Infinity,6])assert.throws(()=>renderVessel({settings:BASELINE,quantity:value}));
 assert.match(renderVessel({settings:BASELINE,label:'<script>x</script>'}),/&lt;script&gt;/);
 assert.doesNotMatch(renderVessel({settings:BASELINE,label:'<script>x</script>'}),/<script>/);
 for(const width of [0,249,NaN,Infinity])assert.throws(()=>graphGeometry({width}));
 assert.throws(()=>renderGraph({a:BASELINE,time:-1}));
});
test('independent graph geometry matches fixed domains at mobile and desktop sizes',()=>{
 for(const width of [250,280,288,320,360,390,412,600]){
  const g=graphGeometry({width});
  assert.equal(g.x(0),43);assert.equal(g.x(300),width-20);assert.equal(g.y(0),230);assert.equal(g.y(5),62);
  for(let i=0;i<=300;i++){assert.ok(Math.abs(g.x(i)-(43+(width-63)*i/300))<1e-10);}
  for(let i=0;i<=50;i++){assert.ok(Math.abs(g.y(i/10)-(230-33.6*i/10))<1e-10);}
 }
});
test('curves are restricted to acquired current time, including zero and fractional endpoints',()=>{
 for(const time of [0,.049999999999999996,.45,20,33.33333333333333,75,100,300]){
  const svg=renderGraph({a:BASELINE,b:{...BASELINE,size:'powder'},time});
  for(const end of [...svg.matchAll(/data-observed-end="([^"]+)"/g)])assert.ok(Number(end[1])<=time);
  assert.doesNotMatch(svg,/NaN|Infinity/);
 }
 const svg=renderGraph({a:{settings:BASELINE,observedThrough:10},b:{settings:BASELINE,observedThrough:20},time:15});
 assert.match(svg,/data-series="A" data-observed-end="10"/);assert.match(svg,/data-series="B" data-observed-end="15"/);
});
test('exact completion creates plateau, not a rescaled equally-fast curve',()=>{
 const b={...BASELINE,cat:'yes'};
 const svg=renderGraph({a:BASELINE,b,time:100});
 // Fixed graph: x75=107.25, x100=128.66667, y5=62.
 assert.match(svg,/data-series="B"[^>]*d="M43 230 L107.25 62 L128.66667 62"/);
 assert.match(svg,/data-series="A"[^>]*d="M43 230 L128.66667 174"/);
 assert.equal(calculate(b).time,75);
});
test('explicit archival curve is labelled, never automatically reveals future data',()=>{
 const current=renderGraph({a:{settings:BASELINE,observedThrough:300},time:0});
 assert.match(current,/data-observed-end="0"/);assert.doesNotMatch(current,/A 已封存/);
 const archive=renderGraph({a:{settings:BASELINE,observedThrough:300,archived:true},time:0});
 assert.match(archive,/data-observed-end="300"/);assert.match(archive,/A 已封存/);
});
test('free axes are explicit and shared, never auto-fit from a hidden end time',()=>{
 const slow={...BASELINE,conc:.1,temp:5,amount:10};
 const svg=renderGraph({a:BASELINE,b:slow,time:100,mode:'free'});
 assert.match(svg,/時間零至300模型秒，產物零至10/);assert.match(svg,/自由模式/);
 const wide=renderGraph({a:BASELINE,b:slow,time:24000,mode:'free',xMax:24000,yMax:10});
 assert.match(wide,/時間零至24000模型秒/);assert.doesNotMatch(wide,/NaN|Infinity/);
});
test('highlight remains on acquired points, and overflowing free data do not spill beyond axes',()=>{
 const b={...BASELINE,amount:10};
 assert.doesNotMatch(renderGraph({a:BASELINE,time:10,highlightTime:20}),/data-highlight/);
 assert.match(renderGraph({a:BASELINE,time:20,highlightTime:20}),/data-highlight="A"/);
 const clipped=renderGraph({a:b,time:600,mode:'free',yMax:5});
 assert.match(clipped,/data-model-end="300"/);
 for(const n of [...clipped.matchAll(/data-model-end="([^"]+)"/g)])assert.ok(quantity(b,Number(n[1]))<=5);
});
test('all graph text is at least 18 viewBox pixels, supports 250px responsive rendering of default320',()=>{
 const svg=renderGraph({a:BASELINE,b:BASELINE,time:20});
 assert.match(svg,/font-size:18px/);
 for(const m of svg.matchAll(/font-size="([\d.]+)"/g))assert.ok(Number(m[1])*250/320>=14);
 assert.match(svg,/stroke-dasharray/); // Not color-only discrimination.
});

// Native QA measured 245.1429 CSSpx at a 320px viewport. Keep every label above 14px.
test('vessel typography stays readable at measured 320px mobile width',()=>{
 const svg=renderVessel({settings:{...BASELINE,cat:'yes',amount:10,temp:65},quantity:2.5,label:'B 我的試驗'});
 assert.match(svg,/font-size:21px/);
 for(const m of svg.matchAll(/font-size="([\d.]+)"/g))assert.ok(Number(m[1])*245.1429/360>=14);
 assert.doesNotMatch(svg,/<g data-catalyst/);
 assert.match(svg,/本槽有催化劑，不計入產量/);
 assert.match(svg,/模型示意，非真實量筒/);
});

test('compact vessel retains material and remaining evidence, with bounded readable label estimates',()=>{
 for(const size of ['lump','granule','powder'])for(const amount of [1,5,7,10])for(const q of [0,amount/2,amount]){
  const svg=renderVessel({settings:{...BASELINE,size,amount,cat:'yes'},quantity:q,label:'B 我的試驗',finished:q===amount});
  assert.match(svg,/viewBox="0 0 360 390"/);
  assert.match(svg,/>甲剩餘 /);assert.match(svg,/>模型單位 · 色塊僅示意</);
  // Header label is owned by the surrounding tabletop, not duplicated inside SVG.
  assert.doesNotMatch(svg,/>B 我的試驗</);
  for(const m of svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"([^>]*)>([^<]+)<\/text>/g)){
   const x=Number(m[1]),y=Number(m[2]),attrs=m[3],value=m[4],font=Number(attrs.match(/font-size="([\d.]+)"/)?.[1]||21);
   const width=[...value].reduce((sum,c)=>sum+font*(c.codePointAt(0)>255?1:.62),0);
   const left=attrs.includes('text-anchor="middle"')?x-width/2:attrs.includes('text-anchor="end"')?x-width:x;
   assert.ok(left>=0 && left+width<=360,`estimated label within width: ${value}`);
   assert.ok(y-font>=0 && y+font*.22<=390,`estimated label within height: ${value}`);
  }
 }
});

// Area, not particle count: linear dimensions scale by sqrt of the model fraction.
test('concept vessel drives both material areas only from quantity, with fixed liquid and catalyst',()=>{
 for(const amount of [1,5,10])for(const f of [0,.01,.25,.5,.9,1]){
  const q=amount*f, settings={...BASELINE,amount,cat:'yes'};
  const svg=renderVessel({settings,quantity:q,time:1});
  assert.equal(svg,renderVessel({settings,quantity:q,time:1000}));
  assert.match(svg,/data-vessel-base="313"/);
  const product=Number(svg.match(/data-product-fraction="([^"]+)"/)[1]);
  assert.ok(Math.abs(product-f)<1e-15);
  const scale=Number(svg.match(/data-product-fraction="[^"]+" transform="translate\(222 285\) scale\(([^)]+)\)/)[1]);
  assert.ok(Math.abs(scale*scale-f)<1e-15);
  if(f<1){const solid=Number(svg.match(/data-solid-fraction="([^"]+)"/)[1]);assert.ok(Math.abs(solid+product-1)<1e-15);}
  assert.match(svg,/本槽有催化劑，不計入產量、非用量示意/);
  assert.match(svg,/非用量/);
  assert.doesNotMatch(svg,/<animate|<animateTransform|mL|氣泡/);
 }
 const a=renderVessel({settings:{...BASELINE,cat:'yes'},quantity:0}),b=renderVessel({settings:{...BASELINE,cat:'yes'},quantity:5});
 assert.equal(a.includes('本槽有催化劑，不計入產量'),true);assert.equal(b.includes('本槽有催化劑，不計入產量'),true);assert.doesNotMatch(a+b,/<g data-catalyst/);
 assert.equal(a.match(/<path data-solvent="fixed"[^>]*>/)[0],b.match(/<path data-solvent="fixed"[^>]*>/)[0]);
});
