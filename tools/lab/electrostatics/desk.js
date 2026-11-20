// 靜電感應實驗桌：電荷分布與電子移動全部來自 scripts/science/models.mjs 的 calculate('electrostatics')。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('electrostatics', { rod: s.rod, step: s.step });
const ROD = { neg: '帶負電的塑膠棒', pos: '帶正電的玻璃棒' };
const STEP = { near: '只靠近', ground: '靠近並接地', g1: '先斷接地、再移開棒', g2: '先移開棒、再斷接地', contact: '接觸後移開' };
const charge = r => r.net === 0 ? '0' : r.net > 0 ? '正' : '負';

function scene({ rig, el, txt, P, s, r }) {
  const cx = 600, cy = 300, R = 110;
  // 絕緣支架與金屬球
  el('rect', { x: cx - 10, y: cy + R - 4, width: 20, height: 46, fill: '#C9BDA8', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: cx - 70, y: cy + R + 40, width: 140, height: 16, rx: 6, fill: '#8A6A3C', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('circle', { cx, cy, r: R, fill: '#D8DEE6', stroke: '#23304A', 'stroke-width': 4 }, rig);
  el('ellipse', { cx: cx - 36, cy: cy - 44, rx: 30, ry: 18, fill: '#fff', opacity: .6 }, rig);
  // 質子（＋）固定不動：淡淡畫在球內
  for (let i = 0; i < 8; i++) { const a = i / 8 * 2 * Math.PI; txt(rig, cx + 52 * Math.cos(a), cy + 52 * Math.sin(a) + 6, '+', { 'font-size': 18, fill: '#C9A9A6' }); }
  // 多出來或缺少的電荷：畫在近端（左）或遠端（右）或均勻
  const mark = (x, y, sign) => { el('circle', { cx: x, cy: y, r: 15, fill: sign > 0 ? '#C8372D' : '#2F6FB0' }, rig); txt(rig, x, y + 7, sign > 0 ? '+' : '−', { fill: '#fff', 'font-size': 22, 'font-weight': 900 }); };
  const side = (dx, sign) => { if (!sign) return; for (const dy of [-50, 0, 50]) mark(cx + dx, cy + dy, sign); };
  if (r.near && r.far && r.near === r.far) for (let i = 0; i < 6; i++) { const a = i / 6 * 2 * Math.PI + .5; mark(cx + 82 * Math.cos(a), cy + 82 * Math.sin(a), r.near); }
  else { side(-80, r.near); side(80, r.far); }
  txt(rig, cx, cy - R - 20, `金屬球淨電荷：${r.net === 0 ? '0（電中性）' : '帶' + charge(r) + '電'}`, { 'font-size': 18 });
  // 帶電棒
  if (r.rodPresent || s.step === 'contact') {
    const x2 = s.step === 'contact' ? cx - R - 120 : cx - R - 160;
    const op = s.step === 'contact' ? .55 : 1;
    if (s.rod === 'neg') el('image', { href: P + 'prop-plastic-rod.webp', x: x2 - 230, y: cy - 21, width: 330, height: 39, opacity: op }, rig);
    else { el('rect', { x: x2 - 228, y: cy - 17, width: 326, height: 34, rx: 17, fill: 'rgba(214,236,246,.85)', stroke: '#5E8FA8', 'stroke-width': 3, opacity: op }, rig); el('rect', { x: x2 - 210, y: cy - 10, width: 290, height: 7, rx: 3, fill: '#fff', opacity: .8 * op }, rig); }
    for (let i = 0; i < 4; i++) { const x = x2 - 200 + i * 70; el('circle', { cx: x, cy: cy - 40, r: 13, fill: r.rodSign > 0 ? '#C8372D' : '#2F6FB0' }, rig); txt(rig, x, cy - 33, r.rodSign > 0 ? '+' : '−', { fill: '#fff', 'font-size': 20 }); }
    txt(rig, x2 - 60, cy + 56, s.step === 'contact' ? `${ROD[s.rod]}（碰過後移開）` : ROD[s.rod], { 'font-size': 16 });
  } else txt(rig, 260, cy + 6, '帶電棒已移開', { 'font-size': 16, fill: '#5A6478' });
  // 接地線
  if (r.groundPresent) {
    el('path', { d: `M${cx + R - 10} ${cy + 40} Q${cx + R + 80} ${cy + 60} ${cx + R + 90} ${cy + 140}`, fill: 'none', stroke: '#7A5A3A', 'stroke-width': 4 }, rig);
    const gx = cx + R + 90, gy = cy + 140;
    for (const [w, dy] of [[60, 0], [40, 12], [20, 24]]) el('line', { x1: gx - w / 2, y1: gy + dy, x2: gx + w / 2, y2: gy + dy, stroke: '#23304A', 'stroke-width': 4 }, rig);
    txt(rig, gx + 70, gy + 16, '接地', { 'font-size': 15, fill: '#5A6478' });
  }
  // 電子怎麼走
  el('rect', { x: 140, y: 490, width: 720, height: 56, rx: 14, fill: 'rgba(255,255,255,.94)', stroke: '#23304A', 'stroke-width': 2 }, rig);
  txt(rig, 500, 525, `${STEP[s.step]}：${r.flow}`, { 'font-size': 16 });
}

const tgt = (sig, label, rod, step, aim) => ({ sig, label, aim, when: s => s.rod === rod && s.step === step,
  title: s => `${s.rod === 'neg' ? '負電棒' : '正電棒'}・${STEP[s.step]}`,
  body: (s, r) => r.net === 0 && r.near ? `淨電荷 0，近端${r.nearText}、遠端${r.farText}` : r.net === 0 ? '淨電荷 0，不帶電' : `帶${charge(r)}電` });

runDesk({
  key: 'bhcs.lab.electrostatics.v1', title: '靜電感應實驗桌', background: 'bg-physics-bench',
  sceneLabel: '靜電感應實驗桌：帶電棒靠近架在絕緣支架上的金屬球，畫面顯示球上多出或缺少電子的位置，以及接地線',
  initial: { rod: 'neg', step: 'near' },
  model, scene, viewBox: { desk: '100 130 820 430', phone: '110 130 800 430' }, phoneText: 1.5,
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
