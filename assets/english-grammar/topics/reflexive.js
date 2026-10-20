// Topic: reflexive pronouns — myself, yourself, himself, herself, itself, ourselves, yourselves, themselves.
import { blank, cap, zhJoin } from '../core.js';
import { pickPerson, verbFor } from '../people.js';

const SELF = { I: 'myself', you: 'yourself', he: 'himself', she: 'herself', it: 'itself', we: 'ourselves', they: 'themselves' };
// Verbs whose object points back to the subject: [base, -s, past, rest after the pronoun, Chinese with {s} for the reflexive]
const V = (base, s3, past, rest, zh) => ({ base, s3, past, rest, zh });
const ACTS = [
  V('hurt', 'hurts', 'hurt', ' playing basketball', '打籃球時弄傷了{s}'), V('cut', 'cuts', 'cut', ' when cooking', '煮飯時切到了{s}'), V('enjoy', 'enjoys', 'enjoyed', ' at the party', '在派對上玩得很開心'),
  V('introduce', 'introduces', 'introduced', ' to the class', '向全班介紹{s}'), V('teach', 'teaches', 'taught', ' to swim', '自學游泳'), V('look at', 'looks at', 'looked at', ' in the mirror', '看著鏡子裡的{s}'),
  V('talk to', 'talks to', 'talked to', '', '自言自語'), V('take care of', 'takes care of', 'took care of', '', '照顧{s}'), V('be proud of', 'is proud of', 'was proud of', '', '以{s}為榮'),
  V('dress', 'dresses', 'dressed', ' every morning', '每天早上自己穿衣服'), V('make', 'makes', 'made', ' a cup of tea', '給{s}泡了一杯茶'), V('buy', 'buys', 'bought', ' a new bag', '給{s}買了一個新袋子'),
];
// Fixed expressions: [sentence with #, pronoun key, Chinese]
const FIXED = [
  ['Help # to the cake.', 'you', '請自己拿蛋糕吃。'], ['I did my homework by #.', 'I', '我自己一個人做功課。'], ['She lives by # in Taichung.', 'she', '她一個人住在台中。'],
  ['Enjoy #, kids!', 'they', '孩子們，玩得開心點！'], ['The cat washed #.', 'it', '那隻貓自己洗了洗臉。'], ['We built the house #.', 'we', '我們自己蓋了這間房子。'],
  ['He fixed the bicycle #.', 'he', '他自己修了腳踏車。'], ['Did you make this cake #?', 'you', '這個蛋糕是你自己做的嗎？'], ['The children went to school by #.', 'they', '孩子們自己去上學。'],
  ['My grandmother painted the picture #.', 'she', '我奶奶自己畫了這幅畫。'], ['Please make # at home.', 'you', '請不要拘束，當自己家。'], ['The door opened by #.', 'it', '門自己開了。'],
  ['We enjoyed # at the beach.', 'we', '我們在海邊玩得很開心。'], ['I looked at # in the mirror.', 'I', '我看著鏡子裡的自己。'], ['Tom and Amy cooked dinner #.', 'they', 'Tom 和 Amy 自己煮了晚餐。'],
];
const two = (ans) => [blank(ans)];

const MODES = [
  {
    id: 'verb', name: '動詞 + 反身代名詞', instruction: () => '受詞就是主詞自己時，填入反身代名詞（myself、yourself、himself…）。',
    gen(rng, o) {
      const v = rng.fresh(ACTS, (x) => x.base);
      // every person takes a turn, so myself / yourself / ourselves come up as often as himself / herself
      const pr = rng.fresh(['I', 'you', 'he', 'she', 'we', 'they'], (x) => 'pr-' + x);
      const p = pickPerson(rng, (x) => x.pr === pr && !['Our teacher', 'My classmate'].includes(x.en)); // himself / herself must be clear from the subject
      const past = o.level >= 2 ? rng.fresh([true, false], (x) => 'past-' + x) : false;
      const verb = past ? v.past : v.base === 'be proud of' ? (p.en === 'I' ? 'am proud of' : ['we', 'they', 'you'].includes(p.pr) ? 'are proud of' : 'is proud of') : verbFor(p, [v.base, v.s3]);
      const self = SELF[p.pr === 'you' ? 'you' : p.pr];
      return { lines: [[`${p.en} ${verb} `, blank(self), `${v.rest}.`]], zh: zhJoin(p.zh, v.zh.replace('{s}', '自己')) + '。', meta: { kind: 'verb', subj: p.en, pr: p.pr } };
    },
  },
  {
    id: 'fixed', name: 'by oneself 與固定用法', instruction: () => '填入反身代名詞：by oneself（獨自）、enjoy oneself（玩得開心）、help oneself（自己拿）。',
    gen(rng) {
      const [en, key, zh] = rng.fresh(FIXED, (x) => x[0]);
      const [l, r] = en.split('#');
      const self = key === 'they' && /kids/.test(en) ? 'yourselves' : SELF[key];
      return { lines: [[l, blank(self), r]], zh, meta: { kind: 'fixed', pr: key, plural2: /kids/.test(en) } };
    },
  },
];

export default {
  id: 'reflexive',
  code: 'RFX',
  title: '反身代名詞 myself / himself',
  grade: 8,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { fixed: FIXED.length },
  defaultModes: { 1: ['verb'], 2: ['verb', 'fixed'], 3: ['verb', 'fixed'] },
  levelHint: { 1: '依主詞填入反身代名詞，現在式。', 2: '加入過去式與 by oneself、enjoy oneself、help oneself 等用法。', 3: '同中級。' },
  grammarBox: () => ({ head: ['主詞', 'I', 'you', 'he', 'she', 'it', 'we', 'you (複)', 'they'], rows: [['反身', 'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves']],
    note: '受詞和主詞是同一個人時用反身代名詞；by oneself = alone 獨自；enjoy oneself = have a good time。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
