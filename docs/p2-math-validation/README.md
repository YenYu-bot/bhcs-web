# P2 math-tests｜測試基準與原因分類

**PR #22 只放測試和分類，沒有修改出題程式，也沒有部署。**

使用者已做第二次規格校正：`gen()` 的 null 是 safeQuestion() 用來拒絕候選的正常訊號；只有 50 次重試耗盡、verify 失敗或例外才阻擋。

- [先看完整分類表：每類全部 topic／unit、原因及題面影響](CLASSIFICATION.md)
- [原 431 組逐組對照 CSV](classification-431.csv)
- [修訂後 2.4 原文及本輪範圍](specification-20260922.md)
- [逐根因修正 PR 與 P1 之後的 UX 待辦](BACKLOG.md)
- [新測試摘要](revised-summary.json)
- [safeQuestion 真正待修基準與效率警示](SAFEQUESTION-BASELINE.md)
- [verify 相關 6 個 unit，各 3 題獨立核算](VERIFY-SAMPLES.md)
- [舊版完整基準回報及 10 題人工核對](BASELINE-20260921.md)

| 原 431 組分類 | 組數 |
|---|---:|
| ①舊 200 題去重假失敗 | 272 |
| ②verify 不過 | 16 |
| ③gen／safeQuestion 回傳 null | 124 |
| ④例外 | 19 |

①中 263 組通過，另 9 組是已確認的固定題庫；尚未宣告 bankSize 的問題保留為紅燈。③的 124 組有 115 組因正確承認 null 拒絕而通過，9 組確實填不滿單卷。

全部 52 topic × unit × 難度 × mode 共 1,740 組，執行 348,000 次 safeQuestion 抽樣：**1,687 通過、53 失敗**。53 組為例外 19、verify 16、固定小題庫 9、其他單卷耗盡 9；新增失敗 0。另有 12 個 unit 的 null 拒絕率超過 50%，只列效率警示，不阻擋合併。

## 指令與範圍

```sh
npm ci --prefix scripts
npm run test:math --prefix scripts   # 本基準 exit 1，不把已知失敗排除
node scripts/classify_math_drills.mjs
git diff --exit-code -- docs/p2-math-validation
node scripts/check_math_brand.cjs
```

- test_math_drills.mjs 讀取目前總覽的全部 52 topic，以原始 script 的 __BHCS_TEST__ 執行；每組恰好 200 次 safeQuestion，再獨立模擬一卷。
- 卷內上限從實際 JSDOM 生成的 input.max 讀取（本版皆為 40），不硬塞成 8、10 或測試方便的題數。JSDOM 的 matchMedia 僅補瀏覽器介面，沒有改出題函式。
- 正式 unit 有宣告 bankSize 時，檢查 200 次抽樣相異 sig 數等於 bankSize，單卷要求 min(UI max, bankSize)。目前正式程式沒有任何 bankSize 宣告，不能宣稱已完成正式題庫的全題覆蓋。
- math_test_harness.mjs 用有限 8 題、未宣告、覆蓋不足、100% null、75% null、例外及 verify false 的人工案例檢查門檻；75% null 但每次均在 50 次內取得題目的案例必須通過並只產生效率警示。
- CI 數學測試失敗仍上傳完整結果；分類步驟會重建報告並檢查與提交相同。原 P1 的網站逐字保護檢查保留。
- 本輪未做題面修改，未做修正版真實畫面或列印驗收。上一階段 10 題人工核對保留於歷史回報，本輪另算兩題空間幾何，詳見分類表。

GitHub 最新提交、CI 實跑結果和 artifact 連結記錄在 [PR #22](https://github.com/YenYu-bot/bhcs-web/pull/22)。正式站維持 P1；後續修正依使用者要求另開 PR，一個根本原因一個 PR。
