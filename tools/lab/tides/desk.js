// 潮汐實驗桌：潮高、潮差大小、月相與下一次滿潮時刻全部來自 scripts/science/models.mjs 的 calculate('tides')（教學模型，非預報）。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';
import { skyDefs, sun, earth, moon } from '../shared/sky.mjs';

const model = s => calculate('tides', { day: s.day, hour: s.hour });
const f2 = x => String(Math.round(x * 100) / 100), f1 = x => String(Math.round(x * 10) / 10);
const KIND = { spring: '大潮', neap: '小潮', middle: '中潮' };
const level = r => r.h > .3 ? '漲潮（高）' : r.h < -.3 ? '退潮（低）' : '中間';

const INK = '#23304A', HOURS = [0, 6, 12, 18], DAYS = [0, 7.5, 15], n1 = v => v.toFixed(1);
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
function coast(el, txt, rig, h) {
  const d = el('defs', {}, rig), g = (id, stops) => { const n = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, d); for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, n); };
  g('ti-sky', [[0, '#9FD0F2'], [1, '#EAF6FC']]); g('ti-sea', [[0, '#5BB3E0', .92], [1, '#1F6FA8', .95]]); g('ti-sand', [[0, '#F2DCA8'], [1, '#D6B072']]); g('ti-rock', [[0, '#9AA3B0'], [1, '#5F6877']]);
  const cp = el('clipPath', { id: 'ti-box' }, d); el('rect', { x: 80, y: 140, width: 470, height: 340, rx: 18 }, cp);
  const q = el('g', { 'clip-path': 'url(#ti-box)' }, rig), sea = 320 - h * 90;
  el('rect', { x: 80, y: 140, width: 470, height: 340, fill: 'url(#ti-sky)' }, q);
  for (const [cx, cy, s] of [[180, 180, 1], [420, 200, .7]]) { el('ellipse', { cx, cy, rx: 34 * s, ry: 12 * s, fill: '#fff', opacity: .9 }, q); el('ellipse', { cx: cx + 16 * s, cy: cy - 8 * s, rx: 20 * s, ry: 12 * s, fill: '#fff', opacity: .9 }, q); }
  // 退潮時露出的濕沙
  el('path', { d: 'M250 480C330 420 420 330 560 250V480Z', fill: 'url(#ti-sand)', stroke: '#B48A4A', 'stroke-width': 2.5 }, q);
  let dots = ''; for (let i = 0; i < 70; i++) { const t = rnd(i, 1), x = 260 + t * 290, top = 480 - (x - 250) * .76; dots += `M${n1(x)} ${n1(top + 8 + rnd(i, 2) * (480 - top - 8))}h.1`; }
  el('path', { d: dots, stroke: '#B48A4A', 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: .55 }, q);
  // 岩石與海草
  el('path', { d: 'M420 340q14 -24 36 -18q22 -2 26 22z', fill: 'url(#ti-rock)', stroke: '#4A5260', 'stroke-width': 2 }, q);
  el('path', { d: 'M436 336q-6 -14 2 -24M450 334q4 -16 -2 -26', fill: 'none', stroke: '#4E8A3A', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, q);
  // 海水（有波浪）
  let w = `M80 ${n1(sea)}`; for (let x = 80; x <= 560; x += 10) w += `L${x} ${n1(sea + 4 * Math.sin(x / 22))}`;
  el('path', { d: w + 'L560 480L80 480Z', fill: 'url(#ti-sea)' }, q);
  el('path', { d: w, fill: 'none', stroke: '#E8F6FF', 'stroke-width': 2.5, opacity: .9 }, q);
  for (let i = 0; i < 5; i++) el('path', { d: `M${100 + i * 70} ${n1(sea + 30 + (i % 2) * 24)}q10 -4 20 0`, fill: 'none', stroke: '#BFE3F7', 'stroke-width': 2, opacity: .6 }, q);
  // 小船浮在水面
  const bx = 268, by = sea + 4 * Math.sin(bx / 22);
  el('path', { d: `M${bx - 34} ${n1(by - 8)}h68l-12 16h-44z`, fill: '#D9483A', stroke: INK, 'stroke-width': 2 }, q);
  el('path', { d: `M${bx} ${n1(by - 8)}V${n1(by - 54)}l26 40z`, fill: '#FFF8EC', stroke: INK, 'stroke-width': 1.8 }, q);
  // 潮位尺（木樁）
  el('rect', { x: 122, y: 180, width: 20, height: 300, fill: '#B98A52', stroke: '#7A5530', 'stroke-width': 2 }, q);
  el('rect', { x: 142, y: 200, width: 18, height: 240, fill: '#FFFDF2', stroke: INK, 'stroke-width': 1.5 }, q);
  for (let v = -1; v <= 1; v += .25) { const y = 320 - v * 90; el('path', { d: `M142 ${y}h${v % 1 ? 7 : 13}`, stroke: INK, 'stroke-width': v % 1 ? 1 : 2 }, q); }
  for (const v of [-1, 0, 1]) txt(q, 182, 320 - v * 90 + 5, `${v > 0 ? '+' : ''}${v} m`, { 'font-size': 12, 'text-anchor': 'start', fill: INK });
  el('path', { d: `M164 ${n1(sea)}l12 -7v14z`, fill: '#C8372D' }, q);
  el('rect', { x: 80, y: 140, width: 470, height: 340, rx: 18, fill: 'none', stroke: INK, 'stroke-width': 3 }, rig);
}

