import { MODEL_VERSION, CONSTANTS, calculate, quantity, remainingMass, instantRate } from '../../science/reaction-rate-desk/model.mjs';

const SAMPLE = {
  lump: { name: '塊狀', scene: 'lump', color: '#246877', pattern: '' },
  granule: { name: '顆粒', scene: 'granules', color: '#9b4a28', pattern: '12 5' },
  powder: { name: '粉末', scene: 'powder', color: '#734996', pattern: '3 5' },
};
const KEYS = Object.keys(SAMPLE);
const END = Object.fromEntries(KEYS.map(key => [key, calculate({ size: key }).time]));
const CHECK = 10;
const REGION = { x: 146, y: 232 };
const BUBBLE_LIFETIME = 1.35; // Same model seconds in every sample.
const FIRST_BUBBLE_ML = 0.45;
const BUBBLE_SPACING_ML = 1.7; // Shared visual encoding only; never use bubbles to measure volume.
const MAX_RATE = Math.max(...KEYS.map(size => instantRate({ size }, 0)));
const PACE = 6; // Model seconds per real second; simulated time, not a calibrated rate.
const STORAGE = 'bhcs-lab-reaction-rate-trial-v1';
const VERSION = MODEL_VERSION + '/trial-1';
const oneDecimal = new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const volume = (key, t) => quantity({ size: key }, t);
const BUBBLE_EVENTS = Object.fromEntries(KEYS.map(size => [size, makeBubbleEvents(size)]));
const fmt = number => oneDecimal.format(number);
const note = byId('live-status');
const buttonStart = byId('start-button');
const buttonPause = byId('pause-button');
const buttonMark = byId('mark-button');
const buttonNext = byId('next-button');
const graph = byId('graph');
const resetButton = byId('reset-button');
const resetDialog = byId('reset-dialog');
const resetContext = byId('reset-context');
const solidLump = byId('sample-lump');
const solidGranules = [...(byId('sample-granules')?.querySelectorAll('[data-center-x][data-center-y]') ?? [])];
const solidPowder = byId('sample-powder');
const bubbleNodes = [...(byId('bubbles')?.querySelectorAll('circle') ?? [])];
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const graphControls = byId('graph-controls');
const graphRangeButtons = {};
const graphLegend = document.createElement('div');
graphLegend.className = 'graph-legend';
graphLegend.setAttribute('aria-label', '曲線圖例');
for (const [size, sample] of Object.entries(SAMPLE)) {
  const entry = document.createElement('span');
  entry.className = 'graph-key';
  entry.dataset.sample = sample.scene;
  const line = makeGraphic('svg', { viewBox: '0 0 26 10', width: 26, height: 10, 'aria-hidden': 'true' });
  line.append(makeGraphic('line', { x1: 1, x2: 25, y1: 5, y2: 5, stroke: sample.color, 'stroke-width': 3.2,
    'stroke-linecap': 'round', 'stroke-dasharray': sample.pattern }));
  entry.append(line, document.createTextNode(sample.name));
  graphLegend.append(entry);
}
graph.before(graphLegend);

const STEPS = [
  ['先跑一次塊狀大理石', '按「開始反應」。看看大理石怎麼縮小，以及產出的氣體怎麼推動活塞。'],
  ['只換成顆粒大理石', '用和剛才一樣多的大理石，只改顆粒大小。塊狀的紀錄會留下來。'],
  ['在同一時間比一比', '看第 10 秒的縱線。同樣經過 10 秒，產氣較多的那組，這段時間的平均反應速率較快。'],
  ['再試試看粉末', '看看粉末一開始的變化，再讀第 10 秒的體積，和前兩組比一比。'],
  ['三組都跑完，再看終點', '讓還沒跑完的樣本繼續反應。最後一起比「完成時間」和「最終產氣量」。'],
  ['用數據解釋你的發現', '回頭看兩欄證據：第 10 秒的產氣量，以及三組的最終產氣量。'],
];

