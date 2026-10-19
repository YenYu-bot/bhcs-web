// Topic: conjunctions — and / but / or, so / because, and turning "so" into "because".
import { blank, cap } from '../core.js';

// Sentences with one conjunction. [left, conjunction, right, Chinese]; the Chinese names the link (和、但是、還是、所以、因為).
const ABO = [
  ['I like apples', 'and', 'bananas.', '我喜歡蘋果和香蕉。'], ['Tom is tall', 'and', 'strong.', 'Tom 又高又壯。'], ['She can sing', 'and', 'dance.', '她會唱歌也會跳舞。'],
  ['My father cooks dinner', 'and', 'my mother washes the dishes.', '我爸爸煮晚餐，我媽媽洗碗。'], ['We played basketball', 'and', 'went home.', '我們打了籃球，然後回家。'],
  ['I have a dog', 'and', 'two cats.', '我有一隻狗和兩隻貓。'], ['Amy reads books', 'and', 'listens to music on weekends.', 'Amy 週末看書和聽音樂。'],
  ['Ben likes dogs,', 'but', 'his sister likes cats.', 'Ben 喜歡狗，但是他姊姊喜歡貓。'], ['The bag is nice,', 'but', 'it is too expensive.', '這個袋子很好看，但是太貴了。'],
  ['I can swim,', 'but', "I can't ski.", '我會游泳，但是不會滑雪。'], ['It is sunny,', 'but', 'it is cold.', '天氣晴朗，但是很冷。'], ['She is young,', 'but', 'she is very smart.', '她很年輕，但是很聰明。'],
  ['He studied hard,', 'but', 'he failed the test.', '他很用功，但是考試沒過。'], ['The movie was long,', 'but', 'it was interesting.', '那部電影很長，但是很有趣。'],
  ['I wanted to go out,', 'but', 'it rained.', '我想出門，但是下雨了。'],
  ['Do you want tea', 'or', 'coffee?', '你要茶還是咖啡？'], ['Is your brother a doctor', 'or', 'a teacher?', '你哥哥是醫生還是老師？'], ['We can go by bus', 'or', 'by train.', '我們可以搭公車或搭火車去。'],
  ['Is it Monday', 'or', 'Tuesday today?', '今天是星期一還是星期二？'], ['Do you walk to school', 'or', 'take the bus?', '你走路上學還是搭公車？'], ['Which do you like, summer', 'or', 'winter?', '你喜歡哪一個，夏天還是冬天？'],
  ['You can call me', 'or', 'write me a letter.', '你可以打電話給我或寫信給我。'],
  ['My sister likes music', 'and', 'art.', '我姊姊喜歡音樂和美術。'], ['He got up', 'and', 'brushed his teeth.', '他起床，然後刷牙。'], ['The dog is big', 'and', 'friendly.', '那隻狗又大又友善。'],
  ['I was hungry,', 'but', 'there was no food.', '我很餓，但是沒有食物。'], ['The test was hard,', 'but', 'I passed.', '考試很難，但是我過了。'], ['Tom is short,', 'but', 'he plays basketball well.', 'Tom 很矮，但是籃球打得很好。'],
  ['Do you want rice', 'or', 'noodles?', '你要飯還是麵？'], ['Will you go by car', 'or', 'by bicycle?', '你會開車還是騎腳踏車去？'], ['Is the answer yes', 'or', 'no?', '答案是「是」還是「不是」？'],
];
const SB = [
  ['I was tired,', 'so', 'I went to bed early.', '我很累，所以很早就睡了。'], ['It rained,', 'so', 'we stayed at home.', '下雨了，所以我們待在家裡。'], ['He was late,', 'so', 'he ran to school.', '他遲到了，所以跑去學校。'],
  ['She was hungry,', 'so', 'she ate two sandwiches.', '她很餓，所以吃了兩個三明治。'], ['The test was easy,', 'so', 'all the students passed.', '考試很簡單，所以所有學生都過了。'], ['I had no money,', 'so', "I didn't buy the book.", '我沒有錢，所以沒買那本書。'],
  ['The room was dirty,', 'so', 'we cleaned it.', '房間很髒，所以我們把它打掃了。'], ['My mother was busy,', 'so', 'I cooked dinner.', '我媽媽很忙，所以我煮了晚餐。'], ['It was hot,', 'so', 'they went swimming.', '天氣很熱，所以他們去游泳。'],
  ['Tom was sick,', 'so', "he didn't go to school.", 'Tom 生病了，所以沒去上學。'],
  ['I went to bed early', 'because', 'I was tired.', '我很早就睡了，因為我很累。'], ['We stayed at home', 'because', 'it rained.', '我們待在家裡，因為下雨了。'], ['He ran to school', 'because', 'he was late.', '他跑去學校，因為他遲到了。'],
  ['She ate two sandwiches', 'because', 'she was hungry.', '她吃了兩個三明治，因為她很餓。'], ['All the students passed', 'because', 'the test was easy.', '所有學生都過了，因為考試很簡單。'], ["I didn't buy the book", 'because', 'I had no money.', '我沒買那本書，因為我沒有錢。'],
  ['We cleaned the room', 'because', 'it was dirty.', '我們打掃了房間，因為它很髒。'], ['I cooked dinner', 'because', 'my mother was busy.', '我煮了晚餐，因為我媽媽很忙。'], ['They went swimming', 'because', 'it was hot.', '他們去游泳，因為天氣很熱。'],
  ["Tom didn't go to school", 'because', 'he was sick.', 'Tom 沒去上學，因為他生病了。'],
];
// Pairs for rewriting so ↔ because: [cause, result, Chinese of the result-first sentence, Chinese of the cause-first sentence]
const PAIRS = [
  ['I was tired', 'I went to bed early', '我很早就睡了，因為我很累。', '我很累，所以很早就睡了。'], ['it rained', 'we stayed at home', '我們待在家裡，因為下雨了。', '下雨了，所以我們待在家裡。'],
  ['he was late', 'he ran to school', '他跑去學校，因為他遲到了。', '他遲到了，所以跑去學校。'], ['she was hungry', 'she ate two sandwiches', '她吃了兩個三明治，因為她很餓。', '她很餓，所以吃了兩個三明治。'],
  ['the test was easy', 'all the students passed', '所有學生都過了，因為考試很簡單。', '考試很簡單，所以所有學生都過了。'], ['I had no money', "I didn't buy the book", '我沒買那本書，因為我沒有錢。', '我沒有錢，所以沒買那本書。'],
  ['the room was dirty', 'we cleaned it', '我們打掃了房間，因為它很髒。', '房間很髒，所以我們把它打掃了。'], ['my mother was busy', 'I cooked dinner', '我煮了晚餐，因為我媽媽很忙。', '我媽媽很忙，所以我煮了晚餐。'],
  ['it was hot', 'they went swimming', '他們去游泳，因為天氣很熱。', '天氣很熱，所以他們去游泳。'], ['Tom was sick', "he didn't go to school", 'Tom 沒去上學，因為他生病了。', 'Tom 生病了，所以沒去上學。'],
  ['the weather was nice', 'we had a picnic', '我們去野餐，因為天氣很好。', '天氣很好，所以我們去野餐。'], ['I missed the bus', 'I was late for school', '我上學遲到了，因為我錯過了公車。', '我錯過了公車，所以上學遲到了。'],
];
const fill = ([l, c, r, zh], extra) => ({ lines: [[`${l} `, blank(c), ` ${r}`]], zh, meta: { conj: c, ...extra } });

