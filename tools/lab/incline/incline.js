// 斜面實驗桌（新版試用）
// 短／長斜面沿用 tools/incline-desk/model.mjs；有摩擦的斜面沿用 tools/friction-efficiency-desk/model.mjs；
// 「比一比」的其他長度、高度用 ideal-model.mjs（已與上述兩個模型逐公分比對一致）。
import { derive as rampDerive, RAMPS } from '../../incline-desk/model.mjs';
import { derive as frictionDerive, PARAMETERS as FP } from '../../friction-efficiency-desk/model.mjs';
import { idealIncline, LENGTHS, HEIGHTS } from './ideal-model.mjs';
import { $, store, Teacher, renderSteps, fly, bump, reduceMotion } from '../shared/lab.js';

const NS = 'http://www.w3.org/2000/svg';
const P = '../../../assets/science/props/';
const db = store('bhcs.lab.incline.v2');
const SHORT = { short: '短斜面', long: '長斜面', ideal: '光滑坡面', rough: '粗糙坡面', cmp: '比一比' };
const cmpName = r => `長 ${r.L}／高 ${r.H}`;
const WEIGHT = 10;

/* ---------- 模型（只讀正式站模型） ---------- */
function run(dev, s) {
  if (dev === 'cmp') return idealIncline(S.cmp.L, S.cmp.H, s);
  if (dev === 'short' || dev === 'long') {
    const d = rampDerive(dev, s);
    return { force: d.forceHalfN / 2, s, h: d.hQuarterCm / 4, L: d.lengthCm, H: d.heightCm, friction: 0 };
  }
  const d = frictionDerive(dev, s);
  return { force: d.forceN, s, h: d.hCm, L: d.lengthCm, H: d.heightCm, friction: d.frictionN };
}
const lengthOf = dev => dev === 'cmp' ? S.cmp.L : dev === 'short' || dev === 'long' ? RAMPS[dev].lengthCm : FP.lengthCm;

const STEPS = [
  { id: 'short', label: '短斜面' },
  { id: 'long', label: '長斜面' },
  { id: 'compare', label: '比一比' },
  { id: 'calc', label: '算一算功' },
  { id: 'friction', label: '有摩擦' },
  { id: 'quiz', label: '說說看' }
];
const NEXT = { short: 'long', long: 'compare', compare: 'calc', calc: 'friction', friction: 'quiz' };
const PULL = new Set(['short', 'long', 'compare', 'friction']);
const TASK = {
  short: { title: '短斜面：把木箱拉到坡頂', goal: '坡長 40 cm、高 20 cm。沿著斜面拖曳黃色把手（或按「往上拉」），木箱到坡頂後收下觀察。',
    intro: '直接提起木箱要 10 N。沿著斜面拉，要多少力？',
    found: ['斜面省力！坡長是高度的 2 倍，拉力只要一半。', '拉力 5 N，沿坡走 40 cm，木箱升高 20 cm'] },
  long: { title: '長斜面：同樣高 20 cm，坡更長', goal: '坡長 80 cm、高度一樣 20 cm。把同一個木箱拉到坡頂，比較拉力和距離。',
    intro: '坡變長、變緩了。你猜拉力會變大還是變小？',
    found: ['斜面越長越省力，但要走更遠。', '拉力 2.5 N，沿坡走 80 cm'] },
  compare: { title: '比一比：長度和高度怎麼影響拉力？', goal: '選斜面長度和高度，往上拉一點就能讀到拉力，按「收下這次觀察」填進比較表。至少量 3 種：要有「高度一樣、長度不同」和「長度一樣、高度不同」。',
    intro: '換換看斜面的長度和高度，拉力會怎麼變？',
    found: ['高度一樣，斜面越長越省力；長度一樣，斜面越高越費力。', '拉力 ＝ 重量 × 高 ÷ 長'] },
  calc: { title: '算一算：三種方法各做了多少功？', goal: '功 ＝ 力 × 沿著力的方向移動的距離。距離先換成 m，答案用焦耳（J）。',
    intro: '直接提起、短斜面、長斜面，三種方法的功會一樣嗎？',
    found: ['三種都是 2 J！斜面省力，但不省功。', '10 × 0.20 ＝ 5 × 0.40 ＝ 2.5 × 0.80 ＝ 2 J'] },
  friction: { title: '真實的斜面有摩擦', goal: '同一個坡（長 100 cm、高 60 cm），分別用「光滑坡面」和「粗糙坡面」把木箱拉到坡頂，各收一張。',
    intro: '先拉光滑坡面，再換粗糙坡面。拉力會一樣嗎？',
    found: ['有摩擦時要多用力：粗糙坡面要 8 N，比光滑的 6 N 多了 2 N。', '多出來的 2 N 用來克服摩擦力；坡面越光滑越省力'] },
  quiz: { title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。',
    intro: '最後三題！想想你收下的證據。',
    found: ['你把斜面弄懂了！', '同樣高度，斜面越長越省力，但功不變'] }
};
const QUIZ = [
  { q: '要把同一個木箱推上同樣高的平台，哪一種斜面最省力？', options: [
    { text: '又短又陡的斜面，因為走的路比較短。', why: '短斜面走得短，但拉力比較大。你的證據：短坡 5 N，長坡 2.5 N。' },
    { text: '又長又緩的斜面。', ok: true },
    { text: '都一樣，因為高度一樣。', why: '做的功一樣，但拉力不一樣：斜面越長越省力。' }] },
  { q: '用長斜面省了力，那做的功呢？（不計摩擦）', options: [
    { text: '變少了，因為比較省力。', why: '省力，但要多走距離。2.5 N × 0.80 m 還是 2 J。' },
    { text: '一樣，因為要走更遠的距離。', ok: true },
    { text: '變多了，因為走得比較遠。', why: '不計摩擦時，力變小、距離變長，兩者相乘還是 2 J。' }] },
  { q: '斜面長度不變，把平台加高，拉同一個木箱的拉力會怎樣？', options: [
    { text: '變小，因為斜面變陡了。', why: '斜面變陡反而比較費力。看比較表：長 50 cm 時，高 10、20、30 cm 的拉力是 2、4、6 N。' },
    { text: '不變，因為斜面長度一樣。', why: '拉力 ＝ 重量 × 高 ÷ 長，高度變大，拉力也跟著變大。' },
    { text: '變大，拉力 ＝ 重量 × 高 ÷ 長。', ok: true }] }
];
const CALC = {
  calc: { head: '功 ＝ 力 × 距離（距離換成 m）', rows: [
    { id: 'lift', name: '直接提起', eq: () => '10 N × 往上 20 cm', need: [], answer: 2, unit: 'J', F: 10, cm: 20 },
    { id: 'short', name: '短斜面', eq: () => '5 N × 沿坡 40 cm', need: ['short'], answer: 2, unit: 'J', F: 5, cm: 40 },
    { id: 'long', name: '長斜面', eq: () => '2.5 N × 沿坡 80 cm', need: ['long'], answer: 2, unit: 'J', F: 2.5, cm: 80 }] }
};

