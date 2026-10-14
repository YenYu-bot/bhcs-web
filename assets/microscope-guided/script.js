// Teaching script and view-models for the guided microscope lab (Pilot #3, B3).
// Every word a learner reads lives here, and every card is described as a plain object shaped like the Component Spec
// contracts. No DOM, no state changes, no storage, no analytics, no input handling.
//
// Until the concept screen the learner meets observations only: where the e is, what moved how far, which marks are in
// view. The pattern is for the learner to find in the Compare cards; the formal explanation lives in CONCEPT_TEXT and
// conceptModel(), which refuses to answer before the concept phase.
import { OBJECTIVES, FIELD_NUMBER_MM, STAGE_GAIN, WORLD_DIAMETER_4X, FOV_MM_AT_4X, VIEW_CENTER, fieldDiameterMm, objectiveScale } from './model.js';
import { deriveTrial1Observation, observeMagnification, recordVisibleIds, compareView } from './engine.js';

const deepFreeze = (o) => {
  for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v);
  return Object.freeze(o);
};
const unknown = (what, value) => { throw new RangeError(`script: unknown ${what} (${String(value)})`); };

export const COACH_NAME = '余老師';
export const STATION_TITLE = '顯微鏡實驗';
export const CONCEPT_STATION_TITLE = '顯微鏡的影像與視野';

export const STEPS = deepFreeze([
  { id: 'mission', number: '01', label: '接任務' },
  { id: 'experiment', number: '02', label: '動手做' },
  { id: 'notebook', number: '03', label: '研究手冊' },
  { id: 'challenge', number: '04', label: '挑戰題' },
]);

/** Coach messages the learner can meet before the concept screen. Keys are the coach's states; see reduceCoach(). */
export const MESSAGES = deepFreeze({
  welcome: { main: '為什麼我明明把玻片往右推，視野裡的東西卻跑到別的方向？', sub: '這一站不先給答案，用顯微鏡自己找出來。' },
  mission: { main: '先別猜答案。把玻片上的目標移回中央，看看它真的怎麼動。', sub: '準備好了就按「開始實驗」。' },
  'trial1-horizontal': { main: '把 e 移到視野中央。', sub: '拖曳右邊的玻片，也可以用方向按鈕或鍵盤方向鍵。' },
  'trial1-horizontal-complete': { main: 'e 已經在中央了。', sub: '按下「記錄橫向結果」，把這次的移動記下來。' },
  'trial1-vertical': { main: '這次 e 跑到視野上方了。把它也移到中央。', sub: '一樣用玻片移動台，看看這次它怎麼動。' },
  'trial1-vertical-complete': { main: 'e 又回到中央了。', sub: '按下「記錄縱向結果」。' },
  'compare-direction': { main: '把兩次紀錄放在一起看。', sub: '橫向和縱向，玻片怎麼移、視野裡的 e 怎麼動？回答下面的問題。' },
  'compare-direction-done': { main: '你從自己的紀錄找到了關係。', sub: '接下來換成另一片玻片，看看換物鏡會有什麼不同。' },
  'trial2-low': { main: '換成有 A、B、C 三個記號的玻片。把 B 移到視野正中央。', sub: '目前使用 4× 物鏡。' },
  'trial2-low-complete': { main: 'B 在中央了。看看現在視野裡有哪些記號。', sub: '按下「記錄低倍結果」。' },
  'trial2-high': { main: '把物鏡換成 40×，看看視野裡的記號。', sub: '用下面的物鏡按鈕切換。' },
  'trial2-high-lost': { main: '現在看不到 B 了。', sub: '想一想，剛才為什麼看得到？你可以換回 4× 看看 B 在哪裡。' },
  'trial2-high-complete': { main: '剛才還看得到的 A、C 呢？', sub: '按下「記錄高倍結果」。' },
  'compare-magnification': { main: '對照 4× 和 40× 兩次的紀錄。', sub: '同一片玻片、同樣的位置，換了物鏡以後看到什麼？' },
  'compare-magnification-done': { main: '你從自己的紀錄找到了關係。', sub: '下一步，把你的發現和正式的說法接起來。' },
  concept: { main: '現在把你的發現和正式的說法接起來。', sub: '每一張卡片旁邊，都是你自己的紀錄。' },
});

