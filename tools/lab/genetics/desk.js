// 遺傳實驗桌：棋盤方格、機率與抽樣結果來自 ./model.mjs。
import { cross } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';
import { plantDefs, pea as peaPlant } from '../shared/plants.mjs';

const LOOK = g => g === 'tt' ? '矮莖' : '高莖', pct = x => Math.round(x * 100);
const INK = '#23304A', CHOICE = { cross: { p1: ['TT', 'Tt', 'tt'], p2: ['TT', 'Tt', 'tt'] }, test: { p1: ['TT', 'Tt'] } };
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('linearGradient', 'ge-pot', [[0, '#E08A5A'], [.5, '#C8663A'], [1, '#9A4A26']]);
  g('linearGradient', 'ge-pack', [[0, '#FFF3D0'], [1, '#E9C770']], { x1: 0, y1: 0, x2: 0, y2: 1 });
}
const pea = (el, g, x, y, tall, sc = 1, seed = 1) => peaPlant(el, g, { x, y, tall, sc, seed });
function pot(el, g, x, y, w = 46) { el('path', { d: `M${x - w / 2} ${y}h${w}l-6 34h${-(w - 12)}z`, fill: 'url(#ge-pot)', stroke: INK, 'stroke-width': 2 }, g); el('rect', { x: x - w / 2 - 4, y: y - 6, width: w + 8, height: 10, rx: 3, fill: '#D97A4A', stroke: INK, 'stroke-width': 2 }, g); el('ellipse', { cx: x, cy: y - 5, rx: w / 2, ry: 3, fill: '#6B4A2B' }, g); }
function potted(el, txt, g, x, y, gt, sc = 1) { pot(el, g, x, y, 46 * sc); pea(el, g, x, y - 6, gt !== 'tt', sc, gt.charCodeAt(1) + 20); txt(g, x, y + 54, gt, { 'font-size': Math.round(17 * sc) }); }