function byId(id) { return document.getElementById(id); }

function fresh() {
  return { v: VERSION, step: 1, active: 'lump', view: 'wide', finished: false,
    runs: Object.fromEntries(KEYS.map(k => [k, { t: 0, started: false }])),
    answers: [null, null] };
}
function readyAtTen(k, s = state) { return s.runs[k].t >= CHECK; }
function ended(k, s = state) { return s.runs[k].t >= END[k]; }
function allEnded(s = state) { return KEYS.every(k => ended(k, s)); }
function restore(raw) {
  const clean = fresh();
  if (!raw || raw.v !== VERSION) return clean;
  for (const key of KEYS) {
    const old = raw.runs?.[key];
    if (old?.started === true && typeof old.t === 'number' && Number.isFinite(old.t)) {
      clean.runs[key] = { t: Math.min(END[key], Math.max(0, old.t)), started: true };
    }
  }
  let maxStep = 1;
  if (readyAtTen('lump', clean)) maxStep = 2;
  if (maxStep === 2 && readyAtTen('granule', clean)) maxStep = 4;
  if (maxStep === 4 && readyAtTen('powder', clean)) maxStep = 5;
  if (maxStep === 5 && allEnded(clean)) maxStep = 6;
  if (Number.isInteger(raw.step)) clean.step = Math.max(1, Math.min(maxStep, raw.step));
  clean.active = clean.step === 1 ? 'lump' : clean.step <= 3 ? 'granule' : clean.step === 4 ? 'powder' :
    KEYS.includes(raw.active) ? raw.active : 'lump';
  if (raw.view === 'ten') clean.view = 'ten';
  if (clean.step === 6 && Array.isArray(raw.answers)) {
    clean.answers = [0, 1].map(i => [0, 1, 2].includes(raw.answers[i]) ? raw.answers[i] : null);
    clean.finished = raw.finished === true && clean.answers.every((n, i) => n === QUESTIONS[i].correct);
  }
  return clean;
}

const QUESTIONS = [
  {
    prompt: '第 10 秒，粉末已累積 44.6 mL。為什麼同樣時間內它能產氣最多？',
    options: ['粉末接觸酸液的總表面積比較大。', '粉末的大理石用量比較多。', '粉末接觸酸液的總表面積比較小。'],
    correct: 0, success: '對！三組用量相同，磨成粉末增加了和酸液接觸的總表面積，所以反應較快。',
    retry: '再看一眼：三組用量一樣。把同一塊分成許多小塊，露出來的表面是變多還是變少？',
  },
  {
    prompt: '三組都反應完全後，哪一組的產氣量最多？',
    options: ['粉末，因為它最快到達終點。', '三組相同，都是約 48.9 mL。', '塊狀，因為它反應最久。'],
    correct: 1, success: '對！180、90、18 秒是不同的完成時間，48.9 mL 則是相同的最終產氣量。',
    retry: '別只看哪組快或慢。看研究紀錄的最終體積，三組最後是否都到達同一個高度？',
  },
];

