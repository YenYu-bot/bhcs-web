// 細胞分裂實驗桌：每個階段的細胞數、每個細胞的染色體數、DNA 相對量全部來自 scripts/science/models.mjs 的 calculate('cell-division')。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('cell-division', { type: s.type, n2: String(s.n2), stage: s.stage });
const TYPE = { mitosis: '有絲分裂', meiosis: '減數分裂' };
const SHORT = { mitosis: ['複製前', '複製後', '前期', '中期', '後期', '末期'], meiosis: ['複製前', '複製後', 'Ⅰ中期', 'Ⅰ結束', 'Ⅱ中期', 'Ⅱ結束'] };
const COL = [['#B0302A', '#EE8A80'], ['#24548A', '#7FB2E5'], ['#2E7A54', '#8CD0AE'], ['#7A4A9E', '#C9A6E4']];

const INK = '#23304A', ANG = i => i * 60, POLE = '#E8892E';
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const n1 = v => v.toFixed(1);
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('radialGradient', 'cd-cyto', [[0, '#FFF6EE'], [.7, '#FBE4D6'], [1, '#F2C8B6']], { cx: .42, cy: .38, r: .7 });
  g('radialGradient', 'cd-nuc', [[0, '#F4EEFB'], [.8, '#E2D6F2'], [1, '#CDBBE6']], { cx: .4, cy: .35, r: .7 });
  g('radialGradient', 'cd-knob', [[0, '#F7FAFD'], [.6, '#AEB8C8'], [1, '#5F6A7E']], { cx: .35, cy: .3, r: .8 });
}
// 染色分體：一根兩端圓的棒子，中間略彎；(x, y) 是著絲點，rot 是方向（度），bend 是兩端往外彎多少
function chromatid(el, g, x, y, h, w, bend, color, rot = 0) {
  const q = el('g', { transform: `rotate(${rot} ${n1(x)} ${n1(y)})` }, g), d = `M${n1(x + bend)} ${n1(y - h / 2)}Q${n1(x - bend * .6)} ${n1(y)} ${n1(x + bend)} ${n1(y + h / 2)}`;
  el('path', { d, fill: 'none', stroke: '#1E2638', 'stroke-width': w + 2.2, 'stroke-linecap': 'round', opacity: .55 }, q);
  el('path', { d, fill: 'none', stroke: color[0], 'stroke-width': w, 'stroke-linecap': 'round' }, q);
  el('path', { d: `M${n1(x + bend - w * .22)} ${n1(y - h / 2 + w * .2)}Q${n1(x - bend * .6 - w * .22)} ${n1(y)} ${n1(x + bend - w * .22)} ${n1(y + h / 2 - w * .2)}`, fill: 'none', stroke: color[1], 'stroke-width': w * .32, 'stroke-linecap': 'round', opacity: .9 }, q);
  return q;
}
// 一條染色體：已複製畫成兩條姊妹染色分體在著絲點相連，未複製畫成一根
function chromosome(el, g, x, y, color, replicated, h = 34, rot = 0) {
  const w = h * .27;
  if (replicated) { chromatid(el, g, x - w * .48, y, h, w, -w * .5, color, rot); chromatid(el, g, x + w * .48, y, h, w, w * .5, color, rot); el('circle', { cx: x, cy: y, r: w * .42, fill: '#1E2638', opacity: .7 }, g); }
  else chromatid(el, g, x, y, h, w, w * .35, color, rot);
}
// 細胞：膜有一點不規則、細胞質有顆粒
function cell(el, g, cx, cy, rx, ry, seed, waist = 0) {
  let d = ''; const N = 48; for (let i = 0; i <= N; i++) { const a = i / N * 2 * Math.PI, wob = 1 + .018 * Math.sin(a * 5 + seed) + .012 * Math.sin(a * 9 + seed * 2), pinch = 1 - waist * Math.pow(Math.cos(a), 2) * 0 - waist * Math.pow(Math.sin(a), 8) * 0;
    const xx = cx + rx * wob * Math.cos(a), yy = cy + ry * wob * Math.sin(a) * (1 - waist * Math.pow(Math.cos(a), 2)); d += `${i ? 'L' : 'M'}${n1(xx)} ${n1(yy)}`; void pinch; }
  el('path', { d: d + 'Z', fill: '#000', opacity: .1, transform: 'translate(3 5)' }, g);
  el('path', { d: d + 'Z', fill: 'url(#cd-cyto)', stroke: '#C9805E', 'stroke-width': 3 }, g);
  let dots = ''; for (let i = 0; i < Math.round(rx * ry / 260); i++) { const a = rnd(seed, i) * 6.28, rr = Math.sqrt(rnd(i, seed + 1)) * .86; dots += `M${n1(cx + rx * rr * Math.cos(a))} ${n1(cy + ry * rr * Math.sin(a))}h.1`; }
  el('path', { d: dots, stroke: '#E4AE96', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .55 }, g);
}
function nucleus(el, g, cx, cy, r, fading) {
  el('circle', { cx, cy, r, fill: fading ? 'none' : 'url(#cd-nuc)', stroke: '#8E74B8', 'stroke-width': 2.5, 'stroke-dasharray': fading ? '6 7' : null, opacity: fading ? .7 : 1 }, g);
  if (!fading) el('circle', { cx: cx + r * .3, cy: cy - r * .25, r: r * .16, fill: '#A58CC9', opacity: .6 }, g);
}
// 染色質：還沒濃縮的細絲（複製後是兩條並排）
function chromatin(el, g, cx, cy, r, color, seed, doubled) {
  const pts = []; let x = cx + (rnd(seed, 1) - .5) * r * .9, y = cy + (rnd(seed, 2) - .5) * r * .9, a = rnd(seed, 3) * 6.28;
  for (let k = 0; k < 9; k++) { a += (rnd(seed, k + 4) - .5) * 2.2; x += Math.cos(a) * r * .2; y += Math.sin(a) * r * .2; const dd = Math.hypot(x - cx, y - cy); if (dd > r * .72) { x = cx + (x - cx) * r * .72 / dd; y = cy + (y - cy) * r * .72 / dd; a += Math.PI * .8; } pts.push([x, y]); }
  for (const off of doubled ? [-1.3, 1.3] : [0]) { let d = `M${n1(pts[0][0] + off)} ${n1(pts[0][1])}`; for (let k = 1; k < pts.length - 1; k++) d += `Q${n1(pts[k][0] + off)} ${n1(pts[k][1] + off * .5)} ${n1((pts[k][0] + pts[k + 1][0]) / 2 + off)} ${n1((pts[k][1] + pts[k + 1][1]) / 2 + off * .5)}`;
    el('path', { d, fill: 'none', stroke: color[0], 'stroke-width': 1.9, 'stroke-linecap': 'round', opacity: .8 }, g); }
}
function centrosome(el, g, x, y) {
  let d = ''; for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28; d += `M${x} ${y}l${n1(Math.cos(a) * 14)} ${n1(Math.sin(a) * 14)}`; }
  el('path', { d, stroke: POLE, 'stroke-width': 1.2, opacity: .7 }, g); el('circle', { cx: x - 3, cy: y, r: 3.5, fill: POLE }, g); el('circle', { cx: x + 3, cy: y + 2, r: 3.5, fill: POLE }, g);
}
const spindle = (el, g, px, py, targets) => { let d = ''; for (const [x, y] of targets) d += `M${n1(px)} ${n1(py)}Q${n1((px + x) / 2)} ${n1((py + y) / 2 + (y - py) * .05)} ${n1(x)} ${n1(y)}`; el('path', { d, fill: 'none', stroke: '#9AA3B2', 'stroke-width': 1.2, opacity: .8 }, g); };

