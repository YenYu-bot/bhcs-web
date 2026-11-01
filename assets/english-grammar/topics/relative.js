// Topic: relative clauses — the boy who lives next door, the book which is on the desk; the verb in the clause agrees with the noun.
import { blank, cap, zhJoin } from '../core.js';

// Nouns: [singular, plural, Chinese, measure word, kind 'person' | 'thing' | 'animal', gender for people ('m' | 'f' | 'any'), clauses that fit]
const N = (sg, pl, zh, m, kind, g, fits) => ({ sg, pl, zh, m, kind, g, fits });
const NOUNS = [
  N('the boy', 'the boys', '男孩', '個', 'person', 'm', ['live next door', 'sit by the window', 'wear a red hat', 'play the piano well', 'speak three languages', 'sing on television', 'come from Taichung', 'run very fast', 'like to swim']),
  N('the girl', 'the girls', '女孩', '個', 'person', 'f', ['live next door', 'sit by the window', 'wear a red hat', 'play the piano well', 'speak three languages', 'sing on television', 'come from Taichung', 'run very fast', 'like to swim']),
  N('the man', 'the men', '男人', '個', 'person', 'm', ['live next door', 'sit by the window', 'wear a red hat', 'work in the hospital', 'speak three languages', 'come from Taichung', 'help sick people', 'teach us science']),
  N('the woman', 'the women', '女人', '個', 'person', 'f', ['live next door', 'sit by the window', 'wear a red hat', 'work in the hospital', 'speak three languages', 'come from Taichung', 'help sick people', 'teach us science']),
  N('the teacher', 'the teachers', '老師', '位', 'person', 'any', ['teach us science', 'come from Taichung', 'speak three languages', 'play the piano well', 'live next door', 'wear a red hat', 'sit by the window']),
  N('the student', 'the students', '學生', '個', 'person', 'any', ['live next door', 'sit by the window', 'wear a red hat', 'play the piano well', 'speak three languages', 'run very fast', 'like to swim', 'come from Taichung', 'sing on television']),
  N('the doctor', 'the doctors', '醫生', '位', 'person', 'any', ['help sick people', 'work in the hospital', 'live next door', 'come from Taichung', 'speak three languages']),
  N('the singer', 'the singers', '歌手', '位', 'person', 'any', ['sing on television', 'come from Taichung', 'play the piano well', 'wear a red hat', 'speak three languages']),
  N('the book', 'the books', '書', '本', 'thing', null, ['be on the desk', 'have many pictures', 'make people laugh', 'be very old', 'cost a lot of money']),
  N('the movie', 'the movies', '電影', '部', 'thing', null, ['make people laugh', 'be very old', 'be very popular']),
  N('the car', 'the cars', '車', '輛', 'thing', null, ['be made in Taiwan', 'cost a lot of money', 'be very old', 'run very fast']),
  N('the house', 'the houses', '房子', '間', 'thing', null, ['be very old', 'cost a lot of money', 'be very big']),
  N('the cake', 'the cakes', '蛋糕', '個', 'thing', null, ['taste sweet', 'be on the desk', 'cost a lot of money']),
  N('the song', 'the songs', '歌', '首', 'thing', null, ['make people laugh', 'be very old', 'be very popular']),
  N('the picture', 'the pictures', '圖', '張', 'thing', null, ['be on the desk', 'be very old', 'make people laugh', 'cost a lot of money']),
  N('the computer', 'the computers', '電腦', '台', 'thing', null, ['be on the desk', 'be made in Taiwan', 'cost a lot of money', 'be very old']),
  N('the dog', 'the dogs', '狗', '隻', 'animal', null, ['run very fast', 'sleep under the tree', 'have long ears', 'like to swim']),
  N('the cat', 'the cats', '貓', '隻', 'animal', null, ['sleep under the tree', 'eat fish', 'have long ears']),
  N('the bird', 'the birds', '鳥', '隻', 'animal', null, ['fly in the sky', 'eat fish', 'sing in the tree']),
  N('the rabbit', 'the rabbits', '兔子', '隻', 'animal', null, ['have long ears', 'sleep under the tree', 'run very fast']),
];
// Clauses: [base verb, -s form, rest, Chinese (modifier form, ends with 的), kinds it fits]
const C = (base, s, rest, zh, kinds) => ({ base, s, rest, zh, kinds });
const CLAUSES = [
  C('live', 'lives', 'next door', '住在隔壁的', ['person']), C('sit', 'sits', 'by the window', '坐在窗邊的', ['person']), C('wear', 'wears', 'a red hat', '戴紅帽子的', ['person']),
  C('play', 'plays', 'the piano well', '鋼琴彈得很好的', ['person']), C('speak', 'speaks', 'three languages', '會說三種語言的', ['person']), C('help', 'helps', 'sick people', '幫助病人的', ['person']),
  C('teach', 'teaches', 'us science', '教我們自然的', ['person']), C('sing', 'sings', 'on TV', '在電視上唱歌的', ['person']), C('work', 'works', 'in the hospital', '在醫院工作的', ['person']),
  C('come', 'comes', 'from Taichung', '來自台中的', ['person']), C('run', 'runs', 'very fast', '跑得很快的', ['person', 'animal']), C('like', 'likes', 'to swim', '喜歡游泳的', ['person', 'animal']),
  C('sleep', 'sleeps', 'under the tree', '睡在樹下的', ['animal']), C('have', 'has', 'long ears', '有長耳朵的', ['animal']), C('eat', 'eats', 'fish', '吃魚的', ['animal']), C('fly', 'flies', 'in the sky', '在天上飛的', ['animal']), C('sing', 'sings', 'in the tree', '在樹上唱歌的', ['animal']),
  C('be', 'is', 'on the desk', '在書桌上的', ['thing']), C('be', 'is', 'made in Taiwan', '台灣製造的', ['thing']), C('cost', 'costs', 'a lot of money', '很貴的', ['thing']), C('have', 'has', 'many pictures', '有很多圖片的', ['thing']),
  C('make', 'makes', 'people laugh', '讓人發笑的', ['thing']), C('taste', 'tastes', 'sweet', '嘗起來很甜的', ['thing']), C('be', 'is', 'very old', '很舊的', ['thing']), C('be', 'is', 'very big', '很大的', ['thing']), C('be', 'is', 'very popular', '很受歡迎的', ['thing']),
];
const key = (c) => `${c.base} ${c.rest}`;
const clausesFor = (n) => CLAUSES.filter((c) => n.fits.includes(key(c)));
// Main sentences around the noun phrase: [template with {N}, Chinese with {N}, kind, number 'sg' | 'pl' | 'any', gender, nouns it fits]
//   A song is heard and a movie watched, not "looked at"; a movie is not "mine".
const SEEN = ['the book', 'the car', 'the house', 'the cake', 'the picture', 'the computer', 'the dog', 'the cat', 'the bird', 'the rabbit'];
const OWNED = ['the book', 'the car', 'the cake', 'the picture', 'the computer', 'the dog', 'the cat', 'the bird', 'the rabbit'];
const MAIN = [
  ['{N} is my friend.', '{N}是我的朋友。', 'person', 'sg'], ['{N} are my friends.', '{N}是我的朋友。', 'person', 'pl'], ['I know {N}.', '我認識{N}。', 'person', 'any'],
  ['Do you know {N}?', '你認識{N}嗎？', 'person', 'any'], ['{N} is Mr. Chen.', '{N}是陳先生。', 'person', 'sg', 'm'], ['{N} is Ms. Lin.', '{N}是林小姐。', 'person', 'sg', 'f'],
  ['I want to meet {N}.', '我想見見{N}。', 'person', 'any'],
  ['I like {N}.', '我喜歡{N}。', 'thing', 'any'], ['{N} is mine.', '{N}是我的。', 'thing', 'sg', null, OWNED], ['{N} are mine.', '{N}是我的。', 'thing', 'pl', null, OWNED],
  ['Look at {N}.', '看看{N}。', 'thing', 'any', null, SEEN], ["Let's watch {N}.", '我們來看{N}吧。', 'thing', 'any', null, ['the movie']],
  ["Let's listen to {N}.", '我們來聽{N}吧。', 'thing', 'any', null, ['the song']], ['{N} is very good.', '{N}很好。', 'thing', 'sg', null, ['the movie', 'the song', 'the book']],
  ['I like {N}.', '我喜歡{N}。', 'animal', 'any'], ['{N} is mine.', '{N}是我的。', 'animal', 'sg', null, OWNED], ['Look at {N}.', '看看{N}。', 'animal', 'any', null, SEEN],
];
const pron = (n) => (n.kind === 'person' ? 'who' : 'which');
/** As an answer, that is right too. */
const pronKey = (n) => `${pron(n)}／that`;
const verbOf = (c, pl) => (pl ? (c.base === 'be' ? 'are' : c.base) : c.s);

