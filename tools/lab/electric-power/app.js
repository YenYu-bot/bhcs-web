// Isolated classroom trial. The equations match the electric-power case in
// scripts/science/models.mjs (2db4e00): 25 °C initial water, c = 4.2 J/(g·°C).
const WATER_GRAMS = 100;
const HEAT_CAPACITY = 4.2;
const START_TEMP = 25;
const SPEED = 10; // simulated seconds per real second, not a measured rate
const STORAGE_KEY = 'bhcs-lab-electric-heat-private-trial-v1';

export const trials = Object.freeze({
  v6: Object.freeze({ label: '基準・固定 6 V', short: '基準 6 Ω', mode: 'voltage', setpoint: 6, resistance: 6, limit: 70, color: '#235875', dash: '' }),
  v12: Object.freeze({ label: '固定 6 V・加大電阻', short: '固定 6 V・12 Ω', mode: 'voltage', setpoint: 6, resistance: 12, limit: 70, color: '#9A4929', dash: '10 5' }),
  vLong: Object.freeze({ label: '只延長通電時間', short: '同條件・140 秒', mode: 'voltage', setpoint: 6, resistance: 6, limit: 140, color: '#316451', dash: '10 5' }),
  i6: Object.freeze({ label: '固定 1 A・第一組', short: '固定 1 A・6 Ω', mode: 'current', setpoint: 1, resistance: 6, limit: 70, color: '#235875', dash: '' }),
  i12: Object.freeze({ label: '固定 1 A・第二組', short: '固定 1 A・12 Ω', mode: 'current', setpoint: 1, resistance: 12, limit: 70, color: '#754994', dash: '10 5' }),
});
export const meterScenarios = Object.freeze([[1000, 1], [500, 2]].map(Object.freeze));

export function calculateTrial(key, seconds, connected = false) {
  const trial = trials[key];
  if (!Object.hasOwn(trials, key) || !Number.isFinite(seconds)) throw new TypeError('無效的模擬條件');
  const time = Math.min(Math.max(seconds, 0), trial.limit);
  const I = trial.mode === 'voltage' ? trial.setpoint / trial.resistance : trial.setpoint;
  const V = trial.mode === 'voltage' ? trial.setpoint : trial.setpoint * trial.resistance;
  const P = V * I;
  const energy = P * time;
  const dT = energy / (WATER_GRAMS * HEAT_CAPACITY);
  return { time, I, V, P, energy, heat: energy, dT, temp: START_TEMP + dT,
    liveI: connected ? I : 0, liveV: connected ? V : 0, liveP: connected ? P : 0 };
}
export function meterKWh(watts, hours) {
  if (!Number.isFinite(watts) || !Number.isFinite(hours) || watts < 0 || hours < 0) throw new TypeError('無效的電表條件');
  return watts / 1000 * hours;
}

