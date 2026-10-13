// Page glue for the guided optics lab: engine + input + bench view + teaching script + saved progress. No optics logic lives here.
import { reduce, createInitialState, deriveView } from './engine.js';
import { createInputController, snapForWidth } from './input.js';
import { createBenchView } from './render.js';
import { clarityMessage } from './visual.js';
import { MESSAGES, reduceCoach, screenFor, stepFor, ctaFor, evidenceList, compareCard, conceptModel, notebookModel, challengeModel, completeModel } from './script.js';
import { createStore, restore } from './persist.js';
import { analyticsFor, createTracker } from './analytics.js';
import { createActionBar, createAnnouncer, focusHandoff, renderStepNav, renderCoachCard, renderStatusBar, renderDataCard, renderEvidenceCard, renderCompletionCard, renderCompareCard, renderConceptReveal, createNotebook, createChallengeCard } from '../science-guided/components.js';

const $ = (id) => document.getElementById(id);
const main = $('main'), cta = $('og-cta'), bench = $('og-bench');
const benchView = createBenchView(bench);
const safeStorage = () => { try { return window.localStorage; } catch (_) { return null; } };
const store = createStore({ storage: safeStorage() });
const restored = restore(store.load());
const track = createTracker(window);
const announcer = createAnnouncer($('og-announcer'));
const actionBar = createActionBar(cta, {
  onAction: (action) => { if (cta.disabled) return; flush(); if (!cta.disabled) dispatch({ type: action }); },
});

let state = restored ?? createInitialState();
let ui = { naming: false };
let coach = null;
let announcementSeq = 0;

// Station adapter: the labels are this station's wording; which step is current is still decided by stepFor(state.phase).
const STEPS = [
  { id: 'mission', number: '01', label: '接任務' }, { id: 'bench', number: '02', label: '動手做' },
  { id: 'notebook', number: '03', label: '研究手冊' }, { id: 'challenge', number: '04', label: '挑戰題' },
];
const stepNavModel = (phase) => ({ steps: STEPS, currentStep: stepFor(phase) });

// Presentation-only mapping from the bench's clarity level to a status kind; the words and icon still come from clarityMessage.
const CLARITY_KIND = { 1: 'success', 2: 'progress', 3: 'progress', 4: 'neutral' };
const statusModel = (view) => ({ kind: CLARITY_KIND[view.clarity.effectiveClarityLevel] ?? 'neutral', ...clarityMessage(view) });
const statusEls = { root: $('og-status'), icon: $('og-status-icon'), text: $('og-status-text') };

// Station adapter: the conditions the learner is working with right now. Wording lives here, not in the shared card.
const DATA_TITLE = '這次實驗條件';
const dataModel = (st) => ({ conditions: [{ label: '焦距', value: `${st.f} cm` }, { label: '物距', value: `${st.u} cm` }] });

const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };   // writing identical text would re-announce in a live region

// ---- typed text is saved shortly after the learner pauses, and always before a button acts or the page is left.
// The notebook and the challenge note each buffer their own text (shared cards); the page only says when to flush.
function flush() { notebook.flush(); challengeCard.flushNote(); }
addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

// ---- compare
// Station adapter: compareCard builds the evidence and the questions; this adds the learner's own choice and this station's table words.
const COMPARE_OPTIONS = { heads: { item: '項目', first: '第一次', second: '第二次' }, caption: '兩次實驗的條件與你找到的結果', itemHeadingHidden: true };
const compareEls = { root: $('og-compare'), body: $('og-compare-body') };
function drawCompare() {
  const card = compareCard(state.records);
  renderCompareCard(compareEls, card && { ...card, questions: card.questions.map((q) => ({ ...q, selectedValue: state.compare[q.id] ?? null })) },
    { ...COMPARE_OPTIONS, onAnswer: (question, answer) => dispatch({ type: 'ANSWER_COMPARE', question, answer }) });
}

// Station adapter: conceptModel (only non-null once three rounds are recorded) already carries the learner's own numbers.
const conceptEls = { root: $('og-concept'), body: $('og-concept-body') };
function drawConcept() { renderConceptReveal(conceptEls, conceptModel(state.records)); }

// ---- research notebook: three ways to write the same finding; Level A is the default
// Station adapter: the level pills read "A　幫我整理" here (the letter is part of how this station names them).
function drawableNotebook() {
  const m = notebookModel(state.records, state.conclusion);
  return m && { ...m, levels: m.levels.map((l) => ({ ...l, title: `${l.id}　${l.title}` })) };
}
const notebook = createNotebook($('og-notebook'), {
  body: $('og-nb-body'), idPrefix: 'og', maxLength: 1000, ideasCollapsible: true,
  comparison: { heads: { item: '項目', first: '第一次', second: '第二次' }, caption: '你的兩次實驗證據', itemHeadingHidden: true },
}, {
  onLevel: (level) => { flush(); dispatch({ type: 'SAVE_CONCLUSION', fields: { level } }); },
  onRelation: (id, value) => dispatch({ type: 'SAVE_CONCLUSION', fields: { [id]: value } }),
  onDraft: (fields) => dispatch({ type: 'SAVE_CONCLUSION', fields }),
  onFlush: (fields) => dispatch({ type: 'SAVE_CONCLUSION', fields }),
});

