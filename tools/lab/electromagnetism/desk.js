// 電磁實驗桌：線圈磁場用 scripts/science/models.mjs 的 calculate('electromagnetism')（空心螺線管 B ＝ μ₀NI/ℓ）。
// 吸起的迴紋針數與檢流計偏轉格數是教學示意（與磁場、磁通量變化成正比），不是實測。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const SPEED = { slow: 1, fast: 2 }, MOTION = { still: '不動', in: '插入線圈', out: '拉出線圈' };
function model(s) {
  if (s.mode === 'magnet') {
    const r = calculate('electromagnetism', { mode: 'magnet', turns: s.turns, current: s.current, field: 0, angle: 0, rpm: 0 });
    const mT = r.field * 1000;
    return { mT, clips: Math.round(Math.abs(mT) * 8), north: s.current > 0 ? 'right' : s.current < 0 ? 'left' : null };
  }
  const dir = s.motion === 'in' ? 1 : s.motion === 'out' ? -1 : 0;
  return { deflect: dir * SPEED[s.speed] * s.turns / 50, dir };
}
const mt = x => String(Math.round(Math.abs(x) * 1000) / 1000);

const n1 = v => (+v).toFixed(1);
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (id, stops, a = {}) => { const n = el(a.r ? 'radialGradient' : 'linearGradient', { id, ...(a.r ? {} : { x1: 0, y1: a.v ? 0 : 0, x2: a.v ? 0 : 1, y2: a.v ? 1 : 0 }) }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('em-tube', [[0, '#E9D6B0'], [.45, '#F6E9CF'], [1, '#C9AE7E']], { v: 1 });
  g('em-cu', [[0, '#8E3F16'], [.4, '#F2A66A'], [1, '#9C4A1E']], { v: 1 });
  g('em-n', [[0, '#F07A6E'], [.5, '#D8443A'], [1, '#A82A22']], { v: 1 });
  g('em-s', [[0, '#79A8E0'], [.5, '#3C74C0'], [1, '#2A5590']], { v: 1 });
  g('em-cell', [[0, '#3C4250'], [.4, '#6B7384'], [1, '#2C313C']], { v: 1 });
  g('em-brass', [[0, '#F3D27A'], [1, '#B8902E']], { v: 1 });
  g('em-face', [[0, '#FFFDF6'], [1, '#EFE6D2']], { r: 1 });
  for (const [k, c] of [['r', '#C8372D'], ['b', '#2F6FB0'], ['g', '#8792A6']]) { const m = el('marker', { id: 'em-' + k, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: c }, m); }
}
// 線圈：紙管上繞銅線；used 之後的圈數畫淡一點（沒接上）
function coil(el, txt, g, x0, x1, cy, loops, used, taps) {
  const h = 40, q = el('g', {}, g);
  el('rect', { x: x0 - 18, y: cy - h + 6, width: x1 - x0 + 36, height: 2 * h - 12, rx: 10, fill: 'url(#em-tube)', stroke: '#8A6A3C', 'stroke-width': 2 }, q);
  el('ellipse', { cx: x0 - 18, cy, rx: 10, ry: h - 6, fill: '#D8C49A', stroke: '#8A6A3C', 'stroke-width': 2 }, q);
  const step = (x1 - x0) / loops;
  for (let i = 0; i < loops; i++) { const x = x0 + step * (i + .5), on = i < used;
    el('path', { d: `M${n1(x - 3)} ${cy - h}Q${n1(x - 10)} ${cy} ${n1(x - 3)} ${cy + h}`, fill: 'none', stroke: on ? '#7A3A16' : '#C9B79A', 'stroke-width': 3, opacity: .55 }, q);
    el('path', { d: `M${n1(x - 3)} ${cy + h}Q${n1(x + 9)} ${cy} ${n1(x + 3)} ${cy - h}`, fill: 'none', stroke: on ? 'url(#em-cu)' : '#D9C8AA', 'stroke-width': on ? 5.5 : 4, 'stroke-linecap': 'round' }, q); }
  for (const [x, lab, on] of taps) { el('rect', { x: x - 6, y: cy + h - 4, width: 12, height: 18, rx: 3, fill: 'url(#em-brass)', stroke: '#7A5A1C', 'stroke-width': 1.5 }, q); el('circle', { cx: x, cy: cy + h + 16, r: 6, fill: 'url(#em-brass)', stroke: '#7A5A1C', 'stroke-width': 1.5 }, q);
    if (lab) txt(q, x + 26, cy + h + 20, lab, { 'font-size': 12, fill: on ? '#C8372D' : '#8792A6', 'font-weight': on ? 800 : 500 }); }
  return q;
}
const wire = (el, g, d, c = '#C8372D') => { el('path', { d, fill: 'none', stroke: '#23304A', 'stroke-width': 6, 'stroke-linecap': 'round' }, g); el('path', { d, fill: 'none', stroke: c, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, g); };
const clip = (el, g, x, y) => { el('path', { d: `M${x - 9} ${y + 2}l9 -12l9 12z`, fill: '#C8372D', stroke: '#6E1E18', 'stroke-width': 1.5 }, g); el('circle', { cx: x, cy: y - 8, r: 3, fill: '#F3D27A' }, g); };
function cell(el, txt, g, x, y, flip) { // 一顆電池，長 92，flip 時正極朝左
  const q = el('g', { transform: flip ? `rotate(180 ${x} ${y})` : null }, g);
  el('rect', { x: x - 46, y: y - 16, width: 86, height: 32, rx: 6, fill: 'url(#em-cell)', stroke: '#1C2028', 'stroke-width': 2 }, q);
  el('rect', { x: x + 6, y: y - 16, width: 34, height: 32, fill: '#E5A43B', opacity: .9 }, q);
  el('rect', { x: x + 40, y: y - 7, width: 7, height: 14, rx: 2, fill: '#C9CED6', stroke: '#1C2028', 'stroke-width': 1.5 }, q);
  txt(q, x + 24, y + 5, '+', { 'font-size': 16, fill: '#23304A', 'font-weight': 900 }); txt(q, x - 30, y + 5, '−', { 'font-size': 16, fill: '#fff', 'font-weight': 900 });
  return q;
}
function paperclip(el, g, x, y, a = 0) {
  el('path', { d: `M${x} ${y}v22a5 5 0 0 0 10 0v-18a3.5 3.5 0 0 0 -7 0v15`, fill: 'none', stroke: '#8E99A8', 'stroke-width': 2.4, 'stroke-linecap': 'round', transform: `rotate(${a} ${x + 5} ${y})` }, g);
}
function compass(el, txt, g, x, y, ang) {
  el('circle', { cx: x + 2, cy: y + 4, r: 50, fill: '#000', opacity: .12 }, g);
  el('circle', { cx: x, cy: y, r: 50, fill: 'url(#em-brass)', stroke: '#7A5A1C', 'stroke-width': 2 }, g);
  el('circle', { cx: x, cy: y, r: 42, fill: 'url(#em-face)', stroke: '#B8902E', 'stroke-width': 1.5 }, g);
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r0 = i % 4 ? 36 : 32; el('line', { x1: n1(x + r0 * Math.cos(a)), y1: n1(y + r0 * Math.sin(a)), x2: n1(x + 40 * Math.cos(a)), y2: n1(y + 40 * Math.sin(a)), stroke: '#8A6A3C', 'stroke-width': i % 4 ? 1 : 2 }, g); }
  const nd = el('g', { transform: `rotate(${ang} ${x} ${y})` }, g);
  el('path', { d: `M${x} ${y - 5}L${x + 34} ${y}L${x} ${y + 5}Z`, fill: '#D8443A', stroke: '#7A1E17', 'stroke-width': 1 }, nd);
  el('path', { d: `M${x} ${y - 5}L${x - 34} ${y}L${x} ${y + 5}Z`, fill: '#E3E6EB', stroke: '#5A6478', 'stroke-width': 1 }, nd);
  el('circle', { cx: x, cy: y, r: 4, fill: '#B8902E', stroke: '#5A4314', 'stroke-width': 1 }, g);
}
function barMagnet(el, txt, g, x, y, w = 200) { // N 在右端（朝線圈）
  const q = el('g', {}, g);
  el('rect', { x: x + 3, y: y - 18, width: w, height: 40, rx: 6, fill: '#000', opacity: .15 }, q);
  el('rect', { x, y: y - 20, width: w / 2, height: 40, rx: 6, fill: 'url(#em-s)', stroke: '#1C2028', 'stroke-width': 2 }, q);
  el('rect', { x: x + w / 2, y: y - 20, width: w / 2, height: 40, rx: 6, fill: 'url(#em-n)', stroke: '#1C2028', 'stroke-width': 2 }, q);
  el('rect', { x: x + 6, y: y - 15, width: w - 12, height: 6, rx: 3, fill: '#fff', opacity: .3 }, q);
  txt(q, x + w * .25, y + 8, 'S', { fill: '#fff', 'font-size': 22, 'font-weight': 900 }); txt(q, x + w * .75, y + 8, 'N', { fill: '#fff', 'font-size': 22, 'font-weight': 900 });
  return q;
}

const TAPX = { 50: 415, 100: 500, 200: 670 };
function magnetScene({ rig, el, txt, s, r, step, set, drag, hint, kind }) {
  const can = kind === 'observe', cy = 300, X0 = 330, X1 = 670, loops = 20, used = Math.round(loops * s.turns / 200), on = s.current !== 0, flip = s.current < 0;
  // 磁力線（N 出 S 入）
  if (on) { const g = el('g', { opacity: .5 }, rig);
    for (const k of [1, 2]) for (const sy of [-1, 1]) { const ry = 60 + k * 34, d = `M${r.north === 'right' ? 700 : 300} ${cy}C${r.north === 'right' ? 760 : 240} ${cy + sy * ry} ${r.north === 'right' ? 240 : 760} ${cy + sy * ry} ${r.north === 'right' ? 300 : 700} ${cy}`;
      el('path', { d, fill: 'none', stroke: '#8792A6', 'stroke-width': 1.6, 'stroke-dasharray': '6 5' }, g);
      const mid = r.north === 'right' ? -1 : 1; el('path', { d: `M${500 - mid * 6} ${n1(cy + sy * ry * .75)}l${mid * 12} 0`, stroke: '#8792A6', 'stroke-width': 2, 'marker-end': 'url(#em-g)' }, g); } }
  coil(el, txt, rig, X0, X1, cy, loops, used, [[X0, '', false], ...Object.entries(TAPX).map(([t, x]) => [x, `${t} 匝`, +t === s.turns])]);
  if (on) for (const [x, N] of [[262, r.north === 'left'], [738, r.north === 'right']]) { el('circle', { cx: x, cy, r: 22, fill: N ? '#D8443A' : '#3C74C0', stroke: '#23304A', 'stroke-width': 2.5 }, rig); txt(rig, x, cy + 8, N ? 'N' : 'S', { fill: '#fff', 'font-size': 20, 'font-weight': 900 }); }
  // 迴紋針掛在右端
  const n = Math.min(r.clips, 25), chains = Math.ceil(n / 5);
  for (let c = 0; c < chains; c++) { const k = Math.min(5, n - c * 5); for (let i = 0; i < k; i++) paperclip(el, rig, 752 + c * 20 + (i % 2 ? 2 : 0), 324 + i * 27, (i % 2 ? 6 : -6) + c * 2); }
  for (let i = 0; i < 9; i++) paperclip(el, rig, 770 + i * 14, 520 + (i % 3) * 3, 80 + i * 11);
  el('path', { d: 'M752 548h150', stroke: '#B8AC98', 'stroke-width': 3, 'stroke-linecap': 'round' }, rig);
  txt(rig, 840, 300, n ? `吸起 ${r.clips} 根` : '吸不起來', { 'font-size': 16, fill: '#C8372D' });
  // 指北針：N 端指向線圈的 S 極
  compass(el, txt, rig, 150, cy, r.north === 'right' ? 0 : r.north === 'left' ? 180 : -90);
  txt(rig, 150, cy + 72, '指北針', { 'font-size': 14, fill: '#5A6478' });
  // 電池座與導線
  const bx = 500, by = 470, cells = Math.abs(s.current) || 1;
  el('rect', { x: bx - 110, y: by - 28, width: 220, height: 56, rx: 10, fill: '#3E4656', stroke: '#1C2028', 'stroke-width': 2 }, rig);
  const tx = TAPX[s.turns];
  wire(el, rig, `M${bx - 110} ${by}H${X0 + 14}Q${X0} ${by} ${X0} ${by - 14}V${cy + 70}`, flip ? '#3A3F48' : '#C8372D');
  wire(el, rig, `M${bx + 110} ${by}H706Q720 ${by} 720 ${by - 14}V418Q720 404 706 404H${tx + 14}Q${tx} 404 ${tx} 390V${cy + 70}`, flip ? '#C8372D' : '#3A3F48');
  clip(el, rig, X0, cy + 70);
  const pg = el('g', { 'data-drag': can && step === 'pole' ? 'battery' : null }, rig);
  el('rect', { x: bx - 106, y: by - 24, width: 212, height: 48, fill: 'transparent' }, pg);
  // 電池排成串聯：flip 時正極朝左
  if (cells === 2) { cell(el, txt, pg, bx - 50, by, !flip); cell(el, txt, pg, bx + 50, by, !flip); }
  else { cell(el, txt, pg, bx - 50, by, !flip); el('rect', { x: bx + 4, y: by - 4, width: 92, height: 8, rx: 4, fill: '#8A93A3' }, pg); }
  txt(rig, bx, by + 48, `${cells} 顆電池・${Math.abs(s.current)} A${flip ? '（反接）' : ''}`, { 'font-size': 14 });
  // 夾子接在選的匝數上（拖）
  const cg = el('g', { 'data-drag': can && step === 'strength' ? 'tap' : null }, rig), cm = el('g', {}, cg);
  clip(el, cm, tx, cy + 70); el('circle', { cx: tx, cy: cy + 64, r: 18, fill: 'transparent' }, cm);
  if (can && step === 'strength') drag(cg, p0 => { let x = tx; return {
    move(p) { x = p.x; cm.setAttribute('transform', `translate(${n1(p.x - p0.x)} ${n1(p.y - p0.y)})`); },
    end() { const v = +Object.entries(TAPX).reduce((m, e) => Math.abs(e[1] - x) < Math.abs(m[1] - x) ? e : m)[0]; if (v !== s.turns) set({ turns: v }); else cm.removeAttribute('transform'); },
    cancel() { cm.removeAttribute('transform'); } }; },
    { label: '把夾子換到下一個接點', tap: () => set({ turns: { 50: 100, 100: 200, 200: 50 }[s.turns] }) });
  // 第二顆電池：拖進或拖出電池座
  if (step === 'strength') {
    const sx = cells === 2 ? bx + 50 : 196, sy = by;
    if (cells === 1) { el('rect', { x: 134, y: 446, width: 124, height: 48, rx: 10, fill: 'rgba(255,255,255,.7)', stroke: '#8792A6', 'stroke-dasharray': '5 4' }, rig); txt(rig, 196, 512, '備用電池', { 'font-size': 12, fill: '#5A6478' }); }
    const sg = el('g', { 'data-drag': can ? 'cell' : null }, rig), sm = el('g', {}, sg);
    if (cells === 1) cell(el, txt, sm, sx, sy, false);
    el('rect', { x: sx - 48, y: sy - 18, width: 96, height: 36, fill: 'transparent' }, sm);
    if (can) drag(sg, p0 => { let q = p0; return {
      move(p) { q = p; sm.setAttribute('transform', `translate(${n1(p.x - p0.x)} ${n1(p.y - p0.y)})`); },
      end() { const inHolder = Math.abs(q.x - (bx + 50)) < 70 && Math.abs(q.y - by) < 40; const v = inHolder ? 2 : 1; if (v !== cells) set({ current: v }); else sm.removeAttribute('transform'); },
      cancel() { sm.removeAttribute('transform'); } }; },
      { label: cells === 2 ? '拿掉一顆電池' : '再放一顆電池', tap: () => set({ current: cells === 2 ? 1 : 2 }) });
  }
  if (can && step === 'pole') drag(pg, () => ({ move() {}, end() { set({ current: -s.current }); }, cancel() {} }), { label: '把電池反過來裝', tap: () => set({ current: -s.current }) });
  txt(rig, 500, 200, `線圈 ${s.turns} 匝`, { 'font-size': 17 });
  hint(500, 568, step === 'strength' ? '拖夾子換匝數；把備用電池拖進電池座' : step === 'pole' ? '點電池座，把電池反過來裝' : '');
}

const MX = { still: 120, in: 380, out: 210 };
function induceScene({ rig, el, txt, s, r, step, set, drag, hint, kind }) {
  const can = kind === 'observe', cy = 290, X0 = 460, X1 = 760, loops = 20, used = Math.round(loops * s.turns / 200), T = { 100: 610, 200: 760 };
  coil(el, txt, rig, X0, X1, cy, loops, used, [[X0, '', false], [T[100], '100 匝', s.turns === 100], [T[200], '200 匝', s.turns === 200]]);
  // 檢流計
  const gx = 610, gy = 500;
  el('rect', { x: gx - 80, y: gy - 74, width: 160, height: 104, rx: 14, fill: '#F7F3EA', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('path', { d: `M${gx - 58} ${gy}A62 62 0 0 1 ${gx + 58} ${gy}`, fill: 'none', stroke: '#B8AC98', 'stroke-width': 2 }, rig);
  for (let k = -4; k <= 4; k++) { const a = (k * 12 - 90) * Math.PI / 180; el('line', { x1: n1(gx + 50 * Math.cos(a)), y1: n1(gy + 50 * Math.sin(a)), x2: n1(gx + (k ? 58 : 62) * Math.cos(a)), y2: n1(gy + (k ? 58 : 62) * Math.sin(a)), stroke: '#23304A', 'stroke-width': k ? 1.5 : 2.5 }, rig); }
  txt(rig, gx - 50, gy - 46, '左', { 'font-size': 11, fill: '#5A6478' }); txt(rig, gx + 50, gy - 46, '右', { 'font-size': 11, fill: '#5A6478' });
  const na = (Math.max(-4, Math.min(4, r.deflect)) * 12 - 90) * Math.PI / 180;
  el('line', { x1: gx, y1: gy, x2: n1(gx + 56 * Math.cos(na)), y2: n1(gy + 56 * Math.sin(na)), stroke: '#C8372D', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, rig);
  el('circle', { cx: gx, cy: gy, r: 6, fill: '#23304A' }, rig);
  txt(rig, gx, gy + 22, '檢流計 G', { 'font-size': 13, fill: '#5A6478' });
  wire(el, rig, `M${X0} ${cy + 70}V${gy - 14}Q${X0} ${gy} ${X0 + 14} ${gy}H${gx - 80}`, '#3A3F48');
  const tx = T[s.turns];
  wire(el, rig, `M${gx + 80} ${gy}H826Q840 ${gy} 840 ${gy - 14}V408Q840 394 826 394H${tx + 14}Q${tx} 394 ${tx} 380V${cy + 70}`, '#C8372D');
  clip(el, rig, X0, cy + 70);
  const cg = el('g', { 'data-drag': can && step === 'turns' ? 'tap' : null }, rig), cm = el('g', {}, cg);
  clip(el, cm, tx, cy + 70); el('circle', { cx: tx, cy: cy + 64, r: 18, fill: 'transparent' }, cm);
  if (can && step === 'turns') drag(cg, p0 => { let x = tx; return {
    move(p) { x = p.x; cm.setAttribute('transform', `translate(${n1(p.x - p0.x)} ${n1(p.y - p0.y)})`); },
    end() { const v = Math.abs(x - T[100]) < Math.abs(x - T[200]) ? 100 : 200; if (v !== s.turns) set({ turns: v }); else cm.removeAttribute('transform'); },
    cancel() { cm.removeAttribute('transform'); } }; },
    { label: '把夾子換到另一個接點', tap: () => set({ turns: s.turns === 100 ? 200 : 100 }) });
  // 磁鐵：拖進或拉出線圈，拖得快就是「快」
  const mx = MX[s.motion], mg = el('g', { 'data-drag': can && step !== 'quiz' ? 'magnet' : null }, rig), mm = el('g', {}, mg);
  barMagnet(el, txt, mm, mx, cy);
  el('rect', { x: mx, y: cy - 30, width: 200, height: 60, fill: 'transparent' }, mm);
  // 線圈前半圈蓋在磁鐵上，看起來像插進去
  if (s.motion === 'in') { const front = el('g', {}, rig), step2 = (X1 - X0) / loops; for (let i = 0; i < Math.min(loops, Math.ceil((mx + 200 - X0) / step2)); i++) { const x = X0 + step2 * (i + .5); el('path', { d: `M${n1(x - 3)} ${cy + 40}Q${n1(x + 9)} ${cy} ${n1(x + 3)} ${cy - 40}`, fill: 'none', stroke: i < used ? 'url(#em-cu)' : '#D9C8AA', 'stroke-width': 5.5, 'stroke-linecap': 'round' }, front); } }
  if (r.dir) { const y = cy - 64, a = r.dir > 0 ? `M${mx + 40} ${y}H${mx + 160}` : `M${mx + 160} ${y}H${mx + 40}`; el('path', { d: a, stroke: '#C8372D', 'stroke-width': s.speed === 'fast' ? 7 : 4, 'marker-end': 'url(#em-r)' }, rig); txt(rig, mx + 100, y - 14, `${MOTION[s.motion]}（${s.speed === 'fast' ? '快' : '慢'}）`, { 'font-size': 15, fill: '#C8372D' }); }
  else txt(rig, mx + 100, cy - 52, '磁鐵不動', { 'font-size': 15, fill: '#5A6478' });
  if (can && step !== 'quiz') drag(mg, p0 => { let dx = 0, t0 = performance.now(), v = 0, lastX = p0.x, lastT = t0; return {
    move(p) { dx = Math.max(MX.still - mx, Math.min(MX.in - mx, p.x - p0.x)); const t = performance.now(); if (t > lastT) v = Math.max(v, Math.abs(p.x - lastX) / (t - lastT)); lastX = p.x; lastT = t; mm.setAttribute('transform', `translate(${n1(dx)} 0)`); },
    end() { const total = Math.abs(dx), dur = performance.now() - t0, fast = total / Math.max(1, dur) > .6 || v > 1.2;
      if (Math.abs(dx) < 25) { mm.removeAttribute('transform'); return; }
      set({ motion: dx > 0 ? 'in' : 'out', ...(step === 'induce' ? { speed: fast ? 'fast' : 'slow' } : {}) }); },
    cancel() { mm.removeAttribute('transform'); } }; },
    { label: '移動磁鐵：插入、拉出或不動', tap: () => set({ motion: { still: 'in', in: 'out', out: 'still' }[s.motion] }) });
  hint(560, 580, step === 'induce' ? '把磁鐵拖進線圈或拉出來，拖快一點試試' : step === 'turns' ? '拖夾子換匝數，再把磁鐵插進去' : '');
}

function scene(api) { defs(api.el, api.rig); return api.s.mode === 'magnet' ? magnetScene(api) : induceScene(api); }

const mag = (sig, label, turns, current, aim) => ({ sig, label, aim, set: { mode: 'magnet', turns, current },
  title: s => `${s.turns} 匝・${s.current} A`, body: (s, r) => `磁場 ${mt(r.mT)} mT，吸 ${r.clips} 根${r.north ? `，N 極在${r.north === 'right' ? '右' : '左'}` : ''}` });
const ind = (sig, label, motion, speed, aim, turns = 100) => ({ sig, label, aim, set: { mode: 'induce', motion, speed, turns },
  title: s => `磁鐵${MOTION[s.motion]}${s.motion === 'still' ? '' : s.speed === 'fast' ? '（快）' : '（慢）'}・${s.turns} 匝`, body: (s, r) => r.deflect === 0 ? '指針不動，沒有電流' : `指針偏${r.deflect > 0 ? '右' : '左'} ${Math.abs(r.deflect)} 格` });

runDesk({
  key: 'bhcs.lab.electromagnetism.v1', title: '電磁實驗桌', background: 'bg-electric-bench',
  sceneLabel: '電磁實驗桌：通電線圈吸起迴紋針、指北針看磁極；把磁棒插進或拉出線圈，看檢流計的感應電流',
  initial: { mode: 'magnet', turns: 100, current: 1, motion: 'still', speed: 'slow' },
  model, scene, viewBox: { desk: '80 180 880 420', phone: '80 180 880 420' }, phoneText: 1.5,
  readouts: (s, r) => s.mode === 'magnet'
    ? [['線圈匝數', s.turns, '匝'], ['電流', s.current, 'A', s.current < 0 ? '電池反接' : ''], ['線圈內磁場', mt(r.mT), 'mT', `吸起 ${r.clips} 根迴紋針`]]
    : [['線圈匝數', s.turns, '匝'], ['磁鐵', { still: '不動', in: '插入', out: '拉出' }[s.motion], '', s.motion === 'still' ? '' : s.speed === 'fast' ? '動得快' : '動得慢'], ['檢流計', r.deflect === 0 ? '0' : (r.deflect > 0 ? '右 ' : '左 ') + Math.abs(r.deflect), '格', '指針偏轉表示有感應電流']],
  why: { title: '電流的磁效應與電磁感應', button: '電與磁', html: `
    <p class="fn-tip"><b>電流的磁效應：</b>導線通電會產生磁場。把導線繞成線圈，就是電磁鐵；匝數越多、電流越大，磁場越強。</p>
    <p class="fn-tip"><b>磁極方向：</b>電流方向反過來，N、S 極也跟著對調。可用右手定則判斷：四指順著電流繞線圈，大拇指指的那端是 N 極。</p>
    <p class="fn-tip"><b>電磁感應：</b>磁鐵在線圈中進出，穿過線圈的磁場改變，線圈就產生感應電流。磁鐵不動就沒有電流；動得越快、匝數越多，電流越大；插入和拉出的電流方向相反。發電機就是這個原理。</p>
    <p class="fn-tip">模型說明：線圈磁場用空心長線圈公式（長 20 cm），單位 mT（毫特斯拉）；迴紋針數和檢流計格數是依比例畫出的示意。</p>` },
  steps: [
    { id: 'strength', label: '電磁鐵強弱', title: '電磁鐵：怎樣讓磁力變強？', goal: '比較 100 匝 1 A、200 匝 1 A、100 匝 2 A，看吸起幾根迴紋針，各收一張。',
      intro: '線圈通電就變成電磁鐵。改匝數或電流，看它吸起幾根迴紋針！', enter: { mode: 'magnet', turns: 100, current: 1 },
      controls: [{ key: 'turns', label: '線圈匝數', type: 'seg', options: [[50, '50 匝'], [100, '100 匝'], [200, '200 匝']] }, { key: 'current', label: '電流', type: 'seg', options: [[1, '1 A'], [2, '2 A']] }],
      react: (s, r) => `${s.turns} 匝、${s.current} A：吸起 ${r.clips} 根。`,
      targets: [mag('a', '100 匝・1 A', 100, 1, '先試 100 匝、1 A。'), mag('b', '200 匝・1 A', 200, 1, '只把匝數加倍：200 匝、1 A。'), mag('c', '100 匝・2 A', 100, 2, '換成只把電流加倍：100 匝、2 A。')],
      found: ['匝數加倍或電流加倍，磁場都加倍，吸起的迴紋針也加倍。', '線圈磁場和「匝數 × 電流」成正比'] },
    { id: 'pole', label: '磁極方向', title: '電流反過來，磁極會怎樣？', goal: '把電池正接（＋1 A）和反接（−1 A），看線圈兩端的 N、S 極和指北針，各收一張。',
      intro: '看左邊的指北針。把電池反接，它會轉嗎？', enter: { mode: 'magnet', turns: 100, current: 1 },
      controls: [{ key: 'current', label: '電池接法', type: 'seg', options: [[1, '正接 ＋1 A'], [-1, '反接 −1 A']] }],
      react: (s, r) => `N 極在${r.north === 'right' ? '右' : '左'}端，指北針的 N 指向線圈的 S 極。`,
      targets: [mag('p', '正接 ＋1 A', 100, 1, '先正接。'), mag('n', '反接 −1 A', 100, -1, '把電池反接。')],
      found: ['電流方向反過來，N、S 極對調，指北針也跟著轉向。', '磁場大小不變，方向相反'] },
    { id: 'induce', label: '電磁感應', title: '磁鐵進出線圈，會產生電流嗎？', goal: '線圈接上檢流計（沒有電池）。讓磁鐵不動、慢慢插入、慢慢拉出、快速插入，各收一張。',
      intro: '這次沒有電池！把磁鐵插進線圈，看檢流計。', enter: { mode: 'induce', turns: 100, motion: 'still', speed: 'slow' },
      controls: [{ key: 'motion', label: '磁鐵', type: 'seg', options: [['still', '不動'], ['in', '插入'], ['out', '拉出']] }, { key: 'speed', label: '動的快慢', type: 'seg', options: [['slow', '慢'], ['fast', '快']], cols: 2 }],
      react: (s, r) => r.deflect === 0 ? '磁鐵不動，指針停在 0。' : `指針偏${r.deflect > 0 ? '右' : '左'} ${Math.abs(r.deflect)} 格。`,
      targets: [ind('still', '磁鐵不動', 'still', 'slow', '先讓磁鐵不動。'), ind('in', '慢慢插入', 'in', 'slow', '把磁鐵慢慢插入。'), ind('out', '慢慢拉出', 'out', 'slow', '把磁鐵慢慢拉出。'), ind('fast', '快速插入', 'in', 'fast', '選「插入」再選「快」。')],
      found: ['磁鐵進出線圈才有感應電流；插入、拉出方向相反，動得越快電流越大。', '磁場在線圈裡改變 → 感應電流（發電機原理）'] },
    { id: 'turns', label: '匝數與感應', title: '線圈匝數多，感應電流會變大嗎？', goal: '一樣慢慢插入磁鐵，比較 100 匝和 200 匝的檢流計，各收一張。',
      intro: '換一個 200 匝的線圈，同樣慢慢插入。', enter: { mode: 'induce', turns: 200, motion: 'in', speed: 'slow' },
      controls: [{ key: 'turns', label: '線圈匝數', type: 'seg', options: [[100, '100 匝'], [200, '200 匝']], cols: 2 }],
      react: (s, r) => `${s.turns} 匝：指針偏 ${Math.abs(r.deflect)} 格。`,
      targets: [ind('t100', '100 匝・慢慢插入', 'in', 'slow', '選 100 匝。', 100), ind('t200', '200 匝・慢慢插入', 'in', 'slow', '選 200 匝。', 200)],
      found: ['匝數加倍，感應電流也變大。', '匝數越多、磁鐵動得越快，感應電流越大'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想你收下的證據。',
      found: ['你把電與磁的關係弄懂了！', '電流生磁；磁場改變生電'] }
  ],
  quiz: [
    { q: '想讓電磁鐵吸起更多迴紋針，下面哪個方法沒有用？', options: [
      { text: '增加線圈匝數。', why: '你的證據：100 匝 → 200 匝，迴紋針從 5 根變 10 根，有用。' },
      { text: '把電池反接。', ok: true },
      { text: '加大電流。', why: '你的證據：1 A → 2 A，迴紋針加倍，有用。' }] },
    { q: '磁鐵靜靜地放在線圈裡面不動，檢流計會？', options: [
      { text: '一直偏轉，因為磁鐵在線圈裡。', why: '要磁場「改變」才有感應電流。磁鐵不動，磁場沒變，指針停在 0。' },
      { text: '停在 0。', ok: true },
      { text: '偏轉得比插入時更大。', why: '磁鐵不動，指針停在 0。' }] },
    { q: '發電機是利用哪一個現象？', options: [
      { text: '電流的磁效應（通電產生磁場）。', why: '那是電磁鐵和馬達用的。發電機是讓磁場改變，產生感應電流。' },
      { text: '電磁感應（磁場改變產生電流）。', ok: true },
      { text: '靜電感應。', why: '靜電感應是電荷在導體裡重新分布，不會產生持續的電流。' }] }
  ],
  finish: { title: '你把電與磁的關係弄懂了！', rule: '電流會產生磁場：匝數越多、電流越大，電磁鐵越強，電流反向磁極也反向。磁場改變會產生感應電流：磁鐵動得越快、匝數越多，電流越大。', next: { label: '去靜電感應實驗桌', href: '../electrostatics/' } }
});
