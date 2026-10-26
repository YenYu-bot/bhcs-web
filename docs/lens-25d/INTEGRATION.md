# 凸透鏡五種成像實驗 — independent Draft integration

## Scope / review boundary

- Baseline: `YenYu-bot/bhcs-web@141f47d9db2ca86ebbb542ab7a77db1c01c79a3e`.
- Accepted prototype: `05afe33bfd82d59a2b1da6d3f9618ecfb85e1556`; its original 12 `dist/` file sizes and hashes remain unchanged in the manifest's `files` inventory. The integration test also pins that historical inventory, so a runtime fix cannot silently redefine the accepted prototype.
- Initial integration exception: replace the prototype `noindex,nofollow` meta tag with canonical `https://www.bhcs.com.tw/tools/lens-25d/`.
- Authorized review revision from `d1844605546a82738f02d8b2e3b5c71e6800503d`: `runtime_revision` separately records the changed `pilot.js` and `five-case.js`, the added `screen-settlement.js`, and the entrypoint cache substitution. This is a behavioral exception, not a metadata-only transfer. Current exception bytes are hash-pinned; the index's exact metadata/cache substitutions are reversed before comparison to its original prototype hash. Artwork, CSS and unrelated copy remain unchanged.
- The six copied `optics-guided/{model,engine,input,visual,challenges,persist}.js` modules remain byte-identical to the accepted prototype. Numeric optics, step sizes and snapping are not reimplemented or relaxed.
- Draft only: no merge, deployment, access changes, backend, plugins, or new storage. Existing `tools/science/optics.html`, `optics-guided.html` (including noindex), original optics modules, microscope 3D and all other stations remain unchanged.
- “試作” / “非完整課程” prototype labels intentionally remain pending editorial review; not silently rebranded.

## Discovery and data disclosures

`standalonePublic` in `scripts/science/catalog.mjs` is the authoritative registration. `build_science.mjs` renders science and resource discovery without injecting the legacy research shell into the standalone route. Counts: science 53 → 54; total resources 212 → 213; junior science 52 → 53; physics 34 → 35. Existing count-contract assertions remain, updated only by +1.

The prototype retains latest valid record per condition plus append-only observation history, actual observations separate from theoretical values, conditional model/learning content, and record-dependent answer invalidation. Records and answers live only in page memory; reload resets them. A copied but unreachable frozen `persist.js` does not enable persistence. The active module graph is checked for network/storage APIs. Global counts remain covered by the existing resource checker and circuit-site contract, rather than a second hardcoded lens-specific count contract.

## Reviewed input and reset contract

Keyboard and left/right-button screen movement remains immediate, but a burst contributes at most its final changed position after 400 ms without another movement input and with no movement key held. Intermediate zones are not observations. Returning to the pre-burst origin earns no credit. Physical keys, auto-repeat and rapid separate clicks share this rule; the adapter does not infer observation from `event.repeat` alone.

Reset, case selection (including reselecting the same case), a changed object distance, leaving the through-lens view, page/focus interruption and pointer takeover invalidate pending keyboard/button work. A generation guard prevents an old timer from crediting a newer condition or an identical-valued reset state. Pointer takeover discards the unresolved keyboard burst; a new changed pointer operation retains the frozen input's release/cancel behavior. Already-recorded snapshots and history remain immutable. The “全部重新開始” control now asks for confirmation before clearing observations and answers; Cancel keeps them.

## Reproduction / CI

```sh
npm ci --prefix scripts
node scripts/build_science.mjs
python3 scripts/build_resources.py
python3 scripts/build_sitemap.py
npm run test:lens-25d --prefix scripts
NODE_PATH=/tmp/bhcs-composition/node_modules node scripts/check_lens_25d_browser.cjs
```

- The initial integration ported 37 prototype checks. The authorized revision adds interrupted/repeated-input and reset-confirmation regressions, and replaces the old UI test's immediate rapid-key search expectation with genuine settled observations. The six frozen-module assertions still use the original prototype SHA256 values; these do not freeze future changes to the separate legacy modules.
- Boundary test checks the unchanged original 12-file provenance, the exact allowlisted behavioral replacements/addition, reversible index metadata/cache exceptions, isolated discovery, sitemap, local import/cache-key resolution, active graph, and local HTTP/MIME responses.
- `npm test` adds the lens chain before all existing tests. Browser check is additive to `science-stations`, with `lens-25d-review` artifacts, and remains covered by the unchanged fail-closed CI Gate and all eight required jobs.
- Browser checker exercises the nested official path with Playwright Chromium, desktop and emulated mobile inputs. This is not an Android physical-device claim or production deployment test.

## Local evidence and limits

Implementation uses an exact-blob-verified partial checkout, not a full Git ancestry. Applicable science/resources/sitemap builds were run twice with identical file contents. The external local harness supplies baseline Git lastmod dates (and the planned commit date for changed HTML) when running the unchanged sitemap builder. Local files outside this PR are not publication inputs; remote publication must preserve the complete baseline Git tree.

One-time isolation review verifies 55 protected legacy blobs against main (recorded in `protected-baseline-review.json`, not enforced forever by CI).

Before the review revision, 37 prototype tests, lens boundary HTTP checks, old microscope integration boundary checks, and resource-link checks passed locally. Those earlier results do not verify the changed input contract. The revised `npm run test:lens-25d --prefix scripts` suite passed locally, including the new input/reset regressions and 35 nested HTTP/MIME checks. DOM/fake-clock checks are not browser input evidence; rerun browser acceptance against the final revised bytes. Full `npm test` is not claimed: unrelated test/source files are absent in this partial checkout. Existing `test_ci_workflow.mjs` passed its first five assertions then stopped at a missing unrelated browser-check script. The remote full checkout and exact-head CI remain the aggregate authority.

## Claude review handoff

Review the original source inventory and explicit runtime exceptions separately, metadata/cache reversals, frozen optics hashes, active module graph, +1 catalog/count diff, unchanged old routes, settled-input/reset regressions, browser failure evidence, and exact-head CI results. Do not weaken old gates, synthesize ideal observation records, or merge/deploy from this draft authorization. No Site identity files, prototype QA directories, or private user photos are transferred.