export const TEXT = deepFreeze({
  stepNavLabel: '實驗進度',
  dataTitle: '現在的條件',
  evidenceTitle: '我的紀錄',
  compareTitle: '比較兩次紀錄',
  conceptTitle: '用你剛才的證據來看',
  cta: {
    start: '開始', begin: '開始實驗',
    recordHorizontal: '記錄橫向結果', recordVertical: '記錄縱向結果', toTrial2: '繼續倍率實驗',
    recordLow: '記錄低倍結果', recordHigh: '記錄高倍結果', toConcept: '看看這代表什麼',
  },
  pending: '這一站接下來的研究手冊與挑戰題還在準備中。',
  dataStates: { changed: '（剛換）' },
  controls: {
    group: '玻片微調', objectiveGroup: '物鏡倍率', objective: (o) => `${o}× 物鏡`,
    move: { left: '玻片向左', right: '玻片向右', up: '玻片向上', down: '玻片向下' }, home: '玻片回到起點',
  },
  captions: { eyepiece: '目鏡視野', stage: '玻片移動台' },
  data: {
    objective: '物鏡', stageX: '玻片位置（左右）', stageY: '玻片位置（上下）', field: '視野直徑',
  },
  status: {
    left: 'e 離開視野了', centered: 'e 已在視野中央', closer: 'e 更靠近中央了', farther: 'e 離中央更遠了',
    lowOff: 'B 還沒在視野中央', lowCentered: 'B 在視野中央',
  },
  hints: { 1: '剛才移動玻片後，e 往哪裡跑了？' },
  compareHeads1: { item: '項目', first: '橫向', second: '縱向', changed: '改變', same: '不變' },
  compareHeads2: { item: '項目', first: '4×', second: '40×', changed: '改變', same: '不變' },
  announce: {
    left: 'e 離開視野了', back: 'e 回到視野了', leftB: 'B 離開視野了', backB: 'B 回到視野了',
    centeredE: 'e 已到視野中央', centeredB: 'B 已在視野中央', highSeen: '40× 下看得到 B',
    record: { horizontal: '已記錄橫向結果', vertical: '已記錄縱向結果', low: '已記錄低倍結果', high: '已記錄高倍結果' },
    compareDone: '這一題答對了，兩題都完成了。', concept: '概念整理',
  },
});

const COMPARE1 = deepFreeze({
  title: '兩次紀錄中，玻片和視野中的影像移動方向有什麼共同關係？',
  options: [
    { value: 'opposite', label: '往相反方向移動' }, { value: 'same', label: '往相同方向移動' }, { value: 'unrelated', label: '看不出固定關係' },
  ],
  correct: '沒錯，兩次紀錄都顯示同樣的關係。',
  wrong: '再對照一次表格：兩次紀錄裡，玻片的方向和 e 的方向是怎麼配對的？',
});
const COMPARE2 = deepFreeze([
  {
    id: 'field', text: '換成高倍後，看到的範圍怎麼變？',
    options: [{ value: 'smaller', label: '變小' }, { value: 'same', label: '一樣' }, { value: 'larger', label: '變大' }],
    correct: '沒錯，表格裡的視野直徑就是這樣變的。', wrong: '看看表格裡的視野直徑，從 4× 到 40× 是變大還是變小？',
  },
  {
    id: 'count', text: '同一個位置附近，看到的記號數怎麼變？',
    options: [{ value: 'fewer', label: '變少' }, { value: 'same', label: '一樣' }, { value: 'more', label: '變多' }],
    correct: '沒錯，記號數和表格一致。', wrong: '數一數表格裡兩次各看到幾個記號。',
  },
]);

