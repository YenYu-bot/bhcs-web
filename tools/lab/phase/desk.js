// 熱與物態實驗桌：溫度與狀態來自 ./model.mjs（冰比熱 0.5、水比熱 1、熔化熱 80、汽化熱 540 卡／克）。
import { heat, RATE } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => heat(s);
const f = x => String(Math.round(x * 10) / 10), pct = x => Math.round(x * 100);
const STATE = r => ({ ice: '冰（固態）', melting: `冰水共存，已熔化 ${pct(r.frac)}%`, water: '水（液態）', boiling: `沸騰中，已汽化 ${pct(r.frac)}%`, steam: '全部變成水蒸氣' }[r.phase]);

function scene({ rig, el, txt, P, s, r }) {
  // 左：電熱板、燒杯、溫度計
  el('image', { href: P + 'prop-hotplate.webp', x: 110, y: 400, width: 300, height: 166 }, rig);
  const bx = 160, by = 190, bw = 200, bh = 236, level = r.phase === 'boiling' ? 150 - r.frac * 60 : r.phase === 'steam' ? 0 : 150;
  if (r.phase !== 'ice' && level) el('rect', { x: bx + 22, y: by + bh - 14 - level, width: bw - 44, height: level, rx: 6, fill: '#9FD3F2', opacity: .8 }, rig);
  const cubes = r.phase === 'ice' ? 6 : r.phase === 'melting' ? Math.ceil(6 * (1 - r.frac)) : 0;
  for (let i = 0; i < cubes; i++) el('rect', { x: bx + 34 + (i % 3) * 46, y: by + bh - 60 - Math.floor(i / 3) * 44 - (r.phase === 'melting' ? 70 : 0), width: 38, height: 38, rx: 6, fill: '#EAF6FF', stroke: '#6FA8D0', 'stroke-width': 2.5 }, rig);
  if (r.phase === 'boiling') for (let i = 0; i < 7; i++) el('circle', { cx: bx + 40 + i * 20, cy: by + bh - 30 - (i * 37 % 90), r: 5 + i % 3, fill: '#fff', stroke: '#6FA8D0', 'stroke-width': 1.5 }, rig);
  if (r.phase === 'boiling' || r.phase === 'steam') for (let i = 0; i < 3; i++) el('path', { d: `M${bx + 60 + i * 40} ${by + 10} q-14 -22 0 -44 q14 -22 0 -44`, fill: 'none', stroke: '#B8C4D6', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: .8 }, rig);
  el('image', { href: P + 'prop-beaker.webp', x: bx, y: by, width: bw, height: bh }, rig);
  el('rect', { x: 400, y: 150, width: 110, height: 44, rx: 10, fill: '#23304A' }, rig); txt(rig, 455, 179, `${f(r.temp)}°C`, { 'font-size': 20, fill: '#fff' });
  el('image', { href: P + 'prop-thermometer.webp', x: 316, y: 120, width: 34, height: 212 }, rig);
  txt(rig, 260, 590, STATE(r), { 'font-size': 16 });
  // 右：加熱曲線
  const X0 = 590, X1 = 930, Y0 = 500, Y1 = 150, tx = t => X0 + (X1 - X0) * t / 30, ty = T => Y0 - (Y0 - Y1) * (T + 20) / 130;
  el('rect', { x: X0 - 62, y: Y1 - 50, width: X1 - X0 + 90, height: Y0 - Y1 + 110, rx: 16, fill: 'rgba(255,255,255,.94)', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, (X0 + X1) / 2, Y1 - 22, `溫度－時間圖（${s.mass} g）`, { 'font-size': 16 });
  for (const T of [0, 100]) { el('path', { d: `M${X0} ${ty(T)} H${X1}`, stroke: '#C9BFAE', 'stroke-width': 1.5, 'stroke-dasharray': '6 6' }, rig); txt(rig, X0 - 10, ty(T) + 5, `${T}°C`, { 'font-size': 13, 'text-anchor': 'end', fill: '#5A6478' }); }
  el('path', { d: `M${X0} ${Y1} V${Y0} H${X1}`, fill: 'none', stroke: '#23304A', 'stroke-width': 3 }, rig);
  for (const t of [0, 10, 20, 30]) txt(rig, tx(t), Y0 + 22, `${t}`, { 'font-size': 13, fill: '#5A6478' });
  txt(rig, (X0 + X1) / 2, Y0 + 46, '加熱時間（分）', { 'font-size': 13, fill: '#5A6478' });
  let d = ''; for (let t = 0; t <= 30; t += 0.25) d += `${t ? 'L' : 'M'}${tx(t).toFixed(1)} ${ty(heat({ mass: s.mass, time: t }).temp).toFixed(1)}`;
  el('path', { d, fill: 'none', stroke: '#C8372D', 'stroke-width': 4, 'stroke-linejoin': 'round' }, rig);
  el('circle', { cx: tx(s.time), cy: ty(r.temp), r: 9, fill: '#F4C04E', stroke: '#23304A', 'stroke-width': 3 }, rig);
}

const tgt = (sig, mass, time, aim) => ({ sig, label: `${mass} g、第 ${time} 分`, aim, set: { mass, time }, title: s => `${s.mass} g，加熱 ${s.time} 分（${s.time * RATE} 卡）`, body: (s, r) => `${f(r.temp)}°C，${STATE(r)}` });
const timeCtl = list => ({ key: 'time', label: '加熱時間', type: 'seg', cols: Math.min(list.length, 5), options: list.map(t => [t, `${t} 分`]) });

runDesk({
  key: 'bhcs.lab.phase.v1', title: '熱與物態實驗桌', background: 'bg-chem-bench',
  sceneLabel: '熱與物態實驗桌：左邊是電熱板上的燒杯和溫度計，右邊是溫度隨加熱時間變化的曲線，黃點是現在的位置',
  initial: { mass: 100, time: 0 },
  model, scene, viewBox: { desk: '90 80 880 530', phone: '90 80 880 530' }, phoneText: 1.4,
  chip: { main: '加熱器每分鐘 1000 卡' },
  readouts: (s, r) => [['溫度', f(r.temp), '°C', r.phase === 'melting' ? '熔點' : r.phase === 'boiling' ? '沸點' : ''], ['已吸收熱量', String(r.Q), '卡', `${s.time} 分 × 1000`], ['狀態', { ice: '固態', melting: '固＋液', water: '液態', boiling: '液＋氣', steam: '氣態' }[r.phase], '', r.frac && r.frac < 1 ? `${pct(r.frac)}%` : '']],
  why: { title: '加熱曲線', button: '熱跑去哪裡', html: `
    <p class="fn-tip"><b>升溫：</b>吸收的熱讓粒子動得更快，溫度上升。熱量 ＝ 質量 × 比熱 × 溫度變化。</p>
    <p class="fn-tip"><b>熔化與沸騰：</b>吸收的熱用來改變狀態（拉開粒子），溫度不變，所以曲線是水平的。</p>
    <p class="fn-tip"><b>熔化熱 80 卡／克、汽化熱 540 卡／克；</b>冰的比熱約 0.5、水是 1 卡／克·°C。</p>
    <p class="fn-tip">這是簡化模型：熱量全部被吸收，氣壓是 1 大氣壓。</p>` },
  steps: [
    { id: 'melt', label: '熔化', title: '冰在熔化時，溫度會上升嗎？', goal: '100 g 的冰從 −20°C 開始加熱。收下第 3 分和第 7 分的結果。',
      intro: '按加熱時間，看溫度計和曲線上的黃點。', enter: { mass: 100, time: 0 }, controls: [timeCtl([0, 1, 3, 7, 9])],
      react: (s, r) => `${f(r.temp)}°C，${STATE(r)}。`,
      targets: [tgt('m3', 100, 3, '看第 3 分。'), tgt('m7', 100, 7, '看第 7 分。')],
      found: ['熔化時一直加熱，溫度卻停在 0°C；熱用來把冰變成水。', '第 1 到 9 分：8000 卡 ＝ 100 g × 80 卡／克'] },
    { id: 'boil', label: '沸騰', title: '水燒開以後，繼續加熱呢？', goal: '比較第 14、19、30 分。收下第 19 分和第 30 分的結果。',
      intro: '冰全部變成水了。繼續加熱，溫度會一直升嗎？', enter: { mass: 100, time: 9 }, controls: [timeCtl([9, 14, 19, 30])],
      react: (s, r) => `${f(r.temp)}°C，${STATE(r)}。`,
      targets: [tgt('b19', 100, 19, '看第 19 分。'), tgt('b30', 100, 30, '看第 30 分。')],
      found: ['水到 100°C 開始沸騰，之後溫度不再上升；熱用來把水變成水蒸氣。', '0 → 100°C：100 g × 1 × 100 ＝ 10000 卡（10 分鐘）'] },
    { id: 'mass', label: '質量加倍', title: '冰多一倍，同樣加熱 9 分鐘', goal: '加熱時間固定 9 分。比較 100 g 和 200 g，各收一張。',
      intro: '同樣的熱量，給兩倍的冰，結果一樣嗎？', enter: { mass: 100, time: 9 },
      controls: [{ key: 'mass', label: '冰的質量', type: 'seg', options: [[100, '100 g'], [200, '200 g']] }],
      react: (s, r) => `${s.mass} g：${STATE(r)}。`,
      targets: [tgt('g100', 100, 9, '看 100 g。'), tgt('g200', 200, 9, '換成 200 g。')],
      found: ['質量加倍，升溫和熔化需要的熱量都加倍，所以同樣時間還沒熔完。', '200 g：升溫 2000 卡 ＋ 熔化 16000 卡 ＝ 18000 卡'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：需要多少熱量', goal: '熔化熱 80 卡／克，水的比熱 1 卡／克·°C。', intro: '用熔化熱和比熱來算。', head: '熱量 ＝ 質量 × 熔化熱　或　質量 × 比熱 × 溫差',
      rows: [
        { id: 'm', name: '100 g、0°C 的冰全部熔化', eq: '100 × 80', answer: 8000, unit: '卡' },
        { id: 'w', name: '100 g 的水從 0°C 升到 100°C', eq: '100 × 1 × 100', answer: 10000, unit: '卡' },
        { id: 'd', name: '200 g、0°C 的冰全部熔化', eq: '200 × 80', answer: 16000, unit: '卡', hint: v => v === 8000 ? '質量是 200 g，要加倍。' : '' }],
      found: ['算對了！', '狀態變化：質量 × 熔化熱；升溫：質量 × 比熱 × 溫差'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想曲線上水平的那兩段。',
      found: ['你把加熱曲線弄懂了！', '狀態變化時吸熱但溫度不變'] }
  ],
  quiz: [
    { q: '冰熔化的過程中一直加熱，溫度卻停在 0°C，這些熱去哪裡了？', options: [
      { text: '散到空氣中浪費掉了。', why: '這個模型裡熱量全部被吸收。熱是用來把冰變成水。' },
      { text: '用來把固態變成液態，所以溫度不變。', ok: true },
      { text: '溫度計壞了。', why: '溫度計沒壞。你的證據：第 3 分和第 7 分都是 0°C，冰越來越少。' }] },
    { q: '水沸騰後把火開更大，水溫會？', options: [
      { text: '超過 100°C 繼續上升。', why: '在 1 大氣壓下，水沸騰時維持 100°C。你的證據：第 19 分和第 30 分都是 100°C。' },
      { text: '維持 100°C，只是汽化得更快。', ok: true },
      { text: '下降，因為水變少了。', why: '只要還在沸騰，溫度就維持在沸點。' }] },
    { q: '同樣加熱 9 分鐘，100 g 的冰全熔了，200 g 的冰卻還沒，原因是？', options: [
      { text: '200 g 的冰熔點比較高。', why: '熔點和質量無關，都是 0°C。' },
      { text: '質量越大，需要的熱量越多。', ok: true },
      { text: '加熱器對大塊的冰沒效。', why: '加熱器給的熱量一樣（9000 卡），是 200 g 需要 18000 卡才夠。' }] }
  ],
  finish: { title: '你把熱與物態弄懂了！', rule: '升溫時吸熱、溫度上升；熔化和沸騰時吸熱、溫度不變。需要的熱量和質量成正比。', next: { label: '去比熱實驗桌', href: '../heat/' } }
});
