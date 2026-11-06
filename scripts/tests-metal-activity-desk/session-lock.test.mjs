import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionLock } from '../../tools/metal-activity-desk/session-lock.mjs';

const KEY = 'bhcs-metal-inquiry-v3';
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const flush = () => new Promise(resolve => setImmediate(resolve));
const promptly = async promise => {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('acquisition did not settle promptly')), 500);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

// This mock models shared exclusive ownership and the Web Locks callback's
// lifetime. Dispatch can be paused to exercise pagehide-before-grant races.
function lockManager({ manual = false } = {}) {
  const holders = new Map();
  const calls = [];
  return {
    calls,
    holders,
    request(name, options, callback) {
      const completion = deferred();
      const call = { name, options, callback, completion, dispatched: false };
      calls.push(call);
      call.dispatch = () => {
        assert.equal(call.dispatched, false);
        call.dispatched = true;
        const token = holders.has(name) ? null : { name, mode: options.mode };
        if (token) holders.set(name, { token, completion });
        const finish = (value, error) => {
          if (holders.get(name)?.token === token) holders.delete(name);
          if (error) completion.reject(value);
          else completion.resolve(value);
        };
        try {
          Promise.resolve(callback(token)).then(
            value => finish(value, false), error => finish(error, true),
          );
        } catch (error) {
          finish(error, true);
        }
      };
      if (!manual) queueMicrotask(call.dispatch);
      return completion.promise;
    },
    lose(name) {
      const holder = holders.get(name);
      assert.ok(holder);
      holders.delete(name);
      holder.completion.reject(new Error('lock was lost'));
    },
  };
}

test('missing or unusable Web Locks fails closed without a fallback writer', async () => {
  for (const locks of [null, {}, { request: null }, { request: true }]) {
    const changes = [];
    const guard = createSessionLock({ locks, onChange: value => changes.push(value) });
    assert.equal(guard.supported, false);
    assert.equal(guard.writable, false);
    assert.equal(await promptly(guard.acquire()), false);
    assert.equal(await promptly(guard.acquire()), false);
    await guard.release();
    assert.deepEqual(changes, []);
  }
});

test('exclusive acquisition settles promptly while the Web Lock remains held', async () => {
  const locks = lockManager();
  const changes = [];
  const guard = createSessionLock({ locks, onChange: value => changes.push(value) });
  assert.equal(guard.supported, true);
  assert.equal(guard.writable, false);
  assert.equal(await promptly(guard.acquire()), true);
  assert.equal(guard.writable, true);
  assert.deepEqual(changes, [true]);
  assert.equal(locks.holders.size, 1);
  assert.equal(locks.calls[0].name, KEY);
  assert.deepEqual(locks.calls[0].options, { mode: 'exclusive', ifAvailable: true });
  let requestFinished = false;
  locks.calls[0].completion.promise.then(() => { requestFinished = true; });
  await flush();
  assert.equal(requestFinished, false);
  const releasing = guard.release();
  assert.equal(guard.writable, false, 'writing stops synchronously');
  assert.deepEqual(changes, [true, false]);
  await releasing;
  assert.equal(locks.holders.size, 0);
  assert.equal(requestFinished, true);
});

test('multiple tabs never queue, steal, or automatically take over after release', async () => {
  const locks = lockManager();
  const first = createSessionLock({ locks });
  const changes = [];
  const second = createSessionLock({ locks, onChange: value => changes.push(value) });
  assert.equal(await first.acquire(), true);
  assert.equal(await promptly(second.acquire()), false);
  assert.equal(first.writable, true);
  assert.equal(second.writable, false);
  assert.equal(locks.calls.length, 2);
  await first.release();
  await flush();
  assert.equal(second.writable, false);
  assert.equal(locks.calls.length, 2, 'no polling or queued reacquisition');
  assert.deepEqual(changes, []);
  assert.equal(await second.acquire(), true, 'manual retry can obtain a free lock');
  assert.deepEqual(changes, [true]);
  await second.release();
});

