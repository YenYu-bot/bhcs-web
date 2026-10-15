// Teaching script and view-models for the guided unknown-liquid lab (Pilot #4, B3).
// Every word a learner reads lives here, and every card is described as a plain object shaped like the shared component
// contracts. No DOM, no state changes, no storage, no analytics, no input handling.
//
// Until the concept screen the learner meets observations only: which strip, which cup, what colour it showed. The
// words for the three classes of liquid and for pH live in CONCEPT_TEXT and are only reachable through conceptModel(),
// which returns null before the concept phase. Every sample letter on the concept screen is found from the records and
// the layout, never written into this file.
//
// B3 ends on the concept screen: there is no notebook, challenge or finish wording yet.
import { SAMPLE_IDS, samplePh10 } from './model.js';
import { TRIAL_INDICATOR, observationFor, observationsOf, trialComplete, compareStatus } from './engine.js';

const deepFreeze = (o) => {
  for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v);
  return Object.freeze(o);
};

export const COACH_NAME = '余老師';
export const STATION_TITLE = '未知液體辨識';

export const STEPS = deepFreeze([
  { id: 'mission', number: '01', label: '接任務' },
  { id: 'experiment', number: '02', label: '動手做' },
  { id: 'findings', number: '03', label: '整理發現' },
  { id: 'notebook', number: '04', label: '研究手冊' },
  { id: 'challenge', number: '05', label: '挑戰題' },
]);

/** Words for every screen before the concept. Nothing here names a class of liquid or pH. */
export const TEXT = deepFreeze({
  stepNavLabel: '實驗進度',
  benchLabel: '試管實驗桌',
  dataTitle: '現在的條件',
  evidenceTitle: '我的紀錄',
  compareTitle: { c1: '比較第一輪的結果', c2: '把兩輪結果放在一起' },
  prototypeNote: '這是導引版原型，尚未公開。進度不會儲存，重新整理頁面會回到開頭。',
  welcome: {
    title: '三杯看起來一樣的透明液體，你能只靠實驗把它們分成不同類型嗎？',
    sub: '接下來你會親手測試，自己找出答案。',
  },
  mission: {
    title: '先不要猜它們是什麼。',
    sub: '用同一種試紙測三杯，留下每一次看到的結果，再判斷目前的證據夠不夠。這是電腦模擬；真實實驗中，未知液體不可以品嚐，也不要直接用手碰。',
  },
  cta: { start: '開始', begin: '開始第一輪', toCompare1: '比較這一輪', toTrial2: '換另一種試紙', toCompare2: '比較兩輪結果', toConcept: '看看這代表什麼' },
  coach: {
    trial1: { main: '先用藍色石蕊測 A、B、C。每杯都換一張新試紙，把三杯都測完。', sub: '把試紙拖到試管上，或按試管下方的按鈕。' },
    'trial1-done': { main: '三杯都測完了。', sub: '按「比較這一輪」，把三杯的結果放在一起看。' },
    compare1: { main: '把三杯的結果放在一起看。', sub: '回答下面兩個問題。' },
    'compare1-done': { main: '你從自己的紀錄看出了這一輪證據的限制。', sub: '接下來換另一種試紙，再測一次。' },
    trial2: { main: '現在換另一種試紙，再測同樣三杯。第一輪的結果會保留，方便一起比較。', sub: '這一輪用紅色石蕊。' },
    'trial2-done': { main: '三杯都用紅色石蕊測完了。', sub: '按「比較兩輪結果」。' },
    compare2: { main: '把兩種試紙的結果合起來看。', sub: '每杯都有兩個結果，把它們當成一組。' },
    'compare2-done': { main: '你從自己的紀錄把三杯分開了。', sub: '下一步，看看這些反應模式有什麼正式的名稱。' },
  },
  indicator: { 'blue-litmus': '藍色石蕊', 'red-litmus': '紅色石蕊' },
  startColor: { blue: '藍色', red: '紅色' },
  result: { 'turns-red': '變紅色', 'stays-blue': '維持藍色', 'turns-blue': '變藍色', 'stays-red': '維持紅色' },
  data: { strip: '試紙', tested: '已測', latest: '最近結果', none: '還沒有' },
  status: { none: '還沒有測任何一杯', done: '三杯都測完了，可以比較結果' },
  compareHeads: {
    c1: { item: '液體', first: '測試前', second: '測試後', changed: '改變', same: '不變' },
    c2: { item: '液體', first: '藍色石蕊', second: '紅色石蕊', changed: '改變', same: '不變' },
  },
  announce: {
    trialComplete: '三杯都測完了，可以比較結果。',
    trial1: '已進入第一輪：藍色石蕊。',
    trial2: '已進入第二輪：紅色石蕊。',
    compare: '比較結果。',
    compareDone: '兩題都完成了。',
  },
});

