// 實驗桌共用的天體畫法：太陽、地球、月球。先呼叫 skyDefs(el, rig) 一次。
// 地球的陸地是隨意的形狀（不是真的地圖），只為了看起來像一顆有海有陸的行星。
const n1 = v => v.toFixed(1);
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
let uid = 0;

export function skyDefs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('radialGradient', 'sk-sun', [[0, '#FFFDF0'], [.35, '#FFE87A'], [.8, '#FFB52E'], [1, '#F2891A']]);
  g('radialGradient', 'sk-corona', [[0, '#FFD866', .85], [.45, '#FFC23A', .35], [1, '#FFB000', 0]]);
  g('radialGradient', 'sk-ocean', [[0, '#7CC3F0'], [.6, '#3C8ED0'], [1, '#1F5C9E']], { cx: .38, cy: .34, r: .75 });
  g('radialGradient', 'sk-moon', [[0, '#F7F5EE'], [.7, '#D9D6CC'], [1, '#AFAA9C']], { cx: .4, cy: .36, r: .75 });
  g('radialGradient', 'sk-atmo', [[.86, '#9FD4FF', 0], [.96, '#9FD4FF', .55], [1, '#9FD4FF', 0]]);
  g('radialGradient', 'sk-glow', [[0, '#fff', .45], [1, '#fff', 0]], { cx: .32, cy: .28, r: .5 });
  return d;
}

export function sun(el, g, x, y, r, { rays = true } = {}) {
  const q = el('g', {}, g);
  el('circle', { cx: x, cy: y, r: r * 2.1, fill: 'url(#sk-corona)' }, q);
  if (rays) { let d = ''; for (let i = 0; i < 16; i++) { const a = i / 16 * 2 * Math.PI, r1 = r * 1.18, r2 = r * (i % 2 ? 1.45 : 1.62); d += `M${n1(x + r1 * Math.cos(a - .09))} ${n1(y + r1 * Math.sin(a - .09))}L${n1(x + r2 * Math.cos(a))} ${n1(y + r2 * Math.sin(a))}L${n1(x + r1 * Math.cos(a + .09))} ${n1(y + r1 * Math.sin(a + .09))}Z`; }
    el('path', { d, fill: '#FFC93C', opacity: .85 }, q); }
  el('circle', { cx: x, cy: y, r, fill: 'url(#sk-sun)', stroke: '#E58A12', 'stroke-width': Math.max(1, r * .04) }, q);
  return q;
}

// 把一片「暗面」蓋在球上：sunAng 是陽光從哪個方向照來（度，0 ＝ 從右邊、90 ＝ 從上面，數學角）
function night(el, q, x, y, r, sunAng, op) {
  const id = 'sk-c' + (++uid), d = el('defs', {}, q), cp = el('clipPath', { id }, d); el('circle', { cx: x, cy: y, r }, cp);
  const s = el('g', { 'clip-path': `url(#${id})` }, q);
  el('rect', { x: x - r * 1.1, y: y - r * 1.1, width: r * 1.1, height: r * 2.2, fill: '#0B1224', opacity: op, transform: `rotate(${-sunAng} ${x} ${y})` }, s);
  el('rect', { x: x - r * .12, y: y - r * 1.1, width: r * .16, height: r * 2.2, fill: '#0B1224', opacity: op * .45, transform: `rotate(${-sunAng} ${x} ${y})` }, s);
}

// 地球：tilt 是地軸往右傾的角度（度），sunAng 同上；axis 為 true 時畫地軸
export function earth(el, g, x, y, r, { sunAng = null, tilt = 0, axis = false, seed = 2, axisColor = '#C8372D' } = {}) {
  const q = el('g', {}, g), id = 'sk-e' + (++uid), d = el('defs', {}, q), cp = el('clipPath', { id }, d); el('circle', { cx: x, cy: y, r }, cp);
  el('circle', { cx: x, cy: y, r: r * 1.12, fill: 'url(#sk-atmo)' }, q);
  el('circle', { cx: x, cy: y, r, fill: 'url(#sk-ocean)' }, q);
  const land = el('g', { 'clip-path': `url(#${id})`, transform: `rotate(${tilt} ${x} ${y})` }, q);
  for (let k = 0; k < 5; k++) { const cx = x + (rnd(seed, k) - .5) * r * 1.5, cy = y + (rnd(seed + 1, k) - .5) * r * 1.3, R = r * (.22 + rnd(seed + 2, k) * .22);
    let p = ''; for (let i = 0; i <= 40; i++) { const a = i / 40 * 2 * Math.PI, rr = R * (1 + .28 * Math.sin(a * 2 + k) + .14 * Math.sin(a * 5 + seed) + .06 * Math.sin(a * 9 + k * 2)); p += `${i ? 'L' : 'M'}${n1(cx + rr * Math.cos(a))} ${n1(cy + rr * .8 * Math.sin(a))}`; }
    el('path', { d: p + 'Z', fill: k % 2 ? '#7DB55A' : '#5E9E48', stroke: '#3F7A34', 'stroke-width': Math.max(.6, r * .02), 'stroke-linejoin': 'round' }, land); }
  el('ellipse', { cx: x, cy: y - r * .93, rx: r * .5, ry: r * .12, fill: '#F4F8FC', transform: `rotate(${tilt} ${x} ${y})` }, land);
  el('ellipse', { cx: x, cy: y + r * .93, rx: r * .45, ry: r * .11, fill: '#F4F8FC', transform: `rotate(${tilt} ${x} ${y})` }, land);
  for (let k = 0; k < 3; k++) el('path', { d: `M${n1(x - r * .7 + rnd(k, 9) * r * .5)} ${n1(y - r * .45 + k * r * .42)}q${n1(r * .2)} ${n1(-r * .1)} ${n1(r * .42)} ${n1(-r * .02)}`, fill: 'none', stroke: '#fff', 'stroke-width': Math.max(1, r * .06), 'stroke-linecap': 'round', opacity: .45, 'clip-path': `url(#${id})` }, q);
  if (sunAng !== null) night(el, q, x, y, r, sunAng, .62);
  el('circle', { cx: x, cy: y, r, fill: 'url(#sk-glow)' }, q);
  el('circle', { cx: x, cy: y, r, fill: 'none', stroke: '#16345E', 'stroke-width': Math.max(1, r * .04) }, q);
  if (axis) { const a = tilt * Math.PI / 180, L = r * 1.5; el('path', { d: `M${n1(x - L * Math.sin(a))} ${n1(y + L * Math.cos(a))}L${n1(x + L * Math.sin(a))} ${n1(y - L * Math.cos(a))}`, stroke: axisColor, 'stroke-width': Math.max(2, r * .07), 'stroke-linecap': 'round' }, q);
    el('circle', { cx: n1(x + L * Math.sin(a)), cy: n1(y - L * Math.cos(a)), r: Math.max(2.5, r * .08), fill: axisColor }, q); }
  return q;
}

