// Topic: present perfect — have / has + past participle, with already / just / yet / ever / never / for / since,
// and (level 3) telling it from the past simple by the time word.
import { blank, cap } from '../core.js';
import { VERBS, phrase, vform } from '../verbs.js';
import { actors, pickSubject, pickFrame, mid, third, wantAbbr, abbrMark, negInstruction, zhSent, S0 } from '../vcommon.js';

// Past participles that differ from the past form; every other verb uses its past form.
export const PP = { eat: 'eaten', drink: 'drunk', do: 'done', write: 'written', sing: 'sung', swim: 'swum', run: 'run', ride: 'ridden', take: 'taken', go: 'gone', draw: 'drawn',
  fly: 'flown', drive: 'driven', get: 'gotten', see: 'seen', come: 'come', wear: 'worn', speak: 'spoken', be: 'been' };
export const pp = (v) => PP[v] ?? VERBS[v].past;
const irregular = (v) => VERBS[v].sp.past === 'irr' || PP[v];

// Time words. use: 'done' (already / just / before / twice), 'yet' (negatives and questions), 'ever' (questions), 'never', 'for', 'since'
const CUES = [
  { en: 'already', zh: '已經', use: 'done', pos: 'mid', lvl: 1 }, { en: 'just', zh: '剛剛', use: 'done', pos: 'mid', lvl: 1 },
  { en: 'twice', zh: '兩次', use: 'done', pos: 'end', lvl: 1 }, { en: 'three times', zh: '三次', use: 'done', pos: 'end', lvl: 1 }, { en: 'before', zh: '以前', use: 'done', pos: 'end', lvl: 2 },
  { en: 'yet', zh: '還', use: 'yet', pos: 'end', lvl: 1 }, { en: 'ever', zh: '曾經', use: 'ever', pos: 'mid', lvl: 1 }, { en: 'never', zh: '從來沒有', use: 'never', pos: 'mid', lvl: 1 },
  { en: 'for two years', zh: '兩年了', use: 'for', pos: 'end', lvl: 3 }, { en: 'for three hours', zh: '三個小時了', use: 'for', pos: 'end', lvl: 3 }, { en: 'for a long time', zh: '很久了', use: 'for', pos: 'end', lvl: 3 },
  { en: 'since last year', zh: '從去年到現在', use: 'since', pos: 'end', lvl: 3 }, { en: 'since 2020', zh: '從 2020 年到現在', use: 'since', pos: 'end', lvl: 3 }, { en: 'since this morning', zh: '從今天早上到現在', use: 'since', pos: 'end', lvl: 3 },
];
// Activities you keep doing (for / since) are a smaller set than things you have done.
const LASTING = new Set(['play', 'study', 'learn', 'teach', 'practice', 'collect', 'sleep', 'use', 'read', 'watch', 'sit', 'wear', 'feed', 'walk', 'jog']);
const PAST_CUES = [['yesterday', '昨天'], ['last night', '昨晚'], ['last Sunday', '上星期天'], ['two days ago', '兩天前'], ['last month', '上個月']];

function draw(rng, o, use, endOnly = false) {
  const s = pickSubject(rng, actors(rng, o.level, { exclude: (x) => x.kind !== 'person' || x.tags.includes('every') }));
  const f = s && pickFrame(rng, s, o.level, (x) => x.pastOk && (o.level >= 2 || !irregular(x.v)) && (!['for', 'since'].includes(use) || LASTING.has(x.v)), null, use !== 'for' && use !== 'since');
  if (!f) return null;
  const cues = CUES.filter((c) => c.lvl <= o.level && (Array.isArray(use) ? use.includes(c.use) : c.use === use) && (!endOnly || c.pos === 'end'));
  const c = rng.fresh(cues, (x) => x.en); if (!c) return null;
  return { s, f, c };
}
const have = (s) => (third(s) ? 'has' : 'have');
const meta = (d, extra) => ({ subj: d.s.en, base: d.f.v, cue: d.c?.en, ...extra });
const zhDone = (d, neg) => {
  const { s, f, c } = d;
  if (c.use === 'yet') return zhSent(s, null, neg ? `還沒${f.zh}` : `${f.zh}了嗎`, neg ? '。' : '？');
  if (c.use === 'never') return zhSent(s, null, `從來沒有${f.zh}過`, '。');
  if (c.use === 'ever') return zhSent(s, null, `曾經${f.zh}過嗎`, '？');
  if (c.use === 'for' || c.use === 'since') return zhSent(s, null, `${c.zh.startsWith('從') ? c.zh : ''}${neg ? '沒有' : '一直'}${f.zh}${c.zh.startsWith('從') ? '' : c.zh}`, '。');
  if (c.en === 'before') return zhSent(s, null, `以前${f.zh}過`, '。');
  if (c.pos === 'end') return zhSent(s, null, `已經${f.zh}${c.zh}了`, '。');
  return zhSent(s, null, `${c.zh}${f.zh}了`, '。');
};

