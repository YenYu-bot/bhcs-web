// Helpers shared by the verb topics: subjects that do things, spelling-level filters and contractions.
import { cap, mid, zhJoin } from './core.js';
import { SUBJECTS, extraSubjects } from './lexicon.js';
import { VERBS, FRAMES } from './verbs.js';

export { cap, mid, zhJoin };

/** People and animals up to the level; single names from level 1, two names from level 2. */
export function actors(rng, level, { exclude = () => false } = {}) {
  // "every student" reads oddly with most activities, so the verb topics leave it to the Be topic
  let pool = SUBJECTS.filter((s) => s.lvl <= level && (s.kind === 'person' || s.kind === 'animal') && !s.tags.includes('every'));
  pool = [...pool, ...extraSubjects(rng, level)];
  return pool.filter((s) => !exclude(s));
}
export const third = (s) => s.person === 3 && s.num === 'sg';
const FAMILY_VERBS = new Set(['eat', 'have', 'watch', 'visit', 'see', 'travel', 'go', 'take', 'clean']);

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
  if (f.age === 'young' && !(s.age === 'young' || s.age === 'any')) return false;
  if (s.tags.includes('group') && !(FAMILY_VERBS.has(f.v) && f.habit && !f.age)) return false; // "my family" only does family things
  if (f.species && s.species && !f.species.includes(s.species)) return false;
  return true;
}
/**
 * A verb phrase for this subject, spread over the verbs on the sheet. About a third of the time a place is added
 * ("play basketball in the park"); the returned copy carries the longer phrase and its Chinese.
 */
export function pickFrame(rng, s, level, test = () => true, form = null, places = true) {
  const list = FRAMES.filter((f) => frameFits(f, s) && test(f) && (!form || spellingOk(f, form, level)));
  if (!list.length) return null;
  const f = rng.fresh(list, (x) => x.v);
  if (places && f.at?.length && rng.chance(0.35)) {
    const [en, zh] = rng.pick(f.at);
    return { ...f, rest: f.rest ? `${f.rest} ${en}` : en, zh: f.zh.startsWith('在') ? f.zh : zh + f.zh };
  }
  return f;
}
/** A subject from the pool, spread over the subjects on the sheet. */
export const pickSubject = (rng, pool) => rng.fresh(pool, (x) => x.en);

/** Statement with the time word first ("Every morning, Tom ...") about a third of the time in fill sections. */
export const timeFirst = (rng) => rng.chance(0.3);

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
