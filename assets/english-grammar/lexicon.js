// Word bank for the grammar worksheets. Every English word here is in the 2000-word list
// (scripts/english-grammar/wordlist-2000.json), a function word in FUNCTION_WORDS, a regular form of a listed word, or a name.
//
// Subject fields
//   en      as written in the middle of a sentence (cap() makes it sentence-initial)
//   zh      Chinese for the translation line
//   num     'sg' | 'pl'       person 1 | 2 | 3       kind 'person' | 'animal' | 'thing' | 'food' | 'drink' | 'weather'
//   reply   pronoun the other speaker uses in a short answer ("Is Amy ...? — Yes, she is."); null = not used in answers
//   age     'adult' | 'young' | 'any'  (people only; decides which jobs fit)
//   lvl     first level the subject appears at
//   species (animals) dog | cat | bird | rabbit | duck — which activities fit
//   tag     extra marks: 'pron' (pronoun), 'name', 'every', 'with-i' (X and I), 'with-you', 'uncount', 'irreg' (irregular plural)

export const NAMES = {
  m: ['Tom', 'Ben', 'John', 'Peter', 'David', 'Eric', 'Mark', 'Tony', 'Jack', 'Sam', 'Andy', 'Kevin', 'Mike', 'Bill', 'Ken', 'Leo', 'Frank', 'Paul'],
  f: ['Amy', 'Mary', 'Lisa', 'Jenny', 'Sally', 'Linda', 'Judy', 'Kate', 'Emma', 'Helen', 'Cindy', 'Grace', 'Nancy', 'Tina', 'Annie', 'Wendy', 'Lucy', 'Susan'],
};

const P = (en, zh, num, person, kind, reply, lvl, extra = {}) => ({ en, zh, num, person, kind, reply, lvl, age: 'any', tags: [], ...extra });

