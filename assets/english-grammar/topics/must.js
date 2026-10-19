// Topic: have to / has to / must — obligation, with don't have to (no need) against mustn't (not allowed).
import { blank, cap, zhJoin } from '../core.js';
import { pickPerson, verbFor, midOf } from '../people.js';

// Duties: [verb phrase, Chinese]; 'school' ones are for students, so not for parents or the teacher.
const D = (en, zh, who = 'any', when = null) => ({ en, zh, who, when });
const DUTIES = [
  D('do my homework', '寫功課', 'student'), D('get up early', '早起'), D('wear a uniform', '穿制服', 'student', ['every day', 'today', 'tomorrow']), D('clean the room', '打掃房間'), D('go to school', '上學', 'student', ['every day', 'today', 'tomorrow', 'this week']),
  D('finish the work', '把工作做完', 'adult'), D('see a doctor', '去看醫生', 'any', ['today', 'tomorrow', 'now', 'this week']), D('stay at home', '待在家裡', 'any', ['today', 'tomorrow', 'now', 'this week']), D('wash the dishes', '洗碗'), D('take the bus', '搭公車'),
  D('study hard', '用功讀書', 'student', ['every day', 'today', 'this week', 'tomorrow']), D('go to bed early', '早點睡'), D('wait for the bus', '等公車', 'any', ['today', 'every day', 'now']), D('help my mother', '幫我媽媽', 'student'), D('go to work', '去上班', 'adult', ['every day', 'today', 'tomorrow', 'this week']),
  D('cook dinner', '煮晚餐', 'adult'), D('walk the dog', '遛狗'), D('practice the piano', '練習鋼琴', 'student'), D('take the test', '考試', 'student', ['today', 'tomorrow', 'this week']), D('buy some food', '買一些食物', 'any', ['today', 'tomorrow', 'now']),
];
// Rules: [verb phrase, Chinese]; must / mustn't come from signs and rules, so the subjects are you / we / students / people.
const MUST = [
  ['be quiet in the library', '在圖書館保持安靜'], ['wear a seat belt', '繫安全帶'], ['stop at the red light', '紅燈停'], ['wash your hands before dinner', '晚餐前洗手'], ['listen to the teacher', '聽老師的話'],
  ['be quiet in class', '上課保持安靜'], ['be on time', '準時'], ['finish the test in an hour', '在一小時內寫完考卷'], ['look left and right before you cross the street', '過馬路前左右看'], ['keep the classroom clean', '保持教室乾淨'],
];
const MUSTNT = [
  ['run in the hall', '在走廊奔跑'], ['talk in the library', '在圖書館講話'], ['eat in the classroom', '在教室吃東西'], ['play with fire', '玩火'], ['swim in the river', '在河裡游泳'],
  ['touch the animals', '碰那些動物'], ['park here', '在這裡停車'], ['be late for class', '上課遲到'], ['use a dictionary during the test', '考試時用字典'], ['throw trash on the floor', '把垃圾丟在地上'],
];
const RULE_SUBJECTS = [['You', '你'], ['We', '我們'], ['Students', '學生'], ['Drivers', '駕駛人'], ['Visitors', '訪客'], ['People', '大家']];
const SUBJ_FOR = { 'wear a seat belt': ['You', 'We', 'Drivers'], 'stop at the red light': ['You', 'We', 'Drivers'], 'park here': ['You', 'Drivers', 'Visitors'], 'touch the animals': ['You', 'Visitors', 'Students'],
  'listen to the teacher': ['You', 'We', 'Students'], 'be quiet in class': ['You', 'We', 'Students'], 'finish the test in an hour': ['You', 'We', 'Students'], 'keep the classroom clean': ['You', 'We', 'Students'],
  'use a dictionary during the test': ['You', 'We', 'Students'], 'be late for class': ['You', 'We', 'Students'], 'eat in the classroom': ['You', 'We', 'Students'], 'run in the hall': ['You', 'We', 'Students'],
  'wash your hands before dinner': ['You', 'We', 'Students'], 'look left and right before you cross the street': ['You', 'We'] };
