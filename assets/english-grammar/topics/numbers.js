// Topic: numbers in words — ordinals (first, twelfth, twenty-first), dates (on May fifth) and clock times (seven thirty, a quarter past six).
import { blank, cap, zhJoin } from '../core.js';

export const CARDINAL = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen',
  16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty' };
export const ORDINAL = { 1: 'first', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth', 11: 'eleventh', 12: 'twelfth', 13: 'thirteenth', 14: 'fourteenth',
  15: 'fifteenth', 16: 'sixteenth', 17: 'seventeenth', 18: 'eighteenth', 19: 'nineteenth', 20: 'twentieth', 30: 'thirtieth' };
export const ordinal = (n) => (ORDINAL[n] ? ORDINAL[n] : `${CARDINAL[Math.floor(n / 10) * 10]}-${ORDINAL[n % 10]}`);
const cardinal = (n) => (CARDINAL[n] ? CARDINAL[n] : `${CARDINAL[Math.floor(n / 10) * 10]}-${CARDINAL[n % 10]}`);
const ZH_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const zhNum = (n) => (n <= 10 ? ZH_NUM[n] : n < 20 ? '十' + ZH_NUM[n % 10] : ZH_NUM[Math.floor(n / 10)] + '十' + ZH_NUM[n % 10]);
const MONTHS = [['January', '一月'], ['February', '二月'], ['March', '三月'], ['April', '四月'], ['May', '五月'], ['June', '六月'], ['July', '七月'], ['August', '八月'], ['September', '九月'], ['October', '十月'], ['November', '十一月'], ['December', '十二月']];
// Ordinal sentences: [template with {N} for the ordinal, Chinese with {N}, which numbers fit]
const ORD = [
  ['Today is my {N} birthday.', '今天是我{N}歲生日。', [10, 11, 12, 13, 14, 15, 16]], ['He came {N} in the race.', '他在比賽中得第{N}名。', [1, 2, 3, 4, 5, 6]],
  ['{M} is the {N} month of the year.', '{M}是一年的第{N}個月。', 'month'], ['She lives on the {N} floor.', '她住在{N}樓。', [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]],
  ['This is my {N} time in Taichung.', '這是我第{N}次來台中。', [1, 2, 3, 4, 5]], ['Sunday is the {N} day of the week.', '星期天是一週的第{N}天。', [1]],
  ['Turn right at the {N} corner.', '在第{N}個轉角右轉。', [1, 2, 3]], ['It is her {N} day at the new school.', '這是她在新學校的第{N}天。', [1, 2, 3]],
  ['We sat in the {N} row.', '我們坐在第{N}排。', [1, 2, 3, 4, 5, 6, 7, 8]], ['This is the {N} lesson.', '這是第{N}課。', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]],
  ['I am in the {N} grade.', '我讀{N}年級。', [1, 2, 3, 4, 5, 6, 7, 8, 9]], ['The {N} question is hard.', '第{N}題很難。', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20]], ['Amy finished {N} in the test.', 'Amy 考第{N}名。', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
];
const bd = (n) => (n >= 10 && n < 20 ? n : n);
// Clock times: [hour, minute, words, Chinese]
const CLOCK = [[7, 30, 'seven thirty', '七點三十分'], [8, 15, 'eight fifteen', '八點十五分'], [6, 45, 'six forty-five', '六點四十五分'], [9, 20, 'nine twenty', '九點二十分'], [12, 0, "twelve o'clock", '十二點整'],
  [3, 10, 'three ten', '三點十分'], [10, 50, 'ten fifty', '十點五十分'], [5, 5, 'five oh five', '五點五分'], [11, 40, 'eleven forty', '十一點四十分'], [4, 25, 'four twenty-five', '四點二十五分'], [2, 35, 'two thirty-five', '兩點三十五分'], [1, 55, 'one fifty-five', '一點五十五分']];
const pad = (m) => String(m).padStart(2, '0');

