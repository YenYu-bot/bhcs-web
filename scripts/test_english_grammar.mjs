// Checks the English grammar worksheet engine by generating many sheets and re-deriving every answer
// with rules written independently of the engine (subject → Be form, time word → tense, subject → reply pronoun).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSheet, encodeCode, decodeCode, lineText, answersOf, COUNT_MIN, COUNT_MAX } from '../assets/english-grammar/core.js';
import { TOPICS, ALL_TOPICS } from '../assets/english-grammar/topics.js';
import { NAMES, FUNCTION_WORDS, SUBJECTS } from '../assets/english-grammar/lexicon.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };

const LIST = new Set(JSON.parse(fs.readFileSync(path.join(root, 'scripts/english-grammar/wordlist-2000.json'), 'utf8')).map((w) => w.w.toLowerCase()));
// irregular past forms back to their base (independent copy; the verb rules below use the same table)
const PAST_BACK = { fed: 'feed', wore: 'wear', brought: 'bring', met: 'meet', read: 'read', ate: 'eat', drank: 'drink', did: 'do', wrote: 'write', sang: 'sing', swam: 'swim', ran: 'run', rode: 'ride', took: 'take', went: 'go', slept: 'sleep', drew: 'draw', bought: 'buy', made: 'make', flew: 'fly', sat: 'sit', taught: 'teach', drove: 'drive', caught: 'catch', got: 'get', had: 'have', saw: 'see', came: 'come', spoke: 'speak' };
const OK_WORDS = new Set([...LIST, ...FUNCTION_WORDS, ...NAMES.m.map((n) => n.toLowerCase()), ...NAMES.f.map((n) => n.toLowerCase()), 'chen', 'lin']);
const IRREGULAR_PLURAL = { children: 'child', people: 'person', women: 'woman', men: 'man' };
function inList(word) {
  const w = word.toLowerCase();
  if (OK_WORDS.has(w)) return true;
  if (IRREGULAR_PLURAL[w] && LIST.has(IRREGULAR_PLURAL[w])) return true;
  if (w.endsWith('ies') && LIST.has(w.slice(0, -3) + 'y')) return true;
  if (w.endsWith('es') && LIST.has(w.slice(0, -2))) return true;
  if (w.endsWith('s') && LIST.has(w.slice(0, -1))) return true;
  if (PAST_BACK[w] && LIST.has(PAST_BACK[w])) return true;
  const stems = (stem) => [stem, stem + 'e', stem.replace(/(.)\1$/, '$1')];
  if (w.endsWith('ying') && LIST.has(w.slice(0, -4) + 'ie')) return true;
  if (w.endsWith('ing') && stems(w.slice(0, -3)).some((x) => LIST.has(x))) return true;
  if (w.endsWith('ied') && LIST.has(w.slice(0, -3) + 'y')) return true;
  if (w.endsWith('ed') && stems(w.slice(0, -2)).some((x) => LIST.has(x))) return true;
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
  if (MALE.has(s) || /^mr\./.test(l) || /\b(brother|(grand)?father|uncle|boy)$/.test(l)) return 'he';
  if (FEMALE.has(s) || /^ms\./.test(l) || /\b(sister|(grand)?mother|aunt|girl)$/.test(l)) return 'she';
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
    const [lead, b] = L[0];
    const subj = lead.replace(/^[A-Z][a-z]+(?: [a-z]+)*(?: [A-Z][a-z]+)?, /, '').trim();
    if (lead.includes(', ')) assert.match(lead, /^(Now|Right now|This year|Yesterday|Yesterday morning|Last night|Last Sunday|Last weekend|Two days ago|Last year|Two years ago|Ten years ago), /, `time first: ${lead}`);
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


// ---------- verb rules (independent of assets/english-grammar/verbs.js) ----------
const IRREGULAR_PAST = { feed: 'fed', wear: 'wore', bring: 'brought', meet: 'met', read: 'read', eat: 'ate', drink: 'drank', do: 'did', write: 'wrote', sing: 'sang', swim: 'swam', run: 'ran', ride: 'rode', take: 'took', go: 'went', sleep: 'slept', draw: 'drew', buy: 'bought', make: 'made', fly: 'flew', sit: 'sat', teach: 'taught', drive: 'drove', catch: 'caught', get: 'got', have: 'had', see: 'saw', come: 'came', speak: 'spoke' };
const shortCVC = (b) => /^[^aeiou]*[aeiou][^aeiouwxy]$/.test(b);
function s3(b) {
  if (b === 'have') return 'has';
  if (/(s|x|z|ch|sh|o)$/.test(b)) return b + 'es';
  if (/[^aeiou]y$/.test(b)) return b.slice(0, -1) + 'ies';
  return b + 's';
}
function ing(b) {
  if (/ie$/.test(b)) return b.slice(0, -2) + 'ying';
  if (/[^e]e$/.test(b) && b !== 'see') return b.slice(0, -1) + 'ing';
  if (shortCVC(b)) return b + b.slice(-1) + 'ing';
  return b + 'ing';
}
function pastOf(b) {
  if (IRREGULAR_PAST[b]) return IRREGULAR_PAST[b];
  if (/e$/.test(b)) return b + 'd';
  if (/[^aeiou]y$/.test(b)) return b.slice(0, -1) + 'ied';
  if (shortCVC(b)) return b + b.slice(-1) + 'ed';
  return b + 'ed';
}
const HABIT_CUES = /^(every day|every morning|every evening|every Sunday|every Saturday|after school|on weekends)$/i;
const isThirdSg = (subj) => !/^(I|you)$/i.test(subj.trim()) && !isPlural(subj) && !/^you and /i.test(subj);
const replyAux = (r) => (['he', 'she', 'it'].includes(r) ? 'does' : 'do');
const cap1 = (w) => w.charAt(0).toUpperCase() + w.slice(1);
const ans = (item) => answersOf(item);
const usesTime = (text, cue) => assert.ok(cue === null || text.includes(cue) || text.startsWith(cue.charAt(0).toUpperCase() + cue.slice(1) + ', '), `time word "${cue}" is in: ${text}`);
const hint = (text, base) => assert.ok(text.includes(`(${base})`) || text.includes(`／${base})`), `hint (${base}) shown: ${text}`);
const abbrOk = (o, abbr, text) => {
  if (o.abbr === 'C') assert.ok(abbr, `contraction sheet: ${text}`);
  if (o.abbr === 'F') assert.ok(!abbr, `no-contraction sheet: ${text}`);
  if (o.abbr === 'B') assert.ok(text.includes(abbr ? '（縮寫）' : '（不縮寫）'), `both: marked: ${text}`);
};
const PASTPROG = /\b(at (eight|nine) last night|at this time yesterday|at seven yesterday morning)\b/i;

function checkSimple(it, mode, o) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  usesTime(text, m.cue); assert.match(m.cue, HABIT_CUES, `habit time word: ${m.cue}`);
  const third = isThirdSg(m.subj), aux = third ? 'does' : 'do';
  if (mode === 'fill') { hint(text, m.base); assert.deepEqual(a, [third ? s3(m.base) : m.base]); }
  if (mode === 'neg') { const ab = a.length === 2; abbrOk(o, ab, text); assert.deepEqual(a, ab ? [aux === 'does' ? "doesn't" : "don't", m.base] : [aux, 'not', m.base]); }
  if (mode === 'q') assert.deepEqual(a, [cap1(aux), m.base]);
  if (mode === 'short') { const r = expectedReply(m.subj), yes = text.includes('— Yes'); assert.deepEqual(a, [cap1(aux), r, yes ? replyAux(r) : replyAux(r) === 'does' ? "doesn't" : "don't"]); }
  if (mode === 'full') { const r = expectedReply(m.subj); hint(text, m.alt); assert.deepEqual(a, [r, replyAux(r) === 'does' ? "doesn't" : "don't", cap1(r), replyAux(r) === 'does' ? s3(m.alt) : m.alt]); }
  if (mode === 'wh') assert.deepEqual(a, [aux]);
}
function checkProgressive(it, mode, o) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  usesTime(text, m.cue);
  const habit = HABIT_CUES.test(m.cue), past = PASTPROG.test(m.cue);
  assert.ok(habit || past || /^(now|right now|at the moment)$/i.test(m.cue), `progressive time word: ${m.cue}`);
  if (o.tense === 'P') assert.ok(!past, 'present-only sheet'); if (o.tense === 'D') assert.ok(past, 'past-only sheet');
  const be = expectedBe(m.subj, past);
  if (habit) assert.ok(mode === 'fill' && o.level >= 3 && o.tense !== 'D', 'present simple only mixes into advanced fill');
  if (mode === 'fill') {
    hint(text, m.base);
    if (o.level >= 3) assert.deepEqual(a, [habit ? (isThirdSg(m.subj) ? s3(m.base) : m.base) : `${be} ${ing(m.base)}`]);
    else assert.deepEqual(a, [be, ing(m.base)]);
  }
  if (mode === 'neg') { const ab = a.length === 1; abbrOk(o, ab, text); assert.deepEqual(a, ab ? [NEG[be]] : [be, 'not']); assert.ok(text.includes(ing(m.base)), 'keeps the -ing word'); }
  if (mode === 'q') assert.deepEqual(a, [cap1(be)]);
  if (mode === 'short') { const r = expectedReply(m.subj), rb = expectedBe(r, past), yes = text.includes('— Yes'); assert.deepEqual(a, [cap1(be), r, yes ? rb : NEG[rb]]); }
  if (mode === 'full') { const r = expectedReply(m.subj), rb = expectedBe(r, past); hint(text, m.alt); assert.deepEqual(a, [r, NEG[rb], cap1(r), rb, ing(m.alt)]); }
  if (mode === 'wh') assert.deepEqual(a, [be, 'doing']);
}
const thereBe = (np, past) => {
  const pl = !/^(a|an) /.test(np) && (/s$/.test(np) || /\bpeople$/.test(np)) && !/^(some|a lot of) (milk|water|bread|juice)$/.test(np);
  return past ? (pl ? 'were' : 'was') : pl ? 'are' : 'is';
};
function checkThere(it, mode, o) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  const past = PAST_CUES.test(text);
  if (o.tense === 'M') assert.ok(m.cue, `mixed sheets give a time word: ${text}`);
  if (o.tense === 'D') assert.ok(past, 'past-only'); if (o.tense === 'P') assert.ok(!past, 'present-only');
  usesTime(text, m.cue);
  const be = thereBe(m.noun, past);
  if (/^some /.test(m.noun) && mode !== 'fill' && mode !== 'full') assert.ok(text.includes(m.noun.replace(/^some /, 'any ')), `some → any: ${text}`);
  if (mode === 'fill') { assert.equal(text.includes('(be)'), o.level < 3); assert.deepEqual(a, [be]); }
  if (mode === 'neg') { const ab = a.length === 1; abbrOk(o, ab, text); assert.deepEqual(a, ab ? [NEG[be]] : [be, 'not']); assert.ok(!/^(two|three|five) /.test(m.noun), 'no numbered nouns in negatives'); }
  if (mode === 'q') assert.deepEqual(a, [cap1(be)]);
  if (mode === 'short') { const yes = text.includes('— Yes'); assert.deepEqual(a, [cap1(be), 'there', yes ? be : NEG[be]]); }
  if (mode === 'full') assert.deepEqual(a, ['there', NEG[be], 'There', thereBe(m.second, past)]);
  if (mode === 'wh') assert.deepEqual(a, [be]);
}
function checkCan(it, mode, o) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  usesTime(text, m.cue);
  const past = m.cue ? /\b(ago|last year)$/.test(m.cue) : false;
  assert.equal(past, m.past, `tense follows the time word: ${text}`);
  if (o.tense === 'M') assert.ok(m.cue, 'mixed sheets give a time word');
  if (o.tense === 'P') assert.ok(!past); if (o.tense === 'D') assert.ok(past);
  const md = past ? 'could' : 'can', neg = (ab) => (ab ? [past ? "couldn't" : "can't"] : past ? ['could', 'not'] : ['cannot']);
  if (mode === 'fill') {
    hint(text, m.base);
    assert.ok(text.includes(m.neg ? '(不會／' : '(會／'), 'Chinese cue says 會 or 不會');
    if (m.neg) { const ab = a.length === 2 && a[0].includes("'"); abbrOk(o, ab, text); assert.deepEqual(a, [...neg(ab), m.base]); }
    else assert.deepEqual(a, [md, m.base]);
  }
  if (mode === 'neg') { const ab = a[0].includes("'"); abbrOk(o, ab, text); assert.deepEqual(a, neg(ab)); }
  if (mode === 'q') assert.deepEqual(a, [cap1(md)]);
  if (mode === 'short') { const r = expectedReply(m.subj), yes = text.includes('— Yes'); assert.deepEqual(a, [cap1(md), r, yes ? md : neg(true)[0]]); }
  if (mode === 'full') { const r = expectedReply(m.subj); hint(text, m.alt); assert.deepEqual(a, [r, neg(true)[0], cap1(r), md, m.alt]); }
}
function checkPast(it, mode, o) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  usesTime(text, m.cue);
  const habit = HABIT_CUES.test(m.cue);
  if (!habit) assert.match(m.cue, PAST_CUES, `past time word: ${m.cue}`);
  if (habit) assert.ok(mode === 'fill' && o.level >= 3, 'present simple only mixes into advanced fill');
  if (mode === 'fill') { hint(text, m.base); assert.deepEqual(a, [habit ? (isThirdSg(m.subj) ? s3(m.base) : m.base) : pastOf(m.base)]); }
  if (mode === 'neg') { const ab = a.length === 2; abbrOk(o, ab, text); assert.deepEqual(a, ab ? ["didn't", m.base] : ['did', 'not', m.base]); }
  if (mode === 'q') assert.deepEqual(a, ['Did', m.base]);
  if (mode === 'short') { const r = expectedReply(m.subj), yes = text.includes('— Yes'); assert.deepEqual(a, ['Did', r, yes ? 'did' : "didn't"]); }
  if (mode === 'full') { const r = expectedReply(m.subj); hint(text, m.alt); assert.deepEqual(a, [r, "didn't", cap1(r), pastOf(m.alt)]); }
  if (mode === 'wh') { hint(text, m.base); assert.deepEqual(a, ['did', pastOf(m.base)]); }
}
const CHECKERS = { be: (it, mode, o) => checkBe(it, mode, o), simple: checkSimple, progressive: checkProgressive, there: checkThere, can: checkCan, past: checkPast };

