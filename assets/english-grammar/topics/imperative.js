// Topic: imperatives — Open the door. / Don't run. / Let's go. / Be quiet. / Don't be late.
import { blank, cap } from '../core.js';

// [verb, rest, Chinese]; every verb is in the 2000-word list and its base form is the answer.
const DO = [
  ['open', 'the window', '打開窗戶'], ['close', 'the door', '把門關上'], ['clean', 'your room', '打掃你的房間'], ['wash', 'your hands', '洗手'],
  ['sit', 'down', '坐下'], ['stand', 'up', '站起來'], ['come', 'here', '過來'], ['listen', 'to the teacher', '聽老師說'],
  ['look', 'at the picture', '看這張圖'], ['read', 'the story', '讀這個故事'], ['write', 'your name', '寫下你的名字'], ['turn', 'off the light', '關燈'],
  ['help', 'your mother', '幫你媽媽'], ['wait', 'for me', '等我'], ['take', 'your umbrella', '帶你的雨傘'], ['drink', 'some water', '喝點水'],
  ['go', 'to bed early', '早點睡'], ['put', 'on your jacket', '穿上夾克'], ['brush', 'your teeth', '刷牙'], ['do', 'your homework', '寫你的功課'],
];
const DONT = [
  ['run', 'in the classroom', '在教室裡跑'], ['talk', 'in class', '上課說話'], ['eat', 'in the library', '在圖書館吃東西'], ['play', 'with fire', '玩火'],
  ['sleep', 'in class', '上課睡覺'], ['swim', 'in the river', '在河裡游泳'], ['make', 'noise', '製造噪音'], ['touch', 'the dog', '摸那隻狗'],
  ['shout', 'at your sister', '對你妹妹大吼'], ['cross', 'the street now', '現在過馬路'], ['watch', 'television all day', '整天看電視'], ['throw', 'trash on the floor', '把垃圾丟在地上'],
  ['open', 'the window', '打開窗戶'], ['go', 'out at night', '晚上出門'], ['take', 'my pen', '拿我的筆'],
];
const LETS = [
  ['go', 'to the park', '去公園'], ['play', 'basketball', '打籃球'], ['have', 'lunch', '吃午餐'], ['take', 'a walk', '散步'],
  ['see', 'a movie', '看電影'], ['sing', 'a song', '唱首歌'], ['make', 'a cake', '做蛋糕'], ['visit', 'the zoo', '去動物園'],
  ['study', 'together', '一起讀書'], ['clean', 'the classroom', '打掃教室'], ['fly', 'a kite', '放風箏'], ['ride', 'our bicycles', '騎腳踏車'],
];
const BE = [
  ['quiet', '安靜', false], ['careful', '小心', false], ['kind', '友善', false], ['polite', '有禮貌', false], ['on time', '準時', false], ['nice', '親切', false],
  ['late', '遲到', true], ['afraid', '害怕', true], ['angry', '生氣', true], ['noisy', '吵鬧', true], ['sad', '難過', true], ['shy', '害羞', true],
];
// "看電影" is see or watch a movie: both are right.
const ALT = { 'see a movie': 'watch' };
const key = (v, rest, capital = false) => { const c = (w) => (capital ? cap(w) : w); return ALT[`${v} ${rest}`] ? `${c(v)}／${c(ALT[`${v} ${rest}`])}` : c(v); };
const meta = (kind, base, extra = {}) => ({ kind, base, ...extra });

const MODES = [
  {
    id: 'do', name: '肯定祈使句', instruction: () => '依括號裡的中文，填入正確的動詞。',
    gen(rng) {
      const [v, rest, zh] = rng.fresh(DO, (x) => x[0] + x[1]);
      const style = rng.int(3);
      if (style === 0) return { lines: [['Please ', blank(key(v, rest)), ` ${rest}. (${zh})`]], zh: `請${zh}。`, meta: meta('do', v, { lower: true }) };
      if (style === 1) return { lines: [[blank(key(v, rest, true)), ` ${rest}, please. (${zh})`]], zh: `請${zh}。`, meta: meta('do', v) };
      return { lines: [[blank(key(v, rest, true)), ` ${rest}. (${zh})`]], zh: `${zh}。`, meta: meta('do', v) };
    },
  },
  {
    id: 'dont', name: '否定祈使句', instruction: () => "依括號裡的中文，用 Don't 寫出否定祈使句。",
    gen(rng) {
      const [v, rest, zh] = rng.fresh(DONT, (x) => x[0] + x[1]);
      return { lines: [[blank("Don't"), ' ', blank(key(v, rest)), ` ${rest}. (不要${zh})`]], zh: `不要${zh}。`, meta: meta('dont', v) };
    },
  },
  {
    id: 'lets', name: "Let's", instruction: () => "依括號裡的中文，用 Let's 提出建議。",
    gen(rng) {
      const [v, rest, zh] = rng.fresh(LETS, (x) => x[0] + x[1]);
      return { lines: [[blank("Let's"), ' ', blank(key(v, rest)), ` ${rest}. (我們${zh}吧)`]], zh: `我們${zh}吧。`, meta: meta('lets', v) };
    },
  },
  {
    id: 'be', name: 'Be 開頭的祈使句', instruction: () => "依括號裡的中文填空：「要…」用 Be，「不要…」用 Don't be。",
    gen(rng) {
      const [adj, zh, neg] = rng.fresh(BE, (x) => x[0]);
      if (neg) return { lines: [[blank("Don't"), ' ', blank('be'), ` ${adj}. (不要${zh})`]], zh: `不要${zh}。`, meta: meta('be', 'be', { neg: true }) };
      const please = rng.chance(0.4);
      return { lines: [[blank('Be'), ` ${adj}${please ? ', please' : ''}. (要${zh})`]], zh: please ? `請${zh}。` : `要${zh}。`, meta: meta('be', 'be', { neg: false }) };
    },
  },
];

export default {
  id: 'imperative',
  code: 'IMP',
  title: "祈使句與 Let's",
  grade: 7,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules, not by the subject/verb spread test
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { do: DO.length * 3, dont: DONT.length, lets: LETS.length, be: BE.length },
  defaultModes: { 1: ['do', 'dont'], 2: ['do', 'dont', 'lets'], 3: ['do', 'dont', 'lets', 'be'] },
  levelHint: { 1: "肯定祈使句與 Don't。", 2: "加入 Let's。", 3: "再加入 Be quiet、Don't be late。" },
  grammarBox: () => ({ head: ['句型', '例子'], rows: [['動詞原形開頭', 'Open the door.'], ["Don't + 原形", "Don't run."], ["Let's + 原形", "Let's go."], ['Be / Don’t be + 形容詞', "Be quiet. Don't be late."]],
    note: '祈使句沒有主詞，動詞一律用原形；加 please 比較有禮貌。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
