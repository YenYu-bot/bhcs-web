// 光的反射與折射實驗桌（新版實驗桌設計）
// 反射角、折射角與臨界角直接用 scripts/science/models.mjs 的 calculate('reflection-refraction')。
import { calculate } from '../../../scripts/science/models.mjs';
import { $, Teacher, renderSteps, fly, bump, reduceMotion } from '../shared/lab.js';
import { openNotebook } from '../shared/notebook.mjs';

const NS = 'http://www.w3.org/2000/svg';
const P = '../../../assets/science/props/';
const db = await openNotebook('bhcs.lab.reflection-refraction.v1');
const CRIT = Math.asin(1 / 1.5) * 180 / Math.PI;     // 玻璃→空氣臨界角，與模型同一式
const MEDIA = { 'air-glass': ['空氣', '玻璃'], 'air-water': ['空氣', '水'], 'glass-air': ['玻璃', '空氣'] };
const FILL = { 空氣: 'rgba(255,255,255,0)', 水: 'rgba(110,175,235,.35)', 玻璃: 'rgba(170,220,225,.55)' };
const deg = x => x === null ? '—' : `${Math.round(x * 10) / 10}°`;
const angleName = a => Math.abs(a - CRIT) < 1e-9 ? `臨界角 ${deg(CRIT)}` : deg(a);
function light(scene, media, incident) {
  return calculate('reflection-refraction', { mode: scene === 'mirror' ? 'mirror' : 'refract', media, incident, dist: 10 });
}

const STEPS = [
  { id: 'mirror', label: '平面鏡' },
  { id: 'glass', label: '進入玻璃' },
  { id: 'water', label: '換成水' },
  { id: 'out', label: '射出玻璃' },
  { id: 'tir', label: '全反射' },
  { id: 'quiz', label: '說說看' }
];
const NEXT = { mirror: 'glass', glass: 'water', water: 'out', out: 'tir', tir: 'quiz' };
const LAB = {
  mirror: { scene: 'mirror', media: 'air-glass', opts: [20, 40], need: [20, 40], start: 20 },
  glass: { scene: 'refract', media: 'air-glass', opts: [0, 30], need: [0, 30], start: 0 },
  water: { scene: 'refract', media: 'air-water', opts: [30], need: [30], start: 30 },
  out: { scene: 'refract', media: 'glass-air', opts: [30], need: [30], start: 30 },
  tir: { scene: 'refract', media: 'glass-air', opts: [30, CRIT, 45], need: [CRIT, 45], start: 30 }
};
const TASK = {
  mirror: { title: '照平面鏡：從法線量角', goal: '按雷射筆打開光。入射角 20° 時收下一次；再拖雷射筆（或按「40°」）轉到 40°，再收下一次。',
    intro: '雷射筆對準鏡子。虛線是法線，垂直鏡面。角度從法線量起！',
    found: ['入射角改變，反射角也跟著變，而且永遠一樣大。', '反射角 ＝ 入射角（都從法線量）'] },
  glass: { title: '光從空氣射進玻璃', goal: '下面換成玻璃。先讓光垂直射入（0°）收下；再轉到 30° 斜射收下，看光有沒有偏折。',
    intro: '光從空氣進入玻璃。垂直射入和斜斜射入，有什麼不一樣？',
    found: ['垂直射入不偏折；斜射進玻璃，光偏向法線。', '入射角 30° → 折射角約 19.5°（比入射角小）'] },
  water: { title: '角度不變，只換成水', goal: '入射角還是 30°，只把玻璃換成水。按雷射筆打光，和玻璃比一比，再收下。',
    intro: '同樣 30° 射進水裡，偏折會比玻璃多還是少？',
    found: ['進水也偏向法線，但偏得比玻璃少。', '30° 入射：水約 22.1°、玻璃約 19.5°'] },
  out: { title: '改從玻璃射向空氣', goal: '光從玻璃裡面射向空氣，入射角一樣 30°。按雷射筆打光，看折射光偏向哪一邊，再收下。',
    intro: '這次光從玻璃射出到空氣。折射角會比 30° 大還是小？',
    found: ['從玻璃射入空氣，光偏離法線：折射角比入射角大。', '30° 入射 → 折射角約 48.6°'] },
  tir: { title: '找出全反射', goal: '一樣從玻璃射向空氣。把入射角轉到臨界角（約 41.8°）收下一次，再轉到 45° 收下一次。',
    intro: '入射角越大，折射光越貼近介面。轉大一點看看！',
    found: ['到臨界角，折射光貼著介面；超過臨界角，折射光消失，全部反射。', '玻璃→空氣：入射角 ＞ 41.8° 就全反射'] },
  quiz: { title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。',
    intro: '最後三題！想想你收下的證據。',
    found: ['你看懂光的路徑了！', '從法線量角；進密偏向法線、出密偏離法線'] }
};
const QUIZ = [
  { q: '讀入射角和反射角時，要從哪一條線開始量？', options: [
    { text: '從鏡面。', why: '角度從法線量起：入射 20° 是光和法線的夾角，不是和鏡面的夾角。' },
    { text: '從垂直於鏡面的法線。', ok: true },
    { text: '從桌面邊緣。', why: '桌面邊緣和光路無關，要用垂直於鏡面的法線。' }] },
  { q: '入射角都是 30°，哪一組觀察正確？', options: [
    { text: '進玻璃和離開玻璃，都偏向法線。', why: '你的證據：進玻璃折射角約 19.5°（偏向法線），離開玻璃約 48.6°（偏離法線）。' },
    { text: '折射角都是 30°。', why: '只有垂直射入（0°）才不偏折；30° 斜射一定會偏折。' },
    { text: '空氣進玻璃偏向法線，玻璃進空氣偏離法線。', ok: true }] },
  { q: '光從玻璃射向空氣，哪一個情況只剩反射光？', options: [
    { text: '入射角 45°，超過臨界角。', ok: true },
    { text: '剛好在臨界角（約 41.8°）。', why: '在臨界角，折射光還在，只是貼著介面走；超過臨界角才消失。' },
    { text: '入射角 30°，小於臨界角。', why: '30° 時還有折射光（約 48.6°）。' }] }
];

