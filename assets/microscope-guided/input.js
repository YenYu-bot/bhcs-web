// Input layer for the guided microscope lab (Pilot #3, B2). Pointer, touch and keyboard become engine actions, nothing else.
// It never clamps (the engine owns the stage range) and never computes a key step (model.js owns it).
import { STAGE_GAIN, KEY_FRACTION, KEY_FRACTION_FINE, stageDeltaForScreenFraction } from './model.js';
import { rangesFor, configFor } from './engine.js';
import { OVERVIEW_WU_PER_PX, OVERVIEW_SIZE } from './render.js';

const ARROWS = { ArrowRight: 'right', ArrowLeft: 'left', ArrowUp: 'up', ArrowDown: 'down' };

/**
 * getState()        current engine state
 * dispatch(action)  forwards an engine action
 * getStageRect()    client rectangle of the stage surface (maps client px onto the 340 x 220 overview frame)
 * getObjective()    objective in use right now (defaults to state.objective)
 * getHomeStage()    stage Home returns to (defaults to the start stage of the current trial)
 * getCanMove()      optional extra gate; the phase gate (rangesFor) always applies
 */
export function createMicroscopeInput({ getState, dispatch, getStageRect, getObjective, getHomeStage, getCanMove }) {
  let surface = null, drag = null, savedTouchAction = '';

  const canMove = () => rangesFor(getState().phase).stage && (getCanMove ? getCanMove() !== false : true);
  const objectiveNow = () => (getObjective ? getObjective() : getState().objective);

  // One helper for keys and for the on-screen direction buttons.
  function move(direction, fine = false) {
    if (!canMove()) return false;
    const { dx, dy } = stageDeltaForScreenFraction({ direction, objective: objectiveNow(), fraction: fine ? KEY_FRACTION_FINE : KEY_FRACTION });
    dispatch({ type: 'MOVE_STAGE', dx, dy });
    return true;
  }

  function home() {
    if (!canMove()) return false;
    const target = getHomeStage ? getHomeStage() : (configFor(getState().phase)?.startStage ?? { x: 0, y: 0 });
    dispatch({ type: 'SET_STAGE', x: target.x, y: target.y });
    return true;
  }

  const sameDrag = (e) => drag && (e.pointerId === undefined || e.pointerId === drag.id);

  function onPointerDown(e) {
    if (!canMove() || (e.button !== undefined && e.button !== 0)) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, stage: { ...getState().stage } };
    surface.setPointerCapture?.(e.pointerId);
    surface.focus?.();
    e.preventDefault?.();
  }
  function onPointerMove(e) {
    if (!sameDrag(e)) return;
    if (!canMove()) { drag = null; return; }
    const rect = getStageRect();
    if (!rect || !rect.width || !rect.height) return;
    // Client px -> overview px -> world units on the slide -> stage units. Always measured from the drag start.
    const k = OVERVIEW_WU_PER_PX / STAGE_GAIN;
    const dx = (e.clientX - drag.x) * (OVERVIEW_SIZE.width / rect.width);
    const dy = (e.clientY - drag.y) * (OVERVIEW_SIZE.height / rect.height);
    dispatch({ type: 'SET_STAGE', x: drag.stage.x + dx * k, y: drag.stage.y - dy * k });
  }
  function endDrag(e) {
    if (!sameDrag(e)) return;
    surface.releasePointerCapture?.(drag.id);
    drag = null;
  }
  function onKeyDown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (ARROWS[e.key]) { e.preventDefault(); move(ARROWS[e.key], !!e.shiftKey); }
    else if (e.key === 'Home') { e.preventDefault(); home(); }
  }

  const handlers = { pointerdown: onPointerDown, pointermove: onPointerMove, pointerup: endDrag, pointercancel: endDrag, keydown: onKeyDown };

  return {
    attach(target) {
      if (surface) this.detach();
      surface = target;
      savedTouchAction = surface.style?.touchAction ?? '';
      if (surface.style) surface.style.touchAction = 'none';
      for (const [type, fn] of Object.entries(handlers)) surface.addEventListener(type, fn);
    },
    detach() {
      if (!surface) return;
      for (const [type, fn] of Object.entries(handlers)) surface.removeEventListener(type, fn);
      if (surface.style) surface.style.touchAction = savedTouchAction;
      surface = null; drag = null;
    },
    move, home,
  };
}
