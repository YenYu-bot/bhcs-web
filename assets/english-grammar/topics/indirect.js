// Topic: indirect questions — Where does he live? → Do you know where he lives?  Did she go? → I don\'t know if she went.
import { blank, zhJoin } from '../core.js';

// Direct wh-questions: [question, wh-part, subject, verb in the indirect question, rest, Chinese]
const WH = [
  ['Where does he live?', 'where', 'he', 'lives', '', '他住在哪裡'], ['What time is it?', 'what time', 'it', 'is', '', '現在幾點'], ['When does the movie start?', 'when', 'the movie', 'starts', '', '電影幾點開始'],
  ['Where is the station?', 'where', 'the station', 'is', '', '車站在哪裡'], ['How old is she?', 'how old', 'she', 'is', '', '她幾歲'], ['What does Tom want?', 'what', 'Tom', 'wants', '', 'Tom 想要什麼'],
  ['Why did they leave early?', 'why', 'they', 'left', ' early', '他們為什麼提早離開'], ['Who is that man?', 'who', 'that man', 'is', '', '那個男人是誰'], ['Where did you buy the bag?', 'where', 'you', 'bought', ' the bag', '你在哪裡買這個袋子'],
  ['How much does the watch cost?', 'how much', 'the watch', 'costs', '', '這支手錶多少錢'], ['What is her name?', 'what', 'her name', 'is', '', '她叫什麼名字'], ['When will the bus come?', 'when', 'the bus', 'will come', '', '公車什麼時候來'],
  ['Where are my keys?', 'where', 'my keys', 'are', '', '我的鑰匙在哪裡'], ['How does she go to school?', 'how', 'she', 'goes', ' to school', '她怎麼去上學'], ['What did he say?', 'what', 'he', 'said', '', '他說了什麼'],
  ['Which bus goes to the zoo?', 'which bus', '', 'goes', ' to the zoo', '哪一班公車去動物園'], ['Who broke the window?', 'who', '', 'broke', ' the window', '誰打破了窗戶'], ['Where was she yesterday?', 'where', 'she', 'was', ' yesterday', '她昨天在哪裡'],
  ['How many students are there?', 'how many students', 'there', 'are', '', '有多少學生'], ['What time does the store open?', 'what time', 'the store', 'opens', '', '商店幾點開門'],
];
// Yes / no questions: [question, subject, verb in the indirect question, rest, Chinese]
const YN = [
  ['Does he like dogs?', 'he', 'likes', ' dogs', '他喜不喜歡狗'], ['Did she go home?', 'she', 'went', ' home', '她有沒有回家'], ['Is Tom at home?', 'Tom', 'is', ' at home', 'Tom 在不在家'],
  ['Are they coming to the party?', 'they', 'are coming', ' to the party', '他們會不會來派對'], ['Can you swim?', 'you', 'can swim', '', '你會不會游泳'], ['Will it rain tomorrow?', 'it', 'will rain', ' tomorrow', '明天會不會下雨'],
  ['Does the store open on Sundays?', 'the store', 'opens', ' on Sundays', '商店星期天有沒有開'], ['Did they win the game?', 'they', 'won', ' the game', '他們有沒有贏比賽'], ['Is this seat free?', 'this seat', 'is', ' free', '這個位子是不是空的'],
  ['Has he finished his homework?', 'he', 'has finished', ' his homework', '他功課寫完了沒'], ['Was the movie good?', 'the movie', 'was', ' good', '電影好不好看'], ['Does Tom have a pen?', 'Tom', 'has', ' a pen', 'Tom 有沒有筆'],
];
const HEADS = [['Do you know', '你知道'], ['I don\'t know', '我不知道'], ['Can you tell me', '你可以告訴我'], ['I wonder', '我想知道'], ['Could you tell me', '你可以告訴我'], ['No one knows', '沒有人知道']];
// A question about "you" is not put back to you ("Do you know where you bought it?"): only I-heads then.
const headsFor = (subj) => (subj === 'you' ? HEADS.filter(([h]) => /^I /.test(h)) : HEADS);
const isQ = (h) => /^(Do|Can|Could)/.test(h);
const end = (h) => (isQ(h) ? '?' : '.');
const zhEnd = (h) => (isQ(h) ? '嗎？' : '。');

