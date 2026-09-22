# P2 math-tests｜測試基準與原因分類

**PR #22 保持草稿；本輪只放測試和分類，沒有修改出題程式，也沒有部署。**

使用者已更正：**「200 題全部不重複」是原交接包 2.4 的規格誤寫。** 引擎 2.2 原本就是「同一份卷內不重複」，8 題的小題庫合理，不是缺陷。

- [先看完整分類表：每類全部 topic／unit、原因及題面影響](CLASSIFICATION.md)
- [原 431 組逐組對照 CSV](classification-431.csv)
- [修訂後 2.4 原文及本輪範圍](specification-20260922.md)
- [逐根因修正 PR 與 P1 之後的 UX 待辦](BACKLOG.md)
- [新測試摘要](revised-summary.json)
- [舊版完整基準回報及 10 題人工核對](BASELINE-20260921.md)

| 原 431 組分類 | 組數 |
|---|---:|
| ①舊 200 題去重假失敗 | 272 |
| ②verify 不過 | 16 |
| ③gen／safeQuestion 回傳 null | 124 |
| ④例外 | 19 |

①中 263 組在新條款下直接通過，另 9 組是已確認的固定題庫；尚未宣告 bankSize 的問題保留為紅燈，沒有 skip。②包含真正錯誤候選、退化幾何、驗證數值問題，不能全部說成答案算錯。

全部 52 topic × unit × 難度 × mode 共 1,740 組，已直接呼叫 gen 348,000 次：**1,148 通過、592 失敗**。新失敗數增加，是因新條款直接驗 gen，不再讓 safeQuestion 把 null／例外吞掉；網站出題程式沒有變。

## 指令與範圍

```sh
npm ci --prefix scripts
npm run test:math --prefix scripts   # 本基準 exit 1，不把已知失敗排除
node scripts/classify_math_drills.mjs
git diff --exit-code -- docs/p2-math-validation
node scripts/check_math_brand.cjs
```

- test_math_drills.mjs 讀取目前總覽的全部 52 topic，以原始 script 的 __BHCS_TEST__ 執行；每組恰好 200 次直接 gen，再獨立模擬一卷。
- 卷內上限從實際 JSDOM 生成的 input.max 讀取（本版皆為 40），不硬塞成 8、10 或測試方便的題數。JSDOM 的 matchMedia 僅補瀏覽器介面，沒有改出題函式。
- 正式 unit 有宣告 bankSize 時，檢查 200 次抽樣相異 sig 數等於 bankSize，單卷要求 min(UI max, bankSize)。目前正式程式沒有任何 bankSize 宣告，不能宣稱已完成正式題庫的全題覆蓋。
- math_test_harness.mjs 用有限 8 題、未宣告、覆蓋不足、null、例外及 verify false 的人工測試案例檢查測試門檻本身；這些不是正式題庫的替代資料，也不會替任何單元加上 bankSize。
- CI 數學測試失敗仍上傳完整結果；分類步驟會重建報告並檢查與提交相同。原 P1 的網站逐字保護檢查保留。
- 本輪未做題面修改，未做修正版真實畫面或列印驗收。上一階段 10 題人工核對保留於歷史回報，本輪另算兩題空間幾何，詳見分類表。

GitHub 最新提交、CI 實跑結果和 artifact 連結記錄在 [PR #22](https://github.com/YenYu-bot/bhcs-web/pull/22)。正式站維持 P1；後續修正依使用者要求另開 PR，一個根本原因一個 PR。
