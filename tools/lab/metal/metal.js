// 金屬活性實驗桌（新版試用）
// 反應結果直接用 tools/metal-activity-desk/inquiry.mjs 的 outcome() 與 acid.mjs 的 acidOutcome()；不另寫模型。
import { outcome, SOLUTIONS } from '../../metal-activity-desk/inquiry.mjs';
import { acidOutcome } from '../../metal-activity-desk/acid.mjs';
import { $, store, Teacher, renderSteps, fly, bump, reduceMotion } from '../shared/lab.js';

const NS = 'http://www.w3.org/2000/svg';
const P = '../../../assets/science/props/';
const db = store('bhcs.lab.metal.v1');
const MNAME = { Zn: '鋅', Fe: '鐵', Cu: '銅' };
const STRIP = { Zn: 'prop-strip-zinc.webp', Fe: 'prop-strip-iron.webp', Cu: 'prop-strip-copper.webp' };
const SOL = { ...SOLUTIONS, HCl: { name: '稀鹽酸', formula: 'HCl', color: '#EEF5F6', colorName: '無色' } };
const DEPOSIT = { Cu: '#A2452A', Fe: '#3A3F44' };
const AFTER = { ZnCuSO4: '#DDEFF2', FeCuSO4: '#CFE6D2', ZnFeSO4: '#EDF4EE' };   // 反應後溶液顏色（藍色變淡／淡綠變淡）

function result(metal, sol) {
  if (sol === 'HCl') {
    const a = acidOutcome(metal);
    return { reacts: a.reacts, gas: a.reacts, short: a.reacts ? '冒氣泡' : '無氣泡', observation: a.observation, note: a.reacts ? '產生氫氣 H₂' : '本課條件下不產生氫氣', equation: a.equation };
  }
  const o = outcome(metal, sol);
  return { reacts: o.reacts, deposit: o.deposit, pair: o.pair, short: o.reacts ? (o.deposit === 'Cu' ? '析出銅' : '析出鐵') : '無變化', observation: o.reacts ? o.observation : `${o.surface}；${o.liquid}`, note: o.reacts ? o.relation : '無淨置換', equation: o.equation };
}

