# Standalone pulley desk integration (Draft PR)

**Current scope:** the accepted runtime has been restored exactly (apart from the original two route-metadata edits). The rejected app-only candidate is retained as history. Current touch acceptance models a stationary endpoint before release; native Chromium 145 CI and physical-mobile validation remain separate.

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

## Historical bounded native-touch diagnostic (not acceptance)

This three-variant diagnostic describes earlier runs. Its source and unit checks remain available for history; the current checker instead always runs the app-free characterization described below.

The subsequent browser run timed out after 15 seconds without a trusted Save click at all three mobile widths, despite observing the button's touch pointerdown/up and all four preceding fixed-pulley drags. This does not support the earlier simple late-click hypothesis. It locates the failure before the application Save click handler, but does not identify the suppression mechanism. Human prototype acceptance was desktop-only; no physical-mobile acceptance is asserted.

Only when the original 390px guided-pointer scenario fails, the checker now collects a separate `touch-diagnostic-390.json` after all nine acceptance scenarios. It runs exactly three fresh 390px contexts once each: the original mixed Playwright-tap/explicit-CDP-drag path; a button-only Playwright-tap control; and native taps plus drags sharing the same explicit CDP session. Each stops at its first error or the first saved fixed record. The original mixed sequence retains target cancellation, +5 cm, reverse no-op, +15 cm, and one Save tap. There is no retry, forced click, fixed sleep, CSS/runtime change, or additional workflow permission.

The shared-session taps match installed Playwright 1.58.2's omitted contact ID, zero modifiers and concurrent start/end command submission. They measure the visible target center and verify its hit target; they do not reproduce every internal locator actionability detail. Therefore even a difference between variants is diagnostic evidence, not by itself proof of a single causal variable or an approved replacement acceptance path.

Passive probes record native event timestamps, pointer identity/primary flag, touch identifiers, capture events, event cancellation flags, button DOM identity/disabled mutations, scroll and visual-viewport metrics. A later animation-frame observation reads each event's final `defaultPrevented` flag after dispatch; it does not postpone input. The extra observations may affect timing, which is another limit of this experiment. Separate JSON records the first failing stage and final state. Diagnostic completion never turns an acceptance failure into success: the original nine scenario results, all 121 assertion expressions, and the final 9/9 fail-closed gate remain unchanged. A missing click still fails at the existing timeout. The experiment is bounded evidence gathering, not a product fix or mobile certification; any next change requires review of its exact-head evidence.

## Historical app-only mobile release candidate — reverted

**Reverted by subsequent authorization.** The following describes the rejected candidate, not current runtime behavior. Its app hash and original delta remain in the historical repair inventory; no exception is active. Candidate-only lifecycle tests and the post-release frame waiter have been removed.

The frozen transfer above describes the original desktop-accepted baseline. A later, explicitly authorized mobile interaction candidate changes **only `app.mjs`**. The accepted `scripts/pulley-desk-runtime.json` remains byte-identical, including the original app hash. Its exact original app is retained in `scripts/pulley-desk/accepted-release-baseline/app.mjs`. The separately pinned `scripts/pulley-desk-runtime-repair.json` lists original and candidate byte lengths/hashes; the integration gate verifies both, and every other runtime file retains its previous boundary. This is not a silent rebaseline. The accepted input module, physical model/formulas, storage/schema/key, guide content, bench geometry, HTML/CSS and teacher artwork remain unchanged.

The diagnostic matrix showed both mixed-session and shared-session drag paths missing the Save click, while the button-only control succeeded. At drag release, the original app disabled the handle and relaid out the guide inside pointerup, before touchend. The Save touch itself was uncancelled, primary, correctly targeted at the same enabled DOM node, without zoom or scrolling during that tap. These observations narrow the investigation; they do not prove that release-time relayout caused the missing click. Contact-ID and browser/CDP behavior remain possible confounders.

The candidate commits/cancels the physical transaction synchronously, but queues its presentation and notice to the next animation frame for touch release. App-level passive pointer-type observation associates only with a transaction accepted by the unchanged input module. A rejected second pointer cannot replace that association. The existing handle/guide presentation remains stable through native release dispatch. Pending Save, guide and step actions are guarded. Newer runs/drags/renders invalidate stale callbacks; blur, resize, orientation, pagehide and hiding the document settle current committed truth; destroy cancels pending work. Mouse, keyboard and button operations remain synchronous. No click injection, retap, fixed delay, formula or storage change is introduced.