function scene({ rig, el, txt, s, r, step, set, drag, hint, kind }) {
  defs(el, rig); plantDefs(el, rig);
  const can = kind === 'observe', opt = CHOICE[step] || {};
  // 親代：兩盆豌豆（可以把架上的豌豆拖進來換）
  const cards = { p1: [200, 140], p2: [372, 140] }, inCard = (k, p) => Math.abs(p.x - cards[k][0]) < 78 && p.y > cards[k][1] - 10 && p.y < cards[k][1] + 150;
  for (const k of ['p1', 'p2']) { const [x, y] = cards[k], open = can && opt[k], g = el('g', { 'data-drag': open ? `parent-${k}` : null }, rig);
    el('rect', { x: x - 72, y, width: 144, height: 132, rx: 14, fill: '#FFF8EC', stroke: open ? '#2E8B66' : INK, 'stroke-width': open ? 2.5 : 2, 'stroke-dasharray': open ? '7 4' : null }, g);
    txt(g, x, y + 22, k === 'p1' ? '親代一' : '親代二', { 'font-size': 13, fill: '#5A6478' });
    pot(el, g, x - 26, y + 92, 34); pea(el, g, x - 26, y + 86, s[k] !== 'tt', .6, k === 'p1' ? 3 : 8);
    txt(g, x + 36, y + 76, s[k], { 'font-size': 24 }); txt(g, x + 36, y + 100, LOOK(s[k]), { 'font-size': 13, fill: '#5A6478' });
    if (open) drag(g, null, { label: `換${k === 'p1' ? '親代一' : '親代二'}的基因型`, tap: () => set({ [k]: opt[k][(opt[k].indexOf(s[k]) + 1) % opt[k].length] }) }); }
  txt(rig, 286, 214, '×', { 'font-size': 26, fill: '#C8372D' });
  // 棋盤方格
  const X = 196, Y = 320, C = 84;
  [...s.p2].forEach((a, j) => { el('circle', { cx: X + j * C + C / 2, cy: Y - 28, r: 18, fill: '#FFF8EC', stroke: INK, 'stroke-width': 2.5 }, rig); txt(rig, X + j * C + C / 2, Y - 21, a, { 'font-size': 18 }); });
  [...s.p1].forEach((a, i) => { el('circle', { cx: X - 30, cy: Y + i * C + C / 2, r: 18, fill: '#FFF8EC', stroke: INK, 'stroke-width': 2.5 }, rig); txt(rig, X - 30, Y + i * C + C / 2 + 7, a, { 'font-size': 18 }); });
  txt(rig, X - 30, Y - 22, '配子', { 'font-size': 12, fill: '#5A6478' });
  r.grid.forEach((row, i) => row.forEach((g, j) => { const x = X + j * C, y = Y + i * C, tall = g !== 'tt';
    el('rect', { x, y, width: C, height: C, fill: tall ? '#EAF7E6' : '#FFF1D6', stroke: INK, 'stroke-width': 2.5 }, rig);
    txt(rig, x + 28, y + 34, g, { 'font-size': 20 }); txt(rig, x + 28, y + 58, LOOK(g), { 'font-size': 12, fill: '#5A6478' }); pea(el, rig, x + 64, y + C - 8, tall, .62, i * 2 + j + 11); }));
  txt(rig, X + C, Y + 2 * C + 26, `基因型 TT：Tt：tt ＝ ${r.ratio}`, { 'font-size': 15 });
  // 右：比例
  const BX = 560, BW = 330;
  el('rect', { x: BX - 20, y: 140, width: BW + 40, height: 410, rx: 16, fill: 'rgba(255,255,255,.94)', stroke: INK, 'stroke-width': 3 }, rig);
  const bar = (y, label, frac, note) => { txt(rig, BX, y - 10, label, { 'font-size': 15, 'text-anchor': 'start' });
    el('rect', { x: BX, y, width: BW, height: 30, rx: 8, fill: '#F2C879', stroke: INK, 'stroke-width': 2 }, rig); if (frac > 0) el('rect', { x: BX, y, width: BW * frac, height: 30, rx: 8, fill: '#56B866', stroke: INK, 'stroke-width': 2 }, rig);
    txt(rig, BX + BW / 2, y + 52, note, { 'font-size': 14 }); };
  bar(186, '理論：高莖的機率', r.pTall, `高莖 ${pct(r.pTall)}%、矮莖 ${100 - pct(r.pTall)}%`);
  if (step === 'sample') {
    bar(290, `實際種 ${s.n} 株`, r.tall / s.n, `高莖 ${r.tall} 株、矮莖 ${r.short} 株（高莖 ${pct(r.tall / s.n)}%）`);
    // 田：每一株都畫出來，矮莖平均分散
    const cols = s.n <= 20 ? 10 : s.n <= 100 ? 20 : 40, rows = Math.ceil(s.n / cols), cw = BW / cols, ch = Math.min(26, 150 / rows), fy = 380;
    el('rect', { x: BX - 4, y: fy - 4, width: BW + 8, height: rows * ch + 8, rx: 6, fill: '#B88A5A', opacity: .35 }, rig);
    for (let i = 0; i < s.n; i++) { const short = Math.floor((i + 1) * r.short / s.n) > Math.floor(i * r.short / s.n), x = BX + (i % cols + .5) * cw, y = fy + (Math.floor(i / cols) + 1) * ch - 2;
      if (cols <= 20) pea(el, rig, x, y, !short, cols === 10 ? .24 : .17, i); else el('path', { d: `M${x} ${y}v${short ? -2.5 : -6}`, stroke: short ? '#D9A22E' : '#3E9442', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, rig); }
    // 種子包：點或拖進田裡
    [20, 100, 400].forEach((n, i) => { const x = 196 + i * 84, on = s.n === n, g = el('g', { 'data-drag': can && !on ? `seed-${n}` : null, opacity: on ? .4 : 1 }, rig);
      el('path', { d: `M${x - 34} 600h68v-50l-8 -8h-52l-8 8z`, fill: 'url(#ge-pack)', stroke: INK, 'stroke-width': 2 }, g); el('path', { d: `M${x - 34} 550h68`, stroke: INK, 'stroke-width': 1.5 }, g);
      txt(g, x, 572, `${n} 株`, { 'font-size': 15 }); txt(g, x, 591, 'Tt × Tt', { 'font-size': 11, fill: '#5A6478' });
      if (!on && can) drag(g, () => ({ move(p, p0) { g.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`); }, end(p) { g.removeAttribute('transform'); if (p.x > BX - 20 && p.y > 140 && p.y < 550) set({ n }); }, cancel() { g.removeAttribute('transform'); } }), { label: `種 ${n} 株`, tap: () => set({ n }) }); });
  } else {
    txt(rig, BX + BW / 2, 330, '綠色：高莖　黃色：矮莖', { 'font-size': 14, fill: '#5A6478' });
    // 豌豆架：拖到親代的盆上換
    const list = [...new Set([...(opt.p1 || []), ...(opt.p2 || [])])];
    if (list.length) { txt(rig, BX + BW / 2, 390, '豌豆架（拖到左邊的親代上）', { 'font-size': 13, fill: '#5A6478' });
      el('rect', { x: BX + 10, y: 404, width: BW - 20, height: 136, rx: 12, fill: '#F6EEDC', stroke: '#C9B48E', 'stroke-width': 2 }, rig);
      list.forEach((gt, i) => { const x = BX + BW / 2 + (i - (list.length - 1) / 2) * 96, g = el('g', { 'data-drag': can ? `shelf-${gt}` : null }, rig); potted(el, txt, g, x, 478, gt, .7);
        el('rect', { x: x - 34, y: 416, width: 68, height: 114, fill: 'transparent' }, g);
        if (can) drag(g, () => ({ move(p, p0) { g.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`); }, end(p) { g.removeAttribute('transform'); const k = ['p1', 'p2'].find(k => opt[k] && opt[k].includes(gt) && inCard(k, p)); if (k && s[k] !== gt) set({ [k]: gt }); }, cancel() { g.removeAttribute('transform'); } }), { label: `${gt} 豌豆` }); }); }
  }
  hint(520, 626, step === 'sample' ? '把種子包拖進田裡' : '把架上的豌豆拖到親代上，或點親代換');
}
const tgt = (sig, label, set, aim, body) => ({ sig, label, set, aim, title: s => `${s.p1} × ${s.p2}`, body: body || ((s, r) => `子代基因型 TT：Tt：tt ＝ ${r.ratio}，高莖 ${pct(r.pTall)}%`) });
const parent = (key, label, list) => ({ key, label, type: 'seg', options: list.map(g => [g, `${g}（${LOOK(g)}）`]) });

