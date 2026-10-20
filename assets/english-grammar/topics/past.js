// Topic: past simple of ordinary verbs (played / went / didn't / Did ...?).
// Advanced sheets mix present-simple sentences into the fill section, told apart by the time word.
import { blank } from '../core.js';
import { VERBS, vform, phrase, cuesFor } from '../verbs.js';
import { actors, pickSubject, timeFirst, mid, third, pickFrame, wantAbbr, abbrMark, negInstruction, zhSent, S0, cap } from '../vcommon.js';

function draw(rng, o, { exclude = () => false } = {}) {
  const s = pickSubject(rng, actors(rng, o.level, { exclude }));
  const f = s && pickFrame(rng, s, o.level, (x) => x.pastOk, 'past');
  if (!f) return null;
  const t = rng.fresh(cuesFor(f, 'past', s), (x) => x.en);
  return t ? { s, f, t } : null;
}
const meta = (d, extra) => ({ subj: d.s.en, base: d.f.v, cue: d.t.en, ...extra });
const noFirst = (s) => s.person === 1 || (s.person === 2 && s.num === 'sg') || s.tags.includes('every');

const MODES = [
  {
    id: 'fill', name: '肯定句填空',
    instruction: (o) => (o.level >= 3 ? '依括號提示與時間，填入動詞的正確形式（過去式或現在式）。' : '依括號提示，填入動詞的過去式。'),
    gen(rng, o) {
      if (o.level >= 3 && rng.chance(0.35)) {
        const s = pickSubject(rng, actors(rng, o.level)); const f = s && pickFrame(rng, s, o.level, (x) => x.habit && x.pastOk);
        if (!f) return null;
        const t = rng.fresh(cuesFor(f, 'habit', s), (x) => x.en); if (!t) return null;
        return { lines: [[S0(s) + ' ', blank(third(s) ? vform(f, 's') : VERBS[f.v].base), ` (${f.v})${phrase(f)} ${t.en}.`]], zh: zhSent(s, t, f.zh, '。'), meta: { subj: s.en, base: f.v, cue: t.en, kind: 'mixed' } };
      }
      const d = draw(rng, o); if (!d) return null;
      const { s, f, t } = d;
      const line = timeFirst(rng)
        ? [`${cap(t.en)}, ${mid(s.en)} `, blank(vform(f, 'past')), ` (${f.v})${phrase(f)}.`]
        : [S0(s) + ' ', blank(vform(f, 'past')), ` (${f.v})${phrase(f)} ${t.en}.`];
      return { lines: [line], zh: zhSent(s, t, f.zh, '。'), meta: meta(d, { kind: o.level >= 3 ? 'mixed' : 'past' }) };
    },
  },
  {
    id: 'neg', name: '否定句', instruction: (o) => negInstruction(o),
    gen(rng, o) {
      const d = draw(rng, o, { exclude: (s) => s.tags.includes('every') }); if (!d) return null;
      const { s, f, t } = d;
      const abbr = wantAbbr(rng, o);
      const bl = abbr ? [blank("didn't"), ' ', blank(f.v)] : [blank('did'), ' ', blank('not'), ' ', blank(f.v)];
      return {
        lines: [[`${S0(s)} ${vform(f, 'past')}${phrase(f)} ${t.en}.`], ['→ ' + S0(s) + ' ', ...bl, `${phrase(f)} ${t.en}.${abbrMark(o, abbr)}`]],
        zh: zhSent(s, t, '沒有' + f.zh, '。'), meta: meta(d, { kind: 'neg', abbr }),
      };
    },
  },
  {
    id: 'q', name: '疑問句', instruction: () => '改成疑問句。',
    gen(rng, o) {
      const d = draw(rng, o, { exclude: noFirst }); if (!d) return null;
      const { s, f, t } = d;
      return {
        lines: [[`${S0(s)} ${vform(f, 'past')}${phrase(f)} ${t.en}.`], ['→ ', blank('Did'), ` ${s.en} `, blank(f.v), `${phrase(f)} ${t.en}?`]],
        zh: zhSent(s, t, '有' + f.zh, '嗎？'), meta: meta(d, { kind: 'q' }),
      };
    },
  },
  {
    id: 'short', name: '簡答', instruction: () => '填入 Did，並完成簡答（否定簡答請用縮寫）。',
    gen(rng, o) {
      const d = draw(rng, o, { exclude: (s) => noFirst(s) || !s.reply }); if (!d) return null;
      const { s, f, t } = d;
      const yes = rng.chance(0.5);
      return {
        lines: [[blank('Did'), ` ${s.en} ${f.v}${phrase(f)} ${t.en}? — ${yes ? 'Yes' : 'No'}, `, blank(s.reply), ' ', blank(yes ? 'did' : "didn't"), '.']],
        zh: zhSent(s, t, '有' + f.zh, '嗎？'), meta: meta(d, { kind: 'reply' }),
      };
    },
  },
  {
    id: 'full', name: '詳答', instruction: () => '依問句回答：先簡答（否定請用縮寫），再依括號提示寫出做了什麼。',
    gen(rng, o) {
      const d = draw(rng, o, { exclude: (s) => noFirst(s) || !s.reply }); if (!d) return null;
      const { s, f, t } = d;
      const g = pickFrame(rng, s, o.level, (x) => x.pastOk && x.v !== f.v && cuesFor(x, 'past', s).some((c) => c.en === t.en), 'past'); if (!g) return null;
      return {
        lines: [[`Did ${s.en} ${f.v}${phrase(f)} ${t.en}?`],
          ['— No, ', blank(s.reply), ' ', blank("didn't"), '. ', blank(cap(s.reply)), ' ', blank(vform(g, 'past')), ` (${g.v})${phrase(g)}.`]],
        zh: zhSent(s, t, '有' + f.zh, '嗎？'), meta: meta(d, { kind: 'full', alt: g.v }),
      };
    },
  },
  {
    id: 'wh', name: '疑問詞問句', instruction: () => '填入 did，並寫出括號裡動詞的過去式。',
    gen(rng, o) {
      const d = draw(rng, o, { exclude: (s) => s.person !== 3 || !s.reply || s.tags.includes('every') }); if (!d) return null;
      const { s, f, t } = d;
      return {
        lines: [['What ', blank('did'), ` ${s.en} do ${t.en}? — ${cap(s.reply)} `, blank(vform(f, 'past')), ` (${f.v})${phrase(f)}.`]],
        zh: zhSent(s, t, '做了什麼', '？'), meta: meta(d, { kind: 'wh' }),
      };
    },
  },
];

export default {
  id: 'past',
  code: 'PST',
  title: '一般動詞過去式',
  grade: 8,
  past: false,
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['fill'], 2: ['fill', 'neg', 'q', 'short'], 3: ['fill', 'neg', 'q', 'short', 'full', 'wh'] },
  levelHint: { 1: '主詞只用代名詞，只考規則變化（-ed、-d）。', 2: '加入人名與名詞片語，含 -ied、重複字尾與常用不規則動詞。', 3: '填空題混入現在簡單式，要看時間詞判斷；全部句型。' },
  grammarBox: () => ({ head: ['規則', '例子'], rows: [['一般加 -ed', 'play → played'], ['字尾 e 加 -d', 'dance → danced'], ['子音 + y：去 y 加 -ied', 'study → studied'], ['短母音 + 子音：重複字尾加 -ed', 'stop → stopped'], ['不規則', 'go → went、eat → ate']],
    note: "否定：didn't + 原形。疑問：Did + 主詞 + 原形？" }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
