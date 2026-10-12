// Anonymous usage events for the guided buoyancy lab (Prototype Technical Spec v1.0 §15). Only fixed milestone names leave the
// page, always paired with the lab id: no text, no numbers, no answers, no counts. science-events.js adds the allowlist,
// DNT / GPC / opt-out handling and the transport; this file only names the milestones and hands them to that adapter.
export const LAB_ID = 'buoyancy-guided';
export const ANALYTICS_ACTIONS = Object.freeze(['lab_start', 'trial_recorded', 'compare_complete', 'counterexample_observed', 'notebook_complete', 'challenge_complete', 'lab_complete']);

// Milestones are read from what an accepted action did: the records it wrote and the phases it entered. Restoring saved progress
// dispatches nothing, so it sends nothing; a restart enters only the welcome page, which is not a milestone.
const ON_ENTER = Object.freeze({
  'trial1-test': ['lab_start'],
  'trial3-drop': ['compare_complete'],
  'trial3-observed': ['counterexample_observed'],
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
  for (const phase of Array.isArray(result.transitions) ? result.transitions : []) out.push(...(ON_ENTER[phase] ?? []));
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
