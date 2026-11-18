// 透鏡成像實驗桌（新版實驗桌設計）
// 像距與倍率直接用 scripts/science/models.mjs 的 calculate('optics')：v > 0 在透鏡另一側（實像），v < 0 在物體同側（虛像）。
import { calculate } from '../../../scripts/science/models.mjs';
import { $, Teacher, renderSteps, fly, bump, reduceMotion } from '../shared/lab.js';
import { openNotebook } from '../shared/notebook.mjs';

const NS = 'http://www.w3.org/2000/svg';
const P = '../../../assets/science/props/';
const db = await openNotebook('bhcs.lab.lens.v1');
const F = 10;
const LENSES = { convex: { name: '凸透鏡', f: F }, concave: { name: '凹透鏡', f: -F } };
const optics = (lens, u) => { const r = calculate('optics', { kind: lens, f: F, u }); return { kind: r.kind, v: r.v, m: r.m }; };
const cm = x => String(Math.round(x * 10) / 10);
const where = o => o.kind === 'focus' ? '不成像' : o.v > 0 ? `透鏡右側 ${cm(o.v)} cm` : `透鏡左側 ${cm(-o.v)} cm`;
function describe(o) {
  if (o.kind === 'focus') return '折射光平行，不成像';
  const a = Math.abs(o.m), size = Math.abs(a - 1) < 1e-9 ? '等大' : a > 1 ? '放大' : '縮小';
  return `${o.m > 0 ? '正立' : '倒立'}、${size}、${o.kind === 'real' ? '實像' : '虛像'}`;
}

const STEPS = [
  { id: 'far', label: '光屏找像' },
  { id: 'near', label: '物體靠近' },
  { id: 'focus', label: '焦點上' },
  { id: 'inside', label: '焦點內' },
  { id: 'concave', label: '凹透鏡' },
  { id: 'quiz', label: '說說看' }
];
const NEXT = { far: 'near', near: 'focus', focus: 'inside', inside: 'concave', concave: 'quiz' };
const LAB = {
  far: { lens: 'convex', u: 30, screen: true, scr: 24 },
  near: { lens: 'convex', u: 15, screen: true, scr: 15 },
  focus: { lens: 'convex', u: 10, screen: true, scr: 25, noImage: true },
  inside: { lens: 'convex', u: 5, eye: true },
  concave: { lens: 'concave', u: 5, eye: true }
};
const TASK = {
  far: { title: '用光屏找凸透鏡的像', goal: '凸透鏡焦距 10 cm，蠟燭在 30 cm。拖右邊的光屏（或按按鈕），找到像最清楚的位置，再收下。',
    intro: '蠟燭的光穿過凸透鏡會聚起來。光屏放在哪裡，才接得到清楚的像？',
    found: ['光屏在右側 15 cm 接到清楚的像：倒立、縮小。', '物距 30 cm（2 倍焦距外）→ 像距 15 cm，倒立縮小實像'] },
  near: { title: '蠟燭靠近到 15 cm', goal: '蠟燭移到 15 cm，光屏先不動。像變模糊了！再移光屏找清楚的像，收下。',
    intro: '蠟燭靠近透鏡了。光屏還在 15 cm，像還清楚嗎？',
    found: ['物體靠近，像反而變遠、變大：右側 30 cm，放大 2 倍。', '物距 15 cm（1～2 倍焦距）→ 像距 30 cm，倒立放大實像'] },
  focus: { title: '蠟燭放在焦點上', goal: '蠟燭在 10 cm，剛好在焦點 F。把光屏前後移動試試，看看右側的光線，再按「收下這次觀察」。',
    intro: '蠟燭在焦點上。移光屏找得到像嗎？看光線往哪裡走。',
    found: ['在焦點上，折射光互相平行，怎麼移光屏都接不到像。', '物距 ＝ 焦距 → 不成像'] },
  inside: { title: '蠟燭移進焦點內', goal: '蠟燭在 5 cm，比焦點更靠近透鏡。光屏接不到，改從透鏡右側用眼睛看，沿虛線找像，再收下。',
    intro: '這次光屏用不到了。從右邊往透鏡裡看，看到什麼？',
    found: ['焦點內看到正立、放大 2 倍的虛像，在蠟燭同一側。', '這就是放大鏡：物距 5 cm → 像在左側 10 cm'] },
  concave: { title: '換成凹透鏡', goal: '蠟燭一樣在 5 cm，只把凸透鏡換成凹透鏡。從右邊看，比較兩種透鏡的像，再收下。',
    intro: '凹透鏡會把光散開。像會變大還是變小？',
    found: ['凹透鏡的像是正立、縮小的虛像。', '物距 5 cm → 左側約 3.3 cm，只有 2/3 大：近視眼鏡用凹透鏡'] },
  quiz: { title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。',
    intro: '最後三題！想想你收下的證據。',
    found: ['你分清透鏡的實像和虛像了！', '凸透鏡：焦點外倒立實像、焦點上不成像、焦點內正立放大虛像'] }
};
const QUIZ = [
  { q: '凸透鏡的物距從 30 cm 移到 15 cm，清楚的像怎麼變？', options: [
    { text: '像更靠近透鏡、變小。', why: '你的證據：30 cm 時像在 15 cm、縮小；15 cm 時像在 30 cm、放大 2 倍。' },
    { text: '像更遠離透鏡、變大。', ok: true },
    { text: '像的位置不變，只有方向改變。', why: '光屏要從 15 cm 移到 30 cm 才接得到清楚的像，位置變了；兩次都是倒立。' }] },
  { q: '蠟燭在凸透鏡的焦點上，為什麼移光屏也接不到像？', options: [
    { text: '折射光互相平行，不會交會。', ok: true },
    { text: '光透不過透鏡。', why: '光有穿過透鏡，只是穿過後互相平行。' },
    { text: '光在透鏡後面馬上交會。', why: '如果馬上交會，光屏放近一點就接得到；你移光屏都接不到。' }] },
  { q: '物距都是 5 cm，凸透鏡和凹透鏡的像有什麼共同點？', options: [
    { text: '都是倒立實像。', why: '兩次的像都在蠟燭同一側、光屏接不到，是虛像，而且正立。' },
    { text: '都能投在光屏上，只是大小不同。', why: '兩個都是虛像，光屏接不到，要用眼睛看。' },
    { text: '都是正立虛像，但凸透鏡放大、凹透鏡縮小。', ok: true }] }
];

