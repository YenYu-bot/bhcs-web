// Teaching script and view-models for the guided buoyancy lab (Prototype Technical Spec v1.0 §9).
// Every word a learner reads while the flow runs lives here, and every card the page draws is described here as a plain
// object shaped like the Component Spec contracts. This file has no DOM, changes no state, writes no storage, sends no
// analytics and does not import model.js. It also does no arithmetic: every number it shows (mass, volume, percent,
// density, which side is larger) is decided by the engine and arrives in `view.facts` or in an engine event; this file
// only puts it into a sentence.
//
// Until the concept screen the learner sees phenomena only: 浮起來 / 停在液體中 / 沉到底 / 水面下約 N%. The names of
// the idea (and the formula) live in CONCEPT_TEXT and conceptModel(), which refuses to answer before the concept phase.

const deepFreeze = (o) => {
  for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v);
  return Object.freeze(o);
};

export const COACH_NAME = '余老師';
export const LABELS = deepFreeze({ water: '水', brine: '濃鹽水', block: '方塊', wood: '大木塊', stone: '小石頭' });

/** The page's own name. The idea the lab is named after is not named until the concept screen. */
export const STATION_TITLE = '浮沉實驗';

export const STEPS = deepFreeze([
  { id: 'mission', number: '01', label: '接任務' },
  { id: 'experiment', number: '02', label: '動手做' },
  { id: 'notebook', number: '03', label: '研究手冊' },
  { id: 'challenge', number: '04', label: '挑戰題' },
]);

/** Coach messages the learner can meet before the concept screen. Keys are the coach's states; see reduceCoach(). */
export const MESSAGES = deepFreeze({
  welcome: { main: '物體很重，就一定會沉下去嗎？', sub: '接下來你會親手把東西放進水裡，自己找出答案。' },
  mission: { main: '桌上有一個水槽和一個方塊。方塊裡面可以放配重。', sub: '現在方塊放進水裡會浮起來。想辦法讓它停在水中，不浮也不沉。' },
  'trial1-float': { main: '方塊浮起來了。', sub: '想想看，要讓它停在水中，該怎麼調整？' },
  'trial1-sink': { main: '方塊沉到底了。', sub: '想想看，要讓它停在水中，該怎麼調整？' },
  'trial1-try': { main: '再試試看。', sub: '想想看，要讓它停在水中，該怎麼調整？' },
  'trial1-complete': { main: '方塊停在水中了。', sub: '看看天平上的質量。' },
  'trial1-recorded': { main: '第一筆證據有了。接下來只先換一件事。', sub: '把液體換成濃鹽水。' },
  'trial2-switch': { main: '好，這次我們先只換液體。', sub: '把同一個方塊放進去看看。' },
  'trial2-first': { main: '原本停在水中的方塊，現在浮起來了。', sub: '再找一次讓它停住的質量。' },
  'trial2-float': { main: '方塊浮起來了。', sub: '再找一次讓它停住的質量。' },
  'trial2-sink': { main: '方塊沉到底了。', sub: '再找一次讓它停住的質量。' },
  'trial2-try': { main: '再試試看。', sub: '再找一次讓它停住的質量。' },
  'trial2-complete': { main: '又停住了。', sub: '看看天平和液體，有什麼不同？' },
  'trial2-recorded': { main: '兩筆證據都有了。' },
  compare: { main: '把兩次的證據放在一起看。' },
  'compare-done': { main: '你剛才已經找到一個規律了。', sub: '換了液體，同一個方塊要改變質量，才能再次停在液體中。' },
  trial3: { main: '如果換成別的東西呢？', sub: '這次也放放看。' },
  'trial3-observed': { main: '木塊比石頭重，卻浮著；石頭比較輕，卻沉了。', sub: '這和前兩次有什麼不同？' },
});

/** The coach's message once the concept is allowed to be named. */
export const CONCEPT_MESSAGES = deepFreeze({
  concept: { main: '剛才幾次實驗，其實都在比較同一件事。', sub: '先看看是什麼。' },
  notebook: { main: '把你發現的整理成研究手冊。', sub: '選一種你喜歡的方式來完成。' },
  challenge: { main: '來挑戰看看。', sub: '你剛學到的，在新的情況下也成立嗎？' },
  'challenge-done': { main: '這題完成了。', sub: '可以往下走了。' },
  complete: { main: '你完成這一站了。', sub: '把你自己證明的事情看一遍。' },
});

