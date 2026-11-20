import assert from 'node:assert/strict';
import { test } from 'node:test';
import { answersOf, buildSheet, decodeCode, fullSentence } from '../assets/english-grammar/core.js';
import past from '../assets/english-grammar/topics/past.js';

const code = 'PST-3P-8-F0-20-48213';
const opts = decodeCode(code, [past]).opts;

test('R2 Past short replies print Did without changing old codes, question order, answers or translations', () => {
  const legacy = buildSheet(past, opts);
  const r1 = buildSheet(past, {...opts,auditFix:true});
  const r2 = buildSheet(past, {...opts,auditFix:true,auditR2:true});
  assert.deepEqual(r1.sections,legacy.sections);
  assert.match(legacy.sections[0].title,/填入 Did/);
  assert.match(r2.sections[0].title,/Did 已給出/);
  assert.equal(r2.total,legacy.total);
  let negative=0,positive=0;
  for(const [i,article] of r2.sections[0].items.entries()) {
    const old=legacy.sections[0].items[i];
    assert.deepEqual(answersOf(old).slice(0,1),['Did']);
    assert.equal(article.lines[0][0],'Did');
    assert.deepEqual(article.lines[0].slice(1),old.lines[0].slice(1));
    assert.deepEqual(answersOf(article),answersOf(old).slice(1));
    assert.equal(fullSentence(article),fullSentence(old));
    assert.equal(article.zh,old.zh);
    const {replyAuxPrefilled,...originalMeta}=article.meta;
    assert.equal(replyAuxPrefilled,true);
    assert.deepEqual(originalMeta,old.meta);
    if(answersOf(article).at(-1) === "didn't") negative++;
    else if(answersOf(article).at(-1) === 'did') positive++;
  }
  assert.ok(negative && positive);
});

test('R2 Past short-reply change does not alter other Past question modes', () => {
  for(const mode of past.modes.map(m=>m.id).filter(x=>x!=='short')) {
    const a=buildSheet(past,{...opts,modes:[mode]});
    const b=buildSheet(past,{...opts,modes:[mode],auditFix:true,auditR2:true});
    assert.deepEqual(b.sections,a.sections);
  }
});
