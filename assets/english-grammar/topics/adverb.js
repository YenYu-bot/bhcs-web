// Topic: adverbs — forming them (slow → slowly, happy → happily, good → well, fast → fast), adjective or adverb, and comparing adverbs.
import { blank, cap, zhJoin } from '../core.js';
import { pickPerson, verbFor, midOf } from '../people.js';
import { mealFits } from '../vcommon.js';

// [adjective, adverb, Chinese (adverb), spelling rule, comparative of the adverb, verb phrases it goes with [base, -s, past, rest, Chinese]]
const A = (adj, adv, zh, rule, cmp, acts) => ({ adj, adv, zh, rule, cmp, acts });
const ADVS = [
  A('slow', 'slowly', '慢慢地', 'ly', 'more slowly', [['walk', 'walks', 'walked', '', '走路'], ['drive', 'drives', 'drove', '', '開車'], ['speak', 'speaks', 'spoke', '', '說話'], ['eat', 'eats', 'ate', '', '吃']]),
  A('quick', 'quickly', '很快地', 'ly', 'more quickly', [['run', 'runs', 'ran', '', '跑'], ['answer', 'answers', 'answered', ' the question', '回答問題'], ['finish', 'finishes', 'finished', ' the work', '完成工作'], ['eat', 'eats', 'ate', ' lunch', '吃午餐']]),
  A('careful', 'carefully', '小心地', 'ly', 'more carefully', [['drive', 'drives', 'drove', '', '開車'], ['listen', 'listens', 'listened', '', '聽'], ['read', 'reads', 'read', ' the letter', '讀信'], ['cross', 'crosses', 'crossed', ' the street', '過馬路']]),
  A('loud', 'loudly', '大聲地', 'ly', 'more loudly', [['speak', 'speaks', 'spoke', '', '說話'], ['sing', 'sings', 'sang', '', '唱歌'], ['laugh', 'laughs', 'laughed', '', '笑'], ['talk', 'talks', 'talked', '', '講話']]),
  A('quiet', 'quietly', '安靜地', 'ly', 'more quietly', [['speak', 'speaks', 'spoke', '', '說話'], ['sit', 'sits', 'sat', ' in the corner', '坐在角落'], ['close', 'closes', 'closed', ' the door', '關門'], ['read', 'reads', 'read', '', '看書']]),
  A('polite', 'politely', '有禮貌地', 'ly', 'more politely', [['speak', 'speaks', 'spoke', ' to the teacher', '跟老師說話'], ['answer', 'answers', 'answered', '', '回答'], ['ask', 'asks', 'asked', ' for help', '請求幫忙']]),
  A('beautiful', 'beautifully', '優美地', 'ly', 'more beautifully', [['sing', 'sings', 'sang', '', '唱歌'], ['dance', 'dances', 'danced', '', '跳舞'], ['write', 'writes', 'wrote', '', '寫字'], ['play', 'plays', 'played', ' the piano', '彈鋼琴']]),
  A('happy', 'happily', '開心地', 'ily', 'more happily', [['sing', 'sings', 'sang', '', '唱歌'], ['smile', 'smiles', 'smiled', '', '微笑'], ['play', 'plays', 'played', ' in the park', '在公園玩'], ['dance', 'dances', 'danced', '', '跳舞']]),
  A('easy', 'easily', '輕鬆地', 'ily', 'more easily', [['win', 'wins', 'won', ' the game', '贏得比賽'], ['pass', 'passes', 'passed', ' the test', '通過考試'], ['answer', 'answers', 'answered', ' the question', '回答問題'], ['carry', 'carries', 'carried', ' the box', '搬箱子']]),
  A('angry', 'angrily', '生氣地', 'ily', 'more angrily', [['speak', 'speaks', 'spoke', '', '說話'], ['look at', 'looks at', 'looked at', ' me', '看我'], ['leave', 'leaves', 'left', ' the room', '離開房間']]),
  A('good', 'well', '很會', 'irr', 'better', [['sing', 'sings', 'sang', '', '唱歌'], ['cook', 'cooks', 'cooked', '', '煮飯'], ['play', 'plays', 'played', ' basketball', '打籃球'], ['swim', 'swims', 'swam', '', '游泳']]),
  A('fast', 'fast', '很快', 'same', 'faster', [['run', 'runs', 'ran', '', '跑'], ['drive', 'drives', 'drove', '', '開車'], ['swim', 'swims', 'swam', '', '游泳'], ['walk', 'walks', 'walked', '', '走路']]),
  A('hard', 'hard', '努力地', 'same', 'harder', [['work', 'works', 'worked', '', '工作'], ['study', 'studies', 'studied', '', '讀書'], ['practice', 'practices', 'practiced', '', '練習']]),
  A('late', 'late', '很晚', 'same', 'later', [['get up', 'gets up', 'got up', '', '起床'], ['come home', 'comes home', 'came home', '', '回家'], ['arrive', 'arrives', 'arrived', '', '到達']]),
  A('early', 'early', '很早', 'same', 'earlier', [['get up', 'gets up', 'got up', '', '起床'], ['arrive', 'arrives', 'arrived', '', '到達'], ['leave', 'leaves', 'left', '', '離開']]),
];
const RULES = { 1: ['ly', 'same'], 2: ['ly', 'ily', 'same', 'irr'], 3: ['ly', 'ily', 'same', 'irr'] };
const pool = (o) => ADVS.filter((a) => RULES[o.level].includes(a.rule));
// nouns for "a careful driver": adjective → person noun
const DOER = { slow: null, quick: null, // "a fast runner", not "a quick runner"
  careful: ['driver', '司機'], loud: ['singer', '歌手'], quiet: ['student', '學生'], polite: ['child', '孩子', ['speak', 'speaks', '說話']], beautiful: ['dancer', '舞者'], happy: ['child', '孩子'],
  easy: null, angry: null, good: ['cook', '廚師'], fast: ['runner', '跑者'], hard: ['worker', '工作者'], late: null, early: null };
