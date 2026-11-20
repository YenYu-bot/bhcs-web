// 體內恆定實驗桌：體溫調節與血糖的峰值、低點、回穩時間、激素全部來自 scripts/science/models.mjs 的 calculate('homeostasis')。
// 血糖曲線依這些數值畫出（示意）；數值是虛構的教學模型，不能用於健康判斷。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('homeostasis', { mode: s.mode, carb: s.carb, exercise: s.exercise, insulin: s.insulin, env: s.env });
const KIND = { cold: '偏冷', neutral: '適中', hot: '偏熱' };

function scene({ rig, el, txt, s, r }) {
  if (s.mode === 'temp') {
    // 皮膚切面：血管粗細、汗珠、顫抖
    const w = { cold: 6, neutral: 12, hot: 22 }[r.kind];
    el('rect', { x: 140, y: 200, width: 520, height: 70, fill: '#F2C6A8', stroke: '#23304A', 'stroke-width': 3 }, rig);
    el('rect', { x: 140, y: 270, width: 520, height: 120, fill: '#F7DCCB', stroke: '#23304A', 'stroke-width': 3 }, rig);
    el('rect', { x: 140, y: 390, width: 520, height: 80, fill: '#E9A99A', stroke: '#23304A', 'stroke-width': 3 }, rig);
    txt(rig, 400, 190, `環境 ${s.env} °C（${KIND[r.kind]}）`, { 'font-size': 20 });
    txt(rig, 600, 240, '表皮', { 'font-size': 14, fill: '#5A6478' }); txt(rig, 600, 300, '真皮', { 'font-size': 14, fill: '#5A6478' }); txt(rig, 600, 440, '肌肉', { 'font-size': 14, fill: '#5A6478' });
    el('path', { d: 'M150 330 C260 300 360 360 460 330 S620 310 650 330', fill: 'none', stroke: '#C8372D', 'stroke-width': w, 'stroke-linecap': 'round' }, rig);
    txt(rig, 300, 372, `皮膚血管${r.vessel}`, { 'font-size': 16, fill: '#C8372D' });
    if (r.kind === 'hot') for (let i = 0; i < 5; i++) el('path', { d: `M${190 + i * 100} 196 q-10 -18 0 -30 q10 12 0 30 z`, fill: '#7FB2E5', stroke: '#2F6FB0', 'stroke-width': 2 }, rig);
    if (r.kind === 'cold') for (let i = 0; i < 6; i++) el('path', { d: `M${170 + i * 80} 430 l10 -10 l10 10 l10 -10 l10 10`, fill: 'none', stroke: '#23304A', 'stroke-width': 3 }, rig);
    // 核心體溫
    el('rect', { x: 720, y: 220, width: 200, height: 220, rx: 18, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 3 }, rig);
    txt(rig, 820, 262, '核心體溫', { 'font-size': 16, fill: '#5A6478' });
    txt(rig, 820, 320, '37 °C', { 'font-size': 40, fill: '#2E8B66' });
    txt(rig, 820, 362, '維持恆定', { 'font-size': 16, fill: '#2E8B66' });
    txt(rig, 820, 410, r.method, { 'font-size': 14 });
    return;
  }
  // 血糖曲線（0～6 小時）
  const gx = 160, gy = 470, W = 600, H = 300, t2x = t => gx + t / 6 * W, v2y = v => gy - (v - 40) / 160 * H;
  el('rect', { x: gx - 70, y: gy - H - 76, width: W + 110, height: H + 156, rx: 18, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: gx, y: v2y(110), width: W, height: v2y(80) - v2y(110), fill: '#E3F3EC' }, rig);
  txt(rig, gx + W - 6, v2y(110) - 6, '正常範圍 80～110', { 'text-anchor': 'end', 'font-size': 13, fill: '#2E8B66' });
  for (const v of [40, 80, 120, 160, 200]) { el('line', { x1: gx, y1: v2y(v), x2: gx + W, y2: v2y(v), stroke: '#ECE2D2' }, rig); txt(rig, gx - 12, v2y(v) + 5, String(v), { 'text-anchor': 'end', 'font-size': 13, fill: '#5A6478' }); }
  for (let t = 0; t <= 6; t++) txt(rig, t2x(t), gy + 22, `${t} h`, { 'font-size': 13, fill: '#5A6478' });
  txt(rig, gx - 50, gy - H - 14, '血糖（mg/dL）', { 'text-anchor': 'start', 'font-size': 14, fill: '#5A6478' });
  const pts = [[0, 90]];
  if (s.carb) pts.push([.5, r.peak], [r.recovery, 90]);
  if (r.min < 90) pts.push([Math.max(1, r.recovery) + .5, r.min], [Math.max(1, r.recovery) + 1.5, 90]);
  pts.push([6, 90]);
  el('polyline', { points: pts.map(([t, v]) => `${t2x(t)},${v2y(v)}`).join(' '), fill: 'none', stroke: '#C8372D', 'stroke-width': 4, 'stroke-linejoin': 'round' }, rig);
  if (s.carb) { const [x, y] = [t2x(.5), v2y(r.peak)]; el('circle', { cx: x, cy: y, r: 6, fill: '#C8372D' }, rig); txt(rig, x + 10, y - 10, `峰值 ${Math.round(r.peak)}`, { 'text-anchor': 'start', 'font-size': 15, fill: '#C8372D' }); }
  if (r.min < 80) { const t = Math.max(1, r.recovery) + .5; txt(rig, t2x(t), v2y(r.min) + 26, `最低 ${Math.round(r.min)}`, { 'font-size': 15, fill: '#2F6FB0' }); }
  txt(rig, 470, gy - H - 46, `${s.carb ? `吃了 ${s.carb} g 醣類` : '沒有進食'}・運動 ${s.exercise} 分・胰島素${s.insulin === 'low' ? '不足' : '正常'}`, { 'font-size': 16 });
  txt(rig, 470, gy + 58, r.hormones.length ? `${r.hormones.join('、')}分泌增加` : '沒有明顯的激素調節', { 'font-size': 17, fill: '#2F6FB0' });
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: s => s.mode === 'temp' ? `環境 ${s.env} °C` : `${s.carb ? `醣類 ${s.carb} g` : '不進食'}${s.exercise ? `・運動 ${s.exercise} 分` : ''}・胰島素${s.insulin === 'low' ? '不足' : '正常'}`,
  body: (s, r) => s.mode === 'temp' ? `血管${r.vessel}，${r.method}` : `峰值 ${Math.round(r.peak)}、最低 ${Math.round(r.min)}${r.recovery ? `，${r.recovery} 小時回穩` : ''}${r.hormones.length ? `；${r.hormones.join('、')}增加` : ''}` });
