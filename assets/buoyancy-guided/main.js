// B3 scaffold glue for the guided buoyancy lab: wires the engine to the controls so the input layer can be operated.
// Learner-facing wording, the picture and the teaching flow arrive in later increments (script.js, render.js);
// the few phase labels below are placeholders taken from the approved spec and will move to script.js.
import { createInitialState, reduce, deriveView } from './engine.js';
import { createInputController, syncControls, focusHandoff } from './input.js';
import { visualParams } from './visual.js';
import { createRenderer } from './render.js';

const $ = (id) => document.getElementById(id);
const main = $('main');
const bench = $('bg-bench');
const cta = $('bg-cta');
const hint = $('bg-hint');
const scene = $('bg-scene');
const tank = bench.querySelector('[data-bg-tank]');
const LABELS = { water: '水', brine: '濃鹽水', block: '方塊', wood: '大木塊', stone: '小石頭' };   // placeholder wording; script.js owns it from B5
const renderer = createRenderer({ scene, labels: LABELS });

const BENCH_PHASES = new Set(['mission', 'trial1-test', 'trial1-complete', 'trial2-switch-liquid', 'trial2-test', 'trial2-complete', 'trial3-drop', 'trial3-observed']);
const PLACEHOLDER_CTA = {
  welcome: () => ({ label: '開始實驗', action: { type: 'START' }, enabled: true }),
  mission: () => ({ label: '動手試試看', action: { type: 'BEGIN' }, enabled: true }),
  'trial1-test': (v) => ({ label: '記錄第一次結果', action: { type: 'RECORD_TRIAL', trial: 1 }, enabled: v.recordEnabled }),
  'trial1-complete': (v) => ({ label: '記錄第一次結果', action: { type: 'RECORD_TRIAL', trial: 1 }, enabled: v.recordEnabled }),
  'trial2-test': (v) => ({ label: '記錄第二次結果', action: { type: 'RECORD_TRIAL', trial: 2 }, enabled: v.recordEnabled }),
  'trial2-complete': (v) => ({ label: '記錄第二次結果', action: { type: 'RECORD_TRIAL', trial: 2 }, enabled: v.recordEnabled }),
  'trial2-recorded': () => ({ label: '比較兩次', action: { type: 'CONTINUE' }, enabled: true }),
  compare: (v) => ({ label: '繼續', action: { type: 'CONTINUE' }, enabled: v.compare?.allCorrect === true }),
  'trial3-observed': () => ({ label: '我觀察到了', action: { type: 'CONTINUE' }, enabled: true }),
};

let state = createInitialState();
let pendingRestore = false;            // a drag ended without the engine moving anything: draw the objects back where they belong
const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };

function render(wasCta = false) {
  const active = document.activeElement;   // read before the controls are synced: a browser drops focus the moment the focused control is disabled
  const view = deriveView(state);
  const onBench = BENCH_PHASES.has(state.phase);
  main.dataset.screen = state.phase === 'welcome' ? 'welcome' : onBench ? 'bench' : 'later';
  $('bg-welcome').hidden = state.phase !== 'welcome';
  $('bg-bench-card').hidden = !onBench;
  $('bg-later').hidden = state.phase === 'welcome' || onBench;
  Object.assign(main.dataset, { phase: state.phase, slots: String(state.slots), liquid: state.liquidId, tankObject: state.tank.objectId ?? '', drops: String(state.dropCount.trial1 + state.dropCount.trial2) });
  syncControls(bench, view);
  const mass = bench.querySelector('[data-bg-mass]');
  mass.hidden = !view.controls.objects.block.available;
  put(mass, `質量 ${view.facts.currentBlock.massG} g`);
  pendingRestore = false;
  if (onBench) renderer.render(visualParams(view));
  const c = PLACEHOLDER_CTA[state.phase]?.(view) ?? null;
  cta.hidden = !c;
  if (c) { put(cta, c.label); cta.disabled = !c.enabled; cta.dataset.action = c.action.type; }
  focusHandoff({ root: document.body, active, ctaGone: wasCta && (!c || cta.hidden), targets: ['[data-bg-object]', '#bg-cta', '#bg-heading'] });
}

function dispatch(action) {
  const wasCta = document.activeElement === cta;
  const result = reduce(state, action);
  state = result.state;
  if (result.accepted) hint.textContent = '';
  render(wasCta);
  return result;
}

cta.addEventListener('click', () => {
  const c = PLACEHOLDER_CTA[state.phase]?.(deriveView(state));
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
  onInvalidDrop: ({ reason }) => { hint.textContent = reason === 'outside-tank' ? '要放進水槽裡才有結果。' : ''; },
  onBlocked: ({ control }) => { hint.textContent = control === 'add-ballast' || control === 'remove-ballast' ? '先把方塊拿出來，再調整配重。' : ''; },
});

render();
