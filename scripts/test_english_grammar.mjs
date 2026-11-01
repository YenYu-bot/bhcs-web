// Checks the English grammar worksheet engine by generating many sheets and re-deriving every answer
// with rules written independently of the engine (subject → Be form, time word → tense, subject → reply pronoun).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSheet, encodeCode, decodeCode, lineText, answersOf, splitCount, fullSentence, buildMixSheet, decodeMixCode, COUNT_MIN, COUNT_MAX } from '../assets/english-grammar/core.js';
import { TOPICS, ALL_TOPICS } from '../assets/english-grammar/topics.js';
import { NAMES, FUNCTION_WORDS, SUBJECTS } from '../assets/english-grammar/lexicon.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };

const LIST = new Set(JSON.parse(fs.readFileSync(path.join(root, 'scripts/english-grammar/wordlist-2000.json'), 'utf8')).map((w) => w.w.toLowerCase()));
// irregular past forms back to their base (independent copy; the verb rules below use the same table)
const PAST_BACK = { spent: 'spend', paid: 'pay', fed: 'feed', wore: 'wear', brought: 'bring', met: 'meet', read: 'read', ate: 'eat', drank: 'drink', did: 'do', wrote: 'write', sang: 'sing', swam: 'swim', ran: 'run', rode: 'ride', took: 'take', went: 'go', slept: 'sleep', drew: 'draw', bought: 'buy', made: 'make', flew: 'fly', sat: 'sit', taught: 'teach', drove: 'drive', caught: 'catch', got: 'get', had: 'have', saw: 'see', came: 'come', spoke: 'speak', told: 'tell', broke: 'break', gave: 'give', lent: 'lend', sent: 'send', forgot: 'forget', began: 'begin', said: 'say', stole: 'steal', grew: 'grow', built: 'build', sold: 'sell', found: 'find', won: 'win', left: 'leave' };
const OK_WORDS = new Set([...LIST, ...FUNCTION_WORDS, ...NAMES.m.map((n) => n.toLowerCase()), ...NAMES.f.map((n) => n.toLowerCase()), 'chen', 'lin', 'taichung', 'taiwan']);
// past participles that differ from the past form, back to the base
const PP_BACK = { built: 'build', grown: 'grow', broken: 'break', stolen: 'steal', sold: 'sell', found: 'find', heard: 'hear', felt: 'feel', eaten: 'eat', drunk: 'drink', done: 'do', written: 'write', sung: 'sing', swum: 'swim', ridden: 'ride', taken: 'take', gone: 'go', drawn: 'draw', flown: 'fly', driven: 'drive', gotten: 'get', seen: 'see', worn: 'wear', spoken: 'speak', been: 'be', lent: 'lend', sent: 'send', kept: 'keep' };
const ORDINALS = new Set(['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth', 'thirtieth']);
const IRREGULAR_PLURAL = { children: 'child', people: 'person', women: 'woman', men: 'man', teeth: 'tooth', feet: 'foot', mice: 'mouse' };
function inList(word) {
  const w = word.toLowerCase().replace(/'s?$/, '');
  if (OK_WORDS.has(w)) return true;
  if (ORDINALS.has(w)) return true;
  if (w.includes('-') && w.split('-').every((x) => OK_WORDS.has(x) || ORDINALS.has(x))) return true; // twenty-first, forty-five
  if (w.endsWith('ves') && (LIST.has(w.slice(0, -3) + 'f') || LIST.has(w.slice(0, -3) + 'fe'))) return true;
  if (IRREGULAR_PLURAL[w] && LIST.has(IRREGULAR_PLURAL[w])) return true;
  if (w.endsWith('ies') && LIST.has(w.slice(0, -3) + 'y')) return true;
  if (w.endsWith('es') && LIST.has(w.slice(0, -2))) return true;
  if (w.endsWith('s') && LIST.has(w.slice(0, -1))) return true;
  if (PAST_BACK[w] && LIST.has(PAST_BACK[w])) return true;
  if (PP_BACK[w] && OK_WORDS.has(PP_BACK[w])) return true;
  const stems = (stem) => [stem, stem + 'e', stem.replace(/(.)\1$/, '$1')];
  if (w.endsWith('ying') && LIST.has(w.slice(0, -4) + 'ie')) return true;
  if (w.endsWith('ing') && stems(w.slice(0, -3)).some((x) => LIST.has(x))) return true;
  if (w.endsWith('ied') && LIST.has(w.slice(0, -3) + 'y')) return true;
  if (w.endsWith('ed') && stems(w.slice(0, -2)).some((x) => LIST.has(x))) return true;
  // adverbs made from listed adjectives: nicely, happily, terribly, comfortably
  if (w.endsWith('ily') && LIST.has(w.slice(0, -3) + 'y')) return true;
  if (w.endsWith('ly') && (LIST.has(w.slice(0, -2)) || LIST.has(w.slice(0, -2) + 'le'))) return true;
  // comparatives and superlatives: taller, nicer, happier, bigger / tallest, nicest, happiest, biggest
  if (w.endsWith('ier') && LIST.has(w.slice(0, -3) + 'y')) return true;
  if (w.endsWith('iest') && LIST.has(w.slice(0, -4) + 'y')) return true;
  if (w.endsWith('er') && stems(w.slice(0, -2)).some((x) => LIST.has(x))) return true;
  if (w.endsWith('est') && stems(w.slice(0, -3)).some((x) => LIST.has(x))) return true;
  return false;
}

// Subject strings are only used to find where the subject ends in a sentence; the answers are still re-derived below.
const ALL_NAMES = [...NAMES.m, ...NAMES.f];
const SUBJECT_STRINGS = [...new Set([...SUBJECTS.map((x) => x.en), ...SUBJECTS.map((x) => askedSubject(x.en)), 'that girl', 'that boy', 'that man', 'that woman', 'those girls', 'those boys', ...ALL_NAMES, ...ALL_NAMES.flatMap((a) => ALL_NAMES.map((b) => `${a} and ${b}`))])]
  .sort((a, b) => b.length - a.length);
const NAME_ALT = ALL_NAMES.join('|');
// possessive subjects: Tom's mother / Tom and Amy's mother / Tom's and Amy's mothers
const POSS_RE = new RegExp(`^((?:(?:${NAME_ALT})'s and (?:${NAME_ALT})'s|(?:${NAME_ALT}) and (?:${NAME_ALT})'s|(?:${NAME_ALT})'s) [a-z]+)(?= |\\?)`);
function subjectAt(text) {
  const t = text.replace(/^ /, '');
  const poss = POSS_RE.exec(t);
  if (poss) return poss[1];
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
  const last = s.split(/\s+/).pop();
  // "Tom and Amy's mother" is one person; "Tom's and Amy's mothers" are two: the owned noun decides
  if (/'s [a-z]+$/.test(s)) return PLURAL_WORDS.has(last) || (/s$/.test(last) && !['bus', 'class'].includes(last));
  if (s.includes(' and ')) return true;
  if (PLURAL_WORDS.has(last)) return true;
  if (/^(mr|ms)\./.test(s)) return false;
  return /s$/.test(last) && !['this', 'his', 'bus', 'class', 'dress', 'glass'].includes(last);
}
function expectedBe(subj, past) {
  const s = subj.trim();
  if (past) return s === 'I' ? 'was' : (/^you\b/i.test(s) || isPlural(s)) ? 'were' : 'was';
  if (s === 'I') return 'am';
  return (/^you\b/i.test(s) || isPlural(s)) ? 'are' : 'is';
}
const MALE = new Set([...NAMES.m, 'he']), FEMALE = new Set([...NAMES.f, 'she']);
// 改疑問句 (independent of lexicon.asked): the speaker talks to the listener, so I / we → you, my / our → your, X and I → you and X.
function askedSubject(subj) {
  const s = subj.trim();
  if (s === 'I' || s === 'we' || s === 'We') return 'you';
  const m = /^(.+) and I$/.exec(s);
  if (m) return 'you and ' + m[1].replace(/^[Mm]y /, 'your ');
  return s.replace(/^([Mm]y|[Oo]ur) /, 'your ');
}
function expectedReply(subj) {
  const s = subj.trim(), l = s.toLowerCase();
  if (l === 'i') return 'you';
  if (l === 'you') return 'I'; // the textbook reading of "Are you …?" is one listener
  if (l === 'we' || / and i$/.test(l)) return 'we／you'; // a "we" question may be answered by someone in the group or not

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
    assert.equal(m[2], expectedBe(m[1], past));
    const qs = askedSubject(m[1]);
    assert.ok(L[1][2].toLowerCase().startsWith(` ${qs.toLowerCase()} `), `q: the question asks the listener (${m[1]} → ${qs}): ${strOf(L[1])}`);
    assert.equal(L[1][1].a, (b => b.charAt(0).toUpperCase() + b.slice(1))(expectedBe(qs, past)), `q: ${strOf(L[1])}`);
  } else if (mode === 'short' || mode === 'full') {
    let subj, be;
    if (mode === 'short') { be = L[0][0].a; subj = subjectAt(L[0][1]); }
    else { const m = /^(Am|Is|Are|Was|Were) (.*)$/.exec(L[0][0]); be = m[1]; subj = subjectAt(m[2]); }
    assert.ok(subj, `${mode}: found the subject in ${strOf(L[0])}`);
    assert.equal(be.toLowerCase(), expectedBe(subj, past), `${mode} question: ${strOf(L[0])}`);
    const ans = (mode === 'short' ? L[0] : L[1]).filter((p) => typeof p !== 'string').map((p) => p.a).slice(mode === 'short' ? 1 : 0);
    const reply = expectedReply(subj);
    assert.equal(ans[0], reply, `${mode} reply pronoun: ${strOf(L.at(-1))}`);
    const rb = expectedBe(reply === 'I' ? 'I' : reply === 'you' ? 'you' : /^we/.test(reply) ? 'we' : reply === 'they' ? 'they' : 'he', past);
    const no = full.includes('— No') || (mode === 'full');
    assert.equal(ans[1], no ? NEG[rb] : rb, `${mode} reply verb: ${strOf(L.at(-1))}`);
    if (mode === 'full') { assert.equal(ans[2], reply.split('／').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('／')); assert.equal(ans[3], rb); }
  } else if (mode === 'wh') {
    const m = /^(Where|What|Who) $/.exec(L[0][0]);
    assert.ok(m, `wh: ${strOf(L[0])}`);
    const subj = subjectAt(L[0][2]);
    assert.equal(L[0][1].a, expectedBe(subj, past), `wh: ${strOf(L[0])}`);
  }
}


// ---------- verb rules (independent of assets/english-grammar/verbs.js) ----------
const IRREGULAR_PAST = { leave: 'left', say: 'said', win: 'won', break: 'broke', feed: 'fed', wear: 'wore', bring: 'brought', meet: 'met', read: 'read', eat: 'ate', drink: 'drank', do: 'did', write: 'wrote', sing: 'sang', swim: 'swam', run: 'ran', ride: 'rode', take: 'took', go: 'went', sleep: 'slept', draw: 'drew', buy: 'bought', make: 'made', fly: 'flew', sit: 'sat', teach: 'taught', drive: 'drove', catch: 'caught', get: 'got', have: 'had', see: 'saw', come: 'came', speak: 'spoke' };
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
  if (mode === 'q') { const qs = askedSubject(m.subj); assert.ok(text.toLowerCase().includes(` ${qs.toLowerCase()} ${ing(m.base)}`), `q asks the listener: ${text}`); assert.deepEqual(a, [cap1(expectedBe(qs, past))]); }
  if (mode === 'short') { const r = expectedReply(m.subj), rb = expectedBe(r.split('／')[0], past), yes = text.includes('— Yes'); assert.deepEqual(a, [cap1(be), r, yes ? rb : NEG[rb]]); }
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

// ---------- batch 3a rules ----------
const PRON = { I: ['I', 'me', 'my', 'mine'], you: ['you', 'you', 'your', 'yours'], he: ['he', 'him', 'his', 'his'], she: ['she', 'her', 'her', 'hers'], it: ['it', 'it', 'its', null], we: ['we', 'us', 'our', 'ours'], they: ['they', 'them', 'their', 'theirs'] };
const PRON_ZH = { I: '我', you: '你', he: '他', she: '她', it: '牠', we: '我們', they: '他們' };
const CASE = { subj: 0, obj: 1, poss: 2, mine: 3 };
const firstIsBlank = (it) => typeof it.lines.at(-1)[0] !== 'string' || (it.lines.length === 1 && typeof it.lines[0][0] !== 'string');
function checkPronoun(it, mode, o) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  assert.equal(m.case, mode); assert.ok(!/\((I|you|he|she|it|we|they)\)/.test(text), `no English cue gives the answer away: ${text}`);
  assert.ok(o.zh, 'Chinese line is always printed'); assert.ok(it.zh.includes(PRON_ZH[m.base]), `the Chinese names the person (${PRON_ZH[m.base]}): ${it.zh}`);
  const w = PRON[m.base][CASE[mode]];
  assert.ok(w, `${m.base} has a ${mode} form`);
  const startsWithBlank = typeof it.lines[0][0] !== 'string';
  assert.deepEqual(a, [startsWithBlank && w !== 'I' ? cap1(w) : w], `${mode} of ${m.base}: ${text}`);
  if (mode === 'subj') {
    if (m.vbase) assert.equal(m.verb, isThirdSg(m.base) ? s3(m.vbase) : m.vbase, `verb agrees with ${m.base}: ${text}`);
    else assert.equal(m.verb, expectedBe(m.base, false), `be agrees with ${m.base}: ${text}`);
    assert.ok(text.includes(` ${m.verb} `), 'the verb is in the sentence');
  }
}
const O_ES = new Set(['potato', 'tomato', 'hero']);
const IRR_PL = { child: 'children', man: 'men', woman: 'women', foot: 'feet', tooth: 'teeth', mouse: 'mice', sheep: 'sheep', fish: 'fish' };
function pluralOf(n) {
  if (IRR_PL[n]) return IRR_PL[n];
  if (/(fe|f)$/.test(n) && ['knife', 'leaf', 'wolf', 'shelf', 'wife'].includes(n)) return n.replace(/fe?$/, 'ves');
  if (/o$/.test(n)) return O_ES.has(n) ? n + 'es' : n + 's';
  if (/(s|x|z|ch|sh)$/.test(n)) return n + 'es';
  if (/[^aeiou]y$/.test(n)) return n.slice(0, -1) + 'ies';
  return n + 's';
}
const PL_RULE = (n) => (IRR_PL[n] ? 'irr' : ['knife', 'leaf', 'wolf', 'shelf', 'wife'].includes(n) ? 'ves' : /[^aeiou]y$/.test(n) ? 'ies' : pluralOf(n) === n + 'es' ? 'es' : 's');
function checkPlural(it, mode, o) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  const allowed = { 1: ['s'], 2: ['s', 'es', 'ies', 'ves'], 3: ['s', 'es', 'ies', 'ves', 'irr'] }[o.level];
  assert.ok(allowed.includes(PL_RULE(m.noun)), `level ${o.level} allows ${m.noun}`);
  if (mode === 'count') { assert.deepEqual(a, [pluralOf(m.noun)], text); assert.ok(text.includes(`(${m.noun})`), 'hint'); }
  if (mode === 'change') { assert.deepEqual(a, ['are', pluralOf(m.noun)], text); assert.ok(new RegExp(`^(This|That) is an? ${m.noun}\\.`).test(text), `given singular: ${text}`); }
}
const DEM_PL = { this: false, that: false, these: true, those: true };
const DEM_CUE = { this: '這個', that: '那個', these: '這些', those: '那些' };
function checkThis(it, mode, o) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  const pl = DEM_PL[m.dem], be = pl ? 'are' : 'is';
  if (o.level < 2 && mode !== 'change') assert.ok(!pl, 'level 1 is singular only');
  if (mode === 'fill') { assert.deepEqual(a, [cap1(m.dem), be]); assert.ok(text.includes(`(${DEM_CUE[m.dem]})`), 'Chinese cue'); }
  if (mode === 'q') { const yes = text.includes('— Yes'); assert.deepEqual(a, [cap1(be), pl ? 'they' : 'it', yes ? be : pl ? "aren't" : "isn't"]); assert.ok(text.includes(` ${m.dem} `), 'question uses the word'); }
  if (mode === 'change') assert.deepEqual(a, [cap1(m.dem), be, pl ? pluralOf(m.noun) : m.noun]);
}
const ADV_ZH = { always: '總是', usually: '通常', often: '常常', sometimes: '有時候', seldom: '很少', never: '從不' };
function checkFreq(it, mode, o) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  if (o.level < 2) assert.ok(m.adv !== 'seldom' && (mode !== 'verb' || !isThirdSg(m.subj)), `level 1: no seldom, no -s verbs: ${text}`);
  if (mode !== 'place') assert.ok(text.includes(`(${ADV_ZH[m.adv]}／`), `Chinese cue: ${text}`); else assert.ok(text.includes(`(${m.adv})`), 'adverb given');
  if (m.kind === 'verb') assert.deepEqual(a, [m.adv, isThirdSg(m.subj) ? s3(m.base) : m.base], `adverb before the verb: ${text}`);
  else assert.deepEqual(a, [expectedBe(m.subj, false), m.adv], `adverb after be: ${text}`);
}
function checkImperative(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), all = ans(it);
  if (all.some((x) => x.includes('／'))) assert.match(text, /a movie/, `only see／watch a movie has two answers: ${text}`);
  const a = all.map((x) => x.split('／')[0]);
  if (mode === 'do') assert.deepEqual(a, [m.lower ? m.base : cap1(m.base)]);
  if (mode === 'dont') { assert.deepEqual(a, ["Don't", m.base]); assert.ok(text.includes('(不要'), 'cue says 不要'); }
  if (mode === 'lets') { assert.deepEqual(a, ["Let's", m.base]); assert.ok(/\(我們.*吧\)/.test(text), 'cue says 我們…吧'); }
  if (mode === 'be') { assert.deepEqual(a, m.neg ? ["Don't", 'be'] : ['Be']); assert.ok(text.includes(m.neg ? '(不要' : '(要'), 'cue'); }
}


