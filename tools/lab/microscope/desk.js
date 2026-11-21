// 顯微鏡實驗桌：倍率、視野與像的位置來自 ./model.mjs。
import { scope } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const DIR = { center: '不移動', left: '往左移', right: '往右移', up: '往上移', down: '往下移' }, POS = (p) => p[0] === 0 && p[1] === 0 ? '視野正中央' : `視野${p[1] < 0 ? '上' : p[1] > 0 ? '下' : ''}${p[0] < 0 ? '左' : p[0] > 0 ? '右' : ''}${Math.abs(p[0]) > 1 || Math.abs(p[1]) > 1 ? '外面（看不到）' : '邊'}`;
const f = x => String(Math.round(x * 100) / 100);
function scene({ rig, el, txt, s, r, step }) {
  const CX = 610, CY = 300, R = 200;
  // 左：玻片（實際的樣子）
  el('rect', { x: 110, y: 240, width: 240, height: 110, rx: 8, fill: '#EAF6FF', stroke: '#23304A', 'stroke-width': 3, transform: step === 'mag' ? '' : `translate(${{ left: -26, right: 26 }[s.slide] || 0} ${{ up: -22, down: 22 }[s.slide] || 0})` }, rig);
  txt(rig, 230, 222, '玻片（實際的樣子）', { 'font-size': 14, fill: '#5A6478' });
  if (step === 'mag') { for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) el('rect', { x: 178 + i * 21, y: 276 + j * 21, width: 19, height: 19, rx: 4, fill: '#CFE8B9', stroke: '#4E8A3A', 'stroke-width': 1.5 }, rig); txt(rig, 230, 372, '洋蔥表皮細胞', { 'font-size': 14 }); }
  else { const dx = { left: -26, right: 26 }[s.slide] || 0, dy = { up: -22, down: 22 }[s.slide] || 0; txt(rig, 230 + dx, 314 + dy, 'F', { 'font-size': 52, fill: '#23304A' });
    if (s.slide !== 'center') txt(rig, 230, 392, `玻片${DIR[s.slide]}`, { 'font-size': 15, fill: '#C8372D' }); }
  txt(rig, 230, 440, `物鏡 ${s.obj}× × 目鏡 10× ＝ ${r.total} 倍`, { 'font-size': 15 });
  // 右：視野
  const defs = el('defs', {}, rig), cp = el('clipPath', { id: 'ms-view' }, defs); el('circle', { cx: CX, cy: CY, r: R }, cp);
  el('circle', { cx: CX, cy: CY, r: R + 14, fill: '#23304A' }, rig);
  el('circle', { cx: CX, cy: CY, r: R, fill: { 4: '#FFFDF2', 10: '#F1E9CF', 40: '#CFC5A4' }[s.obj] }, rig);
  const g = el('g', { 'clip-path': 'url(#ms-view)' }, rig);
  if (step === 'mag') { const n = r.cells, c = 2 * R / n; let d = '';
    for (let i = 0; i <= n; i++) d += `M${CX - R + i * c} ${CY - R}V${CY + R}M${CX - R} ${CY - R + i * c}H${CX + R}`;
    el('rect', { x: CX - R, y: CY - R, width: 2 * R, height: 2 * R, fill: '#CFE8B9', opacity: .75 }, g);
    el('path', { d, fill: 'none', stroke: '#4E8A3A', 'stroke-width': n > 20 ? 1 : 3 }, g);
    if (n <= 16) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) el('circle', { cx: CX - R + (i + .5) * c, cy: CY - R + (j + .5) * c, r: c / 7, fill: '#7A4BB5' }, g);
    txt(rig, CX, CY + R + 44, `視野直徑 ${f(r.field)} mm，一排約 ${r.cells} 個細胞，亮度：${r.bright}`, { 'font-size': 15 });
  } else { const x = CX + r.pos[0] * 150, y = CY + r.pos[1] * 150, t = txt(g, x, y + 30, 'F', { 'font-size': 86, fill: '#23304A' }); t.setAttribute('transform', `rotate(180 ${x} ${y})`);
    el('path', { d: `M${CX - 14} ${CY}H${CX + 14}M${CX} ${CY - 14}V${CY + 14}`, stroke: '#C8372D', 'stroke-width': 2 }, rig);
    txt(rig, CX, CY + R + 44, `像在${POS(r.pos)}`, { 'font-size': 16, fill: r.centered ? '#2E8B66' : '#C8372D' }); }
  txt(rig, CX, CY - R - 26, '從目鏡看到的視野', { 'font-size': 14, fill: '#5A6478' });
}

