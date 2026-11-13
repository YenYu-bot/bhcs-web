// 溶解度實驗桌（新版試用）
// 溶解、杯底固體與濃度直接用 tools/solubility-desk/model.mjs 的 calculate()；不另寫模型。
import { calculate } from '../../solubility-desk/model.mjs';
import { formatMass, formatPercent } from '../../solubility-desk/format.mjs';
import { $, store, Teacher, renderSteps, fly, bump, reduceMotion } from '../shared/lab.js';

const NS = 'http://www.w3.org/2000/svg';
const P = '../../../assets/science/props/';
const db = store('bhcs.lab.solubility.v1');
const SCOOP = 10, POUR = 20;
const g = n => formatMass(n), pct = n => formatPercent(n);
const conc = m => Number(m.concentration.toFixed(1));

const STEPS = [
  { id: 'add', label: '加溶質' },
  { id: 'heat', label: '加熱' },
  { id: 'cool', label: '冷卻' },
  { id: 'water', label: '加水' },
  { id: 'calc', label: '算濃度' },
  { id: 'quiz', label: '說說看' }
];
const NEXT = { add: 'heat', heat: 'cool', cool: 'water', water: 'calc', calc: 'quiz' };
const LAB = new Set(['add', 'heat', 'cool', 'water']);
const START = {
  add: { T: 20, water: 100, solute: 0 },
  heat: { T: 20, water: 100, solute: 50 },
  cool: { T: 60, water: 100, solute: 50 },
  water: { T: 20, water: 100, solute: 50 }
};
const TASK = {
  add: { title: '一匙一匙加進 100 g 的水', goal: '20°C、100 g 水。按湯匙（或「加一匙」）每次加 10 g 教學溶質 A，攪拌後看杯底。加到 50 g 時收下觀察。',
    intro: '每匙 10 g。加進去，看看什麼時候杯底開始留下固體！',
    found: ['20°C 時，100 g 水最多只能溶 30 g 的 A。', '加了 50 g → 溶解 30 g，杯底留下 20 g：飽和溶液'] },
  heat: { title: '加熱：杯底的固體會怎樣？', goal: '同一杯（水 100 g、A 50 g）。按電熱板旋鈕（或「升溫 10°C」）一次升高 10°C，加熱到 60°C 後收下觀察。',
    intro: '杯底還有 20 g 的 A。溫度升高，會溶得更多嗎？',
    found: ['溫度越高，溶解度越大：60°C 剛好溶完 50 g。', '杯底沒有固體，但已經溶到最多，還是飽和溶液'] },
  cool: { title: '冷卻回 20°C', goal: '關小電熱板（或按「降溫 10°C」），讓同一杯冷卻回 20°C，看杯底，再收下觀察。',
    intro: '現在 60°C、A 全部溶解。冷卻下來會發生什麼事？',
    found: ['冷卻後，溶不下的 A 又析出到杯底。', '20°C 只能溶 30 g → 析出 20 g；水和 A 的總量都沒變'] },
  water: { title: '加水：濃度一定變小嗎？', goal: '保持 20°C，按量杯（或「加 20 g 水」）。加到 120 g 時收下一次，再加到 200 g 收下一次，比一比濃度。',
    intro: '杯底還有固體。加一點水，濃度會變小嗎？',
    found: ['杯底還有固體時，加一點水，濃度不變；固體全溶後再加水，才會變稀。', '120 g 水：36 ÷（120 ＋ 36）＝ 23.1%；200 g 水：50 ÷ 250 ＝ 20%'] },
  calc: { title: '算一算：重量百分濃度', goal: '濃度 ＝ 已溶解的 A ÷ 溶液 × 100%。溶液 ＝ 水 ＋ 已溶解的 A，杯底的固體不算。',
    intro: '杯底的固體要算進去嗎？算算看！',
    found: ['杯底的固體不算在溶液裡。', '30 ÷（100 ＋ 30）× 100% ≈ 23.1%'] },
  quiz: { title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。',
    intro: '最後三題！想想你收下的證據。',
    found: ['你分清溶解度、飽和與濃度了！', '濃度 ＝ 溶質 ÷（水 ＋ 已溶解的溶質）× 100%'] }
};
const QUIZ = [
  { q: '20°C 時，100 g 水加入 50 g 的 A，攪拌後杯底剩 20 g。這杯溶液是？', options: [
    { text: '飽和溶液，因為已經溶到最多，杯底還有溶不下的固體。', ok: true },
    { text: '未飽和溶液，因為 50 g 沒有全部溶解。', why: '溶不完，代表已經溶到上限了，這就是飽和。' },
    { text: '濃度是 50 ÷ 150 × 100%。', why: '杯底的 20 g 沒有溶解，不算在溶液裡：濃度是 30 ÷ 130 × 100%。' }] },
  { q: '60°C 時，100 g 水裡的 50 g A 全部溶解，杯底沒有固體。這杯溶液是？', options: [
    { text: '一定是未飽和溶液，因為杯底沒有固體。', why: '60°C 時 100 g 水最多溶 50 g，已經溶了 50 g，剛好到上限：沒有固體也是飽和。' },
    { text: '剛好飽和，因為 60°C 時 100 g 水最多就是溶 50 g。', ok: true },
    { text: '過飽和溶液。', why: '這個實驗不模擬過飽和；已溶 50 g 剛好等於上限，是飽和。' }] },
  { q: '20°C 的飽和溶液，杯底還有 A 的固體。再加 20 g 水攪拌，濃度會怎樣？', options: [
    { text: '變小，因為加了水。', why: '你的證據：加到 120 g 水，多溶了 6 g，濃度還是 23.1%。' },
    { text: '變大，因為溶解的 A 變多了。', why: '溶解的 A 變多，溶液也變多，比例一樣：36 ÷ 156 ＝ 30 ÷ 130。' },
    { text: '不變，杯底的固體會再溶一些，還是飽和溶液。', ok: true }] }
];
const CALC = [
  { id: 'sol', name: '溶液質量', eq: '水 100 g ＋ 已溶解的 A', answer: 130, unit: 'g' },
  { id: 'c1', name: '20°C、100 g 水的濃度', eq: '30 ÷ 溶液 × 100，到小數第一位', answer: 100 * 30 / 130, tol: 0.051, unit: '%' },
  { id: 'c2', name: '加到 200 g 水的濃度', eq: '50 ÷（200 ＋ 50）× 100', answer: 20, unit: '%' }
];

