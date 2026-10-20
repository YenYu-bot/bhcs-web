// Topic: too … to, … enough to, so … that.
import { blank, zhJoin } from '../core.js';

// [subject, Chinese, adjective, Chinese, what cannot be done (base form), Chinese, pronoun for so…that]
const T = (s, sz, adj, az, act, actz, pr, obj = '') => ({ s, sz, adj, az, act, actz, pr, obj });
const TOO = [
  T('The box', '這個箱子', 'heavy', '重', 'carry', '搬', 'I', 'it'), T('The tea', '這杯茶', 'hot', '燙', 'drink', '喝', 'I', 'it'), T('The boy', '那個男孩', 'young', '小', 'drive a car', '開車', 'he'),
  T('The question', '這個問題', 'difficult', '難', 'answer', '回答', 'we', 'it'), T('My grandfather', '我爺爺', 'old', '老', 'climb the mountain', '爬山', 'he'), T('The shoes', '這雙鞋', 'small', '小', 'wear', '穿', 'I', 'them'),
  T('Tom', 'Tom', 'tired', '累', 'do his homework', '寫功課', 'he'), T('The water', '水', 'cold', '冷', 'swim in', '游泳', 'we', ''), T('The bag', '這個袋子', 'expensive', '貴', 'buy', '買', 'I', 'it'),
  T('The baby', '那個嬰兒', 'small', '小', 'walk', '走路', 'she'), T('The soup', '這道湯', 'hot', '燙', 'eat', '吃', 'I', 'it'), T('Amy', 'Amy', 'busy', '忙', 'go to the party', '去派對', 'she'),
  T('The room', '這個房間', 'dark', '暗', 'read in', '看書', 'I', ''), T('The movie', '這部電影', 'long', '長', 'watch tonight', '今晚看完', 'we', 'it'),
];
// … enough to: [subject, Chinese, adjective or noun, Chinese, action, Chinese, is noun?]
const E = (s, sz, word, wz, act, actz, noun = false, verb = 'is') => ({ s, sz, word, wz, act, actz, noun, verb });
const ENOUGH = [
  E('Tom', 'Tom', 'tall', '高', 'reach the shelf', '搆到架子'), E('My brother', '我哥哥', 'old', '大', 'drive a car', '開車'), E('The water', '水', 'warm', '暖', 'swim in', '游泳'),
  E('She', '她', 'strong', '壯', 'carry the box', '搬箱子'), E('The room', '這個房間', 'big', '大', 'hold fifty people', '容納五十個人'), E('He', '他', 'rich', '有錢', 'buy a house', '買房子'),
  E('The boy', '那個男孩', 'smart', '聰明', 'answer the question', '回答問題'), E('I', '我', 'money', '錢', 'buy the bag', '買這個袋子', true, 'have'), E('We', '我們', 'time', '時間', 'finish the work', '完成工作', true, 'have'),
  E('They', '他們', 'food', '食物', 'feed all the people', '餵飽所有人', true, 'have'), E('She', '她', 'chairs', '椅子', 'seat all the children', '讓所有孩子坐', true, 'has'), E('The cake', '這個蛋糕', 'big', '大', 'feed ten people', '給十個人吃'),
];
const AM = (s) => (s === 'I' ? 'am' : ['We', 'They', 'The shoes'].includes(s) ? 'are' : 'is');
const CANT = (pr) => ({ I: "I can\'t", we: "we can\'t", he: "he can\'t", she: "she can\'t" }[pr]);

