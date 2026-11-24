// 體內恆定實驗桌：體溫調節與血糖的峰值、低點、回穩時間、激素全部來自 scripts/science/models.mjs 的 calculate('homeostasis')。
// 血糖曲線依這些數值畫出（示意）；數值是虛構的教學模型，不能用於健康判斷。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('homeostasis', { mode: s.mode, carb: s.carb, exercise: s.exercise, insulin: s.insulin, env: s.env });
const KIND = { cold: '偏冷', neutral: '適中', hot: '偏熱' };

const INK = '#23304A', ENVS = [10, 25, 35];
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const n1 = v => v.toFixed(1);
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('linearGradient', 'ho-epi', [[0, '#F3C9AE'], [1, '#E6AE90']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'ho-derm', [[0, '#F8DCCB'], [1, '#F2CDB8']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'ho-muscle', [[0, '#D9867A'], [1, '#B4594F']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('radialGradient', 'ho-fat', [[0, '#FFF6C8'], [1, '#F2D77E']], { cx: .4, cy: .35, r: .7 });
  g('linearGradient', 'ho-tube', [[0, '#DDEAF4'], [.35, '#FFFFFF'], [1, '#C9DCEA']]);
  g('radialGradient', 'ho-drop', [[0, '#FFFFFF'], [.4, '#BFE3F7'], [1, '#6FB4E0']], { cx: .35, cy: .3, r: .8 });
  g('radialGradient', 'ho-bowl', [[0, '#FFFFFF'], [1, '#D7DDE6']], { cx: .4, cy: .3, r: .9 });
  g('linearGradient', 'ho-pan', [[0, '#F6C9A8'], [1, '#E09A76']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  const cp = el('clipPath', { id: 'ho-skin' }, d); el('rect', { x: 120, y: 150, width: 520, height: 330, rx: 18 }, cp);
}
// 平滑曲線（Catmull-Rom 轉貝茲）
const smooth = pts => { let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}`; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
  d += `C${n1(p1[0] + (p2[0] - p0[0]) / 6)} ${n1(p1[1] + (p2[1] - p0[1]) / 6)} ${n1(p2[0] - (p3[0] - p1[0]) / 6)} ${n1(p2[1] - (p3[1] - p1[1]) / 6)} ${n1(p2[0])} ${n1(p2[1])}`; } return d; };

// 皮膚切面：表皮、真皮（毛囊、汗腺、微血管）、皮下脂肪、肌肉
function skin(el, txt, rig, r, reduce) {
  const L = 120, R = 640, top = 196, g = el('g', { 'clip-path': 'url(#ho-skin)' }, rig), kind = r.kind;
  el('rect', { x: L, y: 150, width: R - L, height: 52, fill: kind === 'cold' ? '#DCEBF7' : kind === 'hot' ? '#FFE6C7' : '#F4F0E6' }, g);
  const surf = x => top + 3 * Math.sin(x / 26) + (kind === 'cold' && Math.abs(((x - 220) % 160) - 80) < 12 ? -6 * Math.cos((((x - 220) % 160) - 80) / 12 * Math.PI / 2) : 0);
  let sd = `M${L} ${surf(L)}`; for (let x = L; x <= R; x += 6) sd += `L${x} ${n1(surf(x))}`;
  el('path', { d: sd + `L${R} 480L${L} 480Z`, fill: 'url(#ho-derm)' }, g);
  el('path', { d: sd + `L${R} 232Q${(L + R) / 2} 244 ${L} 232Z`, fill: 'url(#ho-epi)' }, g);
  let cells = ''; for (let x = L; x < R; x += 14) cells += `M${x} ${n1(surf(x) + 6)}l3 22`; el('path', { d: cells, stroke: '#D7967A', 'stroke-width': 1, opacity: .5 }, g);
  el('path', { d: sd, fill: 'none', stroke: '#B97357', 'stroke-width': 2.5 }, g);
  // 皮下脂肪與肌肉
  for (let i = 0; i < 26; i++) { const x = L + 10 + (i % 13) * 40 + (Math.floor(i / 13) % 2) * 20, y = 372 + Math.floor(i / 13) * 26; el('ellipse', { cx: x, cy: y, rx: 20, ry: 13, fill: 'url(#ho-fat)', stroke: '#D9B45A', 'stroke-width': 1.2 }, g); }
  const mus = el('g', { transform: kind === 'cold' && !reduce ? '' : '' }, g);
  el('rect', { x: L, y: 420, width: R - L, height: 60, fill: 'url(#ho-muscle)' }, mus);
  let fib = ''; for (let y = 428; y < 480; y += 9) fib += `M${L} ${y}C${L + 130} ${y - 4} ${L + 260} ${y + 4} ${R} ${y}`; el('path', { d: fib, fill: 'none', stroke: '#9E463E', 'stroke-width': 1.2, opacity: .6 }, mus);
  if (kind === 'cold' && !reduce) el('animateTransform', { attributeName: 'transform', type: 'translate', values: '0 0;2 0;-2 0;0 0', dur: '.18s', repeatCount: 'indefinite' }, mus);
  // 毛囊與毛髮（冷：豎起、起雞皮疙瘩）
  for (const hx of [220, 380, 540]) { const ang = kind === 'cold' ? -10 : -42, rad = ang * Math.PI / 180;
    el('path', { d: `M${hx - 9} ${surf(hx) + 4}Q${hx - 14} 290 ${hx - 6} 330h20Q${hx + 12} 290 ${hx + 8} ${surf(hx) + 4}`, fill: '#EDC2A6', stroke: '#B97357', 'stroke-width': 1.5 }, g);
    el('ellipse', { cx: hx + 4, cy: 330, rx: 12, ry: 8, fill: '#C98B68', stroke: '#8A5A3A', 'stroke-width': 1.2 }, g);
    const tilt = (kind === 'cold' ? 8 : 52) * Math.PI / 180; void rad;
    el('path', { d: `M${hx + 2} 326V${n1(surf(hx))}l${n1(44 * Math.sin(tilt))} ${n1(-44 * Math.cos(tilt))}`, fill: 'none', stroke: '#3B2A20', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    el('path', { d: `M${hx + 12} 300l26 -40`, stroke: '#C0574E', 'stroke-width': kind === 'cold' ? 5 : 3, 'stroke-linecap': 'round', opacity: .8 }, g); }
  // 汗腺（盤繞的管子，導管通到表面）
  for (const sx of [300, 460]) { let coil = `M${sx} ${surf(sx)}C${sx + 6} 240 ${sx - 6} 300 ${sx} 336`; for (let k = 0; k < 4; k++) coil += `c10 -6 14 8 4 12s-14 6 -4 12`;
    el('path', { d: coil, fill: 'none', stroke: '#7FB2E5', 'stroke-width': kind === 'hot' ? 5 : 3.5, 'stroke-linecap': 'round' }, g);
    if (kind === 'hot') el('path', { d: `M${sx} ${surf(sx)}C${sx + 6} 240 ${sx - 6} 300 ${sx} 336`, fill: 'none', stroke: '#2F86D6', 'stroke-width': 2, 'stroke-dasharray': '4 6' }, g); }
  // 微血管：熱時舒張（粗、紅），冷時收縮（細、暗）
  const w = { cold: 5, neutral: 11, hot: 20 }[kind], col = { cold: '#9E3A44', neutral: '#C8372D', hot: '#E2453A' }[kind];
  const v = `M${L} 282C${L + 90} 252 ${L + 160} 300 ${L + 260} 276S${R - 100} 250 ${R} 280`;
  el('path', { d: v, fill: 'none', stroke: '#7A1E24', 'stroke-width': w + 3, 'stroke-linecap': 'round', opacity: .5 }, g);
  el('path', { d: v, fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round' }, g);
  el('path', { d: v, fill: 'none', stroke: '#FF9C8E', 'stroke-width': w * .28, 'stroke-linecap': 'round', opacity: .8, transform: `translate(0 ${-w * .2})` }, g);
  if (kind === 'hot') for (let i = 0; i < 6; i++) { const x = L + 50 + i * 86 + rnd(i, 2) * 20, y = surf(x) - 8 - rnd(i, 3) * 10; el('path', { d: `M${n1(x)} ${n1(y - 12)}q-8 10 -7 16a7 7 0 0 0 14 0q1 -6 -7 -16z`, fill: 'url(#ho-drop)', stroke: '#4F93C4', 'stroke-width': 1.2 }, rig); }
  el('rect', { x: L, y: 150, width: R - L, height: 330, rx: 18, fill: 'none', stroke: INK, 'stroke-width': 3 }, rig);
  for (const [y, t] of [[216, '表皮'], [300, '真皮'], [380, '皮下脂肪'], [452, '肌肉']]) { el('rect', { x: R + 6, y: y - 13, width: t.length * 14 + 12, height: 22, rx: 6, fill: '#FFF8EC', stroke: '#C9BFAE' }, rig); txt(rig, R + 12 + t.length * 7, y + 3, t, { 'font-size': 12, fill: '#5A6478' }); }
  txt(rig, 300, 506, `皮膚血管${r.vessel}${kind === 'hot' ? '・流汗' : kind === 'cold' ? '・毛髮豎起・肌肉顫抖' : ''}`, { 'font-size': 16, fill: '#C8372D' });
}
function thermo(el, txt, g, x, top, bot, T) {
  const ty = t => bot - 26 - (bot - 26 - top - 14) * (t + 0) / 45;
  el('rect', { x: x - 30, y: top - 18, width: 60, height: bot - top + 40, rx: 16, fill: '#FFF8EC', stroke: INK, 'stroke-width': 2.5 }, g);
  el('rect', { x: x - 8, y: top, width: 16, height: bot - top - 14, rx: 8, fill: 'url(#ho-tube)', stroke: '#6E97BB', 'stroke-width': 2 }, g);
  for (const t of [0, 10, 20, 30, 40]) { el('path', { d: `M${x + 8} ${ty(t)}h8`, stroke: INK, 'stroke-width': 1.5 }, g); txt(g, x - 20, ty(t) + 4, String(t), { 'font-size': 10, fill: '#5A6478' }); }
  const col = el('rect', { x: x - 3.5, y: ty(T), width: 7, height: bot - 20 - ty(T), fill: '#D9342B' }, g);
  el('circle', { cx: x, cy: bot - 14, r: 12, fill: '#D9342B', stroke: '#6E97BB', 'stroke-width': 2 }, g);
  return { col, ty };
}

function scene({ rig, el, txt, s, r, step, set, drag, hint, kind, reduce }) {
  defs(el, rig);
  const can = kind === 'observe';
  if (s.mode === 'temp') {
    txt(rig, 380, 136, `環境 ${s.env} °C（${KIND[r.kind]}）`, { 'font-size': 20 });
    skin(el, txt, rig, r, reduce);
    // 環境溫度計：上下拖紅色液柱
    const TX = 760, T0 = 170, T1 = 460, th = el('g', { 'data-drag': can && step === 'temp' ? 'thermo' : null }, rig), m = thermo(el, txt, th, TX, T0, T1, s.env);
    el('rect', { x: TX - 30, y: T0 - 18, width: 60, height: T1 - T0 + 40, fill: 'transparent' }, th);
    txt(rig, TX, T1 + 48, '環境溫度', { 'font-size': 14, fill: '#5A6478' });
    if (can && step === 'temp') drag(th, () => { let T = s.env; return { move(p) { T = Math.max(0, Math.min(45, (T1 - 26 - p.y) / (T1 - 26 - T0 - 14) * 45)); m.col.setAttribute('y', m.ty(T)); m.col.setAttribute('height', T1 - 20 - m.ty(T)); },
      end() { const v = ENVS.reduce((a, x) => Math.abs(x - T) < Math.abs(a - T) ? x : a); if (v !== s.env) set({ env: v }); else { m.col.setAttribute('y', m.ty(s.env)); m.col.setAttribute('height', T1 - 20 - m.ty(s.env)); } }, cancel() { m.col.setAttribute('y', m.ty(s.env)); m.col.setAttribute('height', T1 - 20 - m.ty(s.env)); } }; },
      { label: '改環境溫度', tap: () => set({ env: ENVS[(ENVS.indexOf(s.env) + 1) % 3] }) });
    // 核心體溫
    el('rect', { x: 826, y: 200, width: 120, height: 220, rx: 18, fill: 'rgba(255,255,255,.95)', stroke: INK, 'stroke-width': 3 }, rig);
    txt(rig, 886, 232, '核心體溫', { 'font-size': 14, fill: '#5A6478' });
    el('circle', { cx: 886, cy: 262, r: 12, fill: '#F2C3A4', stroke: INK, 'stroke-width': 2 }, rig);
    el('path', { d: 'M868 282q18 -8 36 0l9 42q2 8 -6 8l-5 -3v48h-11v-36h-6v36h-11v-48l-5 3q-8 0 -6 -8z', fill: '#F2C3A4', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, rig);
    el('circle', { cx: 886, cy: 304, r: 7, fill: '#E2453A', opacity: .8 }, rig);
    txt(rig, 886, 402, '37 °C', { 'font-size': 22, fill: '#2E8B66' });
    txt(rig, 380, 534, r.method, { 'font-size': 15 });
    hint(760, 560, step === 'temp' ? '上下拖溫度計的紅色液柱' : '');
    return;
  }
  // 血糖曲線（0～6 小時）
  const gx = 360, gy = 470, W = 540, H = 290, t2x = t => gx + t / 6 * W, v2y = v => gy - (v - 40) / 160 * H;
  el('rect', { x: gx - 76, y: gy - H - 70, width: W + 108, height: H + 150, rx: 18, fill: 'rgba(255,255,255,.95)', stroke: INK, 'stroke-width': 3 }, rig);
  el('rect', { x: gx, y: v2y(110), width: W, height: v2y(80) - v2y(110), fill: '#E3F3EC' }, rig);
  txt(rig, gx + W - 6, v2y(110) - 6, '正常範圍 80～110', { 'text-anchor': 'end', 'font-size': 13, fill: '#2E8B66' });
  for (const v of [40, 80, 120, 160, 200]) { el('line', { x1: gx, y1: v2y(v), x2: gx + W, y2: v2y(v), stroke: '#ECE2D2' }, rig); txt(rig, gx - 12, v2y(v) + 5, String(v), { 'text-anchor': 'end', 'font-size': 13, fill: '#5A6478' }); }
  for (let t = 0; t <= 6; t++) txt(rig, t2x(t), gy + 22, `${t} h`, { 'font-size': 13, fill: '#5A6478' });
  txt(rig, gx - 56, gy - H - 12, '血糖（mg/dL）', { 'text-anchor': 'start', 'font-size': 14, fill: '#5A6478' });
  const pts = [[0, 90]];
  if (s.carb) pts.push([.5, r.peak], [Math.max(1.2, r.recovery * .55), (r.peak + 90) / 2 + (r.recovery > 3 ? 18 : 0)], [r.recovery, 92]);
  if (r.min < 90) { const t0 = Math.max(1, r.recovery); pts.push([t0 + .5, r.min], [t0 + 1.5, 88]); }
  pts.push([6, 90]);
  const P = pts.map(([t, v]) => [t2x(t), v2y(v)]), cd = smooth(P);
  el('path', { d: cd + `L${n1(t2x(6))} ${gy}L${gx} ${gy}Z`, fill: '#C8372D', opacity: .07 }, rig);
  el('path', { d: cd, fill: 'none', stroke: '#C8372D', 'stroke-width': 4, 'stroke-linecap': 'round' }, rig);
  if (s.carb) { const [x, y] = [t2x(.5), v2y(r.peak)]; el('circle', { cx: x, cy: y, r: 6, fill: '#C8372D', stroke: '#fff', 'stroke-width': 2 }, rig); txt(rig, x + 12, y - 10, `峰值 ${Math.round(r.peak)}`, { 'text-anchor': 'start', 'font-size': 15, fill: '#C8372D' }); }
  if (r.min < 80) { const t = Math.max(1, r.recovery) + .5; el('circle', { cx: t2x(t), cy: v2y(r.min), r: 6, fill: '#2F6FB0', stroke: '#fff', 'stroke-width': 2 }, rig); txt(rig, t2x(t), v2y(r.min) + 26, `最低 ${Math.round(r.min)}`, { 'font-size': 15, fill: '#2F6FB0' }); }
  txt(rig, gx + W / 2, gy - H - 40, `${s.carb ? `吃了 ${s.carb} g 醣類` : '沒有進食'}・運動 ${s.exercise} 分・胰島素${s.insulin === 'low' ? '不足' : '正常'}`, { 'font-size': 16 });
  txt(rig, gx + W / 2, gy + 56, r.hormones.length ? `${r.hormones.join('、')}分泌增加` : '沒有明顯的激素調節', { 'font-size': 17, fill: '#2F6FB0' });
  // 左：可以操作的東西（只有這一步用到的那一樣可以動）
  const graph = p => p.x > gx - 80 && p.y < gy + 30;
  const item = (y, key, active, label, drawIt, toggle) => { const on = can && active, g = el('g', { 'data-drag': on ? key : null, opacity: active ? 1 : .4 }, rig);
    el('rect', { x: 96, y: y - 58, width: 160, height: 116, rx: 16, fill: '#FFF8EC', stroke: on ? '#2E8B66' : '#C9BFAE', 'stroke-width': on ? 2.5 : 1.5, 'stroke-dasharray': on ? '7 4' : null }, g);
    drawIt(g, 176, y - 8); txt(g, 176, y + 46, label, { 'font-size': 13, fill: on ? '#1F6E50' : '#5A6478' });
    if (on) drag(g, () => ({ move(p, p0) { g.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`); }, end(p) { g.removeAttribute('transform'); if (graph(p)) toggle(); }, cancel() { g.removeAttribute('transform'); } }), { label, tap: toggle }); };
  item(178, 'bowl', step === 'meal', s.carb ? '已吃（點一下：不吃）' : '一碗飯 60 g 醣類', (g, x, y) => {
    el('path', { d: `M${x - 40} ${y - 4}h80q-4 34 -40 38q-36 -4 -40 -38z`, fill: 'url(#ho-bowl)', stroke: INK, 'stroke-width': 2 }, g); el('path', { d: `M${x - 30} ${y + 10}h60`, stroke: '#4F7FC4', 'stroke-width': 3 }, g);
    if (!s.carb) for (let i = 0; i < 18; i++) el('ellipse', { cx: x - 30 + (i % 9) * 7.5, cy: y - 8 - Math.floor(i / 9) * 6 - Math.sin(i % 9 / 8 * Math.PI) * 8, rx: 4, ry: 2.6, fill: '#FFFFFF', stroke: '#D7DDE6', 'stroke-width': .8 }, g);
    for (const dx of [-12, 12]) el('path', { d: `M${x + dx} ${y - 22}c-6 -8 6 -12 0 -20`, fill: 'none', stroke: '#C9D0DA', 'stroke-width': 2.5, opacity: s.carb ? 0 : .8 }, g); }, () => set({ carb: s.carb ? 0 : 60 }));
  item(318, 'pancreas', step === 'insulin', `胰臟：胰島素${s.insulin === 'low' ? '不足' : '正常'}`, (g, x, y) => {
    el('path', { d: `M${x - 52} ${y + 4}C${x - 50} ${y - 18} ${x - 20} ${y - 20} ${x} ${y - 10}C${x + 20} ${y - 2} ${x + 40} ${y - 14} ${x + 50} ${y - 6}C${x + 56} ${y + 2} ${x + 44} ${y + 12} ${x + 30} ${y + 10}C${x + 10} ${y + 8} ${x - 20} ${y + 22} ${x - 40} ${y + 20}C${x - 50} ${y + 18} ${x - 54} ${y + 12} ${x - 52} ${y + 4}Z`, fill: 'url(#ho-pan)', stroke: '#A2593A', 'stroke-width': 2 }, g);
    for (let i = 0; i < (s.insulin === 'low' ? 2 : 7); i++) el('circle', { cx: x - 34 + i * 11, cy: y - 26 - (i % 2) * 7, r: 3.5, fill: '#4F93C4' }, g); }, () => set({ insulin: s.insulin === 'low' ? 'normal' : 'low' }));
  item(458, 'shoe', step === 'exercise', s.exercise ? '跑了 30 分（點一下：不跑）' : '慢跑 30 分鐘', (g, x, y) => {
    el('path', { d: `M${x - 46} ${y + 14}q0 -26 16 -30l18 4q8 10 22 10l22 6q14 4 14 14v6h-92z`, fill: '#E2453A', stroke: INK, 'stroke-width': 2 }, g);
    el('path', { d: `M${x - 48} ${y + 20}h96v8h-96z`, fill: '#F4F7FA', stroke: INK, 'stroke-width': 1.8 }, g);
    el('path', { d: `M${x - 18} ${y - 8}l12 6M${x - 12} ${y - 14}l12 6`, stroke: '#fff', 'stroke-width': 2 }, g); }, () => set({ exercise: s.exercise ? 0 : 30 }));
  hint(gx + W / 2, 596, step === 'meal' ? '把飯拖到圖上，或點一下' : step === 'insulin' ? '點胰臟，改胰島素分泌' : step === 'exercise' ? '把球鞋拖到圖上，或點一下' : '');
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: s => s.mode === 'temp' ? `環境 ${s.env} °C` : `${s.carb ? `醣類 ${s.carb} g` : '不進食'}${s.exercise ? `・運動 ${s.exercise} 分` : ''}・胰島素${s.insulin === 'low' ? '不足' : '正常'}`,
  body: (s, r) => s.mode === 'temp' ? `血管${r.vessel}，${r.method}` : `峰值 ${Math.round(r.peak)}、最低 ${Math.round(r.min)}${r.recovery ? `，${r.recovery} 小時回穩` : ''}${r.hormones.length ? `；${r.hormones.join('、')}增加` : ''}` });
