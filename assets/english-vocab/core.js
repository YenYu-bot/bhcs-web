// 英文單字練習卷：出題引擎。範圍是一本課本（某學期、某版本、某冊）或英文單字 2000，可勾選課次。
// 題型：中翻英（首字母與字數提示）、英翻中、缺字母、詞性、字母重組。卷號記下學期、範圍、題型、題數與種子，可還原同一份卷子。
import { makeRng } from '../english-grammar/core.js';
import { TERMS, W2000 } from './terms.js';

export const COUNT_MIN = 10, COUNT_MAX = 50, COUNT_DEFAULT = 20;
export const POS_CHOICES = ['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.'];

/** All books: every term's textbooks, then 英文單字 2000. */
export function allBooks() {
  return [...TERMS.flatMap((t) => t.books.map((b) => ({ ...b, termName: t.name }))), { ...W2000, termName: '常用字表' }];
}
export const findBook = (term, id) => allBooks().find((b) => b.id === id && (id === 'W2000' || b.term === term));
/** "康軒 B1（七上）・115 學年度第 1 學期・更新於 2026-11-02" */
export const bookLabel = (b) => (b.id === 'W2000' ? `英文單字 2000（百宏）・更新於 ${b.updated}` : `${b.pub} ${b.book}（${b.grade}）・${b.termName}・更新於 ${b.updated}`);

const word = ([unit, en, pos, zh, forms]) => ({ unit, en, pos, zh, forms });
const isWord = (w) => /^[A-Za-z]+$/.test(w.en); // one plain word: no spaces, hyphens, capitals rule out names below
const meanings = (zh) => zh.split(/[；;]/).map((s) => s.trim()).filter(Boolean);
const POS_ONE = (p) => POS_CHOICES.includes(p); // a single part of speech
// Common 國中 words that are just as often another part of speech than the one a list gives (all: adj./pron.,
// ring: n./v.); 詞性題 leaves them out because a student's other answer would also be right.
const OFTEN_OTHER_POS = new Set(['all', 'south', 'north', 'east', 'west', 'ring', 'mail', 'level', 'hurt', 'past', 'back', 'well', 'like', 'right', 'light', 'fine', 'kind', 'close', 'last', 'fast', 'hard', 'late', 'early', 'free', 'open', 'clean', 'dry', 'wet', 'empty', 'present', 'plan', 'call', 'dream', 'rain', 'snow', 'work', 'play', 'walk', 'swim', 'cook', 'drink', 'rest', 'visit', 'help', 'love', 'hope', 'wish', 'sleep', 'talk', 'smile', 'train', 'watch', 'face', 'hand', 'show', 'water', 'paint', 'shop', 'turn', 'fly', 'line', 'order', 'park', 'phone', 'film', 'check', 'change', 'answer', 'question', 'film', 'study', 'test', 'use', 'fight', 'kick', 'push', 'pull', 'jump', 'run', 'ride', 'race', 'drop', 'film', 'stop', 'move', 'need', 'care', 'mind', 'cause', 'crowd', 'sound', 'taste', 'smell', 'touch', 'look', 'step', 'stay', 'own', 'top', 'middle', 'inside', 'outside', 'round', 'over', 'up', 'down', 'off', 'since', 'before', 'after', 'until', 'some', 'any', 'each', 'both', 'either', 'neither', 'this', 'that', 'these', 'those', 'what', 'which', 'one', 'first', 'second', 'third', 'next', 'enough', 'more', 'most', 'much', 'many', 'few', 'little', 'less', 'only', 'even', 'still', 'just', 'too', 'so', 'as']);
/** Every part of speech any list gives a word ("hurt" v. in one book, adj. in another): 詞性題 only asks words with one. */
let POS_OF = null;
function posOf(en) {
  if (!POS_OF) {
    POS_OF = new Map();
    for (const b of allBooks()) for (const r of b.words) for (const p of String(r[2]).split(/[;／/]/).filter(Boolean)) {
      const k = r[1].toLowerCase(); const set = POS_OF.get(k) ?? new Set(); set.add(p.trim()); POS_OF.set(k, set);
    }
  }
  return POS_OF.get(en.toLowerCase()) ?? new Set();
}

