// Page glue for the guided optics lab: engine + input + bench view + teaching script + saved progress. No optics logic lives here.
import { reduce, createInitialState, deriveView } from './engine.js';
import { createInputController, snapForWidth } from './input.js';
import { createBenchView } from './render.js';
import { clarityMessage } from './visual.js';
import { MESSAGES, reduceCoach, screenFor, stepFor, ctaFor, evidenceList, compareCard, conceptModel, notebookModel, challengeModel, completeModel } from './script.js';
import { createStore, restore } from './persist.js';
import { analyticsFor, createTracker } from './analytics.js';

const $ = (id) => document.getElementById(id);
const main = $('main'), cta = $('og-cta'), bench = $('og-bench');
const benchView = createBenchView(bench);
const safeStorage = () => { try { return window.localStorage; } catch (_) { return null; } };
const store = createStore({ storage: safeStorage() });
const restored = restore(store.load());
const track = createTracker(window);

let state = restored ?? createInitialState();
let ui = { naming: false };
let coach = null;
let renderedCompare = '', renderedConcept = false, notebookBuilt = false, challengeKey = '';

const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };   // writing identical text would re-announce in a live region

function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) k in e ? (e[k] = v) : e.setAttribute(k, v);
  e.append(...kids.filter((k) => k !== null && k !== undefined));
  return e;
}
const radioPill = (name, value, label, onChange, cls = '') => {
  const input = el('input', { type: 'radio', name, value });
  input.addEventListener('change', () => onChange(value));
  return el('label', { className: `og-option ${cls}`.trim() }, input, el('span', {}, label));
};

// ---- typed text is saved shortly after the learner pauses, and always before a button acts or the page is left
const pending = { conclusion: {}, note: null };
let timer = null;
function flush() {
  clearTimeout(timer);
  const fields = pending.conclusion, note = pending.note;
  pending.conclusion = {}; pending.note = null;
  if (Object.keys(fields).length) dispatch({ type: 'SAVE_CONCLUSION', fields });
  if (note !== null) dispatch({ type: 'SAVE_CHALLENGE_NOTE', id: 3, text: note });
}
const queue = () => { clearTimeout(timer); timer = setTimeout(flush, 300); };
addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