/* ---------- 狀態 ---------- */
const fresh = () => ({ v: 1, step: 'add', ...START.add, saved: false, records: [], done: [], calc: {}, quiz: { i: 0, pick: null } });
function loadState() {
  const s = db.load();
  try {
    if (!s || s.v !== 1 || !STEPS.some(x => x.id === s.step) || !Array.isArray(s.records) || !Array.isArray(s.done) || !s.calc || !s.quiz) throw 0;
    if (![s.T, s.water, s.solute].every(Number.isInteger) || s.T < 0 || s.T > 80 || s.water < 50 || s.water > 300 || s.solute < 0 || s.solute > 150) throw 0;
    return s;
  } catch { return fresh(); }
}
let S = loadState(), foundShown = null, lastNote = null, shownT = S.T, anim = null, dropFx = 0;
const save = () => db.save(S);
const model = (T = S.T) => calculate({ temperature: T, water: S.water, solute: S.solute });
const recs = step => S.records.filter(r => r.step === step);
const isLab = () => LAB.has(S.step);

const svg = $('#scene'), rig = $('#rig');
const teacher = new Teacher($('#teacher-pic'), $('#bubble'), $('#live'));
const el = (tag, a = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (parent) parent.append(n); return n; };
const txt = (parent, x, y, s, a = {}) => { const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#23304A', ...a }, parent); t.textContent = s; return t; };

/* ---------- 場景 ---------- */
const HP = { x: 450, y: 420, w: 300, h: 166 };
const PLATE = HP.y + HP.h * 0.24;
const KNOB = { x: HP.x + HP.w * 0.5, y: HP.y + HP.h * 0.7, r: 28 };
const BK = { x: 505, w: 190, h: 250 }; BK.y = PLATE + 8 - BK.h;   // 燒杯
const IN = { l: BK.x + 18, r: BK.x + BK.w - 18, b: PLATE - 24 };   // 杯內底（燒杯玻璃底之上）
const PER_G = 0.9;                                                  // 每 g 水的液面高度
const TH = { x: 652 };
const T_MAX = 80;
const DOTS = (() => { let a = 7; const r = () => (a = (a * 16807) % 2147483647) / 2147483647; return Array.from({ length: 140 }, () => [r(), r()]); })();   // 結晶位置（示意）
const SPOON = { x: 810, y: 250 }, CUP = { x: 810, y: 250 };
function draw() {
  const T = shownT, m = model(Math.round(T)), top = IN.b - S.water * PER_G;
  const hadFocus = !!document.activeElement && rig.contains(document.activeElement);
  rig.replaceChildren();
  el('image', { href: P + 'prop-hotplate.webp', x: HP.x, y: HP.y, width: HP.w, height: HP.h }, rig);
  if (T > 20.5) el('ellipse', { cx: HP.x + HP.w / 2, cy: HP.y + HP.h * 0.2, rx: HP.w * 0.36, ry: HP.h * 0.11, fill: `rgba(230,80,40,${Math.min(0.5, (T - 20) / 80)})` }, rig);
  // 溶液：已溶解的 A 看不見顆粒，只讓整杯顏色均勻變深（濃度越高越紫）
  const k = Math.min(1, m.concentration / 33.3), mix = (a, b) => Math.round(a + (b - a) * k);
  el('rect', { x: IN.l, y: top, width: IN.r - IN.l, height: IN.b - top, rx: 6, fill: `rgba(${mix(120, 150)},${mix(180, 105)},${mix(235, 215)},${0.45 + 0.2 * k})` }, rig);
  el('line', { x1: IN.l, y1: top, x2: IN.r, y2: top, stroke: 'rgba(255,255,255,.85)', 'stroke-width': 3 }, rig);
  if (m.dissolved > 0) txt(rig, (IN.l + IN.r) / 2 - 18, top + 24, `溶解 ${g(m.dissolved)} g`, { 'font-size': 15, 'font-weight': 900, fill: '#3A2170' });
  // 杯底固體：白色結晶堆，高度和質量成正比
  if (m.solid > 1e-9) {
    const l = IN.l + 3, r = IN.r - 3, h = 6 + m.solid * 2.4, cx = (l + r) / 2;
    el('path', { d: `M ${l} ${IN.b} L ${l} ${IN.b - h * 0.55} Q ${cx} ${IN.b - h * 1.45} ${r} ${IN.b - h * 0.55} L ${r} ${IN.b} Z`, fill: '#FFFFFF', stroke: '#7A6A96', 'stroke-width': 2 }, rig);
    const nC = Math.round(m.solid * 3);
    for (let q = 0; q < nC; q++) {
      const [u, v] = DOTS[q % DOTS.length], x = l + 6 + u * (r - l - 12), yb = IN.b - 3, ytop = IN.b - h * (0.55 + 0.9 * (1 - Math.pow((x - cx) / ((r - l) / 2), 2))) + 4;
      const y = yb - v * Math.max(0, yb - ytop), sz = 3.4;
      el('path', { d: `M ${x} ${y - sz} L ${x + sz} ${y} L ${x} ${y + sz} L ${x - sz} ${y} Z`, fill: '#F1ECF8', stroke: '#6E5A94', 'stroke-width': 1.2 }, rig);
    }
    const ly = IN.b - h * 0.6;
    el('line', { x1: BK.x - 8, y1: ly, x2: l + 14, y2: ly, stroke: '#5A4A78', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, rig);
    el('rect', { x: BK.x - 158, y: ly - 16, width: 150, height: 32, rx: 16, fill: '#5A4A78' }, rig);
    txt(rig, BK.x - 83, ly + 6, `杯底固體 ${g(m.solid)} g`, { fill: '#FFFFFF', 'font-size': 15, 'font-weight': 900 });
  }
  // 溫度計
  const tg = el('g', {}, rig), lo = IN.b - 34, hi = BK.y + 46, yT = v => lo - v / T_MAX * (lo - hi);
  el('image', { href: P + 'prop-thermometer.webp', x: TH.x - 13, y: hi - 26, width: 26, height: lo - hi + 46 }, tg);
  el('rect', { x: TH.x - 2.2, y: yT(T), width: 4.4, height: lo + 10 - yT(T), rx: 2, fill: '#D8342B' }, tg);
  for (let v = 0; v <= T_MAX; v += 20) { el('line', { x1: TH.x + 13, y1: yT(v), x2: TH.x + 24, y2: yT(v), stroke: '#23304A', 'stroke-width': 2 }, tg); txt(tg, TH.x + 40, yT(v) + 5, String(v), { 'font-size': 12, 'font-weight': 700 }); }
  el('image', { href: P + 'prop-beaker.webp', x: BK.x, y: BK.y, width: BK.w, height: BK.h, preserveAspectRatio: 'none' }, rig);
  // 溫度與水量名牌
  el('rect', { x: TH.x + 54, y: yT(T) - 17, width: 84, height: 32, rx: 16, fill: '#C8372D' }, rig);
  txt(rig, TH.x + 96, yT(T) + 6, `${Math.round(T)}°C`, { fill: '#FFFFFF', 'font-size': 17, 'font-weight': 900 });
  const lab = el('text', { x: (IN.l + IN.r) / 2, y: BK.y - 14, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 900 }, rig);
  const t1 = el('tspan', { fill: '#1F4E80' }, lab); t1.textContent = `水 ${S.water} g`;
  const t2 = el('tspan', { fill: '#5A6478' }, lab); t2.textContent = '　＋　';
  const t3 = el('tspan', { fill: '#6A45A8' }, lab); t3.textContent = `A 共 ${S.solute} g`;
  // 工具（直接操作）
  if (S.step === 'add') tool('spoon', SPOON.x, SPOON.y, '加一匙 A（10 g）', S.solute < 50 && !S.saved, drawSpoon, '加一匙', addScoop);
  if (S.step === 'water') tool('cup', CUP.x, CUP.y, '倒 20 g 水', S.water < 200, drawCup, '倒水', pourWater);
  if (S.step === 'heat' || S.step === 'cool') {
    const up = S.step === 'heat', can = up ? S.T < 60 : S.T > 20;
    const kg = el('g', { class: 'tool knob', tabindex: 0, role: 'button', 'aria-label': up ? '電熱板旋鈕：升溫 10°C' : '電熱板旋鈕：降溫 10°C' }, rig);
    el('circle', { class: 'tool-ring', cx: KNOB.x, cy: KNOB.y, r: KNOB.r + 6, fill: 'none', stroke: up ? '#E0A21B' : '#2F6FB0', 'stroke-width': 4 }, kg);
    el('circle', { cx: KNOB.x, cy: KNOB.y, r: KNOB.r + 18, fill: 'transparent' }, kg);
    if (can && !anim) { kg.classList.add('cue'); txt(rig, KNOB.x - 92, KNOB.y + 6, up ? '轉大加熱' : '轉小降溫', { 'font-size': 17, 'font-weight': 900, fill: up ? '#C8372D' : '#2F6FB0' }); }
    bindTool(kg, () => changeT(up ? 10 : -10));
  }
  if (dropFx) {
    const fx = el('g', { class: dropFx === 1 ? 'fall' : 'fall' }, rig);
    if (dropFx === 1) for (let k = 0; k < 8; k++) el('circle', { cx: (IN.l + IN.r) / 2 - 20 + k * 6, cy: BK.y + 10 + (k % 3) * 8, r: 3, fill: '#FFFFFF', stroke: '#8E7BB0', 'stroke-width': 1 }, fx);
    else el('path', { d: `M ${IN.r - 20} ${BK.y + 6} q 6 40 0 80`, stroke: 'rgba(90,160,230,.9)', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }, fx);
  }
  if (hadFocus) { const f = rig.querySelector('.tool'); if (f) f.focus({ preventScroll: true }); }
}
function tool(kind, x, y, aria, cue, painter, label, run) {
  const tg = el('g', { class: 'tool', tabindex: 0, role: 'button', 'aria-label': aria }, rig);
  el('circle', { class: 'tool-ring', cx: x, cy: y, r: 58, fill: 'rgba(255,255,255,.55)', stroke: '#E0A21B', 'stroke-width': 4 }, tg);
  painter(tg, x, y);
  txt(tg, x, y + 84, label, { 'font-size': 16, 'font-weight': 900, fill: cue ? '#C8372D' : '#5A6478' });
  if (cue && !anim) tg.classList.add('cue');
  bindTool(tg, run);
}
function bindTool(node, run) {
  node.addEventListener('click', run);
  node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); } });
}
function drawSpoon(p, x, y) {
  el('path', { d: `M ${x - 44} ${y + 26} L ${x + 4} ${y - 2}`, stroke: '#8896A5', 'stroke-width': 8, 'stroke-linecap': 'round' }, p);
  el('ellipse', { cx: x + 18, cy: y - 10, rx: 26, ry: 16, fill: '#C8D0D8', stroke: '#23304A', 'stroke-width': 3 }, p);
  el('ellipse', { cx: x + 18, cy: y - 14, rx: 18, ry: 8, fill: '#FFFFFF', stroke: '#8E7BB0', 'stroke-width': 2 }, p);
  txt(p, x + 2, y + 44, '10 g', { 'font-size': 14, fill: '#6A45A8' });
}
function drawCup(p, x, y) {
  el('path', { d: `M ${x - 30} ${y - 36} L ${x - 24} ${y + 36} L ${x + 24} ${y + 36} L ${x + 30} ${y - 36} L ${x + 38} ${y - 44}`, fill: 'rgba(225,242,255,.8)', stroke: '#23304A', 'stroke-width': 3, 'stroke-linejoin': 'round' }, p);
  el('path', { d: `M ${x - 27} ${y - 4} L ${x - 24} ${y + 33} L ${x + 24} ${y + 33} L ${x + 27} ${y - 4} Z`, fill: 'rgba(110,175,235,.6)' }, p);
  txt(p, x, y + 56, '20 g', { 'font-size': 14, fill: '#1F4E80' });
}

