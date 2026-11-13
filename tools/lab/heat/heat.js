// 比熱實驗桌（新版試用）
// 溫度直接用 tools/specific-heat-desk/model.mjs 的 sample()；不另寫模型。
import { sample, CONFIGS, POWER, INITIAL_TEMPERATURE, DURATION, displayTemperature } from '../../specific-heat-desk/model.mjs';
import { $, store, Teacher, renderSteps, fly, bump, reduceMotion } from '../shared/lab.js';

const NS = 'http://www.w3.org/2000/svg';
const P = '../../../assets/science/props/';
const db = store('bhcs.lab.heat.v1');
const T0 = INITIAL_TEMPERATURE, Q_ALL = POWER * DURATION;          // 20 °C、21 J/s × 60 s ＝ 1260 J
const r1 = x => Math.round(x * 10) / 10;
const tempOf = (id, t) => sample(id, t).temperature;
const NAME = { water100: '水 100 g', iron100: '鐵 100 g', iron200: '鐵 200 g' };
const COLOR = { water100: '#2F6FB0', iron100: '#C8372D', iron200: '#E08A1E' };

const STEPS = [
  { id: 'water', label: '加熱水' },
  { id: 'iron', label: '加熱鐵' },
  { id: 'calc', label: '算一算' },
  { id: 'mass', label: '鐵變兩倍' },
  { id: 'quiz', label: '說說看' }
];
const NEXT = { water: 'iron', iron: 'calc', calc: 'mass', mass: 'quiz' };
const HEAT = { water: 'water100', iron: 'iron100', mass: 'iron200' };
const TASK = {
  water: { title: '加熱 100 g 的水 60 秒', goal: '按電熱板的旋鈕（或「開始加熱」）。看溫度計和溫度–時間圖，加熱滿 60 秒後按「收下這次觀察」。',
    intro: '燒杯裡有 100 g 的水，20°C。轉開電熱板，看溫度怎麼變！',
    found: ['水加熱 60 秒，只升高 3°C。', '20.0°C → 23.0°C，吸收 1260 J'] },
  iron: { title: '換成 100 g 的鐵，一樣加熱 60 秒', goal: '同一個電熱板、同樣 60 秒，鐵塊也吸收 1260 J。加熱完收下，和水比一比。',
    intro: '這次是 100 g 的鐵塊，一樣從 20°C 開始。你猜它會升高幾度？',
    found: ['同樣的熱量，鐵升高 28°C，水只升高 3°C！', '水 23.0°C、鐵 48.0°C：鐵比較容易熱'] },
  calc: { title: '算一算：熱量和溫升', goal: '用你收下的兩張證據，算出每一份吸收的熱量和溫度升高多少，再算出比熱。',
    intro: '溫度高，不代表吸收的熱比較多。算算看就知道！',
    found: ['水的比熱 4.2，鐵只有 0.45 J／(g·°C)。', '比熱 ＝ 熱量 ÷（質量 × 溫升）：1260 ÷（100 × 28）＝ 0.45'] },
  mass: { title: '鐵變成 200 g，再加熱 60 秒', goal: '只改質量：200 g 的鐵一樣吸收 1260 J。溫度會升高多少？加熱完收下來，和 100 g 的鐵比一比。',
    intro: '鐵塊變成兩倍重。同樣加熱 60 秒，溫升會怎樣？',
    found: ['質量變 2 倍，溫升變一半！', '鐵 100 g 升高 28°C → 鐵 200 g 升高 14°C'] },
  quiz: { title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。',
    intro: '最後三題！想想你收下的證據。',
    found: ['你分清熱量、溫升和比熱了！', 'Q ＝ m × c × ΔT'] }
};
const QUIZ = [
  { q: '水和鐵各 100 g，都吸收 1260 J。水升高 3°C、鐵升高 28°C。哪一個比熱比較大？', options: [
    { text: '鐵，因為它溫度升得比較高。', why: '升溫多，代表每升高 1°C 需要的熱比較少，也就是比熱「小」。' },
    { text: '水，因為吸收同樣的熱，它溫度升得比較少。', ok: true },
    { text: '一樣大，因為吸收的熱量一樣。', why: '熱量一樣，但溫升差很多，所以比熱不一樣：水 4.2、鐵 0.45。' }] },
  { q: '200 g 的鐵吸收 1260 J，溫度會升高多少？（100 g 的鐵升高 28°C）', options: [
    { text: '56°C，質量變兩倍，溫升也變兩倍。', why: '剛好相反：熱要分給兩倍多的鐵，每 1 g 分到的熱只有一半。' },
    { text: '28°C，都是鐵，溫升一樣。', why: '你的證據：200 g 的鐵從 20.0°C 升到 34.0°C，只升高 14°C。' },
    { text: '14°C，質量變兩倍，溫升變一半。', ok: true }] },
  { q: '夏天中午，沙灘很燙，海水卻比較涼。主要原因是什麼？', options: [
    { text: '海水吸收的陽光比較少。', why: '同一片陽光，吸收的熱差不多；差別在升高溫度需要的熱。' },
    { text: '水的比熱比沙子大，吸收同樣的熱，溫度升得比較少。', ok: true },
    { text: '沙子的質量比海水大。', why: '海水的質量其實大得多；關鍵是水的比熱大。' }] }
];
const CALC = [
  { id: 'q', name: '每一份吸收的熱量', eq: '每秒 21 J × 加熱 60 秒', answer: Q_ALL, unit: 'J' },
  { id: 'dw', name: '水升高', eq: '水的末溫 − 初溫 20°C', answer: tempOf('water100', DURATION) - T0, unit: '°C' },
  { id: 'di', name: '鐵升高', eq: '鐵的末溫 − 初溫 20°C', answer: tempOf('iron100', DURATION) - T0, unit: '°C' },
  { id: 'ci', name: '鐵的比熱', eq: '1260 ÷（100 g × 鐵升高）', answer: Q_ALL / (CONFIGS.iron100.mass * (tempOf('iron100', DURATION) - T0)), unit: 'J/(g·°C)' }
];

