// Topic: progressive (am / is / are + V-ing; with the past option, was / were + V-ing).
// Advanced sheets mix present-simple sentences into the fill section, told apart by "now" or "every day".
import { blank } from '../core.js';
import { VERBS, vform, phrase, cuesFor } from '../verbs.js';
import { actors, pickSubject, timeFirst, mid, third, pickFrame, wantAbbr, abbrMark, negInstruction, zhSent, zhAspect, S0, cap, asked, askActors, pickAsked, replyKey } from '../vcommon.js';
import { beForm, replyBe } from './be.js';

const NEG = { is: "isn't", are: "aren't", was: "wasn't", were: "weren't" };
const pickTense = (rng, o) => (o.tense === 'P' ? 'now' : o.tense === 'D' ? 'pastprog' : rng.chance(0.5) ? 'now' : 'pastprog');

const MOMENT = new Set(['open', 'close', 'arrive', 'leave', 'break', 'lose', 'find']);
function draw(rng, o, { exclude = () => false, ask = false, test = () => true } = {}) {
  // ask: a question to the listener ("your" subjects, you, and "Are we …?")
  const s = ask ? pickAsked(rng, askActors(rng, o.level, { exclude, self: 'we', reply: true })) : pickSubject(rng, actors(rng, o.level, { exclude }));
  // open / close happen in a moment: "were opening the window at this time yesterday" is left out
  const f = s && pickFrame(rng, s, o.level, (x) => x.prog && !MOMENT.has(x.v) && test(x), 'ing');
  if (!f) return null;
  const use = pickTense(rng, o);
  const t = rng.fresh(cuesFor(f, use, s), (x) => x.en);
  if (!t) return null;
  return { s, f, t, past: use === 'pastprog' };
}
const zhProg = (d, neg) => zhSent(d.s, d.t, zhAspect(neg ? '沒有在' : '正在', d.f.zh), '');
const meta = (d, extra) => ({ subj: d.s.en, base: d.f.v, cue: d.t.en, ...extra });

