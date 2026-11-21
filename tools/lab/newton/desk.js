// 力與運動實驗桌：合力、加速度與位置來自 ./model.mjs。
import { motion } from './model.mjs';
import { runDesk } from '../shared/desk.mjs';

const f = x => String(Math.round(x * 100) / 100);
function scene({ rig, el, txt, P, s, r }) {
  const X0 = 130, Y = 400, PX = 52;
  el('image', { href: P + 'prop-track.webp', x: 70, y: Y, width: 880, height: 40, preserveAspectRatio: 'none' }, rig);
  for (let m = 0; m <= 14; m += 2) { el('path', { d: `M${X0 + m * PX} ${Y + 40} v12`, stroke: '#23304A', 'stroke-width': 2 }, rig); txt(rig, X0 + m * PX, Y + 72, `${m} m`, { 'font-size': 13, fill: '#5A6478' }); }
  const cart = (x, op, label) => { const g = el('g', { opacity: op }, rig);
    for (let i = 0; i < s.mass; i++) el('rect', { x: x - 30 + (i % 2) * 32, y: Y - 68 - Math.floor(i / 2) * 26, width: 28, height: 24, rx: 4, fill: '#8A93A3', stroke: '#23304A', 'stroke-width': 2 }, g);
    el('image', { href: P + 'prop-toy-cart.webp', x: x - 60, y: Y - 40, width: 120, height: 39 }, g);
    txt(rig, x, Y - 132, label, { 'font-size': 13, fill: '#5A6478' }); };
  const xs = [0, r.x1, r.x2].map(d => X0 + 40 + d * PX);
  cart(xs[0], .35, '0 秒'); if (xs[1] - xs[0] > 30) cart(xs[1], .6, '1 秒'); if (xs[2] - xs[1] > 30 || xs[2] - xs[0] > 30) cart(xs[2], 1, '2 秒');
  const x = xs[2] - xs[0] > 30 ? xs[2] : xs[0];
  const arrow = (x1, len, color, label, y) => { if (!len) return; const x2 = x1 + len, dir = Math.sign(len);
    el('path', { d: `M${x1} ${y} H${x2 - dir * 12}`, stroke: color, 'stroke-width': 8, 'stroke-linecap': 'round' }, rig); el('path', { d: `M${x2} ${y} l${-dir * 18} -11 v22z`, fill: color }, rig);
    txt(rig, x1 + len / 2 + dir * 6, y - 14, label, { 'font-size': 15, fill: color }); };
  arrow(x + 64, s.force * 22, '#C8372D', `拉力 ${s.force} N`, Y - 22);
  arrow(x - 64, -s.friction * 22, '#2F6FB0', `摩擦力 ${s.friction} N`, Y - 22);
  el('rect', { x: 330, y: 150, width: 340, height: 74, rx: 14, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, 500, 180, `合力 ${f(r.net)} N　質量 ${s.mass} kg`, { 'font-size': 17 }); txt(rig, 500, 208, `加速度 ${f(r.a)} m/s²（${r.state}）`, { 'font-size': 17, fill: '#C8372D' });
  txt(rig, 500, 510, `一開始的速度 ${s.v0} m/s；小車在 0、1、2 秒的位置`, { 'font-size': 14, fill: '#5A6478' });
}

const tgt = (sig, label, set, aim) => ({ sig, label, set, aim, title: s => `${s.mass} kg、拉力 ${s.force} N、摩擦力 ${s.friction} N`, body: (s, r) => `合力 ${f(r.net)} N，加速度 ${f(r.a)} m/s²，${r.state}；2 秒後 ${f(r.v2)} m/s` });
const seg = (key, label, vals, unit) => ({ key, label, type: 'seg', options: vals.map(v => [v, `${v} ${unit}`]) });

runDesk({
  key: 'bhcs.lab.newton.v1', title: '力與運動實驗桌',
  sceneLabel: '力與運動實驗桌：小車在水平軌道上，紅色箭頭是拉力、藍色箭頭是摩擦力，畫面顯示小車在 0、1、2 秒的位置',
  initial: { mass: 1, force: 2, friction: 0, v0: 0 },
  model: motion, scene, viewBox: { desk: '60 110 900 420', phone: '60 110 900 420' }, phoneText: 1.45,
  readouts: (s, r) => [['合力', f(r.net), 'N', `${s.force} − ${s.friction}`], ['加速度', f(r.a), 'm/s²', `${f(r.net)} ÷ ${s.mass}`], ['2 秒後速度', f(r.v2), 'm/s', r.state]],
  why: { title: '牛頓運動定律', button: '力與加速度', html: `
    <p class="fn-tip"><b>慣性（第一定律）：</b>合力是 0 時，靜止的繼續靜止，運動中的維持等速直線運動。</p>
    <p class="fn-tip"><b>第二定律：加速度 ＝ 合力 ÷ 質量（F ＝ ma）。</b>合力越大加速度越大；質量越大加速度越小。</p>
    <p class="fn-tip"><b>合力</b>是所有力加起來的結果。這裡向右的拉力減掉向左的摩擦力。</p>
    <p class="fn-tip">單位：力 N（牛頓）、質量 kg、加速度 m/s²。1 N 讓 1 kg 的物體產生 1 m/s² 的加速度。</p>` },
  steps: [
    { id: 'force', label: '力加倍', title: '拉力加倍，加速度呢？', goal: '小車 1 kg、沒有摩擦。比較拉力 2 N 和 4 N，各收一張。',
      intro: '看小車每一秒跑多遠。拉力變大會怎樣？', enter: { mass: 1, force: 2, friction: 0, v0: 0 }, controls: [seg('force', '拉力', [2, 4, 6], 'N')],
      react: (s, r) => `加速度 ${f(r.a)} m/s²。`,
      targets: [tgt('f2', '拉力 2 N', { mass: 1, force: 2, friction: 0, v0: 0 }, '試拉力 2 N。'), tgt('f4', '拉力 4 N', { mass: 1, force: 4, friction: 0, v0: 0 }, '試拉力 4 N。')],
      found: ['質量不變時，合力加倍，加速度也加倍。', '2 N ÷ 1 kg ＝ 2 m/s²；4 N ÷ 1 kg ＝ 4 m/s²'] },
    { id: 'mass', label: '質量加倍', title: '車子變重，加速度呢？', goal: '拉力固定 4 N。比較 1 kg、2 kg、4 kg，各收一張。',
      intro: '同樣的力，拉越重的車會怎樣？', enter: { mass: 1, force: 4, friction: 0, v0: 0 }, controls: [seg('mass', '小車質量', [1, 2, 4], 'kg')],
      react: (s, r) => `加速度 ${f(r.a)} m/s²。`,
      targets: [1, 2, 4].map(m => tgt('m' + m, `${m} kg`, { mass: m, force: 4, friction: 0, v0: 0 }, `試 ${m} kg。`)),
      found: ['合力不變時，質量加倍，加速度變成一半。', '4 N ÷ 2 kg ＝ 2 m/s²；4 N ÷ 4 kg ＝ 1 m/s²'] },
    { id: 'net', label: '合力為零', title: '沒有合力，車子會停下來嗎？', goal: '小車一開始就以 2 m/s 前進。收下三種情況：都沒有力、拉力 2 N 配摩擦力 2 N、只有摩擦力 2 N。',
      intro: '車子已經在動了。沒有力推它，它會怎樣？', enter: { mass: 1, force: 0, friction: 0, v0: 2 },
      controls: [seg('force', '拉力', [0, 2], 'N'), seg('friction', '摩擦力', [0, 2], 'N')],
      react: (s, r) => `合力 ${f(r.net)} N，${r.state}。`,
      targets: [tgt('none', '沒有力', { mass: 1, force: 0, friction: 0, v0: 2 }, '拉力和摩擦力都調成 0。'), tgt('bal', '拉力 2 N、摩擦力 2 N', { mass: 1, force: 2, friction: 2, v0: 2 }, '拉力 2 N、摩擦力 2 N。'), tgt('fr', '只有摩擦力 2 N', { mass: 1, force: 0, friction: 2, v0: 2 }, '拉力 0、摩擦力 2 N。')],
      found: ['合力是 0 時，動的東西維持等速，不會自己停；會停下來是因為有摩擦力。', '合力 0 → 加速度 0 → 速度不變'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：F ＝ ma', goal: '加速度 ＝ 合力 ÷ 質量。', intro: '用 F ＝ ma 來算。', head: '合力 ＝ 質量 × 加速度',
      rows: [
        { id: 'a', name: '6 N 的合力作用在 2 kg 的車上，加速度', eq: '6 ÷ 2', answer: 3, unit: 'm/s²' },
        { id: 'f', name: '讓 3 kg 的車有 2 m/s² 的加速度，需要的合力', eq: '3 × 2', answer: 6, unit: 'N' },
        { id: 'v', name: '從靜止以 3 m/s² 加速 4 秒後的速度', eq: '3 × 4', answer: 12, unit: 'm/s' }],
      found: ['算對了！', 'a ＝ F ÷ m；v ＝ a × t（從靜止開始）'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想小車每一秒的位置。',
      found: ['你把力與運動弄懂了！', '合力決定加速度，不是決定速度'] }
  ],
  quiz: [
    { q: '在光滑的冰面上滑行的冰壺，沒有人再推它，它會？', options: [
      { text: '馬上停下來，因為沒有力了。', why: '你的證據：合力 0 時，2 m/s 的小車 2 秒後還是 2 m/s。' },
      { text: '幾乎維持原來的速度繼續滑。', ok: true },
      { text: '越滑越快。', why: '沒有合力就沒有加速度，速度不會變大。' }] },
    { q: '用同樣大小的力推空的和裝滿的購物車，哪一台加速得快？', options: [
      { text: '空的，質量小、加速度大。', ok: true },
      { text: '裝滿的，比較重所以衝得快。', why: '合力一樣時，質量越大加速度越小。你的證據：4 N 推 1 kg 是 4 m/s²，推 4 kg 只有 1 m/s²。' },
      { text: '一樣快，因為力一樣。', why: '力一樣，但質量不同，加速度就不同。' }] },
    { q: '車子以等速直線前進時，它受到的合力是？', options: [
      { text: '向前，不然車子不會動。', why: '維持運動不需要合力，改變速度才需要。等速表示合力是 0。' },
      { text: '向後。', why: '合力向後的話車子會減速。' },
      { text: '0，推力和阻力剛好抵消。', ok: true }] }
  ],
  finish: { title: '你把力與運動弄懂了！', rule: '合力是 0：靜止的不動、運動的維持等速。合力不是 0：加速度 ＝ 合力 ÷ 質量。', next: { label: '去小車運動圖實驗桌', href: '../motion/' } }
});
