// Used ONLY by the accepted-v1 byte-preservation test. Actual UI/model tests
// import the repaired runtime directly. Undo the separately pinned authorized
// presentation repairs here, then the existing reader undoes canonical metadata.
import fs from './accepted-file-reader.mjs';import nativeFs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const repair=JSON.parse(nativeFs.readFileSync(new URL('../motion-graphs-desk-repair.json',import.meta.url),'utf8'));
const base=new URL('../../tools/motion-graphs-desk/',import.meta.url).href,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export default {...fs,readFileSync(path,...options){const value=fs.readFileSync(path,...options);const relative=path instanceof URL&&path.href.startsWith(base)?path.href.slice(base.length):null;const delta=repair.files.find(f=>f.path===relative);if(!delta)return value;assert.equal(sha(value),delta.sha256,'exact authorized runtime before baseline reversal');let text=String(value);for(const {before,after}of [...delta.replacements].reverse()){assert.equal(text.split(after).length,2);text=text.replace(after,before);}assert.equal(sha(text),delta.before_sha256);return Buffer.isBuffer(value)?Buffer.from(text):text;}};
