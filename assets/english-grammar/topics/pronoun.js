// Topic: personal pronouns — subject (she), object (her), possessive (her bag), possessive pronoun (hers).
import { blank, cap, zhJoin } from '../core.js';
import { PREDICATES } from '../lexicon.js';
import { NOUNS } from '../nouns.js';
import { VERBS, phrase, cuesFor } from '../verbs.js';
import { actors, pickSubject, pickFrame, third } from '../vcommon.js';
import { beForm } from './be.js';

const P = (base, subj, obj, poss, mine, zh, person, num, kind = 'person') => ({ base, subj, obj, poss, mine, zh, person, num, kind });
const PRONOUNS = [
  P('I', 'I', 'me', 'my', 'mine', '我', 1, 'sg'),
  P('you', 'you', 'you', 'your', 'yours', '你', 2, 'sg'),
  P('he', 'he', 'him', 'his', 'his', '他', 3, 'sg'),
  P('she', 'she', 'her', 'her', 'hers', '她', 3, 'sg'),
  P('it', 'it', 'it', 'its', null, '牠', 3, 'sg', 'animal'),
  P('we', 'we', 'us', 'our', 'ours', '我們', 1, 'pl'),
  P('they', 'they', 'them', 'their', 'theirs', '他們', 3, 'pl'),
];
const pickP = (rng, test = () => true) => rng.fresh(PRONOUNS.filter(test), (p) => p.base);
const asSubject = (p) => ({ person: p.person, num: p.num, kind: p.kind, age: 'any', tags: ['pron'], en: p.subj, zh: p.zh });
const hint = (p) => ` (${p.base})`;
const zhPoss = (p) => p.zh + '的';
const meta = (p, kase, extra = {}) => ({ base: p.base, case: kase, ...extra });

// Owned things for the possessive sections.
const OWN = NOUNS.filter((n) => n.own && n.kind === 'thing');
const COLORS = [['new', '很新'], ['old', '很舊'], ['red', '是紅色的'], ['blue', '是藍色的'], ['big', '很大'], ['small', '很小'], ['black', '是黑色的']];

// Things you do to or for someone: [verb, zh before the person, zh after]
const TO_SOMEONE = [['like', '喜歡', ''], ['love', '愛', ''], ['know', '認識', ''], ['help', '幫忙', ''], ['call', '打電話給', ''], ['visit', '去看', ''], ['miss', '想念', '']];
const S3 = (v) => (v === 'miss' ? 'misses' : v + 's');

