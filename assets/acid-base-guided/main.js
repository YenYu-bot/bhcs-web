// Page glue for the guided unknown-liquid lab (Pilot #4, B3): holds the state, asks the engine, asks the script what to
// say, draws, and hands focus over. It holds no learner wording and no science: the words come from script.js, the truth
// from engine.js / model.js, the bench from render.js and input.js, the cards from ../science-guided/components.js.
// Nothing is saved and nothing is reported in this stage: a reload starts again at the welcome screen.
import { createInitialState, reduce } from './engine.js';
import { createAcidBaseBench } from './render.js';
import { bindAcidBaseInput } from './input.js';
import {
  COACH_NAME, TEXT, stationTitleFor, stepNavModel, screenFor, welcomeModel, ctaFor, coachModel, statusModel, dataModel,
  evidenceModel, benchModel, compareModel, compareKeyFor, compareTitleFor, compareHeadsFor, conceptModel, announcementFor,
} from './script.js';
import {
  createActionBar, createAnnouncer, focusHandoff, renderStepNav, renderCoachCard, renderStatusBar, renderDataCard, renderEvidenceCard,
  renderCompareCard, renderConceptReveal,
} from '../science-guided/components.js';

const $ = (id) => document.getElementById(id);
const main = $('main');
const cta = $('abg-cta');
const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };
const CARD_OF = { welcome: 'abg-welcome', bench: 'abg-bench-card', compare: 'abg-compare', concept: 'abg-concept' };

let state = createInitialState();
let lastScreen = null;
let seq = 0;

const announcer = createAnnouncer($('abg-announcer'));
const actionBar = createActionBar(cta, {
  onAction: (action) => {
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
  $('abg-side').hidden = screen.id === 'welcome';

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
  if (result.accepted) announcer.say(announcementFor({ result, state, action, seq: ++seq }));
  render(wasCta);
  return result;
}

render();
