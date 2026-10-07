// Teaching script and evidence content for the guided optics lab (Spec v1.2 §33–§51, §8.2, §8.4).
// Pure functions: engine state/view/events in → what 余老師 says, what the evidence card shows, which CTA is offered.
// Student-facing numbers come only from the learner's own records (observedScreenPosition); theoreticalV appears
// only in the concept stage, after the experiments, as "the formula result" next to what the learner found.
import { compareRecords } from './engine.js';

export const formatCm = (x) => (Number.isInteger(x) ? String(x) : String(+x.toFixed(1)));
const SIGN = (x) => (x < 0 ? '−' : '') + formatCm(Math.abs(x));
const SIZE_WORD = { smaller: '較小', larger: '較大', same: '一樣大' };
const ZONE_WORD = { near: '近處', middle: '中間', far: '遠處' };
const VAR_WORD = { f: '焦距', u: '物距' };

const M = (main, sub) => ({ main, sub: sub ?? null });
/** Every line 余老師 can say. Tone rules (Spec §8.4): no「錯了」「正確答案是」; ask what changed instead of judging. */
export const MESSAGES = Object.freeze({
  welcome: M('為什麼投影機的屏幕放錯位置，畫面就會模糊？'),
  mission: M('桌上有一支蠟燭、一片凸透鏡和一面屏幕。現在屏幕上的影像很模糊。', '把屏幕移到影像最清楚的位置。'),
  find1: M('把屏幕移到影像最清楚的位置。'),
  findStart: M('試試看哪個位置比較清楚。'),
  near: M('快找到了。'),
  wrongDirection: M('剛才影像變得更模糊了。', '試試另一個方向。'),
  hint1: M('看看屏幕上的影像是變清楚，還是變模糊。'),
  hint2: M('如果越移越模糊，可以試試另一個方向。'),
  hint3Left: M('清楚的位置就在你目前位置的左邊。'),
  hint3Right: M('清楚的位置就在你目前位置的右邊。'),
  complete1: M('就是這裡。影像現在最清楚。', '按下「記錄第一次結果」。'),
  moveCandle: M('第一筆證據有了。接下來只改一個地方。', '把蠟燭移到離透鏡 15 cm 的位置。'),
  moveCandlePlain: M('把蠟燭移到離透鏡 15 cm 的位置。'),
  find2: M('好，這次只有物距改變。', '原本清楚的影像現在模糊了。蠟燭的位置改了，原本的屏幕位置也不再清楚。再找一次。'),
  complete2: M('影像又清楚了。', '再看看影像的大小和方向，有什麼變化？'),
  alreadyRecorded: M('這筆結果已經記好了。', '接下來看看只改變蠟燭位置後會發生什麼。'),
  compare: M('把兩次的證據放在一起看。'),
  compareRetry: M('剛才哪個結果變得更明顯？', '再看看兩次的清楚像距和影像大小。'),
  compareDone: M('你剛才已經找到一個規律了。', '在還能形成實像的情況下，物體往焦點靠近時，清楚影像的位置會往更遠處移，而且影像會變大。'),
  moveCandle3: M('如果再把蠟燭往透鏡靠近，會一直有清楚的屏幕位置嗎？', '把蠟燭移到 5 cm。'),
  search: M('這次也試著找找看。'),
  searchTwo: M('目前還沒有找到清楚的位置。'),
  searchDone: M('你已經檢查過近、中、遠的位置了。', '看起來問題可能不在你找得不夠仔細。這次可能真的沒有能接到清楚影像的位置。'),
  noReal: M('不是你找得不夠仔細。這一次，屏幕本來就接不到清楚實像。', '但是如果不用屏幕，而是直接透過透鏡看呢？'),
  viewThrough: M('你現在看得到一個正立、放大的蠟燭。', '可是剛才屏幕怎麼都接不到它。這和前兩次有什麼不同？'),
  naming: M('這種只能透過透鏡看到、卻不能直接接在屏幕上的像，叫做「虛像」。'),
  concept: M('剛才三次實驗，其實分成兩種像。'),
  placeholder: M('研究手冊和挑戰題在下一批完成。'),
});
export const searchProgress = (unexplored) => M(`你還沒檢查過${unexplored.map((z) => ZONE_WORD[z]).join('、')}的位置。`);

