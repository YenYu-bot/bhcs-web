// Topic: can / can't (with the past option, could / couldn't).
import { blank } from '../core.js';
import { VTIMES, phrase } from '../verbs.js';
import { actors, pickSubject, timeFirst, mid, pickFrame, wantAbbr, abbrMark, negInstruction, zhSent, S0, cap } from '../vcommon.js';

const pickTense = (rng, o) => (o.tense === 'P' ? false : o.tense === 'D' ? true : rng.chance(0.5));
const modal = (past) => (past ? 'could' : 'can');
/** Negative forms: contracted is one word; uncontracted is "cannot" (one word) or "could not" (two). */
const negWords = (past, abbr) => (abbr ? [past ? "couldn't" : "can't"] : past ? ['could', 'not'] : ['cannot']);

function draw(rng, o, { exclude = () => false } = {}) {
  const s = pickSubject(rng, actors(rng, o.level, { exclude }));
  const f = s && pickFrame(rng, s, o.level, (x) => x.able);
  if (!f) return null;
  const past = pickTense(rng, o);
  const pool = VTIMES.filter((t) => t.use === (past ? 'ablepast' : 'able'));
  const t = o.tense === 'P' && rng.chance(0.6) ? null : rng.pick(pool);
  return { s, f, t, past };
}
const tail = (f, t) => `${phrase(f)}${t ? ' ' + t.en : ''}`;
const zhCan = (d, neg, end) => zhSent(d.s, d.t, (neg ? '不會' : '會') + d.f.zh, end);
const meta = (d, extra) => ({ subj: d.s.en, base: d.f.v, cue: d.t?.en ?? null, past: d.past, ...extra });
const noFirst = (s) => s.person === 1 || (s.person === 2 && s.num === 'sg') || s.tags.includes('every');

const MODES = [
  {
    id: 'fill', name: '依中文填空', instruction: (o) => `依括號裡的中文與動詞填空${o.abbr === 'F' ? '（否定不用縮寫）' : o.abbr === 'C' ? '（否定請用縮寫）' : '；括號寫「縮寫」的請用縮寫'}。`,
    gen(rng, o) {
      const d = draw(rng, o); if (!d) return null;
      const { s, f, t, past } = d;
      const neg = o.level >= 2 && rng.chance(0.45);
      const abbr = neg && wantAbbr(rng, o);
      const words = neg ? negWords(past, abbr) : [modal(past)];
      const bl = [...words, f.v].flatMap((w, i) => (i ? [' ', blank(w)] : [blank(w)]));
      const mark = neg ? abbrMark(o, abbr) : '';
      const front = t && timeFirst(rng);
      return {
        lines: [front ? [`${cap(t.en)}, ${mid(s.en)} `, ...bl, `${phrase(f)}. (${neg ? '不會' : '會'}／${f.v})${mark}`] : [S0(s) + ' ', ...bl, `${tail(f, t)}. (${neg ? '不會' : '會'}／${f.v})${mark}`]],
        zh: zhCan(d, neg, '。'), meta: meta(d, { kind: 'fill', neg, abbr }),
      };
    },
  },
  {
    id: 'neg', name: '否定句', instruction: (o) => negInstruction(o),
    gen(rng, o) {
      const d = draw(rng, o, { exclude: (s) => s.tags.includes('every') }); if (!d) return null;
      const { s, f, t, past } = d;
      const abbr = wantAbbr(rng, o);
      const bl = negWords(past, abbr).flatMap((w, i) => (i ? [' ', blank(w)] : [blank(w)]));
      return {
        lines: [[`${S0(s)} ${modal(past)} ${f.v}${tail(f, t)}.`], ['→ ' + S0(s) + ' ', ...bl, ` ${f.v}${tail(f, t)}.${abbrMark(o, abbr)}`]],
        zh: zhCan(d, true, '。'), meta: meta(d, { kind: 'neg', abbr }),
      };
    },
  },
  {
    id: 'q', name: '疑問句', instruction: () => '改成疑問句。',
    gen(rng, o) {
      const d = draw(rng, o, { exclude: noFirst }); if (!d) return null;
      const { s, f, t, past } = d;
      return {
        lines: [[`${S0(s)} ${modal(past)} ${f.v}${tail(f, t)}.`], ['→ ', blank(cap(modal(past))), ` ${s.en} ${f.v}${tail(f, t)}?`]],
        zh: zhCan(d, false, '嗎？'), meta: meta(d, { kind: 'q' }),
      };
    },
  },
  {
    id: 'short', name: '簡答', instruction: () => '填入 Can 或 Could，並完成簡答（否定簡答請用縮寫）。',
    gen(rng, o) {
      const d = draw(rng, o, { exclude: (s) => noFirst(s) || !s.reply }); if (!d) return null;
      const { s, f, t, past } = d;
      const yes = rng.chance(0.5);
      return {
        lines: [[blank(cap(modal(past))), ` ${s.en} ${f.v}${tail(f, t)}? — ${yes ? 'Yes' : 'No'}, `, blank(s.reply), ' ', blank(yes ? modal(past) : negWords(past, true)[0]), '.']],
        zh: zhCan(d, false, '嗎？'), meta: meta(d, { kind: 'reply' }),
      };
    },
  },
  {
    id: 'full', name: '詳答', instruction: () => '依問句回答：先簡答（否定請用縮寫），再依括號提示寫出會做的事。',
    gen(rng, o) {
      const d = draw(rng, o, { exclude: (s) => noFirst(s) || !s.reply }); if (!d) return null;
      const { s, f, t, past } = d;
      const g = pickFrame(rng, s, o.level, (x) => x.able && x.v !== f.v); if (!g) return null;
      return {
        lines: [[`${cap(modal(past))} ${s.en} ${f.v}${tail(f, t)}?`],
          ['— No, ', blank(s.reply), ' ', blank(negWords(past, true)[0]), '. ', blank(cap(s.reply)), ' ', blank(modal(past)), ' ', blank(g.v), ` (${g.v})${phrase(g)}.`]],
        zh: zhCan(d, false, '嗎？'), meta: meta(d, { kind: 'full', alt: g.v }),
      };
    },
  },
];

export default {
  id: 'can',
  code: 'CAN',
  title: '助動詞 can',
  grade: 7,
  past: true,
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['fill'], 2: ['fill', 'neg', 'q', 'short'], 3: ['fill', 'neg', 'q', 'short', 'full'] },
  levelHint: { 1: '主詞只用代名詞，只考肯定句。', 2: '加入人名與名詞片語，肯定與否定混合。', 3: '加入易錯主詞（Ben and I、every student、the children），全部句型。' },
  grammarBox: (o) => ({ head: ['', ...(o.tense !== 'D' ? ['現在'] : []), ...(o.tense !== 'P' ? ['過去'] : [])],
    rows: [['肯定', ...(o.tense !== 'D' ? ['can + 原形'] : []), ...(o.tense !== 'P' ? ['could + 原形'] : [])],
      ['否定', ...(o.tense !== 'D' ? ["cannot / can't + 原形"] : []), ...(o.tense !== 'P' ? ["could not / couldn't + 原形"] : [])]],
    note: 'can 後面的動詞一律用原形，不加 s（He can swim.）。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
