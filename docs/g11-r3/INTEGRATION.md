# G11 r3 integration — 2026-09-26

Base: main `be114bb83f7928479ec25fa6fae9600c59181203`, after PR #50 merged.
The Claude r3 engine script and original README/samples/local-check files match the supplied ZIP. Only the established brand builder transforms the engine's presentation block.

## Passed

- Brand/history check: 108 links, 41 files; worksheet markup and print rules preserved.
- Discovery: 72 topics, zero errors.
- Resource declaration and scanned links: 146.
- P2: 2,367/2,367 combinations, 473,400 safeQuestion samples; failures 0, candidate exceptions 0, candidate verify failures 0. Six paper-exhaustion diagnostics remain in the report.
- Site integration: 99 HTML pages, 1,197 local references, 93 sitemap URLs. Query-only topic links do not add canonical sitemap URLs.
- Researcher batch 5 and full station audit passed.
- The brittle topic-change regression test now uses a fixed two-topic fixture and an isolated Git repository to test unchanged, uncommitted and committed changes. It no longer assumes every future PR has exactly 32 topics and no engine changes.

## Blocking local results

### Enforce P3 diversity ratchet

```json
{"code":"g11_topic_challenge_full_gate_required","topic":"vectorcauchy","level":"challenge","threshold":3,"baseline":2,"current":2,"gapToFull":1,"modified":true,"newTopic":false}
```

One failure; topic structure failures: 0. The source extractor includes trailing UNIT_POLICIES and shared helpers in the old final config function's source range. In r3, newly appended config functions change that range. The vectorCauchyConfig function body itself matches; no ratchet rule or engine fix was applied here.

The active baseline is `g11-r3`: standarddev=5, correlation=7, matrixapps=5. New topics both have `newTopic:true`, `required:3`: planevector current=9, determinant current=5.

### Math regression suite

The suite stopped at `scripts/math-regressions/standarddev-deviationsum-cap.mjs:12:9`:

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

9 !== 3321

actual: 9
expected: 3321
operator: 'strictEqual'
```

No change was made to this test or the Claude question code. Later tests in the suite were not executed after this failure.

## Handoff

Draft PR is blocked by the results above. PR creation triggers both pull_request workflows; CI is not queried in this round. G11 P4 remains deferred until r3 is merged.
