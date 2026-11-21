// 直流馬達實驗桌：導線受力與轉向來自 ./model.mjs。
import { motor } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const DIR = v => v > 0 ? '順時針' : '逆時針', UP = v => v > 0 ? '向上' : '向下', CUR = v => v > 0 ? '流出紙面 ⊙' : '流入紙面 ⊗';
const BAT = { fwd: '正接', rev: '反接' }, MAG = { NS: '左 N 右 S', SN: '左 S 右 N' }, POS = { start: '開始', half: '轉過半圈' };
function scene({ rig, el, txt, s, r }) {
  const CY = 280, LX = 400, RX = 600;
  const pole = (x, n) => { el('rect', { x, y: CY - 110, width: 110, height: 220, rx: 10, fill: n ? '#E4573F' : '#3F6FD6', stroke: '#23304A', 'stroke-width': 3 }, rig); txt(rig, x + 55, CY + 14, n ? 'N' : 'S', { 'font-size': 40, fill: '#fff' }); };
  pole(150, s.magnet === 'NS'); pole(740, s.magnet !== 'NS');
  const fd = s.magnet === 'NS' ? 1 : -1;
  for (const y of [CY - 70, CY, CY + 70]) { el('path', { d: `M280 ${y} H720`, stroke: '#B8C4D6', 'stroke-width': 2.5, 'stroke-dasharray': '10 8' }, rig); const x = fd > 0 ? 706 : 294; el('path', { d: `M${x + fd * 14} ${y} l${-fd * 14} -8 v16z`, fill: '#8A93A3' }, rig); }
  txt(rig, 500, CY - 124, '磁場方向（N → S）', { 'font-size': 13, fill: '#5A6478' });
  el('path', { d: `M${LX} ${CY} H${RX}`, stroke: '#B98A52', 'stroke-width': 8, 'stroke-linecap': 'round' }, rig);
  el('circle', { cx: 500, cy: CY, r: 9, fill: '#23304A' }, rig);
  const wire = (x, cur, name, force) => {
    el('circle', { cx: x, cy: CY, r: 26, fill: '#F2C879', stroke: '#23304A', 'stroke-width': 3 }, rig);
    if (cur > 0) el('circle', { cx: x, cy: CY, r: 7, fill: '#23304A' }, rig); else el('path', { d: `M${x - 12} ${CY - 12} L${x + 12} ${CY + 12} M${x + 12} ${CY - 12} L${x - 12} ${CY + 12}`, stroke: '#23304A', 'stroke-width': 4 }, rig);
    const len = 46 + 30 * s.cells, y2 = CY - force * (30 + len);
    el('path', { d: `M${x} ${CY - force * 32} V${y2 + force * 12}`, stroke: '#C8372D', 'stroke-width': 8, 'stroke-linecap': 'round' }, rig); el('path', { d: `M${x} ${y2} l-11 ${force * 18} h22z`, fill: '#C8372D' }, rig);
    txt(rig, x, CY + (force > 0 ? 62 : -46), `${name}導線`, { 'font-size': 14 }); txt(rig, x + (x < 500 ? -64 : 64), y2 + force * 30, `受力${UP(force)}`, { 'font-size': 14, fill: '#C8372D' });
  };
  const aLeft = r.wireA === 'left';
  wire(LX, r.leftCurrent, aLeft ? '甲' : '乙', r.leftForce); wire(RX, -r.leftCurrent, aLeft ? '乙' : '甲', r.rightForce);
  el('rect', { x: 240, y: 452, width: 520, height: 96, rx: 14, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, 500, 482, `${s.commutator ? '有換向器' : '沒有換向器'}・${POS[s.pos]}：這一刻的轉向是${DIR(r.torque)}`, { 'font-size': 16 });
  txt(rig, 500, 512, r.keeps ? (s.commutator ? `結果：${r.spin}` : '和一開始同方向') : '和一開始相反 → 線圈被拉回去', { 'font-size': 16, fill: r.keeps ? '#2E8B66' : '#C8372D' });
  txt(rig, 500, 538, `電池 ${s.cells} 顆（${BAT[s.battery]}）　甲導線的電流：${CUR(r.currentA)}`, { 'font-size': 13, fill: '#5A6478' });
}

const tgt = (sig, label, set, aim, body) => ({ sig, label, set, aim, title: s => `電池${BAT[s.battery]}、磁鐵${MAG[s.magnet]}、${s.commutator ? '有' : '沒有'}換向器、${POS[s.pos]}`, body: body || ((s, r) => `左邊導線受力${UP(r.leftForce)}、右邊${UP(r.rightForce)}，${DIR(r.torque)}`) });
const batCtl = { key: 'battery', label: '電池接法', type: 'seg', options: Object.entries(BAT) }, magCtl = { key: 'magnet', label: '磁鐵', type: 'seg', options: Object.entries(MAG) };
const base = { magnet: 'NS', commutator: true, pos: 'start', cells: 1 };

runDesk({
  key: 'bhcs.lab.motor.v1', title: '直流馬達實驗桌', background: 'bg-electric-bench',
  sceneLabel: '直流馬達實驗桌：從正前方看，左右兩塊磁鐵之間有線圈的兩條導線，紅色箭頭是導線受到的力',
  initial: { battery: 'fwd', ...base },
  model: motor, scene, viewBox: { desk: '120 100 760 470', phone: '120 100 760 470' }, phoneText: 1.4,
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
