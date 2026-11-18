// 彈簧與摩擦實驗桌（新版實驗桌設計）
// 數值用 ./model.mjs：算式同 scripts/science/models.mjs，g 取 10（1 公斤重 ＝ 10 N）。
import { spring, friction, LIMIT_CM, BLOCK_KG, EXTRA_KG, FACES, G } from './model.mjs';
import { $, Teacher, renderSteps, fly, bump, reduceMotion } from '../shared/lab.js';
import { openNotebook } from '../shared/notebook.mjs';

const NS = 'http://www.w3.org/2000/svg';
const P = '../../../assets/science/props/';
const db = await openNotebook('bhcs.lab.spring-friction.v1');
const n1 = x => String(Math.round(x * 10) / 10);

const STEPS = [
  { id: 'spring', label: '掛砝碼' },
  { id: 'limit', label: '掛太多' },
  { id: 'static', label: '拉不動' },
  { id: 'slip', label: '開始滑' },
  { id: 'normal', label: '加重' },
  { id: 'area', label: '翻面' },
  { id: 'quiz', label: '說說看' }
];
const NEXT = { spring: 'limit', limit: 'static', static: 'slip', slip: 'normal', normal: 'area', area: 'quiz' };
const SPRING_STEPS = new Set(['spring', 'limit']), PULL_STEPS = new Set(['static', 'slip']), CMP_STEPS = new Set(['normal', 'area']);
const VARIANTS = {
  normal: [{ id: 'light', name: '木塊 2 kg', kg: BLOCK_KG, face: 'wide' }, { id: 'heavy', name: '木塊＋砝碼 4 kg', kg: BLOCK_KG + EXTRA_KG, face: 'wide' }],
  area: [{ id: 'wide', name: FACES.wide.name, kg: BLOCK_KG, face: 'wide' }, { id: 'narrow', name: FACES.narrow.name, kg: BLOCK_KG, face: 'narrow' }]
};
const RANGE = { spring: [0, 1], limit: [1, 2], static: [0, 5], slip: [5, 7] };
const TASK = {
  spring: { title: '掛砝碼，量伸長', goal: '按右邊的砝碼盤（或「掛上一個」），每次掛 0.5 kg。掛 0.5 kg 和 1.0 kg 時各收下一次。伸長從綠色的原長線量起。',
    intro: '這條彈簧還沒掛東西。綠線是原長，等一下都從這裡量。',
    found: ['拉力加倍，伸長也加倍：5 N 伸長 10 cm，10 N 伸長 20 cm。', '彈性限度內，伸長量和受力成正比：每 1 N 伸長 2 cm'] },
  limit: { title: '一直掛下去會怎樣？', goal: '繼續掛到 2.0 kg（拉力 20 N），看伸長有沒有超過 30 cm 的彈性限度，再收下。',
    intro: '每 1 N 伸長 2 cm，那 20 N 會伸長 40 cm 嗎？掛掛看！',
    found: ['超過彈性限度了！伸長量和受力不再成正比。', '超過限度，不能再用「每 1 N 伸長 2 cm」推算；彈簧也可能回不到原長'] },
  static: { title: '拉了，木塊卻沒動', goal: '往右拖彈簧秤的把手（或按「拉力 +1 N」）。木塊還沒動時，選兩個不同的拉力各收下一次。',
    intro: '木塊 2 kg，放在桌上。用彈簧秤水平拉它，先輕輕拉。',
    found: ['木塊沒動時，摩擦力跟著拉力一起變大。', '靜摩擦力 ＝ 拉力，方向相反'] },
  slip: { title: '拉到木塊開始滑', goal: '繼續加大拉力。拉到 6 N 時收下一次；再加到 7 N，看木塊滑動時再收下一次。',
    intro: '摩擦力會一直跟著變大嗎？慢慢加大拉力，注意木塊什麼時候動。',
    found: ['最大靜摩擦是 6 N；一滑動，摩擦力降成 4 N。', '動摩擦力比最大靜摩擦力小'] },
  normal: { title: '木塊上加 2 kg 砝碼', goal: '接觸面不變。先選「木塊 2 kg」，按「慢慢拉到滑動」再收下；再換「木塊＋砝碼 4 kg」做一次。',
    intro: '在木塊上加砝碼，桌面要撐的力變大了。摩擦力會怎樣？',
    found: ['正向力加倍，最大靜摩擦也加倍：6 N → 12 N。', '正向力越大，摩擦力越大'] },
  area: { title: '翻面：接觸面積變小', goal: '同一個木塊，先寬面朝下拉一次收下，再翻成窄面朝下拉一次收下。正向力都是 20 N。',
    intro: '接觸面積變小，摩擦力也會變小嗎？用同一個木塊試試。',
    found: ['接觸面積減半，最大靜摩擦還是 6 N，動摩擦還是 4 N。', '正向力和材質相同時，摩擦力和接觸面積無關'] },
  quiz: { title: '說說看：用證據回答', goal: '五題都答對就完成。答錯沒關係，余老師會說明原因。',
    intro: '最後五題！想想你收下的證據。',
    found: ['你找到彈力和摩擦力的規律了！', '彈性限度內：伸長 ∝ 受力；靜摩擦 ≤ 最大靜摩擦；動摩擦較小'] }
};
const QUIZ = [
  { q: '同一條彈簧，砝碼從 0.5 kg 換成 1.0 kg，伸長量怎麼變？', options: [
    { text: '加倍：10 cm → 20 cm', ok: true },
    { text: '不變，還是 10 cm', why: '你的證據：0.5 kg 伸長 10 cm、1.0 kg 伸長 20 cm。受力加倍，伸長也加倍。' },
    { text: '變成四倍：40 cm', why: '彈性限度內伸長和受力成正比，受力 2 倍、伸長也是 2 倍，不是 4 倍。' }] },
  { q: '木塊一直沒動，拉力從 2 N 加到 5 N，摩擦力怎麼變？', options: [
    { text: '一直是 2 N。', why: '靜摩擦力會跟著拉力變：拉 5 N 時摩擦力也是 5 N，方向相反，木塊才不動。' },
    { text: '也變成 5 N，方向和拉力相反。', ok: true },
    { text: '變成 0，因為木塊沒動。', why: '木塊沒動是因為摩擦力和拉力抵消，不是沒有摩擦力。' }] },
  { q: '拉力從 6 N 加到 7 N，木塊開始滑動。滑動時摩擦力是多少？', options: [
    { text: '7 N，和拉力一樣。', why: '滑動時是動摩擦力，不再跟著拉力變。你的證據是 4 N。' },
    { text: '6 N，維持最大靜摩擦。', why: '6 N 是最大靜摩擦；滑動後變成動摩擦 4 N，比較小。' },
    { text: '4 N，動摩擦比最大靜摩擦小。', ok: true }] },
  { q: '木塊上加砝碼，正向力從 20 N 變成 40 N。最大靜摩擦怎麼變？', options: [
    { text: '不變，因為接觸面一樣。', why: '你的證據：正向力加倍，最大靜摩擦從 6 N 變成 12 N。' },
    { text: '加倍：6 N → 12 N。', ok: true },
    { text: '減半，因為比較重拉不動。', why: '比較重是更難拉動，需要的拉力變大，所以最大靜摩擦變大。' }] },
  { q: '同一個木塊從寬面換成窄面朝下，最大靜摩擦怎麼變？', options: [
    { text: '不變，還是 6 N。', ok: true },
    { text: '跟著接觸面積減半，變 3 N。', why: '你的證據：寬面、窄面都是 6 N。正向力和材質沒變，摩擦力就不變。' },
    { text: '變大，因為壓得比較集中。', why: '接觸面積變小，但正向力還是 20 N，摩擦力不變。' }] }
];

