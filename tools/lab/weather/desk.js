// 天氣系統實驗桌：高低氣壓的旋轉方向、氣流與天氣，以及鋒面的雲、雨與過境變化，全部來自 scripts/science/models.mjs 的 calculate('weather-systems')。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';
import { skyDefs, earth } from '../shared/sky.mjs';

const model = s => calculate('weather-systems', { mode: s.mode, hemi: s.hemi, system: s.system, front: s.front, phase: s.phase });
const SYS = { high: '高氣壓', low: '低氣壓', typhoon: '颱風' }, FRONT = { cold: '冷鋒', warm: '暖鋒', stationary: '滯留鋒' }, PHASE = { before: '過境前', during: '過境中', after: '過境後' };
const ROT = { cw: '順時針', ccw: '逆時針' };

const n1 = v => (+v).toFixed(1);
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
// 氣壓計：940～1040 百帕對應指針角度 −135°～＋135°（從正上方順時針）
const HPA = { typhoon: 955, low: 998, high: 1025 }, ang = p => (p - 990) / 50 * 135;
const sysOf = p => p < 975 ? 'typhoon' : p < 1013 ? 'low' : 'high';
// 觀測站固定在 SX；鋒面（地面上的交界）位置依過境前／中／後
const SX = 560, FX = { cold: { before: 380, during: 590, after: 800 }, warm: { before: 800, during: 590, after: 380 }, stationary: { before: 620, during: 620, after: 620 } };
const KNOB = { warm: 585, stationary: 670, cold: 755 };

