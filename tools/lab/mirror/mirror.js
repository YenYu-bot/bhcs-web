// 面鏡成像實驗桌（新版實驗桌設計）
// 像距與倍率直接用 scripts/science/models.mjs 的 calculate('optics')：理想公式 1/v ＝ 1/f − 1/u 與透鏡相同。
// 對應方式：凹面鏡 f > 0（傳 kind 'convex'）、凸面鏡 f < 0（傳 kind 'concave'）；v > 0 表示像在鏡前（實像），v < 0 在鏡後（虛像）。
import { calculate } from '../../../scripts/science/models.mjs';
import { $, Teacher, renderSteps, fly, bump, reduceMotion } from '../shared/lab.js';
import { openNotebook } from '../shared/notebook.mjs';

const NS = 'http://www.w3.org/2000/svg';
const P = '../../../assets/science/props/';
const db = await openNotebook('bhcs.lab.mirror.v1');
const F = 10;
const MIRRORS = { plane: { name: '平面鏡', f: 0 }, convex: { name: '凸面鏡', f: -F }, concave: { name: '凹面鏡', f: F } };
function optics(mirror, u) {
  if (mirror === 'plane') return { kind: 'virtual', v: -u, m: 1 };
  const f = MIRRORS[mirror].f, r = calculate('optics', { kind: f > 0 ? 'convex' : 'concave', f: Math.abs(f), u });
  return { kind: r.kind, v: r.v, m: r.m };
}
const cm = x => String(Math.round(x * 10) / 10);
function where(o) { return o.kind === 'focus' ? '不成像' : o.v > 0 ? `鏡前 ${cm(o.v)} cm` : `鏡後 ${cm(-o.v)} cm`; }
function describe(o) {
  if (o.kind === 'focus') return '反射光平行，不成像';
  const a = Math.abs(o.m), size = Math.abs(a - 1) < 1e-9 ? '等大' : a > 1 ? '放大' : '縮小';
  return `${o.m > 0 ? '正立' : '倒立'}、${size}、${o.kind === 'real' ? '實像' : '虛像'}`;
}