runDesk({
  key: 'bhcs.lab.genetics.v1', title: '遺傳實驗桌', background: 'bg-chem-bench',
  sceneLabel: '遺傳實驗桌：上方是兩株親代豌豆，可以把豌豆架上的豌豆拖過去換；下方的棋盤方格列出配子和子代的基因型；右邊的長條比較高莖和矮莖的比例，最後一步把種子包拖進田裡',
  initial: { p1: 'TT', p2: 'tt', n: 20 },
  model: cross, scene, viewBox: { desk: '110 60 820 590', phone: '110 60 820 590' }, phoneText: 1.4,
  readouts: (s, r) => [['高莖的機率', String(pct(r.pTall)), '%', `矮莖 ${100 - pct(r.pTall)}%`], ['基因型比', r.ratio, '', 'TT：Tt：tt'], ['表現型比', r.look, '', '高莖：矮莖']],
  why: { title: '孟德爾的豌豆', button: '顯性與隱性', html: `
    <p class="fn-tip"><b>基因成對存在。</b>T 是高莖（顯性）、t 是矮莖（隱性）。只要有一個 T 就是高莖；兩個都是 t 才是矮莖。</p>
    <p class="fn-tip"><b>形成配子時成對的基因分開，</b>每個配子只帶其中一個；受精時再配成一對。</p>
    <p class="fn-tip"><b>棋盤方格</b>把兩個親代的配子列在兩邊，格子裡就是子代可能的基因型，每一格的機率都是 1/4。</p>
    <p class="fn-tip"><b>機率不是保證。</b>子代數目少的時候，實際比例可能離理論值比較遠；數目越多越接近。這裡的抽樣用固定的亂數，同樣設定每次結果相同。</p>` },
  steps: [
    { id: 'cross', label: '棋盤方格', title: '兩株高莖豌豆，會生出矮莖嗎？', goal: '先收下 TT × tt，再把兩個親代都換成 Tt，收下結果。',
      intro: '純種高莖 TT 和矮莖 tt 交配，子代長怎樣？', enter: { p1: 'TT', p2: 'tt', n: 20 }, controls: [parent('p1', '親代一', ['TT', 'Tt', 'tt']), parent('p2', '親代二', ['TT', 'Tt', 'tt'])],
      react: (s, r) => `高莖 ${pct(r.pTall)}%。`,
      targets: [tgt('f1', 'TT × tt', { p1: 'TT', p2: 'tt' }, '先看 TT × tt。'), tgt('f2', 'Tt × Tt', { p1: 'Tt', p2: 'Tt' }, '兩個親代都換成 Tt。')],
      found: ['TT × tt 的子代全是 Tt（高莖）；Tt × Tt 的子代高莖：矮莖 ＝ 3：1，矮莖的基因又出現了。', 'Tt × Tt → TT：Tt：tt ＝ 1：2：1'] },
    { id: 'test', label: '試交', title: '這株高莖是 TT 還是 Tt？', goal: '高莖有兩種基因型，外表看不出來。讓它和矮莖 tt 交配，收下 TT × tt 和 Tt × tt 的結果。',
      intro: '和矮莖 tt 交配，看子代有沒有矮莖。', enter: { p1: 'TT', p2: 'tt', n: 20 }, controls: [parent('p1', '要檢驗的高莖', ['TT', 'Tt'])],
      react: (s, r) => r.pTall === 1 ? '子代全是高莖。' : '子代有一半是矮莖。',
      targets: [tgt('TT', 'TT × tt', { p1: 'TT', p2: 'tt' }, '看 TT × tt。'), tgt('Tt', 'Tt × tt', { p1: 'Tt', p2: 'tt' }, '換成 Tt × tt。')],
      found: ['和矮莖交配後，子代只要出現矮莖，這株高莖就是 Tt；全是高莖才可能是 TT。', 'Tt × tt → 高莖：矮莖 ＝ 1：1'] },
    { id: 'sample', label: '機率與實際', title: '真的會剛好 3：1 嗎？', goal: 'Tt × Tt 理論上高莖 75%。比較抽 20 株和抽 400 株的實際結果，各收一張。',
      intro: '種 20 株，高莖會剛好 15 株嗎？', enter: { p1: 'Tt', p2: 'Tt', n: 20 }, controls: [{ key: 'n', label: '種幾株', type: 'seg', options: [[20, '20 株'], [100, '100 株'], [400, '400 株']] }],
      react: (s, r) => `${s.n} 株裡高莖 ${r.tall} 株（${pct(r.tall / s.n)}%）。`,
      targets: [20, 400].map(n => tgt('n' + n, `抽 ${n} 株`, { p1: 'Tt', p2: 'Tt', n }, `試 ${n} 株。`, (s, r) => `高莖 ${r.tall} 株、矮莖 ${r.short} 株，高莖佔 ${pct(r.tall / s.n)}%（理論 75%）`)),
      found: ['數目少時，實際比例可能和理論差比較多；數目越多越接近 3：1。', '20 株：17：3；400 株：299：101'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：遺傳機率', goal: '用棋盤方格的四格來算，每一格是 1/4。', intro: '數格子就知道機率。', head: '機率 ＝ 符合的格數 ÷ 4',
      rows: [
        { id: 's', name: 'Tt × Tt 生 400 株，理論上矮莖有幾株', eq: '400 × 1/4', answer: 100, unit: '株' },
        { id: 't', name: 'Tt × tt 的子代，高莖的機率', eq: '2 格 ÷ 4 格', answer: 50, unit: '%' },
        { id: 'h', name: 'Tt × Tt 的子代，基因型是 Tt 的機率', eq: '2 格 ÷ 4 格', answer: 50, unit: '%', hint: v => v === 75 ? '75% 是高莖（TT 和 Tt）的機率；只算 Tt。' : '' }],
      found: ['算對了！', '每一格的機率是 1/4'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想棋盤方格。',
      found: ['你把遺傳的規律弄懂了！', '顯性遮住隱性；機率看棋盤方格'] }
  ],
  quiz: [
    { q: '兩株高莖豌豆交配，後代出現了矮莖。這兩株親代的基因型是？', options: [
      { text: '都是 TT。', why: 'TT × TT 的子代全是 TT，不會有矮莖。' },
      { text: '都是 Tt。', ok: true },
      { text: '一株 TT、一株 Tt。', why: 'TT 給出的一定是 T，子代至少有一個 T，都是高莖。' }] },
    { q: '一對夫妻生的前三胎都是男孩，第四胎是女孩的機率是？', options: [
      { text: '很高，因為該輪到女孩了。', why: '每一胎都是獨立的，前面的結果不會影響下一胎。' },
      { text: '1/2。', ok: true },
      { text: '很低，因為他們容易生男孩。', why: '三胎的數目太少，不能說明什麼。你的證據：只種 20 株時，比例也離理論值比較遠。' }] },
    { q: '想知道一株高莖豌豆是 TT 還是 Tt，最好的方法是？', options: [
      { text: '看它長得多高。', why: 'TT 和 Tt 外表一樣都是高莖，看不出來。' },
      { text: '和矮莖 tt 交配，看子代有沒有矮莖。', ok: true },
      { text: '和另一株高莖 TT 交配。', why: '和 TT 交配，子代不管怎樣都是高莖，分不出來。' }] }
  ],
  finish: { title: '你把遺傳的規律弄懂了！', rule: '基因成對，顯性會遮住隱性。用棋盤方格列出配子，就能算出子代各種基因型的機率；子代數目越多，實際比例越接近理論值。', next: { label: '去細胞分裂實驗桌', href: '../cell-division/' } }
});
