// 浮力實驗桌（新版試用）
// 彈簧秤讀數與排開液體沿用 tools/buoyancy-lab/model.mjs；密封盒浮沉用 ./float-model.mjs（液體密度同一來源）。
import { reading, FLUIDS } from '../../buoyancy-lab/model.mjs';
import { blockOutcome, blockMassG, BLOCK, LIQUIDS } from './float-model.mjs';
import { $, store, Teacher, renderSteps, fly, bump, reduceMotion } from '../shared/lab.js';

const NS = 'http://www.w3.org/2000/svg';
const P = '../../../assets/science/props/';
const db = store('bhcs.lab.buoyancy.v1');
const FNAME = { water: '清水', brine: '濃鹽水' };
const W_AIR = reading({ hung: true, density: FLUIDS.water.density, f: 0, cupLocation: 'shelf', cupVolume: 0 }).forceN;
const r3 = x => Math.round(x * 1000) / 1000;
/** 鋁塊浸入 step/10：彈簧秤讀數 N、排開體積 cm³、天平上（已去皮）的液體質量 g */
function measure(fluid, step) {
  const r = reading({ hung: true, density: FLUIDS[fluid].density, f: step / 10, cupLocation: 'scale', tareId: 't', cupId: 't', cupVolume: 5 * step });
  return { force: r3(r.forceN), vol: r.volumeCm3, mass: r3(r.massG) };
}

const STEPS = [
  { id: 'air', label: '空氣中秤重' },
  { id: 'water', label: '放進清水' },
  { id: 'arch', label: '浮力有多大' },
  { id: 'brine', label: '換濃鹽水' },
  { id: 'float', label: '浮還是沉' },
  { id: 'quiz', label: '說說看' }
];
const NEXT = { air: 'water', water: 'arch', arch: 'brine', brine: 'float', float: 'quiz' };
const LOWER = new Set(['water', 'brine']);
const TASK = {
  air: { title: '先秤鋁塊在空氣中有多重', goal: '鋁塊體積 50 cm³，掛在彈簧秤下面。讀出彈簧秤的數字，按「收下這次觀察」。',
    intro: '這是 50 cm³ 的鋁塊。先看彈簧秤：它在空氣中有多重？',
    found: ['鋁塊在空氣中重 1.35 N。', '這是等一下比較的基準'] },
  water: { title: '把鋁塊慢慢放進清水', goal: '往下拖曳黃色把手（或按「往下放」），一格一格放進溢流杯，直到完全浸沒。溢出的水會流進天平上的杯子。',
    intro: '把鋁塊慢慢放進清水，看彈簧秤怎麼變！',
    found: ['浸得越多，讀數越小：水把鋁塊往上推。', '空氣中 1.35 N → 完全浸沒 0.85 N'] },
  arch: { title: '算一算：浮力和排開的水，哪個大？', goal: '浮力 ＝ 空氣中重 − 水中讀數。排開的水重：看天平上的水有幾 g。1 公斤重 ＝ 10 N，所以 100 g 重 1 N。',
    intro: '天平上的水，就是鋁塊排開的水。浮力和它的重量會一樣嗎？',
    found: ['浮力 ＝ 排開的水重！這就是阿基米德原理。', '1.35 − 0.85 ＝ 0.5 N；50 g 的水重 0.5 N'] },
  brine: { title: '換成濃鹽水再做一次', goal: '同一個鋁塊放進濃鹽水（密度 1.2 g/cm³），完全浸沒後收下觀察，和清水比一比。',
    intro: '濃鹽水比清水「重」。浮力會變大還是變小？',
    found: ['液體密度越大，浮力越大。', '1.35 − 0.75 ＝ 0.6 N；排開的鹽水 60 g，重 0.6 N'] },
  float: { title: '浮還是沉？用密封盒找規律', goal: '盒子體積 100 cm³，加減砝碼改變質量，放進液體觀察。要找到：清水中會浮的、會沉的，以及「清水會沉、濃鹽水卻會浮」的情形。',
    intro: '密封盒體積 100 cm³。加減砝碼，放進液體看看浮還是沉！',
    found: ['物體密度比液體小就會浮，比液體大就會沉，一樣時懸浮。', '浮著時：浸入比例 ＝ 物體密度 ÷ 液體密度'] },
  quiz: { title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。',
    intro: '最後三題！想想你收下的證據。',
    found: ['你找到浮力的規律了！', '浮力 ＝ 排開液體的重量'] }
};
const QUIZ = [
  { q: '鋁塊完全浸在水中，彈簧秤從 1.35 N 變成 0.85 N。鋁塊受到的浮力是多少？', options: [
    { text: '0.85 N', why: '0.85 N 是水中的讀數。浮力是讀數「少掉」的部分。' },
    { text: '0.5 N', ok: true },
    { text: '2.2 N', why: '浮力是兩個讀數相減，不是相加。' }] },
  { q: '同一個鋁塊完全浸在濃鹽水裡，浮力和在清水裡比起來會怎樣？', options: [
    { text: '變大，因為濃鹽水密度比較大，排開的液體比較重。', ok: true },
    { text: '一樣，因為鋁塊的體積沒有變。', why: '排開的體積一樣，但濃鹽水比較重：60 g 比 50 g，浮力 0.6 N 比 0.5 N。' },
    { text: '變小，因為濃鹽水比較黏。', why: '你的證據：濃鹽水中讀數 0.75 N，比清水的 0.85 N 還小，代表浮力變大。' }] },
  { q: '一個盒子在清水中會沉，放進濃鹽水會怎樣？', options: [
    { text: '一定還是會沉。', why: '不一定。盒子密度如果比濃鹽水小，就會浮起來。你的證據：3 個砝碼的盒子在清水懸浮、在濃鹽水浮起。' },
    { text: '一定會浮起來。', why: '也不一定。盒子密度如果比濃鹽水還大（例如 5、6 個砝碼），還是會沉。' },
    { text: '要看盒子密度有沒有比濃鹽水小，小的話就會浮起來。', ok: true }] }
];
const CALC = [
  { id: 'buoy', name: '浮力', eq: '空氣中 1.35 N − 水中 0.85 N', answer: 0.5, unit: 'N' },
  { id: 'disp', name: '排開的水重', eq: '天平上的水 50 g（1 公斤重＝10 N）', answer: 0.5, unit: 'N' }
];

