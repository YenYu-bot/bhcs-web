// 槓桿實驗桌（新版試用）
// 科學模型直接沿用正式站 tools/lever-desk/model.mjs，不另寫計算。
import { IDS, clone, initialLayout, validateLayout, calculate, racks, qualifies, signature } from '../../lever-desk/model.mjs';
import { $, store, Teacher, renderSteps, fly, bump, Spring, reduceMotion } from '../shared/lab.js';

const NS = 'http://www.w3.org/2000/svg';
const PX = 500, PY = 201, U = 7.6, TIP = 8;           // 支點、每公分長度、方向示意角度
const WEIGHT = '../../../assets/science/props/prop-hanging-weight.webp';
const PLANK = '../../../assets/science/props/prop-lever-plank.webp';
const STACK = 62;
const db = store('bhcs.lab.lever.v1');

const STEPS = [
  { id: 'A', label: '原本平衡嗎' },
  { id: 'B', label: '移近一點' },
  { id: 'C', label: '再加一個' },
  { id: 'explore', label: '自由探索' },
  { id: 'challenge', label: '挑戰' }
];
const START = {
  A: () => initialLayout(),
  B: () => initialLayout(),
  C: () => ({ ...initialLayout(), w3: 20 }),
  challenge: () => ({ ...initialLayout(), w1: -15, w2: -15, w3: null })
};
const TASK = {
  A: { intro: '現在兩邊平衡嗎？比較上面的力矩，再按「收下這次觀察」。',
       reach: '兩邊力矩一樣大，木板沒有倒。把這個結果收下來！',
       found: ['兩邊力矩一樣大，槓桿就平衡。', '10 N × 20 cm ＝ 5 N × 40 cm'] },
  B: { intro: '把右邊的砝碼移到 20 cm。猜猜看，會往哪邊倒？',
       reach: '往左倒了！右邊的力矩變小了。收下這次觀察。',
       found: ['力臂減半，力矩也減半，左邊比較大。', '200 ＞ 5 N × 20 cm ＝ 100'] },
  C: { intro: '砝碼留在右邊 20 cm，再掛一個上去，會怎樣？',
       reach: '又平衡了！收下這次觀察。',
       found: ['力變兩倍、力臂減半，力矩不變。', '10 N × 20 cm ＝ 10 N × 20 cm'] },
  explore: { intro: '自由試試看！任何掛法都能收下來比較。準備好就去挑戰。' },
  challenge: { intro: '左邊 10 N 掛在 15 cm。只用一個砝碼，掛在哪裡會平衡？',
       reach: '就是這裡！收下證據，完成挑戰。',
       found: ['挑戰成功！', '10 N × 15 cm ＝ 5 N × 30 cm'] }
};
const NEXT = { A: 'B', B: 'C', C: 'explore', explore: 'challenge' };

/* ---------- 狀態 ---------- */
function fresh() { return { v: 1, step: 'A', layout: START.A(), records: [], done: [] }; }
function loadState() {
  const s = db.load();
  try {
    if (!s || s.v !== 1 || !STEPS.some(x => x.id === s.step) || !Array.isArray(s.records) || !Array.isArray(s.done)) throw 0;
    validateLayout(s.layout); s.records.forEach(r => validateLayout(r.layout));
    return s;
  } catch { return fresh(); }
}
let S = loadState();
let selected = null;          // 目前選取的砝碼 id
let foundShown = null;        // 剛完成的步驟（顯示發現時刻）
let lastNote = null;
const save = () => db.save(S);

/* ---------- 元件 ---------- */
const svg = $('#scene'), gBeam = $('#beam'), gHang = $('#hang'), gGhost = $('#ghost'), gDrag = $('#drag');
const teacher = new Teacher($('#teacher-pic'), $('#bubble'), $('#live'));
const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.append(n); return n; };

const beamSpring = new Spring(a => { angle = a; placeHang(); }, { k: 90, c: 7 });
let angle = 0;

