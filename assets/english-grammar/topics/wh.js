// Topic: question words — what, who, where, how old, how many (level 1); when, what time, why, how, whose, how much, what color (level 2);
// question word + do / does / did / is (level 3). The answer after "—" decides the word, and the number of blanks tells one word from two.
import { blank, cap, zhJoin } from '../core.js';
import { NAMES } from '../lexicon.js';
import { pickAskedPerson, midOf } from '../people.js';

const THINGS = [['book', '書', '本'], ['pen', '筆', '枝'], ['bag', '袋子', '個'], ['watch', '手錶', '支'], ['umbrella', '雨傘', '把'], ['cup', '杯子', '個'],
  ['hat', '帽子', '頂'], ['jacket', '夾克', '件'], ['dictionary', '字典', '本'], ['ball', '球', '顆'], ['box', '盒子', '個'], ['key', '鑰匙', '把']];
const THINGS_PL = [['books', '書', '本'], ['pens', '筆', '枝'], ['shoes', '鞋子', '雙'], ['keys', '鑰匙', '把'], ['cups', '杯子', '個'], ['balls', '球', '顆']];
const OWNERS = [['my', '我的'], ['your', '你的'], ['his', '他的'], ['her', '她的'], ['the', '那']];
const PLACES = [['on the desk', '在書桌上'], ['in the box', '在盒子裡'], ['under the bed', '在床底下'], ['in your bag', '在你的袋子裡'], ['on the sofa', '在沙發上'], ['in the kitchen', '在廚房裡'], ['behind the door', '在門後面']];
const RELS = { he: [['brother', '哥哥'], ['father', '爸爸'], ['uncle', '叔叔'], ['cousin', '堂哥'], ['classmate', '同學'], ['friend', '朋友'], ['teacher', '老師']],
  she: [['sister', '姊姊'], ['mother', '媽媽'], ['aunt', '阿姨'], ['cousin', '表姊'], ['classmate', '同學'], ['friend', '朋友'], ['teacher', '老師']] };
const WHO = { he: [['boy', '男孩'], ['man', '男士']], she: [['girl', '女孩'], ['woman', '女士']] };
const NUM = [['two', '兩'], ['three', '三'], ['four', '四'], ['five', '五'], ['six', '六'], ['seven', '七'], ['eight', '八'], ['nine', '九'], ['ten', '十'], ['eleven', '十一'], ['twelve', '十二']];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COLORS = ['red', 'blue', 'black', 'white', 'green', 'yellow'];
const HE_SHE = { he: 'He', she: 'She' };
const B = (ws) => ws.map((w) => blank(w));
const q = (words, rest, reply, zh, meta) => ({ lines: [[...B(words).flatMap((b, i) => (i ? [' ', b] : [b])), `${rest} — ${reply}`]], zh, meta });

