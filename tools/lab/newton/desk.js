// 力與運動實驗桌：合力、加速度與位置來自 ./model.mjs。
import { motion } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const f = x => String(Math.round(x * 100) / 100);
const INK = '#23304A', OPT = { force: { force: [2, 4, 6] }, mass: { mass: [1, 2, 4] }, net: { force: [0, 2], friction: [0, 2] } };
const near = (list, v) => list.reduce((m, x) => Math.abs(x - v) < Math.abs(m - v) ? x : m, list[0]);
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('linearGradient', 'nw-body', [[0, '#F0766A'], [.45, '#D8413A'], [1, '#8E2420']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'nw-metal', [[0, '#6C778A'], [.35, '#F2F5F9'], [.6, '#A9B3C2'], [1, '#596377']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'nw-block', [[0, '#B9C2CF'], [.4, '#8A95A6'], [1, '#56607A']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'nw-rail', [[0, '#E6EBF1'], [.5, '#9AA5B5'], [1, '#5F6A7E']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'nw-scale', [[0, '#FFF6D8'], [1, '#E9C770']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('radialGradient', 'nw-wheel', [[0, '#9AA5B5'], [.5, '#3A4660'], [1, '#141B2B']]);
  const pt = el('pattern', { id: 'nw-towel', width: 8, height: 8, patternUnits: 'userSpaceOnUse' }, d);
  el('rect', { width: 8, height: 8, fill: '#7FC4C0' }, pt); el('circle', { cx: 2, cy: 2, r: 1.6, fill: '#5DA8A3' }, pt); el('circle', { cx: 6, cy: 6, r: 1.6, fill: '#A3D9D5' }, pt);
}
function block(el, txt, g, x, y) {
  el('rect', { x, y, width: 34, height: 26, rx: 3, fill: 'url(#nw-block)', stroke: INK, 'stroke-width': 1.8 }, g);
  el('path', { d: `M${x + 3} ${y + 4}h28`, stroke: '#fff', 'stroke-width': 2, opacity: .6 }, g);
  txt(g, x + 17, y + 18, '1kg', { 'font-size': 10, fill: '#fff' });
}
// 小車：(x, y) 是車身底部中心；extra 是車上加的砝碼個數
function cart(el, txt, g, x, y, extra, ghost) {
  const q = el('g', ghost ? { opacity: .42 } : {}, g);
  for (let i = 0; i < extra; i++) block(el, txt, q, x - 36 + (i % 2) * 38, y - 62 - Math.floor(i / 2) * 27);
  el('path', { d: `M${x - 62} ${y - 34}h124a6 6 0 0 1 6 6v18a8 8 0 0 1 -8 8h-120a8 8 0 0 1 -8 -8v-18a6 6 0 0 1 6 -6z`, fill: ghost ? 'none' : 'url(#nw-body)', stroke: INK, 'stroke-width': 2.2, 'stroke-dasharray': ghost ? '6 4' : null }, q);
  if (!ghost) { el('path', { d: `M${x - 54} ${y - 29}h108`, stroke: '#fff', 'stroke-width': 2.5, opacity: .5, 'stroke-linecap': 'round' }, q); txt(q, x, y - 14, '小車 1 kg', { 'font-size': 11, fill: '#fff' }); }
  el('path', { d: `M${x + 68} ${y - 22}h10`, stroke: INK, 'stroke-width': 3 }, q); el('circle', { cx: x + 81, cy: y - 22, r: 4, fill: 'none', stroke: INK, 'stroke-width': 2.2 }, q);
  for (const dx of [-38, 38]) { el('circle', { cx: x + dx, cy: y + 3, r: 12, fill: ghost ? 'none' : 'url(#nw-wheel)', stroke: INK, 'stroke-width': 2 }, q); el('circle', { cx: x + dx, cy: y + 3, r: 3.5, fill: '#C6CEDA' }, q); }
  return q;
}
// 彈簧秤（橫放）：鉤子在 hx，往右拉；回傳把手節點與整支秤
function springScale(el, txt, g, hx, y, force) {
  const q = el('g', {}, g), rod = 18 + force * 14, bx = hx + rod;
  el('path', { d: `M${hx} ${y}h${rod}`, stroke: '#7A8394', 'stroke-width': 3 }, q);
  el('path', { d: `M${hx + 6} ${y}a5 5 0 1 1 -6 -5`, fill: 'none', stroke: INK, 'stroke-width': 2.5 }, q);
  el('rect', { x: bx, y: y - 15, width: 124, height: 30, rx: 6, fill: 'url(#nw-scale)', stroke: INK, 'stroke-width': 2 }, q);
  for (let n = 0; n <= 6; n++) { const x = bx + 12 + n * 15; el('path', { d: `M${x} ${y - 15}v${n % 2 ? 7 : 10}`, stroke: INK, 'stroke-width': 1.4 }, q); if (n % 2 === 0) txt(q, x, y + 11, String(n), { 'font-size': 9, fill: INK }); }
  el('path', { d: `M${bx + 12 + force * 15} ${y - 15}v16`, stroke: '#C8372D', 'stroke-width': 3 }, q);
  txt(q, bx + 113, y + 4, 'N', { 'font-size': 11, fill: '#5A6478' });
  const handle = el('g', {}, q);
  el('path', { d: `M${bx + 124} ${y}h14`, stroke: INK, 'stroke-width': 4 }, handle);
  el('rect', { x: bx + 136, y: y - 20, width: 22, height: 40, rx: 9, fill: '#FFF8EC', stroke: INK, 'stroke-width': 3 }, handle);
  el('rect', { x: bx + 118, y: y - 30, width: 52, height: 60, fill: 'transparent' }, handle);
  return { q, handle, end: bx + 147 };
}

function scene({ rig, el, txt, s, r, step, set, drag, hint, kind, reduce }) {
  defs(el, rig);
  const X0 = 130, Y = 400, PX = 52, can = kind === 'observe', opt = OPT[step] || {};
  // 軌道與刻度、毛巾
  el('rect', { x: 70, y: Y + 14, width: 880, height: 16, rx: 4, fill: 'url(#nw-rail)', stroke: INK, 'stroke-width': 2 }, rig);
  for (const x of [84, 936]) el('rect', { x: x - 8, y: Y - 6, width: 16, height: 36, rx: 3, fill: '#5A6478', stroke: INK, 'stroke-width': 1.5 }, rig);
  if (s.friction) el('rect', { x: 92, y: Y + 8, width: 836, height: 10, rx: 3, fill: 'url(#nw-towel)', stroke: '#4A8D88', 'stroke-width': 1.2 }, rig);
  for (let m = 0; m <= 14; m += 2) { el('path', { d: `M${X0 + m * PX} ${Y + 30} v12`, stroke: INK, 'stroke-width': 2 }, rig); txt(rig, X0 + m * PX, Y + 60, `${m} m`, { 'font-size': 13, fill: '#5A6478' }); }
  // 0、1、2 秒的位置（頻閃照片）
  const xs = [0, r.x1, r.x2].map(d => X0 + 40 + d * PX), extra = s.mass - 1;
  const flag = (x, label, col) => { el('path', { d: `M${x} ${Y + 30}V${Y + 74}`, stroke: col, 'stroke-width': 2, 'stroke-dasharray': '4 3' }, rig); el('path', { d: `M${x} ${Y + 74}l-8 12h16z`, fill: col }, rig); txt(rig, x, Y + 104, label, { 'font-size': 13, fill: col }); };
  flag(xs[0], '出發', '#5A6478');
  if (xs[1] - xs[0] > 34) flag(xs[1], '1 秒', '#C8372D');
  if (xs[2] - xs[1] > 34 || (xs[2] - xs[0] > 34 && xs[1] - xs[0] <= 34)) flag(xs[2], '2 秒', '#C8372D');
  // 會動的小車：跑 2 秒、停一下、再重來
  if (!reduce && xs[2] - xs[0] > 4) { const mv = el('g', { opacity: .9, 'pointer-events': 'none' }, rig); cart(el, txt, mv, xs[0], Y, extra, false);
    const N = 10, vals = Array.from({ length: N + 1 }, (_, i) => `${(r.at(2 * i / N).x * PX).toFixed(1)} 0`), times = Array.from({ length: N + 1 }, (_, i) => (i / N * .72).toFixed(3));
    el('animateTransform', { attributeName: 'transform', type: 'translate', values: [...vals, vals[N]].join(';'), keyTimes: [...times, '1'].join(';'), dur: '2.8s', repeatCount: 'indefinite' }, mv); }
  const start = el('g', {}, rig); cart(el, txt, start, xs[0], Y, extra, false);
  // 力的箭頭（畫在出發的小車上方）
  const arrow = (x1, len, color, label, y) => { if (!len) return; const x2 = x1 + len, dir = Math.sign(len);
    el('path', { d: `M${x1} ${y} H${x2 - dir * 12}`, stroke: color, 'stroke-width': 7, 'stroke-linecap': 'round' }, rig); el('path', { d: `M${x2} ${y} l${-dir * 16} -10 v20z`, fill: color }, rig);
    txt(rig, x1 + len / 2, y - 12, label, { 'font-size': 14, fill: color }); };
  arrow(xs[0] + 8, s.force * 18, '#C8372D', `拉力 ${s.force} N`, Y - 132);
  arrow(xs[0] - 8, -s.friction * 18, '#2F6FB0', `摩擦力 ${s.friction} N`, Y - 132);
  // 彈簧秤：拖把手設定拉力
  const hx = xs[0] + 85, sc = springScale(el, txt, rig, hx, Y - 22, s.force);
  if (can && opt.force) { sc.handle.setAttribute('data-drag', 'scale');
    drag(sc.handle, () => { let f0 = s.force; return { move(p, p0) { f0 = Math.max(0, Math.min(6, s.force + (p.x - p0.x) / 14)); sc.q.replaceChildren(); const n = springScale(el, txt, sc.q, hx, Y - 22, f0); n.handle.setAttribute('pointer-events', 'none'); },
      end() { const v = near(opt.force, f0); if (v !== s.force) set({ force: v }); else { sc.q.replaceChildren(); springScale(el, txt, sc.q, hx, Y - 22, s.force); } }, cancel() { sc.q.replaceChildren(); springScale(el, txt, sc.q, hx, Y - 22, s.force); } }; },
      { label: '拉彈簧秤', tap: () => set({ force: opt.force[(opt.force.indexOf(s.force) + 1) % opt.force.length] }) }); }
  // 砝碼盤：拖到小車上加重，從車上拖下來減重
  if (opt.mass) { const left = 3 - extra, tray = el('g', { 'data-drag': can && left ? 'weight' : null }, rig);
    el('rect', { x: 88, y: 168, width: 140, height: 52, rx: 10, fill: '#FFF8EC', stroke: '#8A93A6', 'stroke-width': 2, 'stroke-dasharray': '6 4' }, tray);
    for (let i = 0; i < left; i++) block(el, txt, tray, 98 + i * 42, 182);
    txt(rig, 158, 160, '砝碼盤', { 'font-size': 13, fill: '#5A6478' });
    const up = opt.mass[opt.mass.indexOf(s.mass) + 1], down = opt.mass[opt.mass.indexOf(s.mass) - 1];
    if (can && up) drag(tray, () => { const ghost = el('g', { 'pointer-events': 'none', opacity: .85 }, rig); block(el, txt, ghost, 98, 182); const clear = () => ghost.remove();
      return { move(p, p0) { ghost.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`); }, end(p) { clear(); if (Math.abs(p.x - xs[0]) < 90 && p.y > Y - 160 && p.y < Y + 20) set({ mass: up }); }, cancel: clear }; },
      { label: '在小車上加砝碼', tap: () => set({ mass: up }) });
    if (can && down) { start.setAttribute('data-drag', 'load'); drag(start, () => ({ move(p, p0) { start.setAttribute('transform', `translate(0 ${Math.min(0, p.y - p0.y)})`); }, end(p, p0) { start.removeAttribute('transform'); if (p.y - p0.y < -50 || Math.abs(p.x - p0.x) > 80) set({ mass: down }); }, cancel() { start.removeAttribute('transform'); } }),
      { label: '從小車上拿下砝碼', tap: () => set({ mass: down }) }); } }
  // 毛巾：點或拖到軌道上就有摩擦力
  if (opt.friction) { const tw = el('g', { 'data-drag': can ? 'towel' : null }, rig);
    if (!s.friction) { el('rect', { x: 760, y: 168, width: 120, height: 44, rx: 8, fill: 'url(#nw-towel)', stroke: '#4A8D88', 'stroke-width': 2 }, tw); el('path', { d: 'M760 190h120', stroke: '#4A8D88', 'stroke-width': 1.5 }, tw); txt(rig, 820, 160, '毛巾（摩擦力 2 N）', { 'font-size': 13, fill: '#5A6478' }); }
    else { el('rect', { x: 92, y: Y + 2, width: 836, height: 22, fill: 'transparent' }, tw); txt(rig, 820, 160, '毛巾鋪在軌道上', { 'font-size': 13, fill: '#2F6FB0' }); }
    if (can) drag(tw, () => ({ move(p, p0) { tw.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`); }, end(p, p0) { tw.removeAttribute('transform'); const on = s.friction ? Math.abs(p.y - p0.y) < 60 : p.y > Y - 40; if (on !== !!s.friction) set({ friction: on ? 2 : 0 }); }, cancel() { tw.removeAttribute('transform'); } }),
      { label: s.friction ? '把毛巾拿走' : '把毛巾鋪到軌道上', tap: () => set({ friction: s.friction ? 0 : 2 }) }); }
  el('rect', { x: 330, y: 150, width: 340, height: 74, rx: 14, fill: '#FFF8EC', stroke: INK, 'stroke-width': 3 }, rig);
  txt(rig, 500, 180, `合力 ${f(r.net)} N　質量 ${s.mass} kg`, { 'font-size': 17 }); txt(rig, 500, 208, `加速度 ${f(r.a)} m/s²（${r.state}）`, { 'font-size': 17, fill: '#C8372D' });
  // v–t 圖：速度隨時間，斜率就是加速度
  const GX = 200, GY = 720, GW = 560, GH = 150, vMax = 14, tx = t => GX + t / 2 * GW, vy = v => GY - v / vMax * GH;
  el('rect', { x: GX - 90, y: GY - GH - 46, width: GW + 200, height: GH + 86, rx: 16, fill: 'rgba(255,255,255,.95)', stroke: INK, 'stroke-width': 3 }, rig);
  txt(rig, GX - 70, GY - GH - 20, '速度－時間圖', { 'font-size': 15, 'text-anchor': 'start' });
  for (const v of [0, 4, 8, 12]) { el('path', { d: `M${GX} ${vy(v)}H${GX + GW}`, stroke: '#ECE2D2', 'stroke-width': 1.5 }, rig); txt(rig, GX - 10, vy(v) + 5, `${v}`, { 'font-size': 12, 'text-anchor': 'end', fill: '#5A6478' }); }
  for (const t of [0, 1, 2]) txt(rig, tx(t), GY + 22, `${t} 秒`, { 'font-size': 12, fill: '#5A6478' });
  el('path', { d: `M${GX} ${GY - GH - 6}V${GY}H${GX + GW}`, fill: 'none', stroke: INK, 'stroke-width': 2.5 }, rig);
  txt(rig, GX - 40, GY - GH + 10, 'm/s', { 'font-size': 11, fill: '#5A6478' });
  let vd = ''; for (let i = 0; i <= 40; i++) { const t = i / 20, v = r.at(t).v; vd += `${i ? 'L' : 'M'}${tx(t).toFixed(1)} ${vy(v).toFixed(1)}`; }
  el('path', { d: vd + `L${tx(2)} ${GY}L${GX} ${GY}Z`, fill: '#C8372D', opacity: .08 }, rig);
  el('path', { d: vd, fill: 'none', stroke: '#C8372D', 'stroke-width': 4, 'stroke-linejoin': 'round' }, rig);
  for (const t of [0, 1, 2]) el('circle', { cx: tx(t), cy: vy(r.at(t).v), r: 5.5, fill: '#C8372D', stroke: '#fff', 'stroke-width': 2 }, rig);
  txt(rig, GX + GW + 56, GY - GH + 34, '斜率', { 'font-size': 13, fill: '#5A6478' });
  txt(rig, GX + GW + 56, GY - GH + 62, `＝ ${f(r.a)}`, { 'font-size': 18, fill: '#C8372D' });
  txt(rig, GX + GW + 56, GY - GH + 84, 'm/s²', { 'font-size': 12, fill: '#5A6478' });
  txt(rig, GX + GW + 56, GY - GH + 112, '（加速度）', { 'font-size': 12, fill: '#5A6478' });
  hint(770, 196, step === 'force' ? '拖彈簧秤的把手，用力拉' : step === 'mass' ? '把砝碼拖到小車上；往上拖小車就拿掉砝碼' : '拉彈簧秤、把毛巾拖到軌道上');
  if (s.v0) txt(rig, xs[0] + 60, Y - 172, `一開始就以 ${s.v0} m/s 前進`, { 'font-size': 13, fill: '#5A6478' });
}
const tgt = (sig, label, set, aim) => ({ sig, label, set, aim, title: s => `${s.mass} kg、拉力 ${s.force} N、摩擦力 ${s.friction} N`, body: (s, r) => `合力 ${f(r.net)} N，加速度 ${f(r.a)} m/s²，${r.state}；2 秒後 ${f(r.v2)} m/s` });
const seg = (key, label, vals, unit) => ({ key, label, type: 'seg', options: vals.map(v => [v, `${v} ${unit}`]) });

runDesk({
  key: 'bhcs.lab.newton.v1', title: '力與運動實驗桌',
  sceneLabel: '力與運動實驗桌：小車在水平軌道上，可以拖彈簧秤的把手拉車、把砝碼拖上車、把毛巾鋪到軌道上；尺下方的旗子標出 1 秒和 2 秒的位置',
  initial: { mass: 1, force: 2, friction: 0, v0: 0 },
  model: motion, scene, viewBox: { desk: '60 130 900 640', phone: '60 130 900 640' }, phoneText: 1.45,
  readouts: (s, r) => [['合力', f(r.net), 'N', `${s.force} − ${s.friction}`], ['加速度', f(r.a), 'm/s²', `${f(r.net)} ÷ ${s.mass}`], ['2 秒後速度', f(r.v2), 'm/s', r.state]],
  why: { title: '牛頓運動定律', button: '力與加速度', html: `
    <p class="fn-tip"><b>慣性（第一定律）：</b>合力是 0 時，靜止的繼續靜止，運動中的維持等速直線運動。</p>
    <p class="fn-tip"><b>第二定律：加速度 ＝ 合力 ÷ 質量（F ＝ ma）。</b>合力越大加速度越大；質量越大加速度越小。</p>
    <p class="fn-tip"><b>合力</b>是所有力加起來的結果。這裡向右的拉力減掉向左的摩擦力。</p>
    <p class="fn-tip">單位：力 N（牛頓）、質量 kg、加速度 m/s²。1 N 讓 1 kg 的物體產生 1 m/s² 的加速度。</p>` },
  steps: [
    { id: 'force', label: '力加倍', title: '拉力加倍，加速度呢？', goal: '小車 1 kg、沒有摩擦。比較拉力 2 N 和 4 N，各收一張。',
      intro: '看小車每一秒跑多遠。拉力變大會怎樣？', enter: { mass: 1, force: 2, friction: 0, v0: 0 }, controls: [seg('force', '拉力', [2, 4, 6], 'N')],
      react: (s, r) => `加速度 ${f(r.a)} m/s²。`,
      targets: [tgt('f2', '拉力 2 N', { mass: 1, force: 2, friction: 0, v0: 0 }, '試拉力 2 N。'), tgt('f4', '拉力 4 N', { mass: 1, force: 4, friction: 0, v0: 0 }, '試拉力 4 N。')],
      found: ['質量不變時，合力加倍，加速度也加倍。', '2 N ÷ 1 kg ＝ 2 m/s²；4 N ÷ 1 kg ＝ 4 m/s²'] },
    { id: 'mass', label: '質量加倍', title: '車子變重，加速度呢？', goal: '拉力固定 4 N。比較 1 kg、2 kg、4 kg，各收一張。',
      intro: '同樣的力，拉越重的車會怎樣？', enter: { mass: 1, force: 4, friction: 0, v0: 0 }, controls: [seg('mass', '小車質量', [1, 2, 4], 'kg')],
      react: (s, r) => `加速度 ${f(r.a)} m/s²。`,
      targets: [1, 2, 4].map(m => tgt('m' + m, `${m} kg`, { mass: m, force: 4, friction: 0, v0: 0 }, `試 ${m} kg。`)),
      found: ['合力不變時，質量加倍，加速度變成一半。', '4 N ÷ 2 kg ＝ 2 m/s²；4 N ÷ 4 kg ＝ 1 m/s²'] },
    { id: 'net', label: '合力為零', title: '沒有合力，車子會停下來嗎？', goal: '小車一開始就以 2 m/s 前進。收下三種情況：都沒有力、拉力 2 N 配摩擦力 2 N、只有摩擦力 2 N。',
      intro: '車子已經在動了。沒有力推它，它會怎樣？', enter: { mass: 1, force: 0, friction: 0, v0: 2 },
      controls: [seg('force', '拉力', [0, 2], 'N'), seg('friction', '摩擦力', [0, 2], 'N')],
      react: (s, r) => `合力 ${f(r.net)} N，${r.state}。`,
      targets: [tgt('none', '沒有力', { mass: 1, force: 0, friction: 0, v0: 2 }, '拉力和摩擦力都調成 0。'), tgt('bal', '拉力 2 N、摩擦力 2 N', { mass: 1, force: 2, friction: 2, v0: 2 }, '拉力 2 N、摩擦力 2 N。'), tgt('fr', '只有摩擦力 2 N', { mass: 1, force: 0, friction: 2, v0: 2 }, '拉力 0、摩擦力 2 N。')],
      found: ['合力是 0 時，動的東西維持等速，不會自己停；會停下來是因為有摩擦力。', '合力 0 → 加速度 0 → 速度不變'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：F ＝ ma', goal: '加速度 ＝ 合力 ÷ 質量。', intro: '用 F ＝ ma 來算。', head: '合力 ＝ 質量 × 加速度',
      rows: [
        { id: 'a', name: '6 N 的合力作用在 2 kg 的車上，加速度', eq: '6 ÷ 2', answer: 3, unit: 'm/s²' },
        { id: 'f', name: '讓 3 kg 的車有 2 m/s² 的加速度，需要的合力', eq: '3 × 2', answer: 6, unit: 'N' },
        { id: 'v', name: '從靜止以 3 m/s² 加速 4 秒後的速度', eq: '3 × 4', answer: 12, unit: 'm/s' }],
      found: ['算對了！', 'a ＝ F ÷ m；v ＝ a × t（從靜止開始）'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想小車每一秒的位置。',
      found: ['你把力與運動弄懂了！', '合力決定加速度，不是決定速度'] }
  ],
  quiz: [
    { q: '在光滑的冰面上滑行的冰壺，沒有人再推它，它會？', options: [
      { text: '馬上停下來，因為沒有力了。', why: '你的證據：合力 0 時，2 m/s 的小車 2 秒後還是 2 m/s。' },
      { text: '幾乎維持原來的速度繼續滑。', ok: true },
      { text: '越滑越快。', why: '沒有合力就沒有加速度，速度不會變大。' }] },
    { q: '用同樣大小的力推空的和裝滿的購物車，哪一台加速得快？', options: [
      { text: '空的，質量小、加速度大。', ok: true },
      { text: '裝滿的，比較重所以衝得快。', why: '合力一樣時，質量越大加速度越小。你的證據：4 N 推 1 kg 是 4 m/s²，推 4 kg 只有 1 m/s²。' },
      { text: '一樣快，因為力一樣。', why: '力一樣，但質量不同，加速度就不同。' }] },
    { q: '車子以等速直線前進時，它受到的合力是？', options: [
      { text: '向前，不然車子不會動。', why: '維持運動不需要合力，改變速度才需要。等速表示合力是 0。' },
      { text: '向後。', why: '合力向後的話車子會減速。' },
      { text: '0，推力和阻力剛好抵消。', ok: true }] }
  ],
  finish: { title: '你把力與運動弄懂了！', rule: '合力是 0：靜止的不動、運動的維持等速。合力不是 0：加速度 ＝ 合力 ÷ 質量。', next: { label: '去小車運動圖實驗桌', href: '../motion/' } }
});
