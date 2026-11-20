import assert from 'node:assert/strict';
import { test } from 'node:test';
import { answersOf, buildSheet, makeRng } from '../assets/english-grammar/core.js';
import { TOPICS } from '../assets/english-grammar/topics.js';
import { gradeItem } from '../assets/english-grammar/grading.js';
import { installOnlinePractice } from '../assets/english-grammar/online-practice.js';
import { practiceResult } from '../assets/english-grammar/practice-score.js';

const totals = (overrides) => ({correct:0, incorrect:0, partial:0, unanswered:0, review:0, ...overrides});
test('score excludes review, includes partial and unanswered, and rounds only the result', () => {
  const base = {correct:2, incorrect:1, partial:2, unanswered:1};
  const score = practiceResult(totals({...base,review:30}));
  assert.equal(score.denominator,6);
  assert.equal(score.score,33.3);
  assert.deepEqual(score, practiceResult(totals(base)));
  assert.ok(score.note);
  assert.equal(practiceResult(totals({correct:3,review:8})).score,100);
  assert.equal(practiceResult(totals({incorrect:1,review:8})).score,0);
  assert.deepEqual(
    [practiceResult(totals({review:8})).score, practiceResult(totals({review:8})).denominator],
    [null, 0],
  );
  assert.deepEqual(
    [practiceResult(totals({unanswered:8,review:6})).score, practiceResult(totals({unanswered:8,review:6})).denominator],
    [null, 8],
  );
});

test('generated keys never false-fail in any public topic or mode', () => {
  const modesSeen = new Set(), publicModes = new Set(), outcomes = new Set();
  for (const topic of TOPICS) for (const mode of topic.modes) {
    const id = topic.id+'/'+mode.id;
    publicModes.add(id);
    for (const level of [1,2,3]) for (const abbr of ['F','C','B']) {
      for (const tense of topic.past ? ['P','M','D'] : ['P']) {
        const rng = makeRng(19507 + level * 7);
        const opts = {level, abbr, tense, zh:true, count:10, tr:0};
        for (let draws=0; draws<6; draws++) {
          const item = topic.generate(rng,opts,mode.id);
          if (!item) continue;
          modesSeen.add(id);
          const context = {topicId:topic.id, modeId:mode.id, abbr};
          const printed = answersOf(item);
          for (const side of [0,-1]) {
            const answers = printed.map(answer => answer.split('／').at(side).trim());
            const result = gradeItem(item,answers,context);
            assert.ok(['correct','review'].includes(result.status), JSON.stringify({id, level, abbr, tense, answers, result, lines:item.lines}));
            outcomes.add(result.status);
          }
        }
      }
    }
  }
  assert.deepEqual(modesSeen,publicModes,'every published mode emits at least one tested item');
  assert.deepEqual(outcomes,new Set(['correct','review']));
});

// The renderer needs only these DOM operations for mounting, input, and checking.
// This is deliberately hermetic; real layout/printing still needs browser QA.
class Node {
  constructor(tag) { this.tagName=tag; this.children=[]; this.handlers={}; this.dataset={}; this.classList={toggle(){}}; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren() { this.children=[]; }
  get firstChild() { return this.children[0] ?? null; }
  setAttribute() {}
  focus() {}
  addEventListener(name,fn) { this.handlers[name]=fn; }
  click() { this.handlers.click?.(); }
  walk() { return [this,...this.children.flatMap(child=>child.walk())]; }
}
function fixture() {
  const doc = globalThis.document;
  globalThis.document = {createElement:tag=>new Node(tag),createTextNode:text=>Object.assign(new Node('#text'),{textContent:text})};
  const root = new Node('section'), toggle = new Node('button'), paper = new Node('div');
  return {root,toggle,practice:installOnlinePractice({root,toggle,paper}),restore:()=>{globalThis.document=doc;}};
}
test('every public topic is available through the online renderer', () => {
  const f = fixture();
  try {
    for (const topic of TOPICS) {
      const sheet = buildSheet(topic,{level:2, abbr:'F', tense:'M', zh:true, count:10, tr:0, seed:12784, modes:topic.defaultModes[2]});
      assert.ok(sheet.total > 0,topic.id);
      f.practice.setSheet(sheet,topic,false);
      assert.equal(f.toggle.hidden,false,topic.id);
      f.toggle.click();
      assert.equal(f.root.hidden,false,topic.id);
      assert.ok(f.root.walk().some(n=>n.tagName==='input'||n.tagName==='textarea'),topic.id);
      f.toggle.click();
    }
  } finally { f.restore(); }
});

test('mixed renderer submits a valid Be contraction alternative to shared grading', () => {
  const f = fixture();
  const blank = (a) => ({blank:true,a});
  try {
    const item = {lines:[[blank('Is'), ' Amy at school? — No, ', blank('she'),' ',blank("isn't"),'.']]};
    f.practice.setSheet({code:'fixture',total:1,opts:{seed:1,abbr:'F'},sections:[{topic:'be',mode:'short',items:[item]}]},{id:'mix',title:'混合測試'},false);
    f.toggle.click();
    const inputs = f.root.walk().filter(n=>n.tagName==='input');
    assert.equal(inputs.length,3);
    for (const [i,value] of ['Is',"she’s",'not'].entries()) inputs[i].value=value;
    f.root.walk().find(n=>n.textContent==='核對作答').click();
    assert.ok(f.root.walk().some(n=>n.dataset.result==='correct'));
  } finally { f.restore(); }
});

test('expanded grading separates accepted alternatives, intentional omission, and ambiguous review', () => {
  const blank = (a) => ({blank:true,a});
  const x = {lines:[['I play ',blank('×'),' basketball.']]};
  const article = {topicId:'article',modeId:'the'};
  for(const text of ['×','x','不填']) assert.equal(gradeItem(x,[text],article).status,'correct');
  assert.equal(gradeItem(x,[''],article).status,'unanswered');
  assert.equal(gradeItem(x,['the'],article).status,'incorrect');
  const rel = {lines:[['The student ',blank('who／that'),' helped me is here.']]};
  assert.equal(gradeItem(rel,['that'],{topicId:'relative',modeId:'who'}).status,'correct');
  assert.equal(gradeItem(rel,['where'],{topicId:'relative',modeId:'who'}).status,'incorrect');
  const ask = {lines:[['Do you have ',blank('any'),' books?']]};
  assert.equal(gradeItem(ask,['some'],{topicId:'quantity',modeId:'some'}).status,'review');
  const time = {lines:[[blank('six'),' ',blank('forty-five')]]};
  assert.equal(gradeItem(time,['quarter to','seven'],{topicId:'numbers',modeId:'time'}).status,'review');
});
