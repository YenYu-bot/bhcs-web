// Bench renderer for the guided unknown-liquid lab (Pilot #4, B2): three test tubes, a strip tray and the used strips.
// state → visual only. It never reads the engine, never decides which cup may be tested or what a result means, and never
// sees a liquid's pH or kind: it draws the presentation model it is handed (observations already rebuilt by
// model.deriveObservation) and nothing else. The three liquids are drawn from one shared description, so before a test
// nothing on the bench can tell them apart.
//
// Colour is never the only cue. Every strip colour carries a fixed pattern (red: diagonal hatch, blue: dots) and every used
// strip has its result written next to it. A used strip keeps both states: its upper half shows the colour it started
// with, its lower half the colour it turned (or kept) after the dip.
//
// Built once, then patched: update() changes attributes and text in place, so focus, pointer capture and the
// accessibility tree survive every update. SVG ids carry a per-instance prefix, so two benches on one page never collide.
import { COLOR_HEX, SAMPLE_IDS } from './model.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Bench geometry in SVG user units (viewBox 0 0 600 380). Presentation only.
export const BENCH_VIEWBOX = Object.freeze({ width: 600, height: 380 });
export const TUBE_X = Object.freeze({ A: 150, B: 300, C: 450 });
export const TUBE = Object.freeze({ top: 70, shoulder: 210, radius: 36, liquidTop: 130 });   // glass 72 wide, bottom at 246
export const DROP_ZONE = Object.freeze({ halfWidth: 70, top: 30, bottom: 296 });            // 140 x 266 per tube
export const TRAY = Object.freeze({ x: 220, y: 302, width: 160, height: 64 });
export const STRIP = Object.freeze({ x: 245, y: 322, width: 110, height: 24 });
export const STRIP_HIT = Object.freeze({ x: 230, y: 298, width: 140, height: 80 });

// The two strips used on the bench. Phenolphthalein is not a bench tool.
export const BENCH_INDICATORS = Object.freeze(['blue-litmus', 'red-litmus']);
const START_COLOR = Object.freeze({ 'blue-litmus': 'blue', 'red-litmus': 'red' });
// Pattern follows the colour actually shown, never whether the strip changed.
export const PATTERN_OF_COLOR = Object.freeze({ red: 'hatch', blue: 'dots' });

// Neutral observation wording. Nothing here names a class of liquid.
export const BENCH_TEXT = Object.freeze({
  indicator: Object.freeze({ 'blue-litmus': '藍色石蕊', 'red-litmus': '紅色石蕊' }),
  result: Object.freeze({ 'turns-red': '變紅色', 'stays-blue': '維持藍色', 'turns-blue': '變藍色', 'stays-red': '維持紅色' }),
  testButton: (sampleId) => `測試液體 ${sampleId}`,
  testedButton: (sampleId) => `液體 ${sampleId} 已測`,
  testAria: (indicator, sampleId) => `用${indicator}測試液體 ${sampleId}`,
  testedAria: (indicator, sampleId) => `液體 ${sampleId} 已用${indicator}測過`,
  trayHint: (indicator) => `${indicator}試紙：拖到一支試管進行測試，或按試管下方的按鈕。`,
  usedName: (indicator) => `${indicator}：`,
});

let instanceCount = 0;

function svg(doc, name, attrs = {}, parent = null) {
  const node = doc.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (parent) parent.appendChild(node);
  return node;
}
function html(doc, name, attrs = {}, parent = null) {
  const node = doc.createElement(name);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') node.textContent = v; else node.setAttribute(k, String(v));
  }
  if (parent) parent.appendChild(node);
  return node;
}
const setAttr = (node, k, v) => { if (node.getAttribute(k) !== String(v)) node.setAttribute(k, String(v)); };
const setText = (node, v) => { if (node.textContent !== v) node.textContent = v; };
const setHidden = (node, hidden) => { if (node.hidden !== hidden) node.hidden = hidden; };

// The outline of one tube: straight walls down to the shoulder, then a round bottom.
function tubePath(cx, inset = 0) {
  const r = TUBE.radius - inset, l = cx - r, rr = cx + r;
  return `M ${l} ${TUBE.top} V ${TUBE.shoulder} A ${r} ${r} 0 0 0 ${rr} ${TUBE.shoulder} V ${TUBE.top}`;
}

/** A colour swatch with its pattern on top: base fill + pattern overlay. Used for the tray strip and the used strips. */
function swatch(doc, parent, uid, box) {
  const g = svg(doc, 'g', { class: 'abg-swatch' }, parent);
  const base = svg(doc, 'rect', { ...box, class: 'abg-color-fill' }, g);
  const marks = svg(doc, 'rect', { ...box, class: 'abg-pattern-fill' }, g);
  return {
    g,
    paint(color) {
      setAttr(base, 'fill', COLOR_HEX[color]);
      setAttr(g, 'data-color', color);
      const pattern = PATTERN_OF_COLOR[color];
      setAttr(g, 'data-pattern', pattern);
      setAttr(marks, 'fill', `url(#${uid}-${pattern})`);
    },
  };
}

