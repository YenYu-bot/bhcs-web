// Helpers shared by the verb topics: subjects that do things, spelling-level filters and contractions.
import { cap, zhJoin } from './core.js';
import { SUBJECTS, nameSubject, twoNamesSubject } from './lexicon.js';
import { VERBS, FRAMES } from './verbs.js';

export { cap, zhJoin };

/** People and animals up to the level; names from level 2. */
export function actors(rng, level, { exclude = () => false } = {}) {
  // "every student" reads oddly with most activities, so the verb topics leave it to the Be topic
  let pool = SUBJECTS.filter((s) => s.lvl <= level && (s.kind === 'person' || s.kind === 'animal') && !s.tags.includes('every'));
  if (level >= 2) pool = [...pool, nameSubject(rng), nameSubject(rng), twoNamesSubject(rng)];
  return pool.filter((s) => !exclude(s));
}
export const third = (s) => s.person === 3 && s.num === 'sg';

/** Spelling rules allowed at each level, per form. Level 2 and up allow everything. */
const EASY = { s: ['s'], ing: ['ing'], past: ['ed', 'd'] };
export function spellingOk(f, form, level) {
  if (level >= 2) return true;
  return EASY[form].includes(VERBS[f.v].sp[form]);
}

export function frameFits(f, s) {
  if (!f.who.includes(s.kind)) return false;
  if (f.age === 'adult' && !(s.age === 'adult' || s.age === 'any')) return false;
  if (f.age === 'adult' && s.tags.includes('pron') && s.person === 1) return false;
  if (f.age === 'young' && s.age === 'adult') return false;
  if (f.species && s.species && !f.species.includes(s.species)) return false;
  return true;
}
export function pickFrame(rng, s, level, test = () => true, form = null) {
  const list = FRAMES.filter((f) => frameFits(f, s) && test(f) && (!form || spellingOk(f, form, level)));
  return list.length ? rng.pick(list) : null;
}

/** Contraction wanted for this item from the sheet setting (F never, C always, B half). */
export const wantAbbr = (rng, o) => (o.abbr === 'C' ? true : o.abbr === 'F' ? false : rng.chance(0.5));
export const abbrMark = (o, abbr) => (o.abbr === 'B' ? (abbr ? ' （縮寫）' : ' （不縮寫）') : '');
export const negInstruction = (o, what = '否定句') => ({ F: `改成${what}（不用縮寫）。`, C: `改成${what}（請用縮寫）。`, B: `改成${what}；括號寫「縮寫」的請用縮寫。` }[o.abbr]);

/** Chinese line: subject, time, verb phrase. */
export const zhSent = (s, t, vp, end) => zhJoin(s.zh, t?.zh, vp) + end;

/** Sentence-initial subject. */
export const S0 = (s) => cap(s.en);

/** 正在 / 沒有在 before a verb phrase; a phrase that already starts with 在 keeps one 在. */
export const zhAspect = (prefix, vp) => (vp.startsWith('在') ? prefix.replace(/在$/, '') + vp : prefix + vp);
