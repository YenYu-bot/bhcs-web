# P2 修正 15：和差角固定題庫與三角形分母上限

`anglesum/known` 的原始 24 種排列中，有 2 種相減題答案分母為 169，會被既有全域分母上限 100 排除，因此有效題庫精確為 22；新增 `bankSize=22`，不改 `gen()`。

`anglesum/triangle` 的生成範圍本來可產生 32 組分母不超過 100 的畢氏三元組，但題面 guard 誤套一般分數的分母 12 上限，只留下 2 組。此單元改採既有全域分母上限 100，並宣告 `bankSize=32`；`gen()`、`verify()` 與 m／n 範圍均不改。五題新增合法題面及五題 `known` 逐字不變樣本見 `docs/p2-math-validation/SAMPLES-ANGLESUM-BANKS.md`。

測試框架仍對每組執行 200 次獨立 `safeQuestion()`；有限題庫另用獨立種子執行 `bankSize × 200` 次加強覆蓋，必須找到恰好宣告數量，少報（發現更多 sig）或多報（始終找不足）都阻擋。這避免 200 次抽樣偶然漏掉最後一種 coupon，沒有放寬容量正確性。

`node scripts/math-regressions/anglesum-bank-size.mjs` 另以公式完整枚舉 22／32 種，再用正式 `contentGuard` 取樣 100,000 次比對完整 sig 集合。
