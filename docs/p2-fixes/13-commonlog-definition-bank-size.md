# P2 修正 13：常用對數定義題的分數題庫宣告

`commonlog/definition` 的分數模式由五種底數與六種指數 `−1..4` 組成，固定 30 題；新增 mode-aware `bankSize`，分數回傳 30，整數回傳 `null`（不套用有限題庫上限）。整數模式有 45 種 sig 且 UI 只需 40 題，不能錯標成 30。

測試框架同步允許 `bankSize(ctx)` 對不適用的組合回傳 `null`；這只影響是否套用宣告，不改 200 次 `safeQuestion()`、50 次重試、verify 或去重規則。另新增框架契約測試，確認 `null` 組合仍以 UI 上限 40 測試。

已宣告題庫若在卷末因 50 次隨機重試仍未抽到最後一個未使用 sig，記為效率警示而非題庫錯誤；宣告值仍須由 200 次獨立抽樣的 `bank_coverage` 完整覆蓋，錯報容量仍會阻擋。本單元 30 種已完整覆蓋；固定種子在第 30 題抽不到最後一種的事件理論機率約 `(29/30)^50=18.4%`，不能以修改題型或範圍來掩蓋。

`node scripts/math-regressions/commonlog-definition-bank-size.mjs` 對三難度的分數模式各生成 5,000 題，distinct sig 都精確為 30，並確認整數模式不套用該宣告。`gen()`、題面、答案與範圍完全不改；五題逐字樣本見 `docs/p2-math-validation/SAMPLES-COMMONLOG-DEFINITION-BANK.md`。
