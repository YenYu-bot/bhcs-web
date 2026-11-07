# Round-3 fix brief (read FIRST)

You are fixing question generators of a cram school's printable math worksheet site (Taiwan curriculum, Traditional Chinese, Taiwanese terminology). Repo /home/claude/bhcs-web, branch feat/math-phase2 (checked out). Phase 2 rounds 1–2 are committed; an independent check found the items in your findings file. Fix EVERY item there, plus any CI-gate unit in /home/claude/notes/round3/ci-gate.md that belongs to your files.

Rules (also read /home/claude/notes/tools/common.md, phase2.md, p2fix.md — where they mention /home/claude/yenyu-bot/bhcs-web read /home/claude/bhcs-web; scratchpad = /home/claude/tools; ignore their branch name):
- Edit ONLY your assigned tools/math/<file>.html files (and, only if a test there must follow an intended change, scripts/math-regressions/*.mjs tests that load your file — say so in your report). Edit tool only. Other agents are editing other files in the same working tree at the same time: no git add/commit/stash/checkout/reset, don't touch docs/, sitemap.xml, other scripts.
- g11 only: change code only inside the config function bodies (function xxxConfig(){...}); never edit an original `const <id>=unit(...)` declaration line that a p4 regression test pins (tests g11-p4-a/b/c compare them byte-for-byte) — wrap/override `<unit>.gen` instead, as the file already does.
- Ladder: basic < advanced < challenge in KIND or steps; use explicit per-level kind lists; no level may repeat an item of another level (make number ranges / kinds disjoint where kinds are shared). Don't make basic harder than the grade allows.
- Numbers: build answers first; fraction denominators ≤ 12 (≤ 20 at challenge); ≤ 2 decimal places unless the unit is about decimals; no ugly radicals.
- Modes: if fraction/decimal mode yields integer-only questions, make the mode change the numbers or restrict that unit's modes (the file's own mechanism; for g11 inside configs).
- Keep `verify` meaningful (independent recomputation), keep sig unique per distinct question, keep units with bankSize exact.
- Each level must keep ≥ 3 distinct question structures in 200 samples (CI gate) and pools big enough for 40-question papers (and 80 for g11 p4 units).

Verification you must run before reporting (all must be clean):
- `cd /home/claude/bhcs-web && node scripts/math_local_check.mjs tools/math/<file>.html <topic> 40` for every topic you touched → no FAIL lines.
- `cd /home/claude/tools && node auditall2.mjs <file-without-.html>` → prints only "audit done".
- `cd /home/claude/tools && node divgate.mjs <file-without-.html>` → no unit of yours below 3 except the ones ci-gate.md says to ignore.
- Regression tests that load your file: `cd /home/claude/bhcs-web && for f in scripts/math-regressions/*.mjs; do grep -q "'<grade>'\|<grade>-drills" $f && node $f; done` (helper.mjs excluded; bank-size-ui-cap.mjs needs real jsdom — skip it). g11-p4-b takes ~6 min; run it last.
- Helpers: `node /home/claude/tools/pool.mjs <g8> <topic> <unit|all>` (distinct sigs per level/mode); `node /home/claude/tools/sample.mjs <g8> <topic> <unit> <level> <mode> <N> [sigRegex]` (prints Q/A).
- Recompute answers of every kind you add or change (Python fractions for anything non-trivial).

Report (English, ≤ 60 lines): per item done / skipped (why) with one sample per level for ladder changes; tests you updated and why; verification results; anything you noticed but left.