function scene({ rig, el, txt, s, r, step, set, drag, hint, kind, narrow }) {
  skyDefs(el, rig);
  const can = kind === 'observe';
  coast(el, txt, rig, r.h);
  el('rect', { x: 228, y: 150, width: 174, height: 30, rx: 15, fill: '#FFFDF2', opacity: .92 }, rig);
  txt(rig, 315, 171, `${f1(s.hour)} 時：${level(r)}`, { 'font-size': 17 });
  // 手機：太陽地球月球和潮位曲線排到海岸下面
  const OX = narrow ? -440 : 0, OY = narrow ? 370 : 0;
  // 右上：太陽、地球（海水被拉長）、月球
  el('rect', { x: 580 + OX, y: 140 + OY, width: 350, height: 176, rx: 18, fill: '#0F1730', stroke: INK, 'stroke-width': 3 }, rig);
  const cp = el('clipPath', { id: 'ti-space' }, el('defs', {}, rig)); el('rect', { x: 580 + OX, y: 140 + OY, width: 350, height: 176, rx: 18 }, cp);
  const sp = el('g', { 'clip-path': 'url(#ti-space)' }, rig); sun(el, sp, 574 + OX, 228 + OY, 40);
  const ex = 790 + OX, ey = 228 + OY, OR = 70, a = r.moonAngle, pos = d => { const t = 2 * Math.PI * d / 29.5; return [ex - OR * Math.cos(t), ey + OR * Math.sin(t)]; };
  el('circle', { cx: ex, cy: ey, r: OR, fill: 'none', stroke: '#6E83A8', 'stroke-dasharray': '4 5' }, rig);
  // 潮汐隆起：海水沿地球—月球方向被拉長，大潮時（太陽也在同一直線）拉得更長
  const stretch = 22 + 14 * r.amp;
  el('ellipse', { cx: ex, cy: ey, rx: stretch + 4, ry: 22, fill: '#5BB3E0', opacity: .45, transform: `rotate(${n1(-a * 180 / Math.PI)} ${ex} ${ey})` }, rig);
  earth(el, rig, ex, ey, 20, { sunAng: 180, seed: 3 });
  const [mx, my] = pos(s.day), mg = el('g', { 'data-drag': can && step === 'spring' ? 'moon' : null }, rig), mm = el('g', {}, mg);
  moon(el, mm, mx, my, 11, { sunAng: 180, seed: 7 }); el('circle', { cx: mx, cy: my, r: 24, fill: 'transparent' }, mg);
  if (step === 'spring') for (const d of DAYS) if (d !== s.day) { const [x, y] = pos(d); el('circle', { cx: x, cy: y, r: 6, fill: 'none', stroke: '#8FA3C4', 'stroke-width': 1.5 }, rig); }
  txt(rig, 870 + OX, 166 + OY, `${r.phase}・${KIND[r.kind]}`, { 'font-size': 15, fill: '#fff' });
  if (can && step === 'spring') drag(mg, () => { let ang = a; return { move(p) { ang = (Math.atan2(p.y - ey, ex - p.x) + 2 * Math.PI) % (2 * Math.PI); mm.setAttribute('transform', `translate(${n1(ex - OR * Math.cos(ang) - mx)} ${n1(ey + OR * Math.sin(ang) - my)})`); },
    end() { const day = ang / (2 * Math.PI) * 29.5, v = DAYS.reduce((m, x) => Math.abs(x - day) < Math.abs(m - day) ? x : m); if (v !== s.day) set({ day: v }); else mm.removeAttribute('transform'); }, cancel() { mm.removeAttribute('transform'); } }; },
    { label: '讓月球繼續繞地球走', tap: () => set({ day: DAYS[(DAYS.indexOf(s.day) + 1) % 3] }) });
  // 下：24 小時潮位曲線（紅點可以沿著曲線拖）
  const gx = 610 + OX, gy = 408 + OY, W = 296, H = 46;
  el('rect', { x: 580 + OX, y: 330 + OY, width: 350, height: 150, rx: 18, fill: 'rgba(255,255,255,.95)', stroke: INK, 'stroke-width': 3 }, rig);
  txt(rig, 755 + OX, 352 + OY, '一天的潮位（時）', { 'font-size': 13, fill: '#5A6478' });
  let cd = ''; for (let t = 0; t <= 24; t += .25) cd += `${t ? 'L' : 'M'}${n1(gx + t / 24 * W)} ${n1(gy - calculate('tides', { day: s.day, hour: t }).h * H)}`;
  el('path', { d: `M${gx} ${gy}H${gx + W}`, stroke: '#ECE2D2', 'stroke-width': 1.5 }, rig);
  el('path', { d: cd + `L${gx + W} ${gy}L${gx} ${gy}Z`, fill: '#5BB3E0', opacity: .15 }, rig);
  el('path', { d: cd, fill: 'none', stroke: '#2F6FB0', 'stroke-width': 3 }, rig);
  for (const t of [0, 6, 12, 18, 24]) txt(rig, gx + t / 24 * W, 470 + OY, `${t}`, { 'font-size': 12, fill: '#5A6478' });
  const dg = el('g', { 'data-drag': can && step === 'daily' ? 'hour' : null }, rig), dot = el('circle', { cx: gx + s.hour / 24 * W, cy: gy - r.h * H, r: 8, fill: '#C8372D', stroke: '#fff', 'stroke-width': 2.5 }, dg);
  el('circle', { cx: gx + s.hour / 24 * W, cy: gy - r.h * H, r: 22, fill: 'transparent' }, dg);
  if (can && step === 'daily') drag(dg, () => { let t = s.hour; return { move(p) { t = Math.max(0, Math.min(24, (p.x - gx) / W * 24)); dot.setAttribute('cx', gx + t / 24 * W); dot.setAttribute('cy', gy - calculate('tides', { day: s.day, hour: t }).h * H); },
    end() { const v = HOURS.reduce((m, x) => Math.abs(x - t) < Math.abs(m - t) ? x : m); if (v !== s.hour) set({ hour: v }); else { dot.setAttribute('cx', gx + s.hour / 24 * W); dot.setAttribute('cy', gy - r.h * H); } }, cancel() { dot.setAttribute('cx', gx + s.hour / 24 * W); dot.setAttribute('cy', gy - r.h * H); } }; },
    { label: '往後 6 小時', tap: () => set({ hour: HOURS[(HOURS.indexOf(s.hour) + 1) % 4] }) });
  hint(narrow ? 315 : 500, narrow ? 880 : 512, step === 'daily' ? '沿著曲線拖紅點，看海水漲退' : step === 'spring' ? '拖著月球繞地球走' : '');
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: (s, r) => sig.startsWith('d') ? `${r.phase}（月齡 ${s.day} 天）` : `${s.hour} 時`,
  body: (s, r) => sig.startsWith('d') ? `${KIND[r.kind]}，潮差振幅 ${f2(r.amp)} m` : `潮高 ${f2(r.h)} m，${level(r)}` });