const STEPS = [
  { id: 'plane', label: '平面鏡' },
  { id: 'convex', label: '凸面鏡' },
  { id: 'real', label: '凹面鏡接像' },
  { id: 'table', label: '凹面鏡物距' },
  { id: 'quiz', label: '說說看' }
];
const NEXT = { plane: 'convex', convex: 'real', real: 'table', table: 'quiz' };
const LAB = {
  plane: { mirror: 'plane', start: 30, opts: [30, 25, 20, 15, 10], need: [30, 20] },
  convex: { mirror: 'convex', start: 30, opts: [30], need: [30] },
  real: { mirror: 'concave', start: 30, opts: [30], need: [30], screen: true },
  table: { mirror: 'concave', start: 20, opts: [30, 20, 15, 10, 6], need: [20, 15, 10, 6] }
};
const TASK = {
  plane: { title: '平面鏡：蠟燭靠近，像怎麼動？', goal: '蠟燭離鏡面 30 cm，先收下一次；再拖蠟燭（或按「20 cm」）到 20 cm，再收下一次。看鏡後的像跟著怎麼動。',
    intro: '點燃的蠟燭放在平面鏡前 30 cm。鏡子後面的虛線是什麼？',
    found: ['平面鏡的像在鏡後，和蠟燭到鏡面的距離一樣。', '30 cm → 鏡後 30 cm；20 cm → 鏡後 20 cm：正立、等大、虛像'] },
  convex: { title: '換成凸面鏡', goal: '蠟燭還是離鏡面 30 cm，只把鏡子換成凸面鏡。看像的大小和位置，再收下。',
    intro: '鏡面往外凸。像會比平面鏡大還是小？',
    found: ['凸面鏡的像變小了，還是正立的虛像。', '30 cm → 鏡後 7.5 cm，只有蠟燭的 1/4 大：看得到的範圍比較大'] },
  real: { title: '凹面鏡：用光屏接到像', goal: '凹面鏡焦距 10 cm，蠟燭在 30 cm。拖鏡前的光屏（或按按鈕），找到像最清楚的位置，再收下。',
    intro: '凹面鏡把光會聚起來。光屏放在哪裡，才接得到清楚的像？',
    found: ['光屏在鏡前 15 cm 接到清楚的像：倒立、縮小。', '反射光真的會聚在鏡前，所以光屏接得到：這是實像'] },
  table: { title: '凹面鏡：改變物距', goal: '同一面凹面鏡（焦距 10 cm）。把蠟燭依序放在 20、15、10、6 cm，每個位置各收下一次，看像怎麼變。',
    intro: '蠟燭越靠近凹面鏡，像會怎樣？經過焦點 F 時，注意看！',
    found: ['焦點外成倒立實像；焦點上不成像；焦點內變成正立、放大的虛像。', '20 cm 等大、15 cm 放大 2 倍、10 cm 不成像、6 cm 鏡後 15 cm 放大 2.5 倍'] },
  quiz: { title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。',
    intro: '最後三題！想想你收下的證據。',
    found: ['你分清實像和虛像了！', '實像在鏡前、倒立、接得到；虛像在鏡後、正立、接不到'] }
};
const QUIZ = [
  { q: '蠟燭離平面鏡 20 cm，像在哪裡？', options: [
    { text: '鏡前 20 cm', why: '平面鏡的像在鏡子後面，是反射光延長線的交點。' },
    { text: '鏡後 20 cm', ok: true },
    { text: '鏡後 30 cm', why: '你的證據：蠟燭移到 20 cm，像也變成鏡後 20 cm。' }] },
  { q: '同一面凹面鏡，哪一個情況可以用光屏接到像？', options: [
    { text: '物距 30 cm，像倒立、在鏡前。', ok: true },
    { text: '物距 6 cm，像正立、在鏡後。', why: '鏡後的像是延長線交會的虛像，光屏接不到。' },
    { text: '兩種都在鏡後，都接得到。', why: '30 cm 時像在鏡前 15 cm（實像）；6 cm 時像在鏡後 15 cm（虛像），只有實像接得到。' }] },
  { q: '路口轉角的反光鏡為什麼用凸面鏡？', options: [
    { text: '凸面鏡成放大的像，看得比較清楚。', why: '你的證據：凸面鏡的像是縮小的，只有蠟燭的 1/4 大。' },
    { text: '凸面鏡成正立、縮小的虛像，看得到的範圍比較大。', ok: true },
    { text: '凸面鏡能成實像，投影在路面上。', why: '凸面鏡只成虛像，在鏡後，光屏接不到。' }] }
];

/* ---------- 狀態 ---------- */
const fresh = () => ({ v: 1, step: 'plane', u: 30, scr: 22, records: [], done: [], quiz: { i: 0, pick: null } });
function loadState() {
  const s = db.load();
  try {
    if (!s || s.v !== 1 || !STEPS.some(x => x.id === s.step) || !Array.isArray(s.records) || !Array.isArray(s.done) || !s.quiz) throw 0;
    const L = LAB[s.step];
    if (L && !L.opts.includes(s.u)) throw 0;
    if (!Number.isInteger(s.scr) || s.scr < 5 || s.scr > 32) throw 0;
    if (s.records.some(r => !MIRRORS[r.mirror])) throw 0;
    return s;
  } catch { return fresh(); }
}
let S = loadState(), foundShown = null, lastNote = null;
const save = () => db.save(S);
const L = () => LAB[S.step];
const isLab = () => !!L();
const mirror = () => L()?.mirror || 'concave';
const has = (m, u) => S.records.some(r => r.mirror === m && r.u === u);
const sharp = () => { const o = optics(mirror(), S.u); return L()?.screen && o.kind === 'real' && Math.abs(S.scr - o.v) < 1e-9; };

