// 顯微鏡實驗桌的畫法：側視的複式顯微鏡、解剖顯微鏡、載物台俯視，以及目鏡視野裡的細胞。
// 只負責畫圖和回傳可以操作的節點；數值全部由 model.mjs 決定。
export const INK = '#23304A', AXIS = 229;
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const BAND = { 4: '#D8413A', 10: '#F2C230', 40: '#3B7DD8' }, LEN = { 4: 30, 10: 42, 40: 56 };
export const LEVER = { 1: -36, 3: -18, 5: 0 };
export const stageLift = (coarse, fine) => coarse * 8 + fine * 2.5;

export function addDefs(el, rig) {
  const defs = el('defs', {}, rig);
  const grad = (tag, id, stops, a = {}) => { const g = el(tag, { id, ...a }, defs); for (const [offset, color, op] of stops) el('stop', { offset, 'stop-color': color, 'stop-opacity': op }, g); };
  const dark = [[0, '#55627E'], [.4, '#2A3550'], [1, '#131A2B']], enamel = [[0, '#FFFDF8'], [.45, '#ECE7DB'], [1, '#B4AD9C']];
  grad('linearGradient', 'ms-black', dark); grad('linearGradient', 'ms-blackv', dark, { x1: 0, y1: 0, x2: 0, y2: 1 });
  grad('linearGradient', 'ms-tube', [[0, '#161E30'], [.28, '#56637F'], [.42, '#A3AFC6'], [.62, '#3A4660'], [1, '#111727']]);
  grad('linearGradient', 'ms-chrome', [[0, '#727D91'], [.3, '#F7FAFD'], [.55, '#B4BECC'], [1, '#626D81']]);
  grad('linearGradient', 'ms-enamel', enamel); grad('linearGradient', 'ms-arm', enamel, { gradientUnits: 'userSpaceOnUse', x1: 290, y1: 0, x2: 338, y2: 0 });
  grad('linearGradient', 'ms-wood', [[0, '#EDD3A0'], [1, '#C99B5E']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  grad('linearGradient', 'ms-glass', [[0, '#F4FBFF', .9], [.5, '#CFE6F5', .7], [1, '#E6F4FC', .85]], { x1: 0, y1: 0, x2: 1, y2: 1 });
  grad('radialGradient', 'ms-knob', [[0, '#F7FAFD'], [.6, '#AEB8C8'], [1, '#5F6A7E']], { cx: .35, cy: .3, r: .8 });
  grad('radialGradient', 'ms-vig', [[.6, '#000', 0], [.86, '#000', .12], [1, '#000', .42]]);
  grad('radialGradient', 'ms-nuc', [[0, '#C29550'], [1, '#7A4E1C']], { cx: .4, cy: .35, r: .7 });
  grad('radialGradient', 'ms-glow', [[0, '#FFFBE0'], [.7, '#FFE98A'], [1, '#E9C84A']]);
  const rough = el('filter', { id: 'ms-ink', x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
  el('feTurbulence', { type: 'fractalNoise', baseFrequency: .06, numOctaves: 2, seed: 4, result: 'n' }, rough);
  el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 2.4, xChannelSelector: 'R', yChannelSelector: 'G' }, rough);
  return defs;
}

function knob(el, g, cx, cy, r, deg) {
  el('circle', { cx, cy: cy + 2, r: r + 1, fill: '#000', opacity: .22 }, g);
  el('circle', { cx, cy, r, fill: 'url(#ms-black)', stroke: INK, 'stroke-width': 2.5 }, g);
  const rot = el('g', { transform: `rotate(${deg} ${cx} ${cy})` }, g);
  el('circle', { cx, cy, r: r - 3.5, fill: 'none', stroke: '#8794B0', 'stroke-width': 5, 'stroke-dasharray': '2.5 3.5' }, rot);
  el('circle', { cx, cy, r: r * .58, fill: 'url(#ms-knob)', stroke: INK, 'stroke-width': 1.5 }, rot);
  el('path', { d: `M${cx} ${cy - r * .12}V${cy - r * .5}`, stroke: '#D8413A', 'stroke-width': Math.max(2.5, r * .12), 'stroke-linecap': 'round' }, rot);
  const hit = el('circle', { cx, cy, r: Math.max(r + 16, 34), fill: 'transparent' }, g);
  return { rot, hit, cx, cy };
}

// 側視的複式顯微鏡。回傳可操作的節點：stage（會升降的載物台）、coarse／fine（調節輪）、lever（光圈拉桿）、objs（三個物鏡）。
export function compound(el, g, { coarse = 2, fine = 1, obj = 4, aperture = 3 } = {}) {
  const A = AXIS, half = { 1: 15, 3: 9, 5: 4 }[aperture];
  el('ellipse', { cx: 236, cy: 532, rx: 150, ry: 9, fill: '#000', opacity: .2 }, g);
  const arm = 'M313 504V300Q313 176 236 172';
  el('path', { d: arm, fill: 'none', stroke: INK, 'stroke-width': 47 }, g); el('path', { d: arm, fill: 'none', stroke: 'url(#ms-arm)', 'stroke-width': 42 }, g);
  el('path', { d: 'M299 498V300Q299 194 244 186', fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: .65 }, g);
  el('path', { d: 'M126 500h216a14 14 0 0 1 14 14v6a10 10 0 0 1-10 10H122a10 10 0 0 1-10-10v-6a14 14 0 0 1 14-14z', fill: 'url(#ms-blackv)', stroke: INK, 'stroke-width': 2.5 }, g);
  el('path', { d: 'M132 506h204', stroke: '#9AA7C0', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: .7 }, g);
  // 光源和光束
  el('path', { d: `M${A - 20} 478h40L${A + half} 332h${-2 * half}z`, fill: '#FFE98A', opacity: .5 }, g);
  el('rect', { x: A - 28, y: 480, width: 56, height: 22, rx: 5, fill: 'url(#ms-black)', stroke: INK, 'stroke-width': 2 }, g);
  el('ellipse', { cx: A, cy: 480, rx: 22, ry: 5.5, fill: 'url(#ms-glow)', stroke: INK, 'stroke-width': 2 }, g);
  // 鏡筒與目鏡
  el('rect', { x: 194, y: 148, width: 70, height: 52, rx: 10, fill: 'url(#ms-enamel)', stroke: INK, 'stroke-width': 2.5 }, g);
  el('rect', { x: A - 20, y: 98, width: 40, height: 54, fill: 'url(#ms-tube)', stroke: INK, 'stroke-width': 2 }, g);
  el('rect', { x: A - 24, y: 93, width: 48, height: 9, rx: 3, fill: 'url(#ms-chrome)', stroke: INK, 'stroke-width': 1.5 }, g);
  el('rect', { x: A - 16, y: 66, width: 32, height: 29, rx: 4, fill: 'url(#ms-black)', stroke: INK, 'stroke-width': 2 }, g);
  el('rect', { x: A - 20, y: 59, width: 40, height: 10, rx: 4, fill: 'url(#ms-black)', stroke: INK, 'stroke-width': 2 }, g);
  // 物鏡：使用中的朝正下方，另外兩個轉到旁邊
  const objs = {}, others = [4, 10, 40].filter(o => o !== obj);
  const lens = (o, deg) => { const L = LEN[o], q = el('g', { transform: `rotate(${deg} ${A} 196)` }, g);
    el('rect', { x: A - 10, y: 200, width: 20, height: L + 8, rx: 2, fill: 'url(#ms-chrome)', stroke: INK, 'stroke-width': 1.8 }, q);
    el('rect', { x: A - 10, y: 208 + L * .45, width: 20, height: 5, fill: BAND[o], stroke: INK, 'stroke-width': 1 }, q);
    el('rect', { x: A - 6, y: 208 + L, width: 12, height: 7, rx: 1.5, fill: 'url(#ms-chrome)', stroke: INK, 'stroke-width': 1.5 }, q);
    el('rect', { x: A - 20, y: 196, width: 40, height: L + 34, fill: 'transparent' }, q);
    const d = L + 40, t = deg * Math.PI / 180; objs[o] = { g: q, tip: [A - d * Math.sin(t), 196 + d * Math.cos(t)], active: !deg }; };
  lens(others[0], 36); lens(others[1], -36);
  el('path', { d: `M${A - 40} 198h80l-12 15h-56z`, fill: 'url(#ms-black)', stroke: INK, 'stroke-width': 2 }, g);
  lens(obj, 0);
  el('path', { d: `M${A - 38} 199h76l-3 5h-70z`, fill: 'url(#ms-black)', stroke: INK, 'stroke-width': 1.5 }, g);
  // 載物台（跟著調節輪升降）：聚光鏡、光圈、玻片、夾子
  const stage = el('g', { transform: `translate(0 ${-stageLift(coarse, fine)})` }, g);
  el('rect', { x: 284, y: 318, width: 22, height: 24, rx: 3, fill: 'url(#ms-black)', stroke: INK, 'stroke-width': 2 }, stage);
  el('path', { d: `M${A - 18} 334h36l-5 19h-26z`, fill: 'url(#ms-chrome)', stroke: INK, 'stroke-width': 1.8 }, stage);
  const lever = el('g', { transform: `translate(${LEVER[aperture]} 0)` }, stage);
  el('rect', { x: A - 48, y: 354, width: 66, height: 4, rx: 2, fill: 'url(#ms-chrome)', stroke: INK, 'stroke-width': 1.2 }, lever);
  el('circle', { cx: A - 50, cy: 356, r: 6.5, fill: '#8FD3C1', stroke: INK, 'stroke-width': 2 }, lever);
  const leverHit = el('rect', { x: A - 80, y: 334, width: 60, height: 44, fill: 'transparent' }, lever);
  el('rect', { x: A - 30, y: 352, width: 60, height: 8, rx: 3, fill: 'url(#ms-blackv)', stroke: INK, 'stroke-width': 1.8 }, stage);
  el('rect', { x: 150, y: 322, width: 150, height: 12, rx: 3, fill: 'url(#ms-blackv)', stroke: INK, 'stroke-width': 2 }, stage);
  el('path', { d: 'M154 325h142', stroke: '#9AA7C0', 'stroke-width': 1.5, 'stroke-linecap': 'round', opacity: .7 }, stage);
  el('rect', { x: A - 33, y: 317, width: 66, height: 5, rx: 1, fill: '#DCEFFB', stroke: '#5F86A8', 'stroke-width': 1.2 }, stage);
  el('rect', { x: A - 10, y: 315.2, width: 20, height: 2.2, fill: '#BFE0F5', stroke: '#5F86A8', 'stroke-width': .8 }, stage);
  for (const d of [`M172 321l8-6h22`, `M286 321l-8-6h-22`]) el('path', { d, fill: 'none', stroke: '#C6CEDA', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, stage);
  return { stage, lever, leverHit, objs, coarse: knob(el, g, 313, 384, 30, coarse * 60), fine: knob(el, g, 313, 452, 17, fine * 60) };
}

// 解剖顯微鏡（側視，不能操作）：雙目鏡、光從上方照、標本是不透光的立體物體。
export function stereo(el, g) {
  el('ellipse', { cx: 236, cy: 532, rx: 140, ry: 9, fill: '#000', opacity: .2 }, g);
  el('rect', { x: 303, y: 200, width: 18, height: 292, rx: 4, fill: 'url(#ms-chrome)', stroke: INK, 'stroke-width': 2 }, g);
  el('rect', { x: 118, y: 488, width: 236, height: 40, rx: 10, fill: 'url(#ms-blackv)', stroke: INK, 'stroke-width': 2.5 }, g);
  el('ellipse', { cx: 215, cy: 490, rx: 64, ry: 9, fill: '#F6F3EA', stroke: INK, 'stroke-width': 2 }, g);
  el('path', { d: 'M198 386h34l18 86h-70z', fill: '#FFE98A', opacity: .45 }, g);
  el('rect', { x: 194, y: 466, width: 42, height: 20, rx: 3, fill: 'url(#ms-wood)', stroke: INK, 'stroke-width': 1.8 }, g);
  const eye = (dx, o) => { const q = el('g', { transform: `rotate(-24 215 258) translate(${dx} 0)`, opacity: o }, g);
    el('rect', { x: 200, y: 186, width: 24, height: 76, fill: 'url(#ms-tube)', stroke: INK, 'stroke-width': 2 }, q); el('rect', { x: 196, y: 170, width: 32, height: 20, rx: 5, fill: 'url(#ms-black)', stroke: INK, 'stroke-width': 2 }, q); };
  eye(26, .85); eye(0, 1);
  el('rect', { x: 250, y: 298, width: 84, height: 46, rx: 9, fill: 'url(#ms-enamel)', stroke: INK, 'stroke-width': 2.5 }, g);
  el('rect', { x: 172, y: 250, width: 96, height: 100, rx: 16, fill: 'url(#ms-enamel)', stroke: INK, 'stroke-width': 2.5 }, g);
  el('path', { d: 'M184 262v76', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: .7 }, g);
  el('rect', { x: 194, y: 348, width: 52, height: 30, fill: 'url(#ms-tube)', stroke: INK, 'stroke-width': 2 }, g);
  el('rect', { x: 190, y: 376, width: 60, height: 10, rx: 4, fill: 'url(#ms-black)', stroke: INK, 'stroke-width': 2 }, g);
  knob(el, g, 322, 321, 22, 30);
}

// 載物台俯視：黑色載物台、通光孔、兩個夾子，和一片可以拖動的玻片。回傳玻片節點。
export function stageTop(el, txt, g, { dx = 0, dy = 0, mark = 'F', tint, label = '' } = {}) {
  el('rect', { x: 112, y: 214, width: 256, height: 236, rx: 16, fill: '#000', opacity: .2, transform: 'translate(3 5)' }, g);
  el('rect', { x: 112, y: 214, width: 256, height: 236, rx: 16, fill: 'url(#ms-blackv)', stroke: INK, 'stroke-width': 3 }, g);
  el('rect', { x: 120, y: 221, width: 240, height: 6, rx: 3, fill: '#9AA7C0', opacity: .45 }, g);
  el('circle', { cx: 240, cy: 332, r: 24, fill: 'url(#ms-glow)', stroke: '#0C1220', 'stroke-width': 4 }, g);
  const slide = el('g', { transform: `translate(${dx} ${dy})` }, g);
  el('rect', { x: 160, y: 305, width: 160, height: 54, rx: 3, fill: '#000', opacity: .25, transform: 'translate(2 3)' }, slide);
  el('rect', { x: 160, y: 305, width: 160, height: 54, rx: 3, fill: 'url(#ms-glass)', stroke: '#6E97BB', 'stroke-width': 2 }, slide);
  el('path', { d: 'M166 310h148', stroke: '#fff', 'stroke-width': 2, opacity: .8 }, slide);
  el('rect', { x: 165, y: 311, width: 38, height: 42, rx: 2, fill: '#FFFDF5', stroke: '#B9B2A2', 'stroke-width': 1 }, slide);
  txt(slide, 184, 337, label, { 'font-size': 11, fill: '#5A6478' });
  el('rect', { x: 216, y: 308, width: 48, height: 48, rx: 2, fill: tint || '#fff', opacity: tint ? .75 : .35, stroke: '#8FB4D4', 'stroke-width': 1.2 }, slide);
  if (mark) txt(slide, 240, 345, mark, { 'font-size': 36, fill: INK });
  el('rect', { x: 150, y: 295, width: 180, height: 74, fill: 'transparent' }, slide);
  for (const [x, f] of [[150, 1], [330, -1]]) { el('path', { d: `M${x} 240V300`, stroke: INK, 'stroke-width': 9, 'stroke-linecap': 'round' }, g); el('path', { d: `M${x} 240V300`, stroke: 'url(#ms-chrome)', 'stroke-width': 6, 'stroke-linecap': 'round' }, g); el('circle', { cx: x, cy: 238, r: 8, fill: 'url(#ms-knob)', stroke: INK, 'stroke-width': 2 }, g); void f; }
  return slide;
}

// 目鏡視野：回傳 content（被圓形裁切、可套模糊的內容層）和 blur（設定模糊程度）。
export function fieldView(el, rig, defs, { CX, CY, R, bg = '#FFFDF2', clarity = 100, light = 60 }) {
  const cp = el('clipPath', { id: 'ms-view' }, defs); el('circle', { cx: CX, cy: CY, r: R }, cp);
  const fl = el('filter', { id: 'ms-blur', x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs), fe = el('feGaussianBlur', { stdDeviation: 0 }, fl);
  el('circle', { cx: CX + 3, cy: CY + 6, r: R + 17, fill: '#000', opacity: .25 }, rig);
  el('circle', { cx: CX, cy: CY, r: R + 16, fill: '#0F1626' }, rig); el('circle', { cx: CX, cy: CY, r: R + 16, fill: 'none', stroke: '#55627E', 'stroke-width': 3 }, rig);
  el('circle', { cx: CX, cy: CY, r: R, fill: bg }, rig);
  const clip = el('g', { 'clip-path': 'url(#ms-view)' }, rig), content = el('g', {}, clip);
  const shade = el('circle', { cx: CX, cy: CY, r: R, fill: '#000', opacity: 0 }, clip);
  el('circle', { cx: CX, cy: CY, r: R, fill: 'url(#ms-vig)' }, clip);
  const blur = c => { const v = Math.max(0, (100 - c) / 6); fe.setAttribute('stdDeviation', v); if (v > .05) content.setAttribute('filter', 'url(#ms-blur)'); else content.removeAttribute('filter'); };
  const lit = l => { if (l > 80) { shade.setAttribute('fill', '#fff'); shade.setAttribute('opacity', Math.min(.8, (l - 80) / 20 * .8)); } else { shade.setAttribute('fill', '#000'); shade.setAttribute('opacity', l < 60 ? Math.min(.6, (60 - l) / 60 * .55) : 0); } };
  blur(clarity); lit(light);
  return { content, blur, lit };
}

// 玻片上印的字：紙纖維加上邊緣不平整的油墨，像真的在顯微鏡下看印刷字。
export function printedLetter(el, txt, g, { x, y, size = 86, flip = true }) {
  const q = el('g', { transform: flip ? `rotate(180 ${x} ${y})` : '' }, g);
  let d = ''; for (let i = 0; i < 90; i++) { const fx = x - 330 + rnd(i, 1) * 660, fy = y - 330 + rnd(i, 2) * 660, a = rnd(i, 3) * 6.28, l = 18 + rnd(i, 4) * 40; d += `M${fx.toFixed(1)} ${fy.toFixed(1)}q${(Math.cos(a) * l / 2 + 6).toFixed(1)} ${(Math.sin(a) * l / 2 - 6).toFixed(1)} ${(Math.cos(a) * l).toFixed(1)} ${(Math.sin(a) * l).toFixed(1)}`; }
  el('path', { d, fill: 'none', stroke: '#C9BE98', 'stroke-width': 1.4, 'stroke-linecap': 'round', opacity: .55 }, q);
  const t = txt(q, x, y + size * .35, 'F', { 'font-size': size, 'font-weight': 600, 'font-family': 'Georgia, "Times New Roman", serif', fill: '#1B2233' }); t.setAttribute('filter', 'url(#ms-ink)');
  return q;
}

// 植物表皮細胞：長條形、錯開排列、端壁略斜。px 是每毫米的像素數，所以換物鏡時是同一批細胞被放大。
// 細胞長 0.1 mm，和模型「4× 物鏡時一排約 40 個」一致。
export function tissue(el, g, { CX, CY, R, px, kind = 'onion' }) {
  const green = kind === 'elodea', LEN_MM = .1, H = (green ? .05 : .04) * px, L = LEN_MM * px, detail = L >= 60, mid = L >= 18;
  const wall = green ? '#5C9646' : '#A98F3E', q = el('g', { transform: `rotate(-11 ${CX} ${CY})` }, g), ext = R * 1.08;
  const j0 = Math.floor(-ext / H), j1 = Math.ceil(ext / H), k0 = Math.floor(-ext / L) - 1, k1 = Math.ceil(ext / L) + 1;
  const xw = (j, k) => (k + rnd(j, 7) + (rnd(j * 3 + 1, k) - .5) * .5) * L, slant = (j, k) => (rnd(j + 11, k * 5) - .5) * Math.min(.34 * L, .9 * H);
  let walls = '', dots = '', inner = '';
  for (let j = j0; j <= j1; j++) {
    const y = j * H; walls += `M${(CX - ext).toFixed(1)} ${(CY + y).toFixed(1)}H${(CX + ext).toFixed(1)}`;
    for (let k = k0; k <= k1; k++) {
      const x = xw(j, k), sl = slant(j, k), x2 = xw(j, k + 1), sl2 = slant(j, k + 1);
      if (Math.hypot(x, y + H / 2) > ext + L) continue;
      walls += `M${(CX + x - sl / 2).toFixed(1)} ${(CY + y).toFixed(1)}L${(CX + x + sl / 2).toFixed(1)} ${(CY + y + H).toFixed(1)}`;
      const w = x2 - x, cx = CX + x + w * (.2 + rnd(j, k + 40) * .6), cy = CY + y + H * (.3 + rnd(j + 5, k) * .4);
      if (detail) {
        const p = [[x - sl / 2, y], [x2 - sl2 / 2, y], [x2 + sl2 / 2, y + H], [x + sl / 2, y + H]].map(([a, b]) => `${(CX + a).toFixed(1)},${(CY + b).toFixed(1)}`).join(' ');
        el('polygon', { points: p, fill: green ? '#DDF0C2' : '#FBF3CF', opacity: .35 + rnd(j, k + 9) * .45 }, q);
        if (green) { const n = 9 + Math.floor(rnd(j, k + 3) * 6); for (let i = 0; i < n; i++) { const edge = rnd(i, j * 7 + k) < .7, u = .08 + rnd(i + 1, j + k * 3) * .84, v = edge ? (rnd(i + 2, k) < .5 ? .16 : .84) + (rnd(i, k + j) - .5) * .1 : .25 + rnd(i + 3, j) * .5;
          el('ellipse', { cx: CX + x + w * u, cy: CY + y + H * v, rx: H * .1, ry: H * .07, fill: '#3F9B3C', stroke: '#2B7A2E', 'stroke-width': 1, transform: `rotate(${Math.round(rnd(i, k) * 180)} ${CX + x + w * u} ${CY + y + H * v})` }, q); } }
        else { el('ellipse', { cx, cy, rx: H * .2, ry: H * .15, fill: 'url(#ms-nuc)', stroke: '#6B4316', 'stroke-width': 1.2 }, q); el('circle', { cx: cx - H * .05, cy: cy - H * .03, r: H * .04, fill: '#5A3610' }, q);
          for (let i = 0; i < 7; i++) el('circle', { cx: CX + x + w * (.1 + rnd(i, j + k) * .8), cy: CY + y + H * (.15 + rnd(i + 4, k - j) * .7), r: 1.3, fill: '#C9B46A', opacity: .7 }, q); }
      } else if (green) { if (mid) for (let i = 0; i < 5; i++) dots += `M${(CX + x + w * (.12 + rnd(i, j + k * 3) * .76)).toFixed(1)} ${(CY + y + H * (.2 + rnd(i + 2, k + j) * .6)).toFixed(1)}h.1`; }
      else dots += `M${cx.toFixed(1)} ${cy.toFixed(1)}h.1`;
    }
  }
  if (detail) inner = walls;
  el('path', { d: walls, fill: 'none', stroke: wall, 'stroke-width': detail ? 7 : mid ? 1.6 : .7, 'stroke-linecap': 'round', opacity: detail ? 1 : .9 }, q);
  if (detail) el('path', { d: inner, fill: 'none', stroke: green ? '#CFE9B0' : '#F2E3A4', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, q);
  if (dots) el('path', { d: dots, fill: 'none', stroke: green ? '#3F9B3C' : '#8A5A22', 'stroke-width': green ? 2.6 : mid ? 4.4 : 1.5, 'stroke-linecap': 'round', opacity: green ? .9 : .85 }, q);
  return q;
}

// 解剖顯微鏡看到的小木塊：正立、有厚度和影子。
export function woodBlock(el, txt, g, { CX, CY }) {
  el('rect', { x: CX - 400, y: CY - 400, width: 800, height: 800, fill: '#F4F0E4' }, g);
  el('path', { d: `M${CX - 150} ${CY + 112}h300l26 26h-300z`, fill: '#000', opacity: .22 }, g);
  el('path', { d: `M${CX + 150} ${CY - 108}l22 20v222l-22-22z`, fill: '#B98A52', stroke: '#8A6A3A', 'stroke-width': 2 }, g);
  el('path', { d: `M${CX - 150} ${CY + 112}h300l22 22h-300z`, fill: '#A87943', stroke: '#8A6A3A', 'stroke-width': 2 }, g);
  el('rect', { x: CX - 150, y: CY - 108, width: 300, height: 220, rx: 4, fill: 'url(#ms-wood)', stroke: '#8A6A3A', 'stroke-width': 2 }, g);
  let d = ''; for (let i = 0; i < 9; i++) { const y = CY - 92 + i * 24 + rnd(i, 2) * 8; d += `M${CX - 144} ${y.toFixed(1)}q75 ${(rnd(i, 5) * 16 - 8).toFixed(1)} 150 0t138 0`; }
  el('path', { d, fill: 'none', stroke: '#B58A4E', 'stroke-width': 1.6, opacity: .7 }, g);
  txt(g, CX + 5, CY + 48, 'F', { 'font-size': 130, fill: '#6B4A22' }).setAttribute('opacity', '.55'); txt(g, CX, CY + 42, 'F', { 'font-size': 130, fill: '#1B2233' });
}
