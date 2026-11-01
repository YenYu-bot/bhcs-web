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

// Sets of things that can be compared with each other.
//   Free sets hold things of one kind told apart only by this / that / colour, so either can be "more" of anything:
//     items [English, Chinese, 'pl'?]   adjs  bases that fit   groups [range, Chinese, singular noun after the superlative or '']
//   Fact sets hold real kinds (animals, seasons, months), so a sentence must be true:
//     cmp  [adjective, chain from most to least]   sup  [item, adjective, range, Chinese range, noun]
const S = (items, adjs, groups, zh = {}) => ({ items, adjs, groups, zh: { old: '舊', short: '短', ...zh } }); // things: 舊 not 老, 短 not 矮
const F = (items, cmp, sup) => ({ items, cmp, sup, fact: true, adjs: [...new Set([...cmp.map((c) => c[0]), ...sup.map((x) => x[1])])] });
const SETS = [
  S([['this book', '這本書'], ['that book', '那本書'], ['the red book', '那本紅色的書'], ['this story book', '這本故事書']],
    ['interesting', 'useful', 'cheap', 'expensive', 'old', 'new', 'heavy', 'light', 'good', 'bad', 'popular', 'difficult', 'easy', 'thin'], [['in the shop', '店裡', 'book'], ['of the three', '三本裡', ''], ['in the library', '圖書館裡', 'book']]),
  S([['the red car', '那輛紅色的車'], ['the blue car', '那輛藍色的車'], ['this car', '這輛車'], ["my uncle's car", '我叔叔的車']],
    ['fast', 'slow', 'expensive', 'cheap', 'big', 'small', 'old', 'new', 'safe', 'comfortable', 'good', 'clean', 'dirty'], [['in the shop', '店裡', 'car'], ['of the three', '三輛裡', '']]),
  S([['the blue dress', '那件藍色的洋裝'], ['this dress', '這件洋裝'], ['the white dress', '那件白色的洋裝'], ['that dress', '那件洋裝']],
    ['cheap', 'expensive', 'pretty', 'beautiful', 'nice', 'long', 'short', 'popular', 'new', 'old'], [['in the shop', '店裡', 'dress'], ['of the three', '三件裡', '']], { nice: '好看' }),
  S([['this jacket', '這件夾克'], ['that jacket', '那件夾克'], ['the black jacket', '那件黑色的夾克'], ['the green jacket', '那件綠色的夾克']],
    ['cheap', 'expensive', 'warm', 'light', 'heavy', 'nice', 'comfortable', 'big', 'small', 'long', 'popular', 'new', 'old'], [['in the shop', '店裡', 'jacket'], ['of the three', '三件裡', '']], { nice: '好看' }),
  S([['this chair', '這張椅子'], ['that chair', '那張椅子'], ['the red chair', '那張紅色的椅子'], ['the old chair', '那張舊椅子']],
    ['heavy', 'light', 'big', 'small', 'comfortable', 'expensive', 'cheap', 'nice', 'dirty', 'clean', 'high'], [['in the room', '房間裡', 'chair'], ['of the three', '三張裡', '']]),
  S([['this room', '這個房間'], ['our classroom', '我們的教室'], ['that room', '那個房間'], ['the music room', '音樂教室']],
    ['big', 'small', 'large', 'clean', 'dirty', 'comfortable', 'warm', 'cold', 'cool', 'nice', 'safe', 'new', 'old', 'hot'], [['in the school', '學校裡', 'room'], ['of the three', '三間裡', '']]),
  S([['this city', '這個城市'], ['that city', '那個城市'], ['Taichung', '台中']],
    ['big', 'large', 'busy', 'famous', 'beautiful', 'clean', 'safe', 'hot', 'cold', 'popular', 'important', 'old', 'new'], [['in the country', '國內', 'city'], ['in the world', '世界上', 'city']], { old: '古老' }),
  S([['this river', '這條河'], ['that river', '那條河']], ['long', 'wide', 'clean', 'dirty', 'dangerous', 'beautiful', 'famous'], [['in the country', '國內', 'river'], ['in the world', '世界上', 'river']]),
  S([['this mountain', '這座山'], ['that mountain', '那座山']], ['high', 'dangerous', 'beautiful', 'famous', 'cold'], [['in the country', '國內', 'mountain'], ['in the world', '世界上', 'mountain']]),
  S([['this cake', '這個蛋糕'], ['the soup', '這道湯'], ['the pizza', '披薩'], ['this sandwich', '這個三明治'], ['the noodles', '那碗麵', 'pl'], ['the fish', '那道魚']],
    ['delicious', 'healthy', 'expensive', 'cheap', 'good', 'bad', 'popular'], [['in the restaurant', '這家餐廳裡', ''], ['of the three', '三道裡', '']]),
  S([['history', '歷史'], ['science', '自然'], ['music', '音樂'], ['art', '美術'], ['geography', '地理']],
    ['easy', 'difficult', 'interesting', 'important', 'useful', 'popular'], [['of all', '所有科目裡', ''], ['for me', '對我來說', '']]),
  S([['this movie', '這部電影'], ['that movie', '那部電影'], ['the new movie', '那部新電影']],
    ['interesting', 'exciting', 'funny', 'sad', 'popular', 'good', 'bad', 'long', 'famous', 'short'], [['of the year', '今年', ''], ['of the three', '三部裡', '']]),
  S([['this game', '這個遊戲'], ['that game', '那個遊戲'], ['the new game', '那個新遊戲']],
    ['interesting', 'exciting', 'funny', 'popular', 'good', 'bad', 'easy', 'difficult', 'cheap', 'expensive'], [['of the year', '今年', ''], ['of the three', '三個裡', '']]),
  F([['the elephant', '大象'], ['the horse', '馬'], ['the tiger', '老虎'], ['the dog', '狗'], ['the cat', '貓'], ['the rabbit', '兔子'], ['the turtle', '烏龜'], ['the monkey', '猴子']],
    [['big', ['the elephant', 'the horse', 'the tiger', 'the dog', 'the cat', 'the rabbit']], ['heavy', ['the elephant', 'the horse', 'the dog', 'the rabbit']],
      ['small', ['the rabbit', 'the cat', 'the dog', 'the tiger', 'the horse', 'the elephant']], ['strong', ['the elephant', 'the horse', 'the dog', 'the cat']], ['strong', ['the tiger', 'the monkey', 'the rabbit']],
      ['fast', ['the horse', 'the dog', 'the turtle']], ['fast', ['the tiger', 'the cat', 'the turtle']], ['fast', ['the rabbit', 'the turtle']], ['slow', ['the turtle', 'the rabbit']], ['slow', ['the turtle', 'the horse']],
      ['dangerous', ['the tiger', 'the dog', 'the rabbit']], ['dangerous', ['the tiger', 'the cat', 'the turtle']], ['smart', ['the monkey', 'the turtle']], ['smart', ['the dog', 'the turtle']]],
    [['the elephant', 'big', 'in the zoo', '動物園裡', 'animal'], ['the elephant', 'heavy', 'in the zoo', '動物園裡', 'animal'], ['the turtle', 'slow', 'in the zoo', '動物園裡', 'animal'],
      ['the tiger', 'dangerous', 'in the zoo', '動物園裡', 'animal'], ['the elephant', 'strong', 'in the zoo', '動物園裡', 'animal']]),
  F([['summer', '夏天'], ['winter', '冬天'], ['spring', '春天'], ['autumn', '秋天']],
    [['hot', ['summer', 'spring', 'winter']], ['hot', ['summer', 'autumn', 'winter']], ['cold', ['winter', 'spring', 'summer']], ['cold', ['winter', 'autumn', 'summer']],
      ['warm', ['spring', 'winter']], ['cool', ['autumn', 'summer']]],
    [['summer', 'hot', 'of the year', '一年裡', 'season'], ['winter', 'cold', 'of the year', '一年裡', 'season']]),
  F([['July', '七月'], ['January', '一月'], ['August', '八月'], ['December', '十二月'], ['October', '十月']],
    [['hot', ['July', 'October', 'December']], ['hot', ['August', 'October', 'January']], ['cold', ['January', 'October', 'July']], ['cold', ['December', 'October', 'August']], ['cool', ['October', 'August']]],
    [['July', 'hot', 'of the year', '一年裡', 'month'], ['January', 'cold', 'of the year', '一年裡', 'month']]),
];
// people: names and family, with a gender so "pretty" stays with girls and women, and an age so children are not "rich"
const PERSON_ZH = { nice: '人好' };
const PERSON_ADJS = { young: ['tall', 'short', 'old', 'young', 'strong', 'smart', 'kind', 'nice', 'happy', 'busy', 'thin', 'lazy', 'popular', 'funny', 'healthy', 'cute'],
  adult: ['tall', 'short', 'old', 'young', 'strong', 'smart', 'kind', 'rich', 'busy', 'thin', 'famous', 'popular', 'funny', 'healthy'] };