/* ---------- 狀態 ---------- */
const fresh = () => ({ v: 1, step: 'far', scr: LAB.far.scr, looked: false, tried: 0, records: [], done: [], quiz: { i: 0, pick: null } });
function loadState() {
  const s = db.load();
  try {
    if (!s || s.v !== 1 || !STEPS.some(x => x.id === s.step) || !Array.isArray(s.records) || !Array.isArray(s.done) || !s.quiz) throw 0;
    if (!Number.isInteger(s.scr) || s.scr < 5 || s.scr > 40 || typeof s.looked !== 'boolean' || !Number.isInteger(s.tried)) throw 0;
    if (s.records.some(r => !LENSES[r.lens] || !STEPS.some(x => x.id === r.step))) throw 0;
    return s;
  } catch { return fresh(); }
}
let S = loadState(), foundShown = null, lastNote = null;
const save = () => db.save(S);
const L = () => LAB[S.step];
const isLab = () => !!L();
const lens = () => L()?.lens || 'convex';
const u = () => L()?.u ?? 30;
const has = step => S.records.some(r => r.step === step);
const sharp = () => { if (!L()?.screen || L().noImage) return false; const o = optics(lens(), u()); return Math.abs(S.scr - o.v) < 1e-9; };

const svg = $('#scene'), rig = $('#rig');
const teacher = new Teacher($('#teacher-pic'), $('#bubble'), $('#live'));
const el = (tag, a = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (parent) parent.append(n); return n; };
const txt = (parent, x, y, s, a = {}) => { const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#23304A', ...a }, parent); t.textContent = s; return t; };

/* ---------- 場景 ---------- */
const MX = 650, AX = 370, PX = 9, CH = 92, CW = 62;
const xAt = d => MX + d * PX;                  // d > 0 透鏡右側；d < 0 左側（物體這側）
function candle(parent, x, m, ghost) {
  const g = el('g', { transform: `translate(${x} ${AX}) scale(${Math.abs(m)} ${m})`, opacity: ghost ? 0.55 : 1 }, parent);
  el('image', { href: P + 'prop-candle.webp', x: -CW / 2, y: -CH, width: CW, height: CH }, g);
  if (ghost) el('rect', { x: -CW / 2 - 3, y: -CH - 3, width: CW + 6, height: CH + 6, rx: 6, fill: 'none', stroke: '#2F6FB0', 'stroke-width': 2.5 / Math.abs(m), 'stroke-dasharray': `${6 / Math.abs(m)} ${4 / Math.abs(m)}` }, g);
}
function drawLens(kind) {
  const h = 150;
  // 支架（兩種透鏡共用）
  el('rect', { x: MX - 4, y: AX + h, width: 8, height: 548 - AX - h, fill: '#8896A5', stroke: '#23304A', 'stroke-width': 2 }, rig);
  el('rect', { x: MX - 30, y: 542, width: 60, height: 14, rx: 5, fill: '#5A6478' }, rig);
  if (kind === 'convex') {   // 只取圖中鏡片部分（原圖 y 0～330）
    const box = el('svg', { x: MX - 46, y: AX - h - 4, width: 92, height: 2 * h + 8, viewBox: '0 0 164 330', preserveAspectRatio: 'none' }, rig);
    el('image', { href: P + 'prop-convex-lens.webp', x: 0, y: 0, width: 164, height: 512 }, box);
    return;
  }
  el('path', { d: `M ${MX - 26} ${AX - h} L ${MX + 26} ${AX - h} Q ${MX + 6} ${AX} ${MX + 26} ${AX + h} L ${MX - 26} ${AX + h} Q ${MX - 6} ${AX} ${MX - 26} ${AX - h} Z`, fill: 'rgba(170,210,240,.55)', stroke: '#3E6C9A', 'stroke-width': 3 }, rig);
}
function ray(x1, y1, x2, y2, dashed, color = '#E0A21B') {
  el('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': dashed ? 2 : 3, 'stroke-dasharray': dashed ? '6 5' : '0', 'stroke-linecap': 'round' }, rig);
}
function drawBench() {
  const k = lens(), o = optics(k, u()), xo = xAt(-u()), tipY = AX - CH * 0.98;
  el('line', { x1: 180, y1: AX, x2: 990, y2: AX, stroke: '#23304A', 'stroke-width': 1.5, 'stroke-dasharray': '8 6' }, rig);
  el('rect', { x: 190, y: 560, width: 790, height: 34, rx: 8, fill: '#FFF6DA', stroke: '#23304A', 'stroke-width': 2.5 }, rig);
  for (let d = -45; d <= 40; d += 5) {
    const x = xAt(d); if (x < 195 || x > 975) continue;
    el('line', { x1: x, y1: 560, x2: x, y2: d % 10 === 0 ? 574 : 568, stroke: '#23304A', 'stroke-width': 2 }, rig);
    if (d % 10 === 0) txt(rig, x, 590, String(Math.abs(d)), { 'font-size': 12, 'font-weight': 800 });
  }
  txt(rig, xAt(-30), 548, '← 物體這側（cm）', { 'font-size': 13, fill: '#5A6478' });
  txt(rig, xAt(28), 548, '透鏡另一側（cm）→', { 'font-size': 13, fill: '#5A6478' });
  drawLens(k);
  el('rect', { x: MX - 50, y: AX - 196, width: 100, height: 28, rx: 14, fill: '#23304A' }, rig);
  txt(rig, MX, AX - 176, LENSES[k].name, { fill: '#fff', 'font-size': 15, 'font-weight': 900 });
  for (const d of [-F, F]) { el('circle', { cx: xAt(d), cy: AX, r: 6, fill: '#C8372D' }, rig); txt(rig, xAt(d), AX + 26, 'F', { 'font-size': 14, 'font-weight': 900, fill: '#C8372D' }); }
  // 光線：平行主軸的光、通過中心的光
  ray(xo, tipY, MX, tipY); ray(xo, tipY, MX, AX);
  const END = 985;
  if (o.kind === 'focus') {
    const xf = xAt(F); ray(MX, tipY, END, tipY + (AX - tipY) / (xf - MX) * (END - MX));
    ray(MX, AX, END, AX + (AX - tipY) / (MX - xo) * (END - MX));
  } else {
    const xi = xAt(o.v), yi = AX - CH * 0.98 * o.m;
    for (const hy of [tipY, AX]) {
      if (o.kind === 'real') ray(MX, hy, END, hy + (yi - hy) / (xi - MX) * (END - MX));
      else { ray(MX, hy, END, hy + (hy - yi) / (MX - xi) * (END - MX)); ray(MX, hy, xi, yi, true, '#2F6FB0'); }
    }
    if (o.kind === 'virtual' && S.looked) { candle(rig, xi, o.m, true); txt(rig, xi, Math.min(yi, AX - CH) - 14, '虛像', { 'font-size': 15, 'font-weight': 900, fill: '#2F6FB0' }); }
    if (o.kind === 'real' && sharp()) { candle(rig, xi, o.m, false); txt(rig, xi + 46, Math.max(yi, AX) + 4, '實像', { 'font-size': 15, 'font-weight': 900, fill: '#C8372D', 'text-anchor': 'start' }); }
  }
  candle(rig, xo, 1, false);
  el('line', { x1: xo, y1: AX + 8, x2: MX, y2: AX + 8, stroke: '#C8372D', 'stroke-width': 2 }, rig);
  txt(rig, (xo + MX) / 2, AX + 52, `物距 ${u()} cm`, { 'font-size': 15, 'font-weight': 900, fill: '#C8372D' });
  if (L().screen) drawScreen(o);
  if (L().eye) drawEye(o);
}
function drawScreen(o) {
  const xs = xAt(S.scr), ok = sharp();
  const sg = el('g', { class: 'tool drag', tabindex: 0, role: 'slider', 'aria-label': '光屏：左右拖動', 'aria-valuetext': `光屏離透鏡 ${S.scr} cm` }, rig);
  el('rect', { class: 'tool-ring', x: xs - 16, y: AX - 150, width: 32, height: 290, rx: 10, fill: 'transparent', stroke: ok ? 'transparent' : '#E0A21B', 'stroke-width': 4 }, sg);
  el('rect', { x: xs - 6, y: AX - 140, width: 12, height: 270, rx: 4, fill: 'rgba(255,255,255,.92)', stroke: '#5A6478', 'stroke-width': 2.5 }, sg);
  el('rect', { x: xs - 3, y: AX + 130, width: 6, height: 40, fill: '#8896A5' }, sg);
  el('rect', { x: xs - 26, y: AX + 166, width: 52, height: 10, rx: 4, fill: '#5A6478' }, sg);
  if (!ok && !(L().noImage && S.tried >= 3)) sg.classList.add('cue');
  sg.addEventListener('pointerdown', e => startDrag(e));
  sg.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { e.preventDefault(); setScr(S.scr - 1); } if (e.key === 'ArrowRight') { e.preventDefault(); setScr(S.scr + 1); } });
  const bx = Math.min(xs, 900);
  el('rect', { x: bx - 72, y: AX - 250, width: 144, height: 86, rx: 12, fill: '#fff', stroke: '#23304A', 'stroke-width': 2.5 }, rig);
  txt(rig, bx, AX - 232, `光屏 ${S.scr} cm`, { 'font-size': 13, 'font-weight': 900 });
  if (ok) { const g = el('g', { transform: `translate(${bx} ${AX - 212}) scale(0.38 -0.38)` }, rig); el('image', { href: P + 'prop-candle.webp', x: -CW / 2, y: -CH, width: CW, height: CH }, g); txt(rig, bx, AX - 172, '清楚！倒立', { 'font-size': 12, 'font-weight': 900, fill: '#2E7D63' }); }
  else { const off = L().noImage ? 20 : Math.abs(S.scr - o.v), blur = Math.min(28, 6 + off * 2.2); el('ellipse', { cx: bx, cy: AX - 200, rx: blur, ry: blur * 0.8, fill: 'rgba(240,170,60,.45)' }, rig); txt(rig, bx, AX - 172, L().noImage ? '一片光，沒有像' : '模糊', { 'font-size': 12, 'font-weight': 900, fill: '#C8372D' }); }
}
function drawEye(o) {
  const ex = xAt(30), eg = el('g', { class: 'tool', tabindex: 0, role: 'button', 'aria-label': S.looked ? '眼睛：已經看過' : '眼睛：從透鏡右側看' }, rig);
  el('circle', { class: 'tool-ring', cx: ex, cy: AX - 40, r: 44, fill: 'rgba(255,255,255,.75)', stroke: S.looked ? 'transparent' : '#E0A21B', 'stroke-width': 4 }, eg);
  el('ellipse', { cx: ex, cy: AX - 40, rx: 30, ry: 18, fill: '#fff', stroke: '#23304A', 'stroke-width': 3 }, eg);
  el('circle', { cx: ex - 8, cy: AX - 40, r: 10, fill: '#3E6C9A' }, eg);
  el('circle', { cx: ex - 10, cy: AX - 43, r: 3, fill: '#fff' }, eg);
  txt(eg, ex, AX + 22, S.looked ? '看到了' : '用眼睛看', { 'font-size': 15, 'font-weight': 900, fill: S.looked ? '#2E7D63' : '#C8372D' });
  if (!S.looked) eg.classList.add('cue');
  eg.addEventListener('click', look);
  eg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); look(); } });
  txt(rig, xAt(20), AX - 210, '光屏接不到：光線在右側一直散開', { 'font-size': 14, 'font-weight': 900, fill: '#5A6478' });
}
function drawSummary() { drawLens('convex'); candle(rig, 380, 1, false); txt(rig, 600, 520, '證據都在左邊的成像紀錄裡', { 'font-size': 20, 'font-weight': 900 }); }
function draw() {
  const focusLabel = document.activeElement && rig.contains(document.activeElement) ? document.activeElement.getAttribute('aria-label') : null;
  rig.replaceChildren();
  if (isLab()) drawBench(); else drawSummary();
  if (focusLabel) { const f = rig.querySelector('.tool'); if (f) f.focus({ preventScroll: true }); }
}