export const CONCEPT_TEXT = deepFreeze({
  direction: {
    id: 'direction', title: '影像方向',
    body: ['複式顯微鏡形成的影像上下、左右都顛倒，相當於旋轉 180°。因此玻片往一個方向移時，視野中的影像會往相反方向移。'],
  },
  field: {
    id: 'field', title: '倍率與視野',
    body: ['物鏡倍率提高時，影像看起來更大，但一次能看到的範圍會變小。'],
  },
  formula: {
    heading: '這台模擬顯微鏡的視野設定', expression: '視野直徑 = FN ÷ 物鏡倍率',
    note: `本站使用 FN = ${FIELD_NUMBER_MM} mm 作為模擬設定；不同顯微鏡的目鏡視野數可能不同。`,
  },
});

// ---- formatting (units and directions only; every number is the model's or the engine's) ----------------------------------

const MM_PER_WU = FOV_MM_AT_4X / WORLD_DIAMETER_4X;
const stageMm = (stageUnits) => stageUnits * STAGE_GAIN * MM_PER_WU;       // slide travel in mm: stage unit -> world units -> mm
const mm1 = (v) => Math.abs(v).toFixed(1);
const trim = (v) => String(Number(v.toFixed(2)));
const px = (v) => String(Math.round(Math.abs(v)));
const slideDir = { x: (v) => (v >= 0 ? '右' : '左'), y: (v) => (v >= 0 ? '上' : '下') };
const imageDir = { x: (v) => (v >= 0 ? '右' : '左'), y: (v) => (v >= 0 ? '下' : '上') };   // screen y points down
const ids = (list) => list.join('、');

/** What one Trial 1 record shows, from the engine's recomputed observation. Facts only. */
export function trial1Facts(record) {
  const o = deriveTrial1Observation(record);
  if (!o) return null;
  const a = o.axis;
  return { slide: `向${slideDir[a](o.stageDelta[a])} ${mm1(stageMm(o.stageDelta[a]))} mm`, image: `向${imageDir[a](o.imageDelta[a])} ${px(o.imageDelta[a])} px` };
}
const BENCH_PHASES = new Set(['trial1-horizontal', 'trial1-horizontal-complete', 'trial1-vertical', 'trial1-vertical-complete', 'trial2-low', 'trial2-low-complete', 'trial2-high', 'trial2-high-complete']);
const TRIAL1_LIVE = new Set(['trial1-horizontal', 'trial1-vertical']);
const COMPARE_PHASES = new Set(['compare-direction', 'compare-magnification']);
export const CONCEPT_PHASES = new Set(['concept', 'notebook', 'challenge-1', 'challenge-2', 'challenge-3', 'complete']);

// ---- screens, steps, buttons ------------------------------------------------------------------------------------------

export function screenFor(state) {
  const p = state.phase;
  if (p === 'welcome' || p === 'mission') return { id: 'welcome', headingId: 'mg-welcome-title', arrival: ['#mg-welcome-title'], focusTargets: ['#mg-cta', '#mg-welcome-title'] };
  if (BENCH_PHASES.has(p)) return { id: 'bench', headingId: 'mg-heading', arrival: ['[data-role="stage-surface"]'], focusTargets: ['[data-role="stage-surface"]', '[data-mg-objective]', '#mg-cta', '#mg-heading'] };
  if (COMPARE_PHASES.has(p)) return { id: 'compare', headingId: 'mg-compare-title', arrival: ['#mg-compare-title'], focusTargets: ['[data-compare]', '#mg-cta', '#mg-compare-title'] };
  return { id: 'concept', headingId: 'mg-concept-title', arrival: ['#mg-concept-title'], focusTargets: ['#mg-cta', '#mg-concept-title'] };
}
export const stepFor = (state) => (state.phase === 'welcome' || state.phase === 'mission' ? 'mission' : state.phase === 'notebook' ? 'notebook' : /^challenge-|^complete$/.test(state.phase) ? 'challenge' : 'experiment');
export const stepNavModel = (state) => ({ steps: STEPS, currentStep: stepFor(state) });
export const stationTitleFor = (state) => (CONCEPT_PHASES.has(state.phase) ? CONCEPT_STATION_TITLE : STATION_TITLE);
export const welcomeModel = (state) => {
  const m = state.phase === 'mission' ? MESSAGES.mission : MESSAGES.welcome;
  return { title: m.main, sub: m.sub };
};

