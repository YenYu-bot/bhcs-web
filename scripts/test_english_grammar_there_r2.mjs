import assert from 'node:assert/strict';
import { test } from 'node:test';
import { answersOf, buildSheet, decodeCode, lineText } from '../assets/english-grammar/core.js';
import { gradeItem } from '../assets/english-grammar/grading.js';
import { TOPICS } from '../assets/english-grammar/topics.js';

const topic = TOPICS.find(t => t.id === 'there');
const whOf = sheet => sheet.sections.find(s => s.mode === 'wh');

test('THR R2 quantity contrast fits ordinary allocation and remains self-check only', () => {
  for (const tense of ['P', 'M', 'D']) for (const level of [1, 2, 3]) {
    for (const count of [10, 20, 50]) for (const seed of [1, 17, 48213]) {
      const modes = level === 3 ? topic.defaultModes[3] : ['wh'];
      const s = buildSheet(topic, { level, tense, abbr: 'F', zh: false, count, seed, tr: 0, modes, auditR2: true });
      const wh = whOf(s);
      assert.ok(wh.items.length);
      if (wh.items.length >= 2) assert.deepEqual(new Set(wh.items.map(it => it.meta.quantity)), new Set(['count','mass']));
      for (const it of wh.items) {
        const answers = answersOf(it);
        const sentence = lineText(it.lines[0]);
        if (it.meta.quantity === 'mass') {
          assert.equal(answers[0], 'much');
          assert.match(answers[1], /^(is|was)$/);
          assert.match(sentence, /^How ___ (milk|water|bread|juice) ___ there /);
          assert.match(it.zh, /有多少(牛奶|水|麵包|果汁)/);
        } else {
          assert.equal(answers[0], 'many');
          assert.match(answers[1], /^(are|were)$/);
          assert.match(sentence, /^How ___ (cats|books|chairs|dogs|pens|eggs|students|birds|apples) ___ there /);
          assert.match(it.zh, /有幾/);
        }
        if (tense === 'P') assert.match(answers[1], /^(is|are)$/);
        if (tense === 'D') assert.match(answers[1], /^(was|were)$/);
        assert.equal(gradeItem(it, answers, { topicId: 'there', modeId: 'wh' }).status, 'review');
      }
      const { opts } = decodeCode(s.code, TOPICS);
      assert.equal(opts.auditR2, true);
      assert.deepEqual(buildSheet(topic, opts).sections, s.sections);
    }
  }
});

test('THR legacy and R1 replay retain the one-blank How many format and original content', () => {
  const base = 'THR-3M-3F-F1-20-48213';
  const legacy = buildSheet(topic, decodeCode(base, TOPICS).opts);
  const r1 = buildSheet(topic, decodeCode(base + '-R1', TOPICS).opts);
  assert.deepEqual(legacy.sections, r1.sections);
  for (const it of whOf(legacy).items) {
    assert.match(lineText(it.lines[0]), /^How many /);
    assert.equal(answersOf(it).length, 1);
    assert.equal(it.meta.quantity, undefined);
  }
});