/* ---------- 操作 ---------- */
let dragging = false;
function startDrag(e) { dragging = true; e.preventDefault(); addEventListener('pointermove', moveDrag); addEventListener('pointerup', () => { dragging = false; removeEventListener('pointermove', moveDrag); }, { once: true }); }
function moveDrag(e) {
  if (!dragging) return;
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  setScr(Math.round((pt.matrixTransform(svg.getScreenCTM().inverse()).x - MX) / PX));
}
function setScr(v) {
  if (!L()?.screen) return;
  const n = Math.max(5, Math.min(40, v));
  if (n === S.scr) return;
  S.scr = n; S.tried++; foundShown = null; lastNote = null; save(); render();
}
function look() { if (!L()?.eye || S.looked) return; S.looked = true; foundShown = null; lastNote = null; save(); render(); }

/* ---------- 讀值 ---------- */
let prev = {};
function setReading(i, label, val, unit, note) {
  $('#l-' + i).textContent = label; $('#u-' + i).textContent = unit; $('#n-' + i).textContent = note;
  const n = $('#r-' + i), v = String(val);
  if (prev[i] !== undefined && prev[i] !== v) { n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick'); }
  prev[i] = v; n.textContent = v;
}
function renderReadouts() {
  const k = lens(), uu = isLab() ? u() : 5, o = optics(k, uu);
  const hide = isLab() && ((L().screen && !L().noImage && !sharp()) || (L().eye && !S.looked));
  setReading(1, '物距', uu, 'cm', `${LENSES[k].name}，焦距 10 cm`);
  setReading(2, '像距', hide ? '？' : o.kind === 'focus' ? '不成像' : (o.v > 0 ? '右 ' : '左 ') + cm(Math.abs(o.v)), hide || o.kind === 'focus' ? '' : 'cm', hide ? (L().eye ? '按右邊的眼睛看看' : '移動光屏找清楚的像') : o.kind === 'real' ? '透鏡另一側' : o.kind === 'virtual' ? '和蠟燭同一側' : '折射光平行');
  setReading(3, '像', hide ? '？' : o.kind === 'focus' ? '不成像' : describe(o).split('、').slice(0, 2).join('、'), '', hide || o.kind === 'focus' ? '' : `${o.kind === 'real' ? '實像' : '虛像'}，${cm(Math.abs(o.m))} 倍`);
}
function drawTable() {
  const rows = S.records.slice(-4);
  $('#table').innerHTML = rows.length ? `<table><thead><tr><th>透鏡</th><th>物距</th><th>像的位置</th><th>像</th></tr></thead><tbody>${rows.map(r => {
    const o = optics(r.lens, r.u);
    return `<tr><td>${LENSES[r.lens].name}</td><td><b>${r.u}</b> cm</td><td>${where(o).replace('透鏡', '')}</td><td class="${o.kind === 'real' ? 'real' : o.kind === 'virtual' ? 'virt' : ''}">${describe(o)}</td></tr>`;
  }).join('')}</tbody></table>${S.records.length > 4 ? '<p>顯示最新 4 筆，全部在研究手冊。</p>' : ''}` : '<p>收下觀察後，結果會排在這裡，方便比較。</p>';
}

/* ---------- 余老師 ---------- */
function oops(t) { teacher.last = ''; teacher.say(t, { pose: 'think', tone: 'oops' }); lastNote = t; }
function readyToSave() {
  if (!isLab() || has(S.step)) return false;
  if (L().noImage) return S.tried >= 3;
  if (L().screen) return sharp();
  return S.looked;
}
function talk() {
  if (lastNote) return;
  if (foundShown) {
    const f = TASK[foundShown].found;
    const action = foundShown === 'quiz' ? { label: '看成果 →', run: openFinish } : { label: '下一步 →', run: () => goStep(NEXT[foundShown]) };
    teacher.say(f[0], { pose: 'cheer', tone: 'found', tag: '發現時刻', eq: f[1], action }); return;
  }
  const step = S.step, done = S.done.includes(step), task = TASK[step];
  if (step === 'quiz') { teacher.say(done ? '全部完成了！可以按「看成果」。' : task.intro, { pose: done ? 'thumb' : 'think' }); return; }
  if (done) { teacher.say('這一步完成了，按任務卡的「下一步」繼續。', { pose: 'thumb' }); return; }
  const o = optics(lens(), u());
  if (L().noImage) { teacher.say(S.tried === 0 ? task.intro : S.tried < 3 ? '還是一片光。再多移幾個位置試試。' : '怎麼移都接不到！看右邊的光線：互相平行。收下這次觀察。', { pose: S.tried >= 3 ? 'wow' : 'point' }); return; }
  if (L().screen) {
    if (sharp()) { teacher.say(`清楚了！光屏在右側 ${cm(o.v)} cm，接到${describe(o).replace('、實像', '')}的像。收下這次觀察。`, { pose: 'wow' }); return; }
    if (S.tried === 0) { teacher.say(task.intro, { pose: 'point' }); return; }
    teacher.say(`還是模糊。光屏再${o.v > S.scr ? '遠離' : '靠近'}透鏡一點。`, { pose: 'point' }); return;
  }
  teacher.say(S.looked ? `看到了！像在${where(o)}，${describe(o)}。收下這次觀察。` : task.intro, { pose: S.looked ? 'wow' : 'point' });
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
  if (isLab()) {
    $('#screen-box').hidden = !L().screen;
    $('#ctl-box').hidden = !L().eye;
    $('#ctl-label').innerHTML = '觀察 <small>光屏接不到，改用眼睛看</small>';
    const box = $('#ctl-btns'); box.className = 'picker-btns one';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn-soft'; b.textContent = S.looked ? '已經看過了' : '從透鏡右側看'; b.disabled = S.looked; b.addEventListener('click', look);
    box.replaceChildren(b);
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
  chips.replaceChildren(...want.map(r => { const o = optics(r.lens, r.u), li = document.createElement('li'); li.className = 'chip'; li.innerHTML = `<small>#${r.n} ${LENSES[r.lens].name}・物距 ${r.u} cm</small><b>${where(o)}</b><span class="res${o.kind === 'real' ? '' : ' ok'}">${describe(o)}</span>`; return li; }));
}
function keep() {
  if (!isLab()) return;
  if (!readyToSave()) {
    oops(has(S.step) ? '這一步已經收下了。' : L().noImage ? '先把光屏前後多移幾個位置，看看接不接得到像。' : L().screen ? '光屏上的像還是模糊的，先找到清楚的位置。' : '先按右邊的眼睛，從透鏡右側看看。'); return;
  }
  if (S.records.length >= 60) { oops('手冊滿 60 張了，清空紀錄才能再收。'); return; }
  const o = optics(lens(), u());
  S.records.push({ n: S.records.length + 1, at: new Date().toISOString(), step: S.step, lens: lens(), u: u(), v: o.v, m: o.m, kind: o.kind });
  lastNote = null;
  if (!S.done.includes(S.step)) { S.done.push(S.step); foundShown = S.step; }
  save();
  const target = isVisible($('#evidence')) ? $('#evidence') : $('#note-count');
  fly($('#save'), target, `${u()} cm → ${where(o)}`).then(() => { renderEvidence(); bump($('#note-count')); });
  render();
}
const isVisible = n => { const r = n.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };

/* ---------- 步驟 ---------- */
function goStep(id) {
  S.step = id; foundShown = null; lastNote = null;
  if (LAB[id]) { S.scr = LAB[id].scr ?? S.scr; S.looked = false; S.tried = 0; }
  if (id === 'quiz' && !S.done.includes('quiz')) S.quiz = { i: 0, pick: null };
  save(); teacher.last = ''; render();
  if (narrow.matches) scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
}
function resetStep() { if (S.step === 'quiz') S.quiz = { i: 0, pick: null }; goStep(S.step); }

/* ---------- 對話框 ---------- */
function openNotes() {
  const body = $('#notes-body'); body.replaceChildren();
  if (!S.records.length) { const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="5" class="notes-empty">還沒有證據。</td>'; body.append(tr); }
  for (const r of S.records) {
    const o = optics(r.lens, r.u), tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.n}</td>` + [LENSES[r.lens].name, `${r.u} cm`, where(o), describe(o)].map(c => `<td>${c}</td>`).join('');
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
    S.done.includes('far') && '<li><b>物距 30 cm</b>：右側 15 cm，倒立、縮小的實像</li>',
    S.done.includes('near') && '<li><b>物距 15 cm</b>：右側 30 cm，倒立、放大 2 倍的實像</li>',
    S.done.includes('focus') && '<li><b>焦點上</b>：折射光平行，不成像</li>',
    S.done.includes('inside') && '<li><b>焦點內 5 cm</b>：正立、放大 2 倍的虛像（放大鏡）</li>',
    S.done.includes('concave') && '<li><b>凹透鏡 5 cm</b>：正立、縮小的虛像</li>'
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
function fitScene() { svg.setAttribute('viewBox', narrow.matches ? '180 90 810 520' : '0 70 1000 540'); }
narrow.addEventListener?.('change', () => render());
function render() {
  renderSteps($('#steps'), STEPS, S.step, new Set(S.done), id => goStep(id));
  fitScene(); draw(); drawTable(); renderReadouts(); renderEvidence(); renderTask(); talk();
}

$('#scr-near').addEventListener('click', () => setScr(S.scr - 1));
$('#scr-far').addEventListener('click', () => setScr(S.scr + 1));
$('#save').addEventListener('click', keep);
$('#task-reset').addEventListener('click', resetStep);
$('#clear-records').addEventListener('click', clearAll);
$('#reset-all').addEventListener('click', clearAll);
$('#why').addEventListener('click', () => $('#why-dialog').showModal());
$('#open-notes').addEventListener('click', openNotes);
document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

render();
