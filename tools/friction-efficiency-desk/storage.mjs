import { validateSnapshot } from './model.mjs';

export const STORAGE_KEY = 'bhcs.frictionEfficiencyDesk.v1';
export const LOCK_NAME = `${STORAGE_KEY}:write`;

// The engine owns the in-memory evidence. This adapter never edits it and never
// treats a failed native write as durable success. All writers share this lock.
export function createStorageDriver(options = {}) {
  let storage, locks;
  try { storage = Object.hasOwn(options, 'storage') ? options.storage : globalThis.localStorage; } catch {}
  try { locks = Object.hasOwn(options, 'locks') ? options.locks : globalThis.navigator?.locks; } catch {}
  const validate = options.validate ?? validateSnapshot;
  const onStatus = options.onStatus ?? (() => {});
  const hasLocks = !!locks && typeof locks.request === 'function';
  let initialized = false, observed = false, quarantined = false, baseline = null, restored = null;
  let status = 'normal', detail = '', pending = 0, resetPending = false;
  let epoch = 0, queue = Promise.resolve();

  function announce(next, message) {
    status = next; detail = message;
    // A rendering callback must not turn a successful write into an apparent
    // storage failure or stop the native lock callback from completing.
    try { onStatus({ status, detail, busy: pending > 0 }); } catch {}
  }
  function result(ok, deviceSaved = false, localOnly = false, error = undefined) {
    return { ok, deviceSaved, localOnly, status, ...(error ? { error } : {}) };
  }
  function read() {
    if (initialized) return { snapshot: restored, status };
    initialized = true;
    try {
      if (!storage || typeof storage.getItem !== 'function') throw Error('無法使用此裝置儲存空間');
      baseline = storage.getItem(STORAGE_KEY);
      if (baseline !== null && typeof baseline !== 'string') throw Error('儲存介面回傳非文字內容');
      observed = true;
    } catch {
      announce('memory-only', '無法讀取此裝置資料；本頁可繼續，但不能確認或清除原有資料。請匯出本頁資料。');
      return { snapshot: null, status };
    }
    if (baseline !== null) {
      try {
        const checked = validate(JSON.parse(baseline));
        if (!checked?.ok) throw Error(checked?.error ?? '無效資料');
        restored = checked.snapshot;
      } catch {
        quarantined = true;
        announce('quarantined', '原有資料格式或版本不支援，已保留原文且停止寫入。請先備份，再由重置流程處理。');
        return { snapshot: null, status };
      }
    }
    if (!hasLocks) announce('memory-only', '此瀏覽器未提供安全跨分頁儲存鎖；僅在本頁操作，請匯出保存。');
    else announce('normal', baseline === null ? '尚無此裝置紀錄。' : '已讀取此裝置紀錄。');
    return { snapshot: restored, status };
  }
  function conflict() {
    announce('conflict', '其他分頁已改動本站資料；本頁停止寫入。請匯出本頁資料，再重新整理。');
    return result(false, false, false, 'conflict');
  }
  function sameStoredRaw() {
    const now = storage.getItem(STORAGE_KEY);
    if (now !== baseline) return false;
    return true;
  }
  function schedule(action) {
    pending += 1;
    const run = queue.then(action, action);
    queue = run.catch(() => {});
    return run.finally(() => { pending -= 1; });
  }
  async function locked(action) {
    try {
      return await locks.request(LOCK_NAME, { mode: 'exclusive' }, action);
    } catch {
      announce(quarantined ? 'quarantined' : status === 'conflict' ? 'conflict' : 'memory-only', '儲存鎖或裝置寫入失敗；本頁資料仍在。請匯出或重試儲存。');
      return result(false, false, false, 'storage-unavailable');
    }
  }
  function write(snapshot) {
    read();
    if (resetPending) return Promise.resolve(result(false, false, false, 'reset-pending'));
    if (status === 'conflict' || quarantined) return Promise.resolve(result(false, false, false, status));
    if (!observed || !hasLocks) return Promise.resolve(result(false, false, false, 'memory-only'));
    let serialized, validated;
    try {
      const checked = validate(snapshot);
      if (!checked?.ok) throw Error(checked?.error ?? 'Invalid snapshot');
      // Capture now, not when the asynchronous lock eventually becomes ours.
      serialized = JSON.stringify(checked.snapshot);
      if (typeof serialized !== 'string') throw Error('Not serializable');
      validated = JSON.parse(serialized);
    } catch {
      return Promise.resolve(result(false, false, false, 'invalid-snapshot'));
    }
    const operationEpoch = epoch;
    return schedule(() => {
      if (operationEpoch !== epoch) return result(false, false, false, 'superseded-by-reset');
      return locked(() => {
        if (operationEpoch !== epoch) return result(false, false, false, 'superseded-by-reset');
        if (status === 'conflict') return result(false, false, false, 'conflict');
        if (!sameStoredRaw()) return conflict();
        if (serialized !== baseline) storage.setItem(STORAGE_KEY, serialized);
        baseline = serialized; observed = true; restored = validated;
        announce('normal', '已存此裝置。');
        return result(true, true);
      });
    });
  }
  function clear() {
    read();
    if (resetPending) return Promise.resolve(result(false, false, false, 'reset-pending'));
    if (status === 'conflict') return Promise.resolve(result(false, false, false, 'conflict'));
    if (!observed) return Promise.resolve(result(false, false, false, 'unreadable-existing-data'));
    if (!hasLocks) {
      // An observed absent key can permit a clearly labelled local reset only.
      // Recheck even here: another page may have created a persistent record.
      try {
        if (!sameStoredRaw()) return Promise.resolve(conflict());
      } catch { return Promise.resolve(result(false, false, false, 'unreadable-existing-data')); }
      if (baseline !== null) return Promise.resolve(result(false, false, false, 'existing-data-needs-lock'));
      restored = null;
      announce('memory-only', '已清除本頁暫存；此瀏覽器仍未啟用持久化儲存。');
      return Promise.resolve(result(true, false, true));
    }
    resetPending = true;
    epoch += 1; // Invalidate every queued pre-reset snapshot before awaiting.
    return schedule(() => locked(() => {
      if (status === 'conflict') return result(false, false, false, 'conflict');
      if (!sameStoredRaw()) return conflict();
      storage.removeItem(STORAGE_KEY);
      baseline = null; restored = null; observed = true; quarantined = false;
      announce('normal', '已清除本站儲存資料，可以開始新實驗。');
      return result(true, true);
    })).finally(() => { resetPending = false; });
  }
  function handleExternalChange(event) {
    if (!initialized || !event || (event.key !== STORAGE_KEY && event.key !== null)) return false;
    if (event.storageArea && event.storageArea !== storage) return false;
    if (event.key === STORAGE_KEY && event.newValue === baseline) return false;
    conflict();
    return true;
  }
  return Object.freeze({
    read, write, clear, handleExternalChange,
    get status() { return status; },
    get detail() { return detail; },
    get raw() { return observed ? baseline : null; },
    get canBackupRaw() { return observed && baseline !== null; },
    get busy() { return pending > 0; },
  });
}
