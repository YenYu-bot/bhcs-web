// Topic: articles — a / an (by the sound of the next word), the, and no article (written ×).
import { blank, cap, zhJoin } from '../core.js';
import { pickPerson, verbFor } from '../people.js';

const NONE = '×'; // the answer when no article is needed
// [word, Chinese, measure word, kind]; an is decided by the first SOUND, so hour / honest take an and uniform / useful take a.
const W = (en, zh, m, kind, lvl = 1) => ({ en, zh, m, kind, lvl });
const NOUNS = [
  W('apple', '蘋果', '個', 'food'), W('egg', '蛋', '顆', 'food'), W('orange', '柳橙', '個', 'food'), W('onion', '洋蔥', '顆', 'food'),
  W('banana', '香蕉', '根', 'food'), W('cake', '蛋糕', '個', 'food'), W('sandwich', '三明治', '個', 'food'), W('hamburger', '漢堡', '個', 'food'),
  W('umbrella', '雨傘', '把', 'thing'), W('eraser', '橡皮擦', '個', 'thing'), W('album', '相簿', '本', 'thing'), W('book', '書', '本', 'thing'),
  W('pen', '筆', '枝', 'thing'), W('bag', '袋子', '個', 'thing'), W('box', '盒子', '個', 'thing'), W('watch', '手錶', '支', 'thing'), W('ball', '球', '顆', 'thing'),
  W('elephant', '大象', '隻', 'animal'), W('ant', '螞蟻', '隻', 'animal'), W('eagle', '老鷹', '隻', 'animal'), W('cat', '貓', '隻', 'animal'),
  W('dog', '狗', '隻', 'animal'), W('rabbit', '兔子', '隻', 'animal'), W('bird', '鳥', '隻', 'animal'),
  W('idea', '主意', '個', 'idea'), W('question', '問題', '個', 'idea'),
  // first sound differs from the first letter
  W('hour', '小時', '個', 'time', 2), W('uniform', '制服', '件', 'thing', 2),
];
const JOBS = [
  W('teacher', '老師', '位', 'job'), W('doctor', '醫生', '位', 'job'), W('nurse', '護理師', '位', 'job'), W('cook', '廚師', '位', 'job'),
  W('farmer', '農夫', '位', 'job'), W('singer', '歌手', '位', 'job'), W('engineer', '工程師', '位', 'job'), W('artist', '藝術家', '位', 'job'),
  W('actor', '演員', '位', 'job'), W('officer', '警官', '位', 'job'), W('student', '學生', '位', 'job'),
];
// adjective + noun (level 2): the adjective decides
const ADJ = [
  ['old', '舊的'], ['easy', '簡單的'], ['interesting', '有趣的'], ['honest', '誠實的'], ['useful', '有用的'], ['ugly', '醜的'],
  ['big', '大的'], ['new', '新的'], ['small', '小的'], ['good', '好的'], ['red', '紅色的'], ['beautiful', '漂亮的'],
];
const ADJ_NOUN = { old: ['book', 'watch', 'bag', 'album'], easy: ['question'], interesting: ['book', 'idea', 'album'], honest: ['boy', 'girl'], useful: ['book', 'idea', 'bag'],
  ugly: ['bag', 'dog', 'cat'], big: ['apple', 'box', 'elephant', 'dog'], new: ['umbrella', 'watch', 'eraser', 'uniform'], small: ['egg', 'ant', 'box', 'bird'],
  good: ['idea', 'book', 'doctor', 'singer'], red: ['apple', 'umbrella', 'ball', 'bag'], beautiful: ['bird', 'album', 'umbrella'] };
const EXTRA = { boy: W('boy', '男孩', '個', 'person'), girl: W('girl', '女孩', '個', 'person') };
const find = (en) => NOUNS.find((n) => n.en === en) ?? JOBS.find((n) => n.en === en) ?? EXTRA[en];
// a / an by the first sound
const SOUNDS_VOWEL = new Set(['hour', 'honest']), SOUNDS_YOU = new Set(['uniform', 'useful', 'university']);
export const aOrAn = (w) => (SOUNDS_VOWEL.has(w) ? 'an' : SOUNDS_YOU.has(w) ? 'a' : /^[aeiou]/.test(w) ? 'an' : 'a');

