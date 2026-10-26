// Presentation-only observation boundary; frozen input and optics math are unchanged.
export const SCREEN_SETTLE_MS = 400;

export function createScreenSettlement({ getState, dispatch, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let timer = null, generation = 0, candidate = null;
  const held = new Set();

  function clearPendingTimer() {
    generation += 1;
    if (timer !== null) clearTimer(timer);
    timer = null;
  }

  function arm() {
    if (!candidate || held.size) return;
    const token = generation, snapshot = candidate;
    timer = setTimer(() => {
      if (token !== generation || held.size || candidate !== snapshot) return;
      timer = null;
      candidate = null;
      const state = getState();
      if (state.f !== snapshot.f || state.u !== snapshot.u || state.s !== snapshot.s || state.pendingScreenStart !== snapshot.start) return;
      // The reducer retains the pre-burst origin, so returning to it earns no credit.
      dispatch({ type: 'SETTLE_SCREEN' });
    }, SCREEN_SETTLE_MS);
  }

  function move(position) {
    clearPendingTimer();
    dispatch({ type: 'MOVE_SCREEN', position });
    const state = getState();
    candidate = state.pendingScreenStart === null ? null : { f: state.f, u: state.u, s: state.s, start: state.pendingScreenStart };
  }

  return {
    hold(key) { held.add(key); clearPendingTimer(); },
    keyDown(key, position) { held.add(key); move(position); },
    keyUp(key) { if (held.delete(key) && !held.size) { clearPendingTimer(); arm(); } },
    button(position) { move(position); arm(); },
    cancel() {
      clearPendingTimer();
      candidate = null;
      held.clear();
      if (getState().pendingScreenStart !== null) dispatch({ type: 'CANCEL_SCREEN_OPERATION' });
    },
  };
}
