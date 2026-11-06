# Metal activity evidence desk: additive official-site port

## Scope and provenance

This is an additive port of accepted source commit `ffd20ffb02d67f48084acaed66785eb0336905c2` to `https://www.bhcs.com.tw/tools/metal-activity-desk/`. Keep `tools/science/metal-activity.html` intact as the broader free-exploration experience, including magnesium and silver. Neither this staging package nor its checks deploys or merges anything.

The 20 runtime files map one-to-one from source `dist/` to `tools/metal-activity-desk/`. All modules, three original stylesheets and three images are byte-for-byte identical. Only `index.html` changes: self-canonical metadata, removal of trial labeling, three contextual links, an origin/storage notice and CSS scoped to the two added navigation/notice classes. No runtime selectors, scientific behavior, storage format, migration, review, focus handling or locks change.

`metal-activity-desk-source-manifest.json` records source and target SHA256 hashes for every runtime file and all 14 original test files. It records each exact reversible index substitution and the sole test path substitution. `scripts/check_metal_activity_desk_source.mjs` verifies target hashes, exact original hashes after reversal, and complete file inventories. Intentional future runtime changes require explicit review and new provenance, rather than silently updating hashes.

## Student experience retained

- Original Zn/Fe/Cu with CuSO4, followed by all nine Zn/Fe/Cu × CuSO4/FeSO4/ZnSO4 combinations. Reusable cups retain immutable observation records and evidence links.
- Positive direct Zn/Fe and Fe/Cu evidence is needed for Zn > Fe > Cu. No visible reaction alone does not establish a ranking; salt experiments do not generate gas.
- Separate dilute HCl records for Zn, Fe and Cu. The H > Cu relationship is explicitly adopted reference knowledge, never an inference from copper's lack of bubbles. Hydrogen is a comparator, not another metal.
- Three linked electron-model stages, paired oxidation/reduction, conserved particle identities, material tracking and limits of the qualitative model.
- Three student explanations cite retained observations and require explicit checks. Changing a source or answer invalidates its prior check; removing adopted reference knowledge invalidates the reference explanation.

## Persistence boundary

The original current key `bhcs-metal-inquiry-v4` and original V1–V3 migration keys remain unchanged. Different origins do not share localStorage, so private prototype records do not automatically migrate to the official domain. The existing official free-exploration page uses separate storage. New and old experiences coexist without record imports or deletion of unrelated keys.

The current app uses native Web Locks for single-writer protection and fails closed when unavailable. Corrupt experiment data is not silently overwritten. V1/V2 migrate to blank later chapters; V3 retains acid/electron work with blank review; V4 retains normalized review. Full reset first writes a fresh current snapshot, then removes only the named legacy backups after a successful write. No server or cross-device sync is added.

## File integration

Copy these new paths to the repository root without replacing unrelated files:

1. `tools/metal-activity-desk/` (20 runtime files).
2. `scripts/tests-metal-activity-desk/` (14 unchanged original test files apart from `../dist/` → `../../tools/metal-activity-desk/`).
3. `scripts/check_metal_activity_desk_source.mjs`.
4. `scripts/check_metal_activity_desk_browser.cjs`.
5. `docs/metal-activity-desk-source-manifest.json` and this document.

The browser script is provided separately alongside this document. Do not copy generated artifact directories, node_modules, temporary tooling or local test logs into the application tree.

## Package and workflow instructions

These are instructions for the integration owner; this package does not modify package.json, lockfiles or workflows.

Add the `scripts/package.json` script `test:metal-activity-desk` with command:

```
node check_metal_activity_desk_source.mjs && node --test tests-metal-activity-desk/*.test.mjs
```

From repository root:

```
npm run test:metal-activity-desk --prefix scripts
node scripts/check_metal_activity_desk_browser.cjs
```

Use the repository's pinned Playwright and native Chromium installation convention (`NODE_PATH=/tmp/bhcs-composition/node_modules`), with an independent required `metal-activity` CI job and output `metal-activity-desk-artifacts/`. The job must run both the provenance/unit command and the native browser script, and fail if Chromium is unavailable or any assertion fails. Add it to the required gate only with the integration owner's coordinated gate update. Upload browser artifacts on success and failure. A unit-test or syntax pass must not be substituted for a native browser pass.

## Verification and limits

The port's original Node suite was executed locally: **189 passed, 0 failed, 0 skipped**. The provenance verifier passed for all 20 runtime files and 14 original tests. Every runtime JavaScript module passed `node --check`.

The local browser launch was blocked before any scenario by the managed execution environment (`socket() failed: Operation not permitted`, Chromium SIGABRT). No browser scenarios passed locally. No browser installation, escalation or retry was used; execution of this script in official CI remains required.

Browser results must be reported from the actual executable run and its report. The browser CI covers public UI journeys, storage fault injection/migrations, actual same-origin tabs and Web Locks, reset paths and legacy official-key sentinels. Mobile coverage is Chromium CSS-viewport simulation, not physical phones, Safari/WebKit or assistive technology. Fault injection is explicitly marked and does not replace the native browser or production runtime.

Final merge and deployment require separate approval. Reversing this additive port removes only the introduced files and coordinated links/check registrations; the existing old activity remains available throughout.
