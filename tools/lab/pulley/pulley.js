// 滑輪實驗桌（新版試用）
// 定滑輪、動滑輪的計算沿用正式站 tools/pulley-desk/model.mjs；滑輪組用同一套理想模型（combo-model.mjs）。
import { calculate, geometry, TARGET_CM, WEIGHT_N } from '../../pulley-desk/model.mjs';
import { COMBOS, calculateCombo } from './combo-model.mjs';
import { $, store, Teacher, renderSteps, fly, bump, reduceMotion } from '../shared/lab.js';

const NS = 'http://www.w3.org/2000/svg';
const P = '../../../assets/science/props/';
const SC = 4, SCC = 3;               // 每公分的畫面單位：單一滑輪、滑輪組
const BASE = { fixed: 540, movable: 417 };
const X = 500, R = 34;
const db = store('bhcs.lab.pulley.v2');
const SHORT = { fixed: '定滑輪', movable: '動滑輪', combo2: '一定一動', combo4: '二定二動' };
const calc = (dev, h) => COMBOS[dev] ? calculateCombo(dev, h) : calculate(dev, h);

const STEPS = [
  { id: 'fixed', label: '定滑輪' },
  { id: 'movable', label: '動滑輪' },
  { id: 'combo', label: '滑輪組' },
  { id: 'calc', label: '算一算功' },
  { id: 'quiz', label: '說說看' }
];
const NEXT = { fixed: 'movable', movable: 'combo', combo: 'calc', calc: 'quiz' };
const PULL_STEPS = new Set(['fixed', 'movable', 'combo']);
const TASK = {
  fixed: { title: '定滑輪：把木箱升高 20 cm', goal: '抓住黃色把手往下拉（或按「木箱升 1 cm／5 cm」），木箱到 20 cm 後按「收下這次觀察」。',
    intro: '定滑輪的輪子固定在架子上。往下拉，看看木箱怎麼動！',
    found: ['定滑輪不省力，但能改變施力方向：往下拉，木箱就往上。', '拉力 10 N ＝ 木箱重；繩子拉 20 cm'] },
  movable: { title: '動滑輪：同一個木箱再升高 20 cm', goal: '動滑輪會跟著木箱一起上升。把黃色把手往上拉，注意拉力和繩子拉的長度。',
    intro: '這次輪子跟著木箱走，要往上拉。拉力和繩長會一樣嗎？',
    found: ['動滑輪省一半的力，但不能改變方向，繩子要拉兩倍長。', '2 段繩子拉住：10 N ÷ 2 ＝ 5 N，拉 40 cm'] },
  combo: { title: '滑輪組：定滑輪＋動滑輪一起用', goal: '「一定一動」和「二定二動」各把木箱升高 20 cm、各收一張。數數看，有幾段繩子拉住下面的動滑輪？',
    intro: '滑輪組把兩種滑輪接起來。先試「一定一動」，再試「二定二動」！',
    found: ['滑輪組又省力、又能往下拉：拉住動滑輪的繩子有幾段，拉力就變成幾分之一。', '二定二動：10 N ÷ 4 ＝ 2.5 N，繩子拉 80 cm'] },
  calc: { title: '算一算：每一種各做了多少功？', goal: '功 ＝ 拉力 × 繩子拉的距離。距離先從 cm 換成 m，答案用焦耳（J）。',
    intro: '用證據卡算算看。記得 1 m ＝ 100 cm。',
    found: ['三種都是 2 J！拉力越小，繩子拉越長，功卻一樣。', '10 × 0.20 ＝ 5 × 0.40 ＝ 2.5 × 0.80 ＝ 2 J'] },
  quiz: { title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。',
    intro: '最後三題！想想你收下的證據。',
    found: ['省力不省功！你把三種滑輪的功能都弄清楚了。', '省了力，就要多拉距離'] }
};
const QUIZ = [
  { q: '哪一句話說得對？', options: [
    { text: '動滑輪省力，也省功。', why: '動滑輪確實省力，但繩子要拉兩倍長，算出來的功沒有變少。' },
    { text: '動滑輪省一半的力，但繩子要拉兩倍長，做的功一樣。', ok: true },
    { text: '定滑輪比較省力，因為繩子只要拉 20 cm。', why: '定滑輪拉得短，可是拉力要 10 N，比動滑輪的 5 N 大。' }] },
  { q: '升旗時，旗桿頂端的滑輪讓我們往下拉、旗子往上升。它是哪一種？', options: [
    { text: '動滑輪，因為比較省力。', why: '旗桿頂端的滑輪不會跟著旗子移動，而且它的用處是改變方向，不是省力。' },
    { text: '定滑輪，因為它可以改變施力方向。', ok: true },
    { text: '定滑輪，因為它可以省一半的力。', why: '定滑輪不省力：拉力和重量一樣大，它的功能是改變方向。' }] },
  { q: '二定二動滑輪組有 4 段繩子拉住動滑輪。把 10 N 的木箱升高 20 cm，要用多少力、拉多長？', options: [
    { text: '10 N，拉 20 cm。', why: '那是定滑輪。4 段繩子一起拉住木箱，每段只要分擔 10 ÷ 4。' },
    { text: '5 N，拉 40 cm。', why: '那是只有 2 段繩子的動滑輪。這裡有 4 段。' },
    { text: '2.5 N，但繩子要拉 80 cm。', ok: true }] }
];