const COMPARE_TEXT = deepFreeze({
  c1: [
    {
      id: 'patternCount', text: '三杯的結果可以分成幾種不同反應模式？',
      options: [['one', '一種'], ['two', '兩種'], ['three', '三種']],
      correct: '對，三杯只出現了兩種不同的結果。',
      wrong: '把三杯的實際結果排在一起，數一數出現了幾種不同結果。',
    },
    {
      id: 'evidenceSufficiency', text: '只看這一次試紙結果，能確定結果相同的兩杯屬於同一類嗎？',
      options: [['same-class', '可以確定屬於同一類'], ['need-more-evidence', '還不能，需要更多證據'], ['different-class', '可以確定它們不同類']],
      correct: '對，結果相同只代表這張試紙還沒有把它們分開。',
      wrong: '兩杯得到相同結果，只代表這張試紙目前沒有把它們分開。',
    },
  ],
  c2: [
    {
      id: 'distinguishability', text: '把兩種試紙結果一起看，三杯的反應模式能全部分開嗎？',
      options: [['all-distinct', '三杯都能分開'], ['two-still-same', '有兩杯仍相同'], ['all-same', '三杯全部相同']],
      correct: '對，三杯的兩個結果組合都不一樣。',
      wrong: '把每杯的兩個結果當成一組，再比較 A、B、C 三組。',
    },
    {
      id: 'unchangedSample', text: '哪一杯在兩次測試中，試紙都維持原來的顏色？',
      options: SAMPLE_IDS.map((id) => [id, `液體 ${id}`]),
      correct: '對，這一杯兩張試紙都維持原來的顏色。',
      wrong: '找一杯在兩輪中都沒有讓試紙換成另一種顏色。',
    },
  ],
});

/** Words for the concept screen only. The formal names and pH appear nowhere else. */
export const CONCEPT_TEXT = deepFreeze({
  title: '用你的紀錄來命名',
  revealPh: '看看 pH',
  coach: {
    naming: { main: '這三種反應模式，在化學裡有正式的名稱。', sub: '每張卡片下方，都是你自己的紀錄。' },
    ph: { main: '再看看 pH：它和這三類怎麼對應？', sub: '分類用的界線，和石蕊實際的變色範圍是兩件事。' },
  },
  kinds: {
    acidic: { title: '酸性', body: '具有這種反應模式的液體，稱為酸性。' },
    neutral: { title: '中性', body: '具有這種反應模式的液體，稱為中性。' },
    basic: { title: '鹼性', body: '具有這種反應模式的液體，稱為鹼性。' },
  },
  samples: {
    title: '關於這些樣品',
    body: [
      '在本站選用的明確代表樣品中，這三種反應模式可以用正式名稱整理。',
      '這裡選的是反應很明確的代表樣品。真實石蕊有一段逐漸變色的範圍，不是在某一個數值瞬間換色。',
    ],
  },
  ph: {
    title: 'pH 與分類（25°C）',
    body: [
      '在 25°C 的教學分類中：pH 小於 7 為酸性，pH 等於 7 為中性，pH 大於 7 為鹼性。',
      'pH 7 是本站在 25°C 下用來整理酸性、中性、鹼性的分類界線；這不代表真實石蕊只在 pH 7 才變色。',
    ],
  },
  indicator: {
    title: '指示劑不是 pH 計',
    body: [
      '不同指示劑有不同的變色範圍。看到顏色只能提供有限的範圍資訊，不能直接當成精密 pH 讀值。',
      '例如，酚酞在部分弱鹼性的範圍仍可能保持無色；廣用指示劑則用多種顏色對應不同的 pH 範圍。',
    ],
  },
  announce: { naming: '概念整理：三種反應模式的正式名稱。', ph: '已顯示 pH。' },
  status: '這一階段的觀察與整理已完成。',
});

