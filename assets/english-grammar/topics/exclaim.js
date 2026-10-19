// Topic: exclamations — What a nice day! / What beautiful flowers! / How nice the day is!
import { blank, cap, zhJoin } from '../core.js';
import { aOrAn } from './article.js';

// Things people exclaim about: [noun, Chinese, measure word or '' for plural / uncountable, adjectives that fit, Chinese verb phrase for "the X is"]
const N = (en, zh, m, adjs, plural = false) => ({ en, zh, m, adjs, plural });
const NOUNS = [
  N('day', '一天', '個', ['nice', 'beautiful', 'hot', 'cold', 'busy', 'long']), N('girl', '女孩', '個', ['pretty', 'smart', 'kind', 'tall', 'lovely', 'shy']),
  N('boy', '男孩', '個', ['tall', 'smart', 'kind', 'lazy', 'strong', 'lucky']), N('dog', '狗', '隻', ['cute', 'big', 'smart', 'lazy', 'friendly']),
  N('cat', '貓', '隻', ['cute', 'fat', 'lazy', 'lovely']), N('house', '房子', '間', ['big', 'beautiful', 'old', 'clean', 'expensive']),
  N('car', '車', '輛', ['fast', 'new', 'expensive', 'beautiful', 'old']), N('movie', '電影', '部', ['good', 'interesting', 'long', 'sad', 'funny', 'exciting']),
  N('idea', '主意', '個', ['good', 'great', 'interesting', 'strange']), N('story', '故事', '個', ['interesting', 'sad', 'funny', 'strange', 'long']),
  N('cake', '蛋糕', '個', ['big', 'delicious', 'beautiful', 'sweet']), N('question', '問題', '個', ['good', 'easy', 'difficult', 'interesting', 'strange']),
  N('teacher', '老師', '位', ['kind', 'good', 'funny', 'busy']), N('umbrella', '雨傘', '把', ['old', 'big', 'beautiful', 'useful']),
  N('flowers', '花', '', ['beautiful', 'pretty', 'lovely'], true), N('shoes', '鞋子', '', ['nice', 'new', 'expensive', 'dirty', 'big'], true),
  N('books', '書', '', ['interesting', 'old', 'heavy', 'useful'], true), N('students', '學生', '', ['smart', 'kind', 'lazy', 'busy', 'lucky'], true),
  N('pictures', '畫', '', ['beautiful', 'interesting', 'strange', 'old'], true), N('weather', '天氣', '', ['nice', 'beautiful', 'hot', 'cold', 'terrible'], true),
];
const ADJ_ZH = { nice: '棒', beautiful: '美', hot: '熱', cold: '冷', busy: '忙碌', long: '長', pretty: '漂亮', smart: '聰明', kind: '親切', tall: '高', lovely: '可愛', shy: '害羞',
  lazy: '懶', strong: '強壯', lucky: '幸運', cute: '可愛', big: '大', friendly: '友善', fat: '胖', old: '舊', clean: '乾淨', expensive: '貴', fast: '快', new: '新', good: '棒', interesting: '有趣',
  sad: '悲傷', funny: '好笑', exciting: '刺激', boring: '無聊', great: '棒', strange: '奇怪', delicious: '好吃', sweet: '甜', easy: '簡單', difficult: '難', useful: '有用', dirty: '髒', heavy: '重', terrible: '糟' };
// How + adjective with a clause: [adjective, subject, Chinese]
const HOW = [
  ['fast', 'he runs', '他跑得真快'], ['well', 'she sings', '她唱得真好'], ['hard', 'they work', '他們工作真努力'], ['late', 'it is', '時間真晚'], ['early', 'you get up', '你起得真早'],
  ['tall', 'the tree is', '那棵樹真高'], ['beautiful', 'the flowers are', '那些花真美'], ['cold', 'it is today', '今天真冷'], ['kind', 'your mother is', '你媽媽真親切'], ['cute', 'the baby is', '那個嬰兒真可愛'],
  ['delicious', 'the cake is', '那個蛋糕真好吃'], ['interesting', 'the movie is', '那部電影真有趣'], ['big', 'the house is', '那間房子真大'], ['lucky', 'you are', '你真幸運'], ['fast', 'the car is', '那輛車真快'],
  ['heavy', 'the box is', '那個箱子真重'], ['smart', 'the dog is', '那隻狗真聰明'], ['busy', 'he is', '他真忙'],
];
const meta = (kind, extra) => ({ kind, ...extra });

