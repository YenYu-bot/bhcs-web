// Verbs and verb phrases for the verb topics (present simple, progressive, can, past simple).
// Every English word here is in the 2000-word list, a function word, or a regular form of a listed word.
//
// VERBS: every form written out. `sp` says which spelling rule each form follows, so levels can pick easy or hard ones:
//   s:   's' | 'es' | 'ies' | 'irr'          ing: 'ing' | 'e' (drop e) | 'dbl' (double the last letter)
//   past:'ed' | 'd' | 'ied' | 'dbl' | 'irr'
const V = (base, s, ing, past, sp) => ({ base, s, ing, past, sp });
const reg = (base) => V(base, base + 's', base + 'ing', base + 'ed', { s: 's', ing: 'ing', past: 'ed' });
const regE = (base) => V(base, base + 's', base.slice(0, -1) + 'ing', base + 'd', { s: 's', ing: 'e', past: 'd' });
const regEs = (base) => V(base, base + 'es', base + 'ing', base + 'ed', { s: 'es', ing: 'ing', past: 'ed' });
const regY = (base) => V(base, base.slice(0, -1) + 'ies', base + 'ing', base.slice(0, -1) + 'ied', { s: 'ies', ing: 'ing', past: 'ied' });
export const VERBS = {
  // regular
  play: reg('play'), clean: reg('clean'), cook: reg('cook'), walk: reg('walk'), listen: reg('listen'), visit: reg('visit'),
  help: reg('help'), plant: reg('plant'), climb: reg('climb'), jump: reg('jump'), open: reg('open'), call: reg('call'),
  learn: reg('learn'), paint: reg('paint'), enjoy: reg('enjoy'), borrow: reg('borrow'), collect: reg('collect'), travel: reg('travel'),
  watch: regEs('watch'), wash: regEs('wash'), fix: regEs('fix'), brush: regEs('brush'),
  dance: regE('dance'), skate: regE('skate'), close: regE('close'), use: regE('use'), bake: regE('bake'), move: regE('move'),
  practice: regE('practice'), smile: regE('smile'),
  study: regY('study'), cry: regY('cry'), carry: regY('carry'), hurry: regY('hurry'),
  stop: V('stop', 'stops', 'stopping', 'stopped', { s: 's', ing: 'dbl', past: 'dbl' }),
  shop: V('shop', 'shops', 'shopping', 'shopped', { s: 's', ing: 'dbl', past: 'dbl' }),
  plan: V('plan', 'plans', 'planning', 'planned', { s: 's', ing: 'dbl', past: 'dbl' }),
  jog: V('jog', 'jogs', 'jogging', 'jogged', { s: 's', ing: 'dbl', past: 'dbl' }),
  // irregular
  read: V('read', 'reads', 'reading', 'read', { s: 's', ing: 'ing', past: 'irr' }),
  eat: V('eat', 'eats', 'eating', 'ate', { s: 's', ing: 'ing', past: 'irr' }),
  drink: V('drink', 'drinks', 'drinking', 'drank', { s: 's', ing: 'ing', past: 'irr' }),
  do: V('do', 'does', 'doing', 'did', { s: 'es', ing: 'ing', past: 'irr' }),
  write: V('write', 'writes', 'writing', 'wrote', { s: 's', ing: 'e', past: 'irr' }),
  sing: V('sing', 'sings', 'singing', 'sang', { s: 's', ing: 'ing', past: 'irr' }),
  swim: V('swim', 'swims', 'swimming', 'swam', { s: 's', ing: 'dbl', past: 'irr' }),
  run: V('run', 'runs', 'running', 'ran', { s: 's', ing: 'dbl', past: 'irr' }),
  ride: V('ride', 'rides', 'riding', 'rode', { s: 's', ing: 'e', past: 'irr' }),
  take: V('take', 'takes', 'taking', 'took', { s: 's', ing: 'e', past: 'irr' }),
  go: V('go', 'goes', 'going', 'went', { s: 'es', ing: 'ing', past: 'irr' }),
  sleep: V('sleep', 'sleeps', 'sleeping', 'slept', { s: 's', ing: 'ing', past: 'irr' }),
  draw: V('draw', 'draws', 'drawing', 'drew', { s: 's', ing: 'ing', past: 'irr' }),
  buy: V('buy', 'buys', 'buying', 'bought', { s: 's', ing: 'ing', past: 'irr' }),
  make: V('make', 'makes', 'making', 'made', { s: 's', ing: 'e', past: 'irr' }),
  fly: V('fly', 'flies', 'flying', 'flew', { s: 'ies', ing: 'ing', past: 'irr' }),
  sit: V('sit', 'sits', 'sitting', 'sat', { s: 's', ing: 'dbl', past: 'irr' }),
  teach: V('teach', 'teaches', 'teaching', 'taught', { s: 'es', ing: 'ing', past: 'irr' }),
  drive: V('drive', 'drives', 'driving', 'drove', { s: 's', ing: 'e', past: 'irr' }),
  catch: V('catch', 'catches', 'catching', 'caught', { s: 'es', ing: 'ing', past: 'irr' }),
  get: V('get', 'gets', 'getting', 'got', { s: 's', ing: 'dbl', past: 'irr' }),
  have: V('have', 'has', 'having', 'had', { s: 'irr', ing: 'e', past: 'irr' }),
  see: V('see', 'sees', 'seeing', 'saw', { s: 's', ing: 'ing', past: 'irr' }),
  come: V('come', 'comes', 'coming', 'came', { s: 's', ing: 'e', past: 'irr' }),
  feed: V('feed', 'feeds', 'feeding', 'fed', { s: 's', ing: 'ing', past: 'irr' }),
  wear: V('wear', 'wears', 'wearing', 'wore', { s: 's', ing: 'ing', past: 'irr' }),
  bring: V('bring', 'brings', 'bringing', 'brought', { s: 's', ing: 'ing', past: 'irr' }),
  meet: V('meet', 'meets', 'meeting', 'met', { s: 's', ing: 'ing', past: 'irr' }),
  speak: V('speak', 'speaks', 'speaking', 'spoke', { s: 's', ing: 'ing', past: 'irr' }),
};