/** The one main button, or null. `action` is the engine action the page dispatches when it is pressed. */
export function ctaFor(state) {
  const c = TEXT.cta, p = state.phase;
  const done = (label, ready) => ({ label, action: { type: 'RECORD' }, enabled: ready });
  switch (p) {
    case 'welcome': return { label: c.start, action: { type: 'START' }, enabled: true };
    case 'mission': return { label: c.begin, action: { type: 'BEGIN' }, enabled: true };
    case 'trial1-horizontal': case 'trial1-horizontal-complete': return done(c.recordHorizontal, p.endsWith('complete'));
    case 'trial1-vertical': case 'trial1-vertical-complete': return done(c.recordVertical, p.endsWith('complete'));
    case 'trial2-low': case 'trial2-low-complete': return done(c.recordLow, p.endsWith('complete'));
    case 'trial2-high': case 'trial2-high-complete': return done(c.recordHigh, p.endsWith('complete'));
    case 'compare-direction': return { label: c.toTrial2, action: { type: 'CONTINUE' }, enabled: compareView(state).directionCorrect };
    case 'compare-magnification': return { label: c.toConcept, action: { type: 'CONTINUE' }, enabled: compareView(state).magnificationCorrect };
    default: return null;   // the concept is where this prototype stops for now
  }
}

// ---- coach ------------------------------------------------------------------------------------------------------------

const sideOf = (view) => {
  const p = view.positions.e;
  if (!view.target.visible) return '視野外';
  const dx = p.x - VIEW_CENTER.x, dy = p.y - VIEW_CENTER.y;
  return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? '右側' : '左側') : (dy > 0 ? '下方' : '上方');
};
const MOVE_WORD = { left: '左', right: '右', up: '上', down: '下' };
const HINT_PX = [60, 120];   // how much farther than its best the e has drifted before the first / second nudge

function nextTrack(prev, state, view) {
  const live = TRIAL1_LIVE.has(state.phase);
  const dist = live ? view.target.distance : null;
  if (!prev || prev.phase !== state.phase) return { phase: state.phase, best: dist, dist, trend: null, lastMove: null, stage: { ...state.stage } };
  const dx = state.stage.x - prev.stage.x, dy = state.stage.y - prev.stage.y;
  const moved = Math.hypot(dx, dy) > 1e-9;
  const lastMove = !moved ? prev.lastMove : Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'up' : 'down');
  let trend = prev.trend;
  if (live && moved) trend = dist < prev.dist - 0.5 ? 'closer' : dist > prev.dist + 0.5 ? 'farther' : trend;
  return { phase: state.phase, best: live ? Math.min(prev.best ?? dist, dist) : null, dist, trend, lastMove, stage: { ...state.stage } };
}

function hintLevel(track, state, view) {
  if (!TRIAL1_LIVE.has(state.phase) || track.best === null) return 0;
  const drift = view.target.distance - track.best;
  return drift > HINT_PX[1] ? 2 : drift > HINT_PX[0] ? 1 : 0;
}
function hintText(level, track, view) {
  if (level === 1) return TEXT.hints[1];
  if (level === 2) {
    const move = track.lastMove ? `你剛才把玻片往${MOVE_WORD[track.lastMove]}移，` : '';
    return `${move}e 現在在視野${sideOf(view)}。再試試別的移動方向，看看 e 怎麼動。`;
  }
  return null;
}

