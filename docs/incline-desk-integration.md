# Accepted incline desk: Draft integration

## Frozen transfer and boundaries

Accepted owner-private source: `9a699657633ce1f888fe7274305b9870d4089eb9`.
Verified official base: `96064a182edc0380825048823b53fae27c44206f`.

The user reported phone acceptance before authorizing this integration. Device model, browser, operating system and per-scenario records were not supplied; this is not universal mobile certification. Claude is not a dependency. This Draft submission does not authorize merging or public deployment. The later bounded repair authorization below also permits a private-preview update for fresh phone acceptance.

All ten accepted runtime files remain the immutable source baseline in `scripts/incline-desk-runtime.json`. In addition to the explicitly authorized presentation repair below, two inverse-verified index metadata changes are permitted: replace the existing private canonical URL with `https://www.bhcs.com.tw/tools/incline-desk/`, and remove the existing `noindex,nofollow` robots tag. The original transfer changed no teaching copy, visible “私人原型” wording, layout, navigation, physics, geometry, input or storage behavior. The later presentation repair changes only the guidance layout reservation. A subsequent, separately pinned reset UI wiring repair is documented below; physics, engine and storage modules remain unchanged. The source manifest is pinned by SHA-256; all original runtime lengths/digests and all test bodies are checked after reversing explicit path-only test imports. `docs/incline-desk-spec-v1.0.json` preserves the ordered text of the accepted specification, not a newly rewritten specification.

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

## Authorized responsive guide-height repair

Third native run41026977601 (head74db4b1) passed the compensated first short drag but exposed a genuine later defect: after long-ramp redo, the final trusted pointermove changed apparatus viewport top by−24.25px at360 and−23.25px at390/412. Capture-before, bubble-after and animation-frame samples prove this is not setup scrolling. The guide shrank above the apparatus; document movement−47.25px was only partly compensated by scrolling. The1CSSpx continuous viewport guard remains unchanged and correctly rejects this.

On2026-10-30 at08:39UTC the user approved only guidance-height stability repair, unchanged physics/record format/test thresholds, fullCI and updated private preview for reacceptance. `scripts/incline-desk-guide-repair.json` records the precise reversible HTML/CSS-only delta separately from the unchanged accepted-source manifest. Integration first verifies the repair output digests, reverses this delta and production metadata, then checks the original accepted bytes. No accepted-source rebaseline occurred.

The live guide and four invisible reserve copies share one intrinsic CSS grid cell. Moving short/long, endpoint-preview and committed-endpoint text all determine the reserved height at the actual available width and font size. The reserve copies have no IDs, are aria-hidden/inert/visibility-hidden and cannot receive pointer input. They use identical responsive typography, wrap normally, and set no fixed height, overflow clipping or scroll compensation. Cancel returns to a covered moving state. Node tests execute the unchanged actual stageCopy function and compare every reserved text tuple. At the guide-height revision, all JavaScript application modules, physics, storage and navigation remained exact accepted bytes; the subsequent reset UI delta below explicitly records its application-wiring exception.

The browser gate retains its original nine scenarios and every existing viewport threshold and assertion. Additional targeted narrow and doubled-guide-text scenarios cover intrinsic wrapping and native cancellation/commit/redo. Doubled-guide-text is a test-only font-size override, not a claim of native browser zoom or whole-page200% accessibility certification. Candidate nativeCI/private managed-browser results and fresh phone acceptance must be recorded separately before claiming this repair verified.

### Enlarged-text follow-up

Run41028799247 (headbc8b34f) passed all original9 scenarios and320px normal text. Both guide-text200 cases exposed a different failure after long-ramp redo: apparatus document top remained exactly942.015625px/1189.703125px, but scrollY fell98px when the live guide body shrank98px, moving apparatus viewport top down98px. No programmatic scroll call occurred. Thus intrinsic overall height reservation worked, while the changing internal text still supports a native anchoring explanation; internal browser anchor selection was not directly observed.

The bounded follow-up adds only `overflow-anchor:none` to `.teacher-copy`, excluding that changing guidance subtree from native anchor selection. No body/page-wide anchor suppression, counter-scroll, physics/storage change or gate relaxation is introduced. Its exact CSS delta remains recorded against the original accepted source. All12 scenarios and guide-text checks remain required, with identical1CSSpx movement/release thresholds. Candidate CI and privateQA must confirm the effect before claiming resolution.