/* ---------- 狀態 ---------- */
const fresh = () => ({ v: 1, step: 'air', p: 0, saved: false, slots: 0, ffluid: 'water', dropped: false, records: [], done: [], calc: {}, quiz: { i: 0, pick: null } });
function loadState() {
  const s = db.load();
  try {
    if (!s || s.v !== 1 || !STEPS.some(x => x.id === s.step) || !Number.isInteger(s.p) || s.p < 0 || s.p > 10) throw 0;
    if (!Number.isInteger(s.slots) || s.slots < BLOCK.slotsMin || s.slots > BLOCK.slotsMax || !FNAME[s.ffluid]) throw 0;
    if (!Array.isArray(s.records) || !Array.isArray(s.done) || !s.calc || !s.quiz) throw 0;
    return s;
  } catch { return fresh(); }
}
let S = loadState(), shownP = S.p, foundShown = null, lastNote = null, dragging = null, warned = false, dripping = false, dropAnim = null;
const save = () => db.save(S);
const fluidNow = () => S.step === 'brine' ? 'brine' : S.step === 'float' ? S.ffluid : 'water';
const liveP = () => S.step === 'air' ? 0 : LOWER.has(S.step) ? shownP : 10;
const hasRec = d => S.records.some(r => r.device === d);
const floatRecs = () => S.records.filter(r => r.device === 'float');