const MODES = [
  { id: 'abo', name: 'and / but / or', instruction: () => '依中文填入 and、but 或 or。', gen: (rng) => fill(rng.fresh(ABO, (x) => x[0] + x[2]), { kind: 'abo' }) },
  { id: 'sb', name: 'so / because', instruction: () => '依中文填入 so 或 because。', gen: (rng) => fill(rng.fresh(SB, (x) => x[0] + x[2]), { kind: 'sb' }) },
  {
    id: 'swap', name: 'so 與 because 互換', instruction: () => '用另一個連接詞改寫句子（so 改成 because，because 改成 so）。',
    gen(rng) {
      const [cause, result, zhB, zhS] = rng.fresh(PAIRS, (x) => x[0]);
      const toBecause = rng.chance(0.5);
      const given = toBecause ? `${cap(cause)}, so ${result}.` : `${cap(result)} because ${cause}.`;
      const out = toBecause ? ['→ ' + cap(result) + ' ', blank('because'), ` ${cause}.`] : ['→ ' + cap(cause) + ', ', blank('so'), ` ${result}.`];
      return { lines: [[given], out], zh: toBecause ? zhB : zhS, meta: { conj: toBecause ? 'because' : 'so', kind: 'swap' } };
    },
  },
];

export default {
  id: 'conj',
  code: 'CNJ',
  title: '連接詞 and / but / or / so / because',
  grade: 7,
  past: false,
  variety: false, // fixed sentence lists; checked by their own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { abo: ABO.length, sb: SB.length, swap: PAIRS.length * 2 },
  defaultModes: { 1: ['abo'], 2: ['abo', 'sb'], 3: ['abo', 'sb', 'swap'] },
  levelHint: { 1: 'and、but、or。', 2: '加入 so、because。', 3: '再加入 so 與 because 互換改寫。' },
  grammarBox: (o) => ({ head: ['連接詞', '意思', '例子'], rows: [
    ['and', '和、而且', 'I like apples and bananas.'], ['but', '但是', 'He is young, but he is smart.'], ['or', '或、還是', 'Do you want tea or coffee?'],
    ...(o.level >= 2 ? [['so', '所以（後面接結果）', 'I was tired, so I slept.'], ['because', '因為（後面接原因）', 'I slept because I was tired.']] : []),
  ], note: 'so 和 because 不能同時用在一句裡：原因 + so + 結果，或 結果 + because + 原因。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