runDesk({
  key: 'bhcs.lab.tides.v1', title: '潮汐實驗桌', background: 'bg-physics-bench',
  sceneLabel: '潮汐實驗桌：左邊是海岸，海水、小船和潮位尺跟著潮高升降；右上是太陽、地球和月球，地球外的藍色是被月球拉長的海水，月球可以拖著繞地球走；右下是一天的潮位曲線，紅點可以沿著曲線拖',
  initial: { day: 0, hour: 0 },
  model, scene, viewBox: { desk: '60 120 890 420', phone: '60 130 510 780' }, phoneText: 1.15,
  readouts: (s, r) => [['潮高', f2(r.h), 'm', level(r)], ['月相', r.phase, '', `月齡 ${s.day} 天`], ['潮差', KIND[r.kind], '', `振幅 ${f2(r.amp)} m`]],
  why: { title: '潮汐是怎麼來的', button: '潮汐從哪來', html: `
    <p class="fn-tip"><b>潮汐主要由月球的引力造成，</b>太陽也有影響。地球自轉一圈，海邊大約會遇到兩次滿潮、兩次乾潮，每次約隔 12 小時 25 分，所以每天的滿潮時間會延後約 50 分鐘。</p>
    <p class="fn-tip"><b>大潮：</b>新月和滿月時，太陽、地球、月球排成一直線，引力相加，漲退差最大。<b>小潮：</b>上弦、下弦時三者成直角，潮差最小。</p>
    <p class="fn-tip">模型說明：用簡化的半日潮模型，數值是教學用，不是潮汐預報；去海邊請看中央氣象署的潮汐預報。</p>` },
  steps: [
    { id: 'daily', label: '一天兩次', title: '一天裡，海水漲退幾次？', goal: '新月這天，看 0 時、6 時、12 時的潮位，各收一張。',
      intro: '新月這天的半夜 0 時剛好滿潮。6 小時後呢？', enter: { day: 0, hour: 0 },
      controls: [{ key: 'hour', label: '時刻', type: 'seg', cols: 4, options: [[0, '0 時'], [6, '6 時'], [12, '12 時'], [18, '18 時']] }],
      react: (s, r) => `${s.hour} 時：潮高 ${f2(r.h)} m，${level(r)}。`,
      targets: [tgt('h0', '0 時', { day: 0, hour: 0 }, '選 0 時。'), tgt('h6', '6 時', { day: 0, hour: 6 }, '選 6 時。'), tgt('h12', '12 時', { day: 0, hour: 12 }, '選 12 時。')],
      found: ['一天大約有兩次漲潮、兩次退潮，相隔約 12 小時 25 分。', '0 時滿潮 → 6 時乾潮 → 約 12 時 25 分再滿潮'] },
    { id: 'spring', label: '大潮小潮', title: '什麼時候潮差最大？', goal: '比較新月、上弦月、滿月三天的潮差大小，各收一張。',
      intro: '看右上角：太陽、地球、月球排成什麼樣子時，潮差最大？', enter: { day: 0, hour: 0 },
      controls: [{ key: 'day', label: '月齡', type: 'seg', options: [[0, '新月（0 天）'], [7.5, '上弦（7.5 天）'], [15, '滿月（15 天）']] }],
      react: (s, r) => `${r.phase}：${KIND[r.kind]}，振幅 ${f2(r.amp)} m。`,
      targets: [tgt('d0', '新月', { day: 0 }, '選新月。'), tgt('d7', '上弦月', { day: 7.5 }, '選上弦。'), tgt('d15', '滿月', { day: 15 }, '選滿月。')],
      found: ['新月、滿月是大潮（三者一直線）；上弦、下弦是小潮（成直角）。', '太陽和月球的引力方向相同時，潮差最大'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想月球的位置。',
      found: ['你把潮汐弄懂了！', '一天兩次漲退；新月滿月大潮'] }
  ],
  quiz: [
    { q: '同一個海邊，一天大約有幾次滿潮？', options: [
      { text: '1 次。', why: '你的證據：0 時滿潮、約 12 時 25 分又滿潮，一天大約 2 次。' },
      { text: '2 次。', ok: true },
      { text: '4 次。', why: '一天大約 2 次滿潮、2 次乾潮。' }] },
    { q: '大潮通常發生在哪些月相？', options: [
      { text: '上弦月和下弦月。', why: '上弦、下弦時三者成直角，是小潮。' },
      { text: '新月和滿月。', ok: true },
      { text: '每天都一樣。', why: '你的證據：新月振幅 1 m，上弦月只有 0.6 m。' }] },
    { q: '為什麼今天的滿潮時間比昨天晚？', options: [
      { text: '月球每天在天上的位置往東移，同一個地方大約晚 50 分鐘才再對到月球。', ok: true },
      { text: '因為太陽每天晚 50 分鐘升起。', why: '潮汐主要跟著月球。月球每天約晚 50 分鐘到達同一位置。' },
      { text: '因為海水變重了。', why: '和海水重量無關，是月球位置改變。' }] }
  ],
  finish: { title: '你把潮汐弄懂了！', rule: '潮汐主要由月球引力造成，一天約兩次滿潮、兩次乾潮。新月和滿月時太陽、地球、月球成一直線，形成大潮；上弦、下弦是小潮。', next: { label: '去天氣系統實驗桌', href: '../weather/' } }
});
