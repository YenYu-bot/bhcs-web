// Checks the English vocabulary worksheet: the word lists are labelled and clean, and every answer is re-derived
// from the word data with rules written apart from the engine.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allBooks, findBook, poolOf, buildSheet, encodeCode, decodeCode, MODES, POS_CHOICES, COUNT_MIN, COUNT_MAX } from '../assets/english-vocab/core.js';
import { TERMS } from '../assets/english-vocab/terms.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };
const BOOKS = allBooks();
const CJK = /[一-鿿]/;

test('every list says which edition, book, term, source and update date it is', () => {
  for (const t of TERMS) {
    assert.match(t.id, /^\d{3}-[12]$/, 'term id like 115-1');
    assert.match(t.name, /^\d{3} 學年度第 [12] 學期$/);
    for (const b of t.books) {
      assert.equal(b.term, t.id, `${b.id} belongs to ${t.id}`);
      assert.ok(['康軒', '南一', '翰林'].includes(b.pub), `${b.id} publisher`);
      assert.match(b.book, /^B[1-6]$/); assert.match(b.grade, /^[七八九][上下]$/);
      assert.ok(b.source && b.source.length >= 8, `${b.id} names its source`);
      assert.match(b.updated, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(b.units.length >= 3 && b.words.length >= 100, `${b.id}: ${b.units.length} units, ${b.words.length} words`);
    }
  }
  const ids = TERMS.flatMap((t) => t.books.map((b) => `${t.id}|${b.id}`));
  assert.equal(new Set(ids).size, ids.length, 'one list per book per term');
});

test('a list older than a semester is flagged (warning only)', () => {
  const age = (d) => (Date.now() - Date.parse(d)) / 864e5;
  for (const t of TERMS) for (const b of t.books) if (age(b.updated) > 200) console.warn(`WARN ${t.name} ${b.pub} ${b.book} 字表 ${b.updated} 已超過一學期，請確認是否有新學期字表`);
});

test('word data is word, part of speech and short Chinese only: no example sentences', () => {
  for (const b of BOOKS) {
    const units = new Set(b.units.map((u) => u[0]));
    for (const [unit, en, pos, zh] of b.words) {
      assert.ok(units.has(unit), `${b.id} ${en}: unit ${unit}`);
      assert.match(en, /^[-A-Za-z(][A-Za-z .'’()\-?!,…]*$/, `${b.id} English entry: ${en}`);
      assert.ok(en.split(' ').length <= 6, `${b.id} entry is a word or phrase, not a sentence: ${en}`);
      assert.ok(CJK.test(zh), `${b.id} ${en}: Chinese meaning`);
      assert.equal(zh, zh.trim(), `${b.id} ${en}: no stray spaces`); assert.ok(!/[\u4e00-\u9fff] [\u4e00-\u9fff]|； /.test(zh), `${b.id} ${en}: spacing ${zh}`);
      assert.equal((zh.match(/（/g) || []).length, (zh.match(/）/g) || []).length, `${b.id} ${en}: brackets ${zh}`);
      assert.ok(!/例句|補充|簡寫/.test(zh), `${b.id} ${en}: handout note ${zh}`);
      assert.ok(zh.length <= 30 && !/[A-Za-z]{3,}/.test(zh), `${b.id} ${en}: Chinese has no notes or examples: ${zh}`);
      assert.ok(!/[匌嬏嬍蠲嬎匍嬾孀嬱驔匵嬋騆匊匑嬇]/.test(zh), `${b.id} ${en}: no mis-decoded characters: ${zh}`);
      if (pos) assert.match(pos, /^((n|v|adj|adv|prep|conj|pron|int|interj|aux|art|det|num|phr|abbr)\.;?)+$/, `${b.id} ${en}: part of speech ${pos}`);
    }
  }
});

// meanings across every list, for the 中翻英 one-answer rule
const OWNERS = new Map();
for (const b of BOOKS) for (const [, en, , zh] of b.words) for (const m of zh.split(/[；;]/).map((s) => s.trim()).filter(Boolean)) {
  const s = OWNERS.get(m) ?? new Set(); s.add(en.toLowerCase()); OWNERS.set(m, s);
}
const WORDS = new Set(BOOKS.flatMap((b) => b.words.map((r) => r[1].toLowerCase())));
const WORDS_BY_LEN = new Map();
for (const x of WORDS) WORDS_BY_LEN.set(x.length, [...(WORDS_BY_LEN.get(x.length) ?? []), x]);
const POSES = new Map();
for (const b of BOOKS) for (const [, en, pos] of b.words) for (const p of pos.split(';').filter(Boolean)) { const s = POSES.get(en.toLowerCase()) ?? new Set(); s.add(p); POSES.set(en.toLowerCase(), s); }

function check(book, sh) {
  // a word listed in two units (sign: 簽名 / 標誌) is asked with the entry in the first chosen unit
  const data = new Map();
  for (const [unit, en, pos, zh] of book.words) if (sh.opts.units.includes(unit) && !data.has(en)) data.set(en, { unit, pos, zh });
  const seen = new Set();
  for (const sec of sh.sections) for (const it of sec.items) {
    const w = data.get(it.en);
    assert.ok(w, `${it.en} is in ${book.id}`);
    assert.ok(sh.opts.units.includes(w.unit), `${it.en} is in a chosen unit`);
    assert.ok(!seen.has(it.en.toLowerCase()), `${it.en} once per sheet`); seen.add(it.en.toLowerCase());
    const { mode } = sec;
    if (mode === 'zh2en') {
      assert.equal(it.a, it.en);
      const m = it.q.replace(/（[a-z.]+）$/, '');
      assert.ok(w.zh.split(/[；;]/).map((s) => s.trim()).includes(m), `${it.en}: cue ${m} is one of its meanings`);
      assert.equal(OWNERS.get(m).size, 1, `${m} has one English answer`);
      assert.equal(it.hint, `${it.en[0]}${' _'.repeat(it.en.length - 1)}（${it.en.length}）`, 'first letter and length');
    }
    if (mode === 'en2zh') { assert.ok(it.q.startsWith(it.en)); assert.equal(it.a, w.zh); }
    if (mode === 'missing') {
      const shown = it.q.split(' ');
      assert.equal(shown.length, it.en.length); assert.equal(shown[0], it.en[0], 'first letter shown');
      assert.ok(shown.some((c) => c === '_'), 'at least one letter hidden');
      shown.forEach((c, i) => c === '_' || assert.equal(c, it.en[i]));
      assert.equal(it.a, it.en); assert.equal(it.hint, w.zh);
      const re = new RegExp('^' + shown.map((c) => (c === '_' ? '[a-z]' : c.toLowerCase())).join('') + '$');
      assert.deepEqual((WORDS_BY_LEN.get(it.en.length) ?? []).filter((x) => re.test(x)), [it.en.toLowerCase()], `${it.q}: only ${it.en} fits`);
      assert.ok(!['forgot', 'got', 'ate', 'saw', 'went', 'came', 'took', 'made', 'wrote', 'felt', 'left'].some((x) => x !== it.en && re.test(x)), `${it.q}: no past form fits`);
    }
    if (mode === 'pos') { assert.ok(POS_CHOICES.includes(it.a)); assert.equal(it.a, w.pos); assert.equal(POSES.get(it.en.toLowerCase()).size, 1, `${it.en} has one part of speech in every list`); }
    if (mode === 'scramble') {
      const letters = it.q.split(' / ');
      assert.deepEqual([...letters].sort(), [...it.en.toLowerCase()].sort(), `${it.q} is ${it.en} shuffled`);
      assert.notEqual(letters.join(''), it.en.toLowerCase(), 'actually shuffled');
      assert.equal(it.hint, w.zh);
    }
  }
}

test('every answer is right by its own rule, each word once, only from the chosen units', () => {
  let n = 0;
  for (const b of BOOKS) for (const seed of [1, 777, 31415]) {
    const all = b.units.map((u) => u[0]);
    for (const units of [all, all.slice(0, 2), [all.at(-1)]]) for (const modes of [MODES.map((m) => m.id), ...MODES.map((m) => [m.id])]) for (const count of [COUNT_MIN, 30, COUNT_MAX]) {
      const sh = buildSheet(b, { units, modes, count, seed });
      check(b, sh); n += sh.total;
      if (units === all && modes.length === MODES.length) assert.equal(sh.total, count, `${b.id} whole book gives ${count} questions`);
    }
  }
  assert.ok(n > 10000, `${n} questions checked`);
});

test('the same code gives the same sheet, and codes round-trip', () => {
  for (const b of BOOKS) {
    const o = { units: b.units.slice(0, 3).map((u) => u[0]), modes: ['zh2en', 'scramble'], count: 20, seed: 4242 };
    const a = buildSheet(b, o), r = decodeCode(a.code);
    assert.equal(r.book.id, b.id); assert.deepEqual(r.opts, a.opts);
    assert.deepEqual(buildSheet(r.book, r.opts).sections, a.sections);
    assert.equal(encodeCode(b, a.opts), a.code);
  }
  assert.equal(decodeCode('V-999-1-KB1-1-1-20-1'), null, 'an unknown term is refused');
});

test('the page is public, uses the engine, and is linked from the resources page and sitemap', () => {
  const html = fs.readFileSync(path.join(root, 'tools/english-vocab.html'), 'utf8');
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.bhcs\.com\.tw\/tools\/english-vocab\.html">/);
  assert.ok(html.includes("from '../assets/english-vocab/core.js'"));
  assert.ok(html.includes('不含例句'), 'the page says no example sentences are used');
  assert.ok(fs.readFileSync(path.join(root, 'ziyuan.html'), 'utf8').includes('href="tools/english-vocab.html"'));
  assert.ok(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').includes('https://www.bhcs.com.tw/tools/english-vocab.html'));
  assert.ok(findBook(TERMS[0].id, 'KB1'), 'current term has 康軒 B1');
});

console.log(`english vocab: ${tests} tests passed`);