const KIND_ORDER = ['acidic', 'neutral', 'basic'];
const BENCH_PHASES = new Set(['trial1', 'trial2']);
const COMPARE_OF_PHASE = { compare1: 'c1', compare2: 'c2' };
const PRE_CONCEPT = new Set(['welcome', 'mission', 'trial1', 'compare1', 'trial2', 'compare2']);
export const isPreConcept = (state) => PRE_CONCEPT.has(state.phase);

const resultWord = (o) => TEXT.result[o.result];
const observed = (o) => `${TEXT.indicator[o.indicatorId]}${resultWord(o)}`;
const activeIndicator = (state) => TRIAL_INDICATOR[state.phase] ?? null;

// ---- screens, steps, buttons ------------------------------------------------------------------------------------------

export function screenFor(state) {
  const p = state.phase;
  if (p === 'welcome' || p === 'mission') return { id: 'welcome', arrival: ['#abg-welcome-title'], focusTargets: ['#abg-cta', '#abg-welcome-title'] };
  if (BENCH_PHASES.has(p)) return { id: 'bench', arrival: ['[data-dip-sample]'], focusTargets: ['[data-dip-sample]', '#abg-cta', '#abg-heading'] };
  if (COMPARE_OF_PHASE[p]) return { id: 'compare', arrival: ['#abg-compare-title'], focusTargets: ['[data-compare]', '#abg-cta', '#abg-compare-title'] };
  if (p === 'concept') return { id: 'concept', arrival: ['#abg-concept-title'], focusTargets: ['#abg-cta', '#abg-concept-title'] };
  throw new RangeError(`script: phase ${p} is not part of this stage`);
}

export const stepFor = (state) => (state.phase === 'welcome' || state.phase === 'mission' ? 'mission' : state.phase === 'concept' ? 'findings' : 'experiment');
export const stepNavModel = (state) => ({ steps: STEPS, currentStep: stepFor(state) });
export const stationTitleFor = () => STATION_TITLE;

export function welcomeModel(state) {
  const m = state.phase === 'mission' ? TEXT.mission : TEXT.welcome;
  return { title: m.title, sub: m.sub };
}

/** The one main button, or null. `action` is the engine action the page dispatches when it is pressed. */
export function ctaFor(state) {
  const c = TEXT.cta, status = () => compareStatus(state);
  switch (state.phase) {
    case 'welcome': return { label: c.start, action: { type: 'START' }, enabled: true };
    case 'mission': return { label: c.begin, action: { type: 'BEGIN' }, enabled: true };
    case 'trial1': return { label: c.toCompare1, action: { type: 'CONTINUE' }, enabled: trialComplete(state, 'blue-litmus') };
    case 'compare1': return { label: c.toTrial2, action: { type: 'CONTINUE' }, enabled: status().c1.allCorrect };
    case 'trial2': return { label: c.toCompare2, action: { type: 'CONTINUE' }, enabled: trialComplete(state, 'red-litmus') };
    case 'compare2': return { label: c.toConcept, action: { type: 'CONTINUE' }, enabled: status().c2.allCorrect };
    case 'concept': return state.conceptPart === 'naming' ? { label: CONCEPT_TEXT.revealPh, action: { type: 'REVEAL_PH' }, enabled: true } : null;
    default: return null;
  }
}

// ---- coach, status, data, evidence ------------------------------------------------------------------------------------

export function coachModel(state) {
  const p = state.phase, s = compareStatus(state);
  let m = null;
  if (p === 'trial1') m = TEXT.coach[trialComplete(state, 'blue-litmus') ? 'trial1-done' : 'trial1'];
  else if (p === 'trial2') m = TEXT.coach[trialComplete(state, 'red-litmus') ? 'trial2-done' : 'trial2'];
  else if (p === 'compare1') m = TEXT.coach[s.c1.allCorrect ? 'compare1-done' : 'compare1'];
  else if (p === 'compare2') m = TEXT.coach[s.c2.allCorrect ? 'compare2-done' : 'compare2'];
  else if (p === 'concept') m = CONCEPT_TEXT.coach[state.conceptPart === 'ph' ? 'ph' : 'naming'];
  if (!m) return null;
  return { name: COACH_NAME, main: m.main, sub: m.sub };
}

/** The records of one trial, in the order they were made. */
const trialObservations = (state, indicatorId) => observationsOf(state).filter((o) => o.indicatorId === indicatorId);