const DOER_VERB = { walker: ['walk', 'walks', '走路'], runner: ['run', 'runs', '跑'], driver: ['drive', 'drives', '開車'], singer: ['sing', 'sings', '唱歌'], student: ['study', 'studies', '讀書'], boy: ['speak', 'speaks', '說話'],
  dancer: ['dance', 'dances', '跳舞'], child: ['play', 'plays', '玩'], cook: ['cook', 'cooks', '煮飯'], worker: ['work', 'works', '工作'] };
const ADJ_ZH = { slow: '慢', quick: '快', careful: '小心', loud: '大聲', quiet: '安靜', polite: '有禮貌', beautiful: '優美', happy: '快樂', good: '很棒', fast: '快', hard: '努力' };
// Chinese says how well or fast something is done with 得: 跑得很快、唱得很好、走得很慢 (not 很快跑).
//   DE: the 得 phrase for these adverbs; DE_VERB: the verb as it stands before 得 (開車開得很快).
const DE = { fast: '很快', quick: '很快', slow: '很慢', good: '很好', loud: '很大聲', beautiful: '很優美' };
const DE_VERB = { 走路: '走', 跑: '跑', 開車: '開車開', 游泳: '游', 說話: '說', 吃: '吃', 唱歌: '唱', 煮飯: '煮', 跳舞: '跳', 工作: '工作', 讀書: '讀書讀', 練習: '練習', 聽: '聽', 寫字: '寫字寫', 講話: '講' };
const CORE = (a) => (a.rule === 'irr' ? '好' : a.zh.replace(/地$/, '').replace(/^很/, ''));
/** "跑得很快" where Chinese uses 得, else "慢慢地走路" / "很會唱歌". */
const zhManner = (a, vz) => (DE[a.adj] && DE_VERB[vz] ? `${DE_VERB[vz]}得${DE[a.adj]}` : a.zh + vz);
/** "跑得比 Tom 快", or "跟老師說話比 Tony 有禮貌" when the verb has an object. */
const zhCompare = (a, vz, other) => zhJoin(DE_VERB[vz] ? `${DE_VERB[vz]}得比` : `${vz}比`, other, CORE(a));
const TIMES = [['yesterday', '昨天'], ['last night', '昨晚'], ['this morning', '今天早上']];

function draw(rng, o, test = () => true) {
  const a = rng.fresh(pool(o).filter(test), (x) => x.adj);
  const act = rng.pick(a.acts);
  const p = pickPerson(rng);
  const past = o.level >= 2 && rng.chance(0.4);
  const [t, tz] = past ? rng.pick(TIMES.filter((x) => mealFits(act[3], x[0]) && !(act[0] === 'come home' && x[0] === 'this morning'))) : ['', ''];
  const verb = past ? act[2] : verbFor(p, [act[0], act[1]]);
  return { a, act, p, past, t, tz, verb };
}

