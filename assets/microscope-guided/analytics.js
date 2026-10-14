// Anonymous usage events for the guided microscope lab. Only fixed milestone names leave the page, always paired with the lab
// id: no text, no numbers, no answers, no counts. science-events.js adds the allowlist, DNT / GPC / opt-out handling and the
// transport; this file only names the milestones and hands them to that adapter.
export const LAB_ID = 'microscope-guided';
export const ANALYTICS_ACTIONS = Object.freeze(['lab_start', 'trial_recorded', 'compare_complete', 'notebook_complete', 'challenge_complete', 'lab_complete']);

// Milestones are read from what an accepted action did: the records it wrote and the phases it entered. Restoring saved progress
// dispatches nothing, so it sends nothing. Compare 1 is finished by entering Trial 2, Compare 2 by entering the concept.
const ON_ENTER = Object.freeze({
  'trial1-horizontal': ['lab_start'],
  'trial2-low': ['compare_complete'],
  concept: ['compare_complete'],
  'challenge-1': ['notebook_complete'],
  'challenge-2': ['challenge_complete'],
  'challenge-3': ['challenge_complete'],
  complete: ['challenge_complete', 'lab_complete'],
});

/** result = engine reduce() result → list of action names (a subset of ANALYTICS_ACTIONS). */
export function analyticsFor(result) {
  if (result?.accepted !== true) return [];
  const out = [];
  for (const e of Array.isArray(result.events) ? result.events : []) if (e?.type === 'record-written') out.push('trial_recorded');
  for (const t of Array.isArray(result.transitions) ? result.transitions : []) out.push(...(ON_ENTER[typeof t === 'string' ? t : t?.to] ?? []));
  return out;
}

/** Sends names through window.bhcsScienceTrack(action, labId) when it exists; never throws. */
export function createTracker(win = globalThis.window) {
  return (names) => {
    for (const name of Array.isArray(names) ? names : []) {
      if (!ANALYTICS_ACTIONS.includes(name)) continue;
      try { win?.bhcsScienceTrack?.(name, LAB_ID); } catch (_) { /* analytics must never break the lab */ }
    }
  };
}
