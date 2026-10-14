// Page glue for the guided microscope lab: holds the state, asks the engine, asks the script what to say, draws, and hands
// focus over. It holds no learner wording and no science: the words come from script.js, the truth from engine.js / model.js,
// the pictures from render.js, the controls from input.js and the cards from ../science-guided/components.js.
// Saving (and every check of what comes back out of a save) is persist.js; the anonymous milestones are analytics.js.
import { createInitialState, reduce, deriveView, rangesFor } from './engine.js';
import { createMicroscopeView } from './render.js';
import { createMicroscopeInput } from './input.js';
import { TEXT_MAX } from './challenges.js';
import { createStore } from './persist.js';
import { analyticsFor, createTracker } from './analytics.js';
import {
  COACH_NAME, TEXT, stationTitleFor, stepNavModel, screenFor, ctaFor, reduceCoach, statusModel, dataModel, evidenceModel,
  compareModel, compareHeadsFor, conceptModel, notebookModel, challengeModel, completeModel, welcomeModel, eyepieceLabel, stageLabel, announcementFor,
} from './script.js';
import {
  createActionBar, createAnnouncer, focusHandoff, renderStepNav, renderCoachCard, renderStatusBar, renderDataCard, renderEvidenceCard,
  renderCompareCard, renderConceptReveal, renderCompletionCard, createNotebook, createChallengeCard,
} from '../science-guided/components.js';

const $ = (id) => document.getElementById(id);
const main = $('main');
const cta = $('mg-cta');
const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };
const setAttr = (el, name, value) => { if (el.getAttribute(name) !== value) el.setAttribute(name, value); };
const CARD_OF = { welcome: 'mg-welcome', bench: 'mg-bench-card', compare: 'mg-compare', concept: 'mg-concept', notebook: 'mg-notebook', challenge: 'mg-challenge', complete: 'mg-complete' };

const bench = createMicroscopeView({ eyepieceRoot: $('mg-eyepiece'), overviewRoot: $('mg-overview') });
const surface = bench.getStageSurface();
const announcer = createAnnouncer($('mg-announcer'));
const actionBar = createActionBar(cta, {
  onAction: (action) => {
    notebook.flush();
    challengeCard.flushNote();
    const current = ctaFor(state);
    if (current && current.enabled) dispatch(action);
  },
});
const coachEls = { root: $('mg-coach'), name: $('mg-coach-name'), main: $('mg-coach-main'), sub: $('mg-coach-sub'), tip: $('mg-coach-tip') };
const statusEls = { root: $('mg-status'), icon: $('mg-status').querySelector('[data-mg-status-icon]'), text: $('mg-status').querySelector('[data-mg-status-text]') };

const store = createStore();
const track = createTracker();
const restored = store.load();          // a restore dispatches nothing, announces nothing and sends nothing: the first render simply shows where the learner was
let state = restored ? restored.state : createInitialState();
const showRestored = Boolean(restored && restored.state.records.horizontal);
let restarting = false;
let coach = reduceCoach(null, { state, view: deriveView(state) });
let lastScreen = null;
let seq = 0;
let challengeId = null;
let touched = false;                    // true once the learner has done anything on this page load (the "picked up where you left off" note goes away)

/** The notebook always opens on a level, so the learner never meets an empty card. */
const withLevel = (st) => (st.phase === 'notebook' && st.conclusion.level === null ? reduce(st, { type: 'SAVE_CONCLUSION', fields: { level: 'A' } }).state : st);
state = withLevel(state);

