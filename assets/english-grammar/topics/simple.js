// Topic: present simple (plays / does / doesn't).
import { blank } from '../core.js';
import { VERBS, vform, phrase, cuesFor } from '../verbs.js';
import { actors, pickSubject, timeFirst, mid, third, pickFrame, wantAbbr, abbrMark, negInstruction, zhSent, S0, cap } from '../vcommon.js';

const present = (s, f) => (third(s) ? vform(f, 's') : VERBS[f.v].base);
const aux = (s) => (third(s) ? 'does' : 'do');
const NEG = { does: "doesn't", do: "don't" };

function draw(rng, o, { exclude = () => false, form = 's' } = {}) {
  const s = pickSubject(rng, actors(rng, o.level, { exclude }));
  const f = s && pickFrame(rng, s, o.level, (x) => x.habit, form);
  if (!f) return null;
  const t = rng.fresh(cuesFor(f, 'habit', s), (x) => x.en);
  return t ? { s, f, t } : null;
}
const meta = (d, extra) => ({ subj: d.s.en, base: d.f.v, cue: d.t.en, ...extra });
const noFirst = (s) => s.person === 1 || (s.person === 2 && s.num === 'sg') || s.tags.includes('every');

const MODES = [
  {
    id: 'fill', name: '肯定句填空', instruction: () => '依括號提示，填入動詞的正確形式。',
    gen(rng, o) {
      const d = draw(rng, o); if (!d) return null;
      const { s, f, t } = d;
      const line = timeFirst(rng)
        ? [`${cap(t.en)}, ${mid(s.en)} `, blank(present(s, f)), ` (${f.v})${phrase(f)}.`]
        : [S0(s) + ' ', blank(present(s, f)), ` (${f.v})${phrase(f)} ${t.en}.`];
      return { lines: [line], zh: zhSent(s, t, f.zh, '。'), meta: meta(d, { kind: 'verb' }) };
    },
  },
  {
    id: 'neg', name: '否定句', instruction: (o) => negInstruction(o),
    gen(rng, o) {
      const d = draw(rng, o, { exclude: (s) => s.tags.includes('every') }); if (!d) return null;
      const { s, f, t } = d;
      const abbr = wantAbbr(rng, o), a = aux(s);
      const bl = abbr ? [blank(NEG[a]), ' ', blank(f.v)] : [blank(a), ' ', blank('not'), ' ', blank(f.v)];
      return {
        lines: [[`${S0(s)} ${present(s, f)}${phrase(f)} ${t.en}.`], ['→ ' + S0(s) + ' ', ...bl, `${phrase(f)} ${t.en}.${abbrMark(o, abbr)}`]],
        zh: zhSent(s, t, '不' + f.zh, '。'), meta: meta(d, { kind: 'aux', abbr }),
      };
    },
  },
  {
    id: 'q', name: '疑問句', instruction: () => '改成疑問句。',
    gen(rng, o) {
      const d = draw(rng, o, { exclude: noFirst }); if (!d) return null;
      const { s, f, t } = d;
      return {
        lines: [[`${S0(s)} ${present(s, f)}${phrase(f)} ${t.en}.`], ['→ ', blank(cap(aux(s))), ` ${s.en} `, blank(f.v), `${phrase(f)} ${t.en}?`]],
        zh: zhSent(s, t, f.zh, '嗎？'), meta: meta(d, { kind: 'aux' }),
      };
    },
  },
  {
    id: 'short', name: '簡答', instruction: () => '填入 Do 或 Does，並完成簡答（否定簡答請用縮寫）。',
    gen(rng, o) {
      const d = draw(rng, o, { exclude: (s) => noFirst(s) || !s.reply }); if (!d) return null;
      const { s, f, t } = d;
      const yes = rng.chance(0.5), ra = aux({ person: s.reply === 'we' || s.reply === 'you' ? 1 : 3, num: ['he', 'she', 'it'].includes(s.reply) ? 'sg' : 'pl' });
      return {
        lines: [[blank(cap(aux(s))), ` ${s.en} ${f.v}${phrase(f)} ${t.en}? — ${yes ? 'Yes' : 'No'}, `, blank(s.reply), ' ', blank(yes ? ra : NEG[ra]), '.']],
        zh: zhSent(s, t, f.zh, '嗎？'), meta: meta(d, { kind: 'reply' }),
      };
    },
  },
  {
    id: 'full', name: '詳答', instruction: () => '依問句回答：先簡答（否定請用縮寫），再依括號提示寫出正確的情況。',
    gen(rng, o) {
      const d = draw(rng, o, { exclude: (s) => noFirst(s) || !s.reply }); if (!d) return null;
      const { s, f, t } = d;
      const g = pickFrame(rng, s, o.level, (x) => x.habit && x.v !== f.v, 's'); if (!g) return null;
      const r = { person: s.reply === 'we' ? 1 : 3, num: ['he', 'she', 'it'].includes(s.reply) ? 'sg' : 'pl' };
      const ra = aux(r);
      return {
        lines: [[`${cap(aux(s))} ${s.en} ${f.v}${phrase(f)} ${t.en}?`],
          ['— No, ', blank(s.reply), ' ', blank(NEG[ra]), '. ', blank(cap(s.reply)), ' ', blank(present(r, g)), ` (${g.v})${phrase(g)}.`]],
        zh: zhSent(s, t, f.zh, '嗎？'), meta: meta(d, { kind: 'full', alt: g.v }),
      };
    },
  },
  {
    id: 'wh', name: '疑問詞問句', instruction: () => '填入 do 或 does。',
    gen(rng, o) {
      const d = draw(rng, o, { exclude: (s) => s.person === 1 || s.person === 2 || !s.reply || s.tags.includes('every') }); if (!d) return null;
      const { s, f, t } = d;
      const r = { person: 3, num: s.num };
      return {
        lines: [['What ', blank(aux(s)), ` ${s.en} do ${t.en}? — ${cap(s.reply)} ${present(r, f)}${phrase(f)}.`]],
        zh: zhSent(s, t, '做什麼', '？'), meta: meta(d, { kind: 'wh' }),
      };
    },
  },
];

export default {
  id: 'simple',
  code: 'SIM',
  title: '現在簡單式',
  grade: 7,
  past: false,
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['fill'], 2: ['fill', 'neg', 'q', 'short'], 3: ['fill', 'neg', 'q', 'short', 'full', 'wh'] },
  levelHint: { 1: '主詞只用代名詞，動詞只加 -s。', 2: '加入人名與名詞片語，含 -es、-ies、has，肯定、否定、疑問混合。', 3: '加入易錯主詞（Ben and I、you and Tom、the children），全部句型。' },
  grammarBox: () => ({ head: ['主詞', '肯定', '否定／疑問'], rows: [['he / she / it、單數名詞', '動詞 + s / es', "doesn't + 原形；Does ...?"], ['I / you / we / they、複數名詞', '動詞原形', "don't + 原形；Do ...?"]],
    note: '加 es：字尾 s、x、ch、sh、o（goes、watches）。子音 + y：去 y 加 ies（studies）。have → has。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
