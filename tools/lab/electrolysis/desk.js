// 電池與電解實驗桌：各極變化、電子流向與溶液顏色全部來自 scripts/science/models.mjs 的 calculate('cell-electrolysis')。
// 溶液顏色深淺與氣體柱高度依模型的量按比例畫出（示意）。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('cell-electrolysis', { mode: s.mode, amp: 1, time: s.time });
const g3 = x => String(Math.round(Math.abs(x) * 1000) / 1000);
const NAME = { cell: '鋅銅電池', water: '電解水', cuC: '電解硫酸銅（碳棒）', cuCu: '電解硫酸銅（銅棒）' };
const MIN = t => t === 0 ? '0 秒' : `${t} 秒（約 ${Math.round(t / 60)} 分）`;

const n1 = v => (+v).toFixed(1);
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const TIMES_S = [0, 965, 1930], ANG = t => t / 1930 * 240; // 計時器：0／16／32 分對應指針 0°／120°／240°
const L = 400, R = 600, TOP = 214, LIQ = 316, BOT = 492;
// 換行：中文一字算 1、英數算 0.55；數字與單位不拆開
const wrap = (t, n) => { const tok = t.match(/[A-Za-z0-9.²⁺⁻₂]+(?: ?(?:g|mol))?|./g) || [], w = x => [...x].reduce((a, c) => a + (/[\x00-\x7F²⁺⁻₂]/.test(c) ? .55 : 1), 0), out = []; let cur = '';
  for (const k of tok) { if (cur && w(cur + k) > n) { out.push(cur.trim()); cur = k.trimStart(); } else cur += k; } if (cur.trim()) out.push(cur.trim()); return out; };
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (id, stops, a = {}) => { const n = el(a.r ? 'radialGradient' : 'linearGradient', { id, ...(a.r ? {} : { x1: a.x1 ?? 0, y1: a.y1 ?? 0, x2: a.x2 ?? 1, y2: a.y2 ?? 0 }) }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('el-zn', [[0, '#8C96A4'], [.35, '#DDE3EA'], [.6, '#AEB7C3'], [1, '#7C8694']]);
  g('el-cu', [[0, '#A9552A'], [.35, '#F0AA72'], [.6, '#C9733D'], [1, '#93461F']]);
  g('el-c', [[0, '#2A2A2E'], [.4, '#5C5E66'], [1, '#232327']]);
  g('el-glass', [[0, '#fff', .55], [.12, '#fff', .08], [.85, '#fff', .05], [1, '#fff', .4]]);
  g('el-liq', [[0, '#fff', .35], [1, '#fff', 0]], { x2: 0, y2: 1 });
  g('el-glow', [[0, '#FFF6B0', .95], [.45, '#FFD84A', .45], [1, '#FFD84A', 0]], { r: 1 });
  g('el-box', [[0, '#F4F1EA'], [1, '#CFC8B8']], { x2: 0, y2: 1 });
  const m = el('marker', { id: 'el-a', viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#2F6FB0' }, m);
}
// 電極：金屬板或碳棒；dissolve 0～1 表示被溶掉的程度（邊緣變得坑坑洞洞），plate 0～1 表示表面析出的銅
function electrode(el, g, x, kind, { dissolve = 0, plate = 0, y0 = TOP, y1 = BOT - 26, seed = 1 } = {}) {
  const w = kind === 'c' ? 20 : 30, q = el('g', {}, g);
  if (dissolve > 0) { let l = '', r = ''; const k = Math.max(3, w * .3 * dissolve), N = 22;
    for (let i = 0; i <= N; i++) { const y = y0 + (y1 - y0) * i / N, under = y > LIQ + 4, dl = under ? k * rnd(seed, i) : 0, dr = under ? k * rnd(seed + 3, i) : 0; l += `${i ? 'L' : 'M'}${n1(x - w / 2 + dl)} ${n1(y)}`; r = `L${n1(x + w / 2 - dr)} ${n1(y)}` + r; }
    el('path', { d: l + r + 'Z', fill: `url(#el-${kind})`, stroke: '#23304A', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, q);
  } else el('rect', { x: x - w / 2, y: y0, width: w, height: y1 - y0, rx: kind === 'c' ? 9 : 3, fill: `url(#el-${kind})`, stroke: '#23304A', 'stroke-width': 2.5 }, q);
  if (plate > 0) { const n = Math.round(10 + 40 * plate);
    for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1, y = LIQ + 10 + rnd(seed + 7, i) * (y1 - LIQ - 16), rr = 2.5 + rnd(seed + 9, i) * (2 + 4 * plate);
      el('circle', { cx: n1(x + side * (w / 2 + rr * .3 - rnd(i, seed) * 3)), cy: n1(y), r: n1(rr), fill: rnd(i, 4) > .5 ? '#B4532A' : '#C9683A', stroke: '#7A3314', 'stroke-width': .8 }, q); }
    el('rect', { x: x - w / 2 - 1.5, y: LIQ + 6, width: w + 3, height: y1 - LIQ - 8, rx: 3, fill: '#B4532A', opacity: .25 + .5 * plate }, q); }
  // 鱷魚夾
  el('path', { d: `M${x - 13} ${y0 + 10}l26 -4l0 -12l-26 4z`, fill: '#C8372D', stroke: '#6E1E18', 'stroke-width': 1.5 }, q);
  return q;
}
function bubbles(el, g, x, y0, y1, n, size, reduce, seed) {
  const q = el('g', {}, g);
  for (let i = 0; i < n; i++) { const bx = x + (rnd(seed, i) - .5) * 26, by = y1 - rnd(seed + 1, i) * (y1 - y0), r = size * (.6 + rnd(seed + 2, i) * .8);
    const c = el('circle', { cx: n1(bx), cy: n1(by), r: n1(r), fill: 'rgba(255,255,255,.75)', stroke: 'rgba(40,90,140,.55)', 'stroke-width': .9 }, q);
    if (!reduce) { el('animate', { attributeName: 'cy', values: `${n1(by)};${n1(y0)}`, dur: `${(1.4 + rnd(seed + 3, i) * 1.4).toFixed(2)}s`, begin: `-${(rnd(seed + 4, i) * 2).toFixed(2)}s`, repeatCount: 'indefinite' }, c); } }
  return q;
}
function ions(el, txt, g, n, label, color, seed, avoid) {
  const placed = ions.taken || (ions.taken = []);
  for (let i = 0, k = 0; k < n && i < 300; i++) { const x = 322 + rnd(seed, i) * 356, y = LIQ + 22 + rnd(seed + 1, i) * (BOT - LIQ - 44);
    if (avoid.some(a => Math.abs(a - x) < 36) || placed.some(([px, py]) => Math.hypot(px - x, py - y) < 30)) continue; k++; placed.push([x, y]);
    el('circle', { cx: n1(x), cy: n1(y), r: 11, fill: color, stroke: '#fff', 'stroke-width': 1.5, opacity: .9 }, g);
    txt(g, n1(x), n1(y + 3.5), label, { 'font-size': 8.5, fill: '#fff', 'pointer-events': 'none' }); }
}

function scene({ rig, el, txt, s, r, step, set, drag, hint, kind, reduce, k: K = 1 }) {
  defs(el, rig); ions.taken = [];
  const can = kind === 'observe', on = s.time > 0, water = s.mode === 'water';
  const blue = water ? 0 : s.mode === 'cuCu' ? .8 : .8 - .25 * s.time / 965;
  // 燒杯（玻璃、液面、刻度）
  el('ellipse', { cx: 500, cy: 512, rx: 230, ry: 12, fill: '#000', opacity: .12 }, rig);
  const liq = water ? 'rgba(205,232,246,.85)' : `rgba(58,138,222,${Math.max(.12, blue).toFixed(2)})`;
  el('path', { d: `M304 ${LIQ} V488 q0 18 18 18 H678 q18 0 18 -18 V${LIQ}Z`, fill: liq }, rig);
  el('path', { d: `M304 ${LIQ} V488 q0 18 18 18 H678 q18 0 18 -18 V${LIQ}Z`, fill: 'url(#el-liq)' }, rig);
  const sol = el('g', {}, rig);
  if (!water) ions(el, txt, sol, Math.round(12 * Math.max(.15, blue) / .8), 'Cu²⁺', '#2F6FB0', 3, [L, R]);
  if (s.mode === 'cell' && on) ions(el, txt, sol, Math.round(5 * s.time / 1930), 'Zn²⁺', '#7C8694', 11, [L, R]);
  // 電極與電路
  const wire = (d, c = '#C8372D') => { el('path', { d, fill: 'none', stroke: '#23304A', 'stroke-width': 6, 'stroke-linecap': 'round' }, rig); el('path', { d, fill: 'none', stroke: c, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, rig); };
  const eDots = (d, id) => { if (!on) return; const p = el('path', { id, d, fill: 'none', stroke: 'none' }, rig);
    for (let i = 0; i < 4; i++) { const c = el('circle', { r: 4.5, fill: '#2F6FB0', stroke: '#fff', 'stroke-width': 1.2 }, rig);
      if (reduce) { const len = p.getTotalLength?.() || 0; if (len) { const pt = p.getPointAtLength(len * (i + .5) / 4); c.setAttribute('cx', n1(pt.x)); c.setAttribute('cy', n1(pt.y)); } }
      else { const a = el('animateMotion', { dur: '2.4s', begin: `-${(i * .6).toFixed(1)}s`, repeatCount: 'indefinite' }, c); el('mpath', { href: '#' + id }, a); } } };
  if (s.mode === 'cell') {
    electrode(el, rig, L, 'zn', { dissolve: Math.min(1, -r.negMass / .7), seed: 2 }); electrode(el, rig, R, 'cu', { plate: Math.min(1, r.posMass / .7), seed: 5 });
    // 燈泡
    el('circle', { cx: 500, cy: 112, r: on ? 70 : 0, fill: 'url(#el-glow)' }, rig);
    el('path', { d: 'M482 132 q-26 -18 -26 -44 a44 44 0 0 1 88 0 q0 26 -26 44 z', fill: on ? '#FFF5C2' : '#EEF2F6', stroke: '#23304A', 'stroke-width': 2.5, opacity: .95 }, rig);
    el('path', { d: 'M490 130 V104 q10 -16 20 0 V130', fill: 'none', stroke: on ? '#E58A12' : '#8792A6', 'stroke-width': 2.2 }, rig);
    el('rect', { x: 480, y: 132, width: 40, height: 22, rx: 4, fill: '#B9BFC8', stroke: '#23304A', 'stroke-width': 2 }, rig);
    for (const y of [138, 144, 150]) el('line', { x1: 481, y1: y, x2: 519, y2: y + 2, stroke: '#7C8694', 'stroke-width': 1.2 }, rig);
    el('rect', { x: 470, y: 154, width: 60, height: 14, rx: 4, fill: '#4F5B6E' }, rig);
    const dz = `M${L} ${TOP - 6} C${L} 150 430 162 470 162`, dc = `M530 162 C570 162 ${R} 150 ${R} ${TOP - 6}`;
    wire(dz, '#3A3F48'); wire(dc, '#C8372D'); eDots(`M${L} ${TOP - 6} C${L} 150 430 162 470 162 M530 162 C570 162 ${R} 150 ${R} ${TOP - 6}`, 'el-e1');
    txt(rig, L - 66, 262, '鋅片', { 'font-size': 15 }); txt(rig, L - 66, 280, '（負極）', { 'font-size': 12, fill: '#5A6478' });
    txt(rig, R + 66, 262, '銅片', { 'font-size': 15 }); txt(rig, R + 66, 280, '（正極）', { 'font-size': 12, fill: '#5A6478' });
    if (on) txt(rig, 500, 196, '電子 e⁻ 從鋅片經燈泡流到銅片', { 'font-size': 13, fill: '#2F6FB0' });
  } else {
    // 直流電源
    el('rect', { x: 436, y: 72, width: 128, height: 82, rx: 10, fill: 'url(#el-box)', stroke: '#23304A', 'stroke-width': 2.5 }, rig);
    el('rect', { x: 452, y: 84, width: 64, height: 26, rx: 4, fill: '#1E2B22' }, rig);
    txt(rig, 484, 103, on ? '1.00 A' : '0.00 A', { 'font-size': 13, fill: on ? '#7CF29A' : '#4C6B55', 'font-family': 'monospace' });
    el('circle', { cx: 540, cy: 97, r: 10, fill: '#5A6478', stroke: '#23304A', 'stroke-width': 1.5 }, rig); el('line', { x1: 540, y1: 97, x2: 545, y2: 89, stroke: '#fff', 'stroke-width': 2 }, rig);
    el('circle', { cx: 458, cy: 136, r: 8, fill: '#3A3F48', stroke: '#23304A', 'stroke-width': 1.5 }, rig); txt(rig, 476, 141, '−', { 'font-size': 16, fill: '#2F6FB0' });
    el('circle', { cx: 542, cy: 136, r: 8, fill: '#C8372D', stroke: '#23304A', 'stroke-width': 1.5 }, rig); txt(rig, 524, 141, '＋', { 'font-size': 14, fill: '#C8372D' });
    txt(rig, 500, 64, '直流電源', { 'font-size': 14 });
    const k = s.mode === 'cuCu' ? 'cu' : 'c';
    if (water) {
      // 倒立試管收集氣體：電極從下方伸進管口
      for (const [x, mol, nm, sd] of [[L, r.h2 || 0, '氫氣 H₂', 1], [R, r.o2 || 0, '氧氣 O₂', 2]]) {
        const h = Math.min(150, mol * 7000), ty = 236, tb = 474;
        el('path', { d: `M${x - 26} ${tb} V${ty + 26} a26 26 0 0 1 52 0 V${tb}`, fill: 'rgba(205,232,246,.6)' }, rig);
        if (h) el('path', { d: `M${x - 24} ${ty + 26 + Math.max(0, h - 26)} V${ty + 26} a24 24 0 0 1 48 0 V${ty + 26 + Math.max(0, h - 26)}Z`, fill: 'rgba(255,255,255,.96)' }, rig);
        if (h) el('path', { d: `M${x - 24} ${n1(ty + 26 + Math.max(0, h - 26))} q24 5 48 0`, fill: 'none', stroke: '#5E8FA8', 'stroke-width': 1.5 }, rig);
        wire(`M${x - 46} ${TOP - 6} V488 Q${x - 46} 496 ${x - 30} 496 H${x - 8} Q${x} 496 ${x} 486`, '#7C8694');
        el('rect', { x: x - 5, y: 400, width: 10, height: 86, rx: 4, fill: 'url(#el-c)', stroke: '#23304A', 'stroke-width': 1.5 }, rig);
        if (on) bubbles(el, rig, x, ty + Math.max(30, h + 8), 400, sd === 1 ? 14 : 7, 3.2, reduce, sd * 5);
        el('path', { d: `M${x - 26} ${tb} V${ty + 26} a26 26 0 0 1 52 0 V${tb}`, fill: 'url(#el-glass)', stroke: '#5E8FA8', 'stroke-width': 2.5 }, rig);
        el('rect', { x: x - 40, y: ty - 34, width: 80, height: 24, rx: 12, fill: '#fff', stroke: sd === 1 ? '#2F6FB0' : '#C8372D', 'stroke-width': 1.5 }, rig);
        txt(rig, x, ty - 17, nm, { 'font-size': 13, fill: sd === 1 ? '#2F6FB0' : '#C8372D' });
        el('path', { d: `M${x - 59} ${TOP + 4}l26 -4l0 -12l-26 4z`, fill: '#C8372D', stroke: '#6E1E18', 'stroke-width': 1.5 }, rig);
      }
      wire(`M458 136 C420 150 ${L - 46} 170 ${L - 46} ${TOP - 6}`, '#3A3F48'); wire(`M542 136 C580 150 ${R - 46} 170 ${R - 46} ${TOP - 6}`, '#C8372D');
      eDots(`M458 136 C420 150 ${L - 46} 170 ${L - 46} ${TOP - 6}`, 'el-e1'); eDots(`M${R - 46} ${TOP - 6} C${R - 46} 170 580 150 542 136`, 'el-e2');
      txt(rig, L, 528, '負極', { 'font-size': 14, fill: '#2F6FB0' }); txt(rig, R, 528, '正極', { 'font-size': 14, fill: '#C8372D' });
    } else {
      const neg = s.mode === 'cuCu' ? Math.min(1, r.negMass / .7) : Math.min(1, r.negMass / .55);
      electrode(el, rig, L, k, { plate: neg, seed: 4 });
      electrode(el, rig, R, k, { dissolve: s.mode === 'cuCu' ? Math.min(1, r.negMass / .7) : 0, seed: 6 });
      if (s.mode === 'cuC' && on) bubbles(el, rig, R, LIQ + 4, BOT - 30, 10, 3, reduce, 9);
      wire(`M458 136 C420 150 ${L} 160 ${L} ${TOP - 6}`, '#3A3F48'); wire(`M542 136 C580 150 ${R} 160 ${R} ${TOP - 6}`, '#C8372D');
      eDots(`M458 136 C420 150 ${L} 160 ${L} ${TOP - 6}`, 'el-e1'); eDots(`M${R} ${TOP - 6} C${R} 160 580 150 542 136`, 'el-e2');
      const nm = k === 'cu' ? '銅棒' : '碳棒';
      txt(rig, L - 66, 262, nm, { 'font-size': 15 }); txt(rig, L - 66, 280, '（負極）', { 'font-size': 12, fill: '#2F6FB0' });
      txt(rig, R + 66, 262, nm, { 'font-size': 15 }); txt(rig, R + 66, 280, '（正極）', { 'font-size': 12, fill: '#C8372D' });
    }
  }
  // 燒杯玻璃
  el('path', { d: `M300 ${TOP + 14} V490 q0 20 20 20 H680 q20 0 20 -20 V${TOP + 14}`, fill: 'url(#el-glass)', stroke: '#23304A', 'stroke-width': 4, 'stroke-linejoin': 'round' }, rig);
  el('path', { d: `M292 ${TOP + 10} q8 0 8 6 M708 ${TOP + 10} q-8 0 -8 6`, fill: 'none', stroke: '#23304A', 'stroke-width': 4, 'stroke-linecap': 'round' }, rig);
  el('path', { d: `M302 ${LIQ} Q500 ${LIQ + 6} 698 ${LIQ}`, fill: 'none', stroke: 'rgba(255,255,255,.9)', 'stroke-width': 2 }, rig);
  for (let i = 1; i <= 3; i++) { el('line', { x1: 312, y1: BOT - i * 50, x2: 330, y2: BOT - i * 50, stroke: '#5A6478', 'stroke-width': 1.5 }, rig); }
  if (!water) { el('rect', { x: 380, y: 520, width: 240, height: 28, rx: 14, fill: 'rgba(255,255,255,.92)' }, rig); txt(rig, 500, 539, `硫酸銅溶液${s.mode === 'cuCu' ? '（顏色不變）' : on ? '（藍色變淡）' : ''}`, { 'font-size': 14, fill: '#5A6478' }); }
  // 右上：計時器（拖指針設定通電時間）
  const cx = 845, cy = 152, rr = 54;
  el('rect', { x: 740, y: 70, width: 210, height: 160, rx: 16, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 2 }, rig);
  txt(rig, 845, 92, s.mode === 'cell' ? '放電時間' : '通電時間（1 A）', { 'font-size': 13 });
  const pt = (deg, R0) => [cx + R0 * Math.sin(deg * Math.PI / 180), cy + 6 - R0 * Math.cos(deg * Math.PI / 180)];
  el('circle', { cx, cy: cy + 6, r: rr - 6, fill: '#FBF7EE', stroke: '#23304A', 'stroke-width': 3 }, rig);
  if (s.time) { const [x1, y1] = pt(ANG(s.time), rr - 12); el('path', { d: `M${cx} ${cy + 6}V${cy + 6 - rr + 12}A${rr - 12} ${rr - 12} 0 ${ANG(s.time) > 180 ? 1 : 0} 1 ${n1(x1)} ${n1(y1)}Z`, fill: '#FCE3A8' }, rig); }
  for (const [t, lab] of [[0, '0'], [965, '16 分'], [1930, '32 分']]) { const [x, y] = pt(ANG(t), rr + 4); el('circle', { cx: n1(pt(ANG(t), rr - 12)[0]), cy: n1(pt(ANG(t), rr - 12)[1]), r: 3, fill: '#23304A' }, rig); txt(rig, n1(x + (t === 965 ? 18 : t === 1930 ? -18 : 0)), n1(y + 4), lab, { 'font-size': 11, fill: s.time === t ? '#C8372D' : '#5A6478' }); }
  const hg = el('g', { 'data-drag': can && step !== 'plate' ? 'timer' : null }, rig), hand = el('g', { transform: `rotate(${ANG(s.time)} ${cx} ${cy + 6})` }, hg);
  el('circle', { cx, cy: cy + 6, r: rr, fill: 'transparent' }, hg);
  el('path', { d: `M${cx - 3.5} ${cy + 12}L${cx} ${cy + 6 - rr + 14}L${cx + 3.5} ${cy + 12}Z`, fill: '#C8372D', stroke: '#7A1E17', 'stroke-width': 1 }, hand);
  el('circle', { cx, cy: cy + 6, r: 6, fill: '#23304A' }, hg);
  if (can && step !== 'plate') drag(hg, () => { let d = ANG(s.time); return {
    move(p) { d = Math.atan2(p.x - cx, cy + 6 - p.y) * 180 / Math.PI; if (d < -60) d += 360; d = Math.max(0, Math.min(240, d)); hand.setAttribute('transform', `rotate(${n1(d)} ${cx} ${cy + 6})`); },
    end() { const v = TIMES_S.reduce((m, t) => Math.abs(ANG(t) - d) < Math.abs(ANG(m) - d) ? t : m); if (v !== s.time) set({ time: v }); else hand.setAttribute('transform', `rotate(${ANG(s.time)} ${cx} ${cy + 6})`); },
    cancel() { hand.setAttribute('transform', `rotate(${ANG(s.time)} ${cx} ${cy + 6})`); } }; },
    { label: '轉計時器，通電更久', tap: () => set({ time: TIMES_S[(TIMES_S.indexOf(s.time) + 1) % 3] }) });
  // 右中：結果
  el('rect', { x: 740, y: 244, width: 210, height: step === 'plate' ? 196 : 266, rx: 16, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 2 }, rig);
  txt(rig, 845, 270, NAME[s.mode].replace('（', '\n（').split('\n')[0], { 'font-size': 15 });
  const lines = r.kind === 'idle' ? [['還沒通電', '#5A6478'], ['兩極沒有變化', '#5A6478']] : [[r.neg, '#2F6FB0'], [r.pos, '#C8372D'], [r.sol.replace(/（.*）/, ''), '#23304A']];
  let y = 300; for (const [t, c] of lines) { for (const ln of wrap(t, 12 / K)) { txt(rig, 845, y, ln, { 'font-size': 12.5, fill: c }); y += 18 * K; } y += 8; }
  // 銅棒電鍍：從架上拖一組電極換上
  if (step === 'plate') {
    const other = s.mode === 'cuCu' ? 'c' : 'cu', rg = el('g', { 'data-drag': can ? 'rods' : null }, rig), mv = el('g', {}, rg);
    el('rect', { x: 740, y: 452, width: 210, height: 100, rx: 16, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 2 }, rig);
    txt(rig, 845, 474, `換成${other === 'cu' ? '銅棒' : '碳棒'}`, { 'font-size': 13 });
    for (const dx of [-16, 16]) el('rect', { x: 845 + dx - 7, y: 482, width: 14, height: 60, rx: other === 'c' ? 6 : 2, fill: `url(#el-${other})`, stroke: '#23304A', 'stroke-width': 1.8 }, mv);
    el('rect', { x: 800, y: 476, width: 90, height: 72, fill: 'transparent' }, mv);
    rig.appendChild(rg);
    if (can) drag(rg, p0 => { let x = 0; return {
      move(p) { x = p.x; mv.setAttribute('transform', `translate(${n1(p.x - p0.x)} ${n1(p.y - p0.y)})`); },
      end() { if (x < 720) set({ mode: s.mode === 'cuCu' ? 'cuC' : 'cuCu' }); else mv.removeAttribute('transform'); },
      cancel() { mv.removeAttribute('transform'); } }; },
      { label: `把電極換成${other === 'cu' ? '銅棒' : '碳棒'}`, tap: () => set({ mode: s.mode === 'cuCu' ? 'cuC' : 'cuCu' }) });
  }
  hint(500, 572, step === 'plate' ? '把右下的電極拖進燒杯' : '轉右上的計時器，讓電流通久一點');
}

const tgt = (sig, label, mode, time, aim) => ({ sig, label, aim, set: { mode, time },
  title: s => `${NAME[s.mode]}・${MIN(s.time)}`, body: (s, r) => r.kind === 'idle' ? '沒有變化' : s.mode === 'water' ? `氫氣：氧氣 ＝ 2：1（${g3(r.h2 * 1000)}：${g3(r.o2 * 1000)} mmol）` : `${r.neg}；${r.pos}` });
const TIMES = { key: 'time', label: '通電時間（1 A）', type: 'seg', options: [[0, '0'], [965, '約 16 分'], [1930, '約 32 分']] };

runDesk({
  key: 'bhcs.lab.electrolysis.v1', title: '電池與電解實驗桌', background: 'bg-chem-bench',
  sceneLabel: '電池與電解實驗桌：燒杯裡插著兩支電極，畫面顯示電極的變化、電子在導線上的流向、產生的氣體與溶液顏色',
  initial: { mode: 'cell', time: 0 },
  model, scene, viewBox: { desk: '260 40 710 550', phone: '270 40 700 550' }, phoneText: 1.35,
  readouts: (s, r) => s.mode === 'water'
    ? [['氫氣', g3((r.h2 || 0) * 1000), 'mmol', '在負極'], ['氧氣', g3((r.o2 || 0) * 1000), 'mmol', '在正極'], ['氫：氧', r.o2 ? '2：1' : '—', '', '體積比']]
    : [['負極', r.kind === 'idle' ? '0' : (r.negMass > 0 ? '+' : '−') + g3(r.negMass), 'g', '質量變化'], ['正極', r.kind === 'idle' || !r.posMass ? '0' : (r.posMass > 0 ? '+' : '−') + g3(r.posMass), 'g', s.mode === 'cuC' ? '產生氧氣' : '質量變化'], ['通電時間', s.time, '秒', '電流 1 A']],
  why: { title: '電池與電解', button: '電流的化學效應', html: `
    <p class="fn-tip"><b>電池：化學能 → 電能。</b>鋅比銅活潑，鋅失去電子變成 Zn²⁺ 溶進溶液（鋅片變輕），電子經導線流到銅片，溶液中的 Cu²⁺ 在銅片得到電子變成銅（銅片變重）。</p>
    <p class="fn-tip"><b>電解：電能 → 化學能。</b>接上直流電源，負極的陽離子得到電子、正極發生失去電子的反應。</p>
    <p class="fn-tip"><b>電解水：</b>負極產生氫氣、正極產生氧氣，體積比 2：1。</p>
    <p class="fn-tip"><b>電解硫酸銅：</b>負極析出銅。用碳棒時溶液的藍色變淡；用銅棒當正極時，銅棒溶出多少 Cu²⁺，負極就析出多少銅，顏色不變（電鍍）。</p>
    <p class="fn-tip">模型說明：電流 1 A，質量依通過的電量計算；溶液顏色和氣體柱高度是依比例畫的示意。這是線上模擬，不是實作指引。</p>` },
  steps: [
    { id: 'cell', label: '鋅銅電池', title: '鋅銅電池：哪一片變輕、哪一片變重？', goal: '鋅片和銅片放進硫酸銅溶液並接上燈泡。比較放電約 16 分和約 32 分，各收一張。',
      intro: '鋅片和銅片用導線接起來，燈泡亮了！哪一片會變輕？', enter: { mode: 'cell', time: 0 }, controls: [TIMES],
      react: (s, r) => r.kind === 'idle' ? '還沒放電，兩片都沒變。' : `鋅片少 ${g3(r.negMass)} g，銅片多 ${g3(r.posMass)} g。`,
      targets: [tgt('c1', '放電約 16 分', 'cell', 965, '選「約 16 分」。'), tgt('c2', '放電約 32 分', 'cell', 1930, '選「約 32 分」。')],
      found: ['鋅片變輕、銅片變重；時間加倍，變化也加倍。', '鋅失去電子 → 電子經導線流到銅片 → Cu²⁺ 變成銅'] },
    { id: 'water', label: '電解水', title: '電解水：兩極各產生什麼氣體？', goal: '接上直流電源電解水。比較約 16 分和約 32 分，看兩支試管的氣體，各收一張。',
      intro: '負極和正極都冒泡了！哪一邊的氣體比較多？', enter: { mode: 'water', time: 965 }, controls: [TIMES],
      react: (s, r) => r.kind === 'idle' ? '還沒通電。' : '負極的氫氣是正極氧氣的 2 倍。',
      targets: [tgt('w1', '電解約 16 分', 'water', 965, '選「約 16 分」。'), tgt('w2', '電解約 32 分', 'water', 1930, '選「約 32 分」。')],
      found: ['負極產生氫氣、正極產生氧氣，體積比 2：1。', '2H₂O → 2H₂ ＋ O₂'] },
    { id: 'copper', label: '電解硫酸銅', title: '電解硫酸銅：負極會出現什麼？', goal: '用兩支碳棒電解硫酸銅溶液。比較約 16 分和約 32 分，看負極和溶液顏色，各收一張。',
      intro: '看負極的碳棒，還有溶液的藍色。', enter: { mode: 'cuC', time: 965 }, controls: [TIMES],
      react: (s, r) => r.kind === 'idle' ? '還沒通電。' : `負極析出銅 ${g3(r.negMass)} g，藍色變淡。`,
      targets: [tgt('u1', '碳棒・約 16 分', 'cuC', 965, '選「約 16 分」。'), tgt('u2', '碳棒・約 32 分', 'cuC', 1930, '選「約 32 分」。')],
      found: ['負極析出紅色的銅，溶液中的 Cu²⁺ 變少，藍色變淡。', 'Cu²⁺ 在負極得到電子變成 Cu'] },
    { id: 'plate', label: '銅棒電鍍', title: '換成銅棒，顏色還會變淡嗎？', goal: '兩極都換成銅棒，電解約 32 分。和碳棒比一比，各收一張。',
      intro: '把兩支碳棒換成銅棒。正極的銅棒會怎樣？', enter: { mode: 'cuCu', time: 1930 },
      controls: [{ key: 'mode', label: '電極', type: 'seg', options: [['cuC', '碳棒'], ['cuCu', '銅棒']], cols: 2 }],
      react: (s, r) => s.mode === 'cuCu' ? '負極變重、正極變輕，溶液顏色不變。' : '碳棒：藍色變淡。',
      targets: [tgt('p1', '碳棒・約 32 分', 'cuC', 1930, '選「碳棒」。'), tgt('p2', '銅棒・約 32 分', 'cuCu', 1930, '選「銅棒」。')],
      found: ['用銅棒時，正極溶出多少銅，負極就析出多少，顏色不變。', '這就是電鍍：把銅鍍到負極的物體上'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想電子往哪裡跑。',
      found: ['你把電池與電解弄懂了！', '電池：化學能 → 電能；電解：電能 → 化學能'] }
  ],
  quiz: [
    { q: '鋅銅電池放電時，電子在導線上怎麼流？', options: [
      { text: '從銅片流到鋅片。', why: '鋅比較活潑，失去電子。你的證據：鋅片變輕，電子從鋅片經導線流到銅片。' },
      { text: '從鋅片流到銅片。', ok: true },
      { text: '電子在溶液裡流動。', why: '溶液裡移動的是離子；電子走的是導線。' }] },
    { q: '電解水時，負極和正極產生的氣體體積比是？', options: [
      { text: '氫：氧 ＝ 1：2', why: '你的證據：負極的氫氣是正極氧氣的 2 倍。' },
      { text: '氫：氧 ＝ 2：1', ok: true },
      { text: '一樣多', why: '水 H₂O 裡氫原子是氧原子的 2 倍，所以氫氣是氧氣的 2 倍。' }] },
    { q: '想把銅鍍在一支鐵湯匙上，湯匙應該接在哪一極？', options: [
      { text: '正極。', why: '正極的銅會溶出。Cu²⁺ 是在負極得到電子析出，所以湯匙要接負極。' },
      { text: '負極。', ok: true },
      { text: '哪一極都可以。', why: '銅只會在負極析出。' }] }
  ],
  finish: { title: '你把電池與電解弄懂了！', rule: '電池：活潑的金屬失去電子，電子經導線流到另一極。電解：負極析出金屬或產生氫氣；電解水氫：氧 ＝ 2：1；用銅棒電解硫酸銅可以電鍍。', next: { label: '去金屬活性實驗桌', href: '../metal/' } }
});