const MODES = [
  {
    id: 'form', name: '形容詞改副詞', instruction: () => '依括號裡的形容詞，填入正確的副詞（注意 good → well，fast / hard / late / early 不變）。',
    gen(rng, o) {
      const d = draw(rng, o);
      const { a, act, p, t, tz, verb } = d;
      return { lines: [[`${p.en} ${verb}${act[3]} `, blank(a.adv), `${t ? ' ' + t : ''}. (${a.adj})`]], zh: zhJoin(p.zh, tz, zhManner(a, act[4])) + '。', meta: { kind: 'form', adj: a.adj, subj: p.en } };
    },
  },
  {
    id: 'choose', name: '形容詞或副詞', instruction: () => '形容詞修飾名詞（a careful driver），副詞修飾動詞（drives carefully）：依括號填入正確的字。',
    gen(rng, o) {
      const a = rng.fresh(pool(o).filter((x) => DOER[x.adj]), (x) => 'c-' + x.adj);
      const [noun, nz] = DOER[a.adj];
      const [vb, vs, vz] = DOER[a.adj][2] ?? DOER_VERB[noun]; // a happy child plays, a polite child speaks
      const p = pickPerson(rng, (x) => x.s3 && !['Our teacher', 'My classmate', 'The students'].includes(x.en));
      const first = rng.chance(0.5);
      const art = /^[aeiou]/.test(a.adj) ? 'an' : 'a';
      const line = first
        ? [`${p.en} is ${art} `, blank(a.adj), ` ${noun}. ${p.pr === 'she' ? 'She' : 'He'} ${vs} `, blank(a.adv), `. (${a.adj})`]
        : [`${p.en} ${vs} `, blank(a.adv), `. ${p.pr === 'she' ? 'She' : 'He'} is ${art} `, blank(a.adj), ` ${noun}. (${a.adj})`];
      return { lines: [line], zh: zhJoin(p.zh, `是個${ADJ_ZH[a.adj]}的${nz}，${p.pr === 'she' ? '她' : '他'}${zhManner(a, vz)}`) + '。', meta: { kind: 'choose', adj: a.adj, first } };
    },
  },
  {
    id: 'compare', name: '副詞比較級', instruction: () => '依括號提示填入副詞的比較級（-er、more …、better）。',
    gen(rng, o) {
      const d = draw(rng, { ...o, level: Math.max(o.level, 2) });
      const { a, act, p, verb, past } = d;
      const other = pickPerson(rng, (x) => x.en !== p.en && x.pr !== 'I' && x.pr !== 'we' && !/^(He|She|They|You)$/.test(x.en));
      const obj = midOf(other);
      const objZh = other.zh;
      const bl = a.cmp.split(' ').flatMap((w, i) => (i ? [' ', blank(w)] : [blank(w)]));
      const vb = past ? act[2] : verbFor(p, [act[0], act[1]]);
      return { lines: [[`${p.en} ${vb}${act[3]} `, ...bl, ` (${a.adj}) than ${obj}.`]], zh: zhJoin(p.zh, zhCompare(a, act[4], objZh)) + '。', meta: { kind: 'compare', adj: a.adj } };
    },
  },
];

export default {
  id: 'adverb',
  code: 'ADV',
  title: '副詞 slowly / well / fast',
  grade: 8,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['form'], 2: ['form', 'choose'], 3: ['form', 'choose', 'compare'] },
  levelHint: { 1: '形容詞加 -ly；fast、hard、late、early 不變。', 2: '加入 -y 改 -ily、good → well，以及形容詞與副詞的選擇。', 3: '再加入副詞比較級。' },
  grammarBox: (o) => ({ head: ['規則', '例子'], rows: [
    ['形容詞 + ly', 'slow → slowly、careful → carefully'], ['形容詞與副詞同形', 'fast、hard、late、early'],
    ...(o.level >= 2 ? [['子音 + y → ily', 'happy → happily、easy → easily'], ['不規則', 'good → well'], ['形容詞修飾名詞，副詞修飾動詞', 'a careful driver / drives carefully']] : []),
    ...(o.level >= 3 ? [['副詞比較級', 'faster、harder、more carefully、better']] : []),
  ], note: 'hardly（幾乎不）和 lately（最近）意思不同，不是 hard、late 的副詞。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
