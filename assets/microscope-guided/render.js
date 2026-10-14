// Synchronized bench renderer for the guided microscope lab (Pilot #3, B2). SVG only, no state, no timers.
// It draws what engine.deriveView() hands it. Screen positions come from view.positions (model.specimenToScreen) and
// every size comes from model.js; this file converts to presentation units but never re-derives the geometry.
//
//   Eyepiece  600 x 600, circular field (centre VIEW_CENTER, radius VIEW_RADIUS_PX), everything clipped to the circle.
//             A marker that only partly enters the field stays in the tree and is clipped; it is never dropped
//             because its centre crossed the rim. Only markers with no overlap (view.visibleIds) are hidden.
//   Overview  340 x 220 top view of the stage. The slide and its markers follow the stage 1:1; the optical axis and
//             the ring marking the current field of view stay fixed.
//             Overview axes follow model.js: stage x right+, y up+, SVG y down.
import { VIEW_CENTER, VIEW_RADIUS_PX, STAGE_GAIN, objectiveScale, fieldRadiusWorld } from './model.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Presentation constants (not science): how many world units one overview pixel stands for, and the overview frame.
export const OVERVIEW_WU_PER_PX = 3.6;
export const OVERVIEW_SIZE = Object.freeze({ width: 340, height: 220 });
export const OVERVIEW_CENTER = Object.freeze({ x: OVERVIEW_SIZE.width / 2, y: OVERVIEW_SIZE.height / 2 });
// The overview is a map, not a to-scale picture: markers are drawn this many times larger than their true size so they stay legible.
// Their positions are exact.
export const OVERVIEW_MARKER_BOOST = 2;
export const SLIDE_PX = Object.freeze({ width: 200, height: 80 });
export const EYEPIECE_SIZE = VIEW_CENTER.x * 2;

let instanceCount = 0;
const n = (v) => Number(v.toFixed(3));

function el(doc, name, attrs = {}, parent = null) {
  const node = doc.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (parent) parent.appendChild(node);
  return node;
}

