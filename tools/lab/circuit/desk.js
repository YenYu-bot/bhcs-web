// 電路實驗桌：電流、電壓與亮度全部來自 ./model.mjs（燈泡 5 Ω、電池 1.5 V）。
import { circuit, R } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const f = x => String(Math.round(x * 100) / 100);
const NAME = { single: '一顆燈泡', series: '兩顆串聯', parallel: '兩顆並聯' };

// ---------- 畫法 ----------
const INK = '#23304A';
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('radialGradient', 'ci-glass', [[0, '#FFFFFF', .95], [.55, '#E8F2FA', .55], [1, '#B9D3E8', .7]], { cx: .38, cy: .32, r: .75 });
  g('radialGradient', 'ci-lit', [[0, '#FFFDF0'], [.5, '#FFF0B0'], [1, '#F7C948']], { cx: .45, cy: .4, r: .7 });
  g('radialGradient', 'ci-glow', [[0, '#FFE680', .95], [.45, '#FFD24A', .45], [1, '#FFD24A', 0]]);
  g('linearGradient', 'ci-metal', [[0, '#6C778A'], [.35, '#F2F5F9'], [.6, '#A9B3C2'], [1, '#596377']]);
  g('linearGradient', 'ci-cell', [[0, '#1B2C4E'], [.3, '#4F6FA8'], [.5, '#7E9BD0'], [1, '#14223D']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'ci-band', [[0, '#9A6F12'], [.35, '#F6D776'], [.6, '#D9A933'], [1, '#7C560A']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'ci-wood', [[0, '#E6C48C'], [1, '#B98A52']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'ci-tray', [[0, '#3A4660'], [1, '#1C2438']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  const f = el('filter', { id: 'ci-soft', x: '-50%', y: '-50%', width: '200%', height: '200%' }, d); el('feGaussianBlur', { stdDeviation: 2.2 }, f);
}
// 燈泡：(x, y) 是燈座底部中心，power 是消耗功率（瓦），0 就是不亮
function bulb(el, g, x, y, power, ghost) {
  const q = el('g', ghost ? { opacity: .35 } : {}, g);
  if (power > 0) el('circle', { cx: x, cy: y - 64, r: 46 + power * 22, fill: 'url(#ci-glow)', opacity: Math.min(1, .45 + power * .3) }, q);
  el('rect', { x: x - 22, y: y - 10, width: 44, height: 18, rx: 4, fill: '#F4EFE4', stroke: INK, 'stroke-width': 2 }, q);
  el('rect', { x: x - 13, y: y - 34, width: 26, height: 26, rx: 3, fill: 'url(#ci-metal)', stroke: INK, 'stroke-width': 1.8 }, q);
  for (let i = 0; i < 4; i++) el('path', { d: `M${x - 13} ${y - 29 + i * 6}l26 -2`, stroke: '#5A6478', 'stroke-width': 1.2 }, q);
  const glass = `M${x - 11} ${y - 34}C${x - 11} ${y - 46} ${x - 28} ${y - 52} ${x - 28} ${y - 70}A28 28 0 1 1 ${x + 28} ${y - 70}C${x + 28} ${y - 52} ${x + 11} ${y - 46} ${x + 11} ${y - 34}Z`;
  el('path', { d: glass, fill: power > 0 ? 'url(#ci-lit)' : 'url(#ci-glass)', stroke: INK, 'stroke-width': 2.2, opacity: power > 0 ? Math.min(1, .55 + power * .3) : 1 }, q);
  el('path', { d: `M${x - 6} ${y - 36}V${y - 62}M${x + 6} ${y - 36}V${y - 62}`, stroke: '#6B7892', 'stroke-width': 1.6 }, q);
  const hot = power >= 1 ? '#FFFBE6' : power > 0 ? '#FFC23A' : '#7A7F8C';
  let coil = `M${x - 6} ${y - 62}`; for (let i = 0; i < 6; i++) coil += `q1 -5 2 0`;
  el('path', { d: coil, fill: 'none', stroke: hot, 'stroke-width': power > 0 ? 2.6 : 1.6 }, q);
  if (power > 0) el('path', { d: coil, fill: 'none', stroke: hot, 'stroke-width': 5, filter: 'url(#ci-soft)', opacity: .9 }, q);
  el('path', { d: `M${x - 17} ${y - 84}q-4 10 0 22`, fill: 'none', stroke: '#fff', 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: .75 }, q);
  return q;
}
// 一顆 1.5 V 乾電池（橫放，正極朝右）
function cell(el, g, x, y, w = 124) {
  const q = el('g', {}, g);
  el('rect', { x, y: y - 21, width: w, height: 42, rx: 7, fill: 'url(#ci-cell)', stroke: INK, 'stroke-width': 2 }, q);
  el('rect', { x: x + w * .58, y: y - 21, width: w * .3, height: 42, fill: 'url(#ci-band)' }, q);
  el('rect', { x: x + w, y: y - 8, width: 8, height: 16, rx: 2, fill: 'url(#ci-metal)', stroke: INK, 'stroke-width': 1.5 }, q);
  el('path', { d: `M${x + 6} ${y - 14}h${w * .5}`, stroke: '#fff', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: .45 }, q);
  const t = el('text', { x: x + w * .3, y: y + 6, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 800, fill: '#fff' }, q); t.textContent = '1.5V';
  const p = el('text', { x: x + w * .73, y: y + 7, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 900, fill: '#5A3E06' }, q); p.textContent = '＋';
  return q;
}
// 閘刀開關：(x, y) 是轉軸，ang 是刀片角度（0 ＝ 合上，負數 ＝ 往上打開）
function knife(el, g, x, y, ang) {
  el('rect', { x: x - 26, y: y + 6, width: 128, height: 22, rx: 5, fill: 'url(#ci-wood)', stroke: INK, 'stroke-width': 2 }, g);
  el('rect', { x: x - 8, y: y - 10, width: 16, height: 20, rx: 2, fill: 'url(#ci-band)', stroke: INK, 'stroke-width': 1.5 }, g);
  el('path', { d: `M${x + 76} ${y + 8}V${y - 12}M${x + 88} ${y + 8}V${y - 12}`, stroke: '#9A6F12', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
  const blade = el('g', { transform: `rotate(${ang} ${x} ${y})` }, g);
  el('rect', { x, y: y - 4, width: 94, height: 8, rx: 2, fill: 'url(#ci-band)', stroke: INK, 'stroke-width': 1.5 }, blade);
  el('rect', { x: x + 92, y: y - 9, width: 24, height: 18, rx: 8, fill: '#C8372D', stroke: INK, 'stroke-width': 2 }, blade);
  el('circle', { cx: x, cy: y, r: 6, fill: 'url(#ci-metal)', stroke: INK, 'stroke-width': 1.5 }, g);
  return blade;
}
// 安培計：指針 0–1.5 A
function ammeter(el, txt, g, x, y, amps) {
  el('circle', { cx: x + 2, cy: y + 4, r: 48, fill: '#000', opacity: .18 }, g);
  el('circle', { cx: x, cy: y, r: 48, fill: '#2B3550', stroke: INK, 'stroke-width': 2 }, g);
  el('circle', { cx: x, cy: y, r: 40, fill: '#FBFAF4', stroke: '#9AA3B2', 'stroke-width': 1.5 }, g);
  const ang = v => (-130 + 260 * v / 1.5) * Math.PI / 180;
  for (let i = 0; i <= 15; i++) { const a = ang(i / 10), r0 = i % 5 ? 32 : 28; el('path', { d: `M${x + r0 * Math.sin(a)} ${y - r0 * Math.cos(a)}L${x + 37 * Math.sin(a)} ${y - 37 * Math.cos(a)}`, stroke: INK, 'stroke-width': i % 5 ? 1 : 2 }, g); }
  for (const v of [0, .5, 1, 1.5]) { const a = ang(v); txt(g, x + 21 * Math.sin(a), y - 21 * Math.cos(a) + 4, String(v), { 'font-size': 9, 'font-weight': 700, fill: '#5A6478' }); }
  txt(g, x, y + 22, 'A', { 'font-size': 13, fill: '#C8372D' });
  const a = ang(Math.min(1.5, amps));
  el('path', { d: `M${x} ${y}L${x + 34 * Math.sin(a)} ${y - 34 * Math.cos(a)}`, stroke: '#C8372D', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, g);
  el('circle', { cx: x, cy: y, r: 4, fill: INK }, g);
}

const SPARE_BULB = [680, 440], SLOT = { series: [610, 250], parallel: [500, 130] }, SPARE_CELL = [668, 522];
function scene({ rig, el, txt, s, r, step, set, drag, hint, reduce }) {
  defs(el, rig);
  const L = 190, Rr = 810, T = 250, B = 470, layouts = step === 'parallel' ? ['series', 'parallel'] : step === 'series' ? ['series'] : [];
  const live = r.total > 0, hw = 130 * s.cells, hl = 500 - hw / 2, hr = 500 + hw / 2;
  const wire = (d, g = rig) => { el('path', { d, fill: 'none', stroke: INK, 'stroke-width': 8, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g); el('path', { d, fill: 'none', stroke: '#D8413A', 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g); };
  const flow = (d, amps) => { if (!live || reduce || !amps) return; const p = el('path', { d, fill: 'none', stroke: '#FFE45C', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': '1 23', 'pointer-events': 'none' }, rig);
    el('animate', { attributeName: 'stroke-dashoffset', from: 0, to: -24, dur: `${(0.36 / amps).toFixed(2)}s`, repeatCount: 'indefinite' }, p); };
  const tag = (x, y, str, w = 128) => { el('rect', { x: x - w / 2, y: y - 18, width: w, height: 26, rx: 8, fill: '#FFF8EC', stroke: INK, 'stroke-width': 1.8 }, rig); txt(rig, x, y + 1, str, { 'font-size': 14 }); };
  // 迴路
  wire(`M${hr} ${B}H${Rr}V${T}H${L}V${B}H${hl}`);
  if (s.layout === 'parallel') { wire(`M${L + 110} ${T}V${T - 120}H${Rr - 110}V${T}`); for (const x of [L + 110, Rr - 110]) el('circle', { cx: x, cy: T, r: 7, fill: INK }, rig); }
  if (s.layout === 'parallel') { flow(`M${hr} ${B}H${Rr}V${T}H${Rr - 110}`, r.total); flow(`M${L + 110} ${T}H${L}V${B}H${hl}`, r.total); flow(`M${Rr - 110} ${T}H${L + 110}`, r.each); flow(`M${Rr - 110} ${T}V${T - 120}H${L + 110}V${T}`, r.each); }
  else flow(`M${hr} ${B}H${Rr}V${T}H${L}V${B}H${hl}`, r.total);
  // 空的接點（拖燈泡時可以放的位置）
  const slots = {};
  for (const k of layouts) if (k !== s.layout) { const [x, y] = SLOT[k], q = el('g', { opacity: .9, 'pointer-events': 'none' }, rig); slots[k] = q;
    if (k === 'parallel') el('path', { d: `M${L + 110} ${T}V${T - 120}H${Rr - 110}V${T}`, fill: 'none', stroke: '#2E8B66', 'stroke-width': 3, 'stroke-dasharray': '8 6' }, q);
    el('rect', { x: x - 34, y: y - 104, width: 68, height: 116, rx: 12, fill: 'rgba(46,139,102,.06)', stroke: '#2E8B66', 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }, q);
    if (k === 'series') txt(q, x, y - 112, '串聯位置', { 'font-size': 13, fill: '#1F6E50' }); else txt(q, x + 82, y - 44, '並聯位置', { 'font-size': 13, fill: '#1F6E50' }); }
  // 燈泡
  const pos = s.layout === 'series' ? [[390, T], SLOT.series] : s.layout === 'parallel' ? [[500, T], SLOT.parallel] : [[500, T]];
  bulb(el, rig, ...pos[0], live ? r.pEach : 0);
  const tagAt = ([x, y], side) => side ? tag(x + side * 112, y - 64, `${f(r.each)} A　${f(r.vEach)} V`) : tag(x, y - 128, `${f(r.each)} A　${f(r.vEach)} V`);
  tagAt(pos[0], s.layout === 'parallel' ? 1 : s.layout === 'single' && layouts.includes('parallel') ? -1 : 0);
  if (layouts.length) {
    const home = pos[1] || SPARE_BULB, g = el('g', { 'data-drag': 'bulb' }, rig); bulb(el, g, ...home, pos[1] && live ? r.pEach : 0);
    el('rect', { x: home[0] - 40, y: home[1] - 110, width: 80, height: 124, fill: 'transparent' }, g);
    if (pos[1]) tagAt(pos[1], s.layout === 'parallel' ? 1 : 0); else txt(rig, SPARE_BULB[0], SPARE_BULB[1] - 116, '備用燈泡', { 'font-size': 13, fill: '#5A6478' });
    const pick = p => { let best = null, dist = 80; for (const k of layouts) { const d = Math.hypot(p[0] - SLOT[k][0], p[1] - SLOT[k][1] + 50); if (d < dist) { dist = d; best = k; } } return best; };
    drag(g, () => ({ move(p, p0) { const x = home[0] + p.x - p0.x, y = home[1] + p.y - p0.y; g.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`);
        const k = pick([x, y]); for (const n in slots) slots[n].setAttribute('opacity', n === k ? 1 : .55); },
      end(p, p0) { const k = pick([home[0] + p.x - p0.x, home[1] + p.y - p0.y]) || 'single'; if (k !== s.layout) set({ layout: k }); else g.removeAttribute('transform'); },
      cancel() { g.removeAttribute('transform'); } }),
      { label: pos[1] ? '把第二顆燈泡拿出電路' : '把燈泡接進電路', tap: () => set({ layout: pos[1] ? 'single' : layouts[0] }) });
  }
  // 電池座和電池
  el('rect', { x: hl - 10, y: B - 30, width: hw + 20, height: 60, rx: 10, fill: 'url(#ci-tray)', stroke: INK, 'stroke-width': 2 }, rig);
  for (const x of [hl - 4, hr + 4]) el('path', { d: `M${x} ${B - 14}l${x < 500 ? 6 : -6} 4l${x < 500 ? -6 : 6} 4l${x < 500 ? 6 : -6} 4l${x < 500 ? -6 : 6} 4l${x < 500 ? 6 : -6} 4`, fill: 'none', stroke: '#C6CEDA', 'stroke-width': 2 }, rig);
  cell(el, rig, hl + 3, B);
  const cellStep = step === 'single';
  if (s.cells === 2) { const g = el('g', { 'data-drag': cellStep ? 'cell' : null }, rig); cell(el, g, hl + 133, B);
    if (cellStep) drag(g, () => ({ move(p, p0) { g.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`); }, end(p, p0) { if (Math.hypot(p.x - p0.x, p.y - p0.y) > 40) set({ cells: 1 }); else g.removeAttribute('transform'); }, cancel() { g.removeAttribute('transform'); } }), { label: '拿掉一顆電池', tap: () => set({ cells: 1 }) }); }
  else if (cellStep) { const g = el('g', { 'data-drag': 'cell' }, rig); cell(el, g, SPARE_CELL[0], SPARE_CELL[1], 104);
    drag(g, () => ({ move(p, p0) { g.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`); }, end(p) { if (Math.abs(p.y - B) < 70 && p.x > 330 && p.x < 700) set({ cells: 2 }); else g.removeAttribute('transform'); }, cancel() { g.removeAttribute('transform'); } }), { label: '加一顆電池', tap: () => set({ cells: 2 }) }); }
  txt(rig, 500, B + 50, `電池 ${s.cells} 顆串聯：${f(r.V)} V`, { 'font-size': 15 });
  // 開關
  const hx = L + 40, ang = s.on ? 0 : -48; el('rect', { x: L - 6, y: B - 4, width: 30, height: 8, fill: '#FFF8EC', opacity: 0 }, rig);
  const sw = el('g', { 'data-drag': step === 'single' ? 'switch' : null }, rig), blade = knife(el, sw, hx, B, ang);
  el('rect', { x: hx - 30, y: B - 90, width: 150, height: 120, fill: 'transparent' }, sw);
  txt(rig, hx + 38, B + 50, s.on ? '開關合上（通路）' : '開關打開（斷路）', { 'font-size': 14, fill: s.on ? '#2E8B66' : '#C8372D' });
  if (step === 'single') drag(sw, () => { let a = ang; return { move(p) { a = Math.max(-60, Math.min(0, Math.atan2(p.y - B, p.x - hx) * 180 / Math.PI)); blade.setAttribute('transform', `rotate(${a} ${hx} ${B})`); }, end() { const on = a > -20; if (on !== s.on) set({ on }); else blade.setAttribute('transform', `rotate(${ang} ${hx} ${B})`); }, cancel() { blade.setAttribute('transform', `rotate(${ang} ${hx} ${B})`); } }; },
    { label: s.on ? '打開開關' : '合上開關', tap: () => set({ on: !s.on }) });
  // 安培計
  el('rect', { x: Rr - 10, y: 280, width: 20, height: 100, fill: '#FBF6EC', opacity: 0 }, rig);
  ammeter(el, txt, rig, Rr, 330, r.total); tag(Rr, 398, `總電流 ${f(r.total)} A`, 132);
  hint(500, 566, step === 'single' ? '點或拖開關、把電池拖進電池座' : step === 'series' ? '把右下角的燈泡拖進串聯位置' : '把燈泡拖到串聯或並聯位置');
}

const tgt = (sig, label, set, aim) => ({ sig, label, set, aim, title: s => `${NAME[s.layout]}、電池 ${s.cells} 顆${s.on ? '' : '、開關打開'}`,
  body: (s, r) => r.total ? `總電流 ${f(r.total)} A，每顆燈 ${f(r.each)} A、${f(r.vEach)} V` : '斷路，電流 0 A，燈不亮' });
const layoutCtl = opts => ({ key: 'layout', label: '燈泡接法', type: 'seg', options: opts.map(k => [k, NAME[k]]) });

runDesk({
  key: 'bhcs.lab.circuit.v1', title: '電路實驗桌', background: 'bg-electric-bench',
  sceneLabel: '電路實驗桌：電池、閘刀開關和燈泡接成迴路，可以直接拖動開關、電池和燈泡；右側安培計顯示總電流',
  initial: { layout: 'single', cells: 1, on: false },
  model: circuit, scene, viewBox: { desk: '110 20 840 560', phone: '110 20 840 560' }, phoneText: 1.4,
  readouts: (s, r) => [['總電流', f(r.total), 'A', `${f(r.V)} V ÷ ${f(r.Rt)} Ω`], ['每顆燈的電壓', f(r.vEach), 'V', r.n === 1 ? '只有一顆' : NAME[s.layout]], ['每顆燈的電流', f(r.each), 'A', r.pEach ? (r.pEach >= 1.5 ? '很亮' : r.pEach >= .4 ? '普通亮' : '暗') : '不亮']],
  why: { title: '電流、電壓與電阻', button: '歐姆定律', html: `
    <p class="fn-tip"><b>通路才有電流。</b>開關打開就是斷路，電流是 0，燈不亮。</p>
    <p class="fn-tip"><b>歐姆定律：電流 ＝ 電壓 ÷ 電阻。</b>這裡每顆燈泡 ${R} Ω、每顆電池 1.5 V。</p>
    <p class="fn-tip"><b>串聯：</b>電流只有一條路，每顆燈的電流一樣，電壓平分。</p>
    <p class="fn-tip"><b>並聯：</b>每顆燈各走一條路，電壓都等於電池電壓，總電流是各分支相加。</p>` },
  steps: [
    { id: 'single', label: '通路與電壓', title: '通路才會亮；電池加倍呢？', goal: '先收下「開關打開」的結果，再按下開關，比較 1 顆和 2 顆電池，各收一張。',
      intro: '開關還沒按下，燈會亮嗎？', enter: { layout: 'single', cells: 1, on: false },
      controls: [{ key: 'on', label: '開關', type: 'seg', options: [[false, '打開'], [true, '按下']] }, { key: 'cells', label: '電池', type: 'seg', options: [[1, '1 顆'], [2, '2 顆']] }],
      react: (s, r) => r.total ? `電流 ${f(r.total)} A。` : '斷路，沒有電流。',
      targets: [tgt('off', '開關打開', { layout: 'single', on: false, cells: 1 }, '先收下開關打開的結果。'), tgt('c1', '1 顆電池', { layout: 'single', on: true, cells: 1 }, '按下開關，用 1 顆電池。'), tgt('c2', '2 顆電池', { layout: 'single', on: true, cells: 2 }, '換成 2 顆電池。')],
      found: ['通路才有電流；電壓加倍，電流也加倍，燈更亮。', '1.5 V ÷ 5 Ω ＝ 0.3 A；3 V ÷ 5 Ω ＝ 0.6 A'] },
    { id: 'series', label: '串聯', title: '兩顆燈串聯，會怎麼樣？', goal: '電池固定 2 顆。比較「一顆燈泡」和「兩顆串聯」，各收一張。',
      intro: '多串一顆燈，電流會變大還是變小？', enter: { layout: 'single', cells: 2, on: true },
      controls: [layoutCtl(['single', 'series'])],
      react: (s, r) => `每顆燈 ${f(r.each)} A、${f(r.vEach)} V。`,
      targets: [tgt('one', '一顆燈泡', { layout: 'single', cells: 2, on: true }, '先看一顆燈泡。'), tgt('ser', '兩顆串聯', { layout: 'series', cells: 2, on: true }, '換成兩顆串聯。')],
      found: ['串聯時總電阻變大，電流變小；兩顆燈平分電壓，都比較暗。', '3 V ÷（5 ＋ 5）Ω ＝ 0.3 A，每顆 1.5 V'] },
    { id: 'parallel', label: '並聯', title: '改成並聯，差在哪裡？', goal: '電池固定 2 顆。比較「兩顆串聯」和「兩顆並聯」，各收一張。',
      intro: '並聯的燈各走各的路。看每顆燈的電壓和總電流。', enter: { layout: 'series', cells: 2, on: true },
      controls: [layoutCtl(['single', 'series', 'parallel'])],
      react: (s, r) => `每顆燈 ${f(r.vEach)} V，總電流 ${f(r.total)} A。`,
      targets: [tgt('ser', '兩顆串聯', { layout: 'series', cells: 2, on: true }, '先看兩顆串聯。'), tgt('par', '兩顆並聯', { layout: 'parallel', cells: 2, on: true }, '換成兩顆並聯。')],
      found: ['並聯時每顆燈的電壓都等於電池電壓，和單獨一顆一樣亮；總電流是兩條分支相加。', '每顆 3 V、0.6 A；總電流 0.6 ＋ 0.6 ＝ 1.2 A'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：歐姆定律', goal: '電流 ＝ 電壓 ÷ 電阻。', intro: '用你收到的讀值來算。', head: '電流 ＝ 電壓 ÷ 電阻',
      rows: [
        { id: 'r', name: '燈泡兩端 3 V、電流 0.6 A，電阻是多少', eq: '3 ÷ 0.6', answer: 5, unit: 'Ω' },
        { id: 's', name: '兩顆 5 Ω 燈泡串聯接 3 V，電流是多少', eq: '3 ÷（5 ＋ 5）', answer: 0.3, unit: 'A', hint: v => v === 0.6 ? '串聯的總電阻是 5 ＋ 5 ＝ 10 Ω。' : '' },
        { id: 'p', name: '並聯兩條分支各 0.6 A，總電流是多少', eq: '0.6 ＋ 0.6', answer: 1.2, unit: 'A' }],
      found: ['算對了！', '串聯電阻相加；並聯分支電流相加'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想你收到的電流和電壓。',
      found: ['你把串聯和並聯弄懂了！', '串聯分電壓；並聯分電流'] }
  ],
  quiz: [
    { q: '兩顆相同的燈泡串聯後，比單獨一顆時暗，原因是？', options: [
      { text: '電池的電被前面那顆燈用掉了。', why: '電流不會被「用掉」：你的證據顯示串聯的兩顆燈電流一樣，都是 0.3 A。' },
      { text: '總電阻變大，電流變小，每顆燈只分到一半電壓。', ok: true },
      { text: '串聯時電池電壓會變小。', why: '電池電壓還是 3 V，是兩顆燈各分到 1.5 V。' }] },
    { q: '家裡的電燈是並聯的，好處是？', options: [
      { text: '一盞燈壞了，其他燈還能亮，而且每盞燈的電壓都一樣。', ok: true },
      { text: '並聯比較省電，總電流比較小。', why: '並聯的總電流是各分支相加，反而比較大。你的證據：0.6 ＋ 0.6 ＝ 1.2 A。' },
      { text: '並聯時電流只走其中一盞燈。', why: '每條分支都有電流，各 0.6 A。' }] },
    { q: '同一顆燈泡，電池從 1 顆換成 2 顆，電流怎麼變？', options: [
      { text: '不變，因為燈泡一樣。', why: '燈泡的電阻一樣，但電壓加倍了。你的證據：0.3 A 變成 0.6 A。' },
      { text: '變成一半。', why: '電壓越大電流越大。' },
      { text: '變成 2 倍。', ok: true }] }
  ],
  finish: { title: '你把電路弄懂了！', rule: '通路才有電流；電流 ＝ 電壓 ÷ 電阻。串聯：電流相同、電壓平分。並聯：電壓相同、總電流是分支相加。', next: { label: '去電流熱效應實驗桌', href: '../electric-power/' } }
});
