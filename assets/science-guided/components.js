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

// ---- comparison ---------------------------------------------------------------------------------------------------------

const ROW_KINDS = { changed: 'changed', controlled: 'controlled', observed: 'observed' };

/**
 * The shared evidence table for an EvidenceComparisonModel: what was changed, what was kept the same, what was seen.
 * heads = { item, first, second, changed?, same? } are the station's words; tagLabel(label, tag) joins a row name and its tag.
 * The table never decides which condition changed: it only draws the model it is given.
 */
export function buildComparisonTable(doc, model, { heads, tagLabel = (label, tag) => (tag ? `${label} (${tag})` : label), caption = null, itemHeadingHidden = false } = {}) {
  // Explicit table roles: on a phone the rows can be laid out as stacked cards (CSS display changes), which would otherwise drop the table meaning.
  const rowHead = (text) => node(doc, 'th', { scope: 'row', role: 'rowheader', text });
  const cell = (text, label) => node(doc, 'td', { role: 'cell', 'data-label': label ?? null, text });
  const row = (kind, head, ...cells) => node(doc, 'tr', { role: 'row', 'data-kind': ROW_KINDS[kind] }, head, ...cells);
  const rows = [];
  const iv = model.independentVariable;
  if (iv) rows.push(row('changed', rowHead(tagLabel(iv.label, heads.changed)), cell(iv.from, heads.first), cell(iv.to, heads.second)));
  for (const c of model.controlledVariables ?? []) rows.push(row('controlled', rowHead(tagLabel(c.label, heads.same)), node(doc, 'td', { role: 'cell', colspan: 2, text: c.value })));
  for (const r of model.observedResponse) rows.push(row('observed', rowHead(r.label), cell(r.first, heads.first), cell(r.second, heads.second)));
  const itemHead = node(doc, 'th', { scope: 'col', role: 'columnheader' }, itemHeadingHidden ? node(doc, 'span', { class: 'sg-sr', text: heads.item }) : heads.item);
  return node(doc, 'div', { class: 'sg-table-wrap' }, node(doc, 'table', { class: 'sg-compare-table', role: 'table' },
    caption ? node(doc, 'caption', { class: 'sg-sr', text: caption }) : null,
    node(doc, 'thead', { role: 'rowgroup' }, node(doc, 'tr', { role: 'row' }, itemHead,
      node(doc, 'th', { scope: 'col', role: 'columnheader', text: heads.first }), node(doc, 'th', { scope: 'col', role: 'columnheader', text: heads.second }))),
    node(doc, 'tbody', { role: 'rowgroup' }, ...rows)));
}

const answerHandlers = new WeakMap();

/**
 * Shared CompareCard: the evidence table and the questions about it. The card shows what the model says and judges nothing:
 * there is no answer key in its contract. Controls are built once per structure and then updated in place, so a keyboard
 * learner is never thrown off the radio they are on.
 * els = { root, body }; model = EvidenceComparisonModel + { notice?: { kind, text }, questions: [{ id, text, options: [{ value, label }],
 * selectedValue?, disabled?, feedback?: { kind, text } }] } | null; opts = { heads, tagLabel?, caption?, itemHeadingHidden?, onAnswer(questionId, value) }.
 */
