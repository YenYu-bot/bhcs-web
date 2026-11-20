// 神經反射實驗桌：神經路徑、中樞與是否經過大腦來自 scripts/science/models.mjs 的 calculate('nerve-reflex')。
// 接尺反應時間改用 g ＝ 10（與其他實驗桌一致）：t ＝ √(2d ÷ 10)。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => { const r = calculate('nerve-reflex', { action: s.action, drop: s.drop }); return { ...r, time: Math.sqrt(2 * (s.drop / 100) / 10) }; };
const ACT = { knee: '膝跳反射', withdraw: '碰到燙的東西縮手', catch: '看到球後接住' };
const f2 = x => String(Math.round(x * 100) / 100);

function scene({ rig, el, txt, P, s, r, step }) {
  if (step === 'ruler' || step === 'calc') {
    // 接尺實驗：尺的 0 刻度原本在手指間（F），落下 d cm 後被抓住，手指正好在 d 的刻度
    const F = 200, sc = 6, zero = F + s.drop * sc;
    el('rect', { x: 470, y: zero - 50 * sc - 8, width: 60, height: 50 * sc + 16, rx: 6, fill: '#F4D58A', stroke: '#23304A', 'stroke-width': 3 }, rig);
    for (let c = 0; c <= 50; c += 5) { const yy = zero - c * sc; el('line', { x1: 470, y1: yy, x2: c % 10 ? 484 : 494, y2: yy, stroke: '#23304A', 'stroke-width': 2 }, rig); if (c % 10 === 0) txt(rig, 510, yy + 5, String(c), { 'font-size': 13 }); }
    el('path', { d: `M410 ${F} q44 -8 58 0`, stroke: '#E8B48C', 'stroke-width': 18, 'stroke-linecap': 'round', fill: 'none' }, rig);
    el('path', { d: `M590 ${F} q-44 -8 -58 0`, stroke: '#E8B48C', 'stroke-width': 18, 'stroke-linecap': 'round', fill: 'none' }, rig);
    el('line', { x1: 560, y1: F, x2: 660, y2: F, stroke: '#5A6478', 'stroke-width': 2, 'stroke-dasharray': '6 5' }, rig);
    txt(rig, 720, F + 5, '原本 0 刻度在這裡', { 'font-size': 14, fill: '#5A6478' });
    el('path', { d: `M640 ${F + 4} V${zero - 4}`, stroke: '#C8372D', 'stroke-width': 4, 'marker-end': 'url(#nr-a)' }, rig);
    const d = el('defs', {}, rig), mk = el('marker', { id: 'nr-a', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#C8372D' }, mk);
    txt(rig, 720, (F + zero) / 2 + 5, `落下 ${s.drop} cm`, { 'font-size': 18, fill: '#C8372D' });
    txt(rig, 270, 300, `反應時間 ${f2(r.time)} 秒`, { 'font-size': 26, fill: '#2F6FB0' });
    txt(rig, 270, 340, `t ＝ √(2 × ${f2(s.drop / 100)} ÷ 10)`, { 'font-size': 16, fill: '#5A6478' });
    return;
  }
  // 神經路徑：一格一格往右傳
  const n = r.path.length, w = 116, gap = 18, x0 = 500 - (n * w + (n - 1) * gap) / 2, y = 380;
  r.path.forEach(([name, note], i) => {
    const x = x0 + i * (w + gap), center = name === '脊髓' || name === '大腦';
    el('rect', { x, y, width: w, height: 84, rx: 16, fill: center ? '#2F6FB0' : '#fff', stroke: '#23304A', 'stroke-width': 3 }, rig);
    txt(rig, x + w / 2, y + 36, name, { 'font-size': 18, fill: center ? '#fff' : '#23304A' });
    if (note) txt(rig, x + w / 2, y + 62, note, { 'font-size': 12, fill: center ? '#DCE8F5' : '#5A6478' });
    if (i < n - 1) el('path', { d: `M${x + w + 2} ${y + 42} h${gap - 4}`, stroke: '#C8372D', 'stroke-width': 4, 'marker-end': 'url(#nr-b)' }, rig);
  });
  const d = el('defs', {}, rig), mk = el('marker', { id: 'nr-b', viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#C8372D' }, mk);
  // 腦與脊髓：中樞亮起
  el('image', { href: P + 'prop-brain.webp', x: 420, y: 100, width: 160, height: 105, opacity: r.viaBrain ? 1 : .4 }, rig);
  el('rect', { x: 488, y: 200, width: 24, height: 140, rx: 12, fill: r.viaBrain ? '#C9BDA8' : '#2F6FB0', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, 620, 160, r.viaBrain ? '大腦判斷 ✓' : '不經大腦', { 'font-size': 18, fill: r.viaBrain ? '#2F6FB0' : '#5A6478' });
  txt(rig, 600, 280, r.viaBrain ? '脊髓只負責傳遞' : '脊髓是反射中樞', { 'font-size': 16, fill: '#2F6FB0' });
  txt(rig, 500, 520, `${ACT[s.action]}：共 ${r.steps} 步${r.painLater ? '（縮手後才傳到大腦感覺痛）' : ''}`, { 'font-size': 17 });
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: s => sig.startsWith('d') ? `尺落下 ${s.drop} cm` : ACT[s.action],
  body: (s, r) => sig.startsWith('d') ? `反應時間 ${f2(r.time)} 秒` : `中樞在${r.center}，${r.steps} 步${r.viaBrain ? '，經大腦判斷' : '，不經大腦'}` });

runDesk({
  key: 'bhcs.lab.nerve-reflex.v1', title: '神經反射實驗桌', background: 'bg-chem-bench',
  sceneLabel: '神經反射實驗桌：畫面一格一格顯示訊息從受器、感覺神經、中樞、運動神經到動器的路線，中樞是脊髓或大腦；接尺實驗顯示尺落下的距離與反應時間',
  initial: { action: 'knee', drop: 20 },
  model, scene, viewBox: step => step === 'ruler' || step === 'calc' ? { desk: '60 0 880 560', phone: '100 0 800 560' } : { desk: '60 70 880 480', phone: '60 70 880 480' }, phoneText: 1.4,
  readouts: (s, r) => [['動作', s.action === 'catch' ? '接球' : s.action === 'knee' ? '膝跳' : '縮手', '', r.kind === 'reflex' ? '反射' : '意識動作'], ['中樞', r.center, '', r.viaBrain ? '經大腦判斷' : '不經大腦'], ['接尺反應時間', f2(r.time), '秒', `尺落下 ${s.drop} cm`]],
  why: { title: '神經系統與反射', button: '訊息怎麼傳', html: `
    <p class="fn-tip"><b>反應的路線：</b>受器 → 感覺神經 → 中樞 → 運動神經 → 動器。</p>
    <p class="fn-tip"><b>反射：</b>中樞在脊髓（或腦幹），不必等大腦判斷，所以很快，例如膝跳反射、碰到燙的東西縮手。縮手之後，訊息才傳到大腦產生痛覺。</p>
    <p class="fn-tip"><b>意識動作：</b>要先由大腦判斷，再下指令，例如看到球後接住，比反射慢。</p>
    <p class="fn-tip"><b>接尺實驗：</b>尺落下的距離越長，反應時間越長。t ＝ √(2d ÷ g)，這裡 g 取 10。</p>` },
  steps: [
    { id: 'reflex', label: '反射', title: '反射：訊息走哪一條路？', goal: '看膝跳反射和縮手反射的路線，中樞在哪裡、有沒有經過大腦，各收一張。',
      intro: '輕敲膝蓋下方，小腿會自己踢起來。訊息有經過大腦嗎？', enter: { action: 'knee', drop: 20 },
      controls: [{ key: 'action', label: '動作', type: 'seg', options: [['knee', '膝跳反射'], ['withdraw', '碰燙縮手']], cols: 2 }],
      react: (s, r) => `${ACT[s.action]}：中樞在${r.center}。`,
      targets: [tgt('knee', '膝跳反射', { action: 'knee' }, '選膝跳反射。'), tgt('hot', '碰燙縮手', { action: 'withdraw' }, '選碰燙縮手。')],
      found: ['反射的中樞在脊髓，不經大腦判斷，所以很快。', '受器 → 感覺神經 → 脊髓 → 運動神經 → 動器'] },
    { id: 'voluntary', label: '意識動作', title: '接球：和反射有什麼不同？', goal: '看「看到球後接住」的路線，和縮手反射比一比，各收一張。',
      intro: '看到球飛來再伸手接，這次訊息要經過哪裡？', enter: { action: 'catch', drop: 20 },
      controls: [{ key: 'action', label: '動作', type: 'seg', options: [['withdraw', '碰燙縮手'], ['catch', '看到球後接住']], cols: 2 }],
      react: (s, r) => `${ACT[s.action]}：${r.steps} 步，中樞在${r.center}。`,
      targets: [tgt('catch', '看到球後接住', { action: 'catch' }, '選「看到球後接住」。'), tgt('cmp', '碰燙縮手（比較）', { action: 'withdraw' }, '選「碰燙縮手」比一比。')],
      found: ['接球要經大腦判斷，路線比反射長，所以比較慢。', '意識動作：中樞在大腦；反射：中樞在脊髓'] },
    { id: 'ruler', label: '接尺實驗', title: '接尺實驗：量自己的反應時間', goal: '同學放開尺，你看到就抓。比較尺落下 5 cm 和 20 cm 時的反應時間，各收一張。',
      intro: '尺落下越多，代表反應越慢。看看 20 cm 是幾秒？', enter: { action: 'catch', drop: 20 },
      controls: [{ key: 'drop', label: '抓到時尺落下的距離', type: 'seg', options: [[5, '5 cm'], [20, '20 cm'], [45, '45 cm']] }],
      react: (s, r) => `落下 ${s.drop} cm：反應時間 ${f2(r.time)} 秒。`,
      targets: [tgt('d5', '落下 5 cm', { drop: 5 }, '選 5 cm。'), tgt('d20', '落下 20 cm', { drop: 20 }, '選 20 cm。')],
      found: ['尺落下越多，反應時間越長：5 cm 是 0.1 秒，20 cm 是 0.2 秒。', 't ＝ √(2d ÷ 10)：距離變 4 倍，時間變 2 倍'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：反應時間', goal: 't ＝ √(2d ÷ 10)，d 用公尺。', intro: '把 cm 換成 m 再代入。', head: 't ＝ √(2 × d ÷ 10)',
      rows: [
        { id: 't45', name: '尺落下 45 cm 的反應時間', eq: '√(2 × 0.45 ÷ 10)', answer: 0.3, unit: '秒', tol: .005 },
        { id: 'd02', name: '反應時間 0.2 秒，尺落下幾 cm', eq: '10 × 0.2² ÷ 2 × 100', answer: 20, unit: 'cm', tol: .01, hint: v => v === 0.2 ? '0.2 是公尺，換成 cm 要 × 100。' : '' }],
      found: ['算對了！', '落下距離 ＝ ½ × 10 × 時間²'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想訊息走的路。',
      found: ['你把神經反射弄懂了！', '反射快：中樞在脊髓；意識動作慢：要經大腦'] }
  ],
  quiz: [
    { q: '手碰到很燙的鍋子會立刻縮回，這個反應的中樞在？', options: [
      { text: '大腦，因為會覺得痛。', why: '縮手是反射，中樞在脊髓。你的證據：痛覺是縮手之後才傳到大腦。' },
      { text: '脊髓。', ok: true },
      { text: '手指的皮膚。', why: '皮膚是受器，負責接收刺激，不是中樞。' }] },
    { q: '為什麼接球比膝跳反射慢？', options: [
      { text: '因為接球要經過大腦判斷，路線比較長。', ok: true },
      { text: '因為手比腳離大腦遠。', why: '重點不是距離，而是有沒有經過大腦判斷：接球 6 步，膝跳 5 步而且不經大腦。' },
      { text: '因為接球不需要神經。', why: '所有反應都要靠神經傳遞訊息。' }] },
    { q: '小明抓到尺時落下 20 cm，小華落下 5 cm，誰的反應比較快？', options: [
      { text: '小明，因為抓到的位置比較多。', why: '尺落下越多，代表抓得越晚。你的證據：20 cm 是 0.2 秒，5 cm 是 0.1 秒。' },
      { text: '小華。', ok: true },
      { text: '一樣快。', why: '落下距離不同，反應時間就不同。' }] }
  ],
  finish: { title: '你把神經反射弄懂了！', rule: '受器 → 感覺神經 → 中樞 → 運動神經 → 動器。反射的中樞在脊髓、不經大腦，比較快；意識動作要經大腦判斷，比較慢。', next: { label: '去體內恆定實驗桌', href: '../homeostasis/' } }
});
