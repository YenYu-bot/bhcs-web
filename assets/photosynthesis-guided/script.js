// Teaching script and view-models for Science Lab 2.0 Pilot #5 B3 (photosynthesis factor).
// Every learner-facing word lives here. This module owns no DOM, persistence, analytics, timers or input handling.
// Before the concept phase it exposes only conditions, observations and learner comparison prompts. The formal term
// 「限制因子」, factor minima and the simplified model formula are reachable only through conceptModel().
import { PHASE_TRIAL, compareStatus, conceptEvidence, observationFor, trialRecorded } from './engine.js';
import { trialCondition } from './model.js';

const deepFreeze = (o) => {
  for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v);
  return Object.freeze(o);
};

export const COACH_NAME = '余老師';
export const STATION_TITLE = '光合作用：光越強一定越快嗎？';

export const STEPS = deepFreeze([
  { id: 'mission', number: '01', label: '接任務' },
  { id: 'experiment', number: '02', label: '動手做' },
  { id: 'findings', number: '03', label: '整理發現' },
  { id: 'notebook', number: '04', label: '研究手冊' },
  { id: 'challenge', number: '05', label: '挑戰題' },
]);

export const TEXT = deepFreeze({
  stepNavLabel: '實驗進度',
  benchLabel: '水草光合作用實驗桌',
  dataTitle: '現在的條件',
  evidenceTitle: '我的紀錄',
  prototypeNote: '這是導引版原型，尚未公開。進度不會儲存，重新整理頁面會回到開頭。',
  welcome: {
    title: '把光變強，水草的產氧速度就一定會一直增加嗎？',
    sub: '先不要猜。你會做兩組只改光照的實驗，再把結果放在一起比較。',
  },
  mission: {
    title: '每一組都只改光照，其他條件先固定。',
    sub: '先看同一段觀察時間裡的相對產氧，再把兩次結果放在一起。本站用相對速率比較條件，不把氣泡當成精密氧氣體積。',
  },
  trial2Setup: {
    title: '再做一組，但先換成 CO₂ 較少的條件。',
    sub: '第二組比較時仍然只改光照；水溫保持 25°C。',
  },
  inference: {
    title: '同樣把光變強，兩組結果卻不一樣。',
    sub: '光不是唯一會影響速率的條件。當另一個條件更不足時，繼續增加光照可能幾乎沒有幫助。',
  },
  cta: {
    start: '開始',
    begin: '開始第一組',
    observe: '開始觀察',
    observeAgain: '開始第二次觀察',
    toHigher1: '只把光照調到 60%',
    toCompare1: '比較第一組',
    toTrial2Setup: '換一組條件',
    beginTrial2: '開始第二組',
    toHigher2: '只把光照調到 100%',
    toCompare2: '比較第二組',
    toInference: '整理兩組發現',
    toConcept: '看看這個現象叫什麼',
  },
  coach: {
    'trial1-low-light': { main: '先在弱光下觀察。', sub: 'CO₂ 和水溫固定，按「開始觀察」記錄這一次的相對產氧。' },
    'trial1-low-light-done': { main: '第一筆已經記下來了。', sub: '下一次其他條件都不動，只把光照從 15% 調到 60%。' },
    'trial1-higher-light': { main: '只把光照調到 60%。', sub: '調好之後，再觀察同一段時間。' },
    'trial1-higher-light-ready': { main: '光照已調到 60%。', sub: '其他條件沒有改，可以開始第二次觀察。' },
    'trial1-higher-light-done': { main: '第一組兩次觀察都完成了。', sub: '把 15% 與 60% 的結果放在一起比較。' },
    compare1: { main: '先只看第一組證據。', sub: '注意：這兩次只有光照不同。' },
    'compare1-done': { main: '你已經用第一組資料做出有範圍的結論。', sub: '接著換成 CO₂ 較少的條件，再做一次只改光照的比較。' },
    'trial2-setup': { main: '第二組先換成 CO₂ 較少。', sub: '比較時仍然只改光照，水溫保持相同。' },
    'trial2-medium-light': { main: '先在 60% 光照下觀察。', sub: 'CO₂ 較少、水溫固定，先記錄這一次。' },
    'trial2-medium-light-done': { main: '第三筆已經記下來了。', sub: '下一次其他條件都不動，只把光照從 60% 提高到 100%。' },
    'trial2-high-light': { main: '只把光照調到 100%。', sub: '調好之後，再觀察同一段時間。' },
    'trial2-high-light-ready': { main: '光照已調到 100%。', sub: '其他條件沒有改，可以開始第二次觀察。' },
    'trial2-high-light-done': { main: '第二組兩次觀察都完成了。', sub: '把 60% 與 100% 的結果放在一起比較。' },
    compare2: { main: '再看第二組證據。', sub: '同樣只改光照，但這次結果和第一組不同。' },
    'compare2-done': { main: '你已經抓到兩組證據的差異。', sub: '現在把兩組結果放在一起整理。' },
    inference: { main: '你已經找到重點了。', sub: '先用自己的兩組觀察想一想：為什麼增加光照有時有效、有時幾乎沒用？' },
    concept: { main: '這個現象有一個正式名稱。', sub: '現在才把你的兩組證據，和「限制因子」這個概念接起來。' },
  },
  data: { light: '光照', co2: 'CO₂', temperature: '水溫', changed: '本次只改', changedValue: '光照' },
  status: { waiting: '尚未觀察', ready60: '光照已調到 60%，可以觀察', ready100: '光照已調到 100%，可以觀察' },
  compareTitle: { c1: '比較第一組：15% → 60%', c2: '比較第二組：60% → 100%' },
  compareHeads: {
    c1: { item: '證據', first: '第一次', second: '第二次', changed: '改變', same: '相同' },
    c2: { item: '證據', first: '第三次', second: '第四次', changed: '改變', same: '相同' },
  },
  announce: {
    mission: '任務說明。',
    trial1: '第一組實驗：先觀察弱光。',
    trial2Setup: '準備第二組：CO₂ 較少，仍然只改光照。',
    trial2: '第二組實驗開始。',
    compare: '比較兩次觀察結果。',
    inference: '整理兩組發現。',
  },
});

