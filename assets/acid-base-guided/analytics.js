// Anonymous usage events for the guided unknown-liquid lab (Pilot #4, B4). Only fixed milestone names leave the page, always
// paired with the lab id: no text, no sample letters, no answers, no counts. science-events.js adds the allowlist, DNT / GPC /
// opt-out handling and the transport; this file only names the milestones and hands them to that adapter. It is the only
// station module that touches the adapter.
export const LAB_ID = 'acid-base-guided';
export const ANALYTICS_ACTIONS = Object.freeze(['lab_start', 'trial_recorded', 'compare_complete', 'notebook_complete', 'challenge_complete', 'lab_complete']);

// Milestones are read from what an accepted action did: the records it wrote and the phases it entered. Revealing pH, writing
// in the notebook, answering a challenge or writing the optional note send nothing. Restoring saved progress dispatches
// nothing, so it sends nothing. Compare 1 is finished by entering Trial 2, Compare 2 by entering the concept.
const ON_ENTER = Object.freeze({
  trial1: Object.freeze(['lab_start']),
  trial2: Object.freeze(['compare_complete']),
  concept: Object.freeze(['compare_complete']),
  'challenge-1': Object.freeze(['notebook_complete']),
  'challenge-2': Object.freeze(['challenge_complete']),
  'challenge-3': Object.freeze(['challenge_complete']),
  complete: Object.freeze(['challenge_complete', 'lab_complete']),
});

/** result = engine reduce() result → list of action names (a subset of ANALYTICS_ACTIONS). */
export function analyticsFor(result) {
  if (result?.accepted !== true) return [];
  const out = [];
  for (const e of Array.isArray(result.events) ? result.events : []) if (e?.type === 'record-written') out.push('trial_recorded');
  for (const t of Array.isArray(result.transitions) ? result.transitions : []) {
    const to = t?.to;
    if (typeof to === 'string' && Object.hasOwn(ON_ENTER, to)) out.push(...ON_ENTER[to]);
  }
  return out;
}

/** Sends names through window.bhcsScienceTrack(action, labId) when it exists; unknown names are dropped; never throws. */
export function createTracker(win = globalThis.window) {
  return (names) => {
    for (const name of Array.isArray(names) ? names : []) {
      if (!ANALYTICS_ACTIONS.includes(name)) continue;
      try {
        const send = win?.bhcsScienceTrack;
        if (typeof send === 'function') send(name, LAB_ID);
      } catch (_) { /* analytics must never break the lab */ }
    }
  };
}