const svg = $('#scene'), rig = $('#rig');
const teacher = new Teacher($('#teacher-pic'), $('#bubble'), $('#live'));
const el = (tag, a = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (parent) parent.append(n); return n; };
const txt = (parent, x, y, s, a = {}) => { const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#23304A', ...a }, parent); t.textContent = s; return t; };

/* ---------- 場景 ---------- */
const MX = 700, AX = 370, PX = 8, CH = 92, CW = 62;   // 鏡面 x、主軸 y、每 cm 像素、蠟燭高寬
const xAt = d => MX - d * PX;                            // d > 0 鏡前；d < 0 鏡後
function candle(parent, x, m, ghost) {
  // 以主軸上的底座中心為基準，m 為倍率（負號＝倒立）
  const g = el('g', { transform: `translate(${x} ${AX}) scale(${Math.abs(m)} ${m})`, opacity: ghost ? 0.55 : 1 }, parent);
  el('image', { href: P + 'prop-candle.webp', x: -CW / 2, y: -CH, width: CW, height: CH }, g);
  if (ghost) el('rect', { x: -CW / 2 - 3, y: -CH - 3, width: CW + 6, height: CH + 6, rx: 6, fill: 'none', stroke: '#2F6FB0', 'stroke-width': 2.5 / Math.abs(m), 'stroke-dasharray': `${6 / Math.abs(m)} ${4 / Math.abs(m)}` }, g);
}
function drawMirror(kind) {
  const h = 150;
  if (kind === 'plane') {
    el('image', { href: P + 'prop-plane-mirror.webp', x: MX - 12, y: AX - h - 20, width: 40, height: 2 * h + 60, preserveAspectRatio: 'none' }, rig);
    return;
  }
  const bend = kind === 'concave' ? -26 : 26;
  el('path', { d: `M ${MX + bend} ${AX - h} Q ${MX - bend} ${AX} ${MX + bend} ${AX + h}`, fill: 'none', stroke: '#9FC6E6', 'stroke-width': 10, 'stroke-linecap': 'round' }, rig);
  el('path', { d: `M ${MX + bend + 7} ${AX - h} Q ${MX - bend + 7} ${AX} ${MX + bend + 7} ${AX + h}`, fill: 'none', stroke: '#5A6478', 'stroke-width': 5, 'stroke-linecap': 'round' }, rig);
}
function ray(x1, y1, x2, y2, dashed, color = '#E0A21B') {
  el('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': dashed ? 2 : 3, 'stroke-dasharray': dashed ? '6 5' : '0', 'stroke-linecap': 'round' }, rig);
}
function drawBench() {
  const m = mirror(), o = optics(m, S.u), xo = xAt(S.u), tipY = AX - CH * 0.98;
  // 主軸與刻度
  el('line', { x1: 180, y1: AX, x2: 980, y2: AX, stroke: '#23304A', 'stroke-width': 1.5, 'stroke-dasharray': '8 6' }, rig);
  el('rect', { x: 190, y: 560, width: 780, height: 34, rx: 8, fill: '#FFF6DA', stroke: '#23304A', 'stroke-width': 2.5 }, rig);
  for (let d = -35; d <= 45; d += 5) {
    const x = xAt(d); if (x < 195 || x > 965) continue;
    el('line', { x1: x, y1: 560, x2: x, y2: d % 10 === 0 ? 574 : 568, stroke: '#23304A', 'stroke-width': 2 }, rig);
    if (d % 10 === 0) txt(rig, x, 590, String(Math.abs(d)), { 'font-size': 12, 'font-weight': 800 });
  }
  txt(rig, xAt(40), 548, '鏡前（cm）', { 'font-size': 13, fill: '#5A6478' });
  txt(rig, xAt(-28), 548, '鏡後（cm）', { 'font-size': 13, fill: '#5A6478' });
  // 鏡後區
  el('rect', { x: MX + 14, y: AX - 200, width: 340, height: 360, fill: 'rgba(47,111,176,.06)' }, rig);
  drawMirror(m === 'concave' ? 'concave' : m === 'convex' ? 'convex' : 'plane');
  el('rect', { x: MX - 50, y: AX - 196, width: 100, height: 28, rx: 14, fill: '#23304A' }, rig);
  txt(rig, MX, AX - 176, MIRRORS[m].name, { fill: '#fff', 'font-size': 15, 'font-weight': 900 });
  // 焦點
  if (m !== 'plane') {
    const xf = xAt(MIRRORS[m].f);
    el('circle', { cx: xf, cy: AX, r: 6, fill: '#C8372D' }, rig);
    txt(rig, xf, AX + 26, m === 'concave' ? 'F（10 cm）' : 'F（鏡後）', { 'font-size': 13, 'font-weight': 900, fill: '#C8372D' });
  }
  // 光線：平行主軸的光、射向鏡面中心的光
  const yi = o.kind === 'focus' ? null : AX - CH * 0.98 * o.m, xi = o.kind === 'focus' ? null : xAt(o.v);
  ray(xo, tipY, MX, tipY); ray(xo, tipY, MX, AX);
  if (o.kind === 'focus') {
    const xf = xAt(F), k = (AX - tipY) / (MX - xf);
    ray(MX, tipY, 200, tipY + k * (MX - 200));
    const k2 = (AX - tipY) / (MX - xo); ray(MX, AX, 200, AX + k2 * (MX - 200));
  } else {
    for (const hy of [tipY, AX]) {
      const dx = MX - xi, dy = hy - yi, ext = 200;
      if (o.kind === 'real') { const kk = (ext - MX) / (xi - MX); ray(MX, hy, ext, hy + (yi - hy) * kk); }
      else { const kk = (MX - ext) / dx; ray(MX, hy, ext, hy + dy * kk); ray(MX, hy, xi, yi, true, '#2F6FB0'); }
    }
  }
  // 蠟燭（物體，可拖動）
  const cg = el('g', { class: 'tool drag', tabindex: 0, role: 'slider', 'aria-label': '蠟燭：左右拖動改變物距', 'aria-valuetext': `物距 ${S.u} cm` }, rig);
  el('rect', { class: 'tool-ring', x: xo - CW / 2 - 10, y: AX - CH - 14, width: CW + 20, height: CH + 22, rx: 14, fill: 'rgba(255,255,255,.25)', stroke: L().opts.length > 1 && !readyToSave() ? '#E0A21B' : 'transparent', 'stroke-width': 4 }, cg);
  candle(cg, xo, 1, false);
  el('rect', { x: xo - 40, y: AX - CH - 14, width: 80, height: CH + 40, fill: 'transparent' }, cg);
  if (L().opts.length > 1 && !readyToSave()) cg.classList.add('cue');
  cg.addEventListener('pointerdown', e => startDrag(e, 'u'));
  cg.addEventListener('keydown', e => { const i = L().opts.indexOf(S.u); if (e.key === 'ArrowLeft') { e.preventDefault(); setU(L().opts[Math.max(0, i - 1)]); } if (e.key === 'ArrowRight') { e.preventDefault(); setU(L().opts[Math.min(L().opts.length - 1, i + 1)]); } });
  el('line', { x1: xo, y1: AX + 6, x2: MX, y2: AX + 6, stroke: '#C8372D', 'stroke-width': 2 }, rig);
  txt(rig, (xo + MX) / 2, AX + 50, `物距 ${S.u} cm`, { 'font-size': 15, 'font-weight': 900, fill: '#C8372D' });
  // 像
  if (o.kind === 'virtual') {
    candle(rig, xi, o.m, true);
    txt(rig, xi, Math.min(yi, AX - CH) - 16, '虛像（光屏接不到）', { 'font-size': 14, 'font-weight': 900, fill: '#2F6FB0' });
  } else if (o.kind === 'real' && (!L().screen || sharp())) {
    candle(rig, xi, o.m, false);
    txt(rig, xi, Math.max(yi, AX) + 22, '實像', { 'font-size': 15, 'font-weight': 900, fill: '#C8372D' });
  } else if (o.kind === 'focus') {
    el('rect', { x: MX - 360, y: AX + 96, width: 330, height: 36, rx: 12, fill: '#fff', stroke: '#C8372D', 'stroke-width': 2.5 }, rig);
    txt(rig, MX - 195, AX + 120, '反射光互相平行，沒有交點：不成像', { 'font-size': 15, 'font-weight': 900, fill: '#C8372D' });
  }
  // 光屏
  if (L().screen) {
    const xs = xAt(S.scr), ok = sharp();
    const sg = el('g', { class: 'tool drag', tabindex: 0, role: 'slider', 'aria-label': '光屏：左右拖動', 'aria-valuetext': `光屏離鏡面 ${S.scr} cm` }, rig);
    el('rect', { class: 'tool-ring', x: xs - 16, y: AX - 150, width: 32, height: 290, rx: 10, fill: 'transparent', stroke: ok ? 'transparent' : '#E0A21B', 'stroke-width': 4 }, sg);
    el('rect', { x: xs - 6, y: AX - 140, width: 12, height: 270, rx: 4, fill: 'rgba(255,255,255,.92)', stroke: '#5A6478', 'stroke-width': 2.5 }, sg);
    el('rect', { x: xs - 3, y: AX + 130, width: 6, height: 40, fill: '#8896A5' }, sg);
    el('rect', { x: xs - 26, y: AX + 166, width: 52, height: 10, rx: 4, fill: '#5A6478' }, sg);
    if (!ok) sg.classList.add('cue');
    sg.addEventListener('pointerdown', e => startDrag(e, 'scr'));
    sg.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { e.preventDefault(); setScr(S.scr + 1); } if (e.key === 'ArrowRight') { e.preventDefault(); setScr(S.scr - 1); } });
    // 光屏上看到的
    el('rect', { x: xs - 72, y: AX - 250, width: 144, height: 86, rx: 12, fill: '#fff', stroke: '#23304A', 'stroke-width': 2.5 }, rig);
    txt(rig, xs, AX - 232, `光屏 ${S.scr} cm`, { 'font-size': 13, 'font-weight': 900 });
    if (ok) { const g = el('g', { transform: `translate(${xs} ${AX - 212}) scale(0.38 -0.38)` }, rig); el('image', { href: P + 'prop-candle.webp', x: -CW / 2, y: -CH, width: CW, height: CH }, g); txt(rig, xs, AX - 172, '清楚！倒立', { 'font-size': 12, 'font-weight': 900, fill: '#2E7D63' }); }
    else { const blur = Math.min(26, 6 + Math.abs(S.scr - optics('concave', S.u).v) * 2.4); el('ellipse', { cx: xs, cy: AX - 200, rx: blur, ry: blur * 0.8, fill: 'rgba(240,170,60,.45)' }, rig); txt(rig, xs, AX - 172, '模糊', { 'font-size': 12, 'font-weight': 900, fill: '#C8372D' }); }
  }
}
function drawSummary() {
  drawMirror('concave');
  candle(rig, 420, 1, false);
  txt(rig, 560, 520, '證據都在左邊的成像紀錄裡', { 'font-size': 20, 'font-weight': 900 });
}
function draw() {
  const hadFocus = document.activeElement && rig.contains(document.activeElement) ? document.activeElement.getAttribute('aria-label') : null;
  rig.replaceChildren();
  if (isLab()) drawBench(); else drawSummary();
  if (hadFocus) { const f = [...rig.querySelectorAll('.tool')].find(n => n.getAttribute('aria-label') === hadFocus); if (f) f.focus({ preventScroll: true }); }
}