/* ---------- 狀態 ---------- */
const fresh = () => ({ v: 1, step: 'mirror', a: 20, on: false, records: [], done: [], quiz: { i: 0, pick: null } });
function loadState() {
  const s = db.load();
  try {
    if (!s || s.v !== 1 || !STEPS.some(x => x.id === s.step) || !Array.isArray(s.records) || !Array.isArray(s.done) || !s.quiz) throw 0;
    const L = LAB[s.step];
    if (L && !L.opts.some(o => Math.abs(o - s.a) < 1e-9)) throw 0;
    if (typeof s.on !== 'boolean' || s.records.some(r => !MEDIA[r.media])) throw 0;
    return s;
  } catch { return fresh(); }
}
let S = loadState(), foundShown = null, lastNote = null;
const save = () => db.save(S);
const L = () => LAB[S.step];
const isLab = () => !!L();
const same = (a, b) => Math.abs(a - b) < 1e-9;
const has = (step, a) => S.records.some(r => r.step === step && same(r.a, a));

const svg = $('#scene'), rig = $('#rig');
const teacher = new Teacher($('#teacher-pic'), $('#bubble'), $('#live'));
const el = (tag, a = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (parent) parent.append(n); return n; };
const txt = (parent, x, y, s, a = {}) => { const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#23304A', ...a }, parent); t.textContent = s; return t; };

/* ---------- 場景 ---------- */
const O = { x: 720, y: 330 }, R = 230, RAD = Math.PI / 180;
const pt = (ang, r, up) => ({ x: O.x + Math.sin(ang * RAD) * r * (up === 'in' ? -1 : 1), y: O.y + Math.cos(ang * RAD) * r * (up === 'down' ? 1 : -1) });
function arc(a0, a1, r, quadrant, color, label) {
  // quadrant: 'in'（左上，入射）、'up'（右上，反射）、'down'（右下，折射）
  if (Math.abs(a1 - a0) < 0.5) return;
  const p0 = pt(a0, r, quadrant), p1 = pt(a1, r, quadrant), sweep = quadrant === 'in' ? 0 : quadrant === 'up' ? 1 : 0;
  el('path', { d: `M ${p0.x} ${p0.y} A ${r} ${r} 0 0 ${sweep} ${p1.x} ${p1.y}`, fill: 'none', stroke: color, 'stroke-width': 3 }, rig);
  const m = pt(Math.max(a1 * 0.6, 12), r + 14, quadrant);
  txt(rig, m.x + (quadrant === 'in' ? -6 : 6), m.y + 5, label, { 'font-size': 15, 'font-weight': 900, fill: color, 'text-anchor': quadrant === 'in' ? 'end' : 'start', stroke: '#fff', 'stroke-width': 5, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
}
function line(p, q, color, w, op = 1, dash = '') {
  el('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', opacity: op, 'stroke-dasharray': dash }, rig);
}
function drawBench() {
  const { scene, media } = L(), a = S.a, r = light(scene, media, a), [m1, m2] = MEDIA[media];
  // 介質
  if (scene === 'mirror') {
    el('rect', { x: 260, y: O.y, width: 760, height: 22, fill: '#B9D8EE', stroke: '#3E6C9A', 'stroke-width': 3 }, rig);
    for (let x = 270; x < 1010; x += 22) el('line', { x1: x, y1: O.y + 22, x2: x + 14, y2: O.y + 40, stroke: '#5A6478', 'stroke-width': 2 }, rig);
    txt(rig, 330, O.y + 70, '平面鏡', { 'font-size': 18, 'font-weight': 900 });
  } else {
    el('rect', { x: 260, y: 80, width: 760, height: O.y - 80, fill: FILL[m1] }, rig);
    el('rect', { x: 260, y: O.y, width: 760, height: 260, fill: FILL[m2] }, rig);
    el('line', { x1: 260, y1: O.y, x2: 1020, y2: O.y, stroke: '#3E6C9A', 'stroke-width': 3 }, rig);
    for (const [name, y] of [[m1, O.y - 22], [m2, O.y + 40]]) { el('rect', { x: 276, y: y - 22, width: 74, height: 32, rx: 10, fill: '#fff', stroke: '#23304A', 'stroke-width': 2 }, rig); txt(rig, 313, y, name, { 'font-size': 17, 'font-weight': 900 }); }
  }
  // 法線
  el('line', { x1: O.x, y1: 90, x2: O.x, y2: 575, stroke: '#23304A', 'stroke-width': 2, 'stroke-dasharray': '8 6' }, rig);
  txt(rig, O.x + 34, 106, '法線', { 'font-size': 15, 'font-weight': 900 });
  // 光線
  const src = pt(a, R, 'in');
  if (S.on) {
    line(src, O, '#E0302A', 6);
    const refl = pt(r.reflection, R, 'up'), strong = scene === 'mirror' || r.kind === 'tir';
    line(O, refl, '#E0302A', strong ? 6 : 3, strong ? 1 : 0.45);
    arc(0, a, 74, 'in', '#C8372D', `入射 ${angleName(a)}`.replace('入射 臨界角', '臨界角'));
    if (a > 0.5) arc(0, r.reflection, 74, 'up', '#C8372D', `反射 ${deg(r.reflection)}`);
    if (scene !== 'mirror' && r.kind !== 'tir') {
      const refr = pt(r.refraction, R, 'down');
      line(O, refr, '#E0302A', 6);
      if (r.refraction > 0.5) arc(0, Math.min(r.refraction, 89.5), 92, 'down', '#2F6FB0', `折射 ${deg(r.refraction)}`);
      if (Math.abs(r.refraction - 90) < 1e-9) txt(rig, O.x + 190, O.y - 14, '折射光貼著介面', { 'font-size': 15, 'font-weight': 900, fill: '#2F6FB0' });
    }
    if (r.kind === 'tir') { el('rect', { x: O.x + 30, y: O.y + 60, width: 260, height: 36, rx: 12, fill: '#fff', stroke: '#C8372D', 'stroke-width': 2.5 }, rig); txt(rig, O.x + 160, O.y + 84, '沒有折射光：全反射！', { 'font-size': 16, 'font-weight': 900, fill: '#C8372D' }); }
  }
  // 雷射筆（按一下打開；可拖動改角度）
  const rot = Math.atan2(O.y - src.y, O.x - src.x) / RAD, lw = 150, lh = 27;
  const g = el('g', { class: 'tool drag', tabindex: 0, role: 'slider', 'aria-label': S.on ? '雷射筆：拖動或用方向鍵改變入射角' : '雷射筆：按一下打開', 'aria-valuetext': `入射角 ${deg(a)}` }, rig);
  const back = { x: src.x - Math.cos(rot * RAD) * (lw - 10), y: src.y - Math.sin(rot * RAD) * (lw - 10) };
  el('circle', { class: 'tool-ring', cx: (src.x + back.x) / 2, cy: (src.y + back.y) / 2, r: 82, fill: 'rgba(255,255,255,.35)', stroke: '#E0A21B', 'stroke-width': 4 }, g);
  const lg = el('g', { transform: `translate(${src.x} ${src.y}) rotate(${rot})` }, g);
  el('image', { href: P + 'prop-laser-pointer.webp', x: -lw + 10, y: -lh / 2, width: lw, height: lh }, lg);
  if (!S.on || (!readyToSave() && L().opts.length > 1)) g.classList.add('cue');
  if (!S.on) txt(rig, (src.x + back.x) / 2, Math.max(src.y, back.y) + 60, '按雷射筆打光', { 'font-size': 15, 'font-weight': 900, fill: '#C8372D' });
  g.addEventListener('pointerdown', startDrag);
  g.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); turnOn(); }
    const i = L().opts.findIndex(o => same(o, S.a));
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); setA(L().opts[Math.min(L().opts.length - 1, i + 1)]); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); setA(L().opts[Math.max(0, i - 1)]); }
  });
}
function drawSummary() {
  el('line', { x1: 300, y1: O.y, x2: 980, y2: O.y, stroke: '#3E6C9A', 'stroke-width': 3 }, rig);
  el('line', { x1: O.x, y1: 120, x2: O.x, y2: 540, stroke: '#23304A', 'stroke-width': 2, 'stroke-dasharray': '8 6' }, rig);
  txt(rig, O.x, 580, '證據都在左邊的光路紀錄裡', { 'font-size': 20, 'font-weight': 900 });
}
function draw() {
  const hadFocus = !!document.activeElement && rig.contains(document.activeElement);
  rig.replaceChildren();
  if (isLab()) drawBench(); else drawSummary();
  if (hadFocus) { const f = rig.querySelector('.tool'); if (f) f.focus({ preventScroll: true }); }
}