const order = Object.keys(trials);
const stages = [
  ['先跑一組加熱基準', '把開關閉合。看電熱線亮起後，溫度和累積電能怎麼變。', '注意開關打開時，電流與功率讀值都是 0。'],
  ['固定 6 V，只換電阻', '電熱線已從 6 Ω 換成 12 Ω。閉合開關，維持相同的 6 V 加熱 70 秒。', '公平比較：水量、初溫和通電時間都一樣。'],
  ['同功率，多通電一倍時間', '電熱線已換回 6 Ω。讓它加熱 140 秒，和基準的 70 秒比較。', '功率是每秒用多少電能；先看瓦數，再看累積焦耳。'],
  ['這次固定電流 1 A', '先跑 6 Ω，再換成 12 Ω，各加熱 70 秒。這次電源會調整電壓，讓電流維持 1 A。', '比較前先確認這次鎖住的是「電流」，不是「電壓」。'],
  ['用獨立電表量一度電', '兩組電器，功率和使用時間都不同。切換兩個情境，各量一次累積的電能。', '1 度電＝1 kWh。這裡不加熱水，只看電表。'],
  ['用證據說明你的發現', '從剛才的升溫對照和電表讀值找證據：不是每一題都在問同一個量。', '回答前可以回看下方的實驗證據。'],
];
const nextLabels = ['換成 12 Ω', '換回 6 Ω，延長時間', '改用固定電流', '前往獨立電表', '開始答題'];
const changeNote = {
  v6: '先記下基準：每一組都用 100 g、25°C 的水。',
  v12: '保持 6 V 和 70 秒，只把電阻由 6 Ω 換成 12 Ω。',
  vLong: '回到基準的 6 V、6 Ω，只把通電時間由 70 秒延長到 140 秒。',
  i6: '改成固定 1 A。先用 6 Ω 跑一組，下一組仍保持 1 A 和 70 秒。',
  i12: '保持 1 A 和 70 秒，只把電阻由 6 Ω 換成 12 Ω。',
};
const resultNote = {
  v6: '70 秒共用 420 J。下一組只改電阻，看看這個溫升會變多少。',
  v12: '對照基準：同樣 70 秒，功率 6 → 3 W，溫升 +1.0 → +0.5°C。',
  vLong: '對照基準：功率都為 6 W，電能 420 → 840 J，溫升 +1.0 → +2.0°C。',
  i6: '6 Ω 時，加熱電壓是 6 V。下一組只換 12 Ω，再看電壓怎麼變。',
  i12: '固定 1 A：電壓 6 → 12 V，功率 6 → 12 W，溫升 +1.0 → +2.0°C。和固定 6 V 的結果正好相反。',
};
const praise = {
  v6: '通電 70 秒共用 420 J，水溫上升 1.0°C。斷電後，溫度停在這裡。',
  v12: '同樣 70 秒，3 W 只累積 210 J，水溫上升 0.5°C。看曲線，和基準相差多少？',
  vLong: '功率仍是 6 W，但用電量從 420 J 變成 840 J，升溫也從 1.0°C 變成 2.0°C。',
  i6: '固定 1 A 時，6 Ω 要 6 V。下一組只換成 12 Ω，看看要多少伏特。',
  i12: '維持 1 A，電源會把電壓從 6 V 提高到 12 V。電流沒變，為什麼功率加倍？',
};
const questions = [
  { title: '把 6 Ω 換成 12 Ω，為什麼兩次對照的結果相反？',
    choices: ['電阻變大，一定升溫更快', '固定電壓時電流變小；固定電流時，較大電阻需要較高電壓', '是因為第二次用了更多水'], correct: 1,
    hint: '再看證據表，水量沒變。固定 6 V 時和固定 1 A 時，哪一個量因換電阻而改變？',
    proof: '對。固定 6 V 時，電流從 1 A 降到 0.5 A，功率減半；固定 1 A 時，電壓從 6 V 升到 12 V，功率加倍。' },
  { title: '6 W 通電 140 秒，比通電 70 秒有什麼變化？',
    choices: ['功率加倍，累積電能不變', '功率和累積電能都不變', '功率不變，累積電能和溫升都加倍'], correct: 2,
    hint: '再看只改時間的證據：每秒用的電能仍是 6 J，只是通電更久。',
    proof: '對。兩組都是 6 W；時間加倍，電能從 420 J 增到 840 J，水的溫升也從 1.0°C 增到 2.0°C。' },
  { title: '哪一組電器用的電能相同？',
    choices: ['1,000 W × 1 小時，與 500 W × 2 小時', '1,000 W × 1 小時，與 500 W × 1 小時', '1,000 W × 2 小時，與 500 W × 2 小時'], correct: 0,
    hint: '把瓦數換成 kW，再乘上小時。電表讀的是累積電能，不是瞬間功率。',
    proof: '對。1 kW × 1 小時＝0.5 kW × 2 小時＝1 kWh，也就是 1 度電。' },
];

const canMount = typeof document !== 'undefined' && document.getElementById('start-button');
if (canMount) init();

