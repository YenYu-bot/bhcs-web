/** Verify accepted runtime identity and reversible, explicitly enumerated port changes. */
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('docs/metal-activity-desk-source-manifest.json', root), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
assert.equal(manifest.acceptedSourceCommit, 'ffd20ffb02d67f48084acaed66785eb0336905c2');
assert.equal(manifest.tests.length, 14);
assert.equal(manifest.runtime.length, 20);
async function files(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) result.push(...await files(new URL(entry.name + '/', directory), name + '/'));
    else result.push(name);
  }
  return result.sort();
}
assert.deepEqual(await files(new URL('tools/metal-activity-desk/', root)), manifest.runtime.map(row => row.target.replace('tools/metal-activity-desk/', '')).sort(), 'No omitted or unmanifested runtime files');
assert.deepEqual(await files(new URL('scripts/tests-metal-activity-desk/', root)), manifest.tests.map(row => row.target.replace('scripts/tests-metal-activity-desk/', '')).sort(), 'All original tests retained');
for (const row of [...manifest.runtime, ...manifest.tests]) {
  const bytes = await readFile(new URL(row.target, root));
  assert.equal(sha(bytes), row.targetSha256, row.target + ': port SHA256');
  let restored = bytes;
  if (row.transformation === 'indexTransformations') {
    let html = bytes.toString('utf8');
    for (const replacement of [...manifest.indexTransformations].reverse()) {
      assert.equal(html.split(replacement.to).length - 1, replacement.occurrences);
      html = html.replace(replacement.to, replacement.from);
    }
    restored = Buffer.from(html);
  } else if (row.pathReplacements !== undefined) {
    const text = bytes.toString('utf8');
    assert.equal(text.split(manifest.testTransformation.to).length - 1, row.pathReplacements);
    restored = Buffer.from(text.replaceAll(manifest.testTransformation.to, manifest.testTransformation.from));
  }
  assert.equal(sha(restored), row.sourceSha256, row.target + ': exact accepted source after reversal');
}
console.log(`Verified ${manifest.runtime.length} runtime files and ${manifest.tests.length} original test files against accepted source ${manifest.acceptedSourceCommit}.`);
