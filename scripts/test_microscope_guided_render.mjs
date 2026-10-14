// B2 gate: synchronized bench renderer (Pilot #3). jsdom, no browser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import * as M from '../assets/microscope-guided/model.js';
import {reduce,createInitialState,deriveView} from '../assets/microscope-guided/engine.js';
import {createMicroscopeView,OVERVIEW_WU_PER_PX,OVERVIEW_SIZE,OVERVIEW_CENTER,OVERVIEW_MARKER_BOOST} from '../assets/microscope-guided/render.js';
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};
const near=(a,b,tol=1e-2,msg='')=>assert.ok(Math.abs(a-b)<=tol,`${msg} expected ${b}, got ${a}`);

const run=(state,...actions)=>actions.flat().reduce((s,a)=>reduce(s,a).state,state);
const set=(x,y)=>({type:'SET_STAGE',x,y}),REC={type:'RECORD'};
const trial1H=()=>run(createInitialState(),{type:'START'},{type:'BEGIN'});
const trial1V=()=>run(trial1H(),set(75,0),REC);
const high=(objective=4)=>run(trial1V(),set(0,75),REC,{type:'ANSWER_COMPARE',compare:'direction',question:'relation',answer:'opposite'},{type:'CONTINUE'},set(0,0),REC,{type:'SET_OBJECTIVE',objective});
const low=()=>run(trial1V(),set(0,75),REC,{type:'ANSWER_COMPARE',compare:'direction',question:'relation',answer:'opposite'},{type:'CONTINUE'});

function mount(opts={}){
 const dom=new JSDOM('<div id="eye"></div><div id="ov"></div>');
 const doc=dom.window.document;
 const view=createMicroscopeView({eyepieceRoot:doc.getElementById('eye'),overviewRoot:doc.getElementById('ov'),...opts});
 return {dom,doc,view,eyeRoot:doc.getElementById('eye'),ovRoot:doc.getElementById('ov')};
}
const parse=(node)=>{
 const t=node.getAttribute('transform'),m=t.match(/translate\(([-\d.e]+) ([-\d.e]+)\)(?: rotate\(180\))?(?: scale\(([-\d.e]+)\))?/);
 return {x:+m[1],y:+m[2],s:m[3]===undefined?undefined:+m[3],rotated:/rotate\(180\)/.test(t)};
};
const eyeF=(env,id)=>env.view.getEyepiece().querySelector(`[data-role="clipped-layer"] > [data-feature="${id}"]`);
const slideF=(env,id)=>env.ovRoot.querySelector(`[data-role="slide-features"] > [data-feature="${id}"]`);
const slideG=(env)=>env.ovRoot.querySelector('[data-role="slide"]');
const ringOf=(env)=>env.ovRoot.querySelector('[data-role="fov-ring"]');
const draw=(env,state)=>env.view.update(deriveView(state));

