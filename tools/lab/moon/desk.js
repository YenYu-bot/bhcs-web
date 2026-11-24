// 月相與日月食實驗桌：亮面比例、月球黃緯、日月食判斷全部來自 scripts/science/models.mjs 的 calculate('moon-eclipse')。
// 「日食／月食」只表示符合本頁簡化門檻的候選位置，不是預報。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';
import { skyDefs, sun, earth, moon, moonPhase } from '../shared/sky.mjs';

const model = s => calculate('moon-eclipse', { phase: s.phase, node: s.node, inclination: 5 });
const NAME = { 0: '新月（朔）', 45: '眉月', 90: '上弦月', 135: '盈凸月', 180: '滿月（望）', 225: '虧凸月', 270: '下弦月', 315: '殘月' };
const KIND = { solar: '日食候選', lunar: '月食候選', none: '不會發生' };

const INK = '#23304A', PH = { phase: [0, 45, 90, 135, 180, 225, 270, 315], eclipse: [0, 180] };
const n1 = v => v.toFixed(1);
function scene({ rig, el, txt, s, r, step, set, drag, hint, kind }) {
  skyDefs(el, rig);
  const can = kind === 'observe', ex = 370, ey = 320, R = 168, pos = ph => { const p = ph * Math.PI / 180; return [ex - R * Math.cos(p), ey + R * Math.sin(p)]; };
  // 太空背景與星星
  el('rect', { x: 60, y: 112, width: 620, height: 416, rx: 20, fill: '#0F1730', stroke: INK, 'stroke-width': 3 }, rig);
  let st = ''; for (let i = 0; i < 70; i++) { const x = 72 + ((i * 97) % 596), y = 124 + ((i * 53) % 392); st += `M${x} ${y}h.1`; }
  el('path', { d: st, stroke: '#fff', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: .5 }, rig);
  // 太陽（左邊畫面外露一半）與陽光
  const cp = el('clipPath', { id: 'mo-box' }, el('defs', {}, rig)); el('rect', { x: 60, y: 112, width: 620, height: 416, rx: 20 }, cp);
  const box = el('g', { 'clip-path': 'url(#mo-box)' }, rig); sun(el, box, 46, ey, 70, { rays: true });
  for (let i = 0; i < 5; i++) { const y = 196 + i * 62; el('path', { d: `M150 ${y}h44`, stroke: '#FFD866', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .8 }, rig); el('path', { d: `M194 ${y}l-9 -5v10z`, fill: '#FFD866', opacity: .8 }, rig); }
  txt(rig, 110, 500, '陽光', { 'font-size': 14, fill: '#FFD866' });
  // 月球軌道、交點線
  el('circle', { cx: ex, cy: ey, r: R, fill: 'none', stroke: '#6E83A8', 'stroke-width': 2, 'stroke-dasharray': '6 7' }, rig);
  if (step === 'eclipse') { const a = s.node * Math.PI / 180, L = R + 28, ng = el('g', {}, rig);
    el('path', { d: `M${n1(ex - L * Math.cos(a))} ${n1(ey - L * Math.sin(a))}L${n1(ex + L * Math.cos(a))} ${n1(ey + L * Math.sin(a))}`, stroke: '#F29A4A', 'stroke-width': 3, 'stroke-dasharray': '10 6' }, ng);
    for (const sd of [-1, 1]) el('circle', { cx: n1(ex + sd * R * Math.cos(a)), cy: n1(ey + sd * R * Math.sin(a)), r: 9, fill: '#F29A4A', stroke: '#fff', 'stroke-width': 2 }, ng);
    el('circle', { cx: n1(ex + (R + 14) * Math.cos(a)), cy: n1(ey + (R + 14) * Math.sin(a)), r: 30, fill: 'transparent', 'data-drag': can ? 'node' : null }, ng);
    txt(rig, n1(ex + (R + 34) * Math.cos(a) + (s.node ? 46 : 0)), n1(ey + (R + 34) * Math.sin(a) + (s.node ? 0 : 30)), '交點', { 'font-size': 13, fill: '#F29A4A' });
    if (can) drag(ng, () => { let d = s.node; return { move(p) { d = ((Math.atan2(p.y - ey, p.x - ex) * 180 / Math.PI) % 180 + 180) % 180; ng.setAttribute('transform', `rotate(${d - s.node} ${ex} ${ey})`); },
      end() { const v = Math.abs(d - 90) < 45 ? 90 : 0; if (v !== s.node) set({ node: v }); else ng.removeAttribute('transform'); }, cancel() { ng.removeAttribute('transform'); } }; },
      { label: '轉動月球軌道的交點', tap: () => set({ node: s.node ? 0 : 90 }) }); }
  // 地球：朝太陽那半邊是白天
  earth(el, rig, ex, ey, 38, { sunAng: 180, seed: 3 });
  // 其他可停的位置
  const list = PH[step] || [s.phase];
  for (const ph of list) if (ph !== s.phase) { const [x, y] = pos(ph); el('circle', { cx: x, cy: y, r: 7, fill: 'none', stroke: '#8FA3C4', 'stroke-width': 1.5 }, rig); }
  // 月球（可以拖著繞地球走）
  const [mx, my] = pos(s.phase), mg = el('g', { 'data-drag': can && PH[step] ? 'moon' : null }, rig), mm = el('g', {}, mg);
  moon(el, mm, mx, my, 22, { sunAng: 180, seed: 7 }); el('circle', { cx: mx, cy: my, r: 34, fill: 'transparent' }, mg);
  const ang = s.phase * Math.PI / 180, lab = txt(rig, n1(mx + 52 * Math.cos(ang)), n1(my - 52 * Math.sin(ang) + 5), NAME[s.phase] || '', { 'font-size': 14, fill: '#fff' });
  txt(rig, ex, 140, '從北極上方往下看（月球逆時針繞地球）', { 'font-size': 14, fill: '#C9D4E6' });
  if (can && PH[step]) drag(mg, () => { let ph = s.phase; return { move(p) { ph = (Math.atan2(p.y - ey, ex - p.x) * 180 / Math.PI + 360) % 360; const [x, y] = pos(ph); mm.setAttribute('transform', `translate(${n1(x - mx)} ${n1(y - my)})`); lab.setAttribute('opacity', 0); },
    end() { const v = PH[step].reduce((m, x) => { const d = a => Math.min(Math.abs(a - ph), 360 - Math.abs(a - ph)); return d(x) < d(m) ? x : m; }); if (v !== s.phase) set({ phase: v }); else { mm.removeAttribute('transform'); lab.removeAttribute('opacity'); } }, cancel() { mm.removeAttribute('transform'); lab.removeAttribute('opacity'); } }; },
    { label: '讓月球繼續繞地球走', tap: () => set({ phase: PH[step][(PH[step].indexOf(s.phase) + 1) % PH[step].length] }) });
  // 右：在地球上看到的月亮
  el('rect', { x: 700, y: 112, width: 250, height: 416, rx: 20, fill: 'rgba(255,255,255,.95)', stroke: INK, 'stroke-width': 3 }, rig);
  txt(rig, 825, 146, '在地球上看到', { 'font-size': 16 });
  el('circle', { cx: 825, cy: 240, r: 80, fill: '#1B2440' }, rig);
  moonPhase(el, rig, 825, 240, 66, s.phase, 7);
  txt(rig, 825, 350, NAME[s.phase] || '', { 'font-size': 20 });
  txt(rig, 825, 380, `亮面 ${Math.round(r.lit * 100)}%`, { 'font-size': 16, fill: '#5A6478' });
  if (step !== 'phase') { // 側視：月球在黃道面上方或下方
    el('rect', { x: 716, y: 404, width: 218, height: 108, rx: 12, fill: '#0F1730' }, rig);
    sun(el, rig, 736, 452, 12, { rays: false }); earth(el, rig, 812, 452, 11, { seed: 3 });
    el('path', { d: 'M724 452H926', stroke: '#E0A21B', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }, rig);
    txt(rig, 900, 444, '黃道面', { 'font-size': 10, fill: '#E0A21B' });
    const lx = s.phase === 0 ? 778 : 862; moon(el, rig, lx, 452 - r.latitude * 8, 7, { seed: 7 });
    txt(rig, 825, 500, `月球偏離 ${Math.abs(Math.round(r.latitude * 10) / 10)}°：${KIND[r.kind]}`, { 'font-size': 13, fill: r.kind === 'none' ? '#C9D4E6' : '#FF8A7A' });
  }
  hint(370, 556, step === 'phase' ? '拖著月球繞地球走' : step === 'eclipse' ? '拖月球到新月或滿月；轉橘色的交點線' : '');
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: s => sig.startsWith('e') ? `${NAME[s.phase]}・交點${s.node === 0 ? '對準太陽' : '偏開 90°'}` : NAME[s.phase],
  body: (s, r) => sig.startsWith('e') ? `月球偏離黃道面 ${Math.abs(Math.round(r.latitude * 10) / 10)}°：${KIND[r.kind]}` : `亮面 ${Math.round(r.lit * 100)}%` });

runDesk({
  key: 'bhcs.lab.moon.v1', title: '月相與日月食實驗桌', background: 'bg-physics-bench',
  sceneLabel: '月相與日月食實驗桌：左邊從北極上方往下看，太陽在左、地球在中間，月球可以拖著繞地球走；右邊是在地球上看到的月亮；日月食那一步可以轉月球軌道的交點線，右下角是側視圖',
  initial: { phase: 90, node: 90 },
  model, scene, viewBox: { desk: '50 100 910 480', phone: '50 100 910 480' }, phoneText: 1.4,
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