// Verb phrases.
//   v      key in VERBS          rest  words after the verb          zh  Chinese verb phrase
//   who    subject kinds         age   'adult' | 'young' when only those people fit     species  which animals
//   habit  fits "every day"      prog  fits "now" with -ing          able  fits "can ..."      pastOk  fits "yesterday"
//   cues   { habit, past, pastprog }: only these time words for that use (meals and school days have their own times)
//   at     places that may be added after the phrase: [english, chinese]
const HOME = ['at home', '在家'], PARK = ['in the park', '在公園'], SCHOOL = ['at school', '在學校'], LIB = ['in the library', '在圖書館'];
const KITCHEN = ['in the kitchen', '在廚房'], GYM = ['in the gym', '在體育館'], PLAYGROUND = ['on the playground', '在操場'], GARDEN = ['in the garden', '在花園'];
// Outdoor and daytime things are not done at night, so their past-progressive times are daytime only.
const DAY = ['at this time yesterday', 'at seven yesterday morning'];
const ANIMAL = { habit: ['every day'], past: ['yesterday', 'last night', 'two days ago'] };
const WEEKEND = { habit: ['every Sunday', 'every Saturday', 'on weekends'], pastprog: DAY };
const OUT = { pastprog: DAY };
const MEAL = (habit, past) => ({ habit, past, pastprog: ['at this time yesterday'] });
const F = (v, rest, zh, opts = {}) => ({ v, rest, zh, who: ['person'], habit: true, prog: true, able: false, pastOk: true, ...opts });
export const FRAMES = [
  // sports and games
  F('play', 'basketball', '打籃球', { able: true, cues: OUT, at: [PARK, SCHOOL, PLAYGROUND, GYM] }),
  F('play', 'baseball', '打棒球', { able: true, cues: OUT, at: [PARK, PLAYGROUND] }),
  F('play', 'badminton', '打羽毛球', { able: true, at: [PARK, GYM] }),
  F('play', 'volleyball', '打排球', { able: true, at: [SCHOOL, GYM] }),
  F('play', 'tennis', '打網球', { able: true, cues: OUT, at: [PARK] }),
  F('play', 'soccer', '踢足球', { able: true, cues: OUT, at: [PLAYGROUND, PARK] }),
  F('play', 'computer games', '玩電腦遊戲', { at: [HOME] }),
  // music and art
  F('play', 'the piano', '彈鋼琴', { able: true, at: [HOME, SCHOOL] }),
  F('play', 'the violin', '拉小提琴', { able: true, at: [HOME, SCHOOL] }),
  F('play', 'the guitar', '彈吉他', { able: true, at: [HOME, PARK] }),
  F('practice', 'the piano', '練習鋼琴', { at: [HOME, SCHOOL] }),
  F('sing', 'songs', '唱歌', { able: true, at: [HOME, SCHOOL] }),
  F('dance', '', '跳舞', { able: true, at: [SCHOOL, PARK] }),
  F('draw', 'pictures', '畫畫', { able: true, at: [HOME, SCHOOL, PARK] }),
  F('paint', 'pictures', '畫圖', { able: true, at: [HOME, SCHOOL] }),
  F('take', 'pictures', '拍照', { able: true, cues: OUT, at: [PARK, ['at the zoo', '在動物園']] }),
  // reading, writing, school
  F('read', 'the newspaper', '看報紙', { at: [HOME] }),
  F('read', 'story books', '看故事書', { at: [HOME, LIB] }),
  F('read', 'magazines', '看雜誌', { at: [HOME, LIB] }),
  F('write', 'letters', '寫信', { at: [HOME] }),
  F('do', 'homework', '寫功課', { age: 'young', cues: { habit: ['every day', 'after school'], past: ['yesterday', 'last night', 'two days ago'] }, at: [HOME, LIB] }),
  F('study', 'history', '讀歷史', { at: [HOME, LIB] }),
  F('study', 'science', '讀自然', { at: [HOME, LIB] }),
  F('study', 'art', '學美術', { at: [SCHOOL] }),
  F('learn', 'art', '學美術', { at: [SCHOOL] }),
  F('borrow', 'books', '借書', { at: [LIB], cues: WEEKEND }),
  F('use', 'the computer', '用電腦', { able: true, at: [HOME, LIB] }),
  F('go', 'to school', '上學', { prog: false, age: 'young', cues: { habit: ['every day', 'every morning'], past: ['yesterday', 'two days ago'] } }),
  F('walk', 'to school', '走路上學', { age: 'young', cues: { habit: ['every day', 'every morning'], past: ['yesterday', 'two days ago'], pastprog: ['at this time yesterday'] } }),
  F('go', 'to the library', '去圖書館', { prog: false, cues: WEEKEND }),
  F('go', 'to the park', '去公園', { prog: false, cues: WEEKEND }),
  F('take', 'the bus', '搭公車', { prog: false, cues: { habit: ['every day', 'every morning'], past: ['yesterday', 'two days ago', 'last Sunday'] } }),
  F('hurry', 'to school', '趕去上學', { age: 'young', habit: false, cues: { past: ['yesterday', 'two days ago'], pastprog: ['at this time yesterday'] } }),
  // home
  F('watch', 'television', '看電視', { at: [HOME] }),
  F('watch', 'baseball games', '看棒球比賽', { at: [HOME], cues: WEEKEND }),
  F('listen', 'to music', '聽音樂', { at: [HOME] }),
  F('listen', 'to the radio', '聽收音機', { at: [HOME] }),
  F('wash', 'the dishes', '洗碗', { at: [KITCHEN] }),
  F('wash', 'the car', '洗車', { cues: WEEKEND }),
  F('wash', 'clothes', '洗衣服', { at: [HOME] }),
  F('clean', 'the room', '打掃房間'),
  F('clean', 'the kitchen', '打掃廚房'),
  F('clean', 'the classroom', '打掃教室', { age: 'young' }),
  F('cook', 'dinner', '煮晚餐', { cues: { habit: ['every day', 'on weekends', 'every Sunday'], past: ['yesterday', 'last night', 'last Sunday', 'last weekend'] }, at: [KITCHEN, HOME] }),
  F('cook', 'lunch', '煮午餐', { cues: MEAL(['every day', 'on weekends'], ['yesterday', 'last Sunday', 'two days ago']), at: [KITCHEN] }),
  F('make', 'cakes', '做蛋糕', { able: true, at: [KITCHEN, HOME] }),
  F('make', 'sandwiches', '做三明治', { able: true, at: [KITCHEN, HOME] }),
  F('bake', 'bread', '烤麵包', { able: true, at: [KITCHEN, HOME] }),
  F('bake', 'cookies', '烤餅乾', { able: true, at: [KITCHEN, HOME] }),
  F('fix', 'the bicycle', '修腳踏車', { able: true }),
  F('fix', 'the computer', '修電腦', { able: true, age: 'adult' }),
  F('open', 'the window', '打開窗戶', { habit: false, pastOk: true, cues: { past: ['yesterday', 'last night', 'two days ago'], pastprog: ['at this time yesterday'] } }),
  F('close', 'the door', '關門', { habit: false, pastOk: true, cues: { past: ['yesterday', 'last night', 'two days ago'], pastprog: ['at this time yesterday'] } }),
  F('move', 'the chairs', '搬椅子', { habit: false }),
  F('carry', 'the boxes', '搬箱子', { habit: false, able: true }),
  F('feed', 'the dog', '餵狗', { cues: { habit: ['every day', 'every morning'] } }),
  F('feed', 'the fish', '餵魚', { cues: { habit: ['every day', 'every morning'] } }),
  F('brush', 'the dog', '幫狗梳毛', { cues: WEEKEND }),
  // meals and drinks
  F('eat', 'breakfast', '吃早餐', { cues: MEAL(['every day', 'every morning'], ['yesterday', 'two days ago']), at: [HOME, SCHOOL] }),
  F('have', 'lunch', '吃午餐', { cues: MEAL(['every day'], ['yesterday', 'two days ago', 'last Sunday']), at: [SCHOOL, HOME] }),
  F('have', 'dinner', '吃晚餐', { cues: { habit: ['every day'], past: ['yesterday', 'last night', 'last Sunday'], pastprog: ['at eight last night'] }, at: [HOME, ['at the restaurant', '在餐廳']] }),
  F('eat', 'apples', '吃蘋果', { cues: { habit: ['every day', 'every morning'] } }),
  F('drink', 'milk', '喝牛奶', { cues: { habit: ['every day', 'every morning'] } }),
  F('drink', 'juice', '喝果汁', {}),
  F('drink', 'tea', '喝茶', { age: 'adult' }),
  F('bring', 'lunch', '帶午餐', { age: 'young', prog: false, cues: { habit: ['every day'], past: ['yesterday', 'two days ago'] }, at: [] }),
  // going out
  F('swim', '', '游泳', { able: true, cues: OUT, at: [['in the pool', '在游泳池'], ['in the river', '在河裡'], ['at the beach', '在海邊']] }),
  F('run', 'in the park', '在公園跑步'),
  F('jog', 'in the park', '在公園慢跑', { cues: { habit: ['every day', 'every morning', 'on weekends'] } }),
  F('ride', 'a bicycle', '騎腳踏車', { able: true, cues: OUT, at: [PARK] }),
  F('take', 'a walk', '散步', { at: [PARK] }),
  F('walk', 'the dog', '遛狗', { at: [PARK] }),
  F('fly', 'a kite', '放風箏', { able: true, cues: WEEKEND, at: [PARK, ['at the beach', '在海邊']] }),
  F('skate', 'in the park', '在公園溜冰', { able: true, cues: OUT }),
  F('climb', 'mountains', '爬山', { cues: WEEKEND, able: true }),
  F('plant', 'trees', '種樹', { cues: WEEKEND, at: [GARDEN, PARK] }),
  F('plant', 'flowers', '種花', { cues: WEEKEND, at: [GARDEN] }),
  F('catch', 'fish', '抓魚', { cues: WEEKEND, at: [['in the river', '在河裡']] }),
  F('visit', 'the museum', '參觀博物館', { cues: WEEKEND }),
  F('visit', 'the zoo', '去動物園玩', { cues: WEEKEND }),
  F('see', 'a movie', '看電影', { prog: false, cues: WEEKEND }),
  F('shop', 'at the supermarket', '在超市購物'),
  F('buy', 'bread', '買麵包', { at: [['at the bakery', '在麵包店']] }),
  F('buy', 'fruit', '買水果', { at: [['at the market', '在市場']] }),
  F('meet', 'friends', '和朋友見面', { at: [PARK, ['at the station', '在車站']], cues: WEEKEND }),
  F('call', 'friends', '打電話給朋友', { at: [HOME] }),
  F('travel', 'by train', '搭火車旅行', { cues: WEEKEND }),
  F('get', 'up early', '早起', { prog: false, cues: { habit: ['every day', 'every morning'], past: ['yesterday', 'two days ago', 'last Sunday'] } }),
  F('come', 'home late', '晚回家', { prog: false, cues: { habit: ['every day', 'every evening', 'on weekends'], past: ['yesterday', 'last night', 'last Sunday', 'two days ago'] } }),
  F('help', 'the teacher', '幫忙老師', { age: 'young', cues: { habit: ['every day', 'after school'] }, at: [SCHOOL] }),
  F('teach', 'art', '教美術', { age: 'adult', cues: { habit: ['every day'], past: ['yesterday', 'two days ago', 'three days ago', 'last month'] }, at: [SCHOOL] }),
  F('teach', 'history', '教歷史', { age: 'adult', cues: { habit: ['every day'], past: ['yesterday', 'two days ago', 'three days ago', 'last month'] }, at: [SCHOOL] }),
  F('drive', 'a car', '開車', { age: 'adult', able: true }),
  F('drive', 'a taxi', '開計程車', { age: 'adult' }),
  F('wear', 'a hat', '戴帽子', { cues: { habit: ['every day', 'on weekends'] } }),
  F('wear', 'a uniform', '穿制服', { age: 'young', cues: { habit: ['every day'], past: ['yesterday', 'two days ago'] } }),
  F('sit', 'under the tree', '坐在樹下', { habit: false }),
  F('enjoy', 'the music', '享受音樂', { habit: false, prog: false, cues: { past: ['last night', 'last Sunday', 'last weekend'] } }),
  F('plan', 'a party', '計畫派對', { habit: false }),
  F('cry', '', '哭', { habit: false }),
  F('smile', '', '微笑', { habit: false }),
  F('sleep', '', '睡覺', { habit: false }),
  // animals
  F('sleep', 'on the sofa', '在沙發上睡覺', { who: ['animal'], cues: ANIMAL, species: ['dog', 'cat'] }),
  F('run', 'in the garden', '在花園跑', { who: ['animal'], cues: ANIMAL, species: ['dog', 'cat', 'rabbit'] }),
  F('eat', 'fish', '吃魚', { who: ['animal'], cues: ANIMAL, species: ['cat', 'duck'] }),
  F('drink', 'water', '喝水', { who: ['animal'], cues: ANIMAL }),
  F('swim', '', '游泳', { who: ['animal'], able: true, cues: ANIMAL, species: ['dog', 'duck'] }),
  F('jump', 'high', '跳得很高', { who: ['animal'], able: true, prog: false, habit: false, pastOk: false, species: ['dog', 'cat', 'rabbit'] }),
  F('climb', 'trees', '爬樹', { who: ['animal'], able: true, cues: ANIMAL, species: ['cat'] }),
  F('sing', '', '唱歌', { who: ['animal'], cues: ANIMAL, species: ['bird'] }),
  F('fly', '', '飛', { who: ['animal'], able: true, habit: false, cues: ANIMAL, species: ['bird'] }),
  F('play', 'with the ball', '玩球', { who: ['animal'], cues: ANIMAL, species: ['dog', 'cat'] }),
];