export function renderCompareCard({ root, body }, model, opts = {}) {
  setHidden(root, !model);
  if (!model) return;
  const doc = body.ownerDocument;
  answerHandlers.set(body, opts.onAnswer);
  for (const q of model.questions) for (const o of q.options) {
    if (!o || typeof o !== 'object' || Array.isArray(o) || typeof o.value !== 'string') throw new TypeError(`question ${q.id}: options must be { value, label }`);
  }
  const structure = {
    independentVariable: model.independentVariable ?? null, controlledVariables: model.controlledVariables ?? [], observedResponse: model.observedResponse,
    procedureNote: model.procedureNote ?? null, hasNotice: Boolean(model.notice), heads: opts.heads, caption: opts.caption ?? null, itemHeadingHidden: opts.itemHeadingHidden === true,
    questions: model.questions.map(({ id, text, options }) => ({ id, text, options })),
  };
  rebuildIf(body, structure, () => [
    model.notice ? node(doc, 'p', { class: 'sg-notice' }) : null,
    buildComparisonTable(doc, model, opts),
    model.procedureNote ? node(doc, 'p', { class: 'sg-procedure', text: model.procedureNote }) : null,
    ...model.questions.map((q) => node(doc, 'fieldset', { class: 'sg-question', 'data-question': q.id },
      node(doc, 'legend', { text: q.text }),
      node(doc, 'div', { class: 'sg-options' }, ...q.options.map((o) => {
        const input = node(doc, 'input', { type: 'radio', name: `sg-q-${q.id}`, value: o.value, 'data-compare': '', 'data-q': q.id });
        input.addEventListener('change', () => { if (input.checked) answerHandlers.get(body)?.(q.id, o.value); });
        return node(doc, 'label', { class: 'sg-pill' }, input, node(doc, 'span', { text: o.label }));
      })),
      node(doc, 'p', { class: 'sg-feedback', 'data-feedback': q.id, hidden: true }))),
  ]);
  const notice = body.querySelector('.sg-notice');
  if (notice && model.notice) {
    putText(notice, model.notice.text);
    if (notice.dataset.kind !== model.notice.kind) notice.dataset.kind = model.notice.kind;
  }
  for (const q of model.questions) {
    const box = [...body.querySelectorAll('[data-question]')].find((e) => e.dataset.question === q.id);
    for (const input of box.querySelectorAll('input[data-compare]')) {
      const checked = input.value === (q.selectedValue ?? null);
      if (input.checked !== checked) input.checked = checked;
      const disabled = q.disabled === true;
      if (input.disabled !== disabled) input.disabled = disabled;
    }
    const fb = box.querySelector('[data-feedback]');
    setHidden(fb, !q.feedback);
    const kind = q.feedback?.kind ?? '';
    if ((fb.dataset.kind ?? '') !== kind) fb.dataset.kind = kind;
    putText(fb, q.feedback?.text ?? '');
  }
}

// ---- concept ------------------------------------------------------------------------------------------------------------

/**
 * Shared ConceptReveal: named ideas, each next to the learner's own evidence, then the formula that ties them together.
 * It only draws what it is given; whether the concept may be shown yet is the station's decision (null means not yet).
 * els = { root, heading?, body }; model = { heading?, cards: [{ id, title, body: string[], evidence: [{ label?, text }] }],
 * formula?: { heading, expression, lines: [{ text, note?, emphasis? }], note? } } | null; opts = { labelSuffix }.
 */
export function renderConceptReveal({ root, heading, body }, model, { labelSuffix = ': ' } = {}) {
  setHidden(root, !model);
  if (!model) return;
  if (heading && model.heading) putText(heading, model.heading);
  const doc = body.ownerDocument;
  rebuildIf(body, { cards: model.cards, formula: model.formula ?? null, labelSuffix }, () => [
    ...model.cards.map((card) => node(doc, 'article', { class: 'sg-concept-card', 'data-concept-card': card.id },
      node(doc, 'h3', { class: 'sg-concept-title', text: card.title }),
      ...card.body.map((line) => node(doc, 'p', { text: line })),
      node(doc, 'ul', { class: 'sg-concept-evidence' }, ...card.evidence.map((e) => node(doc, 'li', {},
        e.label ? node(doc, 'span', { class: 'sg-line-label', text: `${e.label}${labelSuffix}` }) : null, node(doc, 'span', { text: e.text })))))),
    model.formula ? node(doc, 'section', { class: 'sg-formula-card', 'data-formula': '' },
      node(doc, 'h3', { class: 'sg-concept-title', text: model.formula.heading }),
      node(doc, 'p', { class: 'sg-formula', text: model.formula.expression }),
      node(doc, 'ul', { class: 'sg-formula-lines' }, ...model.formula.lines.map((l) => node(doc, 'li', { 'data-emphasis': l.emphasis === true ? 'true' : null },
        l.text, l.note ? node(doc, 'span', { class: 'sg-line-note', text: l.note }) : null))),
      model.formula.note ? node(doc, 'p', { class: 'sg-formula-note', text: model.formula.note }) : null) : null,
  ]);
}
