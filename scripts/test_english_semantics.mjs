// Meaning checks for the English grammar worksheets. The answer tests (test_english_grammar.mjs) prove each blank is
// grammatically right; this file looks for sentences that are grammatical but odd, the kind a teacher would strike out:
// a question that asks the listener about "my bag", "not … every day", "breakfast last night", "Has he ever slept?",
// "She is short now", or the same sentence twice on one sheet. Each rule names the problem it guards against.
import assert from 'node:assert/strict';
import { buildSheet, fullSentence } from '../assets/english-grammar/core.js';
import { TOPICS } from '../assets/english-grammar/topics.js';

let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS', name); };

// Every sheet over every level and mode, many seeds: the sentences the rules below read.
const SHEETS = [];
for (const t of TOPICS) for (const level of [1, 2, 3]) for (let seed = 1; seed <= 25; seed++) {
  const o = { level, tense: t.past ? 'M' : 'P', modes: t.modes.map((m) => m.id), abbr: 'B', zh: true, count: 30, seed, tr: 0 };
  let sh;
  try { sh = buildSheet(t, o); } catch { continue; } // a level may not offer every mode; the answer test covers the defaults
  SHEETS.push({ topic: t.id, level, seed, sh });
}
const ITEMS = SHEETS.flatMap(({ topic, sh }) => sh.sections.flatMap((sec) => sec.items.map((it) => {
  const all = it.lines.map((l) => l.map((p) => (typeof p === 'string' ? p : p.a === '×' ? '' : p.a)).join('')).join(' ');
  return { topic, mode: sec.mode, it, all, text: all.replace(/\s*[(（][^)）]*[)）]/g, '').replace(/\s+/g, ' ') };
})));
// The questions in an item: every stretch that ends in "?", split at "→" and "—".
const questions = (x) => x.text.split(/\s*(?:→|— )\s*/).filter((s) => /\?$/.test(s.trim())).map((s) => s.trim());
// A clause, split at commas and the dialogue / rewrite marks, so "No, he doesn't. He …" is read in parts.
const clauses = (x) => x.text.split(/\s*(?:→|— |[.?!;,])\s*/).filter(Boolean);

function none(rule, pick, show = 4) {
  const bad = ITEMS.filter(pick);
  assert.equal(bad.length, 0, `${rule}: ${bad.length} items, e.g.\n  ` + bad.slice(0, show).map((x) => `[${x.topic}/${x.mode}] ${x.all} ｜${x.it.zh}`).join('\n  '));
}

test(`read ${ITEMS.length} items from ${SHEETS.length} sheets`, () => assert.ok(ITEMS.length > 50000));