const COMPARE_TEXT = deepFreeze({
  c1: [
    {
      id: 'rateChange', text: '光照變強後，這一組的相對產氧怎麼變？',
      options: [['increase', '增加'], ['same', '幾乎不變'], ['decrease', '降低']],
      correct: '對，這一組從弱光到中光，相對產氧明顯增加。',
      wrong: '回到表格，只比較兩次的相對產氧數值。',
    },
    {
      id: 'claim', text: '這組資料能支持哪一句？',
      options: [
        ['context-only', '在這組條件下，把光變強會提高相對產氧。'],
        ['always-more-light', '任何情況下，光越強速率一定越高。'],
        ['no-relation', '光照和速率完全無關。'],
      ],
      correct: '對，一組控制實驗能支持「在這組條件下」的結論，不能直接推成所有情況。',
      wrong: '注意證據只來自這一組固定 CO₂ 與水溫的比較，不足以證明「任何情況都一定」。',
    },
  ],
  c2: [
    {
      id: 'rateChange', text: '這次把光再變強，速率有明顯增加嗎？',
      options: [['same', '沒有，幾乎不變'], ['increase', '有，明顯增加'], ['decrease', '明顯降低']],
      correct: '對，60% 與 100% 的相對產氧幾乎相同。',
      wrong: '直接比較第三次和第四次的相對產氧數值。',
    },
    {
      id: 'reason', text: '同樣是把光變強，為什麼第一組和第二組的結果不同？',
      options: [
        ['other-condition-short', '因為第二組還有另一個條件比較不足。'],
        ['light-no-effect', '因為光照在第二組完全沒有作用。'],
        ['random', '因為水草每次都隨機決定速率。'],
      ],
      correct: '對，第二組顯示：光照不是唯一會影響速率的條件。',
      wrong: '第二組仍然保持控制比較；差異不是「隨機」，也不能說光照完全沒有作用。',
    },
  ],
});

export const CONCEPT_TEXT = deepFreeze({
  title: '整理：什麼是「限制因子」？',
  status: '這一階段的觀察與整理已完成。',
  limitName: { light: '光照', co2: 'CO₂', temperature: '溫度', tie: '不只一項' },
  definition: [
    '在多個必要條件中，當某一項最不足、最先把反應速度卡住時，我們把它叫做「限制因子」。',
    '所以增加某一個條件，不代表速率一定會一直增加；要看目前真正不足的是哪一項。',
  ],
  boundary: [
    '本站的「相對速率」只用來比較這些模擬條件，水草氣泡只是產氧快慢的相對線索，不是精密氧氣體積。',
    '真實植物還會受水分、葉面積、光質、植物種類、呼吸作用、養分與適應時間等影響。',
  ],
  formula: {
    heading: '本站概念模型',
    expression: '相對速率 = 20 × 三項因子中的最低值',
    lines: [
      { text: '三項條件：光照、CO₂、溫度。' },
      { text: '模型把最低的一項視為目前最先卡住速率的條件。', emphasis: true },
      { text: '這是用來理解概念的簡化模型，不是真實植物的精密預測公式。' },
    ],
    note: '不要求背公式；重點是用控制實驗與觀察證據判斷「增加某條件是否還有效」。',
  },
});

