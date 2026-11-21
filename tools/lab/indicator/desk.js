// 酸鹼指示劑實驗桌：pH 與指示劑顏色來自 ./model.mjs。
import { indicate, SOL, IND } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const KIND = { acid: '酸性', neutral: '中性', base: '鹼性' };
function scene({ rig, el, txt, P, s, r, step }) {
  // 試管架：選到的試管滴了指示劑
  el('rect', { x: 150, y: 400, width: 700, height: 26, rx: 8, fill: '#B98A52', stroke: '#23304A', 'stroke-width': 3 }, rig);
  Object.entries(SOL).forEach(([k, [name]], i) => { const x = 220 + i * 140, on = k === s.sol;
    el('rect', { x: x - 20, y: 286, width: 40, height: 104, rx: 16, fill: on ? r.hex : '#EAF4FB', opacity: .92 }, rig);
    el('image', { href: P + 'prop-test-tube.webp', x: x - 30, y: 170, width: 60, height: 231 }, rig);
    if (on) { el('path', { d: `M${x} 96 v40`, stroke: '#23304A', 'stroke-width': 5, 'stroke-linecap': 'round' }, rig); el('path', { d: `M${x} 142 q-9 14 0 20 q9 -6 0 -20z`, fill: step === 'phenol' ? '#F7F7F7' : '#8E5BB5', stroke: '#23304A', 'stroke-width': 1.5 }, rig); txt(rig, x, 84, `滴入${IND[s.ind]}`, { 'font-size': 14, fill: '#C8372D' }); }
    txt(rig, x, 452, name, { 'font-size': on ? 15 : 13, fill: on ? '#23304A' : '#5A6478' }); });
  el('rect', { x: 330, y: 478, width: 340, height: 46, rx: 12, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: 346, y: 488, width: 26, height: 26, rx: 6, fill: r.hex, stroke: '#23304A', 'stroke-width': 2 }, rig);
  txt(rig, 520, 508, `${r.name}：${r.color}`, { 'font-size': 17 });
  if (step === 'universal') { // pH 尺
    const X0 = 220, W = 560; const cols = ['#E4573F', '#E4573F', '#F0913A', '#F0913A', '#F2D03B', '#F2D03B', '#4FAE5A', '#3F7FD6', '#3F7FD6', '#3F7FD6', '#7A4BB5', '#7A4BB5', '#7A4BB5', '#7A4BB5'];
    cols.forEach((c, i) => el('rect', { x: X0 + i * W / 14, y: 546, width: W / 14 + .5, height: 18, fill: c }, rig));
    for (const p of [1, 7, 14]) txt(rig, X0 + (p - .5) * W / 14, 584, String(p), { 'font-size': 13, fill: '#5A6478' });
    el('path', { d: `M${X0 + (r.ph - .5) * W / 14} 542 l-8 -12 h16z`, fill: '#23304A' }, rig);
  }
}

const solCtl = { key: 'sol', label: '選一支試管', type: 'seg', cols: 3, options: Object.entries(SOL).map(([k, [n]]) => [k, n]) };
const tgt = (ind, sol, aim) => ({ sig: sol, label: SOL[sol][0], aim, set: { ind, sol }, title: s => `${SOL[s.sol][0]} ＋ ${IND[s.ind]}`, body: (s, r) => `呈${r.color}${s.ind === 'universal' ? `，pH 約 ${r.ph}` : ''}（${KIND[r.kind]}）` });

runDesk({
  key: 'bhcs.lab.indicator.v1', title: '酸鹼指示劑實驗桌', background: 'bg-chem-bench',
  sceneLabel: '酸鹼指示劑實驗桌：試管架上有五支試管，分別裝稀鹽酸、食醋、純水、小蘇打水和氫氧化鈉溶液，選到的試管滴入指示劑後顯示顏色',
  initial: { sol: 'water', ind: 'litmus' },
  model: indicate, scene, viewBox: s => ({ desk: s === 'universal' ? '110 50 780 560' : '110 50 780 490', phone: s === 'universal' ? '110 50 780 560' : '110 50 780 490' }), phoneText: 1.4,
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