/* ---------- 狀態 ---------- */
const DEVICES = ['short', 'long', 'ideal', 'rough', 'cmp'];
const fresh = () => ({ v: 2, step: 'short', surface: 'ideal', cmp: { L: 50, H: 20 }, s: 0, saved: false, records: [], done: [], calc: {}, quiz: { i: 0, pick: null } });
function loadState() {
  const s = db.load();
  try {
    if (!s || s.v !== 2 || !s.cmp || !LENGTHS.includes(s.cmp.L) || !HEIGHTS.includes(s.cmp.H) || !STEPS.some(x => x.id === s.step) || !['ideal', 'rough'].includes(s.surface) || !Number.isInteger(s.s) || s.s < 0) throw 0;
    if (!Array.isArray(s.records) || !Array.isArray(s.done) || !s.calc || !s.quiz || !Number.isInteger(s.quiz.i)) throw 0;
    if (!s.records.every(r => DEVICES.includes(r.device))) throw 0;
    return s;
  } catch { return fresh(); }
}
let S = loadState(), shownS = S.s, foundShown = null, lastNote = null, dragging = null, warnedDown = false;
const save = () => db.save(S);
const device = () => S.step === 'friction' ? S.surface : S.step === 'compare' ? 'cmp' : (S.step === 'short' || S.step === 'long') ? S.step : S.step === 'calc' ? 'long' : 'rough';
const liveS = () => PULL.has(S.step) ? shownS : lengthOf(device());
const hasRec = d => S.records.some(r => r.device === d);
const cmpRecs = () => S.records.filter(r => r.device === 'cmp');
const hasCmp = (L, H) => cmpRecs().some(r => r.L === L && r.H === H);
const rec = d => S.records.find(r => r.device === d);

