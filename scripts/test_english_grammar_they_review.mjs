import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TOPICS } from '../assets/english-grammar/topics.js';
import { answersOf, buildSheet, decodeCode } from '../assets/english-grammar/core.js';
import { gradeItem } from '../assets/english-grammar/grading.js';

const cases = [
  ['BE-2P-8-C0-20-99542',4,'be',['Is','he','is'],['Is','they','are']],
  ['PST-2P-8-C0-20-99542',2,'past',['Did','he',"didn't"],['Did','they',"didn't"]],
  ['PRG-2P-8-C0-20-99542',2,'progressive',['Is','he','is'],['Is','they','are']],
  ['SIM-2P-8-C0-20-99542',2,'simple',['Does','he',"doesn't"],['Does','they',"don't"]],
];

for (const [code,question,topicId,printed,valid] of cases) test(code+' Q'+question+' only coherent singular they is review', () => {
  const topic = TOPICS.find(t=>t.id===topicId);
  const sheet = buildSheet(topic,decodeCode(code,TOPICS).opts);
  const item = sheet.sections[0].items[question-1];
  const check = (answers) => gradeItem(item,answers,{topicId,modeId:'short'});
  assert.deepEqual(answersOf(item),printed);
  assert.equal(check(printed).status,'correct');
  const review = check(valid);
  assert.equal(review.status,'review');
  assert.equal(review.blanks[0].status,'correct');
  for (const bad of [
    ['Banana','they','Apple'],
    ['Banana',...valid.slice(1)],
    [...valid.slice(0,2),'Apple'],
    [valid[0],'their',valid[2]],
    [valid[0],"they're",valid[2]],
  ]) assert.equal(check(bad).status,'incorrect',JSON.stringify(bad));
  assert.equal(check([...valid.slice(0,2),'']).status,'partial');
});

const blank = (a) => ({blank:true,a});
const q = (...a) => ({lines:[['question'],['— No, ',...a.flatMap((word,i)=>i?[' ',blank(word)]:[blank(word)])]]});

test('full progressive negative: compatible paired contraction and independent action', () => {
  const item = q('she',"isn't",'She','is','writing');
  const check = (answers) => gradeItem(item,answers,{topicId:'progressive',modeId:'full'}).status;
  assert.equal(check(['they',"aren't",'They','are','writing']),'review');
  assert.equal(check(["they’re",'not','They','are','writing']),'review');
  assert.equal(check(['they','are not','They','are','writing']),'incorrect');
  assert.equal(check(["they're","aren't",'They','are','writing']),'incorrect');
  assert.equal(check(['they',"aren't",'She','is','writing']),'incorrect');
  assert.equal(check(['they',"aren't",'They','is','writing']),'incorrect');
  assert.equal(check(['they',"aren't",'They','are','banana']),'incorrect');
  assert.equal(check(["she's",'not','She','is','writing']),'correct');
});

test('full past-time Be needs were, not present contraction', () => {
  const item = q('he',"wasn't",'He','was');
  const check = (answers) => gradeItem(item,answers,{topicId:'be',modeId:'full'}).status;
  assert.equal(check(['they',"weren't",'They','were']),'review');
  assert.equal(check(["they're",'not','They','were']),'incorrect');
  assert.equal(check(['they',"weren't",'They','are']),'incorrect');
});

test('full simple verifies the prompted base verb and full past retains spellings', () => {
  const simple = {...q('she',"doesn't",'She','practices'),meta:{alt:'practice'}};
  const checkSimple = (answers) => gradeItem(simple,answers,{topicId:'simple',modeId:'full'}).status;
  assert.equal(checkSimple(['they',"don't",'They','practise']),'review');
  assert.equal(checkSimple(['they',"don't",'They','practices']),'incorrect');
  assert.equal(checkSimple(['they','do not','They','practice']),'incorrect');
  const past = q('she',"didn't",'She','learned');
  const checkPast = (answers) => gradeItem(past,answers,{topicId:'past',modeId:'full'}).status;
  assert.equal(checkPast(['they',"didn't",'They','learnt']),'review');
  assert.equal(checkPast(['they',"didn't",'They','learn']),'incorrect');
});
