// Shared presentation behavior for Science Lab 2.0 guided stations.
// This module owns no science, phase transitions, persistence schema, analytics event tables, or learner wording.

/** Hidden by the hidden attribute, or by CSS (display:none / visibility:hidden|collapse) on the element or any ancestor. */
const isHidden = (el) => {
  if (!el) return true;
  if (el.hidden || el.closest?.('[hidden]')) return true;
  const win = el.ownerDocument?.defaultView;
  if (!win?.getComputedStyle) return false;
  for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
    const style = win.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return true;
  }
  return false;
};
export const isLocked = (el) => Boolean(el) && (
  el.dataset?.locked === 'true' ||
  el.getAttribute?.('aria-disabled') === 'true' ||
  el.disabled === true
);

export function isUsable(el, root = el?.ownerDocument?.body) {
  return Boolean(el) && Boolean(root) && root.contains(el) && !isHidden(el) && !isLocked(el);
}

/** Move focus only when the current target became unavailable/removed, or when the just-used CTA disappeared. */
export function focusHandoff({ root, active, ctaGone = false, targets = [] }) {
  const body = root.ownerDocument.body;
  const stranded = Boolean(active) && active !== body && !isUsable(active, root);
  if (!stranded && !ctaGone) return null;
  for (const selector of targets) {
    for (const el of root.querySelectorAll(selector)) {
      if (el !== active && isUsable(el, root) && typeof el.focus === 'function') {
        el.focus({ preventScroll: true });
        return el;
      }
    }
  }
  return null;
}

/** The page's one polite live region. Deduplicate by id, not by visible text. */
export function createAnnouncer(el, { delayMs = 40 } = {}) {
  let lastId = null;
  let token = 0;
  return {
    say(announcement) {
      if (!announcement || announcement.id === lastId) return false;
      lastId = announcement.id;
      const mine = ++token;
      el.textContent = '';
      el.dataset.id = announcement.id;
      setTimeout(() => {
        if (mine !== token) return;
        el.textContent = announcement.text;
        el.dataset.writes = String(Number(el.dataset.writes ?? 0) + 1);
      }, delayMs);
      return true;
    },
    get lastId() { return lastId; },
  };
}

/** Shared ActionBar: action stays opaque and is handed back unchanged. id is only a DOM/debug hook. */
export function createActionBar(button, { onAction }) {
  let current = null;
  const activate = () => {
    const model = current;
    if (!model || model.enabled !== true || button.hidden || button.disabled) return;
    onAction(model.action);
  };
  button.addEventListener('click', activate);
  return {
    render(model) {
      current = model ?? null;
      button.hidden = !current;
      if (!current) {
        button.disabled = true;
        button.removeAttribute('data-action');
        return;
      }
      if (button.textContent !== current.label) button.textContent = current.label;
      button.disabled = current.enabled !== true;
      if (current.id === null || current.id === undefined || current.id === '') button.removeAttribute('data-action');
      else button.dataset.action = String(current.id);
    },
    destroy() {
      button.removeEventListener('click', activate);
      current = null;
    },
    get action() { return current?.action; },
  };
}
