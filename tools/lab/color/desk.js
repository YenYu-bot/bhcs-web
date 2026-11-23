// 色光與顏料實驗桌：混色結果來自 ./model.mjs。
import { color, OBJECT, LIGHT } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const INK = '#23304A', TOOLHEX = { r: '#FF2A1F', g: '#18D14A', b: '#2A5BFF', c: '#00E5F0', m: '#F02BD8', y: '#FFE81A' };
const card = (el, txt, rig, o, label) => {
  el('rect', { x: 720, y: 150, width: 148, height: 180, rx: 16, fill: '#FFF8EC', stroke: INK, 'stroke-width': 3 }, rig);
  txt(rig, 794, 182, label, { 'font-size': 14, fill: '#5A6478' });
  el('rect', { x: 749, y: 198, width: 90, height: 76, rx: 12, fill: o.hex, stroke: INK, 'stroke-width': 2 }, rig);
  txt(rig, 794, 308, o.name, { 'font-size': 20 });
};
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('linearGradient', 'co-body', [[0, '#55627E'], [.35, '#9AA7C0'], [.55, '#3A4660'], [1, '#1C2438']]);
  g('linearGradient', 'co-tube', [[0, '#D7DDE6'], [.35, '#FFFFFF'], [.6, '#C9D0DA'], [1, '#9AA3B2']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('radialGradient', 'co-shade', [[0, '#fff', .55], [.35, '#fff', 0], [.8, '#000', .12], [1, '#000', .35]], { cx: .35, cy: .3, r: .8 });
  g('linearGradient', 'co-wood', [[0, '#E6C48C'], [1, '#B98A52']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  const f = el('filter', { id: 'co-paint', x: '-10%', y: '-10%', width: '120%', height: '120%' }, d);
  el('feTurbulence', { type: 'fractalNoise', baseFrequency: .035, numOctaves: 2, seed: 7, result: 'n' }, f); el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 16 }, f);
  const glow = el('filter', { id: 'co-glow', x: '-30%', y: '-30%', width: '160%', height: '160%' }, d); el('feGaussianBlur', { stdDeviation: 6 }, glow);
}
// 手電筒：(x, y) 是燈頭中心，ang 是朝向（0 ＝ 朝上），color 是燈光顏色（null ＝ 關）
function torch(el, txt, g, x, y, ang, color, label) {
  const q = el('g', { transform: `rotate(${ang} ${x} ${y})` }, g);
  el('rect', { x: x - 11, y: y + 20, width: 22, height: 62, rx: 6, fill: 'url(#co-body)', stroke: INK, 'stroke-width': 2 }, q);
  el('path', { d: `M${x - 18} ${y - 4}h36l-7 26h-22z`, fill: 'url(#co-body)', stroke: INK, 'stroke-width': 2 }, q);
  el('ellipse', { cx: x, cy: y - 4, rx: 18, ry: 5, fill: color || '#3A4660', stroke: INK, 'stroke-width': 2 }, q);
  if (color) el('ellipse', { cx: x, cy: y - 4, rx: 16, ry: 4, fill: '#fff', opacity: .7 }, q);
  el('rect', { x: x - 5, y: y + 40, width: 10, height: 14, rx: 3, fill: color ? '#7CF29B' : '#8A93A6', stroke: INK, 'stroke-width': 1.5 }, q);
  if (label) txt(g, x, y + 104, label, { 'font-size': 13, fill: color ? INK : '#5A6478' });
  return q;
}
// 顏料管（橫放）
function paintTube(el, txt, g, x, y, color, label) {
  el('path', { d: `M${x - 44} ${y - 13}h70l14 6v14l-14 6h-70z`, fill: 'url(#co-tube)', stroke: INK, 'stroke-width': 2 }, g);
  el('rect', { x: x - 30, y: y - 11, width: 44, height: 22, rx: 3, fill: color, stroke: INK, 'stroke-width': 1.2 }, g);
  el('path', { d: `M${x - 44} ${y - 13}l-6 -4v34l6 -4`, fill: '#C9D0DA', stroke: INK, 'stroke-width': 1.5 }, g);
  el('rect', { x: x + 40, y: y - 8, width: 16, height: 16, rx: 3, fill: '#2B3550', stroke: INK, 'stroke-width': 1.5 }, g);
  txt(g, x, y + 34, label, { 'font-size': 13 });
}
function thing(el, g, kind, x, y, fill, sc = 1) {
  const q = el('g', { transform: `translate(${x} ${y}) scale(${sc})` }, g);
  if (kind === 'apple') {
    el('path', { d: 'M0 -42C-14 -54 -58 -52 -60 -6C-62 34 -30 60 -12 56C-4 54 4 54 12 56C30 60 62 34 60 -6C58 -52 14 -54 0 -42Z', fill, stroke: '#3A2A20', 'stroke-width': 2 }, q);
    el('path', { d: 'M0 -42C-14 -54 -58 -52 -60 -6C-62 34 -30 60 -12 56C-4 54 4 54 12 56C30 60 62 34 60 -6C58 -52 14 -54 0 -42Z', fill: 'url(#co-shade)' }, q);
    el('path', { d: 'M0 -40q2 -18 12 -26', fill: 'none', stroke: '#5A3A22', 'stroke-width': 5, 'stroke-linecap': 'round' }, q);
    el('path', { d: 'M8 -58q22 -10 34 4q-20 8 -34 -4z', fill: fill === '#16181D' ? '#16181D' : '#4E9A3A', stroke: '#2F5E22', 'stroke-width': 1.5, opacity: .95 }, q);
  } else if (kind === 'leaf') {
    el('path', { d: 'M-70 18Q-20 -70 70 -24Q30 64 -70 18Z', fill, stroke: '#2B3A20', 'stroke-width': 2 }, q);
    el('path', { d: 'M-70 18Q-20 -70 70 -24Q30 64 -70 18Z', fill: 'url(#co-shade)' }, q);
    el('path', { d: 'M-70 18Q0 0 70 -24M-30 8l-6 -24M-6 2l-2 -28M20 -6l4 -26M-30 8l4 22M-6 2l8 26M20 -6l12 22', fill: 'none', stroke: '#000', 'stroke-width': 1.6, opacity: .25 }, q);
    el('path', { d: 'M-90 30l22 -12', stroke: '#5A3A22', 'stroke-width': 4, 'stroke-linecap': 'round' }, q);
  } else {
    el('path', { d: 'M-66 -46h120l12 12v84h-132z', fill, stroke: '#444', 'stroke-width': 2, transform: 'rotate(-6)' }, q);
    el('path', { d: 'M54 -46v12h12z', fill: '#000', opacity: .18, transform: 'rotate(-6)' }, q);
  }
  return q;
}

function scene({ rig, el, txt, s, r, step, set, drag, hint, kind }) {
  defs(el, rig);
  const can = kind === 'observe';
  const pick = (g, label, run) => { if (can) drag(g, null, { label, tap: run }); };
  // 拖一個工具到目標區，放開時在區內就呼叫 run
  const toss = (g, label, inside, run) => { if (!can) return; drag(g, () => ({ move(p, p0) { g.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`); }, end(p) { g.removeAttribute('transform'); if (inside(p)) run(); }, cancel() { g.removeAttribute('transform'); } }), { label, tap: run }); };
  const onScreen = p => p.x > 300 && p.x < 700 && p.y > 90 && p.y < 400;
  if (step === 'pigment') {
    el('rect', { x: 296, y: 86, width: 408, height: 318, rx: 6, fill: '#000', opacity: .15, transform: 'translate(4 6)' }, rig);
    el('rect', { x: 300, y: 90, width: 400, height: 310, rx: 4, fill: '#FFFDF8', stroke: '#B9B2A2', 'stroke-width': 2 }, rig);
    txt(rig, 500, 116, '白紙', { 'font-size': 14, fill: '#8A93A6' });
    const g = el('g', { style: 'isolation:isolate' }, rig);
    const spots = { c: [450, 215], m: [550, 215], y: [500, 300] }, names = { c: '青色', m: '洋紅色', y: '黃色' };
    for (const k of ['c', 'm', 'y']) if (s[k]) { const b = el('g', { 'data-drag': can ? `blob-${k}` : null }, g); el('circle', { cx: spots[k][0], cy: spots[k][1], r: 92, fill: TOOLHEX[k], filter: 'url(#co-paint)', style: 'mix-blend-mode:multiply', opacity: .92 }, b);
      toss(b, `擦掉${names[k]}顏料`, p => !onScreen(p) || true, () => set({ [k]: false })); }
    ['c', 'm', 'y'].forEach((k, i) => { const x = 340 + i * 160, tg = el('g', { 'data-drag': can && !s[k] ? `tube-${k}` : null, opacity: s[k] ? .4 : 1 }, rig);
      paintTube(el, txt, tg, x, 446, TOOLHEX[k], names[k] + '顏料');
      if (!s[k]) toss(tg, `塗上${names[k]}顏料`, onScreen, () => set({ [k]: true })); });
    card(el, txt, rig, r.pigment, '重疊處看起來');
    hint(500, 540, '把顏料管拖到紙上；點紙上的顏料就擦掉');
  } else if (step === 'object') {
    const L = LIGHT[s.light], beam = { white: '#FFF6C9', red: '#FF6A5C', green: '#6FE38A', blue: '#7F9BFF' }[s.light];
    el('rect', { x: 300, y: 90, width: 400, height: 310, rx: 12, fill: '#16181D' }, rig);
    el('path', { d: 'M470 150L392 392H608L530 150z', fill: beam, opacity: .28, filter: 'url(#co-glow)' }, rig);
    el('ellipse', { cx: 500, cy: 388, rx: 112, ry: 16, fill: beam, opacity: .25 }, rig);
    torch(el, txt, rig, 500, 140, 180, { white: '#FFF6C9', red: '#FF2A1F', green: '#18D14A' }[s.light], '');
    txt(rig, 500, 112, '', {});
    const stage = el('g', {}, rig); thing(el, stage, s.object, 500, 330, r.seen.hex);
    txt(rig, 500, 384, `${OBJECT[s.object][0]}（照${L[0]}）`, { 'font-size': 14, fill: '#fff' });
    // 濾光片：拖到手電筒上換光的顏色
    txt(rig, 370, 428, '濾光片（拖到手電筒上）', { 'font-size': 13, fill: '#5A6478' });
    ['white', 'red', 'green'].forEach((k, i) => { const x = 316 + i * 54, on = s.light === k, gq = el('g', { 'data-drag': can && !on ? `filter-${k}` : null, opacity: on ? .35 : 1 }, rig);
      el('rect', { x, y: 444, width: 44, height: 54, rx: 6, fill: { white: '#F4F7FA', red: '#FF6A5C', green: '#6FE38A' }[k], stroke: INK, 'stroke-width': 2, opacity: .9 }, gq);
      el('path', { d: `M${x + 6} ${450}l10 0l-8 40h-10z`, fill: '#fff', opacity: .5 }, gq);
      txt(gq, x + 22, 516, LIGHT[k][0], { 'font-size': 12 });
      if (!on) toss(gq, `換成${LIGHT[k][0]}`, p => Math.hypot(p.x - 500, p.y - 150) < 110, () => set({ light: k })); });
    // 物體：拖到台子上換
    txt(rig, 630, 428, '物體（拖到燈下）', { 'font-size': 13, fill: '#5A6478' });
    Object.entries(OBJECT).forEach(([k, [n]], i) => { const x = 566 + i * 64, on = s.object === k, gq = el('g', { 'data-drag': can && !on ? `obj-${k}` : null, opacity: on ? .3 : 1 }, rig);
      el('rect', { x: x - 28, y: 442, width: 56, height: 58, rx: 10, fill: '#FFF8EC', stroke: '#8A93A6', 'stroke-width': 1.5 }, gq);
      thing(el, gq, k, x, 468, { apple: '#E8352B', leaf: '#2EB24A', paper: '#FFFFFF' }[k], .3); txt(gq, x, 516, n, { 'font-size': 12 });
      if (!on) toss(gq, `把${n}放到燈下`, onScreen, () => set({ object: k })); });
    card(el, txt, rig, r.seen, '看起來');
    hint(500, 548, '把濾光片拖到手電筒上、把物體拖到燈下');
  } else {
    el('rect', { x: 300, y: 90, width: 400, height: 310, rx: 10, fill: '#000', stroke: INK, 'stroke-width': 3 }, rig);
    txt(rig, 500, 116, '暗室裡的白色屏幕', { 'font-size': 14, fill: '#6B7385' });
    const spots = { r: [440, 210], g: [560, 210], b: [500, 300] }, base = { r: [380, 462], g: [500, 466], b: [620, 462] }, names = { r: '紅光', g: '綠光', b: '藍光' };
    const beams = el('g', {}, rig), g = el('g', { style: 'isolation:isolate' }, rig); el('rect', { x: 302, y: 92, width: 396, height: 306, rx: 8, fill: '#000' }, g);
    for (const k of ['r', 'g', 'b']) if (s[k]) { const [sx, sy] = spots[k], [bx, by] = base[k];
      el('path', { d: `M${bx - 14} ${by - 8}L${sx - 70} ${sy + 60}L${sx + 70} ${sy + 60}L${bx + 14} ${by - 8}z`, fill: TOOLHEX[k], opacity: .14 }, beams);
      el('circle', { cx: sx, cy: sy, r: 100, fill: TOOLHEX[k], style: 'mix-blend-mode:screen' }, g); }
    for (const k of ['r', 'g', 'b']) { const [sx, sy] = spots[k], [bx, by] = base[k], ang = Math.atan2(sx - bx, by - sy) * 180 / Math.PI, tg = el('g', { 'data-drag': can ? `torch-${k}` : null }, rig);
      torch(el, txt, tg, bx, by, ang, s[k] ? TOOLHEX[k] : null, `${names[k]}（${s[k] ? '開' : '關'}）`);
      el('rect', { x: bx - 30, y: by - 20, width: 60, height: 110, fill: 'transparent' }, tg);
      pick(tg, `${s[k] ? '關掉' : '打開'}${names[k]}`, () => set({ [k]: !s[k] })); }
    card(el, txt, rig, r.light, '重疊處看起來');
    hint(500, 616, '點手電筒開關燈');
  }
}

const sw = (key, label) => ({ key, label, type: 'seg', options: [[false, '關'], [true, '開']] });
const pg = (key, label) => ({ key, label, type: 'seg', options: [[false, '不塗'], [true, '塗上']] });
const on = (s, keys, names) => keys.map((k, i) => s[k] ? names[i] : '').filter(Boolean).join('＋') || '都沒有';
const LN = ['紅光', '綠光', '藍光'], PN = ['青', '洋紅', '黃'];

runDesk({
  key: 'bhcs.lab.color.v1', title: '色光與顏料實驗桌',
  sceneLabel: '色光與顏料實驗桌：點手電筒開關色光、把顏料管拖到紙上、把濾光片和物體拖到燈下；右邊的色卡寫出看到的顏色',
  initial: { r: true, g: false, b: false, c: false, m: false, y: false, object: 'apple', light: 'white' },
  model: color, scene, viewBox: s => s === 'light' ? { desk: '160 50 720 590', phone: '160 50 720 590' } : { desk: '160 50 720 520', phone: '160 50 720 520' }, phoneText: 1.3,
  readouts: (s, r) => [['色光重疊', r.light.name, '', on(s, ['r', 'g', 'b'], LN)], ['顏料重疊', r.pigment.name, '', on(s, ['c', 'm', 'y'], PN)], ['物體看起來', r.seen.name, '', `${OBJECT[s.object][0]}＋${LIGHT[s.light][0]}`]],
  why: { title: '光和顏料的三原色', button: '三原色', html: `
    <p class="fn-tip"><b>色光三原色：紅、綠、藍。</b>色光越加越亮，三種一起就是白光。紅＋綠＝黃、綠＋藍＝青、紅＋藍＝洋紅。</p>
    <p class="fn-tip"><b>顏料三原色：青、洋紅、黃。</b>顏料會吸收一部分色光，越混吸收越多、越暗，三種一起接近黑色。</p>
    <p class="fn-tip"><b>物體的顏色</b>是它反射出來的色光。紅蘋果只反射紅光；照到的光裡沒有紅光，它就沒有光可以反射，看起來是黑的。</p>
    <p class="fn-tip">螢幕顯示的顏色和真正的色光、顏料會有一點差別，請以文字寫的顏色名稱為準。</p>` },
  steps: [
    { id: 'light', label: '色光相加', title: '兩種色光疊在一起，變什麼顏色？', goal: '開關三盞燈。收下「紅＋綠」「綠＋藍」「紅＋綠＋藍」三種結果。',
      intro: '現在只有紅光。再打開綠光看看重疊的地方。', enter: { r: true, g: false, b: false }, controls: [sw('r', '紅光'), sw('g', '綠光'), sw('b', '藍光')],
      react: (s, r) => `${on(s, ['r', 'g', 'b'], LN)}：${r.light.name}。`,
      targets: [[1, 1, 0, '紅＋綠'], [0, 1, 1, '綠＋藍'], [1, 1, 1, '紅＋綠＋藍']].map(([r, g, b, label]) => ({ sig: `${r}${g}${b}`, label, aim: `試「${label}」。`, set: { r: !!r, g: !!g, b: !!b }, title: s => on(s, ['r', 'g', 'b'], LN), body: (s, q) => `重疊處是${q.light.name}` })),
      found: ['色光越加越亮：紅＋綠＝黃、綠＋藍＝青，三種一起變成白光。', '紅＋綠＋藍 ＝ 白'] },
    { id: 'pigment', label: '顏料相減', title: '顏料混在一起，為什麼越混越暗？', goal: '在白紙上塗顏料。收下「青＋洋紅」「洋紅＋黃」「三種都塗」三種結果。',
      intro: '顏料和色光不一樣。先塗青色和洋紅色。', enter: { c: true, m: false, y: false }, controls: [pg('c', '青色顏料'), pg('m', '洋紅色顏料'), pg('y', '黃色顏料')],
      react: (s, r) => `${on(s, ['c', 'm', 'y'], PN)}：${r.pigment.name}。`,
      targets: [[1, 1, 0, '青＋洋紅'], [0, 1, 1, '洋紅＋黃'], [1, 1, 1, '三種都塗']].map(([c, m, y, label]) => ({ sig: `${c}${m}${y}`, label, aim: `試「${label}」。`, set: { c: !!c, m: !!m, y: !!y }, title: s => on(s, ['c', 'm', 'y'], PN), body: (s, q) => `重疊處是${q.pigment.name}` })),
      found: ['每種顏料都會吸收一部分色光，混越多、反射出來的光越少，所以越暗。', '青＋洋紅＝藍、洋紅＋黃＝紅、三種＝黑'] },
    { id: 'object', label: '物體顏色', title: '紅蘋果在綠光下是什麼顏色？', goal: '換物體和手電筒的光。收下「紅蘋果＋白光」「紅蘋果＋綠光」「白紙＋綠光」。',
      intro: '在暗室裡用不同顏色的光照物體。', enter: { object: 'apple', light: 'white' },
      controls: [{ key: 'object', label: '物體', type: 'seg', options: Object.entries(OBJECT).map(([k, [n]]) => [k, n]) }, { key: 'light', label: '手電筒的光', type: 'seg', options: ['white', 'red', 'green'].map(k => [k, LIGHT[k][0]]) }],
      react: (s, r) => `${OBJECT[s.object][0]}在${LIGHT[s.light][0]}下看起來${r.seen.name}。`,
      targets: [['apple', 'white'], ['apple', 'green'], ['paper', 'green']].map(([object, light]) => ({ sig: object + light, label: `${OBJECT[object][0]}＋${LIGHT[light][0]}`, aim: `試${OBJECT[object][0]}和${LIGHT[light][0]}。`, set: { object, light }, title: s => `${OBJECT[s.object][0]}＋${LIGHT[s.light][0]}`, body: (s, q) => `看起來${q.seen.name}` })),
      found: ['物體只能反射它會反射的色光。紅蘋果在綠光下沒有紅光可反射，所以是黑的；白紙什麼光都反射。', '看到的顏色 ＝ 照到的光裡，物體反射出來的部分'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想色光和顏料哪裡不一樣。',
      found: ['你把色光和顏料弄懂了！', '色光相加變亮；顏料相減變暗'] }
  ],
  quiz: [
    { q: '舞台上紅色和綠色的聚光燈照在同一塊白布上，重疊處看起來是？', options: [
      { text: '咖啡色。', why: '那是顏料混色的經驗。色光是相加的，你的證據：紅光＋綠光＝黃色。' },
      { text: '黃色。', ok: true },
      { text: '黑色。', why: '色光越加越亮，不會變黑。' }] },
    { q: '為什麼三種顏料混在一起接近黑色，三種色光混在一起卻是白色？', options: [
      { text: '顏料吸收色光，越混反射越少；色光是直接相加，越加越亮。', ok: true },
      { text: '因為顏料比較濃。', why: '和濃淡無關。顏料是靠吸收色光來顯色，混越多吸收越多。' },
      { text: '因為光沒有顏色。', why: '光有顏色。差別在色光相加、顏料相減。' }] },
    { q: '只有藍光的房間裡，一顆紅蘋果看起來是？', options: [
      { text: '紅色，蘋果本來就是紅的。', why: '紅蘋果只會反射紅光。藍光裡沒有紅光，它沒有光可以反射。' },
      { text: '紫色，紅加藍。', why: '蘋果不會發光，只能反射照到的光，不會把紅色「加」上去。' },
      { text: '接近黑色。', ok: true }] }
  ],
  finish: { title: '你把色光和顏料弄懂了！', rule: '色光三原色紅、綠、藍，相加變亮，全部加起來是白。顏料三原色青、洋紅、黃，吸收色光，越混越暗。物體的顏色是它反射的色光。', next: { label: '去光的反射與折射實驗桌', href: '../reflection-refraction/' } }
});
