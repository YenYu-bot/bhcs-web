# Standalone pulley desk integration (Draft PR)

## Frozen source and metadata-only transfer

Accepted prototype commit: `be5ec67aa6ece6e47d8649c27c1286825959b77f`.
Official integration base: `17f95d50295c9c0ad634e9f71d8cf4bdceaea8d0`.
Accepted app SHA-256: `d8afa7796470ce62b87fbc9611c319a96adf8141ac773d3ab525d5e1c5db1731`.

The ten accepted runtime files are copied to `tools/pulley-desk/`. The inventory is in `scripts/pulley-desk-runtime.json`; its exact digest is pinned by the integration test. Nine files are byte-identical. `index.html` has exactly two reversible route-metadata operations:

1. Insert `<link rel="canonical" href="https://www.bhcs.com.tw/tools/pulley-desk/">` immediately before its original stylesheet link.
2. Remove exactly `<meta name="robots" content="noindex,nofollow">` immediately after `<meta name="color-scheme" content="light">` so the proposed public route is indexable and can enter the existing sitemap builder.

The integration test reverses both operations and proves the original index SHA-256 and byte length. No teaching text, visible prototype label, layout, artwork, model, input, storage or guide behavior is changed. The retained visible 「私人教學原型」 wording is part of the accepted frozen copy; any later copy revision requires separate review. The original version-1.0 specification is preserved in `docs/pulley-desk-spec-v1.0.md`; its original prototype-only release wording describes that historical specification stage. This integration is a later, separately authorized Draft PR submission, not approval to merge or deploy.

## Standalone discovery and existing boundaries

Only `standalonePublic` registers this route. There is no shared research shell, analytics adapter, iframe, legacy replacement or import into another application. The unchanged builders regenerate the science directory, resource page and sitemap. Counts increase exactly +1: science 56→57, junior science 55→56, physics 37→38, all resources 215→216, sitemap URLs 125→126. Existing count assertions are incremented, not removed.

Existing pulley/incline and lever activities, standalone lever/buoyancy/lens/microscope runtimes, shared science assets and source models remain unchanged. The integration gate pins 208 protected files. All eight prerequisite CI jobs and the fail-closed CI Gate remain unchanged; the new browser step and artifact are additive within `science-stations`. Unpublished guided activities retain their existing visibility protections without new broad exclusions.

The teacher image is the exact canonical PNG (948×1659), SHA-256 `2851a4bdd0a6523fad5db15c8a197c17ac191bd70000c051513b5e317589f23b`, Git blob `0aaa1b8ff727b271b363e6ff5d3106dc098e38c1`. The original provenance file is unchanged. A portable copy avoids runtime coupling to another application.

## Learning and records remain unchanged

Two ideal devices only: fixed pulley and one movable pulley, fixed 10 N load, 20 cm target. Each round permits monotonic lifting with pause/regrab, not lowering. A four-step guide leads through fixed, movable, work calculation and evidence-based explanation. A target-height drag preview is not committed evidence; cancellation must restore the prior committed height and cannot qualify a record. Fixed requires 10 N over 20 cm; movable requires 5 N over 40 cm; both ideal input/output work values are 2 J.

The only new-station storage key is `bhcs.pulleyDesk.v1`. Existing standalone keys and legacy keys remain isolated. Corrupt/future/unsupported data stays byte-for-byte unchanged with zero hydration writes, while new memory-only learning remains possible. Backup/reset remains explicitly guarded. Original observations do not change with later movement, calculation edits or explanation revisions.

**Prototype and official website records do not move automatically across origins.** The public catalog and accepted footer state this limitation. No import, account sync, cross-origin migration or cloud backup is added.

## Reproduction and test evidence

```sh
npm ci --prefix scripts
node scripts/build_microscope.mjs
node scripts/build_science.mjs
node scripts/build_site.mjs
python3 scripts/build_shell.py
python3 scripts/build_resources.py
node scripts/build_math_brand.mjs
python3 scripts/build_sitemap.py
npm run test:pulley-desk --prefix scripts
python3 scripts/check_resources.py
npm test --prefix scripts
node scripts/check_science_integration.cjs
NODE_PATH=/tmp/bhcs-composition/node_modules node scripts/check_pulley_desk_browser.cjs
```

Run all seven builders twice and verify there are no second-pass changes. Track the new files before aggregate tests because repository-wide `git grep` visibility gates do not see untracked files. Runtime production requires no npm or framework.

The original 54 developer tests and three independent audit scripts (117 + 189 + 90 assertions) retain all assertions; only file/module paths are relocated. Four guide-baseline modules are carried unchanged. Some original audit files contained host-specific absolute paths: the public inventory records original SHA-256 plus a normalized-source SHA-256 with an opaque `@INPUT_ROOT@/` path token. The integration test reverses every explicit path-only adaptation in reverse order and pins the normalized source. No private host path is published. No timer/lifecycle patch is needed for this app.

The integration gate checks frozen hashes, both inverse metadata operations, source-test preservation, teacher provenance, isolated discovery and storage references, the eight-job CI boundary, relative import/resource graph and nested-route local HTTP/MIME responses. Local HTTP results are not evidence of production hosting or CSP.