// 月球（不分亮暗，例如俯視圖上的小月球再另外蓋暗面）
export function moon(el, g, x, y, r, { sunAng = null, seed = 5, glow = false } = {}) {
  const q = el('g', {}, g), id = 'sk-m' + (++uid), d = el('defs', {}, q), cp = el('clipPath', { id }, d); el('circle', { cx: x, cy: y, r }, cp);
  if (glow) el('circle', { cx: x, cy: y, r: r * 1.35, fill: 'url(#sk-corona)', opacity: .25 }, q);
  el('circle', { cx: x, cy: y, r, fill: 'url(#sk-moon)' }, q);
  const m = el('g', { 'clip-path': `url(#${id})` }, q);
  for (const [dx, dy, rr] of [[-.3, -.25, .26], [.2, .15, .32], [-.15, .45, .18], [.45, -.35, .14]]) el('ellipse', { cx: x + dx * r, cy: y + dy * r, rx: rr * r, ry: rr * r * .85, fill: '#B9B4A6', opacity: .55 }, m);
  for (let k = 0; k < 9; k++) { const cx = x + (rnd(seed, k) - .5) * 1.6 * r, cy = y + (rnd(seed + 1, k) - .5) * 1.6 * r, rr = r * (.05 + rnd(seed + 2, k) * .08);
    el('circle', { cx: n1(cx), cy: n1(cy), r: n1(rr), fill: '#A7A193', opacity: .6 }, m); el('path', { d: `M${n1(cx - rr * .7)} ${n1(cy + rr * .5)}a${n1(rr)} ${n1(rr)} 0 0 0 ${n1(rr * 1.4)} 0`, fill: 'none', stroke: '#F2EFE6', 'stroke-width': Math.max(.6, r * .02), opacity: .8 }, m); }
  if (sunAng !== null) night(el, q, x, y, r, sunAng, .8);
  el('circle', { cx: x, cy: y, r, fill: 'none', stroke: '#6B6658', 'stroke-width': Math.max(1, r * .03) }, q);
  return q;
}

// 從地球上看到的月相：phase 0 ＝ 新月、90 ＝ 上弦、180 ＝ 滿月、270 ＝ 下弦（北半球，盈時右邊亮）
export function moonPhase(el, g, x, y, r, phase, seed = 5) {
  const q = el('g', {}, g), id = 'sk-p' + (++uid), d = el('defs', {}, q), cp = el('clipPath', { id }, d), p = phase * Math.PI / 180;
  // 亮的部分：一個半圓加上一個橢圓（明暗界線）
  const waxing = phase > 0 && phase < 180, k = Math.cos(p), rx = Math.abs(k) * r;
  const half = waxing ? `M${x} ${y - r}A${r} ${r} 0 0 1 ${x} ${y + r}` : `M${x} ${y - r}A${r} ${r} 0 0 0 ${x} ${y + r}`;
  const term = `A${n1(rx)} ${r} 0 0 ${(waxing ? k < 0 : k > 0) ? 1 : 0} ${x} ${y - r}Z`;
  el('path', { d: phase % 360 === 0 ? `M${x} ${y}Z` : phase === 180 ? `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0` : half + term }, cp);
  el('circle', { cx: x, cy: y, r, fill: '#1E2638' }, q);
  const dim = el('g', { opacity: .22 }, q); moon(el, dim, x, y, r, { seed });
  const lit = el('g', { 'clip-path': `url(#${id})` }, q); moon(el, lit, x, y, r, { seed });
  el('circle', { cx: x, cy: y, r: r + 1, fill: 'none', stroke: '#3A4660', 'stroke-width': 2 }, q);
  return q;
}
