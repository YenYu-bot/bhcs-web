// 光合作用實驗桌：氣泡數來自 ./model.mjs（示意數值）。
import { photo } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';
import { plantDefs, elodea } from '../shared/plants.mjs';

const LIGHT = { 1: '弱', 2: '中', 3: '強' }, CO2N = { low: '低', high: '高' }, LIMIT = { light: '光照不夠', co2: '二氧化碳不夠', both: '兩者剛好' };
const INK = '#23304A', LAMP = { 1: 190, 2: 280, 3: 370 }, KNOB = { 10: -60, 25: 0, 40: 60 };
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('linearGradient', 'ps-glass', [[0, '#CFE3F2', .55], [.12, '#FFFFFF', .7], [.3, '#E8F3FB', .18], [.8, '#E8F3FB', .14], [.92, '#FFFFFF', .55], [1, '#B7D2E6', .6]]);
  g('linearGradient', 'ps-water', [[0, '#9ED2EC', .7], [1, '#6FB3D8', .78]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'ps-shade', [[0, '#F2C230'], [.5, '#F7D564'], [1, '#C89416']]);
  g('radialGradient', 'ps-bulb', [[0, '#FFFFFF'], [.5, '#FFF4B8'], [1, '#FFD84A']]);
  g('linearGradient', 'ps-metal', [[0, '#55627E'], [.5, '#9AA7C0'], [1, '#2B3550']]);
  g('linearGradient', 'ps-body', [[0, '#FBF7EE'], [1, '#D8CFBD']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('radialGradient', 'ps-knob', [[0, '#F7FAFD'], [.6, '#AEB8C8'], [1, '#5F6A7E']], { cx: .35, cy: .3, r: .8 });
  const f = el('filter', { id: 'ps-glow', x: '-40%', y: '-40%', width: '180%', height: '180%' }, d); el('feGaussianBlur', { stdDeviation: 8 }, f);
}
function lamp(el, g, x, light) {
  el('ellipse', { cx: x - 10, cy: 532, rx: 44, ry: 8, fill: '#000', opacity: .18 }, g);
  el('rect', { x: x - 48, y: 514, width: 76, height: 16, rx: 6, fill: 'url(#ps-metal)', stroke: INK, 'stroke-width': 2 }, g);
  el('path', { d: `M${x - 10} 514L${x - 34} 380L${x + 6} 262`, fill: 'none', stroke: INK, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
  el('path', { d: `M${x - 10} 514L${x - 34} 380L${x + 6} 262`, fill: 'none', stroke: '#9AA7C0', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
  el('circle', { cx: x - 34, cy: 380, r: 7, fill: 'url(#ps-metal)', stroke: INK, 'stroke-width': 2 }, g);
  const head = el('g', { transform: `rotate(12 ${x + 6} 262)` }, g);
  el('circle', { cx: x + 40, cy: 262, r: 20, fill: 'url(#ps-bulb)' }, head);
  el('path', { d: `M${x + 4} 240L${x + 18} 238L${x + 66} 224V300L${x + 18} 286L${x + 4} 284Z`, fill: 'url(#ps-shade)', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, head);
  el('circle', { cx: x + 6, cy: 262, r: 8, fill: 'url(#ps-metal)', stroke: INK, 'stroke-width': 2 }, g);
  return head;
}

function scene({ rig, el, txt, s, r, step, set, drag, hint, kind, reduce }) {
  defs(el, rig); plantDefs(el, rig);
  const can = kind === 'observe', BX = 500, BW = 210, top = 230, bot = 470;
  // 光束
  const lx = LAMP[s.light]; el('path', { d: `M${lx + 60} 244L${BX + 10} 236L${BX + 10} 450L${lx + 64} 300Z`, fill: '#FFE58A', opacity: .12 + s.light * .1, filter: 'url(#ps-glow)' }, rig);
  // 恆溫加熱板與旋鈕
  el('rect', { x: BX - 20, y: bot, width: BW + 40, height: 68, rx: 10, fill: 'url(#ps-body)', stroke: INK, 'stroke-width': 2.5 }, rig);
  const kx = BX + 34, ky = bot + 42, knob = el('g', { 'data-drag': can && step === 'temp' ? 'knob' : null }, rig);
  el('circle', { cx: kx, cy: ky, r: 18, fill: 'url(#ps-knob)', stroke: INK, 'stroke-width': 2 }, knob);
  const tick = el('path', { d: `M${kx} ${ky}v-14`, stroke: '#C8372D', 'stroke-width': 4, 'stroke-linecap': 'round', transform: `rotate(${KNOB[s.temp]} ${kx} ${ky})` }, knob);
  el('circle', { cx: kx, cy: ky, r: 30, fill: 'transparent' }, knob);
  for (const [t, a] of Object.entries(KNOB)) { const rad = a * Math.PI / 180; txt(rig, kx + 30 * Math.sin(rad), ky - 24 * Math.cos(rad) + (a ? 6 : 0), `${t}°`, { 'font-size': 10, fill: '#5A6478' }); }
  el('circle', { cx: BX + 196, cy: ky, r: 6, fill: s.temp === 40 ? '#FF5A3C' : s.temp === 10 ? '#5AA8FF' : '#7CF29B', stroke: INK, 'stroke-width': 1.5 }, rig);
  if (can && step === 'temp') drag(knob, () => { let a = KNOB[s.temp]; return { move(p) { a = Math.max(-75, Math.min(75, Math.atan2(p.x - kx, ky - p.y) * 180 / Math.PI)); tick.setAttribute('transform', `rotate(${a} ${kx} ${ky})`); },
    end() { const t = +Object.entries(KNOB).reduce((m, e) => Math.abs(e[1] - a) < Math.abs(m[1] - a) ? e : m)[0]; if (t !== s.temp) set({ temp: t }); else tick.setAttribute('transform', `rotate(${KNOB[s.temp]} ${kx} ${ky})`); }, cancel() { tick.setAttribute('transform', `rotate(${KNOB[s.temp]} ${kx} ${ky})`); } }; },
    { label: '調水溫', tap: () => set({ temp: { 10: 25, 25: 40, 40: 10 }[s.temp] }) });
  // 燒杯、水、水蘊草、倒置試管
  const x0 = BX, wl = top + 30;
  el('path', { d: `M${x0 + 8} ${wl}Q${x0 + BW / 2} ${wl + 5} ${x0 + BW - 8} ${wl}V${bot - 8}H${x0 + 8}Z`, fill: s.co2 === 'high' ? 'url(#ps-water)' : '#BEDFF0', opacity: .9 }, rig);
  for (const [i, dx, hh, lean, dep] of [[0, 42, 146, 14, .75], [1, 170, 156, -16, .65], [2, 74, 172, -8, .3], [3, 138, 166, 10, .2], [4, 106, 138, -4, 0]]) elodea(el, rig, { x: x0 + dx, y: bot - 10, h: hh, lean, seed: i * 5 + 3, depth: dep, branchDir: dx < BW / 2 ? 1 : -1 });
  el('ellipse', { cx: x0 + BW / 2, cy: bot - 10, rx: BW / 2 - 14, ry: 6, fill: '#B8A27A', opacity: .55 }, rig);
  const tx = x0 + BW / 2, gas = Math.min(64, 8 + r.rate * 1.3);
  el('path', { d: `M${tx - 20} ${top - 10}V${top + 120}M${tx + 20} ${top - 10}V${top + 120}`, stroke: '#6E97BB', 'stroke-width': 2 }, rig);
  el('path', { d: `M${tx - 20} ${top - 10}A20 20 0 0 1 ${tx + 20} ${top - 10}V${top - 10 + gas}H${tx - 20}Z`, fill: '#F6FBFF', opacity: .9 }, rig);
  el('path', { d: `M${tx - 20} ${top + 120}V${top - 10}A20 20 0 0 1 ${tx + 20} ${top - 10}V${top + 120}`, fill: 'url(#ps-glass)', stroke: '#6E97BB', 'stroke-width': 2 }, rig);
  txt(rig, tx + 76, top - 22, '收集到的氧氣', { 'font-size': 12, fill: '#5A6478' }); el('path', { d: `M${tx + 22} ${top - 4}L${tx + 40} ${top - 18}`, stroke: '#5A6478', 'stroke-width': 1.5 }, rig);
  // 氣泡：越快越多
  const n = Math.round(r.rate / 5);
  for (let i = 0; i < n; i++) { const bx = tx - 14 + rnd(i, 3) * 28, by = top + 110 - rnd(i, 4) * 100, rr = 2.5 + rnd(i, 5) * 2.5;
    const c = el('circle', { cx: bx, cy: by, r: rr, fill: 'rgba(255,255,255,.6)', stroke: '#fff', 'stroke-width': 1.2 }, rig);
    if (!reduce) el('animate', { attributeName: 'cy', values: `${top + 120};${top + gas - 6}`, dur: `${(16 / Math.max(5, r.rate) * (1 + rnd(i, 6))).toFixed(2)}s`, begin: `-${(rnd(i, 7) * 2).toFixed(2)}s`, repeatCount: 'indefinite' }, c); }
  el('path', { d: `M${x0 - 6} ${top}H${x0 + BW + 4}l8 -8M${x0} ${top}V${bot - 10}Q${x0} ${bot} ${x0 + 10} ${bot}H${x0 + BW - 10}Q${x0 + BW} ${bot} ${x0 + BW} ${bot - 10}V${top}`, fill: 'url(#ps-glass)', stroke: '#6E97BB', 'stroke-width': 2.5 }, rig);
  txt(rig, BX + BW / 2, bot + 90, `${s.temp}°C 的水（二氧化碳：${CO2N[s.co2]}）`, { 'font-size': 14 });
  // 小蘇打：拖進燒杯加二氧化碳；點一下換回清水
  if (step === 'co2') { const jar = el('g', { 'data-drag': can ? 'soda' : null }, rig), jx = 438, jy = 470;
    el('rect', { x: jx - 26, y: jy - 30, width: 52, height: 56, rx: 8, fill: '#F4F7FA', stroke: INK, 'stroke-width': 2 }, jar); el('rect', { x: jx - 28, y: jy - 38, width: 56, height: 12, rx: 4, fill: '#C8372D', stroke: INK, 'stroke-width': 2 }, jar);
    el('rect', { x: jx - 20, y: jy - 12, width: 40, height: 18, rx: 3, fill: '#FFF8EC' }, jar); txt(jar, jx, jy + 2, '小蘇打', { 'font-size': 10 });
    el('path', { d: `M${jx + 10} ${jy - 40}l28 -36`, stroke: '#9AA7C0', 'stroke-width': 4, 'stroke-linecap': 'round' }, jar); el('ellipse', { cx: jx + 42, cy: jy - 80, rx: 9, ry: 6, fill: '#F4F7FA', stroke: INK, 'stroke-width': 1.5 }, jar);
    txt(rig, jx, jy + 46, s.co2 === 'high' ? '點一下換清水' : '拖進燒杯', { 'font-size': 11, fill: '#1F6E50' });
    if (can) drag(jar, () => ({ move(p, p0) { jar.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`); }, end(p) { jar.removeAttribute('transform'); if (p.x > BX && p.x < BX + BW && p.y > top - 40 && p.y < bot && s.co2 !== 'high') set({ co2: 'high' }); }, cancel() { jar.removeAttribute('transform'); } }),
      { label: s.co2 === 'high' ? '換成沒加小蘇打的清水' : '加小蘇打', tap: () => set({ co2: s.co2 === 'high' ? 'low' : 'high' }) }); }
  // 檯燈：拖近就變亮
  const lg = el('g', { 'data-drag': can && step !== 'temp' ? 'lamp' : null }, rig); lamp(el, lg, lx, s.light);
  el('rect', { x: lx - 50, y: 220, width: 130, height: 316, fill: 'transparent' }, lg);
  txt(rig, lx + 20, 214, `光照：${LIGHT[s.light]}`, { 'font-size': 15 });
  if (can && step !== 'temp') drag(lg, () => { let x = lx; return { move(p, p0) { x = Math.max(LAMP[1], Math.min(LAMP[3], lx + p.x - p0.x)); lg.setAttribute('transform', `translate(${x - lx} 0)`); },
    end() { const v = +Object.entries(LAMP).reduce((m, e) => Math.abs(e[1] - x) < Math.abs(m[1] - x) ? e : m)[0]; lg.removeAttribute('transform'); if (v !== s.light) set({ light: v }); }, cancel() { lg.removeAttribute('transform'); } }; },
    { label: '移動檯燈', tap: () => set({ light: s.light % 3 + 1 }) });
  // 速率條
  el('rect', { x: 800, y: 200, width: 60, height: 290, rx: 10, fill: '#fff', stroke: INK, 'stroke-width': 3 }, rig);
  const h = 280 * r.rate / 40; el('rect', { x: 805, y: 485 - h, width: 50, height: h, rx: 6, fill: '#2E8B66' }, rig);
  txt(rig, 830, 186, '每分鐘氣泡數', { 'font-size': 14, fill: '#5A6478' }); txt(rig, 830, 520, `${r.rate} 個`, { 'font-size': 20, fill: '#2E8B66' });
  hint(500, 584, step === 'temp' ? '轉加熱板的旋鈕調水溫' : step === 'co2' ? '拖檯燈、把小蘇打拖進燒杯' : '把檯燈拖近一點');
}
const tgt = (sig, label, set, aim) => ({ sig, label, set, aim, title: s => `光照${LIGHT[s.light]}、二氧化碳${CO2N[s.co2]}、${s.temp}°C`, body: (s, r) => `每分鐘 ${r.rate} 個氣泡` });
const lightCtl = { key: 'light', label: '光照', type: 'seg', options: [[1, '弱'], [2, '中'], [3, '強']] };

runDesk({
  key: 'bhcs.lab.photosynthesis.v1', title: '光合作用實驗桌', background: 'bg-chem-bench',
  sceneLabel: '光合作用實驗桌：檯燈照著燒杯裡的水蘊草，倒置的試管收集冒出的氧氣泡；可以拖檯燈、把小蘇打拖進燒杯、轉旋鈕調水溫，右邊的長條顯示每分鐘的氣泡數',
  initial: { light: 1, co2: 'high', temp: 25 },
  model: photo, scene, viewBox: { desk: '110 150 800 455', phone: '110 150 800 455' }, phoneText: 1.4,
  readouts: (s, r) => [['每分鐘氣泡數', String(r.rate), '個', '氣泡是氧氣'], ['限制的因素', r.tempFactor < 1 ? '溫度不適合' : LIMIT[r.limit], '', ''], ['溫度', String(s.temp), '°C', s.temp === 25 ? '適合' : s.temp < 25 ? '太低' : '太高']],
  why: { title: '光合作用', button: '光合作用是什麼', html: `
    <p class="fn-tip"><b>二氧化碳 ＋ 水 —（光、葉綠體）→ 葡萄糖 ＋ 氧氣。</b>水蘊草冒出的氣泡就是氧氣，氣泡越多表示光合作用越快。</p>
    <p class="fn-tip"><b>限制因素：</b>光、二氧化碳、溫度都會影響速率。最不足的那一項決定快慢；其他條件再好也沒用。</p>
    <p class="fn-tip"><b>溫度：</b>光合作用需要酵素，太冷或太熱酵素的作用都會變差。</p>
    <p class="fn-tip">氣泡數是示意的模型數值，用來比較大小；真的實驗要重複幾次取平均。</p>` },
  steps: [
    { id: 'light', label: '光照', title: '光越強，氣泡越多嗎？', goal: '二氧化碳充足、25°C。比較光照弱和強，各收一張。',
      intro: '把檯燈調亮，看氣泡數。', enter: { light: 1, co2: 'high', temp: 25 }, controls: [lightCtl],
      react: (s, r) => `每分鐘 ${r.rate} 個氣泡。`,
      targets: [tgt('l1', '光照弱', { light: 1, co2: 'high', temp: 25 }, '看光照弱。'), tgt('l3', '光照強', { light: 3, co2: 'high', temp: 25 }, '把光照調到強。')],
      found: ['二氧化碳充足時，光越強，光合作用越快。', '弱 10 個 → 強 30 個'] },
    { id: 'co2', label: '二氧化碳', title: '二氧化碳不夠時，光再強有用嗎？', goal: '收下三種：二氧化碳低配光照中、二氧化碳低配光照強、二氧化碳高配光照強。',
      intro: '現在二氧化碳很少。把光調強，氣泡會變多嗎？', enter: { light: 2, co2: 'low', temp: 25 }, controls: [lightCtl, { key: 'co2', label: '二氧化碳', type: 'seg', options: [['low', '低'], ['high', '高']] }],
      react: (s, r) => `每分鐘 ${r.rate} 個；${LIMIT[r.limit]}。`,
      targets: [tgt('a', '二氧化碳低、光照中', { light: 2, co2: 'low', temp: 25 }, '二氧化碳低、光照中。'), tgt('b', '二氧化碳低、光照強', { light: 3, co2: 'low', temp: 25 }, '二氧化碳低、光照強。'), tgt('c', '二氧化碳高、光照強', { light: 3, co2: 'high', temp: 25 }, '二氧化碳高、光照強。')],
      found: ['二氧化碳不夠時，光再強氣泡也不會變多；補足二氧化碳後才增加。', '最不足的因素決定速率'] },
    { id: 'temp', label: '溫度', title: '水溫太低或太高會怎樣？', goal: '光照強、二氧化碳高。收下 10°C、25°C、40°C 三種水溫的結果。',
      intro: '光和二氧化碳都夠了。換水溫看看。', enter: { light: 3, co2: 'high', temp: 25 }, controls: [{ key: 'temp', label: '水溫', type: 'seg', options: [[10, '10°C'], [25, '25°C'], [40, '40°C']] }],
      react: (s, r) => `${s.temp}°C：每分鐘 ${r.rate} 個。`,
      targets: [10, 25, 40].map(t => tgt('t' + t, `${t}°C`, { light: 3, co2: 'high', temp: t }, `試 ${t}°C。`)),
      found: ['溫度太低或太高，光合作用都變慢；適合的溫度最快。', '10°C 15 個、25°C 30 個、40°C 15 個'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想哪個條件「卡住」了速率。',
      found: ['你把光合作用的條件弄懂了！', '光、二氧化碳、溫度，最不足的決定快慢'] }
  ],
  quiz: [
    { q: '水蘊草在光照下冒出的氣泡主要是？', options: [
      { text: '二氧化碳。', why: '二氧化碳是光合作用的原料，會被吸收。冒出來的是產物。' },
      { text: '氧氣。', ok: true },
      { text: '水蒸氣。', why: '水沒有沸騰。氣泡是光合作用產生的氧氣。' }] },
    { q: '溫室裡光線已經很充足，農夫想讓作物長得更快，哪個做法比較可能有效？', options: [
      { text: '再加更多燈。', why: '光已經夠了。你的證據：二氧化碳不足時，光從中調到強，氣泡數沒有增加。' },
      { text: '補充二氧化碳。', ok: true },
      { text: '把溫度降到 10°C。', why: '溫度太低，光合作用會變慢。' }] },
    { q: '為什麼 40°C 時氣泡比 25°C 少？', options: [
      { text: '水太熱，光照不進去。', why: '光照沒有變。是溫度影響了酵素。' },
      { text: '溫度太高，酵素的作用變差。', ok: true },
      { text: '二氧化碳被用完了。', why: '二氧化碳的量沒有改變。' }] }
  ],
  finish: { title: '你把光合作用的條件弄懂了！', rule: '光合作用用光把二氧化碳和水變成葡萄糖和氧氣。光照、二氧化碳、溫度都會影響速率，最不足的那一項決定快慢。', next: { label: '去植物氣體交換實驗桌', href: '../plant-exchange/' } }
});
