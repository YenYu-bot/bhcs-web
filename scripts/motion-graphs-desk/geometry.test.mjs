import test from 'node:test';
import assert from 'node:assert/strict';
import {TRACK,PLOT,trackPoint,plotPoint,trackPointClient,plotPointClient,pointerToPlot,renderTrack,renderPlot,minimumLabelFont} from '../../tools/motion-graphs-desk/geometry.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const empty=()=>Array(9).fill(null);
test('fixed independent axes and all 63 plot coordinate pairs',()=>{
 assert.deepEqual([PLOT.width,PLOT.height,PLOT.left,PLOT.right,PLOT.top,PLOT.bottom],[700,670,104,640,120,480]);
 for(let t=0;t<9;t++)for(let x=0;x<7;x++){const p=plotPoint(t,x);near(p.x,104+67*t);near(p.y,480-60*x);}
 for(let x=0;x<7;x++){near(trackPoint(x).x,70+(280*x)/3);assert.equal(trackPoint(x).y,166);}
 assert.deepEqual(trackPoint(0),{x:70,y:166});assert.deepEqual(trackPoint(6),{x:630,y:166});assert.equal(TRACK.width,700);
});
test('63 points map independently at mobile/desktop scales and both letterbox directions',()=>{
 for(const r of [{left:0,top:0,width:700,height:670},{left:19.5,top:83.25,width:320,height:320*670/700},{left:-12,top:-100,width:390,height:600},{left:103,top:17,width:1280,height:670},{left:40,top:30,width:350,height:220}]){
  const scale=Math.min(r.width/700,r.height/670),left=r.left+(r.width-700*scale)/2,top=r.top+(r.height-670*scale)/2;
  for(let t=0;t<9;t++)for(let x=0;x<7;x++){
   // Expected values use the fixed independent axis endpoints, not forward helper output.
   const client={x:left+(104+67*t)*scale,y:top+(480-60*x)*scale},actual=plotPointClient(t,x,r);near(actual.x,client.x);near(actual.y,client.y);
   const inverse=pointerToPlot(client.x,client.y,r);assert.equal(inverse.inside,true);near(inverse.t,t);near(inverse.rawPositionM,x);assert.equal(inverse.positionM,x);
  }
 }
});
test('track marker mapping respects aspect ratio and page offsets at every integer',()=>{for(const r of [{left:20,top:100,width:350,height:115},{left:-50,top:8,width:700,height:400},{left:0,top:0,width:1000,height:230}]){const k=Math.min(r.width/700,r.height/280),l=r.left+(r.width-700*k)/2,u=r.top+(r.height-280*k)/2;for(let x=0;x<7;x++){const p=trackPointClient(x,r);near(p.x,l+(70+280*x/3)*k);near(p.y,u+166*k);}}});
test('offset drag does not jump; tie rounds toward larger position; outside never submits',()=>{
 const r={left:13,top:21,width:700,height:670};
 const a=pointerToPlot(13+372+11,21+300-7,r,{x:11,y:-7});assert.equal(a.inside,true);near(a.t,4);assert.equal(a.positionM,3);
 for(let n=0;n<6;n++){const tiedY=21+480-(n+.5)*60;assert.equal(pointerToPlot(117,tiedY,r).positionM,n+1);assert.equal(pointerToPlot(117,tiedY+.01,r).positionM,n);assert.equal(pointerToPlot(117,tiedY-.01,r).positionM,n+1);}
 for(const [x,y]of [[116.99,200],[653.01,200],[200,140.99],[200,501.01]]){const q=pointerToPlot(x,y,r);assert.equal(q.inside,false);assert.equal(q.positionM,null);}
 // Even offset compensation must not submit if the actual pointer is outside.
 assert.equal(pointerToPlot(104,200,r,{x:-20,y:0}).inside,false);
 assert.equal(pointerToPlot(117,200,r,{x:20,y:0}).inside,false);
});
test('empty graph has nine time ticks but no answers, points, handles or connected curve',()=>{
 const svg=renderPlot(empty(),4);assert.match(svg,/viewBox="0 0 700 670"/);assert.match(svg,/<title>/);assert.match(svg,/<desc>/);assert.equal((svg.match(/<circle/g)||[]).length,0);assert.equal((svg.match(/<polyline/g)||[]).length,0);assert.doesNotMatch(svg,/data-time=|correct|ghost|handle/);
 for(let i=0;i<9;i++)assert.match(svg,new RegExp(`>${i}</text>`));
});
test('rendered point centers match independent 63-pair oracle with selected marker only',()=>{
 for(let t=0;t<9;t++)for(let x=0;x<7;x++){const slots=empty();slots[t]={tSeconds:t,positionM:x};const svg=renderPlot(slots,t);const match=/<circle[^>]*cx="([^"]+)" cy="([^"]+)"/.exec(svg);assert.ok(match);near(+match[1],104+67*t);near(+match[2],480-60*x);assert.equal((svg.match(/<circle/g)||[]).length,1);assert.equal((svg.match(/selected-point/g)||[]).length,1);}
});
test('preview is isolated from submitted slots/polyline; no model answers generated',()=>{
 const slots=Array.from({length:9},(_,t)=>({tSeconds:t,positionM:2})),before=JSON.stringify(slots),svg=renderPlot(slots,3,6,true);
 assert.equal(JSON.stringify(slots),before);assert.equal((svg.match(/selected-point/g)||[]).length,1);assert.equal((svg.match(/preview-point/g)||[]).length,1);assert.match(svg,/data-time="3" cx="305" cy="120"/);const line=/<polyline[^>]*points="([^"]+)"/.exec(svg)[1].split(' ');assert.equal(line.length,9);for(const coordinate of line)near(+coordinate.split(',')[1],360);
 assert.match(renderTrack(2.25),/目前位置2.25公尺/);assert.match(renderTrack(2.25),/translate\(280 0\)/);assert.match(renderTrack(2.25),/class="observation-center" cx="0" cy="166"/);
});
test('reject invalid bounds, malformed slots and geometry rather than generating NaN markup',()=>{
 for(const x of [-1,7,NaN,Infinity,'2',null])assert.throws(()=>renderTrack(x));for(const t of [-1,9,NaN])assert.throws(()=>plotPoint(t,2));
 for(const r of [{left:0,top:0,width:0,height:44},{left:0,top:0,width:44,height:-1},{left:0,top:NaN,width:44,height:44}])assert.throws(()=>plotPointClient(0,0,r));
 assert.throws(()=>renderPlot([]));assert.throws(()=>renderPlot(empty(),9));assert.throws(()=>renderPlot(empty(),null,2));assert.throws(()=>renderPlot(empty(),0,2.5));assert.throws(()=>renderPlot(empty(),null,null,true));
 const wrong=empty();wrong[3]={tSeconds:4,positionM:2};assert.throws(()=>renderPlot(wrong));wrong[3]={tSeconds:3,positionM:'<script>'};assert.throws(()=>renderPlot(wrong));assert.throws(()=>pointerToPlot(NaN,3,{left:0,top:0,width:700,height:670}));assert.throws(()=>renderPlot(Array(9)));
});
test('44px external selected hit circle clears SVG edges at documented 260px minimum width',()=>{const rect={left:0,top:0,width:260,height:260*670/700};for(const t of [0,8])for(const x of [0,6]){const center=plotPointClient(t,x,rect);assert.ok(center.x-22>=0);assert.ok(center.x+22<=rect.width);assert.ok(center.y-22>=0);assert.ok(center.y+22<=rect.height);}});
test('responsive presentation keeps every label at least 14 CSS px across mobile and letterboxing',()=>{
 for(const view of [TRACK,PLOT])for(const width of [248,260,288,320,360,390,412,700,1280])for(const ratio of [0.7,1,1.6]){
  const rect={left:13,top:41,width,height:width*view.height/view.width*ratio},scale=Math.min(width/view.width,rect.height/view.height);
  for(const base of [15,17,18,19]){const size=minimumLabelFont(base,rect,view);assert.ok(size>=base);assert.ok(size*scale>=14-1e-12);near(size,Math.max(base,14/scale));}
  near(minimumLabelFont(18,rect,view,20)*scale,Math.max(18*scale,20));
 }
 assert.equal(minimumLabelFont(18,{left:0,top:0,width:1400,height:1340},PLOT),18);
 for(const bad of [0,-1,NaN,Infinity,'14'])assert.throws(()=>minimumLabelFont(bad,{left:0,top:0,width:700,height:670},PLOT));
 assert.throws(()=>minimumLabelFont(18,{left:0,top:0,width:700,height:670},{width:0,height:670}));
 assert.throws(()=>minimumLabelFont(18,{left:0,top:0,width:700,height:670},PLOT,0));
});
test('larger presentation canvases leave physical axes untouched and separate lower captions',()=>{
 assert.deepEqual([TRACK.width,TRACK.height,PLOT.width,PLOT.height],[700,280,700,670]);
 assert.deepEqual(trackPoint(0),{x:70,y:166});assert.deepEqual(trackPoint(6),{x:630,y:166});assert.deepEqual(plotPoint(0,0),{x:104,y:480});assert.deepEqual(plotPoint(8,6),{x:640,y:120});
 const track=renderTrack(1),plot=renderPlot(empty());assert.match(track,/viewBox="0 0 700 280"/);assert.match(track,/y="260"/);assert.match(track,/height="246"/);assert.match(track,/y="42"/);assert.match(plot,/y="576"/);assert.match(plot,/y="640"/);assert.match(plot,/height="646"/);assert.match(plot,/y="44"/);
 // Conservative 1em vertical envelopes for bottom captions at the narrowest
 // supported proportional SVG; browser glyph/overlap inspection is separate QA.
 for(const [view,baseline,base]of [[TRACK,260,15],[PLOT,640,18]]){const rect={left:0,top:0,width:248,height:248*view.height/700},size=minimumLabelFont(base,rect,view);assert.ok(baseline-size>=0);assert.ok(baseline+size*.25<=view.height);}
});
