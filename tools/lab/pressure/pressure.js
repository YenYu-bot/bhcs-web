// 水壓與氣壓實驗桌（新版實驗桌設計）
// 數值用 ./model.mjs：水壓 g ＝ 10、針筒氣壓同 scripts/science/models.mjs、氣壓計以 76 cm 水銀柱為 1 大氣壓。
import { water, gas, mercury, ATM } from './model.mjs';
import { $, Teacher, renderSteps, fly, bump, reduceMotion } from '../shared/lab.js';
import { openNotebook } from '../shared/notebook.mjs';

const NS = 'http://www.w3.org/2000/svg';
const db = await openNotebook('bhcs.lab.pressure.v1');
const k1 = x => (Math.round(x * 10) / 10).toFixed(1);

const STEPS = [
  { id: 'air', label: '大氣壓' },
  { id: 'water', label: '水壓' },
  { id: 'gas', label: '壓縮空氣' },
  { id: 'quiz', label: '說說看' }
];
const NEXT = { air: 'water', water: 'gas', gas: 'quiz' };
const LAB = {
  air: { key: 'air', opts: [ATM, 80], need: [ATM, 80], start: ATM, label: v => v === ATM ? '平地 101.3 kPa' : '高山 80 kPa' },
  water: { key: 'depth', opts: [0, 0.5, 1, 1.5, 2], need: [0, 1, 2], start: 0, label: v => `${v} m` },
  gas: { key: 'vol', opts: [1, 0.75, 0.5], need: [1, 0.75, 0.5], start: 1, label: v => `${v.toFixed(2)} L` }
};
const TASK = {
  air: { title: '用水銀柱看見大氣壓', goal: '管頂幾乎是真空。在平地（101.3 kPa）收下一次；再把外界氣壓改成高山的 80 kPa，看水銀柱變多高，再收下。',
    intro: '是什麼撐住這麼高的水銀柱？看看槽面上的箭頭。',
    found: ['外界氣壓變小，水銀柱就變短：76 cm → 60 cm。', '是空氣壓著槽面把水銀撐上去；1 大氣壓 ＝ 76 cm 水銀柱'] },
  water: { title: '探頭往下，水壓怎麼變？', goal: '拖探頭（或按深度）。在水面 0 m、1 m、2 m 各收下一次，比較水壓。',
    intro: '探頭在水面。慢慢往下放，壓力計會怎麼變？',
    found: ['越深水壓越大：每深 1 m 增加 10 kPa。', '深度加倍，水壓加倍；水面還有大氣壓 101.3 kPa'] },
  gas: { title: '把同一團空氣壓小', goal: '針筒口封住，空氣跑不掉。拖活塞（或按體積）從 1.00 L 壓到 0.75 L、0.50 L，每個體積各收下一次。',
    intro: '針筒裡關著一團空氣。往裡推，會越來越難推嗎？',
    found: ['體積減半，壓力加倍：101.3 → 202.6 kPa。', '氣體的量和溫度不變：壓力 × 體積 ＝ 定值'] },
  quiz: { title: '說說看：用證據回答', goal: '四題都答對就完成。答錯沒關係，余老師會說明原因。',
    intro: '最後四題！想想你收下的證據。',
    found: ['你看見壓力了！', '大氣壓、水壓、氣體壓力都能用證據說明'] }
};
const QUIZ = [
  { q: '外界氣壓從 101.3 降到 80 kPa，水銀柱為什麼變短？', options: [
    { text: '管頂的真空把水銀往上吸得比較弱。', why: '管頂幾乎是真空，沒有東西在「吸」；是外面的空氣壓著槽面把水銀推上去。' },
    { text: '空氣壓在槽面的力變小，撐得住的水銀柱就比較短。', ok: true },
    { text: '水銀的密度變大了。', why: '水銀沒變；變的是外界氣壓。你的證據：80 kPa 時 60 cm。' }] },
  { q: '同一槽水裡，探頭從 1 m 移到 2 m，水壓怎麼變？', options: [
    { text: '不變，都是 10 kPa。', why: '你的證據：1 m 是 10 kPa、2 m 是 20 kPa。' },
    { text: '從 10 kPa 變成 20 kPa。', ok: true },
    { text: '變成一半。', why: '越深，上面壓著的水越多，水壓越大，不會變小。' }] },
  { q: '探頭在水面時，水壓計（相對壓力）是 0 kPa。為什麼總壓力不是 0？', options: [
    { text: '水面還受到大氣壓，總壓力是 101.3 kPa。', ok: true },
    { text: '探頭壞了。', why: '探頭沒壞：相對壓力把大氣壓當作 0，只量水造成的部分。' },
    { text: '水面沒有重力。', why: '重力一直都在；水面上方只是沒有水壓著，但有空氣壓著。' }] },
  { q: '密閉針筒的空氣從 1.00 L 壓到 0.50 L，壓力怎麼變？', options: [
    { text: '不變，因為空氣沒有漏掉。', why: '空氣量沒變，但被擠在一半的空間，撞擊更頻繁。你的證據：202.6 kPa。' },
    { text: '變成一半。', why: '剛好相反：體積變一半，壓力變兩倍。' },
    { text: '變成兩倍：101.3 → 202.6 kPa。', ok: true }] }
];

