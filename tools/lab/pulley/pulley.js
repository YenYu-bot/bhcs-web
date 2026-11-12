// 滑輪實驗桌（新版試用）
// 科學計算沿用正式站 tools/pulley-desk/model.mjs（拉力、繩長、功與幾何位置），不另寫模型。
import { calculate, geometry, TARGET_CM, WEIGHT_N } from '../../pulley-desk/model.mjs';
import { $, store, Teacher, renderSteps, fly, bump, reduceMotion } from '../shared/lab.js';

const NS = 'http://www.w3.org/2000/svg';
const P = '../../../assets/science/props/';
const SC = 4;                        // 每公分 4 個單位
const BASE = { fixed: 540, movable: 417 };
const X = 500, R = 34;               // 滑輪中心 x、輪半徑
const db = store('bhcs.lab.pulley.v1');
const NAME = { fixed: '定滑輪', movable: '動滑輪' };

const STEPS = [
  { id: 'fixed', label: '定滑輪' },
  { id: 'movable', label: '動滑輪' },
  { id: 'calc', label: '算一算功' },
  { id: 'quiz', label: '說說看' }
];
const NEXT = { fixed: 'movable', movable: 'calc', calc: 'quiz' };
const TASK = {
  fixed: { title: '定滑輪：把木箱升高 20 cm', goal: '抓住黃色把手往下拉（或按「拉 1 cm／拉 5 cm」），木箱到 20 cm 後按「收下這次觀察」。',
    intro: '抓住黃色把手往下拉，把木箱升到 20 cm！',
    found: ['定滑輪不省力：拉力 10 N，就是木箱的重量。', '木箱升 20 cm，繩子也拉 20 cm'] },
  movable: { title: '動滑輪：同一個木箱再升高 20 cm', goal: '這次把黃色把手往上拉。注意看拉力和繩子拉的長度，到 20 cm 後收下觀察。',
    intro: '這次往上拉。拉力和繩子長度，會跟定滑輪一樣嗎？',
    found: ['動滑輪省一半的力，但繩子要拉兩倍長。', '拉力 5 N，繩子拉了 40 cm'] },
  calc: { title: '算一算：兩種滑輪各做了多少功？', goal: '功 ＝ 拉力 × 繩子拉的距離。距離先從 cm 換成 m，答案用焦耳（J）。',
    intro: '用兩張證據算算看。記得 1 m ＝ 100 cm。',
    found: ['兩種都是 2 J！拉力不一樣，做的功卻一樣多。', '10 N × 0.20 m ＝ 5 N × 0.40 m ＝ 2 J'] },
  quiz: { title: '說說看：哪一句話說得對？', goal: '用你收下的證據和算出來的功，選出正確的說法。',
    intro: '最後一題！想想兩張證據，哪一句說得對？',
    found: ['省力不省功！', '省了力，就要多拉距離'] }
};
const QUIZ = [
  { id: 'a', text: '動滑輪省力，也省功。', why: '動滑輪確實省力，但繩子要拉兩倍長，算出來的功沒有變少。' },
  { id: 'b', text: '動滑輪省一半的力，但繩子要拉兩倍長，兩種做的功一樣。', ok: true },
  { id: 'c', text: '定滑輪比較省力，因為繩子只要拉 20 cm。', why: '定滑輪拉得短，可是拉力要 10 N，比動滑輪的 5 N 大。' }
];

/* ---------- 狀態 ---------- */
const fresh = () => ({ v: 1, step: 'fixed', h: 0, saved: false, records: [], done: [], calc: { fixed: '', movable: '' }, pick: null });
function loadState() {
  const s = db.load();
  if (!s || s.v !== 1 || !STEPS.some(x => x.id === s.step) || !Number.isInteger(s.h) || s.h < 0 || s.h > TARGET_CM || !Array.isArray(s.records) || !Array.isArray(s.done) || !s.calc) return fresh();
  if (!s.records.every(r => NAME[r.device] && r.h === TARGET_CM)) return fresh();
  return s;
}
let S = loadState(), shownH = S.h, foundShown = null, lastNote = null, dragging = null, warnedDown = false;
const save = () => db.save(S);
const device = () => (S.step === 'fixed' || S.step === 'movable') ? S.step : 'movable';
const liveH = () => (S.step === 'fixed' || S.step === 'movable') ? shownH : TARGET_CM;

