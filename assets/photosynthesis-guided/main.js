// Page glue for Science Lab 2.0 Pilot #5 B3.
// Holds state, delegates science/transitions to engine/model, wording/view-models to script.js, bench work to render/input,
// and shared presentation/focus/announcements to science-guided/components.js. No persistence or analytics in B3.
import { createInitialState, reduce } from './engine.js';
import { createPhotosynthesisBench } from './render.js';
import { bindPhotosynthesisInput } from './input.js';
import {
  COACH_NAME, TEXT, stationTitleFor, stepNavModel, screenFor, welcomeModel, ctaFor, coachModel, statusModel,
  dataModel, evidenceModel, benchModel, canSetLight, compareModel, compareKeyFor, compareTitleFor, compareHeadsFor,
  conceptModel, announcementFor,
} from './script.js';
import {
  createActionBar, createAnnouncer, focusHandoff, renderStepNav, renderCoachCard, renderStatusBar,
  renderDataCard, renderEvidenceCard, renderCompareCard, renderConceptReveal,
} from '../science-guided/components.js';

const $ = (id) => document.getElementById(id);
const main = $('main');
const cta = $('pfg-cta');
const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };
const CARD_OF = { welcome: 'pfg-welcome', bench: 'pfg-bench-card', compare: 'pfg-compare', concept: 'pfg-concept' };

let state = createInitialState();
let lastArrival = null;
let seq = 0;

const announcer = createAnnouncer($('pfg-announcer'));
const actionBar = createActionBar(cta, {
  onAction: (action) => {
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

const benchHost = $('pfg-bench-host');
const bench = createPhotosynthesisBench(benchHost);
// The standalone B2 bench can announce its observation when used alone. The full Guided page has one shared live region,
// so B3 removes the bench-local live behavior while keeping the same visible/numeric evidence.
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
  $('pfg-side').hidden = screen.id === 'welcome';

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

  // Formal names/formula do not exist in the concept DOM before the engine actually reaches Concept.
  renderConceptReveal(
    { root: $('pfg-concept'), heading: $('pfg-concept-title'), body: $('pfg-concept').querySelector('[data-pfg-concept-body]') },
    screen.id === 'concept' ? conceptModel(state) : null,
    { labelSuffix: '：' },
  );

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
  if (result.accepted) announcer.say(announcementFor({ result, state, action, seq: ++seq }));
  render(wasCta);
  return result;
}

render();
