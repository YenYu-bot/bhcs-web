// Topic: too / either / also, So do I / Neither do I, and pairs: both … and / either … or / neither … nor / not only … but also.
import { blank } from '../core.js';

// too / either / also: [sentence with #, answer, Chinese]
const TOO = [
  ['I like dogs. He likes dogs, #.', 'too', '我喜歡狗。他也喜歡狗。'], ['Amy can swim. Tom can swim, #.', 'too', 'Amy 會游泳。Tom 也會游泳。'], ['We are students. They are students, #.', 'too', '我們是學生。他們也是學生。'],
  ['I don\'t like fish. She doesn\'t like fish, #.', 'either', '我不喜歡魚。她也不喜歡魚。'], ['Tom can\'t drive. His brother can\'t drive, #.', 'either', 'Tom 不會開車。他哥哥也不會開車。'], ['I wasn\'t at home. My sister wasn\'t at home, #.', 'either', '我不在家。我姊姊也不在家。'],
  ['She plays the piano. She # plays the violin.', 'also', '她彈鋼琴。她也拉小提琴。'], ['He is a teacher. He is # a writer.', 'also', '他是老師。他也是作家。'], ['I went to the zoo. I # went to the museum.', 'also', '我去了動物園。我也去了博物館。'],
  ['My father likes tea. My mother likes tea, #.', 'too', '我爸爸喜歡茶。我媽媽也喜歡茶。'], ['They didn\'t come. We didn\'t come, #.', 'either', '他們沒來。我們也沒來。'], ['She can sing. She can # dance.', 'also', '她會唱歌。她也會跳舞。'],
  ['I have a cat. I # have a dog.', 'also', '我有一隻貓。我也有一隻狗。'], ['He isn\'t hungry. I am not hungry, #.', 'either', '他不餓。我也不餓。'], ['Ken is tall. His sister is tall, #.', 'too', 'Ken 很高。他姊姊也很高。'],
  ['We don\'t have class today. They don\'t have class today, #.', 'either', '我們今天沒有課。他們今天也沒有課。'],
  ['Amy is a nurse. Her sister is a nurse, #.', 'too', 'Amy 是護理師。她姊姊也是護理師。'], ['I can\'t ride a bicycle. My brother can\'t ride a bicycle, #.', 'either', '我不會騎腳踏車。我哥哥也不會。'],
  ['He plays basketball. He # plays baseball.', 'also', '他打籃球。他也打棒球。'], ['They were at the party. We were at the party, #.', 'too', '他們在派對上。我們也在。'],
  ['She didn\'t do her homework. He didn\'t do his homework, #.', 'either', '她沒寫功課。他也沒寫。'], ['My mother likes cooking. She # likes reading.', 'also', '我媽媽喜歡煮飯。她也喜歡閱讀。'],
  ['Tom has a dog. Amy has a dog, #.', 'too', 'Tom 有一隻狗。Amy 也有一隻狗。'], ['I haven\'t seen the movie. She hasn\'t seen the movie, #.', 'either', '我沒看過那部電影。她也沒看過。'], ['Lisa plays the piano. She # plays the guitar.', 'also', 'Lisa 彈鋼琴。她也彈吉他。'], ['It rained yesterday. It rained today, #.', 'too', '昨天下雨。今天也下雨。'],
];
// So / Neither + aux + subject: [first speaker, reply subject, aux, So or Neither, Chinese]
const SO = [
  ['I like music.', 'I', 'do', 'So', '我喜歡音樂。— 我也是。'], ['I don\'t like fish.', 'I', 'do', 'Neither', '我不喜歡魚。— 我也不喜歡。'], ['She can swim.', 'he', 'can', 'So', '她會游泳。— 他也會。'],
  ['He can\'t cook.', 'she', 'can', 'Neither', '他不會煮飯。— 她也不會。'], ['They are tired.', 'we', 'are', 'So', '他們很累。— 我們也是。'], ['We aren\'t ready.', 'they', 'are', 'Neither', '我們還沒準備好。— 他們也沒。'],
  ['Tom went to the party.', 'Amy', 'did', 'So', 'Tom 去了派對。— Amy 也去了。'], ['I didn\'t see the movie.', 'I', 'did', 'Neither', '我沒看那部電影。— 我也沒看。'], ['My brother has a bicycle.', 'I', 'do', 'So', '我哥哥有腳踏車。— 我也有。'],
  ['He was late.', 'I', 'was', 'So', '他遲到了。— 我也是。'], ['She hasn\'t finished.', 'I', 'have', 'Neither', '她還沒做完。— 我也還沒。'], ['I will go.', 'I', 'will', 'So', '我會去。— 我也會。'],
  ['Mary doesn\'t eat meat.', 'Ben', 'does', 'Neither', 'Mary 不吃肉。— Ben 也不吃。'], ['The boys like soccer.', 'the girls', 'do', 'So', '男孩們喜歡足球。— 女孩們也喜歡。'], ['I am hungry.', 'I', 'am', 'So', '我餓了。— 我也是。'],
  ['I can\'t find my keys.', 'I', 'can', 'Neither', '我找不到鑰匙。— 我也找不到。'],
];
// Pairs: [sentence with # #, answers, Chinese]
const PAIR = [
  ['# Tom # Amy like music.', ['Both', 'and'], 'Tom 和 Amy 都喜歡音樂。'], ['You can have # tea # coffee.', ['either', 'or'], '你可以喝茶或咖啡，選一樣。'], ['# Tom # Amy likes history; they both like art.', ['Neither', 'nor'], 'Tom 和 Amy 都不喜歡歷史；他們都喜歡美術。'],
  ['She is # smart # kind.', ['both', 'and'], '她既聰明又親切。'], ['# you # your brother has to come.', ['Either', 'or'], '你或你哥哥得來一個。'], ['I like # apples # bananas.', ['both', 'and'], '我蘋果和香蕉都喜歡。'],
  ['He plays # the piano # the violin.', ['neither', 'nor'], '他鋼琴和小提琴都不會彈。'], ['We can go # by bus # by train.', ['either', 'or'], '我們可以搭公車或搭火車去。'], ['# my father # my mother is at home now.', ['Neither', 'nor'], '我爸爸和我媽媽現在都不在家。'],
  ['Tom is # a good student # a good friend.', ['not only', 'but also'], 'Tom 不只是好學生，也是好朋友。'], ['She # sings well # dances well.', ['not only', 'but also'], '她不只唱歌好，舞也跳得好。'], ['# the teacher # the students were happy.', ['Both', 'and'], '老師和學生都很開心。'],
  ['# Lisa # Mark can answer the question.', ['Either', 'or'], 'Lisa 或 Mark 其中一個可以回答這個問題。'], ['The movie was # long # sad.', ['both', 'and'], '那部電影又長又悲傷。'], ['I have # time # money.', ['neither', 'nor'], '我沒有時間也沒有錢。'],
  ['He is # tall # strong.', ['not only', 'but also'], '他不只高，也很壯。'],
];
const two = (ans) => ans.split(' ').flatMap((w, i) => (i ? [' ', blank(w)] : [blank(w)]));

