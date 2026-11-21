// 電路實驗桌：電流、電壓與亮度全部來自 ./model.mjs（燈泡 5 Ω、電池 1.5 V）。
import { circuit, R } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const f = x => String(Math.round(x * 100) / 100);
const NAME = { single: '一顆燈泡', series: '兩顆串聯', parallel: '兩顆並聯' };

function scene({ rig, el, txt, P, s, r }) {
  const wire = d => el('path', { d, fill: 'none', stroke: r.total ? '#C8372D' : '#5A6478', 'stroke-width': 6, 'stroke-linejoin': 'round' }, rig);
  const tag = (x, y, str, w = 150) => { el('rect', { x: x - w / 2, y: y - 20, width: w, height: 30, rx: 9, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 2 }, rig); txt(rig, x, y + 1, str, { 'font-size': 15 }); };
  const bulb = (x, y, side) => {
    if (r.pEach) el('circle', { cx: x, cy: y - 34, r: 34 + r.pEach * 22, fill: '#F4C04E', opacity: .35 }, rig);
    el('circle', { cx: x, cy: y - 34, r: 30, fill: r.pEach ? '#FFE9A8' : '#EEF1F5', stroke: '#23304A', 'stroke-width': 3 }, rig);
    el('path', { d: `M${x - 12} ${y - 22} L${x - 6} ${y - 44} L${x} ${y - 26} L${x + 6} ${y - 44} L${x + 12} ${y - 22}`, fill: 'none', stroke: r.pEach ? '#C8372D' : '#5A6478', 'stroke-width': 2.5 }, rig);
    el('rect', { x: x - 14, y: y - 6, width: 28, height: 14, rx: 3, fill: '#8A93A3', stroke: '#23304A', 'stroke-width': 2 }, rig);
    if (side) tag(x + 140, y - 34, `${f(r.each)} A　${f(r.vEach)} V`, 150); else tag(x, y - 92, `${f(r.each)} A　${f(r.vEach)} V`, 150);
  };
  // 迴路：電池在下、開關在左下、燈泡在上
  const L = 190, Rr = 810, T = 230, B = 470;
  if (s.layout === 'parallel') {
    wire(`M${L} ${B} V${T} H${Rr} V${B}`); wire(`M${L + 110} ${T} V${T - 100} H${Rr - 110} V${T}`);
    el('circle', { cx: L + 110, cy: T, r: 7, fill: '#23304A' }, rig); el('circle', { cx: Rr - 110, cy: T, r: 7, fill: '#23304A' }, rig);
    bulb(500, T + 4, true); bulb(500, T - 96, true);
  } else {
    wire(`M${L} ${B} V${T} H${Rr} V${B}`);
    if (s.layout === 'single') bulb(500, T + 4); else { bulb(390, T + 4); bulb(610, T + 4); }
  }
  wire(`M${L} ${B} H${Rr}`);
  el('image', { href: P + (s.on ? 'prop-switch-closed.webp' : 'prop-switch-open.webp'), x: L + 30, y: B - 62, width: 120, height: 86 }, rig);
  const bw = 150, bx = s.cells === 2 ? 500 - bw : 500 - bw / 2;
  el('rect', { x: bx - 8, y: B - 34, width: bw * s.cells + 16, height: 68, fill: 'none' }, rig);
  for (let i = 0; i < s.cells; i++) el('image', { href: P + 'prop-battery.webp', x: bx + i * bw, y: B - 28, width: bw, height: 55 }, rig);
  tag(500, B + 62, `電池 ${s.cells} 顆：${f(r.V)} V`, 190);
  tag(Rr + 4, 350, `總電流 ${f(r.total)} A`, 170);
  txt(rig, L + 90, B + 52, s.on ? '開關按下（通路）' : '開關打開（斷路）', { 'font-size': 14, fill: '#5A6478' });
}

const tgt = (sig, label, set, aim) => ({ sig, label, set, aim, title: s => `${NAME[s.layout]}、電池 ${s.cells} 顆${s.on ? '' : '、開關打開'}`,
  body: (s, r) => r.total ? `總電流 ${f(r.total)} A，每顆燈 ${f(r.each)} A、${f(r.vEach)} V` : '斷路，電流 0 A，燈不亮' });