function init() {
  const $ = id => document.getElementById(id);
  const show = (id, shown) => { if ($(id)) $(id).hidden = !shown; };
  const put = (id, value) => {
    const node = $(id);
    if (node && node.textContent !== String(value)) node.textContent = value;
  };
  const fresh = () => ({ completed: [], meters: [], stage: 0, correct: [] });
  let data = load();
  let stage = data.stage;
  let meterChoice = data.meters.includes(0) && !data.meters.includes(1) ? 1 : 0;
  let active = activeFor(stage);
  let seconds = active && data.completed.includes(active) ? trials[active].limit : 0;
  let status = seconds > 0 ? 'done' : 'ready';
  let frame = 0;
  let previous = null;
  let lastDraw = 0;
  let lastAnnounce = '';
  const meterRun = $('meter-run');
  if (meterRun && !$('meter-next-button')) {
    const go = document.createElement('button');
    go.type = 'button'; go.id = 'meter-next-button'; go.className = 'btn btn-next';
    go.textContent = nextLabels[4]; go.disabled = true;
    go.addEventListener('click', advance);
    meterRun.after(go);
  }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const svgNS = 'http://www.w3.org/2000/svg';
  const fmt = n => String(Number(n.toFixed(2)));
  const tempFmt = n => n.toFixed(1);
  const visual = (tag, attrs, txt) => {
    const el = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (txt !== undefined) el.textContent = txt;
    return el;
  };
  const focus = id => $(id)?.focus({ preventScroll: true });
  const safeScroll = node => {
    // Put the target in view when it would otherwise end up off-screen on phone.
    const rect = node?.getBoundingClientRect();
    if (rect && (rect.top < 0 || rect.bottom > innerHeight)) node.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  };
  const announce = message => {
    if (message !== lastAnnounce) {
      put('announcement', message);
      lastAnnounce = message;
    }
  };

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!raw || raw.version !== 1) return fresh();
      const completed = [];
      if (Array.isArray(raw.completed)) {
        for (const [i, key] of order.entries()) {
          if (raw.completed[i] !== key) break;
          completed.push(key);
        }
      }
      const maxStage = completed.length < 3 ? completed.length : completed.length < 5 ? 3 : 4;
      const meters = maxStage >= 4 && Array.isArray(raw.meters) ? [0, 1].filter(x => raw.meters.includes(x)) : [];
      const limit = meters.length === 2 ? 5 : maxStage;
      const stage = Number.isInteger(raw.stage) ? Math.min(limit, Math.max(0, raw.stage)) : 0;
      const correct = stage === 5 && Array.isArray(raw.correct) ? [0, 1, 2].filter(x => raw.correct.includes(x)) : [];
      return { completed, meters, stage, correct };
    } catch { return fresh(); }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...data, stage })); }
    catch { /* Continuing without storage is safe; results remain in this open page. */ }
  }
  function activeFor(index) {
    return index === 3 ? (data.completed.includes('i12') ? 'i12' : 'i6') : order[index] ?? 'i12';
  }
  function advance() {
    if (!readyNext()) return;
    if (stage === 5) return;
    stage += 1;
    active = activeFor(stage);
    seconds = data.completed.includes(active) ? trials[active].limit : 0;
    status = seconds ? 'done' : 'ready';
    save();
    renderStage();
    const heading = $('task-title');
    // Keep the new task, apparatus and primary action together. Avoid jumping past the instructions.
    if (heading && matchMedia('(max-width: 850px)').matches) heading.closest('.task')?.scrollIntoView({block:'start',behavior:'instant'});
    else safeScroll(heading);
    focus(stage < 4 ? 'start-button' : stage === 4 ? 'meter-run' : 'task-title');
    announce('第 ' + (stage + 1) + ' 步：' + stages[stage][0]);
  }
  function closeCircuit() {
    if (stage > 3 || !active || (status !== 'ready' && status !== 'paused')) return;
    status = 'running';
    // Anchor now; the first callback may be delayed by a busy or suspended tab.
    previous = performance.now();
    lastDraw = previous;
    frame = requestAnimationFrame(tick);
    renderStatus();
    announce('已閉合開關，開始加熱。');
  }
  function tick(now) {
    frame = 0;
    if (status !== 'running') return;
    const elapsed = Math.max(0, (now - previous) / 1000) * SPEED;
    previous = now;
    const end = trials[active].limit;
    seconds = Math.min(end, seconds + elapsed);
    if (seconds >= end) {
      finish();
      return;
    }
    if (now - lastDraw >= (reducedMotion.matches ? 220 : 75)) {
      renderValues();
      renderGraph();
      lastDraw = now;
    }
    frame = requestAnimationFrame(tick);
  }
  function openCircuit(message = '已打開開關。再次閉合即可從這一刻繼續。') {
    if (status !== 'running') return;
    cancelAnimationFrame(frame);
    frame = 0;
    previous = null;
    status = 'paused';
    const returnFocus = document.activeElement === $('pause-button');
    renderStatus();
    if (returnFocus) focus('start-button');
    announce(message);
  }
  function finish() {
    status = 'done';
    previous = null;
    if (!data.completed.includes(active)) data.completed.push(active);
    save();
    const moveFocus = [$('start-button'), $('pause-button')].includes(document.activeElement);
    renderStatus();
    renderEvidence();
    announce('這組加熱完成。溫升 ' + tempFmt(calculateTrial(active, seconds).dT) + ' 度。' + (stage === 3 && active === 'i6' ? '接著換成 12 歐姆。' : '可進到下一步。'));
    if (moveFocus) focus(stage === 3 && active === 'i6' ? 'swap-resistance' : 'next-button');
  }
  function rewind() {
    if (status === 'running') openCircuit();
    if (!seconds && status === 'ready') return;
    seconds = 0;
    status = 'ready';
    renderStatus();
    focus('start-button');
    announce('已換成一杯 25 度的水。先前已完成的證據仍保留。');
  }
  function swap() {
    if (stage !== 3 || !data.completed.includes('i6') || active !== 'i6' || status !== 'done') return;
    active = 'i12';
    seconds = 0;
    status = 'ready';
    renderStatus();
    focus('start-button');
    announce('已換成 12 歐姆，水回到 25 度，電流仍設定為 1 安培。');
  }
  function readyNext() {
    if (stage === 4) return data.meters.length === 2;
    if (stage === 5) return false;
    return status === 'done' && (stage !== 3 || active === 'i12');
  }

  function renderValues() {
    const connected = status === 'running';
    const r = calculateTrial(active, seconds, connected);
    // Display truncated time until the real endpoint; do not show final seconds
    // early through rounding while the switch is still changing state.
    put('time-value', (Math.floor(r.time * 10) / 10).toFixed(1));
    const progress = $('heat-progress');
    if (progress) { progress.max = trials[active].limit; progress.value = r.time; }
    put('temp-value', tempFmt(r.temp));
    put('current-value', fmt(r.liveI));
    put('voltage-value', fmt(r.liveV));
    put('power-value', fmt(r.liveP));
    put('energy-value', fmt(r.energy));
    put('resistance-value', trials[active].resistance);
    const svg = $('circuit-svg');
    if (svg) {
      svg.dataset.powered = String(connected);
      svg.dataset.strength = r.liveP <= 3 ? 'low' : r.liveP <= 6 ? 'medium' : 'high';
    }
    $('switch-arm')?.setAttribute('transform', 'rotate(' + (connected ? '0' : '-24') + ' 234 70)');
    if ($('mercury')) {
      const h = 5 + 19 * r.dT;
      $('mercury').setAttribute('y', 185 - h);
      $('mercury').setAttribute('height', h);
    }
  }
  function renderStatus() {
    const t = trials[active];
    const heating = stage < 4;
    const running = status === 'running';
    const done = status === 'done';
    const paused = status === 'paused';
    if ($('scene')) {
      $('scene').dataset.state = status;
      $('scene').dataset.on = String(running);
    }
    put('circuit-mode', t.mode === 'voltage' ? '固定電壓' : '固定電流');
    put('circuit-v', t.mode === 'voltage' ? t.setpoint + ' V' : t.setpoint + ' A');
    put('circuit-r', t.resistance + ' Ω');
    put('target-hint', t.limit + ' 模擬秒・10× 播放');
    put('condition-compare', changeNote[active]);
    show('heat-progress', heating && (running || paused));
    show('outcome', heating && done);
    if (heating && done) {
      const result = calculateTrial(active, t.limit);
      put('outcome-title', '這組已記錄');
      put('outcome-metrics', (t.mode === 'current' ? fmt(result.V) + ' V　·　' : '') + fmt(result.P) + ' W　·　溫升 +' + tempFmt(result.dT) + '°C');
      put('outcome-compare', resultNote[active]);
    }
    put('run-status', running ? '加熱中' : done ? '已斷電・已記錄' : paused ? '已斷電・暫停' : '開關斷開');
    put('teacher-note', heating && done ? praise[active] : stages[stage][2]);
    const start = $('start-button'), pause = $('pause-button'), rewindBtn = $('rewind-button'), next = $('next-button');
    show('start-button', heating && !running && !done);
    show('pause-button', heating && running);
    show('rewind-button', heating && (done || paused));
    put('start-button', paused ? '閉合開關，繼續加熱' : '閉合開關，開始加熱');
    if (start) start.disabled = !heating || running || done;
    if (pause) pause.disabled = !heating || !running;
    if (rewindBtn) rewindBtn.disabled = !heating || (!done && !paused);
    if (next) next.disabled = !readyNext();
    put('next-button', nextLabels[stage] ?? '挑戰完成');
    show('next-button', heating && readyNext());
    const slot = $('bench-actions');
    if (slot) {
      let swapButton = $('swap-resistance');
      if (stage === 3 && active === 'i6' && done) {
        if (!swapButton) {
          swapButton = document.createElement('button');
          swapButton.type = 'button'; swapButton.id = 'swap-resistance';
          swapButton.className = 'btn btn-next';
          swapButton.textContent = '只換電阻：改用 12 Ω';
          swapButton.addEventListener('click', swap);
          slot.append(swapButton);
        }
      } else swapButton?.remove();
    }
    renderValues();
    renderGraph();
  }

  function renderGraph() {
    if (!$('graph') || stage >= 4) return;
    const graph = $('graph');
    const xMax = stage === 2 ? 140 : 70;
    const compare = [[], ['v6'], ['v6'], active === 'i12' ? ['i6'] : []][stage] ?? [];
    const width = 520, height = 194, l = 54, r = 20, t = 26, b = 146;
    const rangeTop = 27;
    const x = time => l + (width - r - l) * time / xMax;
    const y = temp => b - (b - t) * (temp - START_TEMP) / (rangeTop - START_TEMP);
    let svg = graph.namespaceURI === svgNS ? graph : graph.firstElementChild;
    if (!svg || svg.namespaceURI !== svgNS) {
      svg = visual('svg', {});
      graph.replaceChildren(svg);
    }
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('role', 'img');
    const baseLabel = '水溫對通電時間圖，縱軸從 25°C 起；橫軸為模擬秒。';
    const result = calculateTrial(active, seconds);
    const reference = compare.filter(key => data.completed.includes(key));
    svg.setAttribute('aria-label', baseLabel);
    const compareResults = reference.map(key => trials[key].short + '：' + tempFmt(calculateTrial(key, trials[key].limit).temp) + '°C');
    const comparisonNotes = ['縱軸從 25°C 起。線越陡，表示相同時間內升溫越多。', '固定 6 V：讀兩條線在 70 秒的水溫。', '只改通電時間：兩線斜率相同，所以前 70 秒會重疊。', '固定 1 A：讀兩條線在 70 秒的水溫。'];
    const endpoints = status === 'done' ? [...compareResults, trials[active].short + '：' + tempFmt(result.temp) + '°C'] : [];
    put('graph-summary', (stage === 3 && !reference.length ? '跑完 6 Ω，再換 12 Ω 疊圖比較。' : comparisonNotes[stage]) + (endpoints.length ? ' ' + endpoints.join('；') + '。' : ''));
    const staticKey = stage + '/' + active + '/' + reference.join(';');
    let trace = svg.querySelector('[data-active-point]');
    if (!trace || svg.dataset.staticKey !== staticKey) {
      svg.dataset.staticKey = staticKey;
      svg.replaceChildren();
      svg.append(visual('text', { x: l, y: 15, 'font-size': 14, 'font-weight': 700, fill: '#3b5066' }, '水溫（°C）'));
      for (const temperature of [25, 25.5, 26, 26.5, 27]) {
        const yy = y(temperature);
        svg.append(visual('line', { x1: l, x2: width-r, y1: yy, y2: yy, stroke: '#d7e0e7', 'stroke-width': 1 }));
        svg.append(visual('text', { x: l-8, y: yy+4, 'text-anchor': 'end', 'font-size': 13, fill: '#3b5066' }, String(temperature)));
      }
      for (const time of [0, xMax/2, xMax]) {
        const xx = x(time);
        svg.append(visual('line', { x1: xx, x2: xx, y1: t, y2: b, stroke: '#d7e0e7', 'stroke-width': 1 }));
        svg.append(visual('text', { x: xx, y: b+18, 'text-anchor': 'middle', 'font-size': 13, fill: '#3b5066' }, String(time)));
      }
      svg.append(
        visual('path', { d: 'M ' + l + ' ' + t + ' V ' + b + ' H ' + (width-r), fill: 'none', stroke: '#596e81', 'stroke-width': '1.3' }),
        visual('text', { x: (l+width-r)/2, y: 186, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: '#3b5066' }, '通電時間（模擬秒）')
      );
      for (const key of reference) {
        const item = trials[key], c = calculateTrial(key, item.limit);
        svg.append(visual('line', { x1: x(0), x2: x(item.limit), y1: y(25), y2: y(c.temp), stroke: item.color, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': item.dash || 'none' }));
        svg.append(visual('circle', { cx: x(item.limit), cy: y(c.temp), r: 4, fill: '#fff', stroke: item.color, 'stroke-width': 2 }));
      }
      svg.append(visual('line', { 'data-active-line': '', x1: x(0), y1: y(25), stroke: trials[active].color, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-dasharray': trials[active].dash || 'none' }));
      trace = visual('circle', { 'data-active-point': '', r: 5, fill: trials[active].color, stroke: '#fff', 'stroke-width': 1.8 });
      svg.append(trace);
      let legend = $('graph-keys');
      if (!legend && graph.namespaceURI !== svgNS) {
        legend = document.createElement('div');
        legend.id = 'graph-keys';
        legend.className = 'graph-legend';
        graph.before(legend);
      }
      if (legend) {
        legend.replaceChildren(...[...reference, active].map(key => {
          const label = document.createElement('span');
          const item = trials[key];
          label.className = 'graph-key';
          const line = visual('svg', { width: 22, height: 12, viewBox: '0 0 22 12', 'aria-hidden': 'true' });
          line.append(visual('line', { x1: 2, x2: 20, y1: 6, y2: 6, stroke: item.color, 'stroke-width': 3, 'stroke-dasharray': item.dash ? '5 3' : 'none' }));
          label.append(line, document.createTextNode(item.short));
          return label;
        }));
      }
    }
    const endpoint = svg.querySelector('[data-active-line]');
    endpoint.setAttribute('x2', x(seconds)); endpoint.setAttribute('y2', y(result.temp));
    trace.setAttribute('cx', x(seconds)); trace.setAttribute('cy', y(result.temp));
  }

  function renderEvidence() {
    const body = $('evidence-body');
    if (!body) return;
    body.replaceChildren(...data.completed.map(key => {
      const trial = trials[key], result = calculateTrial(key, trial.limit);
      const row = document.createElement('tr');
      row.dataset.trial = key;
      const cells = [trial.label, trial.resistance + ' Ω', fmt(result.V) + ' V', fmt(result.I) + ' A', fmt(result.P) + ' W', trial.limit + ' 秒', '+' + tempFmt(result.dT) + '°C'];
      for (const [index, item] of cells.entries()) {
        const cell = document.createElement(index === 0 ? 'th' : 'td');
        if (index === 0) cell.scope = 'row';
        cell.textContent = item;
        row.append(cell);
      }
      return row;
    }));
    if (!data.completed.length) {
      const row = document.createElement('tr'), cell = document.createElement('td');
      cell.colSpan = 7; cell.className = 'evidence-empty';
      cell.textContent = '完成一組加熱後，數據會留在這裡。';
      row.append(cell); body.append(row);
    }
    put('evidence-count', data.completed.length + ' 組加熱紀錄');
  }

  function renderMeter() {
    if (stage !== 4) return;
    document.querySelectorAll('#meter-options [data-meter]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.meter) === meterChoice));
    });
    const measured = data.meters.includes(meterChoice);
    put('meter-run', measured ? '這組已量過' : '量這組用幾度電');
    $('meter-run').disabled = measured;
    for (const button of document.querySelectorAll('#meter-options [data-meter]')) {
      const [watts, hours] = meterScenarios[Number(button.dataset.meter)];
      button.textContent = watts.toLocaleString('zh-TW') + ' W × ' + hours + ' 小時' + (data.meters.includes(Number(button.dataset.meter)) ? ' ✓' : '');
    }
    const result = $('meter-result');
    if (result) {
      if (!data.meters.length) result.textContent = '先選一組，再按「量這組」。';
      else {
        result.replaceChildren(...[0, 1].filter(i => data.meters.includes(i)).map(i => {
          const [watts, hours] = meterScenarios[i];
          const p = document.createElement('p');
          p.dataset.meterMeasured = String(i);
          p.textContent = watts.toLocaleString('zh-TW') + ' W × ' + hours + ' 小時＝' + fmt(watts/1000) + ' kW × ' + hours + ' h＝' + fmt(meterKWh(watts, hours)) + ' kWh（1 度電）';
          return p;
        }));
      }
    }
    put('teacher-note', data.meters.length === 2 ? '兩組的功率和時間不同，但「功率 × 時間」相同，所以用電量都是 1 度。' : stages[stage][2]);
    if ($('meter-next-button')) {
      $('meter-next-button').disabled = !readyNext();
      $('meter-next-button').hidden = !readyNext();
    }
  }

  function renderQuestions() {
    const list = $('question-list');
    if (!list) return;
    list.replaceChildren();
    for (const [i, q] of questions.entries()) {
      const field = document.createElement('fieldset');
      field.className = 'lesson-question';
      const title = document.createElement('legend');
      title.textContent = (i + 1) + '．' + q.title;
      field.append(title);
      const choices = document.createElement('div');
      choices.className = 'question-choices';
      const feedback = document.createElement('p');
      feedback.className = 'question-feedback';
      feedback.setAttribute('role', 'status');
      for (const [choice, label] of q.choices.entries()) {
        const wrapper = document.createElement('label'), radio = document.createElement('input');
        radio.type = 'radio'; radio.name = 'heat-q' + i; radio.value = String(choice);
        if (data.correct.includes(i) && choice === q.correct) radio.checked = true;
        wrapper.append(radio, document.createTextNode(label)); choices.append(wrapper);
        radio.addEventListener('change', () => {
          if (data.correct.includes(i)) {
            data.correct = data.correct.filter(n => n !== i);
            save();
            updateScore();
          }
          feedback.textContent = ''; delete feedback.dataset.correct;
        });
      }
      const check = document.createElement('button');
      check.type = 'button'; check.className = 'secondary';
      check.dataset.checkQuestion = String(i);
      check.textContent = '檢查這題';
      const updateFeedback = correct => {
        feedback.textContent = correct ? q.proof : q.hint;
        feedback.dataset.correct = String(correct);
      };
      if (data.correct.includes(i)) updateFeedback(true);
      check.addEventListener('click', () => {
        const selected = choices.querySelector('input:checked');
        if (!selected) { feedback.textContent = '先選一個答案。'; return; }
        const correct = Number(selected.value) === q.correct;
        if (correct && !data.correct.includes(i)) data.correct.push(i);
        if (!correct) data.correct = data.correct.filter(n => n !== i);
        save();
        updateFeedback(correct);
        updateScore();
        if (data.correct.length === 3) announce('三題都完成了。你已用數據解釋電流熱效應。');
      });
      field.append(choices, check, feedback);
      list.append(field);
    }
    updateScore();
  }
  function updateScore() {
    const allCorrect = data.correct.length === 3;
    put('quiz-summary', allCorrect ? '挑戰完成！' : '已答對 ' + data.correct.length + '／3 題');
    const indicator = $('step-list')?.querySelector('[aria-current="step"]');
    if (stage === 5 && indicator) indicator.dataset.state = allCorrect ? 'done' : 'current';
  }

  function renderStage() {
    put('task-title', stages[stage][0]);
    put('task-note', stages[stage][1]);
    put('step-kicker', '第 ' + (stage + 1) + ' 步／共 6 步');
    if ($('step-list')) {
      const list = [...$('step-list').querySelectorAll('[data-step]')];
      const oneBased = !list.some(n => n.dataset.step === '0');
      for (const item of list) {
        const index = Number(item.dataset.step) - Number(oneBased);
        const current = index === stage;
        item.classList.toggle('is-current', current);
        item.classList.toggle('is-complete', index < stage);
        item.dataset.state = index < stage ? 'done' : current ? 'current' : 'pending';
        if (current) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
      }
    }
    show('lab-panel', stage < 4);
    show('meter-panel', stage === 4);
    show('question-panel', stage === 5);
    renderStatus();
    renderEvidence();
    if (stage === 4) renderMeter();
    if (stage === 5) renderQuestions();
  }

  function reset() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; previous = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    data = fresh(); stage = 0; meterChoice = 0; active = 'v6';
    seconds = 0; status = 'ready';
    renderStage();
    $('reset-dialog')?.close();
    focus('start-button'); safeScroll($('start-button'));
    announce('已清空本站紀錄，重新開始第一步。');
  }

  $('start-button')?.addEventListener('click', () => {
    closeCircuit();
    focus('pause-button');
  });
  $('pause-button')?.addEventListener('click', () => openCircuit());
  $('rewind-button')?.addEventListener('click', rewind);
  $('next-button')?.addEventListener('click', advance);
  $('reset-button')?.addEventListener('click', () => {
    if (status === 'running') openCircuit();
    const dialog = $('reset-dialog');
    if (!dialog) return;
    dialog.showModal();
    focus('reset-cancel');
  });
  $('reset-dialog')?.addEventListener('close', () => {
    if (document.activeElement !== $('start-button')) focus('reset-button');
  });
  $('reset-cancel')?.addEventListener('click', () => $('reset-dialog')?.close());
  $('reset-confirm')?.addEventListener('click', reset);
  for (const node of document.querySelectorAll('#meter-options [data-meter]')) {
    node.addEventListener('click', () => {
      if (stage !== 4) return;
      const n = Number(node.dataset.meter);
      if (n !== 0 && n !== 1) return;
      meterChoice = n;
      renderMeter();
    });
  }
  $('meter-run')?.addEventListener('click', () => {
    if (stage !== 4) return;
    if (!data.meters.includes(meterChoice)) data.meters.push(meterChoice);
    save(); renderMeter();
    if (data.meters.length === 2) focus('meter-next-button');
    else document.querySelectorAll('#meter-options [data-meter]')[1 - meterChoice]?.focus({preventScroll:true});
    announce('這組累積 1 度電。' + (data.meters.length === 2 ? '兩組都已量過。' : '再換另一組比較。'));
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) openCircuit('離開頁面時已暫停，回來後可繼續。');
  });
  renderStage();
}
