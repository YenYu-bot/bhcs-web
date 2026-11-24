// 直流馬達實驗桌：導線受力與轉向來自 ./model.mjs。
import { motor } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const DIR = v => v > 0 ? '順時針' : '逆時針', UP = v => v > 0 ? '向上' : '向下', CUR = v => v > 0 ? '流出紙面 ⊙' : '流入紙面 ⊗';
const BAT = { fwd: '正接', rev: '反接' }, MAG = { NS: '左 N 右 S', SN: '左 S 右 N' }, POS = { start: '開始', half: '轉過半圈' };
const n1 = v => (+v).toFixed(1);
function defs(el, rig) {
  const d = el('defs', {}, rig), g = (id, stops, v = 1) => { const n = el('linearGradient', { id, x1: 0, y1: 0, x2: v ? 0 : 1, y2: v ? 1 : 0 }, d); for (const [o, c] of stops) el('stop', { offset: o, 'stop-color': c }, n); };
  g('mo-n', [[0, '#F0827A'], [.15, '#E4574C'], [1, '#A82A22']], 0); g('mo-s', [[0, '#3C6FC0'], [.85, '#5A8FE0'], [1, '#2A5590']], 0);
  g('mo-cu', [[0, '#F2B07A'], [.5, '#C9733D'], [1, '#8E3F16']]); g('mo-cell', [[0, '#3C4250'], [.4, '#6B7384'], [1, '#2C313C']]);
  g('mo-base', [[0, '#C9A877'], [1, '#86693F']]);
  const m = el('marker', { id: 'mo-g', viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#8792A6' }, m);
  const m2 = el('marker', { id: 'mo-r', viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 3.4, markerHeight: 3.4, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#C8372D' }, m2);
}
const wire = (el, g, d, c) => { el('path', { d, fill: 'none', stroke: '#23304A', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g); el('path', { d, fill: 'none', stroke: c, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g); };
function cell(el, txt, g, x, y, flip) {
  const q = el('g', { transform: flip ? `rotate(180 ${x} ${y})` : null }, g);
  el('rect', { x: x - 44, y: y - 15, width: 82, height: 30, rx: 6, fill: 'url(#mo-cell)', stroke: '#1C2028', 'stroke-width': 2 }, q);
  el('rect', { x: x + 6, y: y - 15, width: 32, height: 30, fill: '#E5A43B' }, q);
  el('rect', { x: x + 38, y: y - 7, width: 7, height: 14, rx: 2, fill: '#C9CED6', stroke: '#1C2028', 'stroke-width': 1.5 }, q);
  txt(q, x + 22, y + 5, '+', { 'font-size': 16, fill: '#23304A', 'font-weight': 900 }); txt(q, x - 28, y + 5, '−', { 'font-size': 16, fill: '#fff', 'font-weight': 900 });
}
const CY = 270, AX = 500, RW = 100;
function scene({ rig, el, txt, s, r, step, set, drag, hint, kind }) {
  defs(el, rig);
  const can = kind === 'observe';
  // 底座與磁鐵
  el('rect', { x: 140, y: 392, width: 720, height: 22, rx: 6, fill: 'url(#mo-base)', stroke: '#6B5540', 'stroke-width': 2 }, rig);
  const mag = (x, n, side) => { const g = el('g', { 'data-drag': can && step === 'magnet' ? 'magnet-' + side : null }, rig);
    el('rect', { x: x + 4, y: 164, width: 112, height: 228, rx: 10, fill: '#000', opacity: .15 }, g);
    el('rect', { x, y: 160, width: 112, height: 232, rx: 10, fill: `url(#mo-${n ? 'n' : 's'})`, stroke: '#23304A', 'stroke-width': 3 }, g);
    el('rect', { x: x + 10, y: 170, width: 12, height: 212, rx: 6, fill: '#fff', opacity: .22 }, g);
    txt(g, x + 56, 290, n ? 'N' : 'S', { 'font-size': 44, fill: '#fff', 'font-weight': 900 });
    if (can && step === 'magnet') drag(g, () => ({ move() {}, end() { set({ magnet: s.magnet === 'NS' ? 'SN' : 'NS' }); }, cancel() {} }), { label: '把兩塊磁鐵左右對調', tap: () => set({ magnet: s.magnet === 'NS' ? 'SN' : 'NS' }) }); };
  mag(150, s.magnet === 'NS', 'left'); mag(738, s.magnet !== 'NS', 'right');
  const fd = s.magnet === 'NS' ? 1 : -1;
  for (const y of [CY - 80, CY - 30, CY + 30, CY + 80]) el('path', { d: fd > 0 ? `M272 ${y} H724` : `M724 ${y} H272`, stroke: '#9FB0C8', 'stroke-width': 2, 'stroke-dasharray': '9 7', 'marker-end': 'url(#mo-g)' }, rig);
  txt(rig, 640, 384, '磁場方向（N → S）', { 'font-size': 13, fill: '#5A6478' });
  // 線圈（從轉軸方向看）：甲、乙兩條導線
  const ang = s.pos === 'half' ? 180 : 0, cg = el('g', { 'data-drag': can && step === 'commutator' ? 'coil' : null }, rig), rot = el('g', { transform: `rotate(${ang} ${AX} ${CY})` }, cg);
  el('circle', { cx: AX, cy: CY, r: RW + 34, fill: 'transparent' }, cg);
  el('path', { d: `M${AX - RW} ${CY}H${AX + RW}`, stroke: 'url(#mo-cu)', 'stroke-width': 9, 'stroke-linecap': 'round' }, rot);
  el('path', { d: `M${AX - RW} ${CY}H${AX + RW}`, stroke: '#7A3A16', 'stroke-width': 1.5, opacity: .5 }, rot);
  for (const [x, nm] of [[AX - RW, '甲'], [AX + RW, '乙']]) { el('circle', { cx: x, cy: CY, r: 25, fill: '#F2C879', stroke: '#23304A', 'stroke-width': 3 }, rot); }
  for (const [x, nm] of [[AX - RW - 46, r.wireA === 'left' ? '甲' : '乙'], [AX + RW + 46, r.wireA === 'left' ? '乙' : '甲']]) { el('circle', { cx: x, cy: CY, r: 12, fill: '#fff', stroke: '#23304A', 'stroke-width': 1.5 }, rig); txt(rig, x, CY + 5, nm, { 'font-size': 13 }); }
  // 電流符號（不跟著旋轉，畫在實際位置）
  for (const [x, cur] of [[AX - RW, r.leftCurrent], [AX + RW, -r.leftCurrent]]) { if (cur > 0) el('circle', { cx: x, cy: CY, r: 7, fill: '#23304A', 'pointer-events': 'none' }, rig); else el('path', { d: `M${x - 11} ${CY - 11}L${x + 11} ${CY + 11}M${x + 11} ${CY - 11}L${x - 11} ${CY + 11}`, stroke: '#23304A', 'stroke-width': 4, 'stroke-linecap': 'round', 'pointer-events': 'none' }, rig); }
  // 換向器（或整圈滑環）與電刷
  const comm = el('g', { 'data-drag': can && step === 'commutator' ? 'comm' : null }, rig);
  el('circle', { cx: AX, cy: CY, r: 30, fill: 'transparent' }, comm);
  if (s.commutator) for (const k of [0, 1]) { const a0 = (k * 180 + 8 + ang) * Math.PI / 180, a1 = (k * 180 + 172 + ang) * Math.PI / 180;
    el('path', { d: `M${n1(AX + 22 * Math.cos(a0))} ${n1(CY + 22 * Math.sin(a0))}A22 22 0 0 1 ${n1(AX + 22 * Math.cos(a1))} ${n1(CY + 22 * Math.sin(a1))}`, fill: 'none', stroke: '#C9733D', 'stroke-width': 9 }, comm); }
  else el('circle', { cx: AX, cy: CY, r: 22, fill: 'none', stroke: '#B8902E', 'stroke-width': 9 }, comm);
  el('circle', { cx: AX, cy: CY, r: 9, fill: '#5A6478', stroke: '#23304A', 'stroke-width': 2, 'pointer-events': 'none' }, rig);
  for (const sx of [-1, 1]) el('rect', { x: AX + sx * 34 - 7, y: CY + 14, width: 14, height: 24, rx: 3, fill: '#3A3F48', transform: `rotate(${sx * -35} ${AX + sx * 34} ${CY + 26})`, 'pointer-events': 'none' }, rig);
  txt(rig, AX, CY - 42, s.commutator ? '換向器' : '沒有換向器', { 'font-size': 12, fill: '#8A5A2A', 'pointer-events': 'none' });
  if (can && step === 'commutator') {
    drag(cg, p0 => { let a = 0; return {
      move(p, q0) { a = (Math.atan2(p.y - CY, p.x - AX) - Math.atan2(q0.y - CY, q0.x - AX)) * 180 / Math.PI; rot.setAttribute('transform', `rotate(${n1(ang + a)} ${AX} ${CY})`); },
      end() { const t = ((a % 360) + 360) % 360; if (t > 90 && t < 270) set({ pos: s.pos === 'half' ? 'start' : 'half' }); else rot.setAttribute('transform', `rotate(${ang} ${AX} ${CY})`); },
      cancel() { rot.setAttribute('transform', `rotate(${ang} ${AX} ${CY})`); } }; },
      { label: '把線圈轉半圈', tap: () => set({ pos: s.pos === 'half' ? 'start' : 'half' }) });
    drag(comm, () => ({ move() {}, end() {}, cancel() {} }), { label: s.commutator ? '拿掉換向器' : '裝上換向器', tap: () => set({ commutator: !s.commutator }) });
  }
  // 受力箭頭
  for (const [x, f] of [[AX - RW, r.leftForce], [AX + RW, r.rightForce]]) { const len = 40 + 30 * s.cells, y0 = CY - f * 32, y1 = y0 - f * len;
    el('path', { d: `M${x} ${y0}V${y1}`, stroke: '#fff', 'stroke-width': 12, opacity: .7, 'stroke-linecap': 'round' }, rig);
    el('path', { d: `M${x} ${y0}V${y1}`, stroke: '#C8372D', 'stroke-width': 7, 'stroke-linecap': 'round', 'marker-end': 'url(#mo-r)' }, rig);
    txt(rig, x + (x < AX ? -58 : 58), y1 + f * 14, `受力${UP(f)}`, { 'font-size': 14, fill: '#C8372D' }); }
  // 轉向
  const tq = r.torque > 0 ? 1 : -1, ra = RW + 30;
  el('path', { d: tq > 0 ? `M${AX - ra * .7} ${CY - ra * .7}A${ra} ${ra} 0 0 1 ${AX + ra * .7} ${CY - ra * .7}` : `M${AX + ra * .7} ${CY - ra * .7}A${ra} ${ra} 0 0 0 ${AX - ra * .7} ${CY - ra * .7}`, fill: 'none', stroke: '#2E8B66', 'stroke-width': 4, 'stroke-dasharray': '8 5', 'marker-end': 'url(#mo-g)' }, rig);
  txt(rig, AX, CY - ra - 10, DIR(r.torque), { 'font-size': 14, fill: '#2E8B66' });
  // 電池（從電刷接到電池）
  const bx = 500, by = 478, cells = s.cells, flip = s.battery === 'rev';
  wire(el, rig, `M${AX - 40} ${CY + 40}V432H368Q356 432 356 444V${by}H${bx - 120}`, flip ? '#C8372D' : '#3A3F48');
  wire(el, rig, `M${AX + 40} ${CY + 40}V432H632Q644 432 644 444V${by}H${bx + 120}`, flip ? '#3A3F48' : '#C8372D');
  el('rect', { x: bx - 120, y: by - 24, width: 240, height: 48, rx: 10, fill: '#3E4656', stroke: '#1C2028', 'stroke-width': 2 }, rig);
  const pg = el('g', { 'data-drag': can && (step === 'force' || step === 'magnet') ? 'battery' : null }, rig);
  el('rect', { x: bx - 116, y: by - 20, width: 232, height: 40, fill: 'transparent' }, pg);
  cell(el, txt, pg, bx - 54, by, flip);
  if (cells === 2) cell(el, txt, pg, bx + 54, by, flip); else el('rect', { x: bx + 10, y: by - 4, width: 90, height: 8, rx: 4, fill: '#8A93A3' }, pg);
  txt(rig, bx, by + 44, `${cells} 顆電池（${BAT[s.battery]}）`, { 'font-size': 13 });
  if (can && (step === 'force' || step === 'magnet')) drag(pg, () => ({ move() {}, end() { set({ battery: flip ? 'fwd' : 'rev' }); }, cancel() {} }), { label: '把電池反過來接', tap: () => set({ battery: flip ? 'fwd' : 'rev' }) });
  if (step === 'speed') {
    if (cells === 1) { el('rect', { x: 680, y: 452, width: 120, height: 52, rx: 10, fill: 'rgba(255,255,255,.7)', stroke: '#8792A6', 'stroke-dasharray': '5 4' }, rig); txt(rig, 740, 522, '備用電池', { 'font-size': 12, fill: '#5A6478' }); }
    const sg = el('g', { 'data-drag': can ? 'cell' : null }, rig), sm = el('g', {}, sg), sx = cells === 2 ? bx + 54 : 740, sy = by;
    if (cells === 1) cell(el, txt, sm, sx, sy, flip);
    el('rect', { x: sx - 46, y: sy - 17, width: 92, height: 34, fill: 'transparent' }, sm);
    if (can) drag(sg, p0 => { let q = p0; return { move(p) { q = p; sm.setAttribute('transform', `translate(${n1(p.x - p0.x)} ${n1(p.y - p0.y)})`); },
      end() { const v = Math.abs(q.x - (bx + 54)) < 70 && Math.abs(q.y - by) < 34 ? 2 : 1; if (v !== cells) set({ cells: v }); else sm.removeAttribute('transform'); }, cancel() { sm.removeAttribute('transform'); } }; },
      { label: cells === 2 ? '拿掉一顆電池' : '再放一顆電池', tap: () => set({ cells: cells === 2 ? 1 : 2 }) });
  }
  // 結果
  el('rect', { x: 140, y: 440, width: 200, height: 92, rx: 14, fill: 'rgba(255,253,246,.96)', stroke: '#23304A', 'stroke-width': 2 }, rig);
  txt(rig, 240, 464, `${s.commutator ? '有換向器' : '沒有換向器'}・${POS[s.pos]}`, { 'font-size': 13.5 });
  txt(rig, 240, 490, `這一刻：${DIR(r.torque)}`, { 'font-size': 13.5, fill: '#2E8B66' });
  txt(rig, 240, 516, r.keeps ? (s.commutator ? r.spin.replace('連續轉動', '一直轉') : '和一開始同方向') : '和一開始相反，被拉回', { 'font-size': 13.5, fill: r.keeps ? '#2E8B66' : '#C8372D' });
  hint(500, 570, { force: '點電池座，把電池反接', magnet: '點磁鐵左右對調；點電池座反接', commutator: '轉動線圈半圈；點中間的換向器拿掉或裝上', speed: '把備用電池拖進電池座' }[step] || '');
}

const tgt = (sig, label, set, aim, body) => ({ sig, label, set, aim, title: s => `電池${BAT[s.battery]}、磁鐵${MAG[s.magnet]}、${s.commutator ? '有' : '沒有'}換向器、${POS[s.pos]}`, body: body || ((s, r) => `左邊導線受力${UP(r.leftForce)}、右邊${UP(r.rightForce)}，${DIR(r.torque)}`) });
const batCtl = { key: 'battery', label: '電池接法', type: 'seg', options: Object.entries(BAT) }, magCtl = { key: 'magnet', label: '磁鐵', type: 'seg', options: Object.entries(MAG) };
const base = { magnet: 'NS', commutator: true, pos: 'start', cells: 1 };

runDesk({
  key: 'bhcs.lab.motor.v1', title: '直流馬達實驗桌', background: 'bg-electric-bench',
  sceneLabel: '直流馬達實驗桌：從正前方看，左右兩塊磁鐵之間有線圈的兩條導線，紅色箭頭是導線受到的力',
  initial: { battery: 'fwd', ...base },
  model: motor, scene, viewBox: { desk: '120 110 760 480', phone: '120 110 760 480' }, phoneText: 1.4,
  readouts: (s, r) => [['左邊導線受力', UP(r.leftForce), '', `電流${r.leftCurrent > 0 ? '流出' : '流入'}紙面`], ['這一刻的轉向', DIR(r.torque), '', POS[s.pos]], ['轉得起來嗎', s.commutator ? '連續轉動' : '會停住', '', s.commutator ? '有換向器' : '沒有換向器']],
  why: { title: '馬達為什麼會轉', button: '馬達的原理', html: `
    <p class="fn-tip"><b>通電的導線在磁場中會受力。</b>力的方向和電流方向、磁場方向都垂直；電流或磁場其中一個反過來，力就反過來。</p>
    <p class="fn-tip"><b>線圈兩邊的電流方向相反，</b>所以一邊受力向上、另一邊向下，線圈就轉起來。</p>
    <p class="fn-tip"><b>換向器：</b>線圈每轉半圈，換向器就把線圈裡的電流方向對調一次。這樣不管轉到哪裡，左邊那條導線的受力方向都一樣，線圈才能一直往同一個方向轉。</p>
    <p class="fn-tip"><b>電流越大、磁場越強，</b>導線受的力越大，馬達轉得越快。馬達把電能轉換成動能。</p>
    <p class="fn-tip">圖中 ⊙ 表示電流朝你流出來，⊗ 表示電流流進去。</p>` },
  steps: [
    { id: 'force', label: '電流方向', title: '電池反接，馬達會怎樣？', goal: '比較電池正接和反接，看兩條導線的受力方向，各收一張。',
      intro: '紅色箭頭是導線受的力。把電池反過來接。', enter: { battery: 'fwd', ...base }, controls: [batCtl],
      react: (s, r) => `左邊${UP(r.leftForce)}、右邊${UP(r.rightForce)}，${DIR(r.torque)}。`,
      targets: ['fwd', 'rev'].map(b => tgt(b, `電池${BAT[b]}`, { battery: b, ...base }, `看電池${BAT[b]}。`)),
      found: ['電流方向反過來，兩條導線的受力都反過來，馬達反轉。', '電流反向 → 受力反向 → 轉向相反'] },
    { id: 'magnet', label: '磁場方向', title: '磁鐵對調呢？兩個都反過來呢？', goal: '收下兩張：只把磁鐵對調；磁鐵對調而且電池反接。',
      intro: '把左右磁極對調，看受力方向。', enter: { battery: 'fwd', ...base }, controls: [batCtl, magCtl],
      react: (s, r) => `${DIR(r.torque)}。`,
      targets: [tgt('m', '只對調磁鐵', { battery: 'fwd', magnet: 'SN', commutator: true, pos: 'start', cells: 1 }, '電池正接、磁鐵換成左 S 右 N。'), tgt('both', '磁鐵對調＋電池反接', { battery: 'rev', magnet: 'SN', commutator: true, pos: 'start', cells: 1 }, '磁鐵左 S 右 N，電池也反接。')],
      found: ['磁場反過來，馬達也反轉；電流和磁場都反過來，轉向又和原來一樣。', '只改一個 → 反轉；兩個都改 → 不變'] },
    { id: 'commutator', label: '換向器', title: '沒有換向器，為什麼轉不起來？', goal: '線圈轉過半圈後，比較沒有換向器和有換向器，各收一張。',
      intro: '線圈轉了半圈，甲導線跑到右邊了。現在受力方向對嗎？', enter: { battery: 'fwd', magnet: 'NS', commutator: false, pos: 'half', cells: 1 },
      controls: [{ key: 'commutator', label: '換向器', type: 'seg', options: [[false, '沒有'], [true, '有']] }, { key: 'pos', label: '線圈位置', type: 'seg', options: Object.entries(POS) }],
      react: (s, r) => r.keeps ? '轉向和一開始相同。' : '轉向和一開始相反，線圈會被拉回去。',
      targets: [tgt('no', '沒有換向器、轉過半圈', { battery: 'fwd', magnet: 'NS', commutator: false, pos: 'half', cells: 1 }, '換向器選沒有、位置選轉過半圈。', (s, r) => `甲導線帶著原來的電流方向到了右邊，轉向變成${DIR(r.torque)}，和一開始相反`), tgt('yes', '有換向器、轉過半圈', { battery: 'fwd', magnet: 'NS', commutator: true, pos: 'half', cells: 1 }, '換向器選有、位置選轉過半圈。', (s, r) => `換向器把線圈裡的電流對調，轉向仍是${DIR(r.torque)}，可以連續轉動`)],
      found: ['沒有換向器時，轉過半圈後力矩反向，線圈被拉回去；換向器每半圈把電流對調，才能一直同方向轉。', '換向器：每轉半圈，線圈電流反向一次'] },
    { id: 'speed', label: '轉速', title: '怎樣讓馬達轉快一點？', goal: '比較 1 顆和 2 顆電池，看受力箭頭的長短，各收一張。',
      intro: '多加一顆電池，電流變大。受力呢？', enter: { battery: 'fwd', ...base }, controls: [{ key: 'cells', label: '電池', type: 'seg', options: [[1, '1 顆'], [2, '2 顆']] }],
      react: s => `電池 ${s.cells} 顆，受力是 ${s.cells} 倍。`,
      targets: [1, 2].map(c => tgt('c' + c, `${c} 顆電池`, { battery: 'fwd', magnet: 'NS', commutator: true, pos: 'start', cells: c }, `看 ${c} 顆電池。`, s => `電流是 ${s.cells} 倍，導線受力也是 ${s.cells} 倍，${s.cells === 2 ? '轉得比較快' : '轉得比較慢'}`)),
      found: ['電流越大，導線受力越大，馬達轉得越快。換更強的磁鐵或增加線圈匝數也可以。', '電流大、磁場強、匝數多 → 轉得快'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想紅色箭頭的方向。',
      found: ['你把直流馬達弄懂了！', '通電導線在磁場中受力；換向器讓它一直轉'] }
  ],
  quiz: [
    { q: '想讓玩具車的馬達反轉，可以怎麼做？', options: [
      { text: '把電池反過來接。', ok: true },
      { text: '同時把電池反接、磁鐵也對調。', why: '兩個都反過來，受力方向又變回原來的樣子，轉向不變。' },
      { text: '多加一顆電池。', why: '多加電池只會轉得更快，不會改變方向。' }] },
    { q: '直流馬達裡換向器的作用是？', options: [
      { text: '讓馬達轉得更快。', why: '轉速主要看電流和磁場的強弱。換向器是讓它能持續轉。' },
      { text: '每轉半圈把線圈的電流方向對調，讓線圈一直往同一個方向轉。', ok: true },
      { text: '把電能儲存起來。', why: '換向器不儲存能量，它只是改變電流流進線圈的方向。' }] },
    { q: '馬達運轉時，主要的能量轉換是？', options: [
      { text: '動能 → 電能。', why: '那是發電機。馬達是用電讓東西轉動。' },
      { text: '電能 → 動能。', ok: true },
      { text: '化學能 → 光能。', why: '馬達用電能產生轉動（動能）。' }] }
  ],
  finish: { title: '你把直流馬達弄懂了！', rule: '通電導線在磁場中受力，電流或磁場反向，受力就反向。線圈兩邊受力相反所以轉動；換向器每半圈把電流對調，讓馬達持續同方向轉。電流越大、磁場越強，轉得越快。', next: { label: '去電磁實驗桌', href: '../electromagnetism/' } }
});
