# G9 r8 integration acceptance

Base: `1e799eca0ef48dc79415e8ac4c189f956a85c2f5` (merged PR #76).
Input: `claude-g9-r8.zip`.

- PR #76 head `95829e07519f5731ca8321b36a69249553fb2092` passed Researcher run 36427371832 and Math regressions run 36427371813 before being marked ready and squash-merged.
- r8 adds `quartile` (four units) and corrects only the three `quadfunc.levels` strings. Removing those changes restores r7 exactly; existing generators are unchanged. The initial integration was byte-identical to the uploaded r8 HTML; the CI fix below adds only a screen palette override.
- A-class migration: both old quartiles cards now point to `g9-drills.html?topic=quartile` (中位數與四分位數); the math index retains the 國三下 grouping. The old page stays available and gains a `color:inherit` header link.
- The quartiles legacy page is explicitly included in P1 browser snapshots with `#questions-container` as its comparison scope. P1 strips only approved header links and verifies original content and print/layout rules; integration inherits the same legacy file list.
- Builders and static guards passed (101 HTML pages, 1234 local references, 95 sitemap URLs). Resource count remains 148; math cards remain 110. There are 98 engine topics, including 9 G9 topics.
- `math_local_check.mjs` precheck: 18/18 combinations at 200 accepted questions each (3600 questions), candidate verify failures 0, exceptions 0, exhausted 0.
- `node docs/g9-r8/stress-check.cjs`: 150 single-unit 40-question papers plus 150 two-unit 80-question papers, 18000 questions, all full, no repeated question text within a paper, no JSDOM errors. The decimal-only selection additionally checks that table/group are skipped with an explicit status message. These are DOM generation checks, not browser layout acceptance.
- This environment has no Chromium executable. Local browser/print acceptance is not claimed; the new PR's Researcher CI must perform it.

- Full P2: 98 topics, 3897/3897 combinations, 779400/779400 sampled questions; candidate verify failures 0, exceptions 0, paper exhausted 0. Classification regenerated from the actual report.
- Full P3: 811 units, 486600/486600 samples, exhausted 0; formal ratchet topicFailures 0, failures 0. All four new units pass the full structure and challenge gates without exemptions.
- All four builders reran without changing any source file.

| Unit | Basic structures | Advanced structures | Challenge structures |
|---|---:|---:|---:|
| median | 88 | 113 | 131 |
| raw | 74 | 91 | 98 |
| table | 15 | 26 | 26 |
| group | 53 | 79 | 93 |

- All 22 executable math regression scripts passed. P4-A/B/C ran with full default seeds; no quick mode.

## PR #77 CI correction (2026-09-28)

- Checked head `a1851307c5a9c1d087204611fcfd036bbe2f642a` once: Math fix regressions run 36430743641 succeeded; Researcher run 36430743545 failed at step 20, Compare P1 math worksheets and print layouts.
- The single P1 failure was `quartile`: dynamically generated TD borders retained `rgb(124, 135, 155)` (`#7C879B`). The static inline-style scan cannot see cells created later by the question generator. Researcher recorded 123 pages checked, 32 printed, one failure; later browser steps were skipped.
- `build_math_brand.mjs` now emits a G9-only `.expr table :is(td,th)` border-color override inside `@media screen`, using the existing `--bhcs-muted` palette. The generated G9 HTML includes the same rule. No guard exemption or workflow change.
- Removing that one CSS rule restores the uploaded r8 HTML byte-for-byte, proving all generator logic and original print styles are unchanged.
- Revalidated P1 static protection and site integration; all four builders are idempotent; quartile 40/80-question stress reran successfully (18000 questions, no exhaustion, duplicate prompts, or JSDOM errors).
- Chromium remains unavailable locally. This correction awaits the newly triggered full CI; no second CI poll in this turn and no merge before green.