The real-browser checker exercises native mouse/keyboard and CDP touch at desktop 1280 and mobile widths 360/390/412, the four-step learning sequence, unqualified target preview cancellation, reload and storage isolation. Screenshots and JSON evidence are published by CI as `pulley-desk-review`, retained for 14 days. Quota/write-failure memory-only behavior is covered by model/JSDOM tests, not by the current browser scenarios; the browser suite covers corrupt-storage blocked-memory continuation. Chromium/CDP touch is not a physical phone, Safari or Firefox certification. Model/JSDOM tests are not browser-layout acceptance. The exact remote commit's full CI and independent review must establish merge readiness; neither local passes nor this document assert merge, deployment or live production verification.

## Touch checker event-delivery precondition

The first Draft PR browser run passed desktop, keyboard and all four corrupt-storage scenarios, but the three mobile guided-pointer scenarios read 18 cm immediately after sending the first eight-sample drag to 20 cm. The seventh sample corresponds exactly to 18 cm after model rounding. That pattern suggests a pending final touch sample, but the original artifact did not record pointermove coordinates, so the timing cause is an inference, not established fact. The later full-page failure capture interrupted the still-active gesture; its restored 0 cm view does not represent the assertion-time preview.

The checker now passively records trusted pointer events, coordinates, native pointer identity and actual button target. For CDP gestures it observes the new handle pointerdown, the current pointer's final pointermove endpoint (within half a CSS pixel), and the new pointerup or pointercancel before inspecting the corresponding rendered state. A pre-gesture audit index excludes previous gestures; the native pointer ID excludes another pointer. These are event-delivery preconditions, not waits for a desired height. The existing exact preview, cancellation, storage, qualification and immutable-evidence assertions remain unchanged. The page's existing timeout remains fail-closed; no fixed sleep, input retry, DOM state mutation or runtime change is added. Supplemental unit checks reject stale, untrusted, wrong-pointer, wrong-target and penultimate samples, propagate timeout failure, and show that wrong preview values still fail after endpoint delivery. Exact-head remote CI must verify the corrected real-browser flow.


## Touch activation delivery precondition

The next exact-head browser run confirmed all four fixed-pulley touch gestures at each mobile width: target-preview cancellation, the first committed rise, the reverse no-op and the final committed rise. The three failures moved to the subsequent Save activation. At the assertion boundary the passive trace contained a trusted touch pointerdown and pointerup on `guide-next`, but no click; the guide still said Save and no record had been written. The later capture also showed no record. These artifacts do not establish whether the native click was delayed or suppressed, so the checker does not claim a runtime defect or a proven timing cause.

After a touch tap, the checker now requires a new trusted touch down/up sequence on the requested button followed by a new trusted touch click on that same button. The audit index excludes earlier taps, and down/up uses observed native pointer identity rather than assuming the browser pointer ID equals the CDP contact ID. It does not infer success from a desired record count or guide state. The original 121 browser assertion expressions are unchanged. A missing click must fail at the existing timeout: there is no replay, forced click, fixed sleep, application-state setter or frozen-runtime modification. Three supplemental regressions cover stale/untrusted/wrong-target input, ordered current-tap provenance and timeout propagation. Corrected exact-head remote CI must determine whether the expected click actually arrives; otherwise its expanded passive trace remains a diagnostic failure rather than a fabricated pass.

## Bounded native-touch diagnostic (not acceptance)

The subsequent browser run timed out after 15 seconds without a trusted Save click at all three mobile widths, despite observing the button's touch pointerdown/up and all four preceding fixed-pulley drags. This does not support the earlier simple late-click hypothesis. It locates the failure before the application Save click handler, but does not identify the suppression mechanism. Human prototype acceptance was desktop-only; no physical-mobile acceptance is asserted.

Only when the original 390px guided-pointer scenario fails, the checker now collects a separate `touch-diagnostic-390.json` after all nine acceptance scenarios. It runs exactly three fresh 390px contexts once each: the original mixed Playwright-tap/explicit-CDP-drag path; a button-only Playwright-tap control; and native taps plus drags sharing the same explicit CDP session. Each stops at its first error or the first saved fixed record. The original mixed sequence retains target cancellation, +5 cm, reverse no-op, +15 cm, and one Save tap. There is no retry, forced click, fixed sleep, CSS/runtime change, or additional workflow permission.

The shared-session taps match installed Playwright 1.58.2's omitted contact ID, zero modifiers and concurrent start/end command submission. They measure the visible target center and verify its hit target; they do not reproduce every internal locator actionability detail. Therefore even a difference between variants is diagnostic evidence, not by itself proof of a single causal variable or an approved replacement acceptance path.

Passive probes record native event timestamps, pointer identity/primary flag, touch identifiers, capture events, event cancellation flags, button DOM identity/disabled mutations, scroll and visual-viewport metrics. A later animation-frame observation reads each event's final `defaultPrevented` flag after dispatch; it does not postpone input. The extra observations may affect timing, which is another limit of this experiment. Separate JSON records the first failing stage and final state. Diagnostic completion never turns an acceptance failure into success: the original nine scenario results, all 121 assertion expressions, and the final 9/9 fail-closed gate remain unchanged. A missing click still fails at the existing timeout. The experiment is bounded evidence gathering, not a product fix or mobile certification; any next change requires review of its exact-head evidence.
