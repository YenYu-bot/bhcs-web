# Accepted incline desk: Draft integration

## Frozen transfer and boundaries

Accepted owner-private source: `9a699657633ce1f888fe7274305b9870d4089eb9`.
Verified official base: `96064a182edc0380825048823b53fae27c44206f`.

The user reported phone acceptance before authorizing this integration. Device model, browser, operating system and per-scenario records were not supplied; this is not universal mobile certification. Claude is not a dependency. This Draft submission does not authorize merging, public deployment or changing the private Site.

All ten runtime files are preserved in `tools/incline-desk/`. Exactly two inverse-verified index metadata changes are permitted: replace the existing private canonical URL with `https://www.bhcs.com.tw/tools/incline-desk/`, and remove the existing `noindex,nofollow` robots tag. No teaching copy, visible “私人原型” wording, layout, navigation, physics, geometry, input or storage behavior changes. The source manifest is pinned by SHA-256; all original runtime lengths/digests and all test bodies are checked after reversing explicit path-only test imports. `docs/incline-desk-spec-v1.0.json` preserves the ordered text of the accepted specification, not a newly rewritten specification.

The original 30 tests and 17 independent contract groups (including the 122-position oracle) are ported without weakening assertions. The existing canonical teacher PNG and its provenance are unchanged. The new integration gate additionally pins 218 published runtime/asset files and verifies every existing tools/assets Git blob (except the generated science directory) against the official base. Existing tests change only exact expected additive discovery counts.

## Discovery and behavior

Only standalonePublic registers the new route. No legacy page replacement, research shell, analytics loader, shared application import or cross-origin storage migration is added. The unchanged builders generate the new entry and counts: science58, junior science57, physics39, all resources217, sitemap127. The earlier pulley/incline activity and all standalone desks remain available.

Same 10 N box rises20 cm along40/80 cm measurement paths; ideal forces5/2.5 N; both input/output works2 J. Students collect two original records and calculate four answers before recording an explanation. Model assumes ideal constant-speed motion without friction or acceleration. Explicit next-ramp/redo transitions return to the apparatus; movement itself does not scroll. The singleton `bhcs.inclineDesk.v1` and Web Lock save contract are unchanged. Private-site records do not automatically appear on the official origin; the catalog explicitly explains this.

## Gates and reproduction

The new real-browser checker is additive in `science-stations`; its artifact is `incline-desk-review` with14-day retention. The unchanged eight prerequisite jobs and fail-closed CI Gate still require every result to be success. Original pulley, lever, buoyancy, lens, microscope and general research checks remain.

```sh
npm ci --prefix scripts
node scripts/build_microscope.mjs
node scripts/build_science.mjs
node scripts/build_site.mjs
python3 scripts/build_shell.py
python3 scripts/build_resources.py
node scripts/build_math_brand.mjs
python3 scripts/build_sitemap.py
npm run test:incline-desk --prefix scripts
python3 scripts/check_resources.py
npm test --prefix scripts
node scripts/check_science_integration.cjs
NODE_PATH=/tmp/bhcs-composition/node_modules node scripts/check_incline_desk_browser.cjs
```

Run the seven builders twice and verify second-pass identity. The integration test serves only a local nested route and checks all assets/MIME; it is not production/CSP evidence. Native Chromium/CDP browser checks, Node contracts, prior desktop-resize QA, and user phone acceptance are separate evidence categories. Exact-head full remote CI must establish Draft readiness; no local result implies a merged or deployed official route.

### Evidence limits and inventory design

The first aggregate run rejected a protected-file manifest that mentioned unpublished guided stations outside their strict visibility allowlists. No visibility test or exception was weakened. The manifest instead reuses the existing published-runtime protection scope plus the pulley runtime, and the integration gate independently hashes every existing `tools/` and `assets/` blob against the verified base commit. Only the generated science index may change. This is stronger coverage without introducing public cross-references to unpublished activities.

The nine new Chromium scenarios cover mouse1280 and CDP touch360/390/412 full journeys, four isolated corrupt-storage button journeys, and native keyboard movement with desktop reset checks. The keyboard scenario uses mouse for transitions/save/reset, so it is not a full keyboard-only journey. Reset is not claimed on touch. Input injection uses native browser mouse/keyboard/touch APIs, rendered flag coordinates, passive delivery probes and a stationary endpoint before release; no application state setter or repeated save tap is used. The checker has not run locally; syntax and independent code review cannot replace exact-head CI. Prior private phone acceptance remains a user report rather than a detailed cross-browser record.

## Local submission evidence (2026-10-30)

- Seven builders and exact second-pass diff identity: passed.
- Focused frozen transfer / local HTTP, original30 tests and independent17 groups: passed.
- Full `npm test --prefix scripts`: exit0, including all scientific/visibility suites and math3,954/3,954 combinations (102 topics); no candidate verification failures or exceptions.
- Resource217 links, science integration138 HTML/2,000 references/127 sitemap URLs, and researcher batches1–5: passed.
- New browser checker syntax and independent code review: passed. Real Chromium execution: **never run locally**; require exact-head CI, no claim of native-browser pass here.

## Native CI boundary corrections and viewport evidence

The first native run 41024359902 reached long-recorded UI but read only the earlier short-record write. The saved-status label could remain unchanged while the new asynchronous Web Lock was pending. Passive lock-request/write completion now establishes a fresh current-action persistence boundary before the unchanged record assertions. Run 41025813862 then passed desktop, keyboard and all four corrupt-storage scenarios, confirming that correction in native Chromium.

The three touch scenarios stopped at the old absolute-scrollY equality. Failure-time geometry in run 41025813862 (head 0251a30) showed:

- 360px: apparatus document top608.234375→560.984375; scroll608→561; viewport top0.234375→-0.015625.
- 390/412px: document top583.734375→536.484375; scroll584→536; viewport top-0.265625→0.484375.
- Guide body height73.5→49 at the endpoint render; no observed native programmatic scroll API calls. Across all 28 observed samples per touch scenario, apparatus x/size stayed fixed and maximum viewport shift was0.25/0.75/0.75 CSSpx.

This is evidence of compensated layout consistent with browser scroll anchoring, not a browser-internals trace. The document and integer scroll offsets changed while the apparatus remained visually stationary. Full-page failure screenshots cancelled the gesture, so the pre-screenshot audit, not the later picture, establishes these numbers.

Exactly two pointer-drag assertions are replaced: absolute scrollY equality during movement and after release. The replacement checks every observed native capture/bubble/frame/scroll sample and an assertion-boundary sample from the gesture baseline through release. Apparatus viewport x/y/width/height must remain within one CSS pixel (integer scrolling against fractional layout); document and scroll deltas must compensate within that same limit, and there must be zero programmatic scroll API calls during the gesture. Raw geometry remains in artifacts. This is the intended no-visible-jump contract, not permission for a 47px viewport movement. The separate keyboard scroll assertion and every other existing assertion remain unchanged. It is therefore **not** claimed that all original 99 assertion expressions are still verbatim.

Six regression tests replay observed compensated geometry and reject actual47px movement, >1px shifts, intermediate jump-and-return, explicit programmatic scroll despite apparent compensation, horizontal/size changes, missing/nonfinite samples and release-only jumps. Runtime and 9/9 fail-closed requirement remain unchanged. Next exact-head native CI must establish complete touch journeys after this evidence-backed checker correction.
