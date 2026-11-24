// 植物氣體交換實驗桌：光合作用、呼吸作用、淨氧氣交換與蒸散全部來自 scripts/science/models.mjs 的 calculate('plant-exchange')（相對值）。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';
import { plantDefs, broadLeaf, stoma } from '../shared/plants.mjs';

const model = s => calculate('plant-exchange', { light: s.light, temperature: 25, humidity: s.humidity, stomata: s.stomata });
const f1 = x => String(Math.round(x * 10) / 10);
const NET = { release: '釋出氧氣', consume: '吸收氧氣', balanced: '收支平衡' };

const INK = '#23304A', SUNY = { 0: 330, 30: 240, 90: 140 }, HUM = { 20: -60, 90: 60 };
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('radialGradient', 'pe-sun', [[0, '#FFFBE0'], [.55, '#FFD84A'], [1, '#F2A81E']]);
  g('radialGradient', 'pe-halo', [[0, '#FFE680', .8], [1, '#FFE680', 0]]);
  g('linearGradient', 'pe-frame', [[0, '#F4EFE4'], [1, '#CFC6B4']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('radialGradient', 'pe-dial', [[0, '#FFFFFF'], [1, '#E9E4D8']]);
  for (const [k, c] of [['o', '#2F6FB0'], ['c', '#6B7385'], ['w', '#4FA3D1']]) { const m = el('marker', { id: 'pe-' + k, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 3.6, markerHeight: 3.6, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: c }, m); }
}
// 窗戶：天空亮度跟著光照；太陽在窗裡
function sky(el, txt, rig, light, sunY) {
  const t = light / 90, top = light ? `rgb(${Math.round(70 + 120 * t)},${Math.round(110 + 110 * t)},${Math.round(170 + 75 * t)})` : '#1D2740', bot = light ? `rgb(${Math.round(150 + 90 * t)},${Math.round(180 + 60 * t)},${Math.round(200 + 45 * t)})` : '#3A4566';
  const d = el('defs', {}, rig), lg = el('linearGradient', { id: 'pe-sky', x1: 0, y1: 0, x2: 0, y2: 1 }, d); el('stop', { offset: 0, 'stop-color': top }, lg); el('stop', { offset: 1, 'stop-color': bot }, lg);
  const cp = el('clipPath', { id: 'pe-win' }, d); el('rect', { x: 112, y: 92, width: 176, height: 206, rx: 6 }, cp);
  el('rect', { x: 100, y: 80, width: 200, height: 232, rx: 12, fill: 'url(#pe-frame)', stroke: INK, 'stroke-width': 2.5 }, rig);
  const w = el('g', { 'clip-path': 'url(#pe-win)' }, rig);
  el('rect', { x: 112, y: 92, width: 176, height: 206, fill: 'url(#pe-sky)' }, w);
  if (!light) for (let i = 0; i < 14; i++) el('circle', { cx: 120 + rnd(i, 1) * 160, cy: 100 + rnd(i, 2) * 120, r: .8 + rnd(i, 3) * 1.4, fill: '#fff', opacity: .7 }, w);
  el('path', { d: 'M112 270Q160 250 205 262T288 256V298H112Z', fill: light ? '#6FA35A' : '#2F4A38' }, w);
  const sun = el('g', {}, w);
  el('circle', { cx: 200, cy: sunY, r: 52, fill: 'url(#pe-halo)' }, sun); el('circle', { cx: 200, cy: sunY, r: 26, fill: 'url(#pe-sun)', stroke: '#E89A14', 'stroke-width': 1.5 }, sun);
  if (!light) { el('circle', { cx: 252, cy: 118, r: 13, fill: '#F4F1E2' }, w); el('circle', { cx: 258, cy: 113, r: 12, fill: '#1D2740' }, w); }
  el('path', { d: 'M200 92V298M112 195H288', stroke: '#CFC6B4', 'stroke-width': 5 }, rig);
  el('rect', { x: 92, y: 306, width: 216, height: 14, rx: 4, fill: 'url(#pe-frame)', stroke: INK, 'stroke-width': 2 }, rig);
  return sun;
}
function hygrometer(el, txt, g, x, y, hum) {
  el('circle', { cx: x + 2, cy: y + 4, r: 46, fill: '#000', opacity: .16 }, g);
  el('circle', { cx: x, cy: y, r: 46, fill: '#B98A52', stroke: INK, 'stroke-width': 2.5 }, g);
  el('circle', { cx: x, cy: y, r: 38, fill: 'url(#pe-dial)', stroke: '#8A6A3A', 'stroke-width': 1.5 }, g);
  for (let v = 0; v <= 100; v += 10) { const a = (-120 + 240 * v / 100) * Math.PI / 180, r0 = v % 50 ? 31 : 27; el('path', { d: `M${x + r0 * Math.sin(a)} ${y - r0 * Math.cos(a)}L${x + 35 * Math.sin(a)} ${y - 35 * Math.cos(a)}`, stroke: INK, 'stroke-width': v % 50 ? 1 : 2 }, g); }
  el('path', { d: `M${x - 30} ${y + 18}A35 35 0 0 1 ${x - 20} ${y - 28}`, fill: 'none', stroke: '#E8B04A', 'stroke-width': 4, opacity: .7 }, g);
  el('path', { d: `M${x + 20} ${y - 28}A35 35 0 0 1 ${x + 30} ${y + 18}`, fill: 'none', stroke: '#4FA3D1', 'stroke-width': 4, opacity: .7 }, g);
  txt(g, x, y + 24, '濕度 %', { 'font-size': 9, fill: '#5A6478' });
  const a = -120 + 240 * hum / 100, hand = el('g', { transform: `rotate(${a} ${x} ${y})` }, g);
  el('path', { d: `M${x} ${y + 6}V${y - 30}`, stroke: '#C8372D', 'stroke-width': 3, 'stroke-linecap': 'round' }, hand);
  el('circle', { cx: x, cy: y, r: 4.5, fill: INK }, g);
  return hand;
}
function gasArrow(el, txt, rig, pts, k, w, label, col) {
  if (w < .4) return; const d = `M${pts[0]} ${pts[1]}Q${pts[2]} ${pts[3]} ${pts[4]} ${pts[5]}`;
  el('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': Math.min(18, 4 + w) + 4, 'stroke-linecap': 'round', opacity: .8 }, rig);
  el('path', { d, fill: 'none', stroke: col, 'stroke-width': Math.min(18, 4 + w), 'stroke-linecap': 'round', 'marker-end': `url(#pe-${k})` }, rig);
  if (label) txt(rig, pts[4], pts[5] - 14, label, { 'font-size': 15, fill: col });
}

