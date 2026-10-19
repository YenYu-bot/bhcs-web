// Topic: comparatives and superlatives — taller / the tallest, more beautiful / the most beautiful, better / the best.
import { blank, cap, zhJoin } from '../core.js';
import { NAMES } from '../lexicon.js';

// Adjectives: [base, comparative, superlative, Chinese, spelling rule]
//   rule  'er' add -er | 'r' ends in e | 'ier' y → ier | 'dbl' double the last letter | 'more' more / most | 'irr' irregular
const A = (base, cmp, sup, zh, rule) => ({ base, cmp, sup, zh, rule });
export const ADJS = [
  A('tall', 'taller', 'tallest', '高', 'er'), A('short', 'shorter', 'shortest', '矮', 'er'), A('old', 'older', 'oldest', '老', 'er'), A('young', 'younger', 'youngest', '年輕', 'er'),
  A('strong', 'stronger', 'strongest', '強壯', 'er'), A('fast', 'faster', 'fastest', '快', 'er'), A('slow', 'slower', 'slowest', '慢', 'er'), A('small', 'smaller', 'smallest', '小', 'er'),
  A('long', 'longer', 'longest', '長', 'er'), A('cheap', 'cheaper', 'cheapest', '便宜', 'er'), A('cold', 'colder', 'coldest', '冷', 'er'), A('warm', 'warmer', 'warmest', '溫暖', 'er'),
  A('high', 'higher', 'highest', '高', 'er'), A('clean', 'cleaner', 'cleanest', '乾淨', 'er'), A('smart', 'smarter', 'smartest', '聰明', 'er'), A('kind', 'kinder', 'kindest', '親切', 'er'),
  A('rich', 'richer', 'richest', '有錢', 'er'), A('light', 'lighter', 'lightest', '輕', 'er'), A('new', 'newer', 'newest', '新', 'er'), A('cool', 'cooler', 'coolest', '涼', 'er'),
  A('nice', 'nicer', 'nicest', '好', 'r'), A('large', 'larger', 'largest', '大', 'r'), A('cute', 'cuter', 'cutest', '可愛', 'r'), A('safe', 'safer', 'safest', '安全', 'r'), A('wide', 'wider', 'widest', '寬', 'r'),
  A('happy', 'happier', 'happiest', '快樂', 'ier'), A('busy', 'busier', 'busiest', '忙', 'ier'), A('easy', 'easier', 'easiest', '簡單', 'ier'), A('heavy', 'heavier', 'heaviest', '重', 'ier'),
  A('pretty', 'prettier', 'prettiest', '漂亮', 'ier'), A('lazy', 'lazier', 'laziest', '懶惰', 'ier'), A('funny', 'funnier', 'funniest', '好笑', 'ier'), A('healthy', 'healthier', 'healthiest', '健康', 'ier'),
  A('dirty', 'dirtier', 'dirtiest', '髒', 'ier'),
  A('big', 'bigger', 'biggest', '大', 'dbl'), A('hot', 'hotter', 'hottest', '熱', 'dbl'), A('thin', 'thinner', 'thinnest', '瘦', 'dbl'), A('fat', 'fatter', 'fattest', '胖', 'dbl'),
  A('sad', 'sadder', 'saddest', '悲傷', 'dbl'), A('wet', 'wetter', 'wettest', '潮溼', 'dbl'),
  A('beautiful', 'more beautiful', 'most beautiful', '美麗', 'more'), A('interesting', 'more interesting', 'most interesting', '有趣', 'more'), A('difficult', 'more difficult', 'most difficult', '難', 'more'),
  A('important', 'more important', 'most important', '重要', 'more'), A('popular', 'more popular', 'most popular', '受歡迎', 'more'), A('expensive', 'more expensive', 'most expensive', '貴', 'more'),
  A('delicious', 'more delicious', 'most delicious', '好吃', 'more'), A('famous', 'more famous', 'most famous', '有名', 'more'), A('useful', 'more useful', 'most useful', '有用', 'more'),
  A('dangerous', 'more dangerous', 'most dangerous', '危險', 'more'), A('comfortable', 'more comfortable', 'most comfortable', '舒服', 'more'), A('exciting', 'more exciting', 'most exciting', '刺激', 'more'),
  A('good', 'better', 'best', '好', 'irr'), A('bad', 'worse', 'worst', '差', 'irr'),
];
const ADJ = Object.fromEntries(ADJS.map((a) => [a.base, a]));
const RULES = { 1: ['er', 'r'], 2: ['er', 'r', 'ier', 'dbl', 'more'], 3: ['er', 'r', 'ier', 'dbl', 'more', 'irr'] };

