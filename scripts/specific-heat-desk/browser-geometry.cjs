'use strict';
const assert=require('node:assert/strict');
// Stable structural selectors and absolute baseline pixels: replacement DOM nodes
// inherit the same exact 200% rules, with no observer or cumulative scaling.
function installTextStress(){
 const selector=e=>{if(e.id)return '#'+CSS.escape(e.id);if(e===document.body)return 'body';const tag=e.tagName.toLowerCase(),siblings=[...e.parentElement.children].filter(n=>n.tagName===e.tagName);return selector(e.parentElement)+' > '+tag+':nth-of-type('+(siblings.indexOf(e)+1)+')';};
 const baselines=[...document.querySelectorAll('body,body *')].filter(e=>e instanceof HTMLElement).map(e=>({selector:selector(e),px:parseFloat(getComputedStyle(e).fontSize)}));
 const style=document.createElement('style');style.id='heat-qa-text-stress';style.textContent=baselines.map(x=>`${x.selector}{font-size:${x.px*2}px!important}`).join('\n');document.head.append(style);
 return {method:'Persistent structural CSS, absolute 2× computed HTML font sizes; SVG artwork excluded',baselines};
}
function stressSizes(baselines){return baselines.map(x=>({selector:x.selector,expected:x.px*2,actual:[...document.querySelectorAll(x.selector)].map(e=>parseFloat(getComputedStyle(e).fontSize))}));}
function assertStressSizes(sizes){assert.ok(sizes.length>0);for(const x of sizes){assert.ok(x.actual.length>0,'stress selector must still match: '+x.selector);for(const actual of x.actual)assert.ok(Math.abs(actual-x.expected)<.02,'persistent 200% font missing: '+JSON.stringify(x));}}
function readGeometry(){
 const visible=e=>{if(!e.getClientRects().length)return false;const s=getComputedStyle(e);return s.visibility!=='hidden'&&s.visibility!=='collapse'&&s.display!=='none';};
 const identity=e=>e.id||e.getAttribute('data-material')||e.className||e.tagName;
 const boxes=[...document.querySelectorAll('#heat-watch,.heat-unit,.heat-apparatus,#action,.station,.materials,.materials button,.controls,.coach,button,input,select,summary')].filter(visible).map(e=>{const r=e.getBoundingClientRect();return {id:identity(e),left:r.left,right:r.right,width:r.width,height:r.height,client:e.clientWidth,scroll:e.scrollWidth,internal:e.matches('#heat-watch,.heat-unit,.heat-apparatus,.materials,.materials button,.controls,.coach'),hit:e.matches('button,input,select,summary')};});
 const text=[],intentional=[];const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
 while((n=walker.nextNode())){if(!n.textContent.trim())continue;const e=n.parentElement;if(!e||!visible(e)||e.closest('svg,script,style,[aria-hidden="true"]'))continue;
 let skip=false;const clips=[];for(let a=e;a&&a!==document.body;a=a.parentElement){const s=getComputedStyle(a),r=a.getBoundingClientRect();if(s.clipPath!=='none'&&r.width<=1&&r.height<=1){intentional.push({id:identity(a),reason:'explicit 1px visually-hidden accessible duplicate'});skip=true;break;}if(['auto','scroll'].includes(s.overflowX)&&a.scrollWidth>a.clientWidth+1){intentional.push({id:identity(a),reason:'native horizontal scroll region'});skip=true;break;}if(['hidden','clip'].includes(s.overflowX)||['hidden','clip'].includes(s.overflowY))clips.push({id:identity(a),left:r.left,right:r.right,top:r.top,bottom:r.bottom,x:['hidden','clip'].includes(s.overflowX),y:['hidden','clip'].includes(s.overflowY)});}
 if(skip)continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())if(r.width&&r.height)text.push({owner:identity(e),text:n.textContent.trim(),left:r.left,right:r.right,top:r.top,bottom:r.bottom,clips});
 }
 return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,boxes,text,intentional};
}
function assertGeometry(g){assert.ok(g.scrollWidth<=g.width+1,'page overflow: '+JSON.stringify({width:g.width,scrollWidth:g.scrollWidth}));for(const b of g.boxes){assert.ok(b.left>=-1&&b.right<=g.width+1,'horizontal clipping: '+JSON.stringify(b));assert.ok(b.width>0&&b.height>0);if(b.internal)assert.ok(b.scroll<=b.client+1,'internal content overflow: '+JSON.stringify(b));if(b.hit)assert.ok(b.width>=44&&b.height>=44,'minimum 44px native target: '+JSON.stringify(b));}for(const t of g.text){assert.ok(t.left>=-1&&t.right<=g.width+1,'text outside viewport: '+JSON.stringify(t));for(const c of t.clips){if(c.x)assert.ok(t.left>=c.left-1&&t.right<=c.right+1,'text horizontally clipped: '+JSON.stringify(t));if(c.y)assert.ok(t.top>=c.top-1&&t.bottom<=c.bottom+1,'text vertically clipped: '+JSON.stringify(t));}}return g;}
module.exports={installTextStress,stressSizes,assertStressSizes,readGeometry,assertGeometry};
