# 凸透鏡五種成像實驗 — independent Draft integration

## Scope / review boundary

- Baseline: `YenYu-bot/bhcs-web@141f47d9db2ca86ebbb542ab7a77db1c01c79a3e`.
- Accepted prototype: `05afe33bfd82d59a2b1da6d3f9618ecfb85e1556`; exactly 12 `dist/` runtime files copied into `tools/lens-25d/`.
- Only runtime exception: replace the prototype `noindex,nofollow` meta tag with canonical `https://www.bhcs.com.tw/tools/lens-25d/`. The source manifest test reverses that exact replacement before hashing. No runtime behavior, artwork, or wording changes.
- Draft only: no merge, deployment, access changes, backend, plugins, or new storage. Existing `tools/science/optics.html`, `optics-guided.html` (including noindex), original optics modules, microscope 3D and all other stations remain unchanged.
- “試作” / “非完整課程” prototype labels intentionally remain pending editorial review; not silently rebranded.

## Discovery and data disclosures

`standalonePublic` in `scripts/science/catalog.mjs` is the authoritative registration. `build_science.mjs` renders science and resource discovery without injecting the legacy research shell into the standalone route. Counts: science 53 → 54; total resources 212 → 213; junior science 52 → 53; physics 34 → 35. Existing count-contract assertions remain, updated only by +1.

The prototype retains latest valid record per condition plus append-only observation history, actual observations separate from theoretical values, conditional model/learning content, and record-dependent answer invalidation. Records and answers live only in page memory; reload resets them. A copied but unreachable frozen `persist.js` does not enable persistence. The active module graph is checked for network/storage APIs. Global counts remain covered by the existing resource checker and circuit-site contract, rather than a second hardcoded lens-specific count contract.

## Reproduction / CI

```sh
npm ci --prefix scripts
node scripts/build_science.mjs
python3 scripts/build_resources.py
python3 scripts/build_sitemap.py
npm run test:lens-25d --prefix scripts
NODE_PATH=/tmp/bhcs-composition/node_modules node scripts/check_lens_25d_browser.cjs
```

- The 37 original prototype tests are ported unchanged in assertion scope under `scripts/lens-25d/`; import/dependency paths change, and the six frozen-module byte-equality assertions become equally strict SHA256 assertions against accepted copied-source hashes in `scripts/lens-25d-runtime.json`. These do not freeze future changes to the separate legacy modules.
- Boundary test checks exact 12-file source hashes and metadata exception, isolated discovery, sitemap, local import/cache-key resolution, active graph, and local HTTP/MIME responses.
- `npm test` adds the lens chain before all existing tests. Browser check is additive to `science-stations`, with `lens-25d-review` artifacts, and remains covered by the unchanged fail-closed CI Gate and all eight required jobs.
- Browser checker exercises the nested official path with Playwright Chromium, desktop and emulated mobile inputs. This is not an Android physical-device claim or production deployment test.

## Local evidence and limits

Implementation uses an exact-blob-verified partial checkout, not a full Git ancestry. Applicable science/resources/sitemap builds were run twice with identical file contents. The external local harness supplies baseline Git lastmod dates (and the planned commit date for changed HTML) when running the unchanged sitemap builder. Local files outside this PR are not publication inputs; remote publication must preserve the complete baseline Git tree.

One-time isolation review verifies 55 protected legacy blobs against main (recorded in `protected-baseline-review.json`, not enforced forever by CI).

37 prototype tests, lens boundary HTTP checks, old microscope integration boundary checks, and resource-link checks pass locally. Full `npm test` is not claimed: unrelated test/source files are absent in this partial checkout. Existing `test_ci_workflow.mjs` passed its first five assertions then stopped at a missing unrelated browser-check script. The remote full checkout and exact-head CI remain the aggregate authority.

## Claude review handoff

Review the frozen source manifest, metadata reversal, active module graph, +1 catalog/count diff, unchanged old routes, 37 original assertions, browser failure evidence, and exact-head CI results. Do not weaken old gates, synthesize ideal observation records, or merge/deploy from this draft authorization. No Site identity files, prototype QA directories, or private user photos are transferred.
