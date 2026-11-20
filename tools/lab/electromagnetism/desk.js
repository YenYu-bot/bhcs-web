// 電磁實驗桌：線圈磁場用 scripts/science/models.mjs 的 calculate('electromagnetism')（空心螺線管 B ＝ μ₀NI/ℓ）。
// 吸起的迴紋針數與檢流計偏轉格數是教學示意（與磁場、磁通量變化成正比），不是實測。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const SPEED = { slow: 1, fast: 2 }, MOTION = { still: '不動', in: '插入線圈', out: '拉出線圈' };
function model(s) {
  if (s.mode === 'magnet') {
    const r = calculate('electromagnetism', { mode: 'magnet', turns: s.turns, current: s.current, field: 0, angle: 0, rpm: 0 });
    const mT = r.field * 1000;
    return { mT, clips: Math.round(Math.abs(mT) * 8), north: s.current > 0 ? 'right' : s.current < 0 ? 'left' : null };
  }
  const dir = s.motion === 'in' ? 1 : s.motion === 'out' ? -1 : 0;
  return { deflect: dir * SPEED[s.speed] * s.turns / 50, dir };
}
const mt = x => String(Math.round(Math.abs(x) * 1000) / 1000);

function scene({ rig, el, txt, P, s, r }) {
  if (s.mode === 'magnet') {
    // 線圈＋電池
    el('image', { href: P + 'prop-coil.webp', x: 300, y: 250, width: 400, height: 123 }, rig);
    txt(rig, 500, 240, `線圈 ${s.turns} 匝`, { 'font-size': 18 });
    el('image', { href: P + 'prop-battery.webp', x: 400, y: 450, width: 200, height: 73 }, rig);
    txt(rig, 500, 548, `電流 ${Math.abs(s.current)} A${s.current < 0 ? '（反接）' : ''}`, { 'font-size': 18 });
    el('path', { d: 'M310 330 Q250 330 250 420 Q250 486 400 486', fill: 'none', stroke: s.current > 0 ? '#C8372D' : '#2F6FB0', 'stroke-width': 5 }, rig);
    el('path', { d: 'M690 330 Q750 330 750 420 Q750 486 600 486', fill: 'none', stroke: s.current > 0 ? '#2F6FB0' : '#C8372D', 'stroke-width': 5 }, rig);
    // 磁極
    const pole = (x, N) => { el('circle', { cx: x, cy: 311, r: 26, fill: N ? '#C8372D' : '#2F6FB0', stroke: '#23304A', 'stroke-width': 3 }, rig); txt(rig, x, 319, N ? 'N' : 'S', { fill: '#fff', 'font-size': 22, 'font-weight': 900 }); };
    if (r.north) { pole(260, r.north === 'left'); pole(740, r.north === 'right'); }
    // 迴紋針（掛在右端下方）
    const n = Math.min(r.clips, 24);
    for (let i = 0; i < n; i++) {
      const col = i % 6, row = Math.floor(i / 6), x = 770 + col * 22, y = 350 + row * 34;
      el('path', { d: `M${x} ${y} v18 a5 5 0 0 0 10 0 v-14 a3 3 0 0 0 -6 0 v12`, fill: 'none', stroke: '#7A8699', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, rig);
    }
    txt(rig, 830, 340, `吸起 ${r.clips} 根迴紋針`, { 'font-size': 16, fill: '#C8372D' });
    // 指北針（左端外側）
    el('image', { href: P + 'prop-compass.webp', x: 110, y: 250, width: 120, height: 120 }, rig);
    const ang = r.north === 'right' ? 180 : 0; // 指針 N 端指向線圈的 S 極
    el('path', { d: 'M170 310 l-40 0 l40 -8 z', fill: '#C8372D', transform: `rotate(${ang} 170 310)` }, rig);
    el('path', { d: 'M170 310 l40 0 l-40 8 z', fill: '#23304A', transform: `rotate(${ang} 170 310)` }, rig);
    txt(rig, 170, 392, '指北針', { 'font-size': 15, fill: '#5A6478' });
  } else {
    // 線圈＋檢流計＋磁棒
    el('image', { href: P + 'prop-coil.webp', x: 460, y: 250, width: 360, height: 110 }, rig);
    txt(rig, 640, 240, `線圈 ${s.turns} 匝`, { 'font-size': 18 });
    el('path', { d: 'M470 320 Q420 320 420 430 H560', fill: 'none', stroke: '#7A5A3A', 'stroke-width': 4 }, rig);
    el('path', { d: 'M810 320 Q860 320 860 430 H720', fill: 'none', stroke: '#7A5A3A', 'stroke-width': 4 }, rig);
    el('rect', { x: 560, y: 390, width: 160, height: 110, rx: 14, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 4 }, rig);
    el('path', { d: 'M580 470 A60 60 0 0 1 700 470', fill: 'none', stroke: '#B8AC98', 'stroke-width': 3 }, rig);
    for (let k = -4; k <= 4; k++) { const a = (k * 10 - 90) * Math.PI / 180; el('line', { x1: 640 + 52 * Math.cos(a), y1: 470 + 52 * Math.sin(a), x2: 640 + 60 * Math.cos(a), y2: 470 + 60 * Math.sin(a), stroke: '#23304A', 'stroke-width': 2 }, rig); }
    const na = (Math.max(-4, Math.min(4, r.deflect)) * 10 - 90) * Math.PI / 180;
    el('line', { x1: 640, y1: 470, x2: 640 + 56 * Math.cos(na), y2: 470 + 56 * Math.sin(na), stroke: '#C8372D', 'stroke-width': 4, 'stroke-linecap': 'round' }, rig);
    el('circle', { cx: 640, cy: 470, r: 6, fill: '#23304A' }, rig);
    txt(rig, 640, 524, '檢流計', { 'font-size': 15, fill: '#5A6478' });
    const mx = s.motion === 'in' ? 330 : s.motion === 'out' ? 180 : 140;
    el('image', { href: P + 'prop-bar-magnet.webp', x: mx, y: 280, width: 240, height: 49 }, rig);
    txt(rig, mx + 60, 312, 'N', { fill: '#fff', 'font-size': 22 }); txt(rig, mx + 180, 312, 'S', { fill: '#fff', 'font-size': 22 });
    if (r.dir) { const x1 = r.dir > 0 ? mx + 60 : mx + 180, x2 = r.dir > 0 ? mx + 180 : mx + 60; el('path', { d: `M${x1} 250 H${x2}`, stroke: '#C8372D', 'stroke-width': 5, 'marker-end': 'url(#em-arrow)' }, rig); txt(rig, mx + 120, 238, `${MOTION[s.motion]}（${s.speed === 'fast' ? '快' : '慢'}）`, { 'font-size': 16, fill: '#C8372D' }); }
    else txt(rig, mx + 120, 250, '磁鐵不動', { 'font-size': 16, fill: '#5A6478' });
    const d = el('defs', {}, rig), mk = el('marker', { id: 'em-arrow', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto' }, d);
    el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#C8372D' }, mk);
  }
}

const mag = (sig, label, turns, current, aim) => ({ sig, label, aim, when: s => s.mode === 'magnet' && s.turns === turns && s.current === current,
  title: s => `${s.turns} 匝・${s.current} A`, body: (s, r) => `磁場 ${mt(r.mT)} mT，吸 ${r.clips} 根${r.north ? `，N 極在${r.north === 'right' ? '右' : '左'}` : ''}` });
const ind = (sig, label, motion, speed, aim, turns = 100) => ({ sig, label, aim, when: s => s.mode === 'induce' && s.motion === motion && s.speed === speed && s.turns === turns,
  title: s => `磁鐵${MOTION[s.motion]}${s.motion === 'still' ? '' : s.speed === 'fast' ? '（快）' : '（慢）'}・${s.turns} 匝`, body: (s, r) => r.deflect === 0 ? '指針不動，沒有電流' : `指針偏${r.deflect > 0 ? '右' : '左'} ${Math.abs(r.deflect)} 格` });

runDesk({
  key: 'bhcs.lab.electromagnetism.v1', title: '電磁實驗桌', background: 'bg-electric-bench',
  sceneLabel: '電磁實驗桌：通電線圈吸起迴紋針、指北針看磁極；把磁棒插進或拉出線圈，看檢流計的感應電流',
  initial: { mode: 'magnet', turns: 100, current: 1, motion: 'still', speed: 'slow' },
  model, scene, viewBox: { desk: '80 200 880 380', phone: '90 210 860 360' }, phoneText: 1.6,
  readouts: (s, r) => s.mode === 'magnet'
    ? [['線圈匝數', s.turns, '匝'], ['電流', s.current, 'A', s.current < 0 ? '電池反接' : ''], ['線圈內磁場', mt(r.mT), 'mT', `吸起 ${r.clips} 根迴紋針`]]
    : [['線圈匝數', s.turns, '匝'], ['磁鐵', { still: '不動', in: '插入', out: '拉出' }[s.motion], '', s.motion === 'still' ? '' : s.speed === 'fast' ? '動得快' : '動得慢'], ['檢流計', r.deflect === 0 ? '0' : (r.deflect > 0 ? '右 ' : '左 ') + Math.abs(r.deflect), '格', '指針偏轉表示有感應電流']],
  why: { title: '電流的磁效應與電磁感應', button: '電與磁', html: `
    <p class="fn-tip"><b>電流的磁效應：</b>導線通電會產生磁場。把導線繞成線圈，就是電磁鐵；匝數越多、電流越大，磁場越強。</p>
    <p class="fn-tip"><b>磁極方向：</b>電流方向反過來，N、S 極也跟著對調。可用右手定則判斷：四指順著電流繞線圈，大拇指指的那端是 N 極。</p>
    <p class="fn-tip"><b>電磁感應：</b>磁鐵在線圈中進出，穿過線圈的磁場改變，線圈就產生感應電流。磁鐵不動就沒有電流；動得越快、匝數越多，電流越大；插入和拉出的電流方向相反。發電機就是這個原理。</p>
    <p class="fn-tip">模型說明：線圈磁場用空心長線圈公式（長 20 cm），單位 mT（毫特斯拉）；迴紋針數和檢流計格數是依比例畫出的示意。</p>` },
  steps: [
    { id: 'strength', label: '電磁鐵強弱', title: '電磁鐵：怎樣讓磁力變強？', goal: '比較 100 匝 1 A、200 匝 1 A、100 匝 2 A，看吸起幾根迴紋針，各收一張。',
      intro: '線圈通電就變成電磁鐵。改匝數或電流，看它吸起幾根迴紋針！', enter: { mode: 'magnet', turns: 100, current: 1 },
      controls: [{ key: 'turns', label: '線圈匝數', type: 'seg', options: [[50, '50 匝'], [100, '100 匝'], [200, '200 匝']] }, { key: 'current', label: '電流', type: 'seg', options: [[1, '1 A'], [2, '2 A']] }],
      react: (s, r) => `${s.turns} 匝、${s.current} A：吸起 ${r.clips} 根。`,
      targets: [mag('a', '100 匝・1 A', 100, 1, '先試 100 匝、1 A。'), mag('b', '200 匝・1 A', 200, 1, '只把匝數加倍：200 匝、1 A。'), mag('c', '100 匝・2 A', 100, 2, '換成只把電流加倍：100 匝、2 A。')],
      found: ['匝數加倍或電流加倍，磁場都加倍，吸起的迴紋針也加倍。', '線圈磁場和「匝數 × 電流」成正比'] },
    { id: 'pole', label: '磁極方向', title: '電流反過來，磁極會怎樣？', goal: '把電池正接（＋1 A）和反接（−1 A），看線圈兩端的 N、S 極和指北針，各收一張。',
      intro: '看左邊的指北針。把電池反接，它會轉嗎？', enter: { mode: 'magnet', turns: 100, current: 1 },
      controls: [{ key: 'current', label: '電池接法', type: 'seg', options: [[1, '正接 ＋1 A'], [-1, '反接 −1 A']] }],
      react: (s, r) => `N 極在${r.north === 'right' ? '右' : '左'}端，指北針的 N 指向線圈的 S 極。`,
      targets: [mag('p', '正接 ＋1 A', 100, 1, '先正接。'), mag('n', '反接 −1 A', 100, -1, '把電池反接。')],
      found: ['電流方向反過來，N、S 極對調，指北針也跟著轉向。', '磁場大小不變，方向相反'] },
    { id: 'induce', label: '電磁感應', title: '磁鐵進出線圈，會產生電流嗎？', goal: '線圈接上檢流計（沒有電池）。讓磁鐵不動、慢慢插入、慢慢拉出、快速插入，各收一張。',
      intro: '這次沒有電池！把磁鐵插進線圈，看檢流計。', enter: { mode: 'induce', turns: 100, motion: 'still', speed: 'slow' },
      controls: [{ key: 'motion', label: '磁鐵', type: 'seg', options: [['still', '不動'], ['in', '插入'], ['out', '拉出']] }, { key: 'speed', label: '動的快慢', type: 'seg', options: [['slow', '慢'], ['fast', '快']], cols: 2 }],
      react: (s, r) => r.deflect === 0 ? '磁鐵不動，指針停在 0。' : `指針偏${r.deflect > 0 ? '右' : '左'} ${Math.abs(r.deflect)} 格。`,
      targets: [ind('still', '磁鐵不動', 'still', 'slow', '先讓磁鐵不動。'), ind('in', '慢慢插入', 'in', 'slow', '把磁鐵慢慢插入。'), ind('out', '慢慢拉出', 'out', 'slow', '把磁鐵慢慢拉出。'), ind('fast', '快速插入', 'in', 'fast', '選「插入」再選「快」。')],
      found: ['磁鐵進出線圈才有感應電流；插入、拉出方向相反，動得越快電流越大。', '磁場在線圈裡改變 → 感應電流（發電機原理）'] },
    { id: 'turns', label: '匝數與感應', title: '線圈匝數多，感應電流會變大嗎？', goal: '一樣慢慢插入磁鐵，比較 100 匝和 200 匝的檢流計，各收一張。',
      intro: '換一個 200 匝的線圈，同樣慢慢插入。', enter: { mode: 'induce', turns: 200, motion: 'in', speed: 'slow' },
      controls: [{ key: 'turns', label: '線圈匝數', type: 'seg', options: [[100, '100 匝'], [200, '200 匝']], cols: 2 }],
      react: (s, r) => `${s.turns} 匝：指針偏 ${Math.abs(r.deflect)} 格。`,
      targets: [ind('t100', '100 匝・慢慢插入', 'in', 'slow', '選 100 匝。', 100), ind('t200', '200 匝・慢慢插入', 'in', 'slow', '選 200 匝。', 200)],
      found: ['匝數加倍，感應電流也變大。', '匝數越多、磁鐵動得越快，感應電流越大'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想你收下的證據。',
      found: ['你把電與磁的關係弄懂了！', '電流生磁；磁場改變生電'] }
  ],
  quiz: [
    { q: '想讓電磁鐵吸起更多迴紋針，下面哪個方法沒有用？', options: [
      { text: '增加線圈匝數。', why: '你的證據：100 匝 → 200 匝，迴紋針從 5 根變 10 根，有用。' },
      { text: '把電池反接。', ok: true },
      { text: '加大電流。', why: '你的證據：1 A → 2 A，迴紋針加倍，有用。' }] },
    { q: '磁鐵靜靜地放在線圈裡面不動，檢流計會？', options: [
      { text: '一直偏轉，因為磁鐵在線圈裡。', why: '要磁場「改變」才有感應電流。磁鐵不動，磁場沒變，指針停在 0。' },
      { text: '停在 0。', ok: true },
      { text: '偏轉得比插入時更大。', why: '磁鐵不動，指針停在 0。' }] },
    { q: '發電機是利用哪一個現象？', options: [
      { text: '電流的磁效應（通電產生磁場）。', why: '那是電磁鐵和馬達用的。發電機是讓磁場改變，產生感應電流。' },
      { text: '電磁感應（磁場改變產生電流）。', ok: true },
      { text: '靜電感應。', why: '靜電感應是電荷在導體裡重新分布，不會產生持續的電流。' }] }
  ],
  finish: { title: '你把電與磁的關係弄懂了！', rule: '電流會產生磁場：匝數越多、電流越大，電磁鐵越強，電流反向磁極也反向。磁場改變會產生感應電流：磁鐵動得越快、匝數越多，電流越大。', next: { label: '去靜電感應實驗桌', href: '../electrostatics/' } }
});
