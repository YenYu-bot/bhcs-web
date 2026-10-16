// Page glue for Science Lab 2.0 Pilot #5 B3-B4.
// Science/transitions live in engine/model, wording in script, persistence in persist, anonymous milestones in analytics.
import { createInitialState, reduce } from './engine.js';
import { createPhotosynthesisBench } from './render.js';
import { bindPhotosynthesisInput } from './input.js';
import { TEXT_MAX } from './challenges.js';
import { createStore } from './persist.js';
import { analyticsFor, createTracker } from './analytics.js';
import {
  COACH_NAME, TEXT, stationTitleFor, stepNavModel, screenFor, welcomeModel, ctaFor, coachModel, statusModel,
  dataModel, evidenceModel, benchModel, canSetLight, compareModel, compareKeyFor, compareTitleFor, compareHeadsFor,
  conceptModel, notebookModel, notebookHeads, challengeModel, completeModel, announcementFor,
} from './script.js';
import {
  createActionBar, createAnnouncer, focusHandoff, renderStepNav, renderCoachCard, renderStatusBar,
  renderDataCard, renderEvidenceCard, renderCompareCard, renderConceptReveal,
  createNotebook, createChallengeCard, renderCompletionCard,
} from '../science-guided/components.js';

const $ = (id) => document.getElementById(id);
const main = $('main');
const cta = $('pfg-cta');
const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };
const CARD_OF = {
  welcome: 'pfg-welcome',
  bench: 'pfg-bench-card',
  compare: 'pfg-compare',
  concept: 'pfg-concept',
  notebook: 'pfg-notebook',
  challenge: 'pfg-challenge',
  complete: 'pfg-complete',
};

const withLevel = (st) =>
  st.phase === 'notebook' && st.conclusion.level === null
    ? reduce(st, { type: 'SAVE_CONCLUSION', fields: { level: 'A' } }).state
    : st;

const store = createStore();
const track = createTracker();
const restored = store.load();
let state = withLevel(restored ? restored.state : createInitialState());
const showRestored = Boolean(restored && restored.state.records.length);
let restarting = false;
let touched = false;
let lastArrival = null;
let seq = 0;
let challengeId = null;

const flushText = () => {
  notebook.flush();
  challengeCard.flushNote();
};

const announcer = createAnnouncer($('pfg-announcer'));
const actionBar = createActionBar(cta, {
  onAction: (action) => {
    flushText();
    const current = ctaFor(state);
    if (current?.enabled) dispatch(action);
  },
});
const coachEls = { root: $('pfg-coach'), name: $('pfg-coach-name'), main: $('pfg-coach-main'), sub: $('pfg-coach-sub') };
const statusEls = {
  root: $('pfg-status'),
  icon: $('pfg-status').querySelector('[data-pfg-status-icon]'),
  text: $('pfg-status').querySelector('[data-pfg-status-text]'),
};

coachEls.root.setAttribute('aria-label', COACH_NAME);
$('pfg-stepnav').setAttribute('aria-label', TEXT.stepNavLabel);
$('pfg-bench-card').setAttribute('aria-label', TEXT.benchLabel);
$('pfg-prototype-note').textContent = TEXT.prototypeNote;
$('pfg-privacy-note').textContent = TEXT.privacyNote;
$('pfg-restart').textContent = TEXT.restart.label;

const notebook = createNotebook($('pfg-notebook'), {
  body: $('pfg-notebook').querySelector('[data-pfg-notebook-body]'),
  idPrefix: 'pfg',
  maxLength: TEXT_MAX,
  comparison: {
    heads: notebookHeads(),
    tagLabel: (label, tag) => (tag ? `${label}（${tag}）` : label),
  },
}, {
  onLevel: (level) => dispatch({ type: 'SAVE_CONCLUSION', fields: { level } }),
  onRelation: (id, value) => dispatch({ type: 'SAVE_CONCLUSION', fields: { [id]: value } }),
  onDraft: (fields) => dispatch({ type: 'SAVE_CONCLUSION', fields }),
  onFlush: (fields) => dispatch({ type: 'SAVE_CONCLUSION', fields }),
});

const challengeCard = createChallengeCard(
  { root: $('pfg-challenge'), heading: $('pfg-challenge-title'), body: $('pfg-challenge').querySelector('[data-pfg-challenge-body]') },
  { idPrefix: 'pfg', maxLength: TEXT_MAX },
  {
    onAnswer: (step, choice) => dispatch({ type: 'ANSWER_CHALLENGE', id: challengeId, step, choice }),
    onNoteDraft: (text) => dispatch({ type: 'SAVE_CHALLENGE_NOTE', id: 3, text }),
    onNoteFlush: (text) => dispatch({ type: 'SAVE_CHALLENGE_NOTE', id: 3, text }),
  },
);

