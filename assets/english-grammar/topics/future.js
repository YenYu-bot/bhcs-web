// Topic: future — will + V and be going to + V, with negatives, questions and short answers.
import { blank } from '../core.js';
import { VERBS, phrase } from '../verbs.js';
import { actors, pickSubject, pickFrame, timeFirst, mid, wantAbbr, abbrMark, negInstruction, zhSent, S0, cap, asked, askActors, pickAsked, replyKey, mealFits } from '../vcommon.js';
import { beForm, replyBe } from './be.js';

const TIMES = [
  { en: 'tomorrow', zh: '明天' }, { en: 'tonight', zh: '今晚' }, { en: 'next week', zh: '下星期' }, { en: 'next Sunday', zh: '下星期天' },
  { en: 'this weekend', zh: '這個週末' }, { en: 'tomorrow morning', zh: '明天早上' }, { en: 'this afternoon', zh: '今天下午' }, { en: 'next Saturday', zh: '下星期六' },
  { en: 'after school tomorrow', zh: '明天放學後' }, { en: 'this Saturday', zh: '這個星期六' }, { en: 'tomorrow evening', zh: '明天傍晚' },
];
// Which form a question uses: 'will' or 'going'. Level 1 will only, level 2 be going to only in its own share, level 3 both.
const formFor = (rng, o) => (o.level === 1 ? 'will' : rng.fresh(['will', 'going'], (x) => 'form-' + x));
const HINT = { will: 'will', going: 'be going to' };

function draw(rng, o, { ask = false, test = () => true } = {}) {
  const exclude = (x) => x.kind !== 'person' || x.tags.includes('every');
  // ask: a question put to the listener — "your" subjects, the listener, and the speaker ("Will we …?")
  const s = ask ? pickAsked(rng, askActors(rng, o.level, { exclude, self: 'we', reply: true })) : pickSubject(rng, actors(rng, o.level, { exclude }));
  const f = s && pickFrame(rng, s, o.level, (x) => x.habit && !x.age && test(x)); // plans: things anyone might do
  if (!f) return null;
  const t = rng.fresh(TIMES.filter((x) => !(x.en.includes('school') && s.age === 'adult') && mealFits(`${f.v} ${f.rest || ''}`, x.en)), (x) => x.en);
  if (!t) return null;
  return { s, f, t, form: formFor(rng, o) };
}
const meta = (d, extra) => ({ subj: d.s.en, base: d.f.v, cue: d.t.en, form: d.form, ...extra });
// "is going to" as blanks: [is] [going] [to] [verb]
const goingBlanks = (s, v) => [blank(beForm(s, false)), ' ', blank('going'), ' ', blank('to'), ' ', blank(v)];
const ZH = { will: '會', going: '打算' };

