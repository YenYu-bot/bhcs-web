// Topic: noun clauses with that — I think (that) Tom is right. / I'm sure that … / I don't think he is at home.
import { blank, cap, zhJoin } from '../core.js';

// Clauses: [English (present), Chinese, Be or do verb with its negative]
//   neg: the clause in the negative, for "I think he isn't …" → "I don't think he is …"
const C = (en, zh, neg, zhNeg) => ({ en, zh, neg, zhNeg });
const CLAUSES = [
  C('Tom is right', 'Tom 是對的', "Tom isn't right", 'Tom 是對的'), C('it will rain tomorrow', '明天會下雨', "it won't rain tomorrow", '明天會下雨'),
  C('the test is easy', '這次考試很簡單', "the test isn't easy", '這次考試很簡單'), C('she can swim', '她會游泳', "she can't swim", '她會游泳'),
  C('he is at home', '他在家', "he isn't at home", '他在家'), C('Amy likes music', 'Amy 喜歡音樂', "Amy doesn't like music", 'Amy 喜歡音樂'),
  C('the movie is interesting', '這部電影很有趣', "the movie isn't interesting", '這部電影很有趣'), C('they will come to the party', '他們會來派對', "they won't come to the party", '他們會來派對'),
  C('the store is open now', '商店現在有開', "the store isn't open now", '商店現在有開'), C('we have enough time', '我們有足夠的時間', "we don't have enough time", '我們有足夠的時間'),
  C('Ben is a good student', 'Ben 是好學生', "Ben isn't a good student", 'Ben 是好學生'), C('the bus will be late', '公車會遲到', "the bus won't be late", '公車會遲到'),
  C('my brother can fix the bicycle', '我哥哥會修腳踏車', "my brother can't fix the bicycle", '我哥哥會修腳踏車'), C('the bag is cheap', '這個袋子很便宜', "the bag isn't cheap", '這個袋子很便宜'),
];
// main verbs: [English (I …), Chinese, which clauses fit (all if omitted)]
const HEADS = [['think', '認為'], ['know', '知道'], ['hope', '希望'], ['believe', '相信'], ['am sure', '確定'], ['heard', '聽說']];
const HOPE_OK = /rain|easy|come|open|enough|fix|swim|right|interesting|good student|cheap/;
// the subject of the main clause
const WHO = [['I', '我', 'I'], ['We', '我們', 'We'], ['My mother', '我媽媽', 'She'], ['Tom', 'Tom', 'He']];
const headFor = (verb, who) => (verb === 'am sure' ? (who === 'I' ? 'am sure' : ['We'].includes(who) ? 'are sure' : 'is sure') : verb === 'heard' ? 'heard' : who === 'I' || who === 'We' ? verb : verb + 's');

const MODES = [
  {
    id: 'head', name: '主要子句的動詞', instruction: () => '依括號裡的中文填入動詞（think、know、hope、believe、be sure、heard），後面接 that 子句。',
    gen(rng) {
      const c = rng.fresh(CLAUSES, (x) => x.en);
      const [verb, vz] = rng.fresh(HEADS.filter(([v]) => v !== 'hope' || HOPE_OK.test(c.en)), (x) => 'h-' + x[0]);
      const [who, wz] = rng.pick(WHO);
      const form = headFor(verb, who);
      const words = form.split(' ');
      const bl = words.flatMap((w, i) => (i ? [' ', blank(w)] : [blank(w)]));
      return { lines: [[`${who} `, ...bl, ` that ${c.en}. (${vz})`]], zh: zhJoin(wz, vz, c.zh) + '。', meta: { kind: 'head', verb, who } };
    },
  },
  {
    id: 'join', name: '合併成 that 子句', instruction: () => '把兩句合併成一句，用 that 引導子句（一個空格填一個字）。',
    gen(rng) {
      const c = rng.fresh(CLAUSES, (x) => 'j-' + x.en);
      // "I think so / I believe so / I hope so" (not "I know so")
      const [verb, vz] = rng.fresh([['think', '認為'], ['believe', '相信'], ['hope', '希望']].filter(([v]) => v !== 'hope' || HOPE_OK.test(c.en)), (x) => 'j-' + x[0]);
      const [first, ...rest] = c.en.split(' ');
      const sentence = cap(c.en);
      return { lines: [[`${sentence}. I ${verb} so.`], [`→ I ${verb} `, blank('that'), ` ${first} ${rest.join(' ')}.`]], zh: zhJoin(`我${vz}`, c.zh) + '。', meta: { kind: 'join', verb } };
    },
  },
  {
    id: 'neg', name: "I don't think …", instruction: () => "I think + 否定子句，英文習慣把 not 移到前面：改寫成 I don't think …（一個空格填一個字）。",
    gen(rng) {
      const c = rng.fresh(CLAUSES, (x) => 'n-' + x.en);
      const [subj, rest] = (() => { const m = /^(.*?) (isn't|won't|can't|doesn't|don't) (.*)$/.exec(c.neg); return [m[1], [m[2], m[3]]]; })();
      const pos = { "isn't": 'is', "won't": 'will', "can't": 'can', "doesn't": 'does', "don't": 'do' }[rest[0]];
      // "doesn't like" becomes "likes" in the positive clause, not "does like"
      const [verb, ...tail] = rest[1].split(' ');
      const posWords = pos === 'does' ? [`${verb}s`, ...tail] : pos === 'do' ? [verb, ...tail] : [pos, verb, ...tail];
      const posVerb = posWords[0];
      return {
        lines: [[`I think ${c.neg}.`], ['→ I ', blank("don't"), ' ', blank('think'), ` ${subj} `, blank(posVerb), ` ${posWords.slice(1).join(' ')}.`]],
        zh: zhJoin('我不認為', c.zhNeg) + '。', meta: { kind: 'neg', verb: posVerb },
      };
    },
  },
];

export default {
  id: 'that',
  code: 'THT',
  title: '名詞子句 that',
  grade: 9,
  past: false,
  variety: false, // checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { head: 50, join: CLAUSES.reduce((n, c) => n + (HOPE_OK.test(c.en) ? 3 : 2), 0), neg: CLAUSES.length },
  defaultModes: { 1: ['head'], 2: ['head', 'join'], 3: ['head', 'join', 'neg'] },
  levelHint: { 1: 'I think / know / hope / believe + that 子句。', 2: '加入兩句合併成 that 子句。', 3: "再加入 I don't think …（否定移到前面）。" },
  grammarBox: (o) => ({ head: ['句型', '例子'], rows: [
    ['主詞 + think / know / hope + that + 子句', 'I think that Tom is right.'], ['be sure / heard + that + 子句', 'I am sure that she can swim.'],
    ...(o.level >= 2 ? [['兩句合併', 'Tom is right. I think so. → I think that Tom is right.']] : []),
    ...(o.level >= 3 ? [["I don't think …", "I think he isn't at home. → I don't think he is at home."]] : []),
  ], note: 'that 可以省略；that 後面是完整的句子（主詞 + 動詞）。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