// Sentences around "a/an + noun"; {A} is the blank, {N} the noun (with its adjective).
const FRAMES = {
  food: [['I want {A} {N}.', '我想要一{m}{z}。'], ['There is {A} {N} on the table.', '桌子上有一{m}{z}。'], ['Please give me {A} {N}.', '請給我一{m}{z}。']],
  thing: [['I have {A} {N}.', '我有一{m}{z}。'], ['This is {A} {N}.', '這是一{m}{z}。'], ['{S} {has} {A} {N}.', '{s}有一{m}{z}。'], ['There is {A} {N} in the box.', '盒子裡有一{m}{z}。']],
  animal: [['I can see {A} {N}.', '我看得到一{m}{z}。'], ['That is {A} {N}.', '那是一{m}{z}。']],
  idea: [['{S} {has} {A} {N}.', '{s}有一{m}{z}。']],
  time: [['I waited for {A} {N}.', '我等了一{m}{z}。'], ['The class is {A} {N} long.', '這堂課有一{m}{z}長。']],
  job: [['{S} {is} {A} {N}.', '{s}是一{m}{z}。']],
  person: [['{S} {is} {A} {N}.', '{s}是一{m}{z}。']],
};
const VERBS = { has: ['have', 'has'], is: ['am', 'is'] };
function fill(tpl, p, word, n, z, m) {
  return tpl.replace('{S}', p?.en ?? '').replace(/\{(has|is)\}/, (_, v) => (p.en === 'I' ? VERBS[v][0] : p.pr === 'we' || p.pr === 'they' || p.pr === 'you' ? (v === 'is' ? 'are' : VERBS[v][0]) : VERBS[v][1]))
    .replace('{s}', p?.zh ?? '').replace('{m}', m).replace('{z}', z).replace('{N}', n);
}
function aan(rng, o) {
  const adj = o.level >= 2 && rng.chance(0.4) ? rng.fresh(ADJ, (x) => x[0]) : null;
  let noun;
  if (adj) noun = find(rng.pick(ADJ_NOUN[adj[0]]));
  else noun = rng.fresh([...NOUNS, ...JOBS].filter((n) => n.lvl <= o.level), (n) => n.en);
  const tpls = FRAMES[noun.kind];
  const [en, zh] = rng.pick(tpls);
  // jobs and "is a boy" need a single person; plural people take "are" which cannot have a/an
  // "is a/an …" needs one person (and a girl is a she); plural people take "are", which cannot have a/an
  const p = /\{S\}/.test(en) ? pickPerson(rng, (x) => (/\{is\}/.test(en) ? !['we', 'they', 'you'].includes(x.pr) && (noun.en !== 'girl' || x.pr === 'she') && (noun.en !== 'boy' || x.pr === 'he') && (noun.en !== 'girl' && noun.en !== 'boy' || x.pr !== 'I') : true)) : null;
  const n = adj ? `${adj[0]} ${noun.en}` : noun.en;
  const z = adj ? adj[1] + noun.zh : noun.zh;
  const word = adj ? adj[0] : noun.en;
  const a = aOrAn(word);
  const text = fill(en, p, word, n, z, noun.m);
  const [l, r] = text.split('{A}');
  const zt = fill(zh.replace('{s}', ''), p, word, n, z, noun.m);
  return { lines: [[l, blank(l === '' ? cap(a) : a), r]], zh: zh.startsWith('{s}') ? zhJoin(p.zh, zt) : zt, meta: { kind: 'aan', word } };
}

