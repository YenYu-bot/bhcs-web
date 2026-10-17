// Topic: quantity words — some / any, many / much, a few / a little.
//   some in statements, any in negatives and questions; many / few with countable nouns, much / little with uncountable ones.
import { blank, cap, zhJoin } from '../core.js';
import { pickPerson, verbFor, midOf } from '../people.js';

// [word as used, Chinese, measure word (countable only), places, can be "had"]
const C = (en, zh, m, places, have = false) => ({ en, zh, m, places, have, count: true });
const U = (en, zh, places, have = false) => ({ en, zh, m: '', places, have, count: false });
const NOUNS = [
  C('books', '書', '本', ['on the desk', 'in my bag', 'on the shelf'], true), C('eggs', '蛋', '顆', ['in the refrigerator', 'in the box', 'on the table']),
  C('apples', '蘋果', '個', ['on the table', 'in the box', 'in the refrigerator'], true), C('cookies', '餅乾', '片', ['in the box', 'on the table'], true),
  C('oranges', '柳橙', '個', ['on the table', 'in the box'], true), C('bananas', '香蕉', '根', ['on the table', 'in my bag'], true),
  C('pencils', '鉛筆', '枝', ['in my bag', 'on the desk', 'in the box'], true), C('friends', '朋友', '個', [], true),
  C('students', '學生', '個', ['in the classroom', 'in the library', 'in the park']), C('birds', '鳥', '隻', ['in the tree', 'in the park']),
  C('toys', '玩具', '個', ['in the box'], true), C('people', '人', '個', ['in the park', 'at the station', 'in the museum']),
  U('milk', '牛奶', ['in the refrigerator', 'in the bottle', 'in the glass']), U('water', '水', ['in the bottle', 'in the glass']),
  U('juice', '果汁', ['in the refrigerator', 'in the bottle']), U('tea', '茶', ['in the cup']), U('coffee', '咖啡', ['in the cup']),
  U('bread', '麵包', ['on the table', 'in the box'], true), U('rice', '米飯', ['in the bowl']), U('money', '錢', ['in my bag', 'in the box'], true),
  U('time', '時間', [], true), U('homework', '功課', [], true), U('sugar', '糖', ['in the box', 'in the cup']), U('soup', '湯', ['in the bowl']),
];
const PLACE_ZH = {
  'on the desk': '書桌上', 'in my bag': '我的袋子裡', 'on the shelf': '架子上', 'in the refrigerator': '冰箱裡', 'in the box': '盒子裡', 'on the table': '桌子上',
  'in the classroom': '教室裡', 'in the library': '圖書館裡', 'in the park': '公園裡', 'in the tree': '樹上', 'at the station': '車站', 'in the museum': '博物館裡',
  'in the bottle': '瓶子裡', 'in the glass': '杯子裡', 'in the cup': '杯子裡', 'in the bowl': '碗裡',
};
const THINGS = [['bag', '個', '袋子'], ['watch', '支', '手錶'], ['umbrella', '把', '雨傘'], ['cake', '個', '蛋糕'], ['dress', '件', '洋裝'], ['hat', '頂', '帽子'], ['dictionary', '本', '字典']];

const plural = (p) => ['we', 'they', 'you', 'I'].includes(p.pr);
const has = (p) => verbFor(p, ['have', 'has']);
const doesnt = (p) => (p.s3 ? "doesn't" : "don't");
const doo = (p) => (p.s3 ? 'Does' : 'Do');
const there = (n, form) => ({ s: n.count ? 'There are' : 'There is', n: n.count ? "There aren't" : "There isn't", q: n.count ? 'Are there' : 'Is there' }[form]);
const pickNoun = (rng, test) => rng.fresh(NOUNS.filter(test), (n) => n.en);
const item = (l, ans, r, zh, meta) => ({ lines: [[l, blank(ans), r]], zh, meta });

