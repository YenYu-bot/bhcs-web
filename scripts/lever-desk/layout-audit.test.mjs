import assert from 'node:assert/strict';
import {layoutRacks,hookPosition,intersects} from '../../tools/lever-desk/layout.mjs';
import {calculate} from '../../tools/lever-desk/model.mjs';
const ids=['w1','w2','w3','w4','w5','w6'];let count=0,seed=9041;
const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function check(l,w,a){const before=JSON.stringify(l),physics=calculate(l),g=layoutRacks(l,w,a);assert.equal(JSON.stringify(l),before);assert.deepEqual(calculate(l),physics);assert.equal(g.controls.length,Object.values(l).filter(x=>x!==null).length);for(const c of g.controls){assert.equal(c.width,44);assert.equal(c.height,44);assert.ok(c.left>=-1e-8&&c.right<=w+1e-8);assert.ok(c.top>=0&&c.bottom<g.height);assert.equal(c.x,hookPosition(l[c.id],w,a).x)}for(let i=0;i<g.racks.length;i++){const r=g.racks[i];assert.equal(r.anchor.x,r.controls[0].x);assert.ok(r.controls[0].top>=r.anchor.y+22);for(let j=i+1;j<g.racks.length;j++)assert.equal(intersects(r.bounds,g.racks[j].bounds),false);}for(let i=0;i<g.controls.length;i++)for(let j=i+1;j<g.controls.length;j++)assert.equal(intersects(g.controls[i],g.controls[j]),false);count++}
for(const w of [330,360,770,1000])for(const a of [-8,0,8]){
 for(let start=-50;start<=25;start+=5)check(Object.fromEntries(ids.map((id,i)=>[id,start+i*5])),w,a);
 for(let stack=-50;stack<=50;stack+=5)check({w1:stack,w2:stack,w3:stack,w4:stack,w5:stack===50?-50:50,w6:stack===-50?50:-50},w,a);
 for(let n=0;n<2000;n++){const used={};const l=Object.fromEntries(ids.map(id=>{let x;do{x=rand()<.1?null:(Math.floor(rand()*21)-10)*5}while(x!==null&&used[x]>=4);if(x!==null)used[x]=(used[x]||0)+1;return[id,x]}));check(l,w,a)}
}
const before=layoutRacks({w1:-40,w2:-25,w3:30,w4:45,w5:null,w6:null},770),after=layoutRacks({w1:-40,w2:-25,w3:30,w4:35,w5:null,w6:null},770);for(const id of ['w1','w2'])assert.deepEqual(before.controls.find(c=>c.id===id),after.controls.find(c=>c.id===id));console.log('PASS',count,'deterministic layout cases plus localized-left invariant; mocked/pure geometry, not browser layout');
const {resolveDrop}=await import('../../tools/lever-desk/input.mjs');for(const w of [330,360,770,1000])for(let x=-50;x<=50;x+=5){const p=hookPosition(x,w);assert.equal(resolveDrop(p,{left:0,right:w,width:w,top:0,bottom:1000},{left:2000,right:2100,top:0,bottom:100}),x)}console.log('PASS 84 actual drawn-hook input-coordinate checks');