/* ---------- 狀態 ---------- */
const fresh = () => ({ v: 1, step: 'air', air: ATM, depth: 0, vol: 1, records: [], done: [], quiz: { i: 0, pick: null } });
function loadState() {
  const s = db.load();
  try {
    if (!s || s.v !== 1 || !STEPS.some(x => x.id === s.step) || !Array.isArray(s.records) || !Array.isArray(s.done) || !s.quiz) throw 0;
    if (!LAB.air.opts.includes(s.air) || !LAB.water.opts.includes(s.depth) || !LAB.gas.opts.includes(s.vol)) throw 0;
    if (s.records.some(r => !LAB[r.step])) throw 0;
    return s;
  } catch { return fresh(); }
}
let S = loadState(), foundShown = null, lastNote = null;
const save = () => db.save(S);
const L = () => LAB[S.step];
const isLab = () => !!L();
const val = () => S[L().key];
const has = (step, v) => S.records.some(r => r.step === step && r.v === v);

const svg = $('#scene'), rig = $('#rig');
const teacher = new Teacher($('#teacher-pic'), $('#bubble'), $('#live'));
const el = (tag, a = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (parent) parent.append(n); return n; };
const txt = (parent, x, y, s, a = {}) => { const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#23304A', ...a }, parent); t.textContent = s; return t; };
const pill = (x, y, s, fill = '#C8372D', w = 140) => { el('rect', { x: x - w / 2, y: y - 17, width: w, height: 34, rx: 17, fill }, rig); txt(rig, x, y + 6, s, { fill: '#fff', 'font-size': 16, 'font-weight': 900 }); };
function arrowDown(x, y, len, color) {
  el('line', { x1: x, y1: y - len, x2: x, y2: y - 12, stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round' }, rig);
  el('path', { d: `M ${x} ${y} L ${x - 9} ${y - 15} L ${x + 9} ${y - 15} Z`, fill: color }, rig);
}
function tool(node, run, key) {
  node.addEventListener('click', run);
  node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); } key?.(e); });
}

