// 潮汐實驗桌：潮高、潮差大小、月相與下一次滿潮時刻全部來自 scripts/science/models.mjs 的 calculate('tides')（教學模型，非預報）。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('tides', { day: s.day, hour: s.hour });
const f2 = x => String(Math.round(x * 100) / 100), f1 = x => String(Math.round(x * 10) / 10);
const KIND = { spring: '大潮', neap: '小潮', middle: '中潮' };
const level = r => r.h > .3 ? '漲潮（高）' : r.h < -.3 ? '退潮（低）' : '中間';

function scene({ rig, el, txt, P, s, r }) {
  // 左：海岸剖面，水位隨潮高升降
  const sea = 320 - r.h * 90;
  el('rect', { x: 80, y: 140, width: 470, height: 340, rx: 18, fill: 'rgba(214,236,246,.6)', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('path', { d: `M84 ${sea} H546 V476 H84 Z`, fill: '#5EA9D6', opacity: .85 }, rig);
  el('path', { d: 'M300 476 L546 250 V476 Z', fill: '#E3C58F', stroke: '#8A6A3C', 'stroke-width': 3 }, rig);
  // 潮位尺
  el('rect', { x: 150, y: 190, width: 16, height: 260, fill: '#fff', stroke: '#23304A', 'stroke-width': 2 }, rig);
  for (const v of [-1, 0, 1]) { const y = 320 - v * 90; el('line', { x1: 166, y1: y, x2: 180, y2: y, stroke: '#23304A', 'stroke-width': 2 }, rig); txt(rig, 196, y + 5, `${v > 0 ? '+' : ''}${v} m`, { 'font-size': 13, 'text-anchor': 'start' }); }
  el('path', { d: `M146 ${sea} l-14 -8 v16 z`, fill: '#C8372D' }, rig);
  txt(rig, 315, 170, `${f1(s.hour)} 時：${level(r)}`, { 'font-size': 18 });
  // 右上：太陽、地球、月球的位置
  el('rect', { x: 590, y: 140, width: 330, height: 160, rx: 18, fill: 'rgba(20,28,48,.92)' }, rig);
  el('image', { href: P + 'prop-sun.webp', x: 600, y: 190, width: 56, height: 56 }, rig);
  const ex = 790, ey = 220;
  el('image', { href: P + 'prop-earth-globe.webp', x: ex - 20, y: ey - 20, width: 40, height: 40 }, rig);
  el('circle', { cx: ex, cy: ey, r: 62, fill: 'none', stroke: '#8FA3C4', 'stroke-dasharray': '4 5' }, rig);
  const a = r.moonAngle; el('image', { href: P + 'prop-moon.webp', x: ex - 62 * Math.cos(a) - 12, y: ey + 62 * Math.sin(a) - 12, width: 24, height: 24 }, rig);
  txt(rig, 860, 166, `${r.phase}・${KIND[r.kind]}`, { 'font-size': 15, fill: '#fff' });
  // 下：24 小時潮位曲線
  const gx = 600, gy = 410, W = 310, H = 70;
  el('rect', { x: 590, y: 320, width: 330, height: 170, rx: 18, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 3 }, rig);
  const pts = []; for (let t = 0; t <= 24; t += .25) pts.push(`${gx + t / 24 * W},${gy - calculate('tides', { day: s.day, hour: t }).h * H}`);
  el('line', { x1: gx, y1: gy, x2: gx + W, y2: gy, stroke: '#ECE2D2' }, rig);
  el('polyline', { points: pts.join(' '), fill: 'none', stroke: '#2F6FB0', 'stroke-width': 3 }, rig);
  el('circle', { cx: gx + s.hour / 24 * W, cy: gy - r.h * H, r: 7, fill: '#C8372D' }, rig);
  for (const t of [0, 6, 12, 18, 24]) txt(rig, gx + t / 24 * W, 478, `${t}`, { 'font-size': 12, fill: '#5A6478' });
  txt(rig, 755, 340, '一天的潮位（時）', { 'font-size': 13, fill: '#5A6478' });
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: (s, r) => sig.startsWith('d') ? `${r.phase}（月齡 ${s.day} 天）` : `${s.hour} 時`,
  body: (s, r) => sig.startsWith('d') ? `${KIND[r.kind]}，潮差振幅 ${f2(r.amp)} m` : `潮高 ${f2(r.h)} m，${level(r)}` });

runDesk({
  key: 'bhcs.lab.tides.v1', title: '潮汐實驗桌', background: 'bg-physics-bench',
  sceneLabel: '潮汐實驗桌：左邊是海岸剖面與潮位尺，右上是太陽、地球、月球的相對位置，右下是一天的潮位曲線',
  initial: { day: 0, hour: 0 },
  model, scene, viewBox: { desk: '60 120 880 390', phone: '60 120 880 390' }, phoneText: 1.4,
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
