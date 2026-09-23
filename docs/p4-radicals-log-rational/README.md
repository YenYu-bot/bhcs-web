# P4-5　g10 `radicals`／`logarithms`／`rationalexp` 只換數字的單元補強（2026-09-23，Claude）

累積包 r4：`tools/math/g10-drills.html` 含 absolute、inequalities、linecircle、quadratic 與本次三個 topic 的改動；取代 r3。本次只動審計表列為「結構數 1–2」的單元，其餘 unit 原樣。

## 新增了什麼

| topic / unit | 基礎（原有） | 進階新增 | 挑戰新增 |
|---|---|---|---|
| radicals／根式化簡 | 化簡 √n；帶係數 | 同類方根加減（√486＋√150） | 分數的根式；兩根式相乘再化簡 |
| radicals／分母有理化 | 單一根式 k/√m；1/(√m＋√n) | 分母為差；分子有係數 | (√m＋√n)/(√m−√n) 型，答案約到最簡 |
| radicals／整數與小數部分 | 整數部分、小數部分 | c＋√n 的整數部分 | b(b＋2a)；c−√n 的整數部分（負數） |
| radicals／根式裂項相消 | 從 √2＋1 開始 | 分子帶係數 | 從中間項開始；間隔為 2（1/(√(k＋2)＋√k)） |
| logarithms／對數定義 | log_b(bᵉ) | 真數為分數（負指數）；真數為根號（分數答案） | 已知 log_b x 求 x；已知 log_x N 求底數 |
| logarithms／對數差與倍數 | logA−logB＝k 求 A/B | logA＋logB 求 AB；已知 B 求 A | logA−n·logB 求 A/Bⁿ |
| logarithms／首數與位數 | bᵉ 的位數 | (1/b)ᵉ 小數點後第幾位出現非 0 | bᵉ 的首位數字（尾數判斷） |
| logarithms／指數模型 | t 期後的量 | 反求期數（半衰到 ≤ 目標；成長到恰為目標）；反求倍率 | 同左，比例更高 |
| rationalexp／裂項相消 | 1/(k(k＋1)) 從 1 開始 | 分子帶係數 | 從中間項開始；間隔為 2（1/(k(k＋2))） |

## 正確性

裂項與級數類的 `verify()` 一律逐項加總（有理數精確或浮點 `A.near`）與宣稱的封閉式比對；首位數字用 BigInt 算出真值再與 log 尾數法比對；位數與零的位置同樣以 BigInt 字串長度為準；分母有理化用浮點數值比對兩邊。開發中抓到並修正：(√m＋√n)/(√m−√n) 的結果原本沒約分（(8＋4√3)/4），現在約到最簡（2＋√3）。

log 的近似值表（log2≈0.3010 等）放在單元說明列，不放進題面：引擎的 `contentGuard` 限制題面小數至多兩位，四位小數會讓整個單元出不了題。

## 本機驗證

三個 topic × 三難度 × 200 次全部 PASS（其他四個 topic 順帶回歸 PASS）。結構數：

| unit | 基礎 | 進階 | 挑戰 |
|---|---|---|---|
| radicals／根式化簡 | 2 | 4 | 4 |
| radicals／分母有理化 | 2 | 2 | 3 |
| radicals／整數與小數部分 | 2 | 3 | 3 |
| radicals／根式裂項相消 | 1 | 1 | 2 |
| logarithms／對數定義 | 1 | 3 | 5 |
| logarithms／對數差與倍數 | 2 | 4 | 3 |
| logarithms／首數與位數 | 2 | 2 | 3 |
| logarithms／指數模型 | 2 | 5 | 5 |
| rationalexp／裂項相消求和 | 1 | 1 | 1 |

真瀏覽器三難度 × 學用／教用各一份，無溢出、無 JS error；截圖見各資料夾。

## 沒驗證到的

jsdom 版 `npm test`、ChatGPT 的 P3 正規化數字。`amgm/means` 未動（已核准豁免）。