// Sets of things that can be compared with each other, the adjectives that fit them, and the range for superlatives.
//   items  [English, Chinese]      adjs  bases      groups [range, Chinese, singular noun after the superlative or '']
const S = (items, adjs, groups) => ({ items, adjs, groups });
const SETS = [
  S([['this book', '這本書'], ['that book', '那本書'], ['my dictionary', '我的字典'], ['this story book', '這本故事書']],
    ['interesting', 'useful', 'cheap', 'expensive', 'old', 'new', 'heavy', 'good', 'bad', 'popular', 'difficult', 'easy'], [['in the shop', '店裡', 'book'], ['of the three', '三本裡', '']]),
  S([['the red car', '那輛紅色的車'], ['the blue car', '那輛藍色的車'], ['my bicycle', '我的腳踏車'], ['the bus', '公車'], ['the train', '火車']],
    ['fast', 'slow', 'expensive', 'cheap', 'big', 'small', 'old', 'new', 'safe', 'comfortable', 'long', 'good'], [['in the city', '城市裡', ''], ['of the three', '三輛裡', '']]),
  S([['the blue dress', '那件藍色的洋裝'], ['this jacket', '這件夾克'], ['that hat', '那頂帽子'], ['this shirt', '這件襯衫']],
    ['cheap', 'expensive', 'pretty', 'beautiful', 'nice', 'comfortable', 'big', 'small', 'light', 'new', 'old', 'popular'], [['in the shop', '店裡', ''], ['of the three', '三件裡', '']]),
  S([['this chair', '這張椅子'], ['this sofa', '這張沙發'], ['that desk', '那張書桌'], ['this bed', '這張床'], ['that table', '那張桌子']],
    ['heavy', 'light', 'big', 'small', 'large', 'comfortable', 'expensive', 'cheap', 'nice', 'dirty', 'clean', 'new', 'old'], [['in the room', '房間裡', ''], ['of the three', '三件裡', '']]),
  S([['the elephant', '大象'], ['the rabbit', '兔子'], ['my dog', '我的狗'], ['the horse', '馬'], ['the tiger', '老虎'], ['the turtle', '烏龜'], ['the cat', '貓'], ['the monkey', '猴子']],
    ['fast', 'slow', 'big', 'small', 'strong', 'cute', 'dangerous', 'fat', 'heavy', 'lazy', 'smart', 'funny'], [['in the zoo', '動物園裡', 'animal'], ['of the three', '三隻裡', ''], ['in the world', '世界上', 'animal']]),
  S([['this room', '這個房間'], ['our classroom', '我們的教室'], ['the kitchen', '廚房'], ['that room', '那個房間'], ['the music room', '音樂教室']],
    ['big', 'small', 'large', 'clean', 'dirty', 'busy', 'comfortable', 'warm', 'cold', 'cool', 'nice', 'safe', 'new', 'old'], [['in the school', '學校裡', 'room'], ['in the house', '這間屋子裡', 'room']]),
  S([['this city', '這個城市'], ['that city', '那個城市'], ['Taichung', '台中']],
    ['big', 'large', 'busy', 'famous', 'beautiful', 'clean', 'safe', 'hot', 'cold', 'popular', 'important', 'old', 'new', 'rich'], [['in the country', '國內', 'city'], ['in the world', '世界上', 'city']]),
  S([['this river', '這條河'], ['that river', '那條河']], ['long', 'wide', 'clean', 'dirty', 'dangerous', 'beautiful', 'famous'], [['in the country', '國內', 'river'], ['in the world', '世界上', 'river']]),
  S([['this mountain', '這座山'], ['that mountain', '那座山']], ['high', 'dangerous', 'beautiful', 'famous', 'cold'], [['in the country', '國內', 'mountain'], ['in the world', '世界上', 'mountain']]),
  S([['this cake', '這個蛋糕'], ['the soup', '這道湯'], ['the pizza', '披薩'], ['this sandwich', '這個三明治'], ['the noodles', '麵'], ['the fish', '魚']],
    ['delicious', 'healthy', 'expensive', 'cheap', 'big', 'small', 'hot', 'good', 'bad', 'popular'], [['in the restaurant', '這家餐廳裡', ''], ['of the three', '三道裡', '']]),
  S([['history', '歷史'], ['science', '自然'], ['music', '音樂'], ['art', '美術'], ['geography', '地理']],
    ['easy', 'difficult', 'interesting', 'important', 'useful', 'popular'], [['of all', '所有科目裡', ''], ['for me', '對我來說', '']]),
  S([['this movie', '這部電影'], ['that movie', '那部電影'], ['this story', '這個故事'], ['this game', '這個遊戲'], ['that game', '那個遊戲']],
    ['interesting', 'exciting', 'funny', 'sad', 'popular', 'good', 'bad', 'long', 'famous', 'new', 'old'], [['of the year', '今年', ''], ['of the three', '三個裡', '']]),
  S([['summer', '夏天'], ['winter', '冬天'], ['spring', '春天'], ['autumn', '秋天']], ['hot', 'cold', 'warm', 'cool', 'wet'], [['of the year', '一年裡', '']]),
  S([['July', '七月'], ['January', '一月'], ['August', '八月'], ['December', '十二月']], ['hot', 'cold', 'warm', 'cool', 'wet'], [['of the year', '一年裡', '']]),
];
// people: names and family, with a gender so "pretty" stays with girls and women
const PERSON_ADJS = ['tall', 'short', 'old', 'young', 'strong', 'smart', 'kind', 'rich', 'nice', 'happy', 'busy', 'thin', 'lazy', 'famous', 'popular', 'funny', 'healthy', 'cute'];
const PEOPLE = [
  ...NAMES.m.slice(0, 9).map((n) => [n, n, 'm']), ...NAMES.f.slice(0, 9).map((n) => [n, n, 'f']),
  ['my brother', '我哥哥', 'm'], ['my sister', '我姊姊', 'f'], ['my father', '我爸爸', 'm'], ['my mother', '我媽媽', 'f'], ['his uncle', '他叔叔', 'm'], ['her aunt', '她阿姨', 'f'],
  ['that boy', '那個男孩', 'm'], ['this girl', '這個女孩', 'f'], ['our teacher', '我們的老師', 'f'],
];
const PERSON_GROUPS = { young: [['in my class', '我們班上', ['boy', 'girl', 'student']], ['of the three', '三個人裡', ['']], ['in my family', '我家', ['']]], adult: [['in my family', '我家', ['']], ['of the three', '三個人裡', ['']], ['in the city', '城市裡', ['']]] };
const isAdult = (en) => /father|mother|uncle|aunt|teacher/.test(en);

