// Cards for the guided buoyancy lab: turns the plain view-models from script.js into DOM.
// It holds no learner wording (headings and column names come in through `text`), makes no decision about the science,
// stores nothing and keeps no state of its own beyond what is on the page. Anything that can hold focus (the compare
// choices) is updated in place instead of rebuilt, so a keyboard user is never thrown off the control they are on.

const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  e.append(...kids.filter((k) => k !== null && k !== undefined));
  return e;
};
const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };
const signatureOf = (model) => JSON.stringify(model);

/** Rebuilds `root` only when the model actually changed. Returns true when it did. */
function rebuildIf(root, model, build) {
  const sig = signatureOf(model);
  if (root.dataset.sig === sig) return false;
  root.dataset.sig = sig;
  root.replaceChildren(...build());
  return true;
}

export function renderSteps(ol, { steps, currentStep }) {
  rebuildIf(ol, { steps, currentStep }, () => {
    const at = steps.findIndex((s) => s.id === currentStep);
    return steps.map((s, i) => h('li', {
      class: `bg-step${i < at ? ' is-done' : ''}${i === at ? ' is-current' : ''}`,
      'data-step': s.id,
      'aria-current': i === at ? 'step' : null,
    }, h('span', { class: 'bg-step-num', text: s.number }), ' ', h('span', { class: 'bg-step-label', text: s.label })));
  });
}

export function renderCoach(els, coach, tip) {
  put(els.name, coach.name);
  put(els.main, coach.main);
  put(els.sub, coach.sub ?? '');
  els.sub.hidden = !coach.sub;
  put(els.tip, tip ?? '');
  els.tip.hidden = !tip;
  els.root.dataset.coach = coach.key;
}

export function renderStatus(root, status) {
  root.hidden = !status;
  if (!status) return;
  root.dataset.kind = status.kind;
  put(root.querySelector('[data-bg-status-icon]'), status.icon);
  put(root.querySelector('[data-bg-status-text]'), status.text);
}

/** DataCard: a list of conditions, each marked normal / locked / changed. */
export function renderData(root, model, title, stateText = {}) {
  root.hidden = !model;
  if (!model) return;
  rebuildIf(root, { model, title, stateText }, () => [
    h('h2', { class: 'bg-card-title', id: `${root.id}-title`, text: title }),
    h('dl', { class: 'bg-facts' }, ...model.conditions.flatMap((c) => [
      h('dt', { text: c.label }),
      h('dd', { 'data-state': c.state ?? 'normal' }, c.value, stateText[c.state] ? h('span', { class: 'bg-state-tag', text: stateText[c.state] }) : null),
    ])),
  ]);
  root.setAttribute('aria-labelledby', `${root.id}-title`);
}

/** EvidenceCard: one block per thing the learner recorded or watched. */
export function renderEvidence(root, model, title) {
  const shown = Boolean(model) && model.items.length > 0;
  root.hidden = !shown;
  if (!shown) return;
  rebuildIf(root, { model, title }, () => [
    h('h2', { class: 'bg-card-title', id: `${root.id}-title`, text: title }),
    ...model.items.map((item) => h('section', { class: 'bg-evidence-item', 'data-bg-evidence-item': item.id },
      h('h3', { class: 'bg-evidence-title', text: item.title }),
      h('dl', { class: 'bg-facts' }, ...item.rows.flatMap((r) => [h('dt', { text: r.label }), h('dd', { text: r.value })])),
      item.note ? h('p', { class: 'bg-evidence-note', text: item.note }) : null)),
  ]);
  root.setAttribute('aria-labelledby', `${root.id}-title`);
}

// ---- compare ---------------------------------------------------------------------------------------------------------

function structureOf(model) {
  const { independentVariable, controlledVariables, observedResponse, procedureNote, notice, questions } = model;
  return { independentVariable, controlledVariables, observedResponse, procedureNote, notice, questions: questions.map(({ id, text, options }) => ({ id, text, options })) };
}

