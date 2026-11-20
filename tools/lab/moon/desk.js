// 月相與日月食實驗桌：亮面比例、月球黃緯、日月食判斷全部來自 scripts/science/models.mjs 的 calculate('moon-eclipse')。
// 「日食／月食」只表示符合本頁簡化門檻的候選位置，不是預報。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('moon-eclipse', { phase: s.phase, node: s.node, inclination: 5 });
const NAME = { 0: '新月（朔）', 45: '眉月', 90: '上弦月', 135: '盈凸月', 180: '滿月（望）', 225: '虧凸月', 270: '下弦月', 315: '殘月' };
const KIND = { solar: '日食候選', lunar: '月食候選', none: '不會發生' };

// 從北半球看到的月亮：盈（0°～180°）右邊亮，虧左邊亮
function moonFace(el, g, cx, cy, R, phase) {
  const p = phase * Math.PI / 180, lit = '#FFF3C4', dark = '#3B4256', waxing = phase > 0 && phase < 180;
  el('circle', { cx, cy, r: R, fill: dark, stroke: '#23304A', 'stroke-width': 3 }, g);
  if (phase === 0) return;
  if (phase === 180) { el('circle', { cx, cy, r: R, fill: lit, stroke: '#23304A', 'stroke-width': 3 }, g); return; }
  const sweep = waxing ? 1 : 0;
  el('path', { d: `M${cx} ${cy - R} A${R} ${R} 0 0 ${sweep} ${cx} ${cy + R} Z`, fill: lit }, g);
  const rx = Math.abs(Math.cos(p)) * R, gibbous = Math.cos(p) < 0;
  el('ellipse', { cx, cy, rx, ry: R, fill: gibbous ? lit : dark }, g);
  el('circle', { cx, cy, r: R, fill: 'none', stroke: '#23304A', 'stroke-width': 3 }, g);
}

