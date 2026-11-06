import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const app = await readFile(new URL('../../tools/metal-activity-desk/app.mjs', import.meta.url), 'utf8');
const returnInspectFocus = app.match(/^function returnInspectFocus\(\).*$/m)?.[0];
assert.ok(returnInspectFocus, 'exercise the production dialog focus-return function');

function harness({ opener, replacement = null, legacy = null, inspectId = 'r7' } = {}) {
  const focused = [], lookups = [];
  const target = name => ({ focus() { focused.push(name); } });
  const liveOpener = opener ? { ...opener, ...target('opener') } : opener;
  const replacementTarget = replacement ? target('replacement') : null;
  const legacyTarget = legacy ? target('legacy') : null;
  const context = {
    inspectOpener: liveOpener, inspectId,
    document: { getElementById(id) {
      lookups.push(['id', id]);
      return id === replacement ? replacementTarget : null;
    } },
    $: selector => {
      lookups.push(['selector', selector]);
      assert.equal(selector, `[data-inspect-record="${inspectId}"]`);
      return legacyTarget;
    },
  };
  return { focused, lookups, run() {
    runInNewContext(`${returnInspectFocus}\nreturnInspectFocus();`, context);
  } };
}

test('inspect close returns to the live opener before any replacement or legacy fallback', () => {
  const h = harness({
    opener: { id: 'review-inspect-origin-r7', isConnected: true },
    replacement: 'review-inspect-origin-r7', legacy: true,
  });
  h.run();
  assert.deepEqual(h.focused, ['opener']);
  assert.deepEqual(h.lookups, []);
});

test('inspect close prefers a rerendered review opener with the same ID over earlier notebook controls', () => {
  const h = harness({
    opener: { id: 'review-inspect-origin-r7', isConnected: false },
    replacement: 'review-inspect-origin-r7', legacy: true,
  });
  h.run();
  assert.deepEqual(h.focused, ['replacement']);
  assert.deepEqual(h.lookups, [['id', 'review-inspect-origin-r7']]);
});

test('inspect close still finds a detached legacy opener through its retained record ID', () => {
  for (const id of ['', 'review-inspect-origin-r7']) {
    const h = harness({ opener: { id, isConnected: false }, legacy: true });
    h.run();
    assert.deepEqual(h.focused, ['legacy']);
    assert.deepEqual(h.lookups.at(-1), ['selector', '[data-inspect-record="r7"]']);
  }
});

test('inspect close is safe when neither the opener nor any replacement target exists', () => {
  for (const opener of [null, undefined, { id: '', isConnected: false }, { id: 'review-inspect-origin-r7', isConnected: false }]) {
    const h = harness({ opener });
    assert.doesNotThrow(() => h.run());
    assert.deepEqual(h.focused, []);
  }
});
