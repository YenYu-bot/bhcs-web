// Input layer for the guided buoyancy lab (Prototype Technical Spec v1.0 §7).
// Turns pointer, touch and button activity into engine actions. It decides nothing about physics and holds no learner
// wording: what may be done comes from the engine's view (`deriveView().controls`), what happens comes from the engine.
//
// DOM contract (all inside one bench root):
//   [data-bg-object="block|wood|stone"]   a button: tap, click, Enter or Space puts it in the tank or takes it out; it can also be dragged
//   [data-bg-tank]                        the drop zone (not focusable)
//   [data-bg-action="put-in|take-out|add-ballast|remove-ballast"]   tool buttons; put-in names its object with data-bg-for
//   input[type=radio][data-bg-liquid]     the liquid choice
// Keyboard use is the native button and radio behaviour: this file listens to no key events, so it can never swallow one.

export const DRAG_SLOP_PX = 3;          // pointer travel before a press becomes a drag (a tap never moves anything)
export const MOBILE_MAX_WIDTH = 767;    // px: a viewport this narrow or narrower is "mobile"
export const HIT_MIN_PX = Object.freeze({ desktop: 48, mobile: 64 });

export const hitMinFor = (viewportWidth) => (viewportWidth <= MOBILE_MAX_WIDTH ? HIT_MIN_PX.mobile : HIT_MIN_PX.desktop);
export const pointInRect = (x, y, r) => Boolean(r) && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;

/** A control the interface marks as not available right now. Locked controls stay focusable (aria-disabled) so they can explain themselves. */
export const isLocked = (el) => el.dataset.locked === 'true' || el.getAttribute('aria-disabled') === 'true' || el.disabled === true;
const isShown = (el) => !el.hidden && !el.closest('[hidden]');
export const isUsable = (el) => Boolean(el) && isShown(el) && !isLocked(el);

// ---- from the engine's view to an action (or null when the control is not available) ------------------------------

/** What activating an object does: put it in when it is on the table, take it out when it is in the tank. */
export function objectAction(objectId, view) {
  const o = view?.controls?.objects?.[objectId];
  if (!o || !o.available) return null;
  if (o.where === 'table') return o.putIn ? { type: 'PUT_IN', objectId } : null;
  return o.takeOut ? { type: 'TAKE_OUT' } : null;
}

export function toolAction(tool, objectId, view) {
  const c = view?.controls;
  if (!c) return null;
  switch (tool) {
    case 'put-in': return c.objects[objectId]?.putIn ? { type: 'PUT_IN', objectId } : null;
    case 'take-out': return view.tank.objectId !== null && c.objects[view.tank.objectId]?.takeOut ? { type: 'TAKE_OUT' } : null;
    case 'add-ballast': return c.ballast.canAdd ? { type: 'ADD_BALLAST' } : null;
    case 'remove-ballast': return c.ballast.canRemove ? { type: 'REMOVE_BALLAST' } : null;
    default: return null;
  }
}

// ---- keeping the controls in step with the view ---------------------------------------------------------------------

function setLocked(el, locked) {
  el.dataset.locked = String(locked);
  if (locked) el.setAttribute('aria-disabled', 'true'); else el.removeAttribute('aria-disabled');
}
const toggle = (el, cls, on) => el.classList.toggle(cls, on);

/** Writes availability, lock state and touch behaviour onto the controls. Pure DOM sync; it never decides anything. */
export function syncControls(root, view) {
  const objects = view.controls.objects;
  for (const el of root.querySelectorAll('[data-bg-object]')) {
    const o = objects[el.dataset.bgObject];
    el.hidden = !o || !o.available;
    if (!o) continue;
    const locked = !objectAction(el.dataset.bgObject, view);
    el.dataset.where = o.where;
    el.setAttribute('aria-pressed', String(o.where === 'tank'));
    setLocked(el, locked);
    toggle(el, 'bg-direct-manipulation', !locked);   // only a movable object takes over touch gestures
    toggle(el, 'bg-scroll-surface', locked);
  }
  const anyShown = Object.values(objects).some((o) => o.available);
  for (const el of root.querySelectorAll('[data-bg-action]')) {
    const tool = el.dataset.bgAction, forId = el.dataset.bgFor;
    if (tool === 'put-in') el.hidden = !objects[forId]?.available;
    else if (tool === 'take-out') el.hidden = !anyShown;
    else el.hidden = !objects.block.available;    // the ballast belongs to the block only
    setLocked(el, !toolAction(tool, forId, view));
  }
  const showLiquid = objects.block.available;
  for (const group of root.querySelectorAll('[data-bg-liquid-group]')) group.hidden = !showLiquid;
  for (const r of root.querySelectorAll('input[data-bg-liquid]')) {
    r.checked = r.value === view.liquidId;
    r.disabled = view.controls.liquid.locked;
  }
  for (const tank of root.querySelectorAll('[data-bg-tank]')) tank.dataset.object = view.tank.objectId ?? '';
}

// ---- focus -------------------------------------------------------------------------------------------------------------