function coachKeyFor(state, view) {
  const p = state.phase;
  if (p === 'compare-direction') return compareView(state).directionCorrect ? 'compare-direction-done' : p;
  if (p === 'compare-magnification') return compareView(state).magnificationCorrect ? 'compare-magnification-done' : p;
  if (p === 'trial2-high' && state.objective !== OBJECTIVES[0] && !view.target.visible) return 'trial2-high-lost';
  return CONCEPT_PHASES.has(p) ? 'concept' : p;
}

/** previous coach (or null) and the context of an accepted action -> the coach for the new state. Pure. */
export function reduceCoach(previous, context) {
  const { state, view } = context;
  const key = coachKeyFor(state, view);
  const message = MESSAGES[key] ?? unknown('coach message', key);
  const track = nextTrack(previous?.track, state, view);
  const level = hintLevel(track, state, view);
  const coach = { key, name: COACH_NAME, main: message.main, tip: hintText(level, track, view), track };
  if (message.sub !== undefined) coach.sub = message.sub;
  return coach;
}

// ---- status, data, evidence -------------------------------------------------------------------------------------------

/** What the bench shows right now, as one plain observable fact. null when no bench is on screen. */
export function statusModel(state, view, coach = null) {
  const p = state.phase;
  if (!BENCH_PHASES.has(p)) return null;
  const neutral = (text) => ({ kind: 'neutral', icon: '○', text });
  if (p.startsWith('trial1')) {
    if (!view.target.visible) return { kind: 'progress', icon: '!', text: TEXT.status.left };
    if (view.target.centered) return { kind: 'success', icon: '✓', text: TEXT.status.centered };
    const trend = coach?.track?.trend;
    if (trend === 'closer') return { kind: 'progress', icon: '↗', text: `${TEXT.status.closer}（目前在視野${sideOf(view)}）` };
    if (trend === 'farther') return { kind: 'progress', icon: '↘', text: `${TEXT.status.farther}（目前在視野${sideOf(view)}）` };
    return neutral(`e 在視野${sideOf(view)}`);
  }
  const seen = ids(view.visibleIds);
  if (p.startsWith('trial2-low')) {
    return view.target.centered ? { kind: 'success', icon: '✓', text: `${TEXT.status.lowCentered}，目前看得到 ${seen}` } : neutral(`${TEXT.status.lowOff}，目前看得到 ${seen}`);
  }
  if (view.objective !== OBJECTIVES[0] && view.visibleIds.length === 1) {
    const gone = ['A', 'B', 'C'].filter((id) => !view.visibleIds.includes(id));
    return { kind: 'progress', icon: '○', text: `目前看得到 ${seen}；${ids(gone)} 已不在視野中` };
  }
  return neutral(view.visibleIds.length ? `目前物鏡 ${view.objective}×，看得到 ${seen}` : `目前物鏡 ${view.objective}×，視野裡沒有記號`);
}

/** "What are the conditions right now?" Shown beside the bench. */
export function dataModel(state, view) {
  if (!BENCH_PHASES.has(state.phase)) return null;
  const t = TEXT.data, trial1 = state.phase.startsWith('trial1');
  const x = stageMm(state.stage.x), y = stageMm(state.stage.y);
  const conditions = [
    { label: t.objective, value: `${state.objective}×`, state: state.phase.startsWith('trial2') && state.objective !== OBJECTIVES[0] ? 'changed' : 'normal' },
    { label: t.stageX, value: `向${slideDir.x(x)} ${mm1(x)} mm`, state: 'normal' },
    { label: t.stageY, value: `向${slideDir.y(y)} ${mm1(y)} mm`, state: 'normal' },
  ];
  if (!trial1) conditions.splice(1, 0, { label: t.field, value: `${trim(fieldDiameterMm(state.objective))} mm`, state: 'normal' });
  return { conditions };
}

