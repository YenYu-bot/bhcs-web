import test from 'node:test';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM}from'jsdom';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const preCutover=execFileSync('git',['show','7862f2fccb93a44dd4ebe4f0128338ca258af42f:tools/science/index.html'],{cwd:new URL('../../',import.meta.url),encoding:'utf8'});
function directory(script,html){const dom=new JSDOM(html,{url:'https://www.bhcs.com.tw/tools/science/',runScripts:'outside-only',pretendToBeVisual:true});dom.window.eval(script);return dom;}
test('historical directory shows the marble mission once without old catalyst controls, all other cards unchanged',()=>{
 const current=directory(read('assets/researcher-marble-directory.js'),preCutover),previous=directory(read('assets/researcher-lab.js'),preCutover);
 try{
  const cards=dom=>[...dom.window.document.querySelectorAll('.resource')].map(c=>({href:c.querySelector('a.open').getAttribute('href'),title:c.querySelector('h2,h3').textContent,mission:c.querySelector('.mission-line')?.textContent??''}));
  const a=cards(current),b=cards(previous);assert.equal(a.length,63);const matches=a.filter(x=>x.href==='../science/reaction-rate.html');assert.equal(matches.length,1);assert.match(matches[0].mission,/固定大理石總質量/);assert.doesNotMatch(matches[0].mission,/催化劑|只改濃度/);
  assert.deepEqual(a.filter(x=>!x.href.endsWith('/reaction-rate.html')),b.filter(x=>!x.href.endsWith('/reaction-rate.html')));
 }finally{current.window.close();previous.window.close();}
});

test('current directory makes the new lab primary and retains marble as a secondary link',()=>{
 const current=directory(read('assets/researcher-marble-directory.js'),read('tools/science/index.html'));
 try{
  const doc=current.window.document;
  const card=doc.querySelector('.resource > a.open[href="../lab/reaction-rate/"]')?.closest('.resource');
  assert(card);
  assert.equal(doc.querySelectorAll('.resource > a.open[href="../science/reaction-rate.html"]').length,0);
  assert(card.querySelector('p.subtle a[href="../science/reaction-rate.html"]'));
  assert.doesNotMatch(card.querySelector('.mission-line')?.textContent??'',/催化劑|只改濃度/);
 }finally{current.window.close();}
});