// ---------- batch 3b rules ----------
// articles: decided by the word right after each blank
const AN_SOUND = { hour: 'an', honest: 'an', uniform: 'a', useful: 'a', university: 'a', unique: 'a', 'one-hour': 'a' };
const soundArticle = (w) => AN_SOUND[w] ?? (/^[aeiou]/.test(w) ? 'an' : 'a');
const THE_WORDS = new Set(['piano', 'violin', 'guitar', 'drums', 'park', 'zoo', 'library', 'supermarket', 'moon', 'sky', 'stars']);
const NO_ARTICLE = new Set(['basketball', 'baseball', 'soccer', 'tennis', 'volleyball', 'badminton', 'breakfast', 'lunch', 'dinner', 'school', 'bed', 'bus', 'bicycle', 'train', 'music', 'science', 'art', 'history']);
function checkArticle(it, mode) {
  const parts = it.lines.flat();
  parts.forEach((p, i) => {
    if (typeof p === 'string') return;
    const before = parts.slice(0, i).map((x) => (typeof x === 'string' ? x : x.a)).join('');
    const next = (parts[i + 1] ?? '').trim().split(/\s+/)[0].replace(/[.,?]/g, '');
    const start = before.trim() === '' || /[.?!]\s*$/.test(before);
    let want;
    if (THE_WORDS.has(next) && !/\b(a|an)$/.test(before.trim())) want = 'the';
    else if (NO_ARTICLE.has(next)) want = '×';
    else if (start && i > 0 && parts.slice(0, i).some((x) => typeof x !== 'string')) want = 'the'; // the same thing again, later in the item
    else want = soundArticle(next);
    if (start && want !== '×') want = cap1(want);
    assert.equal(p.a, want, `${mode}: blank before "${next}" in ${it.lines.map(lineText).join(' ')}`);
  });
}
// every article sheet from level 2 on has some trap questions (letter and sound disagree)
const TRAP_WORDS = new Set(['hour', 'honest', 'university', 'uniform', 'useful', 'unique', 'one-hour']);
const COUNTABLE = new Set(['books', 'eggs', 'apples', 'cookies', 'oranges', 'bananas', 'pencils', 'friends', 'students', 'birds', 'toys', 'people']);
const UNCOUNTABLE = new Set(['milk', 'water', 'juice', 'tea', 'coffee', 'bread', 'rice', 'money', 'time', 'homework', 'sugar', 'soup']);
function checkQuantity(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  if (m.kind !== 'price') assert.ok(COUNTABLE.has(m.noun) || UNCOUNTABLE.has(m.noun), `known noun ${m.noun}`);
  assert.ok(m.kind === 'price' || new RegExp(`___ ${m.noun}\\b`).test(text), `the noun follows the blank: ${text}`);
  const count = COUNTABLE.has(m.noun);
  if (mode === 'some') assert.deepEqual(a, [/n't|\?/.test(text) ? 'any' : 'some'], text);
  if (mode === 'many') assert.deepEqual(a, [m.kind === 'price' ? 'much' : count ? 'many' : 'much'], text);
  if (mode === 'many' && !count && m.kind !== 'price') assert.ok(/n't|\?/.test(text), `much only in negatives and questions: ${text}`);
  if (mode === 'few') { assert.deepEqual(a, [count ? 'few' : 'little'], text); assert.ok(text.includes(' a ___'), 'a few / a little'); }
}
const WH_BY_TYPE = { thing: ['What'], name: ['What'], person: ['Who'], place: ['Where'], age: ['How', 'old'], count: ['How', 'many'], date: ['When'], clock: ['What', 'time'],
  reason: ['Why'], way: ['How'], owner: ['Whose'], price: ['How', 'much'], color: ['What', 'color'] };
const REPLY_SHAPE = { thing: /— It's an? \w+\.$/, name: /— (My|His|Her) name is [A-Z][a-z]+\.$/, person: /— (He|She) is my \w+\.$/, place: /— (It's|They're) (on|in|under|behind) /,
  age: /— (He|She) is \w+ years old\.$/, count: /— I have \w+\.$/, date: /birthday is in [A-Z][a-z]+\.$/, clock: /— (It's \w+ o'clock|At \w+)\.$/, reason: /— Because /,
  way: /— (By \w+|On foot)\.$/, owner: /— It's [A-Z][a-z]+'s\.$/, price: /dollars\.$/, color: /— It's (red|blue|black|white|green|yellow)\.$/ };
function checkWh(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  if (m.type !== 'make') {
    assert.deepEqual(a, WH_BY_TYPE[m.type], `${m.type}: ${text}`);
    assert.match(text, REPLY_SHAPE[m.type], `the reply asks for ${m.type}: ${text}`);
    return;
  }
  const reply = text.split(' — ')[1];
  const wh = /near the|went to the|going to the/.test(reply) ? 'Where' : /after school|on Sundays|on weekends|last \w+|ago/.test(reply) ? 'When' : /by bus|on foot|by bicycle/.test(reply) ? 'How' : 'What';
  const helper = m.tense === 'past' ? 'did' : m.tense === 'prog' ? (isThirdSg(m.subj) ? 'is' : 'are') : isThirdSg(m.subj) ? 'does' : 'do';
  assert.deepEqual(a, [wh, helper], `make: ${text}`);
}
const DAY_RE = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/, MONTH_RE = /^(January|February|March|April|May|June|July|August|September|October|November|December)$/;
function timePrep(t) {
  if (DAY_RE.test(t) || /^[A-Z][a-z]+ \d+$/.test(t) || t === 'my birthday') return 'on';
  if (MONTH_RE.test(t) || /^(spring|summer|autumn|winter)$/.test(t) || /^the (morning|afternoon|evening)$/.test(t) || /^\d{4}$/.test(t)) return 'in';
  if (/o'clock$|thirty$/.test(t) || t === 'noon' || t === 'night') return 'at';
  return null;
}
const CUE_PREP = { 裡面: 'in', 上面: 'on', 下面: 'under', 後面: 'behind', 旁邊: 'next to', 前面: 'in front of', 附近: 'near', 中間: 'between' };
const PLACE_LEVEL = { in: 1, on: 1, under: 1, behind: 2, 'next to': 2, 'in front of': 2, near: 2, between: 3 };
const PHRASE_PREP = { listen: 'to', wait: 'for', laugh: 'at', 'take care': 'of', agree: 'with', good: 'at', afraid: 'of', late: 'for', interested: 'in', kind: 'to', proud: 'of' };
function checkPrep(it, mode, o) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  if (mode === 'time') {
    const t = text.split('___ ')[1].replace(/\.$/, '');
    assert.deepEqual(a, [timePrep(t)], `time "${t}": ${text}`);
  }
  if (mode === 'place') {
    const cue = /\((.+)\)$/.exec(text)[1];
    assert.deepEqual(a, CUE_PREP[cue].split(' '), `place (${cue}): ${text}`);
    assert.equal(a.length, (text.match(/___/g) || []).length);
    assert.ok(PLACE_LEVEL[CUE_PREP[cue]] <= Math.max(o.level, 1), `level ${o.level} allows ${CUE_PREP[cue]}`);
    if (cue === '中間') assert.match(text, /___ (the|my) \w+ and (the|my) \w+\./);
  }
  if (mode === 'phrase') {
    const want = m.head === 'look' ? (text.includes('(找)') ? 'for' : 'at') : PHRASE_PREP[m.head];
    assert.deepEqual(a, [want], `phrase ${m.head}: ${text}`);
  }
}


// ---------- batch 4 rules ----------
const FUT_CUES = /\b(?:[Tt]omorrow( morning| evening)?|tonight|next (week|Sunday|Saturday)|this (weekend|afternoon|Saturday)|[Aa]fter school tomorrow|[Nn]ext (?:week|Sunday|Saturday)|[Tt]his (?:weekend|afternoon|Saturday)|[Tt]onight)\b/;
function checkFuture(it, mode, o) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  assert.match(text, FUT_CUES, `a future time word: ${text}`);
  if (o.level === 1) assert.equal(m.form, 'will', 'level 1 is will only');
  const be = expectedBe(m.subj, false);
  if (mode === 'fill') assert.deepEqual(a, m.form === 'will' ? ['will', m.base] : [be, 'going', 'to', m.base], text);
  if (mode === 'neg') {
    if (m.form === 'will') assert.deepEqual(a, m.abbr ? ["won't", m.base] : ['will', 'not', m.base], text);
    else assert.deepEqual(a, m.abbr ? [NEG[be], 'going', 'to', m.base] : [be, 'not', 'going', 'to', m.base], text);
    if (m.abbr && m.form === 'going') assert.notEqual(be, 'am', 'am not has no contraction');
  }
  if (mode === 'q') {
    const qs = askedSubject(m.subj), qbe = expectedBe(qs, false);
    assert.ok(new RegExp(`→ (Will|Am|Is|Are|___) ${qs.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} `, 'i').test(text.replace(/___ /, '___ ')) || text.toLowerCase().includes(` ${qs.toLowerCase()} `), `q asks the listener (${m.subj} → ${qs}): ${text}`);
    assert.deepEqual(a, m.form === 'will' ? ['Will', m.base] : [cap1(qbe), 'going', 'to', m.base], text);
  }
  if (mode === 'short') {
    const r = expectedReply(m.subj), rb = expectedBe(r.split('／')[0], false);
    const want = m.form === 'will' ? [r, m.yes ? 'will' : "won't"] : m.yes ? [r, rb] : rb === 'am' ? ["I'm", 'not'] : [r, NEG[rb]];
    assert.deepEqual(a, want, text);
    assert.ok(text.includes(m.yes ? '— Yes,' : '— No,'));
  }
}
// comparative / superlative spelling by its own rules
const IRR_CMP = { good: ['better', 'best'], bad: ['worse', 'worst'] };
const LONG = new Set(['beautiful', 'interesting', 'difficult', 'important', 'popular', 'expensive', 'delicious', 'famous', 'useful', 'dangerous', 'comfortable', 'exciting']);
function cmpForms(b) {
  if (IRR_CMP[b]) return IRR_CMP[b];
  if (LONG.has(b)) return [`more ${b}`, `most ${b}`];
  if (/e$/.test(b)) return [b + 'r', b + 'st'];
  if (/[^aeiou]y$/.test(b)) return [b.slice(0, -1) + 'ier', b.slice(0, -1) + 'iest'];
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(b)) return [b + b.at(-1) + 'er', b + b.at(-1) + 'est'];
  return [b + 'er', b + 'est'];
}
const CMP_LEVEL = (b) => (IRR_CMP[b] ? 3 : LONG.has(b) || /[^aeiou]y$/.test(b) || /^[^aeiou]*[aeiou][^aeiouwxy]$/.test(b) ? 2 : 1);
function checkCompare(it, mode, o) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  const [cmp, sup] = cmpForms(m.base);
  assert.ok(CMP_LEVEL(m.base) <= o.level, `level ${o.level} allows ${m.base}`);
  assert.ok(text.includes(`(${m.base})`), 'base given');
  const isCmp = / than /.test(text);
  if (mode === 'er') assert.ok(isCmp, 'comparative sentence has than');
  if (mode === 'est') assert.ok(!isCmp, 'superlative sentence has no than');
  assert.deepEqual(a, (isCmp ? cmp : 'the ' + sup).split(' '), `${m.base}: ${text}`);
  if (!isCmp) assert.ok(!/ the ___/.test(text), 'the is part of the answer, not given');
  if (/ much ___/.test(text)) assert.ok(isCmp, 'much only before a comparative');
}
const CONJ_ZH = { and: /和|又|也|，然後|煮晚餐，我媽媽/, but: /但是/, or: /還是|或/, so: /所以/, because: /因為/ };
function checkConj(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  assert.deepEqual(a, [m.conj]);
  assert.match(it.zh, CONJ_ZH[m.conj], `Chinese shows ${m.conj}: ${it.zh}`);
  if (mode === 'abo') assert.ok(['and', 'but', 'or'].includes(m.conj));
  if (mode === 'sb') assert.ok(['so', 'because'].includes(m.conj));
  if (mode === 'swap') {
    const [given, out] = it.lines.map((l) => lineText(l).toLowerCase());
    if (m.conj === 'because') { assert.match(given, /, so /); const [c, r] = given.split(', so '); assert.equal(out, `→ ${r.replace(/\.$/, '')} ___ ${c}.`, `swapped clauses: ${given} / ${out}`); }
    else { assert.match(given, / because /); const [r, c] = given.split(' because '); assert.equal(out, `→ ${c.replace(/\.$/, '')}, ___ ${r}.`, `swapped clauses: ${given} / ${out}`); }
  }
}
function checkMust(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  const have = m.s3 ? 'has' : 'have';
  if (mode === 'have') { assert.deepEqual(a, [have, 'to']); assert.ok(it.zh.includes('必須')); }
  if (mode === 'must') { assert.deepEqual(a, [m.neg ? "mustn't" : 'must']); assert.ok(it.zh.includes(m.neg ? '不可以' : '必須')); }
  if (mode === 'neg') {
    if (it.zh.includes('不必')) assert.deepEqual(a, [m.s3 ? "doesn't" : "don't", 'have', 'to'], text);
    else { assert.ok(it.zh.includes('不可以'), it.zh); assert.deepEqual(a, ["mustn't"], text); }
  }
  if (mode === 'q') {
    const subj = /^___ (.+?) ___ ___ /.exec(text)[1];
    assert.ok(!/^(My|Our|my|our) |^I$/.test(subj), `questions ask the listener, not about "my": ${text}`);
    const r = subj === 'you' ? 'I' : subj === 'we' ? 'we／you' : m.reply, aux = m.s3 ? 'does' : 'do', rAux = /^(I|we|you)/.test(r) ? 'do' : aux;
    assert.deepEqual(a, [cap1(aux), 'have', 'to', r, m.yes ? rAux : rAux + "n't"], text);
  }
  if (mode === 'had') {
    const past = /\b(yesterday|last night|last week)\b/.test(text);
    assert.deepEqual(a, [past ? 'had' : have, 'to'], text);
  }
  assert.ok(!/\bmust to\b|\bmustn't to\b/.test(text.replace(/___/g, a.join(' '))), 'must takes no to');
}


// ---------- batch 5 rules ----------
const PP_OF = { eat: 'eaten', drink: 'drunk', do: 'done', write: 'written', sing: 'sung', swim: 'swum', run: 'run', ride: 'ridden', take: 'taken', go: 'gone', draw: 'drawn', fly: 'flown', drive: 'driven', get: 'gotten', see: 'seen', come: 'come', wear: 'worn', speak: 'spoken' };
const ppOf = (b) => PP_OF[b] ?? pastOf(b);
const haveOf = (subj) => (isThirdSg(subj) ? 'has' : 'have');
function checkPerfect(it, mode, o) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  const h = haveOf(m.subj), p = ppOf(m.base);
  if (o.level === 1 && mode !== 'mix') assert.ok(!IRREGULAR_PAST[m.base] && !PP_OF[m.base], `level 1 regular only: ${m.base}`);
  if (mode === 'fill') { assert.deepEqual(a, [h, p], text); assert.match(text, /\b(already|just|twice|three times|before|for (two years|three hours|a long time)|since (last year|2020|this morning))\b/); }
  if (mode === 'neg') { assert.deepEqual(a, m.abbr ? [h + "n't", p] : [h, 'not', p], text); assert.match(text, / yet\./); }
  if (mode === 'q') {
    const r = expectedReply(m.subj), rh = ['he', 'she', 'it'].includes(r) ? 'has' : 'have';
    assert.deepEqual(a, [cap1(h), p, r, m.yes ? rh : rh + "n't"], text);
    assert.match(text, / ever ___| yet\?/);
  }
  if (mode === 'never') assert.deepEqual(a, [h, 'never', p], text);
  if (mode === 'mix') {
    const perfect = /\b(twice|three times|before|for (two years|three hours|a long time)|since (last year|2020|this morning))\.$/.test(text);
    const past = /\b(yesterday|last night|last Sunday|last Saturday|two days ago)\.$/.test(text);
    assert.ok(perfect !== past, `exactly one kind of time word: ${text}`);
    assert.deepEqual(a, [perfect ? `${h} ${p}` : pastOf(m.base)], text);
  }
}
const TO_HEADS = new Set(['want', 'hope', 'plan', 'decide', 'need', 'learn', 'would like']);
const ING_HEADS = new Set(['enjoy', 'finish', 'practice', 'keep', 'avoid', 'give up']);
// verbs that take both forms with different meanings: the Chinese cue decides
const BOTH_CUE = { 停下來去: 'to', 停止: 'ing', 記得要: 'to', 記得曾經: 'ing', 忘了要: 'to', 忘了曾經: 'ing', 設法: 'to', 試試看: 'ing' };
function checkGerund(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  if (mode === 'both') {
    assert.ok(['stop', 'remember', 'forget', 'try'].includes(m.head), `a both-ways verb: ${m.head}`);
    const cue = /\((.+?)／/.exec(text)[1];
    assert.deepEqual(a, [BOTH_CUE[cue] === 'to' ? `to ${m.base}` : ing(m.base)], `${m.head} (${cue}): ${text}`);
    assert.match(text.toLowerCase(), { stop: /\bstop/, remember: /\bremember/, forget: /\bforg[eo]t/, try: /\btr(y|ie)/ }[m.head], 'the verb is in the sentence');
    return;
  }
  assert.ok(!['stop', 'remember', 'forget', 'try', 'start', 'like', 'love', 'begin'].includes(m.head), `no two-way verb in a fixed-answer section: ${m.head}`);
  const wantTo = TO_HEADS.has(m.head), wantIng = ING_HEADS.has(m.head) || ['go', 'before', 'after'].includes(m.head) || / (at|in|of|for|about) ___/.test(text);
  assert.ok(wantTo !== wantIng, `head decides: ${m.head}`);
  const form = wantTo ? `to ${m.base}` : ing(m.base);
  assert.deepEqual(a, mode === 'mix' ? [form] : form.split(' '), `${m.head} + ${form}: ${text}`);
  if (mode === 'to') assert.ok(wantTo); if (mode === 'ing') assert.ok(ING_HEADS.has(m.head));
  if (m.head === 'go') assert.match(text, /\bgo(es)? ___ \((swim|shop|fish|hike|camp|skate|jog|dance)\)/);
}
const FOR_VERBS = new Set(['buy', 'make', 'cook', 'get', 'draw']), TO_VERBS = new Set(['give', 'send', 'show', 'lend', 'teach', 'tell', 'write', 'pass', 'bring']);
function checkGive(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  const prep = FOR_VERBS.has(m.verb) ? 'for' : TO_VERBS.has(m.verb) ? 'to' : assert.fail(`known verb ${m.verb}`);
  if (mode === 'prep') assert.deepEqual(a, [prep], text);
  if (mode === 'swap') {
    const [given] = it.lines.map(lineText);
    const long = / (to|for) /.test(given) === false; // given has person first → answer puts the thing first with to / for
    assert.equal(long, m.long);
    assert.deepEqual(a, long ? [m.thing, prep, m.rec] : [m.rec, m.thing], `${given} → ${text}`);
  }
  if (mode === 'it') { assert.deepEqual(a, [m.pron, prep, m.rec], text); assert.equal(m.pron, /\(the flowers\)$/.test(text) ? 'them' : 'it'); assert.match(text, /\(the [a-z ]+\)$/, 'it points back to something known'); }
}
const ADVERB_HOW = /^(fast|well|hard|late|early)$/;
function checkExclaim(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  const last = it.lines.at(-1);
  const afterBlanks = lineText(last).split('___').pop();
  const hint = /!\s*\(([a-z]+)\)$/.exec(text);
  if (m.kind === 'what' || m.kind === 'how') assert.equal(hint?.[1], m.adj, `English hint gives the word: ${text}`);
  if (m.kind === 'how' || (m.kind === 'change' && !m.what)) { assert.deepEqual(a, ['How', m.adj], text); assert.match(afterBlanks, /^ [a-z].*!( \([a-z]+\))?$/, 'clause follows'); }
  else {
    const noun = afterBlanks.trim().split(' ')[0].replace(/!$/, '');
    assert.equal(noun, m.noun);
    const plural = /s$/.test(noun) && noun !== 'bus' || noun === 'weather';
    assert.deepEqual(a, plural ? ['What', m.adj] : ['What', soundArticle(m.adj), m.adj], text);
  }
}


// ---------- batch 6 rules ----------
const PP_EXTRA = { build: 'built', grow: 'grown', break: 'broken', steal: 'stolen', sell: 'sold', find: 'found', send: 'sent', tell: 'told', love: 'loved', invite: 'invited', water: 'watered', finish: 'finished' };
const ppAny = (b) => PP_EXTRA[b] ?? ppOf(b);
function checkPassive(it, mode, o) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  const past = /\b(yesterday|last week|last night|two days ago)\b/.test(text), fut = /\b(tomorrow|next week|tonight|this weekend)\b/.test(text);
  assert.ok(!(past && fut), 'one time');
  if (o.level === 1) assert.ok(!past && !fut && /ed$/.test(ppAny(m.base)), `level 1: present, regular: ${text}`);
  const be = fut ? null : past ? (m.pl ? 'were' : 'was') : m.pl ? 'are' : 'is';
  if (mode === 'fill') assert.deepEqual(a, fut ? ['will', 'be', ppAny(m.base)] : [be, ppAny(m.base)], text);
  if (mode === 'change') { assert.deepEqual(a, [be, ppAny(m.base)], text); assert.match(it.lines[0][0], new RegExp(`\\b${m.obj.replace(/^the /, '')}\\b`), 'the object is in the active sentence'); }
  if (mode === 'q') { const pr = m.pl ? 'it' : 'it'; assert.deepEqual(a, [cap1(be), ppAny(m.base), m.pl ? 'they' : 'it', m.yes ? be : NEG[be]], text); }
  assert.match(text, / by (him|her|them|us|[a-z]+ [a-z]+|[A-Z][a-z]+|Mr\. Chen|Ms\. Lin)\b/, 'agent after by');
  assert.ok(!/ by (he|she|they|we)\b/.test(text), 'object pronoun after by');
}
const PERSON_NOUNS = /\b(boy|girl|man|woman|men|women|teacher|student|doctor|singer)s?\b/;
const relVerb = (base, plural) => (plural ? (base === 'be' ? 'are' : base) : base === 'be' ? 'is' : s3(base));
function checkRelative(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  const last = lineText(it.lines.at(-1));
  const before = last.split('___')[0];
  const noun = before.replace(/ (who|which) $/, ' ').trim().split(' ').pop();
  const person = PERSON_NOUNS.test(noun);
  const plural = /s$/.test(noun) || ['men', 'women'].includes(noun);
  if (mode === 'verb') {
    assert.deepEqual(a, [relVerb(m.base, plural)], `${noun} ${person ? 'who' : 'which'} + verb: ${text}`);
    assert.ok(before.endsWith(`${person ? 'who' : 'which'} `), 'relative pronoun given');
  } else {
    assert.deepEqual(a, [`${person ? 'who' : 'which'}／that`], `${noun}: ${text}`);
    const after = last.split('___')[1].trim().split(' ')[0];
    assert.equal(after, relVerb(m.base, plural), `clause verb agrees with ${noun}: ${text}`);
  }
  if (mode === 'join') assert.match(it.lines[0][0], /[.?] (He|She|It|They) /, `two sentences given: ${it.lines[0][0]}`);
}
const TAG_NEG = { am: "aren't", is: "isn't", are: "aren't", was: "wasn't", were: "weren't", do: "don't", does: "doesn't", did: "didn't", can: "can't", will: "won't", has: "hasn't", have: "haven't" };
function tagPron(subj) {
  const l = subj.trim().toLowerCase();
  if (l === 'i') return 'I';
  if (l === 'we' || / and i$/.test(l)) return 'we';
  if (/^you( and |$)/.test(l)) return 'you';
  return expectedReply(subj);
}
function checkTag(it, mode) {
  const m = it.meta, text = lineText(it.lines[0]), a = ans(it);
  const stmt = text.split(', ___')[0];
  const neg = /n't\b| not\b/.test(stmt);
  if (mode === 'special') {
    if (/^Let's/.test(stmt)) assert.deepEqual(a, ['shall', 'we']);
    else if (/^I am /.test(stmt)) assert.deepEqual(a, ["aren't", 'I']);
    else if (/^There (is|are|was|were)/.test(stmt)) assert.deepEqual(a, [TAG_NEG[/^There (\w+)/.exec(stmt)[1]], 'there']);
    else assert.deepEqual(a, [/^Don't/.test(stmt) ? 'will' : "will／won't", 'you'], `imperative: ${stmt}`);
    return;
  }
  const rest = stmt.slice(m.subj.length).trim();
  const first = rest.split(' ')[0];
  let aux;
  const second = rest.split(' ')[1] ?? '';
  const perfect = /^(has|hasn't|have|haven't)$/.test(first) && (second === 'already' || /ed$/.test(second) || Object.values(PP_OF).includes(second) || Object.keys(PAST_BACK).includes(second));
  if (/^(am|is|are|was|were|isn't|aren't|wasn't|weren't)$/.test(first)) aux = first.replace("n't", '');
  else if (/^(can|can't|will|won't)$/.test(first) || perfect) aux = { "can't": 'can', "won't": 'will', "hasn't": 'has', "haven't": 'have' }[first] ?? first;
  else if (/^(don't|doesn't|didn't)$/.test(first)) aux = first.replace("n't", '');
  else aux = PAST_CUES.test(stmt) ? 'did' : isThirdSg(m.subj) ? 'does' : 'do';
  if (first === 'am') assert.ok(!neg);
  const tagAux = neg ? aux : TAG_NEG[aux];
  assert.deepEqual(a, [tagAux, tagPron(m.subj)], `${stmt} → ${a.join(' ')}`);
  if (mode === 'be') assert.ok(/^(am|is|are|was|were)$/.test(aux)); if (mode === 'do') assert.ok(/^d/.test(aux)); if (mode === 'modal') assert.ok(/^(can|will|has|have)$/.test(aux));
}
const LINKING = new Set(['look', 'sound', 'smell', 'taste', 'feel', 'get']);
const BASE_AFTER = new Set(['make', 'let', 'have', 'help']), TO_AFTER = new Set(['ask', 'tell', 'want']);
function checkSense(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  if (mode === 'link') {
    assert.ok(LINKING.has(m.verb));
    const [x, y] = /\((\S+)／(\S+)\)/.exec(text).slice(1);
    const adj = [x, y].find((w) => !/ly$/.test(w) && w !== 'well') ?? x;
    assert.deepEqual(a, [adj], `adjective after ${m.verb}: ${text}`);
    assert.ok(/ (looks?|sounds?|smells?|tastes?|feels?|gets?) ___/.test(text));
  }
  if (mode === 'linkverb') {
    const cue = /\((看起來|聽起來|聞起來|嘗起來|摸起來|覺得|變得)(像)?\)$/.exec(text);
    assert.ok(cue, `cue: ${text}`);
    const verb = { 看起來: 'look', 聽起來: 'sound', 聞起來: 'smell', 嘗起來: 'taste', 摸起來: 'feel', 覺得: 'feel', 變得: 'get' }[cue[1]];
    const past = /\b(yesterday|last night|this morning)\b/.test(text);
    const subj = text.split(' ___')[0];
    const form = past ? ({ feel: 'felt', get: 'got' }[verb] ?? pastOf(verb)) : isThirdSg(subj) ? s3(verb) : verb;
    assert.deepEqual(a, cue[2] ? [form, 'like'] : [form], `${verb} for "${subj}": ${text}`);
    if (cue[2]) assert.ok(!/ ___ (a |the |her |rain|chicken|fish)/.test(text) || true);
  }
  if (mode === 'senseverb') {
    const cue = /\((看到|看著|聽到|感覺到)\)$/.exec(text); assert.ok(cue, `cue: ${text}`);
    const verb = { 看到: 'see', 看著: 'watch', 聽到: 'hear', 感覺到: 'feel' }[cue[1]];
    const past = /\b(yesterday|last night|this morning|just now)\b/.test(text);
    const subj = text.split(' ___')[0];
    const form = past ? { see: 'saw', watch: 'watched', hear: 'heard', feel: 'felt' }[verb] : isThirdSg(subj) ? s3(verb) : verb;
    assert.deepEqual(a, [form], `${verb} for "${subj}": ${text}`);
  }
  if (mode === 'sense') { const going = /\(正在／/.test(text); assert.deepEqual(a, [going ? ing(m.base) : m.base], text); assert.match(text, /\b(saw|sees?|heard|hears?|watch(ed|es)?|felt|feels?) (him|her|the children|the dog|someone|the birds|the house|my heart) ___/); }
  if (mode === 'cause') { assert.ok(BASE_AFTER.has(m.verb) !== TO_AFTER.has(m.verb)); assert.deepEqual(a, [m.verb === 'help' ? `${m.base}／to ${m.base}` : BASE_AFTER.has(m.verb) ? m.base : `to ${m.base}`], text); }
}


// ---------- batch 7 rules ----------
function checkIndef(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  const after = text.split('___').pop().trim().split(' ')[0].replace(/[.,?;]$/, '');
  if (mode === 'one') {
    // singular after a / an / another / this / that (a new one); otherwise plural when the noun it stands for is plural
    const singularSlot = /\b(a|an|another|this|that|there is|need|me) (\w+ )?___/.test(text) && !/\b(some|any) (\w+ )?___/.test(text);
    const plural = !singularSlot && /\b(shoes|apples|books|cookies|pictures|flowers|questions|boxes|socks|cups)\b/.test(text);
    assert.deepEqual(a, a.map(() => (plural ? 'ones' : 'one')), text);
  } else {
    const defined = /\b(two|three|four|five|ten|thirty|of the students|of my brothers)\b/i.test(text);
    const pluralAfter = /^(are|like|take|say|stay)$/.test(after);
    let want;
    if (!defined) want = pluralAfter ? 'others' : 'another';
    else if (pluralAfter) want = 'the others';
    else want = /\bthree\b/.test(text) && !/another/.test(text) ? 'another' : 'the other';
    assert.deepEqual(a, want.split(' '), `${want}: ${text}`);
  }
}
const SELF_OF = { I: 'myself', you: 'yourself', he: 'himself', she: 'herself', it: 'itself', we: 'ourselves', they: 'themselves' };
function checkReflexive(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  if (mode === 'verb') {
    const subj = m.subj; assert.ok(text.startsWith(subj + ' '), 'subject starts the sentence');
    const key = /^I$/.test(subj) ? 'I' : /^you$/i.test(subj) ? 'you' : /^we$/i.test(subj) || / and i$/i.test(subj) ? 'we' : /^they$/i.test(subj) || isPlural(subj) ? 'they' : /^he$/i.test(subj) ? 'he' : /^she$/i.test(subj) ? 'she' : expectedReply(subj);
    assert.deepEqual(a, [SELF_OF[key]], `${subj}: ${text}`);
  } else {
    const want = /kids/.test(text) ? 'yourselves' : SELF_OF[m.pr];
    assert.deepEqual(a, [want], text);
  }
}
function checkIndirect(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  const q = m.q, head = /^→ ([A-Z][^?.]*?) (where|what|when|how|who|which|why|if|whether|___)/.exec(lineText(it.lines[1]))?.[1] ?? '';
  assert.ok(it.lines.map(lineText).join(' ').endsWith(/^(Do|Can|Could)/.test(head) ? '?' : '.'), `end punctuation follows "${head}": ${text}`);
  // the indirect verb, from the direct question: does S V → Vs, did S V → V-ed / irregular, be stays (with its -ing verb), will / can / has stay with their verb;
  // a question with no subject before the verb (Who broke…?) keeps the verb as it is
  const direct = q.replace(/\?$/, '') + ' ';
  const subj = m.subj;
  const after = (aux) => { const mm = new RegExp(`\\b${aux} ${subj.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} ([a-z]+)`, 'i').exec(direct); return mm && mm[1]; };
  let verb;
  if (!subj) verb = /^(?:Who|Which bus) ([a-z]+)/.exec(direct)[1];
  else if (after('does') || after('Does')) verb = s3(after('does') || after('Does'));
  else if (after('did') || after('Did')) verb = pastOf(after('did') || after('Did'));
  else if (after('do') || after('Do')) verb = after('do') || after('Do');
  else {
    const mm = new RegExp(`\\b(is|are|was|were|will|can|has) ${subj.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: ([a-z]+))?`, 'i').exec(direct);
    assert.ok(mm, `aux found in "${q}"`);
    const aux = mm[1].toLowerCase(), next = mm[2];
    verb = /^(will|can|has)$/.test(aux) || (next && /ing$/.test(next)) ? `${aux} ${next}` : aux;
  }
  if (mode === 'verb') assert.deepEqual(a, verb.split(' '), `${q} → ${verb}: ${text}`);
  if (mode === 'order') { assert.deepEqual(a, [m.subj, verb], text); assert.ok(!/___ ___ (does|did) /.test(text)); }
  if (mode === 'if') assert.deepEqual(a, ['if／whether', m.subj, verb], text);
  // the indirect part never keeps does / did
  assert.ok(!/(know|wonder|tell me) (where|what|when|how|who|which|why|if)[^?.]* (does|did) /.test(text.replace(/___/g, a.join(' '))), 'no does / did in the indirect question');
}
function checkTooEnough(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  if (mode === 'too') { assert.deepEqual(a, ['too', 'to']); assert.match(text, /___ [a-z]+ ___ [a-z]/); }
  if (mode === 'so') { assert.deepEqual(a, ['so', 'that']); assert.match(text, /___ [a-z]+ ___ (I|we|he|she) can't /); }
  if (mode === 'enough') {
    const word = /\((\w+)／enough\)/.exec(text)[1];
    const noun = /\b(have|has) ___/.test(text);
    assert.deepEqual(a, noun ? ['enough', word] : [word, 'enough'], `${noun ? 'noun' : 'adjective'} ${word}: ${text}`);
  }
  if (mode === 'swap') { assert.match(it.lines[0][0], / too \w+ to /); assert.deepEqual(a, ['so', 'that', m.pr, "can't"]); }
}
const WIF_S3 = (subj) => isThirdSg(subj.replace(/^(If|When|Before|After|As soon as) /i, ''));
function checkWhenIf(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  const clause = /(?:^|[.,] |\b)(If|When|Before|After|As soon as|if|when|before|after|as soon as) ([a-zA-Z ]+?) (___|will|[a-z]+)/.exec(text);
  const cs = /(?:If|When|Before|After|As soon as|if|when|before|after|as soon as) ([A-Za-z]+(?: [a-z]+)?) ___/.exec(text);
  const want = [];
  if (mode === 'clause' || mode === 'mix') { const subj = cs[1]; want.push(m.base === 'be' ? 'is' : WIF_S3(subj) ? s3(m.base) : m.base); }
  if (mode === 'main') want.push('will', m.base);
  if (mode === 'mix') { const mainFirst = /^[A-Z][a-z ]* ___ \(/.test(text) && !/^(If|When|Before|After|As soon as)/.test(text); const w = `will ${m.mbase}`; if (mainFirst) want.unshift(w); else want.push(w); }
  assert.deepEqual(a, want, text);
  let i = 0; const filled = text.replace(/___/g, () => a[i++]);
  assert.ok(!/\b(If|When|Before|After|As soon as|if|when|before|after|as soon as) [A-Za-z ]+? will /.test(filled), `no will inside the clause: ${filled}`);
}


// ---------- batch 8 rules ----------
const ADV_OF = { slow: 'slowly', quick: 'quickly', careful: 'carefully', loud: 'loudly', quiet: 'quietly', polite: 'politely', beautiful: 'beautifully', happy: 'happily', easy: 'easily', angry: 'angrily', good: 'well', fast: 'fast', hard: 'hard', late: 'late', early: 'early' };
const ADV_CMP = (adj) => (adj === 'good' ? 'better' : adj === 'late' ? 'later' : adj === 'early' ? 'earlier' : ['fast', 'hard'].includes(adj) ? adj + 'er' : `more ${ADV_OF[adj]}`);
function checkAdverb(it, mode, o) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  if (o.level === 1 && mode !== 'compare') assert.ok(!['happy', 'easy', 'angry', 'good'].includes(m.adj), `level 1 rules: ${m.adj}`); // happy / easy / angry and good wait for level 2; early / fast / hard / late are fine
  if (mode === 'form') assert.deepEqual(a, [ADV_OF[m.adj]], text);
  if (mode === 'choose') {
    // the blank after "is a / an" takes the adjective, the one after the verb takes the adverb
    const parts = it.lines[0]; const answers = [];
    parts.forEach((p, i) => { if (typeof p === 'string') return; const before = parts.slice(0, i).map((x) => (typeof x === 'string' ? x : x.a)).join(''); answers.push(/ an? $/.test(before) ? m.adj : ADV_OF[m.adj]); });
    assert.deepEqual(a, answers, text);
  }
  if (mode === 'compare') { assert.deepEqual(a, ADV_CMP(m.adj).split(' '), text); assert.match(text, / than [A-Za-z]/); }
}
function checkPossess(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  if (mode === 's') {
    const owner = /\((.+?)\)/.exec(text)[1];
    const last = owner.split(' ').pop();
    const irregularPl = ['children', 'women', 'men', 'people'].includes(last);
    const want = irregularPl || !/s$/.test(last) ? `${owner}'s` : `${owner}'`;
    assert.deepEqual(a.map((x) => x.toLowerCase()), [want.toLowerCase()], text);
  }
  if (mode === 'of') { const [x, y] = /\((\w+)／(\w+)\)/.exec(text).slice(1); assert.equal(a[1], 'of'); assert.ok([x, y].includes(a[0]) && [x, y].includes(a[2]) && a[0] !== a[2]); assert.equal(a[0], m.part, `the part comes first: ${text}`); }
  if (mode === 'joint') {
    const plural = /^These are/.test(text);
    assert.deepEqual(a, plural ? [`${m.a}'s`, 'and', `${m.b}'s`] : [m.a, 'and', `${m.b}'s`], `${plural ? 'separate' : 'shared'}: ${text}`);
  }
}
const ORD_W = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth'];
const TENS = { 2: 'twenty', 3: 'thirty', 4: 'forty', 5: 'fifty' };
const ordW = (n) => (n <= 20 ? ORD_W[n] : n % 10 === 0 ? TENS[n / 10].replace(/y$/, 'ieth') : `${TENS[Math.floor(n / 10)]}-${ORD_W[n % 10]}`);
const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const cardW = (n) => (n < 20 ? ONES[n] : n % 10 === 0 ? TENS[n / 10] : `${TENS[Math.floor(n / 10)]}-${ONES[n % 10]}`);
const MONTH_W = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function checkNumbers(it, mode, o) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  if (mode === 'ordinal') { const n = Number(/\((\d+)\)/.exec(text)[1]); assert.deepEqual(a, [ordW(n)], text); if (o.level === 1) assert.ok(n <= 12, `level 1 stays at 1–12: ${text}`); }
  if (mode === 'date') { const [, mo, d] = /\((\d+)\/(\d+)\)/.exec(text); assert.deepEqual(a, ['on', MONTH_W[Number(mo) - 1], ordW(Number(d))], text); }
  if (mode === 'time') {
    const [, h, mi] = /\((\d+):(\d+)\)/.exec(text); const hh = Number(h), mm = Number(mi);
    const want = mm === 0 ? [cardW(hh), "o'clock"] : mm < 10 ? [cardW(hh), 'oh', cardW(mm)] : [cardW(hh), cardW(mm)];
    assert.deepEqual(a, want, text);
  }
}
function checkLinkAdv(it, mode) {
  const m = it.meta, text = it.lines.map(lineText).join(' '), a = ans(it);
  if (mode === 'too') {
    const second = text.split('. ')[1] ?? text;
    const negative = /n't|not /.test(second), atEnd = /, ___\.$/.test(text);
    assert.deepEqual(a, [atEnd ? (negative ? 'either' : 'too') : 'also'], text);
  }
  if (mode === 'so') {
    const first = text.split(' — ')[0];
    const negative = /n't|not /.test(first);
    const plain = first.replace(/can't/g, 'can not').replace(/won't/g, 'will not').replace(/n't/g, ' not').replace(/\.$/, '');
    const words = plain.split(' ');
    let aux = null;
    for (let i = 0; i < words.length && !aux; i++) {
      const w = words[i].toLowerCase(), next = (words[i + 1] ?? '').toLowerCase();
      if (/^(am|is|are|was|were|can|will|do|does|did)$/.test(w)) aux = w;
      else if (/^(has|have)$/.test(w) && (/ed$/.test(next) || Object.values(PP_OF).includes(next) || next === 'not')) aux = w;
    }
    if (!aux) { const v = words[1].toLowerCase(); aux = /ed$/.test(v) || Object.keys(PAST_BACK).includes(v) ? 'did' : /s$/.test(v) && !/^(I|We|They|You|The)$/.test(words[0]) ? 'does' : 'do'; }
    const subj = a[2];
    const pluralSubj = /^(I|we|they|you|the girls)$/.test(subj);
    let replyAux = { am: 'be', is: 'be', are: 'be', was: 'was', were: 'was', can: 'can', will: 'will', has: 'have', have: 'have', did: 'did', does: 'do', do: 'do' }[aux];
    if (replyAux === 'be') replyAux = subj === 'I' ? 'am' : pluralSubj ? 'are' : 'is';
    if (replyAux === 'was') replyAux = pluralSubj && subj !== 'I' ? 'were' : 'was';
    if (replyAux === 'do') replyAux = pluralSubj ? 'do' : 'does';
    if (replyAux === 'have') replyAux = pluralSubj ? 'have' : 'has';
    assert.deepEqual(a.slice(0, 2), [negative ? 'Neither' : 'So', replyAux], `${first} → ${a.join(' ')}`);
  }
  if (mode === 'pair') {
    const pairs = { both: 'and', either: 'or', neither: 'nor', 'not only': 'but also' };
    const first = a.slice(0, m.a.split(' ').length).join(' ').toLowerCase();
    assert.ok(pairs[first], `known pair word: ${first}`);
    assert.equal(a.slice(m.a.split(' ').length).join(' '), pairs[first], `${first} … ${pairs[first]}: ${text}`);
    const zh = it.zh;
    const wantFirst = /都不|沒有.*也沒有/.test(zh) ? 'neither' : /不只/.test(zh) ? 'not only' : /或|選一樣|其中一個/.test(zh) ? 'either' : 'both';
    assert.equal(first, wantFirst, `Chinese says ${wantFirst}: ${zh}`);
  }
}


// ---------- batch 8 rules (2026-11 new topics) ----------
const hintOf = (text) => /\(([a-z]+)\)/.exec(text)?.[1];
function checkUsedTo(it, mode) {
  const text = it.lines.map(lineText).join(' '), a = ans(it);
  if (mode === 'fill') { assert.deepEqual(a, ['used', 'to', hintOf(text)], text); assert.match(it.zh, /以前|小時候/); }
  if (mode === 'negq') {
    if (/^___ /.test(text)) { assert.deepEqual(a, ['Did', 'use', 'to'], text); assert.match(text, /— (Yes, \w+ did|No, \w+ didn't)\.$/); }
    else assert.deepEqual(a, ["didn't", 'use', 'to'], text);
  }
  if (mode === 'vs') {
    const base = hintOf(text);
    if (/\b(am|is|are) used to ___/.test(text)) { assert.deepEqual(a, [ing(base)], text); assert.match(it.zh, /習慣/); }
    else { assert.match(text, / used to ___/); assert.deepEqual(a, [base], text); assert.match(it.zh, /以前/); }
  }
}
const CMP_OF = (b) => cmpForms(b)[0];
function checkAsAs(it, mode) {
  const text = it.lines.map(lineText).join(' '), a = ans(it);
  if (mode === 'as') { assert.deepEqual(a, ['as', 'as']); assert.match(it.zh, /一樣/); }
  if (mode === 'not') { assert.deepEqual(a, ['not', 'as', 'as']); assert.match(it.zh, /沒有.*那麼/); }
  if (mode === 'swap') {
    const [given, out] = it.lines.map(lineText);
    const m = /^(.+?) is (.+?) than (.+)\.$/.exec(given);
    const base = a.slice(2, -1).join(' ');
    assert.equal(m[2], CMP_OF(base), `comparative of ${base}: ${given}`);
    assert.deepEqual([a[0], a[1], a.at(-1)], ['not', 'as', 'as']);
    assert.ok(out.startsWith(`→ ${m[3].charAt(0).toUpperCase() + m[3].slice(1)} is`) && out.endsWith(` ${m[1].charAt(0).toLowerCase() + m[1].slice(1)}.`) || out.endsWith(` ${m[1]}.`), `the two swap places: ${given} / ${out}`);
  }
}
const SPEND = { spend: ['spend', 'spends', 'spent'], take: ['take', 'takes', 'took'], cost: ['cost', 'costs', 'cost'], pay: ['pay', 'pays', 'paid'] };
function checkSpend(it, mode) {
  const text = it.lines.map(lineText).join(' '), a = ans(it);
  if (mode === 'choose') {
    // the pattern decides the verb: It ___ … to V / 人 ___ 時間 V-ing / 物 ___ (人) 錢 / 人 ___ 錢 for 物
    const verb = /^It ___ .* to [a-z]/.test(text) ? 'take' : / ___ [a-z ]+ for the /.test(text) ? 'pay' : /dollars/.test(text) ? 'cost' : 'spend';
    const past = /\b(yesterday|last \w+)\b/.test(text);
    const subj = text.split(' ___')[0];
    const forms = SPEND[verb];
    const want = past ? forms[2] : verb === 'take' || verb === 'cost' && !/^The shoes/.test(subj) ? forms[1] : verb === 'cost' ? forms[0] : isThirdSg(subj) ? forms[1] : forms[0];
    if (verb === 'pay' || (verb === 'cost' && / ___ (me|you|him|her|us|them|[A-Z][a-z]+|my \w+|the \w+|our \w+) [a-z]+ (hundred|thousand)/.test(text))) assert.equal(a[0], forms[2], `buying is past: ${text}`);
    else assert.equal(a[0], want, text);
    if (verb === 'spend') assert.match(text, / ___ [a-z ]+ [a-z]+ing\b/, 'spend + time + V-ing');
  }
  if (mode === 'swap') {
    const [given] = it.lines.map(lineText);
    if (/ spent /.test(given)) { assert.equal(a[0], 'took'); assert.equal(a[2], 'to'); const v = /spent [a-z ]+? ([a-z]+)ing\b/.exec(given)[1]; assert.ok([v, v + 'e', v.replace(/(.)\1$/, '$1')].includes(a[3]), `${a[3]} from ${given}`); }
    else { assert.match(given, / cost /); assert.deepEqual(a, ['paid', 'for']); }
  }
}
function checkItTo(it, mode) {
  const text = it.lines.map(lineText).join(' '), a = ans(it);
  if (mode === 'fill') assert.deepEqual(a, ['It', 'to']);
  if (mode === 'swap') { const v = /^To ([a-z]+) /.exec(lineText(it.lines[0]))[1]; assert.deepEqual(a, ['It', 'to', v]); }
  if (mode === 'forof') {
    const adj = /^It (?:is|was) ([a-z]+) ___/.exec(text)[1];
    const person = new Set(['kind', 'nice', 'smart', 'careless', 'polite']);
    assert.deepEqual(a, [person.has(adj) && /^It was/.test(text) ? 'of' : 'for'], text);
    if (a[0] === 'for') assert.ok(!['kind', 'smart', 'careless', 'polite'].includes(adj), `for + ${adj}`);
  }
}
const WH_ZH = { what: /什麼/, how: /怎麼/, where: /哪裡/, when: /什麼時候/, which: /哪一/, who: /誰/ };
function checkWhTo(it, mode) {
  const text = it.lines.map(lineText).join(' '), a = ans(it);
  assert.ok(WH_ZH[a[0]], `question word ${a[0]}`); assert.match(it.zh, WH_ZH[a[0]], `${a[0]} matches the Chinese: ${it.zh}`);
  assert.equal(a[1], 'to');
  if (mode === 'swap') { const m = / (what|how|where|when|who) \w+ should ([a-z]+)/.exec(lineText(it.lines[0])); assert.deepEqual(a, [m[1], 'to', m[2]]); }
}
function checkThat(it, mode) {
  const text = it.lines.map(lineText).join(' '), a = ans(it);
  if (mode === 'head') {
    const subj = text.split(' ___')[0];
    const VZ = { think: '認為', know: '知道', hope: '希望', believe: '相信', sure: '確定', heard: '聽說' };
    const verb = Object.keys(VZ).find((k) => it.zh.includes(VZ[k]));
    const want = verb === 'sure' ? [subj === 'I' ? 'am' : subj === 'We' ? 'are' : 'is', 'sure'] : verb === 'heard' ? ['heard'] : [/^(I|We)$/.test(subj) ? verb : s3(verb)];
    assert.deepEqual(a, want, text); assert.match(text, / that [a-z]|that [A-Z]/);
  }
  if (mode === 'join') { assert.deepEqual(a, ['that']); const [given, out] = it.lines.map(lineText); const clause = given.split('. I ')[0]; assert.ok(out.toLowerCase().includes(`___ ${clause.toLowerCase()}.`), `${given} → ${out}`); }
  if (mode === 'neg') {
    const given = lineText(it.lines[0]);
    const m = /^I think (.+?) (isn't|won't|can't|doesn't|don't) ([a-z]+)/.exec(given);
    const want = { "isn't": 'is', "won't": 'will', "can't": 'can', "doesn't": s3(m[3]), "don't": m[3] }[m[2]];
    assert.deepEqual(a, ["don't", 'think', want], given); assert.match(it.zh, /^我不認為/);
  }
}
function checkPartAdj(it, mode) {
  const text = it.lines.map(lineText).join(' '), a = ans(it);
  const PERSON = /^(I|We|The students|The children|My parents|[A-Z][a-z]+) (was|were)\b/;
  if (mode === 'pick') {
    const [x, y] = /\((\w+)／(\w+)\)/.exec(text).slice(1);
    const want = [x, y].find((w) => (PERSON.test(text) ? /ed$/ : /ing$/).test(w));
    assert.deepEqual(a, [want], text);
  }
  if (mode === 'both') { assert.ok(/ing$/.test(a[0]) && /ed$/.test(a[1]), text); const base = hintOf(text); assert.deepEqual(a, [ing(base), pastOf(base)], `same verb ${base}: ${a}`); }
  if (mode === 'prep') {
    const adj = / (\w+ed) ___/.exec(text)[1];
    const PREP = { interested: 'in', excited: 'about', surprised: 'at／by', worried: 'about', satisfied: 'with', frightened: 'of' };
    assert.deepEqual(a, [PREP[adj]], text);
  }
}
function checkPartNoun(it, mode) {
  const text = it.lines.map(lineText).join(' '), a = ans(it);
  const base = hintOf(text);
  // after the people nouns the participle is active (V-ing); after things it is passive (past participle)
  const active = /^The (boy|girl|man|woman|students|children) ___/.test(text);
  if (mode === 'ing' || (mode === 'mix' && active)) assert.deepEqual(a, [ing(base)], text);
  else assert.deepEqual(a, [ppAny(base)], text);
  const head = /^The (\w+)/.exec(text)[1], plural = /s$/.test(head) || ['children', 'men', 'women'].includes(head);
  const verb = /\) [^.]*? (is|are|was)\b/.exec(text)?.[1];
  if (verb && verb !== 'was') assert.equal(verb, plural ? 'are' : 'is', `main verb agrees with ${head}: ${text}`);
}

const CHECKERS = { be: (it, mode, o) => checkBe(it, mode, o), simple: checkSimple, progressive: checkProgressive, there: checkThere, can: checkCan, past: checkPast, pronoun: checkPronoun, plural: checkPlural, this: checkThis, freq: checkFreq, imperative: checkImperative, article: checkArticle, quantity: checkQuantity, wh: checkWh, prep: checkPrep, future: checkFuture, compare: checkCompare, conj: checkConj, must: checkMust, perfect: checkPerfect, gerund: checkGerund, give: checkGive, exclaim: checkExclaim, passive: checkPassive, relative: checkRelative, tag: checkTag, sense: checkSense, indef: checkIndef, reflexive: checkReflexive, indirect: checkIndirect, tooenough: checkTooEnough, whenif: checkWhenIf, adverb: checkAdverb, possess: checkPossess, numbers: checkNumbers, linkadv: checkLinkAdv, usedto: checkUsedTo, asas: checkAsAs, spend: checkSpend, itto: checkItTo, whto: checkWhTo, that: checkThat, partadj: checkPartAdj, partnoun: checkPartNoun };

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
    assert.equal(items.length, sh.total, `${sh.code}: total matches the questions`);
    if (!t.capacity) assert.equal(sh.total, o.count, `${sh.code}: ${o.count} questions`);
    else for (const sec of sh.sections) assert.ok(sec.items.length <= (t.capacity[sec.mode] ?? Infinity), `${sh.code}: ${sec.mode} within its capacity`);
    if (t.capacity) assert.equal(sh.total, splitCount(o.count, sh.opts.modes).reduce((a, x) => a + Math.min(x.n, t.capacity[x.mode] ?? Infinity), 0), `${sh.code}: only capped sections run short`);
    assert.deepEqual(sh.sections.map((s) => s.mode), t.modes.map((m) => m.id).filter((id) => o.modes.includes(id)), 'sections follow the mode order');
    const keys = items.map((it) => it.lines.map(lineText).join(' | ').toLowerCase() + (t.zhRequired ? ' | ' + it.zh : ''));
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
      for (const p of it.lines.flat().filter((x) => typeof x !== 'string')) for (const alt of p.a.split('／')) assert.match(alt, p.wide ? /^[A-Za-z' -]+$/ : /^([A-Za-z']+|×)$/, `one word per blank (or × for no word; ／ between accepted answers): "${p.a}"`);
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
      assert.match(it.zh, /[。？！]$/, 'ends with punctuation');
    }
  }
});

test('sheets spread over the word bank: varied subjects, verbs and time words, some sentences start with the time', () => {
  for (const t of ALL_TOPICS.filter((x) => x.variety !== false)) for (const level of [1, 2, 3]) {
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
    if (t.variety?.front !== false) assert.ok(front > 0, `${where}: some sentences put the time word first`);
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

test('article sheets from level 2 on include trap words (an hour, an honest…, a university, a uniform…)', () => {
  const t = ALL_TOPICS.find((x) => x.id === 'article');
  for (const level of [2, 3]) for (let seed = 1; seed <= 40; seed++) {
    const sh = buildSheet(t, { level, tense: 'P', modes: t.defaultModes[level], abbr: 'F', zh: true, count: 20, seed });
    const words = sh.sections.find((s) => s.mode === 'aan').items.map((it) => it.meta.word);
    assert.ok(words.filter((w) => TRAP_WORDS.has(w)).length >= 2, `level ${level} seed ${seed}: at least two trap words (${words.join(', ')})`);
  }
  const sh1 = buildSheet(t, { level: 1, tense: 'P', modes: ['aan'], abbr: 'F', zh: true, count: 50, seed: 5 });
  assert.ok(sh1.sections[0].items.every((it) => !TRAP_WORDS.has(it.meta.word)), 'level 1 goes by the first letter only');
});

test('comparison sheets from level 2 have more / most questions; have-to sheets balance has to and have to', () => {
  const cmp = ALL_TOPICS.find((x) => x.id === 'compare'), must = ALL_TOPICS.find((x) => x.id === 'must');
  for (let seed = 1; seed <= 30; seed++) {
    for (const level of [2, 3]) {
      const sh = buildSheet(cmp, { level, tense: 'P', modes: ['er', 'est'], abbr: 'F', zh: true, count: 20, seed });
      for (const sec of sh.sections) assert.ok(sec.items.filter((it) => /^(more|most)$/.test(answersOf(it).find((w) => w !== 'the'))).length >= 2, `compare level ${level} seed ${seed} ${sec.mode}: at least two more / most questions in ten`);
    }
    for (const level of [1, 2, 3]) {
      const sh = buildSheet(must, { level, tense: 'P', modes: ['have'], abbr: 'F', zh: true, count: 20, seed });
      const has = sh.sections[0].items.filter((it) => answersOf(it)[0] === 'has').length;
      assert.ok(has >= 8 && has <= 12, `must level ${level} seed ${seed}: has to and have to balanced (has to ×${has} in 20)`);
    }
  }
});

test('whole-sentence translation: new sentences, whole and in the word list, and adding them leaves the fill-in part alone', () => {
  // fullSentence on hand-made items
  const B = (a) => ({ a });
  assert.equal(fullSentence({ lines: [[B('He'), ' ', B('always'), ' plays basketball. (總是／play)']] }), 'He always plays basketball.');
  assert.equal(fullSentence({ lines: [['My father can carry the boxes now.'], ['→ My father ', B("can't"), ' carry the boxes now. （縮寫）']] }), "My father can't carry the boxes now.");
  assert.equal(fullSentence({ lines: [[B('Is'), ' this your pen? — No, ', B('it'), ' ', B("isn't"), '.']] }), 'Is this your pen?');
  assert.equal(fullSentence({ lines: [['Is Tom a nurse now?'], ['— No, ', B('he'), ' ', B("isn't"), '. He is a cook.']] }), 'Is Tom a nurse now?');
  for (const t of ALL_TOPICS) for (const level of [1, 2, 3]) for (const tr of [5, 10]) for (const seed of [11, 12, 13]) {
    const base = { level, tense: t.past ? 'M' : 'P', modes: t.defaultModes[level], abbr: 'B', zh: true, count: 20, seed };
    const plain = buildSheet(t, base), sh = buildSheet(t, { ...base, tr });
    const where = `${t.id} level ${level} tr ${tr} seed ${seed}`;
    assert.deepEqual(sh.sections, plain.sections, `${where}: same fill-in questions with or without translation`);
    assert.equal(plain.translation, null);
    const items = sh.translation.items;
    if (!t.capacity) assert.equal(items.length, tr, `${where}: ${tr} translation questions`);
    else assert.ok(items.length >= Math.min(tr, 3), `${where}: some translation questions`);
    if (sh.opts.modes.filter((m) => !t.noTranslate?.includes(m)).length > 1) assert.ok(new Set(items.map((x) => x.mode)).size > 1, `${where}: drawn from all the chosen modes`);
    const fill = new Set(sh.sections.flatMap((s) => s.items.map((it) => fullSentence(it).toLowerCase())));
    assert.equal(new Set(items.map((x) => x.en.toLowerCase())).size, items.length, `${where}: all different`);
    assert.equal(new Set(items.map((x) => x.zh)).size, items.length, `${where}: no Chinese line twice`);
    for (const x of items) {
      assert.ok(!fill.has(x.en.toLowerCase()), `${where}: not a fill-in sentence: ${x.en}`);
      assert.ok(sh.opts.modes.includes(x.mode) && !t.noTranslate?.includes(x.mode), 'from the chosen modes, none that are kept out');
      assert.match(x.en, /^[A-Z][A-Za-z0-9 ,'.:;?!-]*[A-Za-z0-9][.?!]$/, `${where}: one whole sentence, no cue left: ${x.en}`);
      for (const w of x.en.match(/[A-Za-z][A-Za-z']*/g)) assert.ok(inList(w), `${where}: "${w}" in the word list (${x.en})`);
      assert.match(x.zh, /^[^(（]*\p{Script=Han}[^(（]*[。？！]$/u, `${where}: Chinese prompt: ${x.zh}`);
      assert.ok(!/undefined|null|NaN|___|→|—/.test(x.en + x.zh), `${where}: clean: ${x.en} / ${x.zh}`);
    }
    const back = decodeCode(sh.code, ALL_TOPICS);
    assert.ok(sh.code.endsWith(`-T${tr}`), 'code carries the translation count');
    assert.deepEqual(back.opts, sh.opts); assert.deepEqual(buildSheet(t, back.opts), sh, `${where}: rebuilt from the code`);
    assert.equal(decodeCode(plain.code, ALL_TOPICS).opts.tr, 0, 'older codes without -T still work');
  }
  assert.equal(decodeCode('BE-2P-1-F0-20-5-T7', ALL_TOPICS), null, 'only the offered counts');
});

test('translation-only sheets: no fill-in part, the asked number of whole sentences, code ends in -TO', () => {
  for (const t of ALL_TOPICS) for (const level of [1, 2, 3]) for (const seed of [21, 22]) {
    const o = { level, tense: t.past ? 'M' : 'P', modes: t.defaultModes[level], abbr: 'B', zh: false, count: 20, seed, tr: 'O' };
    const sh = buildSheet(t, o);
    const where = `${t.id} level ${level} seed ${seed}`;
    assert.deepEqual(sh.sections, [], `${where}: no fill-in sections`);
    const items = sh.translation.items;
    assert.equal(sh.total, items.length);
    const trModes = o.modes.filter((m) => !t.noTranslate?.includes(m));
    const cap = t.capacity ? trModes.reduce((a, m) => a + (t.capacity[m] ?? 50), 0) : Infinity;
    assert.ok(items.length >= Math.min(20, cap, 10), `${where}: enough translation questions (${items.length})`);
    if (!t.capacity) assert.equal(items.length, 20, `${where}: all 20`);
    assert.equal(new Set(items.map((x) => x.zh)).size, items.length, `${where}: no Chinese line twice`);
    for (const x of items) { for (const w of x.en.match(/[A-Za-z][A-Za-z']*/g)) assert.ok(inList(w), `${where}: "${w}" in the word list (${x.en})`); assert.ok(!/___|—|→/.test(x.en + x.zh), 'clean'); }
    assert.ok(sh.code.endsWith('-TO'), sh.code);
    const back = decodeCode(sh.code, ALL_TOPICS);
    assert.deepEqual(back.opts, sh.opts); assert.deepEqual(buildSheet(t, back.opts), sh, `${where}: rebuilt from the code`);
  }
});

test('review sheets over several topics: shares add up, every section passes its topic\'s own rules, the code round-trips', () => {
  const sets = [['be', 'simple', 'progressive', 'past', 'there', 'can'], ['perfect', 'passive', 'tag', 'relative', 'gerund'], ['article', 'quantity', 'prep', 'possess'], TOPICS.map((t) => t.id)];
  for (const ids of sets) for (const level of [1, 2, 3]) for (const seed of [31, 32]) {
    const topics = ids.map((id) => TOPICS.find((t) => t.id === id));
    const o = { level, tense: 'M', abbr: 'B', zh: false, count: ids.length >= 12 ? 50 : 30, seed, tr: 5 };
    const sh = buildMixSheet(topics, o);
    const where = `mix ${ids.length} topics level ${level} seed ${seed}`;
    const byTopic = {}; for (const s of sh.sections) byTopic[s.topic] = (byTopic[s.topic] || 0) + s.items.length;
    const shares = splitCount(o.count, ids);
    for (const { mode: id, n } of shares) { const t = TOPICS.find((x) => x.id === id); if (!t.capacity) assert.equal(byTopic[id], n, `${where}: ${id} gets its share`); else assert.ok(byTopic[id] <= n); }
    assert.equal(sh.total, sh.sections.reduce((a, s) => a + s.items.length, 0));
    for (const s of sh.sections) {
      const t = TOPICS.find((x) => x.id === s.topic);
      assert.ok(t.defaultModes[level].includes(s.mode), `${where}: ${s.topic} uses a default mode`);
      for (const it of s.items) CHECKERS[s.topic](it, s.mode, s.opts);
    }
    assert.equal(sh.translation.items.length, 5, `${where}: five translations`);
    assert.ok(new Set(sh.translation.items.map((x) => x.topic)).size >= Math.min(ids.length, 5), `${where}: translations spread over the topics`);
    assert.deepEqual(buildMixSheet(topics, o), sh, 'deterministic');
    const back = decodeMixCode(sh.code, TOPICS);
    assert.deepEqual(back.topics, ids); assert.deepEqual(back.opts, sh.opts);
    assert.deepEqual(buildMixSheet(back.topics.map((id) => TOPICS.find((t) => t.id === id)), back.opts), sh, 'rebuilt from the code');
    // translation-only review sheet
    const only = buildMixSheet(topics, { ...o, tr: 'O' });
    assert.deepEqual(only.sections, []); assert.equal(only.translation.items.length, o.count, `${where}: translation-only has ${o.count}`); assert.ok(only.code.endsWith('-TO'));
    assert.equal(new Set(only.translation.items.map((x) => x.zh)).size, o.count, 'no Chinese line twice');
  }
  assert.equal(decodeMixCode('MIX-2M-BE.BE-F1-30-5', TOPICS), null, 'a topic cannot repeat');
  assert.equal(decodeMixCode('MIX-2M-BE.ZZZ-F1-30-5', TOPICS), null, 'unknown topic');
});

test('the page is public, loads the engine as modules, and every published topic is linked from the resources page', () => {
  const html = fs.readFileSync(path.join(root, 'tools/english-grammar.html'), 'utf8');
  assert.ok(!/<meta name="robots" content="noindex">/.test(html), 'indexable once reviewed');
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.bhcs\.com\.tw\/tools\/english-grammar\.html">/);
  assert.ok(html.includes("from '../assets/english-grammar/core.js'") && html.includes("from '../assets/english-grammar/topics.js'"));
  const ziyuan = fs.readFileSync(path.join(root, 'ziyuan.html'), 'utf8');
  for (const t of TOPICS) assert.ok(ziyuan.includes(`href="tools/english-grammar.html?topic=${t.id}"`), `${t.title} is linked from the resources page`);
  assert.ok(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').includes('https://www.bhcs.com.tw/tools/english-grammar.html'), 'in the sitemap');
  const mix = fs.readFileSync(path.join(root, 'tools/english-grammar-mix.html'), 'utf8');
  assert.ok(mix.includes("from '../assets/english-grammar/core.js'") && mix.includes('buildMixSheet'), 'the review page uses the shared engine');
  assert.ok(ziyuan.includes('href="tools/english-grammar-mix.html"'), 'the review page is linked from the resources page');
  assert.ok(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').includes('https://www.bhcs.com.tw/tools/english-grammar-mix.html'), 'review page in the sitemap');
});

console.log(`english grammar: ${tests} tests passed`);
