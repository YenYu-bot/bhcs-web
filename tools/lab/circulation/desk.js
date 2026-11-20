// 血液循環實驗桌：血管、循環路線、心跳與心輸出量全部來自 scripts/science/models.mjs 的 calculate('circulation')（教學模型）。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('circulation', { intensity: s.intensity, site: s.site });
const f1 = x => String(Math.round(x * 10) / 10), f2 = x => String(Math.round(x * 100) / 100);
const RED = '#C8372D', BLUE = '#2F6FB0';

function scene({ rig, el, txt, P, s, r }) {
  // 心臟：觀察者看到的左邊是右心房、右心室
  const hx = 500, hy = 330;
  el('path', { d: `M${hx} ${hy - 90} C${hx - 150} ${hy - 190} ${hx - 230} ${hy - 10} ${hx} ${hy + 150} C${hx + 230} ${hy - 10} ${hx + 150} ${hy - 190} ${hx} ${hy - 90} Z`, fill: '#F2C6C0', stroke: '#23304A', 'stroke-width': 4 }, rig);
  const room = (x, y, t, col) => { el('rect', { x: x - 54, y: y - 28, width: 108, height: 56, rx: 14, fill: col, opacity: .9 }, rig); txt(rig, x, y + 6, t, { fill: '#fff', 'font-size': 15 }); };
  room(hx - 62, hy - 38, '右心房', BLUE); room(hx - 62, hy + 30, '右心室', BLUE); room(hx + 62, hy - 38, '左心房', RED); room(hx + 62, hy + 30, '左心室', RED);
  // 肺和全身
  el('image', { href: P + 'prop-lung-right.webp', x: 245, y: 70, width: 84, height: 152 }, rig);
  el('image', { href: P + 'prop-lung-left.webp', x: 671, y: 70, width: 84, height: 152 }, rig);
  txt(rig, 500, 110, '肺臟（換氣：吸入氧、排出二氧化碳）', { 'font-size': 15, fill: '#5A6478' });
  el('rect', { x: 300, y: 520, width: 400, height: 56, rx: 16, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 3 }, rig);
  txt(rig, 500, 554, '全身組織（細胞用掉氧）', { 'font-size': 16 });
  // 四條血管
  const V = {
    pa: { d: `M${hx - 62} ${hy + 4} C${hx - 160} ${hy - 40} ${hx - 200} 230 290 205`, col: BLUE, name: '肺動脈', lx: 300, ly: 250 },
    pv: { d: `M710 205 C${hx + 200} 230 ${hx + 160} ${hy - 90} ${hx + 62} ${hy - 66}`, col: RED, name: '肺靜脈', lx: 700, ly: 250 },
    aorta: { d: `M${hx + 62} ${hy + 58} C${hx + 200} ${hy + 80} ${hx + 190} 480 640 520`, col: RED, name: '主動脈', lx: 730, ly: 440 },
    vc: { d: `M360 520 C${hx - 190} 480 ${hx - 200} ${hy - 60} ${hx - 116} ${hy - 38}`, col: BLUE, name: '大靜脈', lx: 270, ly: 440 }
  };
  const d = el('defs', {}, rig);
  for (const [k, c] of [['r', RED], ['b', BLUE]]) { const m = el('marker', { id: 'ci-' + k, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: c }, m); }
  for (const [k, v] of Object.entries(V)) {
    const on = k === s.site;
    if (on) el('path', { d: v.d, fill: 'none', stroke: '#F4C04E', 'stroke-width': 22, opacity: .6, 'stroke-linecap': 'round' }, rig);
    el('path', { d: v.d, fill: 'none', stroke: v.col, 'stroke-width': on ? 12 : 7, 'marker-end': `url(#ci-${v.col === RED ? 'r' : 'b'})`, opacity: on ? 1 : .55 }, rig);
    txt(rig, v.lx, v.ly, v.name, { 'font-size': on ? 18 : 15, fill: on ? '#23304A' : '#5A6478' });
  }
  // 心跳
  txt(rig, hx, hy + 120, `♥ ${f1(r.hr)} 次／分`, { 'font-size': 18, fill: RED });
  el('rect', { x: 120, y: 300, width: 16, height: 16, fill: RED }, rig); txt(rig, 142, 314, '充氧血', { 'text-anchor': 'start', 'font-size': 14, fill: '#5A6478' });
  el('rect', { x: 120, y: 326, width: 16, height: 16, fill: BLUE }, rig); txt(rig, 142, 340, '缺氧血', { 'text-anchor': 'start', 'font-size': 14, fill: '#5A6478' });
}

