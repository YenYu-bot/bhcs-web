// Topic: spend / take / cost / pay — all 花費 in Chinese; the sentence pattern decides the verb.
//   人 spend 時間/錢 on 物 (V-ing)   It takes 人 時間 to V   物 cost 人 錢   人 pay 錢 for 物
import { blank, cap, mid, zhJoin } from '../core.js';
import { pickPerson } from '../people.js';

const FORMS = { spend: ['spend', 'spends', 'spent'], take: ['take', 'takes', 'took'], cost: ['cost', 'costs', 'cost'], pay: ['pay', 'pays', 'paid'] };
// things with a price: [English, Chinese, price in words, Chinese price]
const THINGS = [
  ['the bag', '這個袋子', 'five hundred dollars', '五百元'], ['the watch', '這支手錶', 'two thousand dollars', '兩千元'], ['the book', '這本書', 'three hundred dollars', '三百元'],
  ['the shoes', '這雙鞋', 'one thousand dollars', '一千元'], ['the cake', '這個蛋糕', 'four hundred dollars', '四百元'], ['the bicycle', '這輛腳踏車', 'five thousand dollars', '五千元'],
  ['the jacket', '這件夾克', 'eight hundred dollars', '八百元'], ['the dictionary', '這本字典', 'six hundred dollars', '六百元'], ['the umbrella', '這把雨傘', 'two hundred dollars', '兩百元'],
  ['the ticket', '這張票', 'three hundred dollars', '三百元'], ['the hat', '這頂帽子', 'two hundred dollars', '兩百元'], ['the computer', '這台電腦', 'twenty thousand dollars', '兩萬元'],
];
// things that take time: [V phrase, V-ing phrase, Chinese, time, Chinese time]
const TASKS = [
  ['do my homework', 'doing my homework', '寫功課', 'two hours', '兩個小時'], ['clean the house', 'cleaning the house', '打掃房子', 'three hours', '三個小時'],
  ['walk to school', 'walking to school', '走路上學', 'twenty minutes', '二十分鐘'], ['read the book', 'reading the book', '讀這本書', 'a week', '一個星期'],
  ['make the cake', 'making the cake', '做這個蛋糕', 'an hour', '一個小時'], ['wash the car', 'washing the car', '洗車', 'thirty minutes', '三十分鐘'],
  ['finish the work', 'finishing the work', '完成這份工作', 'three days', '三天'], ['draw the picture', 'drawing the picture', '畫這張圖', 'two days', '兩天'],
  ['fix the bicycle', 'fixing the bicycle', '修腳踏車', 'an hour', '一個小時'], ['learn the song', 'learning the song', '學這首歌', 'a week', '一個星期'],
  ['cook dinner', 'cooking dinner', '煮晚餐', 'an hour', '一個小時'], ['write the letter', 'writing the letter', '寫這封信', 'thirty minutes', '三十分鐘'],
];
// "my homework" follows the person: his homework, our homework
const POSS = { I: 'my', you: 'your', he: 'his', she: 'her', we: 'our', they: 'their' };
const own = (p, s) => s.replace(/\bmy\b/, POSS[p.pr]);
const OBJ = { I: 'me', you: 'you', he: 'him', she: 'her', we: 'us', they: 'them' };
/** The person as an object: a pronoun becomes me / him…, a name or noun stays ("It took Mark two hours"). */
const objOf = (p) => (/^(I|You|He|She|We|They)$/.test(p.en) ? OBJ[p.pr] : mid(p.en));
// a task of days is not done "yesterday": [time, Chinese] that fit a duration
const whenFor = (time, past) => (/day|week/.test(time) ? (past ? [['last month', '上個月'], ['last year', '去年']] : [['', '']]) : WHEN[past ? 'past' : 'pres']);
const WHEN = { pres: [['', ''], ['every day', '每天']], past: [['yesterday', '昨天'], ['last week', '上星期'], ['last Sunday', '上星期天']] };
const form = (verb, p, past, it = false) => (past ? FORMS[verb][2] : it || p.s3 ? FORMS[verb][1] : FORMS[verb][0]);
// people whose pronoun the sentence can reuse (no "Our teacher" as "me")
const person = (rng) => pickPerson(rng, (p) => OBJ[p.pr]);

