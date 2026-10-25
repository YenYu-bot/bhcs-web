# Public microscope complete learning contract

## Ownership and scope

The public page remains `tools/microscope-lab.html`. Its optical model and drawing calibration are unchanged. `scripts/science/microscope-learning.js` owns only the new lesson controller and is injected inside the page closure between the microscope-learning markers by `node scripts/build_microscope.mjs`. Edit that source, not the injected copy. Page markup, direct model-state bridge, and notebook integration remain page-owned. `assets/researcher-lab.js` retains the card in its enhanced shell and suspends the old magnification guide while the complete lesson is active. Run build_science afterward to refresh all shared researcher-script content hashes.

No unpublished guided prototype is linked, published, or used as the primary engine. Other stations retain their existing guides. The old microscope magnification guide retains its prior initial behavior outside the complete lesson; it is not a second active progress counter during the new lesson.

## Gates and recovery

1. Explicitly start a new lesson with letter e, 4× objective and known initial focus. Begin observation and obtain clarity ≥80 with an actual e/cross reference visible. Autofocus is permitted, but the lesson and stored evidence disclose assistance; no claim of manual-focus mastery.
2. Observe separate horizontal and vertical movements. Use direct before/after model snapshots with clear visible shared reference, same sample and low objective. Each dominant movement must span at least 54 slide coordinates (one direction-key step). Small perpendicular drag jitter is tolerated; true diagonals do not count as both axes. Center/Home/reset/preset movements and tiny net-zero wiggles do not count. Blurring, loss of reference or changing sample invalidates pending direction evidence synchronously, before canvas RAF. Answer that image motion is opposite slide motion.
3. Explicitly prepare onion comparison, begin and focus at 4×, center X=Y=0 and record valid low evidence. Failed/out-of-view observations remain recordable but cannot certify the gate.
4. Learner selects 40×. High evidence must retain same sample, position, light and coarse focus; fine focus may differ. If high focus is unreachable, return to low, refocus and save a replacement low record. Previous records and completed direction work remain; changing sample before pair completion requires a new low baseline.
5. Compare actual retained distinct low/high rows from this session and lesson. Cards show notebook row numbers, objective/total magnification, field of view, clarity and assistance. Current live control edits cannot rewrite a committed historical pair. Missing/evicted/cleared rows before answering invalidate the pending pair. Answer that high-power image is larger and field of view smaller.
6. Completion means this bounded lesson only, not full real-instrument skill or verified cellular identification. Optional cell comparison remains an extension. Clearing evidence after completion retains the learned result with an explicit unavailable-record notice.

Task cards or the exit action leave complete teaching and retain notebook rows; re-entry explicitly starts from step one. Reload also starts a new lesson/session. Storage durability is described by the existing storage notice, not promised unconditionally.

## Notebook compatibility and storage

The existing seven display-string fields remain unchanged. New rows also carry a v1 `observation` immutable value snapshot: record/session/lesson/sample identity, specimen, objective/total/fov, clarity, started/inView/reference mask, position, coarse/fine/light and assistance. Legacy rows and malformed optional metadata stay readable but cannot certify this lesson. Only strict finite numeric, valid schema/session/lesson/sample snapshots count. Pair identities must remain in the capped 12-row in-memory notebook.

PR174 failed-read write blocking and truthful quota/security warnings remain unchanged. Memory-only rows can support the current lesson while the warning explicitly states they are not durably saved. No credentials, requests, new storage key or analytics payload is added.

## Accessibility and validation

One primary coach, semantic-key render deduplication, no passive drag focus stealing, explicit-action focus to the new heading, keyboard and button movement support, ≥44px lesson actions, responsive evidence cards and print-hidden teaching UI. No per-pointermove aria-live rebuild when semantic progress is unchanged.

Tests:
- `node scripts/test_microscope_learning.cjs`: new full-flow, evidence/misstep/recovery, storage compatibility and focus tests.
- Existing `test_microscope_tasks.cjs` remains intact (25 cases).
- `test_legacy_record_storage.cjs` retains all failure behaviors; new-row exact schema allows and checks the microscope-only snapshot.
- `check_researcher_operations.cjs`: complete lesson is appended after all old notebook/challenge checks at the existing 390/1280 widths, with real UI keyboard actions, wrong-answer checks, changed-light recovery, snapshot pairing, screenshots, exit and cleanup. No direct model mutation.
- JSDOM tests do not establish real layout, touch behavior, screen-reader output, Safari or Firefox. Actual browser CI must pass before release.
