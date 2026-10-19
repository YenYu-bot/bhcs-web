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
export const midOf = (p) => (p.en === 'I' || /^[A-Z][a-z]+$/.test(p.en) && !FIXED.includes(p) ? p.en : p.en.charAt(0).toLowerCase() + p.en.slice(1));