/* ---------- 木板 ---------- */
function buildBeam() {
  gBeam.replaceChildren();
  el('image', { href: PLANK, x: 100, y: 178, width: 800, height: 24, preserveAspectRatio: 'none' }, gBeam);
  for (let x = -50; x <= 50; x += 5) {
    if (x === 0) continue;
    el('circle', { cx: PX + x * U, cy: 192, r: x % 10 ? 3.5 : 5, fill: '#7A4E24', stroke: '#FFF8EC', 'stroke-width': 1.5 }, gBeam);
    if (x % 10 === 0) {
      const t = el('text', { x: PX + x * U, y: 168, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800, fill: '#5A6478', 'font-family': 'system-ui,sans-serif' }, gBeam);
      t.textContent = Math.abs(x);
    }
  }
  const lab = (x, s) => { const t = el('text', { x, y: 140, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 900, fill: '#23304A' }, gBeam); t.textContent = s; };
  lab(PX - 230, '左邊'); lab(PX + 230, '右邊');
  const hit = el('rect', { x: 90, y: 120, width: 820, height: 130, fill: 'transparent', class: 'beam-hit' }, gBeam);
  hit.addEventListener('click', e => { if (!selected || dragState) return; dropAt(snap(toSvg(e))); });
  hit.addEventListener('pointermove', e => { if (selected && !dragState) showGhost(snap(toSvg(e))); });
  hit.addEventListener('pointerleave', () => { if (!dragState) gGhost.replaceChildren(); });
}

const rot = (px, py) => {
  const r = angle * Math.PI / 180, dx = px - PX, dy = py - PY;
  return [PX + dx * Math.cos(r) - dy * Math.sin(r), PY + dx * Math.sin(r) + dy * Math.cos(r)];
};

/* ---------- 砝碼 ---------- */
function weightShape(parent, label = '5N') {
  el('image', { href: WEIGHT, x: -22, y: 0, width: 44, height: 90 }, parent);
  const t = el('text', { x: 0, y: 72, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 900, fill: '#23304A' }, parent);
  t.textContent = label;
}
const placeName = x => x === null ? '砝碼盤' : `${x < 0 ? '左邊' : '右邊'} ${Math.abs(x)} cm`;

function buildHang() {
  gHang.replaceChildren();
  for (const rack of racks(S.layout)) {
    const g = el('g', { 'data-x': rack.x }, gHang);
    // 下方的先畫，上方砝碼蓋住下方掛鉤
    [...rack.ids].reverse().forEach(id => {
      const i = rack.ids.indexOf(id);
      const w = el('g', { class: 'w-hit' + (id === selected ? ' sel' : ''), tabindex: 0, role: 'button', 'data-id': id, 'data-i': i,
        'aria-label': `砝碼 ${id.slice(1)}，${placeName(rack.x)}${id === selected ? '，已選取' : ''}` }, g);
      if (i === 0) el('line', { x1: 0, y1: -8, x2: 0, y2: 4, stroke: '#23304A', 'stroke-width': 3 }, w);
      weightShape(w);
      el('rect', { class: 'w-ring', x: -30, y: -2, width: 60, height: 96, rx: 14, fill: 'none', stroke: '#C8372D', 'stroke-width': 4, 'stroke-dasharray': '8 6' }, w);
      el('rect', { x: -30, y: -6, width: 60, height: i === rack.ids.length - 1 ? 100 : STACK, fill: 'transparent' }, w);
      bindWeight(w, id);
    });
  }
  placeHang();
}
function placeHang() {
  gBeam.setAttribute('transform', `rotate(${angle.toFixed(3)} ${PX} ${PY})`);
  for (const g of gHang.children) {
    const x = +g.dataset.x, [hx, hy] = rot(PX + x * U, 200);
    g.setAttribute('transform', `translate(${hx.toFixed(1)} ${hy.toFixed(1)})`);
    for (const w of g.children) w.setAttribute('transform', `translate(0 ${(+w.dataset.i * STACK) + 8})`);
  }
}

/* ---------- 砝碼盤（HTML） ---------- */
function buildTray() {
  const tray = $('#tray'); tray.replaceChildren();
  const free = IDS.filter(id => S.layout[id] === null);
  if (!free.length) { const p = document.createElement('span'); p.className = 'tray-empty'; p.textContent = '6 個砝碼都掛上去了'; tray.append(p); return; }
  for (const id of free) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tray-weight'; b.dataset.id = id;
    b.setAttribute('aria-pressed', String(id === selected));
    b.setAttribute('aria-label', `砝碼 ${id.slice(1)}（在盤子裡）`);
    bindWeight(b, id);
    tray.append(b);
  }
}

/* ---------- 拖曳與點選 ---------- */
let dragState = null;
function toSvg(e) {
  const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}
function snap(p) {
  if (p.y < 110 || p.y > 320 || p.x < 90 || p.x > 910) return undefined;
  let x = Math.round((p.x - PX) / U / 5) * 5;
  if (x === 0) x = p.x < PX ? -5 : 5;
  return Math.max(-50, Math.min(50, x));
}
function overTray(e) { const r = $('#tray').getBoundingClientRect(); return e.clientX >= r.left - 10 && e.clientX <= r.right + 10 && e.clientY >= r.top - 10 && e.clientY <= r.bottom + 10; }