const MODES = [
  {
    id: 'what', name: 'What + 名詞', instruction: () => '依中文填入 What、a / an（複數和不可數名詞不加）和形容詞，完成感嘆句。',
    gen(rng, o) {
      const n = rng.fresh(NOUNS.filter((x) => o.level >= 2 || !x.plural), (x) => x.en);
      const adj = rng.pick(n.adjs);
      const art = n.plural ? null : aOrAn(adj);
      const bl = art ? [blank('What'), ' ', blank(art), ' ', blank(adj)] : [blank('What'), ' ', blank(adj)];
      const tail = o.level >= 3 && rng.chance(0.3) ? (n.plural ? (n.en === 'weather' ? ' it is' : ' they are') : ' it is') : '';
      return { lines: [[...bl, ` ${n.en}${tail}!`]], zh: `好${ADJ_ZH[adj]}的${n.zh}啊！`, meta: meta('what', { adj, noun: n.en, plural: n.plural }) };
    },
  },
  {
    id: 'how', name: 'How + 形容詞／副詞', instruction: () => '依中文填入 How 和形容詞或副詞，完成感嘆句。',
    gen(rng, o) {
      const [adj, rest, zh] = rng.fresh(HOW, (x) => x[0] + x[1]);
      const adv = ['fast', 'well', 'hard', 'late', 'early'].includes(adj) && !/ (is|are)( today)?$/.test(rest);
      return { lines: [[blank('How'), ' ', blank(adj), ` ${rest}!`]], zh: `${zh}！`, meta: meta('how', { adj, adv }) };
    },
  },
  {
    id: 'change', name: '改寫成感嘆句', instruction: () => '把句子改成感嘆句：有名詞的用 What，只有形容詞的用 How（一個空格填一個字）。',
    gen(rng, o) {
      const useWhat = rng.fresh([true, false], (x) => 'change-' + x);
      if (useWhat) {
        const n = rng.fresh(NOUNS.filter((x) => x.en !== 'weather' && (o.level >= 2 || !x.plural)), (x) => 'c-' + x.en);
        const adj = rng.pick(n.adjs);
        const subj = n.plural ? `These ${n.en} are` : `This is`;
        const given = n.plural ? `These ${n.en} are very ${adj}.` : `This is a very ${adj} ${n.en}.`;
        const art = n.plural ? null : aOrAn(adj);
        const bl = art ? [blank('What'), ' ', blank(art), ' ', blank(adj), ` ${n.en}!`] : [blank('What'), ' ', blank(adj), ` ${n.en}!`];
        return { lines: [[given], ['→ ', ...bl]], zh: `${n.plural ? '這些' : '這'}${n.m}${n.zh}真${ADJ_ZH[adj]}！`, meta: meta('change', { adj, noun: n.en, plural: n.plural, what: true }) };
      }
      const [adj, rest, zh] = rng.fresh(HOW.filter((x) => / (is|are)( today)?$/.test(x[1])), (x) => 'h-' + x[0] + x[1]);
      const given = `${cap(rest.replace(/ today$/, ''))} very ${adj}${rest.endsWith('today') ? ' today' : ''}.`;
      return { lines: [[given], ['→ ', blank('How'), ' ', blank(adj), ` ${rest}!`]], zh: `${zh}！`, meta: meta('change', { adj, what: false }) };
    },
  },
];

export default {
  id: 'exclaim',
  code: 'EXC',
  title: '感嘆句 What / How',
  grade: 8,
  past: false,
  zhRequired: true, // the Chinese says which adjective
  variety: false, // fixed sentence frames; checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { how: HOW.length, change: HOW.filter((x) => / (is|are)( today)?$/.test(x[1])).length + 30 },
  defaultModes: { 1: ['what', 'how'], 2: ['what', 'how'], 3: ['what', 'how', 'change'] },
  levelHint: { 1: 'What a / an + 形容詞 + 單數名詞；How + 形容詞。', 2: '加入複數與不可數名詞（What beautiful flowers!）。', 3: '再加入把句子改寫成感嘆句，以及句尾加主詞動詞（What a nice day it is!）。' },
  grammarBox: (o) => ({ head: ['句型', '例子'], rows: [
    ['What + a / an + 形容詞 + 單數名詞 (+ 主詞 + 動詞)!', 'What a nice day (it is)!'],
    ...(o.level >= 2 ? [['What + 形容詞 + 複數／不可數名詞!', 'What beautiful flowers! What nice weather!']] : []),
    ['How + 形容詞／副詞 (+ 主詞 + 動詞)!', 'How nice (the day is)! How fast he runs!'],
  ], note: 'What 後面有名詞，How 後面只有形容詞或副詞。a / an 看形容詞的發音。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
