// 酸鹼中和實驗桌（新版實驗桌設計）
// pH、過量離子與酚酞顏色直接用 scripts/science/models.mjs 的 calculate('neutralization')；不另寫模型。
import { calculate } from '../../../scripts/science/models.mjs';
import { $, Teacher, renderSteps, fly, bump, reduceMotion } from '../shared/lab.js';
import { openNotebook } from '../shared/notebook.mjs';

const NS = 'http://www.w3.org/2000/svg';
const P = '../../../assets/science/props/';
const db = await openNotebook('bhcs.lab.neutralization.v1');
const ACID = { ca: 0.1, va: 25 };
const CUPS = { a: { cb: 0.1, name: '第 1 杯', base: '0.10 M' }, b: { cb: 0.05, name: '第 2 杯', base: '0.05 M' } };
const model = (cup, vb) => calculate('neutralization', { ...ACID, cb: CUPS[cup].cb, vb });
const ph = r => r.pH.toFixed(2);
const KIND = { acidic: '酸性', neutral: '中性', basic: '鹼性' };

const STEPS = [
  { id: 'acid', label: '量酸液' },
  { id: 'add', label: '加鹼液' },
  { id: 'neutral', label: '中和點' },
  { id: 'half', label: '濃度減半' },
  { id: 'calc', label: '算一算' },
  { id: 'quiz', label: '說說看' }
];
const NEXT = { acid: 'add', add: 'neutral', neutral: 'half', half: 'calc', calc: 'quiz' };
const LAB = { acid: { cup: 'a', start: 0, max: 0, need: [0] }, add: { cup: 'a', start: 0, max: 20, need: [20] }, neutral: { cup: 'a', start: 20, max: 26, need: [25, 26] }, half: { cup: 'b', start: 0, max: 50, need: [25, 50] } };
const TASK = {
  acid: { title: '先量酸液，還沒加鹼', goal: '錐形瓶裡是 25 mL、0.10 M 鹽酸，加了幾滴酚酞。看 pH 計和液體顏色，按「收下這次觀察」當作基準。',
    intro: '這是鹽酸，滴了酚酞。看看 pH 計讀多少？什麼顏色？',
    found: ['鹽酸 pH 1.00，酚酞是無色。', '酸性：pH 小於 7'] },
  add: { title: '加了鹼，還是酸嗎？', goal: '按滴定管的活栓（或「滴 1 mL」「滴 5 mL」），把 0.10 M 氫氧化鈉加到 20 mL，看 pH 和顏色，再收下。',
    intro: '滴定管裡是 0.10 M 氫氧化鈉。轉開活栓，一點一點加進去。',
    found: ['加了 20 mL，pH 只升到 1.95，還是酸性。', '加了鹼不一定就中和：H⁺ 還比 OH⁻ 多'] },
  neutral: { title: '找出中和點，再多加一點', goal: '繼續滴。加到 25 mL 時收下一次；再多加 1 mL 到 26 mL，看顏色，再收下一次。',
    intro: '還差多少才中和？慢慢滴，注意 pH 計和顏色。',
    found: ['25 mL 時 pH 7.00，還是無色；多 1 mL 就變粉紅。', '中和點 pH 7 是無色；粉紅表示已經變鹼性，不是剛好中和'] },
  half: { title: '只把鹼液濃度減半', goal: '換一杯一樣的鹽酸，滴定管換成 0.05 M 氫氧化鈉。加到 25 mL 收下一次，再加到 50 mL 收下一次。',
    intro: '酸液一樣，鹼液濃度只有一半。還是 25 mL 就中和嗎？',
    found: ['濃度減半，要加到 50 mL 才中和。', '每 mL 的 OH⁻ 只有一半，體積要兩倍才一樣多'] },
  calc: { title: '算一算：中和要多少鹼液？', goal: '用 a × M₁ × V₁ ＝ b × M₂ × V₂。先算鹽酸，再算換成硫酸（H₂SO₄，每莫耳給 2 個 H⁺）。',
    intro: '中和時 H⁺ 和 OH⁻ 一樣多。用算式驗證你的實驗。',
    found: ['鹽酸要 25 mL；同樣的硫酸要 50 mL。', '硫酸 a ＝ 2：2 × 0.10 × 25 ＝ 1 × 0.10 × V，V ＝ 50 mL'] },
  quiz: { title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。',
    intro: '最後三題！想想你收下的證據。',
    found: ['你找到中和點了！', '中和看 H⁺ 和 OH⁻ 的量，不是看體積或顏色'] }
};
const CALC = [
  { id: 'hcl', name: '鹽酸 HCl 25 mL、0.10 M', eq: '1 × 0.10 × 25 ＝ 1 × 0.10 × V', answer: 25, unit: 'mL' },
  { id: 'h2so4', name: '硫酸 H₂SO₄ 25 mL、0.10 M', eq: '2 × 0.10 × 25 ＝ 1 × 0.10 × V', answer: 50, unit: 'mL' }
];
const QUIZ = [
  { q: '第 1 杯的鹼液加到多少時，pH 是 7？', options: [
    { text: '20 mL', why: '你的證據：20 mL 時 pH 1.95，還是酸性。' },
    { text: '25 mL', ok: true },
    { text: '26 mL', why: '26 mL 時 pH 11.29、變粉紅，已經是鹼性了。' }] },
  { q: '鹼液濃度減半，為什麼要加到 50 mL 才中和？', options: [
    { text: '酸、鹼液的體積一樣就會中和。', why: '第 2 杯加了 25 mL（體積一樣）pH 才 1.60，還沒中和。' },
    { text: '每 mL 的 OH⁻ 只有一半，要兩倍體積才有一樣多的 OH⁻。', ok: true },
    { text: '因為酚酞變淡了。', why: '酚酞只看 pH 是否大於約 8.2，和要加多少鹼無關。' }] },
  { q: '25 mL 時無色，26 mL 時變粉紅。從這兩筆可以知道什麼？', options: [
    { text: '粉紅表示已經偏鹼性，不是剛好中和。', ok: true },
    { text: '無色一定是酸性。', why: '25 mL 時 pH 7.00 是中性，也是無色。無色分不出酸性和中性。' },
    { text: '只看顏色就能讀出 pH。', why: '酚酞只分成「pH 約 8.2 以下無色、以上粉紅」，要知道 pH 還是要看 pH 計。' }] }
];