const STEPS = [
  { id: 'cuso4', label: '放進硫酸銅' },
  { id: 'zinciron', label: '鋅和鐵比一比' },
  { id: 'order', label: '排一排' },
  { id: 'acid', label: '放進稀鹽酸' },
  { id: 'quiz', label: '說說看' }
];
const NEXT = { cuso4: 'zinciron', zinciron: 'order', order: 'acid', acid: 'quiz' };
const SETUP = {
  cuso4: [['Zn', 'CuSO4'], ['Fe', 'CuSO4'], ['Cu', 'CuSO4']],
  zinciron: [['Zn', 'FeSO4'], ['Fe', 'ZnSO4']],
  acid: [['Zn', 'HCl'], ['Fe', 'HCl'], ['Cu', 'HCl']]
};
const TASK = {
  cuso4: { title: '三種金屬片放進硫酸銅溶液', goal: '三杯都是藍色的硫酸銅溶液。按架上的金屬片（或下面的按鈕）把它放進溶液，看金屬表面和溶液顏色。三杯都做完後收下觀察。',
    intro: '鋅片、鐵片、銅片，放進藍色的硫酸銅。哪一片會有變化？',
    found: ['鋅片、鐵片表面析出紅棕色的銅，溶液的藍色變淡；銅片沒有變化。', '鋅 > 銅、鐵 > 銅　Zn + Cu²⁺ → Zn²⁺ + Cu'] },
  zinciron: { title: '鋅和鐵，誰比較活潑？', goal: '硫酸銅只能比出「鋅 > 銅、鐵 > 銅」。把鋅片放進硫酸亞鐵、鐵片放進硫酸鋅，直接比較鋅和鐵，兩杯都做完後收下。',
    intro: '鋅和鐵都比銅活潑，但它們兩個誰比較活潑？要直接比一比！',
    found: ['鋅能把鐵置換出來，鐵不能置換鋅：鋅比鐵活潑。', 'Zn + Fe²⁺ → Zn²⁺ + Fe；鐵片放進硫酸鋅沒有變化'] },
  order: { title: '用證據排出活性大小', goal: '從活性最大的金屬開始，依序按鋅、鐵、銅，再按「核對」。左邊的比較板是你目前收下的證據。',
    intro: '把你的證據串起來：誰最活潑？',
    found: ['活性大小：鋅 > 鐵 > 銅', '活性大的金屬，能把活性小的金屬從它的鹽類溶液中置換出來'] },
  acid: { title: '三種金屬片放進稀鹽酸', goal: '三杯都是稀鹽酸。把鋅片、鐵片、銅片放進去，看有沒有冒氣泡，三杯都做完後收下。',
    intro: '這次換成稀鹽酸。哪些金屬會冒出氣泡？',
    found: ['鋅、鐵在稀鹽酸中產生氫氣，銅不會。', 'Fe + 2H⁺ → Fe²⁺ + H₂；冒泡多少不拿來排鋅和鐵的先後'] },
  quiz: { title: '說說看：用證據回答', goal: '三題都答對就完成。答錯沒關係，余老師會說明原因。',
    intro: '最後三題！想想你收下的證據。',
    found: ['你排出金屬的活性了！', '鋅 > 鐵 >（氫）> 銅'] }
};
const QUIZ = [
  { q: '鐵片放進藍色的硫酸銅溶液，表面出現紅棕色的物質。這是什麼？', options: [
    { text: '鐵生鏽了。', why: '紅棕色是析出的銅：鐵把溶液中的銅離子置換成銅，所以溶液的藍色也變淡。' },
    { text: '析出的銅，因為鐵的活性比銅大。', ok: true },
    { text: '硫酸銅的結晶。', why: '硫酸銅溶在水中是藍色；表面的紅棕色固體是金屬銅。' }] },
  { q: '只知道「鋅、鐵放進硫酸銅都會析出銅」，能判斷鋅和鐵誰比較活潑嗎？', options: [
    { text: '能，鋅比較活潑。', why: '這兩杯只說明鋅 > 銅、鐵 > 銅，沒有直接比較鋅和鐵。' },
    { text: '能，鐵比較活潑。', why: '這兩杯只說明鋅 > 銅、鐵 > 銅，沒有直接比較鋅和鐵。' },
    { text: '不能，要再把鋅片放進硫酸亞鐵這類直接比較的實驗。', ok: true }] },
  { q: '銅片放進稀鹽酸，沒有氣泡。比較合適的說法是？', options: [
    { text: '本課條件下銅不會置換出氫氣；課本的活性表也把銅排在氫後面。', ok: true },
    { text: '銅比鋅活潑，所以不用反應。', why: '鋅能把銅置換出來（鋅片放進硫酸銅析出銅），所以鋅比銅活潑。' },
    { text: '只要沒有氣泡，就證明銅的活性是最小的。', why: '單靠一杯沒變化，不能排出先後；銅比鋅、鐵小，是硫酸銅那兩杯的證據。' }] }
];