function buildCompare(model, text, onAnswer) {
  const heads = text.compareHeads;
  const iv = model.independentVariable;
  const rows = [];
  if (iv) rows.push(h('tr', { class: 'is-changed' }, h('th', { scope: 'row', text: `${iv.label}（${heads.changed}）` }), h('td', { text: iv.from }), h('td', { text: iv.to })));
  for (const c of model.controlledVariables ?? []) {
    rows.push(h('tr', {}, h('th', { scope: 'row', text: `${c.label}（${heads.same}）` }), h('td', { colspan: 2, text: c.value })));
  }
  for (const r of model.observedResponse) rows.push(h('tr', {}, h('th', { scope: 'row', text: r.label }), h('td', { text: r.first }), h('td', { text: r.second })));
  const table = h('table', { class: 'bg-compare-table' },
    h('thead', {}, h('tr', {}, h('th', { scope: 'col', text: heads.item }), h('th', { scope: 'col', text: heads.first }), h('th', { scope: 'col', text: heads.second }))),
    h('tbody', {}, ...rows));
  const questions = model.questions.map((q) => h('fieldset', { class: 'bg-question', 'data-bg-question': q.id },
    h('legend', { text: q.text }),
    h('div', { class: 'bg-options' }, ...q.options.map((o) => {
      const input = h('input', { type: 'radio', name: `bg-q-${q.id}`, value: o.value, 'data-bg-compare': '', 'data-q': q.id });
      input.addEventListener('change', () => { if (input.checked) onAnswer(q.id, o.value); });
      return h('label', { class: 'bg-pill' }, input, o.label);
    })),
    h('p', { class: 'bg-feedback', 'data-bg-feedback': q.id, hidden: true })));
  return [
    model.notice ? h('p', { class: 'bg-notice', 'data-kind': model.notice.kind, text: model.notice.text }) : null,
    table,
    model.procedureNote ? h('p', { class: 'bg-procedure', text: model.procedureNote }) : null,
    ...questions,
  ].filter(Boolean);
}

/** CompareCard: the evidence table and the two questions. The card only shows what the model says; it judges nothing. */
export function renderCompare(root, model, text, onAnswer) {
  root.hidden = !model;
  if (!model) return;
  const body = root.querySelector('[data-bg-compare-body]');
  rebuildIf(body, structureOf(model), () => buildCompare(model, text, onAnswer));
  for (const q of model.questions) {
    const box = body.querySelector(`[data-bg-question="${q.id}"]`);
    for (const input of box.querySelectorAll('input[data-bg-compare]')) {
      input.checked = input.value === q.selectedValue;
      input.disabled = q.disabled === true;
    }
    const fb = box.querySelector('[data-bg-feedback]');
    fb.hidden = !q.feedback;
    fb.dataset.kind = q.feedback?.kind ?? '';
    put(fb, q.feedback?.text ?? '');
  }
}

// ---- concept ---------------------------------------------------------------------------------------------------------

/** ConceptReveal: named ideas, each next to the learner's own numbers, then the formula that ties them together. */
export function renderConcept(root, model) {
  root.hidden = !model;
  if (!model) return;
  const body = root.querySelector('[data-bg-concept-body]');
  rebuildIf(body, model, () => [
    ...model.cards.map((card) => h('article', { class: 'bg-concept-card', 'data-bg-concept-card': card.id },
      h('h3', { class: 'bg-concept-title', text: card.title }),
      ...card.body.map((line) => h('p', { text: line })),
      h('ul', { class: 'bg-concept-evidence' }, ...card.evidence.map((e) => h('li', { 'data-bg-line': e.id }, e.label && e.label !== e.text ? h('span', { class: 'bg-line-label', text: `${e.label}：` }) : null, h('span', { text: e.text })))))),
    model.formula ? h('section', { class: 'bg-formula-card', 'data-bg-formula': '' },
      h('h3', { class: 'bg-concept-title', text: model.formula.heading }),
      h('p', { class: 'bg-formula', text: model.formula.expression }),
      h('ul', { class: 'bg-formula-lines' }, ...model.formula.lines.map((l) => h('li', { 'data-found': String(l.found === true), text: l.text }))),
      model.formula.note ? h('p', { class: 'bg-evidence-note', text: model.formula.note }) : null) : null,
  ].filter(Boolean));
}

// ---- announcer -------------------------------------------------------------------------------------------------------

/**
 * The page's one live region. Same id: nothing is written. A new id: cleared first, then written after a beat, so the
 * same words spoken twice are heard twice. `data-id` and `data-writes` are for the checks, not for the learner.
 */
export function createAnnouncer(el, { delayMs = 40 } = {}) {
  let lastId = null, token = 0;
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
