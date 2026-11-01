// Topic: tag questions — Tom is a student, isn't he? / You don't like fish, do you? / Let's go, shall we?
import { blank, cap, zhJoin } from '../core.js';
import { SUBJECTS, PREDICATES, extraSubjects } from '../lexicon.js';
import { VERBS, phrase, cuesFor, vform } from '../verbs.js';
import { pickFrame, third } from '../vcommon.js';
import { beForm } from './be.js';
import { PP } from './perfect.js';

const NEG = { am: "aren't", is: "isn't", are: "aren't", was: "wasn't", were: "weren't", do: "don't", does: "doesn't", did: "didn't", can: "can't", will: "won't", has: "hasn't", have: "haven't" };
const POS = Object.fromEntries(Object.entries(NEG).map(([k, v]) => [v, k]));
/** The pronoun the tag uses for a subject: I stays I, "my sister and I" is we, names and nouns take he / she / it / they. */
export function tagPronoun(s) {
  if (s.tags?.includes('pron')) return s.en;
  if (s.tags?.includes('with-i')) return 'we';
  if (s.tags?.includes('with-you')) return 'you';
  return s.reply;
}
function people(rng, level, { animals = false } = {}) {
  return [...SUBJECTS.filter((s) => s.lvl <= level && (s.kind === 'person' || (animals && s.kind === 'animal')) && !s.tags.includes('every') && !s.tags.includes('group')), ...extraSubjects(rng, level)]
    .filter((s) => tagPronoun(s));
}
const pick = (rng, pool) => rng.fresh(pool, (x) => x.en);
const negZh = (zh) => zh.replace(/^很/, '不');
const polarity = (rng, o) => (o.level >= 2 ? rng.fresh([true, false], (x) => 'neg-' + x) : false);
const item = (stmt, aux, pr, zh, meta) => ({ lines: [[`${stmt}, `, blank(aux), ' ', blank(pr), '?']], zh, meta });