/** Everything else the learner reads before the concept: headings, labels, hints, messages about the controls. */
export const TEXT = deepFreeze({
  stepNavLabel: '學習進度',
  dataTitle: '目前的實驗條件',
  evidenceTitle: '你的證據',
  compareTitle: '比較兩次的證據',
  compareHeads: { item: '項目', first: '第一次', second: '第二次', changed: '改變的', same: '保持相同' },
  compareFeedbackSuccess: '和你的紀錄一致。',
  hints: {
    1: '看看方塊在水裡的位置。',
    2: '浮起來時，可以試試增加質量；沉到底時，可以試試減少質量。',
    3: '每次只改一格，再放進去看看。',
  },
  input: { outsideTank: '要放進水槽裡才有結果。', ballastBlocked: '先把方塊拿出來，再調整配重。' },
  cta: {
    start: '開始實驗', begin: '動手試試看', record1: '記錄第一次結果', record2: '記錄第二次結果',
    compare: '比較兩次', continue: '繼續實驗', observed: '我觀察到了',
  },
  dataStates: { locked: '（固定）', changed: '（剛換）' },
  data: {
    liquid: '液體', blockVolume: '方塊體積', blockMass: '目前質量',
    wood: '大木塊', stone: '小石頭',
  },
  evidence: {
    first: '第一次紀錄完成 ✓', second: '第二次紀錄完成 ✓',
    liquid: '液體', volume: '方塊體積', stayMass: '停在液體中時的質量', stayNote: '方塊停在液體中。',
    mass: '質量', objectVolume: '體積', result: '結果',
  },
  compare: {
    liquidLabel: '液體', volumeLabel: '方塊體積', methodLabel: '放入方式', methodValue: '相同', criterionLabel: '判定', criterionValue: '停在液體中',
    stayMassLabel: '讓方塊停住所需質量',
    procedureNote: '先只換液體，再用相同方法重新測量。',
    notice: '這次改的是液體；其他條件保持相同。',
    q1: '換成濃鹽水後，讓方塊停在液體中所需的質量怎麼變？',
    q2: '原本停在水中的方塊放進濃鹽水後，結果是？',
    larger: '變大', smaller: '變小', same: '差不多',
    float: '浮起來', stay: '停在液體中', sink: '沉到底',
    nudge: { stayMass: '再看看兩次讓方塊停住的質量。', firstDrop: '回想你把方塊放進濃鹽水時看到了什麼。' },
  },
  status: {
    mission: '桌上有水槽、方塊和天平。',
    recorded: '兩筆結果都記錄好了。',
    shelfBoth: '大木塊和小石頭都在桌上。',
    shelfWood: '再把大木塊放進水裡看看。',
    shelfStone: '再把小石頭放進水裡看看。',
  },
  announce: { record1: '第一筆結果已記錄。', record2: '第二筆結果已記錄。' },
  storageUnavailable: '這台裝置不能儲存進度。',
});

/** Words that exist only from the concept screen on. conceptModel() is the single way they reach the page. */
export const CONCEPT_TEXT = deepFreeze({
  stationTitle: '浮沉與密度',
  title: '用你剛才的證據來看',
  densityCard: { id: 'density', title: '密度', body: ['同樣大小裡裝了多少質量，我們用『密度』來描述。'] },
  resultsCard: {
    id: 'results', title: '三種浮沉結果',
    body: [
      '物體的密度比液體小：浮在液面，只有一部分浸在液體中，叫做「漂浮」。',
      '物體的密度和液體一樣：停在液體中，叫做「懸浮」。',
      '物體的密度比液體大：沉到底，叫做「下沉」。',
    ],
  },
  formula: { heading: '密度怎麼算', expression: 'ρ = m / V', words: '密度 = 質量 ÷ 體積', note: '上面每一行，都是用你自己的質量和體積算出來的。' },
  densityUnit: 'g/cm³',
  densityOf: { block: '停在水中的方塊', brineBlock: '停在濃鹽水中的方塊', wood: '大木塊', stone: '小石頭' },
  named: { float: '漂浮', stay: '懸浮', sink: '下沉' },
  versus: { float: '<', stay: '=', sink: '>' },
  objectDensity: '的密度', liquidDensity: '的密度',
});

