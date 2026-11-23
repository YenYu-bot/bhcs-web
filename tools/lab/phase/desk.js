// 熱與物態實驗桌：溫度與狀態來自 ./model.mjs（冰比熱 0.5、水比熱 1、熔化熱 80、汽化熱 540 卡／克）。
import { heat, RATE } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => heat(s);
const f = x => String(Math.round(x * 10) / 10), pct = x => Math.round(x * 100);
const STATE = r => ({ ice: '冰（固態）', melting: `冰水共存，已熔化 ${pct(r.frac)}%`, water: '水（液態）', boiling: `沸騰中，已汽化 ${pct(r.frac)}%`, steam: '全部變成水蒸氣' }[r.phase]);

const INK = '#23304A', TIMES = { melt: [0, 1, 3, 7, 9], boil: [9, 14, 19, 30], mass: [9] };
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('linearGradient', 'ph-glass', [[0, '#CFE3F2', .55], [.12, '#FFFFFF', .7], [.3, '#E8F3FB', .18], [.8, '#E8F3FB', .14], [.92, '#FFFFFF', .55], [1, '#B7D2E6', .6]]);
  g('linearGradient', 'ph-water', [[0, '#7FBCE3', .78], [.5, '#A9D6F2', .62], [1, '#6AAED9', .8]]);
  g('linearGradient', 'ph-ice', [[0, '#FFFFFF', .95], [.5, '#DDF0FB', .75], [1, '#B4D9F0', .85]], { x1: 0, y1: 0, x2: 1, y2: 1 });
  g('linearGradient', 'ph-body', [[0, '#FBF7EE'], [1, '#D8CFBD']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'ph-plate', [[0, '#55627E'], [1, '#1D2538']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('radialGradient', 'ph-hot', [[0, '#FF6A3D', .9], [.6, '#E8432A', .55], [1, '#E8432A', 0]]);
  g('radialGradient', 'ph-knob', [[0, '#F7FAFD'], [.6, '#AEB8C8'], [1, '#5F6A7E']], { cx: .35, cy: .3, r: .8 });
  g('linearGradient', 'ph-tube', [[0, '#DDEAF4'], [.35, '#FFFFFF'], [1, '#C9DCEA']]);
  const blur = el('filter', { id: 'ph-blur', x: '-40%', y: '-40%', width: '180%', height: '180%' }, d); el('feGaussianBlur', { stdDeviation: 3 }, blur);
}
// 燒杯（底部中心 cx, by）：玻璃、刻度、水、冰塊、氣泡、水蒸氣
function beaker(el, txt, g, cx, by, r, mass, heating) {
  const W = 180, H = 214, x0 = cx - W / 2, top = by - H, inner = by - 8;
  const vol = mass / 100, full = r.phase === 'boiling' ? 1 - r.frac * .6 : r.phase === 'steam' ? 0 : 1, liquid = r.phase === 'ice' ? 0 : r.phase === 'melting' ? r.frac : 1;
  const level = 64 * vol * liquid * full + (r.phase === 'melting' ? 6 : 0);
  if (level > 1) { const y = inner - level; el('path', { d: `M${x0 + 8} ${y}Q${cx} ${y + 6} ${x0 + W - 8} ${y}V${inner}Q${cx} ${inner + 4} ${x0 + 8} ${inner}Z`, fill: 'url(#ph-water)' }, g);
    el('path', { d: `M${x0 + 8} ${y}Q${cx} ${y + 6} ${x0 + W - 8} ${y}`, fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: .8 }, g); }
  // 冰塊：熔化時變小、浮在水面
  const n = 6 * vol, left = r.phase === 'ice' ? 1 : r.phase === 'melting' ? 1 - r.frac : 0;
  const shown = r.phase === 'melting' ? Math.ceil(n * left) : left > 0 ? n : 0, float = r.phase === 'melting' && level > 10;
  for (let i = 0; i < shown; i++) {
    const sz = (34 + rnd(i, 1) * 8) * (float ? .62 + .38 * left : 1), col = i % 3, row = Math.floor(i / 3);
    const x = x0 + 22 + col * 48 + (float && row % 2 ? 22 : 0) + rnd(i, 2) * 8, y = float ? inner - level - sz * .55 - (row % 2) * sz * .45 + (rnd(i, 7) - .5) * 4 : inner - 6 - row * 38 - sz;
    const q = el('g', { transform: `rotate(${(rnd(i, 3) - .5) * 24} ${x + sz / 2} ${y + sz / 2})` }, g);
    el('rect', { x, y, width: sz, height: sz, rx: sz * .2, fill: 'url(#ph-ice)', stroke: '#86B8D8', 'stroke-width': 1.6 }, q);
    el('path', { d: `M${x + sz * .2} ${y + sz * .25}l${sz * .25} -${sz * .06}`, stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round' }, q);
    el('path', { d: `M${x + sz * .7} ${y + sz * .6}l${sz * .1} ${sz * .15}`, stroke: '#A9CFE8', 'stroke-width': 1.4 }, q);
  }
  if (r.phase === 'boiling') for (let i = 0; i < 14; i++) { const x = x0 + 18 + rnd(i, 4) * (W - 36), y = inner - 6 - rnd(i, 5) * Math.max(8, level - 10); el('circle', { cx: x, cy: y, r: 2.5 + rnd(i, 6) * 5, fill: 'rgba(255,255,255,.5)', stroke: '#fff', 'stroke-width': 1.2 }, g); }
  if (r.phase === 'water' && heating && r.temp > 60) for (let i = 0; i < 5; i++) el('circle', { cx: x0 + 26 + rnd(i, 8) * (W - 52), cy: inner - 4, r: 2 + rnd(i, 9) * 2, fill: '#fff', opacity: .7 }, g);
  if (r.phase === 'boiling' || r.phase === 'steam') for (let i = 0; i < 4; i++) { const x = x0 + 34 + i * 38; el('path', { d: `M${x} ${top + 4}c-16 -18 14 -30 -2 -50c-12 -16 10 -26 0 -40`, fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: .75, filter: 'url(#ph-blur)' }, g); }
  // 玻璃與刻度
  el('path', { d: `M${x0 - 6} ${top}H${x0 + W + 4}l8 -8M${x0} ${top}V${by - 10}Q${x0} ${by} ${x0 + 10} ${by}H${x0 + W - 10}Q${x0 + W} ${by} ${x0 + W} ${by - 10}V${top}`, fill: 'url(#ph-glass)', stroke: '#6E97BB', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, g);
  for (let i = 1; i <= 4; i++) { const y = by - 10 - i * 40; el('path', { d: `M${x0 + 12} ${y}h${i % 2 ? 14 : 22}`, stroke: '#6E97BB', 'stroke-width': 1.8 }, g); if (i % 2 === 0) txt(g, x0 + 48, y + 5, `${i * 50}`, { 'font-size': 11, fill: '#6E97BB' }); }
  el('path', { d: `M${x0 + 8} ${top + 12}V${by - 18}`, stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: .7 }, g);
}
function thermometer(el, txt, g, x, top, bottom, temp) {
  const tY = T => bottom - 26 - (bottom - 26 - top - 14) * (T + 20) / 130;
  el('rect', { x: x - 9, y: top, width: 18, height: bottom - top - 14, rx: 9, fill: 'url(#ph-tube)', stroke: '#6E97BB', 'stroke-width': 2 }, g);
  for (const T of [-20, 0, 20, 40, 60, 80, 100]) { const y = tY(T); el('path', { d: `M${x + 9} ${y}h${T % 50 === 0 ? 10 : 6}`, stroke: INK, 'stroke-width': 1.4 }, g); if (T === 0 || T === 100) txt(g, x + 30, y + 4, `${T}`, { 'font-size': 11, fill: INK }); }
  el('rect', { x: x - 3.5, y: tY(temp), width: 7, height: bottom - 20 - tY(temp), fill: '#D9342B' }, g);
  el('circle', { cx: x, cy: bottom - 14, r: 13, fill: '#D9342B', stroke: '#6E97BB', 'stroke-width': 2 }, g);
  el('circle', { cx: x - 4, cy: bottom - 18, r: 3.5, fill: '#fff', opacity: .6 }, g);
}
function hotplate(el, txt, g, cx, y, heating) {
  el('ellipse', { cx, cy: y + 96, rx: 150, ry: 8, fill: '#000', opacity: .18 }, g);
  el('rect', { x: cx - 140, y: y + 14, width: 280, height: 80, rx: 14, fill: 'url(#ph-body)', stroke: INK, 'stroke-width': 2.5 }, g);
  el('rect', { x: cx - 122, y, width: 244, height: 18, rx: 6, fill: 'url(#ph-plate)', stroke: INK, 'stroke-width': 2 }, g);
  if (heating) el('ellipse', { cx, cy: y + 4, rx: 118, ry: 10, fill: 'url(#ph-hot)' }, g);
  el('circle', { cx: cx + 96, cy: y + 54, r: 6, fill: heating ? '#FF5A3C' : '#7A7F8C', stroke: INK, 'stroke-width': 1.5 }, g);
  txt(g, cx + 96, y + 80, heating ? '加熱中' : '未加熱', { 'font-size': 11, fill: heating ? '#C8372D' : '#5A6478' });
  el('circle', { cx: cx - 60, cy: y + 54, r: 22, fill: 'url(#ph-knob)', stroke: INK, 'stroke-width': 2 }, g);
  el('path', { d: `M${cx - 60} ${y + 54}l0 -16`, stroke: '#C8372D', 'stroke-width': 4, 'stroke-linecap': 'round', transform: `rotate(${heating ? 120 : 0} ${cx - 60} ${y + 54})` }, g);
}
// 碼錶：一圈 30 分鐘
function timer(el, txt, g, cx, cy, t) {
  el('rect', { x: cx - 8, y: cy - 70, width: 16, height: 14, rx: 3, fill: 'url(#ph-plate)', stroke: INK, 'stroke-width': 1.5 }, g);
  el('circle', { cx: cx + 2, cy: cy + 4, r: 56, fill: '#000', opacity: .16 }, g);
  el('circle', { cx, cy, r: 56, fill: 'url(#ph-plate)', stroke: INK, 'stroke-width': 2 }, g);
  el('circle', { cx, cy, r: 47, fill: '#FBFAF4' }, g);
  for (let m = 0; m < 30; m++) { const a = m / 30 * 2 * Math.PI, r0 = m % 5 ? 41 : 36; el('path', { d: `M${cx + r0 * Math.sin(a)} ${cy - r0 * Math.cos(a)}L${cx + 45 * Math.sin(a)} ${cy - 45 * Math.cos(a)}`, stroke: INK, 'stroke-width': m % 5 ? 1 : 2 }, g); }
  for (const m of [0, 10, 20]) { const a = m / 30 * 2 * Math.PI; txt(g, cx + 27 * Math.sin(a), cy - 27 * Math.cos(a) + 4, String(m), { 'font-size': 11, fill: '#5A6478' }); }
  const hand = el('g', { transform: `rotate(${t / 30 * 360} ${cx} ${cy})` }, g);
  el('path', { d: `M${cx} ${cy + 10}V${cy - 42}`, stroke: '#C8372D', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, hand);
  el('circle', { cx, cy: cy - 42, r: 6, fill: '#C8372D' }, hand);
  el('circle', { cx, cy, r: 5, fill: INK }, g);
  return hand;
}

function scene({ rig, el, txt, s, r, step, set, drag, hint }) {
  defs(el, rig);
  const times = TIMES[step] || [], can = times.length > 1, heating = s.time > 0;
  hotplate(el, txt, rig, 250, 480, heating);
  beaker(el, txt, rig, 250, 480, r, s.mass, heating);
  thermometer(el, txt, rig, 312, 170, 470, r.temp);
  el('rect', { x: 372, y: 150, width: 116, height: 44, rx: 10, fill: INK }, rig); txt(rig, 430, 179, `${f(r.temp)}°C`, { 'font-size': 20, fill: '#fff' });
  txt(rig, 250, 604, STATE(r), { 'font-size': 16 });
  const TX = 440, TY = 312, near = t => times.reduce((m, v) => Math.abs(v - t) < Math.abs(m - t) ? v : m, times[0]);
  if (step !== 'mass') {
    // 碼錶（轉指針設定加熱時間）
    const tg = el('g', { 'data-drag': can ? 'timer' : null }, rig), hand = timer(el, txt, tg, TX, TY, s.time);
    txt(rig, TX, TY + 78, `加熱 ${s.time} 分`, { 'font-size': 14 });
    if (can) drag(tg, () => { let t = s.time; return { move(p) { let a = Math.atan2(p.x - TX, TY - p.y) * 180 / Math.PI; if (a < 0) a += 360; t = a / 360 * 30; hand.setAttribute('transform', `rotate(${a} ${TX} ${TY})`); },
      end() { const v = near(t); if (v !== s.time) set({ time: v }); else hand.setAttribute('transform', `rotate(${s.time / 30 * 360} ${TX} ${TY})`); }, cancel() { hand.setAttribute('transform', `rotate(${s.time / 30 * 360} ${TX} ${TY})`); } }; },
      { label: '加熱到下一個時間', tap: () => set({ time: times[(times.indexOf(s.time) + 1) % times.length] }) });
  } else {
    // 質量：點選 100 g／200 g 的冰
    txt(rig, TX, 236, '同樣加熱 9 分鐘', { 'font-size': 14, fill: '#5A6478' });
    for (const [i, m] of [[0, 100], [1, 200]]) { const y = 270 + i * 110, on = s.mass === m, g = el('g', { 'data-drag': on ? null : 'mass' }, rig);
      el('rect', { x: TX - 50, y, width: 100, height: 86, rx: 12, fill: on ? '#E9F6F0' : '#FFFDF2', stroke: on ? '#2E8B66' : '#8A93A6', 'stroke-width': on ? 3 : 2, 'stroke-dasharray': on ? '' : '6 4' }, g);
      for (let k = 0; k < m / 50; k++) el('rect', { x: TX - 34 + (k % 2) * 34, y: y + 10 + Math.floor(k / 2) * 14, width: 30, height: 12, rx: 3, fill: 'url(#ph-ice)', stroke: '#86B8D8', 'stroke-width': 1.2 }, g);
      txt(g, TX, y + 78, `${m} g 冰`, { 'font-size': 14, fill: on ? '#1F6E50' : INK });
      if (!on) drag(g, null, { label: `換成 ${m} g 的冰`, tap: () => set({ mass: m }) }); }
  }
  // 右：加熱曲線（黃點也可以拖）
  const X0 = 590, X1 = 930, Y0 = 500, Y1 = 150, tx = t => X0 + (X1 - X0) * t / 30, ty = T => Y0 - (Y0 - Y1) * (T + 20) / 130;
  el('rect', { x: X0 - 62, y: Y1 - 50, width: X1 - X0 + 90, height: Y0 - Y1 + 110, rx: 16, fill: 'rgba(255,255,255,.94)', stroke: INK, 'stroke-width': 3 }, rig);
  txt(rig, (X0 + X1) / 2, Y1 - 22, `溫度－時間圖（${s.mass} g）`, { 'font-size': 16 });
  for (const T of [0, 100]) { el('path', { d: `M${X0} ${ty(T)} H${X1}`, stroke: '#C9BFAE', 'stroke-width': 1.5, 'stroke-dasharray': '6 6' }, rig); txt(rig, X0 - 10, ty(T) + 5, `${T}°C`, { 'font-size': 13, 'text-anchor': 'end', fill: '#5A6478' }); }
  el('path', { d: `M${X0} ${Y1} V${Y0} H${X1}`, fill: 'none', stroke: INK, 'stroke-width': 3 }, rig);
  for (const t of [0, 10, 20, 30]) txt(rig, tx(t), Y0 + 22, `${t}`, { 'font-size': 13, fill: '#5A6478' });
  txt(rig, (X0 + X1) / 2, Y0 + 46, '加熱時間（分）', { 'font-size': 13, fill: '#5A6478' });
  let d = ''; for (let t = 0; t <= 30; t += 0.25) d += `${t ? 'L' : 'M'}${tx(t).toFixed(1)} ${ty(heat({ mass: s.mass, time: t }).temp).toFixed(1)}`;
  el('path', { d: `${d}`, fill: 'none', stroke: '#E8B4AE', 'stroke-width': 4, 'stroke-linejoin': 'round' }, rig);
  let done = ''; for (let t = 0; t <= s.time; t += 0.25) done += `${t ? 'L' : 'M'}${tx(t).toFixed(1)} ${ty(heat({ mass: s.mass, time: t }).temp).toFixed(1)}`;
  if (done) el('path', { d: done, fill: 'none', stroke: '#C8372D', 'stroke-width': 4.5, 'stroke-linejoin': 'round' }, rig);
  for (const t of can ? times : []) if (t !== s.time) el('circle', { cx: tx(t), cy: ty(heat({ mass: s.mass, time: t }).temp), r: 4.5, fill: '#fff', stroke: '#C8372D', 'stroke-width': 2 }, rig);
  const dot = el('g', { 'data-drag': can ? 'dot' : null }, rig);
  el('circle', { cx: tx(s.time), cy: ty(r.temp), r: 22, fill: 'transparent' }, dot);
  const pin = el('circle', { cx: tx(s.time), cy: ty(r.temp), r: 10, fill: '#F4C04E', stroke: INK, 'stroke-width': 3 }, dot);
  if (can) drag(dot, () => { let t = s.time; return { move(p) { t = Math.max(0, Math.min(30, (p.x - X0) / (X1 - X0) * 30)); pin.setAttribute('cx', tx(t)); pin.setAttribute('cy', ty(heat({ mass: s.mass, time: t }).temp)); },
    end() { const v = near(t); if (v !== s.time) set({ time: v }); else { pin.setAttribute('cx', tx(s.time)); pin.setAttribute('cy', ty(r.temp)); } }, cancel() { pin.setAttribute('cx', tx(s.time)); pin.setAttribute('cy', ty(r.temp)); } }; },
    { label: '曲線上的時間點' });
  hint(430, 112, step === 'mass' ? '點冰盒換質量' : '轉碼錶指針，或拖曲線上的黃點');
}

const tgt = (sig, mass, time, aim) => ({ sig, label: `${mass} g、第 ${time} 分`, aim, set: { mass, time }, title: s => `${s.mass} g，加熱 ${s.time} 分（${s.time * RATE} 卡）`, body: (s, r) => `${f(r.temp)}°C，${STATE(r)}` });
const timeCtl = list => ({ key: 'time', label: '加熱時間', type: 'seg', cols: Math.min(list.length, 5), options: list.map(t => [t, `${t} 分`]) });

runDesk({
  key: 'bhcs.lab.phase.v1', title: '熱與物態實驗桌', background: 'bg-chem-bench',
  sceneLabel: '熱與物態實驗桌：左邊是電熱板上的燒杯、溫度計和碼錶，可以轉碼錶指針設定加熱時間；右邊是溫度－時間圖，黃點也可以拖。',
  initial: { mass: 100, time: 0 },
  model, scene, viewBox: { desk: '90 80 880 530', phone: '90 80 880 530' }, phoneText: 1.4,
  chip: { main: '加熱器每分鐘 1000 卡' },
  readouts: (s, r) => [['溫度', f(r.temp), '°C', r.phase === 'melting' ? '熔點' : r.phase === 'boiling' ? '沸點' : ''], ['已吸收熱量', String(r.Q), '卡', `${s.time} 分 × 1000`], ['狀態', { ice: '固態', melting: '固＋液', water: '液態', boiling: '液＋氣', steam: '氣態' }[r.phase], '', r.frac && r.frac < 1 ? `${pct(r.frac)}%` : '']],
  why: { title: '加熱曲線', button: '熱跑去哪裡', html: `
    <p class="fn-tip"><b>升溫：</b>吸收的熱讓粒子動得更快，溫度上升。熱量 ＝ 質量 × 比熱 × 溫度變化。</p>
    <p class="fn-tip"><b>熔化與沸騰：</b>吸收的熱用來改變狀態（拉開粒子），溫度不變，所以曲線是水平的。</p>
    <p class="fn-tip"><b>熔化熱 80 卡／克、汽化熱 540 卡／克；</b>冰的比熱約 0.5、水是 1 卡／克·°C。</p>
    <p class="fn-tip">這是簡化模型：熱量全部被吸收，氣壓是 1 大氣壓。</p>` },
  steps: [
    { id: 'melt', label: '熔化', title: '冰在熔化時，溫度會上升嗎？', goal: '100 g 的冰從 −20°C 開始加熱。收下第 3 分和第 7 分的結果。',
      intro: '按加熱時間，看溫度計和曲線上的黃點。', enter: { mass: 100, time: 0 }, controls: [timeCtl([0, 1, 3, 7, 9])],
      react: (s, r) => `${f(r.temp)}°C，${STATE(r)}。`,
      targets: [tgt('m3', 100, 3, '看第 3 分。'), tgt('m7', 100, 7, '看第 7 分。')],
      found: ['熔化時一直加熱，溫度卻停在 0°C；熱用來把冰變成水。', '第 1 到 9 分：8000 卡 ＝ 100 g × 80 卡／克'] },
    { id: 'boil', label: '沸騰', title: '水燒開以後，繼續加熱呢？', goal: '比較第 14、19、30 分。收下第 19 分和第 30 分的結果。',
      intro: '冰全部變成水了。繼續加熱，溫度會一直升嗎？', enter: { mass: 100, time: 9 }, controls: [timeCtl([9, 14, 19, 30])],
      react: (s, r) => `${f(r.temp)}°C，${STATE(r)}。`,
      targets: [tgt('b19', 100, 19, '看第 19 分。'), tgt('b30', 100, 30, '看第 30 分。')],
      found: ['水到 100°C 開始沸騰，之後溫度不再上升；熱用來把水變成水蒸氣。', '0 → 100°C：100 g × 1 × 100 ＝ 10000 卡（10 分鐘）'] },
    { id: 'mass', label: '質量加倍', title: '冰多一倍，同樣加熱 9 分鐘', goal: '加熱時間固定 9 分。比較 100 g 和 200 g，各收一張。',
      intro: '同樣的熱量，給兩倍的冰，結果一樣嗎？', enter: { mass: 100, time: 9 },
      controls: [{ key: 'mass', label: '冰的質量', type: 'seg', options: [[100, '100 g'], [200, '200 g']] }],
      react: (s, r) => `${s.mass} g：${STATE(r)}。`,
      targets: [tgt('g100', 100, 9, '看 100 g。'), tgt('g200', 200, 9, '換成 200 g。')],
      found: ['質量加倍，升溫和熔化需要的熱量都加倍，所以同樣時間還沒熔完。', '200 g：升溫 2000 卡 ＋ 熔化 16000 卡 ＝ 18000 卡'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：需要多少熱量', goal: '熔化熱 80 卡／克，水的比熱 1 卡／克·°C。', intro: '用熔化熱和比熱來算。', head: '熱量 ＝ 質量 × 熔化熱　或　質量 × 比熱 × 溫差',
      rows: [
        { id: 'm', name: '100 g、0°C 的冰全部熔化', eq: '100 × 80', answer: 8000, unit: '卡' },
        { id: 'w', name: '100 g 的水從 0°C 升到 100°C', eq: '100 × 1 × 100', answer: 10000, unit: '卡' },
        { id: 'd', name: '200 g、0°C 的冰全部熔化', eq: '200 × 80', answer: 16000, unit: '卡', hint: v => v === 8000 ? '質量是 200 g，要加倍。' : '' }],
      found: ['算對了！', '狀態變化：質量 × 熔化熱；升溫：質量 × 比熱 × 溫差'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想曲線上水平的那兩段。',
      found: ['你把加熱曲線弄懂了！', '狀態變化時吸熱但溫度不變'] }
  ],
  quiz: [
    { q: '冰熔化的過程中一直加熱，溫度卻停在 0°C，這些熱去哪裡了？', options: [
      { text: '散到空氣中浪費掉了。', why: '這個模型裡熱量全部被吸收。熱是用來把冰變成水。' },
      { text: '用來把固態變成液態，所以溫度不變。', ok: true },
      { text: '溫度計壞了。', why: '溫度計沒壞。你的證據：第 3 分和第 7 分都是 0°C，冰越來越少。' }] },
    { q: '水沸騰後把火開更大，水溫會？', options: [
      { text: '超過 100°C 繼續上升。', why: '在 1 大氣壓下，水沸騰時維持 100°C。你的證據：第 19 分和第 30 分都是 100°C。' },
      { text: '維持 100°C，只是汽化得更快。', ok: true },
      { text: '下降，因為水變少了。', why: '只要還在沸騰，溫度就維持在沸點。' }] },
    { q: '同樣加熱 9 分鐘，100 g 的冰全熔了，200 g 的冰卻還沒，原因是？', options: [
      { text: '200 g 的冰熔點比較高。', why: '熔點和質量無關，都是 0°C。' },
      { text: '質量越大，需要的熱量越多。', ok: true },
      { text: '加熱器對大塊的冰沒效。', why: '加熱器給的熱量一樣（9000 卡），是 200 g 需要 18000 卡才夠。' }] }
  ],
  finish: { title: '你把熱與物態弄懂了！', rule: '升溫時吸熱、溫度上升；熔化和沸騰時吸熱、溫度不變。需要的熱量和質量成正比。', next: { label: '去比熱實驗桌', href: '../heat/' } }
});
