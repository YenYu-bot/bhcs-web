// 四季實驗桌：太陽直射緯度、正午太陽高度與白晝長度全部來自 scripts/science/models.mjs 的 calculate('seasons')。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('seasons', { latitude: s.latitude, season: s.season, tilt: s.tilt });
const SEASON = { 0: '春分', 90: '夏至', 180: '秋分', 270: '冬至' };
const LAT = { 0: '赤道', 24: '臺中（北緯 24°）', 70: '北緯 70°（北極圈內）' };
const f1 = x => String(Math.round(x * 10) / 10);
const hrs = r => r.boundary ? '—' : f1(r.hours);

function scene({ rig, el, txt, P, s, r }) {
  // 左：公轉俯視，地軸方向固定
  const cx = 250, cy = 330, R = 150;
  el('ellipse', { cx, cy, rx: R, ry: R * .55, fill: 'none', stroke: '#8FA3C4', 'stroke-width': 2, 'stroke-dasharray': '6 6' }, rig);
  el('image', { href: P + 'prop-sun.webp', x: cx - 40, y: cy - 40, width: 80, height: 80 }, rig);
  // 地軸上端往右傾：地球在太陽左邊時北半球朝向太陽（夏至），右邊是冬至
  const POS = { 90: [cx - R, cy], 270: [cx + R, cy], 0: [cx, cy + R * .55], 180: [cx, cy - R * .55] }, k = 30 * Math.tan(s.tilt * Math.PI / 180);
  for (const [a, t] of [[0, '春分'], [90, '夏至'], [180, '秋分'], [270, '冬至']]) {
    const [x, y] = POS[a], on = a === s.season;
    el('circle', { cx: x, cy: y, r: on ? 24 : 14, fill: on ? '#2F6FB0' : '#9FB3CC', stroke: '#23304A', 'stroke-width': 2 }, rig);
    el('line', { x1: x + k, y1: y - 30, x2: x - k, y2: y + 30, stroke: '#C8372D', 'stroke-width': 3 }, rig);
    txt(rig, x, y + (a === 180 ? -38 : 50), t, { 'font-size': on ? 17 : 14, fill: on ? '#23304A' : '#5A6478' });
  }
  txt(rig, cx, 150, `地軸傾斜 ${s.tilt}°（紅線），方向固定不變`, { 'font-size': 14, fill: '#5A6478' });
  // 右：正午太陽高度
  const gx = 560, gy = 470, L = 160, alt = Math.max(-10, r.altitude), a = alt * Math.PI / 180;
  el('rect', { x: 470, y: 150, width: 470, height: 380, rx: 18, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, 705, 184, `${LAT[s.latitude] || s.latitude + '°'}・${SEASON[s.season]}正午`, { 'font-size': 17 });
  el('line', { x1: 490, y1: gy, x2: 920, y2: gy, stroke: '#2E6B3A', 'stroke-width': 4 }, rig);
  txt(rig, 900, gy - 8, '地平線', { 'font-size': 13, fill: '#2E6B3A' });
  el('image', { href: P + 'prop-kid-observer.webp', x: gx + 120, y: gy - 100, width: 40, height: 100 }, rig);
  const ox = gx + 140, oy = gy - 50, sx = ox - L * Math.cos(a) * 1.15, sy = oy - L * Math.sin(a) * 1.15;
  if (alt > 0) {
    el('line', { x1: sx, y1: sy, x2: ox, y2: oy, stroke: '#E0A21B', 'stroke-width': 3, 'stroke-dasharray': '8 6' }, rig);
    el('image', { href: P + 'prop-sun.webp', x: sx - 26, y: sy - 26, width: 52, height: 52 }, rig);
    el('path', { d: `M${ox - 60} ${oy} A60 60 0 0 1 ${ox - 60 * Math.cos(a)} ${oy - 60 * Math.sin(a)}`, fill: 'none', stroke: '#C8372D', 'stroke-width': 3 }, rig);
    txt(rig, ox - 90, oy - 14, `${f1(r.altitude)}°`, { 'font-size': 18, fill: '#C8372D' });
    // 影子：太陽越低影子越長
    const shadow = Math.min(240, 50 / Math.tan(a));
    el('rect', { x: gx + 160, y: gy - 6, width: shadow, height: 8, rx: 4, fill: 'rgba(35,48,74,.45)' }, rig);
  } else txt(rig, ox - 120, oy - 60, '正午太陽在地平線下', { 'font-size': 16, fill: '#5A6478' });
  // 晝夜長度條
  const day = r.boundary ? 12 : r.hours;
  el('rect', { x: 500, y: 492, width: 400, height: 22, rx: 11, fill: '#3B4256' }, rig);
  el('rect', { x: 500, y: 492, width: 400 * day / 24, height: 22, rx: 11, fill: '#F4C04E' }, rig);
  txt(rig, 500, 486, `白天 ${hrs(r)} 小時・晚上 ${r.boundary ? '—' : f1(24 - r.hours)} 小時`, { 'font-size': 14, 'text-anchor': 'start' });
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: s => `${LAT[s.latitude] || s.latitude + '°'}・${SEASON[s.season]}${s.tilt !== 23.5 ? `・地軸 ${s.tilt}°` : ''}`,
  body: (s, r) => `正午太陽高度 ${f1(r.altitude)}°，白天 ${hrs(r)} 小時` });
