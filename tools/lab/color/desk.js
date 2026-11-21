// 色光與顏料實驗桌：混色結果來自 ./model.mjs。
import { color, OBJECT, LIGHT } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const swatch = (el, txt, rig, x, y, o, label) => {
  el('rect', { x: x - 150, y, width: 300, height: 54, rx: 14, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('rect', { x: x - 136, y: y + 10, width: 34, height: 34, rx: 8, fill: o.hex, stroke: '#23304A', 'stroke-width': 2 }, rig);
  txt(rig, x + 18, y + 34, `${label}：${o.name}`, { 'font-size': 18 });
};
function scene({ rig, el, txt, s, r, step }) {
  if (step === 'pigment') {
    el('rect', { x: 280, y: 90, width: 440, height: 360, rx: 16, fill: '#FFFFFF', stroke: '#23304A', 'stroke-width': 3 }, rig);
    const g = el('g', { style: 'isolation:isolate' }, rig);
    const blob = (on, cx, cy, fill, name) => { if (on) el('circle', { cx, cy, r: 105, fill, style: 'mix-blend-mode:multiply' }, g); txt(rig, cx === 500 ? 500 : cx < 500 ? 322 : 678, cx === 500 ? 440 : 122, name, { 'font-size': 15, fill: on ? '#23304A' : '#B8AC98' }); };
    blob(s.c, 440, 220, '#00FFFF', '青'); blob(s.m, 560, 220, '#FF00FF', '洋紅'); blob(s.y, 500, 320, '#FFFF00', '黃');
    txt(rig, 500, 76, '白紙上疊顏料', { 'font-size': 15, fill: '#5A6478' });
    swatch(el, txt, rig, 500, 476, r.pigment, '重疊處看起來');
  } else if (step === 'object') {
    const [oname] = OBJECT[s.object], L = LIGHT[s.light], lhex = { white: '#FFF6C9', red: '#FF8A80', green: '#8FE39B', blue: '#8FA8FF' }[s.light];
    el('rect', { x: 180, y: 80, width: 640, height: 380, rx: 16, fill: '#16181D' }, rig);
    el('path', { d: 'M500 96 L360 400 H640z', fill: lhex, opacity: .35 }, rig);
    el('rect', { x: 462, y: 76, width: 76, height: 34, rx: 8, fill: '#8A93A3', stroke: '#23304A', 'stroke-width': 3 }, rig); txt(rig, 500, 66, `手電筒：${L[0]}`, { 'font-size': 15 });
    const fill = r.seen.hex;
    if (s.object === 'apple') { el('circle', { cx: 500, cy: 340, r: 58, fill, stroke: '#444', 'stroke-width': 2 }, rig); el('path', { d: 'M500 286 q6 -22 22 -26', fill: 'none', stroke: '#6B4A2B', 'stroke-width': 5, 'stroke-linecap': 'round' }, rig); }
    else if (s.object === 'leaf') el('path', { d: 'M420 350 Q500 240 590 330 Q500 420 420 350z', fill, stroke: '#444', 'stroke-width': 2 }, rig);
    else el('rect', { x: 430, y: 290, width: 140, height: 100, fill, stroke: '#444', 'stroke-width': 2, transform: 'rotate(-6 500 340)' }, rig);
    txt(rig, 500, 440, oname, { 'font-size': 15, fill: '#fff' });
    swatch(el, txt, rig, 500, 476, r.seen, '看起來');
  } else {
    el('rect', { x: 280, y: 90, width: 440, height: 360, rx: 16, fill: '#000000', stroke: '#23304A', 'stroke-width': 3 }, rig);
    const g = el('g', { style: 'isolation:isolate' }, rig); el('rect', { x: 282, y: 92, width: 436, height: 356, rx: 14, fill: '#000' }, g);
    const spot = (on, cx, cy, fill, name) => { if (on) el('circle', { cx, cy, r: 105, fill, style: 'mix-blend-mode:screen' }, g); txt(rig, cx === 500 ? 500 : cx < 500 ? 326 : 674, cx === 500 ? 440 : 122, name, { 'font-size': 15, fill: on ? '#fff' : '#6B7385' }); };
    spot(s.r, 440, 220, '#FF0000', '紅光'); spot(s.g, 560, 220, '#00FF00', '綠光'); spot(s.b, 500, 320, '#0000FF', '藍光');
    txt(rig, 500, 76, '暗室裡的白色屏幕', { 'font-size': 15, fill: '#5A6478' });
    swatch(el, txt, rig, 500, 476, r.light, '重疊處看起來');
  }
}

const sw = (key, label) => ({ key, label, type: 'seg', options: [[false, '關'], [true, '開']] });
const pg = (key, label) => ({ key, label, type: 'seg', options: [[false, '不塗'], [true, '塗上']] });
const on = (s, keys, names) => keys.map((k, i) => s[k] ? names[i] : '').filter(Boolean).join('＋') || '都沒有';
const LN = ['紅光', '綠光', '藍光'], PN = ['青', '洋紅', '黃'];

runDesk({
  key: 'bhcs.lab.color.v1', title: '色光與顏料實驗桌',
  sceneLabel: '色光與顏料實驗桌：三個圓形的色光或顏料互相重疊，下方的色塊和文字寫出重疊處的顏色',
  initial: { r: true, g: false, b: false, c: false, m: false, y: false, object: 'apple', light: 'white' },
  model: color, scene, viewBox: { desk: '160 40 680 510', phone: '160 40 680 510' }, phoneText: 1.3,
  readouts: (s, r) => [['色光重疊', r.light.name, '', on(s, ['r', 'g', 'b'], LN)], ['顏料重疊', r.pigment.name, '', on(s, ['c', 'm', 'y'], PN)], ['物體看起來', r.seen.name, '', `${OBJECT[s.object][0]}＋${LIGHT[s.light][0]}`]],
  why: { title: '光和顏料的三原色', button: '三原色', html: `
    <p class="fn-tip"><b>色光三原色：紅、綠、藍。</b>色光越加越亮，三種一起就是白光。紅＋綠＝黃、綠＋藍＝青、紅＋藍＝洋紅。</p>
    <p class="fn-tip"><b>顏料三原色：青、洋紅、黃。</b>顏料會吸收一部分色光，越混吸收越多、越暗，三種一起接近黑色。</p>
    <p class="fn-tip"><b>物體的顏色</b>是它反射出來的色光。紅蘋果只反射紅光；照到的光裡沒有紅光，它就沒有光可以反射，看起來是黑的。</p>
    <p class="fn-tip">螢幕顯示的顏色和真正的色光、顏料會有一點差別，請以文字寫的顏色名稱為準。</p>` },
  steps: [
    { id: 'light', label: '色光相加', title: '兩種色光疊在一起，變什麼顏色？', goal: '開關三盞燈。收下「紅＋綠」「綠＋藍」「紅＋綠＋藍」三種結果。',
      intro: '現在只有紅光。再打開綠光看看重疊的地方。', enter: { r: true, g: false, b: false }, controls: [sw('r', '紅光'), sw('g', '綠光'), sw('b', '藍光')],
      react: (s, r) => `${on(s, ['r', 'g', 'b'], LN)}：${r.light.name}。`,
      targets: [[1, 1, 0, '紅＋綠'], [0, 1, 1, '綠＋藍'], [1, 1, 1, '紅＋綠＋藍']].map(([r, g, b, label]) => ({ sig: `${r}${g}${b}`, label, aim: `試「${label}」。`, set: { r: !!r, g: !!g, b: !!b }, title: s => on(s, ['r', 'g', 'b'], LN), body: (s, q) => `重疊處是${q.light.name}` })),
      found: ['色光越加越亮：紅＋綠＝黃、綠＋藍＝青，三種一起變成白光。', '紅＋綠＋藍 ＝ 白'] },
    { id: 'pigment', label: '顏料相減', title: '顏料混在一起，為什麼越混越暗？', goal: '在白紙上塗顏料。收下「青＋洋紅」「洋紅＋黃」「三種都塗」三種結果。',
      intro: '顏料和色光不一樣。先塗青色和洋紅色。', enter: { c: true, m: false, y: false }, controls: [pg('c', '青色顏料'), pg('m', '洋紅色顏料'), pg('y', '黃色顏料')],
      react: (s, r) => `${on(s, ['c', 'm', 'y'], PN)}：${r.pigment.name}。`,
      targets: [[1, 1, 0, '青＋洋紅'], [0, 1, 1, '洋紅＋黃'], [1, 1, 1, '三種都塗']].map(([c, m, y, label]) => ({ sig: `${c}${m}${y}`, label, aim: `試「${label}」。`, set: { c: !!c, m: !!m, y: !!y }, title: s => on(s, ['c', 'm', 'y'], PN), body: (s, q) => `重疊處是${q.pigment.name}` })),
      found: ['每種顏料都會吸收一部分色光，混越多、反射出來的光越少，所以越暗。', '青＋洋紅＝藍、洋紅＋黃＝紅、三種＝黑'] },
    { id: 'object', label: '物體顏色', title: '紅蘋果在綠光下是什麼顏色？', goal: '換物體和手電筒的光。收下「紅蘋果＋白光」「紅蘋果＋綠光」「白紙＋綠光」。',
      intro: '在暗室裡用不同顏色的光照物體。', enter: { object: 'apple', light: 'white' },
      controls: [{ key: 'object', label: '物體', type: 'seg', options: Object.entries(OBJECT).map(([k, [n]]) => [k, n]) }, { key: 'light', label: '手電筒的光', type: 'seg', options: ['white', 'red', 'green'].map(k => [k, LIGHT[k][0]]) }],
      react: (s, r) => `${OBJECT[s.object][0]}在${LIGHT[s.light][0]}下看起來${r.seen.name}。`,
      targets: [['apple', 'white'], ['apple', 'green'], ['paper', 'green']].map(([object, light]) => ({ sig: object + light, label: `${OBJECT[object][0]}＋${LIGHT[light][0]}`, aim: `試${OBJECT[object][0]}和${LIGHT[light][0]}。`, set: { object, light }, title: s => `${OBJECT[s.object][0]}＋${LIGHT[s.light][0]}`, body: (s, q) => `看起來${q.seen.name}` })),
      found: ['物體只能反射它會反射的色光。紅蘋果在綠光下沒有紅光可反射，所以是黑的；白紙什麼光都反射。', '看到的顏色 ＝ 照到的光裡，物體反射出來的部分'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想色光和顏料哪裡不一樣。',
      found: ['你把色光和顏料弄懂了！', '色光相加變亮；顏料相減變暗'] }
  ],
  quiz: [
    { q: '舞台上紅色和綠色的聚光燈照在同一塊白布上，重疊處看起來是？', options: [
      { text: '咖啡色。', why: '那是顏料混色的經驗。色光是相加的，你的證據：紅光＋綠光＝黃色。' },
      { text: '黃色。', ok: true },
      { text: '黑色。', why: '色光越加越亮，不會變黑。' }] },
    { q: '為什麼三種顏料混在一起接近黑色，三種色光混在一起卻是白色？', options: [
      { text: '顏料吸收色光，越混反射越少；色光是直接相加，越加越亮。', ok: true },
      { text: '因為顏料比較濃。', why: '和濃淡無關。顏料是靠吸收色光來顯色，混越多吸收越多。' },
      { text: '因為光沒有顏色。', why: '光有顏色。差別在色光相加、顏料相減。' }] },
    { q: '只有藍光的房間裡，一顆紅蘋果看起來是？', options: [
      { text: '紅色，蘋果本來就是紅的。', why: '紅蘋果只會反射紅光。藍光裡沒有紅光，它沒有光可以反射。' },
      { text: '紫色，紅加藍。', why: '蘋果不會發光，只能反射照到的光，不會把紅色「加」上去。' },
      { text: '接近黑色。', ok: true }] }
  ],
  finish: { title: '你把色光和顏料弄懂了！', rule: '色光三原色紅、綠、藍，相加變亮，全部加起來是白。顏料三原色青、洋紅、黃，吸收色光，越混越暗。物體的顏色是它反射的色光。', next: { label: '去光的反射與折射實驗桌', href: '../reflection-refraction/' } }
});
