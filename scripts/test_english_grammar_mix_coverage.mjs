import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import * as core from '../assets/english-grammar/core.js';
import { TOPICS, ALL_TOPICS } from '../assets/english-grammar/topics.js';

const html = readFileSync(new URL('../tools/english-grammar-mix.html', import.meta.url), 'utf8');
const logic = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import.*$/gm, '');
const sorted = [7, 8, 9].flatMap(grade => TOPICS.filter(t => t.grade === grade));
const codes = n => core.buildMixSheet(sorted, { level:2, tense:'M', abbr:'F', zh:false, seed:10125, count:n, auditR2:true, canSplit:true }).code;
function page(code) {
  const boxes = sorted.map(t => ({ value:t.id, checked:false }));
  const elements = new Map();
  const element = name => {
    if (!elements.has(name)) elements.set(name, {
      value: name === 'title' ? '英文文法總複習' : name === 'org' ? '百宏文教' : '',
      handlers:{}, classList:{remove(){}, add(){}},
      append(){},
      addEventListener(e, fn){this.handlers[e]=fn;},
      focus(){this.focused=true;}, closest(){return null;},
    });
    return elements.get(name);
  };
  const document = {
    createElement: () => ({}), getElementById: element,
    querySelectorAll(sel) { return sel.endsWith(':checked') ? boxes.filter(x => x.checked) : boxes; },
    querySelector() { return {value:[1,2,3].find(n => element('lv'+n).checked) ?? 2}; },
  };
  const api = {setSheet(s){this.sheet=s;}};
  runInNewContext(logic, {
    ...core, PUBLIC:TOPICS, ALL_TOPICS, document, Option:class {},
    URLSearchParams, location:{search:'?code='+code},
    installOnlinePractice:()=>api,
  });
  return { element, api };
}
const headings = p => [...p.element('sheet').innerHTML.matchAll(/<h3>([^<]*)/g)].map(m=>m[1]);
const publicRender = code => {
  const p = page(code);
  assert.equal(p.element('codeIn').value, code);
  const decoded = core.decodeMixCode(code, TOPICS);
  const expected = core.buildMixSheet(decoded.topics.map(k=>TOPICS.find(x=>x.id===k)), decoded.opts);
  for (const prop of ['sections','translation','total']) assert.deepEqual(p.api.sheet[prop], expected[prop]);
  return p;
};
test('all-topic paper derives labels from actual sections and preserves historic generation',()=>{
  const expected = {20:'二十、',21:'二十一、',30:'三十、',44:'四十四、',50:'四十四、'};
  for (const [amount,last] of Object.entries(expected)) {
    const p = publicRender(codes(Number(amount)));
    assert.equal(headings(p).at(-1),last);
    assert.doesNotMatch(p.element('sheet').innerHTML,/undefined/);
    assert.match(p.element('topicHint').textContent,new RegExp('文法題涵蓋 '+Math.min(Number(amount),44)+'／44'));
  }
  const p=publicRender(codes(30));
  assert.match(p.element('topicHint').textContent,/本卷文法題未涵蓋/);
  const ninth=sorted.find(t=>t.grade===9);
  assert.ok(p.element('topicHint').textContent.includes(ninth.title));
  assert.ok(!p.element('sheet').innerHTML.split('卷號')[1].split('</div></div>')[0].includes(ninth.title));
  const beforeTeacher = p.element('sheet').innerHTML;
  p.element('verT').checked = true;
  p.element('form').handlers.change({target:p.element('verT')});
  assert.match(p.element('sheet').className,/teacher/);
  assert.equal(p.element('sheet').innerHTML.replace('<span class="teacher-tag">教用版</span>', ''),beforeTeacher);
  assert.equal(p.element('codeIn').value,codes(30));
  assert.equal(p.element('raiseTopicCount').hidden,false);
  p.element('raiseTopicCount').handlers.click();
  assert.equal(p.element('count').value,44);
  assert.equal(p.api.sheet.total,44);
  assert.equal(p.api.sheet.opts.seed,10125);
  assert.equal(p.element('raiseTopicCount').hidden,true);
  assert.equal(p.element('count').focused,true);
});
test('extra translation gets a number across the old boundary; standalone coverage omits no phantom fill section',()=>{
  const ext=publicRender(codes(20).replace(/(-C2)?-R2$/, '-T5$1-R2'));
  assert.equal(headings(ext).at(-1),'二十一、整句翻譯：把中文句子翻成英文。');
  assert.match(ext.element('topicHint').textContent,/文法題涵蓋 20／44.*整句翻譯涵蓋 5／44/);
  const only=publicRender(codes(20).replace(/(-C2)?-R2$/, '-TO$1-R2'));
  assert.equal(only.api.sheet.sections.length,0);
  assert.equal(headings(only).length,1);
  assert.match(only.element('topicHint').textContent,/整句翻譯涵蓋 20／44/);
  assert.doesNotMatch(only.element('topicHint').textContent,/文法題涵蓋/);
});
