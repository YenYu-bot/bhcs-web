// 化學計量實驗桌：莫耳數、限量試劑、生成物與剩餘質量全部來自 scripts/science/models.mjs 的 calculate('stoichiometry')。
import { calculate, STOICH } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('stoichiometry', { reaction: s.reaction, massA: s.massA, massB: s.massB });
const g = x => String(Math.round(x * 100) / 100), mol = x => String(Math.round(x * 1000) / 1000);
const EQ = { h2o: '2H₂ ＋ O₂ → 2H₂O', mgo: '2Mg ＋ O₂ → 2MgO' };
const UNIT = { h2o: 0.5, mgo: 0.05 }; // 一個分子圖示代表幾莫耳
const M = (R, k) => R[k][1] / 10;

// 分子圖示：H 白、O 紅、Mg 灰
function molecule(el, txt, P, parent, x, y, f) {
  const atoms = { 'H₂': [['h', -11, 0], ['h', 11, 0]], 'O₂': [['o', -13, 0], ['o', 13, 0]], 'H₂O': [['o', 0, 0], ['h', -18, 12], ['h', 18, 12]], 'Mg': [['mg', 0, 0]], 'MgO': [['mg', -13, 0], ['o', 14, 0]] }[f];
  for (const [a, dx, dy] of atoms) {
    if (a === 'mg') { el('circle', { cx: x + dx, cy: y + dy, r: 15, fill: '#A9B2BF', stroke: '#23304A', 'stroke-width': 2 }, parent); txt(parent, x + dx, y + dy + 5, 'Mg', { 'font-size': 11, 'font-weight': 900 }); }
    else el('image', { href: P + `item-atom-${a}.webp`, x: x + dx - (a === 'o' ? 15 : 11), y: y + dy - (a === 'o' ? 15 : 11), width: a === 'o' ? 30 : 22, height: a === 'o' ? 30 : 22 }, parent);
  }
}
function row(el, txt, P, rig, x, y, f, count, label) {
  txt(rig, x, y + 6, label, { 'text-anchor': 'start', 'font-size': 15, fill: '#5A6478' });
  const n = Math.round(count);
  for (let i = 0; i < Math.min(n, 8); i++) molecule(el, txt, P, rig, x + 140 + (i % 4) * 66, y + Math.floor(i / 4) * 48, f);
  if (!n) txt(rig, x + 160, y + 6, '（沒有）', { 'font-size': 14, fill: '#B8AC98' });
}

