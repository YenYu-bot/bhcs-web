# Frozen lever test ports

The nine entries in `../lever-desk-runtime.json` → `ported_tests` originate in the accepted review package at source commit `def1b2afcdcbefc432b9a9effa6ce4cc88694d07`. They cover every executable in that package's `npm test`, plus its independent oracle support module. Only runtime paths change. The integration test reverses those substitutions and checks each original SHA256; assertions, test bodies, and fixtures are not rewritten. Historical failing-baseline reproductions are not current regression tests.

## Supplemental lifecycle adapter (not prototype source)

`dom-lifecycle.mjs` and `dom-lifecycle.test.mjs` are new integration harness files, not claimed as path-only source ports. The official repository keeps its existing locked jsdom 26.1.0 dependency (no dependency or lockfile change).

The original fixtures execute app modules in Node's global realm and close their jsdom windows. With this dependency, Node timers otherwise continue after `window.close()` and access the destroyed document. All individual assertions pass without the adapter, but the asynchronous teardown errors correctly fail the test processes.

The preload tracks timeout handles by their currently active, registered jsdom window. Callbacks execute normally while the window is open; their exceptions are not caught or suppressed. Calling that window's `close()` cancels only its pending timeout handles, then invokes the original close. It does not cancel another window's timers or change runtime code. The supplemental regression proves a live callback runs, a pending callback is canceled only after its owner closes, and another live fixture's callback still executes. This models destruction of browser-document timers, not browser rendering, pointer geometry, real touch, or accessibility QA.

Run from `scripts/`:

```sh
node --import ./lever-desk/dom-lifecycle.mjs --test lever-desk/*.test.mjs
```