test('creates the eyepiece SVG with a 600 x 600 viewBox and role=img',()=>{
 const env=mount(),eye=env.view.getEyepiece();
 assert.equal(eye.tagName,'svg');assert.equal(eye.getAttribute('viewBox'),'0 0 600 600');assert.equal(eye.getAttribute('role'),'img');
 assert.equal(env.eyeRoot.firstElementChild,eye);
 assert.equal(mount({eyepieceLabel:'L'}).view.getEyepiece().getAttribute('aria-label'),'L');
});
test('circular field exists at the model centre and radius',()=>{
 const env=mount(),f=env.view.getEyepiece().querySelector('[data-role="field"]');
 assert.equal(+f.getAttribute('cx'),M.VIEW_CENTER.x);assert.equal(+f.getAttribute('cy'),M.VIEW_CENTER.y);assert.equal(+f.getAttribute('r'),M.VIEW_RADIUS_PX);
});
test('a circular clipPath of the same radius clips the marker layer',()=>{
 const env=mount(),eye=env.view.getEyepiece(),layer=eye.querySelector('[data-role="clipped-layer"]');
 const id=layer.getAttribute('clip-path').match(/url\(#(.+)\)/)[1],clip=eye.querySelector(`clipPath[id="${id}"]`);
 assert.ok(clip);const c=clip.querySelector('circle');assert.equal(+c.getAttribute('r'),M.VIEW_RADIUS_PX);assert.equal(+c.getAttribute('cx'),300);
 const other=mount();assert.notEqual(other.view.getEyepiece().querySelector('clipPath').id,clip.id,'ids are unique per instance');
});
test('4× Trial 1: the e is drawn where the model puts it (right of centre), turned half a revolution',()=>{
 const env=mount(),s=trial1H();draw(env,s);
 const p=parse(eyeF(env,'e')),m=M.specimenToScreen({feature:deriveView(s).features[0],stage:s.stage,objective:4});
 near(p.x,m.x);near(p.y,m.y);assert.ok(p.x>300);assert.ok(p.rotated);
});
test('stage RIGHT moves the eyepiece e LEFT',()=>{
 const env=mount(),s0=trial1H();draw(env,s0);const x0=parse(eyeF(env,'e')).x;
 draw(env,run(s0,{type:'MOVE_STAGE',dx:10,dy:0}));assert.ok(parse(eyeF(env,'e')).x<x0);
});
test('stage UP moves the eyepiece e DOWN',()=>{
 const env=mount(),s0=trial1V();draw(env,s0);const y0=parse(eyeF(env,'e')).y;
 draw(env,run(s0,{type:'MOVE_STAGE',dx:0,dy:10}));assert.ok(parse(eyeF(env,'e')).y>y0);
});
test('marker scale follows the objective (radius x z)',()=>{
 const env=mount();
 for(const o of M.OBJECTIVES){draw(env,high(o));near(parse(eyeF(env,'B')).s,M.MARKER_RADIUS_WU*M.objectiveScale(o),1e-2,`${o}×`)}
});
test('4× A, B and C are all drawn and visible',()=>{
 const env=mount();draw(env,high(4));
 for(const id of ['A','B','C']){assert.equal(eyeF(env,id).getAttribute('data-visible'),'true');assert.notEqual(eyeF(env,id).getAttribute('display'),'none')}
});
test('10× A and C stay in the tree (partly in the field, clipped), they are not removed or hidden',()=>{
 const env=mount();draw(env,high(10));
 for(const id of ['A','C']){
  const node=eyeF(env,id);assert.ok(node,`${id} node exists`);
  assert.equal(node.getAttribute('data-visible'),'true');assert.notEqual(node.getAttribute('display'),'none');
  assert.equal(node.getAttribute('data-fully-inside'),'false');
  assert.ok(node.closest('[clip-path]'),`${id} sits under the circular clip`);
  const p=parse(node);near(Math.hypot(p.x-300,p.y-300),300,1e-2);   // centre outside the 270 px field...
  assert.ok(300-p.s<270);                                           // ...but the 50 px marker overlaps it
 }
});
test('40× only B remains; A and C do not overlap the field and are hidden',()=>{
 const env=mount();draw(env,high(40));
 assert.equal(eyeF(env,'B').getAttribute('data-visible'),'true');
 for(const id of ['A','C']){assert.equal(eyeF(env,id).getAttribute('display'),'none');assert.equal(eyeF(env,id).getAttribute('data-visible'),'false')}
});
test('40× B is fully inside the field',()=>{
 const env=mount();draw(env,high(40));assert.equal(eyeF(env,'B').getAttribute('data-fully-inside'),'true');
 const p=parse(eyeF(env,'B'));assert.ok(Math.hypot(p.x-300,p.y-300)+p.s<=270+1e-6);
});
test('overview: slide moves RIGHT with stage x+ and 1:1 (G / q px per stage unit)',()=>{
 const env=mount(),s0=trial1H();draw(env,s0);const a=parse(slideG(env));
 near(a.x,OVERVIEW_CENTER.x);near(a.y,OVERVIEW_CENTER.y);
 draw(env,run(s0,{type:'MOVE_STAGE',dx:30,dy:0}));const b=parse(slideG(env));
 assert.ok(b.x>a.x);near(b.x-a.x,M.STAGE_GAIN*30/OVERVIEW_WU_PER_PX);near(b.y,a.y);
});
test('overview: slide moves UP with stage y+ (SVG y decreases)',()=>{
 const env=mount(),s0=trial1V();draw(env,s0);const a=parse(slideG(env));
 draw(env,run(s0,{type:'MOVE_STAGE',dx:0,dy:30}));const b=parse(slideG(env));
 assert.ok(b.y<a.y);near(a.y-b.y,M.STAGE_GAIN*30/OVERVIEW_WU_PER_PX);near(b.x,a.x);
});
test('overview: markers are fixed in slide coordinates and travel with the slide',()=>{
 const env=mount(),s0=high(4);draw(env,s0);
 const local=['A','B','C'].map(id=>parse(slideF(env,id)));
 draw(env,run(s0,{type:'MOVE_STAGE',dx:40,dy:-20}));
 ['A','B','C'].forEach((id,i)=>{const p=parse(slideF(env,id));near(p.x,local[i].x);near(p.y,local[i].y);assert.equal(slideF(env,id).parentNode.parentNode,slideG(env))});
 near(local[0].x,-120/OVERVIEW_WU_PER_PX);near(local[2].x,120/OVERVIEW_WU_PER_PX);
 // A marker's overview position stays exactly on the line to the axis that the eyepiece geometry predicts
 const g=parse(slideG(env));near(g.x+local[1].x,OVERVIEW_CENTER.x+M.STAGE_GAIN*40/OVERVIEW_WU_PER_PX);
});
test('overview markers are drawn larger than true size (a map, not a to-scale picture) but sit at their exact positions',()=>{
 const env=mount();draw(env,high(4));
 assert.equal(OVERVIEW_MARKER_BOOST,2);
 const b=parse(slideF(env,'B')),a=parse(slideF(env,'A'));
 near(b.s,M.MARKER_RADIUS_WU*OVERVIEW_MARKER_BOOST/OVERVIEW_WU_PER_PX);near(a.x,-120/OVERVIEW_WU_PER_PX);
});
test('overview FOV ring radii are 75 / 30 / 7.5 px',()=>{
 const env=mount();
 [[4,75],[10,30],[40,7.5]].forEach(([o,r])=>{draw(env,high(o));near(+ringOf(env).getAttribute('r'),r,1e-6,`${o}×`)});
 near(M.fieldRadiusWorld(4)/OVERVIEW_WU_PER_PX,75);
});
test('the optical axis and ring stay fixed while the stage moves',()=>{
 const env=mount(),s0=high(4);draw(env,s0);const ring=ringOf(env);
 const before=[ring.getAttribute('cx'),ring.getAttribute('cy')];
 draw(env,run(s0,{type:'MOVE_STAGE',dx:60,dy:60}));
 assert.deepEqual([ring.getAttribute('cx'),ring.getAttribute('cy')],before);
 assert.equal(+before[0],OVERVIEW_CENTER.x);assert.equal(+before[1],OVERVIEW_CENTER.y);
 assert.equal(ring.closest('[data-role="slide"]'),null,'the ring is not inside the moving slide');
});
test('update reuses the SVG roots and marker nodes; a new trial swaps only the markers',()=>{
 const env=mount(),eye=env.view.getEyepiece(),ov=env.view.getStageSurface();
 draw(env,trial1H());const e=eyeF(env,'e');draw(env,run(trial1H(),{type:'MOVE_STAGE',dx:5,dy:0}));
 assert.equal(eyeF(env,'e'),e);assert.equal(env.view.getEyepiece(),eye);assert.equal(env.eyeRoot.firstElementChild,eye);assert.equal(env.view.getStageSurface(),ov);
 draw(env,high(4));assert.equal(eyeF(env,'e'),null);assert.ok(eyeF(env,'A'));assert.equal(slideF(env,'e'),null);
 const b=eyeF(env,'B');draw(env,high(10));assert.equal(eyeF(env,'B'),b);
});
test('stage surface hooks: role=group, tabindex=0, locked state mirrored',()=>{
 const env=mount({stageLabel:'S'}),surface=env.view.getStageSurface();
 assert.equal(surface.getAttribute('role'),'group');assert.equal(surface.getAttribute('tabindex'),'0');assert.equal(surface.getAttribute('aria-label'),'S');
 assert.equal(env.ovRoot.firstElementChild,surface);
 draw(env,trial1H());assert.equal(surface.getAttribute('data-locked'),'false');assert.equal(surface.getAttribute('aria-disabled'),'false');
 draw(env,run(trial1H(),set(75,0)));assert.equal(surface.getAttribute('data-locked'),'true');assert.equal(surface.getAttribute('aria-disabled'),'true');
});
test('renderer creates no live region',()=>{
 const env=mount();draw(env,high(10));
 assert.equal(env.doc.querySelectorAll('[aria-live],[role="status"],[role="alert"]').length,0);
});
test('overview frame constants',()=>{
 assert.equal(OVERVIEW_WU_PER_PX,3.6);assert.deepEqual({...OVERVIEW_SIZE},{width:340,height:220});
 assert.equal(mount().view.getStageSurface().getAttribute('viewBox'),'0 0 340 220');
});
test('destroy removes the nodes',()=>{
 const env=mount();draw(env,high(4));env.view.destroy();assert.equal(env.eyeRoot.children.length,0);assert.equal(env.ovRoot.children.length,0);
});
test('static: render.js contains no lesson wording, answer key, storage, network or analytics',()=>{
 const src=fs.readFileSync(fileURLToPath(new URL('../assets/microscope-guided/render.js',import.meta.url)),'utf8');
 for(const w of ['相反','顛倒','倒立','視野縮小','倍率越高','opposite','correctAnswer','answerKey','localStorage','sessionStorage','fetch(','XMLHttpRequest','bhcsScienceTrack','innerHTML','aria-live'])
  assert.ok(!src.includes(w),`render.js must not contain "${w}"`);
 assert.ok(!/\bx\s*=\s*[^=].*\bz\b.*wx/.test(src),'no re-derived screen formula');
});
console.log(`${tests} microscope render tests passed`);
