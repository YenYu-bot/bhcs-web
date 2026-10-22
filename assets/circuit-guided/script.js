// Teaching script and view-models for Science Lab 2.0 Pilot #6 B3.
// Learner wording lives here. Science truth stays in model/engine; DOM stays in main/render/input.
// Formal circuit names are isolated in FORMAL_TEXT and are returned only after the engine reaches "concept".
import {
  compareStatus,
  conceptEvidence,
  currentGate,
  measurementGate,
  observationFor,
  structureGate,
} from './engine.js';
import { solveCircuit } from './model.js';

const deepFreeze = (o) => {
  for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v);
  return Object.freeze(o);
};

export const COACH_NAME = '余老師';
export const STATION_TITLE = '電路接線與電流';

export const STEPS = deepFreeze([
  { id: 'mission', number: '01', label: '接任務' },
  { id: 'experiment', number: '02', label: '動手接線' },
  { id: 'findings', number: '03', label: '整理發現' },
]);

export const TEXT = deepFreeze({
  stepNavLabel: '實驗進度',
  benchLabel: '電路實驗桌',
  dataTitle: '現在的條件',
  evidenceTitle: '我的量測紀錄',
  prototypeNote: '百宏文教免費互動教材｜請先自行完成接線與觀察，再查看概念整理。',
  welcome: {
    title: '同一顆電池，多接一顆燈泡，電池送出的總電流一定會變小嗎？',
    sub: '先不要背結論。你會自己接線、操作開關、移動電表，再用五次量測找答案。',
  },
  mission: {
    title: '任務：電池和燈泡規格固定，比較「燈泡數量」和「接法」。',
    sub: '電池固定 6 V，兩顆燈泡規格相同。先量一顆燈泡，再讓兩顆燈泡只有一條路，最後讓兩顆燈泡各自有通路。每一次都先接線、再閉合開關觀察。注意：從一顆燈泡變成兩顆時，燈泡數量和接法會同時改變。',
  },
  cta: {
    start: '開始',
    begin: '進入實驗桌',
    baseline: '記錄基準量測',
    trial1: '記錄兩顆燈泡量測',
    trial2Total: '記錄整體位置',
    trial2L1: '記錄燈泡 1 那一路',
    trial2L2: '記錄燈泡 2 那一路',
    compare1: '繼續改接法',
    compare2: '整理我的發現',
    concept: '揭開正式名稱',
  },
  coach: {
    'baseline-build': {
      main: '先建立基準：只讓燈泡 1 形成完整通路。',
      sub: '電流表放在所有電流都會經過的位置；電壓表兩端接到燈泡 1 的兩端。開關要能控制整個通路。',
    },
    'baseline-measure': {
      main: '基準接線完成。現在用開關觀察。',
      sub: '閉合開關後，確認電流表與電壓表都是正讀值，再記錄。',
    },
    'trial1-build': {
      main: '保留同一顆電池，加入燈泡 2，讓電流只有一條路徑。',
      sub: '這條路要依序經過兩顆燈泡；電流表仍放在所有電流都會經過的位置，電壓表仍量燈泡 1。',
    },
    'trial1-measure': {
      main: '兩顆燈泡只有一條路的接線完成。',
      sub: '閉合開關，比較電流與燈泡亮度，再記錄這次量測。',
    },
    'trial2-build': {
      main: '再改一次：讓兩顆燈泡各自有自己的完整通路。',
      sub: '兩條路都由同一顆電池供電，開關要能同時控制兩條路；先把電流表放在分開之前。',
    },
    'trial2-total': {
      main: '先量分開之前的位置。',
      sub: '閉合開關，記錄這個位置的電流與燈泡狀態。',
    },
    'trial2-branch1': {
      main: '現在把電流表移到只會經過燈泡 1 的那一路。',
      sub: '其他接法保持不變。閉合開關後再記錄。',
    },
    'trial2-branch2': {
      main: '最後把電流表移到只會經過燈泡 2 的那一路。',
      sub: '其他接法保持不變。這是第五筆量測。',
    },
    compare1: {
      main: '先比較前兩筆量測。',
      sub: '你只能根據剛才真的量到的結果作答，不要把一次結果當成永遠成立的規則。',
    },
    compare2: {
      main: '把基準與「兩顆各自有路」的結果放在一起。',
      sub: '再看整體位置的 2.0 A，和兩次各 1.0 A 的量測有什麼關係。',
    },
    inference: {
      main: '同樣是「多一顆燈泡」，結果可以往不同方向改變。',
      sub: '真正決定電池送出多少電流的，不只是燈泡數量，還有接法。',
    },
    concept: {
      main: '你已經先用量測得到規律，現在才補上正式名稱。',
      sub: '下面每個名詞都直接對回你剛才的五筆紀錄。',
    },
  },
  status: {
    build: '繼續接線。接法符合這一輪目標後，會自動進入量測。',
    open: '接線結構已完成。閉合開關觀察讀值。',
    ready: '讀值符合這一輪的量測位置，可以記錄。',
    short: '安全警示：目前接法形成近乎直接連接電池兩端的路徑，請先斷開再調整。',
    meter: '目前還不能記錄。檢查電表位置、正負端與接線。',
  },
  compareTitle: {
    c1: '先比較：一顆燈泡 vs. 兩顆燈泡只有一條路',
    c2: '再比較：一顆燈泡 vs. 兩顆燈泡各自有路',
  },
  compareHeads: {
    c1: { item: '觀察項目', first: '基準：一顆燈泡', second: '兩顆：只有一條路', changed: '改變', same: '相同' },
    c2: { item: '觀察項目', first: '基準：一顆燈泡', second: '兩顆：各自有路', changed: '改變', same: '相同' },
  },
  inferenceTitle: '你可以先下這個結論',
  announce: {
    mission: '任務說明。',
    baseline: '進入基準接線。',
    structure: '接線結構完成，現在操作開關觀察讀值。',
    record: (label) => `已記錄：${label}。`,
    compare: '進入量測比較。',
    inference: '整理量測發現。',
    concept: '正式名稱與公式現在揭示。',
  },
});