const BENCH_PHASES = new Set(['trial1-low-light', 'trial1-higher-light', 'trial2-medium-light', 'trial2-high-light']);
const COMPARE_OF_PHASE = { compare1: 'c1', compare2: 'c2' };
const PRE_CONCEPT = new Set(['welcome', 'mission', 'trial1-low-light', 'trial1-higher-light', 'compare1', 'trial2-setup', 'trial2-medium-light', 'trial2-high-light', 'compare2', 'inference']);
export const isPreConcept = (state) => PRE_CONCEPT.has(state.phase);

const rate = (o) => o ? o.rate.toFixed(1) : '—';
const pct = (v) => `${v}%`;
const ppm = (v) => `${v} ppm`;
const temp = (v) => `${v}°C`;
const recordLabel = {
  't1-low-light': '第一組・第一次',
  't1-higher-light': '第一組・第二次',
  't2-medium-light': '第二組・第一次',
  't2-high-light': '第二組・第二次',
};

export function screenFor(state) {
  const p = state.phase;
  if (p === 'welcome' || p === 'mission' || p === 'trial2-setup' || p === 'inference') {
    return { id: 'welcome', arrival: ['#pfg-welcome-title'], focusTargets: ['#pfg-cta', '#pfg-welcome-title'] };
  }
  if (BENCH_PHASES.has(p)) {
    const arrival = p === 'trial1-higher-light' ? ['[data-light-value="60"]'] :
      p === 'trial2-high-light' ? ['[data-light-value="100"]'] : ['#pfg-cta'];
    return { id: 'bench', arrival, focusTargets: ['[data-light-value]:not(:disabled)', '#pfg-cta', '#pfg-heading'] };
  }
  if (COMPARE_OF_PHASE[p]) return { id: 'compare', arrival: ['#pfg-compare-title'], focusTargets: ['[data-compare]', '#pfg-cta', '#pfg-compare-title'] };
  if (p === 'concept') return { id: 'concept', arrival: ['#pfg-concept-title'], focusTargets: ['#pfg-concept-title'] };
  throw new RangeError(`script: phase ${p} is not part of B3`);
}

export const stepFor = (state) => (
  state.phase === 'welcome' || state.phase === 'mission' ? 'mission' :
    state.phase === 'inference' || state.phase === 'concept' ? 'findings' : 'experiment'
);
export const stepNavModel = (state) => ({ steps: STEPS, currentStep: stepFor(state) });
export const stationTitleFor = () => STATION_TITLE;

export function welcomeModel(state) {
  if (state.phase === 'mission') return TEXT.mission;
  if (state.phase === 'trial2-setup') return TEXT.trial2Setup;
  if (state.phase === 'inference') return TEXT.inference;
  return TEXT.welcome;
}

const trialIdFor = (state) => PHASE_TRIAL[state.phase] ?? null;
const matchesTarget = (state) => {
  const id = trialIdFor(state);
  if (!id || !state.conditions) return false;
  const t = trialCondition(id);
  return state.conditions.light === t.light && state.conditions.co2 === t.co2 && state.conditions.temperature === t.temperature;
};

export function ctaFor(state) {
  const p = state.phase, c = TEXT.cta;
  if (p === 'welcome') return { label: c.start, action: { type: 'START' }, enabled: true };
  if (p === 'mission') return { label: c.begin, action: { type: 'BEGIN' }, enabled: true };
  if (p === 'trial2-setup') return { label: c.beginTrial2, action: { type: 'CONTINUE' }, enabled: true };
  if (BENCH_PHASES.has(p)) {
    const id = trialIdFor(state), done = trialRecorded(state, id);
    if (!done) return {
      label: p === 'trial1-higher-light' || p === 'trial2-high-light' ? c.observeAgain : c.observe,
      action: { type: 'OBSERVE' }, enabled: matchesTarget(state),
    };
    const label = p === 'trial1-low-light' ? c.toHigher1 :
      p === 'trial1-higher-light' ? c.toCompare1 :
      p === 'trial2-medium-light' ? c.toHigher2 : c.toCompare2;
    return { label, action: { type: 'CONTINUE' }, enabled: true };
  }
  if (p === 'compare1') return { label: c.toTrial2Setup, action: { type: 'CONTINUE' }, enabled: compareStatus(state).c1.allCorrect };
  if (p === 'compare2') return { label: c.toInference, action: { type: 'CONTINUE' }, enabled: compareStatus(state).c2.allCorrect };
  if (p === 'inference') return { label: c.toConcept, action: { type: 'CONTINUE' }, enabled: true };
  return null;
}