const ownWord = (s) => ({ You: 'your', We: 'our' }[s] ?? 'their');
const ruleText = (vp, s) => vp.replace('your', ownWord(s)).replace('before you cross', s === 'We' ? 'before we cross' : 'before you cross');

const fits = (d, p) => (d.who === 'any') || (d.who === 'student' ? !['My father', 'My mother', 'My parents', 'Our teacher'].includes(p.en) : ['My father', 'My mother', 'My parents', 'Our teacher', 'He', 'She'].includes(p.en));
const my = (d, p) => d.en.replace('my mother', p.en === 'I' ? 'my mother' : p.pr === 'he' ? 'his mother' : p.pr === 'she' ? 'her mother' : p.pr === 'you' ? 'your mother' : p.pr === 'we' ? 'our mother' : 'their mother')
  .replace('my homework', p.en === 'I' ? 'my homework' : p.pr === 'he' ? 'his homework' : p.pr === 'she' ? 'her homework' : p.pr === 'you' ? 'your homework' : p.pr === 'we' ? 'our homework' : 'their homework');
const zhMy = (d, p) => d.zh.replace('我媽媽', p.en === 'I' ? '我媽媽' : p.pr === 'we' ? '我們的媽媽' : p.pr === 'you' ? '你媽媽' : p.pr === 'he' ? '他媽媽' : p.pr === 'she' ? '她媽媽' : '他們的媽媽');
function duty(rng, test = () => true) {
  const p = pickPerson(rng, test);
  const d = rng.fresh(DUTIES.filter((x) => fits(x, p)), (x) => x.en);
  return { p, d, en: my(d, p), zh: zhMy(d, p) };
}
const WHEN = [['today', '今天'], ['every day', '每天'], ['tomorrow', '明天'], ['this week', '這星期'], ['now', '現在']];
const whenFor = (d, list) => (d.when ? list.filter((x) => d.when.includes(x[0])) : list);
const PAST = [['yesterday', '昨天'], ['last night', '昨晚'], ['last week', '上星期']];