/* ---------- 場景：托里切利氣壓計 ---------- */
const PXCM = 3.6;
function drawAir() {
  const m = mercury(S.air), surf = 480, tx = 640, top = surf - 86 * PXCM, colTop = surf - m.height * PXCM;
  // 水銀槽
  el('rect', { x: 470, y: surf - 6, width: 340, height: 80, rx: 10, fill: '#C9D1DA', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: 474, y: surf, width: 332, height: 70, rx: 8, fill: '#9AA5B1' }, rig);
  // 玻璃管與水銀柱
  el('rect', { x: tx - 20, y: top, width: 40, height: surf + 40 - top, rx: 14, fill: 'rgba(225,240,250,.7)', stroke: '#3E6C9A', 'stroke-width': 3 }, rig);
  el('rect', { x: tx - 14, y: colTop, width: 28, height: surf + 36 - colTop, fill: '#9AA5B1' }, rig);
  el('ellipse', { cx: tx, cy: colTop, rx: 14, ry: 5, fill: '#C9D1DA' }, rig);
  txt(rig, tx + 92, top + 30, '管頂近乎真空', { 'font-size': 15, 'font-weight': 900, fill: '#5A6478' });
  el('line', { x1: tx + 22, y1: top + 26, x2: tx + 36, y2: top + 26, stroke: '#5A6478', 'stroke-width': 2 }, rig);
  // 尺（從槽面量起）
  const rx = tx - 230;
  el('rect', { x: rx - 6, y: surf - 82 * PXCM, width: 50, height: 82 * PXCM + 10, rx: 6, fill: '#FFF6DA', stroke: '#23304A', 'stroke-width': 2.5 }, rig);
  for (let c = 0; c <= 80; c += 10) { const y = surf - c * PXCM; el('line', { x1: rx + 26, y1: y, x2: rx + 44, y2: y, stroke: '#23304A', 'stroke-width': 2 }, rig); txt(rig, rx + 12, y + 5, String(c), { 'font-size': 12 }); }
  txt(rig, rx + 18, surf - 84 * PXCM - 4, 'cm', { 'font-size': 12 });
  el('line', { x1: rx + 44, y1: colTop, x2: tx - 14, y2: colTop, stroke: '#C8372D', 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }, rig);
  el('line', { x1: rx + 44, y1: surf, x2: 470, y2: surf, stroke: '#2E7D63', 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }, rig);
  txt(rig, rx - 40, surf + 5, '槽面 0', { 'font-size': 13, 'font-weight': 900, fill: '#2E7D63' });
  pill(tx + 120, colTop, `柱高 ${k1(m.height)} cm`, '#C8372D', 150);
  // 外界空氣壓槽面的箭頭（長度 ∝ 氣壓）
  for (const x of [520, 570, 710, 760]) arrowDown(x, surf - 8, 30 + S.air * 0.45, '#2F6FB0');
  txt(rig, 820, surf - 70, `外界氣壓 ${k1(S.air)} kPa`, { 'font-size': 15, 'font-weight': 900, fill: '#2F6FB0', 'text-anchor': 'start' });
  // 地點牌（直接操作：按一下切換平地／高山）
  const tg = el('g', { class: 'tool', tabindex: 0, role: 'button', 'aria-label': S.air === ATM ? '地點牌：移到高山（80 kPa）' : '地點牌：回到平地（101.3 kPa）' }, rig);
  el('rect', { class: 'tool-ring', x: 830, y: 130, width: 150, height: 110, rx: 16, fill: 'rgba(255,255,255,.85)', stroke: '#E0A21B', 'stroke-width': 4 }, tg);
  el('path', { d: S.air === ATM ? 'M 850 215 L 960 215' : 'M 845 215 L 885 160 L 905 185 L 925 150 L 965 215 Z', fill: S.air === ATM ? 'none' : '#8FB88A', stroke: '#2E7D63', 'stroke-width': 4 }, tg);
  if (S.air === ATM) el('circle', { cx: 905, cy: 185, r: 16, fill: '#F4C04E' }, tg);
  txt(tg, 905, 262, S.air === ATM ? '平地 → 按我上高山' : '高山 → 按我回平地', { 'font-size': 14, 'font-weight': 900, fill: '#C8372D' });
  if (!readyToSave()) tg.classList.add('cue');
  tool(tg, () => setVal(S.air === ATM ? 80 : ATM));
}

