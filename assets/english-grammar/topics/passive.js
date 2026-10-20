// Topic: passive voice — The room is cleaned by Tom. / The letter was written by Amy. / The work will be done tomorrow.
import { blank, cap, zhJoin } from '../core.js';
import { PP } from './perfect.js';
import { VERBS } from '../verbs.js';
import { pickPerson, verbFor, midOf } from '../people.js';

// Extra verbs this topic needs beyond the shared verb table: [base, -s, past, past participle, regular?]
const EXTRA = { build: ['build', 'builds', 'built', 'built'], grow: ['grow', 'grows', 'grew', 'grown'], break: ['break', 'breaks', 'broke', 'broken'], steal: ['steal', 'steals', 'stole', 'stolen'],
  invite: ['invite', 'invites', 'invited', 'invited'], sell: ['sell', 'sells', 'sold', 'sold'], love: ['love', 'loves', 'loved', 'loved'], find: ['find', 'finds', 'found', 'found'],
  water: ['water', 'waters', 'watered', 'watered'], finish: ['finish', 'finishes', 'finished', 'finished'], send: ['send', 'sends', 'sent', 'sent'], tell: ['tell', 'tells', 'told', 'told'] };
const forms = (v) => (EXTRA[v] ? { base: EXTRA[v][0], s: EXTRA[v][1], past: EXTRA[v][2], pp: EXTRA[v][3] } : { base: v, s: VERBS[v].s, past: VERBS[v].past, pp: PP[v] ?? VERBS[v].past });
const regular = (v) => forms(v).pp === forms(v).base + 'ed' || forms(v).pp === forms(v).base + 'd' || /ied$/.test(forms(v).pp);

// What is done to what: [verb, object, Chinese object, plural?, Chinese verb phrase (被…), who usually does it ('any' | 'adult' | 'student'),
//   when: 'habit' (every day… or a past time) | 'once' (a past or future time only) | 'state' (no time word; present only)]
const D = (v, obj, objZh, pl, zh, who = 'any', when = 'habit') => ({ v, obj, objZh, pl, zh, who, when });
const DEEDS = [
  D('clean', 'the room', '房間', false, '打掃'), D('clean', 'the classroom', '教室', false, '打掃', 'student'), D('wash', 'the dishes', '碗盤', true, '洗'), D('wash', 'the car', '車子', false, '洗', 'adult'),
  D('write', 'the letter', '這封信', false, '寫', 'any', 'once'), D('write', 'these books', '這些書', true, '寫', 'adult', 'once'), D('make', 'the cake', '蛋糕', false, '做', 'any', 'once'), D('make', 'these cookies', '這些餅乾', true, '做', 'any', 'once'),
  D('eat', 'the sandwiches', '三明治', true, '吃掉', 'any', 'once'), D('drink', 'the milk', '牛奶', false, '喝掉', 'any', 'once'), D('read', 'the story', '這個故事', false, '讀', 'any', 'once'), D('sing', 'the song', '這首歌', false, '唱', 'any', 'once'),
  D('draw', 'the picture', '這張圖', false, '畫', 'any', 'once'), D('paint', 'the wall', '牆', false, '漆', 'adult', 'once'), D('plant', 'the trees', '這些樹', true, '種', 'any', 'once'), D('water', 'the flowers', '花', true, '澆'),
  D('feed', 'the dog', '狗', false, '餵'), D('fix', 'the bicycle', '腳踏車', false, '修', 'any', 'once'), D('fix', 'the computer', '電腦', false, '修', 'adult', 'once'), D('use', 'the computer', '電腦', false, '使用'),
  D('open', 'the window', '窗戶', false, '打開'), D('close', 'the door', '門', false, '關上'), D('carry', 'the boxes', '箱子', true, '搬', 'any', 'once'), D('cook', 'dinner', '晚餐', false, '煮'),
  D('teach', 'science', '自然', false, '教', 'adult', 'state'), D('tell', 'the story', '這個故事', false, '說', 'any', 'once'), D('build', 'the house', '房子', false, '蓋', 'adult', 'once'), D('grow', 'the vegetables', '蔬菜', true, '種', 'adult', 'state'),
  D('break', 'the window', '窗戶', false, '打破', 'any', 'once'), D('invite', 'the students', '學生們', true, '邀請', 'adult', 'once'), D('sell', 'the fruit', '水果', false, '賣', 'adult', 'state'),
  D('love', 'the baby', '嬰兒', false, '疼愛', 'any', 'state'), D('find', 'the keys', '鑰匙', true, '找到', 'any', 'once'), D('finish', 'the work', '工作', false, '完成', 'adult', 'once'), D('send', 'the letters', '這些信', true, '寄出', 'any', 'once'),
  D('buy', 'the flowers', '花', true, '買', 'any', 'once'), D('take', 'the pictures', '這些照片', true, '拍', 'any', 'once'), D('see', 'the movie', '這部電影', false, '看', 'any', 'once'),
];
const TIMES = {
  pres: [['every day', '每天'], ['every week', '每星期'], ['every morning', '每天早上'], ['on weekends', '週末']],
  past: [['yesterday', '昨天'], ['last week', '上星期'], ['last night', '昨晚'], ['two days ago', '兩天前']],
  fut: [['tomorrow', '明天'], ['next week', '下星期'], ['tonight', '今晚'], ['this weekend', '這個週末']],
};
const agentFits = (d, p) => d.who === 'any' || (d.who === 'adult' ? ['My father', 'My mother', 'My parents', 'Our teacher', 'He', 'She', 'They'].includes(p.en) || /^[A-Z][a-z]+$/.test(p.en) : !['My father', 'My mother', 'My parents', 'Our teacher'].includes(p.en));
const be = (d, tense) => (tense === 'fut' ? 'be' : tense === 'past' ? (d.pl ? 'were' : 'was') : d.pl ? 'are' : 'is');
const byZh = (p, zh) => zhJoin('被', p.zh, zh);

