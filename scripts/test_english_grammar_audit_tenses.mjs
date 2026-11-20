import assert from 'node:assert/strict';
import { test } from 'node:test';
import { answersOf, buildSheet, fullSentence, lineText } from '../assets/english-grammar/core.js';
import future from '../assets/english-grammar/topics/future.js';
import perfect from '../assets/english-grammar/topics/perfect.js';

const opt = { level:3, tense:'P', abbr:'F', zh:false, seed:48213, count:20, tr:0 };
const items = (t, mode, opts) => buildSheet(t, {...opt,...opts,modes:[mode]}).sections[0].items;

test('negative I am going to meets the requested contraction without changing old keys', () => {
  for(const abbr of ['C','B','F']) {
    let seen = false;
    for(const seed of [1,2,3,4,5,6,7,8,9,10,12,25,48213,99542]) {
      const legacy = items(future,'neg',{abbr,seed});
      const revised = items(future,'neg',{abbr,seed,auditFix:true});
      assert.deepEqual(revised.map((q)=>q.lines[0]),legacy.map((q)=>q.lines[0]));
      for(const [i,q] of revised.entries()) {
        if(!/^I am going to /.test(q.lines[0][0])) continue;
        const words = answersOf(q);
        if(words[0] === "I'm") {
          seen = true;
          assert.notEqual(abbr, 'F');
          assert.deepEqual(words.slice(0,4),["I'm",'not','going','to']);
          assert.match(fullSentence(q),/^I'm not going to /);
          assert.equal(q.meta.abbr,true);
          assert.equal(answersOf(legacy[i])[0],'am');
          if(abbr === 'B') assert.match(q.lines[1].at(-1),/（縮寫）$/);
        } else if(abbr === 'C') {
          assert.fail('Contraction-required item kept am in the revised worksheet');
        } else if(abbr === 'F') {
          assert.equal(words[0],'am');
          assert.match(fullSentence(q),/^I am not going to /);
        }
      }
    }
    if(abbr !== 'F') assert.ok(seen,abbr);
  }
});

test('experience practice writes both forms and signals the required Mandarin cue', () => {
  const legacy = items(perfect,'never',{});
  assert.ok(legacy.every(q=>answersOf(q)[1] === 'never'));
  const revised = items(perfect,'never',{auditFix:true});
  const seen = new Set();
  for(const q of revised) {
    const [aux,adverb] = answersOf(q);
    seen.add(adverb);
    assert.equal(q.meta.requiredZh,true);
    assert.equal(q.meta.cue,adverb);
    if(adverb === 'ever') {
      assert.match(aux,/^(Have|Has)$/);
      assert.match(lineText(q.lines[0]),/\?$/);
      assert.match(q.zh,/曾經.+嗎？$/);
    } else {
      assert.match(aux,/^(have|has)$/);
      assert.match(q.zh,/從來沒有/);
    }
  }
  assert.deepEqual([...seen].sort(),['ever','never']);
});

test('mixed tense practice distinguishes continued and completed durations without a trigger-word rule', () => {
  const oldSheet = buildSheet(perfect,{...opt,modes:['mix']});
  assert.match(oldSheet.sections[0].title,/for \/ since 用現在完成式/);
  assert(!oldSheet.sections[0].items.some(q=>q.meta.cue==='finished duration'));
  const sheet = buildSheet(perfect,{...opt,auditFix:true,count:40,modes:['mix']});
  assert.match(sheet.sections[0].title,/for 只表示持續多久/);
  const active = sheet.sections[0].items.filter(q=>q.meta.perfect && /^for /.test(q.meta.cue));
  const done = sheet.sections[0].items.filter(q=>q.meta.cue==='finished duration');
  assert.ok(active.length > 0 && done.length > 0);
  for(const q of active) {
    assert.match(lineText(q.lines[0]),/for .+\. That is still the case\.$/);
    assert.match(answersOf(q)[0],/^(have|has) /);
  }
  for(const q of done) {
    assert.match(lineText(q.lines[0]),/for .+(Then |last |yesterday)/);
    assert.doesNotMatch(answersOf(q)[0],/^(have|has) /);
  }
});
