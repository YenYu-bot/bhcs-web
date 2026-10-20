// Topic: adverbs of frequency (always, usually, often, sometimes, seldom, never) and where they go.
//   Be verb:   Tom is always late.          (after be)
//   Other verbs: Tom always plays basketball. (before the verb)
import { blank, cap, zhJoin } from '../core.js';
import { PREDICATES } from '../lexicon.js';
import { VERBS, phrase, cuesFor } from '../verbs.js';
import { actors, pickSubject, pickFrame, third } from '../vcommon.js';
import { beForm } from './be.js';

const ADV = [['always', '總是'], ['usually', '通常'], ['often', '常常'], ['sometimes', '有時候'], ['seldom', '很少'], ['never', '從不']];
const advFor = (o) => (o.level >= 2 ? ADV : ADV.filter((a) => a[0] !== 'seldom'));
// Be predicates that make sense with "always / never": states people are in now and then.
const BE_PREDS = PREDICATES.filter((p) => (p.type === 'adj' && p.dur === 'temp' && p.for.includes('person')) || (p.type === 'loc' && p.for.includes('person') && !/hospital/.test(p.en)));
// "always late" rather than "always 遲到了": the state, not the event
const stateZh = (p) => p.zh.pos.replace(/^很/, '').replace(/了$/, '');
const meta = (s, adv, extra) => ({ subj: s.en, adv, cue: adv, ...extra });

function subject(rng, o, exclude = () => false) {
  // Level 1 keeps to subjects that take the base verb (I, you, we, they, plural nouns)
  return pickSubject(rng, actors(rng, Math.max(o.level, 2), { exclude: (s) => s.kind !== 'person' || exclude(s) || (o.level < 2 && third(s)) }));
}

const MODES = [
  {
    id: 'verb', name: '一般動詞句', instruction: () => '依括號裡的中文與動詞，把頻率副詞和動詞依正確順序填入。',
    gen(rng, o) {
      const s = subject(rng, o); if (!s) return null;
      const f = pickFrame(rng, s, o.level, (x) => x.habit); if (!f) return null;
      const [adv, az] = rng.fresh(advFor(o), (x) => x[0]);
      // an extra time only when it suits the activity ("on weekends", "after school")
      const tails = cuesFor(f, 'habit', s).filter((t) => ['on weekends', 'after school'].includes(t.en)).map((t) => [t.en, t.zh]);
      const [tail, tz] = rng.chance(0.25) && tails.length ? rng.pick(tails) : ['', ''];
      const v = third(s) ? VERBS[f.v].s : VERBS[f.v].base;
      return {
        lines: [[cap(s.en) + ' ', blank(adv), ' ', blank(v), `${phrase(f)}${tail ? ' ' + tail : ''}. (${az}／${f.v})`]],
        zh: zhJoin(s.zh, tz, az, f.zh) + '。', meta: meta(s, adv, { kind: 'verb', base: f.v, verb: v }),
      };
    },
  },
  {
    id: 'be', name: 'Be 動詞句', instruction: () => '依括號裡的中文，把 Be 動詞和頻率副詞依正確順序填入。',
    gen(rng, o) {
      const s = pickSubject(rng, actors(rng, Math.max(o.level, 2), { exclude: (x) => x.kind !== 'person' })); if (!s) return null;
      const p = rng.fresh(BE_PREDS, (x) => x.en);
      const [adv, az] = rng.fresh(advFor(o), (x) => x[0]);
      const be = beForm(s, false);
      const z = stateZh(p);
      return {
        lines: [[cap(s.en) + ' ', blank(be), ' ', blank(adv), ` ${p.en}. (${az}／be)`]],
        zh: zhJoin(s.zh, az, p.type === 'loc' ? p.zh.pos : z) + '。', meta: meta(s, adv, { kind: 'be', verb: be }),
      };
    },
  },
  {
    id: 'place', name: '放進句子裡', instruction: () => '把括號裡的頻率副詞放進句子，寫在正確的空格上。',
    gen(rng, o) {
      const [adv, az] = rng.fresh(advFor(o), (x) => x[0]);
      if (rng.chance(0.5)) {
        const s = pickSubject(rng, actors(rng, Math.max(o.level, 2), { exclude: (x) => x.kind !== 'person' })); if (!s) return null;
        const p = rng.fresh(BE_PREDS, (x) => x.en); const be = beForm(s, false);
        const z = p.type === 'loc' ? p.zh.pos : stateZh(p);
        return { lines: [[`${cap(s.en)} ${be} ${p.en}. (${adv})`], ['→ ' + cap(s.en) + ' ', blank(be), ' ', blank(adv), ` ${p.en}.`]], zh: zhJoin(s.zh, az, z) + '。', meta: meta(s, adv, { kind: 'be', verb: be }) };
      }
      const s = subject(rng, { ...o, level: Math.max(o.level, 2) }); if (!s) return null;
      const f = pickFrame(rng, s, o.level, (x) => x.habit); if (!f) return null;
      const v = third(s) ? VERBS[f.v].s : VERBS[f.v].base;
      return { lines: [[`${cap(s.en)} ${v}${phrase(f)}. (${adv})`], ['→ ' + cap(s.en) + ' ', blank(adv), ' ', blank(v), `${phrase(f)}.`]], zh: zhJoin(s.zh, az, f.zh) + '。', meta: meta(s, adv, { kind: 'verb', base: f.v, verb: v }) };
    },
  },
];
export default {
  id: 'freq',
  code: 'FRQ',
  title: '頻率副詞',
  grade: 7,
  past: false,
  variety: { front: false }, // the adverb sits inside the sentence, so nothing goes first
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['verb'], 2: ['verb', 'be'], 3: ['verb', 'be', 'place'] },
  levelHint: { 1: '一般動詞句，主詞不用加 -s（I、you、we、they、複數名詞）。', 2: '加入第三人稱單數與 Be 動詞句、seldom。', 3: '再加入「把頻率副詞放進句子」。' },
  grammarBox: () => ({ head: ['頻率', '副詞'], rows: [['100%', 'always 總是'], ['', 'usually 通常'], ['', 'often 常常'], ['', 'sometimes 有時候'], ['', 'seldom 很少'], ['0%', 'never 從不']],
    note: '頻率副詞放在 Be 動詞之後（She is always busy.），一般動詞之前（She always gets up early.）。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
