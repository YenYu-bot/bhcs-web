// Topic: as … as (一樣…), not as … as (不如…), and rewriting a comparative as "not as … as".
//   Tom is as tall as Amy.   Tom is not as tall as Amy. (= Amy is taller than Tom.)
import { blank, cap, zhJoin } from '../core.js';
import { NAMES } from '../lexicon.js';
import { ADJS } from './compare.js';

const ADJ = Object.fromEntries(ADJS.map((a) => [a.base, a]));
// Two of a kind, so either can be "as … as" the other: [English, Chinese], with the adjectives that fit and Chinese for things
const S = (items, adjs, zh = {}) => ({ items, adjs, zh });
const SETS = [
  S([['this bag', '這個袋子'], ['that bag', '那個袋子'], ['the red bag', '那個紅色的袋子']], ['big', 'heavy', 'cheap', 'expensive', 'new', 'old', 'nice', 'light'], { old: '舊', nice: '好看' }),
  S([['this room', '這個房間'], ['that room', '那個房間'], ['our classroom', '我們的教室']], ['big', 'clean', 'warm', 'cold', 'comfortable', 'quiet', 'large']),
  S([['this book', '這本書'], ['that book', '那本書'], ['the story book', '那本故事書']], ['interesting', 'thick', 'old', 'popular', 'difficult', 'easy', 'expensive', 'useful'], { old: '舊' }),
  S([['this movie', '這部電影'], ['that movie', '那部電影']], ['long', 'funny', 'exciting', 'popular', 'sad', 'interesting'], { long: '長' }),
  S([['the red car', '那輛紅色的車'], ['the blue car', '那輛藍色的車'], ['this car', '這輛車']], ['fast', 'big', 'expensive', 'new', 'old', 'safe', 'comfortable'], { old: '舊' }),
  S([['this river', '這條河'], ['that river', '那條河']], ['long', 'wide', 'clean', 'dangerous', 'famous'], { long: '長' }),
  S([['this city', '這個城市'], ['that city', '那個城市'], ['Taichung', '台中']], ['big', 'busy', 'famous', 'clean', 'hot', 'beautiful']),
];
const PERSON_ADJS = ['tall', 'short', 'old', 'young', 'strong', 'smart', 'kind', 'busy', 'thin', 'funny', 'popular', 'healthy'];
const PEOPLE = [...NAMES.m.slice(0, 8).map((n) => [n, n]), ...NAMES.f.slice(0, 8).map((n) => [n, n]), ['my brother', '我哥哥'], ['my sister', '我姊姊'], ['that boy', '那個男孩'], ['this girl', '這個女孩']];
// words only these sentences use, with their Chinese
const EXTRA = { quiet: '安靜', thick: '厚' };
const zhOf = (set, base) => set.zh?.[base] ?? EXTRA[base] ?? ADJ[base]?.zh ?? base;
const LEVEL_ADJ = (o, base) => o.level >= 2 || (ADJ[base] ? ['er', 'r'].includes(ADJ[base].rule) : true);

function draw(rng, o, test = () => true) {
  const set = rng.fresh([...SETS, 'person'], (x) => (x === 'person' ? 'person' : x.items[0][0]));
  const items = set === 'person' ? PEOPLE : set.items;
  const adjs = (set === 'person' ? PERSON_ADJS : set.adjs).filter((b) => LEVEL_ADJ(o, b) && test(b));
  if (!adjs.length) return null;
  const base = rng.fresh(adjs, (b) => 'adj-' + b);
  const a = rng.fresh(items, (x) => 'it-' + x[0]);
  const b = rng.pick(items.filter((x) => x[0] !== a[0]));
  return { set: set === 'person' ? { zh: { old: '大', young: '小' } } : set, base, a, b }; // people: 一樣大, not 一樣老
}
const two = (w) => w.split(' ').flatMap((x, i) => (i ? [' ', blank(x)] : [blank(x)]));

const MODES = [
  {
    id: 'as', name: 'as … as（一樣）', instruction: () => '「和…一樣…」用 as + 形容詞原級 + as：依中文填入。',
    gen(rng, o) {
      const d = draw(rng, o); if (!d) return null;
      return { lines: [[`${cap(d.a[0])} is `, blank('as'), ` ${d.base} `, blank('as'), ` ${d.b[0]}.`]], zh: zhJoin(d.a[1], '和', d.b[1], '一樣' + zhOf(d.set, d.base)) + '。', meta: { kind: 'as', base: d.base, neg: false } };
    },
  },
  {
    id: 'not', name: 'not as … as（不如）', instruction: () => '「沒有…那麼…」用 not as + 形容詞原級 + as：依中文填入。',
    gen(rng, o) {
      const d = draw(rng, o); if (!d) return null;
      return { lines: [[`${cap(d.a[0])} is `, blank('not'), ' ', blank('as'), ` ${d.base} `, blank('as'), ` ${d.b[0]}.`]], zh: zhJoin(d.a[1], '沒有', d.b[1], '那麼' + zhOf(d.set, d.base)) + '。', meta: { kind: 'not', base: d.base, neg: true } };
    },
  },
  {
    id: 'swap', name: '比較級改寫', instruction: () => '把比較級句子改寫成 not as … as，意思不變（一個空格填一個字）。',
    gen(rng, o) {
      const d = draw(rng, { ...o, level: Math.max(o.level, 2) }, (b) => ADJ[b]); if (!d) return null;
      const adj = ADJ[d.base];
      return {
        lines: [[`${cap(d.b[0])} is ${adj.cmp} than ${d.a[0]}.`], [`→ ${cap(d.a[0])} is `, blank('not'), ' ', blank('as'), ' ', ...two(d.base), ' ', blank('as'), ` ${d.b[0]}.`]],
        zh: zhJoin(d.a[1], '沒有', d.b[1], '那麼' + zhOf(d.set, d.base)) + '。', meta: { kind: 'swap', base: d.base, cmp: adj.cmp },
      };
    },
  },
];

export default {
  id: 'asas',
  code: 'ASA',
  title: 'as … as 與 not as … as',
  grade: 8,
  past: false,
  variety: false, // checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['as'], 2: ['as', 'not'], 3: ['as', 'not', 'swap'] },
  levelHint: { 1: 'as + 形容詞原級 + as（一樣）。', 2: '加入 not as … as（不如）與長的形容詞。', 3: '再加入比較級改寫成 not as … as。' },
  grammarBox: (o) => ({ head: ['句型', '意思', '例子'], rows: [
    ['as + 原級 + as', '和…一樣', 'Tom is as tall as Amy.'],
    ...(o.level >= 2 ? [['not as + 原級 + as', '沒有…那麼', 'Tom is not as tall as Amy.']] : []),
    ...(o.level >= 3 ? [['比較級改寫', '意思相同', 'Amy is taller than Tom. = Tom is not as tall as Amy.']] : []),
  ], note: 'as … as 中間用原級，不用比較級（不能說 as taller as）。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