/* ---------- 狀態 ---------- */
const fresh = () => ({ v: 1, step: 'spring', kg: 0, pull: 0, variant: 0, scanned: false, records: [], done: [], quiz: { i: 0, pick: null } });
function loadState() {
  const s = db.load();
  try {
    if (!s || s.v !== 1 || !STEPS.some(x => x.id === s.step) || !Array.isArray(s.records) || !Array.isArray(s.done) || !s.quiz) throw 0;
    if (![s.kg, s.pull].every(Number.isFinite) || ![0, 1].includes(s.variant) || typeof s.scanned !== 'boolean') throw 0;
    const r = RANGE[s.step];
    if (r && SPRING_STEPS.has(s.step) && (s.kg < r[0] || s.kg > r[1])) throw 0;
    if (r && PULL_STEPS.has(s.step) && (s.pull < r[0] || s.pull > r[1])) throw 0;
    return s;
  } catch { return fresh(); }
}
let S = loadState(), foundShown = null, lastNote = null, anim = null, shownPull = S.pull, slideK = S.pull > 0 && cur().kind === 'moving' ? 1 : 0;
const save = () => db.save(S);
const isSpring = () => SPRING_STEPS.has(S.step), isPull = () => PULL_STEPS.has(S.step), isCmp = () => CMP_STEPS.has(S.step);
const isLab = () => isSpring() || isPull() || isCmp();
const variant = () => isCmp() ? VARIANTS[S.step][S.variant] : { kg: BLOCK_KG, face: 'wide', name: '木塊 2 kg' };
function cur() {
  if (SPRING_STEPS.has(S.step)) return spring(S.kg);
  const v = CMP_STEPS.has(S.step) ? VARIANTS[S.step][S.variant] : { kg: BLOCK_KG };
  return friction({ massKg: v.kg, pull: S.pull });
}
const recs = (step, pred = () => true) => S.records.filter(r => r.step === step && pred(r));