const svg = $('#scene'), rig = $('#rig');
const teacher = new Teacher($('#teacher-pic'), $('#bubble'), $('#live'));
const el = (tag, a = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (parent) parent.append(n); return n; };
const txt = (parent, x, y, s, a = {}) => { const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#23304A', ...a }, parent); t.textContent = s; return t; };
const LIQ = { water: 'rgba(110,175,235,0.55)', brine: 'rgba(120,200,190,0.6)' };

/* ---------- 場景：彈簧秤與溢流杯 ---------- */
const SURF = 330, BH = 72, BW = 72, CX = 560, HOOK0 = SURF - BH - 26, PER = (BH + 6) / 10;
const hookAt = p => HOOK0 + p * PER;
function drawBench() {
  const fluid = fluidNow(), p = liveP(), step = Math.round(p), m = measure(fluid, step);
  const hookY = hookAt(p), blockTop = hookY + 26;
  const hadFocus = !!document.activeElement && rig.contains(document.activeElement);
  rig.replaceChildren();
  // 支架
  el('rect', { x: 250, y: 546, width: 170, height: 14, rx: 4, fill: '#5E7A8C', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: 296, y: 60, width: 12, height: 488, fill: '#8896A5', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: 296, y: 56, width: 276, height: 14, rx: 4, fill: '#8896A5', stroke: '#23304A', 'stroke-width': 3 }, rig);
  // 溢流杯（後壁）與鋁塊
  el('rect', { x: 470, y: 300, width: 180, height: 240, fill: 'rgba(225,242,255,0.35)', stroke: 'none' }, rig);
  el('line', { x1: CX, y1: 74, x2: CX, y2: hookY - 112, stroke: '#7A5A3A', 'stroke-width': 3 }, rig);
  const sg = el('g', { transform: `translate(${CX} ${hookY - 56}) rotate(90)` }, rig);
  el('image', { href: P + 'prop-spring-scale.webp', x: -56, y: -8.7, width: 112, height: 17.4 }, sg);
  el('line', { x1: CX, y1: hookY, x2: CX, y2: blockTop, stroke: '#23304A', 'stroke-width': 2.5 }, rig);
  el('image', { href: P + 'prop-metal-block.webp', x: CX - BW / 2, y: blockTop, width: BW, height: BH, preserveAspectRatio: 'none' }, rig);
  txt(rig, CX, blockTop + BH / 2 + 6, '鋁', { 'font-size': 17, 'font-weight': 900 });
  // 液體（畫在鋁塊前面，半透明）
  el('rect', { x: 472, y: SURF, width: 176, height: 208, fill: LIQ[fluid] }, rig);
  el('line', { x1: 472, y1: SURF, x2: 648, y2: SURF, stroke: 'rgba(255,255,255,.8)', 'stroke-width': 3 }, rig);
  // 溢流杯外框與溢流口
  el('path', { d: 'M 470 290 L 470 540 L 650 540 L 650 290', fill: 'none', stroke: '#23304A', 'stroke-width': 4, 'stroke-linejoin': 'round' }, rig);
  el('path', { d: `M 650 ${SURF - 6} L 706 ${SURF + 14} L 706 ${SURF + 26}`, fill: 'none', stroke: '#23304A', 'stroke-width': 4 }, rig);
  el('path', { d: `M 650 ${SURF + 4} L 700 ${SURF + 22}`, fill: 'none', stroke: LIQ[fluid].replace(/0\.\d+\)/, '0.9)'), 'stroke-width': 5 }, rig);
  txt(rig, 560, 572, '溢流杯（裝滿到溢流口）', { 'font-size': 13, fill: '#5A6478' });
  if (dripping) for (let k = 0; k < 2; k++) el('circle', { class: 'drip', cx: 706, cy: SURF + 34 + k * 12, r: 4, fill: LIQ[fluid].replace(/0\.\d+\)/, '0.95)'), style: `animation-delay:${k * 0.3}s` }, rig);
  // 收集杯與天平
  el('rect', { x: 672, y: 518, width: 132, height: 30, rx: 6, fill: '#E9EEF2', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: 700, y: 548, width: 76, height: 12, fill: '#5E7A8C', stroke: '#23304A', 'stroke-width': 2 }, rig);
  el('rect', { x: 694, y: 524, width: 88, height: 20, rx: 4, fill: '#23304A' }, rig);
  txt(rig, 738, 539, `${m.mass} g`, { fill: '#9FE0C6', 'font-size': 15, 'font-weight': 900 });
  const cupTop = 438, cupBot = 516, level = (m.vol / 80) * (cupBot - cupTop - 4);
  el('rect', { x: 682, y: cupBot - level, width: 56, height: level, fill: LIQ[fluid] }, rig);
  el('path', { d: `M 680 ${cupTop} L 680 ${cupBot} L 740 ${cupBot} L 740 ${cupTop}`, fill: 'none', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, 710, cupTop - 8, '收集杯', { 'font-size': 13, fill: '#5A6478' });
  txt(rig, 738, 590, '天平（已去皮）', { 'font-size': 13, fill: '#5A6478' });
  // 讀數標籤
  el('rect', { x: CX + 22, y: hookY - 76, width: 82, height: 30, rx: 15, fill: '#2F6FB0' }, rig);
  txt(rig, CX + 63, hookY - 55, `${m.force} N`, { fill: '#FFFFFF', 'font-size': 17, 'font-weight': 900 });
  // 把手（彈簧秤上方）
  const hy = hookY - 128;
  const hg = el('g', { class: 'handle', tabindex: 0, role: 'slider', 'aria-label': '彈簧秤把手，往下放', 'aria-valuemin': 0, 'aria-valuemax': 10, 'aria-valuenow': step, 'aria-valuetext': `浸入 ${step * 10}%` }, rig);
  el('circle', { class: 'handle-ring', cx: CX, cy: hy, r: 28, fill: 'none', stroke: '#E0A21B', 'stroke-width': 4 }, hg);
  el('circle', { cx: CX, cy: hy, r: 19, fill: '#F4C04E', stroke: '#23304A', 'stroke-width': 3 }, hg);
  txt(hg, CX, hy + 6, '↓', { 'font-size': 20, 'font-weight': 900 });
  el('circle', { cx: CX, cy: hy, r: 46, fill: 'transparent' }, hg);
  if (LOWER.has(S.step) && step < 10 && !S.saved) { hg.classList.add('cue'); txt(rig, CX - 92, hy + 6, '往下放', { 'font-size': 18, 'font-weight': 900, fill: '#C8372D' }); }
  // 浸入比例
  if (step > 0) txt(rig, 420, SURF + 40, `浸入 ${step * 10}%`, { 'font-size': 16, fill: '#2F6FB0' });
  bindHandle(hg);
  if (hadFocus) hg.focus({ preventScroll: true });
}