let storageAvailable = true;
let state;
try {
  state = restore(JSON.parse(localStorage.getItem(STORAGE)));
} catch {
  state = fresh();
}
let running = false;
let lastTick = 0;
let frame = 0;
let lastPaint = 0;
let lastSave = 0;
let statusMessage = '';
let pausedForReset = false;
let canWarnStorage = true;
function save() {
  try { localStorage.setItem(STORAGE, JSON.stringify(state)); }
  catch {
    storageAvailable = false;
    if (canWarnStorage) {
      canWarnStorage = false;
      announce('此瀏覽器無法保留進度，重新整理後需從頭開始。');
    }
  }
}
function announce(text) { if (note && note.textContent !== text) note.textContent = text; }
function hint(text) { statusMessage = text; }
function selectedRun() { return state.runs[state.active]; }
function mode() { return ended(state.active) ? 'finished' : running ? 'running' : selectedRun().started ? 'paused' : 'ready'; }
function pauseClock() {
  cancelAnimationFrame(frame);
  running = false;
  frame = 0;
}
function tick(now) {
  if (!running) return;
  if (!lastTick) lastTick = now;
  // Bound the advance after yielding, so a backgrounded tab cannot skip the observation.
  const realElapsed = Math.max(0, Math.min(0.12, (now - lastTick) / 1000));
  lastTick = now;
  const key = state.active, run = selectedRun(), before = run.t;
  const checkpointStop = before < CHECK && before + realElapsed * PACE >= CHECK;
  run.t = checkpointStop ? CHECK : Math.min(END[key], before + realElapsed * PACE);
  if (checkpointStop) {
    pauseClock();
    state.view = 'ten';
    hint('已記下第 10 秒。可看圖、繼續反應，或進入下一步。');
    announce(`${SAMPLE[key].name}模擬第 10 秒：${fmt(volume(key, CHECK))} 毫升，已暫停。`);
    save(); render(true);
    return;
  }
  if (ended(key)) {
    pauseClock();
    hint(`${SAMPLE[key].name}已到達平台。`);
    announce(`${SAMPLE[key].name}完成，模擬 ${END[key]} 秒，最終產氣量 ${fmt(volume(key, END[key]))} 毫升。`);
    save(); render(true);
    return;
  }
  paintReactionMotion(key, run.t, 'running');
  paintReadouts(key, run.t);
  if (now - lastPaint > 65) {
    lastPaint = now;
    paintGraph();
  }
  if (now - lastSave > 350) {
    lastSave = now; save();
  }
  frame = requestAnimationFrame(tick);
}
function startRun() {
  const startStep = [1, 2, 4, 5].includes(state.step);
  if (!startStep || running || ended(state.active) || resetDialog?.open) return;
  const wasNew = !selectedRun().started;
  const run = selectedRun();
  run.started = true;
  running = true;
  lastTick = 0;
  if (state.step === 5) state.view = 'wide';
  hint('');
  announce(`${SAMPLE[state.active].name}反應進行中。`);
  save(); render();
  if (wasNew) buttonPause.focus({ preventScroll: true });
  frame = requestAnimationFrame(tick);
}
function doPause() {
  if (!running) { if (selectedRun().started && !ended(state.active)) startRun(); return; }
  pauseClock();
  announce(`${SAMPLE[state.active].name}反應已暫停，可以接著跑。`);
  save(); render();
}
function markGraph() {
  if (!KEYS.some(k => readyAtTen(k))) return;
  setGraphView(state.view === 'ten' ? 'wide' : 'ten', true);
}
function setGraphView(view, notify = false) {
  if (view === 'ten' && !KEYS.some(k => readyAtTen(k))) return;
  state.view = view;
  if (notify) announce(view === 'ten' ? '放大前 10 模擬秒。' : '顯示反應的完整時間。');
  save(); paintGraph();
}
function nextAction() {
  if (running || state.finished || resetDialog?.open) return null;
  switch (state.step) {
    case 1: return readyAtTen('lump') ? { text: '下一步：換顆粒', step: 2, active: 'granule' } : null;
    case 2: return readyAtTen('granule') ? { text: '下一步：比第 10 秒', step: 3, active: 'granule' } : null;
    case 3: return { text: '下一步：試粉末', step: 4, active: 'powder' };
    case 4: return readyAtTen('powder') ? { text: '下一步：比終點', step: 5, active: KEYS.find(k => !ended(k)) || 'powder' } : null;
    case 5: {
      if (allEnded()) return { text: '下一步：說出你的發現', step: 6, active: state.active };
      const pending = KEYS.find(k => !ended(k));
      return ended(state.active) && pending ? { text: `換${SAMPLE[pending].name}`, step: 5, active: pending } : null;
    }
    default: return state.answers.every((answer, i) => answer === QUESTIONS[i].correct) ? { text: '完成實驗', done: true } : null;
  }
}
function goNext() {
  const next = nextAction();
  if (!next) return;
  const oldStep = state.step;
  if (next.done) state.finished = true;
  else {
    state.step = next.step;
    state.active = next.active;
    if (oldStep !== state.step) state.view = oldStep === 2 ? 'ten' : 'wide';
  }
  hint('');
  save(); render(true);
  if (state.finished) {
    announce('實驗完成。你已經能分辨反應速率與最終產氣量。');
    byId('trial-complete')?.focus();
  } else if (oldStep === state.step) {
    announce(`已換${SAMPLE[state.active].name}，先前的結果仍保留。`);
    (buttonPause.disabled ? buttonStart : buttonPause).focus();
  } else {
    const heading = byId(state.step === 6 ? 'quiz-title' : 'step-title');
    heading.tabIndex = -1;
    if ([2, 4].includes(state.step)) buttonStart.focus({ preventScroll: true });
    else heading.focus();
    announce(`第 ${state.step} 步。`);
  }
}
function askReset() {
  if (!resetDialog || resetDialog.open) return;
  pausedForReset = running;
  if (pausedForReset) {
    pauseClock();
    save();
    render();
  }
  if (resetContext) resetContext.hidden = !pausedForReset;
  resetDialog.returnValue = 'cancel';
  resetDialog.showModal();
  byId('reset-cancel')?.focus();
}
function resolveReset() {
  const interrupted = pausedForReset;
  pausedForReset = false;
  if (resetDialog.returnValue !== 'reset') {
    if (interrupted) {
      const message = '重做已取消，紀錄保留。反應維持暫停，按「繼續反應」即可接著跑。';
      hint(message);
      render();
      announce(message);
      buttonPause.focus();
    } else {
      resetButton?.focus();
    }
    return;
  }
  pauseClock();
  state = fresh();
  hint('');
  try { localStorage.removeItem(STORAGE); }
  catch { save(); }
  render(true);
  announce('本站的實驗紀錄與答案已清除，回到第一步。');
  buttonStart.focus();
}