const EVIDENCE_TITLES = { horizontal: '橫向紀錄', vertical: '縱向紀錄', low: '低倍紀錄（4×）', high: '高倍紀錄（40×）' };
function trial2Rows(record) {
  const seen = recordVisibleIds(record);
  return [
    { label: '物鏡', value: `${record.objective}×` },
    { label: '視野直徑', value: `${trim(fieldDiameterMm(record.objective))} mm` },
    { label: '看得到的記號', value: `${seen.length} 個：${ids(seen)}` },
  ];
}

/** "What did I record?" Observations only: no pattern, no conclusion, no formula. */
export function evidenceModel(state) {
  const items = [];
  for (const id of ['horizontal', 'vertical']) {
    const f = state.records[id] && trial1Facts(state.records[id]);
    if (f) items.push({ id, title: EVIDENCE_TITLES[id], rows: [{ label: '玻片位移', value: f.slide }, { label: '視野中的 e', value: f.image }] });
  }
  for (const id of ['low', 'high']) if (state.records[id]) items.push({ id, title: EVIDENCE_TITLES[id], rows: trial2Rows(state.records[id]) });
  return items.length ? { items } : null;
}

// ---- compare ----------------------------------------------------------------------------------------------------------

export const compareHeadsFor = (state) => (state.phase === 'compare-magnification' ? TEXT.compareHeads2 : TEXT.compareHeads1);

function feedback(answer, correct, def) {
  if (answer === null) return undefined;
  return correct ? { kind: 'success', text: def.correct } : { kind: 'hint', text: def.wrong };
}

export function compareModel(state) {
  const v = compareView(state);
  if (state.phase === 'compare-direction') {
    const h = trial1Facts(state.records.horizontal), t = trial1Facts(state.records.vertical);
    if (!h || !t) return null;
    const q = v.direction.relation;
    return {
      independentVariable: { label: '移動方向', from: '水平', to: '垂直' },
      controlledVariables: [{ label: '物鏡', value: '都是 4×' }, { label: '觀察目標', value: '都是字母 e' }],
      observedResponse: [{ label: '玻片位移', first: h.slide, second: t.slide }, { label: '視野中的 e', first: h.image, second: t.image }],
      questions: [{
        id: 'relation', text: COMPARE1.title, options: COMPARE1.options.map((o) => ({ ...o })), selectedValue: q.answer,
        disabled: q.correct, feedback: feedback(q.answer, q.correct, COMPARE1),
      }],
    };
  }
  if (state.phase === 'compare-magnification') {
    const o = observeMagnification(state.records);
    if (!o) return null;
    const low = state.records.low, high = state.records.high;
    const size = (r) => `${trim(objectiveScale(r.objective))} 倍（相對 4×）`;
    return {
      independentVariable: { label: '物鏡倍率', from: `${low.objective}×`, to: `${high.objective}×` },
      controlledVariables: [{ label: '玻片', value: '同一片 A、B、C 玻片' }, { label: '位置', value: 'B 在視野中央附近' }],
      observedResponse: [
        { label: '視野直徑', first: `${trim(fieldDiameterMm(low.objective))} mm`, second: `${trim(fieldDiameterMm(high.objective))} mm` },
        { label: '看得到的記號', first: `${o.lowIds.length} 個（${ids(o.lowIds)}）`, second: `${o.highIds.length} 個（${ids(o.highIds)}）` },
        { label: 'B 的大小', first: size(low), second: size(high) },
      ],
      questions: COMPARE2.map((def) => {
        const q = v.magnification[def.id];
        return { id: def.id, text: def.text, options: def.options.map((x) => ({ ...x })), selectedValue: q.answer, disabled: q.correct, feedback: feedback(q.answer, q.correct, def) };
      }),
    };
  }
  return null;
}

// ---- concept ----------------------------------------------------------------------------------------------------------