/* ---------- 場景：浮沉 ---------- */
const BOX = 84, BEAK = { x: 380, y: 210, w: 240, h: 330 }, FSURF = 290;
function floatTarget(o) {
  const bottom = BEAK.y + BEAK.h;
  if (o.outcome === 'float') return FSURF - BOX * (1 - o.immersionFraction);
  if (o.outcome === 'stay') return (FSURF + bottom) / 2 - BOX / 2;
  return bottom - BOX - 3;
}
function drawFloat() {
  rig.replaceChildren();
  const fluid = S.ffluid, o = blockOutcome({ slots: S.slots, liquidId: fluid }), mass = blockMassG(S.slots);
  const held = 96, target = floatTarget(o);
  const y = dropAnim ? dropAnim.y : S.dropped ? target : held;
  el('rect', { x: BEAK.x, y: BEAK.y, width: BEAK.w, height: BEAK.h, fill: 'rgba(225,242,255,0.35)' }, rig);
  // 盒子
  const bx = 500 - BOX / 2;
  if (!S.dropped && !dropAnim) {
    el('line', { x1: 500, y1: 40, x2: 500, y2: y, stroke: '#7A5A3A', 'stroke-width': 3 }, rig);
    txt(rig, 500, 34, '手拿著盒子，按「放進液體」', { 'font-size': 14, fill: '#5A6478' });
  }
  el('rect', { x: bx, y, width: BOX, height: BOX, rx: 10, fill: '#FFF3D6', stroke: '#23304A', 'stroke-width': 3 }, rig);
  for (let k = 0; k < 6; k++) {
    const cx = bx + 18 + (k % 3) * 24, cy = y + 30 + Math.floor(k / 3) * 26;
    el('circle', { cx, cy, r: 8, fill: k < S.slots ? '#5E6B78' : 'none', stroke: '#8896A5', 'stroke-width': 2, 'stroke-dasharray': k < S.slots ? 'none' : '3 3' }, rig);
  }
  txt(rig, 500, y + BOX - 8, `${mass} g`, { 'font-size': 13, 'font-weight': 900 });
  // 液體與燒杯
  el('rect', { x: BEAK.x + 2, y: FSURF, width: BEAK.w - 4, height: BEAK.y + BEAK.h - FSURF, fill: LIQ[fluid] }, rig);
  el('line', { x1: BEAK.x + 2, y1: FSURF, x2: BEAK.x + BEAK.w - 2, y2: FSURF, stroke: 'rgba(255,255,255,.8)', 'stroke-width': 3 }, rig);
  el('path', { d: `M ${BEAK.x - 8} ${BEAK.y} L ${BEAK.x} ${BEAK.y} L ${BEAK.x} ${BEAK.y + BEAK.h} L ${BEAK.x + BEAK.w} ${BEAK.y + BEAK.h} L ${BEAK.x + BEAK.w} ${BEAK.y} L ${BEAK.x + BEAK.w + 8} ${BEAK.y}`, fill: 'none', stroke: '#23304A', 'stroke-width': 4, 'stroke-linejoin': 'round' }, rig);
  txt(rig, 500, 572, `${FNAME[fluid]}（密度 ${LIQUIDS[fluid].density} g/cm³）`, { 'font-size': 15, fill: '#5A6478' });
  if (S.dropped && !dropAnim) {
    const label = o.outcome === 'float' ? `浮在液面，浸入 ${Math.round(o.immersionFraction * 100)}%` : o.outcome === 'stay' ? '懸浮在液體中' : '沉到底';
    el('rect', { x: 640, y: y + BOX / 2 - 18, width: 210, height: 36, rx: 18, fill: o.outcome === 'sink' ? '#C8372D' : '#2E7D63' }, rig);
    txt(rig, 745, y + BOX / 2 + 6, label, { fill: '#FFFFFF', 'font-size': 16, 'font-weight': 900 });
  }
}
function draw() { if (S.step === 'float') drawFloat(); else drawBench(); }

