# P2 修正 12：乘法公式固定題庫宣告

`multiplication/cubefactor` 的實際有限題庫是 `a∈{1,2} × b∈{1,2} × 正負號兩種`，共 8 題；新增 `bankSize=8`。

`multiplication/chain` 在基礎與進階是 `a,b∈{1,2,3}`，共 9 題；挑戰再多一個固定的長連鎖結構，共 10 題；新增依難度回傳 9／10 的 `bankSize`。

只新增題庫容量宣告，兩個 `gen()`、題面、答案、數值範圍與 UI 上限均不改。當使用者要求超過容量時，測試與引擎以 `min(UI 上限, bankSize)` 作為可產生的題數，不再把正常的去重抽乾判為失敗。

`node scripts/math-regressions/multiplication-bank-sizes.mjs` 每個單元／難度直接生成 5,000 題，驗證所有題目通過且 distinct sig 恰為 8、9、9、10。五題前後逐字樣本見 `docs/p2-math-validation/SAMPLES-MULTIPLICATION-BANKS.md`。
