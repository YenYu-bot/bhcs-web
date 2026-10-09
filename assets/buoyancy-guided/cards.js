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

/** The shared evidence table (EvidenceComparisonModel): what changed, what was kept the same, what was seen. */
function buildEvidenceTable(model, heads) {
  const iv = model.independentVariable;
  const rows = [];
  if (iv) rows.push(h('tr', { class: 'is-changed' }, h('th', { scope: 'row', text: `${iv.label}（${heads.changed}）` }), h('td', { text: iv.from }), h('td', { text: iv.to })));
  for (const c of model.controlledVariables ?? []) {
    rows.push(h('tr', {}, h('th', { scope: 'row', text: `${c.label}（${heads.same}）` }), h('td', { colspan: 2, text: c.value })));
  }
  for (const r of model.observedResponse) rows.push(h('tr', {}, h('th', { scope: 'row', text: r.label }), h('td', { text: r.first }), h('td', { text: r.second })));
  return h('table', { class: 'bg-compare-table' },
    h('thead', {}, h('tr', {}, h('th', { scope: 'col', text: heads.item }), h('th', { scope: 'col', text: heads.first }), h('th', { scope: 'col', text: heads.second }))),
    h('tbody', {}, ...rows));
}

function buildCompare(model, text, onAnswer) {
  const table = buildEvidenceTable(model, text.compareHeads);
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

// ---- notebook ----------------------------------------------------------------------------------------------------------

const DEBOUNCE_MS = 300;
const FIELDS = ['freeText', 'evidenceText', 'limitationText'];
const labelled = (id, label, control) => h('div', { class: 'bg-field' }, h('label', { for: id, text: label }), control);

/**
 * The notebook card. It buffers what is typed (300 ms debounce; blur, pagehide, a hidden page and a main-button press flush
 * it) and hands it on through onDraft / onFlush; it never touches storage. Choices (level, relations) go straight out.
 *   handlers: { onLevel(level), onRelation(id, value), onDraft(fields), onFlush(fields) }
 * → { update(model), flush(), reset() }
 */
export function createNotebook(root, text, { maxLength, onLevel, onRelation, onDraft, onFlush }) {
  const body = root.querySelector('[data-bg-notebook-body]');
  let pending = {}, timer = null;
  const hasPending = () => Object.keys(pending).length > 0;
  const take = () => { const fields = pending; pending = {}; clearTimeout(timer); timer = null; return fields; };
  function flush() { if (hasPending()) onFlush(take()); }
  function schedule() { clearTimeout(timer); timer = setTimeout(() => { timer = null; if (hasPending()) onDraft(take()); }, DEBOUNCE_MS); }

  function textarea(id, field, placeholder) {
    const t = h('textarea', { id, rows: 5, maxlength: maxLength, 'data-bg-field': field, placeholder: placeholder ?? null });
    t.addEventListener('input', () => { pending[field] = t.value; schedule(); });
    t.addEventListener('blur', flush);
    return t;
  }
  function build(model) {
    const levels = h('fieldset', { class: 'bg-levels', 'data-bg-levels': '' }, h('legend', { text: model.levelsLegend }),
      h('div', { class: 'bg-options' }, ...model.levels.map((l) => {
        const input = h('input', { type: 'radio', name: 'bg-level', value: l.id, 'data-bg-level': '' });
        input.addEventListener('change', () => { if (input.checked) onLevel(l.id); });
        return h('label', { class: 'bg-pill bg-level-pill' }, input, h('span', {}, h('strong', { text: l.title }), ' ', h('span', { class: 'bg-level-desc', text: l.desc })));
      })));
    const A = model.levelA;
    const panelA = h('section', { class: 'bg-panel', 'data-bg-panel': 'A', hidden: true },
      h('ul', { class: 'bg-given' }, ...A.given.map((g) => h('li', { text: g }))),
      ...A.stems.map((stem) => h('fieldset', { class: 'bg-question', 'data-bg-stem': stem.id }, h('legend', { text: stem.legend }),
        h('div', { class: 'bg-options' }, ...stem.options.map((o) => {
          const input = h('input', { type: 'radio', name: `bg-rel-${stem.id}`, value: o.value, 'data-bg-relation': '', 'data-q': stem.id });
          input.addEventListener('change', () => { if (input.checked) onRelation(stem.id, o.value); });
          return h('label', { class: 'bg-pill' }, input, o.label);
        })))),
      h('p', { class: 'bg-feedback', 'data-bg-nudge': '', hidden: true }));
    const B = model.levelB;
    const panelB = h('section', { class: 'bg-panel', 'data-bg-panel': 'B', hidden: true },
      labelled('bg-nb-free', B.prompt, textarea('bg-nb-free', 'freeText', B.placeholder)), h('p', { class: 'bg-help', text: B.help }));
    const C = model.levelC;
    const panelC = h('section', { class: 'bg-panel', 'data-bg-panel': 'C', hidden: true },
      labelled('bg-nb-evidence', C.q1.label, textarea('bg-nb-evidence', 'evidenceText')),
      labelled('bg-nb-limit', C.q2.label, textarea('bg-nb-limit', 'limitationText')),
      h('div', { class: 'bg-ideas', 'data-bg-ideas': '', hidden: true }, h('p', { text: C.ideasHeading }), h('ul', {}, ...C.ideas.map((idea) => h('li', { text: idea })))),
      h('p', { class: 'bg-help', text: C.help }));
    return [
      h('section', { class: 'bg-nb-evidence' }, h('h3', { class: 'bg-card-title', text: model.evidenceHeading }), buildEvidenceTable(model.evidenceSummary, text.compareHeads),
        model.evidenceSummary.procedureNote ? h('p', { class: 'bg-procedure', text: model.evidenceSummary.procedureNote }) : null),
      levels, panelA, panelB, panelC, h('p', { class: 'bg-notice', 'data-bg-ready': '', 'data-kind': 'ok', hidden: true }),
    ];
  }

  function setIfIdle(el, value) {
    if (document.activeElement === el || FIELDS.some((f) => f in pending && el.dataset.bgField === f)) return;
    if (el.value !== value) el.value = value;
  }
  return {
    update(model) {
      root.hidden = !model;
      if (!model) return;
      const { levelA, levelB, levelC } = model;
      const structure = { ev: model.evidenceSummary, levels: model.levels, a: levelA.stems.map((x) => [x.id, x.legend, x.options]), given: levelA.given, b: [levelB.prompt, levelB.help], c: [levelC.q1.label, levelC.q2.label, levelC.ideasHeading, levelC.ideas] };
      rebuildIf(body, structure, () => build(model));       // nothing a learner types or chooses is part of the structure: focus is never rebuilt away
      for (const input of body.querySelectorAll('input[data-bg-level]')) input.checked = input.value === model.selectedLevel;
      for (const panel of body.querySelectorAll('[data-bg-panel]')) panel.hidden = panel.dataset.bgPanel !== model.selectedLevel;
      for (const stem of levelA.stems) for (const input of body.querySelectorAll(`input[data-q="${stem.id}"]`)) input.checked = input.value === stem.selectedValue;
      const nudge = body.querySelector('[data-bg-nudge]');
      nudge.hidden = !levelA.nudge; put(nudge, levelA.nudge ?? '');
      setIfIdle(body.querySelector('#bg-nb-free'), levelB.value);
      setIfIdle(body.querySelector('#bg-nb-evidence'), levelC.q1.value);
      setIfIdle(body.querySelector('#bg-nb-limit'), levelC.q2.value);
      const ideas = body.querySelector('[data-bg-ideas]');
      ideas.hidden = !levelC.showIdeas;
      const ready = body.querySelector('[data-bg-ready]');
      ready.hidden = !model.readyNote; put(ready, model.readyNote ?? '');
    },
    flush,
    reset() { take(); },
  };
}

// ---- challenges ------------------------------------------------------------------------------------------------------

/**
 * ChallengeCard. Each option is a real button: only an activation (click, Enter, Space) is an answer, so moving focus or
 * the arrow keys never count as a try. Only unlocked steps are drawn; a solved step locks.
 */
export function renderChallenge(root, model, onAnswer) {
  root.hidden = !model;
  if (!model) return;
  const body = root.querySelector('[data-bg-challenge-body]');
  const shown = model.steps.filter((s) => s.unlocked);
  rebuildIf(body, { id: model.id, scenario: model.scenario, steps: shown.map((s) => ({ id: s.id, question: s.question, options: s.options })) }, () => [
    h('p', { class: 'bg-scenario', text: model.scenario }),
    ...shown.map((s) => h('section', { class: 'bg-step-card', 'data-bg-step': s.id },
      h('p', { class: 'bg-step-question', id: `bg-q-${s.id}`, text: s.question }),
      h('div', { class: 'bg-option-list', role: 'group', 'aria-labelledby': `bg-q-${s.id}` }, ...s.options.map((o) => {
        const b = h('button', { type: 'button', class: 'bg-option', 'data-bg-option': o.value, text: o.label });
        b.addEventListener('click', () => onAnswer(s.id, o.value));
        return b;
      })),
      h('p', { class: 'bg-feedback', 'data-bg-step-feedback': s.id, hidden: true }))),
  ]);
  for (const s of shown) {
    const box = body.querySelector(`[data-bg-step="${s.id}"]`);
    box.dataset.attempts = String(s.attempts);
    box.dataset.solved = String(s.correct);
    for (const b of box.querySelectorAll('button[data-bg-option]')) {
      b.disabled = s.correct;
      b.setAttribute('aria-pressed', String(s.choice === b.dataset.bgOption && s.correct));
    }
    const fb = box.querySelector('[data-bg-step-feedback]');
    fb.hidden = !s.feedback;
    fb.dataset.kind = s.feedback?.kind ?? '';
    put(fb, s.feedback?.text ?? '');
  }
}

// ---- completion ------------------------------------------------------------------------------------------------------

export function renderCompletion(root, model) {
  root.hidden = !model;
  if (!model) return;
  rebuildIf(root.querySelector('[data-bg-complete-body]'), model, () => [
    h('p', { class: 'bg-complete-intro', text: model.intro }),
    h('ul', { class: 'bg-claims' }, ...model.claims.map((c) => h('li', {}, h('span', { class: 'bg-tick', 'aria-hidden': 'true', text: '✓' }), ' ', c))),
    model.link ? h('p', { class: 'bg-complete-link' }, h('a', { class: 'bg-link', href: model.link.href, text: model.link.label })) : null,
  ].filter(Boolean));
}
