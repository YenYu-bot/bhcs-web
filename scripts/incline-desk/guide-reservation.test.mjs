import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../../tools/incline-desk/',import.meta.url);
const html=fs.readFileSync(new URL('index.html',root),'utf8');
const css=fs.readFileSync(new URL('style.css',root),'utf8');
const app=fs.readFileSync(new URL('app.mjs',root),'utf8');
// Exercise the unchanged actual function, not a copied oracle implementation.
const source=app.slice(app.indexOf('function stageCopy(s)'),app.indexOf('function paintBench()'));
const stageCopy=vm.runInNewContext('('+source+')');
const reserves=[...html.matchAll(/<div class="guide-reserve" aria-hidden="true" inert>(.*?)<\/div>/g)].map(m=>m[1]);
test('responsive reserves exactly cover actual moving, preview, committed and cancelled guidance',()=>{
 assert.equal(reserves.length,4);
 const texts=reserves.map(s=>[...s.matchAll(/<(?:h2|p)(?: class="guide-note")?>(.*?)<\/(?:h2|p)>/g)].map(m=>m[1]));
 const expected=[];
 for(const stage of ['short','long'])for(const mode of ['held','preview','atTarget','cancelled']){
  const run={rampId:stage,status:mode==='atTarget'?'atTarget':'held',...(mode==='preview'?{active:{sPreview:stage==='short'?40:80}}:{})};
  const copy=Array.from(stageCopy({stage,run}));assert(texts.some(t=>JSON.stringify(t)===JSON.stringify(copy)),`${stage}/${mode} reserved`);expected.push(copy);
 }
 assert.equal(new Set(expected.map(JSON.stringify)).size,4);
 for(const reserve of reserves){assert(!/\bid=/.test(reserve),'no duplicated live IDs');assert(reserve.startsWith('<p class="eyebrow">余老師帶你做</p>'));}
});
test('live and reserve typography share responsive rules and intrinsic, unclipped grid sizing',()=>{
 assert.match(html,/<div class="teacher-copy"><div class="guide-live"><p class="eyebrow">余老師帶你做<\/p><h2 id="guide-title">/);
 assert.equal((css.match(/\.teacher-copy :is\(\.guide-live,\.guide-reserve\)>p:not\(\.eyebrow\)/g)||[]).length,2);
 assert.match(css,/\.teacher-copy\{display:grid;grid-template-columns:minmax\(0,1fr\);overflow-anchor:none\}/);
 assert.match(css,/\.guide-live,\.guide-reserve\{grid-area:1\/1;min-width:0\}/);
 assert.match(css,/\.guide-reserve\{visibility:hidden;pointer-events:none;user-select:none\}/);
 const repair=css.slice(css.indexOf('/* Approved guide-height repair:'));
 assert.doesNotMatch(repair,/overflow\s*:|(?:min-|max-)?height\s*:|position\s*:|display:none|line-clamp/);
});

test('only the changing guidance subtree is excluded from native anchoring',()=>{
 const declarations=[...css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]*overflow-anchor\s*:[^{}]*)\}/g)];
 assert.equal(declarations.length,1,'no global anchor suppression');
 assert.equal(declarations[0][1].trim(),'.teacher-copy');
 assert.match(declarations[0][2],/overflow-anchor:none/);
});
