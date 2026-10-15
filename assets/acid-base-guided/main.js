// Page glue for the guided unknown-liquid lab (Pilot #4, B3–B4): holds the state, asks the engine, asks the script what to
// say, draws, and hands focus over. It holds no learner wording and no science: the words come from script.js, the truth
// from engine.js / model.js, the bench from render.js and input.js, the cards from ../science-guided/components.js.
// Saving (and every check of what comes back out of a save) is persist.js; the anonymous milestones are analytics.js.
import { createInitialState, reduce } from './engine.js';
import { createAcidBaseBench } from './render.js';
import { bindAcidBaseInput } from './input.js';
import { TEXT_MAX } from './challenges.js';
import { createStore } from './persist.js';
import { analyticsFor, createTracker } from './analytics.js';
import {
  COACH_NAME, TEXT, stationTitleFor, stepNavModel, screenFor, welcomeModel, ctaFor, coachModel, statusModel, dataModel,
  evidenceModel, benchModel, compareModel, compareKeyFor, compareTitleFor, compareHeadsFor, conceptModel, notebookModel, notebookHeads,
  challengeModel, completeModel, announcementFor,
} from './script.js';
import {
  createActionBar, createAnnouncer, focusHandoff, renderStepNav, renderCoachCard, renderStatusBar, renderDataCard, renderEvidenceCard,
  renderCompareCard, renderConceptReveal, createNotebook, createChallengeCard, renderCompletionCard,
} from '../science-guided/components.js';

const $ = (id) => document.getElementById(id);
const main = $('main');
const cta = $('abg-cta');
const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };
const CARD_OF = {
  welcome: 'abg-welcome', bench: 'abg-bench-card', compare: 'abg-compare', concept: 'abg-concept',
  notebook: 'abg-notebook', challenge: 'abg-challenge', complete: 'abg-complete',
};

/** The notebook always opens on a level, so the learner never meets an empty card. */
const withLevel = (st) => (st.phase === 'notebook' && st.conclusion.level === null ? reduce(st, { type: 'SAVE_CONCLUSION', fields: { level: 'A' } }).state : st);

const store = createStore();
const track = createTracker();
const restored = store.load();          // a restore dispatches nothing, announces nothing and sends nothing: the first render simply shows where the learner was
let state = withLevel(restored ? restored.state : createInitialState());
const showRestored = Boolean(restored && restored.state.records.length);
let restarting = false;
let touched = false;                    // true once the learner has done anything on this page load (the "picked up where you left off" note goes away)
let lastScreen = null;
let seq = 0;
let challengeId = null;

const flushText = () => { notebook.flush(); challengeCard.flushNote(); };
const announcer = createAnnouncer($('abg-announcer'));
const actionBar = createActionBar(cta, {
  onAction: (action) => {
    flushText();
    const current = ctaFor(state);
    if (current && current.enabled) dispatch(action);
  },
});
const coachEls = { root: $('abg-coach'), name: $('abg-coach-name'), main: $('abg-coach-main'), sub: $('abg-coach-sub') };
const statusEls = { root: $('abg-status'), icon: $('abg-status').querySelector('[data-abg-status-icon]'), text: $('abg-status').querySelector('[data-abg-status-text]') };

coachEls.root.setAttribute('aria-label', COACH_NAME);
$('abg-stepnav').setAttribute('aria-label', TEXT.stepNavLabel);
$('abg-bench-card').setAttribute('aria-label', TEXT.benchLabel);
$('abg-prototype-note').textContent = TEXT.prototypeNote;
$('abg-privacy-note').textContent = TEXT.privacyNote;
$('abg-restart').textContent = TEXT.restart.label;

const notebook = createNotebook($('abg-notebook'), {
  body: $('abg-notebook').querySelector('[data-abg-notebook-body]'), idPrefix: 'abg', maxLength: TEXT_MAX,
  comparison: { heads: notebookHeads(), tagLabel: (label, tag) => (tag ? `${label}（${tag}）` : label) },
}, {
  onLevel: (level) => dispatch({ type: 'SAVE_CONCLUSION', fields: { level } }),
  onRelation: (id, value) => dispatch({ type: 'SAVE_CONCLUSION', fields: { [id]: value } }),
  onDraft: (fields) => dispatch({ type: 'SAVE_CONCLUSION', fields }),
  onFlush: (fields) => dispatch({ type: 'SAVE_CONCLUSION', fields }),
});
const challengeCard = createChallengeCard({ root: $('abg-challenge'), heading: $('abg-challenge-title'), body: $('abg-challenge').querySelector('[data-abg-challenge-body]') }, { idPrefix: 'abg', maxLength: TEXT_MAX }, {
  onAnswer: (step, choice) => dispatch({ type: 'ANSWER_CHALLENGE', id: challengeId, step, choice }),
  onNoteDraft: (text) => dispatch({ type: 'SAVE_CHALLENGE_NOTE', id: 3, text }),
  onNoteFlush: (text) => dispatch({ type: 'SAVE_CHALLENGE_NOTE', id: 3, text }),
});