const COMPARE_TEXT = deepFreeze({
  c1: [
    {
      id: 'totalChange',
      text: '從基準 1.0 A 到兩顆燈泡只有一條路時，電池送出的電流怎麼變？',
      options: [['increase', '變大'], ['decrease', '變小'], ['same', '一樣']],
      correct: '對，這次從 1.0 A 變成 0.5 A。',
      nudge: '再看兩筆電流表紀錄：基準是 1.0 A，第二筆是 0.5 A。',
    },
    {
      id: 'claim',
      text: '這兩筆量測最多能支持哪一句話？',
      options: [
        ['one-path-only', '在這次「兩顆燈泡只有一條路」的接法中，總電流變小'],
        ['always-decrease', '只要多接一顆燈泡，總電流一定變小'],
        ['current-consumed', '因為第一顆燈泡把一部分電流用掉了'],
      ],
      correct: '對，先把結論限制在你真的測過的接法。',
      nudge: '目前只比較過一種兩顆燈泡的接法，還不能說「一定」。',
    },
  ],
  c2: [
    {
      id: 'totalChange',
      text: '兩顆燈泡各自有通路時，電池送出的電流和基準相比怎麼變？',
      options: [['increase', '變大'], ['decrease', '變小'], ['same', '一樣']],
      correct: '對，這次從 1.0 A 變成 2.0 A。',
      nudge: '比較基準的 1.0 A 與這次整體位置的 2.0 A。',
    },
    {
      id: 'branchRelation',
      text: '整體位置的 2.0 A，和兩次各 1.0 A 的量測有什麼關係？',
      options: [
        ['sum', '兩次 1.0 A 加起來就是 2.0 A'],
        ['one-branch', '2.0 A 只等於其中一次 1.0 A'],
        ['unrelated', '三個讀值沒有固定關係'],
      ],
      correct: '對，分開之前量到的 2.0 A，正好對上兩條路各 1.0 A 加起來。',
      nudge: '把兩次各 1.0 A 直接相加，再和整體位置比較。',
    },
  ],
});