/* ---------- 放鋁塊 ---------- */
function toSvg(e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
const canLower = () => LOWER.has(S.step) && !S.saved;
function bindHandle(node) {
  node.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    if (!canLower()) { blocked(); return; }
    e.preventDefault(); dragging = { id: e.pointerId }; document.body.classList.add('dragging');
  });
  node.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); lower(e.shiftKey ? 5 : 1); } });
}
addEventListener('pointermove', e => {
  if (!dragging || dragging.id !== e.pointerId) return;
  e.preventDefault();
  let p = (toSvg(e).y + 128 - HOOK0) / PER;
  if (p < S.p - 0.5 && !warned) { warned = true; oops('這個實驗只往下放；想重來，按任務卡的「重來這一步」。'); }
  p = Math.max(S.p, Math.min(10, p));
  shownP = p; dripping = true; draw(); renderReadouts();
}, { passive: false });
const endDrag = e => {
  if (!dragging || dragging.id !== e.pointerId) return;
  dragging = null; document.body.classList.remove('dragging'); dripping = false;
  setP(Math.round(shownP), false);
};
addEventListener('pointerup', endDrag);
addEventListener('pointercancel', endDrag);
function blocked() {
  if (S.step === 'air') oops('這一步先不用放進水裡，讀出空氣中的重量就好。');
  else if (!LOWER.has(S.step)) oops('這一步不用移動鋁塊，看任務卡要做的事。');
  else if (S.saved) oops('這一輪已經收下了。想再做一次，按「重來這一步」。');
}
function lower(n) { if (!canLower()) { blocked(); return; } setP(Math.min(10, S.p + n), true); }
let tween = 0;
function setP(v, animate) {
  if (v === S.p && !animate) { shownP = v; render(); return; }
  const from = shownP; S.p = v; lastNote = null; warned = false; save();
  cancelAnimationFrame(tween);
  if (!animate || reduceMotion()) { shownP = v; dripping = false; render(); return; }
  const t0 = performance.now(); dripping = true;
  const f = now => {
    const k = Math.min(1, (now - t0) / 420), e = 1 - Math.pow(1 - k, 3);
    shownP = from + (v - from) * e; draw(); renderReadouts();
    if (k < 1) tween = requestAnimationFrame(f); else { shownP = v; dripping = false; render(); }
  };
  tween = requestAnimationFrame(f);
}

/* ---------- 浮沉操作 ---------- */
function setSlots(n) {
  if (n < BLOCK.slotsMin || n > BLOCK.slotsMax) { oops(n < 0 ? '盒子裡已經沒有砝碼了。' : '盒子最多放 6 個砝碼。'); return; }
  S.slots = n; S.dropped = false; S.saved = false; lastNote = null; foundShown = null; save(); render();
}
function pickFluid(f) { S.step = 'float'; S.ffluid = f; S.dropped = false; S.saved = false; lastNote = null; foundShown = null; save(); teacher.last = ''; render(); }
function drop() {
  if (S.dropped) { oops('已經放進去了。換砝碼數或換液體再試。'); return; }
  const o = blockOutcome({ slots: S.slots, liquidId: S.ffluid }), target = floatTarget(o);
  lastNote = null;
  if (reduceMotion()) { S.dropped = true; save(); render(); return; }
  const t0 = performance.now(), from = 96;
  const f = now => {
    const t = Math.min(1, (now - t0) / 900);
    const e = t < 1 ? 1 - Math.pow(1 - t, 3) * Math.cos(t * 9) : 1;   // 落下後輕微彈動
    dropAnim = { y: from + (target - from) * e }; drawFloat();
    if (t < 1) requestAnimationFrame(f); else { dropAnim = null; S.dropped = true; save(); render(); }
  };
  requestAnimationFrame(f);
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
  if (S.step === 'float') {
    const mass = blockMassG(S.slots), d = mass / BLOCK.volumeCm3;
    setReading(1, '盒子質量', mass, 'g', `盒子 40 g＋砝碼 ${S.slots} 個`);
    setReading(2, '盒子密度', r3(d), 'g/cm³', `${mass} ÷ 100 cm³`);
    setReading(3, '液體密度', LIQUIDS[S.ffluid].density, 'g/cm³', FNAME[S.ffluid]);
    return;
  }
  const m = measure(fluidNow(), Math.round(liveP()));
  setReading(1, '彈簧秤讀數', m.force, 'N', `空氣中 ${W_AIR} N`);
  setReading(2, '排開的液體', m.vol, 'cm³', '鋁塊體積 50 cm³');
  setReading(3, '杯中液體', m.mass, 'g', `重 ${r3(m.mass / 100)} N，天平已去皮`);
}

