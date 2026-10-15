// Input layer for the guided unknown-liquid lab (Pilot #4, B2). Dragging the strip onto a tube, pressing a tube's button
// (mouse, touch or keyboard: Enter / Space on a native button) all end in the same call, onDip(sampleId). The layer
// knows nothing about indicators, phases or results: the caller turns a sample id into an engine action.
//
// Every route goes through one gate, send(): the caller's getLocked() and canDip(sampleId) are asked again on each
// attempt, so a disabled button, a forged DOM event or a programmatic click cannot get past them.
//
// Drag: Pointer Events only (mouse, pen and touch share one path). The strip is the only element that takes over touch
// gestures (touch-action: none in CSS); the rest of the page keeps scrolling. Each drag measures its own start point and
// scale, moves the one strip element (no clones), and is cleaned up on pointerup, pointercancel and lostpointercapture.

const pointIn = (r, x, y) => Boolean(r) && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;

/**
 * bindAcidBaseInput({ root, getLocked, canDip, onDip }) → { destroy() }
 *   root       the element holding the bench (createAcidBaseBench's element or an ancestor)
 *   getLocked  () => boolean, true while nothing may be tested
 *   canDip     (sampleId) => boolean, may this cup be tested right now
 *   onDip      (sampleId) => void, called at most once per completed gesture
 */
export function bindAcidBaseInput({ root, getLocked = () => false, canDip = () => true, onDip }) {
  if (typeof onDip !== 'function') throw new TypeError('onDip is required');
  let drag = null, alive = true;

  const strip = () => root.querySelector('[data-role="strip"]');
  const zones = () => [...root.querySelectorAll('[data-drop-sample]')];

  function send(sampleId) {
    if (!alive || getLocked() === true || canDip(sampleId) !== true) return false;
    onDip(sampleId);
    return true;
  }

  /** The tube whose drop zone holds this client point, or null. */
  function sampleAt(x, y) {
    const hit = zones().find((z) => pointIn(z.getBoundingClientRect(), x, y));
    return hit ? hit.getAttribute('data-drop-sample') : null;
  }

  function markOver(sampleId) {
    for (const z of zones()) {
      const over = z.getAttribute('data-drop-sample') === sampleId;
      if (over) z.setAttribute('data-over', 'true'); else z.removeAttribute('data-over');
    }
  }

  // Ends a drag without sending anything; safe to call twice.
  function cleanup() {
    if (!drag) return;
    const { el, id } = drag;
    drag = null;
    try { if (el.hasPointerCapture?.(id)) el.releasePointerCapture(id); } catch { /* already released */ }
    el.removeAttribute('data-dragging');
    el.style.transform = '';
    markOver(null);
    root.querySelector('[data-role="bench"]')?.removeAttribute('data-dragging');
  }

  function onPointerDown(e) {
    const el = strip();
    if (!el || !e.target?.closest || e.target.closest('[data-role="strip"]') !== el) return;
    if (e.button !== undefined && e.button !== 0) return;
    if (getLocked() === true) return;
    cleanup();
    // A fresh baseline every time: the start point is measured now and no earlier offset is carried over.
    el.style.transform = '';
    drag = { el, id: e.pointerId, x: e.clientX, y: e.clientY };
    try { el.setPointerCapture?.(e.pointerId); } catch { /* the pointer is gone already */ }
    el.setAttribute('data-dragging', 'true');
    root.querySelector('[data-role="bench"]')?.setAttribute('data-dragging', 'true');
    e.preventDefault?.();
  }

  const mine = (e) => drag && e.pointerId === drag.id;

  function onPointerMove(e) {
    if (!mine(e)) return;
    drag.el.style.transform = `translate(${e.clientX - drag.x}px, ${e.clientY - drag.y}px)`;
    markOver(sampleAt(e.clientX, e.clientY));
  }

  function onPointerUp(e) {
    if (!mine(e)) return;
    const target = sampleAt(e.clientX, e.clientY);
    cleanup();                       // the drag is over before anything is sent: no second callback can follow
    if (target) send(target);
  }

  function onCancel(e) { if (mine(e)) cleanup(); }

  function onClick(e) {
    const button = e.target?.closest?.('[data-dip-sample]');
    if (!button || !root.contains(button) || button.disabled) return;
    send(button.getAttribute('data-dip-sample'));
  }

  const handlers = { pointerdown: onPointerDown, pointermove: onPointerMove, pointerup: onPointerUp, pointercancel: onCancel, lostpointercapture: onCancel, click: onClick };
  for (const [type, fn] of Object.entries(handlers)) root.addEventListener(type, fn);

  return {
    destroy() {
      if (!alive) return;
      cleanup();
      alive = false;
      for (const [type, fn] of Object.entries(handlers)) root.removeEventListener(type, fn);
    },
  };
}
