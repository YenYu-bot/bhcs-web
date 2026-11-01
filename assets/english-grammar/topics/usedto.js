// Topic: used to + V (a past habit that has stopped) and be used to + V-ing (being accustomed to something).
//   Tom used to play basketball after school.   Did Tom use to …? / Tom didn't use to …   Tom is used to getting up early.
import { blank, cap, mid, zhJoin } from '../core.js';
import { VERBS, phrase } from '../verbs.js';
import { actors, pickSubject, pickFrame } from '../vcommon.js';
import { beForm } from './be.js';

// When the habit was: these keep "used to" about the past and give the Chinese its 以前 / 小時候.
const WHEN = [['', '以前'], ['when he was young', '小時候'], ['', '以前'], ['when she was a child', '小時候']];
// habits that make sense to have had and stopped; meals and sleep are left out ("used to eat breakfast")
const habit = (x) => x.habit && !/\b(breakfast|lunch|dinner)\b/.test(x.rest || '') && !['sleep', 'smile', 'cry', 'hurry', 'close', 'open'].includes(x.v);
const people = (rng, o, exclude = () => false) => actors(rng, o.level, { exclude: (s) => s.kind !== 'person' || s.tags.includes('every') || s.tags.includes('group') || exclude(s) });
/** "when he was young" agrees with the subject; plural subjects and I / you take "when they were young" etc. */
function whenFor(rng, s) {
  const [w, wz] = rng.pick(WHEN);
  if (!w) return [w, wz];
  // one person was "a child"; several were "young"
  const p = pron(s), be = ['I', 'he', 'she'].includes(p) ? 'was' : 'were';
  return [be === 'was' ? w.replace(/(he|she) was/, `${p} was`) : `when ${p} were young`, wz];
}
/** The pronoun for the subject later in the sentence, and its present negative. */
const pron = (s) => (s.en === 'I' ? 'I' : s.en === 'you' ? 'you' : s.en === 'we' || s.tags.includes('with-i') ? 'we' : s.num === 'pl' ? 'they' : s.reply === 'she' ? 'she' : 'he');
const dont = (s) => (['he', 'she'].includes(pron(s)) ? "doesn't" : "don't");
const meta = (s, f, extra) => ({ subj: s.en, base: f.v, ...extra });
// accustomed to: things one gets used to doing
//   routines and daily work, not hobbies ("is used to playing the violin")
const USED = (x) => x.habit && ['get', 'walk', 'take', 'wash', 'clean', 'cook', 'ride', 'do', 'drink', 'go', 'study', 'feed', 'help', 'eat'].includes(x.v);

const MODES = [
  {
    id: 'fill', name: 'used to + 原形', instruction: () => '「以前常常…（現在不再）」用 used to + 原形動詞：依括號提示填入（一個空格填一個字）。',
    gen(rng, o) {
      const s = pickSubject(rng, people(rng, o)); if (!s) return null;
      const f = pickFrame(rng, s, o.level, habit); if (!f) return null;
      const [w, wz] = whenFor(rng, s);
      const front = w && rng.chance(0.5);
      const line = front
        ? [`${cap(w)}, ${s.en} `, blank('used'), ' ', blank('to'), ' ', blank(f.v), ` (${f.v})${phrase(f)}.`]
        : [`${cap(s.en)} `, blank('used'), ' ', blank('to'), ' ', blank(f.v), ` (${f.v})${phrase(f)}${w ? ' ' + w : ''}.`];
      return { lines: [line], zh: zhJoin(s.zh, wz, '常常' + f.zh) + '。', meta: meta(s, f, { kind: 'fill' }) };
    },
  },
  {
    id: 'negq', name: '否定與疑問', instruction: () => "否定句用 didn't use to，疑問句用 Did … use to（use 不加 d）：依括號提示填入。",
    gen(rng, o) {
      const s = pickSubject(rng, people(rng, o, (x) => x.en === 'I')); if (!s) return null;
      const f = pickFrame(rng, s, o.level, habit); if (!f) return null;
      if (rng.fresh([true, false], (x) => 'negq-' + x)) {
        return { lines: [[`${cap(s.en)} `, blank("didn't"), ' ', blank('use'), ' ', blank('to'), ` ${f.v}${phrase(f)}.`]], zh: zhJoin(s.zh, '以前不常' + f.zh) + '。', meta: meta(s, f, { kind: 'neg' }) };
      }
      if (s.person === 1) return null; // "Did we use to …?" asks what the speaker knows
      const yes = rng.chance(0.5), pr = s.en === 'you' ? 'I' : s.tags.includes('with-you') ? 'we' : pron(s); // "you and Tom" answer "we"
      return {
        lines: [[blank('Did'), ` ${mid(s.en)} `, blank('use'), ' ', blank('to'), ` ${f.v}${phrase(f)}? — ${yes ? 'Yes' : 'No'}, ${pr} ${yes ? 'did' : "didn't"}.`]],
        zh: zhJoin(s.zh, '以前常常' + f.zh) + '嗎？', meta: meta(s, f, { kind: 'q' }),
      };
    },
  },
  {
    id: 'vs', name: 'used to 或 be used to', instruction: () => '「以前常常」用 used to + 原形；「習慣於」用 be used to + V-ing：依括號提示填入動詞的正確形式。',
    gen(rng, o) {
      const s = pickSubject(rng, people(rng, { ...o, level: Math.max(o.level, 2) })); if (!s) return null;
      const f = pickFrame(rng, s, Math.max(o.level, 2), USED); if (!f) return null;
      if (rng.fresh([true, false], (x) => 'vs-' + x)) {
        const be = beForm(s, false);
        return { lines: [[`${cap(s.en)} ${be} used to `, blank(VERBS[f.v].ing), ` (${f.v})${phrase(f)} now.`]], zh: zhJoin(s.zh, '現在已經習慣' + f.zh) + '了。', meta: meta(s, f, { kind: 'be', be }) };
      }
      return { lines: [[`${cap(s.en)} used to `, blank(f.v), ` (${f.v})${phrase(f)}, but ${pron(s)} ${dont(s)} now.`]],
        zh: zhJoin(s.zh, '以前常常' + f.zh) + '，但現在不會了。', meta: meta(s, f, { kind: 'past' }) };
    },
  },
];

export default {
  id: 'usedto',
  code: 'UST',
  title: 'used to / be used to',
  grade: 9,
  past: false,
  variety: false, // checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  noTranslate: ['negq'],
  defaultModes: { 1: ['fill'], 2: ['fill', 'negq'], 3: ['fill', 'negq', 'vs'] },
  levelHint: { 1: 'used to + 原形動詞，表示以前常常、現在不再。', 2: "加入 didn't use to 與 Did … use to 問句。", 3: '再加入 be used to + V-ing（習慣於）的分辨。' },
  grammarBox: (o) => ({ head: ['句型', '意思', '例子'], rows: [
    ['used to + 原形', '以前常常（現在不再）', 'Tom used to play basketball.'],
    ...(o.level >= 2 ? [["didn't use to / Did … use to", '否定與疑問（use 不加 d）', "Did you use to walk to school? — Yes, I did."]] : []),
    ...(o.level >= 3 ? [['be used to + V-ing', '習慣於', 'I am used to getting up early.']] : []),
  ], note: 'used to 後面接原形；be used to 的 to 是介系詞，後面接 V-ing。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