/* ---------- 操作 ---------- */
let drag = null;
function startDrag(e) {
  e.preventDefault();
  drag = { x: e.clientX, y: e.clientY, moved: false };
  addEventListener('pointermove', moveDrag);
  addEventListener('pointerup', () => { removeEventListener('pointermove', moveDrag); if (drag && !drag.moved) turnOn(); drag = null; }, { once: true });
}
function moveDrag(e) {
  if (!drag) return;
  if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) drag.moved = true;
  if (!drag.moved) return;
  const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
  const q = p.matrixTransform(svg.getScreenCTM().inverse());
  const ang = Math.atan2(O.x - q.x, O.y - q.y) / RAD;
  const near = L().opts.reduce((x, y) => Math.abs(y - ang) < Math.abs(x - ang) ? y : x);
  if (!S.on) S.on = true;
  setA(near, true);
}
function turnOn() { if (!isLab() || S.on) return; S.on = true; foundShown = null; lastNote = null; save(); render(); }
function setA(a, force = false) {
  if (!isLab() || a === undefined) return;
  if (same(a, S.a) && !force) return;
  S.a = a; S.on = true; foundShown = null; lastNote = null; save(); render();
}

/* ---------- 讀值 ---------- */
let prev = {};
function setReading(i, label, val, unit, note) {
  $('#l-' + i).textContent = label; $('#u-' + i).textContent = unit; $('#n-' + i).textContent = note;
  const n = $('#r-' + i), v = String(val);
  if (prev[i] !== undefined && prev[i] !== v) { n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick'); }
  prev[i] = v; n.textContent = v;
}
function renderReadouts() {
  if (!isLab() || !S.on) {
    setReading(1, '入射角', '—', '', isLab() ? '先按雷射筆打光' : '從法線量起');
    setReading(2, '反射角', '—', '', ''); setReading(3, '折射角', '—', '', ''); return;
  }
  const { scene, media } = L(), r = light(scene, media, S.a), [m1, m2] = MEDIA[media];
  setReading(1, '入射角', deg(S.a), '', scene === 'mirror' ? '照向平面鏡' : `${m1} → ${m2}`);
  setReading(2, '反射角', deg(r.reflection), '', '和入射角一樣大');
  if (scene === 'mirror') setReading(3, '折射角', '—', '', '鏡子不透光');
  else setReading(3, '折射角', r.kind === 'tir' ? '沒有' : deg(r.refraction), '', { normal: '垂直入射，不偏折', toward: '偏向法線', away: '偏離法線', tir: '全反射' }[r.kind]);
}
function rowText(rec) {
  const r = light(rec.scene, rec.media, rec.a), [m1, m2] = MEDIA[rec.media];
  return { path: rec.scene === 'mirror' ? '平面鏡' : `${m1}→${m2}`, inc: angleName(rec.a), refl: deg(r.reflection), refr: rec.scene === 'mirror' ? '—' : r.kind === 'tir' ? '全反射' : deg(r.refraction), kind: r.kind };
}
function drawTable() {
  const rows = S.records.slice(-5);
  $('#table').innerHTML = rows.length ? `<table><thead><tr><th>光路</th><th>入射</th><th>反射</th><th>折射</th></tr></thead><tbody>${rows.map(rec => { const t = rowText(rec); return `<tr><td>${t.path}</td><td><b>${t.inc}</b></td><td>${t.refl}</td><td class="${t.kind === 'toward' ? 'virt' : t.kind === 'away' || t.kind === 'tir' ? 'real' : ''}">${t.refr}</td></tr>`; }).join('')}</tbody></table>${S.records.length > 5 ? '<p>顯示最新 5 筆，全部在研究手冊。</p>' : ''}` : '<p>收下觀察後，角度會排在這裡，方便比較。</p>';
}

/* ---------- 余老師 ---------- */
function oops(t) { teacher.last = ''; teacher.say(t, { pose: 'think', tone: 'oops' }); lastNote = t; }
const readyToSave = () => isLab() && S.on && L().need.some(n => same(n, S.a)) && !has(S.step, S.a);
const stepDone = () => isLab() && L().need.every(n => has(S.step, n));
function talk() {
  if (lastNote) return;
  if (foundShown) {
    const f = TASK[foundShown].found;
    const action = foundShown === 'quiz' ? { label: '看成果 →', run: openFinish } : { label: '下一步 →', run: () => goStep(NEXT[foundShown]) };
    teacher.say(f[0], { pose: 'cheer', tone: 'found', tag: '發現時刻', eq: f[1], action }); return;
  }
  const step = S.step, done = S.done.includes(step), task = TASK[step];
  if (step === 'quiz') { teacher.say(done ? '全部完成了！可以按「看成果」。' : task.intro, { pose: done ? 'thumb' : 'think' }); return; }
  if (done) { teacher.say('這一步完成了，按任務卡的「下一步」繼續。', { pose: 'thumb' }); return; }
  if (!S.on) { teacher.say(task.intro, { pose: 'point' }); return; }
  const r = light(L().scene, L().media, S.a), next = L().need.find(n => !has(step, n));
  if (readyToSave()) {
    const msg = L().scene === 'mirror' ? `入射 ${deg(S.a)}，反射也是 ${deg(r.reflection)}。收下這次觀察。`
      : r.kind === 'normal' ? '垂直射入：光直直穿過，沒有偏折。收下這次觀察。'
      : r.kind === 'tir' ? '折射光不見了！全部反射回玻璃裡。收下這次觀察。'
      : Math.abs(r.refraction - 90) < 1e-9 ? '臨界角：折射角 90°，折射光貼著介面走。收下這次觀察。'
      : `入射 ${deg(S.a)}，折射 ${deg(r.refraction)}：${r.kind === 'toward' ? '偏向法線' : '偏離法線'}。收下這次觀察。`;
    teacher.say(msg, { pose: 'wow' }); return;
  }
  teacher.say(has(step, S.a) ? `收下了！${next !== undefined ? `轉到 ${angleName(next)}。` : ''}` : `入射 ${angleName(S.a)}：${r.kind === 'tir' ? '全反射' : `折射 ${deg(r.refraction)}`}。${next !== undefined ? `這一步要收下的是 ${angleName(next)}。` : ''}`, { pose: 'point' });
}

/* ---------- 任務卡 ---------- */
function renderTask() {
  const i = STEPS.findIndex(x => x.id === S.step), task = TASK[S.step], done = S.done.includes(S.step);
  $('#task-kicker').textContent = `任務 ${i + 1} / ${STEPS.length}${done ? '　✓ 已完成' : ''}`;
  $('#task-title').textContent = task.title; $('#task-goal').textContent = task.goal;
  const go = $('#task-go');
  if (done && S.step === 'quiz') { go.hidden = false; go.textContent = '看成果 →'; go.onclick = openFinish; }
  else if (done) { go.hidden = false; go.textContent = '下一步 →'; go.onclick = () => goStep(NEXT[S.step]); }
  else go.hidden = true;
  $('#dock-pull').hidden = !isLab(); $('#dock-quiz').hidden = S.step !== 'quiz';
  if (isLab()) {
    const opts = L().opts, box = $('#ctl-btns');
    $('#ctl-label').innerHTML = opts.length > 1 ? '入射角 <small>拖雷射筆，或按下面的角度</small>' : '雷射筆 <small>入射角固定 30°</small>';
    box.className = 'picker-btns ' + (opts.length > 2 ? 'three' : opts.length > 1 ? 'two' : 'one');
    box.replaceChildren(...(opts.length > 1 ? opts : [null]).map(o => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn-soft';
      if (o === null) { b.textContent = S.on ? '已打光' : '打開雷射筆'; b.disabled = S.on; b.addEventListener('click', turnOn); return b; }
      b.textContent = `${same(o, CRIT) ? '臨界角 41.8°' : o + '°'}${has(S.step, o) ? ' ✓' : ''}`; b.setAttribute('aria-pressed', String(S.on && same(o, S.a))); b.addEventListener('click', () => setA(o, true)); return b;
    }));
  }
  $('#save').classList.toggle('cue', readyToSave());
  if (S.step === 'quiz') renderQuiz();
}

