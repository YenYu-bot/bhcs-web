// Topic: verbs with two objects — give Amy a book = give a book TO Amy; buy Amy a book = buy a book FOR Amy.
import { blank, cap, zhJoin } from '../core.js';
import { pickPerson, verbFor, midOf } from '../people.js';
import { mealFits } from '../vcommon.js';

// [base, past, Chinese, preposition when the thing comes first, things that go with it]
const V = (base, past, zh, prep, things) => ({ base, past, zh, prep, things });
const THINGS = {
  gift: ['a gift', '一份禮物', 'it'], card: ['a card', '一張卡片', 'it'], book: ['a book', '一本書', 'it'], letter: ['a letter', '一封信', 'it'], photo: ['a photo', '一張照片', 'it'],
  flowers: ['some flowers', '一些花', 'them'], pen: ['a pen', '一枝筆', 'it'], watch: ['a watch', '一支手錶', 'it'], money: ['some money', '一些錢', 'it'], story: ['a story', '一個故事', 'it'],
  cake: ['a cake', '一個蛋糕', 'it'], dinner: ['dinner', '晚餐', 'it'], sandwich: ['a sandwich', '一個三明治', 'it'], juice: ['a glass of juice', '一杯果汁', 'it'], picture: ['a picture', '一張圖', 'it'],
  bag: ['a bag', '一個袋子', 'it'], hat: ['a hat', '一頂帽子', 'it'], umbrella: ['an umbrella', '一把雨傘', 'it'], bicycle: ['a bicycle', '一輛腳踏車', 'it'], map: ['a map', '一張地圖', 'it'],
  english: ['history', '歷史', 'it'], math: ['science', '自然', 'it'], secret: ['a secret', '一個祕密', 'it'], truth: ['the truth', '實話', 'it'], news: ['the news', '這個消息', 'it'],
};
const VERBS = [
  V('give', 'gave', '給', 'to', ['gift', 'card', 'book', 'pen', 'money', 'flowers', 'map']), V('send', 'sent', '寄給', 'to', ['letter', 'card', 'photo', 'gift']),
  V('show', 'showed', '給…看', 'to', ['photo', 'picture', 'map', 'book']), V('lend', 'lent', '借給', 'to', ['pen', 'book', 'bicycle', 'umbrella', 'money']),
  V('teach', 'taught', '教', 'to', ['english', 'math']), V('tell', 'told', '告訴', 'to', ['story', 'secret', 'truth', 'news']), V('write', 'wrote', '寫給', 'to', ['letter', 'card']),
  V('pass', 'passed', '遞給', 'to', ['book', 'pen', 'map']), V('bring', 'brought', '帶給', 'to', ['gift', 'umbrella', 'juice', 'sandwich']),
  V('buy', 'bought', '買給', 'for', ['gift', 'book', 'watch', 'bag', 'hat', 'bicycle', 'umbrella', 'flowers']), V('make', 'made', '做給', 'for', ['cake', 'dinner', 'sandwich', 'card']),
  V('cook', 'cooked', '煮給', 'for', ['dinner']), V('get', 'got', '拿給', 'for', ['juice', 'sandwich', 'umbrella', 'book']), V('draw', 'drew', '畫給', 'for', ['picture']),
];
const ZH = { show: (to, th) => `給${to}看${th}`, teach: (to, th) => `教${to}${th}`, tell: (to, th) => `告訴${to}${th}`, give: (to, th) => `給${to}${th}`, lend: (to, th) => `借${th}給${to}`,
  send: (to, th) => `寄${th}給${to}`, write: (to, th) => `寫${th}給${to}`, pass: (to, th) => `把${th}遞給${to}`, bring: (to, th) => `帶${th}給${to}`,
  buy: (to, th) => `買${th}給${to}`, make: (to, th) => `做${th}給${to}`, cook: (to, th) => `煮${th}給${to}`, get: (to, th) => `拿${th}給${to}`, draw: (to, th) => `畫${th}給${to}` };
// Receivers: [as object, Chinese]
const RECEIVERS = [['me', '我'], ['him', '他'], ['her', '她'], ['us', '我們'], ['them', '他們'], ['my mother', '我媽媽'], ['his sister', '他姊姊'], ['her friend', '她朋友'], ['the teacher', '老師'], ['the children', '孩子們']];
const TIMES = [['yesterday', '昨天'], ['last night', '昨晚'], ['last week', '上星期'], ['this morning', '今天早上'], ['last Sunday', '上星期天']];
const RULE = (v) => (v.prep === 'to' ? 'to' : 'for');