/* ---------- 余老師 ---------- */
function oops(t) { teacher.last = ''; teacher.say(t, { pose: 'think', tone: 'oops' }); lastNote = t; }
function floatHint() {
  const rs = floatRecs(), has = (f, o) => rs.some(r => r.fluid === f && r.outcome === o);
  if (!has('water', 'float')) return '先在清水裡試一個會浮的盒子（砝碼少一點）。';
  if (!has('water', 'sink')) return '加砝碼，找一個在清水裡會沉的盒子。';
  const contrast = rs.some(a => rs.some(b => a.slots === b.slots && a.fluid !== b.fluid && a.outcome !== b.outcome));
  if (!contrast) return '找一個在清水裡會沉或懸浮的砝碼數，換到濃鹽水再放一次。';
  return '';
}
function talk() {
  if (lastNote) return;
  if (foundShown) {
    const f = TASK[foundShown].found;
    const action = foundShown === 'quiz' ? { label: '看成果 →', run: openFinish } : { label: '下一步 →', run: () => goStep(NEXT[foundShown]) };
    teacher.say(f[0], { pose: 'cheer', tone: 'found', tag: '發現時刻', eq: f[1], action }); return;
  }
  const step = S.step, done = S.done.includes(step), task = TASK[step];
  if (step === 'air') { teacher.say(S.saved || done ? '這一步完成了，按任務卡的「下一步」繼續。' : task.intro, { pose: S.saved || done ? 'thumb' : 'point' }); return; }
  if (LOWER.has(step)) {
    const m = measure(fluidNow(), S.p);
    if (S.saved) { teacher.say('這一步完成了，按任務卡的「下一步」繼續。', { pose: 'thumb' }); return; }
    if (S.p >= 10) teacher.say(`完全浸沒了！讀數 ${m.force} N，杯子接到 ${m.mass} g 的${FNAME[fluidNow()]}。收下這次觀察。`, { pose: 'wow' });
    else if (S.p === 0) teacher.say(task.intro, { pose: 'point' });
    else teacher.say(`浸入 ${S.p * 10}%：讀數 ${m.force} N，比空氣中少了 ${r3(W_AIR - m.force)} N。繼續放！`, { pose: 'point' });
    return;
  }
  if (step === 'arch') {
    if (!hasRec('water')) { teacher.say('還少「放進清水」的證據，先回去收下來。', { pose: 'think' }); return; }
    teacher.say(done ? '算對了！按任務卡的「下一步」繼續。' : task.intro, { pose: done ? 'thumb' : 'notebook' }); return;
  }
  if (step === 'float') {
    const o = blockOutcome({ slots: S.slots, liquidId: S.ffluid }), d = r3(blockMassG(S.slots) / 100), ld = LIQUIDS[S.ffluid].density;
    if (S.saved) { const h = floatHint(); teacher.say(h ? `收下了！${h}` : '比較完了！按任務卡的「下一步」。', { pose: 'thumb' }); return; }
    if (!S.dropped) { teacher.say(floatRecs().length ? (floatHint() || '再試試別的組合。') : task.intro, { pose: 'point' }); return; }
    const msg = o.outcome === 'float' ? `浮起來了！盒子密度 ${d} 比液體 ${ld} 小，浸入 ${Math.round(o.immersionFraction * 100)}%。收下這次觀察。`
      : o.outcome === 'stay' ? `懸浮在液體中間！盒子密度 ${d} 和液體一樣。收下這次觀察。`
      : `沉下去了！盒子密度 ${d} 比液體 ${ld} 大。收下這次觀察。`;
    teacher.say(msg, { pose: o.outcome === 'sink' ? 'think' : 'wow' }); return;
  }
  teacher.say(done ? '全部完成了！可以按「看成果」。' : task.intro, { pose: done ? 'thumb' : 'think' });
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
  const usesDock = S.step === 'air' || LOWER.has(S.step) || S.step === 'float';
  $('#dock-pull').hidden = !usesDock; $('#dock-calc').hidden = S.step !== 'arch'; $('#dock-quiz').hidden = S.step !== 'quiz';
  $('#lower-box').hidden = !LOWER.has(S.step);
  $('#float-box').hidden = S.step !== 'float'; $('#fluid-pick').hidden = S.step !== 'float';
  for (const f of ['water', 'brine']) { const b = $('#pick-' + f); b.setAttribute('aria-pressed', String(S.ffluid === f)); }
  $('#ballast-n').textContent = S.slots;
  $('#lower-1').disabled = $('#lower-5').disabled = !canLower() || S.p >= 10;
  $('#drop').disabled = S.dropped;
  const ready = (S.step === 'air' && !S.saved) || (LOWER.has(S.step) && S.p >= 10 && !S.saved) || (S.step === 'float' && S.dropped && !S.saved);
  $('#save').classList.toggle('cue', ready);
  if (S.step === 'arch') renderCalc();
  if (S.step === 'quiz') renderQuiz();
}

