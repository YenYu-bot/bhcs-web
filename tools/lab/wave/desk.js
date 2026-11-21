// 波的疊加與駐波實驗桌：位移、反射、合成高度與駐波波長來自 ./model.mjs。
import { wave, AMP, LENGTH, SPEED } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const f = x => String(Math.round(x * 100) / 100), sign = v => v > 0 ? `＋${v}` : v < 0 ? `−${-v}` : '0';
const END = { fixed: '固定端', free: '自由端' }, MEET = { before: '相遇前', overlap: '重疊時', after: '通過後' };
const pulse = (c, h, x0, x1, y0) => { let d = ''; for (let x = x0; x <= x1; x += 4) d += `${d ? 'L' : 'M'}${x} ${(y0 - h * Math.exp(-(((x - c) / 42) ** 2))).toFixed(1)}`; return d; };
function arrow(el, rig, x, y, dx, color = '#C8372D') { el('path', { d: `M${x} ${y} h${dx}`, stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round' }, rig); const X = x + dx, s = Math.sign(dx); el('path', { d: `M${X + s * 12} ${y} l${-s * 14} -9 v18z`, fill: color }, rig); }

function scene({ rig, el, txt, s, r, step }) {
  const rope = { fill: 'none', stroke: '#23304A', 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
  if (step === 'reflect') {
    const row = (y, label, c, h, dir) => { txt(rig, 150, y - 84, label, { 'font-size': 15, 'text-anchor': 'start', fill: '#5A6478' });
      el('path', { d: pulse(c, h, 150, 820, y), ...rope }, rig); arrow(el, rig, c - dir * 30, y - Math.abs(h) - 26 - (h < 0 ? -Math.abs(h) : 0), dir * 60);
      if (s.end === 'fixed') { el('rect', { x: 820, y: y - 70, width: 26, height: 140, fill: '#8A93A3', stroke: '#23304A', 'stroke-width': 3 }, rig); }
      else { el('path', { d: `M834 ${y - 80} V${y + 80}`, stroke: '#8A93A3', 'stroke-width': 8, 'stroke-linecap': 'round' }, rig); el('circle', { cx: 834, cy: y, r: 13, fill: 'none', stroke: '#23304A', 'stroke-width': 4 }, rig); } };
    row(210, '反射前：脈波往右走', 480, 60, 1); row(430, `反射後：脈波往左走（${END[s.end]}）`, 560, 60 * r.reflected, -1);
    txt(rig, 500, 560, s.end === 'fixed' ? '固定端：繩子綁死，反射後上下顛倒' : '自由端：套環可以上下滑，反射後方向不變', { 'font-size': 16 });
  } else if (step === 'superpose') {
    const Y = 330, U = 34;
    el('path', { d: 'M130 ' + Y + ' H870', stroke: '#C9BFAE', 'stroke-width': 1.5, 'stroke-dasharray': '6 6' }, rig);
    if (s.meet === 'overlap') {
      el('path', { d: pulse(500, r.a1 * U, 130, 870, Y), fill: 'none', stroke: '#C8372D', 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }, rig);
      el('path', { d: pulse(500, s.a2 * U, 130, 870, Y), fill: 'none', stroke: '#2F6FB0', 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }, rig);
      el('path', { d: pulse(500, r.sum * U, 130, 870, Y), ...rope }, rig);
      txt(rig, 500, 130, `合成：${sign(r.a1)} 加 ${sign(s.a2)} ＝ ${sign(r.sum)} 格`, { 'font-size': 18 });
    } else {
      const xa = s.meet === 'before' ? 300 : 700, xb = s.meet === 'before' ? 700 : 300;
      let d = ''; for (let x = 130; x <= 870; x += 4) d += `${d ? 'L' : 'M'}${x} ${(Y - r.a1 * U * Math.exp(-(((x - xa) / 42) ** 2)) - s.a2 * U * Math.exp(-(((x - xb) / 42) ** 2))).toFixed(1)}`;
      el('path', { d, ...rope }, rig);
      txt(rig, xa, Y - r.a1 * U - 46, `甲波 ${sign(r.a1)} 格`, { 'font-size': 15, fill: '#C8372D' }); arrow(el, rig, xa - 30, Y - r.a1 * U - 24, 60);
      const by = s.a2 > 0 ? Y - s.a2 * U - 46 : Y - s.a2 * U + 58; txt(rig, xb, by, `乙波 ${sign(s.a2)} 格`, { 'font-size': 15, fill: '#2F6FB0' }); arrow(el, rig, xb + 30, by + (s.a2 > 0 ? 22 : -36), -60, '#2F6FB0');
      txt(rig, 500, 130, MEET[s.meet] + (s.meet === 'after' ? '：兩個波各自保持原來的形狀' : '：兩個波迎面而來'), { 'font-size': 18 });
    }
    for (let k = -2; k <= 4; k += 2) txt(rig, 112, Y - k * U + 5, sign(k), { 'font-size': 12, fill: '#5A6478' });
  } else if (step === 'standing') {
    const X0 = 200, W = 600, Y = 310, A = 80, n = s.mode;
    for (const sg of [1, -1]) { let d = ''; for (let x = 0; x <= W; x += 5) d += `${d ? 'L' : 'M'}${X0 + x} ${(Y - sg * A * Math.sin(n * Math.PI * x / W)).toFixed(1)}`; el('path', { d, ...rope, stroke: sg > 0 ? '#23304A' : '#8A93A3', 'stroke-dasharray': sg > 0 ? null : '8 7' }, rig); }
    for (const x of [X0, X0 + W]) el('rect', { x: x - 10, y: Y - 60, width: 20, height: 120, rx: 4, fill: '#8A93A3', stroke: '#23304A', 'stroke-width': 3 }, rig);
    for (let i = 0; i <= n; i++) { const x = X0 + i * W / n; el('circle', { cx: x, cy: Y, r: 8, fill: '#C8372D', stroke: '#23304A', 'stroke-width': 2 }, rig); txt(rig, x, Y + 110, '節點', { 'font-size': 13, fill: '#C8372D' }); }
    for (let i = 0; i < n; i++) txt(rig, X0 + (i + .5) * W / n, Y - A - 18, '腹點', { 'font-size': 13, fill: '#2F6FB0' });
    el('path', { d: `M${X0} ${Y + 150} H${X0 + W}`, stroke: '#23304A', 'stroke-width': 2 }, rig); txt(rig, X0 + W / 2, Y + 176, `弦長 ${LENGTH} cm　波長 ${f(r.lambda)} cm（${n} 個波腹）`, { 'font-size': 16 });
  } else {
    const X0 = 130, L = 370, Y = 320, A = 34 * AMP, ph = s.phase / 4, yAt = x => Y - A * Math.sin(2 * Math.PI * ((x - X0) / L - ph));
    el('path', { d: `M${X0} ${Y} H870`, stroke: '#C9BFAE', 'stroke-width': 1.5, 'stroke-dasharray': '6 6' }, rig);
    let d = ''; for (let x = X0; x <= 870; x += 5) d += `${d ? 'L' : 'M'}${x} ${yAt(x).toFixed(1)}`; el('path', { d, ...rope }, rig);
    const px = X0 + .75 * L; el('path', { d: `M${px} ${Y - A - 30} V${Y + A + 30}`, stroke: '#2F6FB0', 'stroke-width': 2, 'stroke-dasharray': '5 5' }, rig);
    el('circle', { cx: px, cy: yAt(px), r: 12, fill: '#F4C04E', stroke: '#23304A', 'stroke-width': 3 }, rig); txt(rig, px, Y + A + 54, `質點：位移 ${sign(r.particle)} 格`, { 'font-size': 15, fill: '#2F6FB0' });
    const cx = X0 + (.25 + ph) * L; el('path', { d: `M${cx} ${Y - A - 14} l-9 -16 h18z`, fill: '#C8372D' }, rig); txt(rig, cx, Y - A - 40, '這個波峰', { 'font-size': 14, fill: '#C8372D' });
    arrow(el, rig, 640, 150, 110); txt(rig, 590, 156, '波前進的方向', { 'font-size': 14, 'text-anchor': 'end', fill: '#C8372D' });
    txt(rig, 500, 520, `經過 ${s.phase}/4 個週期：波峰前進 ${s.phase}/4 個波長，質點只有上下移動`, { 'font-size': 16 });
  }
}

const tgt = (sig, label, set, aim, title, body) => ({ sig, label, set, aim, title, body });

runDesk({
  key: 'bhcs.lab.wave.v1', title: '波的疊加與駐波實驗桌',
  sceneLabel: '波的疊加與駐波實驗桌：依任務顯示繩波與上面的質點、脈波在繩子末端的反射、兩個脈波相遇時的合成，或兩端固定的弦上的駐波',
  initial: { phase: 0, end: 'fixed', a2: 2, meet: 'before', mode: 1 },
  model: wave, scene, viewBox: { desk: '90 90 800 500', phone: '90 90 800 500' }, phoneText: 1.4,
  readouts: (s, r) => [['質點位移', sign(r.particle), '格', `第 ${s.phase}/4 週期`], ['合成高度', r.sum === null ? '—' : sign(r.sum), r.sum === null ? '' : '格', MEET[s.meet]], ['駐波波長', f(r.lambda), 'cm', `${r.antinodes} 個波腹、${r.nodes} 個節點`]],
  why: { title: '波的性質', button: '波怎麼傳', html: `
    <p class="fn-tip"><b>波傳的是振動和能量，不是物質。</b>繩波往前走，繩上的每一點只在原地上下振動。</p>
    <p class="fn-tip"><b>反射：</b>繩子末端綁死（固定端）時，反射回來的脈波上下顛倒；末端可以自由滑動（自由端）時，方向不變。</p>
    <p class="fn-tip"><b>疊加：</b>兩個波相遇時，位移直接相加；同方向會加強，反方向會抵消。分開後各自保持原來的樣子。</p>
    <p class="fn-tip"><b>駐波：</b>入射波和反射波疊加後，有些點永遠不動（節點），有些點振動最大（腹點）。兩端固定的弦，波長 ＝ 2 × 弦長 ÷ 波腹數。</p>` },
  steps: [
    { id: 'particle', label: '質點', title: '波往前走，繩上的點也跟著走嗎？', goal: '黃色的點是繩上的一個質點。收下 0/4 和 1/4 週期時的樣子，再看 2/4 週期。',
      intro: '盯著黃點和紅色三角形標的波峰，按時間往後走。', enter: { phase: 0 }, controls: [{ key: 'phase', label: '經過的時間', type: 'seg', options: [0, 1, 2, 3].map(p => [p, `${p}/4 週期`]) }],
      react: (s, r) => `波峰前進了 ${s.phase}/4 個波長，質點位移 ${sign(r.particle)} 格。`,
      targets: [0, 1, 2].map(p => tgt('p' + p, `${p}/4 週期`, { phase: p }, `看 ${p}/4 週期。`, s => `經過 ${s.phase}/4 週期`, (s, r) => `波峰前進 ${s.phase}/4 個波長；質點留在原處，位移 ${sign(r.particle)} 格`)),
      found: ['波形往右移動，但質點只在原地上下振動，沒有跟著波前進。', '波傳遞的是振動，不是繩子本身'] },
    { id: 'reflect', label: '反射', title: '脈波碰到繩子末端，會怎麼回來？', goal: '比較固定端和自由端，各收一張。',
      intro: '上面是反射前，下面是反射後。先看繩子綁死在牆上。', enter: { end: 'fixed' }, controls: [{ key: 'end', label: '繩子末端', type: 'seg', options: Object.entries(END) }],
      react: (s, r) => r.reflected < 0 ? '反射回來的脈波上下顛倒了。' : '反射回來的脈波方向沒有變。',
      targets: ['fixed', 'free'].map(e => tgt(e, END[e], { end: e }, `看${END[e]}。`, s => `${END[s.end]}反射`, (s, r) => r.reflected < 0 ? '反射後的脈波上下顛倒' : '反射後的脈波方向不變')),
      found: ['固定端反射後上下顛倒；自由端反射後方向不變。', '固定端：顛倒；自由端：不變'] },
    { id: 'superpose', label: '疊加', title: '兩個波撞在一起，會彈開嗎？', goal: '收下三張：同方向（乙波 ＋2）重疊時、反方向（乙波 −2）重疊時、反方向通過後。',
      intro: '甲波往右、乙波往左。看它們重疊的那一刻。', enter: { a2: 2, meet: 'before' },
      controls: [{ key: 'a2', label: '乙波', type: 'seg', options: [[2, '向上 ＋2 格'], [-2, '向下 −2 格']] }, { key: 'meet', label: '時刻', type: 'seg', options: Object.entries(MEET) }],
      react: (s, r) => r.sum === null ? `${MEET[s.meet]}。` : `重疊時高度是 ${sign(r.sum)} 格。`,
      targets: [tgt('add', '同方向重疊', { a2: 2, meet: 'overlap' }, '乙波選 ＋2，時刻選重疊時。', () => '甲 ＋2、乙 ＋2 重疊', (s, r) => `合成高度 ${sign(r.sum)} 格，互相加強`), tgt('cancel', '反方向重疊', { a2: -2, meet: 'overlap' }, '乙波選 −2，時刻選重疊時。', () => '甲 ＋2、乙 −2 重疊', (s, r) => `合成高度 ${sign(r.sum)} 格，那一瞬間互相抵消`), tgt('after', '反方向通過後', { a2: -2, meet: 'after' }, '乙波 −2，時刻選通過後。', () => '甲 ＋2、乙 −2 通過後', () => '兩個波各自恢復原來的形狀，繼續前進')],
      found: ['相遇時位移直接相加：同方向加強、反方向抵消；通過以後互不影響。', '＋2 加 ＋2 ＝ ＋4；＋2 加 −2 ＝ 0'] },
    { id: 'standing', label: '駐波', title: '兩端固定的弦，可以有哪些波長？', goal: '弦長 120 cm。收下 1、2、3 個波腹的駐波，數節點、讀波長。',
      intro: '紅點是永遠不動的節點。換成 2 個波腹看看。', enter: { mode: 1 }, controls: [{ key: 'mode', label: '波腹數', type: 'seg', options: [1, 2, 3].map(n => [n, `${n} 個`]) }],
      react: (s, r) => `波長 ${f(r.lambda)} cm，節點 ${r.nodes} 個。`,
      targets: [1, 2, 3].map(n => tgt('n' + n, `${n} 個波腹`, { mode: n }, `看 ${n} 個波腹。`, s => `${s.mode} 個波腹的駐波`, (s, r) => `節點 ${r.nodes} 個，波長 ${f(r.lambda)} cm，頻率 ${f(r.freq)} Hz`)),
      found: ['兩端一定是節點；波腹越多，波長越短、頻率越高。', '波長 ＝ 2 × 弦長 ÷ 波腹數'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：駐波', goal: `弦長 ${LENGTH} cm，波速 ${SPEED} m/s。`, intro: '波長 ＝ 2 × 弦長 ÷ 波腹數；頻率 ＝ 波速 ÷ 波長。', head: '波長 ＝ 2 × 弦長 ÷ 波腹數',
      rows: [
        { id: 'l', name: '2 個波腹時的波長', eq: '2 × 120 ÷ 2', answer: 120, unit: 'cm' },
        { id: 'n', name: '3 個波腹時有幾個節點（含兩端）', eq: '3 ＋ 1', answer: 4, unit: '個' },
        { id: 'f', name: '3 個波腹時的頻率（波長 0.8 m）', eq: '12 ÷ 0.8', answer: 15, unit: 'Hz' }],
      found: ['算對了！', '頻率 ＝ 波速 ÷ 波長'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想那個黃色的質點。',
      found: ['你把波的性質弄懂了！', '波傳振動；相遇時位移相加'] }
  ],
  quiz: [
    { q: '池塘水面有一片落葉，水波經過時，落葉會？', options: [
      { text: '跟著水波一路漂到岸邊。', why: '波傳的是振動，不是水本身。你的證據：波峰往前走，質點只在原地上下動。' },
      { text: '大致在原地上下起伏。', ok: true },
      { text: '完全不動。', why: '波經過時質點會振動，只是不會跟著波前進。' }] },
    { q: '兩個向上、高度一樣的脈波在繩上迎面相遇，重疊的瞬間會？', options: [
      { text: '互相抵消，繩子變平。', why: '同方向的位移相加會變大。反方向（一上一下）才會抵消。' },
      { text: '高度變成兩倍。', ok: true },
      { text: '互相彈開，各自往回走。', why: '波不會彈開。通過以後各自保持原來的形狀繼續前進。' }] },
    { q: '吉他弦兩端固定。同一條弦上的波腹從 1 個變成 2 個，波長會？', options: [
      { text: '變成 2 倍。', why: '波腹變多，每一段變短。你的證據：240 cm 變成 120 cm。' },
      { text: '不變。', why: '弦長不變，但要塞進更多波腹，波長必須變短。' },
      { text: '變成一半。', ok: true }] }
  ],
  finish: { title: '你把波的性質弄懂了！', rule: '波傳遞振動，質點只在原地振動。固定端反射顛倒、自由端不變。兩個波相遇時位移相加，通過後互不影響。駐波的波長 ＝ 2 × 弦長 ÷ 波腹數。', next: { label: '去波動與聲音實驗桌', href: '../wave-sound/' } }
});
