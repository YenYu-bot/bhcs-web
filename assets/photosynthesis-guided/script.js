// Teaching script and view-models for Science Lab 2.0 Pilot #5 B3-B4.
// Every learner-facing word lives here. No DOM, persistence, analytics, timers or input handling.
// Before Concept, formal limiting-factor language remains unreachable.
import {
  PHASE_TRIAL,
  challengeIdOf,
  compareStatus,
  conceptEvidence,
  expectedNotebookRelations,
  notebookIsReady,
  observationFor,
  trialRecorded,
} from './engine.js';
import { trialCondition } from './model.js';
import {
  HINT_AFTER_ATTEMPTS,
  challengeProgress,
  stepOf,
  written,
} from './challenges.js';

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
  prototypeNote: '這是導引版原型，尚未公開。',
  privacyNote: '進度只保存在這台裝置的瀏覽器中；匿名學習事件不包含實驗數值、選項或你寫的文字。',
  restart: { label: '重新開始', confirm: '要清除這一站的進度並重新開始嗎？' },
  storage: {
    saved: '進度已保存在這台裝置。',
    restored: '已接續上次的進度。',
    failed: '瀏覽器目前無法保存進度；這次仍可繼續操作。',
  },
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
    toNotebook: '整理研究手冊',
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

export const LATE_TEXT = deepFreeze({
  cta: { challenge: '進入挑戰', nextChallenge: '下一題挑戰', finish: '完成這一站' },
  notebook: {
    title: '我的研究手冊',
    evidenceHeading: '你的兩組控制實驗',
    levelsLegend: '選一種方式來完成',
    levels: [
      { id: 'A', title: '幫我整理', desc: '把兩組變化整理成三個判斷。' },
      { id: 'B', title: '我自己說', desc: '用自己的話解釋第二組。' },
      { id: 'C', title: '我能提出證據', desc: '引用數據，也說明模型限制。' },
    ],
    levelA: {
      given: ['第一組和第二組都只改光照；上方表格保留了四次相對產氧紀錄。'],
      stems: [
        ['trial1Change', '第一組：光照 15% → 60%，相對產氧怎麼變？', [['increase', '增加'], ['same', '幾乎不變'], ['decrease', '降低']]],
        ['trial2Change', '第二組：光照 60% → 100%，相對產氧怎麼變？', [['increase', '增加'], ['same', '幾乎不變'], ['decrease', '降低']]],
        ['alwaysWorks', '所以「把光變強」是否任何情況都一定提高速率？', [['yes', '是'], ['no', '不是']]],
      ],
      nudge: '再把兩組數據並排比較：第一組和第二組的結果並不相同。',
      ready: '這份整理和你自己的四次觀察一致。',
    },
    levelB: {
      prompt: '用自己的話說：為什麼第二組把光照從 60% 提高到 100%，相對速率幾乎沒有增加？',
      placeholder: '我認為是因為……',
      help: '至少寫幾個字，就可以繼續。',
    },
    levelC: {
      q1: '引用第一組與第二組的數據，說明「增加光照不一定永遠有效」。',
      q2: '這個模型不能直接告訴我們真實植物的哪些事情？寫下一個限制。',
      help: '想想相對速率、氣泡、植物種類與其他沒有納入的條件。',
      ideasHeading: '可以對照看看：',
      ideas: [
        '氣泡只是產氧快慢的相對線索，不是精密氧氣體積。',
        '本站顯示的是相對速率，不是真實生物量。',
        '真實植物還受水分、葉面積、光質、養分與植物種類影響。',
        '模型沒有完整納入呼吸作用與適應時間。',
      ],
    },
  },
  challenge: {
    titlePrefix: '挑戰 ', count: '／3',
    items: {
      1: {
        title: '下一步改什麼？',
        scenario: '光照已經很強，但 CO₂ 很少；繼續增加光照，速率幾乎不再增加。',
        generic: '先找目前比較不足、最值得直接測試的條件。',
        steps: {
          'c1-next': {
            question: '如果只允許改一個條件，下一步最值得先測哪一項？',
            options: [['raise-light', '再增加光照'], ['raise-co2', '提高 CO₂'], ['raise-temp', '把溫度一直升高'], ['change-nothing', '什麼都不改']],
            success: '對。當光已經不是最不足的條件時，提高 CO₂ 才是更有資訊的下一步。',
            hint: '第二組裡，把光從 60% 提高到 100% 幾乎沒有幫助；想想哪個條件仍然偏少。',
          },
        },
      },
      2: {
        title: '公平比較',
        scenario: '你想研究 CO₂ 對光合作用相對速率的影響。',
        generic: '公平比較要一次只改一個自變因。',
        steps: {
          'c2-fair': {
            question: '哪一種做法最公平？',
            options: [['change-all', 'CO₂、光照、溫度一起改'], ['change-co2-only', '只改 CO₂，光照和溫度保持相同'], ['change-light-too', 'CO₂ 和光照一起改'], ['change-temperature-only', '只改溫度']],
            success: '對。要研究 CO₂，就只改 CO₂，其他重要條件保持相同。',
            hint: '如果光照或溫度也一起變，就無法知道速率差異是不是 CO₂ 造成的。',
          },
        },
      },
      3: {
        title: '溫度不是越高越好',
        scenario: '在光照與 CO₂ 充足時，本站模型顯示：25°C 的相對速率約 19.2，40°C 約 5.0。',
        generic: '直接比較兩個溫度下的結果，不要把「更高」自動當成「更快」。',
        steps: {
          'c3-claim': {
            question: '能不能說「溫度越高，光合作用一定越快」？',
            options: [['always-faster', '可以，溫度越高一定越快'], ['cannot-say-always', '不能，這組證據已經反駁「一定越快」'], ['temperature-no-effect', '溫度完全沒有影響'], ['random', '結果只是隨機']],
            success: '對。25°C 約 19.2、40°C 約 5.0，已經不能支持「溫度越高一定越快」。',
            hint: '如果「越高一定越快」成立，40°C 的數值應該高於 25°C；但資料不是這樣。',
          },
        },
        note: { label: '用自己的話說說看：為什麼不能把「溫度越高」直接等同「速率越快」？（可以不寫）', placeholder: '因為資料顯示……' },
      },
    },
  },
  complete: {
    heading: '這一站完成了',
    claims: [
      '我能用控制實驗判斷「增加光照」在不同條件下的效果。',
      '我知道某個必要條件最不足時，繼續增加其他條件可能幾乎沒有幫助。',
      '我能分辨概念模型的相對結果，和真實植物的精密預測。',
    ],
    ownWords: '我在研究手冊裡寫下：',
    levelA: '我的紀錄顯示：第一組增加、第二組幾乎不變，所以增加光照不是任何情況都一定有效。',
  },
  announce: { notebook: '研究手冊。', challenge: (n) => `挑戰 ${n}。`, complete: '這一站完成了。' },
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
  if (p === 'concept') return { id: 'concept', arrival: ['#pfg-concept-title'], focusTargets: ['#pfg-cta', '#pfg-concept-title'] };
  if (p === 'notebook') return { id: 'notebook', arrival: ['#pfg-notebook-title'], focusTargets: ['input[data-level]', '#pfg-cta', '#pfg-notebook-title'] };
  if (challengeIdOf(p) !== null) return { id: 'challenge', arrival: ['#pfg-challenge-title'], focusTargets: ['button[data-option]', '#pfg-cta', '#pfg-challenge-title'] };
  if (p === 'complete') return { id: 'complete', arrival: ['#pfg-complete-title'], focusTargets: ['#pfg-complete-title'] };
  throw new RangeError(`script: unknown phase ${p}`);
}

export function stepFor(state) {
  const p = state.phase;
  if (p === 'welcome' || p === 'mission') return 'mission';
  if (p === 'inference' || p === 'concept') return 'findings';
  if (p === 'notebook') return 'notebook';
  if (challengeIdOf(p) !== null || p === 'complete') return 'challenge';
  return 'experiment';
}
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

export function challengeView(state) {
  const id = challengeIdOf(state.phase);
  return id === null ? { id: null, steps: [], allCorrect: false } : { id, ...challengeProgress(id, state.challenges[id]) };
}

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
  if (p === 'concept') return { label: c.toNotebook, action: { type: 'CONTINUE' }, enabled: true };
  if (p === 'notebook') return { label: LATE_TEXT.cta.challenge, action: { type: 'CONTINUE' }, enabled: notebookIsReady(state) };
  if (challengeIdOf(p) !== null) {
    return {
      label: p === 'challenge-3' ? LATE_TEXT.cta.finish : LATE_TEXT.cta.nextChallenge,
      action: { type: 'CONTINUE' },
      enabled: challengeView(state).allCorrect,
    };
  }
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
  if (state.phase !== 'concept') return null;
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

function notebookEvidence(state) {
  const ids = ['t1-low-light', 't1-higher-light', 't2-medium-light', 't2-high-light'];
  if (!ids.every((id) => trialRecorded(state, id))) return null;
  const a = observationFor(state, ids[0]), b = observationFor(state, ids[1]);
  const c = observationFor(state, ids[2]), d = observationFor(state, ids[3]);
  return {
    observedResponse: [
      { label: '第一組', first: `${pct(a.light)}｜${rate(a)}`, second: `${pct(b.light)}｜${rate(b)}` },
      { label: '第二組', first: `${pct(c.light)}｜${rate(c)}`, second: `${pct(d.light)}｜${rate(d)}` },
    ],
    procedureNote: '每一組都只改光照；數字是本站的相對產氧速率。',
  };
}
export const notebookHeads = () => ({ item: '比較', first: '較弱光｜速率', second: '較強光｜速率' });

export function notebookModel(state) {
  if (state.phase !== 'notebook') return null;
  const evidenceSummary = notebookEvidence(state);
  if (!evidenceSummary) return null;
  const N = LATE_TEXT.notebook, A = N.levelA, c = state.conclusion;
  const ready = notebookIsReady(state);
  const allChosen = A.stems.every(([id]) => c[id] !== null);
  return {
    heading: N.title,
    evidenceHeading: N.evidenceHeading,
    evidenceSummary,
    levelsLegend: N.levelsLegend,
    levels: N.levels.map((l) => ({ ...l })),
    selectedLevel: c.level,
    levelA: {
      given: [...A.given],
      stems: A.stems.map(([id, legend, options]) => ({
        id,
        legend,
        options: options.map(([value, label]) => ({ value, label })),
        selectedValue: c[id],
      })),
      nudge: c.level === 'A' && allChosen && !ready ? A.nudge : null,
    },
    levelB: {
      prompt: N.levelB.prompt,
      placeholder: N.levelB.placeholder,
      help: N.levelB.help,
      value: c.freeText,
    },
    levelC: {
      q1: { label: N.levelC.q1, value: c.evidenceText },
      q2: { label: N.levelC.q2, value: c.limitationText },
      help: N.levelC.help,
      ideasHeading: N.levelC.ideasHeading,
      ideas: [...N.levelC.ideas],
      showIdeas: written(c.limitationText),
    },
    ready,
    readyNote: ready && c.level === 'A' ? A.ready : null,
  };
}

export function challengeFeedback(challengeId, stepId, { correct, attempts }) {
  const item = LATE_TEXT.challenge.items[challengeId], step = item?.steps[stepId];
  if (!step) return null;
  if (correct) return { kind: 'success', text: step.success };
  if (attempts < 1) return null;
  return attempts < HINT_AFTER_ATTEMPTS ? { kind: 'nudge', text: item.generic } : { kind: 'hint', text: step.hint };
}

function optionsOf(challengeId, stepId) {
  const labels = Object.fromEntries(LATE_TEXT.challenge.items[challengeId].steps[stepId].options);
  return stepOf(challengeId, stepId).options.map((value) => ({ value, label: labels[value] }));
}

export function challengeModel(state) {
  const view = challengeView(state);
  if (view.id === null) return null;
  const C = LATE_TEXT.challenge, item = C.items[view.id];
  const model = {
    id: view.id,
    title: `${C.titlePrefix}${view.id}${C.count}：${item.title}`,
    scenario: item.scenario,
    steps: view.steps.map((step) => ({
      id: step.id,
      question: item.steps[step.id].question,
      options: optionsOf(view.id, step.id),
      unlocked: step.unlocked,
      choice: step.choice,
      attempts: step.attempts,
      correct: step.correct,
      feedback: challengeFeedback(view.id, step.id, step),
    })),
    allCorrect: view.allCorrect,
  };
  if (item.note && view.allCorrect) {
    model.note = {
      label: item.note.label,
      placeholder: item.note.placeholder,
      text: state.challenges[view.id].note ?? '',
    };
  }
  return model;
}

export function completeModel(state) {
  if (state.phase !== 'complete') return null;
  const C = LATE_TEXT.complete, c = state.conclusion;
  let conclusion = [];
  if (c.level === 'A' && expectedNotebookRelations(state)) conclusion = [C.levelA];
  else if (c.level === 'B') conclusion = [C.ownWords, c.freeText];
  else if (c.level === 'C') conclusion = [C.ownWords, c.evidenceText, c.limitationText];
  return { heading: C.heading, claims: [...C.claims], conclusion };
}

export function announcementFor({ result, state, action = null, seq = 0 }) {
  if (!result?.accepted) return null;
  const say = (kind, text) => ({ id: `${kind}-${seq}`, text });
  const recorded = result.events.find((event) => event.type === 'record-written');
  if (recorded) {
    const o = observationFor(state, recorded.trialId);
    return say('record', `已記錄：光照 ${pct(o.light)}，相對產氧 ${rate(o)}。`);
  }
  const challenged = result.events.find((event) => event.type === 'challenge-answered');
  if (challenged) return say('challenge-answer', challengeFeedback(challenged.challengeId, challenged.step, challenged).text);
  if (action?.type === 'SET_LIGHT') return say('light', `光照已設為 ${pct(state.conditions.light)}。`);
  if (action?.type === 'ANSWER_COMPARE') {
    const q = compareModel(state)?.questions.find((item) => item.id === action.question);
    if (!q?.feedback) return null;
    const done = compareStatus(state)[action.compare]?.allCorrect ? ' 兩題都完成了。' : '';
    return say('compare-answer', `${q.feedback.text}${done}`);
  }
  const to = result.transitions.map((t) => t.to);
  if (to.includes('complete')) return say('complete', LATE_TEXT.announce.complete);
  const challenge = to.map(challengeIdOf).find((n) => n !== null);
  if (challenge) return say('challenge', LATE_TEXT.announce.challenge(challenge));
  if (to.includes('notebook')) return say('notebook', LATE_TEXT.announce.notebook);
  if (to.includes('mission')) return say('mission', TEXT.announce.mission);
  if (to.includes('trial1-low-light')) return say('trial1', TEXT.announce.trial1);
  if (to.includes('compare1') || to.includes('compare2')) return say('compare', TEXT.announce.compare);
  if (to.includes('trial2-setup')) return say('trial2-setup', TEXT.announce.trial2Setup);
  if (to.includes('trial2-medium-light')) return say('trial2', TEXT.announce.trial2);
  if (to.includes('inference')) return say('inference', TEXT.announce.inference);
  if (to.includes('concept')) return say('concept', '概念整理：限制因子。');
  return null;
}
