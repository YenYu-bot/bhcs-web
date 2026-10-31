'use strict';
const assert=require('node:assert/strict');
function completedWrite({since,key,lock,audit=globalThis.__frictionAudit}){
 const requests=audit.locks.filter(x=>x.id>=since&&x.name===lock),last=requests.at(-1);
 if(!last||requests.some(x=>x.status==='pending')||last.status!=='resolved'||!last.result?.ok||!last.result?.deviceSaved)return false;
 const writes=audit.access.filter(x=>x.name==='setItem'&&x.key===key&&x.requestId===last.id&&x.completed);
 return writes.length===1?writes[0]:false;
}
function assertContinuity(before,samples,calls,label){
 assert.ok(samples.length,label+': samples exist');assert.equal(calls.length,0,label+': no programmatic gesture scrolling');
 for(const s of samples){assert.ok(s.bench,label+': apparatus exists');for(const k of ['x','y','width','height']){assert.ok(Number.isFinite(s.bench[k])&&Number.isFinite(before.bench[k]));assert.ok(Math.abs(s.bench[k]-before.bench[k])<=1,label+': apparatus '+k+' stays within 1 CSS px');}assert.ok(Math.abs((s.bench.documentY-before.bench.documentY)-(s.scrollY-before.scrollY))<=1,label+': scroll/layout change does not move apparatus');}
 return samples;
}
function rgba(value){const m=/^rgba?\(([^)]+)\)$/i.exec(value.trim());assert.ok(m,'computed RGB serialization');const p=m[1].trim().split(/[\s,/]+/);assert.ok(p.length===3||p.length===4);const n=(v,a=false)=>{const x=parseFloat(v);assert.ok(Number.isFinite(x));return v.endsWith('%')?x*(a?0.01:2.55):x;};return [...p.slice(0,3).map(v=>n(v)),p.length===4?n(p[3],true):1];}
function assertFeedback(value,dragging){const actual=rgba(value),expected=dragging?[232,217,155,68/255]:[205,226,191,34/255];for(let i=0;i<3;i++)assert.ok(Math.abs(actual[i]-expected[i])<=.01,'intended handle RGB');assert.ok(Math.abs(actual[3]-expected[3])<=.001,'intended translucent handle alpha');return actual;}
module.exports={completedWrite,assertContinuity,rgba,assertFeedback};
