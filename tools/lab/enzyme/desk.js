// 酵素實驗桌：活性、最適 pH 與是否變性全部來自 scripts/science/models.mjs 的 calculate('enzyme')（教學模型）。
// 試管顏色用碘液示意：活性高，澱粉（或蛋白質）被分解得多；顏色深淺依活性按比例畫出。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('enzyme', { enzyme: s.enzyme, temp: s.temp, ph: s.ph, conc: 1, heatDenatured: s.heated });
const NAME = { amylase: '唾液澱粉酶', pepsin: '胃蛋白酶' };
const pct = r => Math.round(Math.min(1, r.act) * 100);
const mix = (a, b, k) => '#' + [0, 2, 4].map(i => Math.round(parseInt(a.slice(1 + i, 3 + i), 16) * (1 - k) + parseInt(b.slice(1 + i, 3 + i), 16) * k).toString(16).padStart(2, '0')).join('');

function scene({ rig, el, txt, P, s, r }) {
  // 水浴＋試管
  el('rect', { x: 120, y: 260, width: 300, height: 220, rx: 18, fill: s.temp >= 60 ? 'rgba(240,150,120,.55)' : s.temp <= 5 ? 'rgba(190,220,250,.7)' : 'rgba(214,236,246,.75)', stroke: '#23304A', 'stroke-width': 4 }, rig);
  txt(rig, 134, 290, `水浴 ${s.temp} °C`, { 'font-size': 17, 'text-anchor': 'start' });
  if (s.heated) txt(rig, 134, 316, '（先加熱到 60 °C 再冷卻）', { 'font-size': 13, 'text-anchor': 'start', fill: '#C8372D' });
  const k = Math.min(1, r.act), sub = s.enzyme === 'pepsin' ? '蛋白質' : '澱粉';
  const col = s.enzyme === 'pepsin' ? mix('#E9E4D2', '#F8F4EA', k) : mix('#1F2A6B', '#E5C27A', k);
  el('path', { d: 'M240 150 v260 a30 30 0 0 0 60 0 v-260', fill: 'rgba(255,255,255,.4)', stroke: '#23304A', 'stroke-width': 4 }, rig);
  el('path', { d: 'M244 300 v110 a26 26 0 0 0 52 0 v-110 z', fill: col }, rig);
  if (s.enzyme === 'pepsin' && k < .5) for (let i = 0; i < 6; i++) el('rect', { x: 252 + (i % 3) * 13, y: 360 + Math.floor(i / 3) * 20, width: 10, height: 10, rx: 2, fill: '#F7F1DE', stroke: '#B8AC98' }, rig);
  txt(rig, 270, 510, s.enzyme === 'pepsin' ? `蛋白質（蛋白塊）${k >= .5 ? '被分解了' : '還在'}` : `加碘液：${k >= .5 ? '不變藍（澱粉被分解了）' : '藍黑色（澱粉還在）'}`, { 'font-size': 15, fill: '#23304A' });
  // 酵素的形狀
  el('rect', { x: 470, y: 130, width: 440, height: 210, rx: 18, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('image', { href: P + (r.den ? 'prop-enzyme-denatured.webp' : 'prop-enzyme-normal.webp'), x: 500, y: 150, width: 200, height: r.den ? 155 : 145 }, rig);
  el('image', { href: P + 'prop-substrate.webp', x: 730, y: 190, width: 130, height: 83, opacity: r.den ? .9 : .6 }, rig);
  txt(rig, 600, 326, r.den ? '形狀被破壞（變性）' : '形狀完整', { 'font-size': 15, fill: r.den ? '#C8372D' : '#2E8B66' });
  txt(rig, 795, 300, sub, { 'font-size': 15, fill: '#5A6478' });
  // 活性條
  el('rect', { x: 470, y: 370, width: 440, height: 120, rx: 18, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, 490, 402, `${NAME[s.enzyme]}的活性（相對）`, { 'text-anchor': 'start', 'font-size': 16 });
  el('rect', { x: 490, y: 420, width: 400, height: 34, rx: 8, fill: '#F2EBDD' }, rig);
  el('rect', { x: 490, y: 420, width: 4 * pct(r), height: 34, rx: 8, fill: r.den ? '#B8AC98' : '#2E8B66' }, rig);
  txt(rig, 880, 444, `${pct(r)}%`, { 'text-anchor': 'end', 'font-size': 18, 'font-weight': 900 });
  txt(rig, 690, 478, `最適 pH ${r.opt}、最適溫度約 37 °C；現在 pH ${s.ph}`, { 'font-size': 14, fill: '#5A6478' });
}

const tgt = (sig, label, set, aim) => ({ sig, label, aim, set,
  title: s => `${NAME[s.enzyme]}・${s.temp} °C・pH ${s.ph}${s.heated ? '・加熱過' : ''}`,
  body: (s, r) => r.den ? '變性，活性 0（冷卻也回不來）' : `活性 ${pct(r)}%` });
const BASE = { enzyme: 'amylase', temp: 37, ph: 7, heated: false };

runDesk({
  key: 'bhcs.lab.enzyme.v1', title: '酵素實驗桌', background: 'bg-chem-bench',
  sceneLabel: '酵素實驗桌：左邊是放在水浴裡的試管，用碘液顏色看澱粉有沒有被分解；右邊是酵素的形狀和活性長條',
  initial: { ...BASE },
  model, scene, viewBox: { desk: '100 110 830 430', phone: '100 110 830 430' }, phoneText: 1.4,
  readouts: (s, r) => [['溫度', s.temp, '°C', s.heated ? '加熱過再冷卻' : ''], ['pH', s.ph, '', `最適 pH ${r.opt}`], ['活性', pct(r), '%', r.den ? '已變性' : NAME[s.enzyme]]],
  why: { title: '酵素的特性', button: '酵素怎麼作用', html: `
    <p class="fn-tip"><b>酵素是蛋白質，能加快體內的化學反應，</b>例如唾液澱粉酶把澱粉分解成麥芽糖，胃蛋白酶分解蛋白質。</p>
    <p class="fn-tip"><b>溫度：</b>人體的酵素在約 37 °C 活性最好；太冷活性很低，但回暖後可以恢復；太熱（約 60 °C 以上）酵素的形狀被破壞（變性），冷卻後也回不來。</p>
    <p class="fn-tip"><b>pH：</b>每種酵素有最適的酸鹼度。唾液澱粉酶在中性（pH 7）最好，胃蛋白酶在強酸（pH 2）最好。</p>
    <p class="fn-tip">碘液遇澱粉呈藍黑色；澱粉被分解後就不變藍。模型說明：活性是教學模型的相對值。</p>` },
  steps: [
    { id: 'temp', label: '溫度', title: '溫度高低，酵素活性怎麼變？', goal: '唾液澱粉酶加澱粉，放進 0 °C、37 °C、60 °C 的水浴，看碘液顏色和活性，各收一張。',
      intro: '把試管放進不同溫度的水浴，10 分鐘後加碘液看看！', enter: { ...BASE },
      controls: [{ key: 'temp', label: '水浴溫度', type: 'seg', options: [[0, '0 °C'], [37, '37 °C'], [60, '60 °C']] }],
      react: (s, r) => r.den ? '60 °C：酵素變性了，澱粉沒被分解。' : `${s.temp} °C：活性 ${pct(r)}%。`,
      targets: [tgt('t0', '0 °C', { ...BASE, temp: 0 }, '選 0 °C。'), tgt('t37', '37 °C', { ...BASE }, '選 37 °C。'), tgt('t60', '60 °C', { ...BASE, temp: 60 }, '選 60 °C。')],
      found: ['37 °C 活性最好；0 °C 很慢；60 °C 酵素變性，失去作用。', '碘液不變藍 ＝ 澱粉被分解了'] },
    { id: 'cool', label: '冷卻後', title: '加熱過的酵素，冷卻後會恢復嗎？', goal: '都在 37 °C 下比較：新的酵素，和先加熱到 60 °C 再冷卻的酵素，各收一張。',
      intro: '把 60 °C 的酵素冷卻回 37 °C，它會恢復活性嗎？', enter: { ...BASE, heated: true },
      controls: [{ key: 'heated', label: '酵素', type: 'seg', options: [[false, '新的酵素'], [true, '加熱過再冷卻']], cols: 2 }],
      react: (s, r) => r.den ? '加熱過的酵素形狀已經壞了，冷卻也回不來。' : '新的酵素在 37 °C 活性最好。',
      targets: [tgt('fresh', '新的酵素', { ...BASE }, '選「新的酵素」。'), tgt('heat', '加熱過再冷卻', { ...BASE, heated: true }, '選「加熱過再冷卻」。')],
      found: ['高溫變性是不可逆的：冷卻後酵素也不會恢復。', '低溫只是變慢，高溫是破壞形狀'] },
    { id: 'ph', label: '酸鹼度', title: '不同的酵素，喜歡不同的 pH？', goal: '比較唾液澱粉酶在 pH 7 和 pH 2，以及胃蛋白酶在 pH 2，各收一張。',
      intro: '胃裡很酸（pH 約 2），唾液澱粉酶到了胃還能作用嗎？', enter: { ...BASE },
      controls: [{ key: 'enzyme', label: '酵素', type: 'seg', options: [['amylase', '唾液澱粉酶'], ['pepsin', '胃蛋白酶']], cols: 2 }, { key: 'ph', label: 'pH', type: 'seg', options: [[2, 'pH 2（強酸）'], [7, 'pH 7（中性）']], cols: 2 }],
      react: (s, r) => `${NAME[s.enzyme]}在 pH ${s.ph}：活性 ${pct(r)}%。`,
      targets: [tgt('a7', '唾液澱粉酶・pH 7', { ...BASE }, '選唾液澱粉酶、pH 7。'), tgt('a2', '唾液澱粉酶・pH 2', { ...BASE, ph: 2 }, '把 pH 改成 2。'), tgt('p2', '胃蛋白酶・pH 2', { ...BASE, enzyme: 'pepsin', ph: 2 }, '換成胃蛋白酶、pH 2。')],
      found: ['唾液澱粉酶在中性最好、到強酸就不作用；胃蛋白酶正好相反。', '每種酵素有自己的最適 pH'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想酵素的形狀。',
      found: ['你把酵素的特性弄懂了！', '溫度和 pH 都會影響酵素；高溫變性回不來'] }
  ],
  quiz: [
    { q: '唾液澱粉酶在 0 °C 和 60 °C 都幾乎不作用，差別在哪裡？', options: [
      { text: '沒有差別，都是溫度不對。', why: '你的證據：60 °C 的酵素冷卻後也回不來，0 °C 只是變慢。' },
      { text: '0 °C 回暖後能恢復，60 °C 變性後不能恢復。', ok: true },
      { text: '0 °C 才會變性。', why: '低溫只讓反應變慢，高溫才會破壞酵素的形狀。' }] },
    { q: '試管加碘液後呈藍黑色，表示？', options: [
      { text: '澱粉已經被分解了。', why: '碘液遇澱粉變藍黑色，表示澱粉還在，酵素沒作用。' },
      { text: '澱粉還在，酵素沒有作用。', ok: true },
      { text: '酵素活性最好。', why: '活性好時澱粉被分解，加碘液不會變藍。' }] },
    { q: '胃蛋白酶在哪個 pH 活性最好？', options: [
      { text: 'pH 7', why: '那是唾液澱粉酶。你的證據：胃蛋白酶在 pH 2 活性最好。' },
      { text: 'pH 2', ok: true },
      { text: 'pH 12', why: '胃液是強酸，胃蛋白酶喜歡酸性環境。' }] }
  ],
  finish: { title: '你把酵素的特性弄懂了！', rule: '酵素在適當的溫度（約 37 °C）和 pH 下活性最好。低溫變慢可恢復；高溫使酵素變性，不能恢復。不同酵素的最適 pH 不同。', next: { label: '去植物氣體交換實驗桌', href: '../plant-exchange/' } }
});