const MODES = [
  {
    id: 'too', name: 'too / either / also', instruction: () => '填入 too、either 或 also：肯定句尾用 too，否定句尾用 either，句中用 also。',
    gen(rng) { const [en, ans, zh] = rng.fresh(TOO, (x) => x[0]); const [l, r] = en.split('#'); return { lines: [[l, blank(ans), r]], zh, meta: { kind: 'too', ans } }; },
  },
  {
    id: 'so', name: 'So do I / Neither do I', instruction: () => '用 So 或 Neither + 助動詞 + 主詞回答「我也是／我也不是」。',
    gen(rng) {
      const [first, subj, aux, so, zh] = rng.fresh(SO, (x) => x[0]);
      return { lines: [[`${first} — `, blank(so), ' ', blank(aux), ' ', blank(subj, subj.includes(' ')), '.']], zh, meta: { kind: 'so', so, aux, subj } };
    },
  },
  {
    id: 'pair', name: 'both…and / either…or / neither…nor', instruction: () => '依中文填入成對的連接詞：both … and、either … or、neither … nor、not only … but also（一個空格填一個字）。',
    gen(rng) {
      const [en, [a, b], zh] = rng.fresh(PAIR, (x) => x[0]);
      const [l, m, r] = en.split('#');
      return { lines: [[l, ...two(a), m, ...two(b), r]], zh, meta: { kind: 'pair', a: a.toLowerCase(), b } };
    },
  },
];

export default {
  id: 'linkadv',
  code: 'ALS',
  title: 'too / either / also 與 both…and',
  grade: 8,
  past: false,
  variety: false, // fixed sentence lists; checked by their own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { too: TOO.length, so: SO.length, pair: PAIR.length },
  noTranslate: ['so'], // "So do I" replies are not sentences to translate
  defaultModes: { 1: ['too'], 2: ['too', 'so'], 3: ['too', 'so', 'pair'] },
  levelHint: { 1: 'too、either、also 的位置與肯定否定。', 2: '加入 So do I、Neither do I。', 3: '再加入 both…and、either…or、neither…nor、not only…but also。' },
  grammarBox: (o) => ({ head: ['用法', '例子'], rows: [
    ['too（肯定，句尾）', 'He likes dogs, too.'], ['either（否定，句尾）', 'She doesn\'t like fish, either.'], ['also（句中，一般動詞前、be 動詞後）', 'She also plays the violin. He is also a writer.'],
    ...(o.level >= 2 ? [['So + 助動詞 + 主詞（我也是）', 'I like music. — So do I.'], ['Neither + 助動詞 + 主詞（我也不）', 'I can\'t swim. — Neither can I.']] : []),
    ...(o.level >= 3 ? [['both A and B（兩者都）', 'Both Tom and Amy like music.（複數動詞）'], ['either A or B（兩者之一）／ neither A nor B（兩者都不）', 'Either you or your brother has to come.（動詞看最近的主詞）'], ['not only A but also B', 'He is not only tall but also strong.']] : []),
  ], note: '助動詞跟著前一句：do / does / did、be 動詞、can / will / have。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
