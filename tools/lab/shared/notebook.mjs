// One transactional notebook per station. Old releases still write localStorage;
// import that key once without changing it, then ignore their later writes.
const DATABASE = 'bhcs.lab.notebooks.v1';
const BUCKET = 'notebooks';
const SCHEMA = 1;
const messages = {
  unavailable: '這個瀏覽器無法讀寫研究紀錄。仍可操作實驗，但新進度不會在重新整理後保留。',
  conflict: '另一個分頁已更新或清空研究紀錄。為了保留較新的紀錄，這個分頁不會再寫入。請先保存畫面上的觀察，再重新整理。',
  save: '目前無法儲存研究紀錄。這個分頁裡的進度仍在，請先保存畫面上的觀察再關閉。',
  clear: '無法清空研究紀錄，沒有重設本站。請確認瀏覽器允許儲存，或重新整理後再試。',
};

function warningNode(message) {
  if (typeof document === 'undefined' || !document.body) return;
  let node = document.querySelector('[data-notebook-warning]');
  if (!message) {
    if (node) node.hidden = true;
    return;
  }
  if (!node) {
    node = document.createElement('p');
    node.dataset.notebookWarning = '';
    node.setAttribute('role', 'alert');
    node.style.cssText = 'position:sticky;top:0;z-index:1000;margin:0;padding:.55em 1em;background:#fff1c9;color:#492b00;border-bottom:1px solid #c68c28;font:600 14px/1.45 system-ui,sans-serif;';
    document.body.prepend(node);
  }
  node.hidden = false;
  if (node.textContent !== message) node.textContent = message;
}

function openDatabase(factory, timeoutMs) {
  return new Promise((resolve, reject) => {
    const request = factory.open(DATABASE, 1);
    let ended = false;
    const timer = setTimeout(() => finish(reject, Error('notebook open timeout')), timeoutMs);
    const finish = (fn, value) => {
      if (ended) return false;
      ended = true;
      clearTimeout(timer);
      fn(value);
      return true;
    };
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(BUCKET)) request.result.createObjectStore(BUCKET);
    };
    request.onblocked = () => finish(reject, Error('notebook open blocked'));
    request.onerror = () => finish(reject, request.error);
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      if (!finish(resolve, db)) db.close();
    };
  });
}

// The read, compare, and conditional put are inside a single IDB readwrite
// transaction. Resolve only on transaction completion, not request success.
function transaction(database, key, compareAndPut) {
  return new Promise((resolve, reject) => {
    const tx = database.transaction(BUCKET, 'readwrite');
    const bucket = tx.objectStore(BUCKET);
    let result, cause;
    tx.oncomplete = () => resolve(result);
    tx.onabort = () => reject(cause ?? tx.error ?? Error('notebook transaction aborted'));
    const request = bucket.get(key);
    request.onsuccess = () => {
      try {
        result = compareAndPut(request.result);
        if (result.next) bucket.put(result.next, key);
      } catch (error) {
        cause = error;
        tx.abort();
      }
    };
  });
}

function valid(entry) {
  return entry?.schema === SCHEMA && Number.isSafeInteger(entry.rev) && entry.rev >= 0 &&
    Object.prototype.hasOwnProperty.call(entry, 'value');
}

function copy(value) { return JSON.parse(JSON.stringify(value)); }

function legacyValue(key, storage) {
  const raw = storage.getItem(key);
  return raw === null ? null : JSON.parse(raw);
}

export async function openNotebook(key, options = {}) {
  const show = options.warn ?? warningNode;
  let db, current, stale = false, resetPending = false, queued = Promise.resolve();
  let lastWarning = null;
  function warn(code, message = messages[code]) {
    if (lastWarning !== message) {
      lastWarning = message;
      try { show(message, code); } catch { /* A display failure cannot change a committed write. */ }
    }
  }
  try {
    db = await openDatabase(options.indexedDB ?? globalThis.indexedDB, options.timeoutMs ?? 2000);
    current = (await transaction(db, key, existing => {
      if (existing !== undefined) {
        if (!valid(existing)) throw Error('unrecognized notebook format');
        return { current: existing };
      }
      const value = legacyValue(key, options.localStorage ?? globalThis.localStorage);
      const next = { schema: SCHEMA, rev: 0, value };
      return { next, current: next };
    })).current;
  } catch {
    db?.close();
    db = undefined;
    // Do not fall back to the old key: the protected store may already
    // have been reset, and loading a backup would display old work again.
    current = { value: null };
    warn('unavailable');
  }
  if (typeof document !== 'undefined') document.documentElement.dataset.notebookReady = db ? 'ready' : 'unavailable';

  function enqueue(value, mayClear) {
    const update = async () => {
      if (!db || stale) {
        if (stale && mayClear) warn('conflict', messages.conflict + ' 本次沒有清空紀錄。');
        else if (!db && mayClear) warn('clear', messages.clear + ' ' + messages.unavailable);
        return false;
      }
      try {
        const expected = current.rev;
        const result = await transaction(db, key, existing => {
          if (!valid(existing)) throw Error('notebook revision unavailable');
          if (existing.rev !== expected) return { stale: true };
          if (!mayClear && JSON.stringify(existing.value) === JSON.stringify(value)) return { unchanged: true };
          if (expected >= Number.MAX_SAFE_INTEGER) throw Error('notebook revision exhausted');
          const next = { schema: SCHEMA, rev: expected + 1, value };
          return { next };
        });
        if (result.stale) {
          stale = true;
          warn('conflict', mayClear ? messages.conflict + ' 本次沒有清空紀錄。' : undefined);
          return false;
        }
        if (!result.unchanged) current = result.next;
        warn('ok', '');
        return true;
      } catch {
        warn(mayClear ? 'clear' : 'save');
        return false;
      }
    };
    const job = queued.then(update, update);
    queued = job;
    return job;
  }

  return {
    load() { return copy(current.value); },
    save(data) {
      if (resetPending) return Promise.resolve(false);
      let snapshot;
      try { snapshot = copy(data); }
      catch {
        warn('save');
        return Promise.resolve(false);
      }
      return enqueue(snapshot, false);
    },
    clear() {
      if (resetPending) return Promise.resolve(false);
      resetPending = true;
      // A tombstone keeps legacy keys and stale tabs from restoring a reset.
      return enqueue(null, true).finally(() => { resetPending = false; });
    },
  };
}