/* ---------- 狀態 ---------- */
const DEVICES = ['fixed', 'movable', 'combo2', 'combo4'];
const fresh = () => ({ v: 2, step: 'fixed', combo: 'combo2', h: 0, saved: false, records: [], done: [], calc: { fixed: '', movable: '', combo4: '' }, quiz: { i: 0, pick: null } });
function loadState() {
  const s = db.load();
  try {
    if (!s || s.v !== 2 || !STEPS.some(x => x.id === s.step) || !COMBOS[s.combo] || !Number.isInteger(s.h) || s.h < 0 || s.h > TARGET_CM) throw 0;
    if (!Array.isArray(s.records) || !Array.isArray(s.done) || !s.calc || !s.quiz || !Number.isInteger(s.quiz.i)) throw 0;
    if (!s.records.every(r => DEVICES.includes(r.device) && r.h === TARGET_CM)) throw 0;
    return s;
  } catch { return fresh(); }
}
let S = loadState(), shownH = S.h, foundShown = null, lastNote = null, dragging = null, warnedDown = false;
const save = () => db.save(S);
const device = () => S.step === 'combo' ? S.combo : (S.step === 'fixed' || S.step === 'movable') ? S.step : 'combo4';
const liveH = () => PULL_STEPS.has(S.step) ? shownH : TARGET_CM;
const hasRec = dev => S.records.some(r => r.device === dev);

