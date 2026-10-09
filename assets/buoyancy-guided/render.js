// Renderer for the guided buoyancy bench (Prototype Technical Spec v1.0 §8).
// Draws what visual.js computed into one fixed-viewBox SVG and lines the touch controls up with the drawing.
// It decides nothing: no physics, no state change, no storage. Wording comes in through `labels`.
import { VIEW_W, VIEW_H, OBJECT_IDS } from './visual.js';

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}, ...kids) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  e.append(...kids);
  return e;
};
const pctW = (x) => `${(x / VIEW_W) * 100}%`;
const pctH = (y) => `${(y / VIEW_H) * 100}%`;
const RADIUS = { block: 8, wood: 6, stone: 20 };

/**
 * createRenderer({ scene, labels })
 *   scene   the .bg-scene element: it holds the <svg>, the tank zone ([data-bg-tank]) and the hit layer with the object buttons
 *   labels  { water, brine, block, wood, stone } text drawn in the picture
 * → { render(params), setDragPreview(event), artFor(id) }
 */
export function createRenderer({ scene, labels }) {
  const svg = scene.querySelector('svg');
  svg.setAttribute('viewBox', `0 0 ${VIEW_W} ${VIEW_H}`);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.replaceChildren();

  const tankZone = scene.querySelector('[data-bg-tank]');
  const hits = Object.fromEntries(OBJECT_IDS.map((id) => [id, scene.querySelector(`[data-bg-object="${id}"]`)]));

  // static picture: table, tank, water
  const table = svgEl('rect', { class: 'bg-table-slab', x: 0, width: 0, height: 28 });
  const tankInner = svgEl('rect', { class: 'bg-tank-inner' });
  const water = svgEl('rect', { class: 'bg-water', 'data-bg-water': '' });
  const surface = svgEl('line', { class: 'bg-surface', 'data-bg-surface': '' });
  const floor = svgEl('line', { class: 'bg-floor', 'data-bg-floor': '' });
  const frame = svgEl('rect', { class: 'bg-tank-frame', 'data-bg-tank-frame': '', rx: 6 });
  const liquidLabel = svgEl('text', { class: 'bg-liquid-label', 'data-bg-liquid-label': '' });
  const labelLayer = svgEl('g', { class: 'bg-labels' });
  const objectLayer = svgEl('g', { class: 'bg-objects' });
  svg.append(table, tankInner, water, surface, floor, objectLayer, frame, liquidLabel, labelLayer);

  const arts = {}, tableLabels = {};
  for (const id of OBJECT_IDS) {
    const g = svgEl('g', { class: 'bg-art', 'data-bg-art': id });
    const body = svgEl('rect', { class: 'bg-body', 'data-bg-body': '', rx: RADIUS[id] });
    const sub = svgEl('rect', { class: 'bg-submerged', 'data-bg-submerged': '', rx: 0 });
    const line = svgEl('line', { class: 'bg-objwaterline', 'data-bg-objwaterline': '' });
    const cells = id === 'block' ? Array.from({ length: 6 }, (_, i) => svgEl('rect', { class: 'bg-cell', 'data-bg-cell': i, rx: 2 })) : [];
    g.append(body, sub, line, ...cells);
    objectLayer.append(g);
    arts[id] = { g, body, sub, line, cells };
    const t = svgEl('text', { class: 'bg-table-label', 'data-bg-label': id, 'text-anchor': 'middle' });
    labelLayer.append(t);
    tableLabels[id] = t;
  }

  let first = true;
  const setAttrs = (el, attrs) => { for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v)); };

  function render(params) {
    const { tank, liquid, table: tbl } = params;
    setAttrs(table, { y: tbl.y, width: tbl.w, height: 28 });
    setAttrs(tankInner, { x: tank.x + tank.wall, y: tank.y, width: tank.w - 2 * tank.wall, height: tank.bottomY - tank.y });
    setAttrs(water, { x: tank.x + tank.wall, y: tank.waterY, width: tank.w - 2 * tank.wall, height: tank.bottomY - tank.waterY, 'data-liquid': liquid.id });
    setAttrs(surface, { x1: tank.x + tank.wall, x2: tank.x + tank.w - tank.wall, y1: liquid.surfaceY, y2: liquid.surfaceY });
    setAttrs(floor, { x1: tank.x + tank.wall, x2: tank.x + tank.w - tank.wall, y1: tank.bottomY, y2: tank.bottomY });
    setAttrs(frame, { x: tank.x, y: tank.y, width: tank.w, height: tank.h - 0 });
    setAttrs(liquidLabel, { x: tank.x + tank.wall + 12, y: tank.waterY + 26 });
    liquidLabel.textContent = labels[liquid.id] ?? '';
    svg.dataset.liquid = liquid.id;

    if (first) for (const id of OBJECT_IDS) arts[id].g.classList.add('bg-no-anim');
    for (const id of OBJECT_IDS) {
      const p = params.objects[id], a = arts[id];
      a.g.style.display = p.visible ? '' : 'none';
      a.g.style.transition = '';
      a.g.style.transform = `translate(${p.x}px, ${p.y}px)`;
      a.g.dataset.where = p.where;
      a.g.dataset.outcome = p.outcome ?? '';
      a.g.classList.toggle('is-operable', p.operable);
      a.g.classList.toggle('is-locked', !p.operable);
      setAttrs(a.body, { x: 0, y: 0, width: p.w, height: p.h });
      if (p.outcome === 'float') {
        setAttrs(a.sub, { x: 0, y: p.submerged.y, width: p.w, height: p.submerged.h, visibility: 'visible' });
        setAttrs(a.line, { x1: 0, x2: p.w, y1: p.waterlineLocalY, y2: p.waterlineLocalY, visibility: 'visible' });
      } else if (p.submerged) {
        setAttrs(a.sub, { x: 0, y: 0, width: p.w, height: p.h, visibility: 'visible' });
        a.line.setAttribute('visibility', 'hidden');
      } else {
        a.sub.setAttribute('visibility', 'hidden');
        a.line.setAttribute('visibility', 'hidden');
      }
      const t = tableLabels[id];
      t.textContent = labels[id] ?? '';
      t.setAttribute('visibility', p.visible && p.where === 'table' ? 'visible' : 'hidden');
      setAttrs(t, { x: p.hit.cx, y: tbl.y + 22 });

      const btn = hits[id];
      if (btn) {
        btn.style.left = pctW(p.hit.cx);
        btn.style.top = pctH(p.hit.cy);
        btn.style.width = `max(var(--bg-hit-min), ${pctW(p.hit.w)})`;
        btn.style.height = `max(var(--bg-hit-min), ${pctH(p.hit.h)})`;
      }
    }
    params.ballast.cells.forEach((c, i) => {
      setAttrs(arts.block.cells[i], { x: c.dx, y: c.dy, width: c.w, height: c.h });
      arts.block.cells[i].classList.toggle('is-filled', c.filled);
      arts.block.cells[i].setAttribute('visibility', params.ballast.visible ? 'visible' : 'hidden');
    });

    tankZone.style.left = pctW(tank.x);
    tankZone.style.top = pctH(tank.y);
    tankZone.style.width = pctW(tank.w);
    tankZone.style.height = pctH(tank.h);

    if (first) {
      first = false;
      void svg.getBoundingClientRect();   // settle the first pose before transitions are allowed
      for (const id of OBJECT_IDS) arts[id].g.classList.remove('bg-no-anim');
    }
  }

  /**
   * A drag in progress: the picture of the object follows the pointer. This is only a picture; nothing is decided here.
   * When the drag ends the next render() takes the object from where it was let go to where the engine says it belongs.
   */
  function setDragPreview({ objectId, dragging, clientX, clientY }) {
    if (!dragging) return;
    const a = arts[objectId];
    if (!a) return;
    const r = svg.getBoundingClientRect();
    if (!r.width) return;
    const w = Number(a.body.getAttribute('width')), h = Number(a.body.getAttribute('height'));
    const vx = ((clientX - r.left) * VIEW_W) / r.width, vy = ((clientY - r.top) * VIEW_H) / r.height;
    a.g.style.transition = 'none';
    a.g.style.transform = `translate(${vx - w / 2}px, ${vy - h / 2}px)`;
  }

  return { render, setDragPreview, artFor: (id) => arts[id] };
}