/* ---------- 算一算 ---------- */
let calcBuilt = false;
function renderCalc() {
  $('#calc-head').textContent = '用「放進清水」的證據算算看';
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
  const ok = hasRec('water');
  for (const r of CALC) { const inp = $('#calc-' + r.id); inp.disabled = !ok; if (document.activeElement !== inp) inp.value = S.calc[r.id] || ''; }
  $('#check').disabled = !ok;
}
const num = v => { const t = String(v).trim().replace(/[NnＮ\s]/g, '').replace('，', '.').replace('．', '.'); return /^\d*\.?\d+$/.test(t) ? Number(t) : NaN; };
function check() {
  const res = {};
  for (const r of CALC) {
    const inp = $('#calc-' + r.id); S.calc[r.id] = inp.value; const v = num(inp.value);
    res[r.id] = Math.abs(v - r.answer) < 1e-9;
    inp.classList.toggle('ok', res[r.id]); inp.classList.toggle('bad', !res[r.id] && inp.value.trim() !== '');
  }
  save();
  if (CALC.every(r => res[r.id])) { if (!S.done.includes('arch')) S.done.push('arch'); foundShown = 'arch'; lastNote = null; save(); render(); return; }
  const w = CALC.find(r => !res[r.id]), v = num($('#calc-' + w.id).value);
  let msg;
  if (Number.isNaN(v)) msg = `先在「${w.name}」那一格填數字。`;
  else if (w.id === 'buoy') msg = Math.abs(v - 2.2) < 1e-9 ? '浮力是兩個讀數「相減」，不是相加。' : (Math.abs(v - 0.85) < 1e-9 || Math.abs(v - 1.35) < 1e-9) ? '浮力是讀數少掉的部分：1.35 − 0.85 ＝ ？' : '浮力 ＝ 空氣中 1.35 N − 水中 0.85 N。';
  else msg = Math.abs(v - 50) < 1e-9 ? '50 是質量（g）。換成重量：1 公斤重 ＝ 10 N，也就是 100 g 重 1 N。50 g 重多少 N？' : Math.abs(v - 0.05) < 1e-9 ? '0.05 是 kg。1 公斤重 ＝ 10 N，所以還要乘 10。' : '100 g 的水重 1 N，50 g 的水重多少 N？';
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
const OUT = { float: '浮', stay: '懸浮', sink: '沉' };
function chipHtml(r) {
  if (r.device === 'float') return `<small>#${r.n} 浮還是沉</small><b>${r.mass} g・${FNAME[r.fluid]}</b><span class="res${r.outcome === 'sink' ? '' : ' ok'}">${OUT[r.outcome]}</span>`;
  if (r.device === 'air') return `<small>#${r.n} 空氣中</small><b>${r.force} N</b><span class="res ok">鋁塊重</span>`;
  return `<small>#${r.n} ${FNAME[r.device]}中</small><b>${r.force} N ｜ ${r.mass} g</b><span class="res ok">排開 ${r.vol} cm³</span>`;
}
function renderEvidence() {
  const n = S.records.length;
  $('#ev-count').textContent = n; $('#note-count').textContent = n; $('#ev-empty').hidden = n > 0;
  const chips = $('#chips'), want = S.records.slice(-4).reverse(), key = want.map(r => r.n).join(',');
  if (chips.dataset.key === key) return; chips.dataset.key = key;
  chips.replaceChildren(...want.map(r => { const li = document.createElement('li'); li.className = 'chip'; li.innerHTML = chipHtml(r); return li; }));
}
function keep() {
  const step = S.step;
  if (S.saved) { oops(step === 'float' ? '這一次已經收下了。換砝碼數或液體再試。' : '這一輪已經收下了。想再做一次，按「重來這一步」。'); return; }
  if (S.records.length >= 50) { oops('手冊滿 50 張了，清空紀錄才能再收。'); return; }
  let entry, label;
  if (step === 'air') { entry = { device: 'air', force: W_AIR }; label = `空氣中 ${W_AIR} N`; }
  else if (LOWER.has(step)) {
    if (S.p < 10) { oops(`先讓鋁塊完全浸沒再收下（現在浸入 ${S.p * 10}%）。`); return; }
    const m = measure(fluidNow(), 10); entry = { device: fluidNow(), force: m.force, vol: m.vol, mass: m.mass }; label = `${FNAME[fluidNow()]} ${m.force} N`;
  } else if (step === 'float') {
    if (!S.dropped) { oops('先按「放進液體」，看看浮還是沉。'); return; }
    const o = blockOutcome({ slots: S.slots, liquidId: S.ffluid });
    entry = { device: 'float', slots: S.slots, mass: blockMassG(S.slots), fluid: S.ffluid, outcome: o.outcome, frac: o.immersionFraction }; label = `${blockMassG(S.slots)} g ${OUT[o.outcome]}`;
  } else return;
  S.records.push({ n: S.records.length + 1, at: new Date().toISOString(), ...entry });
  S.saved = true; lastNote = null;
  const stepDone = step === 'float' ? !floatHint() : true;
  if (stepDone && !S.done.includes(step)) { S.done.push(step); foundShown = step; }
  save();
  const target = isVisible($('#evidence')) ? $('#evidence') : $('#note-count');
  fly($('#save'), target, label).then(() => { renderEvidence(); bump($('#note-count')); });
  render();
}
const isVisible = n => { const r = n.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };

/* ---------- 步驟 ---------- */
function goStep(id) {
  S.step = id; foundShown = null; lastNote = null; warned = false;
  if (id === 'air' || LOWER.has(id)) { S.p = 0; S.saved = false; }
  if (id === 'float') { S.dropped = false; S.saved = false; }
  if (id === 'quiz' && !S.done.includes('quiz')) S.quiz = { i: 0, pick: null };
  calcBuilt = false; shownP = S.p; save(); teacher.last = ''; render();
  if (narrow.matches) scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
}
function resetStep() {
  if (S.step === 'arch') CALC.forEach(r => delete S.calc[r.id]);
  if (S.step === 'quiz') S.quiz = { i: 0, pick: null };
  goStep(S.step);
}

/* ---------- 對話框 ---------- */
function openNotes() {
  const body = $('#notes-body'); body.replaceChildren();
  if (!S.records.length) { const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="5" class="notes-empty">還沒有證據。</td>'; body.append(tr); }
  for (const r of S.records) {
    const tr = document.createElement('tr');
    const cells = r.device === 'float' ? ['浮還是沉', FNAME[r.fluid], `${r.mass} g → ${OUT[r.outcome]}`, r.frac ? `浸入 ${Math.round(r.frac * 100)}%` : '—']
      : r.device === 'air' ? ['空氣中', '—', `${r.force} N`, '—'] : ['完全浸沒', FNAME[r.device], `${r.force} N`, `${r.vol} cm³・${r.mass} g`];
    tr.innerHTML = `<td>${r.n}</td>` + cells.map(c => `<td>${c}</td>`).join('');
    body.append(tr);
  }
  $('#notes-dialog').showModal();
}
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#F4C04E" stroke="#23304A" stroke-width="1.2" stroke-linejoin="round"/></svg>';
function openFinish() {
  const got = STEPS.filter(s => S.done.includes(s.id)).length;
  $('#stars').innerHTML = STEPS.map(s => S.done.includes(s.id) ? STAR : STAR.replace('<svg', '<svg class="off"')).join('');
  $('#stars').setAttribute('aria-label', `完成 ${STEPS.length} 個任務中的 ${got} 個`);
  const w = S.records.find(r => r.device === 'water'), b = S.records.find(r => r.device === 'brine');
  $('#finish-list').innerHTML = [
    `<li><b>空氣中</b>：鋁塊重 ${W_AIR} N</li>`,
    w && `<li><b>清水</b>：讀數 ${w.force} N → 浮力 ${r3(W_AIR - w.force)} N；排開的水 ${w.mass} g，重 ${r3(w.mass / 100)} N</li>`,
    b && `<li><b>濃鹽水</b>：讀數 ${b.force} N → 浮力 ${r3(W_AIR - b.force)} N；排開的鹽水 ${b.mass} g，重 ${r3(b.mass / 100)} N</li>`,
    floatRecs().length && `<li><b>浮還是沉</b>：試了 ${floatRecs().length} 次</li>`
  ].filter(Boolean).join('');
  $('#finish-dialog').showModal();
}
function clearAll() {
  if (!confirm('要清空這一站的所有證據和進度，從第 1 步重新開始嗎？')) return;
  db.clear(); S = fresh(); shownP = 0; foundShown = null; lastNote = null; teacher.last = ''; calcBuilt = false;
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  render(); if (narrow.matches) scrollTo({ top: 0 });
}

/* ---------- 版面 ---------- */
const narrow = matchMedia('(max-width: 860px)');
function fitScene() {
  const fl = S.step === 'float';
  svg.setAttribute('viewBox', narrow.matches ? (fl ? '330 20 560 570' : '240 30 600 570') : (fl ? '150 20 760 570' : '150 30 760 570'));
}
narrow.addEventListener?.('change', () => render());
function render() {
  renderSteps($('#steps'), STEPS, S.step, new Set(S.done), id => goStep(id));
  fitScene(); draw(); renderReadouts(); renderEvidence(); renderTask(); talk();
}

$('#lower-1').addEventListener('click', () => lower(1));
$('#lower-5').addEventListener('click', () => lower(5));
$('#ballast-minus').addEventListener('click', () => setSlots(S.slots - 1));
$('#ballast-plus').addEventListener('click', () => setSlots(S.slots + 1));
$('#drop').addEventListener('click', drop);
$('#pick-water').addEventListener('click', () => pickFluid('water'));
$('#pick-brine').addEventListener('click', () => pickFluid('brine'));
$('#save').addEventListener('click', keep);
$('#check').addEventListener('click', check);
$('#task-reset').addEventListener('click', resetStep);
$('#clear-records').addEventListener('click', clearAll);
$('#reset-all').addEventListener('click', clearAll);
$('#why').addEventListener('click', () => $('#why-dialog').showModal());
$('#open-notes').addEventListener('click', openNotes);
document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

render();