/** Words for the notebook, the challenges and the finish: all after the concept, so the formal names are fair game here. */
export const LATE_TEXT = deepFreeze({
  cta: { notebook: '進入研究手冊', challenge: '進入挑戰題', nextChallenge: '下一個挑戰', finish: '看看我完成了什麼', again: '再做一次' },
  notebook: {
    title: '我的研究手冊',
    evidenceHeading: '你的兩次實驗',
    levelsLegend: '選一種方式來完成',
    levels: [
      { id: 'A', title: '幫我整理', desc: '選出你剛才發現的關係。' },
      { id: 'B', title: '我自己說', desc: '用自己的話寫下來。' },
      { id: 'C', title: '我能提出證據', desc: '寫出你的證據，也想想哪裡不夠完整。' },
    ],
    levelA: {
      stems: {
        relationLiquid: { legend: '換成密度較大的液體後，讓同一個方塊停在液體中，需要的質量會……', options: [['larger', '變大'], ['smaller', '變小'], ['same', '一樣']] },
        relationWood: { legend: '木塊比石頭重，卻浮著，是因為木塊的……比水小。', options: [['mass', '質量'], ['volume', '體積'], ['density', '密度']] },
      },
      nudge: '再對照一下你剛才的實驗證據。',
      ready: '整理好了，可以進入挑戰題。',
    },
    levelB: { prompt: '用你自己的話，說說物體什麼時候會浮、什麼時候會沉。', placeholder: '寫下你的想法', help: '至少寫兩個字，就可以繼續。' },
    levelC: {
      q1: '你的哪一次實驗，讓你這樣想？',
      q2: '這個實驗哪裡可能不夠完整？',
      help: '兩欄都至少寫兩個字，就可以繼續。',
      ideasHeading: '想不到的話，可以對照看看：',
      ideas: ['只測了水和濃鹽水。', '配重一次增加 20 g，可能找不到更細的停住位置。', '只用了少數幾種物體。'],
    },
    given: { first: '第一次', second: '第二次', needs: '讓方塊停住需要' },
  },
  challenge: {
    generic: '剛才哪個結果變得更明顯？',
    count: '／3',
    titlePrefix: '挑戰 ',
    items: {
      1: {
        scenario: '剛才在水中能停住的 100 g 方塊，現在放進食用油。',
        steps: {
          'c1-outcome': {
            question: '結果最可能是？',
            options: [['float', '浮起來'], ['stay', '停在液體中'], ['sink', '沉到底']],
            success: '這個方塊的密度比食用油大，所以會沉到底。',
            hint: '想想第二次實驗：液體的密度變大時，原本停在水中的方塊浮起來了。現在換成密度比水小的食用油，結果會怎樣？',
          },
        },
      },
      2: {
        scenario: '一個 80 g、100 cm³ 的方塊放進水裡。',
        steps: {
          'c2-where': {
            question: '靜止後最可能在哪裡？',
            options: [['all-out', '整顆在水面上'], ['under-80', '約 80% 在水面下'], ['stay', '停在水中'], ['sink', '沉到底']],
            success: '對，約 80% 在水面下，還有一部分露在水面上。',
            hint: '回想第一次實驗：80 g 的方塊放進水裡時，大約有多少比例在水面下？',
          },
          'c2-brine': {
            question: '如果換成濃鹽水，在液面下的比例會……',
            options: [['more', '變大'], ['less', '變小'], ['same', '不變']],
            success: '濃鹽水的密度比水大，方塊浸入的比例會變小。',
            hint: '想想第二次實驗：換成濃鹽水後，原本停在水中的方塊浮起來了。',
          },
        },
      },
      3: {
        scenario: '同一張鋁箔，揉成小球會沉，折成小船卻能浮。',
        steps: {
          'c3-reason': {
            question: '哪個說法最合理？',
            options: [
              ['mass-less', '鋁箔折成船以後質量變小了。'],
              ['volume-spread', '折成船後，鋁箔和裡面的空氣一起占了更大的整體體積，同樣的質量分布在更大的體積中，所以整體平均密度變小。'],
              ['boat-shape-only', '水只會托住船形的東西。'],
              ['spread-out', '東西攤得越開就越會浮。'],
            ],
            success: '折成船後，鋁箔和裡面的空氣一起占了更大的整體體積；同樣的質量分布在更大的體積中，所以整體平均密度變小。',
            hint: '質量沒有變，那什麼變了？',
          },
        },
      },
    },
  },
  complete: {
    heading: '這一站完成了',
    intro: '你今天自己證明了：',
    claims: [
      '同一個方塊換成濃鹽水後，要增加更多內部配重，才會停在液體中。',
      '300 g 的木塊比 120 g 的石頭重，卻是木塊浮起、石頭沉底，所以不能只看總質量判斷浮沉。',
      '當物體和液體的密度相同時，物體會停在液體中；要判斷浮沉，要比較物體和液體的密度。',
    ],
    link: { href: '../buoyancy-density-lab.html', label: '自由探索／精確數值' },
  },
  announce: { complete: '這一站完成了。' },
});

// ---- small formatters (no arithmetic: they place already-decided numbers into words) -----------------------------

const unknown = (what, value) => { throw new RangeError(`script: unknown ${what} (${String(value)})`); };
const labelOf = (id) => LABELS[id] ?? unknown('label', id);
/** Densities arrive as plain numbers such as 0.6 or 1.2; one decimal place is how the lesson writes them. */
const formatDensity = (d) => d.toFixed(1);
export const formatMass = (g) => `${g} g`;
export const formatVolume = (cm3) => `${cm3} cm³`;
export const formatPercent = (p) => `${p}%`;
export const massLabel = (g) => `質量 ${g} g`;

