import assert from 'node:assert/strict';
import {test} from 'node:test';
import {answersOf,buildSheet,lineText} from '../assets/english-grammar/core.js';
import {TOPICS} from '../assets/english-grammar/topics.js';
import {gradeItem} from '../assets/english-grammar/grading.js';

const sheet = (id,mode,seed,auditFix) => buildSheet(TOPICS.find(t=>t.id===id),
  {level:3,tense:'P',modes:[mode],abbr:'F',zh:false,count:10,tr:0,seed,auditFix});
const items = (...args) => sheet(...args).sections[0].items;
const text = (item) => item.lines.map(lineText).join(' / ');

test('GER keeps printed key and adds complete UK and US tuples only for new sheets',()=>{
  const legacy=items('gerund','prep',10000,false)[0], updated=items('gerund','prep',10000,true)[0];
  const context={topicId:'gerund',modeId:'prep'};
  assert.deepEqual(answersOf(legacy),['traveling']);
  assert.deepEqual(answersOf(updated),answersOf(legacy));
  assert.equal(legacy.gradingAlternatives,undefined);
  assert.deepEqual(updated.gradingAlternatives,[['traveling'],['travelling']]);
  assert.equal(gradeItem(updated,['traveling'],context).status,'correct');
  assert.equal(gradeItem(updated,['travelling'],context).status,'correct');
});

test('DTV specifies actual delivery and does not alter old case',()=>{
  const legacy=items('give','prep',10000,false)[6], updated=items('give','prep',10000,true)[6];
  assert.match(text(legacy),/brought an umbrella ___ the teacher last Sunday\.$/);
  assert.equal(text(updated),text(legacy)+'（把東西送到對方手上）');
  assert.deepEqual(answersOf(updated),['to']);
});

test('SPD supplies an English time cue for a present routine only in new worksheets',()=>{
  const legacy=items('spend','choose',10002,false)[0], updated=items('spend','choose',10002,true)[0];
  assert.equal(text(legacy),'Tony ___ three hours cleaning the house.');
  assert.equal(text(updated),'Tony ___ three hours cleaning the house every week.');
  assert.deepEqual(answersOf(updated),['spends']);
});

test('EXC removes the generic it tail for teacher without changing format or key',()=>{
  const legacy=items('exclaim','what',10004,false)[4], updated=items('exclaim','what',10004,true)[4];
  assert.match(text(legacy),/teacher it is!/);
  assert.match(text(updated),/teacher!/);
  assert.deepEqual(answersOf(updated),answersOf(legacy));
});

test('ADV explicitly practices written -ly forms for new sheets',()=>{
  const legacy=sheet('adverb','compare',10000,false).sections[0], updated=sheet('adverb','compare',10000,true).sections[0];
  assert.doesNotMatch(legacy.title,/書面/);
  assert.match(updated.title,/書面 -ly.*more \+ -ly/);
  assert.deepEqual(updated.items,legacy.items);
});