/* ---------- 狀態 ---------- */
const cupsFor = step => (SETUP[step] || []).map(([metal, sol]) => ({ metal, sol, p: 0 }));
const fresh = () => ({ v: 1, step: 'cuso4', cups: cupsFor('cuso4'), saved: false, records: [], done: [], order: [], quiz: { i: 0, pick: null } });
function loadState() {
  const s = db.load();
  try {
    if (!s || s.v !== 1 || !STEPS.some(x => x.id === s.step) || !Array.isArray(s.cups) || !Array.isArray(s.records) || !Array.isArray(s.done) || !Array.isArray(s.order) || !s.quiz) throw 0;
    const want = cupsFor(s.step);
    if (s.cups.length !== want.length || s.cups.some((c, i) => c.metal !== want[i].metal || c.sol !== want[i].sol || ![0, 1].includes(c.p))) throw 0;
    if (s.records.some(r => !MNAME[r.metal] || !SOL[r.sol])) throw 0;
    return s;
  } catch { return fresh(); }
}
let S = loadState(), foundShown = null, lastNote = null, animating = 0;
const save = () => db.save({ ...S, cups: S.cups.map(c => ({ ...c, p: c.p >= 1 ? 1 : 0 })) });   // 動畫中的杯子存成「未放入」
const isLab = () => !!SETUP[S.step];
const has = (metal, sol) => S.records.some(r => r.metal === metal && r.sol === sol);
const pairs = () => ({ ZnCu: has('Zn', 'CuSO4'), FeCu: has('Fe', 'CuSO4'), ZnFe: has('Zn', 'FeSO4'), HCu: has('Cu', 'HCl') && has('Zn', 'HCl') && has('Fe', 'HCl') });

const svg = $('#scene'), rig = $('#rig');
const teacher = new Teacher($('#teacher-pic'), $('#bubble'), $('#live'));
const el = (tag, a = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (parent) parent.append(n); return n; };
const txt = (parent, x, y, s, a = {}) => { const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#23304A', ...a }, parent); t.textContent = s; return t; };
const mixHex = (a, b, k) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };

/* ---------- 場景 ---------- */
const BK = { w: 150, h: 176, top: 300 };
const LIQ = 338, BOT = 456, ROD = 150;
const SW = 34, SH = 150;
const cupX = n => n === 3 ? [530, 690, 850] : [610, 790];
function draw() {
  const hadFocus = !!document.activeElement && rig.contains(document.activeElement);
  rig.replaceChildren();
  if (!isLab()) { drawSummary(); return; }
  const xs = cupX(S.cups.length);
  el('rect', { x: xs[0] - 100, y: ROD - 8, width: xs[xs.length - 1] - xs[0] + 200, height: 14, rx: 6, fill: '#8896A5', stroke: '#23304A', 'stroke-width': 3 }, rig);
  S.cups.forEach((c, i) => drawCup(c, i, xs[i]));
  if (hadFocus) { const f = rig.querySelector('.tool.cue') || rig.querySelector('.tool'); if (f) f.focus({ preventScroll: true }); }
}
function drawCup(c, i, x) {
  const r = result(c.metal, c.sol), k = c.p, bx = x - BK.w / 2;
  const base = SOL[c.sol].color, after = AFTER[c.metal + c.sol];
  const col = r.reacts && after ? mixHex(base, after, k) : base;
  // 溶液
  el('rect', { x: bx + 14, y: LIQ, width: BK.w - 28, height: BOT - LIQ, rx: 6, fill: col, opacity: 0.9 }, rig);
  el('line', { x1: bx + 14, y1: LIQ, x2: bx + BK.w - 14, y2: LIQ, stroke: 'rgba(255,255,255,.9)', 'stroke-width': 3 }, rig);
  // 金屬片（放下時往下移）
  const up = ROD + 6, down = BOT - 18 - SH, sy = up + (down - up) * Math.min(1, k * 3), sx = x - SW / 2;
  const sg = el('g', { class: 'tool', tabindex: 0, role: 'button', 'aria-label': c.p ? `${MNAME[c.metal]}片已放進${SOL[c.sol].name}` : `把${MNAME[c.metal]}片放進${SOL[c.sol].name}` }, rig);
  el('line', { x1: x, y1: ROD + 6, x2: x, y2: sy + 2, stroke: '#5A6478', 'stroke-width': 3 }, sg);
  el('image', { href: P + STRIP[c.metal], x: sx, y: sy, width: SW, height: SH, preserveAspectRatio: 'none' }, sg);
  if (r.deposit && k > 0) {
    const y0 = Math.max(sy, LIQ + 2);
    el('rect', { x: sx + 2, y: y0, width: SW - 4, height: sy + SH - 4 - y0, rx: 3, fill: DEPOSIT[r.deposit], opacity: 0.85 * k }, sg);
    for (let q = 0; q < 22; q++) el('circle', { cx: sx + 5 + (q * 7) % (SW - 10), cy: y0 + 6 + ((q * 37) % Math.max(8, sy + SH - 14 - y0)), r: 2.4, fill: mixHex(DEPOSIT[r.deposit], '#000000', 0.25), opacity: k }, sg);
  }
  if (!c.p && !animating) {
    sg.classList.add('cue');
    el('rect', { class: 'tool-ring', x: sx - 10, y: sy - 10, width: SW + 20, height: SH + 20, rx: 12, fill: 'none', stroke: '#E0A21B', 'stroke-width': 4 }, sg);
  }
  el('rect', { x: sx - 30, y: sy - 4, width: SW + 60, height: SH + 10, fill: 'transparent' }, sg);
  sg.addEventListener('click', () => dip(i));
  sg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dip(i); } });
  // 氣泡
  if (r.gas && k > 0) for (let q = 0; q < 8; q++) {
    const b = el('circle', { class: 'bub', cx: sx - 6 + (q % 4) * 15, cy: BOT - 30 - (q % 3) * 22, r: 3 + (q % 3), fill: 'rgba(255,255,255,.9)', stroke: 'rgba(80,120,150,.8)', 'stroke-width': 1.2, style: `animation-delay:${(q * 0.17).toFixed(2)}s` }, rig);
    b.style.opacity = String(Math.min(1, k * 1.5));
  }
  el('image', { href: P + 'prop-beaker.webp', x: bx, y: BK.top, width: BK.w, height: BK.h, preserveAspectRatio: 'none' }, rig);
  // 名牌
  el('rect', { x: x - 30, y: ROD + 16, width: 60, height: 28, rx: 14, fill: '#23304A' }, rig);
  txt(rig, x, ROD + 36, `${MNAME[c.metal]}片`, { fill: '#FFFFFF', 'font-size': 15, 'font-weight': 900 });
  txt(rig, x, BK.top + BK.h + 22, SOL[c.sol].name, { 'font-size': 15, 'font-weight': 900 });
  txt(rig, x, BK.top + BK.h + 40, SOL[c.sol].formula, { 'font-size': 13, 'font-weight': 700, fill: '#5A6478' });
  if (c.p >= 1 && k >= 1) {
    el('rect', { x: x - 52, y: BK.top + BK.h + 50, width: 104, height: 30, rx: 15, fill: r.reacts ? '#2E7D63' : '#8896A5' }, rig);
    txt(rig, x, BK.top + BK.h + 71, r.short, { fill: '#FFFFFF', 'font-size': 15, 'font-weight': 900 });
  }
}
function drawSummary() {
  const xs = [530, 690, 850], order = ['Zn', 'Fe', 'Cu'];
  txt(rig, 690, 190, S.step === 'order' ? '三種金屬片' : '你的金屬片', { 'font-size': 18, 'font-weight': 900 });
  order.forEach((m, i) => {
    el('image', { href: P + STRIP[m], x: xs[i] - 22, y: 220, width: 44, height: 190, preserveAspectRatio: 'none' }, rig);
    txt(rig, xs[i], 440, `${MNAME[m]} ${m}`, { 'font-size': 18, 'font-weight': 900 });
  });
}

