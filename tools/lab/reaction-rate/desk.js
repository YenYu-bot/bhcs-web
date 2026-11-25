// 反應速率實驗桌：同樣 0.20 g 的大理石（塊狀、顆粒、粉末）放進鹽酸，注射筒收集二氧化碳；數值見 model.mjs（收縮球模型，教學示意）。
import { runDesk } from '../shared/desk.mjs';
import { calculate, quantity, remainingMass, radiusFraction, instantRate, VMAX_ML, PARTICLE_COUNTS } from './model.mjs';
const n1 = v => (+v).toFixed(1), f1 = x => (Math.round(x * 10) / 10).toFixed(1), f2 = x => (Math.round(x * 100) / 100).toFixed(2);
const NAME = { lump: '塊狀', granule: '顆粒', powder: '粉末' }, COLOR = { lump: '#2F6FB0', granule: '#C8372D', powder: '#7A4BB5' };
const END = Object.fromEntries(Object.keys(NAME).map(k => [k, calculate({ size: k }).time]));
const TIMES = { lump: [0, 10, 180], granule: [0, 10, 90], powder: [0, 10, 18] };
const TMAX = 180, ANG = t => Math.sqrt(t / TMAX) * 300; // 碼錶用平方根刻度，10 秒和 180 秒都看得清楚
const model = s => ({ V: quantity({ size: s.size }, s.t), m: remainingMass({ size: s.size }, s.t), x: radiusFraction({ size: s.size }, s.t), rate: instantRate({ size: s.size }, s.t), end: END[s.size] });