const BASIC = [
  (rng) => { const [n, z, m] = rng.fresh(THINGS, (x) => x[0]); const [d, dz] = rng.pick([['this', '這'], ['that', '那']]);
    return q(['What'], ` is ${d}?`, `It's ${/^[aeiou]/.test(n) ? 'an' : 'a'} ${n}.`, `${dz}是什麼？`, { type: 'thing', reply: n }); },
  (rng) => { const g = rng.pick(['he', 'she']); const name = rng.pick(NAMES[g === 'he' ? 'm' : 'f']); const [o, oz] = rng.pick([['your', '你'], [g === 'he' ? 'his' : 'her', g === 'he' ? '他' : '她']]);
    return q(['What'], ` is ${o} name?`, `${o === 'your' ? 'My' : cap(o)} name is ${name}.`, `${oz}叫什麼名字？`, { type: 'name' }); },
  (rng) => { const g = rng.pick(['he', 'she']); const [w, wz] = rng.pick(WHO[g]);
    // a girl is a sister or classmate, a woman a mother, aunt or teacher
    const young = ['boy', 'girl'].includes(w), fits = (x) => (young ? ['brother', 'sister', 'cousin', 'classmate', 'friend'] : ['father', 'mother', 'uncle', 'aunt', 'teacher', 'cousin', 'friend']).includes(x[0]);
    const [r, rz] = rng.fresh(RELS[g].filter(fits), (x) => x[0]);
    return q(['Who'], ` is that ${w}?`, `${HE_SHE[g]} is my ${r}.`, `那個${wz}是誰？`, { type: 'person' }); },
  (rng) => { const [n, z, m] = rng.fresh(THINGS, (x) => x[0]); const [o, oz] = rng.pick(OWNERS); const [p] = rng.pick(PLACES.filter((x) => !(o === 'your' && x[0] === 'in your bag')));
    return q(['Where'], ` is ${o} ${n}?`, `It's ${p}.`, `${o === 'the' ? '那' + m : oz}${z}在哪裡？`, { type: 'place' }); },
  (rng) => { const [n, z] = rng.fresh(THINGS_PL, (x) => x[0]); const [p] = rng.pick(PLACES);
    return q(['Where'], ` are the ${n}?`, `They're ${p}.`, `那些${z}在哪裡？`, { type: 'place' }); },
  (rng) => { const g = rng.pick(['he', 'she']); const [r, rz] = rng.fresh(RELS[g].filter((x) => !['teacher', 'father', 'mother', 'uncle', 'aunt'].includes(x[0])), (x) => x[0]); const [nm] = rng.pick(NUM.slice(4));
    return q(['How', 'old'], ` is your ${r}?`, `${HE_SHE[g]} is ${nm} years old.`, `你的${rz}幾歲？`, { type: 'age' }); },
  (rng) => { const [n, z, m] = rng.fresh(THINGS_PL, (x) => x[0]); const [nm] = rng.pick(NUM);
    return q(['How', 'many'], ` ${n} do you have?`, `I have ${nm}.`, `你有幾${m}${z}？`, { type: 'count' }); },
];
const MORE = [
  (rng) => { const m = rng.pick(MONTHS); const [o, oz, ro] = rng.pick([['your', '你的', 'My'], ['his', '他的', 'His'], ['her', '她的', 'Her']]);
    return q(['When'], ` is ${o} birthday?`, `${ro} birthday is in ${m}.`, `${oz}生日是什麼時候？`, { type: 'date' }); },
  (rng) => { const [nm] = rng.pick(NUM.slice(4)); return rng.chance(0.5)
    ? q(['What', 'time'], ' is it?', `It's ${nm} o'clock.`, '現在幾點？', { type: 'clock' })
    : q(['What', 'time'], ` do you ${rng.pick(['get up', 'go to bed', 'have dinner', 'go to school'])}?`, `At ${nm}.`, '', { type: 'clock' }); },
  (rng) => { const [adj, az, why] = rng.fresh([['happy', '開心', 'today is my birthday'], ['sad', '難過', 'my dog is sick'], ['tired', '累', 'I worked all day'], ['hungry', '餓', "I didn't have breakfast"], ['late', '遲到', 'I missed the bus'], ['angry', '生氣', 'my brother broke my cup']], (x) => x[0]);
    return q(['Why'], ` are you ${adj}?`, `Because ${why}.`, `你為什麼${az}？`, { type: 'reason' }); },
  (rng) => { const [w, wz] = rng.pick([['By bus.', '搭公車'], ['On foot.', '走路'], ['By bicycle.', '騎腳踏車'], ['By train.', '搭火車']]); const [o, oz] = rng.pick([['you', '你'], ['your sister', '你姊姊'], ['they', '他們']]);
    return q(['How'], ` ${o === 'your sister' ? 'does' : 'do'} ${o} go to school?`, w, `${oz}怎麼去上學？`, { type: 'way' }); },
  (rng) => { const [n, z, m] = rng.fresh(THINGS, (x) => x[0]); const name = rng.pick([...NAMES.m, ...NAMES.f]); const [d, dz] = rng.pick([['this', '這'], ['that', '那']]);
    return q(['Whose'], ` ${n} is ${d}?`, `It's ${name}'s.`, `${dz}是誰的${z}？`, { type: 'owner' }); },
  (rng) => { const [n, z, m] = rng.fresh(THINGS.filter((x) => x[0] !== 'key'), (x) => x[0]);
    const nm = ['pen', 'cup', 'ball'].includes(n) ? rng.pick(['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'eighty']) : `${rng.pick(['two', 'three', 'four', 'five', 'six'])} hundred`;
    return q(['How', 'much'], ` is this ${n}?`, `It's ${nm} dollars.`, `這${m}${z}多少錢？`, { type: 'price' }); },
  (rng) => { const [n, z] = rng.fresh(THINGS, (x) => x[0]); const [o, oz] = rng.pick([['your', '你的'], ['his', '他的'], ['her', '她的']]);
    return q(['What', 'color'], ` is ${o} ${n}?`, `It's ${rng.pick(COLORS)}.`, `${oz}${z}是什麼顏色？`, { type: 'color' }); },
];
// Fill in the zh for "What time do you …?" from the activity.
const TIME_ZH = { 'get up': '起床', 'go to bed': '睡覺', 'have dinner': '吃晚餐', 'go to school': '上學' };
function fixClock(it) {
  const m = /do you (get up|go to bed|have dinner|go to school)\?/.exec(it.lines[0].at(-1));
  if (m && it.meta.type === 'clock') it.zh = `你幾點${TIME_ZH[m[1]]}？`;
  return it;
}

// Level 3: question word + helper verb, from an answer about someone.
const ASK = [
  // [question word, tense, verb phrase, Chinese question, answer builder]
  { wh: 'Where', t: 'pres', vp: 'live', zh: '住在哪裡', ans: (p) => `${p.reply} ${p.s3 ? 'lives' : 'live'} near the ${['school', 'park', 'station', 'library'][p.k % 4]}.` },
  { wh: 'When', t: 'pres', vp: 'play basketball', zh: '什麼時候打籃球', ans: (p) => `${p.reply} ${p.s3 ? 'plays' : 'play'} basketball ${['after school', 'on Sundays', 'on weekends'][p.k % 3]}.` },
  { wh: 'How', t: 'pres', vp: 'go to school', zh: '怎麼去上學', ans: (p) => `${p.reply} ${p.s3 ? 'goes' : 'go'} to school ${['by bus', 'on foot', 'by bicycle'][p.k % 3]}.` },
  { wh: 'What', t: 'pres', vp: 'like to eat', zh: '喜歡吃什麼', ans: (p) => `${p.reply} ${p.s3 ? 'likes' : 'like'} to eat ${['noodles', 'hamburgers', 'fish', 'rice'][p.k % 4]}.` },
  { wh: 'Where', t: 'past', vp: 'go yesterday', zh: '昨天去了哪裡', ans: (p) => `${p.reply} went to the ${['zoo', 'museum', 'beach', 'library'][p.k % 4]}.` },
  { wh: 'What', t: 'past', vp: 'buy last Sunday', zh: '上星期天買了什麼', ans: (p) => `${p.reply} bought a ${['new bag', 'red hat', 'book', 'watch'][p.k % 4]}.` },
  { wh: 'When', t: 'past', vp: 'visit the museum', zh: '什麼時候去參觀博物館', ans: (p) => `${p.reply} visited it ${['last week', 'last Saturday', 'two days ago'][p.k % 3]}.` },
  { wh: 'What', t: 'prog', vp: 'doing now', zh: '現在正在做什麼', ans: (p) => `${p.reply} ${p.be} ${['reading a book', 'playing the piano', 'cooking dinner', 'washing the dishes'][p.k % 4]}.` },
  { wh: 'Where', t: 'prog', vp: 'going', zh: '要去哪裡', ans: (p) => `${p.reply} ${p.be} going to the ${['park', 'supermarket', 'station'][p.k % 3]}.` },
];
function make(rng) {
  const a = rng.fresh(ASK, (x) => x.wh + x.vp);
  // "my father" is asked as "your father"; "we" only where the speaker would ask about the group (plans, schedule)
  const p = pickAskedPerson(rng, (x) => x.pr !== 'we' || ['going', 'play basketball'].includes(a.vp));
  const subj = midOf(p);
  const helper = a.t === 'past' ? 'did' : a.t === 'prog' ? (p.s3 ? 'is' : 'are') : p.s3 ? 'does' : 'do';
  const reply = p.rp === 'I' ? 'I' : cap(p.rp);
  const info = { reply, s3: a.t === 'pres' && ['He', 'She'].includes(reply), be: reply === 'I' ? 'am' : ['He', 'She'].includes(reply) ? 'is' : 'are', k: rng.int(12) };
  const zhQ = zhJoin(p.zh, a.zh) + '？';
  return { lines: [[blank(a.wh), ' ', blank(helper), ` ${subj} ${a.vp}? — ${a.ans(info)}`]], zh: zhQ, meta: { type: 'make', wh: a.wh, tense: a.t, s3: p.s3, subj } };
}

const MODES = [
  { id: 'basic', name: '基本疑問詞', instruction: () => '依回答填入疑問詞（一個空格填一個字）。', gen: (rng) => BASIC[rng.fresh(BASIC.map((_, i) => i), (i) => 'b' + i)](rng) },
  { id: 'more', name: '更多疑問詞', instruction: () => '依回答填入疑問詞（一個空格填一個字）。', gen: (rng) => fixClock(MORE[rng.fresh(MORE.map((_, i) => i), (i) => 'm' + i)](rng)) },
  { id: 'make', name: '疑問詞 + 助動詞', instruction: () => '依回答填入疑問詞，以及 do、does、did、is 或 are。', gen: make },
];

export default {
  id: 'wh',
  code: 'WHQ',
  title: '疑問詞 What / Where / When…',
  grade: 7,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules, not by the subject/verb spread test
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['basic'], 2: ['basic', 'more'], 3: ['basic', 'more', 'make'] },
  levelHint: { 1: 'What、Who、Where、How old、How many。', 2: '加入 When、What time、Why、How、Whose、How much、What color。', 3: '再加入「疑問詞 + do / does / did / is」。' },
  grammarBox: (o) => ({ head: ['問', '疑問詞'], rows: [
    ['東西、名字', 'What'], ['人', 'Who'], ['地點', 'Where'], ['年紀', 'How old'], ['數量', 'How many'],
    ...(o.level >= 2 ? [['時候、日期', 'When'], ['幾點', 'What time'], ['原因', 'Why'], ['方法、交通', 'How'], ['誰的', 'Whose'], ['價錢', 'How much'], ['顏色', 'What color']] : []),
  ], note: '看回答來判斷：回答地點用 Where，回答 Because… 用 Why，回答年紀用 How old。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
