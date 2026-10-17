// Topic: plural nouns (books, boxes, babies, knives, children).
import { blank, cap, zhJoin } from '../core.js';
import { NOUNS, NUMBERS, article } from '../nouns.js';
import { actors, pickSubject, third } from '../vcommon.js';
import { beForm } from './be.js';

const RULES = { 1: ['s'], 2: ['s', 'es', 'ies', 'ves'], 3: ['s', 'es', 'ies', 'ves', 'irr'] };
const pool = (o) => NOUNS.filter((n) => RULES[o.level].includes(n.rule));
const pickNoun = (rng, o, test = () => true) => {
  const list = pool(o).filter(test);
  return list.length ? rng.fresh(list, (n) => n.sg) : null;
};
// Where several of a thing might be, by kind.
const PLACES = {
  thing: [['on the desk', '書桌上'], ['in the box', '盒子裡'], ['in the classroom', '教室裡']],
  food: [['on the table', '桌子上'], ['in the refrigerator', '冰箱裡'], ['in the basket', '籃子裡']],
  animal: [['in the park', '公園裡'], ['in the garden', '花園裡'], ['at the zoo', '動物園裡']],
  person: [['in the park', '公園裡'], ['in the classroom', '教室裡'], ['at the station', '車站']],
};
// Big or special things only go where they fit (no chairs in a box).
const OWN_PLACES = {
  desk: [['in the classroom', '教室裡']], chair: [['in the classroom', '教室裡'], ['in the kitchen', '廚房裡']],
  flower: [['in the garden', '花園裡'], ['in the park', '公園裡']], dish: [['on the table', '桌子上'], ['in the kitchen', '廚房裡']], glass: [['on the table', '桌子上'], ['in the kitchen', '廚房裡']],
};
const placeFor = (n) => OWN_PLACES[n.sg] ?? (['city', 'country', 'library', 'zoo', 'class', 'party', 'day', 'story', 'family', 'bus', 'piano', 'tree', 'foot', 'tooth', 'wife'].includes(n.sg) ? null : PLACES[n.kind]);
// Things a person can have several of.
const HAVE = (n) => n.own || n.kind === 'food' || ['cat', 'dog', 'bird', 'fish'].includes(n.sg);
const ABSTRACT = ['day', 'class', 'party', 'family', 'story', 'country', 'city'];
// Nouns that need their own sentence; '#' marks the blank, {s} the hint, {n} the number.
const SPECIAL = {
  day: ['We stayed in the city for {n} #{s}.', '我們在那個城市待了{n}天。'],
  class: ['We have {n} #{s} today.', '我們今天有{n}堂課。'],
  party: ['They had {n} #{s} last month.', '他們上個月辦了{n}場派對。'],
  family: ['There are {n} #{s} in this building.', '這棟大樓裡有{n}戶人家。'],
  story: ['My grandmother told us {n} #{s}.', '我奶奶跟我們講了{n}個故事。'],
  country: ['Mr. Chen visited {n} #{s} last year.', '陳先生去年去了{n}個國家。'],
  city: ['Ms. Lin visited {n} #{s} last year.', '林小姐去年去了{n}個城市。'],
  library: ['There are {n} #{s} in our city.', '我們的城市有{n}間圖書館。'],
  zoo: ['There are {n} #{s} in this country.', '這個國家有{n}個動物園。'],
  bus: ['I saw {n} #{s} at the station.', '我在車站看到{n}輛公車。'],
  piano: ['There are {n} #{s} in the music room.', '音樂教室裡有{n}台鋼琴。'],
  tree: ['There are {n} #{s} in the garden.', '花園裡有{n}棵樹。'],
  foot: ['A dog has four #{s}.', '一隻狗有四隻腳。'],
  tooth: ['The baby has {n} #{s} now.', '那個嬰兒現在有{n}顆牙齒。'],
  wife: ['The {n} men came with their #{s}.', '那{n}個男人帶著他們的太太來。'],
};
const meta = (n, extra) => ({ noun: n.sg, ...extra });

const MODES = [
  {
    id: 'count', name: '依數量填複數', instruction: () => '依括號提示，填入名詞的複數形。',
    gen(rng, o) {
      const n = pickNoun(rng, o); if (!n) return null;
      const [num, numZh] = rng.fresh(NUMBERS, (x) => x[0]);
      if (SPECIAL[n.sg]) {
        const [en, zh] = SPECIAL[n.sg];
        const [l, r] = en.split('#');
        return { lines: [[l.replace('{n}', num), blank(n.pl), r.replace('{s}', ` (${n.sg})`)]], zh: zh.replace('{n}', numZh), meta: meta(n, { kind: 'count' }) };
      }
      const places = placeFor(n);
      const form = rng.int(3);
      if (form === 0 && places) {
        const [p, pz] = rng.pick(places);
        return { lines: [[`There are ${num} `, blank(n.pl), ` (${n.sg}) ${p}.`]], zh: `${pz}有${numZh}${n.m}${n.zh}。`, meta: meta(n, { kind: 'count' }) };
      }
      if (form === 1 && HAVE(n)) {
        const s = pickSubject(rng, actors(rng, 2, { exclude: (x) => x.kind !== 'person' || x.tags.includes('group') }));
        const have = third(s) ? 'has' : 'have';
        return { lines: [[`${cap(s.en)} ${have} ${num} `, blank(n.pl), ` (${n.sg}).`]], zh: zhJoin(s.zh, `有${numZh}${n.m}${n.zh}`) + '。', meta: meta(n, { kind: 'count' }) };
      }
      return { lines: [[`I can see ${num} `, blank(n.pl), ` (${n.sg}).`]], zh: `我看得到${numZh}${n.m}${n.zh}。`, meta: meta(n, { kind: 'count' }) };
    },
  },
  {
    id: 'change', name: '單數改複數', instruction: () => '把句子改成複數，填入 Be 動詞與名詞的複數形。',
    gen(rng, o) {
      const n = pickNoun(rng, o, (x) => !ABSTRACT.includes(x.sg) && x.sg !== 'wife'); if (!n) return null;
      const far = rng.chance(0.5);
      const [d1, d2, z] = far ? ['That', 'Those', '那些'] : ['This', 'These', '這些'];
      return {
        lines: [[`${d1} is ${article(n.sg)} ${n.sg}.`], [`→ ${d2} `, blank('are'), ' ', blank(n.pl), '.']],
        zh: `${z}是${n.zh}。`, meta: meta(n, { kind: 'change' }),
      };
    },
  },
];

export default {
  id: 'plural',
  code: 'PLU',
  title: '名詞複數',
  grade: 7,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules, not by the subject/verb spread test
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['count'], 2: ['count', 'change'], 3: ['count', 'change'] },
  levelHint: { 1: '只考直接加 -s 的名詞。', 2: '加入 -es、去 y 加 -ies、f / fe 改 -ves。', 3: '再加入不規則變化（children、teeth、mice、sheep）。' },
  grammarBox: (o) => ({ head: ['規則', '例子'], rows: [
    ['一般加 -s', 'book → books'],
    ...(o.level >= 2 ? [['字尾 s、x、ch、sh、o 加 -es', 'box → boxes、potato → potatoes'], ['子音 + y：去 y 加 -ies', 'baby → babies'], ['字尾 f / fe：改 -ves', 'knife → knives']] : []),
    ...(o.level >= 3 ? [['不規則', 'child → children、foot → feet、sheep → sheep']] : []),
  ], note: '字尾 o 的名詞，photo、piano、zoo 只加 -s。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
