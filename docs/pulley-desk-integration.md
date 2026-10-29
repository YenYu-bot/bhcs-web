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