const svg = $('#scene'), rig = $('#rig');
const teacher = new Teacher($('#teacher-pic'), $('#bubble'), $('#live'));
const el = (tag, a = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (parent) parent.append(n); return n; };
const txt = (parent, x, y, s, a = {}) => { const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#23304A', ...a }, parent); t.textContent = s; return t; };
const yc = (dev, cm) => BASE[dev] - cm * SC;

/* ---------- 滑輪組的幾何 ---------- */
const COMBO_GEO = { combo2: { x0: 452, endY0: 300 }, combo4: { x0: 404, endY0: 205 } };
const CR = 24, TOP_Y = 128, BOT_Y0 = 420;
function comboGeo(dev, h) {
  const n = COMBOS[dev].segments, { x0, endY0 } = COMBO_GEO[dev];
  const xs = Array.from({ length: n + 1 }, (_, j) => x0 + j * 2 * CR);
  const botY = BOT_Y0 - h * SCC, endY = endY0 + n * h * SCC;
  const bottom = Array.from({ length: n / 2 }, (_, k) => x0 + (4 * k + 1) * CR);
  const top = Array.from({ length: n / 2 }, (_, k) => x0 + (4 * k + 3) * CR);
  return { n, xs, botY, endY, bottom, top, crateX: (bottom[0] + bottom.at(-1)) / 2 };
}

/* ---------- 場景 ---------- */
const ropeLine = (x1, y1, x2, y2) => el('line', { x1, y1, x2, y2, stroke: '#7A5A3A', 'stroke-width': 5, 'stroke-linecap': 'round' }, rig);
const ropeArc = (cx, cy, over) => el('path', { d: `M ${cx - CR} ${cy} A ${CR} ${CR} 0 0 ${over ? 1 : 0} ${cx + CR} ${cy}`, fill: 'none', stroke: '#7A5A3A', 'stroke-width': 5 }, rig);
function wheel(cx, cy) {
  el('circle', { cx, cy, r: CR - 2, fill: '#D5DEE5', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('circle', { cx, cy, r: 7, fill: '#8896A5', stroke: '#23304A', 'stroke-width': 2 }, rig);
}
function draw() {
  const dev = device(), h = Math.round(liveH() * 10) / 10, hi = Math.round(h);
  const hadFocus = !!document.activeElement && rig.contains(document.activeElement);
  rig.replaceChildren();
  let crateTop, crateX, endY, handX, up = false;
  const n = COMBOS[dev] ? COMBOS[dev].segments : dev === 'fixed' ? 1 : 2;
  const rope = n * h;
  if (dev === 'fixed' || dev === 'movable') {
    const g = geometry(dev, hi);
    const loadY = yc(dev, dev === 'fixed' ? 20 + h : 10 + h);
    endY = yc(dev, dev === 'fixed' ? 40 - h : 30 + 2 * h);
    handX = X + R; up = dev === 'movable';
    let wheelY;
    if (dev === 'fixed') {
      wheelY = yc('fixed', g.anchorCm);
      el('rect', { x: 330, y: wheelY - 112, width: 340, height: 24, rx: 6, fill: '#C48E4C', stroke: '#23304A', 'stroke-width': 4 }, rig);
      ropeLine(X - R, wheelY, X - R, loadY);
      ropeLine(X + R, wheelY, X + R, endY);
      el('image', { href: P + 'prop-pulley-wheel.webp', x: X - 40, y: wheelY - 83, width: 80, height: 118 }, rig);
      crateX = X - R; crateTop = loadY + 6;
    } else {
      const anchorY = yc('movable', g.anchorCm), ax = X - R;
      el('rect', { x: 300, y: anchorY - 24, width: 196, height: 24, rx: 6, fill: '#C48E4C', stroke: '#23304A', 'stroke-width': 4 }, rig);
      wheelY = loadY;
      ropeLine(ax, anchorY, ax, wheelY);
      ropeLine(X + R, wheelY, X + R, endY);
      el('circle', { cx: ax, cy: anchorY + 2, r: 6, fill: '#23304A' }, rig);
      const pg = el('g', { transform: `translate(${X} ${wheelY}) scale(1 -1)` }, rig);
      el('image', { href: P + 'prop-pulley-wheel.webp', x: -40, y: -83, width: 80, height: 118 }, pg);
      crateX = X; crateTop = wheelY + 89;
    }
    const deg = rope * SC / (2 * Math.PI * 22) * 360 * (dev === 'fixed' ? 1 : -1);
    const mg = el('g', { transform: `translate(${X} ${wheelY}) rotate(${deg.toFixed(1)})` }, rig);
    el('circle', { cx: 0, cy: -19, r: 4.5, fill: '#C8372D' }, mg);
    el('line', { x1: crateX, y1: crateTop - 6, x2: crateX, y2: crateTop + 2, stroke: '#23304A', 'stroke-width': 3 }, rig);
  } else {
    const G = comboGeo(dev, h);
    endY = G.endY; handX = G.xs[G.n];
    const left = G.xs[0] - 30, right = G.xs[G.n] + 30;
    el('rect', { x: left - 20, y: TOP_Y - 76, width: right - left + 40, height: 24, rx: 6, fill: '#C48E4C', stroke: '#23304A', 'stroke-width': 4 }, rig);
    el('line', { x1: (G.xs[0] + G.top.at(-1)) / 2, y1: TOP_Y - 52, x2: (G.xs[0] + G.top.at(-1)) / 2, y2: TOP_Y - 34, stroke: '#23304A', 'stroke-width': 4 }, rig);
    el('rect', { x: G.xs[0] - 10, y: TOP_Y - 36, width: G.top.at(-1) - G.xs[0] + CR + 20, height: 12, rx: 5, fill: '#5E7A8C', stroke: '#23304A', 'stroke-width': 3 }, rig);
    G.top.forEach(x => el('line', { x1: x, y1: TOP_Y - 24, x2: x, y2: TOP_Y, stroke: '#23304A', 'stroke-width': 4 }, rig));
    // 繩子：第 1 段從上方架子出發，依序繞過下、上滑輪，最後一段往下到手
    ropeLine(G.xs[0], TOP_Y - 24, G.xs[0], G.botY);
    for (let j = 1; j < G.n; j++) ropeLine(G.xs[j], TOP_Y, G.xs[j], G.botY);
    ropeLine(G.xs[G.n], TOP_Y, G.xs[G.n], endY);
    G.bottom.forEach(x => ropeArc(x, G.botY, false));
    G.top.forEach(x => ropeArc(x, TOP_Y, true));
    G.top.forEach(x => wheel(x, TOP_Y));
    G.bottom.forEach(x => wheel(x, G.botY));
    el('rect', { x: G.bottom[0] - 12, y: G.botY + CR + 2, width: G.bottom.at(-1) - G.bottom[0] + 24, height: 12, rx: 5, fill: '#5E7A8C', stroke: '#23304A', 'stroke-width': 3 }, rig);
    G.bottom.forEach(x => el('line', { x1: x, y1: G.botY, x2: x, y2: G.botY + CR + 2, stroke: '#23304A', 'stroke-width': 4 }, rig));
    crateX = G.crateX; crateTop = G.botY + CR + 24;
    el('line', { x1: crateX, y1: G.botY + CR + 14, x2: crateX, y2: crateTop + 2, stroke: '#23304A', 'stroke-width': 3 }, rig);
    // 標出拉住動滑輪的繩子段數
    const midY = (TOP_Y + G.botY) / 2;
    for (let j = 0; j < G.n; j++) {
      el('circle', { cx: G.xs[j], cy: midY, r: 13, fill: '#F4C04E', stroke: '#23304A', 'stroke-width': 2 }, rig);
      txt(rig, G.xs[j], midY + 5, String(j + 1), { 'font-size': 14, 'font-weight': 900 });
    }
    txt(rig, G.xs[0] - 62, midY - 4, '拉住動滑輪', { 'font-size': 14, fill: '#5A6478' });
    txt(rig, G.xs[0] - 62, midY + 15, `共 ${G.n} 段`, { 'font-size': 16, 'font-weight': 900, fill: '#C8372D' });
  }
  // 木箱
  el('image', { href: P + 'prop-wooden-crate.webp', x: crateX - 45, y: crateTop, width: 90, height: 89 }, rig);
  el('rect', { x: crateX - 30, y: crateTop + 30, width: 60, height: 28, rx: 14, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 2 }, rig);
  txt(rig, crateX, crateTop + 50, `${WEIGHT_N} N`, { 'font-size': 16, 'font-weight': 900 });
  // 刻度尺
  const s = COMBOS[dev] ? SCC : SC, top0 = crateTop + h * s, rx = crateX - 92;
  el('rect', { x: rx - 6, y: top0 - TARGET_CM * s - 10, width: 12, height: TARGET_CM * s + 20, rx: 4, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 2 }, rig);
  for (let c = 0; c <= TARGET_CM; c += 5) {
    const y = top0 - c * s;
    el('line', { x1: rx - 6, y1: y, x2: rx + (c % 10 ? 2 : 6), y2: y, stroke: '#23304A', 'stroke-width': 2 }, rig);
    txt(rig, rx - 22, y + 5, String(c), { 'font-size': 13, fill: '#5A6478' });
  }
  txt(rig, rx, top0 + 30, 'cm', { 'font-size': 13, fill: '#5A6478' });
  const doneLift = hi >= TARGET_CM;
  el('line', { class: doneLift ? '' : 'target-line', x1: rx + 8, y1: top0 - TARGET_CM * s, x2: crateX + 52, y2: top0 - TARGET_CM * s, stroke: doneLift ? '#2E7D63' : '#E0A21B', 'stroke-width': 4, 'stroke-dasharray': '10 7' }, rig);
  el('path', { d: `M ${rx + 8} ${crateTop} l 12 -7 v 14 z`, fill: '#C8372D' }, rig);
  // 彈簧秤與把手
  const c = calc(dev, hi);
  const sg = el('g', { transform: `translate(${handX} ${endY + (up ? -48 : 48)}) rotate(${up ? 90 : -90})` }, rig);
  el('image', { href: P + 'prop-spring-scale.webp', x: -48, y: -7.6, width: 96, height: 15.2 }, sg);
  const fy = endY + (up ? -60 : 36);
  el('rect', { x: handX + 18, y: fy, width: 76, height: 30, rx: 15, fill: '#2F6FB0' }, rig);
  txt(rig, handX + 56, fy + 21, `${c.forceN} N`, { fill: '#FFFFFF', 'font-size': 17, 'font-weight': 900 });
  const hy = endY + (up ? -100 : 100);
  const hg = el('g', { class: 'handle', tabindex: 0, role: 'slider', 'aria-label': `拉繩把手，${up ? '往上' : '往下'}拉`, 'aria-valuemin': 0, 'aria-valuemax': TARGET_CM, 'aria-valuenow': hi, 'aria-valuetext': `木箱升高 ${hi} 公分` }, rig);
  el('circle', { class: 'handle-ring', cx: handX, cy: hy, r: 30, fill: 'none', stroke: '#E0A21B', 'stroke-width': 4 }, hg);
  el('circle', { cx: handX, cy: hy, r: 20, fill: '#F4C04E', stroke: '#23304A', 'stroke-width': 3 }, hg);
  txt(hg, handX, hy + 6, up ? '↑' : '↓', { 'font-size': 20, 'font-weight': 900 });
  el('circle', { cx: handX, cy: hy, r: 46, fill: 'transparent' }, hg);
  if (PULL_STEPS.has(S.step) && !doneLift && !S.saved) {
    hg.classList.add('cue');
    txt(rig, handX + 86, hy + 6, up ? '往上拉' : '往下拉', { 'font-size': 18, 'font-weight': 900, fill: '#C8372D' });
  }
  bindHandle(hg, dev);
  if (hadFocus) hg.focus({ preventScroll: true });
}

/* ---------- 拉繩 ---------- */
function toSvg(e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
function hFromPointer(dev, py) {
  if (COMBOS[dev]) { const n = COMBOS[dev].segments; return (py - 100 - COMBO_GEO[dev].endY0) / (n * SCC); }
  const endY = py + (dev === 'movable' ? 100 : -100);
  const endCm = (BASE[dev] - endY) / SC;
  return dev === 'fixed' ? 40 - endCm : (endCm - 30) / 2;
}
function canPull() { return PULL_STEPS.has(S.step) && !S.saved; }
function bindHandle(node, dev) {
  node.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    if (!canPull()) { pullBlocked(); return; }
    e.preventDefault();
    dragging = { dev, id: e.pointerId };
    document.body.classList.add('dragging');
  });
  node.addEventListener('keydown', e => {
    const key = dev === 'movable' ? 'ArrowUp' : 'ArrowDown';
    if (e.key === key || e.key === 'ArrowRight') { e.preventDefault(); pull(e.shiftKey ? 5 : 1); }
  });
}
// 拖曳在整個視窗追蹤：畫面重畫換掉把手元素也不會中斷
addEventListener('pointermove', e => {
  if (!dragging || dragging.id !== e.pointerId) return;
  e.preventDefault();
  let h = hFromPointer(dragging.dev, toSvg(e).y);
  if (h < S.h - 0.5 && !warnedDown) { warnedDown = true; oops('這個實驗只往上升；想重來，按任務卡的「重來這一步」。'); }
  h = Math.max(S.h, Math.min(TARGET_CM, h));
  shownH = h; draw(); renderReadouts();
}, { passive: false });
const endDrag = e => {
  if (!dragging || dragging.id !== e.pointerId) return;
  dragging = null; document.body.classList.remove('dragging');
  setH(Math.round(shownH), false);
};
addEventListener('pointerup', endDrag);
addEventListener('pointercancel', endDrag);

function pullBlocked() {
  if (!PULL_STEPS.has(S.step)) oops('這一步不用拉繩子，看任務卡要做的事。');
  else if (S.saved) oops(S.step === 'combo' ? '這一輪已經收下了。換另一種滑輪組，或按「重來這一步」。' : '這一輪已經收下了。想再拉一次，按「重來這一步」。');
}
function pull(cm) { if (!canPull()) { pullBlocked(); return; } setH(Math.min(TARGET_CM, S.h + cm), true); }
let tween = 0;
function setH(h, animate) {
  if (h === S.h && !animate) { shownH = h; render(); return; }
  const from = shownH; S.h = h; lastNote = null; warnedDown = false; save();
  cancelAnimationFrame(tween);
  if (!animate || reduceMotion()) { shownH = h; render(); return; }
  const t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / 320), e = 1 - Math.pow(1 - k, 3);
    shownH = from + (h - from) * e; draw(); renderReadouts();
    if (k < 1) tween = requestAnimationFrame(step); else { shownH = h; render(); }
  };
  tween = requestAnimationFrame(step);
}