const svg = $('#scene'), rig = $('#rig');
const teacher = new Teacher($('#teacher-pic'), $('#bubble'), $('#live'));
const el = (tag, a = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (parent) parent.append(n); return n; };
const txt = (parent, x, y, s, a = {}) => { const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#23304A', ...a }, parent); t.textContent = s; return t; };
const yc = (dev, cm) => BASE[dev] - cm * SC;

/* ---------- 場景 ---------- */
function draw() {
  const dev = device(), h = Math.round(liveH() * 10) / 10, g = geometry(dev, Math.round(h));
  const rope = dev === 'fixed' ? h : 2 * h;
  const loadY = yc(dev, dev === 'fixed' ? 20 + h : 10 + h);
  const endY = yc(dev, dev === 'fixed' ? 40 - h : 30 + 2 * h);
  const hadFocus = !!document.activeElement && rig.contains(document.activeElement);
  rig.replaceChildren();
  const rope2 = (x1, y1, x2, y2) => el('line', { x1, y1, x2, y2, stroke: '#7A5A3A', 'stroke-width': 5, 'stroke-linecap': 'round' }, rig);
  let wheelY, crateTop, crateX;
  if (dev === 'fixed') {
    wheelY = yc('fixed', g.anchorCm);
    el('rect', { x: 330, y: wheelY - 112, width: 340, height: 24, rx: 6, fill: '#C48E4C', stroke: '#23304A', 'stroke-width': 4 }, rig);
    rope2(X - R, wheelY, X - R, loadY);           // 左段：吊木箱
    rope2(X + R, wheelY, X + R, endY);            // 右段：到彈簧秤
    el('image', { href: P + 'prop-pulley-wheel.webp', x: X - 40, y: wheelY - 83, width: 80, height: 118 }, rig);
    crateX = X - R; crateTop = loadY + 6;
  } else {
    const anchorY = yc('movable', g.anchorCm), ax = X - R;
    el('rect', { x: 300, y: anchorY - 24, width: 196, height: 24, rx: 6, fill: '#C48E4C', stroke: '#23304A', 'stroke-width': 4 }, rig);
    wheelY = loadY;
    rope2(ax, anchorY, ax, wheelY);               // 固定端往下到動滑輪
    rope2(X + R, wheelY, X + R, endY);            // 另一段往上到手
    el('circle', { cx: ax, cy: anchorY + 2, r: 6, fill: '#23304A' }, rig);
    const pg = el('g', { transform: `translate(${X} ${wheelY}) scale(1 -1)` }, rig);
    el('image', { href: P + 'prop-pulley-wheel.webp', x: -40, y: -83, width: 80, height: 118 }, pg);
    crateX = X; crateTop = wheelY + 89;
  }
  // 滑輪轉動記號
  const deg = rope * SC / (2 * Math.PI * 22) * 360 * (dev === 'fixed' ? 1 : -1);
  const mg = el('g', { transform: `translate(${X} ${wheelY}) rotate(${deg.toFixed(1)})` }, rig);
  el('circle', { cx: 0, cy: -19, r: 4.5, fill: '#C8372D' }, mg);
  // 木箱
  el('line', { x1: crateX, y1: crateTop - 6, x2: crateX, y2: crateTop + 2, stroke: '#23304A', 'stroke-width': 3 }, rig);
  el('image', { href: P + 'prop-wooden-crate.webp', x: crateX - 45, y: crateTop, width: 90, height: 89 }, rig);
  const tag = el('g', {}, rig);
  el('rect', { x: crateX - 30, y: crateTop + 30, width: 60, height: 28, rx: 14, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 2 }, tag);
  txt(tag, crateX, crateTop + 50, `${WEIGHT_N} N`, { 'font-size': 16, 'font-weight': 900 });
  // 刻度尺（木箱上緣的高度）
  const top0 = crateTop + h * SC, rx = crateX - 92;
  el('rect', { x: rx - 6, y: top0 - TARGET_CM * SC - 10, width: 12, height: TARGET_CM * SC + 20, rx: 4, fill: '#FFF8EC', stroke: '#23304A', 'stroke-width': 2 }, rig);
  for (let c = 0; c <= TARGET_CM; c += 5) {
    const y = top0 - c * SC;
    el('line', { x1: rx - 6, y1: y, x2: rx + (c % 10 ? 2 : 6), y2: y, stroke: '#23304A', 'stroke-width': 2 }, rig);
    txt(rig, rx - 22, y + 5, String(c), { 'font-size': 13, fill: '#5A6478' });
  }
  txt(rig, rx, top0 + 32, 'cm', { 'font-size': 13, fill: '#5A6478' });
  const doneLift = Math.round(h) >= TARGET_CM;
  el('line', { class: doneLift ? '' : 'target-line', x1: rx + 8, y1: top0 - TARGET_CM * SC, x2: crateX + 52, y2: top0 - TARGET_CM * SC, stroke: doneLift ? '#2E7D63' : '#E0A21B', 'stroke-width': 4, 'stroke-dasharray': '10 7' }, rig);
  el('path', { d: `M ${rx + 8} ${crateTop} l 12 -7 v 14 z`, fill: '#C8372D' }, rig);
  // 彈簧秤與把手
  const c = calculate(dev, Math.round(h));
  const up = dev === 'movable';
  const sg = el('g', { transform: `translate(${X + R} ${endY + (up ? -48 : 48)}) rotate(${up ? 90 : -90})` }, rig);
  el('image', { href: P + 'prop-spring-scale.webp', x: -48, y: -7.6, width: 96, height: 15.2 }, sg);
  const fy = endY + (up ? -60 : 36);
  el('rect', { x: X + R + 18, y: fy, width: 70, height: 30, rx: 15, fill: '#2F6FB0' }, rig);
  txt(rig, X + R + 53, fy + 21, `${c.forceN} N`, { fill: '#FFFFFF', 'font-size': 17, 'font-weight': 900 });
  const hy = endY + (up ? -100 : 100);
  const hg = el('g', { class: 'handle', tabindex: 0, role: 'slider', 'aria-label': `拉繩把手，${up ? '往上' : '往下'}拉`, 'aria-valuemin': 0, 'aria-valuemax': TARGET_CM, 'aria-valuenow': Math.round(h), 'aria-valuetext': `木箱升高 ${Math.round(h)} 公分` }, rig);
  el('circle', { class: 'handle-ring', cx: X + R, cy: hy, r: 30, fill: 'none', stroke: '#E0A21B', 'stroke-width': 4 }, hg);
  el('circle', { cx: X + R, cy: hy, r: 20, fill: '#F4C04E', stroke: '#23304A', 'stroke-width': 3 }, hg);
  txt(hg, X + R, hy + 6, up ? '↑' : '↓', { 'font-size': 20, 'font-weight': 900 });
  el('circle', { cx: X + R, cy: hy, r: 46, fill: 'transparent' }, hg);
  if (S.step === dev && !doneLift) {
    hg.classList.add('cue');
    txt(rig, X + R + 84, hy + 6, up ? '往上拉' : '往下拉', { 'font-size': 18, 'font-weight': 900, fill: '#C8372D' });
  }
  bindHandle(hg, dev);
  if (hadFocus) hg.focus({ preventScroll: true });
}

/* ---------- 拉繩 ---------- */
function toSvg(e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
function hFromPointer(dev, py) {
  const endY = py + (dev === 'movable' ? 100 : -100);
  const endCm = (BASE[dev] - endY) / SC;
  return dev === 'fixed' ? 40 - endCm : (endCm - 30) / 2;
}
function canPull() { return (S.step === 'fixed' || S.step === 'movable') && !S.saved; }
function bindHandle(node, dev) {
  node.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    if (!canPull()) { pullBlocked(); return; }
    e.preventDefault();
    dragging = { dev, id: e.pointerId };
    document.body.classList.add('dragging');
  });
  node.addEventListener('keydown', e => {
    const key = dev === 'fixed' ? 'ArrowDown' : 'ArrowUp';
    if (e.key === key || e.key === 'ArrowRight') { e.preventDefault(); pull(e.shiftKey ? 5 : 1); }
  });
}
// 拖曳在整個視窗追蹤：畫面重畫換掉把手元素也不會中斷
addEventListener('pointermove', e => {
  if (!dragging || dragging.id !== e.pointerId) return;
  e.preventDefault();
  let h = hFromPointer(dragging.dev, toSvg(e).y);
  if (h < S.h - 0.5 && !warnedDown) { warnedDown = true; oops('這個實驗只往上升；想重來，按任務卡的「重來這一步」。'); }
  h = Math.max(S.h, Math.min(TARGET_CM, h));
  shownH = h; draw(); renderReadouts();
}, { passive: false });
const endDrag = e => {
  if (!dragging || dragging.id !== e.pointerId) return;
  dragging = null; document.body.classList.remove('dragging');
  setH(Math.round(shownH), false);
};
addEventListener('pointerup', endDrag);
addEventListener('pointercancel', endDrag);
function pullBlocked() {
  if (S.step === 'calc' || S.step === 'quiz') oops('這一步不用拉繩子，看任務卡要做的事。');
  else if (S.saved) oops('這一輪已經收下了。想再拉一次，按「重來這一步」。');
}
function pull(cm) { if (!canPull()) { pullBlocked(); return; } setH(Math.min(TARGET_CM, S.h + cm), true); }
let tween = 0;
function setH(h, animate) {
  if (h === S.h && !animate) { shownH = h; render(); return; }
  const from = shownH; S.h = h; lastNote = null; warnedDown = false; save();
  cancelAnimationFrame(tween);
  if (!animate || reduceMotion()) { shownH = h; render(); return; }
  const t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / 320), e = 1 - Math.pow(1 - k, 3);
    shownH = from + (h - from) * e; draw(); renderReadouts();
    if (k < 1) tween = requestAnimationFrame(step); else { shownH = h; render(); }
  };
  tween = requestAnimationFrame(step);
}