/** The concept screen. null until the concept phase, and null if the learner's evidence is not all there. */
export function conceptModel(state) {
  if (!CONCEPT_PHASES.has(state.phase)) return null;
  const h = trial1Facts(state.records.horizontal), v = trial1Facts(state.records.vertical), o = observeMagnification(state.records);
  if (!h || !v || !o) return null;
  const T = CONCEPT_TEXT, low = state.records.low, high = state.records.high;
  const seen = (r, list) => `看到 ${list.length} 個記號，視野直徑 ${trim(fieldDiameterMm(r.objective))} mm`;
  return {
    heading: TEXT.conceptTitle,
    cards: [
      { id: T.direction.id, title: T.direction.title, body: [...T.direction.body], evidence: [
        { label: '橫向', text: `玻片${h.slide}，視野中的 e ${h.image}` },
        { label: '縱向', text: `玻片${v.slide}，視野中的 e ${v.image}` },
      ] },
      { id: T.field.id, title: T.field.title, body: [...T.field.body], evidence: [
        { label: `${low.objective}×`, text: seen(low, o.lowIds) },
        { label: `${high.objective}×`, text: seen(high, o.highIds) },
      ] },
    ],
    formula: {
      heading: T.formula.heading, expression: T.formula.expression,
      lines: OBJECTIVES.map((obj) => ({ text: `${obj}× → ${trim(fieldDiameterMm(obj))} mm`, emphasis: obj === high.objective })),
      note: T.formula.note,
    },
  };
}

// ---- labels for the bench, and what is announced ---------------------------------------------------------------------

export function eyepieceLabel(state, view) {
  if (!BENCH_PHASES.has(state.phase)) return '顯微鏡視野';
  if (state.phase.startsWith('trial1')) return `顯微鏡視野，目前 e ${view.target.centered ? '在中央' : view.target.visible ? `位在${sideOf(view)}` : '不在視野內'}`;
  return `顯微鏡視野，目前${view.visibleIds.length ? `可見 ${ids(view.visibleIds)}` : '沒有可見的記號'}`;
}
export function stageLabel(state) {
  const x = stageMm(state.stage.x), y = stageMm(state.stage.y);
  return `玻片移動台，目前向${slideDir.x(x)} ${mm1(x)} 毫米、向${slideDir.y(y)} ${mm1(y)} 毫米`;
}

/** One event-level announcement, or null. `seq` makes the id unique per event, so the same sentence can be said again. */
export function announcementFor({ result, prevState, prevView, state, view, action = null, seq = 0 }) {
  if (!result?.accepted) return null;
  const a = TEXT.announce, say = (kind, text) => ({ id: `${kind}-${seq}`, text });
  const written = result.events.find((e) => e.type === 'record-written');
  if (written) return say('record', a.record[written.trial]);
  const complete = result.events.find((e) => e.type === 'trial-complete');
  if (complete) {
    if (complete.phase === 'trial2-high') return say('seen', a.highSeen);
    return say('centered', state.phase.startsWith('trial1') ? a.centeredE : a.centeredB);
  }
  if (result.transitions.some((t) => t.to === 'concept')) return say('concept', a.concept);
  if (action?.type === 'ANSWER_COMPARE') {
    const m = compareModel(state), q = m?.questions.find((x) => x.id === action.question);
    if (!q?.feedback) return null;
    const done = compareView(state)[state.phase === 'compare-direction' ? 'directionCorrect' : 'magnificationCorrect'] ? ` ${a.compareDone}` : '';
    return say('compare', `${q.feedback.text}${done}`);
  }
  if (prevView?.target && view.target && prevState.phase === state.phase && prevView.target.visible !== view.target.visible) {
    const b = state.phase.startsWith('trial2');
    return say('visible', view.target.visible ? (b ? a.backB : a.back) : (b ? a.leftB : a.left));
  }
  return null;
}
