// Topic: linking verbs (look / sound / smell / taste / feel + adjective), sense verbs (see / hear / watch + O + V / V-ing)
// and causative verbs (make / let / have + O + V; ask / tell / want + O + to V).
import { blank, cap, zhJoin } from '../core.js';
import { pickPerson, verbFor, midOf } from '../people.js';

// ---------- linking verbs: adjective, not adverb ----------
// [subject, Chinese, linking verb, -s form, adjectives [en, zh]]
const L = (subj, zh, verb, s3, adjs) => ({ subj, zh, verb, s3, adjs });
const LINK = [
  L('The soup', '這道湯', 'taste', 'tastes', [['good', '好喝'], ['delicious', '好喝'], ['terrible', '難喝']]), L('The cake', '這個蛋糕', 'taste', 'tastes', [['sweet', '甜'], ['good', '好吃'], ['delicious', '好吃']]),
  L('The flowers', '這些花', 'smell', 'smell', [['good', '香'], ['nice', '香'], ['sweet', '香甜']]), L('The fish', '這條魚', 'smell', 'smells', [['bad', '臭'], ['terrible', '很臭'], ['fresh', '新鮮']]),
  L('The music', '這音樂', 'sound', 'sounds', [['nice', '好聽'], ['beautiful', '優美'], ['loud', '很大聲'], ['strange', '奇怪']]), L('Your idea', '你的主意', 'sound', 'sounds', [['great', '很棒'], ['good', '不錯'], ['interesting', '有趣'], ['strange', '奇怪']]),
  L('Your dress', '你的洋裝', 'look', 'looks', [['beautiful', '漂亮'], ['nice', '好看'], ['expensive', '很貴']]), L('Tom', 'Tom', 'look', 'looks', [['tired', '很累'], ['happy', '很開心'], ['sad', '很難過'], ['angry', '很生氣']]),
  L('The children', '孩子們', 'look', 'look', [['happy', '很開心'], ['tired', '很累'], ['hungry', '很餓']]), L('I', '我', 'feel', 'feel', [['tired', '很累'], ['happy', '很開心'], ['cold', '很冷'], ['nervous', '很緊張']]),
  L('The bed', '這張床', 'feel', 'feels', [['soft', '很軟'], ['comfortable', '很舒服'], ['hard', '很硬']]), L('The weather', '天氣', 'get', 'gets', [['cold', '變冷'], ['warm', '變暖']]),
  L('My grandfather', '我爺爺', 'get', 'gets', [['tired', '累了'], ['angry', '生氣了']]), L('The classroom', '教室', 'get', 'gets', [['quiet', '安靜下來'], ['noisy', '吵起來']]),
];
// the adverb shown beside each adjective (real adverbs only; hard / hardly is the classic trap)
const ADV = { good: 'well', delicious: 'deliciously', terrible: 'terribly', sweet: 'sweetly', nice: 'nicely', bad: 'badly', fresh: 'freshly', beautiful: 'beautifully', loud: 'loudly', strange: 'strangely', great: 'greatly',
  interesting: 'interestingly', expensive: 'expensively', tired: 'tiredly', happy: 'happily', sad: 'sadly', angry: 'angrily', hungry: 'hungrily', cold: 'coldly', nervous: 'nervously',
  soft: 'softly', comfortable: 'comfortably', hard: 'hardly', warm: 'warmly', quiet: 'quietly', noisy: 'noisily' };
const TIME_LINK = [['today', '今天'], ['now', '現在'], ['', '']];
const zhGet = (l, adj) => (l.verb === 'get' ? adj[1] : { taste: '嘗起來', smell: '聞起來', sound: '聽起來', look: '看起來', feel: `${l.subj === 'I' ? '覺得' : '摸起來'}` }[l.verb] + adj[1]);

