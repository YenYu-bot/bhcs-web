// 眼睛與視力矯正實驗桌：成像位置來自 ./model.mjs。
import { eye } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';
import { tree as crown } from '../shared/plants.mjs';

const TYPE = { normal: '正常眼', myopia: '近視眼', hyperopia: '遠視眼' }, LENS = { none: '不戴眼鏡', concave: '凹透鏡', convex: '凸透鏡' }, DIST = { far: '遠方的樹', near: '近處的書' };
const WHERE = { front: '視網膜前方', on: '視網膜上', behind: '視網膜後方' };
const INK = '#23304A';
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('radialGradient', 'ey-ball', [[0, '#FFFFFF'], [.7, '#FFF4EE'], [1, '#F6CFC6']], { cx: .45, cy: .45, r: .6 });
  g('radialGradient', 'ey-vit', [[0, '#F4FAFF', .6], [1, '#DDEBF5', .4]]);
  g('linearGradient', 'ey-lens', [[0, '#E8F6FF'], [.4, '#BFE3F5'], [1, '#8FC7E6']], { x1: 0, y1: 0, x2: 1, y2: 1 });
  g('linearGradient', 'ey-iris', [[0, '#8A5A2E'], [.5, '#5E3A1A'], [1, '#3F2610']], { x1: 0, y1: 0, x2: 1, y2: 0 });
  g('linearGradient', 'ey-glass', [[0, '#E6F4FC', .9], [.5, '#BFDDF0', .7], [1, '#E6F4FC', .9]]);
}
function lensShape(el, g, kind, x, y, h = 90) {
  const d = kind === 'convex' ? `M${x} ${y - h} Q${x + 30} ${y} ${x} ${y + h} Q${x - 30} ${y} ${x} ${y - h}z` : `M${x - 16} ${y - h} H${x + 16} Q${x + 2} ${y} ${x + 16} ${y + h} H${x - 16} Q${x - 2} ${y} ${x - 16} ${y - h}z`;
  el('path', { d, fill: 'url(#ey-glass)', stroke: INK, 'stroke-width': 2.5 }, g);
  el('path', { d: `M${x - 6} ${y - h * .7}q-4 ${h * .4} 0 ${h * .8}`, fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: .7 }, g);
}
const tree = (el, g, x, y, sc = 1) => crown(el, g, { x, y: y + 50 * sc, h: 120 * sc, seed: 4 });
function book(el, txt, g, x, y, sc = 1) {
  const q = el('g', { transform: `translate(${x} ${y}) scale(${sc})` }, g);
  el('path', { d: 'M-20 -26h34a6 6 0 0 1 6 6v46h-40z', fill: '#F4C04E', stroke: INK, 'stroke-width': 2.5 }, q);
  el('path', { d: 'M-20 -26v52', stroke: '#C88A1E', 'stroke-width': 5 }, q);
  el('path', { d: 'M-10 -12h20M-10 -4h20M-10 4h14', stroke: '#8A5A12', 'stroke-width': 2 }, q);
}