function draw(rng, o, tenses) {
  const tense = rng.fresh(tenses, (x) => 'tense-' + x);
  // present: habits and states; past / future: habits and one-off deeds
  const d = rng.fresh(DEEDS.filter((x) => (o.level >= 2 || regular(x.v)) && (tense === 'pres' ? x.when !== 'once' : x.when !== 'state')), (x) => x.v + x.obj);
  const p = pickPerson(rng, (x) => agentFits(d, x) && x.pr !== 'I' && x.pr !== 'you');
  const [t, tz] = d.when === 'state' ? ['', ''] : rng.fresh(TIMES[tense], (x) => 'time-' + x[0]);
  return { tense, d, p, t, tz };
}
const tail = (t) => (t ? ' ' + t : '');
const agentObj = (p) => ({ he: 'him', she: 'her', they: 'them', we: 'us' }[p.pr] && /^(He|She|They|We)$/.test(p.en) ? { he: 'him', she: 'her', they: 'them', we: 'us' }[p.pr] : midOf(p));
const meta = (x, extra) => ({ tense: x.tense, base: x.d.v, pl: x.d.pl, obj: x.d.obj, ...extra });

const MODES = [
  {
    id: 'fill', name: '被動式填空', instruction: (o) => (o.level >= 3 ? '依括號提示與時間，填入 be 動詞與過去分詞（未來式用 will be）。' : '依括號提示與時間，填入 be 動詞與過去分詞。'),
    gen(rng, o) {
      const x = draw(rng, o, o.level >= 3 ? ['pres', 'past', 'fut'] : o.level >= 2 ? ['pres', 'past'] : ['pres']);
      const { tense, d, p, t, tz } = x;
      const f = forms(d.v);
      const bl = tense === 'fut' ? [blank('will'), ' ', blank('be'), ' ', blank(f.pp)] : [blank(be(d, tense)), ' ', blank(f.pp)];
      return { lines: [[`${cap(d.obj)} `, ...bl, ` (${d.v}) by ${agentObj(p)}${tail(t)}.`]], zh: zhJoin(d.objZh, tz, tense === 'fut' ? '會' : '', byZh(p, d.zh)) + '。', meta: meta(x, { kind: 'fill' }) };
    },
  },
  {
    id: 'change', name: '主動改被動', instruction: () => '把主動句改成被動句，填入 be 動詞與過去分詞（一個空格填一個字）。',
    gen(rng, o) {
      const x = draw(rng, o, o.level >= 2 ? ['pres', 'past'] : ['pres']);
      const { tense, d, p, t, tz } = x;
      const f = forms(d.v);
      const active = `${p.en} ${tense === 'past' ? f.past : verbFor(p, [f.base, f.s])} ${d.obj}${tail(t)}.`;
      return { lines: [[active], [`→ ${cap(d.obj)} `, blank(be(d, tense)), ' ', blank(f.pp), ` by ${agentObj(p)}${tail(t)}.`]], zh: zhJoin(d.objZh, tz, byZh(p, d.zh)) + '。', meta: meta(x, { kind: 'change' }) };
    },
  },
  {
    id: 'q', name: '被動式問句與簡答', instruction: () => '用 be 動詞完成被動式問句，並依提示簡答（否定請用縮寫）。',
    gen(rng, o) {
      const x = draw(rng, o, o.level >= 2 ? ['pres', 'past'] : ['pres']);
      const { tense, d, p, t, tz } = x;
      const f = forms(d.v), b = be(d, tense), yes = rng.chance(0.5), pr = d.pl ? 'they' : 'it';
      const neg = { is: "isn't", are: "aren't", was: "wasn't", were: "weren't" }[b];
      return {
        lines: [[blank(cap(b)), ` ${d.obj} `, blank(f.pp), ` (${d.v}) by ${agentObj(p)}${tail(t)}? — ${yes ? 'Yes' : 'No'}, `, blank(pr), ' ', blank(yes ? b : neg), '.']],
        zh: zhJoin(d.objZh, tz, byZh(p, d.zh)) + '嗎？', meta: meta(x, { kind: 'q', yes }),
      };
    },
  },
];

export default {
  id: 'passive',
  code: 'PSV',
  title: '被動語態',
  grade: 9,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['fill', 'change'], 2: ['fill', 'change', 'q'], 3: ['fill', 'change', 'q'] },
  levelHint: { 1: '現在式被動（is / are + 過去分詞），規則動詞。', 2: '加入過去式被動（was / were）、不規則過去分詞，以及問句與簡答。', 3: '再加入未來式被動（will be + 過去分詞）。' },
  grammarBox: (o) => ({ head: ['時態', '被動式', '例子'], rows: [
    ['現在', 'is / are + 過去分詞', 'The room is cleaned by Tom every day.'],
    ...(o.level >= 2 ? [['過去', 'was / were + 過去分詞', 'The letter was written by Amy yesterday.']] : []),
    ...(o.level >= 3 ? [['未來', 'will be + 過去分詞', 'The work will be done tomorrow.']] : []),
  ], note: 'be 動詞跟著「被動的主詞」變化（the dishes → are / were），做事的人放在 by 後面用受格（by him、by her）。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
