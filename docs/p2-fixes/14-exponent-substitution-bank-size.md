# P2 修正 14：條件代換的有效題庫容量

`exponent/substitution` 的基礎與進階整數模式，經既有全域分母／數值上限過濾後，共有 19 個可接受 sig（9 個 `sum` 題與 10 個合法 `value` 題）；40 題卷必然因去重抽乾。新增 `bankSize(ctx)`：基礎與進階回傳 19，挑戰因另有 `symbol` 結構且有效 sig 超過 40，回傳 `null`。

這是卷內去重抽乾，不是 `gen()` 無法產題；因此不改生成範圍、不放寬全域內容上限，也不改任何題面或答案。`node scripts/math-regressions/exponent-substitution-bank-size.mjs` 每難度直接生成 20,000 題，套用正式 contentGuard 後核對 19／19／大於40 的有效 sig 數。

五題前後逐字樣本見 `docs/p2-math-validation/SAMPLES-EXPONENT-SUBSTITUTION-BANK.md`。