const notebook = createNotebook($('mg-notebook'), {
  body: $('mg-notebook').querySelector('[data-mg-notebook-body]'), idPrefix: 'mg', maxLength: TEXT_MAX,
  comparison: { heads: TEXT.compareHeads1, tagLabel: (label, tag) => (tag ? `${label}（${tag}）` : label) },
}, {
  onLevel: (level) => dispatch({ type: 'SAVE_CONCLUSION', fields: { level } }),
  onRelation: (id, value) => dispatch({ type: 'SAVE_CONCLUSION', fields: { [id]: value } }),
  onDraft: (fields) => dispatch({ type: 'SAVE_CONCLUSION', fields }),
  onFlush: (fields) => dispatch({ type: 'SAVE_CONCLUSION', fields }),
});
const challengeCard = createChallengeCard({ root: $('mg-challenge'), heading: $('mg-challenge-title'), body: $('mg-challenge').querySelector('[data-mg-challenge-body]') }, { idPrefix: 'mg', maxLength: TEXT_MAX }, {
  onAnswer: (step, choice) => dispatch({ type: 'ANSWER_CHALLENGE', id: challengeId, step, choice }),
  onNoteDraft: (text) => dispatch({ type: 'SAVE_CHALLENGE_NOTE', id: 3, text }),
  onNoteFlush: (text) => dispatch({ type: 'SAVE_CHALLENGE_NOTE', id: 3, text }),
});

coachEls.root.setAttribute('aria-label', COACH_NAME);
$('mg-stepnav').setAttribute('aria-label', TEXT.stepNavLabel);
$('mg-compare-title').textContent = TEXT.compareTitle;
$('mg-eyepiece-cap').textContent = TEXT.captions.eyepiece;
$('mg-overview-cap').textContent = TEXT.captions.stage;
$('mg-restart').textContent = TEXT.restart.label;
$('mg-privacy-note').textContent = TEXT.privacyNote;
$('mg-dpad').setAttribute('aria-label', TEXT.controls.group);
$('mg-objectives').setAttribute('aria-label', TEXT.controls.objectiveGroup);
const ARROW_GLYPH = { up: '↑', down: '↓', left: '←', right: '→' };
for (const b of document.querySelectorAll('[data-mg-move]')) {
  b.setAttribute('aria-label', TEXT.controls.move[b.dataset.mgMove]);
  b.textContent = ARROW_GLYPH[b.dataset.mgMove];
}
$('mg-dpad').querySelector('[data-mg-home]').setAttribute('aria-label', TEXT.controls.home);
$('mg-dpad').querySelector('[data-mg-home]').textContent = '⌂';
for (const b of document.querySelectorAll('[data-mg-objective]')) { b.textContent = `${b.dataset.mgObjective}×`; b.setAttribute('aria-label', TEXT.controls.objective(b.dataset.mgObjective)); }

const input = createMicroscopeInput({ getState: () => state, dispatch: (a) => dispatch(a), getStageRect: () => surface.getBoundingClientRect() });
input.attach(surface);
surface.classList.add('sg-direct-manipulation');

for (const b of document.querySelectorAll('[data-mg-move]')) b.addEventListener('click', (e) => input.move(b.dataset.mgMove, e.shiftKey));
document.querySelector('[data-mg-home]').addEventListener('click', () => input.home());
for (const b of document.querySelectorAll('[data-mg-objective]')) b.addEventListener('click', () => dispatch({ type: 'SET_OBJECTIVE', objective: Number(b.dataset.mgObjective) }));

function syncControls(view) {
  const canMove = rangesFor(state.phase).stage, canSwitch = rangesFor(state.phase).objective;
  for (const b of document.querySelectorAll('[data-mg-move], [data-mg-home]')) {
    b.disabled = !canMove;
    b.dataset.locked = String(!canMove);
  }
  const group = $('mg-objectives');
  group.hidden = !state.phase.startsWith('trial2-high');
  for (const b of group.querySelectorAll('[data-mg-objective]')) {
    b.disabled = !canSwitch;
    b.dataset.locked = String(!canSwitch);
    setAttr(b, 'aria-pressed', String(Number(b.dataset.mgObjective) === state.objective));
  }
  setAttr(bench.getEyepiece(), 'aria-label', eyepieceLabel(state, view));
  setAttr(surface, 'aria-label', stageLabel(state));
}