const MODES = [
  {
    id: 'subj', name: '主格', instruction: () => '依括號提示，填入正確的主格代名詞。',
    gen(rng, o) {
      const p = pickP(rng); const s = asSubject(p);
      if (rng.chance(0.5)) {
        const preds = PREDICATES.filter((x) => x.for.includes(p.kind) && (!x.num || x.num === p.num) && !(x.type === 'job' && p.base === 'we' && x.age === 'adult'));
        const pr = rng.fresh(preds, (x) => x.en);
        const be = beForm(s, false);
        const pe = pr.type === 'job' && p.num === 'pl' ? pr.pl : pr.en;
        return { lines: [[blank(cap(p.subj)), `${hint(p)} ${be} ${pe}.`]], zh: zhJoin(p.zh, pr.zh.pos) + '。', meta: meta(p, 'subj', { verb: be }) };
      }
      const f = pickFrame(rng, s, 3, (x) => x.habit); if (!f) return null;
      const t = rng.fresh(cuesFor(f, 'habit', s), (x) => x.en); if (!t) return null;
      const v = third(s) ? VERBS[f.v].s : VERBS[f.v].base;
      return { lines: [[blank(cap(p.subj)), `${hint(p)} ${v}${phrase(f)} ${t.en}.`]], zh: zhJoin(p.zh, t.zh, f.zh) + '。', meta: meta(p, 'subj', { verb: v, vbase: f.v }) };
    },
  },
  {
    id: 'obj', name: '受格', instruction: () => '依括號提示，填入正確的受格代名詞。',
    gen(rng, o) {
      const p = pickP(rng);
      const s = pickSubject(rng, actors(rng, 2, { exclude: (x) => x.kind !== 'person' || x.person !== 3 || x.tags.includes('group') }));
      const form = rng.int(4);
      if (p.kind === 'animal') {
        const v = third(s) ? 'feeds' : 'feed';
        return { lines: [[`${cap(s.en)} ${v} `, blank(p.obj), `${hint(p)} every day.`]], zh: zhJoin(s.zh, '每天餵牠') + '。', meta: meta(p, 'obj') };
      }
      if (form === 0) {
        const [v, z1] = rng.fresh(TO_SOMEONE, (x) => x[0]);
        return { lines: [[`${cap(s.en)} ${third(s) ? S3(v) : v} `, blank(p.obj), `${hint(p)}.`]], zh: zhJoin(s.zh, z1 + p.zh) + '。', meta: meta(p, 'obj') };
      }
      if (form === 1) {
        const f = pickFrame(rng, s, 3, (x) => x.habit && ['play', 'study', 'walk', 'take', 'swim', 'dance', 'jog'].includes(x.v), null, false); if (!f) return null;
        const t = rng.fresh(cuesFor(f, 'habit', s), (x) => x.en); if (!t) return null;
        const v = third(s) ? VERBS[f.v].s : VERBS[f.v].base;
        return { lines: [[`${cap(s.en)} ${v}${phrase(f)} with `, blank(p.obj), `${hint(p)} ${t.en}.`]], zh: zhJoin(s.zh, t.zh, `和${p.zh}一起`, f.zh) + '。', meta: meta(p, 'obj') };
      }
      if (form === 2) {
        // [sentence start, Chinese with # for the person, pronouns it does not suit]
        const [en, zh] = rng.fresh([['This gift is for ', '這份禮物是給#的', []], ['Please wait for ', '請等#', ['you']], ['Look at ', '看#', ['you']], ['My mother made a cake for ', '我媽媽做了一個蛋糕給#', []], ['Do you know ', '你認識#嗎', ['you', 'I']]]
          .filter((x) => !x[2].includes(p.base)), (x) => x[0]);
        return { lines: [[en, blank(p.obj), `${hint(p)}${en.startsWith('Do ') ? '?' : '.'}`]], zh: zh.replace('#', p.zh) + (en.startsWith('Do ') ? '？' : '。'), meta: meta(p, 'obj') };
      }
      if (p.base === 'you') return { lines: [['I want to talk to ', blank(p.obj), `${hint(p)}.`]], zh: '我想跟你說話。', meta: meta(p, 'obj') };
      return { lines: [['Can you help ', blank(p.obj), `${hint(p)}?`]], zh: `你可以幫忙${p.zh}嗎？`, meta: meta(p, 'obj') };
    },
  },
  {
    id: 'poss', name: '所有格', instruction: () => '依括號提示，填入正確的所有格。',
    gen(rng, o) {
      const p = pickP(rng);
      if (p.kind === 'animal') {
        return { lines: [['The dog is playing with ', blank(p.poss), `${hint(p)} toy.`]], zh: '那隻狗正在玩牠的玩具。', meta: meta(p, 'poss') };
      }
      const n = rng.fresh(OWN, (x) => x.sg);
      const pl = rng.chance(0.4);
      const noun = pl ? n.pl : n.sg;
      const form = rng.int(3);
      if (form === 0) {
        const [c, cz] = rng.fresh(COLORS, (x) => x[0]);
        return { lines: [[blank(cap(p.poss)), `${hint(p)} ${noun} ${pl ? 'are' : 'is'} ${c}.`]], zh: `${zhPoss(p)}${n.zh}${cz}。`, meta: meta(p, 'poss', { verb: pl ? 'are' : 'is', pl }) };
      }
      if (form === 1) return { lines: [[`${pl ? 'These are' : 'This is'} `, blank(p.poss), `${hint(p)} ${noun}.`]], zh: `${pl ? '這些' : '這'}是${zhPoss(p)}${n.zh}。`, meta: meta(p, 'poss') };
      return { lines: [['Do you like ', blank(p.poss), `${hint(p)} ${noun}?`]], zh: `你喜歡${zhPoss(p)}${n.zh}嗎？`, meta: meta(p, 'poss') };
    },
  },
  {
    id: 'mine', name: '所有格代名詞', instruction: () => '依括號提示，填入正確的所有格代名詞（mine、yours…）。',
    gen(rng, o) {
      const p = pickP(rng, (x) => x.mine);
      const n = rng.fresh(OWN, (x) => x.sg);
      const pl = rng.chance(0.4);
      if (p.base !== 'I' && rng.chance(0.4)) {
        return {
          lines: [[`${pl ? "Those aren't my" : "That isn't my"} ${pl ? n.pl : n.sg}. ${pl ? "They're" : "It's"} `, blank(p.mine), `${hint(p)}.`]],
          zh: `那${pl ? '些' : n.m}不是我的${n.zh}，是${zhPoss(p)}。`, meta: meta(p, 'mine'),
        };
      }
      return { lines: [[`${pl ? 'These' : 'This'} ${pl ? n.pl : n.sg} ${pl ? 'are' : 'is'} `, blank(p.mine), `${hint(p)}.`]], zh: `這${pl ? '些' : n.m}${n.zh}是${zhPoss(p)}。`, meta: meta(p, 'mine') };
    },
  },
];

export default {
  id: 'pronoun',
  code: 'PRN',
  title: '人稱代名詞',
  grade: 7,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules, not by the subject/verb spread test
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['subj', 'obj'], 2: ['subj', 'obj', 'poss'], 3: ['subj', 'obj', 'poss', 'mine'] },
  levelHint: { 1: '主格與受格。', 2: '加入所有格（my、your、his…）。', 3: '再加入所有格代名詞（mine、yours、hers…）。' },
  grammarBox: (o) => ({ head: ['主格', '受格', '所有格', ...(o.level >= 3 ? ['所有格代名詞'] : [])],
    rows: PRONOUNS.map((p) => [p.subj, p.obj, p.poss, ...(o.level >= 3 ? [p.mine ?? '—'] : [])]),
    note: '主格放在動詞前，受格放在動詞或介系詞後，所有格後面要接名詞，所有格代名詞後面不接名詞。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
