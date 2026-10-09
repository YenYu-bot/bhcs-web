// Page glue for the guided buoyancy lab: holds the state, asks the engine, asks the script what to say, draws, saves, and
// hands focus over. It holds no learner wording and no science: the words come from script.js, the truth from engine.js,
// the pictures from visual.js / render.js, the cards from cards.js, the controls from input.js, and the saving (and
// every check of what comes back out of a save) from persist.js.
import { createInitialState, reduce, deriveView } from './engine.js';
import { createInputController, syncControls, focusHandoff } from './input.js';
import { visualParams } from './visual.js';
import { createRenderer } from './render.js';
import { TEXT_MAX } from './challenges.js';
import { createStore } from './persist.js';
import { analyticsFor, createTracker } from './analytics.js';
import {
  COACH_NAME, LABELS, TEXT, stationTitleFor, MESSAGES, stepNavModel, screenFor, ctaFor, reduceCoach, hintFor, statusModel, dataModel, evidenceModel,
  compareModel, conceptModel, notebookModel, challengeModel, completeModel, announcementFor, invalidDropMessage, blockedMessage, massLabel,
} from './script.js';
import {
  renderSteps, renderCoach, renderStatus, renderData, renderEvidence, renderCompare, renderConcept, createNotebook, renderChallenge, renderCompletion, createAnnouncer,
} from './cards.js';

const $ = (id) => document.getElementById(id);
const main = $('main');
const bench = $('bg-bench');
const cta = $('bg-cta');
const hint = $('bg-hint');
const tank = bench.querySelector('[data-bg-tank]');
const renderer = createRenderer({ scene: $('bg-scene'), labels: LABELS });
const announcer = createAnnouncer($('bg-announcer'));
const coachEls = { root: $('bg-coach'), name: $('bg-coach-name'), main: $('bg-coach-main'), sub: $('bg-coach-sub'), tip: $('bg-coach-tip') };
const SCREENS = ['welcome', 'bench', 'compare', 'concept', 'notebook', 'challenge', 'complete'];
const CARD_OF = { welcome: 'bg-welcome', bench: 'bg-bench-card', compare: 'bg-compare', concept: 'bg-concept', notebook: 'bg-notebook', challenge: 'bg-challenge', complete: 'bg-complete' };

const store = createStore();
const trackAnalytics = createTracker();
const restored = store.load();          // a restore dispatches nothing, announces nothing and sends nothing: the first render simply shows where the learner was
let state = restored ? restored.state : createInitialState();
let coach = reduceCoach(null, null, state, deriveView(state));
let lastScreen = null;
let pendingRestore = false;            // a drag ended without the engine moving anything: draw the objects back where they belong
const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };

const notebook = createNotebook($('bg-notebook'), TEXT, {
  maxLength: TEXT_MAX,
  onLevel: (level) => dispatch({ type: 'SAVE_CONCLUSION', fields: { level } }),
  onRelation: (id, value) => dispatch({ type: 'SAVE_CONCLUSION', fields: { [id]: value } }),
  onDraft: (fields) => dispatch({ type: 'SAVE_CONCLUSION', fields }),
  onFlush: (fields) => dispatch({ type: 'SAVE_CONCLUSION', fields }),
});

$('bg-stepnav').setAttribute('aria-label', TEXT.stepNavLabel);
coachEls.root.setAttribute('aria-label', COACH_NAME);
$('bg-welcome-title').textContent = MESSAGES.welcome.main;
$('bg-welcome-sub').textContent = MESSAGES.welcome.sub;
$('bg-compare-title').textContent = TEXT.compareTitle;
$('bg-storage-note').textContent = TEXT.storageUnavailable;
$('bg-privacy-note').textContent = TEXT.privacyNote;