export function coachModel(state) {
  const p = state.phase, status = compareStatus(state);
  let key = null;
  if (BENCH_PHASES.has(p)) {
    const id = trialIdFor(state);
    if (trialRecorded(state, id)) key = `${p}-done`;
    else if ((p === 'trial1-higher-light' || p === 'trial2-high-light') && matchesTarget(state)) key = `${p}-ready`;
    else key = p;
  } else if (p === 'compare1') key = status.c1.allCorrect ? 'compare1-done' : 'compare1';
  else if (p === 'compare2') key = status.c2.allCorrect ? 'compare2-done' : 'compare2';
  else if (p === 'trial2-setup' || p === 'inference' || p === 'concept') key = p;
  const m = key ? TEXT.coach[key] : null;
  return m ? { name: COACH_NAME, main: m.main, sub: m.sub } : null;
}

export function statusModel(state) {
  if (BENCH_PHASES.has(state.phase)) {
    const id = trialIdFor(state), o = observationFor(state, id);
    if (o) return { kind: 'success', icon: '✓', text: `已記錄相對產氧速度 ${rate(o)}` };
    if (state.phase === 'trial1-higher-light' && matchesTarget(state)) return { kind: 'progress', icon: '○', text: TEXT.status.ready60 };
    if (state.phase === 'trial2-high-light' && matchesTarget(state)) return { kind: 'progress', icon: '○', text: TEXT.status.ready100 };
    return { kind: 'neutral', icon: '○', text: TEXT.status.waiting };
  }
  if (state.phase === 'concept') return { kind: 'success', icon: '✓', text: CONCEPT_TEXT.status };
  return null;
}

export function dataModel(state) {
  if (!BENCH_PHASES.has(state.phase) || !state.conditions) return null;
  const d = TEXT.data, c = state.conditions;
  return { conditions: [
    { label: d.light, value: pct(c.light), state: state.phase === 'trial1-higher-light' || state.phase === 'trial2-high-light' ? 'changed' : 'normal' },
    { label: d.co2, value: ppm(c.co2), state: 'locked' },
    { label: d.temperature, value: temp(c.temperature), state: 'locked' },
    { label: d.changed, value: d.changedValue, state: 'changed' },
  ] };
}

export function evidenceModel(state) {
  if (!state.records.length) return null;
  const items = state.records.map((record) => {
    const o = observationFor(state, record.trialId);
    return {
      id: record.trialId,
      title: recordLabel[record.trialId],
      rows: [
        { label: '光照', value: pct(o.light) },
        { label: 'CO₂', value: ppm(o.co2) },
        { label: '水溫', value: temp(o.temperature) },
        { label: '相對產氧', value: rate(o) },
      ],
    };
  });
  return { items };
}

export function canSetLight(state, value) {
  if (state.phase === 'trial1-higher-light') return !trialRecorded(state, 't1-higher-light') && value === 60;
  if (state.phase === 'trial2-high-light') return !trialRecorded(state, 't2-high-light') && value === 100;
  return false;
}

export function benchModel(state) {
  if (!BENCH_PHASES.has(state.phase) || !state.conditions) return null;
  const id = trialIdFor(state), o = observationFor(state, id);
  const allowedLights = state.phase === 'trial1-higher-light' && !o ? [60] :
    state.phase === 'trial2-high-light' && !o ? [100] : [];
  return {
    light: state.conditions.light,
    co2: state.conditions.co2,
    temperature: state.conditions.temperature,
    locked: Boolean(o) || allowedLights.length === 0,
    allowedLights,
    observation: o ? { rate: o.rate } : null,
  };
}