/* ---------- 溶解度曲線 ---------- */
const GR = { l: 40, r: 308, t: 22, b: 168, sMax: 70 };
const gx = T => GR.l + T / T_MAX * (GR.r - GR.l), gy = v => GR.b - v / GR.sMax * (GR.b - GR.t);
function drawGraph() {
  const gr = $('#graph'); gr.replaceChildren();
  for (let v = 0; v <= 60; v += 20) { el('line', { x1: GR.l, y1: gy(v), x2: GR.r, y2: gy(v), stroke: '#E6DCCB', 'stroke-width': 1 }, gr); txt(gr, GR.l - 8, gy(v) + 4, String(v), { 'font-size': 11, 'font-weight': 700, 'text-anchor': 'end' }); }
  for (let T = 0; T <= T_MAX; T += 20) txt(gr, gx(T), GR.b + 16, String(T), { 'font-size': 11, 'font-weight': 700 });
  el('path', { d: `M ${GR.l} ${GR.t} V ${GR.b} H ${GR.r}`, fill: 'none', stroke: '#23304A', 'stroke-width': 2 }, gr);
  txt(gr, GR.r, GR.b + 30, '溫度（°C）', { 'font-size': 11, 'font-weight': 700, 'text-anchor': 'end' });
  txt(gr, GR.l - 6, GR.t - 12, 'g', { 'font-size': 11, 'font-weight': 700, 'text-anchor': 'end' });
  const s0 = calculate({ temperature: 0, water: 100, solute: 0 }).solubility, s1 = calculate({ temperature: T_MAX, water: 100, solute: 0 }).solubility;
  el('line', { x1: gx(0), y1: gy(s0), x2: gx(T_MAX), y2: gy(s1), stroke: '#8A63C9', 'stroke-width': 3 }, gr);
  const T = Math.round(shownT), m = model(T), per = S.solute * 100 / S.water;
  if (isLab() || S.step === 'calc') {
    el('line', { x1: GR.l, y1: gy(per), x2: GR.r, y2: gy(per), stroke: '#C8372D', 'stroke-width': 2, 'stroke-dasharray': '5 4' }, gr);
    txt(gr, GR.r - 2, gy(per) - 6, `這杯：每 100 g 水放了 ${g(per)} g`, { 'font-size': 11, 'font-weight': 800, fill: '#C8372D', 'text-anchor': 'end' });
    el('circle', { cx: gx(T), cy: gy(m.solubility), r: 6, fill: '#8A63C9', stroke: '#fff', 'stroke-width': 2 }, gr);
    txt(gr, gx(T) + (T > 60 ? -10 : 10), gy(m.solubility) + (per < m.solubility ? -10 : 18), `${T}°C：${g(m.solubility)} g`, { 'font-size': 11, 'font-weight': 900, fill: '#6A45A8', 'text-anchor': T > 60 ? 'end' : 'start' });
  }
  $('#graph-key').innerHTML = `<li><i style="background:#8A63C9"></i>溶解度（每 100 g 水）</li><li><i style="background:#C8372D"></i>紅虛線在曲線上方 → 杯底有固體</li>`;
  gr.setAttribute('aria-label', `溶解度曲線：${T}°C 時每 100 g 水最多溶 ${g(m.solubility)} g，這杯每 100 g 水放了 ${g(per)} g`);
}