const layoutCtl = opts => ({ key: 'layout', label: '燈泡接法', type: 'seg', options: opts.map(k => [k, NAME[k]]) });

runDesk({
  key: 'bhcs.lab.circuit.v1', title: '電路實驗桌', background: 'bg-electric-bench',
  sceneLabel: '電路實驗桌：電池、開關和燈泡接成迴路，每顆燈泡旁標出電流與電壓，右側是總電流',
  initial: { layout: 'single', cells: 1, on: false },
  model: circuit, scene, viewBox: { desk: '100 30 840 530', phone: '100 30 840 530' }, phoneText: 1.4,
  readouts: (s, r) => [['總電流', f(r.total), 'A', `${f(r.V)} V ÷ ${f(r.Rt)} Ω`], ['每顆燈的電壓', f(r.vEach), 'V', r.n === 1 ? '只有一顆' : NAME[s.layout]], ['每顆燈的電流', f(r.each), 'A', r.pEach ? (r.pEach >= 1.5 ? '很亮' : r.pEach >= .4 ? '普通亮' : '暗') : '不亮']],
  why: { title: '電流、電壓與電阻', button: '歐姆定律', html: `
    <p class="fn-tip"><b>通路才有電流。</b>開關打開就是斷路，電流是 0，燈不亮。</p>
    <p class="fn-tip"><b>歐姆定律：電流 ＝ 電壓 ÷ 電阻。</b>這裡每顆燈泡 ${R} Ω、每顆電池 1.5 V。</p>
    <p class="fn-tip"><b>串聯：</b>電流只有一條路，每顆燈的電流一樣，電壓平分。</p>
    <p class="fn-tip"><b>並聯：</b>每顆燈各走一條路，電壓都等於電池電壓，總電流是各分支相加。</p>` },
  steps: [
    { id: 'single', label: '通路與電壓', title: '通路才會亮；電池加倍呢？', goal: '先收下「開關打開」的結果，再按下開關，比較 1 顆和 2 顆電池，各收一張。',
      intro: '開關還沒按下，燈會亮嗎？', enter: { layout: 'single', cells: 1, on: false },
      controls: [{ key: 'on', label: '開關', type: 'seg', options: [[false, '打開'], [true, '按下']] }, { key: 'cells', label: '電池', type: 'seg', options: [[1, '1 顆'], [2, '2 顆']] }],
      react: (s, r) => r.total ? `電流 ${f(r.total)} A。` : '斷路，沒有電流。',
      targets: [tgt('off', '開關打開', { layout: 'single', on: false, cells: 1 }, '先收下開關打開的結果。'), tgt('c1', '1 顆電池', { layout: 'single', on: true, cells: 1 }, '按下開關，用 1 顆電池。'), tgt('c2', '2 顆電池', { layout: 'single', on: true, cells: 2 }, '換成 2 顆電池。')],
      found: ['通路才有電流；電壓加倍，電流也加倍，燈更亮。', '1.5 V ÷ 5 Ω ＝ 0.3 A；3 V ÷ 5 Ω ＝ 0.6 A'] },
    { id: 'series', label: '串聯', title: '兩顆燈串聯，會怎麼樣？', goal: '電池固定 2 顆。比較「一顆燈泡」和「兩顆串聯」，各收一張。',
      intro: '多串一顆燈，電流會變大還是變小？', enter: { layout: 'single', cells: 2, on: true },
      controls: [layoutCtl(['single', 'series'])],
      react: (s, r) => `每顆燈 ${f(r.each)} A、${f(r.vEach)} V。`,
      targets: [tgt('one', '一顆燈泡', { layout: 'single', cells: 2, on: true }, '先看一顆燈泡。'), tgt('ser', '兩顆串聯', { layout: 'series', cells: 2, on: true }, '換成兩顆串聯。')],
      found: ['串聯時總電阻變大，電流變小；兩顆燈平分電壓，都比較暗。', '3 V ÷（5 ＋ 5）Ω ＝ 0.3 A，每顆 1.5 V'] },
    { id: 'parallel', label: '並聯', title: '改成並聯，差在哪裡？', goal: '電池固定 2 顆。比較「兩顆串聯」和「兩顆並聯」，各收一張。',
      intro: '並聯的燈各走各的路。看每顆燈的電壓和總電流。', enter: { layout: 'series', cells: 2, on: true },
      controls: [layoutCtl(['single', 'series', 'parallel'])],
      react: (s, r) => `每顆燈 ${f(r.vEach)} V，總電流 ${f(r.total)} A。`,
      targets: [tgt('ser', '兩顆串聯', { layout: 'series', cells: 2, on: true }, '先看兩顆串聯。'), tgt('par', '兩顆並聯', { layout: 'parallel', cells: 2, on: true }, '換成兩顆並聯。')],
      found: ['並聯時每顆燈的電壓都等於電池電壓，和單獨一顆一樣亮；總電流是兩條分支相加。', '每顆 3 V、0.6 A；總電流 0.6 ＋ 0.6 ＝ 1.2 A'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：歐姆定律', goal: '電流 ＝ 電壓 ÷ 電阻。', intro: '用你收到的讀值來算。', head: '電流 ＝ 電壓 ÷ 電阻',
      rows: [
        { id: 'r', name: '燈泡兩端 3 V、電流 0.6 A，電阻是多少', eq: '3 ÷ 0.6', answer: 5, unit: 'Ω' },
        { id: 's', name: '兩顆 5 Ω 燈泡串聯接 3 V，電流是多少', eq: '3 ÷（5 ＋ 5）', answer: 0.3, unit: 'A', hint: v => v === 0.6 ? '串聯的總電阻是 5 ＋ 5 ＝ 10 Ω。' : '' },
        { id: 'p', name: '並聯兩條分支各 0.6 A，總電流是多少', eq: '0.6 ＋ 0.6', answer: 1.2, unit: 'A' }],
      found: ['算對了！', '串聯電阻相加；並聯分支電流相加'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想你收到的電流和電壓。',
      found: ['你把串聯和並聯弄懂了！', '串聯分電壓；並聯分電流'] }
  ],
  quiz: [
    { q: '兩顆相同的燈泡串聯後，比單獨一顆時暗，原因是？', options: [
      { text: '電池的電被前面那顆燈用掉了。', why: '電流不會被「用掉」：你的證據顯示串聯的兩顆燈電流一樣，都是 0.3 A。' },
      { text: '總電阻變大，電流變小，每顆燈只分到一半電壓。', ok: true },
      { text: '串聯時電池電壓會變小。', why: '電池電壓還是 3 V，是兩顆燈各分到 1.5 V。' }] },
    { q: '家裡的電燈是並聯的，好處是？', options: [
      { text: '一盞燈壞了，其他燈還能亮，而且每盞燈的電壓都一樣。', ok: true },
      { text: '並聯比較省電，總電流比較小。', why: '並聯的總電流是各分支相加，反而比較大。你的證據：0.6 ＋ 0.6 ＝ 1.2 A。' },
      { text: '並聯時電流只走其中一盞燈。', why: '每條分支都有電流，各 0.6 A。' }] },
    { q: '同一顆燈泡，電池從 1 顆換成 2 顆，電流怎麼變？', options: [
      { text: '不變，因為燈泡一樣。', why: '燈泡的電阻一樣，但電壓加倍了。你的證據：0.3 A 變成 0.6 A。' },
      { text: '變成一半。', why: '電壓越大電流越大。' },
      { text: '變成 2 倍。', ok: true }] }
  ],
  finish: { title: '你把電路弄懂了！', rule: '通路才有電流；電流 ＝ 電壓 ÷ 電阻。串聯：電流相同、電壓平分。並聯：電壓相同、總電流是分支相加。', next: { label: '去電流熱效應實驗桌', href: '../electric-power/' } }
});