function scene({ rig, el, txt, s, r, step, set, drag, hint, kind }) {
  defs(el, rig); plantDefs(el, rig);
  const can = kind === 'observe';
  // 窗外的太陽：上下拖改光照
  const sun = sky(el, txt, rig, s.light, SUNY[s.light]); txt(rig, 200, 344, `光照 ${s.light}%`, { 'font-size': 15 });
  if (can && step === 'light') { const win = el('rect', { x: 112, y: 92, width: 176, height: 206, fill: 'transparent', 'data-drag': 'sun' }, rig); const near = y => +Object.entries(SUNY).reduce((m, e) => Math.abs(e[1] - y) < Math.abs(m[1] - y) ? e : m)[0];
    drag(win, () => { let y = SUNY[s.light]; return { move(p, p0) { y = Math.max(130, Math.min(340, SUNY[s.light] + p.y - p0.y)); sun.setAttribute('transform', `translate(0 ${y - SUNY[s.light]})`); },
      end() { const v = near(y); if (v !== s.light) set({ light: v }); else sun.removeAttribute('transform'); }, cancel() { sun.removeAttribute('transform'); } }; },
      { label: '移動太陽', tap: () => set({ light: { 0: 30, 30: 90, 90: 0 }[s.light] }) }); }
  // 光線照到葉子
  if (s.light) el('path', { d: 'M288 140L520 210L560 360L288 290Z', fill: '#FFF2A8', opacity: .1 + s.light / 600 }, rig);
  // 葉片
  const leaf = broadLeaf(el, rig, { x: 352, y: 412, ang: 24, L: 410, W: 118, petiole: 44, seed: 3, dim: s.light ? 0 : .6, id: 'pe-leaf' });
  el('path', { d: 'M300 470Q322 440 352 412', fill: 'none', stroke: '#3E7F36', 'stroke-width': 8, 'stroke-linecap': 'round' }, rig);
  // 氣孔放大圖（在葉背），拖保衛細胞或點一下改開度
  const [sx, sy] = leaf.at(.55, .45), IX = 700, IY = 478, IR = 74;
  el('circle', { cx: sx, cy: sy, r: 7, fill: 'none', stroke: INK, 'stroke-width': 2 }, rig);
  el('path', { d: `M${sx + 5} ${sy + 5}L${IX - IR * .6} ${IY - IR * .78}`, stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, rig);
  const sg = el('g', {}, rig); stoma(el, sg, { x: IX, y: IY, r: IR, open: s.stomata / 100, id: 'pe-stoma' });
  txt(rig, IX, IY + IR + 22, `葉背的氣孔：開度 ${s.stomata}%`, { 'font-size': 14, fill: '#2E6B3A' });
  if (can && step === 'stomata') { sg.setAttribute('data-drag', 'stoma');
    drag(sg, () => { let o = s.stomata; return { move(p, p0) { o = Math.max(20, Math.min(100, s.stomata + (Math.abs(p.x - IX) - Math.abs(p0.x - IX)) * 2)); sg.replaceChildren(); stoma(el, sg, { x: IX, y: IY, r: IR, open: o / 100, id: 'pe-stoma2' }); },
      end() { const v = o > 60 ? 100 : 20; if (v !== s.stomata) set({ stomata: v }); else { sg.replaceChildren(); stoma(el, sg, { x: IX, y: IY, r: IR, open: s.stomata / 100, id: 'pe-stoma3' }); } }, cancel() { sg.replaceChildren(); stoma(el, sg, { x: IX, y: IY, r: IR, open: s.stomata / 100, id: 'pe-stoma4' }); } }; },
      { label: s.stomata === 100 ? '把氣孔關小' : '把氣孔打開', tap: () => set({ stomata: s.stomata === 100 ? 20 : 100 }) }); }
  // 水蒸氣從氣孔散出
  const n = Math.round(r.transpiration * 6);
  for (let i = 0; i < n; i++) { const y0 = IY - 30 + i * 14, len = 60 + r.transpiration * 40; el('path', { d: `M${IX + 10} ${y0}c14 -8 22 8 36 0s22 8 36 0s22 8 ${len - 72} 0`, fill: 'none', stroke: '#4FA3D1', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .55 + rnd(i, 2) * .4 }, rig); }
  if (n) txt(rig, IX + 150, IY - 44, `水蒸氣 ${f1(r.transpiration * 10)}`, { 'font-size': 15, fill: '#2F86B8' });
  // 氧氣、二氧化碳
  const nn = Math.abs(r.net), O = [[812, 236, 850, 170, 920, 150], [918, 310, 870, 286, 818, 282]];
  const lab = (x, y, t, c) => txt(rig, x, y, t, { 'font-size': 15, fill: c });
  if (r.kind === 'release') { gasArrow(el, txt, rig, O[0], 'o', nn, '', '#2F6FB0'); gasArrow(el, txt, rig, O[1], 'c', nn, '', '#6B7385'); lab(906, 130, `O₂ 出 ${f1(nn)}`, '#2F6FB0'); lab(906, 336, 'CO₂ 進', '#6B7385'); }
  else if (r.kind === 'consume') { gasArrow(el, txt, rig, [O[0][4], O[0][5], O[0][2], O[0][3], O[0][0] + 4, O[0][1] - 4], 'o', nn * 2, '', '#2F6FB0'); gasArrow(el, txt, rig, [O[1][4], O[1][5], O[1][2], O[1][3], O[1][0], O[1][1]], 'c', nn * 2, '', '#6B7385'); lab(906, 130, `O₂ 進 ${f1(nn)}`, '#2F6FB0'); lab(906, 336, 'CO₂ 出', '#6B7385'); }
  else lab(880, 220, '氧氣進出平衡', '#2F6FB0');
  // 濕度計：轉指針改濕度
  const hx = 200, hy = 410, hg = el('g', {}, rig), hand = hygrometer(el, txt, hg, hx, hy, s.humidity); txt(rig, hx, hy + 64, `空氣濕度 ${s.humidity}%`, { 'font-size': 14 });
  if (can && step === 'humidity') { hg.setAttribute('data-drag', 'hygro');
    drag(hg, () => { let a = -120 + 240 * s.humidity / 100; return { move(p) { a = Math.max(-120, Math.min(120, Math.atan2(p.x - hx, hy - p.y) * 180 / Math.PI)); hand.setAttribute('transform', `rotate(${a} ${hx} ${hy})`); },
      end() { const v = a < 0 ? 20 : 90; if (v !== s.humidity) set({ humidity: v }); else hand.setAttribute('transform', `rotate(${-120 + 240 * s.humidity / 100} ${hx} ${hy})`); }, cancel() { hand.setAttribute('transform', `rotate(${-120 + 240 * s.humidity / 100} ${hx} ${hy})`); } }; },
      { label: '調空氣濕度', tap: () => set({ humidity: s.humidity === 20 ? 90 : 20 }) }); }
  // 帳本
  el('rect', { x: 300, y: 504, width: 290, height: 82, rx: 14, fill: 'rgba(255,255,255,.95)', stroke: INK, 'stroke-width': 2.5 }, rig);
  txt(rig, 445, 530, `光合作用 ${f1(r.photo)}　呼吸作用 ${f1(r.respiration)}`, { 'font-size': 14 });
  txt(rig, 445, 556, `淨氧氣交換 ＝ ${f1(r.photo)} − ${f1(r.respiration)} ＝ ${f1(r.net)}`, { 'font-size': 14, fill: '#2F6FB0' });
  txt(rig, 445, 576, `（${NET[r.kind]}）`, { 'font-size': 13, fill: '#5A6478' });
  hint(560, 618, step === 'light' ? '上下拖窗外的太陽' : step === 'stomata' ? '左右拖氣孔放大圖，把氣孔撐開或關小' : step === 'humidity' ? '轉濕度計的指針' : '');
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: s => `光照 ${s.light}%・氣孔 ${s.stomata}%・濕度 ${s.humidity}%`,
  body: (s, r) => sig.startsWith('h') || sig.startsWith('s') ? `光合 ${f1(r.photo)}、蒸散 ${f1(r.transpiration * 10)}` : `光合 ${f1(r.photo)} − 呼吸 ${f1(r.respiration)} ＝ ${f1(r.net)}（${NET[r.kind]}）` });