/* ---------- 操作 ---------- */
function blocked(what) {
  if (!isLab()) { oops('這一步不用操作器材，看任務卡要做的事。'); return; }
  oops(what);
}
function changed() { S.saved = false; lastNote = null; foundShown = null; save(); render(); }
function addScoop() {
  if (S.step !== 'add') { blocked('這一步不加溶質。'); return; }
  if (S.solute >= 50) { oops('已經加到 50 g 了，收下這次觀察。'); return; }
  S.solute += SCOOP; fx(1); changed();
}
function pourWater() {
  if (S.step !== 'water') { blocked('這一步不加水。'); return; }
  if (S.water >= 200) { oops('已經加到 200 g 水了。'); return; }
  S.water += POUR; fx(2); changed();
}
function fx(kind) { if (reduceMotion()) return; dropFx = kind; setTimeout(() => { dropFx = 0; draw(); }, 620); }
function changeT(d) {
  if (anim) return;
  const up = S.step === 'heat';
  if (!(S.step === 'heat' || S.step === 'cool')) { blocked('這一步不改溫度。'); return; }
  if ((up && d < 0) || (!up && d > 0)) { oops(up ? '這一步是加熱。' : '這一步是冷卻。'); return; }
  if (up && S.T >= 60) { oops('已經 60°C 了，收下這次觀察。'); return; }
  if (!up && S.T <= 20) { oops('已經冷卻到 20°C 了，收下這次觀察。'); return; }
  const from = S.T; S.T += d; S.saved = false; lastNote = null; foundShown = null; save();
  if (reduceMotion()) { shownT = S.T; render(); return; }
  const t0 = performance.now();
  const f = now => {
    const k = Math.min(1, (now - t0) / 600);
    shownT = from + (S.T - from) * k; draw(); drawGraph();
    if (k < 1) anim = requestAnimationFrame(f); else { anim = null; shownT = S.T; render(); }
  };
  anim = requestAnimationFrame(f); render();
}

