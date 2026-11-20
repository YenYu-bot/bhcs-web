// 天氣系統實驗桌：高低氣壓的旋轉方向、氣流與天氣，以及鋒面的雲、雨與過境變化，全部來自 scripts/science/models.mjs 的 calculate('weather-systems')。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('weather-systems', { mode: s.mode, hemi: s.hemi, system: s.system, front: s.front, phase: s.phase });
const SYS = { high: '高氣壓', low: '低氣壓', typhoon: '颱風' }, FRONT = { cold: '冷鋒', warm: '暖鋒', stationary: '滯留鋒' }, PHASE = { before: '過境前', during: '過境中', after: '過境後' };
const ROT = { cw: '順時針', ccw: '逆時針' };

function scene({ rig, el, txt, P, s, r }) {
  const d = el('defs', {}, rig);
  for (const [k, c] of [['b', '#2F6FB0'], ['r', '#C8372D'], ['g', '#5A6478']]) { const m = el('marker', { id: 'wx-' + k, viewBox: '0 0 10 10', refX: 7, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: c }, m); }
  if (s.mode === 'pressure') {
    // 俯視：風向旋轉並向內或向外
    const cx = 300, cy = 330, low = r.flow === 'in', dir = r.rotation === 'ccw' ? -1 : 1;
    el('circle', { cx, cy, r: 190, fill: low ? 'rgba(200,215,235,.8)' : 'rgba(255,240,210,.85)', stroke: '#23304A', 'stroke-width': 3 }, rig);
    for (const rr of [70, 130, 180]) el('circle', { cx, cy, r: rr, fill: 'none', stroke: '#9FB3CC', 'stroke-width': 1.5, 'stroke-dasharray': '5 6' }, rig);
    for (let i = 0; i < 6; i++) {
      const a0 = i * Math.PI / 3, r0 = low ? 175 : 60, r1 = low ? 75 : 170, pts = [];
      for (let k = 0; k <= 12; k++) { const t = k / 12, rad = r0 + (r1 - r0) * t, a = a0 + dir * t * 1.1; pts.push(`${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`); }
      el('polyline', { points: pts.join(' '), fill: 'none', stroke: '#2F6FB0', 'stroke-width': 4, 'marker-end': 'url(#wx-b)' }, rig);
    }
    txt(rig, cx, cy + 22, s.system === 'high' ? 'H' : s.system === 'typhoon' ? '颱' : 'L', { 'font-size': 60, 'font-weight': 900, fill: s.system === 'high' ? '#2F6FB0' : '#C8372D' });
    txt(rig, cx, 116, `${s.hemi === 'north' ? '北' : '南'}半球的${SYS[s.system]}（從上往下看）`, { 'font-size': 18 });
    // 側視：上升或下沉
    el('rect', { x: 560, y: 150, width: 360, height: 340, rx: 18, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 3 }, rig);
    txt(rig, 740, 182, '側面看中心的空氣', { 'font-size': 16 });
    el('line', { x1: 580, y1: 440, x2: 900, y2: 440, stroke: '#2E6B3A', 'stroke-width': 4 }, rig);
    const up = r.vertical === 'up';
    for (const x of [700, 780]) el('path', { d: up ? `M${x} 420 V250` : `M${x} 250 V420`, stroke: up ? '#C8372D' : '#2F6FB0', 'stroke-width': 6, 'marker-end': `url(#wx-${up ? 'r' : 'b'})` }, rig);
    if (up) el('image', { href: P + (s.system === 'typhoon' ? 'prop-cloud-storm.webp' : 'prop-cloud-white.webp'), x: 660, y: s.system === 'typhoon' ? 150 : 196, width: s.system === 'typhoon' ? 160 : 160, height: s.system === 'typhoon' ? 175 : 92 }, rig);
    else el('image', { href: P + 'prop-sun.webp', x: 840, y: 196, width: 56, height: 56 }, rig);
    txt(rig, 740, 474, up ? '空氣上升、冷卻成雲 → 下雨' : '空氣下沉、增溫 → 晴朗', { 'font-size': 15, fill: up ? '#C8372D' : '#2F6FB0' });
    return;
  }
  // 鋒面剖面：冷氣團楔形在下，暖空氣沿著爬升
  el('rect', { x: 80, y: 150, width: 840, height: 330, rx: 18, fill: 'rgba(255,255,255,.9)', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('line', { x1: 100, y1: 450, x2: 900, y2: 450, stroke: '#2E6B3A', 'stroke-width': 4 }, rig);
  const slope = s.front === 'cold' ? 'M140 450 L360 450 L360 450 Q300 300 140 260 Z' : 'M140 450 L640 450 Q420 430 140 300 Z';
  el('path', { d: slope, fill: 'rgba(47,111,176,.35)', stroke: '#2F6FB0', 'stroke-width': 3 }, rig);
  txt(rig, 210, 420, '冷氣團', { 'font-size': 18, fill: '#2F6FB0' });
  txt(rig, 790, 420, '暖氣團', { 'font-size': 18, fill: '#C8372D' });
  el('path', { d: s.front === 'cold' ? 'M560 430 Q420 400 380 260' : 'M800 430 Q560 360 300 260', fill: 'none', stroke: '#C8372D', 'stroke-width': 5, 'marker-end': 'url(#wx-r)' }, rig);
  const arrow = s.front === 'cold' ? '冷氣團推進 →' : s.front === 'warm' ? '← 暖氣團推進' : '兩邊勢力相當，鋒面不太動';
  txt(rig, 500, 186, `${FRONT[s.front]}・${arrow}`, { 'font-size': 18 });
  if (s.front === 'cold') el('image', { href: P + 'prop-cloud-storm.webp', x: 300, y: 160, width: 110, height: 120 }, rig);
  else el('image', { href: P + 'prop-cloud-layer.webp', x: 200, y: 214, width: 460, height: 118 }, rig);
  for (let i = 0; i < (s.front === 'cold' ? 6 : 14); i++) { const x = (s.front === 'cold' ? 310 : 220) + i * (s.front === 'cold' ? 16 : 30); el('line', { x1: x, y1: 300, x2: x - 6, y2: 330, stroke: '#5EA9D6', 'stroke-width': 3 }, rig); }
  // 觀測站：過境前／中／後
  const ox = { before: s.front === 'warm' ? 140 : 700, during: s.front === 'cold' ? 360 : 420, after: s.front === 'warm' ? 760 : 200 }[s.phase];
  el('path', { d: `M${ox} 450 v-30 l-10 -10 h20 l-10 10`, stroke: '#23304A', 'stroke-width': 3, fill: '#F4C04E' }, rig);
  txt(rig, ox, 470, `觀測站（${PHASE[s.phase]}）`, { 'font-size': 14 });
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: s => s.mode === 'pressure' ? `${s.hemi === 'north' ? '北' : '南'}半球・${SYS[s.system]}` : `${FRONT[s.front]}・${PHASE[s.phase]}`,
  body: (s, r) => s.mode === 'pressure' ? `${ROT[r.rotation]}${r.flow === 'in' ? '吹入' : '吹出'}，中心${r.vertical === 'up' ? '上升' : '下沉'}，${r.weather}` : `${r.cloud}；${r.now}` });
const P0 = { mode: 'pressure', hemi: 'north', system: 'low', front: 'cold', phase: 'during' };

runDesk({
  key: 'bhcs.lab.weather.v1', title: '天氣系統實驗桌', background: 'bg-physics-bench',
  sceneLabel: '天氣系統實驗桌：氣壓部分從上往下看風的旋轉方向，並從側面看中心空氣上升或下沉；鋒面部分畫出冷暖氣團、雲、雨與觀測站',
  initial: { ...P0 },
  model, scene, viewBox: { desk: '80 90 860 420', phone: '80 90 860 420' }, phoneText: 1.4,
  readouts: (s, r) => s.mode === 'pressure'
    ? [['近地面風', ROT[r.rotation], '', r.flow === 'in' ? '向中心吹入' : '向外吹出'], ['中心空氣', r.vertical === 'up' ? '上升' : '下沉', ''], ['天氣', { '晴朗、穩定': '晴朗', '容易成雲致雨': '易下雨', '強風豪雨': '強風豪雨' }[r.weather] || r.weather, '', r.weather]]
    : [['鋒面', FRONT[s.front], '', PHASE[s.phase]], ['雲', r.cloud.replace(/（.*）/, '').split('，')[0], ''], ['過境後氣溫', { down: '下降', up: '上升', flat: '變化小' }[r.afterTemp], '']],
  why: { title: '氣壓與鋒面', button: '天氣怎麼變', html: `
    <p class="fn-tip"><b>高氣壓：</b>空氣從中心下沉、向外吹出，北半球順時針旋轉，天氣多半晴朗穩定。</p>
    <p class="fn-tip"><b>低氣壓：</b>空氣向中心吹入、在中心上升，上升冷卻容易成雲下雨；北半球逆時針旋轉。颱風是很強的熱帶低氣壓。南半球旋轉方向相反，吹入或吹出不變。</p>
    <p class="fn-tip"><b>冷鋒：</b>冷氣團推著暖空氣快速抬升，形成積雨雲，雨勢急而短，過境後氣溫下降。<b>暖鋒：</b>暖空氣沿冷氣團緩緩爬升，雲層廣，雨勢緩而久，過境後氣溫上升。<b>滯留鋒：</b>勢力相當、不太移動，例如臺灣的梅雨。</p>` },
  steps: [
    { id: 'pressure', label: '高低氣壓', title: '高氣壓和低氣壓，風怎麼吹？', goal: '北半球。比較高氣壓、低氣壓和颱風的風向、中心氣流和天氣，各收一張。',
      intro: '看左邊的風：是吹向中心還是向外吹？順時針還是逆時針？', enter: { ...P0 },
      controls: [{ key: 'system', label: '氣壓系統', type: 'seg', options: [['high', '高氣壓'], ['low', '低氣壓'], ['typhoon', '颱風']] }],
      react: (s, r) => `${SYS[s.system]}：${ROT[r.rotation]}${r.flow === 'in' ? '吹入' : '吹出'}，中心${r.vertical === 'up' ? '上升' : '下沉'}。`,
      targets: [tgt('ph', '高氣壓', { ...P0, system: 'high' }, '選高氣壓。'), tgt('pl', '低氣壓', { ...P0 }, '選低氣壓。'), tgt('pt', '颱風', { ...P0, system: 'typhoon' }, '選颱風。')],
      found: ['北半球高氣壓順時針吹出、中心下沉，天氣晴；低氣壓與颱風逆時針吹入、中心上升，容易下雨。', '上升冷卻成雲；下沉增溫不易成雲'] },
    { id: 'hemi', label: '南北半球', title: '到了南半球，旋轉方向一樣嗎？', goal: '比較北半球和南半球的低氣壓，各收一張。',
      intro: '澳洲在南半球。那裡的颱風（熱帶氣旋）怎麼轉？', enter: { ...P0, hemi: 'south' },
      controls: [{ key: 'hemi', label: '半球', type: 'seg', options: [['north', '北半球'], ['south', '南半球']], cols: 2 }],
      react: (s, r) => `${s.hemi === 'north' ? '北' : '南'}半球低氣壓：${ROT[r.rotation]}吹入。`,
      targets: [tgt('hn', '北半球低氣壓', { ...P0 }, '選北半球。'), tgt('hs', '南半球低氣壓', { ...P0, hemi: 'south' }, '選南半球。')],
      found: ['南半球的旋轉方向和北半球相反，但低氣壓一樣向中心吹入、中心上升。', '北半球低氣壓逆時針，南半球順時針'] },
    { id: 'front', label: '三種鋒面', title: '冷鋒、暖鋒、滯留鋒有什麼不同？', goal: '比較三種鋒面過境時的雲和雨，各收一張。',
      intro: '冷暖空氣相遇的交界就是鋒面。看看雲長什麼樣子！', enter: { ...P0, mode: 'front', front: 'cold', phase: 'during' },
      controls: [{ key: 'front', label: '鋒面', type: 'seg', options: [['cold', '冷鋒'], ['warm', '暖鋒'], ['stationary', '滯留鋒']] }],
      react: (s, r) => `${FRONT[s.front]}：${r.cloud}，${r.rain}。`,
      targets: [tgt('fc', '冷鋒', { ...P0, mode: 'front', front: 'cold', phase: 'during' }, '選冷鋒。'), tgt('fw', '暖鋒', { ...P0, mode: 'front', front: 'warm', phase: 'during' }, '選暖鋒。'), tgt('fs', '滯留鋒', { ...P0, mode: 'front', front: 'stationary', phase: 'during' }, '選滯留鋒。')],
      found: ['冷鋒：積雨雲、雨急而短；暖鋒：層狀雲、雨緩而久；滯留鋒：長時間下雨（梅雨）。', '冷空氣重，在下面；暖空氣輕，被抬升'] },
    { id: 'pass', label: '冷鋒過境', title: '冷鋒過境前後，天氣怎麼變？', goal: '冷鋒。比較過境前和過境後的天氣，各收一張。',
      intro: '冬天的冷鋒來了！過境前後，觀測站的天氣有什麼不同？', enter: { ...P0, mode: 'front', front: 'cold', phase: 'before' },
      controls: [{ key: 'phase', label: '時間', type: 'seg', options: [['before', '過境前'], ['during', '過境中'], ['after', '過境後']] }],
      react: (s, r) => `${PHASE[s.phase]}：${r.now}。`,
      targets: [tgt('pb', '過境前', { ...P0, mode: 'front', front: 'cold', phase: 'before' }, '選過境前。'), tgt('pa', '過境後', { ...P0, mode: 'front', front: 'cold', phase: 'after' }, '選過境後。')],
      found: ['冷鋒過境後由冷氣團控制，氣溫下降、氣壓上升，天氣轉晴。', '冷鋒過境：先下陣雨，再變冷'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想空氣是上升還是下沉。',
      found: ['你把天氣系統弄懂了！', '上升成雲致雨，下沉晴朗穩定'] }
  ],
  quiz: [
    { q: '北半球的高氣壓，近地面的風？', options: [
      { text: '逆時針向中心吹入。', why: '那是低氣壓。你的證據：高氣壓順時針向外吹出。' },
      { text: '順時針向外吹出。', ok: true },
      { text: '不會旋轉。', why: '受地球自轉影響，風會偏轉成旋轉的樣子。' }] },
    { q: '為什麼低氣壓附近容易下雨？', options: [
      { text: '空氣在中心上升、冷卻，水氣凝結成雲。', ok: true },
      { text: '空氣在中心下沉。', why: '下沉的空氣會增溫，不容易成雲，那是高氣壓。' },
      { text: '因為低氣壓比較冷。', why: '重點是空氣上升冷卻，水氣凝結。' }] },
    { q: '冬天冷鋒過境後，天氣通常？', options: [
      { text: '氣溫上升。', why: '那是暖鋒過境後。你的證據：冷鋒過境後由冷氣團控制，氣溫下降。' },
      { text: '氣溫下降，天氣轉晴。', ok: true },
      { text: '連續下好幾天雨。', why: '長時間下雨是滯留鋒（梅雨）的特徵。' }] }
  ],
  finish: { title: '你把天氣系統弄懂了！', rule: '高氣壓下沉、晴朗；低氣壓上升、多雨，北半球低氣壓逆時針、南半球相反。冷鋒雨急而短、過境後變冷；暖鋒雨緩而久、過境後變暖；滯留鋒久雨不停。', next: { label: '回自然實驗總覽', href: '../../science/' } }
});