const svg = $('#scene'), rig = $('#rig');
const teacher = new Teacher($('#teacher-pic'), $('#bubble'), $('#live'));
const el = (tag, a = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (parent) parent.append(n); return n; };
const txt = (parent, x, y, s, a = {}) => { const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#23304A', ...a }, parent); t.textContent = s; return t; };

/* ---------- 斜面幾何 ---------- */
const BOX = 60, LEAD = 170;
const GEO = {
  short: { sc: 8, x0: 330, y0: 470 },
  long: { sc: 8, x0: 170, y0: 470 },
  ideal: { sc: 4.4, x0: 240, y0: 500 },
  rough: { sc: 4.4, x0: 240, y0: 500 },
  cmp: { sc: 6, x0: 160, y0: 470 }
};
function geo(dev) {
  const r = run(dev, 0), g = GEO[dev], L = r.L * g.sc, H = r.H * g.sc, base = Math.sqrt(L * L - H * H);
  const th = Math.asin(r.H / r.L), u = [Math.cos(th), -Math.sin(th)], nrm = [-Math.sin(th), -Math.cos(th)];
  const B = [g.x0, g.y0], T = [g.x0 + base, g.y0 - H];
  return { ...g, L, H, base, th, u, nrm, B, T, Lcm: r.L, Hcm: r.H };
}
const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
const boxD = (G, s) => s * G.sc;   // 木箱底部中心正好在沿坡 s 的位置，高度與模型一致

/* ---------- 場景 ---------- */
function defs() {
  const d = el('defs', {}, rig);
  const pt = el('pattern', { id: 'rough', width: 14, height: 14, patternUnits: 'userSpaceOnUse' }, d);
  el('rect', { width: 14, height: 14, fill: '#C9A46E' }, pt);
  el('circle', { cx: 3, cy: 4, r: 1.6, fill: '#8A6A3C' }, pt); el('circle', { cx: 10, cy: 9, r: 1.4, fill: '#8A6A3C' }, pt); el('circle', { cx: 6, cy: 12, r: 1.1, fill: '#A0814F' }, pt);
  const mk = el('marker', { id: 'arrowR', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, d);
  el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#C8372D' }, mk);
  const mb = el('marker', { id: 'arrowB', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, d);
  el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#2F6FB0' }, mb);
}
function draw() {
  const dev = device(), G = geo(dev), s = Math.round(liveS() * 10) / 10, si = Math.min(G.Lcm, Math.round(s));
  const r = run(dev, si);
  const hadFocus = !!document.activeElement && rig.contains(document.activeElement);
  rig.replaceChildren(); defs();
  // 斜面本體與坡頂平台
  const rough = dev === 'rough';
  el('path', { d: `M ${G.B[0] - 30} ${G.B[1]} L ${G.T[0]} ${G.T[1]} L ${G.T[0] + 130} ${G.T[1]} L ${G.T[0] + 130} ${G.B[1]} Z`, fill: '#D9A867', stroke: '#23304A', 'stroke-width': 4, 'stroke-linejoin': 'round' }, rig);
  el('rect', { x: G.T[0], y: G.T[1], width: 130, height: G.B[1] - G.T[1], fill: '#C48E4C', stroke: '#23304A', 'stroke-width': 4 }, rig);
  el('line', { x1: G.B[0], y1: G.B[1], x2: G.T[0], y2: G.T[1], stroke: rough ? 'url(#rough)' : '#F1D3A1', 'stroke-width': rough ? 12 : 6, 'stroke-linecap': 'round' }, rig);
  el('line', { x1: G.B[0] - 60, y1: G.B[1], x2: G.T[0] + 160, y2: G.B[1], stroke: '#23304A', 'stroke-width': 4 }, rig);
  // 起點與坡頂標記
  const tick = (p, label) => { const a = add(p, G.nrm, -2), b = add(p, G.nrm, -18); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#23304A', 'stroke-width': 3 }, rig); const t = add(p, G.nrm, -34); txt(rig, t[0], t[1] + 5, label, { 'font-size': 13, fill: '#5A6478' }); };
  tick(G.B, '起點'); tick(G.T, '坡頂');
  const mid = add(add(G.B, G.u, G.L / 2), G.nrm, -42);
  txt(rig, mid[0], mid[1] + 5, `斜面長 ${G.Lcm} cm`, { 'font-size': 15, fill: '#5A6478', transform: `rotate(${(-G.th * 180 / Math.PI).toFixed(1)} ${mid[0]} ${mid[1]})` });
  // 高度尺
  const rx = G.T[0] + 160, step = G.Hcm <= 20 ? 5 : 10;
  el('rect', { x: rx - 6, y: G.T[1] - 8, width: 12, height: G.H + 16, rx: 4, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 2 }, rig);
  for (let c = 0; c <= G.Hcm; c += step) { const y = G.B[1] - c * G.sc; el('line', { x1: rx - 6, y1: y, x2: rx + 6, y2: y, stroke: '#23304A', 'stroke-width': 2 }, rig); txt(rig, rx + 26, y + 5, String(c), { 'font-size': 13, fill: '#5A6478' }); }
  txt(rig, rx + 26, G.T[1] - 18, '高 cm', { 'font-size': 13, fill: '#5A6478' });
  const hy = G.B[1] - r.h * G.sc;
  el('path', { d: `M ${rx - 8} ${hy} l -12 -7 v 14 z`, fill: '#C8372D' }, rig);
  // 木箱
  const d = boxD(G, s), foot = add(G.B, G.u, d), c = add(foot, G.nrm, BOX / 2), deg = -G.th * 180 / Math.PI;
  el('line', { x1: foot[0], y1: hy, x2: rx - 8, y2: hy, stroke: '#C8372D', 'stroke-width': 2, 'stroke-dasharray': '6 6', opacity: 0.6 }, rig);
  const bg = el('g', { transform: `translate(${c[0].toFixed(1)} ${c[1].toFixed(1)}) rotate(${deg.toFixed(2)})` }, rig);
  el('image', { href: P + 'prop-wooden-crate.webp', x: -BOX / 2, y: -BOX / 2, width: BOX, height: BOX }, bg);
  el('rect', { x: -24, y: -12, width: 48, height: 24, rx: 12, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 2 }, bg);
  txt(bg, 0, 6, `${WEIGHT} N`, { 'font-size': 14, 'font-weight': 900 });
  // 摩擦力箭頭（粗糙坡面）
  if (rough && si < G.Lcm) {
    const a1 = add(add(foot, G.u, -BOX / 2 - 4), G.nrm, 8), a2 = add(a1, G.u, -48);
    el('line', { x1: a1[0], y1: a1[1], x2: a2[0], y2: a2[1], stroke: '#C8372D', 'stroke-width': 4, 'marker-end': 'url(#arrowR)' }, rig);
    const lt = add(a2, G.nrm, -20); txt(rig, lt[0], lt[1], `摩擦力 ${r.friction} N`, { 'font-size': 14, fill: '#C8372D' });
  }
  // 繩子、彈簧秤、把手
  const ropeA = add(c, G.u, BOX / 2), scaleA = add(ropeA, G.u, 40), scaleB = add(scaleA, G.u, 96), hand = add(ropeA, G.u, LEAD);
  el('line', { x1: ropeA[0], y1: ropeA[1], x2: scaleA[0], y2: scaleA[1], stroke: '#7A5A3A', 'stroke-width': 4 }, rig);
  const scm = add(scaleA, G.u, 48);
  const sg = el('g', { transform: `translate(${scm[0].toFixed(1)} ${scm[1].toFixed(1)}) rotate(${(deg + 180).toFixed(2)})` }, rig);
  el('image', { href: P + 'prop-spring-scale.webp', x: -48, y: -7.6, width: 96, height: 15.2 }, sg);
  el('line', { x1: scaleB[0], y1: scaleB[1], x2: hand[0], y2: hand[1], stroke: '#7A5A3A', 'stroke-width': 3 }, rig);
  const ft = add(scm, G.nrm, 34);
  el('rect', { x: ft[0] - 38, y: ft[1] - 16, width: 76, height: 30, rx: 15, fill: '#2F6FB0' }, rig);
  txt(rig, ft[0], ft[1] + 5, `${r.force} N`, { fill: '#FFFFFF', 'font-size': 17, 'font-weight': 900 });
  const hg = el('g', { class: 'handle', tabindex: 0, role: 'slider', 'aria-label': '拉繩把手，沿斜面往上拉', 'aria-valuemin': 0, 'aria-valuemax': G.Lcm, 'aria-valuenow': si, 'aria-valuetext': `沿斜面拉了 ${si} 公分` }, rig);
  el('circle', { class: 'handle-ring', cx: hand[0], cy: hand[1], r: 28, fill: 'none', stroke: '#E0A21B', 'stroke-width': 4 }, hg);
  el('circle', { cx: hand[0], cy: hand[1], r: 19, fill: '#F4C04E', stroke: '#23304A', 'stroke-width': 3 }, hg);
  txt(hg, hand[0], hand[1] + 6, '↗', { 'font-size': 18, 'font-weight': 900 });
  el('circle', { cx: hand[0], cy: hand[1], r: 46, fill: 'transparent' }, hg);
  if (PULL.has(S.step) && si < G.Lcm && !S.saved) {
    hg.classList.add('cue');
    const lt = add(hand, G.nrm, 44); txt(rig, lt[0], lt[1], '沿斜面往上拉', { 'font-size': 16, 'font-weight': 900, fill: '#C8372D' });
  }
  bindHandle(hg, dev, G);
  if (hadFocus) hg.focus({ preventScroll: true });
}
/* ---------- 拉動 ---------- */
function toSvg(e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
function sFromPointer(G, p) {
  const origin = add(add(G.B, G.nrm, BOX / 2), G.u, BOX / 2 + LEAD);  // s = 0 時把手的位置
  const along = (p.x - origin[0]) * G.u[0] + (p.y - origin[1]) * G.u[1];
  return along / G.sc;
}
const canPull = () => PULL.has(S.step) && !S.saved;
function bindHandle(node, dev, G) {
  node.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    if (!canPull()) { blocked(); return; }
    e.preventDefault(); dragging = { id: e.pointerId, G };
    document.body.classList.add('dragging');
  });
  node.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowRight'].includes(e.key)) { e.preventDefault(); pull(e.shiftKey ? 20 : 5); }
  });
}
addEventListener('pointermove', e => {
  if (!dragging || dragging.id !== e.pointerId) return;
  e.preventDefault();
  const L = dragging.G.Lcm;
  let s = sFromPointer(dragging.G, toSvg(e));
  if (s < S.s - 1 && !warnedDown) { warnedDown = true; oops('這個實驗只往上拉；想重來，按任務卡的「重來這一步」。'); }
  s = Math.max(S.s, Math.min(L, s));
  shownS = s; draw(); renderReadouts();
}, { passive: false });
const endDrag = e => {
  if (!dragging || dragging.id !== e.pointerId) return;
  dragging = null; document.body.classList.remove('dragging');
  setS(Math.round(shownS), false);
};
addEventListener('pointerup', endDrag);
addEventListener('pointercancel', endDrag);
function blocked() {
  if (!PULL.has(S.step)) oops('這一步不用拉木箱，看任務卡要做的事。');
  else if (S.saved) oops(S.step === 'friction' ? '這一輪已經收下了。換另一種坡面，或按「重來這一步」。' : '這一輪已經收下了。想再拉一次，按「重來這一步」。');
}
function pull(cm) { if (!canPull()) { blocked(); return; } setS(Math.min(lengthOf(device()), S.s + cm), true); }
let tween = 0;
function setS(v, animate) {
  if (v === S.s && !animate) { shownS = v; render(); return; }
  const from = shownS; S.s = v; lastNote = null; warnedDown = false; save();
  cancelAnimationFrame(tween);
  if (!animate || reduceMotion()) { shownS = v; render(); return; }
  const t0 = performance.now();
  const stepF = now => {
    const k = Math.min(1, (now - t0) / 360), e = 1 - Math.pow(1 - k, 3);
    shownS = from + (v - from) * e; draw(); renderReadouts();
    if (k < 1) tween = requestAnimationFrame(stepF); else { shownS = v; render(); }
  };
  tween = requestAnimationFrame(stepF);
}

/* ---------- 讀值 ---------- */
let prev = {};
function tick(id, v) { const n = $(id); if (prev[id] !== undefined && prev[id] !== v) { n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick'); } prev[id] = v; n.textContent = v; }
function renderReadouts() {
  const dev = device(), r = run(dev, Math.min(lengthOf(dev), Math.round(liveS())));
  tick('#r-force', r.force); tick('#r-rope', r.s); tick('#r-height', r.h);
  $('#r-force-note').textContent = dev === 'cmp' ? `10 N × ${r.H} ÷ ${r.L}` : dev === 'rough' ? `克服摩擦多 ${r.friction} N` : dev === 'ideal' ? '光滑：不計摩擦' : `直接提起要 ${WEIGHT} N`;
  $('#r-rope-note').textContent = `斜面長 ${r.L} cm`;
  $('#r-height-note').textContent = `坡頂高 ${r.H} cm`;
}

/* ---------- 余老師 ---------- */
function cmpHint() {
  const rs = cmpRecs(), sameH = rs.some(a => rs.some(b => a.H === b.H && a.L !== b.L)), sameL = rs.some(a => rs.some(b => a.L === b.L && a.H !== b.H));
  if (!sameH) return '再量一個「高度一樣、長度不同」的斜面，比比看拉力。';
  if (!sameL) return '再量一個「長度一樣、高度不同」的斜面，比比看拉力。';
  return rs.length < 3 ? '再多量一種組合。' : '比較表裡看出規律了嗎？';
}
function oops(t) { teacher.last = ''; teacher.say(t, { pose: 'think', tone: 'oops' }); lastNote = t; }
function talk() {
  if (lastNote) return;
  if (foundShown) {
    const f = TASK[foundShown].found;
    const action = foundShown === 'quiz' ? { label: '看成果 →', run: openFinish } : { label: '下一步 →', run: () => goStep(NEXT[foundShown]) };
    teacher.say(f[0], { pose: 'cheer', tone: 'found', tag: '發現時刻', eq: f[1], action }); return;
  }
  const step = S.step, done = S.done.includes(step), task = TASK[step];
  if (PULL.has(step)) {
    const dev = device(), L = lengthOf(dev), r = run(dev, Math.min(L, S.s));
    if (S.saved) {
      if (step === 'compare') { teacher.say(done ? '比較表看出規律了！可以按「下一步」，也可以再多量幾種。' : '收下了！' + cmpHint() + '（上面選新的長度或高度）', { pose: 'thumb' }); return; }
      if (step === 'friction' && !done) {
        const other = S.surface === 'ideal' ? 'rough' : 'ideal';
        teacher.say(`收下了！再換「${SHORT[other]}」，拉力會一樣嗎？`, { pose: 'thumb', action: { label: `換${SHORT[other]} →`, run: () => pickSurface(other) } });
      } else teacher.say(done ? '這一步完成了，按任務卡的「下一步」繼續。' : '已經收下了！', { pose: 'thumb' });
      return;
    }
    if (step === 'compare') {
      if (S.s === 0) teacher.say(cmpRecs().length ? cmpHint() : task.intro, { pose: 'point' });
      else teacher.say(`長 ${r.L} cm、高 ${r.H} cm：拉力 ${r.force} N。收下這次觀察，填進比較表。`, { pose: 'wow' });
      return;
    }
    if (S.s >= L) teacher.say(`到坡頂了！拉力 ${r.force} N，沿坡走了 ${L} cm，木箱升高 ${r.H} cm。收下這次觀察。`, { pose: 'cheer' });
    else if (S.s === 0) teacher.say(step === 'friction' ? (S.surface === 'ideal' ? '先拉光滑坡面。注意彈簧秤的讀數！' : '換成粗糙坡面了，看見紅色的摩擦力箭頭嗎？') : task.intro, { pose: 'point' });
    else teacher.say(`沿坡拉了 ${S.s} cm，木箱升高 ${r.h} cm。拉力一直是 ${r.force} N，繼續拉！`, { pose: 'point' });
    return;
  }
  if (step === 'calc') {
    const need = [...new Set(CALC[step].rows.flatMap(x => x.need))].filter(d => !hasRec(d));
    if (need.length) { teacher.say(`還少「${need.map(d => SHORT[d]).join('」「')}」的證據，先回去收下來。`, { pose: 'think' }); return; }
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
  const pullStep = PULL.has(S.step), calcStep = S.step === 'calc';
  $('#dock-pull').hidden = !pullStep; $('#dock-calc').hidden = !calcStep; $('#dock-quiz').hidden = S.step !== 'quiz';
  $('#surface-pick').hidden = S.step !== 'friction';
  $('#cmp-pick').hidden = S.step !== 'compare';
  $('#cmp-board').hidden = S.step !== 'compare';
  if (S.step === 'compare') renderCompare();
  for (const id of ['ideal', 'rough']) {
    const b = $('#pick-' + id); b.setAttribute('aria-pressed', String(S.surface === id));
    b.textContent = SHORT[id] + (hasRec(id) ? ' ✓' : '');
  }
  const L = lengthOf(device());
  $('#pull-1').disabled = $('#pull-5').disabled = !canPull() || S.s >= L;
  $('#save').classList.toggle('cue', pullStep && !S.saved && (S.step === 'compare' ? S.s > 0 : S.s >= L));
  if (calcStep) renderCalc();
  if (S.step === 'quiz') renderQuiz();
}
function renderCompare() {
  const seg = (box, list, cur, unit, set) => {
    box.className = 'seg' + (list.length === 3 ? ' three' : '');
    box.replaceChildren(...list.map(v => { const b = document.createElement('button'); b.type = 'button'; b.textContent = String(v); b.setAttribute('aria-label', `${v} ${unit}`); b.setAttribute('aria-pressed', String(v === cur)); b.addEventListener('click', () => set(v)); return b; }));
  };
  seg($('#pick-L'), LENGTHS, S.cmp.L, 'cm', v => pickCmp(v, S.cmp.H));
  seg($('#pick-H'), HEIGHTS, S.cmp.H, 'cm', v => pickCmp(S.cmp.L, v));
  const g = $('#cmp-grid');
  const head = '<thead><tr><th>高＼長</th>' + LENGTHS.map(L => `<th>${L} cm</th>`).join('') + '</tr></thead>';
  const body = HEIGHTS.map(H => `<tr><th>${H} cm</th>` + LENGTHS.map(L => {
    const got = hasCmp(L, H), now = L === S.cmp.L && H === S.cmp.H;
    return `<td class="${got ? 'got' : ''}${now ? ' now' : ''}">${got ? idealIncline(L, H, L).force : '？'}</td>`;
  }).join('') + '</tr>').join('');
  g.innerHTML = head + '<tbody>' + body + '</tbody>';
  g.setAttribute('aria-label', `比較表，已量 ${cmpRecs().length} 種組合`);
}
function pickCmp(L, H) {
  S.step = 'compare'; S.cmp = { L, H }; S.s = 0; S.saved = false; shownS = 0; foundShown = null; lastNote = null; warnedDown = false;
  save(); teacher.last = ''; render();
}
function pickSurface(id) {
  S.step = 'friction'; S.surface = id; S.s = 0; S.saved = false; shownS = 0; foundShown = null; lastNote = null; warnedDown = false;
  save(); teacher.last = ''; render();
}

/* ---------- 算一算 ---------- */
let calcBuilt = null;
function renderCalc() {
  const cfg = CALC[S.step]; $('#calc-head').textContent = cfg.head;
  const box = $('#calc-rows');
  if (calcBuilt !== S.step) {
    calcBuilt = S.step;
    box.replaceChildren(...cfg.rows.map(r => {
      const lab = document.createElement('label'); lab.className = 'calc-row'; lab.htmlFor = 'calc-' + r.id;
      lab.innerHTML = `<span class="calc-name"><b>${r.name}</b><span class="calc-eq">${r.eq()}</span></span><input id="calc-${r.id}" inputmode="decimal" autocomplete="off"><span>${r.unit}</span>`;
      lab.querySelector('input').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
      return lab;
    }));
  }
  for (const r of cfg.rows) {
    const inp = $('#calc-' + r.id), ok = r.need.every(hasRec);
    inp.disabled = !ok;
    if (document.activeElement !== inp) inp.value = S.calc[r.id] || '';
  }
  $('#check').disabled = !cfg.rows.every(r => r.need.every(hasRec));
}
const num = v => { const t = String(v).trim().replace(/[ＪjJ%％\s]/g, '').replace('，', '.').replace('．', '.'); return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN; };
function check() {
  const cfg = CALC[S.step], res = {};
  for (const r of cfg.rows) {
    const inp = $('#calc-' + r.id); S.calc[r.id] = inp.value; const v = num(inp.value);
    res[r.id] = Math.abs(v - r.answer) < 1e-9;
    inp.classList.toggle('ok', res[r.id]); inp.classList.toggle('bad', !res[r.id] && inp.value.trim() !== '');
  }
  save();
  if (cfg.rows.every(r => res[r.id])) {
    if (!S.done.includes(S.step)) S.done.push(S.step);
    foundShown = S.step; lastNote = null; save(); render(); return;
  }
  const w = cfg.rows.find(r => !res[r.id]), v = num($('#calc-' + w.id).value);
  let msg;
  if (Number.isNaN(v)) msg = `先在「${w.name}」那一格填數字。`;
  else if (Math.abs(v - w.F * w.cm) < 1e-9) msg = `${w.name}：${v} 是 N·cm。把 ${w.cm} cm 換成 ${(w.cm / 100).toFixed(2)} m 再乘。`;
  else msg = `${w.name}：${w.F} N × ${(w.cm / 100).toFixed(2)} m ＝ ？`;
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
  chips.replaceChildren(...want.map(r => {
    const li = document.createElement('li'); li.className = 'chip';
    li.innerHTML = r.device === 'cmp' ? `<small>#${r.n} 比一比</small><b>${cmpName(r)}</b><span class="res ok">拉力 ${r.force} N</span>` : `<small>#${r.n} ${SHORT[r.device]}</small><b>${r.force} N ｜ 沿坡 ${r.s} cm</b><span class="res ok">升高 ${r.h} cm</span>`;
    return li;
  }));
}
function keep() {
  if (!PULL.has(S.step)) return;
  const dev = device(), L = lengthOf(dev);
  if (S.saved) { blocked(); return; }
  if (S.step === 'compare') {
    if (S.s === 0) { oops('先往上拉一點，讀到拉力再收下。'); return; }
    if (hasCmp(S.cmp.L, S.cmp.H)) { oops('這個組合已經量過了，換一種長度或高度。'); return; }
  } else if (S.s < L) { oops(`先把木箱拉到坡頂再收下（現在 ${S.s} / ${L} cm）。`); return; }
  if (S.records.length >= 50) { oops('手冊滿 50 張了，清空紀錄才能再收。'); return; }
  const r = run(dev, L);
  const entry = { n: S.records.length + 1, device: dev, force: r.force, s: L, h: r.H, at: new Date().toISOString() };
  if (dev === 'cmp') { entry.L = r.L; entry.H = r.H; }
  S.records.push(entry);
  S.saved = true; lastNote = null;
  const rs = cmpRecs();
  const cmpDone = rs.length >= 3 && rs.some(a => rs.some(b => a.H === b.H && a.L !== b.L)) && rs.some(a => rs.some(b => a.L === b.L && a.H !== b.H));
  const stepDone = S.step === 'friction' ? hasRec('ideal') && hasRec('rough') : S.step === 'compare' ? cmpDone : true;
  if (stepDone && !S.done.includes(S.step)) { S.done.push(S.step); foundShown = S.step; }
  save();
  const target = isVisible($('#evidence')) ? $('#evidence') : $('#note-count');
  fly($('#save'), target, `${dev === 'cmp' ? cmpName(r) : SHORT[dev]} ${r.force} N`).then(() => { renderEvidence(); bump($('#note-count')); });
  render();
}
const isVisible = n => { const r = n.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };

/* ---------- 步驟 ---------- */
function goStep(id) {
  S.step = id; foundShown = null; lastNote = null; warnedDown = false;
  if (PULL.has(id)) { S.s = 0; S.saved = false; }
  if (id === 'friction') S.surface = hasRec('ideal') && !hasRec('rough') ? 'rough' : 'ideal';
  if (id === 'compare' && hasCmp(S.cmp.L, S.cmp.H)) { const next = HEIGHTS.flatMap(H => LENGTHS.map(L => ({ L, H }))).find(c => !hasCmp(c.L, c.H)); if (next) S.cmp = next; }
  if (id === 'quiz' && !S.done.includes('quiz')) S.quiz = { i: 0, pick: null };
  calcBuilt = null; shownS = S.s; save(); teacher.last = ''; render();
  if (narrow.matches) scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
}
function resetStep() {
  if (S.step === 'friction') { pickSurface(S.surface); return; }
  if (S.step === 'calc') CALC.calc.rows.forEach(r => delete S.calc[r.id]);
  if (S.step === 'quiz') S.quiz = { i: 0, pick: null };
  goStep(S.step);
}

/* ---------- 對話框 ---------- */
function openNotes() {
  const body = $('#notes-body'); body.replaceChildren();
  if (!S.records.length) { const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="5" class="notes-empty">還沒有證據。</td>'; body.append(tr); }
  for (const r of S.records) { const tr = document.createElement('tr'); tr.innerHTML = `<td>${r.n}</td><td>${r.device === 'cmp' ? cmpName(r) : SHORT[r.device]}</td><td><b>${r.force} N</b></td><td>${r.s} cm</td><td>${r.h} cm</td>`; body.append(tr); }
  $('#notes-dialog').showModal();
}
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#F4C04E" stroke="#23304A" stroke-width="1.2" stroke-linejoin="round"/></svg>';
function openFinish() {
  const got = STEPS.filter(s => S.done.includes(s.id)).length;
  $('#stars').innerHTML = STEPS.map(s => S.done.includes(s.id) ? STAR : STAR.replace('<svg', '<svg class="off"')).join('');
  $('#stars').setAttribute('aria-label', `完成 ${STEPS.length} 個任務中的 ${got} 個`);
  const line = d => { const r = rec(d); return r && (d === 'ideal' || d === 'rough' ? `<li><b>${SHORT[d]}</b>：拉力 ${r.force} N</li>` : `<li><b>${SHORT[d]}</b>：拉力 ${r.force} N，沿坡 ${r.s} cm → 功 ${r.force * r.s / 100} J</li>`); };
  $('#finish-list').innerHTML = ['short', 'long', 'ideal', 'rough'].map(line).filter(Boolean).join('') + (cmpRecs().length ? `<li><b>比一比</b>：量了 ${cmpRecs().length} 種長度與高度的組合</li>` : '');
  $('#finish-dialog').showModal();
}
function clearAll() {
  if (!confirm('要清空這一站的所有證據和進度，從第 1 步重新開始嗎？')) return;
  db.clear(); S = fresh(); shownS = 0; foundShown = null; lastNote = null; teacher.last = ''; calcBuilt = null;
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  render(); if (narrow.matches) scrollTo({ top: 0 });
}

/* ---------- 版面 ---------- */
const narrow = matchMedia('(max-width: 860px)');
function fitScene() {
  const d = device();
  const vb = narrow.matches
    ? { short: '120 140 740 380', long: '110 170 900 360', ideal: '110 50 790 490', rough: '110 50 790 490', cmp: '100 110 900 400' }[d]
    : { short: '150 140 770 410', long: '50 140 965 410', ideal: '100 30 820 520', rough: '100 30 820 520', cmp: '60 100 960 430' }[d];
  svg.setAttribute('viewBox', vb);
}
narrow.addEventListener?.('change', () => render());
function render() {
  renderSteps($('#steps'), STEPS, S.step, new Set(S.done), id => goStep(id));
  fitScene(); draw(); renderReadouts(); renderEvidence(); renderTask(); talk();
}

$('#pull-1').addEventListener('click', () => pull(5));
$('#pull-5').addEventListener('click', () => pull(20));
$('#pick-ideal').addEventListener('click', () => pickSurface('ideal'));
$('#pick-rough').addEventListener('click', () => pickSurface('rough'));
$('#save').addEventListener('click', keep);
$('#check').addEventListener('click', check);
$('#task-reset').addEventListener('click', resetStep);
$('#clear-records').addEventListener('click', clearAll);
$('#reset-all').addEventListener('click', clearAll);
$('#why').addEventListener('click', () => $('#why-dialog').showModal());
$('#open-notes').addEventListener('click', openNotes);
document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

render();