test('an explicit V4 key isolates old V3 tabs while sharing one V4 writer lock', async () => {
  const locks = lockManager();
  const legacy = createSessionLock({ locks });
  const current = createSessionLock({ locks, name: 'bhcs-metal-inquiry-v4' });
  const secondCurrent = createSessionLock({ locks, name: 'bhcs-metal-inquiry-v4' });
  assert.equal(await legacy.acquire(), true);
  assert.equal(await current.acquire(), true);
  assert.equal(await secondCurrent.acquire(), false);
  assert.deepEqual(locks.calls.map(call => call.name), [KEY, 'bhcs-metal-inquiry-v4', 'bhcs-metal-inquiry-v4']);
  await legacy.release();
  assert.equal(await secondCurrent.acquire(), false, 'legacy release cannot release the current writer lock');
  await current.release();
  assert.equal(await secondCurrent.acquire(), true);
  await secondCurrent.release();
});

test('concurrent and repeated acquisitions reuse one request and one result', async () => {
  const locks = lockManager({ manual: true });
  const changes = [];
  const guard = createSessionLock({ locks, onChange: value => changes.push(value) });
  const first = guard.acquire();
  const second = guard.acquire();
  assert.equal(first, second);
  assert.equal(locks.calls.length, 1);
  locks.calls[0].dispatch();
  assert.deepEqual(await promptly(Promise.all([first, second])), [true, true]);
  assert.equal(guard.acquire(), first);
  assert.equal(locks.calls.length, 1);
  assert.deepEqual(changes, [true]);
  await guard.release();
  await guard.release();
  assert.deepEqual(changes, [true, false]);
});

test('release cancels pending acquisition promptly, even before browser dispatch', async () => {
  const locks = lockManager({ manual: true });
  const changes = [];
  const guard = createSessionLock({ locks, onChange: value => changes.push(value) });
  const pending = guard.acquire();
  const released = guard.release();
  assert.equal(await promptly(pending), false);
  assert.equal(guard.writable, false);
  locks.calls[0].dispatch();
  await released;
  assert.equal(guard.writable, false);
  assert.equal(locks.holders.size, 0);
  assert.deepEqual(changes, [], 'late grant must never re-enable writing');
});

test('a cancelled pending request cannot interfere with a newer acquisition', async () => {
  const locks = lockManager({ manual: true });
  const changes = [];
  const guard = createSessionLock({ locks, onChange: value => changes.push(value) });
  const old = guard.acquire();
  const released = guard.release();
  const replacement = guard.acquire();
  assert.equal(await old, false);
  locks.calls[1].dispatch();
  assert.equal(await replacement, true);
  locks.calls[0].dispatch();
  await released;
  assert.equal(guard.writable, true);
  assert.deepEqual(changes, [true]);
  await guard.release();
  assert.deepEqual(changes, [true, false]);
});

test('a cancelled request that is dispatched first releases its grant for a retry', async () => {
  const locks = lockManager({ manual: true });
  const guard = createSessionLock({ locks });
  const old = guard.acquire();
  const released = guard.release();
  const replacement = guard.acquire();
  locks.calls[0].dispatch();
  await released;
  locks.calls[1].dispatch();
  assert.equal(await old, false);
  assert.equal(await replacement, true);
  assert.equal(guard.writable, true);
  await guard.release();
});

test('release after grant but before consumer continuation leaves writing disabled', async () => {
  const locks = lockManager({ manual: true });
  const changes = [];
  const guard = createSessionLock({ locks, onChange: value => changes.push(value) });
  const acquired = guard.acquire();
  locks.calls[0].dispatch();
  const released = guard.release();
  assert.equal(await acquired, true, 'the grant happened, but is not a future ownership guarantee');
  assert.equal(guard.writable, false, 'callers must check current ownership before writing');
  await released;
  assert.deepEqual(changes, [true, false]);
});