function bindWeight(node, id) {
  node.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragState = { id, node, x0: e.clientX, y0: e.clientY, moved: false, pointer: e.pointerId };
    node.setPointerCapture?.(e.pointerId);
  });
  node.addEventListener('pointermove', e => {
    const d = dragState; if (!d || d.id !== id) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return;
    if (!d.moved) { d.moved = true; document.body.classList.add('dragging'); node.classList.add('lifted'); }
    const p = toSvg(e);
    gDrag.replaceChildren();
    const g = el('g', { transform: `translate(${p.x.toFixed(1)} ${(p.y - 30).toFixed(1)}) rotate(-4)` }, gDrag);
    weightShape(g);
    const x = snap(p);
    if (x === undefined) gGhost.replaceChildren(); else showGhost(x);
  });
  const end = e => {
    const d = dragState; if (!d || d.id !== id) return;
    dragState = null; document.body.classList.remove('dragging'); node.classList.remove('lifted');
    gDrag.replaceChildren(); gGhost.replaceChildren();
    if (e.type === 'pointercancel') return;
    if (!d.moved) {
      // 已從盤子選了砝碼，再點掛著的砝碼：掛到同一個掛點
      if (selected && selected !== id && S.layout[selected] === null && S.layout[id] !== null) { dropAt(S.layout[id]); return; }
      select(selected === id ? null : id); return;
    }
    selected = id;
    if (overTray(e)) dropAt(null);
    else { const x = snap(toSvg(e)); if (x !== undefined) dropAt(x); else render(); }
  };
  node.addEventListener('pointerup', end);
  node.addEventListener('pointercancel', end);
  node.addEventListener('keydown', e => {
    const x = S.layout[id];
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(selected === id ? null : id); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); selected = id; nudge(e.key === 'ArrowLeft' ? -1 : 1); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); selected = id; dropAt(null); }
    else if (e.key === 'Escape') { select(null); }
    void x;
  });
}

function showGhost(x) {
  gGhost.replaceChildren();
  const [hx, hy] = rot(PX + x * U, 200);
  el('circle', { cx: hx, cy: hy - 8, r: 13, fill: 'rgba(200,55,45,.25)', stroke: '#C8372D', 'stroke-width': 3 }, gGhost);
  const bg = el('rect', { x: hx - 58, y: hy - 66, width: 116, height: 34, rx: 17, fill: '#23304A' }, gGhost);
  const t = el('text', { x: hx, y: hy - 43, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800, fill: '#FFF8EC' }, gGhost);
  t.textContent = placeName(x); void bg;
}

function select(id) { selected = id; render(); refocus(); }
function refocus() {
  if (!selected) return;
  requestAnimationFrame(() => {
    const n = gHang.querySelector(`[data-id="${selected}"]`) || $(`#tray [data-id="${selected}"]`);
    n?.focus({ preventScroll: true });
  });
}

function nudge(dir) {
  if (!selected) return;
  const cur = S.layout[selected];
  let x = cur === null ? dir * 10 : cur + dir * 5;
  if (x === 0) x = dir * 5;
  if (x < -50 || x > 50) { oops('已經到木板最邊邊了。'); return; }
  dropAt(x);
}

function dropAt(x) {
  if (!selected || x === undefined) return;
  const next = clone(S.layout); next[selected] = x;
  try { validateLayout(next); } catch { oops('同一個掛點最多掛 4 個砝碼。'); render(); return; }
  if (signature(next) === signature(S.layout)) { render(); refocus(); return; }
  const before = calculate(S.layout).net;
  S.layout = next; foundShown = null; lastNote = null; S._exploreFresh = false;
  save(); render(); refocus();
  const after = calculate(S.layout).net;
  if (Math.sign(before) !== Math.sign(after)) beamSpring.kick(after === 0 ? (before > 0 ? 30 : -30) : 0);
}

/* ---------- 讀數 ---------- */
function formula(side) {
  const rs = racks(S.layout).filter(r => side < 0 ? r.x < 0 : r.x > 0);
  if (!rs.length) return '沒有砝碼';
  return rs.map(r => `${r.force} N × ${Math.abs(r.x)} cm`).join(' + ');
}
let prev = { l: null, r: null };
function renderReadouts(t) {
  const L = $('#left-num'), R = $('#right-num');
  if (prev.l !== null && prev.l !== t.left) { L.classList.remove('tick'); void L.offsetWidth; L.classList.add('tick'); }
  if (prev.r !== null && prev.r !== t.right) { R.classList.remove('tick'); void R.offsetWidth; R.classList.add('tick'); }
  prev = { l: t.left, r: t.right };
  L.textContent = t.left; R.textContent = t.right;
  $('#left-formula').textContent = formula(-1);
  $('#right-formula').textContent = formula(1);
  const sign = $('#sign');
  sign.textContent = t.net > 0 ? '>' : t.net < 0 ? '<' : '=';
  sign.classList.toggle('eq', t.net === 0);
}