// ---------- sheets to check ----------
function* settings() {
  for (const t of ALL_TOPICS) {
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
    for (const sec of sh.sections) for (const it of sec.items) CHECKERS[t.id](it, sec.mode, sh.opts);
  }
});

test('every blank holds one word, and every English word is in the 2000-word list, a function word or a name', () => {
  const missing = new Map();
  for (const { t, o } of settings()) {
    if (o.count !== COUNT_MAX) continue;
    for (const it of buildSheet(t, o).sections.flatMap((s) => s.items)) {
      for (const p of it.lines.flat().filter((x) => typeof x !== 'string')) assert.match(p.a, p.wide ? /^[A-Za-z' ]+$/ : /^[A-Za-z']+$/, `one word per blank: "${p.a}"`);
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

test('sheets spread over the word bank: varied subjects, verbs and time words, some sentences start with the time', () => {
  for (const t of ALL_TOPICS) for (const level of [1, 2, 3]) {
    let subjects = 0, worstSubject = 0, worstVerb = 0, times = 0, front = 0;
    const N = 30;
    for (let seed = 1; seed <= N; seed++) {
      const sh = buildSheet(t, { level, tense: t.past ? 'M' : 'P', modes: t.defaultModes[level], abbr: 'F', zh: false, count: 20, seed });
      const items = sh.sections.flatMap((sec) => sec.items);
      const text = items.map((it) => it.lines.map(lineText).join(' '));
      const subj = items.map((it, i) => it.meta?.subj ?? it.meta?.noun ?? text[i].replace(/^[A-Z][a-z]+(?: [a-z]+)*, /, '').split(' ___')[0]);
      const verb = items.map((it) => it.meta?.base).filter(Boolean);
      const cue = items.map((it, i) => it.meta?.cue ?? (text[i].match(/\b(now|right now|this year|yesterday morning|yesterday|last night|last Sunday|last weekend|two days ago|last year|two years ago|ten years ago)\b/i) || ['-'])[0].toLowerCase());
      const most = (a) => (a.length ? Math.max(...Object.values(a.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {}))) : 0);
      subjects += new Set(subj).size; worstSubject = Math.max(worstSubject, most(subj)); worstVerb = Math.max(worstVerb, most(verb));
      times += new Set(cue).size; front += text.filter((x) => /^[A-Z][a-z]+(?: [a-z]+)*, /.test(x)).length;
    }
    const where = `${t.id} level ${level}`;
    assert.ok(subjects / N >= 15, `${where}: about 15+ different subjects in 20 questions (got ${(subjects / N).toFixed(1)})`);
    assert.ok(worstSubject <= 4, `${where}: no subject more than 4 times on one sheet (got ${worstSubject})`);
    assert.ok(worstVerb <= 4, `${where}: no verb more than 4 times on one sheet (got ${worstVerb})`);
    assert.ok(times / N >= 4, `${where}: at least 4 different time words per sheet (got ${(times / N).toFixed(1)})`);
    assert.ok(front > 0, `${where}: some sentences put the time word first`);
  }
});

test('the same sheet code always gives the same sheet, and the code round-trips', () => {
  for (const t of ALL_TOPICS) {
    const o = { level: 2, tense: t.past ? 'M' : 'P', modes: t.modes.map((m) => m.id), abbr: 'B', zh: true, count: 30, seed: 4242 };
    const a = buildSheet(t, o), b = buildSheet(t, o);
    assert.deepEqual(a, b, 'deterministic');
    const back = decodeCode(a.code, ALL_TOPICS);
    assert.equal(back.topic, t.id);
    assert.deepEqual(back.opts, a.opts, 'decode(encode(x)) = x');
    assert.deepEqual(buildSheet(t, back.opts), a, 'rebuilt from the code');
    assert.equal(encodeCode(t, back.opts), a.code);
    assert.equal(decodeCode(a.code.toLowerCase(), ALL_TOPICS).topic, t.id, 'case does not matter');
  }
  for (const bad of ['', 'BE-2M', 'XX-2M-3F-B1-20-1', 'BE-4M-3F-B1-20-1', 'BE-2M-0-B1-20-1', 'BE-2M-3F-B1-60-1', 'BE-2M-3F-B1-5-1']) assert.equal(decodeCode(bad, TOPICS), null, `rejects "${bad}"`);
});

test('the page is public, loads the engine as modules, and every published topic is linked from the resources page', () => {
  const html = fs.readFileSync(path.join(root, 'tools/english-grammar.html'), 'utf8');
  assert.ok(!/<meta name="robots" content="noindex">/.test(html), 'indexable once reviewed');
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.bhcs\.com\.tw\/tools\/english-grammar\.html">/);
  assert.ok(html.includes("from '../assets/english-grammar/core.js'") && html.includes("from '../assets/english-grammar/topics.js'"));
  const ziyuan = fs.readFileSync(path.join(root, 'ziyuan.html'), 'utf8');
  for (const t of TOPICS) assert.ok(ziyuan.includes(`href="tools/english-grammar.html?topic=${t.id}"`), `${t.title} is linked from the resources page`);
  assert.ok(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').includes('https://www.bhcs.com.tw/tools/english-grammar.html'), 'in the sitemap');
});

console.log(`english grammar: ${tests} tests passed`);