const FORMAL_TEXT = deepFreeze({
  title: '把你的量測換成正式的電路語言',
  series: {
    title: '串聯：元件在同一條電流路徑上',
    body: '你第二次量測的兩顆燈泡只有一條路徑，這種接法稱為串聯。',
  },
  parallel: {
    title: '並聯：元件分別連在相同的兩個節點之間',
    body: '你後三次量測讓兩顆燈泡各自有通路，而且都接在同一顆電池兩端，這種接法稱為並聯。',
  },
  current: {
    title: '電流不是被燈泡「用掉」',
    body: '在並聯量測中，燈泡 1 那一路是 1.0 A、燈泡 2 那一路也是 1.0 A；分開之前是 2.0 A。電流在節點分流與合流，不是沿路被消耗。',
  },
  formula: {
    heading: '歐姆定律與等效電阻',
    expression: 'I = V / R',
    note: '本模擬使用理想 6 V 電池、理想導線與開關、理想電流表及理想電壓表。真實器材會有內阻、量測誤差與額定限制。',
  },
});

export const BENCH_PHASES = Object.freeze([
  'baseline-build','baseline-measure',
  'trial1-build','trial1-measure',
  'trial2-build','trial2-total','trial2-branch1','trial2-branch2',
]);
const BENCH_SET = new Set(BENCH_PHASES);
const MEASURE = Object.freeze({
  'baseline-measure': ['baseline', TEXT.cta.baseline],
  'trial1-measure': ['trial1', TEXT.cta.trial1],
  'trial2-total': ['trial2-total', TEXT.cta.trial2Total],
  'trial2-branch1': ['trial2-L1', TEXT.cta.trial2L1],
  'trial2-branch2': ['trial2-L2', TEXT.cta.trial2L2],
});
const STAGE = Object.freeze({
  'baseline-build':'baseline','baseline-measure':'baseline',
  'trial1-build':'trial1','trial1-measure':'trial1',
  'trial2-build':'trial2-total','trial2-total':'trial2-total',
  'trial2-branch1':'trial2-L1','trial2-branch2':'trial2-L2',
});
const LABEL = Object.freeze({
  baseline: '基準：一顆燈泡',
  trial1: '兩顆燈泡：只有一條路',
  'trial2-total': '兩顆燈泡：分開之前',
  'trial2-L1': '兩顆燈泡：燈泡 1 那一路',
  'trial2-L2': '兩顆燈泡：燈泡 2 那一路',
});

const fmt = (reading, unit) => reading === null ? '—' : `${reading.value.toFixed(1)} ${unit}`;
const lampWord = (x) => ({
  off: '熄滅', 'very-low': '很微弱', low: '較暗', reference: '基準亮度', high: '較亮',
}[x] ?? '—');

export const stationTitleFor = () => STATION_TITLE;

export function stepFor(state) {
  if (state.phase === 'welcome' || state.phase === 'mission') return 'mission';
  if (state.phase === 'inference' || state.phase === 'concept') return 'findings';
  return 'experiment';
}
export const stepNavModel = (state) => ({ steps: STEPS, currentStep: stepFor(state) });

export function screenFor(state) {
  const p = state.phase;
  if (p === 'welcome' || p === 'mission') return { id: 'welcome', arrival: ['#cgg-welcome-title'], focusTargets: ['#cgg-cta', '#cgg-welcome-title'] };
  if (BENCH_SET.has(p)) return { id: 'bench', arrival: ['[data-terminal]'], focusTargets: ['[data-terminal]', '[data-switch-toggle]', '#cgg-cta', '#cgg-heading'] };
  if (p === 'compare1' || p === 'compare2') return { id: 'compare', arrival: ['#cgg-compare-title'], focusTargets: ['[data-compare]', '#cgg-cta', '#cgg-compare-title'] };
  if (p === 'inference') return { id: 'inference', arrival: ['#cgg-inference-title'], focusTargets: ['#cgg-cta', '#cgg-inference-title'] };
  if (p === 'concept') return { id: 'concept', arrival: ['#cgg-concept-title'], focusTargets: ['#cgg-concept-title'] };
  throw new RangeError(`script: unknown phase ${p}`);
}

