// Topic: participles after a noun — the boy playing basketball (doing it), the cake made by my mother (done to it).
import { blank, cap, zhJoin } from '../core.js';

// People doing something: [noun, Chinese, plural?]
const WHO = [['the boy', '那個男孩', false], ['the girl', '那個女孩', false], ['the man', '那位男士', false], ['the woman', '那位女士', false], ['the students', '那些學生', true], ['the children', '那些孩子', true]];
// What they are doing: [base, -ing, rest, Chinese]
const ACTS = [
  ['play', 'playing', 'basketball', '打籃球'], ['sing', 'singing', 'on the stage', '在台上唱歌'], ['talk', 'talking', 'to the teacher', '跟老師說話'], ['sit', 'sitting', 'under the tree', '坐在樹下'],
  ['run', 'running', 'in the park', '在公園跑步'], ['wait', 'waiting', 'for the bus', '等公車'], ['read', 'reading', 'a book', '看書'], ['stand', 'standing', 'by the door', '站在門邊'],
  ['swim', 'swimming', 'in the river', '在河裡游泳'], ['dance', 'dancing', 'with Amy', '和 Amy 跳舞'], ['wear', 'wearing', 'a red hat', '戴紅帽子'], ['ride', 'riding', 'a bicycle', '騎腳踏車'],
];
// The rest of the sentence: [singular, plural, Chinese]
const MAIN = [['is my friend.', 'are my friends.', '是我的朋友'], ['is from Taichung.', 'are from Taichung.', '來自台中'], ['is my cousin.', 'are my classmates.', ['是我的表親', '是我的同學']]];
const mainZh = (m, pl) => (Array.isArray(m[2]) ? m[2][pl ? 1 : 0] : m[2]);
// Things done to: [noun, Chinese, verb base, past participle, rest, Chinese of the phrase, the rest of the sentence, Chinese]
const DONE = [
  ['the cake', '蛋糕', 'make', 'made', 'by my mother', '我媽媽做的', 'is delicious', '很好吃'], ['the window', '窗戶', 'break', 'broken', 'by the boys', '那些男孩打破的', 'is still not fixed', '還沒修好'],
  ['the letter', '信', 'write', 'written', 'by Tom', 'Tom 寫的', 'is on the desk', '在書桌上'], ['the pictures', '照片', 'take', 'taken', 'by my father', '我爸爸拍的', 'are beautiful', '很漂亮'],
  ['the songs', '歌', 'sing', 'sung', 'by her', '她唱的', 'are very popular', '很受歡迎'], ['the toys', '玩具', 'make', 'made', 'in Taiwan', '台灣製造的', 'are cheap', '很便宜'],
  ['the bicycle', '腳踏車', 'steal', 'stolen', 'last night', '昨晚被偷的', 'was found today', '今天找到了'], ['the food', '食物', 'cook', 'cooked', 'by my grandmother', '我奶奶煮的', 'is very good', '很好吃'],
  ['the house', '房子', 'build', 'built', 'last year', '去年蓋的', 'is very big', '很大'], ['the book', '書', 'write', 'written', 'by him', '他寫的', 'is very interesting', '很有趣'],
  ['the money', '錢', 'find', 'found', 'on the street', '在街上撿到的', 'is in the box', '在盒子裡'], ['the bag', '袋子', 'leave', 'left', 'on the bus', '留在公車上的', 'is mine', '是我的'],
  ['the cookies', '餅乾', 'bake', 'baked', 'by Amy', 'Amy 烤的', 'are sweet', '很甜'], ['the picture', '圖', 'draw', 'drawn', 'by my sister', '我姊姊畫的', 'is on the wall', '在牆上'],
  ['the cups', '杯子', 'wash', 'washed', 'by Tom', 'Tom 洗的', 'are clean', '很乾淨'], ['the story', '故事', 'tell', 'told', 'by our teacher', '我們老師說的', 'was very funny', '很好笑'],
  ['the dog', '狗', 'call', 'called', 'Lucky', '叫做 Lucky 的', 'is very cute', '很可愛'], ['the boxes', '箱子', 'carry', 'carried', 'by the students', '學生們搬的', 'are very heavy', '很重'],
];

const MODES = [
  {
    id: 'ing', name: '名詞 + V-ing', instruction: () => '「正在做…的人」：名詞後面接 V-ing，依括號提示填入。',
    gen(rng) {
      const [n, nz, pl] = rng.fresh(WHO, (x) => x[0]);
      const [b, ing, rest, az] = rng.fresh(ACTS, (x) => x[0]);
      const m = rng.pick(MAIN), [sg, plm] = m;
      return { lines: [[`${cap(n)} `, blank(ing), ` (${b}) ${rest} ${pl ? plm : sg}`]], zh: zhJoin(`${az}的${nz}`, mainZh(m, pl)) + '。', meta: { kind: 'ing', base: b, form: ing } };
    },
  },
  {
    id: 'ed', name: '名詞 + 過去分詞', instruction: () => '「被…的東西」：名詞後面接過去分詞，依括號提示填入。',
    gen(rng) {
      const [n, nz, b, pp, rest, rz, main, mz] = rng.fresh(DONE, (x) => x[0] + x[4]);
      return { lines: [[`${cap(n)} `, blank(pp), ` (${b}) ${rest} ${main}.`]], zh: `${rz}${nz}${mz}。`, meta: { kind: 'ed', base: b, form: pp } };
    },
  },
  {
    id: 'mix', name: 'V-ing 或過去分詞', instruction: () => '主動「正在做」用 V-ing，被動「被做」用過去分詞：依括號提示填入正確的形式。',
    gen(rng) {
      if (rng.fresh([true, false], (x) => 'mx-' + x)) return { ...MODES[0].gen(rng), meta: { kind: 'mix', form: 'ing' } };
      return { ...MODES[1].gen(rng), meta: { kind: 'mix', form: 'ed' } };
    },
  },
];

export default {
  id: 'partnoun',
  code: 'PMN',
  title: '分詞修飾名詞',
  grade: 9,
  past: false,
  variety: false, // checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { ing: 60, ed: DONE.length, mix: 40 },
  defaultModes: { 1: ['ing'], 2: ['ing', 'ed'], 3: ['ing', 'ed', 'mix'] },
  levelHint: { 1: '名詞 + V-ing（正在做…的）。', 2: '加入名詞 + 過去分詞（被…的）。', 3: '再加入兩種混合判斷。' },
  grammarBox: (o) => ({ head: ['形式', '意思', '例子'], rows: [
    ['名詞 + V-ing', '主動、正在做', 'The boy playing basketball is my brother.'],
    ...(o.level >= 2 ? [['名詞 + 過去分詞', '被動、被做', 'The cake made by my mother is delicious.']] : []),
  ], note: '分詞片語放在名詞後面，修飾前面的名詞；整句的動詞要看前面的名詞。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
