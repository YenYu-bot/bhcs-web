# 余老師的浮力量測站 — standalone Draft integration

## Scope and frozen source

- Repository baseline: `01c3730aa0c332481eb6b68fdcaea5323e5e6533` (full Git checkout).
- Accepted prototype: `e53f18b5b3e6d2356574e8db8a9c1947fce6e4ff`; exactly 10 `dist/` files copied to `/tools/buoyancy-lab/`.
- `scripts/buoyancy-lab-runtime.json` records the original byte counts and SHA-256 hashes. The boundary test pins this historical inventory independently and reverses only one exact canonical insertion in `index.html` before checking original bytes. Source had neither a robots tag nor a canonical: nothing is removed. No model, interaction, visual, text or storage behavior is changed.
- Do not silently regenerate historical hashes to accommodate drift. Any future runtime exception needs explicit review, separately pinned bytes and behavioral tests.
- Private Site identity (`.openai/hosting.json`), Git metadata, release archives and QA screenshots are excluded. Test-only old app bytes are retained solely under `scripts/buoyancy-lab/pre-review-app.mjs.bak` for the negative-control regression; they are never runtime imports.
- This remains a static buildless ES-module application. No backend, login, analytics, CDN, global storage migration or new dependency is introduced. Prototype labels are deliberately retained.

## Discovery and isolation

Only `standalonePublic` in `scripts/science/catalog.mjs` registers this route. It is not a legacy/researcher/batch app and must not receive `researcher-lab`, `science-events` or `site.js`. Existing `tools/buoyancy-density-lab.html`, `tools/science/buoyancy-guided.html`, their models, assets and tests remain intact, as do microscope and lens integrations.

Unchanged builders regenerate `tools/science/index.html`, `ziyuan.html` and `sitemap.xml`. Expected count changes are exactly +1: all science 54→55, junior science 53→54, physics 35→36, all resources 213→214. Existing circuit-site count assertions are updated, not removed. No unrelated generated drift should be committed.

The canonical points to `https://www.bhcs.com.tw/tools/buoyancy-lab/`. It describes a proposed official route, not evidence that the Draft PR has been merged or deployed.

## Teacher asset and model

`img/teacher-body-v3.png` is an exact portable copy of the official `tools/microscope-3d/img/teacher-body-v3.png`, retaining its provenance JSON. Git blob `0aaa1b8ff727b271b363e6ff5d3106dc098e38c1`, 948×1659; SHA-256 `2851a4bdd0a6523fad5db15c8a197c17ac191bd70000c051513b5e317589f23b`. The accepted shoulder viewport crop is unchanged; no image regeneration or raster edits. The ~941 KB duplication intentionally avoids coupling this portable runtime to another route. Project-owned artwork is not relicensed.

Active model `buoyancy-1.2-g10` remains g=10 N/kg. Water: W=1.350 N, T=0.850 N, displaced mass=50.0 g, both forces=0.500 N. Brine: W=1.350 N, T=0.750 N, displaced mass=60.0 g, both forces=0.600 N. Exact integer-mN validation and original-evidence immutability remain unchanged; explanation edits append revisions. This is a teaching model, not calibrated physical measurement or mastery certification.

## Storage / origin boundary

Records remain only in this browser and website origin. **The private prototype Site and bhcs.com.tw have different origins: prototype records do not automatically transfer to the official site.** This is also disclosed in the discovery description. There is no cross-origin importer, login sync or migration.

Within an origin, the accepted `yu-buoyancy-prototype-v1.2-g10` current key and `yu-buoyancy-prototype-v1.1` read-only legacy archive contract are preserved. Valid records/drafts may restore, never a half-finished physical state. Hydration performs no write/probe; denied/corrupt/schema-invalid storage remains raw-preserved and memory-only until an explicit confirmed current-key reset succeeds. Legacy raw bytes are never overwritten/deleted. Normal editing never changes original evidence. Clearing current records cannot clear unrelated site keys.

## Reproduction and gates

```sh
npm ci --prefix scripts
node scripts/build_microscope.mjs
node scripts/build_science.mjs
node scripts/build_site.mjs
python3 scripts/build_shell.py
python3 scripts/build_resources.py
node scripts/build_math_brand.mjs
python3 scripts/build_sitemap.py
npm run test:buoyancy-lab --prefix scripts
python3 scripts/check_resources.py
npm test --prefix scripts
NODE_PATH=/tmp/bhcs-composition/node_modules node scripts/check_buoyancy_lab_browser.cjs
```

The 110 prototype/audit tests are ported with only repository-local import resolution and existing jsdom dependency resolution. They include an actual-DOM negative control detecting the old current-card/legacy-flag bug. DOM mocks are not layout/browser certification.

The new integration test checks frozen bytes, metadata inverse, discovery/isolation, teacher provenance, local resource graph and nested-path HTTP/MIME. Its HTTP server demonstrates local responses, not production hosting or CSP.

Browser acceptance is additive in the existing `science-stations` job; screenshots/results go to `buoyancy-lab-review`, retained 14 days. All eight required jobs and the existing fail-closed CI Gate remain unchanged. Existing guided buoyancy, microscope, lens, site and math gates remain required. The final exact remote commit's CI is the release evidence; a local focused pass is not a whole-site pass.

Review browser evidence for water→save→reload→brine→comparison, brine-only feedback, revision/evidence separation, denied/corrupt/quota/reset storage guards, keyboard and repeated input, pointer interruption/blank-space scrolling, teacher asset, 360/390/412/1280 widths and 200% root font. Chromium/CDP emulation is not a physical Android/iPhone test or Safari/Firefox certification. Production MIME/CSP and real touch devices remain separate pre-release checks.

## Authority and rollback

This authorization is for a branch, Draft PR, tests and review only: no merge, deployment, access changes or publication of the private Site. Rollback is isolated: remove the standalone catalog entry and regenerate discovery/counts; if withdrawing the route, remove its directory/canonical before regenerating sitemap. Do not alter the old buoyancy tools or shared framework.

## Local evidence (2026-10-27)

- Installation used the repository lockfile (`npm ci`); only the local npm cache location needed an explicit writable `/tmp` directory. No dependency/lockfile changes.
- The full seven-builder core sequence ran twice with identical resulting Git diffs. Runtime frozen-source checks passed after generation.
- All 110 ported prototype/audit tests passed. New boundary test passed 19 local HTTP/MIME responses and eight relative references. Existing CI-workflow contract: 11 passed.
- Resource checker: 214 links, no duplicate href, all local targets/topic keys valid. Science integration: 135 HTML pages / 1,982 local references / 124 sitemap URLs. Researcher batch 1–5 and full 42-station audit passed.
- A one-time full-checkout diff review found every existing tracked file outside the exact seven intended integration/generated files byte-identical to baseline, including all old buoyancy, lens and microscope runtime files and all builders.
- Local runtime is Node 24; CI uses pinned Node 22. No local browser run was performed. The new browser checker passed syntax validation only; its real Chromium outcomes must be established by exact-head remote CI. Do not infer physical-device results.
- Full `npm test --prefix scripts` completed successfully (exit 0), including all retained prior suites; its final math drill test passed 3,954/3,954 combinations across 102 topics (zero failures). Separate browser jobs and the dedicated math-regression/diversity CI jobs are still remote-CI gates, not covered by that local command.
