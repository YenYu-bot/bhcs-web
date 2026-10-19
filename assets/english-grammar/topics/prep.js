// Topic: prepositions — time (in / on / at), place (in / on / under / behind / next to / in front of / near / between), and fixed phrases (listen to, wait for…).
import { blank, cap, zhJoin } from '../core.js';
import { pickPerson, verbFor } from '../people.js';

// ---------- time ----------
const DAYS = [['Monday', '星期一'], ['Tuesday', '星期二'], ['Wednesday', '星期三'], ['Thursday', '星期四'], ['Friday', '星期五'], ['Saturday', '星期六'], ['Sunday', '星期天']];
const MONTHS = [['January', '一月'], ['February', '二月'], ['March', '三月'], ['April', '四月'], ['May', '五月'], ['June', '六月'], ['July', '七月'], ['August', '八月'], ['September', '九月'], ['October', '十月'], ['November', '十一月'], ['December', '十二月']];
const CLOCK = [['six', '六'], ['seven', '七'], ['eight', '八'], ['nine', '九'], ['ten', '十'], ['five', '五'], ['four', '四']];
// [words after the blank, Chinese, type, level]; the type decides the preposition.
const TIMES = [
  ...DAYS.map(([d, z]) => [d, z, 'day', 1]), ...MONTHS.map(([m, z]) => [m, z, 'month', 1]),
  ...CLOCK.map(([c, z]) => [`${c} o'clock`, `${z}點`, 'clock', 1]), ...CLOCK.map(([c, z]) => [`${c} thirty`, `${z}點半`, 'clock', 2]),
  ['spring', '春天', 'season', 2], ['summer', '夏天', 'season', 2], ['autumn', '秋天', 'season', 2], ['winter', '冬天', 'season', 2],
  ['the morning', '早上', 'part', 2], ['the afternoon', '下午', 'part', 2], ['the evening', '傍晚', 'part', 2],
  ['noon', '中午', 'noon', 2], ['night', '晚上', 'night', 2],
  ...[['May 5', '五月五日'], ['July 20', '七月二十日'], ['October 10', '十月十日'], ['December 25', '十二月二十五日']].map(([d, z]) => [d, z, 'date', 2]),
  ...DAYS.slice(0, 7).flatMap(([d, z]) => [[`${d} morning`, `${z}早上`, 'day', 3], [`${d} evening`, `${z}傍晚`, 'day', 3]]),
  ['my birthday', '我生日那天', 'day', 3], ['2015', '2015 年', 'year', 3],
];
export const TIME_PREP = { day: 'on', date: 'on', month: 'in', season: 'in', part: 'in', year: 'in', clock: 'at', noon: 'at', night: 'at' };
// [English before the blank, subject zh, what happens zh, time types it fits]
// [English before the blank, subject zh, what happens zh, time types it fits, times that make sense (optional; matched by first word)]
const EVENTS = [
  ['I get up', '我', '起床', ['clock'], ['six', 'seven']], ['We have lunch', '我們', '吃午餐', ['noon']], ['The movie starts', '電影', '開始', ['clock'], ['six', 'seven', 'eight', 'nine']],
  ['School ends', '學校', '放學', ['clock'], ['four', 'five']], ['My father goes to work', '我爸爸', '去上班', ['clock', 'part'], ['seven', 'eight', 'the morning']],
  ['I do my homework', '我', '寫功課', ['part', 'night', 'clock'], ['seven', 'eight', 'nine', 'the evening', 'the afternoon', 'night']],
  ['We have a music class', '我們', '上音樂課', ['day', 'part'], [...DAYS.map((d) => d[0]), 'the morning', 'the afternoon']],
  ['I visit my grandmother', '我', '去看奶奶', ['day']], ['They play basketball', '他們', '打籃球', ['day', 'part'], [...DAYS.map((d) => d[0]), 'the afternoon', 'the evening']],
  ['We go to the beach', '我們', '去海邊', ['season', 'month', 'day'], ['summer', 'June', 'July', 'August', 'Saturday', 'Sunday']],
  ['It snows here', '這裡', '會下雪', ['season', 'month'], ['winter', 'December', 'January', 'February']],
  ['My birthday is', '我的生日', '', ['month', 'date']], ['The party is', '派對', '', ['day', 'date', 'clock'], [...DAYS.map((d) => d[0]), 'May', 'July', 'October', 'December', 'six', 'seven', 'eight']],
  ['I sleep', '我', '睡覺', ['night']], ['My brother was born', '我哥哥', '出生', ['year', 'month', 'date']], ['The flowers open', '花', '開', ['season'], ['spring', 'summer']],
];
function time(rng, o) {
  const ev = rng.fresh(EVENTS.filter((e) => TIMES.some((t) => t[3] <= o.level && e[3].includes(t[2]))), (x) => x[0]);
  const ts = TIMES.filter((t) => t[3] <= o.level && ev[3].includes(t[2]) && (!ev[4] || ev[4].includes(t[0].split(' ')[0]) || ev[4].includes(t[0])) && !(t[0] === 'my birthday' && ev[0].includes('birthday')));
  if (!ts.length) return null;
  const [t, tz, type] = rng.fresh(ts, (x) => x[0]);
  const ans = TIME_PREP[type];
  const zh = ev[2] ? zhJoin(ev[1], tz, ev[2]) : zhJoin(ev[1], `在${tz}`);
  return { lines: [[`${ev[0]} `, blank(ans), ` ${t}.`]], zh: zh + '。', meta: { kind: 'time', type, time: t } };
}

