// Topic: to V or V-ing after a verb (want to go / enjoy going), after a preposition (good at swimming), and go + V-ing.
import { blank, cap, zhJoin } from '../core.js';
import { VERBS, FRAMES, phrase } from '../verbs.js';
import { actors, pickSubject, frameFits, third } from '../vcommon.js';

// Verbs and what follows them. s3 is the -s form, past the past form (level 3 mixes tenses in by the time word).
//   acts: which activities (frame verbs) make sense after it; pastOk: whether it reads well in the past tense
//   either: takes both forms with the same meaning (start, like, love, begin) — kept out of the fixed-answer sections, shown in the grammar box
const V = (base, s3, past, zh, takes, acts, pastOk = true, either = false) => ({ base, s3, past, zh, takes, acts, pastOk, either });
const SKILLS = ['play', 'swim', 'dance', 'sing', 'draw', 'paint', 'cook', 'bake', 'ride', 'skate', 'drive', 'fix', 'use', 'make', 'write', 'read', 'speak', 'teach'];
const OUTINGS = ['visit', 'travel', 'see', 'climb', 'go', 'take', 'meet', 'shop', 'fly', 'catch', 'swim', 'ride', 'play'];
const CHORES = ['clean', 'wash', 'cook', 'bake', 'fix', 'feed', 'walk', 'brush', 'plant', 'carry', 'move', 'help', 'buy', 'do', 'study', 'practice', 'write', 'read', 'paint', 'draw', 'make'];
const HEADS = [
  V('want', 'wants', 'wanted', '想要', 'to', [...OUTINGS, ...SKILLS, 'eat', 'drink', 'buy', 'watch', 'listen', 'sleep', 'study']),
  V('hope', 'hopes', 'hoped', '希望', 'to', OUTINGS, false), V('plan', 'plans', 'planned', '計畫', 'to', [...OUTINGS, ...CHORES, 'learn', 'watch']),
  V('decide', 'decides', 'decided', '決定', 'to', [...OUTINGS, ...CHORES, 'learn', 'get', 'walk', 'stay']), V('need', 'needs', 'needed', '需要', 'to', [...CHORES, 'get', 'go', 'take', 'sleep', 'use', 'call', 'borrow']),
  V('learn', 'learns', 'learned', '學', 'to', SKILLS), V('would like', 'would like', 'would like', '想要', 'to', [...OUTINGS, ...SKILLS, 'eat', 'drink', 'watch', 'listen', 'buy'], false),
  V('start', 'starts', 'started', '開始', 'to', [...SKILLS, 'clean', 'study', 'read', 'watch', 'walk', 'jog', 'cry', 'smile'], true, true),
  V('enjoy', 'enjoys', 'enjoyed', '喜歡', 'ing', [...OUTINGS, ...SKILLS, 'watch', 'listen', 'jog', 'walk', 'eat', 'sit']),
  V('finish', 'finishes', 'finished', '完成', 'ing', [...CHORES, 'eat', 'watch', 'use']), V('practice', 'practices', 'practiced', '練習', 'ing', SKILLS),
  V('keep', 'keeps', 'kept', '一直', 'ing', ['play', 'read', 'study', 'practice', 'sing', 'dance', 'run', 'walk', 'jog', 'draw', 'watch', 'write', 'swim', 'use', 'cry', 'smile', 'talk', 'wait']),
  V('avoid', 'avoids', 'avoided', '避免', 'ing', ['eat', 'drink', 'use', 'go', 'run', 'watch', 'play', 'buy', 'swim', 'drive', 'climb']),
  V('give up', 'gives up', 'gave up', '放棄', 'ing', ['play', 'watch', 'learn', 'study', 'practice', 'swim', 'draw', 'collect', 'run', 'climb', 'skate', 'paint', 'ride']),
];
// Activities that follow a preposition or before / after (things anyone does).
const ACTS = new Set(['play', 'swim', 'dance', 'sing', 'draw', 'read', 'cook', 'travel', 'study', 'learn', 'visit', 'watch', 'ride', 'climb', 'jog', 'skate', 'paint', 'bake', 'fix', 'clean', 'write', 'take', 'buy', 'see', 'go', 'eat', 'drink', 'practice', 'use', 'feed', 'walk', 'plant', 'help', 'make', 'listen', 'wash']);
// [phrase, kind ('be' changes am / is / are; 'v' takes -s), activities that fit]
const PREPS = [
  ['is good at', 'be', SKILLS], ['is interested in', 'be', [...SKILLS, 'travel', 'visit', 'study', 'learn', 'collect', 'watch']], ['is afraid of', 'be', ['swim', 'ride', 'climb', 'drive', 'fly', 'speak', 'sing', 'dance']],
  ['is tired of', 'be', ['clean', 'wash', 'study', 'read', 'watch', 'eat', 'play', 'listen', 'wait', 'do']], ['thanks you for', 'v', ['help', 'cook', 'bake', 'make', 'clean', 'wash', 'fix', 'bring', 'feed', 'carry', 'teach', 'call']],
  ['talks about', 'v', ['travel', 'visit', 'buy', 'go', 'see', 'learn', 'study', 'play', 'climb', 'move']], ['thinks about', 'v', ['travel', 'visit', 'buy', 'learn', 'study', 'move', 'go', 'see']], ['is excited about', 'be', [...OUTINGS, 'learn', 'play', 'watch']],
];
const PREP_ZH = { 'is good at': (zh) => `很擅長${zh}`, 'is interested in': (zh) => `對${zh}有興趣`, 'is afraid of': (zh) => `害怕${zh}`, 'is tired of': (zh) => `厭倦了${zh}`,
  'thanks you for': (zh) => `謝謝你${zh}`, 'talks about': (zh) => `談到${zh}`, 'thinks about': (zh) => `想到${zh}`, 'is excited about': (zh) => `對${zh}很興奮` };