/** One sentence about what the learner just saw. Float carries the engine's whole-number immersion percent. */
function resultText(objectId, outcome, percent) {
  const who = labelOf(objectId);
  if (outcome === 'float') return `${who}浮起來了，約 ${percent}% 在水面下。`;
  if (outcome === 'stay') return `${who}停在液體中了。`;
  if (outcome === 'sink') return `${who}沉到底了。`;
  return unknown('outcome', outcome);
}
const phenomenon = (outcome, percent, liquidId) => {
  if (outcome === 'float') return `浮起來（約 ${percent}% 在水面下）`;
  if (outcome === 'stay') return liquidId ? `停在${labelOf(liquidId)}中` : TEXT.compare.stay;
  if (outcome === 'sink') return TEXT.compare.sink;
  return unknown('outcome', outcome);
};

// ---- screens, steps, calls to action ------------------------------------------------------------------------------

const BENCH_SCREEN = new Set([
  'mission', 'trial1-test', 'trial1-complete', 'trial1-recorded', 'trial2-switch-liquid', 'trial2-test', 'trial2-complete',
  'trial2-recorded', 'trial3-drop', 'trial3-observed',
]);
const CONCEPT_PHASES = new Set(['concept', 'notebook', 'challenge-1', 'challenge-2', 'challenge-3', 'complete']);

/** Which screen shows, which heading names it, and where focus may go if the control the learner was on goes away. */
export function screenFor(state) {
  const phase = state.phase;
  if (phase === 'welcome') return { id: 'welcome', headingId: 'bg-welcome-title', stepId: 'mission', focusTargets: ['#bg-cta', '#bg-welcome-title'] };
  if (BENCH_SCREEN.has(phase)) {
    return { id: 'bench', headingId: 'bg-heading', stepId: stepFor(state), focusTargets: ['[data-bg-object]', 'input[data-bg-liquid]', '#bg-cta', '#bg-heading'] };
  }
  if (phase === 'compare') return { id: 'compare', headingId: 'bg-compare-title', stepId: 'experiment', focusTargets: ['[data-bg-compare]', '#bg-cta', '#bg-compare-title'] };
  if (phase === 'concept') return { id: 'concept', headingId: 'bg-concept-title', stepId: 'experiment', focusTargets: ['#bg-cta', '#bg-concept-title'] };
  if (phase === 'notebook') return { id: 'notebook', headingId: 'bg-notebook-title', stepId: 'notebook', focusTargets: ['#bg-cta', '#bg-notebook-title'] };
  if (phase === 'complete') return { id: 'complete', headingId: 'bg-complete-title', stepId: 'challenge', focusTargets: ['#bg-cta', '#bg-complete-title'] };
  return { id: 'challenge', headingId: 'bg-challenge-title', stepId: 'challenge', focusTargets: ['[data-bg-option]', '#bg-cta', '#bg-challenge-title'] };
}

/** The name at the top of the page: neutral until the concept, then the lab's full name. */
export const stationTitleFor = (state) => (CONCEPT_PHASES.has(state.phase) ? CONCEPT_TEXT.stationTitle : STATION_TITLE);

/** The step the four-step list marks as current. */
export function stepFor(state) {
  const phase = state.phase;
  if (phase === 'welcome' || phase === 'mission') return 'mission';
  if (phase === 'notebook') return 'notebook';
  if (phase === 'challenge-1' || phase === 'challenge-2' || phase === 'challenge-3' || phase === 'complete') return 'challenge';
  return 'experiment';
}
export const stepNavModel = (state) => ({ steps: STEPS, currentStep: stepFor(state) });

/** The one main button, or null. `action` is the engine action the station dispatches when it is pressed. */
export function ctaFor(state, view) {
  const label = TEXT.cta;
  switch (state.phase) {
    case 'welcome': return { label: label.start, action: { type: 'START' }, enabled: true };
    case 'mission': return { label: label.begin, action: { type: 'BEGIN' }, enabled: true };
    case 'trial1-complete': return { label: label.record1, action: { type: 'RECORD_TRIAL', trial: 1 }, enabled: view.recordEnabled === true };
    case 'trial2-complete': return { label: label.record2, action: { type: 'RECORD_TRIAL', trial: 2 }, enabled: view.recordEnabled === true };
    case 'trial2-recorded': return { label: label.compare, action: { type: 'CONTINUE' }, enabled: true };
    case 'compare': return { label: label.continue, action: { type: 'CONTINUE' }, enabled: view.compare?.allCorrect === true };
    case 'trial3-observed': return { label: label.observed, action: { type: 'CONTINUE' }, enabled: true };
    case 'concept': return { label: LATE_TEXT.cta.notebook, action: { type: 'CONTINUE' }, enabled: true };
    case 'notebook': return { label: LATE_TEXT.cta.challenge, action: { type: 'CONTINUE' }, enabled: view.notebook?.ready === true };
    case 'challenge-1': case 'challenge-2':
      return { label: LATE_TEXT.cta.nextChallenge, action: { type: 'CONTINUE' }, enabled: view.challenge?.allCorrect === true };
    case 'challenge-3': return { label: LATE_TEXT.cta.finish, action: { type: 'CONTINUE' }, enabled: view.challenge?.allCorrect === true };
    case 'complete': return { label: LATE_TEXT.cta.again, action: { type: 'RESTART' }, enabled: true };
    default: return null;
  }
}

