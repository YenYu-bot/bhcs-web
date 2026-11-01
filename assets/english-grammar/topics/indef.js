// Topic: indefinite pronouns — one / ones; another / the other / the others / others / some.
import { blank } from '../core.js';

// [sentence with # for the blank, answer, Chinese]
const ONE = [
  ['I can\'t find my pen. I need to buy a new #.', 'one', '我找不到我的筆，我需要買一枝新的。'], ['These shoes are old. I want some new #.', 'ones', '這雙鞋舊了，我想要新的。'],
  ['This cup is dirty. Can I have a clean #?', 'one', '這個杯子髒了，我可以要一個乾淨的嗎？'], ['Which bag do you like, the red # or the blue #?', 'one', '你喜歡哪個袋子，紅的還是藍的？'],
  ['My umbrella is broken. I have to get a new #.', 'one', '我的雨傘壞了，我得買一把新的。'], ['These apples are small. Do you have bigger #?', 'ones', '這些蘋果很小，你有大一點的嗎？'],
  ['I don\'t like this hat. Show me another #.', 'one', '我不喜歡這頂帽子，給我看另一頂。'], ['The old books are on the desk, and the new # are on the shelf.', 'ones', '舊書在書桌上，新的在架子上。'],
  ['Your pencil is short. Use this long #.', 'one', '你的鉛筆很短，用這枝長的。'], ['I have two cats: a black # and a white #.', 'one', '我有兩隻貓：一隻黑的和一隻白的。'],
  ['These cookies are sweet. The # in the box are not sweet.', 'ones', '這些餅乾是甜的，盒子裡的不甜。'], ['My bicycle is too old. I want a new #.', 'one', '我的腳踏車太舊了，我想要一輛新的。'],
  ['The small pictures are nice, but the big # are nicer.', 'ones', '小的圖很好看，但大的更好看。'],
  ['This chair is broken. Please bring me another #.', 'one', '這張椅子壞了，請再拿一張給我。'], ['I like the red flowers, not the yellow #.', 'ones', '我喜歡紅色的花，不是黃色的。'],
  ['My watch is old. I want to buy a new #.', 'one', '我的手錶舊了，我想買一支新的。'], ['The first questions are easy, but the last # are hard.', 'ones', '前面的問題簡單，但最後的很難。'],
  ['Do you have a dictionary? I need #.', 'one', '你有字典嗎？我需要一本。'], ['The small boxes are here, and the big # are there.', 'ones', '小盒子在這裡，大的在那裡。'],
  ['Which car is yours, the black # or the white #?', 'one', '哪輛車是你的，黑的還是白的？'], ['These socks are wet. Give me some dry #.', 'ones', '這雙襪子濕了，給我乾的。'],
  ['I don\'t have a pen. Can you lend me #?', 'one', '我沒有筆，你可以借我一枝嗎？'], ['These cups are dirty. Are there any clean #?', 'ones', '這些杯子髒了，有乾淨的嗎？'], ['Is there a bank near here? — Yes, there is # on the corner.', 'one', '這附近有銀行嗎？有，轉角有一間。'],
];
const OTHER = [
  ['I have two pens. One is red, and # is blue.', 'the other', '我有兩枝筆。一枝是紅的，另一枝是藍的。'], ['There are three books. One is mine, another is Tom\'s, and # is Amy\'s.', 'the other', '有三本書。一本是我的，一本是 Tom 的，另一本是 Amy 的。'],
  ['There are three books. One is mine, # is Tom\'s, and the other is Amy\'s.', 'another', '有三本書。一本是我的，一本是 Tom 的，另一本是 Amy 的。'], ['This cake is delicious. Can I have # piece?', 'another', '這個蛋糕很好吃，我可以再吃一塊嗎？'],
  ['Some students like science, and # like history.', 'others', '有些學生喜歡自然，有些喜歡歷史。'], ['There are thirty students in my class. Some are boys, and # are girls.', 'the others', '我們班有三十個學生。有些是男生，其餘的是女生。'],
  ['I don\'t like this shirt. Please show me # one.', 'another', '我不喜歡這件襯衫，請給我看另一件。'], ['Tom has two dogs. One is big, and # is small.', 'the other', 'Tom 有兩隻狗。一隻大，另一隻小。'],
  ['Some people like summer; # like winter.', 'others', '有些人喜歡夏天，有些人喜歡冬天。'], ['There are five apples. Two are red, and # are green.', 'the others', '有五個蘋果。兩個是紅的，其餘的是綠的。'],
  ['One of my brothers is a doctor, and # is a teacher.', 'the other', '我的兩個哥哥，一個是醫生，另一個是老師。'], ['I have four cups. One is broken, and # are fine.', 'the others', '我有四個杯子。一個破了，其餘的都好好的。'],
  ['Would you like # cup of tea?', 'another', '你要再來一杯茶嗎？'], ['Some of the students walk to school, and # take the bus.', 'the others', '這些學生有些走路上學，其餘的搭公車。'],
  ['Some birds fly south in winter, and # stay here.', 'others', '有些鳥冬天往南飛，有些留在這裡。'], ['He finished his sandwich and asked for #.', 'another', '他吃完三明治，又要了一個。'],
  ['There are two girls in the room. One is singing, and # is reading.', 'the other', '房間裡有兩個女孩。一個在唱歌，另一個在看書。'], ['I have ten cards. Three are blue, and # are red.', 'the others', '我有十張卡片。三張是藍的，其餘的是紅的。'],
  ['Some people say yes; # say no.', 'others', '有些人說好，有些人說不。'], ['My shirt is dirty. I will wear # one.', 'another', '我的襯衫髒了，我要穿另一件。'],
];
const two = (ans) => ans.split(' ').flatMap((w, i) => (i ? [' ', blank(w)] : [blank(w)]));
function fill(rows, extra) {
  return (rng) => {
    const [en, ans, zh] = rng.fresh(rows, (x) => x[0]);
    const parts = en.split('#');
    const lines = [parts.flatMap((p, i) => (i < parts.length - 1 ? [p, ...two(ans)] : [p]))];
    return { lines, zh, meta: { ans, ...extra } };
  };
}

