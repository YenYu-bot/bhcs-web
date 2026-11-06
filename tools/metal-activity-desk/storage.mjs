/**
 * Replace a session only if its saved snapshot still matches the caller's read.
 * The caller must own the session Web Lock: localStorage has no atomic CAS.
 * setItem is atomic on failure, so legacy backups are not touched unless the
 * fresh current snapshot was saved successfully. A failed legacy cleanup is
 * reported separately; the current snapshot still prevents legacy resurrection.
 */
export function resetSavedSession(storage, nextState, {
  currentKey, legacyKeys = [], expectedRaw,
} = {}) {
  let raw;
  try {
    if (typeof currentKey !== 'string' || !Array.isArray(legacyKeys)
      || legacyKeys.some(key => typeof key !== 'string')) {
      return { ok: false, reason: 'unavailable' };
    }
    raw = JSON.stringify(nextState);
    if (typeof raw !== 'string') return { ok: false, reason: 'unavailable' };
    // Serialize first, then compare immediately before writing. Even a toJSON
    // callback must not make an earlier comparison stale within this operation.
    if (storage.getItem(currentKey) !== expectedRaw) {
      return { ok: false, reason: 'changed' };
    }
    storage.setItem(currentKey, raw);
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  let legacyCleared = true;
  for (const key of new Set(legacyKeys)) {
    if (key === currentKey) continue;
    try { storage.removeItem(key); } catch { legacyCleared = false; }
  }
  return { ok: true, legacyCleared, raw };
}