function makeBubbleEvents(size) {
  // Space visual emissions by modeled gas volume. The same spacing and lifetime
  // make their cadence respond to the instantaneous rate, without counting gas literally.
  const events = [];
  const setting = { size };
  const end = END[size];
  const total = volume(size, end);
  for (let target = FIRST_BUBBLE_ML; target < total; target += BUBBLE_SPACING_ML) {
    let lo = 0, hi = end;
    for (let i = 0; i < 22; i++) {
      const middle = (lo + hi) / 2;
      if (quantity(setting, middle) < target) lo = middle; else hi = middle;
    }
    events.push(hi);
  }
  return events;
}

function shrinkAbout(element, fraction) {
  if (!element) return;
  const x = Number(element.dataset.centerX ?? REGION.x);
  const y = Number(element.dataset.centerY ?? REGION.y);
  element.setAttribute('transform', `translate(${x} ${y}) scale(${fraction.toFixed(5)}) translate(${-x} ${-y})`);
}

function paintReactionMotion(key, t, status) {
  const setting = { size: key };
  const massFraction = remainingMass(setting, t) / CONSTANTS.massG;
  const radius = Math.cbrt(massFraction);
  const rateFraction = instantRate(setting, t) / MAX_RATE;
  const value = volume(key, t);
  const position = (227 * value / CONSTANTS.syringeCapacityML).toFixed(2);
  byId('gas-fill').setAttribute('width', position);
  byId('plunger').setAttribute('transform', `translate(${position} 0)`);
  const scene = byId('scene');
  scene.style.setProperty('--reaction-activity', status === 'running' ? Math.sqrt(rateFraction).toFixed(4) : '0');

  // Isolated grains retain their own centers, rather than sliding together.
  if (key === 'lump') shrinkAbout(solidLump, radius);
  if (key === 'granule') for (const grain of solidGranules) shrinkAbout(grain, radius);
  if (key === 'powder' && solidPowder) {
    shrinkAbout(solidPowder, radius);
    solidPowder.setAttribute('opacity', Math.min(1, Math.sqrt(massFraction) * 1.45).toFixed(4));
  }

  const events = BUBBLE_EVENTS[key];
  const showBubbles = (status === 'running' || status === 'paused') && rateFraction > 0;
  // Keep SVG nodes assigned to stable emission indices, so pausing freezes the exact particles.
  const activeEvents = new Map();
  if (showBubbles && bubbleNodes.length) {
    for (let index = 0; index < events.length && events[index] <= t; index++) {
      const age = t - events[index];
      if (age < BUBBLE_LIFETIME) activeEvents.set(index % bubbleNodes.length, { index, age });
    }
  }
  bubbleNodes.forEach((node, positionIndex) => {
    const event = activeEvents.get(positionIndex);
    if (!event) {
      node.setAttribute('opacity', '0');
      return;
    }
    const { index, age } = event;
    const progress = age / BUBBLE_LIFETIME;
    const motion = reducedMotion?.matches ? 0.6 : progress;
    const x = REGION.x + [-18, 4, 18, -7, 12, -13][index % 6] + 3 * Math.sin(motion * 2 * Math.PI + (index % 3));
    const y = 222 - motion * 34;
    const fade = Math.min(1, age / 0.18, (BUBBLE_LIFETIME - age) / 0.3);
    node.setAttribute('cx', x.toFixed(2));
    node.setAttribute('cy', y.toFixed(2));
    node.setAttribute('r', (2.6 + (index % 4) * 0.45 + progress * 0.55).toFixed(2));
    node.setAttribute('opacity', fade.toFixed(4));
  });
}

