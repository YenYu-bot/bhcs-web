// Topic: There is / There are (with the past option, There was / There were).
import { blank, cap, zhJoin } from '../core.js';
import { wantAbbr, abbrMark, negInstruction } from '../vcommon.js';

// Things that can be somewhere. num 'sg' | 'pl' | 'u' (uncountable); some → any in negatives and questions.
//   neg/q false: "There aren't two cats" sounds wrong, so numbered nouns only appear in the fill and How many sections.
const N = (en, zh, num, places, lvl, extra = {}) => ({ en, zh, num, places, lvl, neg: true, ...extra });
const NOUNS = [
  N('a cat', '一隻貓', 'sg', ['under the table', 'in the garden', 'on the sofa', 'in the box'], 1),
  N('a dog', '一隻狗', 'sg', ['under the table', 'in the garden', 'in the park'], 1),
  N('a book', '一本書', 'sg', ['on the desk', 'in my bag', 'on the sofa', 'under the bed'], 1),
  N('a pen', '一枝筆', 'sg', ['on the desk', 'in my bag', 'in the box'], 1),
  N('a computer', '一台電腦', 'sg', ['on the desk', 'in the classroom'], 1),
  N('an apple', '一個蘋果', 'sg', ['on the table', 'in my bag', 'in the box', 'in the refrigerator'], 1),
  N('an egg', '一顆蛋', 'sg', ['in the box', 'in the refrigerator', 'on the table'], 1),
  N('a bird', '一隻鳥', 'sg', ['in the tree', 'in the garden'], 1),
  N('a bus', '一輛公車', 'sg', ['near the school', 'in front of the station'], 2),
  N('two cats', '兩隻貓', 'pl', ['under the table', 'in the garden', 'on the sofa'], 1, { neg: false, count: 'cats' }),
  N('three books', '三本書', 'pl', ['on the desk', 'in my bag', 'under the bed'], 1, { neg: false, count: 'books' }),
  N('five chairs', '五張椅子', 'pl', ['in the classroom', 'in the kitchen'], 1, { neg: false, count: 'chairs' }),
  N('two dogs', '兩隻狗', 'pl', ['under the table', 'in the garden', 'in the park'], 1, { neg: false, count: 'dogs' }),
  N('four pens', '四枝筆', 'pl', ['on the desk', 'in my bag', 'in the box'], 1, { neg: false, count: 'pens' }),
  N('six eggs', '六顆蛋', 'pl', ['in the box', 'in the refrigerator', 'on the table'], 1, { neg: false, count: 'eggs' }),
  N('ten students', '十個學生', 'pl', ['in the classroom', 'in the library', 'in the park'], 1, { neg: false, count: 'students' }),
  N('three birds', '三隻鳥', 'pl', ['in the tree', 'in the garden', 'in the park'], 1, { neg: false, count: 'birds' }),
  N('seven apples', '七個蘋果', 'pl', ['on the table', 'in the box', 'in my bag', 'in the refrigerator'], 1, { neg: false, count: 'apples' }),
  N('some apples', '一些蘋果', 'pl', ['on the table', 'in the box', 'in the refrigerator', 'in my bag'], 1),
  N('some birds', '一些鳥', 'pl', ['in the tree', 'in the garden', 'in the park'], 1),
  N('some students', '一些學生', 'pl', ['in the classroom', 'in the library', 'in the park'], 1),
  N('many people', '很多人', 'pl', ['in the park', 'at the station', 'at the zoo', 'in the museum'], 2),
  N('many students', '很多學生', 'pl', ['in the classroom', 'in the library', 'in the park'], 2),
  N('some flowers', '一些花', 'pl', ['in the garden', 'on the table', 'in the park'], 2),
  N('some milk', '一些牛奶', 'u', ['in the refrigerator', 'in the bottle', 'on the table'], 3),
  N('some water', '一些水', 'u', ['in the bottle', 'in the glass'], 3),
  N('some bread', '一些麵包', 'u', ['on the table', 'in the box', 'in my bag'], 3),
  N('a lot of juice', '很多果汁', 'u', ['in the refrigerator', 'in the bottle'], 3, { neg: false }),
];
const PLACE_ZH = {
  'under the table': '桌子下面', 'in the garden': '花園裡', 'on the sofa': '沙發上', 'in the box': '盒子裡', 'in the park': '公園裡',
  'on the desk': '書桌上', 'in my bag': '我的袋子裡', 'under the bed': '床底下', 'in the classroom': '教室裡', 'on the table': '桌子上',
  'in the refrigerator': '冰箱裡', 'in the tree': '樹上', 'near the school': '學校附近', 'in front of the station': '車站前面',
  'near the park': '公園附近', 'in the kitchen': '廚房裡', 'in the library': '圖書館裡', 'at the station': '車站', 'at the zoo': '動物園',
  'in the museum': '博物館裡', 'in the bottle': '瓶子裡', 'in the glass': '杯子裡',
};
const TIMES = [
  { en: 'now', zh: '現在', past: false },
  { en: 'yesterday', zh: '昨天', past: true },
  { en: 'last night', zh: '昨晚', past: true },
  { en: 'last Sunday', zh: '上星期天', past: true },
  { en: 'two days ago', zh: '兩天前', past: true },
];
const isPl = (n) => n.num === 'pl';
const be = (n, past) => (past ? (isPl(n) ? 'were' : 'was') : isPl(n) ? 'are' : 'is');
const NEG = { is: "isn't", are: "aren't", was: "wasn't", were: "weren't" };
const anyOf = (n) => n.en.replace(/^some /, 'any ');
const bare = (n) => n.zh.replace(/^(一些|[一兩三四五六七十][隻本枝台個顆輛張])/, '');
const COUNT_ZH = { cats: ['隻', '貓'], books: ['本', '書'], chairs: ['張', '椅子'], dogs: ['隻', '狗'], pens: ['枝', '筆'], eggs: ['顆', '蛋'], students: ['個', '學生'], birds: ['隻', '鳥'], apples: ['個', '蘋果'] };

