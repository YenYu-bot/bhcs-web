// Numeric rendering regression; native getScreenCTM alignment is separately checked in browser CI.
import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {geometry,drawBench} from '../../tools/friction-efficiency-desk/bench.mjs';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
test('positive normal is perpendicular to slope and points above it',()=>{
 for(const [w,h]of [[268,300],[308,300],[338,300],[360,300],[600,370]]){
  const g=geometry(0,w,h),a=g.ray(0),n=g.ray(0,5),v={x:n.x-a.x,y:n.y-a.y};
  assert(Math.abs(v.x*.8+v.y*(-.6))<1e-9);assert(v.x<0&&v.y<0);assert(Math.abs(Math.hypot(v.x,v.y)-5*g.k)<1e-9);
 }
});
test('actual drawn SVG ring transform aligns HTML handle at all 505 positions',()=>{
 const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg><button></button>');const svg=dom.window.document.querySelector('svg'),handle=dom.window.document.querySelector('button');
 try{for(const [width,height]of [[268,300],[308,300],[338,300],[360,300],[600,370]])for(let s=0;s<=100;s++){
  drawBench(svg,handle,s%2?'rough':'ideal',s,{width,height,enabled:true});
  const ring=svg.querySelector('g circle[fill="#b9d4ad"]');assert(ring,'visible SVG ring');
  const m=/^translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)$/.exec(ring.parentElement.getAttribute('transform'));assert(m);
  const [tx,ty,degrees]=m.slice(1).map(Number),angle=degrees*Math.PI/180,cx=Number(ring.getAttribute('cx')),cy=Number(ring.getAttribute('cy'));
  // Expected uses emitted SVG local circle and rotation, never geometry.handle/ray.
  const x=tx+cx*Math.cos(angle)-cy*Math.sin(angle),y=ty+cx*Math.sin(angle)+cy*Math.cos(angle);
  assert(Math.abs(parseFloat(handle.style.left)-x)<1e-9);assert(Math.abs(parseFloat(handle.style.top)-y)<1e-9);
 }}finally{dom.window.close();}
});