const ENTRY = {
  welcome: 'welcome', mission: 'mission', 'trial1-find-screen': 'find1', 'trial1-complete': 'complete1', 'trial2-move-object': 'moveCandlePlain',
  'trial2-find-screen': 'find2', 'trial2-complete': 'complete2', compare: 'compare', 'trial3-move-object': 'moveCandle3',
  'trial3-search-screen': 'search', 'trial3-no-real-screen-image': 'noReal', 'trial3-view-through-lens': 'viewThrough', concept: 'concept',
  notebook: 'placeholder', 'challenge-1': 'placeholder', 'challenge-2': 'placeholder', 'challenge-3': 'placeholder', complete: 'placeholder',
};
const FIND_PHASES = new Set(['trial1-find-screen', 'trial2-find-screen']);

/**
 * reduceCoach(prev, { state, view, events, transitions, ui })
 * prev is { id, main, sub } or null. Returns the next message; it only changes on a transition, an engine event, or when
 * "almost there" starts/ends, so a live region bound to it does not re-announce on every drag step.
 */
export function reduceCoach(prev, { state, view, events = [], transitions = [], ui = {} }) {
  const make = (id, msg) => ({ id, ...msg });
  if (ui.naming && state.phase === 'trial3-view-through-lens') return prev?.id === 'naming' ? prev : make('naming', MESSAGES.naming);
  if (transitions.length || !prev) {
    let id = ENTRY[state.phase] ?? 'placeholder';
    if (state.phase === 'trial2-move-object' && events.some((e) => e.type === 'record-written' && e.trial === 1)) id = 'moveCandle';
    return make(id, MESSAGES[id]);
  }
  const ev = (t) => events.find((e) => e.type === t);
  const find = FIND_PHASES.has(state.phase), search = state.phase === 'trial3-search-screen';
  let id = null, msg = null;
  const hint = ev('hint');
  if (state.phase === 'compare') {
    const c = view.compare;
    if (c?.allCorrect) id = 'compareDone'; else if (c?.answered) id = 'compareRetry'; else id = 'compare';
    return prev.id === id ? prev : make(id, MESSAGES[id]);
  }
  if (ev('result-already-recorded')) id = 'alreadyRecorded';
  else if (ev('wrong-direction')) id = 'wrongDirection';
  else if (hint) {
    if (hint.kind === 'search-progress') { id = 'searchProgress'; msg = searchProgress(hint.unexplored); }
    else if (hint.kind === 'direction') id = hint.direction === 'left' ? 'hint3Left' : 'hint3Right';
    else id = hint.level === 1 ? 'hint1' : 'hint2';
  } else if (ev('zones-complete')) id = 'searchDone';
  else if (ev('zones-explored')) id = 'searchTwo';
  else if (ev('first-screen-move')) id = search ? 'search' : 'findStart';
  else if (find) {
    const near = view.clarity.effectiveClarityLevel === 2 && view.lensState.imageType === 'real' && view.lensState.projectionWithinBench;
    if (near && prev.id !== 'near') id = 'near';
    else if (!near && prev.id === 'near') id = 'findStart';
  }
  if (!id) return prev;
  const next = make(id, msg ?? MESSAGES[id]);
  return next.id === prev.id && next.main === prev.main ? prev : next;
}

export function screenFor(state) {
  if (state.phase === 'welcome') return 'welcome';
  if (state.phase === 'compare') return 'compare';
  if (state.phase === 'concept') return 'concept';
  if (['notebook', 'challenge-1', 'challenge-2', 'challenge-3', 'complete'].includes(state.phase)) return 'placeholder';
  return 'bench';
}
export const stepFor = (phase) => (phase === 'welcome' || phase === 'mission' ? 'mission' : phase === 'notebook' ? 'notebook'
  : /^(challenge|complete)/.test(phase) ? 'challenge' : 'bench');

/** The one main button for the current moment, or null. */
export function ctaFor(state, view, ui = {}) {
  const rec = (n) => ({ label: `記錄第${n === 1 ? '一' : '二'}次結果`, action: 'RECORD', enabled: view.recordEnabled });
  switch (state.phase) {
    case 'welcome': return { label: '開始實驗', action: 'START', enabled: true };
    case 'mission': return { label: '動手試試看', action: 'BEGIN', enabled: true };
    case 'trial1-find-screen': case 'trial1-complete': return rec(1);
    case 'trial2-find-screen': case 'trial2-complete': return rec(2);
    case 'compare': return { label: '繼續', action: 'CONTINUE', enabled: view.compare?.allCorrect === true };
    case 'trial3-search-screen': return { label: '我找不到清楚實像', action: 'CONFIRM_NO_REAL_IMAGE', enabled: view.search.ctaUnlocked };
    case 'trial3-no-real-screen-image': return { label: '從透鏡後面看', action: 'VIEW_THROUGH_LENS', enabled: true };
    case 'trial3-view-through-lens': return ui.naming ? { label: '看看這兩種像', action: 'CONTINUE', enabled: true } : { label: '我觀察到了', action: 'UI_NAMING', enabled: true };
    case 'concept': return { label: '進入研究手冊', action: 'CONTINUE', enabled: true };
    default: return null;
  }
}

