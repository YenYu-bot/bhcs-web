// I4 gate (pure part): engine view → drawing parameters (assets/optics-guided/visual.js). No DOM.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createInitialState,deriveView} from '../assets/optics-guided/engine.js';
import {visualParams,clarityMessage,xOf,VIEW_W,UNITS_PER_CM,blurSigmaFor,BLUR_MAX} from '../assets/optics-guided/visual.js';
import {clientXToCm,BENCH_VIEW} from '../assets/optics-guided/input.js';
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};

const uForV=(f,v)=>f*v/(v-f);
const at=(phase,u,s)=>({...createInitialState(),phase,u,s});
const view=(phase,u,s)=>deriveView(at(phase,u,s));
const P=(phase,u,s,o)=>visualParams(view(phase,u,s),o);

test('bench geometry: 88 cm → 750 units; the view and the input layer share one coordinate system',()=>{
 assert.equal(VIEW_W,750);assert.ok(Math.abs(UNITS_PER_CM-750/88)<1e-12);
 assert.deepEqual([xOf(-40),xOf(48)],[0,750]);assert.ok(Math.abs(xOf(0)-40*750/88)<1e-9);
 const rect={left:100,width:750};
 for(const cm of [-35,-30,-15,-5,0,8,15,22.5,30,40])assert.ok(Math.abs(clientXToCm(rect.left+xOf(cm),rect)-cm)<1e-9,String(cm));
 const p=P('trial1-find-screen',30,15);
 assert.equal(p.candle.x,xOf(-30));assert.equal(p.lens.x,xOf(0));assert.equal(p.screen.x,xOf(15));
 assert.equal(P('trial1-find-screen',5,40).candle.x,xOf(-5));
 assert.deepEqual([BENCH_VIEW.minCm,BENCH_VIEW.maxCm],[-40,48]);
 for(const cm of [-35,40])assert.ok(xOf(cm)>40&&xOf(cm)<VIEW_W-40,'the rail ends keep a margin for the object body');
});

test('blur grows continuously with the error and the image never disappears',()=>{
 let prev=-1;
 for(let e=0;e<=30;e+=.25){
  const s=15+e,p=P('trial1-find-screen',30,s);
  assert.ok(p.blurSigma>=prev-1e-9,`monotone at e=${e}`);
  if(prev>=0&&p.blurSigma>0&&prev>0)assert.ok(p.blurSigma-prev<=1.2*.25+1e-9,'no jumps once blurred');
  prev=p.blurSigma;
  assert.ok(p.imageOpacity>=.5&&p.imageOpacity<=1,'opacity never 0');assert.ok(p.contrast>=.3&&p.contrast<=1);assert.ok(p.blurSigma<=BLUR_MAX);
  assert.ok(p.image,'a real image stays drawn (as a blur), it does not vanish');
  if(e<=.75)assert.equal(p.blurSigma,0,'sharp band is crisp');else assert.ok(p.blurSigma>=.8,'any blur level is visibly blurred');
 }
 assert.equal(P('trial1-find-screen',30,15+30).blurSigma,P('trial1-find-screen',30,15+25).blurSigma,'capped');
 const left=[0,1,2,5,9].map(e=>P('trial1-find-screen',30,15-e).blurSigma),right=[0,1,2,5,9].map(e=>P('trial1-find-screen',30,15+e).blurSigma);
 assert.deepEqual(left,right,'symmetric in the error');
 assert.equal(blurSigmaFor(1,0,.75),0);assert.equal(blurSigmaFor(4,null,.75),BLUR_MAX);
});

test('state table: level, image, message',()=>{
 const rows=[
  ['T1 start',['trial1-find-screen',30,20],3,'real',true,'影像還很模糊','○'],
  ['T1 Lv2',['trial1-find-screen',30,16.5],2,'real',true,'已經很接近了','◐'],
  ['T1 sharp',['trial1-complete',30,15],1,'real',true,'影像最清楚','✓'],
  ['T1 far',['trial1-find-screen',30,28],4,'real',true,'散開的光影','◌'],
  ['T2 stale',['trial2-find-screen',15,15],4,'real',true,'散開的光影','◌'],
  ['T2 sharp',['trial2-complete',15,30],1,'real',true,'影像最清楚','✓'],
  ['overflow Lv2',['trial2-find-screen',uForV(10,40.5),40],2,'real',false,'超出這張實驗桌','◐'],
  ['overflow Lv3',['trial2-find-screen',uForV(10,44),40],3,'real',false,'超出這張實驗桌','◐'],
  ['overflow Lv4',['trial2-find-screen',12,40],4,'real',false,'散開的光影','◌'],
  ['infinite',['trial3-move-object',10,30],4,'infinite',false,'幾乎平行','◌'],
  ['virtual',['trial3-search-screen',5,25],4,'virtual',false,'散開的光影','◌'],
 ];
 for(const [name,args,level,type,within,text,icon] of rows){
  const v=view(...args),p=visualParams(v),m=clarityMessage(v);
  assert.equal(p.clarity.level,level,name);assert.equal(p.clarity.imageType,type,name);assert.equal(p.clarity.withinBench,within,name);
  assert.ok(m.text.includes(text),`${name}: ${m.text}`);assert.equal(m.icon,icon,name);assert.deepEqual([p.clarity.text,p.clarity.icon],[m.text,m.icon]);
  assert.equal(!!p.image,type==='real',name+' image only for real images');
  if(p.image){assert.ok(p.image.scaleY<0,'real images are inverted');assert.ok(Math.abs(p.image.scaleX/p.image.scaleY)<1);}
  if(level===1)assert.equal(p.blurSigma,0,name);else assert.ok(p.blurSigma>=.8,name);
  assert.ok(!/NaN|Infinity/.test(JSON.stringify(p)),name+' params are finite');
 }
 for(const lvl of [2,3])assert.ok(clarityMessage(view('trial2-find-screen',uForV(10,lvl===2?40.5:44),40)).text.includes('實像'),'bench wording says real image');
});