/* ---------- 狀態 ---------- */
const fresh = () => ({ v: 1, step: 'acid', vb: 0, records: [], done: [], calc: {}, quiz: { i: 0, pick: null } });
function loadState() {
  const s = db.load();
  try {
    if (!s || s.v !== 1 || !STEPS.some(x => x.id === s.step) || !Array.isArray(s.records) || !Array.isArray(s.done) || !s.calc || !s.quiz) throw 0;
    const L = LAB[s.step];
    if (!Number.isInteger(s.vb) || (L && (s.vb < L.start || s.vb > L.max))) throw 0;
    if (s.records.some(r => !CUPS[r.cup])) throw 0;
    return s;
  } catch { return fresh(); }
}
let S = loadState(), foundShown = null, lastNote = null, dropFx = 0;
const save = () => db.save(S);
const L = () => LAB[S.step];
const isLab = () => !!L();
const cup = () => L()?.cup || 'a';
const has = (c, vb) => S.records.some(r => r.cup === c && r.vb === vb);

const svg = $('#scene'), rig = $('#rig');
const teacher = new Teacher($('#teacher-pic'), $('#bubble'), $('#live'));
const el = (tag, a = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (parent) parent.append(n); return n; };
const txt = (parent, x, y, s, a = {}) => { const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#23304A', ...a }, parent); t.textContent = s; return t; };

/* ---------- 場景 ---------- */
const BU = { x: 610, y: 40, w: 66, h: 330 };                     // 滴定管（圖 103×512）
const SCALE = { top: BU.y + BU.h * 0.05, bot: BU.y + BU.h * 0.72 }; // 0～50 mL 刻度範圍
const COCK = { x: BU.x + BU.w * 0.66, y: BU.y + BU.h * 0.8 };
const TIP = { x: BU.x + BU.w * 0.36, y: BU.y + BU.h - 4 };
const FL = { w: 200, h: 268 }; FL.x = TIP.x - FL.w / 2; FL.y = 330;   // 錐形瓶（圖 381×512）
function flaskHalf(y) {                                               // 錐形瓶內緣半寬
  const neckEnd = FL.y + FL.h * 0.3, bottom = FL.y + FL.h * 0.93;
  if (y < neckEnd) return FL.w * 0.16;
  return FL.w * 0.16 + (y - neckEnd) / (bottom - neckEnd) * FL.w * 0.3;
}
function draw() {
  const hadFocus = !!document.activeElement && rig.contains(document.activeElement);
  rig.replaceChildren();
  if (!isLab()) { drawSummary(); return; }
  const c = cup(), r = model(c, S.vb), cx = TIP.x;
  // 鐵架
  el('rect', { x: 470, y: 60, width: 14, height: 520, rx: 5, fill: '#8896A5', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: 410, y: 572, width: 170, height: 22, rx: 6, fill: '#3E6C9A', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: 470, y: 120, width: BU.x - 470 + 12, height: 12, rx: 4, fill: '#8896A5', stroke: '#23304A', 'stroke-width': 3 }, rig);
  // 錐形瓶裡的溶液
  const bottom = FL.y + FL.h * 0.93, level = bottom - 34 - (ACID.va + S.vb) * 1.25;
  const pts = [];
  for (let y = level; y <= bottom; y += 6) pts.push([cx - flaskHalf(y), y]);
  for (let y = bottom; y >= level; y -= 6) pts.push([cx + flaskHalf(y), y]);
  const pinkK = r.pink ? Math.min(1, (r.pH - 8.2) / 2 + 0.6) : 0;
  el('path', { d: 'M ' + pts.map(p => p.join(' ')).join(' L ') + ' Z', fill: r.pink ? `rgba(236,${Math.round(120 - 40 * pinkK)},${Math.round(170 - 20 * pinkK)},${0.55 + 0.3 * pinkK})` : 'rgba(215,235,248,.75)' }, rig);
  el('line', { x1: cx - flaskHalf(level), y1: level, x2: cx + flaskHalf(level), y2: level, stroke: 'rgba(255,255,255,.9)', 'stroke-width': 3 }, rig);
  // pH 計探棒
  el('path', { d: `M ${cx + 34} ${bottom - 30} L ${cx + 40} ${FL.y - 20} Q ${cx + 50} ${FL.y - 70} ${cx + 160} ${FL.y - 40} L 850 ${FL.y + 70}`, fill: 'none', stroke: '#23304A', 'stroke-width': 4 }, rig);
  el('image', { href: P + 'prop-erlenmeyer.webp', x: FL.x, y: FL.y, width: FL.w, height: FL.h }, rig);
  // pH 計
  const mx = 790, my = FL.y + 60, kc = r.kind === 'acidic' ? '#C8372D' : r.kind === 'basic' ? '#2F6FB0' : '#2E7D63';
  el('rect', { x: mx, y: my, width: 170, height: 130, rx: 16, fill: '#2E7D63', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, mx + 85, my + 28, 'pH 計', { fill: '#fff', 'font-size': 17, 'font-weight': 900 });
  el('rect', { x: mx + 18, y: my + 40, width: 134, height: 50, rx: 8, fill: '#F4FFF6', stroke: '#23304A', 'stroke-width': 2 }, rig);
  txt(rig, mx + 85, my + 76, ph(r), { 'font-size': 32, 'font-weight': 900, fill: kc });
  txt(rig, mx + 85, my + 116, KIND[r.kind], { fill: '#fff', 'font-size': 16, 'font-weight': 900 });
  // 酚酞名牌
  el('rect', { x: FL.x - 150, y: bottom - 60, width: 138, height: 54, rx: 12, fill: '#fff', stroke: '#23304A', 'stroke-width': 2.5 }, rig);
  txt(rig, FL.x - 81, bottom - 38, '酚酞', { 'font-size': 14, 'font-weight': 800, fill: '#5A6478' });
  txt(rig, FL.x - 81, bottom - 15, r.pink ? '粉紅色' : '無色', { 'font-size': 18, 'font-weight': 900, fill: r.pink ? '#D23C7A' : '#23304A' });
  el('rect', { x: FL.x - 150, y: level - 16, width: 138, height: 32, rx: 10, fill: '#fff', stroke: '#23304A', 'stroke-width': 2.5 }, rig);
  txt(rig, FL.x - 81, level + 6, S.vb ? `鹽酸 25 ＋ 鹼液 ${S.vb} mL` : '鹽酸 25 mL', { 'font-size': 13, 'font-weight': 900 });
  // 滴定管與鹼液
  const yAt = v => SCALE.top + v / 50 * (SCALE.bot - SCALE.top);
  el('rect', { x: BU.x + BU.w * 0.29, y: yAt(S.vb), width: BU.w * 0.16, height: COCK.y - 8 - yAt(S.vb), fill: 'rgba(150,190,240,.65)' }, rig);
  el('image', { href: P + 'prop-burette.webp', x: BU.x, y: BU.y, width: BU.w, height: BU.h }, rig);
  for (let v = 0; v <= 50; v += 5) {
    const y = yAt(v), major = v % 10 === 0;
    el('line', { x1: BU.x + BU.w * 0.22, y1: y, x2: BU.x + BU.w * 0.22 - (major ? 14 : 8), y2: y, stroke: '#23304A', 'stroke-width': 2 }, rig);
    if (major) txt(rig, BU.x + BU.w * 0.22 - 28, y + 5, String(v), { 'font-size': 12, 'font-weight': 800, 'text-anchor': 'middle' });
  }
  txt(rig, BU.x - 30, SCALE.top - 12, 'mL', { 'font-size': 12 });
  el('line', { x1: BU.x + BU.w * 0.45, y1: yAt(S.vb), x2: BU.x + BU.w + 20, y2: yAt(S.vb), stroke: '#C8372D', 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }, rig);
  el('rect', { x: BU.x + BU.w + 22, y: yAt(S.vb) - 16, width: 128, height: 32, rx: 16, fill: '#C8372D' }, rig);
  txt(rig, BU.x + BU.w + 86, yAt(S.vb) + 6, `已加入 ${S.vb} mL`, { fill: '#fff', 'font-size': 15, 'font-weight': 900 });
  el('rect', { x: BU.x + BU.w + 22, y: BU.y + 6, width: 150, height: 30, rx: 10, fill: '#fff', stroke: '#23304A', 'stroke-width': 2 }, rig);
  txt(rig, BU.x + BU.w + 97, BU.y + 27, `NaOH ${CUPS[c].base}`, { 'font-size': 15, 'font-weight': 900, fill: '#1F4E80' });
  if (c === 'b') txt(rig, FL.x + FL.w / 2, FL.y + FL.h + 22, '第 2 杯（新的鹽酸）', { 'font-size': 15, 'font-weight': 900 });
  if (dropFx) el('ellipse', { class: 'drop', cx: TIP.x, cy: TIP.y + 6, rx: 4, ry: 6, fill: 'rgba(110,170,235,.95)' }, rig);
  // 活栓（直接操作）
  const can = S.vb < L().max;
  const tg = el('g', { class: 'tool', tabindex: 0, role: 'button', 'aria-label': can ? '滴定管活栓：滴入 1 mL 鹼液' : '滴定管活栓：這一步不用再滴' }, rig);
  el('circle', { class: 'tool-ring', cx: COCK.x, cy: COCK.y, r: 22, fill: 'rgba(255,255,255,.3)', stroke: '#E0A21B', 'stroke-width': 4 }, tg);
  el('circle', { cx: COCK.x, cy: COCK.y, r: 34, fill: 'transparent' }, tg);
  if (can && !readyToSave()) { tg.classList.add('cue'); txt(rig, COCK.x + 34, COCK.y + 6, '← 轉開活栓', { 'font-size': 15, 'font-weight': 900, fill: '#C8372D', 'text-anchor': 'start' }); }
  tg.addEventListener('click', () => drip(1));
  tg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); drip(1); } });
  if (hadFocus) tg.focus({ preventScroll: true });
}
function drawSummary() {
  el('image', { href: P + 'prop-burette.webp', x: 560, y: 120, width: 50, height: 250 }, rig);
  el('image', { href: P + 'prop-erlenmeyer.webp', x: 640, y: 230, width: 150, height: 201 }, rig);
  txt(rig, 700, 470, S.step === 'calc' ? 'a × M₁ × V₁ ＝ b × M₂ × V₂' : '證據都在研究手冊裡', { 'font-size': 22, 'font-weight': 900 });
}