const G = { mode: 'glucose', carb: 0, exercise: 0, insulin: 'normal', env: 25 };

runDesk({
  key: 'bhcs.lab.homeostasis.v1', title: '體內恆定實驗桌', background: 'bg-chem-bench',
  sceneLabel: '體內恆定實驗桌：體溫調節時是皮膚切面（表皮、真皮裡的毛囊、汗腺、微血管、皮下脂肪、肌肉），右邊溫度計可以上下拖；血糖調節時右邊是血糖曲線，左邊的飯、胰臟、球鞋可以拖到圖上或直接點',
  initial: { mode: 'temp', carb: 0, exercise: 0, insulin: 'normal', env: 25 },
  model, scene, viewBox: { desk: '80 100 880 520', phone: '80 100 880 520' }, phoneText: 1.4,
  readouts: (s, r) => s.mode === 'temp'
    ? [['環境溫度', s.env, '°C', KIND[r.kind]], ['皮膚血管', r.vessel === '無明顯變化' ? '不變' : r.vessel, '', r.kind === 'neutral' ? '無明顯變化' : ''], ['核心體溫', 37, '°C', '維持恆定']]
    : [['血糖峰值', Math.round(r.peak), 'mg/dL', s.carb ? `吃 ${s.carb} g 醣類` : '沒有進食'], ['血糖最低', Math.round(r.min), 'mg/dL', s.exercise ? `運動 ${s.exercise} 分` : ''], ['回穩時間', r.recovery || '—', r.recovery ? '小時' : '', r.hormones.join('、') || '不需調節']],
  why: { title: '體溫與血糖的恆定', button: '恆定怎麼做', html: `
    <p class="fn-tip"><b>恆定性：</b>外界改變時，身體會自動調節，讓體溫、血糖等維持在穩定範圍。</p>
    <p class="fn-tip"><b>體溫：</b>冷的時候皮膚血管收縮、肌肉顫抖產熱；熱的時候皮膚血管舒張、流汗散熱。核心體溫維持約 37 °C。</p>
    <p class="fn-tip"><b>血糖：</b>吃飯後血糖升高，胰臟分泌胰島素，讓血糖降回來；運動或空腹使血糖降低，胰臟分泌升糖素，讓血糖升回來。胰島素不足時，血糖降不下來（糖尿病的原因之一）。</p>
    <p class="fn-tip">模型說明：數值是虛構的教學模型，曲線只是示意，不能用來判斷健康。</p>` },
  steps: [
    { id: 'temp', label: '體溫調節', title: '天氣冷熱，身體怎麼保持 37 °C？', goal: '把環境溫度調成 10 °C、25 °C、35 °C，看皮膚血管和調節方式，各收一張。',
      intro: '換換看環境溫度，注意皮膚裡的血管和汗珠！', enter: { mode: 'temp', env: 25 },
      controls: [{ key: 'env', label: '環境溫度', type: 'seg', options: [[10, '10 °C'], [25, '25 °C'], [35, '35 °C']] }],
      react: (s, r) => `${s.env} °C：血管${r.vessel}，${r.method}。`,
      targets: [tgt('cold', '10 °C', { mode: 'temp', env: 10 }, '選 10 °C。'), tgt('mid', '25 °C', { mode: 'temp', env: 25 }, '選 25 °C。'), tgt('hot', '35 °C', { mode: 'temp', env: 35 }, '選 35 °C。')],
      found: ['冷時血管收縮、顫抖產熱；熱時血管舒張、流汗散熱；核心體溫都是 37 °C。', '減少或增加散熱，讓體溫維持恆定'] },
    { id: 'meal', label: '飯後血糖', title: '吃飯後，血糖怎麼變？', goal: '比較「不進食」和「吃 60 g 醣類」的血糖曲線，各收一張。',
      intro: '吃一碗飯後，血糖會一直升高嗎？', enter: { ...G },
      controls: [{ key: 'carb', label: '進食的醣類', type: 'seg', options: [[0, '不進食'], [60, '60 g']], cols: 2 }],
      react: (s, r) => s.carb ? `血糖升到 ${Math.round(r.peak)}，胰島素讓它 ${r.recovery} 小時回到 90。` : '血糖維持在 90。',
      targets: [tgt('m0', '不進食', { ...G }, '選「不進食」。'), tgt('m60', '吃 60 g 醣類', { ...G, carb: 60 }, '選「60 g」。')],
      found: ['飯後血糖升高，胰島素分泌增加，約 2 小時回到正常。', '血糖高 → 胰島素 → 血糖降回來'] },
    { id: 'insulin', label: '胰島素不足', title: '胰島素不足時，會怎樣？', goal: '同樣吃 60 g 醣類，比較胰島素正常和不足的曲線，各收一張。',
      intro: '如果胰島素分泌不足，血糖降得回來嗎？', enter: { ...G, carb: 60, insulin: 'low' },
      controls: [{ key: 'insulin', label: '胰島素分泌', type: 'seg', options: [['normal', '正常'], ['low', '不足']], cols: 2 }],
      react: (s, r) => `峰值 ${Math.round(r.peak)}，${r.recovery} 小時才回穩。`,
      targets: [tgt('in', '胰島素正常', { ...G, carb: 60, insulin: 'normal' }, '選「正常」。'), tgt('il', '胰島素不足', { ...G, carb: 60, insulin: 'low' }, '選「不足」。')],
      found: ['胰島素不足時，血糖升得更高（186），要 5 小時才回穩。', '胰島素是唯一能讓血糖降低的激素'] },
    { id: 'exercise', label: '運動時', title: '運動很久，血糖太低怎麼辦？', goal: '不進食的情況下，比較運動 0 分和 30 分的血糖，各收一張。',
      intro: '空腹去跑步 30 分鐘，血糖會怎樣？', enter: { ...G, exercise: 30 },
      controls: [{ key: 'exercise', label: '運動時間', type: 'seg', options: [[0, '0 分'], [30, '30 分']], cols: 2 }],
      react: (s, r) => r.min < 80 ? `血糖降到 ${Math.round(r.min)}，升糖素把它拉回來。` : '血糖維持在 90。',
      targets: [tgt('e0', '運動 0 分', { ...G }, '選「0 分」。'), tgt('e30', '運動 30 分', { ...G, exercise: 30 }, '選「30 分」。')],
      found: ['血糖低於 80 時，升糖素分泌增加，讓血糖回升。', '胰島素降血糖、升糖素升血糖，一起維持恆定'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想身體怎麼調節。',
      found: ['你把體內恆定弄懂了！', '身體用回饋調節，把體溫和血糖拉回正常'] }
  ],
  quiz: [
    { q: '天氣很熱時，皮膚的血管會？', options: [
      { text: '收縮，減少散熱。', why: '那是冷的時候。你的證據：35 °C 時血管舒張，讓更多熱從皮膚散掉。' },
      { text: '舒張，增加散熱。', ok: true },
      { text: '沒有變化。', why: '熱的時候血管舒張、還會流汗散熱。' }] },
    { q: '吃完飯後，讓血糖降回正常的激素是？', options: [
      { text: '升糖素。', why: '升糖素是讓血糖「升高」的。你的證據：飯後是胰島素增加。' },
      { text: '胰島素。', ok: true },
      { text: '腎上腺素。', why: '本實驗中，飯後讓血糖降回來的是胰臟分泌的胰島素。' }] },
    { q: '胰島素分泌不足的人，飯後血糖會？', options: [
      { text: '升得比較低。', why: '你的證據：胰島素不足時峰值 186，比正常的 138 高。' },
      { text: '升得比較高，而且很久才降回來。', ok: true },
      { text: '完全不會升高。', why: '吃了醣類血糖一定會升高，問題是降不下來。' }] }
  ],
  finish: { title: '你把體內恆定弄懂了！', rule: '冷時血管收縮、顫抖；熱時血管舒張、流汗，核心體溫維持 37 °C。血糖高時胰島素讓它下降，血糖低時升糖素讓它上升。', next: { label: '去酵素實驗桌', href: '../enzyme/' } }
});
