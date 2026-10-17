// Verbs and verb phrases for the verb topics (present simple, progressive, can, past simple).
//
// VERBS: every form written out. `sp` says which spelling rule each form follows, so levels can pick easy or hard ones:
//   s:   's' | 'es' | 'ies' | 'irr'          ing: 'ing' | 'e' (drop e) | 'dbl' (double the last letter)
//   past:'ed' | 'd' | 'ied' | 'dbl' | 'irr'
const V = (base, s, ing, past, sp) => ({ base, s, ing, past, sp });
export const VERBS = {
  play: V('play', 'plays', 'playing', 'played', { s: 's', ing: 'ing', past: 'ed' }),
  watch: V('watch', 'watches', 'watching', 'watched', { s: 'es', ing: 'ing', past: 'ed' }),
  read: V('read', 'reads', 'reading', 'read', { s: 's', ing: 'ing', past: 'irr' }),
  eat: V('eat', 'eats', 'eating', 'ate', { s: 's', ing: 'ing', past: 'irr' }),
  drink: V('drink', 'drinks', 'drinking', 'drank', { s: 's', ing: 'ing', past: 'irr' }),
  wash: V('wash', 'washes', 'washing', 'washed', { s: 'es', ing: 'ing', past: 'ed' }),
  clean: V('clean', 'cleans', 'cleaning', 'cleaned', { s: 's', ing: 'ing', past: 'ed' }),
  do: V('do', 'does', 'doing', 'did', { s: 'es', ing: 'ing', past: 'irr' }),
  write: V('write', 'writes', 'writing', 'wrote', { s: 's', ing: 'e', past: 'irr' }),
  cook: V('cook', 'cooks', 'cooking', 'cooked', { s: 's', ing: 'ing', past: 'ed' }),
  sing: V('sing', 'sings', 'singing', 'sang', { s: 's', ing: 'ing', past: 'irr' }),
  swim: V('swim', 'swims', 'swimming', 'swam', { s: 's', ing: 'dbl', past: 'irr' }),
  run: V('run', 'runs', 'running', 'ran', { s: 's', ing: 'dbl', past: 'irr' }),
  ride: V('ride', 'rides', 'riding', 'rode', { s: 's', ing: 'e', past: 'irr' }),
  take: V('take', 'takes', 'taking', 'took', { s: 's', ing: 'e', past: 'irr' }),
  go: V('go', 'goes', 'going', 'went', { s: 'es', ing: 'ing', past: 'irr' }),
  walk: V('walk', 'walks', 'walking', 'walked', { s: 's', ing: 'ing', past: 'ed' }),
  study: V('study', 'studies', 'studying', 'studied', { s: 'ies', ing: 'ing', past: 'ied' }),
  listen: V('listen', 'listens', 'listening', 'listened', { s: 's', ing: 'ing', past: 'ed' }),
  sleep: V('sleep', 'sleeps', 'sleeping', 'slept', { s: 's', ing: 'ing', past: 'irr' }),
  cry: V('cry', 'cries', 'crying', 'cried', { s: 'ies', ing: 'ing', past: 'ied' }),
  dance: V('dance', 'dances', 'dancing', 'danced', { s: 's', ing: 'e', past: 'd' }),
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
  visit: V('visit', 'visits', 'visiting', 'visited', { s: 's', ing: 'ing', past: 'ed' }),
  help: V('help', 'helps', 'helping', 'helped', { s: 's', ing: 'ing', past: 'ed' }),
  stop: V('stop', 'stops', 'stopping', 'stopped', { s: 's', ing: 'dbl', past: 'dbl' }),
  shop: V('shop', 'shops', 'shopping', 'shopped', { s: 's', ing: 'dbl', past: 'dbl' }),
  plant: V('plant', 'plants', 'planting', 'planted', { s: 's', ing: 'ing', past: 'ed' }),
  climb: V('climb', 'climbs', 'climbing', 'climbed', { s: 's', ing: 'ing', past: 'ed' }),
  jump: V('jump', 'jumps', 'jumping', 'jumped', { s: 's', ing: 'ing', past: 'ed' }),
  speak: V('speak', 'speaks', 'speaking', 'spoke', { s: 's', ing: 'ing', past: 'irr' }),
  skate: V('skate', 'skates', 'skating', 'skated', { s: 's', ing: 'e', past: 'd' }),
};

