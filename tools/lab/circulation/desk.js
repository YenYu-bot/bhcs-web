// 血液循環實驗桌：血管、循環路線、心跳與心輸出量全部來自 scripts/science/models.mjs 的 calculate('circulation')（教學模型）。
import { calculate } from '../../../scripts/science/models.mjs';
import { runDesk } from '../shared/desk.mjs';

const model = s => calculate('circulation', { intensity: s.intensity, site: s.site });
const f1 = x => String(Math.round(x * 10) / 10), f2 = x => String(Math.round(x * 100) / 100);
const RED = '#C8372D', BLUE = '#2F6FB0';

const n1 = v => (+v).toFixed(1);
const INT = [0, 50, 100], TX = i => 360 + i * 140;
function scene({ rig, el, txt, P, s, r, step, set, drag, hint, kind, reduce }) {
  const can = kind === 'observe', hx = 500, hy = 330;
  const d = el('defs', {}, rig);
  const rg = el('radialGradient', { id: 'ci-heart', cx: .4, cy: .35, r: .75 }, d); for (const [o, c] of [[0, '#F8B9B0'], [.6, '#E07A70'], [1, '#B4473F']]) el('stop', { offset: o, 'stop-color': c }, rg);
  for (const [k, c] of [['r', RED], ['b', BLUE]]) { const m = el('marker', { id: 'ci-' + k, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 3, markerHeight: 3, orient: 'auto' }, d); el('path', { d: 'M0 0 L10 5 L0 10 z', fill: c }, m); }
  // 肺和全身組織
  el('image', { href: P + 'prop-lung-right.webp', x: 245, y: 70, width: 84, height: 152 }, rig);
  el('image', { href: P + 'prop-lung-left.webp', x: 671, y: 70, width: 84, height: 152 }, rig);
  txt(rig, 500, 110, '肺臟（換氣：吸入氧、排出二氧化碳）', { 'font-size': 15, fill: '#5A6478' });
  el('rect', { x: 300, y: 520, width: 400, height: 62, rx: 16, fill: '#FBE9E4', stroke: '#23304A', 'stroke-width': 2.5 }, rig);
  let cap = ''; for (let i = 0; i < 9; i++) { const x = 330 + i * 42; cap += `M${x} 526q10 12 0 24q-10 12 0 24`; } el('path', { d: cap, fill: 'none', stroke: '#C9837A', 'stroke-width': 2, opacity: .6 }, rig);
  el('path', { d: 'M318 548C420 540 580 560 682 548', fill: 'none', stroke: '#8E6FA8', 'stroke-width': 3, opacity: .6 }, rig);
  txt(rig, 500, 560, '全身組織（微血管：細胞用掉氧）', { 'font-size': 15 });
  // 血管：粗管＋流動的血球
  const V = {
    pa: { d: `M${hx - 40} ${hy - 60} C${hx - 120} ${hy - 140} ${hx - 200} 230 300 205`, col: BLUE, name: '肺動脈', lx: 236, ly: 262 },
    pv: { d: `M700 205 C${hx + 200} 230 ${hx + 150} ${hy - 110} ${hx + 70} ${hy - 70}`, col: RED, name: '肺靜脈', lx: 774, ly: 262 },
    aorta: { d: `M${hx + 30} ${hy - 80} C${hx + 120} ${hy - 160} ${hx + 250} ${hy - 40} ${hx + 220} ${hy + 60} S${hx + 170} 480 650 520`, col: RED, name: '主動脈', lx: 770, ly: 420 },
    vc: { d: `M350 520 C${hx - 210} 470 ${hx - 230} ${hy - 40} ${hx - 110} ${hy - 50}`, col: BLUE, name: '大靜脈', lx: 236, ly: 420 }
  };
  const sel = step === 'lung' || step === 'body';
  for (const [k, v] of Object.entries(V)) {
    const on = k === s.site, g = el('g', {}, rig);
    if (on) el('path', { d: v.d, fill: 'none', stroke: '#F4C04E', 'stroke-width': 28, opacity: .55, 'stroke-linecap': 'round' }, g);
    el('path', { d: v.d, fill: 'none', stroke: '#23304A', 'stroke-width': on ? 17 : 13, 'stroke-linecap': 'round', opacity: on ? 1 : .6 }, g);
    el('path', { id: 'ci-p-' + k, d: v.d, fill: 'none', stroke: v.col, 'stroke-width': on ? 13 : 9, 'stroke-linecap': 'round', opacity: on ? 1 : .6 }, g);
    el('path', { d: v.d, fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: .35, transform: 'translate(-2 -2)' }, g);
    const hit = el('path', { d: v.d, fill: 'none', stroke: 'transparent', 'stroke-width': 34 }, g);
    if (can && sel && hit.getTotalLength) { const pt = hit.getPointAtLength(hit.getTotalLength() * ({ pa: .3, pv: .15, aorta: .8, vc: .4 })[k]); el('circle', { cx: n1(pt.x), cy: n1(pt.y), r: 16, fill: 'transparent', 'data-drag': 'v-' + k }, g); }
    if (on && !reduce) for (let i = 0; i < 5; i++) { const c = el('ellipse', { rx: 4.5, ry: 3, fill: v.col === RED ? '#FF8A80' : '#9CC3F0', stroke: '#fff', 'stroke-width': 1, 'pointer-events': 'none' }, g); const am = el('animateMotion', { dur: `${(60 / r.hr * 2.2).toFixed(2)}s`, begin: `-${(i * 60 / r.hr * .44).toFixed(2)}s`, repeatCount: 'indefinite', rotate: 'auto' }, c); el('mpath', { href: '#ci-p-' + k }, am); }
    txt(rig, v.lx, v.ly, v.name, { 'font-size': on ? 17 : 14, fill: on ? '#23304A' : '#5A6478', 'pointer-events': 'none' });
    if (can && sel) drag(g, () => ({ move() {}, end() {}, cancel() {} }), { label: `看${v.name}`, tap: () => { if (k !== s.site) set({ site: k }); } });
  }
  // 心臟（觀察者看到的左邊是右心房、右心室）
  const hg = el('g', {}, rig), hp = `M${hx} ${hy - 80} C${hx - 140} ${hy - 180} ${hx - 220} ${hy - 10} ${hx} ${hy + 150} C${hx + 220} ${hy - 10} ${hx + 140} ${hy - 180} ${hx} ${hy - 80} Z`;
  el('path', { d: hp, fill: 'url(#ci-heart)', stroke: '#7A2A24', 'stroke-width': 4 }, hg);
  el('path', { d: `M${hx - 4} ${hy - 70}Q${hx + 20} ${hy + 20} ${hx + 6} ${hy + 130}`, fill: 'none', stroke: '#9A3A32', 'stroke-width': 3, opacity: .6 }, hg);
  if (!reduce) el('animateTransform', { attributeName: 'transform', type: 'scale', values: '1;1.04;1', dur: `${(60 / r.hr).toFixed(2)}s`, repeatCount: 'indefinite', additive: 'sum' }, hg), hg.setAttribute('transform-origin', `${hx} ${hy}`);
  const room = (x, y, t, col) => { el('rect', { x: x - 50, y: y - 26, width: 100, height: 52, rx: 16, fill: col, opacity: .92, stroke: '#fff', 'stroke-width': 2 }, hg); txt(hg, x, y + 6, t, { fill: '#fff', 'font-size': 15 }); };
  room(hx - 60, hy - 36, '右心房', BLUE); room(hx - 60, hy + 30, '右心室', BLUE); room(hx + 60, hy - 36, '左心房', RED); room(hx + 60, hy + 30, '左心室', RED);
  txt(rig, hx, hy + 110, `♥ ${f1(r.hr)} 次／分`, { 'font-size': 17, fill: '#fff', 'font-weight': 900, 'pointer-events': 'none' });
  el('rect', { x: 120, y: 300, width: 16, height: 16, rx: 4, fill: RED }, rig); txt(rig, 142, 314, '充氧血', { 'text-anchor': 'start', 'font-size': 14, fill: '#5A6478' });
  el('rect', { x: 120, y: 326, width: 16, height: 16, rx: 4, fill: BLUE }, rig); txt(rig, 142, 340, '缺氧血', { 'text-anchor': 'start', 'font-size': 14, fill: '#5A6478' });
  // 運動強度：拖跑者
  if (step === 'exercise') {
    const ci = INT.indexOf(s.intensity);
    el('path', { d: `M${TX(0)} 616H${TX(2)}`, stroke: '#C9BFAE', 'stroke-width': 8, 'stroke-linecap': 'round' }, rig);
    INT.forEach((v, i) => { el('circle', { cx: TX(i), cy: 616, r: 5, fill: '#8792A6' }, rig); txt(rig, TX(i), 644, ['靜止', '慢跑 50%', '激烈 100%'][i], { 'font-size': 12, fill: v === s.intensity ? '#23304A' : '#8792A6' }); });
    const g = el('g', { 'data-drag': can ? 'runner' : null }, rig), m = el('g', {}, g), x = TX(ci);
    el('circle', { cx: x, cy: 600, r: 22, fill: '#fff', stroke: '#C8372D', 'stroke-width': 3 }, m);
    el('circle', { cx: x + 2, cy: 588, r: 4, fill: '#23304A' }, m);
    el('path', { d: s.intensity ? `M${x + 1} 592l-3 10l-7 6M${x - 2} 602l6 8M${x} 595l8 2M${x} 595l-8 4` : `M${x + 2} 592v12M${x + 2} 604l-4 8M${x + 2} 604l4 8M${x + 2} 596l-6 4M${x + 2} 596l6 4`, stroke: '#23304A', 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' }, m);
    el('rect', { x: x - 28, y: 574, width: 56, height: 56, fill: 'transparent' }, m);
    if (can) drag(g, p0 => { let xx = x; return { move(p) { xx = Math.max(TX(0), Math.min(TX(2), x + p.x - p0.x)); m.setAttribute('transform', `translate(${n1(xx - x)} 0)`); },
      end() { let bi = 0; INT.forEach((_, i) => { if (Math.abs(TX(i) - xx) < Math.abs(TX(bi) - xx)) bi = i; }); if (INT[bi] !== s.intensity) set({ intensity: INT[bi] }); else m.removeAttribute('transform'); }, cancel() { m.removeAttribute('transform'); } }; },
      { label: '跑快一點', tap: () => set({ intensity: INT[(ci + 1) % 3] }) });
  }
  hint(500, step === 'exercise' ? 674 : 612, sel ? '點一條血管，看裡面的血從哪裡來、到哪裡去' : step === 'exercise' ? '拖跑步的人，改變運動強度' : '');
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
  model, scene, viewBox: s => s === 'exercise' ? { desk: '100 40 800 660', phone: '100 40 800 660' } : { desk: '100 40 800 600', phone: '100 40 800 600' }, phoneText: 1.4,
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
