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
  return {
    next,
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

/**
 * Sheet code, e.g. "BE-2M-3F-C1-20-48213": topic · level+tense · modes (hex bitmask) · abbreviation+Chinese · count · seed.
 * Entering the same code rebuilds the identical sheet.
 */
export function encodeCode(topic, o) {
  const bits = topic.modes.reduce((b, m, i) => (o.modes.includes(m.id) ? b | (1 << i) : b), 0);
  return [topic.code, `${o.level}${o.tense}`, bits.toString(16).toUpperCase(), `${o.abbr}${o.zh ? 1 : 0}`, o.count, o.seed].join('-');
}
export function decodeCode(code, topics) {
  const m = /^([A-Z]+)-([123])([PMD])-([0-9A-F]+)-([FCB])([01])-(\d+)-(\d+)$/.exec(String(code).trim().toUpperCase());
  if (!m) return null;
  const topic = topics.find((t) => t.code === m[1]);
  if (!topic) return null;
  const bits = parseInt(m[4], 16);
  const modes = topic.modes.filter((_, i) => bits & (1 << i)).map((x) => x.id);
  const count = Number(m[7]);
  if (!modes.length || count < COUNT_MIN || count > COUNT_MAX) return null;
  if (!topic.past && m[3] !== 'P') return null;
  return { topic: topic.id, opts: { level: Number(m[2]), tense: m[3], modes, abbr: m[5], zh: m[6] === '1', count, seed: Number(m[8]) } };
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
  const rng = makeRng(o.seed);
  const seen = new Set();
  const sections = [];
  for (const { mode, n } of splitCount(o.count, o.modes)) {
    if (!n) continue;
    const def = topic.modes.find((m) => m.id === mode);
    const items = [];
    let tries = 0;
    while (items.length < n) {
      if (++tries > n * 400) throw new Error(`${topic.id}/${mode}: could not make ${n} different questions`);
      const it = topic.generate(rng, o, mode);
      if (!it) continue;
      const key = it.lines.map(lineText).join(' | ').toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(it);
    }
    sections.push({ mode, title: def.instruction(o), items });
  }
  return { code: encodeCode(topic, o), opts: o, sections };
}