const twoBlanks = (form) => form.split(' ').flatMap((w, i) => (i ? [' ', blank(w)] : [blank(w)]));
const byLevel = (o, bases) => bases.filter((b) => RULES[o.level].includes(ADJ[b].rule));
const tag = (set) => (set === 'person' ? 'person' : set.items[0][0]);

// Spelling rules take turns so every sheet from level 2 has its share of more / most questions (two in six).
const TURNS = { 1: ['er', 'er2', 'r'], 2: ['er', 'r', 'ier', 'dbl', 'more', 'more2'], 3: ['er', 'r', 'ier', 'dbl', 'more', 'more2', 'irr'] };
const adjsOf = (s) => (s === 'person' ? PERSON_ADJS : s.adjs);
/** A spelling rule for this turn, a set that has such an adjective, the adjective, and two different items from the set. */
function draw(rng, o, mode) {
  const rule = rng.fresh(TURNS[o.level], (x) => `rule-${mode}-${x}`).replace(/2$/, ''); // each section keeps its own turn
  const choices = [...SETS, 'person'].filter((s) => adjsOf(s).some((b) => ADJ[b].rule === rule));
  const set = rng.fresh(choices, tag);
  const bases = adjsOf(set).filter((b) => ADJ[b].rule === rule);
  const adj = ADJ[rng.fresh(bases, (b) => 'adj-' + b)];
  let items = set === 'person' ? PEOPLE : set.items;
  if (adj.base === 'pretty' && set === 'person') items = items.filter((x) => x[2] === 'f');
  const a = rng.fresh(items, (x) => 'it-' + x[0]);
  const b = rng.pick(items.filter((x) => x[0] !== a[0]));
  return { set, adj, a, b };
}