/* ---------- 讀值 ---------- */
let prev = {};
function tick(id, v) { const n = $(id); if (prev[id] !== undefined && prev[id] !== v) { n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick'); } prev[id] = v; n.textContent = v; }
function renderReadouts() {
  const dev = device(), h = Math.round(liveH()), c = calc(dev, h), n = c.supportSegments;
  tick('#r-force', c.forceN); tick('#r-height', h); tick('#r-rope', c.ropeCm);
  $('#r-force-note').textContent = dev === 'fixed' ? '定滑輪：拉力＝木箱重' : `${n} 段繩子拉住：10 ÷ ${n}`;
  $('#r-rope-note').textContent = n === 1 ? '和木箱升高一樣' : `是木箱升高的 ${n} 倍`;
}

/* ---------- 余老師 ---------- */
function oops(t) { teacher.last = ''; teacher.say(t, { pose: 'think', tone: 'oops' }); lastNote = t; }
function talk() {
  if (lastNote) return;
  if (foundShown) {
    const f = TASK[foundShown].found;
    const action = foundShown === 'quiz' ? { label: '看成果 →', run: openFinish } : { label: '下一步 →', run: () => goStep(NEXT[foundShown]) };
    teacher.say(f[0], { pose: 'cheer', tone: 'found', tag: '發現時刻', eq: f[1], action }); return;
  }
  const step = S.step, done = S.done.includes(step), task = TASK[step];
  if (PULL_STEPS.has(step)) {
    const dev = device(), h = S.h, n = calc(dev, 0).supportSegments, s = n * h;
    if (S.saved) {
      if (step === 'combo' && !done) {
        const other = S.combo === 'combo2' ? 'combo4' : 'combo2';
        teacher.say(`收下了！再換「${SHORT[other]}」試試看，拉力會變多少？`, { pose: 'thumb', action: { label: `換${SHORT[other]} →`, run: () => pickCombo(other) } });
      } else teacher.say(done ? '這一步完成了，按任務卡的「下一步」繼續。' : '已經收下了！', { pose: 'thumb' });
      return;
    }
    const F = calc(dev, TARGET_CM).forceN;
    if (h >= TARGET_CM) {
      const msg = dev === 'fixed' ? '到 20 cm 了！拉力 10 N，往下拉、木箱往上。收下這次觀察。'
        : dev === 'movable' ? '到了！拉力只要 5 N，繩子卻拉了 40 cm。收下這次觀察。'
        : `到了！${n} 段繩子一起拉，拉力只要 ${F} N，但繩子拉了 ${n * TARGET_CM} cm。收下這次觀察。`;
      teacher.say(msg, { pose: dev === 'fixed' ? 'cheer' : 'wow' });
    } else if (h === 0) {
      teacher.say(step === 'combo' ? (S.combo === 'combo2' ? '「一定一動」：上面一個定滑輪、下面一個動滑輪。數數看黃色圈有幾段？' : '「二定二動」：上下各兩個滑輪，拉住動滑輪的繩子有 4 段！往下拉試試。') : task.intro, { pose: 'point' });
    } else {
      teacher.say(n === 1 ? `木箱升高 ${h} cm，繩子也拉了 ${s} cm。繼續拉！` : `木箱升高 ${h} cm，繩子卻拉了 ${s} cm！繼續拉。`, { pose: n === 1 ? 'point' : 'wow' });
    }
    return;
  }
  if (step === 'calc') {
    const miss = ['fixed', 'movable', 'combo4'].filter(d => !hasRec(d));
    if (miss.length) { teacher.say(`還少「${miss.map(d => SHORT[d]).join('」「')}」的證據，先回去收下來。`, { pose: 'think' }); return; }
    teacher.say(done ? '算對了！按任務卡的「下一步」繼續。' : task.intro, { pose: done ? 'thumb' : 'notebook' }); return;
  }
  teacher.say(done ? '全部完成了！可以按「看成果」。' : task.intro, { pose: done ? 'thumb' : 'think' });
}

/* ---------- 任務卡 ---------- */
function renderTask() {
  const i = STEPS.findIndex(x => x.id === S.step), task = TASK[S.step], done = S.done.includes(S.step);
  $('#task-kicker').textContent = `任務 ${i + 1} / ${STEPS.length}${done ? '　✓ 已完成' : ''}`;
  $('#task-title').textContent = task.title;
  $('#task-goal').textContent = task.goal;
  const go = $('#task-go');
  if (done && S.step === 'quiz') { go.hidden = false; go.textContent = '看成果 →'; go.onclick = openFinish; }
  else if (done) { go.hidden = false; go.textContent = '下一步 →'; go.onclick = () => goStep(NEXT[S.step]); }
  else go.hidden = true;
  const pullStep = PULL_STEPS.has(S.step);
  $('#dock-pull').hidden = !pullStep; $('#dock-calc').hidden = S.step !== 'calc'; $('#dock-quiz').hidden = S.step !== 'quiz';
  $('#combo-pick').hidden = S.step !== 'combo';
  for (const id of ['combo2', 'combo4']) {
    const b = $('#pick-' + id);
    b.setAttribute('aria-pressed', String(S.combo === id));
    b.textContent = `${SHORT[id]}（${COMBOS[id].segments} 段）${hasRec(id) ? ' ✓' : ''}`;
  }
  $('#pull-1').disabled = $('#pull-5').disabled = !canPull() || S.h >= TARGET_CM;
  $('#save').classList.toggle('cue', pullStep && S.h >= TARGET_CM && !S.saved);
  if (S.step === 'calc') renderCalc();
  if (S.step === 'quiz') renderQuiz();
}
function pickCombo(id) {
  S.step = 'combo'; S.combo = id; S.h = 0; S.saved = false; shownH = 0; foundShown = null; lastNote = null; warnedDown = false;
  save(); teacher.last = ''; render();
}

/* ---------- 算一算 ---------- */
const CALC_DEV = ['fixed', 'movable', 'combo4'];
const rec = dev => S.records.find(r => r.device === dev);
function renderCalc() {
  for (const d of CALC_DEV) {
    const r = rec(d), inp = $('#calc-' + d);
    $('#eq-' + d).textContent = r ? `拉力 ${r.force} N × 拉了 ${r.rope} cm` : '（還沒有證據）';
    inp.disabled = !r;
    if (document.activeElement !== inp) inp.value = S.calc[d] || '';
  }
  $('#check').disabled = !CALC_DEV.every(rec);
}
function parse(v) { const t = String(v).trim().replace(/[ＪjJ\s]/g, '').replace('，', '.').replace('．', '.'); return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN; }
function check() {
  const res = {};
  for (const d of CALC_DEV) {
    const inp = $('#calc-' + d); S.calc[d] = inp.value; const v = parse(inp.value);
    res[d] = Math.abs(v - 2) < 1e-9;
    inp.classList.toggle('ok', res[d]); inp.classList.toggle('bad', !res[d] && inp.value.trim() !== '');
  }
  save();
  if (CALC_DEV.every(d => res[d])) {
    if (!S.done.includes('calc')) S.done.push('calc');
    foundShown = 'calc'; lastNote = null; save(); render(); return;
  }
  const wrong = CALC_DEV.find(d => !res[d]), v = parse($('#calc-' + wrong).value), r = rec(wrong), m = (r.rope / 100).toFixed(2);
  let msg;
  if (Number.isNaN(v)) msg = `先在「${SHORT[wrong]}」那一格填數字。`;
  else if (Math.abs(v - r.force * r.rope) < 1e-9) msg = `${SHORT[wrong]}：${v} 是 N·cm。把 ${r.rope} cm 換成 ${m} m 再乘。`;
  else if (Math.abs(v - r.force * r.rope / 10) < 1e-9 || Math.abs(v - r.rope / 100) < 1e-9) msg = `${SHORT[wrong]}：再檢查一次，${r.force} N × ${m} m ＝ ？`;
  else msg = `${SHORT[wrong]}：拉力 ${r.force} N 乘上繩子拉的距離 ${m} m。`;
  oops(msg);
}

/* ---------- 說說看 ---------- */
function renderQuiz() {
  const qi = Math.min(S.quiz.i, QUIZ.length - 1), item = QUIZ[qi];
  $('#quiz-q').textContent = `第 ${qi + 1} / ${QUIZ.length} 題　${item.q}`;
  const box = $('#quiz');
  box.replaceChildren(...item.options.map((o, k) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = o.text;
    if (S.quiz.pick === k) b.classList.add(o.ok ? 'ok' : 'bad');
    b.addEventListener('click', () => {
      S.quiz.pick = k; lastNote = null;
      if (!o.ok) { save(); render(); oops(o.why); return; }
      if (qi < QUIZ.length - 1) {
        save(); render();
        teacher.last = '';
        teacher.say('答對了！', { pose: 'thumb', action: { label: '下一題 →', run: () => { S.quiz = { i: qi + 1, pick: null }; lastNote = null; save(); teacher.last = ''; render(); } } });
        lastNote = 'quiz-ok';
      } else {
        if (!S.done.includes('quiz')) S.done.push('quiz');
        foundShown = 'quiz'; save(); render();
      }
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
  chips.replaceChildren(...want.map(r => {
    const li = document.createElement('li'); li.className = 'chip';
    li.innerHTML = `<small>#${r.n} ${SHORT[r.device]}</small><b>${r.force} N ｜ 拉 ${r.rope} cm</b><span class="res ok">木箱升 ${r.h} cm</span>`;
    return li;
  }));
}
function keep() {
  if (!PULL_STEPS.has(S.step)) return;
  const dev = device();
  if (S.saved) { pullBlocked(); return; }
  if (S.h < TARGET_CM) { oops(`先把木箱升到 20 cm 再收下（現在 ${S.h} cm）。`); return; }
  if (S.records.length >= 50) { oops('手冊滿 50 張了，清空紀錄才能再收。'); return; }
  const c = calc(dev, S.h);
  S.records.push({ n: S.records.length + 1, device: dev, force: c.forceN, h: S.h, rope: c.ropeCm, at: new Date().toISOString() });
  S.saved = true; lastNote = null;
  const stepDone = S.step === 'combo' ? (hasRec('combo2') && hasRec('combo4')) : true;
  if (stepDone && !S.done.includes(S.step)) { S.done.push(S.step); foundShown = S.step; }
  save();
  const target = isVisible($('#evidence')) ? $('#evidence') : $('#note-count');
  fly($('#save'), target, `${SHORT[dev]} ${c.forceN} N`).then(() => { renderEvidence(); bump($('#note-count')); });
  render();
}
function isVisible(n) { const r = n.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }

/* ---------- 步驟 ---------- */
function goStep(id) {
  S.step = id; foundShown = null; lastNote = null; warnedDown = false;
  if (PULL_STEPS.has(id)) { S.h = 0; S.saved = false; }
  if (id === 'combo') S.combo = hasRec('combo2') && !hasRec('combo4') ? 'combo4' : 'combo2';
  if (id === 'calc') CALC_DEV.forEach(d => { $('#calc-' + d).value = S.calc[d] || ''; $('#calc-' + d).classList.remove('ok', 'bad'); });
  if (id === 'quiz' && !S.done.includes('quiz')) S.quiz = { i: 0, pick: null };
  shownH = S.h; save(); teacher.last = ''; render();
  if (narrow.matches) scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
}
function resetStep() {
  if (S.step === 'combo') { pickCombo(S.combo); return; }
  if (S.step === 'calc') { S.calc = { fixed: '', movable: '', combo4: '' }; CALC_DEV.forEach(d => { $('#calc-' + d).value = ''; $('#calc-' + d).classList.remove('ok', 'bad'); }); }
  if (S.step === 'quiz') S.quiz = { i: 0, pick: null };
  goStep(S.step);
}

/* ---------- 對話框 ---------- */
function openNotes() {
  const body = $('#notes-body'); body.replaceChildren();
  if (!S.records.length) { const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="5" class="notes-empty">還沒有證據。</td>'; body.append(tr); }
  for (const r of S.records) { const tr = document.createElement('tr'); tr.innerHTML = `<td>${r.n}</td><td>${SHORT[r.device]}</td><td><b>${r.force} N</b></td><td>${r.h} cm</td><td>${r.rope} cm</td>`; body.append(tr); }
  $('#notes-dialog').showModal();
}
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#F4C04E" stroke="#23304A" stroke-width="1.2" stroke-linejoin="round"/></svg>';
function openFinish() {
  const got = STEPS.filter(s => S.done.includes(s.id)).length;
  $('#stars').innerHTML = STEPS.map(s => S.done.includes(s.id) ? STAR : STAR.replace('<svg', '<svg class="off"')).join('');
  $('#stars').setAttribute('aria-label', `完成 ${STEPS.length} 個任務中的 ${got} 個`);
  $('#finish-list').innerHTML = DEVICES.map(d => { const r = rec(d); return r && `<li><b>${SHORT[d]}</b>：拉力 ${r.force} N，繩子拉 ${r.rope} cm → 功 2 J</li>`; }).filter(Boolean).join('') + '<li><b>木箱得到的功</b>：10 N × 0.20 m ＝ 2 J</li>';
  $('#finish-dialog').showModal();
}
function clearAll() {
  if (!confirm('要清空這一站的所有證據和進度，從第 1 步重新開始嗎？')) return;
  db.clear(); S = fresh(); shownH = 0; foundShown = null; lastNote = null; teacher.last = '';
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  CALC_DEV.forEach(d => { $('#calc-' + d).value = ''; $('#calc-' + d).classList.remove('ok', 'bad'); });
  render(); if (narrow.matches) scrollTo({ top: 0 });
}

/* ---------- 版面 ---------- */
const narrow = matchMedia('(max-width: 860px)');
function fitScene() {
  const d = device();
  const vb = narrow.matches
    ? { fixed: '320 130 360 460', movable: '320 10 360 570', combo2: '330 40 380 550', combo4: '290 40 470 550' }[d]
    : { fixed: '100 120 800 470', movable: '100 10 800 570', combo2: '100 40 800 550', combo4: '100 40 800 550' }[d];
  svg.setAttribute('viewBox', vb);
}
narrow.addEventListener?.('change', () => render());
function render() {
  renderSteps($('#steps'), STEPS, S.step, new Set(S.done), id => goStep(id));
  fitScene(); draw(); renderReadouts(); renderEvidence(); renderTask(); talk();
}

$('#pull-1').addEventListener('click', () => pull(1));
$('#pull-5').addEventListener('click', () => pull(5));
$('#pick-combo2').addEventListener('click', () => pickCombo('combo2'));
$('#pick-combo4').addEventListener('click', () => pickCombo('combo4'));
$('#save').addEventListener('click', keep);
$('#check').addEventListener('click', check);
CALC_DEV.forEach(d => $('#calc-' + d).addEventListener('keydown', e => { if (e.key === 'Enter') check(); }));
$('#task-reset').addEventListener('click', resetStep);
$('#clear-records').addEventListener('click', clearAll);
$('#reset-all').addEventListener('click', clearAll);
$('#why').addEventListener('click', () => $('#why-dialog').showModal());
$('#open-notes').addEventListener('click', openNotes);
document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

render();