function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  for (const [k, c] of [['b', '#2F6FB0'], ['r', '#C8372D'], ['y', '#FFD34E'], ['w', '#fff']]) { const m = el('marker', { id: 'wx-' + k, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 3.2, markerHeight: 3.2, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: c }, m); }
  g('radialGradient', 'wx-sea', [[0, '#2D6FA8'], [.7, '#1B4F86'], [1, '#123A66']]);
  g('linearGradient', 'wx-cl', [[0, '#FFFFFF'], [.6, '#EEF2F7'], [1, '#B9C4D2']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'wx-cb', [[0, '#FFFFFF'], [.45, '#DCE2EA'], [1, '#6F7B8D']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'wx-st', [[0, '#E9EDF2'], [1, '#97A3B4']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'wx-cold', [[0, '#5B93D6', .55], [1, '#2F6FB0', .32]], { x1: 0, y1: 1, x2: 0, y2: 0 });
  g('linearGradient', 'wx-skyhi', [[0, '#5AA5E6'], [1, '#CFE8FB']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'wx-skylo', [[0, '#7D8DA3'], [1, '#C9D3DF']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'wx-skyfr', [[0, '#8DB7E2'], [1, '#E3EFF9']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'wx-grass', [[0, '#8CC46A'], [1, '#5E9445']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  const f = el('filter', { id: 'wx-blur', x: '-30%', y: '-30%', width: '160%', height: '160%' }, d); el('feGaussianBlur', { stdDeviation: 3.2 }, f);
  const f2 = el('filter', { id: 'wx-soft', x: '-20%', y: '-20%', width: '140%', height: '140%' }, d); el('feGaussianBlur', { stdDeviation: 1.2 }, f2);
  return d;
}
const clip = (el, rig, id, x, y, w, h, rx = 16) => { const c = el('clipPath', { id }, el('defs', {}, rig)); el('rect', { x, y, width: w, height: h, rx }, c); return `url(#${id})`; };
const panel = (el, g, x, y, w, h, fill = 'rgba(255,255,255,.96)') => el('rect', { x, y, width: w, height: h, rx: 16, fill, stroke: '#23304A', 'stroke-width': 3 }, g);
// 一朵積雲：幾個圓疊在一起，底部平
function cumulus(el, g, x, y, s, op = 1) {
  const q = el('g', { opacity: op }, g);
  for (const [dx, dy, r] of [[-30, 2, 16], [-12, -10, 22], [12, -6, 19], [30, 3, 14], [0, 4, 18]]) el('circle', { cx: n1(x + dx * s), cy: n1(y + dy * s), r: n1(r * s), fill: 'url(#wx-cl)' }, q);
  el('rect', { x: n1(x - 44 * s), y: n1(y + 3 * s), width: n1(88 * s), height: n1(15 * s), rx: n1(7 * s), fill: '#C3CCD8' }, q);
  return q;
}
// 積雨雲：高聳的雲塔加上平平的砧狀雲頂
function cumulonimbus(el, g, x, base, top, w, lean = 1, dark = 0) {
  const q = el('g', {}, g), H = base - top;
  el('ellipse', { cx: n1(x + lean * w * .12), cy: n1(top + 14), rx: n1(w * .62), ry: 15, fill: '#F1F4F8', stroke: '#C9D1DC', 'stroke-width': 1.5 }, q);
  el('path', { d: `M${n1(x - w * .2)} ${n1(top + 20)}Q${n1(x + lean * w * .2)} ${n1(top + 4)} ${n1(x + lean * w * .62)} ${n1(top + 18)}`, fill: 'none', stroke: '#fff', 'stroke-width': 4, opacity: .9 }, q);
  for (let k = 0; k < 7; k++) { const t = k / 6, yy = base - 10 - t * (H - 34), rr = w * (.27 - t * .1);
    for (const sx of [-1, 0, 1]) el('circle', { cx: n1(x + sx * rr * .7 + (rnd(k, sx + 3) - .5) * 10), cy: n1(yy - (sx ? 0 : 8)), r: n1(rr * (sx ? .78 : 1)), fill: 'url(#wx-cb)' }, q); }
  el('ellipse', { cx: x, cy: base - 4, rx: n1(w * .34), ry: 11, fill: dark ? '#4E596B' : '#6D7889' }, q);
  return q;
}
// 層狀雲：沿著鋒面坡度、一片片扁平的雲疊成長條
function stratus(el, g, x0, y0, x1, y1, th, op = 1) {
  const q = el('g', { opacity: op }, g), N = Math.max(5, Math.round(Math.hypot(x1 - x0, y1 - y0) / 34)), rot = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI, deg = rot > 90 || rot < -90 ? rot + 180 : rot;
  for (const row of [0, 1]) for (let i = 0; i <= N; i++) { const t = (i + row * .5) / N; if (t > 1) continue; const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t - row * th * .32, h = th * (1 - .4 * t) * (row ? .7 : 1);
    el('ellipse', { cx: n1(x), cy: n1(y), rx: n1(26 + rnd(i, row + 2) * 18), ry: n1(h * (.42 + rnd(i, row + 5) * .14)), fill: row ? 'url(#wx-cl)' : 'url(#wx-st)', transform: `rotate(${n1(deg)} ${n1(x)} ${n1(y)})` }, q); }
  return q;
}
function rain(el, g, x0, x1, y0, y1, n, slant = -6, w = 2.2, c = '#4E95D0') {
  let d = ''; for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i + rnd(i, 3) * .8) / n, ya = y0 + rnd(i, 7) * 18, L = 16 + rnd(i, 9) * 10;
    for (let yy = ya; yy + L < y1; yy += L + 14 + rnd(i, yy) * 10) d += `M${n1(x + (yy - y0) / (y1 - y0) * slant * 3)} ${n1(yy)}l${slant} ${n1(L)}`; }
  return el('path', { d, stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', opacity: .8 }, g);
}
function tree(el, g, x, y, s = 1, bend = 0) {
  const q = el('g', {}, g);
  el('path', { d: `M${x} ${y}q${n1(bend * .3)} ${n1(-14 * s)} ${n1(bend)} ${n1(-26 * s)}`, stroke: '#7A5434', 'stroke-width': n1(4 * s), fill: 'none', 'stroke-linecap': 'round' }, q);
  el('ellipse', { cx: n1(x + bend * 1.2), cy: n1(y - 32 * s), rx: n1(13 * s + Math.abs(bend) * .2), ry: n1(12 * s), fill: '#4E8F3E', stroke: '#2F6A2C', 'stroke-width': 1.2, transform: `rotate(${n1(bend * 1.5)} ${n1(x + bend)} ${n1(y - 32 * s)})` }, q);
}
function house(el, g, x, y, s = 1) {
  el('rect', { x: n1(x - 11 * s), y: n1(y - 16 * s), width: n1(22 * s), height: n1(16 * s), fill: '#F3E3C6', stroke: '#6B5540', 'stroke-width': 1.2 }, g);
  el('path', { d: `M${n1(x - 14 * s)} ${n1(y - 15 * s)}L${x} ${n1(y - 27 * s)}L${n1(x + 14 * s)} ${n1(y - 15 * s)}Z`, fill: '#C25B3F', stroke: '#6B3A2A', 'stroke-width': 1.2 }, g);
}
// 從外到內的螺旋流線（dir：−1 ＝ 畫面上逆時針）
const spiral = (cx, cy, a0, r0, r1, twist, dir, n = 30) => { let d = ''; for (let k = 0; k <= n; k++) { const t = k / n, rad = r0 + (r1 - r0) * t, a = a0 + dir * t * twist; d += `${k ? 'L' : 'M'}${n1(cx + rad * Math.cos(a))} ${n1(cy + rad * Math.sin(a))}`; } return d; };
// 天氣圖上的鋒面符號
function frontSymbol(el, g, kind, x0, x1, y) {
  const q = el('g', {}, g), N = 5, step = (x1 - x0) / N;
  el('line', { x1: x0, y1: y, x2: x1, y2: y, stroke: kind === 'warm' ? '#C8372D' : '#2F6FB0', 'stroke-width': 4 }, q);
  if (kind === 'stationary') el('line', { x1: x0, y1: y, x2: x1, y2: y, stroke: '#C8372D', 'stroke-width': 4, 'stroke-dasharray': `${n1(step / 2)} ${n1(step / 2)}` }, q);
  for (let i = 0; i < N; i++) { const cx = x0 + step * (i + .5), cold = kind === 'cold' || (kind === 'stationary' && i % 2 === 0), up = kind !== 'stationary' || !cold;
    if (cold) el('path', { d: `M${n1(cx - 9)} ${y}L${n1(cx)} ${y + (up ? -13 : 13)}L${n1(cx + 9)} ${y}Z`, fill: '#2F6FB0' }, q);
    else el('path', { d: `M${n1(cx - 9)} ${y}A9 9 0 0 1 ${n1(cx + 9)} ${y}Z`, fill: '#C8372D' }, q); }
  return q;
}

function pressureScene({ rig, el, txt, s, r, step, set, drag, hint, kind }) {
  const can = kind === 'observe', low = r.flow === 'in', dir = r.rotation === 'ccw' ? -1 : 1, ty = s.system === 'typhoon';
  // 左：衛星俯視
  const cx = 290, cy = 300, cp = clip(el, rig, 'wx-map', 100, 120, 380, 350);
  const mg = el('g', { 'clip-path': cp }, rig);
  el('rect', { x: 100, y: 120, width: 380, height: 350, fill: 'url(#wx-sea)' }, mg);
  for (const [ix, iy, R, k] of [[140, 430, 60, 1], [455, 175, 46, 2], [430, 450, 30, 3]]) { let p = ''; for (let i = 0; i <= 36; i++) { const a = i / 36 * 2 * Math.PI, rr = R * (1 + .25 * Math.sin(a * 3 + k) + .1 * Math.sin(a * 7 + k)); p += `${i ? 'L' : 'M'}${n1(ix + rr * Math.cos(a))} ${n1(iy + rr * .75 * Math.sin(a))}`; }
    el('path', { d: p + 'Z', fill: k % 2 ? '#6E9A52' : '#8A9E5C', stroke: '#4B6E3A', 'stroke-width': 1.2, opacity: .9 }, mg); }
  const cl = el('g', { filter: 'url(#wx-blur)' }, mg);
  if (low) {
    const arms = ty ? 5 : 3, r0 = ty ? 175 : 165, r1 = ty ? 34 : 28, tw = ty ? 3.4 : 2.4;
    for (let i = 0; i < arms; i++) { const a0 = i * 2 * Math.PI / arms + .4, d = spiral(cx, cy, a0, r0, r1, tw, dir, 40);
      el('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': ty ? 34 : 24, opacity: ty ? .55 : .45, 'stroke-linecap': 'round' }, cl);
      el('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': ty ? 14 : 10, opacity: .8, 'stroke-linecap': 'round' }, cl); }
    el('circle', { cx, cy, r: ty ? 62 : 44, fill: '#fff', opacity: ty ? .92 : .75 }, cl);
    if (ty) el('circle', { cx, cy, r: 11, fill: '#1B4F86' }, mg);
  } else for (let i = 0; i < 9; i++) { const a = i * 2.4, rr = 95 + rnd(i, 2) * 70; el('ellipse', { cx: n1(cx + rr * Math.cos(a)), cy: n1(cy + rr * Math.sin(a)), rx: n1(10 + rnd(i, 4) * 10), ry: n1(6 + rnd(i, 5) * 5), fill: '#fff', opacity: .7 }, cl); }
  // 近地面的風
  for (let i = 0; i < 6; i++) { const a0 = i * Math.PI / 3 + .2, d = low ? spiral(cx, cy, a0, 160, 82, 1.05, dir, 14) : spiral(cx, cy, a0, 70, 158, 1.05, dir, 14);
    el('path', { d, fill: 'none', stroke: '#23304A', 'stroke-width': 8, opacity: .35, 'stroke-linecap': 'round' }, mg);
    el('path', { d, fill: 'none', stroke: '#FFD34E', 'stroke-width': 4.5, 'stroke-linecap': 'round', 'marker-end': 'url(#wx-y)' }, mg); }
  const lab = ty ? '颱' : low ? 'L' : 'H';
  el('circle', { cx, cy, r: 24, fill: '#fff', stroke: low ? '#C8372D' : '#2F6FB0', 'stroke-width': 3 }, mg);
  txt(mg, cx, cy + 10, lab, { 'font-size': 28, 'font-weight': 900, fill: low ? '#C8372D' : '#2F6FB0' });
  el('rect', { x: cx - 140 * K, y: 132, width: 280 * K, height: 30, rx: 15, fill: 'rgba(11,25,48,.7)' }, mg);
  txt(mg, cx, 153, `從上往下看：${s.hemi === 'north' ? '北' : '南'}半球的${SYS[s.system]}`, { 'font-size': 15, fill: '#fff' });
  el('rect', { x: 100, y: 120, width: 380, height: 350, rx: 16, fill: 'none', stroke: '#23304A', 'stroke-width': 3 }, rig);
  // 右上：側面看中心
  const sp = clip(el, rig, 'wx-side', 500, 120, 420, 180), sg = el('g', { 'clip-path': sp }, rig), up = r.vertical === 'up', mx = 710;
  el('rect', { x: 500, y: 120, width: 420, height: 180, fill: up ? 'url(#wx-skylo)' : 'url(#wx-skyhi)' }, sg);
  if (!up) { el('circle', { cx: 872, cy: 160, r: 30, fill: '#FFE680', opacity: .35 }, sg); el('circle', { cx: 872, cy: 160, r: 17, fill: '#FFD84A', stroke: '#F0A818', 'stroke-width': 2 }, sg); cumulus(el, sg, 560, 168, .5, .7); }
  el('path', { d: 'M500 278 Q560 266 620 276 T740 272 T860 276 T940 270 V300 H500Z', fill: 'url(#wx-grass)' }, sg);
  for (const [x, b] of [[540, 0], [600, 0], [840, 0], [890, 0]]) tree(el, sg, x, 282, .8, ty ? (x < mx ? 10 : -10) : b);
  house(el, sg, 640, 284, .9); house(el, sg, 790, 284, .9);
  if (up) { cumulonimbus(el, sg, mx, 232, ty ? 140 : 150, ty ? 200 : 160, 1, ty); rain(el, sg, mx - (ty ? 90 : 55), mx + (ty ? 90 : 55), 238, 280, ty ? 22 : 12, ty ? -9 : -4, ty ? 2.6 : 2); }
  const arr = (d, c, m) => { el('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': 9, opacity: .7, 'stroke-linecap': 'round' }, sg); el('path', { d, fill: 'none', stroke: c, 'stroke-width': 5, 'stroke-linecap': 'round', 'marker-end': `url(#wx-${m})` }, sg); };
  if (up) { arr('M520 262 H660', '#2F6FB0', 'b'); arr('M900 262 H760', '#2F6FB0', 'b'); arr(`M${mx - 18} 256 V170`, '#C8372D', 'r'); arr(`M${mx + 18} 256 V170`, '#C8372D', 'r'); }
  else { arr(`M${mx - 18} 150 V240`, '#2F6FB0', 'b'); arr(`M${mx + 18} 150 V240`, '#2F6FB0', 'b'); arr('M680 262 H530', '#C8372D', 'r'); arr('M740 262 H890', '#C8372D', 'r'); }
  el('rect', { x: 587 - 75 * K, y: 128, width: 150 * K, height: 26, rx: 13, fill: 'rgba(255,255,255,.88)' }, sg);
  txt(sg, 587, 146, '側面看中心', { 'font-size': 14 });
  el('rect', { x: 500, y: 120, width: 420, height: 180, rx: 16, fill: 'none', stroke: '#23304A', 'stroke-width': 3 }, rig);
  // 右下左：氣壓計
  panel(el, rig, 500, 314, 200, 156);
  txt(rig, 600, 332, '中心氣壓', { 'font-size': 13 });
  const bx = 600, by = 414, R = 44, pt = (deg, rr) => { const a = deg * Math.PI / 180; return [bx + rr * Math.sin(a), by - rr * Math.cos(a)]; };
  el('circle', { cx: bx, cy: by, r: R + 6, fill: '#F7F3EA', stroke: '#8A6A3C', 'stroke-width': 4 }, rig);
  const arc = (p0, p1, c) => { const [x0, y0] = pt(ang(p0), R - 6), [x1, y1] = pt(ang(p1), R - 6); el('path', { d: `M${n1(x0)} ${n1(y0)}A${R - 6} ${R - 6} 0 0 1 ${n1(x1)} ${n1(y1)}`, fill: 'none', stroke: c, 'stroke-width': 9 }, rig); };
  arc(940, 975, '#E0675B'); arc(975, 1013, '#F2B35A'); arc(1013, 1040, '#6FA8DC');
  for (let p = 940; p <= 1040; p += 10) { const [x0, y0] = pt(ang(p), R - 12), [x1, y1] = pt(ang(p), R - (p % 50 ? 17 : 21)); el('line', { x1: n1(x0), y1: n1(y0), x2: n1(x1), y2: n1(y1), stroke: '#23304A', 'stroke-width': p % 50 ? 1.2 : 2 }, rig); }
  for (const [p, t, c] of [[946, '颱風', '#C8372D'], [979, '低', '#B7791F'], [1034, '高', '#2F6FB0']]) { const [x, y] = pt(ang(p), R + 20); txt(rig, n1(x), n1(y + 4), t, { 'font-size': 12, fill: c, 'font-weight': 800 }); }
  const ng = el('g', { 'data-drag': can && step === 'pressure' ? 'needle' : null }, rig), nd = el('g', { transform: `rotate(${n1(ang(HPA[s.system]))} ${bx} ${by})` }, ng);
  el('circle', { cx: bx, cy: by, r: R, fill: 'transparent' }, ng);
  el('path', { d: `M${bx - 4} ${by + 10}L${bx} ${by - R + 10}L${bx + 4} ${by + 10}Z`, fill: '#C8372D', stroke: '#7A1E17', 'stroke-width': 1 }, nd);
  el('circle', { cx: bx, cy: by, r: 6, fill: '#23304A' }, ng);
  txt(rig, bx, by + 27, `約 ${HPA[s.system]}`, { 'font-size': 10, fill: '#5A6478' });
  if (can && step === 'pressure') drag(ng, () => { let p = HPA[s.system]; return {
    move(q) { const d = Math.max(-135, Math.min(135, Math.atan2(q.x - bx, by - q.y) * 180 / Math.PI)); p = 990 + d / 135 * 50; nd.setAttribute('transform', `rotate(${n1(d)} ${bx} ${by})`); },
    end() { const v = sysOf(p); if (v !== s.system) set({ system: v }); else nd.setAttribute('transform', `rotate(${n1(ang(HPA[s.system]))} ${bx} ${by})`); },
    cancel() { nd.setAttribute('transform', `rotate(${n1(ang(HPA[s.system]))} ${bx} ${by})`); } }; },
    { label: '轉氣壓計指針，換成下一種氣壓系統', tap: () => set({ system: { high: 'low', low: 'typhoon', typhoon: 'high' }[s.system] }) });
  // 右下右：地球與半球
  panel(el, rig, 716, 314, 204, 156);
  txt(rig, 818, 336, '在哪個半球？', { 'font-size': 13 });
  const gx = 790, gy = 404, gr = 50; earth(el, rig, gx, gy, gr, { seed: 4 });
  el('line', { x1: gx - gr, y1: gy, x2: gx + gr, y2: gy, stroke: '#FFD34E', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, rig);
  txt(rig, gx + gr + 34, gy + 4, '赤道', { 'font-size': 11, fill: '#8A6A1C' });
  txt(rig, gx + gr + 34, gy - 26, '北半球', { 'font-size': 12, fill: s.hemi === 'north' ? '#C8372D' : '#8792A6', 'font-weight': s.hemi === 'north' ? 800 : 500 });
  txt(rig, gx + gr + 34, gy + 36, '南半球', { 'font-size': 12, fill: s.hemi === 'south' ? '#C8372D' : '#8792A6', 'font-weight': s.hemi === 'south' ? 800 : 500 });
  const py = gy + (s.hemi === 'north' ? -28 : 28), pg = el('g', { 'data-drag': can && step === 'hemi' ? 'pin' : null }, rig), pin = el('g', {}, pg);
  el('rect', { x: gx - 30, y: gy - gr, width: 60, height: gr * 2, fill: 'transparent' }, pg);
  el('path', { d: `M${gx + 8} ${py}c-9 -10 -12 -15 -12 -20a12 12 0 0 1 24 0c0 5 -3 10 -12 20z`, fill: '#C8372D', stroke: '#fff', 'stroke-width': 2 }, pin);
  el('circle', { cx: gx + 8, cy: py - 20, r: 4.5, fill: '#fff' }, pin);
  if (can && step === 'hemi') drag(pg, () => { let y = py; return {
    move(q) { y = Math.max(gy - 40, Math.min(gy + 40, q.y)); pin.setAttribute('transform', `translate(0 ${n1(y - py)})`); },
    end() { const v = y < gy ? 'north' : 'south'; if (v !== s.hemi) set({ hemi: v }); else pin.removeAttribute('transform'); },
    cancel() { pin.removeAttribute('transform'); } }; },
    { label: '把圖釘移到另一個半球', tap: () => set({ hemi: s.hemi === 'north' ? 'south' : 'north' }) });
  hint(510, 500, step === 'pressure' ? '轉動氣壓計的紅色指針' : step === 'hemi' ? '把地球上的圖釘拖到另一個半球' : '');
}

function frontScene({ rig, el, txt, s, r, step, set, drag, hint, kind }) {
  const can = kind === 'observe', F = s.front, f = FX[F][s.phase], cp = clip(el, rig, 'wx-fr', 100, 120, 820, 350);
  const g = el('g', { 'clip-path': cp }, rig);
  el('rect', { x: 100, y: 120, width: 820, height: 350, fill: 'url(#wx-skyfr)' }, g);
  el('rect', { x: 100, y: 120, width: 820, height: 312, fill: '#F08A5D', opacity: .1 }, g);
  for (const [x, y, sc] of [[860, 170, .45], [180, 180, .4]]) cumulus(el, g, x, y, sc, .55);
  // 可以左右移動的鋒面（冷氣團、雲、雨、箭頭）
  const mv = el('g', {}, g), fr = el('g', {}, mv), G = 432;
  const wedge = F === 'cold' ? `M${f} ${G}C${f - 6} ${G - 70} ${f - 55} ${G - 128} ${f - 190} ${G - 146}L${f - 900} ${G - 170}V${G}Z`
    : F === 'warm' ? `M${f} ${G}Q${f - 260} ${G - 26} ${f - 560} ${G - 128}L${f - 900} ${G - 150}V${G}Z`
    : `M${f} ${G}Q${f - 140} ${G - 50} ${f - 360} ${G - 122}L${f - 900} ${G - 160}V${G}Z`;
  el('path', { d: wedge, fill: 'url(#wx-cold)', stroke: '#2F6FB0', 'stroke-width': 3, 'stroke-dasharray': '10 6' }, fr);
  const arr = (d, c, m) => { el('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': 10, opacity: .7, 'stroke-linecap': 'round' }, fr); el('path', { d, fill: 'none', stroke: c, 'stroke-width': 5.5, 'stroke-linecap': 'round', 'marker-end': `url(#wx-${m})` }, fr); };
  if (F === 'cold') {
    arr(`M${f + 170} ${G - 18} Q${f + 30} ${G - 40} ${f - 10} ${G - 200}`, '#C8372D', 'r');
    arr(`M${f - 200} ${G - 40} H${f - 70}`, '#2F6FB0', 'b');
    rain(el, fr, f - 95, f + 15, G - 125, G, 12, -5, 2.6);
    cumulonimbus(el, fr, f - 40, G - 126, 178, 190, 1);
  } else if (F === 'warm') {
    arr(`M${f + 200} ${G - 30} Q${f - 60} ${G - 60} ${f - 330} ${G - 160}`, '#C8372D', 'r');
    arr(`M${f + 120} ${G - 120} H${f + 10}`, '#C8372D', 'r');
    rain(el, fr, f - 270, f - 20, G - 92, G, 22, -3, 1.8);
    stratus(el, fr, f - 30, G - 96, f - 330, G - 170, 36);
    stratus(el, fr, f - 300, G - 176, f - 560, G - 236, 22, .9);
    el('path', { d: `M${f - 520} ${G - 272}q30 -10 60 -4M${f - 470} ${G - 284}q36 -12 70 -2M${f - 600} ${G - 262}q26 -8 50 -3`, stroke: '#fff', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', opacity: .9 }, fr);
  } else {
    arr(`M${f + 170} ${G - 40} Q${f - 40} ${G - 70} ${f - 240} ${G - 150}`, '#C8372D', 'r');
    arr(`M${f - 220} ${G - 40} H${f - 110}`, '#2F6FB0', 'b'); arr(`M${f + 100} ${G - 120} H${f + 30}`, '#C8372D', 'r');
    rain(el, fr, f - 300, f + 40, G - 110, G, 28, -3, 2);
    stratus(el, fr, f + 40, G - 112, f - 340, G - 176, 40);
  }
  txt(fr, Math.max(170, f - 300), G - 64, '冷氣團', { 'font-size': 17, fill: '#1F5C9E', 'font-weight': 800 });
  txt(fr, Math.min(868, f + 150), f + 150 > 868 ? G - 40 : G - 70 - (F === 'cold' ? 70 : 90), '暖氣團', { 'font-size': 17, fill: '#B23A2B', 'font-weight': 800 });
  // 地面
  el('path', { d: `M100 ${G}H920V470H100Z`, fill: 'url(#wx-grass)' }, g);
  el('path', { d: `M100 ${G}H920`, stroke: '#3E6E2E', 'stroke-width': 2.5 }, g);
  for (const [x, sc] of [[150, .9], [260, .8], [700, .85], [880, .9]]) tree(el, g, x, G + 4, sc, 0);
  for (const x of [330, 790]) house(el, g, x, G + 4, .9);
  // 觀測站
  const st = el('g', {}, g);
  el('path', { d: `M${SX - 12} ${G}l4 -34M${SX + 12} ${G}l-4 -34`, stroke: '#5A4632', 'stroke-width': 3 }, st);
  el('rect', { x: SX - 16, y: G - 58, width: 32, height: 26, fill: '#fff', stroke: '#23304A', 'stroke-width': 2 }, st);
  for (let i = 0; i < 4; i++) el('line', { x1: SX - 12, y1: G - 53 + i * 6, x2: SX + 12, y2: G - 53 + i * 6, stroke: '#9AA5B6', 'stroke-width': 1.4 }, st);
  el('path', { d: `M${SX - 18} ${G - 58}h36l-4 -6h-28z`, fill: '#E7ECF2', stroke: '#23304A', 'stroke-width': 1.6 }, st);
  el('path', { d: `M${SX + 26} ${G}V${G - 78}`, stroke: '#5A6478', 'stroke-width': 2.4 }, st);
  for (const dx of [-9, 9]) { el('line', { x1: SX + 26, y1: G - 78, x2: SX + 26 + dx, y2: G - 80, stroke: '#5A6478', 'stroke-width': 1.8 }, st); el('circle', { cx: SX + 26 + dx, cy: G - 80, r: 3, fill: '#5A6478' }, st); }
  const air = F === 'cold' ? (f > SX + 20 ? 'cold' : f < SX - 20 ? 'warm' : 'front') : F === 'warm' ? (f > SX + 20 ? 'cold' : f < SX - 20 ? 'warm' : 'front') : 'front';
  const tag = { cold: ['在冷氣團裡', '#2F6FB0'], warm: ['在暖氣團裡', '#C8372D'], front: ['鋒面正經過', '#5A3FA0'] }[air];
  el('rect', { x: SX - 74 * K, y: G + 8, width: 148 * K, height: 24, rx: 12, fill: '#fff', stroke: tag[1], 'stroke-width': 2 }, g);
  txt(g, SX, G + 25, `觀測站・${tag[0]}`, { 'font-size': 12, fill: tag[1], 'font-weight': 700 });
  el('rect', { x: 100, y: 120, width: 820, height: 350, rx: 16, fill: 'none', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: 510 - 180 * K, y: 130, width: 360 * K, height: 30, rx: 15, fill: 'rgba(255,255,255,.9)' }, rig);
  const arrow = F === 'cold' ? '冷氣團推進 →' : F === 'warm' ? '← 暖氣團推進' : '兩邊勢力相當，鋒面不太動';
  txt(rig, 510, 151, `${FRONT[F]}剖面・${arrow}`, { 'font-size': 15 });
  // 拖動鋒面（冷鋒過境）
  const movable = can && step === 'pass';
  if (movable) el('rect', { x: f - 120, y: 170, width: 200, height: G - 170, fill: 'transparent', 'data-drag': 'front' }, mv);
  if (movable) drag(mv, p0 => { let dx = 0; return {
    move(p) { dx = Math.max(FX.cold.before - f, Math.min(FX.cold.after - f, p.x - p0.x)); mv.setAttribute('transform', `translate(${n1(dx)} 0)`); },
    end() { const x = f + dx, v = Object.entries(FX.cold).reduce((m, e) => Math.abs(e[1] - x) < Math.abs(m[1] - x) ? e : m)[0]; if (v !== s.phase) set({ phase: v }); else mv.removeAttribute('transform'); },
    cancel() { mv.removeAttribute('transform'); } }; },
    { label: '把冷鋒往右推過觀測站', tap: () => set({ phase: { before: 'during', during: 'after', after: 'before' }[s.phase] }) });
  // 下方：天氣圖符號＋冷暖氣團拔河
  panel(el, rig, 100, 482, 300, 62);
  txt(rig, 160, 518, '天氣圖上', { 'font-size': 13 });
  frontSymbol(el, rig, F, 214, 384, 522);
  panel(el, rig, 416, 482, 504, 62);
  const tug = step === 'front';
  txt(rig, 490, 518, '暖氣團較強', { 'font-size': 13, fill: '#B23A2B' });
  txt(rig, 850, 518, '冷氣團較強', { 'font-size': 13, fill: '#1F5C9E' });
  el('line', { x1: 570, y1: 513, x2: 770, y2: 513, stroke: '#C9D1DC', 'stroke-width': 8, 'stroke-linecap': 'round' }, rig);
  for (const [k, x] of Object.entries(KNOB)) { el('circle', { cx: x, cy: 513, r: 4, fill: '#8792A6' }, rig); txt(rig, x, 538, FRONT[k], { 'font-size': 10.5, fill: k === F ? '#23304A' : '#8792A6' }); }
  const kg = el('g', { 'data-drag': can && tug ? 'tug' : null, opacity: tug ? 1 : .55 }, rig), kn = el('g', {}, kg), kx = KNOB[F];
  el('rect', { x: 560, y: 490, width: 220, height: 40, fill: 'transparent' }, kg);
  el('circle', { cx: kx, cy: 513, r: 13, fill: '#fff', stroke: '#23304A', 'stroke-width': 3 }, kn);
  el('path', { d: `M${kx - 5} 509l-4 4 4 4M${kx + 5} 509l4 4 -4 4`, stroke: '#23304A', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }, kn);
  if (can && tug) drag(kg, () => { let x = kx; return {
    move(p) { x = Math.max(KNOB.warm, Math.min(KNOB.cold, p.x)); kn.setAttribute('transform', `translate(${n1(x - kx)} 0)`); },
    end() { const v = Object.entries(KNOB).reduce((m, e) => Math.abs(e[1] - x) < Math.abs(m[1] - x) ? e : m)[0]; if (v !== F) set({ front: v }); else kn.removeAttribute('transform'); },
    cancel() { kn.removeAttribute('transform'); } }; },
    { label: '改變冷暖氣團誰比較強', tap: () => set({ front: { cold: 'warm', warm: 'stationary', stationary: 'cold' }[F] }) });
  hint(510, 566, step === 'front' ? '拖動下方的圓鈕：哪邊的氣團比較強？' : step === 'pass' ? '把冷鋒往右推過觀測站' : '');
}

let K = 1;
function scene(api) { K = api.k || 1; skyDefs(api.el, api.rig); defs(api.el, api.rig); return api.s.mode === 'pressure' ? pressureScene(api) : frontScene(api); }

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: s => s.mode === 'pressure' ? `${s.hemi === 'north' ? '北' : '南'}半球・${SYS[s.system]}` : `${FRONT[s.front]}・${PHASE[s.phase]}`,
  body: (s, r) => s.mode === 'pressure' ? `${ROT[r.rotation]}${r.flow === 'in' ? '吹入' : '吹出'}，中心${r.vertical === 'up' ? '上升' : '下沉'}，${r.weather}` : `${r.cloud}；${r.now}` });
const P0 = { mode: 'pressure', hemi: 'north', system: 'low', front: 'cold', phase: 'during' };

runDesk({
  key: 'bhcs.lab.weather.v1', title: '天氣系統實驗桌', background: 'bg-physics-bench',
  sceneLabel: '天氣系統實驗桌：氣壓部分從上往下看風的旋轉方向，並從側面看中心空氣上升或下沉；鋒面部分畫出冷暖氣團、雲、雨與觀測站',
  initial: { ...P0 },
  model, scene, viewBox: (id, st) => st.mode === 'front' ? { desk: '80 100 860 490', phone: '80 100 860 490' } : { desk: '80 100 860 420', phone: '80 100 860 420' }, phoneText: 1.4,
  readouts: (s, r) => s.mode === 'pressure'
    ? [['近地面風', ROT[r.rotation], '', r.flow === 'in' ? '向中心吹入' : '向外吹出'], ['中心空氣', r.vertical === 'up' ? '上升' : '下沉', ''], ['天氣', { '晴朗、穩定': '晴朗', '容易成雲致雨': '易下雨', '強風豪雨': '強風豪雨' }[r.weather] || r.weather, '', r.weather]]
    : [['鋒面', FRONT[s.front], '', PHASE[s.phase]], ['雲', r.cloud.replace(/（.*）|為主.*$/g, '').split('，')[0], ''], ['過境後氣溫', { down: '下降', up: '上升', flat: '變化小' }[r.afterTemp], '']],
  why: { title: '氣壓與鋒面', button: '天氣怎麼變', html: `
    <p class="fn-tip"><b>高氣壓：</b>空氣從中心下沉、向外吹出，北半球順時針旋轉，天氣多半晴朗穩定。</p>
    <p class="fn-tip"><b>低氣壓：</b>空氣向中心吹入、在中心上升，上升冷卻容易成雲下雨；北半球逆時針旋轉。颱風是很強的熱帶低氣壓。南半球旋轉方向相反，吹入或吹出不變。</p>
    <p class="fn-tip"><b>冷鋒：</b>冷氣團推著暖空氣快速抬升，形成積雨雲，雨勢急而短，過境後氣溫下降。<b>暖鋒：</b>暖空氣沿冷氣團緩緩爬升，雲層廣，雨勢緩而久，過境後氣溫上升。<b>滯留鋒：</b>勢力相當、不太移動，例如臺灣的梅雨。</p>` },
  steps: [
    { id: 'pressure', label: '高低氣壓', title: '高氣壓和低氣壓，風怎麼吹？', goal: '北半球。比較高氣壓、低氣壓和颱風的風向、中心氣流和天氣，各收一張。',
      intro: '看左邊的風：是吹向中心還是向外吹？順時針還是逆時針？', enter: { ...P0 },
      controls: [{ key: 'system', label: '氣壓系統', type: 'seg', options: [['high', '高氣壓'], ['low', '低氣壓'], ['typhoon', '颱風']] }],
      react: (s, r) => `${SYS[s.system]}：${ROT[r.rotation]}${r.flow === 'in' ? '吹入' : '吹出'}，中心${r.vertical === 'up' ? '上升' : '下沉'}。`,
      targets: [tgt('ph', '高氣壓', { ...P0, system: 'high' }, '選高氣壓。'), tgt('pl', '低氣壓', { ...P0 }, '選低氣壓。'), tgt('pt', '颱風', { ...P0, system: 'typhoon' }, '選颱風。')],
      found: ['北半球高氣壓順時針吹出、中心下沉，天氣晴；低氣壓與颱風逆時針吹入、中心上升，容易下雨。', '上升冷卻成雲；下沉增溫不易成雲'] },
    { id: 'hemi', label: '南北半球', title: '到了南半球，旋轉方向一樣嗎？', goal: '比較北半球和南半球的低氣壓，各收一張。',
      intro: '澳洲在南半球。那裡的颱風（熱帶氣旋）怎麼轉？', enter: { ...P0, hemi: 'south' },
      controls: [{ key: 'hemi', label: '半球', type: 'seg', options: [['north', '北半球'], ['south', '南半球']], cols: 2 }],
      react: (s, r) => `${s.hemi === 'north' ? '北' : '南'}半球低氣壓：${ROT[r.rotation]}吹入。`,
      targets: [tgt('hn', '北半球低氣壓', { ...P0 }, '選北半球。'), tgt('hs', '南半球低氣壓', { ...P0, hemi: 'south' }, '選南半球。')],
      found: ['南半球的旋轉方向和北半球相反，但低氣壓一樣向中心吹入、中心上升。', '北半球低氣壓逆時針，南半球順時針'] },
    { id: 'front', label: '三種鋒面', title: '冷鋒、暖鋒、滯留鋒有什麼不同？', goal: '比較三種鋒面過境時的雲和雨，各收一張。',
      intro: '冷暖空氣相遇的交界就是鋒面。看看雲長什麼樣子！', enter: { ...P0, mode: 'front', front: 'cold', phase: 'during' },
      controls: [{ key: 'front', label: '鋒面', type: 'seg', options: [['cold', '冷鋒'], ['warm', '暖鋒'], ['stationary', '滯留鋒']] }],
      react: (s, r) => `${FRONT[s.front]}：${r.cloud}，${r.rain}。`,
      targets: [tgt('fc', '冷鋒', { ...P0, mode: 'front', front: 'cold', phase: 'during' }, '選冷鋒。'), tgt('fw', '暖鋒', { ...P0, mode: 'front', front: 'warm', phase: 'during' }, '選暖鋒。'), tgt('fs', '滯留鋒', { ...P0, mode: 'front', front: 'stationary', phase: 'during' }, '選滯留鋒。')],
      found: ['冷鋒：積雨雲、雨急而短；暖鋒：層狀雲、雨緩而久；滯留鋒：長時間下雨（梅雨）。', '冷空氣重，在下面；暖空氣輕，被抬升'] },
    { id: 'pass', label: '冷鋒過境', title: '冷鋒過境前後，天氣怎麼變？', goal: '冷鋒。比較過境前和過境後的天氣，各收一張。',
      intro: '冬天的冷鋒來了！過境前後，觀測站的天氣有什麼不同？', enter: { ...P0, mode: 'front', front: 'cold', phase: 'before' },
      controls: [{ key: 'phase', label: '時間', type: 'seg', options: [['before', '過境前'], ['during', '過境中'], ['after', '過境後']] }],
      react: (s, r) => `${PHASE[s.phase]}：${r.now}。`,
      targets: [tgt('pb', '過境前', { ...P0, mode: 'front', front: 'cold', phase: 'before' }, '選過境前。'), tgt('pa', '過境後', { ...P0, mode: 'front', front: 'cold', phase: 'after' }, '選過境後。')],
      found: ['冷鋒過境後由冷氣團控制，氣溫下降、氣壓上升，天氣轉晴。', '冷鋒過境：先下陣雨，再變冷'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想空氣是上升還是下沉。',
      found: ['你把天氣系統弄懂了！', '上升成雲致雨，下沉晴朗穩定'] }
  ],
  quiz: [
    { q: '北半球的高氣壓，近地面的風？', options: [
      { text: '逆時針向中心吹入。', why: '那是低氣壓。你的證據：高氣壓順時針向外吹出。' },
      { text: '順時針向外吹出。', ok: true },
      { text: '不會旋轉。', why: '受地球自轉影響，風會偏轉成旋轉的樣子。' }] },
    { q: '為什麼低氣壓附近容易下雨？', options: [
      { text: '空氣在中心上升、冷卻，水氣凝結成雲。', ok: true },
      { text: '空氣在中心下沉。', why: '下沉的空氣會增溫，不容易成雲，那是高氣壓。' },
      { text: '因為低氣壓比較冷。', why: '重點是空氣上升冷卻，水氣凝結。' }] },
    { q: '冬天冷鋒過境後，天氣通常？', options: [
      { text: '氣溫上升。', why: '那是暖鋒過境後。你的證據：冷鋒過境後由冷氣團控制，氣溫下降。' },
      { text: '氣溫下降，天氣轉晴。', ok: true },
      { text: '連續下好幾天雨。', why: '長時間下雨是滯留鋒（梅雨）的特徵。' }] }
  ],
  finish: { title: '你把天氣系統弄懂了！', rule: '高氣壓下沉、晴朗；低氣壓上升、多雨，北半球低氣壓逆時針、南半球相反。冷鋒雨急而短、過境後變冷；暖鋒雨緩而久、過境後變暖；滯留鋒久雨不停。', next: { label: '回自然實驗總覽', href: '../../science/' } }
});
