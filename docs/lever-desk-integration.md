# Standalone lever desk integration (Draft PR)

## Frozen transfer and discovery

Accepted private prototype commit: `def1b2afcdcbefc432b9a9effa6ce4cc88694d07`.
Input review ZIP SHA-256: `3a5d23930a3d89b89ff73e3eae02b5de28cd3ef501a231ac286bcdb22bdde1e7`.
Official integration base: `fa25f2d71c3030bccd435e6316c7a5de2de43ed4`.

The ten original runtime files are copied to `tools/lever-desk/`. The sole reversible exception is insertion of `<link rel="canonical" href="https://www.bhcs.com.tw/tools/lever-desk/">` immediately before the existing stylesheet link. No runtime labels (including the accepted prototype label), logic, CSS, teaching sequence, model, storage behavior, artwork or crop are changed. The inventory and its digest are pinned by the integration test; original prototype and independent audit tests retain assertions with repository-local path adaptations only.

Only `standalonePublic` registers this route. It receives no shared research shell, analytics adapter, legacy page replacement or iframe. Existing lever pages and shared science bundles remain unchanged, as do buoyancy, lens and microscope runtimes. Unchanged builders regenerate the science index, resource directory and sitemap. Counts change exactly +1: science 55→56, junior science 54→55, physics 36→37, all resources 214→215. Count assertions are incremented, not removed.

The canonical describes the proposed official route, not evidence of merge or deployment. This change is for Draft PR review only; it does not authorize merge or production release.

## Artwork and origin-specific records

The teacher image remains the exact official PNG, SHA-256 `2851a4bdd0a6523fad5db15c8a197c17ac191bd70000c051513b5e317589f23b`, Git blob `0aaa1b8ff727b271b363e6ff5d3106dc098e38c1`, dimensions 948×1659. Its original provenance JSON travels unchanged. The portable duplicate deliberately avoids runtime coupling to another application.

**The private prototype and official website are different origins. Records do not transfer automatically.** The catalog disclosure also states this. There is no import, cross-origin migration or account sync in this integration.

The new station retains exactly `bhcs.leverDesk.v1`. All legacy `bhcs-science-v2-*` keys remain independent and must not be read, overwritten or deleted. Corrupt/unsupported data is preserved byte-for-byte with zero hydration writes; guarded backup/reset remains unchanged. Original evidence and classification are preserved through later movement and reload. Browser memory/storage is not a cloud backup.

## Reproduction and evidence

```sh
npm ci --prefix scripts
node scripts/build_microscope.mjs
node scripts/build_science.mjs
node scripts/build_site.mjs
python3 scripts/build_shell.py
python3 scripts/build_resources.py
node scripts/build_math_brand.mjs
python3 scripts/build_sitemap.py
npm run test:lever-desk --prefix scripts
python3 scripts/check_resources.py
npm test --prefix scripts
NODE_PATH=/tmp/bhcs-composition/node_modules node scripts/check_lever_desk_browser.cjs
```

The supplemental jsdom lifecycle preload tracks fixture-owned Node timers and clears them only when that fixture closes, matching browser window teardown. Original test assertions and path-only reverse-hash checks remain unchanged. A separate lifecycle regression verifies timers execute while the fixture is open and are cancelled only after close; no exception handler suppresses failures. This harness adaptation is separate from the frozen runtime and the path-only original test ports.

Run all seven builders twice to check stability. Stage/commit all deliverables before the aggregate test because repository-wide `git grep` gates do not see untracked files. The integration test covers byte freeze, canonical inverse, import/resource graph, nested-route HTTP/MIME, teacher provenance and additive discovery/CI boundaries. The HTTP fixture proves only its local responses, not production hosting/CSP.

The browser checker is additive to existing `science-stations`, with screenshots and JSON results in the `lever-desk-review` artifact. All eight prerequisite jobs and the fail-closed CI Gate remain required. It exercises desktop 1280 and touch 360/390/412 widths, sequential and direct task flows, dense six-weight tray round trips, measured target/label geometry, rapid input, record reload, corrupt-storage guards, legacy-key isolation, keyboard and reduced motion. Print checks apply where the runtime offers printing.

Pure model/layout and jsdom tests are not browser layout or physical touch proof. Chromium/CDP touch is not a physical phone, Safari or Firefox certification. The exact remote commit's full CI, browser artifacts and independent review must establish merge readiness; focused local passes do not establish deployment or production MIME/CSP.
