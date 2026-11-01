// Topic: question word + to V — I don't know what to do. / Can you tell me how to get to the station?
import { blank } from '../core.js';

// [question word, V phrase, Chinese (要…), subject pronoun for the "should" form is filled in later]
const WH = [
  ['what', 'do', '要做什麼'], ['what', 'say', '要說什麼'], ['what', 'buy for my mother', '要買什麼給我媽媽'], ['what', 'wear to the party', '要穿什麼去派對'], ['what', 'eat for lunch', '午餐要吃什麼'],
  ['how', 'get to the station', '怎麼去車站'], ['how', 'use the computer', '怎麼用電腦'], ['how', 'make a cake', '怎麼做蛋糕'], ['how', 'ride a bicycle', '怎麼騎腳踏車'], ['how', 'spell the word', '怎麼拼這個字'], ['how', 'swim', '怎麼游泳'],
  ['where', 'go this weekend', '這個週末要去哪裡'], ['where', 'put the box', '要把箱子放在哪裡'], ['where', 'buy the tickets', '要去哪裡買票'], ['where', 'wait for the bus', '要在哪裡等公車'], ['where', 'sit', '要坐在哪裡'],
  ['when', 'leave', '什麼時候要離開'], ['when', 'start the party', '什麼時候要開始派對'], ['when', 'call him', '什麼時候要打電話給他'],
  ['which', 'bus to take', '要搭哪一班公車'], ['which', 'book to read', '要讀哪一本書'], ['which', 'one to buy', '要買哪一個'],
  ['who', 'ask for help', '要找誰幫忙'], ['who', 'invite to the party', '要邀請誰來派對'],
];
// heads: [English, Chinese before, Chinese after, question?]
const HEADS = [["I don't know", '我不知道', '', false], ['Can you tell me', '你可以告訴我', '嗎', true], ['She asked me', '她問我', '', false], ["We aren't sure", '我們不確定', '', false], ['Please show me', '請教我', '', false]];
const fits = (h, w) => !(h[0] === 'Please show me' && w[0] !== 'how') && !(h[0] === 'Can you tell me' && ['say', 'do'].includes(w[1]));
// "which bus to take": the noun sits between which and to
const split = (w) => (w[0] === 'which' ? [`which ${w[1].split(' to ')[0]}`, w[1].split(' to ')[1]] : [w[0], w[1]]);
const SUBJ = { "I don't know": 'I', 'Can you tell me': 'I', 'She asked me': 'she', "We aren't sure": 'we', 'Please show me': 'I' };

const MODES = [
  {
    id: 'fill', name: '疑問詞 + to V', instruction: () => '依中文填入疑問詞（what、how、where、when、which、who）和 to。',
    gen(rng) {
      const w = rng.fresh(WH, (x) => x[0] + x[1]);
      const h = rng.pick(HEADS.filter((x) => fits(x, w)));
      const [wh, vp] = split(w);
      const [q, ...noun] = wh.split(' ');
      return { lines: [[`${h[0]} `, blank(q), `${noun.length ? ' ' + noun.join(' ') : ''} `, blank('to'), ` ${vp}${h[3] ? '?' : '.'}`]], zh: `${h[1]}${w[2]}${h[2]}${h[3] ? '？' : '。'}`, meta: { kind: 'fill', wh: q } };
    },
  },
  {
    id: 'swap', name: '改寫成疑問詞 + to V', instruction: () => '把「疑問詞 + 主詞 + should + V」改寫成「疑問詞 + to V」（一個空格填一個字）。',
    gen(rng) {
      const w = rng.fresh(WH.filter((x) => x[0] !== 'which'), (x) => 'sw-' + x[0] + x[1]);
      const h = rng.pick(HEADS.filter((x) => fits(x, w) && x[0] !== 'Please show me'));
      const [b, ...rest] = w[1].split(' ');
      const subj = SUBJ[h[0]];
      const end = h[3] ? '?' : '.';
      return {
        lines: [[`${h[0]} ${w[0]} ${subj} should ${w[1]}${end}`], [`→ ${h[0]} `, blank(w[0]), ' ', blank('to'), ' ', blank(b), `${rest.length ? ' ' + rest.join(' ') : ''}${end}`]],
        zh: `${h[1]}${w[2]}${h[2]}${h[3] ? '？' : '。'}`, meta: { kind: 'swap', wh: w[0], base: b },
      };
    },
  },
];

export default {
  id: 'whto',
  code: 'WTV',
  title: '疑問詞 + to V',
  grade: 9,
  past: false,
  variety: false, // checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { fill: 40, swap: 40 },
  defaultModes: { 1: ['fill'], 2: ['fill', 'swap'], 3: ['fill', 'swap'] },
  levelHint: { 1: '依中文填入疑問詞與 to。', 2: '加入「疑問詞 + 主詞 + should + V」改寫。', 3: '同中級，題目更多樣。' },
  grammarBox: () => ({ head: ['疑問詞 + to V', '意思'], rows: [['what to do', '要做什麼'], ['how to get there', '怎麼去'], ['where to go', '要去哪裡'], ['when to leave', '什麼時候要離開'], ['which bus to take', '要搭哪一班公車'], ['who to ask', '要問誰']],
    note: '疑問詞 + to V = 疑問詞 + 主詞 + should + V：I don\'t know what to do. = I don\'t know what I should do.' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
