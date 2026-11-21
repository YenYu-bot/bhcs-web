// 眼睛與視力矯正實驗桌：成像位置來自 ./model.mjs。
import { eye } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const TYPE = { normal: '正常眼', myopia: '近視眼', hyperopia: '遠視眼' }, LENS = { none: '不戴眼鏡', concave: '凹透鏡', convex: '凸透鏡' }, DIST = { far: '遠方的樹', near: '近處的書' };
const WHERE = { front: '視網膜前方', on: '視網膜上', behind: '視網膜後方' };
function scene({ rig, el, txt, s, r }) {
  const cy = 300, FX = 520, PX = 13, rx = r.length * PX / 2, cx = FX + rx, RX = FX + 2 * rx, fx = FX + r.focus * PX;
  el('ellipse', { cx, cy, rx, ry: 150, fill: '#FFF4E6', stroke: '#23304A', 'stroke-width': 4 }, rig);
  el('path', { d: `M${RX - 8} ${cy - 96} A${rx} 150 0 0 1 ${RX - 8} ${cy + 96}`, fill: 'none', stroke: '#C8372D', 'stroke-width': 7 }, rig); txt(rig, RX + 44, cy - 110, '視網膜', { 'font-size': 14, fill: '#C8372D' });
  const thick = s.dist === 'near' ? 26 : 15;
  el('ellipse', { cx: FX + 26, cy, rx: thick, ry: 64, fill: '#BFE3F5', stroke: '#23304A', 'stroke-width': 3 }, rig); txt(rig, FX + 26, cy + 96, `水晶體${r.lensShape}`, { 'font-size': 13, fill: '#5A6478' });
  // 物體與光線
  const srcX = 110, rays = [-52, 52];
  if (s.dist === 'far') { txt(rig, 150, cy - 96, '來自遠方的平行光', { 'font-size': 14, fill: '#5A6478', 'text-anchor': 'start' }); el('path', { d: `M${srcX} ${cy + 80} v-60 m-26 26 l26 -40 l26 40z`, fill: '#4FAE5A', stroke: '#23304A', 'stroke-width': 2 }, rig); }
  else { el('rect', { x: srcX + 60, y: cy - 22, width: 34, height: 44, rx: 4, fill: '#F4C04E', stroke: '#23304A', 'stroke-width': 2.5 }, rig); txt(rig, srcX + 78, cy + 48, '書', { 'font-size': 14, fill: '#5A6478' }); }
  const GX = 420, EX = FX + 26, bend = s.lens === 'concave' ? 1.18 : s.lens === 'convex' ? 0.84 : 1;
  for (const dy of rays) {
    const far = s.dist === 'far', sx = far ? srcX + 40 : srcX + 94, gy = far ? dy / bend : dy / bend * (GX - sx) / (EX - sx);
    const pts = [[sx, far ? cy + gy : cy], [GX, cy + gy], [EX, cy + dy]];
    const k = (RX - 6 - EX) / (fx - EX), endY = cy + dy * (1 - k);
    pts.push(r.off > 0 ? [RX - 6, endY] : [fx, cy]); if (r.off < 0) pts.push([RX - 6, endY]);
    el('path', { d: 'M' + pts.map(q => q.map(v => v.toFixed(1)).join(' ')).join(' L'), fill: 'none', stroke: '#E0A21A', 'stroke-width': 3.5 }, rig);
    if (r.off > 0) el('path', { d: `M${RX - 6} ${endY.toFixed(1)} L${fx} ${cy}`, fill: 'none', stroke: '#E0A21A', 'stroke-width': 2.5, 'stroke-dasharray': '7 7' }, rig);
  }
  el('circle', { cx: fx, cy, r: 8, fill: r.clear ? '#2E8B66' : '#C8372D', stroke: '#23304A', 'stroke-width': 2 }, rig);
  txt(rig, fx, cy + 34, '成像位置', { 'font-size': 13, fill: r.clear ? '#2E8B66' : '#C8372D' });
  if (s.lens !== 'none') { const lx = 420;
    el('path', { d: s.lens === 'convex' ? `M${lx} ${cy - 90} Q${lx + 30} ${cy} ${lx} ${cy + 90} Q${lx - 30} ${cy} ${lx} ${cy - 90}z` : `M${lx - 16} ${cy - 90} H${lx + 16} Q${lx + 2} ${cy} ${lx + 16} ${cy + 90} H${lx - 16} Q${lx - 2} ${cy} ${lx - 16} ${cy - 90}z`, fill: '#CDEBFA', stroke: '#23304A', 'stroke-width': 3, opacity: .9 }, rig);
    txt(rig, lx, cy - 104, LENS[s.lens], { 'font-size': 14 }); }
  el('rect', { x: 220, y: 486, width: 560, height: 50, rx: 14, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, 500, 518, `${TYPE[s.type]}：像在${WHERE[r.where]}，${r.clear ? '看得清楚' : '看起來模糊'}`, { 'font-size': 17, fill: r.clear ? '#2E8B66' : '#C8372D' });
}

const tgt = (sig, label, set, aim) => ({ sig, label, set, aim, title: s => `${TYPE[s.type]}看${DIST[s.dist]}，${LENS[s.lens]}`, body: (s, r) => `像在${WHERE[r.where]}，${r.clear ? '清楚' : '模糊'}` });
const lensCtl = { key: 'lens', label: '眼鏡', type: 'seg', options: Object.entries(LENS) };

runDesk({
  key: 'bhcs.lab.eye.v1', title: '眼睛與視力矯正實驗桌',
  sceneLabel: '眼睛與視力矯正實驗桌：光線從左邊進入眼球，經過水晶體後會聚成像，圓點是成像位置，紅色弧線是視網膜',
  initial: { type: 'normal', dist: 'far', lens: 'none' },
  model: eye, scene, viewBox: { desk: '80 110 880 440', phone: '80 110 880 440' }, phoneText: 1.45,
  readouts: (s, r) => [['眼睛', TYPE[s.type], '', s.type === 'myopia' ? '眼球太長' : s.type === 'hyperopia' ? '眼球太短' : ''], ['成像位置', WHERE[r.where], '', LENS[s.lens]], ['看得清楚嗎', r.clear ? '清楚' : '模糊', '', DIST[s.dist]]],
  why: { title: '眼睛怎麼看見', button: '眼睛的構造', html: `
    <p class="fn-tip"><b>眼睛像一台相機。</b>水晶體是凸透鏡，把光會聚在視網膜上，成倒立縮小的實像，再由視神經傳到大腦。</p>
    <p class="fn-tip"><b>調節：</b>看近的東西時水晶體變厚，看遠時變薄，讓像都落在視網膜上。</p>
    <p class="fn-tip"><b>近視：</b>眼球太長（或水晶體太厚），遠處的像落在視網膜前方。戴凹透鏡讓光先發散一點，像往後移。</p>
    <p class="fn-tip"><b>遠視：</b>眼球太短，近處的像落在視網膜後方。戴凸透鏡讓光先會聚一點，像往前移。</p>
    <p class="fn-tip">這是示意模型，只比較成像位置的前後。</p>` },
  steps: [
    { id: 'normal', label: '正常眼', title: '看遠看近，眼睛怎麼對焦？', goal: '正常眼不戴眼鏡。收下看遠方和看近處的結果，注意水晶體的厚薄。',
      intro: '看遠方的樹，像落在哪裡？', enter: { type: 'normal', dist: 'far', lens: 'none' }, controls: [{ key: 'dist', label: '看什麼', type: 'seg', options: Object.entries(DIST) }],
      react: (s, r) => `水晶體${r.lensShape}，像在${WHERE[r.where]}。`,
      targets: [tgt('far', '看遠方', { type: 'normal', dist: 'far', lens: 'none' }, '看遠方的樹。'), tgt('near', '看近處', { type: 'normal', dist: 'near', lens: 'none' }, '看近處的書。')],
      found: ['正常眼靠水晶體變厚、變薄來調節，遠近的像都落在視網膜上。', '看近：水晶體變厚；看遠：變薄'] },
    { id: 'myopia', label: '近視', title: '近視眼看遠方，問題出在哪？', goal: '近視眼看遠方。收下不戴眼鏡和戴凹透鏡的結果；也可以試試戴錯的凸透鏡。',
      intro: '近視眼的眼球比較長。像落在哪裡？', enter: { type: 'myopia', dist: 'far', lens: 'none' }, controls: [lensCtl],
      react: (s, r) => `像在${WHERE[r.where]}，${r.clear ? '清楚了！' : '還是模糊。'}`,
      targets: [tgt('none', '不戴眼鏡', { type: 'myopia', dist: 'far', lens: 'none' }, '先看不戴眼鏡。'), tgt('fix', '戴凹透鏡', { type: 'myopia', dist: 'far', lens: 'concave' }, '戴上凹透鏡。')],
      found: ['近視的像落在視網膜前方；凹透鏡讓光先發散，像往後移到視網膜上。', '近視 → 凹透鏡'] },
    { id: 'hyperopia', label: '遠視', title: '遠視眼看近處，要戴哪種鏡片？', goal: '遠視眼看近處的書。收下不戴眼鏡和戴凸透鏡的結果。',
      intro: '遠視眼的眼球比較短。像落在哪裡？', enter: { type: 'hyperopia', dist: 'near', lens: 'none' }, controls: [lensCtl],
      react: (s, r) => `像在${WHERE[r.where]}，${r.clear ? '清楚了！' : '還是模糊。'}`,
      targets: [tgt('none', '不戴眼鏡', { type: 'hyperopia', dist: 'near', lens: 'none' }, '先看不戴眼鏡。'), tgt('fix', '戴凸透鏡', { type: 'hyperopia', dist: 'near', lens: 'convex' }, '戴上凸透鏡。')],
      found: ['遠視的像落在視網膜後方；凸透鏡讓光先會聚，像往前移到視網膜上。', '遠視 → 凸透鏡'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想成像位置在視網膜的前面還是後面。',
      found: ['你把視力矯正弄懂了！', '近視配凹透鏡；遠視配凸透鏡'] }
  ],
  quiz: [
    { q: '近視的人看不清楚遠方，是因為遠處物體的像落在？', options: [
      { text: '視網膜前方。', ok: true },
      { text: '視網膜後方。', why: '落在後方的是遠視。你的證據：近視眼不戴眼鏡時，像在視網膜前方。' },
      { text: '水晶體上。', why: '光通過水晶體後才會聚成像，像不會落在水晶體上。' }] },
    { q: '近視眼鏡是凹透鏡，它的作用是？', options: [
      { text: '把東西放大。', why: '放大是凸透鏡（放大鏡）的效果。凹透鏡是讓光線先發散一點。' },
      { text: '讓光線先發散，使像往後移到視網膜上。', ok: true },
      { text: '讓光線更會聚。', why: '近視的像已經太前面了，再會聚會更前面。你可以回去試戴凸透鏡看看。' }] },
    { q: '看近處的書時，正常眼的水晶體會？', options: [
      { text: '變薄。', why: '看遠才變薄。你的證據：看近處的書時水晶體變厚。' },
      { text: '變厚，讓近處的光也能會聚在視網膜上。', ok: true },
      { text: '不變，靠眼球前後移動。', why: '人眼是靠改變水晶體的厚薄來調節，眼球不會前後移動。' }] }
  ],
  finish: { title: '你把視力矯正弄懂了！', rule: '水晶體是凸透鏡，把光會聚在視網膜上。近視：像在視網膜前方，戴凹透鏡。遠視：像在視網膜後方，戴凸透鏡。', next: { label: '去透鏡成像實驗桌', href: '../lens/' } }
});
