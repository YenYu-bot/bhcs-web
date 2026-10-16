// Anonymous milestones for Science Lab 2.0 Pilot #5 B4.
// No trial values, conditions, choices or learner text are sent. The page adapter is the only caller.
export const LAB_ID = 'photosynthesis-factor-guided';
export const ANALYTICS_ACTIONS = Object.freeze([
  'lab_start',
  'trial_recorded',
  'compare_complete',
  'notebook_complete',
  'challenge_complete',
  'lab_complete',
]);

const ON_ENTER = Object.freeze({
  'trial1-low-light': Object.freeze(['lab_start']),
  'trial2-setup': Object.freeze(['compare_complete']),
  inference: Object.freeze(['compare_complete']),
  'challenge-1': Object.freeze(['notebook_complete']),
  'challenge-2': Object.freeze(['challenge_complete']),
  'challenge-3': Object.freeze(['challenge_complete']),
  complete: Object.freeze(['challenge_complete', 'lab_complete']),
});

export function analyticsFor(result) {
  if (result?.accepted !== true) return [];
  const out = [];
  for (const e of Array.isArray(result.events) ? result.events : []) {
    if (e?.type === 'record-written') out.push('trial_recorded');
  }
  for (const t of Array.isArray(result.transitions) ? result.transitions : []) {
    const to = t?.to;
    if (typeof to === 'string' && Object.hasOwn(ON_ENTER, to)) out.push(...ON_ENTER[to]);
  }
  return out;
}

export function createTracker(win = globalThis.window) {
  return (names) => {
    for (const name of Array.isArray(names) ? names : []) {
      if (!ANALYTICS_ACTIONS.includes(name)) continue;
      try {
        const send = win?.bhcsScienceTrack;
        if (typeof send === 'function') send(name, LAB_ID);
      } catch (_) {
        // analytics must never break the lab
      }
    }
  };
}
