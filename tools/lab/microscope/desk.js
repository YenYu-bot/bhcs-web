// 顯微鏡實驗桌：倍率、視野與像的位置來自 ./model.mjs。
import { scope, KIND, SPECIMEN } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const DIR = { center: '不移動', left: '往左移', right: '往右移', up: '往上移', down: '往下移' }, POS = (p) => p[0] === 0 && p[1] === 0 ? '視野正中央' : `視野${p[1] < 0 ? '上' : p[1] > 0 ? '下' : ''}${p[0] < 0 ? '左' : p[0] > 0 ? '右' : ''}${Math.abs(p[0]) > 1 || Math.abs(p[1]) > 1 ? '外面（看不到）' : '邊'}`;
const f = x => String(Math.round(x * 100) / 100);
function scene({ rig, el, txt, s, r, step }) {
  const CX = 610, CY = 300, R = 200, defs = el('defs', {}, rig);
  const cp = el('clipPath', { id: 'ms-view' }, defs); el('circle', { cx: CX, cy: CY, r: R }, cp);
  const cells = step === 'mag' || step === 'light' || step === 'spec';
  // 左：器材這一側
  if (step === 'focus') {
    // 平面側視的複式顯微鏡：載物台會跟著調節輪升降
    const sy = 384 - s.coarse * 12 - s.fine * 4, ink = '#23304A';
    txt(rig, 230, 112, '複式顯微鏡（側面）', { 'font-size': 14, fill: '#5A6478' });
    el('rect', { x: 130, y: 470, width: 200, height: 26, rx: 10, fill: ink }, rig);
    el('path', { d: 'M300 470V230Q300 190 250 190', fill: 'none', stroke: '#4A5A7A', 'stroke-width': 26, 'stroke-linecap': 'round' }, rig);
    el('rect', { x: 205, y: 150, width: 44, height: 120, rx: 8, fill: '#7C8AA5', stroke: ink, 'stroke-width': 3 }, rig); el('rect', { x: 212, y: 126, width: 30, height: 28, rx: 5, fill: ink }, rig);
    el('rect', { x: 197, y: 268, width: 60, height: 14, rx: 6, fill: ink }, rig); el('rect', { x: 218, y: 282, width: 18, height: 26, rx: 3, fill: '#8FD3C1', stroke: ink, 'stroke-width': 3 }, rig);
    el('rect', { x: 150, y: sy, width: 136, height: 12, rx: 3, fill: ink }, rig); el('rect', { x: 196, y: sy - 5, width: 62, height: 5, fill: '#EAF6FF', stroke: ink, 'stroke-width': 1.5 }, rig);
    el('circle', { cx: 227, cy: 452, r: 13, fill: '#FFF3B8', stroke: ink, 'stroke-width': 3 }, rig);
    const knob = (cy, rad, turn, name) => { el('circle', { cx: 300, cy, r: rad, fill: '#8FD3C1', stroke: ink, 'stroke-width': 4 }, rig); const a = turn * Math.PI / 180;
      el('path', { d: `M300 ${cy} L${300 + rad * .8 * Math.sin(a)} ${cy - rad * .8 * Math.cos(a)}`, stroke: ink, 'stroke-width': 4, 'stroke-linecap': 'round' }, rig); txt(rig, 300 + rad + 16, cy + 5, name, { 'font-size': 13 }); };
    knob(386, 26, s.coarse * 72, '粗'); knob(436, 15, s.fine * 60, '細');
    txt(rig, 230, 520, `粗 ${s.coarse} 格・細 ${s.fine} 格`, { 'font-size': 15 });
  } else if (step === 'light') {
    txt(rig, 230, 170, '載物台下方的光圈', { 'font-size': 14, fill: '#5A6478' });
    el('circle', { cx: 230, cy: 290, r: 90, fill: '#5A6478', stroke: '#23304A', 'stroke-width': 4 }, rig); el('circle', { cx: 230, cy: 290, r: { 1: 60, 3: 36, 5: 14 }[s.aperture], fill: '#FFF3B8', stroke: '#23304A', 'stroke-width': 3 }, rig);
    txt(rig, 230, 416, `光圈：${{ 1: '大', 3: '中', 5: '小' }[s.aperture]}　物鏡 ${s.obj}×`, { 'font-size': 15 }); txt(rig, 230, 446, `進入眼睛的光：${r.lightState}`, { 'font-size': 17, fill: r.lightState === '適中' ? '#2E8B66' : '#C8372D' });
  } else if (step === 'kind') {
    txt(rig, 230, 200, `${r.K.name}下的標本`, { 'font-size': 14, fill: '#5A6478' });
    if (s.kind === 'stereo') { el('rect', { x: 150, y: 250, width: 160, height: 110, rx: 10, fill: '#E9C98F', stroke: '#23304A', 'stroke-width': 3 }, rig); el('rect', { x: 150, y: 352, width: 160, height: 18, rx: 6, fill: '#B98A52', stroke: '#23304A', 'stroke-width': 3 }, rig); txt(rig, 230, 392, '不透光的小木塊，光從上方照', { 'font-size': 13, fill: '#5A6478' }); }
    else { el('rect', { x: 110, y: 250, width: 240, height: 110, rx: 8, fill: '#EAF6FF', stroke: '#23304A', 'stroke-width': 3 }, rig); txt(rig, 230, 392, '透明的玻片，光從下方穿過', { 'font-size': 13, fill: '#5A6478' }); }
    txt(rig, 230, 324, 'F', { 'font-size': 52, fill: '#23304A' }); txt(rig, 230, 440, `倍率：${r.K.range}`, { 'font-size': 15 });
  } else {
    el('rect', { x: 110, y: 240, width: 240, height: 110, rx: 8, fill: '#EAF6FF', stroke: '#23304A', 'stroke-width': 3, transform: cells ? '' : `translate(${{ left: -26, right: 26 }[s.slide] || 0} ${{ up: -22, down: 22 }[s.slide] || 0})` }, rig);
    txt(rig, 230, 222, '玻片（實際的樣子）', { 'font-size': 14, fill: '#5A6478' });
    if (cells) { const green = step === 'spec' && r.S.chloroplast; for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) el('rect', { x: 178 + i * 21, y: 276 + j * 21, width: 19, height: 19, rx: 4, fill: green ? '#A9D98F' : '#CFE8B9', stroke: '#4E8A3A', 'stroke-width': 1.5 }, rig); txt(rig, 230, 372, step === 'spec' ? r.S.name : '洋蔥表皮細胞', { 'font-size': 14 }); }
    else { const dx = { left: -26, right: 26 }[s.slide] || 0, dy = { up: -22, down: 22 }[s.slide] || 0; txt(rig, 230 + dx, 314 + dy, 'F', { 'font-size': 52, fill: '#23304A' });
      if (s.slide !== 'center') txt(rig, 230, 392, `玻片${DIR[s.slide]}`, { 'font-size': 15, fill: '#C8372D' }); }
    txt(rig, 230, 440, `物鏡 ${s.obj}× × 目鏡 10× ＝ ${r.total} 倍`, { 'font-size': 15 });
  }
  // 右：視野
  const tone = step === 'light' ? { 太亮: '#FFFFFF', 適中: '#FFFDF2', 太暗: '#6F6A58' }[r.lightState] : { 4: '#FFFDF2', 10: '#F1E9CF', 40: '#CFC5A4' }[s.obj];
  el('circle', { cx: CX, cy: CY, r: R + 14, fill: '#23304A' }, rig); el('circle', { cx: CX, cy: CY, r: R, fill: tone }, rig);
  el('rect', { x: CX - 262, y: CY + R + 24, width: 524, height: 30, rx: 15, fill: '#FFFDF2', opacity: .94 }, rig);
  const g = el('g', { 'clip-path': 'url(#ms-view)' }, rig);
  if (cells) { const n = r.cells, c = 2 * R / n, green = step === 'spec' && r.S.chloroplast, fade = step === 'light' ? { 太亮: .22, 適中: .8, 太暗: .45 }[r.lightState] : .75; let d = '';
    for (let i = 0; i <= n; i++) d += `M${CX - R + i * c} ${CY - R}V${CY + R}M${CX - R} ${CY - R + i * c}H${CX + R}`;
    const layer = el('g', { opacity: step === 'light' ? fade / .75 : 1 }, g);
    el('rect', { x: CX - R, y: CY - R, width: 2 * R, height: 2 * R, fill: green ? '#BFE3A6' : '#CFE8B9', opacity: .75 }, layer);
    el('path', { d, fill: 'none', stroke: '#4E8A3A', 'stroke-width': n > 20 ? 1 : 3 }, layer);
    if (n <= 16) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = CX - R + (i + .5) * c, y = CY - R + (j + .5) * c;
      if (green) for (const [dx, dy] of [[-.25, -.2], [.22, -.12], [-.05, .26]]) el('ellipse', { cx: x + dx * c, cy: y + dy * c, rx: c / 9, ry: c / 13, fill: '#2E8B3A' }, layer); else el('circle', { cx: x, cy: y, r: c / 7, fill: '#7A4BB5' }, layer); }
    txt(rig, CX, CY + R + 44, step === 'spec' ? (green ? '水蘊草：細胞裡有許多綠色的葉綠體' : '洋蔥表皮：看得到細胞核，沒有葉綠體') : step === 'light' ? `光線${r.lightState}${r.lightState === '太亮' ? '，細胞的輪廓淡到看不清' : r.lightState === '太暗' ? '，視野太黑' : '，看得清楚'}` : `視野直徑 ${f(r.field)} mm，一排約 ${r.cells} 個細胞，亮度：${r.bright}`, { 'font-size': 15 });
  } else if (step === 'kind') {
    if (r.K.solid) { el('rect', { x: CX - 150, y: CY - 110, width: 300, height: 220, rx: 14, fill: '#E9C98F' }, g); const sh = txt(g, CX + 7, CY + 37, 'F', { 'font-size': 120, fill: '#8A6A3A' }); sh.setAttribute('opacity', '.6'); txt(g, CX, CY + 30, 'F', { 'font-size': 120, fill: '#23304A' }); }
    else { const t = txt(g, CX, CY + 30, 'F', { 'font-size': 120, fill: '#23304A' }); t.setAttribute('transform', `rotate(180 ${CX} ${CY})`); }
    txt(rig, CX, CY + R + 44, r.K.upright ? '像是正立的，看得出立體的高低' : '像上下、左右都相反，是平面的', { 'font-size': 16 });
  } else { const x = CX + r.pos[0] * 150, y = CY + r.pos[1] * 150, t = txt(g, x, y + 30, 'F', { 'font-size': 86, fill: '#23304A' }); t.setAttribute('transform', `rotate(180 ${x} ${y})`);
    if (step === 'focus') { const fl = el('filter', { id: 'ms-blur', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs); el('feGaussianBlur', { stdDeviation: (100 - r.clarity) / 6 }, fl); t.setAttribute('filter', 'url(#ms-blur)'); txt(rig, CX, CY + R + 44, r.clarity >= 100 ? '非常清楚' : r.clarity >= 80 ? '看得到了，還有一點模糊' : '很模糊', { 'font-size': 16, fill: r.clarity >= 100 ? '#2E8B66' : '#C8372D' }); }
    else { el('path', { d: `M${CX - 14} ${CY}H${CX + 14}M${CX} ${CY - 14}V${CY + 14}`, stroke: '#C8372D', 'stroke-width': 2 }, rig); txt(rig, CX, CY + R + 44, `像在${POS(r.pos)}`, { 'font-size': 16, fill: r.centered ? '#2E8B66' : '#C8372D' }); } }
  txt(rig, CX, CY - R - 26, '從目鏡看到的視野', { 'font-size': 14, fill: '#5A6478' });
}