export function welcomeModel(state) {
  const m = state.phase === 'mission' ? TEXT.mission : TEXT.welcome;
  return { title: m.title, sub: m.sub };
}

export function ctaFor(state) {
  if (state.phase === 'welcome') return { label: TEXT.cta.start, action: { type: 'START' }, enabled: true };
  if (state.phase === 'mission') return { label: TEXT.cta.begin, action: { type: 'BEGIN' }, enabled: true };
  if (Object.hasOwn(MEASURE, state.phase)) {
    const [, label] = MEASURE[state.phase];
    return { label, action: { type: 'RECORD_MEASUREMENT' }, enabled: currentGate(state).ready };
  }
  if (state.phase === 'compare1') return { label: TEXT.cta.compare1, action: { type: 'CONTINUE' }, enabled: compareStatus(state).c1.allCorrect };
  if (state.phase === 'compare2') return { label: TEXT.cta.compare2, action: { type: 'CONTINUE' }, enabled: compareStatus(state).c2.allCorrect };
  if (state.phase === 'inference') return { label: TEXT.cta.concept, action: { type: 'CONTINUE' }, enabled: true };
  return null;
}

export function coachModel(state) {
  const m = TEXT.coach[state.phase];
  return m ? { name: COACH_NAME, main: m.main, sub: m.sub } : null;
}

function rawOf(state) { return { wires: state.wires, switchClosed: state.switchClosed }; }

export function benchModel(state) {
  if (!BENCH_SET.has(state.phase)) return null;
  const r = solveCircuit(rawOf(state));
  return {
    locked: false,
    switchClosed: state.switchClosed === true,
    wires: state.wires.map((w) => ({ ...w })),
    status: r.status,
    lamps: {
      L1: { brightness: r.lamps.L1.brightness, bypassed: r.lamps.L1.bypassed },
      L2: { brightness: r.lamps.L2.brightness, bypassed: r.lamps.L2.bypassed },
    },
    ammeter: { state: r.ammeter.state, text: fmt(r.ammeter.reading, 'A') },
    voltmeter: { state: r.voltmeter.state, text: fmt(r.voltmeter.reading, 'V') },
  };
}

export function statusModel(state) {
  if (!BENCH_SET.has(state.phase)) return null;
  const r = solveCircuit(rawOf(state));
  if (r.status === 'source-short') return { kind: 'warning', icon: '!', text: TEXT.status.short };
  const stage = STAGE[state.phase];
  if (state.phase.endsWith('-build')) {
    const gate = structureGate(rawOf(state), stage);
    return { kind: gate.ready ? 'success' : 'neutral', icon: gate.ready ? '✓' : '○', text: gate.ready ? TEXT.status.open : TEXT.status.build };
  }
  const gate = measurementGate(rawOf(state), stage);
  if (state.switchClosed !== true) return { kind: 'progress', icon: '○', text: TEXT.status.open };
  return gate.ready
    ? { kind: 'success', icon: '✓', text: TEXT.status.ready }
    : { kind: 'warning', icon: '!', text: TEXT.status.meter };
}

export function dataModel(state) {
  if (!BENCH_SET.has(state.phase)) return null;
  return {
    conditions: [
      { label: '電池', value: '6 V' },
      { label: '燈泡', value: '兩顆規格相同，每顆 6 Ω' },
      { label: '開關', value: state.switchClosed ? '閉合' : '斷開', state: state.switchClosed ? 'changed' : 'normal' },
      { label: '目前導線', value: `${state.wires.length} 條` },
    ],
  };
}

function recordItem(state, trialId) {
  const r = observationFor(state, trialId);
  if (!r) return null;
  const rows = [
    { label: '電池送出的電流', value: fmt(r.batteryCurrent, 'A') },
    { label: '電流表', value: fmt(r.ammeter.reading, 'A') },
  ];
  if (r.voltmeter.reading !== null) rows.push({ label: '電壓表', value: fmt(r.voltmeter.reading, 'V') });
  rows.push({ label: '燈泡 1', value: lampWord(r.lamps.L1.brightness) });
  if (r.lamps.L2.inCircuit || r.lamps.L2.active) rows.push({ label: '燈泡 2', value: lampWord(r.lamps.L2.brightness) });
  return { id: trialId, title: LABEL[trialId], rows };
}

