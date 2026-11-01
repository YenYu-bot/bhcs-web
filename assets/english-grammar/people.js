// A small pool of people for topics that only need someone to do something (articles, quantity words, prepositions, question words).
//   en  as written at the start of a sentence      zh  Chinese
//   s3  takes the -s verb form                      pr  pronoun used about them in an answer ('he' | 'she' | 'they' | 'I' | 'we' | 'you')
import { NAMES } from './lexicon.js';

const P = (en, zh, s3, pr) => ({ en, zh, s3, pr });
const FIXED = [
  P('I', '我', false, 'I'), P('We', '我們', false, 'we'), P('They', '他們', false, 'they'), P('You', '你', false, 'you'),
  P('He', '他', true, 'he'), P('She', '她', true, 'she'),
  P('My brother', '我哥哥', true, 'he'), P('My sister', '我姊姊', true, 'she'), P('My father', '我爸爸', true, 'he'), P('My mother', '我媽媽', true, 'she'),
  P('My friends', '我的朋友們', false, 'they'), P('My parents', '我的父母', false, 'they'), P('Our teacher', '我們的老師', true, 'she'),
  P('The students', '學生們', false, 'they'), P('My classmate', '我的同學', true, 'he'),
];
const NAMED = [...NAMES.m.map((n) => P(n, n, true, 'he')), ...NAMES.f.map((n) => P(n, n, true, 'she'))];
export const PEOPLE = [...FIXED, ...NAMED];

/** A person, least-used first; `test` narrows the pool (e.g. (p) => !p.s3). */
export const pickPerson = (rng, test = () => true) => rng.fresh(PEOPLE.filter(test), (p) => p.en);
/** "plays" / "play" for a person. `forms` is [base, -s form]. */
export const verbFor = (p, [base, s]) => (p.s3 ? s : base);
/** The subject in the middle of a sentence ("my brother", "Tom", "I"). */
export const midOf = (p) => (p.en === 'I' || NAMED.some((n) => n.en === p.en) ? p.en : p.en.charAt(0).toLowerCase() + p.en.slice(1));

// ---- Questions to the listener (2026-11-01) ----
// 改疑問句 and dialogue questions: "My brother" → "Your brother", "I" → "You"; the speaker may also ask about "we".
// The reply pronoun (rp) is what the answer starts with; for "we" both "we" and "you" are right, and the key lists both.
const PN = { I: '1sg', we: '1pl', you: '2sg', he: '3sg', she: '3sg', they: '3pl' };
export function askedPerson(p) {
  if (p.en === 'I') return { ...p, en: 'You', zh: '你', pr: 'you', rp: 'I', s3: false };
  if (p.en === 'We') return { ...p, rp: 'we', rpAlt: 'you' };
  if (/^(My|Our) /.test(p.en)) return { ...p, en: p.en.replace(/^(My|Our) /, 'Your '), zh: p.zh.replace(/^我們的/, '你們的').replace(/^我的/, '你的').replace(/^我/, '你'), rp: p.pr };
  return { ...p, rp: p.pr === 'you' ? 'I' : p.pr };
}
/** A question subject: a person–number not used much on this sheet first, then a person of that kind. */
export function pickAskedPerson(rng, test = () => true) {
  const pool = [...new Map(PEOPLE.map(askedPerson).filter(test).map((p) => [p.en, p])).values()];
  if (!pool.length) return null;
  const k = rng.fresh([...new Set(pool.map((p) => PN[p.pr]))], (x) => 'ppn:' + x);
  return rng.fresh(pool.filter((p) => PN[p.pr] === k), (p) => p.en);
}
export const rpKey = (p) => (p.rpAlt ? `${p.rp}／${p.rpAlt}` : p.rp);