function paintReadouts(key, t) {
  byId('sim-time').textContent = fmt(t);
  byId('sim-volume').textContent = fmt(volume(key, t));
}
function paintScene() {
  const key = state.active, t = selectedRun().t, label = SAMPLE[key];
  const status = mode();
  const stateLabel = { ready: '待開始', running: '反應中', paused: '已暫停', finished: '已完成' }[status];
  byId('scene').dataset.sample = label.scene;
  byId('scene').dataset.state = status;
  byId('sim-status').dataset.state = status;
  byId('sim-status').textContent = stateLabel;
  byId('sample-label').textContent = label.name;
  paintReadouts(key, t);
  paintReactionMotion(key, t, status);
}
function render(updateQuestion = false) {
  byId('step-kicker').textContent = `第 ${state.step} 步／共 6 步`;
  byId('step-title').textContent = STEPS[state.step - 1][0];
  byId('step-copy').textContent = STEPS[state.step - 1][1];
  const guide = byId('step-hint');
  if (guide) {
    const defaults = [
      '第 10 秒會自動停住，留時間讀刻度。', '看兩組在同一時間累積出多少氣體。', '第 10 秒的數值也會留在下方的紀錄表。',
      '粉末、顆粒、塊狀的結果可以一起看。', '先前的第 10 秒讀值不會消失。', '答錯可再試一次，不會清掉你的實驗紀錄。',
    ];
    guide.textContent = statusMessage || defaults[state.step - 1];
    if (!storageAvailable) guide.textContent += ' 此瀏覽器無法跨重新整理保留進度。';
  }
  for (const item of byId('step-list').querySelectorAll('[data-step]')) {
    const n = Number(item.dataset.step);
    item.dataset.state = (n < state.step || state.finished) ? 'done' : n === state.step ? 'current' : 'pending';
    if (n === state.step) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
  }
  paintScene();
  const labStep = [1, 2, 4, 5].includes(state.step);
  buttonStart.hidden = !labStep || selectedRun().started;
  buttonStart.disabled = !labStep || running || selectedRun().started;
  buttonPause.hidden = !labStep || !selectedRun().started;
  buttonPause.disabled = !labStep || !selectedRun().started || ended(state.active);
  buttonPause.textContent = running ? '暫停反應' : ended(state.active) ? '反應已完成' : '繼續反應';
  buttonMark.disabled = !KEYS.some(k => readyAtTen(k));
  const next = nextAction();
  buttonNext.hidden = state.step === 6;
  buttonNext.disabled = !next || buttonNext.hidden;
  buttonNext.textContent = next?.text || (state.finished ? '已完成' : state.step === 5 ? '先完成這組' : state.step === 6 ? '先回答兩題' : '下一步');
  paintEvidence();
  paintGraph();
  if (updateQuestion) paintQuestions();
}
function paintEvidence() {
  const tbody = byId('evidence');
  tbody.replaceChildren();
  for (const key of KEYS) {
    const tr = document.createElement('tr');
    const name = document.createElement('th');
    name.scope = 'row';
    name.dataset.sample = SAMPLE[key].scene;
    name.textContent = SAMPLE[key].name;
    tr.append(name);
    const cells = [readyAtTen(key) ? `${fmt(volume(key, CHECK))} mL` : '—',
      ended(key) ? `${END[key]} 秒` : '—',
      ended(key) ? `${fmt(volume(key, END[key]))} mL` : '—'];
    for (const text of cells) {
      const td = document.createElement('td');
      td.textContent = text;
      if (text === '—') td.setAttribute('aria-label', '尚未記錄');
      tr.append(td);
    }
    tbody.append(tr);
  }
  const recorded = KEYS.filter(k => readyAtTen(k));
  const count = recorded.length;
  byId('checkpoint').textContent = count ? `第 10 秒證據 ${count}／3 組` : '尚未記錄';
  const bench = byId('bench-evidence');
  if (bench) bench.textContent = count ? `第 10 秒｜${recorded.map(k => `${SAMPLE[k].name} ${fmt(volume(k, CHECK))} mL`).join(' · ')}` : '';
}
function makeGraphic(tag, attrs = {}, content = null) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [attr, val] of Object.entries(attrs)) if (val !== '') el.setAttribute(attr, val);
  if (content !== null) el.textContent = content;
  return el;
}
function paintGraph() {
  const ten = state.view === 'ten';
  const total = ten ? CHECK : END.lump;
  const ref = `${ten ? '放大前 10 模擬秒' : '完整反應時間'}｜橫軸：模擬時間（秒），縱軸：累積產氣量（mL）。`;
  const x0 = 54, x1 = 502, y0 = 237, y1 = 34;
  const x = t => x0 + (x1 - x0) * t / total;
  const y = v => y0 - (y0 - y1) * v / 55;
  const d = (start, end, key) => {
    const segments = Math.max(2, Math.ceil((end - start) / total * 100));
    return Array.from({ length: segments + 1 }, (_, i) => {
      const t = start + (end - start) * i / segments;
      return `${i ? 'L' : 'M'}${x(t).toFixed(2)} ${y(volume(key, t)).toFixed(2)}`;
    }).join(' ');
  };
  const seen = KEYS.filter(k => readyAtTen(k));
  const evidenceSummary = seen.length ? ` 第 10 秒：${seen.map(k => `${SAMPLE[k].name} ${fmt(volume(k, CHECK))} 毫升`).join('、')}。` : '';
  graph.setAttribute('aria-label', ref + evidenceSummary);
  graph.setAttribute('role', 'img');
  graph.removeAttribute('aria-labelledby');
  const parts = [makeGraphic('title', {}, ref)];
  for (let ml = 0; ml <= 50; ml += 10) {
    parts.push(makeGraphic('line', { x1: x0, x2: x1, y1: y(ml), y2: y(ml), stroke: '#d6e3e0' }));
    parts.push(makeGraphic('text', { x: x0 - 11, y: y(ml) + 5, 'text-anchor': 'end', fill: '#344b4c', 'font-size': 16 }, ml));
  }
  for (const second of ten ? [0, 2, 4, 6, 8, 10] : [0, 30, 60, 90, 120, 150, 180]) {
    parts.push(makeGraphic('line', { x1: x(second), x2: x(second), y1, y2: y0, stroke: '#d6e3e0' }));
    parts.push(makeGraphic('text', { x: x(second), y: y0 + 21, 'text-anchor': 'middle', fill: '#344b4c', 'font-size': 16 }, second));
  }
  parts.push(makeGraphic('path', { d: `M${x0} ${y1}V${y0}H${x1}`, fill: 'none', stroke: '#526c6f', 'stroke-width': 2 }));
  parts.push(makeGraphic('text', { x: x0, y: 21, fill: '#253d3f', 'font-size': 17, 'font-weight': 700 }, '累積產氣量（mL）'));
  parts.push(makeGraphic('text', { x: x1, y: 284, fill: '#253d3f', 'text-anchor': 'end', 'font-size': 17, 'font-weight': 700 }, '模擬時間（秒）'));
  if (ten || KEYS.some(k => readyAtTen(k))) {
    parts.push(makeGraphic('path', { d: `M${x(CHECK)} ${y1}V${y0}`, stroke: '#5a7571', 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
  }
  const drawOrder = [...KEYS].sort((a, b) => Number(a === state.active) - Number(b === state.active));
  for (const key of drawOrder) {
    const { color, pattern } = SAMPLE[key];
    const run = state.runs[key];
    if (run.t <= 0) continue;
    const end = Math.min(total, run.t);
    if (ended(key) && END[key] < total) {
      parts.push(makeGraphic('path', { d: `M${x(END[key])} ${y(volume(key, END[key]))}H${x(total)}`, stroke: color, opacity: 0.39, 'stroke-width': 2, 'stroke-dasharray': '3 6', fill: 'none' }));
    }
    parts.push(makeGraphic('path', { d: d(0, end, key), stroke: color, 'stroke-width': key === state.active ? 4 : 3.2, fill: 'none', 'stroke-linecap': 'round', 'stroke-dasharray': pattern }));
    if (readyAtTen(key)) {
      const py = y(volume(key, CHECK));
      parts.push(makeGraphic('circle', { cx: x(CHECK), cy: py, r: 5.8, fill: '#fff', stroke: color, 'stroke-width': 3 }));
      if (ten) parts.push(makeGraphic('text', { x: x(CHECK) - 12, y: py - 9, fill: color, 'font-size': 17, 'font-weight': 800, 'text-anchor': 'end', 'paint-order': 'stroke', stroke: '#fff', 'stroke-width': 4 }, fmt(volume(key, CHECK))));
    }
    if (!ten && ended(key)) {
      parts.push(makeGraphic('circle', { cx: x(END[key]), cy: y(volume(key, END[key])), r: 5.8, fill: '#fff', stroke: color, 'stroke-width': 3 }));
    }
  }
  graph.replaceChildren(...parts);
  byId('graph-note').textContent = ten ? '右側縱線標在第 10 秒；每個圈圈是一組讀值。' :
    state.runs.lump.t > 0 ? '有畫出的區段才是你已經跑過的時間。到達平台後，產氣量不再增加。' :
      '開始反應後，曲線會跟著活塞和秒數一起變動。';
  buttonMark.textContent = ten ? '看完整時間' : '放大第 10 秒';
  buttonMark.setAttribute('aria-pressed', String(ten));
  for (const [view, button] of Object.entries(graphRangeButtons)) {
    button.setAttribute('aria-pressed', String(view === state.view));
    button.disabled = view === 'ten' && !KEYS.some(k => readyAtTen(k));
  }
}
function paintQuestions(focus = false) {
  const panel = byId('question');
  panel.hidden = state.step !== 6;
  panel.replaceChildren();
  if (panel.hidden) return;
  if (state.finished) {
    const title = document.createElement('h3');
    title.textContent = '完成！快慢和總量是兩件事';
    title.id = 'trial-complete'; title.tabIndex = -1;
    const body = document.createElement('p');
    body.textContent = '同樣質量的大理石，與酸液接觸的表面積越大，反應越快。這裡酸液足夠，三組都完全反應後，最終都得到約 48.9 mL。';
    const wrap = document.createElement('div');
    wrap.className = 'quiz-celebration';
    wrap.append(title, body);
    panel.append(wrap);
    return;
  }
  const idx = Math.max(0, QUESTIONS.findIndex((q, i) => state.answers[i] !== q.correct));
  const both = state.answers.every((a, i) => a === QUESTIONS[i].correct);
  const active = both ? 1 : idx;
  const question = QUESTIONS[active];
  const wrap = document.createElement('fieldset');
  wrap.className = 'quiz-field';
  const title = document.createElement('legend');
  title.id = 'quiz-title'; title.tabIndex = -1;
  title.textContent = `${active + 1}／2　${question.prompt}`;
  wrap.append(title);
  const options = document.createElement('div');
  options.className = 'quiz-options';
  for (const [i, value] of question.options.entries()) {
    const opt = document.createElement('button');
    opt.type = 'button'; opt.className = 'quiz-option';
    opt.textContent = value;
    const chosen = state.answers[active] === i;
    opt.dataset.chosen = String(chosen);
    if (chosen) opt.dataset.correct = String(i === question.correct);
    opt.setAttribute('aria-pressed', String(chosen));
    opt.disabled = both && !chosen;
    opt.addEventListener('click', () => {
      if (both) return;
      state.answers[active] = i;
      save(); render();
      if (i === question.correct && active === 0) {
        // Preserve the answer in session state first; the next question can be restored without a transient button.
        paintQuestions(true);
        announce(question.success);
      } else {
        paintQuestions();
        const shown = panel.querySelector('#quiz-feedback');
        shown?.focus();
        announce(i === question.correct ? question.success : question.retry);
      }
    });
    options.append(opt);
  }
  wrap.append(options);
  const feedback = document.createElement('p');
  feedback.id = 'quiz-feedback'; feedback.tabIndex = -1;
  feedback.className = 'quiz-feedback';
  const answer = state.answers[active];
  if (answer !== null) feedback.textContent = answer === question.correct ? question.success : question.retry;
  else if (active === 1) feedback.textContent = QUESTIONS[0].success;
  else feedback.textContent = '選一個最符合你看到的結果。';
  wrap.append(feedback);
  if (both) {
    const complete = document.createElement('button');
    complete.id = 'complete-button';
    complete.type = 'button';
    complete.className = 'btn primary';
    complete.textContent = '完成實驗';
    complete.addEventListener('click', goNext);
    wrap.append(complete);
  }
  panel.append(wrap);
  if (focus) title.focus();
}

if (graphControls) {
  for (const [view, caption] of [['ten', '前 10 秒'], ['wide', '完整時間']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'graph-range';
    button.textContent = caption;
    button.addEventListener('click', () => setGraphView(view, true));
    graphControls.append(button);
    graphRangeButtons[view] = button;
  }
}
buttonStart.addEventListener('click', startRun);
buttonPause.addEventListener('click', doPause);
buttonMark.addEventListener('click', markGraph);
buttonNext.addEventListener('click', event => {
  // A double click on the same control must not skip the new observation step.
  if (event.detail <= 1) goNext();
});
resetButton?.addEventListener('click', askReset);
byId('reset-confirm')?.addEventListener('click', () => resetDialog.close('reset'));
byId('reset-cancel')?.addEventListener('click', () => resetDialog.close('cancel'));
resetDialog?.addEventListener('close', resolveReset);
document.addEventListener('visibilitychange', () => { if (document.hidden && running) doPause(); });
window.addEventListener('pagehide', () => { if (running) pauseClock(); save(); });
render(true);