export const SUBJECTS = [
  // pronouns (level 1)
  P('I', '我', 'sg', 1, 'person', 'you', 1, { tags: ['pron'] }),
  P('you', '你', 'sg', 2, 'person', null, 1, { tags: ['pron'] }),
  P('he', '他', 'sg', 3, 'person', 'he', 1, { tags: ['pron'] }),
  P('she', '她', 'sg', 3, 'person', 'she', 1, { tags: ['pron'] }),
  P('it', '牠', 'sg', 3, 'animal', 'it', 1, { tags: ['pron'] }),
  P('it', '它', 'sg', 3, 'thing', 'it', 1, { tags: ['pron'] }),
  P('it', '天氣', 'sg', 3, 'weather', 'it', 1, { tags: ['pron'] }),
  P('we', '我們', 'pl', 1, 'person', 'you', 1, { tags: ['pron'], age: 'young' }),
  P('they', '他們', 'pl', 3, 'person', 'they', 1, { tags: ['pron'] }),
  P('they', '牠們', 'pl', 3, 'animal', 'they', 1, { tags: ['pron'] }),
  P('they', '它們', 'pl', 3, 'thing', 'they', 1, { tags: ['pron'] }),

  // family and school (level 1)
  P('my brother', '我的哥哥', 'sg', 3, 'person', 'he', 1, { age: 'young' }),
  P('my sister', '我的姊姊', 'sg', 3, 'person', 'she', 1, { age: 'young' }),
  P('my father', '我爸爸', 'sg', 3, 'person', 'he', 1, { age: 'adult' }),
  P('my mother', '我媽媽', 'sg', 3, 'person', 'she', 1, { age: 'adult' }),
  P('my grandfather', '我的爺爺', 'sg', 3, 'person', 'he', 1, { age: 'adult' }),
  P('my grandmother', '我的奶奶', 'sg', 3, 'person', 'she', 1, { age: 'adult' }),
  P('my teacher', '我的老師', 'sg', 3, 'person', null, 1, { age: 'adult', tags: ['has-job'] }),
  P('my classmate', '我的同學', 'sg', 3, 'person', null, 1, { age: 'young' }),
  P('my family', '我的家人', 'sg', 3, 'person', null, 1, { age: 'group', tags: ['group'] }),
  P('my parents', '我的父母', 'pl', 3, 'person', 'they', 1, { age: 'adult' }),
  P('my classmates', '我的同學們', 'pl', 3, 'person', 'they', 1, { age: 'young' }),
  P('my friends', '我的朋友們', 'pl', 3, 'person', 'they', 1, { age: 'young' }),
  // people, singular (level 2)
  P('his uncle', '他的叔叔', 'sg', 3, 'person', 'he', 2, { age: 'adult' }),
  P('her aunt', '她的阿姨', 'sg', 3, 'person', 'she', 2, { age: 'adult' }),
  P('Mr. Chen', '陳先生', 'sg', 3, 'person', 'he', 2, { age: 'adult', tags: ['name'] }),
  P('Ms. Lin', '林小姐', 'sg', 3, 'person', 'she', 2, { age: 'adult', tags: ['name'] }),
  P('the boy', '那個男孩', 'sg', 3, 'person', 'he', 2, { age: 'young' }),
  P('the girl', '那個女孩', 'sg', 3, 'person', 'she', 2, { age: 'young' }),
  // people, plural
  P('the students', '學生們', 'pl', 3, 'person', 'they', 2, { age: 'young' }),
  P('these girls', '這些女孩', 'pl', 3, 'person', 'they', 2, { age: 'young' }),
  P('those boys', '那些男孩', 'pl', 3, 'person', 'they', 2, { age: 'young' }),
  P('our teachers', '我們的老師們', 'pl', 3, 'person', 'they', 2, { age: 'adult', tags: ['has-job'] }),
  // animals
  P('the dog', '那隻狗', 'sg', 3, 'animal', 'it', 2, { species: 'dog' }),
  P('my cat', '我的貓', 'sg', 3, 'animal', 'it', 2, { species: 'cat' }),
  P('the bird', '那隻鳥', 'sg', 3, 'animal', 'it', 2, { species: 'bird' }),
  P('the dogs', '那些狗', 'pl', 3, 'animal', 'they', 2, { species: 'dog' }),
  P('the rabbits', '那些兔子', 'pl', 3, 'animal', 'they', 2, { species: 'rabbit' }),
  P('the ducks', '那些鴨子', 'pl', 3, 'animal', 'they', 2, { species: 'duck' }),
  // things
  P('this book', '這本書', 'sg', 3, 'thing', 'it', 2),
  P('the box', '那個盒子', 'sg', 3, 'thing', 'it', 2),
  P('my bag', '我的袋子', 'sg', 3, 'thing', 'it', 2),
  P('your umbrella', '你的雨傘', 'sg', 3, 'thing', 'it', 2),
  P('the books', '那些書', 'pl', 3, 'thing', 'they', 2),
  P('my shoes', '我的鞋子', 'pl', 3, 'thing', 'they', 2),
  P('these pencils', '這些鉛筆', 'pl', 3, 'thing', 'they', 2),
  P('the keys', '那些鑰匙', 'pl', 3, 'thing', 'they', 2),
  // food
  P('the apples', '那些蘋果', 'pl', 3, 'food', 'they', 2),
  P('the cake', '那個蛋糕', 'sg', 3, 'food', 'it', 2),

  // level 3: subjects students often get wrong
  P('Ben and I', 'Ben 和我', 'pl', 1, 'person', 'you', 3, { age: 'young', tags: ['with-i'] }),
  P('my sister and I', '我姊姊和我', 'pl', 1, 'person', 'you', 3, { age: 'young', tags: ['with-i'] }),
  P('you and Tom', '你和 Tom', 'pl', 2, 'person', 'we', 3, { age: 'young', tags: ['with-you'] }),
  P('the milk', '牛奶', 'sg', 3, 'drink', 'it', 3, { tags: ['uncount'] }),
  P('the bread', '麵包', 'sg', 3, 'food', 'it', 3, { tags: ['uncount'] }),
  P('the money', '那些錢', 'sg', 3, 'thing', 'it', 3, { tags: ['uncount'] }),
  P('the children', '孩子們', 'pl', 3, 'person', 'they', 3, { age: 'young', tags: ['irreg'] }),
  P('these people', '這些人', 'pl', 3, 'person', 'they', 3, { tags: ['irreg'] }),
  P('those women', '那些女士', 'pl', 3, 'person', 'they', 3, { age: 'adult', tags: ['irreg'] }),
  P('every student', '每個學生', 'sg', 3, 'person', null, 3, { age: 'young', tags: ['every'] }),
  P('every child', '每個孩子', 'sg', 3, 'person', null, 3, { age: 'young', tags: ['every'] }),
];

