# M1　`g6-drills.html?topic=units` 單位換算（2026-09-23，Claude 重做）

取代 Gemini 的版本。基底：main after PR #41。改動只有 `tools/math/g6-drills.html`：`TOPICS` 加 `["units","單位換算"]`、`CONFIGS` 加 `units:unitsConfig`、新增 `unitsConfig()`；其餘引擎程式未動。

## 單元與難度

| unit | 基礎 | 進階 | 挑戰 |
|---|---|---|---|
| 長度 mm／cm／m／km | 相鄰單位、整數 | 跨兩級；小數 1–3 位；分數（½、¾ km→m） | 跨三級（km→cm、km→mm）、小數 |
| 重量 g／kg／公噸 | 相鄰、整數 | 跨兩級、小數 | 同進階、數字更大 |
| 容量 mL／L／公秉 | 同上 | 同上 | 同上 |
| 面積 cm²／m²／公畝／公頃／km² | 相鄰（10000、100 進率） | 跨兩級（公頃→m²＝10000） | 跨三級（km²→公畝、m²→cm² 配小數） |
| 體積與容積 cm³＝mL／L／m³＝公秉 | 相鄰 | 跨兩級（m³→L、L→cm³） | 含 m³→cm³（1000000） |
| 複名數化聚 | 兩段相鄰單位（5 kg 6 g＝5006 g；2005 mL＝2 L 5 mL） | 兩段、較大數 | 三段（公秉 L mL、km m cm） |
| 換算後比大小 | 兩個量填 ＞＜＝ | 三個量由小到大排列（可含相等） | 加入面積與體積 |

分數只出「大→小」方向，分母限 2、4、5、10 且要整除進率，答案一定是整數；小數位數不超過進率的位數，換算結果一定是整數。所有換算結果 ≤ 1,000,000。複名數的每一段都保證小於進率（不會出現 12 m 130 cm），並刻意出現要補 0 的情況（4 m 5 cm）。比大小至少含兩種不同單位。

## 正確性

量以 `R` 表示；換算＝乘以 `R(fromF, toF)`。`verify()` 把答案**換回原單位**再與題目比對（`convert(v,small,big)＝q` 且 `q×ratio＝v`），複名數用「逐段乘進率相加」重算並檢查每段小於進率，排序題逐項換成基準單位確認遞增。

## 本機驗證

7 unit × 3 難度 × 200 次 `safeQuestion`：4,200／4,200，`verify()` false 0，例外 0（`math_local_check.mjs` PASS）。結構數：基礎 4–33、進階 6–82、挑戰 6–96（比大小因單位組合多，結構數天然高）。真瀏覽器三難度 × 學用／教用各 14 題，驗證完成、無溢出、無 JS error，截圖見本資料夾；教用版抽核 8 題手算相符。

## ChatGPT 套用時要做的（它的檔案）

1. `tools/math/index.html` 國小高年級區加卡片：`g6-drills.html?topic=units`「單位換算」。
2. `scripts/test_math_drills.mjs` 的 topic 數斷言 52 → 53；`check_science_integration.cjs` 的數學連結數 88 → 89；`ziyuan.html` 的數學連結區依原本方式同步。
3. 跑 `test_math_drills`、P3 報表；新 topic 適用完整門檻，無豁免。

## 沒驗證到的

jsdom 版 `npm test`、列印實體輸出。

## r2（2026-09-23）
依 ChatGPT 預檢：重量、容量、體積基礎級整數題 40 題卷內耗盡（36 種簽章）。基礎級整數範圍 1–9 → 1–48。逐數型 40 題卷去重全部 PASS。