const MODES = [
  {
    id: 'be', name: 'Be 動詞句', instruction: () => '完成附加問句：前面肯定，後面否定（用縮寫）；前面否定，後面肯定。',
    gen(rng, o) {
      const s = pick(rng, people(rng, o.level, { animals: true }));
      const preds = PREDICATES.filter((p) => p.for.includes(s.kind) && (!p.num || p.num === s.num) && !(p.type === 'job' && (s.kind !== 'person' || (p.age && s.age !== 'any' && p.age !== s.age))) && !(s.tags.includes('has-job') && p.type === 'job'));
      const p = rng.fresh(preds, (x) => x.en);
      const past = o.level >= 2 && rng.chance(0.3);
      const neg = polarity(rng, o);
      const be = beForm(s, past), pr = tagPronoun(s);
      if (neg && be === 'am') return null; // "I'm not … , am I?" is left out
      const pe = p.type === 'job' && s.num === 'pl' ? p.pl : p.en;
      const stmt = neg ? `${cap(s.en)} ${be === 'am' ? 'am not' : NEG[be]} ${pe}` : `${cap(s.en)} ${be} ${pe}`;
      const zh = zhJoin(s.zh, past ? '那時' : '', neg ? p.zh.neg : p.zh.pos) + '，對吧？';
      return item(stmt, neg ? be : NEG[be], pr, zh, { subj: s.en, kind: 'be', neg, aux: be });
    },
  },
  {
    id: 'do', name: '一般動詞句', instruction: () => '完成附加問句：一般動詞用 do / does / did，前後肯定否定相反。',
    gen(rng, o) {
      const s = pick(rng, people(rng, o.level, { animals: true }));
      const past = o.level >= 2 && rng.chance(0.35);
      const f = pickFrame(rng, s, o.level, (x) => (past ? x.pastOk : x.habit)); if (!f) return null;
      const neg = polarity(rng, o);
      // "They don't play every day" reads as "not every day", so negative statements take no every- cue
      const t = rng.fresh(cuesFor(f, past ? 'past' : 'habit', s).filter((x) => !(neg && /^every\b/.test(x.en))), (x) => x.en); if (!t) return null;
      const aux = past ? 'did' : third(s) ? 'does' : 'do', pr = tagPronoun(s);
      const v = neg ? f.v : past ? vform(f, 'past') : third(s) ? vform(f, 's') : f.v;
      const stmt = neg ? `${cap(s.en)} ${NEG[aux]} ${v}${phrase(f)} ${t.en}` : `${cap(s.en)} ${v}${phrase(f)} ${t.en}`;
      const zh = zhJoin(s.zh, t.zh, (neg ? (past ? '沒有' : '不') : '') + f.zh) + '，對吧？';
      return item(stmt, neg ? aux : NEG[aux], pr, zh, { subj: s.en, kind: 'do', neg, aux, base: f.v });
    },
  },
  {
    id: 'modal', name: 'can / will / have', instruction: () => '完成附加問句：can、will、have / has（現在完成式）照抄到後面，前後肯定否定相反。',
    gen(rng, o) {
      const s = pick(rng, people(rng, o.level));
      const which = rng.fresh(['can', 'will', 'have'], (x) => 'modal-' + x);
      const f = pickFrame(rng, s, o.level, (x) => (which === 'can' ? x.able : which === 'have' ? x.pastOk : x.habit)); if (!f) return null;
      const neg = polarity(rng, o);
      const pr = tagPronoun(s);
      let aux, stmt, zh;
      if (which === 'can') { aux = 'can'; stmt = `${cap(s.en)} ${neg ? "can't" : 'can'} ${f.v}${phrase(f)}`; zh = zhJoin(s.zh, (neg ? '不會' : '會') + f.zh); }
      else if (which === 'will') { aux = 'will'; stmt = `${cap(s.en)} ${neg ? "won't" : 'will'} ${f.v}${phrase(f)} tomorrow`; zh = zhJoin(s.zh, '明天', (neg ? '不會' : '會') + f.zh); }
      else { aux = third(s) ? 'has' : 'have'; const pp = PP[f.v] ?? vform(f, 'past'); stmt = neg ? `${cap(s.en)} ${NEG[aux]} ${pp}${phrase(f)} yet` : `${cap(s.en)} ${aux} already ${pp}${phrase(f)}`; zh = zhJoin(s.zh, neg ? `還沒${f.zh}` : `已經${f.zh}了`); }
      return item(stmt, neg ? aux : NEG[aux], pr, zh + '，對吧？', { subj: s.en, kind: 'modal', neg, aux, base: f.v });
    },
  },
  {
    id: 'special', name: '特殊句型', instruction: () => "完成附加問句：Let's… 用 shall we，祈使句用 will you，I am… 用 aren't I，There is / are 用 there。",
    gen(rng, o) {
      const kind = rng.fresh(['lets', 'imp', 'am', 'there'], (x) => 'sp-' + x);
      if (kind === 'lets') { const [en, zh] = rng.fresh([['go to the park', '去公園'], ['have lunch', '吃午餐'], ['play basketball', '打籃球'], ['see a movie', '看電影'], ['clean the room', '打掃房間'], ['take a walk', '散步']], (x) => x[0]); return item(`Let's ${en}`, 'shall', 'we', `我們${zh}吧，好嗎？`, { kind: 'lets' }); }
      if (kind === 'imp') { const [en, zh] = rng.fresh([['Open the door', '把門打開'], ['Close the window', '把窗戶關上'], ['Sit down', '坐下'], ['Be quiet', '安靜'], ["Don't be late", '不要遲到'], ['Pass me the salt', '把鹽遞給我'], ['Turn off the light', '關燈']], (x) => x[0]); return item(en, /^Don't/.test(en) ? 'will' : "will／won't", 'you', `${zh}，好嗎？`, { kind: 'imp' }); }
      if (kind === 'am') { const [en, zh] = rng.fresh([['right', '是對的'], ['late', '遲到了'], ['your friend', '是你的朋友'], ['in the picture', '在照片裡'], ['a good student', '是好學生'], ['taller than you', '比你高']], (x) => x[0]); return item(`I am ${en}`, "aren't", 'I', `我${zh}，對吧？`, { kind: 'am' }); }
      const [en, zh, be] = rng.fresh([['There is a cat under the table', '桌子下面有一隻貓', 'is'], ['There are two eggs in the box', '盒子裡有兩顆蛋', 'are'], ['There was a party last night', '昨晚有派對', 'was'], ['There were many people in the park', '公園裡有很多人', 'were'], ['There is some milk in the glass', '杯子裡有一些牛奶', 'is'], ['There are three books on the desk', '書桌上有三本書', 'are']], (x) => x[0]);
      return item(en, NEG[be], 'there', `${zh}，對吧？`, { kind: 'there', aux: be });
    },
  },
];

export default {
  id: 'tag',
  code: 'TAG',
  title: '附加問句',
  grade: 9,
  past: false,
  variety: false, // fixed sentence frames; checked by its own rules
  modes: MODES.map(({ id, name, instruction }) => ({ id, name, instruction })),
  capacity: { special: 25 },
  defaultModes: { 1: ['be', 'do'], 2: ['be', 'do', 'modal'], 3: ['be', 'do', 'modal', 'special'] },
  levelHint: { 1: '肯定句接否定附加問句：Be 動詞與 do / does。', 2: '加入否定句接肯定附加問句、過去式、can / will / have。', 3: "再加入 Let's、祈使句、I am、There is 的特殊附加問句。" },
  grammarBox: (o) => ({ head: ['句子', '附加問句'], rows: [
    ['Be 動詞', 'Tom is busy, isn’t he?' + (o.level >= 2 ? '　Tom isn’t busy, is he?' : '')], ['一般動詞', 'Amy likes cats, doesn’t she?' + (o.level >= 2 ? '　They didn’t go, did they?' : '')],
    ...(o.level >= 2 ? [['can / will / have', 'He can swim, can’t he?　She has finished, hasn’t she?']] : []),
    ...(o.level >= 3 ? [['特殊', 'Let’s go, shall we?　Open the door, will you?　I am right, aren’t I?　There is a cat, isn’t there?']] : []),
  ], note: '前面肯定，後面否定；前面否定，後面肯定。主詞改成代名詞，否定一律用縮寫。' }),
  generate(rng, o, mode) { return MODES.find((m) => m.id === mode).gen(rng, o); },
};