const BASE = { light: 90, stomata: 100, humidity: 50 };

runDesk({
  key: 'bhcs.lab.plant-exchange.v1', title: '植物氣體交換實驗桌', background: 'bg-physics-bench',
  sceneLabel: '植物氣體交換實驗桌：窗外的太陽照著一片葉子，右下是葉背氣孔的放大圖，左下是濕度計；可以上下拖太陽、左右拖氣孔、轉濕度計，箭頭表示氧氣、二氧化碳和水蒸氣進出的方向與多少',
  initial: { ...BASE },
  model, scene, viewBox: { desk: '80 60 880 580', phone: '80 60 880 580' }, phoneText: 1.4,
  readouts: (s, r) => [['光合作用', f1(r.photo), '', '相對值'], ['呼吸作用', f1(r.respiration), '', '一直在進行'], ['淨氧氣交換', f1(r.net), '', NET[r.kind]]],
  why: { title: '光合作用、呼吸作用與蒸散', button: '葉子在做什麼', html: `
    <p class="fn-tip"><b>光合作用：</b>有光時，葉綠體利用二氧化碳和水製造養分，釋出氧氣。</p>
    <p class="fn-tip"><b>呼吸作用：</b>植物不論白天晚上都在呼吸，消耗氧氣、放出二氧化碳。</p>
    <p class="fn-tip"><b>淨氧氣交換 ＝ 光合作用 − 呼吸作用。</b>光夠強時植物釋出氧氣；沒有光時只有呼吸，植物吸收氧氣。</p>
    <p class="fn-tip"><b>蒸散作用：</b>水分從氣孔以水蒸氣散失。氣孔開得越大、空氣越乾燥，蒸散越多。氣孔也是二氧化碳進入的通道，關小時光合作用也會變少。</p>
    <p class="fn-tip">模型說明：溫度固定 25 °C，數值是教學模型的相對值。</p>` },
  steps: [
    { id: 'light', label: '光照', title: '有光和沒光，葉子吐出還是吸入氧氣？', goal: '把光照調成 0%、30%、90%，看淨氧氣交換的方向，各收一張。',
      intro: '把燈關掉（光照 0%），葉子還會釋出氧氣嗎？', enter: { ...BASE, light: 0 },
      controls: [{ key: 'light', label: '光照', type: 'seg', options: [[0, '0%（黑暗）'], [30, '30%'], [90, '90%']] }],
      react: (s, r) => `光合 ${f1(r.photo)}、呼吸 ${f1(r.respiration)}：${NET[r.kind]}。`,
      targets: [tgt('l0', '光照 0%', { ...BASE, light: 0 }, '選 0%。'), tgt('l30', '光照 30%', { ...BASE, light: 30 }, '選 30%。'), tgt('l90', '光照 90%', { ...BASE }, '選 90%。')],
      found: ['黑暗時只有呼吸作用，葉子吸收氧氣；光夠強時光合作用大於呼吸，釋出氧氣。', '淨氧氣交換 ＝ 光合作用 − 呼吸作用'] },
    { id: 'stomata', label: '氣孔', title: '氣孔關小，會怎樣？', goal: '光照 90%。比較氣孔全開（100%）和關小（20%）的光合作用與蒸散，各收一張。',
      intro: '天氣很乾時，植物會把氣孔關小。光合作用會受影響嗎？', enter: { ...BASE, stomata: 20 },
      controls: [{ key: 'stomata', label: '氣孔開度', type: 'seg', options: [[100, '全開 100%'], [20, '關小 20%']], cols: 2 }],
      react: (s, r) => `光合 ${f1(r.photo)}、蒸散 ${f1(r.transpiration * 10)}。`,
      targets: [tgt('s100', '氣孔 100%', { ...BASE }, '選「全開」。'), tgt('s20', '氣孔 20%', { ...BASE, stomata: 20 }, '選「關小」。')],
      found: ['氣孔關小，蒸散減少、保住水分，但二氧化碳進不來，光合作用也變少。', '氣孔是水蒸氣出去、二氧化碳進來的通道'] },
    { id: 'humidity', label: '濕度', title: '空氣乾或濕，蒸散一樣嗎？', goal: '光照 90%、氣孔全開。比較濕度 20% 和 90% 的蒸散，各收一張。',
      intro: '把植物放到很乾和很潮濕的地方，看水蒸氣箭頭！', enter: { ...BASE, humidity: 20 },
      controls: [{ key: 'humidity', label: '空氣濕度', type: 'seg', options: [[20, '乾燥 20%'], [90, '潮濕 90%']], cols: 2 }],
      react: (s, r) => `蒸散 ${f1(r.transpiration * 10)}，光合作用 ${f1(r.photo)} 不變。`,
      targets: [tgt('h20', '濕度 20%', { ...BASE, humidity: 20 }, '選「乾燥」。'), tgt('h90', '濕度 90%', { ...BASE, humidity: 90 }, '選「潮濕」。')],
      found: ['空氣越乾，蒸散越多；濕度只影響蒸散，不影響這裡的光合作用。', '蒸散作用把水從根拉到葉'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想葉子進出的氣體。',
      found: ['你把植物的氣體交換弄懂了！', '光合放氧、呼吸耗氧，淨交換看兩者相減'] }
  ],
  quiz: [
    { q: '晚上沒有光時，植物會？', options: [
      { text: '停止所有作用。', why: '呼吸作用一直在進行。你的證據：光照 0% 時呼吸 2，葉子吸收氧氣。' },
      { text: '只進行呼吸作用，吸收氧氣。', ok: true },
      { text: '還是釋出氧氣。', why: '沒有光就沒有光合作用，只剩呼吸作用消耗氧氣。' }] },
    { q: '白天植物釋出氧氣，是因為？', options: [
      { text: '白天不進行呼吸作用。', why: '白天也在呼吸。只是光合作用比呼吸作用多，所以淨釋出氧氣。' },
      { text: '光合作用比呼吸作用多。', ok: true },
      { text: '氣孔只在白天打開。', why: '重點是光合作用和呼吸作用相減：光合 9 − 呼吸 2 ＝ 釋出 7。' }] },
    { q: '把氣孔關小，對植物有什麼影響？', options: [
      { text: '蒸散變少，但光合作用也變少。', ok: true },
      { text: '蒸散變多。', why: '你的證據：氣孔關小時水蒸氣箭頭變細，蒸散變少。' },
      { text: '光合作用變多。', why: '氣孔關小，二氧化碳不容易進來，光合作用變少。' }] }
  ],
  finish: { title: '你把植物的氣體交換弄懂了！', rule: '光合作用釋出氧氣，呼吸作用消耗氧氣，淨交換 ＝ 光合 − 呼吸。氣孔開大、空氣乾燥時蒸散多；氣孔關小時蒸散和光合都變少。', next: { label: '去生態系實驗桌', href: '../ecosystem/' } }
});
