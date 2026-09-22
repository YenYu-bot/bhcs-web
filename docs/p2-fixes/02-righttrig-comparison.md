# P2 修正 02：三角比比較題

根因：`righttrig/comparison` 篩選交叉比較角度時，在 `b` 初始化前引用 `b`。改為使用 `filter` 的候選值 `x`，排除 `a+x=90°` 的等值情形；保留原 5°～85° 角度池、三種題型、難度與輸出模板。

`node scripts/math-regressions/righttrig-comparison.mjs`：三難度各 200 次，600/600 無空值、無例外、`verify()` 全過；從實際題面讀取函數及角度另算大小，涵蓋 `same`／`cross`／`self`，交叉題無互餘等值。

## 修正前後固定種子樣本

前四列是正常候選，題面與答案逐字相同；第五列重現唯一行為差異：修正前在交叉題初始化時例外，修正後使用原角度池與原模板完成該候選。

| 呼叫／難度 | 修正前題面 → 答案 | 修正後題面 → 答案 | 比對 |
|---|---|---|---|
| 1 / basic | 在□中填入 ＞ 或 ＜：cos60° □ cos5°。 → ＜ | 在□中填入 ＞ 或 ＜：cos60° □ cos5°。 → ＜ | 逐字相同 |
| 2 / advanced | 在□中填入 ＞ 或 ＜：sin50° □ cos50°。 → ＞ | 在□中填入 ＞ 或 ＜：sin50° □ cos50°。 → ＞ | 逐字相同 |
| 3 / challenge | 在□中填入 ＞ 或 ＜：cos55° □ cos75°。 → ＞ | 在□中填入 ＞ 或 ＜：cos55° □ cos75°。 → ＞ | 逐字相同 |
| 4 / basic | 在□中填入 ＞ 或 ＜：tan30° □ tan60°。 → ＜ | 在□中填入 ＞ 或 ＜：tan30° □ tan60°。 → ＜ | 逐字相同 |
| 8 / advanced | `ReferenceError: Cannot access 'b' before initialization`（未產題） | 在□中填入 ＞ 或 ＜：sin50° □ cos45°。 → ＞ | 原候選成功產出 |

未修改 UI 或列印樣式。
