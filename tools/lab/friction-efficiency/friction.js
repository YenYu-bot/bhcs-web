// 摩擦與機械效率實驗桌
// 光滑、粗糙坡面與 tools/friction-efficiency-desk/model.mjs 相同；砂紙坡面為新版加的第三種（見 model.mjs）。
import { derive, SURFACES, LENGTH_CM, HEIGHT_CM, WEIGHT_N } from './model.mjs';
import { $, Teacher, renderSteps, fly, bump, reduceMotion } from '../shared/lab.js';
import { openNotebook } from '../shared/notebook.mjs';

const NS = 'http://www.w3.org/2000/svg';
const P = '../../../assets/science/props/';
const db = await openNotebook('bhcs.lab.friction-efficiency.v1');
const NAME = { ideal: '光滑坡面', rough: '粗糙坡面', sand: '砂紙坡面' };
const pct = v => `${Math.round(v * 10) / 10}%`;

const STEPS = [
  { id: 'ideal', label: '光滑坡面' },
  { id: 'rough', label: '粗糙坡面' },
  { id: 'work', label: '算一算功' },
  { id: 'eff', label: '機械效率' },
  { id: 'sand', label: '砂紙坡面' },
  { id: 'quiz', label: '說說看' }
];
const NEXT = { ideal: 'rough', rough: 'work', work: 'eff', eff: 'sand', sand: 'quiz' };
const PULL = new Set(['ideal', 'rough', 'sand']);
const TASK = {
  ideal: { title: '光滑坡面：把木箱拉到坡頂', goal: '斜面長 100 cm、高 60 cm，坡面很光滑。沿著斜面拖曳黃色把手（或按「往上拉」），木箱到坡頂後收下觀察。',
    intro: '木箱重 10 N。沿著光滑的斜面拉，要多少力？看上面的能量帳怎麼長。',
    found: ['光滑坡面拉力 6 N。拉力做的功全部變成木箱的位能。', '拉力做的功 6 J ＝ 木箱增加的位能 6 J'] },
  rough: { title: '粗糙坡面：同一個木箱、同一個斜面', goal: '只把坡面換成粗糙的，其他都不變。再把木箱拉到坡頂，比較拉力和能量帳。',
    intro: '坡面變粗糙了。拉力會一樣嗎？注意紅色的摩擦力箭頭。',
    found: ['粗糙坡面要 8 N，多出 2 N 用來克服摩擦力。', '木箱一樣升高 60 cm，但拉力多做了功，變成熱'] },
  work: { title: '算一算：輸入功和有效功', goal: '功 ＝ 力 × 沿著力的方向移動的距離。距離先換成 m，答案用焦耳（J）。',
    intro: '拉力沿著斜面，要乘哪一段距離？木箱的位能，又要乘哪一段？',
    found: ['輸入功：光滑 6 J、粗糙 8 J；有效功都是 6 J。', '輸入功 ＝ 拉力 × 沿坡距離；有效功 ＝ 重量 × 升高'] },
  eff: { title: '算一算：機械效率', goal: '機械效率 ＝ 有效功 ÷ 輸入功 × 100%。先算粗糙坡面浪費了多少功，再算兩種坡面的效率。',
    intro: '輸入的功，有多少真的用來把木箱升高？',
    found: ['光滑坡面 100%，粗糙坡面只有 75%。', '8 J 裡有 6 J 變成位能、2 J 被摩擦變成熱：6 ÷ 8 ＝ 75%'] },
  sand: { title: '砂紙坡面：摩擦更大', goal: '先猜猜機械效率會怎樣，再把木箱沿砂紙坡面拉到坡頂，用證據檢查你的猜測。',
    intro: '坡面鋪上砂紙，摩擦更大了。先按上面的按鈕猜一猜！',
    found: ['砂紙坡面拉力 10 N，機械效率只剩 60%。', '摩擦越大，變成熱的功越多，機械效率越低'] },
  quiz: { title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。',
    intro: '最後三題！想想你的能量帳。',
    found: ['你算出機械效率了！', '機械效率 ＝ 有效功 ÷ 輸入功 × 100%，摩擦越大效率越低'] }
};
const QUIZ = [
  { q: '沿斜面拉木箱時，算「拉力做的功（輸入功）」要乘哪一段距離？', options: [
    { text: '垂直升高的 60 cm。', why: '60 cm 是算木箱增加的位能（有效功）用的。拉力沿著斜面，距離要用沿坡的 100 cm。' },
    { text: '沿著斜面移動的 100 cm。', ok: true },
    { text: '水平方向的 80 cm。', why: '拉力不是水平的。功要用「沿著力的方向」移動的距離：沿坡 100 cm。' }] },
  { q: '粗糙坡面比光滑坡面多做了 2 J 的功，這 2 J 到哪裡去了？', options: [
    { text: '消失了，所以效率變低。', why: '能量不會消失。克服摩擦做的功變成熱，木箱底部和坡面會變熱一點點。' },
    { text: '讓木箱升得更高。', why: '三種坡面木箱都升高 60 cm，增加的位能都是 6 J。' },
    { text: '克服摩擦，變成熱。', ok: true }] },
  { q: '怎樣能讓這個斜面的機械效率變高？', options: [
    { text: '在坡面上抹油、換光滑的板子，減少摩擦。', ok: true },
    { text: '鋪上砂紙，讓木箱比較不會滑下來。', why: '你的證據：砂紙坡面摩擦最大，效率只有 60%。' },
    { text: '拉快一點，早點拉到坡頂。', why: '摩擦力和拉的快慢無關，拉到坡頂一樣要克服 100 cm 的摩擦，生的熱不會變少。' }] }
];
const CALC = {
  work: { head: '功 ＝ 力 × 距離（距離換成 m）', rows: [
    { id: 'inIdeal', name: '光滑：拉力做的功', eq: '拉力 6 N × 沿坡 100 cm', need: ['ideal'], answer: 6, unit: 'J', F: 6, cm: 100, kind: 'input' },
    { id: 'inRough', name: '粗糙：拉力做的功', eq: '拉力 8 N × 沿坡 100 cm', need: ['rough'], answer: 8, unit: 'J', F: 8, cm: 100, kind: 'input' },
    { id: 'useful', name: '木箱增加的位能', eq: '重量 10 N × 升高 60 cm', need: ['ideal', 'rough'], answer: 6, unit: 'J', F: 10, cm: 60, kind: 'useful' }] },
  eff: { head: '機械效率 ＝ 有效功 ÷ 輸入功 × 100%', rows: [
    { id: 'heat', name: '粗糙：摩擦生熱', eq: '輸入功 8 J − 有效功 6 J', need: ['rough'], answer: 2, unit: 'J', kind: 'heat' },
    { id: 'effIdeal', name: '光滑：機械效率', eq: '6 J ÷ 6 J × 100%', need: ['ideal'], answer: 100, unit: '%', kind: 'eff', useful: 6, input: 6 },
    { id: 'effRough', name: '粗糙：機械效率', eq: '6 J ÷ 8 J × 100%', need: ['rough'], answer: 75, unit: '%', kind: 'eff', useful: 6, input: 8 }] }
};

