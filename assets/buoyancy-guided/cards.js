// What is left of this station's own card code: the coach's situational tip and this station's words for the shared
// comparison table. Every card itself (steps, coach, status, data, evidence, compare, concept, notebook, challenge,
// completion) is drawn by ../science-guided/components.js.

const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };
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
