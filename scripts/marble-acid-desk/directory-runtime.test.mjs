import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM}from'jsdom';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
function directory(script){const dom=new JSDOM(read('tools/science/index.html'),{url:'https://www.bhcs.com.tw/tools/science/',runScripts:'outside-only',pretendToBeVisual:true});dom.window.eval(script);return dom;}
test('directory runtime shows new marble mission once without old catalyst controls, all other cards unchanged',()=>{
 const current=directory(read('assets/researcher-marble-directory.js')),previous=directory(read('assets/researcher-lab.js'));
 try{
  const cards=dom=>[...dom.window.document.querySelectorAll('.resource')].map(c=>({href:c.querySelector('a.open').getAttribute('href'),title:c.querySelector('h2,h3').textContent,mission:c.querySelector('.mission-line')?.textContent??''}));
  const a=cards(current),b=cards(previous);assert.equal(a.length,60);const matches=a.filter(x=>x.href==='../science/reaction-rate.html');assert.equal(matches.length,1);assert.match(matches[0].mission,/固定大理石總質量/);assert.doesNotMatch(matches[0].mission,/催化劑|只改濃度/);
  assert.deepEqual(a.filter(x=>!x.href.endsWith('/reaction-rate.html')),b.filter(x=>!x.href.endsWith('/reaction-rate.html')));
 }finally{current.window.close();previous.window.close();}
});