/** "已記錄的實驗" list: only what the learner recorded. */
export function evidenceList(records) {
  const out = [];
  for (const t of [1, 2]) {
    const r = records[t];
    if (r) out.push({ trial: t, text: `第${t === 1 ? '一' : '二'}次紀錄完成 ✓`, detail: `物距 ${formatCm(r.u)} cm，清楚像距 ${formatCm(r.observedScreenPosition)} cm` });
  }
  if (records[3]) out.push({ trial: 3, text: '第三次紀錄完成 ✓', detail: `物距 ${formatCm(records[3].u)} cm，屏幕上找不到清楚實像` });
  return out;
}

/** Evidence Compare Card, built from the two records only. Never contains theoreticalV. */
export function compareCard(records) {
  const a = records[1], b = records[2];
  if (!a || !b) return null;
  const c = compareRecords(a, b);
  const rows = [
    { key: 'f', label: '焦距', first: `${formatCm(a.f)} cm`, second: `${formatCm(b.f)} cm` },
    { key: 'u', label: '物距', first: `${formatCm(a.u)} cm`, second: `${formatCm(b.u)} cm` },
    { key: 'observedScreenPosition', label: '清楚像距', first: `${formatCm(a.observedScreenPosition)} cm`, second: `${formatCm(b.observedScreenPosition)} cm` },
    { key: 'imageSize', label: '影像大小', first: SIZE_WORD[a.imageSize], second: SIZE_WORD[b.imageSize] },
  ];
  const notice = c.status === 'single' ? { kind: 'ok', text: `✅ 兩次只有${VAR_WORD[c.changedVariables[0]]}不同，可以直接比較。` }
    : c.status === 'multiple' ? { kind: 'warn', text: '⚠ 這兩次同時改變了兩個條件，還不能知道是哪個因素造成結果。' }
    : { kind: 'warn', text: '兩次的條件一樣，先改變一個條件再比較。' };
  return { rows, notice, directComparable: c.directComparable,
    questions: [
      { id: 'position', text: '蠟燭靠近凸透鏡後，清楚影像的位置怎麼變？', options: [['closer', '更靠近透鏡'], ['farther', '更遠離透鏡'], ['same', '沒有改變']] },
      { id: 'size', text: '影像大小呢？', options: [['smaller', '變小'], ['larger', '變大'], ['same', '一樣']] },
    ] };
}

/** Concept stage: named only after three rounds; the formula explains the learner's own numbers. */
export function conceptModel(records) {
  const a = records[1], b = records[2], c = records[3];
  if (!a || !b || !c) return null;
  const ORD = ['', '一', '二', '三'];
  const line = (n, r) => `第${ORD[n]}次：f = ${formatCm(r.f)} cm，u = ${formatCm(r.u)} cm → v = ${SIGN(r.theoreticalV)} cm`;
  return {
    cards: [
      { id: 'real', title: '實像', body: ['光線真的在某個位置會合。', '可以投在屏幕上。'],
        evidence: `第一次、第二次：你在屏幕 ${formatCm(a.observedScreenPosition)} cm 和 ${formatCm(b.observedScreenPosition)} cm 找到清楚的影像。` },
      { id: 'virtual', title: '虛像', body: ['光線沒有真的在看起來的影像位置會合。', '眼睛能看到，但屏幕接不到。'],
        evidence: `第三次：蠟燭在 ${formatCm(c.u)} cm，屏幕怎麼移都找不到，透過透鏡卻看得到。` },
    ],
    formula: {
      heading: '剛才找到的位置，其實可以用這個關係算出來。', expression: '1/f = 1/u + 1/v',
      lines: [
        { text: line(1, a), found: `你找到 ${formatCm(a.observedScreenPosition)} cm` },
        { text: line(2, b), found: `你找到 ${formatCm(b.observedScreenPosition)} cm` },
        { text: line(3, c), found: 'v 是負的：像在蠟燭這一側，屏幕接不到' },
      ],
    },
  };
}