// ---------- sense verbs: V (the whole thing) or V-ing (in progress) ----------
const SENSE = [['see', 'sees', 'saw', '看到'], ['hear', 'hears', 'heard', '聽到'], ['watch', 'watches', 'watched', '看著'], ['feel', 'feels', 'felt', '感覺到']];
// [object, Chinese, actions [base, -ing, Chinese], which sense verbs fit]
const S = (obj, zh, acts, senses) => ({ obj, zh, acts, senses });
const SCENES = [
  S('him', '他', [['play basketball', 'playing basketball', '打籃球'], ['cross the street', 'crossing the street', '過馬路'], ['dance', 'dancing', '跳舞'], ['leave the house', 'leaving the house', '離開房子']], ['see', 'watch']),
  S('her', '她', [['sing a song', 'singing a song', '唱歌'], ['cry', 'crying', '哭'], ['laugh', 'laughing', '笑'], ['call your name', 'calling your name', '叫你的名字']], ['hear', 'see']),
  S('the children', '孩子們', [['play in the park', 'playing in the park', '在公園玩'], ['sing', 'singing', '唱歌'], ['run to school', 'running to school', '跑去學校']], ['see', 'watch', 'hear']),
  S('the dog', '那隻狗', [['run across the road', 'running across the road', '跑過馬路'], ['bark', 'barking', '叫'], ['eat the cake', 'eating the cake', '吃蛋糕']], ['see', 'watch', 'hear']),
  S('someone', '有人', [['knock on the door', 'knocking on the door', '敲門'], ['open the door', 'opening the door', '開門'], ['come in', 'coming in', '進來']], ['hear', 'see']),
  S('the birds', '鳥', [['sing in the tree', 'singing in the tree', '在樹上唱歌'], ['fly away', 'flying away', '飛走']], ['hear', 'see', 'watch']),
  S('the house', '房子', [['shake', 'shaking', '搖晃']], ['feel']), S('my heart', '我的心', [['beat fast', 'beating fast', '跳得很快']], ['feel']),
];
const CUE = { whole: '全程', going: '正在' };

// ---------- causative and ask / tell / want ----------
// [verb, -s, past, Chinese, takes 'base' or 'to']
const C = (base, s3, past, zh, takes) => ({ base, s3, past, zh, takes });
const CAUSE = [C('make', 'makes', 'made', '叫', 'base'), C('let', 'lets', 'let', '讓', 'base'), C('have', 'has', 'had', '叫', 'base'), C('ask', 'asks', 'asked', '要求', 'to'), C('tell', 'tells', 'told', '叫', 'to'), C('want', 'wants', 'wanted', '要', 'to'), C('help', 'helps', 'helped', '幫', 'base')];
const TASKS = [['clean the room', '打掃房間'], ['do the dishes', '洗碗'], ['wait outside', '在外面等'], ['stay at home', '待在家裡'], ['finish the homework', '把功課做完'], ['be quiet', '安靜'], ['go to bed early', '早點睡'],
  ['carry the boxes', '搬箱子'], ['close the window', '關窗戶'], ['turn off the television', '關電視'], ['study hard', '用功讀書'], ['wash the car', '洗車']];
const OBJS = [['me', '我'], ['him', '他'], ['her', '她'], ['us', '我們'], ['them', '他們'], ['the children', '孩子們'], ['the students', '學生們']];
const okObj = (p, o) => !((p.pr === 'I' && ['me', 'us'].includes(o)) || (p.pr === 'we' && ['us', 'me'].includes(o)) || (p.pr === 'he' && o === 'him') || (p.pr === 'she' && o === 'her') || (p.pr === 'they' && o === 'them'));

