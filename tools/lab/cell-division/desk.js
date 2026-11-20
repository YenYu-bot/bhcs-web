// 細胞分裂實驗桌：每個階段的細胞數、每個細胞的染色體數、DNA 相對量全部來自 scripts/science/models.mjs 的 calculate('cell-division')。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('cell-division', { type: s.type, n2: String(s.n2), stage: s.stage });
const TYPE = { mitosis: '有絲分裂', meiosis: '減數分裂' };
const SHORT = { mitosis: ['複製前', '複製後', '前期', '中期', '後期', '末期'], meiosis: ['複製前', '複製後', 'Ⅰ中期', 'Ⅰ結束', 'Ⅱ中期', 'Ⅱ結束'] };
const COL = [['#B0302A', '#EE8A80'], ['#24548A', '#7FB2E5'], ['#2E7A54', '#8CD0AE'], ['#7A4A9E', '#C9A6E4']];

// 一條染色體：未複製畫成一根，複製後畫成 X（兩條姊妹染色分體）
function chrom(el, parent, x, y, color, replicated, h = 34) {
  if (replicated) {
    el('path', { d: `M${x - 7} ${y - h / 2} L${x + 7} ${y + h / 2} M${x + 7} ${y - h / 2} L${x - 7} ${y + h / 2}`, stroke: color, 'stroke-width': 8, 'stroke-linecap': 'round' }, parent);
  } else el('line', { x1: x, y1: y - h / 2, x2: x, y2: y + h / 2, stroke: color, 'stroke-width': 8, 'stroke-linecap': 'round' }, parent);
}
function scene({ rig, el, txt, s, r }) {
  const pairs = s.n2 / 2, cells = r.cells, W = 860, cw = cells === 1 ? 420 : cells === 2 ? 340 : 200, gap = 16;
  const x0 = 70 + (W - cells * cw - (cells - 1) * gap) / 2;
  const meiosisI = s.type === 'meiosis' && s.stage >= 3, homologPaired = s.type === 'meiosis' && s.stage === 2;
  for (let c = 0; c < cells; c++) {
    const cx = x0 + c * (cw + gap) + cw / 2, cy = 305, rx = cw / 2 - 6, ry = cells === 4 ? 100 : 128;
    el('ellipse', { cx, cy, rx, ry, fill: 'rgba(255,240,220,.92)', stroke: '#C87533', 'stroke-width': 4 }, rig);
    // 這個細胞裡有哪些染色體：減數分裂第一次分裂後，每對只剩一條
    const list = [];
    for (let p = 0; p < pairs; p++) {
      if (meiosisI) list.push([p, (c + p) % 2]); else { list.push([p, 0]); list.push([p, 1]); }
    }
    if (s.type === 'mitosis' && s.stage === 4) {
      // 後期：姊妹染色分體分開，往兩極移動
      list.forEach(([p, h], i) => { const x = cx - (list.length - 1) * 16 + i * 32; chrom(el, rig, x, cy - 70, COL[p][h], false, 30); chrom(el, rig, x, cy + 70, COL[p][h], false, 30); });
      el('path', { d: `M${cx} ${cy - 30} v-24 M${cx} ${cy + 30} v24`, stroke: '#5A6478', 'stroke-width': 3, 'marker-end': 'url(#cd-a)' }, rig);
    } else {
      const lined = s.stage === 3 || (s.type === 'meiosis' && s.stage === 4) || homologPaired;
      list.forEach(([p, h], i) => {
        let x, y;
        if (homologPaired) { x = cx - (pairs - 1) * 40 + p * 80 + (h ? 14 : -14); y = cy; }
        else if (lined) { x = cx - (list.length - 1) * 18 + i * 36; y = cy; }
        else { const a = i * 2.4 + c; x = cx + Math.cos(a) * rx * .45; y = cy + Math.sin(a) * ry * .45; }
        chrom(el, rig, x, y, COL[p][h], r.replicated);
      });
    }
    txt(rig, cx, cy + ry + 26, `${r.perCell} 條`, { 'font-size': 16, fill: '#5A6478' });
  }
  const d = el('defs', {}, rig), mk = el('marker', { id: 'cd-a', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, d);
  el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#5A6478' }, mk);
  txt(rig, 500, 120, `${TYPE[s.type]}・${r.stageName}`, { 'font-size': 20 });
  // DNA 相對量折線
  const gx = 140, gy = 560, gw = 720;
  el('rect', { x: gx - 20, y: gy - 84, width: gw + 40, height: 106, rx: 14, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 2 }, rig);
  txt(rig, gx - 6, gy - 62, '每個細胞的 DNA 相對量', { 'text-anchor': 'start', 'font-size': 13, fill: '#5A6478' });
  const pts = r.dnaSeries.map((v, i) => [gx + i * gw / 5, gy - 6 - v * 12]);
  el('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: '#2F6FB0', 'stroke-width': 3 }, rig);
  pts.forEach(([x, y], i) => { el('circle', { cx: x, cy: y, r: i === s.stage ? 8 : 5, fill: i === s.stage ? '#C8372D' : '#2F6FB0' }, rig); txt(rig, x, gy + 14, SHORT[s.type][i], { 'font-size': 12, fill: '#5A6478' }); });
}

const tgt = (sig, label, type, stage, aim) => ({ sig, label, aim, set: { type, n2: 4, stage },
  title: (s, r) => `${TYPE[s.type]}・${SHORT[s.type][s.stage]}`, body: (s, r) => `${r.cells} 個細胞，每個 ${r.perCell} 條染色體${r.replicated ? '（已複製）' : ''}` });
const stages = type => ({ key: 'stage', label: '階段', type: 'seg', cols: 3, options: SHORT[type].map((t, i) => [i, t]) });

runDesk({
  key: 'bhcs.lab.cell-division.v1', title: '細胞分裂實驗桌', background: 'bg-chem-bench',
  sceneLabel: '細胞分裂實驗桌：畫面顯示每個階段有幾個細胞、細胞裡的染色體（同一對染色體用同一組顏色），下方是每個細胞 DNA 相對量的變化',
  initial: { type: 'mitosis', n2: 4, stage: 0 },
  model, scene, viewBox: { desk: '60 90 880 500', phone: '60 90 880 500' }, phoneText: 1.4,
  readouts: (s, r) => [['細胞數', r.cells, '個'], ['每個細胞的染色體', r.perCell, '條', `母細胞 2n ＝ ${s.n2}`], ['DNA 相對量', r.dna, '', r.replicated ? '已複製' : '']],
  why: { title: '有絲分裂與減數分裂', button: '分裂怎麼看', html: `
    <p class="fn-tip"><b>有絲分裂：</b>體細胞分裂、生長和修補用。DNA 先複製，分裂一次，得到 2 個和母細胞一模一樣的子細胞，染色體數不變（2n → 2n）。</p>
    <p class="fn-tip"><b>減數分裂：</b>產生精子或卵。DNA 複製一次，連續分裂兩次，得到 4 個細胞，染色體數減半（2n → n）。第一次分裂時同源染色體配對、分開。</p>
    <p class="fn-tip">圖中同一對同源染色體用同一個顏色的深、淺兩色；複製後的染色體畫成 X（兩條姊妹染色分體）。模型用 2n ＝ 4 示範；人類體細胞 2n ＝ 46。</p>` },
  steps: [
    { id: 'mitosis', label: '有絲分裂', title: '有絲分裂：染色體數會變嗎？', goal: '一步一步看有絲分裂。收下「複製後」「後期」「末期」三張，比較染色體和 DNA 的量。',
      intro: '這是 2n ＝ 4 的母細胞。按階段一步一步往下看！', enter: { type: 'mitosis', n2: 4, stage: 0 }, controls: [stages('mitosis')],
      react: (s, r) => `${r.stageName}：${r.cells} 個細胞，每個 ${r.perCell} 條。`,
      targets: [tgt('m1', '間期（複製後）', 'mitosis', 1, '選「複製後」。'), tgt('m4', '後期', 'mitosis', 4, '選「後期」。'), tgt('m5', '末期', 'mitosis', 5, '選「末期」。')],
      found: ['有絲分裂得到 2 個子細胞，染色體數和母細胞一樣（4 條）。', '複製一次、分裂一次：2n → 2n'] },
    { id: 'meiosis', label: '減數分裂', title: '減數分裂：為什麼染色體會減半？', goal: '換成減數分裂。收下「Ⅰ中期」「Ⅰ結束」「Ⅱ結束」三張，看同源染色體怎麼分開。',
      intro: '減數分裂要分裂兩次。注意第一次分裂時，同顏色的一對染色體排在一起！', enter: { type: 'meiosis', n2: 4, stage: 0 }, controls: [stages('meiosis')],
      react: (s, r) => `${r.stageName}：${r.cells} 個細胞，每個 ${r.perCell} 條。`,
      targets: [tgt('e2', 'Ⅰ中期（同源配對）', 'meiosis', 2, '選「Ⅰ中期」。'), tgt('e3', '第一次分裂結束', 'meiosis', 3, '選「Ⅰ結束」。'), tgt('e5', '第二次分裂結束', 'meiosis', 5, '選「Ⅱ結束」。')],
      found: ['減數分裂得到 4 個細胞，每個只有 2 條：染色體數減半。', '第一次分裂分開同源染色體（2n → n），第二次分開姊妹染色分體'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：人的染色體', goal: '人類體細胞有 46 條染色體（2n ＝ 46）。', intro: '有絲分裂數目不變；減數分裂減半。', head: '人類 2n ＝ 46',
      rows: [
        { id: 'skin', name: '皮膚細胞有絲分裂後，每個子細胞', eq: '有絲分裂：數目不變', answer: 46, unit: '條', hint: v => v === 23 ? '有絲分裂不會減半，那是減數分裂。' : '' },
        { id: 'sperm', name: '一個精子有幾條', eq: '減數分裂：46 ÷ 2', answer: 23, unit: '條' },
        { id: 'zyg', name: '精子和卵受精後的受精卵', eq: '23 ＋ 23', answer: 46, unit: '條' }],
      found: ['算對了！', '減數分裂讓精卵各帶 n，受精後回到 2n'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想兩種分裂的差別。',
      found: ['你把細胞分裂弄懂了！', '有絲分裂 2n → 2n；減數分裂 2n → n'] }
  ],
  quiz: [
    { q: '一個 2n ＝ 4 的細胞做有絲分裂，最後得到？', options: [
      { text: '4 個細胞，每個 2 條。', why: '那是減數分裂。你的證據：有絲分裂末期是 2 個細胞，每個 4 條。' },
      { text: '2 個細胞，每個 4 條。', ok: true },
      { text: '2 個細胞，每個 2 條。', why: '有絲分裂前 DNA 先複製，所以子細胞的染色體數和母細胞一樣。' }] },
    { q: '減數分裂時，同源染色體在什麼時候分開？', options: [
      { text: '第一次分裂。', ok: true },
      { text: '第二次分裂。', why: '第二次分裂分開的是姊妹染色分體。你的證據：Ⅰ中期同顏色的一對排在一起，Ⅰ結束時已分到兩個細胞。' },
      { text: '有絲分裂的後期。', why: '有絲分裂不會讓同源染色體分開到不同細胞。' }] },
    { q: '為什麼精子和卵要經過減數分裂？', options: [
      { text: '讓細胞長得比較大。', why: '減數分裂讓染色體數減半，和大小無關。' },
      { text: '受精後染色體數才能回到和親代一樣。', ok: true },
      { text: '讓精子游得比較快。', why: '重點是染色體數：n ＋ n ＝ 2n。' }] }
  ],
  finish: { title: '你把細胞分裂弄懂了！', rule: '有絲分裂：複製一次、分裂一次，得 2 個細胞，染色體數不變。減數分裂：複製一次、分裂兩次，得 4 個細胞，染色體數減半。', next: { label: '去血液循環實驗桌', href: '../circulation/' } }
});