function scene({ rig, el, txt, P, s, r, step }) {
  // 俯視圖：太陽在左，地球在中，月球逆時針繞行
  const ex = 360, ey = 320, R = 170, p = s.phase * Math.PI / 180, mx = ex - R * Math.cos(p), my = ey + R * Math.sin(p);
  el('rect', { x: 60, y: 120, width: 600, height: 400, rx: 20, fill: 'rgba(20,28,48,.92)' }, rig);
  el('image', { href: P + 'prop-sun.webp', x: 30, y: 270, width: 100, height: 99 }, rig);
  for (let i = 0; i < 5; i++) el('line', { x1: 130, y1: 200 + i * 60, x2: 170, y2: 200 + i * 60, stroke: '#F4C04E', 'stroke-width': 3, 'marker-end': 'url(#mo-a)' }, rig);
  const d = el('defs', {}, rig), mk = el('marker', { id: 'mo-a', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#F4C04E' }, mk);
  txt(rig, 80, 400, '陽光', { 'font-size': 15, fill: '#F4C04E' });
  el('circle', { cx: ex, cy: ey, r: R, fill: 'none', stroke: '#8FA3C4', 'stroke-width': 2, 'stroke-dasharray': '6 6' }, rig);
  el('image', { href: P + 'prop-earth-globe.webp', x: ex - 36, y: ey - 36, width: 72, height: 72 }, rig);
  // 月球（朝太陽那半邊亮）
  el('circle', { cx: mx, cy: my, r: 22, fill: '#3B4256', stroke: '#fff', 'stroke-width': 2 }, rig);
  el('path', { d: `M${mx} ${my - 22} A22 22 0 0 0 ${mx} ${my + 22} Z`, fill: '#FFF3C4' }, rig);
  txt(rig, mx, my + (Math.sin(p) >= 0 ? 46 : -32), NAME[s.phase] || `${s.phase}°`, { 'font-size': 14, fill: '#fff' });
  txt(rig, 360, 150, '從北極上方往下看（逆時針繞地球）', { 'font-size': 14, fill: '#C9D4E6' });
  // 右：地球上看到的月相，日月食
  el('rect', { x: 690, y: 120, width: 250, height: 400, rx: 20, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, 815, 154, '在地球上看到', { 'font-size': 16 });
  moonFace(el, rig, 815, 250, 70, s.phase);
  txt(rig, 815, 352, NAME[s.phase] || '', { 'font-size': 20 });
  txt(rig, 815, 382, `亮面 ${Math.round(r.lit * 100)}%`, { 'font-size': 16, fill: '#5A6478' });
  if (step !== 'phase') {
    // 側視：月球在黃道面上方或下方
    el('line', { x1: 710, y1: 450, x2: 920, y2: 450, stroke: '#E0A21B', 'stroke-width': 2 }, rig);
    txt(rig, 714, 440, '黃道面', { 'font-size': 12, fill: '#E0A21B', 'text-anchor': 'start' });
    el('circle', { cx: 815, cy: 450 - r.latitude * 10, r: 9, fill: '#8FA3C4' }, rig);
    txt(rig, 815, 498, `月球偏離 ${Math.abs(Math.round(r.latitude * 10) / 10)}°：${KIND[r.kind]}`, { 'font-size': 14, fill: r.kind === 'none' ? '#5A6478' : '#C8372D' });
  }
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: s => sig.startsWith('e') ? `${NAME[s.phase]}・交點${s.node === 0 ? '對準太陽' : '偏開 90°'}` : NAME[s.phase],
  body: (s, r) => sig.startsWith('e') ? `月球偏離黃道面 ${Math.abs(Math.round(r.latitude * 10) / 10)}°：${KIND[r.kind]}` : `亮面 ${Math.round(r.lit * 100)}%` });

runDesk({
  key: 'bhcs.lab.moon.v1', title: '月相與日月食實驗桌', background: 'bg-physics-bench',
  sceneLabel: '月相與日月食實驗桌：左邊從北極上方俯視太陽、地球與繞行的月球；右邊是在地球上看到的月相，以及月球偏離黃道面的角度',
  initial: { phase: 90, node: 90 },
  model, scene, viewBox: { desk: '20 110 930 420', phone: '20 110 930 420' }, phoneText: 1.4,
  readouts: (s, r) => [['月相', (NAME[s.phase] || '').replace(/（.*）/, ''), '', `相位角 ${s.phase}°`], ['亮面', Math.round(r.lit * 100), '%', '從地球看到'], ['日月食', KIND[r.kind], '', `偏離黃道 ${Math.abs(Math.round(r.latitude * 10) / 10)}°`]],
  why: { title: '月相與日月食', button: '月亮怎麼變', html: `
    <p class="fn-tip"><b>月亮本身不發光，</b>朝向太陽的那一半永遠是亮的。月相是我們從地球看到「亮的那半邊」有多少。</p>
    <p class="fn-tip"><b>順序：</b>新月 → 眉月 → 上弦月（右半亮）→ 盈凸月 → 滿月 → 虧凸月 → 下弦月（左半亮）→ 殘月，約 29.5 天一輪。月相不是地球的影子造成的。</p>
    <p class="fn-tip"><b>日食與月食：</b>日食發生在新月、月食發生在滿月，而且月球要剛好在黃道面附近（交點附近）。月球軌道和黃道面差約 5°，所以不是每個月都有日月食。</p>
    <p class="fn-tip">模型說明：月相以北半球看到的樣子畫；日月食是簡化的候選判斷，不是預報。觀察日食一定要用安全的濾鏡，絕對不能直接看太陽。</p>` },
  steps: [
    { id: 'phase', label: '月相', title: '月亮繞地球，看起來怎麼變？', goal: '讓月球走到新月、上弦、滿月、下弦四個位置，看在地球上看到的樣子，各收一張。',
      intro: '月球繞著地球轉。看右邊：在地球上看到的月亮哪半邊亮？', enter: { phase: 0, node: 90 },
      controls: [{ key: 'phase', label: '月球位置', type: 'seg', cols: 4, options: [[0, '新月'], [45, '眉月'], [90, '上弦'], [135, '盈凸'], [180, '滿月'], [225, '虧凸'], [270, '下弦'], [315, '殘月']] }],
      react: (s, r) => `${NAME[s.phase]}：亮面 ${Math.round(r.lit * 100)}%。`,
      targets: [tgt('p0', '新月', { phase: 0 }, '選「新月」。'), tgt('p90', '上弦月', { phase: 90 }, '選「上弦」。'), tgt('p180', '滿月', { phase: 180 }, '選「滿月」。'), tgt('p270', '下弦月', { phase: 270 }, '選「下弦」。')],
      found: ['月球朝太陽的半邊永遠亮；位置不同，我們看到的亮面不同。', '上弦右半亮，下弦左半亮；新月看不到，滿月全亮'] },
    { id: 'eclipse', label: '日月食', title: '為什麼不是每次新月都有日食？', goal: '比較三種情況：新月且交點對準太陽、滿月且交點對準太陽、新月但交點偏開 90°，各收一張。',
      intro: '月球軌道斜了約 5°。看右下角：月球在黃道面上還是偏開了？', enter: { phase: 0, node: 0 },
      controls: [{ key: 'phase', label: '月相', type: 'seg', options: [[0, '新月'], [180, '滿月']], cols: 2 }, { key: 'node', label: '軌道交點', type: 'seg', options: [[0, '對準太陽'], [90, '偏開 90°']], cols: 2 }],
      react: (s, r) => `月球偏離黃道面 ${Math.abs(Math.round(r.latitude * 10) / 10)}°：${KIND[r.kind]}。`,
      targets: [tgt('e-solar', '新月・交點對準', { phase: 0, node: 0 }, '選新月、交點對準太陽。'), tgt('e-lunar', '滿月・交點對準', { phase: 180, node: 0 }, '選滿月、交點對準太陽。'), tgt('e-none', '新月・交點偏開', { phase: 0, node: 90 }, '選新月、交點偏開 90°。')],
      found: ['日食在新月、月食在滿月，而且月球要在黃道面附近；偏開就不會發生。', '月球軌道斜約 5°，所以大部分的月份沒有日月食'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想月球的位置。',
      found: ['你把月相與日月食弄懂了！', '月相看位置；日月食還要在交點附近'] }
  ],
  quiz: [
    { q: '月相會有圓缺變化，原因是？', options: [
      { text: '地球的影子遮住月亮。', why: '那是月食，不是月相。你的證據：上弦月時地球的影子根本不在月亮那邊，是我們看到亮面的角度不同。' },
      { text: '月球繞地球，我們看到的亮面多少不同。', ok: true },
      { text: '月球自己有時發光、有時不發光。', why: '月球不會發光，亮的部分是被太陽照到的。' }] },
    { q: '日食可能發生在哪一種月相？', options: [
      { text: '新月。', ok: true },
      { text: '滿月。', why: '滿月時地球在中間，可能發生的是月食。' },
      { text: '上弦月。', why: '上弦月時三者不在一直線上，不會發生日月食。' }] },
    { q: '為什麼不是每個月都有日食？', options: [
      { text: '因為月球軌道和黃道面有約 5° 的夾角，月球常在太陽的上方或下方經過。', ok: true },
      { text: '因為有時候月球繞得比較慢。', why: '重點是軌道傾斜。你的證據：交點偏開時，新月的月球偏離黃道 5°，不會遮住太陽。' },
      { text: '因為太陽有時候不在。', why: '太陽一直都在。差別在月球是否剛好經過太陽和地球之間的直線上。' }] }
  ],
  finish: { title: '你把月相與日月食弄懂了！', rule: '月球朝太陽的半邊永遠是亮的，位置不同，從地球看到的亮面就不同。日食在新月、月食在滿月，還要月球在黃道面附近。', next: { label: '去四季實驗桌', href: '../seasons/' } }
});
