// Page glue for the guided microscope lab: holds the state, asks the engine, asks the script what to say, draws, and hands
// focus over. It holds no learner wording and no science: the words come from script.js, the truth from engine.js / model.js,
// the pictures from render.js, the controls from input.js and the cards from ../science-guided/components.js.
// Nothing is saved or sent yet: a refresh starts the lab again.
import { createInitialState, reduce, deriveView, rangesFor } from './engine.js';
import { createMicroscopeView } from './render.js';
import { createMicroscopeInput } from './input.js';
import {
  COACH_NAME, TEXT, stationTitleFor, stepNavModel, screenFor, ctaFor, reduceCoach, statusModel, dataModel, evidenceModel,
  compareModel, compareHeadsFor, conceptModel, welcomeModel, eyepieceLabel, stageLabel, announcementFor,
} from './script.js';
import {
  createActionBar, createAnnouncer, focusHandoff, renderStepNav, renderCoachCard, renderStatusBar, renderDataCard, renderEvidenceCard,
  renderCompareCard, renderConceptReveal,
} from '../science-guided/components.js';

const $ = (id) => document.getElementById(id);
const main = $('main');
const cta = $('mg-cta');
const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };
const setAttr = (el, name, value) => { if (el.getAttribute(name) !== value) el.setAttribute(name, value); };
const CARD_OF = { welcome: 'mg-welcome', bench: 'mg-bench-card', compare: 'mg-compare', concept: 'mg-concept' };

const bench = createMicroscopeView({ eyepieceRoot: $('mg-eyepiece'), overviewRoot: $('mg-overview') });
const surface = bench.getStageSurface();
const announcer = createAnnouncer($('mg-announcer'));
const actionBar = createActionBar(cta, {
  onAction: (action) => {
    const current = ctaFor(state);
    if (current && current.enabled) dispatch(action);
  },
});
const coachEls = { root: $('mg-coach'), name: $('mg-coach-name'), main: $('mg-coach-main'), sub: $('mg-coach-sub'), tip: $('mg-coach-tip') };
const statusEls = { root: $('mg-status'), icon: $('mg-status').querySelector('[data-mg-status-icon]'), text: $('mg-status').querySelector('[data-mg-status-text]') };

let state = createInitialState();
let coach = reduceCoach(null, { state, view: deriveView(state) });
let lastScreen = null;
let seq = 0;

coachEls.root.setAttribute('aria-label', COACH_NAME);
$('mg-stepnav').setAttribute('aria-label', TEXT.stepNavLabel);
$('mg-compare-title').textContent = TEXT.compareTitle;
$('mg-eyepiece-cap').textContent = TEXT.captions.eyepiece;
$('mg-overview-cap').textContent = TEXT.captions.stage;
$('mg-pending').textContent = TEXT.pending;
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
  const screenChanged = screen.id !== lastScreen;
  lastScreen = screen.id;

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
  $('mg-pending').hidden = screen.id !== 'concept';

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
    const view = deriveView(state);
    coach = reduceCoach(coach, { state, view, events: result.events, transitions: result.transitions });
    announcer.say(announcementFor({ result, prevState, prevView, state, view, action, seq: ++seq }));
  }
  render(wasCta);
  return result;
}

render();