const OPTS = { h2o: { massA: [2, 4, 8], massB: [16, 32, 64] }, mgo: { massA: [2.4, 4.8], massB: [1.6, 3.2, 6.4] } };
function scene({ rig: root, el, txt, P, s, r, step, set, drag, hint, kind, narrow }) {
  const can = kind === 'observe', n1 = v => (+v).toFixed(1);
  // 手機：反應後的容器移到反應前的下面（直排），字和分子都放大一倍
  let rig = root; const gd = el('defs', {}, root), gg = el('linearGradient', { id: 'st-glass', x1: 0, y1: 0, x2: 1, y2: 0 }, gd); for (const [o, c, op] of [[0, '#fff', .9], [.08, '#EAF5FB', .7], [.9, '#E2F0F8', .6], [1, '#fff', .9]]) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }, gg);
  const R = r.R, u = UNIT[s.reaction];
  const box = (x, t) => { el('rect', { x: x + 4, y: 116, width: 400, height: 300, rx: 26, fill: '#000', opacity: .08 }, rig); el('rect', { x, y: 110, width: 400, height: 300, rx: 26, fill: 'url(#st-glass)', stroke: '#5E8FA8', 'stroke-width': 3 }, rig); el('rect', { x: x + 120, y: 100, width: 160, height: 16, rx: 6, fill: '#8A93A3', stroke: '#23304A', 'stroke-width': 2 }, rig); el('rect', { x: x + 14, y: 124, width: 10, height: 270, rx: 5, fill: '#fff', opacity: .8 }, rig); txt(rig, x + 200, 90, t, { 'font-size': 18 }); };
  const after = el('g', { transform: narrow ? 'translate(-470 386)' : null }, root);
  box(70, '反應前'); rig = after; box(540, '反應後'); rig = root;
  el('path', { d: narrow ? 'M270 420 V444' : 'M480 260 H528', stroke: '#C8372D', 'stroke-width': 6, 'marker-end': 'url(#st-arrow)' }, rig);
  const d = el('defs', {}, rig), mk = el('marker', { id: 'st-arrow', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, d);
  el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#C8372D' }, mk);
  txt(rig, narrow ? 270 : 500, 64, EQ[s.reaction], { 'font-size': 20 });
  row(el, txt, P, rig, 90, 160, R.A[0], r.molA / u, `${R.A[0]} ${s.massA} g`);
  row(el, txt, P, rig, 90, 290, R.B[0], r.molB / u, `${R.B[0]} ${s.massB} g`);
  const P0 = r.products[0];
  rig = after;
  row(el, txt, P, rig, 560, 160, P0[0], P0[1] / (R.P[0][1] / 10) / u, `${P0[0]} ${g(P0[1])} g`);
  const leftF = r.leftA > 1e-9 ? R.A[0] : r.leftB > 1e-9 ? R.B[0] : null, leftG = r.leftA > 1e-9 ? r.leftA : r.leftB;
  if (leftF) row(el, txt, P, rig, 560, 290, leftF, (leftG / M(R, leftF === R.A[0] ? 'A' : 'B')) / u, `剩 ${leftF} ${g(leftG)} g`);
  else txt(rig, 740, 296, '反應物剛好用完', { 'font-size': 16, fill: '#2E8B66' });
  rig = root;
  // 反應物用量：沿著刻度拖標籤
  const o = OPTS[s.reaction];
  for (const [k, y, nm] of [['massA', 246, R.A[0]], ['massB', 382, R.B[0]]]) { const opts = o[k], X = i => 140 + i * (280 / (opts.length - 1)), ci = opts.indexOf(s[k]);
    el('path', { d: `M140 ${y}H420`, stroke: '#C9D6E2', 'stroke-width': 6, 'stroke-linecap': 'round' }, rig);
    opts.forEach((v, i) => { el('circle', { cx: X(i), cy: y, r: 4, fill: '#8792A6' }, rig); txt(rig, X(i), y + 30, `${v} g`, { 'font-size': 11, fill: v === s[k] ? '#23304A' : '#8792A6' }); });
    const tg = el('g', { 'data-drag': can && step !== 'quiz' ? k : null }, rig), tm = el('g', {}, tg), x = X(ci);
    el('rect', { x: x - 30, y: y - 13, width: 60, height: 26, rx: 13, fill: k === 'massA' ? '#2F6FB0' : '#C8372D', stroke: '#fff', 'stroke-width': 2 }, tm);
    txt(tm, x, y + 5, nm, { 'font-size': 13, fill: '#fff', 'pointer-events': 'none' }); el('rect', { x: x - 36, y: y - 20, width: 72, height: 40, fill: 'transparent' }, tm);
    if (can && step !== 'quiz') drag(tg, p0 => { let xx = x; return { move(p) { xx = Math.max(140, Math.min(420, x + p.x - p0.x)); tm.setAttribute('transform', `translate(${n1(xx - x)} 0)`); },
      end() { let bi = 0; opts.forEach((_, i) => { if (Math.abs(X(i) - xx) < Math.abs(X(bi) - xx)) bi = i; }); if (opts[bi] !== s[k]) set({ [k]: opts[bi] }); else tm.removeAttribute('transform'); }, cancel() { tm.removeAttribute('transform'); } }; },
      { label: `${nm} 加多一點`, tap: () => set({ [k]: opts[(ci + 1) % opts.length] }) }); }
  hint(narrow ? 270 : 500, narrow ? 926 : 552, narrow ? '沿刻度拖藍、紅標籤改質量' : '沿著刻度拖藍色、紅色標籤，改變反應物的質量');
  // 天平：總質量
  const [bx, by, bw] = narrow ? [70, 812, 400] : [230, 432, 540], bc = bx + bw / 2;
  el('rect', { x: bx, y: by, width: bw, height: 84, rx: 14, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, bc, by + 34, narrow ? `總質量：${g(r.before)} g ＝ ${g(r.after)} g` : `總質量：反應前 ${g(r.before)} g ＝ 反應後 ${g(r.after)} g`, { 'font-size': 18 });
  txt(rig, bc, by + 68, `一個分子圖示代表 ${u} mol`, { 'font-size': 14, fill: '#5A6478' });
}

const lim = r => r.kind === 'exact' ? '剛好用完' : r.kind === 'none' ? '—' : r.limiting;
const tgt = (sig, label, reaction, massA, massB, aim) => ({ sig, label, aim, set: { reaction, massA, massB },
  title: s => `${STOICH[s.reaction].A[0]} ${s.massA} g ＋ ${STOICH[s.reaction].B[0]} ${s.massB} g`,
  body: (s, r) => `${r.kind === 'exact' ? '剛好完全反應' : r.limiting + ' 先用完'}，生成 ${r.products[0][0]} ${g(r.products[0][1])} g` });
const mass = (key, label, vals) => ({ key, label, type: 'seg', options: vals.map(v => [v, `${v} g`]) });

runDesk({
  key: 'bhcs.lab.stoichiometry.v1', title: '化學計量實驗桌', background: 'bg-chem-bench',
  sceneLabel: '化學計量實驗桌：左邊是反應前的兩種反應物，右邊是反應後的生成物和剩下的反應物，每個分子圖示代表固定的莫耳數，下方比較反應前後的總質量',
  initial: { reaction: 'h2o', massA: 4, massB: 32 },
  model, scene, viewBox: { desk: '50 40 920 540', phone: '50 30 440 930' }, phoneText: 1,
  readouts: (s, r) => [[`${r.R.A[0]} 莫耳數`, mol(r.molA), 'mol', `${s.massA} g ÷ ${M(r.R, 'A')}`], [`${r.R.B[0]} 莫耳數`, mol(r.molB), 'mol', `${s.massB} g ÷ ${M(r.R, 'B')}`], ['先用完的', lim(r), '', r.kind === 'exact' ? '兩種剛好' : '限量試劑']],
  why: { title: '莫耳與化學計量', button: '莫耳怎麼算', html: `
    <p class="fn-tip"><b>莫耳數 ＝ 質量 ÷ 分子量（或原子量）。</b>H₂ 分子量 2、O₂ 32、H₂O 18、Mg 24、MgO 40。</p>
    <p class="fn-tip"><b>係數就是莫耳數的比。</b>2H₂ ＋ O₂ → 2H₂O：2 mol 氫和 1 mol 氧反應，生成 2 mol 水。</p>
    <p class="fn-tip"><b>先用完的反應物決定生成物有多少</b>，另一種會剩下來。</p>
    <p class="fn-tip"><b>質量守恆：</b>反應前的總質量 ＝ 反應後的總質量（生成物＋剩下的反應物）。原子只是重新組合，沒有變多或變少。</p>` },
  steps: [
    { id: 'mole', label: '換成莫耳', title: '質量換成莫耳，看係數比', goal: '氫氣燃燒：試 H₂ 4 g ＋ O₂ 32 g，和 H₂ 2 g ＋ O₂ 16 g，兩組都剛好用完，各收一張。',
      intro: '4 g 氫是幾莫耳？32 g 氧呢？看讀值和分子圖示。', enter: { reaction: 'h2o', massA: 4, massB: 32 },
      controls: [mass('massA', '氫氣 H₂', [2, 4, 8]), mass('massB', '氧氣 O₂', [16, 32, 64])],
      react: (s, r) => `H₂ ${mol(r.molA)} mol、O₂ ${mol(r.molB)} mol。`,
      targets: [tgt('a', 'H₂ 4 g ＋ O₂ 32 g', 'h2o', 4, 32, '試 H₂ 4 g、O₂ 32 g。'), tgt('b', 'H₂ 2 g ＋ O₂ 16 g', 'h2o', 2, 16, '試 H₂ 2 g、O₂ 16 g。')],
      found: ['莫耳數 2：1 時剛好用完，和係數 2H₂ ＋ O₂ 一樣。', '4 g ÷ 2 ＝ 2 mol；32 g ÷ 32 ＝ 1 mol'] },
    { id: 'limit', label: '誰先用完', title: '不照比例，誰先用完？', goal: '試 H₂ 4 g ＋ O₂ 64 g，和 H₂ 8 g ＋ O₂ 32 g，看誰先用完、剩下多少，各收一張。',
      intro: '氧氣給太多了，水會變多嗎？', enter: { reaction: 'h2o', massA: 4, massB: 64 },
      controls: [mass('massA', '氫氣 H₂', [2, 4, 8]), mass('massB', '氧氣 O₂', [16, 32, 64])],
      react: (s, r) => r.kind === 'exact' ? '剛好用完。' : `${r.limiting} 先用完，生成水 ${g(r.products[0][1])} g。`,
      targets: [tgt('ox', 'H₂ 4 g ＋ O₂ 64 g', 'h2o', 4, 64, '試 H₂ 4 g、O₂ 64 g。'), tgt('hx', 'H₂ 8 g ＋ O₂ 32 g', 'h2o', 8, 32, '試 H₂ 8 g、O₂ 32 g。')],
      found: ['先用完的反應物決定生成多少水，多的那種剩下來。', 'H₂ 4 g ＋ O₂ 64 g：水還是 36 g，剩 O₂ 32 g'] },
    { id: 'mgo', label: '質量守恆', title: '鎂燃燒：反應前後總質量一樣嗎？', goal: '換成鎂燃燒。試 Mg 4.8 g ＋ O₂ 3.2 g，和 Mg 2.4 g ＋ O₂ 3.2 g，看天平，各收一張。',
      intro: '鎂燃燒後變成白色的氧化鎂。反應前後秤起來一樣重嗎？', enter: { reaction: 'mgo', massA: 4.8, massB: 3.2 },
      controls: [mass('massA', '鎂 Mg', [2.4, 4.8]), mass('massB', '氧氣 O₂', [1.6, 3.2, 6.4])],
      react: (s, r) => `反應前 ${g(r.before)} g，反應後 ${g(r.after)} g。`,
      targets: [tgt('m1', 'Mg 4.8 g ＋ O₂ 3.2 g', 'mgo', 4.8, 3.2, '試 Mg 4.8 g、O₂ 3.2 g。'), tgt('m2', 'Mg 2.4 g ＋ O₂ 3.2 g', 'mgo', 2.4, 3.2, '試 Mg 2.4 g、O₂ 3.2 g。')],
      found: ['反應前後總質量一樣；剩下的反應物也要算進去。', '4.8 ＋ 3.2 ＝ 8.0 g MgO；2.4 ＋ 3.2 ＝ 4.0 g MgO ＋ 剩 O₂ 1.6 g'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：莫耳與質量', goal: '分子量：H₂ 2、O₂ 32、H₂O 18。', intro: '莫耳數 ＝ 質量 ÷ 分子量。', head: '莫耳數 ＝ 質量 ÷ 分子量',
      rows: [
        { id: 'o', name: '16 g 氧氣是幾莫耳', eq: '16 ÷ 32', answer: 0.5, unit: 'mol', hint: v => v === 2 ? '分子分母放反了：質量 ÷ 分子量。' : '' },
        { id: 'w', name: '3 mol 水是幾公克', eq: '3 × 18', answer: 54, unit: 'g' },
        { id: 'h', name: '4 g 氫完全燃燒，生成幾公克水', eq: '4 g ＝ 2 mol H₂ → 2 mol H₂O', answer: 36, unit: 'g', hint: v => v === 18 ? '2 mol 氫生成 2 mol 水，不是 1 mol。' : '' }],
      found: ['算對了！', '質量 ÷ 分子量 ＝ 莫耳；係數比 ＝ 莫耳比'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想你的天平和分子圖示。',
      found: ['你把化學計量弄懂了！', '莫耳比 ＝ 係數比；總質量不變'] }
  ],
  quiz: [
    { q: 'H₂ 4 g 和 O₂ 64 g 反應，生成的水有多少？', options: [
      { text: '68 g，因為全部加起來。', why: '氧氣多了用不完。你的證據：生成水 36 g，還剩 O₂ 32 g。' },
      { text: '36 g，多的氧氣剩下來。', ok: true },
      { text: '72 g，氧氣加倍水也加倍。', why: '氫氣先用完，再多氧氣也不會多生成水。' }] },
    { q: '鎂在空氣中燃燒後，白色灰燼比原來的鎂重，這違反質量守恆嗎？', options: [
      { text: '違反，質量變多了。', why: '鎂和空氣中的氧結合了，氧的質量也要算。反應前（鎂＋氧）＝ 反應後（氧化鎂）。' },
      { text: '不違反，多出來的是結合的氧。', ok: true },
      { text: '不違反，因為秤不準。', why: '不是秤不準，而是氧氣的質量被加進去了。' }] },
    { q: '化學式 2H₂ ＋ O₂ → 2H₂O 的係數 2：1：2 代表？', options: [
      { text: '質量比 2：1：2。', why: '係數是莫耳數（分子數）的比，不是質量比。4 g：32 g：36 g 才是質量。' },
      { text: '莫耳數（分子數）的比。', ok: true },
      { text: '體積一定是 2：1：2 公升。', why: '係數是莫耳數的比。氣體體積比要在同溫同壓下才成立，而且水在室溫是液體。' }] }
  ],
  finish: { title: '你把化學計量弄懂了！', rule: '莫耳數 ＝ 質量 ÷ 分子量；係數比就是莫耳比；先用完的反應物決定生成物多少。反應前後總質量不變。', next: { label: '去化學平衡實驗桌', href: '../equilibrium/' } }
});