/* ---------- 狀態 ---------- */
const fresh = () => ({ v: 1, step: 'water', t: 0, saved: false, records: [], done: [], calc: {}, quiz: { i: 0, pick: null } });
function loadState() {
  const s = db.load();
  try {
    if (!s || s.v !== 1 || !STEPS.some(x => x.id === s.step) || typeof s.t !== 'number' || !(s.t >= 0 && s.t <= DURATION)) throw 0;
    if (!Array.isArray(s.records) || !Array.isArray(s.done) || !s.calc || !s.quiz) throw 0;
    if (s.records.some(r => !CONFIGS[r.id])) throw 0;
    return s;
  } catch { return fresh(); }
}
let S = loadState(), foundShown = null, lastNote = null, running = false, raf = 0, lastFrame = 0, tick = 0;
const save = () => db.save(S);
const cfg = () => HEAT[S.step] || null;
const isHeat = () => !!HEAT[S.step];
const recOf = id => [...S.records].reverse().find(r => r.id === id);
const shownT = () => isHeat() ? S.t : 0;

const svg = $('#scene'), rig = $('#rig');
const teacher = new Teacher($('#teacher-pic'), $('#bubble'), $('#live'));
const el = (tag, a = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (parent) parent.append(n); return n; };
const txt = (parent, x, y, s, a = {}) => { const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#23304A', ...a }, parent); t.textContent = s; return t; };

/* ---------- 場景 ---------- */
const HP = { x: 450, y: 400, w: 300, h: 166 };                  // 電熱板
const PLATE = HP.y + HP.h * 0.24;                               // 樣本放置面
const KNOB = { x: HP.x + HP.w * 0.5, y: HP.y + HP.h * 0.7, r: 28 };
const TH = { x: 600, top: 150, bottom: 410 };                  // 溫度計
const T_MIN = 20, T_MAX = 50, COL_LO = 382, COL_HI = 200;      // 刻度對應的 y
const yOfT = T => COL_LO - (T - T_MIN) / (T_MAX - T_MIN) * (COL_LO - COL_HI);
const SW = { x: 790, y: 250, w: 120 };                           // 碼錶
function draw() {
  const id = cfg() || 'water100', t = shownT(), T = tempOf(id, t);
  const hadFocus = !!document.activeElement && rig.contains(document.activeElement);
  rig.replaceChildren();
  // 電熱板（發熱時盤面泛紅）
  el('image', { href: P + 'prop-hotplate.webp', x: HP.x, y: HP.y, width: HP.w, height: HP.h }, rig);
  if (running) {
    el('ellipse', { cx: HP.x + HP.w / 2, cy: HP.y + HP.h * 0.2, rx: HP.w * 0.36, ry: HP.h * 0.11, fill: 'rgba(230,80,40,.45)' }, rig);
    for (let k = 0; k < 3; k++) el('path', { class: 'wave', d: `M ${HP.x + 70 + k * 80} ${PLATE - 6} q 6 -10 0 -20 q -6 -10 0 -20`, fill: 'none', stroke: 'rgba(230,90,40,.7)', 'stroke-width': 3, 'stroke-linecap': 'round', style: `animation-delay:${k * 0.35}s` }, rig);
  }
  // 溫度計（先畫，樣本蓋住感溫球）
  const th = el('g', {}, rig);
  el('image', { href: P + 'prop-thermometer.webp', x: TH.x - 16, y: TH.top, width: 32, height: TH.bottom - TH.top }, th);
  el('rect', { x: TH.x - 2.5, y: yOfT(T), width: 5, height: COL_LO + 22 - yOfT(T), rx: 2.5, fill: '#D8342B' }, th);
  for (let v = T_MIN; v <= T_MAX; v += 5) {
    const y = yOfT(v), major = v % 10 === 0;
    el('line', { x1: TH.x + 16, y1: y, x2: TH.x + (major ? 30 : 24), y2: y, stroke: '#23304A', 'stroke-width': 2 }, th);
    if (major) txt(th, TH.x + 46, y + 5, String(v), { 'font-size': 13, 'font-weight': 700 });
  }
  txt(th, TH.x + 46, COL_HI - 18, '°C', { 'font-size': 13, 'font-weight': 700 });
  // 樣本
  if (id === 'water100') {
    const bx = TH.x - 85, bw = 170, bh = 200, by = PLATE + 8 - bh;
    el('rect', { x: bx + 12, y: by + 70, width: bw - 24, height: bh - 82, rx: 8, fill: 'rgba(110,175,235,0.55)' }, rig);
    el('line', { x1: bx + 12, y1: by + 70, x2: bx + bw - 12, y2: by + 70, stroke: 'rgba(255,255,255,.85)', 'stroke-width': 3 }, rig);
    el('image', { href: P + 'prop-beaker.webp', x: bx, y: by, width: bw, height: bh }, rig);
  } else {
    const big = id === 'iron200', bw = big ? 210 : 160, bh = big ? 84 : 64, bx = TH.x - bw / 2, by = PLATE + 4 - bh;
    const warm = Math.min(1, (T - T0) / 30);
    el('image', { href: P + 'prop-metal-block.webp', x: bx, y: by, width: bw, height: bh, preserveAspectRatio: 'none' }, rig);
    el('rect', { x: bx + 4, y: by + 4, width: bw - 8, height: bh - 8, rx: 6, fill: `rgba(230,110,40,${0.32 * warm})` }, rig);
  }
  // 樣本名牌
  el('rect', { x: HP.x - 118, y: PLATE + 20, width: 112, height: 34, rx: 10, fill: '#FFFFFF', stroke: '#23304A', 'stroke-width': 2.5 }, rig);
  txt(rig, HP.x - 62, PLATE + 43, NAME[id], { 'font-size': 16, 'font-weight': 900 });
  // 溫度標籤
  el('rect', { x: TH.x - 140, y: yOfT(T) - 18, width: 104, height: 34, rx: 17, fill: '#C8372D' }, rig);
  txt(rig, TH.x - 88, yOfT(T) + 6, `${displayTemperature(T)} °C`, { fill: '#FFFFFF', 'font-size': 17, 'font-weight': 900 });
  // 碼錶
  const sh = SW.w * 512 / 445, cx = SW.x + SW.w * 0.49, cy = SW.y + sh * 0.555, rr = SW.w * 0.34;
  el('image', { href: P + 'prop-stopwatch.webp', x: SW.x, y: SW.y, width: SW.w, height: sh }, rig);
  el('circle', { cx, cy, r: rr, fill: '#FFF8E6' }, rig);
  for (let k = 0; k < 12; k++) {
    const a = k / 12 * Math.PI * 2, r0 = rr - (k % 3 === 0 ? 9 : 5);
    el('line', { x1: cx + Math.sin(a) * r0, y1: cy - Math.cos(a) * r0, x2: cx + Math.sin(a) * (rr - 2), y2: cy - Math.cos(a) * (rr - 2), stroke: '#23304A', 'stroke-width': 2 }, rig);
  }
  const ang = t / 60 * Math.PI * 2;
  el('line', { x1: cx, y1: cy, x2: cx + Math.sin(ang) * (rr - 8), y2: cy - Math.cos(ang) * (rr - 8), stroke: '#C8372D', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, rig);
  el('circle', { cx, cy, r: 4.5, fill: '#23304A' }, rig);
  txt(rig, cx, SW.y + sh + 24, `${Math.floor(t)} 秒`, { 'font-size': 18, 'font-weight': 900 });
  // 旋鈕（直接操作）
  if (isHeat()) {
    const kg = el('g', { class: 'knob', tabindex: 0, role: 'button', 'aria-label': running ? '電熱板旋鈕：暫停加熱' : '電熱板旋鈕：開始加熱', 'aria-pressed': String(running) }, rig);
    el('circle', { class: 'knob-ring', cx: KNOB.x, cy: KNOB.y, r: KNOB.r + 6, fill: 'none', stroke: running ? '#C8372D' : '#E0A21B', 'stroke-width': 4 }, kg);
    el('circle', { cx: KNOB.x, cy: KNOB.y, r: KNOB.r + 18, fill: 'transparent' }, kg);
    if (!running && S.t < DURATION && !S.saved) { kg.classList.add('cue'); txt(rig, KNOB.x - 86, KNOB.y + 6, '轉開加熱', { 'font-size': 17, 'font-weight': 900, fill: '#C8372D' }); }
    if (running) txt(rig, KNOB.x + 84, KNOB.y + 6, '加熱中…', { 'font-size': 16, 'font-weight': 900, fill: '#C8372D' });
    kg.addEventListener('click', toggleHeat);
    kg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleHeat(); } });
    if (hadFocus) kg.focus({ preventScroll: true });
  }
}

