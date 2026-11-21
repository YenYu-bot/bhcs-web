import assert from 'node:assert/strict';
import { test } from 'node:test';
import { installOnlinePractice } from '../assets/english-grammar/online-practice.js';

class Element {
  constructor(tag) { this.tag=tag; this.children=[]; this.handlers={}; this.dataset={}; this.classList={toggle(){}}; }
  append(...elements) { this.children.push(...elements); }
  replaceChildren() { this.children=[]; }
  get firstChild() { return this.children[0] ?? null; }
  setAttribute() {}
  focus() { document.activeElement = this; }
  addEventListener(event,fn) { this.handlers[event]=fn; }
  click() { if (!this.disabled) this.handlers.click?.(); }
  walk() { return [this,...this.children.flatMap(child=>child.walk())]; }
}
const blank = (a) => ({blank:true,a});
const canSection = (...items) => ({title:'改成否定句',topic:'can',mode:'neg',items});
const translations = [{zh:'我會游泳。',en:'I can swim.'}];
const split = {lines:[['I ',blank('can'),' ',blank('not'),' swim.']],meta:{splitCan:true}};
function ui(run) {
  const original = globalThis.document;
  globalThis.document = {createElement:tag=>new Element(tag),createTextNode:text=>Object.assign(new Element('#text'),{textContent:text})};
  try {
    const root=new Element('section'), toggle=new Element('button'), paper=new Element('div');
    const practice=installOnlinePractice({root,toggle,paper});
    const find=(text)=>root.walk().find(el=>el.textContent?.includes(text));
    const publish=(sections,translation=[],teacher=false)=>practice.setSheet({code:'fixture',total:sections.reduce((n,s)=>n+s.items.length,0) || translation.length,opts:{seed:4,abbr:'F'},sections,translation:{items:translation}},{id:'mix',title:'混合練習'},teacher);
    const button=(text)=>root.walk().find(el=>el.tag==='button'&&el.textContent?.startsWith(text));
    run({root,toggle,find,button,publish});
  } finally { globalThis.document=original; }
}

test('translation-only gives reveal guidance, counts as self-review, and hides the grading control',()=>ui(({root,toggle,find,publish})=>{
  publish([],translations); toggle.click();
  assert.match(find('整句翻譯寫完後').textContent,/顯示參考答案/);
  assert.doesNotMatch(find('整句翻譯寫完後').textContent,/核對作答/);
  assert.ok(find('可自動判分 0 題｜自行核對 1 題（不計分）'));
  assert.equal(find('核對作答').hidden,true);
  const reveal=root.walk().find(n=>n.tag==='button'&&n.textContent==='顯示參考答案');
  assert.ok(reveal);
  const answer=find('參考答案：I can swim.');
  assert.equal(answer.hidden,true);
  reveal.click();
  assert.equal(answer.hidden,false);
  // A teacher-edition switch preserves the translation-only directions.
  publish([],translations,true);
  assert.match(find('整句翻譯寫完後').textContent,/教用答案/);
}));

test('before submitting, counts separate auto-scored, unscored fill-in, and translation',()=>ui(({toggle,find,publish})=>{
  publish([canSection(split,{...split,grading:'review'})],translations); toggle.click();
  assert.ok(find('可自動判分 1 題｜自行核對 2 題（不計分）'));
  assert.match(find('填空作答後').textContent,/核對作答.*顯示參考答案/);
}));

test('unsplit can not gets a slot hint without loosening grading',()=>ui(({root,toggle,publish})=>{
  publish([canSection(split)]); toggle.click();
  const inputs=root.walk().filter(n=>n.tag==='input');
  const check=root.walk().find(n=>n.tag==='button'&&n.textContent==='核對作答');
  const feedback=root.walk().find(n=>n.className==='practice-feedback');
  for (const form of ['cannot','CAN NOT',' ｃａｎ　 ｎｏｔ ']) {
    inputs[0].value=form; check.click();
    assert.equal(feedback.dataset.result,'partial');
    assert.match(feedback.textContent,/正確的英文寫法.*第一格填 can，第二格填 not/);
  }
  inputs[0].value='can'; inputs[1].value='not'; check.click();
  assert.equal(feedback.dataset.result,'correct');
  assert.doesNotMatch(feedback.textContent,/第一格/);
}));