// the / no article: set expressions taught in junior high.
//   [phrase with {A}, Chinese, answer, rule]
const SET = [
  ['play {A} piano', '彈鋼琴', 'the', 'instrument'], ['play {A} violin', '拉小提琴', 'the', 'instrument'], ['play {A} guitar', '彈吉他', 'the', 'instrument'], ['play {A} drums', '打鼓', 'the', 'instrument'],
  ['play {A} basketball', '打籃球', NONE, 'sport'], ['play {A} baseball', '打棒球', NONE, 'sport'], ['play {A} soccer', '踢足球', NONE, 'sport'], ['play {A} tennis', '打網球', NONE, 'sport'],
  ['play {A} volleyball', '打排球', NONE, 'sport'], ['play {A} badminton', '打羽毛球', NONE, 'sport'],
  ['have {A} breakfast', '吃早餐', NONE, 'meal'], ['have {A} lunch', '吃午餐', NONE, 'meal'], ['have {A} dinner', '吃晚餐', NONE, 'meal'],
  ['go to {A} school', '上學', NONE, 'place-use'], ['go to {A} bed', '上床睡覺', NONE, 'place-use'],
  ['go to school by {A} bus', '搭公車上學', NONE, 'by'], ['go to school by {A} bicycle', '騎腳踏車上學', NONE, 'by'], ['go to work by {A} train', '搭火車上班', NONE, 'by'],
  ['go to {A} park', '去公園', 'the', 'place'], ['go to {A} zoo', '去動物園', 'the', 'place'], ['go to {A} library', '去圖書館', 'the', 'place'], ['go to {A} supermarket', '去超市', 'the', 'place'],
  ['look at {A} moon', '看月亮', 'the', 'one'], ['look at {A} sky', '看天空', 'the', 'one'], ['look at {A} stars', '看星星', 'the', 'one'],
  ['listen to {A} music', '聽音樂', NONE, 'subject'], ['study {A} science', '讀自然', NONE, 'subject'], ['learn {A} art', '學美術', NONE, 'subject'], ['study {A} history', '讀歷史', NONE, 'subject'],
];
const WHEN = [['every day', '每天'], ['after school', '放學後'], ['on weekends', '週末'], ['at night', '晚上'], ['every evening', '每天傍晚'], ['in the morning', '早上']];
const FITS = { 'go to {A} bed': ['every day', 'at night'], 'look at {A} moon': ['at night'], 'look at {A} stars': ['at night'], 'look at {A} sky': ['in the morning', 'every evening', 'at night'],
  'have {A} breakfast': ['every day', 'in the morning'], 'have {A} lunch': ['every day', 'on weekends'], 'have {A} dinner': ['every evening', 'every day'],
  'go to {A} school': ['every day', 'in the morning'], 'go to school by {A} bus': ['every day', 'in the morning'], 'go to school by {A} bicycle': ['every day'], 'go to work by {A} train': ['every day', 'in the morning'] };
function setPhrase(rng, o) {
  const [ph, pz, ans, rule] = rng.fresh(SET, (x) => x[0]);
  const p = pickPerson(rng, (x) => (ph.includes('school') ? x.en !== 'Our teacher' : true) && (ph.includes('work') ? ['My father', 'My mother', 'My parents', 'Our teacher'].includes(x.en) : true));
  const whens = WHEN.filter((w) => (FITS[ph] ? FITS[ph].includes(w[0]) : !['at night', 'in the morning'].includes(w[0])));
  const [w, wz] = rng.pick(whens);
  const verb = ph.split(' ')[0];
  const forms = { play: ['play', 'plays'], have: ['have', 'has'], go: ['go', 'goes'], look: ['look', 'looks'], listen: ['listen', 'listens'], study: ['study', 'studies'], learn: ['learn', 'learns'] }[verb];
  const rest = ph.slice(verb.length);
  const [l, r] = `${p.en} ${verbFor(p, forms)}${rest} ${w}.`.split('{A}');
  return { lines: [[l, blank(ans), r]], zh: zhJoin(p.zh, wz, pz) + '。', meta: { kind: 'set', phrase: ph, rule } };
}

