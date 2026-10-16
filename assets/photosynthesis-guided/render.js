// Bench renderer for Science Lab 2.0 Pilot #5 B2 (photosynthesis factor).
// Presentation only: no engine/model imports, no phase transitions, no persistence, no analytics.
//
// The caller supplies a presentation model:
// {
//   light: 15|60|100,
//   co2: number,
//   temperature: number,
//   locked: boolean,
//   allowedLights: [15,60,100] subset,
//   observation: null | { rate: finite non-negative number }
// }
//
// Any extra fields (including factor percentages, a limiting-factor id, correctness flags, etc.) are ignored.
// The renderer therefore cannot reveal the Concept answer before the page adapter chooses to show it.

const SVG_NS = 'http://www.w3.org/2000/svg';
export const BENCH_VIEWBOX = Object.freeze({ width: 640, height: 360 });
export const LIGHT_LEVELS = Object.freeze([15, 60, 100]);
export const MAX_BUBBLES = 20;
let instanceCount = 0;

export const BENCH_TEXT = Object.freeze({
  lightTitle: '光照',
  co2Title: 'CO₂',
  temperatureTitle: '水溫',
  changeTitle: '本次只改',
  changeValue: '光照',
  lightLabel: Object.freeze({ 15: '弱光', 60: '中光', 100: '強光' }),
  lightAria: Object.freeze({
    15: '設定為弱光，光照 15%',
    60: '設定為中光，光照 60%',
    100: '設定為強光，光照 100%',
  }),
  waiting: '開始觀察後，這裡會顯示相對產氧速度。',
  observed: (rate) => `相對產氧速度 ${rate.toFixed(1)}`,
});

function html(doc, tag, attrs = {}, parent = null) {
  const el = doc.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') el.textContent = v;
    else if (k === 'className') el.className = v;
    else el.setAttribute(k, String(v));
  }
  if (parent) parent.appendChild(el);
  return el;
}

function svg(doc, tag, attrs = {}, parent = null) {
  const el = doc.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (parent) parent.appendChild(el);
  return el;
}

const setText = (node, value) => {
  if (node.textContent !== value) node.textContent = value;
};
const setAttr = (node, name, value) => {
  if (node.getAttribute(name) !== String(value)) node.setAttribute(name, String(value));
};
const setHidden = (node, hidden) => {
  if (hidden) node.setAttribute('hidden', '');
  else node.removeAttribute('hidden');
};

function finiteIn(v, min, max) {
  return Number.isFinite(v) && v >= min && v <= max;
}

function validateModel(model) {
  if (!model || typeof model !== 'object' || Array.isArray(model)) throw new TypeError('bench model is required');
  if (!LIGHT_LEVELS.includes(model.light)) throw new RangeError(`unsupported light level: ${model.light}`);
  if (!finiteIn(model.co2, 0, 5000)) throw new RangeError(`invalid CO2: ${model.co2}`);
  if (!finiteIn(model.temperature, -20, 80)) throw new RangeError(`invalid temperature: ${model.temperature}`);
  if (!Array.isArray(model.allowedLights) || model.allowedLights.some((x) => !LIGHT_LEVELS.includes(x))) {
    throw new RangeError('allowedLights must contain only supported light levels');
  }
  if (new Set(model.allowedLights).size !== model.allowedLights.length) throw new RangeError('allowedLights contains duplicates');
  if (model.observation !== null && model.observation !== undefined) {
    if (!model.observation || typeof model.observation !== 'object' || !Number.isFinite(model.observation.rate) || model.observation.rate < 0) {
      throw new RangeError('observation.rate must be a non-negative finite number');
    }
  }
}

function plantPath() {
  return 'M320 305 C315 268 324 232 319 194 C316 169 320 148 326 128';
}

/**
 * createPhotosynthesisBench(root, { text }) -> { update(model), destroy(), element }
 *
 * The DOM is built once and patched in place, so focus and accessibility state survive updates.
 */
