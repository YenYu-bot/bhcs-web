// Checks the English grammar worksheet engine by generating many sheets and re-deriving every answer
// with rules written independently of the engine (subject → Be form, time word → tense, subject → reply pronoun).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSheet, encodeCode, decodeCode, lineText, answersOf, COUNT_MIN, COUNT_MAX } from '../assets/english-grammar/core.js';
import { TOPICS } from '../assets/english-grammar/topics.js';
import { NAMES, FUNCTION_WORDS, SUBJECTS } from '../assets/english-grammar/lexicon.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };

const LIST = new Set(JSON.parse(fs.readFileSync(path.join(root, 'scripts/english-grammar/wordlist-2000.json'), 'utf8')).map((w) => w.w.toLowerCase()));
const OK_WORDS = new Set([...LIST, ...FUNCTION_WORDS, ...NAMES.m.map((n) => n.toLowerCase()), ...NAMES.f.map((n) => n.toLowerCase()), 'chen', 'lin']);
const IRREGULAR_PLURAL = { children: 'child', people: 'person', women: 'woman', men: 'man' };
function inList(word) {
  const w = word.toLowerCase();
  if (OK_WORDS.has(w)) return true;
  if (IRREGULAR_PLURAL[w] && LIST.has(IRREGULAR_PLURAL[w])) return true;
  if (w.endsWith('ies') && LIST.has(w.slice(0, -3) + 'y')) return true;
  if (w.endsWith('es') && LIST.has(w.slice(0, -2))) return true;
  if (w.endsWith('s') && LIST.has(w.slice(0, -1))) return true;
  return false;
}

// Subject strings are only used to find where the subject ends in a sentence; the answers are still re-derived below.
const ALL_NAMES = [...NAMES.m, ...NAMES.f];
const SUBJECT_STRINGS = [...new Set([...SUBJECTS.map((x) => x.en), 'that girl', 'that boy', 'that man', 'that woman', 'those girls', 'those boys', ...ALL_NAMES, ...ALL_NAMES.flatMap((a) => ALL_NAMES.map((b) => `${a} and ${b}`))])]
  .sort((a, b) => b.length - a.length);
function subjectAt(text) {
  const t = text.replace(/^ /, '');
  const hit = SUBJECT_STRINGS.find((x) => t.toLowerCase().startsWith(x.toLowerCase() + ' ') || t.toLowerCase().startsWith(x.toLowerCase() + '?'));
  assert.ok(hit, `subject found in "${text}"`);
  return t.slice(0, hit.length);
}

// ---------- independent rules ----------
const PLURAL_WORDS = new Set(['we', 'they', 'children', 'people', 'women', 'men']);
const PAST_CUES = /\b(yesterday|last|ago)\b/i;
const PRESENT_CUES = /\b(now|this year)\b/i;
function isPlural(subj) {
  const s = subj.trim().toLowerCase();
  if (s.includes(' and ')) return true;
  const last = s.split(/\s+/).pop();
  if (PLURAL_WORDS.has(last)) return true;
  if (/^(mr|ms)\./.test(s)) return false;
  return /s$/.test(last) && !['this', 'his', 'bus', 'class'].includes(last);
}
function expectedBe(subj, past) {
  const s = subj.trim();
  if (past) return s === 'I' ? 'was' : (/^you\b/i.test(s) || isPlural(s)) ? 'were' : 'was';
  if (s === 'I') return 'am';
  return (/^you\b/i.test(s) || isPlural(s)) ? 'are' : 'is';
}
const MALE = new Set([...NAMES.m, 'he']), FEMALE = new Set([...NAMES.f, 'she']);
function expectedReply(subj) {
  const s = subj.trim(), l = s.toLowerCase();
  if (l === 'i' || l === 'we' || / and i$/.test(l)) return 'you';
  if (/^you and /.test(l)) return 'we';
  if (isPlural(s)) return 'they';
  if (MALE.has(s) || /^mr\./.test(l) || /\b(brother|father|uncle|boy)$/.test(l)) return 'he';
  if (FEMALE.has(s) || /^ms\./.test(l) || /\b(sister|mother|aunt|girl)$/.test(l)) return 'she';
  return 'it';
}
const NEG = { is: "isn't", are: "aren't", was: "wasn't", were: "weren't" };
function sheetTense(text, o) {
  const past = PAST_CUES.test(text), pres = PRESENT_CUES.test(text);
  assert.ok(!(past && pres), `one time word per question: ${text}`);
  if (o.tense === 'M') assert.ok(past || pres, `mixed sheets give every question a time word: ${text}`);
  if (o.tense === 'D') { assert.ok(past, `past-only sheets use a past time word: ${text}`); return true; }
  if (o.tense === 'P') { assert.ok(!past, `present-only sheets have no past time word: ${text}`); return false; }
  return past;
}