function drawCell(el, rig, s, r, c, cx, cy, rx, ry) {
  const pairs = s.n2 / 2, st = s.stage, me = s.type === 'meiosis', H = Math.min(38, ry * .36);
  const list = []; for (let p = 0; p < pairs; p++) { if (me && st >= 3) list.push([p, me && st === 5 ? (c >> 1 + p) % 2 : (c + p) % 2]); else { list.push([p, 0]); list.push([p, 1]); } }
  const col = ([p, h]) => COL[p][h] === COL[p][0] ? [COL[p][0], COL[p][1]] : [COL[p][1], '#FFFFFF'];
  const anaphase = !me && st === 4;
  cell(el, rig, cx, cy, anaphase ? rx * 1.08 : rx, ry, c * 3 + st, anaphase ? .22 : 0);
  // 間期與分裂結束：有細胞核，染色體是細絲
  if (st <= 1 || (me ? st === 5 : st === 5)) { const nr = Math.min(rx, ry) * .52; nucleus(el, rig, cx, cy, nr, false); list.forEach((k, i) => chromatin(el, rig, cx, cy, nr, col(k), i * 7 + c + st, r.replicated)); return; }
  const poleY = [cy - ry * .78, cy + ry * .78], vertical = false; void vertical;
  // 紡錘體的兩極在左右
  const PL = [cx - rx * .78, cx + rx * .78];
  if (st === 2 && !me) { nucleus(el, rig, cx, cy, Math.min(rx, ry) * .55, true); list.forEach((k, i) => { const a = i * 2.4 + .5; chromosome(el, rig, cx + Math.cos(a) * rx * .26, cy + Math.sin(a) * ry * .3, col(k), true, H, i * 35 - 30); });
    centrosome(el, rig, PL[0] + rx * .15, cy - ry * .25); centrosome(el, rig, PL[1] - rx * .15, cy + ry * .25); return; }
  centrosome(el, rig, PL[0], cy); centrosome(el, rig, PL[1], cy);
  if (anaphase) { // 姊妹染色分體分開，往兩極
    const h = Math.min(H * .78, ry * 1.5 / list.length / 1.5), pts = []; list.forEach((k, i) => { const y = cy - (list.length - 1) * h * .75 + i * h * 1.5; for (const sd of [-1, 1]) { const x = cx + sd * rx * .4; pts.push([x, y, sd]); chromatid(el, rig, x, y, h, h * .27, -sd * h * .3, col(k), 0); } });
    spindle(el, rig, PL[0], cy, pts.filter(p => p[2] < 0)); spindle(el, rig, PL[1], cy, pts.filter(p => p[2] > 0)); return; }
  if (me && st === 2) { // 同源染色體配對，排在赤道兩側
    const h = Math.min(H * .85, ry * 1.4 / pairs / 1.6), pts = []; for (let p = 0; p < pairs; p++) { const y = cy - (pairs - 1) * h * .8 + p * h * 1.6; for (const [hh, sd] of [[0, -1], [1, 1]]) { const x = cx + sd * h * .36; chromosome(el, rig, x, y, col([p, hh]), true, h, 0); pts.push([x, y, sd]); } }
    spindle(el, rig, PL[0], cy, pts.filter(p => p[2] < 0)); spindle(el, rig, PL[1], cy, pts.filter(p => p[2] > 0)); return; }
  // 中期（有絲分裂中期、減數第一次分裂後、第二次分裂中期）：染色體排在赤道
  const lined = (!me && st === 3) || (me && st === 4), pts = [];
  const h = lined ? Math.min(H * .8, ry * 1.45 / list.length / 1.45) : H * .85; list.forEach((k, i) => { const y = lined ? cy - (list.length - 1) * h * .725 + i * h * 1.45 : cy + (i - (list.length - 1) / 2) * ry * .42 + (rnd(c, i) - .5) * 10, x = lined ? cx : cx + (i % 2 ? .22 : -.22) * rx + (rnd(i, c) - .5) * rx * .15; chromosome(el, rig, x, y, col(k), true, h, lined ? 0 : 20 + i * 40); pts.push([x - h * .2, y], [x + h * .2, y]); });
  if (lined) { spindle(el, rig, PL[0], cy, pts.filter((p, i) => i % 2 === 0)); spindle(el, rig, PL[1], cy, pts.filter((p, i) => i % 2 === 1)); el('path', { d: `M${cx} ${cy - ry * .82}V${cy + ry * .82}`, stroke: '#C8372D', 'stroke-width': 1.2, 'stroke-dasharray': '4 5', opacity: .6 }, rig); }
}

