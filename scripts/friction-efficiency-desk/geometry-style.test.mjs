import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {geometry} from '../../tools/friction-efficiency-desk/bench.mjs';
import {CONCLUSION_OPTIONS} from '../../tools/friction-efficiency-desk/model.mjs';
const base=new URL('../../tools/friction-efficiency-desk/',import.meta.url);
const html=readFileSync(new URL('index.html',base),'utf8').replace("<link rel=\"canonical\" href=\"https://www.bhcs.com.tw/tools/friction-efficiency-desk/\">","<meta name=\"robots\" content=\"noindex,nofollow\">"),css=readFileSync(new URL('style.css',base),'utf8');
test('all 505 apparatus positions preserve 3–4–5 scale and visible 44px handle',()=>{
 for(const [w,h] of [[268,300],[308,300],[338,300],[360,300],[600,370]])for(let s=0;s<=100;s++){
  const g=geometry(s,w,h);assert(g&&g.k>0);const p=g.ray(100);
  assert(Math.abs(p.x-g.start.x-80*g.k)<1e-9);assert(Math.abs(g.start.y-p.y-60*g.k)<1e-9);
  assert(Math.abs(Math.hypot(p.x-g.start.x,p.y-g.start.y)-100*g.k)<1e-9);
  assert(g.handle.x>=22&&g.handle.x<=w-22);assert(g.handle.y>=22&&g.handle.y<=h-22);
  for(const corner of [g.ray(s-6,0),g.ray(s+6,0),g.ray(s-6,9),g.ray(s+6,9)])assert(corner.x>=0&&corner.x<=w&&corner.y>=0&&corner.y<=h);
 }
});
test('hidden or invalid bounds skip draw instead of emitting negative geometry',()=>{for(const [w,h] of [[0,0],[6,300],[300,6],[-3,300],[NaN,300],[300,Infinity]])assert.equal(geometry(50,w,h),null);});
test('handle idle is translucent and dragging class is the only fill trigger',()=>{
 assert.match(css,/button:hover:not\(:disabled\):not\(\.drag-handle\)/);
 assert.match(css,/\.drag-handle\{[^}]*background:#cde2bf22/);
 assert.match(css,/\.drag-handle\.is-dragging\{[^}]*background:#e8d99b44/);
 assert.doesNotMatch(css,/\.drag-handle:(?:active|hover)/);
 assert.match(css,/button:focus-visible/);assert.match(css,/touch-action:none/);
});
test('guide reserves are intrinsic and scoped anchoring never globally disables document',()=>{
 assert.match(css,/\.teacher-copy\{[^}]*display:grid[^}]*overflow-anchor:none/);
 assert.match(css,/\.guide-reserve\{visibility:hidden;pointer-events:none/);
 assert.equal((css.match(/overflow-anchor:none/g)||[]).length,2); // guide copy + motion status only
 assert.doesNotMatch(css,/(?:html|body)\s*\{[^}]*overflow-anchor:none/);
 const app=readFileSync(new URL('app.mjs',base),'utf8');assert.match(app,/setAttribute\('aria-hidden','true'\)/);assert.match(app,/setAttribute\('inert',''\)/);
});
test('every displayed conclusion option is accepted by its model domain',()=>{
 for(let i=0;i<3;i++){const values=[...html.matchAll(new RegExp(`name="conclusion-${i}" value="([^"]+)"`,'g'))].map(m=>m[1]);assert.deepEqual(values.sort(),[...CONCLUSION_OPTIONS[i]].sort());}
});
test('canonical teacher unchanged with matching immutable provenance',()=>{
 const asset=readFileSync(new URL('assets/teacher-body-v3.png',base));const hash=createHash('sha256').update(asset).digest('hex');
 assert.equal(hash,'2851a4bdd0a6523fad5db15c8a197c17ac191bd70000c051513b5e317589f23b');assert.equal(JSON.parse(readFileSync(new URL('assets/teacher-body-v3.provenance.json',base))).sha256,hash);
});
test('private standalone metadata and discoverable two-stage reset remain',()=>{
 assert.match(html,/<html lang="zh-Hant">/);assert.match(html,/noindex,nofollow/);
 for(const id of ['new-experiment','completion-reset','reset-ack','reset-confirm','reset-raw-export'])assert.match(html,new RegExp(`id="${id}"`));
 assert.doesNotMatch(html,/<iframe|https?:\/\/[^" ]+\.m?js/);
});
test('fixed slope label sits below the entire handle sweep rather than under its halo',()=>{
 const source=readFileSync(new URL('bench.mjs',base),'utf8');assert.match(source,/label\(width\/2,height-4,'沿坡量測段 100 cm'\)/);
 for(const [w,h] of [[268,300],[308,300],[338,300],[360,300],[600,370]])for(let s=0;s<=100;s++)assert(geometry(s,w,h).handle.y+22<h-18);
});