const tgt = (sig, label, set, aim, body) => ({ sig, label, set, aim, title: s => `物鏡 ${s.obj}×，玻片${DIR[s.slide]}`, body });
const slideCtl = list => ({ key: 'slide', label: '移動玻片', type: 'seg', cols: 3, options: list.map(k => [k, DIR[k]]) });

runDesk({
  key: 'bhcs.lab.microscope.v1', title: '顯微鏡實驗桌', background: 'bg-chem-bench',
  sceneLabel: '顯微鏡實驗桌：左邊是玻片實際的樣子，右邊的圓形是從目鏡看到的視野',
  initial: { obj: 4, slide: 'center', target: 'center' },
  model: scope, scene, viewBox: { desk: '80 20 800 600', phone: '80 20 800 600' }, phoneText: 1.4,
  readouts: (s, r) => [['放大倍率', String(r.total), '倍', `${s.obj} × 10`], ['視野直徑', f(r.field), 'mm', `一排約 ${r.cells} 個細胞`], ['亮度', r.bright, '', s.obj === 40 ? '要把光圈調大' : '']],
  why: { title: '複式顯微鏡', button: '顯微鏡怎麼看', html: `
    <p class="fn-tip"><b>放大倍率 ＝ 目鏡倍率 × 物鏡倍率。</b>這裡目鏡固定 10×。</p>
    <p class="fn-tip"><b>像是上下、左右都相反的。</b>玻片上的「F」，在視野裡是轉了 180 度的樣子。所以像偏向哪一邊，就把玻片往那一邊移，像才會回到中央。</p>
    <p class="fn-tip"><b>倍率越高：</b>看到的細胞越大、越少，視野範圍越小，也越暗。</p>
    <p class="fn-tip"><b>操作順序：</b>先用低倍物鏡找到目標、移到正中央，再換高倍物鏡，然後只用細調節輪對焦。</p>` },
  steps: [
    { id: 'image', label: '像的方向', title: '顯微鏡下的「F」長什麼樣子？', goal: '玻片上寫著 F。先收下不移動時的像，再把玻片往右移，看像往哪邊跑，收下結果。',
      intro: '比比看，左邊的玻片和右邊的視野，F 一樣嗎？', enter: { obj: 4, slide: 'center', target: 'center' }, controls: [slideCtl(['center', 'left', 'right'])],
      react: (s, r) => s.slide === 'center' ? '像是上下、左右都顛倒的 F。' : `玻片${DIR[s.slide]}，像跑到${POS(r.pos)}。`,
      targets: [tgt('c', '不移動', { obj: 4, target: 'center', slide: 'center' }, '先看不移動的樣子。', () => '像和玻片上的 F 上下、左右都相反'), tgt('r', '玻片往右移', { obj: 4, target: 'center', slide: 'right' }, '把玻片往右移。', (s, r) => `像往左跑，到${POS(r.pos)}`)],
      found: ['顯微鏡的像上下、左右都相反；玻片往右移，像往左跑。', '像的移動方向和玻片相反'] },
    { id: 'mag', label: '倍率與視野', title: '倍率變高，看到的變多還是變少？', goal: '轉換物鏡。收下 4×、10×、40× 三種倍率的結果。',
      intro: '這是洋蔥表皮細胞。換高倍物鏡看看。', enter: { obj: 4, slide: 'center', target: 'center' }, controls: [{ key: 'obj', label: '物鏡', type: 'seg', options: [[4, '4×'], [10, '10×'], [40, '40×']] }],
      react: (s, r) => `${r.total} 倍：一排約 ${r.cells} 個細胞，亮度${r.bright}。`,
      targets: [4, 10, 40].map(o => tgt('o' + o, `物鏡 ${o}×`, { obj: o, slide: 'center', target: 'center' }, `換成 ${o}× 物鏡。`, (s, r) => `${r.total} 倍，視野直徑 ${f(r.field)} mm，一排約 ${r.cells} 個細胞，亮度${r.bright}`)),
      found: ['倍率越高，細胞看起來越大，但看到的數目越少、視野越小、越暗。', '倍率變 10 倍，視野直徑變 1/10'] },
    { id: 'center', label: '移到中央', title: '目標偏在左邊，玻片要往哪裡移？', goal: '像現在偏在視野左邊。移動玻片，讓像回到正中央再收下。',
      intro: '換高倍之前，要先把目標移到正中央。往哪邊移？', enter: { obj: 10, slide: 'center', target: 'left' }, controls: [slideCtl(['center', 'left', 'right'])],
      react: (s, r) => r.centered ? '回到正中央了！' : !r.inView ? '像跑出視野了，方向反了。' : `像在${POS(r.pos)}。`,
      targets: [tgt('ok', '像回到中央', { obj: 10, target: 'left', slide: 'left' }, '像偏左，就把玻片往左移。', () => '像偏左時把玻片往左移，像回到正中央')],
      found: ['像偏向哪一邊，玻片就往那一邊移。', '偏左 → 往左移；偏右上 → 往右上移'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：倍率與視野', goal: '目鏡 10×。4× 物鏡時視野直徑 4 mm，一排看到 40 個細胞。', intro: '倍率 ＝ 目鏡 × 物鏡。', head: '放大倍率 ＝ 目鏡倍率 × 物鏡倍率',
      rows: [
        { id: 't', name: '目鏡 10×、物鏡 40×，放大倍率', eq: '10 × 40', answer: 400, unit: '倍' },
        { id: 'd', name: '物鏡從 4× 換成 40×，視野直徑變成', eq: '4 mm × 4 ÷ 40', answer: 0.4, unit: 'mm' },
        { id: 'n', name: '4× 時一排 40 個細胞，換成 40× 一排看到', eq: '40 × 4 ÷ 40', answer: 4, unit: '個', hint: v => v === 400 ? '倍率變大，看到的個數是變少。' : '' }],
      found: ['算對了！', '倍率變幾倍，視野直徑和一排的細胞數就變幾分之一'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想視野裡的 F 和洋蔥細胞。',
      found: ['你會用顯微鏡了！', '像相反；高倍看得大、看得少、比較暗'] }
  ],
  quiz: [
    { q: '玻片上寫著「p」，在顯微鏡視野裡看起來像？', options: [
      { text: 'p', why: '顯微鏡的像上下、左右都相反，不會和原來一樣。' },
      { text: 'q', why: '只有左右相反才是 q。顯微鏡是上下也相反。' },
      { text: 'd', ok: true }] },
    { q: '在視野右上方發現一隻草履蟲，想把牠移到正中央，玻片要往哪裡移？', options: [
      { text: '右上方。', ok: true },
      { text: '左下方。', why: '像和玻片的移動方向相反：想讓像往左下回到中央，玻片要往右上移。你的證據：像偏左時是把玻片往左移。' },
      { text: '不用移，換高倍就會在中央。', why: '換高倍後視野更小，偏在旁邊的目標反而會跑出視野。' }] },
    { q: '從低倍換成高倍物鏡後，視野會？', options: [
      { text: '變亮、看到的細胞變多。', why: '相反。你的證據：40× 時一排只剩 4 個細胞，而且比較暗。' },
      { text: '變暗、看到的細胞變少但變大。', ok: true },
      { text: '完全沒有變化。', why: '倍率改變，視野大小、亮度和看到的細胞數都會變。' }] }
  ],
  finish: { title: '你會用顯微鏡了！', rule: '放大倍率 ＝ 目鏡 × 物鏡。像上下、左右相反，像偏哪邊玻片就往哪邊移。倍率越高，視野越小、越暗，看到的細胞越少。', next: { label: '去細胞分裂實驗桌', href: '../cell-division/' } }
});