// "They don't play every day" means "not every day", which is not what the Chinese 每天都不 says.
const NEG = /\b(don't|doesn't|didn't|isn't|aren't|wasn't|weren't|won't|can't|not|never)\b/i;
const EVERY = /\bevery (day|morning|afternoon|evening|night|week|weekend|Sunday|Saturday)\b/i;
test('no negative sentence with an every- time word', () => none('negative + every', (x) => clauses(x).some((c) => NEG.test(c) && EVERY.test(c))));

// A question put to the listener uses "your": 改疑問句 turns "My brother is…" into "Is your brother…?", "I" into "you".
// Topics where the question is about the listener's world; question-word, possessive and indirect-question topics keep
// natural first-person questions ("Where are my keys?", "Do you like my hat?").
const ASKED_TOPICS = new Set(['be', 'simple', 'past', 'progressive', 'can', 'future', 'perfect', 'must', 'passive', 'there', 'quantity']);
const SELF_Q = /^(Am I|Are Ben and I|Are we|Were we|Do we|Did we|Will we|Are we going|Can we|Have we|Do we have to|Are you and I)\b/;
test('questions to the listener say "your", not "my" or "I"', () => {
  none('"my/our" in a question', (x) => ASKED_TOPICS.has(x.topic) && questions(x).some((q) => /\bmy\b/i.test(q) || (/\bour\b/i.test(q) && !/\bwe\b/i.test(q)))); // "Do we have to do our homework?" is fine
  none('"I" asked about in a question', (x) => ASKED_TOPICS.has(x.topic) && questions(x).some((q) => /\bI\b/.test(q) && !SELF_Q.test(q)));
  none('"in my bag" in a question', (x) => questions(x).some((q) => /\bin my bag\b/.test(q) && !/^(Where|What)\b/.test(q)));
});

test('first-, second- and third-person subjects, singular and plural, all appear in the question sections', () => {
  for (const topic of ['be', 'simple', 'past', 'progressive', 'can', 'future']) {
    const seen = new Set();
    for (const x of ITEMS.filter((y) => y.topic === topic && ['q', 'short'].includes(y.mode))) {
      for (const q of questions(x)) {
        const s = q.replace(/^(Am|Is|Are|Was|Were|Do|Does|Did|Can|Will|Have|Has)\s+/, '');
        if (/^(we|Ben and I)\b/.test(s)) seen.add('1pl');
        else if (/^I\b/.test(s)) seen.add('1sg');
        else if (/^you and\b/i.test(s)) seen.add('2pl');
        else if (/^you\b/.test(s)) seen.add('2');
        else if (/^(he|she|it|[A-Z][a-z]+|your (brother|sister|father|mother|cat|dog|teacher|classmate|grandfather|grandmother|bag))\b/.test(s)) seen.add('3sg');
        else if (/^(they|the \w+s|your (friends|parents|classmates|shoes)|\w+ and \w+)\b/.test(s)) seen.add('3pl');
      }
    }
    for (const k of ['1pl', '2', '3sg', '3pl']) assert.ok(seen.has(k), `${topic}: no ${k} question subject (saw ${[...seen].join(', ')})`);
  }
});

// Meals at the wrong time of day.
const MEAL_CLASH = [
  [/\bbreakfast\b/, /\b(tonight|last night|this evening|in the evening|at night|this afternoon|after school)\b/],
  [/\blunch\b/, /\b(this morning|in the morning|tonight|last night|this evening|at night)\b/],
  [/\bdinner\b/, /\b(this morning|in the morning|this afternoon)\b/],
];
test('meals keep to their time of day', () => none('meal at the wrong time', (x) => clauses(x).some((c) => MEAL_CLASH.some(([m, t]) => m.test(c) && t.test(c)))));

// Lasting traits do not start "now": "She is short now", "The bag is cheap now". (Growing up — "tall now" — is allowed.)
test('lasting traits are not tied to "now"', () =>
  none('trait + now', (x) => clauses(x).some((c) => /\b(is|are|was|were|am)( not|n't)? (short|kind|friendly|lazy|smart|new|old|big|small|cheap|expensive|heavy)\b.*\bnow\b/i.test(c))));

// ever / never / times ask about experiences, not daily routines.
const ROUTINE = /(slept|smiled|closed|opened|hurried|cried|had (dinner|lunch|breakfast)|watched television|brushed|washed (the dishes|his|her|my|your))/;
test('ever / never / twice ask about experiences, not routines', () =>
  none('routine as experience', (x) => x.topic === 'perfect' && clauses(x).some((c) => /\b(ever|never|twice|three times|before)\b/.test(c) && ROUTINE.test(c))));

test('no sentence that reads two ways or contains itself', () => {
  none('"right" followed by "now"', (x) => questions(x).some((q) => /^(Am|Are|Is|Was|Were) (I|we|you|they|he|she|Ben and I) right (right )?now\b/.test(q))); // "Are we right now?"
  none('a bag in a bag', (x) => /\bbag (is|are|was|were|isn't|wasn't)( not)? in (my|your) bag\b/i.test(x.text));
  none('"Is there X? — No. There is X"', (x) => {
    const m = /^(?:Is|Are|Was|Were) there (?:a|an|any|some) (\w+?)s? .*— No, there \w+'?t?\. There (?:is|are|was|were) (?:a|an|some|\w+) (\w+?)s? /.exec(x.text);
    return m && m[1] === m[2];
  });
});

// Cases a reviewer struck out, one per topic, so they stay fixed.
test('per-topic cases stay fixed', () => {
  none('a moment in progress (opening the window)', (x) => /\b(am|is|are|was|were)( not|n't)? (opening|closing)\b/.test(x.text));
  none('plural food with "is"', (x) => /\bThe noodles is\b/.test(x.text));
  none('a song or movie "looked at" or "mine"', (x) => /\b(Look at the (song|movie)s?|The (song|movie)s? (which|who) .* (is|are) mine)\b/.test(x.text));
  none('a girl who is my mother', (x) => /Who is that (girl|boy)\?.*\b(mother|father|aunt|uncle|teacher)\b/.test(x.text));
  none('so … that without the object (read in.)', (x) => /can't \w+ in\./.test(x.text));
  none('"it" before the noun it stands for', (x) => /\b\w+ed it because the \w+ was\b/.test(x.text));
  none('很快跑 instead of 跑得很快', (x) => /很快(跑|走路|游泳|開車)/.test(x.it.zh));
  none('the same subject twice in a Chinese if / when sentence', (x) => x.topic === 'whenif' && (() => { const m = /^(?:如果)?\s*([^，]{1,8}?)(?:[^，]*)，\s*\1(會|就)/.exec(x.it.zh); return !!m; })());
  none('a shared father or mother', (x) => /共同的(爸爸|媽媽)/.test(x.it.zh));
  none('school out at night or up at noon', (x) => /School ends at (one|two|six|seven|eight|nine|ten|eleven|twelve)\b|I get up at (nine|ten|eleven|twelve|one|two|three|four)\b/.test(x.text));
  none('seasons and months out of order', (x) => /\b(Winter|January|December) is (hotter|warmer)\b|\b(Summer|July|August) is (colder|cooler)\b/.test(x.text));
});

test('one sheet never repeats a sentence, even with other blanks', () => {
  const bad = [];
  for (const { topic, level, seed, sh } of SHEETS) {
    const seen = new Map();
    for (const it of sh.sections.flatMap((s) => s.items)) {
      const k = fullSentence(it).toLowerCase();
      if (seen.has(k)) bad.push(`${topic} L${level} seed ${seed}: ${k}`);
      seen.set(k, true);
    }
  }
  assert.equal(bad.length, 0, `${bad.length} repeats, e.g.\n  ${bad.slice(0, 5).join('\n  ')}`);
});

console.log(`english semantics: ${tests} tests passed`);