function scene({ rig, el, txt, s, r, step, set, drag, hint, kind }) {
  defs(el, rig);
  const d = el('defs', {}, rig), mk = el('marker', { id: 'cd-a', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#5A6478' }, mk);
  txt(rig, 610, 118, `${TYPE[s.type]}・${r.stageName}`, { 'font-size': 20 });
  // 細胞
  const AX = 300, AW = 620, AY = 140, AH = 300, n = r.cells;
  const slots = n === 1 ? [[AX + AW / 2, AY + AH / 2, 210, 130]] : n === 2 ? [[AX + AW * .27, AY + AH / 2, 148, 118], [AX + AW * .73, AY + AH / 2, 148, 118]] : [0, 1, 2, 3].map(i => [AX + AW * (i % 2 ? .73 : .27), AY + AH * (i < 2 ? .26 : .76), 132, 68]);
  slots.forEach(([cx, cy, rx, ry], c) => { drawCell(el, rig, s, r, c, cx, cy, rx, ry); });
  const lab = n === 4 ? `每個細胞 ${r.perCell} 條（共 4 個細胞）` : `每個細胞 ${r.perCell} 條${n > 1 ? `（共 ${n} 個細胞）` : ''}`;
  el('rect', { x: AX + AW / 2 - 150, y: AY + AH + 12, width: 300, height: 30, rx: 15, fill: '#FFFDF2', opacity: .95 }, rig); txt(rig, AX + AW / 2, AY + AH + 32, lab, { 'font-size': 15 });
  // 細胞週期轉盤：轉指針選階段
  const CX = 165, CY = 290, R = 92, can = kind === 'observe' && (step === 'mitosis' || step === 'meiosis');
  el('circle', { cx: CX + 3, cy: CY + 5, r: R + 8, fill: '#000', opacity: .14 }, rig);
  el('circle', { cx: CX, cy: CY, r: R + 8, fill: '#FFF8EC', stroke: INK, 'stroke-width': 3 }, rig);
  SHORT[s.type].forEach((t, i) => { const a0 = (ANG(i) - 30) * Math.PI / 180, a1 = (ANG(i) + 30) * Math.PI / 180, on = i === s.stage, inter = i < 2;
    el('path', { d: `M${CX} ${CY}L${n1(CX + R * Math.sin(a0))} ${n1(CY - R * Math.cos(a0))}A${R} ${R} 0 0 1 ${n1(CX + R * Math.sin(a1))} ${n1(CY - R * Math.cos(a1))}Z`, fill: on ? (inter ? '#BFE3C8' : '#C7D8F2') : inter ? '#EAF6EC' : '#EEF3FB', stroke: '#FFF8EC', 'stroke-width': 3 }, rig);
    const am = ANG(i) * Math.PI / 180; txt(rig, CX + R * .66 * Math.sin(am), CY - R * .66 * Math.cos(am) + 5, t, { 'font-size': 13, fill: on ? INK : '#5A6478' }); });
  el('circle', { cx: CX, cy: CY, r: R * .3, fill: '#FFF8EC', stroke: INK, 'stroke-width': 2 }, rig);
  txt(rig, CX, CY + 5, s.type === 'mitosis' ? '有絲' : '減數', { 'font-size': 13 });
  const hand = el('g', { transform: `rotate(${ANG(s.stage)} ${CX} ${CY})` }, rig);
  el('path', { d: `M${CX - 11} ${CY - R - 26}L${CX} ${CY - R - 6}L${CX + 11} ${CY - R - 26}Z`, fill: '#C8372D', stroke: INK, 'stroke-width': 2 }, hand);
  el('path', { d: `M${CX} ${CY - R * .3}V${CY - R * .48}`, stroke: '#C8372D', 'stroke-width': 4, 'stroke-linecap': 'round' }, hand);
  txt(rig, CX, CY - R - 40, '細胞週期轉盤', { 'font-size': 14, fill: '#5A6478' });
  if (can) { const hit = el('circle', { cx: CX, cy: CY, r: R + 8, fill: 'transparent', 'data-drag': 'wheel' }, rig);
    drag(hit, () => { let a = ANG(s.stage); return { move(p) { a = Math.atan2(p.x - CX, CY - p.y) * 180 / Math.PI; if (a < -30) a += 360; hand.setAttribute('transform', `rotate(${a} ${CX} ${CY})`); },
      end() { const v = ((Math.round(a / 60) % 6) + 6) % 6; if (v !== s.stage) set({ stage: v }); else hand.setAttribute('transform', `rotate(${ANG(s.stage)} ${CX} ${CY})`); }, cancel() { hand.setAttribute('transform', `rotate(${ANG(s.stage)} ${CX} ${CY})`); } }; },
      { label: '轉到下一個階段', tap: () => set({ stage: (s.stage + 1) % 6 }) }); }
  // DNA 相對量折線
  const gx = 150, gy = 584, gw = 740;
  el('rect', { x: gx - 30, y: gy - 96, width: gw + 60, height: 120, rx: 14, fill: 'rgba(255,255,255,.95)', stroke: INK, 'stroke-width': 2.5 }, rig);
  txt(rig, gx - 12, gy - 72, '每個細胞的 DNA 相對量', { 'text-anchor': 'start', 'font-size': 13, fill: '#5A6478' });
  const pts = r.dnaSeries.map((v, i) => [gx + i * gw / 5, gy - 10 - v * 13]);
  el('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: '#2F6FB0', 'stroke-width': 3, 'stroke-linejoin': 'round' }, rig);
  pts.forEach(([x, y], i) => { el('circle', { cx: x, cy: y, r: i === s.stage ? 8 : 5, fill: i === s.stage ? '#C8372D' : '#2F6FB0', stroke: '#fff', 'stroke-width': 2 }, rig); txt(rig, x, gy + 16, SHORT[s.type][i], { 'font-size': 12, fill: '#5A6478' }); });
  hint(165, 452, can ? '轉指針選階段' : '');
}

const tgt = (sig, label, type, stage, aim) => ({ sig, label, aim, set: { type, n2: 4, stage },
  title: (s, r) => `${TYPE[s.type]}・${SHORT[s.type][s.stage]}`, body: (s, r) => `${r.cells} 個細胞，每個 ${r.perCell} 條染色體${r.replicated ? '（已複製）' : ''}` });
const stages = type => ({ key: 'stage', label: '階段', type: 'seg', cols: 3, options: SHORT[type].map((t, i) => [i, t]) });

runDesk({
  key: 'bhcs.lab.cell-division.v1', title: '細胞分裂實驗桌', background: 'bg-chem-bench',
  sceneLabel: '細胞分裂實驗桌：左邊是細胞週期轉盤，轉指針選階段；右邊是這個階段的細胞，同一對同源染色體用同一個顏色的深淺兩色，分裂時看得到紡錘絲；下方是每個細胞 DNA 相對量的變化',
  initial: { type: 'mitosis', n2: 4, stage: 0 },
  model, scene, viewBox: { desk: '50 90 900 520', phone: '50 90 900 520' }, phoneText: 1.4,
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