const benchHost = $('abg-bench-host');
const bench = createAcidBaseBench(benchHost);
// The input layer only reports a sample id. Which strip is in use comes from the state (through the script's bench
// model), never from the DOM.
bindAcidBaseInput({
  root: benchHost,
  getLocked: () => benchModel(state) === null,
  canDip: (sampleId) => benchModel(state)?.samples.find((s) => s.sampleId === sampleId)?.tested === false,
  onDip: (sampleId) => {
    const model = benchModel(state);
    if (model) dispatch({ type: 'DIP', sampleId, indicatorId: model.activeIndicatorId });
  },
});

function render(wasCta = false) {
  const active = document.activeElement;   // read before anything is disabled: a browser drops focus the moment the focused control is disabled
  const screen = screenFor(state);
  const where = screen.id === 'concept' ? `concept-${state.conceptPart}` : state.phase;   // every phase, and each part of the concept, is an arrival of its own
  const screenChanged = where !== lastScreen;
  lastScreen = where;

  main.dataset.screen = screen.id;
  main.dataset.phase = state.phase;
  for (const id of Object.keys(CARD_OF)) $(CARD_OF[id]).hidden = id !== screen.id;
  const coach = coachModel(state);
  coachEls.root.hidden = !coach;
  if (coach) renderCoachCard(coachEls, coach);
  $('abg-side').hidden = screen.id === 'welcome' || screen.id === 'notebook';   // the notebook carries the same records as its own table

  put($('abg-heading'), stationTitleFor(state));
  const welcome = welcomeModel(state);
  put($('abg-welcome-title'), welcome.title);
  put($('abg-welcome-sub'), welcome.sub);
  renderStepNav($('abg-steps'), stepNavModel(state));
  renderStatusBar(statusEls, statusModel(state));
  renderDataCard($('abg-data'), dataModel(state), { title: TEXT.dataTitle });
  renderEvidenceCard($('abg-evidence'), evidenceModel(state), { title: TEXT.evidenceTitle });

  put($('abg-compare-title'), compareTitleFor(state));
  renderCompareCard({ root: $('abg-compare'), body: $('abg-compare').querySelector('[data-abg-compare-body]') }, screen.id === 'compare' ? compareModel(state) : null, {
    heads: compareHeadsFor(state),
    tagLabel: (label, tag) => (tag ? `${label}（${tag}）` : label),
    onAnswer: (question, answer) => dispatch({ type: 'ANSWER_COMPARE', compare: compareKeyFor(state), question, answer }),
  });
  // The concept body is built only on the concept screen: before it, nothing of the formal names is in the page.
  const concept = screen.id === 'concept' ? conceptModel(state) : null;
  renderConceptReveal({ root: $('abg-concept'), heading: $('abg-concept-title'), body: $('abg-concept').querySelector('[data-abg-concept-body]') }, concept, { labelSuffix: '：' });

  const book = screen.id === 'notebook' ? notebookModel(state) : null;
  if (book) put($('abg-notebook-title'), book.heading);
  notebook.update(book);
  const challenge = screen.id === 'challenge' ? challengeModel(state) : null;
  if (challenge) challengeId = challenge.id;
  challengeCard.update(challenge);
  const done = screen.id === 'complete' ? completeModel(state) : null;
  renderCompletionCard({ root: $('abg-complete'), heading: $('abg-complete-title'), body: $('abg-complete').querySelector('[data-abg-complete-body]') }, done);

  const hasRecords = state.records.length > 0;
  $('abg-restart').hidden = !hasRecords;
  const note = $('abg-storage-note');
  note.hidden = !(store.failed || hasRecords);
  put(note, store.failed ? TEXT.storage.failed : showRestored && !touched ? TEXT.storage.restored : TEXT.storage.saved);

  const model = benchModel(state);
  if (model) bench.update(model);

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
    track(analyticsFor(result));      // milestones only, from what this accepted action did; never from the restore
    if (!restarting) store.save(state);
    announcer.say(announcementFor({ result, state, action, seq: ++seq }));
  }
  render(wasCta);
  return result;
}

window.addEventListener('pagehide', flushText);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushText(); });
$('abg-restart').addEventListener('click', () => {
  if (!confirm(TEXT.restart.confirm)) return;
  flushText();
  restarting = true;
  store.clear();
  location.reload();
});

render();
