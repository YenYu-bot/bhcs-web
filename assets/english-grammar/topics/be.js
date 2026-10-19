// Topic: Be verbs (am / is / are, was / were).
import { blank, cap, mid, zhJoin } from '../core.js';
import { SUBJECTS, PREDICATES, TIMES, extraSubjects } from '../lexicon.js';

export function beForm(s, past) {
  if (past) return s.num === 'pl' || s.person === 2 ? 'were' : 'was';
  if (s.person === 1 && s.num === 'sg') return 'am';
  return s.num === 'pl' || s.person === 2 ? 'are' : 'is';
}
/** Be form for a reply pronoun: "Yes, you are." */
export function replyBe(pron, past) {
  const s = { I: [1, 'sg'], you: [2, 'sg'], we: [1, 'pl'], they: [3, 'pl'], he: [3, 'sg'], she: [3, 'sg'], it: [3, 'sg'] }[pron];
  return beForm({ person: s[0], num: s[1] }, past);
}
const NEG = { is: "isn't", are: "aren't", was: "wasn't", were: "weren't" };

function predicateFits(p, s) {
  if (!p.for.includes(s.kind)) return false;
  if (s.tags.includes('group') && !(p.type === 'loc' || (p.type === 'adj' && p.dur === 'temp'))) return false;
  if (s.tags.includes('has-job') && p.type === 'job') return false; // "Our teachers are cooks" makes no sense
  if (p.num && p.num !== s.num) return false;
  if (p.type === 'job' && s.age !== 'any' && p.age !== s.age) return false;
  if (p.type === 'rel' && p.age && s.age !== 'any' && p.age !== s.age) return false;
  return true;
}
const predEn = (p, s) => (p.type === 'job' && s.num === 'pl' ? p.pl : p.en);

function subjectPool(rng, level) {
  return [...SUBJECTS.filter((s) => s.lvl <= level), ...extraSubjects(rng, level)];
}

/** Pick a tense for one question: 'pres' or 'past'. */
const pickTense = (rng, o) => (o.tense === 'P' ? 'pres' : o.tense === 'D' ? 'past' : rng.chance(0.5) ? 'pres' : 'past');

/** Pick a time word; in present-only sheets it is optional. */
function pickTime(rng, o, tense, s, p) {
  const fits = TIMES.filter((t) => t.tense === tense && (s.kind === 'weather' ? t.weather : t.dur.includes(p.dur) && (!t.types || t.types.includes(p.type))));
  if (o.tense === 'P' && rng.chance(p.dur === 'perm' ? 0.75 : 0.4)) return null;
  return fits.length ? rng.fresh(fits, (x) => x.en) : null;
}

/** One subject–predicate–time triple, or null when nothing fits. */
function draw(rng, o, { needReply = false, kinds = null, types = null, exclude = () => false } = {}) {
  const pool = subjectPool(rng, o.level).filter((s) => (!needReply || s.reply) && (!kinds || kinds.includes(s.kind)) && !exclude(s));
  if (!pool.length) return null;
  const s = rng.fresh(pool, (x) => x.en);
  const preds = PREDICATES.filter((p) => predicateFits(p, s) && (!types || types.includes(p.type)));
  if (!preds.length) return null;
  const p = rng.fresh(preds, (x) => x.en);
  const tense = pickTense(rng, o);
  const t = pickTime(rng, o, tense, s, p);
  if (o.tense !== 'P' && !t) return null;
  return { s, p, t, past: tense === 'past' };
}

const tail = (p, s, t) => ` ${predEn(p, s)}${t ? ' ' + t.en : ''}`;
const zhLine = (s, t, z, end) => (s.kind === 'weather' ? zhJoin(t?.zh, s.zh, z) : zhJoin(s.zh, t?.zh, z)) + end;

/** Contraction wanted for this item, from the sheet setting. "I am not" has no contraction, so I is never asked. */
function wantAbbr(rng, o) { return o.abbr === 'C' ? true : o.abbr === 'F' ? false : rng.chance(0.5); }