function render(wasCta = false) {
  const active = document.activeElement;   // read before the controls are synced: a browser drops focus the moment the focused control is disabled
  const view = deriveView(state);
  const screen = screenFor(state);
  const where = screen.id === 'challenge' ? state.phase : screen.id;     // each challenge is a place of its own: arriving at one starts at its title
  const screenChanged = where !== lastScreen;
  lastScreen = where;

  main.dataset.screen = screen.id;
  for (const id of SCREENS) $(CARD_OF[id]).hidden = id !== screen.id;
  Object.assign(main.dataset, { phase: state.phase, slots: String(state.slots), liquid: state.liquidId, tankObject: state.tank.objectId ?? '', drops: String(state.dropCount.trial1 + state.dropCount.trial2) });
  coachEls.root.hidden = screen.id === 'welcome';
  $('bg-side').hidden = screen.id === 'welcome';

  put($('bg-heading'), stationTitleFor(state));
  renderSteps($('bg-steps'), stepNavModel(state));
  renderCoach(coachEls, coach, hintFor(view));
  renderStatus($('bg-status'), statusModel(state, view));
  renderData($('bg-data'), dataModel(state, view), TEXT.dataTitle, TEXT.dataStates);
  renderEvidence($('bg-evidence'), evidenceModel(state, view), TEXT.evidenceTitle);
  renderCompare($('bg-compare'), screen.id === 'compare' ? compareModel(state, view) : null, TEXT,
    (question, answer) => dispatch({ type: 'ANSWER_COMPARE', question, answer }));
  const concept = screen.id === 'concept' ? conceptModel(state, view) : null;
  if (concept) put($('bg-concept-title'), concept.heading);
  renderConcept($('bg-concept'), concept);
  const book = screen.id === 'notebook' ? notebookModel(state, view) : null;
  if (book) put($('bg-notebook-title'), book.heading);
  notebook.update(book);
  const challenge = screen.id === 'challenge' ? challengeModel(state, view) : null;
  if (challenge) put($('bg-challenge-title'), challenge.title);
  renderChallenge($('bg-challenge'), challenge,
    (step, choice) => dispatch({ type: 'ANSWER_CHALLENGE', id: challenge.id, step, choice }));
  const done = screen.id === 'complete' ? completeModel(state) : null;
  if (done) put($('bg-complete-title'), done.heading);
  renderCompletion($('bg-complete'), done);
  $('bg-storage-note').hidden = !store.failed;

  syncControls(bench, view);
  const mass = bench.querySelector('[data-bg-mass]');
  mass.hidden = !view.controls.objects.block.available;
  put(mass, massLabel(view.facts.currentBlock.massG));
  pendingRestore = false;
  if (screen.id === 'bench') renderer.render(visualParams(view));

  const c = ctaFor(state, view);
  cta.hidden = !c;
  if (c) { put(cta, c.label); cta.disabled = !c.enabled; cta.dataset.action = c.action.type; }
  const targets = screenChanged ? [`#${screen.headingId}`, ...screen.focusTargets] : screen.focusTargets;
  const arrivedAtEnd = screenChanged && screen.id === 'complete';           // the finish is announced by its heading, not by leaving focus on the button
  const redrawn = Boolean(active) && active !== document.body && !document.body.contains(active);   // a card was rebuilt under the focus (a challenge step opened)
  focusHandoff({ root: document.body, active, ctaGone: redrawn || (wasCta && (!c || cta.hidden || arrivedAtEnd)), targets });
}

function dispatch(action) {
  const wasCta = document.activeElement === cta;
  const result = reduce(state, action);
  state = result.state;
  if (result.accepted) {
    hint.textContent = '';
    trackAnalytics(analyticsFor(result));      // milestones only, from what this accepted action did; never from the restore
    if (action.type === 'RESTART') { store.clear(); notebook.reset(); } else store.save(state);
    const view = deriveView(state);
    coach = reduceCoach(coach, result, state, view);
    announcer.say(announcementFor(result, state, view, action));
  }
  render(wasCta);
  if (wasCta && result.accepted) keepCoachInView();
  return result;
}

/** The main button sits at the bottom of the page, so after pressing it the new coach message may be scrolled out of sight. */
function keepCoachInView() {
  const target = coachEls.root.hidden ? $('bg-heading') : coachEls.root;
  if (target.getBoundingClientRect().top < 0) target.scrollIntoView({ block: 'start' });
}

cta.addEventListener('click', () => {
  notebook.flush();                      // what was just typed counts before the button decides whether it is ready
  const c = ctaFor(state, deriveView(state));
  if (c && c.enabled) dispatch(c.action);
});
window.addEventListener('pagehide', () => notebook.flush());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') notebook.flush(); });

createInputController({
  root: bench,
  getView: () => deriveView(state),
  dispatch,
  getTankRect: () => tank.getBoundingClientRect(),
  onDrag: (e) => {
    renderer.setDragPreview(e);
    if (!e.dragging) { pendingRestore = true; queueMicrotask(() => { if (pendingRestore) render(); }); }   // a dispatch right after clears this; a cancelled drag does not
  },
  onInvalidDrop: ({ reason }) => { hint.textContent = invalidDropMessage(reason); },
  onBlocked: ({ control }) => { hint.textContent = blockedMessage(control); },
});

render();