/* ---------- 讀值 ---------- */
let prev = {};
function tick(id, v) { const n = $(id); if (prev[id] !== undefined && prev[id] !== v) { n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick'); } prev[id] = v; n.textContent = v; }
function renderReadouts() {
  const dev = device(), h = Math.round(liveH()), c = calculate(dev, h);
  tick('#r-force', c.forceN); tick('#r-height', h); tick('#r-rope', c.ropeCm);
  $('#r-force-note').textContent = NAME[dev] + (dev === 'fixed' ? '：拉力＝木箱重' : '：兩段繩子一起拉');
  $('#r-rope-note').textContent = dev === 'fixed' ? '和木箱升高一樣' : '是木箱升高的 2 倍';
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
  if (step === 'fixed' || step === 'movable') {
    const h = S.h, s = step === 'fixed' ? h : 2 * h;
    if (S.saved) teacher.say(done ? '這一步完成了，按任務卡的「下一步」繼續。' : '已經收下了！', { pose: 'thumb' });
    else if (h >= TARGET_CM) teacher.say(step === 'fixed' ? '到 20 cm 了！拉力 10 N，繩子拉了 20 cm。收下這次觀察。' : '到了！拉力只要 5 N，繩子卻拉了 40 cm。收下這次觀察。', { pose: step === 'fixed' ? 'cheer' : 'wow' });
    else if (h === 0) teacher.say(task.intro, { pose: 'point' });
    else teacher.say(step === 'fixed' ? `木箱升高 ${h} cm，繩子也拉了 ${s} cm。繼續拉！` : `木箱升高 ${h} cm，繩子卻拉了 ${s} cm！繼續拉。`, { pose: step === 'fixed' ? 'point' : 'wow' });
    return;
  }
  if (step === 'calc') {
    const miss = ['fixed', 'movable'].filter(d => !S.records.some(r => r.device === d));
    if (miss.length) { teacher.say(`還少${miss.map(d => NAME[d]).join('和')}的證據，先回去收下來。`, { pose: 'think' }); return; }
    teacher.say(done ? '算對了！按任務卡的「下一步」繼續。' : task.intro, { pose: done ? 'thumb' : 'notebook' }); return;
  }
  teacher.say(done ? '全部完成了！可以按「看成果」。' : task.intro, { pose: done ? 'thumb' : 'think' });
}

/* ---------- 任務卡 ---------- */
function renderTask() {
  const i = STEPS.findIndex(x => x.id === S.step), task = TASK[S.step], done = S.done.includes(S.step);
  $('#task-kicker').textContent = `任務 ${i + 1} / ${STEPS.length}${done ? '　✓ 已完成' : ''}`;
  $('#task-title').textContent = task.title;
  $('#task-goal').textContent = task.goal;
  const go = $('#task-go');
  if (done && S.step === 'quiz') { go.hidden = false; go.textContent = '看成果 →'; go.onclick = openFinish; }
  else if (done) { go.hidden = false; go.textContent = '下一步 →'; go.onclick = () => goStep(NEXT[S.step]); }
  else go.hidden = true;
  const pullStep = S.step === 'fixed' || S.step === 'movable';
  $('#dock-pull').hidden = !pullStep; $('#dock-calc').hidden = S.step !== 'calc'; $('#dock-quiz').hidden = S.step !== 'quiz';
  $('#pull-1').disabled = $('#pull-5').disabled = !canPull() || S.h >= TARGET_CM;
  $('#save').classList.toggle('cue', pullStep && S.h >= TARGET_CM && !S.saved);
  if (S.step === 'calc') renderCalc();
  if (S.step === 'quiz') renderQuiz();
}

/* ---------- 算一算 ---------- */
function rec(dev) { return S.records.find(r => r.device === dev); }
function renderCalc() {
  for (const d of ['fixed', 'movable']) {
    const r = rec(d), inp = $('#calc-' + d);
    $('#eq-' + d).textContent = r ? `拉力 ${r.force} N × 拉了 ${r.rope} cm` : '（還沒有證據）';
    inp.disabled = !r;
    if (document.activeElement !== inp) inp.value = S.calc[d] || '';
  }
  $('#check').disabled = !rec('fixed') || !rec('movable');
}
function parse(v) { const t = String(v).trim().replace(/[Ｊj J]/g, '').replace('，', '.'); return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN; }
function check() {
  const res = {};
  for (const d of ['fixed', 'movable']) {
    const inp = $('#calc-' + d); S.calc[d] = inp.value; const v = parse(inp.value);
    res[d] = Math.abs(v - 2) < 1e-9;
    inp.classList.toggle('ok', res[d]); inp.classList.toggle('bad', !res[d] && inp.value.trim() !== '');
  }
  save();
  if (res.fixed && res.movable) {
    if (!S.done.includes('calc')) S.done.push('calc');
    foundShown = 'calc'; lastNote = null; save(); render(); return;
  }
  const wrong = ['fixed', 'movable'].find(d => !res[d]), v = parse($('#calc-' + wrong).value), r = rec(wrong);
  let msg;
  if (Number.isNaN(v)) msg = `先在${NAME[wrong]}那一格填數字。`;
  else if (Math.abs(v - r.force * r.rope) < 1e-9) msg = `${v} 是 N·cm。把 ${r.rope} cm 換成 ${(r.rope / 100).toFixed(2)} m 再乘。`;
  else if (Math.abs(v - r.force * r.rope / 10) < 1e-9 || Math.abs(v - r.rope / 100) < 1e-9) msg = `再檢查一次：${r.force} N × ${(r.rope / 100).toFixed(2)} m ＝ ？`;
  else msg = `${NAME[wrong]}：拉力 ${r.force} N 乘上繩子拉的距離（m）。`;
  oops(msg);
}

/* ---------- 說說看 ---------- */
function renderQuiz() {
  const box = $('#quiz');
  box.replaceChildren(...QUIZ.map(q => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = q.text;
    if (S.pick === q.id) b.classList.add(q.ok ? 'ok' : 'bad');
    b.addEventListener('click', () => {
      S.pick = q.id; lastNote = null;
      if (q.ok) { if (!S.done.includes('quiz')) S.done.push('quiz'); foundShown = 'quiz'; save(); render(); }
      else { save(); render(); oops(q.why); }
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
  chips.replaceChildren(...want.map(r => {
    const li = document.createElement('li'); li.className = 'chip';
    li.innerHTML = `<small>#${r.n} ${NAME[r.device]}</small><b>${r.force} N ｜ 拉 ${r.rope} cm</b><span class="res ok">木箱升 ${r.h} cm</span>`;
    return li;
  }));
}
function keep() {
  const step = S.step;
  if (step !== 'fixed' && step !== 'movable') return;
  if (S.saved) { oops('這一輪已經收下了。想再做一次，按「重來這一步」。'); return; }
  if (S.h < TARGET_CM) { oops(`先把木箱升到 20 cm 再收下（現在 ${S.h} cm）。`); return; }
  if (S.records.length >= 50) { oops('手冊滿 50 張了，清空紀錄才能再收。'); return; }
  const c = calculate(step, S.h);
  S.records.push({ n: S.records.length + 1, device: step, force: c.forceN, h: S.h, rope: c.ropeCm, at: new Date().toISOString() });
  S.saved = true; lastNote = null;
  if (!S.done.includes(step)) { S.done.push(step); foundShown = step; }
  save();
  const target = isVisible($('#evidence')) ? $('#evidence') : $('#note-count');
  fly($('#save'), target, `${NAME[step]} ${c.forceN} N`).then(() => { renderEvidence(); bump($('#note-count')); });
  render();
}
function isVisible(n) { const r = n.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }

/* ---------- 步驟 ---------- */
function goStep(id) {
  S.step = id; foundShown = null; lastNote = null; warnedDown = false;
  if (id === 'fixed' || id === 'movable') { S.h = 0; S.saved = false; }
  if (id === 'calc') ['fixed', 'movable'].forEach(d => { $('#calc-' + d).value = S.calc[d] || ''; $('#calc-' + d).classList.remove('ok', 'bad'); });
  if (id === 'quiz') S.pick = S.done.includes('quiz') ? S.pick : null;
  shownH = S.h; save(); teacher.last = ''; render();
  if (narrow.matches) scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
}
function resetStep() {
  if (S.step === 'calc') { S.calc = { fixed: '', movable: '' }; ['fixed', 'movable'].forEach(d => { $('#calc-' + d).value = ''; $('#calc-' + d).classList.remove('ok', 'bad'); }); }
  goStep(S.step);
}

/* ---------- 對話框 ---------- */
function openNotes() {
  const body = $('#notes-body'); body.replaceChildren();
  if (!S.records.length) { const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="5" class="notes-empty">還沒有證據。</td>'; body.append(tr); }
  for (const r of S.records) { const tr = document.createElement('tr'); tr.innerHTML = `<td>${r.n}</td><td>${NAME[r.device]}</td><td><b>${r.force} N</b></td><td>${r.h} cm</td><td>${r.rope} cm</td>`; body.append(tr); }
  $('#notes-dialog').showModal();
}
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#F4C04E" stroke="#23304A" stroke-width="1.2" stroke-linejoin="round"/></svg>';
function openFinish() {
  const got = STEPS.filter(s => S.done.includes(s.id)).length;
  $('#stars').innerHTML = STEPS.map(s => S.done.includes(s.id) ? STAR : STAR.replace('<svg', '<svg class="off"')).join('');
  $('#stars').setAttribute('aria-label', `完成 4 個任務中的 ${got} 個`);
  const f = rec('fixed'), m = rec('movable');
  $('#finish-list').innerHTML = [f && `<li><b>定滑輪</b>：拉力 ${f.force} N，繩子拉 ${f.rope} cm → 功 2 J</li>`, m && `<li><b>動滑輪</b>：拉力 ${m.force} N，繩子拉 ${m.rope} cm → 功 2 J</li>`, '<li><b>木箱得到的功</b>：10 N × 0.20 m ＝ 2 J</li>'].filter(Boolean).join('');
  $('#finish-dialog').showModal();
}
function clearAll() {
  if (!confirm('要清空這一站的所有證據和進度，從第 1 步重新開始嗎？')) return;
  db.clear(); S = fresh(); shownH = 0; foundShown = null; lastNote = null; teacher.last = '';
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  ['fixed', 'movable'].forEach(d => { $('#calc-' + d).value = ''; $('#calc-' + d).classList.remove('ok', 'bad'); });
  render(); if (narrow.matches) scrollTo({ top: 0 });
}

/* ---------- 版面 ---------- */
const narrow = matchMedia('(max-width: 860px)');
function fitScene() {
  const fixed = device() === 'fixed';
  svg.setAttribute('viewBox', narrow.matches ? (fixed ? '320 130 360 460' : '320 10 360 570') : (fixed ? '100 120 800 470' : '100 10 800 570'));
}
narrow.addEventListener?.('change', fitScene);
function render() {
  renderSteps($('#steps'), STEPS, S.step, new Set(S.done), id => goStep(id));
  fitScene(); draw(); renderReadouts(); renderEvidence(); renderTask(); talk();
}

$('#pull-1').addEventListener('click', () => pull(1));
$('#pull-5').addEventListener('click', () => pull(5));
$('#save').addEventListener('click', keep);
$('#check').addEventListener('click', check);
['fixed', 'movable'].forEach(d => $('#calc-' + d).addEventListener('keydown', e => { if (e.key === 'Enter') check(); }));
$('#task-reset').addEventListener('click', resetStep);
$('#clear-records').addEventListener('click', clearAll);
$('#reset-all').addEventListener('click', clearAll);
$('#why').addEventListener('click', () => $('#why-dialog').showModal());
$('#open-notes').addEventListener('click', openNotes);
document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

fitScene(); render();
