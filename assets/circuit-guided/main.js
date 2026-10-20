// Page glue for Science Lab 2.0 Pilot #6 B3.
// It owns state + DOM orchestration only. Science is model/engine, learner wording is script, bench visuals/input are B2.
import { createCircuitStorage } from './storage.js';
import { createInitialState, reduce } from './engine.js';
import { mountChallenges } from './challenge-view.js';
import { mountCircuitNotebook } from './notebook-view.js';
import { MAX_WIRES } from './model.js';
import { createCircuitBench } from './render.js';
import { bindCircuitInput } from './input.js';
import {
  COACH_NAME,
  TEXT,
  stationTitleFor,
  stepNavModel,
  screenFor,
  welcomeModel,
  ctaFor,
  coachModel,
  statusModel,
  dataModel,
  evidenceModel,
  benchModel,
  compareModel,
  compareKeyFor,
  compareTitleFor,
  compareHeadsFor,
  inferenceModel,
  conceptModel,
  announcementFor,
} from './script.js';
import {
  createActionBar,
  createAnnouncer,
  focusHandoff,
  renderStepNav,
  renderCoachCard,
  renderStatusBar,
  renderDataCard,
  renderEvidenceCard,
  renderCompareCard,
  renderConceptReveal,
} from '../science-guided/components.js';

const $ = (id) => document.getElementById(id);
const main = $('main');
const cta = $('cgg-cta');
const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };
const CARD_OF = {
  welcome: 'cgg-welcome',
  bench: 'cgg-bench-card',
  compare: 'cgg-compare',
  inference: 'cgg-inference',
  concept: 'cgg-concept',
};

const storage=createCircuitStorage(window.localStorage);
const loaded=storage.load();
let state = loaded.data?.main ?? createInitialState();
let storageStatus=loaded.status;
const statusNote=document.createElement('p');
statusNote.id='cgg-storage-status';
statusNote.setAttribute('role','status');
$('cgg-prototype-note').after(statusNote);
const persist=()=>{
  const result=storage.save({main:state,notebook:notebook.snapshot(),challenge:challenges.snapshot()});
  storageStatus=result.status;
  statusNote.textContent=storageStatus==='saved'?'本機已儲存學習進度':storageStatus==='unavailable'?'無法使用本機儲存，進度可能不會保留':'正在檢查學習進度';
};
let lastWhere = null;
let seq = 0;
const challenges = mountChallenges($('cgg-challenges'),{onChange:()=>persist()});
const notebook = mountCircuitNotebook($('cgg-notebook'), () => state, {onChange:()=>persist(),onComplete: () => { $('cgg-challenges-open').hidden = false; }});
$('cgg-challenges-open').addEventListener('click', () => {challenges.show();$('cgg-challenges-open').hidden=true;});
$('cgg-notebook-open').addEventListener('click', () => { notebook.show(); $('cgg-notebook-open').hidden = true; });

if(loaded.data?.notebook)notebook.restore(loaded.data.notebook);
if(loaded.data?.challenge)challenges.restore(loaded.data.challenge);
if(state.phase==='concept'&&loaded.data?.notebook?.level==='done')$('cgg-challenges-open').hidden=false;
statusNote.textContent=loaded.status==='restored'?'已恢復本機學習進度':loaded.status==='invalid'?'存檔內容無效，已使用新進度':loaded.status==='unavailable'?'無法讀取本機進度':'目前尚無儲存進度';
const announcer = createAnnouncer($('cgg-announcer'));
const actionBar = createActionBar(cta, {
  onAction: (action) => dispatch(action),
});
const coachEls = {
  root: $('cgg-coach'),
  name: $('cgg-coach-name'),
  main: $('cgg-coach-main'),
  sub: $('cgg-coach-sub'),
};
const statusEls = {
  root: $('cgg-status'),
  icon: $('cgg-status').querySelector('[data-cgg-status-icon]'),
  text: $('cgg-status').querySelector('[data-cgg-status-text]'),
};

coachEls.root.setAttribute('aria-label', COACH_NAME);
$('cgg-stepnav').setAttribute('aria-label', TEXT.stepNavLabel);
$('cgg-bench-card').setAttribute('aria-label', TEXT.benchLabel);
$('cgg-prototype-note').textContent = TEXT.prototypeNote;

const benchHost = $('cgg-bench-host');
const bench = createCircuitBench(benchHost);

