// Topic: "it" as the stand-in subject — It is important to study hard. / It is kind of you to help me.
import { blank } from '../core.js';

// What one does, with the adjectives it fits: [V phrase, Chinese, adjectives]
const ACTS = [
  ['learn a new language', '學一種新的語言', ['important', 'useful', 'difficult', 'interesting', 'fun']],
  ['swim in the river', '在河裡游泳', ['dangerous']], ['play with fire', '玩火', ['dangerous']], ['cross the street here', '在這裡過馬路', ['dangerous']],
  ['get up early', '早起', ['important', 'difficult', 'good']], ['eat vegetables', '吃蔬菜', ['important', 'good']], ['help others', '幫助別人', ['important', 'good', 'nice']],
  ['read books', '讀書', ['important', 'interesting', 'fun', 'useful']], ['ride a bicycle', '騎腳踏車', ['easy', 'fun', 'interesting']], ['fly a kite', '放風箏', ['easy', 'fun']],
  ['make a sandwich', '做三明治', ['easy']], ['finish the work in an hour', '一小時內完成這份工作', ['difficult', 'impossible']], ['climb the mountain', '爬那座山', ['difficult', 'dangerous', 'fun']],
  ['answer the question', '回答這個問題', ['easy', 'difficult']], ['keep the room clean', '保持房間乾淨', ['important', 'difficult']], ['say sorry', '說對不起', ['difficult', 'important']],
  ['take a walk after dinner', '晚餐後散步', ['good', 'nice']], ['use the computer', '使用電腦', ['easy', 'useful']], ['play basketball with friends', '和朋友打籃球', ['fun', 'interesting']],
];
const ADJ_ZH = { important: '很重要', useful: '很有用', difficult: '很難', interesting: '很有趣', fun: '很好玩', dangerous: '很危險', good: '很好', nice: '很好', easy: '很簡單', impossible: '不可能' };
// It is + adjective + of + person: the adjective says what the person is like
const OF = [['kind', '真好心', 'help me'], ['nice', '人真好', 'say so'], ['smart', '真聰明', 'find the answer'], ['careless', '太粗心了', 'lose your keys'], ['polite', '很有禮貌', 'say thank you']];
const FOR_PEOPLE = [['me', '我'], ['him', '他'], ['her', '她'], ['us', '我們'], ['them', '他們'], ['children', '孩子們'], ['students', '學生']];
const OF_PEOPLE = [['you', '你'], ['him', '他'], ['her', '她'], ['them', '他們']];
const zhOf = (act, adj) => `${act[1]}${ADJ_ZH[adj]}`;

const MODES = [
  {
    id: 'fill', name: 'It is … to V', instruction: () => '用虛主詞 It 開頭，真正的主詞（to + 原形）放後面：依中文填入。',
    gen(rng) {
      const act = rng.fresh(ACTS, (x) => x[0]);
      const adj = rng.pick(act[2]);
      return { lines: [[blank('It'), ` is ${adj} `, blank('to'), ` ${act[0]}.`]], zh: zhOf(act, adj) + '。', meta: { kind: 'fill', adj } };
    },
  },
  {
    id: 'swap', name: '改寫成 It 開頭', instruction: () => '把 To V 開頭的句子改寫成虛主詞 It 開頭（一個空格填一個字）。',
    gen(rng) {
      const act = rng.fresh(ACTS, (x) => 'sw-' + x[0]);
      const adj = rng.pick(act[2]);
      const [b, ...rest] = act[0].split(' ');
      return { lines: [[`To ${act[0]} is ${adj}.`], ['→ ', blank('It'), ` is ${adj} `, blank('to'), ' ', blank(b), ` ${rest.join(' ')}.`]], zh: zhOf(act, adj) + '。', meta: { kind: 'swap', adj, base: b } };
    },
  },
  {
    id: 'forof', name: 'for 或 of', instruction: () => '說事情（難、重要、危險）用 for + 人；說人的個性（好心、聰明、粗心）用 of + 人：填入 for 或 of。',
    gen(rng) {
      if (rng.fresh([true, false], (x) => 'fo-' + x)) {
        const act = rng.fresh(ACTS.filter((x) => x[2].some((a) => a !== 'nice')), (x) => 'f-' + x[0]);
        const adj = rng.pick(act[2].filter((a) => a !== 'nice'));
        const [who, wz] = rng.pick(FOR_PEOPLE);
        return { lines: [[`It is ${adj} `, blank('for'), ` ${who} to ${act[0]}.`]], zh: `對${wz}來說，${zhOf(act, adj)}。`, meta: { kind: 'for', adj } };
      }
      const [adj, az, vp] = rng.fresh(OF, (x) => 'o-' + x[0]);
      const [who, wz] = rng.pick(OF_PEOPLE.filter(([w]) => !(w !== 'you' && /your/.test(vp))));
      const vpFor = vp.replace(/\byour\b/, { him: 'his', her: 'her', them: 'their', you: 'your' }[who]);
      return { lines: [[`It was ${adj} `, blank('of'), ` ${who} to ${vpFor}.`]], zh: `${wz}${az}，${vp === 'help me' ? '幫了我' : vp === 'say so' ? '這麼說' : vp === 'find the answer' ? '找到了答案' : vp === 'say thank you' ? '說了謝謝' : '把鑰匙弄丟了'}。`, meta: { kind: 'of', adj } };
    },
  },
];

export default {
  id: 'itto',
  code: 'ITT',
  title: '虛主詞 It is … to V',
  grade: 8,
  past: false,
  variety: false, // checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { fill: 40, swap: 40, forof: 40 },
  defaultModes: { 1: ['fill'], 2: ['fill', 'swap'], 3: ['fill', 'swap', 'forof'] },
  levelHint: { 1: 'It is + 形容詞 + to V。', 2: '加入 To V 開頭改寫成 It 開頭。', 3: '再加入 for + 人 與 of + 人 的分辨。' },
  grammarBox: (o) => ({ head: ['句型', '例子'], rows: [
    ['It is + 形容詞 + to V', 'It is important to study hard.'],
    ...(o.level >= 2 ? [['To V … is → It is … to V', 'To swim in the river is dangerous. → It is dangerous to swim in the river.']] : []),
    ...(o.level >= 3 ? [['for + 人（事情難不難、重不重要）', 'It is easy for me to ride a bicycle.'], ['of + 人（人的個性）', 'It was kind of you to help me.']] : []),
  ], note: 'to V 當主詞時太長，用 It 放在句首代替，把 to V 移到句尾。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
