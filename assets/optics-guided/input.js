// Input layer for the guided optics lab (Spec v1.2 §6.3, §6.5, §6.6).
// Turns pointer / touch / keyboard events into engine actions and nothing else. It snaps, but never clamps
// (range rules belong to the engine), and it never looks at optics values (no theoreticalV, clarity, sharp).
import { rangesFor } from './engine.js';

export const SNAP_DESKTOP = 0.5;      // cm
export const SNAP_MOBILE = 1;         // cm
export const MOBILE_MAX_WIDTH = 767;  // px: viewport ≤ 767 → mobile snap
// Visible bench: lens at 0, candle at -u (u ≤ 35), screen at +s (s ≤ 40). The margins keep the objects whole at both ends of their rails.
export const BENCH_VIEW = Object.freeze({ minCm: -40, maxCm: 48 });
export const DRAG_SLOP_PX = 3;        // pointer travel before a press becomes a drag (a tap never moves anything)
export const KEY_STEP = Object.freeze({ arrow: 1, fine: 0.5, page: 5 });

export const snapForWidth = (viewportWidth) => (viewportWidth <= MOBILE_MAX_WIDTH ? SNAP_MOBILE : SNAP_DESKTOP);

export const snapTo = (value, snap) => Number((Math.round(value / snap) * snap).toFixed(6));

/** Horizontal client coordinate → logical cm on the bench (rect: { left, width } of the 75 cm view). */
export const clientXToCm = (clientX, rect) => BENCH_VIEW.minCm + ((clientX - rect.left) / rect.width) * (BENCH_VIEW.maxCm - BENCH_VIEW.minCm);

// Object position along the bench axis: the screen sits at +s, the candle at -u.
const toAxis = (kind, position) => (kind === 'candle' ? -position : position);
const fromAxis = (kind, axis) => (kind === 'candle' ? -axis : axis);

/** Position (s or u) under a client x coordinate, before snapping. */
export const positionFromClientX = (kind, clientX, rect) => fromAxis(kind, clientXToCm(clientX, rect));

const KEYS = {
  ArrowLeft: { dir: -1, step: KEY_STEP.arrow }, ArrowRight: { dir: 1, step: KEY_STEP.arrow },
  PageDown: { dir: -1, step: KEY_STEP.page }, PageUp: { dir: 1, step: KEY_STEP.page },
};

/**
 * Snapped target position for a key, or null when the key is not ours.
 * Right = +x on the bench: the screen's s grows, the candle's u shrinks (it moves toward the lens).
 * Shift+Arrow is the 0.5 cm fine step; it never goes below the active snap, so on mobile it equals 1 cm.
 */
export function keyboardTarget(kind, key, shiftKey, position, snap) {
  const k = KEYS[key];
  if (!k) return null;
  const base = shiftKey && key.startsWith('Arrow') ? KEY_STEP.fine : k.step;
  return snapTo(fromAxis(kind, toAxis(kind, position) + k.dir * Math.max(base, snap)), snap);
}

const positionOf = (state, kind) => (kind === 'candle' ? state.u : state.s);

/**
 * createInputController({ getState, dispatch, getSnap, getRect })
 *   getState()  → current engine state (read only)
 *   dispatch(a) → feeds an engine action
 *   getSnap()   → current snap in cm (use snapForWidth)
 *   getRect()   → { left, width } of the bench view for pointer mapping
 *   isLocked(kind, state) → optional; defaults to the engine's own rangesFor(phase)
 * attach(element, kind) wires one draggable ('screen' | 'candle') and returns a detach function.
 */
export function createInputController({ getState, dispatch, getSnap, getRect, isLocked = (kind, state) => rangesFor(state.phase)[kind].locked }) {
  const moveAction = (kind, position) => ({ type: kind === 'candle' ? 'MOVE_CANDLE' : 'MOVE_SCREEN', position });
  const current = (kind) => positionOf(getState(), kind);

  function attach(element, kind) {
    if (kind !== 'screen' && kind !== 'candle') throw new RangeError('kind must be screen or candle');
    element.setAttribute('data-optics-draggable', kind);
    let drag = null;

    const targetAt = (clientX) => snapTo(positionFromClientX(kind, clientX, getRect()) + drag.offset, getSnap());

    function pushTo(position) {
      if (position === drag.last) return;
      drag.last = position;
      dispatch(moveAction(kind, position));
    }

    // Both release and cancel settle: the object rests where it is (Spec §6.6).
    function finish(clientX) {
      if (!drag) return;
      const { pointerId, start } = drag;
      if (drag.active && typeof clientX === 'number' && Number.isFinite(clientX)) pushTo(targetAt(clientX));
      const moved = current(kind) !== start;
      drag = null;
      try { element.releasePointerCapture?.(pointerId); } catch (_) { /* capture already gone */ }
      // Only a screen operation that really changed the snapped position is an observation.
      if (kind === 'screen' && moved) dispatch({ type: 'SETTLE_SCREEN' });
    }

    const onDown = (e) => {
      if (drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if (isLocked(kind, getState())) return;
      e.preventDefault();
      // Keep the grab offset so the object follows the pointer without jumping under it.
      const position = current(kind);
      drag = { pointerId: e.pointerId, start: position, last: position, offset: 0, downX: e.clientX, active: false };
      drag.offset = position - positionFromClientX(kind, e.clientX, getRect());
      try { element.setPointerCapture?.(e.pointerId); } catch (_) { /* synthetic pointers cannot be captured */ }
    };
    const onMove = (e) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      if (!drag.active && Math.abs(e.clientX - drag.downX) < DRAG_SLOP_PX) return;
      drag.active = true;
      pushTo(targetAt(e.clientX));
    };
    const onUp = (e) => { if (drag && e.pointerId === drag.pointerId) finish(e.clientX); };
    const onCancel = (e) => { if (drag && e.pointerId === drag.pointerId) finish(null); };
    const onLost = (e) => { if (drag && e.pointerId === drag.pointerId) finish(null); };

    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (isLocked(kind, getState())) return;   // a locked draggable leaves every key to the page
      const target = keyboardTarget(kind, e.key, e.shiftKey, current(kind), getSnap());
      if (target === null) return;
      e.preventDefault();                 // only reached while this draggable has focus
      const before = current(kind);
      dispatch(moveAction(kind, target));
      if (kind === 'screen' && current(kind) !== before) dispatch({ type: 'SETTLE_SCREEN' });
    };

    const listeners = [['pointerdown', onDown], ['pointermove', onMove], ['pointerup', onUp], ['pointercancel', onCancel], ['lostpointercapture', onLost], ['keydown', onKey]];
    for (const [name, fn] of listeners) element.addEventListener(name, fn);
    return () => {
      for (const [name, fn] of listeners) element.removeEventListener(name, fn);
      element.removeAttribute('data-optics-draggable');
      drag = null;
    };
  }

  return { attach };
}
