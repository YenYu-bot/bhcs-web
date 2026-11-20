// Topic: participle adjectives — the movie is exciting (it excites), the boys are excited (they feel it).
import { blank, cap, zhJoin } from '../core.js';
import { NAMES } from '../lexicon.js';

// [verb, -ing, -ed, Chinese of the thing (令人…), Chinese of the feeling (感到…), things that cause it, preposition after -ed, Chinese of that]
const P = (base, ing, ed, zhIng, zhEd, things, prep) => ({ base, ing, ed, zhIng, zhEd, things, prep });
const PAIRS = [
  P('interest', 'interesting', 'interested', '很有趣', '很感興趣', [['the movie', '這部電影'], ['the story', '這個故事'], ['the class', '這堂課'], ['the book', '這本書']], ['in', '對…感興趣']),
  P('excite', 'exciting', 'excited', '很刺激', '很興奮', [['the game', '這場比賽'], ['the trip', '這趟旅行'], ['the movie', '這部電影']], ['about', '對…很興奮']),
  P('surprise', 'surprising', 'surprised', '令人驚訝', '很驚訝', [['the news', '這個消息'], ['the answer', '這個答案'], ['the result', '這個結果']], ['at', '對…很驚訝']),
  P('touch', 'touching', 'touched', '很感人', '很感動', [['the story', '這個故事'], ['the movie', '這部電影'], ['the letter', '這封信'], ['the song', '這首歌']], null),
  P('shock', 'shocking', 'shocked', '令人震驚', '很震驚', [['the news', '這個消息'], ['the result', '這個結果']], null),
  P('confuse', 'confusing', 'confused', '令人困惑', '很困惑', [['the question', '這個問題'], ['the map', '這張地圖'], ['the rule', '這條規則']], null),
  P('frighten', 'frightening', 'frightened', '很嚇人', '很害怕', [['the dog', '那隻狗'], ['the movie', '這部電影'], ['the story', '這個故事']], ['of', '怕…']),
  P('embarrass', 'embarrassing', 'embarrassed', '令人尷尬', '很尷尬', [['the question', '這個問題'], ['the mistake', '這個錯誤']], null),
  P('worry', 'worrying', 'worried', '令人擔心', '很擔心', [['the news', '這個消息'], ['the result', '這個結果']], ['about', '擔心…']),
  P('satisfy', 'satisfying', 'satisfied', '令人滿意', '很滿意', [['the result', '這個結果'], ['the dinner', '這頓晚餐']], ['with', '對…很滿意']),
];
const PEOPLE = [['The students', '學生們', 'were'], ['We', '我們', 'were'], ['I', '我', 'was'], ['My parents', '我的父母', 'were'], ['The children', '孩子們', 'were'],
  ...NAMES.m.slice(0, 4).map((n) => [n, n, 'was']), ...NAMES.f.slice(0, 4).map((n) => [n, n, 'was'])];
// things are "is / was" (the news is singular)
const low = (w) => (w === 'I' || /^[A-Z][a-z]+$/.test(w) && w !== 'We' ? w : w.charAt(0).toLowerCase() + w.slice(1));
const choice = (rng, a, b) => (rng.chance(0.5) ? `${a}／${b}` : `${b}／${a}`);