const MODES = [
  {
    id: 'link', name: '連綴動詞 + 形容詞', instruction: () => '連綴動詞（look、sound、smell、taste、feel、get）後面接形容詞：從括號裡選出正確的字。',
    gen(rng, o) {
      const l = rng.fresh(LINK, (x) => x.subj + x.verb);
      const [adj, az] = rng.fresh(l.adjs, (x) => 'adj-' + x[0]);
      const [t, tz] = ['look', 'feel', 'get'].includes(l.verb) ? rng.pick(TIME_LINK) : ['', ''];
      const pair = rng.chance(0.5) ? `${adj}／${ADV[adj]}` : `${ADV[adj]}／${adj}`;
      return { lines: [[`${l.subj} ${l.s3} `, blank(adj), `${t ? ' ' + t : ''}. (${pair})`]], zh: zhJoin(l.zh, tz, zhGet(l, [adj, az])) + '。', meta: { kind: 'link', verb: l.verb, adj } };
    },
  },
  {
    id: 'sense', name: '感官動詞 + 受詞 + V / V-ing', instruction: () => '感官動詞後面：看到整個過程用原形，看到正在進行用 V-ing。依括號裡的中文填入。',
    gen(rng, o) {
      const sc = rng.fresh(SCENES, (x) => x.obj);
      const [v, vs, vp, vz] = rng.fresh(SENSE.filter((x) => sc.senses.includes(x[0])), (x) => x[0]);
      const [base, ing, az] = rng.pick(sc.acts);
      const going = rng.fresh([true, false], (x) => 'going-' + x);
      const p = pickPerson(rng, (x) => !(sc.obj === 'him' && x.pr === 'he') && !(sc.obj === 'her' && x.pr === 'she') && !(sc.obj === 'my heart' && x.en !== 'I'));
      const past = rng.chance(0.8);
      const verb = past ? vp : verbFor(p, [v, vs]);
      const [t, tz] = past ? rng.pick([['yesterday', '昨天'], ['last night', '昨晚'], ['this morning', '今天早上'], ['just now', '剛才']]) : ['', ''];
      const b = base.split(' ')[0], rest = base.slice(b.length);
      return {
        lines: [[`${p.en} ${verb} ${sc.obj} `, blank(going ? ing.split(' ')[0] : b), `${rest}${t ? ' ' + t : ''}. (${CUE[going ? 'going' : 'whole']}／${b})`]],
        zh: zhJoin(p.zh, tz, `${vz}${sc.zh}${going ? (az.startsWith('在') ? '正' : '正在') : ''}${az}`) + '。', meta: { kind: 'sense', verb: v, base: b, going },
      };
    },
  },
  {
    id: 'cause', name: '使役動詞與 ask / tell / want', instruction: () => 'make、let、have、help 後面接原形動詞；ask、tell、want 後面接 to + 原形。依括號提示填入（空格可填一個或兩個字）。',
    gen(rng, o) {
      const c = rng.fresh(CAUSE, (x) => x.base);
      const [task, tz] = rng.fresh(TASKS, (x) => x[0]);
      const p = pickPerson(rng);
      const [ob, oz] = rng.pick(OBJS.filter(([x]) => okObj(p, x)));
      const past = o.level >= 2 && rng.chance(0.4);
      const verb = past ? c.past : verbFor(p, [c.base, c.s3]);
      const b = task.split(' ')[0], rest = task.slice(b.length);
      const ans = c.takes === 'to' ? `to ${b}` : b;
      const zhV = c.base === 'help' ? `幫${oz}${tz}` : c.base === 'let' ? `讓${oz}${tz}` : c.base === 'want' ? `要${oz}${tz}` : c.base === 'ask' ? `要求${oz}${tz}` : `叫${oz}${tz}`;
      return { lines: [[`${p.en} ${verb} ${ob} `, blank(ans, true), `${rest}. (${b})`]], zh: zhJoin(p.zh, past ? '那時' : '', zhV) + '。', meta: { kind: 'cause', verb: c.base, base: b, takes: c.takes } };
    },
  },
];

export default {
  id: 'sense',
  code: 'SNS',
  title: '連綴、感官與使役動詞',
  grade: 9,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  defaultModes: { 1: ['link'], 2: ['link', 'sense'], 3: ['link', 'sense', 'cause'] },
  levelHint: { 1: '連綴動詞後接形容詞（not 副詞）。', 2: '加入感官動詞 see / hear / watch / feel + 受詞 + 原形或 V-ing。', 3: '再加入使役動詞 make / let / have / help 與 ask / tell / want + 受詞 + to V。' },
  grammarBox: (o) => ({ head: ['動詞', '後面接', '例子'], rows: [
    ['look、sound、smell、taste、feel、get、turn', '形容詞', 'The soup tastes good.（不是 well）'],
    ...(o.level >= 2 ? [['see、hear、watch、feel + 受詞', '原形（全程）／V-ing（正在）', 'I saw him cross the street. / I saw him crossing the street.']] : []),
    ...(o.level >= 3 ? [['make、let、have、help + 受詞', '原形', 'My mother made me clean the room.'], ['ask、tell、want + 受詞', 'to + 原形', 'The teacher told us to be quiet.']] : []),
  ], note: '連綴動詞描述主詞的狀態，所以接形容詞；感官與使役動詞後面的受詞做動作，動詞用原形。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