/* ---------- 操作 ---------- */
function dip(i) {
  if (!isLab()) { oops('這一步不用放金屬片，看任務卡要做的事。'); return; }
  const c = S.cups[i];
  if (c.p) { oops(`${MNAME[c.metal]}片已經放進去了。想重做，按「重來這一步」。`); return; }
  lastNote = null; foundShown = null;
  if (reduceMotion()) { c.p = 1; save(); render(); return; }
  animating++; const t0 = performance.now();
  const f = now => {
    const k = Math.min(1, (now - t0) / 2400);
    c.p = k; draw(); renderReadouts();
    if (k < 1) requestAnimationFrame(f); else { c.p = 1; animating--; save(); render(); }
  };
  requestAnimationFrame(f); render();
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
  const cells = isLab() ? S.cups : [];
  for (let i = 1; i <= 3; i++) {
    const c = cells[i - 1], box = $('#r-' + i).closest('.reading');
    box.hidden = !c && isLab();
    if (!isLab()) { const p = pairs(), map = { 1: ['鋅 vs 銅', p.ZnCu], 2: ['鐵 vs 銅', p.FeCu], 3: ['鋅 vs 鐵', p.ZnFe] }; const [l, ok] = map[i]; setReading(i, l, ok ? '有證據' : '還沒有', '', ok ? (i === 3 ? '鋅＋硫酸亞鐵析出鐵' : `${i === 1 ? '鋅' : '鐵'}＋硫酸銅析出銅`) : '先做實驗收下'); box.hidden = false; continue; }
    if (!c) continue;
    const r = result(c.metal, c.sol);
    setReading(i, `${MNAME[c.metal]}＋${SOL[c.sol].name}`, c.p >= 1 ? r.short : c.p > 0 ? '反應中…' : '—', '', c.p >= 1 ? r.note : '還沒放入');
  }
}