const MODES = [
  {
    id: 'fill', name: '肯定句填空',
    instruction: (o) => (o.level === 1 ? '依括號提示，用 will 填入未來式。' : '依括號提示，用 will 或 be going to 填入未來式（一個空格填一個字）。'),
    gen(rng, o) {
      const d = draw(rng, o); if (!d) return null;
      const { s, f, t, form } = d;
      const bl = form === 'will' ? [blank('will'), ' ', blank(f.v)] : goingBlanks(s, f.v);
      const line = timeFirst(rng)
        ? [`${cap(t.en)}, ${mid(s.en)} `, ...bl, `${phrase(f)}. (${HINT[form]}／${f.v})`]
        : [S0(s) + ' ', ...bl, `${phrase(f)} ${t.en}. (${HINT[form]}／${f.v})`];
      return { lines: [line], zh: zhSent(s, t, ZH[form] + f.zh, '。'), meta: meta(d, { kind: 'fill' }) };
    },
  },
  {
    id: 'neg', name: '否定句', instruction: (o) => negInstruction(o),
    gen(rng, o) {
      // "won't have lunch tomorrow" says more than it means: meals are not denied
      const d = draw(rng, o, { test: (x) => !/\b(breakfast|lunch|dinner)\b/.test(x.rest || '') }); if (!d) return null;
      const { s, f, t, form } = d;
      const abbr = wantAbbr(rng, o);
      const given = form === 'will' ? `${S0(s)} will ${f.v}${phrase(f)} ${t.en}.` : `${S0(s)} ${beForm(s, false)} going to ${f.v}${phrase(f)} ${t.en}.`;
      let bl;
      if (form === 'will') bl = abbr ? [blank("won't"), ' ', blank(f.v)] : [blank('will'), ' ', blank('not'), ' ', blank(f.v)];
      else {
        const be = beForm(s, false), neg = { am: null, is: "isn't", are: "aren't" }[be];
        const ab = abbr && neg;
        bl = ab ? [blank(neg), ' ', blank('going'), ' ', blank('to'), ' ', blank(f.v)] : [blank(be), ' ', blank('not'), ' ', blank('going'), ' ', blank('to'), ' ', blank(f.v)];
        return { lines: [[given], ['→ ' + S0(s) + ' ', ...bl, `${phrase(f)} ${t.en}.${abbrMark(o, !!ab)}`]], zh: zhSent(s, t, '不' + ZH[form] + f.zh, '。'), meta: meta(d, { kind: 'neg', abbr: !!ab }) };
      }
      return { lines: [[given], ['→ ' + S0(s) + ' ', ...bl, `${phrase(f)} ${t.en}.${abbrMark(o, abbr)}`]], zh: zhSent(s, t, '不' + ZH[form] + f.zh, '。'), meta: meta(d, { kind: 'neg', abbr }) };
    },
  },
  {
    id: 'q', name: '疑問句', instruction: () => '改成疑問句。',
    gen(rng, o) {
      const d = draw(rng, o); if (!d) return null;
      const { s, f, t, form } = d;
      const given = form === 'will' ? `${S0(s)} will ${f.v}${phrase(f)} ${t.en}.` : `${S0(s)} ${beForm(s, false)} going to ${f.v}${phrase(f)} ${t.en}.`;
      const a = asked(s); // 改疑問句: I → you, my → your
      const bl = form === 'will' ? [blank('Will'), ` ${mid(a.en)} `, blank(f.v)] : [blank(cap(beForm(a, false))), ` ${mid(a.en)} `, blank('going'), ' ', blank('to'), ' ', blank(f.v)];
      return { lines: [[given], ['→ ', ...bl, `${phrase(f)} ${t.en}?`]], zh: zhSent(a, t, ZH[form] + f.zh, '嗎？'), meta: meta(d, { kind: 'q', asked: a.en }) };
    },
  },
  {
    id: 'short', name: '簡答', instruction: () => '依提示完成簡答（否定請用縮寫）。',
    gen(rng, o) {
      const d = draw(rng, o, { ask: true }); if (!d) return null;
      const { s, f, t, form } = d;
      const yes = rng.chance(0.5);
      const r = s.reply;
      const q = form === 'will' ? `Will ${mid(s.en)} ${f.v}${phrase(f)} ${t.en}?` : `${cap(beForm(s, false))} ${mid(s.en)} going to ${f.v}${phrase(f)} ${t.en}?`;
      const aux = form === 'will' ? (yes ? 'will' : "won't") : (yes ? replyBe(r, false) : { am: "I'm not", is: "isn't", are: "aren't" }[replyBe(r, false)]);
      const bl = aux === "I'm not" ? [blank("I'm"), ' ', blank('not')] : [blank(replyKey(s)), ' ', blank(aux)];
      return { lines: [[`${q} — ${yes ? 'Yes' : 'No'}, `, ...bl, '.']], zh: zhSent(s, t, ZH[form] + f.zh, '嗎？'), meta: meta(d, { kind: 'short', yes }) };
    },
  },
];

export default {
  id: 'future',
  code: 'FUT',
  title: '未來式 will / be going to',
  grade: 7,
  past: false,
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['fill', 'neg'], 2: ['fill', 'neg', 'q'], 3: ['fill', 'neg', 'q', 'short'] },
  levelHint: { 1: '只用 will。', 2: '加入 be going to，題目會標明用哪一種。', 3: '再加入簡答。' },
  grammarBox: (o) => ({ head: ['', 'will', ...(o.level >= 2 ? ['be going to'] : [])], rows: [
    ['肯定', 'will + 原形', ...(o.level >= 2 ? ['am / is / are going to + 原形'] : [])],
    ['否定', "will not = won't", ...(o.level >= 2 ? ['am / is / are not going to'] : [])],
    ['疑問', 'Will + 主詞 + 原形…?', ...(o.level >= 2 ? ['Am / Is / Are + 主詞 + going to…?'] : [])],
  ], note: '未來的時間：tomorrow、tonight、next week、this weekend。will 後面一律接原形動詞。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
