// 化學反應式平衡實驗桌：兩邊的原子數來自 ./model.mjs。
import { balance, RX } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const INK = '#23304A', KEYS = ['a', 'b', 'c', 'd'], MAX = 4;
const ATOM = { H: ['#FFFFFF', '#C9D0DA', 11, INK], O: ['#FF7A66', '#C2311F', 15, '#fff'], N: ['#7FA6F0', '#2D55B0', 15, '#fff'], C: ['#7A808C', '#2E323A', 16, '#fff'] };
// 分子的空間填充模型（平面投影）：[原子, dx, dy]，先畫後面的
const SHAPE = {
  'H₂': [['H', -8, 0], ['H', 8, 0]], 'O₂': [['O', -11, 0], ['O', 11, 0]], 'N₂': [['N', -11, 0], ['N', 11, 0]],
  'H₂O': [['H', -15, 9], ['H', 15, 9], ['O', 0, -3]], 'NH₃': [['H', -17, 5], ['H', 17, 5], ['N', 0, -3], ['H', 0, 15]],
  'CH₄': [['H', 0, -18], ['H', -17, 6], ['H', 17, 6], ['C', 0, 0], ['H', 6, 15]], 'CO₂': [['O', -22, 0], ['O', 22, 0], ['C', 0, 0]]
};
const eqText = r => { const parts = [...r.R.left, ...r.R.right].map(([f], i) => `${r.coef[i] > 1 ? r.coef[i] : ''}${f}`), n = r.R.left.length; return parts.slice(0, n).join(' ＋ ') + ' → ' + parts.slice(n).join(' ＋ '); };
function defs(el, rig) {
  const d = el('defs', {}, rig);
  for (const [k, [hi, lo]] of Object.entries(ATOM)) { const g = el('radialGradient', { id: 'ba-' + k, cx: .36, cy: .32, r: .75 }, d); el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': .95 }, g); el('stop', { offset: .25, 'stop-color': hi }, g); el('stop', { offset: 1, 'stop-color': lo }, g); }
}
function atom(el, txt, g, k, x, y, sc = 1, label = true) {
  const [, , rad, ink] = ATOM[k];
  el('circle', { cx: x, cy: y, r: rad * sc, fill: `url(#ba-${k})`, stroke: INK, 'stroke-width': 1.4 }, g);
  if (label && sc > .6) txt(g, x, y + 4 * sc, k, { 'font-size': Math.round(11 * sc), fill: ink });
}
function molecule(el, txt, g, x, y, formula, sc = 1) { for (const [k, dx, dy] of SHAPE[formula]) atom(el, txt, g, k, x + dx * sc, y + dy * sc, sc); }

function scene({ rig, el, txt, s, r, set, drag, hint, kind }) {
  defs(el, rig);
  const can = kind === 'observe', all = [...r.R.left, ...r.R.right], nL = r.R.left.length;
  txt(rig, 500, 92, eqText(r), { 'font-size': 26 });
  const boxes = [[70, '反應物（左邊）', 0], [530, '生成物（右邊）', 1]];
  for (const [x, title] of boxes) { el('rect', { x, y: 112, width: 400, height: 256, rx: 18, fill: 'rgba(255,255,255,.94)', stroke: INK, 'stroke-width': 3 }, rig); txt(rig, x + 200, 140, title, { 'font-size': 16, fill: '#5A6478' }); }
  txt(rig, 500, 250, '→', { 'font-size': 34, fill: '#C8372D' });
  const inside = (p, side) => { const x = boxes[side][0]; return p.x > x && p.x < x + 400 && p.y > 112 && p.y < 368; };
  all.forEach(([f], i) => {
    const side = i < nL ? 0 : 1, row = side ? i - nL : i, bx = boxes[side][0], y = 196 + row * 96, n = r.coef[i], key = KEYS[i];
    txt(rig, bx + 50, y + 8, `${n > 1 ? n : ''}${f}`, { 'font-size': 20 });
    // 這一列的分子（點或拖出框外就拿掉一個）
    for (let k = 0; k < n; k++) { const two = n <= 2, sc = two ? 1.35 : 1, cx = bx + 146 + (k % 2) * 86, my = two ? y : y - 20 + Math.floor(k / 2) * 40, g = el('g', { 'data-drag': can && n > 1 ? `mol-${key}` : null }, rig);
      molecule(el, txt, g, cx, my, f, sc);
      el('rect', { x: cx - 40, y: my - 22, width: 80, height: 44, fill: 'transparent' }, g);
      if (can && n > 1) drag(g, () => ({ move(p, p0) { g.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`); g.setAttribute('opacity', inside(p, side) ? 1 : .45); },
        end(p) { if (!inside(p, side)) set({ [key]: n - 1 }); else { g.removeAttribute('transform'); g.removeAttribute('opacity'); } }, cancel() { g.removeAttribute('transform'); g.removeAttribute('opacity'); } }), { label: `拿掉一個 ${f}`, tap: () => set({ [key]: n - 1 }) }); }
    // 分子罐（點或拖進框裡就多一個）
    const jx = bx + 330, jy = y, jar = el('g', { 'data-drag': can && n < MAX ? `jar-${key}` : null, opacity: n < MAX ? 1 : .4 }, rig);
    el('rect', { x: jx - 34, y: jy - 34, width: 68, height: 64, rx: 14, fill: '#FFF8EC', stroke: n < MAX ? '#2E8B66' : '#8A93A6', 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }, jar);
    const pv = el('g', {}, jar); molecule(el, txt, pv, jx, jy - 6, f, .7);
    txt(jar, jx, jy + 24, n < MAX ? '＋ 拖進來' : '最多 4 個', { 'font-size': 11, fill: n < MAX ? '#1F6E50' : '#5A6478' });
    if (can && n < MAX) drag(jar, () => { const ghost = el('g', { opacity: .85, 'pointer-events': 'none' }, rig); molecule(el, txt, ghost, jx, jy - 6, f);
      const clear = () => ghost.remove();
      return { move(p, p0) { ghost.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`); }, end(p) { clear(); if (inside(p, side)) set({ [key]: n + 1 }); }, cancel: clear }; },
      { label: `加一個 ${f}`, tap: () => set({ [key]: n + 1 }) });
  });
  // 原子數對照：每種原子用小球排出來
  const w = r.elements.length === 3 ? 230 : 280, x0 = 500 - r.elements.length * w / 2 + 40;
  el('rect', { x: x0 - 100, y: 386, width: r.elements.length * w + 110, height: 156, rx: 16, fill: '#FFF8EC', stroke: INK, 'stroke-width': 3 }, rig);
  txt(rig, x0 - 56, 452, '左邊', { 'font-size': 15, fill: '#5A6478' }); txt(rig, x0 - 56, 508, '右邊', { 'font-size': 15, fill: '#5A6478' });
  r.elements.forEach((k, i) => { const x = x0 + i * w, ok = r.left[k] === r.right[k];
    txt(rig, x + 40, 412, `${k} 原子`, { 'font-size': 15 }); txt(rig, x + 112, 412, ok ? '✓ 相等' : '✗ 不等', { 'font-size': 14, fill: ok ? '#2E8B66' : '#C8372D' });
    for (const [row, cnt] of [[0, r.left[k]], [1, r.right[k]]]) { const y = 444 + row * 56;
      for (let j = 0; j < cnt; j++) atom(el, txt, rig, k, x + 8 + (j % 8) * 17, y + Math.floor(j / 8) * 17 - (cnt > 8 ? 8 : 0), .55, false);
      txt(rig, x + 8 + Math.min(cnt, 8) * 17 + 14, y + 6, String(cnt), { 'font-size': 18, 'text-anchor': 'start' }); }
  });
  hint(500, 566, '從分子罐拖分子進框裡；把分子拖出框外就拿掉');
}
const num = (key, label) => ({ key, label, type: 'num', min: 1, max: MAX, step: 1 });
const tgt = (sig, rx, coef, aim) => ({ sig, label: eqText(balance({ rx, a: 1, b: 1, c: 1, d: 1, ...coef })), aim, set: { rx, ...coef },
  title: (s, r) => eqText(r), body: (s, r) => r.balanced ? '兩邊每種原子數都相等，已平衡' : '還沒平衡：' + r.elements.filter(k => r.left[k] !== r.right[k]).map(k => `${k} 左 ${r.left[k]}、右 ${r.right[k]}`).join('；') });
const react = (s, r) => r.simplest ? '兩邊原子數都相等，平衡了！' : r.balanced ? '兩邊相等了，但係數要約成最簡單的整數比。' : '還沒平衡，看哪種原子兩邊不一樣多。';

runDesk({
  key: 'bhcs.lab.balance.v1', title: '化學反應式平衡實驗桌', background: 'bg-chem-bench',
  sceneLabel: '化學反應式平衡實驗桌：上方是反應式，左右兩個框是反應物和生成物的分子，可以從分子罐拖分子進框、把分子拖出框外；下方用小球比較兩邊每種原子的個數',
  initial: { rx: 'water', a: 1, b: 1, c: 1, d: 1 },
  model: balance, scene, viewBox: { desk: '50 40 900 548', phone: '50 40 900 548' }, phoneText: 1.4,
  readouts: (s, r) => [['反應', r.R.name, '', ''], ['係數', r.coef.join(' : '), '', '分子個數的比'], ['平衡了嗎', r.balanced ? (r.simplest ? '平衡' : '可再約分') : '還沒', '', r.balanced ? '每種原子數相等' : '有原子數不相等']],
  why: { title: '為什麼要平衡', button: '原子不滅', html: `
    <p class="fn-tip"><b>化學反應只是原子重新組合。</b>原子不會憑空出現，也不會消失，所以兩邊每種原子的個數要一樣。</p>
    <p class="fn-tip"><b>只能改係數，不能改化學式。</b>H₂O 前面寫 2 是「兩個水分子」；把 H₂O 改成 H₂O₂ 就變成另一種物質了。</p>
    <p class="fn-tip"><b>係數用最簡單的整數比。</b>2：1：2 和 4：2：4 都相等，但要寫 2：1：2。</p>` },
  steps: [
    { id: 'water', label: '氫氣燃燒', title: 'H₂ ＋ O₂ → H₂O，原子數對嗎？', goal: '先收下係數都是 1 的結果，再調係數，讓兩邊原子數相等後收下。',
      intro: '係數都是 1。數數看，氧原子兩邊一樣多嗎？', enter: { rx: 'water', a: 1, b: 1, c: 1, d: 1 },
      controls: [num('a', 'H₂ 的係數'), num('b', 'O₂ 的係數'), num('c', 'H₂O 的係數')], react,
      targets: [tgt('raw', 'water', { a: 1, b: 1, c: 1 }, '先收下係數都是 1 的結果。'), tgt('ok', 'water', { a: 2, b: 1, c: 2 }, '調到 2H₂ ＋ O₂ → 2H₂O。')],
      found: ['係數都是 1 時，氧原子左邊 2 個、右邊 1 個；調成 2：1：2 才相等。', '2H₂ ＋ O₂ → 2H₂O：H 4＝4、O 2＝2'] },
    { id: 'ammonia', label: '合成氨', title: 'N₂ ＋ H₂ → NH₃', goal: '調係數，讓氮原子和氫原子兩邊都相等，再收下。',
      intro: '先讓氮原子相等，再處理氫原子。', enter: { rx: 'ammonia', a: 1, b: 1, c: 1, d: 1 },
      controls: [num('a', 'N₂ 的係數'), num('b', 'H₂ 的係數'), num('c', 'NH₃ 的係數')], react,
      targets: [tgt('ok', 'ammonia', { a: 1, b: 3, c: 2 }, '氮：NH₃ 要 2 個；氫：右邊有 6 個，H₂ 要幾個？')],
      found: ['一次處理一種原子：先平衡氮，再平衡氫。', 'N₂ ＋ 3H₂ → 2NH₃：N 2＝2、H 6＝6'] },
    { id: 'methane', label: '甲烷燃燒', title: 'CH₄ ＋ O₂ → CO₂ ＋ H₂O', goal: '四個係數都可以調。讓碳、氫、氧三種原子都相等，再收下。',
      intro: '建議順序：碳 → 氫 → 最後才是氧。', enter: { rx: 'methane', a: 1, b: 1, c: 1, d: 1 },
      controls: [num('a', 'CH₄ 的係數'), num('b', 'O₂ 的係數'), num('c', 'CO₂ 的係數'), num('d', 'H₂O 的係數')], react,
      targets: [tgt('ok', 'methane', { a: 1, b: 2, c: 1, d: 2 }, '氫：左邊 4 個，H₂O 要 2 個；再數右邊的氧，決定 O₂ 的係數。')],
      found: ['單獨出現的元素（這裡是 O₂）留到最後平衡。', 'CH₄ ＋ 2O₂ → CO₂ ＋ 2H₂O：C 1＝1、H 4＝4、O 4＝4'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：數原子', goal: '係數 × 化學式裡的下標 ＝ 原子個數。', intro: '係數乘上下標。', head: '原子個數 ＝ 係數 × 下標',
      rows: [
        { id: 'h', name: '3H₂O 裡有幾個氫原子', eq: '3 × 2', answer: 6, unit: '個' },
        { id: 'o', name: '2CO₂ 裡有幾個氧原子', eq: '2 × 2', answer: 4, unit: '個' },
        { id: 'n', name: '2NH₃ 裡一共有幾個原子', eq: '2 ×（1 ＋ 3）', answer: 8, unit: '個', hint: v => v === 4 ? '一個 NH₃ 有 4 個原子，兩個分子要乘 2。' : '' }],
      found: ['算對了！', '係數管整個分子，下標只管前面那個原子'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想那張原子數對照表。',
      found: ['你會平衡化學反應式了！', '兩邊每種原子的個數相等'] }
  ],
  quiz: [
    { q: '為什麼化學反應式兩邊的原子數要相等？', options: [
      { text: '因為這樣式子比較整齊。', why: '不是為了好看。反應時原子只是重新組合，不會增加或減少。' },
      { text: '因為反應前後原子的種類和個數都不變。', ok: true },
      { text: '因為反應前後分子的個數不變。', why: '分子個數可以改變：2H₂ ＋ O₂ 是 3 個分子，生成 2 個水分子。不變的是原子。' }] },
    { q: '平衡 H₂ ＋ O₂ → H₂O 時，可以把 H₂O 改成 H₂O₂ 嗎？', options: [
      { text: '可以，這樣氧原子就相等了。', why: 'H₂O₂ 是過氧化氫（雙氧水），不是水。改下標等於換了一種物質。' },
      { text: '不行，只能改係數，不能改化學式。', ok: true },
      { text: '可以，只要最後再改回來。', why: '化學式代表物質本身，不能改。要調的是分子的個數（係數）。' }] },
    { q: 'CH₄ ＋ 2O₂ → CO₂ ＋ 2H₂O，右邊一共有幾個氧原子？', options: [
      { text: '3 個。', why: 'CO₂ 有 2 個，2H₂O 有 2 × 1 ＝ 2 個，合計 4 個。' },
      { text: '4 個。', ok: true },
      { text: '6 個。', why: 'H₂O 裡的 2 是氫的下標，氧只有 1 個；2H₂O 共有 2 個氧。' }] }
  ],
  finish: { title: '你會平衡化學反應式了！', rule: '反應前後原子的種類和個數不變。只改係數、不改化學式；一次平衡一種原子，係數寫成最簡整數比。', next: { label: '去化學計量實驗桌', href: '../stoichiometry/' } }
});
