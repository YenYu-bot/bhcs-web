// Shared engine for the English grammar fill-in worksheets.
// A topic module turns (rng, options) into items; this file owns randomness, sheet assembly and the sheet code.

/** Seeded PRNG (mulberry32): the same seed always gives the same sheet. */
export function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const used = new Map();
  return {
    next,
    /** Pick among the items used least so far on this sheet (by key), so a sheet spreads over the whole word bank. */
    fresh(arr, key = (x) => x) {
      if (!arr.length) return undefined;
      let min = Infinity;
      for (const x of arr) min = Math.min(min, used.get(key(x)) || 0);
      const pool = arr.filter((x) => (used.get(key(x)) || 0) === min);
      const x = pool[Math.floor(next() * pool.length)];
      used.set(key(x), min + 1);
      return x;
    },
    int: (n) => Math.floor(next() * n),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    shuffle(arr) {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a2[i], a2[j]] = [a2[j], a2[i]]; }
      return a2;
    },
  };
}

/** A blank: one word per blank, `a` = the answer printed on the teacher sheet.
 *  A wide blank may hold a short phrase ("is playing") where the number of blanks would give the answer away. */
export const blank = (a, wide = false) => (wide ? { blank: true, a, wide: true } : { blank: true, a });
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** Lower-case a subject for the middle of a sentence (names and I keep their capital). */
export const mid = (en) => (/^(I\b|Mr\.|Ms\.)/.test(en) || /^[A-Z][a-z]+(?:'s|$| and )/.test(en) ? en : en.charAt(0).toLowerCase() + en.slice(1));

/** Plain text of a line (blanks shown as ___), used to detect repeated questions. */
export function lineText(parts) {
  return parts.map((p) => (typeof p === 'string' ? p : '___')).join('');
}
export function answersOf(item) {
  return item.lines.flatMap((l) => l.filter((p) => typeof p !== 'string').map((p) => p.a));
}

/** Join Chinese pieces, putting a space only between Latin and CJK text. */
export function zhJoin(...pieces) {
  return pieces.filter(Boolean).reduce((acc, p) => {
    if (!acc) return p;
    const a = acc.slice(-1), b = p.charAt(0);
    const latin = (c) => /[A-Za-z.]/.test(c);
    return acc + (latin(a) !== latin(b) && /[A-Za-z]/.test(a + b) ? ' ' : '') + p;
  }, '');
}

export const LEVELS = [
  { id: 1, name: '初級' },
  { id: 2, name: '中級' },
  { id: 3, name: '進階' },
];
export const TENSES = [
  { id: 'P', name: '只考現在式' },
  { id: 'M', name: '現在與過去混合' },
  { id: 'D', name: '只考過去式' },
];
export const ABBR = [
  { id: 'F', name: '不用縮寫' },
  { id: 'C', name: '用縮寫' },
  { id: 'B', name: '兩種都練' },
];
export const COUNT_MIN = 10, COUNT_MAX = 50, COUNT_DEFAULT = 20;
/** Whole-sentence translation: none, 5 or 10 added at the end of a sheet, or 'O' for a sheet of translation only (the question count then counts translations). */
export const TR_CHOICES = [0, 5, 10, 'O'];
export const TR_ONLY = 'O';

/**
 * The whole English sentence an item's Chinese line says, with the answers filled in and the cues removed.
 * Dialogues ("Is it …? — Yes, it is.") give the question, which is what the Chinese line translates;
 * rewrite items ("A. → B.") give the result.
 */
export function fullSentence(it) {
  const text = (l) => l.map((p) => (typeof p === 'string' ? p : p.a === '×' ? '' : p.a)).join('');
  const dialog = it.lines.some((l) => /(^|\s)— /.test(text(l)));
  let s = dialog ? text(it.lines[0]).split(' — ')[0] : text(it.lines.at(-1)).replace(/^→\s*/, '');
  s = s.replace(/\s*[(（][^)）]*[)）]/g, '').replace(/\s+/g, ' ').replace(/\s+([.?!,])/g, '$1').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Sheet code, e.g. "BE-2M-3F-C1-20-48213": topic · level+tense · modes (hex bitmask) · abbreviation+Chinese · count · seed,
 * plus "-T5" when translation questions are added, or "-TO" for a translation-only sheet (older codes without it still work).
 * Entering the same code rebuilds the identical sheet.
 */
export function encodeCode(topic, o) {
  const bits = topic.modes.reduce((b, m, i) => (o.modes.includes(m.id) ? b | (1 << i) : b), 0);
  return [topic.code, `${o.level}${o.tense}`, bits.toString(16).toUpperCase(), `${o.abbr}${o.zh ? 1 : 0}`, o.count, o.seed, ...(o.tr ? [`T${o.tr}`] : [])].join('-');
}
export function decodeCode(code, topics) {
  const m = /^([A-Z]+)-([123])([PMD])-([0-9A-F]+)-([FCB])([01])-(\d+)-(\d+)(?:-T(\d+|O))?$/.exec(String(code).trim().toUpperCase());
  if (!m) return null;
  const topic = topics.find((t) => t.code === m[1]);
  if (!topic) return null;
  const bits = parseInt(m[4], 16);
  const modes = topic.modes.filter((_, i) => bits & (1 << i)).map((x) => x.id);
  const count = Number(m[7]);
  if (!modes.length || count < COUNT_MIN || count > COUNT_MAX) return null;
  if (!topic.past && m[3] !== 'P') return null;
  const tr = m[9] === TR_ONLY ? TR_ONLY : Number(m[9] || 0);
  if (!TR_CHOICES.includes(tr)) return null;
  return { topic: topic.id, opts: { level: Number(m[2]), tense: m[3], modes, abbr: m[5], zh: m[6] === '1', count, seed: Number(m[8]), tr } };
}

/** Split `count` over the chosen modes, in the topic's mode order (earlier modes get the remainder). */
export function splitCount(count, modes) {
  const base = Math.floor(count / modes.length), extra = count % modes.length;
  return modes.map((m, i) => ({ mode: m, n: base + (i < extra ? 1 : 0) }));
}

/**
 * Build a sheet: sections in mode order, each with `n` distinct items.
 * Returns { code, sections:[{mode, title, items}] } or throws if a topic cannot fill a section.
 */
export function buildSheet(topic, opts) {
  const o = { ...opts, modes: topic.modes.map((m) => m.id).filter((id) => opts.modes.includes(id)) };
  if (!topic.past) o.tense = 'P';
  if (topic.zhRequired) o.zh = true; // the Chinese line is the only cue for these topics
  o.tr = TR_CHOICES.includes(o.tr) ? o.tr : 0;
  const rng = makeRng(o.seed);
  const seen = new Set();
  const sections = [];
  // Topics built from a fixed list of sentences say how many different ones each section can hold.
  const trOnly = o.tr === TR_ONLY;
  const plan = trOnly ? [] : splitCount(o.count, o.modes).map(({ mode, n }) => ({ mode, n: Math.min(n, topic.capacity?.[mode] ?? Infinity) }));
  for (const { mode, n } of plan) {
    if (!n) continue;
    const def = topic.modes.find((m) => m.id === mode);
    const items = [];
    let tries = 0;
    while (items.length < n) {
      if (++tries > n * 400) throw new Error(`${topic.id}/${mode}: could not make ${n} different questions`);
      const it = topic.generate(rng, o, mode);
      if (!it) continue;
      // Two questions are the same when the student sees the same thing: the English with blanks, plus the Chinese where it is the cue.
      const key = it.lines.map(lineText).join(' | ').toLowerCase() + (topic.zhRequired ? ' | ' + it.zh : '');
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(it);
    }
    sections.push({ mode, title: def.instruction(o), items });
  }
  // Translation questions come last, after every fill-in item is drawn, so adding them never changes the fill-in part.
  // Each is a new sentence from the chosen modes: not one of the fill-in sentences, and no Chinese line twice.
  let translation = null;
  if (o.tr) {
    const used = new Set(sections.flatMap((s) => s.items.map((it) => fullSentence(it).toLowerCase())));
    const zhUsed = new Set(sections.flatMap((s) => s.items.map((it) => it.zh)));
    const items = [];
    // modes whose items are not whole sentences to translate (dialogue replies) are left out
    const trModes = o.modes.filter((m) => !topic.noTranslate?.includes(m));
    const want = trOnly ? o.count : o.tr;
    for (let tries = 0; trModes.length && items.length < want && tries < want * 400; tries++) {
      const mode = trModes[items.length % trModes.length];
      const it = topic.generate(rng, o, mode);
      if (!it) continue;
      const en = fullSentence(it);
      if (used.has(en.toLowerCase()) || zhUsed.has(it.zh)) continue;
      used.add(en.toLowerCase()); zhUsed.add(it.zh);
      items.push({ mode, zh: it.zh, en });
    }
    translation = { title: '整句翻譯：把中文句子翻成英文。', items };
  }
  const total = trOnly ? translation.items.length : sections.reduce((a, s) => a + s.items.length, 0);
  return { code: encodeCode(topic, o), opts: o, sections, total, translation };
}

// ---------- review sheets over several topics ----------
export const MIX_CODE = 'MIX';
/**
 * Mix code, e.g. "MIX-2M-BE.SIM.PST-F1-20-48213-T5": level+tense · topic codes joined by "." · abbreviation+Chinese · count · seed · translation.
 * Each topic's default modes for the level are used; a topic gets as many of them as its share of questions allows (one per five).
 */
export function encodeMixCode(topics, o) {
  return [MIX_CODE, `${o.level}${o.tense}`, topics.map((t) => t.code).join('.'), `${o.abbr}${o.zh ? 1 : 0}`, o.count, o.seed, ...(o.tr ? [`T${o.tr}`] : [])].join('-');
}
export function decodeMixCode(code, topics) {
  const m = new RegExp(`^${MIX_CODE}-([123])([PMD])-([A-Z.]+)-([FCB])([01])-(\\d+)-(\\d+)(?:-T(\\d+|O))?$`).exec(String(code).trim().toUpperCase());
  if (!m) return null;
  const picked = m[3].split('.').map((c) => topics.find((t) => t.code === c));
  if (picked.some((t) => !t) || new Set(picked).size !== picked.length) return null;
  const count = Number(m[6]), tr = m[8] === TR_ONLY ? TR_ONLY : Number(m[8] || 0);
  if (count < COUNT_MIN || count > COUNT_MAX || !TR_CHOICES.includes(tr)) return null;
  return { topics: picked.map((t) => t.id), opts: { level: Number(m[1]), tense: m[2], abbr: m[4], zh: m[5] === '1', count, seed: Number(m[7]), tr } };
}
/**
 * One review sheet from several topics. Questions are split over the topics; each topic becomes one or more sections
 * (its default modes at the level, one mode per five questions), built with the single-topic engine so every rule still holds.
 * Returns { code, opts, sections:[{topic, mode, title, items}], total, translation }.
 */
export function buildMixSheet(topics, opts) {
  const o = { ...opts, tr: TR_CHOICES.includes(opts.tr) ? opts.tr : 0 };
  const trOnly = o.tr === TR_ONLY;
  const sections = [];
  const shares = splitCount(o.count, topics.map((t) => t.id));
  const rng = makeRng(o.seed); // which of a topic's default modes this sheet uses
  topics.forEach((t, i) => {
    const n = shares[i].n;
    if (!n || trOnly) return;
    const def = t.defaultModes[o.level];
    const k = Math.max(1, Math.min(def.length, Math.floor(n / 5)));
    const chosen = new Set(); while (chosen.size < k) chosen.add(rng.fresh(def, (m) => t.id + m));
    const modes = def.filter((m) => chosen.has(m));
    const sub = buildSheet(t, { level: o.level, tense: o.tense, modes, abbr: o.abbr, zh: o.zh, count: n, seed: o.seed * 7 + i * 101, tr: 0 });
    for (const s of sub.sections) sections.push({ topic: t.id, topicTitle: t.title, mode: s.mode, title: `${t.title}：${s.title}`, items: s.items, opts: sub.opts });
  });
  let translation = null;
  if (o.tr) {
    const want = trOnly ? o.count : o.tr;
    const items = [];
    const seenZh = new Set();
    // round-robin over the topics, each topic drawing from its own translation-only sheet
    const subs = topics.map((t, i) => buildSheet(t, { level: o.level, tense: o.tense, modes: t.defaultModes[o.level], abbr: o.abbr, zh: true, count: Math.min(COUNT_MAX, Math.max(COUNT_MIN, want)), seed: o.seed * 7 + i * 101 + 50, tr: TR_ONLY }).translation.items.map((x) => ({ ...x, topic: t.id })));
    for (let round = 0; items.length < want && subs.some((s) => s.length); round++) {
      for (const s of subs) { const x = s.shift(); if (x && !seenZh.has(x.zh) && items.length < want) { seenZh.add(x.zh); items.push(x); } }
    }
    translation = { title: '整句翻譯：把中文句子翻成英文。', items };
  }
  const total = trOnly ? translation.items.length : sections.reduce((a, s) => a + s.items.length, 0);
  return { code: encodeMixCode(topics, o), opts: o, sections, total, translation };
}
