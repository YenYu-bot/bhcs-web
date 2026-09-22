# sincosarea / ambiguous：修正前後五題

固定種子直接呼叫同一個 `gen()`；修正前後的題面、答案與 `sig` 均逐字相同。唯一差異是 `verify()` 由 `false` 變成 `true`。

| 難度／種子 | 修正前後題面（逐字相同） | 修正前後答案（逐字相同） | verify 前 → 後 |
|---|---|---|---|
| basic / 8 | △ABC 中，∠A＝30°、a＝15、b＝30。判斷可形成幾個三角形，並列出可能的 ∠B。 | 可形成 1 個；∠B＝90° | false → true |
| basic / 9 | △ABC 中，∠A＝30°、a＝50、b＝100。判斷可形成幾個三角形，並列出可能的 ∠B。 | 可形成 1 個；∠B＝90° | false → true |
| basic / 10 | △ABC 中，∠A＝30°、a＝34、b＝68。判斷可形成幾個三角形，並列出可能的 ∠B。 | 可形成 1 個；∠B＝90° | false → true |
| basic / 11 | △ABC 中，∠A＝30°、a＝18、b＝36。判斷可形成幾個三角形，並列出可能的 ∠B。 | 可形成 1 個；∠B＝90° | false → true |
| basic / 19 | △ABC 中，∠A＝30°、a＝42、b＝84。判斷可形成幾個三角形，並列出可能的 ∠B。 | 可形成 1 個；∠B＝90° | false → true |

比對條件包含 `expr === expr`、`answer === answer`；PR 只替換 `verify()` 內部。正式驗證不使用浮點容差，而是比較特殊角的精確 `sin²` 有理數值，理由見 `docs/p2-fixes/07-ssa-boundary.md`。
