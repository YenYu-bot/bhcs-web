// Page glue for the guided optics lab: engine + input + bench view + teaching script. No optics logic lives here.
import { reduce, createInitialState, deriveView } from './engine.js';
import { createInputController, snapForWidth } from './input.js';
import { createBenchView } from './render.js';
import { clarityMessage } from './visual.js';
import { MESSAGES, reduceCoach, screenFor, stepFor, ctaFor, evidenceList, compareCard, conceptModel } from './script.js';

const $ = (id) => document.getElementById(id);
const main = $('main'), cta = $('og-cta'), bench = $('og-bench');
const benchView = createBenchView(bench);
const params = new URLSearchParams(location.search);

let state = createInitialState();
let ui = { naming: false };
let coach = null;
let renderedCompare = '', renderedConcept = false;

const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };   // writing identical text would re-announce in a live region

function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) k in e ? (e[k] = v) : e.setAttribute(k, v);
  e.append(...kids.filter((k) => k !== null && k !== undefined));
  return e;
}

function renderCompare(view) {
  const card = compareCard(state.records);
  if (!card) return;
  const key = JSON.stringify(card.rows);
  if (key !== renderedCompare) {
    renderedCompare = key;
    const rows = $('og-compare-rows'); rows.replaceChildren();
    for (const r of card.rows) rows.append(el('tr', {}, el('th', { scope: 'row' }, r.label), el('td', {}, r.first), el('td', {}, r.second)));
    const qs = $('og-questions'); qs.replaceChildren();
    for (const q of card.questions) {
      const fs = el('fieldset', { className: 'og-question' }, el('legend', {}, q.text));
      const group = el('div', { className: 'og-options' });
      for (const [value, label] of q.options) {
        const input = el('input', { type: 'radio', name: `og-q-${q.id}`, value });
        input.addEventListener('change', () => dispatch({ type: 'ANSWER_COMPARE', question: q.id, answer: value }));
        group.append(el('label', { className: 'og-option' }, input, el('span', {}, label)));
      }
      fs.append(group); qs.append(fs);
    }
  }
  const notice = $('og-compare-notice');
  put(notice, card.notice.text); notice.dataset.kind = card.notice.kind;
  for (const q of card.questions) for (const input of document.querySelectorAll(`input[name="og-q-${q.id}"]`)) input.checked = state.compare[q.id] === input.value;
}

function renderConcept() {
  if (renderedConcept) return;
  const model = conceptModel(state.records);
  if (!model) return;
  renderedConcept = true;
  const cards = $('og-concept-cards'); cards.replaceChildren();
  for (const c of model.cards) cards.append(el('article', { className: 'og-concept-card' }, el('h3', {}, c.title), ...c.body.map((t) => el('p', {}, t)), el('p', { className: 'og-evidence' }, c.evidence)));
  const f = $('og-formula'); f.replaceChildren(el('h3', {}, model.formula.heading), el('p', { className: 'og-formula-expression' }, model.formula.expression),
    el('ul', {}, ...model.formula.lines.map((l) => el('li', {}, l.text, el('span', {}, l.found)))));
}

function renderRecords() {
  const list = evidenceList(state.records), ul = $('og-records');
  $('og-records-wrap').hidden = list.length === 0;
  ul.replaceChildren(...list.map((r) => el('li', {}, el('b', {}, r.text), ` ${r.detail}`)));
}

const hits = benchView.hits;
const HEADING = { welcome: 'og-welcome-title', compare: 'og-compare-title', concept: 'og-concept-title', placeholder: 'og-placeholder-title' };
function focusTargetAfter(wasCta, screen) {
  const a = document.activeElement;
  const usable = (e) => e && !e.hidden && !e.disabled && e.dataset.locked !== 'true' && e.offsetParent !== null;
  const lockedHit = a && (a === hits.screen || a === hits.candle) && a.dataset.locked === 'true';
  const ctaGone = wasCta && !usable(cta);
  if (!lockedHit && !ctaGone) return;
  const next = [hits.screen, hits.candle].find((h) => usable(h) && h !== a) ?? (usable(cta) && a !== cta ? cta : null)
    ?? (HEADING[screen] ? $(HEADING[screen]) : null);
  next?.focus({ preventScroll: true });
}

function render(wasCta = false) {
  const view = deriveView(state), screen = screenFor(state);
  main.dataset.screen = screen;
  const step = stepFor(state.phase);
  for (const b of document.querySelectorAll('.og-nav button')) b.setAttribute('aria-current', b.dataset.step === step ? 'step' : 'false');

  put($('og-welcome-title'), MESSAGES.welcome.main);
  put($('og-coach-main'), coach?.main ?? ''); put($('og-coach-sub'), coach?.sub ?? '');
  if (screen === 'bench') {
    benchView.measure();                     // the bench was display:none until now
    benchView.update(view, { rays: state.phase === 'trial1-complete' || state.phase === 'trial2-complete' });
    const msg = clarityMessage(view);
    $('og-status').dataset.level = String(view.clarity.effectiveClarityLevel);
    put($('og-status-icon'), msg.icon); put($('og-status-text'), msg.text);
  }
  if (screen === 'compare') renderCompare(view);
  if (screen === 'concept') renderConcept();
  put($('og-f'), `${state.f} cm`); put($('og-u'), `${state.u} cm`);
  renderRecords();

  const c = ctaFor(state, view, ui);
  cta.hidden = !c;
  if (c) { put(cta, c.label); cta.disabled = !c.enabled; cta.dataset.action = c.action; }

  focusTargetAfter(wasCta, screen);
}

function dispatch(action) {
  const wasCta = document.activeElement === cta;
  let result = { events: [], transitions: [], accepted: true };
  if (action.type === 'UI_NAMING') ui = { ...ui, naming: true };
  else {
    result = reduce(state, action);
    state = result.state;
    if (result.transitions.length) ui = { naming: false };
  }
  const view = deriveView(state);
  coach = reduceCoach(coach, { state, view, events: result.events, transitions: result.transitions, ui });
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
cta.addEventListener('click', () => { if (!cta.disabled) dispatch({ type: cta.dataset.action }); });

coach = reduceCoach(null, { state, view: deriveView(state), ui });
render();
// Test hook, only with ?debug=1.
if (params.get('debug') === '1') window.__opticsGuided = { dispatch, getState: () => state, view: () => deriveView(state) };