const PEOPLE = [
  ...NAMES.m.slice(0, 9).map((n) => [n, n, 'm']), ...NAMES.f.slice(0, 9).map((n) => [n, n, 'f']),
  ['my brother', '我哥哥', 'm'], ['my sister', '我姊姊', 'f'], ['my father', '我爸爸', 'm'], ['my mother', '我媽媽', 'f'], ['his uncle', '他叔叔', 'm'], ['her aunt', '她阿姨', 'f'],
  ['that boy', '那個男孩', 'm'], ['this girl', '這個女孩', 'f'], ['our teacher', '我們的老師', 'f'],
];
const isAdult = (en) => /father|mother|uncle|aunt|teacher/.test(en);
const ageOf = (p) => (isAdult(p[0]) ? 'adult' : 'young');
// "in my family" only for my family; children are compared in class, grown-ups among the three
const PERSON_GROUPS = (p) => [
  ...(/^my /.test(p[0]) ? [['in my family', '我家', '']] : []),
  ['of the three', '三個人裡', ''],
  ...(ageOf(p) === 'young' && !/^(my|his|her|our) /.test(p[0]) ? [['in the class', '班上', p[2] === 'f' ? 'girl' : 'boy'], ['in the class', '班上', 'student']] : []),
];

const twoBlanks = (form) => form.split(' ').flatMap((w, i) => (i ? [' ', blank(w)] : [blank(w)]));
const tag = (set) => (set === 'person' ? 'person' : set.items[0][0]);
const zhOf = (set, adj) => (set === 'person' ? PERSON_ZH : set.zh ?? {})[adj.base] ?? adj.zh;
const beOf = (item) => (item[2] === 'pl' ? 'are' : 'is');