function draw(rng, o, exclude = []) {
  const v = rng.fresh(VERBS.filter((x) => !exclude.includes(x.base) && (o.level >= 2 || x.prep === 'to' || ['buy', 'make'].includes(x.base))), (x) => x.base);
  const th = THINGS[rng.pick(v.things)];
  const p = pickPerson(rng, (x) => !(x.pr === 'I' && v.base === 'teach') && x.en !== 'Our teacher' || v.base !== 'teach');
  let recs = RECEIVERS.filter(([r]) => !(p.pr === 'I' && ['me', 'us'].includes(r)) && !(p.pr === 'we' && ['us', 'me'].includes(r)) && !(p.pr === 'he' && r === 'him') && !(p.pr === 'she' && r === 'her') && !(p.pr === 'they' && r === 'them'));
  if (v.base === 'teach' || p.en === 'Our teacher') recs = recs.filter(([r]) => !['the teacher'].includes(r));
  const [rec, recZh] = rng.fresh(recs, (x) => x[0]);
  const past = o.level >= 2 ? rng.fresh([true, false], (x) => 'tense-' + x) : false;
  const [t, tz] = past ? rng.pick(TIMES.filter((x) => mealFits(th[0], x[0]))) : ['', ''];
  const verb = past ? v.past : verbFor(p, [v.base, v.base.endsWith('ch') || v.base.endsWith('ss') ? v.base + 'es' : v.base + 's']);
  // "my mother" follows the subject (his mother, their mother); "his sister" / "her friend" take the subject's gender when it has one
  const OWN = { he: ['his', '他'], she: ['her', '她'], they: ['their', '他們的'], we: ['our', '我們的'], you: ['your', '你'], I: ['my', '我'] }[p.pr];
  let recPhrase = rec, recZ = recZh;
  if (/^my /.test(rec)) { recPhrase = rec.replace(/^my /, OWN[0] + ' '); recZ = recZh.replace(/^我/, OWN[1]); }
  else if (/^(his|her) /.test(rec) && ['he', 'she'].includes(p.pr)) { recPhrase = rec.replace(/^(his|her) /, OWN[0] + ' '); recZ = recZh.replace(/^[他她]/, OWN[1]); }
  return { v, th, p, rec: recPhrase, recZh: recZ, verb, t, tz, past };
}
const zhLine = (d) => zhJoin(d.p.zh, d.tz, ZH[d.v.base](d.recZh, d.th[1])) + '。';

const MODES = [
  {
    id: 'prep', name: 'to 或 for', instruction: () => '填入 to 或 for。',
    gen(rng, o) {
      const d = draw(rng, o);
      return { lines: [[`${d.p.en} ${d.verb} ${d.th[0]} `, blank(RULE(d.v)), ` ${d.rec}${d.t ? ' ' + d.t : ''}.`]], zh: zhLine(d), meta: { kind: 'prep', verb: d.v.base } };
    },
  },
  {
    id: 'swap', name: '兩種句型互換', instruction: () => '把句子改寫成另一種句型（人在前 ↔ 物在前，物在前時要加 to 或 for）。',
    gen(rng, o) {
      const d = draw(rng, o);
      const toLong = rng.fresh([true, false], (x) => 'swap-' + x);
      const tail = d.t ? ' ' + d.t : '';
      if (toLong) {
        // Tom gave Amy a book. → Tom gave a book to Amy.
        return { lines: [[`${d.p.en} ${d.verb} ${d.rec} ${d.th[0]}${tail}.`], [`→ ${d.p.en} ${d.verb} `, blank(d.th[0], true), ' ', blank(RULE(d.v)), ' ', blank(d.rec, true), `${tail}.`]], zh: zhLine(d), meta: { kind: 'swap', verb: d.v.base, long: true, thing: d.th[0], rec: d.rec } };
      }
      return { lines: [[`${d.p.en} ${d.verb} ${d.th[0]} ${RULE(d.v)} ${d.rec}${tail}.`], [`→ ${d.p.en} ${d.verb} `, blank(d.rec, true), ' ', blank(d.th[0], true), `${tail}.`]], zh: zhLine(d), meta: { kind: 'swap', verb: d.v.base, long: false, thing: d.th[0], rec: d.rec } };
    },
  },
  {
    id: 'it', name: '受詞是代名詞', instruction: () => '受詞是 it / them 時只能放在動詞後面：依中文完成句子（物在前，加 to 或 for）。',
    gen(rng, o) {
      const d = draw(rng, o, ['teach', 'tell']);
      const pron = d.th[2];
      return { lines: [[`${d.p.en} ${d.verb} `, blank(pron), ' ', blank(RULE(d.v)), ' ', blank(d.rec, true), `${d.t ? ' ' + d.t : ''}. (${d.th[0]})`]], zh: zhLine(d), meta: { kind: 'it', verb: d.v.base, pron, rec: d.rec } };
    },
  },
];

export default {
  id: 'give',
  code: 'DTV',
  title: '授與動詞 give / buy',
  grade: 8,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['prep'], 2: ['prep', 'swap'], 3: ['prep', 'swap', 'it'] },
  levelHint: { 1: 'give、send、show、tell、teach、lend、pass、bring、write 用 to；buy、make 用 for。現在式。', 2: '加入 cook、get、draw，以及過去式和兩種句型互換。', 3: '再加入受詞是 it / them 的句子。' },
  grammarBox: (o) => ({ head: ['句型', '例子'], rows: [
    ['動詞 + 人 + 物', 'Tom gave Amy a book.'], ['動詞 + 物 + to + 人', 'Tom gave a book to Amy.（give、send、show、tell、teach、lend、pass、bring、write）'],
    ['動詞 + 物 + for + 人', 'Tom bought a book for Amy.（buy、make、cook、get、draw）'],
    ...(o.level >= 3 ? [['物是 it / them', 'Tom gave it to Amy.（不能說 gave Amy it）']] : []),
  ], note: 'to：東西「傳到」對方那裡；for：「為了」對方做的事。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
