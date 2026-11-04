import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),G=require('./browser-geometry.cjs'),{JSDOM}=require('jsdom');
const clear=()=>({width:320,scrollWidth:320,boxes:[{id:'material',left:10,right:92,width:82,height:56,client:82,scroll:82,internal:true,hit:true}],text:[{owner:'material',text:'水100 g',left:15,right:85,top:20,bottom:45,clips:[]}],intentional:[]});
test('geometry rejects documented internal overflow even when page and element boxes fit',()=>{
 G.assertGeometry(clear());for(const b of [{client:82,scroll:98},{client:266,scroll:289}]){const g=clear();Object.assign(g.boxes[0],b);assert.throws(()=>G.assertGeometry(g),/internal content overflow/);}
});
test('geometry rejects actual text clipping, viewport spill and undersized native controls',()=>{
 const g=clear();g.text[0].clips=[{id:'desk',left:0,right:80,top:0,bottom:100,x:true,y:true}];assert.throws(()=>G.assertGeometry(g),/text horizontally clipped/);
 g.text[0].clips=[{id:'desk',left:0,right:100,top:0,bottom:40,x:true,y:true}];assert.throws(()=>G.assertGeometry(g),/text vertically clipped/);
 g.text[0].clips=[];g.text[0].right=340;assert.throws(()=>G.assertGeometry(g),/text outside viewport/);
 for(const size of ['width','height']){const h=clear();h.boxes[0][size]=43;assert.throws(()=>G.assertGeometry(h),/44px/);}
});
test('200% font validation rejects disappeared selectors, unstressed replacement nodes and cumulative scaling',()=>{
 G.assertStressSizes([{selector:'.label',expected:28,actual:[28,28]}]);for(const actual of [[],[14],[56]])assert.throws(()=>G.assertStressSizes([{selector:'.label',expected:28,actual}]));
});
test('persistent structural stylesheet doubles freshly replaced DOM without compounding',()=>{
 const dom=new JSDOM('<!doctype html><html><head><style>body,#heat-watch{font-size:16px}#heat-watch b{font-size:13px}#heat-watch small{font-size:12px}</style></head><body><div id="heat-watch"><b>水100 g</b><small>供熱</small></div></body></html>');
 const keys=['document','HTMLElement','getComputedStyle','CSS'],old=Object.fromEntries(keys.map(k=>[k,global[k]]));
 Object.assign(global,{document:dom.window.document,HTMLElement:dom.window.HTMLElement,getComputedStyle:dom.window.getComputedStyle.bind(dom.window),CSS:{escape:s=>s}});
 try{const stress=G.installTextStress();G.assertStressSizes(G.stressSizes(stress.baselines));for(let n=0;n<3;n++){document.querySelector('#heat-watch').innerHTML='<b>鐵100 g</b><small>已暫停</small>';G.assertStressSizes(G.stressSizes(stress.baselines));assert.equal(getComputedStyle(document.querySelector('#heat-watch b')).fontSize,'26px');}assert.equal(document.querySelectorAll('#heat-qa-text-stress').length,1);}
 finally{for(const k of keys)global[k]=old[k];dom.window.close();}
});