The same CI artifact also recorded negative SVG dimensions after successful scenario assertions during full-page screenshots. Their root cause remains diagnostic-only and outside this runtime repair. Passive error metadata now records scenario/screenshot phase, observation timestamp and asynchronously sampled viewport/bench dimensions; sample timing is explicitly not guaranteed to equal error emission. The original error list, empty-error scenario assertion and screenshots remain intact, with no suppression or extra runtime fix.

## Authorized reset discoverability repair

On2026-10-30 at23:52UTC the user reported they could not redo an already-completed experiment and requested a reset button. Previously `new-experiment` was hidden inside the page-footer “紀錄管理與模型說明” details. This bounded UI repair moves that existing entry to the introduction as “重置實驗”, with an explicit clearing warning, and adds “重置並再做一次” inside the completion card. Both open the same existing backup/two-stage confirmation dialog; neither clears automatically. Cancel buttons and Escape return focus to the actual launcher. Only the original successful final-clear condition now scrolls/focuses the fresh start button; failed/pending clears retain the prior state and dialog.

`scripts/incline-desk-reset-repair.json` separately pins this exact two-file HTML/application-wiring delta against private4576b998 and official8846562. The original accepted-source manifest and prior guide repair manifest remain unchanged. The integration gate reverses reset, then guide and metadata deltas before verifying original runtime bytes. The original physics, engine, storage, navigation module and all prior tests are unchanged. Six added tests execute the actual reset handlers in a DOM stub, and are ported from the private candidate with only import paths changed. They cover both launchers/stages, Escape, busy protection, pre-confirmation zero-clear, export, acknowledgement reset, successful fresh start, and failed/pending/thrown clear preservation. DOM-stub evidence does not replace native focus/download/reload testing.

The native checker retains all original12 cases and assertions, and appends completed-reload/reset tests to desktop1280 and touch360/390/412 workflows: both accessible entries, clearing warnings, target size, both cancel stages and Escape from each launcher with exact raw/snapshot/write-count preservation and focus return, then explicit acknowledged clear, visible/focused fresh start, persisted empty reload and a new short-ramp step. These new checks require exact-head CI; source/syntax checks alone do not establish native completion.

## Authorized handle colour repair and public Draft sync

On2026-10-31 the user reported that colour did not return after phone operation, then explicitly approved submitting the reset-button and handle-colour fixes to public YenYu-bot/bhcs-web/Draft PR184 and rerunning CI, without merge or official deployment. The handle had matched the generic button-hover selector, whose specificity could override the translucent idle/active rules and whose hover state may persist after touch. The exact CSS-only fix adds `:not(.drag-handle)` to that one generic selector. No handle hover fill exists on mouse, touch or hybrid devices; original pressed/dragging colour and keyboard focus remain. No media-query input guessing or JavaScript changes are introduced by this colour fix.

`scripts/incline-desk-hover-repair.json` pins the separate one-selector delta and the path-only three-test port from privatea5a473f. The original accepted baseline, guide repair and reset repair manifests remain unchanged. Integration reverses hover, reset, guide and metadata changes in order, then checks original bytes. At that combined revision, all10 official runtime files matched that private source except production metadata; the subsequent active-state delta is recorded below. Native colour assertions are added to existing gesture paths so actual computed idle, active and post-release/cancel states must satisfy the same colour contract, alongside all existing movement/storage/reset checks. Static CSS tests and mouse QA are not claimed as actual phone certification; exact-head touch-emulated CI and owner-device feedback remain separate evidence.

### Authoritative drag-state colour follow-up

Run41149114986 (af6b5b0) passed desktop/keyboard/four corrupt-storage cases but failed all three touch cases at the third, reverse/no-op gesture release; the original nine-case fail-fast gate therefore skipped the three stress cases. Pointerup and click had arrived and the handle class=false assertion passed before RGB failed. Earlier cancel and10cm release had returned to idle. The failing computed colour and native pseudo-state were not saved before throwing, so native `:active=true` is not directly proven. With hover excluded and class=false, the remaining native `:active` CSS alias is the supported cause hypothesis.

The bounded CSS-only follow-up removes that alias from both handle rules. Only the existing engine-rendered `.is-dragging` class controls the drag fill/cursor; idle colour and keyboard focus-visible remain, with no input/physics/storage code change. `scripts/incline-desk-active-repair.json` separately records the two-selector inverse and the exact old/new CSS regression test texts, preserving all earlier manifests and their source provenance. The original idle/active RGB and alpha thresholds, native gesture inputs, release/cancel assertions and fail-closed12-case gate are unchanged. Every feedback assertion now includes the already-read computed state, native hover/active flags and expected RGBA in its failure message, without waiting or retrying. Candidate nativeCI must pass before private publication; static tests do not prove touch completion.