const BEFORE_AFTER = [['before', '…之前'], ['after', '…之後']];
const GO = [['swimming', '游泳', 'swim'], ['shopping', '購物', 'shop'], ['fishing', '釣魚', 'fish'], ['hiking', '健行', 'hike'], ['camping', '露營', 'camp'], ['skating', '溜冰', 'skate'], ['jogging', '慢跑', 'jog'], ['dancing', '跳舞', 'dance']];
const GO_WHEN = [['on weekends', '週末'], ['every Sunday', '每個星期天'], ['after school', '放學後'], ['in summer', '夏天'], ['with my family', '和家人']];
const GO_FOR = { swimming: ['on weekends', 'in summer', 'every Sunday'], shopping: ['on weekends', 'with my family', 'every Sunday'], fishing: ['on weekends', 'with my family'], hiking: ['on weekends', 'every Sunday', 'with my family'],
  camping: ['in summer', 'with my family'], skating: ['on weekends', 'after school'], jogging: ['after school', 'every Sunday'], dancing: ['after school', 'on weekends'] };

const person = (rng, o) => pickSubject(rng, actors(rng, o.level, { exclude: (x) => x.kind !== 'person' || x.tags.includes('every') || x.tags.includes('group') }));
function act(rng, s, allowed = ACTS) {
  const ok = allowed instanceof Set ? allowed : new Set(allowed);
  const list = FRAMES.filter((f) => ok.has(f.v) && frameFits(f, s) && !f.age && f.habit);
  return rng.fresh(list, (x) => x.v);
}
const headForm = (h, s, tense) => (tense === 'past' ? h.past : third(s) ? h.s3 : h.base);
const PAST_CUE = [['yesterday', '昨天'], ['last week', '上星期'], ['last night', '昨晚']];

function sentence(rng, o, takes, wide = false) {
  const s = person(rng, o); if (!s) return null;
  const heads = HEADS.filter((h) => h.takes === takes && !h.either);
  const h = rng.fresh(heads, (x) => x.base);
  const f = act(rng, s, h.acts); if (!f) return null;
  const tense = o.level >= 3 && h.pastOk && rng.chance(0.3) ? 'past' : 'pres';
  const [t, tz] = tense === 'past' ? rng.pick(PAST_CUE) : ['', ''];
  const vp = takes === 'to' ? `to ${f.v}` : VERBS[f.v].ing;
  const bl = wide ? [blank(vp, true)] : takes === 'to' ? [blank('to'), ' ', blank(f.v)] : [blank(VERBS[f.v].ing)];
  return {
    lines: [[`${cap(s.en)} ${headForm(h, s, tense)} `, ...bl, ` (${f.v})${phrase(f)}${t ? ' ' + t : ''}.`]],
    zh: zhJoin(s.zh, tz, h.zh + f.zh) + '。', meta: { subj: s.en, head: h.base, base: f.v, takes, tense },
  };
}

