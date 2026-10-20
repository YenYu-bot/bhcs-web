// Topic: time and condition clauses — If it rains tomorrow, we will stay at home. / I will call you when he comes.
import { blank, cap, zhJoin } from '../core.js';

// [conjunction, Chinese, clause subject, Chinese, clause verb base, -s form, rest, Chinese, main subject, Chinese, main verb base, rest, Chinese]
const P = (conj, cz, cs, csz, cv, cvs, cr, crz, ms, msz, mv, mr, mrz) => ({ conj, cz, cs, csz, cv, cvs, cr, crz, ms, msz, mv, mr, mrz });
const PAIRS = [
  P('If', '如果', 'it', '', 'rain', 'rains', ' tomorrow', '明天下雨', 'we', '我們', 'stay', ' at home', '待在家裡'),
  P('If', '如果', 'you', '你', 'study', 'studies', ' hard', '用功讀書', 'you', '你', 'pass', ' the test', '通過考試'),
  P('If', '如果', 'she', '她', 'have', 'has', ' time', '有時間', 'she', '她', 'help', ' us', '幫我們'),
  P('If', '如果', 'Tom', 'Tom', 'get', 'gets', ' up late', '晚起', 'he', '他', 'miss', ' the bus', '錯過公車'),
  P('If', '如果', 'it', '', 'be', 'is', ' sunny this weekend', '這個週末天氣好', 'we', '我們', 'go', ' to the beach', '去海邊'),
  P('If', '如果', 'they', '他們', 'win', 'wins', ' the game', '贏了比賽', 'they', '他們', 'be', ' very happy', '很開心'),
  P('If', '如果', 'I', '我', 'see', 'sees', ' Amy', '看到 Amy', 'I', '我', 'tell', ' her the news', '告訴她這個消息'),
  P('If', '如果', 'you', '你', 'eat', 'eats', ' too much', '吃太多', 'you', '你', 'get', ' fat', '變胖'),
  P('When', '當', 'he', '他', 'come', 'comes', ' home', '回家', 'I', '我', 'call', ' you', '打電話給你'),
  P('When', '當', 'the movie', '電影', 'end', 'ends', '', '結束', 'we', '我們', 'go', ' home', '回家'),
  P('When', '當', 'I', '我', 'grow', 'grows', ' up', '長大', 'I', '我', 'be', ' a doctor', '當醫生'),
  P('When', '當', 'she', '她', 'finish', 'finishes', ' her homework', '寫完功課', 'she', '她', 'watch', ' television', '看電視'),
  P('When', '當', 'the class', '課', 'end', 'ends', '', '結束', 'the students', '學生們', 'leave', ' the classroom', '離開教室'),
  P('Before', '在…之前', 'you', '你', 'go', 'goes', ' out', '出門', 'I', '我', 'close', ' the windows', '關窗戶'),
  P('After', '在…之後', 'he', '他', 'finish', 'finishes', ' dinner', '吃完晚餐', 'he', '他', 'do', ' the dishes', '洗碗'),
  P('After', '在…之後', 'the rain', '雨', 'stop', 'stops', '', '停', 'the children', '孩子們', 'play', ' outside', '去外面玩'),
  P('As soon as', '一…就', 'the bus', '公車', 'arrive', 'arrives', '', '到', 'we', '我們', 'get', ' on', '上車'),
  P('As soon as', '一…就', 'I', '我', 'get', 'gets', ' home', '到家', 'I', '我', 'take', ' a shower', '洗澡'),
  P('If', '如果', 'the weather', '天氣', 'be', 'is', ' nice', '好', 'my father', '我爸爸', 'wash', ' the car', '洗車'),
  P('When', '當', 'my mother', '我媽媽', 'come', 'comes', ' back', '回來', 'we', '我們', 'have', ' dinner', '吃晚餐'),
  P('If', '如果', 'you', '你', 'need', 'needs', ' help', '需要幫忙', 'I', '我', 'help', ' you', '幫你'),
  P('If', '如果', 'he', '他', 'practice', 'practices', ' every day', '每天練習', 'he', '他', 'play', ' the piano well', '把鋼琴彈好'),
  P('When', '當', 'the children', '孩子們', 'see', 'sees', ' the dog', '看到那隻狗', 'they', '他們', 'be', ' happy', '很開心'),
  P('When', '當', 'it', '', 'get', 'gets', ' dark', '天黑', 'we', '我們', 'go', ' back', '回去'),
  P('Before', '在…之前', 'she', '她', 'leave', 'leaves', '', '離開', 'she', '她', 'call', ' us', '打電話給我們'),
  P('After', '在…之後', 'they', '他們', 'clean', 'cleans', ' the room', '打掃完房間', 'they', '他們', 'watch', ' a movie', '看電影'),
  P('As soon as', '一…就', 'the bell', '鐘', 'ring', 'rings', '', '響', 'the students', '學生們', 'stand', ' up', '站起來'),
  P('If', '如果', 'the store', '商店', 'be', 'is', ' open', '有開', 'I', '我', 'buy', ' some bread', '買一些麵包'),
];
const s3 = (p) => ['he', 'she', 'it', 'Tom', 'the movie', 'the class', 'the rain', 'the bus', 'the weather', 'my mother', 'the bell', 'the store'].includes(p.cs);
const clauseVerb = (p) => (p.cv === 'be' ? 'is' : s3(p) ? p.cvs : p.cv);
const zhClause = (p) => `${p.csz}${p.crz}`;
const zhMain = (p) => `${p.msz}${p.mv === 'be' ? '會' : '會'}${p.mrz}`;
const zhAll = (p) => (p.conj === 'If' ? zhJoin('如果', zhClause(p)) + `，${zhMain(p)}。` : p.conj === 'When' ? `${zhClause(p)}的時候，${zhMain(p)}。` : p.conj === 'Before' ? `${zhClause(p)}之前，${zhMain(p)}。` : p.conj === 'After' ? `${zhClause(p)}之後，${zhMain(p)}。` : `${p.csz}一${p.crz}，${p.msz}就${p.mrz}。`);
const first = (rng) => rng.chance(0.5); // clause first or main clause first

