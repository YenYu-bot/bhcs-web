/* Resource-entry disclosures: DOM behavior, not external-app/backend verification. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const source=fs.readFileSync(process.env.RESOURCE_DISCLOSURE_PAGE||path.join(__dirname,'../ziyuan.html'),'utf8');
const selector='.res-sec .tpills>a,.res-sec .science-category li>a';
const original=new JSDOM(source).window.document;
const links=[...original.querySelectorAll(selector)];
const contracts=[
 ['gept-entry-note','AKfycbzFOHfIic9mrBdJEw69B5IINKacgAlr7Ivxk9p1qIHfAR-RDeQUXN8508vn85RxmoD9zw',['姓名必填','老師後台','麥克風']],
 ['vocab-entry-note','https://yenyu-bot.github.io/vocabmaster/',['帳號登入','請洽老師']],
 ['cap-entry-note','AKfycby3GGiT4EzfyhmUBirNQSTrM3Cgnj24pSm21iqfDgD4AbuJ4J0ZhE2M0miKjVPl7ugBwg',['姓名','班級','系統公告','老師覆核','閱讀與聽力']],
 ['gsat-entry-note','AKfycbxi11grwSKRsF7KwjoCRkE6b6t05K1n1gWcU2Pvyt3-AquVmLezYRqY31MEI_3V3wzx',['姓名','班級','系統公告','非選擇題','老師評閱']]
];
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS '+name)};
test('metadata and visible prose avoid blanket anonymous/no-data claims',()=>{
 for(const text of [original.querySelector('meta[name="description"]').content,original.querySelector('meta[property="og:description"]').content,original.querySelector('.hero .lede').textContent,original.querySelector('.resource-finder .lead').textContent]){
  assert.doesNotMatch(text,/不需(?:要)?註冊|不用留資料|不收集資料/);
  assert.match(text,/登入/);
 }
 for(const meta of original.querySelectorAll('script[type="application/ld+json"]'))assert.doesNotMatch(meta.textContent,/不需(?:要)?註冊|不用留資料/);
});
test('every external entry has visible, adjacent and accessible disclosure without JS',()=>{
 const external=links.filter(a=>/^https?:/.test(a.getAttribute('href')));assert.equal(external.length,contracts.length);
 for(const [id,key,words] of contracts){
  const a=external.find(a=>a.href.includes(key));assert.ok(a,key);assert.equal(a.getAttribute('aria-describedby'),id);
  const note=original.getElementById(id);assert.ok(note);assert.equal(a.nextElementSibling,note);assert.ok(note.classList.contains('resource-entry-note'));assert.equal(note.hidden,false);assert.equal(note.getAttribute('aria-hidden'),null);
  for(const word of words)assert.ok(note.textContent.includes(word),`${id}: ${word}`);
  assert.equal(note.querySelectorAll('a').length,0,'disclosures must not add counted entries');
  assert.equal(a.target,'_blank');assert.equal(a.rel,'noopener');
 }
});
test('readiness and grading limitations are not replaced by unsupported availability claims',()=>{
 const cap=links.find(a=>a.getAttribute('aria-describedby')==='cap-entry-note');assert.match(cap.textContent,/可用年份見系統公告/);assert.doesNotMatch(cap.title,/近六年|答完即時|全部.*可用/);
 assert.doesNotMatch(original.getElementById('cap-entry-note').textContent,/110.*(?:不能|不可|尚未)/);
 assert.match(original.querySelector('#res-exam .lead').textContent,/自動評分限系統支援的題型/);
 assert.match(original.querySelector('#res-exam .lead').textContent,/部分結果需老師評閱/);
});
test('counts remain derived from resource links',()=>{
 assert.equal(new Set(links.map(a=>a.getAttribute('href'))).size,links.length);
 assert.equal(Number(original.querySelector('.resource-finder .lead').textContent.match(/目前共 (\d+) 項/)[1]),links.length);
 for(const section of original.querySelectorAll('.res-sec'))assert.equal(Number(section.querySelector('.count').textContent.match(/\d+/)[0]),section.querySelectorAll('.tpills>a,.science-category li>a').length);
});
const errors=[];const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(source,{url:'https://www.bhcs.com.tw/ziyuan.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole,beforeParse(w){w.HTMLElement.prototype.scrollIntoView=()=>{};}});
const document=dom.window.document;
const search=term=>{const field=document.getElementById('resource-search');field.value=term;field.dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
test('finder initializes without runtime error and preserves all entry destinations',()=>{
 assert.deepEqual(errors,[]);assert.ok(document.documentElement.classList.contains('res-js'));
 assert.deepEqual([...document.querySelectorAll(selector)].map(a=>a.getAttribute('href')),links.map(a=>a.getAttribute('href')));
 assert.match(document.querySelector('.resource-filter-status').textContent,new RegExp('共 '+links.length+' 項'));
});
test('featured CAP entry retains visible disclosure text',()=>{
 const cap=document.querySelector('.res-pick[href*="AKfycby3GGiT4"]');assert.ok(cap);assert.match(cap.querySelector('b').textContent,/可用年份見系統公告/);
 assert.equal(cap.querySelector('.res-pick-note').textContent,document.getElementById('cap-entry-note').textContent);
 assert.match(cap.textContent,/姓名.*班級/);assert.match(cap.textContent,/老師覆核/);
});
test('search hides an entry and its own disclosure together, including shared English row',()=>{
 search('VocabMaster');const vocab=document.getElementById('vocab-entry-note'),gept=document.getElementById('gept-entry-note');
 assert.equal(vocab.classList.contains('resource-hidden'),false);assert.equal(gept.classList.contains('resource-hidden'),true);
 assert.match(document.querySelector('.resource-filter-status').textContent,/符合 1 項/);
 search('姓名必填');assert.equal(gept.classList.contains('resource-hidden'),false);assert.equal(vocab.classList.contains('resource-hidden'),true);
 search('不存在的教材zz');assert.match(document.querySelector('.resource-filter-status').textContent,/找不到/);
 search('');for(const [id]of contracts)assert.equal(document.getElementById(id).classList.contains('resource-hidden'),false);
 assert.match(document.querySelector('.resource-filter-status').textContent,new RegExp('共 '+links.length+' 項'));
});
test('stage/type filters preserve disclosure visibility and recover after clearing',()=>{
 const click=(group,val)=>document.querySelector(`${group} button[data-val="${val}"]`).click();
 click('.res-stages','國中');click('.res-types','quiz');
 assert.equal(document.getElementById('gept-entry-note').closest('.res-sec').classList.contains('resource-hidden'),false);
 assert.equal(document.getElementById('cap-entry-note').closest('.res-sec').classList.contains('resource-hidden'),true);
 click('.res-stages','升學');assert.equal(document.getElementById('cap-entry-note').closest('.res-sec').classList.contains('resource-hidden'),false);
 click('.res-stages','全部');click('.res-types','all');assert.equal(document.querySelector('.res-picks').hidden,false);
});
test('disclosure CSS wraps within pills and featured cards',()=>{
 assert.match(source,/\.resource-entry-note\{[^}]*flex:1 0 100%[^}]*min-width:0[^}]*overflow-wrap:anywhere/);
 assert.match(source,/\.res-pick \.res-pick-note\{[^}]*display:block[^}]*overflow-wrap:anywhere/);
});
dom.window.close();console.log(`Resource disclosure checks: ${checks} passed (DOM/static, not browser layout or external backend).`);