// Spelling rules take turns so every sheet from level 2 has its share of more / most questions (two in six).
const TURNS = { 1: ['er', 'er2', 'r'], 2: ['er', 'r', 'ier', 'dbl', 'more', 'more2'], 3: ['er', 'r', 'ier', 'dbl', 'more', 'more2', 'irr'] };
const adjsOf = (s, mode) => (s === 'person' ? [...new Set([...PERSON_ADJS.young, ...PERSON_ADJS.adult])] : s.fact && mode === 'est' ? s.sup.map((x) => x[1]) : s.adjs);
/**
 * A spelling rule for this turn, a set that has such an adjective, the adjective, and two items from the set,
 * the first being "more" than the second when the set holds real kinds. For a superlative from a fact set, `sup`.
 */
function draw(rng, o, mode) {
  const rule = rng.fresh(TURNS[o.level], (x) => `rule-${mode}-${x}`).replace(/2$/, ''); // each section keeps its own turn
  const choices = [...SETS, 'person'].filter((s) => adjsOf(s, mode).some((b) => ADJ[b].rule === rule));
  const set = rng.fresh(choices, tag);
  const adj = ADJ[rng.fresh(adjsOf(set, mode).filter((b) => ADJ[b].rule === rule), (b) => 'adj-' + b)];
  const itemOf = (en) => set.items.find((x) => x[0] === en);
  if (set.fact) {
    if (mode === 'est') { const sup = rng.pick(set.sup.filter((x) => x[1] === adj.base)); return { set, adj, a: itemOf(sup[0]), sup }; }
    const chain = rng.pick(set.cmp.filter((c) => c[0] === adj.base))[1];
    const i = rng.int(chain.length - 1), j = i + 1 + rng.int(chain.length - 1 - i);
    return { set, adj, a: itemOf(chain[i]), b: itemOf(chain[j]) };
  }
  let items = set === 'person' ? PEOPLE.filter((p) => PERSON_ADJS[ageOf(p)].includes(adj.base)) : set.items;
  if (adj.base === 'pretty' && set === 'person') items = items.filter((x) => x[2] === 'f');
  const a = rng.fresh(items, (x) => 'it-' + x[0]);
  const b = rng.pick(items.filter((x) => x[0] !== a[0] && (set !== 'person' || ageOf(x) === ageOf(a))));
  return { set, adj, a, b };
}

const MODES = [
  {
    id: 'er', name: '比較級', instruction: () => '依括號提示，填入形容詞的比較級。',
    gen(rng, o) {
      const { set, adj, a, b } = draw(rng, o, 'er'); if (!b) return null;
      const much = o.level >= 2 && rng.chance(0.25) ? 'much ' : '';
      return {
        lines: [[`${cap(a[0])} ${beOf(a)} ${much}`, ...twoBlanks(adj.cmp), ` (${adj.base}) than ${b[0]}.`]],
        zh: zhJoin(a[1], '比', b[1], zhOf(set, adj)) + (much ? '得多' : '') + '。', meta: { kind: 'er', base: adj.base, rule: adj.rule },
      };
    },
  },
  {
    id: 'est', name: '最高級', instruction: () => '依括號提示，填入 the + 形容詞的最高級（一個空格填一個字）。',
    gen(rng, o) {
      const { set, adj, a, sup } = draw(rng, o, 'est');
      let g, gz, noun;
      if (sup) [, , g, gz, noun] = sup;
      else if (set === 'person') {
        [g, gz, noun] = rng.pick(PERSON_GROUPS(a));
        if (adj.base === 'pretty' && noun === 'student') noun = 'girl';
      } else {
        [g, gz, noun] = rng.pick(set.groups);
        if (noun && rng.chance(0.4)) noun = '';
        if (a[0] === 'Taichung' && g === 'in the country') g = 'in Taiwan', gz = '台灣';
      }
      const nz = { boy: '男孩', girl: '女孩', student: '學生', book: '書', animal: '動物', room: '房間', city: '城市', river: '河', mountain: '山', car: '車', dress: '洋裝', jacket: '夾克', chair: '椅子', season: '季節', month: '月份' }[noun] ?? '';
      return {
        lines: [[`${cap(a[0])} ${beOf(a)} `, ...twoBlanks('the ' + adj.sup), ` (${adj.base})${noun ? ' ' + noun : ''} ${g}.`]],
        zh: zhJoin(a[1], `是${gz}最${zhOf(set, adj)}的${nz}`) + '。', meta: { kind: 'est', base: adj.base, rule: adj.rule },
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