export const compareKeyFor = (state) => COMPARE_OF_PHASE[state.phase] ?? null;
export const compareTitleFor = (state) => TEXT.compareTitle[compareKeyFor(state)] ?? '';
export const compareHeadsFor = (state) => TEXT.compareHeads[compareKeyFor(state)] ?? TEXT.compareHeads.c1;

function questionModels(defs, status) {
  return defs.map((def) => {
    const q = status[def.id];
    return {
      id: def.id,
      text: def.text,
      options: def.options.map(([value, label]) => ({ value, label })),
      selectedValue: q.answer,
      disabled: q.correct,
      feedback: q.answer === null ? undefined : q.correct ? { kind: 'success', text: def.correct } : { kind: 'hint', text: def.wrong },
    };
  });
}

export function compareModel(state) {
  const key = compareKeyFor(state);
  if (!key) return null;
  const ids = key === 'c1' ? ['t1-low-light', 't1-higher-light'] : ['t2-medium-light', 't2-high-light'];
  if (!ids.every((id) => trialRecorded(state, id))) return null;
  const [a, b] = ids.map((id) => observationFor(state, id));
  return {
    independentVariable: { label: '光照', from: pct(a.light), to: pct(b.light) },
    controlledVariables: [
      { label: 'CO₂', value: ppm(a.co2) },
      { label: '水溫', value: temp(a.temperature) },
    ],
    observedResponse: [{ label: '相對產氧', first: rate(a), second: rate(b) }],
    procedureNote: '這兩次只有光照不同，可以直接比較。',
    questions: questionModels(COMPARE_TEXT[key], compareStatus(state)[key]),
  };
}

export function conceptModel(state) {
  const e = conceptEvidence(state);
  if (!e) return null;
  const o = e.observations, T = CONCEPT_TEXT;
  const firstA = o['t1-low-light'], firstB = o['t1-higher-light'], secondA = o['t2-medium-light'], secondB = o['t2-high-light'];
  return {
    heading: T.title,
    cards: [
      {
        id: 'limiting-factor',
        title: '限制因子',
        body: [...T.definition],
        evidence: [
          { label: '第一組', text: `光照 ${pct(firstA.light)} → ${pct(firstB.light)}，相對產氧 ${rate(firstA)} → ${rate(firstB)}；模型中提高光照後，最低條件是${T.limitName[e.trial1LimitAfterIncrease]}。` },
          { label: '第二組', text: `光照 ${pct(secondA.light)} → ${pct(secondB.light)}，相對產氧 ${rate(secondA)} → ${rate(secondB)}；模型中最低條件是${T.limitName[e.trial2LimitAfterIncrease]}。` },
        ],
      },
      {
        id: 'model-boundary',
        title: '這個模型能告訴你什麼、不能告訴你什麼',
        body: [...T.boundary],
        evidence: [],
      },
    ],
    formula: { ...T.formula, lines: T.formula.lines.map((line) => ({ ...line })) },
  };
}

export function announcementFor({ result, state, action = null, seq = 0 }) {
  if (!result?.accepted) return null;
  const say = (kind, text) => ({ id: `${kind}-${seq}`, text });
  const written = result.events.find((event) => event.type === 'record-written');
  if (written) {
    const o = observationFor(state, written.trialId);
    return say('record', `已記錄：光照 ${pct(o.light)}，相對產氧 ${rate(o)}。`);
  }
  if (action?.type === 'SET_LIGHT') return say('light', `光照已設為 ${pct(state.conditions.light)}。`);
  if (action?.type === 'ANSWER_COMPARE') {
    const q = compareModel(state)?.questions.find((item) => item.id === action.question);
    if (!q?.feedback) return null;
    const done = compareStatus(state)[action.compare]?.allCorrect ? ' 兩題都完成了。' : '';
    return say('compare-answer', `${q.feedback.text}${done}`);
  }
  const to = result.transitions.map((t) => t.to);
  if (to.includes('mission')) return say('mission', TEXT.announce.mission);
  if (to.includes('trial1-low-light')) return say('trial1', TEXT.announce.trial1);
  if (to.includes('compare1') || to.includes('compare2')) return say('compare', TEXT.announce.compare);
  if (to.includes('trial2-setup')) return say('trial2-setup', TEXT.announce.trial2Setup);
  if (to.includes('trial2-medium-light')) return say('trial2', TEXT.announce.trial2);
  if (to.includes('inference')) return say('inference', TEXT.announce.inference);
  if (to.includes('concept')) return say('concept', '概念整理：限制因子。');
  return null;
}