function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('linearGradient', 'rr-glass', [[0, '#fff', .75], [.15, '#fff', .15], [.85, '#fff', .1], [1, '#fff', .6]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  g('linearGradient', 'rr-acid', [[0, '#CDEBD9'], [1, '#9FD3B6']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('radialGradient', 'rr-stone', [[0, '#FBF6EC'], [.6, '#E3D8C2'], [1, '#B9AC92']], { cx: .35, cy: .3, r: .8 });
  g('linearGradient', 'rr-barrel', [[0, '#F4FBFF'], [.5, '#DCEFF8'], [1, '#BFDDEE']], { x1: 0, y1: 0, x2: 0, y2: 1 });
}
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
function stone(el, g, x, y, r, seed) { let p = ''; for (let i = 0; i <= 14; i++) { const a = i / 14 * 2 * Math.PI, k = r * (1 + .18 * (rnd(seed, i) - .5)); p += `${i ? 'L' : 'M'}${n1(x + k * Math.cos(a))} ${n1(y + k * .8 * Math.sin(a))}`; }
  el('path', { d: p + 'Z', fill: 'url(#rr-stone)', stroke: '#7A6A50', 'stroke-width': Math.max(.8, r / 14), 'stroke-linejoin': 'round' }, g); }

function scene({ rig, el, txt, s, r, step, set, drag, hint, kind, narrow }) {
  defs(el, rig);
  const can = kind === 'observe', opts = TIMES[s.size], k = r.x;
  // 錐形瓶與鹽酸
  const fx = 260, neck = 178, base = 500;
  const fd = `M${fx - 24} ${neck}h48v70L${fx + 130} ${base - 16}q8 16 -10 16H${fx - 120}q-18 0 -10 -16L${fx - 24} ${neck + 70}Z`;
  el('ellipse', { cx: fx, cy: base + 6, rx: 140, ry: 9, fill: '#000', opacity: .12 }, rig);
  el('path', { d: `M${fx - 90} 380L${fx + 90} 380L${fx + 130} ${base - 16}q8 16 -10 16H${fx - 120}q-18 0 -10 -16Z`, fill: 'url(#rr-acid)' }, rig);
  // 大理石：同樣的質量，切得越碎塊數越多；反應後每塊等比例縮小
  const pc = el('g', {}, rig);
  if (s.size === 'lump') { if (k > .02) stone(el, pc, fx, 470, 44 * k, 1); }
  else if (s.size === 'granule') { for (let i = 0; i < 8; i++) if (k > .02) stone(el, pc, fx - 80 + (i % 4) * 52 + (i > 3 ? 24 : 0), 482 - (i > 3 ? 26 : 0), 22 * k, i + 3); }
  else for (let i = 0; i < 160; i++) if (k > .02) el('circle', { cx: n1(fx - 100 + rnd(i, 1) * 200), cy: n1(486 - rnd(i, 2) * 14 * (1 - Math.abs(rnd(i, 1) - .5))), r: n1(2.6 * k + .4), fill: '#E9DFCB', stroke: '#9A8A6E', 'stroke-width': .5 }, pc);
  // 氣泡：越快的反應冒越多
  const nb = Math.min(40, Math.round(r.rate * 6));
  for (let i = 0; i < nb; i++) el('circle', { cx: n1(fx - 90 + rnd(i, 7) * 180), cy: n1(392 + rnd(i, 8) * 90), r: n1(2 + rnd(i, 9) * 3), fill: 'rgba(255,255,255,.85)', stroke: 'rgba(60,120,90,.5)', 'stroke-width': .8 }, rig);
  el('path', { d: fd, fill: 'url(#rr-glass)', stroke: '#23304A', 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, rig);
  el('path', { d: `M${fx - 90} 380Q${fx} 385 ${fx + 90} 380`, fill: 'none', stroke: '#fff', 'stroke-width': 2 }, rig);
  el('rect', { x: fx - 32, y: neck - 26, width: 64, height: 30, rx: 6, fill: '#8A6A3C', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, fx, base + 34, `${NAME[s.size]}大理石 0.20 g ＋ 鹽酸`, { 'font-size': 15 });
  // 導管與注射筒（0～100 mL）
  const sx = 420, sy = 168, SW = 300, mx = sx + 20 + SW * Math.min(r.V, 100) / 100;
  el('path', { d: `M${fx} ${neck - 26}V112H${sx - 40}V${sy}H${sx}`, fill: 'none', stroke: '#23304A', 'stroke-width': 11, 'stroke-linejoin': 'round' }, rig);
  el('path', { d: `M${fx} ${neck - 26}V112H${sx - 40}V${sy}H${sx}`, fill: 'none', stroke: '#E3F1F8', 'stroke-width': 6, 'stroke-linejoin': 'round' }, rig);
  el('rect', { x: sx, y: sy - 24, width: SW + 40, height: 48, rx: 8, fill: 'url(#rr-barrel)', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: sx + 20, y: sy - 18, width: n1(mx - sx - 20), height: 36, fill: '#fff', opacity: .7 }, rig);
  for (let v = 0; v <= 100; v += 10) { const x = sx + 20 + SW * v / 100; el('line', { x1: x, y1: sy - 24, x2: x, y2: sy - (v % 20 ? 16 : 10), stroke: '#23304A', 'stroke-width': 1.5 }, rig); if (!(v % 20)) txt(rig, x, sy - 32, String(v), { 'font-size': 12, fill: '#5A6478' }); }
  txt(rig, sx + SW + 54, sy - 32, 'mL', { 'font-size': 12, fill: '#5A6478' });
  el('rect', { x: n1(mx), y: sy - 20, width: 10, height: 40, rx: 3, fill: '#5A6478', stroke: '#23304A', 'stroke-width': 1.5 }, rig);
  el('rect', { x: n1(mx + 10), y: sy - 4, width: n1(sx + SW + 80 - mx), height: 8, fill: '#8A93A3', stroke: '#23304A', 'stroke-width': 1.2 }, rig);
  el('rect', { x: n1(sx + SW + 80), y: sy - 22, width: 10, height: 44, rx: 3, fill: '#5A6478', stroke: '#23304A', 'stroke-width': 1.5 }, rig);
  txt(rig, sx + SW / 2 + 20, sy + 48, `氣體 ${f1(r.V)} mL`, { 'font-size': 16, fill: '#2E8B66', 'font-weight': 900 });
  // 碼錶：拖指針；點錐形瓶也會往後走
  const cx = 500, cy = 330, R = 54, pt = (deg, rr) => [cx + rr * Math.sin(deg * Math.PI / 180), cy - rr * Math.cos(deg * Math.PI / 180)];
  el('rect', { x: cx - 6, y: cy - R - 18, width: 12, height: 14, rx: 3, fill: '#5A6478' }, rig);
  el('circle', { cx, cy, r: R + 6, fill: '#E9EDF2', stroke: '#23304A', 'stroke-width': 3 }, rig); el('circle', { cx, cy, r: R - 4, fill: '#FFFDF6', stroke: '#8792A6', 'stroke-width': 1.5 }, rig);
  if (s.t) { const [x1, y1] = pt(ANG(s.t), R - 10); el('path', { d: `M${cx} ${cy}V${cy - R + 10}A${R - 10} ${R - 10} 0 ${ANG(s.t) > 180 ? 1 : 0} 1 ${n1(x1)} ${n1(y1)}Z`, fill: '#FCE3A8' }, rig); }
  for (const t of opts) { const [x, y] = pt(ANG(t), R + 20); el('circle', { cx: n1(pt(ANG(t), R - 10)[0]), cy: n1(pt(ANG(t), R - 10)[1]), r: 3, fill: '#23304A' }, rig); txt(rig, n1(x), n1(y + 4), t ? `${t} 秒` : '', { 'font-size': 12, fill: t === s.t ? '#C8372D' : '#5A6478' }); }
  txt(rig, cx, cy + R + 32, `經過 ${s.t} 秒${s.t >= r.end ? '（反應完）' : ''}`, { 'font-size': 14 });
  const hg = el('g', { 'data-drag': can ? 'timer' : null }, rig), hand = el('g', { transform: `rotate(${n1(ANG(s.t))} ${cx} ${cy})` }, hg);
  el('circle', { cx, cy, r: R + 4, fill: 'transparent' }, hg);
  el('path', { d: `M${cx - 3.5} ${cy + 8}L${cx} ${cy - R + 12}L${cx + 3.5} ${cy + 8}Z`, fill: '#C8372D' }, hand); el('circle', { cx, cy, r: 5, fill: '#23304A' }, hg);
  const back = () => hand.setAttribute('transform', `rotate(${n1(ANG(s.t))} ${cx} ${cy})`), nextT = () => opts[(opts.indexOf(s.t) + 1) % opts.length];
  if (can) drag(hg, () => { let d = ANG(s.t); return {
    move(p) { d = Math.atan2(p.x - cx, cy - p.y) * 180 / Math.PI; if (d < -30) d += 360; d = Math.max(0, Math.min(300, d)); hand.setAttribute('transform', `rotate(${n1(d)} ${cx} ${cy})`); },
    end() { const v = opts.reduce((m, t) => Math.abs(ANG(t) - d) < Math.abs(ANG(m) - d) ? t : m); if (v !== s.t) set({ t: v }); else back(); }, cancel: back }; },
    { label: '轉碼錶，讓時間往後走', tap: () => set({ t: nextT() }) });
  const fg = el('g', { 'data-drag': can ? 'flask' : null }, rig); el('path', { d: fd, fill: 'transparent' }, fg);
  if (can) drag(fg, () => ({ move() {}, end() {}, cancel() {} }), { label: '讓反應繼續', tap: () => set({ t: nextT() }) });
  // 右：氣體體積—時間圖（三種大小都畫，現在這組是實線；手機排到錐形瓶下面）
  const gr = el('g', { transform: narrow ? 'translate(-764 219) scale(1.5)' : null }, rig);
  const gx = 660, gy = 500, W = 260, H = 200, X = t => gx + t / TMAX * W, Y = v => gy - v / 60 * H;
  el('rect', { x: gx - 44, y: gy - H - 46, width: W + 64, height: H + 90, rx: 16, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 2.5 }, gr);
  txt(gr, gx + W / 2 - 10, gy - H - 22, '氣體體積（mL）對時間', { 'font-size': 13, fill: '#5A6478' });
  for (const v of [0, 20, 40, 60]) { el('line', { x1: gx, y1: Y(v), x2: gx + W, y2: Y(v), stroke: '#E5E9EE' }, gr); txt(gr, gx - 16, Y(v) + 4, String(v), { 'font-size': 12, fill: '#5A6478' }); }
  for (const t of [0, 60, 120, 180]) txt(gr, X(t), gy + 20, String(t), { 'font-size': 12, fill: '#5A6478' });
  txt(gr, gx + W / 2, gy + 38, '秒', { 'font-size': 12, fill: '#5A6478' });
  el('line', { x1: X(10), y1: gy - H, x2: X(10), y2: gy, stroke: '#F0A818', 'stroke-width': 2, 'stroke-dasharray': '4 4' }, gr); txt(gr, X(10) + 4, gy - H - 4, '10 秒', { 'font-size': 11, fill: '#B7791F', 'text-anchor': 'start' });
  for (const z of Object.keys(NAME)) { const cur = z === s.size, upto = cur ? s.t : TMAX; let d = ''; for (let t = 0; t <= upto + 1e-9; t += Math.min(1, END[z] / 60)) d += `${d ? 'L' : 'M'}${n1(X(t))} ${n1(Y(quantity({ size: z }, t)))}`;
    if (!cur) el('path', { d, fill: 'none', stroke: COLOR[z], 'stroke-width': 1.8, 'stroke-dasharray': '5 5', opacity: .55 }, gr);
    else if (d) el('path', { d: d + `L${n1(X(s.t))} ${n1(Y(r.V))}`, fill: 'none', stroke: COLOR[z], 'stroke-width': 4, 'stroke-linecap': 'round' }, gr); }
  el('circle', { cx: n1(X(s.t)), cy: n1(Y(r.V)), r: 6, fill: COLOR[s.size], stroke: '#fff', 'stroke-width': 2 }, gr);
  el('line', { x1: gx, y1: Y(VMAX_ML), x2: gx + W, y2: Y(VMAX_ML), stroke: '#2E8B66', 'stroke-width': 1.5, 'stroke-dasharray': '2 4' }, gr);
  txt(gr, gx + W, Y(VMAX_ML) - 6, `終點 ${f1(VMAX_ML)} mL`, { 'font-size': 11, fill: '#2E8B66', 'text-anchor': 'end' });
  Object.keys(NAME).forEach((z, i) => { const ly = gy - 58 + i * 18; el('line', { x1: gx + W - 76, y1: ly, x2: gx + W - 52, y2: ly, stroke: COLOR[z], 'stroke-width': 3.5 }, gr); txt(gr, gx + W - 46, ly + 4, NAME[z], { 'font-size': 12, fill: COLOR[z], 'text-anchor': 'start' }); });
  hint(390, 580, '轉碼錶讓時間往後走（點錐形瓶也可以）');
}

const tgt = (size, t, aim) => ({ sig: `${size}${t}`, label: t === 10 ? '第 10 秒' : `反應完（${t} 秒）`, aim, set: { size, t },
  title: s => `${NAME[s.size]}・${s.t} 秒`, body: (s, r) => `氣體 ${f1(r.V)} mL，大理石剩 ${f2(r.m)} g` });
const timeCtl = size => ({ key: 't', label: '時間', type: 'seg', options: TIMES[size].map(t => [t, `${t} 秒`]) });
const run = (id, label, size, title, intro, found) => ({ id, label, title, intro, found,
  goal: `${NAME[size]}大理石 0.20 g 放進鹽酸。在第 10 秒和反應完時各收一張。`, enter: { size, t: 0 }, controls: [timeCtl(size)],
  react: (s, r) => s.t ? `${s.t} 秒：氣體 ${f1(r.V)} mL。` : '剛放進鹽酸，還沒有氣體。',
  targets: [tgt(size, 10, '轉到第 10 秒。'), tgt(size, END[size], `轉到 ${END[size]} 秒，等它反應完。`)] });

runDesk({
  key: 'bhcs.lab.reaction-rate.v2', title: '反應速率實驗桌', background: 'bg-chem-bench',
  sceneLabel: '反應速率實驗桌：錐形瓶裡的大理石和鹽酸反應，氣體經導管推動注射筒的活塞；旁邊有碼錶，右邊是三種大理石的氣體體積對時間圖',
  initial: { size: 'lump', t: 0 },
  model, scene, viewBox: { desk: '100 60 860 560', phone: '100 60 720 1000' }, phoneText: 1.4,
  readouts: (s, r) => [['經過時間', String(s.t), '秒', `${NAME[s.size]}要 ${r.end} 秒反應完`], ['氣體體積', f1(r.V), 'mL', '看注射筒刻度'], ['大理石剩下', f2(r.m), 'g', '起始 0.20 g']],
  why: { title: '反應速率怎麼比', button: '速率怎麼比', html: `
    <p class="fn-tip"><b>反應速率：</b>單位時間內產物增加（或反應物減少）多少。這裡看<b>同樣經過 10 秒，注射筒收集了多少氣體</b>。</p>
    <p class="fn-tip"><b>接觸面積：</b>同樣 0.20 g 的大理石，切成越小塊，和鹽酸接觸的總表面積越大，反應越快。</p>
    <p class="fn-tip"><b>終點一樣：</b>大理石的量相同，最後產生的二氧化碳一樣多（約 ${f1(VMAX_ML)} mL），只是快慢不同。</p>
    <p class="fn-tip">CaCO₃ ＋ 2HCl → CaCl₂ ＋ CO₂ ＋ H₂O。模型說明：鹽酸足量；用「收縮球」模型示意每一塊從外往內變小，時間是模擬秒，不是實測值。</p>` },
  steps: [
    run('lump', '跑塊狀', 'lump', '先跑一次塊狀大理石', '一整塊大理石放進鹽酸了。轉碼錶，看注射筒的活塞怎麼被推出去。', ['塊狀反應最慢，要 180 秒才反應完。', '第 10 秒約 7.7 mL']),
    run('granule', '跑顆粒', 'granule', '只換成顆粒大理石', '同樣 0.20 g，切成 8 小塊。會比較快嗎？', ['顆粒比塊狀快，90 秒就反應完。', '第 10 秒約 14.6 mL']),
    run('powder', '跑粉末', 'powder', '再試試看粉末', '磨成粉末，看看第 10 秒和終點。', ['粉末最快，18 秒就反應完；但最後的氣體和塊狀一樣多。', `第 10 秒約 44.6 mL，終點都是 ${f1(VMAX_ML)} mL`]),
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：平均反應速率', goal: '平均速率 ＝ 產生的氣體 ÷ 經過的時間。', intro: '用研究手冊的數字算算看。', head: '平均速率 ＝ 氣體體積 ÷ 時間',
      rows: [
        { id: 'g', name: '顆粒是 8 小塊，每塊半徑是塊狀的一半，反應完要幾秒', eq: '180 ÷ 2', answer: 90, unit: '秒' },
        { id: 'l', name: `塊狀從開始到反應完的平均速率（${f1(VMAX_ML)} mL ÷ 180 秒）`, eq: `${f1(VMAX_ML)} ÷ 180`, answer: 0.27, tol: .01, unit: 'mL/秒' },
        { id: 'p', name: `粉末從開始到反應完的平均速率（${f1(VMAX_ML)} mL ÷ 18 秒）`, eq: `${f1(VMAX_ML)} ÷ 18`, answer: 2.7, tol: .05, unit: 'mL/秒' }],
      found: ['算對了！', '氣體一樣多，時間越短，平均速率越大'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '兩題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '回頭看第 10 秒和終點的證據。',
      found: ['你用數據解釋了接觸面積對反應速率的影響！', '接觸面積越大，反應越快；終點一樣'] }
  ],
  quiz: [
    { q: '第 10 秒時，粉末已經有約 44.6 mL 氣體。為什麼同樣時間內它產生最多？', options: [
      { text: '粉末接觸鹽酸的總表面積比較大。', ok: true },
      { text: '粉末的大理石用量比較多。', why: '三組都是 0.20 g。' },
      { text: '粉末接觸鹽酸的總表面積比較小。', why: '同一塊切成很多小塊，露出來的表面變多，不是變少。' }] },
    { q: '三組都反應完後，哪一組產生的氣體最多？', options: [
      { text: '粉末，因為它最快到終點。', why: '快慢不同，但看終點：三條曲線停在同一個高度。' },
      { text: '三組一樣多，都約 48.9 mL。', ok: true },
      { text: '塊狀，因為它反應最久。', why: '反應久不代表產物多；大理石一樣多，產生的氣體就一樣多。' }] }
  ],
  finish: { title: '你用數據解釋了反應速率！', rule: '同樣多的大理石，切得越小、接觸面積越大，反應越快；但反應物一樣多，最後產生的氣體一樣多。', next: { label: '去化學平衡實驗桌', href: '../equilibrium/' } }
});
