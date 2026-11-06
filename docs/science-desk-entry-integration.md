# Three science desks: additive public entries

## Scope

Based on main `10598e94b905bdc81c2087cd791ec28c909cce1c`, add the accepted metal activity desk and make the existing specific heat and solubility desks discoverable. The three new/old topic pairs are adjacent in the science catalog and resources page. Navigation is reciprocal. The catalog grows from 60 to 63 entries, resources from 254 to 257, junior-high science from 59 to 62, and physics/chemistry from 41 to 44.

The legacy metal experiment keeps magnesium and silver. All three older experiment bodies and scripts remain byte-identical after removing the exact new navigation block. New desks preserve their own browser-local records; no private-origin or legacy-record migration is introduced. Five previously unlisted guided prototypes remain unlisted and noindex.

## Source preservation

- The metal runtime is an exact reversible port of accepted source `ffd20ffb02d67f48084acaed66785eb0336905c2`: 20 runtime files and 14 original tests. Only index metadata/navigation/copy and test import paths change. See the separate metal source manifest.
- Specific heat and solubility runtime manifests are unchanged. Their integration checks reverse only the explicit navigation and robots changes before checking all original hashes.
- Six existing HTML files have exact before/after blobs added to the existing protected-file approval chain: directory, three legacy pages, and two desk indexes. All other tools/assets remain protected. The three changed discovery sources have a separate exact manifest because the tools/assets approval mechanism does not allow source/root-page paths.
- The resource page's executable inline scripts are independently pinned to the original main SHA256 values. Counts and new resource markup do not permit a change to search behavior.
- `build_science.mjs` owns generated legacy navigation and both catalogs. `build_resources.py` derives counts. `build_sitemap.py` remains unchanged and adds only the three newly indexable desk URLs.

## CI and tests

All existing jobs and checks remain. The new required `metal-activity` job runs original tests/provenance and a native Chromium journey. The `site` job additionally checks search, navigation and browser history for the three entry pairs. CI Gate requires all 11 job categories, including all four math-regression shards; failure, cancellation, skipping or a missing result cannot pass. Both new browser checks preserve artifacts for 14 days.

Existing tests that pin catalog/resource totals now expect the exact new totals. Seven earlier integration contracts include the additional required job. The original source manifests and scientific tests are not replaced with fresh baselines.

## Candidate verification before the first PR CI

- Metal original suite: 189 passed, zero failures/skips; source provenance and module syntax verified.
- Three-entry static checks: 63 entries, topic adjacency, reciprocal links, old-page byte identity, magnesium/silver and five unpublished prototypes passed.
- Resource checks: all 257 destinations valid, no duplicate href; existing resource-disclosure/search checks passed after restoring the unchanged original inline script.
- Workflow contract: 20 checks passed, including negative tests for each required job's failed/cancelled/skipped/missing result.
- All seven builders were executed. The local restored history is shallow: sitemap dates for unchanged URLs were retained from the original main sitemap, and changed/new URLs initially used the current UTC date. The first full-history CI exposed the commit-date difference; the eight changed/new URLs now use the actual recorded Git commit date, 2026-11-07. The sitemap builder itself remains unchanged.
- Full local `npm test` stopped at a protected-file check because the restored checkout cannot materialize an unrelated large binary, `tools/moon-phases/img/earth.png`. The PR retains that exact original Git blob and does not delete or change it. This is not a full local-suite pass. Individual independent checks are supplementary only.
- Local native Chromium could not start because the execution environment rejected a socket operation. No browser scenario passed locally. Formal exact-head CI must execute and validate the new browser scripts and their artifacts.

CSS viewport simulation is not physical-phone, Safari/WebKit or assistive-technology acceptance. A passing CI run does not change this limitation. Draft publication does not authorize merge or deployment.

## First formal CI and follow-up

Draft PR #214 was opened at `208e78179d3a41d07fbad7abc7fad1cc7a2b2b23`. [CI run 42284151443](https://github.com/YenYu-bot/bhcs-web/actions/runs/42284151443) actually executed the metal suite: 189 tests and all 14 native Chromium scenario groups passed, with six artifact files. The core job stopped at the sitemap commit-date difference before its aggregate npm suite. The entry browser check exposed a real navigation defect: the legacy researcher runtime moved the main-child navigation into its hidden challenge screen. The follow-up keeps the exact marked navigation outside that runtime-owned main element and tests visibility across the legacy screens; it does not force-click hidden links or relax visibility checks. These are results for the first head only. Every follow-up head must complete its own formal CI before acceptance.