function render(wasCta = false) {
  const active = document.activeElement;   // read before the controls are synced: a browser drops focus the moment the focused control is disabled
  const view = deriveView(state);
  const screen = screenFor(state);
  const where = screen.id === 'challenge' ? state.phase : screen.id;     // each challenge is a place of its own: arriving at one starts at its title
  const screenChanged = where !== lastScreen;
  lastScreen = where;

  main.dataset.screen = screen.id;
  main.dataset.phase = state.phase;
  main.dataset.objective = String(state.objective);
  for (const id of Object.keys(CARD_OF)) $(CARD_OF[id]).hidden = id !== screen.id;
  coachEls.root.hidden = screen.id === 'welcome';
  $('mg-side').hidden = screen.id === 'welcome';

  put($('mg-heading'), stationTitleFor(state));
  const welcome = welcomeModel(state);
  put($('mg-welcome-title'), welcome.title);
  put($('mg-welcome-sub'), welcome.sub);
  renderStepNav($('mg-steps'), stepNavModel(state));
  renderCoachCard(coachEls, coach);
  put(coachEls.tip, coach.tip ?? '');
  coachEls.tip.hidden = !coach.tip;
  coachEls.root.dataset.coach = coach.key;
  renderStatusBar(statusEls, statusModel(state, view, coach));
  renderDataCard($('mg-data'), dataModel(state, view), { title: TEXT.dataTitle, stateLabels: TEXT.dataStates });
  renderEvidenceCard($('mg-evidence'), evidenceModel(state), { title: TEXT.evidenceTitle });
  renderCompareCard({ root: $('mg-compare'), body: $('mg-compare').querySelector('[data-mg-compare-body]') }, screen.id === 'compare' ? compareModel(state) : null, {
    heads: compareHeadsFor(state),
    onAnswer: (question, answer) => dispatch({ type: 'ANSWER_COMPARE', compare: state.phase === 'compare-direction' ? 'direction' : 'magnification', question, answer }),
  });
  renderConceptReveal({ root: $('mg-concept'), heading: $('mg-concept-title'), body: $('mg-concept').querySelector('[data-mg-concept-body]') },
    screen.id === 'concept' ? conceptModel(state) : null, { labelSuffix: '：' });
  const book = screen.id === 'notebook' ? notebookModel(state) : null;
  if (book) put($('mg-notebook-title'), book.heading);
  notebook.update(book);
  const challenge = screen.id === 'challenge' ? challengeModel(state, view) : null;
  if (challenge) challengeId = challenge.id;
  challengeCard.update(challenge);
  const done = screen.id === 'complete' ? completeModel(state) : null;
  renderCompletionCard({ root: $('mg-complete'), heading: $('mg-complete-title'), body: $('mg-complete').querySelector('[data-mg-complete-body]') },
    done && { heading: done.heading, claims: done.claims, conclusion: done.conclusionIntro ? [done.conclusionIntro, ...done.conclusion] : [], link: done.link });
  $('mg-restart').hidden = !state.records.horizontal;
  const note = $('mg-storage-note');
  note.hidden = !(store.failed || state.records.horizontal);
  put(note, store.failed ? TEXT.storage.failed : showRestored && !touched ? TEXT.storage.restored : TEXT.storage.saved);

  if (screen.id === 'bench') { bench.update(view); syncControls(view); }

  const c = ctaFor(state);
  actionBar.render(c ? { label: c.label, action: c.action, enabled: c.enabled, id: c.action.type } : null);
  const targets = screenChanged ? [...screen.arrival, ...screen.focusTargets] : screen.focusTargets;
  focusHandoff({ root: document.body, active, ctaGone: wasCta && (!c || cta.hidden), targets });
}

function dispatch(action) {
  const wasCta = document.activeElement === cta;
  const prevState = state, prevView = deriveView(prevState);
  const result = reduce(state, action);
  state = result.state;
  if (result.accepted) {
    state = withLevel(state);
    touched = true;
    const view = deriveView(state);
    coach = reduceCoach(coach, { state, view, events: result.events, transitions: result.transitions });
    track(analyticsFor(result));      // milestones only, from what this accepted action did; never from the restore
    if (!restarting) store.save(state);
    announcer.say(announcementFor({ result, prevState, prevView, state, view, action, seq: ++seq }));
  }
  render(wasCta);
  return result;
}

window.addEventListener('pagehide', () => { notebook.flush(); challengeCard.flushNote(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { notebook.flush(); challengeCard.flushNote(); } });
$('mg-restart').addEventListener('click', () => {
  if (!confirm(TEXT.restart.confirm)) return;
  restarting = true;
  notebook.reset();
  challengeCard.reset();
  store.clear();
  location.reload();
});

render();
