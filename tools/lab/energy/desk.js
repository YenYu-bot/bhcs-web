// 能量轉換實驗桌：推車沿斜坡下滑；數值見 model.mjs。
import { runDesk } from '../shared/desk.mjs';
import { energy } from './model.mjs';
const r1 = x => String(Math.round(x * 10) / 10), r2 = x => String(Math.round(x * 100) / 100);
const POS = { 0: '坡頂', 50: '半途', 100: '坡底' };

function scene({ rig, el, txt, P, s, r, narrow, step, set, drag, hint, kind }) {
  const can = kind === 'observe', n1 = v => (+v).toFixed(1);
  const dd = el('defs', {}, rig), wg = el('linearGradient', { id: 'en-wood', x1: 0, y1: 0, x2: 0, y2: 1 }, dd); for (const [o, c] of [[0, '#E2B57A'], [1, '#B98549']]) el('stop', { offset: o, 'stop-color': c }, wg);
  // 斜坡：桌機坡頂 (220,170)→坡底 (780,470)；手機把能量帳放上面，斜坡往下移
  const A = narrow ? [220, 300] : [220, 170], B = narrow ? [760, 560] : [780, 470], H = B[1] - A[1];
  el('path', { d: `M${A[0] - 60} ${A[1]} H${A[0]} L${B[0]} ${B[1]} H${A[0] - 60} Z`, fill: 'url(#en-wood)', stroke: '#23304A', 'stroke-width': 4, 'stroke-linejoin': 'round' }, rig);
  { const cpid = 'en-cp', cp = el('clipPath', { id: cpid }, dd); el('path', { d: `M${A[0] - 60} ${A[1]} H${A[0]} L${B[0]} ${B[1]} H${A[0] - 60} Z` }, cp); const pl = el('g', { 'clip-path': `url(#${cpid})` }, rig);
    for (let y = A[1] + 30; y < B[1]; y += 34) el('path', { d: `M${A[0] - 60} ${y}H${B[0]}`, stroke: '#9A6B38', 'stroke-width': 1.5, opacity: .45 }, pl);
    for (let i = 0; i < 14; i++) el('ellipse', { cx: n1(A[0] - 40 + ((i * 97) % 520)), cy: n1(A[1] + 60 + ((i * 53) % (B[1] - A[1] - 60))), rx: 9, ry: 3, fill: 'none', stroke: '#9A6B38', 'stroke-width': 1.2, opacity: .4 }, pl); }
  if (s.loss) { const nx = -(B[1] - A[1]), ny = B[0] - A[0], L = Math.hypot(nx, ny), ux = nx / L, uy = ny / L; let d = '';
    el('path', { d: `M${A[0]} ${A[1]}L${B[0]} ${B[1]}L${n1(B[0] - ux * 9)} ${n1(B[1] - uy * 9)}L${n1(A[0] - ux * 9)} ${n1(A[1] - uy * 9)}Z`, fill: '#8C7350', stroke: '#5A4632', 'stroke-width': 1 }, rig);
    for (let i = 0; i < 120; i++) { const t = (i + .5) / 120, o = 2 + (i * 37 % 6); d += `M${n1(A[0] + (B[0] - A[0]) * t - ux * o)} ${n1(A[1] + (B[1] - A[1]) * t - uy * o)}h1.6`; }
    el('path', { d, stroke: '#3E3020', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, rig); }
  else el('line', { x1: A[0], y1: A[1], x2: B[0], y2: B[1], stroke: '#F7E3BE', 'stroke-width': 6, 'stroke-linecap': 'round' }, rig);
  el('line', { x1: 80, y1: B[1], x2: 920, y2: B[1], stroke: '#23304A', 'stroke-width': 4 }, rig);
  const lx = A[0] + (B[0] - A[0]) * .62 - 20, ly = A[1] + (B[1] - A[1]) * .62 + 40, deg = Math.atan2(B[1] - A[1], B[0] - A[0]) * 180 / Math.PI;
  txt(rig, lx, ly, s.loss ? `粗糙坡面（${s.loss}% 變成熱）` : '光滑坡面', { 'font-size': 16, fill: '#5A6478', transform: `rotate(${deg.toFixed(1)} ${lx} ${ly})` });
  // 高度尺
  el('line', { x1: 110, y1: A[1], x2: 110, y2: B[1], stroke: '#23304A', 'stroke-width': 3 }, rig);
  for (const [y, t] of [[A[1], `${s.height} m`], [A[1] + H / 2, `${r1(s.height / 2)} m`], [B[1], '0 m']]) { el('line', { x1: 102, y1: y, x2: 118, y2: y, stroke: '#23304A', 'stroke-width': 3 }, rig); txt(rig, 72, y + 5, t, { 'font-size': 14, fill: '#5A6478' }); }
  // 推車
  const k = s.progress / 100, flat = k === 1, cx = flat ? B[0] + 40 : A[0] + (B[0] - A[0]) * k, cy = flat ? B[1] : A[1] + (B[1] - A[1]) * k, ang = flat ? 0 : Math.atan2(B[1] - A[1], B[0] - A[0]) * 180 / Math.PI, ang0 = Math.atan2(B[1] - A[1], B[0] - A[0]) * 180 / Math.PI;
  const movable = can && (step === 'smooth' || step === 'rough');
  const cg = el('g', { 'data-drag': movable ? 'cart' : null }, rig), g = el('g', { transform: `translate(${n1(cx)} ${n1(cy)}) rotate(${ang.toFixed(1)})` }, cg);
  el('image', { href: P + 'prop-toy-cart.webp', x: -66, y: -43, width: 132, height: 43 }, g);
  if (s.mass === 2) { el('rect', { x: -22, y: -66, width: 44, height: 26, rx: 4, fill: '#8E99A8', stroke: '#23304A', 'stroke-width': 2 }, g); txt(g, 0, -48, '1 kg', { 'font-size': 11, fill: '#fff', 'font-weight': 900 }); }
  el('rect', { x: -26, y: s.mass === 2 ? -94 : -70, width: 52, height: 22, rx: 11, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 2 }, g);
  txt(g, 0, s.mass === 2 ? -78 : -54, `${s.mass} kg`, { 'font-size': 13, 'font-weight': 900 });
  el('rect', { x: -70, y: -70, width: 140, height: 74, fill: 'transparent' }, g);
  if (movable) drag(cg, () => { let k2 = k; return {
    move(p) { const vx = B[0] - A[0], vy = B[1] - A[1]; k2 = Math.max(0, Math.min(1, ((p.x - A[0]) * vx + (p.y - A[1]) * vy) / (vx * vx + vy * vy))); g.setAttribute('transform', `translate(${n1(A[0] + vx * k2)} ${n1(A[1] + vy * k2)}) rotate(${ang0.toFixed(1)})`); },
    end() { const v = [0, 50, 100].reduce((m, x) => Math.abs(x - k2 * 100) < Math.abs(m - k2 * 100) ? x : m); if (v !== s.progress) set({ progress: v }); else g.setAttribute('transform', `translate(${n1(cx)} ${n1(cy)}) rotate(${ang.toFixed(1)})`); },
    cancel() { g.setAttribute('transform', `translate(${n1(cx)} ${n1(cy)}) rotate(${ang.toFixed(1)})`); } }; },
    { label: '讓推車往下滑一段', tap: () => set({ progress: { 0: 50, 50: 100, 100: 0 }[s.progress] }) });
  if (step === 'mass') {
    const wx = s.mass === 2 ? cx : A[0] - 30, wy = s.mass === 2 ? cy - 60 : A[1] - 14;
    if (s.mass === 1) txt(rig, A[0] - 30, A[1] - 34, '砝碼', { 'font-size': 12, fill: '#5A6478' });
    const wg2 = el('g', { 'data-drag': can ? 'weight' : null }, rig), wm = el('g', {}, wg2);
    if (s.mass === 1) { el('rect', { x: wx - 22, y: wy - 12, width: 44, height: 26, rx: 4, fill: '#8E99A8', stroke: '#23304A', 'stroke-width': 2 }, wm); txt(wm, wx, wy + 6, '1 kg', { 'font-size': 11, fill: '#fff', 'font-weight': 900 }); }
    el('rect', { x: wx - 30, y: wy - 22, width: 60, height: 44, fill: 'transparent' }, wm);
    if (can) drag(wg2, p0 => { let q = p0; return { move(p) { q = p; wm.setAttribute('transform', `translate(${n1(p.x - p0.x)} ${n1(p.y - p0.y)})`); },
      end() { const on = Math.hypot(q.x - cx, q.y - (cy - 30)) < 80, v = on ? 2 : 1; if (v !== s.mass) set({ mass: v }); else wm.removeAttribute('transform'); }, cancel() { wm.removeAttribute('transform'); } }; },
      { label: s.mass === 2 ? '把砝碼拿下來' : '把 1 kg 砝碼放上推車', tap: () => set({ mass: s.mass === 2 ? 1 : 2 }) });
  }
  if (r.speed > 0.01) { txt(rig, cx - 40, cy - (s.mass === 2 ? 112 : 90), `${r2(r.speed)} m/s ${flat ? '→' : '↘'}`, { "font-size": 16, fill: "#2F6FB0" }); }
  if (r.thermal > 0.01) for (let i = 0; i < 3; i++) el('path', { d: `M${cx - 60 - i * 14} ${cy - 6 - i * 8} q -6 -10 0 -18 q 6 -8 0 -16`, fill: 'none', stroke: '#E36B3A', 'stroke-width': 3, 'stroke-linecap': 'round' }, rig);
  hint(narrow ? 450 : 330, B[1] + 46, step === 'mass' ? '把砝碼拖到推車上，或拿下來' : '拖著推車沿斜坡往下滑');
  // 能量長條（J）
  const x = narrow ? 130 : 560, y = narrow ? 30 : 60, bw = narrow ? 560 : 300, lw = narrow ? 100 : 64, rh = narrow ? 58 : 40, W = bw / Math.max(r.total, 1);
  el('rect', { x, y, width: lw + bw + 24, height: narrow ? 222 : 176, rx: 16, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 2 }, rig);
  txt(rig, x + 16, y + 28, `能量帳（總能量 ${r1(r.total)} J）`, { 'text-anchor': 'start', 'font-size': 16 });
  const rows = [['位能', r.potential, '#2F6FB0'], ['動能', r.kinetic, '#E0A21B'], ['熱', r.thermal, '#E36B3A']];
  rows.forEach(([n, v, col], i) => {
    const yy = y + (narrow ? 56 : 48) + i * rh;
    txt(rig, x + 16, yy + (narrow ? 28 : 18), n, { 'text-anchor': 'start', 'font-size': 15, fill: '#5A6478' });
    el('rect', { x: x + lw, y: yy, width: bw, height: narrow ? 36 : 24, rx: 6, fill: '#F2EBDD' }, rig);
    el('rect', { x: x + lw, y: yy, width: Math.max(0, v * W), height: narrow ? 36 : 24, rx: 6, fill: col }, rig);
    const inside = v * W > bw - 90;
    txt(rig, x + lw + Math.max(0, v * W) + (inside ? -8 : 8), yy + (narrow ? 28 : 18), `${r1(v)} J`, { 'text-anchor': inside ? 'end' : 'start', 'font-size': 14, 'font-weight': 900, fill: inside ? '#fff' : '#23304A' });
  });
}

const body = (s, r) => `位能 ${r1(r.potential)}＋動能 ${r1(r.kinetic)}${r.thermal ? `＋熱 ${r1(r.thermal)}` : ''} ＝ ${r1(r.total)} J`;
const tgt = (sig, label, want, aim) => ({ sig, label, aim, set: want, title: (s, r) => `${s.mass} kg・${POS[s.progress]}${s.loss ? '・有摩擦' : ''}`, body });

runDesk({
  key: 'bhcs.lab.energy.v1', title: '能量轉換實驗桌', background: 'bg-physics-bench',
  sceneLabel: '能量轉換實驗桌：推車從斜坡頂滑下，右上的能量帳顯示位能、動能與摩擦生熱',
  chip: { main: '1 公斤重 ＝ 10 N', sub: 'g ＝ 10 N/kg' },
  initial: { mass: 1, height: 2, progress: 0, loss: 0 },
  model: energy, scene, viewBox: { desk: '40 40 920 510', phone: '40 20 840 610' }, phoneText: 1.6,
  readouts: (s, r) => [['推車高度', r1(r.h), 'm', `從 ${s.height} m 出發`], ['速率', r2(r.speed), 'm/s', '動能 ＝ ½mv²'], ['總能量', r1(r.total), 'J', `${s.mass} × 10 × ${s.height}`]],
  why: { title: '能量怎麼轉換', button: '能量怎麼算', html: `
    <p class="fn-tip"><b>重力位能 ＝ 重量 × 高度 ＝ mgh。</b>1 kg 的推車重 10 N，在 2 m 高處有 10 × 2 ＝ 20 J。</p>
    <p class="fn-tip"><b>動能 ＝ ½ × 質量 × 速率²。</b>往下滑，位能減少，動能增加。</p>
    <p class="fn-tip"><b>能量守恆：</b>沒有摩擦時，位能＋動能一直等於一開始的位能。有摩擦時，一部分變成熱，位能＋動能＋熱仍然不變，能量沒有消失。</p>
    <p class="fn-tip">模型說明：g ＝ 10 N/kg，推車當成一個點，不計空氣阻力與輪子轉動；「變成熱的比例」是教學設定值。</p>` },
  steps: [
    { id: 'smooth', label: '光滑下坡', title: '光滑斜坡：位能變成動能', goal: '1 kg 推車從 2 m 高的坡頂滑下。在坡頂、半途、坡底各收一張，看能量帳。',
      intro: '推車在坡頂還沒動。按「位置」讓它滑下去，看能量帳怎麼變！', enter: { mass: 1, height: 2, progress: 0, loss: 0 },
      controls: [{ key: 'progress', label: '推車位置', type: 'seg', options: [[0, '坡頂'], [50, '半途'], [100, '坡底']] }],
      react: (s, r) => `${POS[s.progress]}：位能 ${r1(r.potential)} J、動能 ${r1(r.kinetic)} J。`,
      targets: [tgt('top', '坡頂', { mass: 1, progress: 0, loss: 0 }, '先收坡頂。'), tgt('mid', '半途', { mass: 1, progress: 50, loss: 0 }, '讓推車滑到半途。'), tgt('bot', '坡底', { mass: 1, progress: 100, loss: 0 }, '讓推車滑到坡底。')],
      found: ['位能減少多少，動能就增加多少；兩者加起來一直是 20 J。', '坡頂 20＋0 ＝ 半途 10＋10 ＝ 坡底 0＋20 J'] },
    { id: 'rough', label: '有摩擦', title: '粗糙斜坡：能量消失了嗎？', goal: '換成粗糙坡面（下降的位能有 30% 變成熱）。在半途和坡底各收一張。',
      intro: '坡面變粗糙了。到坡底時，動能還會是 20 J 嗎？', enter: { mass: 1, height: 2, progress: 0, loss: 30 },
      controls: [{ key: 'progress', label: '推車位置', type: 'seg', options: [[0, '坡頂'], [50, '半途'], [100, '坡底']] }],
      react: (s, r) => r.thermal ? `熱 ${r1(r.thermal)} J，木箱底和坡面變熱了。` : '還在坡頂，還沒摩擦生熱。',
      targets: [tgt('rmid', '有摩擦・半途', { mass: 1, progress: 50, loss: 30 }, '讓推車滑到半途。'), tgt('rbot', '有摩擦・坡底', { mass: 1, progress: 100, loss: 30 }, '讓推車滑到坡底。')],
      found: ['動能變少了，少掉的 6 J 變成熱；位能＋動能＋熱還是 20 J。', '坡底：0＋14＋6 ＝ 20 J，能量沒有消失'] },
    { id: 'mass', label: '加倍質量', title: '質量加倍，能量和速率會怎樣？', goal: '光滑坡面、同樣 2 m 高。比較 1 kg 和 2 kg 推車到坡底的能量和速率，各收一張。',
      intro: '換一台 2 kg 的推車。它到坡底會比較快嗎？', enter: { mass: 2, height: 2, progress: 100, loss: 0 },
      controls: [{ key: 'mass', label: '推車質量', type: 'seg', options: [[1, '1 kg'], [2, '2 kg']] }],
      react: (s, r) => `${s.mass} kg：總能量 ${r1(r.total)} J，到坡底速率 ${r2(r.speed)} m/s。`,
      targets: [tgt('m1', '1 kg 到坡底', { mass: 1, progress: 100, loss: 0 }, '選 1 kg。'), tgt('m2', '2 kg 到坡底', { mass: 2, progress: 100, loss: 0 }, '選 2 kg。')],
      found: ['質量加倍，能量也加倍；但到坡底的速率一樣。', '1 kg：20 J、2 kg：40 J，速率都是 6.32 m/s'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：能量帳', goal: 'g ＝ 10 N/kg。用 mgh 和能量守恆算算看。', intro: '總能量 ＝ mgh；沒摩擦時坡底的動能 ＝ 總能量。', head: '位能 ＝ m × g × h（g ＝ 10）',
      rows: [
        { id: 'pe', name: '3 kg 推車在 2 m 高的位能', eq: '3 × 10 × 2', answer: 60, unit: 'J', hint: v => v === 58.8 ? '這裡 g 用 10，不是 9.8。' : '' },
        { id: 'ke', name: '光滑坡：3 kg 推車到坡底的動能', eq: '位能全部變成動能', answer: 60, unit: 'J' },
        { id: 'heat', name: '有 25% 變成熱：3 kg 到坡底的動能', eq: '60 − 60 × 25%', answer: 45, unit: 'J', hint: v => v === 15 ? '15 J 是變成熱的部分，動能是剩下的。' : '' }],
      found: ['算對了！', '位能 mgh → 動能＋熱，總和不變'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想你的能量帳。',
      found: ['你把能量守恆弄懂了！', '位能＋動能＋熱 ＝ 總能量，一直不變'] }
  ],
  quiz: [
    { q: '光滑斜坡上，推車滑到半途時，位能和動能的關係是？', options: [
      { text: '位能比動能大，因為還沒到底。', why: '你的證據：半途時位能 10 J、動能 10 J，一樣多（高度剛好一半）。' },
      { text: '兩個加起來等於一開始的位能。', ok: true },
      { text: '兩個都變成 0。', why: '能量不會消失，半途時位能＋動能還是 20 J。' }] },
    { q: '粗糙斜坡上，推車到坡底的動能比光滑時少，少掉的能量去哪了？', options: [
      { text: '消失了。', why: '能量不會消失。克服摩擦做的功變成熱，你的證據：6 J 變成熱。' },
      { text: '變成熱，讓推車和坡面溫度升高一點。', ok: true },
      { text: '變回位能。', why: '推車在坡底高度是 0，位能是 0。' }] },
    { q: '光滑斜坡上，2 kg 推車和 1 kg 推車從同樣高度滑下，到坡底時？', options: [
      { text: '2 kg 的速率比較大。', why: '你的證據：兩台的速率都是 6.32 m/s。能量加倍，質量也加倍，速率一樣。' },
      { text: '2 kg 的動能比較大，速率一樣。', ok: true },
      { text: '兩台的動能一樣。', why: '2 kg 的總能量是 40 J，1 kg 是 20 J。' }] }
  ],
  finish: { title: '你把能量守恆弄懂了！', rule: '位能 ＝ mgh。下滑時位能變成動能；有摩擦時一部分變成熱，但位能＋動能＋熱一直等於總能量。', next: { label: '去摩擦與機械效率實驗桌', href: '../friction-efficiency/' } }
});