/* ---------- 狀態 ---------- */
const fresh = () => ({ v: 1, step: 'ideal', s: 0, saved: false, guess: null, records: [], done: [], calc: {}, quiz: { i: 0, pick: null } });
function loadState() {
  const s = db.load();
  try {
    if (!s || s.v !== 1 || !STEPS.some(x => x.id === s.step) || !Number.isInteger(s.s) || s.s < 0 || s.s > LENGTH_CM) throw 0;
    if (!Array.isArray(s.records) || !Array.isArray(s.done) || !s.calc || typeof s.calc !== 'object' || !s.quiz || !Number.isInteger(s.quiz.i)) throw 0;
    if (!s.records.every(r => r && Object.hasOwn(SURFACES, r.device))) throw 0;
    if (s.guess !== null && !['up', 'same', 'down'].includes(s.guess)) throw 0;
    return s;
  } catch { return fresh(); }
}
let S = loadState(), shownS = S.s, foundShown = null, lastNote = null, dragging = null, warnedDown = false;
const save = () => db.save(S);
const device = () => PULL.has(S.step) ? S.step : S.step === 'quiz' ? 'sand' : 'rough';
const liveS = () => PULL.has(S.step) ? shownS : (hasRec(device()) ? LENGTH_CM : 0);
const hasRec = d => S.records.some(r => r.device === d);
const rec = d => S.records.find(r => r.device === d);

