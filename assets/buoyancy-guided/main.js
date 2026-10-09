// Page glue for the guided buoyancy lab: holds the state, asks the engine, asks the script what to say, draws, and hands
// focus over. It holds no learner wording and no science: the words come from script.js, the truth from engine.js, the
// pictures from visual.js / render.js, the cards from cards.js, the controls from input.js.
import { createInitialState, reduce, deriveView } from './engine.js';
import { createInputController, syncControls, focusHandoff } from './input.js';
import { visualParams } from './visual.js';
import { createRenderer } from './render.js';
import {
  COACH_NAME, LABELS, TEXT, stationTitleFor, MESSAGES, stepNavModel, screenFor, ctaFor, reduceCoach, hintFor, statusModel, dataModel, evidenceModel,
  compareModel, conceptModel, announcementFor, invalidDropMessage, blockedMessage, massLabel,
} from './script.js';
import { renderSteps, renderCoach, renderStatus, renderData, renderEvidence, renderCompare, renderConcept, createAnnouncer } from './cards.js';

const $ = (id) => document.getElementById(id);
const main = $('main');
const bench = $('bg-bench');
const cta = $('bg-cta');
const hint = $('bg-hint');
const tank = bench.querySelector('[data-bg-tank]');
const renderer = createRenderer({ scene: $('bg-scene'), labels: LABELS });
const announcer = createAnnouncer($('bg-announcer'));
const coachEls = { root: $('bg-coach'), name: $('bg-coach-name'), main: $('bg-coach-main'), sub: $('bg-coach-sub'), tip: $('bg-coach-tip') };
const SCREENS = ['welcome', 'bench', 'compare', 'concept', 'later'];
const CARD_OF = { welcome: 'bg-welcome', bench: 'bg-bench-card', compare: 'bg-compare', concept: 'bg-concept', later: 'bg-later' };

let state = createInitialState();
let coach = reduceCoach(null, null, state, deriveView(state));
let lastScreen = null;
let pendingRestore = false;            // a drag ended without the engine moving anything: draw the objects back where they belong
const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };

$('bg-stepnav').setAttribute('aria-label', TEXT.stepNavLabel);
coachEls.root.setAttribute('aria-label', COACH_NAME);
$('bg-welcome-title').textContent = MESSAGES.welcome.main;
$('bg-welcome-sub').textContent = MESSAGES.welcome.sub;
$('bg-compare-title').textContent = TEXT.compareTitle;
$('bg-later-title').textContent = MESSAGES.later.main;

function render(wasCta = false) {
  const active = document.activeElement;   // read before the controls are synced: a browser drops focus the moment the focused control is disabled
  const view = deriveView(state);
  const screen = screenFor(state);
  const screenChanged = screen.id !== lastScreen;
  lastScreen = screen.id;

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
  focusHandoff({ root: document.body, active, ctaGone: wasCta && (!c || cta.hidden), targets });
}

function dispatch(action) {
  const wasCta = document.activeElement === cta;
  const result = reduce(state, action);
  state = result.state;
  if (result.accepted) {
    hint.textContent = '';
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
  const c = ctaFor(state, deriveView(state));
  if (c && c.enabled) dispatch(c.action);
});

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