// Level 3: a / an first, the when the same thing comes up again.
const AGAIN = [
  ['I have {A} {N}. {B} {N} is {adj}.', '我有一{m}{z}。那{m}{z}很{az}。'],
  ['There is {A} {N} on the desk. {B} {N} is {adj}.', '書桌上有一{m}{z}。那{m}{z}很{az}。'],
  ['{S} bought {A} {N} yesterday. {B} {N} is {adj}.', '{s}昨天買了一{m}{z}。那{m}{z}很{az}。'],
];
const LOOKS = [['new', '新'], ['old', '舊'], ['big', '大'], ['small', '小'], ['beautiful', '漂亮'], ['cute', '可愛']];
const LOOK_FOR = { thing: ['new', 'old', 'big', 'small', 'beautiful'], animal: ['big', 'small', 'cute'], food: ['big', 'small'] };
const PETS = ['cat', 'dog', 'rabbit', 'bird'];
function again(rng, o) {
  if (rng.chance(0.3)) {
    // two set phrases in one sentence: "plays the piano and ... plays basketball"
    const ins = rng.pick(SET.filter((x) => x[3] === 'instrument')), sp = rng.pick(SET.filter((x) => x[3] === 'sport'));
    const [a, b] = rng.chance(0.5) ? [ins, sp] : [sp, ins];
    const p = pickPerson(rng, (x) => x.s3);
    const [l, m1] = `${p.en} ${a[0].replace('play', 'plays')}`.split('{A}');
    const [m2, r] = ` and ${b[0].replace('play', 'plays')} on weekends.`.split('{A}');
    return { lines: [[l, blank(a[2]), m1 + m2, blank(b[2]), r]], zh: zhJoin(p.zh, `週末${a[1]}，也${b[1]}`) + '。', meta: { kind: 'pair', answers: [a[2], b[2]] } };
  }
  const noun = rng.fresh(NOUNS.filter((n) => LOOK_FOR[n.kind] && n.lvl <= o.level && (n.kind !== 'animal' || PETS.includes(n.en))), (n) => n.en);
  const [en, zh] = rng.pick(AGAIN);
  const [adj, az] = rng.pick(LOOKS.filter((x) => LOOK_FOR[noun.kind].includes(x[0])));
  const p = /\{S\}/.test(en) ? pickPerson(rng) : null;
  const text = en.replace('{S}', p?.en ?? '').replaceAll('{N}', noun.en).replace('{adj}', adj);
  const [l, rest] = text.split('{A}');
  const [m, r] = rest.split('{B}');
  return {
    lines: [[l, blank(aOrAn(noun.en)), m, blank('The'), r]],
    zh: zhJoin(p ? p.zh : '', zh.replace('{s}', '').replaceAll('{m}', noun.m).replaceAll('{z}', noun.zh).replace('{az}', az)),
    meta: { kind: 'again', word: noun.en },
  };
}

const MODES = [
  { id: 'aan', name: 'a 或 an', instruction: () => '填入 a 或 an（看後面那個字的第一個「音」）。', gen: aan },
  { id: 'the', name: 'the 或不加', instruction: () => '填入 the；不需要冠詞的填 ×。', gen: setPhrase },
  { id: 'again', name: '第一次提到與再次提到', instruction: () => '填入 a、an、the，或不需要冠詞的填 ×。', gen: again },
];

export default {
  id: 'article',
  code: 'ART',
  title: '冠詞 a / an / the',
  grade: 7,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules, not by the subject/verb spread test
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['aan'], 2: ['aan', 'the'], 3: ['aan', 'the', 'again'] },
  levelHint: { 1: '依第一個字母判斷 a / an。', 2: '加入形容詞、hour / uniform 等特殊發音，以及 the 和不加冠詞的固定用法。', 3: '再加入「第一次提到用 a / an，再次提到用 the」。' },
  grammarBox: (o) => ({ head: ['用法', '例子'], rows: [
    ['子音開頭用 a', 'a book、a uniform'], ['母音開頭用 an', 'an apple、an hour'],
    ...(o.level >= 2 ? [['樂器、獨一無二的東西用 the', 'play the piano、the moon'], ['球類、三餐、科目、by + 交通工具不加', 'play basketball、have lunch、by bus']] : []),
    ...(o.level >= 3 ? [['再次提到同一個東西用 the', 'I have a dog. The dog is cute.']] : []),
  ], note: 'a / an 看的是「發音」，不是字母：hour 的 h 不發音所以用 an，uniform 的 u 念 you 所以用 a。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