/* ---------- 操作 ---------- */
function drip(n) {
  if (!isLab()) return;
  const max = L().max;
  if (S.step === 'acid') { oops('這一步先不要加鹼，讀完基準收下就好。'); return; }
  if (S.vb >= max) { oops(S.step === 'add' ? '加到 20 mL 就好，先收下這次觀察。' : S.step === 'neutral' ? '26 mL 就夠了，收下這次觀察。' : '已經加到 50 mL 了。'); return; }
  if (readyToSave()) { oops(`先收下 ${S.vb} mL 這次觀察，再繼續滴。`); return; }
  // 跨過還沒收下的關鍵點時停下來
  const stop = L().need.find(v => v > S.vb && v < S.vb + n && !has(cup(), v));
  S.vb = stop ?? Math.min(max, S.vb + n);
  foundShown = null; lastNote = null;
  if (!reduceMotion()) { dropFx++; const k = dropFx; setTimeout(() => { if (dropFx === k) { dropFx = 0; draw(); } }, 480); }
  save(); render();
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
  const c = cup(), vb = isLab() ? S.vb : 25, r = model(c, vb);
  setReading(1, '加入鹼液', vb, 'mL', `NaOH ${CUPS[c].base}` + (S.done.includes(c === 'a' ? 'neutral' : 'half') ? `，中和點 ${r.veq} mL` : ''));
  setReading(2, 'pH', ph(r), '', KIND[r.kind] + (r.excess ? `，${r.excess} 過量` : '，恰好中和'));
  setReading(3, '酚酞', r.pink ? '粉紅' : '無色', '', 'pH 大於約 8.2 才變粉紅');
}