const tgt = (sig, label, set, aim, body, title) => ({ sig, label, set, aim, title: title || (s => `物鏡 ${s.obj}×，玻片${DIR[s.slide]}`), body });
const base = { slide: 'center', target: 'center', coarse: 2, fine: 1, aperture: 3, spec: 'onion', kind: 'compound' };
const slideCtl = list => ({ key: 'slide', label: '移動玻片', type: 'seg', cols: 3, options: list.map(k => [k, DIR[k]]) });

runDesk({
  key: 'bhcs.lab.microscope.v1', title: '顯微鏡實驗桌', background: 'bg-chem-bench',
  sceneLabel: '顯微鏡實驗桌：左邊是玻片、調節輪或光圈，右邊的圓形是從目鏡看到的視野',
  initial: { obj: 4, ...base },
  model: scope, scene, viewBox: { desk: '80 20 800 600', phone: '80 20 800 600' }, phoneText: 1.4,
  readouts: (s, r) => [['放大倍率', String(r.total), '倍', `${s.obj} × 10`], ['視野直徑', f(r.field), 'mm', `一排約 ${r.cells} 個細胞`], ['清晰度', String(r.clarity), '%', `光線${r.lightState}`]],
  why: { title: '複式顯微鏡', button: '顯微鏡怎麼看', html: `
    <p class="fn-tip"><b>放大倍率 ＝ 目鏡倍率 × 物鏡倍率。</b>這裡目鏡固定 10×。</p>
    <p class="fn-tip"><b>像是上下、左右都相反的。</b>玻片上的「F」，在視野裡是轉了 180 度的樣子。所以像偏向哪一邊，就把玻片往那一邊移，像才會回到中央。</p>
    <p class="fn-tip"><b>倍率越高：</b>看到的細胞越大、越少，視野範圍越小，也越暗。</p>
    <p class="fn-tip"><b>操作順序：</b>先用低倍物鏡找到目標、移到正中央，再換高倍物鏡，然後只用細調節輪對焦。高倍物鏡離玻片很近，轉粗調節輪容易壓破玻片。</p>
    <p class="fn-tip"><b>調光：</b>光線太強或太弱都看不清楚。換高倍後視野變暗，要把光圈調大或調整反光鏡。這裡的通光量是示意數值。</p>
    <p class="fn-tip"><b>解剖顯微鏡：</b>倍率比較低，像是正立的、有立體感，適合看不透光的立體標本；複式顯微鏡倍率高，看薄而透光的標本。</p>` },
  steps: [
    { id: 'image', label: '方向', title: '顯微鏡下的「F」長什麼樣子？', goal: '玻片上寫著 F。先收下不移動時的像，再把玻片往右移，看像往哪邊跑，收下結果。',
      intro: '比比看，左邊的玻片和右邊的視野，F 一樣嗎？', enter: { obj: 4, ...base }, controls: [slideCtl(['center', 'left', 'right'])],
      react: (s, r) => s.slide === 'center' ? '像是上下、左右都顛倒的 F。' : `玻片${DIR[s.slide]}，像跑到${POS(r.pos)}。`,
      targets: [tgt('c', '不移動', { obj: 4, target: 'center', slide: 'center' }, '先看不移動的樣子。', () => '像和玻片上的 F 上下、左右都相反'), tgt('r', '玻片往右移', { obj: 4, target: 'center', slide: 'right' }, '把玻片往右移。', (s, r) => `像往左跑，到${POS(r.pos)}`)],
      found: ['顯微鏡的像上下、左右都相反；玻片往右移，像往左跑。', '像的移動方向和玻片相反'] },
    { id: 'center', label: '置中', title: '目標偏在左邊，玻片要往哪裡移？', goal: '像現在偏在視野左邊。移動玻片，讓像回到正中央再收下。',
      intro: '換高倍之前，要先把目標移到正中央。往哪邊移？', enter: { obj: 10, ...base, target: 'left' }, controls: [slideCtl(['center', 'left', 'right'])],
      react: (s, r) => r.centered ? '回到正中央了！' : !r.inView ? '像跑出視野了，方向反了。' : `像在${POS(r.pos)}。`,
      targets: [tgt('ok', '像回到中央', { obj: 10, target: 'left', slide: 'left' }, '像偏左，就把玻片往左移。', () => '像偏左時把玻片往左移，像回到正中央')],
      found: ['像偏向哪一邊，玻片就往那一邊移。', '偏左 → 往左移；偏右上 → 往右上移'] },
    { id: 'focus', label: '對焦', title: '模糊的像，要怎麼調清楚？', goal: '用 4× 物鏡。先轉粗調節輪找到影像（清晰度到 80%）收下，再轉細調節輪調到 100% 收下。',
      intro: '現在一片模糊。先轉大的粗調節輪。', enter: { obj: 4, ...base, coarse: 0, fine: 0 },
      controls: [{ key: 'coarse', label: '粗調節輪', type: 'num', min: 0, max: 4, step: 1 }, { key: 'fine', label: '細調節輪', type: 'num', min: 0, max: 2, step: 1 }],
      react: (s, r) => `清晰度 ${r.clarity}%。`,
      targets: [tgt('c', '粗調節輪找到影像', { obj: 4, coarse: 2, fine: 0 }, '粗調節輪轉到第 2 格。', (s, r) => `清晰度 ${r.clarity}%，看得到影像了`, s => `粗調節輪第 ${s.coarse} 格、細調節輪第 ${s.fine} 格`), tgt('f', '細調節輪調清楚', { obj: 4, coarse: 2, fine: 1 }, '再把細調節輪轉到第 1 格。', (s, r) => `清晰度 ${r.clarity}%，非常清楚`, s => `粗調節輪第 ${s.coarse} 格、細調節輪第 ${s.fine} 格`)],
      found: ['粗調節輪動得多，用來找到影像；細調節輪動得少，用來把影像調清楚。', '先粗後細；高倍時只用細調節輪'] },
    { id: 'mag', label: '倍率', title: '倍率變高，看到的變多還是變少？', goal: '轉換物鏡。收下 4×、10×、40× 三種倍率的結果。',
      intro: '這是洋蔥表皮細胞。換高倍物鏡看看。', enter: { obj: 4, ...base }, controls: [{ key: 'obj', label: '物鏡', type: 'seg', options: [[4, '4×'], [10, '10×'], [40, '40×']] }],
      react: (s, r) => `${r.total} 倍：一排約 ${r.cells} 個細胞，亮度${r.bright}。`,
      targets: [4, 10, 40].map(o => tgt('o' + o, `物鏡 ${o}×`, { obj: o, slide: 'center', target: 'center' }, `換成 ${o}× 物鏡。`, (s, r) => `${r.total} 倍，視野直徑 ${f(r.field)} mm，一排約 ${r.cells} 個細胞，亮度${r.bright}`)),
      found: ['倍率越高，細胞看起來越大，但看到的數目越少、視野越小、越暗。', '倍率變 10 倍，視野直徑變 1/10'] },
    { id: 'light', label: '調光', title: '視野太亮或太暗，怎麼辦？', goal: '收下四種情況：4× 配大光圈、4× 配中光圈、40× 配中光圈、40× 配大光圈。',
      intro: '光圈開到最大，細胞看得清楚嗎？', enter: { obj: 4, ...base, aperture: 1 },
      controls: [{ key: 'obj', label: '物鏡', type: 'seg', options: [[4, '4×'], [40, '40×']] }, { key: 'aperture', label: '光圈', type: 'seg', options: [[1, '大'], [3, '中'], [5, '小']] }],
      react: (s, r) => `光線${r.lightState}。`,
      targets: [[4, 1], [4, 3], [40, 3], [40, 1]].map(([o, a]) => tgt(`l${o}${a}`, `${o}×、光圈${{ 1: '大', 3: '中' }[a]}`, { obj: o, aperture: a }, `物鏡 ${o}×、光圈${{ 1: '大', 3: '中' }[a]}。`, (s, r) => `進入眼睛的光${r.lightState}`, s => `物鏡 ${s.obj}×、光圈${{ 1: '大', 3: '中', 5: '小' }[s.aperture]}`)),
      found: ['低倍時光圈太大會太亮，細胞輪廓反而看不清；換高倍後變暗，要把光圈調大。', '光線適中才看得清楚'] },
    { id: 'spec', label: '標本', title: '洋蔥表皮和水蘊草，細胞哪裡不一樣？', goal: '用 10× 物鏡。收下洋蔥鱗莖表皮和水蘊草葉片兩種標本。',
      intro: '兩種都是植物細胞。找找看有沒有綠色的小顆粒。', enter: { obj: 10, ...base },
      controls: [{ key: 'spec', label: '標本', type: 'seg', options: Object.entries(SPECIMEN).map(([k, v]) => [k, v.name]) }],
      react: (s, r) => r.S.chloroplast ? '細胞裡有許多綠色的葉綠體。' : '看得到細胞壁和細胞核，沒有葉綠體。',
      targets: Object.keys(SPECIMEN).map(k => tgt(k, SPECIMEN[k].name, { obj: 10, spec: k }, `換成${SPECIMEN[k].name}。`, (s, r) => r.S.chloroplast ? '細胞排列整齊，有細胞壁，細胞裡有綠色的葉綠體' : '細胞排列整齊，有細胞壁和細胞核，沒有葉綠體', s => `${SPECIMEN[s.spec].name}，物鏡 ${s.obj}×`)),
      found: ['兩種都有細胞壁；水蘊草葉片照得到光，有葉綠體，洋蔥鱗莖長在土裡，表皮細胞沒有葉綠體。', '不是所有植物細胞都有葉綠體'] },
    { id: 'kind', label: '兩種鏡', title: '複式顯微鏡和解剖顯微鏡，差在哪裡？', goal: '同樣看一個「F」。收下複式顯微鏡和解剖顯微鏡看到的像。',
      intro: '解剖顯微鏡看到的 F，方向一樣嗎？', enter: { obj: 4, ...base },
      controls: [{ key: 'kind', label: '顯微鏡', type: 'seg', options: Object.entries(KIND).map(([k, v]) => [k, v.name]) }],
      react: (s, r) => r.K.upright ? '像是正立的，還看得出立體感。' : '像上下、左右都相反。',
      targets: Object.keys(KIND).map(k => tgt(k, KIND[k].name, { kind: k }, `換成${KIND[k].name}。`, (s, r) => `${r.K.upright ? '像正立、有立體感' : '像上下左右相反、平面'}；倍率${r.K.range}；適合看${r.K.use}`, s => KIND[s.kind].name)),
      found: ['複式顯微鏡倍率高、像相反，看薄而透光的標本；解剖顯微鏡倍率低、像正立有立體感，看不透光的立體標本。', '看細胞用複式；看昆蟲、花用解剖'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：倍率與視野', goal: '目鏡 10×。4× 物鏡時視野直徑 4 mm，一排看到 40 個細胞。', intro: '倍率 ＝ 目鏡 × 物鏡。', head: '放大倍率 ＝ 目鏡倍率 × 物鏡倍率',
      rows: [
        { id: 't', name: '目鏡 10×、物鏡 40×，放大倍率', eq: '10 × 40', answer: 400, unit: '倍' },
        { id: 'd', name: '物鏡從 4× 換成 40×，視野直徑變成', eq: '4 mm × 4 ÷ 40', answer: 0.4, unit: 'mm' },
        { id: 'n', name: '4× 時一排 40 個細胞，換成 40× 一排看到', eq: '40 × 4 ÷ 40', answer: 4, unit: '個', hint: v => v === 400 ? '倍率變大，看到的個數是變少。' : '' }],
      found: ['算對了！', '倍率變幾倍，視野直徑和一排的細胞數就變幾分之一'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '四題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後四題！想想視野裡的 F 和洋蔥細胞。',
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
      { text: '完全沒有變化。', why: '倍率改變，視野大小、亮度和看到的細胞數都會變。' }] },
    { q: '換成高倍物鏡後影像有點模糊，應該轉哪一個？', options: [
      { text: '粗調節輪，一次調到位。', why: '高倍物鏡離玻片很近，轉粗調節輪容易壓破玻片。' },
      { text: '細調節輪。', ok: true },
      { text: '把光圈關小。', why: '光圈調的是亮度，不是清晰度。' }] },
  ],
  finish: { title: '你會用顯微鏡了！', rule: '放大倍率 ＝ 目鏡 × 物鏡。像上下、左右相反，像偏哪邊玻片就往哪邊移。對焦先粗後細，高倍只用細調節輪。倍率越高，視野越小、越暗，要把光調亮。', next: { label: '去細胞分裂實驗桌', href: '../cell-division/' } }
});