/* ---------- 溫度–時間圖 ---------- */
const G = { l: 40, r: 308, t: 22, b: 168 };
const gx = t => G.l + t / DURATION * (G.r - G.l), gy = T => G.b - (T - T_MIN) / (T_MAX - T_MIN) * (G.b - G.t);
function drawGraph() {
  const g = $('#graph'); g.replaceChildren();
  for (let T = T_MIN; T <= T_MAX; T += 10) { el('line', { x1: G.l, y1: gy(T), x2: G.r, y2: gy(T), stroke: '#E6DCCB', 'stroke-width': 1 }, g); txt(g, G.l - 8, gy(T) + 4, String(T), { 'font-size': 11, 'font-weight': 700, 'text-anchor': 'end' }); }
  for (let t = 0; t <= DURATION; t += 20) txt(g, gx(t), G.b + 16, String(t), { 'font-size': 11, 'font-weight': 700 });
  el('path', { d: `M ${G.l} ${G.t} V ${G.b} H ${G.r}`, fill: 'none', stroke: '#23304A', 'stroke-width': 2 }, g);
  txt(g, G.r, G.b + 30, '時間（秒）', { 'font-size': 11, 'font-weight': 700, 'text-anchor': 'end' });
  txt(g, G.l - 6, G.t - 12, '°C', { 'font-size': 11, 'font-weight': 700, 'text-anchor': 'end' });
  const line = (id, tEnd, extra = {}) => el('line', { x1: gx(0), y1: gy(tempOf(id, 0)), x2: gx(tEnd), y2: gy(tempOf(id, tEnd)), stroke: COLOR[id], 'stroke-width': 3, 'stroke-linecap': 'round', ...extra }, g);
  const seen = [];
  for (const id of Object.keys(NAME)) if (recOf(id)) { line(id, DURATION); seen.push(id); txt(g, gx(DURATION) - 4, gy(tempOf(id, DURATION)) - 6, displayTemperature(tempOf(id, DURATION)), { 'font-size': 11, 'font-weight': 900, fill: COLOR[id], 'text-anchor': 'end' }); }
  const id = cfg();
  if (id && S.t > 0 && !S.saved) { line(id, S.t, { 'stroke-dasharray': '5 4' }); el('circle', { cx: gx(S.t), cy: gy(tempOf(id, S.t)), r: 4.5, fill: COLOR[id] }, g); }
  const keys = [...new Set([...seen, ...(id && S.t > 0 && !S.saved ? [id] : [])])];
  $('#graph-key').innerHTML = keys.length ? keys.map(k => `<li><i style="background:${COLOR[k]}"></i>${NAME[k]}${recOf(k) ? '' : '（加熱中）'}</li>`).join('') : '<li>加熱後，這裡會畫出溫度變化</li>';
  g.setAttribute('aria-label', keys.length ? '溫度–時間圖：' + keys.map(k => `${NAME[k]} ${displayTemperature(tempOf(k, recOf(k) ? DURATION : S.t))}°C`).join('，') : '溫度–時間圖，還沒有資料');
}