// ---- the coach ------------------------------------------------------------------------------------------------------

const TRIAL1_KEYS = new Set(['mission', 'trial1-float', 'trial1-sink', 'trial1-try', 'trial1-complete']);
const TRIAL2_KEYS = new Set(['trial2-first', 'trial2-float', 'trial2-sink', 'trial2-try', 'trial2-complete']);
const lastObservation = (result) => (result && result.accepted ? result.events.filter((e) => e.type === 'observation').at(-1) ?? null : null);

function coachKeyFor(prevKey, result, state, view) {
  const obs = lastObservation(result);
  switch (state.phase) {
    case 'welcome': case 'mission': return state.phase;
    case 'trial1-test': case 'trial1-complete': {
      if (obs?.context === 'trial1') return obs.outcome === 'stay' ? 'trial1-complete' : `trial1-${obs.outcome}`;
      if (TRIAL1_KEYS.has(prevKey)) return prevKey;                  // nothing new was seen: the learner keeps what they last saw
      if (state.phase === 'trial1-complete') return 'trial1-complete';
      return state.dropCount.trial1 === 0 ? 'mission' : 'trial1-try';
    }
    case 'trial1-recorded': return 'trial1-recorded';
    case 'trial2-switch-liquid': return view.liquidId === 'brine' ? 'trial2-switch' : 'trial1-recorded';
    case 'trial2-test': case 'trial2-complete': {
      if (obs?.context === 'trial2-first') return obs.outcome === 'float' ? 'trial2-first' : `trial2-${obs.outcome}`;
      if (obs?.context === 'trial2') return obs.outcome === 'stay' ? 'trial2-complete' : `trial2-${obs.outcome}`;
      if (TRIAL2_KEYS.has(prevKey)) return prevKey;
      return state.phase === 'trial2-complete' ? 'trial2-complete' : state.trial2.firstDrop ? 'trial2-try' : 'trial2-switch';
    }
    case 'trial2-recorded': return 'trial2-recorded';
    case 'compare': return view.compare?.allCorrect ? 'compare-done' : 'compare';
    case 'trial3-drop': return 'trial3';
    case 'trial3-observed': return 'trial3-observed';
    case 'concept': return 'concept';
    case 'notebook': return 'notebook';
    case 'challenge-1': case 'challenge-2': case 'challenge-3': return view.challenge?.allCorrect ? 'challenge-done' : 'challenge';
    case 'complete': return 'complete';
    default: return unknown('phase', state.phase);
  }
}

/**
 * reduceCoach(previous, result, state, view) → { key, name, main, sub? }
 * `result` is what reduce() just returned (null at the start). The coach answers what the learner just saw, so it follows
 * the engine's observation events and keeps its last message when nothing new was seen.
 */
export function reduceCoach(previous, result, state, view) {
  const key = coachKeyFor(previous?.key ?? null, result, state, view);
  const message = MESSAGES[key] ?? CONCEPT_MESSAGES[key] ?? unknown('coach message', key);
  return message.sub === undefined ? { key, name: COACH_NAME, main: message.main } : { key, name: COACH_NAME, main: message.main, sub: message.sub };
}

/** The extra nudge for the trial in progress; the engine decides the level, this picks the words. */
export function hintFor(view) {
  const level = view.hint?.level ?? 0;
  return level > 0 ? TEXT.hints[level] ?? unknown('hint level', level) : null;
}

export const invalidDropMessage = (reason) => (reason === 'outside-tank' ? TEXT.input.outsideTank : '');
export const blockedMessage = (control) => (control === 'add-ballast' || control === 'remove-ballast' ? TEXT.input.ballastBlocked : '');

// ---- status ---------------------------------------------------------------------------------------------------------

const OUTCOME_ICON = { float: '↑', stay: '✓', sink: '↓' };
const OUTCOME_KIND = { float: 'progress', stay: 'success', sink: 'progress' };

function inTankFacts(view) {
  const id = view.tank.objectId;
  if (id === 'block') return view.facts.currentBlock;
  return id === 'wood' || id === 'stone' ? view.facts[id] : null;
}

/** What the bench shows right now, as one plain sentence about the phenomenon. null when no bench is on screen. */
export function statusModel(state, view) {
  if (!BENCH_SCREEN.has(state.phase)) return null;
  const id = view.tank.objectId;
  const facts = id === null ? null : inTankFacts(view);
  if (facts) return { kind: OUTCOME_KIND[facts.outcome], icon: OUTCOME_ICON[facts.outcome], text: resultText(id, facts.outcome, facts.immersionPercent) };
  const neutral = (text) => ({ kind: 'neutral', icon: '○', text });
  switch (state.phase) {
    case 'mission': return neutral(TEXT.status.mission);
    case 'trial2-recorded': return neutral(TEXT.status.recorded);
    case 'trial3-drop': case 'trial3-observed': {
      const { wood, stone } = view.trial3.tried;
      if (wood && !stone) return neutral(TEXT.status.shelfStone);
      if (stone && !wood) return neutral(TEXT.status.shelfWood);
      return neutral(TEXT.status.shelfBoth);
    }
    default: return neutral(`${labelOf('block')}在桌上，槽裡是${labelOf(view.liquidId)}。`);
  }
}

