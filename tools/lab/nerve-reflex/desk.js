// 神經反射實驗桌：神經路徑、中樞與是否經過大腦來自 scripts/science/models.mjs 的 calculate('nerve-reflex')。
// 接尺反應時間改用 g ＝ 10（與其他實驗桌一致）：t ＝ √(2d ÷ 10)。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => { const r = calculate('nerve-reflex', { action: s.action, drop: s.drop }); return { ...r, time: Math.sqrt(2 * (s.drop / 100) / 10) }; };
const ACT = { knee: '膝跳反射', withdraw: '碰到燙的東西縮手', catch: '看到球後接住' };
const f2 = x => String(Math.round(x * 100) / 100);

const INK = '#23304A', SKIN = ['#F6CDB0', '#E2A986', '#C98B68'], SENS = '#2F86D6', MOT = '#D9483A';
const OFFER = { reflex: ['knee', 'withdraw'], voluntary: ['withdraw', 'catch'] }, DROPS = [5, 20, 45];
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('linearGradient', 'nr-skin', [[0, SKIN[0]], [.6, SKIN[1]], [1, SKIN[2]]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'nr-skinh', [[0, SKIN[2]], [.4, SKIN[0]], [1, SKIN[1]]]);
  g('linearGradient', 'nr-short', [[0, '#5B7FC4'], [1, '#2F4F8E']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'nr-wood', [[0, '#E6C48C'], [1, '#B98A52']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'nr-metal', [[0, '#6C778A'], [.35, '#F2F5F9'], [.6, '#A9B3C2'], [1, '#596377']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('radialGradient', 'nr-white', [[0, '#FFFBF2'], [1, '#EBDDC4']]);
  g('radialGradient', 'nr-gray', [[0, '#D9B8C0'], [1, '#B98F9B']]);
  g('linearGradient', 'nr-ruler', [[0, '#FBE6A6'], [.5, '#F4D07A'], [1, '#E2B654']]);
  for (const [k, c] of [['s', SENS], ['m', MOT]]) { const m = el('marker', { id: 'nr-' + k, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 3.4, markerHeight: 3.4, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: c }, m); }
}
// 坐著的腿（側面）：kick 為 true 時小腿往前踢
function leg(el, g, kick) {
  el('rect', { x: 92, y: 282, width: 210, height: 16, rx: 5, fill: 'url(#nr-wood)', stroke: INK, 'stroke-width': 2 }, g);
  el('path', { d: 'M110 298V440M286 298V440', stroke: '#8A6A3A', 'stroke-width': 8 }, g);
  const low = el('g', { transform: kick ? 'rotate(-38 298 266)' : '' }, g);
  // 小腿：前面是脛骨的直線，後面是小腿肚的弧
  el('path', { d: 'M286 262C284 300 290 330 292 400L318 402C318 360 324 330 318 300C316 282 314 270 310 262Z', fill: 'url(#nr-skinh)', stroke: INK, 'stroke-width': 2.2 }, low);
  el('path', { d: 'M288 390h32v22h-32z', fill: '#F4F7FA', stroke: INK, 'stroke-width': 1.8 }, low);
  el('path', { d: 'M286 410h36q26 2 30 20h-68z', fill: '#2B3550', stroke: INK, 'stroke-width': 2 }, low);
  // 大腿：靠髖部比較粗，往膝蓋收細
  el('path', { d: 'M96 228C170 222 250 234 296 246C318 252 322 276 304 284C250 290 170 290 96 290Z', fill: 'url(#nr-skin)', stroke: INK, 'stroke-width': 2.2 }, g);
  el('path', { d: 'M196 236C240 238 270 244 292 252', fill: 'none', stroke: '#FBE3D2', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: .9 }, g);
  el('path', { d: 'M94 224C130 220 168 222 194 226L196 292C160 294 128 294 94 292Z', fill: 'url(#nr-short)', stroke: INK, 'stroke-width': 2.2 }, g);
  el('path', { d: 'M112 230V288', stroke: '#26437A', 'stroke-width': 1.5, opacity: .6 }, g);
  el('ellipse', { cx: 306, cy: 262, rx: 9, ry: 12, fill: '#F2C3A4', stroke: SKIN[2], 'stroke-width': 1.5 }, g);
  if (kick) el('path', { d: 'M330 360q30 -20 40 -60', fill: 'none', stroke: '#5A6478', 'stroke-width': 2.5, 'stroke-dasharray': '5 5', 'marker-end': 'url(#nr-m)' }, g);
  return low;
}
function hammer(el, g, x, y, rot) {
  const q = el('g', { transform: `rotate(${rot} ${x} ${y})` }, g);
  el('rect', { x: x - 3, y, width: 6, height: 70, rx: 3, fill: 'url(#nr-metal)', stroke: INK, 'stroke-width': 1.5 }, q);
  el('path', { d: `M${x - 20} ${y - 10}l40 0a10 10 0 0 1 0 20l-40 0a10 10 0 0 1 0 -20z`, fill: '#D9483A', stroke: INK, 'stroke-width': 2 }, q);
  return q;
}
function arm(el, g, hx, hy, open) {
  el('path', { d: `M84 ${hy - 24}Q160 ${hy - 30} ${hx - 34} ${hy - 14}L${hx - 34} ${hy + 14}Q160 ${hy + 26} 84 ${hy + 24}Z`, fill: 'url(#nr-skin)', stroke: INK, 'stroke-width': 2.2 }, g);
  el('path', { d: `M84 ${hy - 26}h40v52h-40z`, fill: '#E9EEF5', stroke: INK, 'stroke-width': 2 }, g);
  el('path', { d: `M${hx - 36} ${hy - 16}q22 -10 34 0q6 6 4 14${open ? 'l24 -6q6 2 2 8l-22 8l22 2q6 4 0 8l-24 0l18 6q4 6 -2 8l-28 -6' : 'q10 6 6 16q-8 8 -20 6'}q-10 4 -20 0z`, fill: 'url(#nr-skin)', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
  el('path', { d: `M${hx - 30} ${hy - 12}q10 -12 22 -10`, fill: 'none', stroke: SKIN[1], 'stroke-width': 2 }, g);
  if (!open) for (let k = 0; k < 3; k++) el('path', { d: `M${hx - 4 + k * 1} ${hy - 8 + k * 7}q6 1 10 -1`, fill: 'none', stroke: SKIN[2], 'stroke-width': 1.5, 'stroke-linecap': 'round' }, g);
}
function pot(el, g, x, y) {
  el('path', { d: `M${x - 44} ${y}h88l-6 50q-38 10 -76 0z`, fill: '#5A6478', stroke: INK, 'stroke-width': 2.2 }, g);
  el('path', { d: `M${x - 48} ${y - 6}h96v8h-96z`, fill: '#3A4660', stroke: INK, 'stroke-width': 2 }, g);
  el('path', { d: `M${x + 44} ${y + 12}h30`, stroke: INK, 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
  for (const dx of [-22, 0, 22]) el('path', { d: `M${x + dx} ${y - 12}c-10 -14 10 -22 0 -36c-8 -12 6 -18 0 -28`, fill: 'none', stroke: '#C9D0DA', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: .8 }, g);
  el('ellipse', { cx: x, cy: y + 58, rx: 46, ry: 6, fill: '#E8432A', opacity: .5 }, g);
}
function eye(el, g, x, y) {
  el('path', { d: `M${x - 34} ${y}Q${x} ${y - 30} ${x + 34} ${y}Q${x} ${y + 30} ${x - 34} ${y}Z`, fill: '#FFFFFF', stroke: INK, 'stroke-width': 2.2 }, g);
  el('circle', { cx: x + 8, cy: y, r: 13, fill: '#6B4A2B' }, g); el('circle', { cx: x + 10, cy: y, r: 6, fill: '#111' }, g); el('circle', { cx: x + 5, cy: y - 5, r: 3, fill: '#fff' }, g);
  el('path', { d: `M${x - 38} ${y - 14}Q${x} ${y - 44} ${x + 38} ${y - 12}`, fill: 'none', stroke: '#5A3E2B', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
}
function ball(el, g, x, y) { el('circle', { cx: x, cy: y, r: 20, fill: '#F4C04E', stroke: INK, 'stroke-width': 2 }, g); el('path', { d: `M${x - 20} ${y}q20 -12 40 0M${x - 14} ${y - 14}q14 14 0 28M${x + 14} ${y - 14}q-14 14 0 28`, fill: 'none', stroke: '#C88A1E', 'stroke-width': 1.6 }, g); }
// 脊髓橫切面：外圈白質、蝴蝶形灰質；背根在上方、腹根在下方
function cord(el, txt, g, x, y, lit) {
  el('ellipse', { cx: x, cy: y, rx: 66, ry: 54, fill: 'url(#nr-white)', stroke: INK, 'stroke-width': 2.5 }, g);
  el('path', { d: `M${x} ${y - 6}C${x - 8} ${y - 30} ${x - 34} ${y - 46} ${x - 40} ${y - 30}C${x - 44} ${y - 16} ${x - 22} ${y - 8} ${x - 30} ${y + 6}C${x - 46} ${y + 24} ${x - 34} ${y + 44} ${x - 16} ${y + 34}C${x - 6} ${y + 26} ${x - 4} ${y + 12} ${x} ${y + 8}C${x + 4} ${y + 12} ${x + 6} ${y + 26} ${x + 16} ${y + 34}C${x + 34} ${y + 44} ${x + 46} ${y + 24} ${x + 30} ${y + 6}C${x + 22} ${y - 8} ${x + 44} ${y - 16} ${x + 40} ${y - 30}C${x + 34} ${y - 46} ${x + 8} ${y - 30} ${x} ${y - 6}Z`, fill: 'url(#nr-gray)', stroke: '#8E5C6A', 'stroke-width': 1.5 }, g);
  el('circle', { cx: x, cy: y + 1, r: 3.5, fill: '#fff', stroke: '#8E5C6A', 'stroke-width': 1 }, g);
  if (lit) el('ellipse', { cx: x, cy: y, rx: 72, ry: 60, fill: 'none', stroke: '#F4C04E', 'stroke-width': 5, opacity: .9 }, g);
  txt(g, x, y + 76, '脊髓（橫切面）', { 'font-size': 13, fill: '#5A6478' });
}
// 神經：一條平滑曲線，可選擇讓衝動（小亮點）沿著跑
function nerve(el, rig, d, color, reduce, delay) {
  el('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: .8 }, rig);
  el('path', { d, fill: 'none', stroke: color, 'stroke-width': 4, 'stroke-linecap': 'round', 'marker-end': `url(#nr-${color === SENS ? 's' : 'm'})` }, rig);
  if (!reduce) { const c = el('circle', { r: 7, fill: '#FFF3B0', stroke: color, 'stroke-width': 2.5 }, rig); el('animateMotion', { path: d, dur: '1.4s', begin: `${delay}s`, repeatCount: 'indefinite', keyPoints: '0;1;1', keyTimes: '0;.45;1', calcMode: 'linear' }, c); }
}

function scene({ rig, el, txt, P, s, r, step, set, drag, hint, kind, reduce }) {
  defs(el, rig);
  const can = kind === 'observe';
  if (step === 'ruler' || step === 'calc') {
    // 接尺實驗：尺的 0 刻度原本在手指間（F），落下 d cm 後被抓住，手指正好在 d 的刻度
    const F = 230, sc = 6, zero = F + s.drop * sc, RX = 470;
    const rul = el('g', { 'data-drag': can && step === 'ruler' ? 'ruler' : null }, rig);
    el('rect', { x: RX + 4, y: zero - 50 * sc - 4, width: 60, height: 50 * sc + 16, rx: 5, fill: '#000', opacity: .15 }, rul);
    el('rect', { x: RX, y: zero - 50 * sc - 8, width: 60, height: 50 * sc + 16, rx: 5, fill: 'url(#nr-ruler)', stroke: INK, 'stroke-width': 2.5 }, rul);
    for (let c = 0; c <= 50; c++) { const yy = zero - c * sc; el('line', { x1: RX, y1: yy, x2: RX + (c % 10 ? c % 5 ? 9 : 15 : 22), y2: yy, stroke: INK, 'stroke-width': c % 5 ? 1 : 1.8 }, rul); if (c % 10 === 0) txt(rul, RX + 40, yy + 5, String(c), { 'font-size': 13 }); }
    // 抓尺的兩根手指：左邊大拇指、右邊食指，指甲朝外
    for (const sd of [-1, 1]) { const x0 = sd < 0 ? RX - 2 : RX + 62, L = 130, th = sd < 0 ? 30 : 24, q = el('g', {}, rig);
      el('path', { d: `M${x0 + sd * L} ${F - th / 2 - 4}L${x0 + sd * 18} ${F - th / 2}Q${x0} ${F - th / 2} ${x0} ${F}Q${x0} ${F + th / 2} ${x0 + sd * 18} ${F + th / 2}L${x0 + sd * L} ${F + th / 2 + 6}Z`, fill: 'url(#nr-skin)', stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, q);
      el('path', { d: `M${x0 + sd * 6} ${F - th / 2 + 4}Q${x0 + sd * 2} ${F - th / 2 + 10} ${x0 + sd * 4} ${F}`, fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: .6 }, q);
      el('path', { d: `M${x0 + sd * 8} ${F - th / 2 + 1}q${sd * 14} -2 ${sd * 22} 2v${th * .5}q${-sd * 8} 4 ${-sd * 22} 2z`, fill: '#F7DCCB', stroke: SKIN[2], 'stroke-width': 1.2 }, q);
      for (const k of [0, 1]) el('path', { d: `M${x0 + sd * (52 + k * 40)} ${F - th / 2 + 2}q${sd * 4} ${th / 2 - 2} 0 ${th - 4}`, fill: 'none', stroke: SKIN[2], 'stroke-width': 1.5, opacity: .7 }, q); }
    el('line', { x1: RX + 70, y1: F, x2: 680, y2: F, stroke: '#5A6478', 'stroke-width': 2, 'stroke-dasharray': '6 5' }, rig);
    txt(rig, 760, F + 5, '原本 0 刻度在這裡', { 'font-size': 14, fill: '#5A6478' });
    if (s.drop) { el('path', { d: `M670 ${F + 6} V${zero - 6}`, stroke: MOT, 'stroke-width': 4, 'marker-end': 'url(#nr-m)' }, rig); txt(rig, 760, (F + zero) / 2 + 6, `落下 ${s.drop} cm`, { 'font-size': 18, fill: MOT }); }
    el('rect', { x: 120, y: 296, width: 270, height: 96, rx: 16, fill: '#FFF8EC', stroke: INK, 'stroke-width': 2.5 }, rig);
    txt(rig, 255, 336, `反應時間 ${f2(r.time)} 秒`, { 'font-size': 24, fill: '#2F6FB0' });
    txt(rig, 255, 370, `t ＝ √(2 × ${f2(s.drop / 100)} ÷ 10)`, { 'font-size': 15, fill: '#5A6478' });
    if (can && step === 'ruler') { drag(rul, () => { let d = s.drop; return { move(p, p0) { d = Math.max(0, Math.min(50, s.drop + (p.y - p0.y) / sc)); rul.setAttribute('transform', `translate(0 ${(d - s.drop) * sc})`); },
      end() { const v = DROPS.reduce((m, x) => Math.abs(x - d) < Math.abs(m - d) ? x : m); if (v !== s.drop) set({ drop: v }); else rul.removeAttribute('transform'); }, cancel() { rul.removeAttribute('transform'); } }; },
      { label: '把尺往下拉', tap: () => set({ drop: DROPS[(DROPS.indexOf(s.drop) + 1) % 3] }) });
      hint(500, 610, '上下拖尺，看抓到時落下多少'); }
    return;
  }
  // 左：情境
  const act = s.action, sceneG = el('g', {}, rig);
  if (act === 'knee') { leg(el, sceneG, true); hammer(el, sceneG, 334, 284, -48); }
  else if (act === 'withdraw') { pot(el, sceneG, 330, 330); arm(el, sceneG, 230, 270, false); el('path', { d: 'M260 300h-50', stroke: '#5A6478', 'stroke-width': 2.5, 'stroke-dasharray': '5 5', 'marker-end': 'url(#nr-m)' }, sceneG); txt(sceneG, 236, 322, '縮手', { 'font-size': 13, fill: '#5A6478' }); }
  else { eye(el, sceneG, 150, 170); ball(el, sceneG, 330, 250); el('path', { d: 'M400 160Q370 180 346 236', fill: 'none', stroke: '#8A93A6', 'stroke-width': 2, 'stroke-dasharray': '5 5' }, sceneG); arm(el, sceneG, 300, 330, true); }
  // 神經路徑（感覺：藍、運動：紅）
  const CX = 600, CY = 360, brain = r.viaBrain;
  el('image', { href: P + 'prop-brain.webp', x: CX - 82, y: 72, width: 164, height: 108, opacity: brain ? 1 : .45 }, rig);
  if (brain) el('ellipse', { cx: CX, cy: 124, rx: 92, ry: 60, fill: 'none', stroke: '#F4C04E', 'stroke-width': 5 }, rig);
  el('path', { d: `M${CX - 14} 172V${CY - 50}M${CX + 14} 172V${CY - 50}`, stroke: INK, 'stroke-width': 2 }, rig);
  el('rect', { x: CX - 14, y: 172, width: 28, height: CY - 222, fill: '#F2E6D2', opacity: .9 }, rig);
  cord(el, txt, rig, CX, CY, !brain);
  if (act === 'knee') { nerve(el, rig, `M228 236C320 150 470 220 ${CX - 30} ${CY - 34}`, SENS, reduce, 0); nerve(el, rig, `M${CX - 26} ${CY + 36}C480 470 300 330 214 252`, MOT, reduce, .6); }
  else if (act === 'withdraw') { nerve(el, rig, `M270 262C360 180 470 250 ${CX - 30} ${CY - 34}`, SENS, reduce, 0); nerve(el, rig, `M${CX - 26} ${CY + 36}C440 480 260 380 150 282`, MOT, reduce, .6); }
  else { nerve(el, rig, `M182 162C300 90 420 100 ${CX - 70} 124`, SENS, reduce, 0); el('path', { d: `M${CX} 176V${CY - 54}`, stroke: '#9A6FD0', 'stroke-width': 4, 'stroke-dasharray': '6 5' }, rig); nerve(el, rig, `M${CX - 26} ${CY + 36}C460 470 330 400 292 352`, MOT, reduce, .6); }
  // 右：結果卡
  el('rect', { x: 724, y: 196, width: 210, height: 190, rx: 16, fill: 'rgba(255,255,255,.95)', stroke: INK, 'stroke-width': 2.5 }, rig);
  txt(rig, 829, 226, ACT[act], { 'font-size': 16 });
  txt(rig, 829, 266, `中樞：${r.center}`, { 'font-size': 20, fill: '#2F6FB0' });
  txt(rig, 829, 300, brain ? '經過大腦判斷' : '不經過大腦', { 'font-size': 15, fill: brain ? '#7A4BB5' : '#5A6478' });
  txt(rig, 829, 330, `共 ${r.steps} 步`, { 'font-size': 15 });
  if (r.painLater) { txt(rig, 829, 356, '縮手之後，訊息才', { 'font-size': 12, fill: '#C8372D' }); txt(rig, 829, 372, '傳到大腦感覺到痛', { 'font-size': 12, fill: '#C8372D' }); }
  el('path', { d: 'M744 404h20', stroke: SENS, 'stroke-width': 4 }, rig); txt(rig, 768, 409, '感覺神經', { 'font-size': 12, fill: '#5A6478', 'text-anchor': 'start' });
  el('path', { d: 'M840 404h20', stroke: MOT, 'stroke-width': 4 }, rig); txt(rig, 864, 409, '運動神經', { 'font-size': 12, fill: '#5A6478', 'text-anchor': 'start' });
  // 下：路徑步驟
  const n = r.path.length, w = 118, gap = 16, x0 = 500 - (n * w + (n - 1) * gap) / 2, y = 470;
  r.path.forEach(([name, note], i) => { const x = x0 + i * (w + gap), center = name === '脊髓' || name === '大腦', col = name === '感覺神經' ? SENS : name === '運動神經' ? MOT : center ? '#2F6FB0' : INK;
    el('rect', { x, y, width: w, height: 58, rx: 14, fill: center ? '#2F6FB0' : '#FFFDF6', stroke: col, 'stroke-width': 2.5 }, rig);
    txt(rig, x + w / 2, y + 26, name, { 'font-size': 16, fill: center ? '#fff' : col });
    if (note) txt(rig, x + w / 2, y + 46, note, { 'font-size': 11, fill: center ? '#DCE8F5' : '#5A6478' });
    if (i < n - 1) el('path', { d: `M${x + w + 2} ${y + 29}h${gap - 6}`, stroke: '#8A93A6', 'stroke-width': 3, 'marker-end': 'url(#nr-m)' }, rig); });
  // 工具：點或拖進左邊的情境換動作
  const offer = OFFER[step];
  if (offer && can) { const ICON = { knee: '敲膝蓋的槌子', withdraw: '燙的鍋子', catch: '飛來的球' };
    offer.forEach((k, i) => { const x = 140 + i * 150, on = k === act, g = el('g', { 'data-drag': on ? null : `tool-${k}`, opacity: on ? .45 : 1 }, rig);
      el('rect', { x: x - 60, y: 556, width: 132, height: 40, rx: 12, fill: '#FFF8EC', stroke: on ? '#8A93A6' : '#2E8B66', 'stroke-width': 2, 'stroke-dasharray': '6 4' }, g);
      const ic = el('g', { transform: `translate(${x - 38} 576) scale(.32) translate(${-330} ${-300})` }, g); if (k === 'knee') hammer(el, ic, 330, 260, 60); else if (k === 'withdraw') pot(el, ic, 330, 300); else ball(el, ic, 330, 300);
      txt(g, x + 18, 581, ICON[k], { 'font-size': 12, fill: on ? '#5A6478' : '#1F6E50' });
      if (!on) drag(g, () => ({ move(p, p0) { g.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`); }, end(p) { g.removeAttribute('transform'); if (p.x < 460 && p.y < 450) set({ action: k }); }, cancel() { g.removeAttribute('transform'); } }), { label: `換成${ACT[k]}`, tap: () => set({ action: k }) }); });
    hint(620, 580, '把下面的東西拖到左邊，或直接點'); }
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: s => sig.startsWith('d') ? `尺落下 ${s.drop} cm` : ACT[s.action],
  body: (s, r) => sig.startsWith('d') ? `反應時間 ${f2(r.time)} 秒` : `中樞在${r.center}，${r.steps} 步${r.viaBrain ? '，經大腦判斷' : '，不經大腦'}` });

runDesk({
  key: 'bhcs.lab.nerve-reflex.v1', title: '神經反射實驗桌', background: 'bg-chem-bench',
  sceneLabel: '神經反射實驗桌：左邊是情境（敲膝蓋、碰到燙的鍋子、接球），中間是大腦和脊髓橫切面，藍色是感覺神經、紅色是運動神經，下方列出訊息走的每一步；可以把下方的槌子、鍋子、球拖到左邊換情境，接尺實驗可以上下拖尺',
  initial: { action: 'knee', drop: 20 },
  model, scene, viewBox: step => step === 'ruler' || step === 'calc' ? { desk: '90 30 860 600', phone: '100 30 820 600' } : { desk: '50 60 910 560', phone: '50 60 910 560' }, phoneText: 1.4,
  readouts: (s, r) => [['動作', s.action === 'catch' ? '接球' : s.action === 'knee' ? '膝跳' : '縮手', '', r.kind === 'reflex' ? '反射' : '意識動作'], ['中樞', r.center, '', r.viaBrain ? '經大腦判斷' : '不經大腦'], ['接尺反應時間', f2(r.time), '秒', `尺落下 ${s.drop} cm`]],
  why: { title: '神經系統與反射', button: '訊息怎麼傳', html: `
    <p class="fn-tip"><b>反應的路線：</b>受器 → 感覺神經 → 中樞 → 運動神經 → 動器。</p>
    <p class="fn-tip"><b>反射：</b>中樞在脊髓（或腦幹），不必等大腦判斷，所以很快，例如膝跳反射、碰到燙的東西縮手。縮手之後，訊息才傳到大腦產生痛覺。</p>
    <p class="fn-tip"><b>意識動作：</b>要先由大腦判斷，再下指令，例如看到球後接住，比反射慢。</p>
    <p class="fn-tip"><b>接尺實驗：</b>尺落下的距離越長，反應時間越長。t ＝ √(2d ÷ g)，這裡 g 取 10。</p>` },
  steps: [
    { id: 'reflex', label: '反射', title: '反射：訊息走哪一條路？', goal: '看膝跳反射和縮手反射的路線，中樞在哪裡、有沒有經過大腦，各收一張。',
      intro: '輕敲膝蓋下方，小腿會自己踢起來。訊息有經過大腦嗎？', enter: { action: 'knee', drop: 20 },
      controls: [{ key: 'action', label: '動作', type: 'seg', options: [['knee', '膝跳反射'], ['withdraw', '碰燙縮手']], cols: 2 }],
      react: (s, r) => `${ACT[s.action]}：中樞在${r.center}。`,
      targets: [tgt('knee', '膝跳反射', { action: 'knee' }, '選膝跳反射。'), tgt('hot', '碰燙縮手', { action: 'withdraw' }, '選碰燙縮手。')],
      found: ['反射的中樞在脊髓，不經大腦判斷，所以很快。', '受器 → 感覺神經 → 脊髓 → 運動神經 → 動器'] },
    { id: 'voluntary', label: '意識動作', title: '接球：和反射有什麼不同？', goal: '看「看到球後接住」的路線，和縮手反射比一比，各收一張。',
      intro: '看到球飛來再伸手接，這次訊息要經過哪裡？', enter: { action: 'catch', drop: 20 },
      controls: [{ key: 'action', label: '動作', type: 'seg', options: [['withdraw', '碰燙縮手'], ['catch', '看到球後接住']], cols: 2 }],
      react: (s, r) => `${ACT[s.action]}：${r.steps} 步，中樞在${r.center}。`,
      targets: [tgt('catch', '看到球後接住', { action: 'catch' }, '選「看到球後接住」。'), tgt('cmp', '碰燙縮手（比較）', { action: 'withdraw' }, '選「碰燙縮手」比一比。')],
      found: ['接球要經大腦判斷，路線比反射長，所以比較慢。', '意識動作：中樞在大腦；反射：中樞在脊髓'] },
    { id: 'ruler', label: '接尺實驗', title: '接尺實驗：量自己的反應時間', goal: '同學放開尺，你看到就抓。比較尺落下 5 cm 和 20 cm 時的反應時間，各收一張。',
      intro: '尺落下越多，代表反應越慢。看看 20 cm 是幾秒？', enter: { action: 'catch', drop: 20 },
      controls: [{ key: 'drop', label: '抓到時尺落下的距離', type: 'seg', options: [[5, '5 cm'], [20, '20 cm'], [45, '45 cm']] }],
      react: (s, r) => `落下 ${s.drop} cm：反應時間 ${f2(r.time)} 秒。`,
      targets: [tgt('d5', '落下 5 cm', { drop: 5 }, '選 5 cm。'), tgt('d20', '落下 20 cm', { drop: 20 }, '選 20 cm。')],
      found: ['尺落下越多，反應時間越長：5 cm 是 0.1 秒，20 cm 是 0.2 秒。', 't ＝ √(2d ÷ 10)：距離變 4 倍，時間變 2 倍'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：反應時間', goal: 't ＝ √(2d ÷ 10)，d 用公尺。', intro: '把 cm 換成 m 再代入。', head: 't ＝ √(2 × d ÷ 10)',
      rows: [
        { id: 't45', name: '尺落下 45 cm 的反應時間', eq: '√(2 × 0.45 ÷ 10)', answer: 0.3, unit: '秒', tol: .005 },
        { id: 'd02', name: '反應時間 0.2 秒，尺落下幾 cm', eq: '10 × 0.2² ÷ 2 × 100', answer: 20, unit: 'cm', tol: .01, hint: v => v === 0.2 ? '0.2 是公尺，換成 cm 要 × 100。' : '' }],
      found: ['算對了！', '落下距離 ＝ ½ × 10 × 時間²'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想訊息走的路。',
      found: ['你把神經反射弄懂了！', '反射快：中樞在脊髓；意識動作慢：要經大腦'] }
  ],
  quiz: [
    { q: '手碰到很燙的鍋子會立刻縮回，這個反應的中樞在？', options: [
      { text: '大腦，因為會覺得痛。', why: '縮手是反射，中樞在脊髓。你的證據：痛覺是縮手之後才傳到大腦。' },
      { text: '脊髓。', ok: true },
      { text: '手指的皮膚。', why: '皮膚是受器，負責接收刺激，不是中樞。' }] },
    { q: '為什麼接球比膝跳反射慢？', options: [
      { text: '因為接球要經過大腦判斷，路線比較長。', ok: true },
      { text: '因為手比腳離大腦遠。', why: '重點不是距離，而是有沒有經過大腦判斷：接球 6 步，膝跳 5 步而且不經大腦。' },
      { text: '因為接球不需要神經。', why: '所有反應都要靠神經傳遞訊息。' }] },
    { q: '小明抓到尺時落下 20 cm，小華落下 5 cm，誰的反應比較快？', options: [
      { text: '小明，因為抓到的位置比較多。', why: '尺落下越多，代表抓得越晚。你的證據：20 cm 是 0.2 秒，5 cm 是 0.1 秒。' },
      { text: '小華。', ok: true },
      { text: '一樣快。', why: '落下距離不同，反應時間就不同。' }] }
  ],
  finish: { title: '你把神經反射弄懂了！', rule: '受器 → 感覺神經 → 中樞 → 運動神經 → 動器。反射的中樞在脊髓、不經大腦，比較快；意識動作要經大腦判斷，比較慢。', next: { label: '去體內恆定實驗桌', href: '../homeostasis/' } }
});