export function statusModel(state) {
  const indicator = activeIndicator(state);
  if (indicator) {
    const seen = trialObservations(state, indicator);
    if (trialComplete(state, indicator)) return { kind: 'success', icon: '✓', text: TEXT.status.done };
    const last = seen.at(-1);
    return last ? { kind: 'progress', icon: '○', text: `液體 ${last.sampleId}：${observed(last)}` } : { kind: 'neutral', icon: '○', text: TEXT.status.none };
  }
  if (state.phase === 'concept' && state.conceptPart === 'ph') return { kind: 'success', icon: '✓', text: CONCEPT_TEXT.status };
  return null;
}

/** "What am I working with right now?" Shown beside the bench only. */
export function dataModel(state) {
  const indicator = activeIndicator(state);
  if (!indicator) return null;
  const seen = trialObservations(state, indicator), last = seen.at(-1), d = TEXT.data;
  return {
    conditions: [
      { label: d.strip, value: `${TEXT.indicator[indicator]}（原本${TEXT.startColor[indicator === 'blue-litmus' ? 'blue' : 'red']}）` },
      { label: d.tested, value: `${seen.length}／${SAMPLE_IDS.length}` },
      { label: d.latest, value: last ? `液體 ${last.sampleId} → ${resultWord(last)}` : d.none },
    ],
  };
}

/** "What did I see?" One item per cup that has a result, one row per strip used on it. Observations only. */
export function evidenceModel(state) {
  if (state.phase === 'welcome' || state.phase === 'mission') return null;
  const items = [];
  for (const id of SAMPLE_IDS) {
    const rows = ['blue-litmus', 'red-litmus'].map((ind) => observationFor(state, id, ind)).filter(Boolean)
      .map((o) => ({ label: TEXT.indicator[o.indicatorId], value: resultWord(o) }));
    if (rows.length) items.push({ id, title: `液體 ${id}`, rows });
  }
  return items.length ? { items } : null;
}

// ---- bench ------------------------------------------------------------------------------------------------------------

/**
 * What the bench renderer needs, and nothing else. Observations come from the engine (rebuilt from the records); the
 * hidden pH and kind they carry are dropped here, so the bench never receives them.
 */
export function benchModel(state) {
  const indicator = activeIndicator(state);
  if (!indicator) return null;
  const strip = (o) => ({ sampleId: o.sampleId, indicatorId: o.indicatorId, startColor: o.startColor, result: o.result, resultColor: o.resultColor, changed: o.changed });
  return {
    activeIndicatorId: indicator,
    locked: false,
    samples: SAMPLE_IDS.map((sampleId) => ({
      sampleId,
      tested: Boolean(observationFor(state, sampleId, indicator)),
      observations: ['blue-litmus', 'red-litmus'].map((ind) => observationFor(state, sampleId, ind)).filter(Boolean).map(strip),
    })),
  };
}

// ---- compare ----------------------------------------------------------------------------------------------------------

export const compareKeyFor = (state) => COMPARE_OF_PHASE[state.phase] ?? null;
export const compareTitleFor = (state) => TEXT.compareTitle[compareKeyFor(state)] ?? '';
export const compareHeadsFor = (state) => TEXT.compareHeads[compareKeyFor(state)] ?? TEXT.compareHeads.c1;

function questions(defs, status) {
  return defs.map((def) => {
    const q = status[def.id];
    return {
      id: def.id, text: def.text, options: def.options.map(([value, label]) => ({ value, label })),
      selectedValue: q.answer, disabled: q.correct,
      feedback: q.answer === null ? undefined : q.correct ? { kind: 'success', text: def.correct } : { kind: 'hint', text: def.wrong },
    };
  });
}

/**
 * The evidence table and the questions about it. Every cell is a recorded observation. Compare 1 lists each cup with
 * its strip before and after, so the learner does the grouping; Compare 2 lists each cup's two results side by side.
 */
