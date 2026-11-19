const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const parse = (file) => new JSDOM(read(file), { url:'https://test.invalid/'+file,runScripts:'outside-only' });
const data = JSON.parse(read('assets/english-cap-reading/bank.json'));
const stem = 'assets/english-cap-reading/';
const codes = [];
const names = new Set();
for(const y of data){
  let previous;
  assert(y.source.startsWith('https://cap.rcpet.edu.tw/'));
  for(const group of y.groups){
    if(previous!=null)assert.equal(group.first,previous+1);
    previous=group.last;
    assert.equal(group.last-group.first+1,group.answers.length);
    assert(group.answers.every(a=>/^[ABCD]$/.test(a)));
    if(group.officialOnly){assert(!group.images);continue;}
    codes.push(y.year+'-'+group.first);
    assert.equal(group.images.length,group.pages.length);
    for(const f of group.images){
      assert(!names.has(f));names.add(f);
      assert.match(f,/^\d{3}-\d+-\d+\.webp$/);
      const bytes=fs.readFileSync(path.join(root,stem,'images',f));
      assert.equal(bytes.subarray(8,12).toString(),'WEBP');
      assert(bytes.length>1500);
    }
  }
}
assert.equal(data.length,13);
assert.equal(new Set(codes).size,codes.length);
assert.equal(names.size,fs.readdirSync(path.join(root,stem,'images')).length);
(async()=>{
let dom=parse('tools/english-cap-reading.html');
const w=dom.window,d=w.document, $=s=>d.querySelector(s);
w.TextDecoder=TextDecoder;
w.fetch=async()=>({ok:true,json:async()=>data});
w.eval(read(stem+'app.mjs').replaceAll('import.meta.url',JSON.stringify('https://test.invalid/'+stem+'app.mjs')));
await new Promise(r=>setTimeout(r,30));
assert.equal(d.querySelectorAll('#years input').length,13);
assert.equal(d.querySelectorAll('.group').length,1);
const test='CAPR1-114-20.115-20.107-25';
const restore=(code)=>{$('#code').value=code;$('#restore').click()};
restore(test);
const order=()=>[...d.querySelectorAll('.group')].map(e=>e.dataset.groupId);
assert.deepEqual(order(),['114-20','115-20','107-25']);
assert.equal($('#answer-key').hidden,true);
assert.equal($('#print').disabled,true,'before image load');
for(const img of d.querySelectorAll('.scan img')){
  Object.defineProperty(img,'naturalWidth',{value:1280});
  img.dispatchEvent(new w.Event('load'));
}
assert.equal($('#print').disabled,false,'after image load');
$('.choice input').click();
$('#check').click();
assert.match($('#score').textContent,/未作答/);
$('input[value=teacher]').click();
assert.deepEqual(order(),['114-20','115-20','107-25']);
assert.equal($('#code').value,test);
assert.equal($('#answer-key').hidden,false);
assert.match($('#answer-key').textContent,/教用答案/);
$('input[value=student]').click();
assert($('.choice input').checked);
assert($('#answer-key').hidden);
restore('CAPR1-114-20.114-20');
assert.match($('#status').textContent,/重複/);
restore('CAPR1-108-16');
assert.match($('#status').textContent,/題組/);
assert.deepEqual(order(),['114-20','115-20','107-25']);
const img=$('.scan img');img.dispatchEvent(new w.Event('error'));
assert($('#print').disabled);
assert.match(read(stem+'style.css'),/\.page-head,\.controls,\.only-screen\{display:none!important\}/);
dom.window.close();

dom=parse('tools/english-cap-grammar.html');
const doc=dom.window.document,g=id=>doc.getElementById(id);
const grammarPath='assets/english-cap-grammar/';
dom.window.eval(read(grammarPath+'bank.mjs').replaceAll('export const ','const ')+'\n'+read(grammarPath+'app.mjs').split('\n').slice(1).join('\n'));
const gCount=()=>doc.querySelectorAll('.question').length;
const gOrder=()=>[...doc.querySelectorAll('.question')].map(e=>e.dataset.itemId);
const gNumbering=()=>{
  const legends=[...doc.querySelectorAll('.question fieldset > legend > .prompt-line')];
  assert.equal(legends.length,gCount());
  assert.deepEqual(legends.map(e=>e.querySelector('.question-number').textContent),legends.map((_,i)=>(i+1)+'.'));
  assert(legends.every(e=>e.querySelector('.prompt-text').textContent.length>0));
};
assert(gCount()>=13);gNumbering();
const original=gOrder(),code=g('code').value;
assert.equal(original.length,new Set(original).size);
assert.equal(doc.querySelectorAll('.answer').length,0);
doc.querySelector('.option input').click();
g('check').click();assert.match(g('score').textContent,/未作答/);
g('teacher').click();
assert.deepEqual(gOrder(),original);
assert.equal(g('code').value,code);
assert.equal(doc.querySelectorAll('.answer').length,gCount());gNumbering();
g('teacher').click();
assert(doc.querySelector('.option input').checked);
assert.equal(doc.querySelectorAll('.answer').length,0);
g('kind').value='cloze';g('kind').dispatchEvent(new dom.window.Event('change'));
g('generate').click(); assert.equal(doc.querySelectorAll('.passage').length,2);gNumbering();
g('code').value=code;g('restore').click();
assert.deepEqual(gOrder(),original);gNumbering();
assert.match(read(grammarPath+'style.css'),/\.controls,\.option input,\.feedback\{display:none!important\}/);
dom.window.close();
console.log('PASS CAP English: '+codes.length+' group IDs, '+names.size+' WebP files, answer lengths, same-worksheet edition/replay, incomplete/error states and print CSS assertions.');
})().catch(e=>{console.error(e);process.exitCode=1});