/* ---------- 滴定曲線 ---------- */
const GR = { l: 34, r: 306, t: 28, b: 162 };
const gx = v => GR.l + v / 55 * (GR.r - GR.l), gy = p => GR.b - p / 14 * (GR.b - GR.t);
function drawGraph() {
  const g = $('#graph'); g.replaceChildren();
  for (let p = 0; p <= 14; p += 2) { el('line', { x1: GR.l, y1: gy(p), x2: GR.r, y2: gy(p), stroke: '#EEE6D8' }, g); if (p % 4 === 0 || p === 14) txt(g, GR.l - 6, gy(p) + 4, String(p), { 'font-size': 11, 'font-weight': 700, 'text-anchor': 'end' }); }
  for (let v = 0; v <= 50; v += 10) txt(g, gx(v), GR.b + 15, String(v), { 'font-size': 11, 'font-weight': 700 });
  el('line', { x1: GR.l, y1: gy(7), x2: GR.r, y2: gy(7), stroke: '#2E7D63', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, g);
  txt(g, GR.r - 2, gy(7) - 4, 'pH 7', { 'font-size': 10, 'font-weight': 900, fill: '#2E7D63', 'text-anchor': 'end' });
  el('rect', { x: GR.l, y: GR.t, width: GR.r - GR.l, height: gy(8.2) - GR.t, fill: 'rgba(236,90,150,.08)' }, g);
  txt(g, GR.l + 4, GR.t + 11, '粉紅（pH > 8.2）', { 'font-size': 10, 'font-weight': 900, fill: '#D23C7A', 'text-anchor': 'start' });
  el('path', { d: `M ${GR.l} ${GR.t} V ${GR.b} H ${GR.r}`, fill: 'none', stroke: '#23304A', 'stroke-width': 2 }, g);
  txt(g, GR.r, GR.b + 30, '加入鹼液（mL）', { 'font-size': 11, 'font-weight': 700, 'text-anchor': 'end' });
  txt(g, GR.l - 6, GR.t - 12, 'pH', { 'font-size': 11, 'font-weight': 700, 'text-anchor': 'start' });
  const color = { a: '#2F6FB0', b: '#E08A1E' };
  const line = (c, end) => {
    const pts = []; for (let v = 0; v <= end + 1e-9; v += 0.25) pts.push(`${gx(v).toFixed(1)} ${gy(model(c, v).pH).toFixed(1)}`);
    if (pts.length > 1) el('path', { d: 'M ' + pts.join(' L '), fill: 'none', stroke: color[c], 'stroke-width': 2.5 }, g);
  };
  const maxRec = c => Math.max(-1, ...S.records.filter(r => r.cup === c).map(r => r.vb));
  for (const c of ['a', 'b']) {
    const end = Math.max(maxRec(c), isLab() && cup() === c ? S.vb : -1);
    if (end > 0) line(c, end);
    for (const r of S.records.filter(r => r.cup === c)) el('circle', { cx: gx(r.vb), cy: gy(r.pH), r: 5, fill: color[c], stroke: '#fff', 'stroke-width': 2 }, g);
  }
  if (isLab()) { const r = model(cup(), S.vb); el('circle', { cx: gx(S.vb), cy: gy(r.pH), r: 6, fill: 'none', stroke: '#C8372D', 'stroke-width': 2.5 }, g); }
  $('#graph-key').innerHTML = `<li><i style="background:#2F6FB0"></i>第 1 杯（NaOH 0.10 M）</li><li><i style="background:#E08A1E"></i>第 2 杯（0.05 M）</li>`;
  g.setAttribute('aria-label', '滴定曲線：' + (S.records.map(r => `${CUPS[r.cup].name} ${r.vb} mL pH ${r.pH.toFixed(2)}`).join('，') || '還沒有資料'));
}

/* ---------- 余老師 ---------- */
function oops(t) { teacher.last = ''; teacher.say(t, { pose: 'think', tone: 'oops' }); lastNote = t; }
const readyToSave = () => isLab() && L().need.includes(S.vb) && !has(cup(), S.vb);
const stepDone = () => isLab() && L().need.every(v => has(cup(), v));
function talk() {
  if (lastNote) return;
  if (foundShown) {
    const f = TASK[foundShown].found;
    const action = foundShown === 'quiz' ? { label: '看成果 →', run: openFinish } : { label: '下一步 →', run: () => goStep(NEXT[foundShown]) };
    teacher.say(f[0], { pose: 'cheer', tone: 'found', tag: '發現時刻', eq: f[1], action }); return;
  }
  const step = S.step, done = S.done.includes(step), task = TASK[step];
  if (step === 'calc') {
    if (!S.done.includes('neutral') || !S.done.includes('half')) { teacher.say('先完成「中和點」和「濃度減半」，再來算。', { pose: 'think' }); return; }
    teacher.say(done ? '算對了！按任務卡的「下一步」繼續。' : task.intro, { pose: done ? 'thumb' : 'notebook' }); return;
  }
  if (step === 'quiz') { teacher.say(done ? '全部完成了！可以按「看成果」。' : task.intro, { pose: done ? 'thumb' : 'think' }); return; }
  if (done) { teacher.say('這一步完成了，按任務卡的「下一步」繼續。', { pose: 'thumb' }); return; }
  const r = model(cup(), S.vb);
  if (readyToSave()) {
    const say = {
      0: `pH ${ph(r)}，無色。收下這次觀察。`,
      20: `20 mL：pH ${ph(r)}，還是${KIND[r.kind]}、無色。收下這次觀察。`,
      25: cup() === 'a' ? `25 mL：pH 7.00，中和了！顏色還是無色。收下這次觀察。` : `25 mL：pH ${ph(r)}，還是酸性！和第 1 杯不一樣。收下這次觀察。`,
      26: `26 mL：變粉紅了！pH 跳到 ${ph(r)}。收下這次觀察。`,
      50: `50 mL：pH 7.00，中和了。收下這次觀察。`
    }[S.vb];
    teacher.say(say, { pose: 'wow' }); return;
  }
  if (S.vb === L().start && !S.records.some(x => x.cup === cup() && x.vb > L().start)) { teacher.say(task.intro, { pose: 'point' }); return; }
  const next = L().need.find(v => !has(cup(), v));
  teacher.say(`${S.vb} mL：pH ${ph(r)}，${KIND[r.kind]}。${next !== undefined && next > S.vb ? `繼續滴到 ${next} mL。` : ''}`, { pose: 'point' });
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
  $('#dock-pull').hidden = !isLab(); $('#dock-calc').hidden = S.step !== 'calc'; $('#dock-quiz').hidden = S.step !== 'quiz';
  if (isLab()) {
    $('#ctl-box').hidden = S.step === 'acid';
    $('#drip1').disabled = $('#drip5').disabled = S.vb >= L().max;
  }
  $('#save').classList.toggle('cue', readyToSave());
  if (S.step === 'calc') renderCalc();
  if (S.step === 'quiz') renderQuiz();
}

/* ---------- 算一算 ---------- */
let calcBuilt = false;
function renderCalc() {
  const ok = S.done.includes('neutral') && S.done.includes('half');
  $('#calc-head').textContent = ok ? '你的證據：0.10 M 鹼液 25 mL 中和；0.05 M 鹼液要 50 mL。鹼液都用 0.10 M 氫氧化鈉（b ＝ 1）。' : '先完成「中和點」和「濃度減半」';
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
  for (const r of CALC) { const inp = $('#calc-' + r.id); inp.disabled = !ok; if (document.activeElement !== inp) inp.value = S.calc[r.id] || ''; }
  $('#check').disabled = !ok;
}
const num = v => { const t = String(v).normalize('NFKC').trim().replace(/ml|\s/gi, ''); return /^\d*\.?\d+$/.test(t) ? Number(t) : NaN; };
function check() {
  const res = {};
  for (const r of CALC) {
    const inp = $('#calc-' + r.id); S.calc[r.id] = inp.value; const v = num(inp.value);
    res[r.id] = Math.abs(v - r.answer) < 1e-9;
    inp.classList.toggle('ok', res[r.id]); inp.classList.toggle('bad', !res[r.id] && inp.value.trim() !== '');
  }
  save();
  if (CALC.every(r => res[r.id])) { if (!S.done.includes('calc')) S.done.push('calc'); foundShown = 'calc'; lastNote = null; save(); render(); return; }
  const w = CALC.find(r => !res[r.id]), v = num($('#calc-' + w.id).value);
  let msg;
  if (Number.isNaN(v)) msg = `先在「${w.name}」那一格填數字。`;
  else if (w.id === 'hcl') msg = '兩邊的 a、b、M 都一樣，所以 V 也一樣。你的第 1 杯是加到多少 mL 中和的？';
  else msg = Math.abs(v - 25) < 1e-9 ? '硫酸每莫耳給 2 個 H⁺，a ＝ 2：2 × 0.10 × 25 ＝ 0.10 × V。' : Math.abs(v - 12.5) < 1e-9 ? '反了：硫酸的 H⁺ 比較多，需要的鹼液比較多，不是比較少。' : '2 × 0.10 × 25 ＝ 5，再除以 0.10。';
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
function renderEvidence() {
  const n = S.records.length;
  $('#ev-count').textContent = n; $('#note-count').textContent = n; $('#ev-empty').hidden = n > 0;
  const chips = $('#chips'), want = S.records.slice(-4).reverse(), key = want.map(r => r.n).join(',');
  if (chips.dataset.key === key) return; chips.dataset.key = key;
  chips.replaceChildren(...want.map(r => { const li = document.createElement('li'); li.className = 'chip'; li.innerHTML = `<small>#${r.n} ${CUPS[r.cup].name}・鹼液 ${CUPS[r.cup].base}</small><b>${r.vb} mL：pH ${r.pH.toFixed(2)}</b><span class="res${r.pink ? '' : ' ok'}">${KIND[r.kind]}・${r.pink ? '粉紅' : '無色'}</span>`; return li; }));
}
function keep() {
  if (!isLab()) return;
  if (!readyToSave()) {
    const next = L().need.find(v => !has(cup(), v));
    oops(next === undefined ? '這一步的讀值都收下了。' : has(cup(), S.vb) ? '這個讀值已經收下了。' : `滴到 ${next} mL 時再收下。`); return;
  }
  if (S.records.length >= 60) { oops('手冊滿 60 張了，清空紀錄才能再收。'); return; }
  const r = model(cup(), S.vb);
  S.records.push({ n: S.records.length + 1, at: new Date().toISOString(), cup: cup(), vb: S.vb, pH: r.pH, kind: r.kind, pink: r.pink });
  lastNote = null;
  if (stepDone() && !S.done.includes(S.step)) { S.done.push(S.step); foundShown = S.step; }
  save();
  const target = isVisible($('#evidence')) ? $('#evidence') : $('#note-count');
  fly($('#save'), target, `${S.vb} mL：pH ${ph(r)}`).then(() => { renderEvidence(); bump($('#note-count')); });
  render();
}
const isVisible = n => { const r = n.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };

/* ---------- 步驟 ---------- */
function goStep(id) {
  S.step = id; foundShown = null; lastNote = null;
  if (LAB[id]) S.vb = LAB[id].start;
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
    tr.innerHTML = `<td>${r.n}</td>` + [`${CUPS[r.cup].name}（NaOH ${CUPS[r.cup].base}）`, `${r.vb} mL`, `${r.pH.toFixed(2)}（${KIND[r.kind]}）`, r.pink ? '粉紅' : '無色'].map(c => `<td>${c}</td>`).join('');
    body.append(tr);
  }
  $('#notes-dialog').showModal();
}
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#F4C04E" stroke="#23304A" stroke-width="1.2" stroke-linejoin="round"/></svg>';
function openFinish() {
  const got = STEPS.filter(s => S.done.includes(s.id)).length;
  $('#stars').innerHTML = STEPS.map(s => S.done.includes(s.id) ? STAR : STAR.replace('<svg', '<svg class="off"')).join('');
  $('#stars').setAttribute('aria-label', `完成 ${STEPS.length} 個任務中的 ${got} 個`);
  $('#finish-list').innerHTML = [
    S.done.includes('add') && '<li><b>加了鹼還是酸</b>：20 mL 時 pH 1.95</li>',
    S.done.includes('neutral') && '<li><b>中和點</b>：25 mL 時 pH 7.00、無色；26 mL 變粉紅</li>',
    S.done.includes('half') && '<li><b>濃度減半</b>：0.05 M 鹼液要 50 mL 才中和</li>',
    S.done.includes('calc') && '<li><b>算一算</b>：鹽酸 25 mL、硫酸 50 mL</li>'
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
  S = fresh(); foundShown = null; lastNote = null; teacher.last = ''; calcBuilt = false;
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  render(); if (narrow.matches) scrollTo({ top: 0 });
}

/* ---------- 版面 ---------- */
const narrow = matchMedia('(max-width: 860px)');
function fitScene() { svg.setAttribute('viewBox', narrow.matches ? (isLab() ? '395 40 575 570' : '450 100 500 420') : '150 20 830 600'); }
narrow.addEventListener?.('change', () => render());
function render() {
  renderSteps($('#steps'), STEPS, S.step, new Set(S.done), id => goStep(id));
  fitScene(); draw(); drawGraph(); renderReadouts(); renderEvidence(); renderTask(); talk();
}

$('#drip1').addEventListener('click', () => drip(1));
$('#drip5').addEventListener('click', () => drip(5));
$('#save').addEventListener('click', keep);
$('#check').addEventListener('click', check);
$('#task-reset').addEventListener('click', resetStep);
$('#clear-records').addEventListener('click', clearAll);
$('#reset-all').addEventListener('click', clearAll);
$('#why').addEventListener('click', () => $('#why-dialog').showModal());
$('#open-notes').addEventListener('click', openNotes);
document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

render();