/** Single names (level 2) and two-name subjects (level 2), built from NAMES. */
export function nameSubject(rng) {
  const g = rng.chance(0.5) ? 'm' : 'f';
  const n = rng.pick(NAMES[g]);
  return P(n, n, 'sg', 3, 'person', g === 'm' ? 'he' : 'she', 2, { tags: ['name'] });
}
export function twoNamesSubject(rng) {
  const a = rng.pick(NAMES.m), b = rng.pick(NAMES.f);
  const [x, y] = rng.chance(0.5) ? [a, b] : [b, a];
  return P(`${x} and ${y}`, `${x} 和 ${y}`, 'pl', 3, 'person', 'they', 2, { tags: ['name'], age: 'young' });
}

// Possessive subjects: "Tom's mother", joint "Tom and Amy's mother" (one mother, shared), separate "Tom's and Amy's mothers" (two).
//   [noun, plural, Chinese, reply pronoun (null = gender unknown, so not used in short answers), kind, extra]
const R = (sg, pl, zh, reply, kind = 'person', extra = {}) => ({ sg, pl, zh, reply, kind, ...extra });
export const RELATIONS = [
  R('mother', 'mothers', '媽媽', 'she', 'person', { age: 'adult' }), R('father', 'fathers', '爸爸', 'he', 'person', { age: 'adult' }),
  R('sister', 'sisters', '姊姊', 'she', 'person', { age: 'young' }), R('brother', 'brothers', '哥哥', 'he', 'person', { age: 'young' }),
  R('grandmother', 'grandmothers', '奶奶', 'she', 'person', { age: 'adult' }), R('grandfather', 'grandfathers', '爺爺', 'he', 'person', { age: 'adult' }),
  R('uncle', 'uncles', '叔叔', 'he', 'person', { age: 'adult' }), R('aunt', 'aunts', '阿姨', 'she', 'person', { age: 'adult' }),
  R('cousin', 'cousins', '表哥', null, 'person', { age: 'young' }), R('friend', 'friends', '朋友', null, 'person', { age: 'young' }),
  R('teacher', 'teachers', '老師', null, 'person', { age: 'adult', tags: ['has-job'] }), R('classmate', 'classmates', '同學', null, 'person', { age: 'young' }),
  R('dog', 'dogs', '狗', 'it', 'animal', { species: 'dog' }), R('cat', 'cats', '貓', 'it', 'animal', { species: 'cat' }),
];
const own = (rng, rel, en, zh, num) => P(en, zh, num, 3, rel.kind, num === 'pl' ? 'they' : rel.reply, 2, { tags: ['poss', ...(rel.tags ?? [])], age: rel.age ?? 'any', species: rel.species });
/** "Tom's mother" */
export function possessiveSubject(rng) {
  const n = rng.pick([...NAMES.m, ...NAMES.f]), rel = rng.pick(RELATIONS);
  return own(rng, rel, `${n}'s ${rel.sg}`, `${n} 的${rel.zh}`, 'sg');
}
/** Joint "Tom and Amy's mother" (one person they share) or separate "Tom's and Amy's mothers" (one each). */
export function jointSubject(rng, separate) {
  const a = rng.pick(NAMES.m), b = rng.pick(NAMES.f);
  const [x, y] = rng.chance(0.5) ? [a, b] : [b, a];
  const rel = rng.pick(RELATIONS.filter((r) => (separate ? r.kind === 'person' : ['mother', 'father', 'grandmother', 'grandfather', 'uncle', 'aunt', 'teacher', 'dog', 'cat'].includes(r.sg))));
  if (separate) return own(rng, rel, `${x}'s and ${y}'s ${rel.pl}`, `${x} 的${rel.zh}和 ${y} 的${rel.zh}`, 'pl');
  return own(rng, rel, `${x} and ${y}'s ${rel.sg}`, `${x} 和 ${y} 的${rel.zh}`, 'sg');
}
/** The name-based subjects added to every pool: three names, and from level 2 a name pair and possessives. */
export function extraSubjects(rng, level) {
  const out = [nameSubject(rng), nameSubject(rng), nameSubject(rng), possessiveSubject(rng)];
  if (level >= 2) out.push(twoNamesSubject(rng), possessiveSubject(rng), jointSubject(rng, false), jointSubject(rng, true));
  return out;
}