const benchHost = $('pfg-bench-host');
const bench = createPhotosynthesisBench(benchHost);
// The standalone B2 bench can announce observations. The full page uses the one shared Guided announcer.
bench.element.querySelector('[data-role="observation"]')?.removeAttribute('aria-live');

bindPhotosynthesisInput({
  root: benchHost,
  getLocked: () => benchModel(state)?.locked !== false,
  canSetLight: (value) => canSetLight(state, value),
  onSetLight: (value) => dispatch({ type: 'SET_LIGHT', value }),
});

function render(wasCta = false) {
  const active = document.activeElement;
  const screen = screenFor(state);
  const arrivalKey = state.phase;
  const screenChanged = arrivalKey !== lastArrival;
  lastArrival = arrivalKey;

  main.dataset.screen = screen.id;
  main.dataset.phase = state.phase;
  for (const id of Object.keys(CARD_OF)) $(CARD_OF[id]).hidden = id !== screen.id;

  const coach = coachModel(state);
  coachEls.root.hidden = !coach;
  if (coach) renderCoachCard(coachEls, coach);
  $('pfg-side').hidden = screen.id === 'welcome' || screen.id === 'notebook';

  put($('pfg-heading'), stationTitleFor(state));
  const welcome = welcomeModel(state);
  put($('pfg-welcome-title'), welcome.title);
  put($('pfg-welcome-sub'), welcome.sub);
  renderStepNav($('pfg-steps'), stepNavModel(state));
  renderStatusBar(statusEls, statusModel(state));
  renderDataCard($('pfg-data'), dataModel(state), {
    title: TEXT.dataTitle,
    stateLabels: { locked: '固定', changed: '這次改變' },
  });
  renderEvidenceCard($('pfg-evidence'), evidenceModel(state), { title: TEXT.evidenceTitle });

  put($('pfg-compare-title'), compareTitleFor(state));
  renderCompareCard(
    { root: $('pfg-compare'), body: $('pfg-compare').querySelector('[data-pfg-compare-body]') },
    screen.id === 'compare' ? compareModel(state) : null,
    {
      heads: compareHeadsFor(state),
      tagLabel: (label, tag) => (tag ? `${label}（${tag}）` : label),
      onAnswer: (question, answer) => dispatch({ type: 'ANSWER_COMPARE', compare: compareKeyFor(state), question, answer }),
    },
  );

  renderConceptReveal(
    { root: $('pfg-concept'), heading: $('pfg-concept-title'), body: $('pfg-concept').querySelector('[data-pfg-concept-body]') },
    screen.id === 'concept' ? conceptModel(state) : null,
    { labelSuffix: '：' },
  );

  const book = screen.id === 'notebook' ? notebookModel(state) : null;
  if (book) put($('pfg-notebook-title'), book.heading);
  notebook.update(book);

  const challenge = screen.id === 'challenge' ? challengeModel(state) : null;
  if (challenge) challengeId = challenge.id;
  challengeCard.update(challenge);

  renderCompletionCard(
    { root: $('pfg-complete'), heading: $('pfg-complete-title'), body: $('pfg-complete').querySelector('[data-pfg-complete-body]') },
    screen.id === 'complete' ? completeModel(state) : null,
  );

  const hasRecords = state.records.length > 0;
  $('pfg-restart').hidden = !hasRecords;
  const storageNote = $('pfg-storage-note');
  storageNote.hidden = !(store.failed || hasRecords);
  put(storageNote, store.failed ? TEXT.storage.failed : showRestored && !touched ? TEXT.storage.restored : TEXT.storage.saved);

  const bm = benchModel(state);
  if (bm) bench.update(bm);

  const c = ctaFor(state);
  actionBar.render(c ? { label: c.label, action: c.action, enabled: c.enabled, id: c.action.type } : null);

  const targets = screenChanged ? [...screen.arrival, ...screen.focusTargets] : screen.focusTargets;
  focusHandoff({ root: document.body, active, ctaGone: wasCta && (!c || cta.hidden || screenChanged), targets });
}

function dispatch(action) {
  const wasCta = document.activeElement === cta;
  const result = reduce(state, action);
  state = result.state;
  if (result.accepted) {
    state = withLevel(state);
    touched = true;
    track(analyticsFor(result));
    if (!restarting) store.save(state);
    announcer.say(announcementFor({ result, state, action, seq: ++seq }));
  }
  render(wasCta);
  return result;
}

window.addEventListener('pagehide', flushText);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushText();
});
$('pfg-restart').addEventListener('click', () => {
  if (!confirm(TEXT.restart.confirm)) return;
  flushText();
  restarting = true;
  store.clear();
  location.reload();
});

render();