// One sentence shape for a noun: 'place' (There is/are …) or 'have' (someone has …), in a form 's' | 'n' | 'q'.
function shape(rng, n, form, word) {
  const usePlace = n.places.length && (!n.have || rng.chance(0.5));
  if (usePlace) {
    const pl = rng.pick(n.places), pz = PLACE_ZH[pl];
    const zhQ = { s: `${pz}有${word.zh}${n.zh}。`, n: `${pz}沒有${word.zhNeg ?? ''}${n.zh}。`, q: `${pz}有${word.zhQ ?? ''}${n.zh}嗎？` }[form];
    if (form === 'q') return [`${there(n, 'q')} `, ` ${n.en} ${pl}?`, zhQ];
    return [`${there(n, form)} `, ` ${n.en} ${pl}.`, zhQ];
  }
  const p = pickPerson(rng);
  if (form === 's') return [`${p.en} ${has(p)} `, ` ${n.en}.`, zhJoin(p.zh, `有${word.zh}${n.zh}`) + '。'];
  if (form === 'n') return [`${p.en} ${doesnt(p)} have `, ` ${n.en}.`, zhJoin(p.zh, `沒有${word.zhNeg ?? ''}${n.zh}`) + '。'];
  return [`${doo(p)} ${midOf(p)} have `, ` ${n.en}?`, zhJoin(p.zh, `有${word.zhQ ?? ''}${n.zh}`) + '嗎？'];
}

const MODES = [
  {
    id: 'some', name: 'some 或 any', instruction: () => '填入 some 或 any。',
    gen(rng, o) {
      const n = pickNoun(rng, (x) => o.level >= 2 || x.count);
      const form = rng.pick(['s', 's', 'n', 'q']);
      const [l, r, zh] = shape(rng, n, form, { zh: '一些' });
      return item(l, form === 's' ? 'some' : 'any', r, zh, { kind: 'some', noun: n.en, form });
    },
  },
  {
    id: 'many', name: 'many 或 much', instruction: () => '填入 many 或 much。',
    gen(rng, o) {
      if (rng.chance(0.2)) {
        const [t, m, z] = rng.fresh(THINGS, (x) => x[0]);
        return item('How ', 'much', ` is this ${t}?`, `這${m}${z}多少錢？`, { kind: 'price', noun: t });
      }
      const n = pickNoun(rng, () => true);
      const ans = n.count ? 'many' : 'much';
      if (n.places.length && rng.chance(0.5)) {
        const pl = rng.pick(n.places);
        return item('How ', ans, ` ${n.en} ${n.count ? 'are' : 'is'} there ${pl}?`, `${PLACE_ZH[pl]}有${n.count ? '幾' + n.m : '多少'}${n.zh}？`, { kind: 'many', noun: n.en, form: 'how' });
      }
      // "much" only in negatives and questions; "many" also in statements
      const form = n.count ? rng.pick(['s', 'n', 'q']) : rng.pick(['n', 'q']);
      const [l, r, zh] = shape(rng, n, form, { zh: '很多', zhNeg: '很多', zhQ: '很多' });
      return item(l, ans, r, zh, { kind: 'many', noun: n.en, form });
    },
  },
  {
    id: 'few', name: 'a few 或 a little', instruction: () => '填入 few 或 little，完成 a few / a little。',
    gen(rng, o) {
      const n = pickNoun(rng, (x) => x.en !== 'people');
      const [l, r, zh] = shape(rng, n, 's', { zh: n.count ? '幾' + n.m : '一點' });
      return item(l + 'a ', n.count ? 'few' : 'little', r, zh, { kind: 'few', noun: n.en });
    },
  },
];

export default {
  id: 'quantity',
  code: 'QTY',
  title: '數量詞 some / any / many / much',
  grade: 7,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules, not by the subject/verb spread test
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['some'], 2: ['some', 'many'], 3: ['some', 'many', 'few'] },
  levelHint: { 1: 'some / any，只用可數名詞。', 2: '加入不可數名詞（milk、water、money…）與 many / much。', 3: '再加入 a few / a little。' },
  grammarBox: (o) => ({ head: ['', '可數名詞（books）', '不可數名詞（milk）'], rows: [
    ['肯定句', 'some', 'some'], ['否定句、問句', 'any', 'any'],
    ...(o.level >= 2 ? [['很多', 'many', 'much'], ['多少', 'How many', 'How much']] : []),
    ...(o.level >= 3 ? [['一些、一點', 'a few', 'a little']] : []),
  ], note: 'much 多用在否定句和問句；問價錢用 How much。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