/**
 * Moves focus only when it has been left on something that just became unavailable, or when the button that was just
 * pressed has gone. Otherwise it leaves focus alone. `targets` are selectors in order of preference.
 * Returns the element that received focus, or null.
 */
export function focusHandoff({ root, active, ctaGone = false, targets }) {
  const body = root.ownerDocument.body;
  const stranded = Boolean(active) && active !== body && !isUsable(active);
  if (!stranded && !ctaGone) return null;
  for (const selector of targets) {
    for (const el of root.querySelectorAll(selector)) {
      if (el !== active && isUsable(el) && typeof el.focus === 'function') { el.focus({ preventScroll: true }); return el; }
    }
  }
  return null;
}

// ---- the controller -------------------------------------------------------------------------------------------------

/**
 * createInputController({ root, getView, dispatch, getTankRect, onDrag, onInvalidDrop, onBlocked })
 *   getView()   → the engine's current deriveView()
 *   dispatch()  → hands an action to the engine
 *   onDrag({ objectId, dragging, clientX, clientY, overTank })       progress of a drag, for the picture
 *   onInvalidDrop({ objectId, reason })                              reason: 'outside-tank' | 'locked'
 *   onBlocked({ control, objectId })                                 a locked control was activated
 */
export function createInputController({ root, getView, dispatch, getTankRect, onDrag = () => {}, onInvalidDrop = () => {}, onBlocked = () => {} }) {
  const win = root.ownerDocument.defaultView;
  let drag = null;
  let suppressClick = false;

  const release = (d) => {
    delete d.el.dataset.dragging;
    try { d.el.releasePointerCapture?.(d.pointerId); } catch (_) { /* capture already gone */ }
  };
  const finish = () => { const d = drag; drag = null; if (d) release(d); return d; };

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;   // the primary button; touch and pen report 0
    const el = e.target.closest?.('[data-bg-object]');
    if (!el || !root.contains(el) || !isShown(el) || isLocked(el) || drag) return;
    drag = { el, objectId: el.dataset.bgObject, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, dragging: false };
    try { el.setPointerCapture?.(e.pointerId); } catch (_) { /* not every environment can capture */ }
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (!drag.dragging) {
      if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) <= DRAG_SLOP_PX) return;
      drag.dragging = true;
      drag.el.dataset.dragging = 'true';
    }
    onDrag({ objectId: drag.objectId, dragging: true, clientX: e.clientX, clientY: e.clientY, overTank: pointInRect(e.clientX, e.clientY, getTankRect()) });
  }

  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const d = finish();
    if (!d.dragging) return;                     // a tap: the click that follows does the work
    suppressClick = true;
    win.setTimeout(() => { suppressClick = false; }, 0);
    onDrag({ objectId: d.objectId, dragging: false, clientX: e.clientX, clientY: e.clientY, overTank: false });
    const view = getView();
    const where = view.controls.objects[d.objectId]?.where;
    const over = pointInRect(e.clientX, e.clientY, getTankRect());
    const wantsMove = (where === 'table' && over) || (where === 'tank' && !over);
    if (wantsMove) {
      const action = objectAction(d.objectId, view);
      if (action) dispatch(action); else onInvalidDrop({ objectId: d.objectId, reason: 'locked' });
    } else if (where === 'table') {
      onInvalidDrop({ objectId: d.objectId, reason: 'outside-tank' });   // let go somewhere else: it goes back to the table
    }                                                                     // dropped back inside the tank: nothing to do
  }

  function onPointerCancel(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const d = finish();
    if (d.dragging) onDrag({ objectId: d.objectId, dragging: false, clientX: e.clientX, clientY: e.clientY, overTank: false });
  }

  function onClick(e) {
    const objectEl = e.target.closest?.('[data-bg-object]');
    if (objectEl && root.contains(objectEl)) {
      if (suppressClick) { suppressClick = false; return; }       // the click that ends a drag is not a tap
      const objectId = objectEl.dataset.bgObject;
      const action = isUsable(objectEl) ? objectAction(objectId, getView()) : null;
      if (action) dispatch(action); else onBlocked({ control: 'object', objectId });
      return;
    }
    const tool = e.target.closest?.('[data-bg-action]');
    if (tool && root.contains(tool)) {
      const name = tool.dataset.bgAction, objectId = tool.dataset.bgFor ?? null;
      const action = isUsable(tool) ? toolAction(name, objectId, getView()) : null;
      if (action) dispatch(action); else onBlocked({ control: name, objectId });
    }
  }

  function onChange(e) {
    const radio = e.target.closest?.('input[data-bg-liquid]');
    if (!radio || !root.contains(radio) || !radio.checked) return;
    dispatch({ type: 'SELECT_LIQUID', liquidId: radio.value });
  }

  const listeners = [['pointerdown', onPointerDown], ['pointermove', onPointerMove], ['pointerup', onPointerUp], ['pointercancel', onPointerCancel], ['click', onClick], ['change', onChange]];
  for (const [type, fn] of listeners) root.addEventListener(type, fn);
  return {
    destroy() {
      for (const [type, fn] of listeners) root.removeEventListener(type, fn);
      finish();
    },
  };
}
