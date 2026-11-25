// 電流熱效應實驗桌：電熱線泡在 100 g 的水裡，比較固定電壓與固定電流時的電功率、電能和升溫；數值見 model.mjs。
import { runDesk } from '../shared/desk.mjs';
import { heat, METERS, kWh, START } from './model.mjs';
const n1 = v => (+v).toFixed(1), f2 = x => String(Math.round(x * 100) / 100), t1 = x => (Math.round(x * 10) / 10).toFixed(1);
const MODE = { V: '固定 6 V', I: '固定 1 A' };
const TMAX = 140, ANG = t => t / TMAX * 300;
const model = s => ({ ...heat(s), kwh: kWh(...METERS[s.meter]) });

function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('linearGradient', 'ep-box', [[0, '#F4F1EA'], [1, '#CFC8B8']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'ep-glass', [[0, '#fff', .75], [.15, '#fff', .15], [.85, '#fff', .1], [1, '#fff', .6]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  g('linearGradient', 'ep-water', [[0, '#BFE3F5'], [1, '#8EC6E6']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('radialGradient', 'ep-glow', [[0, '#FFD27A', .9], [.6, '#FF8A3D', .35], [1, '#FF8A3D', 0]]);
}
const wire = (el, g, d, c) => { el('path', { d, fill: 'none', stroke: '#23304A', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g); el('path', { d, fill: 'none', stroke: c, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g); };
// 電熱線：電阻越大圈數越多；通電時依功率發紅光
function coil(el, g, x, y, ohm, P, on) {
  const q = el('g', {}, g), n = ohm === 12 ? 9 : 5, w = 84, step = w / n;
  if (on) el('ellipse', { cx: x, cy: y, rx: 70, ry: 40, fill: 'url(#ep-glow)', opacity: Math.min(1, .25 + P / 12) }, q);
  let p = `M${x - w / 2 - 14} ${y - 60}V${y}`; for (let i = 0; i < n; i++) { const a = x - w / 2 + i * step; p += `C${n1(a + step * .2)} ${y - 18} ${n1(a + step * .8)} ${y - 18} ${n1(a + step)} ${y}C${n1(a + step * .8)} ${y + 18} ${n1(a + step * .2)} ${y + 18} ${n1(a)} ${y}M${n1(a + step)} ${y}`; }
  p += `M${x + w / 2} ${y}H${x + w / 2 + 14}V${y - 60}`;
  el('path', { d: p, fill: 'none', stroke: '#5A3A22', 'stroke-width': 5, 'stroke-linecap': 'round' }, q);
  el('path', { d: p, fill: 'none', stroke: on ? (P >= 12 ? '#FF6A2A' : P >= 6 ? '#F08A3D' : '#C98A5A') : '#B98A5E', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, q);
  return q;
}
function dial(el, txt, g, x, y, label, val, max, unit) {
  el('circle', { cx: x, cy: y, r: 36, fill: '#FFFDF6', stroke: '#23304A', 'stroke-width': 3 }, g);
  el('path', { d: `M${x - 26} ${y + 6}A27 27 0 0 1 ${x + 26} ${y + 6}`, fill: 'none', stroke: '#B8AC98', 'stroke-width': 2 }, g);
  for (let k = 0; k <= 4; k++) { const a = (-150 + k * 30) * Math.PI / 180; el('line', { x1: n1(x + 24 * Math.cos(a)), y1: n1(y + 6 + 24 * Math.sin(a)), x2: n1(x + 29 * Math.cos(a)), y2: n1(y + 6 + 29 * Math.sin(a)), stroke: '#23304A', 'stroke-width': 1.5 }, g); }
  const a = (-150 + 120 * Math.min(1, val / max)) * Math.PI / 180;
  el('line', { x1: x, y1: y + 6, x2: n1(x + 26 * Math.cos(a)), y2: n1(y + 6 + 26 * Math.sin(a)), stroke: '#C8372D', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, g);
  el('circle', { cx: x, cy: y + 6, r: 3.5, fill: '#23304A' }, g);
  txt(g, x, y - 52, label === 'A' ? '安培計' : '伏特計', { 'font-size': 12, fill: '#5A6478' });
  txt(g, x, y + 26, `${f2(val)} ${unit}`, { 'font-size': 11, fill: '#5A6478' });
}

// 圖表：每一步要比較的組合
const REFS = { base: [['V', 6]], ohm: [['V', 6], ['V', 12]], time: [['V', 6]], current: [['I', 6], ['I', 12]] };
const COLOR = { 'V6': '#2F6FB0', 'V12': '#C8372D', 'I6': '#2E8B66', 'I12': '#7A4BB5' };

function heatScene({ rig, el, txt, P, s, r, step, set, drag, hint, kind, narrow }) {
  const can = kind === 'observe', on = s.time > 0;
  const opts = { base: [0, 35, 70], ohm: [0, 35, 70], time: [0, 70, 140], current: [0, 35, 70] }[step] || [s.time];
  // 電源供應器
  el('rect', { x: 80, y: 110, width: 180, height: 116, rx: 14, fill: 'url(#ep-box)', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: 98, y: 126, width: 144, height: 40, rx: 6, fill: '#1E2B22' }, rig);
  txt(rig, 170, 153, s.mode === 'V' ? '6.0 V' : '1.00 A', { 'font-size': 20, fill: '#7CF29A', 'font-family': 'monospace' });
  txt(rig, 170, 190, MODE[s.mode], { 'font-size': 15 });
  txt(rig, 170, 212, s.mode === 'V' ? '電壓不變，電流自己調' : '電流不變，電壓自己調', { 'font-size': 11, fill: '#5A6478' });
  el('circle', { cx: 104, cy: 236, r: 8, fill: '#3A3F48', stroke: '#23304A' }, rig); el('circle', { cx: 236, cy: 236, r: 8, fill: '#C8372D', stroke: '#23304A' }, rig);
  // 燒杯、水、電熱線、溫度計
  const bx = 310, bw = 220, top = 300, bot = 500, wl = 336;
  el('ellipse', { cx: bx + bw / 2, cy: bot + 8, rx: 126, ry: 10, fill: '#000', opacity: .12 }, rig);
  el('path', { d: `M${bx} ${wl}V${bot - 16}q0 16 16 16H${bx + bw - 16}q16 0 16 -16V${wl}Z`, fill: 'url(#ep-water)' }, rig);
  coil(el, rig, bx + 100, 452, s.ohm, r.P, on);
  if (on && r.P >= 6) for (let i = 0; i < 6; i++) el('circle', { cx: bx + 60 + i * 16, cy: 420 - (i % 3) * 18, r: 2.5, fill: '#fff', opacity: .7 }, rig);
  // 溫度計（刻度 25～28°C）
  const tx = bx + 186, ty0 = 470, ty1 = 250, Y = c => ty0 - (c - 25) / 3 * (ty0 - ty1);
  el('rect', { x: tx - 9, y: ty1 - 20, width: 18, height: ty0 - ty1 + 30, rx: 9, fill: '#fff', stroke: '#23304A', 'stroke-width': 2.5 }, rig);
  el('rect', { x: tx - 4, y: n1(Y(r.temp)), width: 8, height: n1(ty0 + 4 - Y(r.temp)), fill: '#D8443A' }, rig);
  el('circle', { cx: tx, cy: ty0 + 10, r: 12, fill: '#D8443A', stroke: '#23304A', 'stroke-width': 2.5 }, rig);
  for (const c of [25, 26, 27, 28]) { el('line', { x1: tx + 9, y1: Y(c), x2: tx + 17, y2: Y(c), stroke: '#23304A', 'stroke-width': 1.5 }, rig); txt(rig, tx + 34, Y(c) + 4, `${c}°`, { 'font-size': 12, fill: '#5A6478' }); }
  txt(rig, tx - 2, ty1 - 30, `${t1(r.temp)}°C`, { 'font-size': 17, fill: '#C8372D', 'font-weight': 900 });
  el('path', { d: `M${bx - 4} ${top}V${bot - 14}q0 20 20 20H${bx + bw - 16}q20 0 20 -20V${top}`, fill: 'url(#ep-glass)', stroke: '#23304A', 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, rig);
  el('path', { d: `M${bx} ${wl}Q${bx + bw / 2} ${wl + 5} ${bx + bw} ${wl}`, fill: 'none', stroke: '#fff', 'stroke-width': 2 }, rig);
  txt(rig, bx + 60, bot + 34, `水 100 g・電熱線 ${s.ohm} Ω`, { 'font-size': 14 });
  // 導線（通電時紅色）
  wire(el, rig, `M104 236V270H${bx + 36}V392`, on ? '#3A3F48' : '#8792A6');
  wire(el, rig, `M236 236V258H${bx + 164}V392`, on ? '#C8372D' : '#8792A6');
  // 電表
  dial(el, txt, rig, 340, 150, 'A', on ? r.I : 0, 2, 'A'); dial(el, txt, rig, 430, 150, 'V', on ? r.V : 0, 15, 'V');
  // 碼錶：拖指針設定通電時間
  const cx = 596, cy = 150, R = 44;
  el('rect', { x: cx - 6, y: cy - R - 18, width: 12, height: 14, rx: 3, fill: '#5A6478' }, rig);
  el('circle', { cx, cy, r: R + 6, fill: '#E9EDF2', stroke: '#23304A', 'stroke-width': 3 }, rig); el('circle', { cx, cy, r: R - 4, fill: '#FFFDF6', stroke: '#8792A6', 'stroke-width': 1.5 }, rig);
  const pt = (deg, rr) => [cx + rr * Math.sin(deg * Math.PI / 180), cy - rr * Math.cos(deg * Math.PI / 180)];
  if (s.time) { const [x1, y1] = pt(ANG(s.time), R - 10); el('path', { d: `M${cx} ${cy}V${cy - R + 10}A${R - 10} ${R - 10} 0 ${ANG(s.time) > 180 ? 1 : 0} 1 ${n1(x1)} ${n1(y1)}Z`, fill: '#FCE3A8' }, rig); }
  for (const t of opts) { const [x, y] = pt(ANG(t), R + 18); el('circle', { cx: n1(pt(ANG(t), R - 10)[0]), cy: n1(pt(ANG(t), R - 10)[1]), r: 3, fill: '#23304A' }, rig); txt(rig, n1(x), n1(y + 4), `${t}`, { 'font-size': 12, fill: t === s.time ? '#C8372D' : '#5A6478' }); }
  txt(rig, cx, cy + R + 32, `通電 ${s.time} 秒`, { 'font-size': 14 });
  const hg = el('g', { 'data-drag': can && opts.length > 1 ? 'timer' : null }, rig), hand = el('g', { transform: `rotate(${ANG(s.time)} ${cx} ${cy})` }, hg);
  el('circle', { cx, cy, r: R + 4, fill: 'transparent' }, hg);
  el('path', { d: `M${cx - 3.5} ${cy + 8}L${cx} ${cy - R + 12}L${cx + 3.5} ${cy + 8}Z`, fill: '#C8372D' }, hand); el('circle', { cx, cy, r: 5, fill: '#23304A' }, hg);
  const back = () => hand.setAttribute('transform', `rotate(${ANG(s.time)} ${cx} ${cy})`);
  if (can && opts.length > 1) drag(hg, () => { let d = ANG(s.time); return {
    move(p) { d = Math.atan2(p.x - cx, cy - p.y) * 180 / Math.PI; if (d < -30) d += 360; d = Math.max(0, Math.min(300, d)); hand.setAttribute('transform', `rotate(${n1(d)} ${cx} ${cy})`); },
    end() { const v = opts.reduce((m, t) => Math.abs(ANG(t) - d) < Math.abs(ANG(m) - d) ? t : m); if (v !== s.time) set({ time: v }); else back(); }, cancel: back }; },
    { label: '轉碼錶，通電久一點', tap: () => set({ time: opts[(opts.indexOf(s.time) + 1) % opts.length] }) });
  // 換電熱線：從架上拖進燒杯
  if (step === 'ohm' || step === 'current') {
    const other = s.ohm === 6 ? 12 : 6, gx = 130, gy = 420;
    el('rect', { x: 66, y: 370, width: 160, height: 110, rx: 14, fill: 'rgba(255,255,255,.92)', stroke: '#23304A', 'stroke-width': 2 }, rig);
    txt(rig, 146, 392, `換成 ${other} Ω`, { 'font-size': 13 });
    const sg = el('g', { 'data-drag': can ? 'coil' : null }, rig), sm = el('g', {}, sg);
    coil(el, sm, gx + 16, gy + 30, other, 0, false); el('rect', { x: 70, y: 370, width: 150, height: 106, fill: 'transparent' }, sm);
    if (can) drag(sg, p0 => { let q = p0; return { move(p) { q = p; sm.setAttribute('transform', `translate(${n1(p.x - p0.x)} ${n1(p.y - p0.y)})`); },
      end() { if (q.x > bx - 10 && q.x < bx + bw + 10 && q.y > top - 30) set({ ohm: other }); else sm.removeAttribute('transform'); }, cancel() { sm.removeAttribute('transform'); } }; },
      { label: `把電熱線換成 ${other} Ω`, tap: () => set({ ohm: other }) });
  }
  // 右：水溫—時間圖（手機排到燒杯下面）
  const gr = el('g', { transform: narrow ? 'translate(-836 325) scale(1.3)' : null }, rig);
  const gx = 724, gy = 470, W = 210, H = 220, xm = step === 'time' ? 140 : 70, X = t => gx + t / xm * W, Yg = c => gy - (c - 25) / 2.2 * H;
  el('rect', { x: gx - 46, y: gy - H - 46, width: W + 70, height: H + 90, rx: 16, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 2.5 }, gr);
  txt(gr, gx + W / 2 - 16, gy - H - 22, '水溫（°C）對通電時間', { 'font-size': 13, fill: '#5A6478' });
  for (const c of [25, 26, 27]) { el('line', { x1: gx, y1: Yg(c), x2: gx + W, y2: Yg(c), stroke: '#E5E9EE', 'stroke-width': 1 }, gr); txt(gr, gx - 18, Yg(c) + 4, `${c}`, { 'font-size': 12, fill: '#5A6478' }); }
  for (const t of [0, xm / 2, xm]) txt(gr, X(t), gy + 20, `${t}`, { 'font-size': 12, fill: '#5A6478' });
  txt(gr, gx + W / 2, gy + 38, '秒', { 'font-size': 12, fill: '#5A6478' });
  el('path', { d: `M${gx} ${gy - H}V${gy}H${gx + W}`, fill: 'none', stroke: '#23304A', 'stroke-width': 2 }, gr);
  for (const [m, o] of REFS[step] || []) { const cur = m === s.mode && o === s.ohm, h = heat({ mode: m, ohm: o, time: xm }), c = COLOR[m + o];
    el('line', { x1: X(0), y1: Yg(25), x2: X(xm), y2: n1(Yg(h.temp)), stroke: c, 'stroke-width': 2, 'stroke-dasharray': '5 5', opacity: cur ? .5 : .8 }, gr);
    txt(gr, X(xm) - 4, n1(Yg(h.temp) - 8), `${o} Ω`, { 'font-size': 12, fill: c, 'text-anchor': 'end' });
    if (cur) { el('line', { x1: X(0), y1: Yg(25), x2: n1(X(s.time)), y2: n1(Yg(r.temp)), stroke: c, 'stroke-width': 4, 'stroke-linecap': 'round' }, gr); el('circle', { cx: n1(X(s.time)), cy: n1(Yg(r.temp)), r: 6, fill: c, stroke: '#fff', 'stroke-width': 2 }, gr); } }
  hint(narrow ? 330 : 470, 560, step === 'ohm' || step === 'current' ? '轉碼錶通電；把架上的電熱線拖進燒杯' : '轉右上的碼錶指針，讓電流通久一點');
}

function meterScene({ rig, el, txt, s, r, set, drag, hint, kind }) {
  const can = kind === 'observe';
  // 電表（度數表）
  el('rect', { x: 400, y: 120, width: 200, height: 260, rx: 18, fill: 'url(#ep-box)', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: 422, y: 150, width: 156, height: 46, rx: 6, fill: '#1E2B22' }, rig);
  txt(rig, 500, 182, `${r.kwh.toFixed(1)} kWh`, { 'font-size': 22, fill: '#7CF29A', 'font-family': 'monospace' });
  txt(rig, 500, 224, '電度表（1 度 ＝ 1 kWh）', { 'font-size': 13, fill: '#5A6478' });
  el('circle', { cx: 500, cy: 292, r: 46, fill: '#FFFDF6', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: 456, y: 286, width: 88, height: 12, rx: 6, fill: '#C9CED6' }, rig); el('rect', { x: 466, y: 286, width: 14, height: 12, fill: '#C8372D' }, rig);
  txt(rig, 500, 358, '轉盤：用電越多轉越多圈', { 'font-size': 11, fill: '#5A6478' });
  wire(el, rig, 'M500 380V430H320V470', '#3A3F48'); wire(el, rig, 'M500 430H680V470', '#3A3F48');
  // 兩組電器：點選
  METERS.forEach(([w, h], i) => { const x = i ? 680 : 320, on = s.meter === i, g = el('g', { 'data-drag': can ? `meter-${i}` : null }, rig);
    el('rect', { x: x - 110, y: 470, width: 220, height: 104, rx: 16, fill: on ? '#FFF3D6' : 'rgba(255,255,255,.92)', stroke: on ? '#C8372D' : '#23304A', 'stroke-width': on ? 3.5 : 2 }, g);
    el('rect', { x: x - 92, y: 490, width: 60, height: 40, rx: 8, fill: '#E9EDF2', stroke: '#23304A', 'stroke-width': 2 }, g);
    for (let k = 0; k < 4; k++) el('line', { x1: x - 84, y1: 498 + k * 8, x2: x - 40, y2: 498 + k * 8, stroke: on ? '#F08A3D' : '#B98A5E', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    txt(g, x + 34, 508, `${w.toLocaleString('zh-TW')} W`, { 'font-size': 18, 'font-weight': 900 });
    txt(g, x + 34, 534, `用 ${h} 小時`, { 'font-size': 15 });
    txt(g, x, 562, `${w / 1000} kW × ${h} h ＝ ${kWh(w, h)} 度`, { 'font-size': 12, fill: '#5A6478' });
    if (can) drag(g, () => ({ move() {}, end() {}, cancel() {} }), { label: `接上 ${w} W 用 ${h} 小時的電器`, tap: () => { if (!on) set({ meter: i }); } }); });
  hint(500, 610, '點一組電器接上電表');
}

function scene(api) { defs(api.el, api.rig); return api.step === 'meter' ? meterScene(api) : heatScene(api); }

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set, title: s => `${MODE[s.mode]}・${s.ohm} Ω・${s.time} 秒`,
  body: (s, r) => `${f2(r.P)} W、電能 ${f2(r.E)} J，水溫升高 ${t1(r.dT)}°C` });
const timeCtl = opts => ({ key: 'time', label: '通電時間', type: 'seg', options: opts.map(t => [t, `${t} 秒`]) });
const ohmCtl = { key: 'ohm', label: '電熱線', type: 'seg', options: [[6, '6 Ω'], [12, '12 Ω']] };

runDesk({
  key: 'bhcs.lab.electric-power.v2', title: '電流熱效應實驗桌', background: 'bg-electric-bench',
  sceneLabel: '電流熱效應實驗桌：電源供應器接到泡在 100 g 水裡的電熱線，旁邊有安培計、伏特計、溫度計和碼錶，右邊是水溫對時間的圖；最後一步改看電度表',
  chip: { main: '1 卡 ≈ 4.2 J', sub: '100 g 水升高 1°C 要 420 J' },
  initial: { mode: 'V', ohm: 6, time: 0, meter: 0 },
  model, scene, viewBox: (id) => id === 'meter' ? { desk: '120 90 760 560', phone: '190 90 620 560' } : { desk: '50 80 930 510', phone: '50 80 680 990' }, phoneText: 1.4,
  readouts: (s, r, st) => st === 'meter' ? [['電功率', METERS[s.meter][0], 'W', `用 ${METERS[s.meter][1]} 小時`], ['用電量', f2(r.kwh), '度', 'kW × 小時']] :
    [['電流', f2(r.I), 'A', `${f2(r.V)} V ÷ ${s.ohm} Ω`], ['電功率', f2(r.P), 'W', 'P ＝ V × I'], ['水溫', t1(r.temp), '°C', `電能 ${f2(r.E)} J`]],
  why: { title: '電能和電熱怎麼算', button: '電熱怎麼算', html: `
    <p class="fn-tip"><b>電功率 P ＝ V × I</b>（瓦特 W）：每秒用掉多少電能。<b>電能 E ＝ P × t</b>（焦耳 J）。</p>
    <p class="fn-tip"><b>固定電壓 6 V：</b>電阻變大，電流變小（I ＝ V ÷ R），功率變小。<b>固定電流 1 A：</b>電阻變大，要更大的電壓（V ＝ I × R），功率變大。</p>
    <p class="fn-tip"><b>水吸收的熱 ＝ 電能。</b>100 g 的水升高 1°C 要 100 × 4.2 ＝ 420 J（也就是 100 卡）。</p>
    <p class="fn-tip"><b>1 度電 ＝ 1 kWh：</b>1 kW 的電器用 1 小時。</p>
    <p class="fn-tip">模型說明：電能全部變成水吸收的熱，不計散熱；這是線上模擬，不要用家用插座做實驗。</p>` },
  steps: [
    { id: 'base', label: '跑基準', title: '先跑一組加熱基準', goal: '固定 6 V、6 Ω。通電 35 秒和 70 秒各收一張，看水溫和電能怎麼增加。',
      intro: '開關還沒接通，電流是 0。轉碼錶讓它通電！', enter: { mode: 'V', ohm: 6, time: 0 }, controls: [timeCtl([0, 35, 70])],
      react: (s, r) => s.time ? `通電 ${s.time} 秒：${f2(r.E)} J，水溫 ${t1(r.temp)}°C。` : '還沒通電，水溫 25°C。',
      targets: [tgt('t35', '通電 35 秒', { mode: 'V', ohm: 6, time: 35 }, '轉到 35 秒。'), tgt('t70', '通電 70 秒', { mode: 'V', ohm: 6, time: 70 }, '轉到 70 秒。')],
      found: ['功率 6 W 不變，通電時間加倍，電能和升溫也加倍。', '6 W × 70 s ＝ 420 J，水溫升高 1.0°C'] },
    { id: 'ohm', label: '固定電壓', title: '固定 6 V，只換電阻', goal: '同樣 6 V、通電 70 秒。比較 6 Ω 和 12 Ω 的電熱線，各收一張。',
      intro: '電阻變大，會比較熱嗎？把架上的 12 Ω 電熱線拖進燒杯試試。', enter: { mode: 'V', ohm: 12, time: 70 }, controls: [ohmCtl, timeCtl([0, 35, 70])],
      react: (s, r) => `${s.ohm} Ω：電流 ${f2(r.I)} A、${f2(r.P)} W。`,
      targets: [tgt('v6', '6 V・6 Ω・70 秒', { mode: 'V', ohm: 6, time: 70 }, '換回 6 Ω，通電 70 秒。'), tgt('v12', '6 V・12 Ω・70 秒', { mode: 'V', ohm: 12, time: 70 }, '換成 12 Ω，通電 70 秒。')],
      found: ['固定電壓時，電阻加倍，電流減半，功率和升溫也減半。', '6 Ω：6 W、+1.0°C；12 Ω：3 W、+0.5°C'] },
    { id: 'time', label: '只改時間', title: '同功率，多通電一倍時間', goal: '6 V、6 Ω。比較通電 70 秒和 140 秒，各收一張。',
      intro: '功率不變，只讓它通電久一點。', enter: { mode: 'V', ohm: 6, time: 140 }, controls: [timeCtl([0, 70, 140])],
      react: (s, r) => `${s.time} 秒：功率 ${f2(r.P)} W，電能 ${f2(r.E)} J。`,
      targets: [tgt('l70', '通電 70 秒', { mode: 'V', ohm: 6, time: 70 }, '轉到 70 秒。'), tgt('l140', '通電 140 秒', { mode: 'V', ohm: 6, time: 140 }, '轉到 140 秒。')],
      found: ['功率一樣是 6 W；時間加倍，電能和升溫都加倍。', '420 J → 840 J，+1.0°C → +2.0°C'] },
    { id: 'current', label: '固定電流', title: '這次固定電流 1 A', goal: '電源改成固定 1 A，通電 70 秒。比較 6 Ω 和 12 Ω，各收一張。',
      intro: '這次鎖住的是電流。換成 12 Ω 時，電壓會怎樣？', enter: { mode: 'I', ohm: 6, time: 70 }, controls: [ohmCtl, timeCtl([0, 35, 70])],
      react: (s, r) => `${s.ohm} Ω：電壓 ${f2(r.V)} V、${f2(r.P)} W。`,
      targets: [tgt('i6', '1 A・6 Ω・70 秒', { mode: 'I', ohm: 6, time: 70 }, '用 6 Ω，通電 70 秒。'), tgt('i12', '1 A・12 Ω・70 秒', { mode: 'I', ohm: 12, time: 70 }, '換成 12 Ω，通電 70 秒。')],
      found: ['固定電流時，電阻加倍，電壓加倍，功率和升溫也加倍。和固定電壓時正好相反。', '6 Ω：6 V、6 W；12 Ω：12 V、12 W'] },
    { id: 'meter', label: '讀電表', title: '用電度表量用電量', goal: '兩組電器功率和使用時間都不同。各接上電表一次，比較用了幾度電。',
      intro: '電度表記的是累積的電能，不是瞬間的功率。', enter: { meter: 0 },
      controls: [{ key: 'meter', label: '電器', type: 'seg', options: METERS.map(([w, h], i) => [i, `${w} W × ${h} 小時`]) }],
      react: (s, r) => `${METERS[s.meter][0]} W 用 ${METERS[s.meter][1]} 小時：${f2(r.kwh)} 度。`,
      targets: METERS.map(([w, h], i) => ({ sig: 'm' + i, label: `${w} W × ${h} 小時`, aim: `點 ${w} W 那組。`, set: { meter: i }, title: () => `${w} W × ${h} 小時`, body: (s, r) => `用電 ${f2(r.kwh)} 度（kWh）` })),
      found: ['功率和時間都不同，但功率 × 時間一樣，所以用電量一樣。', '1 kW × 1 h ＝ 0.5 kW × 2 h ＝ 1 度'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：電功率與電能', goal: '用 I ＝ V ÷ R、P ＝ V × I、E ＝ P × t 算算看。', intro: '一步一步來：先算電流，再算功率。', head: 'P ＝ V × I，E ＝ P × t',
      rows: [
        { id: 'i', name: '固定 6 V、3 Ω 的電熱線：電流', eq: '6 ÷ 3', answer: 2, unit: 'A' },
        { id: 'p', name: '這時的電功率', eq: '6 × 2', answer: 12, unit: 'W', hint: v => v === 18 ? '功率是 V × I，不是 V × R。' : '' },
        { id: 'e', name: '12 W 通電 70 秒的電能', eq: '12 × 70', answer: 840, unit: 'J' },
        { id: 'k', name: '800 W 的吹風機用 30 分鐘，用了幾度電', eq: '0.8 kW × 0.5 h', answer: 0.4, unit: '度', hint: v => v === 400 || v === 24000 ? '先把 W 換成 kW、分鐘換成小時。' : '' }],
      found: ['算對了！', 'I ＝ V ÷ R，P ＝ V × I，E ＝ P × t'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！回想剛才的證據。',
      found: ['你用數據解釋了電流熱效應！', '功率越大、通電越久，產生的熱越多'] }
  ],
  quiz: [
    { q: '把 6 Ω 換成 12 Ω，為什麼固定電壓和固定電流的結果相反？', options: [
      { text: '電阻變大，一定升溫更快。', why: '你的證據：固定 6 V 時，12 Ω 只有 3 W，升溫反而變少。' },
      { text: '固定電壓時電流變小；固定電流時，較大電阻需要較高電壓。', ok: true },
      { text: '因為第二次用了更多水。', why: '每一組都是 100 g、25°C 的水。' }] },
    { q: '6 W 通電 140 秒，和通電 70 秒比，有什麼變化？', options: [
      { text: '功率加倍，電能不變。', why: '功率是每秒用的電能，兩次都是 6 W。' },
      { text: '功率不變，電能和升溫都加倍。', ok: true },
      { text: '功率和電能都不變。', why: '你的證據：電能 420 J → 840 J。' }] },
    { q: '哪兩組電器用的電一樣多？', options: [
      { text: '1,000 W 用 1 小時，和 500 W 用 2 小時。', ok: true },
      { text: '1,000 W 用 1 小時，和 500 W 用 1 小時。', why: '500 W 用 1 小時只有 0.5 度。' },
      { text: '1,000 W 用 2 小時，和 500 W 用 2 小時。', why: '一個 2 度、一個 1 度。' }] }
  ],
  finish: { title: '你用數據解釋了電流熱效應！', rule: '電功率 P ＝ V × I，電能 E ＝ P × t。固定電壓時電阻越大功率越小，固定電流時電阻越大功率越大；功率越大、通電越久，水吸收的熱越多。', next: { label: '去比熱實驗桌', href: '../heat/' } }
});