const MODES = [
  {
    id: 'fill', name: '肯定句填空',
    instruction: (o) => (o.level >= 3 ? '依括號提示與時間詞，填入動詞的正確形式（進行式或現在簡單式）。' : '依括號提示，填入 Be 動詞與動詞的 -ing 形式。'),
    gen(rng, o) {
      if (o.level >= 3 && o.tense !== 'D' && rng.chance(0.35)) {
        // present simple, told apart from "now" by the time word
        const s = pickSubject(rng, actors(rng, o.level)); const f = s && pickFrame(rng, s, o.level, (x) => x.habit && x.prog);
        if (!f) return null;
        const t = rng.fresh(cuesFor(f, 'habit', s), (x) => x.en); if (!t) return null;
        const ans = third(s) ? vform(f, 's') : VERBS[f.v].base;
        return { lines: [[S0(s) + ' ', blank(ans, true), ` (${f.v})${phrase(f)} ${t.en}.`]], zh: zhSent(s, t, f.zh, '。'), meta: { subj: s.en, base: f.v, cue: t.en, kind: 'mixed' } };
      }
      const d = draw(rng, o); if (!d) return null;
      const { s, f, t, past } = d;
      const be = beForm(s, past), ing = vform(f, 'ing');
      const parts = o.level >= 3 ? [blank(`${be} ${ing}`, true)] : [blank(be), ' ', blank(ing)];
      const line = timeFirst(rng)
        ? [`${cap(t.en)}, ${mid(s.en)} `, ...parts, ` (${f.v})${phrase(f)}.`]
        : [S0(s) + ' ', ...parts, ` (${f.v})${phrase(f)} ${t.en}.`];
      return { lines: [line], zh: zhProg(d) + '。', meta: meta(d, { kind: o.level >= 3 ? 'mixed' : 'prog' }) };
    },
  },
  {
    id: 'neg', name: '否定句', instruction: (o) => negInstruction(o),
    gen(rng, o) {
      const abbr = wantAbbr(rng, o);
      const d = draw(rng, o, { exclude: (s) => s.tags.includes('every') || (abbr && s.person === 1 && s.num === 'sg') }); if (!d) return null;
      const { s, f, t, past } = d;
      const be = beForm(s, past), ing = vform(f, 'ing');
      const bl = abbr ? [blank(NEG[be])] : [blank(be), ' ', blank('not')];
      return {
        lines: [[`${S0(s)} ${be} ${ing}${phrase(f)} ${t.en}.`], ['→ ' + S0(s) + ' ', ...bl, ` ${ing}${phrase(f)} ${t.en}.${abbrMark(o, abbr)}`]],
        zh: zhProg(d, true) + '。', meta: meta(d, { kind: 'neg', abbr }),
      };
    },
  },
  {
    id: 'q', name: '疑問句', instruction: () => '改成疑問句。',
    gen(rng, o) {
      const d = draw(rng, o, { exclude: (s) => s.tags.includes('every') }); if (!d) return null;
      const { s, f, t, past } = d;
      const a = asked(s), ing = vform(f, 'ing'); // 改疑問句: I → you, my → your
      return {
        lines: [[`${S0(s)} ${beForm(s, past)} ${ing}${phrase(f)} ${t.en}.`], ['→ ', blank(cap(beForm(a, past))), ` ${mid(a.en)} ${ing}${phrase(f)} ${t.en}?`]],
        zh: zhProg({ ...d, s: a }) + '嗎？', meta: meta(d, { kind: 'q', asked: a.en }),
      };
    },
  },
  {
    id: 'short', name: '簡答', instruction: () => '填入 Be 動詞，並完成簡答（否定簡答請用縮寫）。',
    gen(rng, o) {
      const d = draw(rng, o, { exclude: (s) => s.tags.includes('every'), ask: true }); if (!d) return null;
      const { s, f, t, past } = d;
      const be = beForm(s, past), rb = replyBe(s.reply, past), yes = rng.chance(0.5);
      if (!yes && rb === 'am') return null; // "No, I amn't" does not exist
      return {
        lines: [[blank(cap(be)), ` ${s.en} ${vform(f, 'ing')}${phrase(f)} ${t.en}? — ${yes ? 'Yes' : 'No'}, `, blank(replyKey(s)), ' ', blank(yes ? rb : NEG[rb]), '.']],
        zh: zhProg(d) + '嗎？', meta: meta(d, { kind: 'reply' }),
      };
    },
  },
  {
    id: 'full', name: '詳答', instruction: () => '依問句回答：先簡答（否定請用縮寫），再依括號提示寫出他們正在做的事。',
    gen(rng, o) {
      const d = draw(rng, o, { exclude: (s) => s.tags.includes('every') || s.person === 1 || s.reply === 'I', ask: true }); if (!d) return null;
      const { s, f, t, past } = d;
      const g = pickFrame(rng, s, o.level, (x) => x.prog && !MOMENT.has(x.v) && x.v !== f.v && cuesFor(x, past ? 'pastprog' : 'now', s).some((c) => c.en === t.en), 'ing'); if (!g) return null;
      const be = beForm(s, past), rb = replyBe(s.reply, past);
      return {
        lines: [[`${cap(be)} ${s.en} ${vform(f, 'ing')}${phrase(f)} ${t.en}?`],
          ['— No, ', blank(s.reply), ' ', blank(NEG[rb]), '. ', blank(cap(s.reply)), ' ', blank(rb), ' ', blank(vform(g, 'ing')), ` (${g.v})${phrase(g)}.`]],
        zh: zhProg(d) + '嗎？', meta: meta(d, { kind: 'full', alt: g.v }),
      };
    },
  },
  {
    id: 'wh', name: '疑問詞問句', instruction: () => '填入 Be 動詞與 doing。',
    gen(rng, o) {
      // "What is she doing? — She is smiling." answers nothing; the reply is an activity
      const d = draw(rng, o, { exclude: (s) => s.person === 1 || s.tags.includes('every'), ask: true, test: (x) => !['smile', 'cry', 'hurry'].includes(x.v) }); if (!d) return null;
      const { s, f, t, past } = d;
      const be = beForm(s, past);
      return {
        lines: [['What ', blank(be), ` ${s.en} `, blank('doing'), ` ${t.en}? — ${cap(s.reply)} ${replyBe(s.reply, past)} ${vform(f, 'ing')}${phrase(f)}.`]],
        zh: zhSent(s, t, '正在做什麼', '？'), meta: meta(d, { kind: 'wh' }),
      };
    },
  },
];

export default {
  id: 'progressive',
  code: 'PRG',
  title: '進行式',
  grade: 7,
  past: true,
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['fill'], 2: ['fill', 'neg', 'q', 'short'], 3: ['fill', 'neg', 'q', 'short', 'full', 'wh'] },
  levelHint: { 1: '主詞只用代名詞，動詞直接加 -ing。', 2: '加入人名與名詞片語，含去 e、重複字尾，肯定、否定、疑問混合。', 3: '填空題混入現在簡單式，要看 now 或 every day 判斷；全部句型。' },
  grammarBox: (o) => ({ head: ['時態', '句型', '時間詞'], rows: [
    ...(o.tense !== 'D' ? [['現在進行式', 'am / is / are + V-ing', 'now、right now']] : []),
    ...(o.tense !== 'P' ? [['過去進行式', 'was / were + V-ing', 'at eight last night、at this time yesterday']] : []),
  ], note: 'V-ing：字尾 e 去 e（write → writing）；短母音加一個子音要重複字尾（swim → swimming）。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