export default {
  id: 'indef',
  code: 'IDF',
  title: '不定代名詞 one / another / the other',
  grade: 8,
  past: false,
  variety: false, // fixed sentence lists; checked by their own rules
  modes: [
    { id: 'one', name: 'one 或 ones', instruction: () => '填入 one 或 ones，代替前面提過的名詞（單數 one，複數 ones）。' },
    { id: 'other', name: 'another / the other / others', instruction: () => '填入 another、the other、the others 或 others（一個空格填一個字）。' },
  ],
  capacity: { one: ONE.length, other: OTHER.length },
  defaultModes: { 1: ['one'], 2: ['one', 'other'], 3: ['one', 'other'] },
  levelHint: { 1: 'one / ones。', 2: '加入 another、the other、the others、others。', 3: '同中級。' },
  grammarBox: (o) => ({ head: ['字', '意思', '用法'], rows: [
    ['one / ones', '一個／一些（同類的）', 'a new one、new ones'],
    ...(o.level >= 2 ? [['another', '另一個（不特定、再一個）', 'another cup of tea'], ['the other', '（兩個中）另一個', 'One is red, and the other is blue.'], ['the others', '（一群中）其餘的', 'Some are boys, and the others are girls.'], ['others', '其他的（不特定）', 'Some like summer; others like winter.']] : []),
  ], note: '有確定範圍（兩個、三十個、of the students）就用 the other / the others；沒有範圍就用 another / others。' }),
  generate(rng, o, mode) { return (mode === 'one' ? fill(ONE, { kind: 'one' }) : fill(OTHER, { kind: 'other' }))(rng); },
};
