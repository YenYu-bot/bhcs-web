// 波動與聲音實驗桌：數值全部來自 scripts/science/models.mjs 的 calculate('wave-sound')。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const V = 340, f2 = x => String(Math.round(x * 100) / 100);
const model = s => calculate('wave-sound', { mode: s.mode, f: s.f, v: V, length: s.length });
const MODE = { travel: '行進聲波', open: '兩端開口的管', closed: '一端封閉的管' };
const loud = r => r.kind === 'resonant' ? '很大聲' : r.kind === 'off' ? '很小聲' : '—';

const n1 = v => (+v).toFixed(1);
const FOPT = { travel: [170, 340, 680], open: [170, 250, 340, 510], closed: [85, 170, 255, 340], length: [170, 340, 510] };
function scene({ rig, el, txt, s, r, step, set, drag, hint, kind }) {
  const can = kind === 'observe', x0 = 220, W = 580, y0 = 300, L = s.mode === 'travel' ? 1 : s.length, scale = W / (s.mode === 'travel' ? 1 : 1), tw = L * scale;
  const d = el('defs', {}, rig), g = (id, stops, v = 1) => { const n = el('linearGradient', { id, x1: 0, y1: 0, x2: v ? 0 : 1, y2: v ? 1 : 0 }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('ws-glass', [[0, '#fff', .75], [.18, '#DDEFF8', .35], [.8, '#BFDDEE', .3], [1, '#fff', .6]]); g('ws-cone', [[0, '#9AA8BE'], [1, '#3B4A66']], 0); g('ws-box', [[0, '#4A5670'], [1, '#2C3448']]);
  // 喇叭（側面）
  el('rect', { x: 96, y: y0 - 58, width: 58, height: 116, rx: 10, fill: 'url(#ws-box)', stroke: '#1C2230', 'stroke-width': 3 }, rig);
  el('path', { d: `M154 ${y0 - 26}L204 ${y0 - 66}V${y0 + 66}L154 ${y0 + 26}Z`, fill: 'url(#ws-cone)', stroke: '#1C2230', 'stroke-width': 3, 'stroke-linejoin': 'round' }, rig);
  el('ellipse', { cx: 204, cy: y0, rx: 8, ry: 66, fill: '#2C3448' }, rig);
  for (const k of [1, 2, 3]) el('path', { d: `M${210 + k * 0} ${y0 - 20 - k * 12}q${8 + k * 5} ${20 + k * 12} 0 ${40 + k * 24}`, fill: 'none', stroke: '#8792A6', 'stroke-width': 2, opacity: .7, transform: `translate(${k * 8} 0)` }, rig);
  // 訊號產生器＋頻率旋鈕
  const opts = FOPT[step] || [s.f], gx = 138, gy = 432;
  el('rect', { x: 70, y: 384, width: 136, height: 98, rx: 12, fill: '#E9EDF2', stroke: '#23304A', 'stroke-width': 2.5 }, rig);
  el('rect', { x: 84, y: 394, width: 108, height: 22, rx: 4, fill: '#1E2B22' }, rig);
  txt(rig, gx, 410, `${s.f} Hz`, { 'font-size': 13, fill: '#7CF29A', 'font-family': 'monospace' });
  el('path', { d: `M128 384V${y0 + 58}`, stroke: '#23304A', 'stroke-width': 3 }, rig);
  const span = opts.length > 1 ? 120 : 0, A = i => -span / 2 + (opts.length > 1 ? i * span / (opts.length - 1) : 0), kx = gx, ky = 454;
  opts.forEach((f, i) => { const t = A(i) * Math.PI / 180; el('circle', { cx: n1(kx + 24 * Math.sin(t)), cy: n1(ky - 24 * Math.cos(t)), r: 2.5, fill: f === s.f ? '#C8372D' : '#8792A6' }, rig); });
  const ki = Math.max(0, opts.indexOf(s.f)), kg = el('g', { 'data-drag': can && FOPT[step] ? 'knob' : null }, rig), km = el('g', { transform: `rotate(${A(ki)} ${kx} ${ky})` }, kg);
  el('circle', { cx: kx, cy: ky, r: 26, fill: 'transparent' }, kg); el('circle', { cx: kx, cy: ky, r: 17, fill: '#5A6478', stroke: '#23304A', 'stroke-width': 2 }, km); el('line', { x1: kx, y1: ky - 3, x2: kx, y2: ky - 15, stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round' }, km);
  if (can && FOPT[step]) drag(kg, () => { let a = A(ki); return { move(p) { a = Math.max(-80, Math.min(80, Math.atan2(p.x - kx, ky - p.y) * 180 / Math.PI)); km.setAttribute('transform', `rotate(${n1(a)} ${kx} ${ky})`); },
    end() { let bi = 0; opts.forEach((_, i) => { if (Math.abs(A(i) - a) < Math.abs(A(bi) - a)) bi = i; }); if (opts[bi] !== s.f) set({ f: opts[bi] }); else km.setAttribute('transform', `rotate(${A(ki)} ${kx} ${ky})`); }, cancel() { km.setAttribute('transform', `rotate(${A(ki)} ${kx} ${ky})`); } }; },
    { label: '轉頻率旋鈕', tap: () => set({ f: opts[(ki + 1) % opts.length] }) });
  // 空氣粒子：位移 ξ ＝ a·sin(kx) 讓疏密看得出來
  const dots = (xs, amp, fn, rows, op) => { const q = el('g', { opacity: op }, rig); for (let j = 0; j < rows; j++) { const y = y0 - 56 + j * 112 / (rows - 1); for (let i = 0; i <= xs; i++) { const x = i / xs * L, dx = amp * fn(x); el('circle', { cx: n1(x0 + (x * scale) + dx), cy: n1(y + (j % 2 ? 3 : 0)), r: 2.6, fill: '#5E7FA8' }, q); } } };
  if (s.mode !== 'travel') {
    el('rect', { x: x0, y: y0 - 70, width: tw, height: 140, rx: 10, fill: 'rgba(220,238,248,.55)' }, rig);
    txt(rig, x0 + tw / 2, y0 - 88, `${MODE[s.mode]}・管長 ${s.length} m`, { 'font-size': 17 });
  } else {
    el('rect', { x: x0, y: y0 - 70, width: W, height: 140, rx: 10, fill: 'rgba(255,255,255,.5)', stroke: '#C9BDA8', 'stroke-width': 2, 'stroke-dasharray': '8 6' }, rig);
    txt(rig, x0 + W / 2, y0 - 88, '空氣中的聲波（顯示 1 m）：密部、疏部', { 'font-size': 17 });
  }
  const pts = (fn, amp) => Array.from({ length: 241 }, (_, i) => { const x = i / 240 * L; return `${(x0 + x * scale).toFixed(1)},${(y0 - amp * fn(x)).toFixed(1)}`; }).join(' ');
  if (r.kind === 'travel') {
    dots(Math.round(56), 8, x => Math.sin(2 * Math.PI * x / r.wavelength), 7, .9);
    el('polyline', { points: pts(x => Math.sin(2 * Math.PI * x / r.wavelength), 48), fill: 'none', stroke: '#2F6FB0', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .55 }, rig);
    if (r.wavelength <= L) { const a = x0, b = x0 + r.wavelength * scale;
      el('path', { d: `M${a} ${y0 + 86}H${n1(b)}M${a} ${y0 + 78}v16M${n1(b)} ${y0 + 78}v16`, stroke: '#C8372D', 'stroke-width': 3, fill: 'none' }, rig);
      txt(rig, (a + b) / 2, y0 + 112, `一個波長 ${f2(r.wavelength)} m`, { 'font-size': 15, fill: '#C8372D' }); }
  } else if (r.kind === 'resonant') {
    const k = s.mode === 'open' ? x => Math.cos(r.n * Math.PI * x / L) : x => Math.cos(r.n * Math.PI * x / (2 * L));
    dots(Math.round(56 * L), 7, x => k(x), 7, .55);
    el('polyline', { points: pts(k, 52), fill: 'none', stroke: '#2F6FB0', 'stroke-width': 4.5 }, rig);
    el('polyline', { points: pts(x => -k(x), 52), fill: 'none', stroke: '#2F6FB0', 'stroke-width': 4.5, opacity: .4 }, rig);
    // 位移波節：開口管在 (2j＋1)L／2n；封閉管在 (2j＋1)L／n（含封閉端）
    const nodes = []; if (s.mode === 'open') for (let j = 0; j < r.n; j++) nodes.push((2 * j + 1) * L / (2 * r.n)); else for (let j = 0; (2 * j + 1) * L / r.n <= L + 1e-9; j++) nodes.push((2 * j + 1) * L / r.n);
    for (const x of nodes) el('circle', { cx: n1(x0 + x * scale), cy: y0, r: 7, fill: '#C8372D', stroke: '#fff', 'stroke-width': 1.5 }, rig);
    txt(rig, x0 + tw / 2, y0 + 112, `共振！● 是波節（空氣不動），共 ${nodes.length} 個`, { 'font-size': 15, fill: '#C8372D' });
  } else {
    dots(Math.round(56 * L), 1.5, x => Math.sin(2 * Math.PI * x / r.wavelength), 7, .4);
    el('polyline', { points: pts(x => Math.sin(2 * Math.PI * x / r.wavelength), 10), fill: 'none', stroke: '#8FA3C4', 'stroke-width': 3.5 }, rig);
    txt(rig, x0 + tw / 2, y0 + 112, '沒有共振：管裡的聲音很小', { 'font-size': 15, fill: '#5A6478' });
  }
  if (s.mode !== 'travel') {
    // 玻璃管與（封閉端）塞子
    el('rect', { x: x0, y: y0 - 70, width: tw, height: 140, rx: 10, fill: 'url(#ws-glass)', stroke: '#5E8FA8', 'stroke-width': 3 }, rig);
    el('rect', { x: x0 + 8, y: y0 - 62, width: tw - 16, height: 8, rx: 4, fill: '#fff', opacity: .7 }, rig);
    if (s.mode === 'closed') { el('rect', { x: x0 + tw - 8, y: y0 - 78, width: 24, height: 156, rx: 6, fill: '#8A6A3C', stroke: '#4A3520', 'stroke-width': 2.5 }, rig); txt(rig, x0 + tw + 4, y0 + 100, '封閉', { 'font-size': 13, fill: '#5A6478' }); }
    else txt(rig, x0 + tw, y0 + 100, '開口', { 'font-size': 13, fill: '#5A6478' });
    txt(rig, x0, y0 + 100, '開口', { 'font-size': 13, fill: '#5A6478' });
    // 換管長：拖管子右端
    if (step === 'length') { const tg = el('g', { 'data-drag': can ? 'tube' : null }, rig), tm = el('g', {}, tg), ex = x0 + tw;
      el('rect', { x: ex - 10, y: y0 - 80, width: 20, height: 160, rx: 6, fill: '#F4C04E', stroke: '#8A6A1C', 'stroke-width': 2 }, tm);
      for (const dy of [-8, 0, 8]) el('line', { x1: ex - 5, y1: y0 + dy, x2: ex + 5, y2: y0 + dy, stroke: '#8A6A1C', 'stroke-width': 2 }, tm);
      el('rect', { x: ex - 30, y: y0 - 90, width: 60, height: 180, fill: 'transparent' }, tm);
      el('path', { d: `M${x0 + W / 2} ${y0 - 74}V${y0 + 74}M${x0 + W} ${y0 - 74}V${y0 + 74}`, stroke: '#8792A6', 'stroke-width': 1.5, 'stroke-dasharray': '4 4', 'pointer-events': 'none' }, rig); rig.appendChild(tg);
      txt(rig, x0 + W / 2, y0 + 136, '0.5 m', { 'font-size': 11, fill: '#8792A6' }); txt(rig, x0 + W, y0 + 136, '1 m', { 'font-size': 11, fill: '#8792A6' });
      if (can) drag(tg, p0 => { let x = ex; return { move(p) { x = Math.max(x0 + W / 2, Math.min(x0 + W, ex + p.x - p0.x)); tm.setAttribute('transform', `translate(${n1(x - ex)} 0)`); },
        end() { const v = x < x0 + W * .75 ? 0.5 : 1; if (v !== s.length) set({ length: v }); else tm.removeAttribute('transform'); }, cancel() { tm.removeAttribute('transform'); } }; },
        { label: s.length === 1 ? '把管子縮短成 0.5 m' : '把管子拉長成 1 m', tap: () => set({ length: s.length === 1 ? 0.5 : 1 }) }); }
    // 音量計
    const res = r.kind === 'resonant', mx = 868, my = 300;
    el('rect', { x: mx - 42, y: my - 64, width: 84, height: 110, rx: 12, fill: '#F7F3EA', stroke: '#23304A', 'stroke-width': 2.5 }, rig);
    el('path', { d: `M${mx - 30} ${my + 6}A32 32 0 0 1 ${mx + 30} ${my + 6}`, fill: 'none', stroke: '#B8AC98', 'stroke-width': 6 }, rig);
    el('path', { d: `M${mx + 18} ${my - 20}A32 32 0 0 1 ${mx + 30} ${my + 6}`, fill: 'none', stroke: '#E0675B', 'stroke-width': 6 }, rig);
    const a = (res ? 60 : -55) * Math.PI / 180; el('line', { x1: mx, y1: my + 10, x2: n1(mx + 34 * Math.sin(a)), y2: n1(my + 10 - 34 * Math.cos(a)), stroke: '#C8372D', 'stroke-width': 3, 'stroke-linecap': 'round' }, rig);
    el('circle', { cx: mx, cy: my + 10, r: 4, fill: '#23304A' }, rig);
    txt(rig, mx, my + 36, res ? '很大聲' : '很小聲', { 'font-size': 13, fill: res ? '#C8372D' : '#5A6478' }); txt(rig, mx, my - 46, '音量計', { 'font-size': 12, fill: '#5A6478' });
  }
  hint(520, 500, step === 'length' ? '拖黃色的管口改變管長；轉旋鈕換頻率' : FOPT[step] ? '轉訊號產生器的旋鈕換頻率' : '');
}

const tgt = (sig, label, mode, f, aim, length = 1) => ({
  sig, label, aim, set: { mode, f, length },
  title: s => `${MODE[s.mode]} ${s.f} Hz`,
  body: (s, r) => r.kind === 'travel' ? `波長 ${f2(r.wavelength)} m` : r.kind === 'resonant' ? `共振，第 ${r.n} 個模態` : '沒有共振'
});

runDesk({
  key: 'bhcs.lab.wave-sound.v1', title: '波動與聲音實驗桌', background: 'bg-physics-bench',
  sceneLabel: '波動與聲音實驗桌：喇叭對著空氣或空氣柱發聲，畫面顯示聲波的波長，以及管內是否共振',
  initial: { mode: 'travel', f: 340, length: 1 },
  model, scene, viewBox: { desk: '60 150 870 370', phone: '60 150 870 370' },
  readouts: (s, r) => [['頻率', s.f, 'Hz', '喇叭的振動次數／秒'], ['波長', f2(r.wavelength), 'm', `聲速 ${V} m/s ÷ ${s.f} Hz`], ['管內音量', loud(r), '', s.mode === 'travel' ? '還沒放管子' : `最近的共振 ${f2(r.nearest)} Hz`]],
  why: { title: '聲音、波長與共振', button: '聲音怎麼看', html: `
    <p class="fn-tip"><b>波速 ＝ 頻率 × 波長（v ＝ fλ）。</b>空氣中聲速固定約 340 m/s，頻率越高，波長越短。頻率決定音調，振幅決定音量。</p>
    <p class="fn-tip"><b>兩端開口的管：</b>兩端都是空氣振動最大的地方，共振頻率是基頻 v ÷ 2L 的 1、2、3…倍。</p>
    <p class="fn-tip"><b>一端封閉的管：</b>封閉端空氣不能動（波節），共振頻率是基頻 v ÷ 4L 的 1、3、5…倍，沒有偶數倍。</p>
    <p class="fn-tip">模型說明：理想空氣柱，不計管口修正；與共振頻率相差 3% 以內算「共振」。曲線表示空氣前後振動的大小，空氣其實是沿著管子來回動，不是上下動。本頁不播放聲音。</p>` },
  steps: [
    { id: 'travel', label: '頻率與波長', title: '頻率變了，波長怎麼變？', goal: '在空氣中，把喇叭頻率設成 340 Hz 和 680 Hz，各收一張，比較波長。',
      intro: '聲速固定 340 m/s。頻率加倍，波長會怎樣？', enter: { mode: 'travel', f: 340, length: 1 },
      controls: [{ key: 'f', label: '喇叭頻率（Hz）', type: 'seg', options: [[170, '170'], [340, '340'], [680, '680']] }],
      react: (s, r) => `${s.f} Hz：波長 ${f2(r.wavelength)} m。`,
      targets: [tgt('t340', '340 Hz 的波長', 'travel', 340, '先選 340 Hz。'), tgt('t680', '680 Hz 的波長', 'travel', 680, '再選 680 Hz。')],
      found: ['頻率加倍，波長變成一半；聲速不變。', 'v ＝ fλ：340 ＝ 340 × 1 ＝ 680 × 0.5'] },
    { id: 'open', label: '開口管', title: '兩端開口的管：哪些頻率會共振？', goal: '管長 1 m。試 170、250、340 Hz，看音量計，把共振和沒共振的各收下來。',
      intro: '把喇叭對著兩端開口的管子。換頻率，看音量計！', enter: { mode: 'open', f: 170, length: 1 },
      controls: [{ key: 'f', label: '喇叭頻率（Hz）', type: 'seg', options: [[170, '170'], [250, '250'], [340, '340'], [510, '510']] }],
      react: (s, r) => r.kind === 'resonant' ? `${s.f} Hz 共振了，音量很大！` : `${s.f} Hz 沒有共振，聲音很小。`,
      targets: [tgt('o170', '170 Hz（基頻）', 'open', 170, '試 170 Hz。'), tgt('o250', '250 Hz', 'open', 250, '試 250 Hz。'), tgt('o340', '340 Hz', 'open', 340, '試 340 Hz。')],
      found: ['開口管在基頻 170 Hz 的整數倍共振：170、340、510 Hz…', '基頻 ＝ v ÷ 2L ＝ 340 ÷ 2 ＝ 170 Hz'] },
    { id: 'closed', label: '封閉管', title: '一端封閉的管：偶數倍也會共振嗎？', goal: '把管子右端封起來（管長 1 m）。試 85、170、255 Hz，各收一張。',
      intro: '右端封起來了，那裡空氣不能動。共振頻率會變嗎？', enter: { mode: 'closed', f: 85, length: 1 },
      controls: [{ key: 'f', label: '喇叭頻率（Hz）', type: 'seg', options: [[85, '85'], [170, '170'], [255, '255'], [340, '340']] }],
      react: (s, r) => r.kind === 'resonant' ? `${s.f} Hz 共振！` : `${s.f} Hz 不共振。`,
      targets: [tgt('c85', '85 Hz（基頻）', 'closed', 85, '試 85 Hz。'), tgt('c170', '170 Hz（2 倍）', 'closed', 170, '試 170 Hz，是基頻的 2 倍。'), tgt('c255', '255 Hz（3 倍）', 'closed', 255, '試 255 Hz，是基頻的 3 倍。')],
      found: ['封閉管只在基頻的奇數倍共振：85、255 Hz…，170 Hz 不會。', '基頻 ＝ v ÷ 4L ＝ 340 ÷ 4 ＝ 85 Hz，只有 1、3、5 倍'] },
    { id: 'length', label: '換管長', title: '管子變短，基頻怎麼變？', goal: '用兩端開口的管。把管長改成 0.5 m，找出新的基頻並收下。',
      intro: '管子變短了。猜猜看，基頻變高還是變低？', enter: { mode: 'open', f: 170, length: 0.5 },
      controls: [{ key: 'length', label: '管長（m）', type: 'seg', options: [[0.5, '0.5 m'], [1, '1 m']] }, { key: 'f', label: '喇叭頻率（Hz）', type: 'seg', options: [[170, '170'], [340, '340'], [510, '510']] }],
      react: (s, r) => `管長 ${s.length} m、${s.f} Hz：${r.kind === 'resonant' ? '共振' : '不共振'}。`,
      targets: [tgt('s170', '0.5 m 管 170 Hz', 'open', 170, '先試 170 Hz。', 0.5), tgt('s340', '0.5 m 管 340 Hz', 'open', 340, '再試 340 Hz。', 0.5)],
      found: ['管長減半，基頻變成兩倍：0.5 m 的開口管基頻是 340 Hz。', '基頻 ＝ 340 ÷ (2 × 0.5) ＝ 340 Hz；管越短，音越高'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：用 v ＝ fλ', goal: '聲速 340 m/s。用你收的證據算算看。', intro: '波長 ＝ 聲速 ÷ 頻率。', head: '聲速 v ＝ 340 m/s',
      rows: [
        { id: 'lam', name: '850 Hz 的波長', eq: '340 ÷ 850', answer: 0.4, unit: 'm', tol: 0.001, hint: v => v === 2.5 ? '分子分母放反了：波長 ＝ 聲速 ÷ 頻率。' : '' },
        { id: 'open2', name: '2 m 開口管的基頻', eq: '340 ÷ (2 × 2)', answer: 85, unit: 'Hz', hint: v => v === 170 ? '管長是 2 m，要除以 2 × 2 ＝ 4。' : '' },
        { id: 'closed2', name: '1 m 封閉管的第 2 個共振頻率', eq: '85 × 3', answer: 255, unit: 'Hz', hint: v => v === 170 ? '封閉管沒有 2 倍，下一個是 3 倍。' : '' }],
      found: ['算對了！', '波長 ＝ v ÷ f；開口管 v ÷ 2L，封閉管 v ÷ 4L'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想你收下的證據。',
      found: ['你弄懂聲音的波長和共振了！', '頻率高 → 波長短；封閉管只有奇數倍共振'] }
  ],
  quiz: [
    { q: '同樣在空氣中，喇叭頻率從 340 Hz 變成 680 Hz，聲波的波長會？', options: [
      { text: '變成兩倍，因為振動得更快。', why: '聲速不變，v ＝ fλ：頻率加倍，波長要減半。你的證據：1 m → 0.5 m。' },
      { text: '變成一半。', ok: true },
      { text: '不變，因為聲速不變。', why: '聲速不變，所以頻率變大時波長要變小，兩者相乘才會一樣。' }] },
    { q: '長 1 m、一端封閉的管子，基頻是 85 Hz。下面哪個頻率「不會」共振？', options: [
      { text: '255 Hz', why: '255 是 85 的 3 倍，奇數倍會共振。' },
      { text: '170 Hz', ok: true },
      { text: '425 Hz', why: '425 是 85 的 5 倍，奇數倍會共振。' }] },
    { q: '共振時聲音變大，是因為什麼？', options: [
      { text: '聲速突然變快了。', why: '聲速一直是 340 m/s。共振是管內空氣剛好配合這個頻率一起大幅振動。' },
      { text: '頻率剛好符合管子的條件，管內空氣跟著大幅振動。', ok: true },
      { text: '喇叭的頻率自己變高了。', why: '頻率是你設定的，沒有變。變的是管內空氣振動的大小。' }] }
  ],
  finish: { title: '你弄懂聲音的波長和共振了！', rule: 'v ＝ fλ：聲速固定時，頻率越高波長越短。開口管在基頻的 1、2、3 倍共振；封閉管只在 1、3、5 倍共振。', next: { label: '去電磁實驗桌', href: '../electromagnetism/' } }
});
