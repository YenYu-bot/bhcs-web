# 後續工作｜本輪不實作

先審閱 CLASSIFICATION.md 的分類表，再逐根因安排獨立修正 PR。每個 PR 保留原教材數字範圍與題型；不為通過測試調整難度、重寫題幹或放寬驗證。

| 待辦根因 | 影響 topic / unit | 原則 |
|---|---|---|
| 有限題庫容量宣告 | 已證明的 multiplication/cubefactor、chain；commonlog/definition 分數，以及其他經來源核實的有限 unit | 正式程式宣告 bankSize；不得把一次抽樣相異數直接當真實容量。單獨 PR，P2 不改正式 HTML |
| 有限題庫抽樣未完成 | commonlog/definition 進階曾在 30 題池只抽到 29 題 | 保留 50 次上限，檢查有限池取題策略；不能加大範圍或偽造 sig |
| 缺少函式 localAt | g10 cubic/global | 實作原題型所需局部特徵計算，保留條件與數字範圍 |
| 初始化前引用 b | g11 righttrig/comparison | 修變數引用，保留比較題型 |
| const 重新賦值 | g11 doublehalf/fromsin、half | 修象限符號處理，保留原數值與題型 |
| 有理數建構例外 | g10 exponent/fractional、laws、algebra；g11 expfunctions/equation | 先拆清負指數與安全整數範圍各根因，再各開 PR；不得改難度避開 |
| 垂直向量構造錯誤 | g11 spaceinner/pointdistance、line3d/pointprojection | 同一根因可同 PR；加入獨立投影／距離驗證 |
| 退化立體候選 | g11 spacecross/height | 修生成器保證題目條件，不移除 vol>0 驗證 |
| SSA 臨界值驗證 | g11 sincosarea/ambiguous | 使用精確或穩定的驗證方法，不直接放寬容差 |
| 反函數浮點消去誤差 | g11 loggraphs/inverse | 改獨立驗證方法，保留原題目 |
| 統計數值範圍與 verify 上限衝突 | g11 standarddev/deviationsum | 先確認既有條件來源，不逕自提高 10,000 上限 |
| gen 回傳 null／內容篩選衝突 | CLASSIFICATION.md 第③類完整清單 | 先按原因再拆 PR，不能把所有 null 當作同一錯誤 |
| 國三圖文邊長對調 | g9-1-4-trig-ratio.html（P1 既有記錄，不屬於 52-topic 統計） | 獨立 PR 校正題幹、圖示與角的對應，再做真實畫面及列印驗收 |

## P1 之後：有限題庫題數上限 UX（本輪不修）

- 前置：相關 unit 的 bankSize 已經宣告且核實。
- 現況：老師在 8 題題庫要求 10 題，會只收到較少題目，console 才有警告。
- 目標：介面該 unit 的題數上限鎖在 bankSize（仍受既有整體上限限制）；輸入、快速預設及難度／數型切換都需一致。
- 題目數不足的資訊要讓老師在介面看見，不能只寫 console。
- 另開 UX PR，做手機／桌機真實操作與列印驗收；本輪不調整 input.max、不改快速預設或提示文字。