/**
 * Chinese meanings that belong to one English entry only, across every list we hold:
 * a 中翻英 question whose Chinese fits two English words ("快樂的" happy / glad) has no single answer, so it is left out.
 */
let ALL_WORDS = null;
const allWords = () => (ALL_WORDS ??= new Set(allBooks().flatMap((b) => b.words.map((r) => r[1].toLowerCase()))));
let ZH_OWNERS = null;
function zhOwners() {
  if (ZH_OWNERS) return ZH_OWNERS;
  ZH_OWNERS = new Map();
  for (const b of allBooks()) for (const r of b.words) {
    const w = word(r);
    for (const m of meanings(w.zh)) {
      const set = ZH_OWNERS.get(m) ?? new Set();
      set.add(w.en.toLowerCase()); ZH_OWNERS.set(m, set);
    }
  }
  return ZH_OWNERS;
}
export const uniqueMeaning = (w) => meanings(w.zh).find((m) => zhOwners().get(m)?.size === 1 && !/^[…]|…$/.test(m)) ?? null;

/** Words in the chosen units, each English word once. */
export function poolOf(book, units) {
  const seen = new Set(), out = [];
  for (const r of book.words) {
    const w = word(r);
    if (!units.includes(w.unit) || seen.has(w.en.toLowerCase())) continue;
    seen.add(w.en.toLowerCase()); out.push(w);
  }
  return out;
}

