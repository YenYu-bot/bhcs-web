// 生態系實驗桌：各營養階層的能量與族群數量全部來自 scripts/science/models.mjs 的 calculate('ecosystem')（單一族群邏輯斯模型）。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('ecosystem', { energy: 10000, efficiency: s.efficiency, initial: 50, capacity: s.capacity, rate: 0.2, time: s.time });
const r0 = x => String(Math.round(x));
const TIERS = [['生產者', '草', '#7CC47A'], ['初級消費者', '兔子', '#E0A21B'], ['次級消費者', '狐狸', '#C8372D']];

function scene({ rig, el, txt, s, r, step }) {
  // 能量塔（寬度用平方根比例，讓頂層看得見；數字是真實的值）
  const cx = 270, base = 470, h = 82;
  r.energy.forEach((e, i) => {
    const w = Math.max(56, 380 * Math.sqrt(e / 10000)), y = base - (i + 1) * h, inside = w >= 210;
    el('rect', { x: cx - w / 2, y, width: w, height: h - 8, rx: 10, fill: TIERS[i][2], stroke: '#23304A', 'stroke-width': 3 }, rig);
    if (inside) { txt(rig, cx, y + 32, `${TIERS[i][0]}（${TIERS[i][1]}）`, { 'font-size': 15, fill: '#fff' }); txt(rig, cx, y + 56, `${r0(e)} kJ`, { 'font-size': 17, fill: '#fff' }); }
    else { txt(rig, cx + w / 2 + 12, y + 30, `${TIERS[i][0]}（${TIERS[i][1]}）`, { 'font-size': 15, 'text-anchor': 'start' }); txt(rig, cx + w / 2 + 12, y + 54, `${r0(e)} kJ`, { 'font-size': 17, 'text-anchor': 'start', fill: TIERS[i][2] }); }
    if (i > 0) txt(rig, cx - 200, y + 44, `↑ ${s.efficiency}%`, { 'font-size': 15, fill: '#5A6478', 'text-anchor': 'start' });
  });
  txt(rig, cx, base + 34, '能量塔：每往上一層只剩一小部分', { 'font-size': 15, fill: '#5A6478' });
  // 族群曲線（兔子）
  const gx = 630, gy = 440, W = 270, H = 260, t2x = t => gx + t / 30 * W, p2y = p => gy - p / 450 * H;
  el('rect', { x: gx - 50, y: gy - H - 50, width: W + 80, height: H + 100, rx: 16, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, gx - 30, gy - H - 22, '兔子族群數量（隻）', { 'text-anchor': 'start', 'font-size': 14, fill: '#5A6478' });
  el('line', { x1: gx, y1: p2y(s.capacity), x2: gx + W, y2: p2y(s.capacity), stroke: '#2E8B66', 'stroke-width': 2, 'stroke-dasharray': '8 6' }, rig);
  txt(rig, gx + W - 4, p2y(s.capacity) - 8, `承載量 K ＝ ${s.capacity}`, { 'text-anchor': 'end', 'font-size': 13, fill: '#2E8B66' });
  const pts = [];
  for (let t = 0; t <= 30; t += .5) pts.push(`${t2x(t)},${p2y(calculate('ecosystem', { energy: 10000, efficiency: s.efficiency, initial: 50, capacity: s.capacity, rate: 0.2, time: t }).population)}`);
  el('polyline', { points: pts.join(' '), fill: 'none', stroke: '#E0A21B', 'stroke-width': 4 }, rig);
  el('circle', { cx: t2x(s.time), cy: p2y(r.population), r: 8, fill: '#C8372D', stroke: '#fff', 'stroke-width': 2 }, rig);
  txt(rig, t2x(s.time) + (s.time > 20 ? -12 : 12), p2y(r.population) + 24, `${r0(r.population)} 隻`, { 'text-anchor': s.time > 20 ? 'end' : 'start', 'font-size': 15, fill: '#C8372D' });
  el('line', { x1: gx, y1: gy, x2: gx + W, y2: gy, stroke: '#23304A', 'stroke-width': 2 }, rig);
  for (const t of [0, 10, 20, 30]) txt(rig, t2x(t), gy + 20, String(t), { 'font-size': 13, fill: '#5A6478' });
  txt(rig, gx + W / 2, gy + 40, '經過時間', { 'font-size': 13, fill: '#5A6478' });
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: s => sig.startsWith('e') ? `每層傳 ${s.efficiency}%` : `K ＝ ${s.capacity}・時間 ${s.time}`,
  body: (s, r) => sig.startsWith('e') ? `草 ${r0(r.energy[0])} → 兔 ${r0(r.energy[1])} → 狐 ${r0(r.energy[2])} kJ` : `兔子 ${r0(r.population)} 隻` });