// ---- challenges: steps unlock in order; the card builds each once and updates it in place so focus and typing are never lost
const challengeNoteId = () => Number(state.phase.slice(-1)) || 3;
const challengeCard = createChallengeCard({ root: $('og-challenge'), heading: $('og-challenge-title'), body: $('og-challenge-body') }, { idPrefix: 'og', maxLength: 1000 }, {
  onAnswer: (step, choice) => dispatch({ type: 'ANSWER_CHALLENGE', id: Number(state.phase.slice(-1)), step, choice }),
  onNoteDraft: (text) => dispatch({ type: 'SAVE_CHALLENGE_NOTE', id: challengeNoteId(), text }),
  onNoteFlush: (text) => dispatch({ type: 'SAVE_CHALLENGE_NOTE', id: challengeNoteId(), text }),
});
function drawChallenge() {
  const id = Number(state.phase.slice(-1));
  const m = challengeModel(state, id);
  challengeCard.update({ ...m, title: `挑戰 ${id}／${m.count}　${m.title}` });   // the heading wording is this station's
}

// Station adapter: completeModel keeps what the learner wrote; the claims stay empty because this station states no claim of its own.
const COMPLETE_HEADING = '這一站完成了';
const COMPLETE_LINK = { href: './optics.html', label: '自由探索／精確數值' };
const completeEls = { root: $('og-complete'), heading: $('og-complete-title'), body: $('og-complete-summary') };
function drawCompletion() {
  renderCompletionCard(completeEls, { heading: COMPLETE_HEADING, claims: [], conclusion: completeModel(state).lines, link: COMPLETE_LINK });
}

// Station adapter: evidenceList keeps the station's wording and logic; this only reshapes it for the shared card.
const EVIDENCE_TITLE = '已記錄的實驗';
function drawEvidence() {
  const items = evidenceList(state.records).map((r) => ({ id: `trial-${r.trial}`, title: r.text, rows: r.rows, note: r.note }));
  renderEvidenceCard($('og-evidence'), { items }, { title: EVIDENCE_TITLE });
}

const hits = benchView.hits;
const HEADING = { welcome: 'og-welcome-title', compare: 'og-compare-title', concept: 'og-concept-title', notebook: 'og-notebook-title', challenge: 'og-challenge-title', complete: 'og-complete-title' };

function render(wasCta = false) {
  const active = document.activeElement;
  const view = deriveView(state), screen = screenFor(state);
  main.dataset.screen = screen;
  renderStepNav($('og-steps'), stepNavModel(state.phase));

  put($('og-welcome-title'), MESSAGES.welcome.main);
  renderCoachCard({ main: $('og-coach-main'), sub: $('og-coach-sub') }, coach ?? { main: '', sub: null });
  if (screen === 'bench') {
    benchView.measure();                     // the bench was display:none until now
    benchView.update(view, { rays: state.phase === 'trial1-complete' || state.phase === 'trial2-complete' });
    $('og-status').dataset.level = String(view.clarity.effectiveClarityLevel);
    renderStatusBar(statusEls, statusModel(view));
  }
  if (screen === 'compare') drawCompare();
  if (screen === 'concept') drawConcept();
  if (screen === 'notebook') notebook.update(drawableNotebook());
  if (screen === 'challenge') drawChallenge();
  if (screen === 'complete') drawCompletion();
  renderDataCard($('og-data'), dataModel(state), { title: DATA_TITLE });
  drawEvidence();
  $('og-restart').hidden = !state.records[1];
  put($('og-save-note'), store.failed ? '這個瀏覽器無法保存進度；關閉頁面後會消失。' : state.records[1] ? (restored ? '已接續你上次做到的地方。進度只儲存在這台瀏覽器。' : '進度只儲存在這台瀏覽器。') : '');

  const c = ctaFor(state, view, ui);
  actionBar.render(c ? { label: c.label, action: c.action, enabled: c.enabled, id: c.action } : null);
  const targets = ['.og-hit-screen', '.og-hit-candle', '#og-cta', ...(HEADING[screen] ? [`#${HEADING[screen]}`] : [])];
  const ctaGone = wasCta && (cta.hidden || cta.disabled || !document.body.contains(cta));
  focusHandoff({ root: document.body, active, ctaGone, targets });
}

function dispatch(action) {
  const wasCta = document.activeElement === cta;
  let result = { events: [], transitions: [], accepted: true };
  if (action.type === 'UI_NAMING') ui = { ...ui, naming: true };
  else {
    result = reduce(state, action);
    state = result.state;
    if (state.phase === 'notebook' && state.conclusion.level === null) state = reduce(state, { type: 'SAVE_CONCLUSION', fields: { level: 'A' } }).state;
    if (result.transitions.length) ui = { naming: false };
    if (result.accepted) store.save(state);
    track(analyticsFor(result));
  }
  const view = deriveView(state);
  const previousCoach = coach;
  coach = reduceCoach(coach, { state, view, events: result.events, transitions: result.transitions, ui });
  if (result.accepted && coach && coach !== previousCoach) {
    announcer.say({ id: `optics-coach-${++announcementSeq}`, text: [coach.main, coach.sub].filter(Boolean).join(' ') });
  }
  render(wasCta);
  return result;
}

const controller = createInputController({
  getState: () => state, dispatch,
  getSnap: () => snapForWidth(window.innerWidth),
  getRect: () => bench.getBoundingClientRect(),
});
controller.attach(hits.screen, 'screen');
controller.attach(hits.candle, 'candle');
$('og-restart').addEventListener('click', () => {
  if (!confirm('清除這台瀏覽器上的紀錄並重新開始？')) return;
  store.clear();
  location.reload();
});

if (state.phase === 'notebook' && state.conclusion.level === null) state = reduce(state, { type: 'SAVE_CONCLUSION', fields: { level: 'A' } }).state;
coach = reduceCoach(null, { state, view: deriveView(state), ui });
render();