/* ---------- 比較板 ---------- */
function renderBoard() {
  const p = pairs();
  const rows = [['ZnCu', '鋅 > 銅', '鋅＋硫酸銅：析出銅'], ['FeCu', '鐵 > 銅', '鐵＋硫酸銅：析出銅'], ['ZnFe', '鋅 > 鐵', '鋅＋硫酸亞鐵：析出鐵'], ['HCu', '鋅、鐵 > 氫 > 銅', '稀鹽酸：鋅、鐵冒氫氣；銅不會（參考課本）']];
  $('#rank-list').innerHTML = rows.map(([k, rel, why]) => `<li class="${p[k] ? 'got' : ''}"><span>${p[k] ? '✓ ' : ''}${rel}</span><small>${p[k] ? why : '還缺證據'}</small></li>`).join('');
  $('#rank-chain').textContent = S.done.includes('order') ? (p.HCu ? '鋅 > 鐵 > 氫 > 銅' : '鋅 > 鐵 > 銅') : '';
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
  if (isLab()) {
    if (S.saved) { teacher.say('這一步完成了，按任務卡的「下一步」繼續。', { pose: 'thumb' }); return; }
    if (animating) { teacher.say('仔細看金屬表面和溶液……', { pose: 'wow' }); return; }
    const left = S.cups.filter(c => !c.p);
    if (left.length === S.cups.length) { teacher.say(task.intro, { pose: 'point' }); return; }
    const last = S.cups.filter(c => c.p).map(c => `${MNAME[c.metal]}片：${result(c.metal, c.sol).short}`).join('、');
    teacher.say(left.length ? `${last}。再放${left.map(c => MNAME[c.metal] + '片').join('、')}。` : `${last}。收下這次觀察。`, { pose: left.length ? 'point' : 'wow' }); return;
  }
  if (step === 'order') {
    const p = pairs();
    if (!p.ZnCu || !p.FeCu || !p.ZnFe) { teacher.say('證據還不夠：先完成「放進硫酸銅」和「鋅和鐵比一比」。', { pose: 'think' }); return; }
    teacher.say(done ? '排對了！按任務卡的「下一步」繼續。' : task.intro, { pose: done ? 'thumb' : 'notebook' }); return;
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
  $('#dock-pull').hidden = !isLab(); $('#dock-order').hidden = S.step !== 'order'; $('#dock-quiz').hidden = S.step !== 'quiz';
  if (isLab()) {
    const box = $('#metal-btns');
    box.classList.toggle('two', S.cups.length === 2);
    box.replaceChildren(...S.cups.map((c, k) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn-soft'; b.textContent = `放入${MNAME[c.metal]}片`; b.disabled = !!c.p || !!animating; b.addEventListener('click', () => dip(k)); return b; }));
  }
  $('#save').classList.toggle('cue', isLab() && !S.saved && !animating && S.cups.every(c => c.p >= 1));
  if (S.step === 'order') renderOrder();
  if (S.step === 'quiz') renderQuiz();
}

/* ---------- 排一排 ---------- */
function renderOrder() {
  const p = pairs(), ok = p.ZnCu && p.FeCu && p.ZnFe;
  $('#order-btns').replaceChildren(...['Cu', 'Zn', 'Fe'].map(m => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn-soft'; b.textContent = `${MNAME[m]} ${m}`; b.disabled = !ok || S.order.includes(m) || S.done.includes('order'); b.addEventListener('click', () => { S.order.push(m); lastNote = null; save(); render(); }); return b; }));
  const pick = $('#order-pick'); pick.replaceChildren();
  S.order.forEach((m, k) => { if (k) { const g = document.createElement('li'); g.className = 'gt'; g.textContent = '>'; pick.append(g); } const li = document.createElement('li'); li.textContent = MNAME[m]; pick.append(li); });
  if (!S.order.length) { const li = document.createElement('li'); li.className = 'gt'; li.textContent = ok ? '最活潑 → 最不活潑' : '先收齊證據'; li.style.fontSize = '14px'; li.style.color = '#5A6478'; pick.append(li); }
  $('#check').disabled = !ok || S.order.length < 3 || S.done.includes('order');
  $('#order-clear').disabled = !S.order.length || S.done.includes('order');
}
function checkOrder() {
  const want = ['Zn', 'Fe', 'Cu'];
  if (S.order.join() === want.join()) { if (!S.done.includes('order')) S.done.push('order'); foundShown = 'order'; lastNote = null; save(); render(); return; }
  const [a, b, c] = S.order;
  let msg = '再看看比較板上的證據。';
  if (a === 'Cu' || b === 'Cu' && c !== 'Cu') msg = '銅片放進硫酸銅沒有變化，鋅、鐵卻能把銅置換出來：銅應該排在最後。';
  else if (a === 'Fe') msg = '鋅片放進硫酸亞鐵會析出鐵，鐵片放進硫酸鋅卻沒有變化：鋅比鐵活潑。';
  S.order = []; save(); render(); oops(msg);
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
function chipHtml(r) { const o = result(r.metal, r.sol); return `<small>#${r.n} ${MNAME[r.metal]}片＋${SOL[r.sol].name}</small><b>${o.short}</b><span class="res${o.reacts ? ' ok' : ''}">${o.note}</span>`; }
function renderEvidence() {
  const n = S.records.length;
  $('#ev-count').textContent = n; $('#note-count').textContent = n; $('#ev-empty').hidden = n > 0;
  const chips = $('#chips'), want = S.records.slice(-4).reverse(), key = want.map(r => r.n).join(',');
  if (chips.dataset.key === key) return; chips.dataset.key = key;
  chips.replaceChildren(...want.map(r => { const li = document.createElement('li'); li.className = 'chip'; li.innerHTML = chipHtml(r); return li; }));
}
function keep() {
  if (!isLab()) return;
  if (S.saved) { oops('這一步已經收下了。想重做，按「重來這一步」。'); return; }
  if (animating) return;
  const left = S.cups.filter(c => !c.p);
  if (left.length) { oops(`還有${left.map(c => MNAME[c.metal] + '片').join('、')}沒放進去。`); return; }
  if (S.records.length >= 50) { oops('手冊滿 50 張了，清空紀錄才能再收。'); return; }
  for (const c of S.cups) S.records.push({ n: S.records.length + 1, at: new Date().toISOString(), metal: c.metal, sol: c.sol, reacts: result(c.metal, c.sol).reacts });
  S.saved = true; lastNote = null;
  if (!S.done.includes(S.step)) { S.done.push(S.step); foundShown = S.step; }
  save();
  const target = isVisible($('#evidence')) ? $('#evidence') : $('#note-count');
  fly($('#save'), target, S.cups.map(c => `${MNAME[c.metal]}：${result(c.metal, c.sol).short}`).join('｜')).then(() => { renderEvidence(); bump($('#note-count')); });
  render();
}
const isVisible = n => { const r = n.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };

/* ---------- 步驟 ---------- */
function goStep(id) {
  if (animating) return;
  S.step = id; foundShown = null; lastNote = null;
  S.cups = cupsFor(id); S.saved = false;
  if (id === 'order' && !S.done.includes('order')) S.order = [];
  if (id === 'quiz' && !S.done.includes('quiz')) S.quiz = { i: 0, pick: null };
  save(); teacher.last = ''; render();
  if (narrow.matches) scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
}
function resetStep() {
  if (S.step === 'order') { S.order = []; S.done = S.done.filter(d => d !== 'order'); }
  if (S.step === 'quiz') S.quiz = { i: 0, pick: null };
  goStep(S.step);
}

/* ---------- 對話框 ---------- */
function openNotes() {
  const body = $('#notes-body'); body.replaceChildren();
  if (!S.records.length) { const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="5" class="notes-empty">還沒有證據。</td>'; body.append(tr); }
  for (const r of S.records) {
    const o = result(r.metal, r.sol), tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.n}</td>` + [`${MNAME[r.metal]} ${r.metal}`, `${SOL[r.sol].name} ${SOL[r.sol].formula}`, o.observation, o.reacts ? o.equation : o.note].map(c => `<td>${c}</td>`).join('');
    body.append(tr);
  }
  $('#notes-dialog').showModal();
}
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#F4C04E" stroke="#23304A" stroke-width="1.2" stroke-linejoin="round"/></svg>';
function openFinish() {
  const got = STEPS.filter(s => S.done.includes(s.id)).length;
  $('#stars').innerHTML = STEPS.map(s => S.done.includes(s.id) ? STAR : STAR.replace('<svg', '<svg class="off"')).join('');
  $('#stars').setAttribute('aria-label', `完成 ${STEPS.length} 個任務中的 ${got} 個`);
  const p = pairs();
  $('#finish-list').innerHTML = [
    p.ZnCu && '<li><b>鋅 > 銅</b>：鋅片放進硫酸銅，析出紅棕色的銅</li>',
    p.FeCu && '<li><b>鐵 > 銅</b>：鐵片放進硫酸銅，析出紅棕色的銅</li>',
    p.ZnFe && '<li><b>鋅 > 鐵</b>：鋅片放進硫酸亞鐵析出鐵；鐵片放進硫酸鋅沒有變化</li>',
    p.HCu && '<li><b>和稀鹽酸</b>：鋅、鐵產生氫氣，銅沒有</li>'
  ].filter(Boolean).join('');
  $('#finish-dialog').showModal();
}
function clearAll() {
  if (animating) return;
  if (!confirm('要清空這一站的所有證據和進度，從第 1 步重新開始嗎？')) return;
  db.clear(); S = fresh(); foundShown = null; lastNote = null; teacher.last = '';
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  render(); if (narrow.matches) scrollTo({ top: 0 });
}

/* ---------- 版面 ---------- */
const narrow = matchMedia('(max-width: 860px)');
function fitScene() { svg.setAttribute('viewBox', narrow.matches ? '420 120 520 470' : '150 110 790 500'); }
narrow.addEventListener?.('change', () => render());
function render() {
  renderSteps($('#steps'), STEPS, S.step, new Set(S.done), id => goStep(id));
  fitScene(); draw(); renderReadouts(); renderBoard(); renderEvidence(); renderTask(); talk();
}

$('#save').addEventListener('click', keep);
$('#check').addEventListener('click', checkOrder);
$('#order-clear').addEventListener('click', () => { S.order = []; lastNote = null; save(); render(); });
$('#task-reset').addEventListener('click', resetStep);
$('#clear-records').addEventListener('click', clearAll);
$('#reset-all').addEventListener('click', clearAll);
$('#why').addEventListener('click', () => $('#why-dialog').showModal());
$('#open-notes').addEventListener('click', openNotes);
document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

render();