const svg = $('#scene'), rig = $('#rig');
const teacher = new Teacher($('#teacher-pic'), $('#bubble'), $('#live'));
const el = (tag, a = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (parent) parent.append(n); return n; };
const txt = (parent, x, y, s, a = {}) => { const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#23304A', ...a }, parent); t.textContent = s; return t; };
const arrow = (parent, x1, y, x2, color, label, below = false) => {
  if (Math.abs(x2 - x1) < 2) return;
  const d = Math.sign(x2 - x1);
  el('line', { x1, y1: y, x2: x2 - d * 10, y2: y, stroke: color, 'stroke-width': 6, 'stroke-linecap': 'round' }, parent);
  el('path', { d: `M ${x2} ${y} L ${x2 - d * 16} ${y - 10} L ${x2 - d * 16} ${y + 10} Z`, fill: color }, parent);
  if (label) txt(parent, x2 + d * 8, y + 5, label, { 'font-size': 15, 'font-weight': 900, fill: color, 'text-anchor': d > 0 ? 'start' : 'end' });
};

/* ---------- 場景：彈簧 ---------- */
const SP = { x: 700, top: 130, L0: 100, pxcm: 3.2 }; SP.y0 = SP.top + SP.L0;
const RULER = { x: 770 };
const TRAY = { x: 880, y: 470 };
function weightImg(parent, x, y, withHook, w = 44) {
  const h = w * 512 / 249;
  if (withHook) { el('image', { href: P + 'prop-hanging-weight.webp', x: x - w / 2, y, width: w, height: h }, parent); return h; }
  const ch = h * 0.58;   // 只取圓柱部分
  const box = el('svg', { x: x - w / 2, y, width: w, height: ch, viewBox: '0 215 249 297', preserveAspectRatio: 'none' }, parent);
  el('image', { href: P + 'prop-hanging-weight.webp', x: 0, y: 0, width: 249, height: 512 }, box);
  return ch;
}
function drawSpring() {
  const m = spring(S.kg), over = m.over, shownX = over ? LIMIT_CM + 8 : m.x, yEnd = SP.y0 + shownX * SP.pxcm;
  // 支架
  el('rect', { x: 560, y: 100, width: 14, height: 470, rx: 5, fill: '#8896A5', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: 500, y: 560, width: 170, height: 22, rx: 6, fill: '#3E6C9A', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: 560, y: SP.top - 14, width: 160, height: 14, rx: 5, fill: '#8896A5', stroke: '#23304A', 'stroke-width': 3 }, rig);
  // 尺
  const r0 = SP.y0, r1 = SP.y0 + 40 * SP.pxcm;
  el('rect', { x: RULER.x - 4, y: r0 - 14, width: 52, height: r1 - r0 + 28, rx: 6, fill: '#FFF6DA', stroke: '#23304A', 'stroke-width': 2.5 }, rig);
  el('rect', { x: RULER.x - 2, y: r0 + LIMIT_CM * SP.pxcm, width: 48, height: 10 * SP.pxcm, fill: 'rgba(200,55,45,.15)' }, rig);
  for (let c = 0; c <= 40; c += 5) {
    const y = r0 + c * SP.pxcm, major = c % 10 === 0;
    el('line', { x1: RULER.x, y1: y, x2: RULER.x + (major ? 18 : 11), y2: y, stroke: c === LIMIT_CM ? '#C8372D' : '#23304A', 'stroke-width': c === LIMIT_CM ? 3 : 2 }, rig);
    if (major) txt(rig, RULER.x + 33, y + 5, String(c), { 'font-size': 13, 'font-weight': 800, fill: c === LIMIT_CM ? '#C8372D' : '#23304A' });
  }
  txt(rig, RULER.x + 22, r0 - 22, 'cm', { 'font-size': 13 });
  const pillY = S.kg > 0 ? SP.y0 + (spring(S.kg).over ? LIMIT_CM + 8 : spring(S.kg).x) * SP.pxcm : -99, limY = r0 + 35 * SP.pxcm;
  if (Math.abs(pillY - limY) > 30) txt(rig, RULER.x + 58, limY + 5, '← 超過彈性限度', { 'font-size': 13, 'font-weight': 900, fill: '#C8372D', 'text-anchor': 'start' });
  // 原長線（綠，水平）
  el('line', { x1: SP.x - 46, y1: SP.y0, x2: RULER.x, y2: SP.y0, stroke: '#2E7D63', 'stroke-width': 3, 'stroke-dasharray': '7 5' }, rig);
  txt(rig, SP.x - 92, SP.y0 + 5, '原長', { 'font-size': 15, 'font-weight': 900, fill: '#2E7D63' });
  // 彈簧
  el('image', { href: P + 'prop-spring-coil.webp', x: SP.x - 16, y: SP.top - 6, width: 32, height: yEnd - SP.top + 8, preserveAspectRatio: 'none' }, rig);
  if (over) el('rect', { x: SP.x - 18, y: SP.top + 10, width: 36, height: yEnd - SP.top - 10, rx: 8, fill: 'rgba(200,55,45,.28)' }, rig);
  // 指針線（紅，水平）
  if (S.kg > 0) {
    el('line', { x1: SP.x + 8, y1: yEnd, x2: RULER.x, y2: yEnd, stroke: '#C8372D', 'stroke-width': 3, 'stroke-dasharray': over ? '3 4' : '0' }, rig);
    el('rect', { x: RULER.x + 56, y: yEnd - 17, width: over ? 150 : 118, height: 34, rx: 17, fill: '#C8372D' }, rig);
    txt(rig, RULER.x + 56 + (over ? 75 : 59), yEnd + 6, over ? '超過 30 cm！' : `伸長 ${n1(m.x)} cm`, { fill: '#fff', 'font-size': 16, 'font-weight': 900 });
  }
  // 掛著的砝碼
  const n = Math.round(S.kg / 0.5);
  let y = yEnd - 4;
  for (let k = 0; k < n; k++) y += weightImg(rig, SP.x, y, k === 0) - (k === 0 ? 2 : 1);
  if (n) txt(rig, SP.x - 70, yEnd + 60, `${n1(S.kg)} kg`, { 'font-size': 17, 'font-weight': 900 });
  // 砝碼盤（直接操作）
  const [lo, hi] = RANGE[S.step], left = 4 - n;
  const tg = el('g', { class: 'tool', tabindex: 0, role: 'button', 'aria-label': S.kg >= hi ? '砝碼盤：這一步不能再掛了' : '砝碼盤：掛上一個 0.5 kg 砝碼' }, rig);
  el('rect', { class: 'tool-ring', x: TRAY.x - 58, y: TRAY.y - 70, width: 116, height: 118, rx: 18, fill: 'rgba(255,255,255,.7)', stroke: '#E0A21B', 'stroke-width': 4 }, tg);
  for (let k = 0; k < left; k++) weightImg(tg, TRAY.x - 34 + k * 23, TRAY.y - 60, true, 26);
  txt(tg, TRAY.x, TRAY.y + 72, S.kg < hi ? '掛上一個' : '已掛滿', { 'font-size': 16, 'font-weight': 900, fill: S.kg < hi ? '#C8372D' : '#5A6478' });
  txt(tg, TRAY.x, TRAY.y + 92, '每個 0.5 kg', { 'font-size': 13, 'font-weight': 700, fill: '#5A6478' });
  if (S.kg < hi && !readyToSave()) tg.classList.add('cue');
  bind(tg, addWeight);
}

/* ---------- 場景：木塊與彈簧秤 ---------- */
const TABLE = 470, BX = 330, PX_N = 14;
let handleX = 0;
function drawFriction() {
  const v = variant(), m = friction({ massKg: v.kg, pull: shownPull }), slide = slideK * (isCmp() ? 60 : 100);
  // 桌面
  el('rect', { x: 180, y: TABLE, width: 800, height: 16, rx: 4, fill: '#C89A5E', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: 200, y: TABLE + 16, width: 760, height: 60, fill: 'rgba(120,80,40,.12)' }, rig);
  // 木塊
  const narrow = v.face === 'narrow', bw = narrow ? 90 : 200, bh = narrow ? 180 : 90, bx = BX + slide + (narrow ? 55 : 0), by = TABLE - bh;
  if (narrow) {
    const g = el('g', { transform: `translate(${bx + bw / 2} ${by + bh / 2}) rotate(90)` }, rig);
    el('image', { href: P + 'prop-wooden-block.webp', x: -bh / 2, y: -bw / 2, width: bh, height: bw, preserveAspectRatio: 'none' }, g);
  } else el('image', { href: P + 'prop-wooden-block.webp', x: bx, y: by, width: bw, height: bh, preserveAspectRatio: 'none' }, rig);
  if (v.kg > BLOCK_KG) {
    const box = el('svg', { x: bx + bw / 2 - 34, y: by - 70, width: 68, height: 72, viewBox: '0 215 249 297', preserveAspectRatio: 'none' }, rig);
    el('image', { href: P + 'prop-hanging-weight.webp', x: 0, y: 0, width: 249, height: 512 }, box);
    txt(rig, bx + bw / 2, by - 40, '2 kg', { 'font-size': 15, 'font-weight': 900 });
  }
  el('rect', { x: bx + bw / 2 - 44, y: by + bh / 2 - 15, width: 88, height: 30, rx: 10, fill: 'rgba(255,255,255,.88)' }, rig);
  txt(rig, bx + bw / 2, by + bh / 2 + 6, `${v.kg} kg`, { 'font-size': 16, 'font-weight': 900 });
  // 彈簧秤
  const sy = TABLE - 45, sx = bx + bw, sl = 180 + shownPull * PX_N * (isCmp() ? 0.6 : 1);
  el('image', { href: P + 'prop-spring-scale.webp', x: sx - 4, y: sy - 15, width: sl, height: 30, preserveAspectRatio: 'none' }, rig);
  el('rect', { x: sx + sl / 2 - 36, y: sy - 52, width: 72, height: 28, rx: 14, fill: '#23304A' }, rig);
  txt(rig, sx + sl / 2, sy - 32, `${n1(shownPull)} N`, { fill: '#fff', 'font-size': 16, 'font-weight': 900 });
  // 力的箭頭
  // 受力圖：拉力向右、摩擦力向左，畫在木塊下方（同一比例）
  const cx = bx + bw / 2, ay = TABLE + 40, sc = isCmp() ? 7 : 11;
  if (shownPull > 0) arrow(rig, cx + 4, ay, cx + 4 + shownPull * sc, '#C8372D', `拉力 ${n1(shownPull)} N`, true);
  if (m.friction > 0) arrow(rig, cx - 4, ay, cx - 4 - m.friction * sc, '#2F6FB0', `${m.kind === 'moving' ? '動' : '靜'}摩擦力 ${n1(m.friction)} N`, true);
  if (shownPull > 0 || m.friction > 0) el('circle', { cx, cy: ay, r: 5, fill: '#23304A' }, rig);
  if (m.kind === 'moving') txt(rig, bx + bw / 2, by - (v.kg > BLOCK_KG ? 84 : 18), '滑動了！', { 'font-size': 20, 'font-weight': 900, fill: '#C8372D' });
  else if (m.kind === 'edge') txt(rig, bx + bw / 2, by - (v.kg > BLOCK_KG ? 84 : 18), '快要滑動了', { 'font-size': 18, fill: '#C8372D' });
  // 把手（直接操作）
  handleX = sx + sl;
  if (isPull()) {
    const hg = el('g', { class: 'tool handle', tabindex: 0, role: 'slider', 'aria-label': '彈簧秤把手：左右拖動改變拉力', 'aria-valuemin': RANGE[S.step][0], 'aria-valuemax': RANGE[S.step][1], 'aria-valuenow': S.pull, 'aria-valuetext': `${S.pull} N` }, rig);
    el('circle', { class: 'tool-ring', cx: handleX + 4, cy: sy, r: 24, fill: 'rgba(255,255,255,.35)', stroke: '#E0A21B', 'stroke-width': 4 }, hg);
    el('circle', { cx: handleX + 4, cy: sy, r: 36, fill: 'transparent' }, hg);
    if (!readyToSave() && S.pull < RANGE[S.step][1] && !anim) { hg.classList.add('cue'); txt(rig, handleX + 4, sy + 52, '往右拉 →', { 'font-size': 15, 'font-weight': 900, fill: '#C8372D' }); }
    hg.addEventListener('pointerdown', startDrag);
    hg.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setPull(S.pull + 1); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setPull(S.pull - 1); }
    });
  }
}
function drawSummary() {
  txt(rig, 720, 250, '證據都在研究手冊裡', { 'font-size': 20, 'font-weight': 900 });
  el('image', { href: P + 'prop-spring-coil.webp', x: 520, y: 290, width: 34, height: 150 }, rig);
  el('image', { href: P + 'prop-wooden-block.webp', x: 620, y: 360, width: 180, height: 81 }, rig);
  el('image', { href: P + 'prop-spring-scale.webp', x: 800, y: 385, width: 160, height: 26 }, rig);
}
function draw() {
  const hadFocus = !!document.activeElement && rig.contains(document.activeElement);
  rig.replaceChildren();
  if (isSpring()) drawSpring(); else if (isPull() || isCmp()) drawFriction(); else drawSummary();
  if (hadFocus) { const f = rig.querySelector('.tool'); if (f) f.focus({ preventScroll: true }); }
}
function bind(node, run) {
  node.addEventListener('click', run);
  node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); } });
}