const MODES = [
  {
    id: 'fill', name: '肯定句填空', instruction: () => '依括號提示，用 have / has + 過去分詞填入現在完成式（一個空格填一個字）。',
    gen(rng, o) {
      const d = draw(rng, o, o.level >= 3 ? ['done', 'for', 'since'] : 'done'); if (!d) return null;
      const { s, f, c } = d;
      const line = c.pos === 'mid'
        ? [S0(s) + ' ', blank(have(s)), ` ${c.en} `, blank(pp(f.v)), ` (${f.v})${phrase(f)}.`]
        : [S0(s) + ' ', blank(have(s)), ' ', blank(pp(f.v)), ` (${f.v})${phrase(f)} ${c.en}.`];
      return { lines: [line], zh: zhDone(d, false), meta: meta(d, { kind: 'fill' }) };
    },
  },
  {
    id: 'neg', name: '否定句', instruction: (o) => negInstruction(o, '否定句（already 改成句尾的 yet）'),
    gen(rng, o) {
      const d = draw(rng, o, 'done'); if (!d) return null;
      const { s, f } = d;
      const abbr = wantAbbr(rng, o);
      const h = have(s);
      const bl = abbr ? [blank(h + "n't"), ' ', blank(pp(f.v))] : [blank(h), ' ', blank('not'), ' ', blank(pp(f.v))];
      const given = `${S0(s)} ${h} already ${pp(f.v)}${phrase(f)}.`;
      const dd = { ...d, c: CUES.find((c) => c.en === 'yet') };
      return { lines: [[given], ['→ ' + S0(s) + ' ', ...bl, `${phrase(f)} yet.${abbrMark(o, abbr)}`]], zh: zhDone(dd, true), meta: meta(dd, { kind: 'neg', abbr }) };
    },
  },
  {
    id: 'q', name: '疑問句與簡答', instruction: () => '用 Have / Has 完成問句（yet 或 ever），並依提示簡答（否定請用縮寫）。',
    gen(rng, o) {
      const d = draw(rng, o, o.level >= 2 ? ['yet', 'ever'] : 'yet'); if (!d) return null;
      const { s, f, c } = d;
      if (!s.reply) return null;
      const yes = rng.chance(0.5), h = have(s), r = s.reply, rh = r === 'I' || r === 'you' || r === 'we' || r === 'they' ? 'have' : 'has';
      const q = c.use === 'ever'
        ? [blank(cap(h)), ` ${mid(s.en)} ever `, blank(pp(f.v)), ` (${f.v})${phrase(f)}?`]
        : [blank(cap(h)), ` ${mid(s.en)} `, blank(pp(f.v)), ` (${f.v})${phrase(f)} yet?`];
      return { lines: [[...q, ` — ${yes ? 'Yes' : 'No'}, `, blank(r), ' ', blank(yes ? rh : rh + "n't"), '.']], zh: zhDone(d, false), meta: meta(d, { kind: 'q', yes }) };
    },
  },
  {
    id: 'never', name: 'never 與 ever', instruction: () => '依中文填入 have / has + never 或 ever + 過去分詞（一個空格填一個字）。',
    gen(rng, o) {
      const d = draw(rng, o, 'never'); if (!d) return null;
      const { s, f } = d;
      return { lines: [[S0(s) + ' ', blank(have(s)), ' ', blank('never'), ' ', blank(pp(f.v)), ` (${f.v})${phrase(f)}.`]], zh: zhDone(d, false), meta: meta(d, { kind: 'never' }) };
    },
  },
  {
    id: 'mix', name: '現在完成式或過去式', instruction: () => '看時間詞判斷：已經、曾經、for / since 用現在完成式，yesterday、ago 用過去式（空格可填一個或兩個字）。',
    gen(rng, o) {
      if (rng.fresh([true, false], (x) => 'mix-' + x)) {
        const d = draw(rng, o, ['done', 'for', 'since'], true); if (!d) return null;
        const { s, f, c } = d;
        return { lines: [[S0(s) + ' ', blank(`${have(s)} ${pp(f.v)}`, true), ` (${f.v})${phrase(f)} ${c.en}.`]], zh: zhDone(d, false), meta: meta(d, { kind: 'mix', perfect: true }) };
      }
      const s = pickSubject(rng, actors(rng, o.level, { exclude: (x) => x.kind !== 'person' || x.tags.includes('every') }));
      const f = s && pickFrame(rng, s, o.level, (x) => x.pastOk); if (!f) return null;
      const [t, tz] = rng.fresh(PAST_CUES, (x) => x[0]);
      return { lines: [[S0(s) + ' ', blank(vform(f, 'past'), true), ` (${f.v})${phrase(f)} ${t}.`]], zh: zhSent(s, { zh: tz }, f.zh, '。'), meta: { subj: s.en, base: f.v, cue: t, kind: 'mix', perfect: false } };
    },
  },
];

export default {
  id: 'perfect',
  code: 'PRF',
  title: '現在完成式',
  grade: 8,
  past: false,
  variety: { front: false }, // already / just sit inside the sentence; nothing goes first
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['fill', 'neg'], 2: ['fill', 'neg', 'q', 'never'], 3: ['fill', 'q', 'never', 'mix'] },
  levelHint: { 1: '規則動詞的過去分詞（-ed），already、just、yet。', 2: '加入不規則過去分詞（seen、eaten、gone…）、ever、never。', 3: '再加入 for / since，以及與過去式的分辨。' },
  grammarBox: (o) => ({ head: ['', '句型', '常用字'], rows: [
    ['肯定', 'have / has + 過去分詞', 'already、just' + (o.level >= 3 ? '、for + 一段時間、since + 起點' : '')],
    ['否定', "haven't / hasn't + 過去分詞", 'yet（放句尾）' + (o.level >= 2 ? '、never（放 have 後）' : '')],
    ['疑問', 'Have / Has + 主詞 + 過去分詞…?', 'yet' + (o.level >= 2 ? '、ever' : '')],
  ], note: (o.level >= 2 ? '不規則過去分詞：see → seen、eat → eaten、go → gone、do → done、write → written。' : '規則動詞的過去分詞和過去式一樣，加 -ed。') + (o.level >= 3 ? ' 有明確過去時間（yesterday、ago）的句子用過去式。' : '') }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