// Verb phrases.
//   v      key in VERBS          rest  words after the verb          zh  Chinese verb phrase
//   who    subject kinds         age   'adult' | 'young' when only those people fit     species  which animals
//   habit  fits "every day"      prog  fits "now" with -ing          able  fits "can ..."
//   pastOk fits "yesterday"
//   cues   { habit, past, pastprog }: only these time words for that use (meals and school days have their own times)
const ANIMAL = { habit: ['every day', 'every morning'] };
const F = (v, rest, zh, opts = {}) => ({ v, rest, zh, who: ['person'], habit: true, prog: true, able: false, pastOk: true, ...opts });
export const FRAMES = [
  F('play', 'basketball', '打籃球', { able: true }),
  F('play', 'the piano', '彈鋼琴', { able: true }),
  F('play', 'baseball', '打棒球', { able: true }),
  F('watch', 'television', '看電視'),
  F('read', 'the newspaper', '看報紙'),
  F('read', 'story books', '看故事書'),
  F('eat', 'breakfast', '吃早餐', { cues: { habit: ['every day', 'every morning'], past: ['yesterday', 'two days ago'], pastprog: ['at this time yesterday'] } }),
  F('drink', 'milk', '喝牛奶', { cues: { habit: ['every day', 'every morning'] } }),
  F('wash', 'the dishes', '洗碗'),
  F('clean', 'the room', '打掃房間'),
  F('do', 'homework', '寫功課', { age: 'young', cues: { habit: ['every day', 'after school'], past: ['yesterday', 'last night', 'two days ago'] } }),
  F('write', 'letters', '寫信'),
  F('cook', 'dinner', '煮晚餐', { cues: { habit: ['every day', 'on weekends', 'every Sunday'], past: ['yesterday', 'last night', 'last Sunday', 'last weekend'] } }),
  F('sing', 'songs', '唱歌'),
  F('swim', '', '游泳', { able: true }),
  F('run', 'in the park', '在公園跑步'),
  F('ride', 'a bicycle', '騎腳踏車', { able: true }),
  F('take', 'a walk', '散步'),
  F('go', 'to school', '上學', { prog: false, age: 'young', cues: { habit: ['every day', 'every morning'], past: ['yesterday', 'two days ago'] } }),
  F('walk', 'to school', '走路上學', { age: 'young', cues: { habit: ['every day', 'every morning'], past: ['yesterday', 'two days ago'], pastprog: ['at this time yesterday'] } }),
  F('study', 'history', '讀歷史'),
  F('study', 'science', '讀自然'),
  F('listen', 'to music', '聽音樂'),
  F('dance', '', '跳舞', { able: true }),
  F('draw', 'pictures', '畫畫', { able: true }),
  F('buy', 'bread', '買麵包'),
  F('make', 'cakes', '做蛋糕', { able: true }),
  F('fly', 'a kite', '放風箏', { able: true }),
  F('sit', 'under the tree', '坐在樹下', { habit: false }),
  F('teach', 'art', '教美術', { age: 'adult' }),
  F('drive', 'a car', '開車', { age: 'adult', able: true }),
  F('catch', 'fish', '抓魚'),
  F('get', 'up early', '早起', { prog: false, cues: { habit: ['every day', 'every morning'], past: ['yesterday', 'two days ago', 'last Sunday'] } }),
  F('have', 'lunch', '吃午餐', { cues: { habit: ['every day'], past: ['yesterday', 'two days ago', 'last Sunday'], pastprog: ['at this time yesterday'] } }),
  F('see', 'a movie', '看電影', { prog: false }),
  F('come', 'home late', '晚回家', { prog: false, cues: { past: ['yesterday', 'last night', 'last Sunday', 'two days ago'] } }),
  F('visit', 'the museum', '參觀博物館'),
  F('help', 'the teacher', '幫忙老師'),
  F('shop', 'at the supermarket', '在超市購物'),
  F('plant', 'trees', '種樹'),
  F('climb', 'the mountain', '爬山'),
  F('skate', 'in the park', '在公園溜冰', { able: true }),
  F('cry', '', '哭', { habit: false }),
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
  F('fly', '', '飛', { who: ['animal'], able: true, cues: ANIMAL, species: ['bird'] }),
];

// Time words for verb sentences; each tells the student which form to use.
//   use 'habit' (present simple) | 'now' (present progressive) | 'past' (past simple) | 'pastprog' | 'able' (can) | 'abledpast' (could)
export const VTIMES = [
  { en: 'every day', zh: '每天', use: 'habit' },
  { en: 'every morning', zh: '每天早上', use: 'habit' },
  { en: 'every Sunday', zh: '每個星期天', use: 'habit' },
  { en: 'after school', zh: '放學後', use: 'habit', zhPre: true },
  { en: 'on weekends', zh: '週末', use: 'habit' },
  { en: 'now', zh: '現在', use: 'now' },
  { en: 'right now', zh: '現在', use: 'now' },
  { en: 'yesterday', zh: '昨天', use: 'past' },
  { en: 'last night', zh: '昨晚', use: 'past' },
  { en: 'last Sunday', zh: '上星期天', use: 'past' },
  { en: 'last weekend', zh: '上週末', use: 'past' },
  { en: 'two days ago', zh: '兩天前', use: 'past' },
  { en: 'at eight last night', zh: '昨晚八點', use: 'pastprog' },
  { en: 'at this time yesterday', zh: '昨天這個時候', use: 'pastprog' },
  { en: 'now', zh: '現在', use: 'able' },
  { en: 'two years ago', zh: '兩年前', use: 'ablepast' },
  { en: 'last year', zh: '去年', use: 'ablepast' },
];

export const vform = (f, key) => VERBS[f.v][key];

/** Time words for this phrase and use; "after school" is for students, not grown-ups. */
export function cuesFor(f, use, s) {
  return VTIMES.filter((t) => t.use === use && (!f.cues?.[use] || f.cues[use].includes(t.en)) && !(t.en === 'after school' && s?.age === 'adult'));
}
export const phrase = (f) => (f.rest ? ' ' + f.rest : '');