// ---------- place ----------
// [preposition, Chinese cue, level]
const PREPS = { in: ['裡面', 1], on: ['上面', 1], under: ['下面', 1], behind: ['後面', 2], 'next to': ['旁邊', 2], 'in front of': ['前面', 2], near: ['附近', 2], between: ['中間', 3] };
// where, its Chinese, and which prepositions make sense with it
const SPOTS = [
  ['the table', '桌子', ['on', 'under', 'next to']], ['the desk', '書桌', ['on', 'under', 'next to']], ['the bed', '床', ['on', 'under', 'next to']],
  ['the sofa', '沙發', ['on', 'under', 'behind', 'next to', 'in front of']], ['the box', '盒子', ['in', 'on', 'under', 'next to']],
  ['the tree', '樹', ['under', 'behind', 'next to', 'in front of']], ['the door', '門', ['behind', 'next to', 'in front of']],
  ['the house', '房子', ['behind', 'in front of', 'next to', 'near']], ['the school', '學校', ['behind', 'in front of', 'next to', 'near']],
  ['the refrigerator', '冰箱', ['in']], ['my bag', '我的袋子', ['in', 'under', 'next to']],
];
// what is somewhere: [English, Chinese, plural, spots it fits]
const SMALL = ['the table', 'the desk', 'the bed', 'the sofa', 'the box', 'my bag'];
const ITEMS = [
  ['The cat', '貓', false, ['the table', 'the desk', 'the bed', 'the sofa', 'the box', 'the tree', 'the door']], ['The dog', '狗', false, ['the table', 'the bed', 'the sofa', 'the tree', 'the door', 'the house']],
  ['The ball', '球', false, SMALL.concat(['the tree', 'the door'])], ['My book', '我的書', false, SMALL], ['Your pen', '你的筆', false, SMALL],
  ['The keys', '鑰匙', true, SMALL], ['My shoes', '我的鞋子', true, ['the bed', 'the sofa', 'the door', 'the box']],
  ['The milk', '牛奶', false, ['the refrigerator', 'the table']], ['The eggs', '蛋', true, ['the refrigerator', 'the table', 'the box']],
  ['His bicycle', '他的腳踏車', false, ['the tree', 'the door', 'the house', 'the school']], ['The car', '車子', false, ['the house', 'the school', 'the tree']],
  ['The children', '孩子們', true, ['the tree', 'the door', 'the house', 'the school']], ['The bus stop', '公車站', false, ['the school', 'the house']],
];
const prepsAt = (spot, o) => SPOTS.find((x) => x[0] === spot)[2].filter((p) => PREPS[p][1] <= o.level);
function place(rng, o) {
  const [it, iz, pl, all] = rng.fresh(ITEMS.filter((x) => x[3].some((s) => prepsAt(s, o).length)), (x) => x[0]);
  const spots = all.filter((s) => prepsAt(s, o).length);
  const be = pl ? 'are' : 'is';
  if (o.level >= 3 && rng.chance(0.25)) {
    const two = spots.filter((s) => SMALL.includes(s) || ['the tree', 'the door', 'the house', 'the school'].includes(s));
    if (two.length >= 2) {
      const a = rng.pick(two), b = rng.pick(two.filter((x) => x !== a));
      const [az, bz] = [SPOTS.find((s) => s[0] === a)[1], SPOTS.find((s) => s[0] === b)[1]];
      return { lines: [[`${it} ${be} `, blank('between'), ` ${a} and ${b}. (中間)`]], zh: `${iz}在${az}和${bz}中間。`, meta: { kind: 'place', prep: 'between', cue: '中間' } };
    }
  }
  const spot = rng.pick(spots);
  const [s, sz, ok] = SPOTS.find((x) => x[0] === spot);
  const preps = prepsAt(spot, o);
  const prep = rng.fresh(preps, (p) => p);
  const cue = PREPS[prep][0];
  const words = prep.split(' ');
  const blanks = words.flatMap((w, i) => (i ? [' ', blank(w)] : [blank(w)]));
  return { lines: [[`${it} ${be} `, ...blanks, ` ${s}. (${cue})`]], zh: `${iz}在${sz}${cue === '裡面' ? '裡' : cue === '上面' ? '上' : cue}。`, meta: { kind: 'place', prep, cue } };
}

