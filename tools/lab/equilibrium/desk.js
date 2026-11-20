// 化學平衡實驗桌：A ⇌ B 的平衡量、方向與速率全部來自 scripts/science/models.mjs 的 calculate('equilibrium')。
// 生活化例子：A ＝ N₂O₄（無色）、B ＝ NO₂（紅棕色），升溫 B 變多、顏色變深；本模型的 K 是教學值（低溫 0.5、室溫 2、高溫 4）。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('equilibrium', { temp: s.temp, a0: s.a0, b0: s.b0, add: s.add });
const f2 = x => String(Math.round(x * 100) / 100);
const TEMP = { low: '低溫', mid: '室溫', high: '高溫' };
const DIR = { right: '向右（A → B）', left: '向左（B → A）', none: '已在平衡' };

function scene({ rig, el, txt, s, r }) {
  // 密閉燒瓶：B 越多顏色越深（紅棕色）
  const cx = 330, cy = 330, frac = r.frac;
  const col = `rgba(${Math.round(244 - 60 * frac)},${Math.round(238 - 150 * frac)},${Math.round(228 - 180 * frac)},.95)`;
  el('path', { d: `M${cx - 40} 140 h80 v90 L${cx + 170} 470 q10 30 -24 30 H${cx - 146} q-34 0 -24 -30 L${cx - 40} 230 Z`, fill: col, stroke: '#23304A', 'stroke-width': 5, 'stroke-linejoin': 'round' }, rig);
  el('rect', { x: cx - 50, y: 120, width: 100, height: 26, rx: 8, fill: '#8A6A3C', stroke: '#23304A', 'stroke-width': 4 }, rig);
  // 粒子：A 淡黃圓、B 紅棕雙圓；共 30 顆依比例
  const nB = Math.round(30 * frac), pts = [];
  for (let i = 0; i < 30; i++) { const a = i * 2.39996, d = Math.sqrt((i + .5) / 30); pts.push([cx + Math.cos(a) * d * 105, 420 + Math.sin(a) * d * 58]); }
  pts.forEach(([x, y], i) => {
    if (i < nB) { el('circle', { cx: x - 6, cy: y, r: 9, fill: '#9A4A2A', stroke: '#23304A', 'stroke-width': 1.5 }, rig); el('circle', { cx: x + 6, cy: y, r: 9, fill: '#9A4A2A', stroke: '#23304A', 'stroke-width': 1.5 }, rig); }
    else el('circle', { cx: x, cy: y, r: 10, fill: '#F4C04E', stroke: '#23304A', 'stroke-width': 1.5 }, rig);
  });
  txt(rig, cx, 540, `密閉燒瓶・${TEMP[s.temp]}（K ＝ ${r.K}）`, { 'font-size': 18 });
  // 右邊：正逆反應速率與數量
  const x = 600, y = 140;
  el('rect', { x, y, width: 320, height: 330, rx: 18, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, x + 160, y + 40, 'A  ⇌  B', { 'font-size': 26, 'font-weight': 900 });
  el('circle', { cx: x + 108, cy: y + 31, r: 9, fill: '#F4C04E', stroke: '#23304A' }, rig);
  el('circle', { cx: x + 214, cy: y + 31, r: 7, fill: '#9A4A2A' }, rig); el('circle', { cx: x + 226, cy: y + 31, r: 7, fill: '#9A4A2A' }, rig);
  const bar = (yy, label, v, col2) => { txt(rig, x + 20, yy + 18, label, { 'text-anchor': 'start', 'font-size': 16, fill: '#5A6478' }); el('rect', { x: x + 90, y: yy, width: 200, height: 26, rx: 6, fill: '#F2EBDD' }, rig); el('rect', { x: x + 90, y: yy, width: Math.max(0, 200 * v / Math.max(r.T, 1)), height: 26, rx: 6, fill: col2 }, rig); txt(rig, x + 300, yy + 19, f2(v), { 'text-anchor': 'end', 'font-size': 15, 'font-weight': 900 }); };
  bar(y + 80, 'A 的量', r.A, '#F4C04E'); bar(y + 124, 'B 的量', r.B, '#9A4A2A');
  txt(rig, x + 160, y + 200, `正反應速率 ＝ 逆反應速率`, { 'font-size': 16 });
  el('path', { d: `M${x + 70} ${y + 228} h180`, stroke: '#2E8B66', 'stroke-width': 5, 'marker-end': 'url(#eq-a)' }, rig);
  el('path', { d: `M${x + 250} ${y + 252} h-180`, stroke: '#2E8B66', 'stroke-width': 5, 'marker-end': 'url(#eq-a)' }, rig);
  const d = el('defs', {}, rig), mk = el('marker', { id: 'eq-a', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, d);
  el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#2E8B66' }, mk);
  txt(rig, x + 160, y + 290, `都是 ${f2(r.rate)}（相對值），反應沒有停`, { 'font-size': 14, fill: '#5A6478' });
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: s => `${TEMP[s.temp]}・起始 A ${s.a0}、B ${s.b0}${s.add ? `・再加 A ${s.add}` : ''}`,
  body: (s, r) => `平衡時 A ${f2(r.A)}、B ${f2(r.B)}${s.add ? '' : `；${DIR[r.initialDir]}`}` });

runDesk({
  key: 'bhcs.lab.equilibrium.v1', title: '化學平衡實驗桌', background: 'bg-chem-bench',
  sceneLabel: '化學平衡實驗桌：密閉燒瓶裡的 A 粒子（黃）和 B 粒子（紅棕）互相轉換，B 越多顏色越深；右邊比較兩者的量與正逆反應速率',
  initial: { temp: 'mid', a0: 10, b0: 0, add: 0 },
  model, scene, viewBox: { desk: '120 100 820 470', phone: '130 100 800 470' }, phoneText: 1.4,
  readouts: (s, r) => [['A 的量', f2(r.A), '', '平衡時'], ['B 的量', f2(r.B), '', '平衡時'], ['B 的比例', String(Math.round(r.frac * 100)), '%', '顏色深淺']],
  why: { title: '可逆反應與化學平衡', button: '平衡是什麼', html: `
    <p class="fn-tip"><b>可逆反應：</b>A 變成 B（正反應）的同時，B 也變回 A（逆反應）。</p>
    <p class="fn-tip"><b>化學平衡：</b>正、逆反應速率相等時，A 和 B 的量不再改變，但反應沒有停止，是「動態平衡」。平衡時兩邊不一定一樣多。</p>
    <p class="fn-tip"><b>平衡會移動：</b>改變溫度，平衡的位置會變；加入反應物，平衡往消耗它的方向移動，但加入的量只有一部分轉變。</p>
    <p class="fn-tip">生活例子：密閉管中的四氧化二氮（N₂O₄，無色）⇌ 二氧化氮（NO₂，紅棕色）。放進熱水顏色變深（NO₂ 變多），放進冰水顏色變淺。模型說明：A ⇌ B 的平衡常數 K 是教學值（低溫 0.5、室溫 2、高溫 4），數量是相對單位。</p>` },
  steps: [
    { id: 'reach', label: '達到平衡', title: '從 A 開始或從 B 開始，結果一樣嗎？', goal: '室溫下，比較「只放 10 份 A」和「只放 10 份 B」最後的平衡，各收一張。',
      intro: '燒瓶裡先只有 A。等它達到平衡，A 和 B 各剩多少？', enter: { temp: 'mid', a0: 10, b0: 0, add: 0 },
      controls: [{ key: 'a0', label: '一開始放的 A', type: 'seg', options: [[10, '10 份'], [0, '0']], cols: 2 }, { key: 'b0', label: '一開始放的 B', type: 'seg', options: [[0, '0'], [10, '10 份']], cols: 2 }],
      react: (s, r) => r.kind === 'empty' ? '燒瓶是空的，沒有反應。' : `平衡時 A ${f2(r.A)}、B ${f2(r.B)}。`,
      targets: [tgt('fa', '只放 A', { temp: 'mid', a0: 10, b0: 0, add: 0 }, '選 A 10 份、B 0。'), tgt('fb', '只放 B', { temp: 'mid', a0: 0, b0: 10, add: 0 }, '換成 A 0、B 10 份。')],
      found: ['不管從哪一邊開始，最後都到同一個平衡：A 3.33、B 6.67。', '平衡時兩邊不一樣多，正逆反應速率相等'] },
    { id: 'temp', label: '改溫度', title: '溫度改變，平衡會移動嗎？', goal: '同樣只放 10 份 A，比較低溫和高溫的平衡顏色，各收一張。',
      intro: '把燒瓶放進冰水，再放進熱水。顏色會變嗎？', enter: { temp: 'low', a0: 10, b0: 0, add: 0 },
      controls: [{ key: 'temp', label: '溫度', type: 'seg', options: [['low', '低溫（冰水）'], ['mid', '室溫'], ['high', '高溫（熱水）']] }],
      react: (s, r) => `${TEMP[s.temp]}：B 佔 ${Math.round(r.frac * 100)}%。`,
      targets: [tgt('lo', '低溫', { temp: 'low', a0: 10, b0: 0, add: 0 }, '選低溫。'), tgt('hi', '高溫', { temp: 'high', a0: 10, b0: 0, add: 0 }, '選高溫。')],
      found: ['溫度改變，平衡位置跟著改變：這個例子低溫 A 多、高溫 B 多，顏色變深。', '低溫 B 佔 33%，高溫 B 佔 80%；總量不變'] },
    { id: 'add', label: '加反應物', title: '平衡後再加 A，會怎樣？', goal: '室溫、10 份 A 達到平衡後，比較「不加」和「再加 6 份 A」，各收一張。',
      intro: '已經平衡了。再加 6 份 A，加進去的 A 會全部變成 B 嗎？', enter: { temp: 'mid', a0: 10, b0: 0, add: 0 },
      controls: [{ key: 'add', label: '平衡後再加 A', type: 'seg', options: [[0, '不加'], [6, '加 6 份']], cols: 2 }],
      react: (s, r) => s.add ? `平衡向右移：A ${f2(r.A1)} → ${f2(r.A)}，B ${f2(r.B1)} → ${f2(r.B)}。` : `平衡時 A ${f2(r.A)}、B ${f2(r.B)}。`,
      targets: [tgt('n0', '不加', { temp: 'mid', a0: 10, b0: 0, add: 0 }, '先看不加的情況。'), tgt('n6', '再加 6 份 A', { temp: 'mid', a0: 10, b0: 0, add: 6 }, '選「加 6 份」。')],
      found: ['加 A 後平衡向右移，B 變多；但 6 份 A 只有 4 份變成 B。', 'A：3.33 → 5.33，B：6.67 → 10.67'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想燒瓶裡發生的事。',
      found: ['你把化學平衡弄懂了！', '動態平衡：正逆反應速率相等，反應沒有停'] }
  ],
  quiz: [
    { q: '化學平衡時，下面哪一句正確？', options: [
      { text: '反應停止了。', why: '平衡是動態的：正、逆反應還在進行，只是速率相等，所以量不變。' },
      { text: '正、逆反應速率相等，A 和 B 的量不再改變。', ok: true },
      { text: 'A 和 B 一定一樣多。', why: '你的證據：平衡時 A 3.33、B 6.67，不一樣多。' }] },
    { q: '只放 A 或只放 B（總量一樣、溫度一樣），達到平衡時？', options: [
      { text: '從 A 開始，A 會比較多。', why: '你的證據：兩種起點最後都是 A 3.33、B 6.67。' },
      { text: '會到達同一個平衡。', ok: true },
      { text: '從 B 開始不會反應。', why: 'B 也會變回 A（逆反應），一樣會達到平衡。' }] },
    { q: '平衡後再加入 A，結果是？', options: [
      { text: '加進去的 A 全部變成 B。', why: '你的證據：加 6 份 A，只有 4 份變成 B，A 還是比原來多。' },
      { text: '平衡向右移，B 變多，A 也比原來多。', ok: true },
      { text: '平衡不會改變。', why: '加入反應物，平衡會往消耗它的方向移動。' }] }
  ],
  finish: { title: '你把化學平衡弄懂了！', rule: '可逆反應達到平衡時，正逆反應速率相等，量不再改變但反應沒有停。改變溫度或加入反應物，平衡會移動。', next: { label: '去電池與電解實驗桌', href: '../electrolysis/' } }
});
