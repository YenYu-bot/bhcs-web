// 板塊與地震實驗桌：到達時間與測站距離來自 ./model.mjs（P 波 6 km/s、S 波 3 km/s 的簡化值）。
import { quake, BOUNDARY, EPIC, STATIONS, VP, VS } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const f = x => String(Math.round(x * 10) / 10);
const arrow = (el, rig, x, y, dx, dy = 0) => { el('path', { d: `M${x} ${y} l${dx} ${dy}`, stroke: '#C8372D', 'stroke-width': 7, 'stroke-linecap': 'round' }, rig); const a = Math.atan2(dy, dx), X = x + dx, Y = y + dy; el('path', { d: `M${X + 14 * Math.cos(a)} ${Y + 14 * Math.sin(a)} L${X + 12 * Math.cos(a + 2.2)} ${Y + 12 * Math.sin(a + 2.2)} L${X + 12 * Math.cos(a - 2.2)} ${Y + 12 * Math.sin(a - 2.2)}z`, fill: '#C8372D' }, rig); };
const star = (el, rig, x, y, r = 9) => el('circle', { cx: x, cy: y, r, fill: '#F4C04E', stroke: '#C8372D', 'stroke-width': 3 }, rig);
function scene({ rig, el, txt, s, r, step }) {
  if (step === 'boundary') {
    const B = r.B; txt(rig, 500, 96, `${B.name}：${B.move}`, { 'font-size': 20 });
    el('rect', { x: 130, y: 330, width: 740, height: 150, fill: '#E8A15C', opacity: .55 }, rig); txt(rig, 190, 462, '地函', { 'font-size': 14, fill: '#7A4A1E' });
    if (s.boundary === 'divergent') {
      el('rect', { x: 130, y: 250, width: 330, height: 80, fill: '#8C99AD', stroke: '#23304A', 'stroke-width': 3 }, rig); el('rect', { x: 540, y: 250, width: 330, height: 80, fill: '#8C99AD', stroke: '#23304A', 'stroke-width': 3 }, rig);
      el('path', { d: 'M460 330 L500 226 L540 330z', fill: '#E4573F', stroke: '#23304A', 'stroke-width': 3 }, rig); txt(rig, 500, 206, '岩漿湧出，形成新地殼', { 'font-size': 14 });
      arrow(el, rig, 330, 220, -90); arrow(el, rig, 670, 220, 90); for (const x of [450, 500, 550]) star(el, rig, x, 300);
    } else if (s.boundary === 'convergent') {
      el('path', { d: 'M130 250 H470 L640 470 H560 L420 330 H130z', fill: '#6F7D94', stroke: '#23304A', 'stroke-width': 3 }, rig); el('rect', { x: 470, y: 230, width: 400, height: 100, fill: '#B9A27A', stroke: '#23304A', 'stroke-width': 3 }, rig);
      el('path', { d: 'M640 230 L680 160 L720 230z', fill: '#7A5A3A', stroke: '#23304A', 'stroke-width': 3 }, rig); el('path', { d: 'M672 164 q8 -26 8 -40', stroke: '#E4573F', 'stroke-width': 5, fill: 'none' }, rig); txt(rig, 770, 196, '火山', { 'font-size': 14 }); txt(rig, 470, 216, '海溝', { 'font-size': 14 });
      arrow(el, rig, 220, 220, 100); arrow(el, rig, 830, 206, -80); [[480, 290], [520, 345], [560, 400], [600, 450]].forEach(([x, y]) => star(el, rig, x, y)); txt(rig, 720, 420, '震源沿著下沉的板塊越來越深', { 'font-size': 14 });
    } else {
      el('rect', { x: 130, y: 180, width: 740, height: 110, fill: '#8C99AD', stroke: '#23304A', 'stroke-width': 3 }, rig); el('rect', { x: 130, y: 290, width: 740, height: 110, fill: '#A7B2C2', stroke: '#23304A', 'stroke-width': 3 }, rig);
      el('path', { d: 'M130 290 H870', stroke: '#C8372D', 'stroke-width': 5, 'stroke-dasharray': '14 8' }, rig); txt(rig, 500, 166, '從上往下看', { 'font-size': 14, fill: '#5A6478' });
      arrow(el, rig, 380, 236, 140); arrow(el, rig, 620, 346, -140); for (const x of [330, 500, 670]) star(el, rig, x, 290);
      txt(rig, 500, 430, '板塊沒有增加也沒有消失，沿著斷層錯動', { 'font-size': 14 });
    }
    txt(rig, 500, 520, `常見地形：${B.feature}　地震：${B.depth}　黃點是震源`, { 'font-size': 15 });
  } else if (step === 'locate') {
    const O = [200, 70], S = 1, p = q => [O[0] + q[0] * S, O[1] + q[1] * S];
    el('rect', { x: 180, y: 60, width: 640, height: 480, rx: 14, fill: '#DCEBD4', stroke: '#23304A', 'stroke-width': 3 }, rig);
    const cp = el('clipPath', { id: 'eq-map' }, el('defs', {}, rig)); el('rect', { x: 182, y: 62, width: 636, height: 476, rx: 12 }, cp); const map = el('g', { 'clip-path': 'url(#eq-map)' }, rig);
    STATIONS.forEach(([name, q], i) => { const [x, y] = p(q), on = i < s.stations;
      if (on) el('circle', { cx: x, cy: y, r: r.radii[i] * S, fill: 'none', stroke: ['#C8372D', '#2F6FB0', '#7A4BB5'][i], 'stroke-width': 3.5 }, map);
      el('path', { d: `M${x} ${y - 12} l11 20 h-22z`, fill: on ? '#23304A' : '#A9B2BF' }, rig); txt(rig, x, y + 30, `${name}站${on ? ` ${Math.round(r.radii[i])} km` : ''}`, { 'font-size': 14, fill: on ? '#23304A' : '#8A93A3' }); });
    const E = p(EPIC), M = p(r.mirror);
    if (s.stations >= 2) { star(el, rig, E[0], E[1], 10); if (s.stations === 2) star(el, rig, M[0], M[1], 10); }
    txt(rig, 500, 574, s.stations === 1 ? '只有一個測站：震央可能在圓上任何一點' : s.stations === 2 ? '兩個測站：兩個圓有兩個交點，還分不出是哪一個' : '三個測站：三個圓只交在一點，那就是震央', { 'font-size': 16 });
  } else {
    // 震波圖
    const X0 = 190, X1 = 860, Y = 290, T = 70, tx = t => X0 + (X1 - X0) * t / T;
    el('rect', { x: 150, y: 120, width: 760, height: 330, rx: 16, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 3 }, rig);
    txt(rig, 530, 154, `測站離震央 ${s.dist} km 的震波紀錄`, { 'font-size': 17 });
    let d = `M${X0} ${Y}`; for (let t = 0; t <= T; t += .25) { const a = t < r.tp ? 2 : t < r.ts ? 16 * Math.exp(-(t - r.tp) / 14) + 5 : 62 * Math.exp(-(t - r.ts) / 16) + 6; d += `L${tx(t).toFixed(1)} ${(Y + a * Math.sin(t * 5.3) * (t < r.tp ? Math.sin(t * 17) : 1)).toFixed(1)}`; }
    el('path', { d, fill: 'none', stroke: '#23304A', 'stroke-width': 2.2 }, rig);
    const mark = (t, name, col) => { el('path', { d: `M${tx(t)} ${Y - 90} V${Y + 90}`, stroke: col, 'stroke-width': 3, 'stroke-dasharray': '7 6' }, rig); txt(rig, tx(t), Y - 100, `${name} ${f(t)} 秒`, { 'font-size': 15, fill: col }); };
    mark(r.tp, 'P 波', '#2F6FB0'); mark(r.ts, 'S 波', '#C8372D');
    el('path', { d: `M${tx(r.tp)} ${Y + 104} H${tx(r.ts)}`, stroke: '#2E8B66', 'stroke-width': 5 }, rig); txt(rig, (tx(r.tp) + tx(r.ts)) / 2, Y + 130, `相差 ${f(r.lag)} 秒`, { 'font-size': 16, fill: '#2E8B66' });
    for (let t = 0; t <= T; t += 10) txt(rig, tx(t), 436, `${t}`, { 'font-size': 12, fill: '#5A6478' }); txt(rig, 884, 436, '秒', { 'font-size': 12, fill: '#5A6478' });
  }
}