const BASE = { latitude: 24, season: 90, tilt: 23.5 };

runDesk({
  key: 'bhcs.lab.seasons.v1', title: '四季實驗桌', background: 'bg-physics-bench',
  sceneLabel: '四季實驗桌：左邊是地球繞太陽公轉的俯視圖，地軸方向固定；右邊是所選地點正午的太陽高度角、影子長短與白天的時數',
  initial: { ...BASE },
  model, scene, viewBox: { desk: '60 120 890 420', phone: '60 120 890 420' }, phoneText: 1.4,
  readouts: (s, r) => [['正午太陽高度', f1(r.altitude), '°', LAT[s.latitude] || `${s.latitude}°`], ['白天長度', hrs(r), '小時', SEASON[s.season]], ['太陽直射', f1(Math.abs(r.declination)), '°', r.declination > 0 ? '北緯' : r.declination < 0 ? '南緯' : '赤道']],
  why: { title: '四季是怎麼來的', button: '四季從哪來', html: `
    <p class="fn-tip"><b>四季不是因為地球離太陽遠近，</b>而是地軸傾斜約 23.5°，而且方向固定不變。地球繞太陽公轉時，太陽直射的緯度在南、北回歸線之間來回移動。</p>
    <p class="fn-tip"><b>夏至：</b>太陽直射北回歸線（北緯 23.5°），北半球正午太陽高、白天長，比較熱。<b>冬至：</b>太陽直射南回歸線，北半球正午太陽低、白天短，比較冷。<b>春分、秋分：</b>直射赤道，晝夜等長。</p>
    <p class="fn-tip"><b>正午太陽高度 ＝ 90° − |當地緯度 − 太陽直射緯度|。</b>太陽越高，陽光越集中、影子越短。</p>
    <p class="fn-tip">模型說明：用理想的天球模型，不計大氣折射與日出日落的太陽半徑。</p>` },
  steps: [
    { id: 'taiwan', label: '臺灣的四季', title: '臺中的夏至和冬至差在哪？', goal: '地點臺中（北緯 24°）。比較夏至、冬至、春分的正午太陽高度和白天長度，各收一張。',
      intro: '看右邊：夏至中午太陽有多高？影子多長？', enter: { ...BASE },
      controls: [{ key: 'season', label: '節氣', type: 'seg', cols: 4, options: [[0, '春分'], [90, '夏至'], [180, '秋分'], [270, '冬至']] }],
      react: (s, r) => `${SEASON[s.season]}：正午太陽 ${f1(r.altitude)}°，白天 ${hrs(r)} 小時。`,
      targets: [tgt('su', '夏至', { ...BASE }, '選夏至。'), tgt('wi', '冬至', { ...BASE, season: 270 }, '選冬至。'), tgt('sp', '春分', { ...BASE, season: 0 }, '選春分。')],
      found: ['夏至正午太陽高（89.5°）、白天長；冬至太陽低（42.5°）、白天短；春分晝夜等長。', '太陽越高、白天越長，越熱'] },
    { id: 'latitude', label: '不同緯度', title: '同一天，不同地方一樣嗎？', goal: '都在夏至。比較赤道、臺中和北緯 70° 的正午太陽高度與白天長度，各收一張。',
      intro: '夏至這天，到北極圈裡會看到什麼？', enter: { ...BASE, latitude: 0 },
      controls: [{ key: 'latitude', label: '地點', type: 'seg', options: [[0, '赤道'], [24, '臺中'], [70, '北緯 70°']] }],
      react: (s, r) => r.hours === 24 ? '北緯 70° 夏至：太陽整天不下山（永晝）！' : `${LAT[s.latitude]}：正午 ${f1(r.altitude)}°，白天 ${hrs(r)} 小時。`,
      targets: [tgt('l0', '赤道', { ...BASE, latitude: 0 }, '選赤道。'), tgt('l24', '臺中', { ...BASE }, '選臺中。'), tgt('l70', '北緯 70°', { ...BASE, latitude: 70 }, '選北緯 70°。')],
      found: ['夏至時越往北白天越長，北極圈內整天都是白天（永晝）。', '緯度不同，太陽高度和晝長就不同'] },
    { id: 'tilt', label: '地軸不斜', title: '如果地軸沒有傾斜呢？', goal: '臺中、夏至。比較地軸傾斜 23.5° 和 0° 的正午太陽高度與白天長度，各收一張。',
      intro: '把地軸扶正（0°），臺中還會有夏天嗎？', enter: { ...BASE, tilt: 0 },
      controls: [{ key: 'tilt', label: '地軸傾斜', type: 'seg', options: [[23.5, '23.5°'], [0, '0°（不傾斜）']], cols: 2 }],
      react: (s, r) => s.tilt === 0 ? '地軸不斜：每天都是白天 12 小時，正午太陽 66°，沒有四季變化。' : `地軸 23.5°：夏至正午 ${f1(r.altitude)}°。`,
      targets: [tgt('t23', '地軸 23.5°', { ...BASE }, '選 23.5°。'), tgt('t0', '地軸 0°', { ...BASE, tilt: 0 }, '選 0°。')],
      found: ['地軸不傾斜時，太陽一直直射赤道，就沒有四季了。', '四季的原因：地軸傾斜 23.5°'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：正午太陽高度', goal: '正午太陽高度 ＝ 90° − |緯度 − 太陽直射緯度|。夏至直射北緯 23.5°、冬至直射南緯 23.5°（記成 −23.5°）。', intro: '先找出太陽直射哪裡。', head: '90° − |緯度 − 直射緯度|',
      rows: [
        { id: 'a', name: '夏至，北緯 23.5°', eq: '90 − |23.5 − 23.5|', answer: 90, unit: '°' },
        { id: 'b', name: '冬至，北緯 23.5°', eq: '90 − |23.5 − (−23.5)|', answer: 43, unit: '°', hint: v => v === 90 ? '冬至太陽直射南緯 23.5°，要寫成 −23.5。' : '' },
        { id: 'c', name: '春分，赤道', eq: '90 − |0 − 0|', answer: 90, unit: '°' }],
      found: ['算對了！', '太陽直射的地方，正午太陽高度是 90°'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想太陽的高度。',
      found: ['你把四季的成因弄懂了！', '地軸傾斜 → 太陽直射緯度移動 → 四季'] }
  ],
  quiz: [
    { q: '臺灣夏天比冬天熱，主要原因是？', options: [
      { text: '夏天地球離太陽比較近。', why: '四季和距離無關。你的證據：地軸不傾斜時就沒有四季，原因是地軸傾斜。' },
      { text: '夏天正午太陽比較高、白天比較長。', ok: true },
      { text: '夏天太陽比較大。', why: '太陽沒有變。是太陽高度和白天長短改變了。' }] },
    { q: '夏至時，北緯 70° 會出現什麼現象？', options: [
      { text: '整天都是晚上。', why: '那是冬至。你的證據：夏至時北緯 70° 白天 24 小時。' },
      { text: '整天都是白天（永晝）。', ok: true },
      { text: '晝夜一樣長。', why: '晝夜等長是春分、秋分。' }] },
    { q: '冬至中午，臺中的影子比夏至？', options: [
      { text: '短。', why: '冬至太陽比較低，影子比較長。' },
      { text: '長。', ok: true },
      { text: '一樣。', why: '太陽高度不同，影子長短也不同。' }] }
  ],
  finish: { title: '你把四季的成因弄懂了！', rule: '地軸傾斜約 23.5° 而且方向不變，地球公轉時太陽直射的緯度改變，正午太陽高度和白天長短跟著變，形成四季。', next: { label: '去潮汐實驗桌', href: '../tides/' } }
});
