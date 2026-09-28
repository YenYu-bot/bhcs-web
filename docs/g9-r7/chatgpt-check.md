# G9 r7 integration acceptance

Base: `2ec9581812675e13e88feb081e54a3b7b7a207a3`.
Input: `claude-g9-r7.zip`.

- The engine is byte-identical to the uploaded r7 HTML after branding. Removing only the new TOPICS entry, quadfuncConfig function and CONFIGS entry restores main r6 exactly.
- A-class migration: the original quadratic-function page remains available; its header points to `g9-drills.html?topic=quadfunc` with `color:inherit`. Both published entry cards now point to that topic. The math index keeps it under 國三下.
- P1 explicitly checks the retained page against the original baseline after removing the approved header link. Browser comparison and snapshots include the retained page with `#questions-container` as the worksheet scope. Integration approval consumes the same legacy file list.
- Builders and static guards passed: science, site, math branding, P1 markup/print-rule preservation, integration (101 HTML pages, 1233 local references, 95 sitemap URLs).
- Counts: 148 resource links, 110 math cards, 97 engine topics, including 8 G9 topics.
- `math_local_check.mjs tools/math/g9-drills.html quadfunc 200`: 30/30 combinations, 6000 accepted questions, candidate verify failures 0, exceptions 0, exhausted 0, within-paper duplicate signatures 0.
- DOM stress: each difficulty × integer/fraction/both × five repetitions × five units; 225 single-unit 40-question papers and 225 adjacent-two-unit 80-question papers (27000 questions). All full, no repeated question text within a paper, no JSDOM errors. This is generation testing, not browser layout acceptance.
- Local browser acceptance could not run: Playwright's Chromium executable is absent. PR CI is responsible for browser and print-layout acceptance; no local browser pass is claimed.
- Manual text review: the advanced difficulty note lists 頂點反求 b、c, but that vertex form is only selected at challenge level (form 4). The source package is preserved; this nonblocking wording discrepancy is recorded for Claude's next revision.

- Full P2: 97 topics, 3879/3879 combinations, 775800/775800 sampled questions; candidate verify failures 0, candidate exceptions 0, paper exhausted 0. Classification regenerated from the actual report; efficiency warnings retain the existing nonblocking policy.
- Full P3: 807 units, 484200/484200 samples, exhausted 0. Formal ratchet: topicFailures 0, failures 0. All five new quadfunc units pass their full structure and challenge gates without exemptions.

| Unit | Basic structures | Advanced structures | Challenge structures |
|---|---:|---:|---:|
| vertex | 73 | 76 | 64 |
| xaxis | 84 | 85 | 90 |
| extreme | 73 | 76 | 75 |
| findfn | 37 | 44 | 37 |
| shift | 77 | 87 | 122 |

- All 22 executable files in `scripts/math-regressions/*.mjs` passed (excluding helper.mjs). G11 P4-A/B/C ran with full default seeds; no quick mode.
- All four builders were rerun and produced no file differences.
- Reproduce the new-topic DOM stress from the repository root with `node docs/g9-r7/stress-check.cjs`.
