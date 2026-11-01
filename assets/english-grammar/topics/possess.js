// Topic: possessives — Tom's bag, the students' books, the children's toys, the door of the room; Tom and Amy's (shared) vs Tom's and Amy's (separate).
import { blank, cap, zhJoin } from '../core.js';
import { NAMES } from '../lexicon.js';

// Owners: [owner, Chinese, possessive form, rule 's' | "s'" | "irr's"]
const OWNERS = [
  ...NAMES.m.slice(0, 10).map((n) => [n, n, `${n}'s`, 's']), ...NAMES.f.slice(0, 10).map((n) => [n, n, `${n}'s`, 's']),
  ['my father', '我爸爸', "my father's", 's'], ['my sister', '我姊姊', "my sister's", 's'], ['the teacher', '老師', "the teacher's", 's'], ['the dog', '那隻狗', "the dog's", 's'], ['the girl', '那個女孩', "the girl's", 's'],
  ['the students', '學生們', "the students'", "s'"], ['my parents', '我父母', "my parents'", "s'"], ['the girls', '那些女孩', "the girls'", "s'"], ['the teachers', '老師們', "the teachers'", "s'"], ['the boys', '那些男孩', "the boys'", "s'"],
  ['the children', '孩子們', "the children's", "irr's"], ['the women', '那些女人', "the women's", "irr's"], ['the men', '那些男人', "the men's", "irr's"], ['the people', '那些人', "the people's", "irr's"],
];
const THINGS = [['bag', '袋子'], ['book', '書'], ['room', '房間'], ['bicycle', '腳踏車'], ['teacher', '老師'], ['house', '房子'], ['car', '車'], ['dog', '狗'], ['names', '名字'], ['classroom', '教室'], ['mother', '媽媽'], ['friend', '朋友'], ['toys', '玩具'], ['desks', '書桌']];
const PLURAL_THINGS = new Set(['names', 'toys', 'desks']);
const BIG = new Set(['car', 'house']);
const fitsThing = ([owner, , , rule], [thing]) => !(PLURAL_THINGS.has(thing) && rule === 's') && !(BIG.has(thing) && rule !== 's' && owner !== 'my parents') && !(owner === 'the dog' && !['toys', 'house', 'friend', 'names'].includes(thing)) && !(thing === 'teacher' && /teacher/.test(owner)) && !(thing === 'dog' && owner === 'the dog') && !(thing === 'mother' && /father|sister|parents|the dog/.test(owner));
// Of-phrases for things: [whole, Chinese, part, Chinese]
// [whole, Chinese, part, Chinese, kind: 'thing' (something to look at) | 'fact' (something to know or ask)]
const OF = [['room', '房間', 'door', '門', 'thing'], ['house', '房子', 'roof', '屋頂', 'thing'], ['book', '書', 'name', '書名', 'fact'], ['table', '桌子', 'legs', '桌腳', 'thing'], ['story', '故事', 'end', '結局', 'fact'],
  ['mountain', '山', 'top', '山頂', 'thing'], ['city', '城市', 'center', '市中心', 'thing'], ['car', '車', 'color', '顏色', 'fact'], ['box', '盒子', 'cover', '蓋子', 'thing'], ['class', '班級', 'leader', '班長', 'fact'], ['movie', '電影', 'name', '片名', 'fact'], ['school', '學校', 'gate', '大門', 'thing']];