/* ---------- 操作 ---------- */
let drag = null;
function startDrag(e, what) { drag = what; e.preventDefault(); addEventListener('pointermove', moveDrag); addEventListener('pointerup', () => { drag = null; removeEventListener('pointermove', moveDrag); }, { once: true }); }
function moveDrag(e) {
  if (!drag) return;
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse()), d = (MX - p.x) / PX;
  if (drag === 'u') { const near = L().opts.reduce((a, b) => Math.abs(b - d) < Math.abs(a - d) ? b : a); setU(near); }
  else setScr(Math.round(d));
}
function setU(u) {
  if (!isLab() || u === S.u) return;
  if (!L().opts.includes(u)) return;
  S.u = u; foundShown = null; lastNote = null; save(); render();
}
function setScr(v) {
  if (!L()?.screen) return;
  const n = Math.max(5, Math.min(32, v));
  if (n === S.scr) return;
  S.scr = n; foundShown = null; lastNote = null; save(); render();
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
  const m = mirror(), u = isLab() ? S.u : 6, o = optics(m, u), hide = L()?.screen && !sharp();
  setReading(1, '物距', u, 'cm', `${MIRRORS[m].name}${m === 'plane' ? '' : '，焦距 10 cm'}`);
  setReading(2, '像的位置', hide ? '？' : o.kind === 'focus' ? '不成像' : (o.v > 0 ? '鏡前 ' : '鏡後 ') + cm(Math.abs(o.v)), hide || o.kind === 'focus' ? '' : 'cm', hide ? '移動光屏找清楚的像' : o.kind === 'real' ? '反射光真的會聚' : o.kind === 'virtual' ? '延長線交會' : '');
  setReading(3, '像', hide ? '？' : o.kind === 'focus' ? '不成像' : describe(o).split('、').slice(0, 2).join('、'), '', hide ? '' : o.kind === 'focus' ? '' : `${o.kind === 'real' ? '實像' : '虛像'}，倍率 ${cm(Math.abs(o.m))} 倍`);
}