function scene({ rig, el, txt, s, r, step, set, drag, hint, kind }) {
  defs(el, rig);
  const can = kind === 'observe', cy = 300, FX = 520, PX = 13, rx = r.length * PX / 2, cx = FX + rx, RX = FX + 2 * rx, fx = FX + r.focus * PX;
  // 眼球剖面：視神經、鞏膜、玻璃體、視網膜、角膜、虹膜、水晶體
  el('path', { d: `M${RX - 20} ${cy + 18}C${RX + 20} ${cy + 22} ${RX + 50} ${cy + 40} ${RX + 70} ${cy + 70}l-26 14C${RX + 30} ${cy + 64} ${RX + 10} ${cy + 50} ${RX - 20} ${cy + 46}z`, fill: '#F2D49A', stroke: INK, 'stroke-width': 2.5 }, rig);
  el('ellipse', { cx, cy, rx, ry: 150, fill: 'url(#ey-ball)', stroke: INK, 'stroke-width': 4 }, rig);
  el('ellipse', { cx, cy, rx: rx - 12, ry: 138, fill: 'url(#ey-vit)' }, rig);
  el('path', { d: `M${cx + rx * .25} ${cy - 134}A${rx - 10} 140 0 0 1 ${cx + rx * .25} ${cy + 134}`, fill: 'none', stroke: '#D9483A', 'stroke-width': 9, 'stroke-linecap': 'round' }, rig);
  el('path', { d: `M${cx + rx * .25} ${cy - 134}A${rx - 10} 140 0 0 1 ${cx + rx * .25} ${cy + 134}`, fill: 'none', stroke: '#F29A7E', 'stroke-width': 3 }, rig);
  txt(rig, RX + 34, cy - 118, '視網膜', { 'font-size': 14, fill: '#C8372D' }); txt(rig, RX + 64, cy + 112, '視神經', { 'font-size': 13, fill: '#8A6A2E' });
  el('path', { d: `M${FX + 10} ${cy - 76}Q${FX - 30} ${cy} ${FX + 10} ${cy + 76}`, fill: '#D6EEFA', stroke: INK, 'stroke-width': 3, opacity: .9 }, rig);
  txt(rig, FX - 26, cy - 84, '角膜', { 'font-size': 13, fill: '#5A6478' });
  for (const sgn of [-1, 1]) el('path', { d: `M${FX + 22} ${cy + sgn * 40}V${cy + sgn * 92}h10V${cy + sgn * 40}z`, fill: 'url(#ey-iris)', stroke: INK, 'stroke-width': 1.5 }, rig);
  const thick = s.dist === 'near' ? 26 : 15;
  el('ellipse', { cx: FX + 30, cy, rx: thick, ry: 62, fill: 'url(#ey-lens)', stroke: INK, 'stroke-width': 3 }, rig);
  el('path', { d: `M${FX + 26 - thick * .4} ${cy - 40}q-4 30 0 60`, fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: .7 }, rig);
  txt(rig, FX + 30, cy + 128, `水晶體${r.lensShape}`, { 'font-size': 13, fill: '#5A6478' });
  // 看的東西
  const srcX = 110, rays = [-52, 52], far = s.dist === 'far';
  if (far) { txt(rig, 150, cy - 96, '來自遠方的平行光', { 'font-size': 14, fill: '#5A6478', 'text-anchor': 'start' }); tree(el, rig, srcX + 22, cy + 14, .9); }
  else { book(el, txt, rig, srcX + 78, cy, 1); txt(rig, srcX + 78, cy + 48, '近處的書', { 'font-size': 14, fill: '#5A6478' }); }
  // 光線
  const GX = 420, EX = FX + 30, bend = s.lens === 'concave' ? 1.18 : s.lens === 'convex' ? 0.84 : 1;
  for (const dy of rays) {
    const sx = far ? srcX + 40 : srcX + 100, gy = far ? dy / bend : dy / bend * (GX - sx) / (EX - sx);
    const pts = [[sx, far ? cy + gy : cy], [GX, cy + gy], [EX, cy + dy]];
    const k = (RX - 6 - EX) / (fx - EX), endY = cy + dy * (1 - k);
    pts.push(r.off > 0 ? [RX - 6, endY] : [fx, cy]); if (r.off < 0) pts.push([RX - 6, endY]);
    el('path', { d: 'M' + pts.map(q => q.map(v => v.toFixed(1)).join(' ')).join(' L'), fill: 'none', stroke: '#F0A818', 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, rig);
    if (r.off > 0) el('path', { d: `M${RX - 6} ${endY.toFixed(1)} L${fx} ${cy}`, fill: 'none', stroke: '#F0A818', 'stroke-width': 2.5, 'stroke-dasharray': '7 7' }, rig);
  }
  el('circle', { cx: fx, cy, r: 8, fill: r.clear ? '#2E8B66' : '#C8372D', stroke: INK, 'stroke-width': 2 }, rig);
  txt(rig, fx - 44, cy + 30, '成像位置', { 'font-size': 13, fill: r.clear ? '#2E8B66' : '#C8372D' });
  // 鏡片：拖進眼睛前面的位置，拖出來就拿掉
  const lensStep = step === 'myopia' || step === 'hyperopia', slot = p => Math.abs(p.x - GX) < 70 && Math.abs(p.y - cy) < 130;
  const toss = (g, label, ok, run, tap) => { if (!can) return; drag(g, () => ({ move(p, p0) { g.setAttribute('transform', `translate(${p.x - p0.x} ${p.y - p0.y})`); }, end(p) { g.removeAttribute('transform'); if (ok(p)) run(); }, cancel() { g.removeAttribute('transform'); } }), { label, tap: tap || run }); };
  if (s.lens !== 'none') { const g = el('g', { 'data-drag': lensStep && can ? 'worn' : null }, rig); lensShape(el, g, s.lens, GX, cy); el('rect', { x: GX - 34, y: cy - 96, width: 68, height: 192, fill: 'transparent' }, g); txt(rig, GX, cy - 104, LENS[s.lens], { 'font-size': 14 });
    if (lensStep) toss(g, '拿掉眼鏡', p => !slot(p), () => set({ lens: 'none' })); }
  else if (lensStep) { el('rect', { x: GX - 30, y: cy - 96, width: 60, height: 192, rx: 20, fill: 'rgba(46,139,102,.05)', stroke: '#2E8B66', 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }, rig); txt(rig, GX, cy - 104, '眼鏡位置', { 'font-size': 13, fill: '#1F6E50' }); }
  if (lensStep) { txt(rig, 150, 456, '眼鏡盒', { 'font-size': 13, fill: '#5A6478' });
    el('rect', { x: 92, y: 466, width: 116, height: 76, rx: 12, fill: '#FFF8EC', stroke: '#8A93A6', 'stroke-width': 2, 'stroke-dasharray': '6 4' }, rig);
    ['concave', 'convex'].forEach((k, i) => { const x = 122 + i * 56, on = s.lens === k, g = el('g', { 'data-drag': can && !on ? `lens-${k}` : null, opacity: on ? .3 : 1 }, rig);
      lensShape(el, g, k, x, 498, 26); txt(g, x, 536, LENS[k], { 'font-size': 11 });
      if (!on) toss(g, `戴上${LENS[k]}`, slot, () => set({ lens: k })); }); }
  if (step === 'normal') { const other = far ? 'near' : 'far', g = el('g', { 'data-drag': can ? `look-${other}` : null }, rig);
    el('rect', { x: 92, y: 450, width: 116, height: 92, rx: 12, fill: '#FFF8EC', stroke: '#2E8B66', 'stroke-width': 2, 'stroke-dasharray': '6 4' }, g);
    if (other === 'near') book(el, txt, g, 150, 486, .8); else tree(el, g, 150, 486, .55);
    txt(g, 150, 532, `改看${DIST[other]}`, { 'font-size': 12, fill: '#1F6E50' });
    toss(g, `改看${DIST[other]}`, p => p.y < 430 && p.x < 480, () => set({ dist: other })); }
  el('rect', { x: 230, y: 486, width: 560, height: 50, rx: 14, fill: '#FFF8EC', stroke: INK, 'stroke-width': 3 }, rig);
  txt(rig, 510, 518, `${TYPE[s.type]}：像在${WHERE[r.where]}，${r.clear ? '看得清楚' : '看起來模糊'}`, { 'font-size': 17, fill: r.clear ? '#2E8B66' : '#C8372D' });
  hint(510, 564, step === 'normal' ? '點左下角改看遠方或近處' : '把眼鏡盒裡的鏡片拖到眼睛前面');
}

const tgt = (sig, label, set, aim) => ({ sig, label, set, aim, title: s => `${TYPE[s.type]}看${DIST[s.dist]}，${LENS[s.lens]}`, body: (s, r) => `像在${WHERE[r.where]}，${r.clear ? '清楚' : '模糊'}` });
const lensCtl = { key: 'lens', label: '眼鏡', type: 'seg', options: Object.entries(LENS) };

runDesk({
  key: 'bhcs.lab.eye.v1', title: '眼睛與視力矯正實驗桌',
  sceneLabel: '眼睛與視力矯正實驗桌：光線從左邊進入眼球剖面，經過角膜和水晶體後會聚成像，圓點是成像位置；可以把眼鏡盒裡的鏡片拖到眼睛前面',
  initial: { type: 'normal', dist: 'far', lens: 'none' },
  model: eye, scene, viewBox: { desk: '80 110 900 470', phone: '80 110 900 470' }, phoneText: 1.45,
  readouts: (s, r) => [['眼睛', TYPE[s.type], '', s.type === 'myopia' ? '眼球太長' : s.type === 'hyperopia' ? '眼球太短' : ''], ['成像位置', WHERE[r.where], '', LENS[s.lens]], ['看得清楚嗎', r.clear ? '清楚' : '模糊', '', DIST[s.dist]]],
  why: { title: '眼睛怎麼看見', button: '眼睛的構造', html: `
    <p class="fn-tip"><b>眼睛像一台相機。</b>水晶體是凸透鏡，把光會聚在視網膜上，成倒立縮小的實像，再由視神經傳到大腦。</p>
    <p class="fn-tip"><b>調節：</b>看近的東西時水晶體變厚，看遠時變薄，讓像都落在視網膜上。</p>
    <p class="fn-tip"><b>近視：</b>眼球太長（或水晶體太厚），遠處的像落在視網膜前方。戴凹透鏡讓光先發散一點，像往後移。</p>
    <p class="fn-tip"><b>遠視：</b>眼球太短，近處的像落在視網膜後方。戴凸透鏡讓光先會聚一點，像往前移。</p>
    <p class="fn-tip">這是示意模型，只比較成像位置的前後。</p>` },
  steps: [
    { id: 'normal', label: '正常眼', title: '看遠看近，眼睛怎麼對焦？', goal: '正常眼不戴眼鏡。收下看遠方和看近處的結果，注意水晶體的厚薄。',
      intro: '看遠方的樹，像落在哪裡？', enter: { type: 'normal', dist: 'far', lens: 'none' }, controls: [{ key: 'dist', label: '看什麼', type: 'seg', options: Object.entries(DIST) }],
      react: (s, r) => `水晶體${r.lensShape}，像在${WHERE[r.where]}。`,
      targets: [tgt('far', '看遠方', { type: 'normal', dist: 'far', lens: 'none' }, '看遠方的樹。'), tgt('near', '看近處', { type: 'normal', dist: 'near', lens: 'none' }, '看近處的書。')],
      found: ['正常眼靠水晶體變厚、變薄來調節，遠近的像都落在視網膜上。', '看近：水晶體變厚；看遠：變薄'] },
    { id: 'myopia', label: '近視', title: '近視眼看遠方，問題出在哪？', goal: '近視眼看遠方。收下不戴眼鏡和戴凹透鏡的結果；也可以試試戴錯的凸透鏡。',
      intro: '近視眼的眼球比較長。像落在哪裡？', enter: { type: 'myopia', dist: 'far', lens: 'none' }, controls: [lensCtl],
      react: (s, r) => `像在${WHERE[r.where]}，${r.clear ? '清楚了！' : '還是模糊。'}`,
      targets: [tgt('none', '不戴眼鏡', { type: 'myopia', dist: 'far', lens: 'none' }, '先看不戴眼鏡。'), tgt('fix', '戴凹透鏡', { type: 'myopia', dist: 'far', lens: 'concave' }, '戴上凹透鏡。')],
      found: ['近視的像落在視網膜前方；凹透鏡讓光先發散，像往後移到視網膜上。', '近視 → 凹透鏡'] },
    { id: 'hyperopia', label: '遠視', title: '遠視眼看近處，要戴哪種鏡片？', goal: '遠視眼看近處的書。收下不戴眼鏡和戴凸透鏡的結果。',
      intro: '遠視眼的眼球比較短。像落在哪裡？', enter: { type: 'hyperopia', dist: 'near', lens: 'none' }, controls: [lensCtl],
      react: (s, r) => `像在${WHERE[r.where]}，${r.clear ? '清楚了！' : '還是模糊。'}`,
      targets: [tgt('none', '不戴眼鏡', { type: 'hyperopia', dist: 'near', lens: 'none' }, '先看不戴眼鏡。'), tgt('fix', '戴凸透鏡', { type: 'hyperopia', dist: 'near', lens: 'convex' }, '戴上凸透鏡。')],
      found: ['遠視的像落在視網膜後方；凸透鏡讓光先會聚，像往前移到視網膜上。', '遠視 → 凸透鏡'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想成像位置在視網膜的前面還是後面。',
      found: ['你把視力矯正弄懂了！', '近視配凹透鏡；遠視配凸透鏡'] }
  ],
  quiz: [
    { q: '近視的人看不清楚遠方，是因為遠處物體的像落在？', options: [
      { text: '視網膜前方。', ok: true },
      { text: '視網膜後方。', why: '落在後方的是遠視。你的證據：近視眼不戴眼鏡時，像在視網膜前方。' },
      { text: '水晶體上。', why: '光通過水晶體後才會聚成像，像不會落在水晶體上。' }] },
    { q: '近視眼鏡是凹透鏡，它的作用是？', options: [
      { text: '把東西放大。', why: '放大是凸透鏡（放大鏡）的效果。凹透鏡是讓光線先發散一點。' },
      { text: '讓光線先發散，使像往後移到視網膜上。', ok: true },
      { text: '讓光線更會聚。', why: '近視的像已經太前面了，再會聚會更前面。你可以回去試戴凸透鏡看看。' }] },
    { q: '看近處的書時，正常眼的水晶體會？', options: [
      { text: '變薄。', why: '看遠才變薄。你的證據：看近處的書時水晶體變厚。' },
      { text: '變厚，讓近處的光也能會聚在視網膜上。', ok: true },
      { text: '不變，靠眼球前後移動。', why: '人眼是靠改變水晶體的厚薄來調節，眼球不會前後移動。' }] }
  ],
  finish: { title: '你把視力矯正弄懂了！', rule: '水晶體是凸透鏡，把光會聚在視網膜上。近視：像在視網膜前方，戴凹透鏡。遠視：像在視網膜後方，戴凸透鏡。', next: { label: '去透鏡成像實驗桌', href: '../lens/' } }
});