const tgt = (sig, label, set, aim, title, body) => ({ sig, label, set, aim, title, body });

runDesk({
  key: 'bhcs.lab.earthquake.v1', title: '板塊與地震實驗桌',
  sceneLabel: '板塊與地震實驗桌：依任務顯示板塊邊界的剖面、測站的震波紀錄，或用三個測站的圓找震央的地圖',
  initial: { boundary: 'divergent', dist: 60, stations: 1 },
  model: quake, scene, viewBox: s => s === 'locate' ? { desk: '150 -30 700 630', phone: '150 30 700 570' } : s === 'wave' ? { desk: '130 100 800 370', phone: '130 100 800 370' } : { desk: '100 70 800 470', phone: '100 70 800 470' }, phoneText: 1.4,
  readouts: (s, r) => [['P 波到達', f(r.tp), '秒', `${s.dist} km ÷ ${VP}`], ['S 波到達', f(r.ts), '秒', `${s.dist} km ÷ ${VS}`], ['P、S 時間差', f(r.lag), '秒', '越遠差越多']],
  why: { title: '板塊與地震', button: '板塊與震波', html: `
    <p class="fn-tip"><b>板塊邊界有三種：</b>張裂（分離）、聚合（推擠）、錯動（水平錯開）。地震和火山大多發生在板塊邊界。台灣位在聚合性邊界。</p>
    <p class="fn-tip"><b>P 波跑得快、先到；S 波比較慢、後到，</b>但搖晃通常比較大。離震央越遠，兩種波到達的時間差越大，所以可以用時間差推算距離。</p>
    <p class="fn-tip"><b>找震央：</b>一個測站只知道「離多遠」，要三個測站各畫一個圓，交在一起的那一點才是震央。</p>
    <p class="fn-tip">這裡的波速用簡化的整數（P 波 ${VP} km/s、S 波 ${VS} km/s），真實的波速會隨地層改變。</p>` },
  steps: [
    { id: 'boundary', label: '板塊邊界', title: '三種板塊邊界，地震有什麼不同？', goal: '切換三種邊界，看板塊怎麼動、震源（黃點）有多深，三種都收下。',
      intro: '紅色箭頭是板塊移動的方向。', enter: { boundary: 'divergent' }, controls: [{ key: 'boundary', label: '邊界類型', type: 'seg', options: Object.entries(BOUNDARY).map(([k, B]) => [k, B.name.replace('邊界', '')]) }],
      react: (s, r) => `${r.B.move}，${r.B.depth}。`,
      targets: Object.keys(BOUNDARY).map(k => tgt(k, BOUNDARY[k].name, { boundary: k }, `看${BOUNDARY[k].name}。`, s => BOUNDARY[s.boundary].name, (s, r) => `${r.B.move}；${r.B.feature}；${r.B.depth}`)),
      found: ['張裂和錯動邊界多是淺源地震；聚合邊界的震源沿著下沉的板塊由淺到深。', '聚合邊界才有深源地震'] },
    { id: 'wave', label: 'P 波與 S 波', title: '離震央越遠，P、S 波差多久？', goal: '比較離震央 60 km 和 120 km 的測站，各收一張。',
      intro: '看兩條虛線：藍色是 P 波到達，紅色是 S 波到達。', enter: { dist: 60 }, controls: [{ key: 'dist', label: '測站離震央', type: 'seg', options: [60, 120, 180].map(d => [d, `${d} km`]) }],
      react: (s, r) => `P 波 ${f(r.tp)} 秒、S 波 ${f(r.ts)} 秒，相差 ${f(r.lag)} 秒。`,
      targets: [60, 120].map(d => tgt('d' + d, `${d} km`, { dist: d }, `試 ${d} km。`, s => `離震央 ${s.dist} km`, (s, r) => `P 波 ${f(r.tp)} 秒到、S 波 ${f(r.ts)} 秒到，相差 ${f(r.lag)} 秒`)),
      found: ['距離加倍，P、S 波的時間差也加倍；所以從時間差可以反推距離。', '60 km 差 10 秒；120 km 差 20 秒'] },
    { id: 'locate', label: '找震央', title: '要幾個測站才能找到震央？', goal: '每個測站用距離畫一個圓。收下 2 個測站和 3 個測站的結果。',
      intro: '一個測站只知道震央離它多遠。再加一個測站看看。', enter: { stations: 1 }, controls: [{ key: 'stations', label: '用幾個測站', type: 'seg', options: [[1, '1 個'], [2, '2 個'], [3, '3 個']] }],
      react: (s, r) => `震央可能在：${r.possible}。`,
      targets: [2, 3].map(n => tgt('s' + n, `${n} 個測站`, { stations: n }, `用 ${n} 個測站。`, s => `用 ${s.stations} 個測站`, (s, r) => `震央的位置：${r.possible}`)),
      found: ['兩個圓有兩個交點，第三個圓才能決定是哪一點。', '至少要三個測站'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：震波走多久', goal: 'P 波 6 km/s、S 波 3 km/s（簡化值）。', intro: '時間 ＝ 距離 ÷ 速率。', head: '時間 ＝ 距離 ÷ 波速',
      rows: [
        { id: 'p', name: '離震央 90 km，P 波幾秒到', eq: '90 ÷ 6', answer: 15, unit: '秒' },
        { id: 's', name: '離震央 90 km，S 波幾秒到', eq: '90 ÷ 3', answer: 30, unit: '秒' },
        { id: 'd', name: 'P、S 波相差 30 秒，測站離震央多遠', eq: '每 60 km 差 10 秒', answer: 180, unit: 'km', hint: v => v === 90 ? '90 km 只差 15 秒。差 30 秒要兩倍遠。' : '' }],
      found: ['算對了！', '時間差和距離成正比'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想震波圖和那三個圓。',
      found: ['你把板塊與地震弄懂了！', '邊界決定地震型態；P、S 時間差決定距離'] }
  ],
  quiz: [
    { q: '地震時先感覺到上下小晃動，過幾秒才大搖晃，這是因為？', options: [
      { text: '發生了兩次地震。', why: '是同一次地震的兩種波。P 波比較快、先到；S 波比較慢、後到，搖晃通常比較大。' },
      { text: 'P 波先到，S 波後到。', ok: true },
      { text: 'S 波先到，P 波後到。', why: '順序反了。你的證據：60 km 處 P 波 10 秒到、S 波 20 秒到。' }] },
    { q: '甲測站 P、S 波相差 10 秒，乙測站相差 30 秒，哪一站離震央比較遠？', options: [
      { text: '甲站。', why: '時間差越大表示越遠。' },
      { text: '乙站。', ok: true },
      { text: '一樣遠。', why: '時間差和距離成正比，相差越久離得越遠。' }] },
    { q: '為什麼只用兩個測站還不能確定震央？', options: [
      { text: '因為兩個圓會有兩個交點。', ok: true },
      { text: '因為兩個測站的儀器不夠準。', why: '和儀器準不準無關。兩個圓相交有兩個點，需要第三個圓來決定。' },
      { text: '因為震波只會往一個方向傳。', why: '震波會向四面八方傳出去，所以每個測站才只能知道「距離」，不知道方向。' }] }
  ],
  finish: { title: '你把板塊與地震弄懂了！', rule: '板塊邊界有張裂、聚合、錯動三種，聚合邊界才有深源地震。P 波比 S 波先到，時間差越大離震央越遠；用三個測站的距離畫圓，交點就是震央。', next: { label: '回自然實驗總覽', href: '../../science/' } }
});
