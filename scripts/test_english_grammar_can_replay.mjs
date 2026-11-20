import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {decodeCode,decodeMixCode,buildSheet,buildMixSheet,answersOf,fullSentence} from '../assets/english-grammar/core.js';
import {TOPICS} from '../assets/english-grammar/topics.js';

const lookup = (id) => TOPICS.find((topic) => topic.id === id);
function restore(code) {
  const mix = code.startsWith('MIX-');
  const parsed = (mix ? decodeMixCode : decodeCode)(code, TOPICS);
  assert.ok(parsed);
  const sheet = mix ? buildMixSheet(parsed.topics.map(lookup), parsed.opts) : buildSheet(lookup(parsed.topic), parsed.opts);
  assert.equal(sheet.code, code);
  return sheet;
}

test('unversioned single and mixed worksheets are unchanged from published #266', () => {
  const exactPublished = {
    'CAN-2P-F-F0-20-99542':'ef401e35867711b890fccfd5a8bd20f0f50c90221b1cb2c62f010fb639ba91a9',
    'CAN-2P-F-F0-20-99542-T5':'a5ee6ba4fff5d7c81d458fddfb8b627a235f557a7793a99bf50ee8028d450d63',
    'CAN-2P-F-F0-20-99542-TO':'34a197264eabdf95ad4cc3811730736f352311615ce1b4326a0818694d2787b6',
    'CAN-2D-B-F0-20-99542':'eb1a09ce7d4e4e0388ab6df09abad5281b2b29616d0967d733d3da5ab1b23791',
    'CAN-2P-1-C0-10-99542':'754372b914d051d648a84b27d5be080ac3e6d8b264f4c90c453ac651b5d5f524',
    'MIX-2P-BE.CAN-F0-40-99542':'e5e336faa6d14a540f31b33b3f8249dff77a1ec0256c128501b26cf3ef07635f',
    'MIX-2P-BE.CAN-F0-40-99542-T5':'d4923573ff973a203cee023702fcb23e094ac0a1adafc94b3998725f7c833aec',
    'MIX-2P-BE.CAN-F0-40-99542-TO':'91c70622d3be57805b0226875c6999f7179660bd789582ff5c74d234cb283e2f',
  };
  for (const [code, hash] of Object.entries(exactPublished)) {
    assert.equal(createHash('sha256').update(JSON.stringify(restore(code))).digest('hex'), hash, code);
  }
});

test('new CAN layout round-trips on single/mixed sheets while whole English stays canonical', () => {
  for (const base of ['CAN-2P-F-F0-20-99542','MIX-2P-CAN.BE-F0-20-1']) {
    for (const suffix of ['', '-T5', '-TO']) {
      const old = restore(base + suffix), fresh = restore(base + suffix + '-C2');
      assert.deepEqual(fresh.translation, old.translation);
      assert.deepEqual(fresh, restore(fresh.code));
      assert.deepEqual(fresh.sections.flatMap(s=>s.items.map(fullSentence)),old.sections.flatMap(s=>s.items.map(fullSentence)));
      if (suffix === '-TO') continue;
      const first = fresh.sections[0].items[0];
      assert.ok(first.meta.splitCan);
      assert.deepEqual(answersOf(first),['can','not']);
      assert.match(fullSentence(first), /cannot/);
    }
  }
  assert.equal(decodeCode('BE-2P-F-F0-20-99542-C2', TOPICS),null);
  assert.equal(decodeCode('CAN-2P-1-C0-10-99542-C2', TOPICS),null);
  assert.equal(decodeCode('CAN-2D-1-F0-10-99542-C2', TOPICS),null);
  assert.equal(decodeMixCode('MIX-2P-BE.PST-F0-20-1-C2', TOPICS),null);
});

test('present-only short replies preprint Can in C3, while C2 and older codes keep their blanks', () => {
  for (const base of ['CAN-2P-F-F0-20-99542', 'MIX-2P-BE.CAN-F0-40-99542']) {
    const c2 = restore(base+'-C2'), c3 = restore(base+'-C3');
    assert.deepEqual(c3, restore(c3.code));
    const isCanShort = s => s.mode === 'short' && (!s.topic || s.topic === 'can');
    const old = c2.sections.find(isCanShort), newer = c3.sections.find(isCanShort);
    assert.ok(old?.items.length && newer?.items.length);
    assert.match(newer.title, /第一格填主詞，第二格填助動詞/);
    for (let i=0; i<old.items.length;i++) {
      const a=old.items[i], b=newer.items[i];
      assert.equal(answersOf(a)[0], 'Can');
      assert.deepEqual(answersOf(b), answersOf(a).slice(1));
      assert.equal(b.lines[0][0], 'Can');
      assert.deepEqual(b.lines[0].slice(1), a.lines[0].slice(1));
      assert.equal(fullSentence(b), fullSentence(a));
    }
    assert.deepEqual(c3.sections.filter(s=>!isCanShort(s)).map(s=>s.items),
                     c2.sections.filter(s=>!isCanShort(s)).map(s=>s.items));
  }
  assert.equal(restore('CAN-2P-8-C0-10-99542-C3').sections[0].items[0].lines[0][0], 'Can');
  for(const [tense,valid] of [['M',new Set(['Can','Could'])],['D',new Set(['Could'])]]) {
    const code = 'CAN-2'+tense+'-8-F0-20-99542';
    assert.equal(decodeCode(code+'-C3', TOPICS), null);
    for (const item of restore(code).sections[0].items) {
      assert.ok(item.lines[0][0].blank && valid.has(answersOf(item)[0]));
    }
  }
});