const MODES = [
  {
    id: 'have', name: 'have to / has to', instruction: () => '依中文，填入 have to 或 has to（一個空格填一個字）。',
    gen(rng, o) {
      const { p, d, en, zh } = duty(rng);
      const [w, wz] = rng.fresh(whenFor(d, WHEN), (x) => 'when-' + x[0]);
      return { lines: [[`${p.en} `, blank(verbFor(p, ['have', 'has'])), ' ', blank('to'), ` ${en} ${w}.`]], zh: zhJoin(p.zh, wz, '必須', zh) + '。', meta: { kind: 'have', s3: p.s3 } };
    },
  },
  {
    id: 'must', name: "must / mustn't", instruction: () => "依中文，填入 must 或 mustn't：規定要做的用 must，禁止的用 mustn't。",
    gen(rng, o) {
      const neg = rng.fresh([false, true], (x) => 'must-' + x);
      const [vp, zh] = rng.fresh(neg ? MUSTNT : MUST, (x) => x[0]);
      const subs = RULE_SUBJECTS.filter((s) => !SUBJ_FOR[vp] || SUBJ_FOR[vp].includes(s[0]));
      const [s, sz] = rng.pick(subs);
      const text = ruleText(vp, s);
      return { lines: [[`${s} `, blank(neg ? "mustn't" : 'must'), ` ${text}.`]], zh: `${sz}${neg ? '不可以' : '必須'}${zh}。`, meta: { kind: 'must', neg } };
    },
  },
  {
    id: 'neg', name: "don't have to 或 mustn't", instruction: () => "依中文判斷：「不必」用 don't / doesn't have to，「不可以」用 mustn't（一個空格填一個字）。",
    gen(rng, o) {
      if (rng.fresh([true, false], (x) => 'neg-' + x)) {
        const { p, d, en, zh } = duty(rng);
        const [w, wz] = rng.fresh(whenFor(d, WHEN), (x) => 'when-' + x[0]);
        return { lines: [[`${p.en} `, blank(p.s3 ? "doesn't" : "don't"), ' ', blank('have'), ' ', blank('to'), ` ${en} ${w}.`]], zh: zhJoin(p.zh, wz, '不必', zh) + '。', meta: { kind: 'neg', need: false, s3: p.s3 } };
      }
      const [vp, zh] = rng.fresh(MUSTNT, (x) => x[0]);
      const subs = RULE_SUBJECTS.filter((s) => !SUBJ_FOR[vp] || SUBJ_FOR[vp].includes(s[0]));
      const [s, sz] = rng.pick(subs);
      const text = ruleText(vp, s);
      return { lines: [[`${s} `, blank("mustn't"), ` ${text}.`]], zh: `${sz}不可以${zh}。`, meta: { kind: 'neg', need: true } };
    },
  },
  {
    id: 'q', name: '疑問句與簡答', instruction: () => '用 Do / Does … have to 完成問句與簡答。',
    gen(rng, o) {
      const { p, d, en, zh } = duty(rng, (x) => x.pr !== 'I' && x.pr !== 'we');
      const yes = rng.chance(0.5);
      const r = p.pr === 'you' ? 'I' : p.pr;
      const aux = p.s3 ? 'does' : 'do';
      const rAux = r === 'I' ? 'do' : aux;
      const [w, wz] = rng.fresh(whenFor(d, WHEN), (x) => 'when-' + x[0]);
      return {
        lines: [[blank(cap(aux)), ` ${midOf(p)} `, blank('have'), ' ', blank('to'), ` ${en} ${w}? — ${yes ? 'Yes' : 'No'}, `, blank(r), ' ', blank(yes ? rAux : rAux + "n't"), '.']],
        zh: zhJoin(p.zh, wz, '必須', zh) + '嗎？', meta: { kind: 'q', s3: p.s3, yes, reply: r },
      };
    },
  },
  {
    id: 'had', name: 'had to（過去）', instruction: () => '依時間填入 have to、has to 或 had to（一個空格填一個字）。',
    gen(rng, o) {
      const { p, d, en, zh } = duty(rng);
      const past = rng.fresh([true, false], (x) => 'had-' + x);
      const [w, wz] = rng.fresh(past ? PAST : whenFor(d, WHEN).filter((x) => x[0] !== 'every day'), (x) => 'when-' + x[0]);
      return { lines: [[`${p.en} `, blank(past ? 'had' : verbFor(p, ['have', 'has'])), ' ', blank('to'), ` ${en} ${w}.`]], zh: zhJoin(p.zh, wz, '必須', zh) + '。', meta: { kind: 'had', past, s3: p.s3 } };
    },
  },
];

export default {
  id: 'must',
  code: 'MST',
  title: 'have to / must',
  grade: 8,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['have', 'must'], 2: ['have', 'must', 'neg'], 3: ['have', 'must', 'neg', 'q', 'had'] },
  levelHint: { 1: "have to / has to 與 must / mustn't。", 2: "加入 don't have to（不必）與 mustn't（不可以）的分辨。", 3: '再加入 Do / Does … have to 問句、簡答，以及過去式 had to。' },
  grammarBox: (o) => ({ head: ['', '意思', '例子'], rows: [
    ['have to / has to', '必須（因為情況需要）', 'I have to get up early. She has to go to work.'], ['must', '必須（規定、命令）', 'You must stop at the red light.'],
    ...(o.level >= 2 ? [["don't / doesn't have to", '不必', "You don't have to come."], ["mustn't", '不可以、禁止', "You mustn't run here."]] : []),
    ...(o.level >= 3 ? [['had to', '過去必須', 'I had to stay at home yesterday.'], ['Do / Does … have to…?', '必須…嗎？', 'Does he have to go? — Yes, he does.']] : []),
  ], note: "must 沒有第三人稱變化也沒有過去式；mustn't 是「不可以」，不是「不必」。" }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