export function evidenceModel(state) {
  if (state.phase === 'welcome' || state.phase === 'mission') return null;
  const items = ['baseline','trial1','trial2-total','trial2-L1','trial2-L2'].map((id) => recordItem(state, id)).filter(Boolean);
  return items.length ? { items } : null;
}

function qModel(def, status) {
  return {
    id: def.id,
    text: def.text,
    options: def.options.map(([value, label]) => ({ value, label })),
    selectedValue: status[def.id]?.answer ?? null,
    feedback: status[def.id]?.answer === null
      ? null
      : { kind: status[def.id].correct ? 'success' : 'nudge', text: status[def.id].correct ? def.correct : def.nudge },
  };
}

export function compareKeyFor(state) {
  return state.phase === 'compare1' ? 'c1' : state.phase === 'compare2' ? 'c2' : null;
}
export function compareTitleFor(state) {
  const k = compareKeyFor(state);
  return k ? TEXT.compareTitle[k] : '';
}
export function compareHeadsFor(state) {
  const k = compareKeyFor(state);
  return k ? TEXT.compareHeads[k] : TEXT.compareHeads.c1;
}

export function compareModel(state) {
  const k = compareKeyFor(state);
  if (!k) return null;
  const base = observationFor(state, 'baseline');
  if (!base) return null;
  const status = compareStatus(state)[k];
  if (k === 'c1') {
    const one = observationFor(state, 'trial1');
    if (!one) return null;
    return {
      independentVariable: { label: '燈泡數量與接法', from: '一顆燈泡', to: '兩顆燈泡、只有一條路' },
      controlledVariables: [{ label: '電池', value: '同一顆 6 V 電池' }, { label: '燈泡規格', value: '相同' }],
      observedResponse: [
        { label: '電池送出的電流', first: fmt(base.batteryCurrent, 'A'), second: fmt(one.batteryCurrent, 'A') },
        { label: '燈泡 1 的電壓', first: fmt(base.lamps.L1.voltage, 'V'), second: fmt(one.lamps.L1.voltage, 'V') },
        { label: '燈泡亮度', first: lampWord(base.lamps.L1.brightness), second: lampWord(one.lamps.L1.brightness) },
      ],
      procedureNote: '這次同時改變了燈泡數量和接法，所以只能說明「這一種接法」的結果。',
      questions: COMPARE_TEXT.c1.map((q) => qModel(q, status)),
    };
  }
  const total = observationFor(state, 'trial2-total');
  const l1 = observationFor(state, 'trial2-L1');
  const l2 = observationFor(state, 'trial2-L2');
  if (!total || !l1 || !l2) return null;
  return {
    independentVariable: { label: '燈泡數量與接法', from: '一顆燈泡', to: '兩顆燈泡、各自有路' },
    controlledVariables: [{ label: '電池', value: '同一顆 6 V 電池' }, { label: '燈泡規格', value: '相同' }],
    observedResponse: [
      { label: '電池送出的電流', first: fmt(base.batteryCurrent, 'A'), second: fmt(total.batteryCurrent, 'A') },
      { label: '燈泡 1 的電壓', first: fmt(base.lamps.L1.voltage, 'V'), second: fmt(total.lamps.L1.voltage, 'V') },
      { label: '燈泡亮度', first: lampWord(base.lamps.L1.brightness), second: lampWord(total.lamps.L1.brightness) },
    ],
    procedureNote: `另外量到：燈泡 1 那一路 ${fmt(l1.ammeter.reading, 'A')}；燈泡 2 那一路 ${fmt(l2.ammeter.reading, 'A')}。`,
    questions: COMPARE_TEXT.c2.map((q) => qModel(q, status)),
  };
}