// ---------- fixed phrases ----------
// [verb forms or 'be' + adjective, preposition, objects [en, zh], Chinese with {o}, cue shown when the verb alone could take two prepositions]
const PHRASES = [
  [['listen', 'listens'], 'to', [['music', '音樂'], ['the teacher', '老師'], ['the radio', '收音機']], '聽{o}'],
  [['look', 'looks'], 'at', [['the picture', '那張圖'], ['the sky', '天空'], ['the map', '地圖']], '看{o}', '看'],
  [['look', 'looks'], 'for', [['my key', '我的鑰匙'], ['his dog', '他的狗'], ['her pen', '她的筆']], '在找{o}', '找'],
  [['wait', 'waits'], 'for', [['the bus', '公車'], ['me', '我'], ['my friend', '我的朋友']], '在等{o}'],
  [['laugh', 'laughs'], 'at', [['me', '我'], ['him', '他'], ['the new student', '新同學']], '嘲笑{o}'],
  [['take care', 'takes care'], 'of', [['the baby', '嬰兒'], ['the dog', '狗'], ['my grandmother', '我奶奶']], '照顧{o}'],
  [['agree', 'agrees'], 'with', [['me', '我'], ['you', '你'], ['her', '她']], '同意{o}'],
  ['good', 'at', [['drawing', '畫畫'], ['singing', '唱歌'], ['science', '自然'], ['cooking', '做菜']], '很擅長{o}'],
  ['afraid', 'of', [['dogs', '狗'], ['the dark', '黑暗'], ['snakes', '蛇']], '怕{o}'],
  ['late', 'for', [['school', '上學'], ['class', '上課'], ['the party', '派對']], '{o}遲到'],
  ['interested', 'in', [['music', '音樂'], ['art', '美術'], ['history', '歷史']], '對{o}有興趣'],
  ['kind', 'to', [['animals', '動物'], ['old people', '老人'], ['other people', '別人']], '對{o}很好'],
  ['proud', 'of', [['you', '你'], ['his son', '他的兒子'], ['her daughter', '她的女兒']], '以{o}為榮'],
];
function phrase(rng, o) {
  const [v, prep, objs, zt, cue] = rng.fresh(PHRASES, (x) => (Array.isArray(x[0]) ? x[0][0] : x[0]) + x[1]);
  const [ob, oz] = rng.pick(objs);
  const p = pickPerson(rng, (x) => !(ob === 'me' && x.pr === 'I') && !(ob === 'you' && x.pr === 'you') && !(ob === 'her' && x.pr === 'she') && !(ob === 'him' && x.pr === 'he'));
  let head;
  if (Array.isArray(v)) head = `${p.en} ${verbFor(p, v)}`;
  else head = `${p.en} ${p.en === 'I' ? 'am' : ['we', 'they', 'you'].includes(p.pr) ? 'are' : 'is'} ${v}`;
  return {
    lines: [[`${head} `, blank(prep), ` ${ob}.${cue ? ` (${cue})` : ''}`]],
    zh: zhJoin(p.zh, zt.replace('{o}', oz)) + '。', meta: { kind: 'phrase', head: Array.isArray(v) ? v[0] : v, prep },
  };
}

const MODES = [
  { id: 'time', name: '時間介系詞', instruction: () => '填入 in、on 或 at。', gen: time },
  { id: 'place', name: '地方介系詞', instruction: () => '依括號裡的位置填入介系詞（一個空格填一個字）。', gen: place },
  { id: 'phrase', name: '固定搭配', instruction: () => '填入正確的介系詞。', gen: phrase },
];

export default {
  id: 'prep',
  code: 'PRP',
  title: '介系詞 in / on / at',
  grade: 7,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules, not by the subject/verb spread test
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['time', 'place'], 2: ['time', 'place'], 3: ['time', 'place', 'phrase'] },
  levelHint: { 1: '星期、月份、幾點；in、on、under。', 2: '加入季節、早上下午、中午晚上、日期；behind、next to、in front of、near。', 3: '再加入 on Sunday morning、between，以及 listen to、wait for 等固定搭配。' },
  grammarBox: (o) => ({ head: ['介系詞', '時間'], rows: [
    ['at', o.level >= 2 ? '幾點、noon、night' : '幾點'], ['on', o.level >= 2 ? '星期、日期' + (o.level >= 3 ? '、Sunday morning' : '') : '星期'],
    ['in', o.level >= 2 ? '月份、季節、the morning / afternoon / evening' + (o.level >= 3 ? '、年份' : '') : '月份'],
  ], note: '地方：in 裡面、on 上面、under 下面' + (o.level >= 2 ? '、behind 後面、next to 旁邊、in front of 前面、near 附近' : '') + (o.level >= 3 ? '、between A and B 中間' : '') + '。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