/* ---------- 操作 ---------- */
function changed() { foundShown = null; lastNote = null; save(); render(); }
function addWeight() {
  if (!isSpring()) return;
  const hi = RANGE[S.step][1];
  if (S.kg >= hi) { oops(S.step === 'spring' ? '這一步掛到 1.0 kg 就好。收下觀察後，下一步再繼續掛。' : '已經掛到 2.0 kg 了，收下這次觀察。'); return; }
  S.kg = Math.round((S.kg + 0.5) * 10) / 10; changed();
}
function removeWeight() {
  if (!isSpring()) return;
  if (S.kg <= RANGE[S.step][0]) { oops('這一步不用再取下砝碼。'); return; }
  S.kg = Math.round((S.kg - 0.5) * 10) / 10; changed();
}
function setPull(p) {
  if (!isPull() || anim) return;
  const [lo, hi] = RANGE[S.step], next = Math.max(lo, Math.min(hi, Math.round(p)));
  if (next === S.pull) { if (p > hi) oops(S.step === 'static' ? '先停在 5 N 以內。下一步再試更大的拉力。' : '拉到 7 N 就夠了。'); return; }
  const before = cur().kind;
  S.pull = next; shownPull = next;
  const after = cur().kind;
  if (after === 'moving' && before !== 'moving') animateSlide(); else if (after !== 'moving') slideK = 0;
  changed();
}
let dragging = false;
function startDrag(e) { if (anim) return; dragging = true; e.preventDefault(); addEventListener('pointermove', moveDrag); addEventListener('pointerup', endDrag, { once: true }); }
function moveDrag(e) {
  if (!dragging) return;
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  const base = handleX - S.pull * PX_N;
  setPull((p.x - base) / PX_N);
}
function endDrag() { dragging = false; removeEventListener('pointermove', moveDrag); }
function animateSlide() {
  if (reduceMotion()) { slideK = 1; return; }
  slideK = 0; const t0 = performance.now();
  const f = now => { slideK = Math.min(1, (now - t0) / 900); draw(); if (slideK < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
function scan() {
  if (!isCmp() || anim) return;
  if (S.scanned) { oops('這個條件已經拉過了。換另一個條件，或按「重來這一步」。'); return; }
  const v = variant(), fs = friction({ massKg: v.kg, pull: 0 }).fs, slip = fs + 1;
  lastNote = null; foundShown = null; slideK = 0;
  if (reduceMotion()) { S.pull = slip; shownPull = slip; slideK = 1; S.scanned = true; save(); render(); return; }
  const t0 = performance.now(), dur = 260 * slip;
  const f = now => {
    const k = Math.min(1, (now - t0) / dur);
    shownPull = Math.floor(k * slip + 1e-9);
    draw(); renderReadouts(); drawGraph();
    if (k < 1) anim = requestAnimationFrame(f);
    else { anim = null; S.pull = slip; shownPull = slip; S.scanned = true; save(); animateSlide(); render(); }
  };
  anim = requestAnimationFrame(f); render();
}
function pickVariant(k) {
  if (!isCmp() || anim) return;
  if (S.variant === k) return;
  S.variant = k; S.pull = 0; shownPull = 0; S.scanned = false; slideK = 0; changed();
}

/* ---------- 讀值 ---------- */
let prev = {};
function setReading(i, label, val, unit, note) {
  $('#l-' + i).textContent = label; $('#u-' + i).textContent = unit; $('#n-' + i).textContent = note;
  const n = $('#r-' + i), v = String(val);
  if (prev[i] !== undefined && prev[i] !== v && !anim) { n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick'); }
  prev[i] = v; n.textContent = v;
}
function renderReadouts() {
  if (isSpring() || S.step === 'quiz') {
    const m = spring(isSpring() ? S.kg : 1);
    setReading(1, '拉力', n1(m.F), 'N', `砝碼 ${n1(m.massKg)} kg ＝ ${n1(m.massKg)} 公斤重`);
    setReading(2, '伸長', m.over ? '> 30' : n1(m.x), 'cm', m.over ? '超過彈性限度' : '從原長量起');
    setReading(3, '每 1 N 伸長', m.over || !m.F ? '—' : n1(m.x / m.F), 'cm', m.over ? '比例不再成立' : m.F ? '伸長 ÷ 拉力' : '掛上砝碼後計算');
    return;
  }
  const v = variant(), m = friction({ massKg: v.kg, pull: shownPull });
  if (isPull()) {
    setReading(1, '拉力', n1(shownPull), 'N', '彈簧秤讀數');
    setReading(2, m.kind === 'moving' ? '動摩擦力' : '靜摩擦力', n1(m.friction), 'N', m.kind === 'edge' ? '已達最大靜摩擦' : m.kind === 'moving' ? '比最大靜摩擦小' : '和拉力一樣大、方向相反');
    setReading(3, '木塊', m.kind === 'moving' ? '滑動' : '靜止', '', `木塊 ${v.kg} kg，正向力 ${n1(m.N)} N`);
    return;
  }
  setReading(1, '正向力', n1(m.N), 'N', `${v.name}${v.face === 'narrow' ? '（面積 30 cm²）' : '（面積 60 cm²）'}`);
  setReading(2, '最大靜摩擦', S.scanned ? n1(m.fs) : '—', 'N', S.scanned ? '滑動前的最大拉力' : '按「慢慢拉到滑動」');
  setReading(3, '動摩擦力', S.scanned ? n1(m.fk) : '—', 'N', S.scanned ? '滑動時的摩擦力' : '滑動後才量得到');
}

/* ---------- 圖 ---------- */
const GR = { l: 42, r: 306, t: 22, b: 164 };
function axes(g, xMax, yMax, xStep, yStep, xl, yl) {
  const gx = v => GR.l + v / xMax * (GR.r - GR.l), gy = v => GR.b - v / yMax * (GR.b - GR.t);
  for (let v = 0; v <= yMax + 1e-9; v += yStep) { el('line', { x1: GR.l, y1: gy(v), x2: GR.r, y2: gy(v), stroke: '#E6DCCB' }, g); txt(g, GR.l - 7, gy(v) + 4, String(v), { 'font-size': 11, 'font-weight': 700, 'text-anchor': 'end' }); }
  for (let v = 0; v <= xMax + 1e-9; v += xStep) txt(g, gx(v), GR.b + 15, String(v), { 'font-size': 11, 'font-weight': 700 });
  el('path', { d: `M ${GR.l} ${GR.t} V ${GR.b} H ${GR.r}`, fill: 'none', stroke: '#23304A', 'stroke-width': 2 }, g);
  txt(g, GR.r, GR.b + 30, xl, { 'font-size': 11, 'font-weight': 700, 'text-anchor': 'end' });
  txt(g, GR.l - 4, GR.t - 10, yl, { 'font-size': 11, 'font-weight': 700, 'text-anchor': 'start' });
  return [gx, gy];
}
function drawGraph() {
  const g = $('#graph'); g.replaceChildren();
  let title, key, aria;
  if (isSpring()) {
    title = '拉力–伸長圖<small>收下的點會留在圖上</small>';
    const [gx, gy] = axes(g, 20, 40, 5, 10, '拉力（N）', '伸長（cm）');
    el('rect', { x: GR.l, y: GR.t, width: GR.r - GR.l, height: gy(LIMIT_CM) - GR.t, fill: 'rgba(200,55,45,.08)' }, g);
    el('line', { x1: GR.l, y1: gy(LIMIT_CM), x2: GR.r, y2: gy(LIMIT_CM), stroke: '#C8372D', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, g);
    txt(g, GR.r - 4, gy(LIMIT_CM) - 5, '彈性限度 30 cm', { 'font-size': 11, 'font-weight': 900, fill: '#C8372D', 'text-anchor': 'end' });
    const pts = recs('spring').concat(recs('limit')).filter(r => !r.over);
    if (pts.length >= 2) el('line', { x1: gx(0), y1: gy(0), x2: gx(15), y2: gy(30), stroke: '#2F6FB0', 'stroke-width': 2.5 }, g);
    for (const r of pts) el('circle', { cx: gx(r.F), cy: gy(r.x), r: 5.5, fill: '#2F6FB0', stroke: '#fff', 'stroke-width': 2 }, g);
    for (const r of recs('limit').filter(r => r.over)) { el('circle', { cx: gx(r.F), cy: GR.t + 4, r: 5.5, fill: '#C8372D' }, g); txt(g, gx(r.F) - 8, GR.t + 8, '超過', { 'font-size': 11, 'font-weight': 900, fill: '#C8372D', 'text-anchor': 'end' }); }
    const m = spring(S.kg);
    if (S.kg > 0) el('circle', { cx: gx(m.F), cy: m.over ? GR.t + 4 : gy(m.x), r: 6, fill: 'none', stroke: '#C8372D', 'stroke-width': 2.5 }, g);
    key = `<li><i style="background:#2F6FB0"></i>收下的讀值</li><li><i style="background:#C8372D"></i>現在</li>`;
    aria = '拉力–伸長圖：' + (pts.map(r => `${n1(r.F)} N 伸長 ${n1(r.x)} cm`).join('，') || '還沒有點');
  } else if (isPull()) {
    title = '拉力–摩擦力圖<small>木塊 2 kg</small>';
    const [gx, gy] = axes(g, 8, 8, 1, 2, '拉力（N）', '摩擦力（N）');
    el('line', { x1: gx(0), y1: gy(0), x2: gx(8), y2: gy(8), stroke: '#D9CFBE', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, g);
    txt(g, gx(2.6), gy(3.6), '摩擦力 ＝ 拉力', { 'font-size': 10, 'font-weight': 700, fill: '#9A8F7C' });
    const pts = recs('static').concat(recs('slip'));
    for (const r of pts) el('circle', { cx: gx(r.pull), cy: gy(r.f), r: 5.5, fill: r.kind === 'moving' ? '#C8372D' : '#2F6FB0', stroke: '#fff', 'stroke-width': 2 }, g);
    const m = friction({ pull: shownPull });
    el('circle', { cx: gx(shownPull), cy: gy(m.friction), r: 6, fill: 'none', stroke: '#23304A', 'stroke-width': 2.5 }, g);
    key = `<li><i style="background:#2F6FB0"></i>靜止</li><li><i style="background:#C8372D"></i>滑動</li>`;
    aria = '拉力–摩擦力圖：' + (pts.map(r => `拉 ${r.pull} N 摩擦 ${n1(r.f)} N`).join('，') || '還沒有點');
  } else {
    const step = isCmp() ? S.step : 'area', vs = VARIANTS[step];
    title = (step === 'normal' ? '正向力比較' : '接觸面積比較') + '<small>收下的結果</small>';
    const [, gy] = axes(g, 1, 14, 2, 2, '', '摩擦力（N）');
    g.querySelectorAll('text').forEach(t => { if (t.getAttribute('y') > GR.b) t.remove(); });
    vs.forEach((v, k) => {
      const r = recs(step, x => x.variant === v.id).pop(), cx = GR.l + 70 + k * 120;
      txt(g, cx + 14, GR.b + 16, v.name, { 'font-size': 11, 'font-weight': 900 });
      if (!r) { txt(g, cx + 14, GR.b - 10, '還沒拉', { 'font-size': 11, fill: '#9A8F7C' }); return; }
      el('rect', { x: cx - 10, y: gy(r.fs), width: 22, height: GR.b - gy(r.fs), fill: '#2F6FB0' }, g);
      el('rect', { x: cx + 16, y: gy(r.fk), width: 22, height: GR.b - gy(r.fk), fill: '#C8372D' }, g);
      txt(g, cx + 1, gy(r.fs) - 4, n1(r.fs), { 'font-size': 11, 'font-weight': 900, fill: '#2F6FB0' });
      txt(g, cx + 27, gy(r.fk) - 4, n1(r.fk), { 'font-size': 11, 'font-weight': 900, fill: '#C8372D' });
    });
    key = `<li><i style="background:#2F6FB0"></i>最大靜摩擦</li><li><i style="background:#C8372D"></i>動摩擦</li>`;
    aria = (step === 'normal' ? '正向力比較圖' : '接觸面積比較圖') + '：' + (recs(step).map(r => `${r.name} 最大靜摩擦 ${n1(r.fs)} N、動摩擦 ${n1(r.fk)} N`).join('，') || '還沒有資料');
  }
  $('#graph-title').innerHTML = title; $('#graph-key').innerHTML = key; g.setAttribute('aria-label', aria);
}

/* ---------- 余老師 ---------- */
function oops(t) { teacher.last = ''; teacher.say(t, { pose: 'think', tone: 'oops' }); lastNote = t; }
function stepDone() {
  if (S.step === 'spring') return recs('spring', r => r.kg === 0.5).length && recs('spring', r => r.kg === 1).length;
  if (S.step === 'limit') return recs('limit', r => r.over).length;
  if (S.step === 'static') return new Set(recs('static').map(r => r.pull)).size >= 2;
  if (S.step === 'slip') return recs('slip', r => r.kind === 'edge').length && recs('slip', r => r.kind === 'moving').length;
  if (isCmp()) return VARIANTS[S.step].every(v => recs(S.step, r => r.variant === v.id).length);
  return false;
}
function readyToSave() {
  if (!isLab() || anim) return false;
  const m = cur();
  if (S.step === 'spring') return (S.kg === 0.5 || S.kg === 1) && !recs('spring', r => r.kg === S.kg).length;
  if (S.step === 'limit') return m.over && !recs('limit', r => r.over).length;
  if (S.step === 'static') return S.pull > 0 && m.kind === 'rest' && !recs('static', r => r.pull === S.pull).length && new Set(recs('static').map(r => r.pull)).size < 2;
  if (S.step === 'slip') return (m.kind === 'edge' || m.kind === 'moving') && !recs('slip', r => r.kind === m.kind).length;
  return S.scanned && !recs(S.step, r => r.variant === variant().id).length;
}
function talk() {
  if (lastNote) return;
  if (foundShown) {
    const f = TASK[foundShown].found;
    const action = foundShown === 'quiz' ? { label: '看成果 →', run: openFinish } : { label: '下一步 →', run: () => goStep(NEXT[foundShown]) };
    teacher.say(f[0], { pose: 'cheer', tone: 'found', tag: '發現時刻', eq: f[1], action }); return;
  }
  const step = S.step, done = S.done.includes(step), task = TASK[step], ready = readyToSave();
  if (step === 'quiz') { teacher.say(done ? '全部完成了！可以按「看成果」。' : task.intro, { pose: done ? 'thumb' : 'think' }); return; }
  if (done) { teacher.say('這一步完成了，按任務卡的「下一步」繼續。', { pose: 'thumb' }); return; }
  if (isSpring()) {
    const m = spring(S.kg);
    if (step === 'spring') {
      if (S.kg === 0) { teacher.say(task.intro, { pose: 'point' }); return; }
      teacher.say(ready ? `${n1(S.kg)} kg ＝ ${n1(m.F)} N，伸長 ${n1(m.x)} cm。收下這次觀察。` : recs('spring', r => r.kg === S.kg).length ? `${n1(S.kg)} kg 收下了，再掛一個。` : `伸長 ${n1(m.x)} cm。`, { pose: ready ? 'wow' : 'point' }); return;
    }
    if (m.over) { teacher.say(ready ? `20 N 應該伸長 40 cm，但已經超過 30 cm 的彈性限度了！收下這次觀察。` : '收下了！', { pose: 'wow' }); return; }
    teacher.say(S.kg === 1.5 ? '1.5 kg：伸長剛好 30 cm，到彈性限度了。再掛一個看看！' : task.intro, { pose: 'point' }); return;
  }
  if (isPull()) {
    const m = cur();
    if (anim) return;
    if (step === 'static') {
      if (S.pull === 0) { teacher.say(task.intro, { pose: 'point' }); return; }
      const got = new Set(recs('static').map(r => r.pull));
      teacher.say(ready ? `拉 ${S.pull} N，木塊沒動：靜摩擦力也是 ${S.pull} N。收下這次觀察。` : got.has(S.pull) ? `${S.pull} N 收下了。換一個不同的拉力。` : `拉 ${S.pull} N，木塊沒動。`, { pose: ready ? 'wow' : 'point' }); return;
    }
    if (m.kind === 'rest') { teacher.say(task.intro, { pose: 'point' }); return; }
    if (m.kind === 'edge') { teacher.say(ready ? '6 N：木塊還沒動，但已經是最大靜摩擦了。收下這次觀察。' : '6 N 收下了。再加 1 N！', { pose: 'wow' }); return; }
    teacher.say(ready ? '7 N 滑動了！摩擦力反而變成 4 N。收下這次觀察。' : recs('slip', r => r.kind === 'edge').length ? '收下了！' : '先退回 6 N 收下最大靜摩擦。', { pose: 'wow' }); return;
  }
  if (anim) { teacher.say('拉力慢慢變大……', { pose: 'wow' }); return; }
  const v = variant(), m = friction({ massKg: v.kg, pull: 0 });
  if (!S.scanned) { teacher.say(recs(step).length ? `再換「${VARIANTS[step][1 - S.variant].name}」？現在是「${v.name}」，按「慢慢拉到滑動」。` : task.intro, { pose: 'point' }); return; }
  teacher.say(ready ? `${v.name}：最大靜摩擦 ${n1(m.fs)} N，滑動後 ${n1(m.fk)} N。收下這次觀察。` : `「${v.name}」收下了。換另一個條件。`, { pose: ready ? 'wow' : 'thumb' });
}

/* ---------- 任務卡 ---------- */
function btn(label, run, { pressed = null, disabled = false } = {}) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn-soft'; b.textContent = label; b.disabled = disabled;
  if (pressed !== null) b.setAttribute('aria-pressed', String(pressed));
  b.addEventListener('click', run); return b;
}
function renderTask() {
  const i = STEPS.findIndex(x => x.id === S.step), task = TASK[S.step], done = S.done.includes(S.step);
  $('#task-kicker').textContent = `任務 ${i + 1} / ${STEPS.length}${done ? '　✓ 已完成' : ''}`;
  $('#task-title').textContent = task.title; $('#task-goal').textContent = task.goal;
  const go = $('#task-go');
  if (done && S.step === 'quiz') { go.hidden = false; go.textContent = '看成果 →'; go.onclick = openFinish; }
  else if (done) { go.hidden = false; go.textContent = '下一步 →'; go.onclick = () => goStep(NEXT[S.step]); }
  else go.hidden = true;
  $('#dock-pull').hidden = !isLab(); $('#dock-quiz').hidden = S.step !== 'quiz';
  const box = $('#ctl-btns'); box.className = 'picker-btns two';
  if (isSpring()) {
    $('#ctl-label').innerHTML = '砝碼 <small>按右邊的砝碼盤，或下面的按鈕</small>';
    const [lo, hi] = RANGE[S.step];
    box.replaceChildren(btn('掛上一個（0.5 kg）', addWeight, { disabled: S.kg >= hi }), btn('取下一個', removeWeight, { disabled: S.kg <= lo }));
  } else if (isPull()) {
    $('#ctl-label').innerHTML = '拉力 <small>拖彈簧秤的把手，或按下面的按鈕</small>';
    const [lo, hi] = RANGE[S.step];
    box.replaceChildren(btn('放鬆 −1 N', () => setPull(S.pull - 1), { disabled: S.pull <= lo }), btn('拉力 +1 N', () => setPull(S.pull + 1), { disabled: S.pull >= hi }));
  } else if (isCmp()) {
    $('#ctl-label').innerHTML = '條件 <small>先選一個條件，再慢慢拉</small>';
    box.className = 'picker-btns three';
    box.replaceChildren(...VARIANTS[S.step].map((v, k) => btn(v.name, () => pickVariant(k), { pressed: S.variant === k, disabled: !!anim })), btn('慢慢拉到滑動', scan, { disabled: S.scanned || !!anim }));
  }
  $('#save').classList.toggle('cue', readyToSave());
  const chip = $('#unit-chip');
  chip.innerHTML = isSpring() ? '<span>換算</span><b>1 公斤重 ＝ 10 N</b><span>一個砝碼 0.5 公斤重 ＝ 5 N</span>' : '<span>換算</span><b>1 公斤重 ＝ 10 N</b><span>木塊 2 公斤重 ＝ 20 N</span>';
  chip.hidden = !isLab();
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
const STEP_NAME = { spring: '掛砝碼', limit: '掛太多', static: '拉不動', slip: '開始滑', normal: '加重', area: '翻面' };
function chipText(r) {
  if (r.exp === 'spring') return [`${n1(r.kg)} kg ＝ ${n1(r.F)} N`, r.over ? '伸長超過 30 cm' : `伸長 ${n1(r.x)} cm`, r.over ? '超過彈性限度' : '彈性限度內'];
  if (r.exp === 'pull') return [`拉力 ${r.pull} N`, `${r.kind === 'moving' ? '動' : '靜'}摩擦 ${n1(r.f)} N`, r.kind === 'moving' ? '滑動' : r.kind === 'edge' ? '最大靜摩擦' : '靜止'];
  return [r.name, `最大靜摩擦 ${n1(r.fs)} N`, `正向力 ${n1(r.N)} N｜動摩擦 ${n1(r.fk)} N`];
}
function renderEvidence() {
  const n = S.records.length;
  $('#ev-count').textContent = n; $('#note-count').textContent = n; $('#ev-empty').hidden = n > 0;
  const chips = $('#chips'), want = S.records.slice(-4).reverse(), key = want.map(r => r.n).join(',');
  if (chips.dataset.key === key) return; chips.dataset.key = key;
  chips.replaceChildren(...want.map(r => { const [a, b, c] = chipText(r), li = document.createElement('li'); li.className = 'chip'; li.innerHTML = `<small>#${r.n} ${STEP_NAME[r.step]}・${a}</small><b>${b}</b><span class="res ok">${c}</span>`; return li; }));
}
function keep() {
  if (!isLab() || anim) return;
  if (!readyToSave()) {
    let msg = '先照任務卡做到要收下的狀態。';
    if (S.step === 'spring') msg = S.kg === 0 ? '先掛上砝碼。' : recs('spring', r => r.kg === S.kg).length ? '這個讀值已經收下了，再掛一個。' : '掛到 0.5 kg 或 1.0 kg 時再收下。';
    else if (S.step === 'limit') msg = '掛到 2.0 kg，看伸長有沒有超過限度再收下。';
    else if (S.step === 'static') msg = S.pull === 0 ? '先拉一點力。' : new Set(recs('static').map(r => r.pull)).size >= 2 ? '已經有兩個讀值了。' : '這個拉力已經收下了，換一個不同的拉力。';
    else if (S.step === 'slip') msg = cur().kind === 'rest' ? '拉到 6 N 或 7 N 時再收下。' : '這個狀態已經收下了。';
    else msg = S.scanned ? '這個條件已經收下了，換另一個條件。' : '先按「慢慢拉到滑動」。';
    oops(msg); return;
  }
  if (S.records.length >= 60) { oops('手冊滿 60 張了，清空紀錄才能再收。'); return; }
  const base = { n: S.records.length + 1, at: new Date().toISOString(), step: S.step };
  let rec, label;
  if (isSpring()) { const m = spring(S.kg); rec = { ...base, exp: 'spring', kg: S.kg, F: m.F, x: m.x, over: m.over }; label = m.over ? '超過彈性限度' : `${n1(m.F)} N → ${n1(m.x)} cm`; }
  else if (isPull()) { const m = cur(); rec = { ...base, exp: 'pull', pull: S.pull, f: m.friction, kind: m.kind }; label = `拉 ${S.pull} N｜摩擦 ${n1(m.friction)} N`; }
  else { const v = variant(), m = friction({ massKg: v.kg, pull: 0 }); rec = { ...base, exp: 'cmp', variant: v.id, name: v.name, N: m.N, fs: m.fs, fk: m.fk }; label = `${v.name}：${n1(m.fs)} N`; }
  S.records.push(rec); lastNote = null;
  if (stepDone() && !S.done.includes(S.step)) { S.done.push(S.step); foundShown = S.step; }
  save();
  const target = isVisible($('#evidence')) ? $('#evidence') : $('#note-count');
  fly($('#save'), target, label).then(() => { renderEvidence(); bump($('#note-count')); });
  render();
}
const isVisible = n => { const r = n.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };

/* ---------- 步驟 ---------- */
const START = { spring: { kg: 0 }, limit: { kg: 1 }, static: { pull: 0 }, slip: { pull: 5 }, normal: { variant: 0, pull: 0, scanned: false }, area: { variant: 0, pull: 0, scanned: false } };
function goStep(id) {
  if (anim) { cancelAnimationFrame(anim); anim = null; }
  S.step = id; foundShown = null; lastNote = null;
  Object.assign(S, START[id] || {}); shownPull = S.pull; slideK = 0;
  if (id === 'quiz' && !S.done.includes('quiz')) S.quiz = { i: 0, pick: null };
  save(); teacher.last = ''; render();
  if (narrow.matches) scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
}
function resetStep() {
  if (S.step === 'quiz') S.quiz = { i: 0, pick: null };
  goStep(S.step);
}

/* ---------- 對話框 ---------- */
function openNotes() {
  const body = $('#notes-body'); body.replaceChildren();
  if (!S.records.length) { const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="5" class="notes-empty">還沒有證據。</td>'; body.append(tr); }
  for (const r of S.records) {
    const [a, b, c] = chipText(r), tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.n}</td>` + [STEP_NAME[r.step], a, b, c].map(x => `<td>${x}</td>`).join('');
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
    S.done.includes('spring') && '<li><b>虎克定律</b>：5 N 伸長 10 cm、10 N 伸長 20 cm</li>',
    S.done.includes('limit') && '<li><b>彈性限度</b>：伸長超過 30 cm，比例不再成立</li>',
    S.done.includes('static') && '<li><b>靜摩擦</b>：木塊沒動時，摩擦力 ＝ 拉力</li>',
    S.done.includes('slip') && '<li><b>最大靜摩擦 6 N</b>：一滑動，摩擦力降成 4 N</li>',
    S.done.includes('normal') && '<li><b>正向力</b>：20 N → 40 N，最大靜摩擦 6 N → 12 N</li>',
    S.done.includes('area') && '<li><b>接觸面積</b>：寬面、窄面都是 6 N</li>'
  ].filter(Boolean).join('');
  $('#finish-dialog').showModal();
}
let resetting = false;
async function clearAll() {
  if (resetting || anim) return;
  if (!confirm('要清空這一站的所有證據和進度，從第 1 步重新開始嗎？')) return;
  resetting = true; let cleared;
  try { cleared = await db.clear(); } finally { resetting = false; }
  if (!cleared) return;
  S = fresh(); shownPull = 0; slideK = 0; foundShown = null; lastNote = null; teacher.last = '';
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  render(); if (narrow.matches) scrollTo({ top: 0 });
}

/* ---------- 版面 ---------- */
const narrow = matchMedia('(max-width: 860px)');
function fitScene() {
  const vb = narrow.matches ? (isSpring() ? '470 90 520 520' : isLab() ? '200 290 780 270' : '450 200 540 300') : (isSpring() ? '140 70 860 540' : isLab() ? '0 180 1000 400' : '140 110 860 500');
  svg.setAttribute('viewBox', vb);
}
narrow.addEventListener?.('change', () => render());
function render() {
  renderSteps($('#steps'), STEPS, S.step, new Set(S.done), id => goStep(id));
  fitScene(); draw(); drawGraph(); renderReadouts(); renderEvidence(); renderTask(); talk();
}

$('#save').addEventListener('click', keep);
$('#task-reset').addEventListener('click', resetStep);
$('#clear-records').addEventListener('click', clearAll);
$('#reset-all').addEventListener('click', clearAll);
$('#why').addEventListener('click', () => $('#why-dialog').showModal());
$('#open-notes').addEventListener('click', openNotes);
document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

render();