const G = { mode: 'glucose', carb: 0, exercise: 0, insulin: 'normal', env: 25 };

runDesk({
  key: 'bhcs.lab.homeostasis.v1', title: '體內恆定實驗桌', background: 'bg-chem-bench',
  sceneLabel: '體內恆定實驗桌：體溫部分顯示皮膚血管粗細、流汗與顫抖，核心體溫維持 37 度；血糖部分畫出 6 小時內的血糖曲線與正常範圍',
  initial: { mode: 'temp', carb: 0, exercise: 0, insulin: 'normal', env: 25 },
  model, scene, viewBox: { desk: '80 80 860 500', phone: '80 80 860 500' }, phoneText: 1.4,
  readouts: (s, r) => s.mode === 'temp'
    ? [['環境溫度', s.env, '°C', KIND[r.kind]], ['皮膚血管', r.vessel === '無明顯變化' ? '不變' : r.vessel, '', r.kind === 'neutral' ? '無明顯變化' : ''], ['核心體溫', 37, '°C', '維持恆定']]
    : [['血糖峰值', Math.round(r.peak), 'mg/dL', s.carb ? `吃 ${s.carb} g 醣類` : '沒有進食'], ['血糖最低', Math.round(r.min), 'mg/dL', s.exercise ? `運動 ${s.exercise} 分` : ''], ['回穩時間', r.recovery || '—', r.recovery ? '小時' : '', r.hormones.join('、') || '不需調節']],
  why: { title: '體溫與血糖的恆定', button: '恆定怎麼做', html: `
    <p class="fn-tip"><b>恆定性：</b>外界改變時，身體會自動調節，讓體溫、血糖等維持在穩定範圍。</p>
    <p class="fn-tip"><b>體溫：</b>冷的時候皮膚血管收縮、肌肉顫抖產熱；熱的時候皮膚血管舒張、流汗散熱。核心體溫維持約 37 °C。</p>
    <p class="fn-tip"><b>血糖：</b>吃飯後血糖升高，胰臟分泌胰島素，讓血糖降回來；運動或空腹使血糖降低，胰臟分泌升糖素，讓血糖升回來。胰島素不足時，血糖降不下來（糖尿病的原因之一）。</p>
    <p class="fn-tip">模型說明：數值是虛構的教學模型，曲線只是示意，不能用來判斷健康。</p>` },
  steps: [
    { id: 'temp', label: '體溫調節', title: '天氣冷熱，身體怎麼保持 37 °C？', goal: '把環境溫度調成 10 °C、25 °C、35 °C，看皮膚血管和調節方式，各收一張。',
      intro: '換換看環境溫度，注意皮膚裡的血管和汗珠！', enter: { mode: 'temp', env: 25 },
      controls: [{ key: 'env', label: '環境溫度', type: 'seg', options: [[10, '10 °C'], [25, '25 °C'], [35, '35 °C']] }],
      react: (s, r) => `${s.env} °C：血管${r.vessel}，${r.method}。`,
      targets: [tgt('cold', '10 °C', { mode: 'temp', env: 10 }, '選 10 °C。'), tgt('mid', '25 °C', { mode: 'temp', env: 25 }, '選 25 °C。'), tgt('hot', '35 °C', { mode: 'temp', env: 35 }, '選 35 °C。')],
      found: ['冷時血管收縮、顫抖產熱；熱時血管舒張、流汗散熱；核心體溫都是 37 °C。', '減少或增加散熱，讓體溫維持恆定'] },
    { id: 'meal', label: '飯後血糖', title: '吃飯後，血糖怎麼變？', goal: '比較「不進食」和「吃 60 g 醣類」的血糖曲線，各收一張。',
      intro: '吃一碗飯後，血糖會一直升高嗎？', enter: { ...G },
      controls: [{ key: 'carb', label: '進食的醣類', type: 'seg', options: [[0, '不進食'], [60, '60 g']], cols: 2 }],
      react: (s, r) => s.carb ? `血糖升到 ${Math.round(r.peak)}，胰島素讓它 ${r.recovery} 小時回到 90。` : '血糖維持在 90。',
      targets: [tgt('m0', '不進食', { ...G }, '選「不進食」。'), tgt('m60', '吃 60 g 醣類', { ...G, carb: 60 }, '選「60 g」。')],
      found: ['飯後血糖升高，胰島素分泌增加，約 2 小時回到正常。', '血糖高 → 胰島素 → 血糖降回來'] },
    { id: 'insulin', label: '胰島素不足', title: '胰島素不足時，會怎樣？', goal: '同樣吃 60 g 醣類，比較胰島素正常和不足的曲線，各收一張。',
      intro: '如果胰島素分泌不足，血糖降得回來嗎？', enter: { ...G, carb: 60, insulin: 'low' },
      controls: [{ key: 'insulin', label: '胰島素分泌', type: 'seg', options: [['normal', '正常'], ['low', '不足']], cols: 2 }],
      react: (s, r) => `峰值 ${Math.round(r.peak)}，${r.recovery} 小時才回穩。`,
      targets: [tgt('in', '胰島素正常', { ...G, carb: 60, insulin: 'normal' }, '選「正常」。'), tgt('il', '胰島素不足', { ...G, carb: 60, insulin: 'low' }, '選「不足」。')],
      found: ['胰島素不足時，血糖升得更高（186），要 5 小時才回穩。', '胰島素是唯一能讓血糖降低的激素'] },
    { id: 'exercise', label: '運動時', title: '運動很久，血糖太低怎麼辦？', goal: '不進食的情況下，比較運動 0 分和 30 分的血糖，各收一張。',
      intro: '空腹去跑步 30 分鐘，血糖會怎樣？', enter: { ...G, exercise: 30 },
      controls: [{ key: 'exercise', label: '運動時間', type: 'seg', options: [[0, '0 分'], [30, '30 分']], cols: 2 }],
      react: (s, r) => r.min < 80 ? `血糖降到 ${Math.round(r.min)}，升糖素把它拉回來。` : '血糖維持在 90。',
      targets: [tgt('e0', '運動 0 分', { ...G }, '選「0 分」。'), tgt('e30', '運動 30 分', { ...G, exercise: 30 }, '選「30 分」。')],
      found: ['血糖低於 80 時，升糖素分泌增加，讓血糖回升。', '胰島素降血糖、升糖素升血糖，一起維持恆定'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想身體怎麼調節。',
      found: ['你把體內恆定弄懂了！', '身體用回饋調節，把體溫和血糖拉回正常'] }
  ],
  quiz: [
    { q: '天氣很熱時，皮膚的血管會？', options: [
      { text: '收縮，減少散熱。', why: '那是冷的時候。你的證據：35 °C 時血管舒張，讓更多熱從皮膚散掉。' },
      { text: '舒張，增加散熱。', ok: true },
      { text: '沒有變化。', why: '熱的時候血管舒張、還會流汗散熱。' }] },
    { q: '吃完飯後，讓血糖降回正常的激素是？', options: [
      { text: '升糖素。', why: '升糖素是讓血糖「升高」的。你的證據：飯後是胰島素增加。' },
      { text: '胰島素。', ok: true },
      { text: '腎上腺素。', why: '本實驗中，飯後讓血糖降回來的是胰臟分泌的胰島素。' }] },
    { q: '胰島素分泌不足的人，飯後血糖會？', options: [
      { text: '升得比較低。', why: '你的證據：胰島素不足時峰值 186，比正常的 138 高。' },
      { text: '升得比較高，而且很久才降回來。', ok: true },
      { text: '完全不會升高。', why: '吃了醣類血糖一定會升高，問題是降不下來。' }] }
  ],
  finish: { title: '你把體內恆定弄懂了！', rule: '冷時血管收縮、顫抖；熱時血管舒張、流汗，核心體溫維持 37 °C。血糖高時胰島素讓它下降，血糖低時升糖素讓它上升。', next: { label: '去酵素實驗桌', href: '../enzyme/' } }
});
