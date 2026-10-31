import { validateSnapshot } from './model.mjs';

export const STORAGE_KEY = 'bhcs.inclineDesk.v1';
export const STORAGE_LOCK = 'bhcs.inclineDesk.storage';

function freezeTree(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeTree);
    Object.freeze(value);
  }
  return value;
}

/** Single-key optimistic storage. No automatic retries: visibility recovery requires retry(). */
export function createStorageDriver(options = {}) {
  const validate = options.validate || validateSnapshot;
  const visible = options.visible || (() => typeof document === 'undefined' || document.visibilityState === 'visible');
  let storage, locks;
  let initialized = false, generation = 0, pending = null;
  const operations = new Map();
  let state = { status: 'empty', reason: null, protected: false, readable: false, raw: null, snapshot: null };
  const getState = () => Object.freeze({ ...state, pending: !!pending, pendingOperationId: pending?.id ?? null, pendingSnapshot: pending?.snapshot ?? null });
  const notify = () => { try { options.onChange?.(getState()); } catch {} return getState(); };
  const protect = (reason, conflict = false) => {
    state = { ...state, status: conflict ? 'conflict' : 'protected', protected: true, reason };
    generation++;
    if (conflict) { try { options.onConflict?.(reason); } catch {} }
  };
  function load() {
    if (initialized) return getState();
    initialized = true;
    try {
      storage = 'storage' in options ? options.storage : globalThis.localStorage;
      locks = 'locks' in options ? options.locks : globalThis.navigator?.locks;
      const raw = storage.getItem(STORAGE_KEY);
      state = { ...state, raw, readable: true };
      if (raw !== null) {
        const result = validate(JSON.parse(raw));
        if (!result.ok) throw new Error(result.error || 'invalid-snapshot');
        state = { ...state, status: 'saved', snapshot: result.snapshot };
      }
    } catch (error) { protect(state.readable ? 'invalid-data' : 'read-error'); }
    return notify();
  }
  const markPending = reason => {
    state = { ...state, status: state.protected ? state.status : 'pending', reason };
  };
  function prepare(snapshot, id, kind) {
    load();
    if (typeof id !== 'string' || !id) throw new TypeError('operationId required');
    const checked = validate(snapshot);
    if (!checked.ok) throw new TypeError(checked.error || 'Invalid snapshot');
    // Serialize immediately: caller edits must not alter an already pending operation.
    const raw = JSON.stringify(checked.snapshot);
    const previous = operations.get(id);
    if (previous) {
      if (previous.raw !== raw || previous.kind !== kind) throw new TypeError('operationId reused with different data');
      return { op: previous, duplicate: true };
    }
    const op = { id, kind, raw, snapshot: freezeTree(JSON.parse(raw)), token: ++generation, promise: null };
    operations.set(id, op);
    pending = op;
    return { op, duplicate: false };
  }
  async function attempt(op) {
    if (op !== pending || op.token !== generation) return getState();
    if (state.status === 'conflict' || (state.protected && op.kind !== 'clear')) return notify();
    if (!state.readable) { protect('unreadable-snapshot'); return notify(); }
    if (!visible()) { markPending('hidden'); return notify(); }
    if (!locks || typeof locks.request !== 'function') { markPending('locks-unavailable'); return notify(); }
    try {
      await locks.request(STORAGE_LOCK, { mode: 'exclusive', ifAvailable: true }, lock => {
        // Deliberately synchronous: do not await or hold a lock across user interaction.
        if (op !== pending || op.token !== generation) return;
        if (!lock) { markPending('lock-unavailable'); return; }
        if (!visible()) { markPending('hidden'); return; }
        if (state.status === 'conflict' || (state.protected && op.kind !== 'clear')) return;
        let current;
        try { current = storage.getItem(STORAGE_KEY); }
        catch { protect('read-error'); return; }
        if (current !== state.raw) { protect('storage-conflict', true); return; }
        if (op !== pending || op.token !== generation || !visible()) { markPending('hidden-or-invalidated'); return; }
        try { storage.setItem(STORAGE_KEY, op.raw); }
        catch { markPending('write-error'); return; }
        state = { status: 'saved', reason: null, protected: false, readable: true, raw: op.raw, snapshot: op.snapshot };
        pending = null;
      });
    } catch { if (op === pending && op.token === generation) markPending('lock-error'); }
    return notify();
  }
  function launch(op) {
    if (op.promise) return op.promise;
    op.promise = attempt(op).finally(() => { op.promise = null; });
    return op.promise;
  }
  function save(snapshot, operationId) {
    const { op, duplicate } = prepare(snapshot, operationId, 'save');
    if (duplicate) return op.promise || Promise.resolve(getState());
    markPending(state.protected ? state.reason : 'unsaved');
    return launch(op);
  }
  function retry() {
    if (!pending) return Promise.resolve(getState());
    // An invalidated op (reset/conflict/read failure) never resumes implicitly.
    if (pending.token !== generation) return Promise.resolve(getState());
    return launch(pending);
  }
  function clear(snapshot, { confirmed = false, acknowledged = false, operationId } = {}) {
    if (!confirmed || !acknowledged) return Promise.resolve(getState());
    load();
    const checked = validate(snapshot);
    if (!checked.ok || checked.snapshot.records.length || checked.snapshot.pair || checked.snapshot.answers) throw new TypeError('Clear requires a valid empty snapshot');
    if (!state.readable || state.status === 'conflict') return Promise.resolve(getState());
    const { op, duplicate } = prepare(snapshot, operationId, 'clear');
    if (duplicate) return op.promise || Promise.resolve(getState());
    markPending('clear-pending');
    return launch(op);
  }
  function invalidatePending() { generation++; pending = null; return notify(); }
  function handleStorageEvent(event) {
    if (event.key !== STORAGE_KEY && event.key !== null) return getState();
    if (event.storageArea && storage && event.storageArea !== storage) return getState();
    load();
    protect('storage-conflict', true);
    return notify();
  }
  return Object.freeze({ load, save, retry, clear, invalidatePending, handleStorageEvent, getState });
}