/* ---------- 說說看 ---------- */
function renderQuiz() {
  const qi = Math.min(S.quiz.i, QUIZ.length - 1), item = QUIZ[qi];
  $('#quiz-q').textContent = `第 ${qi + 1} / ${QUIZ.length} 題　${item.q}`;
  $('#quiz').replaceChildren(...item.options.map((o, k) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = o.text;
    if (S.quiz.pick === k) b.classList.add(o.ok ? 'ok' : 'bad');
    b.addEventListener('click', () => {
      S.quiz.pick = k; lastNote = null;
      if (!o.ok) { save(); render(); oops(o.why); return; }
      if (qi < QUIZ.length - 1) {
        save(); render(); teacher.last = '';
        teacher.say('答對了！', { pose: 'thumb', action: { label: '下一題 →', run: () => { S.quiz = { i: qi + 1, pick: null }; lastNote = null; save(); teacher.last = ''; render(); } } });
        lastNote = 'quiz-ok';
      } else { if (!S.done.includes('quiz')) S.done.push('quiz'); foundShown = 'quiz'; save(); render(); }
    });
    return b;
  }));
}

/* ---------- 證據 ---------- */
function renderEvidence() {
  const n = S.records.length;
  $('#ev-count').textContent = n; $('#note-count').textContent = n; $('#ev-empty').hidden = n > 0;
  const chips = $('#chips'), want = S.records.slice(-4).reverse(), key = want.map(r => r.n).join(',');
  if (chips.dataset.key === key) return; chips.dataset.key = key;
  chips.replaceChildren(...want.map(rec => { const t = rowText(rec), li = document.createElement('li'); li.className = 'chip'; li.innerHTML = `<small>#${rec.n} ${t.path}・入射 ${t.inc}</small><b>${rec.scene === 'mirror' ? '反射 ' + t.refl : t.kind === 'tir' ? '全反射' : '折射 ' + t.refr}</b><span class="res ok">${{ mirror: '反射角 ＝ 入射角', normal: '不偏折', toward: '偏向法線', away: '偏離法線', tir: '沒有折射光' }[t.kind]}</span>`; return li; }));
}
function keep() {
  if (!isLab()) return;
  if (!readyToSave()) {
    const next = L().need.find(n => !has(S.step, n));
    oops(!S.on ? '先按雷射筆打光。' : next === undefined ? '這一步都收下了。' : has(S.step, S.a) ? `這個角度收下了，轉到 ${angleName(next)}。` : `這一步要收下的是 ${angleName(next)}。`); return;
  }
  if (S.records.length >= 60) { oops('手冊滿 60 張了，清空紀錄才能再收。'); return; }
  const { scene, media } = L(), r = light(scene, media, S.a);
  S.records.push({ n: S.records.length + 1, at: new Date().toISOString(), step: S.step, scene, media, a: S.a, reflection: r.reflection, refraction: r.refraction, kind: r.kind });
  lastNote = null;
  if (stepDone() && !S.done.includes(S.step)) { S.done.push(S.step); foundShown = S.step; }
  save();
  const target = isVisible($('#evidence')) ? $('#evidence') : $('#note-count');
  fly($('#save'), target, `入射 ${angleName(S.a)}`).then(() => { renderEvidence(); bump($('#note-count')); });
  render();
}
const isVisible = n => { const r = n.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };

/* ---------- 步驟 ---------- */
function goStep(id) {
  S.step = id; foundShown = null; lastNote = null;
  if (LAB[id]) { S.a = LAB[id].start; S.on = false; }
  if (id === 'quiz' && !S.done.includes('quiz')) S.quiz = { i: 0, pick: null };
  save(); teacher.last = ''; render();
  if (narrow.matches) scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
}
function resetStep() { if (S.step === 'quiz') S.quiz = { i: 0, pick: null }; goStep(S.step); }

/* ---------- 對話框 ---------- */
function openNotes() {
  const body = $('#notes-body'); body.replaceChildren();
  if (!S.records.length) { const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="5" class="notes-empty">還沒有證據。</td>'; body.append(tr); }
  for (const rec of S.records) {
    const t = rowText(rec), tr = document.createElement('tr');
    tr.innerHTML = `<td>${rec.n}</td>` + [t.path, t.inc, t.refl, t.refr].map(c => `<td>${c}</td>`).join('');
    body.append(tr);
  }
  $('#notes-dialog').showModal();
}
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#F4C04E" stroke="#23304A" stroke-width="1.2" stroke-linejoin="round"/></svg>';
function openFinish() {
  const got = STEPS.filter(s => S.done.includes(s.id)).length;
  $('#stars').innerHTML = STEPS.map(s => S.done.includes(s.id) ? STAR : STAR.replace('<svg', '<svg class="off"')).join('');
  $('#stars').setAttribute('aria-label', `完成 ${STEPS.length} 個任務中的 ${got} 個`);
  $('#finish-list').innerHTML = [
    S.done.includes('mirror') && '<li><b>反射</b>：20° 對 20°、40° 對 40°</li>',
    S.done.includes('glass') && '<li><b>空氣→玻璃</b>：0° 不偏折；30° 折射約 19.5°</li>',
    S.done.includes('water') && '<li><b>空氣→水</b>：30° 折射約 22.1°，偏得比玻璃少</li>',
    S.done.includes('out') && '<li><b>玻璃→空氣</b>：30° 折射約 48.6°，偏離法線</li>',
    S.done.includes('tir') && '<li><b>全反射</b>：臨界角約 41.8°，45° 時沒有折射光</li>'
  ].filter(Boolean).join('');
  $('#finish-dialog').showModal();
}
let resetting = false;
async function clearAll() {
  if (resetting) return;
  if (!confirm('要清空這一站的所有證據和進度，從第 1 步重新開始嗎？')) return;
  resetting = true; let cleared;
  try { cleared = await db.clear(); } finally { resetting = false; }
  if (!cleared) return;
  S = fresh(); foundShown = null; lastNote = null; teacher.last = '';
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  render(); if (narrow.matches) scrollTo({ top: 0 });
}

/* ---------- 版面 ---------- */
const narrow = matchMedia('(max-width: 860px)');
function fitScene() { svg.setAttribute('viewBox', narrow.matches ? '300 10 720 600' : '60 20 960 580'); }
narrow.addEventListener?.('change', () => render());
function render() {
  renderSteps($('#steps'), STEPS, S.step, new Set(S.done), id => goStep(id));
  fitScene(); draw(); drawTable(); renderReadouts(); renderEvidence(); renderTask(); talk();
}

$('#save').addEventListener('click', keep);
$('#task-reset').addEventListener('click', resetStep);
$('#clear-records').addEventListener('click', clearAll);
$('#reset-all').addEventListener('click', clearAll);
$('#why').addEventListener('click', () => $('#why-dialog').showModal());
$('#open-notes').addEventListener('click', openNotes);
document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

render();