test('correction routes distinguish results, focus the actual blank, and refresh after editing',()=>ui(({root,toggle,find,publish})=>{
  publish([canSection(split,split,split,split,{...split,grading:'review'})],translations);
  toggle.click();
  const inputs=root.walk().filter(n=>n.tag==='input');
  const enter=(i,value)=>{inputs[i].value=value;inputs[i].handlers.input();};
  const check=root.walk().find(n=>n.tag==='button'&&n.textContent==='核對作答');
  const guide=root.walk().find(n=>n.className==='practice-correction-guide');
  const nav=root.walk().filter(n=>n.className?.includes('practice-item-navigation'));
  assert.equal(guide.hidden,true);
  enter(0,'can'); enter(1,'never');
  enter(2,'can');
  enter(6,'may'); enter(7,'not');
  check.click();
  assert.match(find('得分：').textContent,/0／100（答對 0／4 題）/);
  assert.equal(guide.hidden,false);
  assert.equal(nav[4].hidden,true);
  find('訂正錯題（2 題）').click();
  assert.equal(document.activeElement,inputs[1]);
  assert.equal(nav[0].children[1].disabled,true);
  nav[0].children[2].click();
  assert.equal(document.activeElement,inputs[6]);
  assert.equal(nav[3].children[2].disabled,true);
  nav[3].children[1].click();
  assert.equal(document.activeElement,inputs[1]);
  nav[0].children[3].click();
  assert.equal(document.activeElement,find('回到要訂正的題目'));
  find('補完未填格（1 題）').click();
  assert.equal(document.activeElement,inputs[3]);
  find('回到未作答題（1 題）').click();
  assert.equal(document.activeElement,inputs[4]);
  enter(1,'not');
  assert.ok(find('答案已修改，請重新核對'));
  assert.equal(find('得分：'),undefined);
  assert.match(find('目前分類依上次核對').textContent,/上次/);
  const results=root.walk().filter(n=>n.className==='practice-feedback');
  assert.equal(results[0].hidden,true);
  assert.equal(results[1].hidden,false);
  root.walk().find(n=>n.tag==='button'&&n.textContent==='重新核對').click();
  assert.equal(document.activeElement,root.walk().find(n=>n.className==='practice-result'));
  assert.match(find('得分：').textContent,/25／100/);
  assert.equal(nav[0].hidden,true);
  enter(3,'not'); enter(4,'can'); enter(5,'not'); enter(6,'can');
  root.walk().find(n=>n.tag==='button'&&n.textContent==='重新核對').click();
  assert.equal(guide.hidden,true);
  assert.match(find('得分：').textContent,/100／100/);
  publish([canSection(split,split)]);
  assert.equal(guide.hidden,true);
  assert.equal(find('得分：'),undefined);
}));

test('self-review-only fill-in offers an inline reference without promising a score',()=>ui(({root,toggle,find,button,publish})=>{
  const item={lines:[['Can you swim? — Yes, ',blank('I'),' ',blank('can'),'.']]};
  publish([{title:'Can 簡答',topic:'can',mode:'short',items:[item]}]);
  toggle.click();
  assert.match(find('這份練習不計分').textContent,/各題的「顯示參考答案」/);
  assert.ok(find('可自動判分 0 題｜自行核對 1 題'));
  assert.equal(button('核對作答').hidden,true);
  assert.ok(find('這一大題自行核對，不計分'));
  const answer=root.walk().find(n=>n.id==='practice-reference-q1');
  assert.equal(answer.hidden,true);
  button('顯示參考答案').click();
  assert.equal(answer.hidden,false);
  assert.match(answer.textContent,/第 1 格：I；第 2 格：can/);
  toggle.click(); toggle.click();
  assert.equal(answer.hidden,false,'the same worksheet retains reveal state in this page');
  button('隱藏參考答案').click();
  assert.equal(answer.hidden,true);
}));

test('mixed section disclosure and self-review edits do not affect the scored denominator or reveal answers on check',()=>ui(({root,toggle,find,button,publish})=>{
  publish([canSection(split,{...split,grading:'review'}),{title:'Can 疑問句',topic:'can',mode:'q',items:[{lines:[[blank('Can'),' you swim?']]}]}],translations);
  toggle.click();
  const sections=root.walk().filter(n=>n.className==='practice-section-usage');
  assert.deepEqual(sections.map(s=>s.textContent),['可自動判分 1 題｜自行核對 1 題（不計分）','這一大題可自動判分']);
  const inputs=root.walk().filter(n=>n.tag==='input');
  inputs[0].value='can'; inputs[1].value='not';
  button('核對作答').click();
  assert.match(find('得分：').textContent,/50／100（答對 1／2 題）/);
  assert.match(root.walk().find(n=>n.className==='practice-summary').textContent,/自行核對 2 題（不計分）/);
  assert.equal(root.walk().find(n=>n.id==='practice-reference-q2').hidden,true);
  inputs[2].value='may'; inputs[2].handlers.input();
  assert.match(find('得分：').textContent,/50／100/);
  assert.equal(find('答案已修改，請重新核對'),undefined);
}));

test('Be negative reply jumps to its mismatched pair, not the correct question auxiliary',()=>ui(({root,toggle,find,button,publish})=>{
  const item={lines:[[blank('Am'),' I late? — No, ',blank('you'),' ',blank("aren't"),'.']]};
  publish([{title:'Be 簡答',topic:'be',mode:'short',items:[item]}]); toggle.click();
  const inputs=root.walk().filter(n=>n.tag==='input');
  const check=button('核對作答');
  for(const [i,value] of ['Am',"you're","aren't"].entries()) inputs[i].value=value;
  check.click();
  assert.match(find('請搭配使用').textContent,/第 2、3 格/);
  button('訂正錯題').click();
  assert.equal(document.activeElement,inputs[1]);
  // A wrong auxiliary is independent; navigating to it comes first.
  inputs[0].value='Is';
  check.click(); button('訂正錯題').click();
  assert.equal(document.activeElement,inputs[0]);
  for (const valid of [['Am',"you're",'not'],['Am','you',"aren't"]]) {
    valid.forEach((value,i)=>{inputs[i].value=value;});
    check.click();
    assert.match(find('得分：').textContent,/100／100/);
  }
}));
