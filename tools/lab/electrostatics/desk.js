// 靜電感應實驗桌：電荷分布與電子移動全部來自 scripts/science/models.mjs 的 calculate('electrostatics')。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('electrostatics', { rod: s.rod, step: s.step });
const ROD = { neg: '帶負電的塑膠棒', pos: '帶正電的玻璃棒' };
const STEP = { near: '只靠近', ground: '靠近並接地', g1: '先斷接地、再移開棒', g2: '先移開棒、再斷接地', contact: '接觸後移開' };
const charge = r => r.net === 0 ? '0' : r.net > 0 ? '正' : '負';

const n1 = v => (+v).toFixed(1);
const CX = 600, CY = 290, R = 100;
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (tag, id, stops, a = {}) => { const n = el(tag, { id, ...a }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('radialGradient', 'es-ball', [[0, '#FFFFFF'], [.25, '#E3E8EF'], [.7, '#A9B3C1'], [1, '#6E7888']], { cx: .35, cy: .3, r: .8 });
  g('linearGradient', 'es-stand', [[0, '#E9F3FA', .9], [.5, '#C7DCEB', .7], [1, '#E9F3FA', .9]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  g('linearGradient', 'es-wood', [[0, '#C9A877'], [1, '#86693F']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'es-plastic', [[0, '#5A5F6B'], [.35, '#8A909C'], [1, '#3A3E47']], { x1: 0, y1: 0, x2: 0, y2: 1 });
  g('linearGradient', 'es-glass', [[0, '#F4FBFF', .9], [.4, '#C9E6F5', .55], [1, '#9FC8DE', .8]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  const m = el('marker', { id: 'es-a', viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#2F6FB0' }, m);
}
const mark = (el, txt, g, x, y, sign, r = 9) => { el('circle', { cx: n1(x), cy: n1(y), r, fill: sign > 0 ? '#D8443A' : '#2F6FB0', stroke: '#fff', 'stroke-width': 1.5 }, g); txt(g, n1(x), n1(y + r * .5), sign > 0 ? '+' : '−', { fill: '#fff', 'font-size': r * 1.6, 'font-weight': 900, 'pointer-events': 'none' }); };
// 帶電棒：tip 是前端的 x
function rod(el, txt, g, tip, y, kind, op = 1) {
  const q = el('g', { opacity: op }, g), L = 300, x0 = tip - L;
  if (kind === 'neg') { el('rect', { x: x0, y: y - 13, width: L, height: 26, rx: 13, fill: 'url(#es-plastic)', stroke: '#23304A', 'stroke-width': 2 }, q); el('rect', { x: x0 + 12, y: y - 9, width: L - 30, height: 5, rx: 2.5, fill: '#fff', opacity: .3 }, q); }
  else { el('rect', { x: x0, y: y - 12, width: L, height: 24, rx: 12, fill: 'url(#es-glass)', stroke: '#5E8FA8', 'stroke-width': 2 }, q); el('rect', { x: x0 + 12, y: y - 8, width: L - 30, height: 4, rx: 2, fill: '#fff', opacity: .85 }, q); }
  el('rect', { x: x0 - 6, y: y - 16, width: 70, height: 32, rx: 10, fill: kind === 'neg' ? '#E7D7B5' : '#F1E4F2', stroke: '#8A6A3C', 'stroke-width': 1.5 }, q);
  txt(q, x0 + 29, y + 5, kind === 'neg' ? '毛皮' : '絲綢', { 'font-size': 11, fill: '#5A4314', 'pointer-events': 'none' });
  for (let i = 0; i < 5; i++) mark(el, txt, q, tip - 26 - i * 40, y, kind === 'neg' ? -1 : 1, 8);
  txt(q, tip - 150, y + 36, kind === 'neg' ? '帶負電的塑膠棒' : '帶正電的玻璃棒', { 'font-size': 13, fill: '#23304A' });
  return q;
}
function scene({ rig, el, txt, s, r, step, set, drag, hint, kind, reduce }) {
  defs(el, rig);
  const can = kind === 'observe';
  // 絕緣支架與金屬球
  el('ellipse', { cx: CX, cy: 462, rx: 90, ry: 10, fill: '#000', opacity: .12 }, rig);
  el('rect', { x: CX - 80, y: 440, width: 160, height: 20, rx: 6, fill: 'url(#es-wood)', stroke: '#6B5540', 'stroke-width': 2 }, rig);
  el('rect', { x: CX - 9, y: CY + R - 6, width: 18, height: 446 - CY - R + 6, rx: 4, fill: 'url(#es-stand)', stroke: '#7FA6BE', 'stroke-width': 1.5 }, rig);
  txt(rig, CX + 48, 432, '絕緣支架', { 'font-size': 11, fill: '#5A6478' });
  el('circle', { cx: CX, cy: CY, r: R, fill: 'url(#es-ball)', stroke: '#4E5868', 'stroke-width': 3 }, rig);
  el('ellipse', { cx: CX - 38, cy: CY - 46, rx: 26, ry: 14, fill: '#fff', opacity: .7, transform: `rotate(-30 ${CX - 38} ${CY - 46})` }, rig);
  const ch = el('g', {}, rig);
  if (r.near && r.far && r.near === r.far) for (let i = 0; i < 8; i++) { const a = i / 8 * 2 * Math.PI + .3; mark(el, txt, ch, CX + 80 * Math.cos(a), CY + 80 * Math.sin(a), r.near); }
  else for (const [dx, sg] of [[-1, r.near], [1, r.far]]) if (sg) for (let i = 0; i < 5; i++) { const a = (dx < 0 ? Math.PI : 0) + (i - 2) * .32; mark(el, txt, ch, CX + 78 * Math.cos(a), CY + 78 * Math.sin(a), sg); }
  if (!r.near && !r.far) txt(rig, CX, CY + 6, '電中性', { 'font-size': 16, fill: '#5A6478' });
  el('rect', { x: CX - 120, y: 138, width: 240, height: 28, rx: 14, fill: 'rgba(255,255,255,.92)' }, rig);
  txt(rig, CX, 158, `金屬球淨電荷：${r.net === 0 ? '0（電中性）' : '帶' + charge(r) + '電'}`, { 'font-size': 15, fill: r.net > 0 ? '#C8372D' : r.net < 0 ? '#2F6FB0' : '#23304A' });
  // 帶電棒
  if (r.rodPresent) rod(el, txt, rig, CX - R - 36, CY, s.rod);
  else if (s.step === 'contact') { rod(el, txt, rig, CX - R - 110, CY, s.rod, .6); el('path', { d: `M${CX - R - 6} ${CY - 30}l-60 0`, stroke: '#8792A6', 'stroke-width': 3, 'stroke-dasharray': '5 4', 'marker-end': 'url(#es-a)' }, rig); txt(rig, CX - R - 70, CY - 40, '碰一下後移開', { 'font-size': 12, fill: '#5A6478' }); }
  else txt(rig, 300, CY + 6, '帶電棒已移開', { 'font-size': 15, fill: '#5A6478' });
  // 接地線：電子沿著線走
  if (r.groundPresent) { const d = `M${CX + R - 8} ${CY + 30}C${CX + R + 70} ${CY + 40} ${CX + R + 100} ${CY + 80} ${CX + R + 100} 446`;
    el('path', { d, fill: 'none', stroke: '#23304A', 'stroke-width': 6 }, rig); el('path', { id: 'es-gw', d, fill: 'none', stroke: '#3BA55C', 'stroke-width': 3.5 }, rig);
    const gx = CX + R + 100; for (const [w, dy] of [[56, 0], [38, 10], [20, 20]]) el('line', { x1: gx - w / 2, y1: 446 + dy, x2: gx + w / 2, y2: 446 + dy, stroke: '#23304A', 'stroke-width': 4 }, rig);
    txt(rig, gx + 52, 460, '接地', { 'font-size': 14, fill: '#5A6478' });
    for (let i = 0; i < 3; i++) { const c = el('circle', { r: 6, fill: '#2F6FB0', stroke: '#fff', 'stroke-width': 1.2 }, rig);
      if (reduce) { c.setAttribute('cx', n1(CX + R + 50 + i * 18)); c.setAttribute('cy', n1(CY + 50 + i * 40)); }
      else { const a = el('animateMotion', { dur: '1.8s', begin: `-${(i * .6).toFixed(1)}s`, repeatCount: 'indefinite', keyPoints: r.rodSign < 0 ? '0;1' : '1;0', keyTimes: '0;1', calcMode: 'linear' }, c); el('mpath', { href: '#es-gw' }, a); } }
    txt(rig, CX + R + 120, CY + 30, r.rodSign < 0 ? '電子：球 → 大地' : '電子：大地 → 球', { 'font-size': 12, fill: '#2F6FB0' }); }
  // 下方
  if (step === 'order') {
    const slot = [[120, 360], [400, 640], [680, 900]], y0 = 482, first = s.step === 'g1' ? 'ground' : 'rod';
    el('rect', { x: 110, y: 472, width: 800, height: 84, rx: 14, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 2 }, rig);
    const box = (x0, x1, t, sub, c, g) => { el('rect', { x: x0, y: y0, width: x1 - x0, height: 52, rx: 10, fill: c, stroke: '#23304A', 'stroke-width': 1.5 }, g); txt(g, (x0 + x1) / 2, y0 + 22, t, { 'font-size': 14 }); txt(g, (x0 + x1) / 2, y0 + 42, sub, { 'font-size': 11, fill: '#5A6478' }); };
    box(...slot[0], '① 負電棒靠近＋接地', '電子流入大地', '#EEF3FB', rig);
    for (const x of [380, 660]) el('path', { d: `M${x - 10} ${y0 + 26}h20`, stroke: '#23304A', 'stroke-width': 2.5, 'marker-end': 'url(#es-a)' }, rig);
    for (const k of ['ground', 'rod']) { const i = k === first ? 1 : 2, g = el('g', { 'data-drag': can ? 'card-' + k : null }, rig), m = el('g', {}, g);
      box(...slot[i], `${i === 1 ? '②' : '③'} ${k === 'ground' ? '斷開接地' : '移開帶電棒'}`, i === 1 ? '先做' : '後做', k === 'ground' ? '#E7F5EA' : '#FBEDEA', m);
      if (can) drag(g, p0 => { let x = p0.x; return { move(p) { x = p.x; m.setAttribute('transform', `translate(${n1(p.x - p0.x)} 0)`); },
        end() { const want = x < 660 ? 1 : 2; if (want !== i) set({ step: (want === 1) === (k === 'ground') ? 'g1' : 'g2' }); else m.removeAttribute('transform'); }, cancel() { m.removeAttribute('transform'); } }; },
        { label: `把「${k === 'ground' ? '斷開接地' : '移開帶電棒'}」排到${i === 1 ? '後面' : '前面'}`, tap: () => set({ step: s.step === 'g1' ? 'g2' : 'g1' }) }); }
    txt(rig, 510, 580, r.flow.length > 40 ? r.flow.slice(0, 40) : r.flow, { 'font-size': 13, fill: '#23304A' });
    hint(510, 612, '拖卡片換順序：先斷接地，還是先移開棒？');
  } else {
    // 棒架：放另一支棒，拖過去換棒
    const other = s.rod === 'neg' ? 'pos' : 'neg';
    el('rect', { x: 110, y: 474, width: 250, height: 82, rx: 14, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 2 }, rig);
    txt(rig, 235, 494, '棒架：換另一支棒', { 'font-size': 12, fill: '#5A6478' });
    const rg = el('g', { 'data-drag': can ? 'rack' : null }, rig), rm = el('g', { transform: 'translate(0 0)' }, rg);
    const sc = el('g', { transform: 'translate(235 518) scale(.62) translate(-450 -290)' }, rm); rod(el, txt, sc, 600, 290, other);
    el('rect', { x: 120, y: 500, width: 230, height: 46, fill: 'transparent' }, rm);
    if (can) drag(rg, p0 => { let q = p0; return { move(p) { q = p; rm.setAttribute('transform', `translate(${n1(p.x - p0.x)} ${n1(p.y - p0.y)})`); },
      end() { if (q.y < 450) set({ rod: other }); else rm.setAttribute('transform', 'translate(0 0)'); }, cancel() { rm.setAttribute('transform', 'translate(0 0)'); } }; },
      { label: `換成${ROD[other]}`, tap: () => set({ rod: other }) });
    el('rect', { x: 376, y: 474, width: 534, height: 82, rx: 14, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 2 }, rig);
    txt(rig, 643, 500, STEP[s.step], { 'font-size': 14 });
    const f = r.flow; txt(rig, 643, 526, f.slice(0, 26), { 'font-size': 13.5, fill: '#2F6FB0' }); if (f.length > 26) txt(rig, 643, 546, f.slice(26), { 'font-size': 13.5, fill: '#2F6FB0' });
    hint(510, 590, '把棒架上的另一支棒拖到球旁邊');
  }
}

const tgt = (sig, label, rod, step, aim) => ({ sig, label, aim, set: { rod, step },
  title: s => `${s.rod === 'neg' ? '負電棒' : '正電棒'}・${STEP[s.step]}`,
  body: (s, r) => r.net === 0 && r.near ? `淨電荷 0，近端${r.nearText}、遠端${r.farText}` : r.net === 0 ? '淨電荷 0，不帶電' : `帶${charge(r)}電` });

runDesk({
  key: 'bhcs.lab.electrostatics.v1', title: '靜電感應實驗桌', background: 'bg-physics-bench',
  sceneLabel: '靜電感應實驗桌：帶電棒靠近架在絕緣支架上的金屬球，畫面顯示球上多出或缺少電子的位置，以及接地線',
  initial: { rod: 'neg', step: 'near' },
  model, scene, viewBox: { desk: '100 125 820 505', phone: '100 125 820 505' }, phoneText: 1.5,
  readouts: (s, r) => [['金屬球淨電荷', charge(r), '', r.net === 0 ? '電子總數沒變' : r.net > 0 ? '電子比質子少' : '電子比質子多'], ['靠近棒那端', r.near === 0 ? '0' : r.nearText, '', '近端電性'], ['遠端', r.far === 0 ? '0' : r.farText, '', '遠端電性']],
  why: { title: '靜電感應與接觸起電', button: '電荷怎麼動', html: `
    <p class="fn-tip"><b>同性相斥、異性相吸。</b>物體帶負電是電子比質子多，帶正電是電子比質子少。</p>
    <p class="fn-tip"><b>金屬裡會移動的是電子，質子（＋）不會動。</b>帶電棒靠近時，球內電子被推開或吸過來，兩端帶異性電，但總數沒變，這叫極化。</p>
    <p class="fn-tip"><b>感應起電：</b>棒靠近時把球接地，電子經接地線進出大地。先斷開接地、再移開棒，球就帶與棒相反的電。順序反過來，電子又回來了，球不帶電。</p>
    <p class="fn-tip"><b>接觸起電：</b>棒碰到球，電子直接在兩者之間轉移，球帶與棒相同的電。</p>
    <p class="fn-tip">模型說明：畫面上的符號只表示電性與相對多寡，不是真實的電子數。</p>` },
  steps: [
    { id: 'near', label: '只靠近', title: '帶電棒只靠近，金屬球帶電了嗎？', goal: '分別用負電棒和正電棒靠近金屬球（不碰到），看近端、遠端和淨電荷，各收一張。',
      intro: '帶負電的塑膠棒靠近金屬球。球裡的電子會怎麼動？', enter: { rod: 'neg', step: 'near' },
      controls: [{ key: 'rod', label: '帶電棒', type: 'seg', options: [['neg', '負電（塑膠棒）'], ['pos', '正電（玻璃棒）']], cols: 2 }],
      react: (s, r) => `近端${r.nearText}電、遠端${r.farText}電，但淨電荷是 0。`,
      targets: [tgt('nn', '負電棒靠近', 'neg', 'near', '先用負電棒。'), tgt('np', '正電棒靠近', 'pos', 'near', '換正電棒。')],
      found: ['只靠近時球的淨電荷是 0；電子在球內移動，近端帶異性電、遠端帶同性電。', '這叫極化：電子總數沒有改變'] },
    { id: 'ground', label: '接地', title: '靠近時把球接地，會發生什麼事？', goal: '負電棒靠近，同時用導線把球接地，收一張；再換正電棒試一次。',
      intro: '接上接地線，電子就能在球和大地之間移動了。', enter: { rod: 'neg', step: 'ground' },
      controls: [{ key: 'rod', label: '帶電棒', type: 'seg', options: [['neg', '負電（塑膠棒）'], ['pos', '正電（玻璃棒）']], cols: 2 }],
      react: (s, r) => r.flow + '。',
      targets: [tgt('gn', '負電棒＋接地', 'neg', 'ground', '負電棒靠近並接地。'), tgt('gp', '正電棒＋接地', 'pos', 'ground', '換正電棒並接地。')],
      found: ['接地時電子經接地線進出大地，球帶與棒相反的電。', '負電棒：電子跑到大地；正電棒：電子從大地上來'] },
    { id: 'order', label: '移開順序', title: '先移開哪一個，結果會一樣嗎？', goal: '負電棒靠近並接地後，比較兩種移開順序，各收一張。',
      intro: '球已經接地了。要先斷開接地，還是先移開帶電棒？', enter: { rod: 'neg', step: 'g1' },
      controls: [{ key: 'step', label: '移開的順序', type: 'seg', options: [['g1', '先斷接地，再移開棒'], ['g2', '先移開棒，再斷接地']], cols: 2 }],
      react: (s, r) => r.net === 0 ? '電子又回到球上，球不帶電。' : `球最後帶${charge(r)}電，均勻分布在表面。`,
      targets: [tgt('o1', '先斷接地', 'neg', 'g1', '選「先斷接地，再移開棒」。'), tgt('o2', '先移開棒', 'neg', 'g2', '選「先移開棒，再斷接地」。')],
      found: ['先斷接地再移開棒，球帶與棒相反的電；順序反過來，球不帶電。', '感應起電：靠近 → 接地 → 斷接地 → 移開棒'] },
    { id: 'contact', label: '接觸起電', title: '帶電棒碰到球，又會怎樣？', goal: '讓負電棒和正電棒分別碰一下金屬球再移開，各收一張，和感應起電比一比。',
      intro: '這次讓棒直接碰到球。球最後帶什麼電？', enter: { rod: 'neg', step: 'contact' },
      controls: [{ key: 'rod', label: '帶電棒', type: 'seg', options: [['neg', '負電（塑膠棒）'], ['pos', '正電（玻璃棒）']], cols: 2 }],
      react: (s, r) => `${r.flow}，球帶${charge(r)}電。`,
      targets: [tgt('cn', '負電棒接觸', 'neg', 'contact', '先用負電棒碰一下。'), tgt('cp', '正電棒接觸', 'pos', 'contact', '換正電棒碰一下。')],
      found: ['接觸起電，球帶與棒相同的電；感應起電帶相反的電。', '接觸：電子直接轉移；感應：電子經接地線移動'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想電子怎麼移動。',
      found: ['你把靜電感應弄懂了！', '會動的是電子，質子不會動'] }
  ],
  quiz: [
    { q: '帶負電的棒只靠近金屬球（沒有接地、沒有碰到），球的淨電荷是？', options: [
      { text: '帶正電，因為正電被吸過來。', why: '質子不會移動；電子只是在球內移到遠端，總數沒變。你的證據：淨電荷 0。' },
      { text: '0，只是兩端分別帶異性電。', ok: true },
      { text: '帶負電，因為棒是負的。', why: '沒有碰到、沒有接地，電子沒有進出球。淨電荷是 0。' }] },
    { q: '想用負電棒讓金屬球「帶正電」，正確的順序是？', options: [
      { text: '靠近 → 接地 → 先移開棒 → 再斷接地。', why: '先移開棒時接地還連著，電子又回來了，球不帶電。' },
      { text: '靠近 → 接地 → 先斷接地 → 再移開棒。', ok: true },
      { text: '直接用棒碰一下球。', why: '接觸起電會讓球帶與棒相同的電，也就是負電。' }] },
    { q: '金屬球帶正電時，是因為？', options: [
      { text: '多了一些質子。', why: '質子在原子核裡，不會移動。帶正電是電子變少了。' },
      { text: '少了一些電子。', ok: true },
      { text: '多了一些電子。', why: '多了電子是帶負電。' }] }
  ],
  finish: { title: '你把靜電感應弄懂了！', rule: '金屬裡會動的是電子。只靠近時淨電荷為 0；靠近並接地、先斷接地再移開棒，球帶相反的電；接觸起電，球帶相同的電。', next: { label: '去電磁實驗桌', href: '../electromagnetism/' } }
});
