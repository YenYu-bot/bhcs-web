// Page glue for the guided optics prototype: engine + input + bench view. No optics logic lives here.
// Coach copy and CTA wiring are provisional scaffolding for I4; the teaching script (I5) replaces them.
import { reduce, createInitialState, deriveView } from './engine.js';
import { createInputController, snapForWidth } from './input.js';
import { createBenchView } from './render.js';
import { clarityMessage } from './visual.js';

const $ = (id) => document.getElementById(id);
let state = createInitialState();
for (const type of ['START', 'BEGIN']) state = reduce(state, { type }).state;

const bench = $('og-bench');
const benchView = createBenchView(bench);

const COACH = {
  'trial1-find-screen': '把屏幕移到影像最清楚的位置。',
  'trial1-complete': '就是這裡。影像現在最清楚。',
  'trial2-move-object': '把蠟燭移到離透鏡 15 cm 的位置。',
  'trial2-find-screen': '原本清楚的影像模糊了。再找一次。',
  'trial2-complete': '影像又清楚了。',
  'compare': '比較兩次的證據。',
  'trial3-move-object': '把蠟燭移到 5 cm。',
  'trial3-search-screen': '這次也試著找找看。',
  'trial3-no-real-screen-image': '屏幕本來就接不到清楚實像。',
  'trial3-view-through-lens': '屏幕接不到，但眼睛卻看得到。',
};
const CTA = {
  'trial1-find-screen': { label: '記錄這次結果', action: 'RECORD', enabled: (v) => v.recordEnabled },
  'trial1-complete': { label: '記錄這次結果', action: 'RECORD', enabled: (v) => v.recordEnabled },
  'trial2-find-screen': { label: '記錄這次結果', action: 'RECORD', enabled: (v) => v.recordEnabled },
  'trial2-complete': { label: '記錄這次結果', action: 'RECORD', enabled: (v) => v.recordEnabled },
  'trial3-search-screen': { label: '我找不到清楚實像', action: 'CONFIRM_NO_REAL_IMAGE', enabled: (v) => v.search.ctaUnlocked },
  'trial3-no-real-screen-image': { label: '從透鏡後面看', action: 'VIEW_THROUGH_LENS', enabled: () => true },
};
const RAYS_AFTER_FOUND = new Set(['trial1-complete', 'trial2-complete']);
const cta = $('og-cta');

function sync() {
  const view = deriveView(state);
  benchView.update(view, { rays: RAYS_AFTER_FOUND.has(state.phase) });
  const msg = clarityMessage(view), status = $('og-status');
  status.dataset.level = String(view.clarity.effectiveClarityLevel);
  $('og-status-icon').textContent = msg.icon; $('og-status-text').textContent = msg.text;
  $('og-coach-text').textContent = COACH[state.phase] ?? '';
  $('og-f').textContent = `${state.f} cm`; $('og-u').textContent = `${state.u} cm`;
  const c = CTA[state.phase];
  cta.hidden = !c;
  if (c) { cta.textContent = c.label; cta.disabled = !c.enabled(view); cta.dataset.action = c.action; }
}

function dispatch(action) {
  const result = reduce(state, action);
  state = result.state;
  sync();
  return result;
}

const controller = createInputController({
  getState: () => state, dispatch,
  getSnap: () => snapForWidth(window.innerWidth),
  getRect: () => bench.getBoundingClientRect(),
});
controller.attach(benchView.hits.screen, 'screen');
controller.attach(benchView.hits.candle, 'candle');
cta.addEventListener('click', () => { if (!cta.disabled) dispatch({ type: cta.dataset.action }); });

sync();
// Test hook, only with ?debug=1 (the browser checks drive phases the UI does not cover yet).
if (new URLSearchParams(location.search).get('debug') === '1') window.__opticsGuided = { dispatch, getState: () => state, view: () => deriveView(state) };