const NAME = { pa: '肺動脈', pv: '肺靜脈', aorta: '主動脈', vc: '大靜脈' };
const tgt = (sig, label, site, intensity, aim) => ({ sig, label, aim, set: { site, intensity },
  title: (s, r) => s.intensity ? `運動強度 ${s.intensity}%` : `${r.vessel}`,
  body: (s, r) => s.intensity || sig.startsWith('x') ? `心跳 ${f1(r.hr)} 次／分，每分鐘輸出 ${f2(r.co)} L` : `${r.from} → ${r.to}，${r.kind === 'oxygenated' ? '充氧血' : '缺氧血'}（${r.circuit === 'lung' ? '肺循環' : '體循環'}）` });
const vessels = (list) => ({ key: 'site', label: '點選血管', type: 'seg', options: list.map(k => [k, NAME[k]]), cols: list.length });

runDesk({
  key: 'bhcs.lab.circulation.v1', title: '血液循環實驗桌', background: 'bg-chem-bench',
  sceneLabel: '血液循環實驗桌：中間是心臟的四個腔室，上方是肺臟、下方是全身組織，四條血管用紅色（充氧血）和藍色（缺氧血）標示流向',
  initial: { site: 'pa', intensity: 0 },
  model, scene, viewBox: { desk: '100 30 800 560', phone: '110 30 780 560' }, phoneText: 1.4,
  readouts: (s, r) => [['所選血管', r.vessel, '', `${r.circuit === 'lung' ? '肺循環' : '體循環'}・${r.kind === 'oxygenated' ? '充氧血' : '缺氧血'}`], ['心跳', f1(r.hr), '次／分', `運動強度 ${s.intensity}%`], ['心輸出量', f2(r.co), 'L／分', `每搏 ${f1(r.sv)} mL`]],
  why: { title: '心臟與血液循環', button: '循環怎麼走', html: `
    <p class="fn-tip"><b>肺循環：</b>右心室 → 肺動脈 → 肺臟（拿到氧）→ 肺靜脈 → 左心房。</p>
    <p class="fn-tip"><b>體循環：</b>左心室 → 主動脈 → 全身組織（用掉氧）→ 大靜脈 → 右心房。</p>
    <p class="fn-tip"><b>動脈和靜脈看方向，不看含氧：</b>離開心臟的是動脈，流回心臟的是靜脈。所以肺動脈是缺氧血、肺靜脈是充氧血。</p>
    <p class="fn-tip"><b>運動時</b>心跳加快、每次打出的血變多，每分鐘的心輸出量增加，把更多氧送到肌肉。數值是教學模型，不能用來判斷健康。</p>` },
  steps: [
    { id: 'lung', label: '肺循環', title: '肺循環：血液到肺做什麼？', goal: '點選肺動脈和肺靜脈，看血液從哪裡來、到哪裡去、是充氧血還是缺氧血，各收一張。',
      intro: '先看右心室出發的肺動脈。它裡面是充氧血嗎？', enter: { site: 'pa', intensity: 0 }, controls: [vessels(['pa', 'pv'])],
      react: (s, r) => `${r.vessel}：${r.from} → ${r.to}，${r.kind === 'oxygenated' ? '充氧血' : '缺氧血'}。`,
      targets: [tgt('pa', '肺動脈', 'pa', 0, '點選肺動脈。'), tgt('pv', '肺靜脈', 'pv', 0, '點選肺靜脈。')],
      found: ['肺動脈帶缺氧血去肺，肺靜脈帶充氧血回心臟。', '動脈離開心臟，靜脈流回心臟——和含氧多少無關'] },
    { id: 'body', label: '體循環', title: '體循環：氧送到全身', goal: '點選主動脈和大靜脈，看血液的路線，各收一張。',
      intro: '左心室把充氧血打進主動脈，送到全身。', enter: { site: 'aorta', intensity: 0 }, controls: [vessels(['aorta', 'vc'])],
      react: (s, r) => `${r.vessel}：${r.from} → ${r.to}，${r.kind === 'oxygenated' ? '充氧血' : '缺氧血'}。`,
      targets: [tgt('ao', '主動脈', 'aorta', 0, '點選主動脈。'), tgt('vc', '大靜脈', 'vc', 0, '點選大靜脈。')],
      found: ['主動脈帶充氧血到全身，大靜脈帶缺氧血回右心房。', '左心室 → 全身 → 右心房'] },
    { id: 'exercise', label: '運動時', title: '運動時，心臟怎麼配合？', goal: '比較靜止（0%）和激烈運動（100%）的心跳與心輸出量，各收一張。',
      intro: '開始運動！心跳和心輸出量會怎麼變？', enter: { site: 'aorta', intensity: 0 },
      controls: [{ key: 'intensity', label: '運動強度', type: 'seg', options: [[0, '靜止'], [50, '慢跑 50%'], [100, '激烈 100%']] }],
      react: (s, r) => `心跳 ${f1(r.hr)} 次／分，每分鐘 ${f2(r.co)} L。`,
      targets: [tgt('x0', '靜止', 'aorta', 0, '選「靜止」。'), tgt('x100', '激烈運動', 'aorta', 100, '選「激烈 100%」。')],
      found: ['運動時心跳變快、每次打出的血也變多，心輸出量約是靜止的 4 倍。', '靜止 70 × 70 mL ＝ 4.9 L；激烈 180 × 110 mL ＝ 19.8 L'] },
    { id: 'calc', label: '算一算', kind: 'calc', title: '算一算：心輸出量', goal: '心輸出量 ＝ 心跳（次／分）× 每次打出的血量（mL），再換成 L。', intro: '1 L ＝ 1000 mL。', head: '心輸出量 ＝ 心跳 × 每搏輸出量',
      rows: [
        { id: 'rest', name: '心跳 70 次、每次 70 mL', eq: '70 × 70 ÷ 1000', answer: 4.9, unit: 'L／分', tol: .01, hint: v => v === 4900 ? '4900 是 mL，要換成 L。' : '' },
        { id: 'run', name: '心跳 120 次、每次 80 mL', eq: '120 × 80 ÷ 1000', answer: 9.6, unit: 'L／分', tol: .01 }],
      found: ['算對了！', '心跳快、每搏量大，心輸出量就大'] },
    { id: 'quiz', label: '說說看', kind: 'quiz', title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。', intro: '最後三題！想想血液走的路線。',
      found: ['你把血液循環弄懂了！', '肺循環拿氧，體循環送氧'] }
  ],
  quiz: [
    { q: '肺動脈裡流的是？', options: [
      { text: '充氧血，因為是動脈。', why: '動脈是「離開心臟」的血管。你的證據：肺動脈從右心室出發去肺，裡面是缺氧血。' },
      { text: '缺氧血，正要去肺拿氧。', ok: true },
      { text: '一半充氧、一半缺氧。', why: '肺動脈裡是從全身回來的缺氧血。' }] },
    { q: '血液從左心室出發，下一站是哪裡？', options: [
      { text: '經主動脈到全身組織。', ok: true },
      { text: '經肺動脈到肺臟。', why: '肺動脈是從右心室出發的。左心室連接主動脈。' },
      { text: '直接到右心室。', why: '心臟左右兩邊不直接相通。' }] },
    { q: '運動時心輸出量增加，主要的好處是？', options: [
      { text: '讓血液變成充氧血。', why: '血液在肺臟才拿到氧。心輸出量增加是把更多血（和氧）送到肌肉。' },
      { text: '送更多氧和養分到肌肉。', ok: true },
      { text: '讓心臟休息。', why: '運動時心臟其實更忙：心跳變快、每搏量變多。' }] }
  ],
  finish: { title: '你把血液循環弄懂了！', rule: '肺循環：右心室 → 肺動脈 → 肺 → 肺靜脈 → 左心房。體循環：左心室 → 主動脈 → 全身 → 大靜脈 → 右心房。動脈離開心臟、靜脈流回心臟。', next: { label: '去神經反射實驗桌', href: '../nerve-reflex/' } }
});