// Time words for verb sentences; each tells the student which form to use.
//   use 'habit' (present simple) | 'now' (present progressive) | 'past' (past simple) | 'pastprog' | 'able' (can) | 'ablepast' (could)
export const VTIMES = [
  { en: 'every day', zh: '每天', use: 'habit' },
  { en: 'every morning', zh: '每天早上', use: 'habit' },
  { en: 'every Sunday', zh: '每個星期天', use: 'habit' },
  { en: 'after school', zh: '放學後', use: 'habit' },
  { en: 'on weekends', zh: '週末', use: 'habit' },
  { en: 'every Saturday', zh: '每個星期六', use: 'habit' },
  { en: 'every evening', zh: '每天傍晚', use: 'habit' },
  { en: 'now', zh: '現在', use: 'now' },
  { en: 'right now', zh: '現在', use: 'now' },
  { en: 'at the moment', zh: '此刻', use: 'now' },
  { en: 'yesterday', zh: '昨天', use: 'past' },
  { en: 'last night', zh: '昨晚', use: 'past' },
  { en: 'last Sunday', zh: '上星期天', use: 'past' },
  { en: 'last weekend', zh: '上週末', use: 'past' },
  { en: 'two days ago', zh: '兩天前', use: 'past' },
  { en: 'last Saturday', zh: '上星期六', use: 'past' },
  { en: 'three days ago', zh: '三天前', use: 'past' },
  { en: 'at eight last night', zh: '昨晚八點', use: 'pastprog' },
  { en: 'at this time yesterday', zh: '昨天這個時候', use: 'pastprog' },
  { en: 'at nine last night', zh: '昨晚九點', use: 'pastprog' },
  { en: 'at seven yesterday morning', zh: '昨天早上七點', use: 'pastprog' },
  { en: 'now', zh: '現在', use: 'able' },
  { en: 'two years ago', zh: '兩年前', use: 'ablepast' },
  { en: 'last year', zh: '去年', use: 'ablepast' },
  { en: 'three years ago', zh: '三年前', use: 'ablepast' },
  { en: 'four years ago', zh: '四年前', use: 'ablepast' },
  { en: 'ten years ago', zh: '十年前', use: 'ablepast' },
];

export const vform = (f, key) => VERBS[f.v][key];
export const phrase = (f) => (f.rest ? ' ' + f.rest : '');

/** Time words for this phrase and use; "after school" is for students, not grown-ups. */
export function cuesFor(f, use, s) {
  return VTIMES.filter((t) => t.use === use && (!f.cues?.[use] || f.cues[use].includes(t.en)) && !(t.en === 'after school' && s?.age === 'adult'));
}