/* ---------- 成像紀錄表 ---------- */
function drawTable() {
  const rows = S.records.slice(-4);
  $('#table').innerHTML = rows.length ? `<table><thead><tr><th>鏡子</th><th>物距</th><th>像的位置</th><th>像</th></tr></thead><tbody>${rows.map(r => {
    const o = optics(r.mirror, r.u);
    return `<tr><td>${MIRRORS[r.mirror].name}</td><td><b>${r.u}</b> cm</td><td>${where(o)}</td><td class="${o.kind === 'real' ? 'real' : o.kind === 'virtual' ? 'virt' : ''}">${describe(o)}</td></tr>`;
  }).join('')}</tbody></table>${S.records.length > 4 ? `<p>顯示最新 4 筆，全部在研究手冊。</p>` : ''}` : '<p>收下觀察後，結果會排在這裡，方便比較。</p>';
}

/* ---------- 余老師 ---------- */
function oops(t) { teacher.last = ''; teacher.say(t, { pose: 'think', tone: 'oops' }); lastNote = t; }
const readyToSave = () => isLab() && L().need.includes(S.u) && !has(mirror(), S.u) && (!L().screen || sharp());
const stepDone = () => isLab() && L().need.every(u => has(mirror(), u));
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
  const o = optics(mirror(), S.u), next = L().need.find(u => !has(mirror(), u));
  if (L().screen) {
    if (sharp()) { teacher.say('清楚了！光屏在鏡前 15 cm，接到倒立、縮小的像。收下這次觀察。', { pose: 'wow' }); return; }
    const d = optics('concave', S.u).v - S.scr;
    teacher.say(S.scr === fresh().scr && !S.records.some(r => r.mirror === 'concave') ? task.intro : `還是模糊。光屏再${d > 0 ? '遠離' : '靠近'}鏡子一點。`, { pose: 'point' }); return;
  }
  if (readyToSave()) { teacher.say(o.kind === 'focus' ? `物距 ${S.u} cm，蠟燭剛好在焦點上：反射光互相平行，不成像。收下這次觀察。` : `物距 ${S.u} cm：像在${where(o)}，${describe(o)}。收下這次觀察。`, { pose: 'wow' }); return; }
  if (!S.records.some(r => r.mirror === mirror())) { teacher.say(task.intro, { pose: 'point' }); return; }
  teacher.say(has(mirror(), S.u) ? `${S.u} cm 收下了。${next !== undefined ? `把蠟燭移到 ${next} cm。` : ''}` : `物距 ${S.u} cm：${where(o)}。${next !== undefined ? `這一步要收下的是 ${next} cm。` : ''}`, { pose: 'point' });
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
    const opts = L().opts;
    $('#ctl-box').hidden = opts.length < 2;
    $('#ctl-label').innerHTML = '蠟燭的位置 <small>拖蠟燭，或按下面的物距</small>';
    const box = $('#ctl-btns'); box.className = 'picker-btns ' + (opts.length > 3 ? 'three' : 'two');
    box.replaceChildren(...opts.map(u => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn-soft'; b.textContent = `${u} cm${has(mirror(), u) ? ' ✓' : ''}`; b.setAttribute('aria-pressed', String(S.u === u)); b.addEventListener('click', () => setU(u)); return b; }));
    $('#screen-box').hidden = !L().screen;
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
  chips.replaceChildren(...want.map(r => { const o = optics(r.mirror, r.u), li = document.createElement('li'); li.className = 'chip'; li.innerHTML = `<small>#${r.n} ${MIRRORS[r.mirror].name}・物距 ${r.u} cm</small><b>${where(o)}</b><span class="res${o.kind === 'real' ? '' : ' ok'}">${describe(o)}</span>`; return li; }));
}
function keep() {
  if (!isLab()) return;
  if (!readyToSave()) {
    const next = L().need.find(u => !has(mirror(), u));
    oops(L().screen && !sharp() ? '光屏上的像還是模糊的，先找到清楚的位置。' : next === undefined ? '這一步都收下了。' : has(mirror(), S.u) ? `${S.u} cm 已經收下了，把蠟燭移到 ${next} cm。` : `這一步要收下的是 ${next} cm。`); return;
  }
  if (S.records.length >= 60) { oops('手冊滿 60 張了，清空紀錄才能再收。'); return; }
  const o = optics(mirror(), S.u);
  S.records.push({ n: S.records.length + 1, at: new Date().toISOString(), mirror: mirror(), u: S.u, v: o.v, m: o.m, kind: o.kind });
  lastNote = null;
  if (stepDone() && !S.done.includes(S.step)) { S.done.push(S.step); foundShown = S.step; }
  save();
  const target = isVisible($('#evidence')) ? $('#evidence') : $('#note-count');
  fly($('#save'), target, `${S.u} cm → ${where(o)}`).then(() => { renderEvidence(); bump($('#note-count')); });
  render();
}
const isVisible = n => { const r = n.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };

/* ---------- 步驟 ---------- */
function goStep(id) {
  S.step = id; foundShown = null; lastNote = null;
  if (LAB[id]) { S.u = LAB[id].start; S.scr = fresh().scr; }
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
    const o = optics(r.mirror, r.u), tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.n}</td>` + [MIRRORS[r.mirror].name, `${r.u} cm`, where(o), describe(o)].map(c => `<td>${c}</td>`).join('');
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
    S.done.includes('plane') && '<li><b>平面鏡</b>：像在鏡後、距離相等，正立、等大的虛像</li>',
    S.done.includes('convex') && '<li><b>凸面鏡</b>：正立、縮小的虛像（1/4 大）</li>',
    S.done.includes('real') && '<li><b>凹面鏡 30 cm</b>：光屏在鏡前 15 cm 接到倒立、縮小的實像</li>',
    S.done.includes('table') && '<li><b>凹面鏡物距</b>：20 cm 等大、15 cm 放大、10 cm 不成像、6 cm 正立放大虛像</li>'
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
function fitScene() { svg.setAttribute('viewBox', narrow.matches ? '180 90 800 520' : '0 70 1000 540'); }
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