/* ---------- 余老師 ---------- */
function oops(text) { teacher.last = ''; teacher.say(text, { pose: 'think', tone: 'oops' }); lastNote = text; }
function talk(t) {
  if (lastNote) return;
  const step = S.step, task = TASK[step];
  if (foundShown) {
    if (foundShown === 'challenge') {
      teacher.say(task.found[0], { pose: 'cheer', tone: 'found', tag: '發現時刻', eq: task.found[1], action: { label: '看成果 →', run: openFinish } });
    } else {
      const f = TASK[foundShown].found;
      teacher.say(f[0], { pose: 'cheer', tone: 'found', tag: '發現時刻', eq: f[1], action: { label: '下一步 →', run: () => goStep(NEXT[foundShown]) } });
    }
    return;
  }
  const atStart = START[step] && signature(S.layout) === signature(START[step]());
  const goal = qualifies(S.layout) === step;
  if (step === 'explore') {
    const go = { label: '開始挑戰 →', run: () => goStep('challenge') };
    if (S._exploreFresh) { teacher.say(task.intro, { pose: 'wave', action: go }); return; }
    const txt = t.net === 0 ? '平衡了！兩邊力矩一樣大。' : t.net > 0 ? '往左倒：左邊的力矩比較大。' : '往右倒：右邊的力矩比較大。';
    teacher.say(txt, { pose: t.net === 0 ? 'cheer' : 'think', action: go }); return;
  } else if (goal && !S.done.includes(step) && !(step === 'A' && atStart)) {
    teacher.say(task.reach, { pose: t.net === 0 ? 'cheer' : 'wow' }); return;
  } else if (atStart) {
    teacher.say(task.intro, { pose: 'point' }); return;
  }
  if (t.net === 0) teacher.say('平衡了！兩邊力矩一樣大。', { pose: 'cheer' });
  else if (t.net > 0) teacher.say('往左倒：左邊的力矩比較大。', { pose: 'think' });
  else teacher.say('往右倒：右邊的力矩比較大。', { pose: 'think' });
}

/* ---------- 證據 ---------- */
const resText = r => r.net === 0 ? '平衡' : r.net > 0 ? '往左倒' : '往右倒';
const stepName = id => (STEPS.find(s => s.id === id) || {}).label || '';
function renderEvidence() {
  const n = S.records.length;
  $('#ev-count').textContent = n; $('#note-count').textContent = n;
  $('#ev-empty').hidden = n > 0;
  const chips = $('#chips');
  const want = S.records.slice(-4).reverse();
  const key = want.map(r => r.n).join(',');
  if (chips.dataset.key === key) return;
  chips.dataset.key = key;
  chips.replaceChildren(...want.map(r => {
    const li = document.createElement('li'); li.className = 'chip';
    li.innerHTML = `<small>#${r.n} ${stepName(r.step)}</small><b>${r.left} ｜ ${r.right}</b><span class="res${r.net === 0 ? ' ok' : ''}">${resText(r)}</span>`;
    return li;
  }));
}
function keep() {
  const t = calculate(S.layout);
  const last = S.records.at(-1);
  if (last && signature(last.layout) === signature(S.layout)) { oops('這個結果已經收過了，換個掛法再試。'); return; }
  if (S.records.length >= 50) { oops('手冊滿 50 張了，清除紀錄才能再收。'); return; }
  const rec = { n: S.records.length + 1, step: S.step, layout: clone(S.layout), left: t.left, right: t.right, net: t.net, qual: qualifies(S.layout), at: new Date().toISOString() };
  S.records.push(rec);
  lastNote = null;
  if (rec.qual === S.step && !S.done.includes(S.step)) { S.done.push(S.step); foundShown = S.step; }
  save();
  const target = isVisible($('#evidence')) ? $('#evidence') : $('#note-count');
  fly($('#save'), target, `${t.left} ｜ ${t.right}`).then(() => { renderEvidence(); bump($('#note-count')); });
  render(false);
}
function isVisible(n) { const r = n.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }

/* ---------- 步驟 ---------- */
function goStep(id) {
  if (S.step === 'explore' && !S.done.includes('explore')) S.done.push('explore');
  S.step = id; foundShown = null; lastNote = null; selected = null;
  if (START[id]) S.layout = START[id]();
  S._exploreFresh = id === 'explore';
  save(); teacher.last = ''; render();
}

/* ---------- 對話框 ---------- */
function openNotes() {
  const body = $('#notes-body'); body.replaceChildren();
  if (!S.records.length) { const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="5" class="notes-empty">還沒有證據。</td>'; body.append(tr); }
  for (const r of S.records) {
    const tr = document.createElement('tr');
    const side = s => racks(r.layout).filter(k => s < 0 ? k.x < 0 : k.x > 0).map(k => `${k.force}N×${Math.abs(k.x)}`).join('+') || '—';
    tr.innerHTML = `<td>${r.n}</td><td>${stepName(r.step)}</td><td>${side(-1)}<br><b>${r.left}</b></td><td>${side(1)}<br><b>${r.right}</b></td><td class="${r.net === 0 ? 'ok' : 'tip'}">${resText(r)}</td>`;
    body.append(tr);
  }
  $('#notes-dialog').showModal();
}
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#F4C04E" stroke="#23304A" stroke-width="1.2" stroke-linejoin="round"/></svg>';
function openFinish() {
  const goals = ['A', 'B', 'C', 'challenge'];
  const got = goals.filter(g => S.done.includes(g)).length;
  $('#stars').innerHTML = goals.map(g => S.done.includes(g) ? STAR : STAR.replace('<svg', '<svg class="off"')).join('');
  $('#stars').setAttribute('aria-label', `完成 4 個任務中的 ${got} 個`);
  const pick = q => S.records.find(r => r.qual === q);
  const lines = [['A', '原本'], ['B', '移近一點'], ['C', '再加一個'], ['challenge', '挑戰']].map(([q, name]) => {
    const r = pick(q); if (!r) return null;
    return `<li><b>${name}</b>：左 ${r.left}，右 ${r.right} → ${resText(r)}</li>`;
  }).filter(Boolean);
  $('#finish-list').innerHTML = lines.join('');
  $('#finish-dialog').showModal();
}

/* ---------- 版面 ---------- */
const narrow = matchMedia('(max-width: 860px)');
function fitScene() {
  svg.setAttribute('viewBox', narrow.matches ? '70 110 860 410' : '0 96 1000 450');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
}
narrow.addEventListener?.('change', fitScene);

function render(withTalk = true) {
  const t = calculate(S.layout);
  renderSteps($('#steps'), STEPS, S.step, new Set(S.done));
  buildHang(); buildTray(); renderReadouts(t); renderEvidence();
  const sel = selected ? S.layout[selected] : undefined;
  $('#pick-label').textContent = selected ? `砝碼 ${selected.slice(1)}：${placeName(sel)}` : '點一個砝碼來移動';
  $('#move-left').textContent = sel === null ? '放到左邊' : '◀ 5 cm';
  $('#move-right').textContent = sel === null ? '放到右邊' : '5 cm ▶';
  $('#move-left').disabled = $('#move-right').disabled = !selected;
  $('#to-tray').disabled = !selected || sel === null;
  beamSpring.set(t.net > 0 ? -TIP : t.net < 0 ? TIP : 0);
  void withTalk; talk(t);
}

/* ---------- 啟動 ---------- */
$('#move-left').addEventListener('click', () => nudge(-1));
$('#move-right').addEventListener('click', () => nudge(1));
$('#to-tray').addEventListener('click', () => dropAt(null));
$('#save').addEventListener('click', keep);
$('#why').addEventListener('click', () => $('#why-dialog').showModal());
$('#open-notes').addEventListener('click', openNotes);
$('#reset-all').addEventListener('click', () => {
  if (!confirm('確定要清除這一站的全部紀錄，從頭開始嗎？')) return;
  db.clear(); S = fresh(); selected = null; foundShown = null; lastNote = null; teacher.last = '';
  $('#notes-dialog').close(); render();
});
document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && selected && !document.querySelector('dialog[open]')) select(null); });
svg.addEventListener('pointerdown', e => { if (e.target === svg || e.target.tagName === 'image' && !e.target.closest('.w-hit')) { if (selected) select(null); } });

fitScene(); buildBeam();
beamSpring.set((() => { const n = calculate(S.layout).net; return n > 0 ? -TIP : n < 0 ? TIP : 0; })(), true);
render();
void reduceMotion;