test('a UI observer may release synchronously during grant without stranding ownership', async () => {
  const locks = lockManager();
  const changes = [];
  let release;
  const guard = createSessionLock({
    locks,
    onChange(value) {
      changes.push(value);
      if (value) release = guard.release();
    },
  });
  assert.equal(await promptly(guard.acquire()), false);
  await release;
  assert.equal(guard.writable, false);
  assert.equal(locks.holders.size, 0);
  assert.deepEqual(changes, [true, false]);
  const other = createSessionLock({ locks });
  assert.equal(await other.acquire(), true);
  await other.release();
});

test('exceptions in an observer cannot strand a grant or prevent release', async () => {
  const locks = lockManager();
  const changes = [];
  const guard = createSessionLock({
    locks,
    onChange(value) { changes.push(value); throw new Error('UI failed'); },
  });
  assert.equal(await promptly(guard.acquire()), true);
  await guard.release();
  assert.equal(guard.writable, false);
  assert.equal(locks.holders.size, 0);
  assert.deepEqual(changes, [true, false]);
});

test('synchronous access denial fails closed and permits an explicit retry', async () => {
  const manager = lockManager();
  let denied = true;
  const guard = createSessionLock({ locks: {
    request(...args) {
      if (denied) throw new Error('SecurityError');
      return manager.request(...args);
    },
  } });
  assert.equal(guard.supported, true, 'API presence is distinct from permission');
  assert.equal(await promptly(guard.acquire()), false);
  assert.equal(guard.writable, false);
  denied = false;
  assert.equal(await guard.acquire(), true);
  await guard.release();
});

test('asynchronous denial fails closed without an unhandled rejection', async () => {
  const changes = [];
  const guard = createSessionLock({
    locks: { request: () => Promise.reject(new Error('SecurityError')) },
    onChange: value => changes.push(value),
  });
  assert.equal(await promptly(guard.acquire()), false);
  assert.equal(guard.writable, false);
  await guard.release();
  assert.deepEqual(changes, []);
});

test('unexpected ownership loss disables writing and permits a new acquisition', async () => {
  const locks = lockManager();
  const changes = [];
  const guard = createSessionLock({ locks, onChange: value => changes.push(value) });
  assert.equal(await guard.acquire(), true);
  locks.lose(KEY);
  await flush();
  assert.equal(guard.writable, false);
  assert.deepEqual(changes, [true, false]);
  assert.equal(await guard.acquire(), true);
  assert.deepEqual(changes, [true, false, true]);
  await guard.release();
});

test('a stale rejection cannot disable a newer successful acquisition', async () => {
  const locks = lockManager({ manual: true });
  const changes = [];
  const guard = createSessionLock({ locks, onChange: value => changes.push(value) });
  const old = guard.acquire();
  const released = guard.release();
  const replacement = guard.acquire();
  locks.calls[1].dispatch();
  assert.equal(await replacement, true);
  locks.calls[0].completion.reject(new Error('old denial arrived late'));
  await released;
  assert.equal(await old, false);
  assert.equal(guard.writable, true);
  assert.deepEqual(changes, [true]);
  await guard.release();
});

test('repeated acquisition rounds across many tabs retain exactly one writer', async () => {
  const locks = lockManager();
  const tabs = Array.from({ length: 12 }, () => createSessionLock({ locks }));
  for (let round = 0; round < 20; round++) {
    const ordered = [...tabs.slice(round % tabs.length), ...tabs.slice(0, round % tabs.length)];
    const results = await promptly(Promise.all(ordered.map(tab => tab.acquire())));
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal(tabs.filter(tab => tab.writable).length, 1);
    assert.equal(locks.holders.size, 1);
    await Promise.all(tabs.map(tab => tab.release()));
    assert.equal(locks.holders.size, 0);
    assert.ok(tabs.every(tab => !tab.writable));
  }
  assert.equal(locks.calls.length, 240);
  for (const call of locks.calls) {
    assert.equal(call.name, KEY);
    assert.deepEqual(call.options, { mode: 'exclusive', ifAvailable: true });
  }
});