// Predicates after a Be verb.
//   type   'adj' | 'job' | 'rel' | 'loc'
//   for    which subject kinds it fits;  age  (jobs) which people;  num  'sg' | 'pl' | undefined (either)
//   dur    'temp' (true at one time: hungry, at home) | 'perm' (lasting: tall, a doctor)
//   zh     { pos: affirmative, neg: negative, q: the bit before 嗎 }
const A = (en, forKinds, dur, pos, neg, q, extra = {}) => ({ type: 'adj', en, for: forKinds, dur, zh: { pos, neg, q }, ...extra });
const L = (en, forKinds, where) => ({ type: 'loc', en, for: forKinds, dur: 'temp', zh: { pos: `在${where}`, neg: `不在${where}`, q: `在${where}` }, where });
const J = (sg, pl, zh, age) => ({ type: 'job', en: sg, pl, for: ['person'], age, dur: 'perm', zh: { pos: `是${zh}`, neg: `不是${zh}`, q: `是${zh}` }, job: zh });

export const PREDICATES = [
  // people, true at one time
  A('hungry', ['person', 'animal'], 'temp', '很餓', '不餓', '餓'),
  A('tired', ['person', 'animal'], 'temp', '很累', '不累', '累'),
  A('busy', ['person'], 'temp', '很忙', '不忙', '忙'),
  A('sick', ['person', 'animal'], 'temp', '生病了', '沒有生病', '生病了'),
  A('angry', ['person'], 'temp', '很生氣', '沒有生氣', '生氣'),
  A('happy', ['person'], 'temp', '很開心', '不開心', '開心'),
  A('sad', ['person'], 'temp', '很難過', '不難過', '難過'),
  A('late', ['person'], 'temp', '遲到了', '沒有遲到', '遲到了'),
  A('thirsty', ['person', 'animal'], 'temp', '很渴', '不渴', '渴'),
  A('sleepy', ['person'], 'temp', '很睏', '不睏', '睏'),
  // people, lasting
  A('tall', ['person'], 'perm', '很高', '不高', '高'),
  A('short', ['person'], 'perm', '很矮', '不矮', '矮'),
  A('kind', ['person'], 'perm', '很親切', '不親切', '親切'),
  A('friendly', ['person', 'animal'], 'perm', '很友善', '不友善', '友善'),
  A('shy', ['person'], 'perm', '很害羞', '不害羞', '害羞'),
  A('smart', ['person', 'animal'], 'perm', '很聰明', '不聰明', '聰明'),
  A('lazy', ['person'], 'perm', '很懶惰', '不懶惰', '懶惰'),
  A('careful', ['person'], 'perm', '很細心', '不細心', '細心'),
  A('strong', ['person'], 'perm', '很強壯', '不強壯', '強壯'),
  // animals
  A('cute', ['animal'], 'perm', '很可愛', '不可愛', '可愛'),
  A('fat', ['animal'], 'perm', '很胖', '不胖', '胖'),
  // things and food
  A('new', ['thing'], 'perm', '很新', '不新', '新'),
  A('old', ['thing'], 'perm', '很舊', '不舊', '舊'),
  A('big', ['thing', 'animal'], 'perm', '很大', '不大', '大'),
  A('small', ['thing', 'animal'], 'perm', '很小', '不小', '小'),
  A('cheap', ['thing'], 'perm', '很便宜', '不便宜', '便宜'),
  A('expensive', ['thing'], 'perm', '很貴', '不貴', '貴'),
  A('heavy', ['thing'], 'perm', '很重', '不重', '重'),
  A('clean', ['thing'], 'temp', '很乾淨', '不乾淨', '乾淨'),
  A('dirty', ['thing'], 'temp', '很髒', '不髒', '髒'),
  A('delicious', ['food'], 'temp', '很好吃', '不好吃', '好吃'),
  A('sweet', ['food'], 'temp', '很甜', '不甜', '甜'),
  A('fresh', ['food', 'drink'], 'temp', '很新鮮', '不新鮮', '新鮮'),
  A('cold', ['drink'], 'temp', '很冰', '不冰', '冰'),
  // weather (subject "it")
  A('cold', ['weather'], 'temp', '很冷', '不冷', '冷'),
  A('hot', ['weather'], 'temp', '很熱', '不熱', '熱'),
  A('warm', ['weather'], 'temp', '很溫暖', '不溫暖', '溫暖'),
  A('cool', ['weather'], 'temp', '很涼爽', '不涼爽', '涼爽'),
  A('sunny', ['weather'], 'temp', '很晴朗', '不晴朗', '晴朗'),
  // jobs
  J('a student', 'students', '學生', 'young'),
  J('a teacher', 'teachers', '老師', 'adult'),
  J('a nurse', 'nurses', '護士', 'adult'),
  J('a doctor', 'doctors', '醫生', 'adult'),
  J('a cook', 'cooks', '廚師', 'adult'),
  J('a farmer', 'farmers', '農夫', 'adult'),
  J('a singer', 'singers', '歌手', 'adult'),
  J('a driver', 'drivers', '司機', 'adult'),
  J('an engineer', 'engineers', '工程師', 'adult'),
  J('a writer', 'writers', '作家', 'adult'),
  J('an artist', 'artists', '藝術家', 'adult'),
  // relations: plural people only
  { type: 'rel', en: 'good friends', for: ['person'], num: 'pl', dur: 'perm', zh: { pos: '是好朋友', neg: '不是好朋友', q: '是好朋友' } },
  { type: 'rel', en: 'classmates', for: ['person'], num: 'pl', age: 'young', dur: 'perm', zh: { pos: '是同學', neg: '不是同學', q: '是同學' } },
  // places: people
  L('at home', ['person', 'animal'], '家'),
  L('at school', ['person'], '學校'),
  L('in the classroom', ['person'], '教室裡'),
  L('in the library', ['person'], '圖書館'),
  L('in the park', ['person', 'animal'], '公園'),
  L('at the zoo', ['person'], '動物園'),
  L('in the kitchen', ['person', 'animal', 'thing', 'food', 'drink'], '廚房'),
  L('in the hospital', ['person'], '醫院'),
  L('at the supermarket', ['person'], '超市'),
  L('on the bus', ['person'], '公車上'),
  L('at the beach', ['person'], '海邊'),
  L('at the station', ['person'], '車站'),
  // places: animals and things
  L('in the garden', ['animal'], '花園裡'),
  L('on the sofa', ['animal', 'thing'], '沙發上'),
  L('under the table', ['animal', 'thing'], '桌子下面'),
  L('in the box', ['animal', 'thing', 'food'], '盒子裡'),
  L('on the desk', ['thing', 'food'], '書桌上'),
  L('under the bed', ['thing'], '床底下'),
  L('in my bag', ['thing', 'food'], '我的袋子裡'),
  L('on the table', ['thing', 'food', 'drink'], '桌子上'),
  L('in the closet', ['thing'], '衣櫥裡'),
  L('in the refrigerator', ['food', 'drink'], '冰箱裡'),
];