// Verbs that take both forms with different meanings. [sentence with # for the blank, verb, form, Chinese cue shown in brackets, Chinese line]
//   stop to V 停下來去做 / stop V-ing 停止做；remember / forget to V 記得、忘了「要」做 / V-ing 記得、忘了「曾經」做過；try to V 設法 / try V-ing 試試看
const BOTH = [
  ['Tom stopped # to Amy on his way home.', 'talk', 'to', '停下來去', 'Tom 回家的路上停下來和 Amy 說話。'], ['Tom stopped # and listened to the teacher.', 'talk', 'ing', '停止', 'Tom 停止說話，聽老師講。'],
  ['We stopped # some water on the way.', 'buy', 'to', '停下來去', '我們在路上停下來買些水。'], ['We stopped # cookies last month.', 'buy', 'ing', '停止', '我們上個月不再買餅乾了。'],
  ['She stopped # a picture of the flowers.', 'take', 'to', '停下來去', '她停下來拍那些花的照片。'], ['She stopped # pictures and went home.', 'take', 'ing', '停止', '她停止拍照，然後回家。'],
  ['My father stopped # the sign.', 'read', 'to', '停下來去', '我爸爸停下來看那個告示。'], ['My father stopped # the newspaper and had dinner.', 'read', 'ing', '停止', '我爸爸停止看報紙，去吃晚餐。'],
  ['They stopped # with the dog in the park.', 'play', 'to', '停下來去', '他們停下來在公園和狗玩。'], ['They stopped # when the rain came.', 'play', 'ing', '停止', '雨來的時候，他們停止玩耍。'],
  ['Remember # the door before you leave.', 'lock', 'to', '記得要', '離開前記得要鎖門。'], ['I remember # the door this morning.', 'lock', 'ing', '記得曾經', '我記得今天早上鎖過門。'],
  ['Please remember # me tonight.', 'call', 'to', '記得要', '今晚請記得打電話給我。'], ['I remember # you last night.', 'call', 'ing', '記得曾經', '我記得昨晚打過電話給你。'],
  ['Did you remember # your umbrella?', 'bring', 'to', '記得要', '你有記得帶雨傘嗎？'], ['I remember # her at the party.', 'meet', 'ing', '記得曾經', '我記得在派對上見過她。'],
  ['He remembered # off the lights.', 'turn', 'to', '記得要', '他記得要關燈。'], ['He remembers # off the lights last night.', 'turn', 'ing', '記得曾經', '他記得昨晚關過燈。'],
  ["Don't forget # your homework.", 'do', 'to', '忘了要', '別忘了寫功課。'], ['I will never forget # the farm last year.', 'visit', 'ing', '忘了曾經', '我永遠不會忘記去年去過那座農場。'],
  ['She forgot # the cat this morning.', 'feed', 'to', '忘了要', '她今天早上忘了餵貓。'], ['I will never forget # the sea for the first time.', 'see', 'ing', '忘了曾經', '我永遠不會忘記第一次看到海。'],
  ['He forgot # his books to school.', 'bring', 'to', '忘了要', '他忘了帶書到學校。'], ['I will never forget # him for the first time.', 'meet', 'ing', '忘了曾經', '我永遠不會忘記第一次見到他。'],
  ['I tried # the window, but it was too heavy.', 'open', 'to', '設法', '我設法打開窗戶，但它太重了。'], ['Try # the window; the room is hot.', 'open', 'ing', '試試看', '試試看開窗戶，房間很熱。'],
  ['She tried # you, but you were not at home.', 'call', 'to', '設法', '她設法打電話給你，但你不在家。'], ["If the door doesn't open, try # it.", 'push', 'ing', '試試看', '如果門打不開，試試看推它。'],
  ['He tried # the test in an hour.', 'finish', 'to', '設法', '他設法在一小時內寫完考卷。'], ['Try # more vegetables.', 'eat', 'ing', '試試看', '試試看多吃蔬菜。'],
  ['They tried # the mountain but failed.', 'climb', 'to', '設法', '他們設法爬那座山，但失敗了。'], ['Try # a walk after dinner.', 'take', 'ing', '試試看', '試試看晚餐後散步。'],
];
const BOTH_HEAD = { 停下來去: 'stop', 停止: 'stop', 記得要: 'remember', 記得曾經: 'remember', 忘了要: 'forget', 忘了曾經: 'forget', 設法: 'try', 試試看: 'try' };
const VERBS_ING = { talk: 'talking', buy: 'buying', take: 'taking', read: 'reading', play: 'playing', lock: 'locking', call: 'calling', meet: 'meeting', turn: 'turning', visit: 'visiting', see: 'seeing', open: 'opening', push: 'pushing', eat: 'eating' };