/**
 * createAcidBaseBench(root, { text }) → { update(model), destroy(), element, uid }
 *
 * model = {
 *   activeIndicatorId: 'blue-litmus' | 'red-litmus',
 *   locked: boolean,
 *   samples: [{ sampleId, tested, observations: [{ indicatorId, startColor, result, resultColor }] }],
 * }
 * `tested` (has this cup already been tested with the active strip?) and `locked` are decided by the caller.
 * Any other field on an observation (sampleId, changed, a pH, a kind ...) is ignored.
 */
export function createAcidBaseBench(root, { text = BENCH_TEXT } = {}) {
  const doc = root.ownerDocument;
  const uid = `abg-${++instanceCount}`;
  const bench = html(doc, 'div', { class: 'abg-bench', 'data-role': 'bench' });
  const stage = html(doc, 'div', { class: 'abg-stage' }, bench);

  // ---- SVG: tubes, rack, tray ------------------------------------------------------------------------------------
  const art = svg(doc, 'svg', { class: 'abg-svg', viewBox: `0 0 ${BENCH_VIEWBOX.width} ${BENCH_VIEWBOX.height}`, 'aria-hidden': 'true', focusable: 'false', 'data-role': 'bench-art' }, stage);
  const defs = svg(doc, 'defs', {}, art);
  const hatch = svg(doc, 'pattern', { id: `${uid}-hatch`, width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  svg(doc, 'line', { x1: 2, y1: 0, x2: 2, y2: 8, class: 'abg-pattern-mark', stroke: '#ffffff', 'stroke-opacity': 0.8, 'stroke-width': 2.5 }, hatch);
  const dots = svg(doc, 'pattern', { id: `${uid}-dots`, width: 8, height: 8, patternUnits: 'userSpaceOnUse' }, defs);
  svg(doc, 'circle', { cx: 4, cy: 4, r: 1.7, class: 'abg-pattern-mark', fill: '#ffffff', 'fill-opacity': 0.85 }, dots);

  svg(doc, 'rect', { x: 70, y: 252, width: 460, height: 12, rx: 3, class: 'abg-rack-base' }, art);
  svg(doc, 'rect', { x: 70, y: 176, width: 460, height: 14, rx: 3, class: 'abg-rack-bar abg-rack-back' }, art);

  const tubes = {};
  for (const id of SAMPLE_IDS) {
    const cx = TUBE_X[id];
    const g = svg(doc, 'g', { class: 'abg-tube', 'data-tube': id }, art);
    const zone = svg(doc, 'rect', { x: cx - DROP_ZONE.halfWidth, y: DROP_ZONE.top, width: DROP_ZONE.halfWidth * 2, height: DROP_ZONE.bottom - DROP_ZONE.top, rx: 14, class: 'abg-drop-zone', 'data-drop-sample': id }, g);
    const clip = svg(doc, 'clipPath', { id: `${uid}-clip-${id}` }, defs);
    svg(doc, 'path', { d: `${tubePath(cx, 3)} Z` }, clip);
    // Every liquid gets the same shape, height and fill: nothing on the bench depends on what is in the cup.
    svg(doc, 'rect', { x: cx - TUBE.radius, y: TUBE.liquidTop, width: TUBE.radius * 2, height: TUBE.shoulder + TUBE.radius - TUBE.liquidTop, class: 'abg-liquid', 'clip-path': `url(#${uid}-clip-${id})` }, g);
    svg(doc, 'path', { d: tubePath(cx), class: 'abg-glass' }, g);
    svg(doc, 'rect', { x: cx - TUBE.radius - 7, y: TUBE.top - 8, width: (TUBE.radius + 7) * 2, height: 8, rx: 3, class: 'abg-rim' }, g);
    svg(doc, 'text', { x: cx, y: 290, class: 'abg-tube-label', 'text-anchor': 'middle' }, g).textContent = id;
    tubes[id] = { g, zone };
  }
  svg(doc, 'rect', { x: 70, y: 196, width: 460, height: 14, rx: 3, class: 'abg-rack-bar' }, art);

  svg(doc, 'rect', { ...TRAY, rx: 10, class: 'abg-tray' }, art);

  // The strip in the tray is an HTML box laid over the drawing, sized and placed in viewBox proportions. It is not an SVG
  // child because browsers ignore touch-action on SVG children: only an HTML box can keep a touch drag from scrolling.
  const pct = (v, of) => `${(v / of * 100).toFixed(4)}%`;
  const strip = html(doc, 'div', { class: 'abg-strip', 'data-role': 'strip', 'aria-hidden': 'true' }, stage);
  strip.style.left = pct(STRIP_HIT.x, BENCH_VIEWBOX.width);
  strip.style.top = pct(STRIP_HIT.y, BENCH_VIEWBOX.height);
  strip.style.width = pct(STRIP_HIT.width, BENCH_VIEWBOX.width);
  strip.style.height = pct(STRIP_HIT.height, BENCH_VIEWBOX.height);
  const stripArt = svg(doc, 'svg', { class: 'abg-strip-art', viewBox: `0 0 ${STRIP_HIT.width} ${STRIP_HIT.height}`, 'aria-hidden': 'true', focusable: 'false' }, strip);
  const sx = STRIP.x - STRIP_HIT.x, sy = STRIP.y - STRIP_HIT.y;
  const traySwatch = swatch(doc, stripArt, uid, { x: sx, y: sy, width: STRIP.width, height: STRIP.height });
  svg(doc, 'rect', { x: sx, y: sy, width: STRIP.width, height: STRIP.height, rx: 2, class: 'abg-strip-edge' }, stripArt);

  const hint = html(doc, 'p', { class: 'abg-tray-hint', 'data-role': 'tray-hint' }, bench);

  // ---- per-cup controls and used strips (real DOM: names and results are readable without the SVG) ----------------
  const list = html(doc, 'div', { class: 'abg-samples' }, bench);
  const cups = {};
  for (const id of SAMPLE_IDS) {
    const box = html(doc, 'div', { class: 'abg-sample', role: 'group', 'data-sample': id, 'aria-label': `液體 ${id}` }, list);
    const button = html(doc, 'button', { type: 'button', class: 'abg-test', 'data-dip-sample': id }, box);
    const used = html(doc, 'ul', { class: 'abg-used', 'data-role': 'used' }, box);
    const slots = {};
    for (const indicatorId of BENCH_INDICATORS) {
      const li = html(doc, 'li', { class: 'abg-used-strip', 'data-slot': indicatorId }, used);
      li.hidden = true;
      const mini = svg(doc, 'svg', { class: 'abg-used-art', viewBox: '0 0 20 48', 'aria-hidden': 'true', focusable: 'false' }, li);
      const top = swatch(doc, mini, uid, { x: 1, y: 1, width: 18, height: 23 });
      top.g.setAttribute('data-part', 'start');
      const bottom = swatch(doc, mini, uid, { x: 1, y: 24, width: 18, height: 23 });
      bottom.g.setAttribute('data-part', 'result');
      svg(doc, 'rect', { x: 1, y: 1, width: 18, height: 46, rx: 1.5, class: 'abg-strip-edge' }, mini);
      svg(doc, 'line', { x1: 1, y1: 24, x2: 19, y2: 24, class: 'abg-strip-dipline' }, mini);
      // Two lines: which strip, then what it did. Read together they say e.g. "藍色石蕊：變紅色".
      const label = html(doc, 'span', { class: 'abg-used-text', 'data-role': 'used-text' }, li);
      const nameLine = html(doc, 'span', { class: 'abg-used-name' }, label);
      const resultLine = html(doc, 'span', { class: 'abg-used-result' }, label);
      slots[indicatorId] = { li, top, bottom, nameLine, resultLine };
    }
    cups[id] = { box, button, slots };
  }
  root.appendChild(bench);

  function update(model) {
    const active = model?.activeIndicatorId;
    if (!BENCH_INDICATORS.includes(active)) throw new RangeError(`not a bench indicator: ${active}`);
    const locked = model.locked === true;
    const name = text.indicator[active];
    setAttr(bench, 'data-indicator', active);
    setAttr(bench, 'data-locked', locked);
    traySwatch.paint(START_COLOR[active]);
    setText(hint, text.trayHint(name));

    const byId = new Map((Array.isArray(model.samples) ? model.samples : []).map((s) => [s?.sampleId, s]));
    for (const id of SAMPLE_IDS) {
      const sample = byId.get(id) ?? { tested: false, observations: [] };
      const cup = cups[id], tested = sample.tested === true;
      setText(cup.button, tested ? text.testedButton(id) : text.testButton(id));
      setAttr(cup.button, 'aria-label', tested ? text.testedAria(name, id) : text.testAria(name, id));
      if (cup.button.disabled !== (tested || locked)) cup.button.disabled = tested || locked;
      setAttr(cup.box, 'data-tested', tested);

      const seen = {};
      for (const o of Array.isArray(sample.observations) ? sample.observations : []) {
        if (o && BENCH_INDICATORS.includes(o.indicatorId) && o.result in text.result
          && PATTERN_OF_COLOR[o.startColor] && PATTERN_OF_COLOR[o.resultColor]) seen[o.indicatorId] = o;
      }
      for (const indicatorId of BENCH_INDICATORS) {
        const slot = cup.slots[indicatorId], o = seen[indicatorId];
        setHidden(slot.li, !o);
        if (!o) { setText(slot.nameLine, ''); setText(slot.resultLine, ''); continue; }
        slot.top.paint(o.startColor);
        slot.bottom.paint(o.resultColor);
        setAttr(slot.li, 'data-result', o.result);
        setText(slot.nameLine, text.usedName(text.indicator[indicatorId]));
        setText(slot.resultLine, text.result[o.result]);
      }
    }
  }

  function destroy() {
    bench.remove();
  }

  return { update, destroy, element: bench, uid };
}