function draw(rng, o) {
  const n = rng.fresh(NOUNS, (x) => x.sg);
  const pl = o.level >= 2 && rng.chance(0.4);
  const c = rng.fresh(clausesFor(n), key);
  const mains = MAIN.filter((m) => m[2] === n.kind && (m[3] === 'any' || m[3] === (pl ? 'pl' : 'sg')) && (!m[4] || n.g === m[4] || (n.g === 'any' && !/student/.test(n.sg))) && (!m[5] || m[5].includes(n.sg)));
  const [tpl, zhT] = rng.pick(mains);
  const np = pl ? n.pl : n.sg;
  const zhNP = `${c.zh}${pl ? '那些' : '那' + n.m}${n.zh}`;
  return { n, pl, c, tpl, zhT, np, zhNP };
}
const meta = (d, extra) => ({ kind: d.n.kind, pl: d.pl, base: d.c.base, ...extra });

const MODES = [
  {
    id: 'who', name: 'who 或 which', instruction: () => '填入關係代名詞：人用 who，事物、動物用 which（兩者都可以用 that）。',
    gen(rng, o) {
      const d = draw(rng, o);
      const clause = `${d.np} ___ ${verbOf(d.c, d.pl)} ${d.c.rest}`;
      const [l, r] = d.tpl.split('{N}');
      const parts = [l + d.np + ' ', blank(pronKey(d.n)), ` ${verbOf(d.c, d.pl)} ${d.c.rest}` + r];
      return { lines: [parts.map((p, i) => (i === 0 && typeof p === 'string' ? cap(p) : p))], zh: d.zhT.replace('{N}', d.zhNP), meta: meta(d, { mode: 'who' }) };
    },
  },
  {
    id: 'join', name: '合併句子', instruction: () => '用 who 或 which（也可用 that）把兩句合併成一句。',
    gen(rng, o) {
      const d = draw(rng, o);
      const [l, r] = d.tpl.split('{N}');
      const he = d.n.g === 'f' || (d.n.g === 'any' && (d.tpl.includes('Ms.') || (!d.tpl.includes('Mr.') && rng.chance(0.5)))) ? 'She' : 'He';
      const second = `${d.pl ? 'They' : d.n.kind === 'person' ? he : 'It'} ${verbOf(d.c, d.pl)} ${d.c.rest}.`;
      const first = cap(l + d.np + r);
      return { lines: [[`${first} ${second}`], ['→ ' + cap(l + d.np) + ' ', blank(pronKey(d.n)), ` ${verbOf(d.c, d.pl)} ${d.c.rest}` + r]], zh: d.zhT.replace('{N}', d.zhNP), meta: meta(d, { mode: 'join' }) };
    },
  },
  {
    id: 'verb', name: '關係子句的動詞', instruction: () => '關係子句的動詞要跟著前面的名詞變化：依括號提示填入正確形式。',
    gen(rng, o) {
      const d = draw(rng, { ...o, level: Math.max(o.level, 2) });
      const [l, r] = d.tpl.split('{N}');
      return { lines: [[cap(l + d.np) + ` ${pron(d.n)} `, blank(verbOf(d.c, d.pl)), ` (${d.c.base}) ${d.c.rest}` + r]], zh: d.zhT.replace('{N}', d.zhNP), meta: meta(d, { mode: 'verb' }) };
    },
  },
];

export default {
  id: 'relative',
  code: 'REL',
  title: '關係子句 who / which',
  grade: 9,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['who'], 2: ['who', 'join'], 3: ['who', 'join', 'verb'] },
  levelHint: { 1: '單數名詞，填 who 或 which。', 2: '加入複數名詞與合併兩句。', 3: '再加入關係子句裡的動詞變化（單數加 -s，複數不加）。' },
  grammarBox: (o) => ({ head: ['先行詞', '關係代名詞', '例子'], rows: [
    ['人', 'who（也可用 that）', 'the boy who lives next door'], ['事物、動物', 'which（也可用 that）', 'the book which is on the desk'],
    ...(o.level >= 3 ? [['子句動詞', '跟著先行詞變化', 'the boy who lives… / the boys who live…']] : []),
  ], note: '關係代名詞代替前面的名詞，當子句的主詞；who 和 which 都可以換成 that。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
