/** Read-only recovery. Never normalizes, overwrites, removes, or probes storage by writing. */
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const revisionMap = value => object(value) && Object.entries(value).every(([key, rows]) =>
  !['__proto__', 'prototype', 'constructor'].includes(key) && Array.isArray(rows) && rows.every(row =>
    object(row) && typeof row.text === 'string' && typeof row.at === 'string' && Object.keys(row).every(k => ['text','at'].includes(k))));
const draftMap = value => object(value) && Object.entries(value).every(([key, text]) => ['water','brine'].includes(key) && typeof text === 'string');

/** validateRecord(record) must return boolean true for an accepted complete snapshot. */
export function loadStore(storage, key, validateRecord) {
  const result = {records: [], revisions: {}, drafts: {}, comparison: '', storageOK: true, writeBlocked: false, originalRaw: null, warning: '', invalidCount: 0};
  const block = warning => {result.storageOK = false; result.writeBlocked = true; result.warning = warning; return result;};
  try {result.originalRaw = storage.getItem(key);} catch {
    return block('無法讀取本機手札，已停止寫入以免覆蓋原資料。操作仍可繼續；離開前請複製紀錄。');
  }
  if (result.originalRaw === null) return result;
  if (typeof result.originalRaw !== 'string') return block('本機手札格式異常，原資料未改動；已停止寫入，請先複製備份。');
  let saved;
  try {saved = JSON.parse(result.originalRaw);} catch {
    return block('本機手札無法解析，原始內容已保留且未改動；已停止寫入，請先複製備份。');
  }
  if (!object(saved) || !Array.isArray(saved.records)) return block('本機手札結構不完整，原始內容未改動；已停止寫入，請先複製備份。');
  let badFields = Object.keys(saved).some(key => !['records','revisions','drafts','comparison'].includes(key));
  for (const record of saved.records) {
    let valid = false;
    try {valid = typeof validateRecord === 'function' && validateRecord(record) === true;} catch { /* Isolate one corrupt record; retain every other valid record. */ }
    if (valid) result.records.push(record); else result.invalidCount++;
  }
  if (own(saved,'revisions')) {if (revisionMap(saved.revisions)) result.revisions=saved.revisions; else badFields=true;}
  if (own(saved,'drafts')) {if (draftMap(saved.drafts)) result.drafts=saved.drafts; else badFields=true;}
  if (own(saved,'comparison')) {if (typeof saved.comparison==='string') result.comparison=saved.comparison; else badFields=true;}
  if (badFields || result.invalidCount) {
    return block(`本機手札含有${result.invalidCount ? ` ${result.invalidCount} 筆無法驗證的紀錄` : '不符合格式的欄位'}；可讀資料僅供查看，完整原始內容未改動。已停止寫入，請先複製備份；只有明確確認清除本版手札後才可重新儲存。`);
  }
  return result;
}
