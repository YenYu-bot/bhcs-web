// Input layer for Science Lab 2.0 Pilot #5 B2.
// It knows only the discrete lamp control. It does not import the model or engine and does not decide science.
//
// Mouse/touch use native button clicks. Keyboard Enter/Space are handled natively by buttons; Arrow keys provide the
// additional Guided alternative required by the spec. All routes converge on onSetLight(value).

export const LIGHT_VALUES = Object.freeze([15, 60, 100]);

function buttonValue(button) {
  const raw = Number(button?.getAttribute?.('data-light-value'));
  return LIGHT_VALUES.includes(raw) ? raw : null;
}

function eligibleButtons(root) {
  return [...root.querySelectorAll('[data-light-value]')]
    .filter((b) => buttonValue(b) !== null && !b.disabled && !b.hidden);
}

/**
 * bindPhotosynthesisInput({ root, getLocked, canSetLight, onSetLight }) -> { destroy() }
 *
 * getLocked()      true when the bench may not change light
 * canSetLight(v)   caller-level gate for the current phase
 * onSetLight(v)    receives a numeric Guided light value
 */
export function bindPhotosynthesisInput({
  root,
  getLocked = () => false,
  canSetLight = () => true,
  onSetLight,
}) {
  if (!root?.addEventListener) throw new TypeError('root is required');
  if (typeof onSetLight !== 'function') throw new TypeError('onSetLight is required');

  let alive = true;

  function send(value) {
    if (!alive || getLocked() === true || !LIGHT_VALUES.includes(value) || canSetLight(value) !== true) return false;
    onSetLight(value);
    return true;
  }

  function onClick(event) {
    const button = event.target?.closest?.('[data-light-value]');
    if (!button || !root.contains(button) || button.disabled || button.hidden) return;
    const value = buttonValue(button);
    if (value !== null) send(value);
  }

  function onKeyDown(event) {
    const button = event.target?.closest?.('[data-light-value]');
    if (!button || !root.contains(button) || button.disabled || button.hidden) return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;

    const list = eligibleButtons(root);
    if (!list.length) return;
    const index = Math.max(0, list.indexOf(button));
    let target;
    if (event.key === 'Home') target = list[0];
    else if (event.key === 'End') target = list[list.length - 1];
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') target = list[Math.max(0, index - 1)];
    else target = list[Math.min(list.length - 1, index + 1)];

    const value = buttonValue(target);
    if (value === null) return;
    event.preventDefault();
    target.focus();
    send(value);
  }

  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeyDown);

  return {
    destroy() {
      if (!alive) return;
      alive = false;
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKeyDown);
    },
  };
}