// ---- data and evidence ----------------------------------------------------------------------------------------------

/** "What are the conditions right now?" Shown beside the bench. */
export function dataModel(state, view) {
  if (!BENCH_SCREEN.has(state.phase) || state.phase === 'trial2-recorded') return null;
  const t = TEXT.data;
  if (state.phase === 'trial3-drop' || state.phase === 'trial3-observed') {
    const { wood, stone } = view.facts.shelf;
    return {
      conditions: [
        { label: t.liquid, value: labelOf('water'), state: 'locked' },
        { label: t.wood, value: `${formatMass(wood.massG)}、${formatVolume(wood.volumeCm3)}`, state: 'locked' },
        { label: t.stone, value: `${formatMass(stone.massG)}、${formatVolume(stone.volumeCm3)}`, state: 'locked' },
      ],
      footerSlots: [],
    };
  }
  const block = view.facts.currentBlock;
  const liquidState = state.phase.startsWith('trial2') && view.liquidId === 'brine' ? 'changed' : view.controls.liquid.locked ? 'locked' : 'normal';
  return {
    conditions: [
      { label: t.liquid, value: labelOf(view.liquidId), state: liquidState },
      { label: t.blockVolume, value: formatVolume(block.volumeCm3), state: 'locked' },
      { label: t.blockMass, value: formatMass(block.massG), state: view.controls.ballast.locked ? 'locked' : 'normal' },
    ],
    footerSlots: [],
  };
}

function recordItem(n, record, recordFacts, firstDrop) {
  const e = TEXT.evidence;
  const rows = [
    { label: e.liquid, value: labelOf(record.liquidId) },
    { label: e.volume, value: formatVolume(recordFacts.volumeCm3) },
    { label: e.stayMass, value: formatMass(recordFacts.stayMassG) },
  ];
  if (firstDrop) rows.push({ label: `一開始放入的 ${formatMass(firstDrop.massG)} 方塊`, value: phenomenon(firstDrop.outcome, firstDrop.immersionPercent, null) });
  return { id: `record-${n}`, title: n === 1 ? e.first : e.second, rows, note: e.stayNote };
}
function objectItem(id, facts) {
  const e = TEXT.evidence;
  return {
    id,
    title: labelOf(id),
    rows: [
      { label: e.mass, value: formatMass(facts.massG) },
      { label: e.objectVolume, value: formatVolume(facts.volumeCm3) },
      { label: e.result, value: phenomenon(facts.outcome, facts.immersionPercent, null) },
    ],
  };
}

/** "What did I see?" Only what the learner recorded or watched; never a theoretical value. */
export function evidenceModel(state, view) {
  const items = [];
  const { record1, record2, trial2FirstDrop, wood, stone } = view.facts;
  if (record1 && state.records[1]) items.push(recordItem(1, state.records[1], record1, null));
  if (record2 && state.records[2]) items.push(recordItem(2, state.records[2], record2, trial2FirstDrop));
  if (wood) items.push(objectItem('wood', wood));
  if (stone) items.push(objectItem('stone', stone));
  return { items };
}

// ---- compare --------------------------------------------------------------------------------------------------------

const Q = TEXT.compare;
const QUESTION_DEFS = [
  { id: 'stayMass', text: Q.q1, options: [['larger', Q.larger], ['smaller', Q.smaller], ['same', Q.same]] },
  { id: 'firstDrop', text: Q.q2, options: [['float', Q.float], ['stay', Q.stay], ['sink', Q.sink]] },
];

function feedbackFor(id, status) {
  if (status === 'correct') return { kind: 'success', text: TEXT.compareFeedbackSuccess };
  if (status === 'incorrect') return { kind: 'nudge', text: Q.nudge[id] };
  return null;
}

