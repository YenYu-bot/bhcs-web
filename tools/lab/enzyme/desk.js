// 酵素實驗桌：活性、最適 pH 與是否變性全部來自 scripts/science/models.mjs 的 calculate('enzyme')（教學模型）。
// 試管顏色用碘液示意：活性高，澱粉（或蛋白質）被分解得多；顏色深淺依活性按比例畫出。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('enzyme', { enzyme: s.enzyme, temp: s.temp, ph: s.ph, conc: 1, heatDenatured: s.heated });
const NAME = { amylase: '唾液澱粉酶', pepsin: '胃蛋白酶' };
const pct = r => Math.round(Math.min(1, r.act) * 100);
const mix = (a, b, k) => '#' + [0, 2, 4].map(i => Math.round(parseInt(a.slice(1 + i, 3 + i), 16) * (1 - k) + parseInt(b.slice(1 + i, 3 + i), 16) * k).toString(16).padStart(2, '0')).join('');

const INK = '#23304A', BATH = { 0: 160, 37: 285, 60: 410 }, n1 = v => v.toFixed(1);
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('linearGradient', 'ez-glass', [[0, '#CFE3F2', .55], [.12, '#FFFFFF', .7], [.3, '#E8F3FB', .18], [.8, '#E8F3FB', .14], [.92, '#FFFFFF', .55], [1, '#B7D2E6', .6]]);
  g('radialGradient', 'ez-enz', [[0, '#9FD0F2'], [.6, '#4E95D6'], [1, '#2A5FA0']], { cx: .35, cy: .3, r: .85 });
  g('radialGradient', 'ez-enz-bad', [[0, '#C9C2B6'], [1, '#8A8275']], { cx: .35, cy: .3, r: .85 });
  g('linearGradient', 'ez-sub', [[0, '#FFE8A0'], [1, '#E9B94A']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'ez-bottle', [[0, '#A9CFE8'], [.4, '#E8F4FB'], [1, '#8FB9D6']]);
  const w = { 0: ['#E4F2FB', '#BFE0F4'], 37: ['#DDF0F5', '#A9D6E6'], 60: ['#FBE3D6', '#F0B69A'] };
  for (const t in w) g('linearGradient', `ez-w${t}`, [[0, w[t][0], .9], [1, w[t][1], .95]], { x1: 0, y1: 0, x2: 0, y2: 1 });
}
// 水浴燒杯：0 °C 有冰塊、60 °C 冒泡
function bath(el, txt, g, cx, T, on) {
  const x0 = cx - 54, top = 340, bot = 470;
  el('path', { d: `M${x0 + 4} ${top + 22}H${x0 + 104}V${bot - 8}Q${x0 + 104} ${bot} ${x0 + 96} ${bot}H${x0 + 12}Q${x0 + 4} ${bot} ${x0 + 4} ${bot - 8}Z`, fill: `url(#ez-w${T})` }, g);
  if (T === 0) for (let i = 0; i < 4; i++) el('rect', { x: x0 + 12 + i * 22, y: top + 18 + (i % 2) * 6, width: 18, height: 16, rx: 4, fill: '#FFFFFF', stroke: '#9CC8E6', 'stroke-width': 1.4, transform: `rotate(${(i - 1.5) * 9} ${x0 + 21 + i * 22} ${top + 26})` }, g);
  if (T === 60) { for (let i = 0; i < 7; i++) el('circle', { cx: x0 + 14 + rnd(i, 1) * 80, cy: top + 40 + rnd(i, 2) * 80, r: 2 + rnd(i, 3) * 3, fill: '#fff', opacity: .75 }, g); for (const dx of [26, 54, 82]) el('path', { d: `M${x0 + dx} ${top + 10}c-8 -10 8 -16 0 -26`, fill: 'none', stroke: '#E2B8A4', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .8 }, g); }
  el('path', { d: `M${x0} ${top}H${x0 + 110}l6 -6M${x0 + 4} ${top}V${bot - 8}Q${x0 + 4} ${bot} ${x0 + 12} ${bot}H${x0 + 96}Q${x0 + 104} ${bot} ${x0 + 104} ${bot - 8}V${top}`, fill: 'url(#ez-glass)', stroke: on ? '#2E8B66' : '#6E97BB', 'stroke-width': on ? 3.5 : 2.4 }, g);
  el('rect', { x: cx - 30, y: bot + 8, width: 60, height: 24, rx: 8, fill: on ? '#E9F6F0' : '#FFF8EC', stroke: on ? '#2E8B66' : INK, 'stroke-width': 2 }, g);
  txt(g, cx, bot + 25, `${T} °C`, { 'font-size': 15, fill: on ? '#1F6E50' : INK });
}
function tube(el, txt, g, x, top, col, enzyme, k, label) {
  el('path', { d: `M${x - 18} ${top}V${top + 170}A18 18 0 0 0 ${x + 18} ${top + 170}V${top}`, fill: 'url(#ez-glass)', stroke: '#6E97BB', 'stroke-width': 2.4 }, g);
  el('path', { d: `M${x - 15} ${top + 92}Q${x} ${top + 96} ${x + 15} ${top + 92}V${top + 170}A15 15 0 0 1 ${x - 15} ${top + 170}Z`, fill: col }, g);
  if (enzyme === 'pepsin' && k < .5) for (let i = 0; i < 4; i++) el('rect', { x: x - 11 + (i % 2) * 12, y: top + 130 + Math.floor(i / 2) * 18, width: 10, height: 10, rx: 2, fill: '#F7F1DE', stroke: '#B8AC98' }, g);
  el('ellipse', { cx: x, cy: top, rx: 20, ry: 4, fill: 'none', stroke: '#6E97BB', 'stroke-width': 3 }, g);
  el('path', { d: `M${x - 10} ${top + 12}V${top + 160}`, stroke: '#fff', 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: .7 }, g);
  if (label) { el('rect', { x: x - 26, y: top + 34, width: 52, height: 22, rx: 5, fill: '#FFF8EC', stroke: INK, 'stroke-width': 1.5 }, g); txt(g, x, top + 50, label, { 'font-size': 11 }); }
}
// 酵素分子：表面平滑的一團，右邊有活性部位（凹槽）；narrow 讓凹槽變形
function enzymeShape(el, g, cx, cy, R, narrow, fill) {
  let d = ''; const N = 80;
  for (let i = 0; i <= N; i++) { const a = i / N * 2 * Math.PI - Math.PI, bump = 1 + .07 * Math.sin(a * 3 + 1) + .05 * Math.sin(a * 5 + 2), notch = Math.abs(a) < .42 ? (1 - .46 * Math.pow(Math.cos(a / .42 * Math.PI / 2), .6) * (narrow ? .55 : 1)) : 1;
    const rr = R * bump * notch * (narrow && Math.abs(a) < .6 ? 1 + .06 * Math.sin(a * 9) : 1); d += `${i ? 'L' : 'M'}${n1(cx + rr * Math.cos(a))} ${n1(cy + rr * Math.sin(a) * .86)}`; }
  el('path', { d: d + 'Z', fill: '#000', opacity: .12, transform: 'translate(4 6)' }, g);
  el('path', { d: d + 'Z', fill, stroke: '#1F4F86', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, g);
  el('ellipse', { cx: cx - R * .35, cy: cy - R * .38, rx: R * .26, ry: R * .12, fill: '#fff', opacity: .35, transform: `rotate(-25 ${cx - R * .35} ${cy - R * .38})` }, g);
}
// 受質：澱粉是一串葡萄糖（六角形），蛋白質是一串胺基酸（彩色小球）
function substrate(el, g, enzyme, x, y, n, rot = 0) {
  const q = el('g', { transform: `rotate(${rot} ${x} ${y})` }, g);
  for (let i = 0; i < n; i++) { const cx = x + i * 26;
    if (i) el('path', { d: `M${cx - 16} ${y}h6`, stroke: '#8A6A3A', 'stroke-width': 3 }, q);
    if (enzyme === 'pepsin') el('circle', { cx, cy: y, r: 10, fill: ['#F08A7E', '#8FCB6E', '#F4C04E', '#9AA7E0'][i % 4], stroke: INK, 'stroke-width': 1.5 }, q);
    else { let h = ''; for (let k = 0; k < 6; k++) { const a = k / 6 * 2 * Math.PI + Math.PI / 6; h += `${k ? 'L' : 'M'}${n1(cx + 11 * Math.cos(a))} ${n1(y + 11 * Math.sin(a))}`; } el('path', { d: h + 'Z', fill: 'url(#ez-sub)', stroke: '#A2781E', 'stroke-width': 1.6 }, q); } }
  return q;
}

function scene({ rig, el, txt, s, r, step, set, drag, hint, kind }) {
  defs(el, rig);
  const can = kind === 'observe', k = Math.min(1, r.act), sub = s.enzyme === 'pepsin' ? '蛋白質' : '澱粉';
  const col = s.enzyme === 'pepsin' ? mix('#E9E4D2', '#F8F4EA', k) : mix('#1F2A6B', '#E5C27A', k);
  // 左：水浴與試管
  const temps = step === 'temp' ? [0, 37, 60] : [s.temp], tubeX = step === 'temp' ? BATH[s.temp] : 285;
  for (const T of temps) bath(el, txt, rig, step === 'temp' ? BATH[T] : 285, T, T === s.temp);
  const tg = el('g', { 'data-drag': can && step === 'temp' ? 'tube' : null }, rig);
  tube(el, txt, tg, tubeX, 232, col, s.enzyme, k, s.heated ? '加熱過' : '');
  el('rect', { x: tubeX - 26, y: 226, width: 52, height: 200, fill: 'transparent' }, tg);
  if (can && step === 'temp') drag(tg, () => ({ move(p, p0) { tg.setAttribute('transform', `translate(${p.x - p0.x} ${Math.min(0, p.y - p0.y)})`); },
    end(p, p0) { tg.removeAttribute('transform'); const x = tubeX + p.x - p0.x, T = +Object.entries(BATH).reduce((m, e) => Math.abs(e[1] - x) < Math.abs(m[1] - x) ? e : m)[0]; if (T !== s.temp) set({ temp: T }); }, cancel() { tg.removeAttribute('transform'); } }),
    { label: '把試管換到下一個水浴', tap: () => set({ temp: { 0: 37, 37: 60, 60: 0 }[s.temp] }) });
  if (s.heated) txt(rig, tubeX, 210, '先加熱到 60 °C 再冷卻', { 'font-size': 13, fill: '#C8372D' });
  el('rect', { x: 120, y: 516, width: 330, height: 30, rx: 15, fill: '#FFFDF2', opacity: .95 }, rig);
  txt(rig, 285, 536, s.enzyme === 'pepsin' ? `蛋白質（蛋白塊）${k >= .5 ? '被分解了' : '還在'}` : `加碘液：${k >= .5 ? '不變藍（澱粉被分解了）' : '藍黑色（澱粉還在）'}`, { 'font-size': 15, fill: k >= .5 ? '#2E8B66' : INK });
  // 冷卻後：兩支試管選一支
  if (step === 'cool') [[false, '新的酵素', 150], [true, '加熱過再冷卻', 420]].forEach(([h, label, x]) => { const on = s.heated === h, g = el('g', { 'data-drag': can && !on ? `pick-${h ? 'heated' : 'fresh'}` : null, opacity: on ? .35 : 1 }, rig);
    el('rect', { x: x - 54, y: 232, width: 108, height: 104, rx: 14, fill: '#FFF8EC', stroke: on ? '#8A93A6' : '#2E8B66', 'stroke-width': 2, 'stroke-dasharray': '6 4' }, g);
    el('path', { d: `M${x - 8} 248V300a8 8 0 0 0 16 0V248`, fill: h ? '#F7D2C2' : '#DCEFFB', stroke: '#6E97BB', 'stroke-width': 2 }, g);
    txt(g, x, 326, label, { 'font-size': 12, fill: on ? '#5A6478' : '#1F6E50' });
    if (can && !on) drag(g, () => ({ move(p, p0) { g.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`); }, end(p) { g.removeAttribute('transform'); if (Math.abs(p.x - 285) < 80) set({ heated: h }); }, cancel() { g.removeAttribute('transform'); } }), { label: `換成${label}`, tap: () => set({ heated: h }) }); });
  // 酸鹼度：酵素瓶和 pH 緩衝液瓶
  if (step === 'ph') { const bottles = [['enzyme', 'amylase', '唾液澱粉酶', 130], ['enzyme', 'pepsin', '胃蛋白酶', 200], ['ph', 2, 'pH 2', 370], ['ph', 7, 'pH 7', 440]];
    bottles.forEach(([key, v, label, x]) => { const on = s[key] === v, g = el('g', { 'data-drag': can && !on ? `bottle-${v}` : null, opacity: on ? .35 : 1 }, rig);
      el('path', { d: `M${x - 22} 302v-46q0 -10 10 -12v-14h24v14q10 2 10 12v46q0 8 -8 8h-28q-8 0 -8 -8z`, fill: 'url(#ez-bottle)', stroke: INK, 'stroke-width': 2 }, g);
      el('rect', { x: x - 14, y: 222, width: 28, height: 10, rx: 3, fill: key === 'ph' ? (v === 2 ? '#E8432A' : '#4FAE5A') : '#7A4BB5', stroke: INK, 'stroke-width': 1.5 }, g);
      el('rect', { x: x - 20, y: 266, width: 40, height: 22, rx: 4, fill: '#FFF8EC' }, g); txt(g, x, 282, key === 'ph' ? label : '酵素', { 'font-size': 11 });
      txt(g, x, 328, label, { 'font-size': 11, fill: on ? '#5A6478' : '#1F6E50' });
      if (can && !on) drag(g, () => ({ move(p, p0) { g.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`); }, end(p) { g.removeAttribute('transform'); if (Math.abs(p.x - 285) < 70 && p.y > 200) set({ [key]: v }); }, cancel() { g.removeAttribute('transform'); } }), { label: `換成${label}`, tap: () => set({ [key]: v }) }); }); }
  // 右：分子層級
  el('rect', { x: 520, y: 120, width: 420, height: 250, rx: 18, fill: 'rgba(255,255,255,.95)', stroke: INK, 'stroke-width': 3 }, rig);
  txt(rig, 730, 148, `放大看：${NAME[s.enzyme]}和${sub}`, { 'font-size': 15, fill: '#5A6478' });
  const EX = 640, EY = 252;
  if (r.den) { // 變性：鏈打開成一條亂掉的帶子
    let d = `M${EX - 80} ${EY + 30}`; for (let i = 0; i < 9; i++) d += `q${12 + rnd(i, 1) * 10} ${(i % 2 ? -1 : 1) * (30 + rnd(i, 2) * 20)} ${24 + rnd(i, 3) * 6} ${(rnd(i, 4) - .5) * 20}`;
    el('path', { d, fill: 'none', stroke: '#8A8275', 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, rig); el('path', { d, fill: 'none', stroke: '#C9C2B6', 'stroke-width': 6, 'stroke-linecap': 'round' }, rig);
    substrate(el, rig, s.enzyme, 790, 220, 5, 10); txt(rig, 730, 350, '形狀被破壞（變性），冷卻也回不去', { 'font-size': 15, fill: '#C8372D' });
  } else if (r.kind === 'active') {
    enzymeShape(el, rig, EX, EY, 78, false, 'url(#ez-enz)'); substrate(el, rig, s.enzyme, EX + 46, EY, 1);
    substrate(el, rig, s.enzyme, EX + 98, EY - 34, 2, -18); substrate(el, rig, s.enzyme, EX + 150, EY + 30, 2, 14);
    el('path', { d: `M${EX + 72} ${EY - 22}l10 -8M${EX + 72} ${EY + 20}l10 8`, stroke: '#C8372D', 'stroke-width': 3, 'stroke-linecap': 'round' }, rig);
    txt(rig, 730, 350, `${sub}卡進凹槽，被切成小段`, { 'font-size': 15, fill: '#2E8B66' });
  } else { const cold = s.temp <= 5; enzymeShape(el, rig, EX, EY, 78, !cold, cold ? 'url(#ez-enz)' : 'url(#ez-enz-bad)'); substrate(el, rig, s.enzyme, EX + 116, EY - 40, 5, cold ? -8 : 0);
    if (cold) for (const [x, y] of [[EX + 210, EY + 40], [EX - 40, EY - 92]]) el('path', { d: `M${x} ${y}h-14m4 -6h-10m6 12h-10`, stroke: '#7FB2E5', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, rig);
    txt(rig, 730, 350, cold ? '溫度太低，分子動得很慢，很少碰上' : '酸鹼度不對，凹槽形狀改變，卡不進去', { 'font-size': 15, fill: '#B87A1E' }); }
  el('rect', { x: EX - 16, y: EY - 10, width: 0, height: 0, fill: 'none' }, rig);
  txt(rig, EX - 78, 186, '酵素', { 'font-size': 14, fill: '#2A5FA0' });
  // 活性條
  el('rect', { x: 520, y: 394, width: 420, height: 112, rx: 18, fill: 'rgba(255,255,255,.95)', stroke: INK, 'stroke-width': 3 }, rig);
  txt(rig, 540, 424, `${NAME[s.enzyme]}的活性（相對）`, { 'text-anchor': 'start', 'font-size': 16 });
  el('rect', { x: 540, y: 440, width: 380, height: 30, rx: 8, fill: '#F2EBDD' }, rig);
  if (pct(r)) el('rect', { x: 540, y: 440, width: 3.8 * pct(r), height: 30, rx: 8, fill: r.den ? '#B8AC98' : '#2E8B66' }, rig);
  txt(rig, 910, 462, `${pct(r)}%`, { 'text-anchor': 'end', 'font-size': 17, 'font-weight': 900 });
  txt(rig, 730, 494, `最適 pH ${r.opt}、最適溫度約 37 °C；現在 pH ${s.ph}`, { 'font-size': 13, fill: '#5A6478' });
  hint(730, 540, step === 'temp' ? '把試管拖到另一個水浴' : step === 'cool' ? '把另一支試管拖到水浴上，或點一下' : step === 'ph' ? '把瓶子拖到試管上，或點一下' : '');
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: s => `${NAME[s.enzyme]}・${s.temp} °C・pH ${s.ph}${s.heated ? '・加熱過' : ''}`,
  body: (s, r) => r.den ? '變性，活性 0（冷卻也回不來）' : `活性 ${pct(r)}%` });