const svg = $('#scene'), rig = $('#rig');
const teacher = new Teacher($('#teacher-pic'), $('#bubble'), $('#live'));
const el = (tag, a = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (parent) parent.append(n); return n; };
const txt = (parent, x, y, s, a = {}) => { const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#23304A', ...a }, parent); t.textContent = s; return t; };

/* ---------- 斜面幾何（長 100 cm、高 60 cm，與斜面實驗桌的摩擦坡同尺寸） ---------- */
const BOX = 60, LEAD = 170, SC = 4.4, X0 = 240, Y0 = 500;
const G = (() => {
  const L = LENGTH_CM * SC, H = HEIGHT_CM * SC, base = Math.sqrt(L * L - H * H), th = Math.asin(HEIGHT_CM / LENGTH_CM);
  return { L, H, base, th, u: [Math.cos(th), -Math.sin(th)], nrm: [-Math.sin(th), -Math.cos(th)], B: [X0, Y0], T: [X0 + base, Y0 - H] };
})();
const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];

/* ---------- 場景 ---------- */
function defs() {
  const d = el('defs', {}, rig);
  const pt = el('pattern', { id: 'rough', width: 14, height: 14, patternUnits: 'userSpaceOnUse' }, d);
  el('rect', { width: 14, height: 14, fill: '#C9A46E' }, pt);
  el('circle', { cx: 3, cy: 4, r: 1.6, fill: '#8A6A3C' }, pt); el('circle', { cx: 10, cy: 9, r: 1.4, fill: '#8A6A3C' }, pt); el('circle', { cx: 6, cy: 12, r: 1.1, fill: '#A0814F' }, pt);
  const sp = el('pattern', { id: 'sand', width: 8, height: 8, patternUnits: 'userSpaceOnUse' }, d);
  el('rect', { width: 8, height: 8, fill: '#8C7B66' }, sp);
  for (const [x, y, r, f] of [[1.5, 2, 1.2, '#5E5143'], [5.5, 1.5, 1, '#B8A68C'], [3.5, 5.5, 1.3, '#4E4337'], [7, 6.5, .9, '#C9B79C'], [1, 7, .8, '#6D5F4F']]) el('circle', { cx: x, cy: y, r, fill: f }, sp);
  const mk = el('marker', { id: 'arrowR', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, d);
  el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#C8372D' }, mk);
}
function surfaceStroke(dev) { return dev === 'sand' ? { stroke: 'url(#sand)', w: 14 } : dev === 'rough' ? { stroke: 'url(#rough)', w: 12 } : { stroke: '#F1D3A1', w: 6 }; }
function drawLedger(r) {
  // 能量帳：上條＝拉力做的功（輸入功），下條＝位能（有效功）＋摩擦生熱。1 J ＝ 32 單位寬。
  const x = 106, y = 38, W = 32, bx = x + 22;
  const g = el('g', { 'aria-hidden': 'true' }, rig);
  el('rect', { x, y, width: 404, height: 154, rx: 18, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 2 }, g);
  txt(g, x + 20, y + 28, '能量帳', { 'text-anchor': 'start', 'font-size': 17, 'font-weight': 900 });
  txt(g, x + 386, y + 28, r.s > 0 ? `機械效率 ${pct(r.efficiency)}` : '機械效率 —', { 'text-anchor': 'end', 'font-size': 17, 'font-weight': 900, fill: '#2F6FB0' });
  // 刻度 0–10 J
  for (let j = 0; j <= 10; j += 2) {
    const tx = bx + j * W;
    el('line', { x1: tx, y1: y + 42, x2: tx, y2: y + 132, stroke: '#E4DACB', 'stroke-width': 1.5 }, g);
    txt(g, tx, y + 148, j === 10 ? '10 J' : String(j), { 'font-size': 12, fill: '#5A6478', 'font-weight': 700 });
  }
  const bar = (yy, w, fill) => el('rect', { x: bx, y: yy, width: Math.max(0, w), height: 26, rx: 6, fill }, g);
  txt(g, bx, y + 50, '拉力做的功（輸入功）', { 'text-anchor': 'start', 'font-size': 13, fill: '#5A6478' });
  bar(y + 56, r.input * W, '#E0A21B');
  txt(g, bx + r.input * W + 8, y + 75, `${r.input} J`, { 'text-anchor': 'start', 'font-size': 15, 'font-weight': 900 });
  txt(g, bx, y + 98, '位能（有效功）＋ 摩擦生熱', { 'text-anchor': 'start', 'font-size': 13, fill: '#5A6478' });
  bar(y + 104, r.useful * W, '#2F6FB0');
  if (r.heat > 0) el('rect', { x: bx + r.useful * W, y: y + 104, width: r.heat * W, height: 26, rx: 6, fill: '#E36B3A' }, g);
  const lab = r.heat > 0 ? `${r.useful} J ＋ ${r.heat} J` : `${r.useful} J`;
  txt(g, bx + r.input * W + 8, y + 123, lab, { 'text-anchor': 'start', 'font-size': 15, 'font-weight': 900 });
}
function draw() {
  const dev = device(), s = Math.round(liveS() * 10) / 10, si = Math.min(LENGTH_CM, Math.round(s));
  const r = derive(dev, si);
  const hadFocus = !!document.activeElement && rig.contains(document.activeElement);
  rig.replaceChildren(); defs();
  drawLedger(r);
  // 斜面本體與坡頂平台
  el('path', { d: `M ${G.B[0] - 30} ${G.B[1]} L ${G.T[0]} ${G.T[1]} L ${G.T[0] + 130} ${G.T[1]} L ${G.T[0] + 130} ${G.B[1]} Z`, fill: '#D9A867', stroke: '#23304A', 'stroke-width': 4, 'stroke-linejoin': 'round' }, rig);
  el('rect', { x: G.T[0], y: G.T[1], width: 130, height: G.B[1] - G.T[1], fill: '#C48E4C', stroke: '#23304A', 'stroke-width': 4 }, rig);
  const sf = surfaceStroke(dev);
  el('line', { x1: G.B[0], y1: G.B[1], x2: G.T[0], y2: G.T[1], stroke: sf.stroke, 'stroke-width': sf.w, 'stroke-linecap': 'round' }, rig);
  el('line', { x1: G.B[0] - 60, y1: G.B[1], x2: G.T[0] + 160, y2: G.B[1], stroke: '#23304A', 'stroke-width': 4 }, rig);
  const tick = (p, label) => { const a = add(p, G.nrm, -2), b = add(p, G.nrm, -18); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#23304A', 'stroke-width': 3 }, rig); const t = add(p, G.nrm, -34); txt(rig, t[0], t[1] + 5, label, { 'font-size': 13, fill: '#5A6478' }); };
  tick(G.B, '起點'); tick(G.T, '坡頂');
  const mid = add(add(G.B, G.u, G.L / 2), G.nrm, -44), deg = -G.th * 180 / Math.PI;
  txt(rig, mid[0], mid[1] + 5, `${NAME[dev]}・斜面長 ${LENGTH_CM} cm`, { 'font-size': 15, fill: '#5A6478', transform: `rotate(${deg.toFixed(1)} ${mid[0]} ${mid[1]})` });
  // 高度尺
  const rx = G.T[0] + 160;
  el('rect', { x: rx - 6, y: G.T[1] - 8, width: 12, height: G.H + 16, rx: 4, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 2 }, rig);
  for (let c = 0; c <= HEIGHT_CM; c += 10) { const y = G.B[1] - c * SC; el('line', { x1: rx - 6, y1: y, x2: rx + 6, y2: y, stroke: '#23304A', 'stroke-width': 2 }, rig); txt(rig, rx + 26, y + 5, String(c), { 'font-size': 13, fill: '#5A6478' }); }
  txt(rig, rx + 26, G.T[1] - 18, '高 cm', { 'font-size': 13, fill: '#5A6478' });
  const hy = G.B[1] - r.h * SC;
  el('path', { d: `M ${rx - 8} ${hy} l -12 -7 v 14 z`, fill: '#C8372D' }, rig);
  // 木箱
  const foot = add(G.B, G.u, s * SC), c = add(foot, G.nrm, BOX / 2);
  el('line', { x1: foot[0], y1: hy, x2: rx - 8, y2: hy, stroke: '#C8372D', 'stroke-width': 2, 'stroke-dasharray': '6 6', opacity: 0.6 }, rig);
  // 摩擦生熱：木箱底下冒熱氣（摩擦越大越多）
  if (r.friction > 0 && si > 0) {
    const n = r.friction / 2 + 1;
    const f = q => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const p = add(foot, G.u, -BOX / 2 - 12 - i * 16), up = k => add(p, G.nrm, k);
      el('path', { class: 'heat', d: `M ${f(p)} Q ${f(add(up(9), G.u, 6))} ${f(up(18))} Q ${f(add(up(26), G.u, -6))} ${f(up(34))}`, fill: 'none', stroke: '#E36B3A', 'stroke-width': 3, 'stroke-linecap': 'round', style: `animation-delay:${i * 0.25}s` }, rig);
    }
  }
  const bg = el('g', { transform: `translate(${c[0].toFixed(1)} ${c[1].toFixed(1)}) rotate(${deg.toFixed(2)})` }, rig);
  el('image', { href: P + 'prop-wooden-crate.webp', x: -BOX / 2, y: -BOX / 2, width: BOX, height: BOX }, bg);
  el('rect', { x: -24, y: -12, width: 48, height: 24, rx: 12, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 2 }, bg);
  txt(bg, 0, 6, `${WEIGHT_N} N`, { 'font-size': 14, 'font-weight': 900 });
  // 摩擦力箭頭（沿坡向下）
  if (r.friction > 0 && si < LENGTH_CM) {
    const a1 = add(add(foot, G.u, -BOX / 2 - 4), G.nrm, 8), a2 = add(a1, G.u, -24 * r.friction);
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
  const hg = el('g', { class: 'handle', tabindex: 0, role: 'slider', 'aria-label': '拉繩把手，沿斜面往上拉', 'aria-valuemin': 0, 'aria-valuemax': LENGTH_CM, 'aria-valuenow': si, 'aria-valuetext': `沿斜面拉了 ${si} 公分` }, rig);
  el('circle', { class: 'handle-ring', cx: hand[0], cy: hand[1], r: 28, fill: 'none', stroke: '#E0A21B', 'stroke-width': 4 }, hg);
  el('circle', { cx: hand[0], cy: hand[1], r: 19, fill: '#F4C04E', stroke: '#23304A', 'stroke-width': 3 }, hg);
  txt(hg, hand[0], hand[1] + 6, '↗', { 'font-size': 18, 'font-weight': 900 });
  el('circle', { cx: hand[0], cy: hand[1], r: 46, fill: 'transparent' }, hg);
  if (canPull() && si < LENGTH_CM) {
    hg.classList.add('cue');
    const lt = add(hand, G.nrm, 44); txt(rig, lt[0], lt[1], '沿斜面往上拉', { 'font-size': 16, 'font-weight': 900, fill: '#C8372D' });
  }
  bindHandle(hg);
  if (hadFocus) hg.focus({ preventScroll: true });
}

/* ---------- 拉動 ---------- */
function toSvg(e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
function sFromPointer(p) {
  const origin = add(add(G.B, G.nrm, BOX / 2), G.u, BOX / 2 + LEAD);  // s = 0 時把手的位置
  return ((p.x - origin[0]) * G.u[0] + (p.y - origin[1]) * G.u[1]) / SC;
}
const needGuess = () => S.step === 'sand' && !S.guess;
const canPull = () => PULL.has(S.step) && !S.saved && !needGuess();
function bindHandle(node) {
  node.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    if (!canPull()) { blocked(); return; }
    e.preventDefault(); dragging = { id: e.pointerId };
    document.body.classList.add('dragging');
  });
  node.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowRight'].includes(e.key)) { e.preventDefault(); pull(e.shiftKey ? 50 : 10); }
  });
}
addEventListener('pointermove', e => {
  if (!dragging || dragging.id !== e.pointerId) return;
  e.preventDefault();
  let s = sFromPointer(toSvg(e));
  if (s < S.s - 1 && !warnedDown) { warnedDown = true; oops('這個實驗只往上拉；想重來，按任務卡的「重來這一步」。'); }
  s = Math.max(S.s, Math.min(LENGTH_CM, s));
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
  else if (needGuess()) oops('先在下面選一個猜測，再拉木箱。');
  else if (S.saved) oops('這一輪已經收下了。想再拉一次，按「重來這一步」。');
}
function pull(cm) { if (!canPull()) { blocked(); return; } setS(Math.min(LENGTH_CM, S.s + cm), true); }
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
const prev = {};
function tickNum(id, v) { const n = $(id); if (prev[id] !== undefined && prev[id] !== v) { n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick'); } prev[id] = v; n.textContent = v; }
function renderReadouts() {
  const dev = device(), r = derive(dev, Math.min(LENGTH_CM, Math.round(liveS())));
  tickNum('#r-force', r.force); tickNum('#r-rope', r.s); tickNum('#r-height', r.h);
  $('#r-force-note').textContent = r.friction ? `6 N ＋ 摩擦 ${r.friction} N` : '光滑：沒有摩擦';
}

/* ---------- 余老師 ---------- */
function oops(t) { teacher.last = ''; teacher.say(t, { pose: 'think', tone: 'oops' }); lastNote = t; }
const GUESS = { up: '比 75% 高', same: '一樣 75%', down: '比 75% 低' };
function talk() {
  if (lastNote) return;
  if (foundShown) {
    const f = TASK[foundShown].found;
    const action = foundShown === 'quiz' ? { label: '看成果 →', run: openFinish } : { label: '下一步 →', run: () => goStep(NEXT[foundShown]) };
    let text = f[0];
    if (foundShown === 'sand' && S.guess) text = (S.guess === 'down' ? '猜對了！' : `你猜「${GUESS[S.guess]}」，證據說不是。`) + text;
    teacher.say(text, { pose: 'cheer', tone: 'found', tag: '發現時刻', eq: f[1], action }); return;
  }
  const step = S.step, done = S.done.includes(step), task = TASK[step];
  if (PULL.has(step)) {
    const r = derive(step, Math.min(LENGTH_CM, S.s));
    if (S.saved) { teacher.say(done ? '這一步完成了，按任務卡的「下一步」繼續。' : '已經收下了！', { pose: 'thumb' }); return; }
    if (needGuess()) { teacher.say(task.intro, { pose: 'think' }); return; }
    if (S.s >= LENGTH_CM) teacher.say(`到坡頂了！拉力 ${r.force} N，拉力做了 ${r.input} J 的功，其中 ${r.useful} J 變成位能${r.heat ? `、${r.heat} J 變成熱` : ''}。收下這次觀察。`, { pose: 'cheer' });
    else if (S.s === 0) teacher.say(step === 'sand' ? `你猜「${GUESS[S.guess]}」。拉上去看看！` : task.intro, { pose: 'point' });
    else teacher.say(r.heat ? `拉了 ${S.s} cm：輸入 ${r.input} J，位能 ${r.useful} J，熱 ${r.heat} J。橘色那段就是摩擦生的熱！` : `拉了 ${S.s} cm：輸入 ${r.input} J，全部變成位能 ${r.useful} J。繼續拉！`, { pose: 'point' });
    return;
  }
  if (CALC[step]) {
    const need = [...new Set(CALC[step].rows.flatMap(x => x.need))].filter(d => !hasRec(d));
    if (need.length) { teacher.say(`還少「${need.map(d => NAME[d]).join('」「')}」的證據，先回去收下來。`, { pose: 'think' }); return; }
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
  const pullStep = PULL.has(S.step), calcStep = !!CALC[S.step];
  $('#dock-pull').hidden = !pullStep; $('#dock-calc').hidden = !calcStep; $('#dock-quiz').hidden = S.step !== 'quiz';
  $('#guess').hidden = S.step !== 'sand';
  for (const b of document.querySelectorAll('[data-guess]')) { b.setAttribute('aria-pressed', String(S.guess === b.dataset.guess)); b.disabled = S.step === 'sand' && S.s > 0; }
  $('#pull-1').disabled = $('#pull-5').disabled = !canPull() || S.s >= LENGTH_CM;
  $('#save').classList.toggle('cue', pullStep && !S.saved && S.s >= LENGTH_CM);
  if (calcStep) renderCalc();
  if (S.step === 'quiz') renderQuiz();
}
function pickGuess(g) {
  if (S.step !== 'sand' || S.s > 0) return;
  S.guess = g; lastNote = null; save(); teacher.last = ''; render();
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
      lab.innerHTML = `<span class="calc-name"><b>${r.name}</b><span class="calc-eq">${r.eq}</span></span><input id="calc-${r.id}" inputmode="decimal" autocomplete="off"><span>${r.unit}</span>`;
      lab.querySelector('input').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
      return lab;
    }));
  }
  for (const r of cfg.rows) {
    const inp = $('#calc-' + r.id);
    inp.disabled = !r.need.every(hasRec);
    if (document.activeElement !== inp) inp.value = S.calc[r.id] || '';
  }
  $('#check').disabled = !cfg.rows.every(r => r.need.every(hasRec));
}
const num = v => { const t = String(v).trim().replace(/[ＪjJ%％\s]/g, '').replace('，', '.').replace('．', '.'); return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN; };
const near = (a, b) => Math.abs(a - b) < 1e-6;
function hintFor(w, v) {
  if (Number.isNaN(v)) return `先在「${w.name}」那一格填數字。`;
  if (w.kind === 'input' || w.kind === 'useful') {
    const m = w.cm / 100;
    if (near(v, w.F * w.cm)) return `${w.name}：${v} 是 N·cm。把 ${w.cm} cm 換成 ${m.toFixed(1)} m 再乘。`;
    if (w.kind === 'input' && (near(v, w.F * 0.6) || near(v, w.F * 0.8))) return '拉力是沿著斜面拉的，距離要用沿坡的 100 cm（1 m），不是升高或水平距離。';
    if (w.kind === 'useful' && (near(v, 10) || near(v, 8))) return '位能看「升高了多少」：重量 10 N × 垂直升高 0.6 m。';
    return `${w.name}：${w.F} N × ${m.toFixed(1)} m ＝ ？`;
  }
  if (w.kind === 'heat') return near(v, 14) ? '是相減，不是相加：輸入功裡扣掉變成位能的部分，剩下的變成熱。' : '摩擦生熱 ＝ 輸入功 − 有效功 ＝ 8 J − 6 J。';
  if (near(v, w.useful / w.input)) return `${v} 再乘 100%，寫成百分比。`;
  if (near(Math.round(v * 100) / 100, Math.round(w.input / w.useful * 10000) / 100)) return '分子分母放反了：有效功（6 J）放上面，輸入功放下面。';
  return `${w.name}：${w.useful} ÷ ${w.input} × 100% ＝ ？`;
}
function check() {
  const cfg = CALC[S.step], res = {};
  for (const r of cfg.rows) {
    const inp = $('#calc-' + r.id); S.calc[r.id] = inp.value;
    res[r.id] = near(num(inp.value), r.answer);
    inp.classList.toggle('ok', res[r.id]); inp.classList.toggle('bad', !res[r.id] && inp.value.trim() !== '');
  }
  save();
  if (cfg.rows.every(r => res[r.id])) {
    if (!S.done.includes(S.step)) S.done.push(S.step);
    foundShown = S.step; lastNote = null; save(); render(); return;
  }
  const w = cfg.rows.find(r => !res[r.id]);
  oops(hintFor(w, num($('#calc-' + w.id).value)));
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
    li.innerHTML = `<small>#${r.n} ${NAME[r.device]}</small><b>${r.force} N ｜ 輸入功 ${r.input} J</b><span class="res ok">位能 ${r.useful} J${r.heat ? `＋熱 ${r.heat} J` : ''}</span>`;
    return li;
  }));
}
function keep() {
  if (!PULL.has(S.step)) return;
  if (S.saved || needGuess()) { blocked(); return; }
  if (S.s < LENGTH_CM) { oops(`先把木箱拉到坡頂再收下（現在 ${S.s} / ${LENGTH_CM} cm）。`); return; }
  if (S.records.length >= 50) { oops('手冊滿 50 張了，清空紀錄才能再收。'); return; }
  const dev = S.step, r = derive(dev, LENGTH_CM);
  S.records.push({ n: S.records.length + 1, device: dev, force: r.force, s: LENGTH_CM, h: r.h, input: r.input, useful: r.useful, heat: r.heat, eff: r.efficiency, at: new Date().toISOString() });
  S.saved = true; lastNote = null;
  if (!S.done.includes(dev)) { S.done.push(dev); foundShown = dev; }
  save();
  const target = isVisible($('#evidence')) ? $('#evidence') : $('#note-count');
  fly($('#save'), target, `${NAME[dev]} ${r.force} N`).then(() => { renderEvidence(); bump($('#note-count')); });
  render();
}
const isVisible = n => { const r = n.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };

/* ---------- 步驟 ---------- */
function goStep(id) {
  S.step = id; foundShown = null; lastNote = null; warnedDown = false;
  if (PULL.has(id)) { S.s = 0; S.saved = false; }
  if (id === 'quiz' && !S.done.includes('quiz')) S.quiz = { i: 0, pick: null };
  calcBuilt = null; shownS = S.s; save(); teacher.last = ''; render();
  if (narrow.matches) scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
}
function resetStep() {
  if (CALC[S.step]) CALC[S.step].rows.forEach(r => delete S.calc[r.id]);
  if (S.step === 'quiz') S.quiz = { i: 0, pick: null };
  if (S.step === 'sand') S.guess = null;
  goStep(S.step);
}

/* ---------- 對話框 ---------- */
function openNotes() {
  const body = $('#notes-body'); body.replaceChildren();
  if (!S.records.length) { const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="6" class="notes-empty">還沒有證據。</td>'; body.append(tr); }
  for (const r of S.records) { const tr = document.createElement('tr'); tr.innerHTML = `<td>${r.n}</td><td>${NAME[r.device]}</td><td><b>${r.force} N</b></td><td>${r.input} J</td><td>${r.useful} J</td><td>${r.heat} J</td>`; body.append(tr); }
  $('#notes-dialog').showModal();
}
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#F4C04E" stroke="#23304A" stroke-width="1.2" stroke-linejoin="round"/></svg>';
function openFinish() {
  const got = STEPS.filter(s => S.done.includes(s.id)).length;
  $('#stars').innerHTML = STEPS.map(s => S.done.includes(s.id) ? STAR : STAR.replace('<svg', '<svg class="off"')).join('');
  $('#stars').setAttribute('aria-label', `完成 ${STEPS.length} 個任務中的 ${got} 個`);
  $('#finish-list').innerHTML = ['ideal', 'rough', 'sand'].map(d => { const r = rec(d); return r && `<li><b>${NAME[d]}</b>：拉力 ${r.force} N，輸入功 ${r.input} J，有效功 ${r.useful} J → 機械效率 ${pct(r.eff)}</li>`; }).filter(Boolean).join('');
  $('#finish-dialog').showModal();
}
let resettingNotebook = false;
async function clearAll() {
  if (resettingNotebook) return;
  if (!confirm('要清空這一站的所有證據和進度，從第 1 步重新開始嗎？')) return;
  resettingNotebook = true;
  let cleared;
  try { cleared = await db.clear(); }
  finally { resettingNotebook = false; }
  if (!cleared) return;
  cancelAnimationFrame(tween); dragging = null; document.body.classList.remove('dragging');
  S = fresh(); shownS = 0; foundShown = null; lastNote = null; teacher.last = ''; calcBuilt = null;
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  render(); if (narrow.matches) scrollTo({ top: 0 });
}

/* ---------- 版面 ---------- */
const narrow = matchMedia('(max-width: 860px)');
function fitScene() { svg.setAttribute('viewBox', narrow.matches ? '96 28 810 512' : '86 24 850 526'); }
narrow.addEventListener?.('change', () => render());
function render() {
  renderSteps($('#steps'), STEPS, S.step, new Set(S.done), id => goStep(id));
  fitScene(); draw(); renderReadouts(); renderEvidence(); renderTask(); talk();
}

$('#pull-1').addEventListener('click', () => pull(10));
$('#pull-5').addEventListener('click', () => pull(50));
document.querySelectorAll('[data-guess]').forEach(b => b.addEventListener('click', () => pickGuess(b.dataset.guess)));
$('#save').addEventListener('click', keep);
$('#check').addEventListener('click', check);
$('#task-reset').addEventListener('click', resetStep);
$('#clear-records').addEventListener('click', clearAll);
$('#reset-all').addEventListener('click', clearAll);
$('#why').addEventListener('click', () => $('#why-dialog').showModal());
$('#open-notes').addEventListener('click', openNotes);
document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

render();
