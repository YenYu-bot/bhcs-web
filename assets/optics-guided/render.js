// DOM/SVG renderer for the guided optics bench (I4). It draws what visual.js computes from the engine's view;
// it holds no optics or state logic. Interactive targets are HTML overlays (>= 44 px) positioned over the SVG.
import { visualParams, VIEW_W, xOf } from './visual.js';
import { BENCH_VIEW, MOBILE_MAX_WIDTH } from './input.js';

const NS = 'http://www.w3.org/2000/svg';
const PROPS = new URL('../science/props/', import.meta.url).href;
let instance = 0;

const svgEl = (name, attrs = {}, parent) => {
  const el = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (parent) parent.append(el);
  return el;
};
const set = (el, attrs) => { for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, typeof v === 'number' ? +v.toFixed(2) : v); };
const hitMinPx = () => (window.innerWidth <= MOBILE_MAX_WIDTH ? 64 : 48);     // phones: a thumb-sized target; larger screens keep 48

/**
 * createBenchView(root, { labels }) — root is the `.og-bench[data-optics-bench]` element.
 * update(view, { rays }) redraws; measure() re-reads the container size (call on resize).
 * Returns the two interactive elements so the input layer can attach to them.
 */
export function createBenchView(root, { labels = { screen: '屏幕', candle: '蠟燭' } } = {}) {
  const id = `og${++instance}`;
  const svg = svgEl('svg', { class: 'og-svg', role: 'img', 'aria-label': '蠟燭、凸透鏡與屏幕的實驗桌', preserveAspectRatio: 'xMidYMid meet', focusable: 'false' });
  const defs = svgEl('defs', {}, svg);
  const blur = svgEl('filter', { id: `${id}-blur`, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
  const blurNode = svgEl('feGaussianBlur', { stdDeviation: 0 }, blur);
  const transfer = svgEl('feComponentTransfer', {}, blur);
  const funcs = ['feFuncR', 'feFuncG', 'feFuncB'].map((n) => svgEl(n, { type: 'linear', slope: 1, intercept: 0 }, transfer));
  const clip = svgEl('clipPath', { id: `${id}-clip` }, defs), clipRect = svgEl('rect', {}, clip);
  const glowGrad = svgEl('radialGradient', { id: `${id}-glow` }, defs);
  svgEl('stop', { offset: '0', 'stop-color': '#fff6c8', 'stop-opacity': '1' }, glowGrad);
  svgEl('stop', { offset: '0.55', 'stop-color': '#ffc95a', 'stop-opacity': '.7' }, glowGrad);
  svgEl('stop', { offset: '1', 'stop-color': '#ff9a3c', 'stop-opacity': '0' }, glowGrad);

  const layer = (cls) => svgEl('g', { class: cls }, svg);
  const gTop = layer('og-tabletop-layer'), gTrack = layer('og-track'), gAxis = layer('og-axis'), gFocal = layer('og-focal'), gRays = layer('og-rays'), gPost = layer('og-posts'),
    gLens = layer('og-lens'), gCandle = layer('og-candle'), gVirtual = layer('og-virtual'), gScreen = layer('og-screen'), gEye = layer('og-eye');
  const trackScreen = svgEl('line', { class: 'og-track-line' }, gTrack), trackCandle = svgEl('line', { class: 'og-track-line' }, gTrack);
  const tabletop = svgEl('rect', { class: 'og-tabletop' }, gTop);
  const axis = svgEl('line', { class: 'og-axis-line' }, gAxis);
  const table = svgEl('line', { class: 'og-table-line' }, gAxis);
  const post = svgEl('rect', { class: 'og-post', rx: 2 }, gPost), foot = svgEl('rect', { class: 'og-post', rx: 3 }, gPost);
  const lensImg = svgEl('image', { href: PROPS + 'prop-convex-lens.webp', preserveAspectRatio: 'none' }, gLens);
  const candleImg = svgEl('image', { href: PROPS + 'prop-candle.webp', preserveAspectRatio: 'none' }, gCandle);
  const virtImg = svgEl('image', { href: PROPS + 'prop-candle.webp', preserveAspectRatio: 'none', class: 'og-ghost' }, gVirtual);
  const screenImg = svgEl('image', { href: PROPS + 'prop-screen.webp', preserveAspectRatio: 'none' }, gScreen);
  const clipped = svgEl('g', { 'clip-path': `url(#${id}-clip)` }, gScreen);
  const blurred = svgEl('g', { filter: `url(#${id}-blur)`, class: 'og-projection' }, clipped);
  const glow = svgEl('ellipse', { fill: `url(#${id}-glow)` }, blurred);
  const imgOuter = svgEl('g', {}, blurred), imgInner = svgEl('g', {}, imgOuter);
  const projected = svgEl('image', { href: PROPS + 'prop-candle.webp', preserveAspectRatio: 'none' }, imgInner);
  const eye = svgEl('g', { class: 'og-eye-icon' }, gEye);
  svgEl('path', { d: 'M-24 0 Q0 -16 24 0 Q0 16 -24 0Z', class: 'og-eye-shape' }, eye);
  svgEl('circle', { r: 6, class: 'og-eye-iris' }, eye);
  const eyeText = svgEl('text', { y: 30, 'text-anchor': 'middle', class: 'og-eye-text' }, eye); eyeText.textContent = '眼睛從這裡看';
  const tickEls = [], focalEls = [-1, 1].map(() => ({ dot: svgEl('circle', { class: 'og-focal-dot' }, gFocal), text: svgEl('text', { class: 'og-focal-text', 'text-anchor': 'middle' }, gFocal) }));
  focalEls.forEach((f) => { f.text.textContent = 'F'; });

  root.append(svg);
  const mkHit = (kind) => {
    const el = document.createElement('div');
    el.className = `og-hit og-hit-${kind}`; el.setAttribute('role', 'slider'); el.setAttribute('aria-orientation', 'horizontal');
    root.append(el); return el;
  };
  const hits = { screen: mkHit('screen'), candle: mkHit('candle') };

  let height = 400, scale = 1;
  function measure() {
    const r = root.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) { height = Math.max(300, Math.round(VIEW_W * r.height / r.width)); scale = r.width / VIEW_W; }
    return { height, scale };
  }

  let last = null;
  function update(view, options = {}) {
    last = { view, options };
    const p = visualParams(view, { height, rays: !!options.rays });
    set(svg, { viewBox: `0 0 ${p.w} ${p.h}` });
    const { axisY, tableY } = p;
    const labelSize = Math.min(26, Math.max(11, 11 / scale * 0.85));      // keep labels ≈ 10 px on screen at any bench width
    set(eyeText, { 'font-size': labelSize * 1.1 });
    set(tabletop, { x: 0, y: tableY, width: p.w, height: Math.max(0, p.h - tableY) });
    p.focal.forEach((f, i) => { set(focalEls[i].dot, { cx: f.x, cy: axisY, r: Math.max(3.5, 4 / scale * 0.6) }); set(focalEls[i].text, { x: f.x, y: axisY - 12, 'font-size': labelSize * 1.25 }); });
    set(axis, { x1: 0, x2: p.w, y1: axisY, y2: axisY }); set(table, { x1: 0, x2: p.w, y1: tableY, y2: tableY });
    const r = view.ranges;       // movable rails, drawn only for objects the engine lets the learner move
    trackScreen.style.display = r.screen.locked ? 'none' : ''; trackCandle.style.display = r.candle.locked ? 'none' : '';
    if (!r.screen.locked) set(trackScreen, { x1: xOf(r.screen.min), x2: xOf(r.screen.max), y1: tableY + 36, y2: tableY + 36 });
    if (!r.candle.locked) set(trackCandle, { x1: xOf(-r.candle.max), x2: xOf(-r.candle.min), y1: tableY + 36, y2: tableY + 36 });

    while (tickEls.length < p.ticks.length) tickEls.push({ line: svgEl('line', { class: 'og-tick' }, gAxis), text: svgEl('text', { class: 'og-tick-text', 'text-anchor': 'middle' }, gAxis) });
    tickEls.forEach((t, i) => {
      const d = p.ticks[i]; t.line.style.display = t.text.style.display = d ? '' : 'none'; if (!d) return;
      set(t.line, { x1: d.x, x2: d.x, y1: tableY, y2: tableY + (d.label ? 10 : 6) });
      set(t.text, { x: d.x, y: tableY + 24, 'font-size': labelSize }); t.text.textContent = d.label || '';
    });

    set(post, { x: p.candle.x - 3, y: p.candle.postTop, width: 6, height: Math.max(0, p.candle.postBottom - p.candle.postTop) });
    set(foot, { x: p.candle.x - 16, y: p.candle.postBottom - 4, width: 32, height: 6 });
    set(lensImg, { x: p.lens.imgX, y: p.lens.imgY, width: p.lens.w, height: p.lens.h });
    set(candleImg, { x: p.candle.imgX, y: p.candle.imgY, width: p.candle.w, height: p.candle.h });
    set(screenImg, { x: p.screen.imgX, y: p.screen.imgY, width: p.screen.w, height: p.screen.h });
    gScreen.setAttribute('opacity', p.screenOpacity);

    set(clipRect, { x: p.face.x, y: p.face.y, width: p.face.w, height: p.face.h });
    set(blurNode, { stdDeviation: p.blurSigma });
    set(blurred, { opacity: p.imageOpacity });
    for (const f of funcs) set(f, { slope: p.contrast, intercept: (1 - p.contrast) / 2 });
    set(glow, { cx: p.face.x + p.face.w / 2, cy: p.face.y + p.face.h / 2, rx: p.glow.rx * 1.6, ry: p.glow.ry * 1.6, opacity: p.glow.opacity });
    if (p.image) {
      projected.style.display = '';
      set(imgOuter, { transform: `translate(${p.image.cx} ${p.image.cy})` });
      set(imgInner, { transform: `scale(${p.image.scaleX} ${p.image.scaleY})` });
      set(projected, { x: p.image.offX, y: p.image.offY, width: p.image.w, height: p.image.h });
    } else projected.style.display = 'none';

    gVirtual.style.display = p.virtual ? '' : 'none';
    if (p.virtual) set(virtImg, { x: p.virtual.imgX, y: p.virtual.imgY, width: p.virtual.w, height: p.virtual.h });
    gEye.style.display = p.eye ? '' : 'none';
    if (p.eye) set(eye, { transform: `translate(${p.eye.x} ${p.eye.y})` });

    gRays.replaceChildren();
    for (const r of p.rays || []) svgEl('line', { x1: r.x1, y1: r.y1, x2: r.x2, y2: r.y2, class: r.solid ? 'og-ray' : 'og-ray og-ray-virtual' }, gRays);

    // interactive overlays: >= 48 px (64 px on phones), centred on the visible object
    const place = (el, spec, label, state, range) => {
      const min = hitMinPx(), wPx = Math.max(min, 60 * scale), hPx = Math.max(min, spec.h * scale);
      Object.assign(el.style, { left: `${(spec.x / p.w) * 100}%`, top: `${(spec.y / p.h) * 100}%`, width: `${wPx}px`, height: `${hPx}px` });
      const locked = range.locked;
      if (locked) el.setAttribute('aria-disabled', 'true'); else el.removeAttribute('aria-disabled');
      el.tabIndex = locked ? -1 : 0; el.dataset.locked = String(locked);
      el.setAttribute('aria-label', locked ? `${label}，目前距離凸透鏡 ${state} 公分，已固定。` : `${label}，目前距離凸透鏡 ${state} 公分，可用左右方向鍵移動。`);
      el.setAttribute('aria-valuenow', String(state));
      if (!locked) { el.setAttribute('aria-valuemin', String(range.min)); el.setAttribute('aria-valuemax', String(range.max)); }
      else { el.removeAttribute('aria-valuemin'); el.removeAttribute('aria-valuemax'); }
    };
    place(hits.screen, p.hit.screen, labels.screen, view.s, view.ranges.screen);
    place(hits.candle, p.hit.candle, labels.candle, view.u, view.ranges.candle);

    const d = root.dataset;
    d.clarityLevel = String(p.clarity.level); d.rawLevel = String(p.clarity.rawLevel); d.imageType = p.clarity.imageType;
    d.withinBench = String(p.clarity.withinBench); d.blur = p.blurSigma.toFixed(2); d.phase = view.phase;
    d.viewThrough = String(!!p.virtual);
    return p;
  }

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { measure(); if (last) update(last.view, last.options); }) : null;
  ro?.observe(root);
  measure();
  return { svg, hits, update, measure, destroy() { ro?.disconnect(); svg.remove(); hits.screen.remove(); hits.candle.remove(); }, get benchRange() { return BENCH_VIEW; } };
}