const MODES = [
  {
    id: 'fill', name: '肯定句填空',
    instruction: (o) => (o.level >= 3 ? '填入正確的 Be 動詞。' : '依括號提示，填入正確的 Be 動詞。'),
    gen(rng, o) {
      const d = draw(rng, o); if (!d) return null;
      const { s, p, t, past } = d;
      const hint = o.level >= 3 ? '' : ' (be)';
      const very = p.type === 'adj' && !['sick', 'late'].includes(p.en) && rng.chance(0.3) ? 'very ' : '';
      const pe = ' ' + very + predEn(p, s);
      const line = t && rng.chance(0.3)
        ? [`${cap(t.en)}, ${mid(s.en)} `, blank(beForm(s, past)), hint + pe + '.']
        : [cap(s.en) + ' ', blank(beForm(s, past)), hint + pe + (t ? ' ' + t.en : '') + '.'];
      return { lines: [line], zh: zhLine(s, t, p.zh.pos, '。') };
    },
  },
  {
    id: 'neg', name: '否定句',
    instruction: (o) => ({ F: '改成否定句（不用縮寫）。', C: '改成否定句（請用縮寫）。', B: '改成否定句；括號寫「縮寫」的請用縮寫。' }[o.abbr]),
    gen(rng, o) {
      const abbr = wantAbbr(rng, o);
      const d = draw(rng, o, { exclude: (s) => s.tags.includes('every') || (abbr && s.person === 1 && s.num === 'sg') }); if (!d) return null;
      const { s, p, t, past } = d;
      const be = beForm(s, past);
      const given = `${cap(s.en)} ${be}${tail(p, s, t)}.`;
      const blanks = abbr ? [blank(NEG[be])] : [blank(be), ' ', blank('not')];
      const mark = o.abbr === 'B' ? (abbr ? '（縮寫）' : '（不縮寫）') : '';
      return {
        lines: [[given], ['→ ' + cap(s.en) + ' ', ...blanks, tail(p, s, t) + '.' + (mark ? ' ' + mark : '')]],
        zh: zhLine(s, t, p.zh.neg, '。'),
      };
    },
  },
  {
    id: 'q', name: '疑問句',
    instruction: () => '改成疑問句。',
    gen(rng, o) {
      const d = draw(rng, o, { exclude: (s) => s.tags.includes('every') }); if (!d) return null;
      const { s, p, t, past } = d;
      const be = beForm(s, past);
      return {
        lines: [[`${cap(s.en)} ${be}${tail(p, s, t)}.`], ['→ ', blank(cap(be)), ` ${s.en}${tail(p, s, t)}?`]],
        zh: zhLine(s, t, p.zh.q, '嗎？'),
      };
    },
  },
  {
    id: 'short', name: '簡答',
    instruction: () => '填入 Be 動詞，並完成簡答（否定簡答請用縮寫）。',
    gen(rng, o) {
      const d = draw(rng, o, { needReply: true }); if (!d) return null;
      const { s, p, t, past } = d;
      if (s.person === 1 && p.dur === 'perm') return null; // "Was I a writer?" is not a question anyone asks
      const be = beForm(s, past), rb = replyBe(s.reply, past), yes = rng.chance(0.5);
      const ans = yes ? [blank(s.reply), ' ', blank(rb)] : [blank(s.reply), ' ', blank(NEG[rb] || rb)];
      if (!yes && rb === 'am') return null;
      return {
        lines: [[blank(cap(be)), ` ${s.en}${tail(p, s, t)}? — ${yes ? 'Yes' : 'No'}, `, ...ans, '.']],
        zh: zhLine(s, t, p.zh.q, '嗎？'),
      };
    },
  },
  {
    id: 'full', name: '詳答',
    instruction: () => '依問句回答：先簡答（否定請用縮寫），再寫出正確的情況。',
    gen(rng, o) {
      const d = draw(rng, o, { needReply: true, kinds: ['person', 'animal', 'thing', 'food', 'drink'], types: ['loc', 'job'], exclude: (s) => s.person === 1 }); if (!d) return null;
      const { s, p, t, past } = d;
      const alts = PREDICATES.filter((x) => x.type === p.type && x !== p && predicateFits(x, s));
      if (!alts.length) return null;
      const q = rng.pick(alts);
      const be = beForm(s, past), rb = replyBe(s.reply, past);
      return {
        lines: [
          [`${cap(be)} ${s.en}${tail(p, s, t)}?`],
          ['— No, ', blank(s.reply), ' ', blank(NEG[rb]), '. ', blank(cap(s.reply)), ' ', blank(rb), ` ${predEn(q, s)}.`],
        ],
        zh: zhLine(s, t, p.zh.q, '嗎？'),
      };
    },
  },
  {
    id: 'wh', name: '疑問詞問句',
    instruction: () => '填入正確的 Be 動詞。',
    gen(rng, o) {
      const kind = rng.pick(o.tense === 'D' ? ['where', 'what'] : ['where', 'what', 'who']);
      if (kind === 'who') {
        const who = rng.pick([
          ['that girl', '那個女孩', 'sg', 'my sister'], ['that boy', '那個男孩', 'sg', 'my brother'],
          ['that man', '那位男士', 'sg', 'my uncle'], ['that woman', '那位女士', 'sg', 'my aunt'],
          ['those girls', '那些女孩', 'pl', 'my sisters'], ['those boys', '那些男孩', 'pl', 'my brothers'],
        ]);
        if (o.tense !== 'P') return null; // "Who was that girl?" needs more context than one line
        return { lines: [['Who ', blank(who[2] === 'pl' ? 'are' : 'is'), ` ${who[0]}? — ${cap(who[3])}.`]], zh: `${who[1]}是誰？` };
      }
      const d = draw(rng, o, kind === 'where'
        ? { kinds: ['person', 'animal', 'thing', 'food', 'drink'], types: ['loc'] }
        : { kinds: ['person'], types: ['job'], exclude: (s) => s.person !== 3 });
      if (!d) return null;
      const { s, p, t, past } = d;
      const be = beForm(s, past);
      const ansEn = cap(predEn(p, s));
      return kind === 'where'
        ? { lines: [['Where ', blank(be), ` ${s.en}${t ? ' ' + t.en : ''}? — ${ansEn}.`]], zh: zhLine(s, t, '在哪裡', '？') }
        : { lines: [['What ', blank(be), ` ${s.en}${t ? ' ' + t.en : ''}? — ${ansEn}.`]], zh: zhLine(s, t, '是做什麼的', '？') };
    },
  },
];

export default {
  id: 'be',
  code: 'BE',
  title: 'Be 動詞',
  grade: 7,
  past: true,
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['fill'], 2: ['fill', 'neg', 'q', 'short'], 3: ['fill', 'neg', 'q', 'short', 'full', 'wh'] },
  levelHint: { 1: '主詞只用代名詞，以肯定句為主，括號附提示。', 2: '加入人名與名詞片語，肯定、否定、疑問混合。', 3: '加入易錯主詞（Ben and I、every student、不可數名詞），不給提示。' },
  grammarBox: (o) => {
    const rows = [['I', 'am', 'was'], ['he / she / it、單數名詞', 'is', 'was'], ['you / we / they、複數名詞', 'are', 'were']];
    return { head: ['主詞', '現在式', '過去式'], rows: o.tense === 'P' ? rows.map((r) => r.slice(0, 2)) : o.tense === 'D' ? rows.map((r) => [r[0], r[2]]) : rows,
      note: '否定：Be 動詞後加 not（is not = isn’t）。疑問：Be 動詞移到句首。' };
  },
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
