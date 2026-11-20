// 植物氣體交換實驗桌：光合作用、呼吸作用、淨氧氣交換與蒸散全部來自 scripts/science/models.mjs 的 calculate('plant-exchange')（相對值）。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('plant-exchange', { light: s.light, temperature: 25, humidity: s.humidity, stomata: s.stomata });
const f1 = x => String(Math.round(x * 10) / 10);
const NET = { release: '釋出氧氣', consume: '吸收氧氣', balanced: '收支平衡' };

function scene({ rig, el, txt, P, s, r }) {
  // 太陽亮度
  el('image', { href: P + 'prop-sun.webp', x: 110, y: 80, width: 130, height: 129, opacity: (.15 + .85 * s.light / 100).toFixed(2) }, rig);
  txt(rig, 175, 232, `光照 ${s.light}%`, { 'font-size': 16 });
  // 葉片
  el('path', { d: 'M300 330 C380 180 640 170 760 320 C640 460 400 470 300 330 Z', fill: '#7CC47A', stroke: '#2E6B3A', 'stroke-width': 5 }, rig);
  el('path', { d: 'M300 330 C460 320 600 318 760 320', fill: 'none', stroke: '#2E6B3A', 'stroke-width': 4 }, rig);
  // 氣孔（葉背）：開度用缺口大小表示
  const open = 4 + 16 * s.stomata / 100;
  for (const x of [400, 470, 540, 610, 680]) { el('ellipse', { cx: x, cy: 420, rx: 18, ry: 10, fill: '#3F8E45', stroke: '#2E6B3A', 'stroke-width': 2 }, rig); el('ellipse', { cx: x, cy: 420, rx: open / 2, ry: 4, fill: '#23304A' }, rig); }
  txt(rig, 540, 456, `葉背的氣孔：開度 ${s.stomata}%`, { 'font-size': 15, fill: '#2E6B3A' });
  // 箭頭：氧氣、二氧化碳、水蒸氣
  const d = el('defs', {}, rig);
  for (const [k, c] of [['o', '#2F6FB0'], ['c', '#5A6478'], ['w', '#5EA9D6']]) { const m = el('marker', { id: 'pe-' + k, viewBox: '0 0 10 10', refX: 7, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: c }, m); }
  const arrow = (x1, y1, x2, y2, k, w, label, col) => { if (w < .5) return; el('path', { d: `M${x1} ${y1} L${x2} ${y2}`, stroke: col, 'stroke-width': Math.min(16, 3 + w), 'marker-end': `url(#pe-${k})`, 'stroke-linecap': 'round' }, rig); txt(rig, x2 + (x2 > x1 ? 10 : -10), y2 + 5, label, { 'text-anchor': x2 > x1 ? 'start' : 'end', 'font-size': 15, fill: col }); };
  const n = Math.abs(r.net);
  if (r.kind === 'release') { arrow(760, 260, 860, 200, 'o', n, `O₂ 出 ${f1(n)}`, '#2F6FB0'); arrow(860, 360, 770, 330, 'c', n, `CO₂ 進`, '#5A6478'); }
  else if (r.kind === 'consume') { arrow(860, 200, 770, 255, 'o', n * 2, `O₂ 進 ${f1(n)}`, '#2F6FB0'); arrow(770, 330, 860, 380, 'c', n * 2, 'CO₂ 出', '#5A6478'); }
  else txt(rig, 860, 300, '氧氣進出平衡', { 'font-size': 15, fill: '#2F6FB0' });
  arrow(560, 470, 560, 540, 'w', r.transpiration * 14, `水蒸氣 ${f1(r.transpiration * 10)}`, '#5EA9D6');
  // 帳本
  el('rect', { x: 120, y: 470, width: 330, height: 96, rx: 14, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 2 }, rig);
  txt(rig, 140, 500, `光合作用 ${f1(r.photo)}　呼吸作用 ${f1(r.respiration)}`, { 'text-anchor': 'start', 'font-size': 15 });
  txt(rig, 140, 530, `淨氧氣交換 ＝ ${f1(r.photo)} − ${f1(r.respiration)} ＝ ${f1(r.net)}`, { 'text-anchor': 'start', 'font-size': 15, fill: '#2F6FB0' });
  txt(rig, 140, 556, `（${NET[r.kind]}）`, { 'text-anchor': 'start', 'font-size': 14, fill: '#5A6478' });
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: s => `光照 ${s.light}%・氣孔 ${s.stomata}%・濕度 ${s.humidity}%`,
  body: (s, r) => sig.startsWith('h') || sig.startsWith('s') ? `光合 ${f1(r.photo)}、蒸散 ${f1(r.transpiration * 10)}` : `光合 ${f1(r.photo)} − 呼吸 ${f1(r.respiration)} ＝ ${f1(r.net)}（${NET[r.kind]}）` });
const BASE = { light: 90, stomata: 100, humidity: 50 };

runDesk({
  key: 'bhcs.lab.plant-exchange.v1', title: '植物氣體交換實驗桌', background: 'bg-physics-bench',
  sceneLabel: '植物氣體交換實驗桌：太陽照著一片葉子，葉背有氣孔；箭頭表示氧氣、二氧化碳和水蒸氣進出葉子的方向與多少',
  initial: { ...BASE },
  model, scene, viewBox: { desk: '90 60 860 520', phone: '90 60 860 520' }, phoneText: 1.4,
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
