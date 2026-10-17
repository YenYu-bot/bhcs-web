// Topic: this / that / these / those.
import { blank, cap, zhJoin } from '../core.js';
import { NOUNS, article } from '../nouns.js';

const D = { this: { pl: false, near: true, zh: '這' }, that: { pl: false, near: false, zh: '那' }, these: { pl: true, near: true, zh: '這些' }, those: { pl: true, near: false, zh: '那些' } };
const CUE = { this: '這個', that: '那個', these: '這些', those: '那些' };
const OWNERS = [['my', '我的'], ['your', '你的'], ['his', '他的'], ['her', '她的'], ["Tom's", 'Tom 的'], ["Amy's", 'Amy 的'], ['our', '我們的']];
const THINGS = NOUNS.filter((n) => (n.own || n.kind === 'food') && n.rule !== 'irr');
const pickD = (rng, o) => rng.fresh(o.level >= 2 ? ['this', 'that', 'these', 'those'] : ['this', 'that'], (x) => x);
const nounOf = (n, pl) => (pl ? n.pl : n.sg);
const meta = (d, extra) => ({ dem: d, ...extra });

const MODES = [
  {
    id: 'fill', name: '依中文填空', instruction: () => '依括號裡的中文，填入 this、that、these 或 those，以及正確的 Be 動詞。',
    gen(rng, o) {
      const d = pickD(rng, o), n = rng.fresh(THINGS, (x) => x.sg);
      const pl = D[d].pl, be = pl ? 'are' : 'is';
      if (rng.chance(0.5)) {
        const [ow, owz] = rng.fresh(OWNERS, (x) => x[0]);
        return { lines: [[blank(cap(d)), ' ', blank(be), ` ${ow} ${nounOf(n, pl)}. (${CUE[d]})`]], zh: zhJoin(`${D[d].zh}是`, `${owz}${n.zh}`) + '。', meta: meta(d, { pl }) };
      }
      return { lines: [[blank(cap(d)), ' ', blank(be), ` ${pl ? '' : article(n.sg) + ' '}${nounOf(n, pl)}. (${CUE[d]})`]], zh: `${D[d].zh}是${pl ? '' : '一' + n.m}${n.zh}。`, meta: meta(d, { pl }) };
    },
  },
  {
    id: 'q', name: '問句與簡答', instruction: () => '填入問句的 Be 動詞，並用 it 或 they 完成簡答（否定請用縮寫）。',
    gen(rng, o) {
      const d = pickD(rng, o), n = rng.fresh(THINGS, (x) => x.sg);
      const pl = D[d].pl, be = pl ? 'are' : 'is', yes = rng.chance(0.5);
      const pr = pl ? 'they' : 'it';
      const [ow, owz] = rng.fresh(OWNERS.filter((x) => x[0] !== 'my'), (x) => x[0]);
      return {
        lines: [[blank(cap(be)), ` ${d} ${ow} ${nounOf(n, pl)}? — ${yes ? 'Yes' : 'No'}, `, blank(pr), ' ', blank(yes ? be : pl ? "aren't" : "isn't"), '.']],
        zh: zhJoin(`${D[d].zh}是`, `${owz}${n.zh}`) + '嗎？', meta: meta(d, { pl, kind: 'q' }),
      };
    },
  },
  {
    id: 'change', name: '單複數互換', instruction: () => '把句子改成複數或單數，填入指示詞、Be 動詞與名詞。',
    gen(rng, o) {
      const toPl = rng.chance(0.5), near = rng.chance(0.5), n = rng.fresh(THINGS, (x) => x.sg);
      const from = near ? (toPl ? 'this' : 'these') : (toPl ? 'that' : 'those');
      const to = near ? (toPl ? 'these' : 'this') : (toPl ? 'those' : 'that');
      const [ow, owz] = rng.fresh(OWNERS, (x) => x[0]);
      const given = `${cap(from)} ${D[from].pl ? 'are' : 'is'} ${ow} ${nounOf(n, D[from].pl)}.`;
      return {
        lines: [[given], ['→ ', blank(cap(to)), ' ', blank(D[to].pl ? 'are' : 'is'), ` ${ow} `, blank(nounOf(n, D[to].pl)), '.']],
        zh: zhJoin(`${D[to].zh}是`, `${owz}${n.zh}`) + '。', meta: meta(to, { pl: D[to].pl, kind: 'change', noun: n.sg }),
      };
    },
  },
];

export default {
  id: 'this',
  code: 'DEM',
  title: '指示詞 this / that',
  grade: 7,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules, not by the subject/verb spread test
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['fill'], 2: ['fill', 'q'], 3: ['fill', 'q', 'change'] },
  levelHint: { 1: '只考單數的 this、that。', 2: '加入複數 these、those 與問句簡答。', 3: '再加入單複數互換。' },
  grammarBox: () => ({ head: ['', '近', '遠', 'Be 動詞', '簡答代名詞'], rows: [['單數', 'this', 'that', 'is', 'it'], ['複數', 'these', 'those', 'are', 'they']],
    note: '回答 this / that 的問句用 it，回答 these / those 的問句用 they。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