/* ---------- 加熱 ---------- */
function blocked() {
  if (!isHeat()) oops('這一步不用加熱，看任務卡要做的事。');
  else if (S.saved) oops('這一份已經收下了。想再做一次，按「重來這一步」。');
  else if (S.t >= DURATION) oops('已經加熱滿 60 秒了，按「收下這次觀察」。');
}
function toggleHeat() {
  if (!isHeat() || S.saved || S.t >= DURATION) { blocked(); return; }
  lastNote = null;
  if (running) { stop(); teacher.last = ''; teacher.say(`暫停在 ${Math.floor(S.t)} 秒，溫度 ${displayTemperature(tempOf(cfg(), S.t))}°C。按旋鈕繼續加熱。`, { pose: 'point' }); lastNote = 'paused'; return; }
  if (reduceMotion()) { S.t = DURATION; save(); render(); return; }
  running = true; lastFrame = performance.now(); tick = 0;
  raf = requestAnimationFrame(step);
  render();
}
function step(now) {
  const dt = Math.max(0, Math.min(0.1, (now - lastFrame) / 1000)); lastFrame = Math.max(lastFrame, now);
  S.t = Math.min(DURATION, S.t + dt * 10);                       // 1 真實秒 ＝ 10 秒加熱
  if (S.t >= DURATION) { S.t = DURATION; stop(); save(); render(); return; }
  if (++tick % 10 === 0) save();
  draw(); drawGraph(); renderReadouts(); renderTask(); talk();
  raf = requestAnimationFrame(step);
}
function stop() { running = false; cancelAnimationFrame(raf); save(); }
function skip() {
  if (!isHeat() || S.saved || S.t >= DURATION) { blocked(); return; }
  stop(); S.t = DURATION; lastNote = null; save(); render();
}