const spaced = (s) => s.replace(/([A-Za-z'])([\u4e00-\u9fff，。？])/g, '$1 $2').replace(/([\u4e00-\u9fff，])([A-Za-z])/g, '$1 $2');
const NEW_OK = new Set(['bag', 'book', 'room', 'bicycle', 'house', 'car', 'classroom', 'toys', 'desks']);
const FRAMES = [['This is {P} {T}.', '這是{P}的{T}。'], ['Is that {P} {T}?', '那是{P}的{T}嗎？'], ['I like {P} {T}.', '我喜歡{P}的{T}。'], ['Where is {P} {T}?', '{P}的{T}在哪裡？'], ['{P} {T} is new.', '{P}的{T}是新的。']];
const PL_FRAMES = [['These are {P} {T}.', '這些是{P}的{T}。'], ['Where are {P} {T}?', '{P}的{T}在哪裡？'], ['I like {P} {T}.', '我喜歡{P}的{T}。'], ['{P} {T} are new.', '{P}的{T}是新的。']];
const RULES = { 1: ['s'], 2: ['s', "s'"], 3: ['s', "s'", "irr's"] };

const MODES = [
  {
    id: 's', name: "所有格 's / s'", instruction: () => "依括號裡的名詞填入所有格：單數加 's，複數字尾 s 只加 '，不規則複數加 's。",
    gen(rng, o) {
      const ow = rng.fresh(OWNERS.filter((x) => RULES[o.level].includes(x[3])), (x) => x[0]);
      const th = rng.fresh(THINGS.filter((t) => fitsThing(ow, t)), (x) => 'th-' + x[0]);
      const plural = PLURAL_THINGS.has(th[0]);
      const [en, zh] = rng.pick((plural ? PL_FRAMES : FRAMES).filter((f) => !f[0].includes('new') || NEW_OK.has(th[0])));
      const [l, r] = en.split('{P}');
      const possStart = l === '';
      const poss = possStart ? cap(ow[2]) : ow[2];
      return { lines: [[l, blank(poss, poss.includes(' ')), ` (${ow[0]})${r.replace('{T}', th[0])}`]], zh: spaced(zh.replace('{P}', ow[1]).replace('{T}', th[1])), meta: { kind: 's', owner: ow[0], rule: ow[3] } };
    },
  },
  {
    id: 'of', name: '事物用 of', instruction: () => '事物的「…的」多用 of：依中文把兩個名詞和 of 依正確順序填入（一個空格填一個字）。',
    gen(rng) {
      const [whole, wz, part, pz, kind] = rng.fresh(OF, (x) => x[0]);
      const shapes = kind === 'thing' ? [['Look at the {X}.', '看看{Z}。'], ['The {X} is beautiful.', '{Z}很漂亮。'], ['The {X} is very old.', '{Z}很舊。']] : [['Do you know the {X}?', '你知道{Z}嗎？'], ['What is the {X}?', '{Z}是什麼？'], ['I like the {X}.', '我喜歡{Z}。']];
      const [en, zh] = rng.pick(shapes);
      const [l, r] = en.split('{X}');
      return { lines: [[l, blank(part), ' ', blank('of'), ' the ', blank(whole), `${r} (${rng.chance(0.5) ? `${part}／${whole}` : `${whole}／${part}`})`]], zh: zh.replace('{Z}', `${wz}的${pz}`), meta: { kind: 'of', part, whole } };
    },
  },
  {
    id: 'joint', name: '共同所有與分別所有', instruction: () => "兩人共有一樣東西：Tom and Amy's；各有各的：Tom's and Amy's。依中文填入（一個空格填一個字）。",
    gen(rng) {
      const a = rng.pick(NAMES.m), b = rng.pick(NAMES.f);
      const shared = rng.fresh([true, false], (x) => 'joint-' + x);
      // shared: things two people can own together (a room, a dog), not 共同的爸爸; separate: each has one
      const items = shared ? [['room', '房間'], ['dog', '狗'], ['cat', '貓'], ['house', '房子'], ['car', '車'], ['teacher', '老師'], ['computer', '電腦']]
        : [['mother', '媽媽', 'mothers'], ['father', '爸爸', 'fathers'], ['room', '房間', 'rooms'], ['bicycle', '腳踏車', 'bicycles'], ['school', '學校', 'schools'], ['bag', '袋子', 'bags']];
      const item = rng.fresh(items, (x) => `j-${shared}-${x[0]}`);
      if (shared) return { lines: [[`This is `, blank(a), ' ', blank('and'), ' ', blank(`${b}'s`), ` ${item[0]}.`]], zh: `這是 ${a} 和 ${b} 共同的${item[1]}。`, meta: { kind: 'joint', shared: true, a, b } };
      return { lines: [[`These are `, blank(`${a}'s`), ' ', blank('and'), ' ', blank(`${b}'s`), ` ${item[2]}.`]], zh: `這些是 ${a} 的${item[1]}和 ${b} 的${item[1]}。`, meta: { kind: 'joint', shared: false, a, b } };
    },
  },
];

export default {
  id: 'possess',
  code: 'POS',
  title: "所有格 's / of",
  grade: 7,
  past: false,
  zhRequired: true, // shared vs separate ownership is told by the Chinese line
  variety: false, // fixed sentence frames; checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { of: OF.length * 3 },
  defaultModes: { 1: ['s'], 2: ['s', 'of'], 3: ['s', 'of', 'joint'] },
  levelHint: { 1: "單數名詞加 's。", 2: "加入複數 s'，以及事物用 of。", 3: "再加入不規則複數 children's，以及共同所有與分別所有。" },
  grammarBox: (o) => ({ head: ['情況', '寫法', '例子'], rows: [
    ["單數名詞", "加 's", "Tom's bag、the teacher's car"],
    ...(o.level >= 2 ? [["複數名詞（字尾 s）", "只加 '", "the students' books"], ['事物', 'of', 'the door of the room']] : []),
    ...(o.level >= 3 ? [["不規則複數", "加 's", "the children's toys"], ['共同所有／分別所有', "A and B's / A's and B's", "Tom and Amy's mother（同一個）/ Tom's and Amy's mothers（各自的）"]] : []),
  ], note: "人和動物多用 's，事物多用 of。" }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