const MODES = [
  {
    id: 'clause', name: '子句用現在式', instruction: () => 'if / when / before / after 引導的子句，用現在式表示未來：依括號提示填入正確形式。',
    gen(rng) {
      const p = rng.fresh(PAIRS, (x) => x.conj + x.cs + x.cv);
      const cv = clauseVerb(p);
      const line = first(rng)
        ? [`${p.conj} ${p.cs} `, blank(cv), ` (${p.cv})${p.cr}, ${p.ms} will ${p.mv}${p.mr}.`]
        : [`${cap(p.ms)} will ${p.mv}${p.mr} ${p.conj.toLowerCase()} ${p.cs} `, blank(cv), ` (${p.cv})${p.cr}.`];
      return { lines: [line], zh: zhAll(p), meta: { kind: 'clause', base: p.cv, cs: p.cs } };
    },
  },
  {
    id: 'main', name: '主要子句用 will', instruction: () => '主要子句用未來式：依括號提示填入 will + 原形（一個空格填一個字）。',
    gen(rng) {
      const p = rng.fresh(PAIRS, (x) => 'm-' + x.conj + x.cs + x.cv);
      const cv = clauseVerb(p);
      const line = first(rng)
        ? [`${p.conj} ${p.cs} ${cv}${p.cr}, ${p.ms} `, blank('will'), ' ', blank(p.mv), ` (${p.mv})${p.mr}.`]
        : [`${cap(p.ms)} `, blank('will'), ' ', blank(p.mv), ` (${p.mv})${p.mr} ${p.conj.toLowerCase()} ${p.cs} ${cv}${p.cr}.`];
      return { lines: [line], zh: zhAll(p), meta: { kind: 'main', base: p.mv } };
    },
  },
  {
    id: 'mix', name: '兩邊都填', instruction: () => '子句用現在式，主要子句用 will + 原形：依括號提示填入（空格可填一個或兩個字）。',
    gen(rng) {
      const p = rng.fresh(PAIRS, (x) => 'x-' + x.conj + x.cs + x.cv);
      const cv = clauseVerb(p);
      const line = first(rng)
        ? [`${p.conj} ${p.cs} `, blank(cv, true), ` (${p.cv})${p.cr}, ${p.ms} `, blank(`will ${p.mv}`, true), ` (${p.mv})${p.mr}.`]
        : [`${cap(p.ms)} `, blank(`will ${p.mv}`, true), ` (${p.mv})${p.mr} ${p.conj.toLowerCase()} ${p.cs} `, blank(cv, true), ` (${p.cv})${p.cr}.`];
      return { lines: [line], zh: zhAll(p), meta: { kind: 'mix', base: p.cv, mbase: p.mv, cs: p.cs } };
    },
  },
];

export default {
  id: 'whenif',
  code: 'WIF',
  title: '時間與條件子句 when / if',
  grade: 9,
  past: false,
  variety: false, // fixed sentence lists; checked by their own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { clause: PAIRS.length * 2, main: PAIRS.length * 2, mix: PAIRS.length * 2 },
  defaultModes: { 1: ['clause'], 2: ['clause', 'main'], 3: ['clause', 'main', 'mix'] },
  levelHint: { 1: '子句（if / when…）用現在式代替未來式。', 2: '加入主要子句的 will + 原形。', 3: '兩邊一起填。' },
  grammarBox: () => ({ head: ['', '時態', '例子'], rows: [['if / when / before / after / as soon as 子句', '現在式（代替未來）', 'If it rains tomorrow, …　When he comes, …'], ['主要子句', 'will + 原形', '…we will stay at home.　…I will call you.']],
    note: '子句可以放前面（後面加逗號）或後面；子句裡不能用 will。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