// Marker shapes live in a unit circle (bounding radius 1); the caller scales them by feature.radius (x z in the eyepiece).
function drawMarker(doc, id, parent) {
  const ink = '#1f2a44';
  const g = el(doc, 'g', { class: 'mg-marker-shape' }, parent);
  if (id === 'e') {
    // Lowercase e: crossbar plus an open arc. Fixed geometry, no font metrics, clearly different when turned 180 degrees.
    el(doc, 'path', { d: 'M -0.7 0 H 0.7 A 0.7 0.7 0 1 0 0.45 0.53', fill: 'none', stroke: ink, 'stroke-width': 0.25, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
  } else if (id === 'A') {
    el(doc, 'polygon', { points: '0,-0.85 0.75,0.5 -0.75,0.5', fill: '#c2410c' }, g);
  } else if (id === 'C') {
    el(doc, 'rect', { x: -0.7, y: -0.7, width: 1.4, height: 1.4, fill: '#047857' }, g);
  } else {
    el(doc, 'circle', { cx: 0, cy: 0, r: 1, fill: '#1d4ed8' }, g);
  }
  return g;
}

export function createMicroscopeView({ eyepieceRoot, overviewRoot, eyepieceLabel = null, stageLabel = null }) {
  const doc = eyepieceRoot.ownerDocument;
  const uid = `mg-${++instanceCount}`;
  const c = VIEW_CENTER;

  // ---- eyepiece -------------------------------------------------------------------------------------------------
  const eye = el(doc, 'svg', { viewBox: `0 0 ${EYEPIECE_SIZE} ${EYEPIECE_SIZE}`, class: 'mg-eyepiece', role: 'img', 'data-role': 'eyepiece' });
  if (eyepieceLabel) eye.setAttribute('aria-label', eyepieceLabel);
  const defs = el(doc, 'defs', {}, eye);
  const clip = el(doc, 'clipPath', { id: `${uid}-field-clip` }, defs);
  el(doc, 'circle', { cx: c.x, cy: c.y, r: VIEW_RADIUS_PX }, clip);
  el(doc, 'rect', { x: 0, y: 0, width: EYEPIECE_SIZE, height: EYEPIECE_SIZE, fill: '#0b1020', class: 'mg-eyepiece-surround' }, eye);
  el(doc, 'circle', { cx: c.x, cy: c.y, r: VIEW_RADIUS_PX, fill: '#f4f1e8', class: 'mg-field', 'data-role': 'field' }, eye);
  const eyeLayer = el(doc, 'g', { 'clip-path': `url(#${uid}-field-clip)`, 'data-role': 'clipped-layer' }, eye);
  el(doc, 'circle', { cx: c.x, cy: c.y, r: VIEW_RADIUS_PX, fill: 'none', stroke: '#0b1020', 'stroke-width': 3, class: 'mg-field-rim' }, eye);
  eyepieceRoot.replaceChildren(eye);

  // ---- overview -------------------------------------------------------------------------------------------------
  const oc = OVERVIEW_CENTER;
  const ov = el(doc, 'svg', { viewBox: `0 0 ${OVERVIEW_SIZE.width} ${OVERVIEW_SIZE.height}`, class: 'mg-overview', role: 'group', tabindex: '0', 'data-role': 'stage-surface', 'data-locked': 'false', 'aria-disabled': 'false' });
  if (stageLabel) ov.setAttribute('aria-label', stageLabel);
  el(doc, 'rect', { x: 0, y: 0, width: OVERVIEW_SIZE.width, height: OVERVIEW_SIZE.height, rx: 8, fill: '#d9dde6', class: 'mg-stage-plate' }, ov);
  const slide = el(doc, 'g', { 'data-role': 'slide' }, ov);
  el(doc, 'rect', { x: -SLIDE_PX.width / 2, y: -SLIDE_PX.height / 2, width: SLIDE_PX.width, height: SLIDE_PX.height, rx: 3, fill: '#eaf3f6', stroke: '#7c8aa5', 'stroke-width': 1.5, class: 'mg-slide-glass' }, slide);
  const slideFeatures = el(doc, 'g', { 'data-role': 'slide-features' }, slide);
  const axis = el(doc, 'g', { 'data-role': 'optical-axis' }, ov);
  const ring = el(doc, 'circle', { cx: oc.x, cy: oc.y, r: 0, fill: 'rgba(255,255,255,0.18)', stroke: '#b91c1c', 'stroke-width': 2, 'data-role': 'fov-ring' }, axis);
  el(doc, 'path', { d: `M ${oc.x - 5} ${oc.y} H ${oc.x + 5} M ${oc.x} ${oc.y - 5} V ${oc.y + 5}`, stroke: '#b91c1c', 'stroke-width': 1, fill: 'none' }, axis);
  overviewRoot.replaceChildren(ov);

  const nodes = new Map();   // feature id -> { eye, slide }

  function reconcile(features) {
    const ids = new Set(features.map((f) => f.id));
    for (const [id, pair] of nodes) if (!ids.has(id)) { pair.eye.remove(); pair.slide.remove(); nodes.delete(id); }
    for (const f of features) {
      if (nodes.has(f.id)) continue;
      const e = el(doc, 'g', { 'data-feature': f.id }, eyeLayer);
      drawMarker(doc, f.id, e);
      const s = el(doc, 'g', { 'data-feature': f.id }, slideFeatures);
      drawMarker(doc, f.id, s);
      nodes.set(f.id, { eye: e, slide: s });
    }
  }

  function update(view) {
    const { objective, stage, features, positions } = view;
    const visible = new Set(view.visibleIds), inside = new Set(view.fullyInsideIds ?? []);
    const z = objectiveScale(objective), q = OVERVIEW_WU_PER_PX;
    reconcile(features);
    eye.setAttribute('data-objective', String(objective));
    for (const f of features) {
      const pair = nodes.get(f.id), p = positions[f.id];
      // The eyepiece image is turned half a revolution relative to the slide; position comes from the model.
      pair.eye.setAttribute('transform', `translate(${n(p.x)} ${n(p.y)}) rotate(180) scale(${n(f.radius * z)})`);
      pair.eye.setAttribute('display', visible.has(f.id) ? 'inline' : 'none');
      pair.eye.setAttribute('data-visible', String(visible.has(f.id)));
      pair.eye.setAttribute('data-fully-inside', String(inside.has(f.id)));
      pair.slide.setAttribute('transform', `translate(${n(f.wx / q)} ${n(-f.wy / q)}) scale(${n((f.radius * OVERVIEW_MARKER_BOOST) / q)})`);
    }
    slide.setAttribute('transform', `translate(${n(oc.x + (STAGE_GAIN * stage.x) / q)} ${n(oc.y - (STAGE_GAIN * stage.y) / q)})`);
    ring.setAttribute('r', String(n(fieldRadiusWorld(objective) / q)));
    ov.setAttribute('data-locked', String(!!view.locked));
    ov.setAttribute('aria-disabled', String(!!view.locked));
  }

  return {
    update,
    getStageSurface: () => ov,
    getEyepiece: () => eye,
    destroy() { eye.remove(); ov.remove(); nodes.clear(); },
  };
}