const MODES = [
  {
    id: 'too', name: 'too … to', instruction: () => '填入 too 和 to，表示「太…而不能…」。',
    gen(rng) {
      const t = rng.fresh(TOO, (x) => x.s + x.adj);
      return { lines: [[`${t.s} ${AM(t.s)} `, blank('too'), ` ${t.adj} `, blank('to'), ` ${t.act}.`]], zh: zhJoin(t.sz, `太${t.az}了，沒辦法${t.actz}`) + '。', meta: { kind: 'too', adj: t.adj } };
    },
  },
  {
    id: 'enough', name: '… enough to', instruction: () => '把括號裡的字和 enough 依正確順序填入：形容詞 + enough，enough + 名詞。',
    gen(rng) {
      const e = rng.fresh(ENOUGH, (x) => x.s + x.word);
      const bl = e.noun ? [blank('enough'), ' ', blank(e.word)] : [blank(e.word), ' ', blank('enough')];
      return { lines: [[`${e.s} ${e.verb} `, ...bl, ` to ${e.act}. (${e.word}／enough)`]], zh: zhJoin(e.sz, e.noun ? `有足夠的${e.wz}可以${e.actz}` : `夠${e.wz}，可以${e.actz}`) + '。', meta: { kind: 'enough', word: e.word, noun: e.noun } };
    },
  },
  {
    id: 'so', name: 'so … that', instruction: () => '填入 so 和 that，表示「如此…以致於…」。',
    gen(rng) {
      const t = rng.fresh(TOO, (x) => 'so-' + x.s + x.adj);
      return { lines: [[`${t.s} ${AM(t.s)} `, blank('so'), ` ${t.adj} `, blank('that'), ` ${CANT(t.pr)} ${t.act}${t.obj ? ' ' + t.obj : ''}.`]], zh: zhJoin(t.sz, `太${t.az}了，${t.pr === 'I' ? '我' : t.pr === 'we' ? '我們' : t.pr === 'he' ? '他' : '她'}沒辦法${t.actz}`) + '。', meta: { kind: 'so', adj: t.adj } };
    },
  },
  {
    id: 'swap', name: 'too … to 改寫成 so … that', instruction: () => '把 too … to 的句子改寫成 so … that，填入 so、that 和主詞 + can\'t（一個空格填一個字）。',
    gen(rng) {
      const t = rng.fresh(TOO, (x) => 'sw-' + x.s + x.adj);
      const [pr, cant] = CANT(t.pr).split(' ');
      return {
        lines: [[`${t.s} ${AM(t.s)} too ${t.adj} to ${t.act}.`], [`→ ${t.s} ${AM(t.s)} `, blank('so'), ` ${t.adj} `, blank('that'), ' ', blank(pr), ' ', blank(cant), ` ${t.act}${t.obj ? ' ' + t.obj : ''}.`]],
        zh: zhJoin(t.sz, `太${t.az}了，沒辦法${t.actz}`) + '。', meta: { kind: 'swap', adj: t.adj, pr },
      };
    },
  },
];

export default {
  id: 'tooenough',
  code: 'TOO',
  title: 'too … to / enough / so … that',
  grade: 9,
  past: false,
  variety: false, // fixed sentence lists; checked by their own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { too: TOO.length, enough: ENOUGH.length, so: TOO.length, swap: TOO.length },
  defaultModes: { 1: ['too', 'enough'], 2: ['too', 'enough', 'so'], 3: ['too', 'enough', 'so', 'swap'] },
  levelHint: { 1: 'too … to 與 enough 的位置。', 2: '加入 so … that。', 3: '再加入 too … to 改寫成 so … that。' },
  grammarBox: (o) => ({ head: ['句型', '意思', '例子'], rows: [
    ['too + 形容詞 + to V', '太…而不能…', 'The box is too heavy to carry.'], ['形容詞 + enough to V', '夠…可以…', 'Tom is tall enough to reach it.'], ['enough + 名詞', '足夠的…', 'I have enough money to buy it.'],
    ...(o.level >= 2 ? [['so + 形容詞 + that + 子句', '如此…以致於…', 'The box is so heavy that I can\'t carry it.']] : []),
  ], note: 'enough 放在形容詞後面、名詞前面；too … to 本身有否定意思，改成 so … that 時子句要加 can\'t，受詞要補回來（carry it）。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