/* ---------- 讀值 ---------- */
let prev = {};
function setReading(i, label, val, unit, note) {
  $('#l-' + i).textContent = label; $('#u-' + i).textContent = unit; $('#n-' + i).textContent = note;
  const n = $('#r-' + i), v = String(val);
  if (prev[i] !== undefined && prev[i] !== v && !running) { n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick'); }
  prev[i] = v; n.textContent = v;
}
function renderReadouts() {
  const id = cfg() || recOf('iron100')?.id || 'water100', t = isHeat() ? S.t : DURATION, T = tempOf(id, t);
  setReading(1, '加熱時間', Math.floor(t), '秒', '每秒吸收 21 J');
  setReading(2, '溫度', displayTemperature(T), '°C', `比初溫高 ${displayTemperature(T - T0)}°C`);
  setReading(3, '吸收熱量', Math.round(POWER * Math.floor(t)), 'J', `21 J × ${Math.floor(t)} 秒`);
}

/* ---------- 余老師 ---------- */
function oops(t) { teacher.last = ''; teacher.say(t, { pose: 'think', tone: 'oops' }); lastNote = t; }
function talk() {
  if (lastNote) return;
  if (foundShown) {
    const f = TASK[foundShown].found;
    const action = foundShown === 'quiz' ? { label: '看成果 →', run: openFinish } : { label: '下一步 →', run: () => goStep(NEXT[foundShown]) };
    teacher.say(f[0], { pose: 'cheer', tone: 'found', tag: '發現時刻', eq: f[1], action }); return;
  }
  const step = S.step, done = S.done.includes(step), task = TASK[step];
  if (isHeat()) {
    const T = tempOf(cfg(), S.t);
    if (S.saved || done && S.t === 0) { teacher.say('這一步完成了，按任務卡的「下一步」繼續。', { pose: 'thumb' }); return; }
    if (running) { teacher.say(`加熱中… ${Math.floor(S.t)} 秒，${displayTemperature(T)}°C。`, { pose: 'wow' }); return; }
    if (S.t >= DURATION) { teacher.say(`60 秒到了！${NAME[cfg()]} 從 20.0°C 升到 ${displayTemperature(T)}°C。收下這次觀察。`, { pose: 'wow' }); return; }
    teacher.say(task.intro, { pose: 'point' }); return;
  }
  if (step === 'calc') {
    if (!recOf('water100') || !recOf('iron100')) { teacher.say(`還少「${!recOf('water100') ? '加熱水' : '加熱鐵'}」的證據，先回去收下來。`, { pose: 'think' }); return; }
    teacher.say(done ? '算對了！按任務卡的「下一步」繼續。' : task.intro, { pose: done ? 'thumb' : 'notebook' }); return;
  }
  teacher.say(done ? '全部完成了！可以按「看成果」。' : task.intro, { pose: done ? 'thumb' : 'think' });
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
  $('#dock-pull').hidden = !isHeat(); $('#dock-calc').hidden = S.step !== 'calc'; $('#dock-quiz').hidden = S.step !== 'quiz';
  const heat = $('#heat'), can = isHeat() && !S.saved && S.t < DURATION;
  heat.textContent = running ? '暫停' : S.t > 0 && S.t < DURATION ? '繼續加熱' : '開始加熱';
  heat.disabled = $('#skip').disabled = !can;
  $('#save').classList.toggle('cue', isHeat() && S.t >= DURATION && !S.saved);
  if (S.step === 'calc') renderCalc();
  if (S.step === 'quiz') renderQuiz();
}

/* ---------- 算一算 ---------- */
let calcBuilt = false;
function renderCalc() {
  const w = recOf('water100'), f = recOf('iron100');
  $('#calc-head').textContent = w && f ? `你的證據：水 ${displayTemperature(w.temp)}°C、鐵 ${displayTemperature(f.temp)}°C（都從 20.0°C 開始）` : '先收下「加熱水」和「加熱鐵」的證據';
  const box = $('#calc-rows');
  if (!calcBuilt) {
    calcBuilt = true;
    box.replaceChildren(...CALC.map(r => {
      const lab = document.createElement('label'); lab.className = 'calc-row'; lab.htmlFor = 'calc-' + r.id;
      lab.innerHTML = `<span class="calc-name"><b>${r.name}</b><span class="calc-eq">${r.eq}</span></span><input id="calc-${r.id}" inputmode="decimal" autocomplete="off"><span>${r.unit}</span>`;
      lab.querySelector('input').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
      return lab;
    }));
  }
  const ok = !!(w && f);
  for (const r of CALC) { const inp = $('#calc-' + r.id); inp.disabled = !ok; if (document.activeElement !== inp) inp.value = S.calc[r.id] || ''; }
  $('#check').disabled = !ok;
}
const num = v => { const t = String(v).normalize('NFKC').trim().replace(/[JjＪ°C℃\s]/g, '').replace('，', '.').replace(/,/g, ''); return /^\d*\.?\d+$/.test(t) ? Number(t) : NaN; };
function check() {
  const res = {};
  for (const r of CALC) {
    const inp = $('#calc-' + r.id); S.calc[r.id] = inp.value; const v = num(inp.value);
    res[r.id] = Math.abs(v - r.answer) < 1e-9;
    inp.classList.toggle('ok', res[r.id]); inp.classList.toggle('bad', !res[r.id] && inp.value.trim() !== '');
  }
  save();
  if (CALC.every(r => res[r.id])) { if (!S.done.includes('calc')) S.done.push('calc'); foundShown = 'calc'; lastNote = null; save(); render(); return; }
  const w = CALC.find(r => !res[r.id]), v = num($('#calc-' + w.id).value);
  let msg;
  if (Number.isNaN(v)) msg = `先在「${w.name}」那一格填數字。`;
  else if (w.id === 'q') msg = Math.abs(v - 81) < 1e-9 ? '熱量是相乘，不是相加：每秒 21 J，60 秒就是 21 × 60。' : Math.abs(v - 2520) < 1e-9 ? '不用把兩份加起來，算「一份」吸收多少就好。' : '每秒吸收 21 J，加熱 60 秒：21 × 60 ＝ ？';
  else if (w.id === 'dw') msg = Math.abs(v - 23) < 1e-9 ? '23 是末溫。溫升 ＝ 末溫 − 初溫：23 − 20 ＝ ？' : '水從 20.0°C 升到 23.0°C，升高幾度？';
  else if (w.id === 'di') msg = Math.abs(v - 48) < 1e-9 ? '48 是末溫。溫升 ＝ 48 − 20 ＝ ？' : '鐵從 20.0°C 升到 48.0°C，升高幾度？';
  else msg = Math.abs(v - 4.2) < 1e-9 ? '4.2 是水的比熱。鐵要用鐵的溫升 28°C 來算。' : Math.abs(v - 2800) < 1e-9 ? '分母是 100 × 28 ＝ 2800，還要用 1260 去除以它。' : '比熱 ＝ 1260 ÷（100 × 28）。';
  oops(msg);
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
function chipHtml(r) { return `<small>#${r.n} ${NAME[r.id]}</small><b>${displayTemperature(T0)} → ${displayTemperature(r.temp)}°C</b><span class="res ok">升高 ${displayTemperature(r.rise)}°C</span>`; }
function renderEvidence() {
  const n = S.records.length;
  $('#ev-count').textContent = n; $('#note-count').textContent = n; $('#ev-empty').hidden = n > 0;
  const chips = $('#chips'), want = S.records.slice(-4).reverse(), key = want.map(r => r.n).join(',');
  if (chips.dataset.key === key) return; chips.dataset.key = key;
  chips.replaceChildren(...want.map(r => { const li = document.createElement('li'); li.className = 'chip'; li.innerHTML = chipHtml(r); return li; }));
}
function keep() {
  if (!isHeat()) return;
  if (S.saved) { oops('這一份已經收下了。想再做一次，按「重來這一步」。'); return; }
  if (S.t < DURATION) { oops(`要加熱滿 60 秒才收下（現在 ${Math.floor(S.t)} 秒）。`); return; }
  if (S.records.length >= 50) { oops('手冊滿 50 張了，清空紀錄才能再收。'); return; }
  const id = cfg(), temp = tempOf(id, DURATION);
  S.records.push({ n: S.records.length + 1, at: new Date().toISOString(), id, q: Q_ALL, temp, rise: r1(temp - T0) });
  S.saved = true; lastNote = null;
  if (!S.done.includes(S.step)) { S.done.push(S.step); foundShown = S.step; }
  save();
  const target = isVisible($('#evidence')) ? $('#evidence') : $('#note-count');
  fly($('#save'), target, `${NAME[id]} ${displayTemperature(temp)}°C`).then(() => { renderEvidence(); bump($('#note-count')); });
  render();
}
const isVisible = n => { const r = n.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };

/* ---------- 步驟 ---------- */
function goStep(id) {
  stop();
  S.step = id; foundShown = null; lastNote = null;
  if (HEAT[id]) { S.t = 0; S.saved = false; }
  if (id === 'quiz' && !S.done.includes('quiz')) S.quiz = { i: 0, pick: null };
  calcBuilt = false; save(); teacher.last = ''; render();
  if (narrow.matches) scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
}
function resetStep() {
  if (S.step === 'calc') CALC.forEach(r => delete S.calc[r.id]);
  if (S.step === 'quiz') S.quiz = { i: 0, pick: null };
  goStep(S.step);
}

/* ---------- 對話框 ---------- */
function openNotes() {
  const body = $('#notes-body'); body.replaceChildren();
  if (!S.records.length) { const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="5" class="notes-empty">還沒有證據。</td>'; body.append(tr); }
  for (const r of S.records) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.n}</td>` + [NAME[r.id], `${r.q} J`, `${displayTemperature(T0)} → ${displayTemperature(r.temp)}°C`, `${displayTemperature(r.rise)}°C`].map(c => `<td>${c}</td>`).join('');
    body.append(tr);
  }
  $('#notes-dialog').showModal();
}
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#F4C04E" stroke="#23304A" stroke-width="1.2" stroke-linejoin="round"/></svg>';
function openFinish() {
  const got = STEPS.filter(s => S.done.includes(s.id)).length;
  $('#stars').innerHTML = STEPS.map(s => S.done.includes(s.id) ? STAR : STAR.replace('<svg', '<svg class="off"')).join('');
  $('#stars').setAttribute('aria-label', `完成 ${STEPS.length} 個任務中的 ${got} 個`);
  $('#finish-list').innerHTML = Object.keys(NAME).map(id => recOf(id) && `<li><b>${NAME[id]}</b>：吸收 ${Q_ALL} J，20.0 → ${displayTemperature(recOf(id).temp)}°C，升高 ${displayTemperature(recOf(id).rise)}°C</li>`).filter(Boolean).join('')
    + (S.done.includes('calc') ? '<li><b>比熱</b>：水 4.2、鐵 0.45 J／(g·°C)</li>' : '');
  $('#finish-dialog').showModal();
}
function clearAll() {
  if (!confirm('要清空這一站的所有證據和進度，從第 1 步重新開始嗎？')) return;
  stop(); db.clear(); S = fresh(); foundShown = null; lastNote = null; teacher.last = ''; calcBuilt = false;
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  render(); if (narrow.matches) scrollTo({ top: 0 });
}

/* ---------- 版面 ---------- */
const narrow = matchMedia('(max-width: 860px)');
function fitScene() { svg.setAttribute('viewBox', narrow.matches ? '300 130 650 470' : '150 110 790 500'); }
narrow.addEventListener?.('change', () => render());
function render() {
  renderSteps($('#steps'), STEPS, S.step, new Set(S.done), id => goStep(id));
  fitScene(); draw(); drawGraph(); renderReadouts(); renderEvidence(); renderTask(); talk();
}

$('#heat').addEventListener('click', toggleHeat);
$('#skip').addEventListener('click', skip);
$('#save').addEventListener('click', keep);
$('#check').addEventListener('click', check);
$('#task-reset').addEventListener('click', resetStep);
$('#clear-records').addEventListener('click', clearAll);
$('#reset-all').addEventListener('click', clearAll);
$('#why').addEventListener('click', () => $('#why-dialog').showModal());
$('#open-notes').addEventListener('click', openNotes);
document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
addEventListener('pagehide', () => { if (running) stop(); });

render();
