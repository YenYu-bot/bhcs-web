// Saving and restoring the learner's progress (I6). Pure serialize/restore plus a thin storage wrapper.
// Records are rebuilt from the model on restore (only f, u and what the learner observed are trusted), challenge
// correctness is re-judged, free text is capped, and nothing from the legacy lab's keys is ever read or written.
import { createInitialState, makeRecord, PHASES, START_CANDLE, TARGET_TRIAL2_U, ZONE_IDS } from './engine.js';
import { CHALLENGES, judgeChallenge, challengeProgress, emptyChallenges, notebookReady, sanitizeConclusionFields, TEXT_MAX } from './challenges.js';

export const STORAGE_KEY = 'bhcs-lens-guided:v1';
export const SCHEMA_VERSION = 1;

const isNum = (x) => typeof x === 'number' && Number.isFinite(x);
const RESUMABLE = new Set(PHASES);

/** What is worth keeping. Positions in the middle of a trial, hints and zone tracking are not saved: a trial restarts cleanly. */
export function serialize(state) {
  const rec = (r) => r && { f: r.f, u: r.u, observed: r.observedScreenPosition, zones: r.search?.searchedZones };
  return {
    version: SCHEMA_VERSION, phase: state.phase,
    records: { 1: rec(state.records[1]), 2: rec(state.records[2]), 3: rec(state.records[3]) },
    compare: { ...state.compare }, conclusion: { ...state.conclusion }, challenges: structuredClone(state.challenges),
  };
}

function rebuildRecords(saved) {
  const r = saved?.records;
  if (!r || typeof r !== 'object') return {};
  const out = {};
  const one = (n, prev) => {
    const x = r[n];
    if (!x || !isNum(x.f) || !isNum(x.u) || x.f <= 0 || x.u <= 0) return null;
    if (n < 3 && !isNum(x.observed)) return null;
    const zones = n === 3 && Array.isArray(x.zones) ? ZONE_IDS.filter((z) => x.zones.includes(z)) : [];
    const rec = makeRecord({ trial: n, f: x.f, u: x.u, observed: n < 3 ? x.observed : null, screen: 30, prev, zones });
    // a real record 1/2 was written at a sharp position; anything else is not our data
    return n < 3 && rec.clarity !== 1 ? null : rec;
  };
  out[1] = one(1, null);
  out[2] = out[1] ? one(2, out[1]) : null;
  out[3] = out[2] ? one(3, out[2]) : null;
  return out;
}

function cleanChallenges(saved) {
  const out = emptyChallenges();
  for (const def of CHALLENGES) {
    const src = saved?.[def.id];
    for (const step of def.steps) {
      const a = src?.steps?.[step.id];
      if (!a) continue;
      const correct = judgeChallenge(def.id, step.id, a.choice);
      if (correct === null) continue;
      out[def.id].steps[step.id] = { choice: a.choice, correct, attempts: Number.isInteger(a.attempts) ? Math.min(99, Math.max(1, a.attempts)) : 1 };
    }
    if (def.id === 3 && typeof src?.note === 'string') out[3].note = src.note.slice(0, TEXT_MAX);
  }
  return out;
}

/** saved → a valid engine state at a sensible resume point, or null when there is nothing worth resuming. */
export function restore(saved) {
  if (!saved || typeof saved !== 'object' || saved.version !== SCHEMA_VERSION || !RESUMABLE.has(saved.phase)) return null;
  const records = rebuildRecords(saved);
  if (!records[1]) return null;                                    // nothing recorded yet: start from the welcome screen
  const st = createInitialState();
  st.records = { 1: records[1], 2: records[2] ?? null, 3: records[3] ?? null };
  const answered = (q, allowed) => (typeof saved.compare?.[q] === 'string' && allowed.includes(saved.compare[q]) ? saved.compare[q] : null);
  st.compare = { position: answered('position', ['closer', 'farther', 'same']), size: answered('size', ['smaller', 'larger', 'same']) };
  // field by field: one damaged field must not cost the learner the others
  for (const [k, v] of Object.entries(saved.conclusion ?? {})) {
    if (Object.hasOwn(st.conclusion, k)) Object.assign(st.conclusion, sanitizeConclusionFields({ [k]: v }) ?? {});
  }
  st.challenges = cleanChallenges(saved.challenges);
  if (records[3]) st.search = { zones: [...records[3].search.searchedZones], ctaUnlocked: true };

  const at = (phase, u, s) => { st.phase = phase; st.u = u; st.s = s; return st; };
  const P = saved.phase, idx = PHASES.indexOf(P);
  if (!records[2]) return at('trial2-move-object', START_CANDLE, records[1].observedScreenPosition);
  if (!records[3]) {
    return idx >= PHASES.indexOf('trial3-move-object') ? at('trial3-move-object', TARGET_TRIAL2_U, records[2].observedScreenPosition)
      : at('compare', TARGET_TRIAL2_U, records[2].observedScreenPosition);
  }
  const u3 = records[3].u, s3 = records[2].observedScreenPosition;
  if (idx < PHASES.indexOf('concept')) return at('trial3-no-real-screen-image', u3, s3);
  if (P === 'concept' || P === 'notebook' || !notebookReady(st.conclusion)) return at(P === 'concept' ? 'concept' : 'notebook', u3, s3);
  const firstOpen = [1, 2, 3].find((id) => !challengeProgress(id, st.challenges[id]).allCorrect);
  if (firstOpen === undefined) return at('complete', u3, s3);
  const want = P === 'complete' ? 99 : Number(P.slice(-1));
  return at(`challenge-${Math.min(firstOpen, want)}`, u3, s3);
}

/** Thin wrapper: every storage call is guarded, so a blocked or full storage never breaks the lab. */
export function createStore({ storage, key = STORAGE_KEY } = {}) {
  let last = null, failed = false;
  return {
    get failed() { return failed; },
    load() {
      try { const raw = storage?.getItem(key); if (!raw) return null; last = raw; return JSON.parse(raw); } catch (_) { return null; }
    },
    save(state) {
      let raw;
      try { raw = JSON.stringify(serialize(state)); } catch (_) { return false; }
      if (raw === last) return true;
      try { storage.setItem(key, raw); last = raw; failed = false; return true; } catch (_) { failed = true; return false; }
    },
    clear() { last = null; try { storage?.removeItem(key); return true; } catch (_) { return false; } },
  };
}
