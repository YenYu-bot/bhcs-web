# Phase 3 (curriculum placement) — generator part

Repo /home/claude/bhcs-web, branch feat/math-phase3 (checked out, based on main after phase 2 merged). Same working rules as /home/claude/notes/round3/brief.md: Edit tool only, only the files named here, no git, no docs/sitemap/other scripts. Another person (the orchestrator) will later edit the page-navigation code (syncTopicMeta / TOPIC_ORDER / <title> / meta description) of g7, g8, g10, g11 — do NOT touch those parts.

Owner's decisions (2026-11-04) to implement:

## A. Out-of-curriculum content → challenge only, labelled 「補充」
For each unit below: append 「（補充）」 to the unit's displayed name (if a name already says 補充/進階 in brackets, normalise to 「（補充）」); remove it from the basic and advanced presets (preset count 0 there) and keep it in the challenge preset only; the topic's `levels.challenge` text should mention it as 補充; if the unit's kinds also appear at basic/advanced through another unit, move those kinds to challenge too. Also prefix question text with nothing extra — the unit name label is enough (except where a question already says （補充） inline: keep only one marker).
- g8 quadsolve: 根與係數 (α＋β、αβ、α²＋β²) — currently inside unit `sol`「判別式・公式解・根與係數」 even at basic. Split: keep 判別式/公式解 in `sol` (all levels), make a separate challenge-only unit 「根與係數（補充）」 OR keep the kinds but only at challenge level and rename the unit — pick the smaller change that leaves basic/advanced with no 根與係數 item.
- g8 factor: `splitTerms` quartic (x²＋bx＋c)(x²＋d), `multivariable` 二元雙十字, `completing` x⁴ 型 — 高一 material: challenge-only and 補充 (the units can keep non-補充 國二 kinds at basic/advanced if they have them; only the 高一 kinds become challenge-only).
- g7 factors: 輾轉相除法 (`euclid`) → 「輾轉相除法（補充）」, challenge-only preset.
- g7 inequality: 絕對值不等式 unit → 「絕對值不等式（補充，高一）」, not in basic/advanced presets.
- g7 simultaneous: reciprocal 1/(x＋y) 分式 substitution (already 「（補充）」 at challenge per a comment ~line 2013) — make sure it never appears at basic/advanced.
- g7 function: 分段函數 and 合成函數 units → 「（補充）」, challenge preset only. (The whole 函數 topic is 國二下 and will be shown on the 國二 page by the orchestrator; inside the topic keep everything else.)
- g11 line3d: 點到直線距離 (`pointdistance`) and 歪斜線距離 (`skewdistance`) are 數甲 → 「（補充）」, challenge only. g11 correlation `variance` (Var(X＋Y) with r) and g11 probability `linearity` (E(X＋Y)) → 「（補充）」, challenge only. g11 rule: change only inside config function bodies; never edit a `const <id>=unit(...)` line pinned by scripts/math-regressions/g11-p4-*.mjs — override `<unit>.name` after the declaration instead.

## B. Elementary pages: default 國小寫法 + 「國中先修」 switch (g6-drills.html)
- Add one page-level checkbox 「國中先修寫法」 (default unchecked) next to the existing mode/mixed-number options; pass it to generators as ctx.prep (true/false). Make it a no-op for topics that don't use it (only show it on topics that do, like the existing mixed-number checkbox pattern).
- With prep off (default): gcd/lcm answers and prime factorisation use 國小 form `48＝2×2×2×2×3`, no 指數 and no `(a，b)`/`[a，b]` notation; circle/prism (and any other) answers use 圓周率 3 or 3.14 as the question states, never π; unknown (解未知數) uses □ or x with × written out (`3 × x＝12`), not `3x`.
- With prep on: the current 國中 forms (指數式, (a，b)/[a，b], π, 3x).
- Check scripts/test_math_drills.mjs + math_local_check behaviour: ctx without prep must default to 國小 form. Keep sig unique per (question, form).

## C. g2-drills.html
- Remove the item 「正方形是不是長方形的一種？」 (shapes topic yesno pool). Verify no other 正方形⊂長方形 inclusion item remains on g2.
- Check that g2 time `units` basic no longer asks 日↔時 or 分÷60 (三年級 content); if it still does, restrict basic to 時↔分 within 1 小時 and 「幾點幾分」, move the rest to challenge.

## Verification (must be clean before reporting)
- `node scripts/math_local_check.mjs tools/math/<file>.html <topic> 40` for every topic touched; `cd /home/claude/tools && node auditall2.mjs <file-stem>`; `node divgate.mjs <file-stem>` (no new units below 3 at any level outside g11; units already listed in /home/claude/notes/round3/ci-gate.md as ignorable may stay); regression tests that load your files (see brief.md command; g11-p4-b ~6 min).
- Spot-sample each changed unit with /home/claude/tools/sample.mjs and show one sample per level in the report.

Report (English, ≤ 50 lines): what changed per item, preset changes, verification results, anything left.
