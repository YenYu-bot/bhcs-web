// Cards for the guided buoyancy lab: turns the plain view-models from script.js into DOM.
// It holds no learner wording (headings and column names come in through `text`), makes no decision about the science,
// stores nothing and keeps no state of its own beyond what is on the page. Anything that can hold focus (the compare
// choices) is updated in place instead of rebuilt, so a keyboard user is never thrown off the control they are on.

import { buildComparisonTable } from '../science-guided/components.js';

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

/** The parts of the coach card that belong to this station: the situational tip and the card's key. The card itself is shared. */
export function renderCoachExtras(els, coach, tip) {
  put(els.tip, tip ?? '');
  els.tip.hidden = !tip;
  els.root.dataset.coach = coach.key;
}

// ---- compare ---------------------------------------------------------------------------------------------------------

/** This station's words for the shared comparison table (the CompareCard and the notebook's evidence summary draw the same table). */
export function comparisonOptions(text) {
  return { heads: text.compareHeads, tagLabel: (label, tag) => (tag ? `${label}（${tag}）` : label) };
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