/** EvidenceComparisonModel + notice + questions. It holds the learner's choice and a feedback sentence, never an answer. */
export function compareModel(state, view) {
  const { record1, record2, trial2FirstDrop } = view.facts;
  if (!view.compare || !record1 || !record2 || !trial2FirstDrop || !state.records[1] || !state.records[2]) return null;
  const from = labelOf(state.records[1].liquidId), to = labelOf(state.records[2].liquidId);
  return {
    independentVariable: { label: Q.liquidLabel, from, to },
    controlledVariables: [
      { label: Q.volumeLabel, value: formatVolume(record1.volumeCm3) },
      { label: Q.methodLabel, value: Q.methodValue },
      { label: Q.criterionLabel, value: Q.criterionValue },
    ],
    observedResponse: [
      {
        label: `原本 ${formatMass(trial2FirstDrop.massG)} 的方塊`,
        first: phenomenon(record1.outcome, record1.immersionPercent, state.records[1].liquidId),
        second: phenomenon(trial2FirstDrop.outcome, trial2FirstDrop.immersionPercent, state.records[2].liquidId),
      },
      { label: Q.stayMassLabel, first: formatMass(record1.stayMassG), second: formatMass(record2.stayMassG) },
    ],
    procedureNote: Q.procedureNote,
    notice: { kind: 'info', text: Q.notice },
    questions: QUESTION_DEFS.map((def) => {
      const answer = view.compare.questions[def.id];
      return {
        id: def.id,
        text: def.text,
        options: def.options.map(([value, label]) => ({ value, label })),
        selectedValue: answer.selected,
        disabled: answer.status === 'correct',
        feedback: feedbackFor(def.id, answer.status),
      };
    }),
  };
}

// ---- concept --------------------------------------------------------------------------------------------------------

const equation = (massG, volumeCm3, density) => `${formatMass(massG)} ÷ ${formatVolume(volumeCm3)} = ${formatDensity(density)} ${CONCEPT_TEXT.densityUnit}`;

/** The concept screen. null until the concept phase, and null if the learner's evidence is not all there. */
export function conceptModel(state, view) {
  const c = view.facts.concept;
  if (!CONCEPT_PHASES.has(state.phase) || !c) return null;
  const T = CONCEPT_TEXT;
  const by = Object.fromEntries(c.map((row) => [row.id, row]));
  const names = { 'block-water': T.densityOf.block, 'block-brine': T.densityOf.brineBlock, wood: T.densityOf.wood, stone: T.densityOf.stone };
  const evidence = c.map((row) => ({ id: row.id, label: names[row.id], text: equation(row.massG, row.volumeCm3, row.density) }));
  const { record1, wood, stone } = view.facts;
  const water = labelOf('water');
  const versus = (id, who, density, outcome, liquidDensity) =>
    ({ id, text: `${who}${T.objectDensity} ${formatDensity(density)} ${T.versus[outcome]} ${water}${T.liquidDensity} ${formatDensity(liquidDensity)} → ${T.named[outcome]}` });
  return {
    heading: T.title,
    cards: [
      { id: T.densityCard.id, title: T.densityCard.title, body: [...T.densityCard.body], evidence },
      {
        id: T.resultsCard.id,
        title: T.resultsCard.title,
        body: [...T.resultsCard.body],
        evidence: [
          versus('wood', labelOf('wood'), by.wood.density, wood.outcome, wood.liquidDensity),
          versus('block-water', T.densityOf.block, by['block-water'].density, record1.outcome, record1.liquidDensity),
          versus('stone', labelOf('stone'), by.stone.density, stone.outcome, stone.liquidDensity),
        ],
      },
    ],
    formula: {
      heading: T.formula.heading,
      expression: T.formula.expression,
      lines: [{ text: T.formula.words, found: false }, ...evidence.map((row) => ({ text: `${row.label}：${row.text}`, found: true }))],
      note: T.formula.note,
    },
  };
}


// ---- notebook, challenges, finish -----------------------------------------------------------------------------------

const written = (text) => typeof text === 'string' && text.trim().length > 0;

/**
 * The notebook. Its evidence summary is the compare model without the questions. `ready` is the engine's; this only says
 * what was chosen or written so far and which hint-free nudge to show when the two chosen relations do not yet fit the records.
 */
export function notebookModel(state, view) {
  if (state.phase !== 'notebook') return null;
  const compare = compareModel(state, view);
  if (!compare) return null;
  const N = LATE_TEXT.notebook, c = state.conclusion, A = N.levelA;
  const { record1, record2 } = view.facts;
  const stem = (id) => ({
    id,
    legend: A.stems[id].legend,
    options: A.stems[id].options.map(([value, label]) => ({ value, label })),
    selectedValue: c[id],
  });
  const bothChosen = c.relationLiquid !== null && c.relationWood !== null;
  return {
    heading: N.title,
    evidenceHeading: N.evidenceHeading,
    evidenceSummary: {
      independentVariable: compare.independentVariable,
      controlledVariables: compare.controlledVariables,
      observedResponse: compare.observedResponse,
      procedureNote: compare.procedureNote,
    },
    levelsLegend: N.levelsLegend,
    levels: N.levels.map((l) => ({ ...l })),
    selectedLevel: c.level,
    levelA: {
      given: [
        `${N.given.first}（${labelOf(state.records[1].liquidId)}）：${N.given.needs} ${formatMass(record1.stayMassG)}。`,
        `${N.given.second}（${labelOf(state.records[2].liquidId)}）：${N.given.needs} ${formatMass(record2.stayMassG)}。`,
      ],
      stems: [stem('relationLiquid'), stem('relationWood')],
      nudge: bothChosen && !view.notebook.ready ? A.nudge : null,
    },
    levelB: { prompt: N.levelB.prompt, placeholder: N.levelB.placeholder, help: N.levelB.help, value: c.freeText },
    levelC: {
      q1: { label: N.levelC.q1, value: c.evidenceText },
      q2: { label: N.levelC.q2, value: c.limitationText },
      help: N.levelC.help,
      ideasHeading: N.levelC.ideasHeading,
      ideas: [...N.levelC.ideas],
      showIdeas: written(c.limitationText),
    },
    ready: view.notebook.ready === true,
    readyNote: view.notebook.ready === true ? A.ready : null,
  };
}