const wireKey = (a, b) => [a, b].sort().join('|');
bindCircuitInput({
  root: bench.element,
  getLocked: () => benchModel(state) === null,
  getSwitchClosed: () => state.switchClosed === true,
  canConnect: (a, b) => state.wires.length < MAX_WIRES && !state.wires.some((w) => wireKey(w.from, w.to) === wireKey(a, b)),
  canDisconnect: (a, b) => state.wires.some((w) => wireKey(w.from, w.to) === wireKey(a, b)),
  canToggleSwitch: () => benchModel(state) !== null,
  onConnect: (from, to) => dispatch({ type: 'CONNECT', from, to }),
  onDisconnect: (from, to) => dispatch({ type: 'DISCONNECT', from, to }),
  onToggleSwitch: (value) => dispatch({ type: 'TOGGLE_SWITCH', value }),
});

function renderInference(model) {
  const root = $('cgg-inference');
  if (!model) {
    root.hidden = true;
    return;
  }
  root.hidden = false;
  put($('cgg-inference-title'), model.heading);
  const body = root.querySelector('[data-cgg-inference-body]');
  const sig = JSON.stringify(model.lines);
  if (body.dataset.sig !== sig) {
    body.dataset.sig = sig;
    body.replaceChildren(...model.lines.map((line) => {
      const p = body.ownerDocument.createElement('p');
      p.textContent = line;
      return p;
    }));
  }
}

function render(wasCta = false) {
  const active = document.activeElement;
  const screen = screenFor(state);
  const where = state.phase;
  const changed = where !== lastWhere;
  lastWhere = where;

  main.dataset.screen = screen.id;
  main.dataset.phase = state.phase;
  for (const [id, domId] of Object.entries(CARD_OF)) $(domId).hidden = id !== screen.id;

  put($('cgg-heading'), stationTitleFor(state));
  const welcome = welcomeModel(state);
  put($('cgg-welcome-title'), welcome.title);
  put($('cgg-welcome-sub'), welcome.sub);
  renderStepNav($('cgg-steps'), stepNavModel(state));

  const coach = coachModel(state);
  coachEls.root.hidden = !coach;
  if (coach) renderCoachCard(coachEls, coach);

  renderStatusBar(statusEls, statusModel(state));
  renderDataCard($('cgg-data'), dataModel(state), { title: TEXT.dataTitle });
  renderEvidenceCard($('cgg-evidence'), evidenceModel(state), { title: TEXT.evidenceTitle });
  $('cgg-side').hidden = screen.id === 'welcome';

  const bm = benchModel(state);
  if (bm) bench.update(bm);

  put($('cgg-compare-title'), compareTitleFor(state));
  renderCompareCard(
    { root: $('cgg-compare'), body: $('cgg-compare').querySelector('[data-cgg-compare-body]') },
    screen.id === 'compare' ? compareModel(state) : null,
    {
      heads: compareHeadsFor(state),
      tagLabel: (label, tag) => tag ? `${label}（${tag}）` : label,
      onAnswer: (question, answer) => dispatch({ type: 'ANSWER_COMPARE', compare: compareKeyFor(state), question, answer }),
    },
  );

  renderInference(screen.id === 'inference' ? inferenceModel(state) : null);
  renderConceptReveal(
    { root: $('cgg-concept'), heading: $('cgg-concept-title'), body: $('cgg-concept').querySelector('[data-cgg-concept-body]') },
    screen.id === 'concept' ? conceptModel(state) : null,
    { labelSuffix: '：' },
  );

  $('cgg-notebook-open').hidden = state.phase !== 'concept' || !$('cgg-notebook').hidden;
  if (state.phase !== 'concept') { notebook.hide(); challenges.hide(); $('cgg-challenges-open').hidden = true; }
  const c = ctaFor(state);
  actionBar.render(c ? { label: c.label, action: c.action, enabled: c.enabled, id: c.action.type } : null);

  const targets = changed ? [...screen.arrival, ...screen.focusTargets] : screen.focusTargets;
  focusHandoff({
    root: document.body,
    active,
    ctaGone: wasCta && (!c || cta.hidden || changed),
    targets,
  });
}

function dispatch(action) {
  const wasCta = document.activeElement === cta;
  const result = reduce(state, action);
  if (!result.accepted) return result;
  state = result.state;
  persist();
  announcer.say(announcementFor({ result, state, action, seq: ++seq }));
  render(wasCta);
  return result;
}

render();
