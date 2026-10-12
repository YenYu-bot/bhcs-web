// Anonymous usage events for the guided optics lab (I7). Only fixed action names leave the page, always paired with the
// lab id: no text, no numbers, no answers. science-events.js adds the allowlist, DNT / GPC / opt-out handling and GA.
export const LAB_ID = 'optics-guided';
export const ANALYTICS_ACTIONS = Object.freeze(['lab_start', 'trial_recorded', 'compare_complete', 'virtual_observed', 'notebook_complete', 'challenge_complete', 'lab_complete']);

// Milestones are read from the phases an accepted action entered (restoring saved progress dispatches nothing, so it sends nothing).
const ON_ENTER = {
  'trial1-find-screen': ['lab_start'],
  'trial3-move-object': ['compare_complete'],
  'trial3-view-through-lens': ['virtual_observed'],
  'challenge-1': ['notebook_complete'],
  'challenge-2': ['challenge_complete'],
  'challenge-3': ['challenge_complete'],
  complete: ['challenge_complete', 'lab_complete'],
};

/** result = engine reduce() result → list of action names (a subset of ANALYTICS_ACTIONS). */
export function analyticsFor(result) {
  if (!result?.accepted) return [];
  const out = [];
  for (const e of result.events ?? []) if (e.type === 'record-written') out.push('trial_recorded');
  for (const phase of result.transitions ?? []) out.push(...(ON_ENTER[phase] ?? []));
  return out;
}

/** Sends names through window.bhcsScienceTrack(action, labId) when it exists; never throws. */
export function createTracker(win = globalThis.window) {
  return (names) => {
    for (const name of names) {
      if (!ANALYTICS_ACTIONS.includes(name)) continue;
      try { win?.bhcsScienceTrack?.(name, LAB_ID); } catch (_) { /* analytics must never break the lab */ }
    }
  };
}