const HINT_FROM_ATTEMPT = 2;
/** What a step says about the learner's tries so far: nothing, a confirmation, a generic nudge, or (from the second try) the step's hint. */
function challengeFeedback(challengeId, stepId, { correct, attempts }) {
  const item = LATE_TEXT.challenge.items[challengeId]?.steps[stepId] ?? unknown('challenge step', stepId);
  if (correct) return { kind: 'success', text: item.success };
  if (attempts < 1) return null;
  return attempts < HINT_FROM_ATTEMPT ? { kind: 'nudge', text: LATE_TEXT.challenge.generic } : { kind: 'hint', text: item.hint };
}

/** One challenge: its scenario, and each step with what the engine says about it (unlocked, choice, attempts, solved). No answer. */
export function challengeModel(state, view) {
  if (!view.challenge) return null;
  const id = Number(state.phase.slice(-1));
  const C = LATE_TEXT.challenge, item = C.items[id];
  return {
    id,
    title: `${C.titlePrefix}${id}${C.count}`,
    scenario: item.scenario,
    count: 3,
    steps: view.challenge.steps.map((step) => ({
      id: step.id,
      question: item.steps[step.id].question,
      options: item.steps[step.id].options.map(([value, label]) => ({ value, label })),
      unlocked: step.unlocked,
      choice: step.choice,
      attempts: step.attempts,
      correct: step.correct,
      feedback: challengeFeedback(id, step.id, step),
    })),
    allCorrect: view.challenge.allCorrect,
  };
}

/** The finish: three fixed claims, reachable only by getting through every step before it. */
export function completeModel(state) {
  if (state.phase !== 'complete') return null;
  const C = LATE_TEXT.complete;
  return { heading: C.heading, intro: C.intro, claims: [...C.claims], link: { ...C.link } };
}

// ---- announcements --------------------------------------------------------------------------------------------------

/**
 * announcementFor(result, state, view, action) → null | { id, text }
 * The one thing a screen reader is told. Ids come from the engine's own event ids (so two sightings that read the same
 * are still two announcements); the compare answers have no engine event and are named by the question and the choice.
 */
export function announcementFor(result, state, view, action = null) {
  if (!result || !result.accepted) return null;
  const hint = result.events.find((e) => e.type === 'hint');
  const obs = result.events.filter((e) => e.type === 'observation').at(-1);
  if (obs) {
    const said = resultText(obs.objectId, obs.outcome, obs.immersionPercent);
    return { id: obs.id, text: hint ? `${said} ${TEXT.hints[hint.level] ?? unknown('hint level', hint.level)}` : said };
  }
  const written = result.events.find((e) => e.type === 'record-written' && (e.trial === 1 || e.trial === 2));
  if (written) return { id: written.id, text: written.trial === 1 ? TEXT.announce.record1 : TEXT.announce.record2 };
  const answered = result.events.find((e) => e.type === 'challenge-answered');
  if (answered) {
    const fb = challengeFeedback(answered.challengeId, answered.step, answered);
    return { id: `challenge-${answered.challengeId}-${answered.step}-${answered.attempts}`, text: fb.text };
  }
  if (result.transitions.includes('complete')) return { id: 'complete', text: LATE_TEXT.announce.complete };
  if (action?.type === 'SAVE_CONCLUSION' && state.phase === 'notebook' && ('relationLiquid' in action.fields || 'relationWood' in action.fields)) {
    const c = state.conclusion;
    if (c.relationLiquid === null || c.relationWood === null) return null;
    return { id: `notebook-${c.relationLiquid}-${c.relationWood}`, text: view.notebook.ready ? LATE_TEXT.notebook.levelA.ready : LATE_TEXT.notebook.levelA.nudge };
  }
  if (action?.type === 'ANSWER_COMPARE') {
    const model = compareModel(state, view);
    const q = model?.questions.find((x) => x.id === action.question);
    if (!q?.feedback) return null;
    const done = view.compare.allCorrect ? ` ${MESSAGES['compare-done'].main}${MESSAGES['compare-done'].sub}` : '';
    return { id: `compare-${action.question}-${action.answer}`, text: `${q.feedback.text}${done}` };
  }
  return null;
}
