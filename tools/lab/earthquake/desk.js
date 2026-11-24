// 板塊與地震實驗桌：到達時間與測站距離來自 ./model.mjs（P 波 6 km/s、S 波 3 km/s 的簡化值）。
import { quake, BOUNDARY, EPIC, STATIONS, VP, VS } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const f = x => String(Math.round(x * 10) / 10);
const n1 = v => (+v).toFixed(1);
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
// 測站離震央的距離在畫面上的位置（震波步驟）
const KM = 3.4, EX = 200, DISTS = [60, 120, 180], dx2km = x => (x - EX) / KM;
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('linearGradient', 'eq-mantle', [[0, '#F2A65A'], [.5, '#E0703C'], [1, '#B8402A']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'eq-sea', [[0, '#7CC0EA'], [1, '#2F6FB0']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'eq-sky', [[0, '#BFE0F7'], [1, '#EAF5FC']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'eq-ocean', [[0, '#5D6B7E'], [1, '#3D4858']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'eq-cont', [[0, '#C9A877'], [.5, '#A9875A'], [1, '#86693F']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('radialGradient', 'eq-magma', [[0, '#FFF2A8'], [.4, '#FFB23A'], [1, '#E0482A', 0]]);
  g('radialGradient', 'eq-glow', [[0, '#FFE680', .9], [1, '#FFB000', 0]]);
  for (const [k, c] of [['r', '#C8372D'], ['w', '#FFF3E0']]) { const m = el('marker', { id: 'eq-' + k, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 3.2, markerHeight: 3.2, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: c }, m); }
  return d;
}
// 有層理的岩石：先填色，再在裡面畫幾條起伏的紋路
let rid = 0;
function rock(el, g, d, fill, line = 'rgba(0,0,0,.16)', x0 = 100, x1 = 900, y0 = 150, y1 = 520, gap = 13) {
  const q = el('g', {}, g), id = 'eq-rk' + (++rid), cp = el('clipPath', { id }, el('defs', {}, q)); el('path', { d }, cp);
  el('path', { d, fill }, q);
  const t = el('g', { 'clip-path': `url(#${id})` }, q); let p = '';
  for (let y = y0, k = 0; y < y1; y += gap, k++) { p += `M${x0} ${y}`; for (let x = x0; x <= x1; x += 40) p += `Q${x + 20} ${n1(y + (rnd(k, x) - .5) * 6)} ${x + 40} ${n1(y + (rnd(k + 1, x) - .5) * 4)}`; }
  el('path', { d: p, fill: 'none', stroke: line, 'stroke-width': 1.6 }, t);
  for (let i = 0; i < 26; i++) el('circle', { cx: n1(x0 + rnd(i, 3) * (x1 - x0)), cy: n1(y0 + rnd(i, 4) * (y1 - y0)), r: n1(1.2 + rnd(i, 5) * 1.6), fill: 'rgba(255,255,255,.18)' }, t);
  el('path', { d, fill: 'none', stroke: '#23304A', 'stroke-width': 3, 'stroke-linejoin': 'round' }, q);
  return q;
}
const arrow = (el, g, d) => { el('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': 11, opacity: .75, 'stroke-linecap': 'round' }, g); el('path', { d, fill: 'none', stroke: '#C8372D', 'stroke-width': 6, 'stroke-linecap': 'round', 'marker-end': 'url(#eq-r)' }, g); };
const star = (el, g, x, y, r = 10) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; d += `${i ? 'L' : 'M'}${n1(x + rr * Math.cos(a))} ${n1(y + rr * Math.sin(a))}`; }
  el('circle', { cx: x, cy: y, r: r * 1.7, fill: 'url(#eq-glow)' }, g); return el('path', { d: d + 'Z', fill: '#FFD23F', stroke: '#B8401F', 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, g); };
let K = 1;
const pill = (el, txt, g, x, y, w, t, { stroke = 'none', ...o } = {}) => { w *= K; el('rect', { x: x - w / 2, y: y - 9 - 8 * K, width: w, height: 14 + 12 * K, rx: 13, fill: 'rgba(255,255,255,.92)', stroke, 'stroke-width': 1.5 }, g); txt(g, x, y + 1, t, { 'font-size': 14, ...o }); };
function tree(el, g, x, y, s = 1) { el('path', { d: `M${x} ${y}v${-10 * s}`, stroke: '#6B4A2C', 'stroke-width': 3 * s }, g); el('path', { d: `M${n1(x - 9 * s)} ${n1(y - 8 * s)}L${x} ${n1(y - 30 * s)}L${n1(x + 9 * s)} ${n1(y - 8 * s)}Z`, fill: '#3F7F3A', stroke: '#285A27', 'stroke-width': 1 }, g); }

function boundaryScene({ rig, el, txt, s, r, set, drag, hint, kind }) {
  const can = kind === 'observe', B = s.boundary, cp = el('clipPath', { id: 'eq-bd' }, el('defs', {}, rig)); el('rect', { x: 110, y: 110, width: 780, height: 390, rx: 16 }, cp);
  const g = el('g', { 'clip-path': 'url(#eq-bd)' }, rig);
  let right;
  if (B === 'transform') {
    // 從上往下看：兩個板塊左右並排，右邊的往下錯開
    el('rect', { x: 110, y: 110, width: 390, height: 390, fill: '#C8D79A' }, g);
    for (let i = 0; i < 16; i++) el('ellipse', { cx: n1(130 + rnd(i, 1) * 360), cy: n1(130 + rnd(i, 2) * 350), rx: n1(20 + rnd(i, 3) * 30), ry: n1(10 + rnd(i, 4) * 16), fill: i % 2 ? '#B7C886' : '#D6DFA8', opacity: .8 }, g);
    right = el('g', {}, g); const off = 64;
    el('rect', { x: 500, y: 40, width: 400, height: 540, fill: '#D7C994' }, right);
    for (let i = 0; i < 16; i++) el('ellipse', { cx: n1(520 + rnd(i, 6) * 360), cy: n1(100 + rnd(i, 7) * 420), rx: n1(20 + rnd(i, 8) * 30), ry: n1(10 + rnd(i, 9) * 16), fill: i % 2 ? '#C8B878' : '#E3D7A8', opacity: .8 }, right);
    const river = y => `M110 ${y}C200 ${y - 30} 300 ${y + 30} 400 ${y}S470 ${y} 500 ${y}`, river2 = y => `M500 ${y}C560 ${y + 14} 640 ${y - 34} 740 ${y}S860 ${y + 20} 900 ${y}`;
    el('path', { d: river(250), fill: 'none', stroke: '#4E95D0', 'stroke-width': 12, 'stroke-linecap': 'round' }, g);
    el('path', { d: river2(250 + off), fill: 'none', stroke: '#4E95D0', 'stroke-width': 12 }, right);
    el('path', { d: 'M110 410H500', stroke: '#6E6A64', 'stroke-width': 14 }, g); el('path', { d: 'M110 410H500', stroke: '#F4F1E6', 'stroke-width': 2, 'stroke-dasharray': '12 10' }, g);
    el('path', { d: `M500 ${410 + off}H900`, stroke: '#6E6A64', 'stroke-width': 14 }, right); el('path', { d: `M500 ${410 + off}H900`, stroke: '#F4F1E6', 'stroke-width': 2, 'stroke-dasharray': '12 10' }, right);
    for (const [x, y] of [[180, 180], [380, 340], [260, 470], [430, 160]]) tree(el, g, x, y, .9);
    for (const [x, y] of [[620, 200], [800, 380], [700, 540], [850, 170]]) tree(el, right, x, y, .9);
    let z = 'M500 110'; for (let y = 110; y <= 500; y += 26) z += `L${500 + (y / 26 % 2 ? 6 : -6)} ${y}`;
    el('path', { d: z, fill: 'none', stroke: '#C8372D', 'stroke-width': 4 }, rig);
    arrow(el, g, 'M300 380V200'); arrow(el, right, 'M700 200V380');
    for (const y of [180, 320, 450]) star(el, g, 500, y, 9);
    pill(el, txt, g, 260, 140, 130, '從上往下看', { fill: '#5A6478' });
    pill(el, txt, g, 690, 140, 250, '河流和道路被錯開了', { fill: '#23304A' });
  } else {
    el('rect', { x: 110, y: 110, width: 780, height: 390, fill: 'url(#eq-mantle)' }, g);
    // 地函的對流
    const cv = el('g', { opacity: .45 }, g);
    if (B === 'divergent') for (const sx of [-1, 1]) el('path', { d: `M${500 + sx * 20} 470Q${500 + sx * 30} 380 ${500 + sx * 200} 380`, fill: 'none', stroke: '#FFF3E0', 'stroke-width': 5, 'marker-end': 'url(#eq-w)' }, cv);
    txt(g, B === 'divergent' ? 200 : 210, 480, '地函', { 'font-size': 15, fill: '#FFF3E0', 'font-weight': 800 });
    if (B === 'divergent') {
      el('rect', { x: 110, y: 110, width: 780, height: 40, fill: 'url(#eq-sky)' }, g);
      el('path', { d: 'M110 150H890V320H110Z', fill: 'url(#eq-sea)' }, g);
      el('path', { d: 'M110 150Q200 145 300 150T500 150T700 150T890 150', fill: 'none', stroke: '#fff', 'stroke-width': 2.5, opacity: .7 }, g);
      el('path', { d: 'M500 470C480 420 470 360 484 300L500 248L516 300C530 360 520 420 500 470Z', fill: 'url(#eq-magma)' }, g);
      el('path', { d: 'M500 452C492 400 490 330 500 252', fill: 'none', stroke: '#FFE680', 'stroke-width': 4, opacity: .8 }, g);
      rock(el, g, 'M110 292L462 254L486 244L488 318L110 352Z', 'url(#eq-ocean)', 'rgba(255,255,255,.12)');
      right = el('g', {}, g);
      rock(el, right, 'M890 292L538 254L514 244L512 318L890 352Z', 'url(#eq-ocean)', 'rgba(255,255,255,.12)');
      arrow(el, g, 'M390 220H250'); arrow(el, right, 'M610 220H750');
      for (const [x, y] of [[476, 280], [524, 290], [500, 306]]) star(el, g, x, y, 9);
      pill(el, txt, g, 500, 186, 210, '岩漿湧出，形成新地殼', { fill: '#B8401F' });
      txt(g, 290, 330, '海洋板塊', { 'font-size': 14, fill: '#fff' }); txt(right, 710, 330, '海洋板塊', { 'font-size': 14, fill: '#fff' });
    } else {
      el('rect', { x: 110, y: 110, width: 780, height: 120, fill: 'url(#eq-sky)' }, g);
      el('path', { d: 'M110 176H560V240L500 266L110 260Z', fill: 'url(#eq-sea)' }, g);
      el('path', { d: 'M110 176Q200 171 300 176T500 176L560 176', fill: 'none', stroke: '#fff', 'stroke-width': 2.5, opacity: .7 }, g);
      rock(el, g, 'M110 258L496 266Q560 272 620 330L780 520L700 520L560 356Q522 318 470 314L110 306Z', 'url(#eq-ocean)', 'rgba(255,255,255,.12)');
      // 下沉板塊在深處熔融，岩漿往上
      el('path', { d: 'M700 440C690 380 712 320 722 230', fill: 'none', stroke: '#FFB23A', 'stroke-width': 8, opacity: .85, 'stroke-linecap': 'round' }, g);
      el('circle', { cx: 700, cy: 446, r: 26, fill: 'url(#eq-magma)' }, g);
      right = el('g', {}, g);
      rock(el, right, 'M500 264Q556 230 612 226L900 218V384L668 384L620 330Q560 272 500 264Z', 'url(#eq-cont)', 'rgba(80,50,20,.18)');
      el('path', { d: 'M560 238Q600 196 630 224Q660 170 690 214L722 226L760 222Q800 180 840 220L900 214V232L560 246Z', fill: '#7FA05A', stroke: '#4F6E35', 'stroke-width': 2 }, right);
      el('path', { d: 'M690 228L716 166H732L760 228Z', fill: '#7A5A3A', stroke: '#23304A', 'stroke-width': 2.5 }, right);
      el('path', { d: 'M716 168Q724 178 732 168', fill: 'none', stroke: '#E4573F', 'stroke-width': 5 }, right);
      for (const [x, y, rr] of [[728, 150, 9], [740, 134, 12], [756, 118, 14]]) el('circle', { cx: x, cy: y, r: rr, fill: '#9AA3AE', opacity: .75 }, right);
      arrow(el, g, 'M200 230H330'); arrow(el, right, 'M870 340H770');
      el('path', { d: 'M704 386C700 330 716 280 724 226', fill: 'none', stroke: '#FFB23A', 'stroke-width': 7, opacity: .9, 'stroke-linecap': 'round' }, right);
      for (const [x, y] of [[520, 284], [575, 318], [640, 386], [700, 470]]) star(el, g, x, y, 9);
      txt(right, 786, 210, '火山', { 'font-size': 14, fill: '#23304A' });
      el('path', { d: 'M500 212V256', stroke: '#23304A', 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }, g); pill(el, txt, g, 500, 204, 60, '海溝');
      txt(g, 260, 292, '海洋板塊', { 'font-size': 14, fill: '#fff' }); txt(right, 800, 300, '大陸板塊', { 'font-size': 14, fill: '#4A3212' });
      pill(el, txt, g, 360, 410, 250, '震源沿著下沉的板塊越來越深', { fill: '#B8401F' });
    }
  }
  el('rect', { x: 110, y: 110, width: 780, height: 390, rx: 16, fill: 'none', stroke: '#23304A', 'stroke-width': 3 }, rig);
  const R = r.B; pill(el, txt, rig, 500, 98, 360, `${R.name}：${R.move}`, { 'font-size': 17, stroke: '#23304A' });
  txt(rig, 500, 526, `常見地形：${R.feature}　地震：${R.depth}　★ 是震源`, { 'font-size': 15 });
  if (can) {
    const [hx, hy, hw, hh] = B === 'transform' ? [520, 130, 360, 360] : B === 'divergent' ? [530, 240, 350, 110] : [600, 230, 280, 150];
    el('rect', { x: hx, y: hy, width: hw, height: hh, fill: 'transparent', 'data-drag': 'plate' }, right);
    drag(right, p0 => { let dx = 0, dy = 0; return {
      move(p) { dx = Math.max(-60, Math.min(60, p.x - p0.x)); dy = Math.max(-60, Math.min(60, p.y - p0.y)); right.setAttribute('transform', `translate(${n1(dx * .5)} ${n1(dy * .5)})`); },
      end() { const v = Math.abs(dy) > Math.abs(dx) ? (Math.abs(dy) > 16 ? 'transform' : null) : dx > 16 ? 'divergent' : dx < -16 ? 'convergent' : null; if (v && v !== B) set({ boundary: v }); else right.removeAttribute('transform'); },
      cancel() { right.removeAttribute('transform'); } }; },
      { label: '移動右邊的板塊，換下一種邊界', tap: () => set({ boundary: { divergent: 'convergent', convergent: 'transform', transform: 'divergent' }[B] }) });
  }
  hint(500, 562, '拖右邊的板塊：往右拉開、往左推擠、往下錯開');
}

function waveScene({ rig, el, txt, s, r, set, drag, hint, kind }) {
  const can = kind === 'observe';
  // 上：地面與距離尺
  const cp = el('clipPath', { id: 'eq-gr' }, el('defs', {}, rig)); el('rect', { x: 150, y: 104, width: 760, height: 120, rx: 16 }, cp);
  const g = el('g', { 'clip-path': 'url(#eq-gr)' }, rig);
  el('rect', { x: 150, y: 104, width: 760, height: 70, fill: 'url(#eq-sky)' }, g);
  rock(el, g, 'M150 174H910V224H150Z', 'url(#eq-cont)', 'rgba(80,50,20,.2)', 150, 910, 170, 230, 10);
  el('path', { d: 'M150 174H910', stroke: '#5E8F45', 'stroke-width': 6 }, g);
  for (const x of [260, 330, 470, 540, 700, 760, 880]) tree(el, g, x, 174, .75);
  star(el, g, EX, 176, 11);
  el('rect', { x: 150, y: 104, width: 760, height: 120, rx: 16, fill: 'none', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, EX, 246, '震央', { 'font-size': 13, fill: '#B8401F' });
  for (const d of [0, 30, 60, 90, 120, 150, 180]) { const x = EX + d * KM; el('line', { x1: x, y1: 228, x2: x, y2: d % 60 ? 233 : 238, stroke: '#5A6478', 'stroke-width': 1.5 }, rig); if (d && !(d % 60)) txt(rig, x, 250, `${d} km`, { 'font-size': 12, fill: s.dist === d ? '#23304A' : '#8792A6', 'font-weight': s.dist === d ? 800 : 500 }); }
  const sx = EX + s.dist * KM, sg = el('g', { 'data-drag': can ? 'station' : null }, rig), sm = el('g', {}, sg);
  el('rect', { x: sx - 30, y: 110, width: 60, height: 66, fill: 'transparent' }, sg);
  el('path', { d: `M${sx - 18} 174V150L${sx} 136L${sx + 18} 150V174Z`, fill: '#F7F3EA', stroke: '#23304A', 'stroke-width': 2.5 }, sm);
  el('rect', { x: sx - 8, y: 156, width: 16, height: 18, fill: '#2F6FB0' }, sm);
  el('path', { d: `M${sx - 20} 150L${sx} 133L${sx + 20} 150`, fill: 'none', stroke: '#C8372D', 'stroke-width': 4, 'stroke-linejoin': 'round' }, sm);
  el('path', { d: `M${sx} 133V118M${sx - 6} 120h12`, stroke: '#23304A', 'stroke-width': 2 }, sm);
  if (can) drag(sg, p0 => { let x = sx; return {
    move(p) { x = Math.max(EX + 40 * KM, Math.min(EX + 190 * KM, sx + p.x - p0.x)); sm.setAttribute('transform', `translate(${n1(x - sx)} 0)`); },
    end() { const v = DISTS.reduce((m, d) => Math.abs(d - dx2km(x)) < Math.abs(m - dx2km(x)) ? d : m); if (v !== s.dist) set({ dist: v }); else sm.removeAttribute('transform'); },
    cancel() { sm.removeAttribute('transform'); } }; },
    { label: '把測站移到更遠的地方', tap: () => set({ dist: DISTS[(DISTS.indexOf(s.dist) + 1) % 3] }) });
  // 下：震波紀錄紙
  const X0 = 196, X1 = 880, Y = 388, T = 70, tx = t => X0 + (X1 - X0) * t / T;
  el('rect', { x: 150, y: 262, width: 760, height: 262, rx: 16, fill: '#FFFDF6', stroke: '#23304A', 'stroke-width': 3 }, rig);
  let grid = ''; for (let t = 0; t <= T; t += 5) grid += `M${n1(tx(t))} 306V470`; for (let y = 306; y <= 470; y += 20.5) grid += `M${X0} ${n1(y)}H${X1}`;
  el('path', { d: grid, stroke: '#F2C8B8', 'stroke-width': 1 }, rig);
  txt(rig, 530, 287, `測站離震央 ${s.dist} km 的震波紀錄`, { 'font-size': 15 });
  let d = `M${X0} ${Y}`; for (let t = 0; t <= T; t += .2) { const a = t < r.tp ? .8 : t < r.ts ? 18 * Math.exp(-(t - r.tp) / 14) + 4 : 66 * Math.exp(-(t - r.ts) / 16) + 5; d += `L${n1(tx(t))} ${n1(Y + a * Math.sin(t * 5.3 + Math.sin(t * 1.7) * 2) * (t < r.tp ? 1 : .85 + .15 * Math.sin(t * 13)))}`; }
  el('path', { d, fill: 'none', stroke: '#1F2A44', 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, rig);
  const mark = (t, name, col) => { el('path', { d: `M${n1(tx(t))} ${Y - 56}V${Y + 82}`, stroke: col, 'stroke-width': 3, 'stroke-dasharray': '7 6' }, rig); pill(el, txt, rig, tx(t), Y - 66, 100, `${name} ${f(t)} 秒`, { fill: col, stroke: col }); };
  mark(r.tp, 'P 波', '#2F6FB0'); mark(r.ts, 'S 波', '#C8372D');
  el('path', { d: `M${n1(tx(r.tp))} ${Y + 86}H${n1(tx(r.ts))}`, stroke: '#2E8B66', 'stroke-width': 5 }, rig);
  txt(rig, (tx(r.tp) + tx(r.ts)) / 2, Y + 104, `相差 ${f(r.lag)} 秒`, { 'font-size': 15, fill: '#2E8B66' });
  for (let t = 0; t <= T; t += 10) txt(rig, tx(t), 512, `${t}`, { 'font-size': 11, fill: '#5A6478' }); txt(rig, 896, 512, '秒', { 'font-size': 11, fill: '#5A6478' });
  hint(530, 548, '把測站沿著地面拖遠一點');
}

function locateScene({ rig, el, txt, s, r, set, drag, hint, kind }) {
  const can = kind === 'observe', O = [200, 100], p = q => [O[0] + q[0], O[1] + q[1]];
  const cp = el('clipPath', { id: 'eq-map' }, el('defs', {}, rig)); el('rect', { x: 180, y: 50, width: 640, height: 520, rx: 14 }, cp);
  const map = el('g', { 'clip-path': 'url(#eq-map)' }, rig);
  el('rect', { x: 180, y: 50, width: 640, height: 520, fill: '#9CCBE8' }, map);
  el('path', { d: 'M180 50H820V485Q760 515 700 495T580 535T430 520T300 555T180 535Z', fill: '#E3E8C4' }, map);
  for (const [cx, cy, rr, c] of [[430, 250, 120, '#D4DDB0'], [430, 250, 80, '#C5D19C'], [430, 250, 42, '#B5C389'], [700, 170, 90, '#D4DDB0'], [700, 170, 50, '#C5D19C']]) { let q = ''; for (let i = 0; i <= 36; i++) { const a = i / 36 * 2 * Math.PI, k = rr * (1 + .14 * Math.sin(a * 3 + cx) + .07 * Math.sin(a * 5)); q += `${i ? 'L' : 'M'}${n1(cx + k * Math.cos(a))} ${n1(cy + k * .8 * Math.sin(a))}`; } el('path', { d: q + 'Z', fill: c, stroke: '#A8B47E', 'stroke-width': 1 }, map); }
  el('path', { d: 'M560 50C560 170 520 230 560 310S620 410 600 480', fill: 'none', stroke: '#6FAED6', 'stroke-width': 6, 'stroke-linecap': 'round' }, map);
  el('path', { d: 'M180 350C260 330 320 370 400 360S520 330 560 310', fill: 'none', stroke: '#6FAED6', 'stroke-width': 4 }, map);
  const COL = ['#C8372D', '#2F6FB0', '#7A4BB5'];
  STATIONS.forEach(([, q], i) => { if (i < s.stations) { const [x, y] = p(q); el('circle', { cx: x, cy: y, r: r.radii[i], fill: COL[i], 'fill-opacity': .07, stroke: COL[i], 'stroke-width': 3.5 }, map);
    const a = -.6 + i * 1.9; el('path', { d: `M${x} ${y}L${n1(x + r.radii[i] * Math.cos(a))} ${n1(y + r.radii[i] * Math.sin(a))}`, stroke: COL[i], 'stroke-width': 1.6, 'stroke-dasharray': '5 4' }, map); } });
  el('rect', { x: 180, y: 50, width: 640, height: 520, rx: 14, fill: 'none', stroke: '#23304A', 'stroke-width': 3 }, rig);
  const E = p(EPIC), M = p(r.mirror);
  if (s.stations >= 2) { star(el, rig, E[0], E[1], 13); if (s.stations === 2) { star(el, rig, M[0], M[1], 13); txt(rig, M[0], M[1] + 30, '？', { 'font-size': 18, fill: '#B8401F' }); txt(rig, E[0], E[1] + 30, '？', { 'font-size': 18, fill: '#B8401F' }); } else txt(rig, E[0], E[1] + 32, '震央', { 'font-size': 15, fill: '#B8401F', 'font-weight': 800 }); }
  STATIONS.forEach(([name, q], i) => { const [x, y] = p(q), on = i < s.stations, sg = el('g', { 'data-drag': can ? `st-${i}` : null, cursor: can ? 'pointer' : null }, rig);
    el('circle', { cx: x, cy: y, r: 24, fill: 'transparent' }, sg);
    el('path', { d: `M${x - 14} ${y + 10}V${y - 4}L${x} ${y - 16}L${x + 14} ${y - 4}V${y + 10}Z`, fill: on ? '#F7F3EA' : '#E3E6EB', stroke: on ? '#23304A' : '#A9B2BF', 'stroke-width': 2.5 }, sg);
    el('rect', { x: x - 6, y: y - 2, width: 12, height: 12, fill: on ? COL[i] : '#C3C9D2' }, sg);
    pill(el, txt, sg, x, y + 34, on ? 104 : 74, `${name}站${on ? ` ${Math.round(r.radii[i])} km` : '（關）'}`, { 'font-size': 13, fill: on ? COL[i] : '#8A93A3' });
    if (can) drag(sg, () => ({ move() {}, end() {}, cancel() {} }), { label: on ? `關掉${name}站` : `打開${name}站`, tap: () => { const n = on ? Math.max(1, i) : i + 1; if (n !== s.stations) set({ stations: n }); } }); });
  pill(el, txt, rig, 500, 600, 470, s.stations === 1 ? '只有一個測站：震央可能在圓上任何一點' : s.stations === 2 ? '兩個測站：兩個圓有兩個交點，還分不出是哪一個' : '三個測站：三個圓只交在一點，那就是震央', { 'font-size': 15, stroke: '#23304A' });
  hint(500, 640, '點灰色的測站把它打開');
}

function scene(api) { rid = 0; K = api.k || 1; defs(api.el, api.rig); return api.step === 'boundary' ? boundaryScene(api) : api.step === 'locate' ? locateScene(api) : waveScene(api); }

const tgt = (sig, label, set, aim, title, body) => ({ sig, label, set, aim, title, body });

runDesk({
  key: 'bhcs.lab.earthquake.v1', title: '板塊與地震實驗桌',
  sceneLabel: '板塊與地震實驗桌：依任務顯示板塊邊界的剖面、測站的震波紀錄，或用三個測站的圓找震央的地圖',
  initial: { boundary: 'divergent', dist: 60, stations: 1 },
  model: quake, scene, viewBox: s => s === 'locate' ? { desk: '150 20 700 650', phone: '150 30 700 640' } : s === 'boundary' ? { desk: '100 70 800 520', phone: '100 70 800 520' } : { desk: '130 90 800 480', phone: '130 90 800 480' }, phoneText: 1.4,
  readouts: (s, r) => [['P 波到達', f(r.tp), '秒', `${s.dist} km ÷ ${VP}`], ['S 波到達', f(r.ts), '秒', `${s.dist} km ÷ ${VS}`], ['P、S 時間差', f(r.lag), '秒', '越遠差越多']],
  why: { title: '板塊與地震', button: '板塊與震波', html: `
    <p class="fn-tip"><b>板塊邊界有三種：</b>張裂（分離）、聚合（推擠）、錯動（水平錯開）。地震和火山大多發生在板塊邊界。台灣位在聚合性邊界。</p>
    <p class="fn-tip"><b>P 波跑得快、先到；S 波比較慢、後到，</b>但搖晃通常比較大。離震央越遠，兩種波到達的時間差越大，所以可以用時間差推算距離。</p>
    <p class="fn-tip"><b>找震央：</b>一個測站只知道「離多遠」，要三個測站各畫一個圓，交在一起的那一點才是震央。</p>
    <p class="fn-tip">這裡的波速用簡化的整數（P 波 ${VP} km/s、S 波 ${VS} km/s），真實的波速會隨地層改變。</p>` },
  steps: [
    { id: 'boundary', label: '板塊邊界', title: '三種板塊邊界，地震有什麼不同？', goal: '切換三種邊界，看板塊怎麼動、震源（黃點）有多深，三種都收下。',
      intro: '紅色箭頭是板塊移動的方向。', enter: { boundary: 'divergent' }, controls: [{ key: 'boundary', label: '邊界類型', type: 'seg', options: Object.entries(BOUNDARY).map(([k, B]) => [k, B.name.replace('邊界', '')]) }],
      react: (s, r) => `${r.B.move}，${r.B.depth}。`,
      targets: Object.keys(BOUNDARY).map(k => tgt(k, BOUNDARY[k].name, { boundary: k }, `看${BOUNDARY[k].name}。`, s => BOUNDARY[s.boundary].name, (s, r) => `${r.B.move}；${r.B.feature}；${r.B.depth}`)),
      found: ['張裂和錯動邊界多是淺源地震；聚合邊界的震源沿著下沉的板塊由淺到深。', '聚合邊界才有深源地震'] },
    { id: 'wave', label: 'P 波與 S 波', title: '離震央越遠，P、S 波差多久？', goal: '比較離震央 60 km 和 120 km 的測站，各收一張。',
      intro: '看兩條虛線：藍色是 P 波到達，紅色是 S 波到達。', enter: { dist: 60 }, controls: [{ key: 'dist', label: '測站離震央', type: 'seg', options: [60, 120, 180].map(d => [d, `${d} km`]) }],
      react: (s, r) => `P 波 ${f(r.tp)} 秒、S 波 ${f(r.ts)} 秒，相差 ${f(r.lag)} 秒。`,
      targets: [60, 120].map(d => tgt('d' + d, `${d} km`, { dist: d }, `試 ${d} km。`, s => `離震央 ${s.dist} km`, (s, r) => `P 波 ${f(r.tp)} 秒到、S 波 ${f(r.ts)} 秒到，相差 ${f(r.lag)} 秒`)),
      found: ['距離加倍，P、S 波的時間差也加倍；所以從時間差可以反推距離。', '60 km 差 10 秒；120 km 差 20 秒'] },
    { id: 'locate', label: '找震央', title: '要幾個測站才能找到震央？', goal: '每個測站用距離畫一個圓。收下 2 個測站和 3 個測站的結果。',
      intro: '一個測站只知道震央離它多遠。再加一個測站看看。', enter: { stations: 1 }, controls: [{ key: 'stations', label: '用幾個測站', type: 'seg', options: [[1, '1 個'], [2, '2 個'], [3, '3 個']] }],
      react: (s, r) => `震央可能在：${r.possible}。`,
      targets: [2, 3].map(n => tgt('s' + n, `${n} 個測站`, { stations: n }, `用 ${n} 個測站。`, s => `用 ${s.stations} 個測站`, (s, r) => `震央的位置：${r.possible}`)),
      found: ['兩個圓有兩個交點，第三個圓才能決定是哪一點。', '至少要三個測站'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：震波走多久', goal: 'P 波 6 km/s、S 波 3 km/s（簡化值）。', intro: '時間 ＝ 距離 ÷ 速率。', head: '時間 ＝ 距離 ÷ 波速',
      rows: [
        { id: 'p', name: '離震央 90 km，P 波幾秒到', eq: '90 ÷ 6', answer: 15, unit: '秒' },
        { id: 's', name: '離震央 90 km，S 波幾秒到', eq: '90 ÷ 3', answer: 30, unit: '秒' },
        { id: 'd', name: 'P、S 波相差 30 秒，測站離震央多遠', eq: '每 60 km 差 10 秒', answer: 180, unit: 'km', hint: v => v === 90 ? '90 km 只差 15 秒。差 30 秒要兩倍遠。' : '' }],
      found: ['算對了！', '時間差和距離成正比'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想震波圖和那三個圓。',
      found: ['你把板塊與地震弄懂了！', '邊界決定地震型態；P、S 時間差決定距離'] }
  ],
  quiz: [
    { q: '地震時先感覺到上下小晃動，過幾秒才大搖晃，這是因為？', options: [
      { text: '發生了兩次地震。', why: '是同一次地震的兩種波。P 波比較快、先到；S 波比較慢、後到，搖晃通常比較大。' },
      { text: 'P 波先到，S 波後到。', ok: true },
      { text: 'S 波先到，P 波後到。', why: '順序反了。你的證據：60 km 處 P 波 10 秒到、S 波 20 秒到。' }] },
    { q: '甲測站 P、S 波相差 10 秒，乙測站相差 30 秒，哪一站離震央比較遠？', options: [
      { text: '甲站。', why: '時間差越大表示越遠。' },
      { text: '乙站。', ok: true },
      { text: '一樣遠。', why: '時間差和距離成正比，相差越久離得越遠。' }] },
    { q: '為什麼只用兩個測站還不能確定震央？', options: [
      { text: '因為兩個圓會有兩個交點。', ok: true },
      { text: '因為兩個測站的儀器不夠準。', why: '和儀器準不準無關。兩個圓相交有兩個點，需要第三個圓來決定。' },
      { text: '因為震波只會往一個方向傳。', why: '震波會向四面八方傳出去，所以每個測站才只能知道「距離」，不知道方向。' }] }
  ],
  finish: { title: '你把板塊與地震弄懂了！', rule: '板塊邊界有張裂、聚合、錯動三種，聚合邊界才有深源地震。P 波比 S 波先到，時間差越大離震央越遠；用三個測站的距離畫圓，交點就是震央。', next: { label: '回自然實驗總覽', href: '../../science/' } }
});
