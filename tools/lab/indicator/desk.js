// 酸鹼指示劑實驗桌：pH 與指示劑顏色來自 ./model.mjs。
import { indicate, SOL, IND } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const KIND = { acid: '酸性', neutral: '中性', base: '鹼性' };
const INK = '#23304A', TX = k => 220 + Object.keys(SOL).indexOf(k) * 140;
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('linearGradient', 'in-glass', [[0, '#BFD8EA', .6], [.18, '#FFFFFF', .85], [.4, '#EAF4FB', .2], [.8, '#EAF4FB', .15], [.93, '#FFFFFF', .6], [1, '#A9C7DE', .6]]);
  g('linearGradient', 'in-shade', [[0, '#000', .16], [.25, '#fff', .28], [.5, '#fff', 0], [.85, '#000', .05], [1, '#000', .2]]);
  g('linearGradient', 'in-wood', [[0, '#E6C48C'], [1, '#B98A52']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'in-woodf', [[0, '#D9AE6E'], [1, '#A87943']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'in-bulb', [[0, '#7A1F1A'], [.35, '#E0574B'], [.6, '#B8352C'], [1, '#6A1A16']]);
}
function tube(el, g, x, color, glow) {
  const top = 180, bot = 402, w = 40;
  if (color) { el('path', { d: `M${x - w / 2 + 3} 300Q${x} 306 ${x + w / 2 - 3} 300V${bot - 20}A${w / 2 - 3} ${w / 2 - 3} 0 0 1 ${x - w / 2 + 3} ${bot - 20}Z`, fill: color, opacity: .92 }, g);
    el('path', { d: `M${x - w / 2 + 3} 300V${bot - 20}A${w / 2 - 3} ${w / 2 - 3} 0 0 0 ${x + w / 2 - 3} ${bot - 20}V300`, fill: 'url(#in-shade)' }, g);
    el('path', { d: `M${x - w / 2 + 3} 300Q${x} 306 ${x + w / 2 - 3} 300`, fill: 'none', stroke: '#fff', 'stroke-width': 1.6, opacity: .8 }, g); }
  if (glow) el('rect', { x: x - w / 2 - 8, y: top - 8, width: w + 16, height: bot - top + 16, rx: 26, fill: 'none', stroke: '#2E8B66', 'stroke-width': 3, 'stroke-dasharray': '6 5' }, g);
  el('path', { d: `M${x - w / 2} ${top}V${bot - 20}A${w / 2} ${w / 2} 0 0 0 ${x + w / 2} ${bot - 20}V${top}`, fill: 'url(#in-glass)', stroke: '#6E97BB', 'stroke-width': 2.2 }, g);
  el('ellipse', { cx: x, cy: top, rx: w / 2 + 3, ry: 5, fill: 'none', stroke: '#6E97BB', 'stroke-width': 3 }, g);
  el('path', { d: `M${x - w / 2 + 7} ${top + 14}V${bot - 26}`, stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: .75 }, g);
}
// 滴管：(x, y) 是管口
function dropper(el, txt, g, x, y, liquid, name) {
  el('path', { d: `M${x - 5} ${y - 74}H${x + 5}V${y - 10}L${x + 1.5} ${y}H${x - 1.5}L${x - 5} ${y - 10}Z`, fill: 'url(#in-glass)', stroke: '#6E97BB', 'stroke-width': 1.8 }, g);
  el('path', { d: `M${x - 3} ${y - 40}H${x + 3}V${y - 10}L${x + 1} ${y - 3}H${x - 1}L${x - 3} ${y - 10}Z`, fill: liquid, opacity: .9 }, g);
  el('rect', { x: x - 9, y: y - 82, width: 18, height: 10, rx: 3, fill: '#8B2A22', stroke: INK, 'stroke-width': 1.5 }, g);
  el('path', { d: `M${x - 9} ${y - 80}C${x - 18} ${y - 96} ${x - 16} ${y - 124} ${x} ${y - 126}C${x + 16} ${y - 124} ${x + 18} ${y - 96} ${x + 9} ${y - 80}Z`, fill: 'url(#in-bulb)', stroke: INK, 'stroke-width': 1.8 }, g);
  el('path', { d: `M${x - 7} ${y - 112}q-2 12 1 22`, fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .5 }, g);
  el('rect', { x: x + 14, y: y - 112, width: name.length * 14 + 14, height: 24, rx: 7, fill: '#FFF8EC', stroke: INK, 'stroke-width': 1.5 }, g);
  txt(g, x + 21 + name.length * 7, y - 95, name, { 'font-size': 13 });
}

function scene({ rig, el, txt, s, r, step, set, drag, hint, has, kind }) {
  defs(el, rig);
  const can = kind === 'observe', ind = s.ind;
  // 試管架：背板、試管、前板
  el('rect', { x: 150, y: 236, width: 700, height: 22, rx: 6, fill: 'url(#in-woodf)', stroke: INK, 'stroke-width': 2 }, rig);
  for (const x of [158, 834]) el('rect', { x, y: 236, width: 8, height: 170, fill: 'url(#in-woodf)', stroke: INK, 'stroke-width': 1.5 }, rig);
  Object.entries(SOL).forEach(([k, [name]]) => { const x = TX(k), on = k === s.sol, done = has(k) && !on;
    const color = on ? r.hex : done ? indicate({ sol: k, ind }).hex : '#F1F7FC', g = el('g', { 'data-drag': can && !on ? 'tube-' + k : null }, rig);
    tube(el, g, x, color, false);
    el('rect', { x: x - 34, y: 170, width: 68, height: 250, fill: 'transparent' }, g);
    if (can && !on) drag(g, null, { label: `滴到${name}`, tap: () => set({ sol: k }) });
    txt(rig, x, 450, name, { 'font-size': on ? 15 : 13, fill: on ? INK : '#5A6478' });
    if (done) txt(rig, x, 470, indicate({ sol: k, ind }).color, { 'font-size': 12, fill: '#5A6478' }); });
  el('rect', { x: 150, y: 266, width: 700, height: 16, rx: 5, fill: 'url(#in-wood)', stroke: INK, 'stroke-width': 2, opacity: .96 }, rig);
  for (const k of Object.keys(SOL)) el('ellipse', { cx: TX(k), cy: 270, rx: 24, ry: 4, fill: '#6B4A22', opacity: .5 }, rig);
  el('rect', { x: 140, y: 402, width: 720, height: 22, rx: 7, fill: 'url(#in-wood)', stroke: INK, 'stroke-width': 2.5 }, rig);
  // 滴管（拖到別的試管上放開）
  const X = TX(s.sol), dg = el('g', { 'data-drag': can ? 'dropper' : null }, rig), liq = indicate({ sol: 'water', ind }).hex;
  dropper(el, txt, dg, X, 166, ind === 'phenol' ? '#F4F7FA' : liq, IND[ind]);
  el('path', { d: `M${X} 172q-6 9 0 13q6 -4 0 -13z`, fill: ind === 'phenol' ? '#F4F7FA' : liq, stroke: '#6E97BB', 'stroke-width': 1 }, dg);
  el('rect', { x: X - 26, y: 34, width: 52, height: 140, fill: 'transparent' }, dg);
  if (can) drag(dg, () => { const rings = {}; for (const k of Object.keys(SOL)) if (k !== s.sol) rings[k] = el('rect', { x: TX(k) - 28, y: 172, width: 56, height: 240, rx: 26, fill: 'none', stroke: '#2E8B66', 'stroke-width': 3, 'stroke-dasharray': '6 5', opacity: 0, 'pointer-events': 'none' }, rig);
    const pick = x => Object.keys(SOL).reduce((m, k) => Math.abs(TX(k) - x) < Math.abs(TX(m) - x) ? k : m, s.sol);
    const clear = () => { for (const k in rings) rings[k].remove(); dg.removeAttribute('transform'); };
    return { move(p, p0) { dg.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`); const k = pick(X + p.x - p0.x); for (const n in rings) rings[n].setAttribute('opacity', n === k ? 1 : .35); },
      end(p, p0) { const k = pick(X + p.x - p0.x); clear(); if (k !== s.sol && Math.abs(TX(k) - (X + p.x - p0.x)) < 70) set({ sol: k }); }, cancel: clear }; }, { label: '滴管' });
  // 結果
  el('rect', { x: 330, y: 486, width: 340, height: 44, rx: 12, fill: '#FFF8EC', stroke: INK, 'stroke-width': 2.5 }, rig);
  el('rect', { x: 344, y: 495, width: 26, height: 26, rx: 6, fill: r.hex, stroke: INK, 'stroke-width': 2 }, rig);
  txt(rig, 520, 514, `${r.name}＋${IND[ind]}：${r.color}`, { 'font-size': 16 });
  if (step === 'universal') { // pH 尺
    el('rect', { x: 196, y: 538, width: 608, height: 62, rx: 12, fill: 'rgba(255,253,242,.95)', stroke: INK, 'stroke-width': 2 }, rig);
    const X0 = 220, W = 560; const cols = ['#E4573F', '#E4573F', '#F0913A', '#F0913A', '#F2D03B', '#F2D03B', '#4FAE5A', '#3F7FD6', '#3F7FD6', '#3F7FD6', '#7A4BB5', '#7A4BB5', '#7A4BB5', '#7A4BB5'];
    cols.forEach((c, i) => el('rect', { x: X0 + i * W / 14, y: 552, width: W / 14 + .5, height: 18, fill: c }, rig));
    for (const p of [1, 7, 14]) txt(rig, X0 + (p - .5) * W / 14, 588, String(p), { 'font-size': 13, fill: '#5A6478' });
    el('path', { d: `M${X0 + (r.ph - .5) * W / 14} 548 l-8 -12 h16z`, fill: INK }, rig);
  }
  hint(500, step === 'universal' ? 618 : 556, '把滴管拖到試管上，或直接點試管');
}

const solCtl = { key: 'sol', label: '選一支試管', type: 'seg', cols: 3, options: Object.entries(SOL).map(([k, [n]]) => [k, n]) };
const tgt = (ind, sol, aim) => ({ sig: sol, label: SOL[sol][0], aim, set: { ind, sol }, title: s => `${SOL[s.sol][0]} ＋ ${IND[s.ind]}`, body: (s, r) => `呈${r.color}${s.ind === 'universal' ? `，pH 約 ${r.ph}` : ''}（${KIND[r.kind]}）` });

runDesk({
  key: 'bhcs.lab.indicator.v1', title: '酸鹼指示劑實驗桌', background: 'bg-chem-bench',
  sceneLabel: '酸鹼指示劑實驗桌：試管架上有五支試管，分別裝稀鹽酸、食醋、純水、小蘇打水和氫氧化鈉溶液，把滴管拖到試管上就會滴入指示劑並顯示顏色，也可以直接點試管',
  initial: { sol: 'water', ind: 'litmus' },
  model: indicate, scene, viewBox: s => ({ desk: s === 'universal' ? '110 0 780 640' : '110 0 780 576', phone: s === 'universal' ? '110 0 780 640' : '110 0 780 576' }), phoneText: 1.4,
  readouts: (s, r) => [['指示劑', IND[s.ind], '', ''], ['顏色', r.color, '', r.name], ['酸鹼性', s.ind === 'phenol' && r.kind !== 'base' ? '不是鹼性' : KIND[r.kind], '', s.ind === 'universal' ? `pH 約 ${r.ph}` : s.ind === 'phenol' && r.kind !== 'base' ? '酸性或中性，分不出來' : '']],
  why: { title: '指示劑怎麼看', button: '指示劑顏色表', html: `
    <p class="fn-tip"><b>石蕊：</b>酸性變紅、鹼性變藍，中性維持紫色。</p>
    <p class="fn-tip"><b>酚酞：</b>酸性和中性都是無色，鹼性才變紅。所以酚酞無色時，不能判斷是酸性還是中性。</p>
    <p class="fn-tip"><b>廣用指示劑：</b>顏色隨 pH 變化，紅、橙、黃是酸性，綠是中性，藍、紫是鹼性。</p>
    <p class="fn-tip"><b>pH：</b>小於 7 是酸性，數字越小酸性越強；大於 7 是鹼性，數字越大鹼性越強。這裡的 pH 是常見的大約值。</p>
    <p class="fn-tip">真的做實驗時，鹽酸和氫氧化鈉有腐蝕性，要戴護目鏡，由老師指導。</p>` },
  steps: [
    { id: 'litmus', label: '石蕊', title: '石蕊遇到酸和鹼，變什麼顏色？', goal: '滴入石蕊。收下稀鹽酸、純水、氫氧化鈉溶液三支試管的顏色。',
      intro: '石蕊本來是紫色。選一支試管看看。', enter: { ind: 'litmus', sol: 'water' }, controls: [solCtl],
      react: (s, r) => `${r.name}讓石蕊呈${r.color}。`,
      targets: [tgt('litmus', 'hcl', '選稀鹽酸。'), tgt('litmus', 'water', '選純水。'), tgt('litmus', 'naoh', '選氫氧化鈉溶液。')],
      found: ['石蕊：酸性變紅、鹼性變藍、中性維持紫色。', '酸紅、鹼藍'] },
    { id: 'phenol', label: '酚酞', title: '酚酞能分辨酸性和中性嗎？', goal: '換成酚酞。收下稀鹽酸、純水、氫氧化鈉溶液三支試管的顏色。',
      intro: '酚酞本來是無色的。哪一支會變色？', enter: { ind: 'phenol', sol: 'hcl' }, controls: [solCtl],
      react: (s, r) => `${r.name}讓酚酞呈${r.color}。`,
      targets: [tgt('phenol', 'hcl', '選稀鹽酸。'), tgt('phenol', 'water', '選純水。'), tgt('phenol', 'naoh', '選氫氧化鈉溶液。')],
      found: ['酚酞只在鹼性變紅；酸性和中性都是無色，分不出來。', '酚酞無色 ≠ 一定是酸性'] },
    { id: 'universal', label: '酸鹼強弱', title: '同樣是酸，強弱一樣嗎？', goal: '換成廣用指示劑。收下稀鹽酸、食醋、小蘇打水的顏色，對照下面的 pH 尺。',
      intro: '廣用指示劑的顏色會跟著 pH 變。', enter: { ind: 'universal', sol: 'hcl' }, controls: [solCtl],
      react: (s, r) => `${r.name}：${r.color}，pH 約 ${r.ph}。`,
      targets: [tgt('universal', 'hcl', '選稀鹽酸。'), tgt('universal', 'vinegar', '選食醋。'), tgt('universal', 'soda', '選小蘇打水。')],
      found: ['稀鹽酸 pH 約 1、食醋約 3，都是酸性，但鹽酸酸性比較強；小蘇打水約 9，是弱鹼性。', 'pH ＜ 7 酸性、＝ 7 中性、＞ 7 鹼性'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想三種指示劑的顏色。',
      found: ['你會用指示劑判斷酸鹼了！', '石蕊分酸鹼；酚酞只認鹼；廣用指示劑看強弱'] }
  ],
  quiz: [
    { q: '某溶液滴入酚酞後是無色，可以確定它是酸性嗎？', options: [
      { text: '可以，無色就是酸性。', why: '你的證據：純水（中性）滴入酚酞也是無色。' },
      { text: '不行，它可能是酸性，也可能是中性。', ok: true },
      { text: '不行，它一定是鹼性。', why: '鹼性會讓酚酞變紅，無色表示不是鹼性。' }] },
    { q: '藍色石蕊試紙碰到某溶液後變紅，這個溶液是？', options: [
      { text: '酸性。', ok: true },
      { text: '鹼性。', why: '鹼性讓石蕊變藍。變紅表示是酸性。' },
      { text: '中性。', why: '中性不會讓石蕊變色。' }] },
    { q: '甲溶液 pH ＝ 1，乙溶液 pH ＝ 3，哪一個酸性比較強？', options: [
      { text: '乙，因為數字比較大。', why: 'pH 越小，酸性越強。你的證據：稀鹽酸（約 1）比食醋（約 3）酸。' },
      { text: '甲，pH 越小酸性越強。', ok: true },
      { text: '一樣強，都小於 7。', why: '都是酸性沒錯，但強弱不同，pH 越小越強。' }] }
  ],
  finish: { title: '你會用指示劑判斷酸鹼了！', rule: '石蕊：酸紅、鹼藍。酚酞：只有鹼性變紅。廣用指示劑和 pH：小於 7 是酸性，越小越強；大於 7 是鹼性，越大越強。', next: { label: '去酸鹼中和實驗桌', href: '../neutralization/' } }
});