Eight lifecycle tests exercise this contract, including the exact cancelled-target, +5, reverse-no-op, +15 sequence, stale callbacks, interruptions and storage isolation. The original 54 developer tests and all 396 independent assertions remain unchanged. In particular, the old independent input-byte comparison still passes; it was not weakened to accommodate the repair. The old accepted runtime fails the new synchronous-release DOM-stability test, while the candidate passes. That negative control establishes the changed lifecycle contract, not browser compatibility.

The browser checker preserves the same native gestures, all 121 original assertion expressions, and the nine-scenario fail-closed gate. After observing the current touch pointerup/cancel, it now awaits exactly one browser animation frame before the existing strict release-state assertions. This is the candidate's explicit presentation boundary, not polling for a desired height/guide state. The original timeout stays fail-closed. Preview assertions remain unchanged. The bounded diagnostic remains separate from acceptance.

This is a **repair candidate**, not a confirmed fix, release or physical-mobile certification. Local model/DOM checks cannot establish that Chromium delivers the subsequent native Save click. Exact-head CI must rerun the original failing native-input sequence; private-prototype revalidation and explicit merge/deployment approval remain separate.

## Accepted runtime restored; stop-then-lift touch acceptance

An external report using **Chromium 153 / Playwright 1.63** reproduced missing click/mousedown/mouseup after a fast 75px, eight-step CDP touch drag on a minimal page with only a `touch-action:none` handle and a remote button. It reported the same behavior for the accepted and candidate pulley runtimes at 360/390/412, and for a separate lever activity. Same-session/contact-ID changes did not solve it. Stationary endpoint samples for 50–200ms, or a slower drag, reportedly allowed the subsequent tap. These are **externally reported results**, not locally reproduced evidence or proof about pinned CI Chromium 145. A fling-related explanation remains a hypothesis; no internal browser trace or physical-phone verification was supplied.

There is therefore insufficient evidence to retain the app-only candidate. `app.mjs` is restored to accepted SHA-256 `d8afa7796470ce62b87fbc9611c319a96adf8141ac773d3ab525d5e1c5db1731`. The original ten-file inventory is unchanged, and the integration test again checks the actual runtime bytes directly against it. `scripts/pulley-desk-runtime-repair.json` is explicitly historical/reverted with an empty active-change list; it cannot substitute candidate bytes into the frozen-source gate. The candidate-only eight lifecycle tests and post-release RAF helper/test are removed with the behavior they tested. All original developer tests, independent assertions, 121 browser assertion expressions, nine acceptance scenarios and required CI gates remain.

The touch gesture now represents **stop, then lift**: after its actual final endpoint is observed, it emits five native CDP `touchMove` samples at the same coordinates and contact ID on 20ms monotonic deadlines, spanning approximately 100ms while the finger is still pressed. The existing strict preview/qualification/storage assertions then run before release. Cancellation still tests an unqualified target preview; committed movement, reverse no-op, snapshots and the guide sequence retain their exact assertions. Sampling timestamps are recorded with each drag. This is intentional gesture duration, **not a post-release wait, click retry, forced input or state substitution**. Release is followed by the existing passive native-event observation and exactly one original locator tap with its trusted-click gate. Mouse/keyboard flows are unchanged.

`fast-release-characterization.json` is produced separately on every completed browser suite, not only when acceptance fails. Two fresh 390px contexts use an app-free inline HTML fixture: one fast-release 75px/eight-step drag and one stationary-endpoint counterpart, each followed by one native tap. The fixture loads no pulley, model, storage or application script; only passive test probes observe input. The artifact records the actual browser version, sampling trace and either observed click or no click within the existing timeout. Neither suppression nor delivery is a required diagnostic outcome. Diagnostic errors/outcomes never replace or alter the nine-scenario acceptance results, and the final gate remains fail-closed.

Local model/unit checks cannot validate native gesture delivery. Exact-head Chromium 145 CI must establish whether this gesture shape works there; physical-phone acceptance is still required separately. The private hosted prototype was never updated with the rejected runtime candidate and remains the accepted version. No merge or deployment is implied.
