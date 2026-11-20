// 電池與電解實驗桌：各極變化、電子流向與溶液顏色全部來自 scripts/science/models.mjs 的 calculate('cell-electrolysis')。
// 溶液顏色深淺與氣體柱高度依模型的量按比例畫出（示意）。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('cell-electrolysis', { mode: s.mode, amp: 1, time: s.time });
const g3 = x => String(Math.round(Math.abs(x) * 1000) / 1000);
const NAME = { cell: '鋅銅電池', water: '電解水', cuC: '電解硫酸銅（碳棒）', cuCu: '電解硫酸銅（銅棒）' };
const MIN = t => t === 0 ? '0 秒' : `${t} 秒（約 ${Math.round(t / 60)} 分）`;

function scene({ rig, el, txt, P, s, r }) {
  const blue = s.mode === 'water' ? 0 : s.mode === 'cuCu' ? .8 : .8 - .25 * s.time / 965;
  const sol = s.mode === 'water' ? 'rgba(214,236,246,.8)' : `rgba(60,140,220,${Math.max(.12, blue).toFixed(2)})`;
  // 燒杯
  el('path', { d: 'M300 250 v230 q0 24 24 24 h352 q24 0 24 -24 v-230', fill: 'none', stroke: '#23304A', 'stroke-width': 5 }, rig);
  el('path', { d: 'M304 300 v178 q0 22 22 22 h348 q22 0 22 -22 v-178 z', fill: sol }, rig);
  el('rect', { x: 340, y: 516, width: 320, height: 36, rx: 18, fill: 'rgba(255,255,255,.92)' }, rig);
  txt(rig, 500, 540, s.mode === 'water' ? '水（加少量電解質）' : `硫酸銅溶液${s.mode === 'cuCu' ? '（顏色不變）' : s.time ? '（藍色變淡）' : ''}`, { 'font-size': 16, fill: '#5A6478' });
  const electrode = (x, kind, delta) => {
    const w = kind === 'zn' ? Math.max(14, 30 - 30 * Math.abs(delta)) : kind === 'cu' ? 30 + 16 * Math.abs(delta) : 22;
    const fill = { zn: '#A9B2BF', cu: '#C87533', c: '#3B3B3B' }[kind];
    el('rect', { x: x - w / 2, y: 200, width: w, height: 260, rx: 4, fill, stroke: '#23304A', 'stroke-width': 3 }, rig);
    if (kind === 'c' && s.mode === 'cuC' && s.time) el('rect', { x: x - w / 2 - 3, y: 330, width: w + 6, height: 130, rx: 4, fill: '#C87533', opacity: Math.min(1, s.time / 1930 + .3) }, rig);
  };
  // 導線與電源／燈泡
  const L = 400, R = 600;
  if (s.mode === 'cell') {
    electrode(L, 'zn', r.negMass * 2); electrode(R, 'cu', r.posMass * 2);
    txt(rig, L, 188, '鋅片（負極）', { 'font-size': 15 }); txt(rig, R, 188, '銅片（正極）', { 'font-size': 15 });
    el('path', { d: `M${L} 200 V120 H${R} V200`, fill: 'none', stroke: '#7A5A3A', 'stroke-width': 4 }, rig);
    el('image', { href: P + 'prop-light-bulb.webp', x: 470, y: 60, width: 60, height: 76, opacity: s.time ? 1 : .5 }, rig);
    if (s.time) txt(rig, 500, 160, '燈泡亮', { 'font-size': 14, fill: '#C8372D' });
  } else {
    const kind = s.mode === 'cuCu' ? 'cu' : 'c';
    electrode(L, kind, s.mode === 'cuCu' ? r.negMass * 4 : 0); electrode(R, kind, s.mode === 'cuCu' ? r.posMass * 4 : 0);
    txt(rig, L, 188, `${kind === 'cu' ? '銅棒' : '碳棒'}（負極）`, { 'font-size': 15 }); txt(rig, R, 188, `${kind === 'cu' ? '銅棒' : '碳棒'}（正極）`, { 'font-size': 15 });
    el('path', { d: `M${L} 200 V120 H460 M540 120 H${R} V200`, fill: 'none', stroke: '#7A5A3A', 'stroke-width': 4 }, rig);
    el('rect', { x: 460, y: 92, width: 80, height: 56, rx: 10, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 3 }, rig);
    txt(rig, 478, 126, '−', { 'font-size': 26, fill: '#2F6FB0' }); txt(rig, 522, 126, '＋', { 'font-size': 22, fill: '#C8372D' });
    txt(rig, 500, 80, '直流電源', { 'font-size': 15 });
    if (s.mode === 'water') {
      // 倒置試管收集氣體：氫在負極、氧在正極
      const tube = (x, mol, label) => { const h = Math.min(180, mol * 9000); el('rect', { x: x - 28, y: 250, width: 56, height: 220, rx: 26, fill: 'rgba(255,255,255,.35)', stroke: '#5E8FA8', 'stroke-width': 3 }, rig); el('rect', { x: x - 25, y: 253, width: 50, height: h, rx: 22, fill: 'rgba(255,255,255,.95)' }, rig); txt(rig, x, 245, label, { 'font-size': 14, fill: '#2F6FB0' }); };
      tube(L, r.h2 || 0, '氫氣'); tube(R, r.o2 || 0, '氧氣');
    }
  }
  if (s.time) {
    const toR = s.mode === 'cell';
    el('path', { d: toR ? `M${L + 20} 108 H${R - 20}` : `M440 108 H${L + 10}`, stroke: '#2F6FB0', 'stroke-width': 3, 'marker-end': 'url(#el-a)' }, rig);
    const d = el('defs', {}, rig), mk = el('marker', { id: 'el-a', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto' }, d);
    el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#2F6FB0' }, mk);
    txt(rig, toR ? 500 : 410, toR ? 100 : 100, 'e⁻', { 'font-size': 16, fill: '#2F6FB0' });
  }
  // 結果卡
  el('rect', { x: 730, y: 220, width: 230, height: 230, rx: 16, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 2 }, rig);
  txt(rig, 845, 250, NAME[s.mode], { 'font-size': 15 });
  const lines = r.kind === 'idle' ? ['還沒通電', '兩極沒有變化'] : [r.neg, r.pos, r.sol];
  lines.forEach((t, i) => txt(rig, 845, 290 + i * 44, t.length > 14 ? t.slice(0, 14) : t, { 'font-size': 13, fill: '#23304A' }));
  lines.forEach((t, i) => { if (t.length > 14) txt(rig, 845, 308 + i * 44, t.slice(14), { 'font-size': 13, fill: '#23304A' }); });
}

const tgt = (sig, label, mode, time, aim) => ({ sig, label, aim, set: { mode, time },
  title: s => `${NAME[s.mode]}・${MIN(s.time)}`, body: (s, r) => r.kind === 'idle' ? '沒有變化' : s.mode === 'water' ? `氫氣：氧氣 ＝ 2：1（${g3(r.h2 * 1000)}：${g3(r.o2 * 1000)} mmol）` : `${r.neg}；${r.pos}` });
const TIMES = { key: 'time', label: '通電時間（1 A）', type: 'seg', options: [[0, '0'], [965, '約 16 分'], [1930, '約 32 分']] };

runDesk({
  key: 'bhcs.lab.electrolysis.v1', title: '電池與電解實驗桌', background: 'bg-chem-bench',
  sceneLabel: '電池與電解實驗桌：燒杯裡插著兩支電極，畫面顯示電極的變化、電子在導線上的流向、產生的氣體與溶液顏色',
  initial: { mode: 'cell', time: 0 },
  model, scene, viewBox: { desk: '260 50 720 520', phone: '270 50 700 520' }, phoneText: 1.35,
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
