# P2 修正 07：SSA 臨界值驗證

`sincosarea/ambiguous` 的題面、答案與 `gen()` 完全不動，只改 `verify()`。原驗證先以浮點 `sinB` 經 `asin` 還原角度；在 `A=30°、b=2a` 的臨界情況，`sin(30°)` 的二進位近似會讓互補的兩個角相差約 0.0000017°，錯把唯一的 90° 解當成兩解。

新驗證以題庫本來就有的特殊角精確值比較 `a²`、`b²sin²A` 與 `b²`，並用精確的 `sin²B` 驗證列出的角。這裡刻意不採 `1e-6` 或其他放寬容差：特殊角和根式邊長都可表示成有理數平方，直接精確比較能同時避免假陰性與容差過寬造成的假陽性。唯一仍使用 `1e-9` 的地方是獨立回歸測試用浮點正弦定理核對印出的角；它不是正式 `verify()` 的接受門檻。

`node scripts/math-regressions/ssa-boundary.mjs`：三難度共 600 次全過，涵蓋 0、1、2 個三角形及 `A=30°、b=2a` 臨界情況。回歸另從實際題面以高度分類並用正弦定理獨立驗算每個角。

完整 P2 基準由 `node scripts/test_math_drills.mjs` 與 `node scripts/classify_math_drills.mjs` 產生；修正前後五題逐字比對另見 `docs/p2-math-validation/SAMPLES-SSA-BOUNDARY.md`。
