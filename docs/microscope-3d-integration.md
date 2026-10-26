# Standalone 3D microscope integration

## Scope and source

- Route: `/tools/microscope-3d/`; public discovery title **3D顯微鏡操作與比較**, 國中／生物／觀察工具／互動模擬.
- Accepted source: independent `bhcs-microscope-3d` commit `185c99467c03b40fb0bda04d0bfcfccb21914e07` (`dist/`). Includes 40 runtime files; excludes the test-only `qa-frame.html`, private hosting identity, QA images, source-package archives and review notes.
- All runtime bytes are preserved, with one explicit exception: `index.html` gains the canonical URL above. The original source SHA-256 manifest lives in `scripts/microscope-3d-runtime.json`; the integration test removes only that exact metadata addition before checking the index hash. No optical formulas, task-2 threshold of 12 model units, drawing, styles, pointer contracts or asset cache keys were changed.
- This is not a replacement for `tools/microscope-lab.html`, its builder or its regression tests. It does not include PR #177. The standalone tool's memory-only notes do not share legacy storage or research-station lesson evidence.

## Discovery and rebuilding

`standalonePublic` in `scripts/science/catalog.mjs` supplies the science directory and resource page. It is included only in the discovery list, never in `legacy`, `firstBatch`, `researcherLegacyFiles` or batch-2 generation. Do not inject `researcher-lab`, `science-events`, `site.js` or the legacy page shell into this app.

Run the normal repository build/check workflow. Relevant commands:

```sh
node scripts/build_microscope.mjs
node scripts/build_science.mjs
node scripts/build_site.mjs
python3 scripts/build_resources.py
python3 scripts/build_sitemap.py
node scripts/test_microscope_3d_integration.mjs
NODE_PATH=/tmp/bhcs-composition/node_modules node scripts/check_microscope_3d_browser.cjs
```

The frozen runtime needs no bundler or network dependency. For a future runtime update, review the new source commit, copy only runtime assets, regenerate the manifest and run these checks; do not silently edit the pinned hashes to hide drift. Existing legacy tests remain in the normal `scripts/package.json` test chain. The new browser check is additive in the existing `science-stations` CI job and retains its existing gate/dependencies.

## Attribution and licenses

- Three.js 0.180.0 is vendored; retain `vendor/THREE-LICENSE.txt` (MIT). `SVGRenderer.js` is a modified compatibility renderer (local imports and hand-drawn two-band/ink treatment), not an unmodified upstream file.
- Local Noto Sans TC and Zen Maru Gothic font subsets retain their two SIL OFL licenses under `fonts/`. No font CDN is required.
- Apparatus/props are original procedural geometry; teacher artwork and image layers were supplied for this project. No reference-site artwork is copied. This integration does not apply a new open-source license to project-owned code or artwork.
- The compound drawing/model derives from the project's existing microscope model; stereo view, illumination and notebook contracts remain the accepted independent implementation. Its single screen is not actual binocular stereopsis, and lighting is a qualitative teaching model, not lux or calibrated optics. References and limitations remain in the tool.

## Verification boundaries and release checklist

The integration test verifies the exact runtime inventory/hashes, isolated discovery, license retention, canonical/sitemap entry, every statically discoverable relative resource and cache key, and a local nested-path HTTP/MIME round trip. Its MIME check describes the test server, not production hosting or CSP. Browser regression runs actual Chromium mouse/CDP-emulated touch; that is not a physical Android/iPhone or Safari certification.

Before any separately authorized production merge/deployment, review the full CI Gate, actual hosting CSP/MIME and browser console, real Android/iOS including embedded browsers, rotation/two-finger/cancel, keyboard and Safari/Firefox, and CSV download behavior. No existing verification report should be treated as all-site certification. A prior external review reported 43/43 Chromium/CDP-touch checks for the accepted source; that remains external evidence, not a new physical-device result.

Rollback is isolated: remove the standalone catalog entry and regenerate discovery/counts. If withdrawing the route too, remove the new directory (or mark its index noindex) before regenerating the sitemap. Leave the original 2D microscope and shared research framework untouched.