const BASE = { enzyme: 'amylase', temp: 37, ph: 7, heated: false };

runDesk({
  key: 'bhcs.lab.enzyme.v1', title: '酵素實驗桌', background: 'bg-chem-bench',
  sceneLabel: '酵素實驗桌：左邊是水浴和試管（加碘液看顏色），可以把試管拖到 0、37、60 °C 的水浴，或把酵素瓶、pH 緩衝液瓶拖到試管上；右邊放大看酵素分子和受質，以及活性的長條',
  initial: { ...BASE },
  model, scene, viewBox: { desk: '90 96 870 480', phone: '90 96 870 480' }, phoneText: 1.4,
  readouts: (s, r) => [['溫度', s.temp, '°C', s.heated ? '加熱過再冷卻' : ''], ['pH', s.ph, '', `最適 pH ${r.opt}`], ['活性', pct(r), '%', r.den ? '已變性' : NAME[s.enzyme]]],
  why: { title: '酵素的特性', button: '酵素怎麼作用', html: `
    <p class="fn-tip"><b>酵素是蛋白質，能加快體內的化學反應，</b>例如唾液澱粉酶把澱粉分解成麥芽糖，胃蛋白酶分解蛋白質。</p>
    <p class="fn-tip"><b>溫度：</b>人體的酵素在約 37 °C 活性最好；太冷活性很低，但回暖後可以恢復；太熱（約 60 °C 以上）酵素的形狀被破壞（變性），冷卻後也回不來。</p>
    <p class="fn-tip"><b>pH：</b>每種酵素有最適的酸鹼度。唾液澱粉酶在中性（pH 7）最好，胃蛋白酶在強酸（pH 2）最好。</p>
    <p class="fn-tip">碘液遇澱粉呈藍黑色；澱粉被分解後就不變藍。模型說明：活性是教學模型的相對值。</p>` },
  steps: [
    { id: 'temp', label: '溫度', title: '溫度高低，酵素活性怎麼變？', goal: '唾液澱粉酶加澱粉，放進 0 °C、37 °C、60 °C 的水浴，看碘液顏色和活性，各收一張。',
      intro: '把試管放進不同溫度的水浴，10 分鐘後加碘液看看！', enter: { ...BASE },
      controls: [{ key: 'temp', label: '水浴溫度', type: 'seg', options: [[0, '0 °C'], [37, '37 °C'], [60, '60 °C']] }],
      react: (s, r) => r.den ? '60 °C：酵素變性了，澱粉沒被分解。' : `${s.temp} °C：活性 ${pct(r)}%。`,
      targets: [tgt('t0', '0 °C', { ...BASE, temp: 0 }, '選 0 °C。'), tgt('t37', '37 °C', { ...BASE }, '選 37 °C。'), tgt('t60', '60 °C', { ...BASE, temp: 60 }, '選 60 °C。')],
      found: ['37 °C 活性最好；0 °C 很慢；60 °C 酵素變性，失去作用。', '碘液不變藍 ＝ 澱粉被分解了'] },
    { id: 'cool', label: '冷卻後', title: '加熱過的酵素，冷卻後會恢復嗎？', goal: '都在 37 °C 下比較：新的酵素，和先加熱到 60 °C 再冷卻的酵素，各收一張。',
      intro: '把 60 °C 的酵素冷卻回 37 °C，它會恢復活性嗎？', enter: { ...BASE, heated: true },
      controls: [{ key: 'heated', label: '酵素', type: 'seg', options: [[false, '新的酵素'], [true, '加熱過再冷卻']], cols: 2 }],
      react: (s, r) => r.den ? '加熱過的酵素形狀已經壞了，冷卻也回不來。' : '新的酵素在 37 °C 活性最好。',
      targets: [tgt('fresh', '新的酵素', { ...BASE }, '選「新的酵素」。'), tgt('heat', '加熱過再冷卻', { ...BASE, heated: true }, '選「加熱過再冷卻」。')],
      found: ['高溫變性是不可逆的：冷卻後酵素也不會恢復。', '低溫只是變慢，高溫是破壞形狀'] },
    { id: 'ph', label: '酸鹼度', title: '不同的酵素，喜歡不同的 pH？', goal: '比較唾液澱粉酶在 pH 7 和 pH 2，以及胃蛋白酶在 pH 2，各收一張。',
      intro: '胃裡很酸（pH 約 2），唾液澱粉酶到了胃還能作用嗎？', enter: { ...BASE },
      controls: [{ key: 'enzyme', label: '酵素', type: 'seg', options: [['amylase', '唾液澱粉酶'], ['pepsin', '胃蛋白酶']], cols: 2 }, { key: 'ph', label: 'pH', type: 'seg', options: [[2, 'pH 2（強酸）'], [7, 'pH 7（中性）']], cols: 2 }],
      react: (s, r) => `${NAME[s.enzyme]}在 pH ${s.ph}：活性 ${pct(r)}%。`,
      targets: [tgt('a7', '唾液澱粉酶・pH 7', { ...BASE }, '選唾液澱粉酶、pH 7。'), tgt('a2', '唾液澱粉酶・pH 2', { ...BASE, ph: 2 }, '把 pH 改成 2。'), tgt('p2', '胃蛋白酶・pH 2', { ...BASE, enzyme: 'pepsin', ph: 2 }, '換成胃蛋白酶、pH 2。')],
      found: ['唾液澱粉酶在中性最好、到強酸就不作用；胃蛋白酶正好相反。', '每種酵素有自己的最適 pH'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想酵素的形狀。',
      found: ['你把酵素的特性弄懂了！', '溫度和 pH 都會影響酵素；高溫變性回不來'] }
  ],
  quiz: [
    { q: '唾液澱粉酶在 0 °C 和 60 °C 都幾乎不作用，差別在哪裡？', options: [
      { text: '沒有差別，都是溫度不對。', why: '你的證據：60 °C 的酵素冷卻後也回不來，0 °C 只是變慢。' },
      { text: '0 °C 回暖後能恢復，60 °C 變性後不能恢復。', ok: true },
      { text: '0 °C 才會變性。', why: '低溫只讓反應變慢，高溫才會破壞酵素的形狀。' }] },
    { q: '試管加碘液後呈藍黑色，表示？', options: [
      { text: '澱粉已經被分解了。', why: '碘液遇澱粉變藍黑色，表示澱粉還在，酵素沒作用。' },
      { text: '澱粉還在，酵素沒有作用。', ok: true },
      { text: '酵素活性最好。', why: '活性好時澱粉被分解，加碘液不會變藍。' }] },
    { q: '胃蛋白酶在哪個 pH 活性最好？', options: [
      { text: 'pH 7', why: '那是唾液澱粉酶。你的證據：胃蛋白酶在 pH 2 活性最好。' },
      { text: 'pH 2', ok: true },
      { text: 'pH 12', why: '胃液是強酸，胃蛋白酶喜歡酸性環境。' }] }
  ],
  finish: { title: '你把酵素的特性弄懂了！', rule: '酵素在適當的溫度（約 37 °C）和 pH 下活性最好。低溫變慢可恢復；高溫使酵素變性，不能恢復。不同酵素的最適 pH 不同。', next: { label: '去植物氣體交換實驗桌', href: '../plant-exchange/' } }
});
