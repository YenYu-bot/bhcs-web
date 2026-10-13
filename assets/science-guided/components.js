// Shared presentation behavior for Science Lab 2.0 guided stations.
// This module owns no science, phase transitions, persistence schema, event tables, or learner wording.

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

/**
 * Shared StepNav: a read-only progress list. The station decides which step is current; this only draws it.
 * model = { steps: [{ id, number, label }], currentStep }. Nothing here is a control.
 */
export function renderStepNav(ol, { steps, currentStep }) {
  const doc = ol.ownerDocument;
  const sig = JSON.stringify(steps.map((s) => [s.id, s.number, s.label]));
  if (ol.dataset.sgSteps !== sig) {
    ol.dataset.sgSteps = sig;
    ol.replaceChildren(...steps.map((s) => {
      const li = doc.createElement('li');
      li.className = 'sg-step';
      li.dataset.step = s.id;
      const num = doc.createElement('span');
      num.className = 'sg-step-num';
      num.textContent = s.number;
      const label = doc.createElement('span');
      label.className = 'sg-step-label';
      label.textContent = s.label;
      li.append(num, ' ', label);
      return li;
    }));
  }
  const at = steps.findIndex((s) => s.id === currentStep);
  [...ol.children].forEach((li, i) => {
    li.classList.toggle('is-done', at >= 0 && i < at);
    li.classList.toggle('is-current', i === at);
    if (i === at) { if (li.getAttribute('aria-current') !== 'step') li.setAttribute('aria-current', 'step'); }
    else if (li.hasAttribute('aria-current')) li.removeAttribute('aria-current');
  });
}

const putText = (el, text) => { if (el.textContent !== text) el.textContent = text; };
const setHidden = (el, hidden) => { if (el.hidden !== hidden) el.hidden = hidden; };

/**
 * Shared CoachCard: draws { name, main, sub? } into elements the station owns. Visual only: it never sets
 * aria-live or a status role, and it leaves the DOM alone when the text did not change.
 * els = { main, sub, name? }.
 */
export function renderCoachCard(els, coach) {
  if (els.name && coach.name !== undefined && coach.name !== null) putText(els.name, coach.name);
  putText(els.main, coach.main ?? '');
  putText(els.sub, coach.sub ?? '');
  setHidden(els.sub, !coach.sub);
}

const STATUS_KINDS = new Set(['neutral', 'progress', 'success', 'notice', 'warning']);

/**
 * Shared StatusBar: draws { kind, icon, text } into elements the station owns, or hides the bar for a null model.
 * Visual only (no aria-live, no status role); the page's single announcer is what speaks.
 * els = { root, icon, text }.
 */
export function renderStatusBar(els, status) {
  setHidden(els.root, !status);
  if (!status) return;
  const kind = STATUS_KINDS.has(status.kind) ? status.kind : 'neutral';
  if (els.root.dataset.kind !== kind) els.root.dataset.kind = kind;
  putText(els.icon, status.icon ?? '');
  putText(els.text, status.text ?? '');
}

// ---- cards ------------------------------------------------------------------------------------------------------------

const node = (doc, tag, attrs = {}, ...kids) => {
  const e = doc.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  e.append(...kids.filter((k) => k !== null && k !== undefined));
  return e;
};

/** Rebuilds `target` only when the model actually changed, so identical renders touch nothing. */
function rebuildIf(target, model, build) {
  const sig = JSON.stringify(model);
  if (target.dataset.sgSig === sig) return false;
  target.dataset.sgSig = sig;
  target.replaceChildren(...build().filter(Boolean));
  return true;
}

function labelCard(root, title) {
  if (title && root.id) {
    const id = `${root.id}-title`;
    if (root.getAttribute('aria-labelledby') !== id) root.setAttribute('aria-labelledby', id);
  }
}

const DATA_STATES = new Set(['normal', 'locked', 'hidden', 'changed']);

/**
 * Shared DataCard: the conditions the learner is working with right now, as a description list.
 * model = { conditions: [{ label, value, state? }] } | null. `state` is only a presentation hook (data-state);
 * `stateLabels` lets the station supply the words for a state, because this module translates nothing.
 */
export function renderDataCard(root, model, { title, stateLabels = {} } = {}) {
  setHidden(root, !model);
  if (!model) return;
  const doc = root.ownerDocument;
  rebuildIf(root, { model, title, stateLabels }, () => [
    title ? node(doc, 'h2', { class: 'sg-card-title', id: `${root.id}-title`, text: title }) : null,
    node(doc, 'dl', { class: 'sg-facts' }, ...model.conditions.flatMap((c) => {
      const state = DATA_STATES.has(c.state) ? c.state : 'normal';
      return [
        node(doc, 'dt', { text: c.label }),
        node(doc, 'dd', { 'data-state': state }, c.value, stateLabels[state] ? node(doc, 'span', { class: 'sg-state-tag', text: stateLabels[state] }) : null),
      ];
    })),
  ]);
  labelCard(root, title);
}

/**
 * Shared EvidenceCard: what the learner has recorded or watched, one block per item.
 * model = { items: [{ id, title, rows: [{ label, value }], note? }] } | null. null or no items hides the card.
 * It knows nothing about trials or units, and carries no expected or reference values: stations pass only what was observed.
 */
export function renderEvidenceCard(root, model, { title } = {}) {
  const shown = Boolean(model) && model.items.length > 0;
  setHidden(root, !shown);
  if (!shown) return;
  const doc = root.ownerDocument;
  rebuildIf(root, { model, title }, () => [
    title ? node(doc, 'h2', { class: 'sg-card-title', id: `${root.id}-title`, text: title }) : null,
    ...model.items.map((item) => node(doc, 'section', { class: 'sg-evidence-item', 'data-evidence-item': item.id },
      node(doc, 'h3', { class: 'sg-evidence-title', text: item.title }),
      node(doc, 'dl', { class: 'sg-facts' }, ...item.rows.flatMap((r) => [node(doc, 'dt', { text: r.label }), node(doc, 'dd', { text: r.value })])),
      item.note ? node(doc, 'p', { class: 'sg-evidence-note', text: item.note }) : null)),
  ]);
  labelCard(root, title);
}

const MAX_CLAIMS = 3;

/**
 * Shared CompletionCard: the finish of a station. Heading, up to three claims the learner actually earned, an optional
 * conclusion, and an optional way out. More than three claims is refused, never silently cut.
 * els = { root, heading, body }; model = { heading, claims: string[], conclusion?: string[], link?: { href, label } } | null.
 */
export function renderCompletionCard(els, model) {
  setHidden(els.root, !model);
  if (!model) return;
  if (model.claims.length > MAX_CLAIMS) throw new RangeError(`a completion card shows at most ${MAX_CLAIMS} claims, got ${model.claims.length}`);
  if (els.heading && model.heading) putText(els.heading, model.heading);
  const doc = els.body.ownerDocument;
  rebuildIf(els.body, { claims: model.claims, conclusion: model.conclusion ?? [], link: model.link ?? null }, () => [
    ...(model.conclusion ?? []).map((t) => node(doc, 'p', { class: 'sg-complete-conclusion', text: t })),
    model.claims.length
      ? node(doc, 'ul', { class: 'sg-claims' }, ...model.claims.map((c) => node(doc, 'li', { class: 'sg-claim' }, node(doc, 'span', { class: 'sg-tick', 'aria-hidden': 'true', text: '✓' }), ' ', c)))
      : null,
    model.link ? node(doc, 'p', { class: 'sg-complete-link' }, node(doc, 'a', { class: 'sg-link', href: model.link.href, text: model.link.label })) : null,
  ]);
}