function draw(rng, o, test = () => true) {
  const ns = NOUNS.filter((n) => n.lvl <= o.level && test(n));
  if (!ns.length) return null;
  const n = rng.fresh(ns, (x) => x.en);
  const place = rng.fresh(n.places);
  const past = o.tense === 'P' ? false : o.tense === 'D' ? true : rng.chance(0.5);
  const needTime = o.tense !== 'P' || rng.chance(0.4);
  const t = needTime ? rng.fresh(TIMES.filter((x) => x.past === past), (x) => x.en) : null;
  return { n, place, t, past };
}
const tail = (place, t) => ` ${place}${t ? ' ' + t.en : ''}`;
const zhThere = (d, verb, end, noun = d.n.zh) => zhJoin(d.t?.zh, PLACE_ZH[d.place], verb, noun) + end;
const meta = (d, extra) => ({ noun: d.n.en, cue: d.t?.en ?? null, ...extra });

const MODES = [
  {
    id: 'fill', name: '肯定句填空',
    instruction: (o) => (o.level >= 3 ? '填入正確的 Be 動詞（is / are / was / were）。' : '依括號提示，填入正確的 Be 動詞。'),
    gen(rng, o) {
      if (o.level >= 3 && rng.chance(0.3)) {
        // two nouns: the Be verb agrees with the nearer one
        const d = draw(rng, o, (n) => n.num !== 'u'); if (!d) return null;
        const others = NOUNS.filter((x) => x !== d.n && x.lvl <= o.level && x.num !== 'u' && x.places.includes(d.place) && isPl(x) !== isPl(d.n));
        if (!others.length) return null;
        const m = rng.pick(others);
        return { lines: [['There ', blank(be(d.n, d.past)), ` ${d.n.en} and ${m.en}${tail(d.place, d.t)}.`]], zh: zhThere(d, '有', '。', `${d.n.zh}和${m.zh}`), meta: meta(d, { kind: 'two', second: m.en }) };
      }
      const d = draw(rng, o); if (!d) return null;
      const hint = o.level >= 3 ? '' : ' (be)';
      const line = d.t && rng.chance(0.3)
        ? [`${cap(d.t.en)}, there `, blank(be(d.n, d.past)), `${hint} ${d.n.en}${tail(d.place, null)}.`]
        : ['There ', blank(be(d.n, d.past)), `${hint} ${d.n.en}${tail(d.place, d.t)}.`];
      return { lines: [line], zh: zhThere(d, '有', '。'), meta: meta(d, { kind: 'fill' }) };
    },
  },
  {
    id: 'neg', name: '否定句', instruction: (o) => negInstruction(o) + '（some 要改成 any）',
    gen(rng, o) {
      const d = draw(rng, o, (n) => n.neg); if (!d) return null;
      const abbr = wantAbbr(rng, o), b = be(d.n, d.past);
      const bl = abbr ? [blank(NEG[b])] : [blank(b), ' ', blank('not')];
      return {
        lines: [[`There ${b} ${d.n.en}${tail(d.place, d.t)}.`], ['→ There ', ...bl, ` ${anyOf(d.n)}${tail(d.place, d.t)}.${abbrMark(o, abbr)}`]],
        zh: zhThere(d, '沒有', '。', bare(d.n)), meta: meta(d, { kind: 'neg', abbr }),
      };
    },
  },
  {
    id: 'q', name: '疑問句', instruction: () => '改成疑問句（some 要改成 any）。',
    gen(rng, o) {
      const d = draw(rng, o, (n) => n.neg); if (!d) return null;
      const b = be(d.n, d.past);
      return {
        lines: [[`There ${b} ${d.n.en}${tail(d.place, d.t)}.`], ['→ ', blank(cap(b)), ` there ${anyOf(d.n)}${tail(d.place, d.t)}?`]],
        zh: zhThere(d, '有', '嗎？', bare(d.n)), meta: meta(d, { kind: 'q' }),
      };
    },
  },
  {
    id: 'short', name: '簡答', instruction: () => '填入 Be 動詞，並完成簡答（否定簡答請用縮寫）。',
    gen(rng, o) {
      const d = draw(rng, o, (n) => n.neg); if (!d) return null;
      const b = be(d.n, d.past), yes = rng.chance(0.5);
      return {
        lines: [[blank(cap(b)), ` there ${anyOf(d.n)}${tail(d.place, d.t)}? — ${yes ? 'Yes' : 'No'}, `, blank('there'), ' ', blank(yes ? b : NEG[b]), '.']],
        zh: zhThere(d, '有', '嗎？', bare(d.n)), meta: meta(d, { kind: 'reply' }),
      };
    },
  },
  {
    id: 'full', name: '詳答', instruction: () => '依問句回答：先簡答（否定請用縮寫），再寫出那裡有什麼。',
    gen(rng, o) {
      const d = draw(rng, o, (n) => n.neg && n.num === 'sg'); if (!d) return null;
      const others = NOUNS.filter((x) => x !== d.n && x.lvl <= o.level && x.places.includes(d.place));
      if (!others.length) return null;
      const m = rng.pick(others), b = be(d.n, d.past), b2 = be(m, d.past);
      return {
        lines: [[`${cap(b)} there ${d.n.en}${tail(d.place, d.t)}?`], ['— No, ', blank('there'), ' ', blank(NEG[b]), '. ', blank('There'), ' ', blank(b2), ` ${m.en}${tail(d.place, null)}.`]],
        zh: zhThere(d, '有', '嗎？'), meta: meta(d, { kind: 'full', second: m.en }),
      };
    },
  },
  {
    id: 'wh', name: 'How many 問句', instruction: () => '填入正確的 Be 動詞。',
    gen(rng, o) {
      const d = draw(rng, o, (n) => n.count); if (!d) return null;
      const num = d.n.en.split(' ')[0];
      return {
        lines: [[`How many ${d.n.count} `, blank(be(d.n, d.past)), ` there${tail(d.place, d.t)}? — ${cap(num)}.`]],
        zh: zhJoin(d.t?.zh, PLACE_ZH[d.place], `有幾${COUNT_ZH[d.n.count].join('')}`) + '？', meta: meta(d, { kind: 'wh' }),
      };
    },
  },
];

export default {
  id: 'there',
  code: 'THR',
  title: 'There is / There are',
  grade: 7,
  past: true,
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['fill'], 2: ['fill', 'neg', 'q', 'short'], 3: ['fill', 'neg', 'q', 'short', 'full', 'wh'] },
  levelHint: { 1: '單數與複數名詞，括號附提示。', 2: '加入 many、some，肯定、否定、疑問混合。', 3: '加入不可數名詞、兩個名詞時看最近的名詞，不給提示。' },
  grammarBox: (o) => ({ head: ['後面的名詞', ...(o.tense !== 'D' ? ['現在式'] : []), ...(o.tense !== 'P' ? ['過去式'] : [])],
    rows: [['單數名詞、不可數名詞', ...(o.tense !== 'D' ? ['There is'] : []), ...(o.tense !== 'P' ? ['There was'] : [])], ['複數名詞', ...(o.tense !== 'D' ? ['There are'] : []), ...(o.tense !== 'P' ? ['There were'] : [])]],
    note: '否定與疑問句裡 some 改成 any。兩個名詞時，Be 動詞跟最靠近的名詞一致。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