/* ---------- 讀值 ---------- */
let prev = {};
function setReading(i, label, val, unit, note) {
  $('#l-' + i).textContent = label; $('#u-' + i).textContent = unit; $('#n-' + i).textContent = note;
  const n = $('#r-' + i), v = String(val);
  if (prev[i] !== undefined && prev[i] !== v) { n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick'); }
  prev[i] = v; n.textContent = v;
}
function renderReadouts() {
  const m = model();
  setReading(1, '這杯最多能溶', g(m.capacity), 'g', `溶解度 ${g(m.solubility)} g／100 g 水`);
  setReading(2, '已溶解', g(m.dissolved), 'g', `杯底固體 ${g(m.solid)} g`);
  setReading(3, '濃度', pct(m.concentration), '%', m.saturated ? '飽和溶液' : `未飽和，還能溶 ${g(m.capacity - m.dissolved)} g`);
}

/* ---------- 余老師 ---------- */
function oops(t) { teacher.last = ''; teacher.say(t, { pose: 'think', tone: 'oops' }); lastNote = t; }
function waterHint() {
  if (!recs('water').some(r => r.water === 120)) return S.water < 120 ? '先加到 120 g 水。' : S.water === 120 ? '' : '按「重來這一步」，先在 120 g 收下一次。';
  if (!recs('water').some(r => r.water === 200)) return '繼續加水到 200 g，再收下一次。';
  return '';
}
function talk() {
  if (lastNote) return;
  if (foundShown) {
    const f = TASK[foundShown].found;
    const action = foundShown === 'quiz' ? { label: '看成果 →', run: openFinish } : { label: '下一步 →', run: () => goStep(NEXT[foundShown]) };
    teacher.say(f[0], { pose: 'cheer', tone: 'found', tag: '發現時刻', eq: f[1], action }); return;
  }
  const step = S.step, done = S.done.includes(step), task = TASK[step], m = model();
  if (isLab()) {
    if (done && S.saved) { teacher.say('這一步完成了，按任務卡的「下一步」繼續。', { pose: 'thumb' }); return; }
    if (step === 'add') {
      if (S.solute === 0) { teacher.say(task.intro, { pose: 'point' }); return; }
      if (S.saved) { teacher.say('收下了！繼續加到 50 g。', { pose: 'thumb' }); return; }
      if (m.solid > 0) { teacher.say(S.solute >= 50 ? `加了 50 g：溶解 ${g(m.dissolved)} g，杯底留下 ${g(m.solid)} g。收下這次觀察。` : `杯底開始留下固體了！加了 ${S.solute} g，只溶了 ${g(m.dissolved)} g。`, { pose: 'wow' }); return; }
      teacher.say(m.saturated ? `加了 ${S.solute} g，全部溶解，而且剛好溶到最多！再加一匙看看。` : `加了 ${S.solute} g，全部溶解。還能再溶 ${g(m.capacity - m.dissolved)} g。`, { pose: 'point' }); return;
    }
    if (step === 'heat' || step === 'cool') {
      const target = step === 'heat' ? 60 : 20;
      if (S.T === START[step].T && !S.saved) { teacher.say(task.intro, { pose: 'point' }); return; }
      if (S.T === target) { teacher.say(S.saved ? '收下了！' : `${S.T}°C：已溶解 ${g(m.dissolved)} g，杯底 ${g(m.solid)} g。收下這次觀察。`, { pose: 'wow' }); return; }
      teacher.say(`${S.T}°C：最多能溶 ${g(m.capacity)} g，杯底剩 ${g(m.solid)} g。繼續${step === 'heat' ? '加熱' : '冷卻'}！`, { pose: 'point' }); return;
    }
    const h = waterHint();
    if (S.saved) { teacher.say(h ? `收下了！${h}` : '比較完了！按任務卡的「下一步」。', { pose: 'thumb' }); return; }
    if (S.water === 100) { teacher.say(task.intro, { pose: 'point' }); return; }
    const ready = (S.water === 120 && !recs('water').some(r => r.water === 120)) || S.water === 200;
    teacher.say(`水 ${S.water} g：溶解 ${g(m.dissolved)} g，杯底 ${g(m.solid)} g，濃度 ${pct(m.concentration)}%。${ready ? '收下這次觀察。' : h}`, { pose: ready ? 'wow' : 'point' }); return;
  }
  if (step === 'calc') {
    if (!recs('add').some(r => r.solute === 50) || !recs('water').some(r => r.water === 200)) { teacher.say('還少「加溶質」或「加水」的證據，先回去收下來。', { pose: 'think' }); return; }
    teacher.say(done ? '算對了！按任務卡的「下一步」繼續。' : task.intro, { pose: done ? 'thumb' : 'notebook' }); return;
  }
  teacher.say(done ? '全部完成了！可以按「看成果」。' : task.intro, { pose: done ? 'thumb' : 'think' });
}

/* ---------- 任務卡 ---------- */
const CTL = {
  add: { label: '加入教學溶質 A <small>每匙 10 g，按湯匙或下面的按鈕</small>', a: ['加一匙（10 g）', addScoop], b: null },
  heat: { label: '加熱 <small>按電熱板的旋鈕，或下面的按鈕</small>', a: ['升溫 10°C', () => changeT(10)], b: null },
  cool: { label: '冷卻 <small>按電熱板的旋鈕，或下面的按鈕</small>', a: ['降溫 10°C', () => changeT(-10)], b: null },
  water: { label: '加水 <small>每次 20 g，按量杯或下面的按鈕</small>', a: ['加 20 g 水', pourWater], b: null }
};
function readyToSave() {
  if (!isLab() || S.saved) return false;
  if (S.step === 'add') return S.solute >= 50;
  if (S.step === 'heat') return S.T === 60;
  if (S.step === 'cool') return S.T === 20;
  return (S.water === 120 && !recs('water').some(r => r.water === 120)) || (S.water === 200 && !recs('water').some(r => r.water === 200));
}
function renderTask() {
  const i = STEPS.findIndex(x => x.id === S.step), task = TASK[S.step], done = S.done.includes(S.step);
  $('#task-kicker').textContent = `任務 ${i + 1} / ${STEPS.length}${done ? '　✓ 已完成' : ''}`;
  $('#task-title').textContent = task.title; $('#task-goal').textContent = task.goal;
  const go = $('#task-go');
  if (done && S.step === 'quiz') { go.hidden = false; go.textContent = '看成果 →'; go.onclick = openFinish; }
  else if (done) { go.hidden = false; go.textContent = '下一步 →'; go.onclick = () => goStep(NEXT[S.step]); }
  else go.hidden = true;
  $('#dock-pull').hidden = !isLab(); $('#dock-calc').hidden = S.step !== 'calc'; $('#dock-quiz').hidden = S.step !== 'quiz';
  if (isLab()) {
    const c = CTL[S.step];
    $('#ctl-label').innerHTML = c.label;
    const a = $('#ctl-a'); a.textContent = c.a[0]; a.onclick = c.a[1];
    a.disabled = S.step === 'add' ? S.solute >= 50 : S.step === 'heat' ? S.T >= 60 : S.step === 'cool' ? S.T <= 20 : S.water >= 200;
    $('#ctl-b').hidden = true; a.parentElement.classList.remove('two'); a.parentElement.classList.add('one');
  }
  $('#save').classList.toggle('cue', readyToSave());
  if (S.step === 'calc') renderCalc();
  if (S.step === 'quiz') renderQuiz();
}

/* ---------- 算一算 ---------- */
let calcBuilt = false;
const calcReady = () => recs('add').some(r => r.solute === 50) && recs('water').some(r => r.water === 200);
function renderCalc() {
  $('#calc-head').textContent = calcReady() ? '你的證據：20°C、100 g 水溶解 30 g（杯底 20 g）；200 g 水溶解 50 g' : '先收下「加溶質」和「加水」的證據';
  const box = $('#calc-rows');
  if (!calcBuilt) {
    calcBuilt = true;
    box.replaceChildren(...CALC.map(r => {
      const lab = document.createElement('label'); lab.className = 'calc-row'; lab.htmlFor = 'calc-' + r.id;
      lab.innerHTML = `<span class="calc-name"><b>${r.name}</b><span class="calc-eq">${r.eq}</span></span><input id="calc-${r.id}" inputmode="decimal" autocomplete="off"><span>${r.unit}</span>`;
      lab.querySelector('input').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
      return lab;
    }));
  }
  const ok = calcReady();
  for (const r of CALC) { const inp = $('#calc-' + r.id); inp.disabled = !ok; if (document.activeElement !== inp) inp.value = S.calc[r.id] || ''; }
  $('#check').disabled = !ok;
}
const num = v => { const t = String(v).normalize('NFKC').trim().replace(/[g%\s]/gi, '').replace('，', '.'); return /^\d*\.?\d+$/.test(t) ? Number(t) : NaN; };
function check() {
  const res = {};
  for (const r of CALC) {
    const inp = $('#calc-' + r.id); S.calc[r.id] = inp.value; const v = num(inp.value);
    res[r.id] = Math.abs(v - r.answer) < (r.tol ?? 1e-9);
    inp.classList.toggle('ok', res[r.id]); inp.classList.toggle('bad', !res[r.id] && inp.value.trim() !== '');
  }
  save();
  if (CALC.every(r => res[r.id])) { if (!S.done.includes('calc')) S.done.push('calc'); foundShown = 'calc'; lastNote = null; save(); render(); return; }
  const w = CALC.find(r => !res[r.id]), v = num($('#calc-' + w.id).value);
  let msg;
  if (Number.isNaN(v)) msg = `先在「${w.name}」那一格填數字。`;
  else if (w.id === 'sol') msg = Math.abs(v - 150) < 1e-9 ? '杯底的 20 g 沒有溶解，不算在溶液裡：100 ＋ 30 ＝ ？' : '溶液 ＝ 水 100 g ＋ 已溶解的 30 g。';
  else if (w.id === 'c1') msg = Math.abs(v - 100 * 50 / 150) < 0.06 ? '杯底的固體不算：要用 30 ÷ 130，不是 50 ÷ 150。' : Math.abs(v - 30) < 1e-9 ? '30 是溶質的質量。濃度還要除以溶液 130 g，再乘 100。' : Math.abs(v - 0.231) < 0.001 ? '還要乘 100，換成百分比。' : Math.abs(v - 23) < 1e-9 ? '再精確一點：算到小數第一位。' : '30 ÷ 130 × 100 ＝ ？（到小數第一位）';
  else msg = Math.abs(v - 25) < 1e-9 ? '分母是溶液：200 ＋ 50 ＝ 250，不是只有水 200。' : '50 ÷ 250 × 100 ＝ ？';
  oops(msg);
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
const STEP_NAME = { add: '加溶質', heat: '加熱', cool: '冷卻', water: '加水' };
function chipHtml(r) { return `<small>#${r.n} ${STEP_NAME[r.step]}・${r.T}°C・水 ${r.water} g</small><b>溶 ${g(r.dissolved)} g｜底 ${g(r.solid)} g</b><span class="res${r.sat ? '' : ' ok'}">${pct(r.conc)}%・${r.sat ? '飽和' : '未飽和'}</span>`; }
function renderEvidence() {
  const n = S.records.length;
  $('#ev-count').textContent = n; $('#note-count').textContent = n; $('#ev-empty').hidden = n > 0;
  const chips = $('#chips'), want = S.records.slice(-4).reverse(), key = want.map(r => r.n).join(',');
  if (chips.dataset.key === key) return; chips.dataset.key = key;
  chips.replaceChildren(...want.map(r => { const li = document.createElement('li'); li.className = 'chip'; li.innerHTML = chipHtml(r); return li; }));
}
function keep() {
  if (!isLab()) return;
  if (S.saved) { oops('這一杯已經收下了。改變條件後再收。'); return; }
  if (anim) return;
  if (S.records.length >= 50) { oops('手冊滿 50 張了，清空紀錄才能再收。'); return; }
  const m = model();
  S.records.push({ n: S.records.length + 1, at: new Date().toISOString(), step: S.step, T: S.T, water: S.water, solute: S.solute, dissolved: m.dissolved, solid: m.solid, conc: m.concentration, sat: m.saturated });
  S.saved = true; lastNote = null;
  const step = S.step;
  const stepDone = step === 'add' ? S.solute >= 50 : step === 'heat' ? S.T === 60 : step === 'cool' ? S.T === 20 : !waterHint();
  if (stepDone && !S.done.includes(step)) { S.done.push(step); foundShown = step; }
  save();
  const target = isVisible($('#evidence')) ? $('#evidence') : $('#note-count');
  fly($('#save'), target, `${S.T}°C 水 ${S.water} g：${pct(m.concentration)}%`).then(() => { renderEvidence(); bump($('#note-count')); });
  render();
}
const isVisible = n => { const r = n.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };

/* ---------- 步驟 ---------- */
function goStep(id) {
  if (anim) { cancelAnimationFrame(anim); anim = null; }
  S.step = id; foundShown = null; lastNote = null;
  if (START[id]) { Object.assign(S, START[id]); S.saved = false; }
  shownT = S.T;
  if (id === 'quiz' && !S.done.includes('quiz')) S.quiz = { i: 0, pick: null };
  calcBuilt = false; save(); teacher.last = ''; render();
  if (narrow.matches) scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
}
function resetStep() {
  if (S.step === 'calc') CALC.forEach(r => delete S.calc[r.id]);
  if (S.step === 'quiz') S.quiz = { i: 0, pick: null };
  goStep(S.step);
}

/* ---------- 對話框 ---------- */
function openNotes() {
  const body = $('#notes-body'); body.replaceChildren();
  if (!S.records.length) { const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="5" class="notes-empty">還沒有證據。</td>'; body.append(tr); }
  for (const r of S.records) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.n}</td>` + [`${STEP_NAME[r.step]}：${r.T}°C、水 ${r.water} g、A ${r.solute} g`, `${g(r.dissolved)} g`, `${g(r.solid)} g`, `${pct(r.conc)}%（${r.sat ? '飽和' : '未飽和'}）`].map(c => `<td>${c}</td>`).join('');
    body.append(tr);
  }
  $('#notes-dialog').showModal();
}
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#F4C04E" stroke="#23304A" stroke-width="1.2" stroke-linejoin="round"/></svg>';
function openFinish() {
  const got = STEPS.filter(s => S.done.includes(s.id)).length;
  $('#stars').innerHTML = STEPS.map(s => S.done.includes(s.id) ? STAR : STAR.replace('<svg', '<svg class="off"')).join('');
  $('#stars').setAttribute('aria-label', `完成 ${STEPS.length} 個任務中的 ${got} 個`);
  const line = (step, pred, label) => { const r = recs(step).filter(pred).pop(); return r && `<li><b>${label}</b>：${r.T}°C、水 ${r.water} g → 溶解 ${g(r.dissolved)} g、杯底 ${g(r.solid)} g、濃度 ${pct(r.conc)}%</li>`; };
  $('#finish-list').innerHTML = [line('add', r => r.solute === 50, '加 50 g'), line('heat', r => r.T === 60, '加熱'), line('cool', r => r.T === 20, '冷卻'), line('water', r => r.water === 120, '加水到 120 g'), line('water', r => r.water === 200, '加水到 200 g')].filter(Boolean).join('');
  $('#finish-dialog').showModal();
}
function clearAll() {
  if (!confirm('要清空這一站的所有證據和進度，從第 1 步重新開始嗎？')) return;
  if (anim) { cancelAnimationFrame(anim); anim = null; }
  db.clear(); S = fresh(); shownT = S.T; foundShown = null; lastNote = null; teacher.last = ''; calcBuilt = false;
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  render(); if (narrow.matches) scrollTo({ top: 0 });
}

/* ---------- 版面 ---------- */
const narrow = matchMedia('(max-width: 860px)');
function fitScene() { svg.setAttribute('viewBox', narrow.matches ? '250 150 640 460' : '150 130 760 480'); }
narrow.addEventListener?.('change', () => render());
function render() {
  renderSteps($('#steps'), STEPS, S.step, new Set(S.done), id => goStep(id));
  fitScene(); draw(); drawGraph(); renderReadouts(); renderEvidence(); renderTask(); talk();
}

$('#save').addEventListener('click', keep);
$('#check').addEventListener('click', check);
$('#task-reset').addEventListener('click', resetStep);
$('#clear-records').addEventListener('click', clearAll);
$('#reset-all').addEventListener('click', clearAll);
$('#why').addEventListener('click', () => $('#why-dialog').showModal());
$('#open-notes').addEventListener('click', openNotes);
document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

render();