// Time words. Every sheet that mixes tenses puts one of these in every question, so the tense has one answer.
//   tense 'pres' | 'past'     dur  which predicates it suits     types  only these predicate types     weather  also suits weather
export const TIMES = [
  { en: 'now', zh: '現在', tense: 'pres', dur: ['temp', 'perm'], weather: true },
  { en: 'right now', zh: '現在', tense: 'pres', dur: ['temp'], weather: true },
  { en: 'this year', zh: '今年', tense: 'pres', dur: ['perm'], types: ['job'] },
  { en: 'yesterday', zh: '昨天', tense: 'past', dur: ['temp'], weather: true },
  { en: 'last night', zh: '昨晚', tense: 'past', dur: ['temp'], weather: true },
  { en: 'yesterday morning', zh: '昨天早上', tense: 'past', dur: ['temp'], weather: true },
  { en: 'last Sunday', zh: '上星期天', tense: 'past', dur: ['temp'], weather: true },
  { en: 'last weekend', zh: '上週末', tense: 'past', dur: ['temp'], weather: true },
  { en: 'two days ago', zh: '兩天前', tense: 'past', dur: ['temp'], weather: true },
  { en: 'last year', zh: '去年', tense: 'past', dur: ['perm'] },
  { en: 'two years ago', zh: '兩年前', tense: 'past', dur: ['perm'] },
  { en: 'ten years ago', zh: '十年前', tense: 'past', dur: ['perm'] },
];

/** Function words the 2000-word list leaves out; the worksheets may use these freely. */
export const FUNCTION_WORDS = [
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'a', 'an', 'the', 'be', 'am', 'is', 'are', 'was', 'were', 'not', "isn't", "aren't", "wasn't", "weren't",
  'do', 'does', 'did', 'have', 'has', 'had', 'and', 'at', 'mr', 'ms', 'mrs',
  'much', "o'clock", 'going', 'better', 'best', 'worse', 'worst', "won't", 'must', "mustn't", 'than', 'would', "haven't", "hasn't", // not in the 2000-word list as written: much is missing, o’clock is listed with a curly quote
  "let's", "it's", "they're", 'doing', "don't", "doesn't", "didn't", 'could', "can't", 'cannot', "couldn't",
];