const MODES = [
  { id: 'to', name: '接 to + 原形', instruction: () => '依括號提示，填入 to + 原形動詞（一個空格填一個字）。', gen: (rng, o) => sentence(rng, o, 'to') },
  { id: 'ing', name: '接 V-ing', instruction: () => '依括號提示，填入動詞的 -ing 形式。', gen: (rng, o) => sentence(rng, o, 'ing') },
  {
    id: 'prep', name: '介系詞後與 go + V-ing', instruction: () => '依括號提示，填入 -ing 形式（介系詞後面，以及 go 後面的活動）。',
    gen(rng, o) {
      const s = person(rng, o); if (!s) return null;
      const kind = rng.fresh(['prep', 'go', 'before'], (x) => 'prep-' + x);
      if (kind === 'go') {
        const [g, gz, base] = rng.fresh(GO, (x) => x[0]);
        const [w, wz] = rng.pick(GO_WHEN.filter((x) => GO_FOR[g].includes(x[0]) && !(x[0] === 'after school' && s.age === 'adult') && !(x[0] === 'with my family' && !/^(I|my )/.test(s.en))));
        const goes = third(s) ? 'goes' : 'go';
        return { lines: [[`${cap(s.en)} ${goes} `, blank(g), ` (${base}) ${w}.`]], zh: zhJoin(s.zh, wz, `去${gz}`) + '。', meta: { subj: s.en, head: 'go', base, takes: 'ing' } };
      }
      if (kind === 'before') {
        const f = act(rng, s); if (!f) return null;
        const [p, pz] = rng.pick(BEFORE_AFTER);
        const f2 = rng.fresh(FRAMES.filter((x) => ACTS.has(x.v) && x.v !== f.v && frameFits(x, s) && !x.age && x.habit), (x) => 'b-' + x.v); if (!f2) return null;
        const v = third(s) ? VERBS[f2.v].s : VERBS[f2.v].base;
        return { lines: [[`${cap(s.en)} ${v}${phrase(f2)} ${p} `, blank(VERBS[f.v].ing), ` (${f.v})${phrase(f)}.`]], zh: zhJoin(s.zh, `${f.zh}${pz.replace('…', '')}${f2.zh}`) + '。', meta: { subj: s.en, head: p, base: f.v, takes: 'ing' } };
      }
      const [pe, kindP, acts] = rng.fresh(PREPS, (x) => x[0]);
      const f = act(rng, s, acts); if (!f) return null;
      const head = kindP === 'be' ? pe.replace(/^is/, third(s) ? 'is' : s.en === 'I' ? 'am' : 'are') : third(s) ? pe : pe.replace(/^(\w+)s /, '$1 ');
      return { lines: [[`${cap(s.en)} ${head} `, blank(VERBS[f.v].ing), ` (${f.v})${phrase(f)}.`]], zh: zhJoin(s.zh, PREP_ZH[pe](f.zh)) + '。', meta: { subj: s.en, head: pe, base: f.v, takes: 'ing' } };
    },
  },
  {
    id: 'both', name: '兩種都可以但意思不同', instruction: () => 'stop、remember、forget、try 接 to V 和 V-ing 意思不同：依括號裡的中文填入 to + 原形或 -ing（空格可填一個或兩個字）。',
    gen(rng) {
      const [en, verb, form, cue, zh] = rng.fresh(BOTH, (x) => x[0]);
      const [l, r] = en.split('#');
      return { lines: [[l, blank(form === 'to' ? `to ${verb}` : VERBS_ING[verb], true), `${r} (${cue}／${verb})`]], zh, meta: { head: BOTH_HEAD[cue], base: verb, takes: form, cue } };
    },
  },
  {
    id: 'mix', name: 'to 或 -ing', instruction: () => '看前面的動詞，填入 to + 原形或 -ing（空格可填一個或兩個字）。',
    gen(rng, o) { return sentence(rng, o, rng.fresh(['to', 'ing'], (x) => 'mix-' + x), true); },
  },
];

export default {
  id: 'gerund',
  code: 'GER',
  title: '不定詞與動名詞 to V / V-ing',
  grade: 8,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { both: BOTH.length },
  defaultModes: { 1: ['to', 'ing'], 2: ['to', 'ing', 'prep', 'both'], 3: ['to', 'ing', 'prep', 'both', 'mix'] },
  levelHint: { 1: 'want / hope / plan 接 to V，enjoy / finish / practice 接 V-ing。', 2: '加入介系詞後的 V-ing（good at、before）、go swimming，以及 stop / remember / forget / try 兩種接法意思不同的題目。', 3: '再加入 to 與 -ing 混合判斷，以及過去式的句子。' },
  grammarBox: (o) => ({ head: ['後面接', '動詞'], rows: [
    ['to + 原形', 'want、hope、plan、decide、need、learn、would like'], ['V-ing', 'enjoy、finish、practice、keep、avoid、give up'],
    ...(o.level >= 2 ? [['介系詞 + V-ing', 'good at、interested in、before / after、thank you for'], ['go + V-ing', 'go swimming、go shopping、go hiking'],
      ['兩種都可以，意思不同', 'stop to V 停下來去做／stop V-ing 停止做；remember、forget to V 記得、忘了「要」做／V-ing 記得、忘了「曾經」做過；try to V 設法／try V-ing 試試看'],
      ['兩種都可以，意思相同', 'like、love、start、begin（本卷不出題）']] : []),
  ], note: 'to 後面一定是原形；介系詞（at、in、of、about、before、after）後面的動詞一定加 -ing。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