const MODES = [
  {
    id: 'verb', name: '疑問詞問句的動詞', instruction: () => '把直接問句改成間接問句：疑問詞後面用「主詞 + 動詞」，依括號提示填入動詞的正確形式。',
    gen(rng) {
      const [q, wh, subj, verb, rest, zh] = rng.fresh(WH, (x) => x[0]);
      const [h, hz] = rng.fresh(headsFor(subj), (x) => x[0]);
      const base = /^(will|has) /.test(verb) ? verb.split(' ')[1] : verb === 'is' || verb === 'are' || verb === 'was' ? 'be' : { lives: 'live', starts: 'start', wants: 'want', left: 'leave', bought: 'buy', costs: 'cost', goes: 'go', said: 'say', broke: 'break', opens: 'open' }[verb];
      const words = verb.split(' ').flatMap((w, i) => (i ? [' ', blank(w)] : [blank(w)]));
      return { lines: [[q], [`→ ${h} ${wh}${subj ? ' ' + subj : ''} `, ...words, ` (${base})${rest}${end(h)}`]], zh: zhJoin(hz, zh) + zhEnd(h), meta: { kind: 'verb', verb, q, subj } };
    },
  },
  {
    id: 'order', name: '主詞與動詞的順序', instruction: () => '把直接問句改成間接問句：疑問詞後面先寫主詞，再寫動詞（照抄或改成正確形式）。',
    gen(rng) {
      const [q, wh, subj, verb, rest, zh] = rng.fresh(WH.filter((x) => x[2]), (x) => 'o-' + x[0]);
      const [h, hz] = rng.fresh(headsFor(subj), (x) => 'o-' + x[0]);
      return { lines: [[q], [`→ ${h} ${wh} `, blank(subj, true), ' ', blank(verb, true), `${rest}${end(h)}`]], zh: zhJoin(hz, zh) + zhEnd(h), meta: { kind: 'order', subj, verb, q } };
    },
  },
  {
    id: 'if', name: 'if 引導的間接問句', instruction: () => '沒有疑問詞的問句改成間接問句時用 if 或 whether（是否）：填入 if（或 whether），以及主詞和動詞。',
    gen(rng) {
      const [q, subj, verb, rest, zh] = rng.fresh(YN, (x) => x[0]);
      const [h, hz] = rng.fresh(headsFor(subj), (x) => 'i-' + x[0]);
      return { lines: [[q], [`→ ${h} `, blank('if／whether'), ' ', blank(subj, true), ' ', blank(verb, true), `${rest}${end(h)}`]], zh: zhJoin(hz, zh) + zhEnd(h), meta: { kind: 'if', subj, verb, q } };
    },
  },
];

export default {
  id: 'indirect',
  code: 'IDQ',
  title: '間接問句',
  grade: 9,
  past: false,
  variety: false, // fixed sentence lists; checked by their own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { verb: WH.length, order: WH.filter((x) => x[2]).length, if: YN.length },
  defaultModes: { 1: ['verb'], 2: ['verb', 'order'], 3: ['verb', 'order', 'if'] },
  levelHint: { 1: '疑問詞後面的動詞：does / did 拿掉，動詞加 -s 或改過去式。', 2: '加入主詞與動詞的順序（疑問詞 + 主詞 + 動詞）。', 3: '再加入 Yes / No 問句改成 if 引導的間接問句。' },
  grammarBox: (o) => ({ head: ['直接問句', '間接問句'], rows: [
    ['Where does he live?', 'Do you know where he lives?（does 拿掉，live 加 -s）'], ['What did he say?', 'I don\'t know what he said.（did 拿掉，say 改 said）'],
    ...(o.level >= 2 ? [['Where is the station?', 'Can you tell me where the station is?（主詞在前，be 動詞在後）']] : []),
    ...(o.level >= 3 ? [['Does he like dogs?', 'I wonder if he likes dogs.（沒有疑問詞用 if）']] : []),
  ], note: '間接問句裡不倒裝：疑問詞（或 if）+ 主詞 + 動詞；句尾標點看前面的主要句子是問句還是直述句。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