const MODES = [
  {
    id: 'er', name: '比較級', instruction: () => '依括號提示，填入形容詞的比較級。',
    gen(rng, o) {
      const { adj, a, b } = draw(rng, o, 'er');
      const much = o.level >= 2 && rng.chance(0.25) ? 'much ' : '';
      return {
        lines: [[`${cap(a[0])} is ${much}`, ...twoBlanks(adj.cmp), ` (${adj.base}) than ${b[0]}.`]],
        zh: zhJoin(a[1], '比', b[1], adj.zh) + (much ? '得多' : '') + '。', meta: { kind: 'er', base: adj.base, rule: adj.rule },
      };
    },
  },
  {
    id: 'est', name: '最高級', instruction: () => '依括號提示，填入 the + 形容詞的最高級（一個空格填一個字）。',
    gen(rng, o) {
      const { set, adj, a } = draw(rng, o, 'est');
      let g, gz, noun;
      if (set === 'person') {
        const [gr, grz, nouns] = rng.pick(PERSON_GROUPS[isAdult(a[0]) ? 'adult' : 'young']);
        g = gr; gz = grz;
        noun = rng.pick(nouns);
        if (noun === 'boy' && a[2] === 'f') noun = 'girl';
        if (noun === 'girl' && a[2] === 'm') noun = 'boy';
        if (adj.base === 'pretty' && noun === 'boy') noun = 'girl';
      } else {
        [g, gz, noun] = rng.pick(set.groups);
        if (noun && rng.chance(0.4)) noun = '';
        if (set.items[0][0] === 'this city' && a[0] === 'Taichung' && g === 'in the country') g = 'in Taiwan', gz = '台灣';
      }
      const nz = { boy: '男孩', girl: '女孩', student: '學生', book: '書', animal: '動物', room: '房間', city: '城市', river: '河', mountain: '山' }[noun] ?? '';
      return {
        lines: [[`${cap(a[0])} is `, ...twoBlanks('the ' + adj.sup), ` (${adj.base})${noun ? ' ' + noun : ''} ${g}.`]],
        zh: zhJoin(a[1], `是${gz}最${adj.zh}的${nz}`) + '。', meta: { kind: 'est', base: adj.base, rule: adj.rule },
      };
    },
  },
  {
    id: 'mix', name: '比較級或最高級', instruction: () => '看句子裡有沒有 than，填入比較級，或 the + 最高級（一個空格填一個字）。',
    gen(rng, o) {
      const which = rng.fresh(['er', 'est'], (x) => 'mix-' + x);
      const it = MODES.find((m) => m.id === which).gen(rng, o);
      return it && { ...it, meta: { ...it.meta, kind: 'mix', form: which } };
    },
  },
];

export default {
  id: 'compare',
  code: 'CMP',
  title: '比較級與最高級',
  grade: 8,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules, not by the subject/verb spread test
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['er', 'est'], 2: ['er', 'est'], 3: ['er', 'est', 'mix'] },
  levelHint: { 1: '只考直接加 -er / -est 與字尾 e 加 -r / -st。', 2: '加入去 y 加 -ier、重複字尾、more / most（每張卷子都有）。', 3: '再加入 good / bad 的不規則變化，以及比較級最高級混合判斷。' },
  grammarBox: (o) => ({ head: ['規則', '比較級', '最高級'], rows: [
    ['一般加 -er / -est', 'taller', 'the tallest'], ['字尾 e 加 -r / -st', 'nicer', 'the nicest'],
    ...(o.level >= 2 ? [['子音 + y：去 y 加 -ier / -iest', 'happier', 'the happiest'], ['短母音 + 子音：重複字尾', 'bigger', 'the biggest'], ['長的形容詞用 more / most', 'more beautiful', 'the most beautiful']] : []),
    ...(o.level >= 3 ? [['不規則', 'good → better、bad → worse', 'the best、the worst']] : []),
  ], note: '比較級後面接 than，最高級前面加 the，後面常接 in / of 表示範圍。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
