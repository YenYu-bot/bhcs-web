// Every writer of this browser-local session must use the same lock name.
const SESSION_LOCK_NAME = 'bhcs-metal-inquiry-v3';

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

/**
 * Cooperating same-origin tabs have at most one writable session. No fallback
 * lease, polling, queued acquisition, or lock stealing is used: without Web
 * Locks, or while another tab owns the lock, the caller must remain read-only.
 *
 * acquire() resolves without waiting for release. Concurrent/repeated calls
 * share the current acquisition; a failed attempt may be retried explicitly.
 * release() disables writing immediately, cancels any pending acquisition, and
 * returns a promise for the underlying request to finish. Await that promise
 * before an immediate retry if the lock must already be available to other tabs.
 * onChange runs only when writable changes; observer errors cannot strand a
 * lock. The caller must also gate every storage write on the writable getter.
 */
export function createSessionLock({
  locks = globalThis.navigator?.locks,
  name = SESSION_LOCK_NAME,
  onChange = () => {},
} = {}) {
  const supported = typeof locks?.request === 'function';
  let writable = false;
  let current = null;

  const change = value => {
    if (writable === value) return;
    writable = value;
    try { onChange(value); } catch {
      // Ownership and cleanup must not depend on a UI observer succeeding.
    }
  };

  const retire = attempt => {
    attempt.cancelled = true;
    attempt.hold.resolve();
    attempt.ready.resolve(false);
    // A late callback/rejection from an old request cannot revoke a newer one.
    if (current !== attempt) return;
    current = null;
    change(false);
  };

  const acquire = () => {
    if (!supported) return Promise.resolve(false);
    if (current) return current.ready.promise;

    const attempt = {
      ready: deferred(), hold: deferred(), done: deferred(), cancelled: false,
    };
    current = attempt;
    const finish = () => {
      retire(attempt);
      attempt.done.resolve();
    };

    try {
      const request = locks.request(name, {
        mode: 'exclusive', ifAvailable: true,
      }, lock => {
        if (!lock || current !== attempt || attempt.cancelled) {
          retire(attempt);
          return;
        }
        change(true);
        // An observer can synchronously release the lock during change(true).
        attempt.ready.resolve(current === attempt && !attempt.cancelled);
        return attempt.hold.promise;
      });
      // request stays pending while its callback holds the lock. Its rejection
      // also covers denial or an externally broken lock and must fail closed.
      Promise.resolve(request).then(finish, finish);
    } catch {
      finish();
    }
    return attempt.ready.promise;
  };

  return {
    acquire,
    release() {
      if (!current) return Promise.resolve();
      const attempt = current;
      retire(attempt);
      return attempt.done.promise;
    },
    get writable() { return writable; },
    get supported() { return supported; },
  };
}