/* ---------- 場景：水槽與探頭 ---------- */
const TK = { x: 470, y: 150, w: 330, top: 190, pxm: 160 };
function drawWater() {
  const w = water(S.depth), py = TK.top + S.depth * TK.pxm;
  el('rect', { x: TK.x, y: TK.top, width: TK.w, height: 2.3 * TK.pxm, fill: 'rgba(110,175,235,.45)' }, rig);
  for (let k = 1; k <= 4; k++) el('rect', { x: TK.x, y: TK.top + (k - 1) * 0.6 * TK.pxm, width: TK.w, height: 2.3 * TK.pxm - (k - 1) * 0.6 * TK.pxm, fill: 'rgba(40,100,180,.05)' }, rig);
  el('rect', { x: TK.x, y: TK.y, width: TK.w, height: TK.top - TK.y + 2.3 * TK.pxm, fill: 'none', stroke: '#3E6C9A', 'stroke-width': 4 }, rig);
  el('line', { x1: TK.x, y1: TK.top, x2: TK.x + TK.w, y2: TK.top, stroke: '#fff', 'stroke-width': 3 }, rig);
  for (const x of [520, 600, 680, 760]) arrowDown(x, TK.top - 4, 34, '#2F6FB0');
  txt(rig, 645, TK.y - 14, '水面上有大氣壓 101.3 kPa', { 'font-size': 14, 'font-weight': 900, fill: '#2F6FB0', 'text-anchor': 'end' });
  // 深度尺
  for (let d = 0; d <= 2; d += 0.5) { const y = TK.top + d * TK.pxm; el('line', { x1: TK.x - 22, y1: y, x2: TK.x, y2: y, stroke: '#23304A', 'stroke-width': 2 }, rig); txt(rig, TK.x - 30, y + 5, `${d} m`, { 'font-size': 13, 'text-anchor': 'end' }); }
  el('line', { x1: TK.x - 4, y1: py, x2: 640, y2: py, stroke: '#C8372D', 'stroke-width': 2, 'stroke-dasharray': '5 4' }, rig);
  // 探頭與管線
  el('path', { d: `M 660 ${py} L 660 ${TK.y - 30} L 880 ${TK.y - 30} L 880 230`, fill: 'none', stroke: '#23304A', 'stroke-width': 4 }, rig);
  const g = el('g', { class: 'tool drag', tabindex: 0, role: 'slider', 'aria-label': '探頭：上下拖動改變深度', 'aria-valuetext': `深度 ${S.depth} m` }, rig);
  el('circle', { class: 'tool-ring', cx: 660, cy: py, r: 30, fill: 'rgba(255,255,255,.4)', stroke: '#E0A21B', 'stroke-width': 4 }, g);
  el('rect', { x: 640, y: py - 12, width: 40, height: 24, rx: 8, fill: '#E0A21B', stroke: '#23304A', 'stroke-width': 3 }, g);
  el('circle', { cx: 660, cy: py, r: 44, fill: 'transparent' }, g);
  if (!readyToSave()) g.classList.add('cue');
  g.addEventListener('pointerdown', e => startDrag(e, y => (y - TK.top) / TK.pxm));
  g.addEventListener('keydown', e => step(e, 'ArrowDown', 'ArrowUp'));
  // 壓力計
  el('rect', { x: 820, y: 230, width: 160, height: 150, rx: 16, fill: '#2E7D63', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, 900, 258, '水壓計', { fill: '#fff', 'font-size': 16, 'font-weight': 900 });
  el('rect', { x: 836, y: 270, width: 128, height: 48, rx: 8, fill: '#F4FFF6', stroke: '#23304A', 'stroke-width': 2 }, rig);
  txt(rig, 900, 304, `${k1(w.relative)} kPa`, { 'font-size': 26, 'font-weight': 900, fill: '#C8372D' });
  txt(rig, 900, 340, '相對壓力', { fill: '#fff', 'font-size': 13, 'font-weight': 800 });
  txt(rig, 900, 364, `總壓力 ${k1(w.absolute)}`, { fill: '#fff', 'font-size': 13, 'font-weight': 800 });
  pill(560, py + (S.depth >= 2 ? -28 : 30), `深 ${S.depth} m`, '#C8372D', 100);
}

/* ---------- 場景：密閉針筒 ---------- */
const SY = { x0: 360, y: 300, h: 110, pxL: 420 };    // 筒底（封口）在右側 x0 + 1.00 L 長度
function drawGas() {
  const g0 = gas(S.vol), end = SY.x0 + SY.pxL, px = end - S.vol * SY.pxL;   // 活塞位置
  el('rect', { x: SY.x0 - 10, y: SY.y - SY.h / 2, width: SY.pxL + 20, height: SY.h, rx: 14, fill: 'rgba(225,240,250,.6)', stroke: '#3E6C9A', 'stroke-width': 4 }, rig);
  el('rect', { x: end + 10, y: SY.y - 18, width: 36, height: 36, rx: 6, fill: '#5A6478' }, rig);
  txt(rig, end + 28, SY.y + 54, '封口', { 'font-size': 13, 'font-weight': 900 });
  // 氣體粒子（固定 30 顆，分布在氣體範圍內）
  let a = 11; const rnd = () => (a = (a * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 30; k++) el('circle', { cx: px + 12 + rnd() * (end - px - 24), cy: SY.y - SY.h / 2 + 12 + rnd() * (SY.h - 24), r: 6, fill: '#2F6FB0', opacity: 0.8 }, rig);
  // 活塞（可拖動）
  const g = el('g', { class: 'tool drag', tabindex: 0, role: 'slider', 'aria-label': '活塞：左右拖動改變體積', 'aria-valuetext': `體積 ${S.vol.toFixed(2)} L` }, rig);
  el('rect', { class: 'tool-ring', x: px - 200, y: SY.y - SY.h / 2 - 14, width: 220, height: SY.h + 28, rx: 16, fill: 'transparent', stroke: '#E0A21B', 'stroke-width': 4 }, g);
  el('rect', { x: px - 14, y: SY.y - SY.h / 2 + 4, width: 16, height: SY.h - 8, rx: 4, fill: '#23304A' }, g);
  el('rect', { x: px - 190, y: SY.y - 12, width: 180, height: 24, rx: 6, fill: '#F2C18C', stroke: '#23304A', 'stroke-width': 2.5 }, g);
  el('rect', { x: px - 206, y: SY.y - 46, width: 18, height: 92, rx: 8, fill: '#E59A55', stroke: '#23304A', 'stroke-width': 2.5 }, g);
  if (!readyToSave()) { g.classList.add('cue'); txt(rig, px - 100, SY.y - 70, '往右推 →', { 'font-size': 15, 'font-weight': 900, fill: '#C8372D' }); }
  g.addEventListener('pointerdown', e => startDrag(e, (y, x) => (end - x) / SY.pxL));
  g.addEventListener('keydown', e => step(e, 'ArrowLeft', 'ArrowRight'));
  // 刻度
  for (const v of [1, 0.75, 0.5, 0.25]) { const x = end - v * SY.pxL; el('line', { x1: x, y1: SY.y + SY.h / 2, x2: x, y2: SY.y + SY.h / 2 + 14, stroke: '#23304A', 'stroke-width': 2 }, rig); txt(rig, x, SY.y + SY.h / 2 + 32, `${v.toFixed(2)} L`, { 'font-size': 13 }); }
  // 壓力計
  const cx = end + 120, cy = SY.y - 150, r = 60, ang = Math.min(1, g0.absolute / 250) * 270 - 135;
  el('line', { x1: end + 46, y1: SY.y, x2: cx, y2: SY.y, stroke: '#23304A', 'stroke-width': 4 }, rig);
  el('line', { x1: cx, y1: SY.y, x2: cx, y2: cy + r, stroke: '#23304A', 'stroke-width': 4 }, rig);
  el('circle', { cx, cy, r, fill: '#fff', stroke: '#23304A', 'stroke-width': 4 }, rig);
  for (let p = 0; p <= 250; p += 50) { const t = (p / 250 * 270 - 135) * Math.PI / 180; el('line', { x1: cx + Math.sin(t) * (r - 6), y1: cy - Math.cos(t) * (r - 6), x2: cx + Math.sin(t) * (r - 16), y2: cy - Math.cos(t) * (r - 16), stroke: '#23304A', 'stroke-width': 2 }, rig); }
  const t = ang * Math.PI / 180;
  el('line', { x1: cx, y1: cy, x2: cx + Math.sin(t) * (r - 14), y2: cy - Math.cos(t) * (r - 14), stroke: '#C8372D', 'stroke-width': 4, 'stroke-linecap': 'round' }, rig);
  el('circle', { cx, cy, r: 5, fill: '#23304A' }, rig);
  pill(cx, cy + r + 34, `${k1(g0.absolute)} kPa`, '#C8372D', 130);
  pill((px + end) / 2, SY.y - SY.h / 2 - 32, `體積 ${S.vol.toFixed(2)} L`, '#2F6FB0', 140);
}
function drawSummary() { txt(rig, 640, 330, '證據都在左邊的壓力紀錄裡', { 'font-size': 20, 'font-weight': 900 }); }
function draw() {
  const hadFocus = !!document.activeElement && rig.contains(document.activeElement);
  rig.replaceChildren();
  ({ air: drawAir, water: drawWater, gas: drawGas }[S.step] || drawSummary)();
  if (hadFocus) { const f = rig.querySelector('.tool'); if (f) f.focus({ preventScroll: true }); }
}

/* ---------- 操作 ---------- */
let mapper = null;
function startDrag(e, map) {
  mapper = map; e.preventDefault();
  addEventListener('pointermove', moveDrag);
  addEventListener('pointerup', () => { mapper = null; removeEventListener('pointermove', moveDrag); }, { once: true });
}
function moveDrag(e) {
  if (!mapper) return;
  const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
  const q = p.matrixTransform(svg.getScreenCTM().inverse()), v = mapper(q.y, q.x);
  setVal(L().opts.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a));
}
function step(e, back, fwd) {
  const o = L().opts, i = o.indexOf(val());
  if (e.key === fwd) { e.preventDefault(); setVal(o[Math.min(o.length - 1, i + 1)]); }
  if (e.key === back) { e.preventDefault(); setVal(o[Math.max(0, i - 1)]); }
}
function setVal(v) {
  if (!isLab() || v === val()) return;
  S[L().key] = v; foundShown = null; lastNote = null; save(); render();
}

/* ---------- 讀值 ---------- */
let prev = {};
function setReading(i, label, v, unit, note) {
  $('#l-' + i).textContent = label; $('#u-' + i).textContent = unit; $('#n-' + i).textContent = note;
  const n = $('#r-' + i), s = String(v);
  if (prev[i] !== undefined && prev[i] !== s) { n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick'); }
  prev[i] = s; n.textContent = s;
}
function renderReadouts() {
  if (S.step === 'water') {
    const w = water(S.depth);
    setReading(1, '深度', S.depth, 'm', '從水面量起');
    setReading(2, '水壓（相對）', k1(w.relative), 'kPa', '水造成的部分');
    setReading(3, '總壓力', k1(w.absolute), 'kPa', '大氣壓 ＋ 水壓');
  } else if (S.step === 'gas') {
    const g = gas(S.vol);
    setReading(1, '體積', S.vol.toFixed(2), 'L', '氣量、溫度不變');
    setReading(2, '壓力', k1(g.absolute), 'kPa', '針筒裡的氣體');
    setReading(3, '壓力 × 體積', k1(g.absolute * S.vol), '', '一直不變');
  } else {
    const m = mercury(S.air);
    setReading(1, '外界氣壓', k1(S.air), 'kPa', S.air === ATM ? '平地，1 大氣壓' : '高山');
    setReading(2, '水銀柱高', k1(m.height), 'cm', '從槽面量起');
    setReading(3, '管頂', '真空', '', '沒有空氣在吸');
  }
}
function rowText(r) {
  if (r.step === 'air') return ['氣壓計', `外界 ${k1(r.v)} kPa`, `水銀柱 ${k1(mercury(r.v).height)} cm`, r.v === ATM ? '1 大氣壓' : '氣壓變小，柱變短'];
  if (r.step === 'water') { const w = water(r.v); return ['水壓', `深 ${r.v} m`, `${k1(w.relative)} kPa`, `總壓力 ${k1(w.absolute)} kPa`]; }
  return ['針筒', `${r.v.toFixed(2)} L`, `${k1(gas(r.v).absolute)} kPa`, '壓力 × 體積 ＝ 101.3'];
}
function drawTable() {
  const rows = S.records.slice(-5);
  $('#table').innerHTML = rows.length ? `<table><thead><tr><th>實驗</th><th>條件</th><th>結果</th></tr></thead><tbody>${rows.map(r => { const t = rowText(r); return `<tr><td>${t[0]}</td><td><b>${t[1]}</b></td><td class="real">${t[2]}</td></tr>`; }).join('')}</tbody></table>${S.records.length > 5 ? '<p>顯示最新 5 筆，全部在研究手冊。</p>' : ''}` : '<p>收下觀察後，結果會排在這裡，方便比較。</p>';
}

/* ---------- 余老師 ---------- */
function oops(t) { teacher.last = ''; teacher.say(t, { pose: 'think', tone: 'oops' }); lastNote = t; }
const readyToSave = () => isLab() && L().need.includes(val()) && !has(S.step, val());
const stepDone = () => isLab() && L().need.every(v => has(S.step, v));
function talk() {
  if (lastNote) return;
  if (foundShown) {
    const f = TASK[foundShown].found;
    const action = foundShown === 'quiz' ? { label: '看成果 →', run: openFinish } : { label: '下一步 →', run: () => goStep(NEXT[foundShown]) };
    teacher.say(f[0], { pose: 'cheer', tone: 'found', tag: '發現時刻', eq: f[1], action }); return;
  }
  const s = S.step, done = S.done.includes(s), task = TASK[s];
  if (s === 'quiz') { teacher.say(done ? '全部完成了！可以按「看成果」。' : task.intro, { pose: done ? 'thumb' : 'think' }); return; }
  if (done) { teacher.say('這一步完成了，按任務卡的「下一步」繼續。', { pose: 'thumb' }); return; }
  const t = rowText({ step: s, v: val() }), next = L().need.find(v => !has(s, v));
  if (!S.records.some(r => r.step === s) && val() === L().start && !readyToSave()) { teacher.say(task.intro, { pose: 'point' }); return; }
  if (readyToSave()) { teacher.say(`${t[1]}：${t[2]}。收下這次觀察。`, { pose: 'wow' }); return; }
  teacher.say(has(s, val()) ? `收下了！${next !== undefined ? `換到 ${L().label(next)}。` : ''}` : `${t[1]}：${t[2]}。${next !== undefined ? `這一步要收下的是 ${L().label(next)}。` : ''}`, { pose: 'point' });
}

/* ---------- 任務卡 ---------- */
function renderTask() {
  const i = STEPS.findIndex(x => x.id === S.step), task = TASK[S.step], done = S.done.includes(S.step);
  $('#task-kicker').textContent = `任務 ${i + 1} / ${STEPS.length}${done ? '　✓ 已完成' : ''}`;
  $('#task-title').textContent = task.title; $('#task-goal').textContent = task.goal;
  const go = $('#task-go');
  if (done && S.step === 'quiz') { go.hidden = false; go.textContent = '看成果 →'; go.onclick = openFinish; }
  else if (done) { go.hidden = false; go.textContent = '下一步 →'; go.onclick = () => goStep(NEXT[S.step]); }
  else go.hidden = true;
  $('#dock-pull').hidden = !isLab(); $('#dock-quiz').hidden = S.step !== 'quiz';
  $('#unit-chip').hidden = !isLab();
  if (isLab()) {
    const o = L().opts, box = $('#ctl-btns');
    $('#ctl-label').innerHTML = { air: '外界氣壓 <small>按地點牌，或下面的按鈕</small>', water: '探頭深度 <small>拖探頭，或按下面的深度</small>', gas: '針筒體積 <small>推活塞，或按下面的體積</small>' }[S.step];
    box.className = 'picker-btns ' + (o.length > 2 ? 'three' : 'two');
    box.replaceChildren(...o.map(v => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn-soft'; b.textContent = L().label(v) + (has(S.step, v) ? ' ✓' : ''); b.setAttribute('aria-pressed', String(val() === v)); b.addEventListener('click', () => setVal(v)); return b; }));
  }
  $('#save').classList.toggle('cue', readyToSave());
  if (S.step === 'quiz') renderQuiz();
}

/* ---------- 說說看 ---------- */
function renderQuiz() {
  const qi = Math.min(S.quiz.i, QUIZ.length - 1), item = QUIZ[qi];
  $('#quiz-q').textContent = `第 ${qi + 1} / ${QUIZ.length} 題　${item.q}`;
  $('#quiz').replaceChildren(...item.options.map((o, k) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = o.text;
    if (S.quiz.pick === k) b.classList.add(o.ok ? 'ok' : 'bad');
    b.addEventListener('click', () => {
      S.quiz.pick = k; lastNote = null;
      if (!o.ok) { save(); render(); oops(o.why); return; }
      if (qi < QUIZ.length - 1) {
        save(); render(); teacher.last = '';
        teacher.say('答對了！', { pose: 'thumb', action: { label: '下一題 →', run: () => { S.quiz = { i: qi + 1, pick: null }; lastNote = null; save(); teacher.last = ''; render(); } } });
        lastNote = 'quiz-ok';
      } else { if (!S.done.includes('quiz')) S.done.push('quiz'); foundShown = 'quiz'; save(); render(); }
    });
    return b;
  }));
}

/* ---------- 證據 ---------- */
function renderEvidence() {
  const n = S.records.length;
  $('#ev-count').textContent = n; $('#note-count').textContent = n; $('#ev-empty').hidden = n > 0;
  const chips = $('#chips'), want = S.records.slice(-4).reverse(), key = want.map(r => r.n).join(',');
  if (chips.dataset.key === key) return; chips.dataset.key = key;
  chips.replaceChildren(...want.map(r => { const t = rowText(r), li = document.createElement('li'); li.className = 'chip'; li.innerHTML = `<small>#${r.n} ${t[0]}・${t[1]}</small><b>${t[2]}</b><span class="res ok">${t[3]}</span>`; return li; }));
}
function keep() {
  if (!isLab()) return;
  if (!readyToSave()) { const next = L().need.find(v => !has(S.step, v)); oops(next === undefined ? '這一步都收下了。' : has(S.step, val()) ? `這個已經收下了，換到 ${L().label(next)}。` : `這一步要收下的是 ${L().label(next)}。`); return; }
  if (S.records.length >= 60) { oops('手冊滿 60 張了，清空紀錄才能再收。'); return; }
  S.records.push({ n: S.records.length + 1, at: new Date().toISOString(), step: S.step, v: val() });
  lastNote = null;
  if (stepDone() && !S.done.includes(S.step)) { S.done.push(S.step); foundShown = S.step; }
  save();
  const t = rowText({ step: S.step, v: val() }), target = isVisible($('#evidence')) ? $('#evidence') : $('#note-count');
  fly($('#save'), target, `${t[1]}：${t[2]}`).then(() => { renderEvidence(); bump($('#note-count')); });
  render();
}
const isVisible = n => { const r = n.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };

/* ---------- 步驟 ---------- */
function goStep(id) {
  S.step = id; foundShown = null; lastNote = null;
  if (LAB[id]) S[LAB[id].key] = LAB[id].start;
  if (id === 'quiz' && !S.done.includes('quiz')) S.quiz = { i: 0, pick: null };
  save(); teacher.last = ''; render();
  if (narrow.matches) scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
}
function resetStep() { if (S.step === 'quiz') S.quiz = { i: 0, pick: null }; goStep(S.step); }

/* ---------- 對話框 ---------- */
function openNotes() {
  const body = $('#notes-body'); body.replaceChildren();
  if (!S.records.length) { const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="5" class="notes-empty">還沒有證據。</td>'; body.append(tr); }
  for (const r of S.records) { const tr = document.createElement('tr'); tr.innerHTML = `<td>${r.n}</td>` + rowText(r).map(c => `<td>${c}</td>`).join(''); body.append(tr); }
  $('#notes-dialog').showModal();
}
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#F4C04E" stroke="#23304A" stroke-width="1.2" stroke-linejoin="round"/></svg>';
function openFinish() {
  const got = STEPS.filter(s => S.done.includes(s.id)).length;
  $('#stars').innerHTML = STEPS.map(s => S.done.includes(s.id) ? STAR : STAR.replace('<svg', '<svg class="off"')).join('');
  $('#stars').setAttribute('aria-label', `完成 ${STEPS.length} 個任務中的 ${got} 個`);
  $('#finish-list').innerHTML = [
    S.done.includes('air') && '<li><b>大氣壓</b>：平地 76 cm 水銀柱，高山 80 kPa 時 60 cm</li>',
    S.done.includes('water') && '<li><b>水壓</b>：0 m 0 kPa、1 m 10 kPa、2 m 20 kPa（加上大氣壓才是總壓力）</li>',
    S.done.includes('gas') && '<li><b>密閉氣體</b>：1.00 L 101.3 kPa → 0.50 L 202.6 kPa</li>'
  ].filter(Boolean).join('');
  $('#finish-dialog').showModal();
}
let resetting = false;
async function clearAll() {
  if (resetting) return;
  if (!confirm('要清空這一站的所有證據和進度，從第 1 步重新開始嗎？')) return;
  resetting = true; let cleared;
  try { cleared = await db.clear(); } finally { resetting = false; }
  if (!cleared) return;
  S = fresh(); foundShown = null; lastNote = null; teacher.last = '';
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  render(); if (narrow.matches) scrollTo({ top: 0 });
}

/* ---------- 版面 ---------- */
const narrow = matchMedia('(max-width: 860px)');
function fitScene() { svg.setAttribute('viewBox', narrow.matches ? (S.step === 'gas' ? '140 100 860 380' : '330 0 680 610') : '40 60 960 560'); }
narrow.addEventListener?.('change', () => render());
function render() {
  renderSteps($('#steps'), STEPS, S.step, new Set(S.done), id => goStep(id));
  fitScene(); draw(); drawTable(); renderReadouts(); renderEvidence(); renderTask(); talk();
}

$('#save').addEventListener('click', keep);
$('#task-reset').addEventListener('click', resetStep);
$('#clear-records').addEventListener('click', clearAll);
$('#reset-all').addEventListener('click', clearAll);
$('#why').addEventListener('click', () => $('#why-dialog').showModal());
$('#open-notes').addEventListener('click', openNotes);
document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

render();