export function inferenceModel(state) {
  if (state.phase !== 'inference') return null;
  const b = observationFor(state, 'baseline');
  const one = observationFor(state, 'trial1');
  const two = observationFor(state, 'trial2-total');
  if (!b || !one || !two) return null;
  return {
    heading: TEXT.inferenceTitle,
    lines: [
      `基準一顆燈泡：${fmt(b.batteryCurrent, 'A')}。`,
      `多一顆燈泡、但只有一條路：${fmt(one.batteryCurrent, 'A')}，比基準小。`,
      `多一顆燈泡、而且兩顆各自有路：${fmt(two.batteryCurrent, 'A')}，比基準大。`,
      `只比較兩顆燈泡（燈泡數量相同、只改接法）：只有一條路 ${fmt(one.batteryCurrent, 'A')}，各自有路 ${fmt(two.batteryCurrent, 'A')}。`,
      '所以「多接一顆燈泡，總電流一定變小」不成立；燈泡數量相同時，只改接法就會改變電流。',
    ],
  };
}

export function conceptModel(state) {
  if (state.phase !== 'concept') return null;
  const e = conceptEvidence(state);
  if (!e) return null;
  return {
    heading: FORMAL_TEXT.title,
    cards: [
      {
        id: 'series',
        title: FORMAL_TEXT.series.title,
        body: [FORMAL_TEXT.series.body],
        evidence: [
          { label: '你的量測', text: `兩顆燈泡時總電流 ${e.series.totalCurrent.toFixed(1)} A，燈泡 1 電壓 ${e.series.L1Voltage.toFixed(1)} V。` },
        ],
      },
      {
        id: 'parallel',
        title: FORMAL_TEXT.parallel.title,
        body: [FORMAL_TEXT.parallel.body],
        evidence: [
          { label: '你的量測', text: `整體 ${e.parallel.totalCurrent.toFixed(1)} A；燈泡 1 那一路 ${e.parallel.L1Current.toFixed(1)} A；燈泡 2 那一路 ${e.parallel.L2Current.toFixed(1)} A。` },
        ],
      },
      {
        id: 'current',
        title: FORMAL_TEXT.current.title,
        body: [FORMAL_TEXT.current.body],
        evidence: [
          { label: '你的量測', text: `${e.parallel.L1Current.toFixed(1)} A + ${e.parallel.L2Current.toFixed(1)} A = ${e.parallel.totalCurrent.toFixed(1)} A。` },
        ],
      },
    ],
    formula: {
      heading: FORMAL_TEXT.formula.heading,
      expression: FORMAL_TEXT.formula.expression,
      lines: [
        { text: `基準：6 V ÷ ${e.baseline.equivalentResistance.toFixed(1)} Ω = ${e.baseline.totalCurrent.toFixed(1)} A` },
        { text: `串聯：等效電阻 ${e.series.equivalentResistance.toFixed(1)} Ω，所以總電流 ${e.series.totalCurrent.toFixed(1)} A` },
        { text: `並聯：等效電阻 ${e.parallel.equivalentResistance.toFixed(1)} Ω，所以總電流 ${e.parallel.totalCurrent.toFixed(1)} A` },
      ],
      note: FORMAL_TEXT.formula.note,
    },
  };
}

export function announcementFor({ result, state, action = null, seq = 0 }) {
  if (!result?.accepted) return null;
  const say = (kind, text) => ({ id: `${kind}-${seq}`, text });
  const written = result.events.find((e) => e.type === 'record-written');
  if (written) return say('record', TEXT.announce.record(LABEL[written.trialId]));
  const to = result.transitions.map((t) => t.to);
  if (to.includes('mission')) return say('mission', TEXT.announce.mission);
  if (to.includes('baseline-build')) return say('baseline', TEXT.announce.baseline);
  if (to.some((p) => p === 'baseline-measure' || p === 'trial1-measure' || p === 'trial2-total')) return say('structure', TEXT.announce.structure);
  if (to.includes('compare1') || to.includes('compare2')) return say('compare', TEXT.announce.compare);
  if (to.includes('inference')) return say('inference', TEXT.announce.inference);
  if (to.includes('concept')) return say('concept', TEXT.announce.concept);
  if (action?.type === 'ANSWER_COMPARE') {
    const q = compareModel(state)?.questions.find((x) => x.id === action.question);
    if (q?.feedback) return say('compare-answer', q.feedback.text);
  }
  return null;
}
