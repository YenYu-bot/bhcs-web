// 波動與聲音實驗桌：數值全部來自 scripts/science/models.mjs 的 calculate('wave-sound')。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const V = 340, f2 = x => String(Math.round(x * 100) / 100);
const model = s => calculate('wave-sound', { mode: s.mode, f: s.f, v: V, length: s.length });
const MODE = { travel: '行進聲波', open: '兩端開口的管', closed: '一端封閉的管' };
const loud = r => r.kind === 'resonant' ? '很大聲' : r.kind === 'off' ? '很小聲' : '—';

function scene({ rig, el, txt, s, r }) {
  const x0 = 200, W = 600, y0 = 320, L = s.mode === 'travel' ? 1 : s.length, scale = W / L;
  // 喇叭
  el('rect', { x: 92, y: y0 - 54, width: 60, height: 108, rx: 12, fill: '#3B4A66', stroke: '#23304A', 'stroke-width': 4 }, rig);
  el('path', { d: `M152 ${y0 - 30} L192 ${y0 - 70} V${y0 + 70} L152 ${y0 + 30} Z`, fill: '#5A6B8A', stroke: '#23304A', 'stroke-width': 4, 'stroke-linejoin': 'round' }, rig);
  el('circle', { cx: 122, cy: y0, r: 18, fill: '#8FA3C4', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, 88, y0 - 86, `喇叭 ${s.f} Hz`, { "font-size": 18, "text-anchor": "start" });
  // 管子或空氣
  if (s.mode !== 'travel') {
    el('rect', { x: x0, y: y0 - 70, width: W, height: 140, rx: 10, fill: 'rgba(214,236,246,.75)', stroke: '#23304A', 'stroke-width': 4 }, rig);
    if (s.mode === 'closed') el('rect', { x: x0 + W - 6, y: y0 - 78, width: 22, height: 156, rx: 6, fill: '#8A6A3C', stroke: '#23304A', 'stroke-width': 4 }, rig);
    txt(rig, x0 + W / 2, y0 - 88, `${MODE[s.mode]}・管長 ${s.length} m`, { 'font-size': 18 });
    txt(rig, x0, y0 + 100, '開口', { 'font-size': 14, fill: '#5A6478' });
    txt(rig, x0 + W, y0 + 100, s.mode === 'closed' ? '封閉' : '開口', { 'font-size': 14, fill: '#5A6478' });
  } else {
    el('rect', { x: x0, y: y0 - 70, width: W, height: 140, rx: 10, fill: 'rgba(255,255,255,.55)', stroke: '#C9BDA8', 'stroke-width': 2, 'stroke-dasharray': '8 6' }, rig);
    txt(rig, x0 + W / 2, y0 - 88, '空氣中的聲波（顯示 1 m）', { 'font-size': 18 });
  }
  // 波形：行進波畫一個瞬間；管內共振畫駐波包絡；沒共振畫很小的波
  const pts = (fn, amp) => Array.from({ length: 241 }, (_, i) => { const x = i / 240 * L; return `${(x0 + x * scale).toFixed(1)},${(y0 - amp * fn(x)).toFixed(1)}`; }).join(' ');
  if (r.kind === 'travel') {
    el('polyline', { points: pts(x => Math.sin(2 * Math.PI * x / r.wavelength), 48), fill: 'none', stroke: '#2F6FB0', 'stroke-width': 5, 'stroke-linecap': 'round' }, rig);
    // 標一個波長
    if (r.wavelength <= L) {
      const a = x0 + 0 * scale, b = x0 + r.wavelength * scale;
      el('path', { d: `M${a} ${y0 + 66}H${b}M${a} ${y0 + 58}v16M${b} ${y0 + 58}v16`, stroke: '#C8372D', 'stroke-width': 3, fill: 'none' }, rig);
      txt(rig, (a + b) / 2, y0 + 92, `一個波長 ${f2(r.wavelength)} m`, { 'font-size': 16, fill: '#C8372D' });
    }
  } else if (r.kind === 'resonant') {
    const k = s.mode === 'open' ? x => Math.cos(r.n * Math.PI * x / L) : x => Math.cos((r.n) * Math.PI * x / (2 * L));
    el('polyline', { points: pts(k, 52), fill: 'none', stroke: '#2F6FB0', 'stroke-width': 5 }, rig);
    el('polyline', { points: pts(x => -k(x), 52), fill: 'none', stroke: '#2F6FB0', 'stroke-width': 5, opacity: .45 }, rig);
    // 波節
    const nodes = [];
    for (let i = 0; i <= 400; i++) { const x = i / 400 * L, a = k(x), b = k((i + 1) / 400 * L); if (i < 400 && a * b <= 0) nodes.push(x); }
    for (const x of nodes) { el('circle', { cx: x0 + x * scale, cy: y0, r: 7, fill: '#C8372D' }, rig); }
    txt(rig, x0 + W / 2, y0 + 126, `共振！● 是波節（空氣不動），共 ${nodes.length} 個`, { 'font-size': 16, fill: '#C8372D' });
  } else {
    el('polyline', { points: pts(x => Math.sin(2 * Math.PI * x / r.wavelength), 10), fill: 'none', stroke: '#8FA3C4', 'stroke-width': 4 }, rig);
    txt(rig, x0 + W / 2, y0 + 126, '沒有共振：管裡的聲音很小', { 'font-size': 16, fill: '#5A6478' });
  }
  // 音量計
  if (s.mode !== 'travel') {
    const h = r.kind === 'resonant' ? 150 : 26;
    el('rect', { x: 850, y: 200, width: 46, height: 180, rx: 10, fill: '#fff', stroke: '#23304A', 'stroke-width': 3 }, rig);
    el('rect', { x: 856, y: 374 - h, width: 34, height: h, rx: 6, fill: r.kind === 'resonant' ? '#C8372D' : '#B8AC98' }, rig);
    txt(rig, 873, 410, '音量', { 'font-size': 15 });
  }
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
  model, scene, viewBox: { desk: '60 150 880 330', phone: '70 190 860 290' },
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