/** One sentence with the verb blank: which pattern, the person, the tense. */
function sentence(rng, verb, past) {
  const p = person(rng);
  if (verb === 'spend' || verb === 'take') {
    const [vp, ing, zh, time, timeZh] = rng.fresh(TASKS, (x) => verb + x[0]);
    const [t, tz] = rng.pick(whenFor(time, past));
    const tail = t ? ' ' + t : '';
    if (t === 'every day' && /the (book|cake|picture|letter|song|work)|the house|the bicycle|the car/.test(vp)) return null; // one-off tasks are not every day
    const hua = past ? '花了' : '要花';
    if (verb === 'spend') return { l: `${p.en} `, v: form('spend', p, past), r: ` ${time} ${own(p, ing)}${tail}.`, zh: zhJoin(p.zh, tz, `${hua}${timeZh}${zh}`) + '。', p };
    return { l: 'It ', v: form('take', p, past, true), r: ` ${objOf(p)} ${time} to ${own(p, vp)}${tail}.`, zh: zhJoin(p.zh, tz, `${zh}${hua}${timeZh}`) + '。', p };
  }
  const [th, thz, price, priceZh] = rng.fresh(THINGS, (x) => verb + x[0]);
  // a price now has no buyer ("The bag costs …"); buying happened, so cost me / paid are past
  if (verb === 'cost' && !past) return { l: `${cap(th)} `, v: th === 'the shoes' ? 'cost' : 'costs', r: ` ${price}.`, zh: `${thz}要${priceZh}。`, p };
  const [pt, ptz] = rng.pick([['', ''], ...WHEN.past]);
  const ptail = pt ? ' ' + pt : '';
  if (verb === 'cost') return { l: `${cap(th)} `, v: 'cost', r: ` ${objOf(p)} ${price}${ptail}.`, zh: zhJoin(p.zh, ptz, `買${thz}花了${priceZh}`) + '。', p };
  return { l: `${p.en} `, v: 'paid', r: ` ${price} for ${th}${ptail}.`, zh: zhJoin(p.zh, ptz, `買${thz}付了${priceZh}`) + '。', p };
}

const MODES = [
  {
    id: 'choose', name: '選對動詞', instruction: () => '中文都是「花費」：人 spend 時間／錢；It takes 人 時間 to V；物 cost 人 錢；人 pay 錢 for 物。填入正確的動詞與形式。',
    gen(rng, o) {
      const verb = rng.fresh(['spend', 'take', 'cost', 'pay'], (x) => 'v-' + x);
      const past = o.level >= 2 ? rng.chance(0.6) : true;
      const s = sentence(rng, verb, past); if (!s) return null;
      return { lines: [[s.l, blank(s.v), s.r]], zh: s.zh, meta: { kind: 'choose', verb, form: s.v } };
    },
  },
  {
    id: 'swap', name: '句型互換', instruction: () => '改寫句子，意思不變：spend 與 It takes 互換，cost 與 pay 互換（一個空格填一個字）。',
    gen(rng, o) {
      const which = rng.fresh(['time', 'money'], (x) => 'sw-' + x);
      const p = person(rng);
      if (which === 'time') {
        const [vp, ing, zh, time, timeZh] = rng.fresh(TASKS, (x) => 'sw' + x[0]);
        const [t, tz] = rng.pick(whenFor(time, true));
        const [b, ...rest] = own(p, vp).split(' ');
        return {
          lines: [[`${p.en} spent ${time} ${own(p, ing)} ${t}.`], ['→ It ', blank('took'), ' ', blank(objOf(p), true), ` ${time} `, blank('to'), ' ', blank(b), ` ${rest.join(' ')} ${t}.`]],
          zh: zhJoin(p.zh, tz, `${zh}花了${timeZh}`) + '。', meta: { kind: 'swap', which, obj: objOf(p), base: b },
        };
      }
      const [th, thz, price, priceZh] = rng.fresh(THINGS, (x) => 'sw' + x[0]);
      return {
        lines: [[`${cap(th)} cost ${objOf(p)} ${price}.`], [`→ ${p.en} `, blank('paid'), ` ${price} `, blank('for'), ` ${th}.`]],
        zh: zhJoin(p.zh, `買${thz}付了${priceZh}`) + '。', meta: { kind: 'swap', which },
      };
    },
  },
];

export default {
  id: 'spend',
  code: 'SPD',
  title: 'spend / take / cost / pay',
  grade: 8,
  past: false,
  variety: false, // checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['choose'], 2: ['choose'], 3: ['choose', 'swap'] },
  levelHint: { 1: '過去式：spent、took、cost、paid。', 2: '現在式與過去式混合。', 3: '再加入 spend ↔ It takes、cost ↔ pay 的改寫。' },
  grammarBox: () => ({ head: ['主詞', '句型', '例子'], rows: [
    ['人', 'spend + 時間／錢 + V-ing', 'I spent two hours doing my homework.'], ['It', 'It takes + 人 + 時間 + to V', 'It took me two hours to do my homework.'],
    ['物', '物 + cost + 人 + 錢', 'The bag cost me five hundred dollars.'], ['人', 'pay + 錢 + for + 物', 'I paid five hundred dollars for the bag.'],
  ], note: '過去式：spend → spent、take → took、cost → cost（不變）、pay → paid。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
