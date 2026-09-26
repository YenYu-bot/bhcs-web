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

## Initial blocking local results (resolved below)

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

## Follow-up fixes and local verification

Only scripts, their locked parser dependency and this report changed in the follow-up; `tools/math/g11-drills.html` is byte-for-byte unchanged from PR head `3236d6787e571cd2ed2776c9d3fa7c68627fdad7`.

- Topic extraction now uses Acorn to pair the body braces and slices from function start through `node.body.end`. Strings, comments, regex literals and nested template expressions cannot move the boundary. It never uses the next function or CONFIGS as the endpoint.
- Inspected `git diff $(git merge-base HEAD origin/main)..HEAD -- tools/math/g11-drills.html` and compared the exactly bounded vectorCauchyConfig sources from both revisions. Base: `be114bb83f7928479ec25fa6fae9600c59181203`. Both sources are 6,524 bytes; diff is empty; SHA-256: `5919f5ebe9549d734d6c4f03bae7353490a80f71b0efa521dfc502fdc166c16b`.
- Actual modified topics: standarddev, correlation, matrixapps, planevector, determinant. vectorcauchy is `modified:false`, current=2, baseline=2, required=2. Its full threshold remains 3 and its P4 gap remains 1.
- deviationsum direction is determined from the question text. Questions containing `Σ（xᵢ−μ）²＝` verify answer² × n = stated sum; other questions verify answer = n × σ². Both directions retain the answer, sum, n and σ caps. Both directions must be sampled, and over-limit rejection remains required.
- Full regression suite: 19/19 scripts passed (exit 0). deviationsum: 6,000 attempts, 5,934 produced, 66 null rejections; 5,426 forward and 508 reverse questions verified.
- Re-ran `node scripts/enforce_math_diversity.mjs` against the unchanged r3 engine's existing 200-sample seeded diversity report: failures=0, topicFailures=0, projectedTopicGateFailures=0, G11 topics=34. No gate threshold was changed.
- r3 baselines: standarddev=5, correlation=7, matrixapps=5. New-topic full gates remain required=3: planevector=9, determinant=5, both `newTopic:true`.

## Handoff

Push the fixes to #55 to trigger new CI; do not query CI in this round. Next round, query the new head once. If both workflows are green, mark ready and merge #55, then begin G11 P4. The PR remains a draft until that CI confirmation.