test('image size follows the model magnification, not a hard-coded value',()=>{
 const a=P('trial1-find-screen',30,15).image,b=P('trial2-find-screen',15,30).image;
 assert.equal(a.scaleY,-0.5);assert.equal(b.scaleY,-2);assert.equal(+(a.scaleX/.7).toFixed(6),0.5);
 assert.equal(P('trial1-find-screen',20,20).image.scaleY,-1);
});

test('virtual image view: eye, upright enlarged ghost left of the lens, six rays, screen faded',()=>{
 const p=P('trial3-view-through-lens',5,25);
 assert.ok(p.eye&&p.virtual&&p.rays.length===6);assert.equal(p.screenOpacity,.25);
 assert.equal(p.virtual.x,xOf(-10),'virtual image at v = −10 cm');assert.equal(+(p.virtual.h/p.candle.h).toFixed(6),2,'m = +2 (upright, enlarged)');
 assert.ok(p.eye.x>p.screen.x||p.eye.x>=xOf(35));
 assert.ok(p.rays.some(r=>!r.solid),'back-extensions are dashed');
 const normal=P('trial3-search-screen',5,25);assert.equal(normal.eye,null);assert.equal(normal.virtual,null);assert.equal(normal.screenOpacity,1);
});

test('ray layer is off unless asked and follows the image type',()=>{
 assert.equal(P('trial1-complete',30,15).rays,null);
 const real=P('trial1-complete',30,15,{rays:true}).rays;assert.equal(real.length,4);assert.ok(real.every(r=>r.solid));
 const yTip=real[0].y1;assert.ok(Math.abs(real[1].x2-xOf(15))<1e-9,'rays meet at the image distance');
 assert.ok(P('trial3-search-screen',5,25,{rays:true}).rays.some(r=>!r.solid),'virtual: dashed back-extensions');
 const inf=P('trial3-move-object',10,30,{rays:true}).rays;
 const slopes=[inf[1],inf[3]].map(r=>(r.y2-r.y1)/(r.x2-r.x1));assert.ok(Math.abs(slopes[0]-slopes[1])<1e-9,'object at the focus: emerging rays are parallel');
 void yTip;
});

test('responsive sizing: mobile viewBox is taller and objects scale up; hit areas are sized in the renderer',()=>{
 const d=P('trial1-find-screen',30,20,{height:369}),m=P('trial1-find-screen',30,20,{height:670});
 assert.equal(d.k,1);assert.equal(m.k,1.25);assert.ok(m.candle.h>d.candle.h);assert.ok(m.axisY>d.axisY);
 for(const p of [d,m]){assert.ok(p.tableY+30<p.h,'stands and rail fit');assert.ok(p.screen.imgY>=0&&p.screen.imgY+p.screen.h<=p.h);assert.ok(p.lens.imgY>=0);assert.ok(p.face.y>=0)}
 assert.ok(d.hit.screen.h>0&&d.hit.candle.h>0);
});

test('visual.js reads decisions, it does not make them',()=>{
 const src=fs.readFileSync(fileURLToPath(new URL('../assets/optics-guided/visual.js',import.meta.url)),'utf8').replace(/\/\/.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,'');
 assert.ok(!/from '\.\/model\.js'/.test(src),'no model import');
 assert.ok(!/\bu\s*-\s*f\b|\bf\s*\*\s*u\b|1\s*\/\s*f\b|-\s*v\s*\/\s*u|theoreticalV\s*[<>]=?|magnification\s*[<>]/.test(src.replace(/lens\.theoreticalV\)/g,'')),'no formulas or physical comparisons');
 assert.ok(!/imageType\s*(===|!==)\s*'real'\s*&&\s*[a-z.]*u\b/.test(src));
});

console.log(`PASS optics guided visual: ${tests} tests`);