// ---------- per-mode checks for the Be topic ----------
function checkBe(item, mode, o) {
  const full = item.lines.map(lineText).join(' ');
  const L = item.lines;
  const strOf = (l) => l.map((p) => (typeof p === 'string' ? p : p.a)).join('');
  const past = sheetTense(full, o);
  if (mode === 'fill') {
    const [subj, b] = L[0];
    assert.equal(b.a, expectedBe(subj, past), `fill: ${strOf(L[0])}`);
    assert.equal(L[0][2].startsWith(' (be)'), o.level < 3, 'hint only below advanced');
  } else if (mode === 'neg') {
    const given = L[0][0];
    const m = /^(.+?) (am|is|are|was|were) /.exec(given);
    assert.ok(m, `neg: given sentence has a Be verb: ${given}`);
    assert.equal(m[2], expectedBe(m[1], past), `neg given: ${given}`);
    const ans = L[1].filter((p) => typeof p !== 'string').map((p) => p.a);
    const marked = full.includes('（縮寫）'), unmarked = full.includes('（不縮寫）');
    const abbr = ans.length === 1;
    if (o.abbr === 'C') assert.ok(abbr, 'contraction sheet'); if (o.abbr === 'F') assert.ok(!abbr, 'no-contraction sheet');
    if (o.abbr === 'B') assert.ok(abbr ? marked : unmarked, 'both: each item says which');
    assert.deepEqual(ans, abbr ? [NEG[m[2]]] : [m[2], 'not'], `neg answer: ${strOf(L[1])}`);
    assert.ok(!/^every /i.test(m[1]), 'no "every" in negatives');
  } else if (mode === 'q') {
    const m = /^(.+?) (am|is|are|was|were) /.exec(L[0][0]);
    assert.equal(L[1][1].a, m[2].charAt(0).toUpperCase() + m[2].slice(1), `q: ${strOf(L[1])}`);
    assert.equal(m[2], expectedBe(m[1], past));
  } else if (mode === 'short' || mode === 'full') {
    let subj, be;
    if (mode === 'short') { be = L[0][0].a; subj = subjectAt(L[0][1]); }
    else { const m = /^(Am|Is|Are|Was|Were) (.*)$/.exec(L[0][0]); be = m[1]; subj = subjectAt(m[2]); }
    assert.ok(subj, `${mode}: found the subject in ${strOf(L[0])}`);
    assert.equal(be.toLowerCase(), expectedBe(subj, past), `${mode} question: ${strOf(L[0])}`);
    const ans = (mode === 'short' ? L[0] : L[1]).filter((p) => typeof p !== 'string').map((p) => p.a).slice(mode === 'short' ? 1 : 0);
    const reply = expectedReply(subj);
    assert.equal(ans[0], reply, `${mode} reply pronoun: ${strOf(L.at(-1))}`);
    const rb = expectedBe(reply === 'you' ? 'you' : reply === 'we' ? 'we' : reply === 'they' ? 'they' : 'he', past);
    const no = full.includes('— No') || (mode === 'full');
    assert.equal(ans[1], no ? NEG[rb] : rb, `${mode} reply verb: ${strOf(L.at(-1))}`);
    if (mode === 'full') { assert.equal(ans[2], reply.charAt(0).toUpperCase() + reply.slice(1)); assert.equal(ans[3], rb); }
  } else if (mode === 'wh') {
    const m = /^(Where|What|Who) $/.exec(L[0][0]);
    assert.ok(m, `wh: ${strOf(L[0])}`);
    const subj = subjectAt(L[0][2]);
    assert.equal(L[0][1].a, expectedBe(subj, past), `wh: ${strOf(L[0])}`);
  }
}

// ---------- sheets to check ----------
function* settings() {
  for (const t of TOPICS) {
    const modeSets = [...t.modes.map((m) => [m.id]), t.modes.map((m) => m.id)];
    for (const level of [1, 2, 3]) for (const tense of t.past ? ['P', 'M', 'D'] : ['P']) for (const abbr of ['F', 'C', 'B'])
      for (const modes of modeSets) for (const count of [COUNT_MIN, 20, COUNT_MAX]) for (const seed of [10001, 54321, 99999])
        yield { t, o: { level, tense, modes, abbr, zh: true, count, seed } };
  }
}

