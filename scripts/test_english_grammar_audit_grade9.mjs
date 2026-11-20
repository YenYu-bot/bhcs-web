import assert from 'node:assert/strict';
import { test } from 'node:test';
import { answersOf, buildSheet, decodeCode, lineText } from '../assets/english-grammar/core.js';
import { gradeItem } from '../assets/english-grammar/grading.js';
import { TOPICS } from '../assets/english-grammar/topics.js';

const load = (code, auditFix = false) => {
  const { topic, opts } = decodeCode(code, TOPICS);
  const def = TOPICS.find(t => t.id === topic);
  return buildSheet(def, { ...opts, auditFix });
};
const itemOf = (code, question, auditFix = false) => load(code, auditFix).sections[0].items[question - 1];
const stem = it => it.lines.map(lineText).join(' ');

test('WTV keeps the Chinese line that disambiguates the required question word', () => {
  const code = 'WTV-1P-1-F0-10-1';
  const old = itemOf(code, 1);
  const next = itemOf(code, 1, true);
  assert.match(stem(old), /I don't know ___ ___ sit\./);
  assert.equal(old.meta.requiredZh, undefined);
  assert.equal(next.meta.requiredZh, true);
  assert.match(next.zh, /在哪裡/);
  assert.deepEqual(answersOf(next), ['where','to']);
});

test('PAD requires its semantic cue and teaches cause vs experiencer', () => {
  const code = 'PAD-1P-1-F0-10-1';
  const old = load(code);
  const next = load(code, true);
  const item = next.sections[0].items[5];
  assert.equal(old.sections[0].items[5].meta.requiredZh, undefined);
  assert.equal(item.meta.requiredZh, true);
  assert.match(item.zh, /很驚訝/);
  assert.match(next.sections[0].title, /造成某種感受用 -ing/);
  const topic = TOPICS.find(t => t.id === 'partadj');
  assert.match(topic.grammarBox(next.opts).note, /不要只看主詞是人還是事物/);
  assert.equal(itemOf('PAD-2P-2-F0-10-1', 1, true).meta.requiredZh, true);
});

test('UST second-person compound keeps its second-person reference in the revised version', () => {
  for (const [code, question, old, revised] of [
    ['UST-3P-4-F1-10-13', 3, /but they don't now/, /but you don't now/],
    ['UST-3P-1-F1-10-32', 8, /were young, they/, /were young, you/],
  ]) {
    assert.match(stem(itemOf(code, question)), old);
    assert.match(stem(itemOf(code, question, true)), revised);
  }
});

test('SNS accepts smelt only for the targeted linking sense, without changing the printed key', () => {
  const code = 'SNS-2P-2-F1-10-11';
  const judge = (auditFix, answer) => gradeItem(itemOf(code, 8, auditFix), [answer], { topicId: 'sense', modeId: 'linkverb' }).status;
  assert.deepEqual(answersOf(itemOf(code, 8, true)), ['smelled']);
  assert.equal(judge(false, 'smelt'), 'incorrect');
  assert.equal(judge(true, 'smelt'), 'correct');
  assert.equal(judge(true, 'smelled'), 'correct');
  assert.equal(judge(true, 'smell'), 'incorrect');
});

test('REL explicitly limits verb-form blanks to the simple present', () => {
  const code = 'REL-3P-4-F1-10-1';
  const old = load(code);
  const next = load(code, true);
  assert.doesNotMatch(old.sections[0].title, /現在簡單式/);
  assert.match(next.sections[0].title, /現在簡單式/);
  assert.deepEqual(next.sections[0].items, old.sections[0].items);
});