const MODES = [
  {
    id: 'ordinal', name: '序數', instruction: () => '把括號裡的數字改成序數（first、second、third、fourth…）。',
    gen(rng, o) {
      const [en, zh, nums] = rng.fresh(ORD, (x) => x[0]);
      let n, m;
      if (nums === 'month') { m = rng.fresh(MONTHS, (x) => 'mo-' + x[0]); n = MONTHS.indexOf(m) + 1; }
      else n = rng.fresh(nums.filter((x) => (o.level >= 2 ? true : x <= 12)), (x) => 'n-' + x);
      if (o.level >= 3 && nums !== 'month' && /floor|row|lesson|birthday/.test(en) && rng.chance(0.3)) n = rng.pick([21, 22, 23, 25, 31]);
      const word = ordinal(n);
      const bl = word.includes('-') ? [blank(word)] : [blank(word)];
      const [l, r] = en.replace('{M}', m ? m[0] : '').split('{N}');
      return { lines: [[l, blank(word, word.includes('-')), ` (${n})${r}`]], zh: zh.replace('{M}', m ? m[1] : '').replace('{N}', zhNum(n)), meta: { kind: 'ordinal', n } };
    },
  },
  {
    id: 'date', name: '日期', instruction: () => '把日期寫成英文：on + 月份 + 序數（例如 5/5 → on May fifth）。',
    gen(rng, o) {
      const m = rng.fresh(MONTHS, (x) => 'd-' + x[0]);
      const day = rng.fresh(o.level >= 2 ? [1, 2, 3, 4, 5, 8, 10, 12, 15, 20, 21, 22, 23, 25, 28, 30, 31] : [1, 2, 3, 4, 5, 8, 10, 12, 15, 20], (x) => 'day-' + x);
      const event = rng.pick([['My birthday is', '我的生日在'], ['The party is', '派對在'], ['The test is', '考試在'], ['School starts', '開學日在'], ['The game is', '比賽在'], ['Her birthday is', '她的生日在']]);
      const word = ordinal(day);
      return { lines: [[`${event[0]} `, blank('on'), ' ', blank(m[0]), ' ', blank(word, word.includes('-')), ` (${MONTHS.indexOf(m) + 1}/${day}).`]], zh: `${event[1]}${m[1]}${zhNum(day)}日。`, meta: { kind: 'date', month: m[0], day } };
    },
  },
  {
    id: 'time', name: '時間', instruction: () => "把時間寫成英文（例如 7:30 → seven thirty，12:00 → twelve o'clock）。",
    gen(rng) {
      const [h, mi, words, zh] = rng.fresh(CLOCK, (x) => x[2]);
      const head = rng.pick([['It is', '現在是'], ['The movie starts at', '電影在'], ['School ends at', '放學時間是'], ['I get up at', '我在'], ['The train leaves at', '火車在']]);
      const tail = { 'It is': '', 'The movie starts at': '開始', 'School ends at': '', 'I get up at': '起床', 'The train leaves at': '出發' }[head[0]];
      const parts = words.split(' ');
      return { lines: [[`${head[0]} `, ...parts.flatMap((w, i) => (i ? [' ', blank(w, w.includes('-'))] : [blank(w, w.includes('-'))])), ` (${h}:${pad(mi)}).`]], zh: `${head[1]}${zh}${tail}。`, meta: { kind: 'time', h, mi } };
    },
  },
];

export default {
  id: 'numbers',
  code: 'NUM',
  title: '序數、日期與時間',
  grade: 7,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { ordinal: 80, time: CLOCK.length * 5 },
  defaultModes: { 1: ['ordinal'], 2: ['ordinal', 'date'], 3: ['ordinal', 'date', 'time'] },
  levelHint: { 1: '1 到 10 的序數。', 2: '加入 11 到 20、30 的序數與日期寫法。', 3: '再加入 21、22、25 等複合序數與時間寫法。' },
  grammarBox: (o) => ({ head: ['數字', '序數'], rows: [
    ['1、2、3', 'first、second、third'], ['4、5、8、9、12', 'fourth、fifth、eighth、ninth、twelfth（注意拼字）'],
    ...(o.level >= 2 ? [['20、30', 'twentieth、thirtieth'], ['日期', 'on May fifth、on October twenty-first']] : []),
    ...(o.level >= 3 ? [['21、22、23', 'twenty-first、twenty-second、twenty-third'], ['時間', "seven thirty、six forty-five、twelve o'clock"]] : []),
  ], note: '序數前面通常加 the（the first floor），日期前面用 on，時間前面用 at。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