test('every sheet has the asked number of questions, all different, in the chosen modes', () => {
  let n = 0;
  for (const { t, o } of settings()) {
    const sh = buildSheet(t, o);
    const items = sh.sections.flatMap((s) => s.items);
    assert.equal(items.length, o.count, `${sh.code}: ${o.count} questions`);
    assert.deepEqual(sh.sections.map((s) => s.mode), t.modes.map((m) => m.id).filter((id) => o.modes.includes(id)), 'sections follow the mode order');
    const keys = items.map((it) => it.lines.map(lineText).join(' | ').toLowerCase());
    assert.equal(new Set(keys).size, keys.length, `${sh.code}: no repeated question`);
    n++;
  }
  assert.ok(n > 1000, `checked ${n} sheets`);
});

test('every answer is right by the independent rules (Be form, tense from the time word, reply pronoun, contraction)', () => {
  for (const { t, o } of settings()) {
    if (o.count !== COUNT_MAX) continue;
    const sh = buildSheet(t, o);
    for (const sec of sh.sections) for (const it of sec.items) checkBe(it, sec.mode, sh.opts);
  }
});

test('every blank holds one word, and every English word is in the 2000-word list, a function word or a name', () => {
  const missing = new Map();
  for (const { t, o } of settings()) {
    if (o.count !== COUNT_MAX) continue;
    for (const it of buildSheet(t, o).sections.flatMap((s) => s.items)) {
      for (const a of answersOf(it)) assert.match(a, /^[A-Za-z']+$/, `one word per blank: "${a}"`);
      const text = it.lines.map((l) => l.map((p) => (typeof p === 'string' ? p : p.a)).join('')).join(' ');
      for (const w of text.match(/[A-Za-z][A-Za-z']*/g)) if (!inList(w)) missing.set(w, text);
    }
  }
  assert.deepEqual([...missing.keys()], [], `words outside the list: ${[...missing].map(([w, s]) => `${w} (${s})`).join('; ')}`);
});

test('every question has a Chinese line with no leftovers', () => {
  for (const { t, o } of settings()) {
    if (o.count !== 20) continue;
    for (const it of buildSheet(t, o).sections.flatMap((s) => s.items)) {
      assert.match(it.zh, /[一-鿿]/, 'has Chinese');
      assert.ok(!/undefined|null|NaN/.test(it.zh), `clean Chinese: ${it.zh}`);
      assert.match(it.zh, /[。？]$/, 'ends with punctuation');
    }
  }
});

test('the same sheet code always gives the same sheet, and the code round-trips', () => {
  for (const t of TOPICS) {
    const o = { level: 2, tense: t.past ? 'M' : 'P', modes: t.modes.map((m) => m.id), abbr: 'B', zh: true, count: 30, seed: 4242 };
    const a = buildSheet(t, o), b = buildSheet(t, o);
    assert.deepEqual(a, b, 'deterministic');
    const back = decodeCode(a.code, TOPICS);
    assert.equal(back.topic, t.id);
    assert.deepEqual(back.opts, a.opts, 'decode(encode(x)) = x');
    assert.deepEqual(buildSheet(t, back.opts), a, 'rebuilt from the code');
    assert.equal(encodeCode(t, back.opts), a.code);
    assert.equal(decodeCode(a.code.toLowerCase(), TOPICS).topic, t.id, 'case does not matter');
  }
  for (const bad of ['', 'BE-2M', 'XX-2M-3F-B1-20-1', 'BE-4M-3F-B1-20-1', 'BE-2M-0-B1-20-1', 'BE-2M-3F-B1-60-1', 'BE-2M-3F-B1-5-1']) assert.equal(decodeCode(bad, TOPICS), null, `rejects "${bad}"`);
});

test('the page is unlisted until reviewed and loads the engine as modules', () => {
  const html = fs.readFileSync(path.join(root, 'tools/english-grammar.html'), 'utf8');
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.bhcs\.com\.tw\/tools\/english-grammar\.html">/);
  assert.ok(html.includes("from '../assets/english-grammar/core.js'") && html.includes("from '../assets/english-grammar/topics.js'"));
  assert.ok(!fs.readFileSync(path.join(root, 'ziyuan.html'), 'utf8').includes('english-grammar'), 'not linked from the resources page yet');
  assert.ok(!fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').includes('english-grammar'), 'not in the sitemap');
});

console.log(`english grammar: ${tests} tests passed`);