export function createPhotosynthesisBench(root, { text = BENCH_TEXT } = {}) {
  if (!root?.ownerDocument) throw new TypeError('root element is required');
  const doc = root.ownerDocument;
  const uid = `pg-${++instanceCount}`;
  const bench = html(doc, 'section', { className: 'pg-bench', 'data-role': 'photosynthesis-bench' });
  const stage = html(doc, 'div', { className: 'pg-stage' }, bench);
  const art = svg(doc, 'svg', {
    class: 'pg-scene',
    viewBox: `0 0 ${BENCH_VIEWBOX.width} ${BENCH_VIEWBOX.height}`,
    role: 'img',
    'aria-label': '水草、光源與水槽的實驗桌',
    'data-role': 'scene',
  }, stage);

  const defs = svg(doc, 'defs', {}, art);
  const glow = svg(doc, 'linearGradient', { id: `${uid}-lamp-glow`, x1: '0', x2: '1' }, defs);
  svg(doc, 'stop', { offset: '0%', 'stop-color': '#fff0a6', 'stop-opacity': '0.9' }, glow);
  svg(doc, 'stop', { offset: '100%', 'stop-color': '#fff0a6', 'stop-opacity': '0' }, glow);

  // Table.
  svg(doc, 'rect', { x: 40, y: 315, width: 560, height: 18, rx: 8, class: 'pg-table' }, art);

  // Lamp and its beam.
  const beam = svg(doc, 'path', {
    d: 'M112 92 L275 158 L275 290 L112 148 Z',
    class: 'pg-light-beam',
    fill: `url(#${uid}-lamp-glow)`,
    'data-role': 'beam',
  }, art);
  svg(doc, 'rect', { x: 58, y: 92, width: 55, height: 52, rx: 10, class: 'pg-lamp-head' }, art);
  svg(doc, 'path', { d: 'M85 145 L85 282 M85 282 L55 315 M85 282 L115 315', class: 'pg-lamp-stand' }, art);
  const lampLabel = svg(doc, 'text', { x: 85, y: 72, 'text-anchor': 'middle', class: 'pg-art-label', 'data-role': 'lamp-label' }, art);

  // Tank.
  svg(doc, 'rect', { x: 255, y: 108, width: 260, height: 202, rx: 18, class: 'pg-tank-glass' }, art);
  svg(doc, 'rect', { x: 266, y: 132, width: 238, height: 166, rx: 10, class: 'pg-water' }, art);
  svg(doc, 'line', { x1: 266, y1: 132, x2: 504, y2: 132, class: 'pg-water-line' }, art);

  // Plant.
  svg(doc, 'path', { d: plantPath(), class: 'pg-stem' }, art);
  const leaves = [
    [315, 276, -26], [331, 256, 24], [313, 235, -24], [333, 216, 27],
    [316, 193, -28], [336, 174, 24], [318, 151, -20],
  ];
  for (const [x, y, r] of leaves) {
    svg(doc, 'ellipse', { cx: x, cy: y, rx: 22, ry: 9, transform: `rotate(${r} ${x} ${y})`, class: 'pg-leaf' }, art);
  }
  svg(doc, 'rect', { x: 292, y: 294, width: 58, height: 14, rx: 5, class: 'pg-plant-base' }, art);

  // Bubbles are a fixed DOM pool. update() only changes visibility.
  const bubbles = [];
  const coords = [
    [343,270],[360,251],[336,234],[376,226],[351,207],[389,199],[365,183],[404,174],[344,164],[383,153],
    [421,145],[359,137],[398,128],[441,119],[373,113],[459,160],[414,188],[433,211],[397,244],[372,286],
  ];
  for (let i = 0; i < MAX_BUBBLES; i++) {
    const [cx, cy] = coords[i];
    const b = svg(doc, 'circle', {
      cx, cy, r: 4 + (i % 3),
      class: 'pg-bubble',
      'data-bubble': i + 1,
      'aria-hidden': 'true',
    }, art);
    setHidden(b, true);
    bubbles.push(b);
  }

  // Simple instrument plaques.
  svg(doc, 'rect', { x: 526, y: 118, width: 88, height: 54, rx: 12, class: 'pg-instrument' }, art);
  const co2Art = svg(doc, 'text', { x: 570, y: 150, 'text-anchor': 'middle', class: 'pg-instrument-text', 'data-role': 'co2-art' }, art);
  svg(doc, 'rect', { x: 526, y: 185, width: 88, height: 54, rx: 12, class: 'pg-instrument' }, art);
  const tempArt = svg(doc, 'text', { x: 570, y: 217, 'text-anchor': 'middle', class: 'pg-instrument-text', 'data-role': 'temp-art' }, art);

  // Accessible condition cards.
  const conditions = html(doc, 'div', { className: 'pg-conditions', 'data-role': 'conditions' }, bench);
  const card = (title, role) => {
    const el = html(doc, 'div', { className: 'pg-condition', 'data-condition': role }, conditions);
    html(doc, 'span', { className: 'pg-condition-label', text: title }, el);
    const value = html(doc, 'strong', { className: 'pg-condition-value', 'data-role': role }, el);
    return value;
  };
  const lightValue = card(text.lightTitle, 'light-value');
  const co2Value = card(text.co2Title, 'co2-value');
  const tempValue = card(text.temperatureTitle, 'temperature-value');
  const changedValue = card(text.changeTitle, 'change-value');

  // Discrete lamp control. Native buttons give pointer/touch/Enter/Space without a slider-first UI.
  const controls = html(doc, 'div', {
    className: 'pg-light-controls',
    role: 'group',
    'aria-label': '光照強度',
    'data-role': 'light-controls',
  }, bench);
  const buttons = new Map();
  for (const value of LIGHT_LEVELS) {
    const button = html(doc, 'button', {
      type: 'button',
      className: 'pg-light-button',
      'data-light-value': value,
      'aria-pressed': 'false',
    }, controls);
    html(doc, 'span', { className: 'pg-light-button-name', text: text.lightLabel[value] }, button);
    html(doc, 'span', { className: 'pg-light-button-value', text: `${value}%` }, button);
    buttons.set(value, button);
  }

  const observation = html(doc, 'p', {
    className: 'pg-observation',
    'data-role': 'observation',
    'aria-live': 'polite',
  }, bench);

  root.appendChild(bench);

  function update(model) {
    validateModel(model);
    const locked = model.locked === true;
    const allowed = new Set(model.allowedLights);
    const seen = model.observation ?? null;

    setAttr(bench, 'data-light', model.light);
    setAttr(bench, 'data-locked', locked ? 'true' : 'false');
    setAttr(beam, 'data-light', model.light);
    setText(lampLabel, `${model.light}%`);
    setText(co2Art, `${model.co2} ppm`);
    setText(tempArt, `${model.temperature}°C`);

    setText(lightValue, `${model.light}%`);
    setText(co2Value, `${model.co2} ppm`);
    setText(tempValue, `${model.temperature}°C`);
    setText(changedValue, text.changeValue);

    for (const value of LIGHT_LEVELS) {
      const button = buttons.get(value);
      const selected = value === model.light;
      const disabled = locked || !allowed.has(value);
      setAttr(button, 'aria-pressed', selected ? 'true' : 'false');
      setAttr(button, 'aria-label', text.lightAria[value]);
      setAttr(button, 'data-selected', selected ? 'true' : 'false');
      if (button.disabled !== disabled) button.disabled = disabled;
    }

    const bubbleCount = seen ? Math.max(0, Math.min(MAX_BUBBLES, Math.round(seen.rate))) : 0;
    bubbles.forEach((bubble, i) => {
      setHidden(bubble, i >= bubbleCount);
      setAttr(bubble, 'data-active', i < bubbleCount ? 'true' : 'false');
    });
    setAttr(bench, 'data-bubble-count', bubbleCount);
    setText(observation, seen ? text.observed(seen.rate) : text.waiting);
    setAttr(art, 'aria-label',
      seen
        ? `水草實驗桌，光照 ${model.light}%，CO₂ ${model.co2} ppm，水溫 ${model.temperature}°C，相對產氧速度 ${seen.rate.toFixed(1)}`
        : `水草實驗桌，光照 ${model.light}%，CO₂ ${model.co2} ppm，水溫 ${model.temperature}°C，尚未觀察`
    );
  }

  function destroy() {
    bench.remove();
  }

  return { update, destroy, element: bench, uid };
}