export function compareModel(state) {
  const key = compareKeyFor(state);
  if (!key) return null;
  const status = compareStatus(state)[key];
  if (key === 'c1') {
    if (!trialComplete(state, 'blue-litmus')) return null;
    return {
      controlledVariables: [{ label: '試紙', value: '都用藍色石蕊' }, { label: '做法', value: '每杯都換一張新試紙' }],
      observedResponse: SAMPLE_IDS.map((id) => {
        const o = observationFor(state, id, 'blue-litmus');
        return { label: `液體 ${id}`, first: TEXT.startColor[o.startColor], second: resultWord(o) };
      }),
      procedureNote: '改變的只有液體：A、B、C 三杯。',
      questions: questions(COMPARE_TEXT.c1, status),
    };
  }
  if (!trialComplete(state, 'blue-litmus') || !trialComplete(state, 'red-litmus')) return null;
  return {
    independentVariable: { label: '試紙', from: '藍色石蕊', to: '紅色石蕊' },
    controlledVariables: [{ label: '液體', value: '同樣的 A、B、C 三杯' }, { label: '做法', value: '每杯都換一張新試紙' }],
    observedResponse: SAMPLE_IDS.map((id) => ({
      label: `液體 ${id}`, first: resultWord(observationFor(state, id, 'blue-litmus')), second: resultWord(observationFor(state, id, 'red-litmus')),
    })),
    questions: questions(COMPARE_TEXT.c2, status),
  };
}

// ---- concept ----------------------------------------------------------------------------------------------------------

const phText = (ph10) => (ph10 % 10 === 0 ? String(ph10 / 10) : (ph10 / 10).toFixed(1));

/**
 * The concept screen: null before the concept phase (the formal names do not exist before then), and null if the
 * learner's records are not all there. Which cup belongs to which class is read from the records (each observation is
 * rebuilt from the layout), never assumed. The pH part is added only after the learner asks for it.
 */
export function conceptModel(state) {
  if (state.phase !== 'concept') return null;
  if (!trialComplete(state, 'blue-litmus') || !trialComplete(state, 'red-litmus')) return null;
  const T = CONCEPT_TEXT;
  const both = (id) => [observationFor(state, id, 'blue-litmus'), observationFor(state, id, 'red-litmus')];
  const cards = KIND_ORDER.map((kind) => {
    const cups = SAMPLE_IDS.filter((id) => both(id).every((o) => o.kind === kind));
    return {
      id: kind, title: T.kinds[kind].title, body: [T.kinds[kind].body],
      evidence: cups.map((id) => ({ label: `你的液體 ${id}`, text: both(id).map(observed).join('、') })),
    };
  });
  cards.push({ id: 'samples', title: T.samples.title, body: [...T.samples.body], evidence: [] });
  if (state.conceptPart === 'ph') {
    cards.push({
      id: 'ph', title: T.ph.title, body: [...T.ph.body],
      evidence: SAMPLE_IDS.map((id) => {
        const kind = both(id)[0].kind;
        return { label: `液體 ${id}`, text: `pH ${phText(samplePh10(state.layout, id))}（${T.kinds[kind].title}）` };
      }),
    });
    cards.push({ id: 'indicator', title: T.indicator.title, body: [...T.indicator.body], evidence: [] });
  }
  return { heading: T.title, cards };
}

// ---- announcements ----------------------------------------------------------------------------------------------------

/** What the one live region says after an accepted action, or null. `seq` keeps two equal texts from being swallowed. */
export function announcementFor({ result, state, action = null, seq = 0 }) {
  if (!result?.accepted) return null;
  const a = TEXT.announce, say = (kind, text) => ({ id: `${kind}-${seq}`, text });
  const written = result.events.find((e) => e.type === 'record-written');
  if (written) {
    const o = observationFor(state, written.sampleId, written.indicatorId);
    const done = trialComplete(state, written.indicatorId) ? ` ${a.trialComplete}` : '';
    return say('record', `液體 ${o.sampleId}：${observed(o)}。${done}`);
  }
  const to = result.transitions.map((t) => t.to);
  if (to.includes('trial1')) return say('trial1', a.trial1);
  if (to.includes('trial2')) return say('trial2', a.trial2);
  if (to.includes('compare1') || to.includes('compare2')) return say('compare', a.compare);
  if (to.includes('concept')) return say('concept', CONCEPT_TEXT.announce.naming);
  if (action?.type === 'REVEAL_PH') return say('ph', CONCEPT_TEXT.announce.ph);
  if (action?.type === 'ANSWER_COMPARE') {
    const q = compareModel(state)?.questions.find((x) => x.id === action.question);
    if (!q?.feedback) return null;
    const done = compareStatus(state)[action.compare]?.allCorrect ? ` ${a.compareDone}` : '';
    return say('compare-answer', `${q.feedback.text}${done}`);
  }
  return null;
}