// ---------- question types ----------
// Each: test (which words can be asked), make (rng, word) → { prompt parts, answer, kind }.
//   prompt parts: strings, or { blank: true, a } for a line to write on.
const lettersHidden = (rng, en) => {
  // hide about 40% of the letters, never the first, at least one; spaced so each letter is one box
  const idx = [...en].map((_, i) => i).slice(1);
  const n = Math.max(1, Math.round(en.length * 0.4));
  const hide = new Set(rng.shuffle(idx).slice(0, n));
  return { shown: [...en].map((c, i) => (hide.has(i) ? '_' : c)).join(' '), hidden: [...hide].sort((a, b) => a - b).map((i) => en[i]).join('') };
};
function shuffled(rng, en) {
  for (let t = 0; t < 20; t++) {
    const a = [...en.toLowerCase()];
    for (let i = a.length - 1; i > 0; i--) { const j = rng.int(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    if (a.join('') !== en.toLowerCase()) return a.join(' / ');
  }
  return null;
}
export const MODES = [
  {
    id: 'zh2en', name: '中翻英', instruction: '看中文寫出英文單字（已給第一個字母，括號是字母數）。',
    test: (w) => isWord(w) && w.en.length >= 3 && uniqueMeaning(w),
    make: (rng, w) => ({ q: `${uniqueMeaning(w)}${POS_ONE(w.pos) ? `（${w.pos}）` : ''}`, hint: `${w.en[0]}${' _'.repeat(w.en.length - 1)}（${w.en.length}）`, a: w.en }),
  },
  {
    id: 'en2zh', name: '英翻中', instruction: '寫出英文單字或片語的中文意思。',
    test: (w) => !!w.zh,
    make: (rng, w) => ({ q: `${w.en}${w.pos ? `（${w.pos}）` : ''}`, hint: '', a: w.zh }),
  },
  {
    id: 'missing', name: '缺字母', instruction: '依中文意思，補上缺少的字母。',
    test: (w) => isWord(w) && w.en.length >= 4,
    make: (rng, w) => {
      // no other word we hold may fit the shown letters (f _ _ t is foot and feet): hide fewer letters until it is one word
      for (let t = 0; t < 8; t++) {
        const h = lettersHidden(rng, w.en);
        const re = new RegExp('^' + h.shown.split(' ').map((c) => (c === '_' ? '[a-z]' : c.toLowerCase())).join('') + '$');
        if (![...allWords()].some((x) => x !== w.en.toLowerCase() && re.test(x))) return { q: h.shown, hint: w.zh, a: w.en, hidden: h.hidden };
      }
      return null;
    },
  },
  {
    id: 'pos', name: '詞性', instruction: `寫出單字的詞性（${POS_CHOICES.join('、')}）。`,
    test: (w) => isWord(w) && POS_ONE(w.pos) && posOf(w.en).size === 1 && !OFTEN_OTHER_POS.has(w.en.toLowerCase()),
    make: (rng, w) => ({ q: w.en, hint: '', a: w.pos }),
  },
  {
    id: 'scramble', name: '字母重組', instruction: '依中文意思，把打亂的字母重組成英文單字。',
    test: (w) => isWord(w) && w.en.length >= 3 && w.en.length <= 10 && w.en === w.en.toLowerCase(),
    make: (rng, w) => { const s = shuffled(rng, w.en); return s && { q: s, hint: w.zh, a: w.en }; },
  },
];

/** Split count over modes in order; earlier modes take the remainder. */
const split = (count, modes) => modes.map((m, i) => ({ mode: m, n: Math.floor(count / modes.length) + (i < count % modes.length ? 1 : 0) }));

/**
 * Sheet code: V-<term>-<book>-<units hex>-<modes hex>-<count>-<seed>, e.g. V-115-1-KB1-7F-1F-20-48213.
 * The term is part of the code so an old code still finds the list it was made from.
 */
export function encodeCode(book, o) {
  const ub = book.units.reduce((b, u, i) => (o.units.includes(u[0]) ? b | (1 << i) : b), 0);
  const mb = MODES.reduce((b, m, i) => (o.modes.includes(m.id) ? b | (1 << i) : b), 0);
  return ['V', book.id === 'W2000' ? 'W' : book.term, book.id, ub.toString(16).toUpperCase(), mb.toString(16).toUpperCase(), o.count, o.seed].join('-');
}
export function decodeCode(code) {
  const m = /^V-(W|\d{3}-[12])-([A-Z0-9]+)-([0-9A-F]+)-([0-9A-F]+)-(\d+)-(\d+)$/.exec(String(code).trim().toUpperCase());
  if (!m) return null;
  const book = findBook(m[1] === 'W' ? null : m[1], m[2]);
  if (!book) return null;
  const ub = parseInt(m[3], 16), mb = parseInt(m[4], 16), count = Number(m[5]);
  const units = book.units.filter((_, i) => ub & (1 << i)).map((u) => u[0]);
  const modes = MODES.filter((_, i) => mb & (1 << i)).map((x) => x.id);
  if (!units.length || !modes.length || count < COUNT_MIN || count > COUNT_MAX) return null;
  return { book, opts: { units, modes, count, seed: Number(m[6]) } };
}

/**
 * Build a sheet. Each word is used once on a sheet; a section that runs out of words is shorter,
 * and `short` says how many fewer questions there are than asked for.
 */
export function buildSheet(book, opts) {
  const o = { ...opts, modes: MODES.map((m) => m.id).filter((id) => opts.modes.includes(id)), units: book.units.map((u) => u[0]).filter((u) => opts.units.includes(u)) };
  const rng = makeRng(o.seed);
  const pool = poolOf(book, o.units);
  const used = new Set();
  const sections = [];
  for (const { mode, n } of split(o.count, o.modes)) {
    const def = MODES.find((m) => m.id === mode);
    const fit = pool.filter((w) => def.test(w));
    const items = [];
    let tries = 0;
    while (items.length < n && tries++ < n * 50) {
      const left = fit.filter((w) => !used.has(w.en.toLowerCase()));
      if (!left.length) break;
      const w = rng.fresh(left, (x) => x.en);
      const it = def.make(rng, w);
      if (!it) continue;
      used.add(w.en.toLowerCase());
      items.push({ ...it, en: w.en, unit: w.unit });
    }
    if (items.length) sections.push({ mode, title: def.instruction, name: def.name, items });
  }
  const total = sections.reduce((s, x) => s + x.items.length, 0);
  return { code: encodeCode(book, o), opts: o, sections, total, short: o.count - total, pool: pool.length };
}
