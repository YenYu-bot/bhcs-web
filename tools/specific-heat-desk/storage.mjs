// Browser-local persistence only. The owning UI supplies the course validator.
export const STORAGE_KEY = 'bhcs.specificHeatDesk.v1';
export const MAX_BYTES = 128 * 1024;
const FORMAT = 'bhcs.specificHeatDesk.storage';
const bytes = value => new TextEncoder().encode(value).byteLength;
const clone = value => JSON.parse(JSON.stringify(value));
export function createStorageDriver(options = {}) {
  let storage = options.storage, locks = options.locks;
  try { if (!Object.hasOwn(options, 'storage')) storage = globalThis.localStorage; } catch (_) { storage = null; }
  try { if (!Object.hasOwn(options, 'locks')) locks = globalThis.navigator?.locks; } catch (_) { locks = null; }
  const validate = options.validate || (value => value && typeof value === 'object' && !Array.isArray(value));
  const onStatus = options.onStatus || (() => {});
  let expectedRaw = null, protectedRaw = null, revision = 0, loaded = false;
  let mode = 'unloaded', message = '尚未讀取本機紀錄。', pending = 0, savedFingerprint = null;
  let blocked = null;
  let epoch = 0, resetting = false, queue = Promise.resolve(), loadedPayload = null;
  const writable = () => storage && locks && typeof locks.request === 'function';
  const status = () => Object.freeze({ mode, message, pending, revision, savedFingerprint, protection: blocked });
  function emit(nextMode = mode, text = message) {
    mode = nextMode; message = text;
    if (['quarantined', 'conflict', 'read-error'].includes(nextMode)) blocked = nextMode;
    try { onStatus(status()); } catch (_) { /* Rendering must not corrupt persistence. */ }
  }
  function result(ok, extra = {}) { return { ok, mode, revision, ...extra }; }
  function normalize(value) {
    const copied = clone(value), checked = validate(copied);
    if (checked === false || checked == null) throw new Error('invalid-payload');
    return clone(checked === true ? copied : checked);
  }
  function parse(raw) {
    if (bytes(raw) > MAX_BYTES) throw new Error('oversize');
    const envelope = JSON.parse(raw);
    if (!envelope || envelope.format !== FORMAT || envelope.version !== 1 ||
        !Number.isSafeInteger(envelope.revision) || envelope.revision < 1 ||
        !Object.hasOwn(envelope, 'payload')) throw new Error('unsupported-envelope');
    return { revision: envelope.revision, payload: normalize(envelope.payload) };
  }
  function conflict(raw) {
    protectedRaw = raw; savedFingerprint = null;
    emit('conflict', '其他分頁已變更本站紀錄；已停止覆寫。請先匯出本頁與原始資料，再重新載入。');
    return result(false, { reason: 'conflict' });
  }
  async function load() {
    if (loaded) return result(!blocked, { payload: clone(loadedPayload), ...(blocked ? { reason: blocked } : {}) });
    return (async () => {
      loaded = true;
      let raw;
      try { if (!storage) throw new Error('unavailable'); raw = storage.getItem(STORAGE_KEY); }
      catch (_) { emit('read-error', '無法讀取本機紀錄。本頁內容仍可匯出；不會覆寫未讀取的資料。'); return result(false, { payload: null, reason: 'read-error' }); }
      expectedRaw = raw; protectedRaw = raw;
      if (raw !== null) {
        try { const parsed = parse(raw); revision = parsed.revision; loadedPayload = parsed.payload; savedFingerprint = JSON.stringify(parsed.payload); }
        catch (_) { emit('quarantined', '原始資料損壞或版本不支援，已保護原文；請先下載原始資料備份。'); return result(false, { payload: null, reason: 'quarantined' }); }
      }
      if (!writable()) emit('memory-only', '此瀏覽器無安全儲存鎖；僅在本頁操作，請匯出備份，不會覆寫裝置紀錄。');
      else emit('ready', raw === null ? '尚無裝置紀錄；收下後會嘗試保存。' : '已讀取裝置紀錄。');
      return result(true, { payload: clone(loadedPayload) });
    })();
  }
  function schedule(operation) {
    pending++; emit();
    const job = queue.then(operation, operation);
    queue = job.catch(() => {});
    return job.finally(() => { pending--; emit(); });
  }
  async function locked(operation) {
    if (!writable()) { emit('memory-only', '無法安全寫入裝置；資料保留在本頁，請匯出備份。'); return result(false, { reason: 'memory-only' }); }
    let entered = false;
    try {
      return await locks.request(STORAGE_KEY + ':lock', { mode: 'exclusive' }, async () => { entered = true; return operation(); });
    } catch (_) {
      // No callback means lock acquisition failed; never fall back to unlocked writes.
      emit(entered ? 'write-error' : 'memory-only', entered ? '裝置寫入未完成，請保留本頁並匯出或重試。' : '安全儲存鎖不可用；只保留本頁資料，請匯出備份。');
      return result(false, { reason: entered ? 'write-error' : 'lock-error' });
    }
  }
  function save(snapshot) {
    let payload, fingerprint;
    try { payload = normalize(snapshot); fingerprint = JSON.stringify(payload); if (bytes(fingerprint) > MAX_BYTES) throw new Error('oversize'); }
    catch (_) { return Promise.resolve(result(false, { reason: 'invalid-payload' })); }
    const requestedEpoch = epoch;
    if (resetting) return Promise.resolve(result(false, { reason: 'reset-pending', fingerprint }));
    return schedule(async () => {
      await load();
      if (requestedEpoch !== epoch) return result(false, { reason: 'superseded', fingerprint });
      if (blocked) return result(false, { reason: blocked, fingerprint });
      return locked(() => {
        if (blocked) return result(false, { reason: blocked, fingerprint });
        if (requestedEpoch !== epoch) return result(false, { reason: 'superseded', fingerprint });
        let raw;
        try { raw = storage.getItem(STORAGE_KEY); } catch (_) { emit('read-error', '寫入前讀取失敗，未覆寫裝置資料。請匯出本頁內容。'); return result(false, { reason: 'read-error', fingerprint }); }
        if (raw !== expectedRaw) return { ...conflict(raw), fingerprint };
        if (fingerprint === savedFingerprint && raw !== null) { emit('saved', '這份紀錄已存於此裝置。'); return result(true, { fingerprint }); }
        const nextRevision = revision + 1;
        const encoded = JSON.stringify({ format: FORMAT, version: 1, revision: nextRevision, payload });
        if (!Number.isSafeInteger(nextRevision) || bytes(encoded) > MAX_BYTES) { emit('write-error', '紀錄超過儲存容量，請先匯出再整理證據卡。'); return result(false, { reason: 'capacity', fingerprint }); }
        try { storage.setItem(STORAGE_KEY, encoded); }
        catch (_) { emit('write-error', '裝置保存失敗；本頁資料仍在，請匯出備份或重試。'); return result(false, { reason: 'write-error', fingerprint }); }
        expectedRaw = encoded; protectedRaw = encoded; revision = nextRevision; savedFingerprint = fingerprint;
        loadedPayload = clone(payload); emit('saved', '這份紀錄已存於此裝置。');
        return result(true, { fingerprint });
      });
    });
  }
  function clear() {
    if (resetting) return Promise.resolve(result(false, { reason: 'reset-pending' }));
    // Invalidate every older queued save immediately, including one waiting for a lock.
    epoch++; resetting = true;
    return schedule(async () => {
      await load();
      if (blocked === 'read-error') return result(false, { reason: 'read-error' });
      return locked(() => {
        let raw;
        try { raw = storage.getItem(STORAGE_KEY); } catch (_) { emit('read-error', '清除前讀取失敗，舊資料未清除。'); return result(false, { reason: 'read-error' }); }
        // Explicit reset can clear the protected raw version the user was shown/backed up,
        // but never a newer, unseen external version.
        const knownRaw = blocked === 'conflict' || blocked === 'quarantined' ? protectedRaw : expectedRaw;
        if (raw !== knownRaw) return conflict(raw);
        try { storage.removeItem(STORAGE_KEY); }
        catch (_) { emit('write-error', '清除失敗，舊資料仍保留；請重試或先備份。'); return result(false, { reason: 'clear-error' }); }
        expectedRaw = null; protectedRaw = null; revision = 0; savedFingerprint = null; loadedPayload = null; blocked = null;
        emit('ready', '本站裝置紀錄已清除，可以開始新試驗。'); return result(true);
      });
    }).finally(() => { resetting = false; });
  }
  function handleExternalChange(event) {
    if (!loaded || !event || (event.key !== STORAGE_KEY && event.key !== null)) return false;
    if (event.storageArea && storage && event.storageArea !== storage) return false;
    let raw;
    try { raw = storage.getItem(STORAGE_KEY); } catch (_) { savedFingerprint = null; emit('read-error', '外部分頁有變更，但目前無法讀取；已停止保存。'); return true; }
    if (raw !== expectedRaw) { conflict(raw); return true; }
    return false;
  }
  return Object.freeze({ load, save, retry: save, clear, handleExternalChange, readStatus: status,
    get status() { return status(); },
    get canBackupRaw() { return protectedRaw !== null; },
    backupRaw() { return protectedRaw; }
  });
}
