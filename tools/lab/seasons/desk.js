// 四季實驗桌：太陽直射緯度、正午太陽高度與白晝長度全部來自 scripts/science/models.mjs 的 calculate('seasons')。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';
import { skyDefs, sun, earth } from '../shared/sky.mjs';

const model = s => calculate('seasons', { latitude: s.latitude, season: s.season, tilt: s.tilt });
const SEASON = { 0: '春分', 90: '夏至', 180: '秋分', 270: '冬至' };
const LAT = { 0: '赤道', 24: '臺中（北緯 24°）', 70: '北緯 70°（北極圈內）' };
const f1 = x => String(Math.round(x * 10) / 10);
const hrs = r => r.boundary ? '—' : f1(r.hours);

const INK = '#23304A', LATS = [0, 24, 70], n1 = v => v.toFixed(1), D = Math.PI / 180;
function orbitView(el, txt, rig, s, can, set, drag) {
  const cx = 260, cy = 330, R = 170, k = .5, POS = a => [cx - R * Math.cos(a * D + 0), cy + R * k * Math.sin(a * D)];
  // 位置：夏至在左（北半球朝向太陽）、冬至在右、春分在前（下）、秋分在後（上）
  const at = a => ({ 90: [cx - R, cy], 270: [cx + R, cy], 0: [cx, cy + R * k], 180: [cx, cy - R * k] })[a];
  el('ellipse', { cx, cy, rx: R, ry: R * k, fill: 'none', stroke: '#8FA3C4', 'stroke-width': 2, 'stroke-dasharray': '6 7' }, rig);
  sun(el, rig, cx, cy, 36);
  for (const [a, t] of [[0, '春分'], [90, '夏至'], [180, '秋分'], [270, '冬至']]) { const [x, y] = at(a), on = a === s.season;
    if (!on) { const g = el('g', { opacity: .55 }, rig); earth(el, g, x, y, 15, { sunAng: Math.atan2(y - cy, cx - x) / D, tilt: s.tilt, axis: true, seed: 3 }); }
    txt(rig, x + (a === 90 ? -4 : a === 270 ? 4 : 0), y + (a === 180 ? -42 : 50), t, { 'font-size': on ? 17 : 14, fill: on ? INK : '#5A6478' }); }
  const [ex, ey] = at(s.season), eg = el('g', { 'data-drag': can ? 'earth' : null }, rig), inner = el('g', {}, eg);
  earth(el, inner, ex, ey, 28, { sunAng: Math.atan2(ey - cy, cx - ex) / D, tilt: s.tilt, axis: true, seed: 3 }); el('circle', { cx: ex, cy: ey, r: 44, fill: 'transparent' }, eg);
  txt(rig, cx, 136, `地軸傾斜 ${s.tilt}°（紅線），方向固定不變`, { 'font-size': 14, fill: '#5A6478' });
  if (can) drag(eg, () => { let ang = (450 - s.season) % 360; return { move(p) { ang = (Math.atan2((p.y - cy) / k, cx - p.x) / D + 360) % 360; const x = cx - R * Math.cos(ang * D), y = cy + R * k * Math.sin(ang * D); inner.setAttribute('transform', `translate(${n1(x - ex)} ${n1(y - ey)})`); },
    end() { const sea = (450 - ang) % 360, v = [0, 90, 180, 270].reduce((m, x) => { const d = a => Math.min(Math.abs(a - sea), 360 - Math.abs(a - sea)); return d(x) < d(m) ? x : m; }); if (v !== s.season) set({ season: v }); else inner.removeAttribute('transform'); }, cancel() { inner.removeAttribute('transform'); } }; },
    { label: '讓地球繞太陽走到下一個節氣', tap: () => set({ season: (s.season + 90) % 360 }) });
  void POS;
}
// 側視的大地球：陽光從左邊來，北極往太陽傾 δ（太陽直射緯度）
function globeView(el, txt, rig, s, r, step, can, set, drag) {
  const cx = 300, cy = 340, R = 112, dec = r.declination;
  for (let i = 0; i < 5; i++) { const y = cy - 120 + i * 60; el('path', { d: `M70 ${y}H${cx - R - 14}`, stroke: '#F2B53A', 'stroke-width': 2.5, opacity: .8 }, rig); el('path', { d: `M${cx - R - 14} ${y}l-10 -5v10z`, fill: '#F2B53A', opacity: .8 }, rig); }
  sun(el, rig, 66, 172, 24, { rays: false }); txt(rig, 96, 498, '陽光', { 'font-size': 13, fill: '#C88A1E' });
  const tilt = -dec, ax = [-Math.sin(dec * D), -Math.cos(dec * D)], eq = [-Math.cos(dec * D), Math.sin(dec * D)];
  const ag = el('g', {}, rig); earth(el, ag, cx, cy, R, { sunAng: 180, tilt, axis: false, seed: 4 });
  const axis = el('g', { 'data-drag': can && step === 'tilt' ? 'axis' : null }, rig), drawAxis = d => { axis.replaceChildren(); const a = [-Math.sin(d * D), -Math.cos(d * D)];
    el('path', { d: `M${n1(cx - a[0] * R * 1.35)} ${n1(cy - a[1] * R * 1.35)}L${n1(cx + a[0] * R * 1.35)} ${n1(cy + a[1] * R * 1.35)}`, stroke: '#C8372D', 'stroke-width': 4, 'stroke-linecap': 'round' }, axis);
    el('circle', { cx: n1(cx + a[0] * R * 1.35), cy: n1(cy + a[1] * R * 1.35), r: 8, fill: '#C8372D', stroke: '#fff', 'stroke-width': 2 }, axis);
    el('circle', { cx: n1(cx + a[0] * R * 1.35), cy: n1(cy + a[1] * R * 1.35), r: 26, fill: 'transparent' }, axis); };
  drawAxis(dec); txt(rig, n1(cx + ax[0] * R * 1.35 + 46), n1(cy + ax[1] * R * 1.35 + 4), `地軸 ${s.tilt}°`, { 'font-size': 13, fill: '#C8372D' });
  // 緯線
  const P = phi => [cx + R * (Math.cos(phi * D) * eq[0] + Math.sin(phi * D) * ax[0]), cy + R * (Math.cos(phi * D) * eq[1] + Math.sin(phi * D) * ax[1])];
  for (const phi of [0, 23.5, -23.5, 66.5, 24, 70]) { const c = [cx + R * Math.sin(phi * D) * ax[0], cy + R * Math.sin(phi * D) * ax[1]], h = R * Math.cos(phi * D), major = phi === 0;
    if (phi === 24 || phi === 70) continue;
    el('path', { d: `M${n1(c[0] - eq[0] * h)} ${n1(c[1] - eq[1] * h)}L${n1(c[0] + eq[0] * h)} ${n1(c[1] + eq[1] * h)}`, stroke: major ? '#FFFFFF' : '#FFE08A', 'stroke-width': major ? 2 : 1.4, 'stroke-dasharray': major ? null : '5 5', opacity: .85 }, rig); }
  txt(rig, n1(P(0)[0] + 10), n1(P(0)[1] + 18), '赤道', { 'font-size': 11, fill: '#fff' });
  // 觀察者位置：在朝太陽那一側的地表，可以沿著地表拖
  const pin = el('g', { 'data-drag': can && step === 'latitude' ? 'pin' : null }, rig), drawPin = phi => { pin.replaceChildren(); const [x, y] = P(phi), n = [(x - cx) / R, (y - cy) / R], t = [-n[1], n[0]];
    el('path', { d: `M${n1(x - t[0] * 46)} ${n1(y - t[1] * 46)}L${n1(x + t[0] * 46)} ${n1(y + t[1] * 46)}`, stroke: '#2E8B3A', 'stroke-width': 3 }, pin);
    el('path', { d: `M${n1(x)} ${n1(y)}l${n1(n[0] * 26)} ${n1(n[1] * 26)}`, stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round' }, pin);
    el('circle', { cx: n1(x + n[0] * 30), cy: n1(y + n[1] * 30), r: 7, fill: '#F4C04E', stroke: INK, 'stroke-width': 2 }, pin);
    el('circle', { cx: n1(x), cy: n1(y), r: 30, fill: 'transparent' }, pin); };
  drawPin(s.latitude); const [px, py] = P(s.latitude);
  txt(rig, n1(px - 64), n1(py - 14), s.latitude ? `北緯 ${s.latitude}°` : '赤道', { 'font-size': 14, fill: INK });
  if (can && step === 'latitude') drag(pin, () => { let phi = s.latitude; return { move(p) { const v = [(p.x - cx), (p.y - cy)]; phi = Math.atan2(v[0] * ax[0] + v[1] * ax[1], v[0] * eq[0] + v[1] * eq[1]) / D; phi = Math.max(-10, Math.min(85, phi)); drawPin(phi); },
    end() { const v = LATS.reduce((m, x) => Math.abs(x - phi) < Math.abs(m - phi) ? x : m); if (v !== s.latitude) set({ latitude: v }); else drawPin(s.latitude); }, cancel() { drawPin(s.latitude); } }; },
    { label: '換到下一個地點', tap: () => set({ latitude: LATS[(LATS.indexOf(s.latitude) + 1) % 3] }) });
  if (can && step === 'tilt') drag(axis, () => { let d = dec; return { move(p) { d = Math.max(-5, Math.min(35, -Math.atan2(p.x - cx, cy - p.y) / D)); drawAxis(d); },
    end() { const v = d > 11.75 ? 23.5 : 0; if (v !== s.tilt) set({ tilt: v }); else drawAxis(dec); }, cancel() { drawAxis(dec); } }; },
    { label: s.tilt ? '把地軸扶正' : '把地軸傾斜 23.5°', tap: () => set({ tilt: s.tilt ? 0 : 23.5 }) });
  txt(rig, cx, 136, `${SEASON[s.season]}・側面看地球（陽光從左邊來）`, { 'font-size': 14, fill: '#5A6478' });
}

function scene({ rig, el, txt, P, s, r, step, set, drag, hint, kind }) {
  skyDefs(el, rig);
  const can = kind === 'observe';
  if (step === 'taiwan' || step === 'calc' || step === 'quiz') orbitView(el, txt, rig, s, can && step === 'taiwan', set, drag); else globeView(el, txt, rig, s, r, step, can, set, drag);
  // 右：正午太陽高度
  const X0 = 500, gy = 456, alt = Math.max(-10, r.altitude), a = alt * D;
  el('rect', { x: X0 - 20, y: 150, width: 480, height: 400, rx: 18, fill: 'rgba(255,255,255,.95)', stroke: INK, 'stroke-width': 3 }, rig);
  const cp = el('clipPath', { id: 'se-sky' }, el('defs', {}, rig)); el('rect', { x: X0 - 8, y: 196, width: 456, height: gy - 196 + 46, rx: 10 }, cp);
  const sk = el('g', { 'clip-path': 'url(#se-sky)' }, rig), lg = el('linearGradient', { id: 'se-g', x1: 0, y1: 0, x2: 0, y2: 1 }, el('defs', {}, rig));
  el('stop', { offset: 0, 'stop-color': alt > 0 ? '#8FC6EE' : '#2B3A62' }, lg); el('stop', { offset: 1, 'stop-color': alt > 0 ? '#E3F2FB' : '#5B6C93' }, lg);
  el('rect', { x: X0 - 8, y: 196, width: 456, height: gy - 196, fill: 'url(#se-g)' }, sk);
  el('path', { d: `M${X0 - 8} ${gy}H${X0 + 448}V${gy + 46}H${X0 - 8}Z`, fill: '#86B86A' }, sk);
  el('path', { d: `M${X0 - 8} ${gy}H${X0 + 448}`, stroke: '#4F8A3E', 'stroke-width': 3 }, sk);
  txt(rig, X0 + 220, 182, `${LAT[s.latitude] || s.latitude + '°'}・${SEASON[s.season]}正午`, { 'font-size': 17 });
  const ox = X0 + 300, kidH = 92, sx = ox - 230 * Math.cos(a), sy = gy - kidH * .55 - 230 * Math.sin(a);
  if (alt > 0) { const shadow = Math.min(260, kidH / Math.tan(a));
    el('path', { d: `M${ox} ${gy}h${n1(shadow)}l-6 6h${n1(-shadow)}z`, fill: 'rgba(35,48,74,.38)' }, sk);
    el('path', { d: `M${n1(sx)} ${n1(sy)}L${ox} ${gy - kidH * .55}`, stroke: '#E0A21B', 'stroke-width': 3, 'stroke-dasharray': '8 6' }, sk);
    sun(el, sk, sx, sy, 22);
    el('path', { d: `M${ox - 64} ${gy}A64 64 0 0 1 ${n1(ox - 64 * Math.cos(a))} ${n1(gy - 64 * Math.sin(a))}`, fill: 'none', stroke: '#C8372D', 'stroke-width': 3 }, sk);
    txt(rig, ox - 96, gy - 16, `${f1(r.altitude)}°`, { 'font-size': 19, fill: '#C8372D' });
    txt(rig, ox + Math.min(260, kidH / Math.tan(a)) / 2, gy + 30, '影子', { 'font-size': 12, fill: '#2F4A2A' });
  } else txt(rig, X0 + 180, gy - 120, '正午太陽在地平線下（極夜）', { 'font-size': 16, fill: '#fff' });
  el('image', { href: P + 'prop-kid-observer.webp', x: ox - 18, y: gy - kidH, width: 37, height: kidH }, rig);
  // 晝夜長度
  const day = r.boundary ? 12 : r.hours;
  txt(rig, X0, 526, `白天 ${hrs(r)} 小時・晚上 ${r.boundary ? '—' : f1(24 - r.hours)} 小時`, { 'font-size': 14, 'text-anchor': 'start' });
  el('rect', { x: X0 + 230, y: 512, width: 210, height: 20, rx: 10, fill: '#3B4256' }, rig);
  if (day) el('rect', { x: X0 + 230, y: 512, width: 210 * day / 24, height: 20, rx: 10, fill: '#F4C04E' }, rig);
  hint(290, 584, step === 'taiwan' ? '拖著地球繞太陽走' : step === 'latitude' ? '沿著地表拖觀察者' : step === 'tilt' ? '拖地軸的紅點，把地軸扶正或斜回去' : '');
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: s => `${LAT[s.latitude] || s.latitude + '°'}・${SEASON[s.season]}${s.tilt !== 23.5 ? `・地軸 ${s.tilt}°` : ''}`,
  body: (s, r) => `正午太陽高度 ${f1(r.altitude)}°，白天 ${hrs(r)} 小時` });
const BASE = { latitude: 24, season: 90, tilt: 23.5 };

runDesk({
  key: 'bhcs.lab.seasons.v1', title: '四季實驗桌', background: 'bg-physics-bench',
  sceneLabel: '四季實驗桌：左邊在臺灣四季那一步是地球繞太陽的公轉軌道，可以拖著地球走；其他步驟是側面看的大地球，可以沿地表拖觀察者、拖地軸；右邊是正午太陽高度、影子和白天長度',
  initial: { ...BASE },
  model, scene, viewBox: { desk: '20 110 950 500', phone: '20 110 950 500' }, phoneText: 1.4,
  readouts: (s, r) => [['正午太陽高度', f1(r.altitude), '°', LAT[s.latitude] || `${s.latitude}°`], ['白天長度', hrs(r), '小時', SEASON[s.season]], ['太陽直射', f1(Math.abs(r.declination)), '°', r.declination > 0 ? '北緯' : r.declination < 0 ? '南緯' : '赤道']],
  why: { title: '四季是怎麼來的', button: '四季從哪來', html: `
    <p class="fn-tip"><b>四季不是因為地球離太陽遠近，</b>而是地軸傾斜約 23.5°，而且方向固定不變。地球繞太陽公轉時，太陽直射的緯度在南、北回歸線之間來回移動。</p>
    <p class="fn-tip"><b>夏至：</b>太陽直射北回歸線（北緯 23.5°），北半球正午太陽高、白天長，比較熱。<b>冬至：</b>太陽直射南回歸線，北半球正午太陽低、白天短，比較冷。<b>春分、秋分：</b>直射赤道，晝夜等長。</p>
    <p class="fn-tip"><b>正午太陽高度 ＝ 90° − |當地緯度 − 太陽直射緯度|。</b>太陽越高，陽光越集中、影子越短。</p>
    <p class="fn-tip">模型說明：用理想的天球模型，不計大氣折射與日出日落的太陽半徑。</p>` },
  steps: [
    { id: 'taiwan', label: '臺灣的四季', title: '臺中的夏至和冬至差在哪？', goal: '地點臺中（北緯 24°）。比較夏至、冬至、春分的正午太陽高度和白天長度，各收一張。',
      intro: '看右邊：夏至中午太陽有多高？影子多長？', enter: { ...BASE },
      controls: [{ key: 'season', label: '節氣', type: 'seg', cols: 4, options: [[0, '春分'], [90, '夏至'], [180, '秋分'], [270, '冬至']] }],
      react: (s, r) => `${SEASON[s.season]}：正午太陽 ${f1(r.altitude)}°，白天 ${hrs(r)} 小時。`,
      targets: [tgt('su', '夏至', { ...BASE }, '選夏至。'), tgt('wi', '冬至', { ...BASE, season: 270 }, '選冬至。'), tgt('sp', '春分', { ...BASE, season: 0 }, '選春分。')],
      found: ['夏至正午太陽高（89.5°）、白天長；冬至太陽低（42.5°）、白天短；春分晝夜等長。', '太陽越高、白天越長，越熱'] },
    { id: 'latitude', label: '不同緯度', title: '同一天，不同地方一樣嗎？', goal: '都在夏至。比較赤道、臺中和北緯 70° 的正午太陽高度與白天長度，各收一張。',
      intro: '夏至這天，到北極圈裡會看到什麼？', enter: { ...BASE, latitude: 0 },
      controls: [{ key: 'latitude', label: '地點', type: 'seg', options: [[0, '赤道'], [24, '臺中'], [70, '北緯 70°']] }],
      react: (s, r) => r.hours === 24 ? '北緯 70° 夏至：太陽整天不下山（永晝）！' : `${LAT[s.latitude]}：正午 ${f1(r.altitude)}°，白天 ${hrs(r)} 小時。`,
      targets: [tgt('l0', '赤道', { ...BASE, latitude: 0 }, '選赤道。'), tgt('l24', '臺中', { ...BASE }, '選臺中。'), tgt('l70', '北緯 70°', { ...BASE, latitude: 70 }, '選北緯 70°。')],
      found: ['夏至時越往北白天越長，北極圈內整天都是白天（永晝）。', '緯度不同，太陽高度和晝長就不同'] },
    { id: 'tilt', label: '地軸不斜', title: '如果地軸沒有傾斜呢？', goal: '臺中、夏至。比較地軸傾斜 23.5° 和 0° 的正午太陽高度與白天長度，各收一張。',
      intro: '把地軸扶正（0°），臺中還會有夏天嗎？', enter: { ...BASE, tilt: 0 },
      controls: [{ key: 'tilt', label: '地軸傾斜', type: 'seg', options: [[23.5, '23.5°'], [0, '0°（不傾斜）']], cols: 2 }],
      react: (s, r) => s.tilt === 0 ? '地軸不斜：每天都是白天 12 小時，正午太陽 66°，沒有四季變化。' : `地軸 23.5°：夏至正午 ${f1(r.altitude)}°。`,
      targets: [tgt('t23', '地軸 23.5°', { ...BASE }, '選 23.5°。'), tgt('t0', '地軸 0°', { ...BASE, tilt: 0 }, '選 0°。')],
      found: ['地軸不傾斜時，太陽一直直射赤道，就沒有四季了。', '四季的原因：地軸傾斜 23.5°'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：正午太陽高度', goal: '正午太陽高度 ＝ 90° − |緯度 − 太陽直射緯度|。夏至直射北緯 23.5°、冬至直射南緯 23.5°（記成 −23.5°）。', intro: '先找出太陽直射哪裡。', head: '90° − |緯度 − 直射緯度|',
      rows: [
        { id: 'a', name: '夏至，北緯 23.5°', eq: '90 − |23.5 − 23.5|', answer: 90, unit: '°' },
        { id: 'b', name: '冬至，北緯 23.5°', eq: '90 − |23.5 − (−23.5)|', answer: 43, unit: '°', hint: v => v === 90 ? '冬至太陽直射南緯 23.5°，要寫成 −23.5。' : '' },
        { id: 'c', name: '春分，赤道', eq: '90 − |0 − 0|', answer: 90, unit: '°' }],
      found: ['算對了！', '太陽直射的地方，正午太陽高度是 90°'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想太陽的高度。',
      found: ['你把四季的成因弄懂了！', '地軸傾斜 → 太陽直射緯度移動 → 四季'] }
  ],
  quiz: [
    { q: '臺灣夏天比冬天熱，主要原因是？', options: [
      { text: '夏天地球離太陽比較近。', why: '四季和距離無關。你的證據：地軸不傾斜時就沒有四季，原因是地軸傾斜。' },
      { text: '夏天正午太陽比較高、白天比較長。', ok: true },
      { text: '夏天太陽比較大。', why: '太陽沒有變。是太陽高度和白天長短改變了。' }] },
    { q: '夏至時，北緯 70° 會出現什麼現象？', options: [
      { text: '整天都是晚上。', why: '那是冬至。你的證據：夏至時北緯 70° 白天 24 小時。' },
      { text: '整天都是白天（永晝）。', ok: true },
      { text: '晝夜一樣長。', why: '晝夜等長是春分、秋分。' }] },
    { q: '冬至中午，臺中的影子比夏至？', options: [
      { text: '短。', why: '冬至太陽比較低，影子比較長。' },
      { text: '長。', ok: true },
      { text: '一樣。', why: '太陽高度不同，影子長短也不同。' }] }
  ],
  finish: { title: '你把四季的成因弄懂了！', rule: '地軸傾斜約 23.5° 而且方向不變，地球公轉時太陽直射的緯度改變，正午太陽高度和白天長短跟著變，形成四季。', next: { label: '去潮汐實驗桌', href: '../tides/' } }
});
