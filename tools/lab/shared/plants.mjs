// 實驗桌共用的植物畫法：水蘊草、豌豆。每一株用 seed 決定細節，同一個 seed 每次畫出來都一樣，不同 seed 長得不一樣。
// el(tag, attrs, parent) 就是場景 api 的 el。先呼叫 plantDefs(el, rig) 一次。
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const n1 = v => v.toFixed(1);

export function plantDefs(el, rig) {
  const d = el('defs', {}, rig), g = (id, stops, a = {}) => { const n = el('linearGradient', { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('pl-leaf', [[0, '#9BD67A'], [.55, '#5DB04E'], [1, '#2F8238']], { x1: 0, y1: 0, x2: 1, y2: 1 });
  g('pl-leaf-dark', [[0, '#7CC06A'], [1, '#2B6E33']], { x1: 0, y1: 0, x2: 1, y2: 1 });
  g('pl-water-leaf', [[0, '#A9DC86', .95], [.6, '#5FB255', .92], [1, '#2F8540', .95]], { x1: 0, y1: 0, x2: 1, y2: 1 });
  g('pl-pod', [[0, '#B5E38E'], [.5, '#7CC45E'], [1, '#4C9A3C']], { x1: 0, y1: 0, x2: 0, y2: 1 });
}

// 葉片：從 (x, y) 沿 ang（度，0 ＝ 朝右，逆時針為正的數學角）長出長 len、寬 w 的葉子，bend 是葉尖往哪邊彎
function leaf(el, g, x, y, ang, len, w, bend, fill, vein = true) {
  const a = ang * Math.PI / 180, ux = Math.cos(a), uy = -Math.sin(a), nx = -uy, ny = ux;
  const tx = x + ux * len + nx * bend, ty = y + uy * len + ny * bend;
  const c1x = x + ux * len * .35 + nx * w, c1y = y + uy * len * .35 + ny * w, c2x = x + ux * len * .35 - nx * w, c2y = y + uy * len * .35 - ny * w;
  const d1x = x + ux * len * .8 + nx * (w * .55 + bend * .6), d1y = y + uy * len * .8 + ny * (w * .55 + bend * .6), d2x = x + ux * len * .8 - nx * (w * .55 - bend * .6), d2y = y + uy * len * .8 - ny * (w * .55 - bend * .6);
  el('path', { d: `M${n1(x)} ${n1(y)}C${n1(c1x)} ${n1(c1y)} ${n1(d1x)} ${n1(d1y)} ${n1(tx)} ${n1(ty)}C${n1(d2x)} ${n1(d2y)} ${n1(c2x)} ${n1(c2y)} ${n1(x)} ${n1(y)}Z`, fill, stroke: '#2A6B30', 'stroke-width': .7, 'stroke-opacity': .7 }, g);
  if (vein && len > 9) el('path', { d: `M${n1(x)} ${n1(y)}Q${n1(x + ux * len * .5 + nx * bend * .4)} ${n1(y + uy * len * .5 + ny * bend * .4)} ${n1(tx - ux * 2)} ${n1(ty - uy * 2)}`, fill: 'none', stroke: '#D9F2C4', 'stroke-width': .7, opacity: .8 }, g);
}

// 三次貝茲曲線上的點與切線方向（度）
const bez = (p, t) => { const m = 1 - t, x = m * m * m * p[0] + 3 * m * m * t * p[2] + 3 * m * t * t * p[4] + t * t * t * p[6], y = m * m * m * p[1] + 3 * m * m * t * p[3] + 3 * m * t * t * p[5] + t * t * t * p[7];
  const dx = 3 * m * m * (p[2] - p[0]) + 6 * m * t * (p[4] - p[2]) + 3 * t * t * (p[6] - p[4]), dy = 3 * m * m * (p[3] - p[1]) + 6 * m * t * (p[5] - p[3]) + 3 * t * t * (p[7] - p[5]);
  return [x, y, Math.atan2(-dy, dx) * 180 / Math.PI]; };

// 水蘊草：一根有彎度的莖，每個節上三片細長葉（一輪），越靠近頂端葉越密、越往上收；可能有一根側枝。
// (x, y) 是莖的基部，h 是高度，lean 是頂端往左右偏多少，depth 0～1（越大越在後面，顏色越淡）
export function elodea(el, g, { x, y, h, lean = 0, seed = 1, depth = 0, scale = 1, branchDir = 0 }) {
  const q = el('g', depth ? { opacity: n1(1 - depth * .35) } : {}, g);
  const stem = (p, len, sd, fine) => {
    el('path', { d: `M${n1(p[0])} ${n1(p[1])}C${n1(p[2])} ${n1(p[3])} ${n1(p[4])} ${n1(p[5])} ${n1(p[6])} ${n1(p[7])}`, fill: 'none', stroke: '#4F8F45', 'stroke-width': (fine ? 1.6 : 2.3) * scale, 'stroke-linecap': 'round' }, q);
    const nodes = Math.round(len / (11 * scale));
    for (let k = 1; k <= nodes; k++) {
      const u = k / nodes, t = 1 - Math.pow(1 - u, 1.7), [px, py, tang] = bez(p, Math.min(.995, t));
      const tipness = Math.pow(u, 2.2), L = (12 + rnd(sd, k) * 5) * (1 - tipness * .45) * scale, W = (2.6 + rnd(sd + 3, k) * 1.2) * scale;
      const spread = 62 - tipness * 34 + (rnd(sd + 5, k) - .5) * 16, rot = (k * 47 + sd * 13) % 120;
      for (let j = 0; j < 3; j++) {
        const phase = (rot + j * 120) * Math.PI / 180, side = Math.sin(phase), front = Math.cos(phase);
        if (Math.abs(side) < .25 && front < 0) continue;
        const ang = tang + Math.sign(side || 1) * spread * Math.max(.35, Math.abs(side)), len2 = L * (.65 + .35 * Math.abs(side));
        leaf(el, q, px, py, ang, len2, W, (rnd(sd + j, k + 9) - .5) * 4 * scale - Math.sign(side) * 1.5 * scale, 'url(#pl-water-leaf)', len2 > 10);
      }
    }
  };
  const p = [x, y, x + lean * .1 + (rnd(seed, 1) - .5) * 24, y - h * .35, x + lean * .8 + (rnd(seed, 2) - .5) * 30, y - h * .7, x + lean, y - h];
  stem(p, h, seed, false);
  if (rnd(seed, 7) > .35) { const t0 = .38 + rnd(seed, 8) * .2, [bx, by] = bez(p, t0), dir = branchDir || (rnd(seed, 9) > .5 ? 1 : -1), bh = h * (.35 + rnd(seed, 10) * .2);
    stem([bx, by, bx + dir * bh * .3, by - bh * .3, bx + dir * bh * .5, by - bh * .7, bx + dir * bh * .45, by - bh], bh * .9, seed + 31, true); }
  return q;
}

// 豌豆：高莖節間長、五六個節，頂端開花、下面掛豆莢；矮莖節間很短、葉子擠在一起。
// (x, y) 是土面，tall 高莖或矮莖，sc 縮放，seed 讓每一株不一樣。
export function pea(el, g, { x, y, tall, sc = 1, seed = 1 }) {
  const q = el('g', { transform: `translate(${n1(x)} ${n1(y)}) scale(${sc})` }, g);
  if (sc < .3) { // 很小的時候畫簡單版，免得糊成一團
    const h = tall ? 90 : 34; el('path', { d: `M0 0Q${n1((rnd(seed, 1) - .5) * 14)} ${-h / 2} ${n1((rnd(seed, 2) - .5) * 10)} ${-h}`, fill: 'none', stroke: '#3E8A3E', 'stroke-width': 5, 'stroke-linecap': 'round' }, q);
    for (let k = 0; k < (tall ? 4 : 2); k++) { const yy = -h * (k + .6) / (tall ? 4.2 : 2.3); leaf(el, q, 0, yy, 150 + rnd(seed, k) * 20, 18, 7, 0, 'url(#pl-leaf)', false); leaf(el, q, 0, yy - 4, 10 + rnd(seed + 1, k) * 20, 18, 7, 0, 'url(#pl-leaf)', false); }
    return q;
  }
  const nodes = tall ? 6 : 3, inter = tall ? 17 : 10, pts = [[0, 0]];
  for (let k = 1; k <= nodes; k++) pts.push([(k % 2 ? 1 : -1) * (2.5 + rnd(seed, k) * 2), -k * inter * (1 - (k - 1) * .02)]);
  let d = `M0 0`; for (let k = 1; k < pts.length; k++) { const [a, b] = pts[k - 1], [c, e] = pts[k]; d += `Q${n1(a + (c - a) * .5 + (k % 2 ? -2 : 2))} ${n1((b + e) / 2)} ${n1(c)} ${n1(e)}`; }
  el('path', { d, fill: 'none', stroke: '#3B7F3B', 'stroke-width': 3.2, 'stroke-linecap': 'round' }, q);
  el('path', { d, fill: 'none', stroke: '#8CCB72', 'stroke-width': 1, 'stroke-linecap': 'round', opacity: .7 }, q);
  for (let k = 1; k <= nodes; k++) {
    const [nx, ny] = pts[k], side = k % 2 ? 1 : -1, top = k === nodes;
    // 托葉：一對大大的、包著莖
    for (const sd of [-1, 1]) leaf(el, q, nx, ny + 1, sd > 0 ? 25 + rnd(seed, k) * 15 : 155 - rnd(seed, k) * 15, 9 + rnd(seed + sd, k) * 3, 5, sd * 1.5, 'url(#pl-leaf-dark)', false);
    if (top && tall) { // 頂端的花
      for (const [fx, fy, fr] of [[side * 7, -8, 5.5], [-side * 4, -12, 4.5]]) { el('path', { d: `M${n1(nx)} ${n1(ny)}q${n1(fx * .4)} ${n1(fy * .6)} ${n1(fx)} ${n1(fy)}`, fill: 'none', stroke: '#3B7F3B', 'stroke-width': 1.2 }, q);
        el('ellipse', { cx: n1(nx + fx), cy: n1(ny + fy - fr * .4), rx: fr, ry: fr * .9, fill: '#FFFFFF', stroke: '#B9AFC9', 'stroke-width': .8 }, q);
        el('path', { d: `M${n1(nx + fx - fr * .5)} ${n1(ny + fy)}q${n1(fr * .5)} ${n1(fr * .7)} ${n1(fr)} 0`, fill: '#F1E8F7', stroke: '#B9AFC9', 'stroke-width': .7 }, q); }
      continue;
    }
    // 葉柄＋兩對小葉＋末端卷鬚
    const L = (tall ? 22 : 17) + rnd(seed + 2, k) * 6, ang = side > 0 ? 28 + rnd(seed, k + 4) * 18 : 152 - rnd(seed, k + 4) * 18, a = ang * Math.PI / 180, ux = Math.cos(a), uy = -Math.sin(a);
    const ex = nx + ux * L, ey = ny + uy * L;
    el('path', { d: `M${n1(nx)} ${n1(ny)}L${n1(ex)} ${n1(ey)}`, stroke: '#3B7F3B', 'stroke-width': 1.3 }, q);
    for (const t of [.42, .78]) { const px = nx + ux * L * t, py = ny + uy * L * t, sz = (tall ? 9.5 : 8) * (1.05 - t * .3) + rnd(seed + t * 10, k);
      leaf(el, q, px, py, ang + 62, sz, sz * .48, 1, 'url(#pl-leaf)'); leaf(el, q, px, py, ang - 62, sz, sz * .48, -1, 'url(#pl-leaf)'); }
    const cs = side; el('path', { d: `M${n1(ex)} ${n1(ey)}c${n1(ux * 6)} ${n1(uy * 6 - 4)} ${n1(ux * 10 + cs * 2)} ${n1(uy * 2 - 8)} ${n1(ux * 6 + cs * 4)} ${n1(uy * 2 - 10)}c${n1(-cs * 3)} -2 ${n1(-cs * 4)} 2 ${n1(-cs * 1.5)} 3.5c${n1(cs * 1.5)} .5 ${n1(cs * 2)} -1 ${n1(cs * 1)} -2`, fill: 'none', stroke: '#6DAF55', 'stroke-width': 1, 'stroke-linecap': 'round' }, q);
    // 高莖下段掛豆莢
    if (tall && k === 3) { const px = nx - side * 3, py = ny + 4; el('path', { d: `M${n1(px)} ${n1(py)}q${n1(-side * 4)} 6 ${n1(-side * 8)} 8`, fill: 'none', stroke: '#3B7F3B', 'stroke-width': 1.2 }, q);
      el('path', { d: `M${n1(px - side * 8)} ${n1(py + 8)}c${n1(-side * 4)} 2 ${n1(-side * 10)} 12 ${n1(-side * 9)} 22c${n1(side * 4)} 1 ${n1(side * 8)} -10 ${n1(side * 9)} -22z`, fill: 'url(#pl-pod)', stroke: '#3B7F3B', 'stroke-width': .9 }, q); }
  }
  if (!tall) { const [tx, ty] = pts[nodes]; leaf(el, q, tx, ty, 75, 9, 4.5, 1, 'url(#pl-leaf)'); leaf(el, q, tx, ty, 105, 8, 4, -1, 'url(#pl-leaf)'); }
  return q;
}

// 樹：樹幹往上分叉，樹冠是邊緣不規則、有明暗的一團葉子。(x, y) 是樹根，h 是高度。
export function tree(el, g, { x, y, h = 110, seed = 1 }) {
  const q = el('g', {}, g), d = el('defs', {}, q), id = `pl-crown-${seed}`, gr = el('radialGradient', { id, cx: .36, cy: .3, r: .8 }, d);
  for (const [o, c] of [[0, '#A8DC7E'], [.5, '#5DAE4C'], [1, '#2F7035']]) el('stop', { offset: o, 'stop-color': c }, gr);
  const cx = x, cy = y - h * .62, rx = h * .36, ry = h * .32;
  el('path', { d: `M${n1(x - h * .05)} ${n1(y)}Q${n1(x - h * .03)} ${n1(y - h * .3)} ${n1(x - h * .02)} ${n1(cy + ry * .3)}L${n1(x + h * .03)} ${n1(cy + ry * .3)}Q${n1(x + h * .03)} ${n1(y - h * .3)} ${n1(x + h * .06)} ${n1(y)}Z`, fill: '#7A5230', stroke: '#4E331C', 'stroke-width': 1.2 }, q);
  el('path', { d: `M${n1(x)} ${n1(cy + ry * .5)}l${n1(-h * .1)} ${n1(-h * .12)}M${n1(x)} ${n1(cy + ry * .6)}l${n1(h * .12)} ${n1(-h * .1)}`, stroke: '#6B4628', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, q);
  let p = ''; const N = 22; for (let i = 0; i <= N; i++) { const a = i / N * 2 * Math.PI, bump = 1 + .1 * Math.sin(a * 7 + seed) + .06 * Math.sin(a * 13 + seed * 2), px = cx + rx * bump * Math.cos(a), py = cy + ry * bump * Math.sin(a); p += `${i ? 'L' : 'M'}${n1(px)} ${n1(py)}`; }
  el('path', { d: p + 'Z', fill: `url(#${id})`, stroke: '#2B6630', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, q);
  for (let i = 0; i < 7; i++) { const a = rnd(seed, i) * 6.28, r = rnd(seed + 1, i) * .6; el('ellipse', { cx: n1(cx + rx * r * Math.cos(a) - rx * .1), cy: n1(cy + ry * r * Math.sin(a) - ry * .1), rx: n1(rx * (.14 + rnd(i, seed) * .1)), ry: n1(ry * .12), fill: '#C2E89B', opacity: .35 }, q); }
  return q;
}

// 寬葉片（雙子葉植物的葉）：葉緣有細鋸齒、羽狀葉脈、有明暗。(x, y) 是葉柄基部，ang 是葉子朝向（度，0 ＝ 朝右、往上為正），
// L 是葉片長、W 是最寬處的半寬，dim 0～1 讓葉子變暗（例如沒有光）。回傳 { g, at(t, side) }：at 給出葉片上某處的場景座標。
export function broadLeaf(el, g, { x, y, ang = 20, L = 400, W = 120, petiole = 50, seed = 1, dim = 0, id = 'pl-broad' }) {
  const d = el('defs', {}, g), lg = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, d);
  const shade = c => dim ? c.replace(/^#(..)(..)(..)$/, (m, r, gg, b) => '#' + [r, gg, b].map(h => Math.round(parseInt(h, 16) * (1 - dim * .45)).toString(16).padStart(2, '0')).join('')) : c;
  for (const [o, c] of [[0, '#8FD06E'], [.45, '#5DAE4C'], [1, '#2E7A35']]) el('stop', { offset: o, 'stop-color': shade(c) }, lg);
  const q = el('g', { transform: `translate(${n1(x)} ${n1(y)}) rotate(${-ang})` }, g);
  // 葉柄
  el('path', { d: `M0 0Q${n1(petiole * .5)} ${n1(-3)} ${n1(petiole)} 0`, fill: 'none', stroke: shade('#3E7F36'), 'stroke-width': 7, 'stroke-linecap': 'round' }, q);
  const half = t => W * Math.pow(Math.sin(Math.PI * Math.pow(t, .78)), .9) * (1 - .12 * t);
  const N = 70, top = [], bot = [];
  for (let i = 0; i <= N; i++) { const t = i / N, u = petiole + t * L, tooth = i % 2 && i > 3 && i < N - 2 ? 1 + (2.6 + rnd(seed, i) * 1.4) / Math.max(18, half(t)) * 3 : 1, bend = Math.sin(Math.PI * t) * W * .06;
    top.push([u, -half(t) * tooth + bend]); bot.push([u, half(t) * (i % 2 && i > 3 && i < N - 2 ? 1 + (2.6 + rnd(seed + 3, i) * 1.4) / Math.max(18, half(t)) * 3 : 1) + bend]); }
  const path = 'M' + top.map(p => p.map(n1).join(' ')).join('L') + 'L' + bot.reverse().map(p => p.map(n1).join(' ')).join('L') + 'Z';
  el('path', { d: path, fill: `url(#${id})`, stroke: shade('#2A6B30'), 'stroke-width': 2, 'stroke-linejoin': 'round' }, q);
  // 上半片稍亮，像葉片微微摺起
  el('path', { d: 'M' + top.map(p => p.map(n1).join(' ')).join('L') + `L${n1(petiole + L)} ${n1(0)}L${n1(petiole)} 0Z`, fill: '#fff', opacity: .1 }, q);
  // 主脈與側脈
  const mid = t => [petiole + t * L, Math.sin(Math.PI * t) * W * .06];
  el('path', { d: `M${petiole} 0Q${n1(petiole + L * .5)} ${n1(W * .09)} ${n1(petiole + L)} 0`, fill: 'none', stroke: shade('#D7EFC0'), 'stroke-width': 3.4, 'stroke-linecap': 'round', opacity: .9 }, q);
  let vein = '';
  for (let k = 1; k <= 9; k++) { const t = k / 10.5, [mx, my] = mid(t), reach = half(Math.min(.98, t + .1)) * .86;
    for (const sd of [-1, 1]) { const ex = mx + L * .13, ey = my + sd * reach; vein += `M${n1(mx)} ${n1(my)}Q${n1(mx + L * .03)} ${n1(my + sd * reach * .7)} ${n1(ex)} ${n1(ey)}`;
      vein += `M${n1(mx + L * .06)} ${n1(my + sd * reach * .55)}l${n1(L * .03)} ${n1(sd * reach * .12)}`; } }
  el('path', { d: vein, fill: 'none', stroke: shade('#CBE8AE'), 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: .75 }, q);
  const rad = -ang * Math.PI / 180, at = (t, v = 0) => { const [mx, my] = mid(t), yy = my + v * half(t); return [x + mx * Math.cos(rad) - yy * Math.sin(rad), y + mx * Math.sin(rad) + yy * Math.cos(rad)]; };
  return { g: q, at };
}

// 氣孔放大圖：兩個腎形保衛細胞夾著一個孔，open 0～1 是開度。(x, y) 是中心，r 是半徑。
export function stoma(el, g, { x, y, r = 70, open = 1, id = 'pl-stoma' }) {
  const q = el('g', {}, g), d = el('defs', {}, q), cp = el('clipPath', { id }, d); el('circle', { cx: x, cy: y, r }, cp);
  el('circle', { cx: x + 2, cy: y + 4, r: r + 5, fill: '#000', opacity: .18 }, q);
  const inner = el('g', { 'clip-path': `url(#${id})` }, q);
  el('rect', { x: x - r, y: y - r, width: 2 * r, height: 2 * r, fill: '#E4F1D2' }, inner);
  // 周圍的表皮細胞（拼圖狀）
  let cells = '';
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const cx = x + i * r * .42 + (j % 2) * r * .2, cy = y + j * r * .36; if (Math.hypot(cx - x, cy - y) < r * .5) continue;
    let p = ''; for (let k = 0; k <= 10; k++) { const a = k / 10 * 2 * Math.PI, rr = r * .2 * (1 + .18 * Math.sin(a * 3 + i * 2 + j)); p += `${k ? 'L' : 'M'}${n1(cx + rr * Math.cos(a))} ${n1(cy + rr * .85 * Math.sin(a))}`; } cells += p + 'Z'; }
  el('path', { d: cells, fill: '#EEF6E2', stroke: '#9DBF7E', 'stroke-width': 1.4 }, inner);
  const gap = r * (.04 + .14 * open), gh = r * .44, gw = r * .22;
  for (const sd of [-1, 1]) {
    const cx = x + sd * (gap + gw * .55);
    el('path', { d: `M${n1(x + sd * gap)} ${n1(y - gh)}C${n1(x + sd * (gap + gw * 1.6))} ${n1(y - gh)} ${n1(x + sd * (gap + gw * 1.6))} ${n1(y + gh)} ${n1(x + sd * gap)} ${n1(y + gh)}C${n1(x + sd * (gap * .2))} ${n1(y + gh * .6)} ${n1(x + sd * (gap * .2))} ${n1(y - gh * .6)} ${n1(x + sd * gap)} ${n1(y - gh)}Z`, fill: '#9ED47E', stroke: '#3E8A3E', 'stroke-width': 2 }, inner);
    for (let k = 0; k < 6; k++) el('ellipse', { cx: n1(cx + sd * (rnd(k, 3) - .3) * gw * .5), cy: n1(y - gh * .65 + k * gh * .26), rx: r * .035, ry: r * .025, fill: '#2F8A35' }, inner);
  }
  el('path', { d: `M${n1(x)} ${n1(y - gh * .9)}C${n1(x + gap * 1.1)} ${n1(y - gh * .3)} ${n1(x + gap * 1.1)} ${n1(y + gh * .3)} ${n1(x)} ${n1(y + gh * .9)}C${n1(x - gap * 1.1)} ${n1(y + gh * .3)} ${n1(x - gap * 1.1)} ${n1(y - gh * .3)} ${n1(x)} ${n1(y - gh * .9)}Z`, fill: '#2B3B2A' }, inner);
  el('circle', { cx: x, cy: y, r, fill: 'none', stroke: '#23304A', 'stroke-width': 3 }, q);
  return q;
}