const MODES = [
  {
    id: 'pick', name: '-ing 或 -ed', instruction: (o) => o?.auditFix ? '依中文判斷：造成某種感受用 -ing，感受到它用 -ed。從括號裡選出正確的字。' : '事物「令人…」用 -ing，人「感到…」用 -ed：從括號裡選出正確的字。',
    gen(rng, o) {
      const p = rng.fresh(PAIRS, (x) => x.base);
      if (rng.fresh([true, false], (x) => 'pk-' + x)) {
        const [th, thz] = rng.pick(p.things);
        return { lines: [[`${cap(th)} is very `, blank(p.ing), `. (${choice(rng, p.ing, p.ed)})`]], zh: zhJoin(thz, p.zhIng.replace(/^令人/, '很令人')) + '。', meta: { kind: 'pick', thing: true, base: p.base, ...(o?.auditFix ? { requiredZh: true } : {}) } };
      }
      const [who, wz, be] = rng.pick(PEOPLE);
      return { lines: [[`${who} ${be} very `, blank(p.ed), `. (${choice(rng, p.ing, p.ed)})`]], zh: zhJoin(wz, '那時', p.zhEd) + '。', meta: { kind: 'pick', thing: false, base: p.base, ...(o?.auditFix ? { requiredZh: true } : {}) } };
    },
  },
  {
    id: 'both', name: '一句兩種形式', instruction: (o) => o?.auditFix ? '依中文與括號裡的動詞，填入 -ing（造成感受）和 -ed（有該感受）的形容詞。' : '依括號裡的動詞，分別填入 -ing（事物）和 -ed（人）的形容詞。',
    gen(rng, o) {
      const p = rng.fresh(PAIRS, (x) => 'b-' + x.base);
      const [th, thz] = rng.pick(p.things);
      const [who, wz, be] = rng.pick(PEOPLE);
      return { lines: [[`${cap(th)} was `, blank(p.ing), ` (${p.base}), so ${low(who)} ${be} `, blank(p.ed), ` (${p.base}).`]],
        zh: `${thz}${p.zhIng}，所以${zhJoin(wz, p.zhEd)}。`, meta: { kind: 'both', base: p.base, ...(o?.auditFix ? { requiredZh: true } : {}) } };
    },
  },
  {
    id: 'prep', name: '-ed 形容詞 + 介系詞', instruction: () => '填入 -ed 形容詞後面的介系詞（in、about、at、of、with）。',
    gen(rng) {
      const p = rng.fresh(PAIRS.filter((x) => x.prep), (x) => 'p-' + x.base);
      const [who, wz, be] = rng.pick(PEOPLE);
      // one is frightened of a dog, not of a movie
      const [th, thz] = rng.pick(p.base === 'frighten' ? p.things.filter(([t]) => t === 'the dog') : p.things);
      const prep = p.base === 'surprise' ? 'at／by' : p.prep[0];
      return { lines: [[`${who} ${be} ${p.ed} `, blank(prep), ` ${th}.`]], zh: zhJoin(wz, p.prep[1].replace('…', thz).replace(/^對(.*)很感興趣$/, '對$1很感興趣')) + '。', meta: { kind: 'prep', base: p.base, prep } };
    },
  },
];

export default {
  id: 'partadj',
  code: 'PAD',
  title: '分詞形容詞 -ing / -ed',
  grade: 9,
  past: false,
  variety: false, // checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { pick: 60, both: 60, prep: 40 },
  defaultModes: { 1: ['pick'], 2: ['pick', 'both'], 3: ['pick', 'both', 'prep'] },
  levelHint: { 1: '事物用 -ing，人用 -ed，從兩個字選一個。', 2: '加入同一句裡兩種形式都要寫出來。', 3: '再加入 -ed 形容詞後面的介系詞。' },
  auditLevelHint: { 1: '先依句意分辨是造成感受，還是自己有這個感受。' },
  grammarBox: (o) => ({ head: ['形式', '意思', '例子'], rows: [
    ['-ing', o.auditFix ? '造成某種感受' : '事物「令人…」', 'The movie is exciting.'], ['-ed', o.auditFix ? '感受到這種感受' : '人「感到…」', 'The boys are excited.'],
    ...(o.auditFix ? [['人物也可能造成感受', '同樣的人可描述不同意思', 'The students were surprising. / The students were surprised.']] : []),
    ...(o.level >= 3 ? [['-ed + 介系詞', '', 'interested in、excited about、surprised at、worried about、frightened of、satisfied with']] : []),
  ], note: o.auditFix ? '先看句意：主詞讓人有某種感受，用 -ing；主詞感受到它，用 -ed。不要只看主詞是人還是事物。' : '主詞是讓人有感覺的事物用 -ing；主詞是有感覺的人用 -ed。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