const BASE = { efficiency: 10, capacity: 200, time: 10 };

runDesk({
  key: 'bhcs.lab.ecosystem.v1', title: '生態系實驗桌', background: 'bg-physics-bench',
  sceneLabel: '生態系實驗桌：左邊是草、兔子、狐狸三層的能量塔，右邊是兔子族群數量隨時間的曲線與環境承載量',
  initial: { ...BASE },
  model, scene, viewBox: { desk: '60 110 880 460', phone: '60 110 880 460' }, phoneText: 1.4,
  readouts: (s, r) => [['初級消費者能量', r0(r.energy[1]), 'kJ', `草 10000 kJ × ${s.efficiency}%`], ['次級消費者能量', r0(r.energy[2]), 'kJ', `再 × ${s.efficiency}%`], ['兔子數量', r0(r.population), '隻', `K ＝ ${s.capacity}`]],
  why: { title: '能量流動與族群', button: '生態系怎麼看', html: `
    <p class="fn-tip"><b>能量沿著食物鏈流動：</b>草（生產者）→ 兔子（初級消費者）→ 狐狸（次級消費者）。每往上一層，只有一小部分能量傳下去，其餘用在呼吸、活動或變成熱散失，所以能量塔越上面越小。</p>
    <p class="fn-tip"><b>族群成長：</b>資源充足時族群增加得快；越接近環境能支撐的最大數量（承載量 K），成長越慢，最後穩定在 K 附近。</p>
    <p class="fn-tip">模型說明：能量塔的寬度用平方根比例畫，頂層才看得見；數字是真實的計算值。族群是單一物種的教學模型（起始 50 隻、成長率 0.2），真實生態系的物種會互相影響。</p>` },
  steps: [
    { id: 'pyramid', label: '能量塔', title: '能量往上傳，剩下多少？', goal: '草有 10000 kJ。比較每層傳 10% 和 20% 時，兔子和狐狸得到的能量，各收一張。',
      intro: '每往上一層只傳一部分能量。狐狸能拿到多少？', enter: { ...BASE },
      controls: [{ key: 'efficiency', label: '每層傳遞的比例', type: 'seg', options: [[10, '10%'], [20, '20%']], cols: 2 }],
      react: (s, r) => `草 10000 → 兔 ${r0(r.energy[1])} → 狐 ${r0(r.energy[2])} kJ。`,
      targets: [tgt('e10', '傳 10%', { ...BASE }, '選 10%。'), tgt('e20', '傳 20%', { ...BASE, efficiency: 20 }, '選 20%。')],
      found: ['每往上一層，能量都大量減少：傳 10% 時狐狸只剩 100 kJ。', '能量塔越上面越小，所以頂端的消費者數量少'] },
    { id: 'grow', label: '族群成長', title: '兔子族群會一直增加嗎？', goal: '50 隻兔子進到新草原（承載量 200）。看時間 0、10、30 時的數量，各收一張。',
      intro: '兔子越來越多……會一直增加下去嗎？', enter: { ...BASE, time: 0 },
      controls: [{ key: 'time', label: '經過時間', type: 'seg', options: [[0, '0'], [10, '10'], [30, '30']] }],
      react: (s, r) => `時間 ${s.time}：${r0(r.population)} 隻。`,
      targets: [tgt('g0', '時間 0', { ...BASE, time: 0 }, '選時間 0。'), tgt('g10', '時間 10', { ...BASE }, '選時間 10。'), tgt('g30', '時間 30', { ...BASE, time: 30 }, '選時間 30。')],
      found: ['族群先增加得快，接近承載量時變慢，最後停在 200 附近。', '環境的資源有限，族群不會無限增加'] },
    { id: 'capacity', label: '承載量', title: '草原變大，兔子會變多嗎？', goal: '時間 30。比較承載量 200 和 400 時的兔子數量，各收一張。',
      intro: '如果草原的食物變成兩倍，承載量變成 400 呢？', enter: { ...BASE, time: 30, capacity: 400 },
      controls: [{ key: 'capacity', label: '承載量 K', type: 'seg', options: [[200, '200'], [400, '400']], cols: 2 }],
      react: (s, r) => `K ＝ ${s.capacity}：時間 30 時有 ${r0(r.population)} 隻。`,
      targets: [tgt('k200', 'K ＝ 200', { ...BASE, time: 30 }, '選 200。'), tgt('k400', 'K ＝ 400', { ...BASE, time: 30, capacity: 400 }, '選 400。')],
      found: ['承載量變大，族群最後穩定的數量也變大。', '食物、空間等資源決定承載量'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：能量傳遞', goal: '每往上一層只傳 10%。', intro: '上一層的能量 × 10% ＝ 下一層。', head: '下一層 ＝ 上一層 × 傳遞比例',
      rows: [
        { id: 'a', name: '生產者 5000 kJ，次級消費者', eq: '5000 × 10% × 10%', answer: 50, unit: 'kJ', hint: v => v === 500 ? '500 是初級消費者，還要再往上一層。' : '' },
        { id: 'b', name: '初級消費者 2000 kJ，次級消費者', eq: '2000 × 10%', answer: 200, unit: 'kJ' }],
      found: ['算對了！', '每往上一層 × 10%'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想能量塔和族群曲線。',
      found: ['你把生態系的能量與族群弄懂了！', '能量逐層減少；族群受承載量限制'] }
  ],
  quiz: [
    { q: '為什麼食物鏈頂端的狐狸數量通常比兔子少？', options: [
      { text: '因為狐狸生得比較少。', why: '主要原因是能量：你的證據顯示狐狸只拿到兔子能量的一小部分（1000 → 100 kJ）。' },
      { text: '因為能量每往上一層都減少很多。', ok: true },
      { text: '因為狐狸不需要能量。', why: '每個生物都需要能量。正因為往上傳的能量少，養得起的狐狸也少。' }] },
    { q: '兔子族群到了時間 30，數量大約停在？', options: [
      { text: '一直增加，沒有上限。', why: '你的證據：時間 30 時約 199 隻，接近承載量 200 就停下來了。' },
      { text: '承載量 200 附近。', ok: true },
      { text: '又回到 50 隻。', why: '族群沒有變少，而是穩定在承載量附近。' }] },
    { q: '其他條件不變，什麼會讓兔子族群最後穩定的數量變大？', options: [
      { text: '承載量變大（例如草原食物變多）。', ok: true },
      { text: '一開始放更多兔子。', why: '起始數量只影響多快到達，最後還是停在承載量附近。' },
      { text: '時間拉長。', why: '時間再長，族群也只會停在承載量附近。' }] }
  ],
  finish: { title: '你把生態系的能量與族群弄懂了！', rule: '能量沿食物鏈流動，每往上一層只剩一小部分，所以能量塔越上越小。族群數量會增加到接近承載量後穩定下來。', next: { label: '去細胞分裂實驗桌', href: '../cell-division/' } }
});
