import {INITIAL, STEPS, isValidState} from './model.mjs';

const copyState = ({temperature, water, solute}) => ({temperature, water, solute});
const defaults = () => ({version: 1, state: copyState(INITIAL), step: 0, mode: 'guided', records: []});
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validState = value => object(value) && isValidState(value);
const sameState = (a, b) => ['temperature', 'water', 'solute'].every(key => a[key] === b[key]);

/**
 * Decode one storage value without changing storage. Always returns a usable,
 * detached {snapshot, status, writable}. Only empty and intact v1 data are
 * writable. Partial recovery must never replace the original stored bytes.
 * Status: empty | ok | partial | invalid | future.
 */
export function decodeStored(raw) {
  const snapshot = defaults();
  if (raw === null || raw === '') return {snapshot, status: 'empty', writable: true};
  if (typeof raw !== 'string') return {snapshot, status: 'invalid', writable: false};
  let saved;
  try { saved = JSON.parse(raw); }
  catch { return {snapshot, status: 'invalid', writable: false}; }
  if (!object(saved)) return {snapshot, status: 'invalid', writable: false};
  if (saved.version !== 1) return {snapshot, status: Object.hasOwn(saved, 'version') ? 'future' : 'invalid', writable: false};

  let partial = Object.keys(saved).some(key => !['version','state','step','mode','records'].includes(key));
  if (object(saved.state) && Object.keys(saved.state).some(key => !['temperature','water','solute'].includes(key))) partial = true;
  if (validState(saved.state)) snapshot.state = copyState(saved.state);
  else partial = true;
  if (Number.isInteger(saved.step) && saved.step >= 0 && saved.step < STEPS.length) snapshot.step = saved.step;
  else partial = true;
  if (saved.mode === 'guided' || saved.mode === 'free') snapshot.mode = saved.mode;
  else { snapshot.mode = 'free'; partial = true; }
  if (snapshot.mode === 'guided' && !sameState(snapshot.state, STEPS[snapshot.step])) {
    snapshot.mode = 'free';
    partial = true;
  }
  if (Array.isArray(saved.records)) {
    for (const record of saved.records) {
      if (!object(record) || !validState(record.state)) { partial = true; continue; }
      if (Object.keys(record).some(key => !['state','number'].includes(key)) || Object.keys(record.state).some(key => !['temperature','water','solute'].includes(key))) partial = true;
      const validNumber = Number.isSafeInteger(record.number) && record.number > 0;
      if (!validNumber) partial = true;
      snapshot.records.push({state: copyState(record.state), number: validNumber ? record.number : snapshot.records.length + 1});
    }
  } else partial = true;
  return {snapshot, status: partial ? 'partial' : 'ok', writable: !partial};
}

/** Read exactly key, never legacy/other keys. A denied read is not empty data. */
export function readStored(storage, key) {
  let raw;
  try { raw = storage.getItem(key); }
  catch { return {snapshot: defaults(), status: 'unavailable', writable: false, raw: null}; }
  return {...decodeStored(raw), raw};
}

/**
 * Best-effort optimistic write. The exact previously read raw value is required;
 * changed or protected data is never overwritten. LocalStorage has no atomic
 * compare-and-swap, so callers should also respond to storage events.
 * Returns {ok, status, raw}; raw is the observed original on failures, or the
 * exact new bytes on success. Status: ok | conflict | unavailable | write_failed
 * | invalid | partial | future. Invalid proposed snapshots are rejected too.
 */
export function writeStored(storage, key, snapshot, expectedRaw) {
  let raw;
  try { raw = storage.getItem(key); }
  catch { return {ok: false, status: 'unavailable', raw: null}; }
  if (raw !== expectedRaw) return {ok: false, status: 'conflict', raw};
  const existing = decodeStored(raw);
  if (!existing.writable) return {ok: false, status: existing.status, raw};
  let next;
  try { next = JSON.stringify(snapshot); }
  catch { return {ok: false, status: 'invalid', raw}; }
  const decoded = decodeStored(next);
  if (decoded.status !== 'ok') return {ok: false, status: decoded.status === 'empty' ? 'invalid' : decoded.status, raw};
  next = JSON.stringify(decoded.snapshot);
  try { storage.setItem(key, next); }
  catch { return {ok: false, status: 'write_failed', raw}; }
  return {ok: true, status: 'ok', raw: next};
}
