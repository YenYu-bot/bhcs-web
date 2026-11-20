// 原子結構實驗桌：元素、質量數、電荷、電子層全部來自 scripts/science/models.mjs 的 calculate('atom-builder')。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('atom-builder', { p: s.p, n: s.n, e: s.e });
const chg = r => r.charge === 0 ? '0' : (r.charge > 0 ? '+' : '−') + Math.abs(r.charge);
const kindText = r => r.kind === 'neutral' ? '原子（電中性）' : r.kind === 'cation' ? `陽離子 ${r.ion}` : `陰離子 ${r.ion}`;

function scene({ rig, el, txt, P, s, r }) {
  const cx = 360, cy = 320, radii = [92, 140, 188, 236];
  // 電子層
  r.shells.forEach((count, i) => {
    el('circle', { cx, cy, r: radii[i], fill: 'none', stroke: '#9FB3CC', 'stroke-width': 2, 'stroke-dasharray': '6 6' }, rig);
    for (let k = 0; k < count; k++) { const a = -Math.PI / 2 + k / count * 2 * Math.PI + i * .3; el('image', { href: P + 'item-electron.webp', x: cx + radii[i] * Math.cos(a) - 13, y: cy + radii[i] * Math.sin(a) - 13, width: 26, height: 26 }, rig); }
  });
  // 原子核：質子與中子交錯排成一團
  const total = s.p + s.n, parts = [];
  for (let i = 0; i < Math.max(s.p, s.n); i++) { if (i < s.p) parts.push('p'); if (i < s.n) parts.push('n'); }
  const R = 8 + Math.sqrt(total) * 9;
  el('circle', { cx, cy, r: R + 12, fill: 'rgba(255,248,236,.9)', stroke: '#C8372D', 'stroke-width': 2 }, rig);
  parts.forEach((kind, i) => {
    const a = i * 2.39996, d = Math.sqrt(i + .5) / Math.sqrt(total) * R;
    el('image', { href: P + (kind === 'p' ? 'item-proton.webp' : 'item-neutron.webp'), x: cx + d * Math.cos(a) - 12, y: cy + d * Math.sin(a) - 12, width: 24, height: 24 }, rig);
  });
  // 資料卡
  const x = 640, y = 110;
  el('rect', { x, y, width: 270, height: 330, rx: 18, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, x + 135, y + 40, r.name, { 'font-size': 20 });
  txt(rig, x + 135, y + 122, r.symbol, { 'font-size': 76, 'font-weight': 900, fill: '#2F6FB0' });
  txt(rig, x + 62, y + 70, String(r.A), { 'font-size': 20, fill: '#5A6478' });
  txt(rig, x + 62, y + 150, String(s.p), { 'font-size': 20, fill: '#5A6478' });
  if (r.charge) txt(rig, x + 214, y + 70, chg(r), { 'font-size': 22, fill: '#C8372D' });
  txt(rig, x + 135, y + 196, kindText(r), { 'font-size': 17 });
  txt(rig, x + 135, y + 228, `質子 ${s.p}・中子 ${s.n}・電子 ${s.e}`, { 'font-size': 15, fill: '#5A6478' });
  txt(rig, x + 135, y + 258, `電子層：${r.shells.join('、') || '無'}`, { 'font-size': 15, fill: '#5A6478' });
  txt(rig, x + 135, y + 290, r.isotope === 'most' ? '最常見的同位素' : r.isotope === 'common' ? `同位素 ${r.symbol}-${r.A}` : '不常見的中子數', { 'font-size': 15, fill: r.isotope === 'unusual' ? '#C8372D' : '#2E8B66' });
  // 圖例
  el('rect', { x: 120, y: 566, width: 460, height: 48, rx: 24, fill: 'rgba(255,255,255,.95)', stroke: '#23304A', 'stroke-width': 2 }, rig);
  for (const [i, [img, t]] of [['item-proton', '質子 ＋'], ['item-neutron', '中子'], ['item-electron', '電子 −']].entries()) {
    el('image', { href: P + img + '.webp', x: 140 + i * 150, y: 578, width: 26, height: 26 }, rig);
    txt(rig, 200 + i * 150, 597, t, { 'font-size': 15, fill: '#23304A' });
  }
}

const sym = (p, n, e) => { const r = calculate('atom-builder', { p, n, e }); return `${r.symbol}${r.charge ? r.ion.slice(r.symbol.length) : ''}`; };
const tgt = (sig, label, p, n, e, aim) => ({ sig, label, aim, set: { p, n, e },
  title: (s, r) => `${r.name} ${r.charge ? r.ion : r.symbol}（${r.symbol}-${r.A}）`,
  body: (s, r) => `質子 ${s.p}、中子 ${s.n}、電子 ${s.e}；${r.charge ? '電荷 ' + chg(r) : '電中性'}` });
const counts = [{ key: 'p', label: '質子數', type: 'num', min: 1, max: 20, step: 1 }, { key: 'n', label: '中子數', type: 'num', min: 0, max: 24, step: 1 }, { key: 'e', label: '電子數', type: 'num', min: 0, max: 20, step: 1 }];

runDesk({
  key: 'bhcs.lab.atom.v1', title: '原子結構實驗桌', background: 'bg-chem-bench',
  sceneLabel: '原子結構實驗桌：中間是質子和中子組成的原子核，外面的電子層排著電子；右邊的卡片顯示元素符號、質量數與電荷',
  initial: { p: 6, n: 6, e: 6 },
  model, scene, viewBox: { desk: '90 70 840 550', phone: '100 70 820 550' }, phoneText: 1.5,
  readouts: (s, r) => [['元素', r.symbol, r.name, '由質子數決定'], ['質量數 A', r.A, '', `質子 ${s.p} ＋ 中子 ${s.n}`], ['電荷', chg(r), '', `質子 ${s.p} − 電子 ${s.e}`]],
  why: { title: '原子的構造', button: '原子怎麼看', html: `
    <p class="fn-tip"><b>原子 ＝ 原子核（質子＋中子）＋ 核外電子。</b>質子帶正電、電子帶負電、中子不帶電。</p>
    <p class="fn-tip"><b>質子數決定是哪一種元素</b>（原子序）。質量數 ＝ 質子數 ＋ 中子數。</p>
    <p class="fn-tip"><b>離子：</b>電子比質子少是陽離子（例如 Na⁺），電子比質子多是陰離子（例如 Cl⁻）。只有電子數改變，元素不變。</p>
    <p class="fn-tip"><b>同位素：</b>質子數相同、中子數不同，例如 C-12、C-13、C-14，都是碳。</p>
    <p class="fn-tip">模型說明：只列前 20 個元素；電子層依國中常用的 2、8、8 排列，圖不是真實比例。</p>` },
  steps: [
    { id: 'element', label: '質子決定元素', title: '換質子數，元素會變嗎？', goal: '用＋／−調整粒子數。先做出碳原子（6、6、6），再做出氧原子（8、8、8），各收一張。',
      intro: '現在是碳原子。把質子加到 8，會變成什麼元素？', enter: { p: 6, n: 6, e: 6 }, controls: counts,
      react: (s, r) => `質子 ${s.p} 個，所以是${r.name}（${r.symbol}）。`,
      targets: [tgt('c', '碳原子 6・6・6', 6, 6, 6, '做出碳原子：質子 6、中子 6、電子 6。'), tgt('o', '氧原子 8・8・8', 8, 8, 8, '做出氧原子：質子 8、中子 8、電子 8。')],
      found: ['質子數決定元素：6 個是碳，8 個是氧。', '質量數 ＝ 質子 ＋ 中子：碳 12、氧 16'] },
    { id: 'ion', label: '離子', title: '電子多了或少了，會變成什麼？', goal: '從鈉原子開始。拿走 1 個電子做出 Na⁺；再做出 Cl⁻（質子 17、中子 18、電子 18），各收一張。',
      intro: '這是鈉原子（11、12、11）。拿走一個電子試試。', enter: { p: 11, n: 12, e: 11 }, controls: counts,
      react: (s, r) => r.charge ? `電荷 ${chg(r)}，是${kindText(r)}。` : `${r.name}原子，電中性。`,
      targets: [tgt('na', `鈉離子 ${sym(11, 12, 10)}`, 11, 12, 10, '把電子減到 10，做出 Na⁺。'), tgt('cl', `氯離子 ${sym(17, 18, 18)}`, 17, 18, 18, '做出 Cl⁻：質子 17、中子 18、電子 18。')],
      found: ['少一個電子是 ＋1 的陽離子，多一個電子是 −1 的陰離子；元素不變。', '電荷 ＝ 質子數 − 電子數'] },
    { id: 'isotope', label: '同位素', title: '中子數不同，還是同一種元素嗎？', goal: '保持 6 個質子、6 個電子，只改中子數：做出 C-12、C-13、C-14，各收一張。',
      intro: '碳原子的中子可以是 6、7 或 8 個。只改中子數試試！', enter: { p: 6, n: 6, e: 6 }, controls: counts,
      react: (s, r) => `${r.name}-${r.A}：質量數 ${r.A}。`,
      targets: [tgt('c12', 'C-12（中子 6）', 6, 6, 6, '先做 C-12。'), tgt('c13', 'C-13（中子 7）', 6, 7, 6, '中子加到 7。'), tgt('c14', 'C-14（中子 8）', 6, 8, 6, '中子加到 8。')],
      found: ['中子數不同、質子數相同，還是碳，叫做同位素。', 'C-12、C-13、C-14：質子都是 6'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：數粒子', goal: '用質子、中子、電子的關係算算看。', intro: '質量數 ＝ 質子 ＋ 中子；電荷 ＝ 質子 − 電子。', head: '質量數 ＝ 質子 ＋ 中子；電荷 ＝ 質子 − 電子',
      rows: [
        { id: 'a', name: '鋁：13 個質子、14 個中子，質量數', eq: '13 ＋ 14', answer: 27, unit: '' },
        { id: 'mg', name: 'Mg²⁺ 有 12 個質子，有幾個電子', eq: '12 − 2', answer: 10, unit: '個', hint: v => v === 14 ? '帶 ＋2 是少了 2 個電子，不是多了。' : '' },
        { id: 'p', name: '質量數 23、中子 12 的原子有幾個質子', eq: '23 − 12', answer: 11, unit: '個' }],
      found: ['算對了！', '質量數 ＝ 質子＋中子；陽離子少電子，陰離子多電子'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想你做過的原子。',
      found: ['你把原子的構造弄懂了！', '質子決定元素，電子決定電荷，中子決定同位素'] }
  ],
  quiz: [
    { q: '一個粒子有 8 個質子、8 個中子、10 個電子，它是？', options: [
      { text: '氖原子，因為有 10 個電子。', why: '元素看質子數。8 個質子是氧，多了 2 個電子是 O²⁻。' },
      { text: '氧離子 O²⁻。', ok: true },
      { text: '氧原子，電中性。', why: '電子比質子多 2 個，電荷是 −2，不是電中性。' }] },
    { q: 'C-12 和 C-14 的差別在哪裡？', options: [
      { text: '質子數不同。', why: '質子數不同就是不同元素了。兩者都有 6 個質子。' },
      { text: '中子數不同。', ok: true },
      { text: '電子數不同。', why: '兩者都是電中性的碳原子，電子都是 6 個。' }] },
    { q: '鈉原子變成 Na⁺，是怎麼變的？', options: [
      { text: '失去 1 個電子。', ok: true },
      { text: '得到 1 個質子。', why: '質子數變了就不是鈉了。Na⁺ 是失去 1 個電子。' },
      { text: '得到 1 個電子。', why: '得到電子會帶負電。Na⁺ 帶正電，是失去電子。' }] }
  ],
  finish: { title: '你把原子的構造弄懂了！', rule: '質子數決定元素；質量數 ＝ 質子 ＋ 中子；電荷 ＝ 質子 − 電子。只有中子數不同的是同位素。', next: { label: '去化學計量實驗桌', href: '../stoichiometry/' } }
});