// ---- compare
function renderCompare() {
  const card = compareCard(state.records);
  if (!card) return;
  const key = JSON.stringify(card.rows);
  if (key !== renderedCompare) {
    renderedCompare = key;
    const rows = $('og-compare-rows'); rows.replaceChildren();
    for (const r of card.rows) rows.append(el('tr', {}, el('th', { scope: 'row' }, r.label), el('td', {}, r.first), el('td', {}, r.second)));
    const qs = $('og-questions'); qs.replaceChildren();
    for (const q of card.questions) {
      const group = el('div', { className: 'og-options' });
      for (const [value, label] of q.options) group.append(radioPill(`og-q-${q.id}`, value, label, (v) => dispatch({ type: 'ANSWER_COMPARE', question: q.id, answer: v })));
      qs.append(el('fieldset', { className: 'og-question' }, el('legend', {}, q.text), group));
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
  $('og-formula').replaceChildren(el('h3', {}, model.formula.heading), el('p', { className: 'og-formula-expression' }, model.formula.expression),
    el('ul', {}, ...model.formula.lines.map((l) => el('li', {}, l.text, el('span', {}, l.found)))),
    el('p', { className: 'og-formula-note' }, model.formula.negativeNote));
}

// ---- research notebook: three ways to write the same finding; Level A is the default
const nb = {};
function buildNotebook(m) {
  const body = $('og-nb-body'); body.replaceChildren();
  const rows = $('og-nb-rows'); rows.replaceChildren();
  for (const r of m.evidenceRows) rows.append(el('tr', {}, el('th', { scope: 'row' }, r.label), el('td', {}, r.first), el('td', {}, r.second)));

  const levels = el('div', { className: 'og-options' });
  for (const l of m.levels) levels.append(radioPill('og-level', l.id, `${l.id}　${l.title}`, (v) => { flush(); dispatch({ type: 'SAVE_CONCLUSION', fields: { level: v } }); }));
  nb.levelDesc = el('p', { className: 'og-level-desc' });
  body.append(el('fieldset', { className: 'og-nb-levels' }, el('legend', {}, '你想怎麼寫？'), levels, nb.levelDesc));

  // Level A
  const a = el('div', { className: 'og-level-panel', 'data-level': 'A' });
  nb.given = el('p', { className: 'og-given' });
  const posGroup = el('div', { className: 'og-options' }), sizeGroup = el('div', { className: 'og-options' });
  for (const [v, label] of m.a.positionOptions) posGroup.append(radioPill('og-a-position', v, label, (x) => dispatch({ type: 'SAVE_CONCLUSION', fields: { relationPosition: x } })));
  for (const [v, label] of m.a.sizeOptions) sizeGroup.append(radioPill('og-a-size', v, label, (x) => dispatch({ type: 'SAVE_CONCLUSION', fields: { relationSize: x } })));
  nb.nudge = el('p', { className: 'og-nudge' });
  a.append(nb.given, el('fieldset', { className: 'og-question' }, el('legend', { className: 'og-stem' }, `${m.a.positionStem}……`), posGroup),
    el('fieldset', { className: 'og-question' }, el('legend', { className: 'og-stem' }, `${m.a.sizeStem}……`), sizeGroup), nb.nudge);
  // Level B
  const b = el('div', { className: 'og-level-panel', 'data-level': 'B' });
  nb.free = el('textarea', { id: 'og-nb-free', rows: 5, maxLength: 1000, placeholder: m.b.placeholder });
  nb.free.addEventListener('input', () => { pending.conclusion.freeText = nb.free.value; queue(); });
  nb.free.addEventListener('blur', flush);
  b.append(el('label', { className: 'og-field', htmlFor: 'og-nb-free' }, m.b.prompt), nb.free);
  // Level C
  const c = el('div', { className: 'og-level-panel', 'data-level': 'C' });
  nb.evidence = el('textarea', { id: 'og-nb-evidence', rows: 4, maxLength: 1000 });
  nb.limit = el('textarea', { id: 'og-nb-limit', rows: 4, maxLength: 1000 });
  nb.evidence.addEventListener('input', () => { pending.conclusion.evidenceText = nb.evidence.value; queue(); });
  nb.limit.addEventListener('input', () => { pending.conclusion.limitationText = nb.limit.value; queue(); });
  nb.evidence.addEventListener('blur', flush); nb.limit.addEventListener('blur', flush);
  nb.ideas = el('details', { className: 'og-ideas', hidden: true }, el('summary', {}, '研究員常會想到的限制（寫完再看）'), el('ul', {}, ...m.c.ideas.map((t) => el('li', {}, t))));
  c.append(el('label', { className: 'og-field', htmlFor: 'og-nb-evidence' }, m.c.q1), nb.evidence, el('label', { className: 'og-field', htmlFor: 'og-nb-limit' }, m.c.q2), nb.limit, nb.ideas);
  nb.panels = { A: a, B: b, C: c };
  body.append(a, b, c);
  nb.levels = m.levels; nb.aGiven = m.a.given;
}

function syncNotebook() {
  const m = notebookModel(state.records, state.conclusion);
  if (!m) return;
  if (!notebookBuilt) { buildNotebook(m); notebookBuilt = true; }
  const c = state.conclusion;
  for (const input of document.querySelectorAll('input[name="og-level"]')) input.checked = c.level === input.value;
  put(nb.levelDesc, m.levels.find((l) => l.id === c.level)?.desc ?? '');
  for (const [id, panel] of Object.entries(nb.panels)) panel.hidden = c.level !== id;
  nb.given.replaceChildren(...m.a.given.map((t, i) => el('span', {}, i ? ' ' : '', t)));
  for (const input of document.querySelectorAll('input[name="og-a-position"]')) input.checked = c.relationPosition === input.value;
  for (const input of document.querySelectorAll('input[name="og-a-size"]')) input.checked = c.relationSize === input.value;
  put(nb.nudge, m.a.nudge ?? '');
  for (const [node, text] of [[nb.free, c.freeText], [nb.evidence, c.evidenceText], [nb.limit, c.limitationText]]) {
    if (document.activeElement !== node && node.value !== text) node.value = text;      // never rewrite what the learner is typing
  }
  nb.ideas.hidden = c.limitationText.trim().length < 2;
}

// ---- challenges: built once per challenge, then updated in place so focus and typing are never lost
const ch = {};
function buildChallenge(id) {
  const m = challengeModel(state, id);
  put($('og-challenge-title'), `挑戰 ${id}／${m.count}　${m.title}`);
  put($('og-ch-scenario'), m.scenario);
  const steps = $('og-ch-steps'); steps.replaceChildren();
  ch.steps = {};
  for (const s of m.steps) {
    const group = el('div', { className: 'og-options og-options-col' });
    for (const [value, label] of s.options) group.append(radioPill(`og-ch-${id}-${s.id}`, value, label, (v) => dispatch({ type: 'ANSWER_CHALLENGE', id, step: s.id, choice: v })));
    const fb = el('p', { className: 'og-feedback' });
    const fs = el('fieldset', { className: 'og-question' }, el('legend', {}, s.question), group, fb);
    steps.append(fs); ch.steps[s.id] = { fs, fb, name: `og-ch-${id}-${s.id}` };
  }
  const note = $('og-ch-note-input');
  note.value = '';
  challengeKey = String(id);
}
function syncChallenge() {
  const id = Number(state.phase.slice(-1));
  if (challengeKey !== String(id)) buildChallenge(id);
  const m = challengeModel(state, id);
  for (const s of m.steps) {
    const node = ch.steps[s.id];
    node.fs.hidden = !s.unlocked;
    for (const input of node.fs.querySelectorAll('input')) { input.checked = s.choice === input.value; input.disabled = s.correct; }
    put(node.fb, s.feedback ?? ''); node.fb.dataset.correct = String(s.correct);
  }
  $('og-ch-note').hidden = !m.note;
  if (m.note) {
    put($('og-ch-note-label'), m.note.label);
    const input = $('og-ch-note-input');
    input.placeholder = m.note.placeholder;
    if (document.activeElement !== input && input.value !== m.note.text) input.value = m.note.text;
  }
}
$('og-ch-note-input').addEventListener('input', (e) => { pending.note = e.target.value; queue(); });
$('og-ch-note-input').addEventListener('blur', flush);

function renderComplete() {
  const m = completeModel(state);
  $('og-complete-summary').replaceChildren(el('h3', {}, '你的發現'), el('div', { className: 'og-complete-lines' }, ...m.lines.map((t) => el('p', {}, t))));
}

function renderRecords() {
  const list = evidenceList(state.records), ul = $('og-records');
  $('og-records-wrap').hidden = list.length === 0;
  ul.replaceChildren(...list.map((r) => el('li', {}, el('b', {}, r.text), ` ${r.detail}`)));
}

const hits = benchView.hits;
const HEADING = { welcome: 'og-welcome-title', compare: 'og-compare-title', concept: 'og-concept-title', notebook: 'og-notebook-title', challenge: 'og-challenge-title', complete: 'og-complete-title' };
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
  if (screen === 'compare') renderCompare();
  if (screen === 'concept') renderConcept();
  if (screen === 'notebook') syncNotebook();
  if (screen === 'challenge') syncChallenge();
  if (screen === 'complete') renderComplete();
  put($('og-f'), `${state.f} cm`); put($('og-u'), `${state.u} cm`);
  renderRecords();
  $('og-restart').hidden = !state.records[1];
  put($('og-save-note'), store.failed ? '這個瀏覽器無法保存進度；關閉頁面後會消失。' : state.records[1] ? (restored ? '已接續你上次做到的地方。進度只儲存在這台瀏覽器。' : '進度只儲存在這台瀏覽器。') : '');

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
    if (state.phase === 'notebook' && state.conclusion.level === null) state = reduce(state, { type: 'SAVE_CONCLUSION', fields: { level: 'A' } }).state;
    if (result.transitions.length) ui = { naming: false };
    if (result.accepted) store.save(state);
    track(analyticsFor(result));
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
cta.addEventListener('click', () => { if (cta.disabled) return; flush(); if (!cta.disabled) dispatch({ type: cta.dataset.action }); });
$('og-restart').addEventListener('click', () => {
  if (!confirm('清除這台瀏覽器上的紀錄並重新開始？')) return;
  store.clear();
  location.reload();
});

if (state.phase === 'notebook' && state.conclusion.level === null) state = reduce(state, { type: 'SAVE_CONCLUSION', fields: { level: 'A' } }).state;
coach = reduceCoach(null, { state, view: deriveView(state), ui });
render();
